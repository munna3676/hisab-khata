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
    // 10,000 ÷ 300 = 33.33…; 100 meals each = 3,333.33 / 3,333.33 / 3,333.34
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
