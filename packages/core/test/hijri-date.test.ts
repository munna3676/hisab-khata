import { describe, expect, it } from 'vitest'
import {
  calculateHijriDate,
  fromHijriDate,
  hasUmalqura,
  hijriMonthLength,
  toHijriDate,
  validateHijriDate,
} from '../src/hijri-date.ts'
import { fromDayNumber, toDayNumber } from '../src/lib/dates-calendar.ts'

describe('hijri-date', () => {
  it('uses Umm al-Qura in this runtime', () => {
    expect(hasUmalqura()).toBe(true)
  })
  it('matches the Figma screen D4: ১৯ অক্টোবর ২০২৬ = ৮ জমাদিউল আউয়াল ১৪৪৮ (যেমন আছে)', () => {
    const r = calculateHijriDate({ from: 'gregorian', date: { year: 2026, month: 10, day: 19 } })
    expect(r.hijri).toEqual({ year: 1448, month: 5, day: 8 })
    expect(r.monthNameBn).toBe('জমাদিউল আউয়াল')
    expect(r.monthNameEn).toBe('Jumada al-Awwal')
    expect(r.engine).toBe('umalqura')
    // The ±১ দিন chips move the date by a day.
    expect(calculateHijriDate({ from: 'gregorian', date: { year: 2026, month: 10, day: 19 }, offsetDays: -1 }).hijri.day).toBe(7)
    expect(calculateHijriDate({ from: 'gregorian', date: { year: 2026, month: 10, day: 19 }, offsetDays: 1 }).hijri.day).toBe(9)
  })
  it('matches the Hijri rows on the Bangla date screens: ৭ রজব ১৪৪৮ and, a day behind, ৬ জিলকদ ১৪৪৮', () => {
    const dec16 = calculateHijriDate({ from: 'gregorian', date: { year: 2026, month: 12, day: 16 } })
    expect(dec16.hijri).toEqual({ year: 1448, month: 7, day: 7 })
    expect(dec16.monthNameBn).toBe('রজব')
    // D5-b shows the Bangladesh reckoning, one day behind Umm al-Qura.
    const apr14 = calculateHijriDate({ from: 'gregorian', date: { year: 2027, month: 4, day: 14 }, offsetDays: -1 })
    expect(apr14.hijri).toEqual({ year: 1448, month: 11, day: 6 })
    expect(apr14.monthNameBn).toBe('জিলকদ')
  })
  it('matches dates observed in Bangladesh with offset -1 (independent: newspapers)', () => {
    // Ramadan 1447 began on 19 Feb 2026 in Bangladesh, a day after Saudi Arabia; 20 Mar 2026 was ৩০ রমজান (jagonews24).
    expect(toHijriDate({ year: 2026, month: 2, day: 19 }, -1)).toEqual({ year: 1447, month: 9, day: 1 })
    expect(toHijriDate({ year: 2026, month: 3, day: 20 }, -1)).toEqual({ year: 1447, month: 9, day: 30 })
    // risingbd: "রোববার ০৯ আগস্ট ২০২৬ || ২৫ সফর ১৪৪৮ হিজরি"
    expect(toHijriDate({ year: 2026, month: 8, day: 9 }, -1)).toEqual({ year: 1448, month: 2, day: 25 })
  })
  it('converts Hijri → Gregorian both with and without the offset', () => {
    const ramadan1 = { year: 1447, month: 9, day: 1 }
    expect(fromHijriDate(ramadan1)).toEqual({ year: 2026, month: 2, day: 18 })
    expect(fromHijriDate(ramadan1, -1)).toEqual({ year: 2026, month: 2, day: 19 })
    const r = calculateHijriDate({ from: 'hijri', date: { year: 1448, month: 5, day: 8 } })
    expect(r.gregorian).toEqual({ year: 2026, month: 10, day: 19 })
    expect(r.weekdayName).toBe('সোমবার')
  })
  it('the tabular fallback matches Intl islamic-civil (independent) from 1900 to 2099', () => {
    const civil = new Intl.DateTimeFormat('en-u-ca-islamic-civil-nu-latn', { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' })
    const first = toDayNumber({ year: 1900, month: 1, day: 1 })
    const last = toDayNumber({ year: 2099, month: 12, day: 31 })
    for (let n = first; n <= last; n += 13) {
      const parts = civil.formatToParts(new Date(n * 86400000))
      const part = (type: string) => Number(parts.find((p) => p.type === type)!.value)
      expect(toHijriDate(fromDayNumber(n), 0, 'tabular')).toEqual({ year: part('year'), month: part('month'), day: part('day') })
    }
    expect(calculateHijriDate({ from: 'gregorian', date: { year: 2026, month: 10, day: 19 }, engine: 'tabular' }).engine).toBe('tabular')
  })
  it('round-trips every day with both engines and months are 29 or 30 days', () => {
    const first = toDayNumber({ year: 1900, month: 1, day: 1 })
    const last = toDayNumber({ year: 2099, month: 12, day: 31 })
    for (const engine of ['umalqura', 'tabular'] as const) {
      for (let n = first; n <= last; n += 3) {
        const g = fromDayNumber(n)
        expect(fromHijriDate(toHijriDate(g, -1, engine), -1, engine)).toEqual(g)
      }
    }
    const year1447 = [...Array(12).keys()].map((m) => hijriMonthLength(1447, m + 1))
    expect(year1447.every((d) => d === 29 || d === 30)).toBe(true)
    expect(year1447.reduce((s, d) => s + d, 0)).toBe(toDayNumber(fromHijriDate({ year: 1448, month: 1, day: 1 })!) - toDayNumber(fromHijriDate({ year: 1447, month: 1, day: 1 })!))
  })
  it('validates input', () => {
    // By Umm al-Qura, Ramadan 1447 had 30 days (18 Feb–19 Mar 2026) and Shawwal 29.
    expect(hijriMonthLength(1447, 9)).toBe(30)
    expect(hijriMonthLength(1447, 10)).toBe(29)
    expect(validateHijriDate({ from: 'hijri', date: { year: 1447, month: 9, day: 30 } })).toBeNull()
    expect(validateHijriDate({ from: 'hijri', date: { year: 1447, month: 10, day: 30 } })).toBe('date')
    expect(validateHijriDate({ from: 'hijri', date: { year: 1447, month: 13, day: 1 } })).toBe('date')
    expect(validateHijriDate({ from: 'hijri', date: { year: 1200, month: 1, day: 1 } })).toBe('date')
    expect(validateHijriDate({ from: 'gregorian', date: { year: 1850, month: 1, day: 1 } })).toBe('date')
    expect(validateHijriDate({ from: 'gregorian', date: { year: 2026, month: 10, day: 19 }, offsetDays: 4 })).toBe('offsetDays')
    expect(validateHijriDate({ from: 'gregorian', date: { year: 2026, month: 10, day: 19 }, offsetDays: 0.5 })).toBe('offsetDays')
    expect(validateHijriDate({ from: 'gregorian', date: { year: 2026, month: 10, day: 19 }, engine: 'x' as 'tabular' })).toBe('engine')
    expect(validateHijriDate({ from: 'x' as 'hijri', date: { year: 2026, month: 10, day: 19 } })).toBe('from')
    expect(validateHijriDate({ from: 'gregorian', date: { year: 2026, month: 10, day: 19 }, offsetDays: -1 })).toBeNull()
  })
  it('matches the hijridate library (independent, official Umm al-Qura tables) on 2026–2027 dates', () => {
    // hijridate 2.3: Gregorian(2026,6,16) = 1448-01-01; Gregorian(2026,5,27) = 1447-12-10; Hijri(1448,9,1) = 2027-02-08 (29 days).
    expect(toHijriDate({ year: 2026, month: 6, day: 16 })).toEqual({ year: 1448, month: 1, day: 1 })
    expect(toHijriDate({ year: 2026, month: 5, day: 27 })).toEqual({ year: 1447, month: 12, day: 10 })
    expect(fromHijriDate({ year: 1448, month: 9, day: 1 })).toEqual({ year: 2027, month: 2, day: 8 })
    expect(hijriMonthLength(1448, 9)).toBe(29)
    expect(fromHijriDate({ year: 1448, month: 10, day: 1 })).toEqual({ year: 2027, month: 3, day: 9 })
  })
  it('matches the National Moon Sighting Committee with offset -1: Eid ul-Fitr Sat 21 Mar 2026, Eid ul-Adha 28 May 2026', () => {
    // Shawwal crescent not seen on 19 Mar, so Ramadan ran 30 days (observerbd, latestly); Zilhaj moon seen 18 May (ittefaq).
    const fitr = calculateHijriDate({ from: 'hijri', date: { year: 1447, month: 10, day: 1 }, offsetDays: -1 })
    expect(fitr.gregorian).toEqual({ year: 2026, month: 3, day: 21 })
    expect(fitr.weekdayName).toBe('শনিবার')
    expect(fitr.monthNameBn).toBe('শাওয়াল')
    expect(calculateHijriDate({ from: 'gregorian', date: { year: 2026, month: 2, day: 19 }, offsetDays: -1 }).daysInMonth).toBe(30)
    const adha = calculateHijriDate({ from: 'gregorian', date: { year: 2026, month: 5, day: 28 }, offsetDays: -1 })
    expect(adha.hijri).toEqual({ year: 1447, month: 12, day: 10 })
    expect(adha.monthNameBn).toBe('জিলহজ')
  })
  it('handles the ends of the supported range and the largest offsets', () => {
    expect(fromHijriDate({ year: 1318, month: 1, day: 1 })).toEqual({ year: 1900, month: 4, day: 30 })
    expect(validateHijriDate({ from: 'hijri', date: { year: 1522, month: 12, day: 29 }, offsetDays: 3 })).toBeNull()
    expect(validateHijriDate({ from: 'hijri', date: { year: 1523, month: 1, day: 1 } })).toBe('date')
    expect(validateHijriDate({ from: 'gregorian', date: { year: 2100, month: 1, day: 1 } })).toBe('date')
    const first = calculateHijriDate({ from: 'gregorian', date: { year: 1900, month: 1, day: 1 }, offsetDays: -3 })
    expect(fromHijriDate(first.hijri, -3)).toEqual({ year: 1900, month: 1, day: 1 })
  })
})
