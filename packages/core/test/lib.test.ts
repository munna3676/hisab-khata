import { describe, expect, it } from 'vitest'
import { parseAmount, toBanglaDigits, toEnglishDigits } from '../src/lib/digits.ts'
import { formatNumber, formatTaka, groupLakh } from '../src/lib/format.ts'
import { round, sumMoney } from '../src/lib/money.ts'

describe('digits', () => {
  it('converts both ways', () => {
    expect(toBanglaDigits('1,234.50')).toBe('১,২৩৪.৫০')
    expect(toEnglishDigits('১,২৩৪.৫০')).toBe('1,234.50')
  })
  it('parses what people type', () => {
    expect(parseAmount('৫,০০০')).toBe(5000)
    expect(parseAmount('৳ 12,34,567')).toBe(1234567)
    expect(parseAmount('Tk 45.5')).toBe(45.5)
    expect(parseAmount('৫০০০ টাকা')).toBe(5000)
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('abc')).toBeNull()
    expect(parseAmount('1.2.3')).toBeNull()
  })
})

describe('format', () => {
  it('groups in lakh/crore style', () => {
    expect(groupLakh('1234567')).toBe('12,34,567')
    expect(groupLakh('123456789')).toBe('12,34,56,789')
    expect(groupLakh('999')).toBe('999')
  })
  it('formats numbers and taka', () => {
    expect(formatNumber(1234567.891)).toBe('১২,৩৪,৫৬৭.৮৯')
    expect(formatNumber(1234567.891, { digits: 'en' })).toBe('12,34,567.89')
    expect(formatTaka(5000)).toBe('৳৫,০০০')
    expect(formatTaka(45.5)).toBe('৳৪৫.৫০')
    expect(formatTaka(-200, { digits: 'en' })).toBe('-৳200')
  })
})

describe('money', () => {
  it('rounds half away from zero without float error', () => {
    expect(round(1.005)).toBe(1.01)
    expect(round(-1.005)).toBe(-1.01)
    expect(round(18.5 * 5, 0)).toBe(93)
  })
  it('sums without drift', () => {
    expect(sumMoney([0.1, 0.2, 0.3])).toBe(0.6)
  })
})
