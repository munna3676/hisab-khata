import { describe, expect, it } from 'vitest'
import { calculateMess, validateMess, type MessInput } from '../src/mess.ts'

const figma: MessInput = {
  bazarTotal: 13630,
  sharedCosts: [{ label: 'খালা / বুয়া বিল', amount: 2000 }],
  members: [
    { name: 'রাফি', meals: 62, deposit: 3176 },
    { name: 'তানভীর', meals: 55, deposit: 3370 },
    { name: 'সাকিব', meals: 58, deposit: 3304 },
    { name: 'নাঈম', meals: 60, deposit: 3780 },
  ],
}

describe('mess', () => {
  it('matches the Figma example (E3): ২৩৫ মিল, মিল রেট ৳৫৮, খালা বিল প্রতিজন ৳৫০০', () => {
    const r = calculateMess(figma)
    expect(r.totalMeals).toBe(235)
    expect(r.mealRate).toBe(58)
    expect(r.sharedPerHead).toBe(500)
    expect(r.members.map((m) => m.mealCost)).toEqual([3596, 3190, 3364, 3480])
    // দেবে ৳৪২০, পাবে ৳১৮০, দেবে ৳৬০, পাবে ৳৩০০
    expect(r.members.map((m) => m.mealBalance)).toEqual([-420, 180, -60, 300])
    // With the bua bill still unpaid, everyone owes ৳500 more.
    expect(r.members.map((m) => m.balance)).toEqual([-920, -320, -560, -200])
    expect(r.cashInHand).toBe(0)
  })
  it('adds a member from the sheet (E3-b): সাকিব, ৫৮ মিল, জমা ৩,০০০', () => {
    const r = calculateMess({ ...figma, members: [...figma.members, { name: 'সাকিব ২', meals: 58, deposit: 3000 }] })
    expect(r.totalMeals).toBe(293)
    expect(r.sharedPerHead).toBe(400)
    expect(r.members.at(-1)!.sharedCost).toBe(400)
  })
  it('hand-checked: an uneven rate still adds up to the bazar to the paisa', () => {
    // 10,000 ÷ 300 = 33.33…; 100 / 100.5 / 99.5 meals = 3,333.33 / 3,350 / 3,316.67 (adds to 10,000)
    const r = calculateMess({
      bazarTotal: 10000,
      sharedCosts: [{ label: 'ভাড়া', amount: 1000 }],
      members: [
        { name: 'ক', meals: 100, deposit: 4000, sharedPaid: 400 },
        { name: 'খ', meals: 100.5, deposit: 3000 },
        { name: 'গ', meals: 99.5, deposit: 3000 },
      ],
    })
    expect(r.mealRate).toBe(33.33)
    expect(r.members.reduce((s, m) => s + m.mealCost, 0)).toBeCloseTo(10000, 6)
    expect(r.members.map((m) => m.sharedCost)).toEqual([333.34, 333.33, 333.33])
    expect(r.members[0]!.balance).toBe(733.33)
    expect(r.members[0]!.sharedBalance).toBe(66.66)
  })
  it('hand-checked: ৳9,000 bazar over 100 meals = ৳90; rent split equally, gas by meals, one member paid the rent', () => {
    const r = calculateMess({
      bazarTotal: 9000,
      sharedCosts: [
        { label: 'ভাড়া', amount: 6000 },
        { label: 'গ্যাস', amount: 1000, split: 'meals' },
      ],
      members: [
        { name: 'ক', meals: 40, deposit: 3000, sharedPaid: 6000 },
        { name: 'খ', meals: 35, deposit: 2500 },
        { name: 'গ', meals: 25, deposit: 3500 },
      ],
    })
    expect(r.mealRate).toBe(90)
    // 40 × 90, 35 × 90, 25 × 90
    expect(r.members.map((m) => m.mealCost)).toEqual([3600, 3150, 2250])
    expect(r.members.map((m) => m.mealBalance)).toEqual([-600, -650, 1250])
    // 2,000 rent each + gas 400 / 350 / 250
    expect(r.members.map((m) => m.sharedCost)).toEqual([2400, 2350, 2250])
    expect(r.members.map((m) => m.sharedBalance)).toEqual([3600, -2350, -2250])
    expect(r.members.map((m) => m.balance)).toEqual([3000, -3000, -1000])
    expect(r).toMatchObject({ sharedTotal: 7000, sharedPerHead: 2000, totalDeposit: 9000, cashInHand: 0 })
  })
  it('spreads the leftover paisa of several equal bills over different members', () => {
    // ৳100 + ৳100 over 3: 200 ÷ 3 = 66.67 / 66.67 / 66.66, not 66.68 / 66.66 / 66.66
    const r = calculateMess({
      bazarTotal: 0,
      sharedCosts: [
        { label: 'বুয়া', amount: 100 },
        { label: 'ইন্টারনেট', amount: 100 },
      ],
      members: ['ক', 'খ', 'গ'].map((name) => ({ name, meals: 0, deposit: 0 })),
    })
    expect(r.members.map((m) => m.sharedCost)).toEqual([66.67, 66.67, 66.66])
    expect(r.sharedPerHead).toBe(66.67)
  })
  it('a member with no meals pays no bazar but still shares the equal bills', () => {
    const r = calculateMess({ ...figma, members: [...figma.members, { name: 'অতিথি', meals: 0, deposit: 0 }] })
    expect(r.mealRate).toBe(58)
    expect(r.members.at(-1)).toMatchObject({ mealCost: 0, sharedCost: 400, balance: -400 })
  })
  it('settles to the paisa: everyone\'s balance adds up to what was paid less what was spent', () => {
    const r = calculateMess({
      bazarTotal: 12345.67,
      sharedCosts: [{ label: 'বুয়া', amount: 2000 }, { label: 'গ্যাস', amount: 1111.11, split: 'meals' }],
      members: [
        { name: 'ক', meals: 61.5, deposit: 4000 },
        { name: 'খ', meals: 47, deposit: 3000, sharedPaid: 1000 },
        { name: 'গ', meals: 58.5, deposit: 5000 },
      ],
    })
    const sum = (xs: number[]) => Math.round(xs.reduce((s, x) => s + x * 100, 0))
    expect(sum(r.members.map((m) => m.mealCost))).toBe(1234567)
    expect(sum(r.members.map((m) => m.sharedCost))).toBe(311111)
    // (12,000 + 1,000) − (12,345.67 + 3,111.11) = −2,456.78
    expect(sum(r.members.map((m) => m.balance))).toBe(-245678)
  })
  it('splits a by-meal cost by meals', () => {
    const r = calculateMess({
      bazarTotal: 0,
      sharedCosts: [{ label: 'গ্যাস', amount: 900, split: 'meals' }],
      members: [
        { name: 'ক', meals: 20, deposit: 0 },
        { name: 'খ', meals: 10, deposit: 0 },
      ],
    })
    expect(r.members.map((m) => m.sharedCost)).toEqual([600, 300])
    expect(r.sharedPerHead).toBe(0)
    expect(r.mealRate).toBe(0)
  })
  it('rejects infinity and NaN', () => {
    expect(validateMess({ ...figma, members: [{ name: 'x', meals: Number.POSITIVE_INFINITY, deposit: 0 }] })).toBe('meals')
    expect(validateMess({ ...figma, bazarTotal: Number.NaN })).toBe('bazar')
    expect(validateMess({ ...figma, members: [{ name: 'x', meals: 3, deposit: 0, sharedPaid: -1 }] })).toBe('deposit')
    expect(validateMess({ bazarTotal: 0, sharedCosts: [{ label: 'গ্যাস', amount: 500, split: 'meals' }], members: [{ name: 'x', meals: 0, deposit: 0 }] })).toBe('meals')
  })
  it('validates input', () => {
    expect(validateMess({ ...figma, members: [] })).toBe('members')
    expect(validateMess({ ...figma, bazarTotal: -1 })).toBe('bazar')
    expect(validateMess({ ...figma, sharedCosts: [{ label: 'x', amount: -5 }] })).toBe('shared')
    expect(validateMess({ ...figma, members: [{ name: 'x', meals: -1, deposit: 0 }] })).toBe('meals')
    expect(validateMess({ ...figma, members: [{ name: 'x', meals: 0, deposit: 0 }] })).toBe('meals')
    expect(validateMess({ ...figma, members: [{ name: 'x', meals: 3, deposit: Number.NaN }] })).toBe('deposit')
    expect(validateMess({ bazarTotal: 0, sharedCosts: [], members: [{ name: 'x', meals: 0, deposit: 0 }] })).toBeNull()
    expect(validateMess(figma)).toBeNull()
  })
})
