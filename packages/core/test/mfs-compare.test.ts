import { describe, expect, it } from 'vitest'
import type { MfsChannel, MfsLimits } from '../src/mfs-charge.ts'
import {
  calculateMfsRanking,
  calculateMfsTable,
  validateMfsRanking,
  validateMfsTable,
  type MfsTableRowSpec,
} from '../src/mfs-compare.ts'

// Test data shaped like data/mfs-charges.json, with the rates on the F4 screen
// ("চার্জ প্রতি ১,০০০ টাকায়").
const LIMITS: MfsLimits = { maxPerDay: 30000, maxPerMonth: 200000 }
const cashOut = (id: string, provider: string, channel: MfsChannel['channel'], per1000: number): MfsChannel => ({
  id,
  provider,
  service: 'cashOut',
  channel,
  bands: [{ from: 0, per1000 }],
  limits: LIMITS,
})
const SEND_BANDS = [{ from: 0 }, { from: 100, flat: 5 }]
const CHANNELS: MfsChannel[] = [
  {
    ...cashOut('bkash-priyo-agent', 'bkash', 'priyoAgent', 13.95),
    quota: { monthlyAmount: 50000, over: [{ from: 0, per1000: 18.5 }] },
  },
  cashOut('bkash-agent', 'bkash', 'agent', 18.5),
  cashOut('bkash-atm', 'bkash', 'atm', 14.9),
  cashOut('nagad-app', 'nagad', 'app', 12.99),
  cashOut('nagad-ussd', 'nagad', 'ussd', 15),
  cashOut('nagad-atm', 'nagad', 'atm', 7),
  cashOut('rocket-agent', 'rocket', 'agent', 16.7),
  cashOut('rocket-atm', 'rocket', 'atm', 9),
  cashOut('upay-agent', 'upay', 'agent', 14),
  {
    id: 'bkash-send-priyo',
    provider: 'bkash',
    service: 'sendMoney',
    channel: 'priyoNumber',
    bands: [{ from: 0 }],
    quota: { monthlyAmount: 25000, over: SEND_BANDS },
  },
  { id: 'bkash-send-app', provider: 'bkash', service: 'sendMoney', channel: 'app', bands: SEND_BANDS },
  { id: 'nagad-send-app', provider: 'nagad', service: 'sendMoney', channel: 'app', bands: [{ from: 0, flat: 5 }] },
  { id: 'rocket-send-app', provider: 'rocket', service: 'sendMoney', channel: 'app', bands: [{ from: 0 }] },
]

// The F4 table's rows, each naming the channel every provider uses for it.
const ROWS: MfsTableRowSpec[] = [
  { id: 'agent-low', channels: { bkash: 'bkash-priyo-agent', nagad: 'nagad-app', rocket: 'rocket-agent' } },
  { id: 'agent', channels: { bkash: 'bkash-agent', nagad: 'nagad-ussd', rocket: 'rocket-agent' } },
  { id: 'atm', channels: { bkash: 'bkash-atm', nagad: 'nagad-atm', rocket: 'rocket-atm' } },
  { id: 'send-app', channels: { bkash: 'bkash-send-app', nagad: 'nagad-send-app', rocket: 'rocket-send-app' } },
]
const PROVIDERS = ['bkash', 'nagad', 'rocket']

describe('mfs-compare', () => {
  it('matches the Figma table (F4) at ৳১,০০০: per-1,000 charges and the green cheapest cell per row', () => {
    const rows = calculateMfsTable({ amount: 1000, providers: PROVIDERS, rows: ROWS, channels: CHANNELS })
    const per1000 = rows.map((r) => r.cells.map((c) => c.result?.per1000))
    expect(per1000).toEqual([
      [13.95, 12.99, 16.7],
      [18.5, 15, 16.7],
      [14.9, 7, 9],
      [5, 5, 0],
    ])
    const green = rows.map((r) => r.cells.filter((c) => c.cheapest).map((c) => c.provider))
    // সবুজ: নগদ in the three cash-out rows (as on the screen); রকেট's free app send money.
    expect(green).toEqual([['nagad'], ['nagad'], ['nagad'], ['rocket']])
  })

  it('marks every tied cheapest cell and leaves a provider without a channel empty', () => {
    const rows = calculateMfsTable({
      amount: 1000,
      providers: [...PROVIDERS, 'upay'],
      rows: [
        { id: 'send-priyo', channels: { bkash: 'bkash-send-priyo', rocket: 'rocket-send-app' } },
      ],
      channels: CHANNELS,
    })
    expect(rows[0]!.cells.map((c) => [c.provider, c.result?.charge ?? null, c.cheapest])).toEqual([
      ['bkash', 0, true],
      ['nagad', null, false],
      ['rocket', 0, true],
      ['upay', null, false],
    ])
  })

  it('ranks every cash-out channel for the person\'s amount (৳৫,০০০), checked by hand', () => {
    const r = calculateMfsRanking({ amount: 5000, service: 'cashOut', channels: CHANNELS })
    // 5,000 × rate / 1,000: 35, 45, 64.95, 69.75, 70, 74.50, 75, 83.50, 92.50.
    expect(r.rows.map((row) => [row.channel.id, row.charge, row.rank])).toEqual([
      ['nagad-atm', 35, 1],
      ['rocket-atm', 45, 2],
      ['nagad-app', 64.95, 3],
      ['bkash-priyo-agent', 69.75, 4],
      ['upay-agent', 70, 5],
      ['bkash-atm', 74.5, 6],
      ['nagad-ussd', 75, 7],
      ['rocket-agent', 83.5, 8],
      ['bkash-agent', 92.5, 9],
    ])
    expect(r.cheapest?.channel.id).toBe('nagad-atm')
    expect(r.spread).toBe(57.5)
    expect(r.providers.map((p) => [p.provider, p.best.channel.id, p.rank, p.moreThanCheapest])).toEqual([
      ['nagad', 'nagad-atm', 1, 0],
      ['rocket', 'rocket-atm', 2, 10],
      ['bkash', 'bkash-priyo-agent', 3, 34.75],
      ['upay', 'upay-agent', 4, 35],
    ])
    expect(r.rows.find((row) => row.channel.id === 'bkash-priyo-agent')!.quota).toMatchObject({ leftAfter: 45000, exceeded: false })
  })

  it('limits the ranking to the chosen providers (বিকাশ vs নগদ vs রকেট)', () => {
    const r = calculateMfsRanking({ amount: 1000, service: 'cashOut', channels: CHANNELS, providers: PROVIDERS })
    expect(r.providers.map((p) => p.provider)).toEqual(['nagad', 'rocket', 'bkash'])
    expect(r.rows.some((row) => row.channel.provider === 'upay')).toBe(false)
  })

  it('shows the free quota left on Priyo numbers and the price once it runs out', () => {
    const free = calculateMfsRanking({ amount: 1000, service: 'sendMoney', channels: CHANNELS, usage: { 'bkash-send-priyo': { quotaUsed: 20000 } } })
    const priyo = free.rows.find((row) => row.channel.id === 'bkash-send-priyo')!
    expect(priyo).toMatchObject({ charge: 0, free: true, freeQuotaLeft: 4000 })
    expect(free.rows.filter((row) => row.free).map((row) => row.channel.id)).toEqual(['bkash-send-priyo', 'rocket-send-app'])
    expect(free.rows.find((row) => row.channel.id === 'rocket-send-app')!.freeQuotaLeft).toBeNull()

    const over = calculateMfsRanking({ amount: 6000, service: 'sendMoney', channels: CHANNELS, usage: { 'bkash-send-priyo': { quotaUsed: 20000 } } })
    expect(over.rows.find((row) => row.channel.id === 'bkash-send-priyo')).toMatchObject({ charge: 5, free: false, freeQuotaLeft: 5000 })
  })

  it('puts channels over a limit last and offers the most any channel allows', () => {
    const r = calculateMfsRanking({ amount: 40000, service: 'cashOut', channels: CHANNELS, providers: PROVIDERS })
    expect(r.allOverLimit).toBe(true)
    expect(r.cheapest).toBeNull()
    expect(r.spread).toBeNull()
    expect(r.maxAllowed).toBe(30000)
    expect(r.rows.every((row) => row.rank === null)).toBe(true)
    expect(r.providers.every((p) => p.rank === null && p.moreThanCheapest === null)).toBe(true)

    const partly = calculateMfsRanking({
      amount: 20000,
      service: 'cashOut',
      channels: CHANNELS,
      providers: ['bkash', 'nagad'],
      usage: { 'nagad-atm': { today: 15000 }, 'nagad-app': { today: 15000 }, 'nagad-ussd': { today: 15000 } },
    })
    expect(partly.providers.map((p) => [p.provider, p.rank])).toEqual([
      ['bkash', 1],
      ['nagad', null],
    ])
    expect(partly.rows.at(-1)!.limit).toMatchObject({ kind: 'maxPerDay', allowed: 15000 })
  })

  it('rejects invalid input', () => {
    const ok = { amount: 1000, service: 'cashOut' as const, channels: CHANNELS }
    expect(validateMfsRanking(ok)).toBeNull()
    expect(validateMfsRanking({ ...ok, amount: 0 })).toBe('amount')
    expect(validateMfsRanking({ ...ok, amount: Number.NaN })).toBe('amount')
    expect(validateMfsRanking({ ...ok, service: 'billPay' })).toBe('service')
    expect(validateMfsRanking({ ...ok, providers: ['dmoney'] })).toBe('service')
    expect(validateMfsRanking({ ...ok, channels: [{ ...CHANNELS[0]!, bands: [] }] })).toBe('channels')
    expect(validateMfsRanking({ ...ok, usage: { 'bkash-agent': { today: -1 } } })).toBe('usage')

    const table = { amount: 1000, providers: PROVIDERS, rows: ROWS, channels: CHANNELS }
    expect(validateMfsTable(table)).toBeNull()
    expect(validateMfsTable({ ...table, amount: -5 })).toBe('amount')
    expect(validateMfsTable({ ...table, providers: ['bkash', 'bkash'] })).toBe('providers')
    expect(validateMfsTable({ ...table, rows: [] })).toBe('rows')
    expect(validateMfsTable({ ...table, rows: [{ id: 'x', channels: { bkash: 'nagad-app' } }] })).toBe('rows')
    expect(validateMfsTable({ ...table, rows: [{ id: 'x', channels: { bkash: 'missing' } }] })).toBe('rows')
  })

  it('handles a very large amount without overflow', () => {
    const r = calculateMfsRanking({ amount: 1e9, service: 'cashOut', channels: [{ ...CHANNELS[5]!, limits: undefined }] })
    expect(r.rows[0]!.charge).toBe(7_000_000)
  })

  it('review: equal charges share a rank (1, 1, 3), for channels and for providers', () => {
    const r = calculateMfsRanking({
      amount: 1000,
      service: 'sendMoney',
      channels: CHANNELS,
      usage: { 'bkash-send-priyo': { quotaUsed: 20000 } },
    })
    expect(r.rows.map((row) => [row.channel.id, row.charge, row.rank])).toEqual([
      ['bkash-send-priyo', 0, 1],
      ['rocket-send-app', 0, 1],
      ['bkash-send-app', 5, 3],
      ['nagad-send-app', 5, 3],
    ])
    expect(r.providers.map((p) => [p.provider, p.rank, p.moreThanCheapest])).toEqual([
      ['bkash', 1, 0],
      ['rocket', 1, 0],
      ['nagad', 3, 5],
    ])
    expect(r.spread).toBe(5)
  })

  it('review, checked by hand: Priyo Agent past its ৳৫০,০০০ quota pays 18.50/হাজার on the whole amount', () => {
    const r = calculateMfsRanking({
      amount: 1000,
      service: 'cashOut',
      channels: CHANNELS,
      providers: ['bkash'],
      usage: { 'bkash-priyo-agent': { quotaUsed: 49500 } },
    })
    const priyo = r.rows.find((row) => row.channel.id === 'bkash-priyo-agent')!
    // 1,000 > 500 left, so 1,000 × 18.5 / 1,000 = 18.50; the quota is a paid one, so no free taka.
    expect(priyo).toMatchObject({ charge: 18.5, free: false, freeQuotaLeft: null })
    expect(priyo.quota).toMatchObject({ leftBefore: 500, exceeded: true })
    // bKash ATM (14.90) is now the cheapest bKash channel; the Priyo Agent ties with the agent.
    expect(r.rows.map((row) => [row.channel.id, row.rank])).toEqual([
      ['bkash-atm', 1],
      ['bkash-priyo-agent', 2],
      ['bkash-agent', 2],
    ])
  })

  it('review: rejects non-finite usage and an empty provider filter', () => {
    const ok = { amount: 1000, service: 'cashOut' as const, channels: CHANNELS }
    expect(validateMfsRanking({ ...ok, usage: { 'bkash-agent': { today: Number.NaN } } })).toBe('usage')
    expect(validateMfsRanking({ ...ok, usage: { 'bkash-agent': { thisMonth: Number.POSITIVE_INFINITY } } })).toBe('usage')
    expect(validateMfsRanking({ ...ok, providers: [] })).toBe('service')
    expect(validateMfsRanking({ ...ok, amount: 0.004 })).toBe('amount')
  })
})
