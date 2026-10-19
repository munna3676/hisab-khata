// axe-core on the gallery (or one SECTION) in both themes: no serious or critical violations.
// Also: every interactive element in the gallery has a hit area of at least 44x44 px.
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { SECTION, THEMES, prepare, settle } from './helpers'

const scope = SECTION ? `section#${SECTION}` : '[data-gallery]'

for (const theme of THEMES) {
  test(`axe: gallery ${SECTION ?? 'all'} ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await prepare(page, theme)
    await page.goto('/dev/gallery')
    await settle(page)

    const builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    if (SECTION) builder.include(scope)
    const { violations } = await builder.analyze()
    const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    const report = serious
      .map((v) => `${v.id} (${v.impact}): ${v.help}\n${v.nodes.map((n) => `  ${n.target.join(' ')}\n    ${n.failureSummary}`).join('\n')}`)
      .join('\n\n')
    expect(serious, report).toEqual([])
  })
}

test(`touch targets: gallery ${SECTION ?? 'all'} at least 44px`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepare(page, 'light')
  await page.goto('/dev/gallery')
  await settle(page)
  // Inline links inside running text are exempt (WCAG 2.5.8); mark others with data-tap-exempt.
  const small = await page.locator(scope).evaluate((root) => {
    const sel = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=switch], [role=option], [role=menuitem], [role=checkbox], [role=radio]'
    const out: string[] = []
    for (const el of root.querySelectorAll<HTMLElement>(sel)) {
      if (el.closest('[data-tap-exempt]')) continue
      // A visually hidden input is hit through its <label>; measure that instead.
      const target = el.matches('input') && el.getBoundingClientRect().width <= 1 ? el.closest('label') : el
      if (!target) continue
      const r = target.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue // not rendered (closed sheet, hidden variant)
      const inlineInText = target.matches('a') && getComputedStyle(target).display === 'inline' && !!target.closest('p, li, td')
      if (inlineInText) continue
      if (r.width < 44 || r.height < 44) out.push(`${target.tagName.toLowerCase()} "${(target.textContent ?? '').trim().slice(0, 40)}" ${Math.round(r.width)}x${Math.round(r.height)}`)
    }
    return out
  })
  expect(small, `targets under 44x44:\n${small.join('\n')}`).toEqual([])
})
