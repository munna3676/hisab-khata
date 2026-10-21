// DPS page content: the FAQ (Figma F7), the tax help line and excise answer from data/finance.
import type { ExciseDutyFile, InterestTaxFile } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { t } from '@hisab/i18n/messages'
import { exciseAnswer } from '../deposit/shared.ts'
import { toolPageContent } from '../tool/content.ts'
import { localize } from '../tool/text.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { dataStatus } from '../tool/verification.ts'
import { COPY } from './copy.ts'

export const DPS_ID = 'dps'

/** The @hisab/i18n keys the DPS island uses besides the template's. */
export const DPS_MESSAGE_KEYS = [] as const

export function dpsContent(lang: Lang, tax: InterestTaxFile, excise: ExciseDutyFile): ToolPageContent {
  const copy = localize(COPY, lang)
  return toolPageContent(DPS_ID, lang, {
    data: dataStatus([tax, excise]),
    faq: {
      title: t(lang, 'content.faq'),
      items: [
        { question: copy.faq1Q, answer: copy.faq1A },
        { question: copy.faq2Q, answer: exciseAnswer(lang, excise) },
      ],
    },
  })
}
