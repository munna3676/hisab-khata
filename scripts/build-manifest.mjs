// Builds the data manifest: every data file the app reads (contract entries with
// bundled: true), each with the SHA-256 and size of its exact bytes, plus a
// release version and date. Every file must pass checkDataFile first. Sign the
// result with scripts/sign-manifest.mjs before publishing it.
// Usage:
//   node scripts/build-manifest.mjs [--data=data] [--out=packages/data/dist/manifest.json]
//        [--version=<integer>] [--date=YYYY-MM-DD] [--snapshot=<file>]
// --version defaults to the build time as YYYYMMDDHHmm (UTC), which only rises.
// --snapshot also writes { manifest, files } for the app bundle (store.ts `bundled`).
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { checkDataFile } from '../packages/data/src/checks.ts'
import { specFor } from '../packages/data/src/contract.ts'
import { sha256Hex } from '../packages/data/src/manifest.ts'

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3)
const repo = new URL('../', import.meta.url).pathname
const dataDir = resolve(repo, arg('data') ?? 'data')
const out = resolve(repo, arg('out') ?? 'packages/data/dist/manifest.json')
const now = new Date()
const version = Number(arg('version') ?? now.toISOString().slice(0, 16).replace(/\D/g, ''))
const date = arg('date') ?? now.toISOString().slice(0, 10)
if (!Number.isSafeInteger(version) || version < 0) throw new Error(`--version must be a whole number, got ${arg('version')}`)
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`--date must be YYYY-MM-DD, got ${date}`)

const paths = []
const walk = (dir) => {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name)
    if (name.startsWith('_') || name.startsWith('.')) continue
    if (statSync(path).isDirectory()) walk(path)
    else if (name.endsWith('.json')) paths.push(relative(dataDir, path).split(sep).join('/'))
  }
}
walk(dataDir)

const files = {}
const parsed = {}
const errors = []
for (const path of paths) {
  const spec = specFor(path)
  if (!spec) {
    errors.push(`${path}: not in the data contract`)
    continue
  }
  if (!spec.bundled) continue
  const bytes = readFileSync(join(dataDir, path))
  const data = JSON.parse(bytes.toString('utf8'))
  errors.push(...checkDataFile(path, data))
  files[path] = { sha256: await sha256Hex(new Uint8Array(bytes)), bytes: bytes.length }
  parsed[path] = data
}
if (errors.length) {
  for (const e of errors) console.error(`ERROR  ${e}`)
  process.exit(1)
}

const manifest = { format: 1, version, date, files }
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n')
console.log(`${Object.keys(files).length} files, version ${version} → ${relative(repo, out)}`)
const snapshot = arg('snapshot')
if (snapshot) {
  const target = resolve(repo, snapshot)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, JSON.stringify({ manifest, files: parsed }))
  console.log(`snapshot → ${relative(repo, target)}`)
}
