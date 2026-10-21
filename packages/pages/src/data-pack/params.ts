import { defineParams } from '../tool/url-state.ts'

/** The inputs in a share link: /tools/data-pack?budget=150&days=7&op=gp. Defaults: Figma C8 (৳৪০০, ৩০ দিন, সব). */
export const DATA_PACK_PARAMS = defineParams({
  budget: { kind: 'number', default: 400, min: 0, max: 1_000_000 },
  days: { kind: 'number', default: 30, min: 1, max: 365, integer: true },
  /** Operator ids of data/data-packs.json, or all (a test checks they match). */
  op: { kind: 'enum', default: 'all', values: ['all', 'gp', 'robi', 'banglalink', 'teletalk'] as const },
})

export type OperatorChoice = 'all' | 'gp' | 'robi' | 'banglalink' | 'teletalk'

/** Validity chips (Figma: ৩ দিন, ৭ দিন, ৩০ দিন). */
export const VALIDITY_CHIPS = [3, 7, 30] as const

export const OPERATOR_CHIPS = ['all', 'gp', 'robi', 'banglalink', 'teletalk'] as const

export const DATA_PACK_LIMITS = { budget: { min: 0 }, days: { min: 1, max: 365, integer: true } } as const
