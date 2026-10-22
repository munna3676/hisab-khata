// Gold converter: inputs → what the calculator shows. All arithmetic is @hisab/core gold.
import { VORI_GRAMS, calculateGold, goldUnitGrams, validateGold } from '@hisab/core/gold'
import { plainDigits } from '@hisab/i18n/format'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import type { KaratId } from '../gold/shared.ts'
import { decimal, fill, taka } from '../tool/say.ts'
import type { UnitRow } from '../tool/UnitTable.tsx'
import type { ToolOutcome } from '../tool/validation.ts'
import type { GoldCopy } from './copy.ts'

export interface GoldInput {
  lang: Lang
  copy: GoldCopy
  vori: number | null
  ana: number | null
  roti: number | null
  karat: KaratId
  /** Taka per ভরি; null to show the weight only. */
  price: number | null
}

export interface GoldView {
  label: string
  value: number
  decimals: number
  sub: string
  rows: UnitRow[]
  shareText: string
}

/** As few decimals as the number needs, up to 3 (২.২৫, ২৬.২৪৪, ৩৬). */
const decimalsOf = (n: number) => {
  let d = 0
  while (d < 3 && Math.abs(Math.round(n * 10 ** d) - n * 10 ** d) > 1e-6) d++
  return d
}

export function goldOutcome({ lang, copy, vori, ana, roti, karat, price }: GoldInput): ToolOutcome<GoldView> {
  if (vori === null && ana === null && roti === null) return { kind: 'empty' }
  const weight = { vori: vori ?? 0, ana: ana ?? 0, roti: roti ?? 0 }
  const input = { weight, pricePerVori: price ?? undefined }
  if (validateGold(input)) return { kind: 'empty' }
  const r = calculateGold(input)
  const v = r.values
  const voriText = decimal(lang, v.vori, 3)
  const k = plainDigits(lang, karat)
  const sub =
    r.value !== null && price !== null
      ? fill(lang, copy.resultSub, { vori: voriText, rate: taka(lang, price), value: taka(lang, r.value), karat: k })
      : fill(lang, copy.resultSubWeight, { vori: voriText })
  const typed = [vori ? `${decimal(lang, vori, 3)} ${copy.vori}` : '', ana ? `${decimal(lang, ana, 3)} ${copy.ana}` : '', roti ? `${decimal(lang, roti, 3)} ${copy.roti}` : '']
  return {
    kind: 'result',
    result: {
      label: copy.resultLabel,
      value: r.grams,
      decimals: decimalsOf(r.grams),
      sub,
      rows: [
        { key: 'vori', label: copy.rowVori, value: voriText },
        { key: 'ana', label: copy.rowAna, value: decimal(lang, v.ana, 3) },
        { key: 'roti', label: copy.rowRoti, value: decimal(lang, v.roti, 3) },
        { key: 'gram', label: copy.rowGram, value: decimal(lang, v.gram, 3), current: true },
      ],
      shareText: fill(lang, copy.shareText, {
        weight: typed.filter(Boolean).join(' ') || `${plainDigits(lang, 0)} ${copy.vori}`,
        grams: decimal(lang, r.grams, 3),
        value: r.value !== null ? fill(lang, copy.shareValue, { value: taka(lang, r.value), karat: k }) : '',
      }),
    },
  }
}

/** "১ ভরি = ১৬ আনা = ৯৬ রতি = ১১.৬৬৪ গ্রাম।" from the engine's units. */
export function goldCallout(lang: Lang, copy: GoldCopy): string {
  const per = (u: 'ana' | 'roti') => decimal(lang, VORI_GRAMS / goldUnitGrams(u), 3)
  return fill(lang, copy.callout, { ana: per('ana'), roti: per('roti'), gram: decimal(lang, VORI_GRAMS, 3) })
}

export function goldReportItems(copy: GoldCopy): ReportErrorItem[] {
  return [
    { value: 'weight', label: copy.reportWeight },
    { value: 'rate', label: copy.reportRate },
  ]
}
