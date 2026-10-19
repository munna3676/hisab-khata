import {
  compareDates,
  fromDayNumber,
  isValidDate,
  parseIsoDate,
  periodBetween,
  toDayNumber,
  weekdayOfDay,
  type CalendarDate,
  type Period,
} from './lib/dates-calendar.ts'

/** A public holiday as data/ lists it. */
export interface Holiday {
  /** 'YYYY-MM-DD'. */
  date: string
  name?: string
}

/** Off days and holidays for working-day counts, both from data. */
export interface WorkCalendar {
  /** Weekly off days, 0 = Sunday … 6 = Saturday (Bangladesh offices: Friday and Saturday). */
  weekend: readonly number[]
  holidays?: readonly Holiday[]
}

export interface DayCountInput {
  start: CalendarDate
  /** May be before start; the result then says `reversed`. */
  end: CalendarDate
  /** শেষের দিনটাও গুনবো? Also decides whether the end day counts as a working day. */
  includeEnd: boolean
  /** Leave out to skip the working-day count. */
  work?: WorkCalendar
}

export interface WorkingDays {
  workingDays: number
  /** Weekly off days in the range. */
  weekendDays: number
  /** Holidays that fell on a working weekday (a holiday on a Friday is not counted twice). */
  holidayDays: number
  /** The holidays in the range, in date order. */
  holidays: Holiday[]
}

export interface DayCountResult {
  /** Days as asked (with or without the end day). */
  days: number
  /** Both counts, for "শেষ দিন গুনলে ২৯২ দিন". */
  daysWithoutEnd: number
  daysWithEnd: number
  weeks: number
  /** Days after the last whole week. */
  extraDays: number
  /** The same span in years, months and days. */
  period: Period
  hours: number
  /** True when end was before start; the dates were swapped. */
  reversed: boolean
  working: WorkingDays | null
}

export interface AddDaysInput {
  date: CalendarDate
  /** Days to add; negative goes back. */
  days: number
  /** Count only working days (needs `work`): the date `days` working days later. */
  workingDaysOnly?: boolean
  work?: WorkCalendar
}

export interface AddDaysResult {
  date: CalendarDate
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number
  /** Calendar days from the start date to the result, negative when going back. */
  calendarDays: number
}

export type DayCountError = 'start' | 'end' | 'work'
export type AddDaysError = 'date' | 'days' | 'work'

const MAX_ADD_DAYS = 100000

function isValidWork(work: WorkCalendar | undefined, needsWorkingDay: boolean): boolean {
  if (!work) return !needsWorkingDay
  const { weekend, holidays = [] } = work
  if (!weekend.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) return false
  if (needsWorkingDay && new Set(weekend).size >= 7) return false
  return holidays.every((h) => parseIsoDate(h.date) !== null)
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateDayCount(input: DayCountInput): DayCountError | null {
  if (!isValidDate(input.start)) return 'start'
  if (!isValidDate(input.end)) return 'end'
  if (!isValidWork(input.work, false)) return 'work'
  return null
}

/** Working, weekend and holiday days among day numbers first..last. */
function countWorkingDays(first: number, last: number, work: WorkCalendar): WorkingDays {
  const weekend = new Set(work.weekend)
  const total = last - first + 1
  const fullWeeks = Math.floor(total / 7)
  let weekendDays = fullWeeks * weekend.size
  for (let n = first + fullWeeks * 7; n <= last; n++) if (weekend.has(weekdayOfDay(n))) weekendDays++

  const seen = new Set<number>()
  const holidays: Holiday[] = []
  let holidayDays = 0
  for (const h of work.holidays ?? []) {
    const n = toDayNumber(parseIsoDate(h.date)!)
    if (n < first || n > last || seen.has(n)) continue
    seen.add(n)
    holidays.push(h)
    if (!weekend.has(weekdayOfDay(n))) holidayDays++
  }
  holidays.sort((a, b) => a.date.localeCompare(b.date))
  return { workingDays: total - weekendDays - holidayDays, weekendDays, holidayDays, holidays }
}

/** Days between two dates, in days, weeks, months and hours, and optionally working days. */
export function calculateDayCount(input: DayCountInput): DayCountResult {
  const reversed = compareDates(input.end, input.start) < 0
  const [start, end] = reversed ? [input.end, input.start] : [input.start, input.end]
  const daysWithoutEnd = toDayNumber(end) - toDayNumber(start)
  const daysWithEnd = daysWithoutEnd + 1
  const days = input.includeEnd ? daysWithEnd : daysWithoutEnd
  const first = toDayNumber(start)
  return {
    days,
    daysWithoutEnd,
    daysWithEnd,
    weeks: Math.floor(days / 7),
    extraDays: days % 7,
    period: periodBetween(start, fromDayNumber(first + days)),
    hours: days * 24,
    reversed,
    working: input.work ? countWorkingDays(first, first + days - 1, input.work) : null,
  }
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateAddDays(input: AddDaysInput): AddDaysError | null {
  if (!isValidDate(input.date)) return 'date'
  if (!(Number.isInteger(input.days) && Math.abs(input.days) <= MAX_ADD_DAYS)) return 'days'
  if (!isValidWork(input.work, input.workingDaysOnly === true)) return 'work'
  // Even when six days a week and every holiday are off, the result must stay a valid date.
  const skips = input.workingDaysOnly ? (input.work?.holidays?.length ?? 0) : 0
  const reach = input.workingDaysOnly ? input.days * 7 + Math.sign(input.days) * skips : input.days
  if (!isValidDate(fromDayNumber(toDayNumber(input.date) + reach))) return 'days'
  return null
}

/** The date `days` calendar days (or working days) after `date`; the start day itself is not counted. */
export function calculateAddDays(input: AddDaysInput): AddDaysResult {
  const start = toDayNumber(input.date)
  let n = start
  if (input.workingDaysOnly && input.work) {
    const weekend = new Set(input.work.weekend)
    const holidays = new Set((input.work.holidays ?? []).map((h) => toDayNumber(parseIsoDate(h.date)!)))
    const step = Math.sign(input.days)
    for (let left = Math.abs(input.days); left > 0; ) {
      n += step
      if (!weekend.has(weekdayOfDay(n)) && !holidays.has(n)) left--
    }
  } else {
    n += input.days
  }
  const date = fromDayNumber(n)
  return { date, weekday: weekdayOfDay(n), calendarDays: n - start }
}
