// Sanchayapatra page content: the verified line from data/finance/sanchayapatra.json. Figma C7 has no FAQ.
import type { SanchayapatraFile } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { dataStatus } from '../tool/verification.ts'

export const SANCHAYAPATRA_ID = 'sanchayapatra'

export const SANCHAYAPATRA_MESSAGE_KEYS = [] as const

export function sanchayapatraContent(lang: Lang, file: SanchayapatraFile): ToolPageContent {
  return toolPageContent(SANCHAYAPATRA_ID, lang, { data: dataStatus([file]) })
}
