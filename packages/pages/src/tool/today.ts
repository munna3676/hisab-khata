// "Today" for the date tools. Pages are static, so the server renders with the build day (the
// no-JS fallback, passed in as `built`); in the browser the island switches to the real day in
// Bangladesh (UTC+6) right after hydration. Tests freeze the clock (Playwright page.clock).
import { calendarDateAt, parseIsoDate, toIsoDate, type CalendarDate } from '@hisab/core/lib/dates-calendar'
import { useEffect, useState } from 'preact/hooks'
import { TODAY } from './url-state.ts'

/** Bangladesh Standard Time, UTC+6 all year. */
export const BD_UTC_OFFSET_MINUTES = 360

export const todayInBangladesh = (now: Date = new Date()): CalendarDate => calendarDateAt(now, BD_UTC_OFFSET_MINUTES)

/** Today: the build day on the server and in the first render, then the device's day in Bangladesh. */
export function useToday(built: string): CalendarDate {
  const [today, setToday] = useState<CalendarDate>(() => parseIsoDate(built) ?? todayInBangladesh())
  useEffect(() => {
    const now = todayInBangladesh()
    if (toIsoDate(now) !== toIsoDate(today)) setToday(now)
  }, [])
  return today
}

/** A date param's value as a date: 'today' → today; a Gregorian 'YYYY-MM-DD' → that day; else null. */
export function resolveDate(value: string, today: CalendarDate): CalendarDate | null {
  return value === TODAY ? today : parseIsoDate(value)
}

/** The parts of 'YYYY-MM-DD' without calendar checks (a Bangla date: ৩১ জ্যৈষ্ঠ is 1433-02-31). */
export function dateParts(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) } : null
}

/** A date (Gregorian or Bangla) as a param value, 'YYYY-MM-DD'. */
export function dateParam({ year, month, day }: CalendarDate): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
