// The CSS variables on the token showcase equal tokens.json, in light and dark,
// and the English page lives under /en/.
import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { ROOT, THEMES, prepare, settle } from './helpers'

const tokens = JSON.parse(readFileSync(`${ROOT}packages/tokens/src/tokens.json`, 'utf8'))

for (const theme of THEMES) {
  test(`tokens: CSS variables match tokens.json (${theme})`, async ({ page }) => {
    await prepare(page, theme)
    await page.goto('/')
    await settle(page)
    // Compare computed colours: production CSS is minified (#ffffff → #fff, rgba() → 8-digit hex).
    const expected: Record<string, string> = tokens.color[theme]
    const mismatches = await page.evaluate((pairs) => {
      const probe = document.createElement('i')
      document.body.append(probe)
      const resolve = (value: string) => {
        probe.style.color = value
        return getComputedStyle(probe).color
      }
      const out: string[] = []
      for (const [key, hex] of pairs) {
        const name = `--${key.replace(/\//g, '-')}`
        const actual = resolve(`var(${name})`)
        if (actual !== resolve(hex)) out.push(`${name}: ${actual}, expected ${hex}`)
      }
      probe.remove()
      return out
    }, Object.entries(expected))
    expect(mismatches).toEqual([])
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(bg).toBe(theme === 'light' ? 'rgb(246, 247, 249)' : 'rgb(18, 21, 28)')
  })
}

// Production CSS is minified (100ms → .1s), so compare in milliseconds.
const ms = (v: string) => (v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000)
const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

test('motion: reduce removes transforms and shortens durations', async ({ page }) => {
  await prepare(page, 'light', 'reduce')
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce')
  expect(Number(await page.evaluate(cssVar, '--press-scale'))).toBe(1)
  expect(ms(await page.evaluate(cssVar, '--duration-page'))).toBe(tokens.motion.reduce.page)
})

test('motion: lite shortens durations and keeps transforms', async ({ page }) => {
  await prepare(page, 'light', 'lite')
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'lite')
  expect(ms(await page.evaluate(cssVar, '--duration-page'))).toBe(tokens.motion.lite.page)
  expect(Number(await page.evaluate(cssVar, '--press-scale'))).toBe(0.97)
})

test('motion: prefers-reduced-motion with no setting means reduce', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce')
  expect(Number(await page.evaluate(cssVar, '--press-scale'))).toBe(1)
})

test('i18n: Bangla at /, English at /en/', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
  await page.goto('/en/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('link[hreflang="bn"]')).toHaveAttribute('href', /\/$/)
})
