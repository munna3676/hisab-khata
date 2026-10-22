import { ALL_LAND_UNITS } from '../land/units.ts'
import { defineParams } from '../tool/url-state.ts'

/** The inputs in a share link: /tools/land-price?area=10&unit=decimal&price=500000. Defaults: Figma L2. */
export const LAND_PRICE_PARAMS = defineParams({
  area: { kind: 'number', default: 5, min: 0, max: 1_000_000_000_000 },
  /** The unit of the area and of the price ("প্রতি কাঠার দাম"). */
  unit: { kind: 'enum', default: 'katha', values: ALL_LAND_UNITS },
  price: { kind: 'number', default: 2_500_000, min: 0, max: 10_000_000_000_000 },
})
