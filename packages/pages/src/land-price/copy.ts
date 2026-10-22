// Land price copy (Figma L2 31:8835, D · L2 68:8251, P3 পিকার 59:16558). Bangla verbatim from
// Figma except where marked "draft"; English is a faithful translation.
import { LAND_UNIT_COPY } from '../land/units.ts'
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  ...LAND_UNIT_COPY,
  areaLabel: { bn: 'পরিমাণ', en: 'Amount' },
  unitLabel: { bn: 'একক', en: 'Unit' },
  /** "প্রতি কাঠার দাম": the unit in the genitive. */
  priceLabel: { bn: 'প্রতি {unit} দাম', en: 'Price per {unit}' },
  /** Genitive unit names for the price label and the rows ("কাঠার", "শতাংশের"). */
  unitOf: {
    decimal: { bn: 'শতাংশের', en: 'decimal' },
    sqft: { bn: 'বর্গফুটের', en: 'sq ft' },
    katha: { bn: 'কাঠার', en: 'katha' },
    bigha: { bn: 'বিঘার', en: 'bigha' },
    acre: { bn: 'একরের', en: 'acre' },
    sqm: { bn: 'বর্গমিটারের', en: 'sq m' },
    sqyard: { bn: 'বর্গগজের', en: 'sq yd' },
    chotak: { bn: 'ছটাকের', en: 'chotak' },
    kani: { bn: 'কানির', en: 'kani' },
    gonda: { bn: 'গণ্ডার', en: 'gonda' },
    kora: { bn: 'কড়ার', en: 'kora' },
    kranti: { bn: 'ক্রান্তির', en: 'kranti' },
    link: { bn: 'বর্গলিংকের', en: 'sq link' },
    hectare: { bn: 'হেক্টরের', en: 'hectare' },
  },
  resultLabel: { bn: 'মোট দাম', en: 'Total price' },
  crore: { bn: '{n} কোটি', en: '{n} crore' },
  lakh: { bn: '{n} লাখ', en: '{n} lakh' },
  thousand: { bn: '{n} হাজার', en: '{n} thousand' },
  takaWords: { bn: '{n} টাকা', en: '{n} taka' },
  otherTitle: { bn: 'অন্য এককে দাম', en: 'Price in other units' },
  per: { bn: 'প্রতি {unit}', en: 'Per {unit}' },
  callout: {
    bn: 'রেজিস্ট্রেশন খরচ, কর আর দলিল লেখার খরচ আলাদা। এগুলো এলাকা ও মৌজা মূল্য অনুযায়ী বদলায়।',
    en: 'Registration costs, taxes and deed-writing fees are extra. They change with the area and the mouza value.',
  },
  /** draft */
  areaError: { bn: 'শূন্যের বেশি লেখো', en: 'Enter more than zero' },
  /** draft */
  shareText: { bn: '{area} {unit} জমি, প্রতি {unitOf} দাম {price}: মোট {total}', en: '{area} {unit} of land at {price} per {unitOf}: {total} in all' },
  /** draft */
  reportTotal: { bn: 'মোট দাম', en: 'Total price' },
  /** draft */
  reportPer: { bn: 'অন্য এককে দাম', en: 'Price in other units' },
  close: { bn: 'বন্ধ করো', en: 'Close' },
} as const satisfies CopyTable

export type LandPriceCopy = Localized<typeof COPY>
