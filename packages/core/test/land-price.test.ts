import { describe, expect, it } from 'vitest'
import { LAND_CONVENTIONS } from '../src/land.ts'
import { calculateLandPrice, validateLandPrice, type LandCostRule } from '../src/land-price.ts'

describe('land-price', () => {
  it('matches the Figma example (L2): ৫ কাঠা × ৳২৫,০০,০০০ = ৳১,২৫,০০,০০০', () => {
    const r = calculateLandPrice({ area: 5, areaUnit: 'katha', price: 2500000, priceUnit: 'katha' })
    expect(r.total).toBe(12500000)
    expect(r.pricePer.katha).toBe(2500000)
    expect(Math.round(r.pricePer.sqft)).toBe(3472)
    // Exact at 720 sq ft a কাঠা. The screen's ৳১৫,১৫,১৫২ divides by the rounded 1.65 শতাংশ instead.
    expect(r.pricePer.decimal).toBe(1512500)
    expect(r.grandTotal).toBe(12500000)
  })
  it('converts across units, hand-checked: ১০ শতাংশ at ৳৫ লাখ/শতাংশ = ৳৫০ লাখ, ৳১,১৪৭.৮৪/বর্গফুট', () => {
    const r = calculateLandPrice({ area: 10, areaUnit: 'decimal', price: 500000, priceUnit: 'decimal' })
    expect(r.total).toBe(5000000)
    expect(r.pricePer.sqft).toBe(1147.84)
    expect(r.pricePer.acre).toBe(50000000)
  })
  it('adds registration costs on the deed value (example rates, not official)', () => {
    const costs: LandCostRule[] = [
      { id: 'stamp', pct: 1.5 },
      { id: 'registration', pct: 1 },
      { id: 'local-govt', pct: 3 },
      { id: 'mutation', fixed: 1170 },
    ]
    const r = calculateLandPrice({ area: 10, areaUnit: 'decimal', price: 500000, priceUnit: 'decimal', costs })
    expect(r.costs).toEqual([
      { id: 'stamp', amount: 75000 },
      { id: 'registration', amount: 50000 },
      { id: 'local-govt', amount: 150000 },
      { id: 'mutation', amount: 1170 },
    ])
    expect(r.totalCost).toBe(276170)
    expect(r.grandTotal).toBe(5276170)
  })
  it('takes the higher of a percent and a per-কাঠা amount when combine is max', () => {
    const sourceTax: LandCostRule = { id: 'source-tax', pct: 8, perUnit: 2000000, perUnitOf: 'katha', combine: 'max' }
    const r = calculateLandPrice({ area: 5, areaUnit: 'katha', price: 2500000, priceUnit: 'katha', costs: [sourceTax] })
    expect(r.costs[0]!.amount).toBe(10000000)
    const costs = [{ ...sourceTax, perUnit: 100000 }]
    const cheap = calculateLandPrice({ area: 5, areaUnit: 'katha', price: 2500000, priceUnit: 'katha', costs })
    expect(cheap.costs[0]!.amount).toBe(1000000)
  })
  it('never takes the deed value below the মৌজা rate', () => {
    const r = calculateLandPrice({
      area: 10,
      areaUnit: 'decimal',
      price: 100000,
      priceUnit: 'decimal',
      mouzaRate: { price: 300000, unit: 'decimal' },
      costs: [{ id: 'stamp', pct: 1.5 }],
    })
    expect(r.total).toBe(1000000)
    expect(r.deedValue).toBe(3000000)
    expect(r.costs[0]!.amount).toBe(45000)
    const declared = calculateLandPrice({
      area: 10,
      areaUnit: 'decimal',
      price: 100000,
      priceUnit: 'decimal',
      deedValue: 800000,
    })
    expect(declared.deedValue).toBe(800000)
  })
  it('handles a zero price and a very large area', () => {
    expect(calculateLandPrice({ area: 3, areaUnit: 'bigha', price: 0, priceUnit: 'katha' }).total).toBe(0)
    expect(calculateLandPrice({ area: 1000, areaUnit: 'acre', price: 1e7, priceUnit: 'decimal' }).total).toBe(1e12)
  })
  it('validates input', () => {
    const ok = { area: 5, areaUnit: 'katha', price: 2500000, priceUnit: 'katha' } as const
    expect(validateLandPrice({ ...ok, area: 0 })).toBe('area')
    expect(validateLandPrice({ ...ok, areaUnit: 'x' as never })).toBe('areaUnit')
    expect(validateLandPrice({ ...ok, price: -1 })).toBe('price')
    expect(validateLandPrice({ ...ok, priceUnit: 'x' as never })).toBe('priceUnit')
    expect(validateLandPrice({ ...ok, convention: { kathaPerBigha: -20 } })).toBe('convention')
    expect(validateLandPrice({ ...ok, costs: [{ id: 'stamp' }] })).toBe('costs')
    expect(validateLandPrice({ ...ok, costs: [{ id: 'stamp', pct: 120 }] })).toBe('costs')
    expect(validateLandPrice({ ...ok, costs: [{ id: 'tax', perUnit: 10 }] })).toBe('costs')
    expect(validateLandPrice({ ...ok, deedValue: -5 })).toBe('deedValue')
    expect(validateLandPrice({ ...ok, mouzaRate: { price: 1, unit: 'x' as never } })).toBe('mouzaRate')
    expect(validateLandPrice(ok)).toBeNull()
  })
})

describe('land-price (independent checks)', () => {
  it('hand-checked: ১ বিঘা at ৳১ কোটি → ৳৫ লাখ/কাঠা, ৳৩,০২,৫০০/শতাংশ, ৳৬৯৪.৪৪/বর্গফুট', () => {
    // 1,00,00,000 ÷ 20 = 5,00,000; × 435.6 ÷ 14,400 = 3,02,500; ÷ 14,400 = 694.44; × 3.025 = 3,02,50,000.
    const r = calculateLandPrice({ area: 1, areaUnit: 'bigha', price: 1e7, priceUnit: 'bigha' })
    expect(r.pricePer).toMatchObject({ katha: 500000, decimal: 302500, sqft: 694.44, acre: 30250000 })
  })
  it('hand-checked across units: ২ বিঘা at ৳২ লাখ/শতাংশ = ৬৬.১১৫৭ শতাংশ × ২ লাখ = ৳১,৩২,২৩,১৪০.৫০', () => {
    const r = calculateLandPrice({ area: 2, areaUnit: 'bigha', price: 200000, priceUnit: 'decimal' })
    expect(r.total).toBe(13223140.5)
    expect(r.sqft).toBe(28800)
  })
  it('prices a regional কানি: ১ কানি (৪০ শতক) at ৳৪০ লাখ = ৳১ লাখ/শতাংশ', () => {
    const convention = LAND_CONVENTIONS.chattogram
    const r = calculateLandPrice({ area: 1, areaUnit: 'kani', price: 4e6, priceUnit: 'kani', convention })
    expect(r.pricePer.decimal).toBe(100000)
  })
  it('hand-checked to the paisa for a huge total: 99,99,999 কাঠা × ৳1,234.57', () => {
    // 1,234.57 × 1,00,00,000 − 1,234.57 = 12,34,57,00,000 − 1,234.57 = ৳12,34,56,98,765.43.
    const r = calculateLandPrice({ area: 9999999, areaUnit: 'katha', price: 1234.57, priceUnit: 'katha' })
    expect(r.total).toBe(12345698765.43)
  })
  it('refuses a price or area that would overflow', () => {
    const ok = { area: 1, areaUnit: 'acre', price: 1e6, priceUnit: 'link' } as const
    expect(validateLandPrice({ ...ok, price: 1e306 })).toBe('price')
    expect(validateLandPrice({ ...ok, area: 1e300, priceUnit: 'sqft', price: 1e10 })).toBe('area')
    expect(validateLandPrice({ ...ok, area: 1e305, price: 0 })).toBe('area')
    expect(validateLandPrice(ok)).toBeNull()
  })
})
