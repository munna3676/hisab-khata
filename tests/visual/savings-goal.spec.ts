// "সঞ্চয় লক্ষ্য" (Figma C4 28:7332, D · C4 68:5478).
import { expect } from '@playwright/test'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'savings-goal',
  path: '/tools/savings-goal',
  h1: 'সঞ্চয় লক্ষ্য',
  enH1: 'Savings goal',
  modes: { default: '', wedding: '?goal=wedding' },
  async expectMode(page, mode) {
    await expect(resultValue(page)).toHaveText('৳১৯,৬৬০')
    // Figma writes ৳২০,৮৩৪; the engine rounds 5,00,000 / 24 to ৳২০,৮৩৩.
    await expect(page.locator('[data-result-card]')).toContainText('মুনাফা ছাড়া লাগত ৳২০,৮৩৩')
    await expect(page.locator('[data-summary]')).toContainText('৳৪,৭১,৮৪০')
    if (mode === 'wedding') await expect(page.getByRole('button', { name: 'বিয়ে' })).toHaveAttribute('aria-pressed', 'true')
  },
  value: '৳১৯,৬৬০',
  enValue: '৳19,660',
  share: {
    async fill(page) {
      await page.locator('#goal-target').fill('300000')
      await page.locator('#goal-months').fill('12')
      await page.getByRole('button', { name: 'বাইক' }).click()
    },
    query: /\/tools\/savings-goal\?target=300000&months=12&goal=bike$/,
    async restored(page) {
      await expect(page.locator('#goal-target')).toHaveValue('৩,০০,০০০')
      await expect(page.getByRole('button', { name: 'বাইক' })).toHaveAttribute('aria-pressed', 'true')
      await expect(resultValue(page)).toHaveText('৳২৪,৩২০')
    },
  },
  ldTypes: ['BreadcrumbList', 'WebApplication'],
})
