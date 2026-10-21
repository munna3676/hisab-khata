// VAT: inputs → everything the calculator shows, as plain data. All arithmetic is @hisab/core vat.
import { calculateVat } from '@hisab/core/vat'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import type { SummaryRow } from '../tool/parts.tsx'
import { decimal, fill, money, num } from '../tool/say.ts'
import { fieldIssues, rangeSay, type ToolOutcome } from '../tool/validation.ts'
import type { VatCopy } from './copy.ts'
import { CALLOUT_BASE, VAT_LIMITS, type VatMode } from './params.ts'

export interface VatInput {
  lang: Lang
  copy: VatCopy
  mode: VatMode
  /** The price (add) or the price with VAT (remove); null while the field is empty. */
  amount: number | null
  rate: number | null
}

export interface VatView {
  label: string
  value: number
  decimals: number
  sub: string
  summaryTitle: string
  summary: SummaryRow[]
  shareText: string
}

const places = (v: number) => (Math.round(Math.abs(v) * 100) % 100 === 0 ? 0 : 2)

export function vatOutcome({ lang, copy, mode, amount, rate }: VatInput): ToolOutcome<VatView> {
  if (amount === null || rate === null) return { kind: 'empty' }
  const fields = fieldIssues({ amount, rate }, VAT_LIMITS, rangeSay(lang, ''))
  if (Object.keys(fields).length) return { kind: 'empty', fields }

  const r = calculateVat({ amount, ratePct: rate, mode })
  const pct = decimal(lang, rate, 2)
  const vatRow = { key: 'vat', label: fill(lang, copy.vatRow, { rate: pct }) }
  const vatLine = fill(lang, copy.vatLine, { rate: pct, vat: money(lang, r.vat) })
  const vars = { amount: money(lang, r.base), rate: pct, vat: money(lang, r.vat), total: money(lang, r.total), base: money(lang, r.base) }
  if (mode === 'add') {
    return {
      kind: 'result',
      result: {
        label: copy.addResult,
        value: r.total,
        decimals: places(r.total),
        sub: vatLine,
        summaryTitle: copy.summaryTitle,
        summary: [
          { key: 'base', label: copy.base, value: money(lang, r.base) },
          { ...vatRow, value: money(lang, r.vat) },
          { key: 'total', label: copy.total, value: money(lang, r.total), total: true },
        ],
        shareText: fill(lang, copy.shareAdd, vars),
      },
    }
  }
  return {
    kind: 'result',
    result: {
      label: copy.removeResult,
      value: r.base,
      decimals: places(r.base),
      sub: `${vatLine} · ${fill(lang, copy.divideLine, { total: num(lang, r.total), divisor: decimal(lang, r.divisor) })}`,
      summaryTitle: copy.summaryTitle,
      summary: [
        { key: 'total', label: copy.grossLabel, value: money(lang, r.total) },
        { ...vatRow, value: fill(lang, copy.minus, { amount: money(lang, r.vat) }) },
        { key: 'base', label: copy.base, value: money(lang, r.base), total: true },
      ],
      shareText: fill(lang, copy.shareRemove, vars),
    },
  }
}

/** The callout's worked example at this rate (Figma, 15%: "১,১৫০ ÷ ১.১৫ = ১,০০০ টাকা"). */
export function vatCallout(lang: Lang, copy: VatCopy, rate: number | null): string {
  const r = calculateVat({ amount: CALLOUT_BASE, ratePct: rate !== null && rate >= 0 && rate <= 100 ? rate : 0, mode: 'add' })
  return fill(lang, copy.callout, { divisor: decimal(lang, r.divisor), total: num(lang, r.total), base: num(lang, r.base) })
}

export function vatReportItems(copy: VatCopy): ReportErrorItem[] {
  return [
    { value: 'total', label: copy.reportTotal },
    { value: 'vat', label: copy.reportVat },
    { value: 'base', label: copy.reportBase },
  ]
}
