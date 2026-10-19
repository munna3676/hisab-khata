import { describe, expect, it } from 'vitest'
import {
  IFB_METHOD,
  calculateRamadanTimetable,
  calculateSehriIftar,
  clockOf,
  validateRamadanTimetable,
  validateSehriIftar,
  type District,
} from '../src/sehri-iftar.ts'
import districtsFact from '../../../data/districts.json' with { type: 'json' }

const districts: District[] = districtsFact.value
const dhaka = districts.find((d) => d.id === 'dhaka')!
const at = (hour: number, minute: number) => hour * 60 + minute
const day = (month: number, d: number) => ({ year: 2026, month, day: d })

describe('sehri-iftar', () => {
  it('matches the Figma example and IFB: ঢাকা, ১৯ ফেব্রুয়ারি ২০২৬ → সেহরি ৫:১২, ইফতার ৫:৫৮', () => {
    const r = calculateSehriIftar({ date: day(2, 19), lat: dhaka.lat, lng: dhaka.lng })
    expect(r.sehri).toBe(at(5, 12))
    expect(r.iftar).toBe(at(17, 58))
    expect(clockOf(r.iftar)).toEqual({ hour: 17, minute: 58 })
  })
  it('matches the Islamic Foundation Ramadan 2026 timetable for Dhaka within ±2 minutes', () => {
    // IFB 1447 AH Dhaka rows (as republished by kivabe.com, probashirdiganta.com, mobiledokan.com).
    const ifb: [number, number, number, number][] = [
      [2, 19, at(5, 12), at(17, 58)],
      [2, 20, at(5, 11), at(17, 58)],
      [2, 21, at(5, 11), at(17, 59)],
      [3, 5, at(5, 1), at(18, 5)],
      [3, 18, at(4, 49), at(18, 10)],
    ]
    for (const [month, d, sehri, iftar] of ifb) {
      const r = calculateSehriIftar({ date: day(month, d), lat: dhaka.lat, lng: dhaka.lng })
      expect(Math.abs(r.sehri - sehri)).toBeLessThanOrEqual(2)
      expect(Math.abs(r.iftar - iftar)).toBeLessThanOrEqual(2)
    }
  })
  it('matches aladhan.com (independent, Karachi 18°) for Dhaka on 18 Mar 2026: Fajr 04:50, Maghrib 18:09', () => {
    const r = calculateSehriIftar({ date: day(3, 18), lat: dhaka.lat, lng: dhaka.lng })
    expect(r.fajr).toBe(at(4, 50))
    expect(r.sunset).toBe(at(18, 9))
    expect(r.sunrise).toBeGreaterThan(r.fajr)
  })
  it('builds the month timetable shown on the screen ("পুরো মাস")', () => {
    const rows = calculateRamadanTimetable({ start: day(2, 19), days: 30, lat: dhaka.lat, lng: dhaka.lng })
    expect(rows).toHaveLength(30)
    expect(rows[0]).toEqual({ roza: 1, date: day(2, 19), weekday: 4, sehri: at(5, 12), iftar: at(17, 58) })
    // Screen rows ২ and ৩: ৫:১১ / ৫:৫৮ and ৫:১১ / ৫:৫৯.
    expect([rows[1]!.sehri, rows[1]!.iftar]).toEqual([at(5, 11), at(17, 58)])
    expect([rows[2]!.sehri, rows[2]!.iftar]).toEqual([at(5, 11), at(17, 59)])
    expect(rows[29]!.date).toEqual(day(3, 20))
    expect(rows[29]!.sehri).toBe(at(4, 47))
  })
  it('keeps every district within IFB\'s stated spread from Dhaka (up to 9 minutes either way)', () => {
    for (const d of districts) {
      const r = calculateSehriIftar({ date: day(2, 19), lat: d.lat, lng: d.lng })
      expect(Math.abs(r.iftar - at(17, 58))).toBeLessThanOrEqual(9)
      expect(Math.abs(r.sehri - at(5, 12))).toBeLessThanOrEqual(9)
    }
    // East is earlier: Sylhet breaks the fast before Rajshahi.
    const sylhet = districts.find((d) => d.id === 'sylhet')!
    const rajshahi = districts.find((d) => d.id === 'rajshahi')!
    expect(calculateSehriIftar({ date: day(2, 19), ...sylhet }).iftar).toBeLessThan(calculateSehriIftar({ date: day(2, 19), ...rajshahi }).iftar)
  })
  it('takes the method as parameters', () => {
    const base = { date: day(2, 19), lat: dhaka.lat, lng: dhaka.lng }
    const r = calculateSehriIftar({ ...base, method: { sehriPrecautionMin: 0, iftarPrecautionMin: 0 } })
    expect(r.sehri).toBe(r.fajr)
    expect(r.iftar).toBe(r.sunset)
    // A deeper dawn angle starts Fajr earlier, about 4–5 minutes per degree here.
    const deeper = calculateSehriIftar({ ...base, method: { fajrAngle: 19 } })
    const shift = calculateSehriIftar(base).fajr - deeper.fajr
    expect(shift).toBeGreaterThanOrEqual(4)
    expect(shift).toBeLessThanOrEqual(5)
    // Another time zone moves the clock, not the sun.
    expect(calculateSehriIftar({ ...base, method: { utcOffsetMinutes: 330 } }).sunset).toBe(calculateSehriIftar(base).sunset - 30)
    expect(IFB_METHOD.fajrAngle).toBe(18)
  })
  it('ships 64 districts in 8 divisions as a sourced Fact', () => {
    expect(districtsFact.checked).toBe('2026-10-19')
    expect(districtsFact.source).toMatch(/^https:\/\//)
    expect(districts).toHaveLength(64)
    expect(new Set(districts.map((d) => d.id)).size).toBe(64)
    expect(new Set(districts.map((d) => d.division)).size).toBe(8)
    for (const d of districts) {
      expect(d.lat).toBeGreaterThan(20.5)
      expect(d.lat).toBeLessThan(26.7)
      expect(d.lng).toBeGreaterThan(88)
      expect(d.lng).toBeLessThan(92.7)
      expect(d.bn).toMatch(/^[ঀ-৿ ]+$/)
    }
  })
  it('validates input', () => {
    const ok = { date: day(2, 19), lat: dhaka.lat, lng: dhaka.lng }
    expect(validateSehriIftar({ ...ok, date: day(2, 30) })).toBe('date')
    expect(validateSehriIftar({ ...ok, lat: 60 })).toBe('lat')
    expect(validateSehriIftar({ ...ok, lat: Number.NaN })).toBe('lat')
    expect(validateSehriIftar({ ...ok, lng: 200 })).toBe('lng')
    expect(validateSehriIftar({ ...ok, method: { fajrAngle: 25 } })).toBe('method')
    expect(validateSehriIftar({ ...ok, method: { sehriPrecautionMin: -1 } })).toBe('method')
    expect(validateSehriIftar(ok)).toBeNull()
    expect(validateRamadanTimetable({ start: day(2, 19), days: 31, lat: dhaka.lat, lng: dhaka.lng })).toBe('days')
    expect(validateRamadanTimetable({ start: day(2, 30), days: 30, lat: dhaka.lat, lng: dhaka.lng })).toBe('start')
    expect(validateRamadanTimetable({ start: day(2, 19), days: 29, lat: 0, lng: 500 })).toBe('lng')
    expect(validateRamadanTimetable({ start: day(2, 19), days: 30, lat: dhaka.lat, lng: dhaka.lng })).toBeNull()
  })
  it('reproduces all 12 published IFB Ramadan 2026 rows for Dhaka to the minute (independent: IFB timetable as republished)', () => {
    // mzamin, dbcnews, educatebd, ekhon.tv, kivabe and the Figma screen; 1/2 whole-minute margins missed 5 of these by a minute.
    const ifb: [number, number, number, number][] = [
      [2, 19, at(5, 12), at(17, 58)], [2, 20, at(5, 11), at(17, 58)], [2, 21, at(5, 11), at(17, 59)],
      [2, 25, at(5, 8), at(18, 1)], [2, 28, at(5, 5), at(18, 2)], [3, 1, at(5, 5), at(18, 3)],
      [3, 5, at(5, 1), at(18, 5)], [3, 10, at(4, 57), at(18, 7)], [3, 12, at(4, 55), at(18, 8)],
      [3, 15, at(4, 52), at(18, 9)], [3, 18, at(4, 49), at(18, 10)], [3, 20, at(4, 47), at(18, 11)],
    ]
    for (const [month, d, sehri, iftar] of ifb) {
      const r = calculateSehriIftar({ date: day(month, d), lat: dhaka.lat, lng: dhaka.lng })
      expect([month, d, r.sehri, r.iftar]).toEqual([month, d, sehri, iftar])
    }
  })
  it('matches PyEphem (independent astronomy library) for Dhaka at both solstices within a minute', () => {
    // ephem 4.2, sun centre at −18° and −0°50′, no extra refraction: 21 Jun 2026 dawn 3:44.3, sunset 18:48.1;
    // 21 Dec 2026 dawn 5:15.3, sunrise 6:36.0, sunset 17:16.5.
    const june = calculateSehriIftar({ date: day(6, 21), lat: dhaka.lat, lng: dhaka.lng })
    expect(Math.abs(june.fajr - 224.3)).toBeLessThanOrEqual(1)
    expect(Math.abs(june.sunset - 1128.1)).toBeLessThanOrEqual(1)
    const december = calculateSehriIftar({ date: day(12, 21), lat: dhaka.lat, lng: dhaka.lng })
    expect(Math.abs(december.fajr - 315.3)).toBeLessThanOrEqual(1)
    expect(Math.abs(december.sunrise - 396.0)).toBeLessThanOrEqual(1)
    expect(Math.abs(december.sunset - 1036.5)).toBeLessThanOrEqual(1)
  })
  it('matches IFB\'s Chattogram row for 19 Feb 2026 (৫:০৫ / ৫:৫৩, mobiledokan) within a minute', () => {
    const ctg = districts.find((d) => d.id === 'chattogram')!
    const r = calculateSehriIftar({ date: day(2, 19), lat: ctg.lat, lng: ctg.lng })
    expect(Math.abs(r.sehri - at(5, 5))).toBeLessThanOrEqual(1)
    expect(Math.abs(r.iftar - at(17, 53))).toBeLessThanOrEqual(1)
  })
  it('keeps the default for a method part passed as undefined', () => {
    const base = { date: day(2, 19), lat: dhaka.lat, lng: dhaka.lng }
    const partial = { fajrAngle: undefined, iftarPrecautionMin: 0 }
    expect(validateSehriIftar({ ...base, method: partial })).toBeNull()
    expect(calculateSehriIftar({ ...base, method: partial }).fajr).toBe(calculateSehriIftar(base).fajr)
    expect(validateSehriIftar({ ...base, method: { utcOffsetMinutes: 360.5 } })).toBe('method')
    expect(clockOf(-10)).toEqual({ hour: 23, minute: 50 })
  })
})
