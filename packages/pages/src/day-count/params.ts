import { defineParams } from '../tool/url-state.ts'

/** The inputs in a share link: /tools/day-count?start=2026-01-01&end=2026-12-31&inc=yes. Defaults: Figma D5 (শেষ তারিখ = today). */
export const DAY_COUNT_PARAMS = defineParams({
  start: { kind: 'date', default: '2026-01-01', minYear: 1900, maxYear: 2100 },
  end: { kind: 'date', default: 'today', today: true, minYear: 1900, maxYear: 2100 },
  /** শেষের দিনটাও গুনবো? */
  inc: { kind: 'enum', default: 'no', values: ['no', 'yes'] as const },
})
