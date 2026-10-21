// Loan eligibility: inputs → what the calculator shows. All arithmetic is @hisab/core loan-eligibility.
import { calculateLoanEligibility } from '@hisab/core/loan-eligibility'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import type { SummaryRow } from '../tool/parts.tsx'
import { fill, num, plain, taka } from '../tool/say.ts'
import { fieldIssues, rangeSay, type ToolOutcome } from '../tool/validation.ts'
import type { LoanEligibilityCopy } from './copy.ts'
import { LOAN_ELIGIBILITY_LIMITS } from './params.ts'

export interface LoanEligibilityPageInput {
  lang: Lang
  copy: LoanEligibilityCopy
  income: number | null
  emi: number | null
  rate: number | null
  years: number | null
  dbr: number | null
}

export interface LoanEligibilityView {
  label: string
  /** Lakh with one decimal (Figma ৳১১.২ লাখ), or whole taka under one lakh. */
  value: number
  decimals: number
  suffix?: string
  sub: string
  summaryTitle: string
  summary: SummaryRow[]
  maxLoan: number
  shareText: string
}

const LAKH = 100_000

/** ৳১১.২ লাখ / ৳11.2 lakh, or whole taka under a lakh. */
export function lakhText(lang: Lang, copy: LoanEligibilityCopy, amount: number): string {
  return amount >= LAKH ? taka(lang, Math.round(amount / LAKH * 10) / 10, 1) + copy.lakh : taka(lang, amount)
}

export function loanEligibilityOutcome({ lang, copy, income, emi, rate, years, dbr }: LoanEligibilityPageInput): ToolOutcome<LoanEligibilityView> {
  if (income === null || emi === null || rate === null || years === null || dbr === null) return { kind: 'empty' }
  const fields = fieldIssues({ income, emi, rate, years, dbr }, LOAN_ELIGIBILITY_LIMITS, rangeSay(lang, copy.wholeYears))
  if (Object.keys(fields).length) return { kind: 'empty', fields }
  const r = calculateLoanEligibility({ monthlyIncome: income, existingEmi: emi, maxDebtBurdenPct: dbr, annualRatePct: rate, months: years * 12 })
  const pct = plain(lang, dbr)
  if (r.newEmiCapacity <= 0 || r.maxLoan <= 0) {
    return {
      kind: 'error',
      error: { title: copy.noRoomTitle, body: fill(lang, copy.noRoomBody, { emi: taka(lang, emi), pct, limit: taka(lang, r.emiLimit) }) },
      fields: { emi: copy.noRoomTitle },
    }
  }
  const lakh = r.maxLoan >= LAKH
  return {
    kind: 'result',
    result: {
      label: copy.resultLabel,
      value: lakh ? Math.round((r.maxLoan / LAKH) * 10) / 10 : Math.round(r.maxLoan),
      decimals: lakh ? 1 : 0,
      suffix: lakh ? copy.lakh : undefined,
      sub: fill(lang, copy.resultSub, { cap: taka(lang, r.newEmiCapacity), pct }),
      summaryTitle: copy.summaryTitle,
      summary: [
        { key: 'share', label: fill(lang, copy.incomeShare, { pct }), value: taka(lang, r.emiLimit) },
        { key: 'current', label: copy.currentEmi, value: fill(lang, copy.minus, { amount: taka(lang, emi) }) },
        { key: 'limit', label: copy.newEmiLimit, value: taka(lang, r.newEmiCapacity) },
        { key: 'loan', label: fill(lang, copy.loanAt, { years: num(lang, years), rate: plain(lang, rate) }), value: taka(lang, r.maxLoan), total: true },
      ],
      maxLoan: r.maxLoan,
      shareText: fill(lang, copy.shareText, { income: taka(lang, income), loan: lakhText(lang, copy, r.maxLoan), years: num(lang, years), rate: plain(lang, rate) }),
    },
  }
}

export function loanEligibilityReportItems(copy: LoanEligibilityCopy): ReportErrorItem[] {
  return [
    { value: 'loan', label: copy.reportLoan },
    { value: 'dbr', label: copy.reportShare },
  ]
}
