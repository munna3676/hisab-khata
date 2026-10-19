import { describe, expect, it } from 'vitest'
import { allocate } from '../src/lib/commerce-allocate.ts'

describe('allocate', () => {
  it('splits so the parts add up exactly', () => {
    expect(allocate(100, [1, 1, 1])).toEqual([33.34, 33.33, 33.33])
    expect(allocate(24000, [180, 140, 120])).toEqual([9818.18, 7636.36, 6545.46])
    expect(allocate(24000, [180, 140, 120], 0)).toEqual([9818, 7636, 6546])
  })
  it('gives leftover paisa to the biggest fractions first', () => {
    expect(allocate(1, [1, 2])).toEqual([0.33, 0.67])
  })
  it('handles zero weights, zero total and an empty list', () => {
    expect(allocate(10, [0, 0])).toEqual([5, 5])
    expect(allocate(10, [0, 3])).toEqual([0, 10])
    expect(allocate(0, [1, 2])).toEqual([0, 0])
    expect(allocate(5, [])).toEqual([])
  })
  it('keeps the paisa of a big total (toPrecision(12) used to drop them)', () => {
    expect(allocate(75427625625.09, [2.337])).toEqual([75427625625.09])
    expect(allocate(1e11, [1, 1, 1])).toEqual([33333333333.34, 33333333333.33, 33333333333.33])
    const parts = allocate(324713377211.04, [189, 1.746, 2.05, 2.17, 58, 88, 2.82, 2.98])
    expect(Math.round(parts.reduce((s, p) => s + p * 100, 0))).toBe(32471337721104)
  })
  it('hand-checked: parts are each within a paisa of the exact share and always add up', () => {
    let seed = 11
    const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    for (let t = 0; t < 3000; t++) {
      const total = Math.round(next() * 10 ** (2 + Math.floor(next() * 12))) / 100
      const weights = Array.from({ length: 1 + Math.floor(next() * 6) }, () => (next() < 0.5 ? Math.round(next() * 300) : next() * 3))
      const parts = allocate(total, weights)
      const weightSum = weights.reduce((s, w) => s + w, 0)
      expect(Math.round(parts.reduce((s, p) => s + p * 100, 0))).toBe(Math.round(total * 100))
      parts.forEach((p, i) => {
        const share = weightSum > 0 ? (total * weights[i]!) / weightSum : total / weights.length
        expect(Math.abs(p - share)).toBeLessThanOrEqual(0.01 + share * 1e-12)
      })
    }
  })
  it('splits 7 paisa among 7 and a third-weight total', () => {
    expect(allocate(0.07, Array(7).fill(0.1))).toEqual(Array(7).fill(0.01))
    expect(allocate(1, [1 / 3, 1 / 3, 1 / 3])).toEqual([0.34, 0.33, 0.33])
  })
  it('does not lose a paisa to float error', () => {
    expect(allocate(0.3, [0.1, 0.2])).toEqual([0.1, 0.2])
    expect(allocate(1e9, [1, 1, 1]).reduce((s, p) => s + p, 0)).toBeCloseTo(1e9, 4)
  })
})
