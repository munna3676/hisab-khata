import type { ComponentChildren } from 'preact'
import { useState } from 'preact/hooks'
import { cx } from '../lib/cx'
import { FaqItem, type FaqItemProps } from './FaqItem'
import { faqJsonLd, jsonLdScript, type FaqEntry } from './jsonld'

export interface FaqListEntry extends FaqEntry {
  /** Rich answer to show instead of the plain `answer` (links, lists). JSON-LD keeps `answer`. */
  content?: ComponentChildren
}

export interface FaqListProps {
  items: readonly FaqListEntry[]
  /** Indexes open on first render. */
  defaultOpen?: readonly number[]
  /** Only one answer open at a time (opening one closes the other). */
  single?: boolean
  headingLevel?: FaqItemProps['headingLevel']
  /** schema.org FAQPage/Question/Answer microdata on the markup. */
  microdata?: boolean
  /**
   * Also emits <script type="application/ld+json"> with the same questions and answers
   * (faqJsonLd). Use either this or microdata on a page, not both.
   */
  jsonLd?: boolean
  class?: string
}

/** The FAQ block of a tool or guide page ("সাধারণ প্রশ্ন"): FAQ Items in a list. */
export function FaqList({
  items,
  defaultOpen = [],
  single = false,
  headingLevel,
  microdata = false,
  jsonLd = false,
  class: className,
}: FaqListProps) {
  const [open, setOpen] = useState<number[]>(() => (single ? defaultOpen.slice(0, 1) : [...defaultOpen]))

  const toggle = (i: number, next: boolean) =>
    setOpen((cur) => (next ? (single ? [i] : [...cur.filter((v) => v !== i), i]) : cur.filter((v) => v !== i)))

  return (
    <div
      class={cx('min-w-0', className)}
      data-faq-list
      {...(microdata ? { itemscope: true, itemtype: 'https://schema.org/FAQPage' } : {})}
    >
      {items.map((item, i) => (
        <FaqItem
          key={i}
          question={item.question}
          answer={item.content ?? item.answer}
          open={open.includes(i)}
          onToggle={(next) => toggle(i, next)}
          headingLevel={headingLevel}
          microdata={microdata}
        />
      ))}
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd(items)) }} />}
    </div>
  )
}
