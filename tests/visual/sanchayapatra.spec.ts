// Sanchayapatra (Figma C7 29:7661, P7 পিকার 59:17386, D · C7 68:6269, D · P7 70:21156).
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'sanchayapatra',
  path: '/tools/sanchayapatra',
  h1: 'সঞ্চয়পত্র মুনাফা',
  enH1: 'Sanchayapatra profit',
  modes: { paribar: '', picker: '', limit: '?amount=5000' },
  async expectMode(page, mode) {
    if (mode === 'limit') {
      await expect(page.locator('[data-result-error] h2')).toHaveText('এই পরিমাণে কেনা যায় না')
      await expect(page.locator('[data-result-fix]')).toHaveText('৳১০,০০০ দিয়ে হিসাব করো')
      return
    }
    // Figma shows হাতে ৳৪,৪৭৪ with a flat 10% tax; the data's NBR slab is 5% up to 5 lakh.
    await expect(resultValue(page)).toHaveText('৳৪,৯৭১')
    await expect(page.locator('[data-result-card]')).toContainText('৫ লাখ ১১.৯৩% হারে · ৫% অগ্রিম কর কাটলে হাতে ৳৪,৭২২')
    await expect(page.locator('[data-breakdown-table]')).toContainText('৭.৫ লাখ পর্যন্ত (পরিবার)')
    await expect(page.locator('#sp-scheme')).toContainText('পরিবার সঞ্চয়পত্র')
    if (mode === 'picker') {
      await page.locator('#sp-scheme').click()
      const sheet = page.getByRole('dialog', { name: 'কোন সঞ্চয়পত্র?' })
      await expect(sheet).toBeVisible()
      await expect(sheet.getByRole('option')).toHaveCount(4)
      await expect(sheet.getByRole('option', { name: /পরিবার সঞ্চয়পত্র/ })).toHaveAttribute('aria-selected', 'true')
      await expect(sheet).toContainText('জমার পরিমাণ অনুযায়ী ধাপে ধাপে')
      await page.waitForTimeout(400)
    }
  },
  value: '৳৪,৯৭১',
  enValue: '৳4,971',
  share: {
    async fill(page) {
      await page.locator('#sp-scheme').click()
      await page.getByRole('option', { name: /৩ মাস অন্তর মুনাফাভিত্তিক/ }).click()
      await expect(page.getByRole('dialog')).toBeHidden()
      await page.locator('#sp-amount').fill('400000')
      await expect(resultValue(page)).toHaveText('৳১১,৯৩০')
    },
    query: /\/tools\/sanchayapatra\?scheme=three-month&amount=400000$/,
    async restored(page) {
      await expect(page.locator('#sp-amount')).toHaveValue('৪,০০,০০০')
      await expect(page.locator('#sp-scheme')).toContainText('৩ মাস অন্তর মুনাফাভিত্তিক')
      await expect(resultValue(page)).toHaveText('৳১১,৯৩০')
    },
  },
  ldTypes: ['BreadcrumbList', 'WebApplication'],
})
