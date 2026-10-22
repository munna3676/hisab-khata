import type { Lang } from '@hisab/i18n/locale'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { DateField } from '../tool/DateField.tsx'
import { gregorianMonths } from '../tool/date-say.ts'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, ChoiceChips, InputCard, ResultEmpty, ResultError, SummaryCard } from '../tool/parts.tsx'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { dateParam, resolveDate, useToday } from '../tool/today.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import { TODAY } from '../tool/url-state.ts'
import type { COPY } from './copy.ts'
import { ageOutcome, ageReportItems } from './model.ts'
import { AGE_PARAMS } from './params.ts'

export interface AgeCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  /** The build day, YYYY-MM-DD: "today" until the browser knows the real day. */
  today: string
  title: string
}

/**
 * The age island (Figma D1 29:8051, D · D1 68:6790, P5 59:16939): date of birth and the date to
 * measure on (আজ or another date) → age in years, months and days, the next birthday and the
 * same age in months, weeks and days. ?birth=2000-03-15&on=2027-01-01
 */
export function AgeCalculator({ lang, text, today: built, title }: AgeCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(AGE_PARAMS)
  const today = useToday(built)
  const birth = resolveDate(values.birth, today)
  const on = resolveDate(values.on, today)
  const outcome = useMemo(() => ageOutcome({ lang, copy, birth, on }), [lang, copy, values.birth, values.on, today])
  const items = useMemo(() => ageReportItems(copy), [copy])
  const months = gregorianMonths(lang)
  const parts = { day: copy.partDay, month: copy.partMonth, year: copy.partYear, close: copy.close }
  const isToday = values.on === TODAY

  const inputs = (
    <InputCard>
      <div class="flex flex-col gap-4">
        {birth && (
          <DateField id="age-birth" lang={lang} label={copy.birthLabel} value={birth} months={months} today={today} parts={parts}
            onChange={(d) => set('birth', dateParam(d))} />
        )}
        {on && (
          <DateField id="age-on" lang={lang} label={copy.onLabel} value={on} months={months} today={today} parts={parts}
            onChange={(d) => set('on', dateParam(d) === dateParam(today) ? TODAY : dateParam(d))} />
        )}
        <ChoiceChips
          label={copy.onChips}
          options={[
            { value: 'today', label: copy.today },
            { value: 'other', label: copy.otherDate },
          ]}
          value={isToday ? 'today' : 'other'}
          onPick={(v) => (v === 'today' ? set('on', TODAY) : document.getElementById('age-on')?.click())}
        />
      </div>
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const results = (
    <>
      {outcome.kind === 'empty' && <ResultEmpty lang={lang} />}
      {outcome.kind === 'error' && <ResultError error={outcome.error} onFix={() => set('on', TODAY)} />}
      {result && (
        <>
          <ResultCard label={result.label} value={0} text={result.text} digits={lang} sub={result.sub} />
          <SummaryCard title={copy.summaryTitle} rows={result.summary} />
        </>
      )}
      <ToolActions lang={lang} toolId="age" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
