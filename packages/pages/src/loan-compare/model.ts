// Loan comparison: two offers → what the calculator shows. All arithmetic is @hisab/core loan-compare.
import { calculateLoanCompare, type LoanOfferResult } from '@hisab/core/loan-compare'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import { fill, taka } from '../tool/say.ts'
import { fieldIssues, rangeSay, type ToolOutcome } from '../tool/validation.ts'
import type { LoanCompareCopy } from './copy.ts'
import { OFFER_LIMITS, OFFERS, type OfferKey } from './params.ts'

/** One offer as typed: p = loan, r = rate %, y = years, f = fee % (null while empty). */
export interface OfferFields {
  p: number | null
  r: number | null
  y: number | null
  f: number | null
}

export interface LoanCompareInput {
  lang: Lang
  copy: LoanCompareCopy
  offers: Record<OfferKey, OfferFields>
}

export interface CompareTableRow {
  key: 'emi' | 'interest' | 'fee' | 'cost'
  label: string
  values: string[]
  /** Index of the lowest offer for this row (green cell), or null on a tie. */
  lowest: number | null
}

export interface LoanCompareView {
  label: string
  value: number
  suffix?: string
  sub: string
  offerNames: string[]
  rows: CompareTableRow[]
  shareText: string
}

const NAMES = ['A', 'B']

export function loanCompareOutcome({ lang, copy, offers }: LoanCompareInput): ToolOutcome<LoanCompareView> {
  const typed = OFFERS.map((k) => offers[k])
  if (typed.some((o) => o.p === null || o.r === null || o.y === null || o.f === null)) return { kind: 'empty' }
  const say = rangeSay(lang, copy.wholeYears)
  const fields: Record<string, string> = {}
  OFFERS.forEach((k, i) => {
    const o = typed[i] as Record<keyof OfferFields, number>
    for (const [field, message] of Object.entries(fieldIssues(o, OFFER_LIMITS, say))) fields[`${k}${field}`] = message as string
  })
  if (Object.keys(fields).length) return { kind: 'empty', fields }

  const r = calculateLoanCompare({
    offers: typed.map((o) => ({ principal: o.p!, annualRatePct: o.r!, months: o.y! * 12, processingFeePct: o.f! })),
  })
  const row = (key: CompareTableRow['key'], label: string, pick: (o: LoanOfferResult) => number, lowest: number | null): CompareTableRow => ({
    key,
    label,
    values: r.offers.map((o) => taka(lang, pick(o)).replace(/^৳/, '')),
    lowest,
  })
  const rows = [
    row('emi', copy.rowEmi, (o) => o.emi, r.lowest.emi),
    row('interest', copy.rowInterest, (o) => o.totalInterest, r.lowest.totalInterest),
    row('fee', copy.rowFee, (o) => o.fees, r.lowest.fees),
    row('cost', copy.rowCost, (o) => o.totalCost, r.lowest.totalCost),
  ]
  const offerNames = NAMES.map((name) => fill(lang, copy.offer, { name }))
  if (r.bestIndex === null) {
    const cost = r.offers[0]!.totalCost
    return {
      kind: 'result',
      result: { label: copy.tieLabel, value: Math.round(cost), sub: fill(lang, copy.tieSub, { cost: taka(lang, cost) }), offerNames, rows, shareText: copy.tieLabel },
    }
  }
  const best = r.offers[r.bestIndex]!
  const name = NAMES[r.bestIndex]!
  return {
    kind: 'result',
    result: {
      label: fill(lang, copy.cheaper, { name }),
      value: Math.round(r.saving),
      suffix: copy.less,
      sub: fill(lang, copy.resultSub, { name, emi: taka(lang, best.emi), cost: taka(lang, best.totalCost) }),
      offerNames,
      rows,
      shareText: fill(lang, copy.shareText, { name, saving: taka(lang, r.saving), cost: taka(lang, best.totalCost) }),
    },
  }
}

export function loanCompareReportItems(copy: LoanCompareCopy): ReportErrorItem[] {
  return [{ value: 'table', label: copy.reportTable }]
}
