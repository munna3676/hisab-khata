import { formatNumber } from '@hisab/core/lib/format'
import bnJson from './bn.json' with { type: 'json' }
import enJson from './en.json' with { type: 'json' }
import type { Lang } from './locale.ts'

// Interface copy (nav, buttons, field labels, sheets, toasts, states, footer) in both languages.
// Bangla is verbatim from the Figma file except the keys in DRAFT_BN_KEYS; English comes from the
// English home frame (A10) where it exists and is a faithful translation everywhere else.
// Page names and descriptions are not here: they live in data/registry/tools.json.

/** The shape of the message files; bn.json is the source of truth for keys. */
export type Messages = typeof bnJson

// en.json must have the same shape as bn.json: a missing or misspelt key is a compile error here.
const en: Messages = enJson

export const MESSAGES: Record<Lang, Messages> = { bn: bnJson, en }

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

/** Bangla keys whose copy was written here, not taken from Figma; check them with the designer. */
export const DRAFT_BN_KEYS: readonly MessageKey[] = [
  'nav.skipToContent',
  'nav.back',
  'state.staleBanner',
  'shareCard.shareText',
  'home.yourTools',
  'home.perThousand',
  'home.unverified',
  'home.unverifiedNote',
  'home.banglaMainNote',
  'state.comingSoonTitle',
  'state.comingSoonBody',
  'verified.pending',
  'verified.pendingNote',
  'result.emptyHint',
  'toast.reportFailed',
  'toast.shareFailed',
  'content.printedOn',
]

// {name} inserts a value; {count:bank|banks} picks the first word when count is 1, else the second.
const PLACEHOLDER = /\{(\w+)(?::([^|{}]*)\|([^{}]*))?\}/g

/** The raw message text, before placeholders are filled. */
export function message(lang: Lang, key: MessageKey): string {
  let node: unknown = MESSAGES[lang]
  for (const part of key.split('.')) node = (node as Record<string, unknown>)[part]
  // Unreachable for a typed key; kept so a key built at runtime fails loudly instead of printing undefined.
  if (typeof node !== 'string') throw new Error(`i18n: no message '${key}' in ${lang}`)
  return node
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

/** Every key in a message tree, in file order. */
export function keysOf(messages: object, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'string' ? [prefix + key] : keysOf(value as object, `${prefix}${key}.`),
  )
}
