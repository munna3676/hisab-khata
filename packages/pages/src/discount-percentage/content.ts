// Discount and percentage: a formula tool (no data, no verified line); Figma C2 has no FAQ.
import type { Lang } from '@hisab/i18n/locale'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'

export const DISCOUNT_ID = 'discount-percentage'

export const DISCOUNT_MESSAGE_KEYS = [] as const

export function discountContent(lang: Lang): ToolPageContent {
  return toolPageContent(DISCOUNT_ID, lang)
}
