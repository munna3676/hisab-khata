// Mobile data pack (Figma C8 29:7863, D · C8 68:6553).
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'data-pack',
  path: '/tools/data-pack',
  h1: 'মোবাইল ডেটা প্যাক তুলনা',
  enH1: 'Mobile data pack comparison',
  modes: { default: '', none: '?budget=50' },
  async expectMode(page, mode) {
    if (mode === 'none') {
      await expect(page.locator('[data-result-error] h2')).toHaveText('এই বাজেটে ৩০ দিনের কোনো প্যাক নেই')
      await expect(page.locator('[data-result-fix]')).toHaveText('৳১৪৩ দিয়ে হিসাব করো')
      return
    }
    await expect(resultValue(page)).toHaveText('৩০ GB')
    await expect(page.locator('[data-result-card]')).toContainText('জিপি · ৳৩৯৯ · ৩০ দিন (দিনে ১ GB)')
    await expect(page.locator('[data-breakdown-table]')).toContainText('৳৪০০ বা কমে ৩০ দিনের প্যাক')
    await expect(page.locator('[data-breakdown-table]')).toContainText('রবি, বাংলালিংক, টেলিটক')
    await expect(page.locator('[data-breakdown-table] tbody tr')).toHaveCount(4)
  },
  value: '৩০ GB',
  enValue: '30 GB',
  share: {
    async fill(page) {
      await page.getByRole('button', { name: '৭ দিন' }).click()
      await expect(resultValue(page)).toHaveText('৫ GB')
    },
    query: /\/tools\/data-pack\?days=7$/,
    async restored(page) {
      await expect(page.getByRole('button', { name: '৭ দিন' })).toHaveAttribute('aria-pressed', 'true')
      await expect(resultValue(page)).toHaveText('৫ GB')
    },
  },
  ldTypes: ['BreadcrumbList', 'WebApplication'],
})
