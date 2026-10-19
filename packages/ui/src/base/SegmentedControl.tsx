import type { ComponentChildren, JSX } from 'preact'
import { useState } from 'preact/hooks'
import { cx } from '../lib/cx'
import { useUid } from './uid'

export interface SegmentedOption<V extends string = string> {
  value: V
  label: ComponentChildren
  disabled?: boolean
}

export interface SegmentedControlProps<V extends string = string> {
  /** Two options in Figma (a mode switch); works for up to five. */
  options: readonly SegmentedOption<V>[]
  /** Controlled value; leave undefined and use defaultValue for an uncontrolled control. */
  value?: V
  defaultValue?: V
  onChange?: (value: V) => void
  /** Accessible name of the group, e.g. "হিসাবের ধরন". */
  label: string
  /** Radio group name for forms; generated when omitted. */
  name?: string
  disabled?: boolean
  class?: string
}

/**
 * Segmented Control (Figma 46:324): a native radio group drawn as a 44px switch. The
 * accent block slides to the chosen option with translate over the tab duration (220ms),
 * and the two text colours cross-fade with opacity, so nothing but transform and opacity moves.
 */
export function SegmentedControl<V extends string = string>({
  options,
  value,
  defaultValue,
  onChange,
  label,
  name,
  disabled = false,
  class: className,
}: SegmentedControlProps<V>) {
  const groupName = useUid(name, 'seg')
  const [inner, setInner] = useState<V | undefined>(defaultValue ?? options[0]?.value)
  const current = value !== undefined ? value : inner
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === current),
  )
  const count = Math.max(options.length, 1)

  const choose = (event: JSX.TargetedEvent<HTMLInputElement>) => {
    const next = event.currentTarget.value as V
    if (value === undefined) setInner(next)
    onChange?.(next)
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled ? true : undefined}
      class={cx(
        'relative isolate flex h-touch min-w-0 overflow-hidden rounded-input bg-paper',
        // 1.5px line border drawn over the options, as Figma's inside stroke sits over the selected fill.
        "after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit] after:border-[1.5px] after:border-line after:content-['']",
        // Keyboard focus is on a visually hidden radio: ring the whole control.
        'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent',
        disabled && 'opacity-50',
        className,
      )}
    >
      <span
        aria-hidden="true"
        class="absolute inset-y-0 left-0 bg-accent transition-transform duration-tab ease-out"
        style={{ width: `${100 / count}%`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((option, i) => {
        const selected = i === index
        const off = disabled || option.disabled
        return (
          <label
            key={option.value}
            class={cx(
              'relative grid min-w-0 flex-1 place-items-center px-2 text-center font-body text-[0.8125rem]/[1.25rem] font-semibold',
              off ? 'cursor-not-allowed' : 'pressable',
            )}
          >
            <input
              type="radio"
              class="sr-only"
              name={groupName}
              value={option.value}
              checked={selected}
              disabled={off}
              onChange={choose}
            />
            {/* Both colours stacked in one cell; opacity cross-fades as the accent block arrives. */}
            <span
              class={cx(
                'pointer-events-none [grid-area:1/1] text-soft transition-opacity duration-tab ease-out',
                selected ? 'opacity-0' : 'opacity-100',
              )}
            >
              {option.label}
            </span>
            <span
              aria-hidden="true"
              class={cx(
                'pointer-events-none [grid-area:1/1] text-on-accent transition-opacity duration-tab ease-out',
                selected ? 'opacity-100' : 'opacity-0',
              )}
            >
              {option.label}
            </span>
          </label>
        )
      })}
    </div>
  )
}
