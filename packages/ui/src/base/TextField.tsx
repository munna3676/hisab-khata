import type { ComponentChildren, InputHTMLAttributes, Ref } from 'preact'
import { cx } from '../lib/cx'
import { useUid } from './uid'

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'class' | 'prefix' | 'label'> {
  /** Visible label above the box (Body/Label). */
  label: ComponentChildren
  /** Unit box on the left, e.g. "৳" (Figma Prefix). */
  prefix?: ComponentChildren
  /** Unit box on the right, e.g. "%" or "মাস". */
  suffix?: ComponentChildren
  /** Help text under the box (Body/Small, soft). Replaced by `error` while there is one. */
  helper?: ComponentChildren
  /** Error message: accent border and accent text under the box (Figma State=Error). */
  error?: ComponentChildren
  /** Number/L (IBM Plex Mono 20/28) for amounts (Figma); false = Body/Medium for words. */
  numeric?: boolean
  /** Extra classes for the outer wrapper. */
  class?: string
  /** Extra classes for the 52px box (e.g. to show the focus ring in the gallery). */
  boxClass?: string
  inputRef?: Ref<HTMLInputElement>
}

/**
 * Text Field (Figma 5:73): label, 52px box on paper with optional unit boxes, helper or
 * error text. The 1.5px line border and the 2px focus (blue) or error (accent) border are
 * drawn by ::before/::after, so focus fades in with opacity and nothing else animates.
 * The box keeps 1.5px of padding where Figma's inside stroke sits, so the unit boxes start
 * inside the border (prefix divider 49.5px in, value text 63.5px in, as in Figma).
 * One <label> holds the label text and the box, so a tap anywhere on the box (a unit too)
 * focuses the input without JS, and the input has exactly one label; aria-labelledby keeps
 * its name to the label text, and the units are read as its description.
 * The message line is one polite live region that stays in the DOM, so an error that
 * appears where there was no helper is still announced.
 */
export function TextField({
  label,
  prefix,
  suffix,
  helper,
  error,
  numeric = false,
  id,
  disabled,
  class: className,
  boxClass,
  inputRef,
  'aria-describedby': describedBy,
  'aria-labelledby': labelledBy,
  ...input
}: TextFieldProps) {
  const inputId = useUid(id as string | undefined, 'field')
  const invalid = error != null && error !== false && error !== ''
  const message = invalid ? error : helper
  const hasMessage = message != null && message !== false && message !== ''
  const ids = {
    label: `${inputId}-label`,
    prefix: `${inputId}-prefix`,
    suffix: `${inputId}-suffix`,
    message: `${inputId}-message`,
  }
  const describedByIds = [
    prefix != null ? ids.prefix : null,
    suffix != null ? ids.suffix : null,
    hasMessage ? ids.message : null,
    typeof describedBy === 'string' ? describedBy : null,
  ]
    .filter(Boolean)
    .join(' ')
  const affix = 'flex h-full min-w-12 shrink-0 cursor-text items-center justify-center bg-sheet px-2 type-body-medium text-soft select-none'

  return (
    <div class={cx('grid min-w-0 content-start gap-2', className)} data-invalid={invalid ? '' : undefined}>
      <label for={inputId} class="grid min-w-0 gap-2">
        <span id={ids.label} class="type-label text-ink">
          {label}
        </span>
        <span
          class={cx(
            'relative flex h-13 min-w-0 items-stretch overflow-hidden rounded-input bg-paper p-[1.5px]',
            // Resting 1.5px line border, and the 2px state border above it (opacity only). The resting one
            // is an inset ring, not a border: Chrome floors a 1.5px border to 1px at DPR 1, which would
            // leave a sliver of the 1.5px padding showing between the border and a unit box.
            "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:inset-ring-[1.5px] before:inset-ring-line before:content-['']",
            "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border-2 after:opacity-0 after:transition-opacity after:duration-hover after:ease-out after:content-['']",
            invalid ? 'after:border-accent after:opacity-100' : 'after:border-blue focus-within:after:opacity-100',
            disabled && 'opacity-50',
            boxClass,
          )}
        >
          {prefix != null && (
            // Hidden from the name, read as the description (aria-describedby).
            <span id={ids.prefix} aria-hidden="true" class={cx(affix, 'border-r border-line')}>
              {prefix}
            </span>
          )}
          <input
            {...input}
            id={inputId}
            ref={inputRef}
            disabled={disabled}
            aria-labelledby={typeof labelledBy === 'string' ? labelledBy : ids.label}
            aria-invalid={invalid ? true : undefined}
            aria-describedby={describedByIds || undefined}
            class={cx(
              'h-full min-w-0 flex-1 bg-transparent px-3.5 text-ink outline-hidden placeholder:text-soft disabled:cursor-not-allowed',
              numeric ? 'hk-num text-number-l' : 'type-body-medium',
            )}
          />
          {suffix != null && (
            <span id={ids.suffix} aria-hidden="true" class={cx(affix, 'border-l border-line')}>
              {suffix}
            </span>
          )}
        </span>
      </label>
      {/* Always rendered: an empty live region is out of the flow (sr-only adds no grid gap). */}
      <p id={ids.message} class={cx('type-body-small', invalid ? 'text-accent' : 'text-soft', !hasMessage && 'sr-only')} aria-live="polite">
        {hasMessage ? message : null}
      </p>
    </div>
  )
}
