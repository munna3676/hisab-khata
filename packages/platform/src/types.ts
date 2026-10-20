import type { KeyValueStore } from './store.ts'

// The one API components use for anything the browser and the native shell do differently.
// src/web.ts implements it with web APIs, src/capacitor.ts with Capacitor 8 plugins; components
// call getPlatform() from src/index.ts and never import Capacitor themselves.

export type PlatformKind = 'web' | 'ios' | 'android'

/** A file to share, e.g. the 1080×1080 result card PNG drawn on a canvas. */
export interface ShareFile {
  /** File name with extension, e.g. 'hisab-khata-cash-out.png'. */
  name: string
  /** MIME type, e.g. 'image/png'. */
  type: string
  data: Blob
}

export interface ShareInput {
  title?: string
  text?: string
  url?: string
  files?: ShareFile[]
}

/**
 * What share() ended up doing, so the caller can show the right toast:
 * 'copied' → "লিংক কপি হয়েছে", 'downloaded' → the image was saved instead of shared.
 */
export type ShareOutcome = 'shared' | 'downloaded' | 'copied' | 'cancelled' | 'unsupported'

/** tap: a button press; selection: a picker or toggle moved; success/warning/error: a result. */
export type HapticKind = 'tap' | 'selection' | 'success' | 'warning' | 'error'

/** A local reminder, e.g. sehri/iftar for the chosen district. */
export interface Reminder {
  /** A 32-bit integer; Android and iOS both need numeric ids. */
  id: number
  title: string
  body: string
  /** First time it fires. */
  at: Date
  /** Fire again every day/week/…, counted from `at`. */
  repeat?: 'day' | 'week' | 'month' | 'year'
  /** Extra values handed back when the reminder is tapped, e.g. { route: '/tools/sehri-iftar' }. */
  data?: Record<string, string>
}

export type NotifyPermission = 'granted' | 'denied' | 'prompt' | 'unsupported'

export interface Notifier {
  /** The current permission, without asking. */
  permission(): Promise<NotifyPermission>
  /** Asks the user when the answer is still 'prompt'; returns the result. */
  requestPermission(): Promise<NotifyPermission>
  /**
   * Schedules reminders (same id replaces). Returns false when notifications are not allowed or
   * not supported. On the web a reminder only fires while a tab of the site is open.
   */
  schedule(reminders: Reminder[]): Promise<boolean>
  cancel(ids: number[]): Promise<void>
  /** Ids of the reminders still waiting to fire. */
  pending(): Promise<number[]>
}

export type ConnectionType = 'wifi' | 'cellular' | 'none' | 'unknown'

export interface NetworkStatus {
  online: boolean
  type: ConnectionType
}

export interface Network {
  status(): Promise<NetworkStatus>
  /** Calls the listener on every change; returns the function that stops listening. */
  subscribe(listener: (status: NetworkStatus) => void): () => void
}

export interface AppInfo {
  kind: PlatformKind
  native: boolean
  /** App version and build ('1.2.0', '12'); undefined on the web. */
  version?: string
  build?: string
  /** Bundle / application id; undefined on the web. */
  id?: string
}

export interface Platform {
  kind: PlatformKind
  share(input: ShareInput): Promise<ShareOutcome>
  /** Never throws; does nothing where haptics are not available (the web). */
  haptic(kind: HapticKind): Promise<void>
  /** Opens the system print dialog for the current page (print CSS shapes the output). */
  print(): Promise<void>
  notify: Notifier
  /** On-device storage for settings, favorites, recents and saved results. */
  store: KeyValueStore
  /** Opens an http(s), mailto: or tel: link outside the app; throws for any other scheme. */
  openExternal(url: string): Promise<void>
  network: Network
  appInfo(): Promise<AppInfo>
}

const EXTERNAL_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:'])

/** Throws unless the URL is absolute and uses a scheme that is safe to open outside the app. */
export function assertExternalUrl(url: string): URL {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`platform: not an absolute URL: ${url}`)
  }
  if (!EXTERNAL_SCHEMES.has(parsed.protocol)) throw new Error(`platform: refusing to open ${parsed.protocol} link`)
  return parsed
}
