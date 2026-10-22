// Hijri date (Figma D4 29:8587, D · D4 68:7511). Clock frozen at Figma's today (19 Oct 2026).
// Figma D4 shows ৮ জমাদিউল আউয়াল (raw Umm al-Qura); the data offset -1 gives ৭.
import { expect } from '@playwright/test'
import { FIGMA_TODAY } from './dates'
import { resultValue, toolSuite } from './tool-suite'

toolSuite({
  id: 'hijri-date',
  path: '/tools/hijri-date',
  h1: 'হিজরি তারিখ',
  enH1: 'Hijri date',
  clock: FIGMA_TODAY,
  modes: { today: '', plus: '?adj=1' },
  async expectMode(page, mode) {
    if (mode === 'plus') {
      await expect(resultValue(page)).toHaveText('৮ জমাদিউল আউয়াল')
      return
    }
    await expect(resultValue(page)).toHaveText('৭ জমাদিউল আউয়াল')
    await expect(page.locator('[data-result-card]')).toContainText('১৪৪৮ হিজরি · চাঁদ দেখার উপর ±১ দিন হতে পারে')
    await expect(page.locator('[data-summary] h2')).toHaveText('আজ')
    await expect(page.locator('[data-summary]')).toContainText('৩ কার্তিক ১৪৩৩')
  },
  value: '৭ জমাদিউল আউয়াল',
  enValue: '7 Jumada al-Awwal',
  noJsValue: /^[০-৯]+ \S/,
  share: {
    async fill(page) {
      await page.getByRole('button', { name: '+১ দিন' }).click()
      await expect(resultValue(page)).toHaveText('৮ জমাদিউল আউয়াল')
    },
    query: /\/tools\/hijri-date\?adj=1$/,
    async restored(page) {
      await expect(page.getByRole('button', { name: '+১ দিন' })).toHaveAttribute('aria-pressed', 'true')
      await expect(resultValue(page)).toHaveText('৮ জমাদিউল আউয়াল')
    },
  },
  ldTypes: ['BreadcrumbList', 'WebApplication'],
})
