// VAT (Figma C1 28:6772, C4-b VAT বাদ দাও 60:17985, D · C1 68:4691, D · C4-b 69:37970).
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'vat',
  path: '/tools/vat',
  h1: 'VAT ক্যালকুলেটর',
  enH1: 'VAT calculator',
  modes: { add: '', remove: '?mode=remove&amount=1150' },
  async expectMode(page, mode) {
    const remove = mode === 'remove'
    await expect(resultValue(page)).toHaveText(remove ? '৳১,০০০' : '৳১,১৫০')
    await expect(page.locator('[data-result-card]')).toContainText(remove ? 'VAT ১৫% = ৳১৫০ · ১,১৫০ ÷ ১.১৫' : 'VAT ১৫% = ৳১৫০')
    await expect(page.locator('[data-summary]')).toContainText(remove ? '− ৳১৫০' : '৳১,০০০')
    await expect(page.getByRole('radio', { name: remove ? 'VAT বাদ দাও' : 'VAT যোগ করো' })).toBeChecked()
    await expect(page.locator('[data-tool-callout]')).toContainText('১,১৫০ ÷ ১.১৫ = ১,০০০ টাকা')
    await expect(page.locator('[data-unverified]')).toBeVisible()
  },
  value: '৳১,১৫০',
  enValue: '৳1,150',
  share: {
    async fill(page) {
      await page.locator('#vat-amount').fill('2000')
      await page.getByRole('radio', { name: 'VAT বাদ দাও' }).check({ force: true })
      await expect(resultValue(page)).toHaveText('৳১,৭৩৯.১৩')
    },
    query: /\/tools\/vat\?mode=remove&amount=2000$/,
    async restored(page) {
      await expect(page.locator('#vat-amount')).toHaveValue('২,০০০')
      await expect(page.getByRole('radio', { name: 'VAT বাদ দাও' })).toBeChecked()
      await expect(resultValue(page)).toHaveText('৳১,৭৩৯.১৩')
    },
  },
  ldTypes: ['BreadcrumbList', 'FAQPage', 'WebApplication'],
})
