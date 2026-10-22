// Land price: inputs → what the calculator shows. All arithmetic is @hisab/core land-price
// (exact at 1 কাঠা = 720 বর্গফুট; Figma L2's ৳১৫,১৫,১৫২ per শতাংশ divides by a rounded 1.65).
import { calculateLandPrice, validateLandPrice } from '@hisab/core/land-price'
import type { LandUnit } from '@hisab/core/land'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import { areaText } from '../land/units.ts'
import type { SummaryRow } from '../tool/parts.tsx'
import { fill, num, taka } from '../tool/say.ts'
import type { ToolOutcome } from '../tool/validation.ts'
import type { LandPriceCopy } from './copy.ts'

/** Figma L2's "অন্য এককে দাম" rows, then the chosen unit if it is another one. */
export const PER_UNITS = ['decimal', 'sqft', 'katha'] as const satisfies readonly LandUnit[]

export interface LandPriceInput {
  lang: Lang
  copy: LandPriceCopy
  area: number | null
  unit: LandUnit
  price: number | null
}

export interface LandPriceView {
  label: string
  value: number
  sub: string
  summary: SummaryRow[]
  shareText: string
}

/** "১ কোটি ২৫ লাখ টাকা": whole taka in কোটি, লাখ, হাজার and the rest. */
export function takaInWords(lang: Lang, copy: LandPriceCopy, amount: number): string {
  let rest = Math.round(amount)
  const parts: string[] = []
  const crore = Math.floor(rest / 10_000_000)
  rest -= crore * 10_000_000
  const lakh = Math.floor(rest / 100_000)
  rest -= lakh * 100_000
  const thousand = Math.floor(rest / 1000)
  rest -= thousand * 1000
  if (crore) parts.push(fill(lang, copy.crore, { n: num(lang, crore) }))
  if (lakh) parts.push(fill(lang, copy.lakh, { n: num(lang, lakh) }))
  if (thousand) parts.push(fill(lang, copy.thousand, { n: num(lang, thousand) }))
  if (rest || parts.length === 0) parts.push(num(lang, rest))
  return fill(lang, copy.takaWords, { n: parts.join(' ') })
}

export function landPriceOutcome({ lang, copy, area, unit, price }: LandPriceInput): ToolOutcome<LandPriceView> {
  if (area === null || price === null) return { kind: 'empty' }
  const input = { area, areaUnit: unit, price, priceUnit: unit }
  const problem = validateLandPrice(input)
  if (problem === 'area') return { kind: 'empty', fields: { area: copy.areaError } }
  if (problem) return { kind: 'empty' }
  const r = calculateLandPrice(input)
  const units: LandUnit[] = PER_UNITS.includes(unit as (typeof PER_UNITS)[number]) ? [...PER_UNITS] : [...PER_UNITS, unit]
  return {
    kind: 'result',
    result: {
      label: copy.resultLabel,
      value: r.total,
      sub: takaInWords(lang, copy, r.total),
      summary: units.map((u) => ({ key: u, label: fill(lang, copy.per, { unit: copy.unitName[u] }), value: taka(lang, r.pricePer[u]) })),
      shareText: fill(lang, copy.shareText, {
        area: areaText(lang, area),
        unit: copy.unitName[unit],
        unitOf: copy.unitOf[unit],
        price: taka(lang, price),
        total: taka(lang, r.total),
      }),
    },
  }
}

export function landPriceReportItems(copy: LandPriceCopy): ReportErrorItem[] {
  return [
    { value: 'total', label: copy.reportTotal },
    { value: 'per', label: copy.reportPer },
  ]
}
