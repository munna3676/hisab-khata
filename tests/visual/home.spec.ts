// The Home page (Figma 01 Home, D1 Home — Desktop, 15 Home — Dark mode, A10 Home — English):
// full-page screenshots at every layout width in both themes, no sideways scroll, axe, 44px
// targets, and the shell's behaviour (theme toggle, language switch, search, view transitions).
// Screenshots: test-results/home/<bn|en>-<theme>-<width>.png
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { join } from 'node:path'
import { ROOT, THEMES, heightFor, prepare, settle, smallTapTargets } from './helpers'

/** docs/decisions/0001-stack.md, Responsive layout → Verification. */
const HOME_WIDTHS = [360, 390, 768, 1024, 1440] as const
const homeShot = (name: string) => join(ROOT, 'test-results', 'home', name)

const errorsOf = (page: Page) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  return errors
}

for (const theme of THEMES) {
  for (const width of HOME_WIDTHS) {
    test(`home bn ${theme} ${width}`, async ({ page }) => {
      const errors = errorsOf(page)
      await page.setViewportSize({ width, height: heightFor(width) })
      await prepare(page, theme)
      await page.goto('/')
      await settle(page)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      // Mobile shell below 1024, desktop shell from 1024.
      const desktop = width >= 1024
      await expect(page.locator('[data-desktop-header]')).toBeVisible({ visible: desktop })
      await expect(page.locator('[data-top-bar]')).toBeVisible({ visible: !desktop })
      await expect(page.locator('[data-bottom-nav]')).toBeVisible({ visible: !desktop })
      await page.screenshot({ path: homeShot(`bn-${theme}-${width}.png`), fullPage: true, animations: 'disabled' })
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, 'page scrolls horizontally').toBeLessThanOrEqual(0)
      expect(errors).toEqual([])
    })
  }
  for (const width of [390, 1440]) {
    test(`home en ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: heightFor(width) })
      await prepare(page, theme)
      await page.goto('/en/')
      await settle(page)
      await expect(page.locator('h1')).toHaveText('Every taka, in one ledger')
      await page.screenshot({ path: homeShot(`en-${theme}-${width}.png`), fullPage: true, animations: 'disabled' })
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, 'page scrolls horizontally').toBeLessThanOrEqual(0)
    })
  }
}

for (const path of ['/', '/en/']) {
  for (const theme of THEMES) {
    for (const width of [390, 1440]) {
      test(`axe: home ${path} ${theme} ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: heightFor(width) })
        await prepare(page, theme)
        await page.goto(path)
        await settle(page)
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
}

for (const width of HOME_WIDTHS) {
  test(`touch targets: home at least 44px at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: heightFor(width) })
    await prepare(page, 'light')
    await page.goto('/')
    await settle(page)
    const small = await smallTapTargets(page.locator('body'))
    expect(small, `targets under 44x44:\n${small.join('\n')}`).toEqual([])
  })
}

test('home: date line, today ledger and the honest unverified state', async ({ page }) => {
  await page.goto('/')
  await settle(page)
  // Bangla weekday, Gregorian date and the Bangla date, recomputed for today on the client.
  await expect(page.locator('[data-date-line]').first()).toHaveText(/^[^\s]+বার, [০-৯]+ \S+ [০-৯]{4} · [০-৯]+ \S+ [০-৯]{4}$/)
  const today = page.locator('[data-today="mobile"]')
  await expect(today.locator('dt')).toHaveText(['বাংলা তারিখ', 'বিকাশ প্রিয় এজেন্ট', 'নগদ অ্যাপ', 'রকেট DBBL ATM'])
  await expect(today.locator('dd').nth(1)).toHaveText('৳১৩.৯৫/হাজার')
  // The seed Facts are unverified (data/README): the card must say so rather than show the green line.
  await expect(today.locator('[data-unverified]')).toHaveText('যাচাই বাকি')
})

test('home: the theme toggle switches and remembers the theme', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepare(page, 'light')
  await page.goto('/')
  await settle(page)
  const toggle = page.locator('[data-top-bar] [data-theme-toggle]')
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  // prepare() re-seeds localStorage on every load, so check the stored value directly.
  expect(await page.evaluate(() => localStorage.getItem('hk-theme'))).toBe('dark')
})

test('home: the language switch goes to the paired page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.locator('[data-desktop-header] a[hreflang="en"]').click()
  await expect(page).toHaveURL(/\/en\/$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await page.goto('/tools/emi')
  await page.locator('[data-desktop-header] a[hreflang="en"]').click()
  await expect(page).toHaveURL(/\/en\/tools\/emi$/)
  await page.locator('[data-desktop-header] a[hreflang="bn"]').click()
  await expect(page).toHaveURL(/\/tools\/emi$/)
})

test('home: the big search bar submits to /search?q= and finds pages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.locator('#home-search-mobile').fill('emi')
  await page.locator('#home-search-mobile').press('Enter')
  await expect(page).toHaveURL(/\/search\?q=emi$/)
  await expect(page.locator('[data-search-results] a[href="/tools/emi"]')).toBeVisible()
})

test('home: the bottom nav marks the tab of the route', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const [path, tab] of [
    ['/', 'home'],
    ['/search', 'search'],
    ['/tools', 'tools'],
    ['/en/saved', 'saved'],
  ] as const) {
    await page.goto(path)
    await expect(page.locator('[data-bottom-nav] [aria-current="page"]')).toHaveAttribute('data-bottom-nav-item', tab)
  }
  await page.goto('/tools/emi')
  await expect(page.locator('[data-bottom-nav] [aria-current="page"]')).toHaveCount(0)
})

test('home: "your tools" row is hidden when empty and lists recently opened tools', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await settle(page)
  await expect(page.locator('[data-your-tools]')).toHaveCount(0)
  await page.goto('/tools/emi')
  await page.waitForLoadState('networkidle')
  await page.goto('/')
  await settle(page)
  await expect(page.locator('[data-your-tools] a[href="/tools/emi"]')).toBeVisible()
})

test('view transitions: cross-document, typed forward/back, bars named, no console errors', async ({ page }) => {
  const errors = errorsOf(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    addEventListener('pagereveal', (e) => {
      ;(window as unknown as { __vt: unknown }).__vt = (e as Event & { viewTransition: unknown }).viewTransition
    })
  })
  await page.goto('/')
  await settle(page)
  const hasRule = await page.evaluate(() =>
    [...document.styleSheets].some((sheet) =>
      [...sheet.cssRules].some((rule) => rule.constructor.name === 'CSSViewTransitionRule' && (rule as unknown as { navigation: string }).navigation === 'auto'),
    ),
  )
  expect(hasRule).toBe(true)
  expect(await page.locator('[data-top-bar]').evaluate((el) => getComputedStyle(el).viewTransitionName)).toBe('hk-top-bar')
  expect(await page.locator('[data-bottom-nav]').evaluate((el) => getComputedStyle(el).viewTransitionName)).toBe('hk-bottom-nav')

  const types = () =>
    page.evaluate(() => {
      const vt = (window as unknown as { __vt?: { types: Set<string> } | null }).__vt
      return vt ? [...vt.types] : null
    })
  // Chromium skips a cross-document transition when the new page is slow to render (busy CI
  // workers), so allow a few tries; one transition typed 'forward' is what must happen.
  let forward: string[] | null = null
  for (let attempt = 0; attempt < 4 && !forward; attempt++) {
    if (attempt > 0) {
      await page.goto('/')
      await settle(page)
    }
    await page.locator('[data-section-card]').first().click()
    await expect(page).toHaveURL(/\/mfs$/)
    await page.waitForLoadState('networkidle')
    forward = await types()
  }
  expect(forward).toEqual(['forward'])
  await page.goBack()
  await page.waitForLoadState('networkidle')
  // A back navigation may come from the bfcache (no new transition); when it transitions, it is typed back.
  const back = await types()
  if (back) expect(back).toEqual(['back'])
  expect(errors).toEqual([])
})

test('view transitions: reduced motion keeps navigation working with opacity only', async ({ page }) => {
  const errors = errorsOf(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce')
  // The reduce rules replace the slide with a fade only.
  const fadeOnly = await page.evaluate(() =>
    [...document.styleSheets].some((sheet) =>
      [...sheet.cssRules].some(
        (rule) =>
          rule instanceof CSSStyleRule &&
          rule.selectorText.includes(':not([data-motion="full"])::view-transition-new(root)') &&
          !rule.style.animationName.includes('slide'),
      ),
    ),
  )
  expect(fadeOnly).toBe(true)
  await page.locator('[data-section-card]').first().click()
  await expect(page).toHaveURL(/\/mfs$/)
  expect(errors).toEqual([])
})
