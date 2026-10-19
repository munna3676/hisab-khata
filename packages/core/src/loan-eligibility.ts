import { calculateEmi } from './emi.ts'
import { round } from './lib/money.ts'

export interface LoanEligibilityInput {
  /** Take-home income per month, in taka. */
  monthlyIncome: number
  /** Instalments already paid every month on running loans; 0 for none. */
  existingEmi: number
  /** Share of income all instalments together may take, in percent (the 40% / 50% chips; from data). */
  maxDebtBurdenPct: number
  /** Yearly interest rate of the new loan in percent. */
  annualRatePct: number
  /** Number of monthly instalments of the new loan. */
  months: number
  /** Highest loan the bank or Bangladesh Bank allows for this loan type; leave out for none. */
  maxLoanCap?: number
}

export interface LoanEligibilityResult {
  /** Income × allowed share: the most all instalments together may be. */
  emiLimit: number
  /** What is left of emiLimit for the new loan's instalment. */
  newEmiCapacity: number
  maxLoan: number
  /** True when maxLoanCap, not income, decided maxLoan. */
  capped: boolean
  /** The new loan's EMI, total payment and interest at maxLoan. */
  emi: number
  totalPayment: number
  totalInterest: number
}

export type LoanEligibilityError = 'income' | 'existingEmi' | 'ratio' | 'rate' | 'months' | 'cap'

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateLoanEligibility(input: LoanEligibilityInput): LoanEligibilityError | null {
  if (!(input.monthlyIncome > 0)) return 'income'
  if (!(input.existingEmi >= 0)) return 'existingEmi'
  if (!(input.maxDebtBurdenPct > 0 && input.maxDebtBurdenPct <= 100)) return 'ratio'
  if (!(input.annualRatePct >= 0 && input.annualRatePct <= 100)) return 'rate'
  if (!(Number.isInteger(input.months) && input.months >= 1 && input.months <= 600)) return 'months'
  if (input.maxLoanCap !== undefined && !(input.maxLoanCap > 0)) return 'cap'
  return null
}

/** Largest loan whose EMI fits in what income leaves after existing EMIs (reducing balance). */
export function calculateLoanEligibility(input: LoanEligibilityInput): LoanEligibilityResult {
  const { monthlyIncome, existingEmi, maxDebtBurdenPct, annualRatePct, months, maxLoanCap } = input
  const emiLimit = round((monthlyIncome * maxDebtBurdenPct) / 100)
  const newEmiCapacity = round(Math.max(0, emiLimit - existingEmi))

  // Present value of `months` instalments of newEmiCapacity: the EMI formula solved for principal.
  const r = annualRatePct / 12 / 100
  const fromIncome = r === 0 ? newEmiCapacity * months : (newEmiCapacity * (1 - (1 + r) ** -months)) / r
  const capped = maxLoanCap !== undefined && maxLoanCap < fromIncome
  const maxLoan = round(capped ? maxLoanCap : fromIncome)

  if (maxLoan === 0) {
    return { emiLimit, newEmiCapacity, maxLoan, capped, emi: 0, totalPayment: 0, totalInterest: 0 }
  }
  const { emi, totalPayment, totalInterest } = calculateEmi({ principal: maxLoan, annualRatePct, months })
  return { emiLimit, newEmiCapacity, maxLoan, capped, emi, totalPayment, totalInterest }
}
