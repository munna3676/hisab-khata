// Land converter (Figma L1 31:8623, P3 পিকার 59:16558, D · L1 68:8014, D · P3 70:19840).
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'land-converter',
  path: '/tools/land-converter',
  h1: 'জমি মাপের কনভার্টার',
  enH1: 'Land measurement converter',
  modes: { default: '', picker: '', custom: '?area=custom&ks=726' },
  async expectMode(page, mode) {
    if (mode === 'custom') {
      await expect(page.locator('#land-ks')).toHaveValue('৭২৬')
      await expect(page.locator('[data-result-card]')).toContainText('৭২৬ বর্গফুটের কাঠায়')
      return
    }
    await expect(resultValue(page)).toHaveText('৪,৩৫৬ বর্গফুট')
    await expect(page.locator('[data-result-card]')).toContainText('৬.০৫ কাঠা (ঢাকা মাপে) · ০.১০ একর')
    await expect(page.locator('[data-unit-row="sqm"]')).toContainText('৪০৪.৭')
    await expect(page.locator('[data-unit-row="decimal"]')).toHaveAttribute('aria-current', 'true')
    if (mode === 'picker') {
      await page.locator('#land-unit').click()
      const sheet = page.getByRole('dialog', { name: 'কোন একক থেকে?' })
      await expect(sheet).toBeVisible()
      await expect(sheet.getByRole('option')).toHaveCount(6)
      await expect(sheet.getByRole('option', { name: /১ কাঠা = ৭২০ বর্গফুট = ১.৬৫ শতাংশ/ })).toBeVisible()
      await page.waitForTimeout(400)
    }
  },
  value: '৪,৩৫৬ বর্গফুট',
  enValue: '4,356 sq ft',
  share: {
    async fill(page) {
      await page.locator('#land-n').fill('5')
      await page.locator('#land-unit').click()
      await page.getByRole('option', { name: /^কাঠা/ }).click()
      await expect(page.getByRole('dialog')).toBeHidden()
      await expect(resultValue(page)).toHaveText('৩,৬০০ বর্গফুট')
    },
    query: /\/tools\/land-converter\?n=5&unit=katha$/,
    async restored(page) {
      await expect(page.locator('#land-n')).toHaveValue('৫')
      await expect(page.locator('#land-unit')).toContainText('কাঠা')
      await expect(resultValue(page)).toHaveText('৩,৬০০ বর্গফুট')
    },
  },
  ldTypes: ['BreadcrumbList', 'FAQPage', 'WebApplication'],
})
