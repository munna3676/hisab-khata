// Age calculator: a formula tool (no data, no verified line) with the Figma D1 FAQ.
import type { Lang } from '@hisab/i18n/locale'
import { t } from '@hisab/i18n/messages'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { COPY } from './copy.ts'

export const AGE_ID = 'age'

export const AGE_MESSAGE_KEYS = [] as const

export function ageContent(lang: Lang): ToolPageContent {
  return toolPageContent(AGE_ID, lang, {
    registryCrumbs: true,
    faq: { title: t(lang, 'content.faq'), items: [{ question: COPY.faqQ1[lang], answer: COPY.faqA1[lang] }] },
  })
}
