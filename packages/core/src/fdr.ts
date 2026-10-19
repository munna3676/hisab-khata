import { exciseDuty, isValidExciseTable, type ExciseSlab } from './lib/finance-slabs.ts'
import { round } from './lib/money.ts'

/**
 * simple: the whole profit at maturity ("মেয়াদ শেষে").
 * compound: profit joins the principal every `periodMonths`, tax at maturity.
 * renew: an FDR of `periodMonths` renewed each time with principal + profit
 * after tax ("প্রতি ৩ মাসে রিনিউ").
 */
export type FdrMode = 'simple' | 'compound' | 'renew'

export interface FdrInput {
  /** Amount deposited once, in taka. */
  principal: number
  /** Yearly profit rate in percent, e.g. 10 for 10%. */
  annualRatePct: number
  /** Term in months. */
  months: number
  mode: FdrMode
  /** Compounding or renewal period in months. Defaults to 3; ignored for simple. */
  periodMonths?: number
  /** Tax at source on the profit in percent (from data: with TIN / without TIN); 0 for none. */
  taxPct: number
  /** Yearly excise duty by highest balance. Leave out (or pass []) to ignore excise duty. */
  exciseSlabs?: readonly ExciseSlab[]
}

export interface FdrPeriodRow {
  period: number
  /** Months in this period; in compound mode the last one may be shorter. */
  months: number
  opening: number
  interest: number
  /** Tax taken at the end of this period (every period in renew mode, else the last). */
  tax: number
  closing: number
}

export interface FdrResult {
  totalInterest: number
  tax: number
  exciseDuty: number
  /** Principal + profit − tax − excise duty. */
  maturity: number
  periods: FdrPeriodRow[]
}

export type FdrError = 'principal' | 'rate' | 'months' | 'mode' | 'period' | 'tax' | 'excise'

const MODES: readonly FdrMode[] = ['simple', 'compound', 'renew']

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateFdr(input: FdrInput): FdrError | null {
  if (!(input.principal > 0)) return 'principal'
  if (!(input.annualRatePct >= 0 && input.annualRatePct <= 100)) return 'rate'
  if (!(Number.isInteger(input.months) && input.months >= 1 && input.months <= 600)) return 'months'
  if (!MODES.includes(input.mode)) return 'mode'
  if (input.mode !== 'simple') {
    const period = input.periodMonths ?? 3
    if (!(Number.isInteger(period) && period >= 1 && period <= 120)) return 'period'
    // A renewed FDR can only end on a renewal date.
    if (input.mode === 'renew' && input.months % period !== 0) return 'months'
  }
  if (!(input.taxPct >= 0 && input.taxPct <= 100)) return 'tax'
  // An empty table means no excise duty, as when it is left out.
  if (input.exciseSlabs?.length && !isValidExciseTable(input.exciseSlabs)) return 'excise'
  return null
}

/** FDR profit, tax and maturity with a period-by-period table. */
export function calculateFdr(input: FdrInput): FdrResult {
  const { principal, annualRatePct, months, mode, taxPct, exciseSlabs = [] } = input
  const period = mode === 'simple' ? months : (input.periodMonths ?? 3)

  const periods: FdrPeriodRow[] = []
  // Highest balance seen in each account year, for excise duty.
  const yearHigh: number[] = []
  let balance = principal
  let totalInterest = 0
  for (let start = 0; start < months; start += period) {
    const length = Math.min(period, months - start)
    // Banks credit profit in paisa, so each period's profit is rounded.
    const interest = round((balance * annualRatePct * length) / 12 / 100)
    const tax = mode === 'renew' ? round((interest * taxPct) / 100) : 0
    const year = Math.ceil((start + length) / 12) - 1
    yearHigh[year] = round(balance + interest)
    periods.push({ period: periods.length + 1, months: length, opening: balance, interest, tax, closing: round(balance + interest - tax) })
    totalInterest = round(totalInterest + interest)
    balance = round(balance + interest - tax)
  }

  if (mode !== 'renew') {
    const last = periods.at(-1)!
    last.tax = round((totalInterest * taxPct) / 100)
    last.closing = round(last.closing - last.tax)
  }
  const tax = round(periods.reduce((sum, row) => sum + row.tax, 0))

  let carry = principal
  let excise = 0
  for (let y = 0; y < Math.ceil(months / 12); y++) {
    // A year with no credit keeps the balance it opened with.
    carry = yearHigh[y] ?? carry
    excise += exciseDuty(carry, exciseSlabs)
  }

  return {
    totalInterest,
    tax,
    exciseDuty: round(excise),
    maturity: round(principal + totalInterest - tax - excise),
    periods,
  }
}
