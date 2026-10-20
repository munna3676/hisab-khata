import type { JSX } from 'preact'
import { ICON_SET } from '../icons/base'
import { cx } from '../lib/cx'
import { useUid } from './uid'

const SearchIcon = ICON_SET.search

export interface SearchBarProps {
  /** Large = home hero bar with the খোঁজো button (56px); Compact = header pill (40px). */
  size?: 'large' | 'compact'
  placeholder?: string
  /** Accessible name of the input (the placeholder is not a label). */
  label?: string
  /** Name of the search landmark, needed only when a page has more than one search form. */
  landmarkLabel?: string
  /** Text of the Large bar's submit button. */
  buttonLabel?: string
  /** Where the form goes without JS (GET ?q=…). */
  action?: string
  name?: string
  value?: string
  defaultValue?: string
  onInput?: (query: string) => void
  /** Called on submit instead of navigating to `action`. */
  onSearch?: (query: string) => void
  onFocus?: (event: JSX.TargetedFocusEvent<HTMLInputElement>) => void
  id?: string
  class?: string
}

/**
 * Search Bar (Figma 5:97). A <form role="search"> that works without JS. The Large bar's
 * visible button is 72x40 as in Figma inside a 44px-tall hit area; the Compact input keeps
 * a 44px hit area inside the 40px pill. Focus in the input fades in a 2px blue ring around
 * the bar (opacity only); the button's keyboard ring is the 2px accent one around its block.
 */
export function SearchBar({
  size = 'large',
  placeholder = 'খোঁজো...',
  label = 'খোঁজো',
  landmarkLabel,
  buttonLabel = 'খোঁজো',
  action = '/search',
  name = 'q',
  value,
  defaultValue,
  onInput,
  onSearch,
  onFocus,
  id,
  class: className,
}: SearchBarProps) {
  const inputId = useUid(id, 'search')
  const large = size === 'large'

  const submit = (event: JSX.TargetedSubmitEvent<HTMLFormElement>) => {
    if (!onSearch) return
    event.preventDefault()
    const field = event.currentTarget.elements.namedItem(name)
    onSearch(field instanceof HTMLInputElement ? field.value.trim() : '')
  }

  return (
    <form
      role="search"
      aria-label={landmarkLabel}
      action={action}
      method="get"
      onSubmit={submit}
      class={cx(
        'relative isolate flex min-w-0 items-center gap-2.5 pl-4',
        large
          ? // Figma: 56px, sheet, 1.5px line border, 12px corners, 0 4 16 shadow at 6%.
            "h-14 rounded-[12px] border-[1.5px] border-line bg-sheet pr-2 before:pointer-events-none before:absolute before:-inset-[1.5px] before:-z-10 before:rounded-[inherit] before:opacity-50 before:shadow-[0_4px_16px_var(--overlay-shadow)] before:content-['']"
          : 'h-10 rounded-full bg-subtle pr-3',
        large ? 'after:-inset-[1.5px]' : 'after:inset-0',
        // The 2px blue ring shows while the input has focus (not the button, which has its own ring).
        "after:pointer-events-none after:absolute after:rounded-[inherit] after:border-2 after:border-blue after:opacity-0 after:transition-opacity after:duration-hover after:ease-out after:content-[''] has-[input:focus]:after:opacity-100",
        className,
      )}
    >
      <label for={inputId} class="sr-only">
        {label}
      </label>
      <SearchIcon class="text-soft" />
      <input
        id={inputId}
        type="search"
        name={name}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        onInput={(event: JSX.TargetedEvent<HTMLInputElement>) => onInput?.(event.currentTarget.value)}
        onFocus={onFocus}
        class={cx(
          'hk-search-input h-11 min-w-0 flex-1 truncate bg-transparent text-ink outline-hidden placeholder:text-soft',
          large ? 'type-body' : 'type-body-small',
        )}
      />
      {large && (
        <button
          type="submit"
          class={cx(
            'pressable h-11 w-18 shrink-0 rounded-input type-label text-on-accent',
            // The 72x40 accent block, 2px in from the 44px hit area (tint and focus ring follow it).
            "before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-0.5 before:-z-10 before:rounded-[inherit] before:bg-accent before:content-[''] after:inset-y-0.5",
            'focus-visible:outline-hidden focus-visible:before:outline-2 focus-visible:before:outline-offset-2 focus-visible:before:outline-accent',
          )}
        >
          {buttonLabel}
        </button>
      )}
    </form>
  )
}
