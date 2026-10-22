import type { Lang } from '@hisab/i18n/locale'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { DateField } from '../tool/DateField.tsx'
import { gregorianMonths } from '../tool/date-say.ts'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, InputCard, LabeledChips, ResultEmpty, SummaryCard, ToolCallout } from '../tool/parts.tsx'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { dateParam, resolveDate, useToday } from '../tool/today.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import { TODAY } from '../tool/url-state.ts'
import type { COPY } from './copy.ts'
import { adjustLabel, hijriOutcome, hijriReportItems } from './model.ts'
import { ADJUST_CHIPS, HIJRI_PARAMS } from './params.ts'

export interface HijriDateCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  /** data/dates/hijri-offset.json: days against Umm al-Qura (Bangladesh: -1). */
  offset: number
  /** The build day, YYYY-MM-DD: "today" until the browser knows the real day. */
  today: string
  title: string
}

/**
 * The Hijri date island (Figma D4 29:8587, D · D4 68:7511, P5 59:16939): an English date (today
 * by default) → the Hijri date with the Bangladesh moon-sighting offset, adjustable by a day.
 * ?date=2027-03-10&adj=1
 */
export function HijriDateCalculator({ lang, text, offset, today: built, title }: HijriDateCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(HIJRI_PARAMS)
  const today = useToday(built)
  const date = resolveDate(values.date, today)
  const isToday = values.date === TODAY || (date !== null && dateParam(date) === dateParam(today))
  const outcome = useMemo(
    () => hijriOutcome({ lang, copy, date, isToday, offset, adjust: values.adj }),
    [lang, copy, values.date, today, offset, values.adj],
  )
  const items = useMemo(() => hijriReportItems(copy), [copy])
  const parts = { day: copy.partDay, month: copy.partMonth, year: copy.partYear, close: copy.close }

  const inputs = (
    <InputCard>
      <div class="flex flex-col gap-4">
        {date && (
          <DateField id="hijri-date" lang={lang} label={copy.dateLabel} value={date} months={gregorianMonths(lang)} today={today}
            maxYear={2099} parts={parts} onChange={(d) => set('date', dateParam(d) === dateParam(today) ? TODAY : dateParam(d))} />
        )}
        <LabeledChips
          title={copy.adjustLabel}
          label={copy.adjustLabel}
          options={ADJUST_CHIPS.map((n) => ({ value: n, label: adjustLabel(copy, n) }))}
          value={values.adj}
          onPick={(n) => set('adj', n)}
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
          <ResultCard label={result.label} value={0} text={result.text} digits={lang} sub={result.sub} />
          <SummaryCard title={result.title} rows={result.summary} />
        </>
      )}
      <ToolCallout tone="info" data-tool-callout="">
        {copy.callout}
      </ToolCallout>
      <ToolActions lang={lang} toolId="hijri-date" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
