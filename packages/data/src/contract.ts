/**
 * The data contract: which files data/ holds, the JSON Schema each one must
 * pass (data/_schema/<schema>.schema.json), and sanity bounds a value must stay
 * inside even when it is schema-valid (a cash-out charge of ৳৫০০ per 1,000 is
 * a typo, not a tariff). scripts/check-data.mjs, scripts/build-manifest.mjs and
 * the runtime store all read this list, so a file is described in one place.
 *
 * No imports with runtime code: Node runs this file directly (type stripping)
 * from the scripts.
 */

/** A numeric range for every value at `path`. */
export interface Bound {
  /**
   * Dot path from the file root. `*` matches every array item or object key;
   * paths that do not exist (optional fields) are skipped.
   */
  path: string
  min: number
  max: number
}

export interface DataFileSpec {
  /** Path under data/; `*` matches one file or folder name part (never a '/'). */
  pattern: string
  /** Schema name: data/_schema/<schema>.schema.json. */
  schema: string
  /** True when the file holds Facts ({ value, source, checked }); false for editorial files. */
  facts: boolean
  /** Shipped in the app snapshot and listed in the signed data manifest. */
  bundled: boolean
  bounds?: readonly Bound[]
}

const pctBound = (path: string, max = 100): Bound => ({ path, min: 0, max })

export const DATA_FILES: readonly DataFileSpec[] = [
  {
    pattern: 'mfs-charges.json',
    schema: 'mfs-charges',
    facts: true,
    bundled: true,
    bounds: [
      { path: 'channels.*.value.bands.*.per1000', min: 0, max: 50 },
      { path: 'channels.*.value.quota.over.*.per1000', min: 0, max: 50 },
      { path: 'channels.*.value.bands.*.pct', min: 0, max: 5 },
      { path: 'channels.*.value.bands.*.flat', min: 0, max: 100 },
      { path: 'channels.*.value.quota.over.*.flat', min: 0, max: 100 },
      { path: 'channels.*.value.quota.monthlyAmount', min: 0, max: 10_000_000 },
      { path: 'channels.*.value.limits.*', min: 0, max: 10_000_000 },
    ],
  },
  { pattern: 'mfs-providers.json', schema: 'mfs-providers', facts: true, bundled: true },
  { pattern: 'banks.json', schema: 'banks', facts: true, bundled: true },
  {
    pattern: 'banks/*.json',
    schema: 'bank-rates',
    facts: true,
    bundled: true,
    bounds: [
      pctBound('fdr.value.*.ratePct', 20),
      pctBound('dps.value.*.ratePct', 20),
      pctBound('loans.value.*.ratePct', 30),
      { path: 'fdr.value.*.months', min: 1, max: 240 },
      { path: 'dps.value.*.months', min: 1, max: 240 },
    ],
  },
  {
    pattern: 'remittance.json',
    schema: 'remittance',
    facts: true,
    bundled: true,
    bounds: [
      { path: 'services.*.value.rateSpreadPct', min: -10, max: 10 },
      { path: 'services.*.value.feeLocal', min: 0, max: 1000 },
      pctBound('incentivePct.value', 10),
    ],
  },
  {
    pattern: 'electricity-tariff.json',
    schema: 'electricity-tariff',
    facts: true,
    bundled: true,
    bounds: [
      { path: 'value.tariffs.*.slabs.*.rate', min: 0, max: 50 },
      { path: 'value.tariffs.*.lifeline.rate', min: 0, max: 50 },
      { path: 'value.tariffs.*.lifeline.maxUnits', min: 0, max: 1000 },
      { path: 'value.tariffs.*.todRates.*', min: 0, max: 50 },
      { path: 'value.tariffs.*.demandChargePerKw', min: 0, max: 500 },
      { path: 'value.tariffs.*.meterRent.*', min: 0, max: 2000 },
      pctBound('value.tariffs.*.vatPct'),
      pctBound('value.tariffs.*.rebate.pct', 10),
    ],
  },
  {
    pattern: 'income-tax-*.json',
    schema: 'income-tax',
    facts: true,
    bundled: true,
    bounds: [
      { path: 'value.thresholds.*', min: 100_000, max: 2_000_000 },
      pctBound('value.slabs.*.ratePct', 50),
      pctBound('value.rebate.incomePct', 50),
      pctBound('value.rebate.investmentPct', 50),
      { path: 'value.minimumTax.*', min: 0, max: 50_000 },
      { path: 'value.slabs.*.width', min: 10_000, max: 10_000_000 },
      { path: 'value.disabledDependentExtra', min: 0, max: 500_000 },
      { path: 'value.rebate.cap', min: 0, max: 10_000_000 },
    ],
  },
  {
    pattern: 'data-packs.json',
    schema: 'data-packs',
    facts: true,
    bundled: true,
    bounds: [
      { path: 'packs.*.value.*.price', min: 1, max: 20_000 },
      { path: 'packs.*.value.*.dataGb', min: 0.01, max: 5000 },
      { path: 'packs.*.value.*.validityDays', min: 1, max: 400 },
    ],
  },
  {
    pattern: 'commerce/couriers.json',
    schema: 'couriers',
    facts: true,
    bundled: true,
    bounds: [
      { path: '*.value.zones.*.slabs.*.charge', min: 0, max: 2000 },
      { path: '*.value.zones.*.extra.charge', min: 0, max: 1000 },
      pctBound('*.value.zones.*.codPct', 5),
      pctBound('*.value.returnChargePct'),
      { path: '*.value.zones.*.slabs.*.maxKg', min: 0.1, max: 100 },
      { path: '*.value.zones.*.extra.stepKg', min: 0.1, max: 100 },
    ],
  },
  { pattern: 'commerce/delivery-zones.json', schema: 'delivery-zones', facts: true, bundled: true },
  {
    pattern: 'commerce/vat-rates.json',
    schema: 'vat-rates',
    facts: true,
    bundled: true,
    bounds: [pctBound('rates.value.*.pct'), pctBound('defaultPct.value')],
  },
  { pattern: 'commerce/sd-rates.json', schema: 'sd-rates', facts: true, bundled: true, bounds: [pctBound('rates.value.*.pct', 500)] },
  {
    pattern: 'finance/interest-tax.json',
    schema: 'interest-tax',
    facts: true,
    bundled: true,
    bounds: [pctBound('value.withTinPct', 50), pctBound('value.withoutTinPct', 50)],
  },
  {
    pattern: 'finance/excise-duty.json',
    schema: 'excise-duty',
    facts: true,
    bundled: true,
    bounds: [{ path: 'value.*.duty', min: 0, max: 100_000 }],
  },
  { pattern: 'finance/loan-dbr.json', schema: 'loan-dbr', facts: true, bundled: true, bounds: [{ path: 'value.*', min: 10, max: 100 }] },
  { pattern: 'finance/loan-caps.json', schema: 'loan-caps', facts: true, bundled: true },
  { pattern: 'finance/loan-fees.json', schema: 'loan-fees', facts: true, bundled: true, bounds: [pctBound('value.processingFeePct', 5)] },
  { pattern: 'finance/salary-presets.json', schema: 'salary-presets', facts: true, bundled: true },
  {
    pattern: 'finance/sanchayapatra.json',
    schema: 'sanchayapatra',
    facts: true,
    bundled: true,
    bounds: [
      { path: 'value.*.rateSlabs.*.ratePct', min: 1, max: 20 },
      pctBound('value.*.taxSlabs.*.taxPct', 30),
      { path: 'value.*.years', min: 1, max: 10 },
      { path: 'value.*.minInvestment', min: 1000, max: 100_000_000 },
      { path: 'value.*.maxInvestment', min: 1000, max: 100_000_000 },
    ],
  },
  { pattern: 'finance/savings-goal-presets.json', schema: 'savings-goal-presets', facts: true, bundled: true },
  {
    pattern: 'finance/currency-rates.json',
    schema: 'currency-rates',
    facts: true,
    bundled: true,
    bounds: [
      { path: 'value.rates.*.buy', min: 0.01, max: 1000 },
      { path: 'value.rates.*.sell', min: 0.01, max: 1000 },
    ],
  },
  {
    pattern: 'gold/bajus-rates.json',
    schema: 'bajus-rates',
    facts: true,
    bundled: true,
    bounds: [
      { path: 'value.gold.*', min: 10_000, max: 1_000_000 },
      { path: 'value.silver.*', min: 100, max: 50_000 },
    ],
  },
  {
    pattern: 'gold/jewellery-rules.json',
    schema: 'jewellery-rules',
    facts: true,
    bundled: true,
    bounds: [
      pctBound('value.minMakingPct', 30),
      pctBound('value.vatPct', 20),
      { path: 'value.vatPerVori', min: 0, max: 20_000 },
      pctBound('value.exchangeDeductionPct', 50),
      pctBound('value.buybackDeductionPct', 50),
    ],
  },
  {
    pattern: 'religion/zakat.json',
    schema: 'zakat',
    facts: true,
    bundled: true,
    bounds: [
      { path: 'value.nisabGoldVori', min: 1, max: 20 },
      { path: 'value.nisabSilverVori', min: 10, max: 100 },
      pctBound('value.ratePct', 10),
    ],
  },
  {
    pattern: 'religion/fitra.json',
    schema: 'fitra',
    facts: true,
    bundled: true,
    bounds: [
      { path: 'value.items.*.perPerson', min: 10, max: 20_000 },
      // Half a sa' of wheat to one sa' of the rest: about 1.6 to 3.5 kg.
      { path: 'value.items.*.kgPerPerson', min: 0.5, max: 10 },
    ],
  },
  {
    pattern: 'religion/sehri-iftar-method.json',
    schema: 'sehri-iftar-method',
    facts: true,
    bundled: true,
    bounds: [
      { path: 'value.fajrAngle', min: 12, max: 20 },
      { path: 'value.sehriPrecautionMin', min: 0, max: 10 },
      { path: 'value.iftarPrecautionMin', min: 0, max: 10 },
      { path: 'value.utcOffsetMinutes', min: 300, max: 420 },
    ],
  },
  { pattern: 'religion/ramadan.json', schema: 'ramadan', facts: true, bundled: true },
  { pattern: 'dates/hijri-offset.json', schema: 'hijri-offset', facts: true, bundled: true, bounds: [{ path: 'value', min: -2, max: 2 }] },
  { pattern: 'dates/special-days.json', schema: 'special-days', facts: true, bundled: true },
  { pattern: 'dates/weekend.json', schema: 'weekend', facts: true, bundled: true },
  { pattern: 'dates/holidays-*.json', schema: 'holidays', facts: true, bundled: true },
  {
    pattern: 'jobs/govt-age-limit.json',
    schema: 'job-age-limit',
    facts: true,
    bundled: true,
    bounds: [
      { path: 'value.maxYears', min: 18, max: 65 },
      { path: 'value.presets.*', min: 18, max: 65 },
      { path: 'value.extensions.*.years', min: 0, max: 10 },
    ],
  },
  {
    pattern: 'land/conventions.json',
    schema: 'land-conventions',
    facts: true,
    bundled: true,
    bounds: [
      { path: 'value.*.kathaSqft', min: 500, max: 1000 },
      { path: 'value.*.kathaPerBigha', min: 10, max: 40 },
      { path: 'value.*.kaniSqft', min: 5000, max: 50_000 },
    ],
  },
  {
    pattern: 'land/registration-costs.json',
    schema: 'land-registration-costs',
    facts: true,
    bundled: true,
    bounds: [pctBound('value.*.pct', 20), { path: 'value.*.fixed', min: 0, max: 100_000 }, { path: 'value.*.perUnit', min: 0, max: 10_000_000 }],
  },
  { pattern: 'education/board-grading.json', schema: 'board-grading', facts: true, bundled: true, bounds: [{ path: 'value.scale.*.point', min: 0, max: 5 }] },
  { pattern: 'education/board-subjects.json', schema: 'board-subjects', facts: true, bundled: true },
  { pattern: 'education/ugc-grading.json', schema: 'ugc-grading', facts: true, bundled: true, bounds: [{ path: 'value.*.point', min: 0, max: 4 }] },
  { pattern: 'districts.json', schema: 'districts', facts: true, bundled: true },
  { pattern: 'guides/*.json', schema: 'guide', facts: true, bundled: true, bounds: [{ path: 'fees.value.*.amount', min: 0, max: 1_000_000 }] },
  { pattern: 'search/synonyms.json', schema: 'synonyms', facts: false, bundled: true },
  { pattern: 'text/name-variants.json', schema: 'name-variants', facts: false, bundled: true },
  { pattern: 'changelog.json', schema: 'changelog', facts: false, bundled: true },
  // Pages are part of the app code; the registry is never updated over the air.
  { pattern: 'registry/tools.json', schema: 'registry', facts: false, bundled: false },
]

/** True when `path` (relative to data/, with '/') matches `pattern`. */
export function matchesPattern(pattern: string, path: string): boolean {
  const re = new RegExp('^' + pattern.split('*').map(escapeRegExp).join('[^/]*') + '$')
  return re.test(path)
}

function escapeRegExp(text: string): string {
  return text.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
}

/** The contract entry for a data file, or undefined for a file the contract does not know. */
export function specFor(path: string): DataFileSpec | undefined {
  return DATA_FILES.find((spec) => matchesPattern(spec.pattern, path))
}

/** Every value at a bound path, with a readable location ('channels/3/value/bands/0/per1000'). */
export function valuesAt(data: unknown, path: string): { at: string; value: unknown }[] {
  let found: { at: string; value: unknown }[] = [{ at: '', value: data }]
  for (const part of path.split('.')) {
    const next: { at: string; value: unknown }[] = []
    for (const { at, value } of found) {
      if (!value || typeof value !== 'object') continue
      const keys = part === '*' ? Object.keys(value) : Object.hasOwn(value, part) ? [part] : []
      for (const key of keys) next.push({ at: at ? `${at}/${key}` : key, value: (value as Record<string, unknown>)[key] })
    }
    found = next
  }
  return found
}

/** Messages for every value outside its bound (null values, as in an open slab, are skipped). */
export function checkBounds(spec: DataFileSpec, data: unknown): string[] {
  const errors: string[] = []
  for (const bound of spec.bounds ?? []) {
    for (const { at, value } of valuesAt(data, bound.path)) {
      if (value === null) continue
      if (typeof value !== 'number' || !(value >= bound.min && value <= bound.max)) {
        errors.push(`${at} = ${JSON.stringify(value)} is outside ${bound.min}…${bound.max}`)
      }
    }
  }
  return errors
}
