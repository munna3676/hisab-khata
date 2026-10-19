import {
  WEEKDAYS_BN,
  fromDayNumber,
  isValidDate,
  toDayNumber,
  weekdayOf,
  type CalendarDate,
} from './lib/dates-calendar.ts'

/** Month names as Bangladeshi calendars print them (জমাদিউল আউয়াল, জিলকদ). */
export const HIJRI_MONTHS_BN = [
  'মহররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি', 'জমাদিউল আউয়াল', 'জমাদিউস সানি',
  'রজব', 'শাবান', 'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ',
] as const
export const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani", 'Jumada al-Awwal', 'Jumada al-Thani',
  'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
] as const

/** 'umalqura': Saudi Umm al-Qura through Intl. 'tabular': the arithmetical civil calendar. */
export type HijriEngine = 'umalqura' | 'tabular'

export interface HijriDateInput {
  /** Which way to convert; a Hijri `date` uses the same shape (year AH, month 1 = মহররম). */
  from: 'gregorian' | 'hijri'
  date: CalendarDate
  /**
   * Whole days added to the calculated Hijri date for moon sighting in
   * Bangladesh: -1 when months here start a day after Saudi Arabia (from data
   * plus the screen's ±১ দিন chips). Default 0.
   */
  offsetDays?: number
  /** Default 'umalqura'; it falls back to 'tabular' where the runtime's Intl lacks it. */
  engine?: HijriEngine
}

export interface HijriDateResult {
  gregorian: CalendarDate
  hijri: CalendarDate
  monthNameBn: string
  monthNameEn: string
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number
  weekdayName: string
  /** 29 or 30 by the engine used; moon sighting may still differ. */
  daysInMonth: number
  /** The engine that produced the date. */
  engine: HijriEngine
}

export type HijriDateError = 'from' | 'date' | 'offsetDays' | 'engine'

// Umm al-Qura data in ICU runs 1300–1600 AH; these bounds stay well inside it.
const MIN_YEAR = 1900
const MAX_YEAR = 2099
const MIN_HIJRI_YEAR = 1318
const MAX_HIJRI_YEAR = 1522

let umalquraFormat: Intl.DateTimeFormat | null | undefined

function umalqura(): Intl.DateTimeFormat | null {
  if (umalquraFormat === undefined) {
    try {
      const options = { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' } as const
      const format = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', options)
      umalquraFormat = format.resolvedOptions().calendar === 'islamic-umalqura' ? format : null
    } catch {
      umalquraFormat = null
    }
  }
  return umalquraFormat
}

/** True when this runtime can give Umm al-Qura dates (Node, browsers; not every mobile JS engine). */
export function hasUmalqura(): boolean {
  return umalqura() !== null
}

/** Tabular Islamic calendar, civil epoch (Friday 16 July 622 Julian), 11 leap years in 30. */
function tabularToDayNumber(h: CalendarDate): number {
  return h.day + Math.ceil(29.5 * (h.month - 1)) + (h.year - 1) * 354 + Math.floor((3 + 11 * h.year) / 30) - 492149
}

function tabularFromDayNumber(dayNumber: number): CalendarDate {
  const year = Math.floor((30 * (dayNumber + 492148) + 10646) / 10631)
  const month = Math.min(12, Math.ceil((dayNumber - 29 - tabularToDayNumber({ year, month: 1, day: 1 })) / 29.5) + 1)
  return { year, month, day: dayNumber - tabularToDayNumber({ year, month, day: 1 }) + 1 }
}

const usedEngine = (engine: HijriEngine): HijriEngine => (engine === 'umalqura' && umalqura() ? 'umalqura' : 'tabular')

function hijriOfDay(dayNumber: number, engine: HijriEngine): CalendarDate {
  const format = usedEngine(engine) === 'umalqura' ? umalqura() : null
  if (!format) return tabularFromDayNumber(dayNumber)
  const parts = format.formatToParts(new Date(dayNumber * 86400000))
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { year: part('year'), month: part('month'), day: part('day') }
}

/** Gregorian → Hijri. */
export function toHijriDate(date: CalendarDate, offsetDays = 0, engine: HijriEngine = 'umalqura'): CalendarDate {
  return hijriOfDay(toDayNumber(date) + offsetDays, engine)
}

/** Hijri → Gregorian, or null when the day does not exist (৩০ in a 29-day month). */
export function fromHijriDate(hijri: CalendarDate, offsetDays = 0, engine: HijriEngine = 'umalqura'): CalendarDate | null {
  // Umm al-Qura stays within 2 days of the tabular calendar over 1900–2099.
  const guess = tabularToDayNumber(hijri)
  for (const delta of [0, 1, -1, 2, -2, 3, -3]) {
    const h = hijriOfDay(guess + delta, engine)
    if (h.year === hijri.year && h.month === hijri.month && h.day === hijri.day) return fromDayNumber(guess + delta - offsetDays)
  }
  return null
}

/** 29 or 30. */
export function hijriMonthLength(year: number, month: number, engine: HijriEngine = 'umalqura'): number {
  return fromHijriDate({ year, month, day: 30 }, 0, engine) ? 30 : 29
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateHijriDate(input: HijriDateInput): HijriDateError | null {
  if (input.from !== 'gregorian' && input.from !== 'hijri') return 'from'
  const offset = input.offsetDays ?? 0
  const engine = input.engine ?? 'umalqura'
  if (engine !== 'umalqura' && engine !== 'tabular') return 'engine'
  if (input.from === 'gregorian') {
    if (!isValidDate(input.date, MIN_YEAR, MAX_YEAR)) return 'date'
  } else {
    const { year, month, day } = input.date
    if (!(Number.isInteger(year) && year >= MIN_HIJRI_YEAR && year <= MAX_HIJRI_YEAR)) return 'date'
    if (!(Number.isInteger(month) && month >= 1 && month <= 12 && Number.isInteger(day) && day >= 1 && day <= 30)) return 'date'
    if (!fromHijriDate(input.date, 0, engine)) return 'date'
  }
  if (!(Number.isInteger(offset) && offset >= -3 && offset <= 3)) return 'offsetDays'
  return null
}

/** One date in both calendars, with the Bangla and English month names. */
export function calculateHijriDate(input: HijriDateInput): HijriDateResult {
  const { offsetDays = 0, engine = 'umalqura' } = input
  const gregorian = input.from === 'gregorian' ? input.date : fromHijriDate(input.date, offsetDays, engine)!
  const hijri = input.from === 'hijri' ? input.date : toHijriDate(input.date, offsetDays, engine)
  const weekday = weekdayOf(gregorian)
  return {
    gregorian,
    hijri,
    monthNameBn: HIJRI_MONTHS_BN[hijri.month - 1]!,
    monthNameEn: HIJRI_MONTHS_EN[hijri.month - 1]!,
    weekday,
    weekdayName: WEEKDAYS_BN[weekday]!,
    daysInMonth: hijriMonthLength(hijri.year, hijri.month, engine),
    engine: usedEngine(engine),
  }
}
