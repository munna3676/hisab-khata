import type { ButtonHTMLAttributes, ComponentChildren } from 'preact'
import { cx } from '../lib/cx'

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'class'> {
  /** Figma State=Selected. Sets aria-pressed, so the chip reads as a toggle. Leave undefined for a plain action chip. */
  selected?: boolean
  /** Number/M (IBM Plex Mono) for amounts like ৫,০০০ (Figma); false = Body/Label for word filters. */
  numeric?: boolean
  /** Optional 18px leading icon. */
  icon?: ComponentChildren
  class?: string
  children: ComponentChildren
}

/**
 * Chip (Figma 5:37): quick value or filter. The pill is 36px tall as in Figma, drawn
 * by ::before inside a 44px hit area, so the button meets the touch-target rule.
 * The keyboard focus ring (2px accent, 2px out) is drawn around that pill, not the hit area.
 */
export function Chip({ selected, numeric = true, icon, disabled, class: className, children, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      aria-pressed={selected}
      class={cx(
        'pressable inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 whitespace-nowrap',
        // The visible 36px pill and the press tint, 4px in from the 44px hit area.
        "before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-1 before:-z-10 before:rounded-full before:border before:content-['']",
        'after:inset-y-1',
        // Keyboard focus: the 2px ring follows the 36px pill (the hit area's own outline is hidden).
        'focus-visible:outline-hidden focus-visible:before:outline-2 focus-visible:before:outline-offset-2 focus-visible:before:outline-accent',
        numeric ? 'hk-num text-number-m' : 'type-label',
        selected ? 'text-accent before:border-accent before:bg-accent-tint' : 'text-ink before:border-line before:bg-sheet',
        disabled && 'opacity-50',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}
