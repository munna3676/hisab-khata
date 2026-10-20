import { describe, expect, it } from 'vitest'
import { formatDateIn, formatLongDateIn, formatNumberIn, formatPercentIn, formatTakaIn, plainDigits } from '../src/format.ts'

describe('locale number formatting', () => {
  it('uses Bangla digits on Bangla pages and Latin digits on English pages, lakh grouping in both', () => {
    expect(formatNumberIn('bn', 1234567)).toBe('১২,৩৪,৫৬৭')
    expect(formatNumberIn('en', 1234567)).toBe('12,34,567')
    expect(formatTakaIn('bn', 69.75)).toBe('৳৬৯.৭৫')
    expect(formatTakaIn('en', 5000)).toBe('৳5,000')
  })

  it('formats percents like the bank pages (৯.৭৫%)', () => {
    expect(formatPercentIn('bn', 9.75)).toBe('৯.৭৫%')
    expect(formatPercentIn('en', 9, { decimals: 2 })).toBe('9.00%')
  })

  it('writes years without grouping', () => {
    expect(plainDigits('bn', 2026)).toBe('২০২৬')
    expect(plainDigits('en', 2026)).toBe('2026')
  })
})

describe('locale dates', () => {
  it('matches the home page date line in Figma (সোমবার, ১৯ অক্টোবর ২০২৬ / Monday, 19 October 2026)', () => {
    const day = { year: 2026, month: 10, day: 19 }
    expect(formatLongDateIn('bn', day)).toBe('সোমবার, ১৯ অক্টোবর ২০২৬')
    expect(formatLongDateIn('en', day)).toBe('Monday, 19 October 2026')
    expect(formatDateIn('bn', day)).toBe('১৯ অক্টোবর ২০২৬')
  })

  it('reads a Date as the day in Bangladesh (UTC+6)', () => {
    // 19:30 UTC on 18 October is 01:30 on 19 October in Dhaka.
    expect(formatDateIn('en', new Date('2026-10-18T19:30:00Z'))).toBe('19 October 2026')
  })
})
