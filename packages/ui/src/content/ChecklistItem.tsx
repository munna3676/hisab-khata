import type { ComponentChildren, InputHTMLAttributes, JSX } from 'preact'
import { Icon } from '../icons/Icon'
import { cx } from '../lib/cx'
import { useResync } from './controlled'

export interface ChecklistItemProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'class' | 'className' | 'type' | 'label' | 'onChange' | 'checked' | 'defaultChecked'> {
  /** What to have ready, e.g. "জন্ম নিবন্ধন সনদের কপি". */
  label: ComponentChildren
  /** Controlled state (Figma Checked=true|false). Leave undefined for a native, uncontrolled box. */
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean, event: JSX.TargetedEvent<HTMLInputElement>) => void
  /** Drops the bottom rule (last row of a list). */
  last?: boolean
  class?: string
}

/**
 * Checklist Item (Figma 9:266): a native checkbox drawn as a 22px box. Ticked, the box
 * turns green and the tick draws itself with stroke-dashoffset over 240 ms (content.css),
 * and the text softens. Everything follows :checked in CSS, so it works as zero-JS HTML;
 * the whole 51px row is the hit area and presses like every pressable.
 */
export function ChecklistItem({
  label,
  checked,
  defaultChecked,
  onChange,
  last = false,
  disabled,
  class: className,
  ...input
}: ChecklistItemProps) {
  const resync = useResync()
  return (
    <label
      class={cx(
        'hkc-check relative flex min-h-touch min-w-0 items-center gap-3 py-3 [--hover-tint-opacity:0.04]',
        disabled ? 'cursor-not-allowed opacity-50' : 'pressable',
        !last && 'border-b border-line',
        className,
      )}
    >
      <input
        {...input}
        type="checkbox"
        class="peer sr-only"
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={(event: JSX.TargetedEvent<HTMLInputElement>) => {
          onChange?.(event.currentTarget.checked, event)
          if (checked !== undefined) resync()
        }}
      />
      <span
        aria-hidden="true"
        class="grid size-5.5 shrink-0 place-items-center rounded-[6px] border-[1.5px] border-line text-on-accent peer-checked:border-good peer-checked:bg-good peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
      >
        <Icon size={16} stroke-width={2.75}>
          <path class="hkc-tick" pathLength={1} d="M5 12.5l4.5 4.5L19 7.5" />
        </Icon>
      </span>
      <span class="min-w-0 flex-1 type-body text-ink peer-checked:text-soft">{label}</span>
    </label>
  )
}
