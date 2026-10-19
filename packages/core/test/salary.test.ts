import { describe, expect, it } from 'vitest'
import { calculateSalary, validateSalary, type SalaryInput, type SalaryStructure } from '../src/salary.ts'

// Sample preset in the shape of data/finance/salary-presets.json, test-only (the screen's split).
const COMMON: SalaryStructure = { basicPctOfGross: 60, houseRentPctOfBasic: 50, medicalPctOfBasic: 10, conveyance: null }

const figma: SalaryInput = { from: 'gross', amount: 50000, structure: COMMON }

describe('salary', () => {
  it('matches the Figma example: ৫০,০০০ gross, বেসিক ৬০%, বাড়িভাড়া ৫০% → ৩০,০০০ / ১৫,০০০ / ৩,০০০ / ২,০০০', () => {
    const r = calculateSalary(figma)
    expect([r.basic, r.houseRent, r.medical, r.conveyance]).toEqual([30000, 15000, 3000, 2000])
    expect(r.gross).toBe(50000)
    expect(r.net).toBe(50000)
  })
  it('works back from basic to gross', () => {
    const r = calculateSalary({ ...figma, from: 'basic', amount: 30000 })
    expect(r.gross).toBe(50000)
    expect(r.conveyance).toBe(2000)
  })
  it('parts always add up to gross, even with paisa rounding (hand-checked: 33,333)', () => {
    const r = calculateSalary({ ...figma, amount: 33333 })
    // 19,999.80 + 9,999.90 + 1,999.98 + 1,333.32
    expect(r.basic).toBe(19999.8)
    expect(r.conveyance).toBe(1333.32)
    expect(r.basic + r.houseRent + r.medical + r.conveyance + r.otherAllowance).toBeCloseTo(33333, 6)
  })
  it('puts what a fixed conveyance leaves into other allowance', () => {
    const r = calculateSalary({ ...figma, structure: { ...COMMON, conveyance: 1500 } })
    expect(r.conveyance).toBe(1500)
    expect(r.otherAllowance).toBe(500)
  })
  it('takes deductions to give net', () => {
    const r = calculateSalary({
      ...figma,
      deductions: [
        { label: 'প্রভিডেন্ট ফান্ড', kind: 'pctOfBasic', value: 10 },
        { label: 'উৎসে কর', kind: 'amount', value: 1250 },
        { label: 'কল্যাণ তহবিল', kind: 'pctOfGross', value: 1 },
      ],
    })
    expect(r.deductions.map((d) => d.amount)).toEqual([3000, 1250, 500])
    expect(r.totalDeductions).toBe(4750)
    expect(r.net).toBe(45250)
  })
  it('validates input', () => {
    expect(validateSalary({ ...figma, amount: 0 })).toBe('amount')
    expect(validateSalary({ ...figma, structure: { ...COMMON, basicPctOfGross: 0 } })).toBe('basic')
    expect(validateSalary({ ...figma, structure: { ...COMMON, houseRentPctOfBasic: -5 } })).toBe('houseRent')
    expect(validateSalary({ ...figma, structure: { ...COMMON, medicalPctOfBasic: 200 } })).toBe('medical')
    expect(validateSalary({ ...figma, structure: { ...COMMON, conveyance: -1 } })).toBe('conveyance')
    // 80% basic + 50% of it as rent + 10% medical = 128% of gross
    expect(validateSalary({ ...figma, structure: { ...COMMON, basicPctOfGross: 80 } })).toBe('structure')
    expect(validateSalary({ ...figma, structure: { ...COMMON, conveyance: 2500 } })).toBe('structure')
    expect(validateSalary({ ...figma, deductions: [{ label: 'x', kind: 'amount', value: 60000 }] })).toBe('deductions')
    expect(validateSalary({ ...figma, deductions: [{ label: 'x', kind: 'amount', value: -1 }] })).toBe('deductions')
    expect(validateSalary(figma)).toBeNull()
  })
})
