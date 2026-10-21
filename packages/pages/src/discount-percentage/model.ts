// Discount and percentage: inputs → what the calculator shows. Arithmetic is @hisab/core percentage.
import { calculateDiscount, calculatePercentOf } from '@hisab/core/percentage'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import { decimal, fill, hasPaisa, money, num } from '../tool/say.ts'
import { fieldIssues, rangeSay, type ToolOutcome } from '../tool/validation.ts'
import type { DiscountCopy } from './copy.ts'
import { DISCOUNT_LIMITS } from './params.ts'

export interface DiscountInput {
  lang: Lang
  copy: DiscountCopy
  price: number | null
  off: number | null
}

export interface DiscountView {
  label: string
  value: number
  decimals: number
  sub: string
  shareText: string
}

export function discountOutcome({ lang, copy, price, off }: DiscountInput): ToolOutcome<DiscountView> {
  if (price === null || off === null) return { kind: 'empty' }
  const fields = fieldIssues({ price, off }, DISCOUNT_LIMITS, rangeSay(lang, ''))
  if (Object.keys(fields).length) return { kind: 'empty', fields }
  const r = calculateDiscount({ price, discount: off })
  const pct = decimal(lang, r.discountPct, 2)
  return {
    kind: 'result',
    result: {
      label: copy.resultLabel,
      value: r.finalPrice,
      decimals: hasPaisa(r.finalPrice) ? 2 : 0,
      sub: fill(lang, copy.resultSub, { saved: money(lang, r.saved), pct }),
      shareText: fill(lang, copy.shareText, { price: money(lang, price), pct, final: money(lang, r.finalPrice), saved: money(lang, r.saved) }),
    },
  }
}

/** The "শতাংশ হিসাব" card line: "৫,০০০ এর ১৫%" → ৳৭৫০ (a dash while a field is empty). */
export function percentOfLine(lang: Lang, copy: DiscountCopy, n: number | null, pct: number | null): { label: string; value: string } {
  if (n === null || pct === null) return { label: fill(lang, copy.percentOf, { n: copy.dash, pct: copy.dash }), value: copy.dash }
  return {
    label: fill(lang, copy.percentOf, { n: num(lang, n), pct: decimal(lang, pct, 4) }),
    value: money(lang, calculatePercentOf({ value: n, pct })),
  }
}

export function discountReportItems(copy: DiscountCopy): ReportErrorItem[] {
  return [
    { value: 'final', label: copy.reportFinal },
    { value: 'saved', label: copy.reportSaved },
    { value: 'percent', label: copy.reportPercent },
  ]
}
