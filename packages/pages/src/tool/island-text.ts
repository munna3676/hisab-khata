// Server side of tool/text.ts: builds an island's `text` prop. Imports the full message catalog,
// so never import this from an island.
import type { Lang } from '@hisab/i18n/locale'
import { pickMessages, type MessageKey } from '@hisab/i18n/messages'
import { localize, TOOL_MESSAGE_KEYS, type CopyTable, type IslandText } from './text.ts'

/** The island's copy in `lang` plus the template's messages and `keys` (the tool's own t() keys). */
export function islandText<C extends CopyTable>(lang: Lang, copy: C, keys: readonly MessageKey[] = []): IslandText<C> {
  return { copy: localize(copy, lang), messages: pickMessages(lang, [...new Set([...TOOL_MESSAGE_KEYS, ...keys])]) }
}
