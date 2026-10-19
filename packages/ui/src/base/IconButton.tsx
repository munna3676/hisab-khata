import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ComponentChildren, JSX } from 'preact'
import { cx } from '../lib/cx'
import type { ButtonVariant } from './Button'
import { Spinner } from './Spinner'

interface IconButtonOwnProps {
  /** Accessible name (the icon itself is decorative). Required: an icon alone has no text. */
  label: string
  /** The 24px icon, e.g. <Share />. */
  children: ComponentChildren
  /** Same colours as Button. Default ghost (icon on the page or a bar). */
  variant?: ButtonVariant
  /** square = 8px corners like Button; round = circle. */
  shape?: 'square' | 'round'
  /** Toggle buttons (save, bookmark): sets aria-pressed and the selected tint. */
  pressed?: boolean
  loading?: boolean
  disabled?: boolean
  class?: string
}

type NativeButton = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof IconButtonOwnProps | 'className'>
type NativeAnchor = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof IconButtonOwnProps | 'className'>

export type IconButtonProps =
  | (IconButtonOwnProps & NativeButton & { href?: undefined })
  | (IconButtonOwnProps & NativeAnchor & { href: string })

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent',
  secondary: 'border-[1.5px] border-line bg-sheet text-ink',
  ghost: 'text-ink',
}

/** On state of a toggle (aria-pressed): the Chip "Selected" colours. */
const PRESSED: Record<ButtonVariant, string> = {
  primary: VARIANT.primary,
  secondary: 'border-[1.5px] border-accent bg-accent-tint text-accent',
  ghost: 'bg-accent-tint text-accent',
}

/** 44x44 icon-only button with the Button colours, press scale and tint. */
export function IconButton(props: IconButtonProps) {
  const {
    label,
    children,
    variant = 'ghost',
    shape = 'square',
    pressed,
    loading = false,
    disabled = false,
    class: className,
    ...rest
  } = props
  const classes = cx(
    'pressable inline-grid size-touch shrink-0 place-items-center',
    shape === 'round' ? 'rounded-full' : 'rounded-input',
    pressed && variant !== 'primary' ? PRESSED[variant] : VARIANT[variant],
    disabled && 'opacity-50',
    className,
  )
  const icon = loading ? <Spinner /> : children

  if (typeof rest.href === 'string') {
    const { onClick, ...anchor } = rest as NativeAnchor & { href: string }
    const inert = disabled || loading
    return (
      <a
        {...anchor}
        href={disabled ? undefined : anchor.href}
        role={disabled ? 'link' : undefined}
        aria-label={label}
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
        {icon}
      </a>
    )
  }

  const { onClick, type = 'button', ...button } = rest as NativeButton
  return (
    <button
      {...button}
      type={type}
      aria-label={label}
      aria-pressed={pressed}
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
      {icon}
    </button>
  )
}
