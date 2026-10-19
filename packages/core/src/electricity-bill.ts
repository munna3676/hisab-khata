import { round } from './lib/money.ts'

/**
 * A month's electricity bill from the units used, under BERC's retail tariff
 * as each distribution company (BPDB, DESCO, DPDC, NESCO, WZPDCL, REB/PBS)
 * applies it. Every rate, step, charge and percentage is a parameter from
 * data/electricity-tariff.json, so a new BERC order needs no code change.
 */

/** Parts of the bill that VAT or a rebate can apply to. */
export type BillComponent = 'energy' | 'demand' | 'meterRent'

/** One step of the energy tariff. Each unit is priced by the step it falls in (০–৭৫ at one rate, ৭৬–২০০ at the next…). */
export interface EnergySlab {
  /** Last unit of the step, counted from the month's first unit (75, 200, 300…); null for the open last step. */
  upTo: number | null
  /** Taka per unit (kWh). */
  rate: number
}

export interface ElectricityTariff {
  /** Tariff category, e.g. "LT-A" (আবাসিক) or "LT-E" (বাণিজ্যিক). */
  category: string
  /** Step rates. A single open step is a flat rate. */
  slabs: EnergySlab[]
  /** Lifeline (লাইফলাইন): a month of `maxUnits` or fewer is billed wholly at `rate`; above it the steps apply from the first unit. */
  lifeline?: { maxUnits: number; rate: number }
  /** Time-of-day rates by period ("peak", "offPeak"…), used instead of the steps when the input gives units per period. */
  todRates?: Record<string, number>
  /** Demand charge: taka per kW of sanctioned load per month. */
  demandChargePerKw: number
  /** Meter rent: taka per month by meter type ("singlePhase", "threePhase"). */
  meterRent?: Record<string, number>
  /** VAT in percent, e.g. 5. */
  vatPct: number
  /** The parts VAT is charged on. */
  vatOn: BillComponent[]
  /** A rebate in percent on some parts, taken off before VAT (e.g. for prepaid meters). */
  rebate?: { pct: number; on: BillComponent[]; prepaidOnly?: boolean }
  /** Least energy charge for a month, when the tariff sets one. */
  minimumEnergyCharge?: number
}

/**
 * The tariff file: BERC's tariffs by category, and the few things a company
 * sets differently (usually meter rent).
 */
export interface ElectricityTariffTable {
  tariffs: Record<string, ElectricityTariff>
  /** Company id → category → fields that replace the BERC tariff's. */
  overrides?: Record<string, Record<string, Partial<ElectricityTariff>>>
}

/** The tariff a company applies to a category, or undefined when the category is unknown. */
export function resolveTariff(
  table: ElectricityTariffTable,
  companyId: string,
  category: string,
): ElectricityTariff | undefined {
  const base = table.tariffs[category]
  if (!base) return undefined
  return { ...base, ...table.overrides?.[companyId]?.[category] }
}

export interface ElectricityBillInput {
  /** Units (kWh) used this month (এই মাসের ইউনিট). */
  units: number
  /** Sanctioned load in kW (অনুমোদিত লোড). */
  sanctionedLoadKw: number
  tariff: ElectricityTariff
  /** Key into tariff.meterRent; no meter rent when left out. */
  meterType?: string
  /** A prepaid meter, for a rebate marked prepaidOnly. */
  prepaid?: boolean
  /** Units per time-of-day period for a ToD meter; `units` is then their sum and the steps are not used. */
  todUnits?: Record<string, number>
}

export interface ElectricityBillRow {
  /** First and last unit of the step as the table shows it: ০–৭৫, ৭৬–২০০, ২০১–২৫০. */
  fromUnit: number
  toUnit: number
  units: number
  rate: number
  amount: number
  /** The time-of-day period, for a ToD bill. */
  period?: string
}

export interface ElectricityBillResult {
  units: number
  /** Billed at the lifeline rate. */
  lifeline: boolean
  /** The step table (ধাপ অনুযায়ী হিসাব). */
  rows: ElectricityBillRow[]
  /** Energy charge (এনার্জি), after any minimum. */
  energy: number
  demand: number
  meterRent: number
  /** Rebate taken off before VAT; 0 when none. */
  rebate: number
  vatBase: number
  vat: number
  /** আনুমানিক বিল. */
  total: number
}

export type ElectricityBillError = 'units' | 'load' | 'tariff' | 'meterType' | 'todUnits'

function isAmount(v: number | undefined): boolean {
  return v === undefined || (v >= 0 && Number.isFinite(v))
}

/** True when a tariff from data can be calculated. */
export function isValidTariff(t: ElectricityTariff): boolean {
  const { slabs } = t
  if (slabs.length === 0 || slabs.at(-1)!.upTo !== null) return false
  const rising = slabs.every((s, i) => i === slabs.length - 1 || (s.upTo !== null && s.upTo > (i === 0 ? 0 : slabs[i - 1]!.upTo!)))
  if (!rising || !slabs.every((s) => isAmount(s.rate))) return false
  if (t.lifeline && !(t.lifeline.maxUnits > 0 && isAmount(t.lifeline.rate))) return false
  if (!isAmount(t.demandChargePerKw) || !isAmount(t.minimumEnergyCharge)) return false
  if (!(t.vatPct >= 0 && t.vatPct <= 100)) return false
  // A misspelt part ("meter") would turn the VAT into NaN.
  const isPart = (c: string) => c === 'energy' || c === 'demand' || c === 'meterRent'
  if (!t.vatOn.every(isPart)) return false
  if (t.rebate && !(t.rebate.pct >= 0 && t.rebate.pct <= 100 && t.rebate.on.every(isPart))) return false
  return Object.values(t.meterRent ?? {}).every(isAmount) && Object.values(t.todRates ?? {}).every(isAmount)
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateElectricityBill(input: ElectricityBillInput): ElectricityBillError | null {
  if (!(input.units >= 0 && Number.isFinite(input.units))) return 'units'
  if (!(input.sanctionedLoadKw >= 0 && Number.isFinite(input.sanctionedLoadKw))) return 'load'
  if (!isValidTariff(input.tariff)) return 'tariff'
  // Object.hasOwn, so "toString" is not taken for a meter type or a period.
  const rents = input.tariff.meterRent ?? {}
  if (input.meterType !== undefined && !Object.hasOwn(rents, input.meterType)) return 'meterType'
  if (input.todUnits !== undefined) {
    const rates = input.tariff.todRates
    const entries = Object.entries(input.todUnits)
    if (!rates || entries.length === 0) return 'todUnits'
    if (!entries.every(([period, u]) => Object.hasOwn(rates, period) && u >= 0 && Number.isFinite(u))) return 'todUnits'
  }
  return null
}

/** Energy rows for `units` under step rates (or the lifeline rate). */
function energyRows(units: number, t: ElectricityTariff): { rows: ElectricityBillRow[]; lifeline: boolean } {
  if (units === 0) return { rows: [], lifeline: false }
  if (t.lifeline && units <= t.lifeline.maxUnits) {
    const { rate } = t.lifeline
    return { rows: [{ fromUnit: 0, toUnit: units, units, rate, amount: round(units * rate) }], lifeline: true }
  }
  const rows: ElectricityBillRow[] = []
  let done = 0
  for (const slab of t.slabs) {
    const top = Math.min(units, slab.upTo ?? Infinity)
    const inStep = top - done
    if (inStep > 0) {
      rows.push({ fromUnit: done === 0 ? 0 : done + 1, toUnit: top, units: inStep, rate: slab.rate, amount: round(inStep * slab.rate) })
    }
    done = top
    if (units <= done) break
  }
  return { rows, lifeline: false }
}

/** Step-by-step energy charge, demand charge, meter rent, rebate and VAT. */
export function calculateElectricityBill(input: ElectricityBillInput): ElectricityBillResult {
  const t = input.tariff
  let units = input.units
  let rows: ElectricityBillRow[]
  let lifeline = false
  if (input.todUnits) {
    const periods = Object.entries(input.todUnits)
    units = periods.reduce((sum, [, u]) => sum + u, 0)
    rows = periods.map(([period, u]) => {
      const rate = t.todRates![period]!
      return { fromUnit: 0, toUnit: u, units: u, rate, amount: round(u * rate), period }
    })
  } else {
    ;({ rows, lifeline } = energyRows(units, t))
  }

  const rowSum = round(rows.reduce((sum, r) => sum + r.amount, 0))
  const energy = Math.max(rowSum, t.minimumEnergyCharge ?? 0)
  const demand = round(input.sanctionedLoadKw * t.demandChargePerKw)
  const meterRent = input.meterType !== undefined ? t.meterRent![input.meterType]! : 0
  const parts: Record<BillComponent, number> = { energy, demand, meterRent }

  // Rebate comes off each part it covers, before VAT is worked out on what is left.
  const rebateApplies = t.rebate !== undefined && (!t.rebate.prepaidOnly || input.prepaid === true)
  const rebateOn = (c: BillComponent) => (rebateApplies && t.rebate!.on.includes(c) ? round((parts[c] * t.rebate!.pct) / 100) : 0)
  const components: BillComponent[] = ['energy', 'demand', 'meterRent']
  const rebate = round(components.reduce((sum, c) => sum + rebateOn(c), 0))
  const vatBase = round(t.vatOn.reduce((sum, c) => sum + parts[c] - rebateOn(c), 0))
  const vat = round((vatBase * t.vatPct) / 100)

  return {
    units,
    lifeline,
    rows,
    energy,
    demand,
    meterRent,
    rebate,
    vatBase,
    vat,
    total: round(energy + demand + meterRent - rebate + vat),
  }
}
