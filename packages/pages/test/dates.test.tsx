// Date tools (Figma D1–D5, D5-b, P5) against the Figma example values. "Today" is frozen at
// 19 Oct 2026 (Figma's today) where a model needs it. Where Figma and the engine disagree, the
// engine wins and the test name says so (Hijri: data offset -1, Bangladesh moon sighting).
import type { HijriOffsetFile, JobAgeLimitFile, SpecialDaysFile } from '@hisab/data/types'
import { checkDataFile } from '@hisab/data/checks'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ageJson from '../../../data/jobs/govt-age-limit.json' with { type: 'json' }
import offsetJson from '../../../data/dates/hijri-offset.json' with { type: 'json' }
import specialJson from '../../../data/dates/special-days.json' with { type: 'json' }
import { AgeCalculator } from '../src/age/AgeCalculator.tsx'
import { ageContent } from '../src/age/content.ts'
import { COPY as AGE } from '../src/age/copy.ts'
import { ageOutcome } from '../src/age/model.ts'
import { banglaDateContent } from '../src/bangla-date/content.ts'
import { COPY as BD } from '../src/bangla-date/copy.ts'
import { banglaDateOutcome } from '../src/bangla-date/model.ts'
import { COPY as DC } from '../src/day-count/copy.ts'
import { dayCountOutcome } from '../src/day-count/model.ts'
import { COPY as HIJRI } from '../src/hijri-date/copy.ts'
import { hijriOutcome } from '../src/hijri-date/model.ts'
import { jobAgeContent } from '../src/job-age-limit/content.ts'
import { COPY as JOB } from '../src/job-age-limit/copy.ts'
import { jobAgeOutcome } from '../src/job-age-limit/model.ts'
import { JOB_AGE_PARAMS } from '../src/job-age-limit/params.ts'
import { islandText } from '../src/tool/island-text.ts'
import { localize } from '../src/tool/text.ts'
import { resolveDate, todayInBangladesh } from '../src/tool/today.ts'
import { readParams, writeParams } from '../src/tool/url-state.ts'
import { AGE_PARAMS } from '../src/age/params.ts'
import { BANGLA_DATE_PARAMS } from '../src/bangla-date/params.ts'

const jobFile = ageJson as unknown as JobAgeLimitFile
const offsetFile = offsetJson as unknown as HijriOffsetFile
const specialFile = specialJson as unknown as SpecialDaysFile
const d = (year: number, month: number, day: number) => ({ year, month, day })
const TODAY = d(2026, 10, 19)
const rows = (summary: { label: string; value: string }[]) => summary.map((r) => [r.label, r.value])

function result<T>(o: { kind: string; result?: T }): T {
  if (o.kind !== 'result') throw new Error(`expected a result, got ${o.kind}`)
  return o.result as T
}

describe('data these pages use', () => {
  it('is valid, and the link defaults match it', () => {
    expect(checkDataFile('jobs/govt-age-limit.json', jobFile)).toEqual([])
    expect(checkDataFile('dates/hijri-offset.json', offsetFile)).toEqual([])
    expect(checkDataFile('dates/special-days.json', specialFile)).toEqual([])
    expect(JOB_AGE_PARAMS.max.default).toBe(jobFile.value.maxYears)
    expect(jobFile.value.presets).toContain(JOB_AGE_PARAMS.max.default)
    expect(offsetFile.value).toBe(-1)
  })
  it('pages with data show "যাচাই বাকি" while the Facts are unverified; formula pages have no line', () => {
    expect(jobAgeContent('bn', jobFile).data?.verified).toBe(false)
    expect(banglaDateContent('bn', specialFile, offsetFile).data?.verified).toBe(false)
    expect(ageContent('bn').data).toBeUndefined()
  })
  it('date tools use the registry breadcrumb ("তারিখ ও বয়স")', () => {
    expect(ageContent('bn').crumbs.map((c) => c.label)).toEqual(['হোম', 'তারিখ ও বয়স', 'বয়স'])
    expect(ageContent('en').crumbs.map((c) => c.label)).toEqual(['Home', 'Date and age', 'Age'])
  })
})

describe('date params', () => {
  it('read and write dates and "today"', () => {
    expect(writeParams(AGE_PARAMS, { birth: '2000-03-15', on: 'today' })).toBe('')
    expect(writeParams(AGE_PARAMS, { birth: '1999-01-02', on: '2027-01-01' })).toBe('?birth=1999-01-02&on=2027-01-01')
    expect(readParams(AGE_PARAMS, '?birth=1999-02-29&on=today').issues).toEqual([{ key: 'birth', value: '1999-02-29', reason: 'invalid' }])
    expect(readParams(AGE_PARAMS, '?birth=today').issues[0]?.reason).toBe('invalid')
    expect(readParams(AGE_PARAMS, '?birth=1850-01-01').issues[0]?.reason).toBe('min')
    // A Bangla date only checks the shape: ৩১ জ্যৈষ্ঠ is fine, the engine checks the month length.
    expect(readParams(BANGLA_DATE_PARAMS, '?dir=to-en&bdate=1433-02-31').values.bdate).toBe('1433-02-31')
  })
  it('"today" is the day in Bangladesh (UTC+6)', () => {
    expect(todayInBangladesh(new Date('2026-10-18T19:00:00Z'))).toEqual(TODAY)
    expect(resolveDate('today', TODAY)).toEqual(TODAY)
    expect(resolveDate('2026-02-30', TODAY)).toBeNull()
  })
})

describe('Age (Figma D1)', () => {
  const run = (birth = d(2000, 3, 15), on = TODAY, lang: 'bn' | 'en' = 'bn') => ageOutcome({ lang, copy: localize(AGE, lang), birth, on })
  it('D1: 15 Mar 2000 on 19 Oct 2026 → ২৬ বছর ৭ মাস ৪ দিন', () => {
    const r = result(run())
    expect([r.label, r.text, r.sub]).toEqual(['তোমার বয়স', '২৬ বছর ৭ মাস ৪ দিন', 'পরের জন্মদিন ১৪৭ দিন পর (১৫ মার্চ ২০২৭)'])
    expect(rows(r.summary)).toEqual([
      ['মোট মাস', '৩১৯'],
      ['মোট সপ্তাহ', '১,৩৮৭'],
      ['মোট দিন', '৯,৭১৪'],
    ])
  })
  it('English', () => {
    const r = result(run(undefined, undefined, 'en'))
    expect([r.text, r.sub]).toEqual(['26 years 7 months 4 days', 'Next birthday in 147 days (15 March 2027)'])
  })
  it('on the birthday, and a date before birth is an error with a fix', () => {
    expect(result(run(d(2000, 3, 15), d(2027, 3, 15))).sub).toBe('আজ জন্মদিন! ২৭ বছর পূর্ণ হলো')
    const o = run(d(2000, 3, 15), d(1999, 1, 1))
    expect(o.kind).toBe('error')
    if (o.kind === 'error') expect(o.error.fix?.label).toBe('আজকের হিসাবে দেখাও')
  })
})

describe('Job age limit (Figma D2)', () => {
  const rule = { minYears: jobFile.value.minYears, limitDayIncluded: jobFile.value.limitDayIncluded }
  const run = (birth = d(1997, 3, 15), ref = d(2026, 10, 31), max = 32) => jobAgeOutcome({ lang: 'bn', copy: localize(JOB, 'bn'), birth, ref, maxYears: max, rule })
  it('D2: born 15 Mar 1997, circular 31 Oct 2026, limit 32 → যোগ্য', () => {
    const r = result(run())
    expect([r.label, r.text, r.sub]).toEqual(['আবেদন করা যাবে', 'যোগ্য ✓', 'ওই তারিখে বয়স ২৯ বছর ৭ মাস ১৬ দিন · সীমা ৩২ বছর'])
    expect(rows(r.summary)).toEqual([
      ['৩২ বছর পূর্ণ হবে', '১৫ মার্চ ২০২৯'],
      ['গণনার তারিখ এর আগে হলে আবেদন করা যাবে', '১৪ মার্চ ২০২৯ পর্যন্ত'],
    ])
  })
  it('over the limit, and a reference date before birth', () => {
    const r = result(run(d(1997, 3, 15), d(2026, 10, 31), 29))
    expect([r.label, r.text]).toEqual(['আবেদন করা যাবে না', 'সীমা পার ✗'])
    expect(r.sub).toContain('৭ মাস ১৭ দিন আগে সীমা পেরিয়েছে')
    expect(run(d(1997, 3, 15), d(1990, 1, 1)).kind).toBe('error')
  })
})

describe('Bangla date (Figma D3, D5-b)', () => {
  const run = (dir: 'to-bn' | 'to-en', lang: 'bn' | 'en' = 'bn', bdate = d(1434, 1, 1)) =>
    banglaDateOutcome({ lang, copy: localize(BD, lang), dir, date: d(2026, 12, 16), bdate, specialDays: specialFile.value, hijriOffset: offsetFile.value })
  it('D3: 16 Dec 2026 → ১ পৌষ ১৪৩৩ (Hijri ৬ রজব with the data offset -1; Figma ৭ রজব is Umm al-Qura without it)', () => {
    const r = result(run('to-bn'))
    expect([r.label, r.text, r.sub]).toEqual(['বাংলা তারিখ', '১ পৌষ ১৪৩৩', 'বুধবার · শীতকাল · বিজয় দিবস'])
    expect(rows(r.summary)).toEqual([
      ['বাংলা মাস', 'পৌষ'],
      ['ঋতু', 'শীত'],
      ['বার', 'বুধবার'],
      ['হিজরি (আনুমানিক)', '৬ রজব ১৪৪৮'],
    ])
  })
  it('D5-b: ১ বৈশাখ ১৪৩৪ → ১৪ এপ্রিল ২০২৭ (Hijri ৬ জিলকদ, as Figma)', () => {
    const r = result(run('to-en'))
    expect([r.label, r.text, r.sub]).toEqual(['ইংরেজি তারিখ', '১৪ এপ্রিল ২০২৭', 'বুধবার · গ্রীষ্মকাল · পহেলা বৈশাখ'])
    expect(rows(r.summary)).toEqual([
      ['ইংরেজি মাস', 'এপ্রিল'],
      ['ঋতু', 'গ্রীষ্ম'],
      ['বার', 'বুধবার'],
      ['হিজরি (আনুমানিক)', '৬ জিলকদ ১৪৪৮'],
    ])
  })
  it('English names', () => {
    const r = result(run('to-bn', 'en'))
    expect([r.text, r.sub]).toEqual(['1 Poush 1433', 'Wednesday · Winter · Victory Day'])
  })
  it('a day the Bangla month does not have is an error with a fix (কার্তিক has 30 days)', () => {
    const o = run('to-en', 'bn', d(1433, 7, 31))
    expect(o.kind).toBe('error')
    if (o.kind === 'error') {
      expect(o.error.title).toBe('কার্তিক মাসে ৩০ দিন')
      expect(o.error.fix).toEqual({ label: '৩০ কার্তিক দিয়ে দেখাও', field: 'bday', value: 30 })
    }
  })
})

describe('Hijri date (Figma D4)', () => {
  const run = (adjust = 0, date = TODAY, isToday = true) => hijriOutcome({ lang: 'bn', copy: localize(HIJRI, 'bn'), date, isToday, offset: offsetFile.value, adjust })
  it('D4: 19 Oct 2026 → ৭ জমাদিউল আউয়াল with the data offset -1 (Figma shows ৮, raw Umm al-Qura)', () => {
    const r = result(run())
    expect([r.label, r.text, r.sub, r.title]).toEqual(['হিজরি তারিখ (আনুমানিক)', '৭ জমাদিউল আউয়াল', '১৪৪৮ হিজরি · চাঁদ দেখার উপর ±১ দিন হতে পারে', 'আজ'])
    expect(rows(r.summary)).toEqual([
      ['ইংরেজি', '১৯ অক্টোবর ২০২৬'],
      ['বাংলা', '৩ কার্তিক ১৪৩৩'],
      ['হিজরি', '৭ জমাদিউল আউয়াল ১৪৪৮'],
    ])
  })
  it('+১ দিন gives the raw Umm al-Qura date Figma shows; another day is titled "এই দিন"', () => {
    expect(result(run(1)).text).toBe('৮ জমাদিউল আউয়াল')
    expect(result(run(0, d(2027, 4, 14), false)).title).toBe('এই দিন')
  })
})

describe('Day count (Figma D5)', () => {
  const run = (includeEnd = false, start = d(2026, 1, 1), end = TODAY) => dayCountOutcome({ lang: 'bn', copy: localize(DC, 'bn'), start, end, includeEnd })
  it('D5: 1 Jan → 19 Oct 2026 → ২৯১ দিন', () => {
    const r = result(run())
    expect([r.label, r.value, r.suffix, r.sub]).toEqual(['মাঝে আছে', 291, ' দিন', '৪১ সপ্তাহ ৪ দিন · শেষ দিন গুনলে ২৯২ দিন'])
    expect(rows(r.summary)).toEqual([
      ['মাস ও দিন', '৯ মাস ১৮ দিন'],
      ['সপ্তাহ', '৪১ সপ্তাহ ৪ দিন'],
      ['ঘণ্টা', '৬,৯৮৪'],
    ])
  })
  it('counting the last day, and an end before the start', () => {
    expect(result(run(true)).sub).toBe('৪১ সপ্তাহ ৫ দিন · শেষ দিন বাদে ২৯১ দিন')
    expect(result(run(false, TODAY, d(2026, 1, 1))).sub).toContain('উল্টো দিকে গোনা')
  })
})

describe('Age island', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-19T06:00:00Z'))
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    window.history.replaceState(null, '', '/')
  })
  it('a link restores the dates; the আজ chip clears the date from the URL', async () => {
    window.history.replaceState(null, '', '/tools/age?birth=1990-01-01&on=2000-01-01')
    render(<AgeCalculator lang="bn" text={islandText('bn', AGE)} today="2026-01-01" title="t" />)
    await waitFor(() => expect(document.querySelector('[data-result-value]')?.textContent).toBe('১০ বছর'))
    fireEvent.click(screen.getByRole('button', { name: 'আজ' }))
    await waitFor(() => expect(window.location.search).toBe('?birth=1990-01-01'))
    // The build day was 1 Jan 2026; the island moved to the frozen clock's 19 Oct 2026.
    expect(document.querySelector('[data-result-value]')?.textContent).toBe('৩৬ বছর ৯ মাস ১৮ দিন')
  })
})
