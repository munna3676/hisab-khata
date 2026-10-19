import { round, sumMoney } from './lib/money.ts'

export interface InvoiceItem {
  /** বিবরণ, e.g. "লোগো ডিজাইন". Passed through to the result untouched. */
  description: string
  /** Can be a fraction (2.5 kg, 1.5 hours). */
  qty: number
  unitPrice: number
  /** Discount on this line only, in percent. */
  discountPct?: number
}

export interface InvoiceInput {
  items: InvoiceItem[]
  /** Discount on the whole bill after line discounts (ছাড়). */
  discount?: number
  /** Defaults to "percent". */
  discountType?: 'percent' | 'amount'
  /** VAT in percent; 0 when the seller does not charge VAT. */
  vatPct: number
  /** Supplementary duty in percent, charged before VAT. */
  sdPct?: number
  /** Delivery or shipping added to the bill. */
  delivery?: number
  /** Also charge VAT on the delivery. Defaults to false. */
  vatOnDelivery?: boolean
  /** Advance already received. */
  paid?: number
  /** Round the grand total to the nearest taka and show the adjustment. */
  roundToTaka?: boolean
}

export interface InvoiceLine {
  description: string
  qty: number
  unitPrice: number
  /** qty × unit price. */
  gross: number
  discount: number
  /** gross − discount. */
  amount: number
}

export interface InvoiceResult {
  lines: InvoiceLine[]
  /** Sum of line amounts, after line discounts. */
  subtotal: number
  /** Sum of the line discounts. */
  itemDiscount: number
  /** Discount on the whole bill. */
  discount: number
  /** subtotal − discount: what SD and VAT are charged on. */
  taxable: number
  sd: number
  vat: number
  delivery: number
  /** Paisa added (+) or dropped (−) to reach a whole taka; 0 unless roundToTaka. */
  roundOff: number
  /** মোট. */
  grandTotal: number
  paid: number
  /** grandTotal − paid; negative when the client paid too much. */
  due: number
  /** The grand total in words, or null when no converter was passed. */
  amountInWords: string | null
}

/** Number-to-words converter from the text tools, e.g. 25000 → "পঁচিশ হাজার টাকা মাত্র". */
export type AmountInWords = (amount: number) => string

export type InvoiceError =
  | 'items'
  | 'qty'
  | 'unitPrice'
  | 'itemDiscount'
  | 'discount'
  | 'vat'
  | 'sd'
  | 'delivery'
  | 'paid'

const isMoney = (v: number | undefined) => v === undefined || (v >= 0 && Number.isFinite(v))

/** qty × unit price, less the line's own discount, each rounded to the paisa as printed. */
function toLine(item: InvoiceItem): InvoiceLine {
  const gross = round(item.qty * item.unitPrice)
  const discount = round((gross * (item.discountPct ?? 0)) / 100)
  const { description, qty, unitPrice } = item
  return { description, qty, unitPrice, gross, discount, amount: round(gross - discount) }
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateInvoice(input: InvoiceInput): InvoiceError | null {
  if (input.items.length === 0) return 'items'
  for (const item of input.items) {
    if (!(item.qty > 0 && Number.isFinite(item.qty))) return 'qty'
    if (!isMoney(item.unitPrice)) return 'unitPrice'
    if (item.discountPct !== undefined && !(item.discountPct >= 0 && item.discountPct <= 100)) return 'itemDiscount'
  }
  const discount = input.discount ?? 0
  const max = input.discountType === 'amount' ? sumMoney(input.items.map((i) => toLine(i).amount)) : 100
  if (!(discount >= 0 && discount <= max)) return 'discount'
  if (!(input.vatPct >= 0 && input.vatPct <= 100)) return 'vat'
  if (input.sdPct !== undefined && !(input.sdPct >= 0 && input.sdPct <= 1000)) return 'sd'
  if (!isMoney(input.delivery)) return 'delivery'
  if (!isMoney(input.paid)) return 'paid'
  return null
}

/** Lines → subtotal → bill discount → SD → VAT → delivery → grand total → due. */
export function calculateInvoice(input: InvoiceInput, toWords?: AmountInWords): InvoiceResult {
  const lines = input.items.map(toLine)

  const subtotal = sumMoney(lines.map((l) => l.amount))
  const itemDiscount = sumMoney(lines.map((l) => l.discount))
  const raw = input.discount ?? 0
  const discount = round(input.discountType === 'amount' ? raw : (subtotal * raw) / 100)
  const taxable = round(subtotal - discount)

  const delivery = round(input.delivery ?? 0)
  const sd = round((taxable * (input.sdPct ?? 0)) / 100)
  // VAT is charged on the price with SD in it (as on a Mushak-6.3 invoice).
  const vatBase = taxable + sd + (input.vatOnDelivery ? delivery : 0)
  const vat = round((vatBase * input.vatPct) / 100)

  const exact = round(taxable + sd + vat + delivery)
  const grandTotal = input.roundToTaka ? round(exact, 0) : exact
  const paid = round(input.paid ?? 0)
  return {
    lines,
    subtotal,
    itemDiscount,
    discount,
    taxable,
    sd,
    vat,
    delivery,
    roundOff: round(grandTotal - exact),
    grandTotal,
    paid,
    due: round(grandTotal - paid),
    amountInWords: toWords ? toWords(grandTotal) : null,
  }
}
