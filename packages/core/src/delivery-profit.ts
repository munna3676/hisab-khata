import { round } from './lib/money.ts'

/** One courier's price list for one delivery zone. Comes from data/, never hard-coded. */
export interface CourierZoneRate {
  /** Charge by weight, lightest first: a parcel up to `maxKg` costs `charge`. */
  slabs: { maxKg: number; charge: number }[]
  /** Added for each `stepKg`, or part of it, above the heaviest slab. */
  extra: { stepKg: number; charge: number }
  /** Cash-on-delivery charge in percent. */
  codPct: number
}

export interface CourierRate {
  /** Shown on the chip, e.g. "Steadfast". */
  name: string
  /** Keyed by zone id, e.g. "inside-dhaka", "sub-dhaka", "outside-dhaka". */
  zones: Record<string, CourierZoneRate>
  /**
   * What the COD percent is charged on: everything collected, or what is
   * collected less the delivery charge (Steadfast's rule).
   */
  codBase: 'collected' | 'collected-minus-delivery'
  /** What a returned parcel costs the seller, as a percent of its delivery charge: 0 = free, 100 = full charge. */
  returnChargePct: number
}

export interface DeliveryProfitInput {
  /** Product price charged to the customer (বিক্রয়মূল্য). */
  sellingPrice: number
  /** What the product cost the seller (পণ্যের খরচ). */
  productCost: number
  /** Box, poly, tape, sticker per order. */
  packagingCost?: number
  courier: CourierRate
  /** A key of `courier.zones` (এলাকা). */
  zone: string
  weightKg: number
  /** Overrides the courier's COD percent (the editable "COD চার্জ" field). */
  codPct?: number
  /** Who pays the delivery charge. Defaults to "seller" (free delivery for the customer). */
  deliveryPaidBy?: 'seller' | 'customer'
  /** What the customer is charged for delivery when they pay it; defaults to the courier's charge. */
  customerDeliveryFee?: number
  /** Percent of orders that come back unsold. */
  returnRatePct?: number
}

export interface DeliveryProfitResult {
  /** The courier's delivery charge (ডেলিভারি চার্জ). */
  deliveryCharge: number
  /** COD চার্জ. */
  codCharge: number
  /** What the delivery person collects from the customer. */
  collected: number
  /** What the courier pays out to the seller: collected − delivery − COD. */
  payout: number
  /** Delivery fee the customer paid; 0 when the seller paid delivery. */
  customerDeliveryFee: number
  /** Profit on an order that is delivered (প্রতি অর্ডারে লাভ). Negative is a loss. */
  profit: number
  /** Profit as a percent of the selling price (মার্জিন). */
  marginPct: number
  /** What one returned order costs: return charge plus wasted packaging. */
  returnLoss: number
  /** Average profit per order sent, once returns are counted. */
  expectedProfit: number
  /** Return rate at which the average profit falls to zero; null when even a delivered order loses money. */
  breakEvenReturnPct: number | null
}

export type DeliveryProfitError =
  | 'sellingPrice'
  | 'productCost'
  | 'packagingCost'
  | 'courier'
  | 'zone'
  | 'weight'
  | 'cod'
  | 'customerDeliveryFee'
  | 'returnRate'

/** Returns true when a zone's price list can be used: slabs present, rising, steps positive. */
function isValidZone(rate: CourierZoneRate): boolean {
  if (rate.slabs.length === 0) return false
  const rising = rate.slabs.every(
    (s, i) => s.maxKg > 0 && s.charge >= 0 && (i === 0 || s.maxKg > rate.slabs[i - 1]!.maxKg),
  )
  return rising && rate.extra.stepKg > 0 && rate.extra.charge >= 0 && rate.codPct >= 0 && rate.codPct <= 100
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateDeliveryProfit(input: DeliveryProfitInput): DeliveryProfitError | null {
  if (!(input.sellingPrice >= 0 && Number.isFinite(input.sellingPrice))) return 'sellingPrice'
  if (!(input.productCost >= 0 && Number.isFinite(input.productCost))) return 'productCost'
  const packaging = input.packagingCost ?? 0
  if (!(packaging >= 0 && Number.isFinite(packaging))) return 'packagingCost'
  if (!(input.courier.returnChargePct >= 0 && Number.isFinite(input.courier.returnChargePct))) return 'courier'
  const zone = Object.hasOwn(input.courier.zones, input.zone) ? input.courier.zones[input.zone] : undefined
  if (!zone) return 'zone'
  if (!isValidZone(zone)) return 'courier'
  if (!(input.weightKg > 0 && input.weightKg <= 1000)) return 'weight'
  if (input.codPct !== undefined && !(input.codPct >= 0 && input.codPct <= 100)) return 'cod'
  const fee = input.customerDeliveryFee
  if (fee !== undefined && !(fee >= 0 && Number.isFinite(fee))) return 'customerDeliveryFee'
  const r = input.returnRatePct
  if (r !== undefined && !(r >= 0 && r <= 100)) return 'returnRate'
  return null
}

/** Courier charge for a parcel: the first slab it fits, else the last slab plus extra steps. */
export function courierCharge(rate: CourierZoneRate, weightKg: number): number {
  const slab = rate.slabs.find((s) => weightKg <= s.maxKg)
  if (slab) return slab.charge
  const last = rate.slabs.at(-1)!
  // 1.0000000001 kg over is float noise, not a whole extra step.
  const steps = Math.ceil(Number(((weightKg - last.maxKg) / rate.extra.stepKg).toPrecision(12)))
  return round(last.charge + steps * rate.extra.charge)
}

/** Profit on one COD order after courier, COD and packaging, and the average once returns are counted. */
export function calculateDeliveryProfit(input: DeliveryProfitInput): DeliveryProfitResult {
  const rate = input.courier.zones[input.zone]!
  const deliveryCharge = courierCharge(rate, input.weightKg)
  const customerPays = input.deliveryPaidBy === 'customer'
  const customerDeliveryFee = customerPays ? round(input.customerDeliveryFee ?? deliveryCharge) : 0
  const collected = round(input.sellingPrice + customerDeliveryFee)

  const codPct = input.codPct ?? rate.codPct
  const afterDelivery = input.courier.codBase === 'collected-minus-delivery'
  const codBase = afterDelivery ? Math.max(0, collected - deliveryCharge) : collected
  const codCharge = round((codBase * codPct) / 100)
  const payout = round(collected - deliveryCharge - codCharge)

  const packaging = input.packagingCost ?? 0
  const profit = round(payout - input.productCost - packaging)
  // A returned product goes back on the shelf; the courier's return charge and the packaging are lost.
  const returnLoss = round((deliveryCharge * input.courier.returnChargePct) / 100 + packaging)
  const r = (input.returnRatePct ?? 0) / 100
  const expectedProfit = round((1 - r) * profit - r * returnLoss)

  return {
    deliveryCharge,
    codCharge,
    collected,
    payout,
    customerDeliveryFee,
    profit,
    marginPct: input.sellingPrice === 0 ? 0 : round((profit / input.sellingPrice) * 100),
    returnLoss,
    expectedProfit,
    breakEvenReturnPct: profit > 0 ? round((profit / (profit + returnLoss)) * 100) : null,
  }
}

export interface CourierComparison {
  courier: string
  result: DeliveryProfitResult
}

/**
 * Same order with every courier that serves the zone, best profit first.
 * Each courier's own COD percent is used.
 */
export function compareDeliveryProfit(
  input: Omit<DeliveryProfitInput, 'courier' | 'codPct'>,
  couriers: readonly CourierRate[],
): CourierComparison[] {
  // Drop a COD override the caller's form state may still carry, so each courier's own rate applies.
  const orders = couriers.map((courier): DeliveryProfitInput => ({ ...input, courier, codPct: undefined }))
  return orders
    .filter((order) => validateDeliveryProfit(order) === null)
    .map((order) => ({ courier: order.courier.name, result: calculateDeliveryProfit(order) }))
    .sort((a, b) => b.result.expectedProfit - a.result.expectedProfit)
}
