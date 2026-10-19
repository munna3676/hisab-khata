import { describe, expect, it } from 'vitest'
import { calculateLoanEligibility, validateLoanEligibility, type LoanEligibilityInput } from '../src/loan-eligibility.ts'

const figma: LoanEligibilityInput = {
  monthlyIncome: 60000,
  existingEmi: 5000,
  maxDebtBurdenPct: 50,
  annualRatePct: 12,
  months: 60,
}

describe('loan-eligibility', () => {
  it('matches the Figma example: আয় ৬০,০০০, কিস্তি ৫,০০০, ৫০%, ১২%, ৫ বছর → ৳১১,২৩,৮৭৬', () => {
    const r = calculateLoanEligibility(figma)
    expect(r.emiLimit).toBe(30000)
    expect(r.newEmiCapacity).toBe(25000)
    expect(Math.round(r.maxLoan)).toBe(1123876)
    expect(r.capped).toBe(false)
  })
  it('the loan found has exactly the EMI that fits (round trip through calculateEmi)', () => {
    expect(calculateLoanEligibility(figma).emi).toBe(25000)
  })
  it('matches a hand-checked value: 10,000/মাস at 9% for 12 months → 1,14,349.13', () => {
    // 10,000 × (1 − 1.0075^−12) / 0.0075 = 10,000 × 11.434913 (annuity table, 0.75%, 12) = 1,14,349.13
    const r = calculateLoanEligibility({ monthlyIncome: 25000, existingEmi: 0, maxDebtBurdenPct: 40, annualRatePct: 9, months: 12 })
    expect(r.maxLoan).toBe(114349.13)
  })
  it('the 40% chip gives less', () => {
    const r = calculateLoanEligibility({ ...figma, maxDebtBurdenPct: 40 })
    expect(r.newEmiCapacity).toBe(19000)
    expect(r.maxLoan).toBeLessThan(calculateLoanEligibility(figma).maxLoan)
  })
  it('handles zero interest', () => {
    expect(calculateLoanEligibility({ ...figma, annualRatePct: 0 }).maxLoan).toBe(25000 * 60)
  })
  it('gives zero when existing EMIs already use the allowed share', () => {
    const r = calculateLoanEligibility({ ...figma, existingEmi: 35000 })
    expect(r.newEmiCapacity).toBe(0)
    expect(r.maxLoan).toBe(0)
    expect(r.emi).toBe(0)
  })
  it('respects a loan cap', () => {
    const r = calculateLoanEligibility({ ...figma, maxLoanCap: 1000000 })
    expect(r.maxLoan).toBe(1000000)
    expect(r.capped).toBe(true)
    expect(r.emi).toBeLessThan(25000)
    expect(calculateLoanEligibility({ ...figma, maxLoanCap: 5000000 }).capped).toBe(false)
  })
  it('validates input', () => {
    expect(validateLoanEligibility({ ...figma, monthlyIncome: 0 })).toBe('income')
    expect(validateLoanEligibility({ ...figma, existingEmi: -1 })).toBe('existingEmi')
    expect(validateLoanEligibility({ ...figma, maxDebtBurdenPct: 0 })).toBe('ratio')
    expect(validateLoanEligibility({ ...figma, annualRatePct: NaN })).toBe('rate')
    expect(validateLoanEligibility({ ...figma, months: 601 })).toBe('months')
    expect(validateLoanEligibility({ ...figma, maxLoanCap: 0 })).toBe('cap')
    expect(validateLoanEligibility(figma)).toBeNull()
  })
})
