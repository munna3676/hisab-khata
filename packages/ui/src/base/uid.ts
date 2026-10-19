// Stable, page-unique ids for label/for, aria-describedby and radio names.
// Preact's useId() restarts for every Astro island (each island is its own render
// root), so two islands on one page would share ids. A module counter with a
// different prefix on the server and in the browser keeps every id unique:
// hydration keeps the server's ids in the DOM, and ids made later in the browser
// can never clash with them.
import { useMemo } from 'preact/hooks'

const side = typeof window === 'undefined' ? 's' : 'c'
let counter = 0

export function nextUid(prefix = 'hk'): string {
  counter += 1
  return `${prefix}-${side}${counter.toString(36)}`
}

/** Returns `id` when given, otherwise an id that stays the same for this component's life. */
export function useUid(id?: string, prefix = 'hk'): string {
  const generated = useMemo(() => nextUid(prefix), [prefix])
  return id ?? generated
}
