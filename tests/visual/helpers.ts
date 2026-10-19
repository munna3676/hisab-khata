import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'

export type Theme = 'light' | 'dark'
export const THEMES: Theme[] = ['light', 'dark']
/** Figma frames: mobile 390, desktop 1440 (1080 content column). */
export const WIDTHS = [390, 1440] as const
export const heightFor = (width: number) => (width < 600 ? 844 : 900)

/** Gallery section id from SECTION=base|nav|content|overlay (or any src/gallery/<id>.astro); unset = whole gallery. */
export const SECTION = process.env.SECTION?.replace(/^#/, '') || undefined

export const ROOT = fileURLToPath(new URL('../../', import.meta.url))
export const shotPath = (name: string) => join(ROOT, 'test-results', 'gallery', SECTION ?? 'all', name)

/** Theme + motion are set the way the app sets them: localStorage read by the pre-paint script. */
export async function prepare(page: Page, theme: Theme, motion: 'full' | 'lite' | 'reduce' = 'full') {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: motion === 'reduce' ? 'reduce' : 'no-preference' })
  await page.addInitScript(
    ([t, m]) => {
      localStorage.setItem('hk-theme', t)
      localStorage.setItem('hk-motion', m)
    },
    [theme, motion] as const,
  )
}

/** Waits for web fonts and for every client:load/idle island to hydrate. */
export async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  await page.waitForFunction(() =>
    [...document.querySelectorAll('astro-island')].every(
      (el) => !el.hasAttribute('ssr') || el.getAttribute('client') === 'visible' || el.getAttribute('client') === 'only',
    ),
  )
}
