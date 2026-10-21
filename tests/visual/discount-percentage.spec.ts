// Discount and percentage (Figma C2 28:6970, D · C2 68:4983).
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'discount-percentage',
  path: '/tools/discount-percentage',
  h1: 'ডিসকাউন্ট ও শতাংশ',
  enH1: 'Discount and percentage',
  modes: { default: '', error: '?off=120' },
  async expectMode(page, mode) {
    if (mode === 'error') {
      await expect(page.locator('#discount-off')).toHaveAttribute('aria-invalid', 'true')
      await expect(page.locator('[data-result-empty]')).toBeVisible()
      return
    }
    await expect(resultValue(page)).toHaveText('৳২,০০০')
    await expect(page.locator('[data-result-card]')).toContainText('বাঁচলো ৳৫০০ (২০%)')
    await expect(page.locator('[data-summary]')).toContainText('৫,০০০ এর ১৫%')
    await expect(page.locator('[data-summary]')).toContainText('৳৭৫০')
  },
  value: '৳২,০০০',
  enValue: '৳2,000',
  share: {
    async fill(page) {
      await page.locator('#discount-price').fill('3000')
      await page.getByRole('button', { name: '৫০%' }).click()
      await expect(resultValue(page)).toHaveText('৳১,৫০০')
    },
    query: /\/tools\/discount-percentage\?price=3000&off=50$/,
    async restored(page) {
      await expect(page.locator('#discount-price')).toHaveValue('৩,০০০')
      await expect(resultValue(page)).toHaveText('৳১,৫০০')
    },
  },
  ldTypes: ['BreadcrumbList', 'WebApplication'],
})
