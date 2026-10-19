import { describe, expect, it } from 'vitest'
import {
  LAND_CONVENTIONS,
  LAND_UNITS,
  calculateLand,
  convertLand,
  landUnitSqft,
  splitLand,
  validateLand,
} from '../src/land.ts'

describe('land', () => {
  it('matches the Figma home line: ১ শতাংশ = ৪৩৫.৬ বর্গফুট', () => {
    expect(calculateLand({ value: 1, unit: 'decimal' }).sqft).toBe(435.6)
  })
  it('matches the Figma example (L1): ১০ শতাংশ = ৪,৩৫৬ বর্গফুট = ৬.০৫ কাঠা = ০.১০ একর', () => {
    const r = calculateLand({ value: 10, unit: 'decimal' })
    expect(r.values).toMatchObject({ decimal: 10, sqft: 4356, katha: 6.05, acre: 0.1 })
    expect(r.values.bigha.toFixed(2)).toBe('0.30')
    expect(r.values.sqm.toFixed(1)).toBe('404.7')
    expect(r.rows.map((row) => row.unit).slice(0, 6)).toEqual(['decimal', 'sqft', 'katha', 'bigha', 'acre', 'sqm'])
  })
  it('matches the Ministry of Land table: কাঠা, বিঘা, একর and the কানি ladder in square feet', () => {
    expect(landUnitSqft('katha')).toBe(720)
    expect(landUnitSqft('chotak')).toBe(45)
    expect(landUnitSqft('bigha')).toBe(14400)
    expect(landUnitSqft('acre')).toBe(43560)
    expect(landUnitSqft('kani')).toBe(17280)
    expect(landUnitSqft('gonda')).toBe(864)
    expect(landUnitSqft('kora')).toBe(216)
    expect(landUnitSqft('kranti')).toBe(72)
  })
  it('hand-checked relations: ১ কাঠা ≈ ১.৬৫ শতাংশ (FAQ), ১ বিঘা = ২০ কাঠা, ১ একর = ১০০ শতাংশ = ৪,৮৪০ বর্গগজ', () => {
    expect(convertLand(1, 'katha', 'decimal').toFixed(2)).toBe('1.65')
    expect(convertLand(1, 'bigha', 'katha')).toBe(20)
    expect(convertLand(1, 'acre', 'decimal')).toBe(100)
    expect(convertLand(1, 'acre', 'sqyard')).toBe(4840)
    expect(convertLand(1, 'decimal', 'link')).toBe(1000)
    expect(convertLand(1, 'kani', 'gonda')).toBe(20)
  })
  it('matches the exact metric definitions: 1 acre = 4,046.8564224 m², 1 hectare ≈ 2.4711 acre', () => {
    expect(convertLand(1, 'acre', 'sqm')).toBe(4046.8564224)
    expect(convertLand(1, 'hectare', 'acre').toFixed(4)).toBe('2.4711')
  })
  it('splits into বিঘা-কাঠা-ছটাক: ১ একর = ৩ বিঘা ০ কাঠা ৮ ছটাক', () => {
    expect(splitLand(1, 'acre', ['bigha', 'katha', 'chotak'])).toEqual([3, 0, 8])
    expect(splitLand(10, 'decimal', ['bigha', 'katha', 'chotak'])).toEqual([0, 6, 0.8])
  })
  it('takes a regional কাঠা or কানি', () => {
    expect(calculateLand({ value: 10, unit: 'decimal', convention: { kathaSqft: 726 } }).values.katha).toBe(6)
    expect(convertLand(1, 'kani', 'decimal', LAND_CONVENTIONS.chattogram)).toBe(40)
    expect(convertLand(1, 'kani', 'decimal', LAND_CONVENTIONS.cumilla)).toBe(30)
    // কাঠা and বিঘা do not move when only the কানি changes.
    expect(convertLand(1, 'bigha', 'sqft', LAND_CONVENTIONS.chattogram)).toBe(14400)
  })
  it('handles zero and very large areas', () => {
    const zero = calculateLand({ value: 0, unit: 'bigha' })
    expect(zero.sqft).toBe(0)
    expect(LAND_UNITS.every((u) => zero.values[u] === 0)).toBe(true)
    expect(calculateLand({ value: 1e9, unit: 'acre' }).values.decimal).toBe(1e11)
  })
  it('validates input', () => {
    expect(validateLand({ value: -1, unit: 'katha' })).toBe('value')
    expect(validateLand({ value: Number.POSITIVE_INFINITY, unit: 'katha' })).toBe('value')
    expect(validateLand({ value: 1, unit: 'hat' as never })).toBe('unit')
    expect(validateLand({ value: 1, unit: 'katha', convention: { kathaSqft: 0 } })).toBe('convention')
    expect(validateLand({ value: 1, unit: 'katha', convention: { kaniSqft: Number.NaN } })).toBe('convention')
    expect(validateLand({ value: 5, unit: 'katha' })).toBeNull()
  })
})

describe('land (independent checks)', () => {
  it('hand-checked from 1 acre = 43,560 sq ft and 1 ft = 0.3048 m', () => {
    // 1 বিঘা = 14,400 ÷ 435.6 = 33.0579 শতাংশ; 1 একর = 43,560 ÷ 14,400 = 3.025 বিঘা.
    expect(convertLand(1, 'bigha', 'decimal').toFixed(4)).toBe('33.0579')
    expect(convertLand(1, 'acre', 'bigha')).toBe(3.025)
    // 1 কাঠা = 720 × 0.09290304 = 66.8901888 m²; 1 শতাংশ = 4,046.8564224 ÷ 100 m².
    expect(convertLand(1, 'katha', 'sqm')).toBe(66.8901888)
    expect(convertLand(1, 'decimal', 'sqm')).toBe(40.468564224)
    // 1 hectare = 10,000 ÷ 0.09290304 = 107,639.104 sq ft.
    expect(convertLand(1, 'hectare', 'sqft').toFixed(3)).toBe('107639.104')
  })
  it('hand-checked কানি ladders: standard গণ্ডা ≈ 1.98 শতাংশ; a 40-শতক কানি makes গণ্ডা 2, কড়া 0.5 শতাংশ', () => {
    // 864 ÷ 435.6 = 1.9835; 17,424 ÷ 20 = 871.2 sq ft = 2 শতাংশ; ÷ 4 = 0.5; ÷ 3 = 72.6 sq ft.
    expect(convertLand(1, 'gonda', 'decimal').toFixed(4)).toBe('1.9835')
    expect(convertLand(1, 'gonda', 'decimal', LAND_CONVENTIONS.chattogram)).toBe(2)
    expect(convertLand(1, 'kora', 'decimal', LAND_CONVENTIONS.chattogram)).toBe(0.5)
    expect(convertLand(1, 'kranti', 'sqft', LAND_CONVENTIONS.chattogram)).toBe(72.6)
  })
  it('splits back every বিঘা-কাঠা-ছটাক and কানি-গণ্ডা-কড়া-ক্রান্তি typed in শতাংশ', () => {
    for (let bigha = 0; bigha <= 12; bigha++) {
      for (let katha = 0; katha < 20; katha++) {
        for (let chotak = 0; chotak < 16; chotak++) {
          const decimal = (bigha * 14400 + katha * 720 + chotak * 45) / 435.6
          expect(splitLand(decimal, 'decimal', ['bigha', 'katha', 'chotak'])).toEqual([bigha, katha, chotak])
        }
      }
    }
    // ২ কানি ৭ গণ্ডা ৩ কড়া ২ ক্রান্তি = 34,560 + 6,048 + 648 + 144 = 41,400 sq ft.
    expect(splitLand(41400, 'sqft', ['kani', 'gonda', 'kora', 'kranti'])).toEqual([2, 7, 3, 2])
  })
  it('keeps the standard size for a convention field left undefined (empty "অন্য এলাকা" box)', () => {
    const input = { value: 1, unit: 'katha', convention: { kathaSqft: undefined } } as const
    expect(validateLand(input)).toBeNull()
    expect(calculateLand(input).sqft).toBe(720)
  })
  it('refuses an area too big to show in every unit, and a convention too small to divide', () => {
    expect(validateLand({ value: 1e305, unit: 'acre' })).toBe('value')
    expect(validateLand({ value: 1e300, unit: 'acre' })).toBeNull()
    expect(validateLand({ value: 1, unit: 'sqft', convention: { kaniSqft: 1e-320 } })).toBe('convention')
  })
})
