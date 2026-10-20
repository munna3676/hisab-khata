import { describe, expect, it } from 'vitest'
import bn from '../src/bn.json' with { type: 'json' }
import en from '../src/en.json' with { type: 'json' }
import { DRAFT_BN_KEYS, keysOf, message, placeholdersOf, t, translator, type MessageKey } from '../src/messages.ts'

const bnKeys = keysOf(bn)
const enKeys = keysOf(en)

describe('message files', () => {
  it('bn and en have exactly the same keys, in the same order', () => {
    expect(enKeys).toEqual(bnKeys)
    expect(bnKeys.length).toBeGreaterThan(200)
  })

  it('every message uses the same placeholders in both languages', () => {
    for (const key of bnKeys) {
      const k = key as MessageKey
      expect(placeholdersOf(message('en', k)), key).toEqual(placeholdersOf(message('bn', k)))
    }
  })

  it('no message is empty or has stray whitespace', () => {
    for (const key of bnKeys) {
      for (const lang of ['bn', 'en'] as const) {
        const text = message(lang, key as MessageKey)
        expect(text.trim(), `${lang} ${key}`).toBe(text)
        expect(text.length, `${lang} ${key}`).toBeGreaterThan(0)
      }
    }
  })

  it('Bangla copy uses Bangla digits and English copy uses Latin digits (except fixed names)', () => {
    for (const key of bnKeys) {
      expect(message('en', key as MessageKey), key).not.toMatch(/[০-৯]/)
    }
    // Bangla UI text never shows Latin digits, apart from codes and product names written that way.
    const latinAllowed = new Set(['app.domain', 'app.email', 'shareCard.domain', 'sheet.share.whatsapp'])
    for (const key of bnKeys) {
      if (latinAllowed.has(key)) continue
      expect(message('bn', key as MessageKey), key).not.toMatch(/[0-9]/)
    }
  })

  it('draft keys exist', () => {
    for (const key of DRAFT_BN_KEYS) expect(bnKeys).toContain(key)
  })
})

describe('t()', () => {
  it('returns the Figma copy for a key', () => {
    expect(t('bn', 'nav.allTools')).toBe('সব টুল')
    expect(t('en', 'nav.allTools')).toBe('All tools')
    expect(t('bn', 'state.notFoundTitle')).toBe('এই পাতাটা খাতায় নেই')
    expect(t('en', 'app.tagline')).toBe('Every taka, in one ledger')
  })

  it('formats number placeholders for the language (Figma: "বিকাশ ক্যাশ আউট ৫০০০" এর জন্য ৬টি ফলাফল)', () => {
    expect(t('bn', 'search.resultsFor', { query: 'বিকাশ ক্যাশ আউট ৫০০০', count: 6 })).toBe(
      '"বিকাশ ক্যাশ আউট ৫০০০" এর জন্য ৬টি ফলাফল',
    )
    expect(t('en', 'search.resultsFor', { query: 'EMI', count: 6 })).toBe('6 results for "EMI"')
    expect(t('bn', 'wizard.step', { step: 1, total: 3 })).toBe('ধাপ ১ / ৩')
    expect(t('bn', 'content.checklistProgress', { done: 2, total: 5 })).toBe('২/৫ রেডি')
  })

  it('picks the singular or plural word from {count:one|other}', () => {
    expect(t('en', 'sheet.bankAdd.selected', { count: 1 })).toBe('1 bank selected')
    expect(t('en', 'sheet.bankAdd.selected', { count: 2 })).toBe('2 banks selected')
    expect(t('bn', 'sheet.bankAdd.selected', { count: 2 })).toBe('২টি ব্যাংক বাছাই করা')
  })

  it('groups large numbers lakh-style and leaves strings untouched', () => {
    expect(t('bn', 'validation.min', { min: 1234567 })).toBe('কমপক্ষে ১২,৩৪,৫৬৭ লিখতে হবে')
    expect(t('en', 'validation.max', { max: '৳30,000' })).toBe('Enter at most ৳30,000')
  })

  it('leaves a placeholder it has no value for as written', () => {
    expect(t('en', 'search.seeAllResults')).toBe('See all results for "{query}"')
  })

  it('rejects an unknown key at compile time (checked by tsc --noEmit)', () => {
    // @ts-expect-error 'nav.hom' is not a message key
    expect(() => t('bn', 'nav.hom')).toThrow(/no message/)
    // @ts-expect-error a group is not a message
    expect(() => t('bn', 'nav')).toThrow(/no message/)
  })

  it('translator() binds the language', () => {
    const tr = translator('en')
    expect(tr('footer.copyright', { year: '2026' })).toBe('© 2026 Hisab Khata · For guidance only')
  })
})
