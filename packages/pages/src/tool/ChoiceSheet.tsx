// Picker sheet for PickerField (Figma P7 পিকার — সঞ্চয়পত্রের ধরন, P8 পিকার — মুদ্রা): loaded on
// the first tap. With `search` it is the shared Picker (search box + option cards); without, the
// option cards alone, as P7 shows them.
import { Check } from '@hisab/ui/icons/common'
import { cx } from '@hisab/ui/lib/cx'
import { BottomSheet } from '@hisab/ui/overlay/BottomSheet'
import { Picker } from '@hisab/ui/overlay/Picker'
import type { ComponentChildren } from 'preact'

export interface ChoiceOption {
  value: string
  label: string
  /** Second line ("৫ বছর · মাসিক মুনাফা", "১ SAR = ৳৩২.৬৪"). */
  description?: string
  /** Shown but not pickable (P8 MYR: not on the bank's sheet). */
  disabled?: boolean
  /** Extra words the search matches (Banglish, codes). */
  keywords?: string[]
}

export interface ChoiceSheetProps {
  open: boolean
  title: string
  options: readonly ChoiceOption[]
  value: string
  search?: { label: string; placeholder: string; empty: (query: string) => string }
  footer?: ComponentChildren
  closeLabel: string
  onPick: (value: string) => void
  onClose: () => void
}

export function ChoiceSheet({ open, title, options, value, search, footer, closeLabel, onPick, onClose }: ChoiceSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} closeLabel={closeLabel}>
      <div class="grid min-w-0 gap-4" data-choice-sheet>
        {search ? (
          <Picker
            options={options}
            value={value}
            label={title}
            searchLabel={search.label}
            searchPlaceholder={search.placeholder}
            emptyText={search.empty}
            onChange={(v) => onPick(v)}
          />
        ) : (
          <div role="listbox" aria-label={title} class="grid min-w-0 gap-4">
            {options.map((option) => {
              const selected = option.value === value
              return (
                <div
                  key={option.value}
                  role="option"
                  tabIndex={0}
                  aria-selected={selected}
                  aria-disabled={option.disabled || undefined}
                  onClick={() => !option.disabled && onPick(option.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !option.disabled) {
                      e.preventDefault()
                      onPick(option.value)
                    }
                  }}
                  class={cx(
                    'flex min-h-touch min-w-0 items-center gap-3 rounded-card px-4 py-3 text-left [--hover-tint-opacity:0.04]',
                    option.disabled ? 'cursor-not-allowed opacity-50' : 'pressable cursor-pointer',
                    selected ? 'border-[1.5px] border-accent bg-accent-tint' : 'border border-line bg-paper',
                  )}
                >
                  <span class="grid min-w-0 flex-1 gap-0.5">
                    <span class="type-body-medium text-ink">{option.label}</span>
                    {option.description && <span class="type-body-small text-soft">{option.description}</span>}
                  </span>
                  {selected && <Check class="text-ink" />}
                </div>
              )
            })}
          </div>
        )}
        {footer != null && <div class="type-body-small text-soft">{footer}</div>}
      </div>
    </BottomSheet>
  )
}
