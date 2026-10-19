import { exciseDuty, isValidExciseTable, type ExciseSlab } from './lib/finance-slabs.ts'
import { round } from './lib/money.ts'

/** When the bank adds the profit earned so far to the balance. */
export type DpsCompounding = 'monthly' | 'quarterly'

export interface DpsInput {
  /** Instalment paid at the start of every month, in taka. */
  monthlyDeposit: number
  /** Yearly profit rate in percent, e.g. 9 for 9%. */
  annualRatePct: number
  /** Number of monthly instalments (the term). */
  months: number
  compounding: DpsCompounding
  /** Tax at source on the profit in percent (from data: with TIN / without TIN); 0 for none. */
  taxPct: number
  /** Yearly excise duty by highest balance. Leave out (or pass []) to ignore excise duty. */
  exciseSlabs?: readonly ExciseSlab[]
}

export interface DpsYearRow {
  year: number
  /** Instalments paid in this year. */
  deposit: number
  /** Profit earned in this year. */
  interest: number
  /** Balance at the end of this year, before tax and excise duty. */
  balance: number
  /** Excise duty for this year, taken from the maturity amount. */
  exciseDuty: number
}

export interface DpsResult {
  totalDeposit: number
  totalInterest: number
  tax: number
  exciseDuty: number
  /** Deposits + profit − tax − excise duty. */
  maturity: number
  years: DpsYearRow[]
}

export type DpsError = 'deposit' | 'rate' | 'months' | 'compounding' | 'tax' | 'excise'

const CREDIT_EVERY_MONTHS: Record<DpsCompounding, number> = { monthly: 1, quarterly: 3 }

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateDps(input: DpsInput): DpsError | null {
  if (!(input.monthlyDeposit > 0)) return 'deposit'
  if (!(input.annualRatePct >= 0 && input.annualRatePct <= 100)) return 'rate'
  if (!(Number.isInteger(input.months) && input.months >= 1 && input.months <= 600)) return 'months'
  // hasOwn, not `in`: 'constructor' or 'toString' must not pass as a mode.
  if (!Object.hasOwn(CREDIT_EVERY_MONTHS, input.compounding)) return 'compounding'
  if (!(input.taxPct >= 0 && input.taxPct <= 100)) return 'tax'
  // An empty table means no excise duty, as when it is left out.
  if (input.exciseSlabs?.length && !isValidExciseTable(input.exciseSlabs)) return 'excise'
  return null
}

/**
 * DPS maturity with a year-by-year table. Each month's profit is earned on
 * the balance after that month's instalment; it joins the balance every month
 * or every quarter (and at maturity). Tax is taken once, on the whole profit.
 */
export function calculateDps(input: DpsInput): DpsResult {
  const { monthlyDeposit, annualRatePct, months, compounding, taxPct, exciseSlabs = [] } = input
  const r = annualRatePct / 12 / 100
  const creditEvery = CREDIT_EVERY_MONTHS[compounding]

  const years: DpsYearRow[] = []
  let balance = 0
  let accrued = 0
  let yearDeposit = 0
  let yearInterest = 0
  for (let month = 1; month <= months; month++) {
    balance += monthlyDeposit
    yearDeposit += monthlyDeposit
    const interest = balance * r
    accrued += interest
    yearInterest += interest
    if (month % creditEvery === 0 || month === months) {
      balance += accrued
      accrued = 0
    }
    if (month % 12 === 0 || month === months) {
      // The balance only grows, so the year-end balance is the year's highest.
      years.push({
        year: Math.ceil(month / 12),
        deposit: round(yearDeposit),
        interest: round(yearInterest),
        balance: round(balance),
        exciseDuty: exciseDuty(balance, exciseSlabs),
      })
      yearDeposit = 0
      yearInterest = 0
    }
  }

  const totalDeposit = round(monthlyDeposit * months)
  const totalInterest = round(balance - monthlyDeposit * months)
  const tax = round((totalInterest * taxPct) / 100)
  const excise = round(years.reduce((sum, row) => sum + row.exciseDuty, 0))
  return {
    totalDeposit,
    totalInterest,
    tax,
    exciseDuty: excise,
    maturity: round(totalDeposit + totalInterest - tax - excise),
    years,
  }
}
