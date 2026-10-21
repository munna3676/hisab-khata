// Profit margin: a formula tool (no data, no verified line); Figma C3 has no FAQ.
import type { Lang } from '@hisab/i18n/locale'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'

export const PROFIT_ID = 'profit-margin'

export const PROFIT_MESSAGE_KEYS = [] as const

export function profitContent(lang: Lang): ToolPageContent {
  return toolPageContent(PROFIT_ID, lang)
}
