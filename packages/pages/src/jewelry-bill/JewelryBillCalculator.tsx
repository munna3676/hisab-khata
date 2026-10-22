import type { BajusRates } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { NumberField } from '@hisab/ui/base/NumberField'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { PRICE_FROM_RATES, priceIn, rateFor, rateLine } from '../gold/shared.ts'
import { WeightFields } from '../gold/WeightFields.tsx'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, FieldPair, InputCard, ResultEmpty, SummaryCard, ToolCallout, fieldMessages } from '../tool/parts.tsx'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { jewelryOutcome, jewelryReportItems } from './model.ts'
import { BILL_KARAT, JEWELRY_PARAMS } from './params.ts'

export interface JewelryBillCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  /** data/gold/bajus-rates.json. */
  rates: BajusRates
  title: string
}

/**
 * The jewellery bill island (Figma L4 31:9216, D · L4 68:8774): weight, the BAJUS rate, মজুরি and
 * VAT → the shop's bill, broken down. ?v=2&a=4&mk=8, ?p=220000
 */
export function JewelryBillCalculator({ lang, text, rates, title }: JewelryBillCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(JEWELRY_PARAMS)
  const rate = rateFor(rates, BILL_KARAT)
  const price = priceIn(values.p, rate)
  const outcome = useMemo(
    () =>
      jewelryOutcome({ lang, copy, vori: values.v, ana: values.a, roti: values.r, price, fromRates: values.p === PRICE_FROM_RATES, making: values.mk, vat: values.vat }),
    [lang, copy, values.v, values.a, values.r, price, values.p, values.mk, values.vat],
  )
  const items = useMemo(() => jewelryReportItems(copy), [copy])
  const fields = outcome.fields ?? {}
  const messages = fieldMessages(lang)

  const inputs = (
    <InputCard>
      <WeightFields lang={lang} idPrefix="jb" label={copy.weightLabel} units={copy} values={values} error={fields.v} onChange={(key, v) => set(key, v)} />
      <NumberField id="jb-price" name="p" lang={lang} label={copy.priceLabel} prefix="৳" value={price} min={0} helper={rateLine(lang, copy.rateLine, rates, BILL_KARAT)}
        error={fields.p} messages={messages} onValueChange={(v) => set('p', v)} />
      <FieldPair>
        <NumberField id="jb-making" name="mk" lang={lang} label={copy.makingLabel} prefix="%" value={values.mk} min={0} formatOnBlur={false}
          error={fields.mk} messages={messages} onValueChange={(v) => set('mk', v)} />
        <NumberField id="jb-vat" name="vat" lang={lang} label={copy.vatLabel} prefix="%" value={values.vat} min={0} formatOnBlur={false}
          error={fields.vat} messages={messages} onValueChange={(v) => set('vat', v)} />
      </FieldPair>
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const results = (
    <>
      {!result && <ResultEmpty lang={lang} />}
      {result && (
        <>
          <ResultCard label={result.label} value={result.value} decimals={0} digits={lang} sub={result.sub} />
          <SummaryCard title={copy.summaryTitle} rows={result.summary} />
        </>
      )}
      <ToolCallout data-tool-callout="">{copy.callout}</ToolCallout>
      <ToolActions lang={lang} toolId="jewelry-bill" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
