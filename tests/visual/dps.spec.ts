// DPS (Figma F7 27:6030, F7-b quarterly 64:21115, D · F7 66:29288, D · F7-b 69:39346).
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'dps',
  path: '/tools/dps',
  h1: 'DPS মুনাফা ক্যালকুলেটর',
  enH1: 'DPS profit calculator',
  modes: { monthly: '', quarterly: '?comp=quarterly' },
  async expectMode(page, mode) {
    const quarterly = mode === 'quarterly'
    await expect(resultValue(page)).toHaveText(quarterly ? '৳৩,৭১,৩৫০' : '৳৩,৭১,৯৫৪')
    await expect(page.locator('[data-summary]')).toContainText(quarterly ? '৳৭৯,২৭৮' : '৳৭৯,৯৪৯')
    await expect(page.locator('[data-result-card]')).toContainText(quarterly ? '৩ মাস পরপর মুনাফা যোগ' : '৬০ মাস পর, কর কাটার পর')
    await expect(page.getByRole('radio', { name: quarterly ? 'ত্রৈমাসিক' : 'মাসিক', exact: true })).toBeChecked()
    await expect(page.getByText('সাধারণত TIN থাকলে ১০%, না থাকলে ১৫%।')).toBeVisible()
  },
  value: '৳৩,৭১,৯৫৪',
  enValue: '৳3,71,954',
  share: {
    async fill(page) {
      await page.locator('#dps-deposit').fill('3000')
      await page.getByRole('radio', { name: 'ত্রৈমাসিক' }).check({ force: true })
    },
    query: /\/tools\/dps\?deposit=3000&comp=quarterly$/,
    async restored(page) {
      await expect(page.locator('#dps-deposit')).toHaveValue('৩,০০০')
      await expect(page.getByRole('radio', { name: 'ত্রৈমাসিক' })).toBeChecked()
      await expect(resultValue(page)).toHaveText('৳২,২২,৮১০')
    },
  },
  ldTypes: ['BreadcrumbList', 'FAQPage', 'WebApplication'],
  schedule: { rows: 5 },
})
