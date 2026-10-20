// Calculator inputs ⇄ the URL query, so a shared link restores the result
// (docs/decisions/0001-stack.md, Share, print and PDF: "Share links store inputs in query
// parameters while the canonical URL stays clean"). A tool declares its inputs once as a
// ParamSchema; readParams/writeParams are pure (unit-tested), useUrlState wires them to the page.
import { parseAmount } from '@hisab/core/lib/digits'

export interface NumberParam {
  kind: 'number'
  default: number
  /** Values outside [min, max] in a link are ignored (the default is used and an issue reported). */
  min?: number
  max?: number
  /** Whole numbers only (counts, months). */
  integer?: boolean
}

export interface EnumParam<V extends string = string> {
  kind: 'enum'
  default: V
  values: readonly V[]
}

export type ParamSpec = NumberParam | EnumParam

/** Input name → how it is stored in the URL. The key is the query parameter name (short, ASCII). */
export type ParamSchema = Record<string, ParamSpec>

/** The typed values a schema describes: numbers for number params, the union of values for enums. */
export type ParamValues<S extends ParamSchema> = {
  -readonly [K in keyof S]: S[K] extends EnumParam<infer V> ? V : number
}

/** A query parameter that was present but could not be used (it falls back to the default). */
export interface ParamIssue {
  key: string
  value: string
  reason: 'invalid' | 'min' | 'max' | 'unknown-value'
}

/** Helper that keeps enum literal types: defineParams({ mode: { kind: 'enum', default: 'charge', values: ['charge', 'max'] as const } }). */
export function defineParams<const S extends ParamSchema>(schema: S): S {
  return schema
}

export function defaultValues<S extends ParamSchema>(schema: S): ParamValues<S> {
  const out: Record<string, unknown> = {}
  for (const [key, spec] of Object.entries(schema)) out[key] = spec.default
  return out as ParamValues<S>
}

function readNumber(spec: NumberParam, raw: string): number | ParamIssue['reason'] {
  // Bangla digits, commas and a leading ৳ are accepted (a link typed by hand or pasted from chat).
  const value = parseAmount(raw)
  if (value === null || (spec.integer && !Number.isInteger(value))) return 'invalid'
  if (spec.min !== undefined && value < spec.min) return 'min'
  if (spec.max !== undefined && value > spec.max) return 'max'
  return value
}

/**
 * The values in a query string ('?amount=5000&mode=max' or URLSearchParams). Missing keys get the
 * default; unusable ones get the default and are listed in `issues`. Unknown keys are ignored
 * (utm_*, fbclid…).
 */
export function readParams<S extends ParamSchema>(
  schema: S,
  search: string | URLSearchParams,
): { values: ParamValues<S>; issues: ParamIssue[]; present: (keyof S)[] } {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search
  const values = defaultValues(schema) as Record<string, unknown>
  const issues: ParamIssue[] = []
  const present: (keyof S)[] = []
  for (const [key, spec] of Object.entries(schema)) {
    const raw = params.get(key)
    if (raw === null || raw.trim() === '') continue
    if (spec.kind === 'enum') {
      if ((spec.values as readonly string[]).includes(raw)) {
        values[key] = raw
        present.push(key)
      } else issues.push({ key, value: raw, reason: 'unknown-value' })
      continue
    }
    const value = readNumber(spec, raw)
    if (typeof value === 'number') {
      values[key] = value
      present.push(key)
    } else issues.push({ key, value: raw, reason: value })
  }
  return { values: values as ParamValues<S>, issues, present }
}

/**
 * The query string for these values, '' when every value is the default. Keys follow the schema's
 * order and numbers use plain Latin digits without grouping, so the same inputs always give the
 * same link. Values equal to the default are left out to keep links short.
 */
export function writeParams<S extends ParamSchema>(schema: S, values: Partial<ParamValues<S>>): string {
  const params = new URLSearchParams()
  for (const [key, spec] of Object.entries(schema)) {
    const value = (values as Record<string, unknown>)[key]
    if (value === undefined || value === null || value === spec.default) continue
    if (spec.kind === 'number') {
      if (typeof value !== 'number' || !Number.isFinite(value)) continue
      params.set(key, String(value))
    } else if ((spec.values as readonly string[]).includes(String(value))) {
      params.set(key, String(value))
    }
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

/** pathname + query (+ hash): the share link for these values on the current page. */
export function shareUrl<S extends ParamSchema>(origin: string, pathname: string, schema: S, values: Partial<ParamValues<S>>): string {
  return `${origin}${pathname}${writeParams(schema, values)}`
}
