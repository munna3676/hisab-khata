import type { ComponentChildren, InputHTMLAttributes, JSX } from 'preact'
import { useState } from 'preact/hooks'
import { cx } from '../lib/cx'
import { useContentUid } from './uid'

export interface WizardOptionProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'class' | 'className' | 'type' | 'label' | 'onChange' | 'value'> {
  /** e.g. "বাবা-মায়ের নাম". */
  label: ComponentChildren
  /** Radio value. */
  value: string
  /** Radio group name (WizardOptionGroup sets it). */
  name?: string
  /** Figma State=Selected. Leave undefined for a native, uncontrolled radio. */
  checked?: boolean
  onChange?: (value: string, event: JSX.TargetedEvent<HTMLInputElement>) => void
  class?: string
}

/**
 * Wizard Option (Figma 9:361, State Default | Selected): a native radio drawn as a
 * card. Selected, the card turns accent-tint with a 2px accent border and the 20px mark
 * fills. The 2px border is the 1px border plus a 1px inset ring, so the card stays 58px:
 * Figma's Selected is 60px, which would nudge every option below it by 2px on each
 * choice. Styles follow :checked through :has(), so it also works as zero-JS HTML.
 */
export function WizardOption({ label, value, name, checked, onChange, disabled, class: className, ...input }: WizardOptionProps) {
  return (
    <label
      class={cx(
        'relative flex min-h-touch min-w-0 items-center gap-3 rounded-card border border-line bg-sheet p-4 text-ink [--hover-tint-opacity:0.04]',
        disabled ? 'cursor-not-allowed opacity-50' : 'pressable',
        'has-checked:border-accent has-checked:bg-accent-tint has-checked:inset-ring has-checked:inset-ring-accent',
        'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent',
        className,
      )}
      data-wizard-option
    >
      <input
        {...input}
        type="radio"
        class="peer sr-only"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={(event: JSX.TargetedEvent<HTMLInputElement>) => onChange?.(event.currentTarget.value, event)}
      />
      <span
        aria-hidden="true"
        class="grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] border-line bg-sheet peer-checked:border-[6px] peer-checked:border-accent peer-checked:bg-on-accent"
      />
      <span class="min-w-0 flex-1 type-body-medium">{label}</span>
    </label>
  )
}

export interface WizardChoice {
  value: string
  label: ComponentChildren
  disabled?: boolean
}

export interface WizardOptionGroupProps {
  /** The question, read as the group's name, e.g. "NID তে কোন তথ্য ভুল আছে?". */
  legend: ComponentChildren
  /** Hide the legend visually when the page shows the question as its heading. */
  legendHidden?: boolean
  options: readonly WizardChoice[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  /** Radio name for forms (generated when omitted). */
  name?: string
  class?: string
}

/** A wizard step's choices (Figma Guide Wizard 17:1843): a fieldset of Wizard Options, 10px apart. */
export function WizardOptionGroup({
  legend,
  legendHidden = false,
  options,
  value,
  defaultValue,
  onChange,
  name,
  class: className,
}: WizardOptionGroupProps) {
  const groupName = useContentUid(name, 'hkc-wiz')
  const [inner, setInner] = useState<string | undefined>(defaultValue)
  const current = value !== undefined ? value : inner

  return (
    <fieldset class={cx('m-0 min-w-0 border-0 p-0', className)} data-wizard-group>
      <legend class={cx(legendHidden ? 'sr-only' : 'mb-3 type-h3 text-ink')}>{legend}</legend>
      <div class="grid gap-2.5">
        {options.map((option) => (
          <WizardOption
            key={option.value}
            name={groupName}
            value={option.value}
            label={option.label}
            disabled={option.disabled}
            checked={current === option.value}
            onChange={(next) => {
              if (value === undefined) setInner(next)
              onChange?.(next)
            }}
          />
        ))}
      </div>
    </fieldset>
  )
}
