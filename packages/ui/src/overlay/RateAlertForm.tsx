import type { JSX } from 'preact'
import { Button } from '../base/Button'
import { TextField } from '../base/TextField'
import { ChecklistItem } from '../content/ChecklistItem'
import { Message } from '../icons/base'
import { cx } from '../lib/cx'

export interface RateAlertTopic {
  value: string
  label: string
  defaultChecked?: boolean
}

export interface RateAlertData {
  topics: string[]
  email: string
}

/** Figma S3: বিকাশ and নগদ ticked by default on the cash-out page. */
export const DEFAULT_RATE_ALERT_TOPICS: readonly RateAlertTopic[] = [
  { value: 'bkash', label: 'বিকাশ', defaultChecked: true },
  { value: 'nagad', label: 'নগদ', defaultChecked: true },
  { value: 'rocket', label: 'রকেট' },
  { value: 'bank-fdr', label: 'ব্যাংক FDR রেট' },
]

export interface RateAlertFormProps {
  topics?: readonly RateAlertTopic[]
  /** Name of the checkbox group. */
  topicsLabel?: string
  emailLabel?: string
  emailPlaceholder?: string
  defaultEmail?: string
  submitLabel?: string
  whatsappLabel?: string
  /** WhatsApp channel link; without it the button calls onWhatsapp. */
  whatsappHref?: string
  onWhatsapp?: () => void
  onSubmit?: (data: RateAlertData) => void
  submitting?: boolean
  class?: string
}

/**
 * Body of Sheet — Rate Alert (Figma S3 25:4431): Checklist Items for what to follow (52px
 * rows, 16px apart like every sheet row), an
 * email Text Field with an "@" unit box, primary "জানাতে চাই" and the secondary WhatsApp
 * channel button.
 */
export function RateAlertForm({
  topics = DEFAULT_RATE_ALERT_TOPICS,
  topicsLabel = 'কোন রেট বদলালে জানাব',
  emailLabel = 'ইমেইল',
  emailPlaceholder = 'tomar@email.com',
  defaultEmail,
  submitLabel = 'জানাতে চাই',
  whatsappLabel = 'WhatsApp চ্যানেলে যোগ দাও',
  whatsappHref,
  onWhatsapp,
  onSubmit,
  submitting = false,
  class: className,
}: RateAlertFormProps) {
  const submit = (event: JSX.TargetedSubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const checked = [...form.querySelectorAll<HTMLInputElement>('input[name="topic"]:checked')].map((i) => i.value)
    const email = (form.elements.namedItem('email') as HTMLInputElement | null)?.value.trim() ?? ''
    onSubmit?.({ topics: checked, email })
  }
  return (
    <form class={cx('grid min-w-0 gap-4', className)} onSubmit={submit} data-rate-alert-form>
      <fieldset class="grid min-w-0 gap-4">
        <legend class="sr-only">{topicsLabel}</legend>
        {topics.map((t) => (
          <ChecklistItem key={t.value} name="topic" value={t.value} label={t.label} defaultChecked={t.defaultChecked} />
        ))}
      </fieldset>
      <TextField
        label={emailLabel}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        prefix="@"
        placeholder={emailPlaceholder}
        defaultValue={defaultEmail}
      />
      <Button type="submit" block loading={submitting}>
        {submitLabel}
      </Button>
      {whatsappHref ? (
        <Button variant="secondary" block icon={<Message />} href={whatsappHref} target="_blank" rel="noopener">
          {whatsappLabel}
        </Button>
      ) : (
        <Button variant="secondary" block icon={<Message />} onClick={onWhatsapp}>
          {whatsappLabel}
        </Button>
      )}
    </form>
  )
}
