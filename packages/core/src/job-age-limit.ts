import {
  addDays,
  addMonths,
  compareDates,
  isValidDate,
  periodBetween,
  toDayNumber,
  type CalendarDate,
  type Period,
} from './lib/dates-calendar.ts'

/** A circular's age rule (from data or typed in): e.g. 18 to 32 years. */
export interface JobAgeLimit {
  /** Youngest age allowed, in whole years; leave out for none. */
  minYears?: number
  /** The age a candidate must not have completed, in whole years (৩২ বছর). */
  maxYears: number
}

/** Extra time on the upper limit for a quota or a one-time relaxation (from data). */
export interface JobAgeExtension {
  id: string
  years: number
  /** For relaxations given in months, e.g. a 21-month COVID relaxation. */
  months?: number
}

export interface JobAgeLimitInput {
  birth: CalendarDate
  /** The circular's age reference date ("সার্কুলারে বয়স গণনার তারিখ"). */
  referenceDate: CalendarDate
  limit: JobAgeLimit
  /** Extensions that apply to this candidate; they add up. */
  extensions?: readonly JobAgeExtension[]
  /**
   * True when a circular still accepts a candidate on the day they complete
   * the upper limit. Default false: completing ৩২ বছর ends eligibility.
   */
  limitDayIncluded?: boolean
}

export type JobAgeStatus = 'eligible' | 'too-young' | 'too-old'

export interface JobAgeLimitResult {
  status: JobAgeStatus
  eligible: boolean
  /** Age on the reference date. */
  age: Period
  /** Upper limit after extensions. */
  maxAge: { years: number; months: number }
  /** The day the candidate completes the upper limit ("৩২ বছর পূর্ণ হবে"). */
  limitReachedOn: CalendarDate
  /** Latest reference date that still qualifies ("… পর্যন্ত আবেদন করা যাবে"). */
  lastEligibleDate: CalendarDate
  /** The day the candidate reaches the lower limit; null without one. */
  eligibleFrom: CalendarDate | null
  /** From the reference date to lastEligibleDate, when eligible. */
  left: Period | null
  daysLeft: number | null
  /** From lastEligibleDate to the reference date, when too old. */
  over: Period | null
  daysOver: number | null
  /** From the reference date to eligibleFrom, when too young. */
  wait: Period | null
}

export type JobAgeLimitError = 'birth' | 'referenceDate' | 'limit' | 'extensions'

const isWhole = (n: number | undefined, max: number) => n === undefined || (Number.isInteger(n) && n >= 0 && n <= max)

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateJobAgeLimit(input: JobAgeLimitInput): JobAgeLimitError | null {
  if (!isValidDate(input.birth)) return 'birth'
  if (!isValidDate(input.referenceDate) || compareDates(input.referenceDate, input.birth) <= 0) return 'referenceDate'
  const { minYears, maxYears } = input.limit
  if (!(Number.isInteger(maxYears) && maxYears >= 1 && maxYears <= 100)) return 'limit'
  if (!isWhole(minYears, 100) || (minYears ?? 0) >= maxYears) return 'limit'
  if (!(input.extensions ?? []).every((e) => isWhole(e.years, 50) && isWhole(e.months, 600))) return 'extensions'
  return null
}

/** Age on the circular's reference date against the limit, with the dates that decide it. */
export function calculateJobAgeLimit(input: JobAgeLimitInput): JobAgeLimitResult {
  const { birth, referenceDate: ref, limit, extensions = [], limitDayIncluded = false } = input
  const maxMonths = limit.maxYears * 12 + extensions.reduce((sum, e) => sum + e.years * 12 + (e.months ?? 0), 0)
  const limitReachedOn = addMonths(birth, maxMonths)
  const lastEligibleDate = limitDayIncluded ? limitReachedOn : addDays(limitReachedOn, -1)
  const eligibleFrom = limit.minYears ? addMonths(birth, limit.minYears * 12) : null

  const tooOld = compareDates(ref, lastEligibleDate) > 0
  const tooYoung = eligibleFrom !== null && compareDates(ref, eligibleFrom) < 0
  const status: JobAgeStatus = tooOld ? 'too-old' : tooYoung ? 'too-young' : 'eligible'
  const eligible = status === 'eligible'

  return {
    status,
    eligible,
    age: periodBetween(birth, ref),
    maxAge: { years: Math.floor(maxMonths / 12), months: maxMonths % 12 },
    limitReachedOn,
    lastEligibleDate,
    eligibleFrom,
    left: eligible ? periodBetween(ref, lastEligibleDate) : null,
    daysLeft: eligible ? toDayNumber(lastEligibleDate) - toDayNumber(ref) : null,
    over: tooOld ? periodBetween(lastEligibleDate, ref) : null,
    daysOver: tooOld ? toDayNumber(ref) - toDayNumber(lastEligibleDate) : null,
    wait: tooYoung && eligibleFrom ? periodBetween(ref, eligibleFrom) : null,
  }
}
