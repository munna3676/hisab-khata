import type {
  AppPlugin,
  BrowserPlugin,
  CapacitorPlugins,
  FilesystemPlugin,
  HapticsPlugin,
  LocalNotificationsPlugin,
  NetworkPlugin,
  PreferencesPlugin,
  SharePlugin,
} from './capacitor.ts'

// The real plugin loaders, for the app build only (apps/app imports this file and passes it to
// usePlugins() in src/index.ts). The website never imports it, so its bundle never references
// @capacitor/*. Each plugin is a separate dynamic import, so Vite splits it into its own chunk.
// Assigning to the local interface type checks the installed plugin's API against what
// src/capacitor.ts expects.

export const capacitorPlugins: CapacitorPlugins = {
  share: async (): Promise<SharePlugin> => (await import('@capacitor/share')).Share,
  haptics: async (): Promise<HapticsPlugin> => (await import('@capacitor/haptics')).Haptics,
  preferences: async (): Promise<PreferencesPlugin> => (await import('@capacitor/preferences')).Preferences,
  filesystem: async (): Promise<FilesystemPlugin> => (await import('@capacitor/filesystem')).Filesystem,
  localNotifications: async (): Promise<LocalNotificationsPlugin> =>
    (await import('@capacitor/local-notifications')).LocalNotifications,
  browser: async (): Promise<BrowserPlugin> => (await import('@capacitor/browser')).Browser,
  network: async (): Promise<NetworkPlugin> => (await import('@capacitor/network')).Network,
  app: async (): Promise<AppPlugin> => (await import('@capacitor/app')).App,
}
