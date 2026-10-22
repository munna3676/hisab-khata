// Jewellery bill copy (Figma L4 31:9216, D · L4 68:8774). Bangla verbatim from Figma except where
// marked "draft"; English is a faithful translation.
import { GOLD_WEIGHT_COPY } from '../gold/shared.ts'
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  ...GOLD_WEIGHT_COPY,
  priceLabel: { bn: 'প্রতি ভরির দাম (বাজুস)', en: 'Price per bhori (BAJUS)' },
  rateLine: { bn: 'বাজুস, {date}, {karat} ক্যারেট।', en: 'BAJUS, {date}, {karat} karat.' },
  makingLabel: { bn: 'মজুরি', en: 'Making charge' },
  vatLabel: { bn: 'VAT', en: 'VAT' },
  resultLabel: { bn: 'মোট বিল', en: 'Total bill' },
  resultSub: { bn: 'বাজুস রেট, মজুরি {making}% ও VAT {vat}% ধরে', en: 'At the BAJUS rate, {making}% making charge and {vat}% VAT' },
  /** draft: a typed rate */
  resultSubOwn: { bn: 'তোমার দেওয়া রেট, মজুরি {making}% ও VAT {vat}% ধরে', en: 'At your rate, {making}% making charge and {vat}% VAT' },
  summaryTitle: { bn: 'হিসাব', en: 'Breakdown' },
  goldPrice: { bn: 'সোনার দাম', en: 'Gold price' },
  making: { bn: 'মজুরি ({pct}%)', en: 'Making charge ({pct}%)' },
  vat: { bn: 'VAT ({pct}%)', en: 'VAT ({pct}%)' },
  total: { bn: 'মোট', en: 'Total' },
  callout: {
    bn: 'মজুরি আর VAT এর হার দোকান ও গহনা ভেদে আলাদা। রসিদ দেখে বসাও।',
    en: 'Making charge and VAT rates vary by shop and piece. Enter them from your receipt.',
  },
  /** draft */
  weightError: { bn: 'ওজন লেখো', en: 'Enter the weight' },
  /** draft */
  priceError: { bn: 'দাম লেখো', en: 'Enter the price' },
  /** draft */
  shareText: { bn: '{weight} গহনার বিল: {total} (মজুরি {making}%, VAT {vat}%)', en: 'Jewellery bill for {weight}: {total} ({making}% making, {vat}% VAT)' },
  /** draft */
  reportTotal: { bn: 'মোট বিল', en: 'Total bill' },
  /** draft */
  reportRate: { bn: 'বাজুসের রেট', en: 'BAJUS rate' },
} as const satisfies CopyTable

export type JewelryCopy = Localized<typeof COPY>
