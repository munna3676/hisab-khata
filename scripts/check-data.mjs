// Checks every file in data/ against the data contract (packages/data/src/contract.ts):
// - the file is known to the contract and passes its JSON Schema (data/_schema),
//   the sanity bounds and the @hisab/core rules (packages/data/src/checks.ts);
// - every Fact ({ value, source, checked }) has a source URL and a real date;
//   one checked more than WARN_DAYS ago is a warning, more than FAIL_DAYS ago an error;
// - a Fact whose note starts with "unverified" fails, unless --allow-unverified
//   (CI uses it while the seeded values are still being verified);
// - a file that should hold Facts but has none yet (an empty list) is a warning;
// - every data file the page registry names exists.
// Usage: node scripts/check-data.mjs [--today=YYYY-MM-DD] [--allow-unverified] [--root=<data dir>]
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { checkDataFile } from '../packages/data/src/checks.ts'
import { specFor } from '../packages/data/src/contract.ts'

const WARN_DAYS = 60
const FAIL_DAYS = 120
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3)
const root = resolve(arg('root') ?? new URL('../data/', import.meta.url).pathname)
const todayArg = arg('today')
const today = todayArg ? new Date(todayArg + 'T00:00:00Z') : new Date()
const allowUnverified = process.argv.includes('--allow-unverified')
if (Number.isNaN(today.getTime())) {
  console.error(`ERROR  --today=${todayArg} is not a date`)
  process.exit(1)
}

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name)
    if (name.startsWith('_') || name.startsWith('.')) continue
    if (statSync(path).isDirectory()) walk(path)
    else if (name.endsWith('.json')) files.push(path)
  }
}
walk(root)

const errors = []
const warnings = []
const unverified = []
const empty = []
let facts = 0

const visit = (node, file, path, onFact) => {
  if (Array.isArray(node)) return node.forEach((child, i) => visit(child, file, `${path}/${i}`, onFact))
  if (!node || typeof node !== 'object') return
  if ('checked' in node || 'source' in node) return onFact(node, `${file}:${path || '/'}`)
  for (const [key, child] of Object.entries(node)) visit(child, file, `${path}/${key}`, onFact)
}

const checkFact = (fact, where) => {
  facts++
  if (!('value' in fact)) errors.push(`${where} has no value`)
  if (typeof fact.source !== 'string' || !/^https?:\/\//.test(fact.source)) errors.push(`${where} has no source URL`)
  const checked = typeof fact.checked === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fact.checked) ? new Date(fact.checked + 'T00:00:00Z') : null
  if (!checked || Number.isNaN(checked.getTime())) return errors.push(`${where} has a bad checked date: ${fact.checked}`)
  const days = Math.floor((today - checked) / 86400000)
  if (days < 0) return errors.push(`${where} is checked in the future (${fact.checked})`)
  if (typeof fact.note === 'string' && /^unverified\b/i.test(fact.note)) {
    // Seeded, never checked by a person: the age is meaningless, the flag is what matters.
    if (allowUnverified) unverified.push(`${where} (${fact.source})`)
    else errors.push(`${where} is unverified: check it at ${fact.source}, then set checked and remove the note`)
    return
  }
  if (days > FAIL_DAYS) errors.push(`${where} checked ${days} days ago (${fact.checked}), over ${FAIL_DAYS}`)
  else if (days > WARN_DAYS) warnings.push(`${where} checked ${days} days ago (${fact.checked})`)
}

const present = new Set()
for (const file of files) {
  const rel = relative(root, file).split(sep).join('/')
  present.add(rel)
  let data
  try {
    data = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    errors.push(`${rel}: not valid JSON (${e.message})`)
    continue
  }
  errors.push(...checkDataFile(rel, data))
  const spec = specFor(rel)
  const before = facts
  visit(data, rel, '', checkFact)
  if (spec?.facts && facts === before) empty.push(`${rel} holds no Facts yet`)
  if (spec && !spec.facts && facts !== before) errors.push(`${rel}: is an editorial file but has 'source'/'checked' keys`)
}

const registryPath = join(root, 'registry/tools.json')
if (existsSync(registryPath)) {
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
  for (const entry of registry.entries ?? []) {
    for (const f of entry.dataFiles ?? []) if (!present.has(f)) errors.push(`registry: ${entry.id} reads data/${f}, which does not exist`)
  }
}

for (const w of warnings) console.warn(`STALE       ${w}`)
for (const m of empty) console.warn(`EMPTY       ${m}`)
for (const u of unverified) console.warn(`UNVERIFIED  ${u}`)
for (const e of errors) console.error(`ERROR       ${e}`)
console.log(
  `${files.length} files, ${facts} facts, ${warnings.length} stale, ${unverified.length} unverified (allowed), ${errors.length} errors`,
)
process.exit(errors.length ? 1 : 0)
