// Site-wide wiring for the page shell: languages, registry routes, the bottom nav tabs, the desktop
// section links and the footer links, all from @hisab/i18n and data/registry/tools.json.
import { getEntry, registry, type RegistryEntry } from '@hisab/data/registry'
import { plainDigits } from '@hisab/i18n/format'
import { langOfPath, type Lang } from '@hisab/i18n/locale'
import { t } from '@hisab/i18n/messages'
import { alternates, matchRoute, routeOf } from '@hisab/i18n/routes'
import type { BottomNavId, BottomNavItem, NavLink } from '@hisab/ui/nav'
import { Bookmark, Grid, Home, ICON_SET } from '@hisab/ui/icons'
import banksJson from '../../../../data/banks.json'

export type { Lang }
export { alternates, langOfPath, routeOf }

/**
 * The page's URL path as the registry writes it. With build.format 'preserve' Astro reports the
 * output file ('/tools/emi.html', '/en/index.html') at build time; the served URL has no '.html'.
 */
export function pagePath(pathname: string): string {
  return pathname.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '')
}

/** The registry entry a pathname shows ('/en/tools/emi' → emi), or undefined (dev pages, 404). */
export function entryForPath(pathname: string): RegistryEntry | undefined {
  const match = matchRoute(pathname)
  return match ? getEntry(match.id) : undefined
}

/** A registry entry's ancestors from the top: emi → [bank]; guide-affidavit → [sorkari-kaj, guides-legal]. */
export function sectionChain(entry: RegistryEntry): RegistryEntry[] {
  const chain: RegistryEntry[] = []
  let parent = entry.section === 'root' ? undefined : getEntry(entry.section)
  while (parent && !chain.includes(parent)) {
    chain.unshift(parent)
    parent = parent.section === 'root' ? undefined : getEntry(parent.section)
  }
  return chain
}

const TAB_OF: Record<string, BottomNavId> = { home: 'home', search: 'search', 'all-tools': 'tools', saved: 'saved' }

/** The bottom-nav tab for a page: only the four tab pages mark a tab. */
export function activeTab(entry: RegistryEntry | undefined): BottomNavId | undefined {
  return entry ? TAB_OF[entry.id] : undefined
}

export function bottomNavItems(lang: Lang): BottomNavItem[] {
  return [
    { id: 'home', href: routeOf('home', lang), label: t(lang, 'nav.home'), icon: Home },
    { id: 'search', href: routeOf('search', lang), label: t(lang, 'nav.search'), icon: ICON_SET.search },
    { id: 'tools', href: routeOf('all-tools', lang), label: t(lang, 'nav.allTools'), icon: Grid },
    { id: 'saved', href: routeOf('saved', lang), label: t(lang, 'nav.saved'), icon: Bookmark },
  ]
}

/** Desktop header links (Figma D1: মোবাইল ব্যাংকিং, ব্যাংক, রেমিট্যান্স, ক্যালকুলেটর, সরকারি কাজ). */
const SECTION_LINKS = [
  ['mobile-banking', 'nav.mobileBanking'],
  ['bank', 'nav.bank'],
  ['remittance', 'nav.remittance'],
  ['calculators', 'nav.calculators'],
  ['sorkari-kaj', 'nav.sorkariKaj'],
] as const

export function sectionLinks(lang: Lang, entry: RegistryEntry | undefined): NavLink[] {
  const inSection = new Set(entry ? [entry.id, ...sectionChain(entry).map((e) => e.id)] : [])
  return SECTION_LINKS.map(([id, key]) => ({ href: routeOf(id, lang), label: t(lang, key), current: inSection.has(id) }))
}

const FOOTER_LINKS = [
  ['about', 'footer.about'],
  ['privacy', 'footer.privacy'],
  ['contact', 'footer.contact'],
  ['disclaimer', 'footer.disclaimer'],
  ['changelog', 'footer.changelog'],
] as const

export function footerLinks(lang: Lang): NavLink[] {
  return FOOTER_LINKS.map(([id, key]) => ({ href: routeOf(id, lang), label: t(lang, key) }))
}

export function copyright(lang: Lang, year = new Date().getFullYear()): string {
  return t(lang, 'footer.copyright', { year: plainDigits(lang, year) })
}

/** Values for [param] routes, from data/: /bank/[bank]/… gets one page per bank in data/banks.json. */

const PARAM_VALUES: Record<string, string[]> = {
  bank: (banksJson as { banks: { id: string }[] }).banks.map((bank) => bank.id),
}

export interface BuiltRoute {
  entry: RegistryEntry
  lang: Lang
  params: Record<string, string>
  path: string
}

/** Every registry page in both languages, with [param] routes expanded from data/. */
export function allRoutes(): BuiltRoute[] {
  const out: BuiltRoute[] = []
  for (const entry of registry.entries) {
    const names = [...entry.route.bn.matchAll(/\[([a-z]+)\]/g)].map((m) => m[1]!)
    const combos: Record<string, string>[] = names.reduce<Record<string, string>[]>(
      (acc, name) => acc.flatMap((params) => (PARAM_VALUES[name] ?? []).map((value) => ({ ...params, [name]: value }))),
      [{}],
    )
    for (const lang of ['bn', 'en'] as const) {
      for (const params of combos) out.push({ entry, lang, params, path: routeOf(entry.id, lang, params) })
    }
  }
  return out
}
