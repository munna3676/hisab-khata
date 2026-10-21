// VAT page content: the verified line from data/commerce/vat-rates.json and the FAQ (Figma C1).
import type { VatRatesFile } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { t } from '@hisab/i18n/messages'
import { toolPageContent } from '../tool/content.ts'
import { localize } from '../tool/text.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { dataStatus } from '../tool/verification.ts'
import { COPY } from './copy.ts'

export const VAT_ID = 'vat'

export const VAT_MESSAGE_KEYS = [] as const

/** The rate chips, lowest first as in Figma (৫%, ৭.৫%, ১০%, ১৫%). */
export function vatRateChips(file: VatRatesFile): number[] {
  return [...new Set(file.rates.value.map((r) => r.pct))].sort((a, b) => a - b)
}

export function vatContent(lang: Lang, file: VatRatesFile): ToolPageContent {
  const copy = localize(COPY, lang)
  return toolPageContent(VAT_ID, lang, {
    data: dataStatus([file.rates, file.defaultPct]),
    faq: { title: t(lang, 'content.faq'), items: [{ question: copy.faq1Q, answer: copy.faq1A }] },
  })
}
