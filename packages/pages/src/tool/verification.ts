import type { Fact } from '@hisab/data/types'

/** A Fact is unverified until someone checks it at the source (data/README: note "unverified…"). */
export const isUnverifiedFact = (fact: Fact<unknown>) => typeof fact.note === 'string' && /^unverified\b/i.test(fact.note)

/** What the page head's verified line shows for the Facts a tool uses. */
export interface DataStatus {
  /** Every Fact has been checked at its source; false shows the "যাচাই বাকি" state. */
  verified: boolean
  /** The oldest check among them (YYYY-MM-DD). */
  checked: string
  /** That Fact's official page. */
  source: string
}

export function dataStatus(facts: readonly Fact<unknown>[]): DataStatus {
  if (facts.length === 0) throw new Error('dataStatus: a data-backed tool needs at least one Fact')
  const oldest = [...facts].sort((a, b) => a.checked.localeCompare(b.checked))[0]!
  return { verified: !facts.some(isUnverifiedFact), checked: oldest.checked, source: oldest.source }
}
