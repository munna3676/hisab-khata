import type { ComponentChildren, HTMLAttributes, JSX } from 'preact'
import { useLayoutEffect, useRef, useState } from 'preact/hooks'
import { cx } from '../lib/cx'
import { motionMode } from '../lib/motion'
import { useContentUid } from './uid'

export interface TabItem<V extends string = string> {
  value: V
  label: ComponentChildren
  /** Link mode: every item with an href makes the bar page navigation (Figma: "each tab navigates to its own screen"). */
  href?: string
  disabled?: boolean
}

export interface TabBarProps<V extends string = string> {
  /** One to five tabs (Figma Tab Bar has five). */
  items: readonly TabItem<V>[]
  /** Controlled value. */
  value?: V
  /** First value when uncontrolled (default: the first tab). */
  defaultValue?: V
  onChange?: (value: V) => void
  /** Accessible name of the tab list or nav, e.g. "চার্জের ধরন". */
  label: string
  /**
   * Base id. Tabs get `${id}-tab-${value}`; with `panels`, each tab controls the
   * <TabPanel tabsId={id} value=…> of the same value.
   */
  id?: string
  /** TabPanels with matching ids exist on the page (sets aria-controls). */
  panels?: boolean
  /** 'auto' (default) selects a tab as arrow keys focus it; 'manual' waits for Enter or Space. */
  activation?: 'auto' | 'manual'
  class?: string
}

const safe = (value: string) => value.replace(/[^\w-]/g, '_')
export const tabId = (tabsId: string, value: string) => `${tabsId}-tab-${safe(value)}`
export const tabPanelId = (tabsId: string, value: string) => `${tabsId}-panel-${safe(value)}`

/**
 * Tab Bar (Figma 46:849, Active 1-5). Without hrefs it is an ARIA tab list with a roving
 * tabindex: Left/Right move between tabs (wrapping), Home/End jump, and only the
 * selected tab is in the Tab order. With hrefs on every item it is a <nav> of links with
 * aria-current="page". The 2.5px accent indicator slides from the old tab to the new one
 * over 220 ms (FLIP on transform only); it is instant under reduced motion. The row
 * scrolls sideways when the tabs do not fit, keeping the selected tab in view.
 */
export function TabBar<V extends string = string>({
  items,
  value,
  defaultValue,
  onChange,
  label,
  id,
  panels = false,
  activation = 'auto',
  class: className,
}: TabBarProps<V>) {
  const base = useContentUid(id, 'hkc-tabs')
  const [inner, setInner] = useState<V | undefined>(defaultValue ?? items[0]?.value)
  const current = value !== undefined ? value : inner
  const links = items.length > 0 && items.every((item) => typeof item.href === 'string')
  const listRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<(HTMLElement | null)[]>([])
  const barRefs = useRef<(HTMLSpanElement | null)[]>([])
  const shownRef = useRef<V | undefined>(current)

  const select = (next: V) => {
    if (next === current) return
    if (value === undefined) setInner(next)
    onChange?.(next)
  }

  // FLIP: start the new tab's indicator where the old one was, then let it glide home.
  useLayoutEffect(() => {
    const prev = shownRef.current
    shownRef.current = current
    const list = listRef.current
    const to = items.findIndex((item) => item.value === current)
    const toTab = tabRefs.current[to]
    if (!list || !toTab) return
    keepInView(list, toTab)
    if (prev === undefined || prev === current) return
    const from = items.findIndex((item) => item.value === prev)
    const fromTab = tabRefs.current[from]
    const bar = barRefs.current[to]
    if (!fromTab || !bar) return
    const a = fromTab.getBoundingClientRect()
    const b = toTab.getBoundingClientRect()
    if (!b.width) return
    bar.style.transition = 'none'
    bar.style.transform = `translateX(${a.left - b.left}px) scaleX(${a.width / b.width})`
    void bar.getBoundingClientRect()
    bar.style.transition = 'transform var(--duration-tab) var(--ease-out)'
    bar.style.transform = ''
  }, [current])

  const enabled = items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0)
  // The one tab in the Tab order: the selected one, or the first enabled tab when the
  // value matches no tab (or the selected tab is disabled), so the list is never skipped.
  const selectedIndex = items.findIndex((item) => item.value === current && !item.disabled)
  const tabStop = selectedIndex >= 0 ? selectedIndex : (enabled[0] ?? -1)

  const onKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLElement>) => {
    if (links || event.altKey || event.ctrlKey || event.metaKey) return
    const at = tabRefs.current.findIndex((el) => el === document.activeElement)
    if (at < 0 || enabled.length === 0) return
    const pos = enabled.indexOf(at)
    let next: number | undefined
    if (event.key === 'ArrowRight') next = enabled[(pos + 1) % enabled.length]
    else if (event.key === 'ArrowLeft') next = enabled[(pos - 1 + enabled.length) % enabled.length]
    else if (event.key === 'Home') next = enabled[0]
    else if (event.key === 'End') next = enabled[enabled.length - 1]
    if (next === undefined) return
    event.preventDefault()
    tabRefs.current[next]?.focus()
    const item = items[next]
    if (activation === 'auto' && item) select(item.value)
  }

  const tabs = items.map((item, i) => {
    const selected = item.value === current
    const common = {
      ref: (el: HTMLElement | null) => {
        tabRefs.current[i] = el
      },
      class: cx(
        // Figma: 12px above the 14/20 label, 10px + the 2.5px indicator below; with the 1px rule the bar is 46px.
        'pressable relative flex min-h-touch min-w-touch shrink-0 items-center justify-center px-2.5 pt-3 pb-3.25 type-label whitespace-nowrap focus-visible:-outline-offset-2 [--hover-tint-opacity:0.04]',
        selected ? 'text-accent' : 'text-soft hover:text-ink',
        item.disabled && 'opacity-50',
      ),
      'data-selected': selected ? '' : undefined,
    }
    const content = (
      <>
        {item.label}
        <span
          aria-hidden="true"
          ref={(el) => {
            barRefs.current[i] = el
          }}
          class={cx('absolute inset-x-0 bottom-0 h-[2.5px] origin-left bg-accent', selected ? 'opacity-100' : 'opacity-0')}
        />
      </>
    )
    if (links) {
      return (
        <a
          key={item.value}
          {...common}
          href={item.disabled ? undefined : item.href}
          aria-current={selected ? 'page' : undefined}
          aria-disabled={item.disabled ? true : undefined}
          role={item.disabled ? 'link' : undefined}
          onClick={(event: JSX.TargetedMouseEvent<HTMLAnchorElement>) => {
            if (item.disabled) {
              event.preventDefault()
              return
            }
            select(item.value)
          }}
        >
          {content}
        </a>
      )
    }
    return (
      <button
        key={item.value}
        {...common}
        type="button"
        role="tab"
        id={tabId(base, item.value)}
        aria-selected={selected}
        aria-controls={panels ? tabPanelId(base, item.value) : undefined}
        tabIndex={i === tabStop ? 0 : -1}
        disabled={item.disabled}
        onClick={() => select(item.value)}
      >
        {content}
      </button>
    )
  })

  const row = 'hkc-tabs relative flex gap-1 overflow-x-auto px-4'
  return (
    <div class={cx('min-w-0 border-b border-line bg-sheet', className)} data-tab-bar>
      {links ? (
        <nav aria-label={label}>
          <div ref={listRef} class={row}>
            {tabs}
          </div>
        </nav>
      ) : (
        <div ref={listRef} role="tablist" aria-label={label} class={row} onKeyDown={onKeyDown}>
          {tabs}
        </div>
      )}
    </div>
  )
}

/** Scrolls the tab row (not the page) so the tab is fully visible, with a little air. */
function keepInView(list: HTMLElement, tab: HTMLElement) {
  if (list.scrollWidth <= list.clientWidth) return
  const air = 16
  const left = tab.offsetLeft - air
  const right = tab.offsetLeft + tab.offsetWidth + air
  let target: number | undefined
  if (left < list.scrollLeft) target = left
  else if (right > list.scrollLeft + list.clientWidth) target = right - list.clientWidth
  if (target === undefined) return
  const smooth = motionMode() === 'full'
  if (typeof list.scrollTo === 'function') list.scrollTo({ left: Math.max(0, target), behavior: smooth ? 'smooth' : 'auto' })
  else list.scrollLeft = Math.max(0, target)
}

export interface TabPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'className' | 'id'> {
  /** The TabBar's id. */
  tabsId: string
  /** The tab value this panel belongs to. */
  value: string
  /** Shown when its tab is selected. */
  selected: boolean
  class?: string
  children?: ComponentChildren
}

/** The panel of one tab: role="tabpanel", labelled by its tab, focusable, hidden when not selected. */
export function TabPanel({ tabsId, value, selected, class: className, children, ...rest }: TabPanelProps) {
  return (
    <div
      {...rest}
      role="tabpanel"
      id={tabPanelId(tabsId, value)}
      aria-labelledby={tabId(tabsId, value)}
      tabIndex={0}
      hidden={!selected}
      class={className}
    >
      {children}
    </div>
  )
}
