import { jsonStore, type KeyValueStore, type TextBackend } from './store.ts'
import {
  assertExternalUrl,
  type AppInfo,
  type ConnectionType,
  type HapticKind,
  type Network,
  type NetworkStatus,
  type Notifier,
  type NotifyPermission,
  type Platform,
  type ShareInput,
  type ShareOutcome,
} from './types.ts'

// The native implementation on Capacitor 8 plugins. The plugins are not dependencies of this
// package: each one is reached through a loader, typed by the small interfaces below (only the
// calls used here, as documented for @capacitor/share 8, haptics 8, preferences 8, filesystem 8,
// local-notifications 8, browser 8, network 8 and app 8). The app passes the real loaders from
// src/capacitor-plugins.ts; tests pass fakes. String values are the plugins' enum values
// (ImpactStyle.Light = 'LIGHT', Directory.Data = 'DATA', Encoding.UTF8 = 'utf8').

export interface PluginListenerHandle {
  remove(): Promise<void>
}

export interface SharePlugin {
  share(options: { title?: string; text?: string; url?: string; files?: string[]; dialogTitle?: string }): Promise<{
    activityType?: string
  }>
}

export interface HapticsPlugin {
  impact(options: { style: 'HEAVY' | 'MEDIUM' | 'LIGHT' }): Promise<void>
  notification(options: { type: 'SUCCESS' | 'WARNING' | 'ERROR' }): Promise<void>
  selectionStart(): Promise<void>
  selectionChanged(): Promise<void>
  selectionEnd(): Promise<void>
}

export interface PreferencesPlugin {
  get(options: { key: string }): Promise<{ value: string | null }>
  set(options: { key: string; value: string }): Promise<void>
  remove(options: { key: string }): Promise<void>
  keys(): Promise<{ keys: string[] }>
}

export type FilesystemDirectory = 'DATA' | 'CACHE' | 'DOCUMENTS' | 'LIBRARY'

export interface FilesystemPlugin {
  writeFile(options: {
    path: string
    data: string
    directory: FilesystemDirectory
    encoding?: 'utf8'
    recursive?: boolean
  }): Promise<{ uri: string }>
  readFile(options: { path: string; directory: FilesystemDirectory; encoding?: 'utf8' }): Promise<{ data: string | Blob }>
  deleteFile(options: { path: string; directory: FilesystemDirectory }): Promise<void>
  readdir(options: { path: string; directory: FilesystemDirectory }): Promise<{ files: { name: string }[] }>
}

type PermissionState = 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied'

export interface LocalNotificationsPlugin {
  schedule(options: {
    notifications: {
      id: number
      title: string
      body: string
      schedule?: { at?: Date; repeats?: boolean; every?: 'year' | 'month' | 'two-weeks' | 'week' | 'day'; allowWhileIdle?: boolean }
      extra?: unknown
    }[]
  }): Promise<{ notifications: { id: number }[] }>
  cancel(options: { notifications: { id: number }[] }): Promise<void>
  getPending(): Promise<{ notifications: { id: number }[] }>
  checkPermissions(): Promise<{ display: PermissionState }>
  requestPermissions(): Promise<{ display: PermissionState }>
}

export interface BrowserPlugin {
  open(options: { url: string; presentationStyle?: 'fullscreen' | 'popover' }): Promise<void>
}

export interface NetworkPlugin {
  getStatus(): Promise<{ connected: boolean; connectionType: 'wifi' | 'cellular' | 'none' | 'unknown' }>
  addListener(
    eventName: 'networkStatusChange',
    listener: (status: { connected: boolean; connectionType: 'wifi' | 'cellular' | 'none' | 'unknown' }) => void,
  ): Promise<PluginListenerHandle>
}

export interface AppPlugin {
  getInfo(): Promise<{ name: string; id: string; build: string; version: string }>
}

/** Optional: a print plugin (e.g. @capgo/capacitor-printer) for the WKWebView, where window.print does nothing. */
export interface PrinterPlugin {
  printWebView(options?: { name?: string }): Promise<void>
}

/** One loader per plugin, so a page that never shares never loads @capacitor/share. */
export interface CapacitorPlugins {
  share: () => Promise<SharePlugin>
  haptics: () => Promise<HapticsPlugin>
  preferences: () => Promise<PreferencesPlugin>
  filesystem: () => Promise<FilesystemPlugin>
  localNotifications: () => Promise<LocalNotificationsPlugin>
  browser: () => Promise<BrowserPlugin>
  network: () => Promise<NetworkPlugin>
  app: () => Promise<AppPlugin>
  printer?: () => Promise<PrinterPlugin>
}

/** The Capacitor runtime global the native shell injects. */
export interface CapacitorGlobal {
  isNativePlatform?(): boolean
  getPlatform?(): string
}

/** Caches each loader's promise so a plugin module is imported once. */
function once<T>(load: () => Promise<T>): () => Promise<T> {
  let loaded: Promise<T> | undefined
  return () => (loaded ??= load())
}

/** Small values in Preferences (UserDefaults / SharedPreferences, never evicted). */
export function preferencesBackend(load: () => Promise<PreferencesPlugin>): TextBackend {
  return {
    async read(key) {
      return (await (await load()).get({ key })).value
    },
    async write(key, value) {
      await (await load()).set({ key, value })
    },
    async delete(key) {
      await (await load()).remove({ key })
    },
    async list() {
      return (await (await load()).keys()).keys
    },
  }
}

/** Large values as files in the app's private data directory (store/<key>.json). */
export function filesystemBackend(load: () => Promise<FilesystemPlugin>, folder = 'store'): TextBackend {
  const pathOf = (key: string) => `${folder}/${encodeURIComponent(key)}.json`
  return {
    async read(key) {
      try {
        const { data } = await (await load()).readFile({ path: pathOf(key), directory: 'DATA', encoding: 'utf8' })
        return typeof data === 'string' ? data : await data.text()
      } catch {
        // readFile rejects when the file does not exist.
        return null
      }
    },
    async write(key, text) {
      await (await load()).writeFile({ path: pathOf(key), data: text, directory: 'DATA', encoding: 'utf8', recursive: true })
    },
    async delete(key) {
      try {
        await (await load()).deleteFile({ path: pathOf(key), directory: 'DATA' })
      } catch {
        // Already gone.
      }
    },
    async list() {
      try {
        const { files } = await (await load()).readdir({ path: folder, directory: 'DATA' })
        return files.map((file) => decodeURIComponent(file.name.replace(/\.json$/, '')))
      } catch {
        return []
      }
    },
  }
}

export function capacitorStore(plugins: Pick<CapacitorPlugins, 'preferences' | 'filesystem'>): KeyValueStore {
  return jsonStore(preferencesBackend(plugins.preferences), { large: filesystemBackend(plugins.filesystem) })
}

/** Blob → base64 without data: prefix, in chunks so a 1080×1080 PNG never overflows the call stack. */
export async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

async function nativeShare(plugins: CapacitorPlugins, input: ShareInput): Promise<ShareOutcome> {
  let files: string[] | undefined
  if (input.files?.length) {
    // The native share sheet takes file URIs, so the files are written to the cache first.
    const fs = await plugins.filesystem()
    files = []
    for (const file of input.files) {
      const { uri } = await fs.writeFile({
        path: `share/${file.name}`,
        data: await blobToBase64(file.data),
        directory: 'CACHE',
        recursive: true,
      })
      files.push(uri)
    }
  }
  try {
    await (await plugins.share()).share({ title: input.title, text: input.text, url: input.url, files, dialogTitle: input.title })
    return 'shared'
  } catch (error) {
    // Both platforms reject with "Share canceled" when the sheet is dismissed.
    if (/cancel/i.test(String((error as Error | null)?.message ?? error))) return 'cancelled'
    throw error
  }
}

async function nativeHaptic(plugins: CapacitorPlugins, kind: HapticKind): Promise<void> {
  try {
    const haptics = await plugins.haptics()
    if (kind === 'tap') await haptics.impact({ style: 'LIGHT' })
    else if (kind === 'selection') await haptics.selectionChanged()
    else await haptics.notification({ type: kind === 'success' ? 'SUCCESS' : kind === 'warning' ? 'WARNING' : 'ERROR' })
  } catch {
    // Haptics are a nicety; a device without a motor must never break a tap.
  }
}

function toPermission(state: PermissionState): NotifyPermission {
  return state === 'prompt-with-rationale' ? 'prompt' : state
}

export function capacitorNotifier(load: () => Promise<LocalNotificationsPlugin>): Notifier {
  return {
    async permission() {
      return toPermission((await (await load()).checkPermissions()).display)
    },
    async requestPermission() {
      const plugin = await load()
      const current = toPermission((await plugin.checkPermissions()).display)
      return current === 'prompt' ? toPermission((await plugin.requestPermissions()).display) : current
    },
    async schedule(reminders) {
      const plugin = await load()
      let state = toPermission((await plugin.checkPermissions()).display)
      if (state === 'prompt') state = toPermission((await plugin.requestPermissions()).display)
      if (state !== 'granted') return false
      await plugin.schedule({
        notifications: reminders.map((reminder) => ({
          id: reminder.id,
          title: reminder.title,
          body: reminder.body,
          schedule: reminder.repeat
            ? { at: reminder.at, repeats: true, every: reminder.repeat, allowWhileIdle: true }
            : { at: reminder.at, allowWhileIdle: true },
          extra: reminder.data,
        })),
      })
      return true
    },
    async cancel(ids) {
      if (ids.length) await (await load()).cancel({ notifications: ids.map((id) => ({ id })) })
    },
    async pending() {
      return (await (await load()).getPending()).notifications.map((n) => n.id)
    },
  }
}

export function capacitorNetwork(load: () => Promise<NetworkPlugin>): Network {
  const toStatus = (s: { connected: boolean; connectionType: ConnectionType }): NetworkStatus => ({
    online: s.connected,
    type: s.connectionType,
  })
  return {
    async status() {
      return toStatus(await (await load()).getStatus())
    },
    subscribe(listener) {
      let stopped = false
      let handle: PluginListenerHandle | undefined
      void load()
        .then((plugin) => plugin.addListener('networkStatusChange', (s) => listener(toStatus(s))))
        .then((h) => {
          handle = h
          // unsubscribe() ran before the listener was attached.
          if (stopped) void h.remove()
        })
      return () => {
        stopped = true
        void handle?.remove()
      }
    },
  }
}

function kindOf(capacitor: CapacitorGlobal | undefined): 'ios' | 'android' {
  return capacitor?.getPlatform?.() === 'ios' ? 'ios' : 'android'
}

export function createCapacitorPlatform(
  loaders: CapacitorPlugins,
  capacitor: CapacitorGlobal | undefined = (globalThis as { Capacitor?: CapacitorGlobal }).Capacitor,
): Platform {
  const plugins: CapacitorPlugins = {
    share: once(loaders.share),
    haptics: once(loaders.haptics),
    preferences: once(loaders.preferences),
    filesystem: once(loaders.filesystem),
    localNotifications: once(loaders.localNotifications),
    browser: once(loaders.browser),
    network: once(loaders.network),
    app: once(loaders.app),
    ...(loaders.printer ? { printer: once(loaders.printer) } : {}),
  }
  const kind = kindOf(capacitor)
  return {
    kind,
    share: (input) => nativeShare(plugins, input),
    haptic: (hapticKind) => nativeHaptic(plugins, hapticKind),
    async print() {
      if (plugins.printer) await (await plugins.printer()).printWebView()
      else globalThis.print?.()
    },
    notify: capacitorNotifier(plugins.localNotifications),
    store: capacitorStore(plugins),
    async openExternal(url) {
      const parsed = assertExternalUrl(url)
      // SFSafariViewController / Custom Tabs for web pages; mailto: and tel: go to the system.
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') await (await plugins.browser()).open({ url })
      else globalThis.open?.(url, '_system')
    },
    network: capacitorNetwork(plugins.network),
    async appInfo(): Promise<AppInfo> {
      const info = await (await plugins.app()).getInfo()
      return { kind, native: true, version: info.version, build: info.build, id: info.id }
    },
  }
}
