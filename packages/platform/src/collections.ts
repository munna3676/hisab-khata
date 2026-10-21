import { RECENTS_KEY, RECENTS_LIMIT } from './keys.ts'
import type { KeyValueStore } from './store.ts'

// The user's own lists, kept on the device through Platform.store (no login, nothing leaves the
// phone): starred pages (☆), recently opened pages, recent searches ("সাম্প্রতিক খোঁজ") and saved
// calculations and checklists ("সেভ করা হিসাব ও চেকলিস্ট"). Pages are referred to by their registry
// id, so a renamed route never breaks a saved list.

type Listener<T> = (value: T) => void

/** Runs async updates one after another, so two quick taps never lose a write. */
function serial(): <T>(task: () => Promise<T>) => Promise<T> {
  let last: Promise<unknown> = Promise.resolve()
  return (task) => {
    const run = last.then(task, task)
    last = run.catch(() => undefined)
    return run
  }
}

/** A list of strings stored under one key, with change listeners. */
function storedList(store: KeyValueStore, key: string) {
  const queue = serial()
  const listeners = new Set<Listener<string[]>>()

  async function read(): Promise<string[]> {
    const value = await store.get<unknown>(key)
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  }

  function update(change: (list: string[]) => string[]): Promise<string[]> {
    return queue(async () => {
      const next = change(await read())
      await store.set(key, next)
      for (const listener of listeners) listener(next)
      return next
    })
  }

  function subscribe(listener: Listener<string[]>): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  return { read: () => queue(read), update, subscribe }
}

export interface Favorites {
  /** Starred registry ids, newest first. */
  list(): Promise<string[]>
  has(id: string): Promise<boolean>
  add(id: string): Promise<void>
  remove(id: string): Promise<void>
  /** Stars or unstars; returns true when the id is now starred. */
  toggle(id: string): Promise<boolean>
  subscribe(listener: (ids: string[]) => void): () => void
}

export function createFavorites(store: KeyValueStore, key = 'favorites'): Favorites {
  const list = storedList(store, key)
  return {
    list: list.read,
    has: async (id) => (await list.read()).includes(id),
    add: async (id) => {
      await list.update((ids) => (ids.includes(id) ? ids : [id, ...ids]))
    },
    remove: async (id) => {
      await list.update((ids) => ids.filter((item) => item !== id))
    },
    toggle: async (id) => {
      const next = await list.update((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [id, ...ids]))
      return next.includes(id)
    },
    subscribe: list.subscribe,
  }
}

export interface Recents {
  /** Most recent first, at most `limit` items. */
  list(): Promise<string[]>
  /** Moves the item to the front (adding it if new) and drops the oldest past the limit. */
  push(item: string): Promise<void>
  remove(item: string): Promise<void>
  clear(): Promise<void>
  subscribe(listener: (items: string[]) => void): () => void
}

export interface RecentsOptions {
  key?: string
  limit?: number
  /** Two items are the same when their keys are equal; default: the item itself. */
  identity?: (item: string) => string
  /** Cleans an item before it is stored; an empty result is not stored. */
  clean?: (item: string) => string
}

export function createRecents(store: KeyValueStore, options: RecentsOptions = {}): Recents {
  const { key = RECENTS_KEY, limit = RECENTS_LIMIT, identity = (item) => item, clean = (item) => item } = options
  const list = storedList(store, key)
  return {
    list: list.read,
    push: async (raw) => {
      const item = clean(raw)
      if (item === '') return
      const id = identity(item)
      await list.update((items) => [item, ...items.filter((other) => identity(other) !== id)].slice(0, limit))
    },
    remove: async (raw) => {
      const id = identity(clean(raw))
      await list.update((items) => items.filter((other) => identity(other) !== id))
    },
    clear: async () => {
      await list.update(() => [])
    },
    subscribe: list.subscribe,
  }
}

/** Recent search queries: trimmed, inner spaces collapsed, the same query in another case kept once. */
export function createRecentSearches(store: KeyValueStore, limit = 8): Recents {
  return createRecents(store, {
    key: 'recent-searches',
    limit,
    clean: (query) => query.trim().replace(/\s+/g, ' '),
    identity: (query) => query.toLowerCase(),
  })
}

/** A calculation or checklist the user saved, e.g. "অক্টোবর মেস হিসাব". */
export interface SavedItem<Inputs = Record<string, unknown>> {
  /** Generated when saved. */
  id: string
  /** Registry id of the tool or guide that made it, e.g. 'mess' or 'guide-nid-correction'. */
  entryId: string
  title: string
  /** One line for the list row, e.g. "৪ জন · মিল রেট ৳৫৮". */
  summary?: string
  /** What the page needs to reopen it: calculator inputs or checklist ticks. */
  inputs: Inputs
  /** ISO timestamps. */
  createdAt: string
  updatedAt: string
}

export type NewSavedItem<Inputs> = Pick<SavedItem<Inputs>, 'entryId' | 'title' | 'summary' | 'inputs'>

export interface SavedItems<Inputs = Record<string, unknown>> {
  /** Newest change first; only one page's items when entryId is given. */
  list(entryId?: string): Promise<SavedItem<Inputs>[]>
  get(id: string): Promise<SavedItem<Inputs> | undefined>
  save(item: NewSavedItem<Inputs>): Promise<SavedItem<Inputs>>
  /** Changes title, summary or inputs; returns undefined when the id is gone. */
  update(id: string, patch: Partial<NewSavedItem<Inputs>>): Promise<SavedItem<Inputs> | undefined>
  remove(id: string): Promise<void>
  clear(): Promise<void>
  subscribe(listener: (items: SavedItem<Inputs>[]) => void): () => void
}

export interface SavedItemsOptions {
  key?: string
  /** Oldest items are dropped past this count. Default 200. */
  limit?: number
  /** Injected for tests. */
  now?: () => Date
  newId?: () => string
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

function isSavedItem(value: unknown): value is SavedItem<never> {
  const item = value as SavedItem<never> | null
  return typeof item === 'object' && item !== null && typeof item.id === 'string' && typeof item.entryId === 'string'
}

export function createSavedItems<Inputs = Record<string, unknown>>(
  store: KeyValueStore,
  options: SavedItemsOptions = {},
): SavedItems<Inputs> {
  const { key = 'saved', limit = 200, now = () => new Date(), newId = randomId } = options
  const queue = serial()
  const listeners = new Set<Listener<SavedItem<Inputs>[]>>()

  async function read(): Promise<SavedItem<Inputs>[]> {
    const value = await store.get<unknown>(key)
    return Array.isArray(value) ? (value.filter(isSavedItem) as SavedItem<Inputs>[]) : []
  }

  /** Writes the list newest-first and tells listeners; `result` is what the caller gets back. */
  function update<R>(change: (items: SavedItem<Inputs>[]) => { items: SavedItem<Inputs>[]; result: R }): Promise<R> {
    return queue(async () => {
      const { items, result } = change(await read())
      const sorted = [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit)
      await store.set(key, sorted)
      for (const listener of listeners) listener(sorted)
      return result
    })
  }

  return {
    list: async (entryId) => {
      const items = await queue(read)
      return entryId === undefined ? items : items.filter((item) => item.entryId === entryId)
    },
    get: async (id) => (await queue(read)).find((item) => item.id === id),
    save: (input) =>
      update((items) => {
        const at = now().toISOString()
        const item: SavedItem<Inputs> = { ...input, id: newId(), createdAt: at, updatedAt: at }
        return { items: [item, ...items], result: item }
      }),
    update: (id, patch) =>
      update((items) => {
        const index = items.findIndex((item) => item.id === id)
        if (index === -1) return { items, result: undefined }
        const item: SavedItem<Inputs> = { ...items[index]!, ...patch, updatedAt: now().toISOString() }
        return { items: items.map((other, i) => (i === index ? item : other)), result: item }
      }),
    remove: (id) => update((items) => ({ items: items.filter((item) => item.id !== id), result: undefined })),
    clear: () => update(() => ({ items: [], result: undefined })),
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export interface Collections {
  favorites: Favorites
  recents: Recents
  recentSearches: Recents
  saved: SavedItems
}

const cache = new WeakMap<KeyValueStore, Collections>()

/**
 * The lists for a store, created once per store so every island shares one write queue and one
 * set of listeners: collectionsFor(getPlatform().store).favorites.toggle('emi').
 */
export function collectionsFor(store: KeyValueStore): Collections {
  let collections = cache.get(store)
  if (!collections) {
    collections = {
      favorites: createFavorites(store),
      recents: createRecents(store),
      recentSearches: createRecentSearches(store),
      saved: createSavedItems(store),
    }
    cache.set(store, collections)
  }
  return collections
}
