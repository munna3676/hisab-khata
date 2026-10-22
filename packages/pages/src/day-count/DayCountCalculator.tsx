import type { Lang } from '@hisab/i18n/locale'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { DateField } from '../tool/DateField.tsx'
import { gregorianMonths } from '../tool/date-say.ts'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, InputCard, LabeledChips, ResultEmpty, SummaryCard } from '../tool/parts.tsx'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { dateParam, resolveDate, useToday } from '../tool/today.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import { TODAY } from '../tool/url-state.ts'
import type { COPY } from './copy.ts'
import { dayCountOutcome, dayCountReportItems } from './model.ts'
import { DAY_COUNT_PARAMS } from './params.ts'

export interface DayCountCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  /** The build day, YYYY-MM-DD: "today" until the browser knows the real day. */
  today: string
  title: string
}

/**
 * The day count island (Figma D5 31:8462, D · D5 68:7759, P5 59:16939): two dates → the days
 * between them (with or without the last day), in weeks, months and hours.
 * ?start=2026-01-01&end=2026-12-31&inc=yes
 */
export function DayCountCalculator({ lang, text, today: built, title }: DayCountCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(DAY_COUNT_PARAMS)
  const today = useToday(built)
  const start = resolveDate(values.start, today)
  const end = resolveDate(values.end, today)
  const includeEnd = values.inc === 'yes'
  const outcome = useMemo(() => dayCountOutcome({ lang, copy, start, end, includeEnd }), [lang, copy, values.start, values.end, today, includeEnd])
  const items = useMemo(() => dayCountReportItems(copy), [copy])
  const months = gregorianMonths(lang)
  const parts = { day: copy.partDay, month: copy.partMonth, year: copy.partYear, close: copy.close }

  const inputs = (
    <InputCard>
      <div class="flex flex-col gap-4">
        {start && (
          <DateField id="dc-start" lang={lang} label={copy.startLabel} value={start} months={months} today={today} parts={parts}
            onChange={(d) => set('start', dateParam(d))} />
        )}
        {end && (
          <DateField id="dc-end" lang={lang} label={copy.endLabel} value={end} months={months} today={today} parts={parts}
            onChange={(d) => set('end', dateParam(d) === dateParam(today) ? TODAY : dateParam(d))} />
        )}
        <LabeledChips
          title={copy.includeLabel}
          label={copy.includeLabel}
          options={[
            { value: 'no', label: copy.no },
            { value: 'yes', label: copy.yes },
          ]}
          value={values.inc}
          onPick={(v) => set('inc', v)}
        />
      </div>
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const results = (
    <>
      {!result && <ResultEmpty lang={lang} />}
      {result && (
        <>
          <ResultCard label={result.label} value={result.value} format="number" decimals={0} suffix={result.suffix} digits={lang} sub={result.sub} />
          <SummaryCard title={copy.summaryTitle} rows={result.summary} />
        </>
      )}
      <ToolActions lang={lang} toolId="day-count" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
