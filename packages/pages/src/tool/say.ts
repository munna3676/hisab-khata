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
