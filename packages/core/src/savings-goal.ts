import { round } from './lib/money.ts'

export interface SavingsGoalInput {
  /** Amount wanted at the end, in taka. */
  target: number
  /** Months until the goal; monthsUntil() turns a goal date into this. */
  months: number
  /** Expected yearly return in percent, compounded monthly; 0 for none. */
  annualRatePct: number
  /** Money already set aside today, which earns the same return; 0 when none. */
  currentSavings?: number
}

export interface SavingsGoalResult {
  /** Whole taka to put aside at the end of every month. */
  monthlySaving: number
  /** Whole taka a month that would be needed with no return at all. */
  monthlyWithoutReturn: number
  /** Monthly savings over the term + current savings. */
  totalDeposit: number
  /** The part of the target the return has to cover: target − totalDeposit. */
  profit: number
}

export type SavingsGoalError = 'target' | 'months' | 'rate' | 'current'

export interface SavingsFutureInput {
  /** Saved at the end of every month, in taka. */
  monthlySaving: number
  months: number
  /** Expected yearly return in percent, compounded monthly; 0 for none. */
  annualRatePct: number
  /** Money already set aside today; 0 when none. */
  currentSavings?: number
}

export interface SavingsFutureResult {
  futureValue: number
  totalDeposit: number
  profit: number
}

export type SavingsFutureError = 'saving' | 'months' | 'rate' | 'current'

function validMonths(months: number): boolean {
  return Number.isInteger(months) && months >= 1 && months <= 600
}

/** Future value of 1 taka saved at the end of each of `months` months at monthly rate `r`. */
function annuityFactor(r: number, months: number): number {
  return r === 0 ? months : ((1 + r) ** months - 1) / r
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateSavingsGoal(input: SavingsGoalInput): SavingsGoalError | null {
  if (!(input.target > 0)) return 'target'
  if (!validMonths(input.months)) return 'months'
  if (!(input.annualRatePct >= 0 && input.annualRatePct <= 100)) return 'rate'
  const current = input.currentSavings ?? 0
  if (!(current >= 0 && current < input.target)) return 'current'
  return null
}

/** Monthly saving needed to reach a target, saving at the end of each month. */
export function calculateSavingsGoal(input: SavingsGoalInput): SavingsGoalResult {
  const { target, months, annualRatePct, currentSavings = 0 } = input
  const r = annualRatePct / 12 / 100
  // What today's savings grow to does not have to be saved again.
  const stillNeeded = Math.max(0, target - currentSavings * (1 + r) ** months)
  // People save whole taka, so the instalment is rounded to the taka.
  const monthlySaving = round(stillNeeded / annuityFactor(r, months), 0)
  const monthlyWithoutReturn = round((target - currentSavings) / months, 0)
  const totalDeposit = round(monthlySaving * months + currentSavings)
  return { monthlySaving, monthlyWithoutReturn, totalDeposit, profit: round(target - totalDeposit) }
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateSavingsFuture(input: SavingsFutureInput): SavingsFutureError | null {
  if (!(input.monthlySaving > 0)) return 'saving'
  if (!validMonths(input.months)) return 'months'
  if (!(input.annualRatePct >= 0 && input.annualRatePct <= 100)) return 'rate'
  if (!((input.currentSavings ?? 0) >= 0)) return 'current'
  return null
}

/** The reverse: what a monthly saving grows to by the end of the term. */
export function calculateSavingsFuture(input: SavingsFutureInput): SavingsFutureResult {
  const { monthlySaving, months, annualRatePct, currentSavings = 0 } = input
  const r = annualRatePct / 12 / 100
  const futureValue = round(monthlySaving * annuityFactor(r, months) + currentSavings * (1 + r) ** months)
  const totalDeposit = round(monthlySaving * months + currentSavings)
  return { futureValue, totalDeposit, profit: round(futureValue - totalDeposit) }
}

/**
 * Whole months from `today` to `goalDate` (both 'YYYY-MM-DD'); a month counts
 * once its day is reached, or on the goal month's last day when that month is
 * shorter. 2026-10-19 → 2028-10-19 is 24; 2026-01-31 → 2026-02-28 is 1.
 */
export function monthsUntil(today: string, goalDate: string): number {
  const [y1, m1, d1] = today.split('-').map(Number) as [number, number, number]
  const [y2, m2, d2] = goalDate.split('-').map(Number) as [number, number, number]
  // Day 0 of the next month is the last day of month m2 (handles leap years).
  const lastDay = new Date(Date.UTC(y2, m2, 0)).getUTCDate()
  const reached = d2 >= d1 || d2 === lastDay
  return (y2 - y1) * 12 + (m2 - m1) - (reached ? 0 : 1)
}
