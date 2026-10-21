import { defineParams } from '../tool/url-state.ts'

/**
 * The inputs in a share link: /tools/salary?gross=80000&basic=50&rent=60. Defaults: Figma C5
 * (৳৫০,০০০, basic 60% of gross, house rent 50% of basic), which are also the "common" preset in
 * data/finance/salary-presets.json (checked by a test).
 */
export const SALARY_PARAMS = defineParams({
  gross: { kind: 'number', default: 50000, min: 0, max: 10_000_000_000 },
  basic: { kind: 'number', default: 60, min: 0, max: 100 },
  rent: { kind: 'number', default: 50, min: 0, max: 100 },
})

/** The preset the page starts from (data/finance/salary-presets.json). */
export const SALARY_PRESET = 'common'

/** What validateSalary accepts. */
export const SALARY_LIMITS = { gross: { min: 1 }, basic: { min: 1, max: 100 }, rent: { min: 0, max: 100 } } as const
