// Government job age limit (Figma D2 29:8239, D · D2 68:7039).
import { expect } from '@playwright/test'
import { FIGMA_TODAY, pickDate } from './dates'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'job-age-limit',
  path: '/tools/job-age-limit',
  h1: 'সরকারি চাকরির বয়সসীমা',
  enH1: 'Government job age limit',
  clock: FIGMA_TODAY,
  modes: { default: '', over: '?max=29' },
  async expectMode(page, mode) {
    if (mode === 'over') {
      await expect(resultValue(page)).toHaveText('সীমা পার ✗')
      return
    }
    await expect(resultValue(page)).toHaveText('যোগ্য ✓')
    await expect(page.locator('[data-result-card]')).toContainText('ওই তারিখে বয়স ২৯ বছর ৭ মাস ১৬ দিন · সীমা ৩২ বছর')
    await expect(page.locator('[data-summary]')).toContainText('১৫ মার্চ ২০২৯')
    await expect(page.locator('[data-summary]')).toContainText('১৪ মার্চ ২০২৯ পর্যন্ত')
    await expect(page.locator('body')).toContainText('যাচাই বাকি')
  },
  value: 'যোগ্য ✓',
  enValue: 'Eligible ✓',
  share: {
    async fill(page) {
      await pickDate(page, 'job-birth', 'জন্ম তারিখ', 1993, 3, '১৫ মার্চ ১৯৯৩')
      await expect(resultValue(page)).toHaveText('সীমা পার ✗')
      await page.getByRole('button', { name: '৩৫ বছর' }).click()
      await expect(resultValue(page)).toHaveText('যোগ্য ✓')
    },
    query: /\/tools\/job-age-limit\?birth=1993-03-15&max=35$/,
    async restored(page) {
      await expect(page.getByRole('button', { name: '৩৫ বছর' })).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('[data-result-card]')).toContainText('সীমা ৩৫ বছর')
    },
  },
  ldTypes: ['BreadcrumbList', 'WebApplication'],
})
