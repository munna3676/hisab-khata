import type { ComponentChildren, HTMLAttributes } from 'preact'
import { cx } from '../lib/cx'

export interface AnswerCardProps extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
  /** Small accent label, default "সরাসরি উত্তর". */
  eyebrow?: string
  /** The query restated, e.g. "বিকাশে ৫,০০০ টাকা ক্যাশ আউট". */
  question: string
  /** The answer, already formatted (e.g. "৳৬৯.৭৫"). */
  answer: ComponentChildren
  /** Context next to the answer, e.g. "প্রিয় এজেন্ট · অন্য এজেন্টে ৳৯২.৫০". */
  detail?: ComponentChildren
  /** Link to the full tool or comparison. */
  href?: string
  linkLabel?: string
  questionAs?: 'h2' | 'h3' | 'h4' | 'p'
  class?: string
}

/**
 * Direct answer at the top of search results (Figma "Answer Card" 7:302):
 * accent-tint card with an accent border, eyebrow, H3 question, the answer in
 * the number face (26/28 Bold) with a soft detail on the same baseline, and a
 * blue "full comparison" link.
 */
export function AnswerCard({
  eyebrow = 'সরাসরি উত্তর',
  question,
  answer,
  detail,
  href,
  linkLabel = 'পুরো তুলনা দেখো →',
  questionAs: Question = 'h3',
  class: className,
  ...rest
}: AnswerCardProps) {
  return (
    <section
      class={cx('flex flex-col items-start gap-2 rounded-card border border-accent bg-accent-tint p-4.5', className)}
      data-answer-card
      {...rest}
    >
      <p class="font-body text-[0.75rem] leading-5 font-semibold text-accent">{eyebrow}</p>
      <Question class="type-h3 text-ink">{question}</Question>
      <p class="flex flex-wrap items-baseline gap-x-2">
        <span class="font-number text-[1.625rem] leading-7 font-bold tracking-[-0.01em] whitespace-nowrap text-ink">{answer}</span>
        {detail && <span class="type-body-small text-soft">{detail}</span>}
      </p>
      {href && (
        // 44px hit area; the negative margin keeps the 20px line of the design.
        <a href={href} class="hk-underline-host pressable -my-3 inline-flex min-h-touch items-center rounded-input type-label text-blue [--hover-tint-opacity:0]">
          <span class="link-underline">{linkLabel}</span>
        </a>
      )}
    </section>
  )
}
