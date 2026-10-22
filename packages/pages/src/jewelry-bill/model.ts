// Jewellery bill: inputs → what the calculator shows. All arithmetic is @hisab/core jewelry-bill.
import { calculateJewelryBill, validateJewelryBill } from '@hisab/core/jewelry-bill'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import type { SummaryRow } from '../tool/parts.tsx'
import { decimal, fill, plain, taka } from '../tool/say.ts'
import { fieldIssues, rangeSay, type ToolOutcome } from '../tool/validation.ts'
import type { JewelryCopy } from './copy.ts'
import { JEWELRY_LIMITS } from './params.ts'

export interface JewelryInput {
  lang: Lang
  copy: JewelryCopy
  vori: number | null
  ana: number | null
  roti: number | null
  price: number | null
  /** True when the price is the day's BAJUS rate (not typed). */
  fromRates: boolean
  making: number | null
  vat: number | null
}

export interface JewelryView {
  label: string
  value: number
  sub: string
  summary: SummaryRow[]
  shareText: string
}

export function jewelryOutcome({ lang, copy, vori, ana, roti, price, fromRates, making, vat }: JewelryInput): ToolOutcome<JewelryView> {
  if ((vori === null && ana === null && roti === null) || price === null || making === null || vat === null) return { kind: 'empty' }
  const fields = fieldIssues({ mk: making, vat }, JEWELRY_LIMITS, rangeSay(lang, ''))
  if (Object.keys(fields).length) return { kind: 'empty', fields }
  const weight = { vori: vori ?? 0, ana: ana ?? 0, roti: roti ?? 0 }
  const input = { weight, pricePerVori: price, makingPct: making, vatPct: vat }
  const problem = validateJewelryBill(input)
  if (problem === 'weight') return { kind: 'empty', fields: { v: copy.weightError } }
  if (problem === 'price') return { kind: 'empty', fields: { p: copy.priceError } }
  if (problem) return { kind: 'empty' }
  const r = calculateJewelryBill(input)
  const pct = { making: plain(lang, making), vat: plain(lang, vat) }
  const parts = [vori ? `${decimal(lang, vori, 3)} ${copy.vori}` : '', ana ? `${decimal(lang, ana, 3)} ${copy.ana}` : '', roti ? `${decimal(lang, roti, 3)} ${copy.roti}` : '']
  return {
    kind: 'result',
    result: {
      label: copy.resultLabel,
      value: r.total,
      sub: fill(lang, fromRates ? copy.resultSub : copy.resultSubOwn, pct),
      summary: [
        { key: 'gold', label: copy.goldPrice, value: taka(lang, r.goldPrice) },
        { key: 'making', label: fill(lang, copy.making, { pct: pct.making }), value: taka(lang, r.making) },
        { key: 'vat', label: fill(lang, copy.vat, { pct: pct.vat }), value: taka(lang, r.vat) },
        { key: 'total', label: copy.total, value: taka(lang, r.total), total: true },
      ],
      shareText: fill(lang, copy.shareText, { weight: parts.filter(Boolean).join(' '), total: taka(lang, r.total), ...pct }),
    },
  }
}

export function jewelryReportItems(copy: JewelryCopy): ReportErrorItem[] {
  return [
    { value: 'total', label: copy.reportTotal },
    { value: 'rate', label: copy.reportRate },
  ]
}
