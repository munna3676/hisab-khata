/// <reference types="node" />
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkDataFile } from '../src/checks.ts'
import { DATA_FILES, checkBounds, matchesPattern, specFor, valuesAt } from '../src/contract.ts'
import { validators } from '../src/generated/validators.js'
import { registry } from '../src/registry.ts'

const repo = new URL('../../../', import.meta.url).pathname
const dataDir = join(repo, 'data')
const schemaDir = join(dataDir, '_schema')
const readJson = (path: string): unknown => JSON.parse(readFileSync(join(dataDir, path), 'utf8'))
const clone = <T>(v: T): T => structuredClone(v)

const dataFiles: string[] = []
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (name.startsWith('_')) continue
    if (statSync(path).isDirectory()) walk(path)
    else if (name.endsWith('.json')) dataFiles.push(relative(dataDir, path).split(sep).join('/'))
  }
}
walk(dataDir)
dataFiles.sort()

/** Every Fact in a file, with its path. */
function factsIn(node: unknown, path = ''): { path: string; fact: Record<string, unknown> }[] {
  if (Array.isArray(node)) return node.flatMap((child, i) => factsIn(child, `${path}/${i}`))
  if (!node || typeof node !== 'object') return []
  if ('checked' in node || 'source' in node) return [{ path: path || '/', fact: node as Record<string, unknown> }]
  return Object.entries(node).flatMap(([k, child]) => factsIn(child, `${path}/${k}`))
}

describe('data contract', () => {
  it('knows every file in data/, and each pattern matches at least one file', () => {
    expect(dataFiles.filter((f) => !specFor(f))).toEqual([])
    expect(DATA_FILES.filter((spec) => !dataFiles.some((f) => matchesPattern(spec.pattern, f))).map((s) => s.pattern)).toEqual([])
  })
  it('matches patterns on whole names and never across folders', () => {
    expect(matchesPattern('guides/*.json', 'guides/nid-correction.json')).toBe(true)
    expect(matchesPattern('guides/*.json', 'guides/x/y.json')).toBe(false)
    expect(matchesPattern('income-tax-*.json', 'income-tax-2026-27.json')).toBe(true)
    expect(matchesPattern('banks.json', 'banksxjson')).toBe(false)
    expect(specFor('nope.json')).toBeUndefined()
  })
  it('has one schema file per contract schema, and a generated validator for each', () => {
    const schemas = readdirSync(schemaDir).filter((f) => f.endsWith('.schema.json')).map((f) => f.slice(0, -12))
    for (const spec of DATA_FILES) {
      expect(schemas, spec.pattern).toContain(spec.schema)
      expect(validators[spec.schema as keyof typeof validators], spec.schema).toBeTypeOf('function')
    }
  })
  it('the committed validators match data/_schema (node scripts/build-validators.mjs --check)', () => {
    expect(() => execFileSync('node', ['scripts/build-validators.mjs', '--check'], { cwd: repo, stdio: 'pipe' })).not.toThrow()
  })
  it('the generated validators are pure ESM with no eval', () => {
    const code = readFileSync(join(repo, 'packages/data/src/generated/validators.js'), 'utf8')
    expect(code).not.toMatch(/\brequire\(|new Function|\beval\(/)
  })
  it.each(dataFiles)('%s passes its schema, bounds and engine rules', (file) => {
    expect(checkDataFile(file, readJson(file))).toEqual([])
  })
  it('every data file a registry page reads exists', () => {
    const missing = registry.entries.flatMap((e) => e.dataFiles.filter((f) => !dataFiles.includes(f)).map((f) => `${e.id}: ${f}`))
    expect(missing).toEqual([])
  })
  it('Fact files hold Facts and editorial files hold none', () => {
    for (const file of dataFiles) {
      const spec = specFor(file)!
      const facts = factsIn(readJson(file))
      if (!spec.facts) expect(facts, file).toEqual([])
      else if (file !== 'remittance.json') expect(facts.length, file).toBeGreaterThan(0)
    }
  })
  it('every seeded Fact is flagged unverified, dated 2000-01-01 and points at an official page', () => {
    for (const file of dataFiles.filter((f) => f !== 'districts.json')) {
      for (const { path, fact } of factsIn(readJson(file))) {
        expect(fact.note, `${file}${path}`).toBe('unverified — seeded from Figma/test fixture')
        expect(fact.checked, `${file}${path}`).toBe('2000-01-01')
        expect(fact.source, `${file}${path}`).toMatch(/^https:\/\//)
      }
    }
  })
})

describe('schemas reject bad data', () => {
  it('a Fact without a source, with a bad date or an extra key', () => {
    const file = readJson('finance/excise-duty.json') as Record<string, unknown>
    const { source: _, ...noSource } = file
    expect(checkDataFile('finance/excise-duty.json', noSource)).not.toEqual([])
    expect(checkDataFile('finance/excise-duty.json', { ...file, checked: '20-10-2026' })).not.toEqual([])
    expect(checkDataFile('finance/excise-duty.json', { ...file, source: 'ftp://x' })).not.toEqual([])
    expect(checkDataFile('finance/excise-duty.json', { ...file, extra: 1 })).not.toEqual([])
  })
  it('a wrong value shape: an unknown MFS service, a negative rate, a string number', () => {
    const mfs = clone(readJson('mfs-charges.json')) as { channels: { value: Record<string, unknown> }[] }
    mfs.channels[0]!.value.service = 'withdraw'
    expect(checkDataFile('mfs-charges.json', mfs)).not.toEqual([])
    const tax = clone(readJson('income-tax-2026-27.json')) as { value: { slabs: { ratePct: unknown }[] } }
    tax.value.slabs[0]!.ratePct = '10'
    expect(checkDataFile('income-tax-2026-27.json', tax)).not.toEqual([])
  })
  it('a file the contract does not know', () => {
    expect(checkDataFile('misc/rates.json', {})).toEqual(['misc/rates.json: not in the data contract (packages/data/src/contract.ts)'])
  })
})

describe('sanity bounds', () => {
  it('flags an MFS charge of more than ৳৫০ per 1,000', () => {
    const mfs = clone(readJson('mfs-charges.json')) as { channels: { value: { bands: { per1000?: number }[] } }[] }
    mfs.channels[0]!.value.bands[0]!.per1000 = 185
    expect(checkDataFile('mfs-charges.json', mfs)).toEqual(['mfs-charges.json: channels/0/value/bands/0/per1000 = 185 is outside 0…50'])
  })
  it('flags schema-valid but implausible values, and accepts the open slab (null)', () => {
    const tax = clone(readJson('finance/interest-tax.json')) as { value: { withTinPct: number } }
    tax.value.withTinPct = 60
    expect(checkDataFile('finance/interest-tax.json', tax)).toEqual(['finance/interest-tax.json: value/withTinPct = 60 is outside 0…50'])
    const vat = clone(readJson('commerce/vat-rates.json')) as { defaultPct: { value: number } }
    vat.defaultPct.value = 150
    expect(checkBounds(specFor('commerce/vat-rates.json')!, vat)).toEqual(['defaultPct/value = 150 is outside 0…100'])
    expect(checkBounds(specFor('finance/excise-duty.json')!, readJson('finance/excise-duty.json'))).toEqual([])
  })
  it('finds values through * in arrays and objects, and skips missing optional fields', () => {
    const data = { a: [{ b: { x: 1, y: 2 } }, { c: 3 }] }
    expect(valuesAt(data, 'a.*.b.*')).toEqual([
      { at: 'a/0/b/x', value: 1 },
      { at: 'a/0/b/y', value: 2 },
    ])
    expect(valuesAt(data, 'a.*.missing')).toEqual([])
  })
})

describe('engine rules a schema cannot express', () => {
  it('excise slabs must rise', () => {
    const excise = clone(readJson('finance/excise-duty.json')) as { value: { upTo: number | null }[] }
    excise.value[1]!.upTo = 100
    expect(checkDataFile('finance/excise-duty.json', excise)).toEqual(['finance/excise-duty.json: upTo must rise strictly and only the last row may be null'])
  })
  it('an MFS channel whose first band does not start at 0, and a reference to an unknown channel', () => {
    const mfs = clone(readJson('mfs-charges.json')) as { channels: { value: { bands: { from: number }[] } }[]; referenceByService: Record<string, string> }
    mfs.channels[0]!.value.bands[0]!.from = 10
    mfs.referenceByService.cashOut = 'nope'
    const errors = checkDataFile('mfs-charges.json', mfs)
    expect(errors).toContain('mfs-charges.json: channels/0 (bkash-agent) is not a valid MfsChannel')
    expect(errors).toContain("mfs-charges.json: referenceByService.cashOut names unknown channel 'nope'")
  })
  it('a grade scale that does not fall to 0', () => {
    const ugc = clone(readJson('education/ugc-grading.json')) as { value: { minMarks: number }[] }
    ugc.value.at(-1)!.minMarks = 10
    expect(checkDataFile('education/ugc-grading.json', ugc)).toEqual(['education/ugc-grading.json: grade scale is not valid'])
  })
  it('a guide wizard result that lists a document the guide does not have', () => {
    const guide = clone(readJson('guides/nid-correction.json')) as { wizard: { results: { documents: string[] }[] } }
    guide.wizard.results[0]!.documents.push('passport-copy')
    expect(checkDataFile('guides/nid-correction.json', guide)[0]).toMatch(/unknown document 'passport-copy'/)
  })
})

describe('sanity bounds on engine inputs a schema leaves open', () => {
  const mutate = (path: string, edit: (d: any) => void) => {
    const data = clone(readJson(path)) as any
    edit(data)
    return checkDataFile(path, data)
  }
  it('flags a fitra kg per person, an income tax slab width, a courier weight and a savings certificate limit that are typos', () => {
    expect(mutate('religion/fitra.json', (d) => (d.value.items[0].kgPerPerson = 1650))).toEqual([
      'religion/fitra.json: value/items/0/kgPerPerson = 1650 is outside 0.5…10',
    ])
    expect(mutate('income-tax-2026-27.json', (d) => (d.value.slabs[0].width = 3_000_000_000))).toEqual([
      'income-tax-2026-27.json: value/slabs/0/width = 3000000000 is outside 10000…10000000',
    ])
    expect(mutate('commerce/couriers.json', (d) => (d.steadfast.value.zones['inside-dhaka'].slabs[0].maxKg = 1000))).toEqual([
      'commerce/couriers.json: steadfast/value/zones/inside-dhaka/slabs/0/maxKg = 1000 is outside 0.1…100',
    ])
    expect(mutate('finance/sanchayapatra.json', (d) => (d.value[0].maxInvestment = 45_000_000_000))).toEqual([
      'finance/sanchayapatra.json: value/0/maxInvestment = 45000000000 is outside 1000…100000000',
    ])
    expect(mutate('land/registration-costs.json', (d) => (d.value[3].perUnit = 2e9))).toHaveLength(1)
    expect(mutate('electricity-tariff.json', (d) => (d.value.tariffs['LT-A'].lifeline.maxUnits = 50_000))).toHaveLength(1)
  })
})

describe('search/synonyms.json', () => {
  type Terms = { terms: { canonical: string; variants: string[] }[] }
  const { terms } = readJson('search/synonyms.json') as Terms
  /** Roughly what any search normalizer does first: NFC, lower case, hyphens and spaces as one space. */
  const key = (s: string) => s.normalize('NFC').toLowerCase().replace(/[\s-]+/g, ' ').trim()

  it('has one entry per canonical term', () => {
    const keys = terms.map((t) => key(t.canonical))
    expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual([])
  })
  it('never sends one spelling to two different terms', () => {
    const owner = new Map<string, string>()
    const clashes: string[] = []
    for (const t of terms) {
      for (const v of new Set(t.variants.map(key))) {
        const other = owner.get(v)
        if (other && other !== t.canonical) clashes.push(`${v}: ${other} / ${t.canonical}`)
        owner.set(v, t.canonical)
      }
    }
    expect(clashes).toEqual([])
  })
  it('no variant is the canonical form of another term (no chains or cycles)', () => {
    const canon = new Map(terms.map((t) => [key(t.canonical), t.canonical]))
    const chains = terms.flatMap((t) => t.variants.filter((v) => canon.has(key(v)) && canon.get(key(v)) !== t.canonical).map((v) => `${v} → ${t.canonical}`))
    expect(chains).toEqual([])
  })
  it('every entry is short enough to be a search word, with no control or invisible characters', () => {
    const bad = terms
      .flatMap((t) => [t.canonical, ...t.variants])
      .filter((s) => s.length > 40 || s !== s.trim() || /[\p{Cc}\u200b-\u200d\u2028\u2029\u2060\ufeff]/u.test(s))
    expect(bad).toEqual([])
  })
})
