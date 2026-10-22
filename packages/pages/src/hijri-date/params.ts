import { defineParams } from '../tool/url-state.ts'

/** The inputs in a share link: /tools/hijri-date?date=2027-03-10&adj=1. Defaults: Figma D4 (today, যেমন আছে). */
export const HIJRI_PARAMS = defineParams({
  date: { kind: 'date', default: 'today', today: true, minYear: 1900, maxYear: 2099 },
  /** Moon-sighting adjustment in days on top of the data offset (chips −১ / যেমন আছে / +১). */
  adj: { kind: 'number', default: 0, min: -2, max: 2, integer: true },
})

/** The chips' adjustments (Figma: −১ দিন, যেমন আছে, +১ দিন). */
export const ADJUST_CHIPS = [-1, 0, 1] as const
