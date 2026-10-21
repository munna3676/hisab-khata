// FDR page content: the FAQ (Figma F8); tax rates and the renew example from data and the engine.
import { calculateFdr } from '@hisab/core/fdr'
import type { ExciseDutyFile, InterestTaxFile } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { t } from '@hisab/i18n/messages'
import { taxHelperText } from '../deposit/shared.ts'
import { toolPageContent } from '../tool/content.ts'
import { fill, plain, taka } from '../tool/say.ts'
import { localize } from '../tool/text.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { dataStatus } from '../tool/verification.ts'
import { COPY } from './copy.ts'
import { FDR_PARAMS, RENEW_EVERY } from './params.ts'

export const FDR_ID = 'fdr'

/** The @hisab/i18n keys the FDR island uses besides the template's. */
export const FDR_MESSAGE_KEYS = [] as const

export function fdrContent(lang: Lang, tax: InterestTaxFile, excise: ExciseDutyFile): ToolPageContent {
  const copy = localize(COPY, lang)
  const amount = FDR_PARAMS.amount.default
  const rate = FDR_PARAMS.rate.default
  const year = (mode: 'simple' | 'renew') =>
    calculateFdr({ principal: amount, annualRatePct: rate, months: 12, mode, periodMonths: RENEW_EVERY, taxPct: tax.value.withTinPct, exciseSlabs: excise.value }).maturity
  return toolPageContent(FDR_ID, lang, {
    data: dataStatus([tax, excise]),
    faq: {
      title: t(lang, 'content.faq'),
      items: [
        // Figma's answer is exactly the tax field's help line.
        { question: copy.faq1Q, answer: taxHelperText(lang, tax) },
        {
          question: copy.faq2Q,
          answer: fill(lang, copy.faq2A, { amount: taka(lang, amount), rate: plain(lang, rate), simple: taka(lang, year('simple')), renew: taka(lang, year('renew')) }),
        },
      ],
    },
  })
}
