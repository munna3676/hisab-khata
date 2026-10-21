// Every registry page builds and serves in both languages, every link on the home page resolves,
// and each page's canonical and hreflang pair (bn ↔ en) is correct and reciprocal.
import { readFileSync } from 'node:fs'
import { expect, test, type APIRequestContext } from '@playwright/test'
import { ROOT } from './helpers'

interface Entry {
  id: string
  route: { bn: string; en: string }
}
const registry = JSON.parse(readFileSync(`${ROOT}data/registry/tools.json`, 'utf8')) as { entries: Entry[] }
const banks = JSON.parse(readFileSync(`${ROOT}data/banks.json`, 'utf8')) as { banks: { id: string }[] }

/** [param] values come from data/, as in apps/web/src/lib/site.ts. */
const PARAMS: Record<string, string[]> = { bank: banks.banks.map((b) => b.id) }

function expand(route: string): string[] {
  const names = [...route.matchAll(/\[([a-z]+)\]/g)].map((m) => m[1]!)
  if (names.length === 0) return [route]
  let out = [route]
  for (const name of names) out = out.flatMap((r) => (PARAMS[name] ?? []).map((v) => r.replace(`[${name}]`, v)))
  return out
}

/** Each page as its bn and en path. */
const PAIRS = registry.entries.flatMap((entry) => {
  const bn = expand(entry.route.bn)
  const en = expand(entry.route.en)
  return bn.map((path, i) => ({ id: entry.id, bn: path, en: en[i]! }))
})

/** The bn 404 is the site-wide 404.html: a host may answer /404 with 200 (preview) or 404 (Pages). */
const servedOk = (path: string, status: number) => status === 200 || (path === '/404' && status === 404)

async function html(request: APIRequestContext, path: string) {
  const response = await request.get(path)
  expect(servedOk(path, response.status()), `${path} status ${response.status()}`).toBe(true)
  return response.text()
}

const attr = (doc: string, pattern: RegExp) => pattern.exec(doc)?.[1]

test('every registry route builds and serves in both languages', async ({ request }) => {
  // 108 registry entries; the [param] bank pages expand to one per bank in data/banks.json.
  expect(PAIRS.length).toBeGreaterThan(registry.entries.length)
  const failed: string[] = []
  for (const pair of PAIRS) {
    for (const path of [pair.bn, pair.en]) {
      const response = await request.get(path)
      if (!servedOk(path, response.status())) failed.push(`${path} → ${response.status()}`)
    }
  }
  expect(failed).toEqual([])
})

test('bn/en hreflang pairs and canonicals are correct and reciprocal', async ({ request, baseURL }) => {
  const site = 'https://hisabkhata.com'
  const problems: string[] = []
  for (const pair of PAIRS) {
    for (const [lang, path] of [
      ['bn', pair.bn],
      ['en', pair.en],
    ] as const) {
      const doc = await html(request, path)
      const got = {
        lang: attr(doc, /<html[^>]*\blang="([^"]+)"/),
        canonical: attr(doc, /<link rel="canonical" href="([^"]+)"/),
        bn: attr(doc, /<link rel="alternate" hreflang="bn" href="([^"]+)"/),
        en: attr(doc, /<link rel="alternate" hreflang="en" href="([^"]+)"/),
        xDefault: attr(doc, /<link rel="alternate" hreflang="x-default" href="([^"]+)"/),
      }
      const want = { lang, canonical: site + path, bn: site + pair.bn, en: site + pair.en, xDefault: site + pair.bn }
      for (const key of Object.keys(want) as (keyof typeof want)[]) {
        if (got[key] !== want[key]) problems.push(`${path} ${key}: ${got[key]} (want ${want[key]})`)
      }
    }
  }
  expect(problems, `checked against ${baseURL}`).toEqual([])
})

test('placeholder pages are noindex, the home pages are indexable', async ({ request }) => {
  for (const path of ['/', '/en/']) expect(await html(request, path)).not.toContain('name="robots"')
  for (const path of ['/mfs', '/en/tools/gpa', '/bank/brac/fdr']) {
    const doc = await html(request, path)
    expect(doc).toMatch(/<meta name="robots" content="noindex/)
    expect(doc).toMatch(/data-coming-soon|data-placeholder/)
  }
})

for (const path of ['/', '/en/']) {
  for (const width of [390, 1440]) {
    test(`every link on the home page ${path} resolves (${width})`, async ({ page, request }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const origin = new URL(page.url()).origin
      const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).href))
      const internal = [...new Set(hrefs.filter((href) => href.startsWith(origin)).map((href) => href.split('#')[0]!))]
      expect(internal.length).toBeGreaterThan(20)
      const broken: string[] = []
      for (const href of internal) {
        const response = await request.get(href)
        if (response.status() !== 200) broken.push(`${href} → ${response.status()}`)
      }
      expect(broken).toEqual([])
    })
  }
}
