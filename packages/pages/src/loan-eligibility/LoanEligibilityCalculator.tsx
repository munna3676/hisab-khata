import type { Lang } from '@hisab/i18n/locale'
import { NumberField } from '@hisab/ui/base/NumberField'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, ChoiceChips, FieldPair, InputCard, ResultEmpty, ResultError, SummaryCard, ToolCallout, fieldMessages } from '../tool/parts.tsx'
import { fill, plain } from '../tool/say.ts'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { loanEligibilityOutcome, loanEligibilityReportItems } from './model.ts'
import { LOAN_ELIGIBILITY_PARAMS } from './params.ts'

export interface LoanEligibilityCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  /** The share-of-income chips, from data/finance/loan-dbr.json (Figma: ৪০%, ৫০%). */
  dbrChips: number[]
  title: string
}

/**
 * "কত টাকা লোন পাবো?" (Figma F9 27:6477, D · F9 66:29859): income, current instalments, rate,
 * term and the share of income → the largest loan whose instalment fits.
 * ?income=60000&emi=5000&rate=12&years=5&dbr=50
 */
export function LoanEligibilityCalculator({ lang, text, dbrChips, title }: LoanEligibilityCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(LOAN_ELIGIBILITY_PARAMS)
  const outcome = useMemo(
    () => loanEligibilityOutcome({ lang, copy, income: values.income, emi: values.emi, rate: values.rate, years: values.years, dbr: values.dbr }),
    [lang, copy, values.income, values.emi, values.rate, values.years, values.dbr],
  )
  const fields = outcome.fields ?? {}
  const messages = fieldMessages(lang)
  const items = useMemo(() => loanEligibilityReportItems(copy), [copy])

  const inputs = (
    <InputCard>
      <NumberField id="loan-income" name="income" lang={lang} label={copy.incomeLabel} prefix="৳" value={values.income} min={1}
        error={fields.income} messages={messages} onValueChange={(v) => set('income', v)} />
      <NumberField id="loan-emi" name="emi" lang={lang} label={copy.emiLabel} prefix="৳" value={values.emi} min={0}
        error={fields.emi} messages={messages} onValueChange={(v) => set('emi', v)} />
      <FieldPair>
        <NumberField id="loan-rate" name="rate" lang={lang} label={copy.rateLabel} prefix="%" value={values.rate} min={0} max={100}
          formatOnBlur={false} error={fields.rate} messages={messages} onValueChange={(v) => set('rate', v)} />
        <NumberField id="loan-years" name="years" lang={lang} label={copy.termLabel} prefix={copy.yearUnit} value={values.years} min={1} max={50}
          error={fields.years} messages={messages} onValueChange={(v) => set('years', v)} />
      </FieldPair>
      <div class="flex flex-col gap-1">
        <p class="type-label text-ink" aria-hidden="true">
          {copy.dbrLabel}
        </p>
        <ChoiceChips
          label={copy.dbrLabel}
          options={dbrChips.map((n) => ({ value: n, label: fill(lang, copy.pct, { n: plain(lang, n) }) }))}
          value={values.dbr}
          onPick={(n) => set('dbr', n)}
        />
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
          <ResultCard label={result.label} value={result.value} decimals={result.decimals} suffix={result.suffix} digits={lang} sub={result.sub} />
          <SummaryCard title={result.summaryTitle} rows={result.summary} />
        </>
      )}
      <ToolCallout data-tool-callout="">{copy.callout}</ToolCallout>
      <ToolActions lang={lang} toolId="loan-eligibility" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
