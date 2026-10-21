// Number and text helpers every tool model uses: whole-taka amounts as Figma shows them, numbers
// and {name} placeholders in the page language.
import { formatNumberIn, formatTakaIn } from '@hisab/i18n/format'
import type { Lang } from '@hisab/i18n/locale'
import { interpolate } from '@hisab/i18n/t'

/** ৳ amount; whole taka unless `decimals` is given ("৳৫,৯৭,৮৫৮"). */
export const taka = (lang: Lang, value: number, decimals = 0) => formatTakaIn(lang, value, { decimals })

/** A plain number; decimals as @hisab/core formats them unless given ("১২", "৯.৫"). */
export const num = (lang: Lang, value: number, decimals?: number) => formatNumberIn(lang, value, decimals === undefined ? {} : { decimals })

/** A rate or count as typed: whole numbers without decimals, others with up to two ("১০", "৯.৫", "১১.২৫"). */
export const plain = (lang: Lang, value: number) =>
  formatNumberIn(lang, value, { decimals: Number.isInteger(value) ? 0 : Number.isInteger(value * 10) ? 1 : 2 })

/** Fills {name} placeholders in one language's copy. */
export const fill = (lang: Lang, text: string, vars?: Record<string, string>) => interpolate(lang, text, vars)

/** ৳ amount with paisa only when it has some ("৳১৫০", "৳১৪৯.৮৫"): VAT, discounts and prices. */
export const money = (lang: Lang, value: number) => formatTakaIn(lang, value, { decimals: hasPaisa(value) ? 2 : 0 })

/** True when a taka amount has paisa after rounding to the paisa. */
export const hasPaisa = (value: number) => Math.round(Math.abs(value) * 100) % 100 !== 0

/** A number with as few decimals as it needs, up to `max` ("১.১৫", "১.০৭৫", "১২"). */
export function decimal(lang: Lang, value: number, max = 4): string {
  let d = 0
  while (d < max && Math.abs(Math.round(value * 10 ** d) - value * 10 ** d) > 1e-6) d++
  return formatNumberIn(lang, value, { decimals: d })
}
