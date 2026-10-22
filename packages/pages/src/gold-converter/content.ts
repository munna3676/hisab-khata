// Gold converter page content: the verified line from data/gold/bajus-rates.json. Figma L3 has no FAQ.
import type { BajusRatesFile } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { dataStatus } from '../tool/verification.ts'

export const GOLD_ID = 'gold-converter'

export const GOLD_MESSAGE_KEYS = [] as const

export function goldContent(lang: Lang, rates: BajusRatesFile): ToolPageContent {
  return toolPageContent(GOLD_ID, lang, { registryCrumbs: true, data: dataStatus([rates]) })
}
