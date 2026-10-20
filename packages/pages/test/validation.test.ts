import type { Fact } from '@hisab/data/types'
import { describe, expect, it } from 'vitest'
import { checkNumber, numberOf } from '../src/tool/validation.ts'
import { dataStatus } from '../src/tool/verification.ts'

describe('checkNumber', () => {
  it('reports each validation state', () => {
    expect(checkNumber('')).toEqual({ state: 'empty' })
    expect(checkNumber('   ')).toEqual({ state: 'empty' })
    expect(checkNumber(null)).toEqual({ state: 'empty' })
    expect(checkNumber('১২ক')).toEqual({ state: 'invalid' })
    expect(checkNumber('1.5', { integer: true })).toEqual({ state: 'invalid' })
    expect(checkNumber('৫', { min: 10 })).toEqual({ state: 'min', value: 5, min: 10 })
    expect(checkNumber('40,000', { max: 30000 })).toEqual({ state: 'max', value: 40000, max: 30000 })
    expect(checkNumber('৳৫,০০০', { min: 0, max: 30000 })).toEqual({ state: 'ok', value: 5000 })
  })

  it('gives a number only for ok', () => {
    expect(numberOf(checkNumber('5000'))).toBe(5000)
    expect(numberOf(checkNumber('abc'))).toBeNull()
    expect(numberOf(checkNumber('50', { max: 10 }))).toBeNull()
  })
})

describe('dataStatus', () => {
  const fact = (checked: string, note?: string): Fact<number> => ({ value: 1, source: `https://example.com/${checked}`, checked, note })

  it('is unverified while any Fact carries the unverified note', () => {
    const s = dataStatus([fact('2026-10-01'), fact('2000-01-01', 'unverified — seeded from Figma/test fixture')])
    expect(s).toEqual({ verified: false, checked: '2000-01-01', source: 'https://example.com/2000-01-01' })
  })

  it('shows the oldest check when all are verified', () => {
    expect(dataStatus([fact('2026-10-19'), fact('2026-10-02')])).toEqual({
      verified: true,
      checked: '2026-10-02',
      source: 'https://example.com/2026-10-02',
    })
  })
})
