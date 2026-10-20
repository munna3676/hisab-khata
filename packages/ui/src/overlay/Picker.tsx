import type { ComponentChildren, JSX } from 'preact'
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { SearchBar } from '../base/SearchBar'
import { useUid } from '../base/uid'
import { Check } from '../icons/common'
import { cx } from '../lib/cx'
import { BottomSheet, type SheetCloseReason, type SheetVariant } from './BottomSheet'
import { type FilterableOption, usePickerFilter } from './filter'

export interface PickerOption extends FilterableOption {
  value: string
  /** Id of a PickerGroup; options without one are listed first, ungrouped. */
  group?: string
  disabled?: boolean
}

export interface PickerGroup {
  id: string
  label: ComponentChildren
}

export interface PickerProps {
  options: readonly PickerOption[]
  /** Selected value (the option with the tick). */
  value?: string | null
  onChange?: (value: string, option: PickerOption) => void
  /** Accessible name of the list, e.g. "দেশ". */
  label: string
  searchLabel?: string
  /** Figma: "দেশের নাম লেখো". */
  searchPlaceholder?: string
  /** Body/Small line under the search box, e.g. "৬৪ জেলা · বিভাগীয় শহর আগে". */
  caption?: ComponentChildren
  /** Group headings in display order. */
  groups?: readonly PickerGroup[]
  /** Shown when nothing matches. */
  emptyText?: (query: string) => ComponentChildren
  defaultQuery?: string
  id?: string
  class?: string
}

interface Section {
  group?: PickerGroup
  items: PickerOption[]
}

/**
 * Picker (Figma P1 দেশ 59:16200, P2 জেলা 59:16364): a compact Search Bar, an optional
 * caption, and the options as 74px cards (Body/Medium name, Body/Small detail). The
 * selected card is accent-tint with a 1.5px accent border and a tick. Typing filters in
 * Bangla, Banglish or English (usePickerFilter). Keyboard: the search box is a combobox;
 * ↑/↓ move through the matches (wrapping), Home/End with Ctrl jump to the ends, Enter picks.
 */
export function Picker({
  options,
  value,
  onChange,
  label,
  searchLabel = 'খোঁজো',
  searchPlaceholder = 'খোঁজো...',
  caption,
  groups,
  emptyText = (q) => `"${q}" নামে কিছু পাইনি। অন্য বানানে খুঁজে দেখো।`,
  defaultQuery = '',
  id,
  class: className,
}: PickerProps) {
  const pickerId = useUid(id, 'picker')
  const listId = `${pickerId}-list`
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState(defaultQuery)
  const matches = usePickerFilter(options, query)

  const sections = useMemo<Section[]>(() => {
    const loose = matches.filter((o) => !o.group || !groups?.some((g) => g.id === o.group))
    const out: Section[] = loose.length ? [{ items: loose }] : []
    for (const group of groups ?? []) {
      const items = matches.filter((o) => o.group === group.id)
      if (items.length) out.push({ group, items })
    }
    return out
  }, [matches, groups])
  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections])

  const selectedIndex = flat.findIndex((o) => o.value === value)
  const [active, setActive] = useState(selectedIndex)
  const [keyboard, setKeyboard] = useState(false)
  const optionId = (index: number) => `${pickerId}-opt-${index}`

  // New results: highlight the selected option if it is still listed, else the best match.
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    setActive(flat.length ? 0 : -1)
  }, [query])

  // The Search Bar's input becomes the combobox that owns the list.
  useEffect(() => {
    const input = rootRef.current?.querySelector('input')
    if (!input) return
    input.setAttribute('role', 'combobox')
    input.setAttribute('aria-controls', listId)
    input.setAttribute('aria-expanded', 'true')
    input.setAttribute('aria-autocomplete', 'list')
    if (active >= 0 && active < flat.length) input.setAttribute('aria-activedescendant', optionId(active))
    else input.removeAttribute('aria-activedescendant')
  })

  useEffect(() => {
    if (!keyboard || active < 0) return
    document.getElementById(optionId(active))?.scrollIntoView?.({ block: 'nearest' })
  }, [active, keyboard])

  const choose = (option: PickerOption | undefined) => {
    if (!option || option.disabled) return
    onChange?.(option.value, option)
  }

  const onKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLDivElement>) => {
    if (!(event.target instanceof HTMLInputElement)) return
    const n = flat.length
    let next = active
    if (event.key === 'ArrowDown') next = n ? (active + 1 + n) % n : -1
    else if (event.key === 'ArrowUp') next = n ? (active <= 0 ? n - 1 : active - 1) : -1
    else if (event.key === 'Home' && event.ctrlKey) next = n ? 0 : -1
    else if (event.key === 'End' && event.ctrlKey) next = n - 1
    else if (event.key === 'Enter') {
      event.preventDefault()
      choose(flat[active])
      return
    } else return
    event.preventDefault()
    setKeyboard(true)
    setActive(next)
  }

  let index = -1
  const renderOption = (option: PickerOption) => {
    index += 1
    const i = index
    const selected = option.value === value
    return (
      <div
        key={option.value}
        id={optionId(i)}
        role="option"
        aria-selected={selected}
        aria-disabled={option.disabled || undefined}
        data-active={i === active ? '' : undefined}
        onClick={() => choose(option)}
        class={cx(
          'flex min-h-touch min-w-0 items-center gap-3 rounded-card px-4 py-3 text-left [--hover-tint-opacity:0.04]',
          option.disabled ? 'cursor-not-allowed opacity-50' : 'pressable',
          selected ? 'border-[1.5px] border-accent bg-accent-tint' : 'border border-line bg-paper',
          keyboard && i === active && 'outline-2 outline-offset-2 outline-accent',
        )}
      >
        <span class="grid min-w-0 flex-1 gap-0.5">
          <span class="type-body-medium text-ink">{option.label}</span>
          {option.description && <span class="type-body-small text-soft">{option.description}</span>}
        </span>
        {selected && <Check class="text-ink" />}
      </div>
    )
  }

  return (
    <div ref={rootRef} class={cx('grid min-w-0 gap-4', className)} onKeyDown={onKeyDown} data-picker>
      <SearchBar
        size="compact"
        label={searchLabel}
        landmarkLabel={label}
        placeholder={searchPlaceholder}
        value={query}
        onInput={(q) => {
          setQuery(q)
          setKeyboard(false)
        }}
        onSearch={() => choose(flat[active])}
        onFocus={() => setKeyboard(false)}
        class="w-full"
      />
      {caption != null && <p class="type-body-small text-soft">{caption}</p>}
      <div id={listId} role="listbox" aria-label={label} class="grid min-w-0 gap-4">
        {sections.map((section) =>
          section.group ? (
            <div key={section.group.id} role="group" aria-labelledby={`${pickerId}-g-${section.group.id}`} class="grid min-w-0 gap-4">
              <div id={`${pickerId}-g-${section.group.id}`} class="type-label text-soft">
                {section.group.label}
              </div>
              {section.items.map(renderOption)}
            </div>
          ) : (
            section.items.map(renderOption)
          ),
        )}
      </div>
      {flat.length === 0 && (
        <p class="type-body-small text-soft" role="status">
          {emptyText(query)}
        </p>
      )}
    </div>
  )
}

export interface PickerSheetProps extends Omit<PickerProps, 'label'> {
  open: boolean
  onClose: (reason: SheetCloseReason | 'select') => void
  /** Sheet title, also the list's accessible name ("কোন দেশ থেকে পাঠাবে?"). */
  title: string
  /** Shorter list name when the title is a question. */
  label?: string
  variant?: SheetVariant
  /** Close as soon as an option is picked (default true). */
  closeOnSelect?: boolean
  closeLabel?: string
}

/** A Picker in a BottomSheet (a centred dialog from lg): picking closes it and returns focus to the opener. */
export function PickerSheet({ open, onClose, title, label, variant, closeOnSelect = true, closeLabel, onChange, ...picker }: PickerSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} variant={variant} closeLabel={closeLabel}>
      <Picker
        {...picker}
        label={label ?? title}
        onChange={(v, option) => {
          onChange?.(v, option)
          if (closeOnSelect) onClose('select')
        }}
      />
    </BottomSheet>
  )
}
