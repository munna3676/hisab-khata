// Gold and silver converter copy (Figma L3 31:9006, D · L3 68:8527). Bangla verbatim from Figma
// except where marked "draft"; English is a faithful translation.
import { GOLD_WEIGHT_COPY } from '../gold/shared.ts'
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  ...GOLD_WEIGHT_COPY,
  karatLabel: { bn: 'ক্যারেট', en: 'Karat' },
  priceLabel: { bn: 'প্রতি ভরির দাম (বাজুসের আজকের রেট)', en: 'Price per bhori (today’s BAJUS rate)' },
  rateLine: { bn: 'বাজুস, {date}: {karat} ক্যারেট {rate}/ভরি', en: 'BAJUS, {date}: {karat} karat {rate}/bhori' },
  /** draft */
  noRate: { bn: 'বাজুসের তালিকায় {karat} ক্যারেটের রেট নেই, দাম নিজে লেখো।', en: 'No {karat} karat rate on the BAJUS sheet; type the price.' },
  resultLabel: { bn: 'মোট ওজন ও দাম', en: 'Total weight and value' },
  gramUnit: { bn: ' গ্রাম', en: ' grams' },
  resultSub: { bn: '{vori} ভরি × {rate} = {value} ({karat} ক্যারেট)', en: '{vori} bhori × {rate} = {value} ({karat} karat)' },
  /** draft: without a price */
  resultSubWeight: { bn: '{vori} ভরি', en: '{vori} bhori' },
  tableTitle: { bn: 'সব এককে', en: 'In every unit' },
  colUnit: { bn: 'একক', en: 'Unit' },
  colValue: { bn: 'পরিমাণ', en: 'Amount' },
  rowVori: { bn: 'ভরি', en: 'Bhori' },
  rowAna: { bn: 'আনা', en: 'Ana' },
  rowRoti: { bn: 'রতি', en: 'Roti' },
  rowGram: { bn: 'গ্রাম', en: 'Gram' },
  callout: { bn: '১ ভরি = {ana} আনা = {roti} রতি = {gram} গ্রাম।', en: '1 bhori = {ana} ana = {roti} roti = {gram} grams.' },
  /** draft */
  shareText: { bn: '{weight} = {grams} গ্রাম{value}', en: '{weight} = {grams} grams{value}' },
  /** draft */
  shareValue: { bn: ', দাম {value} ({karat} ক্যারেট)', en: ', worth {value} ({karat} karat)' },
  /** draft */
  reportWeight: { bn: 'ওজনের হিসাব', en: 'Weight conversion' },
  /** draft */
  reportRate: { bn: 'বাজুসের রেট', en: 'BAJUS rate' },
} as const satisfies CopyTable

export type GoldCopy = Localized<typeof COPY>
