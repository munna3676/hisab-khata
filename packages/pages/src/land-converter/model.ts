// Land converter: inputs → what the calculator shows. All arithmetic is @hisab/core land.
import { calculateLand, landUnitSqft, validateLand, STANDARD_LAND_CONVENTION, type LandConvention, type LandUnit } from '@hisab/core/land'
import type { LandConventionChip } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import type { ReportErrorItem } from '@hisab/ui/overlay/ReportErrorForm'
import { areaText, landDecimals } from '../land/units.ts'
import { decimal, fill, num } from '../tool/say.ts'
import type { UnitRow } from '../tool/UnitTable.tsx'
import type { ToolOutcome } from '../tool/validation.ts'
import type { LandCopy } from './copy.ts'
import type { AreaId } from './params.ts'

/** Figma L1's table rows, then the typed unit if it is another one. */
export const TABLE_UNITS = ['decimal', 'sqft', 'katha', 'bigha', 'acre', 'sqm'] as const satisfies readonly LandUnit[]

export interface LandInput {
  lang: Lang
  copy: LandCopy
  value: number | null
  unit: LandUnit
  area: AreaId
  /** Square feet in one কাঠা when area is 'custom'. */
  kathaSqft: number | null
  conventions: readonly LandConventionChip[]
}

export interface LandView {
  label: string
  value: number
  decimals: number
  suffix: string
  sub: string
  rows: UnitRow[]
  shareText: string
}

/** The convention for an area chip: from data, or the typed কাঠা size. */
export function conventionFor(area: AreaId, kathaSqft: number | null, conventions: readonly LandConventionChip[]): Partial<LandConvention> {
  if (area === 'custom') return { kathaSqft: kathaSqft ?? STANDARD_LAND_CONVENTION.kathaSqft }
  const chip = conventions.find((c) => c.id === area)
  if (!chip) throw new Error(`land: no convention '${area}' in data/land/conventions.json`)
  return { kathaSqft: chip.kathaSqft, kathaPerBigha: chip.kathaPerBigha, kaniSqft: chip.kaniSqft }
}

const unitName = (copy: LandCopy, unit: LandUnit) => copy.unitName[unit]
const rowName = (copy: LandCopy, unit: LandUnit) => (unit in copy.rowName ? copy.rowName[unit as keyof LandCopy['rowName']] : copy.unitName[unit])

export function areaShort(lang: Lang, copy: LandCopy, area: AreaId, kathaSqft: number | null): string {
  return area === 'custom' ? fill(lang, copy.areaShort.custom, { sqft: decimal(lang, kathaSqft ?? 0, 2) }) : copy.areaShort[area]
}

export function landOutcome({ lang, copy, value, unit, area, kathaSqft, conventions }: LandInput): ToolOutcome<LandView> {
  if (value === null || (area === 'custom' && kathaSqft === null)) return { kind: 'empty' }
  const convention = conventionFor(area, kathaSqft, conventions)
  const problem = validateLand({ value, unit, convention })
  if (problem === 'convention') return { kind: 'empty', fields: { ks: copy.kathaError } }
  if (problem) return { kind: 'empty' }
  const r = calculateLand({ value, unit, convention })
  // The answer is in বর্গফুট (Figma), or in শতাংশ when বর্গফুট was typed.
  const to: LandUnit = unit === 'sqft' ? 'decimal' : 'sqft'
  const shown = r.values[to]
  const area_ = areaShort(lang, copy, area, kathaSqft)
  const n = areaText(lang, value)
  const rows = (TABLE_UNITS.includes(unit as (typeof TABLE_UNITS)[number]) ? [...TABLE_UNITS] : [...TABLE_UNITS, unit]).map((u) => ({
    key: u,
    label: rowName(copy, u),
    value: areaText(lang, r.values[u]),
    current: u === unit,
  }))
  return {
    kind: 'result',
    result: {
      label: fill(lang, copy.resultLabel, { n, unit: unitName(copy, unit) }),
      value: shown,
      decimals: landDecimals(shown),
      suffix: ` ${unitName(copy, to)}`,
      sub: fill(lang, copy.resultSub, { katha: areaText(lang, r.values.katha), area: area_, acre: num(lang, r.values.acre, 2) }),
      rows,
      shareText: fill(lang, copy.shareText, { n, unit: unitName(copy, unit), sqft: areaText(lang, r.sqft), katha: areaText(lang, r.values.katha), area: area_ }),
    },
  }
}

/** The info callout: 1 শতাংশ and 1 একর from the engine. */
export function landCallout(lang: Lang, copy: LandCopy): string {
  const dec = landUnitSqft('decimal')
  return fill(lang, copy.callout, { decimal: decimal(lang, dec, 2), acre: num(lang, landUnitSqft('acre') / dec) })
}

export function landReportItems(copy: LandCopy): ReportErrorItem[] {
  return [
    { value: 'result', label: copy.reportResult },
    { value: 'table', label: copy.reportTable },
  ]
}
