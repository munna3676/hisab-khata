// DPS: inputs → everything the calculator shows, as plain data. All arithmetic is @hisab/core dps.
import { calculateDps, type DpsYearRow } from '@hisab/core/dps'
import type { ExciseSlab } from '@hisab/core/lib/finance-slabs'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import { deductionRows } from '../deposit/shared.ts'
import type { SummaryRow } from '../tool/parts.tsx'
import { fill, num, taka } from '../tool/say.ts'
import { fieldIssues, rangeSay, type ToolOutcome } from '../tool/validation.ts'
import type { DpsCopy } from './copy.ts'
import { DPS_LIMITS, type DpsMode } from './params.ts'

export interface DpsInput {
  lang: Lang
  copy: DpsCopy
  deposit: number | null
  rate: number | null
  years: number | null
  comp: DpsMode
  tax: number | null
  /** data/finance/excise-duty.json. */
  exciseSlabs: readonly ExciseSlab[]
}

export interface DpsView {
  label: string
  value: number
  sub: string
  summaryTitle: string
  summary: SummaryRow[]
  years: DpsYearRow[]
  shareText: string
}

export function dpsOutcome({ lang, copy, deposit, rate, years, comp, tax, exciseSlabs }: DpsInput): ToolOutcome<DpsView> {
  if (deposit === null || rate === null || years === null || tax === null) return { kind: 'empty' }
  const fields = fieldIssues({ deposit, rate, years, tax }, DPS_LIMITS, rangeSay(lang, copy.wholeYears))
  if (Object.keys(fields).length) return { kind: 'empty', fields }
  const months = years * 12
  const r = calculateDps({ monthlyDeposit: deposit, annualRatePct: rate, months, compounding: comp, taxPct: tax, exciseSlabs })
  const sub = fill(lang, copy.resultSub, { months: num(lang, months) })
  return {
    kind: 'result',
    result: {
      label: copy.resultLabel,
      value: Math.round(r.maturity),
      sub: comp === 'quarterly' ? `${sub} · ${copy.resultSubQuarterly}` : sub,
      summaryTitle: copy.summaryTitle,
      summary: [
        { key: 'deposit', label: copy.totalDeposit, value: taka(lang, r.totalDeposit) },
        { key: 'profit', label: copy.totalProfit, value: taka(lang, r.totalInterest) },
        ...deductionRows(lang, copy, tax, r.tax, r.exciseDuty),
        { key: 'maturity', label: copy.maturity, value: taka(lang, r.maturity), total: true },
      ],
      years: r.years,
      shareText: fill(lang, copy.shareText, { deposit: taka(lang, deposit), years: num(lang, years), maturity: taka(lang, r.maturity) }),
    },
  }
}

export function dpsReportItems(copy: DpsCopy): ReportErrorItem[] {
  return [
    { value: 'maturity', label: copy.reportMaturity },
    { value: 'profit', label: copy.reportProfit },
    { value: 'tax', label: copy.reportTax },
  ]
}
