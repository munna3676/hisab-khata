// Profit margin (Figma C3 28:7145, D · C3 68:5225).
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'profit-margin',
  path: '/tools/profit-margin',
  h1: 'লাভের মার্জিন ক্যালকুলেটর',
  enH1: 'Profit margin calculator',
  modes: { default: '', loss: '?cost=1000&price=800' },
  async expectMode(page, mode) {
    if (mode === 'loss') {
      await expect(page.locator('[data-result-card]')).toContainText('ক্ষতি')
      await expect(resultValue(page)).toHaveText('৳২০০')
      return
    }
    await expect(resultValue(page)).toHaveText('৳২০০')
    await expect(page.locator('[data-result-card]')).toContainText('মার্জিন ২০% · মার্কআপ ২৫%')
    await expect(page.locator('[data-summary]')).toContainText('মার্কআপ (লাভ ÷ কেনা দাম)')
    await expect(page.locator('[data-target]')).toContainText('৳১,১৪৩')
  },
  value: '৳২০০',
  enValue: '৳200',
  share: {
    async fill(page) {
      await page.locator('#profit-cost').fill('650')
      await expect(resultValue(page)).toHaveText('৳৩৫০')
    },
    query: /\/tools\/profit-margin\?cost=650$/,
    async restored(page) {
      await expect(page.locator('#profit-cost')).toHaveValue('৬৫০')
      await expect(resultValue(page)).toHaveText('৳৩৫০')
    },
  },
  ldTypes: ['BreadcrumbList', 'WebApplication'],
})
