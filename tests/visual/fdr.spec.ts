// FDR (Figma F8 27:6253, F8-b renew 64:21334, D · F8 66:29578, D · F8-b 69:39636).
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'fdr',
  path: '/tools/fdr',
  h1: 'FDR মুনাফা ক্যালকুলেটর',
  enH1: 'FDR profit calculator',
  modes: { maturity: '', renew: '?mode=renew', 'renew-error': '?mode=renew&months=10' },
  async expectMode(page, mode) {
    if (mode === 'renew-error') {
      await expect(page.locator('[data-result-error] h2')).toHaveText('রিনিউ হলে মেয়াদ ৩ মাসের গুণিতক হয়')
      await expect(page.locator('#fdr-months')).toHaveAttribute('aria-invalid', 'true')
      return
    }
    const renew = mode === 'renew'
    // F8-b: the engine gives ৳১,০৯,৩০৮; Figma shows ৳১,০৯,৩৪৩ (docs/open-items.md).
    await expect(resultValue(page)).toHaveText(renew ? '৳১,০৯,৩০৮' : '৳১,০৯,০০০')
    await expect(page.locator('[data-summary]')).toContainText(renew ? '৳১০,৩৪৩' : '৳১০,০০০')
    if (renew) await expect(page.locator('[data-result-card]')).toContainText('মুনাফাসহ রিনিউ')
  },
  value: '৳১,০৯,০০০',
  enValue: '৳1,09,000',
  share: {
    async fill(page) {
      await page.locator('#fdr-amount').fill('200000')
      await page.getByRole('button', { name: '৩ বছর' }).click()
      await page.getByRole('radio', { name: 'প্রতি ৩ মাসে রিনিউ' }).check({ force: true })
    },
    query: /\/tools\/fdr\?amount=200000&months=36&mode=renew$/,
    async restored(page) {
      await expect(page.locator('#fdr-amount')).toHaveValue('২,০০,০০০')
      await expect(page.locator('#fdr-months')).toHaveValue('৩৬')
      await expect(page.getByRole('radio', { name: 'প্রতি ৩ মাসে রিনিউ' })).toBeChecked()
    },
  },
  ldTypes: ['BreadcrumbList', 'FAQPage', 'WebApplication'],
})
