import { describe, expect, it } from 'vitest'
import {
  calculateDiscount,
  calculateDiscountPct,
  calculateOriginalPrice,
  calculatePercentChange,
  calculatePercentOf,
  calculateSuccessiveDiscount,
  calculateWhatPercent,
  validateDiscount,
  validateDiscountPct,
  validateOriginalPrice,
  validatePercentChange,
  validatePercentOf,
  validateSuccessiveDiscount,
  validateWhatPercent,
} from '../src/percentage.ts'

describe('discount', () => {
  it('matches the Figma example (C2): ৳২,৫০০, ২০% ছাড় → ৳২,০০০, বাঁচলো ৳৫০০', () => {
    expect(calculateDiscount({ price: 2500, discount: 20 })).toEqual({ finalPrice: 2000, saved: 500, discountPct: 20 })
  })
  it('takes a taka discount too', () => {
    expect(calculateDiscount({ price: 1200, discount: 150, type: 'amount' })).toEqual({
      finalPrice: 1050,
      saved: 150,
      discountPct: 12.5,
    })
  })
  it('handles zero and 100%', () => {
    expect(calculateDiscount({ price: 0, discount: 10 }).finalPrice).toBe(0)
    expect(calculateDiscount({ price: 0, discount: 0, type: 'amount' }).discountPct).toBe(0)
    expect(calculateDiscount({ price: 999, discount: 100 }).finalPrice).toBe(0)
  })
  it('finds the discount % from two prices and the price before a discount', () => {
    expect(calculateDiscountPct({ originalPrice: 2500, finalPrice: 2000 }).discountPct).toBe(20)
    expect(calculateOriginalPrice({ finalPrice: 2000, discountPct: 20 })).toBe(2500)
  })
  it('validates input', () => {
    expect(validateDiscount({ price: -1, discount: 10 })).toBe('price')
    expect(validateDiscount({ price: 100, discount: 101 })).toBe('discount')
    expect(validateDiscount({ price: 100, discount: 150, type: 'amount' })).toBe('discount')
    expect(validateDiscount({ price: 100, discount: 20 })).toBeNull()
    expect(validateDiscountPct({ originalPrice: 0, finalPrice: 0 })).toBe('originalPrice')
    expect(validateDiscountPct({ originalPrice: 100, finalPrice: 120 })).toBe('finalPrice')
    expect(validateOriginalPrice({ finalPrice: 100, discountPct: 100 })).toBe('discountPct')
    expect(validateOriginalPrice({ finalPrice: 100, discountPct: 25 })).toBeNull()
  })
})

describe('percent of', () => {
  it('matches the Figma example (C2 শতাংশ হিসাব): ৫,০০০ এর ১৫% = ৳৭৫০', () => {
    expect(calculatePercentOf({ value: 5000, pct: 15 })).toBe(750)
  })
  it('hand-checked: 12.5% of 840 = 105; 45 is 18% of 250', () => {
    expect(calculatePercentOf({ value: 840, pct: 12.5 })).toBe(105)
    expect(calculateWhatPercent({ part: 45, whole: 250 })).toBe(18)
  })
  it('validates input', () => {
    expect(validatePercentOf({ value: Number.NaN, pct: 1 })).toBe('value')
    expect(validatePercentOf({ value: 1, pct: Number.POSITIVE_INFINITY })).toBe('pct')
    expect(validatePercentOf({ value: 1e15, pct: 3 })).toBeNull()
    expect(validateWhatPercent({ part: 5, whole: 0 })).toBe('whole')
    expect(validateWhatPercent({ part: 5, whole: 20 })).toBeNull()
  })
})

describe('percent change', () => {
  it('hand-checked: চালের দাম ৳৬০ থেকে ৳৭২ → ২০% বাড়লো', () => {
    expect(calculatePercentChange({ from: 60, to: 72 })).toEqual({ change: 12, changePct: 20, direction: 'up' })
  })
  it('goes down and stays the same', () => {
    expect(calculatePercentChange({ from: 80, to: 60 })).toEqual({ change: -20, changePct: -25, direction: 'down' })
    expect(calculatePercentChange({ from: 80, to: 80 }).direction).toBe('same')
    expect(calculatePercentChange({ from: -100, to: -50 }).changePct).toBe(50)
  })
  it('validates input', () => {
    expect(validatePercentChange({ from: 0, to: 10 })).toBe('from')
    expect(validatePercentChange({ from: 10, to: Number.NaN })).toBe('to')
    expect(validatePercentChange({ from: 10, to: 0 })).toBeNull()
  })
})

describe('successive discounts', () => {
  it('hand-checked: 20% then 10% on ৳1,000 = ৳720, effectively 28%', () => {
    const r = calculateSuccessiveDiscount({ price: 1000, discountsPct: [20, 10] })
    expect(r.finalPrice).toBe(720)
    expect(r.saved).toBe(280)
    expect(r.effectivePct).toBe(28)
    expect(r.steps).toEqual([
      { discountPct: 20, saved: 200, priceAfter: 800 },
      { discountPct: 10, saved: 80, priceAfter: 720 },
    ])
  })
  it('a single discount equals the plain discount', () => {
    expect(calculateSuccessiveDiscount({ price: 2500, discountsPct: [20] }).finalPrice).toBe(2000)
  })
  it('validates input', () => {
    expect(validateSuccessiveDiscount({ price: -5, discountsPct: [10] })).toBe('price')
    expect(validateSuccessiveDiscount({ price: 100, discountsPct: [] })).toBe('discounts')
    expect(validateSuccessiveDiscount({ price: 100, discountsPct: [10, 120] })).toBe('discounts')
    expect(validateSuccessiveDiscount({ price: 100, discountsPct: [10, 5] })).toBeNull()
  })
})
