// Age: inputs → what the calculator shows. All arithmetic is @hisab/core age.
import { calculateAge, validateAge } from '@hisab/core/age'
import type { CalendarDate } from '@hisab/core/lib/dates-calendar'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import { countText, dateText, periodText } from '../tool/date-say.ts'
import { fill, num } from '../tool/say.ts'
import type { SummaryRow } from '../tool/parts.tsx'
import type { ToolOutcome } from '../tool/validation.ts'
import type { AgeCopy } from './copy.ts'

export interface AgeInput {
  lang: Lang
  copy: AgeCopy
  birth: CalendarDate | null
  on: CalendarDate | null
}

export interface AgeView {
  label: string
  text: string
  sub: string
  summary: SummaryRow[]
  shareText: string
}

export function ageOutcome({ lang, copy, birth, on }: AgeInput): ToolOutcome<AgeView> {
  if (!birth || !on) return { kind: 'empty' }
  const problem = validateAge({ birth, on })
  if (problem === 'on') {
    // The fix button sets the date back to today (value 0 = the আজ chip).
    return { kind: 'error', error: { title: copy.beforeBirthTitle, body: copy.beforeBirthBody, fix: { label: copy.beforeBirthFix, field: 'on', value: 0 } } }
  }
  if (problem) return { kind: 'empty' }
  const r = calculateAge({ birth, on })
  const age = periodText(lang, copy, r)
  const next = r.nextBirthday
  const sub =
    next.daysLeft === 0
      ? fill(lang, copy.birthdayToday, { age: countText(lang, copy.year, copy.years, r.years) })
      : fill(lang, copy.nextBirthday, { days: countText(lang, copy.day, copy.days, next.daysLeft), date: dateText(lang, next.date) })
  return {
    kind: 'result',
    result: {
      label: copy.resultLabel,
      text: age,
      sub,
      summary: [
        { key: 'months', label: copy.totalMonths, value: num(lang, r.totalMonths) },
        { key: 'weeks', label: copy.totalWeeks, value: num(lang, r.totalWeeks) },
        { key: 'days', label: copy.totalDays, value: num(lang, r.totalDays) },
      ],
      shareText: fill(lang, copy.shareText, { date: dateText(lang, on), age }),
    },
  }
}

export function ageReportItems(copy: AgeCopy): ReportErrorItem[] {
  return [
    { value: 'age', label: copy.reportAge },
    { value: 'totals', label: copy.reportTotals },
  ]
}
