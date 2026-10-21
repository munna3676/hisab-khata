// The on-device lists (recents, favorites) for the website's plain scripts, through the web
// storage alone (@hisab/platform/web-store), not the whole platform adapter.
import { collectionsFor, type Collections } from '@hisab/platform/collections'
import { webStore } from '@hisab/platform/web-store'

let lists: Collections | undefined

function safe<T>(read: () => T): T | undefined {
  try {
    return read() ?? undefined
  } catch {
    return undefined
  }
}

export function deviceLists(): Collections {
  lists ??= collectionsFor(webStore({ localStorage: safe(() => window.localStorage), indexedDB: safe(() => window.indexedDB) }))
  return lists
}
