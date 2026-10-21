import { defineParams } from '../tool/url-state.ts'

/** The inputs in a share link: /tools/profit-margin?cost=650&price=900&target=25. Defaults: Figma C3. */
export const PROFIT_PARAMS = defineParams({
  cost: { kind: 'number', default: 800, min: 0, max: 100_000_000_000 },
  price: { kind: 'number', default: 1000, min: 0, max: 100_000_000_000 },
  /** টার্গেট মার্জিন থেকে দাম: the margin wanted, % of the selling price. */
  target: { kind: 'number', default: 30, min: 0, max: 100 },
})

/** What validateProfitMargin accepts (the selling price must be above 0). */
export const PROFIT_LIMITS = { cost: { min: 0 }, price: { min: 0.01 } } as const
