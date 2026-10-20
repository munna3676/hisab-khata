import type { ComponentChildren } from 'preact'
import { useState } from 'preact/hooks'
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
 * outline lists the questions. The answer opens smoothly (grid-template-rows 0fr → 1fr
 * plus a fade, content.css) and the chevron turns. A closed answer stays in the HTML,
 * hidden with visibility, so search engines and find-in-page see it after it opens.
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
  const isOpen = open ?? inner
  const Heading = `h${headingLevel}` as 'h3'

  const toggle = () => {
    const next = !isOpen
    if (open === undefined) setInner(next)
    onToggle?.(next)
  }

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
      <div id={`${base}-a`} class="hkc-faq-panel" data-open={isOpen ? '' : undefined}>
        <div class="min-h-0 overflow-hidden">
          <div
            class="pb-2 type-body-small text-soft"
            {...(microdata ? { itemscope: true, itemprop: 'acceptedAnswer', itemtype: 'https://schema.org/Answer' } : {})}
          >
            <div {...(microdata ? { itemprop: 'text' } : {})}>{answer}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
