import {
  addMonths,
  compareDates,
  isValidDate,
  periodBetween,
  toDayNumber,
  weekdayOf,
  type CalendarDate,
  type Period,
} from './lib/dates-calendar.ts'

export interface AgeInput {
  /** জন্ম তারিখ. */
  birth: CalendarDate
  /** The date to measure the age on ("আজ" or another date); not before birth. */
  on: CalendarDate
}

export interface NextBirthday {
  date: CalendarDate
  /** 0 when `on` is the birthday itself. */
  daysLeft: number
  /** The age reached on that day. */
  turning: number
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number
}

export interface AgeResult extends Period {
  totalMonths: number
  totalWeeks: number
  /** Days after the last whole week. */
  extraDays: number
  totalDays: number
  /** Weekday of birth, 0 = Sunday … 6 = Saturday. */
  bornOnWeekday: number
  nextBirthday: NextBirthday
}

export type AgeError = 'birth' | 'on'

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateAge(input: AgeInput): AgeError | null {
  if (!isValidDate(input.birth)) return 'birth'
  if (!isValidDate(input.on) || compareDates(input.on, input.birth) < 0) return 'on'
  return null
}

/** Birthday number `n` (n ≥ 1): a 29 February birthday falls on 28 February in a common year. */
export function birthdayAt(birth: CalendarDate, n: number): CalendarDate {
  return addMonths(birth, n * 12)
}

/** Age in years, months and days on a date, the same gap in other units, and the next birthday. */
export function calculateAge(input: AgeInput): AgeResult {
  const { birth, on } = input
  const age = periodBetween(birth, on)
  const totalDays = toDayNumber(on) - toDayNumber(birth)

  let turning = Math.max(on.year - birth.year, 1)
  if (compareDates(birthdayAt(birth, turning), on) < 0) turning++
  const next = birthdayAt(birth, turning)

  return {
    ...age,
    totalMonths: age.years * 12 + age.months,
    totalWeeks: Math.floor(totalDays / 7),
    extraDays: totalDays % 7,
    totalDays,
    bornOnWeekday: weekdayOf(birth),
    nextBirthday: { date: next, daysLeft: toDayNumber(next) - toDayNumber(on), turning, weekday: weekdayOf(next) },
  }
}
