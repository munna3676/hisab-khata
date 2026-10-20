import { describe, expect, it } from 'vitest'
import {
  collectionsFor,
  createFavorites,
  createRecentSearches,
  createRecents,
  createSavedItems,
} from '../src/collections.ts'
import { memoryStore } from '../src/store.ts'

describe('favorites', () => {
  it('stars and unstars registry ids, newest first', async () => {
    const favorites = createFavorites(memoryStore())
    expect(await favorites.toggle('emi')).toBe(true)
    await favorites.add('cash-out')
    await favorites.add('emi')
    expect(await favorites.list()).toEqual(['cash-out', 'emi'])
    expect(await favorites.has('emi')).toBe(true)
    expect(await favorites.toggle('emi')).toBe(false)
    await favorites.remove('cash-out')
    expect(await favorites.list()).toEqual([])
  })

  it('does not lose writes when taps arrive at the same time', async () => {
    const favorites = createFavorites(memoryStore())
    await Promise.all(['a', 'b', 'c', 'd'].map((id) => favorites.add(id)))
    expect((await favorites.list()).sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('tells listeners about changes and stops after unsubscribe', async () => {
    const favorites = createFavorites(memoryStore())
    const seen: string[][] = []
    const stop = favorites.subscribe((ids) => seen.push(ids))
    await favorites.add('emi')
    stop()
    await favorites.add('fdr')
    expect(seen).toEqual([['emi']])
  })

  it('ignores a stored value of the wrong shape', async () => {
    const store = memoryStore()
    await store.set('favorites', { not: 'a list' })
    expect(await createFavorites(store).list()).toEqual([])
  })
})

describe('recents', () => {
  it('moves a reopened page to the front and keeps at most `limit`', async () => {
    const recents = createRecents(memoryStore(), { limit: 3 })
    for (const id of ['emi', 'fdr', 'dps', 'emi', 'vat']) await recents.push(id)
    expect(await recents.list()).toEqual(['vat', 'emi', 'dps'])
    await recents.remove('emi')
    expect(await recents.list()).toEqual(['vat', 'dps'])
    await recents.clear()
    expect(await recents.list()).toEqual([])
  })

  it('cleans search queries and keeps one copy regardless of case (Figma: সাম্প্রতিক খোঁজ)', async () => {
    const searches = createRecentSearches(memoryStore())
    await searches.push('  বিকাশ   ক্যাশ আউট ৫০০০ ')
    await searches.push('FDR ক্যালকুলেটর')
    await searches.push('fdr ক্যালকুলেটর')
    await searches.push('   ')
    expect(await searches.list()).toEqual(['fdr ক্যালকুলেটর', 'বিকাশ ক্যাশ আউট ৫০০০'])
  })
})

describe('saved items', () => {
  const clock = () => {
    let t = Date.parse('2026-10-19T10:00:00Z')
    return () => new Date((t += 1000))
  }

  it('saves, updates and removes calculations, newest change first (Figma A2: অক্টোবর মেস হিসাব)', async () => {
    let n = 0
    const saved = createSavedItems<{ members: number }>(memoryStore(), { now: clock(), newId: () => `id${++n}` })
    const mess = await saved.save({ entryId: 'mess', title: 'অক্টোবর মেস হিসাব', summary: '৪ জন · মিল রেট ৳৫৮', inputs: { members: 4 } })
    const loan = await saved.save({ entryId: 'loan-compare', title: 'লোন তুলনা: অফার A vs B', inputs: { members: 0 } })
    expect(mess).toMatchObject({ id: 'id1', entryId: 'mess', createdAt: '2026-10-19T10:00:01.000Z' })
    expect((await saved.list()).map((item) => item.id)).toEqual(['id2', 'id1'])

    const updated = await saved.update('id1', { inputs: { members: 5 } })
    expect(updated?.inputs).toEqual({ members: 5 })
    expect(updated?.createdAt).toBe(mess.createdAt)
    expect((await saved.list()).map((item) => item.id)).toEqual(['id1', 'id2'])
    expect(await saved.list('loan-compare')).toEqual([loan])
    expect(await saved.update('gone', { title: 'x' })).toBeUndefined()

    await saved.remove('id1')
    expect(await saved.get('id1')).toBeUndefined()
    await saved.clear()
    expect(await saved.list()).toEqual([])
  })

  it('drops the oldest items past the limit', async () => {
    const saved = createSavedItems(memoryStore(), { limit: 2, now: clock() })
    for (const title of ['a', 'b', 'c']) await saved.save({ entryId: 'emi', title, inputs: {} })
    expect((await saved.list()).map((item) => item.title)).toEqual(['c', 'b'])
  })

  it('generates unique ids by default', async () => {
    const saved = createSavedItems(memoryStore())
    const a = await saved.save({ entryId: 'emi', title: 'a', inputs: {} })
    const b = await saved.save({ entryId: 'emi', title: 'b', inputs: {} })
    expect(a.id).not.toBe(b.id)
  })
})

describe('collectionsFor', () => {
  it('returns the same lists for the same store, so islands share one queue', async () => {
    const store = memoryStore()
    expect(collectionsFor(store)).toBe(collectionsFor(store))
    expect(collectionsFor(memoryStore())).not.toBe(collectionsFor(store))
    await collectionsFor(store).favorites.add('emi')
    expect(await store.get('favorites')).toEqual(['emi'])
  })
})
