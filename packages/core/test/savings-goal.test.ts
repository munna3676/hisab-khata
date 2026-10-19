import { describe, expect, it } from 'vitest'
import {
  calculateSavingsFuture,
  calculateSavingsGoal,
  monthsUntil,
  validateSavingsFuture,
  validateSavingsGoal,
  type SavingsGoalInput,
} from '../src/savings-goal.ts'

const figma: SavingsGoalInput = { target: 500000, months: 24, annualRatePct: 6 }

describe('savings-goal', () => {
  it('matches the Figma example: ৫ লাখ, ২৪ মাস, ৬% → মাসে ৳১৯,৬৬০', () => {
    const r = calculateSavingsGoal(figma)
    expect(r.monthlySaving).toBe(19660)
    expect(r.totalDeposit).toBe(471840)
    expect(r.profit).toBe(28160)
  })
  it('without return is target ÷ months, to the nearest taka', () => {
    // 5,00,000 ÷ 24 = 20,833.33 (the screen shows 20,834, rounded up)
    expect(calculateSavingsGoal(figma).monthlyWithoutReturn).toBe(20833)
  })
  it('matches the ordinary-annuity formula T·i/((1+i)^n − 1), checked by hand', () => {
    // 1,20,000 in 12 months at 12%: i = 1%, (1.01^12 − 1)/0.01 = 12.6825 → 9,461.85
    expect(calculateSavingsGoal({ target: 120000, months: 12, annualRatePct: 12 }).monthlySaving).toBe(9462)
  })
  it('handles zero return', () => {
    const r = calculateSavingsGoal({ ...figma, annualRatePct: 0 })
    expect(r.monthlySaving).toBe(20833)
    expect(r.monthlySaving).toBe(r.monthlyWithoutReturn)
  })
  it('counts money already saved, with its growth', () => {
    const r = calculateSavingsGoal({ ...figma, currentSavings: 100000 })
    expect(r.monthlySaving).toBeLessThan(calculateSavingsGoal(figma).monthlySaving)
    expect(r.monthlyWithoutReturn).toBe(16667)
    // Savings that grow past the target need nothing more each month.
    expect(calculateSavingsGoal({ target: 100000, months: 120, annualRatePct: 10, currentSavings: 50000 }).monthlySaving).toBe(0)
  })
  it('reverse: what 19,660 a month grows to in 24 months at 6%', () => {
    const r = calculateSavingsFuture({ monthlySaving: 19660, months: 24, annualRatePct: 6 })
    expect(Math.round(r.futureValue)).toBe(499992)
    expect(r.totalDeposit).toBe(471840)
    expect(r.profit).toBe(round2(r.futureValue - r.totalDeposit))
  })
  it('reverse with zero return and current savings', () => {
    const r = calculateSavingsFuture({ monthlySaving: 1000, months: 10, annualRatePct: 0, currentSavings: 500 })
    expect(r.futureValue).toBe(10500)
    expect(r.profit).toBe(0)
  })
  it('turns a goal date into months', () => {
    expect(monthsUntil('2026-10-19', '2028-10-19')).toBe(24)
    expect(monthsUntil('2026-10-19', '2028-10-18')).toBe(23)
    expect(monthsUntil('2026-01-31', '2026-03-01')).toBe(1)
  })
  it('validates input', () => {
    expect(validateSavingsGoal({ ...figma, target: 0 })).toBe('target')
    expect(validateSavingsGoal({ ...figma, months: 0 })).toBe('months')
    expect(validateSavingsGoal({ ...figma, annualRatePct: -1 })).toBe('rate')
    expect(validateSavingsGoal({ ...figma, currentSavings: 500000 })).toBe('current')
    expect(validateSavingsGoal(figma)).toBeNull()
    expect(validateSavingsFuture({ monthlySaving: 0, months: 12, annualRatePct: 6 })).toBe('saving')
    expect(validateSavingsFuture({ monthlySaving: 100, months: 1.5, annualRatePct: 6 })).toBe('months')
    expect(validateSavingsFuture({ monthlySaving: 100, months: 12, annualRatePct: 6, currentSavings: -1 })).toBe('current')
    expect(validateSavingsFuture({ monthlySaving: 100, months: 12, annualRatePct: 6 })).toBeNull()
  })
})

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
