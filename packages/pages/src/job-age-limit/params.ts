import { defineParams } from '../tool/url-state.ts'

/** The inputs in a share link: /tools/job-age-limit?birth=1995-01-10&ref=2026-12-31&max=30. Defaults: Figma D2. */
export const JOB_AGE_PARAMS = defineParams({
  birth: { kind: 'date', default: '1997-03-15', minYear: 1900, maxYear: 2100 },
  /** The circular's age reference date ("সার্কুলারে বয়স গণনার তারিখ"). */
  ref: { kind: 'date', default: '2026-10-31', minYear: 1900, maxYear: 2100 },
  /** Upper limit in years; the default is data/jobs/govt-age-limit.json maxYears (a test checks it). */
  max: { kind: 'number', default: 32, min: 1, max: 100, integer: true },
})
