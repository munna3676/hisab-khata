import { describe, expect, it } from 'vitest'
import { calculateEmi, validateEmi } from '../src/emi.ts'

describe('emi', () => {
  it('matches the Figma example: ৫ লাখ, ১২%, ৩ বছর → ৳১৬,৬০৭', () => {
    const r = calculateEmi({ principal: 500000, annualRatePct: 12, months: 36 })
    expect(Math.round(r.emi)).toBe(16607)
    expect(r.schedule).toHaveLength(36)
    expect(r.schedule.at(-1)!.balance).toBe(0)
  })
  it('matches a hand-checked value: 1,00,000 at 9% for 12 months', () => {
    // Standard formula result: 8745.15
    expect(calculateEmi({ principal: 100000, annualRatePct: 9, months: 12 }).emi).toBe(8745.15)
  })
  it('handles zero interest', () => {
    const r = calculateEmi({ principal: 1200, annualRatePct: 0, months: 12 })
    expect(r.emi).toBe(100)
    expect(r.totalInterest).toBe(0)
  })
  it('schedule principal adds up to the loan', () => {
    const r = calculateEmi({ principal: 750000, annualRatePct: 10.5, months: 60 })
    const paid = r.schedule.reduce((s, row) => s + row.principal, 0)
    expect(Math.abs(paid - 750000)).toBeLessThan(0.01)
  })
  it('validates input', () => {
    expect(validateEmi({ principal: 0, annualRatePct: 10, months: 12 })).toBe('principal')
    expect(validateEmi({ principal: 100, annualRatePct: -1, months: 12 })).toBe('rate')
    expect(validateEmi({ principal: 100, annualRatePct: 10, months: 1.5 })).toBe('months')
    expect(validateEmi({ principal: 100, annualRatePct: 10, months: 12 })).toBeNull()
  })
})
