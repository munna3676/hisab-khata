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

describe('gold (independent checks)', () => {
  it('hand-checked from 1 ভরি = 11.664 g: 1 আনা = 0.729 g, 1 রতি = 0.1215 g, 1 পয়েন্ট = 0.01215 g', () => {
    expect(goldUnitGrams('ana')).toBe(0.729)
    expect(goldUnitGrams('roti')).toBe(0.1215)
    expect(convertGold(1, 'point', 'gram')).toBe(0.01215)
    // 31.1034768 ÷ 11.664 = 2.66662 ভরি in a troy ounce.
    expect(convertGold(1, 'ounce', 'vori').toFixed(5)).toBe('2.66662')
  })
  it('hand-checked: 5 g = ০ ভরি ৬ আনা ৫ রতি ১.৫২ পয়েন্ট; ১ আনা ২২K at ৳২,২৮,০৩১ = ৳১৪,২৫১.৯৪', () => {
    // 6 × 0.729 = 4.374, 5 × 0.1215 = 0.6075, rest 0.0185 g ÷ 0.01215 = 1.5226 পয়েন্ট.
    const r = calculateGold({ weight: { gram: 5 } })
    expect(r.split).toMatchObject({ vori: 0, ana: 6, roti: 5 })
    expect(r.split.point.toFixed(4)).toBe('1.5226')
    // 2,28,031 ÷ 16 = 14,251.9375.
    expect(calculateGold({ weight: { ana: 1 }, pricePerVori: 228031 }).value).toBe(14251.94)
  })
  it('gives back every ভরি-আনা-রতি-পয়েন্ট typed in, with no 0.999999 পয়েন্ট', () => {
    // Before the fix, 5 ভরি 8 আনা 5 রতি 1 পয়েন্ট came back as ... 0.999999999999 পয়েন্ট.
    expect(calculateGold({ weight: { vori: 5, ana: 8, roti: 5, point: 1 } }).split).toEqual({
      vori: 5,
      ana: 8,
      roti: 5,
      point: 1,
    })
    for (let vori = 0; vori <= 20; vori++) {
      for (let ana = 0; ana < 16; ana++) {
        for (let roti = 0; roti < 6; roti++) {
          for (let point = 0; point < 10; point++) {
            const split = calculateGold({ weight: { vori, ana, roti, point } }).split
            expect(split).toEqual({ vori, ana, roti, point })
          }
        }
      }
    }
  })
  it('takes a weight box left undefined as 0, and refuses weights or prices that overflow', () => {
    expect(validateGold({ weight: { vori: 2, ana: undefined } })).toBeNull()
    expect(calculateGold({ weight: { vori: 2, ana: undefined } }).grams).toBe(23.328)
    expect(validateGold({ weight: { vori: 1e307 } })).toBe('weight')
    expect(validateGold({ weight: { vori: 1e300 }, pricePerVori: 1e10 })).toBe('price')
    expect(validateGold({ weight: { vori: 1 }, pointsPerRoti: 1e300 })).toBe('points')
  })
})
