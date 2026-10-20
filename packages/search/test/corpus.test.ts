import { isDeepStrictEqual } from 'node:util'
import { describe, expect, it } from 'vitest'
import { registry } from '@hisab/data/registry'
import corpus from '../../../tests/search-corpus.json' with { type: 'json' }
import { readGuides } from '../src/build-index.ts'
import { buildSearchIndex, searchDocuments } from '../src/index.ts'
import { answer, parseIntent } from '../src/intent.ts'
import { answerData, today } from './fixtures.ts'

// tests/search-corpus.json: realistic queries (Bangla, Banglish, English,
// typos, mixed digits) with the pages or answer cards they should find.

interface SearchRow {
  q: string
  top3: string[]
}

interface IntentRow {
  q: string
  must?: boolean
  intent: { toolId: string; params: Record<string, unknown> } | null
}

const search = buildSearchIndex({ guides: readGuides() })
const searchRows = corpus.search as SearchRow[]
const intentRows = corpus.intents as IntentRow[]

function intentMatches(row: IntentRow): boolean {
  const got = parseIntent(row.q)
  if (row.intent === null) return got === null
  return got !== null && got.toolId === row.intent.toolId && isDeepStrictEqual({ ...got.params }, row.intent.params)
}

describe('search corpus', () => {
  it('has 200+ queries in Bangla, Banglish and English', () => {
    expect(searchRows.length + intentRows.length).toBeGreaterThanOrEqual(200)
    expect(searchRows.some((r) => /[\u0980-\u09ff]/.test(r.q))).toBe(true)
    expect(searchRows.some((r) => /^[\x20-\x7e]+$/.test(r.q))).toBe(true)
  })

  it('every expected id is a registry page search can return', () => {
    const ids = new Set(searchDocuments(registry).map((d) => d.id))
    for (const row of searchRows) for (const id of row.top3) expect(ids.has(id), `${row.q} → ${id}`).toBe(true)
  })

  it('finds an expected page in the top 3 for at least 95% of queries', () => {
    const misses = searchRows.filter((row) => !search.search(row.q, { limit: 3 }).some((h) => row.top3.includes(h.id)))
    const hitRate = 1 - misses.length / searchRows.length
    expect(hitRate, `misses: ${misses.map((m) => m.q).join(' | ')}`).toBeGreaterThanOrEqual(0.95)
  })

  it('reads every must-pass intent and answers it', () => {
    const must = intentRows.filter((r) => r.must)
    expect(must.length).toBeGreaterThanOrEqual(8)
    for (const row of must) {
      expect(intentMatches(row), row.q).toBe(true)
      expect(answer(parseIntent(row.q)!, answerData, { today }), row.q).not.toBeNull()
    }
  })

  it('reads at least 95% of all intent rows (including the ones that must stay searches)', () => {
    const misses = intentRows.filter((row) => !intentMatches(row))
    expect(1 - misses.length / intentRows.length, `misses: ${misses.map((m) => m.q).join(' | ')}`).toBeGreaterThanOrEqual(0.95)
  })
})
