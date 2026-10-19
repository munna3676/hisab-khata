import { afterEach, describe, expect, it } from 'vitest'
import {
  MOTION_KEY,
  PRE_PAINT_SCRIPT,
  THEME_KEY,
  resolveMotion,
  resolveTheme,
  setMotionSetting,
  setThemeSetting,
  type DeviceEnv,
} from '../src/lib/settings'

function fakeDevice(env: DeviceEnv) {
  window.matchMedia = ((q: string) => ({
    matches: q.includes('color-scheme: dark') ? env.prefersDark : q.includes('reduced-motion') ? env.prefersReducedMotion : false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
  Object.defineProperty(navigator, 'hardwareConcurrency', { value: env.lowEnd ? 2 : 8, configurable: true })
}

const runPrePaint = () => new Function(PRE_PAINT_SCRIPT)()
const html = () => document.documentElement

afterEach(() => {
  localStorage.clear()
  html().removeAttribute('data-theme')
  html().removeAttribute('data-motion')
})

const envs: DeviceEnv[] = []
for (const prefersDark of [false, true])
  for (const prefersReducedMotion of [false, true])
    for (const lowEnd of [false, true]) envs.push({ prefersDark, prefersReducedMotion, lowEnd })

describe('pre-paint script matches resolveTheme/resolveMotion', () => {
  for (const env of envs) {
    for (const theme of [null, 'light', 'dark', 'bogus']) {
      for (const motion of [null, 'full', 'lite', 'reduce']) {
        it(`${JSON.stringify(env)} theme=${theme} motion=${motion}`, () => {
          fakeDevice(env)
          if (theme) localStorage.setItem(THEME_KEY, theme)
          if (motion) localStorage.setItem(MOTION_KEY, motion)
          runPrePaint()
          expect(html().dataset.theme).toBe(resolveTheme(theme, env))
          expect(html().dataset.motion).toBe(resolveMotion(motion, env))
        })
      }
    }
  }
})

describe('setters', () => {
  it('store the setting and update <html>', () => {
    fakeDevice({ prefersDark: true, prefersReducedMotion: false, lowEnd: false })
    setThemeSetting('light')
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
    expect(html().dataset.theme).toBe('light')
    setThemeSetting('system')
    expect(localStorage.getItem(THEME_KEY)).toBeNull()
    expect(html().dataset.theme).toBe('dark')
    setMotionSetting('reduce')
    expect(html().dataset.motion).toBe('reduce')
    setMotionSetting('auto')
    expect(localStorage.getItem(MOTION_KEY)).toBeNull()
    expect(html().dataset.motion).toBe('full')
  })
})
