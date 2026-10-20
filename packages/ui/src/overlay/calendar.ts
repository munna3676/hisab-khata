// Calendar maths for DatePicker: plain {year, month, day} values (month 0-11) computed
// in UTC, so time zones and DST never shift a day and years below 100 stay as given.
import { toBanglaDigits } from '@hisab/core/lib/digits'

export type CalendarLang = 'bn' | 'en'
export type CalendarDigits = 'bn' | 'en'

export interface YMD {
  year: number
  /** 0 = January. */
  month: number
  day: number
}

export const MONTHS: Record<CalendarLang, readonly string[]> = {
  bn: ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

/** Indexed like Date#getDay (0 = Sunday). Figma: শনি রবি সোম মঙ্গল বুধ বৃহঃ শুক্র. */
export const WEEKDAYS_SHORT: Record<CalendarLang, readonly string[]> = {
  bn: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}
export const WEEKDAYS_LONG: Record<CalendarLang, readonly string[]> = {
  bn: ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
}

function utc(year: number, month: number, day: number): Date {
  const d = new Date(Date.UTC(2000, 0, 1))
  d.setUTCFullYear(year, month, day)
  return d
}

function fromUtc(d: Date): YMD {
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() }
}

export function daysInMonth(year: number, month: number): number {
  return utc(year, month + 1, 0).getUTCDate()
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday({ year, month, day }: YMD): number {
  return utc(year, month, day).getUTCDay()
}

export function addDays(date: YMD, days: number): YMD {
  return fromUtc(utc(date.year, date.month, date.day + days))
}

/** Same day in another month, clamped to that month's length (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(date: YMD, months: number): YMD {
  const first = fromUtc(utc(date.year, date.month + months, 1))
  return { ...first, day: Math.min(date.day, daysInMonth(first.year, first.month)) }
}

export function compareYMD(a: YMD, b: YMD): number {
  return a.year - b.year || a.month - b.month || a.day - b.day
}

export function sameYMD(a: YMD | null | undefined, b: YMD | null | undefined): boolean {
  return !!a && !!b && compareYMD(a, b) === 0
}

/** Local calendar date of a Date. */
export function fromDate(date: Date): YMD {
  return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() }
}

/** Local midnight Date for a calendar date (years below 100 kept as given). */
export function toDate({ year, month, day }: YMD): Date {
  const d = new Date(2000, 0, 1)
  d.setFullYear(year, month, day)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Weeks of a month for the grid: rows of 7, `null` outside the month. `weekStart` is the
 * first column as a Date#getDay number; 6 = Saturday, the Bangladesh week (Figma P5).
 */
export function monthGrid(year: number, month: number, weekStart = 6): (number | null)[][] {
  const lead = (weekday({ year, month, day: 1 }) - weekStart + 7) % 7
  const total = daysInMonth(year, month)
  const cells: (number | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)
  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export function formatDigits(value: number | string, digits: CalendarDigits): string {
  return digits === 'bn' ? toBanglaDigits(String(value)) : String(value)
}

/** "১৫ মার্চ ২০০০" / "15 March 2000". */
export function formatYMD(date: YMD, lang: CalendarLang, digits: CalendarDigits): string {
  return `${formatDigits(date.day, digits)} ${MONTHS[lang][date.month]} ${formatDigits(date.year, digits)}`
}

/** "মার্চ ২০০০" / "March 2000". */
export function formatMonth(year: number, month: number, lang: CalendarLang, digits: CalendarDigits): string {
  return `${MONTHS[lang][month]} ${formatDigits(year, digits)}`
}
