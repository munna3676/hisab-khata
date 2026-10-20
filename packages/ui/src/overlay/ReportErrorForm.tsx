import type { JSX } from 'preact'
import { useState } from 'preact/hooks'
import { Button } from '../base/Button'
import { TextField } from '../base/TextField'
import { useUid } from '../base/uid'
import { Check } from '../icons/common'
import { cx } from '../lib/cx'

export interface ReportErrorItem {
  value: string
  /** "নগদ · *167# দিয়ে · ৳১৫.০০" */
  label: string
}

export interface ReportErrorData {
  item: string
  correct: string
  source: string
}

export interface ReportErrorFormProps {
  /** The numbers on the page that can be reported. */
  items: readonly ReportErrorItem[]
  defaultItem?: string
  itemLabel?: string
  correctLabel?: string
  correctPlaceholder?: string
  sourceLabel?: string
  submitLabel?: string
  onSubmit?: (data: ReportErrorData) => void
  /** Shows the spinner on the button while sending. */
  submitting?: boolean
  class?: string
}

const BOX = 'w-full rounded-input border-[1.5px] border-line bg-paper text-ink'

/**
 * Body of Sheet — Report Error (Figma S2 25:4333): which number is wrong (a native select
 * drawn as Figma's 52px box with a tick), the correct value (96px textarea), an optional
 * source link (Text Field with a URL unit box) and the primary "রিপোর্ট পাঠাও".
 */
export function ReportErrorForm({
  items,
  defaultItem,
  itemLabel = 'কোন সংখ্যাটা ভুল?',
  correctLabel = 'সঠিক তথ্য কী?',
  correctPlaceholder = 'অ্যাপে এখন অন্য রেট দেখাচ্ছে...',
  sourceLabel = 'সূত্রের লিংক (ঐচ্ছিক)',
  submitLabel = 'রিপোর্ট পাঠাও',
  onSubmit,
  submitting = false,
  class: className,
}: ReportErrorFormProps) {
  const id = useUid(undefined, 'report')
  const [item, setItem] = useState(defaultItem ?? items[0]?.value ?? '')

  const submit = (event: JSX.TargetedSubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const field = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null)?.value.trim() ?? ''
    const source = field('source')
    onSubmit?.({ item, correct: field('correct'), source: source === 'https://' ? '' : source })
  }

  return (
    <form class={cx('grid min-w-0 gap-4', className)} onSubmit={submit} data-report-form>
      <label for={`${id}-item`} class="type-label text-ink">
        {itemLabel}
      </label>
      <span class="relative block">
        <select
          id={`${id}-item`}
          name="item"
          value={item}
          onChange={(e: JSX.TargetedEvent<HTMLSelectElement>) => setItem(e.currentTarget.value)}
          class={cx(BOX, 'h-13 cursor-pointer appearance-none truncate pr-10 pl-3.5 type-body-medium')}
        >
          {items.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Check size={18} class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-soft" />
      </span>
      <label for={`${id}-correct`} class="type-label text-ink">
        {correctLabel}
      </label>
      <textarea
        id={`${id}-correct`}
        name="correct"
        required
        placeholder={correctPlaceholder}
        class={cx(BOX, 'h-24 resize-none p-3.5 type-body placeholder:text-soft')}
      />
      {/* type="text" (url keyboard): a type="url" field holding the prefilled "https://" fails the
          browser's own validation and would block sending a report that has no source. */}
      <TextField label={sourceLabel} name="source" type="text" inputMode="url" prefix="URL" defaultValue="https://" autoComplete="url" spellcheck={false} />
      <Button type="submit" block loading={submitting}>
        {submitLabel}
      </Button>
    </form>
  )
}
