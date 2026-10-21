// Currency converter (Figma F11 27:6940, P8 পিকার 59:17540, D · F11 66:30468, D · P8 70:21452).
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'currency-converter',
  path: '/tools/currency-converter',
  h1: 'কারেন্সি কনভার্টার',
  enH1: 'Currency converter',
  modes: { sar: '', picker: '', myr: '?cur=MYR' },
  async expectMode(page, mode) {
    if (mode === 'myr') {
      await expect(page.locator('[data-result-error]')).toContainText('ব্যাংকের তালিকায় নেই, অন্য সূত্র যোগ হলে আসবে')
      return
    }
    await expect(resultValue(page)).toHaveText('৳৩২,৬৪১')
    await expect(page.locator('[data-result-card]')).toContainText('ডাচ-বাংলা ব্যাংক TT ক্রয় হার: ১ SAR = ৳৩২.৬৪ · ১৮ অক্টোবর ২০২৬')
    await expect(page.locator('[data-breakdown-table]')).toContainText('অন্য মুদ্রায় ১,০০০')
    await expect(page.locator('[data-breakdown-table]')).toContainText('১,২২,৫০০')
    if (mode === 'picker') {
      await page.locator('#currency-code').click()
      const sheet = page.getByRole('dialog', { name: 'কোন মুদ্রা?' })
      await expect(sheet).toBeVisible()
      await expect(sheet.getByRole('option', { name: /সৌদি রিয়াল · SAR/ })).toHaveAttribute('aria-selected', 'true')
      await expect(sheet.getByRole('option', { name: /MYR/ })).toHaveAttribute('aria-disabled', 'true')
      await page.waitForTimeout(400)
    }
  },
  value: '৳৩২,৬৪১',
  enValue: '৳32,641',
  share: {
    async fill(page) {
      await page.getByRole('button', { name: 'USD', exact: true }).click()
      await page.locator('#currency-amount').fill('500')
      await expect(resultValue(page)).toHaveText('৳৬১,২৫০')
    },
    query: /\/tools\/currency-converter\?cur=USD&amount=500$/,
    async restored(page) {
      await expect(page.locator('#currency-amount')).toHaveValue('৫০০')
      await expect(page.locator('#currency-code')).toContainText('মার্কিন ডলার · USD')
      await expect(resultValue(page)).toHaveText('৳৬১,২৫০')
    },
  },
  ldTypes: ['BreadcrumbList', 'WebApplication'],
})
