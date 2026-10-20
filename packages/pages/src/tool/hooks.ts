import { useEffect, useState } from 'preact/hooks'
import { defaultValues, readParams, writeParams, type EnumParam, type ParamSchema } from './url-state.ts'

/** Live input values: numbers may be null while a field is empty or not a number (left out of the URL). */
export type InputValues<S extends ParamSchema> = {
  -readonly [K in keyof S]: S[K] extends EnumParam<infer V> ? V : number | null
}

/**
 * Inputs kept in step with the URL query. The server renders the defaults (so the page has a
 * result without JS); after hydration the values in the address bar win, and every change
 * rewrites the query with history.replaceState (no new history entry per keystroke). The
 * canonical link in <head> is never touched.
 */
export function useUrlState<S extends ParamSchema>(schema: S) {
  const [values, setValues] = useState<InputValues<S>>(() => defaultValues(schema) as InputValues<S>)
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    const { values: fromUrl, present } = readParams(schema, window.location.search)
    if (present.length > 0) {
      setValues(fromUrl as InputValues<S>)
    }
    setRestored(true)
  }, [])

  useEffect(() => {
    if (!restored) return
    const { pathname, search, hash } = window.location
    const next = writeParams(schema, values as Record<string, unknown> as never)
    if (next !== search && !(next === '' && search === '')) {
      try {
        window.history.replaceState(window.history.state, '', pathname + next + hash)
      } catch {
        // Sandboxed frames can refuse replaceState; the page still works, the link just isn't updated.
      }
    }
  }, [values, restored])

  const set = <K extends keyof S>(key: K, value: InputValues<S>[K]) => setValues((cur) => (cur[key] === value ? cur : { ...cur, [key]: value }))
  return { values, set, setValues, restored }
}

/** Swaps the page head's subtitle (data-tool-subtitle) for one that fits the chosen mode. */
export function useSubtitle(text: string) {
  useEffect(() => {
    const el = document.querySelector('[data-tool-subtitle]')
    if (el && el.textContent !== text) el.textContent = text
  }, [text])
}
