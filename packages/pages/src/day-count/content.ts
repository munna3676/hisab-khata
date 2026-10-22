// Day count: a formula tool (no verified line). The registry lists data/dates/weekend.json and
// holidays-2026.json for working days, which Figma D5 does not show (docs/open-items.md). No FAQ.
import type { Lang } from '@hisab/i18n/locale'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'

export const DAY_COUNT_ID = 'day-count'

export const DAY_COUNT_MESSAGE_KEYS = [] as const

export function dayCountContent(lang: Lang): ToolPageContent {
  return toolPageContent(DAY_COUNT_ID, lang, { registryCrumbs: true })
}
