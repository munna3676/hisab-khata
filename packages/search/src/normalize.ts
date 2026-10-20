import { toEnglishDigits } from '@hisab/core/lib/digits'

/**
 * Turns what people type into search keys that match however a word is spelt:
 * Bangla in its common spelling variants, Banglish (bikash, nogod, kash out)
 * and English. The index and the query go through the same functions, so a
 * fold only has to make two spellings meet, not produce a real word.
 */

/** ZWJ, ZWNJ, zero-width space, word joiner, BOM and the soft hyphen: invisible, and typed inconsistently. */
const INVISIBLE = /[\u200b-\u200d\u2060\ufeff\u00ad]/g

/** Separators: anything that is not a letter, a mark or a digit (line and paragraph separators included). */
const SEPARATOR = /[^\p{L}\p{M}\p{N}]+/gu

/** Removes the invisible joiners and turns Bangla digits into English ones. */
export function cleanText(text: string): string {
  return toEnglishDigits(text.normalize('NFC').replace(INVISIBLE, '')).replace(/[\u2028\u2029]/g, ' ')
}

/**
 * Folds the Bangla spellings people mix up into one form:
 * - ী → ি, ূ → ু, ঈ → ই, ঊ → উ (সরকারী / সরকারি, পল্লী / পল্লি);
 * - ণ → ন and ষ, শ → স (the spelling-only distinctions);
 * - the nukta goes, so য় / য, ড় / ড় and ঢ় / ঢ় (precomposed or not) meet;
 * - ৎ → ত (বিদ্যুৎ / বিদ্যুত্);
 * - য-ফলা and the hasanta go (ব্যাংক / ব্যাঙ্ক → বাংক), and ঙ → ং;
 * - অ্যা and এ্যা → এ (অ্যাকাউন্ট / একাউন্ট);
 * - chandrabindu and visarga go (খোঁজো / খোজো, মোঃ / মো).
 */
export function foldBangla(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\u09bc/g, '')
    .replace(/\u09ce/g, 'ত')
    .replace(/\u09cdয/g, '')
    .replace(/\u09cd/g, '')
    .replace(/[অএ]\u09be/g, 'এ')
    .replace(/[\u0981\u0983]/g, '')
    .replace(/\u09c0/g, '\u09bf')
    .replace(/\u09c2/g, '\u09c1')
    .replace(/ঈ/g, 'ই')
    .replace(/ঊ/g, 'উ')
    .replace(/ণ/g, 'ন')
    .replace(/[শষ]/g, 'স')
    .replace(/ঙ/g, '\u0982')
    .normalize('NFC')
}

/**
 * Folds one lowercase Latin word the way Banglish varies: the h of bh, gh,
 * jh, kh and sh goes (bhori / vori, hishab / hisab) but th and dh stay, so
 * koto (কত) never meets kotha (কাঠা); ph → f; c before anything but h is k
 * (cash / kash); v → b, z → j, q → k, y → i;
 * o → a (nogod / nagad, sonchoy / sanchay); doubled letters collapse
 * (bkaash, rokket). English words fold too, which is harmless because the
 * index folds them the same way.
 */
export function foldBanglish(word: string): string {
  if (!/[a-z]/.test(word)) return word
  return word
    .replace(/([bgjks])h/g, '$1')
    .replace(/ph/g, 'f')
    .replace(/ch/g, '\u0001')
    .replace(/c/g, 'k')
    .replace(/\u0001/g, 'c')
    .replace(/q/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/v/g, 'b')
    .replace(/z/g, 'j')
    .replace(/w/g, 'o')
    .replace(/y/g, 'i')
    .replace(/o/g, 'a')
    .replace(/(.)\1+/g, '$1')
}

/** Lowercase, digits, Bangla and Banglish folds, separators to single spaces. */
export function normalizeText(text: string): string {
  const folded = foldBangla(cleanText(text).toLowerCase())
  return folded
    .split(SEPARATOR)
    .filter(Boolean)
    .map(foldBanglish)
    .join(' ')
}

/** normalizeText split into words. */
export function words(text: string): string[] {
  const n = normalizeText(text)
  return n === '' ? [] : n.split(' ')
}

// ---- Synonyms: data/search/synonyms.json ----

export interface SynonymGroup {
  /** The term every variant stands for, e.g. "বিকাশ" or "ক্যাশ আউট". */
  canonical: string
  /** Banglish, English and misspelt forms, e.g. "bkash", "bikash", "kash out". */
  variants: string[]
}

export interface SynonymFile {
  terms: SynonymGroup[]
}

/** Longest phrase, in words, a variant may have. */
const MAX_PHRASE = 4

/**
 * Bangla case endings and particles (বিকাশের, জমির, নগদে, টাকাটা) and their
 * Banglish forms (bkasher, takar, nogode). Longest first.
 */
const BN_SUFFIXES = ['গুলো', 'য়ের', 'দের', 'কে', 'তে', 'ের', 'টা', 'টি', 'র', 'ে', 'য়'].map(normalizeText)
const LATIN_SUFFIXES = ['er', 'ar', 'te', 'ke', 'ta', 'r', 'e'].map(normalizeText)

/** The word without each case ending it has, longest ending first (the stem keeps 2+ letters). */
export function stripSuffix(word: string): string[] {
  const list = /[a-z]/.test(word) ? LATIN_SUFFIXES : BN_SUFFIXES
  return list.filter((suffix) => word.length - suffix.length >= 2 && word.endsWith(suffix)).map((suffix) => word.slice(0, -suffix.length))
}

/** Words dropped from queries: they only say "how much" or join other words. */
export const STOP_WORDS: ReadonlySet<string> = new Set(
  ['কত', 'কি', 'কী', 'এর', 'ও', 'এবং', 'বা', 'koto', 'ki', 'er', 'the', 'of', 'a', 'an', 'and', 'or', 'is', 'for', 'what', 'my'].map(
    normalizeText,
  ),
)

/** A run of words: a known phrase (its canonical words) or one unknown word as typed. */
export interface Segment {
  /** The canonical words, or the word itself when it is not known. */
  words: readonly string[]
  /** The words as typed (normalized). */
  source: readonly string[]
  known: boolean
}

export interface SynonymMap {
  /** Normalized variant or canonical phrase → the canonical's words. */
  readonly phrases: ReadonlyMap<string, readonly string[]>
  /** Every word that appears in some phrase, canonical or variant. */
  readonly vocabulary: ReadonlySet<string>
  /** The canonical words for a normalized phrase, or undefined. */
  lookup(phrase: string): readonly string[] | undefined
  /**
   * Splits words into known phrases (longest match first) and single
   * unknown words. An unknown word whose stem without a case ending is a
   * known phrase (বিকাশের, takar) counts as that phrase.
   */
  segment(words: readonly string[]): Segment[]
  /** Query form: the segments' canonical words, stop words left out. */
  canonicalize(words: readonly string[]): string[]
  /**
   * Index form: the words as they are, plus the canonical words of every
   * phrase found; a word known only through its stem becomes the canonical.
   */
  expand(words: readonly string[]): string[]
}

/** Builds the lookup from the synonym file. A variant claimed by two canonicals keeps the first. */
export function createSynonymMap(file: SynonymFile): SynonymMap {
  const phrases = new Map<string, readonly string[]>()
  const vocabulary = new Set<string>()
  const add = (phrase: string, canonical: readonly string[]) => {
    const key = normalizeText(phrase)
    if (key === '' || phrases.has(key)) return
    phrases.set(key, canonical)
    for (const w of key.split(' ')) vocabulary.add(w)
  }
  // The app may pass a synced copy of the file: a malformed group is skipped, never thrown on.
  for (const group of Array.isArray(file?.terms) ? file.terms : []) {
    if (typeof group?.canonical !== 'string') continue
    const canonical = words(group.canonical)
    if (canonical.length === 0) continue
    add(group.canonical, canonical)
    for (const v of Array.isArray(group.variants) ? group.variants : []) if (typeof v === 'string') add(v, canonical)
  }

  const segment = (ws: readonly string[]): Segment[] => {
    const out: Segment[] = []
    for (let i = 0; i < ws.length; ) {
      let hit: Segment | null = null
      for (let n = Math.min(MAX_PHRASE, ws.length - i); n >= 1 && !hit; n--) {
        const source = ws.slice(i, i + n)
        const canonical = phrases.get(source.join(' '))
        if (canonical) hit = { words: canonical, source, known: true }
      }
      if (!hit) {
        const w = ws[i]!
        const stem = stripSuffix(w).find((s) => phrases.has(s))
        hit = stem ? { words: phrases.get(stem)!, source: [w], known: true } : { words: [w], source: [w], known: false }
      }
      out.push(hit)
      i += hit.source.length
    }
    return out
  }

  return {
    phrases,
    vocabulary,
    lookup: (phrase) => phrases.get(phrase),
    segment,
    canonicalize: (ws) =>
      segment(ws).flatMap((s) => (s.known || !STOP_WORDS.has(s.words[0]!) ? s.words : [])),
    expand(ws) {
      const out: string[] = []
      for (const s of segment(ws)) {
        const source = s.source.join(' ')
        // An inflected word known only by its stem (বিকাশের, takar) is indexed as the canonical
        // alone: kept as well, the canonical would prefix-match it and count the page twice.
        if (s.known && !phrases.has(source)) out.push(...s.words)
        else out.push(...s.source, ...(s.known && s.words.join(' ') !== source ? s.words : []))
      }
      return out
    },
  }
}
