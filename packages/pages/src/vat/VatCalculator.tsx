import type { Lang } from '@hisab/i18n/locale'
import { NumberField } from '@hisab/ui/base/NumberField'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, InputCard, LabeledChips, ModeSwitch, ResultEmpty, SummaryCard, ToolCallout, fieldMessages } from '../tool/parts.tsx'
import { decimal, fill } from '../tool/say.ts'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { vatCallout, vatOutcome, vatReportItems } from './model.ts'
import { VAT_PARAMS, type VatMode } from './params.ts'

export interface VatCalculatorProps {
  lang: Lang
  /** islandText(lang, COPY, VAT_MESSAGE_KEYS) on the server. */
  text: IslandText<typeof COPY>
  /** Rate chips from data/commerce/vat-rates.json (vatRateChips). */
  rates: number[]
  title: string
}

/**
 * The VAT calculator island (Figma C1 28:6772, C4-b 60:17985, D · C1 68:4691, D · C4-b 69:37970):
 * add VAT to a price, or take it out of a price with VAT. ?mode=remove&amount=1150&rate=15
 */
export function VatCalculator({ lang, text, rates, title }: VatCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(VAT_PARAMS)
  const mode = values.mode as VatMode
  const outcome = useMemo(() => vatOutcome({ lang, copy, mode, amount: values.amount, rate: values.rate }), [lang, copy, mode, values.amount, values.rate])
  const fields = outcome.fields ?? {}
  const items = useMemo(() => vatReportItems(copy), [copy])

  const inputs = (
    <InputCard>
      <ModeSwitch
        label={copy.modeLabel}
        name="mode"
        value={mode}
        options={[
          { value: 'add', label: copy.modeAdd },
          { value: 'remove', label: copy.modeRemove },
        ]}
        onChange={(next) => set('mode', next)}
      />
      <NumberField
        id="vat-amount"
        name="amount"
        lang={lang}
        label={mode === 'add' ? copy.priceLabel : copy.grossLabel}
        prefix="৳"
        value={values.amount}
        min={0}
        error={fields.amount}
        messages={fieldMessages(lang)}
        onValueChange={(v) => set('amount', v)}
      />
      <LabeledChips
        title={copy.rateLabel}
        label={copy.rateLabel}
        options={rates.map((r) => ({ value: r, label: fill(lang, copy.ratePct, { rate: decimal(lang, r, 2) }) }))}
        value={values.rate}
        onPick={(r) => set('rate', r)}
      />
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const results = (
    <>
      {!result && <ResultEmpty lang={lang} />}
      {result && (
        <>
          <ResultCard key={mode} label={result.label} value={result.value} decimals={result.decimals} digits={lang} sub={result.sub} />
          <SummaryCard title={result.summaryTitle} rows={result.summary} />
        </>
      )}
      <ToolCallout tone="info" data-tool-callout="">
        {vatCallout(lang, copy, values.rate)}
      </ToolCallout>
      <ToolActions lang={lang} toolId="vat" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
