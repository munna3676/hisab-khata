import { describe, expect, it } from 'vitest'
import { langOfPath, localePath, neutralPath } from '../src/locale.ts'

describe('locale paths', () => {
  it('maps a page between Bangla and English', () => {
    expect(localePath('en', '/tools/emi')).toBe('/en/tools/emi')
    expect(localePath('bn', '/en/tools/emi')).toBe('/tools/emi')
    expect(localePath('en', '/en/tools/emi')).toBe('/en/tools/emi')
  })
  it('handles the home page', () => {
    expect(localePath('en', '/')).toBe('/en/')
    expect(localePath('bn', '/en/')).toBe('/')
    expect(neutralPath('/en')).toBe('/')
  })
  it('does not treat a slug that starts with "en" as English', () => {
    expect(langOfPath('/english-guide')).toBe('bn')
    expect(neutralPath('/enrol')).toBe('/enrol')
    expect(langOfPath('/en/mfs')).toBe('en')
  })
})
