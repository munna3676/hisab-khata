// Land price: a formula tool (no verified line). The registry lists data/land/registration-costs.json,
// which Figma L2 does not show (the callout says those costs are extra; docs/open-items.md). No FAQ.
import type { Lang } from '@hisab/i18n/locale'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'

export const LAND_PRICE_ID = 'land-price'

export const LAND_PRICE_MESSAGE_KEYS = [] as const

export function landPriceContent(lang: Lang): ToolPageContent {
  return toolPageContent(LAND_PRICE_ID, lang, { registryCrumbs: true })
}
