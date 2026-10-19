import { describe, expect, it } from 'vitest'
import { calculateZakat, resolveNisabBasis, validateZakat, type ZakatRates } from '../src/zakat.ts'

// BAJUS rates on the Figma screens (13 Oct 2026); the nisab weights and 2.5% as data would hold them.
const rates: ZakatRates = {
  goldPricePerVori: 228031,
  silverPricePerVori: 4199,
  nisabGoldVori: 7.5,
  nisabSilverVori: 52.5,
  ratePct: 2.5,
}

describe('zakat', () => {
  it('matches the Figma example (R1): ৳৭ লাখ − ৳৫০,০০০ দেনা = ৳৬,৫০,০০০ → যাকাত ৳১৬,২৫০', () => {
    const r = calculateZakat({ assets: { gold: 250000, cash: 450000 }, liabilities: 50000, basis: 'silver', rates })
    expect(r).toMatchObject({ totalAssets: 700000, liabilities: 50000, netAssets: 650000 })
    expect(r).toMatchObject({ meetsNisab: true, zakat: 16250 })
    // ৳৪,১৯৯ × ৫২.৫ = ৳২,২০,৪৪৭.৫০, shown as ৳২,২০,৪৪৮.
    expect(r.nisab).toBe(220447.5)
    expect(Math.round(r.nisab)).toBe(220448)
  })
  it('hand-checked: ৳১০ লাখ net at 2.5% = ৳২৫,০০০', () => {
    const assets = { bank: 800000, business: 150000, receivables: 50000 }
    const r = calculateZakat({ assets, liabilities: 0, basis: 'silver', rates })
    expect(r.zakat).toBe(25000)
  })
  it('measures against 7.5 ভরি of gold on the gold chip', () => {
    const r = calculateZakat({ assets: { gold: 250000, cash: 450000 }, liabilities: 50000, basis: 'gold', rates })
    expect(r.nisab).toBe(1710232.5)
    expect(r.meetsNisab).toBe(false)
    expect(r.zakat).toBe(0)
  })
  it("'auto' uses gold's nisab only when gold is all there is", () => {
    expect(resolveNisabBasis('auto', { gold: 500000 })).toBe('gold')
    expect(resolveNisabBasis('auto', { gold: 500000, cash: 1 })).toBe('silver')
    expect(resolveNisabBasis('auto', { cash: 500000 })).toBe('silver')
    expect(resolveNisabBasis('auto', {})).toBe('silver')
    expect(calculateZakat({ assets: { gold: 500000 }, liabilities: 0, basis: 'auto', rates }).zakat).toBe(0)
  })
  it('meets the nisab exactly at the line, and not with debts above the assets', () => {
    expect(calculateZakat({ assets: { cash: 220447.5 }, liabilities: 0, basis: 'silver', rates }).zakat).toBe(5511.19)
    const owing = calculateZakat({ assets: { cash: 100000 }, liabilities: 300000, basis: 'silver', rates })
    expect(owing.netAssets).toBe(-200000)
    expect(owing.zakat).toBe(0)
  })
  it('uses a nisab typed in by hand', () => {
    const r = calculateZakat({ assets: { cash: 300000 }, liabilities: 0, basis: 'silver', rates, nisabOverride: 35e4 })
    expect(r.nisab).toBe(350000)
    expect(r.zakat).toBe(0)
  })
  it('handles zero and very large wealth', () => {
    expect(calculateZakat({ assets: {}, liabilities: 0, basis: 'silver', rates }).zakat).toBe(0)
    expect(calculateZakat({ assets: { bank: 1e12 }, liabilities: 0, basis: 'gold', rates }).zakat).toBe(2.5e10)
  })
  it('validates input', () => {
    const ok = { assets: { cash: 1000 }, liabilities: 0, basis: 'silver', rates } as const
    expect(validateZakat({ ...ok, assets: { cash: -1 } })).toBe('assets')
    expect(validateZakat({ ...ok, liabilities: Number.NaN })).toBe('liabilities')
    expect(validateZakat({ ...ok, basis: 'copper' as never })).toBe('basis')
    expect(validateZakat({ ...ok, rates: { ...rates, silverPricePerVori: 0 } })).toBe('rates')
    expect(validateZakat({ ...ok, rates: { ...rates, ratePct: 0 } })).toBe('rates')
    expect(validateZakat({ ...ok, nisabOverride: 0 })).toBe('nisab')
    expect(validateZakat(ok)).toBeNull()
  })
})

describe('zakat (independent checks)', () => {
  it('hand-checked gold-only on auto: 8 ভরি × ৳২,২৮,০৩১ = ৳১৮,২৪,২৪৮ ≥ 7.5 ভরি nisab → ৳৪৫,৬০৬.২০', () => {
    // Gold nisab 7.5 × 2,28,031 = 17,10,232.50; 2.5% of 18,24,248 = 45,606.20.
    const r = calculateZakat({ assets: { gold: 8 * 228031 }, liabilities: 0, basis: 'auto', rates })
    expect(r).toMatchObject({ basis: 'gold', goldNisab: 1710232.5, meetsNisab: true, zakat: 45606.2 })
  })
  it('hand-checked: 7 ভরি of gold alone is below the gold nisab, but over the silver one on the silver chip', () => {
    // 7 × 2,28,031 = 15,96,217 < 17,10,232.50; on silver: 2.5% = 39,905.425 → 39,905.43.
    const assets = { gold: 7 * 228031 }
    expect(calculateZakat({ assets, liabilities: 0, basis: 'auto', rates }).zakat).toBe(0)
    expect(calculateZakat({ assets, liabilities: 0, basis: 'silver', rates }).zakat).toBe(39905.43)
  })
  it('owes nothing when debts take net wealth to exactly zero', () => {
    const r = calculateZakat({ assets: { cash: 300000, bank: 200000 }, liabilities: 500000, basis: 'silver', rates })
    expect(r).toMatchObject({ netAssets: 0, meetsNisab: false, zakat: 0 })
  })
  it('refuses assets or rates that would overflow', () => {
    const ok = { assets: { cash: 1000 }, liabilities: 0, basis: 'silver', rates } as const
    expect(validateZakat({ ...ok, assets: { cash: 1e308, bank: 1e308 } })).toBe('assets')
    expect(validateZakat({ ...ok, rates: { ...rates, silverPricePerVori: 1e307 } })).toBe('rates')
  })
})
