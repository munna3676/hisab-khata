// The Figma "select" (C7 স্কিম, F11 কোন মুদ্রা?): a field-sized button that shows the current
// choice with a chevron and opens a picker sheet (P7, P8). The sheet (BottomSheet, Picker,
// preact/compat) loads on the first tap, like the report sheet, so it costs the page nothing
// up front. Without JavaScript the button shows the server-rendered choice.
import { FigmaChevronDown } from '@hisab/ui/icons/glyphs/FigmaChevronDown'
import type { ComponentChildren, ComponentType } from 'preact'
import { useState } from 'preact/hooks'
import type { ChoiceSheetProps, ChoiceOption } from './ChoiceSheet.tsx'

export type { ChoiceOption }

export interface PickerFieldProps {
  id: string
  /** Label above the button ("স্কিম", "কোন মুদ্রা?"). */
  label: string
  /** Sheet title (P7 "কোন সঞ্চয়পত্র?", P8 "কোন মুদ্রা?"). */
  title: string
  options: readonly ChoiceOption[]
  value: string
  onChange: (value: string) => void
  /** P8 has a search box; P7 lists the options only. */
  search?: { label: string; placeholder: string; empty: (query: string) => string }
  /** Small print under the options (P7 rate range, P8 verified line). */
  footer?: ComponentChildren
  closeLabel: string
}

export function PickerField({ id, label, title, options, value, onChange, search, footer, closeLabel }: PickerFieldProps) {
  const [open, setOpen] = useState(false)
  const [Sheet, setSheet] = useState<ComponentType<ChoiceSheetProps> | null>(null)
  const current = options.find((o) => o.value === value)
  const show = () => {
    setOpen(true)
    if (!Sheet) import('./ChoiceSheet.tsx').then((m) => setSheet(() => m.ChoiceSheet), () => setOpen(false))
  }
  return (
    <div class="flex min-w-0 flex-col gap-2" data-picker-field={id}>
      <p id={`${id}-label`} class="type-label text-ink">
        {label}
      </p>
      <button
        type="button"
        id={id}
        aria-haspopup="dialog"
        aria-labelledby={`${id}-label ${id}`}
        class="pressable relative flex h-13 min-h-touch w-full min-w-0 items-center justify-between gap-3 rounded-input border-[1.5px] border-line bg-subtle px-4 text-start type-body-medium text-ink"
        onClick={show}
      >
        <span class="min-w-0 truncate">{current?.label ?? value}</span>
        <FigmaChevronDown class="text-soft" />
      </button>
      {Sheet && (
        <Sheet
          open={open}
          title={title}
          options={options}
          value={value}
          search={search}
          footer={footer}
          closeLabel={closeLabel}
          onPick={(v) => {
            onChange(v)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
