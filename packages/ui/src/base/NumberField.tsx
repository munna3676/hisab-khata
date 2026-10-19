import { parseAmount, toBanglaDigits, toEnglishDigits } from '@hisab/core/lib/digits'
import { formatNumber, groupLakh, type Digits } from '@hisab/core/lib/format'
import type { ComponentChildren, JSX } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { TextField, type TextFieldProps } from './TextField'

export interface NumberFieldState {
  /** What is in the box, exactly as typed. */
  text: string
  /** True when the text is a number inside min/max (empty counts as not valid). */
  valid: boolean
}

export interface NumberFieldProps
  extends Omit<TextFieldProps, 'value' | 'defaultValue' | 'type' | 'onInput' | 'onChange' | 'numeric' | 'min' | 'max' | 'error'> {
  /** Controlled amount. Typing never gets reformatted under the cursor; an outside change (a quick-value chip) rewrites the text. */
  value?: number | null
  defaultValue?: number | null
  /** Every keystroke: the parsed amount (null while empty or not a number) and the text. Results update live, no Calculate button. */
  onValueChange?: (value: number | null, state: NumberFieldState) => void
  min?: number
  max?: number
  /** Digits for amounts the field writes itself (outside changes, blur formatting); default from `lang`, Bangla unless "en". Typed digits are kept as typed. */
  digits?: Digits
  /** Unit word used in the default range messages, e.g. "টাকা" → "কমপক্ষে ৫০ টাকা লিখতে হবে". */
  unit?: string
  /** Group thousands (৫০,০০০) when the field loses focus. Default true. */
  formatOnBlur?: boolean
  /** An outside error (e.g. over the monthly limit). Wins over the built-in messages. */
  error?: ComponentChildren
  messages?: {
    invalid?: string
    min?: (min: string) => string
    max?: (max: string) => string
  }
}

const BN_MESSAGES = {
  invalid: 'শুধু সংখ্যা লেখো',
  min: (min: string) => `কমপক্ষে ${min} লিখতে হবে`,
  max: (max: string) => `সর্বোচ্চ ${max} লেখা যাবে`,
}
const EN_MESSAGES = {
  invalid: 'Numbers only',
  min: (min: string) => `Enter at least ${min}`,
  max: (max: string) => `Enter at most ${max}`,
}

/** Which digits the person is typing in: Bangla if any Bangla digit, else English if any, else the fallback. */
export function digitsOf(text: string, fallback: Digits): Digits {
  if (/[০-৯]/.test(text)) return 'bn'
  if (/[0-9]/.test(text)) return 'en'
  return fallback
}

/** Rewrites a typed amount with lakh grouping, keeping its digits and the decimals as typed ("৫০০০০.৫" → "৫০,০০০.৫"). */
export function groupTyped(text: string, fallback: Digits): string {
  const value = parseAmount(text)
  if (value === null) return text
  const digits = digitsOf(text, fallback)
  const plain = toEnglishDigits(text).replace(/[^\d.\-+]/g, '')
  const [int = '', frac] = plain.replace(/^[+-]/, '').split('.')
  const sign = value < 0 ? '-' : ''
  const grouped = sign + groupLakh(String(Number(int || '0'))) + (frac !== undefined && frac !== '' ? '.' + frac : '')
  return digits === 'bn' ? toBanglaDigits(grouped) : grouped
}

/**
 * NumberField: the Figma Text Field for amounts. Accepts Bangla and English digits,
 * commas, spaces and a leading ৳/Tk (parsed with @hisab/core parseAmount), uses
 * inputmode=decimal for the number keyboard, and reports the amount on every keystroke.
 * Not-a-number errors show at once; min/max errors after the first blur.
 */
export function NumberField({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  digits: digitsProp,
  unit,
  formatOnBlur = true,
  error,
  messages,
  onBlur,
  onFocus,
  lang,
  ...rest
}: NumberFieldProps) {
  const digits: Digits = digitsProp ?? (lang === 'en' ? 'en' : 'bn')
  const controlled = value !== undefined
  const initial = controlled ? value : defaultValue
  const [text, setText] = useState(() => (initial == null ? '' : formatNumber(initial, { digits })))
  const [touched, setTouched] = useState(false)

  // An outside change (chip, reset) rewrites the text; the echo of our own typing does not.
  useEffect(() => {
    if (!controlled) return
    const typed = parseAmount(text)
    if (value === null ? text.trim() !== '' && typed !== null : typed !== value) {
      setText(value == null ? '' : formatNumber(value, { digits }))
    }
  }, [value, controlled]) // only outside value changes matter, not every keystroke

  const parsed = parseAmount(text)
  const defaults = lang === 'en' ? EN_MESSAGES : BN_MESSAGES
  const msg = {
    invalid: messages?.invalid ?? defaults.invalid,
    min: messages?.min ?? defaults.min,
    max: messages?.max ?? defaults.max,
  }
  const fmt = (n: number) => formatNumber(n, { digits }) + (unit ? ` ${unit}` : '')
  let builtIn: string | null = null
  if (text.trim() !== '' && parsed === null) builtIn = msg.invalid
  else if (parsed !== null && touched && min !== undefined && parsed < min) builtIn = msg.min(fmt(min))
  else if (parsed !== null && touched && max !== undefined && parsed > max) builtIn = msg.max(fmt(max))
  const shownError = error != null && error !== false && error !== '' ? error : builtIn

  const inRange = (n: number) => (min === undefined || n >= min) && (max === undefined || n <= max)

  const handleInput = (event: JSX.TargetedEvent<HTMLInputElement>) => {
    const next = event.currentTarget.value
    setText(next)
    const amount = parseAmount(next)
    onValueChange?.(amount, { text: next, valid: amount !== null && inRange(amount) })
  }

  return (
    <TextField
      {...rest}
      lang={lang}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      enterKeyHint="done"
      spellcheck={false}
      numeric
      value={text}
      error={shownError}
      onInput={handleInput}
      onFocus={onFocus}
      onBlur={(event: JSX.TargetedFocusEvent<HTMLInputElement>) => {
        setTouched(true)
        if (formatOnBlur) {
          const grouped = groupTyped(text, digits)
          if (grouped !== text) setText(grouped)
        }
        onBlur?.(event)
      }}
    />
  )
}
