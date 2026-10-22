// Land price (Figma L2 31:8835, D · L2 68:8251). Per শতাংশ: engine ৳১৫,১২,৫০০ (exact at 720 sq ft);
// Figma ৳১৫,১৫,১৫২ divides by a rounded 1.65.
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'land-price',
  path: '/tools/land-price',
  h1: 'জমির দাম ক্যালকুলেটর',
  enH1: 'Land price calculator',
  modes: { default: '', decimal: '?area=10&unit=decimal&price=500000' },
  async expectMode(page, mode) {
    if (mode === 'decimal') {
      await expect(resultValue(page)).toHaveText('৳৫০,০০,০০০')
      await expect(page.getByText('প্রতি শতাংশের দাম')).toBeVisible()
      return
    }
    await expect(resultValue(page)).toHaveText('৳১,২৫,০০,০০০')
    await expect(page.locator('[data-result-card]')).toContainText('১ কোটি ২৫ লাখ টাকা')
    await expect(page.locator('[data-summary]')).toContainText('৳১৫,১২,৫০০')
    await expect(page.locator('[data-summary]')).toContainText('৳৩,৪৭২')
  },
  value: '৳১,২৫,০০,০০০',
  enValue: '৳1,25,00,000',
  share: {
    async fill(page) {
      await page.locator('#lp-area').fill('10')
      await expect(resultValue(page)).toHaveText('৳২,৫০,০০,০০০')
    },
    query: /\/tools\/land-price\?area=10$/,
    async restored(page) {
      await expect(page.locator('#lp-area')).toHaveValue('১০')
      await expect(resultValue(page)).toHaveText('৳২,৫০,০০,০০০')
    },
  },
  ldTypes: ['BreadcrumbList', 'WebApplication'],
})
