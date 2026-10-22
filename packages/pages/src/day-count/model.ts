// Day count: inputs → what the calculator shows. All arithmetic is @hisab/core day-count.
import { calculateDayCount, validateDayCount } from '@hisab/core/day-count'
import type { CalendarDate } from '@hisab/core/lib/dates-calendar'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import { countText, dateText, periodText, weeksText } from '../tool/date-say.ts'
import type { SummaryRow } from '../tool/parts.tsx'
import { fill, num } from '../tool/say.ts'
import type { ToolOutcome } from '../tool/validation.ts'
import type { DayCountCopy } from './copy.ts'

export interface DayCountInput {
  lang: Lang
  copy: DayCountCopy
  start: CalendarDate | null
  end: CalendarDate | null
  includeEnd: boolean
}

export interface DayCountView {
  label: string
  value: number
  suffix: string
  sub: string
  summary: SummaryRow[]
  shareText: string
}

export function dayCountOutcome({ lang, copy, start, end, includeEnd }: DayCountInput): ToolOutcome<DayCountView> {
  if (!start || !end) return { kind: 'empty' }
  const input = { start, end, includeEnd }
  if (validateDayCount(input)) return { kind: 'empty' }
  const r = calculateDayCount(input)
  const days = (n: number) => countText(lang, copy.day, copy.days, n)
  const weeks = weeksText(lang, copy, r.weeks, r.extraDays)
  const other = includeEnd ? fill(lang, copy.withoutEnd, { days: days(r.daysWithoutEnd) }) : fill(lang, copy.withEnd, { days: days(r.daysWithEnd) })
  const sub = [weeks, other, ...(r.reversed ? [copy.reversed] : [])].join(' · ')
  return {
    kind: 'result',
    result: {
      label: copy.resultLabel,
      value: r.days,
      suffix: r.days === 1 ? copy.dayUnit : copy.daysUnit,
      sub,
      summary: [
        { key: 'period', label: copy.monthsDays, value: periodText(lang, copy, r.period) },
        { key: 'weeks', label: copy.weeksLabel, value: weeks },
        { key: 'hours', label: copy.hours, value: num(lang, r.hours) },
      ],
      shareText: fill(lang, copy.shareText, { start: dateText(lang, start), end: dateText(lang, end), days: days(r.days) }),
    },
  }
}

export function dayCountReportItems(copy: DayCountCopy): ReportErrorItem[] {
  return [
    { value: 'days', label: copy.reportDays },
    { value: 'other', label: copy.reportOther },
  ]
}
