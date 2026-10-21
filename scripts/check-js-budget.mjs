#!/usr/bin/env node
// JavaScript weight per built page (docs/decisions/0001-stack.md: about 12-20 KB on calculator
// pages, 0 KB on content pages). Reads apps/web/dist after `pnpm build`, follows every module a
// page loads (module <script>s, inline module imports, island component and renderer URLs, and
// their static imports) and gzips each file the way a server sends it.
//
//   initial: the page's static import graph (module scripts, islands and what they import)
//   idle:    import()s in the page's own <script>s, which run on load or when the page is idle
//            (the recents record); they load without the person doing anything
//   lazy:    other import() chunks, loaded on a tap (report sheet, toasts, share/print adapter)
//
// Fails (exit 1) when a page's initial + idle JS is over its budget:
//   tool pages (BUILT_PAGES routes, bn and en)  25 KB gz
//   Home (/ and /en/)                            10 KB gz
//
//   node scripts/check-js-budget.mjs            # check, print a table
//   node scripts/check-js-budget.mjs --json     # machine-readable
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'apps/web/dist')
const KB = 1024
export const BUDGET = { tool: 25 * KB, home: 10 * KB }

if (!existsSync(dist)) {
  console.error('check-js-budget: apps/web/dist is missing; run `pnpm build` first')
  process.exit(2)
}

/** Registry ids with their own page (apps/web/src/lib/tools.ts) and their routes. */
function toolRoutes() {
  const src = readFileSync(join(root, 'apps/web/src/lib/tools.ts'), 'utf8')
  const list = src.match(/BUILT_PAGES[^=]*=\s*\[([^\]]*)\]/)
  if (!list) throw new Error('check-js-budget: BUILT_PAGES not found in apps/web/src/lib/tools.ts')
  const ids = [...list[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
  const registry = JSON.parse(readFileSync(join(root, 'data/registry/tools.json'), 'utf8'))
  const entries = Array.isArray(registry) ? registry : (registry.entries ?? registry.tools)
  return ids.flatMap((id) => {
    const entry = entries.find((e) => e.id === id)
    if (!entry) throw new Error(`check-js-budget: no registry entry '${id}'`)
    return [entry.route.bn, entry.route.en].map((route) => ({ id, route }))
  })
}

function htmlFor(route) {
  const clean = route.replace(/^\//, '')
  const candidates = clean === '' || clean.endsWith('/') ? [join(dist, clean, 'index.html')] : [join(dist, `${clean}.html`), join(dist, clean, 'index.html')]
  const file = candidates.find((f) => existsSync(f))
  if (!file) throw new Error(`check-js-budget: no built file for ${route}`)
  return file
}

const gzCache = new Map()
function gz(file) {
  if (!gzCache.has(file)) {
    const raw = readFileSync(file)
    gzCache.set(file, { raw: raw.length, gz: gzipSync(raw, { level: 9 }).length })
  }
  return gzCache.get(file)
}

const STATIC_IMPORT = /(?:\bfrom\s*|\bimport\s*)["'`]([^"'`]+\.js)["'`]/g
const DYNAMIC_IMPORT = /\bimport\(\s*["'`]([^"'`]+\.js)["'`]\s*\)/g
// Vite lists a dynamic chunk's own imports here, so they load with it (not before).
const PRELOAD_DEPS = /__vite__mapDeps[\s\S]*?\[((?:\s*["'`][^"'`]+\.js["'`]\s*,?)+)\]/g

function toFile(spec, fromFile) {
  if (spec.startsWith('/')) return join(dist, spec)
  if (spec.startsWith('_astro/')) return join(dist, spec)
  return resolve(dirname(fromFile), spec)
}

function importsOf(file) {
  const code = readFileSync(file, 'utf8')
  const statics = [...code.matchAll(STATIC_IMPORT)].map((m) => toFile(m[1], file))
  const dynamics = [...code.matchAll(DYNAMIC_IMPORT)].map((m) => toFile(m[1], file))
  for (const m of code.matchAll(PRELOAD_DEPS)) {
    for (const d of m[1].matchAll(/["'`]([^"'`]+\.js)["'`]/g)) dynamics.push(toFile(d[1], file))
  }
  return { statics, dynamics }
}

/** The page's entry modules: module scripts, inline module imports and island URLs. */
function entriesOf(htmlFile) {
  const html = readFileSync(htmlFile, 'utf8')
  const out = new Set()
  for (const m of html.matchAll(/<script\b[^>]*\btype="module"[^>]*\bsrc="([^"]+)"/g)) out.add(toFile(m[1], htmlFile))
  for (const m of html.matchAll(/\b(?:component-url|renderer-url)="([^"]+)"/g)) out.add(toFile(m[1], htmlFile))
  for (const m of html.matchAll(/<script\b[^>]*\btype="module"[^>]*>([\s\S]*?)<\/script>/g)) {
    for (const i of m[1].matchAll(STATIC_IMPORT)) out.add(toFile(i[1], htmlFile))
  }
  return [...out].filter((f) => f.startsWith(dist))
}

const isPageScript = (file) => /astro_type_script/.test(file)

function measure(htmlFile) {
  const initial = new Set()
  const idleRoots = new Set()
  const lazyRoots = new Set()
  const walk = (file, into, roots = lazyRoots) => {
    if (into.has(file) || !existsSync(file)) return
    into.add(file)
    const { statics, dynamics } = importsOf(file)
    statics.forEach((s) => walk(s, into, roots))
    dynamics.forEach((d) => (isPageScript(file) ? idleRoots : roots).add(d))
  }
  entriesOf(htmlFile).forEach((e) => walk(e, initial))
  const idle = new Set()
  for (const r of idleRoots) walk(r, idle)
  for (const f of initial) idle.delete(f)
  const lazy = new Set()
  for (const r of lazyRoots) walk(r, lazy)
  for (const f of [...initial, ...idle]) lazy.delete(f)
  const sum = (set) => [...set].reduce((acc, f) => ({ raw: acc.raw + gz(f).raw, gz: acc.gz + gz(f).gz }), { raw: 0, gz: 0 })
  const top = (set) =>
    [...set]
      .map((f) => ({ file: relative(dist, f), gz: gz(f).gz }))
      .sort((a, b) => b.gz - a.gz)
  const load = sum(new Set([...initial, ...idle]))
  return { initial: sum(initial), idle: sum(idle), load, lazy: sum(lazy), initialFiles: top(initial), idleFiles: top(idle), lazyFiles: top(lazy) }
}

const pages = [
  { kind: 'home', id: 'home', route: '/' },
  { kind: 'home', id: 'home', route: '/en/' },
  ...toolRoutes().map((p) => ({ kind: 'tool', ...p })),
]

const rows = pages.map((page) => {
  const m = measure(htmlFor(page.route))
  const budget = BUDGET[page.kind]
  return { ...page, budget, ...m, ok: m.load.gz <= budget }
})

const kb = (n) => (n / KB).toFixed(1).padStart(5)
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(rows, null, 2))
} else {
  console.log('JS per page in KB, gzip -9 per file. load = initial + idle (checked against the budget); lazy = on a tap')
  console.log('route'.padEnd(32) + 'initial  idle   load budget   lazy')
  for (const r of rows) {
    console.log(`${r.route.padEnd(32)}${kb(r.initial.gz)}  ${kb(r.idle.gz)}  ${kb(r.load.gz)}  ${kb(r.budget)}  ${kb(r.lazy.gz)}  ${r.ok ? 'ok' : 'OVER'}`)
  }
  if (process.argv.includes('--verbose')) {
    for (const r of rows) {
      console.log(`\n${r.route}`)
      r.initialFiles.forEach((f) => console.log(`  ${kb(f.gz)}  ${f.file}`))
      r.idleFiles.forEach((f) => console.log(`  ${kb(f.gz)}  (idle) ${f.file}`))
      r.lazyFiles.forEach((f) => console.log(`  ${kb(f.gz)}  (lazy) ${f.file}`))
    }
  }
}

const over = rows.filter((r) => !r.ok)
if (over.length) {
  console.error(`\ncheck-js-budget: ${over.length} page(s) over budget: ${over.map((r) => r.route).join(', ')}`)
  process.exit(1)
}
