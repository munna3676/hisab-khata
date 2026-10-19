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
  it('hand-checked: কেনা ৳650, বেচা ৳845 → লাভ ৳195, margin 195 ÷ 845 = 23.08%, markup 195 ÷ 650 = 30%', () => {
    expect(calculateProfitMargin({ cost: 650, sellingPrice: 845 })).toEqual({ profit: 195, marginPct: 23.08, markupPct: 30 })
  })
  it('handles paisa prices and selling at cost', () => {
    expect(calculateProfitMargin({ cost: 800.05, sellingPrice: 1000.1 })).toMatchObject({ profit: 200.05 })
    expect(calculateProfitMargin({ cost: 500, sellingPrice: 500 })).toEqual({ profit: 0, marginPct: 0, markupPct: 0 })
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
  it('hand-checked: 40% margin on ৳1,200 = 1,200 ÷ 0.6 = ৳2,000, a 66.67% markup', () => {
    expect(calculatePriceFromMargin({ cost: 1200, pct: 40 })).toEqual({ sellingPrice: 2000, profit: 800, marginPct: 40, markupPct: 66.67 })
    expect(marginToMarkup(40)).toBe(66.67)
    expect(markupToMargin(100)).toBe(50)
  })
  it('reads the margin off a markup even at zero cost: 30% markup is 30 ÷ 130 = 23.08% margin', () => {
    expect(calculatePriceFromMargin({ cost: 0, pct: 30, basis: 'markup' })).toEqual({ sellingPrice: 0, profit: 0, marginPct: 23.08, markupPct: null })
    expect(calculatePriceFromMargin({ cost: 0, pct: 30 }).marginPct).toBe(30)
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
  it('hand-checked: ৳12,000 fixed, ৳150 price, ৳90 cost → 12,000 ÷ 60 = 200 units; +৳3,000 target → 250', () => {
    const r = calculateBreakEven({ fixedCosts: 12000, pricePerUnit: 150, variableCostPerUnit: 90 })
    expect(r).toEqual({ contributionPerUnit: 60, contributionPct: 40, units: 200, unitsExact: 200, revenue: 30000 })
    expect(calculateBreakEven({ fixedCosts: 12000, pricePerUnit: 150, variableCostPerUnit: 90, targetProfit: 3000 }).units).toBe(250)
  })
  it('does not round float noise up a whole unit: 0.3 ÷ (0.3 − 0.2) is 3, not 4', () => {
    expect(calculateBreakEven({ fixedCosts: 0.3, pricePerUnit: 0.3, variableCostPerUnit: 0.2 }).units).toBe(3)
    expect(calculateBreakEven({ fixedCosts: 1, pricePerUnit: 0.3, variableCostPerUnit: 0.1 }).units).toBe(5)
  })
  it('keeps the fraction of a huge count: 10¹³ ÷ 3 = 3,333,333,333,333.33 → 3,333,333,333,334 units', () => {
    expect(calculateBreakEven({ fixedCosts: 1e13, pricePerUnit: 4, variableCostPerUnit: 1 }).units).toBe(3333333333334)
  })
  it('rejects NaN and infinity', () => {
    expect(validateBreakEven({ fixedCosts: 100, pricePerUnit: 10, variableCostPerUnit: Number.NaN })).toBe('variableCostPerUnit')
    expect(validateBreakEven({ fixedCosts: Number.POSITIVE_INFINITY, pricePerUnit: 10, variableCostPerUnit: 1 })).toBe('fixedCosts')
    expect(validateProfitMargin({ cost: 10, sellingPrice: Number.POSITIVE_INFINITY })).toBe('sellingPrice')
    expect(validatePriceFromMargin({ cost: 800, pct: Number.POSITIVE_INFINITY, basis: 'markup' })).toBe('pct')
    expect(validatePriceFromMargin({ cost: 800, pct: -1 })).toBe('pct')
  })
  it('validates input', () => {
    expect(validateBreakEven({ fixedCosts: -1, pricePerUnit: 10, variableCostPerUnit: 5 })).toBe('fixedCosts')
    expect(validateBreakEven({ fixedCosts: 100, pricePerUnit: 0, variableCostPerUnit: 0 })).toBe('pricePerUnit')
    expect(validateBreakEven({ fixedCosts: 100, pricePerUnit: 10, variableCostPerUnit: 10 })).toBe('variableCostPerUnit')
    expect(validateBreakEven({ fixedCosts: 100, pricePerUnit: 10, variableCostPerUnit: 5, targetProfit: -1 })).toBe('targetProfit')
    expect(validateBreakEven({ fixedCosts: 100, pricePerUnit: 10, variableCostPerUnit: 5 })).toBeNull()
  })
})
