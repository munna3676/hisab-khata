import { ALL_LAND_UNITS } from '../land/units.ts'
import { defineParams } from '../tool/url-state.ts'

/**
 * The inputs in a share link: /tools/land-converter?n=5&unit=katha&area=custom&ks=726.
 * Defaults: Figma L1 (১০ শতাংশ, ঢাকা · ৭২০ বর্গফুট).
 */
export const LAND_PARAMS = defineParams({
  n: { kind: 'number', default: 10, min: 0, max: 1_000_000_000_000 },
  unit: { kind: 'enum', default: 'decimal', values: ALL_LAND_UNITS },
  /** data/land/conventions.json ids (a test checks them), or 'custom' for a typed কাঠা size. */
  area: { kind: 'enum', default: 'standard', values: ['standard', 'chattogram', 'cumilla', 'custom'] as const },
  /** Square feet in one কাঠা for area=custom. */
  ks: { kind: 'number', default: 720, min: 0, max: 1_000_000 },
})

export type AreaId = 'standard' | 'chattogram' | 'cumilla' | 'custom'
