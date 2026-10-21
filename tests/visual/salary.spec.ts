// Salary breakdown (Figma C5 28:7512, D · C5 68:5723).
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'salary',
  path: '/tools/salary',
  h1: 'বেতন ভাগ',
  enH1: 'Salary breakdown',
  modes: { default: '', error: '?rent=70' },
  async expectMode(page, mode) {
    if (mode === 'error') {
      await expect(page.locator('[data-result-error] h2')).toHaveText('ভাগগুলো মোট বেতনের চেয়ে বেশি')
      await expect(page.locator('[data-result-fix]')).toHaveText('বাড়িভাড়া ৫৬% দিয়ে হিসাব করো')
      return
    }
    await expect(resultValue(page)).toHaveText('৳৩০,০০০')
    await expect(page.locator('[data-result-card]')).toContainText('মোট ৳৫০,০০০ এর ৬০%')
    for (const text of ['বাড়িভাড়া (বেসিকের ৫০%)', '৳১৫,০০০', 'মেডিকেল (বেসিকের ১০%)', '৳৩,০০০', 'যাতায়াত', '৳২,০০০']) {
      await expect(page.locator('[data-summary]')).toContainText(text)
    }
  },
  value: '৳৩০,০০০',
  enValue: '৳30,000',
  share: {
    async fill(page) {
      await page.locator('#salary-gross').fill('80000')
      await expect(resultValue(page)).toHaveText('৳৪৮,০০০')
    },
    query: /\/tools\/salary\?gross=80000$/,
    async restored(page) {
      await expect(page.locator('#salary-gross')).toHaveValue('৮০,০০০')
      await expect(resultValue(page)).toHaveText('৳৪৮,০০০')
    },
  },
  ldTypes: ['BreadcrumbList', 'WebApplication'],
})
