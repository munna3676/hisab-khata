import { describe, expect, it } from 'vitest'
import { calculateVat, validateVat } from '../src/vat.ts'

describe('vat', () => {
  it('matches the Figma example (C1): ৳১,০০০ + ১৫% VAT → ৳১,১৫০', () => {
    const r = calculateVat({ amount: 1000, ratePct: 15, mode: 'add' })
    expect(r).toMatchObject({ base: 1000, sd: 0, vat: 150, total: 1150 })
  })
  it('matches the Figma example (C4-b, VAT বাদ দাও): ৳১,১৫০ ÷ ১.১৫ → ৳১,০০০', () => {
    const r = calculateVat({ amount: 1150, ratePct: 15, mode: 'remove' })
    expect(r).toMatchObject({ base: 1000, vat: 150, total: 1150, divisor: 1.15 })
  })
  it('adds SD before VAT, hand-checked: 10,000 + 20% SD = 12,000, VAT 15% of 12,000 = 1,800', () => {
    const r = calculateVat({ amount: 10000, ratePct: 15, mode: 'add', sdPct: 20 })
    expect(r).toMatchObject({ base: 10000, sd: 2000, vatBase: 12000, vat: 1800, total: 13800 })
  })
  it('removes SD and VAT back to the same base', () => {
    const r = calculateVat({ amount: 13800, ratePct: 15, mode: 'remove', sdPct: 20 })
    expect(r).toMatchObject({ base: 10000, sd: 2000, vat: 1800, divisor: 1.38 })
  })
  it('parts always add up to the total when removing an odd amount', () => {
    for (const amount of [999.99, 1, 0.07, 123456.78]) {
      for (const ratePct of [5, 7.5, 10, 15]) {
        const r = calculateVat({ amount, ratePct, mode: 'remove', sdPct: 10 })
        expect(Math.round((r.base + r.sd + r.vat) * 100)).toBe(Math.round(amount * 100))
      }
    }
  })
  it('handles reduced rates, zero and very large amounts', () => {
    expect(calculateVat({ amount: 200, ratePct: 7.5, mode: 'add' }).vat).toBe(15)
    expect(calculateVat({ amount: 0, ratePct: 15, mode: 'add' }).total).toBe(0)
    expect(calculateVat({ amount: 500, ratePct: 0, mode: 'remove' }).base).toBe(500)
    expect(calculateVat({ amount: 1e12, ratePct: 15, mode: 'add' }).total).toBe(1.15e12)
  })
  it('validates input', () => {
    expect(validateVat({ amount: -1, ratePct: 15, mode: 'add' })).toBe('amount')
    expect(validateVat({ amount: Number.NaN, ratePct: 15, mode: 'add' })).toBe('amount')
    expect(validateVat({ amount: 100, ratePct: 101, mode: 'add' })).toBe('rate')
    expect(validateVat({ amount: 100, ratePct: 15, mode: 'add', sdPct: -5 })).toBe('sd')
    expect(validateVat({ amount: 100, ratePct: 15, mode: 'remove', sdPct: 20 })).toBeNull()
  })
})
