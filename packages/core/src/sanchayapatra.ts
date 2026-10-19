import { findSlab, isValidSlabTable, type Slab } from './lib/finance-slabs.ts'
import { round } from './lib/money.ts'

/** How often profit is paid: every month, every 3 months, or all at maturity. */
export type SanchayapatraPayout = 'monthly' | 'quarterly' | 'maturity'

export interface SanchayapatraRateSlab extends Slab {
  /** Yearly profit rate in percent for a holding up to `upTo`. */
  ratePct: number
}

export interface SanchayapatraTaxSlab extends Slab {
  /** Tax at source on profit in percent for a holding up to `upTo`. */
  taxPct: number
}

/** One scheme as the National Savings Directorate publishes it (from data). */
export interface SanchayapatraScheme {
  id: string
  /** Term in years. */
  years: number
  payout: SanchayapatraPayout
  /** Rate by the person's total holding; the whole amount earns its row's rate. */
  rateSlabs: SanchayapatraRateSlab[]
  /** Tax at source by the person's total holding. */
  taxSlabs: SanchayapatraTaxSlab[]
  /** Purchase limits for this scheme, in taka; leave out for none. */
  minInvestment?: number
  maxInvestment?: number
}

export interface SanchayapatraInput {
  scheme: SanchayapatraScheme
  /** Amount bought now, in taka. */
  investment: number
  /** Sanchayapatra the person already holds in all schemes, which decides the slab; 0 when none. */
  existingHolding?: number
}

export interface SanchayapatraResult {
  ratePct: number
  taxPct: number
  /** Number of profit payments over the term (1 for 'maturity'). */
  payouts: number
  /** One payment before tax, the tax taken from it, and what reaches the account. */
  profitPerPayout: number
  taxPerPayout: number
  netPerPayout: number
  /** Over the whole term. */
  totalProfit: number
  totalTax: number
  totalNet: number
  /** Paid on the maturity date: the investment back, plus the profit for 'maturity'. */
  maturityAmount: number
}

export type SanchayapatraError = 'scheme' | 'investment' | 'holding'

const PAYOUTS_PER_YEAR: Record<SanchayapatraPayout, number> = { monthly: 12, quarterly: 4, maturity: 0 }

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateSanchayapatra(input: SanchayapatraInput): SanchayapatraError | null {
  const { scheme } = input
  if (
    !(Number.isInteger(scheme.years) && scheme.years >= 1) ||
    !(scheme.payout in PAYOUTS_PER_YEAR) ||
    !isValidSlabTable(scheme.rateSlabs) ||
    !scheme.rateSlabs.every((s) => s.ratePct >= 0 && s.ratePct <= 100) ||
    !isValidSlabTable(scheme.taxSlabs) ||
    !scheme.taxSlabs.every((s) => s.taxPct >= 0 && s.taxPct <= 100)
  ) {
    return 'scheme'
  }
  if (!(input.investment > 0)) return 'investment'
  if (scheme.minInvestment !== undefined && input.investment < scheme.minInvestment) return 'investment'
  if (scheme.maxInvestment !== undefined && input.investment > scheme.maxInvestment) return 'investment'
  if (!((input.existingHolding ?? 0) >= 0)) return 'holding'
  return null
}

/** Profit per payment and over the term. Profit is simple: it is paid out, not reinvested. */
export function calculateSanchayapatra(input: SanchayapatraInput): SanchayapatraResult {
  const { scheme, investment, existingHolding = 0 } = input
  const holding = investment + existingHolding
  const ratePct = findSlab(holding, scheme.rateSlabs)!.ratePct
  const taxPct = findSlab(holding, scheme.taxSlabs)!.taxPct

  const perYear = PAYOUTS_PER_YEAR[scheme.payout]
  const payouts = perYear === 0 ? 1 : perYear * scheme.years
  const termShare = perYear === 0 ? scheme.years : 1 / perYear
  // NSD pays each instalment in paisa, so totals are instalment × count.
  const profitPerPayout = round((investment * ratePct * termShare) / 100)
  const taxPerPayout = round((profitPerPayout * taxPct) / 100)
  const netPerPayout = round(profitPerPayout - taxPerPayout)
  const totalNet = round(netPerPayout * payouts)
  return {
    ratePct,
    taxPct,
    payouts,
    profitPerPayout,
    taxPerPayout,
    netPerPayout,
    totalProfit: round(profitPerPayout * payouts),
    totalTax: round(taxPerPayout * payouts),
    totalNet,
    maturityAmount: round(investment + (perYear === 0 ? totalNet : 0)),
  }
}
