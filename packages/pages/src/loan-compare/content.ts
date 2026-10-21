// Loan comparison page content (Figma F10 has no FAQ or tips). Rates and fees are typed by the
// person, so the page has no verified line (data/finance/loan-fees.json holds no value yet).
import type { Lang } from '@hisab/i18n/locale'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'

export const LOAN_COMPARE_ID = 'loan-compare'

export const LOAN_COMPARE_MESSAGE_KEYS = [] as const

export function loanCompareContent(lang: Lang): ToolPageContent {
  return toolPageContent(LOAN_COMPARE_ID, lang)
}
