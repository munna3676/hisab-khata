import type { ExciseSlab } from '@hisab/core/lib/finance-slabs'
import type { Lang } from '@hisab/i18n/locale'
import { NumberField } from '@hisab/ui/base/NumberField'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, ChoiceChips, FieldPair, InputCard, ModeSwitch, ResultEmpty, ResultError, SummaryCard, fieldMessages } from '../tool/parts.tsx'
import { fill, num } from '../tool/say.ts'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { fdrOutcome, fdrReportItems } from './model.ts'
import { FDR_PARAMS, TERM_CHIPS, type FdrPageMode } from './params.ts'

export interface FdrCalculatorProps {
  lang: Lang
  /** islandText(lang, COPY, FDR_MESSAGE_KEYS) on the server. */
  text: IslandText<typeof COPY>
  /** data/finance/excise-duty.json. */
  exciseSlabs: ExciseSlab[]
  title: string
}

/**
 * The FDR calculator island (Figma F8 27:6253, F8-b renew 64:21334, D · F8 66:29578, D · F8-b
 * 69:39636): deposit, rate, term, how profit is paid and tax → the maturity amount and the
 * breakdown. ?amount=100000&rate=10&months=12&mode=renew
 */
export function FdrCalculator({ lang, text, exciseSlabs, title }: FdrCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(FDR_PARAMS)
  const mode = values.mode as FdrPageMode
  const outcome = useMemo(
    () => fdrOutcome({ lang, copy, amount: values.amount, rate: values.rate, months: values.months, mode, tax: values.tax, exciseSlabs }),
    [lang, copy, values.amount, values.rate, values.months, mode, values.tax, exciseSlabs],
  )
  const fields = outcome.fields ?? {}
  const messages = fieldMessages(lang)
  const items = useMemo(() => fdrReportItems(copy), [copy])
  const chip = (m: number) => (m % 12 === 0 ? fill(lang, copy.chipYears, { n: num(lang, m / 12) }) : fill(lang, copy.chipMonths, { n: num(lang, m) }))

  const inputs = (
    <InputCard>
      <NumberField id="fdr-amount" name="amount" lang={lang} label={copy.amountLabel} prefix="৳" value={values.amount} min={1}
        error={fields.amount} messages={messages} onValueChange={(v) => set('amount', v)} />
      <div class="flex flex-col gap-3">
        <FieldPair>
          <NumberField id="fdr-rate" name="rate" lang={lang} label={copy.rateLabel} prefix="%" value={values.rate} min={0} max={100}
            formatOnBlur={false} error={fields.rate} messages={messages} onValueChange={(v) => set('rate', v)} />
          <NumberField id="fdr-months" name="months" lang={lang} label={copy.termLabel} prefix={copy.monthUnit} value={values.months} min={1} max={600}
            error={fields.months} messages={messages} onValueChange={(v) => set('months', v)} />
        </FieldPair>
        <ChoiceChips label={copy.termChips} options={TERM_CHIPS.map((m) => ({ value: m, label: chip(m) }))} value={values.months} onPick={(m) => set('months', m)} />
      </div>
      <ModeSwitch
        label={copy.modeLabel}
        name="mode"
        value={mode}
        options={[
          { value: 'simple', label: copy.modeSimple },
          { value: 'renew', label: copy.modeRenew },
        ]}
        onChange={(next) => set('mode', next)}
      />
      <NumberField id="fdr-tax" name="tax" lang={lang} label={copy.taxLabel} prefix="%" value={values.tax} min={0} max={100}
        formatOnBlur={false} error={fields.tax} messages={messages} onValueChange={(v) => set('tax', v)} />
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const results = (
    <>
      {outcome.kind === 'empty' && <ResultEmpty lang={lang} />}
      {outcome.kind === 'error' && <ResultError error={outcome.error} onFix={(_field, value) => set('months', value)} />}
      {result && (
        <>
          <ResultCard key={mode} label={result.label} value={result.value} decimals={0} digits={lang} sub={result.sub} />
          <SummaryCard title={result.summaryTitle} rows={result.summary} />
        </>
      )}
      <ToolActions lang={lang} toolId="fdr" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
