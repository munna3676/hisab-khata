import { defineParams } from '../tool/url-state.ts'

/** The inputs in a share link: /tools/savings-goal?target=300000&months=12&goal=bike. Defaults: Figma C4. */
export const SAVINGS_GOAL_PARAMS = defineParams({
  target: { kind: 'number', default: 500000, min: 0, max: 10_000_000_000 },
  months: { kind: 'number', default: 24, min: 0, max: 1200 },
  rate: { kind: 'number', default: 6, min: 0, max: 100 },
  /** "কিসের জন্য" chip: the ids of data/finance/savings-goal-presets.json (checked by a test), or none. */
  goal: { kind: 'enum', default: 'none', values: ['none', 'wedding', 'bike', 'study-abroad', 'emergency-fund'] as const },
})

export type SavingsGoalPurpose = 'none' | 'wedding' | 'bike' | 'study-abroad' | 'emergency-fund'

/** What the engine accepts (validateSavingsGoal). */
export const SAVINGS_GOAL_LIMITS = {
  target: { min: 1 },
  months: { min: 1, max: 600, integer: true },
  rate: { min: 0, max: 100 },
} as const
