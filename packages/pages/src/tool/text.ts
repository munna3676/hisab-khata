// One language's strings per page. A tool's copy.ts holds both languages ({ bn, en } leaves) and
// the shared interface copy lives in @hisab/i18n; neither is imported by the island. The server
// localizes the copy and picks the @hisab/i18n keys the island uses (islandText in
// island-text.ts), passes them as the `text` prop, and the island reads them with useIslandText.
// So a Bangla page ships only Bangla strings, and only the keys it needs.
import type { Lang } from '@hisab/i18n/locale'
import { provideMessages, type MessageKey, type MessageSubset } from '@hisab/i18n/t'

/** A copy table: every leaf is { bn, en }. */
export type CopyTable = { readonly [key: string]: Readonly<Record<Lang, string>> | CopyTable }

/** The same table with each { bn, en } leaf replaced by one language's string. */
export type Localized<C> = {
  -readonly [K in keyof C]: C[K] extends Readonly<Record<Lang, string>> ? string : Localized<C[K]>
}

const isLeaf = (value: unknown): value is Record<Lang, string> =>
  typeof value === 'object' && value !== null && typeof (value as Record<string, unknown>).bn === 'string' && typeof (value as Record<string, unknown>).en === 'string'

/** COPY → its strings in one language. */
export function localize<C extends CopyTable>(copy: C, lang: Lang): Localized<C> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(copy)) out[key] = isLeaf(value) ? value[lang] : localize(value as CopyTable, lang)
  return out as Localized<C>
}

/** What an island gets from the server: its copy in one language and the @hisab/i18n messages it uses. */
export interface IslandText<C extends CopyTable> {
  copy: Localized<C>
  messages: MessageSubset
}

/**
 * The @hisab/i18n keys the calculator template uses in the browser (ToolActions, ResultEmpty, the
 * number field messages, quick values). islandText always adds them.
 */
export const TOOL_MESSAGE_KEYS = [
  'action.share',
  'action.reportError',
  'action.actionBar',
  'action.close',
  'sheet.reportError.title',
  'sheet.reportError.body',
  'sheet.reportError.whichNumber',
  'sheet.reportError.correctInfo',
  'sheet.reportError.correctPlaceholder',
  'sheet.reportError.sourceLink',
  'sheet.reportError.submit',
  'toast.region',
  'toast.linkCopied',
  'toast.shareFailed',
  'toast.reportSent',
  'toast.reportFailed',
  'content.printedOn',
  'result.emptyHint',
  'validation.numbersOnly',
  'validation.min',
  'validation.max',
  'field.quickValues',
] as const satisfies readonly MessageKey[]

/** Call first thing in an island: registers its messages (for t()) and returns its copy. */
export function useIslandText<C extends CopyTable>(lang: Lang, text: IslandText<C>): Localized<C> {
  provideMessages(lang, text.messages)
  return text.copy
}
