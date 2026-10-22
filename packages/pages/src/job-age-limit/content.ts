// Job age limit page content: the verified line from data/jobs/govt-age-limit.json. Figma D2 has no FAQ.
import type { JobAgeLimitFile } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { dataStatus } from '../tool/verification.ts'

export const JOB_AGE_ID = 'job-age-limit'

export const JOB_AGE_MESSAGE_KEYS = [] as const

export function jobAgeContent(lang: Lang, file: JobAgeLimitFile): ToolPageContent {
  return toolPageContent(JOB_AGE_ID, lang, { registryCrumbs: true, data: dataStatus([file]) })
}
