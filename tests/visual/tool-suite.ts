// The checks every calculator page gets (docs/adding-a-tool.md §7): screenshots at 390 and 1440 in
// light and dark for every Figma mode, axe, 44px touch targets, no sideways scroll, no console
// errors, a share link that restores the inputs, the default result without JavaScript, the
// JSON-LD and the print layout. Screenshots: test-results/<id>/<lang>-<mode>-<theme>-<width>.png
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, THEMES, heightFor, prepare, settle, smallTapTargets } from './helpers'

export interface ToolSuite {
  id: string
  /** Bangla route, e.g. /tools/emi. */
  path: string
  h1: string
  enH1: string
  /** Figma modes as share-link queries ('' = the default frame). */
  modes: Record<string, string>
  /** What a mode must show once hydrated (Figma example values). */
  expectMode: (page: Page, mode: string) => Promise<void>
  /** The default result card number (bn) and on the English page. */
  value: string
  enValue: string
  /** Fill the inputs for the share test, then the query they make and what the restored page shows. */
  share: { fill: (page: Page) => Promise<void>; query: RegExp; restored: (page: Page) => Promise<void> }
  /** JSON-LD types the head must carry. */
  ldTypes: string[]
  /** The page has a schedule (BreakdownTable) that must print in full. */
  schedule?: { rows: number }
  /**
   * Freeze the browser clock at this instant (ISO) for pages whose result depends on "today" (the
   * date tools: Figma's today is 19 Oct 2026). The HTML is built on the build day, so the no-JS
   * result is checked with `noJsValue` instead of `value`.
   */
  clock?: string
  /** The server-rendered result when it differs from the hydrated one (a "today" default). */
  noJsValue?: string | RegExp
}

export const resultValue = (page: Page) => page.locator('[data-result-card] [data-result-value]')

const errorsOf = (page: Page) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  return errors
}

async function openAt(page: Page, path: string, width: number, theme: 'light' | 'dark' = 'light', clock?: string) {
  await page.setViewportSize({ width, height: heightFor(width) })
  if (clock) await page.clock.setFixedTime(new Date(clock))
  await prepare(page, theme)
  await page.goto(path)
  await settle(page)
}

async function noSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, 'page scrolls horizontally').toBeLessThanOrEqual(0)
}

export function toolSuite(s: ToolSuite) {
  const open = (page: Page, path: string, width: number, theme: 'light' | 'dark' = 'light') => openAt(page, path, width, theme, s.clock)
  const shot = (name: string) => join(ROOT, 'test-results', s.id, name)
  const en = `/en${s.path}`

  test.describe(s.id, () => {
    for (const theme of THEMES) {
      for (const [mode, query] of Object.entries(s.modes)) {
        for (const width of [390, 1440]) {
          test(`${mode} ${theme} ${width}`, async ({ page }) => {
            const errors = errorsOf(page)
            await open(page, s.path + query, width, theme)
            await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
            await s.expectMode(page, mode)
            const inputs = await page.locator('[data-calculator-inputs]').boundingBox()
            const results = await page.locator('[data-calculator-results]').boundingBox()
            expect(inputs && results && Math.abs(inputs.y - results.y) < 2).toBe(width >= 1024)
            await page.screenshot({ path: shot(`bn-${mode}-${theme}-${width}.png`), fullPage: true, animations: 'disabled' })
            await noSidewaysScroll(page)
            expect(errors).toEqual([])
          })

          test(`axe: ${mode} ${theme} ${width}`, async ({ page }) => {
            await open(page, s.path + query, width, theme)
            await s.expectMode(page, mode)
            const { violations } = await new AxeBuilder({ page })
              .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
              .analyze()
            const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
            const report = serious
              .map((v) => `${v.id} (${v.impact}): ${v.help}\n${v.nodes.map((n) => `  ${n.target.join(' ')}\n    ${n.failureSummary}`).join('\n')}`)
              .join('\n\n')
            expect(serious, report).toEqual([])
          })
        }
      }
      for (const width of [390, 1440]) {
        test(`en ${theme} ${width}`, async ({ page }) => {
          const errors = errorsOf(page)
          await open(page, en, width, theme)
          await expect(page.locator('h1')).toHaveText(s.enH1)
          await expect(resultValue(page)).toHaveText(s.enValue)
          await page.screenshot({ path: shot(`en-default-${theme}-${width}.png`), fullPage: true, animations: 'disabled' })
          await noSidewaysScroll(page)
          expect(errors).toEqual([])
        })
      }
    }

    for (const width of [360, 390, 1440]) {
      test(`touch targets at least 44px at ${width}`, async ({ page }) => {
        await open(page, s.path, width)
        const small = await smallTapTargets(page.locator('body'))
        expect(small, `targets under 44x44:\n${small.join('\n')}`).toEqual([])
        await noSidewaysScroll(page)
      })
    }

    test('a shared link restores the inputs and the result; canonical stays clean', async ({ page, context, browser }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])
      await open(page, s.path, 1440)
      await s.share.fill(page)
      await expect(page).toHaveURL(s.share.query)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://hisabkhata.com${s.path}`)
      await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }))
      await page.getByRole('button', { name: 'শেয়ার' }).click()
      await expect(page.locator('[data-toast-viewport]')).toContainText('লিংক কপি হয়েছে')
      const link = await page.evaluate(() => navigator.clipboard.readText())
      expect(link).toMatch(s.share.query)
      const other = await browser.newPage()
      if (s.clock) await other.clock.setFixedTime(new Date(s.clock))
      await other.goto(link)
      await settle(other)
      await s.share.restored(other)
      await other.close()
    })

    test('works without JavaScript (server-rendered default result)', async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false })
      const page = await context.newPage()
      await page.goto(s.path)
      await expect(page.locator('h1')).toHaveText(s.h1)
      await expect(resultValue(page)).toHaveText(s.noJsValue ?? s.value)
      await expect(page.locator('[data-summary], [data-offer-table], [data-breakdown-table], [data-unit-table]').first()).toBeVisible()
      await context.close()
    })

    test('head has the JSON-LD and the page is indexable', async ({ page }) => {
      await page.goto(s.path)
      expect(await page.locator('meta[name="robots"]').count()).toBe(0)
      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
      expect(blocks.map((b) => (JSON.parse(b) as { '@type': string })['@type']).sort()).toEqual([...s.ldTypes].sort())
    })

    test('"ভুল পেলেন?" opens the report sheet', async ({ page }) => {
      await open(page, s.path, 390)
      await page.getByRole('button', { name: 'ভুল পেলেন?' }).click()
      await expect(page.getByRole('dialog', { name: 'ভুল পেলেন?' })).toBeVisible()
    })

    test('print: A4 without the shell, ads or actions', async ({ page }) => {
      await open(page, s.path, 1440)
      await page.emulateMedia({ media: 'print' })
      for (const selector of ['[data-desktop-header]', '[data-footer]', '[data-action-bar]', '[data-ad-slot]', '[data-related]']) {
        for (const el of await page.locator(selector).all()) await expect(el).toBeHidden()
      }
      await expect(resultValue(page)).toBeVisible()
      if (s.schedule) {
        // The schedule prints every row, not just what its scroll box shows on screen.
        const table = page.locator('[data-breakdown-table]')
        await expect(table.locator('tbody tr')).toHaveCount(s.schedule.rows)
        const box = await table.boundingBox()
        const region = await table.locator('[role="region"]').evaluate((el) => el.scrollHeight - el.clientHeight)
        expect(region, 'schedule is cut off in print').toBeLessThanOrEqual(1)
        expect(box!.height).toBeGreaterThan(s.schedule.rows * 20)
      }
      const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true })
      expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
      mkdirSync(join(ROOT, 'test-results', s.id), { recursive: true })
      writeFileSync(shot('print-a4.pdf'), pdf)
    })
  })
}
