// Loan eligibility page content (Figma F9 has no FAQ or tips): the verified line for the 40%/50%
// chips (data/finance/loan-dbr.json).
import type { LoanDbrFile } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { dataStatus } from '../tool/verification.ts'

export const LOAN_ELIGIBILITY_ID = 'loan-eligibility'

export const LOAN_ELIGIBILITY_MESSAGE_KEYS = [] as const

export function loanEligibilityContent(lang: Lang, dbr: LoanDbrFile): ToolPageContent {
  return toolPageContent(LOAN_ELIGIBILITY_ID, lang, { data: dataStatus([dbr]) })
}
