import type { FormHTMLAttributes } from 'preact'
import { ICON_SET } from '../icons/base'
import { cx } from '../lib/cx'

export interface HeaderSearchProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'class' | 'role'> {
  /** Where the query goes (GET ?q=…). */
  action?: string
  placeholder?: string
  /** Accessible name of the field (the placeholder is not a label). */
  label?: string
  /** Query parameter name. */
  name?: string
  defaultValue?: string
  class?: string
}

/**
 * Compact search pill in the desktop header (Figma Search Bar / Compact 5:90):
 * subtle fill, fully rounded, search icon + Body/Small placeholder. 44px tall
 * (Figma 40) so the field is a full touch target; the focus ring sits on the pill.
 */
export function HeaderSearch({
  action = '/search/',
  placeholder = 'খোঁজো... যেমন: EMI',
  label = 'টুল বা গাইড খুঁজুন',
  name = 'q',
  defaultValue,
  class: className,
  ...rest
}: HeaderSearchProps) {
  return (
    <form
      role="search"
      action={action}
      method="get"
      class={cx(
        'flex h-11 min-w-0 items-center gap-2.5 rounded-full bg-subtle pr-3 pl-4 text-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent',
        className,
      )}
      {...rest}
    >
      <ICON_SET.search class="shrink-0" />
      <input
        type="search"
        name={name}
        value={defaultValue}
        placeholder={placeholder}
        aria-label={label}
        autocomplete="off"
        enterKeyHint="search"
        class="h-full min-w-0 flex-1 truncate bg-transparent type-body-small text-ink placeholder:text-soft focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
    </form>
  )
}
