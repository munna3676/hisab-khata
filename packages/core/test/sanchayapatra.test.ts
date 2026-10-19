import { describe, expect, it } from 'vitest'
import { calculateSanchayapatra, validateSanchayapatra, type SanchayapatraScheme } from '../src/sanchayapatra.ts'

// Sample schemes in the shape of data/finance/sanchayapatra.json, test-only. Rates are the
// screen's (জুন ২০২৬); tax is the NBR rule of 5% up to 5 lakh total holding, 10% above.
const TAX = [
  { upTo: 500000, taxPct: 5 },
  { upTo: null, taxPct: 10 },
]
const paribar: SanchayapatraScheme = {
  id: 'paribar',
  years: 5,
  payout: 'monthly',
  rateSlabs: [
    { upTo: 750000, ratePct: 11.93 },
    { upTo: null, ratePct: 11.8 },
  ],
  taxSlabs: TAX,
  minInvestment: 10000,
  maxInvestment: 4500000,
}
const threeMonth: SanchayapatraScheme = { ...paribar, id: 'three-month', years: 3, payout: 'quarterly' }
const fiveYear: SanchayapatraScheme = { ...paribar, id: 'bangladesh-5y', payout: 'maturity' }

describe('sanchayapatra', () => {
  it('matches the Figma example: পরিবার, ৫ লাখ, ১১.৯৩%, ১০% কর → মাসে ৳৪,৯৭১, হাতে ৳৪,৪৭৪', () => {
    // The screen applies the proposed flat 10% (Finance Bill 2026).
    const r = calculateSanchayapatra({ scheme: { ...paribar, taxSlabs: [{ upTo: null, taxPct: 10 }] }, investment: 500000 })
    expect(r.ratePct).toBe(11.93)
    expect(Math.round(r.profitPerPayout)).toBe(4971)
    expect(Math.round(r.netPerPayout)).toBe(4474)
    expect(r.payouts).toBe(60)
  })
  it('matches a hand-checked value: 1 lakh, 11.93%, monthly → 994.17, 5% tax → 944.46', () => {
    const r = calculateSanchayapatra({ scheme: paribar, investment: 100000 })
    expect(r.profitPerPayout).toBe(994.17)
    expect(r.taxPerPayout).toBe(49.71)
    expect(r.netPerPayout).toBe(944.46)
    expect(r.totalNet).toBe(56667.6)
  })
  it('the whole amount takes the rate and tax of the slab its total holding falls in', () => {
    const r = calculateSanchayapatra({ scheme: paribar, investment: 800000 })
    expect(r.ratePct).toBe(11.8)
    expect(r.taxPct).toBe(10)
    // Existing holdings push a small purchase into the higher slab.
    const small = calculateSanchayapatra({ scheme: paribar, investment: 100000, existingHolding: 700000 })
    expect(small.ratePct).toBe(11.8)
    expect(small.taxPct).toBe(10)
  })
  it('pays every 3 months for the 3-month scheme', () => {
    const r = calculateSanchayapatra({ scheme: threeMonth, investment: 200000 })
    expect(r.payouts).toBe(12)
    expect(r.profitPerPayout).toBe(5965)
    expect(r.maturityAmount).toBe(200000)
  })
  it('pays simple profit at maturity for the 5-year scheme', () => {
    // 1,00,000 × 11.93% × 5 = 59,650; 5% tax = 2,982.50
    const r = calculateSanchayapatra({ scheme: fiveYear, investment: 100000 })
    expect(r.payouts).toBe(1)
    expect(r.totalProfit).toBe(59650)
    expect(r.totalTax).toBe(2982.5)
    expect(r.maturityAmount).toBe(156667.5)
  })
  it('handles a zero-tax slab (pensioner up to 5 lakh)', () => {
    const pensioner = { ...threeMonth, taxSlabs: [{ upTo: 500000, taxPct: 0 }, ...TAX.slice(1)] }
    expect(calculateSanchayapatra({ scheme: pensioner, investment: 500000 }).totalTax).toBe(0)
  })
  it('validates input', () => {
    expect(validateSanchayapatra({ scheme: paribar, investment: 0 })).toBe('investment')
    expect(validateSanchayapatra({ scheme: paribar, investment: 5000 })).toBe('investment')
    expect(validateSanchayapatra({ scheme: paribar, investment: 5000000 })).toBe('investment')
    expect(validateSanchayapatra({ scheme: paribar, investment: 100000, existingHolding: -1 })).toBe('holding')
    expect(validateSanchayapatra({ scheme: { ...paribar, rateSlabs: [] }, investment: 100000 })).toBe('scheme')
    expect(validateSanchayapatra({ scheme: { ...paribar, taxSlabs: [{ upTo: 100, taxPct: 5 }] }, investment: 100000 })).toBe('scheme')
    expect(validateSanchayapatra({ scheme: { ...paribar, years: 0 }, investment: 100000 })).toBe('scheme')
    expect(validateSanchayapatra({ scheme: paribar, investment: 500000 })).toBeNull()
  })
  it('matches the published per-lakh figure: পরিবার ১১.৫২% → মাসে ৳৯৬০, ১০% কর কেটে ৳৮৬৪', () => {
    // Prothom Alo on পরিবার সঞ্চয়পত্র at 11.52%: ১ লাখে মাসে ৯৬০ টাকা (1,00,000 × 11.52% ÷ 12)
    const old: SanchayapatraScheme = { ...paribar, rateSlabs: [{ upTo: null, ratePct: 11.52 }], taxSlabs: [{ upTo: null, taxPct: 10 }] }
    const r = calculateSanchayapatra({ scheme: old, investment: 100000 })
    expect([r.profitPerPayout, r.taxPerPayout, r.netPerPayout]).toEqual([960, 96, 864])
    expect(r.totalNet).toBe(51840)
  })
  it('the Figma amount under the NBR 5% rule: ৫ লাখ → হাতে ৳৪,৭২২.২৯, checked by hand', () => {
    // 5,00,000 × 11.93% ÷ 12 = 4,970.83; total holding is exactly 5 lakh, so 5% = 248.54
    const r = calculateSanchayapatra({ scheme: paribar, investment: 500000 })
    expect([r.profitPerPayout, r.taxPct, r.taxPerPayout, r.netPerPayout]).toEqual([4970.83, 5, 248.54, 4722.29])
  })
  it('slab limits belong to their own row: ৫,০০,০০০ pays 5%, one taka more 10%; ৭,৫০,০০০ keeps 11.93%', () => {
    expect(calculateSanchayapatra({ scheme: paribar, investment: 500001 }).taxPct).toBe(10)
    expect(calculateSanchayapatra({ scheme: paribar, investment: 750000 }).ratePct).toBe(11.93)
    expect(calculateSanchayapatra({ scheme: paribar, investment: 750001 }).ratePct).toBe(11.8)
  })
  it('pensioner pays every 3 months for 5 years: 20 payments', () => {
    const pensioner: SanchayapatraScheme = { ...paribar, id: 'pensioner', payout: 'quarterly' }
    // 1,00,000 × 11.93% ÷ 4 = 2,982.50 a quarter
    const r = calculateSanchayapatra({ scheme: pensioner, investment: 100000 })
    expect(r.payouts).toBe(20)
    expect(r.profitPerPayout).toBe(2982.5)
    expect(r.totalProfit).toBe(59650)
  })
  it('rejects prototype names as a payout and broken slab rows', () => {
    expect(validateSanchayapatra({ scheme: { ...paribar, payout: 'toString' as never }, investment: 100000 })).toBe('scheme')
    expect(validateSanchayapatra({ scheme: { ...paribar, years: 1.5 }, investment: 100000 })).toBe('scheme')
    expect(validateSanchayapatra({ scheme: { ...paribar, rateSlabs: [{ upTo: null, ratePct: NaN }] }, investment: 100000 })).toBe('scheme')
    expect(validateSanchayapatra({ scheme: paribar, investment: NaN })).toBe('investment')
  })
})
