import type { Lang } from '@hisab/i18n/locale'
import { NumberField } from '@hisab/ui/base/NumberField'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, FieldPair, InputCard, ResultEmpty, ToolCallout, fieldMessages } from '../tool/parts.tsx'
import { fill } from '../tool/say.ts'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { loanCompareOutcome, loanCompareReportItems } from './model.ts'
import { OfferTable } from './OfferTable.tsx'
import { LOAN_COMPARE_PARAMS, OFFERS, type OfferKey } from './params.ts'

export interface LoanCompareCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  title: string
}

type Key = keyof typeof LOAN_COMPARE_PARAMS

/**
 * "দুটো লোন অফার তুলনা" (Figma F10 27:6681, D · F10 66:30163): loan, rate, term and processing
 * fee for two offers → which costs less in total, and the figures side by side.
 * ?ap=500000&ar=12&ay=3&af=1&bp=500000&br=11&by=3&bf=2
 */
export function LoanCompareCalculator({ lang, text, title }: LoanCompareCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(LOAN_COMPARE_PARAMS)
  const offers = useMemo(
    () => ({
      a: { p: values.ap, r: values.ar, y: values.ay, f: values.af },
      b: { p: values.bp, r: values.br, y: values.by, f: values.bf },
    }),
    [values.ap, values.ar, values.ay, values.af, values.bp, values.br, values.by, values.bf],
  )
  const outcome = useMemo(() => loanCompareOutcome({ lang, copy, offers }), [lang, copy, offers])
  const fields = outcome.fields ?? {}
  const messages = fieldMessages(lang)
  const items = useMemo(() => loanCompareReportItems(copy), [copy])

  const field = (offer: OfferKey, f: 'p' | 'r' | 'y' | 'f') => {
    const key = `${offer}${f}` as Key
    const common = { id: `loan-compare-${key}`, name: key, lang, value: values[key], error: fields[key], messages, onValueChange: (v: number | null) => set(key, v) }
    if (f === 'p') return <NumberField {...common} label={copy.principalLabel} prefix="৳" min={1} />
    if (f === 'r') return <NumberField {...common} label={copy.rateLabel} prefix="%" min={0} max={100} formatOnBlur={false} />
    if (f === 'y') return <NumberField {...common} label={copy.termLabel} prefix={copy.yearUnit} min={1} max={50} />
    return <NumberField {...common} label={copy.feeLabel} prefix="%" min={0} max={100} formatOnBlur={false} />
  }

  const inputs = (
    <InputCard>
      {OFFERS.map((offer) => (
        <fieldset key={offer} class="flex min-w-0 flex-col gap-4" data-offer={offer}>
          <legend class="mb-3 type-label text-accent">{fill(lang, copy.offer, { name: offer.toUpperCase() })}</legend>
          {/* Figma pairs loan and rate; the loan gets its own row so ৫,০০,০০০ fits at 390px. */}
          {field(offer, 'p')}
          <FieldPair>
            {field(offer, 'r')}
            {field(offer, 'y')}
          </FieldPair>
          <FieldPair>{field(offer, 'f')}</FieldPair>
        </fieldset>
      ))}
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const results = (
    <>
      {!result && <ResultEmpty lang={lang} />}
      {result && (
        <>
          <ResultCard label={result.label} value={result.value} decimals={0} suffix={result.suffix} digits={lang} sub={result.sub} />
          <OfferTable title={copy.tableTitle} offerNames={result.offerNames} rows={result.rows} lowestLabel={copy.lowest} />
        </>
      )}
      <ToolCallout tone="info" data-tool-callout="">
        {copy.callout}
      </ToolCallout>
      <ToolActions lang={lang} toolId="loan-compare" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
