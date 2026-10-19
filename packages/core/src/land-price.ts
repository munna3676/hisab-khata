import {
  LAND_UNITS,
  isValidConvention,
  landConvention,
  landUnitSqft,
  type LandConvention,
  type LandUnit,
} from './land.ts'
import { cleanQuantity } from './lib/land-gold-edu-units.ts'
import { round } from './lib/money.ts'

/**
 * One registration cost (from data): stamp duty, registration fee, local
 * government tax, source tax, mutation fee and so on. Give one or more of
 * pct / perUnit / fixed; `combine` says whether they add up or the highest
 * applies ("whichever is higher", as source tax is set in some areas).
 */
export interface LandCostRule {
  /** e.g. 'stamp', 'registration', 'local-govt', 'source-tax', 'mutation'. */
  id: string
  /** Percent of the deed value (দলিল মূল্য). */
  pct?: number
  /** Taka per one `perUnitOf` of the area. */
  perUnit?: number
  perUnitOf?: LandUnit
  /** Flat taka per deed. */
  fixed?: number
  /** 'sum' (default) adds the parts; 'max' takes the highest. */
  combine?: 'sum' | 'max'
}

export interface LandPriceInput {
  area: number
  areaUnit: LandUnit
  /** Taka for one `priceUnit`, e.g. 25,00,000 per কাঠা. */
  price: number
  priceUnit: LandUnit
  convention?: Partial<LandConvention>
  /** Registration costs to add on top; leave out to show the price alone. */
  costs?: readonly LandCostRule[]
  /** Value written in the deed, if not the price; percent costs are charged on it. */
  deedValue?: number
  /** Government minimum (মৌজা মূল্য) per unit; the deed value is never taken below it. */
  mouzaRate?: { price: number; unit: LandUnit }
}

export interface LandCostLine {
  id: string
  amount: number
}

export interface LandPriceResult {
  /** মোট দাম. */
  total: number
  sqft: number
  /** Price of one of each unit, for "অন্য এককে দাম". */
  pricePer: Record<LandUnit, number>
  /** What percent costs were charged on. */
  deedValue: number
  costs: LandCostLine[]
  totalCost: number
  /** Price + every cost. */
  grandTotal: number
}

export type LandPriceError = 'area' | 'areaUnit' | 'price' | 'priceUnit' | 'convention' | 'costs' | 'deedValue' | 'mouzaRate'

function isAmount(v: number | undefined): boolean {
  return v === undefined || (v >= 0 && Number.isFinite(v))
}

function isValidCost(rule: LandCostRule): boolean {
  const hasPart = rule.pct !== undefined || rule.perUnit !== undefined || rule.fixed !== undefined
  if (!hasPart || !rule.id) return false
  if (rule.pct !== undefined && !(rule.pct >= 0 && rule.pct <= 100)) return false
  if (rule.perUnit !== undefined && !(rule.perUnitOf && LAND_UNITS.includes(rule.perUnitOf))) return false
  if (rule.combine !== undefined && rule.combine !== 'sum' && rule.combine !== 'max') return false
  return isAmount(rule.perUnit) && isAmount(rule.fixed)
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateLandPrice(input: LandPriceInput): LandPriceError | null {
  if (!(input.area > 0 && Number.isFinite(input.area))) return 'area'
  if (!LAND_UNITS.includes(input.areaUnit)) return 'areaUnit'
  if (!(input.price >= 0 && Number.isFinite(input.price))) return 'price'
  if (!LAND_UNITS.includes(input.priceUnit)) return 'priceUnit'
  if (!isValidConvention(landConvention(input.convention))) return 'convention'
  if (input.costs && !input.costs.every(isValidCost)) return 'costs'
  if (!isAmount(input.deedValue)) return 'deedValue'
  if (input.mouzaRate && !(isAmount(input.mouzaRate.price) && LAND_UNITS.includes(input.mouzaRate.unit))) {
    return 'mouzaRate'
  }
  return null
}

/** Total price, price in every unit, and registration costs on the deed value. */
export function calculateLandPrice(input: LandPriceInput): LandPriceResult {
  const c = landConvention(input.convention)
  const sqft = input.area * landUnitSqft(input.areaUnit, c)
  const pricePerSqft = input.price / landUnitSqft(input.priceUnit, c)
  const total = round(sqft * pricePerSqft)

  const pricePer = Object.fromEntries(
    LAND_UNITS.map((unit) => [unit, round(pricePerSqft * landUnitSqft(unit, c))]),
  ) as Record<LandUnit, number>

  const mouzaValue = input.mouzaRate ? (sqft * input.mouzaRate.price) / landUnitSqft(input.mouzaRate.unit, c) : 0
  const deedValue = round(Math.max(input.deedValue ?? total, mouzaValue))

  const costs = (input.costs ?? []).map((rule) => {
    const parts: number[] = []
    if (rule.pct !== undefined) parts.push((deedValue * rule.pct) / 100)
    if (rule.perUnit !== undefined) parts.push((sqft * rule.perUnit) / landUnitSqft(rule.perUnitOf!, c))
    if (rule.fixed !== undefined) parts.push(rule.fixed)
    const amount = rule.combine === 'max' ? Math.max(...parts) : parts.reduce((s, v) => s + v, 0)
    return { id: rule.id, amount: round(amount) }
  })
  const totalCost = round(costs.reduce((s, line) => s + line.amount, 0))

  return { total, sqft: cleanQuantity(sqft), pricePer, deedValue, costs, totalCost, grandTotal: round(total + totalCost) }
}
