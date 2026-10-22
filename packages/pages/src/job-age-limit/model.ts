// Job age limit: inputs → what the calculator shows. All arithmetic is @hisab/core job-age-limit.
import { calculateJobAgeLimit, validateJobAgeLimit } from '@hisab/core/job-age-limit'
import type { CalendarDate } from '@hisab/core/lib/dates-calendar'
import type { JobAgeRule } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import { countText, dateText, periodText } from '../tool/date-say.ts'
import type { SummaryRow } from '../tool/parts.tsx'
import { fill } from '../tool/say.ts'
import type { ToolOutcome } from '../tool/validation.ts'
import type { JobAgeCopy } from './copy.ts'

/** The rule parts the page needs from data/jobs/govt-age-limit.json. */
export type JobAgeData = Pick<JobAgeRule, 'minYears' | 'limitDayIncluded'>

export interface JobAgeInput {
  lang: Lang
  copy: JobAgeCopy
  birth: CalendarDate | null
  ref: CalendarDate | null
  maxYears: number | null
  rule: JobAgeData
}

export interface JobAgeView {
  eligible: boolean
  label: string
  text: string
  sub: string
  summary: SummaryRow[]
  shareText: string
}

export function jobAgeOutcome({ lang, copy, birth, ref, maxYears, rule }: JobAgeInput): ToolOutcome<JobAgeView> {
  if (!birth || !ref || maxYears === null) return { kind: 'empty' }
  const input = { birth, referenceDate: ref, limit: { maxYears, minYears: rule.minYears }, limitDayIncluded: rule.limitDayIncluded }
  const problem = validateJobAgeLimit(input)
  if (problem === 'referenceDate') return { kind: 'error', error: { title: copy.refBeforeBirthTitle, body: copy.refBeforeBirthBody } }
  if (problem) return { kind: 'empty' }
  const r = calculateJobAgeLimit(input)
  const age = periodText(lang, copy, r.age)
  const max = periodText(lang, copy, { years: r.maxAge.years, months: r.maxAge.months, days: 0 })
  const subs = [fill(lang, copy.ageSub, { age, max })]
  if (r.over) subs.push(fill(lang, copy.overSub, { over: periodText(lang, copy, r.over) }))
  if (r.wait) subs.push(fill(lang, copy.waitSub, { wait: periodText(lang, copy, r.wait) }))
  const text = r.status === 'eligible' ? copy.eligible : r.status === 'too-old' ? copy.tooOld : copy.tooYoung
  const reached = r.status === 'too-old' ? copy.completed : copy.completes
  return {
    kind: 'result',
    result: {
      eligible: r.eligible,
      label: r.eligible ? copy.eligibleLabel : copy.notEligibleLabel,
      text,
      sub: subs.join(' · '),
      summary: [
        { key: 'completes', label: fill(lang, reached, { max }), value: dateText(lang, r.limitReachedOn) },
        { key: 'last', label: copy.lastDayLabel, value: fill(lang, copy.until, { date: dateText(lang, r.lastEligibleDate) }) },
      ],
      shareText: fill(lang, copy.shareText, { date: dateText(lang, ref), age, max, verdict: text }),
    },
  }
}

/** The বয়সসীমা chips: data presets ("৩২ বছর"). */
export const limitChips = (lang: Lang, copy: JobAgeCopy, presets: readonly number[]) =>
  presets.map((n) => ({ value: n, label: countText(lang, copy.year, copy.years, n) }))

export function jobAgeReportItems(copy: JobAgeCopy): ReportErrorItem[] {
  return [
    { value: 'verdict', label: copy.reportVerdict },
    { value: 'dates', label: copy.reportDates },
  ]
}
