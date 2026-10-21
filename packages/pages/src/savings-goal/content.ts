// Savings goal page content (Figma C4 has no FAQ or tips). A formula tool: the presets file only
// names the "কিসের জন্য" chips, so the page has no verified line.
import type { SavingsGoalPresetsFile } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { SAVINGS_GOAL_PARAMS, type SavingsGoalPurpose } from './params.ts'

export const SAVINGS_GOAL_ID = 'savings-goal'

export const SAVINGS_GOAL_MESSAGE_KEYS = [] as const

export function savingsGoalContent(lang: Lang): ToolPageContent {
  return toolPageContent(SAVINGS_GOAL_ID, lang)
}

/** The purpose chips in data order; every preset must be a known `goal` link value. */
export function savingsGoalPurposes(file: SavingsGoalPresetsFile): Exclude<SavingsGoalPurpose, 'none'>[] {
  const known: readonly string[] = SAVINGS_GOAL_PARAMS.goal.values
  const ids = file.value.map((p) => p.id)
  const unknown = ids.filter((id) => !known.includes(id) || id === 'none')
  if (unknown.length) throw new Error(`savings-goal: add ${unknown.join(', ')} to SAVINGS_GOAL_PARAMS.goal and COPY.purposes`)
  return ids as Exclude<SavingsGoalPurpose, 'none'>[]
}
