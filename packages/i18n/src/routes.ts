import registryJson from '../../../data/registry/tools.json' with { type: 'json' }
import { localePath, type Lang } from './locale.ts'

// Registry id ↔ route in each language, and the language switch for the current page. Routes come
// from data/registry/tools.json (read directly, so this package needs no @hisab/data dependency);
// a [param] segment such as /bank/[bank]/fdr is filled from params and matched as one segment.

/** The part of a registry entry this module reads. */
export interface RoutedEntry {
  id: string
  route: Record<Lang, string>
}

export type RouteParams = Record<string, string>

export interface RouteMatch {
  id: string
  lang: Lang
  params: RouteParams
}

const ENTRIES: readonly RoutedEntry[] = (registryJson as { entries: RoutedEntry[] }).entries

const byId = new Map(ENTRIES.map((entry) => [entry.id, entry]))

/** '/en/' → ['en'], '/bank/x/fdr' → ['bank', 'x', 'fdr']; '/' → []. */
function segmentsOf(path: string): string[] {
  return path.split('/').filter((segment) => segment !== '')
}

const PARAM = /^\[([a-z]+)\]$/

/** Static routes win over [param] routes when both match, so they are tried first. */
const patterns = ENTRIES.flatMap((entry) =>
  (['bn', 'en'] as const).map((lang) => ({ id: entry.id, lang, segments: segmentsOf(entry.route[lang]) })),
).sort((a, b) => Number(a.segments.some((s) => PARAM.test(s))) - Number(b.segments.some((s) => PARAM.test(s))))

/** True when the registry has a page with this id. */
export function hasRoute(id: string): boolean {
  return byId.has(id)
}

/**
 * The route of a registry page in a language, with [param] segments filled:
 * routeOf('emi', 'en') → '/en/tools/emi'; routeOf('bank-detail-fdr', 'bn', { bank: 'brac-bank' })
 * → '/bank/brac-bank/fdr'. Throws for an unknown id or a missing param, so a broken link fails
 * the build instead of shipping.
 */
export function routeOf(id: string, lang: Lang, params: RouteParams = {}): string {
  const entry = byId.get(id)
  if (!entry) throw new Error(`i18n: no registry page '${id}'`)
  return entry.route[lang].replace(/\[([a-z]+)\]/g, (_segment, name: string) => {
    const value = params[name]
    if (value === undefined || value === '') throw new Error(`i18n: route '${id}' needs param '${name}'`)
    return encodeURIComponent(value)
  })
}

/** Splits '/a/b?x=1#y' into the path and the '?x=1#y' tail. */
function splitPath(href: string): { path: string; tail: string } {
  const cut = href.search(/[?#]/)
  return cut === -1 ? { path: href, tail: '' } : { path: href.slice(0, cut), tail: href.slice(cut) }
}

/** The registry page a pathname shows (query, hash and a trailing slash are ignored), or null. */
export function matchRoute(pathname: string): RouteMatch | null {
  const segments = segmentsOf(splitPath(pathname).path)
  for (const pattern of patterns) {
    if (pattern.segments.length !== segments.length) continue
    const params: RouteParams = {}
    const ok = pattern.segments.every((expected, i) => {
      const actual = segments[i]!
      const param = PARAM.exec(expected)
      if (param) {
        params[param[1]!] = decodeURIComponent(actual)
        return true
      }
      return expected === actual
    })
    if (ok) return { id: pattern.id, lang: pattern.lang, params }
  }
  return null
}

/**
 * The current page in another language, keeping its params, query and hash:
 * switchLanguage('/bank/brac-bank/fdr?amount=5000', 'en') → '/en/bank/brac-bank/fdr?amount=5000'.
 * A path the registry does not know (a dev page, a 404) falls back to the /en prefix rule.
 */
export function switchLanguage(href: string, target: Lang): string {
  const { path, tail } = splitPath(href)
  const match = matchRoute(path)
  return (match ? routeOf(match.id, target, match.params) : localePath(target, path)) + tail
}

/** Both language versions of the current page, for hreflang links and the language toggle. */
export function alternates(href: string): Record<Lang, string> {
  return { bn: switchLanguage(href, 'bn'), en: switchLanguage(href, 'en') }
}
