import { describe, expect, it } from 'vitest'
import {
  calculateGuideFee,
  compareGuideFeeChoices,
  isValidGuideFeeTable,
  validateGuideFee,
  type GuideFeeInput,
  type GuideFeeItem,
  type GuideFeeTable,
} from '../src/guide-fee.ts'

// Test data shaped like the fee table in data/guides/<slug>.json. The G2–G5
// and 09 screens show no amounts ("পৃষ্ঠা, মেয়াদ ও ডেলিভারি অনুযায়ী"; the
// At a Glance box says fees must be filled from the official source), so the
// amounts below are fixtures, not verified facts.

// e-passport: base fee by pages × validity × delivery, 15% VAT on top. These
// are the Department of Immigration & Passports' published base fees (e.g.
// 48 pages, 5 years, regular ৳৩,৫০০ + 15% = ৳৪,০২৫); epassport.gov.bd was not
// reachable to re-check them.
const BASE: Record<string, [number, number, number]> = {
  '48-5': [3500, 5500, 7500],
  '48-10': [5000, 7000, 9000],
  '64-5': [5500, 7500, 10500],
  '64-10': [7000, 9000, 12000],
}
const DELIVERY = ['regular', 'express', 'super-express']
const PASSPORT: GuideFeeTable = {
  id: 'e-passport',
  options: [
    { id: 'pages', choices: [{ id: '48' }, { id: '64' }] },
    { id: 'validity', choices: [{ id: '5' }, { id: '10' }] },
    { id: 'delivery', choices: DELIVERY.map((id) => ({ id })) },
  ],
  items: Object.entries(BASE).flatMap(([key, amounts]) => {
    const [pages, validity] = key.split('-') as [string, string]
    return amounts.map(
      (amount, i): GuideFeeItem => ({
        id: `fee-${key}-${DELIVERY[i]}`,
        amount,
        when: { pages, validity, delivery: DELIVERY[i]! },
        vat: 'add',
      }),
    )
  }),
  vatPct: 15,
  payments: [
    { id: 'bank', label: 'ব্যাংকে জমা' },
    { id: 'online', label: 'অনলাইন (কার্ড/MFS)', pct: 1.5, min: 10 },
  ],
}
const passport = (pages: string, validity: string, delivery: string, paymentId?: string): GuideFeeInput => ({
  table: PASSPORT,
  choices: { pages, validity, delivery },
  ...(paymentId ? { paymentId } : {}),
})

// Birth registration correction: per corrected field, plus the late fee by age.
const BIRTH: GuideFeeTable = {
  id: 'birth-registration',
  options: [{ id: 'service', choices: [{ id: 'new' }, { id: 'correction' }] }],
  values: ['ageDays', 'corrections'],
  items: [
    { id: 'new-on-time', amount: 0, when: { service: 'new' }, ranges: [{ value: 'ageDays', to: 45 }] },
    { id: 'new-late', amount: 25, when: { service: 'new' }, ranges: [{ value: 'ageDays', from: 45, to: 1826 }] },
    { id: 'new-very-late', amount: 50, when: { service: 'new' }, ranges: [{ value: 'ageDays', from: 1826 }] },
    { id: 'correction', label: 'প্রতিটি তথ্য সংশোধন', amount: 100, when: { service: 'correction' }, per: 'corrections' },
  ],
}

// NID correction: the fee already holds 15% VAT.
const NID: GuideFeeTable = {
  id: 'nid-correction',
  options: [{ id: 'attempt', choices: [{ id: 'first' }, { id: 'second' }] }],
  items: [
    { id: 'first', amount: 230, when: { attempt: 'first' }, vat: 'included' },
    { id: 'second', amount: 345, when: { attempt: 'second' }, vat: 'included' },
  ],
  vatPct: 15,
  payments: [{ id: 'mfs', flat: 10 }],
}

// e-namjari: fixed lines with no choices.
const NAMJARI: GuideFeeTable = {
  id: 'namjari',
  items: [
    { id: 'court-fee', label: 'কোর্ট ফি', amount: 20 },
    { id: 'notice', label: 'নোটিশ জারি', amount: 50 },
    { id: 'record', label: 'রেকর্ড সংশোধন', amount: 1000 },
    { id: 'khatian', label: 'খতিয়ান', amount: 100 },
  ],
}

describe('guide-fee', () => {
  it('checked by hand: e-passport 48 pages, 5 years, regular = ৳৩,৫০০ + 15% VAT = ৳৪,০২৫', () => {
    const r = calculateGuideFee(passport('48', '5', 'regular'))
    expect(r).toMatchObject({ fee: 3500, vat: 525, governmentTotal: 4025, paymentCharge: 0, payment: null, total: 4025 })
    expect(r.lines).toEqual([{ id: 'fee-48-5-regular', quantity: 1, fee: 3500, vat: 525, total: 4025 }])
  })

  it('prices every pages × validity × delivery choice with VAT (the e-passport fee grid)', () => {
    const grid = ['48', '64'].flatMap((pages) =>
      ['5', '10'].map((validity) => DELIVERY.map((d) => calculateGuideFee(passport(pages, validity, d)).total)),
    )
    expect(grid).toEqual([
      [4025, 6325, 8625],
      [5750, 8050, 10350],
      [6325, 8625, 12075],
      [8050, 10350, 13800],
    ])
  })

  it('adds the online payment charge (percent with a minimum) on top of fee + VAT', () => {
    const r = calculateGuideFee(passport('64', '10', 'super-express', 'online'))
    // 13,800 × 1.5% = 207.
    expect(r).toMatchObject({ governmentTotal: 13800, paymentCharge: 207, total: 14007 })
    expect(r.payment?.id).toBe('online')
    expect(calculateGuideFee(passport('48', '5', 'regular', 'bank')).paymentCharge).toBe(0)
    const tiny: GuideFeeTable = { ...PASSPORT, items: [{ id: 'x', amount: 100 }], options: [] }
    expect(calculateGuideFee({ table: tiny, paymentId: 'online' }).paymentCharge).toBe(10)
  })

  it('compares the delivery speeds with the other choices fixed', () => {
    const rows = compareGuideFeeChoices(passport('48', '10', 'regular'), 'delivery')
    expect(rows.map((r) => [r.choice, r.result?.total])).toEqual([
      ['regular', 5750],
      ['express', 8050],
      ['super-express', 10350],
    ])
    expect(compareGuideFeeChoices(passport('48', '10', 'regular'), 'missing')).toEqual([])
  })

  it('splits a VAT-included fee into fee and VAT without adding more (NID correction ৳২৩০ = ২০০ + ৩০)', () => {
    const r = calculateGuideFee({ table: NID, choices: { attempt: 'first' }, paymentId: 'mfs' })
    expect(r).toMatchObject({ fee: 200, vat: 30, governmentTotal: 230, paymentCharge: 10, total: 240 })
    expect(calculateGuideFee({ table: NID, choices: { attempt: 'second' } })).toMatchObject({ fee: 300, vat: 45, total: 345 })
  })

  it('multiplies per-unit lines and picks the line by age range (birth registration)', () => {
    const correction = calculateGuideFee({ table: BIRTH, choices: { service: 'correction' }, values: { ageDays: 9000, corrections: 3 } })
    expect(correction.lines).toEqual([
      { id: 'correction', label: 'প্রতিটি তথ্য সংশোধন', quantity: 3, fee: 300, vat: 0, total: 300 },
    ])
    expect(correction.total).toBe(300)

    const fee = (ageDays: number) => calculateGuideFee({ table: BIRTH, choices: { service: 'new' }, values: { ageDays, corrections: 0 } })
    expect(fee(0).total).toBe(0)
    expect(fee(44).total).toBe(0)
    expect(fee(45).total).toBe(25)
    expect(fee(1825).total).toBe(25)
    expect(fee(1826).total).toBe(50)
  })

  it('adds up fixed lines (e-namjari ২০ + ৫০ + ১,০০০ + ১০০ = ৳১,১৭০)', () => {
    const r = calculateGuideFee({ table: NAMJARI })
    expect(r.lines.map((l) => l.total)).toEqual([20, 50, 1000, 100])
    expect(r).toMatchObject({ fee: 1170, vat: 0, total: 1170 })
  })

  it('handles zero units and very large amounts', () => {
    const none = calculateGuideFee({ table: BIRTH, choices: { service: 'correction' }, values: { ageDays: 10, corrections: 0 } })
    expect(none.total).toBe(0)
    const big = calculateGuideFee({ table: { id: 'big', items: [{ id: 'x', amount: 1e12, vat: 'add' }], vatPct: 15 } })
    expect(big.total).toBe(1.15e12)
  })

  it('rejects invalid tables and input', () => {
    expect(validateGuideFee(passport('48', '5', 'regular'))).toBeNull()
    expect(validateGuideFee(passport('50', '5', 'regular'))).toBe('choices')
    expect(validateGuideFee({ table: PASSPORT, choices: { pages: '48', validity: '5' } })).toBe('choices')
    expect(validateGuideFee(passport('48', '5', 'regular', 'cash'))).toBe('payment')
    expect(validateGuideFee({ table: BIRTH, choices: { service: 'correction' }, values: { ageDays: 10 } })).toBe('values')
    expect(validateGuideFee({ table: BIRTH, choices: { service: 'correction' }, values: { ageDays: 10, corrections: -1 } })).toBe('values')

    const noMatch: GuideFeeTable = { id: 't', options: [{ id: 'o', choices: [{ id: 'a' }, { id: 'b' }] }], items: [{ id: 'x', amount: 1, when: { o: 'a' } }] }
    expect(validateGuideFee({ table: noMatch, choices: { o: 'b' } })).toBe('nothing')

    expect(isValidGuideFeeTable(PASSPORT)).toBe(true)
    expect(isValidGuideFeeTable({ id: 't', items: [] })).toBe(false)
    expect(isValidGuideFeeTable({ id: 't', items: [{ id: 'x', amount: -1 }] })).toBe(false)
    expect(isValidGuideFeeTable({ id: 't', items: [{ id: 'x', amount: 1, when: { pages: '48' } }] })).toBe(false)
    expect(isValidGuideFeeTable({ id: 't', items: [{ id: 'x', amount: 1, per: 'copies' }] })).toBe(false)
    expect(isValidGuideFeeTable({ id: 't', items: [{ id: 'x', amount: 1 }], vatPct: 150 })).toBe(false)
    expect(isValidGuideFeeTable({ id: 't', items: [{ id: 'x', amount: 1 }], payments: [{ id: 'p', min: 10, max: 5 }] })).toBe(false)
    expect(validateGuideFee({ table: { id: 't', items: [] } })).toBe('table')
  })

  it('review: rejects data mistakes that would give NaN or silently drop VAT', () => {
    const ok = (items: GuideFeeItem[], extra: Partial<GuideFeeTable> = {}) => isValidGuideFeeTable({ id: 't', items, ...extra })
    // A line without an amount (JSON typo) used to pass and turn every total into NaN.
    expect(ok([{ id: 'x' } as unknown as GuideFeeItem])).toBe(false)
    expect(ok([{ id: 'x', amount: Number.NaN }])).toBe(false)
    expect(ok([{ id: 'x', amount: Number.POSITIVE_INFINITY }])).toBe(false)
    // An unknown VAT mode, or a VAT line in a table without a rate, would charge no VAT.
    expect(ok([{ id: 'x', amount: 100, vat: 'yes' as unknown as 'add' }], { vatPct: 15 })).toBe(false)
    expect(ok([{ id: 'x', amount: 100, vat: 'add' }])).toBe(false)
    expect(ok([{ id: 'x', amount: 100, vat: 'included' }])).toBe(false)
    expect(ok([{ id: 'x', amount: 100, vat: 'none' }])).toBe(true)
    expect(ok([{ id: 'x', amount: 100 }], { vatPct: Number.NaN })).toBe(false)
    // A range that can never match, and a choice listed twice.
    expect(ok([{ id: 'x', amount: 1, ranges: [{ value: 'age', from: 50, to: 10 }] }], { values: ['age'] })).toBe(false)
    expect(ok([{ id: 'x', amount: 1, ranges: [{ value: 'age', from: 10, to: 10 }] }], { values: ['age'] })).toBe(false)
    expect(ok([{ id: 'x', amount: 1 }], { options: [{ id: 'o', choices: [{ id: 'a' }, { id: 'a' }] }] })).toBe(false)
    expect(ok([{ id: 'x', amount: 1 }], { options: [{ id: 'o', choices: [] }] })).toBe(false)
  })

  it('review, checked by hand: a VAT-included ৳১০০ splits into ৮৬.৯৬ + ১৩.০৪ and still totals ১০০', () => {
    const r = calculateGuideFee({ table: { id: 't', items: [{ id: 'x', amount: 100, vat: 'included' }], vatPct: 15 } })
    // 100 / 1.15 = 86.956… → 86.96; VAT is the rest.
    expect(r).toMatchObject({ fee: 86.96, vat: 13.04, governmentTotal: 100, total: 100 })
    // 3 lines of ৳১০০ VAT-included: each rounds on its own, the sum still equals ৳৩০০.
    const three = calculateGuideFee({
      table: { id: 't', values: ['n'], items: [{ id: 'x', amount: 100, vat: 'included', per: 'n' }], vatPct: 15 },
      values: { n: 3 },
    })
    expect(three).toMatchObject({ fee: 260.87, vat: 39.13, total: 300 })
  })

  it('review: a payment charge capped by max, and no charge on a free service', () => {
    const table: GuideFeeTable = {
      id: 't',
      options: [{ id: 'o', choices: [{ id: 'free' }, { id: 'paid' }] }],
      items: [
        { id: 'free', amount: 0, when: { o: 'free' } },
        { id: 'paid', amount: 100000, when: { o: 'paid' } },
      ],
      payments: [{ id: 'card', pct: 2, min: 10, max: 500 }],
    }
    // 100,000 × 2% = 2,000, capped at 500.
    expect(calculateGuideFee({ table, choices: { o: 'paid' }, paymentId: 'card' })).toMatchObject({ paymentCharge: 500, total: 100500 })
    expect(calculateGuideFee({ table, choices: { o: 'free' }, paymentId: 'card' })).toMatchObject({ paymentCharge: 0, total: 0 })
  })
})
