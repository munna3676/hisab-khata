import {
  GREGORIAN_MONTHS_BN,
  GREGORIAN_MONTHS_EN,
  WEEKDAYS_BN,
  WEEKDAYS_EN,
  calendarDateAt,
  weekdayOf,
  type CalendarDate,
} from '@hisab/core/lib/dates-calendar'
import { toBanglaDigits } from '@hisab/core/lib/digits'
import { formatNumber, formatTaka, type FormatOptions } from '@hisab/core/lib/format'
import type { Lang } from './locale.ts'

// Locale-aware wrappers over @hisab/core/lib/format: the page language picks the digits (Bangla
// digits on Bangla pages, Latin digits on English pages); grouping is lakh-style in both, which
// is how Bangladesh writes money in either language.

/** Bangladesh Standard Time is UTC+6 all year (no daylight saving). */
const BD_UTC_OFFSET_MINUTES = 360

export type LocaleFormatOptions = Omit<FormatOptions, 'digits'>

/** 1234567.5 → '১২,৩৪,৫৬৭.৫০' (bn) or '12,34,567.50' (en). */
export function formatNumberIn(lang: Lang, value: number, opts: LocaleFormatOptions = {}): string {
  return formatNumber(value, { ...opts, digits: lang })
}

/** 5000 → '৳৫,০০০' (bn) or '৳5,000' (en). */
export function formatTakaIn(lang: Lang, value: number, opts: LocaleFormatOptions = {}): string {
  return formatTaka(value, { ...opts, digits: lang })
}

/** 9.75 → '৯.৭৫%'; decimals default to 2 for fractions and 0 for whole numbers, like formatNumber. */
export function formatPercentIn(lang: Lang, value: number, opts: LocaleFormatOptions = {}): string {
  return formatNumberIn(lang, value, opts) + '%'
}

/** A number with no grouping, for years, ids and codes: 2026 → '২০২৬' (bn) or '2026' (en). */
export function plainDigits(lang: Lang, value: number | string): string {
  return lang === 'bn' ? toBanglaDigits(value) : String(value)
}

/** A Date is read as the calendar day in Bangladesh; a CalendarDate is used as it is. */
function toCalendarDate(date: Date | CalendarDate): CalendarDate {
  return date instanceof Date ? calendarDateAt(date, BD_UTC_OFFSET_MINUTES) : date
}

/** '১৯ অক্টোবর ২০২৬' (bn) or '19 October 2026' (en), as the Figma frames write dates. */
export function formatDateIn(lang: Lang, date: Date | CalendarDate): string {
  const { year, month, day } = toCalendarDate(date)
  const months = lang === 'bn' ? GREGORIAN_MONTHS_BN : GREGORIAN_MONTHS_EN
  return `${plainDigits(lang, day)} ${months[month - 1]} ${plainDigits(lang, year)}`
}

/** 'সোমবার, ১৯ অক্টোবর ২০২৬' (bn) or 'Monday, 19 October 2026' (en): the home page date line. */
export function formatLongDateIn(lang: Lang, date: Date | CalendarDate): string {
  const day = toCalendarDate(date)
  const weekdays = lang === 'bn' ? WEEKDAYS_BN : WEEKDAYS_EN
  return `${weekdays[weekdayOf(day)]}, ${formatDateIn(lang, day)}`
}
