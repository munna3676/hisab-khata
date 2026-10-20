import registryJson from '../../../data/registry/tools.json' with { type: 'json' }

// Typed view of data/registry/tools.json (schema: data/_schema/registry.schema.json).

export type Lang = 'bn' | 'en'

export interface Localized {
  bn: string
  en: string
}

export type EntryKind = 'tool' | 'hub' | 'guide' | 'mfs' | 'bank' | 'remittance' | 'static' | 'system'

export interface RegistryEntry {
  /** Stable kebab-case id; saved items and share links keep it. */
  id: string
  kind: EntryKind
  /** 'root' or the id of the hub this page sits under. */
  section: string
  priority: 'launch' | 'later'
  /** ASCII paths; a [param] segment (e.g. [bank]) is filled from data. */
  route: Localized
  name: Localized
  shortName?: Localized
  description: Localized
  /** Labels after 'হোম', exactly as the Figma frame shows them. */
  breadcrumb?: { bn: string[]; en: string[] }
  keywords: string[]
  related: string[]
  /** packages/core/src module file, e.g. 'emi.ts'. */
  engine: string | null
  /** Files under data/ the page reads. */
  dataFiles: string[]
  figma: { mobile: string[]; desktop: string[] }
  /** Hubs only: listed pages in Figma order. */
  items?: string[]
  /** The Bangla copy is not verbatim from Figma yet. */
  draftCopy?: true
}

export interface RegistryGroup {
  id: string
  name: Localized
  items: string[]
}

export interface Registry {
  groups: RegistryGroup[]
  entries: RegistryEntry[]
}

export const registry: Registry = registryJson as unknown as Registry

const byId = new Map(registry.entries.map((entry) => [entry.id, entry]))

/** The entry with this id, or undefined. */
export function getEntry(id: string): RegistryEntry | undefined {
  return byId.get(id)
}

/** Pages whose breadcrumb parent is the given hub id ('root' for top-level pages). */
export function entriesInSection(section: string): RegistryEntry[] {
  return registry.entries.filter((entry) => entry.section === section)
}

/** The entries a hub lists, in Figma order. */
export function hubItems(hub: RegistryEntry): RegistryEntry[] {
  return (hub.items ?? []).map((id) => byId.get(id)).filter((entry): entry is RegistryEntry => entry !== undefined)
}

/** The route in a language with [param] segments filled, e.g. ('/bank/[bank]/fdr', { bank: 'brac-bank' }). */
export function routeFor(entry: RegistryEntry, lang: Lang, params: Record<string, string> = {}): string {
  return entry.route[lang].replace(/\[([a-z]+)\]/g, (segment, name: string) => params[name] ?? segment)
}
