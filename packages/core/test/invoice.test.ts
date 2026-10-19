import { describe, expect, it } from 'vitest'
import { calculateInvoice, validateInvoice, type InvoiceInput } from '../src/invoice.ts'

const figma: InvoiceInput = {
  items: [
    { description: 'লোগো ডিজাইন', qty: 1, unitPrice: 5000 },
    { description: 'ওয়েবসাইট সেটআপ', qty: 1, unitPrice: 20000 },
  ],
  discount: 0,
  vatPct: 0,
}

describe('invoice', () => {
  it('matches the Figma example (E7): ৫,০০০ + ২০,০০০ → মোট ৳২৫,০০০', () => {
    const r = calculateInvoice(figma)
    expect(r.lines.map((l) => l.amount)).toEqual([5000, 20000])
    expect(r.lines[0]!.description).toBe('লোগো ডিজাইন')
    expect(r.subtotal).toBe(25000)
    expect(r.grandTotal).toBe(25000)
    expect(r.due).toBe(25000)
    expect(r.amountInWords).toBeNull()
  })
  it('hand-checked: 10% bill discount then 15% VAT plus ৳120 delivery', () => {
    // 25,000 − 2,500 = 22,500; VAT 3,375; + 120 = 25,995
    const r = calculateInvoice({ ...figma, discount: 10, vatPct: 15, delivery: 120 })
    expect(r).toMatchObject({ discount: 2500, taxable: 22500, vat: 3375, delivery: 120, grandTotal: 25995 })
  })
  it('applies line discounts, quantity, SD and VAT on delivery', () => {
    const r = calculateInvoice({
      items: [{ description: 'টি-শার্ট', qty: 3, unitPrice: 450, discountPct: 10 }],
      discount: 15,
      discountType: 'amount',
      vatPct: 15,
      sdPct: 10,
      delivery: 100,
      vatOnDelivery: true,
      paid: 500,
    })
    // 1,350 − 135 = 1,215; − 15 = 1,200; SD 120; VAT 15% of (1,200 + 120 + 100) = 213
    expect(r).toMatchObject({ itemDiscount: 135, subtotal: 1215, discount: 15, taxable: 1200, sd: 120, vat: 213 })
    expect(r.grandTotal).toBe(1633)
    expect(r.due).toBe(1133)
  })
  it('rounds to the taka when asked and passes the total to the words hook', () => {
    const r = calculateInvoice(
      { items: [{ description: 'ঘণ্টা', qty: 2.5, unitPrice: 333.33 }], vatPct: 0, roundToTaka: true },
      (n) => `${n} টাকা`,
    )
    expect(r.subtotal).toBe(833.33)
    expect(r.grandTotal).toBe(833)
    expect(r.roundOff).toBe(-0.33)
    expect(r.amountInWords).toBe('833 টাকা')
  })
  it('handles a free item and a large bill', () => {
    expect(calculateInvoice({ items: [{ description: 'ফ্রি', qty: 1, unitPrice: 0 }], vatPct: 15 }).grandTotal).toBe(0)
    expect(calculateInvoice({ items: [{ description: 'জমি', qty: 1, unitPrice: 5e10 }], vatPct: 0 }).grandTotal).toBe(5e10)
  })
  it('validates input', () => {
    expect(validateInvoice({ items: [], vatPct: 0 })).toBe('items')
    expect(validateInvoice({ items: [{ description: 'x', qty: 0, unitPrice: 10 }], vatPct: 0 })).toBe('qty')
    expect(validateInvoice({ items: [{ description: 'x', qty: 1, unitPrice: -10 }], vatPct: 0 })).toBe('unitPrice')
    expect(validateInvoice({ items: [{ description: 'x', qty: 1, unitPrice: 10, discountPct: 120 }], vatPct: 0 })).toBe('itemDiscount')
    expect(validateInvoice({ ...figma, discount: 30000, discountType: 'amount' })).toBe('discount')
    expect(validateInvoice({ ...figma, discount: 101 })).toBe('discount')
    expect(validateInvoice({ ...figma, vatPct: -1 })).toBe('vat')
    expect(validateInvoice({ ...figma, sdPct: -1 })).toBe('sd')
    expect(validateInvoice({ ...figma, delivery: -60 })).toBe('delivery')
    expect(validateInvoice({ ...figma, paid: Number.NaN })).toBe('paid')
    expect(validateInvoice(figma)).toBeNull()
  })
})
