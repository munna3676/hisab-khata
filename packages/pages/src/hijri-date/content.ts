// Hijri date page content: the verified line from data/dates/hijri-offset.json. Figma D4 has no FAQ.
import type { HijriOffsetFile } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { dataStatus } from '../tool/verification.ts'

export const HIJRI_ID = 'hijri-date'

export const HIJRI_MESSAGE_KEYS = [] as const

export function hijriContent(lang: Lang, offset: HijriOffsetFile): ToolPageContent {
  return toolPageContent(HIJRI_ID, lang, { registryCrumbs: true, data: dataStatus([offset]) })
}
