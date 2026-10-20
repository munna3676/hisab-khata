/// <reference types="node" />
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSearchIndex, serializeIndex, type GuideText } from './index.ts'

// Build step: writes the serialized index for the page bundle to load lazily.
//   node packages/search/src/build-index.ts <out.json>

const DATA = fileURLToPath(new URL('../../../data/', import.meta.url))

/** Every data/guides/<slug>.json, for the titles, summaries and FAQ questions. */
export function readGuides(dir = join(DATA, 'guides')): GuideText[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as GuideText)
}

/** The serialized index over the registry and the guides. */
export function buildIndexJson(): string {
  return serializeIndex(buildSearchIndex({ guides: readGuides() }))
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const out = process.argv[2]
  if (!out) {
    console.error('usage: node packages/search/src/build-index.ts <out.json>')
    process.exit(1)
  }
  const json = buildIndexJson()
  writeFileSync(out, json)
  console.log(`search index: ${(json.length / 1024).toFixed(0)} KB → ${out}`)
}
