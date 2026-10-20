import type { ComponentType, HTMLAttributes } from 'preact'
import { Bookmark, Grid, Home, ICON_SET } from '../icons/base'
import type { IconProps } from '../icons/Icon'
import { cx } from '../lib/cx'

export type BottomNavId = 'home' | 'search' | 'tools' | 'saved' | (string & {})

export interface BottomNavItem {
  id: BottomNavId
  href: string
  label: string
  icon: ComponentType<IconProps>
}

export interface BottomNavProps extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'style' | 'onSelect'> {
  /** The four tabs; defaults to হোম, খোঁজো, সব টুল, সেভ. */
  items?: BottomNavItem[]
  /** Id of the current tab. No match = no tab marked (e.g. on a tool page). */
  active?: BottomNavId
  /**
   * Called on tap, before the link navigates. In the app shell call
   * event.preventDefault(), route in place and pass the new `active`.
   */
  onSelect?: (id: BottomNavId, event: MouseEvent) => void
  /** Accessible name of the <nav>. */
  label?: string
  /**
   * fixed (default): pinned to the bottom of the viewport and hidden from lg,
   * where DesktopHeader takes over. static: in the flow (gallery, previews).
   */
  placement?: 'fixed' | 'static'
  /** view-transition-name so the bar stays still across pages; only on the one fixed bar. */
  transitionName?: string
  class?: string
}

export const DEFAULT_BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { id: 'home', href: '/', label: 'হোম', icon: Home },
  { id: 'search', href: '/search/', label: 'খোঁজো', icon: ICON_SET.search },
  { id: 'tools', href: '/tools/', label: 'সব টুল', icon: Grid },
  { id: 'saved', href: '/saved/', label: 'সেভ', icon: Bookmark },
]

/**
 * Bottom navigation (Figma "Bottom Nav" 7:193): four equal tabs, 24px icon over a
 * 12/16 SemiBold label; the active tab is accent, the others soft (colour only,
 * as in the Figma variants: no indicator bar). 72px like Figma: the 1px top rule,
 * a 63px tab row and max(8px, safe-area-inset-bottom) below it. (The 56px
 * size/bottom-nav token comes from the stack doc, not Figma, so it is not used.)
 * Tabs press to .97 with a tint; the focus ring sits inside the tab, because the
 * bar spans the full screen width and an outside ring would be cut off at the edges.
 */
export function BottomNav({
  items = DEFAULT_BOTTOM_NAV_ITEMS,
  active,
  onSelect,
  label = 'প্রধান মেনু',
  placement = 'fixed',
  transitionName,
  class: className,
  ...rest
}: BottomNavProps) {
  return (
    <nav
      aria-label={label}
      class={cx(
        'border-t border-line bg-sheet pr-[env(safe-area-inset-right)] pb-[max(var(--space-2),env(safe-area-inset-bottom))] pl-[env(safe-area-inset-left)]',
        placement === 'fixed' && 'fixed inset-x-0 bottom-0 z-30 lg:hidden',
        className,
      )}
      style={transitionName ? { viewTransitionName: transitionName } : undefined}
      data-bottom-nav
      {...rest}
    >
      <ul class="flex h-15.75">
        {items.map((item) => {
          const isActive = item.id === active
          const Glyph = item.icon
          return (
            <li key={item.id} class="flex min-w-0 flex-1">
              <a
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={onSelect ? (event) => onSelect(item.id, event) : undefined}
                class="pressable flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-card text-soft focus-visible:-outline-offset-2 aria-[current=page]:text-accent"
                data-bottom-nav-item={item.id}
              >
                <Glyph class="nudge" />
                {/* -mx-1 px-1: truncate clips at the padding box, so Bangla glyphs that overhang their advance (ে, ো) keep their ink. */}
                <span class="-mx-1 max-w-full truncate px-1 font-body text-[0.75rem] leading-4 font-semibold">{item.label}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
