// JavaScript a page really loads: open it, wait until the network and the idle callbacks are
// done, and add up the gzipped size of every script it fetched (scripts/check-js-budget.mjs does
// the same from the build's import graph). Budgets: calculator pages 25 KB gz, Home 10 KB gz.
// Needs the production build (PW_SERVER=preview); the dev server serves unbundled modules.
import { expect, test } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { ROOT } from './helpers'

const DIST = join(ROOT, 'apps/web/dist')
const KB = 1024

function pages(): { route: string; budget: number }[] {
  const src = readFileSync(join(ROOT, 'apps/web/src/lib/tools.ts'), 'utf8')
  const ids = [...(src.match(/BUILT_PAGES[^=]*=\s*\[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]!)
  const registry = JSON.parse(readFileSync(join(ROOT, 'data/registry/tools.json'), 'utf8')) as { entries: { id: string; route: { bn: string; en: string } }[] }
  const tools = ids.flatMap((id) => {
    const entry = registry.entries.find((e) => e.id === id)!
    return [entry.route.bn, entry.route.en].map((route) => ({ route, budget: 25 * KB }))
  })
  return [{ route: '/', budget: 10 * KB }, { route: '/en/', budget: 10 * KB }, ...tools]
}

test.describe('JavaScript budget', () => {
  test.skip(process.env.PW_SERVER !== 'preview' || !existsSync(DIST), 'needs the production build (PW_SERVER=preview)')

  for (const { route, budget } of pages()) {
    test(`${route} loads at most ${budget / KB} KB of JS (gzip)`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      // Idle-time work (the recents record) has run.
      await page.evaluate(() => new Promise((resolve) => (window.requestIdleCallback ?? setTimeout)(() => setTimeout(resolve, 300))))
      await page.waitForLoadState('networkidle')
      const urls = await page.evaluate(() =>
        performance
          .getEntriesByType('resource')
          .map((e) => new URL(e.name).pathname)
          .filter((p) => p.endsWith('.js')),
      )
      const sizes = [...new Set(urls)].map((path) => ({ path, gz: gzipSync(readFileSync(join(DIST, path)), { level: 9 }).length }))
      const total = sizes.reduce((sum, s) => sum + s.gz, 0)
      const list = sizes.map((s) => `${(s.gz / KB).toFixed(1)} KB ${s.path}`).join('\n')
      expect(total, `${(total / KB).toFixed(1)} KB:\n${list}`).toBeLessThanOrEqual(budget)
    })
  }
})
