import type { JSX } from 'preact'
import { cx } from '../lib/cx'

export interface SpinnerProps extends Omit<JSX.SVGAttributes<SVGSVGElement>, 'size'> {
  /** Width and height in px (default 24, the icon size). */
  size?: number
  /** Accessible name. Without it the spinner is decorative (the busy element should carry aria-busy). */
  label?: string
}

/** Loading indicator in currentColor, drawn on the 24px icon grid with the 1.75 icon stroke. */
export function Spinner({ size = 24, label, class: className, ...rest }: SpinnerProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      stroke-width={1.75}
      stroke-linecap="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      class={cx('hk-spin shrink-0', className as string | undefined)}
      {...rest}
    >
      {label ? <title>{label}</title> : null}
      <circle cx="12" cy="12" r="8.5" opacity="0.25" />
      <path d="M12 3.5a8.5 8.5 0 018.5 8.5" />
    </svg>
  )
}
