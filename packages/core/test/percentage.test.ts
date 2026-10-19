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
  it('hand-checked: ৳1,499 at 15% off = ৳224.85 saved, pay ৳1,274.15; paid ৳1,700 after 15% → was ৳2,000', () => {
    expect(calculateDiscount({ price: 1499, discount: 15 })).toEqual({ finalPrice: 1274.15, saved: 224.85, discountPct: 15 })
    expect(calculateOriginalPrice({ finalPrice: 1700, discountPct: 15 })).toBe(2000)
    expect(calculateDiscountPct({ originalPrice: 1499, finalPrice: 1274.15 }).discountPct).toBe(15)
  })
  it('rejects NaN and infinity', () => {
    expect(validateDiscount({ price: Number.POSITIVE_INFINITY, discount: 10 })).toBe('price')
    expect(validateDiscount({ price: 100, discount: Number.NaN })).toBe('discount')
    expect(validateDiscountPct({ originalPrice: 100, finalPrice: Number.NaN })).toBe('finalPrice')
    expect(validateOriginalPrice({ finalPrice: Number.NaN, discountPct: 10 })).toBe('finalPrice')
    expect(validateDiscount({ price: 100, discount: 100, type: 'amount' })).toBeNull()
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
  it('hand-checked: 1 is 33.33% of 3; 0% of anything is 0; a negative number works', () => {
    expect(calculateWhatPercent({ part: 1, whole: 3 })).toBe(33.33)
    expect(calculatePercentOf({ value: 98765, pct: 0 })).toBe(0)
    expect(calculatePercentOf({ value: -2000, pct: 7.5 })).toBe(-150)
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
  it('hand-checked: ৳0.10 → ৳0.30 is +200% with no float noise; ৳1,500 → ৳0 is −100%', () => {
    expect(calculatePercentChange({ from: 0.1, to: 0.3 })).toEqual({ change: 0.2, changePct: 200, direction: 'up' })
    expect(calculatePercentChange({ from: 1500, to: 0 })).toEqual({ change: -1500, changePct: -100, direction: 'down' })
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
  it('textbook: 10% then 10% is 19%, not 20% (৳500 → ৳450 → ৳405)', () => {
    const r = calculateSuccessiveDiscount({ price: 500, discountsPct: [10, 10] })
    expect(r).toMatchObject({ finalPrice: 405, saved: 95, effectivePct: 19 })
  })
  it('hand-checked: each row takes its percent off the printed price before it, so the table adds up', () => {
    // 2,008.97 × 44.9% = 902.03 → 1,106.94; × 24.5% = 271.20 → 835.74; × 25.5% = 213.11 → 622.63; × 20.7% = 128.88 → 493.75
    const r = calculateSuccessiveDiscount({ price: 2008.97, discountsPct: [44.9, 24.5, 25.5, 20.7] })
    expect(r.steps.map((s) => [s.saved, s.priceAfter])).toEqual([
      [902.03, 1106.94],
      [271.2, 835.74],
      [213.11, 622.63],
      [128.88, 493.75],
    ])
    expect(r.finalPrice).toBe(493.75)
    expect(r.saved).toBe(1515.22)
    // 1 − 0.551 × 0.755 × 0.745 × 0.793 = 75.42%
    expect(r.effectivePct).toBe(75.42)
  })
  it('the rows always add up for random prices and discounts', () => {
    let seed = 7
    const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    for (let t = 0; t < 2000; t++) {
      const price = Math.round(next() * 1e6) / 100
      const discountsPct = [1, 2, 3].map(() => Math.round(next() * 500) / 10)
      const r = calculateSuccessiveDiscount({ price, discountsPct })
      let before = price
      for (const step of r.steps) {
        expect(Math.round((before - step.saved) * 100)).toBe(Math.round(step.priceAfter * 100))
        before = step.priceAfter
      }
      expect(Math.round(r.steps.reduce((s, step) => s + step.saved, 0) * 100)).toBe(Math.round(r.saved * 100))
    }
  })
  it('100% first leaves nothing for the next discount', () => {
    expect(calculateSuccessiveDiscount({ price: 800, discountsPct: [100, 10] })).toMatchObject({ finalPrice: 0, saved: 800, effectivePct: 100 })
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
