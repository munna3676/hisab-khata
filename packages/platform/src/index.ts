import { createCapacitorPlatform, type CapacitorGlobal, type CapacitorPlugins } from './capacitor.ts'
import type { Platform } from './types.ts'
import { createWebPlatform } from './web.ts'

// @hisab/platform: share, haptic, print, notify, store, openExternal, network and appInfo behind
// one API, with a web implementation (src/web.ts) and a Capacitor one (src/capacitor.ts).
// Components call getPlatform(); the app's entry calls usePlugins(capacitorPlugins) first.

export type * from './types.ts'
export type { KeyValueStore } from './store.ts'
export { collectionsFor } from './collections.ts'

let plugins: CapacitorPlugins | undefined
let current: Platform | undefined

/** True inside the iOS/Android app (Capacitor's runtime says so), false in a browser. */
export function isNativePlatform(): boolean {
  const capacitor = (globalThis as { Capacitor?: CapacitorGlobal }).Capacitor
  return capacitor?.isNativePlatform?.() === true
}

/**
 * Registers the Capacitor plugin loaders (from src/capacitor-plugins.ts). The app calls this once
 * at start-up, before anything calls getPlatform(); the website never does.
 */
export function usePlugins(loaders: CapacitorPlugins): void {
  plugins = loaders
  current = undefined
}

/**
 * The platform for this runtime, created once: Capacitor inside the native app, the web
 * implementation everywhere else. Inside the app without usePlugins() it falls back to the web
 * implementation (and says so in the console) rather than failing.
 */
export function getPlatform(): Platform {
  if (!current) {
    if (isNativePlatform() && plugins) current = createCapacitorPlatform(plugins)
    else {
      if (isNativePlatform()) console.warn('@hisab/platform: usePlugins() was not called; using the web platform')
      current = createWebPlatform()
    }
  }
  return current
}

/** Replaces the platform (tests, Storybook-style galleries); undefined goes back to auto-detection. */
export function setPlatform(platform: Platform | undefined): void {
  current = platform
}
