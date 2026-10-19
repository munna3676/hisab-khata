import { describe, expect, it } from 'vitest'
import { calculateLoanCompare, validateLoanCompare, type LoanOffer } from '../src/loan-compare.ts'

const A: LoanOffer = { principal: 500000, annualRatePct: 12, months: 36, processingFeePct: 1 }
const B: LoanOffer = { principal: 500000, annualRatePct: 11, months: 36, processingFeePct: 2 }

describe('loan-compare', () => {
  it('matches the Figma example: A ১২% + ১% ফি vs B ১১% + ২% ফি → B সস্তা', () => {
    const r = calculateLoanCompare({ offers: [A, B] })
    expect(r.offers.map((o) => Math.round(o.emi))).toEqual([16607, 16369])
    expect(Math.round(r.offers[0]!.totalInterest)).toBe(97858)
    expect(r.offers.map((o) => o.fees)).toEqual([5000, 10000])
    expect(Math.round(r.offers[0]!.totalCost)).toBe(102858)
    expect(r.bestIndex).toBe(1)
    // Highlighted cells: B has the lower EMI, interest and total; A the lower fee.
    expect(r.lowest).toEqual({ emi: 1, totalInterest: 1, fees: 0, totalCost: 1 })
  })
  it('B interest is the reducing-balance total, checked by hand', () => {
    // EMI 16,369.36 at 11% for 36 months; the schedule totals 5,89,296.90.
    const r = calculateLoanCompare({ offers: [A, B] })
    expect(r.offers[1]!.totalInterest).toBe(89296.9)
    expect(r.offers[1]!.totalCost).toBe(99296.9)
    expect(r.saving).toBe(3560.73)
  })
  it('compares three offers and counts other fees', () => {
    const C: LoanOffer = { principal: 500000, annualRatePct: 11.5, months: 36, processingFeePct: 0, otherFees: 2000 }
    const r = calculateLoanCompare({ offers: [A, B, C] })
    expect(r.offers[2]!.fees).toBe(2000)
    const costs = r.offers.map((o) => o.totalCost)
    expect(r.bestIndex).toBe(costs.indexOf(Math.min(...costs)))
    const sorted = [...costs].sort((a, b) => a - b)
    expect(r.saving).toBeCloseTo(sorted[1]! - sorted[0]!, 2)
    expect(r.offers[2]!.totalPayment).toBeCloseTo(500000 + r.offers[2]!.totalCost, 2)
  })
  it('reports a tie as no single best offer', () => {
    const r = calculateLoanCompare({ offers: [A, { ...A }] })
    expect(r.bestIndex).toBeNull()
    expect(r.saving).toBe(0)
    expect(r.lowest.fees).toBeNull()
  })
  it('handles zero interest', () => {
    const r = calculateLoanCompare({ offers: [{ ...A, annualRatePct: 0 }, B] })
    expect(r.offers[0]!.totalInterest).toBe(0)
    expect(r.offers[0]!.totalCost).toBe(5000)
    expect(r.bestIndex).toBe(0)
  })
  it('validates input', () => {
    expect(validateLoanCompare({ offers: [A] })).toBe('offers')
    expect(validateLoanCompare({ offers: [A, B, A, B] })).toBe('offers')
    expect(validateLoanCompare({ offers: [A, { ...B, principal: 0 }] })).toBe('principal.1')
    expect(validateLoanCompare({ offers: [{ ...A, annualRatePct: -2 }, B] })).toBe('rate.0')
    expect(validateLoanCompare({ offers: [A, { ...B, months: 2.5 }] })).toBe('months.1')
    expect(validateLoanCompare({ offers: [A, { ...B, processingFeePct: -1 }] })).toBe('fee.1')
    expect(validateLoanCompare({ offers: [A, { ...B, otherFees: -10 }] })).toBe('fee.1')
    expect(validateLoanCompare({ offers: [A, B] })).toBeNull()
  })
})
