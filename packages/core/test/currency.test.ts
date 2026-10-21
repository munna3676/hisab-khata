import { describe, expect, it } from 'vitest'
import { calculateCurrency, calculateCurrencyTable, validateCurrency, type CurrencyInput } from '../src/currency.ts'

// Sample rate sheet in the shape of data/finance/currency-rates.json, test-only (the screen's numbers).
const RATES = [
  { code: 'SAR', buy: 32.641, sell: 33.1 },
  { code: 'AED', buy: 33.353 },
  { code: 'USD', buy: 122.5, sell: 123.5 },
  { code: 'GBP', buy: 163.268 },
  { code: 'JPY', buy: 80.5, unit: 100 },
]

const figma: CurrencyInput = { amount: 1000, code: 'SAR', direction: 'toBdt', rates: RATES }

describe('currency', () => {
  it('matches the Figma example: ১,০০০ SAR → ৳৩২,৬৪১', () => {
    const r = calculateCurrency(figma)
    expect(r.result).toBe(32641)
    expect(r.rate).toBe(32.641)
  })
  it('matches the Figma table: ১,০০০ AED / USD / GBP', () => {
    const rows = calculateCurrencyTable(1000, RATES.filter((r) => ['AED', 'USD', 'GBP'].includes(r.code)))
    expect(rows.map((r) => r.bdt)).toEqual([33353, 122500, 163268])
  })
  it('taka to foreign uses the selling rate (hand-checked: ৳12,350 → 100 USD)', () => {
    const r = calculateCurrency({ ...figma, amount: 12350, code: 'USD', direction: 'fromBdt' })
    expect(r.result).toBe(100)
    expect(r.rate).toBe(123.5)
  })
  it('falls back to the buying rate when there is no selling rate', () => {
    expect(calculateCurrency({ ...figma, amount: 33353, code: 'AED', direction: 'fromBdt' }).result).toBe(1000)
  })
  it('reads rates quoted per 100 units', () => {
    expect(calculateCurrency({ ...figma, amount: 10000, code: 'JPY' }).result).toBe(8050)
  })
  it('applies spread and fee on the right side', () => {
    // 1% below 122.50 = 121.275; 100 USD → 12,127.50 − 50 fee
    const toBdt = calculateCurrency({ ...figma, amount: 100, code: 'USD', spreadPct: 1, feeBdt: 50 })
    expect(toBdt.rate).toBe(121.275)
    expect(toBdt.grossBdt).toBe(12127.5)
    expect(toBdt.result).toBe(12077.5)
    // 1% above 123.50 = 124.735; (12,523.50 − 50) / 124.735 = 100
    const fromBdt = calculateCurrency({ ...figma, amount: 12523.5, code: 'USD', direction: 'fromBdt', spreadPct: 1, feeBdt: 50 })
    expect(fromBdt.result).toBe(100)
  })
  it('handles a very large amount', () => {
    expect(calculateCurrency({ ...figma, amount: 1e9 }).result).toBe(32641000000)
  })
  it('validates input', () => {
    expect(validateCurrency({ ...figma, amount: 0 })).toBe('amount')
    expect(validateCurrency({ ...figma, code: 'XYZ' })).toBe('code')
    expect(validateCurrency({ ...figma, rates: [{ code: 'SAR', buy: 0 }] })).toBe('rates')
    expect(validateCurrency({ ...figma, spreadPct: 100 })).toBe('spread')
    expect(validateCurrency({ ...figma, feeBdt: -1 })).toBe('fee')
    expect(validateCurrency({ ...figma, amount: 1, feeBdt: 40 })).toBe('fee')
    expect(validateCurrency({ ...figma, direction: 'fromBdt', amount: 40, feeBdt: 40 })).toBe('fee')
    expect(validateCurrency(figma)).toBeNull()
  })
  it('round trip at one rate gives the amount back, checked by hand: 250 MYR at ২৬.২০ → ৳৬,৫৫০', () => {
    const rates = [{ code: 'MYR', buy: 26.2 }]
    expect(calculateCurrency({ amount: 250, code: 'MYR', direction: 'toBdt', rates }).result).toBe(6550)
    expect(calculateCurrency({ amount: 6550, code: 'MYR', direction: 'fromBdt', rates }).result).toBe(250)
  })
  it('spread on a per-100 quote, checked by hand: ¥10,000 at ৳80.50/100 less 2% → ৳7,889', () => {
    // 0.805 × 0.98 = 0.7889 taka per yen
    const r = calculateCurrency({ ...figma, amount: 10000, code: 'JPY', spreadPct: 2 })
    expect(r.rate).toBe(0.7889)
    expect(r.result).toBe(7889)
  })
  it('the table applies the spread and skips broken rows; an empty sheet gives an empty table', () => {
    const rows = calculateCurrencyTable(1000, [...RATES, { code: 'BAD', buy: 0 }], 1)
    expect(rows.map((r) => r.code)).toEqual(['SAR', 'AED', 'USD', 'GBP', 'JPY'])
    // 32.641 × 0.99 = 32.31459 → 1,000 SAR = 32,314.59
    expect(rows[0]).toEqual({ code: 'SAR', rate: 32.3146, bdt: 32314.59 })
    expect(calculateCurrencyTable(1000, [])).toEqual([])
  })
  it('rejects an unknown direction and an empty rate sheet', () => {
    expect(validateCurrency({ ...figma, direction: 'sideways' as never })).toBe('direction')
    expect(validateCurrency({ ...figma, rates: [] })).toBe('code')
    expect(validateCurrency({ ...figma, rates: [{ code: 'SAR', buy: 32.6, unit: 0 }] })).toBe('rates')
  })
  it('rejects non-finite rates (Infinity, NaN) in validation and in the table', () => {
    for (const bad of [{ buy: Infinity }, { buy: NaN }, { buy: 32.6, sell: Infinity }, { buy: 32.6, unit: Infinity }, { buy: 32.6, sell: NaN }]) {
      expect(validateCurrency({ ...figma, rates: [{ code: 'SAR', ...bad }] })).toBe('rates')
      expect(calculateCurrencyTable(1000, [{ code: 'SAR', ...bad }])).toEqual([])
    }
  })
})
