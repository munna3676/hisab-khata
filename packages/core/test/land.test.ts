import { describe, expect, it } from 'vitest'
import { LAND_CONVENTIONS, LAND_UNITS, calculateLand, convertLand, landUnitSqft, splitLand, validateLand } from '../src/land.ts'

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
