// axe-core on the gallery (or one SECTION) in both themes: no serious or critical violations.
// Also: every interactive element in the gallery has a hit area of at least 44x44 px.
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { SECTION, THEMES, prepare, settle, smallTapTargets } from './helpers'

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
  const small = await smallTapTargets(page.locator(scope))
  expect(small, `targets under 44x44:\n${small.join('\n')}`).toEqual([])
})
