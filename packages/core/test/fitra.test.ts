import { describe, expect, it } from 'vitest'
import { calculateFitra, validateFitra, type FitraRates } from '../src/fitra.ts'

// The rate table on the Figma screen (R2), as data/ would hold it.
const rates: FitraRates = {
  year: 2026,
  items: [
    { id: 'atta', perPerson: 110, kgPerPerson: 1.65 },
    { id: 'barley', perPerson: 530, kgPerPerson: 3.3 },
    { id: 'dates', perPerson: 2310, kgPerPerson: 3.3 },
    { id: 'raisins', perPerson: 1980, kgPerPerson: 3.3 },
    { id: 'cheese', perPerson: 2805, kgPerPerson: 3.3 },
  ],
}

describe('fitra', () => {
  it('matches the Figma example (R2): ৫ জন × আটা ৳১১০ = ৳৫৫০', () => {
    const r = calculateFitra({ members: 5, itemId: 'atta', rates })
    expect(r).toMatchObject({ perPerson: 110, total: 550 })
    expect(r.min).toEqual({ itemId: 'atta', perPerson: 110, total: 550 })
    expect(r.max).toEqual({ itemId: 'cheese', perPerson: 2805, total: 14025 })
  })
  it('hand-checked: ৪ জন × খেজুর ৳২,৩১০ = ৳৯,২৪০, ১৩.২ কেজি', () => {
    const r = calculateFitra({ members: 4, itemId: 'dates', rates })
    expect(r.total).toBe(9240)
    expect(r.kg).toBe(13.2)
  })
  it('lists every item for the family in the order of the rates', () => {
    const r = calculateFitra({ members: 5, itemId: 'atta', rates })
    expect(r.table.map((row) => row.total)).toEqual([550, 2650, 11550, 9900, 14025])
    expect(r.kg).toBe(8.25)
  })
  it('handles one person, a very large household and items without a weight', () => {
    expect(calculateFitra({ members: 1, itemId: 'cheese', rates }).total).toBe(2805)
    expect(calculateFitra({ members: 10000, itemId: 'cheese', rates }).total).toBe(28050000)
    const noKg = calculateFitra({ members: 2, itemId: 'x', rates: { year: 2026, items: [{ id: 'x', perPerson: 0 }] } })
    expect(noKg).toMatchObject({ total: 0, kg: null })
  })
  it('validates input', () => {
    expect(validateFitra({ members: 0, itemId: 'atta', rates })).toBe('members')
    expect(validateFitra({ members: 2.5, itemId: 'atta', rates })).toBe('members')
    expect(validateFitra({ members: 5, itemId: 'rice', rates })).toBe('item')
    expect(validateFitra({ members: 5, itemId: 'atta', rates: { year: 2026, items: [] } })).toBe('rates')
    expect(
      validateFitra({ members: 5, itemId: 'atta', rates: { year: 2026, items: [{ id: 'atta', perPerson: -1 }] } }),
    ).toBe('rates')
    expect(
      validateFitra({
        members: 5,
        itemId: 'atta',
        rates: { year: 2026, items: [{ id: 'atta', perPerson: 1 }, { id: 'atta', perPerson: 2 }] },
      }),
    ).toBe('rates')
    expect(validateFitra({ members: 5, itemId: 'atta', rates })).toBeNull()
  })
})

describe('fitra (independent checks)', () => {
  it('hand-checked: ৭ জন × পনির ৳২,৮০৫ = ৳১৯,৬৩৫ (৭ × ৩.৩ = ২৩.১ কেজি)', () => {
    expect(calculateFitra({ members: 7, itemId: 'cheese', rates })).toMatchObject({ total: 19635, kg: 23.1 })
  })
  it('hand-checked: ৩ জন × যব ৳৫৩০ = ৳১,৫৯০ (৯.৯ কেজি)', () => {
    expect(calculateFitra({ members: 3, itemId: 'barley', rates })).toMatchObject({ total: 1590, kg: 9.9 })
  })
  it('refuses a household above the limit or a rate that is not a number', () => {
    expect(validateFitra({ members: 10001, itemId: 'atta', rates })).toBe('members')
    const bad = { year: 2026, items: [{ id: 'atta', perPerson: Number.NaN }] }
    expect(validateFitra({ members: 5, itemId: 'atta', rates: bad })).toBe('rates')
  })
})
