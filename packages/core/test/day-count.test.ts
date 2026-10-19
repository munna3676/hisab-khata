import { describe, expect, it } from 'vitest'
import { calculateAddDays, calculateDayCount, validateAddDays, validateDayCount, type WorkCalendar } from '../src/day-count.ts'

// Weekend and holidays in the shape of data/dates/weekend.json and holidays-2026.json, test-only.
const BD_WORK: WorkCalendar = {
  weekend: [5, 6],
  holidays: [
    { date: '2026-10-21', name: 'test holiday on a Wednesday' },
    { date: '2026-10-23', name: 'test holiday on a Friday' },
    { date: '2026-11-05', name: 'outside the range' },
  ],
}
const jan1 = { year: 2026, month: 1, day: 1 }
const oct19 = { year: 2026, month: 10, day: 19 }

describe('day-count', () => {
  it('matches the Figma example: ১ জানুয়ারি → ১৯ অক্টোবর ২০২৬ = ২৯১ দিন, ৪১ সপ্তাহ ৪ দিন, ৯ মাস ১৮ দিন', () => {
    const r = calculateDayCount({ start: jan1, end: oct19, includeEnd: false })
    expect(r.days).toBe(291)
    expect([r.weeks, r.extraDays]).toEqual([41, 4])
    expect(r.period).toEqual({ years: 0, months: 9, days: 18 })
    expect(r.hours).toBe(6984)
    // শেষ দিন গুনলে ২৯২ দিন
    expect(r.daysWithEnd).toBe(292)
    expect(r.working).toBeNull()
  })
  it('counts the end day when asked', () => {
    const r = calculateDayCount({ start: jan1, end: oct19, includeEnd: true })
    expect(r.days).toBe(292)
    expect(r.daysWithoutEnd).toBe(291)
    expect(r.period).toEqual({ years: 0, months: 9, days: 19 })
  })
  it('matches a hand-checked year: 2026 has 104 Fridays and Saturdays, so 261 working days', () => {
    const r = calculateDayCount({ start: jan1, end: { year: 2026, month: 12, day: 31 }, includeEnd: true, work: { weekend: [5, 6] } })
    expect(r.days).toBe(365)
    expect(r.working).toMatchObject({ workingDays: 261, weekendDays: 104, holidayDays: 0 })
  })
  it('takes out holidays, once, and lists the ones in range', () => {
    // October 2026 starts on a Thursday: 5 Fridays + 5 Saturdays.
    const r = calculateDayCount({ start: { year: 2026, month: 10, day: 1 }, end: { year: 2026, month: 10, day: 31 }, includeEnd: true, work: BD_WORK })
    expect(r.working).toMatchObject({ workingDays: 20, weekendDays: 10, holidayDays: 1 })
    expect(r.working!.holidays.map((h) => h.date)).toEqual(['2026-10-21', '2026-10-23'])
  })
  it('swaps dates given backwards', () => {
    const r = calculateDayCount({ start: oct19, end: jan1, includeEnd: false })
    expect(r.reversed).toBe(true)
    expect(r.days).toBe(291)
  })
  it('handles zero and very large spans', () => {
    const same = calculateDayCount({ start: oct19, end: oct19, includeEnd: false, work: BD_WORK })
    expect([same.days, same.daysWithEnd]).toEqual([0, 1])
    expect(same.working).toMatchObject({ workingDays: 0, weekendDays: 0, holidayDays: 0 })
    const huge = calculateDayCount({ start: { year: 1, month: 1, day: 1 }, end: { year: 9999, month: 12, day: 31 }, includeEnd: true, work: { weekend: [5, 6] } })
    expect(huge.days).toBe(3652059)
    // 521,722 whole weeks from Monday 1 Jan 0001, then Mon–Fri: one more Friday.
    expect(huge.working).toMatchObject({ weekendDays: 521722 * 2 + 1, workingDays: 3652059 - 1043445 })
  })
  it('adds and subtracts days', () => {
    expect(calculateAddDays({ date: oct19, days: 100 })).toEqual({ date: { year: 2027, month: 1, day: 27 }, weekday: 3, calendarDays: 100 })
    expect(calculateAddDays({ date: oct19, days: -291 }).date).toEqual(jan1)
    expect(calculateAddDays({ date: oct19, days: 0 }).date).toEqual(oct19)
  })
  it('adds working days, skipping the weekend and holidays', () => {
    const thu = { year: 2026, month: 10, day: 15 }
    expect(calculateAddDays({ date: thu, days: 1, workingDaysOnly: true, work: { weekend: [5, 6] } }).date).toEqual({ year: 2026, month: 10, day: 18 })
    const withHoliday = { weekend: [5, 6], holidays: [{ date: '2026-10-18' }] }
    expect(calculateAddDays({ date: thu, days: 1, workingDaysOnly: true, work: withHoliday })).toEqual({ date: oct19, weekday: 1, calendarDays: 4 })
    expect(calculateAddDays({ date: oct19, days: -1, workingDaysOnly: true, work: withHoliday }).date).toEqual(thu)
  })
  it('validates input', () => {
    expect(validateDayCount({ start: { year: 2026, month: 2, day: 29 }, end: oct19, includeEnd: false })).toBe('start')
    expect(validateDayCount({ start: jan1, end: { year: 2026, month: 0, day: 1 }, includeEnd: false })).toBe('end')
    expect(validateDayCount({ start: jan1, end: oct19, includeEnd: false, work: { weekend: [7] } })).toBe('work')
    expect(validateDayCount({ start: jan1, end: oct19, includeEnd: false, work: { weekend: [5], holidays: [{ date: '2026-13-01' }] } })).toBe('work')
    expect(validateDayCount({ start: jan1, end: oct19, includeEnd: true, work: BD_WORK })).toBeNull()
    expect(validateAddDays({ date: oct19, days: 1.5 })).toBe('days')
    expect(validateAddDays({ date: { year: 9999, month: 12, day: 31 }, days: 1 })).toBe('days')
    expect(validateAddDays({ date: oct19, days: 5, workingDaysOnly: true })).toBe('work')
    expect(validateAddDays({ date: oct19, days: 5, workingDaysOnly: true, work: { weekend: [0, 1, 2, 3, 4, 5, 6] } })).toBe('work')
    expect(validateAddDays({ date: oct19, days: -5, workingDaysOnly: true, work: BD_WORK })).toBeNull()
  })
  it('counts working days by hand: leap 2024 (starts Monday) 262, Q1 2026 (Thu 1 Jan–Tue 31 Mar) 64', () => {
    // 2024: 52 weeks + Mon, Tue → 104 Fridays and Saturdays, 366 − 104 = 262.
    const y2024 = calculateDayCount({ start: { year: 2024, month: 1, day: 1 }, end: { year: 2024, month: 12, day: 31 }, includeEnd: true, work: { weekend: [5, 6] } })
    expect(y2024.days).toBe(366)
    expect(y2024.working).toMatchObject({ workingDays: 262, weekendDays: 104 })
    expect(y2024.period).toEqual({ years: 1, months: 0, days: 0 })
    // Q1 2026: 12 weeks + Thu–Tue (one Friday, one Saturday) → 26 off, 90 − 26 = 64.
    const q1 = calculateDayCount({ start: jan1, end: { year: 2026, month: 3, day: 31 }, includeEnd: true, work: { weekend: [5, 6] } })
    expect([q1.days, q1.working!.weekendDays, q1.working!.workingDays]).toEqual([90, 26, 64])
  })
  it('adds days like Python datetime (independent): +1000 → Sun 15 Jul 2029, −10,000 → 3 Jun 1999', () => {
    expect(calculateAddDays({ date: oct19, days: 1000 })).toEqual({ date: { year: 2029, month: 7, day: 15 }, weekday: 0, calendarDays: 1000 })
    expect(calculateAddDays({ date: oct19, days: -10000 }).date).toEqual({ year: 1999, month: 6, day: 3 })
    // 10 working days (Sun–Thu) after Mon 19 Oct 2026 is Mon 2 Nov; 10 before is Mon 5 Oct.
    const work = { weekend: [5, 6] }
    expect(calculateAddDays({ date: oct19, days: 10, workingDaysOnly: true, work })).toEqual({ date: { year: 2026, month: 11, day: 2 }, weekday: 1, calendarDays: 14 })
    expect(calculateAddDays({ date: oct19, days: -10, workingDaysOnly: true, work }).date).toEqual({ year: 2026, month: 10, day: 5 })
  })
  it('lists a weekend holiday once without taking it off twice, and counts duplicate holidays once', () => {
    const work: WorkCalendar = { weekend: [5, 6], holidays: [{ date: '2026-10-23', name: 'Fri' }, { date: '2026-10-22', name: 'Thu' }, { date: '2026-10-22', name: 'Thu again' }] }
    const r = calculateDayCount({ start: { year: 2026, month: 10, day: 18 }, end: { year: 2026, month: 10, day: 24 }, includeEnd: true, work })
    // Sun 18 – Sat 24 Oct: 7 days, Fri + Sat off, Thu a holiday → 4 working days.
    expect(r.working).toMatchObject({ workingDays: 4, weekendDays: 2, holidayDays: 1 })
    expect(r.working!.holidays.map((h) => h.name)).toEqual(['Thu', 'Fri'])
    // Without the end day, Saturday 24 Oct drops out of every count.
    const open = calculateDayCount({ start: { year: 2026, month: 10, day: 18 }, end: { year: 2026, month: 10, day: 24 }, includeEnd: false, work })
    expect(open.working).toMatchObject({ workingDays: 4, weekendDays: 1, holidayDays: 1 })
  })
  it('rejects a work calendar without a weekend list instead of throwing', () => {
    const broken = { weekend: undefined } as unknown as WorkCalendar
    expect(validateDayCount({ start: jan1, end: oct19, includeEnd: false, work: broken })).toBe('work')
    expect(validateAddDays({ date: oct19, days: 1, workingDaysOnly: true, work: { weekend: [5, 6], holidays: [{ date: '19-10-2026' }] } })).toBe('work')
  })
})
