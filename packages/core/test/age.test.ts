import { describe, expect, it } from 'vitest'
import { calculateAge, validateAge } from '../src/age.ts'

describe('age', () => {
  it('matches the Figma example: ১৫ মার্চ ২০০০ → ১৯ অক্টোবর ২০২৬ = ২৬ বছর ৭ মাস ৪ দিন', () => {
    const r = calculateAge({ birth: { year: 2000, month: 3, day: 15 }, on: { year: 2026, month: 10, day: 19 } })
    expect([r.years, r.months, r.days]).toEqual([26, 7, 4])
    expect(r.totalMonths).toBe(319)
    expect(r.totalWeeks).toBe(1387)
    expect(r.totalDays).toBe(9714)
    // পরের জন্মদিন ১৪৭ দিন পর (১৫ মার্চ ২০২৭)
    expect(r.nextBirthday).toEqual({ date: { year: 2027, month: 3, day: 15 }, daysLeft: 147, turning: 27, weekday: 1 })
  })
  it('matches a hand-checked value: 1 Jan 1990 → 1 Jan 2020 is 30 years, 10,957 days (7 leap days)', () => {
    const r = calculateAge({ birth: { year: 1990, month: 1, day: 1 }, on: { year: 2020, month: 1, day: 1 } })
    expect([r.years, r.months, r.days]).toEqual([30, 0, 0])
    expect(r.totalDays).toBe(30 * 365 + 7)
    expect(r.extraDays).toBe((30 * 365 + 7) % 7)
    expect(r.bornOnWeekday).toBe(1) // 1 Jan 1990 was a Monday
    // On the birthday itself the countdown is 0; the year after is 366 days away (2020 is leap).
    expect(r.nextBirthday.daysLeft).toBe(0)
    const dayAfter = calculateAge({ birth: { year: 1990, month: 1, day: 1 }, on: { year: 2020, month: 1, day: 2 } })
    expect(dayAfter.nextBirthday.daysLeft).toBe(365)
  })
  it('a 29 February birthday falls on 28 February in a common year', () => {
    const birth = { year: 2000, month: 2, day: 29 }
    const r = calculateAge({ birth, on: { year: 2001, month: 2, day: 28 } })
    expect([r.years, r.months, r.days]).toEqual([1, 0, 0])
    const before = calculateAge({ birth, on: { year: 2001, month: 2, day: 27 } })
    expect(before.nextBirthday.date).toEqual({ year: 2001, month: 2, day: 28 })
    expect(calculateAge({ birth, on: { year: 2004, month: 2, day: 29 } }).years).toBe(4)
  })
  it('counts a month at the end of a shorter month', () => {
    const r = calculateAge({ birth: { year: 2026, month: 1, day: 31 }, on: { year: 2026, month: 3, day: 1 } })
    expect([r.years, r.months, r.days]).toEqual([0, 1, 1])
  })
  it('handles zero: born today', () => {
    const r = calculateAge({ birth: { year: 2026, month: 10, day: 19 }, on: { year: 2026, month: 10, day: 19 } })
    expect([r.years, r.months, r.days, r.totalDays]).toEqual([0, 0, 0, 0])
    expect(r.nextBirthday).toMatchObject({ date: { year: 2027, month: 10, day: 19 }, daysLeft: 365, turning: 1 })
  })
  it('handles very large spans: 1 Jan 0001 → 31 Dec 9999', () => {
    const r = calculateAge({ birth: { year: 1, month: 1, day: 1 }, on: { year: 9999, month: 12, day: 31 } })
    expect([r.years, r.months, r.days]).toEqual([9998, 11, 30])
    expect(r.totalDays).toBe(3652058)
  })
  it('validates input', () => {
    const on = { year: 2026, month: 10, day: 19 }
    expect(validateAge({ birth: { year: 2026, month: 2, day: 30 }, on })).toBe('birth')
    expect(validateAge({ birth: { year: 2000, month: 13, day: 1 }, on })).toBe('birth')
    expect(validateAge({ birth: { year: 2027, month: 1, day: 1 }, on })).toBe('on')
    expect(validateAge({ birth: { year: 2000, month: 1, day: 1 }, on: { year: 2026, month: 10, day: 1.5 } })).toBe('on')
    expect(validateAge({ birth: { year: 2000, month: 3, day: 15 }, on })).toBeNull()
  })
  it('matches python-dateutil (independent): ১৬ ডিসেম্বর ১৯৭১ → ১৯ অক্টোবর ২০২৬ = ৫৪ বছর ১০ মাস ৩ দিন, 20,031 days', () => {
    // relativedelta(date(2026,10,19), date(1971,12,16)) = 54y 10m 3d; by hand: 16 Dec 2025 + 10 months = 16 Oct 2026, + 3 days.
    const r = calculateAge({ birth: { year: 1971, month: 12, day: 16 }, on: { year: 2026, month: 10, day: 19 } })
    expect([r.years, r.months, r.days]).toEqual([54, 10, 3])
    expect(r.totalMonths).toBe(658)
    expect(r.totalDays).toBe(20031)
    expect(r.bornOnWeekday).toBe(4) // Thursday
    // 19 Oct → 16 Dec 2026: 12 + 30 + 16 = 58 days, a Wednesday.
    expect(r.nextBirthday).toEqual({ date: { year: 2026, month: 12, day: 16 }, daysLeft: 58, turning: 55, weekday: 3 })
  })
  it('matches python-dateutil for a 29 February birthday: ২৯ ফেব্রুয়ারি ২০০৪ → ১৯ অক্টোবর ২০২৬ = ২২ বছর ৭ মাস ২০ দিন', () => {
    const birth = { year: 2004, month: 2, day: 29 }
    const r = calculateAge({ birth, on: { year: 2026, month: 10, day: 19 } })
    expect([r.years, r.months, r.days]).toEqual([22, 7, 20])
    expect(r.totalDays).toBe(8268)
    // 2027 is a common year, so the next birthday is kept on 28 February: 132 days away.
    expect(r.nextBirthday).toMatchObject({ date: { year: 2027, month: 2, day: 28 }, daysLeft: 132, turning: 23 })
    // dateutil: 29 Feb 2000 → 1 Mar 2001 = 1 year 1 day.
    expect(calculateAge({ birth: { year: 2000, month: 2, day: 29 }, on: { year: 2001, month: 3, day: 1 } })).toMatchObject({ years: 1, months: 0, days: 1, totalDays: 366 })
  })
  it('the day before a birthday is still the old age, with one day left', () => {
    const r = calculateAge({ birth: { year: 2000, month: 3, day: 15 }, on: { year: 2027, month: 3, day: 14 } })
    expect([r.years, r.months, r.days]).toEqual([26, 11, 27])
    expect(r.nextBirthday).toMatchObject({ daysLeft: 1, turning: 27 })
  })
})
