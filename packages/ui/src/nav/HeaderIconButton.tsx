import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ComponentChildren } from 'preact'
import { cx } from '../lib/cx'

interface Common {
  /** Accessible name (the button shows only an icon). */
  label: string
  class?: string
  children: ComponentChildren
}

export type HeaderIconButtonProps = Common &
  (
    | ({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'class' | 'children' | 'href'>)
    | ({ href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'class' | 'children'>)
  )

const base = 'pressable grid size-touch shrink-0 place-items-center rounded-full text-ink'

/**
 * 44x44 icon-only action in the top bar and desktop header (Figma "icon button
 * search/globe/moon": 44 on mobile, 40 on desktop, raised to 44 for touch).
 * Renders a link when `href` is given, otherwise a button.
 */
export function HeaderIconButton(props: HeaderIconButtonProps) {
  const { label, class: className, children } = props
  if (props.href !== undefined) {
    const { label: _l, class: _c, children: _ch, ...rest } = props
    return (
      <a {...rest} aria-label={label} title={label} class={cx(base, className)}>
        {children}
      </a>
    )
  }
  const { label: _l, class: _c, children: _ch, href: _h, ...rest } = props
  return (
    <button type="button" {...rest} aria-label={label} title={label} class={cx(base, className)}>
      {children}
    </button>
  )
}
