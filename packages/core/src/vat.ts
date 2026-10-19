import { round } from './lib/money.ts'

export type VatMode = 'add' | 'remove'

export interface VatInput {
  /** "add": the price before VAT. "remove" (VAT বাদ দাও): the price with VAT (and SD) in it. */
  amount: number
  /** VAT rate in percent, e.g. 15. Comes from the rate list in data/, never hard-coded. */
  ratePct: number
  mode: VatMode
  /** Supplementary duty (সম্পূরক শুল্ক) in percent, for the few goods and services that carry it. */
  sdPct?: number
}

export interface VatResult {
  /** Price without SD or VAT (মূল দাম). */
  base: number
  sd: number
  vat: number
  /** Price with SD and VAT (VAT সহ দাম). */
  total: number
  /** What VAT is charged on: base + SD. */
  vatBase: number
  /** total ÷ base, e.g. 1.15, for the "১,১৫০ ÷ ১.১৫" line on the remove screen. */
  divisor: number
}

export type VatError = 'amount' | 'rate' | 'sd'

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateVat(input: VatInput): VatError | null {
  if (!(input.amount >= 0 && Number.isFinite(input.amount))) return 'amount'
  if (!(input.ratePct >= 0 && input.ratePct <= 100)) return 'rate'
  if (input.sdPct !== undefined && !(input.sdPct >= 0 && input.sdPct <= 1000)) return 'sd'
  return null
}

/**
 * SD is charged on the price, then VAT on price + SD, the way a Mushak-6.3
 * invoice shows it. Removing works backwards with the tax fraction
 * rate ÷ (100 + rate), so base + SD + VAT always adds back to the total.
 */
export function calculateVat(input: VatInput): VatResult {
  const r = input.ratePct / 100
  const s = (input.sdPct ?? 0) / 100
  const divisor = round((1 + s) * (1 + r), 6)

  if (input.mode === 'add') {
    const base = round(input.amount)
    const sd = round(base * s)
    const vatBase = round(base + sd)
    const vat = round(vatBase * r)
    return { base, sd, vat, total: round(vatBase + vat), vatBase, divisor }
  }

  const total = round(input.amount)
  const vat = round((total * r) / (1 + r))
  const vatBase = round(total - vat)
  const sd = round((vatBase * s) / (1 + s))
  return { base: round(vatBase - sd), sd, vat, total, vatBase, divisor }
}
