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
  it('does not lose a paisa to float error', () => {
    expect(allocate(0.3, [0.1, 0.2])).toEqual([0.1, 0.2])
    expect(allocate(1e9, [1, 1, 1]).reduce((s, p) => s + p, 0)).toBeCloseTo(1e9, 4)
  })
})
