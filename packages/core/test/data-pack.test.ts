import { describe, expect, it } from 'vitest'
import { calculateDataPack, validateDataPack, type DataPack } from '../src/data-pack.ts'

// Shaped like data/data-packs.json; the GP rows are the ones on the Figma screen (C8).
const PACKS: DataPack[] = [
  { id: 'gp-1gb-30d', operator: 'gp', price: 143, dataGb: 1, validityDays: 30 },
  { id: 'gp-10gb-30d', operator: 'gp', price: 308, dataGb: 10, validityDays: 30 },
  { id: 'gp-30gb-30d', operator: 'gp', price: 399, dataGb: 30, validityDays: 30 },
  { id: 'gp-50gb-30d', operator: 'gp', price: 549, dataGb: 50, validityDays: 30 },
  { id: 'gp-5gb-7d', operator: 'gp', price: 148, dataGb: 5, validityDays: 7 },
  { id: 'gp-2gb-3d', operator: 'gp', price: 59, dataGb: 2, validityDays: 3 },
]
const ALL = ['gp', 'robi', 'banglalink', 'teletalk']

describe('data-pack', () => {
  it('matches the Figma example (C8): ৳৪০০, ৩০ দিন, সব অপারেটর → 30 GB জিপি ৳৩৯৯, দিনে ১ GB', () => {
    const r = calculateDataPack({ packs: PACKS, operators: ALL, budget: 400, validityDays: 30 })
    expect(r.rows.map((row) => [row.pack.dataGb, row.pack.price])).toEqual([
      [30, 399],
      [10, 308],
      [1, 143],
    ])
    expect(r.best).toMatchObject({ gbPerDay: 1, perDay: 13.3 })
    expect(r.operatorsWithoutData).toEqual(['robi', 'banglalink', 'teletalk'])
    expect(r.operatorsWithoutMatch).toEqual([])
  })
  it('works out cost per GB and per day, hand-checked', () => {
    const r = calculateDataPack({ packs: PACKS, validityDays: 7 })
    // ৳১৪৮ ÷ 5 GB = ৳২৯.৬০/GB; ÷ 7 days = ৳২১.১৪/day
    expect(r.rows[0]).toMatchObject({ perGb: 29.6, perDay: 21.14, gbPerDay: 0.714 })
  })
  it('sorts by price, cost per GB or cost per day', () => {
    const cheapest = calculateDataPack({ packs: PACKS, sort: 'cheapest' })
    expect(cheapest.rows[0]!.pack.id).toBe('gp-2gb-3d')
    const perGb = calculateDataPack({ packs: PACKS, sort: 'perGb' })
    expect(perGb.rows[0]!.pack.id).toBe('gp-50gb-30d')
    const perDay = calculateDataPack({ packs: PACKS, sort: 'perDay' })
    expect(perDay.rows[0]!.pack.id).toBe('gp-1gb-30d')
  })
  it('filters by operator, least validity and least data', () => {
    expect(calculateDataPack({ packs: PACKS, operators: ['robi'] }).rows).toEqual([])
    const r = calculateDataPack({ packs: PACKS, minValidityDays: 7, minDataGb: 10 })
    expect(r.rows.map((row) => row.pack.id)).toEqual(['gp-50gb-30d', 'gp-30gb-30d', 'gp-10gb-30d'])
  })
  it('reports an operator whose packs all miss the filters', () => {
    const packs = [...PACKS, { id: 'robi-1gb-3d', operator: 'robi', price: 49, dataGb: 1, validityDays: 3 }]
    const r = calculateDataPack({ packs, operators: ALL, validityDays: 30 })
    expect(r.operatorsWithoutMatch).toEqual(['robi'])
    expect(r.operatorsWithoutData).toEqual(['banglalink', 'teletalk'])
  })
  it('handles a zero budget, an empty list and a huge budget', () => {
    const none = calculateDataPack({ packs: PACKS, budget: 0 })
    expect(none.rows).toEqual([])
    expect(none.best).toBeNull()
    expect(calculateDataPack({ packs: [] }).best).toBeNull()
    expect(calculateDataPack({ packs: PACKS, budget: 1e9 }).rows).toHaveLength(PACKS.length)
  })
  it('hand-checked unit costs for the Figma packs', () => {
    const r = calculateDataPack({ packs: PACKS, validityDays: 30, sort: 'perGb' })
    // ৳৫৪৯ ÷ 50 = 10.98/GB, ÷ 30 = 18.30/day; ৳৩৯৯ ÷ 30 = 13.30 both ways; ৳৩০৮ ÷ 10 = 30.80/GB, ÷ 30 = 10.2667 → 10.27/day.
    expect(r.rows.map((row) => [row.pack.id, row.perGb, row.perDay, row.gbPerDay])).toEqual([
      ['gp-50gb-30d', 10.98, 18.3, 1.667],
      ['gp-30gb-30d', 13.3, 13.3, 1],
      ['gp-10gb-30d', 30.8, 10.27, 0.333],
      ['gp-1gb-30d', 143, 4.77, 0.033],
    ])
  })
  it('a budget equal to the price is enough, and ties keep the cheaper pack first', () => {
    expect(calculateDataPack({ packs: PACKS, budget: 399, validityDays: 30 }).best!.pack.id).toBe('gp-30gb-30d')
    const twins = [
      { id: 'a', operator: 'robi', price: 400, dataGb: 30, validityDays: 30 },
      { id: 'b', operator: 'gp', price: 399, dataGb: 30, validityDays: 30 },
    ]
    expect(calculateDataPack({ packs: twins }).rows.map((row) => row.pack.id)).toEqual(['b', 'a'])
  })
  it('reports an operator chip sent twice only once', () => {
    const r = calculateDataPack({ packs: PACKS, operators: ['robi', 'robi', 'gp'] })
    expect(r.operatorsWithoutData).toEqual(['robi'])
  })
  it('validates input', () => {
    expect(validateDataPack({ packs: [{ ...PACKS[0]!, validityDays: 0 }] })).toBe('packs')
    expect(validateDataPack({ packs: [{ ...PACKS[0]!, price: Number.NaN }] })).toBe('packs')
    expect(validateDataPack({ packs: [] })).toBeNull()
    expect(validateDataPack({ packs: [{ ...PACKS[0]!, dataGb: 0 }] })).toBe('packs')
    expect(validateDataPack({ packs: PACKS, budget: -1 })).toBe('budget')
    expect(validateDataPack({ packs: PACKS, validityDays: 1.5 })).toBe('validity')
    expect(validateDataPack({ packs: PACKS, minDataGb: Number.NaN })).toBe('minData')
    expect(validateDataPack({ packs: PACKS, sort: 'random' as 'cheapest' })).toBe('sort')
    expect(validateDataPack({ packs: PACKS, budget: 400, validityDays: 30 })).toBeNull()
  })
})
