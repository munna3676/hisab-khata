import { createCapacitorPlatform, type CapacitorPlugins } from './capacitor.ts'
import { useNativePlatform } from './index.ts'

// The app's side of @hisab/platform: only the app shell imports this module (with
// src/capacitor-plugins.ts), so the Capacitor implementation never reaches the website's bundle.

/**
 * Registers the Capacitor plugin loaders (from src/capacitor-plugins.ts). The app calls this once
 * at start-up, before anything calls getPlatform(); the website never does.
 */
export function usePlugins(loaders: CapacitorPlugins | undefined): void {
  useNativePlatform(loaders ? () => createCapacitorPlatform(loaders) : undefined)
}
