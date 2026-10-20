import { round } from './lib/money.ts'

/**
 * Fee calculator for the government-task guides: e-passport (pages ×
 * validity × delivery), birth registration correction, driving licence,
 * namjari, NID correction. Every amount, VAT rate and payment charge comes
 * from the guide's fee table in data/guides/<slug>.json, shaped as
 * GuideFeeTable below, so one function serves every guide.
 */

/** A choice the person makes, e.g. pages: 48 or 64 (পৃষ্ঠা), delivery: regular/express/super-express. */
export interface GuideFeeOption {
  id: string
  label?: string
  choices: { id: string; label?: string }[]
}

/** A numeric range on an input value: from (inclusive) up to (exclusive). */
export interface GuideFeeRange {
  /** Input value id, e.g. "ageDays" for "জন্মের কত দিন পর নিবন্ধন". */
  value: string
  from?: number
  to?: number
}

/**
 * One line of the fee table. It applies when every `when` choice and every
 * range matches; all matching lines are added up.
 */
export interface GuideFeeItem {
  id: string
  label?: string
  /** Taka for one unit, before VAT when vat is "add". */
  amount: number
  /** Choices this line needs, e.g. { pages: "48", validity: "5", delivery: "regular" }. */
  when?: Readonly<Record<string, string>>
  ranges?: GuideFeeRange[]
  /** Multiply by this input value, e.g. "corrections" (প্রতিটি সংশোধনে) or "copies". */
  per?: string
  /**
   * "add": VAT at the table's rate goes on top. "included": the amount
   * already holds VAT; the VAT part is reported but not added. "none" (the
   * default): no VAT.
   */
  vat?: 'add' | 'included' | 'none'
}

/** How the fee is paid, with what the bank, gateway or wallet adds (অনলাইন/ব্যাংক চার্জ). */
export interface GuidePaymentMethod {
  id: string
  label?: string
  /** Percent of the government fee (VAT included). */
  pct?: number
  /** Taka per payment. */
  flat?: number
  min?: number
  max?: number
}

export interface GuideFeeTable {
  /** The guide, e.g. "e-passport". */
  id: string
  options?: GuideFeeOption[]
  /** Numeric inputs the lines use through `per` or `ranges`, e.g. ["corrections"]. */
  values?: string[]
  items: GuideFeeItem[]
  /** VAT in percent for lines with vat "add" or "included", e.g. 15. */
  vatPct?: number
  payments?: GuidePaymentMethod[]
}

export interface GuideFeeInput {
  table: GuideFeeTable
  /** Choice id by option id; every option needs one. */
  choices?: Readonly<Record<string, string>>
  /** Numeric inputs by id; every id in table.values needs one. */
  values?: Readonly<Record<string, number>>
  /** Payment method id; no payment charge when left out. */
  paymentId?: string
}

export interface GuideFeeLine {
  id: string
  label?: string
  quantity: number
  /** amount × quantity, VAT not included (for "included" lines: the part without VAT). */
  fee: number
  vat: number
  /** fee + vat. */
  total: number
}

export interface GuideFeeResult {
  lines: GuideFeeLine[]
  /** Sum of the lines without VAT. */
  fee: number
  vat: number
  /** What goes to the government: fee + VAT. */
  governmentTotal: number
  /** What the payment method adds; 0 without one. */
  paymentCharge: number
  payment: GuidePaymentMethod | null
  /** governmentTotal + paymentCharge: what the person pays. */
  total: number
}

export type GuideFeeError = 'table' | 'choices' | 'values' | 'payment' | 'nothing'

function isAmount(v: number | undefined): boolean {
  return v === undefined || (v >= 0 && Number.isFinite(v))
}

/** True when a fee table from data can be calculated. */
export function isValidGuideFeeTable(t: GuideFeeTable): boolean {
  if (!t.id || t.items.length === 0) return false
  if (!(t.vatPct === undefined || (Number.isFinite(t.vatPct) && t.vatPct >= 0 && t.vatPct <= 100))) return false
  const options = new Map((t.options ?? []).map((o) => [o.id, new Set(o.choices.map((c) => c.id))]))
  if (options.size !== (t.options ?? []).length) return false
  // Every option has choices, each id once, so a choice can never be picked twice.
  if ((t.options ?? []).some((o) => o.choices.length === 0 || options.get(o.id)!.size !== o.choices.length)) return false
  const values = new Set(t.values ?? [])
  const itemsOk = t.items.every(
    (item) =>
      !!item.id &&
      // Required: a line without an amount (a typo in data) would turn every total into NaN.
      typeof item.amount === 'number' &&
      isAmount(item.amount) &&
      // An unknown VAT mode would silently drop VAT; a VAT line needs the table's rate.
      (item.vat === undefined || item.vat === 'none' || ((item.vat === 'add' || item.vat === 'included') && t.vatPct !== undefined)) &&
      Object.entries(item.when ?? {}).every(([o, c]) => options.get(o)?.has(c)) &&
      (item.per === undefined || values.has(item.per)) &&
      (item.ranges ?? []).every(
        (r) => values.has(r.value) && isAmount(r.from) && isAmount(r.to) && !(r.from !== undefined && r.to !== undefined && r.from >= r.to),
      ),
  )
  const payments = t.payments ?? []
  const paymentsOk = payments.every(
    (p) => !!p.id && [p.pct, p.flat, p.min, p.max].every(isAmount) && !(p.min !== undefined && p.max !== undefined && p.min > p.max),
  )
  return itemsOk && paymentsOk && new Set(payments.map((p) => p.id)).size === payments.length
}

function applies(item: GuideFeeItem, input: GuideFeeInput): boolean {
  const choicesOk = Object.entries(item.when ?? {}).every(([o, c]) => input.choices?.[o] === c)
  const rangesOk = (item.ranges ?? []).every((r) => {
    const v = input.values?.[r.value] ?? 0
    return (r.from === undefined || v >= r.from) && (r.to === undefined || v < r.to)
  })
  return choicesOk && rangesOk
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateGuideFee(input: GuideFeeInput): GuideFeeError | null {
  const { table } = input
  if (!isValidGuideFeeTable(table)) return 'table'
  const choicesOk = (table.options ?? []).every((o) => o.choices.some((c) => c.id === input.choices?.[o.id]))
  if (!choicesOk) return 'choices'
  if (!(table.values ?? []).every((id) => isAmount(input.values?.[id]) && input.values?.[id] !== undefined)) return 'values'
  if (input.paymentId !== undefined && !(table.payments ?? []).some((p) => p.id === input.paymentId)) return 'payment'
  if (!table.items.some((item) => applies(item, input))) return 'nothing'
  return null
}

/** Adds up the matching fee lines, their VAT and the payment charge. */
export function calculateGuideFee(input: GuideFeeInput): GuideFeeResult {
  const { table } = input
  const rate = (table.vatPct ?? 0) / 100

  const lines = table.items
    .filter((item) => applies(item, input))
    .map((item): GuideFeeLine => {
      const quantity = item.per === undefined ? 1 : input.values?.[item.per] ?? 0
      const gross = item.amount * quantity
      const mode = item.vat ?? 'none'
      // An "included" amount is fee × (1 + rate); split it so fee + vat = the amount exactly.
      const total = round(mode === 'add' ? gross * (1 + rate) : gross)
      const fee = round(mode === 'included' ? gross / (1 + rate) : gross)
      const line: GuideFeeLine = { id: item.id, quantity, fee, vat: round(total - fee), total }
      if (item.label !== undefined) line.label = item.label
      return line
    })

  const fee = round(lines.reduce((s, l) => s + l.fee, 0))
  const governmentTotal = round(lines.reduce((s, l) => s + l.total, 0))
  const payment = (table.payments ?? []).find((p) => p.id === input.paymentId) ?? null
  let paymentCharge = 0
  if (payment && governmentTotal > 0) {
    const raw = (governmentTotal * (payment.pct ?? 0)) / 100 + (payment.flat ?? 0)
    paymentCharge = round(Math.min(Math.max(raw, payment.min ?? 0), payment.max ?? Infinity))
  }
  return {
    lines,
    fee,
    vat: round(governmentTotal - fee),
    governmentTotal,
    paymentCharge,
    payment,
    total: round(governmentTotal + paymentCharge),
  }
}

/** Every choice of one option priced with the others fixed, e.g. all three delivery speeds for 48 pages, 5 years. */
export function compareGuideFeeChoices(input: GuideFeeInput, optionId: string): { choice: string; result: GuideFeeResult | null }[] {
  const option = (input.table.options ?? []).find((o) => o.id === optionId)
  if (!option) return []
  return option.choices.map((c) => {
    const next: GuideFeeInput = { ...input, choices: { ...input.choices, [optionId]: c.id } }
    return { choice: c.id, result: validateGuideFee(next) === null ? calculateGuideFee(next) : null }
  })
}
