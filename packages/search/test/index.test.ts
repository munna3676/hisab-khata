import { describe, expect, it, vi } from 'vitest'
import { registry as realRegistry, type Registry, type RegistryEntry } from '@hisab/data/registry'
import { MAX_QUERY, buildSearchIndex, lazySearch, loadSearchIndex, searchDocuments, serializeIndex } from '../src/index.ts'
import { readGuides } from '../src/build-index.ts'

/** A registry entry with only the fields search reads filled in. */
const entry = (id: string, name: string, keywords: string[], description: string): RegistryEntry => ({
  id,
  kind: 'tool',
  section: 'root',
  priority: 'launch',
  route: { bn: `/tools/${id}`, en: `/en/tools/${id}` },
  name: { bn: name, en: name },
  description: { bn: description, en: description },
  keywords,
  related: [],
  engine: null,
  dataFiles: [],
  figma: { mobile: [], desktop: [] },
})

const search = buildSearchIndex({ guides: readGuides() })
const top = (query: string, n = 3) => search.search(query, { limit: n }).map((h) => h.id)

describe('buildSearchIndex', () => {
  it('finds a page by its Bangla, Banglish or English name', () => {
    expect(top('বিকাশ ক্যাশ আউট', 1)).toEqual(['mfs-bkash-cash-out'])
    expect(top('bikash kash out', 1)).toEqual(['mfs-bkash-cash-out'])
    expect(top('bKash cash out', 1)).toEqual(['mfs-bkash-cash-out'])
  })

  it('returns registry ids with the entry and match info', () => {
    const [hit] = search.search('emi calculater', { limit: 1 })
    expect(hit?.id).toBe('emi')
    expect(hit?.entry.route.bn).toBe('/tools/emi')
    expect(hit?.queryTerms.length).toBeGreaterThan(0)
    expect(Object.values(hit!.match).flat()).toContain('name')
  })

  it('matches while typing (prefix) and through typos (fuzzy)', () => {
    expect(top('sanchay')).toContain('sanchayapatra')
    expect(top('pasport')).toContain('guide-e-passport')
    expect(top('calcultor zakat')).toContain('zakat')
  })

  it('weighs name above keywords above description', () => {
    const registry: Registry = {
      groups: [],
      entries: [
        entry('in-description', 'এক', ['দুই'], 'ঝিনুক'),
        entry('in-keywords', 'তিন', ['ঝিনুক'], 'চার'),
        entry('in-name', 'ঝিনুক', ['পাঁচ'], 'ছয়'),
      ],
    }
    expect(buildSearchIndex({ registry }).search('ঝিনুক').map((h) => h.id)).toEqual(['in-name', 'in-keywords', 'in-description'])
  })

  it('prefers the page that matches every word', () => {
    expect(top('stc pay', 1)).toEqual(['guide-saudi-to-bkash'])
  })

  it('searches guide titles and FAQ questions', () => {
    const custom = buildSearchIndex({
      guides: [{ id: 'hundi', title: 'হুন্ডি', faq: [{ q: 'ধরা পড়লে কী শাস্তি হয়?' }] }],
    })
    expect(custom.search('শাস্তি', { limit: 1 })[0]?.id).toBe('guide-hundi')
    expect(buildSearchIndex().search('শাস্তি')).toEqual([])
  })

  it('never offers the search page or the error states', () => {
    const ids = searchDocuments(realRegistry).map((d) => d.id)
    expect(ids).not.toContain('search')
    expect(ids).not.toContain('not-found')
    expect(ids).not.toContain('offline')
  })

  it('filters by kind and respects the limit', () => {
    const hits = search.search('bkash', { kinds: ['guide'], limit: 2 })
    expect(hits).toHaveLength(2)
    expect(hits.every((h) => h.entry.kind === 'guide')).toBe(true)
  })

  it('returns nothing for an empty or punctuation-only query', () => {
    expect(search.search('')).toEqual([])
    expect(search.search(' ?! ')).toEqual([])
  })

  it('builds over another registry', () => {
    const registry: Registry = { groups: [], entries: [entry('demo', 'ডেমো', ['demo'], 'পরীক্ষা')] }
    expect(buildSearchIndex({ registry }).search('demo').map((h) => h.id)).toEqual(['demo'])
  })
})

describe('serializeIndex / loadSearchIndex', () => {
  it('round-trips through JSON with the same results', () => {
    const json = serializeIndex(search)
    const loaded = loadSearchIndex(json)
    for (const query of ['bkash cash out', 'জমির মাপ', 'nid songshodhon', 'sonar dam']) {
      expect(loaded.search(query).map((h) => [h.id, h.score])).toEqual(search.search(query).map((h) => [h.id, h.score]))
    }
    expect(loadSearchIndex(JSON.parse(json)).search('zakat')[0]?.id).toBe('zakat')
  })
})

describe('lazySearch', () => {
  it('loads once, on first use', async () => {
    const load = vi.fn(async () => serializeIndex(search))
    const lazy = lazySearch(load)
    expect(load).not.toHaveBeenCalled()
    const [a, b] = await Promise.all([lazy.search('vat'), lazy.search('zakat')])
    expect(a[0]?.id).toBe('vat')
    expect(b[0]?.id).toBe('zakat')
    await lazy.ready()
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('retries after a failed load', async () => {
    let calls = 0
    const lazy = lazySearch(async () => {
      calls++
      if (calls === 1) throw new Error('offline')
      return serializeIndex(search)
    })
    await expect(lazy.search('vat')).rejects.toThrow('offline')
    expect((await lazy.search('vat'))[0]?.id).toBe('vat')
    expect(calls).toBe(2)
  })
})

describe('review: ranking and hostile queries', () => {
  it('puts a bKash page, not a guide that mentions bKash, first for the bare brand', () => {
    // বিকাশে / বিকাশের in a guide used to prefix-match বিকাশ twice and outrank the brand's pages.
    for (const query of ['bkash', 'বিকাশ', 'bikash', 'বিকাশের']) {
      const first = top(query, 1)[0]!
      expect(first.startsWith('mfs-bkash-') || first === 'mobile-banking', `${query} → ${first}`).toBe(true)
    }
  })

  it('still prefers the all-brands tool when no brand is named', () => {
    expect(top('cashout calculator', 3)).toContain('cash-out')
    expect(top('send money charge', 3)).toContain('send-money')
  })

  it('returns nothing for empty, blank, punctuation or invisible queries', () => {
    for (const query of ['', '   ', '%', '\u200c\u200d', '\u2028', '?!.']) expect(top(query), JSON.stringify(query)).toEqual([])
  })

  it('reads only the first MAX_QUERY characters, so a pasted page stays fast', () => {
    const long = 'বিকাশ ক্যাশ আউট ' + 'অজানাশব্দ '.repeat(2000)
    const started = performance.now()
    const hits = top(long, 1)
    expect(performance.now() - started).toBeLessThan(500)
    expect(hits).toEqual(top('বিকাশ ক্যাশ আউট ' + 'অজানাশব্দ '.repeat(2000).slice(0, MAX_QUERY - 16), 1))
    expect(top('x'.repeat(5000))).toEqual([])
  })

  it('treats mixed digits, case and joiners alike', () => {
    expect(top('BKASH CASH-OUT', 1)).toEqual(top('বিকাশ\u200c ক্যাশ\u200dআউট', 1))
    expect(top('বিদ্যুৎ বিল', 1)).toEqual(top('বিদ্যুত্ বিল', 1))
  })
})
