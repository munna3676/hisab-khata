import { round } from './lib/money.ts'

// ---- Profit, margin and markup from cost and selling price ----

export interface ProfitMarginInput {
  /** Buying or making cost per unit (কেনা দাম). */
  cost: number
  /** Selling price per unit (বেচার দাম). */
  sellingPrice: number
}

export interface ProfitMarginResult {
  /** Negative when selling at a loss. */
  profit: number
  /** Profit as a percent of the selling price (মার্জিন). */
  marginPct: number
  /** Profit as a percent of the cost (মার্কআপ); null when the cost is 0. */
  markupPct: number | null
}

export type ProfitMarginError = 'cost' | 'sellingPrice'

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateProfitMargin(input: ProfitMarginInput): ProfitMarginError | null {
  if (!(input.cost >= 0 && Number.isFinite(input.cost))) return 'cost'
  if (!(input.sellingPrice > 0 && Number.isFinite(input.sellingPrice))) return 'sellingPrice'
  return null
}

export function calculateProfitMargin(input: ProfitMarginInput): ProfitMarginResult {
  const profit = input.sellingPrice - input.cost
  return {
    profit: round(profit),
    marginPct: round((profit / input.sellingPrice) * 100),
    markupPct: input.cost === 0 ? null : round((profit / input.cost) * 100),
  }
}

// ---- Selling price from cost and a target margin or markup ----

export interface PriceFromMarginInput {
  cost: number
  /** Target in percent (চাওয়া মার্জিন). */
  pct: number
  /** "margin" (on the selling price, the default) or "markup" (on the cost). */
  basis?: 'margin' | 'markup'
}

export interface PriceFromMarginResult {
  /** Price to sell at (বেচতে হবে). */
  sellingPrice: number
  profit: number
  marginPct: number
  markupPct: number | null
}

export type PriceFromMarginError = 'cost' | 'pct'

export function validatePriceFromMargin(input: PriceFromMarginInput): PriceFromMarginError | null {
  if (!(input.cost >= 0 && Number.isFinite(input.cost))) return 'cost'
  // A margin of 100% or more would need an infinite price.
  const max = input.basis === 'markup' ? Number.POSITIVE_INFINITY : 100
  if (!(input.pct >= 0 && input.pct < max)) return 'pct'
  return null
}

/** Margin: cost ÷ (1 − margin). Markup: cost × (1 + markup). */
export function calculatePriceFromMargin(input: PriceFromMarginInput): PriceFromMarginResult {
  const markup = input.basis === 'markup'
  const p = input.pct / 100
  const price = markup ? input.cost * (1 + p) : input.cost / (1 - p)
  const profit = price - input.cost
  return {
    sellingPrice: round(price),
    profit: round(profit),
    // At zero cost the price is 0 too, so read the margin off the target itself.
    marginPct: price === 0 ? (markup ? markupToMargin(input.pct) : round(input.pct)) : round((profit / price) * 100),
    markupPct: input.cost === 0 ? null : round((profit / input.cost) * 100),
  }
}

/** 20% margin is 25% markup. Margin must be below 100. */
export function marginToMarkup(marginPct: number): number {
  return round((marginPct / (100 - marginPct)) * 100)
}

/** 25% markup is 20% margin. */
export function markupToMargin(markupPct: number): number {
  return round((markupPct / (100 + markupPct)) * 100)
}

// ---- Break-even (কত বিক্রি করলে লাভ-ক্ষতি সমান) ----

export interface BreakEvenInput {
  /** Costs that do not change with sales in the period: rent, salary, ad budget. */
  fixedCosts: number
  pricePerUnit: number
  /** Cost that comes with every unit sold: product, packaging, delivery. */
  variableCostPerUnit: number
  /** Profit wanted in the same period; 0 for plain break-even. */
  targetProfit?: number
}

export interface BreakEvenResult {
  /** What each sale leaves after its own cost. */
  contributionPerUnit: number
  /** contribution ÷ price, in percent. */
  contributionPct: number
  /** Whole units to sell; you cannot sell part of a unit. */
  units: number
  /** Units before rounding up, e.g. 83.33. */
  unitsExact: number
  /** Sales in taka at `units`. */
  revenue: number
}

export type BreakEvenError = 'fixedCosts' | 'pricePerUnit' | 'variableCostPerUnit' | 'targetProfit'

export function validateBreakEven(input: BreakEvenInput): BreakEvenError | null {
  if (!(input.fixedCosts >= 0 && Number.isFinite(input.fixedCosts))) return 'fixedCosts'
  if (!(input.pricePerUnit > 0 && Number.isFinite(input.pricePerUnit))) return 'pricePerUnit'
  // Each sale must leave something over, or break-even never comes.
  if (!(input.variableCostPerUnit >= 0 && input.variableCostPerUnit < input.pricePerUnit)) return 'variableCostPerUnit'
  const target = input.targetProfit ?? 0
  if (!(target >= 0 && Number.isFinite(target))) return 'targetProfit'
  return null
}

/** Units = (fixed costs + target profit) ÷ (price − variable cost per unit). */
export function calculateBreakEven(input: BreakEvenInput): BreakEvenResult {
  const contribution = input.pricePerUnit - input.variableCostPerUnit
  const unitsExact = (input.fixedCosts + (input.targetProfit ?? 0)) / contribution
  // Snap float noise (2.0000000000000004) before rounding up. The tolerance is
  // relative, so a huge count keeps its real fraction (toPrecision(12) would drop it).
  const whole = Math.round(unitsExact)
  const units = Math.abs(unitsExact - whole) <= Math.max(1e-9, unitsExact * 1e-14) ? whole : Math.ceil(unitsExact)
  return {
    contributionPerUnit: round(contribution),
    contributionPct: round((contribution / input.pricePerUnit) * 100),
    units,
    unitsExact: round(unitsExact),
    revenue: round(units * input.pricePerUnit),
  }
}
