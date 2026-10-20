// Bangla is served at the root and English under /en/ (registry routes follow the same rule).

export type Lang = 'bn' | 'en'

export const LANGS: readonly Lang[] = ['bn', 'en']

export const DEFAULT_LANG: Lang = 'bn'

/** The language of a route: '/en' and '/en/...' are English, everything else Bangla. */
export function langOfPath(pathname: string): Lang {
  return /^\/en(?=\/|$)/.test(pathname) ? 'en' : 'bn'
}

/** The path without its language prefix ('/en/tools/emi' → '/tools/emi', '/en' → '/'). */
export function neutralPath(pathname: string): string {
  const path = pathname.replace(/^\/en(?=\/|$)/, '')
  return path === '' ? '/' : path
}

/** The same page in another language ('/tools/emi', 'en' → '/en/tools/emi'; '/', 'en' → '/en/'). */
export function localePath(lang: Lang, pathname: string): string {
  const path = neutralPath(pathname)
  if (lang === 'bn') return path
  return path === '/' ? '/en/' : `/en${path}`
}
