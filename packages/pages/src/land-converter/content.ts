// Land converter page content: the verified line from data/land/conventions.json and the Figma L1
// FAQ, its numbers worked out by @hisab/core land with the standard (Dhaka) convention from data.
import { landConvention, landUnitSqft } from '@hisab/core/land'
import type { LandConventionsFile } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { t } from '@hisab/i18n/messages'
import { toolPageContent } from '../tool/content.ts'
import { decimal, fill, num } from '../tool/say.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { dataStatus } from '../tool/verification.ts'
import { COPY } from './copy.ts'
import { conventionFor } from './model.ts'
import { localize } from '../tool/text.ts'

export const LAND_ID = 'land-converter'

export const LAND_MESSAGE_KEYS = [] as const

export function landContent(lang: Lang, file: LandConventionsFile): ToolPageContent {
  const copy = localize(COPY, lang)
  const c = landConvention(conventionFor('standard', null, file.value))
  const dec = landUnitSqft('decimal', c)
  const bigha = landUnitSqft('bigha', c)
  return toolPageContent(LAND_ID, lang, {
    registryCrumbs: true,
    data: dataStatus([file]),
    faq: {
      title: t(lang, 'content.faq'),
      items: [
        { question: copy.faqKathaQ, answer: fill(lang, copy.faqKathaA, { sqft: num(lang, c.kathaSqft), decimal: decimal(lang, Math.round((c.kathaSqft / dec) * 100) / 100, 2) }) },
        {
          question: copy.faqBighaQ,
          answer: fill(lang, copy.faqBighaA, { katha: num(lang, c.kathaPerBigha), sqft: num(lang, bigha), decimal: num(lang, Math.round(bigha / dec)) }),
        },
      ],
    },
  })
}
