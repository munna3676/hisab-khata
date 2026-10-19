import type { ComponentChildren, JSX } from 'preact'
import { cx } from '../lib/cx'

export interface IconProps extends Omit<JSX.SVGAttributes<SVGSVGElement>, 'size'> {
  /** Rendered width and height in px (default 24, the Figma icon frame). */
  size?: number
  /** Accessible name. Without it the icon is decorative and hidden from screen readers. */
  label?: string
}

/**
 * Shared SVG wrapper: 24x24 viewBox, 1.75 stroke in currentColor, round caps.
 * Icons inherit colour from text (`text-accent`), so they follow light/dark automatically.
 */
export function Icon({ size = 24, label, class: className, children, ...rest }: IconProps & { children?: ComponentChildren }) {
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
      stroke-linejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      class={cx('shrink-0', className as string | undefined)}
      {...rest}
    >
      {label ? <title>{label}</title> : null}
      {children}
    </svg>
  )
}
