import {
  GREGORIAN_MONTHS_BN,
  WEEKDAYS_BN,
  isLeapYear,
  isValidDate,
  toDayNumber,
  fromDayNumber,
  weekdayOf,
  type CalendarDate,
} from './lib/dates-calendar.ts'

/*
 * Bangladesh's revised Bangla calendar (Bangla Academy, in government use
 * from 1426 / 14 April 2019): 1 বৈশাখ is always 14 April; বৈশাখ–আশ্বিন have
 * 31 days, কার্তিক–মাঘ and চৈত্র 30, ফাল্গুন 29, or 30 when its February is in a
 * Gregorian leap year. A fixed rule, so constants; applied to earlier years
 * too, which keeps 16 Dec 1971 = ১ পৌষ and 21 Feb 1952 = ৮ ফাল্গুন.
 * Source: https://www.prothomalo.com/bangladesh/article/1565143/
 */
export const BANGLA_MONTHS_BN = [
  'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন',
  'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র',
] as const
export const BANGLA_MONTHS_EN = [
  'Boishakh', 'Joishtho', 'Asharh', 'Shrabon', 'Bhadro', 'Ashwin',
  'Kartik', 'Ogrohayon', 'Poush', 'Magh', 'Falgun', 'Choitro',
] as const

/** The six ঋতু, two months each from বৈশাখ. */
export type BanglaSeason = 'grishma' | 'borsha' | 'shorot' | 'hemonto' | 'sheet' | 'boshonto'
const SEASONS: readonly BanglaSeason[] = ['grishma', 'borsha', 'shorot', 'hemonto', 'sheet', 'boshonto']
export const SEASON_NAMES_BN: Record<BanglaSeason, string> = {
  grishma: 'গ্রীষ্ম', borsha: 'বর্ষা', shorot: 'শরৎ', hemonto: 'হেমন্ত', sheet: 'শীত', boshonto: 'বসন্ত',
}

/** From 1 বৈশাখ (14 April) on, Bangla year = Gregorian year − 593. */
const YEAR_GAP = 593

/** A national day shown with the date (from data), on a Gregorian or a Bangla date. */
export interface SpecialDay {
  calendar: 'gregorian' | 'bangla'
  month: number
  day: number
  name: string
}

export interface BanglaDateInput {
  /** Which way to convert: ইংরেজি → বাংলা reads `date` as Gregorian, বাংলা → ইংরেজি as Bangla. */
  from: 'gregorian' | 'bangla'
  /** A Bangla date uses the same shape: year = বঙ্গাব্দ, month 1 = বৈশাখ. */
  date: CalendarDate
  specialDays?: readonly SpecialDay[]
}

export interface BanglaDateResult {
  gregorian: CalendarDate
  bangla: CalendarDate
  banglaMonthName: string
  gregorianMonthName: string
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number
  weekdayName: string
  season: BanglaSeason
  /** "শীত"; the screen's long form adds "কাল" (শীতকাল). */
  seasonName: string
  daysInBanglaMonth: number
  /** Names of the special days that fall on this date. */
  specialDays: string[]
}

export type BanglaDateError = 'from' | 'date' | 'specialDays'

/** Days in Bangla month `month` (1 = বৈশাখ) of Bangla year `year`. */
export function banglaMonthLength(year: number, month: number): number {
  if (month <= 6) return 31
  // ফাল্গুন of year Y runs through February of Gregorian year Y + 594.
  if (month === 11) return isLeapYear(year + YEAR_GAP + 1) ? 30 : 29
  return 30
}

/** Gregorian → Bangla. */
export function toBanglaDate(date: CalendarDate): CalendarDate {
  const dayNumber = toDayNumber(date)
  let year = date.year - YEAR_GAP
  let start = toDayNumber({ year: date.year, month: 4, day: 14 })
  if (dayNumber < start) {
    year--
    start = toDayNumber({ year: date.year - 1, month: 4, day: 14 })
  }
  let offset = dayNumber - start
  let month = 1
  while (offset >= banglaMonthLength(year, month)) offset -= banglaMonthLength(year, month++)
  return { year, month, day: offset + 1 }
}

/** Bangla → Gregorian. Assumes a valid Bangla date. */
export function fromBanglaDate(date: CalendarDate): CalendarDate {
  let dayNumber = toDayNumber({ year: date.year + YEAR_GAP, month: 4, day: 14 }) + date.day - 1
  for (let m = 1; m < date.month; m++) dayNumber += banglaMonthLength(date.year, m)
  return fromDayNumber(dayNumber)
}

const isBanglaDate = (d: CalendarDate) =>
  Number.isInteger(d.year) && d.year >= 1 && d.year <= 9999 - YEAR_GAP - 1 &&
  Number.isInteger(d.month) && d.month >= 1 && d.month <= 12 &&
  Number.isInteger(d.day) && d.day >= 1 && d.day <= banglaMonthLength(d.year, d.month)

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateBanglaDate(input: BanglaDateInput): BanglaDateError | null {
  if (input.from !== 'gregorian' && input.from !== 'bangla') return 'from'
  if (input.from === 'gregorian' ? !isValidDate(input.date, YEAR_GAP + 2) : !isBanglaDate(input.date)) return 'date'
  const ok = (s: SpecialDay) =>
    (s.calendar === 'gregorian' || s.calendar === 'bangla') && Number.isInteger(s.month) && s.month >= 1 &&
    s.month <= 12 && Number.isInteger(s.day) && s.day >= 1 && s.day <= 31 && s.name !== ''
  if (!(input.specialDays ?? []).every(ok)) return 'specialDays'
  return null
}

/** One date in both calendars, with weekday, ঋতু and any special day. */
export function calculateBanglaDate(input: BanglaDateInput): BanglaDateResult {
  const gregorian = input.from === 'gregorian' ? input.date : fromBanglaDate(input.date)
  const bangla = input.from === 'bangla' ? input.date : toBanglaDate(input.date)
  const season = SEASONS[Math.ceil(bangla.month / 2) - 1]!
  const weekday = weekdayOf(gregorian)
  const on = (s: SpecialDay) => (s.calendar === 'gregorian' ? gregorian : bangla)
  return {
    gregorian,
    bangla,
    banglaMonthName: BANGLA_MONTHS_BN[bangla.month - 1]!,
    gregorianMonthName: GREGORIAN_MONTHS_BN[gregorian.month - 1]!,
    weekday,
    weekdayName: WEEKDAYS_BN[weekday]!,
    season,
    seasonName: SEASON_NAMES_BN[season],
    daysInBanglaMonth: banglaMonthLength(bangla.year, bangla.month),
    specialDays: (input.specialDays ?? []).filter((s) => on(s).month === s.month && on(s).day === s.day).map((s) => s.name),
  }
}
