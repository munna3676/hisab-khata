// Jewellery bill (Figma L4 31:9216, D · L4 68:8774).
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'jewelry-bill',
  path: '/tools/jewelry-bill',
  h1: 'গহনার বিল ক্যালকুলেটর',
  enH1: 'Jewellery bill calculator',
  modes: { default: '', 'making-over': '?mk=120' },
  async expectMode(page, mode) {
    if (mode === 'making-over') {
      await expect(page.locator('[data-result-empty]')).toBeVisible()
      await expect(page.locator('[data-calculator-inputs]')).toContainText('সর্বোচ্চ ১০০ লেখা যাবে')
      return
    }
    await expect(resultValue(page)).toHaveText('৳২,৫৩,৭৯৯')
    await expect(page.locator('[data-result-card]')).toContainText('বাজুস রেট, মজুরি ৬% ও VAT ৫% ধরে')
    await expect(page.locator('[data-summary]')).toContainText('৳১৩,৬৮২')
    await expect(page.locator('[data-summary]')).toContainText('৳১২,০৮৬')
  },
  value: '৳২,৫৩,৭৯৯',
  enValue: '৳2,53,799',
  share: {
    async fill(page) {
      await page.locator('#jb-making').fill('8')
      await expect(resultValue(page)).toHaveText('৳২,৫৮,৫৮৭')
    },
    query: /\/tools\/jewelry-bill\?mk=8$/,
    async restored(page) {
      await expect(page.locator('#jb-making')).toHaveValue('৮')
      await expect(resultValue(page)).toHaveText('৳২,৫৮,৫৮৭')
    },
  },
  ldTypes: ['BreadcrumbList', 'WebApplication'],
})
