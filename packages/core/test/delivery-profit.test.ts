import { describe, expect, it } from 'vitest'
import {
  calculateDeliveryProfit,
  compareDeliveryProfit,
  courierCharge,
  validateDeliveryProfit,
  type CourierRate,
  type DeliveryProfitInput,
} from '../src/delivery-profit.ts'

// Test fixtures shaped like data/couriers.json; real rates live in data/.
const steadfast: CourierRate = {
  name: 'Steadfast',
  codBase: 'collected-minus-delivery',
  returnChargePct: 0,
  zones: {
    'inside-dhaka': { slabs: [{ maxKg: 1, charge: 80 }], extra: { stepKg: 1, charge: 20 }, codPct: 1 },
    'outside-dhaka': { slabs: [{ maxKg: 1, charge: 130 }], extra: { stepKg: 1, charge: 20 }, codPct: 1 },
  },
}
const other: CourierRate = {
  name: 'Other',
  codBase: 'collected',
  returnChargePct: 50,
  zones: {
    'inside-dhaka': {
      slabs: [
        { maxKg: 0.5, charge: 60 },
        { maxKg: 1, charge: 70 },
      ],
      extra: { stepKg: 1, charge: 15 },
      codPct: 0,
    },
  },
}

const figma: DeliveryProfitInput = {
  sellingPrice: 1200,
  productCost: 700,
  courier: steadfast,
  zone: 'inside-dhaka',
  weightKg: 1,
  codPct: 1,
}

describe('delivery profit', () => {
  it('matches the Figma example (E6): ৳১,২০০ − ৳৭০০ − ৳৮০ − ৳১১.২০ = ৳৪০৮.৮০, মার্জিন ৩৪%', () => {
    const r = calculateDeliveryProfit(figma)
    expect(r.deliveryCharge).toBe(80)
    // Steadfast: 1% on what is collected after the delivery charge, (1,200 − 80) × 1%
    expect(r.codCharge).toBe(11.2)
    expect(r.payout).toBe(1108.8)
    expect(r.profit).toBe(408.8)
    expect(Math.round(r.marginPct)).toBe(34)
  })
  it('hand-checked: customer pays delivery, COD on the full collection, packaging', () => {
    const r = calculateDeliveryProfit({
      sellingPrice: 1000,
      productCost: 600,
      packagingCost: 20,
      courier: other,
      zone: 'inside-dhaka',
      weightKg: 0.4,
      codPct: 1,
      deliveryPaidBy: 'customer',
    })
    // Collected 1,060; COD 10.60; payout 1,060 − 60 − 10.60 = 989.40; profit 989.40 − 620 = 369.40
    expect(r).toMatchObject({ deliveryCharge: 60, customerDeliveryFee: 60, collected: 1060, codCharge: 10.6, payout: 989.4, profit: 369.4 })
  })
  it('counts returns: 20% of orders back, each losing half the delivery charge and the packaging', () => {
    const r = calculateDeliveryProfit({
      sellingPrice: 1000,
      productCost: 600,
      packagingCost: 20,
      courier: other,
      zone: 'inside-dhaka',
      weightKg: 1,
      returnRatePct: 20,
    })
    // Delivered: 1,000 − 70 − 600 − 20 = 310. Returned: 35 + 20 = 55. 0.8 × 310 − 0.2 × 55 = 237
    expect(r.profit).toBe(310)
    expect(r.returnLoss).toBe(55)
    expect(r.expectedProfit).toBe(237)
    expect(r.breakEvenReturnPct).toBe(84.93)
  })
  it('charges extra weight by the step, rounding part of a step up', () => {
    const zone = steadfast.zones['inside-dhaka']!
    expect(courierCharge(zone, 0.2)).toBe(80)
    expect(courierCharge(zone, 1)).toBe(80)
    expect(courierCharge(zone, 1.2)).toBe(100)
    expect(courierCharge(zone, 3)).toBe(120)
    expect(courierCharge(other.zones['inside-dhaka']!, 0.7)).toBe(70)
  })
  it('reports a loss and has no break-even return rate then', () => {
    const r = calculateDeliveryProfit({ ...figma, sellingPrice: 700 })
    expect(r.profit).toBeLessThan(0)
    expect(r.breakEvenReturnPct).toBeNull()
    expect(calculateDeliveryProfit({ ...figma, sellingPrice: 0, productCost: 0 }).marginPct).toBe(0)
  })
  it('compares couriers that serve the zone, best first', () => {
    const list = compareDeliveryProfit({ sellingPrice: 1200, productCost: 700, zone: 'inside-dhaka', weightKg: 1 }, [steadfast, other])
    expect(list.map((c) => c.courier)).toEqual(['Other', 'Steadfast'])
    expect(compareDeliveryProfit({ sellingPrice: 1200, productCost: 700, zone: 'outside-dhaka', weightKg: 1 }, [steadfast, other])).toHaveLength(1)
  })
  it('hand-checked: outside Dhaka, 2.5 kg → 130 + 2 extra kg × 20 = ৳170; COD 1% of (2,000 − 170) = ৳18.30', () => {
    const r = calculateDeliveryProfit({ sellingPrice: 2000, productCost: 1100, packagingCost: 25, courier: steadfast, zone: 'outside-dhaka', weightKg: 2.5 })
    // payout 2,000 − 170 − 18.30 = 1,811.70; profit 1,811.70 − 1,125 = 686.70; margin 686.70 ÷ 2,000 = 34.335% → 34.34
    expect(r).toMatchObject({ deliveryCharge: 170, codCharge: 18.3, payout: 1811.7, profit: 686.7, marginPct: 34.34 })
  })
  it('hand-checked returns at full charge: 30% back, each losing ৳60 + ৳15 packaging', () => {
    const full: CourierRate = { ...other, returnChargePct: 100 }
    const r = calculateDeliveryProfit({ sellingPrice: 900, productCost: 500, packagingCost: 15, courier: full, zone: 'inside-dhaka', weightKg: 0.5, returnRatePct: 30 })
    // Delivered: 900 − 60 − 500 − 15 = 325. 0.7 × 325 − 0.3 × 75 = 205. Break-even 325 ÷ 400 = 81.25%
    expect(r).toMatchObject({ profit: 325, returnLoss: 75, expectedProfit: 205, breakEvenReturnPct: 81.25 })
    // Every 1 kg parcel back: only the loss is left, ৳70 charge + ৳10 packaging.
    expect(calculateDeliveryProfit({ ...figma, courier: full, packagingCost: 10, returnRatePct: 100 }).expectedProfit).toBe(-80)
  })
  it('charges half-kg steps above the heaviest slab without float noise', () => {
    const zone = { slabs: [{ maxKg: 0.5, charge: 60 }, { maxKg: 1, charge: 70 }], extra: { stepKg: 0.5, charge: 10 }, codPct: 0 }
    expect([0.5, 0.51, 1.5, 1.6, 2, 0.3 + 0.7].map((kg) => courierCharge(zone, kg))).toEqual([60, 70, 80, 90, 90, 70])
    const tenth = { ...zone, extra: { stepKg: 0.1, charge: 5 } }
    expect(courierCharge(tenth, 1.1)).toBe(75)
  })
  it('a customer delivery fee above the courier charge adds to the profit', () => {
    const r = calculateDeliveryProfit({ ...figma, deliveryPaidBy: 'customer', customerDeliveryFee: 100 })
    // Collected 1,300; COD 1% of 1,220 = 12.20; 1,300 − 80 − 12.20 − 700 = 507.80
    expect(r).toMatchObject({ collected: 1300, codCharge: 12.2, profit: 507.8 })
  })
  it('compares with each courier\'s own COD even when the form still holds an override', () => {
    const form: DeliveryProfitInput = { ...figma, codPct: 5 }
    const list = compareDeliveryProfit(form, [steadfast, other])
    expect(list.find((c) => c.courier === 'Steadfast')!.result.codCharge).toBe(11.2)
    expect(list.find((c) => c.courier === 'Other')!.result.codCharge).toBe(0)
  })
  it('rejects a broken courier price list', () => {
    expect(validateDeliveryProfit({ ...figma, courier: { ...steadfast, returnChargePct: Number.POSITIVE_INFINITY } })).toBe('courier')
    const unsorted: CourierRate = { ...other, zones: { 'inside-dhaka': { ...other.zones['inside-dhaka']!, slabs: [{ maxKg: 1, charge: 70 }, { maxKg: 0.5, charge: 60 }] } } }
    expect(validateDeliveryProfit({ ...figma, courier: unsorted })).toBe('courier')
    const noStep: CourierRate = { ...steadfast, zones: { 'inside-dhaka': { ...steadfast.zones['inside-dhaka']!, extra: { stepKg: 0, charge: 20 } } } }
    expect(validateDeliveryProfit({ ...figma, courier: noStep })).toBe('courier')
    expect(validateDeliveryProfit({ ...figma, weightKg: Number.NaN })).toBe('weight')
  })
  it('validates input', () => {
    expect(validateDeliveryProfit({ ...figma, sellingPrice: -1 })).toBe('sellingPrice')
    expect(validateDeliveryProfit({ ...figma, productCost: Number.NaN })).toBe('productCost')
    expect(validateDeliveryProfit({ ...figma, packagingCost: -5 })).toBe('packagingCost')
    expect(validateDeliveryProfit({ ...figma, zone: 'chittagong' })).toBe('zone')
    expect(validateDeliveryProfit({ ...figma, zone: 'toString' })).toBe('zone')
    expect(validateDeliveryProfit({ ...figma, weightKg: 0 })).toBe('weight')
    expect(validateDeliveryProfit({ ...figma, codPct: 101 })).toBe('cod')
    expect(validateDeliveryProfit({ ...figma, customerDeliveryFee: -60 })).toBe('customerDeliveryFee')
    expect(validateDeliveryProfit({ ...figma, returnRatePct: 120 })).toBe('returnRate')
    const broken: CourierRate = { ...steadfast, zones: { 'inside-dhaka': { slabs: [], extra: { stepKg: 1, charge: 0 }, codPct: 1 } } }
    expect(validateDeliveryProfit({ ...figma, courier: broken })).toBe('courier')
    expect(validateDeliveryProfit(figma)).toBeNull()
  })
})
