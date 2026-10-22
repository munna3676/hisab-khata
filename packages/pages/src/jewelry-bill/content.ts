// Jewellery bill page content: the verified line from data/gold/bajus-rates.json and
// data/gold/jewellery-rules.json. Figma L4 has no FAQ.
import type { BajusRatesFile, JewelleryRulesFile } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { dataStatus } from '../tool/verification.ts'

export const JEWELRY_ID = 'jewelry-bill'

export const JEWELRY_MESSAGE_KEYS = [] as const

export function jewelryContent(lang: Lang, rules: JewelleryRulesFile, rates: BajusRatesFile): ToolPageContent {
  return toolPageContent(JEWELRY_ID, lang, { registryCrumbs: true, data: dataStatus([rates, rules]) })
}
