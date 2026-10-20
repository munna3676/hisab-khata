import synonymsJson from '../../../data/search/synonyms.json' with { type: 'json' }
import { createSynonymMap, type SynonymFile, type SynonymMap } from './normalize.ts'

// The synonym file bundled with the build. The app passes a newer synced copy
// of data/search/synonyms.json to createSynonymMap instead when it has one.

export const defaultSynonyms: SynonymFile = synonymsJson as SynonymFile

let cached: SynonymMap | null = null

/** The bundled synonyms as a lookup, built once. */
export function defaultSynonymMap(): SynonymMap {
  cached ??= createSynonymMap(defaultSynonyms)
  return cached
}
