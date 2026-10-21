// Salary breakdown page content: the verified line from data/finance/salary-presets.json.
import type { SalaryPreset, SalaryPresetsFile } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { dataStatus } from '../tool/verification.ts'
import type { SalaryRest } from './model.ts'
import { SALARY_PRESET } from './params.ts'

export const SALARY_ID = 'salary'

export const SALARY_MESSAGE_KEYS = [] as const

/** The "common" structure from the data file. */
export function salaryPreset(file: SalaryPresetsFile): SalaryPreset {
  const preset = file.structures.value.find((s) => s.id === SALARY_PRESET)
  if (!preset) throw new Error(`salary: data/finance/salary-presets.json has no '${SALARY_PRESET}' structure`)
  return preset
}

/** What the island needs from the preset besides the two fields. */
export function salaryRest(file: SalaryPresetsFile): SalaryRest {
  const { medicalPctOfBasic, conveyance } = salaryPreset(file)
  return { medicalPctOfBasic, conveyance }
}

export function salaryContent(lang: Lang, file: SalaryPresetsFile): ToolPageContent {
  return toolPageContent(SALARY_ID, lang, { data: dataStatus([file.structures]) })
}
