import { jsonStore, memoryBackend, type KeyValueStore, type TextBackend } from './store.ts'
import {
  assertExternalUrl,
  type AppInfo,
  type ConnectionType,
  type Network,
  type NetworkStatus,
  type Notifier,
  type NotifyPermission,
  type Platform,
  type Reminder,
  type ShareInput,
  type ShareOutcome,
} from './types.ts'

// The browser implementation: navigator.share (with a download fallback for files and a clipboard
// fallback for links), window.print, localStorage + IndexedDB, the Notification API while a tab is
// open, and online/offline events. Haptics do nothing on the web.

/** The globals the web platform reads; tests pass fakes, the site passes nothing (globalThis). */
export interface WebEnv {
  window: Window
  navigator: Navigator
  document: Document
  localStorage?: Storage | undefined
  indexedDB?: IDBFactory | undefined
  Notification?: typeof Notification | undefined
}

/** Every key the site writes to localStorage starts with this, so keys() never sees other data. */
export const STORAGE_PREFIX = 'hk:'

function defaultEnv(): WebEnv {
  const g = globalThis as unknown as Partial<WebEnv> & typeof globalThis
  return {
    window: g.window,
    navigator: g.navigator,
    document: g.document,
    // Reading localStorage throws in some private modes and sandboxed iframes.
    localStorage: safe(() => g.localStorage),
    indexedDB: safe(() => g.indexedDB),
    Notification: safe(() => g.Notification),
  }
}

function safe<T>(read: () => T): T | undefined {
  try {
    return read() ?? undefined
  } catch {
    return undefined
  }
}

/** localStorage under STORAGE_PREFIX. */
export function localStorageBackend(storage: Storage, prefix = STORAGE_PREFIX): TextBackend {
  return {
    async read(key) {
      return storage.getItem(prefix + key)
    },
    async write(key, text) {
      storage.setItem(prefix + key, text)
    },
    async delete(key) {
      storage.removeItem(prefix + key)
    },
    async list() {
      const keys: string[] = []
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key?.startsWith(prefix)) keys.push(key.slice(prefix.length))
      }
      return keys
    },
  }
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** One IndexedDB object store of text values, for values too big for localStorage. */
export function indexedDbBackend(factory: IDBFactory, dbName = 'hisab-khata', storeName = 'kv'): TextBackend {
  let db: Promise<IDBDatabase> | undefined
  function open(): Promise<IDBDatabase> {
    db ??= new Promise((resolve, reject) => {
      const req = factory.open(dbName, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(storeName)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    return db
  }
  async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const tx = (await open()).transaction(storeName, mode)
    const result = await request(action(tx.objectStore(storeName)))
    if (mode === 'readwrite') {
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
      })
    }
    return result
  }
  return {
    async read(key) {
      const value = await run('readonly', (store) => store.get(key) as IDBRequest<unknown>)
      return typeof value === 'string' ? value : null
    },
    async write(key, text) {
      await run('readwrite', (store) => store.put(text, key))
    },
    async delete(key) {
      await run('readwrite', (store) => store.delete(key))
    },
    async list() {
      return (await run('readonly', (store) => store.getAllKeys())).map(String)
    },
  }
}

/** localStorage for small values and IndexedDB for large ones; memory when neither is available. */
export function webStore(env: Pick<WebEnv, 'localStorage' | 'indexedDB'>): KeyValueStore {
  const small = env.localStorage ? localStorageBackend(env.localStorage) : memoryBackend()
  const large = env.indexedDB ? indexedDbBackend(env.indexedDB) : undefined
  return jsonStore(small, large ? { large } : {})
}

function download(env: WebEnv, name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const link = env.document.createElement('a')
  link.href = url
  link.download = name
  link.rel = 'noopener'
  link.style.display = 'none'
  env.document.body.append(link)
  link.click()
  link.remove()
  // Revoking at once can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function isAbort(error: unknown): boolean {
  return (error as { name?: string } | null)?.name === 'AbortError'
}

async function webShare(env: WebEnv, input: ShareInput): Promise<ShareOutcome> {
  const nav = env.navigator
  const files = input.files?.map((file) => new File([file.data], file.name, { type: file.type }))
  const data: ShareData = { title: input.title, text: input.text, url: input.url }
  if (files?.length) data.files = files

  const canShare = typeof nav.share === 'function' && (!files?.length || nav.canShare?.(data) === true)
  if (canShare) {
    try {
      await nav.share(data)
      return 'shared'
    } catch (error) {
      if (isAbort(error)) return 'cancelled'
      // NotAllowedError (no user gesture) and others: fall through to the fallbacks below.
    }
  }

  if (input.files?.length) {
    for (const file of input.files) download(env, file.name, file.data)
    return 'downloaded'
  }

  const text = input.url ?? input.text
  if (text && typeof nav.clipboard?.writeText === 'function') {
    try {
      await nav.clipboard.writeText(text)
      return 'copied'
    } catch {
      return 'unsupported'
    }
  }
  return 'unsupported'
}

// setTimeout takes at most 2^31-1 ms (about 24.8 days); longer waits are chained.
const MAX_TIMEOUT = 2 ** 31 - 1

function nextFire(at: Date, repeat: Reminder['repeat']): Date {
  const next = new Date(at)
  if (repeat === 'day') next.setDate(next.getDate() + 1)
  else if (repeat === 'week') next.setDate(next.getDate() + 7)
  else if (repeat === 'month') next.setMonth(next.getMonth() + 1)
  else if (repeat === 'year') next.setFullYear(next.getFullYear() + 1)
  return next
}

/** Notification API reminders that fire while a tab of the site is open (no push server needed). */
export function webNotifier(env: Pick<WebEnv, 'Notification'>, clock: () => number = Date.now): Notifier {
  const timers = new Map<number, ReturnType<typeof setTimeout>>()

  function permission(): NotifyPermission {
    const api = env.Notification
    if (!api) return 'unsupported'
    return api.permission === 'default' ? 'prompt' : api.permission
  }

  function arm(reminder: Reminder, at: Date): void {
    const wait = at.getTime() - clock()
    const timer = setTimeout(
      () => {
        if (wait > MAX_TIMEOUT) return arm(reminder, at)
        timers.delete(reminder.id)
        if (permission() === 'granted' && env.Notification) {
          new env.Notification(reminder.title, { body: reminder.body, tag: String(reminder.id), data: reminder.data })
        }
        if (reminder.repeat) arm(reminder, nextFire(at, reminder.repeat))
      },
      Math.max(0, Math.min(wait, MAX_TIMEOUT)),
    )
    timers.set(reminder.id, timer)
  }

  function cancelOne(id: number): void {
    const timer = timers.get(id)
    if (timer !== undefined) clearTimeout(timer)
    timers.delete(id)
  }

  return {
    async permission() {
      return permission()
    },
    async requestPermission() {
      const api = env.Notification
      if (!api) return 'unsupported'
      if (api.permission === 'default') await api.requestPermission()
      return permission()
    },
    async schedule(reminders) {
      if (permission() !== 'granted') return false
      for (const reminder of reminders) {
        cancelOne(reminder.id)
        // A repeating reminder whose first time has passed starts at its next time.
        let at = reminder.at
        while (reminder.repeat && at.getTime() < clock()) at = nextFire(at, reminder.repeat)
        if (at.getTime() >= clock()) arm(reminder, at)
      }
      return true
    },
    async cancel(ids) {
      for (const id of ids) cancelOne(id)
    },
    async pending() {
      return [...timers.keys()]
    },
  }
}

interface NetworkInformationLike {
  type?: string
  addEventListener?(type: 'change', listener: () => void): void
  removeEventListener?(type: 'change', listener: () => void): void
}

function connectionType(nav: Navigator): ConnectionType {
  if (!nav.onLine) return 'none'
  const type = (nav as Navigator & { connection?: NetworkInformationLike }).connection?.type
  if (type === 'wifi' || type === 'ethernet') return 'wifi'
  if (type === 'cellular') return 'cellular'
  return 'unknown'
}

export function webNetwork(env: Pick<WebEnv, 'window' | 'navigator'>): Network {
  const read = (): NetworkStatus => ({ online: env.navigator.onLine, type: connectionType(env.navigator) })
  return {
    async status() {
      return read()
    },
    subscribe(listener) {
      const notify = () => listener(read())
      env.window.addEventListener('online', notify)
      env.window.addEventListener('offline', notify)
      return () => {
        env.window.removeEventListener('online', notify)
        env.window.removeEventListener('offline', notify)
      }
    },
  }
}

export function createWebPlatform(env: WebEnv = defaultEnv()): Platform {
  return {
    kind: 'web',
    share: (input) => webShare(env, input),
    async haptic() {
      // The Vibration API is Android-Chrome only and feels unlike native haptics; leave it off.
    },
    async print() {
      env.window.print()
    },
    notify: webNotifier(env),
    store: webStore(env),
    async openExternal(url) {
      assertExternalUrl(url)
      env.window.open(url, '_blank', 'noopener,noreferrer')
    },
    network: webNetwork(env),
    async appInfo(): Promise<AppInfo> {
      return { kind: 'web', native: false }
    },
  }
}
