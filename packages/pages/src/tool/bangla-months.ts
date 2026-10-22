// Bangla month names in the page language, from the Bangla calendar engine. Only the pages that
// show a Bangla date import this (date-say.ts stays free of the engine).
import { BANGLA_MONTHS_BN, BANGLA_MONTHS_EN } from '@hisab/core/bangla-date'
import type { Lang } from '@hisab/i18n/locale'

export const banglaMonths = (lang: Lang): readonly string[] => (lang === 'bn' ? BANGLA_MONTHS_BN : BANGLA_MONTHS_EN)
