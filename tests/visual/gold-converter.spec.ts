// Gold and silver converter (Figma L3 31:9006, D · L3 68:8527).
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'gold-converter',
  path: '/tools/gold-converter',
  h1: 'সোনা-রুপা কনভার্টার',
  enH1: 'Gold and silver converter',
  modes: { default: '', 'no-rate': '?k=18' },
  async expectMode(page, mode) {
    if (mode === 'no-rate') {
      await expect(page.locator('[data-calculator-inputs]')).toContainText('বাজুসের তালিকায় ১৮ ক্যারেটের রেট নেই')
      await expect(page.locator('[data-result-card]')).toContainText('২.২৫ ভরি')
      return
    }
    await expect(resultValue(page)).toHaveText('২৬.২৪৪ গ্রাম')
    await expect(page.locator('[data-result-card]')).toContainText('২.২৫ ভরি × ৳২,২৮,০৩১ = ৳৫,১৩,০৭০ (২২ ক্যারেট)')
    await expect(page.locator('[data-calculator-inputs]')).toContainText('বাজুস, ১৩ অক্টোবর ২০২৬: ২২ ক্যারেট ৳২,২৮,০৩১/ভরি')
    await expect(page.locator('[data-unit-row="roti"]')).toContainText('২১৬')
  },
  value: '২৬.২৪৪ গ্রাম',
  enValue: '26.244 grams',
  share: {
    async fill(page) {
      await page.locator('#gold-v').fill('1')
      await page.getByRole('button', { name: '২১', exact: true }).click()
      await expect(resultValue(page)).toHaveText('১৪.৫৮ গ্রাম')
    },
    query: /\/tools\/gold-converter\?v=1&k=21$/,
    async restored(page) {
      await expect(page.locator('#gold-v')).toHaveValue('১')
      await expect(page.locator('#gold-price')).toHaveValue('২,১৭,৭৬৭')
      await expect(resultValue(page)).toHaveText('১৪.৫৮ গ্রাম')
    },
  },
  ldTypes: ['BreadcrumbList', 'WebApplication'],
})
