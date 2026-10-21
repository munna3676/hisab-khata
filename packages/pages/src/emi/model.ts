// EMI: inputs → everything the calculator shows, as plain data. All arithmetic is @hisab/core emi.
import { calculateEmi, type EmiRow } from '@hisab/core/emi'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import { fill, num, plain, taka } from '../tool/say.ts'
import type { SummaryRow } from '../tool/parts.tsx'
import { fieldIssues, rangeSay, type ToolOutcome } from '../tool/validation.ts'
import type { EmiCopy } from './copy.ts'
import { EMI_LIMITS } from './params.ts'

export interface EmiInput {
  lang: Lang
  copy: EmiCopy
  /** null while a field is empty or not a number. */
  amount: number | null
  rate: number | null
  months: number | null
}

export interface EmiView {
  label: string
  /** The EMI, whole taka on the card (Figma ৳১৬,৬০৭). */
  value: number
  sub: string
  summaryTitle: string
  summary: SummaryRow[]
  /** Principal and interest as whole percentages of the total repayment (they add up to 100). */
  split: { principalPct: number; interestPct: number; principalLabel: string; interestLabel: string; label: string }
  schedule: EmiRow[]
  shareText: string
}

export function emiOutcome({ lang, copy, amount, rate, months }: EmiInput): ToolOutcome<EmiView> {
  if (amount === null || rate === null || months === null) return { kind: 'empty' }
  const fields = fieldIssues({ amount, rate, months }, EMI_LIMITS, rangeSay(lang, copy.wholeMonths))
  if (Object.keys(fields).length) return { kind: 'empty', fields }

  const r = calculateEmi({ principal: amount, annualRatePct: rate, months })
  const principalPct = Math.round((amount / r.totalPayment) * 100)
  const vars = { amount: taka(lang, amount), rate: plain(lang, rate), months: num(lang, months), emi: taka(lang, r.emi), interest: taka(lang, r.totalInterest) }
  return {
    kind: 'result',
    result: {
      label: copy.resultLabel,
      value: Math.round(r.emi),
      sub: fill(lang, copy.resultSub, { months: num(lang, months) }),
      summaryTitle: copy.summaryTitle,
      summary: [
        { key: 'principal', label: copy.principal, value: taka(lang, amount) },
        { key: 'interest', label: copy.totalInterest, value: taka(lang, r.totalInterest) },
        { key: 'total', label: copy.totalPayment, value: taka(lang, r.totalPayment), total: true },
      ],
      split: {
        principalPct,
        interestPct: 100 - principalPct,
        principalLabel: fill(lang, copy.splitPrincipal, { pct: num(lang, principalPct) }),
        interestLabel: fill(lang, copy.splitInterest, { pct: num(lang, 100 - principalPct) }),
        label: copy.splitLabel,
      },
      schedule: r.schedule,
      shareText: fill(lang, copy.shareText, vars),
    },
  }
}

/** The "ভুল পেলেন?" list for EMI. */
export function emiReportItems(copy: EmiCopy): ReportErrorItem[] {
  return [
    { value: 'emi', label: copy.reportEmi },
    { value: 'interest', label: copy.reportInterest },
    { value: 'schedule', label: copy.reportSchedule },
  ]
}
