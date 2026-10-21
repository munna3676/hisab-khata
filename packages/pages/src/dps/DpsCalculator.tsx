import type { DpsYearRow } from '@hisab/core/dps'
import type { ExciseSlab } from '@hisab/core/lib/finance-slabs'
import type { Lang } from '@hisab/i18n/locale'
import { NumberField } from '@hisab/ui/base/NumberField'
import { BreakdownTable, type BreakdownColumn } from '@hisab/ui/content/BreakdownTable'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, FieldPair, InputCard, ModeSwitch, ResultEmpty, SummaryCard, ToolCallout, fieldMessages } from '../tool/parts.tsx'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { dpsOutcome, dpsReportItems } from './model.ts'
import { DPS_PARAMS, type DpsMode } from './params.ts'

export interface DpsCalculatorProps {
  lang: Lang
  /** islandText(lang, COPY, DPS_MESSAGE_KEYS) on the server. */
  text: IslandText<typeof COPY>
  /** data/finance/excise-duty.json. */
  exciseSlabs: ExciseSlab[]
  /** The tax field's help line, from data/finance/interest-tax.json (taxHelperText). */
  taxHelper: string
  title: string
}

/**
 * The DPS calculator island (Figma F7 27:6030, F7-b quarterly 64:21115, D · F7 66:29288,
 * D · F7-b 69:39346): monthly deposit, rate, term in years, compounding and tax → the maturity
 * amount, the breakdown and a year-by-year table. ?deposit=5000&rate=9&years=5&comp=quarterly
 */
export function DpsCalculator({ lang, text, exciseSlabs, taxHelper, title }: DpsCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(DPS_PARAMS)
  const comp = values.comp as DpsMode
  const outcome = useMemo(
    () => dpsOutcome({ lang, copy, deposit: values.deposit, rate: values.rate, years: values.years, comp, tax: values.tax, exciseSlabs }),
    [lang, copy, values.deposit, values.rate, values.years, comp, values.tax, exciseSlabs],
  )
  const fields = outcome.fields ?? {}
  const messages = fieldMessages(lang)
  const items = useMemo(() => dpsReportItems(copy), [copy])

  const inputs = (
    <InputCard>
      <NumberField id="dps-deposit" name="deposit" lang={lang} label={copy.depositLabel} prefix="৳" value={values.deposit} min={1}
        error={fields.deposit} messages={messages} onValueChange={(v) => set('deposit', v)} />
      <FieldPair>
        <NumberField id="dps-rate" name="rate" lang={lang} label={copy.rateLabel} prefix="%" value={values.rate} min={0} max={100}
          formatOnBlur={false} error={fields.rate} messages={messages} onValueChange={(v) => set('rate', v)} />
        <NumberField id="dps-years" name="years" lang={lang} label={copy.termLabel} prefix={copy.yearUnit} value={values.years} min={1} max={50}
          error={fields.years} messages={messages} onValueChange={(v) => set('years', v)} />
      </FieldPair>
      <ModeSwitch
        label={copy.compLabel}
        name="comp"
        value={comp}
        options={[
          { value: 'monthly', label: copy.compMonthly },
          { value: 'quarterly', label: copy.compQuarterly },
        ]}
        onChange={(next) => set('comp', next)}
      />
      <NumberField id="dps-tax" name="tax" lang={lang} label={copy.taxLabel} prefix="%" value={values.tax} min={0} max={100}
        formatOnBlur={false} helper={taxHelper} error={fields.tax} messages={messages} onValueChange={(v) => set('tax', v)} />
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const columns: BreakdownColumn<DpsYearRow>[] = [
    { key: 'year', label: copy.colYear, format: 'number' },
    { key: 'deposit', label: copy.colDeposit, format: 'number', decimals: 0 },
    { key: 'interest', label: copy.colProfit, format: 'number', decimals: 0 },
    { key: 'balance', label: copy.colBalance, format: 'number', decimals: 0 },
  ]
  const results = (
    <>
      {!result && <ResultEmpty lang={lang} />}
      {result && (
        <>
          <ResultCard key={comp} label={result.label} value={result.value} decimals={0} digits={lang} sub={result.sub} />
          <SummaryCard title={result.summaryTitle} rows={result.summary} />
          <BreakdownTable<DpsYearRow>
            title={copy.scheduleTitle}
            titleAs="h2"
            columns={columns}
            rows={result.years}
            digits={lang}
            maxHeight="15.5rem"
            note={copy.scheduleNote}
          />
        </>
      )}
      <ToolCallout data-tool-callout="">{copy.callout}</ToolCallout>
      <ToolActions lang={lang} toolId="dps" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
