import { describe, expect, it } from 'vitest'
import { LARGE_MARKER, jsonStore, memoryBackend, memoryStore, namespaced, type TextBackend } from '../src/store.ts'

describe('jsonStore', () => {
  it('round-trips JSON values and lists keys by prefix', async () => {
    const store = memoryStore()
    await store.set('settings:theme', 'dark')
    await store.set('favorites', ['emi', 'cash-out'])
    await store.set('settings:digits', { bn: true })
    expect(await store.get('favorites')).toEqual(['emi', 'cash-out'])
    expect(await store.get('missing')).toBeUndefined()
    expect(await store.keys()).toEqual(['favorites', 'settings:digits', 'settings:theme'])
    expect(await store.keys('settings:')).toEqual(['settings:digits', 'settings:theme'])
    await store.remove('favorites')
    expect(await store.get('favorites')).toBeUndefined()
  })

  it('treats set(key, undefined) as remove and broken JSON as missing', async () => {
    const small = memoryBackend({ bad: '{not json' })
    const store = jsonStore(small)
    expect(await store.get('bad')).toBeUndefined()
    await store.set('x', 1)
    await store.set('x', undefined)
    expect(small.data.has('x')).toBe(false)
  })

  it('moves large values to the large backend and back', async () => {
    const small = memoryBackend()
    const large = memoryBackend()
    const store = jsonStore(small, { large, largeAt: 100 })
    const big = { rows: Array.from({ length: 50 }, (_, i) => i) }
    await store.set('invoice', big)
    expect(small.data.get('invoice')).toBe(LARGE_MARKER)
    expect(large.data.has('invoice')).toBe(true)
    expect(await store.get('invoice')).toEqual(big)
    expect(await store.keys()).toEqual(['invoice'])

    // Shrinking it brings it back to the small backend and deletes the large copy.
    await store.set('invoice', { rows: [] })
    expect(small.data.get('invoice')).toBe('{"rows":[]}')
    expect(large.data.has('invoice')).toBe(false)

    await store.set('invoice', big)
    await store.remove('invoice')
    expect(small.data.size + large.data.size).toBe(0)
  })

  it('falls back to the large backend when the small one is full', async () => {
    const small = memoryBackend()
    const full: TextBackend = {
      ...small,
      async write(key, text) {
        if (text !== LARGE_MARKER) throw new DOMException('full', 'QuotaExceededError')
        await small.write(key, text)
      },
    }
    const large = memoryBackend()
    const store = jsonStore(full, { large })
    await store.set('k', 'v')
    expect(await store.get('k')).toBe('v')
    expect(large.data.get('k')).toBe('"v"')
    await expect(jsonStore(full).set('k', 'v')).rejects.toThrow('full')
  })

  it('namespaced() hides its prefix', async () => {
    const store = memoryStore()
    const ns = namespaced(store, 'tool:emi:')
    await ns.set('last', { principal: 500000 })
    expect(await store.get('tool:emi:last')).toEqual({ principal: 500000 })
    expect(await ns.keys()).toEqual(['last'])
    expect(await ns.get('last')).toEqual({ principal: 500000 })
  })
})
