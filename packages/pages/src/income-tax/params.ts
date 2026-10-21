import { defineParams } from '../tool/url-state.ts'

/**
 * The inputs in a share link: /tools/income-tax?mode=freelancer&income=1200000&cat=disabled.
 * Defaults: Figma C6 (চাকরিজীবী, ৳৯,০০,০০০, সাধারণ, ৳১,০০,০০০ invested).
 */
export const INCOME_TAX_PARAMS = defineParams({
  /** তুমি কে? চাকরিজীবী (C6) or ফ্রিল্যান্সার (C6-b). */
  mode: { kind: 'enum', default: 'salaried', values: ['salaried', 'freelancer'] as const },
  income: { kind: 'number', default: 900000, min: 0, max: 100_000_000_000 },
  /** করদাতার ধরন: keys of the data file's thresholds (a test checks they exist). */
  cat: { kind: 'enum', default: 'general', values: ['general', 'womenOrSenior', 'disabled'] as const },
  inv: { kind: 'number', default: 100000, min: 0, max: 100_000_000_000 },
})

export type IncomeTaxPageMode = 'salaried' | 'freelancer'
export type TaxpayerCategory = 'general' | 'womenOrSenior' | 'disabled'

/** The Figma chips in order: সাধারণ, নারী / ৬৫+, প্রতিবন্ধী. */
export const CATEGORY_CHIPS = ['general', 'womenOrSenior', 'disabled'] as const

/**
 * Minimum tax area. Figma C6 has no area field and shows ন্যূনতম কর ৳৫,০০০ (Dhaka/Chattogram city
 * corporations); docs/open-items.md lists the missing area choice.
 */
export const TAX_AREA = 'dhakaCtgCity'

export const INCOME_TAX_LIMITS = { income: { min: 0 }, inv: { min: 0 } } as const
