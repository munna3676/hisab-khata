import type { Lang } from '@hisab/i18n/locale'
import { NumberField } from '@hisab/ui/base/NumberField'
import { BreakdownTable, type BreakdownColumn } from '@hisab/ui/content/BreakdownTable'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import type { EmiRow } from '@hisab/core/emi'
import { useMemo } from 'preact/hooks'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, ChoiceChips, InputCard, ResultEmpty, SummaryCard, ToolCallout, fieldMessages } from '../tool/parts.tsx'
import { fill, num } from '../tool/say.ts'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { emiOutcome, emiReportItems } from './model.ts'
import { EMI_PARAMS, TERM_CHIPS } from './params.ts'
import { SplitBar } from './SplitBar.tsx'

export interface EmiCalculatorProps {
  lang: Lang
  /** islandText(lang, COPY, EMI_MESSAGE_KEYS) on the server. */
  text: IslandText<typeof COPY>
  /** Page name, for the share sheet. */
  title: string
}

/**
 * The EMI calculator island (Figma F6 27:5771, D · F6 66:29012): amount, rate and term → the
 * monthly instalment, totals, the principal/interest split and the month-by-month schedule
 * (all months; the print layout prints them all). ?amount=500000&rate=12&months=36
 */
export function EmiCalculator({ lang, text, title }: EmiCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(EMI_PARAMS)
  const outcome = useMemo(
    () => emiOutcome({ lang, copy, amount: values.amount, rate: values.rate, months: values.months }),
    [lang, copy, values.amount, values.rate, values.months],
  )
  const fields = outcome.fields ?? {}
  const messages = fieldMessages(lang)
  const items = useMemo(() => emiReportItems(copy), [copy])
  const years = (months: number) => fill(lang, copy.years, { n: num(lang, months / 12) })

  const inputs = (
    <InputCard>
      <NumberField
        id="emi-amount"
        name="amount"
        lang={lang}
        label={copy.amountLabel}
        prefix="৳"
        value={values.amount}
        min={1}
        error={fields.amount}
        messages={messages}
        onValueChange={(v) => set('amount', v)}
      />
      <NumberField
        id="emi-rate"
        name="rate"
        lang={lang}
        label={copy.rateLabel}
        prefix="%"
        value={values.rate}
        min={0}
        max={100}
        formatOnBlur={false}
        helper={copy.rateHelper}
        error={fields.rate}
        messages={messages}
        onValueChange={(v) => set('rate', v)}
      />
      <div class="flex flex-col gap-3">
        <NumberField
          id="emi-months"
          name="months"
          lang={lang}
          label={copy.termLabel}
          prefix={copy.monthUnit}
          value={values.months}
          min={1}
          max={600}
          error={fields.months}
          messages={messages}
          onValueChange={(v) => set('months', v)}
        />
        <ChoiceChips
          label={copy.termChips}
          options={TERM_CHIPS.map((m) => ({ value: m, label: years(m) }))}
          value={values.months}
          onPick={(m) => set('months', m)}
        />
      </div>
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const columns: BreakdownColumn<EmiRow>[] = [
    { key: 'month', label: copy.colMonth, format: 'number' },
    { key: 'principal', label: copy.colPrincipal, format: 'number', decimals: 0 },
    { key: 'interest', label: copy.colInterest, format: 'number', decimals: 0 },
    { key: 'balance', label: copy.colBalance, format: 'number', decimals: 0 },
  ]
  const results = (
    <>
      {!result && <ResultEmpty lang={lang} />}
      {result && (
        <>
          <ResultCard label={result.label} value={result.value} decimals={0} digits={lang} sub={result.sub} />
          <SummaryCard title={result.summaryTitle} rows={result.summary} />
          <SplitBar {...result.split} />
          <BreakdownTable<EmiRow>
            title={copy.scheduleTitle}
            titleAs="h2"
            columns={columns}
            rows={result.schedule}
            digits={lang}
            maxHeight="15.5rem"
            note={copy.scheduleNote}
          />
        </>
      )}
      <ToolCallout tone="info" data-tool-callout="">
        {copy.callout}
      </ToolCallout>
      <ToolActions lang={lang} toolId="emi" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
