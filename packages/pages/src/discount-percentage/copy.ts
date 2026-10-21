// Discount and percentage page copy (Figma C2 28:6970, D · C2 68:4983). Bangla verbatim from Figma
// except where marked "draft"; English is a faithful translation.
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  priceLabel: { bn: 'আসল দাম', en: 'Original price' },
  offLabel: { bn: 'ছাড়', en: 'Discount' },
  offChips: { bn: 'ছাড় বেছে নাও', en: 'Pick a discount' }, // draft: accessible name of the chip row
  pctChip: { bn: '{n}%', en: '{n}%' },
  resultLabel: { bn: 'দিতে হবে', en: 'You pay' },
  resultSub: { bn: 'বাঁচলো {saved} ({pct}%)', en: 'You save {saved} ({pct}%)' },
  percentTitle: { bn: 'শতাংশ হিসাব', en: 'Percentage' },
  numberLabel: { bn: 'সংখ্যা', en: 'Number' },
  percentLabel: { bn: 'শতাংশ', en: 'Percent' },
  percentOf: { bn: '{n} এর {pct}%', en: '{pct}% of {n}' },
  dash: { bn: '—', en: '—' },
  /** draft */
  shareText: {
    bn: '{price} এর জিনিসে {pct}% ছাড়ে দিতে হবে {final}, বাঁচলো {saved}।',
    en: 'With {pct}% off {price}, you pay {final} and save {saved}.',
  },
  reportFinal: { bn: 'দিতে হবে', en: 'You pay' },
  reportSaved: { bn: 'বাঁচলো', en: 'You save' },
  reportPercent: { bn: 'শতাংশ হিসাব', en: 'Percentage' },
} as const satisfies CopyTable

export type DiscountCopy = Localized<typeof COPY>
