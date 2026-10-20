import type { ComponentChildren, HTMLAttributes, JSX } from 'preact'
import { Check } from '../icons/common'
import { cx } from '../lib/cx'

export interface BankCardRate {
  /** e.g. "সর্বোচ্চ FDR", "DPS", "পার্সোনাল লোন". */
  label: ComponentChildren
  /** Formatted rate, e.g. "৯.৫০%". Show "—%" until the rate is verified (banks/*.json). */
  value: ComponentChildren
}

export interface BankCardProps extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'className' | 'title' | 'onChange'> {
  /** Bank name, e.g. "ব্র্যাক ব্যাংক". */
  name: string
  /** Kind and legal name, e.g. "প্রাইভেট · BRAC Bank PLC". */
  type?: ComponentChildren
  /** Two or three letters in the logo circle, e.g. "BB". */
  initials: string
  /** Up to three rate tiles (Figma: সর্বোচ্চ FDR, DPS, পার্সোনাল লোন). */
  rates: readonly BankCardRate[]
  /** Bank detail page. The whole card becomes the link's hit area. */
  href?: string
  /** Link text (Figma "বিস্তারিত →"; the arrow is added). */
  detailsLabel?: string
  /** Shows the "add to compare" checkbox when given. */
  compareLabel?: string
  /** Controlled compare state; leave undefined for a native, uncontrolled checkbox. */
  compared?: boolean
  defaultCompared?: boolean
  onCompareChange?: (checked: boolean) => void
  /** Form name/value of the compare checkbox (e.g. name="compare" value="brac"). */
  compareName?: string
  compareValue?: string
  /** Heading level of the bank name inside a list (default h3). */
  titleAs?: 'h2' | 'h3' | 'h4' | 'p'
  class?: string
}

/**
 * Bank Card (Figma 9:170): logo initials, name and type, three rate tiles, an
 * "add to compare" checkbox and a details link. With `href` the card lifts on hover
 * and the whole card is the link's hit area (a stretched link), while the checkbox
 * stays its own target above it. Works as zero-JS HTML: the checkbox is native.
 */
export function BankCard({
  name,
  type,
  initials,
  rates,
  href,
  detailsLabel = 'বিস্তারিত',
  compareLabel,
  compared,
  defaultCompared,
  onCompareChange,
  compareName,
  compareValue,
  titleAs: Title = 'h3',
  class: className,
  ...rest
}: BankCardProps) {
  const linked = typeof href === 'string'
  return (
    <article
      {...rest}
      class={cx(
        'hkc-card flex min-w-0 flex-col gap-3 rounded-[12px] border border-line bg-sheet p-4 text-ink',
        linked && 'lift pressable [--hover-tint-opacity:0]',
        className,
      )}
      data-bank-card
    >
      <div class="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          class="grid size-touch shrink-0 place-items-center rounded-full bg-subtle type-label text-blue"
        >
          {initials}
        </span>
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <Title class="truncate font-body text-[1rem]/5 font-semibold text-ink">{name}</Title>
          {type && <p class="truncate font-body text-[0.8125rem]/5.5 text-soft">{type}</p>}
        </div>
      </div>

      {rates.length > 0 && (
        <dl class="flex min-w-0 gap-2">
          {rates.slice(0, 3).map((rate, i) => (
            <div key={i} class="flex min-w-0 flex-1 flex-col gap-0.5 rounded-input bg-paper px-2.5 py-2">
              <dt class="truncate font-body text-[0.75rem]/4 text-soft">{rate.label}</dt>
              <dd class="hkc-num truncate text-number-m font-semibold text-ink">{rate.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {(compareLabel || linked) && (
        // Figma's foot row is 22px (the 14/22 compare label); the 44px targets overhang it by 11px.
        <div class="flex min-w-0 items-center gap-2">
          {compareLabel ? (
            <CompareToggle
              label={compareLabel}
              checked={compared}
              defaultChecked={defaultCompared}
              onChange={onCompareChange}
              name={compareName}
              value={compareValue}
            />
          ) : (
            <span class="flex-1" />
          )}
          {linked && (
            <a
              href={href}
              class={cx(
                'hkc-link -my-2.75 inline-flex min-h-touch shrink-0 items-center rounded-input type-label text-blue',
                // Stretched link: the whole card is the hit area (the card is `relative` through .lift).
                "before:absolute before:inset-0 before:rounded-[inherit] before:content-['']",
              )}
            >
              <span class="link-underline">
                <span class="sr-only">{name}: </span>
                {detailsLabel}
              </span>
              <span aria-hidden="true">&nbsp;→</span>
            </a>
          )}
        </div>
      )}
    </article>
  )
}

interface CompareToggleProps {
  label: string
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  name?: string
  value?: string
}

function CompareToggle({ label, checked, defaultChecked, onChange, name, value }: CompareToggleProps) {
  return (
    <label class="hkc-compare pressable relative z-10 -my-2.75 flex min-h-touch min-w-0 flex-1 items-center gap-2 rounded-input pr-2 [--hover-tint-opacity:0]">
      <input
        type="checkbox"
        class="peer sr-only"
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={(event: JSX.TargetedEvent<HTMLInputElement>) => onChange?.(event.currentTarget.checked)}
      />
      <span
        aria-hidden="true"
        class="grid size-4.5 shrink-0 place-items-center rounded-[4px] border-[1.5px] border-line text-on-accent peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
      >
        <Check size={14} stroke-width={2.75} />
      </span>
      <span class="min-w-0 truncate type-body-small text-ink">{label}</span>
    </label>
  )
}
