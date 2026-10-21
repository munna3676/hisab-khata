import { STORAGE_PREFIX } from './keys.ts'
import { jsonStore, memoryBackend, type KeyValueStore, type TextBackend } from './store.ts'

// The web platform's storage (localStorage, IndexedDB), apart from the rest of src/web.ts so a page
// can read and write the on-device lists (recents, favorites) without the share, print and notify
// code. src/web.ts re-exports everything here.

export { STORAGE_PREFIX }

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
export function webStore(env: { localStorage?: Storage | undefined; indexedDB?: IDBFactory | undefined }): KeyValueStore {
  const small = env.localStorage ? localStorageBackend(env.localStorage) : memoryBackend()
  const large = env.indexedDB ? indexedDbBackend(env.indexedDB) : undefined
  return jsonStore(small, large ? { large } : {})
}
