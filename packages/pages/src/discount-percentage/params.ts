import { defineParams } from '../tool/url-state.ts'

/**
 * The inputs in a share link: /tools/discount-percentage?price=3000&off=25&n=8000&pct=12.
 * Defaults: Figma C2 (৳২,৫০০ with 20% off; ১৫% of ৫,০০০).
 */
export const DISCOUNT_PARAMS = defineParams({
  price: { kind: 'number', default: 2500, min: 0, max: 100_000_000_000 },
  off: { kind: 'number', default: 20, min: 0, max: 1000 },
  /** শতাংশ হিসাব: the number and the percent. */
  n: { kind: 'number', default: 5000, min: -100_000_000_000, max: 100_000_000_000 },
  pct: { kind: 'number', default: 15, min: -1_000_000, max: 1_000_000 },
})

/** Discount chips (Figma: ১০%, ২০%, ২৫%, ৫০%). */
export const DISCOUNT_CHIPS = [10, 20, 25, 50] as const

/** What validateDiscount accepts (percent off). */
export const DISCOUNT_LIMITS = { price: { min: 0 }, off: { min: 0, max: 100 } } as const
