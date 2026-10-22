// The registry-driven parts of a calculator page: title, subtitle, breadcrumb and "আরও টুল",
// all from data/registry/tools.json, so a new tool needs no copy for them.
import { getEntry, type RegistryEntry } from '@hisab/data/registry'
import type { Lang } from '@hisab/i18n/locale'
import { t } from '@hisab/i18n/messages'
import { routeOf } from '@hisab/i18n/routes'
import type { RelatedTool, ToolPageContent } from './types.ts'

/** An entry's hubs from the top: cash-out → [mobile-banking]. */
export function sectionChain(entry: RegistryEntry): RegistryEntry[] {
  const chain: RegistryEntry[] = []
  let parent = entry.section === 'root' ? undefined : getEntry(entry.section)
  while (parent && !chain.includes(parent)) {
    chain.unshift(parent)
    parent = parent.section === 'root' ? undefined : getEntry(parent.section)
  }
  return chain
}

/** Pages with a fixed route (no [param]) can be linked from a related list. */
const linkable = (entry: RegistryEntry) => !entry.route.bn.includes('[')

/** The registry's `related` pages as tool cards; the tag is the page's section. */
export function relatedTools(entry: RegistryEntry, lang: Lang, limit = 4): RelatedTool[] {
  return entry.related
    .map((id) => getEntry(id))
    .filter((e): e is RegistryEntry => !!e && linkable(e))
    .slice(0, limit)
    .map((e) => {
      const section = e.section === 'root' ? undefined : getEntry(e.section)
      return {
        id: e.id,
        href: routeOf(e.id, lang),
        tag: section ? (section.shortName ?? section.name)[lang] : '',
        // Tools keep their short name ("সেন্ড মানি চার্জ"); provider pages need the full one ("বিকাশ ক্যাশ আউট চার্জ").
        title: (e.kind === 'tool' ? (e.shortName ?? e.name) : e.name)[lang],
        description: e.description[lang],
      }
    })
}

export function toolPageContent(
  id: string,
  lang: Lang,
  extra: Pick<ToolPageContent, 'data' | 'steps' | 'faq'> & {
    subtitle?: string
    relatedLimit?: number
    /**
     * Name the hub crumbs with the entry's own `breadcrumb` labels (Figma D1–L4: "তারিখ ও বয়স",
     * "জমি ও সোনা") instead of the hub pages' names ("তারিখ, জমি, সোনা"); the links stay the hubs.
     */
    registryCrumbs?: boolean
  } = {},
): ToolPageContent {
  const entry = getEntry(id)
  if (!entry) throw new Error(`toolPageContent: no registry entry '${id}'`)
  const hubs = sectionChain(entry)
  const named = extra.registryCrumbs ? entry.breadcrumb?.[lang] : undefined
  const hubLabel = (hub: RegistryEntry, i: number) => (named && named.length === hubs.length + 1 ? named[i]! : (hub.shortName ?? hub.name)[lang])
  return {
    lang,
    id,
    title: entry.name[lang],
    subtitle: extra.subtitle ?? entry.description[lang],
    crumbs: [
      { label: t(lang, 'nav.home'), href: routeOf('home', lang) },
      ...hubs.map((hub, i) => ({ label: hubLabel(hub, i), href: routeOf(hub.id, lang) })),
      { label: (entry.shortName ?? entry.name)[lang] },
    ],
    data: extra.data,
    steps: extra.steps,
    faq: extra.faq,
    related: relatedTools(entry, lang, extra.relatedLimit),
  }
}
