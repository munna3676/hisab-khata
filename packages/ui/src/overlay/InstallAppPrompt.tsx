import type { ComponentChildren } from 'preact'
import { Button } from '../base/Button'
import { Download } from '../icons/base'
import { Check } from '../icons/common'
import { cx } from '../lib/cx'
import { LogoMark } from '../nav/Logo'

type HeadingLevel = 2 | 3 | 4

export interface InstallAppPromptProps {
  /** Id for the heading, so the sheet can be labelled by it (BottomSheet labelledBy). */
  titleId?: string
  title?: ComponentChildren
  subtitle?: ComponentChildren
  benefits?: readonly ComponentChildren[]
  laterLabel?: string
  installLabel?: string
  onLater?: () => void
  onInstall?: () => void
  headingLevel?: HeadingLevel
  class?: string
}

const BENEFITS = ['ইন্টারনেট ছাড়াও ক্যালকুলেটর চলে', 'হোম স্ক্রিন থেকে এক ট্যাপে খোলে', 'ফোনে খুব কম জায়গা লাগে']

/**
 * Body of Sheet — Install App (Figma S4 25:4551): 64px accent-tint app tile with the ledger
 * mark, Display/H2 title and soft subtitle, three ticked benefits (Body/Regular), then
 * "পরে" (secondary) and "ইনস্টল করো" (primary, download icon) side by side.
 */
export function InstallAppPrompt({
  titleId,
  title = 'হিসাব খাতা ফোনে রাখো',
  subtitle = 'অ্যাপ স্টোর লাগবে না',
  benefits = BENEFITS,
  laterLabel = 'পরে',
  installLabel = 'ইনস্টল করো',
  onLater,
  onInstall,
  headingLevel = 2,
  class: className,
}: InstallAppPromptProps) {
  const Heading = `h${headingLevel}` as 'h2'
  return (
    <div class={cx('grid min-w-0 gap-4', className)} data-install-prompt>
      <div class="flex min-w-0 items-center gap-3.5">
        <span aria-hidden="true" class="grid size-16 shrink-0 place-items-center rounded-[16px] bg-accent-tint">
          <LogoMark />
        </span>
        <div class="grid min-w-0 flex-1 gap-0.5">
          <Heading id={titleId} class="type-h2 text-ink">
            {title}
          </Heading>
          <p class="type-body-small text-soft">{subtitle}</p>
        </div>
      </div>
      <ul class="grid min-w-0 gap-4">
        {benefits.map((b, i) => (
          <li key={i} class="flex min-w-0 items-center gap-2.5 type-body text-ink">
            <Check size={20} class="text-good" />
            <span class="min-w-0 flex-1">{b}</span>
          </li>
        ))}
      </ul>
      <div class="grid min-w-0 grid-cols-2 gap-3">
        <Button variant="secondary" block onClick={onLater}>
          {laterLabel}
        </Button>
        <Button block icon={<Download />} onClick={onInstall}>
          {installLabel}
        </Button>
      </div>
    </div>
  )
}
