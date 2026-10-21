import { describe, expect, it, vi } from 'vitest'

// The lean runtime (src/t.ts) knows no strings until it is given some: islands get only theirs.
describe('@hisab/i18n/t without the message files', () => {
  it('throws for a key it was not given, and uses the subset it was given', async () => {
    vi.resetModules()
    const lean = await import('../src/t.ts')
    expect(() => lean.t('bn', 'nav.home')).toThrow(/no message 'nav.home' in bn/)
    lean.provideMessages('bn', { 'validation.min': 'কমপক্ষে {min}' })
    expect(lean.t('bn', 'validation.min', { min: 500 })).toBe('কমপক্ষে ৫০০')
    expect(() => lean.t('en', 'validation.min')).toThrow()
  })

  it('pickMessages takes the listed keys in one language from the full catalog', async () => {
    vi.resetModules()
    const { pickMessages } = await import('../src/messages.ts')
    expect(pickMessages('en', ['nav.home', 'action.share'])).toEqual({ 'nav.home': 'Home', 'action.share': 'Share' })
    const bn = pickMessages('bn', ['nav.home'])
    expect(Object.keys(bn)).toEqual(['nav.home'])
  })
})
