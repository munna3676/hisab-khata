// The Figma L3/L4 "ওজন" row: ভরি, আনা and রতি boxes side by side, the unit word on the right.
import type { Lang } from '@hisab/i18n/locale'
import { NumberField } from '@hisab/ui/base/NumberField'
import { fieldMessages } from '../tool/parts.tsx'

export interface WeightFieldsProps {
  lang: Lang
  idPrefix: string
  label: string
  units: { vori: string; ana: string; roti: string }
  values: { v: number | null; a: number | null; r: number | null }
  error?: string
  onChange: (key: 'v' | 'a' | 'r', value: number | null) => void
}

export function WeightFields({ lang, idPrefix, label, units, values, error, onChange }: WeightFieldsProps) {
  const messages = fieldMessages(lang)
  const field = (key: 'v' | 'a' | 'r', unit: string, err?: string) => (
    <NumberField id={`${idPrefix}-${key}`} name={key} lang={lang} label={`${label}: ${unit}`} suffix={unit}
      boxClass="[&>span:last-child]:min-w-0 [&>span:last-child]:px-2"
      value={values[key]} min={0} formatOnBlur={false} error={err} messages={messages} onValueChange={(v) => onChange(key, v)} />
  )
  return (
    <div role="group" aria-labelledby={`${idPrefix}-weight`} class="@container flex min-w-0 flex-col gap-2" data-weight-fields>
      <p id={`${idPrefix}-weight`} class="type-label text-ink">
        {label}
      </p>
      {/* Each box keeps its full name ("ওজন: ভরি") for screen readers; the visible label is the one above.
          Three in a row (Figma) once each input can be 44px wide; stacked on the narrowest phones. */}
      <div class="grid grid-cols-1 gap-2 @[19rem]:grid-cols-3 [&>*]:min-w-0 [&_label>span:first-child]:sr-only">
        {field('v', units.vori, error)}
        {field('a', units.ana)}
        {field('r', units.roti)}
      </div>
    </div>
  )
}
