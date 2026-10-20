import MiniSearch, { type AsPlainObject, type Options, type SearchResult } from 'minisearch'
import { registry as defaultRegistry, type Registry, type RegistryEntry } from '@hisab/data/registry'
import { createSynonymMap, words, type SynonymFile, type SynonymMap } from './normalize.ts'
import { defaultSynonymMap } from './synonyms.ts'

export { defaultSynonyms } from './synonyms.ts'

/**
 * The offline search index over data/registry/tools.json, with each guide's
 * title, summary and FAQ questions folded into its page. It is built at build
 * time (buildSearchIndex → serializeIndex), shipped as JSON, and loaded when
 * the search box first gets focus (lazySearch). The index and the query are
 * both normalized and run through data/search/synonyms.json, so "bikash
 * kash out", "বিকাশ ক্যাশআউট" and "bKash cash out" find the same page.
 */

/** Field weights: the page name counts most, then its keywords, then the description and guide text. */
export const FIELD_BOOST = { name: 4, keywords: 2.5, description: 1, extra: 0.6 } as const

const FIELDS = Object.keys(FIELD_BOOST) as (keyof typeof FIELD_BOOST)[]

/** How hard a page that misses some query words is pushed down (score × share matched ^ this). */
const COVERAGE_POWER = 2

/** Longest query searched; the rest is cut off (a pasted paragraph would otherwise fuzzy-match every word). */
export const MAX_QUERY = 200

/** Pages search never offers: the search page itself and the error states. */
const HIDDEN = new Set(['search', 'not-found', 'offline'])

/**
 * Pages listed for later rank a little lower, and so do the static pages (about, privacy, …).
 * A brand's own page (mfs) edges out the all-brands tool when the brand is asked ("বিকাশ ক্যাশ
 * আউট"); above about 1.07 it also wins brand-less queries ("cashout calculator"), so keep it small.
 */
const PRIORITY_BOOST = { launch: 1, later: 0.8 } as const
const KIND_BOOST: Partial<Record<RegistryEntry['kind'], number>> = { mfs: 1.05, tool: 1.2, hub: 1.2, static: 0.85, system: 0.9 }

/** What a guide adds to its page's text: the shape of data/guides/<slug>.json, partly. */
export interface GuideText {
  /** The guide's slug; its page is 'guide-<id>' in the registry. */
  id: string
  title?: string
  summary?: string
  faq?: readonly { q: string }[]
}

/** One document in the index. */
interface SearchDoc {
  id: string
  name: string
  keywords: string
  description: string
  extra: string
  kind: RegistryEntry['kind']
  priority: RegistryEntry['priority']
}

export interface SearchHit {
  /** Registry id of the page. */
  id: string
  entry: RegistryEntry
  score: number
  /** Index terms that matched (normalized). */
  terms: string[]
  /** Query terms after normalization and synonyms. */
  queryTerms: string[]
  /** Index term → fields it matched in. */
  match: Record<string, string[]>
}

export interface SearchOptions {
  /** Most hits to return; 10 when left out. */
  limit?: number
  /** Only pages of these kinds. */
  kinds?: readonly RegistryEntry['kind'][]
}

/** Edit distance allowed for a query term: none for short ones, 1 from 4 letters, 2 from 8. */
function fuzziness(term: string): number | false {
  if (/^\d+$/.test(term)) return false
  if (term.length >= 8) return 2
  if (term.length >= 4) return 1
  return false
}

/** The query as index terms: normalized, synonyms applied, and bare numbers dropped when there are words too. */
export function queryTerms(query: string, synonyms: SynonymMap): string[] {
  const terms = synonyms.canonicalize(words(query))
  const wordsOnly = terms.filter((t) => !/^\d+(\.\d+)?$/.test(t))
  return [...new Set(wordsOnly.length > 0 ? wordsOnly : terms)]
}

/** MiniSearch options; the same function builds the index and loads it, so they always agree. */
function miniSearchOptions(synonyms: SynonymMap): Options<SearchDoc> {
  return {
    idField: 'id',
    fields: [...FIELDS],
    storeFields: ['kind', 'priority'],
    tokenize: (text) => synonyms.expand(words(text)),
    processTerm: (term) => term,
    searchOptions: {
      tokenize: (text) => queryTerms(text, synonyms),
      processTerm: (term) => term,
      boost: { ...FIELD_BOOST },
      prefix: (term) => term.length >= 2 && !/^\d+$/.test(term),
      fuzzy: fuzziness,
      maxFuzzy: 2,
      weights: { fuzzy: 0.4, prefix: 0.5 },
      combineWith: 'OR',
      boostDocument: (_id, _term, stored) => {
        const priority = stored?.priority as RegistryEntry['priority'] | undefined
        const kind = stored?.kind as RegistryEntry['kind'] | undefined
        return (priority ? PRIORITY_BOOST[priority] : 1) * ((kind && KIND_BOOST[kind]) ?? 1)
      },
    },
  }
}

/** The documents for a registry, with guide text merged into the matching 'guide-<id>' pages. */
export function searchDocuments(registry: Registry, guides: readonly GuideText[] = []): SearchDoc[] {
  const extraById = new Map<string, string[]>()
  for (const g of guides) {
    const texts = [g.title, g.summary, ...(g.faq ?? []).map((f) => f.q)].filter((t): t is string => !!t)
    extraById.set(`guide-${g.id}`, texts)
  }
  return registry.entries
    .filter((e) => !HIDDEN.has(e.id))
    .map((e) => ({
      id: e.id,
      name: [e.name.bn, e.name.en, e.shortName?.bn, e.shortName?.en].filter(Boolean).join(' · '),
      keywords: e.keywords.join(' · '),
      description: `${e.description.bn} · ${e.description.en}`,
      extra: (extraById.get(e.id) ?? []).join(' · '),
      kind: e.kind,
      priority: e.priority,
    }))
}

/** A loaded index, ready to answer queries. */
export class HisabSearch {
  readonly index: MiniSearch<SearchDoc>
  readonly synonyms: SynonymMap
  private readonly byId: Map<string, RegistryEntry>

  constructor(index: MiniSearch<SearchDoc>, synonyms: SynonymMap, registry: Registry) {
    this.index = index
    this.synonyms = synonyms
    this.byId = new Map(registry.entries.map((e) => [e.id, e]))
  }

  /** Registry pages for a query, best first; empty for an empty query. */
  search(query: string, options: SearchOptions = {}): SearchHit[] {
    const limit = options.limit ?? 10
    const kinds = options.kinds
    query = query.slice(0, MAX_QUERY)
    const asked = queryTerms(query, this.synonyms).length
    const results: SearchResult[] = this.index.search(query, kinds ? { filter: (r) => kinds.includes(r.kind) } : {})
    // MiniSearch adds up the terms' scores, so one frequent word can outrank a page that
    // matches every word ("stc pay"); scale by the share of query words each page matched.
    for (const r of results) r.score *= (Math.min(r.queryTerms.length, asked) / Math.max(asked, 1)) ** COVERAGE_POWER
    results.sort((a, b) => b.score - a.score)
    const hits: SearchHit[] = []
    for (const r of results) {
      const entry = this.byId.get(r.id as string)
      if (!entry) continue
      hits.push({ id: entry.id, entry, score: r.score, terms: r.terms, queryTerms: r.queryTerms, match: r.match })
      if (hits.length >= limit) break
    }
    return hits
  }

  /** The index as plain JSON, for the build to write next to the page bundle. */
  toJSON(): AsPlainObject {
    return this.index.toJSON()
  }
}

export interface BuildInput {
  registry?: Registry
  guides?: readonly GuideText[]
  synonyms?: SynonymFile
}

/** Builds the index (at build time, or in tests). */
export function buildSearchIndex(input: BuildInput = {}): HisabSearch {
  const registry = input.registry ?? defaultRegistry
  const synonyms = input.synonyms ? createSynonymMap(input.synonyms) : defaultSynonymMap()
  const index = new MiniSearch<SearchDoc>(miniSearchOptions(synonyms))
  index.addAll(searchDocuments(registry, input.guides))
  return new HisabSearch(index, synonyms, registry)
}

/** The index as a JSON string. */
export function serializeIndex(search: HisabSearch): string {
  return JSON.stringify(search.toJSON())
}

/** Loads an index written by serializeIndex; pass the same synonym file it was built with. */
export function loadSearchIndex(
  json: string | AsPlainObject,
  input: Omit<BuildInput, 'guides'> = {},
): HisabSearch {
  const registry = input.registry ?? defaultRegistry
  const synonyms = input.synonyms ? createSynonymMap(input.synonyms) : defaultSynonymMap()
  const options = miniSearchOptions(synonyms)
  const index = typeof json === 'string' ? MiniSearch.loadJSON(json, options) : MiniSearch.loadJS(json, options)
  return new HisabSearch(index, synonyms, registry)
}

export interface LazySearch {
  /** Starts loading (call it when the search box gets focus); later calls reuse the same load. */
  ready(): Promise<HisabSearch>
  search(query: string, options?: SearchOptions): Promise<SearchHit[]>
}

/**
 * Loads the index on first use. `load` fetches or imports the serialized
 * index; a failed load is retried on the next call instead of being cached.
 */
export function lazySearch(load: () => Promise<string | AsPlainObject>, input: Omit<BuildInput, 'guides'> = {}): LazySearch {
  let pending: Promise<HisabSearch> | null = null
  const ready = () => {
    pending ??= load()
      .then((json) => loadSearchIndex(json, input))
      .catch((error: unknown) => {
        pending = null
        throw error
      })
    return pending
  }
  return {
    ready,
    search: async (query, options) => (await ready()).search(query, options),
  }
}
