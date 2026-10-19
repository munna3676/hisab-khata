import type { AnchorHTMLAttributes } from 'preact'
import { cx } from '../lib/cx'

export interface LogoProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
  /** Brand name next to the mark (Figma property "Name"). */
  name?: string
  /** Link target (usually the home page). Without it the logo is plain, non-interactive text. */
  href?: string
}

/**
 * The mark: a red cloth-bound hal-khata ledger (Figma "khata mark" 7:45).
 * 26x32, spine darkened 20% (brightness filter instead of a raw black overlay),
 * two ruled lines in on-accent. Decorative; the name carries the meaning.
 */
export function LogoMark({ class: className }: { class?: string }) {
  return (
    <span
      aria-hidden="true"
      class={cx('relative block h-8 w-6.5 shrink-0 overflow-hidden rounded-l-[3px] rounded-r-[6px] bg-accent', className)}
      data-logo-mark
    >
      <span class="absolute inset-y-0 left-0 w-1.25 bg-accent brightness-80" />
      <span class="absolute top-2.75 left-2.5 h-0.5 w-2.75 bg-on-accent opacity-85" />
      <span class="absolute top-4.25 left-2.5 h-0.5 w-2.75 bg-on-accent opacity-85" />
    </span>
  )
}

/** Logo (Figma 7:44): ledger mark + "হিসাব খাতা" in Anek Bangla SemiBold 21/30. */
export function Logo({ name = 'হিসাব খাতা', href, class: className, ...rest }: LogoProps) {
  const body = (
    <>
      <LogoMark />
      <span class="font-display text-[1.3125rem] leading-7.5 font-semibold whitespace-nowrap text-ink">{name}</span>
    </>
  )
  if (!href) {
    return (
      <span class={cx('inline-flex items-center gap-2.5', className as string | undefined)} data-logo>
        {body}
      </span>
    )
  }
  return (
    <a
      href={href}
      class={cx(
        'pressable inline-flex min-h-touch shrink-0 items-center gap-2.5 rounded-input text-ink',
        className as string | undefined,
      )}
      data-logo
      {...rest}
    >
      {body}
    </a>
  )
}
