import { describe, expect, it } from 'vitest'
import { collectionsFor } from '../src/collections.ts'
import { recordRecentPage } from '../src/recent-page.ts'
import { webStore } from '../src/web-store.ts'

class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

describe('recordRecentPage', () => {
  it('writes what collections recents reads, newest first, deduplicated and capped', async () => {
    const storage = new MemoryStorage()
    const recents = collectionsFor(webStore({ localStorage: storage })).recents
    await recents.push('fdr')
    for (const id of ['emi', 'dps', 'emi']) recordRecentPage(storage, id)
    expect(await recents.list()).toEqual(['emi', 'dps', 'fdr'])
    for (let i = 0; i < 12; i++) recordRecentPage(storage, `t${i}`)
    expect(await recents.list()).toHaveLength(10)
    // And the other way round: a push through the store is seen by the next record.
    await recents.push('cash-out')
    recordRecentPage(storage, 'emi')
    expect((await recents.list()).slice(0, 2)).toEqual(['emi', 'cash-out'])
  })

  it('survives broken or missing storage', () => {
    const storage = new MemoryStorage()
    storage.setItem('hk:recents', '{not json')
    recordRecentPage(storage, 'emi')
    expect(storage.getItem('hk:recents')).toBe('["emi"]')
    expect(() => recordRecentPage(undefined, 'emi')).not.toThrow()
  })
})
