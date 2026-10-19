import { formatNumber, type Digits } from '@hisab/core/lib/format'
import { cx } from '../lib/cx'
import { Chip } from './Chip'

export interface QuickValuesProps {
  /** Amounts offered as one-tap chips, e.g. [1000, 5000, 10000, 25000]. */
  values: readonly number[]
  /** The field's current amount; the matching chip shows as selected. */
  value?: number | null
  onPick?: (value: number) => void
  /** Accessible name of the chip row, e.g. "দ্রুত পরিমাণ". */
  label: string
  /** Bangla (default) or English digits, grouped the South Asian way (১০,০০০). */
  digits?: Digits
  /** Text before each amount, e.g. "৳". */
  prefix?: string
  class?: string
}

/** A row of quick-value chips that fill a number field (Figma Chip, quick-value use). Wraps on narrow screens. */
export function QuickValues({ values, value, onPick, label, digits = 'bn', prefix = '', class: className }: QuickValuesProps) {
  return (
    <div role="group" aria-label={label} class={cx('flex flex-wrap gap-x-2', className)}>
      {values.map((v) => (
        <Chip key={v} selected={value === v} onClick={() => onPick?.(v)}>
          {prefix}
          {formatNumber(v, { digits })}
        </Chip>
      ))}
    </div>
  )
}
