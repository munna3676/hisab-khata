import { round } from './lib/money.ts'

/** How gross is split; presets come from data, and the screen lets people edit them. */
export interface SalaryStructure {
  /** Basic as percent of gross. */
  basicPctOfGross: number
  /** House rent as percent of basic. */
  houseRentPctOfBasic: number
  /** Medical allowance as percent of basic. */
  medicalPctOfBasic: number
  /** Fixed monthly conveyance in taka; null makes conveyance whatever gross has left. */
  conveyance: number | null
}

export interface SalaryDeduction {
  label: string
  /** 'pctOfBasic' (e.g. provident fund), 'pctOfGross', or a fixed taka 'amount' (tax at source, loan). */
  kind: 'pctOfBasic' | 'pctOfGross' | 'amount'
  value: number
}

export interface SalaryInput {
  /** Which amount was typed: the monthly gross (the screen) or the monthly basic. */
  from: 'gross' | 'basic'
  amount: number
  structure: SalaryStructure
  /** Taken from gross to give net; leave out for none. */
  deductions?: SalaryDeduction[]
}

export interface SalaryDeductionRow {
  label: string
  amount: number
}

export interface SalaryResult {
  gross: number
  basic: number
  houseRent: number
  medical: number
  conveyance: number
  /** What is left when conveyance is fixed and the parts do not use the whole gross. */
  otherAllowance: number
  deductions: SalaryDeductionRow[]
  totalDeductions: number
  net: number
}

/** 'structure' when the parts add up to more than the gross. */
export type SalaryError = 'amount' | 'basic' | 'houseRent' | 'medical' | 'conveyance' | 'structure' | 'deductions'

const KINDS: readonly SalaryDeduction['kind'][] = ['pctOfBasic', 'pctOfGross', 'amount']

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateSalary(input: SalaryInput): SalaryError | null {
  const s = input.structure
  if (!(input.amount > 0) || !(input.from === 'gross' || input.from === 'basic')) return 'amount'
  if (!(s.basicPctOfGross > 0 && s.basicPctOfGross <= 100)) return 'basic'
  if (!(s.houseRentPctOfBasic >= 0 && s.houseRentPctOfBasic <= 100)) return 'houseRent'
  if (!(s.medicalPctOfBasic >= 0 && s.medicalPctOfBasic <= 100)) return 'medical'
  if (s.conveyance !== null && !(s.conveyance >= 0)) return 'conveyance'
  if (!(input.deductions ?? []).every((d) => KINDS.includes(d.kind) && d.value >= 0)) return 'deductions'
  const r = calculateSalary(input)
  if (r.conveyance < 0 || r.otherAllowance < 0) return 'structure'
  if (r.net < 0) return 'deductions'
  return null
}

/** Splits gross into basic, house rent, medical and conveyance, then takes deductions. */
export function calculateSalary(input: SalaryInput): SalaryResult {
  const { from, amount, structure: s, deductions = [] } = input
  const gross = round(from === 'gross' ? amount : (amount * 100) / s.basicPctOfGross)
  const basic = round(from === 'basic' ? amount : (gross * s.basicPctOfGross) / 100)
  const houseRent = round((basic * s.houseRentPctOfBasic) / 100)
  const medical = round((basic * s.medicalPctOfBasic) / 100)
  // Parts are worked out from the rounded ones so the breakdown adds up to gross exactly.
  const left = round(gross - basic - houseRent - medical)
  const conveyance = s.conveyance ?? left
  const otherAllowance = s.conveyance === null ? 0 : round(left - s.conveyance)

  const rows = deductions.map((d) => ({
    label: d.label,
    amount: round(d.kind === 'amount' ? d.value : ((d.kind === 'pctOfBasic' ? basic : gross) * d.value) / 100),
  }))
  const totalDeductions = round(rows.reduce((sum, row) => sum + row.amount, 0))
  return {
    gross,
    basic,
    houseRent,
    medical,
    conveyance,
    otherAllowance,
    deductions: rows,
    totalDeductions,
    net: round(gross - totalDeductions),
  }
}
