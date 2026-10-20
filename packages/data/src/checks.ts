import { isValidTariff, type ElectricityTariff } from '@hisab/core/electricity-bill'
import { isValidIncomeTaxRules } from '@hisab/core/income-tax'
import { isValidExciseTable, isValidSlabTable } from '@hisab/core/lib/finance-slabs'
import { isValidGradeScale } from '@hisab/core/lib/land-gold-edu-grading'
import { isValidMfsChannel } from '@hisab/core/mfs-charge'
import { isValidConvention } from '@hisab/core/land'
import { validateSanchayapatra } from '@hisab/core/sanchayapatra'
import { checkBounds, specFor } from './contract.ts'
import { validators } from './generated/validators.js'
import type {
  BoardGradingFile,
  ElectricityTariffFile,
  ExciseDutyFile,
  GuideFile,
  IncomeTaxFile,
  LandConventionsFile,
  MfsChargesFile,
  SanchayapatraFile,
  UgcGradingFile,
} from './types.ts'

/**
 * Everything a data file must pass before it is published or accepted by the
 * app: its JSON Schema (the generated standalone validators, no eval), the
 * contract's sanity bounds, and the @hisab/core rules a schema cannot express
 * (slab limits that rise, grade scales that fall, a channel with a first band
 * at 0…). An empty list means the file is good.
 */
export function checkDataFile(path: string, data: unknown): string[] {
  const spec = specFor(path)
  if (!spec) return [`${path}: not in the data contract (packages/data/src/contract.ts)`]
  const validate = validators[spec.schema as keyof typeof validators]
  if (!validate) return [`${path}: no generated validator for schema '${spec.schema}' (run node scripts/build-validators.mjs)`]
  if (!validate(data)) {
    return (validate.errors ?? []).map((e) => `${path}: ${e.instancePath || '/'} ${e.message ?? 'is invalid'}`)
  }
  const errors = checkBounds(spec, data).map((e) => `${path}: ${e}`)
  for (const e of ENGINE_CHECKS[spec.schema]?.(data) ?? []) errors.push(`${path}: ${e}`)
  return errors
}

type EngineCheck = (data: unknown) => string[]

/** Rules from @hisab/core, run on schema-valid data only. */
const ENGINE_CHECKS: Record<string, EngineCheck> = {
  'mfs-charges': (data) => {
    const file = data as MfsChargesFile
    const errors = file.channels.flatMap((c, i) => (isValidMfsChannel(c.value) ? [] : [`channels/${i} (${c.value.id}) is not a valid MfsChannel`]))
    const ids = file.channels.map((c) => c.value.id)
    ids.forEach((id, i) => ids.indexOf(id) !== i && errors.push(`channel id '${id}' is used twice`))
    for (const [service, id] of Object.entries(file.referenceByService)) {
      const ref = file.channels.find((c) => c.value.id === id)
      if (!ref) errors.push(`referenceByService.${service} names unknown channel '${id}'`)
      else if (ref.value.service !== service) errors.push(`referenceByService.${service} names a ${ref.value.service} channel`)
    }
    return errors
  },
  'electricity-tariff': (data) => {
    const { value } = data as ElectricityTariffFile
    const errors = Object.entries(value.tariffs).flatMap(([id, t]) => (isValidTariff(t) ? [] : [`tariff '${id}' is not valid`]))
    for (const [company, byCategory] of Object.entries(value.overrides ?? {})) {
      if (!value.companies.some((c) => c.id === company)) errors.push(`overrides name unknown company '${company}'`)
      for (const [category, override] of Object.entries(byCategory)) {
        const base = value.tariffs[category]
        const merged: ElectricityTariff | undefined = base && { ...base, ...override }
        if (!merged || !isValidTariff(merged)) errors.push(`override ${company}/${category} does not give a valid tariff`)
      }
    }
    return errors
  },
  'income-tax': (data) => (isValidIncomeTaxRules((data as IncomeTaxFile).value) ? [] : ['not valid IncomeTaxRules']),
  'excise-duty': (data) => (isValidExciseTable((data as ExciseDutyFile).value) ? [] : ['upTo must rise strictly and only the last row may be null']),
  sanchayapatra: (data) =>
    (data as SanchayapatraFile).value.flatMap((scheme) => {
      const errors: string[] = []
      if (!isValidSlabTable(scheme.rateSlabs) || !isValidSlabTable(scheme.taxSlabs)) errors.push(`scheme '${scheme.id}' has a bad slab table`)
      else if (validateSanchayapatra({ scheme, investment: scheme.minInvestment ?? 100_000 }) === 'scheme') errors.push(`scheme '${scheme.id}' is not valid`)
      return errors
    }),
  'board-grading': (data) => (isValidGradeScale((data as BoardGradingFile).value.scale) ? [] : ['grade scale is not valid']),
  'ugc-grading': (data) => (isValidGradeScale((data as UgcGradingFile).value) ? [] : ['grade scale is not valid']),
  'land-conventions': (data) =>
    (data as LandConventionsFile).value.flatMap((c) => (isValidConvention(c) ? [] : [`convention '${c.id}' is not valid`])),
  guide: (data) => {
    const guide = data as GuideFile
    const docs = new Set(guide.documents.value.map((d) => d.id))
    const errors: string[] = []
    if (docs.size !== guide.documents.value.length) errors.push('document ids are not unique')
    for (const result of guide.wizard?.results ?? []) {
      for (const id of result.documents) if (!docs.has(id)) errors.push(`wizard result '${result.title}' lists unknown document '${id}'`)
      for (const [q, option] of Object.entries(result.when)) {
        const question = guide.wizard!.questions.find((x) => x.id === q)
        if (!question?.options.some((o) => o.id === option)) errors.push(`wizard result '${result.title}' answers unknown ${q}=${option}`)
      }
    }
    return errors
  },
}
