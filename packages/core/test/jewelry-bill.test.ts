import { describe, expect, it } from 'vitest'
import { calculateJewelryBill, validateJewelryBill } from '../src/jewelry-bill.ts'

describe('jewelry-bill', () => {
  it('matches the Figma example (L4): ১ ভরি ২২K ৳২,২৮,০৩১, মজুরি ৬%, VAT ৫% → ৳২,৫৩,৭৯৯', () => {
    const weight = { vori: 1, ana: 0, roti: 0 }
    const r = calculateJewelryBill({ weight, pricePerVori: 228031, makingPct: 6, vatPct: 5 })
    expect(r).toMatchObject({ goldPrice: 228031, making: 13681.86, vat: 12085.64, total: 253798.5 })
    expect([r.making, r.vat, r.total].map(Math.round)).toEqual([13682, 12086, 253799])
    expect(r.payable).toBe(r.total)
  })
  it('hand-checked: ৮ আনা at ৳২,০০,০০০ = ৳১,০০,০০০ + ১০% মজুরি ৳১০,০০০ + ৫% VAT ৳৫,৫০০', () => {
    const r = calculateJewelryBill({ weight: { ana: 8 }, pricePerVori: 200000, makingPct: 10, vatPct: 5 })
    expect(r).toMatchObject({ vori: 0.5, goldPrice: 100000, making: 10000, vat: 5500, total: 115500 })
  })
  it('takes VAT as fixed taka per ভরি, or none when the rate already has VAT in it', () => {
    const perVori = calculateJewelryBill({ weight: { vori: 2 }, pricePerVori: 200000, makingPct: 6, vatPerVori: 2500 })
    expect(perVori).toMatchObject({ goldPrice: 400000, making: 24000, vat: 5000, total: 429000 })
    const inclusive = calculateJewelryBill({ weight: { vori: 2 }, pricePerVori: 200000, makingPct: 6 })
    expect(inclusive.vat).toBe(0)
    expect(inclusive.total).toBe(424000)
  })
  it('adds a flat মজুরি per ভরি on top of the percent', () => {
    const r = calculateJewelryBill({ weight: { vori: 1 }, pricePerVori: 200000, makingPct: 0, makingPerVori: 5000 })
    expect(r.making).toBe(5000)
  })
  it('takes old gold off the bill after the shop cut', () => {
    const r = calculateJewelryBill({
      weight: { vori: 1 },
      pricePerVori: 228031,
      makingPct: 6,
      vatPct: 5,
      oldGold: { weight: { vori: 1 }, pricePerVori: 217767, deductionPct: 10 },
    })
    expect(r).toMatchObject({ oldGoldValue: 217767, oldGoldDeduction: 21776.7, oldGoldCredit: 195990.3 })
    expect(r.payable).toBe(57808.2)
  })
  it('values old gold at the new rate when none is given, and can leave the shop owing', () => {
    const r = calculateJewelryBill({
      weight: { ana: 4 },
      pricePerVori: 200000,
      makingPct: 0,
      oldGold: { weight: { vori: 1 }, deductionPct: 0 },
    })
    expect(r.oldGoldCredit).toBe(200000)
    expect(r.payable).toBe(-150000)
  })
  it('handles a very large order', () => {
    const r = calculateJewelryBill({ weight: { vori: 10000 }, pricePerVori: 228031, makingPct: 6, vatPct: 5 })
    expect(r.goldPrice).toBe(2280310000)
    expect(r.total).toBe(2537985030)
  })
  it('validates input', () => {
    const ok = { weight: { vori: 1 }, pricePerVori: 228031, makingPct: 6, vatPct: 5 }
    expect(validateJewelryBill({ ...ok, weight: {} })).toBe('weight')
    expect(validateJewelryBill({ ...ok, weight: { vori: -1 } })).toBe('weight')
    expect(validateJewelryBill({ ...ok, pricePerVori: 0 })).toBe('price')
    expect(validateJewelryBill({ ...ok, makingPct: -1 })).toBe('making')
    expect(validateJewelryBill({ ...ok, makingPerVori: -1 })).toBe('making')
    expect(validateJewelryBill({ ...ok, vatPct: 150 })).toBe('vat')
    expect(validateJewelryBill({ ...ok, vatPerVori: -2500 })).toBe('vat')
    expect(validateJewelryBill({ ...ok, oldGold: { weight: { vori: 1 }, deductionPct: 101 } })).toBe('oldGold')
    expect(validateJewelryBill({ ...ok, pointsPerRoti: 1.5 })).toBe('points')
    expect(validateJewelryBill(ok)).toBeNull()
  })
})

describe('jewelry-bill (independent checks)', () => {
  it('hand-checked: ২ ভরি ৮ আনা ২১K at ৳২,১৭,৭৬৭, মজুরি ৭%, VAT ৫%', () => {
    // 2.5 × 2,17,767 = 5,44,417.50; × 7% = 38,109.225 → 38,109.23;
    // VAT 5% of 5,82,526.73 = 29,126.3365 → 29,126.34; মোট 6,11,653.07.
    const r = calculateJewelryBill({ weight: { vori: 2, ana: 8 }, pricePerVori: 217767, makingPct: 7, vatPct: 5 })
    expect(r).toMatchObject({ vori: 2.5, goldPrice: 544417.5, making: 38109.23, vat: 29126.34, total: 611653.07 })
  })
  it('hand-checked exchange: same 1 ভরি 22K back at a 10% cut → pay ৳৪৮,৫৭০.৬০', () => {
    // Bill 2,53,798.50 (Figma); old gold 2,28,031 − 22,803.10 = 2,05,227.90 credited.
    const r = calculateJewelryBill({
      weight: { vori: 1 },
      pricePerVori: 228031,
      makingPct: 6,
      vatPct: 5,
      oldGold: { weight: { vori: 1 }, deductionPct: 10 },
    })
    expect(r).toMatchObject({ total: 253798.5, oldGoldCredit: 205227.9, payable: 48570.6 })
  })
  it('bills a single রতি: 2,28,031 ÷ 96 = ৳২,৩৭৫.৩২ of gold', () => {
    const r = calculateJewelryBill({ weight: { roti: 1 }, pricePerVori: 228031, makingPct: 6, vatPct: 5 })
    expect(r.goldPrice).toBe(2375.32)
  })
  it('refuses bills and old gold that would overflow', () => {
    const ok = { weight: { vori: 1 }, pricePerVori: 228031, makingPct: 6, vatPct: 5 }
    expect(validateJewelryBill({ ...ok, weight: { vori: 1e305 } })).toBe('weight')
    expect(validateJewelryBill({ ...ok, oldGold: { weight: { vori: 1e305 }, deductionPct: 10 } })).toBe('oldGold')
    expect(validateJewelryBill({ ...ok, weight: { vori: 1, ana: undefined } })).toBeNull()
  })
})
