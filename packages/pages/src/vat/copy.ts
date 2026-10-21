// VAT page copy (Figma C1 28:6772, C4-b VAT বাদ দাও 60:17985, D · C1 68:4691, D · C4-b 69:37970).
// Bangla verbatim from Figma except where marked "draft"; English is a faithful translation.
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  modeLabel: { bn: 'কী করবে?', en: 'What do you want to do?' },
  modeAdd: { bn: 'VAT যোগ করো', en: 'Add VAT' },
  modeRemove: { bn: 'VAT বাদ দাও', en: 'Remove VAT' },
  priceLabel: { bn: 'দাম', en: 'Price' },
  grossLabel: { bn: 'VAT সহ দাম', en: 'Price with VAT' },
  rateLabel: { bn: 'VAT হার', en: 'VAT rate' },
  ratePct: { bn: '{rate}%', en: '{rate}%' },
  addResult: { bn: 'VAT সহ মোট দাম', en: 'Total with VAT' },
  removeResult: { bn: 'মূল দাম (VAT ছাড়া)', en: 'Price without VAT' },
  vatLine: { bn: 'VAT {rate}% = {vat}', en: 'VAT {rate}% = {vat}' },
  divideLine: { bn: '{total} ÷ {divisor}', en: '{total} ÷ {divisor}' },
  summaryTitle: { bn: 'হিসাব', en: 'Breakdown' },
  base: { bn: 'মূল দাম', en: 'Price without VAT' },
  vatRow: { bn: 'VAT ({rate}%)', en: 'VAT ({rate}%)' },
  total: { bn: 'মোট', en: 'Total' },
  minus: { bn: '− {amount}', en: '− {amount}' },
  /** The numbers are worked out from the chosen rate (Figma: 15%). */
  callout: {
    bn: 'VAT বাদ দিতে: VAT সহ দাম ÷ {divisor}। যেমন {total} ÷ {divisor} = {base} টাকা।',
    en: 'To take VAT out: price with VAT ÷ {divisor}. For example {total} ÷ {divisor} = {base} taka.',
  },
  /** draft */
  shareAdd: {
    bn: '{amount} এর সাথে {rate}% VAT {vat}, মোট {total}।',
    en: '{amount} plus {rate}% VAT ({vat}) is {total}.',
  },
  /** draft */
  shareRemove: {
    bn: 'VAT সহ {total} থেকে {rate}% VAT ({vat}) বাদ দিলে মূল দাম {base}।',
    en: '{total} with {rate}% VAT is {base} before VAT ({vat} VAT).',
  },
  reportTotal: { bn: 'VAT সহ দাম', en: 'Price with VAT' },
  reportVat: { bn: 'VAT এর পরিমাণ', en: 'VAT amount' }, // draft
  reportBase: { bn: 'মূল দাম', en: 'Price without VAT' },
  faq1Q: { bn: 'VAT সহ দাম থেকে VAT কিভাবে বের করবো?', en: 'How do I find the VAT in a VAT-inclusive price?' },
  faq1A: {
    bn: '"VAT বাদ দাও" বেছে VAT সহ দাম লেখো, মূল দাম আর VAT আলাদা দেখাবে।',
    en: 'Choose "Remove VAT" and enter the price with VAT; you will see the price and the VAT separately.',
  },
} as const satisfies CopyTable

export type VatCopy = Localized<typeof COPY>
