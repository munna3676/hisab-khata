// Currency converter page content: the verified line from data/finance/currency-rates.json. Figma F11 has no FAQ.
import type { CurrencyRatesFile } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { dataStatus } from '../tool/verification.ts'

export const CURRENCY_ID = 'currency-converter'

export const CURRENCY_MESSAGE_KEYS = [] as const

export function currencyContent(lang: Lang, file: CurrencyRatesFile): ToolPageContent {
  return toolPageContent(CURRENCY_ID, lang, { data: dataStatus([file]) })
}
