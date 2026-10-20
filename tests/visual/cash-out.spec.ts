// The Cash Out calculator, the first page on the calculator template (Figma 03 Calculator — Cash
// Out 13:404, C1-b 58:15240, C1-c 58:15542, C1-d 58:15873, 15 Calculator — Dark mode 18:2004,
// D2 19:360 and the D · C1 frames). Screenshots: test-results/cash-out/<lang>-<mode>-<theme>-<width>.png
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, THEMES, heightFor, prepare, settle, smallTapTargets } from './helpers'

const WIDTHS = [360, 390, 768, 1024, 1440] as const
const shot = (name: string) => join(ROOT, 'test-results', 'cash-out', name)

/** The Figma modes as share links. */
const MODES = {
  charge: '', // 03 Calculator / D2
  max: '?mode=max', // C1-b
  quota: '?amount=10000&used=45000', // C1-c
  error: '?amount=40000', // C1-d
} as const
type Mode = keyof typeof MODES

const errorsOf = (page: Page) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  return errors
}

async function open(page: Page, path: string, width: number, theme: 'light' | 'dark' = 'light') {
  await page.setViewportSize({ width, height: heightFor(width) })
  await prepare(page, theme)
  await page.goto(path)
  await settle(page)
}

const noSidewaysScroll = async (page: Page) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, 'page scrolls horizontally').toBeLessThanOrEqual(0)
}

const resultValue = (page: Page) => page.locator('[data-result-card] [data-result-value]')

/** What each mode must show once hydrated (Figma example values with the seed data). */
async function expectMode(page: Page, mode: Mode) {
  if (mode === 'error') {
    await expect(page.locator('[data-result-error] h2')).toHaveText('এই পরিমাণ একদিনে তোলা যাবে না')
    await expect(page.locator('[data-result-card]')).toHaveCount(0)
    await expect(page.locator('#cash-out-amount')).toHaveAttribute('aria-invalid', 'true')
    return
  }
  const want = { charge: '৳৪৫.০০', max: '৳৪,৯৫৫', quota: '৳৯০.০০' }[mode]
  await expect(resultValue(page)).toHaveText(want)
  await expect(page.locator('[data-compare-row]')).toHaveCount(7)
  if (mode === 'quota') {
    await expect(page.locator('[data-quota-callout]')).toBeVisible()
    await expect(page.locator('[data-compare-row="bkash-priyo-agent"]')).toContainText('লিমিট পার')
  }
  if (mode === 'max') await expect(page.locator('[data-tool-subtitle]')).toHaveText('ব্যালেন্স লিখলে দেখাবে চার্জ কেটে সর্বোচ্চ কত তুলতে পারবে।')
}

for (const theme of THEMES) {
  for (const width of WIDTHS) {
    test(`cash out bn ${theme} ${width}`, async ({ page }) => {
      const errors = errorsOf(page)
      await open(page, '/tools/cash-out', width, theme)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await expectMode(page, 'charge')
      // Inputs and results side by side from the desktop column (container ≥ 840px) only.
      const inputs = await page.locator('[data-calculator-inputs]').boundingBox()
      const results = await page.locator('[data-calculator-results]').boundingBox()
      expect(inputs && results && Math.abs(inputs.y - results.y) < 2).toBe(width >= 1024)
      await page.screenshot({ path: shot(`bn-charge-${theme}-${width}.png`), fullPage: true, animations: 'disabled' })
      await noSidewaysScroll(page)
      expect(errors).toEqual([])
    })
  }
  for (const mode of Object.keys(MODES) as Mode[]) {
    for (const width of [390, 1440]) {
      test(`cash out mode ${mode} ${theme} ${width}`, async ({ page }) => {
        const errors = errorsOf(page)
        await open(page, `/tools/cash-out${MODES[mode]}`, width, theme)
        await expectMode(page, mode)
        await page.screenshot({ path: shot(`bn-${mode}-${theme}-${width}.png`), fullPage: true, animations: 'disabled' })
        await noSidewaysScroll(page)
        expect(errors).toEqual([])
      })

      test(`axe: cash out ${mode} ${theme} ${width}`, async ({ page }) => {
        await open(page, `/tools/cash-out${MODES[mode]}`, width, theme)
        await expectMode(page, mode)
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
    test(`cash out en ${theme} ${width}`, async ({ page }) => {
      await open(page, '/en/tools/cash-out?mode=max', width, theme)
      await expect(page.locator('h1')).toHaveText('bKash, Nagad, Rocket cash out charge')
      await expect(resultValue(page)).toHaveText('৳4,955')
      await page.screenshot({ path: shot(`en-max-${theme}-${width}.png`), fullPage: true, animations: 'disabled' })
      await noSidewaysScroll(page)
    })
  }
}

for (const width of WIDTHS) {
  test(`touch targets: cash out at least 44px at ${width}`, async ({ page }) => {
    await open(page, '/tools/cash-out?amount=10000&used=45000', width)
    const small = await smallTapTargets(page.locator('body'))
    expect(small, `targets under 44x44:\n${small.join('\n')}`).toEqual([])
  })
}

test('cash out: typing updates the result live and the URL; canonical stays clean', async ({ page }) => {
  await open(page, '/tools/cash-out', 390)
  await page.locator('#cash-out-amount').fill('১০০০০')
  await expect(resultValue(page)).toHaveText('৳৯০.০০')
  await expect(page).toHaveURL(/\/tools\/cash-out\?amount=10000$/)
  await page.getByRole('radio', { name: 'কত তোলা যাবে' }).check({ force: true })
  await expect(page).toHaveURL(/\?mode=max&amount=10000$/)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://hisabkhata.com/tools/cash-out')
  // C1-d's button calculates with the most allowed.
  await page.getByRole('radio', { name: 'তুললে চার্জ কত' }).check({ force: true })
  await page.locator('#cash-out-amount').fill('40000')
  await page.locator('[data-result-fix]').click()
  await expect(page.locator('#cash-out-amount')).toHaveValue('৩০,০০০')
  await expect(resultValue(page)).toHaveText('৳২৭০.০০')
})

test('cash out: a shared link restores the inputs and the result', async ({ page, context, browser }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await open(page, '/tools/cash-out', 1440)
  await page.locator('#cash-out-amount').fill('25000')
  await page.locator('#cash-out-used').fill('48000')
  await expect(page).toHaveURL(/\?amount=25000&used=48000$/)
  // No Web Share API on desktop Chromium: the platform adapter copies the link and says so.
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }))
  await page.getByRole('button', { name: 'শেয়ার' }).click()
  await expect(page.locator('[data-toast-viewport]')).toContainText('লিংক কপি হয়েছে')
  const link = await page.evaluate(() => navigator.clipboard.readText())
  expect(link).toMatch(/\/tools\/cash-out\?amount=25000&used=48000$/)

  const other = await browser.newPage()
  await other.goto(link)
  await settle(other)
  await expect(other.locator('#cash-out-amount')).toHaveValue('২৫,০০০')
  await expect(other.locator('#cash-out-used')).toHaveValue('৪৮,০০০')
  await expect(other.locator('[data-quota-callout]')).toBeVisible()
  await other.close()
})

test('cash out: works without JavaScript (server-rendered default result)', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/tools/cash-out')
  await expect(page.locator('h1')).toHaveText('বিকাশ, নগদ, রকেট ক্যাশ আউট চার্জ')
  await expect(resultValue(page)).toHaveText('৳৪৫.০০')
  await expect(page.locator('[data-result-card]')).toContainText('সবচেয়ে কম চার্জ: রকেট, DBBL ATM')
  await expect(page.locator('[data-compare-row]')).toHaveCount(7)
  await expect(page.locator('#cash-out-amount')).toHaveValue('৫,০০০')
  await expect(page.locator('[data-tool-steps] li')).toHaveCount(4)
  await context.close()
})

test('cash out: head has FAQPage, BreadcrumbList and WebApplication JSON-LD and is indexable', async ({ page }) => {
  await page.goto('/tools/cash-out')
  expect(await page.locator('meta[name="robots"]').count()).toBe(0)
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
  const types = blocks.map((b) => (JSON.parse(b) as { '@type': string })['@type'])
  expect(types.sort()).toEqual(['BreadcrumbList', 'FAQPage', 'WebApplication'])
  const faq = JSON.parse(blocks.find((b) => b.includes('FAQPage'))!) as { mainEntity: { name: string }[] }
  expect(faq.mainEntity.map((q) => q.name)).toEqual([
    'বিকাশে ১০০০ টাকা ক্যাশ আউটে কত চার্জ?',
    'বিকাশ প্রিয় এজেন্টের লিমিট কত?',
    'কোন মোবাইল ব্যাংকিংয়ে চার্জ সবচেয়ে কম?',
  ])
})

test('cash out: the unverified data shows "যাচাই বাকি" instead of the green line', async ({ page }) => {
  await page.goto('/tools/cash-out')
  await expect(page.locator('[data-tool-header] [data-unverified]')).toContainText('যাচাই বাকি')
})

test('cash out: "ভুল পেলেন?" opens the report sheet and sends the report', async ({ page }) => {
  let body: unknown = null
  await page.route('**/api/report', async (route) => {
    body = route.request().postDataJSON()
    await route.fulfill({ status: 201, body: '{}' })
  })
  await open(page, '/tools/cash-out', 390)
  await page.getByRole('button', { name: 'ভুল পেলেন?' }).click()
  const sheet = page.getByRole('dialog', { name: 'ভুল পেলেন?' })
  await expect(sheet).toBeVisible()
  const small = await smallTapTargets(sheet)
  expect(small, `targets under 44x44:\n${small.join('\n')}`).toEqual([])
  await sheet.locator('select').selectOption('nagad-ussd')
  await sheet.locator('textarea').fill('এখন ১৪ টাকা দেখাচ্ছে')
  await sheet.getByRole('button', { name: 'রিপোর্ট পাঠাও' }).click()
  await expect(page.locator('[data-toast-viewport]')).toContainText('ধন্যবাদ! রিপোর্ট পেয়েছি')
  await expect(sheet).toBeHidden()
  expect(body).toMatchObject({ toolId: 'cash-out', item: 'nagad-ussd', correct: 'এখন ১৪ টাকা দেখাচ্ছে' })
})

test('cash out: the print stylesheet lays out an A4 page without the shell, ads or actions', async ({ page }) => {
  await open(page, '/tools/cash-out?amount=10000&used=45000', 1440)
  await page.emulateMedia({ media: 'print' })
  for (const selector of ['[data-desktop-header]', '[data-footer]', '[data-action-bar]', '[data-ad-slot]', '[data-related]']) {
    for (const el of await page.locator(selector).all()) await expect(el).toBeHidden()
  }
  await expect(resultValue(page)).toBeVisible()
  await expect(page.locator('[data-compare-row]')).toHaveCount(7)
  await expect(page.locator('[data-print-only]')).toContainText('/tools/cash-out?amount=10000&used=45000')
  // Inputs and results print side by side.
  const inputs = await page.locator('[data-calculator-inputs]').boundingBox()
  const results = await page.locator('[data-calculator-results]').boundingBox()
  expect(inputs!.x + inputs!.width).toBeLessThan(results!.x)
  const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true })
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
  mkdirSync(join(ROOT, 'test-results', 'cash-out'), { recursive: true })
  writeFileSync(shot('print-a4.pdf'), pdf)
})
