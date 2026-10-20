// Page-unique ids for aria-controls / aria-labelledby inside content components.
// Preact's useId() restarts in every Astro island (each is its own render root), so
// two islands would share ids. A module counter with a server/browser prefix keeps
// them unique: hydration keeps the server's ids, later browser ids cannot clash.
import { useMemo } from 'preact/hooks'

const side = typeof window === 'undefined' ? 's' : 'c'
let counter = 0

export function contentUid(prefix = 'hkc'): string {
  counter += 1
  return `${prefix}-${side}${counter.toString(36)}`
}

/** Returns `id` when given, otherwise an id that stays the same for the component's life. */
export function useContentUid(id?: string, prefix = 'hkc'): string {
  const generated = useMemo(() => contentUid(prefix), [prefix])
  return id ?? generated
}
