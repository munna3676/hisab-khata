// Native checkboxes and radios change their own `checked` before Preact hears about it.
// Preact core does not undo that for controlled inputs, so a parent that declines a
// change (or has not updated yet) would leave the box out of step with its prop.
// Re-rendering resyncs it: Preact compares `checked` against the live DOM value.
import { useReducer } from 'preact/hooks'

export function useResync(): () => void {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  return () => bump(undefined)
}
