import { RECENTS_KEY, RECENTS_LIMIT, STORAGE_PREFIX } from './keys.ts'

// The website's "remember this page" for the home page's "তোমার টুল" row, in a few lines: the same
// localStorage entry collectionsFor(webStore()).recents writes (a JSON array, newest first, at most
// RECENTS_LIMIT ids), without loading the whole store on every tool page. test/recent-page.test.ts
// checks the two agree.

/** Moves `id` to the front of the recents list in `storage`. Never throws (private mode, full storage). */
export function recordRecentPage(storage: Storage | undefined, id: string): void {
  if (!storage || !id) return
  try {
    const key = STORAGE_PREFIX + RECENTS_KEY
    let list: unknown
    try {
      list = JSON.parse(storage.getItem(key) ?? '[]')
    } catch {
      list = []
    }
    const ids = Array.isArray(list) ? list.filter((item): item is string => typeof item === 'string' && item !== id) : []
    storage.setItem(key, JSON.stringify([id, ...ids].slice(0, RECENTS_LIMIT)))
  } catch {
    // Storage refused (private mode, quota): the row simply misses this page.
  }
}
