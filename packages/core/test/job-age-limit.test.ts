import { describe, expect, it } from 'vitest'
import { calculateJobAgeLimit, validateJobAgeLimit, type JobAgeExtension } from '../src/job-age-limit.ts'

// The screen's chips are 30, 32 and 35 years; real limits come from data/jobs/age-limits.json.
const birth = { year: 1997, month: 3, day: 15 }
const referenceDate = { year: 2026, month: 10, day: 31 }

describe('job-age-limit', () => {
  it('matches the Figma example: ১৫ মার্চ ১৯৯৭, ৩১ অক্টোবর ২০২৬, সীমা ৩২ → যোগ্য, ২৯ বছর ৭ মাস ১৬ দিন', () => {
    const r = calculateJobAgeLimit({ birth, referenceDate, limit: { maxYears: 32 } })
    expect(r.status).toBe('eligible')
    expect(r.age).toEqual({ years: 29, months: 7, days: 16 })
    // ৩২ বছর পূর্ণ হবে ১৫ মার্চ ২০২৯; আবেদন করা যাবে ১৪ মার্চ ২০২৯ পর্যন্ত
    expect(r.limitReachedOn).toEqual({ year: 2029, month: 3, day: 15 })
    expect(r.lastEligibleDate).toEqual({ year: 2029, month: 3, day: 14 })
    expect(r.over).toBeNull()
  })
  it('matches the 50th BCS rule (PSC): 21 to 32 years on 1 Nov 2025 → born 2 Nov 1993 to 1 Nov 2004', () => {
    const ref = { year: 2025, month: 11, day: 1 }
    const limit = { minYears: 21, maxYears: 32 }
    const at = (year: number, month: number, day: number) => calculateJobAgeLimit({ birth: { year, month, day }, referenceDate: ref, limit })
    expect(at(1993, 11, 2).status).toBe('eligible')
    expect(at(1993, 11, 2).daysLeft).toBe(0)
    expect(at(1993, 11, 1).status).toBe('too-old')
    expect(at(1993, 11, 1).daysOver).toBe(1)
    expect(at(2004, 11, 1).status).toBe('eligible')
    expect(at(2004, 11, 2).status).toBe('too-young')
    expect(at(2004, 11, 2).wait).toEqual({ years: 0, months: 0, days: 1 })
    expect(at(2004, 11, 2).eligibleFrom).toEqual({ year: 2025, month: 11, day: 2 })
  })
  it('shows time left (hand-checked): limit 30 leaves 4 months 14 days, 134 days', () => {
    const r = calculateJobAgeLimit({ birth, referenceDate, limit: { maxYears: 30 } })
    expect(r.eligible).toBe(true)
    expect(r.lastEligibleDate).toEqual({ year: 2027, month: 3, day: 14 })
    expect(r.left).toEqual({ years: 0, months: 4, days: 14 })
    expect(r.daysLeft).toBe(134)
  })
  it('shows time over when too old', () => {
    const r = calculateJobAgeLimit({ birth: { year: 1990, month: 1, day: 10 }, referenceDate, limit: { maxYears: 30 } })
    expect(r.status).toBe('too-old')
    expect(r.lastEligibleDate).toEqual({ year: 2020, month: 1, day: 9 })
    expect(r.over).toEqual({ years: 6, months: 9, days: 22 })
    expect(r.left).toBeNull()
  })
  it('adds quota extensions together, in years or months', () => {
    const quota: JobAgeExtension = { id: 'quota', years: 2 }
    const covid: JobAgeExtension = { id: 'covid-relaxation', years: 0, months: 21 }
    const r = calculateJobAgeLimit({ birth: { year: 1995, month: 6, day: 1 }, referenceDate, limit: { maxYears: 30 }, extensions: [quota, covid] })
    expect(r.maxAge).toEqual({ years: 33, months: 9 })
    expect(r.limitReachedOn).toEqual({ year: 2029, month: 3, day: 1 })
    const noExt = calculateJobAgeLimit({ birth: { year: 1995, month: 6, day: 1 }, referenceDate, limit: { maxYears: 30 } })
    expect(noExt.status).toBe('too-old')
  })
  it('can accept the day the limit is completed when a circular says so', () => {
    const onBirthday = { birth: { year: 1994, month: 10, day: 31 }, referenceDate, limit: { maxYears: 32 } }
    expect(calculateJobAgeLimit(onBirthday).status).toBe('too-old')
    expect(calculateJobAgeLimit({ ...onBirthday, limitDayIncluded: true }).status).toBe('eligible')
  })
  it('validates input', () => {
    const ok = { birth, referenceDate, limit: { maxYears: 32 } }
    expect(validateJobAgeLimit({ ...ok, birth: { year: 1997, month: 2, day: 29 } })).toBe('birth')
    expect(validateJobAgeLimit({ ...ok, referenceDate: birth })).toBe('referenceDate')
    expect(validateJobAgeLimit({ ...ok, limit: { maxYears: 0 } })).toBe('limit')
    expect(validateJobAgeLimit({ ...ok, limit: { minYears: 32, maxYears: 32 } })).toBe('limit')
    expect(validateJobAgeLimit({ ...ok, limit: { maxYears: 32.5 } })).toBe('limit')
    expect(validateJobAgeLimit({ ...ok, extensions: [{ id: 'x', years: -1 }] })).toBe('extensions')
    expect(validateJobAgeLimit(ok)).toBeNull()
  })
  it('matches the 47th BCS rule (21–32 years on 1 Nov 2024, deshrupantor/prothomalo) by the same PSC reading: born 2 Nov 1992 to 1 Nov 2003', () => {
    const ref = { year: 2024, month: 11, day: 1 }
    const limit = { minYears: 21, maxYears: 32 }
    const at = (year: number, month: number, day: number) => calculateJobAgeLimit({ birth: { year, month, day }, referenceDate: ref, limit })
    // Hand check: born 2 Nov 1992 is 31 years 11 months 30 days on 1 Nov 2024; born 1 Nov 1992 has just completed 32.
    expect(at(1992, 11, 2)).toMatchObject({ status: 'eligible', age: { years: 31, months: 11, days: 30 }, daysLeft: 0 })
    expect(at(1992, 11, 1)).toMatchObject({ status: 'too-old', age: { years: 32, months: 0, days: 0 }, over: { years: 0, months: 0, days: 1 } })
    expect(at(2003, 11, 1).status).toBe('eligible')
    expect(at(2003, 11, 2)).toMatchObject({ status: 'too-young', wait: { years: 0, months: 0, days: 1 } })
  })
  it('works the Figma chips ৩৫ বছর by hand (dateutil): 5 years 4 months 14 days, 1,961 days left', () => {
    const r = calculateJobAgeLimit({ birth, referenceDate, limit: { maxYears: 35 } })
    expect(r.limitReachedOn).toEqual({ year: 2032, month: 3, day: 15 })
    expect(r.lastEligibleDate).toEqual({ year: 2032, month: 3, day: 14 })
    expect(r.left).toEqual({ years: 5, months: 4, days: 14 })
    expect(r.daysLeft).toBe(1961)
  })
  it('puts a 29 February birthday on 28 February in a common year, on 29 February in a leap year', () => {
    const leapBirth = { year: 1996, month: 2, day: 29 }
    const r30 = calculateJobAgeLimit({ birth: leapBirth, referenceDate: { year: 2026, month: 2, day: 27 }, limit: { maxYears: 30 } })
    expect(r30).toMatchObject({ status: 'eligible', limitReachedOn: { year: 2026, month: 2, day: 28 }, daysLeft: 0 })
    expect(r30.age).toEqual({ years: 29, months: 11, days: 29 })
    const r32 = calculateJobAgeLimit({ birth: leapBirth, referenceDate: { year: 2026, month: 2, day: 27 }, limit: { maxYears: 32 } })
    expect(r32.limitReachedOn).toEqual({ year: 2028, month: 2, day: 29 })
  })
  it('normalises extensions given in months over a year', () => {
    const r = calculateJobAgeLimit({ birth, referenceDate, limit: { maxYears: 30 }, extensions: [{ id: 'relax', years: 0, months: 30 }] })
    expect(r.maxAge).toEqual({ years: 32, months: 6 })
    expect(r.limitReachedOn).toEqual({ year: 2029, month: 9, day: 15 })
  })
  it('rejects data that would make the limit NaN', () => {
    const ok = { birth, referenceDate, limit: { maxYears: 32 } }
    expect(validateJobAgeLimit({ ...ok, extensions: [{ id: 'x', months: 21 } as unknown as JobAgeExtension] })).toBe('extensions')
    expect(validateJobAgeLimit({ ...ok, extensions: [{ id: 'x', years: 1, months: 1.5 }] })).toBe('extensions')
    expect(validateJobAgeLimit({ ...ok, limit: undefined as unknown as { maxYears: number } })).toBe('limit')
    expect(validateJobAgeLimit({ ...ok, referenceDate: { year: 2026, month: 2, day: 29 } })).toBe('referenceDate')
  })
})
