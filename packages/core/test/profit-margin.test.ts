import { describe, expect, it } from 'vitest'
import {
  calculateBreakEven,
  calculatePriceFromMargin,
  calculateProfitMargin,
  marginToMarkup,
  markupToMargin,
  validateBreakEven,
  validatePriceFromMargin,
  validateProfitMargin,
} from '../src/profit-margin.ts'

describe('profit margin', () => {
  it('matches the Figma example (C3): কেনা ৳৮০০, বেচা ৳১,০০০ → লাভ ৳২০০, মার্জিন ২০%, মার্কআপ ২৫%', () => {
    expect(calculateProfitMargin({ cost: 800, sellingPrice: 1000 })).toEqual({ profit: 200, marginPct: 20, markupPct: 25 })
  })
  it('shows a loss as negative', () => {
    expect(calculateProfitMargin({ cost: 1200, sellingPrice: 1000 })).toEqual({ profit: -200, marginPct: -20, markupPct: -16.67 })
  })
  it('has no markup when the cost is zero', () => {
    expect(calculateProfitMargin({ cost: 0, sellingPrice: 50 })).toEqual({ profit: 50, marginPct: 100, markupPct: null })
  })
  it('validates input', () => {
    expect(validateProfitMargin({ cost: -1, sellingPrice: 10 })).toBe('cost')
    expect(validateProfitMargin({ cost: 10, sellingPrice: 0 })).toBe('sellingPrice')
    expect(validateProfitMargin({ cost: 10, sellingPrice: 12 })).toBeNull()
  })
})

describe('price from target margin', () => {
  it('matches the Figma example (C3 টার্গেট মার্জিন): কেনা ৳৮০০, ৩০% মার্জিন → বেচতে হবে ৳১,১৪৩', () => {
    const r = calculatePriceFromMargin({ cost: 800, pct: 30 })
    expect(r.sellingPrice).toBe(1142.86)
    expect(Math.round(r.sellingPrice)).toBe(1143)
    expect(r.marginPct).toBe(30)
  })
  it('hand-checked: 25% markup on ৳800 = ৳1,000, which is a 20% margin', () => {
    expect(calculatePriceFromMargin({ cost: 800, pct: 25, basis: 'markup' })).toEqual({
      sellingPrice: 1000,
      profit: 200,
      marginPct: 20,
      markupPct: 25,
    })
  })
  it('converts margin and markup both ways', () => {
    expect(marginToMarkup(20)).toBe(25)
    expect(markupToMargin(25)).toBe(20)
    expect(marginToMarkup(50)).toBe(100)
  })
  it('validates input', () => {
    expect(validatePriceFromMargin({ cost: 800, pct: 100 })).toBe('pct')
    expect(validatePriceFromMargin({ cost: 800, pct: 150, basis: 'markup' })).toBeNull()
    expect(validatePriceFromMargin({ cost: -800, pct: 10 })).toBe('cost')
  })
})

describe('break-even', () => {
  it('hand-checked: ৳50,000 fixed, sell at ৳1,000, cost ৳400 → 83.33, so 84 units', () => {
    const r = calculateBreakEven({ fixedCosts: 50000, pricePerUnit: 1000, variableCostPerUnit: 400 })
    expect(r).toEqual({ contributionPerUnit: 600, contributionPct: 60, units: 84, unitsExact: 83.33, revenue: 84000 })
  })
  it('adds a target profit and does not round up an exact answer', () => {
    const r = calculateBreakEven({ fixedCosts: 30000, pricePerUnit: 500, variableCostPerUnit: 200, targetProfit: 15000 })
    expect(r.units).toBe(150)
    expect(calculateBreakEven({ fixedCosts: 0, pricePerUnit: 10, variableCostPerUnit: 0 }).units).toBe(0)
  })
  it('validates input', () => {
    expect(validateBreakEven({ fixedCosts: -1, pricePerUnit: 10, variableCostPerUnit: 5 })).toBe('fixedCosts')
    expect(validateBreakEven({ fixedCosts: 100, pricePerUnit: 0, variableCostPerUnit: 0 })).toBe('pricePerUnit')
    expect(validateBreakEven({ fixedCosts: 100, pricePerUnit: 10, variableCostPerUnit: 10 })).toBe('variableCostPerUnit')
    expect(validateBreakEven({ fixedCosts: 100, pricePerUnit: 10, variableCostPerUnit: 5, targetProfit: -1 })).toBe('targetProfit')
    expect(validateBreakEven({ fixedCosts: 100, pricePerUnit: 10, variableCostPerUnit: 5 })).toBeNull()
  })
})
