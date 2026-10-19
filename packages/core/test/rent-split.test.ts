import { describe, expect, it } from 'vitest'
import { calculateRentSplit, validateRentSplit, type RentRoom } from '../src/rent-split.ts'

const figmaRooms: RentRoom[] = [
  { name: 'রুম ১ (বড়, বারান্দা সহ)', sizeSqft: 180 },
  { name: 'রুম ২', sizeSqft: 140 },
  { name: 'রুম ৩', sizeSqft: 120 },
]

describe('rent split', () => {
  it('matches the Figma example (E4, সমান ভাগ): ৳২৪,০০০ + বিল ৳৩,০০০, ৩ জন → প্রতিজন ৳৯,০০০', () => {
    const r = calculateRentSplit({ rent: 24000, utilities: 3000, mode: 'equal', people: 3 })
    expect(r.rows).toHaveLength(3)
    expect(r.rows[0]).toEqual({ name: null, people: 1, rent: 8000, utilities: 1000, total: 9000, perPerson: 9000 })
    expect(r.people).toBe(3)
  })
  it('matches the Figma example (রুম অনুযায়ী): ১৮০/১৪০/১২০ ফুট → ৳১০,৮১৮ / ৳৮,৬৩৬ / ৳৭,৫৪৫', () => {
    const r = calculateRentSplit({ rent: 24000, utilities: 3000, mode: 'size', rooms: figmaRooms })
    expect(r.rows.map((row) => Math.round(row.rent))).toEqual([9818, 7636, 6545])
    expect(r.rows.map((row) => Math.round(row.total))).toEqual([10818, 8636, 7545])
    expect(r.rows.map((row) => row.utilities)).toEqual([1000, 1000, 1000])
    expect(r.highest).toBe(0)
    expect(r.rows[0]!.name).toBe('রুম ১ (বড়, বারান্দা সহ)')
    // To the paisa the parts add back to the rent exactly.
    expect(r.rows.reduce((s, row) => s + row.rent, 0)).toBeCloseTo(24000, 6)
  })
  it('hand-checked (callout): big room 1.2× → 24,000 × 1.2 ÷ 3.2 = 9,000, others 7,500', () => {
    const r = calculateRentSplit({
      rent: 24000,
      utilities: 0,
      mode: 'weight',
      rooms: [
        { name: 'বড় রুম', weight: 1.2 },
        { name: 'রুম ২', weight: 1 },
        { name: 'রুম ৩', weight: 1 },
      ],
    })
    expect(r.rows.map((row) => row.rent)).toEqual([9000, 7500, 7500])
  })
  it('splits ৪টা রুম with one fixed room rent and two people in a room', () => {
    const r = calculateRentSplit({
      rent: 30000,
      utilities: 5000,
      mode: 'room-rent',
      rooms: [
        { name: 'মাস্টার বেড', rent: 10000, people: 2 },
        { name: 'রুম ২' },
        { name: 'রুম ৩' },
        { name: 'রুম ৪' },
      ],
    })
    // 20,000 left over three rooms: 6,666.67 / 6,666.67 / 6,666.66. Bills per person: 5 people → 1,000 each.
    expect(r.rows.map((row) => row.rent)).toEqual([10000, 6666.67, 6666.67, 6666.66])
    expect(r.rows.map((row) => row.utilities)).toEqual([2000, 1000, 1000, 1000])
    expect(r.rows[0]!.perPerson).toBe(6000)
    expect(r.people).toBe(5)
  })
  it('splits bills like the rent and in whole taka when asked', () => {
    const r = calculateRentSplit({ rent: 24000, utilities: 3000, mode: 'size', rooms: figmaRooms, utilitySplit: 'like-rent', wholeTaka: true })
    expect(r.rows.map((row) => row.rent)).toEqual([9818, 7636, 6546])
    expect(r.rows.reduce((s, row) => s + row.utilities, 0)).toBe(3000)
    expect(r.rows.map((row) => row.utilities)).toEqual([1227, 955, 818])
  })
  it('handles zero rent and one person', () => {
    expect(calculateRentSplit({ rent: 0, utilities: 0, mode: 'equal', people: 1 }).rows[0]!.total).toBe(0)
    // The leftover paisa go to the first rows, and the parts still add up.
    expect(calculateRentSplit({ rent: 10000, utilities: 10, mode: 'equal', people: 3 }).rows.map((r) => r.total)).toEqual([
      3336.68, 3336.66, 3336.66,
    ])
  })
  it('hand-checked by size: ৳20,000 over 150/120/120/110 sq ft (500) = 6,000 / 4,800 / 4,800 / 4,400', () => {
    const r = calculateRentSplit({
      rent: 20000,
      utilities: 2000,
      mode: 'size',
      rooms: [
        { name: 'রুম ১', sizeSqft: 150, people: 2 },
        { name: 'রুম ২', sizeSqft: 120 },
        { name: 'রুম ৩', sizeSqft: 120 },
        { name: 'রুম ৪', sizeSqft: 110 },
      ],
    })
    expect(r.rows.map((row) => row.rent)).toEqual([6000, 4800, 4800, 4400])
    // Bills ৳2,000 over 5 people = ৳400 each; room 1 has two.
    expect(r.rows.map((row) => row.utilities)).toEqual([800, 400, 400, 400])
    expect(r.rows[0]).toMatchObject({ total: 6800, perPerson: 3400 })
    expect(r).toMatchObject({ highest: 0, people: 5 })
  })
  it('hand-checked by weight: ৳14,000 at 1.5× / 1× / 1× = 6,000 / 4,000 / 4,000; bills like the rent 3:2:2', () => {
    const r = calculateRentSplit({
      rent: 14000,
      utilities: 700,
      mode: 'weight',
      utilitySplit: 'like-rent',
      rooms: [{ name: 'বড়', weight: 1.5 }, { name: 'মাঝারি', weight: 1 }, { name: 'ছোট', weight: 1 }],
    })
    expect(r.rows.map((row) => [row.rent, row.utilities, row.total])).toEqual([
      [6000, 300, 6300],
      [4000, 200, 4200],
      [4000, 200, 4200],
    ])
  })
  it('room-rent in whole taka: ৳25,000 − ৳9,000 fixed = 16,000 over 3 rooms → 5,334 / 5,333 / 5,333', () => {
    const r = calculateRentSplit({
      rent: 25000,
      utilities: 0,
      mode: 'room-rent',
      wholeTaka: true,
      rooms: [{ name: 'মাস্টার', rent: 9000 }, { name: 'রুম ২' }, { name: 'রুম ৩' }, { name: 'রুম ৪' }],
    })
    expect(r.rows.map((row) => row.rent)).toEqual([9000, 5334, 5333, 5333])
  })
  it('room-rent with paisa in the fixed rents still adds up to the rent', () => {
    const r = calculateRentSplit({ rent: 10000, utilities: 0, mode: 'room-rent', rooms: [{ name: 'ক', rent: 3333.33 }, { name: 'খ' }, { name: 'গ' }] })
    expect(r.rows.map((row) => row.rent)).toEqual([3333.33, 3333.34, 3333.33])
  })
  it('equal mode keeps the first row on a tie for highest', () => {
    expect(calculateRentSplit({ rent: 9000, utilities: 0, mode: 'equal', people: 3 }).highest).toBe(0)
    expect(calculateRentSplit({ rent: 1e8, utilities: 0, mode: 'equal', people: 7 }).rows.reduce((s, row) => s + row.rent * 100, 0)).toBe(1e10)
  })
  it('in whole taka, a bill with paisa cannot add up exactly, so it is rejected', () => {
    expect(validateRentSplit({ rent: 10000.5, utilities: 0, mode: 'equal', people: 2, wholeTaka: true })).toBe('rent')
    expect(validateRentSplit({ rent: 10000, utilities: 99.5, mode: 'equal', people: 2, wholeTaka: true })).toBe('utilities')
    const rooms: RentRoom[] = [{ name: 'ক', rent: 3333.5 }, { name: 'খ' }]
    expect(validateRentSplit({ rent: 10000, utilities: 0, mode: 'room-rent', rooms, wholeTaka: true })).toBe('roomRent')
    expect(validateRentSplit({ rent: 10000, utilities: 0, mode: 'room-rent', rooms })).toBeNull()
    expect(validateRentSplit({ rent: 10000, utilities: 0, mode: 'room-rent', rooms: [{ name: 'ক', rent: Number.NaN }, { name: 'খ' }] })).toBe('roomRent')
  })
  it('validates input', () => {
    const base = { rent: 100, utilities: 0 }
    const rooms = (...list: RentRoom[]) => list
    expect(validateRentSplit({ ...base, rent: -1, mode: 'equal', people: 2 })).toBe('rent')
    expect(validateRentSplit({ ...base, utilities: Number.NaN, mode: 'equal', people: 2 })).toBe('utilities')
    expect(validateRentSplit({ ...base, mode: 'equal', people: 0 })).toBe('people')
    expect(validateRentSplit({ ...base, mode: 'equal', people: 2.5 })).toBe('people')
    expect(validateRentSplit({ ...base, mode: 'size', rooms: [] })).toBe('rooms')
    expect(validateRentSplit({ ...base, mode: 'size', rooms: rooms({ name: 'x', sizeSqft: 0 }) })).toBe('size')
    expect(validateRentSplit({ ...base, mode: 'weight', rooms: rooms({ name: 'x' }) })).toBe('weight')
    expect(validateRentSplit({ ...base, mode: 'size', rooms: rooms({ name: 'x', sizeSqft: 90, people: 0 }) })).toBe('people')
    // Fixed rents above the total, or not adding up when every room has one.
    expect(validateRentSplit({ ...base, mode: 'room-rent', rooms: rooms({ name: 'x', rent: 150 }, { name: 'y' }) })).toBe(
      'roomRent',
    )
    expect(validateRentSplit({ ...base, mode: 'room-rent', rooms: rooms({ name: 'x', rent: 60 }, { name: 'y', rent: 30 }) })).toBe(
      'roomRent',
    )
    expect(validateRentSplit({ ...base, mode: 'room-rent', rooms: rooms({ name: 'x', rent: 70 }, { name: 'y', rent: 30 }) })).toBeNull()
    expect(validateRentSplit({ rent: 24000, utilities: 3000, mode: 'size', rooms: figmaRooms })).toBeNull()
  })
})
