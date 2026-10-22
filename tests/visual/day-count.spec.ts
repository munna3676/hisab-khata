// Day count (Figma D5 31:8462, D · D5 68:7759). Clock frozen at Figma's today (the শেষ তারিখ default).
import { expect } from '@playwright/test'
import { FIGMA_TODAY } from './dates'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'day-count',
  path: '/tools/day-count',
  h1: 'দিন গণনা',
  enH1: 'Day count',
  clock: FIGMA_TODAY,
  modes: { default: '', 'with-end': '?inc=yes' },
  async expectMode(page, mode) {
    if (mode === 'with-end') {
      await expect(resultValue(page)).toHaveText('২৯২ দিন')
      return
    }
    await expect(resultValue(page)).toHaveText('২৯১ দিন')
    await expect(page.locator('[data-result-card]')).toContainText('৪১ সপ্তাহ ৪ দিন · শেষ দিন গুনলে ২৯২ দিন')
    await expect(page.locator('[data-summary]')).toContainText('৯ মাস ১৮ দিন')
    await expect(page.locator('[data-summary]')).toContainText('৬,৯৮৪')
  },
  value: '২৯১ দিন',
  enValue: '291 days',
  noJsValue: /দিন$/,
  share: {
    async fill(page) {
      await page.getByRole('button', { name: 'হ্যাঁ' }).click()
      await expect(resultValue(page)).toHaveText('২৯২ দিন')
    },
    query: /\/tools\/day-count\?inc=yes$/,
    async restored(page) {
      await expect(page.getByRole('button', { name: 'হ্যাঁ' })).toHaveAttribute('aria-pressed', 'true')
      await expect(resultValue(page)).toHaveText('২৯২ দিন')
    },
  },
  ldTypes: ['BreadcrumbList', 'WebApplication'],
})
