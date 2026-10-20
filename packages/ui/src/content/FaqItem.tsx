import type { ComponentChildren } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { ChevronDown } from '../icons/common'
import { cx } from '../lib/cx'
import { useContentUid } from './uid'

export interface FaqItemProps {
  /** The question, e.g. "বিকাশে ১০০০ টাকা ক্যাশ আউটে কত চার্জ?". */
  question: ComponentChildren
  /** The answer; text or rich content. */
  answer: ComponentChildren
  /** Controlled state (Figma Open=true|false). */
  open?: boolean
  /** Open on first render (uncontrolled). */
  defaultOpen?: boolean
  onToggle?: (open: boolean) => void
  /** The question button sits in a heading of this level (default h3). */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  /** Adds schema.org Question/Answer microdata (FaqList sets it when asked to). */
  microdata?: boolean
  /** Base id for the button and answer (generated when omitted). */
  id?: string
  /** Drops the bottom rule. */
  last?: boolean
  class?: string
}

/**
 * FAQ Item (Figma 9:284): a disclosure. The question is a full-width button inside a
 * heading (aria-expanded, aria-controls), so Enter and Space toggle it and the heading
 * outline lists the questions. A closed answer stays in the HTML as
 * hidden="until-found": out of the tab order and the accessibility tree, still read by
 * search engines, and find-in-page opens it (beforematch). Opening by hand fades the
 * answer in and lets it settle 4px (opacity + translate only, content.css); the chevron
 * turns. Reduced motion keeps only the fade.
 */
export function FaqItem({
  question,
  answer,
  open,
  defaultOpen = false,
  onToggle,
  headingLevel = 3,
  microdata = false,
  id,
  last = false,
  class: className,
}: FaqItemProps) {
  const base = useContentUid(id, 'hkc-faq')
  const [inner, setInner] = useState(defaultOpen)
  // Only answers opened by the user animate; one that is open on page load just shows.
  const [toggled, setToggled] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const isOpen = open ?? inner
  const Heading = `h${headingLevel}` as 'h3'

  const setOpen = (next: boolean) => {
    if (open === undefined) setInner(next)
    onToggle?.(next)
  }
  const toggle = () => {
    setToggled(true)
    setOpen(!isOpen)
  }

  // Find-in-page (or a #fragment) matched text inside the closed answer: the browser
  // reveals it, and the item follows so the button and chevron agree.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel || isOpen) return
    const onMatch = () => setOpen(true)
    panel.addEventListener('beforematch', onMatch)
    return () => panel.removeEventListener('beforematch', onMatch)
  }, [isOpen, open, onToggle])

  return (
    <div
      class={cx('min-w-0 pb-1.5', !last && 'border-b border-line', className)}
      data-faq-item
      {...(microdata ? { itemscope: true, itemprop: 'mainEntity', itemtype: 'https://schema.org/Question' } : {})}
    >
      <Heading class="m-0">
        <button
          type="button"
          id={`${base}-q`}
          aria-expanded={isOpen}
          aria-controls={`${base}-a`}
          onClick={toggle}
          class="pressable flex min-h-touch w-full items-center gap-3 rounded-input pt-3.5 pb-2 text-start text-ink [--hover-tint-opacity:0.04]"
        >
          <span
            class="min-w-0 flex-1 font-body text-[0.9375rem]/5.5 font-semibold"
            {...(microdata ? { itemprop: 'name' } : {})}
          >
            {question}
          </span>
          <ChevronDown size={20} class="hkc-faq-chevron text-soft" />
        </button>
      </Heading>
      <div
        ref={panelRef}
        id={`${base}-a`}
        class="hkc-faq-panel"
        hidden={isOpen ? undefined : 'until-found'}
        data-open={isOpen ? '' : undefined}
        data-toggled={toggled ? '' : undefined}
      >
        <div
          class="hkc-faq-answer pb-2 type-body-small text-soft"
          {...(microdata ? { itemscope: true, itemprop: 'acceptedAnswer', itemtype: 'https://schema.org/Answer' } : {})}
        >
          <div {...(microdata ? { itemprop: 'text' } : {})}>{answer}</div>
        </div>
      </div>
    </div>
  )
}
