// Loan EMI (Figma F6 27:5771, D · F6 66:29012). Screenshots: test-results/emi/
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'emi',
  path: '/tools/emi',
  h1: 'লোন EMI ক্যালকুলেটর',
  enH1: 'Loan EMI calculator',
  modes: { default: '' },
  async expectMode(page) {
    await expect(resultValue(page)).toHaveText('৳১৬,৬০৭')
    await expect(page.locator('[data-summary]')).toContainText('৳৯৭,৮৫৮')
    await expect(page.locator('[data-summary]')).toContainText('৳৫,৯৭,৮৫৮')
    await expect(page.locator('[data-split-bar]')).toContainText('মূল টাকা ৮৪%')
    await expect(page.locator('[data-breakdown-table] tbody tr').first()).toContainText('৪,৮৮,৩৯৩')
  },
  value: '৳১৬,৬০৭',
  enValue: '৳16,607',
  share: {
    async fill(page) {
      await page.locator('#emi-amount').fill('800000')
      await page.getByRole('button', { name: '৫ বছর' }).click()
      await expect(resultValue(page)).toHaveText('৳১৭,৭৯৬')
    },
    query: /\/tools\/emi\?amount=800000&months=60$/,
    async restored(page) {
      await expect(page.locator('#emi-amount')).toHaveValue('৮,০০,০০০')
      await expect(page.locator('#emi-months')).toHaveValue('৬০')
      await expect(resultValue(page)).toHaveText('৳১৭,৭৯৬')
    },
  },
  ldTypes: ['BreadcrumbList', 'FAQPage', 'WebApplication'],
  schedule: { rows: 36 },
})
