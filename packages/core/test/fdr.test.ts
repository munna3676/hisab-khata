import { describe, expect, it } from 'vitest'
import { calculateFdr, validateFdr, type FdrInput } from '../src/fdr.ts'

// Sample table in the shape of data/finance/excise-duty.json (FY2026-27 budget figures), test-only.
const EXCISE = [
  { upTo: 400000, duty: 0 },
  { upTo: 500000, duty: 150 },
  { upTo: 1000000, duty: 500 },
  { upTo: 5000000, duty: 3000 },
  { upTo: null, duty: 15000 },
]

const figma: FdrInput = { principal: 100000, annualRatePct: 10, months: 12, mode: 'simple', taxPct: 10 }

describe('fdr', () => {
  it('matches the Figma example: ১ লাখ, ১০%, ১২ মাস, মেয়াদ শেষে, ১০% কর → ৳১,০৯,০০০', () => {
    const r = calculateFdr(figma)
    expect(r.totalInterest).toBe(10000)
    expect(r.tax).toBe(1000)
    expect(r.maturity).toBe(109000)
    expect(r.periods).toHaveLength(1)
  })
  it('renew every 3 months equals P·(1 + r/4·(1 − tax))^4, checked by hand', () => {
    // 1,00,000 × 1.0225^4 = 1,09,308.33
    const r = calculateFdr({ ...figma, mode: 'renew', periodMonths: 3 })
    expect(r.maturity).toBe(109308.33)
    expect(r.periods.map((p) => p.tax)).toEqual([250, 255.63, 261.38, 267.26])
    expect(r.periods.at(-1)!.closing).toBe(r.maturity)
  })
  it('renew defaults to 3 months, the screen\'s "প্রতি ৩ মাসে রিনিউ"', () => {
    expect(calculateFdr({ ...figma, mode: 'renew' }).periods).toHaveLength(4)
  })
  it('compound adds gross profit each period and takes tax at maturity', () => {
    // 1,00,000 × 1.025^4 = 1,10,381.29 → profit 10,381.29, tax 1,038.13
    const r = calculateFdr({ ...figma, mode: 'compound', periodMonths: 3 })
    expect(r.totalInterest).toBe(10381.29)
    expect(r.tax).toBe(1038.13)
    expect(r.maturity).toBe(109343.16)
    expect(r.periods.slice(0, -1).every((p) => p.tax === 0)).toBe(true)
  })
  it('compound with a short last period gives it simple profit', () => {
    // 6 + 1 months: 1,00,000 × 1.05 = 1,05,000, then 1,05,000 × 10%/12 = 875
    const r = calculateFdr({ ...figma, months: 7, mode: 'compound', periodMonths: 6, taxPct: 0 })
    expect(r.periods.map((p) => p.months)).toEqual([6, 1])
    expect(r.maturity).toBe(105875)
  })
  it('takes excise duty once per account year by the highest balance', () => {
    // 10 lakh simple for 3 years: years 1-2 at 10L → 500 each; year 3 at 13L → 3,000
    const r = calculateFdr({ ...figma, principal: 1000000, months: 36, exciseSlabs: EXCISE })
    expect(r.totalInterest).toBe(300000)
    expect(r.exciseDuty).toBe(4000)
    expect(r.maturity).toBe(1000000 + 300000 - 30000 - 4000)
  })
  it('the Figma example stays under the excise-free limit', () => {
    expect(calculateFdr({ ...figma, exciseSlabs: EXCISE }).exciseDuty).toBe(0)
  })
  it('handles zero rate, no tax and a very large deposit', () => {
    expect(calculateFdr({ ...figma, annualRatePct: 0 }).maturity).toBe(100000)
    expect(calculateFdr({ ...figma, taxPct: 0 }).maturity).toBe(110000)
    const big = calculateFdr({ ...figma, principal: 1e11, months: 120, mode: 'renew' })
    expect(Number.isFinite(big.maturity)).toBe(true)
    expect(big.periods).toHaveLength(40)
  })
  it('validates input', () => {
    expect(validateFdr({ ...figma, principal: -5 })).toBe('principal')
    expect(validateFdr({ ...figma, annualRatePct: 120 })).toBe('rate')
    expect(validateFdr({ ...figma, months: 0 })).toBe('months')
    expect(validateFdr({ ...figma, mode: 'daily' as never })).toBe('mode')
    expect(validateFdr({ ...figma, mode: 'compound', periodMonths: 0 })).toBe('period')
    expect(validateFdr({ ...figma, mode: 'renew', months: 7 })).toBe('months')
    expect(validateFdr({ ...figma, taxPct: -1 })).toBe('tax')
    expect(validateFdr({ ...figma, exciseSlabs: [{ upTo: 100, duty: 0 }] })).toBe('excise')
    expect(validateFdr({ ...figma, mode: 'renew', months: 36 })).toBeNull()
    expect(validateFdr(figma)).toBeNull()
  })
  it('term chips by hand: ৬ মাস → ৳১,০৪,৫০০ and ৩ বছর → ৳১,২৭,০০০ (মেয়াদ শেষে, ১০% কর)', () => {
    // 1,00,000 × 10% × 6/12 = 5,000 profit, 500 tax; × 36/12 = 30,000 profit, 3,000 tax
    expect(calculateFdr({ ...figma, months: 6 }).maturity).toBe(104500)
    const three = calculateFdr({ ...figma, months: 36 })
    expect([three.totalInterest, three.tax, three.maturity]).toEqual([30000, 3000, 127000])
  })
  it('yearly renewal equals P·(1 + r·(1 − tax))^n: 1,00,000 × 1.09³ = ৳১,২৯,৫০২.৯০, checked by hand', () => {
    const r = calculateFdr({ ...figma, months: 36, mode: 'renew', periodMonths: 12 })
    expect(r.maturity).toBe(129502.9)
    expect(r.periods.map((p) => p.tax)).toEqual([1000, 1090, 1188.1])
  })
  it('renew for 6 months rounds each tax to paisa (hand: +2,500 − 250, then +2,556.25 − 255.63)', () => {
    expect(calculateFdr({ ...figma, months: 6, mode: 'renew' }).maturity).toBe(104550.62)
  })
  it('a compounding period longer than a year: years without a credit keep their opening balance', () => {
    // 4.5L at 10%, credited every 24 months. Year highs: 4.5L (150), 5.4L (500), 5.4L (500), 6.48L (500)
    const r = calculateFdr({ principal: 450000, annualRatePct: 10, months: 48, mode: 'compound', periodMonths: 24, taxPct: 10, exciseSlabs: EXCISE })
    expect(r.periods.map((p) => p.interest)).toEqual([90000, 108000])
    expect(r.exciseDuty).toBe(1650)
    expect(r.maturity).toBe(450000 + 198000 - 19800 - 1650)
  })
  it('excise limit: exactly ৳৪,০০,০০০ is duty-free; one taka more pays ৳১৫০', () => {
    expect(calculateFdr({ ...figma, principal: 400000, annualRatePct: 0, exciseSlabs: EXCISE }).exciseDuty).toBe(0)
    expect(calculateFdr({ ...figma, principal: 400001, annualRatePct: 0, exciseSlabs: EXCISE }).exciseDuty).toBe(150)
  })
  it('an empty excise table means none; a one-month term works', () => {
    expect(validateFdr({ ...figma, exciseSlabs: [] })).toBeNull()
    // 1,00,000 × 10% / 12 = 833.33, tax 83.33
    expect(calculateFdr({ ...figma, months: 1, exciseSlabs: [] }).maturity).toBe(100750)
    expect(validateFdr({ ...figma, mode: 'renew', months: 3, periodMonths: 6 })).toBe('months')
  })
})
