import { describe, expect, it } from 'vitest'
import { calculateDps, validateDps, type DpsInput } from '../src/dps.ts'

// Sample table in the shape of data/finance/excise-duty.json (FY2026-27 budget figures), test-only.
const EXCISE = [
  { upTo: 400000, duty: 0 },
  { upTo: 500000, duty: 150 },
  { upTo: 1000000, duty: 500 },
  { upTo: 5000000, duty: 3000 },
  { upTo: null, duty: 15000 },
]

const figma: DpsInput = { monthlyDeposit: 5000, annualRatePct: 9, months: 60, compounding: 'monthly', taxPct: 10 }

describe('dps', () => {
  it('matches the Figma example: ৫,০০০/মাস, ৯%, ৫ বছর, মাসিক, ১০% কর → ৳৩,৭১,৯৫৪', () => {
    const r = calculateDps(figma)
    expect(r.totalDeposit).toBe(300000)
    expect(Math.round(r.totalInterest)).toBe(79949)
    expect(Math.round(r.tax)).toBe(7995)
    expect(Math.round(r.maturity)).toBe(371954)
    expect(r.years).toHaveLength(5)
  })
  it('monthly mode equals the annuity-due formula P·((1+i)^n − 1)/i·(1+i), checked by hand', () => {
    const i = 0.09 / 12
    const fv = 5000 * (((1 + i) ** 60 - 1) / i) * (1 + i)
    expect(calculateDps({ ...figma, taxPct: 0 }).maturity).toBeCloseTo(fv, 1)
  })
  it('quarterly mode credits simple monthly profit every 3 months (hand-checked: 1,000/মাস, 12%, 3 মাস)', () => {
    // Months 1-3 earn 10 + 20 + 30 on 1,000 / 2,000 / 3,000, credited once.
    const q = calculateDps({ monthlyDeposit: 1000, annualRatePct: 12, months: 3, compounding: 'quarterly', taxPct: 0 })
    expect(q.maturity).toBe(3060)
    // Monthly credits compound: 1,010 → 2,030.10 → 3,060.40.
    const m = calculateDps({ monthlyDeposit: 1000, annualRatePct: 12, months: 3, compounding: 'monthly', taxPct: 0 })
    expect(m.maturity).toBe(3060.4)
  })
  it('quarterly pays a little less than monthly (the FAQ on the screen)', () => {
    const q = calculateDps({ ...figma, compounding: 'quarterly' })
    expect(q.totalInterest).toBeLessThan(calculateDps(figma).totalInterest)
    expect(q.totalInterest).toBeGreaterThan(79000)
  })
  it('year-by-year table adds up to the totals', () => {
    const r = calculateDps({ ...figma, months: 30 })
    expect(r.years.map((y) => y.year)).toEqual([1, 2, 3])
    expect(r.years.at(-1)!.deposit).toBe(30000)
    const interest = r.years.reduce((s, y) => s + y.interest, 0)
    expect(Math.abs(interest - r.totalInterest)).toBeLessThan(0.02)
    expect(r.years.at(-1)!.balance).toBe(r.totalDeposit + r.totalInterest)
  })
  it('takes excise duty once a year by the year-end balance', () => {
    const r = calculateDps({ ...figma, monthlyDeposit: 10000, exciseSlabs: EXCISE })
    const balances = r.years.map((y) => y.balance)
    // 1.26L, 2.64L, 4.15L, 5.80L, 7.60L → 0, 0, 150, 500, 500
    expect(balances[2]).toBeGreaterThan(400000)
    expect(r.years.map((y) => y.exciseDuty)).toEqual([0, 0, 150, 500, 500])
    expect(r.exciseDuty).toBe(1150)
    expect(r.maturity).toBe(Math.round((r.totalDeposit + r.totalInterest - r.tax - 1150) * 100) / 100)
  })
  it('the Figma example stays under the excise-free limit', () => {
    expect(calculateDps({ ...figma, exciseSlabs: EXCISE }).exciseDuty).toBe(0)
  })
  it('handles zero rate and a very large deposit', () => {
    const zero = calculateDps({ ...figma, annualRatePct: 0 })
    expect(zero.totalInterest).toBe(0)
    expect(zero.maturity).toBe(300000)
    const big = calculateDps({ ...figma, monthlyDeposit: 10_000_000, months: 600 })
    expect(Number.isFinite(big.maturity)).toBe(true)
    expect(big.years).toHaveLength(50)
  })
  it('validates input', () => {
    expect(validateDps({ ...figma, monthlyDeposit: 0 })).toBe('deposit')
    expect(validateDps({ ...figma, annualRatePct: -1 })).toBe('rate')
    expect(validateDps({ ...figma, months: 12.5 })).toBe('months')
    expect(validateDps({ ...figma, compounding: 'yearly' as never })).toBe('compounding')
    expect(validateDps({ ...figma, taxPct: 101 })).toBe('tax')
    expect(validateDps({ ...figma, exciseSlabs: [{ upTo: 100, duty: 0 }] })).toBe('excise')
    expect(validateDps({ ...figma, exciseSlabs: EXCISE })).toBeNull()
    expect(validateDps(figma)).toBeNull()
  })
  it('matches the annuity-due value: ১,০০০/মাস, ৯%, ৫ বছর → ৳৭৫,৯৮৯.৮২ before tax, checked by hand', () => {
    // (1.0075^60 − 1) / 0.0075 × 1.0075 = 75.989818 → 75,989.82 (BD DPS calculators show ৳75,990)
    const r = calculateDps({ monthlyDeposit: 1000, annualRatePct: 9, months: 60, compounding: 'monthly', taxPct: 0 })
    expect(r.maturity).toBe(75989.82)
  })
  it('Figma year-1 row: 5,000 × (1.0075^12 − 1)/0.0075 × 1.0075 = ৳৬৩,০০৬.৯৭, checked by hand', () => {
    const y1 = calculateDps(figma).years[0]!
    expect(y1.deposit).toBe(60000)
    expect(y1.balance).toBe(63006.97)
    expect(y1.interest).toBe(3006.97)
  })
  it('quarterly matches the closed form and Prime Bank Edu DPS chart (১,০০০/মাস, ৯%, ৫ বছর → ৳৭৫,৮৫০)', () => {
    // Each quarter B → B(1 + 3r) + D(3 + 6r) with r = 0.75%, so after 20 quarters
    // D(3 + 6r)((1 + 3r)^20 − 1)/(3r) = 75,855.58. Prime Bank's printed chart (before tax
    // and excise duty) says 75,850, which banks round down; monthly mode would be 75,990.
    const r = 0.0075
    const closed = 1000 * (3 + 6 * r) * (((1 + 3 * r) ** 20 - 1) / (3 * r))
    const q = calculateDps({ monthlyDeposit: 1000, annualRatePct: 9, months: 60, compounding: 'quarterly', taxPct: 0 })
    expect(q.maturity).toBeCloseTo(closed, 2)
    expect(q.maturity).toBe(75855.58)
    expect(Math.abs(q.maturity - 75850)).toBeLessThan(10)
  })
  it('a year-end balance of exactly ৳৪,০০,০০০ is excise-free; one taka more pays ৳১৫০', () => {
    const base: DpsInput = { ...figma, months: 1, annualRatePct: 0, taxPct: 0, exciseSlabs: EXCISE }
    expect(calculateDps({ ...base, monthlyDeposit: 400000 }).exciseDuty).toBe(0)
    expect(calculateDps({ ...base, monthlyDeposit: 400001 }).exciseDuty).toBe(150)
  })
  it('handles a one-month term (1,000 at 12% earns 10, tax 1)', () => {
    const r = calculateDps({ monthlyDeposit: 1000, annualRatePct: 12, months: 1, compounding: 'quarterly', taxPct: 10 })
    expect([r.totalInterest, r.tax, r.maturity]).toEqual([10, 1, 1009])
    expect(r.years).toHaveLength(1)
  })
  it('rejects prototype names as a mode and NaN; an empty excise table means none', () => {
    expect(validateDps({ ...figma, compounding: 'constructor' as never })).toBe('compounding')
    expect(validateDps({ ...figma, compounding: 'toString' as never })).toBe('compounding')
    expect(validateDps({ ...figma, monthlyDeposit: NaN })).toBe('deposit')
    expect(validateDps({ ...figma, taxPct: NaN })).toBe('tax')
    expect(validateDps({ ...figma, exciseSlabs: [] })).toBeNull()
    expect(calculateDps({ ...figma, exciseSlabs: [] }).exciseDuty).toBe(0)
  })
})
