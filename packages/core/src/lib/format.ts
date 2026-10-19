import { toBanglaDigits } from './digits.ts'

export type Digits = 'bn' | 'en'

export interface FormatOptions {
  digits?: Digits
  /** Fixed number of decimals. Defaults to 0 for whole numbers, else 2. */
  decimals?: number
}

/** Groups the integer part the South Asian way: 1234567 → "12,34,567". */
export function groupLakh(integerPart: string): string {
  if (integerPart.length <= 3) return integerPart
  const last3 = integerPart.slice(-3)
  const rest = integerPart.slice(0, -3)
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3
}

/** 1234567.891 → "১২,৩৪,৫৬৭.৮৯" (bn) or "12,34,567.89" (en). */
export function formatNumber(value: number, opts: FormatOptions = {}): string {
  const decimals = opts.decimals ?? (Number.isInteger(value) ? 0 : 2)
  const [int, frac] = Math.abs(value).toFixed(decimals).split('.')
  const text = (value < 0 ? '-' : '') + groupLakh(int!) + (frac ? '.' + frac : '')
  return opts.digits === 'en' ? text : toBanglaDigits(text)
}

/** 5000 → "৳৫,০০০"; 45.5 → "৳৪৫.৫০". */
export function formatTaka(value: number, opts: FormatOptions = {}): string {
  const sign = value < 0 ? '-' : ''
  return sign + '৳' + formatNumber(Math.abs(value), opts)
}
