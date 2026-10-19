import { describe, expect, it } from 'vitest'
import { calculateGold, convertGold, goldUnitGrams, goldWeightGrams, validateGold } from '../src/gold.ts'

describe('gold', () => {
  it('matches the Figma example (L3): ২ ভরি ৪ আনা = ২.২৫ ভরি = ৩৬ আনা = ২১৬ রতি = ২৬.২৪৪ গ্রাম', () => {
    const r = calculateGold({ weight: { vori: 2, ana: 4, roti: 0 }, pricePerVori: 228031 })
    expect(r.values).toMatchObject({ vori: 2.25, ana: 36, roti: 216, gram: 26.244 })
    expect(r.split).toEqual({ vori: 2, ana: 4, roti: 0, point: 0 })
    // ২.২৫ ভরি × ৳২,২৮,০৩১ = ৳৫,১৩,০৬৯.৭৫, shown as ৳৫,১৩,০৭০.
    expect(r.value).toBe(513069.75)
    expect(Math.round(r.value!)).toBe(513070)
  })
  it('matches BAJUS: ১ ভরি = ১১.৬৬৪ গ্রাম = ১৬ আনা = ৯৬ রতি', () => {
    expect(goldUnitGrams('vori')).toBe(11.664)
    expect(convertGold(1, 'vori', 'ana')).toBe(16)
    expect(convertGold(1, 'vori', 'roti')).toBe(96)
    expect(convertGold(1, 'vori', 'point')).toBe(960)
    expect(calculateGold({ weight: { gram: 11.664 } }).split).toEqual({ vori: 1, ana: 0, roti: 0, point: 0 })
  })
  it('splits grams into ভরি-আনা-রতি-পয়েন্ট, hand-checked: 10 g = ০-১৩-৪-৩.০৫', () => {
    const r = calculateGold({ weight: { gram: 10 } })
    expect(r.split.vori).toBe(0)
    expect(r.split.ana).toBe(13)
    expect(r.split.roti).toBe(4)
    expect(r.split.point.toFixed(2)).toBe('3.05')
    expect(goldWeightGrams({ ana: 13, roti: 4, point: r.split.point })).toBe(10)
  })
  it('takes a shop that counts 8 পয়েন্ট to the রতি', () => {
    expect(convertGold(1, 'roti', 'point', 8)).toBe(8)
    expect(goldWeightGrams({ point: 8 }, 8)).toBe(goldUnitGrams('roti'))
  })
  it('matches the definitions: 1 troy ounce = 31.1034768 g, তোলা within 0.01% of ভরি', () => {
    expect(convertGold(1, 'ounce', 'gram')).toBe(31.1034768)
    expect(Math.abs(convertGold(1, 'tola', 'vori') - 1)).toBeLessThan(0.0001)
  })
  it('gives the price per gram for the rate', () => {
    expect(calculateGold({ weight: { vori: 1 }, pricePerVori: 116640 }).pricePerGram).toBe(10000)
    expect(calculateGold({ weight: { vori: 1 } }).value).toBeNull()
  })
  it('handles zero and very large weights', () => {
    const zero = calculateGold({ weight: {}, pricePerVori: 228031 })
    expect(zero.grams).toBe(0)
    expect(zero.value).toBe(0)
    expect(calculateGold({ weight: { vori: 1e6 }, pricePerVori: 228031 }).value).toBe(228031000000)
  })
  it('validates input', () => {
    expect(validateGold({ weight: { vori: -1 } })).toBe('weight')
    expect(validateGold({ weight: { vori: Number.NaN } })).toBe('weight')
    expect(validateGold({ weight: { kg: 1 } as never })).toBe('weight')
    expect(validateGold({ weight: { vori: 1 }, pricePerVori: -5 })).toBe('price')
    expect(validateGold({ weight: { vori: 1 }, pointsPerRoti: 0 })).toBe('points')
    expect(validateGold({ weight: { vori: 2, ana: 4 }, pricePerVori: 228031 })).toBeNull()
  })
})
