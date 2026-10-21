import type { Lang } from '@hisab/i18n/locale'
import { KVList, KVRow } from '@hisab/ui/base/KVRow'
import { NumberField } from '@hisab/ui/base/NumberField'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, ChoiceChips, FieldPair, InputCard, ResultEmpty, fieldMessages } from '../tool/parts.tsx'
import { fill, num } from '../tool/say.ts'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import type { COPY } from './copy.ts'
import { discountOutcome, discountReportItems, percentOfLine } from './model.ts'
import { DISCOUNT_CHIPS, DISCOUNT_PARAMS } from './params.ts'

export interface DiscountCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  title: string
}

/**
 * The discount and percentage island (Figma C2 28:6970, D · C2 68:4983): the price after a
 * discount, and x% of any number in the "শতাংশ হিসাব" card. ?price=2500&off=20&n=5000&pct=15
 */
export function DiscountCalculator({ lang, text, title }: DiscountCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set } = useUrlState(DISCOUNT_PARAMS)
  const outcome = useMemo(() => discountOutcome({ lang, copy, price: values.price, off: values.off }), [lang, copy, values.price, values.off])
  const line = useMemo(() => percentOfLine(lang, copy, values.n, values.pct), [lang, copy, values.n, values.pct])
  const fields = outcome.fields ?? {}
  const messages = fieldMessages(lang)
  const items = useMemo(() => discountReportItems(copy), [copy])

  const inputs = (
    <InputCard>
      <NumberField id="discount-price" name="price" lang={lang} label={copy.priceLabel} prefix="৳" value={values.price} min={0}
        error={fields.price} messages={messages} onValueChange={(v) => set('price', v)} />
      <div class="flex flex-col gap-3">
        <NumberField id="discount-off" name="off" lang={lang} label={copy.offLabel} prefix="%" value={values.off} min={0} max={100}
          formatOnBlur={false} error={fields.off} messages={messages} onValueChange={(v) => set('off', v)} />
        <ChoiceChips
          label={copy.offChips}
          options={DISCOUNT_CHIPS.map((n) => ({ value: n, label: fill(lang, copy.pctChip, { n: num(lang, n) }) }))}
          value={values.off}
          onPick={(n) => set('off', n)}
        />
      </div>
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const results = (
    <>
      {!result && <ResultEmpty lang={lang} />}
      {result && <ResultCard label={result.label} value={result.value} decimals={result.decimals} digits={lang} sub={result.sub} />}
      <section class="flex flex-col gap-3 rounded-card border border-line bg-sheet px-4 pt-3.5 pb-2" aria-labelledby="percent-title" data-summary>
        <h2 id="percent-title" class="type-h3 text-ink">
          {copy.percentTitle}
        </h2>
        <FieldPair>
          <NumberField id="percent-n" name="n" lang={lang} label={copy.numberLabel} prefix="৳" value={values.n}
            messages={messages} onValueChange={(v) => set('n', v)} />
          <NumberField id="percent-pct" name="pct" lang={lang} label={copy.percentLabel} prefix="%" value={values.pct}
            formatOnBlur={false} messages={messages} onValueChange={(v) => set('pct', v)} />
        </FieldPair>
        <KVList aria-live="polite">
          <KVRow label={line.label} value={line.value} total />
        </KVList>
      </section>
      <ToolActions lang={lang} toolId="discount-percentage" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
