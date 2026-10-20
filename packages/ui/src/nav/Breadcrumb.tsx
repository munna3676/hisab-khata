import type { HTMLAttributes } from 'preact'
import { cx } from '../lib/cx'

export interface BreadcrumbItem {
  label: string
  /** Omit on the last item (the current page). */
  href?: string
}

export interface BreadcrumbProps extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
  items: BreadcrumbItem[]
  /** Accessible name of the <nav>. */
  label?: string
  /** Separator glyph (decorative). */
  separator?: string
  class?: string
}

/**
 * Breadcrumb trail above a page title (Figma calculator screen 13:432:
 * "হোম › মোবাইল ব্যাংকিং › ক্যাশ আউট চার্জ", Body/Small in soft).
 * Earlier steps are links (underline on hover/focus); the last item is the
 * current page (aria-current, not a link). Long trails wrap.
 */
export function Breadcrumb({ items, label = 'আপনি এখানে আছেন', separator = '›', class: className, ...rest }: BreadcrumbProps) {
  const last = items.length - 1
  return (
    <nav aria-label={label} class={cx('type-body-small text-soft', className)} data-breadcrumb {...rest}>
      <ol class="flex flex-wrap items-baseline">
        {items.map((item, i) => (
          <li key={`${i}-${item.label}`} class="min-w-0">
            {i > 0 && (
              <span aria-hidden="true" class="mx-1">
                {separator}
              </span>
            )}
            {item.href && i !== last ? (
              // Inline link in a list item: ::before is a 44px-tall hit area centred on the text (independent of
              // the font's ascent/descent) and 6px wider on each side, short of the neighbour across the separator.
              <a
                href={item.href}
                class="hk-crumb link-underline hover:text-ink before:absolute before:-inset-x-1.5 before:top-1/2 before:h-touch before:-translate-y-1/2 before:content-['']"
              >
                {item.label}
              </a>
            ) : (
              <span aria-current={i === last ? 'page' : undefined}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
