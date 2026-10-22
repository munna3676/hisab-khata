// Bangla date converter (Figma D3 29:8406, D5-b 60:18179, D · D3 68:7265, D · D5-b 69:38230).
import { expect } from '@playwright/test'
import { FIGMA_TODAY } from './dates'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'bangla-date',
  path: '/tools/bangla-date',
  h1: 'বাংলা তারিখ কনভার্টার',
  enH1: 'Bangla date converter',
  clock: FIGMA_TODAY,
  modes: { 'to-bn': '', 'to-en': '?dir=to-en', 'no-day': '?dir=to-en&bdate=1433-07-31', picker: '' },
  async expectMode(page, mode) {
    if (mode === 'no-day') {
      await expect(page.locator('[data-result-error] h2')).toHaveText('কার্তিক মাসে ৩০ দিন')
      return
    }
    if (mode === 'to-en') {
      await expect(resultValue(page)).toHaveText('১৪ এপ্রিল ২০২৭')
      await expect(page.locator('[data-result-card]')).toContainText('বুধবার · গ্রীষ্মকাল · পহেলা বৈশাখ')
      await expect(page.locator('[data-summary]')).toContainText('৬ জিলকদ ১৪৪৮')
      return
    }
    await expect(resultValue(page)).toHaveText('১ পৌষ ১৪৩৩')
    await expect(page.locator('[data-result-card]')).toContainText('বুধবার · শীতকাল · বিজয় দিবস')
    // Figma D3 shows ৭ রজব (Umm al-Qura); the data offset -1 (Bangladesh moon sighting) gives ৬ রজব.
    await expect(page.locator('[data-summary]')).toContainText('৬ রজব ১৪৪৮')
    if (mode === 'picker') {
      await page.locator('#bd-date').click()
      await expect(page.getByRole('dialog', { name: 'ইংরেজি তারিখ' })).toBeVisible()
      await page.waitForTimeout(400)
    }
  },
  value: '১ পৌষ ১৪৩৩',
  enValue: '1 Poush 1433',
  share: {
    async fill(page) {
      await page.getByRole('radio', { name: 'বাংলা → ইংরেজি' }).check({ force: true })
      await page.getByLabel('দিন', { exact: true }).selectOption('15')
      await expect(resultValue(page)).toHaveText('২৮ এপ্রিল ২০২৭')
    },
    query: /\/tools\/bangla-date\?dir=to-en&bdate=1434-01-15$/,
    async restored(page) {
      await expect(page.getByRole('radio', { name: 'বাংলা → ইংরেজি' })).toBeChecked()
      await expect(resultValue(page)).toHaveText('২৮ এপ্রিল ২০২৭')
    },
  },
  ldTypes: ['BreadcrumbList', 'WebApplication'],
})
