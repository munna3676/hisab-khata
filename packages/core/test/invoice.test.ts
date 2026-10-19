import { describe, expect, it } from 'vitest'
import { calculateInvoice, validateInvoice, type InvoiceInput } from '../src/invoice.ts'
import { calculateVat } from '../src/vat.ts'

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
  it('hand-checked: three lines, a line discount, a taka bill discount, 5% VAT, delivery and an advance', () => {
    // 2 × 1,250 = 2,500; 5 × 99.50 = 497.50 − 10% (49.75) = 447.75; 1 × 3,000 → 5,947.75
    // − ৳247.75 = 5,700; VAT 5% = 285; + 60 delivery = 6,045; − 2,000 paid = 4,045 due
    const r = calculateInvoice({
      items: [
        { description: 'শার্ট', qty: 2, unitPrice: 1250 },
        { description: 'মোজা', qty: 5, unitPrice: 99.5, discountPct: 10 },
        { description: 'জ্যাকেট', qty: 1, unitPrice: 3000 },
      ],
      discount: 247.75,
      discountType: 'amount',
      vatPct: 5,
      delivery: 60,
      paid: 2000,
    })
    expect(r.lines.map((l) => [l.gross, l.discount, l.amount])).toEqual([
      [2500, 0, 2500],
      [497.5, 49.75, 447.75],
      [3000, 0, 3000],
    ])
    expect(r).toMatchObject({ subtotal: 5947.75, itemDiscount: 49.75, discount: 247.75, taxable: 5700, vat: 285, grandTotal: 6045, due: 4045 })
  })
  it('charges SD then VAT the same way as the VAT calculator', () => {
    const r = calculateInvoice({ items: [{ description: 'সেবা', qty: 1, unitPrice: 10000 }], vatPct: 15, sdPct: 20 })
    const vat = calculateVat({ amount: 10000, ratePct: 15, mode: 'add', sdPct: 20 })
    expect([r.sd, r.vat, r.grandTotal]).toEqual([vat.sd, vat.vat, vat.total])
    expect(r.grandTotal).toBe(13800)
  })
  it('rounds half a taka up, keeps VAT off the delivery by default and shows an overpayment as negative due', () => {
    const half = calculateInvoice({ items: [{ description: 'x', qty: 1, unitPrice: 100.5 }], vatPct: 0, roundToTaka: true })
    expect([half.grandTotal, half.roundOff]).toEqual([101, 0.5])
    const free = calculateInvoice({ items: [{ description: 'x', qty: 1, unitPrice: 100 }], discount: 100, vatPct: 15, delivery: 50 })
    expect(free).toMatchObject({ taxable: 0, vat: 0, grandTotal: 50 })
    expect(calculateInvoice({ items: [{ description: 'x', qty: 1, unitPrice: 100 }], vatPct: 0, paid: 150 }).due).toBe(-50)
  })
  it('rejects NaN and allows a taka discount equal to the bill after line discounts', () => {
    const line = { description: 'x', qty: 1, unitPrice: 100, discountPct: 50 }
    expect(validateInvoice({ items: [line], discount: 50, discountType: 'amount', vatPct: 0 })).toBeNull()
    expect(validateInvoice({ items: [line], discount: 50.01, discountType: 'amount', vatPct: 0 })).toBe('discount')
    expect(validateInvoice({ ...figma, discount: Number.NaN })).toBe('discount')
    expect(validateInvoice({ ...figma, vatPct: Number.NaN })).toBe('vat')
    expect(validateInvoice({ items: [{ description: 'x', qty: 1, unitPrice: Number.POSITIVE_INFINITY }], vatPct: 0 })).toBe('unitPrice')
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
