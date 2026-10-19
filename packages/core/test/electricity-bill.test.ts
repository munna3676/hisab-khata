import { describe, expect, it } from 'vitest'
import {
  calculateElectricityBill,
  isValidTariff,
  resolveTariff,
  validateElectricityBill,
  type ElectricityTariff,
  type ElectricityTariffTable,
} from '../src/electricity-bill.ts'
import { round } from '../src/lib/money.ts'

// Shaped like data/electricity-tariff.json, with the June 2026 residential (LT-A) rates on the Figma screen.
const LT_A: ElectricityTariff = {
  category: 'LT-A',
  slabs: [
    { upTo: 75, rate: 5.26 },
    { upTo: 200, rate: 8.5 },
    { upTo: 300, rate: 9.1 },
    { upTo: 400, rate: 9.62 },
    { upTo: 600, rate: 15.01 },
    { upTo: null, rate: 17.35 },
  ],
  lifeline: { maxUnits: 50, rate: 4.63 },
  demandChargePerKw: 42,
  meterRent: { singlePhase: 40, threePhase: 200 },
  vatPct: 5,
  vatOn: ['energy', 'demand'],
}

describe('electricity-bill', () => {
  it('matches the Figma example (E5): DESCO আবাসিক, ২৫০ ইউনিট, ২ kW → ৳২,০৯৫.৮০', () => {
    const r = calculateElectricityBill({ units: 250, sanctionedLoadKw: 2, tariff: LT_A })
    expect(r.rows.map((row) => [row.fromUnit, row.toUnit, row.rate, row.amount])).toEqual([
      [0, 75, 5.26, 394.5],
      [76, 200, 8.5, 1062.5],
      [201, 250, 9.1, 455],
    ])
    expect(r).toMatchObject({ energy: 1912, demand: 84, meterRent: 0, rebate: 0, vatBase: 1996, vat: 99.8, total: 2095.8 })
    expect(r.lifeline).toBe(false)
  })
  it('bills 50 units or fewer at the lifeline rate, hand-checked: 40 × 4.63 = 185.20', () => {
    const r = calculateElectricityBill({ units: 40, sanctionedLoadKw: 2, tariff: LT_A })
    expect(r.lifeline).toBe(true)
    expect(r.rows).toEqual([{ fromUnit: 0, toUnit: 40, units: 40, rate: 4.63, amount: 185.2 }])
    expect(r).toMatchObject({ energy: 185.2, vat: 13.46, total: 282.66 })
  })
  it('one unit past the lifeline bills every unit from the first step', () => {
    expect(calculateElectricityBill({ units: 50, sanctionedLoadKw: 0, tariff: LT_A }).energy).toBe(231.5)
    const r = calculateElectricityBill({ units: 51, sanctionedLoadKw: 0, tariff: LT_A })
    expect(r.lifeline).toBe(false)
    expect(r.energy).toBe(268.26)
  })
  it('walks every step, hand-checked: 700 units', () => {
    // 394.50 + 1,062.50 + 910 + 962 + 3,002 + 1,735 = 8,066
    const r = calculateElectricityBill({ units: 700, sanctionedLoadKw: 5, tariff: LT_A })
    expect(r.rows).toHaveLength(6)
    expect(r.rows.at(-1)).toMatchObject({ fromUnit: 601, toUnit: 700, units: 100, amount: 1735 })
    expect(r.energy).toBe(8066)
    expect(r.total).toBe(round((8066 + 210) * 1.05))
  })
  it('adds meter rent, with VAT on it only when the tariff says so', () => {
    const plain = calculateElectricityBill({ units: 250, sanctionedLoadKw: 2, tariff: LT_A, meterType: 'singlePhase' })
    expect(plain).toMatchObject({ meterRent: 40, vat: 99.8, total: 2135.8 })
    const taxed = { ...LT_A, vatOn: ['energy', 'demand', 'meterRent'] as ElectricityTariff['vatOn'] }
    expect(calculateElectricityBill({ units: 250, sanctionedLoadKw: 2, tariff: taxed, meterType: 'singlePhase' }).vat).toBe(101.8)
  })
  it('takes a prepaid rebate off before VAT', () => {
    const t = { ...LT_A, rebate: { pct: 0.5, on: ['energy', 'demand'] as ElectricityTariff['vatOn'], prepaidOnly: true } }
    const post = calculateElectricityBill({ units: 250, sanctionedLoadKw: 2, tariff: t })
    expect(post.rebate).toBe(0)
    const pre = calculateElectricityBill({ units: 250, sanctionedLoadKw: 2, tariff: t, prepaid: true })
    // 0.5% of 1,912 = 9.56; of 84 = 0.42. VAT 5% of 1,986.02 = 99.30.
    expect(pre).toMatchObject({ rebate: 9.98, vatBase: 1986.02, vat: 99.3, total: 2085.32 })
  })
  it('bills a flat commercial rate, a time-of-day meter and a minimum charge', () => {
    const flat: ElectricityTariff = { ...LT_A, category: 'LT-E', slabs: [{ upTo: null, rate: 14.01 }], lifeline: undefined }
    expect(calculateElectricityBill({ units: 100, sanctionedLoadKw: 0, tariff: flat }).energy).toBe(1401)
    const tod: ElectricityTariff = { ...flat, todRates: { offPeak: 12.61, peak: 16.81 } }
    const r = calculateElectricityBill({ units: 0, sanctionedLoadKw: 0, tariff: tod, todUnits: { offPeak: 80, peak: 20 } })
    expect(r.units).toBe(100)
    expect(r.energy).toBe(round(80 * 12.61 + 20 * 16.81))
    const min = { ...LT_A, minimumEnergyCharge: 100 }
    expect(calculateElectricityBill({ units: 10, sanctionedLoadKw: 0, tariff: min }).energy).toBe(100)
  })
  it('handles zero units (demand charge only) and very large use', () => {
    const r = calculateElectricityBill({ units: 0, sanctionedLoadKw: 2, tariff: LT_A })
    expect(r).toMatchObject({ rows: [], energy: 0, total: 88.2 })
    expect(calculateElectricityBill({ units: 1e6, sanctionedLoadKw: 0, tariff: LT_A }).energy).toBe(
      round(394.5 + 1062.5 + 910 + 962 + 3002 + (1e6 - 600) * 17.35),
    )
  })
  it('resolves a company tariff with its own meter rent', () => {
    const table: ElectricityTariffTable = {
      tariffs: { 'LT-A': LT_A },
      overrides: { dpdc: { 'LT-A': { meterRent: { singlePhase: 25 } } } },
    }
    expect(resolveTariff(table, 'desco', 'LT-A')).toEqual(LT_A)
    expect(resolveTariff(table, 'dpdc', 'LT-A')!.meterRent).toEqual({ singlePhase: 25 })
    expect(resolveTariff(table, 'dpdc', 'LT-Z')).toBeUndefined()
  })
  it('hand-checked with the earlier BERC LT-A tariff (29 Feb 2024 order): 350 units, 3 kW', () => {
    // Steps 5.26 / 7.20 / 7.59 / 8.02 / 12.67 / 14.61, lifeline 4.63, demand ৳42/kW, VAT 5% on energy + demand.
    const feb2024: ElectricityTariff = {
      ...LT_A,
      slabs: [
        { upTo: 75, rate: 5.26 },
        { upTo: 200, rate: 7.2 },
        { upTo: 300, rate: 7.59 },
        { upTo: 400, rate: 8.02 },
        { upTo: 600, rate: 12.67 },
        { upTo: null, rate: 14.61 },
      ],
      meterRent: undefined,
    }
    // 75 × 5.26 = 394.50; 125 × 7.20 = 900; 100 × 7.59 = 759; 50 × 8.02 = 401 → 2,454.50
    // Demand 3 × 42 = 126. VAT 5% of 2,580.50 = 129.025 → 129.03. Total 2,709.53.
    const r = calculateElectricityBill({ units: 350, sanctionedLoadKw: 3, tariff: feb2024 })
    expect(r.rows.map((row) => row.amount)).toEqual([394.5, 900, 759, 401])
    expect(r).toMatchObject({ energy: 2454.5, demand: 126, vatBase: 2580.5, vat: 129.03, total: 2709.53 })
    // Exactly 50 units is still lifeline: 50 × 4.63 = 231.50; + 42 demand; VAT 13.675 → 13.68; total 287.18.
    expect(calculateElectricityBill({ units: 50, sanctionedLoadKw: 1, tariff: feb2024 })).toMatchObject({
      lifeline: true,
      energy: 231.5,
      vat: 13.68,
      total: 287.18,
    })
  })
  it('splits rows exactly at a step edge', () => {
    expect(calculateElectricityBill({ units: 75, sanctionedLoadKw: 0, tariff: LT_A }).rows).toHaveLength(1)
    const r = calculateElectricityBill({ units: 76, sanctionedLoadKw: 0, tariff: LT_A })
    expect(r.rows.at(-1)).toEqual({ fromUnit: 76, toUnit: 76, units: 1, rate: 8.5, amount: 8.5 })
    expect(r.energy).toBe(403)
  })
  it('rejects tariff data that names an unknown bill part, and inherited keys as meter types or periods', () => {
    expect(isValidTariff({ ...LT_A, vatOn: ['meter' as 'energy'] })).toBe(false)
    expect(isValidTariff({ ...LT_A, rebate: { pct: 1, on: ['fuel' as 'energy'] } })).toBe(false)
    expect(validateElectricityBill({ units: 10, sanctionedLoadKw: 2, tariff: LT_A, meterType: 'toString' })).toBe('meterType')
    const tod = { ...LT_A, todRates: { peak: 16.81 } }
    expect(validateElectricityBill({ units: 0, sanctionedLoadKw: 2, tariff: tod, todUnits: { constructor: 5 } })).toBe('todUnits')
    expect(validateElectricityBill({ units: 0, sanctionedLoadKw: 2, tariff: tod, todUnits: { peak: 5 } })).toBeNull()
  })
  it('validates input and tariff data', () => {
    expect(validateElectricityBill({ units: -1, sanctionedLoadKw: 2, tariff: LT_A })).toBe('units')
    expect(validateElectricityBill({ units: 10, sanctionedLoadKw: Number.NaN, tariff: LT_A })).toBe('load')
    expect(validateElectricityBill({ units: 10, sanctionedLoadKw: 2, tariff: { ...LT_A, slabs: [{ upTo: 75, rate: 5 }] } })).toBe('tariff')
    expect(validateElectricityBill({ units: 10, sanctionedLoadKw: 2, tariff: LT_A, meterType: 'smart' })).toBe('meterType')
    expect(validateElectricityBill({ units: 10, sanctionedLoadKw: 2, tariff: LT_A, todUnits: { peak: 5 } })).toBe('todUnits')
    expect(isValidTariff({ ...LT_A, slabs: [{ upTo: 200, rate: 5 }, { upTo: 100, rate: 6 }, { upTo: null, rate: 7 }] })).toBe(false)
    expect(isValidTariff({ ...LT_A, vatPct: 120 })).toBe(false)
    expect(validateElectricityBill({ units: 250, sanctionedLoadKw: 2, tariff: LT_A })).toBeNull()
  })
})
