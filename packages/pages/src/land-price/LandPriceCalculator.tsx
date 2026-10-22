import type { LandUnit } from '@hisab/core/land'
import type { Lang } from '@hisab/i18n/locale'
import { NumberField } from '@hisab/ui/base/NumberField'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { unitOptions } from '../land/units.ts'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, FieldPair, InputCard, ResultEmpty, SummaryCard, ToolCallout, fieldMessages } from '../tool/parts.tsx'
import { PickerField } from '../tool/PickerField.tsx'
import { fill } from '../tool/say.ts'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { landPriceOutcome, landPriceReportItems } from './model.ts'
import { LAND_PRICE_PARAMS } from './params.ts'

export interface LandPriceCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  title: string
}

/**
 * The land price island (Figma L2 31:8835, D · L2 68:8251, P3 59:16558): the area, its unit and
 * the price per unit → the total, in words, and the price per শতাংশ, বর্গফুট and কাঠা.
 * ?area=10&unit=decimal&price=500000
 */
export function LandPriceCalculator({ lang, text, title }: LandPriceCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(LAND_PRICE_PARAMS)
  const unit = values.unit as LandUnit
  const outcome = useMemo(() => landPriceOutcome({ lang, copy, area: values.area, unit, price: values.price }), [lang, copy, values.area, unit, values.price])
  const options = useMemo(() => unitOptions(lang, copy, undefined, unit), [lang, copy, unit])
  const items = useMemo(() => landPriceReportItems(copy), [copy])
  const fields = outcome.fields ?? {}
  const messages = fieldMessages(lang)

  const inputs = (
    <InputCard>
      <FieldPair>
        <NumberField id="lp-area" name="area" lang={lang} label={copy.areaLabel} prefix="#" value={values.area} min={0} formatOnBlur={false}
          error={fields.area} messages={messages} onValueChange={(v) => set('area', v)} />
        <PickerField id="lp-unit" label={copy.unitLabel} title={copy.pickerTitle} options={options} value={unit}
          onChange={(v) => set('unit', v as LandUnit)} closeLabel={copy.close} />
      </FieldPair>
      <NumberField id="lp-price" name="price" lang={lang} label={fill(lang, copy.priceLabel, { unit: copy.unitOf[unit] })} prefix="৳" value={values.price}
        min={0} error={fields.price} messages={messages} onValueChange={(v) => set('price', v)} />
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const results = (
    <>
      {!result && <ResultEmpty lang={lang} />}
      {result && (
        <>
          <ResultCard label={result.label} value={result.value} decimals={0} digits={lang} sub={result.sub} />
          <SummaryCard title={copy.otherTitle} rows={result.summary} />
        </>
      )}
      <ToolCallout tone="info" data-tool-callout="">
        {copy.callout}
      </ToolCallout>
      <ToolActions lang={lang} toolId="land-price" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
