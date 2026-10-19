import { describe, expect, it } from 'vitest'
import { exciseDuty, findSlab, isValidExciseTable, isValidSlabTable } from '../src/lib/finance-slabs.ts'

// Sample table in the shape of data/finance/excise-duty.json, test-only.
const EXCISE = [
  { upTo: 400000, duty: 0 },
  { upTo: 500000, duty: 150 },
  { upTo: 1000000, duty: 500 },
  { upTo: null, duty: 3000 },
]

describe('finance-slabs', () => {
  it('a limit belongs to its own row; above the last limit takes the open row', () => {
    expect(exciseDuty(400000, EXCISE)).toBe(0)
    expect(exciseDuty(400000.01, EXCISE)).toBe(150)
    expect(exciseDuty(1000000, EXCISE)).toBe(500)
    expect(exciseDuty(1e12, EXCISE)).toBe(3000)
    expect(exciseDuty(0, EXCISE)).toBe(0)
    expect(findSlab(450000, EXCISE)).toBe(EXCISE[1])
  })
  it('no table means no duty', () => {
    expect(exciseDuty(1e9, [])).toBe(0)
  })
  it('checks table shape', () => {
    expect(isValidSlabTable(EXCISE)).toBe(true)
    expect(isValidSlabTable([{ upTo: null }])).toBe(true)
    expect(isValidSlabTable([])).toBe(false)
    expect(isValidSlabTable([{ upTo: 100 }])).toBe(false)
    expect(isValidSlabTable([{ upTo: 100 }, { upTo: 100 }, { upTo: null }])).toBe(false)
    expect(isValidSlabTable([{ upTo: null }, { upTo: null }])).toBe(false)
    expect(isValidExciseTable([{ upTo: null, duty: -1 }])).toBe(false)
  })
  it('follows the published slab wording: Tk 500 above 5 lakh up to 10 lakh, Tk 3,000 above 10 lakh', () => {
    // Daily Star FY26 budget coverage: "Tk 500 for balances above Tk 5 lakh up to Tk 10 lakh, Tk 3,000 for Tk 10 lakh to Tk 50 lakh"
    expect(exciseDuty(500000, EXCISE)).toBe(150)
    expect(exciseDuty(500001, EXCISE)).toBe(500)
    expect(exciseDuty(1000001, EXCISE)).toBe(3000)
  })
  it('a single open row covers everything; NaN limits or duties make a table invalid', () => {
    expect(exciseDuty(1, [{ upTo: null, duty: 0 }])).toBe(0)
    expect(isValidSlabTable([{ upTo: NaN }, { upTo: null }])).toBe(false)
    expect(isValidExciseTable([{ upTo: null, duty: NaN }])).toBe(false)
  })
})
