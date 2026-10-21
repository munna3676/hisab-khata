// "কত টাকা লোন পাবো?" (Figma F9 27:6477, D · F9 66:29859).
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'loan-eligibility',
  path: '/tools/loan-eligibility',
  h1: 'কত টাকা লোন পাবো?',
  enH1: 'How much loan can I get?',
  modes: { default: '', 'dbr-40': '?dbr=40', 'no-room': '?emi=30000' },
  async expectMode(page, mode) {
    if (mode === 'no-room') {
      await expect(page.locator('[data-result-error] h2')).toHaveText('নতুন কিস্তির জায়গা নেই')
      return
    }
    await expect(resultValue(page)).toHaveText(mode === 'dbr-40' ? '৳৮.৫ লাখ' : '৳১১.২ লাখ')
    if (mode === 'default') await expect(page.locator('[data-summary]')).toContainText('৳১১,২৩,৮৭৬')
  },
  value: '৳১১.২ লাখ',
  enValue: '৳11.2 lakh',
  share: {
    async fill(page) {
      await page.locator('#loan-income').fill('80000')
      await page.getByRole('button', { name: '৪০%' }).click()
    },
    query: /\/tools\/loan-eligibility\?income=80000&dbr=40$/,
    async restored(page) {
      await expect(page.locator('#loan-income')).toHaveValue('৮০,০০০')
      await expect(page.getByRole('button', { name: '৪০%' })).toHaveAttribute('aria-pressed', 'true')
    },
  },
  ldTypes: ['BreadcrumbList', 'WebApplication'],
})
