import bnJson from './bn.json' with { type: 'json' }
import enJson from './en.json' with { type: 'json' }
import type { Lang } from './locale.ts'
import { provideMessageTree, type MessageKey, type Messages } from './t.ts'

// Interface copy (nav, buttons, field labels, sheets, toasts, states, footer) in both languages.
// Bangla is verbatim from the Figma file except the keys in DRAFT_BN_KEYS; English comes from the
// English home frame (A10) where it exists and is a faithful translation everywhere else.
// Page names and descriptions are not here: they live in data/registry/tools.json.
//
// Importing this module loads BOTH message files (about 10 KB gz). Server code, the app and tests
// use it; website islands import @hisab/i18n/t and get their few strings as a prop instead
// (pickMessages / provideMessages), so a page ships only its own language's strings.

export * from './t.ts'

// en.json must have the same shape as bn.json: a missing or misspelt key is a compile error here.
const en: Messages = enJson

export const MESSAGES: Record<Lang, Messages> = { bn: bnJson, en }

provideMessageTree('bn', bnJson)
provideMessageTree('en', en)

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

/** Every key in a message tree, in file order. */
export function keysOf(messages: object, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'string' ? [prefix + key] : keysOf(value as object, `${prefix}${key}.`),
  )
}
