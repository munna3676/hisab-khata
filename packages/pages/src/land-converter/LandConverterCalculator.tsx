import type { LandUnit } from '@hisab/core/land'
import type { LandConventionChip } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { NumberField } from '@hisab/ui/base/NumberField'
import { ResultCard } from '@hisab/ui/nav/ResultCard'
import { useMemo } from 'preact/hooks'
import { unitOptions } from '../land/units.ts'
import { useUrlState } from '../tool/hooks.ts'
import { CalculatorFrame, ChoiceChips, InputCard, LabeledChips, ResultEmpty, ToolCallout, fieldMessages } from '../tool/parts.tsx'
import { PickerField } from '../tool/PickerField.tsx'
import { useIslandText, type IslandText } from '../tool/text.ts'
import { ToolActions } from '../tool/ToolActions.tsx'
import { UnitTable } from '../tool/UnitTable.tsx'
import type { COPY } from './copy.ts'
import { conventionFor, landCallout, landOutcome, landReportItems } from './model.ts'
import { LAND_PARAMS, type AreaId } from './params.ts'

export interface LandConverterCalculatorProps {
  lang: Lang
  text: IslandText<typeof COPY>
  /** data/land/conventions.json: the area chips. */
  conventions: LandConventionChip[]
  title: string
}

/**
 * The land converter island (Figma L1 31:8623, P3 59:16558, D · L1 68:8014, D · P3 70:19840): an
 * area in one unit (picked in the P3 sheet) → the same area in every unit, with the কাঠা size of
 * the area. ?n=5&unit=katha&area=custom&ks=726
 */
export function LandConverterCalculator({ lang, text, conventions, title }: LandConverterCalculatorProps) {
  const copy = useIslandText(lang, text)
  const { values, set, setValues } = useUrlState(LAND_PARAMS)
  const unit = values.unit as LandUnit
  const area = values.area as AreaId
  const outcome = useMemo(
    () => landOutcome({ lang, copy, value: values.n, unit, area, kathaSqft: values.ks, conventions }),
    [lang, copy, values.n, unit, area, values.ks, conventions],
  )
  const convention = area === 'custom' && values.ks === null ? undefined : conventionFor(area, values.ks, conventions)
  const options = useMemo(() => unitOptions(lang, copy, convention, unit), [lang, copy, area, values.ks, unit])
  const items = useMemo(() => landReportItems(copy), [copy])
  const fields = outcome.fields ?? {}
  const messages = fieldMessages(lang)
  const chipName = (c: LandConventionChip) => (lang === 'bn' ? c.label : (copy.areaChip as Record<string, string>)[c.id] ?? c.label)
  const standard = conventions.find((c) => c.id === 'standard')
  const others = conventions.filter((c) => c.id !== 'standard')

  const inputs = (
    <InputCard>
      <NumberField id="land-n" name="n" lang={lang} label={copy.amountLabel} prefix="#" value={values.n} min={0} formatOnBlur={false}
        error={fields.n} messages={messages} onValueChange={(v) => set('n', v)} />
      <PickerField id="land-unit" label={copy.unitLabel} title={copy.pickerTitle} options={options} value={unit}
        onChange={(v) => set('unit', v as LandUnit)} closeLabel={copy.close} />
      <div class="flex flex-col gap-3">
        <LabeledChips
          title={copy.areaLabel}
          label={copy.areaLabel}
          options={[
            { value: 'standard', label: standard ? chipName(standard) : copy.areaChip.standard },
            { value: 'other', label: copy.otherArea },
          ]}
          value={area === 'standard' ? 'standard' : 'other'}
          onPick={(v) => (v === 'standard' ? set('area', 'standard') : area === 'standard' && set('area', 'custom'))}
        />
        {area !== 'standard' && (
          <ChoiceChips
            label={copy.otherAreaLabel}
            options={[...others.map((c) => ({ value: c.id, label: chipName(c) })), { value: 'custom', label: copy.customChip }]}
            value={area}
            onPick={(v) => setValues((cur) => ({ ...cur, area: v as AreaId }))}
          />
        )}
        {area === 'custom' && (
          <NumberField id="land-ks" name="ks" lang={lang} label={copy.kathaSqftLabel} suffix={copy.sqftUnit} value={values.ks} min={0}
            formatOnBlur={false} error={fields.ks} messages={messages} onValueChange={(v) => set('ks', v)} />
        )}
      </div>
    </InputCard>
  )

  const result = outcome.kind === 'result' ? outcome.result : null
  const results = (
    <>
      {!result && <ResultEmpty lang={lang} />}
      {result && (
        <>
          <ResultCard label={result.label} value={result.value} format="number" decimals={result.decimals} suffix={result.suffix} digits={lang} sub={result.sub} />
          <UnitTable title={copy.tableTitle} unitLabel={copy.colUnit} valueLabel={copy.colValue} rows={result.rows} />
        </>
      )}
      <ToolCallout tone="info" data-tool-callout="">
        {landCallout(lang, copy)}
      </ToolCallout>
      <ToolActions lang={lang} toolId="land-converter" title={title} shareText={result?.shareText} reportItems={items} />
    </>
  )

  return <CalculatorFrame inputs={inputs} results={results} />
}
