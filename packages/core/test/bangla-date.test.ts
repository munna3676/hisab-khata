import { describe, expect, it } from 'vitest'
import {
  banglaMonthLength,
  calculateBanglaDate,
  fromBanglaDate,
  toBanglaDate,
  validateBanglaDate,
  type SpecialDay,
} from '../src/bangla-date.ts'
import { fromDayNumber, toDayNumber } from '../src/lib/dates-calendar.ts'

// Sample special days in the shape of data/dates/special-days.json, test-only.
const SPECIAL: SpecialDay[] = [
  { calendar: 'gregorian', month: 12, day: 16, name: 'বিজয় দিবস' },
  { calendar: 'gregorian', month: 2, day: 21, name: 'শহীদ দিবস' },
  { calendar: 'bangla', month: 1, day: 1, name: 'পহেলা বৈশাখ' },
]

describe('bangla-date', () => {
  it('matches the Figma home: ১৯ অক্টোবর ২০২৬ = ৩ কার্তিক ১৪৩৩, হেমন্ত', () => {
    const r = calculateBanglaDate({ from: 'gregorian', date: { year: 2026, month: 10, day: 19 } })
    expect(r.bangla).toEqual({ year: 1433, month: 7, day: 3 })
    expect(r.banglaMonthName).toBe('কার্তিক')
    expect(r.weekdayName).toBe('সোমবার')
    expect(r.seasonName).toBe('হেমন্ত')
  })
  it('matches the Figma screen D3: ১৬ ডিসেম্বর ২০২৬ = ১ পৌষ ১৪৩৩, বুধবার, শীত, বিজয় দিবস', () => {
    const r = calculateBanglaDate({ from: 'gregorian', date: { year: 2026, month: 12, day: 16 }, specialDays: SPECIAL })
    expect(r.bangla).toEqual({ year: 1433, month: 9, day: 1 })
    expect(r.banglaMonthName).toBe('পৌষ')
    expect(r.weekdayName).toBe('বুধবার')
    expect(r.season).toBe('sheet')
    expect(r.seasonName).toBe('শীত')
    expect(r.specialDays).toEqual(['বিজয় দিবস'])
  })
  it('matches the Figma screen D5-b: ১ বৈশাখ ১৪৩৪ = ১৪ এপ্রিল ২০২৭, বুধবার, গ্রীষ্ম, পহেলা বৈশাখ', () => {
    const r = calculateBanglaDate({ from: 'bangla', date: { year: 1434, month: 1, day: 1 }, specialDays: SPECIAL })
    expect(r.gregorian).toEqual({ year: 2027, month: 4, day: 14 })
    expect(r.gregorianMonthName).toBe('এপ্রিল')
    expect(r.weekdayName).toBe('বুধবার')
    expect(r.seasonName).toBe('গ্রীষ্ম')
    expect(r.specialDays).toEqual(['পহেলা বৈশাখ'])
  })
  it('keeps the national days the 2019 revision fixed (Bangla Academy): ৮ ফাল্গুন, ১২ চৈত্র, ১ পৌষ ১৯৭১', () => {
    for (const year of [1952, 2024, 2025, 2026, 2027, 2028]) {
      expect(toBanglaDate({ year, month: 2, day: 14 })).toMatchObject({ month: 11, day: 1 })
      expect(toBanglaDate({ year, month: 2, day: 21 })).toMatchObject({ month: 11, day: 8 })
      expect(toBanglaDate({ year, month: 3, day: 26 })).toMatchObject({ month: 12, day: 12 })
      expect(toBanglaDate({ year, month: 4, day: 14 })).toMatchObject({ month: 1, day: 1 })
    }
    expect(toBanglaDate({ year: 1971, month: 12, day: 16 })).toEqual({ year: 1378, month: 9, day: 1 })
  })
  it('matches dates printed by Bangladeshi newspapers (independent)', () => {
    // bdnews24: "১৫ জুলাই ২০২৬, ৩১ আষাঢ় ১৪৩৩"; risingbd: "০৯ আগস্ট ২০২৬ || শ্রাবণ ২৫ ১৪৩৩"
    expect(toBanglaDate({ year: 2026, month: 7, day: 15 })).toEqual({ year: 1433, month: 3, day: 31 })
    expect(toBanglaDate({ year: 2026, month: 8, day: 9 })).toEqual({ year: 1433, month: 4, day: 25 })
  })
  it('gives ফাল্গুন 30 days only when its February is a leap year', () => {
    expect(banglaMonthLength(1430, 11)).toBe(30) // Feb 2024
    expect(banglaMonthLength(1431, 11)).toBe(29) // Feb 2025
    expect(toBanglaDate({ year: 2024, month: 3, day: 14 })).toEqual({ year: 1430, month: 11, day: 30 })
    expect(toBanglaDate({ year: 2025, month: 3, day: 14 })).toEqual({ year: 1431, month: 11, day: 29 })
    expect(toBanglaDate({ year: 2025, month: 3, day: 15 })).toEqual({ year: 1431, month: 12, day: 1 })
    expect(toBanglaDate({ year: 2026, month: 4, day: 13 })).toEqual({ year: 1432, month: 12, day: 30 })
  })
  it('round-trips every day from 1900 to 2100, and every year has 365 or 366 days', () => {
    const first = toDayNumber({ year: 1900, month: 1, day: 1 })
    const last = toDayNumber({ year: 2100, month: 12, day: 31 })
    for (let n = first; n <= last; n++) {
      const g = fromDayNumber(n)
      expect(toDayNumber(fromBanglaDate(toBanglaDate(g)))).toBe(n)
    }
    for (let year = 1300; year <= 1500; year++) {
      const days = [...Array(12).keys()].reduce((s, m) => s + banglaMonthLength(year, m + 1), 0)
      expect(days).toBe(toDayNumber(fromBanglaDate({ year: year + 1, month: 1, day: 1 })) - toDayNumber(fromBanglaDate({ year, month: 1, day: 1 })))
    }
  })
  it('gives each month its ঋতু', () => {
    const seasons = [1, 3, 5, 7, 9, 11].map((month) => calculateBanglaDate({ from: 'bangla', date: { year: 1433, month, day: 1 } }).season)
    expect(seasons).toEqual(['grishma', 'borsha', 'shorot', 'hemonto', 'sheet', 'boshonto'])
  })
  it('validates input', () => {
    expect(validateBanglaDate({ from: 'bangla', date: { year: 1433, month: 7, day: 31 } })).toBe('date')
    expect(validateBanglaDate({ from: 'bangla', date: { year: 1431, month: 11, day: 30 } })).toBe('date')
    expect(validateBanglaDate({ from: 'bangla', date: { year: 1430, month: 11, day: 30 } })).toBeNull()
    expect(validateBanglaDate({ from: 'bangla', date: { year: 0, month: 1, day: 1 } })).toBe('date')
    expect(validateBanglaDate({ from: 'gregorian', date: { year: 2026, month: 2, day: 29 } })).toBe('date')
    expect(validateBanglaDate({ from: 'hijri' as 'bangla', date: { year: 1433, month: 1, day: 1 } })).toBe('from')
    expect(validateBanglaDate({ from: 'gregorian', date: { year: 2026, month: 1, day: 1 }, specialDays: [{ calendar: 'gregorian', month: 13, day: 1, name: 'x' }] })).toBe('specialDays')
    expect(validateBanglaDate({ from: 'gregorian', date: { year: 2026, month: 10, day: 19 }, specialDays: SPECIAL })).toBeNull()
  })
  it('matches Bangladesh Meteorological Department bulletins (official, bamis.gov.bd): ০৩ ফাল্গুন ১৪৩১ = 16 Feb 2025, ১০ চৈত্র ১৪৩১ = 24 Mar 2025', () => {
    expect(toBanglaDate({ year: 2025, month: 2, day: 16 })).toEqual({ year: 1431, month: 11, day: 3 })
    expect(toBanglaDate({ year: 2025, month: 3, day: 24 })).toEqual({ year: 1431, month: 12, day: 10 })
    expect(fromBanglaDate({ year: 1431, month: 11, day: 3 })).toEqual({ year: 2025, month: 2, day: 16 })
    expect(fromBanglaDate({ year: 1431, month: 12, day: 10 })).toEqual({ year: 2025, month: 3, day: 24 })
  })
  it('works the year ends by hand: ৩০ চৈত্র ১৪৩২ = Mon 13 Apr 2026, ১ বৈশাখ ১৪৩৩ = Tue 14 Apr 2026', () => {
    // 6 × 31 + 4 × 30 + 29 + 30 = 365 days from 14 Apr 2025.
    const last = calculateBanglaDate({ from: 'bangla', date: { year: 1432, month: 12, day: 30 } })
    expect(last.gregorian).toEqual({ year: 2026, month: 4, day: 13 })
    expect(last.weekdayName).toBe('সোমবার')
    const first = calculateBanglaDate({ from: 'gregorian', date: { year: 2026, month: 4, day: 14 }, specialDays: SPECIAL })
    expect(first.bangla).toEqual({ year: 1433, month: 1, day: 1 })
    expect(first.weekdayName).toBe('মঙ্গলবার')
    expect(first.specialDays).toEqual(['পহেলা বৈশাখ'])
    // The leap ফাল্গুন's 30th day exists only in a leap year, both ways.
    expect(fromBanglaDate({ year: 1430, month: 11, day: 30 })).toEqual({ year: 2024, month: 3, day: 14 })
    expect(calculateBanglaDate({ from: 'bangla', date: { year: 1430, month: 11, day: 30 } }).daysInBanglaMonth).toBe(30)
  })
  it('matches special days on the Bangla calendar too, and rejects a nameless one', () => {
    const falgun8: SpecialDay = { calendar: 'bangla', month: 11, day: 8, name: 'আট ফাল্গুন' }
    const r = calculateBanglaDate({ from: 'gregorian', date: { year: 2027, month: 2, day: 21 }, specialDays: [...SPECIAL, falgun8] })
    expect(r.specialDays).toEqual(['শহীদ দিবস', 'আট ফাল্গুন'])
    expect(calculateBanglaDate({ from: 'gregorian', date: { year: 2026, month: 10, day: 20 }, specialDays: SPECIAL }).specialDays).toEqual([])
    const nameless = { calendar: 'gregorian', month: 1, day: 1 } as unknown as SpecialDay
    expect(validateBanglaDate({ from: 'gregorian', date: { year: 2026, month: 1, day: 1 }, specialDays: [nameless] })).toBe('specialDays')
  })
})
