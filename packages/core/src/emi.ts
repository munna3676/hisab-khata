import { round } from './lib/money.ts'

export interface EmiInput {
  /** Loan amount in taka. */
  principal: number
  /** Yearly interest rate in percent, e.g. 12 for 12%. */
  annualRatePct: number
  /** Number of monthly instalments. */
  months: number
}

export interface EmiRow {
  month: number
  emi: number
  interest: number
  principal: number
  balance: number
}

export interface EmiResult {
  emi: number
  totalPayment: number
  totalInterest: number
  schedule: EmiRow[]
}

export type EmiError = 'principal' | 'rate' | 'months'

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateEmi(input: EmiInput): EmiError | null {
  if (!(input.principal > 0)) return 'principal'
  if (!(input.annualRatePct >= 0 && input.annualRatePct <= 100)) return 'rate'
  if (!(Number.isInteger(input.months) && input.months >= 1 && input.months <= 600)) return 'months'
  return null
}

/** Reducing-balance EMI with a month-by-month schedule. */
export function calculateEmi(input: EmiInput): EmiResult {
  const { principal, annualRatePct, months } = input
  const r = annualRatePct / 12 / 100
  const rawEmi = r === 0 ? principal / months : (principal * r * (1 + r) ** months) / ((1 + r) ** months - 1)
  const emi = round(rawEmi)

  const schedule: EmiRow[] = []
  let balance = principal
  for (let month = 1; month <= months; month++) {
    const interest = round(balance * r)
    // The last instalment clears whatever rounding left behind.
    const principalPart = month === months ? round(balance) : round(emi - interest)
    balance = round(balance - principalPart)
    schedule.push({ month, emi: round(principalPart + interest), interest, principal: principalPart, balance })
  }

  const totalPayment = round(schedule.reduce((sum, row) => sum + row.emi, 0))
  return { emi, totalPayment, totalInterest: round(totalPayment - principal), schedule }
}
