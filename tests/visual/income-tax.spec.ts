// Income tax (Figma C6 28:7708, C6-b ফ্রিল্যান্সার 64:21554, D · C6 68:6010, D · C6-b 69:39942).
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'income-tax',
  path: '/tools/income-tax',
  h1: 'আয়কর ক্যালকুলেটর',
  enH1: 'Income tax calculator',
  modes: { salaried: '', freelancer: '?mode=freelancer' },
  async expectMode(page, mode) {
    const freelancer = mode === 'freelancer'
    await expect(resultValue(page)).toHaveText('৳৪৫,০০০')
    await expect(page.locator('[data-result-card]')).toContainText(
      freelancer ? 'ফ্রিল্যান্সার কর-ছাড়ের প্রস্তাব পাস হলে ৳০' : 'স্ল্যাবে ৳৬০,০০০ − বিনিয়োগ রিবেট ৳১৫,০০০ · ন্যূনতম কর ৳৫,০০০',
    )
    await expect(page.locator('[data-breakdown-table]')).toContainText('স্ল্যাব অনুযায়ী (সাধারণ করদাতা)')
    await expect(page.locator('[data-breakdown-table] tbody tr')).toHaveCount(3)
    await expect(page.getByRole('radio', { name: freelancer ? 'ফ্রিল্যান্সার' : 'চাকরিজীবী' })).toBeChecked()
    await expect(page.locator('[data-tool-callout]')).toContainText(freelancer ? 'ব্যাংকিং চ্যানেলে' : '৪,২৫,০০০')
  },
  value: '৳৪৫,০০০',
  enValue: '৳45,000',
  share: {
    async fill(page) {
      await page.locator('#tax-income').fill('1200000')
      await expect(resultValue(page)).toHaveText('৳৯৫,০০০')
    },
    query: /\/tools\/income-tax\?income=1200000$/,
    async restored(page) {
      await expect(page.locator('#tax-income')).toHaveValue('১২,০০,০০০')
      await expect(resultValue(page)).toHaveText('৳৯৫,০০০')
    },
  },
  ldTypes: ['BreadcrumbList', 'WebApplication'],
})
