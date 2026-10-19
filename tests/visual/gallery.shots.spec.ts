// Screenshots of /dev/gallery (or one section) at 390 and 1440 px, light and dark.
// Output: test-results/gallery/<section|all>/<theme>-<width>.png
import { expect, test } from '@playwright/test'
import { SECTION, THEMES, WIDTHS, heightFor, prepare, settle, shotPath } from './helpers'

for (const theme of THEMES) {
  for (const width of WIDTHS) {
    test(`gallery ${SECTION ?? 'all'} ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: heightFor(width) })
      await prepare(page, theme)
      await page.goto('/dev/gallery')
      await settle(page)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

      const path = shotPath(`${theme}-${width}.png`)
      if (SECTION) {
        const section = page.locator(`section#${SECTION}`)
        await expect(section, `no gallery section "${SECTION}" (src/gallery/${SECTION}.astro)`).toHaveCount(1)
        // The desktop header is sticky; keep it from covering the section in the shot.
        await page.addStyleTag({ content: '[data-gallery-header]{position:static!important}' })
        await section.scrollIntoViewIfNeeded()
        await settle(page)
        await section.screenshot({ path, animations: 'disabled' })
      } else {
        await page.screenshot({ path, fullPage: true, animations: 'disabled' })
      }

      // The page must never scroll sideways (docs/decisions/0001-stack.md, Tables).
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, 'page scrolls horizontally').toBeLessThanOrEqual(0)
    })
  }
}
