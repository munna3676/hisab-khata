// Profit margin: inputs → what the calculator shows. Arithmetic is @hisab/core profit-margin.
import { calculatePriceFromMargin, calculateProfitMargin, validatePriceFromMargin, validateProfitMargin } from '@hisab/core/profit-margin'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import type { SummaryRow } from '../tool/parts.tsx'
import { decimal, fill, hasPaisa, money, taka } from '../tool/say.ts'
import { fieldIssues, rangeSay, type ToolOutcome } from '../tool/validation.ts'
import type { ProfitCopy } from './copy.ts'
import { PROFIT_LIMITS } from './params.ts'

export interface ProfitInput {
  lang: Lang
  copy: ProfitCopy
  cost: number | null
  price: number | null
}

export interface ProfitView {
  label: string
  /** The profit, or the loss as a positive amount (the label says which). */
  value: number
  decimals: number
  sub: string
  summaryTitle: string
  summary: SummaryRow[]
  shareText: string
}

export function profitOutcome({ lang, copy, cost, price }: ProfitInput): ToolOutcome<ProfitView> {
  if (cost === null || price === null) return { kind: 'empty' }
  const fields = fieldIssues({ cost, price }, PROFIT_LIMITS, rangeSay(lang, ''))
  if (Object.keys(fields).length || validateProfitMargin({ cost, sellingPrice: price })) return { kind: 'empty', fields }
  const r = calculateProfitMargin({ cost, sellingPrice: price })
  const pct = (n: number | null) => (n === null ? copy.dash : fill(lang, copy.pct, { n: decimal(lang, n, 2) }))
  const margin = decimal(lang, r.marginPct, 2)
  const what = r.profit < 0 ? copy.loss : copy.profit
  const amount = Math.abs(r.profit)
  return {
    kind: 'result',
    result: {
      label: what,
      value: amount,
      decimals: hasPaisa(amount) ? 2 : 0,
      sub:
        r.markupPct === null
          ? fill(lang, copy.resultSubNoMarkup, { margin })
          : fill(lang, copy.resultSub, { margin, markup: decimal(lang, r.markupPct, 2) }),
      summaryTitle: copy.summaryTitle,
      summary: [
        { key: 'profit', label: what, value: money(lang, amount) },
        { key: 'margin', label: copy.marginRow, value: pct(r.marginPct) },
        { key: 'markup', label: copy.markupRow, value: pct(r.markupPct) },
      ],
      shareText: fill(lang, copy.shareText, { cost: money(lang, cost), price: money(lang, price), what, profit: money(lang, amount), margin }),
    },
  }
}

/**
 * "টার্গেট মার্জিন থেকে দাম": the price that earns the margin wanted, in whole taka as Figma shows
 * it (৳১,১৪৩ for 30% on ৳৮০০; the engine's 1,142.86 rounded).
 */
export function targetPrice(lang: Lang, copy: ProfitCopy, cost: number | null, target: number | null): { value: string; error?: string } {
  if (cost === null || target === null || cost < 0) return { value: copy.dash }
  if (validatePriceFromMargin({ cost, pct: target })) return { value: copy.dash, error: target >= 100 ? copy.targetBelow100 : undefined }
  return { value: taka(lang, calculatePriceFromMargin({ cost, pct: target }).sellingPrice) }
}

export function profitReportItems(copy: ProfitCopy): ReportErrorItem[] {
  return [
    { value: 'profit', label: copy.reportProfit },
    { value: 'margin', label: copy.reportMargin },
    { value: 'target', label: copy.reportTarget },
  ]
}
