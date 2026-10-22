import type { Lang } from '@hisab/i18n/locale'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { DateField } from '../tool/DateField.tsx'
import { gregorianMonths } from '../tool/date-say.ts'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, InputCard, LabeledChips, ResultEmpty, ResultError, SummaryCard, ToolCallout } from '../tool/parts.tsx'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { dateParam, resolveDate, useToday } from '../tool/today.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { jobAgeOutcome, jobAgeReportItems, limitChips, type JobAgeData } from './model.ts'
import { JOB_AGE_PARAMS } from './params.ts'

export interface JobAgeLimitCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  /** data/jobs/govt-age-limit.json: the chips and the rule. */
  presets: number[]
  rule: JobAgeData
  /** The build day, YYYY-MM-DD (marks today in the date sheet). */
  today: string
  title: string
}

/**
 * The job age limit island (Figma D2 29:8239, D · D2 68:7039, P5 59:16939): date of birth, the
 * circular's reference date and the limit → eligible or not, the day the limit is completed and
 * the last reference date that still qualifies. ?birth=1997-03-15&ref=2026-10-31&max=32
 */
export function JobAgeLimitCalculator({ lang, text, presets, rule, today: built, title }: JobAgeLimitCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(JOB_AGE_PARAMS)
  const today = useToday(built)
  const birth = resolveDate(values.birth, today)
  const ref = resolveDate(values.ref, today)
  const outcome = useMemo(
    () => jobAgeOutcome({ lang, copy, birth, ref, maxYears: values.max, rule }),
    [lang, copy, values.birth, values.ref, values.max, rule],
  )
  const items = useMemo(() => jobAgeReportItems(copy), [copy])
  const months = gregorianMonths(lang)
  const parts = { day: copy.partDay, month: copy.partMonth, year: copy.partYear, close: copy.close }

  const inputs = (
    <InputCard>
      <div class="flex flex-col gap-4">
        {birth && (
          <DateField id="job-birth" lang={lang} label={copy.birthLabel} value={birth} months={months} today={today} parts={parts}
            onChange={(d) => set('birth', dateParam(d))} />
        )}
        {ref && (
          <DateField id="job-ref" lang={lang} label={copy.refLabel} value={ref} months={months} today={today} parts={parts}
            onChange={(d) => set('ref', dateParam(d))} />
        )}
        <LabeledChips title={copy.limitLabel} label={copy.limitLabel} options={limitChips(lang, copy, presets)} value={values.max} onPick={(n) => set('max', n)} />
      </div>
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const results = (
    <>
      {outcome.kind === 'empty' && <ResultEmpty lang={lang} />}
      {outcome.kind === 'error' && <ResultError error={outcome.error} />}
      {result && (
        <>
          <ResultCard label={result.label} value={0} text={result.text} digits={lang} sub={result.sub} data-eligible={String(result.eligible)} />
          <SummaryCard title={copy.timeTitle} rows={result.summary} />
        </>
      )}
      <ToolCallout data-tool-callout="">{copy.callout}</ToolCallout>
      <ToolActions lang={lang} toolId="job-age-limit" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
