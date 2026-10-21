// Profit margin page copy (Figma C3 28:7145, D · C3 68:5225). Bangla verbatim from Figma except
// where marked "draft"; English is a faithful translation.
import type { CopyTable, Localized } from '../tool/text.ts'

export const COPY = {
  costLabel: { bn: 'কেনা দাম', en: 'Cost price' },
  priceLabel: { bn: 'বেচার দাম', en: 'Selling price' },
  profit: { bn: 'লাভ', en: 'Profit' },
  loss: { bn: 'ক্ষতি', en: 'Loss' }, // draft
  resultSub: { bn: 'মার্জিন {margin}% · মার্কআপ {markup}%', en: 'Margin {margin}% · markup {markup}%' },
  resultSubNoMarkup: { bn: 'মার্জিন {margin}%', en: 'Margin {margin}%' }, // draft: cost 0 has no markup
  summaryTitle: { bn: 'হিসাব', en: 'Breakdown' },
  marginRow: { bn: 'মার্জিন (লাভ ÷ বেচার দাম)', en: 'Margin (profit ÷ selling price)' },
  markupRow: { bn: 'মার্কআপ (লাভ ÷ কেনা দাম)', en: 'Markup (profit ÷ cost price)' },
  pct: { bn: '{n}%', en: '{n}%' },
  dash: { bn: '—', en: '—' },
  targetTitle: { bn: 'টার্গেট মার্জিন থেকে দাম', en: 'Price from a target margin' },
  targetLabel: { bn: 'চাওয়া মার্জিন', en: 'Margin you want' },
  sellAt: { bn: 'বেচতে হবে', en: 'Sell at' },
  targetBelow100: { bn: 'মার্জিন ১০০% এর কম লেখো', en: 'Enter a margin below 100%' }, // draft
  /** draft */
  shareText: {
    bn: '{cost} এ কিনে {price} এ বেচলে {what} {profit}, মার্জিন {margin}%।',
    en: 'Buying at {cost} and selling at {price}: {what} {profit}, margin {margin}%.',
  },
  reportProfit: { bn: 'লাভ', en: 'Profit' },
  reportMargin: { bn: 'মার্জিন / মার্কআপ', en: 'Margin / markup' },
  reportTarget: { bn: 'টার্গেট মার্জিন থেকে দাম', en: 'Price from a target margin' },
} as const satisfies CopyTable

export type ProfitCopy = Localized<typeof COPY>
