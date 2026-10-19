import { describe, expect, it } from 'vitest'
import {
  calculateIncomeTax,
  isValidIncomeTaxRules,
  validateIncomeTax,
  type IncomeTaxInput,
  type IncomeTaxRules,
} from '../src/income-tax.ts'

// Shaped like data/income-tax-2026-27.json, with the numbers on the Figma screen (C6).
const RULES: IncomeTaxRules = {
  incomeYear: '2026-27',
  thresholds: { general: 400000, womenOrSenior: 425000, disabled: 500000, freedomFighter: 525000 },
  disabledDependentExtra: 50000,
  slabs: [
    { width: 300000, ratePct: 10 },
    { width: 400000, ratePct: 15 },
    { width: 500000, ratePct: 20 },
    { width: 2000000, ratePct: 25 },
    { width: null, ratePct: 30 },
  ],
  rebate: { incomePct: 3, investmentPct: 15, cap: 1000000 },
  minimumTax: { dhakaCtgCity: 5000, otherCity: 4000, rest: 3000 },
  freelance: { exemptPct: 100, exemptCap: null, bankingChannelOnly: true },
}

const base = (over: Partial<IncomeTaxInput> = {}): IncomeTaxInput => ({
  mode: 'salaried',
  income: 900000,
  category: 'general',
  investment: 0,
  area: 'dhakaCtgCity',
  rules: RULES,
  ...over,
})

describe('income-tax', () => {
  it('matches the Figma example (C6): ৯,০০,০০০ আয়, ১,০০,০০০ বিনিয়োগ → ৳৪৫,০০০', () => {
    const r = calculateIncomeTax(base({ investment: 100000 }))
    expect(r.rows).toEqual([
      { label: 'first', amount: 400000, ratePct: 0, tax: 0 },
      { label: 'next', amount: 300000, ratePct: 10, tax: 30000 },
      { label: 'next', amount: 200000, ratePct: 15, tax: 30000 },
    ])
    expect(r).toMatchObject({ grossTax: 60000, rebate: 15000, minimumTax: 5000, minimumApplied: false, tax: 45000 })
    expect(r.effectiveRatePct).toBe(5)
    // 3% of 9 lakh = 27,000 of rebate at most, earned by investing 27,000 ÷ 15% = 1,80,000.
    expect(r.investmentForFullRebate).toBe(180000)
  })
  it('hand-checked: a woman taxpayer with ১২ লাখ and no investment', () => {
    // 4,25,000 free; 3,00,000 × 10% + 4,00,000 × 15% + 75,000 × 20% = 30,000 + 60,000 + 15,000
    const r = calculateIncomeTax(base({ income: 1200000, category: 'womenOrSenior' }))
    expect(r.threshold).toBe(425000)
    expect(r.grossTax).toBe(105000)
    expect(r.tax).toBe(105000)
  })
  it('the rebate is the least of 3% of income, 15% of investment and the ৳১০ লাখ cap', () => {
    expect(calculateIncomeTax(base({ investment: 1000000 })).rebate).toBe(27000)
    const rich = calculateIncomeTax(base({ income: 50000000, investment: 100000000 }))
    expect(rich.rebate).toBe(1000000)
    // The rebate never turns the tax negative.
    expect(calculateIncomeTax(base({ income: 450000, investment: 1000000 })).rebate).toBe(5000)
  })
  it('applies the area minimum when the slab tax is smaller, and nothing at or below the limit', () => {
    const r = calculateIncomeTax(base({ income: 420000 }))
    expect(r).toMatchObject({ grossTax: 2000, tax: 5000, minimumApplied: true })
    expect(calculateIncomeTax(base({ income: 420000, area: 'rest' })).tax).toBe(3000)
    expect(calculateIncomeTax(base({ income: 400000 }))).toMatchObject({ tax: 0, minimumApplied: false })
    expect(calculateIncomeTax(base({ income: 0 })).tax).toBe(0)
  })
  it('raises the limit for each disabled dependant', () => {
    const r = calculateIncomeTax(base({ income: 450000, disabledDependents: 1 }))
    expect(r.threshold).toBe(450000)
    expect(r.tax).toBe(0)
  })
  it('freelancer mode takes exempt freelance income out first', () => {
    expect(calculateIncomeTax(base({ mode: 'freelancer' }))).toMatchObject({ exemptIncome: 900000, taxableIncome: 0, tax: 0 })
    // A salaried person with ৩ লাখ freelance on the side: 6 lakh taxable → 2,00,000 × 10%.
    const side = calculateIncomeTax(base({ freelanceIncome: 300000 }))
    expect(side).toMatchObject({ exemptIncome: 300000, taxableIncome: 600000, grossTax: 20000, tax: 20000 })
    // Paid in cash, outside the banking channel: no exemption.
    expect(calculateIncomeTax(base({ mode: 'freelancer', viaBankingChannel: false })).exemptIncome).toBe(0)
    // A capped or absent exemption.
    const capped = { ...RULES, freelance: { exemptPct: 100, exemptCap: 500000 } }
    expect(calculateIncomeTax(base({ mode: 'freelancer', rules: capped })).taxableIncome).toBe(400000)
    const none = { ...RULES, freelance: undefined }
    expect(calculateIncomeTax(base({ mode: 'freelancer', rules: none })).tax).toBe(60000)
  })
  it('handles a very large income through the open top slab', () => {
    // 30k + 60k + 1L + 5L, then 30% of (1 crore − 36 lakh) = 19.2 lakh
    expect(calculateIncomeTax(base({ income: 10000000 })).grossTax).toBe(2610000)
  })
  it('hand-checked with the earlier FY 2024-25 rules (Finance Act 2024): ১০ লাখ আয়, ২ লাখ বিনিয়োগ', () => {
    const fy2425: IncomeTaxRules = {
      ...RULES,
      incomeYear: '2024-25',
      thresholds: { general: 350000, womenOrSenior: 400000, disabled: 475000, freedomFighter: 500000 },
      slabs: [
        { width: 100000, ratePct: 5 },
        { width: 400000, ratePct: 10 },
        { width: 500000, ratePct: 15 },
        { width: 500000, ratePct: 20 },
        { width: 2000000, ratePct: 25 },
        { width: null, ratePct: 30 },
      ],
      freelance: undefined,
    }
    // 3,50,000 free; 1,00,000 × 5% + 4,00,000 × 10% + 1,50,000 × 15% = 5,000 + 40,000 + 22,500 = 67,500.
    // Rebate = least of 3% × 10,00,000 = 30,000, 15% × 2,00,000 = 30,000 and 10 lakh → 30,000. Tax 37,500.
    const r = calculateIncomeTax(base({ income: 1000000, investment: 200000, rules: fy2425 }))
    expect(r.rows.map((row) => [row.amount, row.tax])).toEqual([
      [350000, 0],
      [100000, 5000],
      [400000, 40000],
      [150000, 22500],
    ])
    expect(r).toMatchObject({ grossTax: 67500, rebate: 30000, tax: 37500, effectiveRatePct: 3.75 })
    // One taka over the limit: slab tax 0.05 is below the ৳৩,০০০ minimum outside the cities.
    expect(calculateIncomeTax(base({ income: 350001, area: 'rest', rules: fy2425 }))).toMatchObject({
      grossTax: 0.05,
      tax: 3000,
      minimumApplied: true,
    })
  })
  it('works out the investment for the full rebate without float noise', () => {
    // Slab tax 2,500.05 caps the rebate; 2,500.05 ÷ 15% = 16,667 exactly.
    const r = calculateIncomeTax(base({ income: 425000.5, area: 'rest' }))
    expect(r.grossTax).toBe(2500.05)
    expect(r.investmentForFullRebate).toBe(16667)
    expect(calculateIncomeTax(base({ rules: { ...RULES, rebate: { ...RULES.rebate, investmentPct: 0 } } })).investmentForFullRebate).toBe(0)
  })
  it('validates input and rules', () => {
    // Inherited object keys are not categories or areas.
    expect(validateIncomeTax(base({ category: 'toString' }))).toBe('category')
    expect(validateIncomeTax(base({ area: 'constructor' }))).toBe('area')
    expect(validateIncomeTax(base({ mode: 'retired' as 'salaried' }))).toBe('mode')
    expect(validateIncomeTax(base({ income: -1 }))).toBe('income')
    expect(validateIncomeTax(base({ freelanceIncome: 1000000 }))).toBe('freelanceIncome')
    expect(validateIncomeTax(base({ category: 'student' }))).toBe('category')
    expect(validateIncomeTax(base({ investment: Number.NaN }))).toBe('investment')
    expect(validateIncomeTax(base({ area: 'moon' }))).toBe('area')
    expect(validateIncomeTax(base({ disabledDependents: 1.5 }))).toBe('dependents')
    expect(validateIncomeTax(base({ rules: { ...RULES, slabs: [{ width: 300000, ratePct: 10 }] } }))).toBe('rules')
    expect(isValidIncomeTaxRules({ ...RULES, rebate: { incomePct: 3, investmentPct: 150, cap: 1 } })).toBe(false)
    expect(validateIncomeTax(base())).toBeNull()
  })
})
