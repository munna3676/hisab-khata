// Key-value storage behind Platform.store. Values are JSON. Small values go to a fast synchronous-
// feeling backend (localStorage on the web, @capacitor/preferences in the app); values over
// `largeAt` characters, or ones the small backend refuses (quota), go to a large backend
// (IndexedDB on the web, @capacitor/filesystem in the app) and leave a marker in the small one, so
// keys() only has to list the small backend.

export interface KeyValueStore {
  /** The stored value, or undefined when the key is missing or its text is not valid JSON. */
  get<T = unknown>(key: string): Promise<T | undefined>
  /** Stores any JSON-serialisable value; undefined removes the key. */
  set(key: string, value: unknown): Promise<void>
  remove(key: string): Promise<void>
  /** Every key, or the keys that start with prefix, sorted. */
  keys(prefix?: string): Promise<string[]>
}

/** Raw text storage a KeyValueStore is built on. */
export interface TextBackend {
  read(key: string): Promise<string | null>
  write(key: string, text: string): Promise<void>
  delete(key: string): Promise<void>
  list(): Promise<string[]>
}

export interface JsonStoreOptions {
  /** Where big values go; without it every value stays in the small backend. */
  large?: TextBackend
  /** Size in characters from which a value goes to the large backend. Default 64 KB. */
  largeAt?: number
}

/** Stands in the small backend for a value kept in the large one. JSON text never starts with \0. */
export const LARGE_MARKER = '\u0000large'

const DEFAULT_LARGE_AT = 64 * 1024

/** A KeyValueStore over a small backend and, optionally, a large one. */
export function jsonStore(small: TextBackend, options: JsonStoreOptions = {}): KeyValueStore {
  const { large, largeAt = DEFAULT_LARGE_AT } = options

  async function remove(key: string): Promise<void> {
    const current = await small.read(key)
    await small.delete(key)
    if (current === LARGE_MARKER && large) await large.delete(key)
  }

  return {
    async get<T>(key: string): Promise<T | undefined> {
      let text = await small.read(key)
      if (text === LARGE_MARKER) text = large ? await large.read(key) : null
      if (text === null) return undefined
      try {
        return JSON.parse(text) as T
      } catch {
        // A value written by an older build or edited by hand; treat it as missing.
        return undefined
      }
    },

    async set(key: string, value: unknown): Promise<void> {
      if (value === undefined) return remove(key)
      const text = JSON.stringify(value)
      const wasLarge = (await small.read(key)) === LARGE_MARKER
      if (large && text.length >= largeAt) {
        await large.write(key, text)
        await small.write(key, LARGE_MARKER)
        return
      }
      try {
        await small.write(key, text)
      } catch (error) {
        // localStorage throws QuotaExceededError when full; keep the value in the large backend.
        if (!large) throw error
        await large.write(key, text)
        await small.write(key, LARGE_MARKER)
        return
      }
      if (wasLarge && large) await large.delete(key)
    },

    remove,

    async keys(prefix = ''): Promise<string[]> {
      return (await small.list()).filter((key) => key.startsWith(prefix)).sort()
    },
  }
}

/** Text kept in a Map: for tests and as the last fallback when no storage is available. */
export function memoryBackend(initial: Record<string, string> = {}): TextBackend & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return {
    data,
    async read(key) {
      return data.get(key) ?? null
    },
    async write(key, text) {
      data.set(key, text)
    },
    async delete(key) {
      data.delete(key)
    },
    async list() {
      return [...data.keys()]
    },
  }
}

/** A KeyValueStore kept in memory (lost on reload). */
export function memoryStore(options: JsonStoreOptions = {}): KeyValueStore {
  return jsonStore(memoryBackend(), options)
}

/** A view of a store whose keys all start with `namespace` (which is hidden from callers). */
export function namespaced(store: KeyValueStore, namespace: string): KeyValueStore {
  return {
    get: (key) => store.get(namespace + key),
    set: (key, value) => store.set(namespace + key, value),
    remove: (key) => store.remove(namespace + key),
    keys: async (prefix = '') => (await store.keys(namespace + prefix)).map((key) => key.slice(namespace.length)),
  }
}
