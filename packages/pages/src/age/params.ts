import { defineParams } from '../tool/url-state.ts'

/** The inputs in a share link: /tools/age?birth=2000-03-15&on=2027-01-01. Defaults: Figma D1 ("আজ" = today). */
export const AGE_PARAMS = defineParams({
  birth: { kind: 'date', default: '2000-03-15', minYear: 1900, maxYear: 2100 },
  /** 'today' (the আজ chip) or a date. */
  on: { kind: 'date', default: 'today', today: true, minYear: 1900, maxYear: 2100 },
})
