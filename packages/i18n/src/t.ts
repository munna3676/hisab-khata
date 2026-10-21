import { formatNumber } from '@hisab/core/lib/format'
import type { Lang } from './locale.ts'

// The message runtime without the message files. Islands import this (directly or through
// @hisab/pages), so a page's JavaScript carries only the strings it is given: the server picks
// the keys an island needs in its language (pickMessages) and passes them as a prop, and the
// island hands them to provideMessages before it renders. @hisab/i18n/messages loads both full
// message files into the same catalog for server code, the app and tests.

/** The shape of the message files; bn.json is the source of truth for keys (type only: no JSON in the bundle). */
export type Messages = typeof import('./bn.json')

/** Dotted paths to every string leaf: 'nav.home', 'sheet.share.title', … */
type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>
}[keyof T & string]

export type MessageKey = Leaves<Messages>

/**
 * Values for the {name} placeholders. Numbers are formatted for the language (Bangla digits and
 * lakh commas in bn), so pass a year or an id as a string ('২০২৬' via plainDigits) to keep it
 * ungrouped. Strings are inserted as they are.
 */
export type MessageVars = Record<string, string | number>

/** Some messages of one language, keyed by their dotted key (what pickMessages returns). */
export type MessageSubset = Partial<Record<MessageKey, string>>

type Tree = { [key: string]: string | Tree }

const catalog: Partial<Record<Lang, Tree>> = {}
const flat: Partial<Record<Lang, Record<string, string>>> = {}

/** Registers a full message tree for a language (@hisab/i18n/messages does this for bn and en). */
export function provideMessageTree(lang: Lang, tree: object): void {
  catalog[lang] = tree as Tree
}

/** Adds an island's messages (from pickMessages on the server) for its language. */
export function provideMessages(lang: Lang, messages: MessageSubset | undefined): void {
  if (!messages) return
  flat[lang] = Object.assign(flat[lang] ?? {}, messages)
}

function lookup(lang: Lang, key: string): string | undefined {
  const own = flat[lang]?.[key]
  if (own !== undefined) return own
  let node: unknown = catalog[lang]
  for (const part of key.split('.')) {
    if (node === undefined || node === null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return typeof node === 'string' ? node : undefined
}

/** The given keys in one language, for an island's props. Needs the full catalog (server side). */
export function pickMessages(lang: Lang, keys: readonly MessageKey[]): MessageSubset {
  const out: MessageSubset = {}
  for (const key of keys) out[key] = message(lang, key)
  return out
}

// {name} inserts a value; {count:bank|banks} picks the first word when count is 1, else the second.
const PLACEHOLDER = /\{(\w+)(?::([^|{}]*)\|([^{}]*))?\}/g

/** The raw message text, before placeholders are filled. */
export function message(lang: Lang, key: MessageKey): string {
  const text = lookup(lang, key)
  // A key the island was not given (add it to its message list) or one built at runtime: fail loudly.
  if (text === undefined) throw new Error(`i18n: no message '${key}' in ${lang}`)
  return text
}

/** Fills {name} and {count:one|other} placeholders. An unknown name is left as written. */
export function interpolate(lang: Lang, text: string, vars: MessageVars = {}): string {
  return text.replace(PLACEHOLDER, (whole, name: string, one?: string, other?: string) => {
    const value = vars[name]
    if (value === undefined) return whole
    if (one !== undefined) return Number(value) === 1 ? one : (other ?? '')
    return typeof value === 'number' ? formatNumber(value, { digits: lang }) : value
  })
}

/** t('bn', 'search.resultsFor', { query: 'EMI', count: 6 }) → '"EMI" এর জন্য ৬টি ফলাফল'. */
export function t(lang: Lang, key: MessageKey, vars?: MessageVars): string {
  return interpolate(lang, message(lang, key), vars)
}

/** A t() bound to one language, for a page or island that renders in a single language. */
export function translator(lang: Lang): (key: MessageKey, vars?: MessageVars) => string {
  return (key, vars) => t(lang, key, vars)
}

/** The placeholder names a message uses ('{count:bank|banks}' counts as 'count'), sorted. */
export function placeholdersOf(text: string): string[] {
  return [...new Set([...text.matchAll(PLACEHOLDER)].map((match) => match[1]!))].sort()
}
