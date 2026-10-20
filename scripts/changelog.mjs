// Lists every Fact that changed between two data trees, for the change log page
// (data/changelog.json) and rate-alert pushes. A tree is a folder or a git ref
// (its data/ folder is read with git show).
// Usage:
//   node scripts/changelog.mjs --from=<folder|git ref> [--to=<folder|git ref>] [--date=YYYY-MM-DD] [--write[=<file>]]
// --to defaults to the working tree's data/; --date to today; --write adds the
// entries to the top of data/changelog.json (or the file given) instead of printing them.
// Keys are '<file>#<path>', with array items named by their id where they have one:
// 'mfs-charges.json#channels/bkash-agent', 'finance/excise-duty.json'.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

const arg = (name) => process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`))
const value = (name) => arg(name)?.split('=').slice(1).join('=')
const repo = new URL('../', import.meta.url).pathname
const from = value('from')
if (!from) {
  console.error('ERROR  --from=<folder|git ref> is required')
  process.exit(1)
}
const to = value('to') ?? join(repo, 'data')
const date = value('date') ?? new Date().toISOString().slice(0, 10)

/** Files whose Facts are tracked: everything except schemas, the registry and the log itself. */
const tracked = (path) => path.endsWith('.json') && !path.startsWith('_') && !path.startsWith('registry/') && path !== 'changelog.json'

/** path under data/ → parsed JSON, from a folder or a git ref. */
function readTree(tree) {
  const out = {}
  const folder = resolve(repo, tree)
  if (existsSync(folder) && statSync(folder).isDirectory()) {
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name)
        if (statSync(path).isDirectory()) walk(path)
        else {
          const rel = relative(folder, path).split(sep).join('/')
          if (tracked(rel)) out[rel] = JSON.parse(readFileSync(path, 'utf8'))
        }
      }
    }
    walk(folder)
    return out
  }
  // A ref is passed to git as an argument; one starting with '-' would be read as an option.
  if (tree.startsWith('-')) throw new Error(`not a folder or git ref: ${tree}`)
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 << 20 })
  for (const line of git('ls-tree', '-r', '--name-only', tree, '--', 'data/').split('\n')) {
    const rel = line.slice('data/'.length)
    if (line.startsWith('data/') && tracked(rel)) out[rel] = JSON.parse(git('show', `${tree}:${line}`))
  }
  return out
}

const isFact = (node) => node && typeof node === 'object' && !Array.isArray(node) && ('checked' in node || 'source' in node)

/** key → Fact for every Fact in one file. */
function factsOf(file, data) {
  const facts = new Map()
  const visit = (node, parts) => {
    if (isFact(node)) return facts.set(parts.length ? `${file}#${parts.join('/')}` : file, node)
    if (Array.isArray(node)) {
      return node.forEach((child, i) => {
        const id = child?.value?.id ?? child?.id
        visit(child, [...parts, typeof id === 'string' ? id : String(i)])
      })
    }
    if (node && typeof node === 'object') for (const [key, child] of Object.entries(node)) visit(child, [...parts, key])
  }
  visit(data, [])
  return facts
}

const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function diffTrees(before, after, onDate) {
  const old = new Map()
  const now = new Map()
  for (const [file, data] of Object.entries(before)) for (const [k, f] of factsOf(file, data)) old.set(k, f)
  for (const [file, data] of Object.entries(after)) for (const [k, f] of factsOf(file, data)) now.set(k, f)
  const entries = []
  for (const key of [...new Set([...old.keys(), ...now.keys()])].sort()) {
    const a = old.get(key)
    const b = now.get(key)
    if (a && b && equal(a.value, b.value)) continue
    entries.push({ key, old: a ? a.value : null, new: b ? b.value : null, source: (b ?? a).source ?? null, date: onDate })
  }
  return entries
}

const entries = diffTrees(readTree(from), readTree(to), date)
const write = arg('write')
if (write) {
  const target = resolve(repo, value('write') || 'data/changelog.json')
  const log = existsSync(target) ? JSON.parse(readFileSync(target, 'utf8')) : { entries: [] }
  log.entries = [...entries, ...log.entries]
  writeFileSync(target, JSON.stringify(log, null, 2) + '\n')
  console.log(`${entries.length} changed Facts → ${relative(repo, target)}`)
} else {
  console.log(JSON.stringify(entries, null, 2))
}
