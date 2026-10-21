// EMI page content around the calculator: the FAQ (Figma F6), numbers from the engine.
import { calculateEmi } from '@hisab/core/emi'
import type { Lang } from '@hisab/i18n/locale'
import { t } from '@hisab/i18n/messages'
import { toolPageContent } from '../tool/content.ts'
import { fill, plain, taka } from '../tool/say.ts'
import { localize } from '../tool/text.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { COPY } from './copy.ts'
import { EMI_PARAMS } from './params.ts'

export const EMI_ID = 'emi'

/** The @hisab/i18n keys the EMI island uses besides the template's (for islandText). */
export const EMI_MESSAGE_KEYS = [] as const

export function emiContent(lang: Lang): ToolPageContent {
  const copy = localize(COPY, lang)
  const amount = EMI_PARAMS.amount.default
  const rate = EMI_PARAMS.rate.default
  const { schedule } = calculateEmi({ principal: amount, annualRatePct: rate, months: EMI_PARAMS.months.default })
  return toolPageContent(EMI_ID, lang, {
    faq: {
      title: t(lang, 'content.faq'),
      items: [
        { question: copy.faq1Q, answer: copy.faq1A },
        {
          question: copy.faq2Q,
          answer: fill(lang, copy.faq2A, {
            amount: taka(lang, amount),
            rate: plain(lang, rate),
            first: taka(lang, schedule[0]!.interest),
            last: taka(lang, schedule.at(-1)!.interest),
          }),
        },
      ],
    },
  })
}
