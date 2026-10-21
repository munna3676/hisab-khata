// Mobile data pack page copy (Figma C8 29:7863, D · C8 68:6553). Bangla verbatim from Figma except
// where marked "draft"; English is a faithful translation. Operator names come from data/data-packs.json.
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  budgetLabel: { bn: 'বাজেট', en: 'Budget' },
  validityLabel: { bn: 'মেয়াদ', en: 'Validity' },
  days: { bn: '{n} দিন', en: '{n} days' },
  operatorLabel: { bn: 'অপারেটর', en: 'Operator' },
  all: { bn: 'সব', en: 'All' },
  resultLabel: { bn: '{budget} এ সবচেয়ে বেশি ডেটা', en: 'Most data for {budget}' },
  resultSub: { bn: '{op} · {price} · {days} দিন (দিনে {perDay} GB)', en: '{op} · {price} · {days} days ({perDay} GB a day)' },
  gb: { bn: '{n} GB', en: '{n} GB' },
  tableTitle: { bn: '{budget} বা কমে {days} দিনের প্যাক', en: '{days}-day packs for {budget} or less' },
  colOperator: { bn: 'অপারেটর', en: 'Operator' },
  colData: { bn: 'ডেটা', en: 'Data' },
  colPrice: { bn: 'দাম', en: 'Price' },
  soon: { bn: 'শীঘ্রই', en: 'Coming soon' },
  noMatch: { bn: 'এই বাজেটে নেই', en: 'None in this budget' }, // draft
  dash: { bn: '—', en: '—' },
  listSep: { bn: ', ', en: ', ' },
  /** draft */
  emptyTitle: { bn: 'এই বাজেটে {days} দিনের কোনো প্যাক নেই', en: 'No {days}-day pack in this budget' },
  /** draft */
  emptyBody: { bn: 'বাজেট বাড়াও, বা অন্য মেয়াদ বা অপারেটর বেছে নাও।', en: 'Raise the budget, or pick another validity or operator.' },
  /** draft */
  emptyFix: { bn: '{price} দিয়ে হিসাব করো', en: 'Calculate with {price}' },
  /** Figma: "অপারেটররা প্রায়ই প্যাক বদলায়।" The rest of the Figma line is a note for the data team; this sentence is draft. */
  callout: {
    bn: 'অপারেটররা প্রায়ই প্যাক বদলায়। কেনার আগে অপারেটরের অ্যাপে দাম আর মেয়াদ মিলিয়ে নাও।',
    en: 'Operators change their packs often. Check the price and validity in the operator’s app before you buy.',
  },
  wholeDays: { bn: 'দিন পূর্ণ সংখ্যায় লেখো', en: 'Enter whole days' }, // draft
  /** draft */
  shareText: { bn: '{budget} এ {days} দিনের সবচেয়ে বেশি ডেটা: {op} {data}, {price}।', en: 'Most data for {budget} over {days} days: {op} {data}, {price}.' },
  reportPack: { bn: 'প্যাকের দাম বা ডেটা', en: 'Pack price or data' }, // draft
  reportMissing: { bn: 'প্যাক তালিকায় নেই', en: 'A pack is missing' }, // draft
} as const satisfies CopyTable

export type DataPackCopy = Localized<typeof COPY>
