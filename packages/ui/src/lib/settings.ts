// Theme and motion settings shared by the pre-paint script, the gallery
// toggles and (later) the settings screen. Stored per device in localStorage;
// the effective values live on <html data-theme="light|dark" data-motion="full|lite|reduce">.

export const THEME_KEY = 'hk-theme'
export const MOTION_KEY = 'hk-motion'

export type ThemeSetting = 'system' | 'light' | 'dark'
export type Theme = 'light' | 'dark'
export type MotionSetting = 'auto' | 'full' | 'lite' | 'reduce'
export type MotionMode = 'full' | 'lite' | 'reduce'

/** What the device reports; injected so the logic is testable. */
export interface DeviceEnv {
  prefersDark: boolean
  prefersReducedMotion: boolean
  /** deviceMemory <= 2, hardwareConcurrency <= 4 or Save-Data (docs/decisions/0001-stack.md, Low-end phones). */
  lowEnd: boolean
}

export const SETTINGS_EVENT = 'hk:settings'

export function resolveTheme(setting: string | null | undefined, env: DeviceEnv): Theme {
  if (setting === 'light' || setting === 'dark') return setting
  return env.prefersDark ? 'dark' : 'light'
}

export function resolveMotion(setting: string | null | undefined, env: DeviceEnv): MotionMode {
  if (setting === 'full' || setting === 'lite' || setting === 'reduce') return setting
  if (env.prefersReducedMotion) return 'reduce'
  return env.lowEnd ? 'lite' : 'full'
}

/**
 * Inline <head> script (no imports, ES5) that sets data-theme and data-motion
 * before first paint, then follows system changes while the setting is
 * system/auto. Must match resolveTheme/resolveMotion (see test/settings.test.ts).
 */
export const PRE_PAINT_SCRIPT = `(function(){var d=document.documentElement,w=window;
function get(k){try{return w.localStorage.getItem(k)}catch(e){return null}}
function mq(q){return !!(w.matchMedia&&w.matchMedia(q).matches)}
function low(){var n=navigator;return (n.deviceMemory>0&&n.deviceMemory<=2)||(n.hardwareConcurrency>0&&n.hardwareConcurrency<=4)||!!(n.connection&&n.connection.saveData)}
function theme(){var t=get('${THEME_KEY}');d.setAttribute('data-theme',t==='light'||t==='dark'?t:mq('(prefers-color-scheme: dark)')?'dark':'light')}
function motion(){var m=get('${MOTION_KEY}');d.setAttribute('data-motion',m==='full'||m==='lite'||m==='reduce'?m:mq('(prefers-reduced-motion: reduce)')?'reduce':low()?'lite':'full')}
theme();motion();
try{w.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',theme);w.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',motion)}catch(e){}
})()`

const hasDom = () => typeof document !== 'undefined' && typeof window !== 'undefined'

export function deviceEnv(): DeviceEnv {
  if (!hasDom()) return { prefersDark: false, prefersReducedMotion: false, lowEnd: false }
  const mq = (q: string) => !!window.matchMedia?.(q).matches
  const n = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  return {
    prefersDark: mq('(prefers-color-scheme: dark)'),
    prefersReducedMotion: mq('(prefers-reduced-motion: reduce)'),
    lowEnd:
      (!!n.deviceMemory && n.deviceMemory <= 2) ||
      (!!n.hardwareConcurrency && n.hardwareConcurrency <= 4) ||
      !!n.connection?.saveData,
  }
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    /* private mode: the setting lasts for this page only */
  }
}

export function getThemeSetting(): ThemeSetting {
  const v = hasDom() ? read(THEME_KEY) : null
  return v === 'light' || v === 'dark' ? v : 'system'
}

export function getMotionSetting(): MotionSetting {
  const v = hasDom() ? read(MOTION_KEY) : null
  return v === 'full' || v === 'lite' || v === 'reduce' ? v : 'auto'
}

/** Effective theme on <html>, falling back to the system when the attribute is missing. */
export function currentTheme(): Theme {
  if (!hasDom()) return 'light'
  const t = document.documentElement.dataset.theme
  return t === 'dark' || t === 'light' ? t : resolveTheme(null, deviceEnv())
}

/** Effective motion mode on <html>, falling back to the system when the attribute is missing. */
export function currentMotion(): MotionMode {
  if (!hasDom()) return 'full'
  const m = document.documentElement.dataset.motion
  return m === 'full' || m === 'lite' || m === 'reduce' ? m : resolveMotion(null, deviceEnv())
}

function announce() {
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: { theme: currentTheme(), motion: currentMotion() } }))
}

export function setThemeSetting(setting: ThemeSetting) {
  if (!hasDom()) return
  write(THEME_KEY, setting === 'system' ? null : setting)
  document.documentElement.dataset.theme = resolveTheme(setting, deviceEnv())
  announce()
}

export function setMotionSetting(setting: MotionSetting) {
  if (!hasDom()) return
  write(MOTION_KEY, setting === 'auto' ? null : setting)
  document.documentElement.dataset.motion = resolveMotion(setting, deviceEnv())
  announce()
}
