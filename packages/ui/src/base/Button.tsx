import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ComponentChildren, JSX } from 'preact'
import { cx } from '../lib/cx'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
/**
 * md = 44px, the only Figma Button height (every instance, full-width ones too).
 * lg = 52px is a code-only extension (same height as a Text Field box); prefer md.
 */
export type ButtonSize = 'md' | 'lg'

interface ButtonOwnProps {
  /** Figma Type: Primary = main action, Secondary = quiet action, Ghost = text link action. */
  variant?: ButtonVariant
  size?: ButtonSize
  /** Leading 24px icon (Figma "Show icon" + "Icon"), e.g. <Share />. */
  icon?: ComponentChildren
  /** Trailing icon, e.g. <ChevronRight /> on a "next" action. */
  iconEnd?: ComponentChildren
  /** Shows a spinner in place of the icon, sets aria-busy and ignores presses; focus stays. */
  loading?: boolean
  /** Fills the width of its container. */
  block?: boolean
  disabled?: boolean
  class?: string
  children?: ComponentChildren
}

type NativeButton = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps | 'className'>
type NativeAnchor = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonOwnProps | 'className'>

export type ButtonProps =
  | (ButtonOwnProps & NativeButton & { href?: undefined })
  | (ButtonOwnProps & NativeAnchor & { href: string })

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent',
  secondary: 'border-[1.5px] border-line bg-sheet text-ink',
  ghost: 'text-blue',
}

const SIZE: Record<ButtonSize, string> = {
  md: 'min-h-touch px-4.5',
  lg: 'min-h-13 px-6',
}

export function buttonClass({
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
}: Pick<ButtonOwnProps, 'variant' | 'size' | 'block' | 'disabled'> = {}): string {
  return cx(
    'pressable inline-flex min-w-touch items-center justify-center gap-2 rounded-input text-center type-label whitespace-nowrap no-underline',
    VARIANT[variant],
    SIZE[size],
    block && 'w-full',
    disabled && 'opacity-50',
  )
}

/**
 * Button (Figma 5:31). Renders an <a> when `href` is given, otherwise a <button type="button">.
 * Presses scale to .97 with a tint (motion.css .pressable); hover tint only on pointer devices.
 */
export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    icon,
    iconEnd,
    loading = false,
    block = false,
    disabled = false,
    class: className,
    children,
    ...rest
  } = props
  const classes = cx(buttonClass({ variant, size, block, disabled }), className)
  const content = (
    <>
      {loading ? <Spinner /> : icon}
      {children != null && <span class={cx(block && 'min-w-0 truncate')}>{children}</span>}
      {!loading && iconEnd}
    </>
  )

  if (typeof rest.href === 'string') {
    const { onClick, ...anchor } = rest as NativeAnchor & { href: string }
    const inert = disabled || loading
    return (
      <a
        {...anchor}
        href={disabled ? undefined : anchor.href}
        role={disabled ? 'link' : undefined}
        aria-disabled={inert ? true : undefined}
        aria-busy={loading ? true : undefined}
        class={classes}
        onClick={(event: JSX.TargetedMouseEvent<HTMLAnchorElement>) => {
          if (inert) {
            event.preventDefault()
            return
          }
          onClick?.(event)
        }}
      >
        {content}
      </a>
    )
  }

  const { onClick, type = 'button', ...button } = rest as NativeButton
  return (
    <button
      {...button}
      type={type}
      disabled={disabled}
      aria-disabled={loading ? true : undefined}
      aria-busy={loading ? true : undefined}
      class={classes}
      onClick={(event: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
        if (loading) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
    >
      {content}
    </button>
  )
}
