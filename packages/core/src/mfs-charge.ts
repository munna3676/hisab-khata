import { round } from './lib/money.ts'

/**
 * Charges for bKash, Nagad, Rocket and the other mobile financial services:
 * cash out, send money, cash in, bill pay. Every rate, band, quota and limit
 * comes from data (each provider's published tariff and Bangladesh Bank's
 * MFS limits), shaped as MfsChannel below.
 */

export type MfsService = 'cashOut' | 'sendMoney' | 'cashIn' | 'billPay' | 'payment'

/** How the money moves: through any agent, a Priyo Agent, the app, *USSD#, an ATM, a bank branch, a Priyo number. */
export type MfsChannelKind = 'agent' | 'priyoAgent' | 'app' | 'ussd' | 'atm' | 'branch' | 'priyoNumber' | 'other'

/**
 * One amount band of a charge. A band covers amounts from `from` (inclusive)
 * up to the next band's `from`; the first band starts at 0. Within the band
 * the charge is amount × (per1000 / 1000 + pct / 100) + flat, kept between
 * min and max. Send money's "৳১০০ এর কম ফ্রি, ৳১০০ বা বেশিতে ৳৫" is two
 * bands: { from: 0 } and { from: 100, flat: 5 }.
 */
export interface MfsChargeBand {
  from: number
  /** Taka per 1,000, VAT included, e.g. 18.5. */
  per1000?: number
  /** Percent of the amount; adds to per1000 when both are given. */
  pct?: number
  /** Taka per transaction, added to the rate part. */
  flat?: number
  /** Least charge for one transaction in this band. */
  min?: number
  /** Most charge for one transaction in this band. */
  max?: number
}

/**
 * A monthly amount at the channel's own price (bKash Priyo Agent: ৳৫০,০০০ a
 * month at ১৩.৯৫/হাজার; Priyo numbers: ৳২৫,০০০ a month free). A transaction
 * that would take the month past it pays the `over` price on the whole
 * amount, the way the providers bill it.
 */
export interface MfsQuota {
  monthlyAmount: number
  over: MfsChargeBand[]
}

/** Per-transaction, daily and monthly limits (Bangladesh Bank's, or tighter ones a provider sets). */
export interface MfsLimits {
  minPerTxn?: number
  maxPerTxn?: number
  maxPerDay?: number
  maxPerMonth?: number
}

/** One way to move money, as listed in data. */
export interface MfsChannel {
  /** Stable id, e.g. "bkash-cashout-priyo-agent". */
  id: string
  /** e.g. "bkash", "nagad", "rocket". */
  provider: string
  service: MfsService
  channel: MfsChannelKind
  bands: MfsChargeBand[]
  quota?: MfsQuota
  limits?: MfsLimits
  /** Amounts must be a multiple of this (ATM notes); 1 when left out. */
  step?: number
}

/** What the person has already moved, for quotas and limits. Leave out what is not known. */
export interface MfsUsage {
  /** Taka already taken this month at the quota price (এই মাসে প্রিয় এজেন্ট থেকে আগে তুলেছ). */
  quotaUsed?: number
  /** Taka already moved today through this service, for the daily limit. */
  today?: number
  /** Taka already moved this month through this service, for the monthly limit. */
  thisMonth?: number
}

export type MfsLimitKind = 'minPerTxn' | 'maxPerTxn' | 'maxPerDay' | 'maxPerMonth'

export interface MfsLimitBreach {
  kind: MfsLimitKind
  /** The limit from data, e.g. 30,000 for "দিনে সর্বোচ্চ ৳৩০,০০০". */
  limit: number
  /** The amount that would be allowed now: the limit less what was already moved (0 when nothing is left); the minimum for minPerTxn. */
  allowed: number
}

export interface MfsQuotaStatus {
  monthlyAmount: number
  usedBefore: number
  /** What was left of the quota before this transaction. */
  leftBefore: number
  /** What is left after it; unchanged when this transaction went over and paid the full price. */
  leftAfter: number
  /** This transaction takes the month past the quota, so the `over` price applies (লিমিট পার). */
  exceeded: boolean
}

export interface MfsChargeInput {
  /** Taka to cash out, send or pay. */
  amount: number
  channel: MfsChannel
  usage?: MfsUsage
}

export interface MfsChargeResult {
  amount: number
  charge: number
  /** amount + charge: what the wallet must hold (ওয়ালেটে রাখতে হবে). */
  total: number
  /** Charge actually paid per 1,000 taka. */
  per1000: number
  /** The band the charge came from. */
  band: MfsChargeBand
  /** Null for a channel without a monthly quota. */
  quota: MfsQuotaStatus | null
  /** The first limit this amount breaks, or null. */
  limit: MfsLimitBreach | null
}

export type MfsChargeError = 'amount' | 'usage' | 'channel'

function isAmount(v: number | undefined): boolean {
  return v === undefined || (v >= 0 && Number.isFinite(v))
}

function isValidBands(bands: readonly MfsChargeBand[]): boolean {
  if (bands.length === 0 || bands[0]!.from !== 0) return false
  return bands.every((b, i) => {
    const numbers = [b.from, b.per1000, b.pct, b.flat, b.min, b.max]
    if (!numbers.every(isAmount)) return false
    if (b.min !== undefined && b.max !== undefined && b.min > b.max) return false
    return i === 0 || b.from > bands[i - 1]!.from
  })
}

/** True when a channel from data can be calculated. */
export function isValidMfsChannel(c: MfsChannel): boolean {
  if (!c.id || !c.provider || !isValidBands(c.bands)) return false
  if (c.quota && !(c.quota.monthlyAmount > 0 && isValidBands(c.quota.over))) return false
  if (c.step !== undefined && !(c.step > 0 && Number.isFinite(c.step))) return false
  const l = c.limits ?? {}
  return [l.minPerTxn, l.maxPerTxn, l.maxPerDay, l.maxPerMonth].every(isAmount)
}

function isValidUsage(u: MfsUsage | undefined): boolean {
  return u === undefined || [u.quotaUsed, u.today, u.thisMonth].every(isAmount)
}

/** At least one paisa once rounded, so the charge per 1,000 never divides by 0. */
function isTxnAmount(v: number): boolean {
  return Number.isFinite(v) && round(v) > 0
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateMfsCharge(input: MfsChargeInput): MfsChargeError | null {
  if (!isTxnAmount(input.amount)) return 'amount'
  if (!isValidUsage(input.usage)) return 'usage'
  if (!isValidMfsChannel(input.channel)) return 'channel'
  return null
}

/** The band an amount falls in. */
function bandFor(amount: number, bands: readonly MfsChargeBand[]): MfsChargeBand {
  let band = bands[0]!
  for (const b of bands) if (amount >= b.from) band = b
  return band
}

/** Charge for one amount under one price list, rounded to paisa. */
function bandCharge(amount: number, band: MfsChargeBand): number {
  const raw = amount * ((band.per1000 ?? 0) / 1000 + (band.pct ?? 0) / 100) + (band.flat ?? 0)
  const clamped = Math.min(Math.max(raw, band.min ?? 0), band.max ?? Infinity)
  return round(clamped)
}

/** Which price list applies and how the quota stands for `amount`. */
function priceFor(amount: number, channel: MfsChannel, usage: MfsUsage | undefined) {
  const q = channel.quota
  if (!q) return { bands: channel.bands, quota: null }
  const usedBefore = usage?.quotaUsed ?? 0
  const leftBefore = Math.max(0, q.monthlyAmount - usedBefore)
  const exceeded = amount > leftBefore
  const quota: MfsQuotaStatus = {
    monthlyAmount: q.monthlyAmount,
    usedBefore,
    leftBefore: round(leftBefore),
    leftAfter: round(exceeded ? leftBefore : leftBefore - amount),
    exceeded,
  }
  return { bands: exceeded ? q.over : channel.bands, quota }
}

/** The first limit `amount` breaks with this usage, or null when it is allowed. */
export function checkMfsLimits(amount: number, limits: MfsLimits | undefined, usage?: MfsUsage): MfsLimitBreach | null {
  if (!limits) return null
  const { minPerTxn, maxPerTxn, maxPerDay, maxPerMonth } = limits
  if (minPerTxn !== undefined && amount < minPerTxn) return { kind: 'minPerTxn', limit: minPerTxn, allowed: minPerTxn }
  if (maxPerTxn !== undefined && amount > maxPerTxn) return { kind: 'maxPerTxn', limit: maxPerTxn, allowed: maxPerTxn }
  const today = usage?.today ?? 0
  if (maxPerDay !== undefined && amount + today > maxPerDay) {
    return { kind: 'maxPerDay', limit: maxPerDay, allowed: Math.max(0, round(maxPerDay - today)) }
  }
  const month = usage?.thisMonth ?? 0
  if (maxPerMonth !== undefined && amount + month > maxPerMonth) {
    return { kind: 'maxPerMonth', limit: maxPerMonth, allowed: Math.max(0, round(maxPerMonth - month)) }
  }
  return null
}

/** Charge for one amount through one channel, with the quota and limit state the screen shows. */
export function calculateMfsCharge(input: MfsChargeInput): MfsChargeResult {
  const { channel, usage } = input
  const amount = round(input.amount)
  const price = priceFor(amount, channel, usage)
  const band = bandFor(amount, price.bands)
  const charge = bandCharge(amount, band)
  return {
    amount,
    charge,
    total: round(amount + charge),
    per1000: round((charge / amount) * 1000),
    band,
    quota: price.quota,
    limit: checkMfsLimits(amount, channel.limits, usage),
  }
}

// ---- "কত তোলা যাবে": the most that can be taken when the balance must cover amount + charge ----

export interface MfsMaxInput {
  /** Taka in the wallet now (ওয়ালেটে এখন কত টাকা আছে). */
  balance: number
  channel: MfsChannel
  usage?: MfsUsage
}

export interface MfsMaxResult {
  /** Most that can be taken (হাতে পাবে); 0 when not even the smallest amount fits. */
  amount: number
  charge: number
  total: number
  /** What stays in the wallet (ওয়ালেটে থাকবে). */
  leftover: number
  /** What stopped it from going higher: the balance or a limit. */
  limitedBy: 'balance' | MfsLimitKind
  quota: MfsQuotaStatus | null
}

export type MfsMaxError = 'balance' | 'usage' | 'channel'

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateMfsMax(input: MfsMaxInput): MfsMaxError | null {
  if (!(input.balance >= 0 && Number.isFinite(input.balance))) return 'balance'
  if (!isValidUsage(input.usage)) return 'usage'
  if (!isValidMfsChannel(input.channel)) return 'channel'
  return null
}

/**
 * Searches whole steps (৳১, or the ATM note size). The amount + charge curve
 * jumps at band edges and at the quota edge, so each stretch between two
 * edges, where it only rises, is searched on its own and the best is kept.
 */
export function calculateMfsMax(input: MfsMaxInput): MfsMaxResult {
  const { balance, channel, usage } = input
  const step = channel.step ?? 1
  const l = channel.limits ?? {}

  // The highest amount the limits allow, and which limit that is.
  const caps: { kind: 'balance' | MfsLimitKind; value: number }[] = [{ kind: 'balance', value: balance }]
  if (l.maxPerTxn !== undefined) caps.push({ kind: 'maxPerTxn', value: l.maxPerTxn })
  if (l.maxPerDay !== undefined) caps.push({ kind: 'maxPerDay', value: l.maxPerDay - (usage?.today ?? 0) })
  if (l.maxPerMonth !== undefined) caps.push({ kind: 'maxPerMonth', value: l.maxPerMonth - (usage?.thisMonth ?? 0) })
  const cap = caps.reduce((low, c) => (c.value < low.value ? c : low))
  // A small tolerance so 4,999.9999999 steps still count as 5,000.
  const maxK = Math.floor(cap.value / step + 1e-9)
  const minK = Math.max(1, Math.ceil((l.minPerTxn ?? 0) / step - 1e-9))

  const totalAt = (k: number) => calculateMfsCharge({ amount: k * step, channel, usage }).total
  const edges = new Set<number>([minK])
  for (const b of channel.bands) edges.add(Math.ceil(b.from / step - 1e-9))
  if (channel.quota) {
    const left = Math.max(0, channel.quota.monthlyAmount - (usage?.quotaUsed ?? 0))
    edges.add(Math.floor(left / step + 1e-9) + 1)
    for (const b of channel.quota.over) edges.add(Math.ceil(b.from / step - 1e-9))
  }
  const starts = [...edges].filter((k) => k >= minK && k <= maxK).sort((a, b) => a - b)

  let bestK = 0
  starts.forEach((lo, idx) => {
    const hi = idx + 1 < starts.length ? starts[idx + 1]! - 1 : maxK
    if (totalAt(lo) > balance) return
    // Largest k in [lo, hi] whose total fits; total only rises inside the stretch.
    let a = lo
    let b = hi
    while (a < b) {
      const mid = Math.ceil((a + b) / 2)
      if (totalAt(mid) <= balance) a = mid
      else b = mid - 1
    }
    bestK = Math.max(bestK, a)
  })

  // A limit is the reason only when the search reached its ceiling, or the
  // ceiling is below the smallest amount allowed.
  const limitedBy = bestK === Math.max(maxK, 0) || maxK < minK ? cap.kind : 'balance'
  if (bestK === 0) {
    return { amount: 0, charge: 0, total: 0, leftover: round(balance), limitedBy, quota: priceFor(0, channel, usage).quota }
  }
  const r = calculateMfsCharge({ amount: bestK * step, channel, usage })
  return { amount: r.amount, charge: r.charge, total: r.total, leftover: round(balance - r.total), limitedBy, quota: r.quota }
}

// ---- Comparing providers: "সব উপায়, সস্তা থেকে দামি" and "কোন উপায়ে কত তোলা যাবে" ----

export interface MfsCompareInput {
  amount: number
  /** The channels to compare, in the order data lists them (ties keep this order). */
  channels: MfsChannel[]
  /** Usage by channel id, e.g. { "bkash-cashout-priyo-agent": { quotaUsed: 45000 } }. */
  usage?: Readonly<Record<string, MfsUsage>>
  /** Channel to measure the saving against ("সাধারণ বিকাশ এজেন্টের চেয়ে ৳৪৭.৫০ কম"). */
  referenceId?: string
}

export interface MfsCompareRow extends MfsChargeResult {
  channel: MfsChannel
}

export interface MfsCompareResult {
  /** Cheapest first; rows over a limit go last. */
  rows: MfsCompareRow[]
  /** The cheapest row within its limits (সাশ্রয়ী), or null when every row is over a limit. */
  cheapest: MfsCompareRow | null
  /** Reference charge − cheapest charge; null without a usable reference. */
  savingVsReference: number | null
  /** Every channel refuses this amount: the screen's error state. */
  allOverLimit: boolean
  /** When all are over a limit, the largest amount any channel allows now (the "৳৩০,০০০ দিয়ে হিসাব করো" button). */
  maxAllowed: number | null
}

export type MfsCompareError = 'amount' | 'channels' | 'usage' | 'reference'

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateMfsCompare(input: MfsCompareInput): MfsCompareError | null {
  if (!isTxnAmount(input.amount)) return 'amount'
  if (input.channels.length === 0 || !input.channels.every(isValidMfsChannel)) return 'channels'
  if (input.usage && !Object.values(input.usage).every(isValidUsage)) return 'usage'
  if (input.referenceId !== undefined && !input.channels.some((c) => c.id === input.referenceId)) return 'reference'
  return null
}

/** Every channel's charge for the amount, cheapest first. */
export function calculateMfsCompare(input: MfsCompareInput): MfsCompareResult {
  const rows = input.channels.map(
    (channel): MfsCompareRow => ({
      channel,
      ...calculateMfsCharge({ amount: input.amount, channel, usage: input.usage?.[channel.id] }),
    }),
  )
  // Array.prototype.sort is stable, so equal charges keep the data's order.
  rows.sort((a, b) => Number(a.limit !== null) - Number(b.limit !== null) || a.charge - b.charge)

  const allowed = rows.filter((r) => r.limit === null)
  const cheapest = allowed[0] ?? null
  const reference = rows.find((r) => r.channel.id === input.referenceId)
  const savingVsReference =
    cheapest && reference && reference.limit === null ? round(reference.charge - cheapest.charge) : null
  const allOverLimit = allowed.length === 0
  const ceilings = rows.flatMap((r) => (r.limit && r.limit.kind !== 'minPerTxn' ? [r.limit.allowed] : []))
  return {
    rows,
    cheapest,
    savingVsReference,
    allOverLimit,
    maxAllowed: allOverLimit && ceilings.length > 0 ? Math.max(...ceilings) : null,
  }
}

export interface MfsCompareMaxInput {
  balance: number
  channels: MfsChannel[]
  usage?: Readonly<Record<string, MfsUsage>>
}

export interface MfsCompareMaxRow extends MfsMaxResult {
  channel: MfsChannel
}

export interface MfsCompareMaxResult {
  /** Most in hand first; a tie goes to the lower charge, then the data's order. */
  rows: MfsCompareMaxRow[]
  /** "সবচেয়ে বেশি তুলতে পারবে", or null when nothing can be taken anywhere. */
  best: MfsCompareMaxRow | null
}

export type MfsCompareMaxError = 'balance' | 'channels' | 'usage'

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateMfsCompareMax(input: MfsCompareMaxInput): MfsCompareMaxError | null {
  if (!(input.balance >= 0 && Number.isFinite(input.balance))) return 'balance'
  if (input.channels.length === 0 || !input.channels.every(isValidMfsChannel)) return 'channels'
  if (input.usage && !Object.values(input.usage).every(isValidUsage)) return 'usage'
  return null
}

/** The most each channel lets the person take from this balance, best first. */
export function calculateMfsCompareMax(input: MfsCompareMaxInput): MfsCompareMaxResult {
  const rows = input.channels.map(
    (channel): MfsCompareMaxRow => ({
      channel,
      ...calculateMfsMax({ balance: input.balance, channel, usage: input.usage?.[channel.id] }),
    }),
  )
  rows.sort((a, b) => b.amount - a.amount || a.charge - b.charge)
  return { rows, best: rows[0] && rows[0].amount > 0 ? rows[0] : null }
}
