import { describe, expect, it } from 'vitest'
import registry from '../../../data/registry/tools.json' with { type: 'json' }
import { alternates, hasRoute, matchRoute, routeOf, switchLanguage } from '../src/routes.ts'

describe('routeOf', () => {
  it('maps a registry id to its route in each language', () => {
    expect(routeOf('home', 'bn')).toBe('/')
    expect(routeOf('home', 'en')).toBe('/en/')
    expect(routeOf('all-tools', 'en')).toBe('/en/tools')
    expect(routeOf('mobile-banking', 'bn')).toBe('/mfs')
  })

  it('fills [param] segments', () => {
    expect(routeOf('bank-detail-fdr', 'bn', { bank: 'brac-bank' })).toBe('/bank/brac-bank/fdr')
    expect(routeOf('bank-detail-fdr', 'en', { bank: 'brac-bank' })).toBe('/en/bank/brac-bank/fdr')
  })

  it('throws for an unknown id or a missing param', () => {
    expect(hasRoute('no-such-page')).toBe(false)
    expect(() => routeOf('no-such-page', 'bn')).toThrow(/no registry page/)
    expect(() => routeOf('bank-detail-fdr', 'bn')).toThrow(/needs param 'bank'/)
  })
})

describe('matchRoute', () => {
  it('finds every registry page from its own route, in both languages', () => {
    for (const entry of registry.entries) {
      for (const lang of ['bn', 'en'] as const) {
        const path = entry.route[lang].replace(/\[([a-z]+)\]/g, 'x')
        const match = matchRoute(path)
        expect(match?.id, path).toBe(entry.id)
        expect(match?.lang, path).toBe(lang)
      }
    }
  })

  it('ignores a trailing slash, the query and the hash', () => {
    expect(matchRoute('/en')?.id).toBe('home')
    expect(matchRoute('/mfs/')?.id).toBe('mobile-banking')
    expect(matchRoute('/bank/list?sort=fdr#top')?.id).toBe('bank-list')
  })

  it('prefers a static route over a [param] route and returns params', () => {
    expect(matchRoute('/bank/list')?.params).toEqual({})
    expect(matchRoute('/bank/city-bank/loan')).toEqual({ id: 'bank-detail-loan', lang: 'bn', params: { bank: 'city-bank' } })
  })

  it('returns null for a path the registry does not know', () => {
    expect(matchRoute('/dev/gallery')).toBeNull()
  })
})

describe('switchLanguage', () => {
  it('switches a page between Bangla and English', () => {
    expect(switchLanguage('/', 'en')).toBe('/en/')
    expect(switchLanguage('/en/', 'bn')).toBe('/')
    expect(switchLanguage('/en', 'bn')).toBe('/')
    expect(switchLanguage('/mfs', 'en')).toBe('/en/mfs')
    expect(switchLanguage('/en/mfs', 'en')).toBe('/en/mfs')
  })

  it('keeps params, query and hash', () => {
    expect(switchLanguage('/bank/brac-bank/fdr?amount=5000#result', 'en')).toBe('/en/bank/brac-bank/fdr?amount=5000#result')
    expect(switchLanguage('/en/bank/brac-bank/dps', 'bn')).toBe('/bank/brac-bank/dps')
  })

  it('falls back to the /en prefix rule for unknown paths', () => {
    expect(switchLanguage('/dev/gallery', 'en')).toBe('/en/dev/gallery')
    expect(switchLanguage('/en/dev/gallery?x=1', 'bn')).toBe('/dev/gallery?x=1')
  })

  it('round-trips every registry route', () => {
    for (const entry of registry.entries) {
      const bn = entry.route.bn.replace(/\[([a-z]+)\]/g, 'sample')
      const en = switchLanguage(bn, 'en')
      expect(switchLanguage(en, 'bn')).toBe(bn)
      expect(alternates(en)).toEqual({ bn, en })
    }
  })
})
