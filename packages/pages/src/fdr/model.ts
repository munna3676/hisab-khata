// FDR: inputs → everything the calculator shows, as plain data. All arithmetic is @hisab/core fdr.
import { calculateFdr } from '@hisab/core/fdr'
import type { ExciseSlab } from '@hisab/core/lib/finance-slabs'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import { deductionRows } from '../deposit/shared.ts'
import type { SummaryRow } from '../tool/parts.tsx'
import { fill, num, plain, taka } from '../tool/say.ts'
import { fieldIssues, rangeSay, type ToolOutcome } from '../tool/validation.ts'
import type { FdrCopy } from './copy.ts'
import { FDR_LIMITS, RENEW_EVERY, type FdrPageMode } from './params.ts'

export interface FdrInput {
  lang: Lang
  copy: FdrCopy
  amount: number | null
  rate: number | null
  months: number | null
  mode: FdrPageMode
  tax: number | null
  exciseSlabs: readonly ExciseSlab[]
}

export interface FdrView {
  label: string
  value: number
  sub: string
  summaryTitle: string
  summary: SummaryRow[]
  shareText: string
}

export function fdrOutcome({ lang, copy, amount, rate, months, mode, tax, exciseSlabs }: FdrInput): ToolOutcome<FdrView> {
  if (amount === null || rate === null || months === null || tax === null) return { kind: 'empty' }
  const fields = fieldIssues({ amount, rate, months, tax }, FDR_LIMITS, rangeSay(lang, copy.wholeMonths))
  if (Object.keys(fields).length) return { kind: 'empty', fields }
  if (mode === 'renew' && months % RENEW_EVERY !== 0) {
    const fixMonths = Math.max(RENEW_EVERY, Math.round(months / RENEW_EVERY) * RENEW_EVERY)
    return {
      kind: 'error',
      error: {
        title: copy.renewTermTitle,
        body: copy.renewTermBody,
        fix: { label: fill(lang, copy.renewFix, { months: num(lang, fixMonths) }), field: 'months', value: fixMonths },
      },
      fields: { months: copy.renewTermField },
    }
  }
  const r = calculateFdr({ principal: amount, annualRatePct: rate, months, mode, periodMonths: RENEW_EVERY, taxPct: tax, exciseSlabs })
  const sub = fill(lang, copy.resultSub, { months: num(lang, months) })
  return {
    kind: 'result',
    result: {
      label: copy.resultLabel,
      value: Math.round(r.maturity),
      sub: mode === 'renew' ? `${sub} · ${copy.resultSubRenew}` : sub,
      summaryTitle: copy.summaryTitle,
      summary: [
        { key: 'deposit', label: copy.deposit, value: taka(lang, amount) },
        { key: 'profit', label: copy.totalProfit, value: taka(lang, r.totalInterest) },
        ...deductionRows(lang, copy, tax, r.tax, r.exciseDuty),
        { key: 'maturity', label: copy.maturity, value: taka(lang, r.maturity), total: true },
      ],
      shareText: fill(lang, copy.shareText, { amount: taka(lang, amount), rate: plain(lang, rate), months: num(lang, months), maturity: taka(lang, r.maturity) }),
    },
  }
}

export function fdrReportItems(copy: FdrCopy): ReportErrorItem[] {
  return [
    { value: 'maturity', label: copy.reportMaturity },
    { value: 'profit', label: copy.reportProfit },
    { value: 'tax', label: copy.reportTax },
  ]
}
