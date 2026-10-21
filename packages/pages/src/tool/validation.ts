// Validation states every calculator page shares. A tool's model turns its inputs into a
// ToolOutcome: nothing to show yet (empty), an error the person can fix (C1-d "ভুল ইনপুট"), or a
// result. The page renders the three the same way for every tool (ToolResultArea).
import { parseAmount } from '@hisab/core/lib/digits'
import { formatNumberIn } from '@hisab/i18n/format'
import type { Lang } from '@hisab/i18n/locale'
import { t } from '@hisab/i18n/t'

/** What a number field holds right now. */
export type NumberStatus =
  | { state: 'empty' }
  | { state: 'invalid' }
  | { state: 'min'; value: number; min: number }
  | { state: 'max'; value: number; max: number }
  | { state: 'ok'; value: number }

export interface NumberRules {
  min?: number
  max?: number
  integer?: boolean
}

/** Reads typed text (Bangla or English digits, commas, ৳) against the field's rules. */
export function checkNumber(text: string | null | undefined, rules: NumberRules = {}): NumberStatus {
  if (text == null || text.trim() === '') return { state: 'empty' }
  const value = parseAmount(text)
  if (value === null || (rules.integer && !Number.isInteger(value))) return { state: 'invalid' }
  if (rules.min !== undefined && value < rules.min) return { state: 'min', value, min: rules.min }
  if (rules.max !== undefined && value > rules.max) return { state: 'max', value, max: rules.max }
  return { state: 'ok', value }
}

/** The usable number, or null for empty/invalid/out-of-range text. */
export function numberOf(status: NumberStatus): number | null {
  return status.state === 'ok' ? status.value : null
}

/** An error the result area shows instead of a result, with an optional one-tap fix. */
export interface ToolError {
  /** e.g. "এই পরিমাণ একদিনে তোলা যাবে না". */
  title: string
  body: string
  /** The button that applies a fix, e.g. "৳৩০,০০০ দিয়ে হিসাব করো". */
  fix?: { label: string; field: string; value: number }
}

export type ToolOutcome<R> =
  | { kind: 'empty'; fields?: Record<string, string> }
  | { kind: 'error'; error: ToolError; fields?: Record<string, string> }
  | { kind: 'result'; result: R; fields?: Record<string, string> }

/**
 * The field message for a number outside what the engine accepts (validation.min / validation.max
 * in the page language), or undefined when it is fine. `min` is inclusive; `integer` asks for a
 * whole number. The tool's message list needs validation.min and validation.max (in TOOL_MESSAGE_KEYS).
 */
export function rangeMessage(
  value: number,
  rules: { min?: number; max?: number; integer?: boolean },
  say: { min: (min: number) => string; max: (max: number) => string; whole: () => string },
): string | undefined {
  if (rules.min !== undefined && value < rules.min) return say.min(rules.min)
  if (rules.max !== undefined && value > rules.max) return say.max(rules.max)
  if (rules.integer && !Number.isInteger(value)) return say.whole()
  return undefined
}

/** rangeMessage's wording in the page language; `whole` is the tool's own "whole number" message. */
export function rangeSay(lang: Lang, whole: string) {
  return {
    min: (min: number) => t(lang, 'validation.min', { min: formatNumberIn(lang, min) }),
    max: (max: number) => t(lang, 'validation.max', { max: formatNumberIn(lang, max) }),
    whole: () => whole,
  }
}

/** A message per field whose value the engine would refuse (empty object when all are fine). */
export function fieldIssues<K extends string>(
  values: Record<K, number>,
  limits: Record<K, { min?: number; max?: number; integer?: boolean }>,
  say: ReturnType<typeof rangeSay>,
): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {}
  for (const key of Object.keys(limits) as K[]) {
    const message = rangeMessage(values[key], limits[key], say)
    if (message) out[key] = message
  }
  return out
}
