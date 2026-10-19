/**
 * "Fonts" for social-media bios: English letters and digits swapped for the
 * look-alike characters Unicode already has (Mathematical Alphanumeric
 * Symbols U+1D400–1D7FF, Enclosed Alphanumerics, Halfwidth and Fullwidth
 * Forms), so the style survives copy-paste into Facebook or Instagram.
 * Code points are from the Unicode Standard, chapter 22 and the charts for
 * those blocks; they never change, so they are constants. Bangla has no such
 * characters, so Bangla text is left as it is.
 */

export type FontStyleId =
  | 'bold'
  | 'italic'
  | 'script'
  | 'monospace'
  | 'circled'
  | 'boldItalic'
  | 'serifItalic'
  | 'sans'
  | 'boldSans'
  | 'boldSansItalic'
  | 'scriptLight'
  | 'doubleStruck'
  | 'fraktur'
  | 'boldFraktur'
  | 'smallCaps'
  | 'circledNegative'
  | 'squared'
  | 'fullwidth'
  | 'underline'
  | 'strikethrough'

interface AlphabetStyle {
  /** First code point of A–Z, a–z, 0–9 in the style; null when the style has none. */
  upper: number | null
  lower: number | null
  digit: number | null
  /** Letters that Unicode encoded earlier, outside the run (ℎ for italic h). */
  holes?: Readonly<Record<string, number>>
  /** Lower-case letters use the upper-case run (the style has capitals only). */
  capsOnly?: boolean
}

const SCRIPT_HOLES = { B: 0x212c, E: 0x2130, F: 0x2131, H: 0x210b, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211b, e: 0x212f, g: 0x210a, o: 0x2134 }
const FRAKTUR_HOLES = { C: 0x212d, H: 0x210c, I: 0x2111, R: 0x211c, Z: 0x2128 }
const DOUBLE_STRUCK_HOLES = { C: 0x2102, H: 0x210d, N: 0x2115, P: 0x2119, Q: 0x211a, R: 0x211d, Z: 0x2124 }

/** Styles that are one run of look-alike letters. The Figma screen's five come first. */
const ALPHABETS: Readonly<Partial<Record<FontStyleId, AlphabetStyle>>> = {
  bold: { upper: 0x1d400, lower: 0x1d41a, digit: 0x1d7ce },
  // The screen's ইটালিক is the sans-serif italic: it has no gaps and reads well in bios.
  italic: { upper: 0x1d608, lower: 0x1d622, digit: null },
  // স্ক্রিপ্ট is the bold script run, which also has no gaps.
  script: { upper: 0x1d4d0, lower: 0x1d4ea, digit: null },
  monospace: { upper: 0x1d670, lower: 0x1d68a, digit: 0x1d7f6 },
  circled: { upper: 0x24b6, lower: 0x24d0, digit: null },
  boldItalic: { upper: 0x1d468, lower: 0x1d482, digit: null },
  serifItalic: { upper: 0x1d434, lower: 0x1d44e, digit: null, holes: { h: 0x210e } },
  sans: { upper: 0x1d5a0, lower: 0x1d5ba, digit: 0x1d7e2 },
  boldSans: { upper: 0x1d5d4, lower: 0x1d5ee, digit: 0x1d7ec },
  boldSansItalic: { upper: 0x1d63c, lower: 0x1d656, digit: null },
  scriptLight: { upper: 0x1d49c, lower: 0x1d4b6, digit: null, holes: SCRIPT_HOLES },
  doubleStruck: { upper: 0x1d538, lower: 0x1d552, digit: 0x1d7d8, holes: DOUBLE_STRUCK_HOLES },
  fraktur: { upper: 0x1d504, lower: 0x1d51e, digit: null, holes: FRAKTUR_HOLES },
  boldFraktur: { upper: 0x1d56c, lower: 0x1d586, digit: null },
  circledNegative: { upper: 0x1f150, lower: null, digit: null, capsOnly: true },
  squared: { upper: 0x1f130, lower: null, digit: null, capsOnly: true },
  fullwidth: { upper: 0xff21, lower: 0xff41, digit: 0xff10 },
}

/** Every style in the order the screen lists them, with its Bangla name. */
export const FONT_STYLES: readonly { id: FontStyleId; bn: string }[] = [
  { id: 'bold', bn: 'বোল্ড' },
  { id: 'italic', bn: 'ইটালিক' },
  { id: 'script', bn: 'স্ক্রিপ্ট' },
  { id: 'monospace', bn: 'মনোস্পেস' },
  { id: 'circled', bn: 'সার্কেল' },
  { id: 'boldItalic', bn: 'বোল্ড ইটালিক' },
  { id: 'serifItalic', bn: 'সেরিফ ইটালিক' },
  { id: 'sans', bn: 'স্যান্স' },
  { id: 'boldSans', bn: 'বোল্ড স্যান্স' },
  { id: 'boldSansItalic', bn: 'বোল্ড স্যান্স ইটালিক' },
  { id: 'scriptLight', bn: 'হালকা স্ক্রিপ্ট' },
  { id: 'doubleStruck', bn: 'ডাবল লাইন' },
  { id: 'fraktur', bn: 'গথিক' },
  { id: 'boldFraktur', bn: 'বোল্ড গথিক' },
  { id: 'smallCaps', bn: 'ছোট বড় হাতের' },
  { id: 'circledNegative', bn: 'কালো সার্কেল' },
  { id: 'squared', bn: 'বক্স' },
  { id: 'fullwidth', bn: 'চওড়া' },
  { id: 'underline', bn: 'আন্ডারলাইন' },
  { id: 'strikethrough', bn: 'কাটা দাগ' },
]

/**
 * Small capitals (IPA and Latin Extended letters). Common fonts have no small
 * capital Q or X, so q uses the look-alike ǫ (U+01EB) and x stays as it is.
 */
const SMALL_CAPS = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ'
/** Digits inside a circle: ⓪ is apart from ①–⑨. */
const CIRCLED_DIGITS = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨']
const NEGATIVE_CIRCLED_DIGITS = ['⓿', '❶', '❷', '❸', '❹', '❺', '❻', '❼', '❽', '❾']

function styleChar(ch: string, id: FontStyleId): string {
  const code = ch.codePointAt(0)!
  const isUpper = code >= 65 && code <= 90
  const isLower = code >= 97 && code <= 122
  const isDigit = code >= 48 && code <= 57

  if (id === 'underline') return ch === '\n' ? ch : ch + '\u0332'
  if (id === 'strikethrough') return ch === '\n' ? ch : ch + '\u0336'
  if (id === 'smallCaps') return isLower ? SMALL_CAPS[code - 97]! : ch
  if (id === 'circled' && isDigit) return CIRCLED_DIGITS[code - 48]!
  if (id === 'circledNegative' && isDigit) return NEGATIVE_CIRCLED_DIGITS[code - 48]!
  if (id === 'fullwidth') {
    if (ch === ' ') return '\u3000'
    if (code >= 0x21 && code <= 0x7e) return String.fromCodePoint(code + 0xfee0)
    return ch
  }

  const a = ALPHABETS[id]
  if (!a) return ch
  const hole = a.holes?.[ch]
  if (hole !== undefined) return String.fromCodePoint(hole)
  if (isUpper && a.upper !== null) return String.fromCodePoint(a.upper + code - 65)
  if (isLower && a.capsOnly && a.upper !== null) return String.fromCodePoint(a.upper + code - 97)
  if (isLower && a.lower !== null) return String.fromCodePoint(a.lower + code - 97)
  if (isDigit && a.digit !== null) return String.fromCodePoint(a.digit + code - 48)
  return ch
}

/** The text in one style. Works per code point, so emoji and Bangla pass through whole. */
export function applyFontStyle(text: string, id: FontStyleId): string {
  let out = ''
  for (const ch of text) out += styleChar(ch, id)
  return out
}

export interface FontStyleInput {
  /** What the person typed (তোমার লেখা). */
  text: string
  /** Styles to make, in order; all of FONT_STYLES when left out. */
  styles?: FontStyleId[]
}

export interface FontStyleVariant {
  id: FontStyleId
  text: string
}

export interface FontStyleResult {
  variants: FontStyleVariant[]
  /** The text has Bangla letters, which no style can change: show the screen's warning. */
  hasBangla: boolean
}

/** Longest text styled at once (a bio or a post). */
export const FONT_STYLE_MAX_LENGTH = 2000

export type FontStyleError = 'text' | 'styles'

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateFontStyle(input: FontStyleInput): FontStyleError | null {
  if (typeof input.text !== 'string' || [...input.text].length > FONT_STYLE_MAX_LENGTH) return 'text'
  const known = new Set(FONT_STYLES.map((s) => s.id))
  if (input.styles && !input.styles.every((id) => known.has(id))) return 'styles'
  return null
}

/** Every requested style of the text, ready to copy. */
export function calculateFontStyle(input: FontStyleInput): FontStyleResult {
  const ids = input.styles ?? FONT_STYLES.map((s) => s.id)
  return {
    variants: ids.map((id) => ({ id, text: applyFontStyle(input.text, id) })),
    hasBangla: /[ঀ-৿]/.test(input.text),
  }
}
