import { describe, expect, it } from 'vitest'
import {
  applyFontStyle,
  calculateFontStyle,
  FONT_STYLES,
  validateFontStyle,
} from '../src/font-style.ts'

describe('font-style', () => {
  it('matches the Figma example (T2): Hisab Khata in the five styles', () => {
    const r = calculateFontStyle({ text: 'Hisab Khata', styles: ['bold', 'italic', 'script', 'monospace', 'circled'] })
    expect(r.variants.map((v) => v.text)).toEqual([
      '𝐇𝐢𝐬𝐚𝐛 𝐊𝐡𝐚𝐭𝐚',
      '𝘏𝘪𝘴𝘢𝘣 𝘒𝘩𝘢𝘵𝘢',
      '𝓗𝓲𝓼𝓪𝓫 𝓚𝓱𝓪𝓽𝓪',
      '𝙷𝚒𝚜𝚊𝚋 𝙺𝚑𝚊𝚝𝚊',
      'Ⓗⓘⓢⓐⓑ Ⓚⓗⓐⓣⓐ',
    ])
    expect(r.hasBangla).toBe(false)
  })
  it('matches the Unicode charts at the ends of each run', () => {
    // MATHEMATICAL BOLD CAPITAL A = U+1D400, MATHEMATICAL BOLD SMALL Z = U+1D433, BOLD DIGIT NINE = U+1D7D7.
    expect(applyFontStyle('Az9', 'bold')).toBe('\u{1D400}\u{1D433}\u{1D7D7}')
    // MONOSPACE DIGIT ZERO = U+1D7F6; FULLWIDTH LATIN SMALL LETTER Z = U+FF5A.
    expect(applyFontStyle('0', 'monospace')).toBe('\u{1D7F6}')
    expect(applyFontStyle('z!', 'fullwidth')).toBe('ｚ！')
  })
  it('fills the gaps Unicode left in the older styles', () => {
    expect(applyFontStyle('h', 'serifItalic')).toBe('ℎ')
    expect(applyFontStyle('RHC', 'doubleStruck')).toBe('ℝℍℂ')
    expect(applyFontStyle('Beo', 'scriptLight')).toBe('ℬℯℴ')
    expect(applyFontStyle('Z', 'fraktur')).toBe('ℨ')
  })
  it('makes small caps, enclosed digits and caps-only styles', () => {
    expect(applyFontStyle('hisab 2026', 'smallCaps')).toBe('ʜɪꜱᴀʙ 2026')
    expect(applyFontStyle('2026', 'circled')).toBe('②⓪②⑥')
    expect(applyFontStyle('ab', 'squared')).toBe('🄰🄱')
    expect(applyFontStyle('ok', 'circledNegative')).toBe('🅞🅚')
    expect(applyFontStyle('ab', 'underline')).toBe('a\u0332b\u0332')
  })
  it('leaves Bangla, emoji and punctuation alone and flags Bangla', () => {
    const r = calculateFontStyle({ text: 'হিসাব Khata 🙂!', styles: ['bold'] })
    expect(r.variants[0]!.text).toBe('হিসাব 𝐊𝐡𝐚𝐭𝐚 🙂!')
    expect(r.hasBangla).toBe(true)
  })
  it('restyling styled text does not double-convert', () => {
    const once = applyFontStyle('Hisab', 'bold')
    expect(applyFontStyle(once, 'italic')).toBe(once)
  })
  it('makes every style by default, and handles empty text', () => {
    const r = calculateFontStyle({ text: '' })
    expect(r.variants).toHaveLength(FONT_STYLES.length)
    expect(r.variants.every((v) => v.text === '')).toBe(true)
  })
  it('matches code points looked up by Unicode name (Python unicodedata, Unicode 15)', () => {
    // MATHEMATICAL DOUBLE-STRUCK CAPITAL A U+1D538, …DIGIT ZERO U+1D7D8, DOUBLE-STRUCK CAPITAL C U+2102.
    expect(applyFontStyle('A0C', 'doubleStruck')).toBe('\u{1D538}\u{1D7D8}\u{2102}')
    // MATHEMATICAL FRAKTUR SMALL Z U+1D537; SANS-SERIF BOLD ITALIC SMALL Z U+1D66F; SANS-SERIF BOLD DIGIT SEVEN U+1D7F3.
    expect(applyFontStyle('z', 'fraktur')).toBe('\u{1D537}')
    expect(applyFontStyle('z', 'boldSansItalic')).toBe('\u{1D66F}')
    expect(applyFontStyle('7', 'boldSans')).toBe('\u{1D7F3}')
    // NEGATIVE CIRCLED LATIN CAPITAL LETTER A U+1F150, NEGATIVE CIRCLED DIGIT ZERO U+24FF, DINGBAT … NINE U+277E.
    expect(applyFontStyle('a09', 'circledNegative')).toBe('\u{1F150}\u{24FF}\u{277E}')
    // SQUARED LATIN CAPITAL LETTER Z U+1F149; squared has no digits, so 5 stays.
    expect(applyFontStyle('Z5', 'squared')).toBe('\u{1F149}5')
    // SCRIPT SMALL G U+210A (hole in the plain script run); bold script has no holes: CAPITAL A U+1D4D0.
    expect(applyFontStyle('g', 'scriptLight')).toBe('\u{210A}')
    expect(applyFontStyle('A', 'script')).toBe('\u{1D4D0}')
    // IDEOGRAPHIC SPACE U+3000 keeps fullwidth text evenly spaced.
    expect(applyFontStyle('a b', 'fullwidth')).toBe('ａ　ｂ')
  })
  it('small caps keeps capitals and digits, uses ǫ for q and leaves x', () => {
    expect(applyFontStyle('Quiz Box', 'smallCaps')).toBe('Qᴜɪᴢ Bᴏx')
    expect(applyFontStyle('q', 'smallCaps')).toBe('ǫ')
  })
  it('underline and strike-through mark every character but not line breaks', () => {
    expect(applyFontStyle('a\nb', 'strikethrough')).toBe('a̶\nb̶')
    expect(applyFontStyle('', 'underline')).toBe('')
    // An emoji is one code point, so it gets one mark, not two.
    expect(applyFontStyle('🙂', 'underline')).toBe('🙂̲')
  })
  it('validates input', () => {
    // The limit counts characters, not UTF-16 units: 2,000 emoji are fine.
    expect(validateFontStyle({ text: '🙂'.repeat(2000) })).toBeNull()
    expect(validateFontStyle({ text: 'a', styles: [] })).toBeNull()
    expect(validateFontStyle({ text: 'a'.repeat(2001) })).toBe('text')
    expect(validateFontStyle({ text: 'a', styles: ['neon' as 'bold'] })).toBe('styles')
    expect(validateFontStyle({ text: 'Hisab Khata' })).toBeNull()
  })
})
