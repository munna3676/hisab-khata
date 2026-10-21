import type { CapacitorGlobal } from './capacitor.ts'
import type { Platform } from './types.ts'
import { createWebPlatform } from './web.ts'

// @hisab/platform: share, haptic, print, notify, store, openExternal, network and appInfo behind
// one API, with a web implementation (src/web.ts) and a Capacitor one (src/capacitor.ts).
// Components call getPlatform(); the app's entry calls usePlugins(capacitorPlugins) from
// src/native.ts first. This module never imports the Capacitor code, so the website's bundle
// carries only the web implementation.

export type * from './types.ts'
export type { KeyValueStore } from './store.ts'
export { collectionsFor } from './collections.ts'

let createNative: (() => Platform) | undefined
let current: Platform | undefined

/** True inside the iOS/Android app (Capacitor's runtime says so), false in a browser. */
export function isNativePlatform(): boolean {
  const capacitor = (globalThis as { Capacitor?: CapacitorGlobal }).Capacitor
  return capacitor?.isNativePlatform?.() === true
}

/**
 * Registers how to build the native platform (src/native.ts usePlugins does this with the
 * Capacitor plugin loaders); undefined removes it.
 */
export function useNativePlatform(create: (() => Platform) | undefined): void {
  createNative = create
  current = undefined
}

/**
 * The platform for this runtime, created once: Capacitor inside the native app, the web
 * implementation everywhere else. Inside the app without usePlugins() it falls back to the web
 * implementation (and says so in the console) rather than failing.
 */
export function getPlatform(): Platform {
  if (!current) {
    if (isNativePlatform() && createNative) current = createNative()
    else {
      if (isNativePlatform()) console.warn('@hisab/platform: usePlugins() (src/native.ts) was not called; using the web platform')
      current = createWebPlatform()
    }
  }
  return current
}

/** Replaces the platform (tests, Storybook-style galleries); undefined goes back to auto-detection. */
export function setPlatform(platform: Platform | undefined): void {
  current = platform
}
