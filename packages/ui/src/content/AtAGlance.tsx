import type { ComponentChildren, HTMLAttributes } from 'preact'
import { cx } from '../lib/cx'
import { useContentUid } from './uid'

export interface AtAGlanceFact {
  /** e.g. "ফি", "সময় লাগে", "ধরন", "অফিসিয়াল সাইট". */
  label: ComponentChildren
  /** The fact. Fill fee and time from the official source before publishing. */
  value: ComponentChildren
  /** Makes the value a link (e.g. the official site). */
  href?: string
}

export interface AtAGlanceProps extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'className' | 'title'> {
  /** Box title, default "এক নজরে". */
  title?: ComponentChildren
  facts: readonly AtAGlanceFact[]
  /** Heading level of the title (default h2: it opens a guide section). */
  titleAs?: 'h2' | 'h3' | 'h4' | 'p'
  class?: string
}

/**
 * At a Glance (Figma 9:286): the guide summary box. A paper-coloured panel with an
 * accent title and facts in 140px cells, two to a row; four once the box is wide
 * enough (container query, so it follows its own width, not the screen's). On a 360px
 * phone the cells narrow instead of dropping to one column; long values wrap.
 */
export function AtAGlance({ title = 'এক নজরে', facts, titleAs: Title = 'h2', class: className, ...rest }: AtAGlanceProps) {
  const titleId = useContentUid(undefined, 'hkc-glance')
  return (
    <section
      {...rest}
      aria-labelledby={titleId}
      class={cx('@container flex min-w-0 flex-col gap-3 rounded-[12px] border border-line bg-paper p-4', className)}
      data-at-a-glance
    >
      <Title id={titleId} class="type-label text-accent">
        {title}
      </Title>
      {/* Figma: 140px cells, 40px tall, 12px apart, flowing two then four to a row. */}
      <dl class="grid grid-cols-[repeat(2,minmax(0,8.75rem))] gap-3 @xl:grid-cols-[repeat(4,minmax(0,8.75rem))]">
        {facts.map((fact, i) => (
          <div key={i} class="flex min-h-10 min-w-0 flex-col gap-0.5">
            <dt class="font-body text-[0.75rem]/4 text-soft">{fact.label}</dt>
            <dd class="type-label break-words text-ink">
              {fact.href ? (
                <a href={fact.href} class="hkc-link -my-3 inline-flex min-h-touch max-w-full items-center text-blue">
                  <span class="link-underline min-w-0 truncate">{fact.value}</span>
                </a>
              ) : (
                fact.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
