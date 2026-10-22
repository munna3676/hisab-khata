// Age calculator (Figma D1 29:8051, D · D1 68:6790, P5 পিকার 59:16939). Clock frozen at Figma's today.
import { expect } from '@playwright/test'
import { FIGMA_TODAY, pickDate } from './dates'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'age',
  path: '/tools/age',
  h1: 'বয়স ক্যালকুলেটর',
  enH1: 'Age calculator',
  clock: FIGMA_TODAY,
  modes: { default: '', picker: '', error: '?on=1999-01-01' },
  async expectMode(page, mode) {
    if (mode === 'error') {
      await expect(page.locator('[data-result-error] h2')).toHaveText('এই তারিখে তো জন্মই হয়নি')
      return
    }
    await expect(resultValue(page)).toHaveText('২৬ বছর ৭ মাস ৪ দিন')
    await expect(page.locator('[data-result-card]')).toContainText('পরের জন্মদিন ১৪৭ দিন পর (১৫ মার্চ ২০২৭)')
    await expect(page.locator('[data-summary]')).toContainText('৯,৭১৪')
    await expect(page.locator('#age-on')).toContainText('অক্টোবর')
    await expect(page.getByRole('button', { name: 'আজ', exact: true })).toHaveAttribute('aria-pressed', 'true')
    if (mode === 'picker') {
      await page.locator('#age-birth').click()
      const sheet = page.getByRole('dialog', { name: 'জন্ম তারিখ' })
      await expect(sheet).toBeVisible()
      await expect(sheet.getByRole('gridcell', { name: '১৫ মার্চ ২০০০' })).toHaveAttribute('aria-selected', 'true')
      await expect(sheet.getByRole('button', { name: '১৫ মার্চ ২০০০ বেছে নাও' })).toBeVisible()
      await page.waitForTimeout(400)
    }
  },
  value: '২৬ বছর ৭ মাস ৪ দিন',
  enValue: '26 years 7 months 4 days',
  noJsValue: /^[০-৯]+ বছর/,
  share: {
    async fill(page) {
      await pickDate(page, 'age-birth', 'জন্ম তারিখ', 1995, 3, '১৫ মার্চ ১৯৯৫')
      await expect(resultValue(page)).toHaveText('৩১ বছর ৭ মাস ৪ দিন')
    },
    query: /\/tools\/age\?birth=1995-03-15$/,
    async restored(page) {
      await expect(page.locator('#age-birth')).toContainText('১৯৯৫')
      await expect(resultValue(page)).toHaveText('৩১ বছর ৭ মাস ৪ দিন')
    },
  },
  ldTypes: ['BreadcrumbList', 'FAQPage', 'WebApplication'],
})
