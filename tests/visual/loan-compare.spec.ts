// "দুটো লোন অফার তুলনা" (Figma F10 27:6681, D · F10 66:30163).
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'loan-compare',
  path: '/tools/loan-compare',
  h1: 'দুটো লোন অফার তুলনা',
  enH1: 'Compare two loan offers',
  modes: { default: '', 'a-cheaper': '?br=12&bf=1.5' },
  async expectMode(page, mode) {
    if (mode === 'a-cheaper') {
      await expect(page.locator('[data-result-card]')).toContainText('অফার A সস্তা')
      return
    }
    // Figma shows ৳৩,৫৭৪ (B's interest from the whole-taka EMI); the engine gives ৳৩,৫৬১.
    await expect(resultValue(page)).toHaveText('৳৩,৫৬১ কম')
    await expect(page.locator('[data-offer-row="cost"] [data-lowest]')).toHaveText(/৯৯,২৯৭/)
    await expect(page.locator('[data-offer-row="fee"] [data-lowest]')).toHaveText(/৫,০০০/)
  },
  value: '৳৩,৫৬১ কম',
  enValue: '৳3,561 less',
  share: {
    async fill(page) {
      await page.locator('#loan-compare-br').fill('10.5')
      await page.locator('#loan-compare-bf').fill('1.5')
    },
    query: /\/tools\/loan-compare\?br=10\.5&bf=1\.5$/,
    async restored(page) {
      await expect(page.locator('#loan-compare-br')).toHaveValue('১০.৫০') // NumberField writes a restored fraction with two decimals
      await expect(page.locator('[data-result-card]')).toContainText('অফার B সস্তা')
    },
  },
  ldTypes: ['BreadcrumbList', 'WebApplication'],
})
