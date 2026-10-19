// Walks data/**/*.json and checks every Fact ({ value, source, checked }).
// Fails on a Fact without a source or with a bad date; warns when a Fact was
// checked more than STALE_DAYS ago. Usage: node scripts/check-data.mjs [--today=YYYY-MM-DD]
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const STALE_DAYS = 60
const root = new URL('../data/', import.meta.url).pathname
const todayArg = process.argv.find((a) => a.startsWith('--today='))?.slice(8)
const today = todayArg ? new Date(todayArg + 'T00:00:00Z') : new Date()

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (name.startsWith('_')) continue
    if (statSync(path).isDirectory()) walk(path)
    else if (name.endsWith('.json')) files.push(path)
  }
}
walk(root)

const errors = []
const stale = []
let facts = 0
const visit = (node, file, path) => {
  if (Array.isArray(node)) return node.forEach((child, i) => visit(child, file, `${path}[${i}]`))
  if (!node || typeof node !== 'object') return
  if ('checked' in node || 'source' in node) {
    facts++
    const where = `${relative(root, file)}:${path || '/'}`
    if (!('value' in node)) errors.push(`${where} has no value`)
    if (typeof node.source !== 'string' || !/^https?:\/\//.test(node.source)) errors.push(`${where} has no source URL`)
    if (typeof node.checked !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(node.checked)) {
      errors.push(`${where} has a bad checked date: ${node.checked}`)
    } else {
      const days = Math.floor((today - new Date(node.checked + 'T00:00:00Z')) / 86400000)
      if (days > STALE_DAYS) stale.push(`${where} checked ${days} days ago (${node.checked})`)
    }
    return
  }
  for (const [key, child] of Object.entries(node)) visit(child, file, `${path}/${key}`)
}
for (const file of files) visit(JSON.parse(readFileSync(file, 'utf8')), file, '')

for (const s of stale) console.warn(`STALE  ${s}`)
for (const e of errors) console.error(`ERROR  ${e}`)
console.log(`${files.length} files, ${facts} facts, ${stale.length} stale, ${errors.length} errors`)
process.exit(errors.length ? 1 : 0)
