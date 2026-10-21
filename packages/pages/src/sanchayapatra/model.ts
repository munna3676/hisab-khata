// Sanchayapatra: inputs → what the calculator shows. All arithmetic is @hisab/core sanchayapatra.
import { calculateSanchayapatra, validateSanchayapatra } from '@hisab/core/sanchayapatra'
import type { SanchayapatraSchemeData } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import type { ChoiceOption } from '../tool/ChoiceSheet.tsx'
import { decimal, fill, money, taka } from '../tool/say.ts'
import type { ToolOutcome } from '../tool/validation.ts'
import type { SanchayapatraCopy } from './copy.ts'
import type { SchemeId } from './params.ts'

export interface SanchayapatraInput {
  lang: Lang
  copy: SanchayapatraCopy
  schemes: readonly SanchayapatraSchemeData[]
  scheme: SchemeId
  amount: number | null
}

export interface RateRow {
  step: string
  rate: string
}

export interface SanchayapatraView {
  label: string
  value: number
  decimals: number
  sub: string
  shareText: string
}

/** "৫ লাখ", "৭.৫ লাখ" from a lakh up; whole taka below. */
export function lakh(lang: Lang, copy: SanchayapatraCopy, value: number): string {
  return value >= 100000 ? fill(lang, copy.lakh, { n: decimal(lang, value / 100000, 2) }) : taka(lang, value)
}

const pct = (lang: Lang, copy: SanchayapatraCopy, n: number) => fill(lang, copy.pct, { n: decimal(lang, n, 2) })

export function findScheme(schemes: readonly SanchayapatraSchemeData[], id: string): SanchayapatraSchemeData {
  const scheme = schemes.find((s) => s.id === id)
  if (!scheme) throw new Error(`sanchayapatra: no scheme '${id}' in data/finance/sanchayapatra.json`)
  return scheme
}

export function sanchayapatraOutcome({ lang, copy, schemes, scheme: id, amount }: SanchayapatraInput): ToolOutcome<SanchayapatraView> {
  if (amount === null) return { kind: 'empty' }
  const scheme = findScheme(schemes, id)
  const problem = validateSanchayapatra({ scheme, investment: amount })
  if (problem === 'investment') {
    const min = scheme.minInvestment ?? 1
    const max = scheme.maxInvestment
    const to = max !== undefined && amount > max ? max : min
    return {
      kind: 'error',
      error: {
        title: copy.limitTitle,
        body: fill(lang, copy.limitBody, { min: taka(lang, min), max: max === undefined ? '—' : taka(lang, max) }),
        fix: { label: fill(lang, copy.limitFix, { amount: taka(lang, to) }), field: 'amount', value: to },
      },
      fields: { amount: copy.limitTitle },
    }
  }
  if (problem) return { kind: 'empty' }
  const r = calculateSanchayapatra({ scheme, investment: amount })
  const atMaturity = scheme.payout === 'maturity'
  const label = scheme.payout === 'monthly' ? copy.resultMonthly : scheme.payout === 'quarterly' ? copy.resultQuarterly : copy.resultMaturity
  const profit = atMaturity ? r.totalProfit : r.profitPerPayout
  const net = atMaturity ? r.totalNet : r.netPerPayout
  const vars = { amount: lakh(lang, copy, amount), rate: decimal(lang, r.ratePct, 2), tax: decimal(lang, r.taxPct, 2), net: taka(lang, net) }
  return {
    kind: 'result',
    result: {
      label,
      value: profit,
      // Whole taka as Figma shows (৳৪,৯৭১ for 4,970.83).
      decimals: 0,
      sub: fill(lang, copy.resultSub, vars),
      shareText: fill(lang, copy.shareText, { scheme: schemeName(lang, copy, scheme), amount: money(lang, amount), label, profit: taka(lang, profit), net: taka(lang, net) }),
    },
  }
}

/** "বর্তমান হার": the chosen scheme's slabs, then the range of the others (from data). */
export function rateRows(lang: Lang, copy: SanchayapatraCopy, schemes: readonly SanchayapatraSchemeData[], id: SchemeId): RateRow[] {
  const scheme = findScheme(schemes, id)
  const short = copy.short[id]
  const rows: RateRow[] = scheme.rateSlabs.map((slab, i) => {
    const prev = scheme.rateSlabs[i - 1]?.upTo
    const step =
      slab.upTo !== null
        ? fill(lang, copy.upTo, { amount: lakh(lang, copy, slab.upTo), scheme: short })
        : fill(lang, copy.above, { amount: lakh(lang, copy, prev ?? 0), scheme: short })
    return { step, rate: pct(lang, copy, slab.ratePct) }
  })
  const others = schemes.filter((s) => s.id !== id).flatMap((s) => s.rateSlabs.map((r) => r.ratePct))
  if (others.length) rows.push({ step: copy.otherSchemes, rate: rateRange(lang, copy, others) })
  return rows
}

function rateRange(lang: Lang, copy: SanchayapatraCopy, rates: number[]): string {
  const min = Math.min(...rates)
  const max = Math.max(...rates)
  return min === max ? pct(lang, copy, min) : fill(lang, copy.range, { min: decimal(lang, min, 2), max: decimal(lang, max, 2) })
}

/** The P7 footer: every scheme's rates as a range. */
export function pickerFooter(lang: Lang, copy: SanchayapatraCopy, schemes: readonly SanchayapatraSchemeData[]): string {
  return fill(lang, copy.pickerFooter, { range: rateRange(lang, copy, schemes.flatMap((s) => s.rateSlabs.map((r) => r.ratePct))) })
}

const isKnown = (copy: SanchayapatraCopy, id: string): id is SchemeId => Object.hasOwn(copy.short, id)

function schemeName(lang: Lang, copy: SanchayapatraCopy, s: SanchayapatraSchemeData): string {
  return lang === 'bn' || !isKnown(copy, s.id) ? s.nameBn : copy.nameEn[s.id]
}

/** P7's options: name and detail from data (English from the copy). */
export function schemeOptions(lang: Lang, copy: SanchayapatraCopy, schemes: readonly SanchayapatraSchemeData[]): ChoiceOption[] {
  return schemes.map((s) => ({
    value: s.id,
    label: schemeName(lang, copy, s),
    description: lang === 'bn' || !isKnown(copy, s.id) ? s.detailBn : copy.detailEn[s.id],
  }))
}

export function sanchayapatraReportItems(copy: SanchayapatraCopy): ReportErrorItem[] {
  return [
    { value: 'profit', label: copy.reportProfit },
    { value: 'tax', label: copy.reportTax },
    { value: 'rate', label: copy.reportRate },
  ]
}

