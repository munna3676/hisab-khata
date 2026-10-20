// Bangla + Banglish filtering for pickers. People type a district or a country in
// Bangla ("ঢাকা"), in Banglish with any spelling ("dhaka", "daka", "chattogram"), in
// English ("saudi"), or with Bangla/English digits. Every option is matched on its
// label, description and keywords, both as written and through a rough romanization
// reduced to a consonant skeleton, so spelling differences in vowels and aspirates
// still match. Results keep the caller's order inside each match rank.
import { useMemo } from 'preact/hooks'

export interface FilterableOption {
  label: string
  description?: string
  /** Extra search words: English names, Banglish spellings, codes ("SAR", "riyadh"). */
  keywords?: readonly string[]
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯'

// Independent vowels, vowel signs and consonants → a rough Latin spelling.
const ROMAN: Record<string, string> = {
  অ: 'o', আ: 'a', ই: 'i', ঈ: 'i', উ: 'u', ঊ: 'u', ঋ: 'ri', এ: 'e', ঐ: 'oi', ও: 'o', ঔ: 'ou',
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
  ক: 'k', খ: 'kh', গ: 'g', ঘ: 'gh', ঙ: 'ng', চ: 'ch', ছ: 'chh', জ: 'j', ঝ: 'jh', ঞ: 'n',
  ট: 't', ঠ: 'th', ড: 'd', ঢ: 'dh', ণ: 'n', ত: 't', থ: 'th', দ: 'd', ধ: 'dh', ন: 'n',
  প: 'p', ফ: 'ph', ব: 'b', ভ: 'bh', ম: 'm', য: 'j', র: 'r', ল: 'l', শ: 'sh', ষ: 'sh', স: 's', হ: 'h',
  ড়: 'r', ঢ়: 'rh', য়: 'y', ৎ: 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': '', '্': '',
}

/** Unicode-normalises, lowercases, unifies digits and the nukta forms, drops joiners and punctuation. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/ড়/g, 'ড়')
    .replace(/ঢ়/g, 'ঢ়')
    .replace(/য়/g, 'য়')
    .replace(/[​-‍﻿]/g, '')
    .replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .trim()
}

/** Rough Bangla → Latin ("চট্টগ্রাম" → "chttgram"); Latin text passes through. */
export function romanize(text: string): string {
  let out = ''
  for (const ch of normalizeText(text)) out += ROMAN[ch] ?? ch
  return out
}

/**
 * Consonant skeleton of a Latin or Bangla string: aspirates and look-alike letters merged
 * (ph=f, bh=v=b, kh=k, z=j, sh=s…), vowels dropped, doubled letters collapsed. "dhaka",
 * "daka" and "ঢাকা" all become "dk".
 */
export function skeleton(text: string): string {
  return romanize(text)
    .replace(/chh|ch|c/g, 'c')
    .replace(/ph|f/g, 'f')
    .replace(/bh|v|w/g, 'b')
    .replace(/kh|q/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/jh|z/g, 'j')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/sh|x/g, 's')
    .replace(/rh/g, 'r')
    .replace(/[aeiouy\s]/g, '')
    .replace(/(.)\1+/g, '$1')
}

interface Haystack {
  plain: string[]
  roman: string[]
  skel: string[]
}

function haystack(option: FilterableOption): Haystack {
  const fields = [option.label, option.description ?? '', ...(option.keywords ?? [])].filter(Boolean)
  const plain = fields.map(normalizeText)
  return { plain, roman: fields.map(romanize), skel: fields.map(skeleton) }
}

/** 0 = starts the label, 1 = starts any word, 2 = anywhere, 3 = sounds alike; -1 = no match. */
export function matchRank(option: FilterableOption, query: string): number {
  const q = normalizeText(query)
  if (!q) return 0
  const h = haystack(option)
  const qRoman = romanize(query)
  if (h.plain[0]!.startsWith(q) || h.roman[0]!.startsWith(qRoman)) return 0
  const wordStart = (s: string, needle: string) => s.split(' ').some((w) => w.startsWith(needle))
  if (h.plain.some((s) => wordStart(s, q)) || h.roman.some((s) => wordStart(s, qRoman))) return 1
  if (h.plain.some((s) => s.includes(q)) || h.roman.some((s) => s.includes(qRoman))) return 2
  const qSkel = skeleton(query)
  // A skeleton of one letter matches far too much; require two.
  if (qSkel.length >= 2 && h.skel.some((s) => s.includes(qSkel))) return 3
  return -1
}

/** Options that match `query`, best matches first, the caller's order kept within a rank. */
export function filterOptions<T extends FilterableOption>(options: readonly T[], query: string): T[] {
  if (!normalizeText(query)) return [...options]
  return options
    .map((option, index) => ({ option, index, rank: matchRank(option, query) }))
    .filter((m) => m.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((m) => m.option)
}

/** Memoised filterOptions for a picker's search box. */
export function usePickerFilter<T extends FilterableOption>(options: readonly T[], query: string): T[] {
  return useMemo(() => filterOptions(options, query), [options, query])
}
