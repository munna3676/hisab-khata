import type { BajusRates } from '@hisab/data/types'
import { plainDigits } from '@hisab/i18n/format'
import type { Lang } from '@hisab/i18n/locale'
import { NumberField } from '@hisab/ui/base/NumberField'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { PRICE_FROM_RATES, priceIn, rateFor, rateLine, type KaratId } from '../gold/shared.ts'
import { WeightFields } from '../gold/WeightFields.tsx'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, InputCard, LabeledChips, ResultEmpty, ToolCallout, fieldMessages } from '../tool/parts.tsx'
import { fill } from '../tool/say.ts'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import { UnitTable } from '../tool/UnitTable.tsx'
import type { COPY } from './copy.ts'
import { goldCallout, goldOutcome, goldReportItems } from './model.ts'
import { GOLD_PARAMS, KARAT_CHIPS } from './params.ts'

export interface GoldConverterCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  /** data/gold/bajus-rates.json. */
  rates: BajusRates
  title: string
}

/**
 * The gold converter island (Figma L3 31:9006, D · L3 68:8527): a weight in ভরি, আনা and রতি and
 * the karat → grams, every unit, and the value at the day's BAJUS rate (or a typed price).
 * ?v=1&a=8&k=21, ?p=200000
 */
export function GoldConverterCalculator({ lang, text, rates, title }: GoldConverterCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set, setValues } = useUrlState(GOLD_PARAMS)
  const karat = values.k as KaratId
  const rate = rateFor(rates, karat)
  const price = priceIn(values.p, rate)
  const outcome = useMemo(
    () => goldOutcome({ lang, copy, vori: values.v, ana: values.a, roti: values.r, karat, price }),
    [lang, copy, values.v, values.a, values.r, karat, price],
  )
  const items = useMemo(() => goldReportItems(copy), [copy])
  const helper = rate === null ? fill(lang, copy.noRate, { karat: plainDigits(lang, karat) }) : rateLine(lang, copy.rateLine, rates, karat)

  const inputs = (
    <InputCard>
      <WeightFields lang={lang} idPrefix="gold" label={copy.weightLabel} units={copy} values={values} onChange={(key, v) => set(key, v)} />
      <LabeledChips
        title={copy.karatLabel}
        label={copy.karatLabel}
        options={KARAT_CHIPS.map((k) => ({ value: k, label: plainDigits(lang, k) }))}
        value={karat}
        onPick={(k) => setValues((cur) => ({ ...cur, k, p: PRICE_FROM_RATES }))}
      />
      <NumberField id="gold-price" name="p" lang={lang} label={copy.priceLabel} prefix="৳" value={price} min={0} helper={helper}
        messages={fieldMessages(lang)} onValueChange={(v) => set('p', v)} />
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const results = (
    <>
      {!result && <ResultEmpty lang={lang} />}
      {result && (
        <>
          <ResultCard label={result.label} value={result.value} format="number" decimals={result.decimals} suffix={copy.gramUnit} digits={lang} sub={result.sub} />
          <UnitTable title={copy.tableTitle} unitLabel={copy.colUnit} valueLabel={copy.colValue} rows={result.rows} />
        </>
      )}
      <ToolCallout tone="info" data-tool-callout="">
        {goldCallout(lang, copy)}
      </ToolCallout>
      <ToolActions lang={lang} toolId="gold-converter" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
