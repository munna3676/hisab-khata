import { describe, expect, it } from 'vitest'
import {
  calculateMfsCharge,
  calculateMfsCompare,
  calculateMfsCompareMax,
  calculateMfsMax,
  checkMfsLimits,
  isValidMfsChannel,
  validateMfsCharge,
  validateMfsCompare,
  validateMfsCompareMax,
  validateMfsMax,
  type MfsChannel,
  type MfsLimits,
} from '../src/mfs-charge.ts'

// Test data shaped like data/mfs-charges.json, with the rates the Figma screens use.
const LIMITS: MfsLimits = { maxPerDay: 30000, maxPerMonth: 200000 }
const cashOut = (id: string, provider: string, channel: MfsChannel['channel'], per1000: number): MfsChannel => ({
  id,
  provider,
  service: 'cashOut',
  channel,
  bands: [{ from: 0, per1000 }],
  limits: LIMITS,
})
const CASH_OUT: MfsChannel[] = [
  cashOut('rocket-atm', 'rocket', 'atm', 9),
  cashOut('nagad-app', 'nagad', 'app', 12.99),
  {
    ...cashOut('bkash-priyo-agent', 'bkash', 'priyoAgent', 13.95),
    quota: { monthlyAmount: 50000, over: [{ from: 0, per1000: 18.5 }] },
  },
  cashOut('bkash-atm', 'bkash', 'atm', 14.9),
  cashOut('nagad-ussd', 'nagad', 'ussd', 15),
  cashOut('rocket-agent', 'rocket', 'agent', 16.7),
  cashOut('bkash-agent', 'bkash', 'agent', 18.5),
]
const byId = (id: string) => CASH_OUT.find((c) => c.id === id)!

const SEND_BANDS = [{ from: 0 }, { from: 100, flat: 5 }]
const SEND_PRIYO: MfsChannel = {
  id: 'bkash-send-priyo',
  provider: 'bkash',
  service: 'sendMoney',
  channel: 'priyoNumber',
  bands: [{ from: 0 }],
  quota: { monthlyAmount: 25000, over: SEND_BANDS },
}
const SEND_OTHER: MfsChannel = { ...SEND_PRIYO, id: 'bkash-send-app', channel: 'app', bands: SEND_BANDS, quota: undefined }

describe('mfs-charge', () => {
  it('matches the Figma example (03 Cash Out): ৳৫,০০০, cheapest first, ৳৪৭.৫০ less than a bKash agent', () => {
    const r = calculateMfsCompare({ amount: 5000, channels: CASH_OUT, referenceId: 'bkash-agent' })
    expect(r.rows.map((row) => [row.channel.id, row.charge])).toEqual([
      ['rocket-atm', 45],
      ['nagad-app', 64.95],
      ['bkash-priyo-agent', 69.75],
      ['bkash-atm', 74.5],
      ['nagad-ussd', 75],
      ['rocket-agent', 83.5],
      ['bkash-agent', 92.5],
    ])
    expect(r.cheapest).toMatchObject({ charge: 45, total: 5045 })
    expect(r.savingVsReference).toBe(47.5)
    expect(r.allOverLimit).toBe(false)
  })
  it('matches the Figma example (C1-c): ৳১০,০০০ after ৳৪৫,০০০ at a Priyo Agent pays 18.50 on all of it', () => {
    const r = calculateMfsCompare({
      amount: 10000,
      channels: CASH_OUT,
      usage: { 'bkash-priyo-agent': { quotaUsed: 45000 } },
    })
    expect(r.rows.map((row) => [row.channel.id, row.charge])).toEqual([
      ['rocket-atm', 90],
      ['nagad-app', 129.9],
      ['bkash-atm', 149],
      ['nagad-ussd', 150],
      ['rocket-agent', 167],
      ['bkash-priyo-agent', 185],
      ['bkash-agent', 185],
    ])
    expect(r.rows[5]!.quota).toEqual({ monthlyAmount: 50000, usedBefore: 45000, leftBefore: 5000, leftAfter: 5000, exceeded: true })
    expect(r.cheapest!.total).toBe(10090)
  })
  it('matches the Figma example (C1-b, কত তোলা যাবে): ৳৫,০০০ balance', () => {
    const r = calculateMfsCompareMax({ balance: 5000, channels: CASH_OUT })
    expect(r.rows.map((row) => [row.channel.id, row.amount, row.charge])).toEqual([
      ['rocket-atm', 4955, 44.6],
      ['nagad-app', 4935, 64.11],
      ['bkash-priyo-agent', 4931, 68.79],
      ['bkash-atm', 4926, 73.4],
      ['nagad-ussd', 4926, 73.89],
      ['rocket-agent', 4917, 82.11],
      ['bkash-agent', 4909, 90.82],
    ])
    expect(r.best).toMatchObject({ amount: 4955, charge: 44.6, leftover: 0.4, limitedBy: 'balance' })
  })
  it('matches the Figma example (C1-d): ৳৪০,০০০ is over the ৳৩০,০০০ daily cash-out limit everywhere', () => {
    const r = calculateMfsCompare({ amount: 40000, channels: CASH_OUT })
    expect(r.allOverLimit).toBe(true)
    expect(r.cheapest).toBeNull()
    expect(r.maxAllowed).toBe(30000)
    expect(r.rows[0]!.limit).toEqual({ kind: 'maxPerDay', limit: 30000, allowed: 30000 })
  })
  it('matches the Figma example (F5 send money): ৳৩,০০০ to a Priyo number after ৳১০,০০০ is free, ৳১২,০০০ left', () => {
    const r = calculateMfsCharge({ amount: 3000, channel: SEND_PRIYO, usage: { quotaUsed: 10000 } })
    expect(r.charge).toBe(0)
    expect(r.quota).toEqual({ monthlyAmount: 25000, usedBefore: 10000, leftBefore: 15000, leftAfter: 12000, exceeded: false })
  })
  it('send money to other numbers: free below ৳১০০, ৳৫ from ৳১০০ (published band rule)', () => {
    expect(calculateMfsCharge({ amount: 99, channel: SEND_OTHER }).charge).toBe(0)
    expect(calculateMfsCharge({ amount: 100, channel: SEND_OTHER }).charge).toBe(5)
    expect(calculateMfsCharge({ amount: 25000, channel: SEND_OTHER }).per1000).toBe(0.2)
    // Past the Priyo quota the normal band applies to the whole transaction.
    expect(calculateMfsCharge({ amount: 3000, channel: SEND_PRIYO, usage: { quotaUsed: 24000 } }).charge).toBe(5)
  })
  it('hand-checked: 1.85% with a ৳২৫ minimum (percent form)', () => {
    const atm: MfsChannel = { ...byId('bkash-atm'), bands: [{ from: 0, pct: 2, min: 25 }] }
    expect(calculateMfsCharge({ amount: 1000, channel: atm }).charge).toBe(25)
    expect(calculateMfsCharge({ amount: 5000, channel: atm }).charge).toBe(100)
    expect(calculateMfsMax({ balance: 1000, channel: atm })).toMatchObject({ amount: 975, charge: 25, leftover: 0 })
  })
  it('কত তোলা যাবে stops at the daily limit and says so', () => {
    const r = calculateMfsMax({ balance: 50000, channel: byId('rocket-atm') })
    expect(r).toMatchObject({ amount: 30000, charge: 270, leftover: 19730, limitedBy: 'maxPerDay' })
    const later = calculateMfsMax({ balance: 50000, channel: byId('rocket-atm'), usage: { today: 25000 } })
    expect(later).toMatchObject({ amount: 5000, limitedBy: 'maxPerDay' })
    // What is left of the day is below the smallest cash out: nothing, and the day's limit is why.
    const withMin = { ...byId('rocket-atm'), limits: { ...LIMITS, minPerTxn: 50 } }
    const spent = calculateMfsMax({ balance: 50000, channel: withMin, usage: { today: 29980 } })
    expect(spent).toMatchObject({ amount: 0, charge: 0, leftover: 50000, limitedBy: 'maxPerDay' })
  })
  it('কত তোলা যাবে can go past the Priyo quota when that gives more in hand', () => {
    const r = calculateMfsMax({ balance: 20000, channel: byId('bkash-priyo-agent'), usage: { quotaUsed: 45000 } })
    expect(r).toMatchObject({ amount: 19636, charge: 363.27, limitedBy: 'balance' })
    expect(r.quota!.exceeded).toBe(true)
  })
  it('কত তোলা যাবে handles the free band edge, ATM note steps, zero and huge balances', () => {
    expect(calculateMfsMax({ balance: 104, channel: SEND_OTHER }).amount).toBe(99)
    expect(calculateMfsMax({ balance: 105, channel: SEND_OTHER }).amount).toBe(100)
    const notes = { ...byId('rocket-atm'), step: 500 }
    expect(calculateMfsMax({ balance: 5000, channel: notes }).amount).toBe(4500)
    expect(calculateMfsMax({ balance: 0, channel: byId('nagad-app') })).toMatchObject({ amount: 0, leftover: 0 })
    const noLimits = { ...byId('bkash-agent'), limits: undefined }
    const big = calculateMfsMax({ balance: 1e9, channel: noLimits })
    expect(big.total).toBeLessThanOrEqual(1e9)
    expect(calculateMfsCharge({ amount: big.amount + 1, channel: noLimits }).total).toBeGreaterThan(1e9)
  })
  it('checks per-transaction, daily and monthly limits', () => {
    const limits: MfsLimits = { minPerTxn: 50, maxPerTxn: 25000, maxPerDay: 30000, maxPerMonth: 200000 }
    expect(checkMfsLimits(20, limits)).toEqual({ kind: 'minPerTxn', limit: 50, allowed: 50 })
    expect(checkMfsLimits(26000, limits)).toEqual({ kind: 'maxPerTxn', limit: 25000, allowed: 25000 })
    expect(checkMfsLimits(10000, limits, { today: 25000 })).toEqual({ kind: 'maxPerDay', limit: 30000, allowed: 5000 })
    expect(checkMfsLimits(10000, limits, { thisMonth: 195000 })).toEqual({ kind: 'maxPerMonth', limit: 200000, allowed: 5000 })
    expect(checkMfsLimits(10000, limits)).toBeNull()
    expect(checkMfsLimits(1e9, undefined)).toBeNull()
  })
  it('hand-checked: bKash agent cash out at ৳১৮.৫০ per thousand (bKash tariff page rate)', () => {
    // 2,500 × 18.50 ÷ 1,000 = 46.25
    expect(calculateMfsCharge({ amount: 2500, channel: byId('bkash-agent') })).toMatchObject({
      charge: 46.25,
      total: 2546.25,
      per1000: 18.5,
    })
    // 1,000 + 18.50 = 1,018.50 exactly; 1,001 would need 1,001 + 18.52 = 1,019.52.
    expect(calculateMfsMax({ balance: 1018.5, channel: byId('bkash-agent') })).toMatchObject({
      amount: 1000,
      charge: 18.5,
      leftover: 0,
      limitedBy: 'balance',
    })
  })
  it('hand-checked: a percent band with a minimum, then a cheaper band with a cap', () => {
    const bill: MfsChannel = {
      id: 'bill',
      provider: 'x',
      service: 'billPay',
      channel: 'app',
      bands: [{ from: 0, pct: 1, min: 5 }, { from: 5000, pct: 0.5, max: 50 }],
    }
    const charge = (amount: number) => calculateMfsCharge({ amount, channel: bill }).charge
    expect(charge(300)).toBe(5) // 1% = 3, raised to the ৳৫ minimum
    expect(charge(4999)).toBe(49.99)
    expect(charge(5000)).toBe(25) // 0.5%
    expect(charge(20000)).toBe(50) // 0.5% = 100, capped at ৳৫০
    // Balance 5,030: the first band allows 4,980 (+49.80), but 5,004 (+25.02) in the cheaper band fits too.
    expect(calculateMfsMax({ balance: 5030, channel: bill })).toMatchObject({ amount: 5004, charge: 25.02, leftover: 0.98 })
  })
  it('the Priyo quota is not passed by an amount equal to what is left', () => {
    const priyo = byId('bkash-priyo-agent')
    const at = calculateMfsCharge({ amount: 5000, channel: priyo, usage: { quotaUsed: 45000 } })
    expect(at).toMatchObject({ charge: 69.75 })
    expect(at.quota).toMatchObject({ leftBefore: 5000, leftAfter: 0, exceeded: false })
    // One taka more pays 18.50 on all of it: 5,001 × 0.0185 = 92.5185 → 92.52.
    expect(calculateMfsCharge({ amount: 5001, channel: priyo, usage: { quotaUsed: 45000 } }).charge).toBe(92.52)
    // Already past the quota: nothing left, always the full rate.
    const past = calculateMfsCharge({ amount: 100, channel: priyo, usage: { quotaUsed: 60000 } })
    expect(past.quota).toMatchObject({ leftBefore: 0, exceeded: true })
    expect(past.charge).toBe(1.85)
  })
  it('কত তোলা যাবে names the per-transaction limit when it is the lowest', () => {
    const c = { ...byId('rocket-atm'), limits: { maxPerTxn: 25000, maxPerDay: 30000 } }
    expect(calculateMfsMax({ balance: 50000, channel: c })).toMatchObject({ amount: 25000, limitedBy: 'maxPerTxn' })
  })
  it('gives no saving when the reference channel is itself over a limit', () => {
    const channels = [byId('rocket-atm'), { ...byId('bkash-agent'), limits: { maxPerTxn: 1000 } }]
    const r = calculateMfsCompare({ amount: 5000, channels, referenceId: 'bkash-agent' })
    expect(r.rows.map((row) => row.channel.id)).toEqual(['rocket-atm', 'bkash-agent'])
    expect(r.savingVsReference).toBeNull()
    expect(r.allOverLimit).toBe(false)
    expect(r.maxAllowed).toBeNull()
  })
  it('validates input and channel data', () => {
    const c = byId('nagad-app')
    // Below half a paisa the amount rounds to 0, which has no charge per thousand.
    expect(validateMfsCharge({ amount: 0.004, channel: c })).toBe('amount')
    expect(validateMfsCharge({ amount: 0.005, channel: c })).toBeNull()
    expect(validateMfsCompare({ amount: 0.001, channels: CASH_OUT })).toBe('amount')
    expect(validateMfsCharge({ amount: Number.POSITIVE_INFINITY, channel: c })).toBe('amount')
    expect(validateMfsCharge({ amount: 0, channel: c })).toBe('amount')
    expect(validateMfsCharge({ amount: 100, channel: c, usage: { today: -1 } })).toBe('usage')
    expect(validateMfsCharge({ amount: 100, channel: { ...c, bands: [] } })).toBe('channel')
    expect(validateMfsCharge({ amount: 100, channel: c })).toBeNull()
    expect(isValidMfsChannel({ ...c, bands: [{ from: 10, per1000: 5 }] })).toBe(false)
    expect(isValidMfsChannel({ ...c, bands: [{ from: 0 }, { from: 0, flat: 5 }] })).toBe(false)
    expect(isValidMfsChannel({ ...c, bands: [{ from: 0, min: 10, max: 5 }] })).toBe(false)
    expect(isValidMfsChannel({ ...c, step: 0 })).toBe(false)
    expect(validateMfsMax({ balance: -5, channel: c })).toBe('balance')
    expect(validateMfsMax({ balance: 500, channel: c })).toBeNull()
    expect(validateMfsCompare({ amount: 100, channels: [] })).toBe('channels')
    expect(validateMfsCompare({ amount: 100, channels: CASH_OUT, referenceId: 'nope' })).toBe('reference')
    expect(validateMfsCompare({ amount: 100, channels: CASH_OUT, referenceId: 'bkash-agent' })).toBeNull()
    expect(validateMfsCompareMax({ balance: Number.NaN, channels: CASH_OUT })).toBe('balance')
    expect(validateMfsCompareMax({ balance: 10, channels: CASH_OUT, usage: { x: { quotaUsed: -1 } } })).toBe('usage')
  })
})
