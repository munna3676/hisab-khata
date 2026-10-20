/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'
import { Ajv2020 } from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { describe, expect, it } from 'vitest'
import { getEntry, hubItems, registry, routeFor, type RegistryEntry } from '../src/registry.ts'

const repo = new URL('../../../', import.meta.url)
const readJson = (path: string): unknown => JSON.parse(readFileSync(new URL(path, repo), 'utf8'))

type Page = 'mobile' | 'desktop'
interface FrameList {
  pages: Record<Page, { frames: { id: string; name: string; width: number }[] }>
}
interface MapEntry {
  page: Page
  name: string
  registryId?: string
  overlay?: string
  state?: string
  variant: string
  width: number
}

const raw = readJson('data/registry/tools.json')
const frames = readJson('design/figma-frames.json') as FrameList
const figmaMap = (readJson('design/figma-map.json') as { frames: Record<string, MapEntry> }).frames
const entries = registry.entries
const ids = new Set(entries.map((e) => e.id))
const pages: Page[] = ['mobile', 'desktop']

const duplicates = (list: string[]) => list.filter((x, i) => list.indexOf(x) !== i)

describe('registry schema', () => {
  it('data/registry/tools.json matches registry.schema.json', () => {
    const ajv = new Ajv2020({ allErrors: true, strict: true })
    addFormats(ajv)
    const validate = ajv.compile(readJson('data/_schema/registry.schema.json') as object)
    const ok = validate(raw)
    expect(validate.errors ?? [], JSON.stringify(validate.errors, null, 2)).toEqual([])
    expect(ok).toBe(true)
  })
  it('rejects a hub without items, items on a tool, a non-ASCII route and an unknown field', () => {
    const ajv = new Ajv2020({ strict: true })
    const validate = ajv.compile(readJson('data/_schema/registry.schema.json') as object)
    const withEntry = (id: string, patch: (e: Record<string, unknown>) => void) => {
      const copy = structuredClone(raw) as { entries: Record<string, unknown>[] }
      patch(copy.entries.find((e) => e.id === id)!)
      return copy
    }
    expect(validate(withEntry('calculators', (e) => delete e.items))).toBe(false)
    expect(validate(withEntry('emi', (e) => (e.items = ['dps'])))).toBe(false)
    expect(validate(withEntry('emi', (e) => (e.route = { bn: '/টুল/emi', en: '/en/টুল/emi' })))).toBe(false)
    expect(validate(withEntry('emi', (e) => (e.engine = 'emi')))).toBe(false)
    expect(validate(withEntry('emi', (e) => (e.icon = 'calculator')))).toBe(false)
    expect(validate(withEntry('emi', () => {}))).toBe(true)
  })
  it('the Fact schema still compiles alongside it', () => {
    const ajv = new Ajv2020({ strict: true })
    addFormats(ajv)
    expect(ajv.validate(readJson('data/_schema/fact.schema.json') as object, { value: 1, source: 'https://bb.org.bd/', checked: '2026-10-19' })).toBe(true)
  })
})

describe('registry ids and routes', () => {
  it('has unique ids', () => {
    expect(duplicates(entries.map((e) => e.id))).toEqual([])
  })
  it('has unique Bangla and English routes', () => {
    expect(duplicates(entries.map((e) => e.route.bn))).toEqual([])
    expect(duplicates(entries.map((e) => e.route.en))).toEqual([])
  })
  it('puts every English route under /en with the same slug', () => {
    for (const e of entries) expect(e.route.en, e.id).toBe(e.route.bn === '/' ? '/en/' : `/en${e.route.bn}`)
  })
  it('fills [param] segments', () => {
    const fdr = getEntry('bank-detail-fdr')!
    expect(routeFor(fdr, 'bn', { bank: 'brac-bank' })).toBe('/bank/brac-bank/fdr')
    expect(routeFor(fdr, 'en', { bank: 'brac-bank' })).toBe('/en/bank/brac-bank/fdr')
    expect(routeFor(getEntry('home')!, 'en')).toBe('/en/')
  })
})

describe('registry references', () => {
  it('sections are root or a hub', () => {
    for (const e of entries) {
      if (e.section === 'root') continue
      expect(getEntry(e.section)?.kind, `${e.id} → ${e.section}`).toBe('hub')
    }
  })
  it('related ids exist and are not the entry itself', () => {
    for (const e of entries) {
      for (const r of e.related) {
        expect(ids.has(r), `${e.id} → ${r}`).toBe(true)
        expect(r).not.toBe(e.id)
      }
    }
  })
  it('hub items and tool groups point at existing entries', () => {
    for (const hub of entries.filter((e) => e.kind === 'hub')) {
      expect(hubItems(hub).map((e) => e.id), hub.id).toEqual(hub.items)
    }
    const grouped = registry.groups.flatMap((g) => g.items)
    expect(duplicates(grouped)).toEqual([])
    for (const id of grouped) expect(['tool', 'mfs'], id).toContain(getEntry(id)?.kind)
  })
  it('every page below a hub is linked from a hub, a tool group or another page', () => {
    const linked = new Set([
      ...entries.flatMap((e) => [...(e.items ?? []), ...e.related.filter((r) => r !== e.id)]),
      ...registry.groups.flatMap((g) => g.items),
    ])
    expect(entries.filter((e) => e.section !== 'root' && !linked.has(e.id)).map((e) => e.id)).toEqual([])
  })
  it('engine files exist in packages/core/src', () => {
    for (const e of entries.filter((e): e is RegistryEntry & { engine: string } => e.engine !== null)) {
      expect(existsSync(new URL(`packages/core/src/${e.engine}`, repo)), `${e.id} → ${e.engine}`).toBe(true)
    }
  })
  it('keywords mix Bangla and Latin script', () => {
    for (const e of entries) {
      expect(e.keywords.some((k) => /[ঀ-৿]/.test(k)), `${e.id} Bangla`).toBe(true)
      expect(e.keywords.some((k) => /[a-z]/i.test(k)), `${e.id} Latin`).toBe(true)
    }
  })
  it('only pages drawn in Figma carry a breadcrumb, with one English label per Bangla label', () => {
    for (const e of entries) {
      if (!e.breadcrumb) continue
      expect(e.figma.mobile.length + e.figma.desktop.length, e.id).toBeGreaterThan(0)
      expect(e.breadcrumb.en.length, e.id).toBe(e.breadcrumb.bn.length)
    }
  })
})

describe('Figma coverage', () => {
  const frameById = new Map(pages.flatMap((page) => frames.pages[page].frames.map((f) => [f.id, { ...f, page }] as const)))

  it('registry frame ids exist on the right Figma page', () => {
    for (const e of entries) {
      for (const page of pages) {
        for (const id of e.figma[page]) expect(frameById.get(id)?.page, `${e.id} ${id}`).toBe(page)
      }
    }
  })
  it('no frame is claimed by two entries', () => {
    expect(duplicates(entries.flatMap((e) => [...e.figma.mobile, ...e.figma.desktop]))).toEqual([])
  })
  it('every Figma frame is referenced by the registry or by design/figma-map.json', () => {
    const inRegistry = new Set(entries.flatMap((e) => [...e.figma.mobile, ...e.figma.desktop]))
    const unreferenced = [...frameById.keys()].filter((id) => !inRegistry.has(id) && !(id in figmaMap))
    expect(unreferenced).toEqual([])
  })
  it('figma-map lists every frame with its page, name and width', () => {
    expect(Object.keys(figmaMap).sort()).toEqual([...frameById.keys()].sort())
    for (const [id, m] of Object.entries(figmaMap)) {
      const frame = frameById.get(id)!
      expect([m.page, m.name, m.width], id).toEqual([frame.page, frame.name, frame.width])
      expect(m.variant.length, id).toBeGreaterThan(0)
      expect(Boolean(m.registryId ?? m.overlay ?? m.state), `${id} needs registryId, overlay or state`).toBe(true)
    }
  })
  it('figma-map and the registry agree on which page a frame draws', () => {
    for (const [id, m] of Object.entries(figmaMap)) {
      if (m.registryId === undefined) continue
      const entry = getEntry(m.registryId)
      expect(entry, `${id} → ${m.registryId}`).toBeDefined()
      // A page frame is listed on its entry; an overlay frame only names the page it is drawn over.
      expect(entry!.figma[m.page].includes(id), `${id} ${m.name}`).toBe(m.overlay === undefined)
    }
  })
})
