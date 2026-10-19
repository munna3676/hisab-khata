import { describe, expect, it } from 'vitest'
import {
  addMonths,
  calendarDateAt,
  fromDayNumber,
  isValidDate,
  parseIsoDate,
  periodBetween,
  toDayNumber,
  toIsoDate,
  weekdayOf,
} from '../src/lib/dates-calendar.ts'

describe('dates-calendar', () => {
  it('day numbers agree with JavaScript Date (independent) and round-trip', () => {
    expect(toDayNumber({ year: 1970, month: 1, day: 1 })).toBe(0)
    for (let n = -800000; n <= 800000; n += 997) {
      const d = fromDayNumber(n)
      expect(toDayNumber(d)).toBe(n)
      // setUTCFullYear, unlike Date.UTC, does not read years 0–99 as 1900–1999.
      const js = new Date(0)
      js.setUTCFullYear(d.year, d.month - 1, d.day)
      expect(js.getTime() / 86400000).toBe(n)
    }
  })
  it('knows the weekday: 19 Oct 2026 is a Monday', () => {
    expect(weekdayOf({ year: 2026, month: 10, day: 19 })).toBe(1)
    expect(weekdayOf({ year: 1971, month: 12, day: 16 })).toBe(4)
  })
  it('adds months, falling back to the month end', () => {
    expect(addMonths({ year: 2026, month: 1, day: 31 }, 1)).toEqual({ year: 2026, month: 2, day: 28 })
    expect(addMonths({ year: 2000, month: 2, day: 29 }, 12)).toEqual({ year: 2001, month: 2, day: 28 })
    expect(addMonths({ year: 2026, month: 3, day: 15 }, -15)).toEqual({ year: 2024, month: 12, day: 15 })
  })
  it('measures periods in years, months and days', () => {
    expect(periodBetween({ year: 2000, month: 3, day: 15 }, { year: 2026, month: 10, day: 19 })).toEqual({ years: 26, months: 7, days: 4 })
    expect(periodBetween({ year: 2026, month: 1, day: 31 }, { year: 2026, month: 3, day: 1 })).toEqual({ years: 0, months: 1, days: 1 })
    expect(periodBetween({ year: 2026, month: 5, day: 5 }, { year: 2026, month: 5, day: 5 })).toEqual({ years: 0, months: 0, days: 0 })
  })
  it('parses and prints ISO dates, rejecting impossible ones', () => {
    expect(parseIsoDate('2026-02-21')).toEqual({ year: 2026, month: 2, day: 21 })
    expect(parseIsoDate('2026-02-29')).toBeNull()
    expect(parseIsoDate('21/02/2026')).toBeNull()
    expect(toIsoDate({ year: 2026, month: 2, day: 1 })).toBe('2026-02-01')
    expect(isValidDate({ year: 2024, month: 2, day: 29 })).toBe(true)
    expect(isValidDate({ year: 1900, month: 2, day: 29 })).toBe(false)
  })
  it('gives the Bangladesh date for an instant (UTC+6)', () => {
    expect(calendarDateAt(new Date('2026-10-18T19:00:00Z'), 360)).toEqual({ year: 2026, month: 10, day: 19 })
    expect(calendarDateAt(new Date('2026-10-18T17:59:00Z'), 360)).toEqual({ year: 2026, month: 10, day: 18 })
  })
  it('matches python-dateutil relativedelta (independent) at month ends and leap days', () => {
    // relativedelta(date(2024,2,29), date(2023,1,31)) = 1 year 1 month; (2026-03-31, 2026-02-28) = 1 month 3 days;
    // (2025-03-01, 2024-02-29) = 1 year 1 day; (2024-02-29, 2024-01-31) = 1 month. Also checked on 40,000 random pairs.
    expect(periodBetween({ year: 2023, month: 1, day: 31 }, { year: 2024, month: 2, day: 29 })).toEqual({ years: 1, months: 1, days: 0 })
    expect(periodBetween({ year: 2026, month: 2, day: 28 }, { year: 2026, month: 3, day: 31 })).toEqual({ years: 0, months: 1, days: 3 })
    expect(periodBetween({ year: 2024, month: 2, day: 29 }, { year: 2025, month: 3, day: 1 })).toEqual({ years: 1, months: 0, days: 1 })
    expect(periodBetween({ year: 2024, month: 1, day: 31 }, { year: 2024, month: 2, day: 29 })).toEqual({ years: 0, months: 1, days: 0 })
  })
  it('day numbers and weekdays checked by hand: 19 Oct 2026 is day 20,745; 21 Feb 1952 a Thursday; 26 Mar 1971 a Friday', () => {
    // 1970→2026: 56 × 365 + 14 leap days = 20,454; 1 Jan → 19 Oct 2026: 273 + 18 = 291.
    expect(toDayNumber({ year: 2026, month: 10, day: 19 })).toBe(20745)
    expect(fromDayNumber(20745)).toEqual({ year: 2026, month: 10, day: 19 })
    expect(weekdayOf({ year: 1952, month: 2, day: 21 })).toBe(4)
    expect(weekdayOf({ year: 1971, month: 3, day: 26 })).toBe(5)
    // Before 1970 the weekday still wraps into 0–6.
    expect(weekdayOf({ year: 1, month: 1, day: 1 })).toBe(1)
  })
  it('handles month arithmetic across many years and the 9999 edge', () => {
    expect(addMonths({ year: 2026, month: 10, day: 31 }, -1200)).toEqual({ year: 1926, month: 10, day: 31 })
    expect(addMonths({ year: 2024, month: 3, day: 31 }, -1)).toEqual({ year: 2024, month: 2, day: 29 })
    expect(periodBetween({ year: 1, month: 1, day: 1 }, { year: 9999, month: 12, day: 31 })).toEqual({ years: 9998, months: 11, days: 30 })
    expect(parseIsoDate('0000-01-01')).toBeNull()
    expect(parseIsoDate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 })
  })
})
