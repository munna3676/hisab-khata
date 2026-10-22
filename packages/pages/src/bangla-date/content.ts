// Bangla date page content: the verified line from data/dates/special-days.json and
// data/dates/hijri-offset.json (the Hijri row). Figma D3 has no FAQ.
import type { HijriOffsetFile, SpecialDaysFile } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { dataStatus } from '../tool/verification.ts'

export const BANGLA_DATE_ID = 'bangla-date'

export const BANGLA_DATE_MESSAGE_KEYS = [] as const

export function banglaDateContent(lang: Lang, special: SpecialDaysFile, offset: HijriOffsetFile): ToolPageContent {
  return toolPageContent(BANGLA_DATE_ID, lang, { registryCrumbs: true, data: dataStatus([special, offset]) })
}
