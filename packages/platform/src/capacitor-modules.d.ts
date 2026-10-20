// Stand-in declarations for the Capacitor 8 plugins, which are not installed yet (they arrive with
// apps/app). They describe only what src/capacitor.ts calls. TypeScript prefers a real package
// over these once it is installed, and src/capacitor-plugins.ts then checks the real types against
// the local interfaces; delete this file at that point.

declare module '@capacitor/share' {
  export const Share: import('./capacitor.ts').SharePlugin
}
declare module '@capacitor/haptics' {
  export const Haptics: import('./capacitor.ts').HapticsPlugin
}
declare module '@capacitor/preferences' {
  export const Preferences: import('./capacitor.ts').PreferencesPlugin
}
declare module '@capacitor/filesystem' {
  export const Filesystem: import('./capacitor.ts').FilesystemPlugin
}
declare module '@capacitor/local-notifications' {
  export const LocalNotifications: import('./capacitor.ts').LocalNotificationsPlugin
}
declare module '@capacitor/browser' {
  export const Browser: import('./capacitor.ts').BrowserPlugin
}
declare module '@capacitor/network' {
  export const Network: import('./capacitor.ts').NetworkPlugin
}
declare module '@capacitor/app' {
  export const App: import('./capacitor.ts').AppPlugin
}
