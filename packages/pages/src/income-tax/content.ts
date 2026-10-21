// Income tax page content: the verified line from data/income-tax-<year>.json. Figma C6 has no FAQ.
import type { IncomeTaxFile } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { dataStatus } from '../tool/verification.ts'

export const INCOME_TAX_ID = 'income-tax'

export const INCOME_TAX_MESSAGE_KEYS = [] as const

/** The rules file the page reads (Figma: "স্ল্যাব: FY ২০২৬-২৭"). */
export const INCOME_TAX_FILE = 'income-tax-2026-27.json'

export function incomeTaxContent(lang: Lang, file: IncomeTaxFile): ToolPageContent {
  return toolPageContent(INCOME_TAX_ID, lang, { data: dataStatus([file]) })
}
