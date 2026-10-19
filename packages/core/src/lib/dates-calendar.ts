/**
 * Plain calendar dates for the date tools (age, day count, Bangla and Hijri
 * dates). A date is a day on the proleptic Gregorian calendar with no time or
 * time zone, so 19 October is 19 October on every device. A day number counts
 * days from 1970-01-01, which makes differences and weekdays plain arithmetic.
 */
export interface CalendarDate {
  year: number
  /** 1 = January … 12 = December. */
  month: number
  day: number
}

/** Years, months and days, as people say an age or a gap ("২৬ বছর ৭ মাস ৪ দিন"). */
export interface Period {
  years: number
  months: number
  days: number
}

/** Calendar names, fixed by the language, so constants. Index 0 = January / Sunday. */
export const GREGORIAN_MONTHS_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
] as const
export const GREGORIAN_MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const
export const WEEKDAYS_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'] as const
export const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

/** True for a real date with whole-number parts in years minYear..maxYear. */
export function isValidDate(date: CalendarDate, minYear = 1, maxYear = 9999): boolean {
  const { year, month, day } = date
  return (
    Number.isInteger(year) && year >= minYear && year <= maxYear &&
    Number.isInteger(month) && month >= 1 && month <= 12 &&
    Number.isInteger(day) && day >= 1 && day <= daysInMonth(year, month)
  )
}

/** Days since 1970-01-01 (H. Hinnant's days_from_civil). */
export function toDayNumber(date: CalendarDate): number {
  const y = date.month <= 2 ? date.year - 1 : date.year
  const era = Math.floor(y / 400)
  const yoe = y - era * 400
  const doy = Math.floor((153 * (date.month + (date.month > 2 ? -3 : 9)) + 2) / 5) + date.day - 1
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy
  return era * 146097 + doe - 719468
}

/** The date `dayNumber` days after 1970-01-01 (H. Hinnant's civil_from_days). */
export function fromDayNumber(dayNumber: number): CalendarDate {
  const z = dayNumber + 719468
  const era = Math.floor(z / 146097)
  const doe = z - era * 146097
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365)
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100))
  const mp = Math.floor((5 * doy + 2) / 153)
  const month = mp < 10 ? mp + 3 : mp - 9
  return { year: yoe + era * 400 + (month <= 2 ? 1 : 0), month, day: doy - Math.floor((153 * mp + 2) / 5) + 1 }
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return fromDayNumber(toDayNumber(date) + days)
}

/** Negative when a is earlier, 0 on the same day, positive when later. */
export function compareDates(a: CalendarDate, b: CalendarDate): number {
  return toDayNumber(a) - toDayNumber(b)
}

/** 0 = Sunday … 6 = Saturday, for a day number. 1970-01-01 was a Thursday. */
export function weekdayOfDay(dayNumber: number): number {
  return (((dayNumber + 4) % 7) + 7) % 7
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(date: CalendarDate): number {
  return weekdayOfDay(toDayNumber(date))
}

/**
 * Adds whole months; a day that the target month lacks falls back to its last
 * day (31 Jan + 1 month = 28/29 Feb, 29 Feb + 12 months = 28 Feb).
 */
export function addMonths(date: CalendarDate, months: number): CalendarDate {
  const index = date.year * 12 + (date.month - 1) + months
  const year = Math.floor(index / 12)
  const month = index - year * 12 + 1
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) }
}

/**
 * Years, months and days from `from` to `to` (to ≥ from): the most whole
 * months that fit by addMonths, then the days left over. A month is complete
 * on the same day of a later month, or on its last day when it is shorter.
 */
export function periodBetween(from: CalendarDate, to: CalendarDate): Period {
  let months = (to.year - from.year) * 12 + (to.month - from.month)
  if (compareDates(addMonths(from, months), to) > 0) months--
  const days = toDayNumber(to) - toDayNumber(addMonths(from, months))
  return { years: Math.floor(months / 12), months: months % 12, days }
}

/** "2026-02-21" → { year: 2026, month: 2, day: 21 }, or null for anything else. */
export function parseIsoDate(text: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (!match) return null
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  return isValidDate(date) ? date : null
}

/** { year: 2026, month: 2, day: 21 } → "2026-02-21". */
export function toIsoDate(date: CalendarDate): string {
  const pad = (n: number, width: number) => String(n).padStart(width, '0')
  return `${pad(date.year, 4)}-${pad(date.month, 2)}-${pad(date.day, 2)}`
}

/**
 * The calendar date at `instant` in a zone `utcOffsetMinutes` ahead of UTC
 * (Bangladesh: 360). For the UI's "আজ" button; the engines never read the clock.
 */
export function calendarDateAt(instant: Date, utcOffsetMinutes: number): CalendarDate {
  return fromDayNumber(Math.floor((instant.getTime() + utcOffsetMinutes * 60000) / 86400000))
}
