// Validation states every calculator page shares. A tool's model turns its inputs into a
// ToolOutcome: nothing to show yet (empty), an error the person can fix (C1-d "ভুল ইনপুট"), or a
// result. The page renders the three the same way for every tool (ToolResultArea).
import { parseAmount } from '@hisab/core/lib/digits'

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
  | { kind: 'empty' }
  | { kind: 'error'; error: ToolError; fields?: Record<string, string> }
  | { kind: 'result'; result: R; fields?: Record<string, string> }
