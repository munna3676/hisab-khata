import type { SpecialDay } from '@hisab/core/bangla-date'
import type { Lang } from '@hisab/i18n/locale'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { DateField } from '../tool/DateField.tsx'
import { BanglaDateSelect } from '../tool/BanglaDateSelect.tsx'
import { banglaMonths } from '../tool/bangla-months.ts'
import { gregorianMonths } from '../tool/date-say.ts'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, InputCard, ModeSwitch, ResultEmpty, ResultError, SummaryCard, ToolCallout } from '../tool/parts.tsx'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { dateParam, dateParts, resolveDate, useToday } from '../tool/today.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { banglaDateOutcome, banglaDateReportItems } from './model.ts'
import { BANGLA_DATE_PARAMS, BANGLA_YEARS, type BanglaDir } from './params.ts'

export interface BanglaDateCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  /** data/dates/special-days.json. */
  specialDays: SpecialDay[]
  /** data/dates/hijri-offset.json. */
  hijriOffset: number
  /** The build day, YYYY-MM-DD (marks today in the date sheet). */
  today: string
  title: string
}

/**
 * The Bangla date island (Figma D3 29:8406, D5-b 60:18179, D · D3 68:7265, D · D5-b 69:38230):
 * an English date → বাংলা তারিখ, or back, with weekday, ঋতু, special day and the Hijri date.
 * ?date=2026-12-16, ?dir=to-en&bdate=1434-01-01
 */
export function BanglaDateCalculator({ lang, text, specialDays, hijriOffset, today: built, title }: BanglaDateCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(BANGLA_DATE_PARAMS)
  const today = useToday(built)
  const dir = values.dir as BanglaDir
  const date = resolveDate(values.date, today)
  const bdate = dateParts(values.bdate)
  const outcome = useMemo(
    () => banglaDateOutcome({ lang, copy, dir, date, bdate, specialDays, hijriOffset }),
    [lang, copy, dir, values.date, values.bdate, specialDays, hijriOffset],
  )
  const items = useMemo(() => banglaDateReportItems(copy), [copy])
  const parts = { day: copy.partDay, month: copy.partMonth, year: copy.partYear, close: copy.close }

  const inputs = (
    <InputCard>
      <ModeSwitch<BanglaDir>
        label={copy.dirLabel}
        name="bangla-date-dir"
        value={dir}
        options={[
          { value: 'to-bn', label: copy.toBn },
          { value: 'to-en', label: copy.toEn },
        ]}
        onChange={(v) => set('dir', v)}
      />
      {dir === 'to-bn' && date && (
        <DateField id="bd-date" lang={lang} label={copy.gregorianLabel} value={date} months={gregorianMonths(lang)} today={today} parts={parts}
          onChange={(d) => set('date', dateParam(d))} />
      )}
      {dir === 'to-en' && bdate && (
        <BanglaDateSelect id="bd-bdate" lang={lang} label={copy.banglaLabel} value={bdate} months={banglaMonths(lang)}
          minYear={BANGLA_YEARS.min} maxYear={BANGLA_YEARS.max} parts={parts} onChange={(d) => set('bdate', dateParam(d))} />
      )}
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const results = (
    <>
      {outcome.kind === 'empty' && <ResultEmpty lang={lang} />}
      {outcome.kind === 'error' && (
        <ResultError error={outcome.error} onFix={(_field, day) => bdate && set('bdate', dateParam({ ...bdate, day }))} />
      )}
      {result && (
        <>
          <ResultCard key={dir} label={result.label} value={0} text={result.text} digits={lang} sub={result.sub} />
          <SummaryCard title={copy.detailsTitle} rows={result.summary} />
        </>
      )}
      <ToolCallout tone="info" data-tool-callout="">
        {copy.callout}
      </ToolCallout>
      <ToolActions lang={lang} toolId="bangla-date" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
