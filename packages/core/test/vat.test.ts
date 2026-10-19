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
  it('hand-checked with the tax fraction rate ÷ (100 + rate): 2,300 × 15/115 = 300; 1,075 × 7.5/107.5 = 75', () => {
    expect(calculateVat({ amount: 2300, ratePct: 15, mode: 'remove' })).toMatchObject({ base: 2000, vat: 300 })
    expect(calculateVat({ amount: 1075, ratePct: 7.5, mode: 'remove' })).toMatchObject({ base: 1000, vat: 75 })
    expect(calculateVat({ amount: 1000, ratePct: 5, mode: 'add' }).total).toBe(1050)
  })
  it('hand-checked SD 25%: 5,000 + 1,250 SD = 6,250; VAT 15% = 937.50; total 7,187.50; divisor 1.25 × 1.15 = 1.4375', () => {
    const add = calculateVat({ amount: 5000, ratePct: 15, mode: 'add', sdPct: 25 })
    expect(add).toMatchObject({ sd: 1250, vatBase: 6250, vat: 937.5, total: 7187.5, divisor: 1.4375 })
    expect(calculateVat({ amount: 7187.5, ratePct: 15, mode: 'remove', sdPct: 25 })).toMatchObject({ base: 5000, sd: 1250, vat: 937.5 })
  })
  it('rounds VAT to the paisa both ways: 99.99 + 14.9985 → 15.00 → 114.99, and back', () => {
    expect(calculateVat({ amount: 99.99, ratePct: 15, mode: 'add' })).toMatchObject({ vat: 15, total: 114.99 })
    expect(calculateVat({ amount: 114.99, ratePct: 15, mode: 'remove' })).toMatchObject({ vat: 15, base: 99.99 })
  })
  it('adding then removing gives back the same price for every paisa amount tried', () => {
    for (let paisa = 1; paisa < 50000; paisa += 37) {
      for (const [ratePct, sdPct] of [[15, 0], [7.5, 0], [5, 10], [15, 20], [15, 65]] as const) {
        const added = calculateVat({ amount: paisa / 100, ratePct, mode: 'add', sdPct })
        const removed = calculateVat({ amount: added.total, ratePct, mode: 'remove', sdPct })
        expect([removed.base, removed.sd, removed.vat]).toEqual([added.base, added.sd, added.vat])
      }
    }
  })
  it('handles a zero rate with SD and a price too small for any VAT', () => {
    expect(calculateVat({ amount: 100, ratePct: 0, mode: 'add', sdPct: 10 })).toMatchObject({ sd: 10, vat: 0, total: 110, divisor: 1.1 })
    expect(calculateVat({ amount: 0.01, ratePct: 15, mode: 'remove' })).toMatchObject({ base: 0.01, vat: 0 })
    expect(calculateVat({ amount: 0, ratePct: 15, mode: 'remove', sdPct: 20 })).toMatchObject({ base: 0, sd: 0, vat: 0 })
  })
  it('rejects NaN and infinity, accepts zero', () => {
    expect(validateVat({ amount: Number.POSITIVE_INFINITY, ratePct: 15, mode: 'add' })).toBe('amount')
    expect(validateVat({ amount: 100, ratePct: Number.NaN, mode: 'add' })).toBe('rate')
    expect(validateVat({ amount: 100, ratePct: 15, mode: 'add', sdPct: Number.NaN })).toBe('sd')
    expect(validateVat({ amount: 0, ratePct: 0, mode: 'remove' })).toBeNull()
  })
  it('validates input', () => {
    expect(validateVat({ amount: -1, ratePct: 15, mode: 'add' })).toBe('amount')
    expect(validateVat({ amount: Number.NaN, ratePct: 15, mode: 'add' })).toBe('amount')
    expect(validateVat({ amount: 100, ratePct: 101, mode: 'add' })).toBe('rate')
    expect(validateVat({ amount: 100, ratePct: 15, mode: 'add', sdPct: -5 })).toBe('sd')
    expect(validateVat({ amount: 100, ratePct: 15, mode: 'remove', sdPct: 20 })).toBeNull()
  })
})
