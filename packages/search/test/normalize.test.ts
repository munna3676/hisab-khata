import { describe, expect, it } from 'vitest'
import { registry } from '@hisab/data/registry'
import {
  STOP_WORDS,
  cleanText,
  createSynonymMap,
  foldBangla,
  foldBanglish,
  normalizeText,
  stripSuffix,
  words,
} from '../src/normalize.ts'
import { defaultSynonymMap, defaultSynonyms } from '../src/synonyms.ts'

const syn = defaultSynonymMap()
/** The query form of a text: what search actually looks up. */
const q = (text: string) => syn.canonicalize(words(text)).join(' ')

describe('cleanText', () => {
  it('turns Bangla digits into English ones', () => {
    expect(cleanText('৫,০০০ টাকা')).toBe('5,000 টাকা')
  })

  it('drops ZWJ, ZWNJ, zero-width spaces and the soft hyphen', () => {
    expect(cleanText('র\u200d্যাব')).toBe('র্যাব')
    expect(cleanText('ক্\u200cষ')).toBe('ক্ষ')
    expect(cleanText('bk\u200bash\u00ad')).toBe('bkash')
  })

  it('treats line and paragraph separators as spaces', () => {
    expect(cleanText('a\u2028b\u2029c')).toBe('a b c')
  })
})

describe('foldBangla', () => {
  it('makes long and short kar the same', () => {
    expect(foldBangla('সরকারী')).toBe(foldBangla('সরকারি'))
    expect(foldBangla('পল্লী')).toBe(foldBangla('পল্লি'))
    expect(foldBangla('মূল্য')).toBe(foldBangla('মুল্য'))
    expect(foldBangla('ঈদ')).toBe(foldBangla('ইদ'))
  })

  it('reads য় and ড় the same whether precomposed or with a nukta', () => {
    expect(foldBangla('\u09df')).toBe(foldBangla('\u09af\u09bc'))
    expect(foldBangla('\u09dc')).toBe(foldBangla('\u09a1\u09bc'))
    expect(foldBangla('বয়স')).toBe(foldBangla('বযস'))
  })

  it('reads ৎ as ত with a hasanta', () => {
    expect(foldBangla('বিদ্যুৎ')).toBe(foldBangla('বিদ্যুত্'))
    expect(foldBangla('বিদ্যুৎ')).toBe(foldBangla('বিদ্যুত'))
  })

  it('drops the hasanta and য-ফলা so conjunct spellings meet', () => {
    expect(foldBangla('ব্যাংক')).toBe(foldBangla('ব্যাঙ্ক'))
    expect(foldBangla('অ্যাকাউন্ট')).toBe(foldBangla('একাউন্ট'))
  })

  it('drops chandrabindu and visarga', () => {
    expect(foldBangla('খোঁজো')).toBe(foldBangla('খোজো'))
    expect(foldBangla('মোঃ')).toBe(foldBangla('মো'))
  })

  it('makes the sibilants and ন/ণ the same', () => {
    expect(foldBangla('সংশোধন')).toBe(foldBangla('সংসোধন'))
    expect(foldBangla('বিষয়')).toBe(foldBangla('বিসয়'))
    expect(foldBangla('গণনা')).toBe(foldBangla('গননা'))
  })

  it('reads composed and split o-kar the same', () => {
    expect(foldBangla('\u0995\u09cb')).toBe(foldBangla('\u0995\u09c7\u09be'))
  })
})

describe('foldBanglish', () => {
  it('meets the common Banglish spellings', () => {
    expect(foldBanglish('nogod')).toBe(foldBanglish('nagad'))
    expect(foldBanglish('bhori')).toBe(foldBanglish('vori'))
    expect(foldBanglish('hishab')).toBe(foldBanglish('hisab'))
    expect(foldBanglish('bkaash')).toBe(foldBanglish('bkash'))
    expect(foldBanglish('cash')).toBe(foldBanglish('kash'))
    expect(foldBanglish('upay')).toBe(foldBanglish('upai'))
  })

  it('keeps koto (কত) apart from kotha (কাঠা)', () => {
    expect(foldBanglish('koto')).not.toBe(foldBanglish('kotha'))
  })

  it('leaves numbers alone', () => {
    expect(foldBanglish('5000')).toBe('5000')
  })
})

describe('normalizeText', () => {
  it('lowercases, folds and splits on punctuation', () => {
    expect(normalizeText('bKash, Cash-Out!')).toBe('bkas kas aut')
    expect(normalizeText('৳৫,০০০')).toBe('5 000')
  })

  it('returns nothing for only punctuation', () => {
    expect(words('?? — !')).toEqual([])
  })
})

describe('Banglish and synonym folding', () => {
  it('bikash, bkash, bkas and বিকাশ are the same query', () => {
    expect(q('bikash')).toBe(q('বিকাশ'))
    expect(q('bkash')).toBe(q('বিকাশ'))
    expect(q('bkas')).toBe(q('বিকাশ'))
  })

  it('kash out, cash out, cashout and ক্যাশআউট are the same query', () => {
    const want = q('ক্যাশ আউট')
    for (const v of ['kash out', 'cash out', 'cashout', 'cash-out', 'ক্যাশআউট']) expect(q(v)).toBe(want)
  })

  it('reads takar and টাকার as taka', () => {
    expect(q('takar')).toBe(q('টাকা'))
    expect(q('টাকার')).toBe(q('taka'))
  })

  it('drops case endings when the stem is known', () => {
    expect(q('বিকাশের')).toBe(q('বিকাশ'))
    expect(q('জমির')).toBe(q('জমি'))
    expect(q('nogode')).toBe(q('nagad'))
  })

  it('drops stop words from queries', () => {
    expect(q('বয়স কত')).toBe(q('বয়স'))
    expect(q('ssc er gpa')).toBe(q('ssc gpa'))
  })

  it('keeps unknown words (folded, but not replaced)', () => {
    expect(q('xyzzy')).toBe(normalizeText('xyzzy'))
  })
})

describe('stripSuffix', () => {
  it('lists each stem, longest ending first', () => {
    expect(stripSuffix(normalizeText('বিকাশের'))).toContain(normalizeText('বিকাশ'))
    expect(stripSuffix('takar')).toEqual(['tak', 'taka'])
  })

  it('keeps at least two letters', () => {
    expect(stripSuffix('er')).toEqual([])
  })
})

describe('createSynonymMap', () => {
  const map = createSynonymMap({
    terms: [
      { canonical: 'ক্যাশ আউট', variants: ['cash out', 'cashout'] },
      { canonical: 'বিকাশ', variants: ['bkash', 'cash out'] },
    ],
  })

  it('matches the longest phrase first', () => {
    expect(map.segment(words('bkash cash out')).map((s) => s.words.join(' '))).toEqual([
      normalizeText('বিকাশ'),
      normalizeText('ক্যাশ আউট'),
    ])
  })

  it('keeps the first canonical when two claim a variant', () => {
    expect(map.lookup(normalizeText('cash out'))).toEqual(words('ক্যাশ আউট'))
  })

  it('expands index text with the canonical words and keeps the original', () => {
    expect(map.expand(words('bkash'))).toEqual([...words('bkash'), ...words('বিকাশ')])
    expect(map.expand(words('বিকাশ'))).toEqual(words('বিকাশ'))
  })

  it('indexes a word known only by its stem as the canonical alone, so it is not counted twice', () => {
    // বিকাশের kept beside বিকাশ would prefix-match the query বিকাশ a second time.
    expect(map.expand(words('বিকাশের'))).toEqual(words('বিকাশ'))
    expect(map.expand(words('bkasher cashout'))).toEqual([...words('বিকাশ'), ...words('cashout'), ...words('ক্যাশ আউট')])
  })

  it('skips malformed groups in a synced file instead of throwing', () => {
    const odd = createSynonymMap({
      terms: [
        { canonical: 'নগদ', variants: null },
        { canonical: 5, variants: ['x'] },
        null,
        { canonical: 'রকেট', variants: ['rocket', 7, 'roket'] },
      ],
    } as never)
    expect(odd.lookup(normalizeText('roket'))).toEqual(words('রকেট'))
    expect(odd.lookup(normalizeText('নগদ'))).toEqual(words('নগদ'))
    expect(createSynonymMap({} as never).phrases.size).toBe(0)
  })
})

describe('data/search/synonyms.json', () => {
  const owner = new Map<string, string>()
  const conflicts: string[] = []
  for (const group of defaultSynonyms.terms) {
    const canonical = normalizeText(group.canonical)
    for (const phrase of [group.canonical, ...group.variants]) {
      const k = normalizeText(phrase)
      if (owner.has(k) && owner.get(k) !== canonical) conflicts.push(`${phrase} → ${owner.get(k)} / ${canonical}`)
      owner.set(k, canonical)
    }
  }

  it('has the schema shape: canonical plus 1+ unique variants', () => {
    expect(defaultSynonyms.terms.length).toBeGreaterThan(200)
    for (const g of defaultSynonyms.terms) {
      expect(g.canonical.length).toBeGreaterThan(0)
      expect(g.variants.length).toBeGreaterThan(0)
      expect(new Set(g.variants).size).toBe(g.variants.length)
      expect(Object.keys(g).sort()).toEqual(['canonical', 'variants'])
    }
  })

  it('never folds one phrase into two canonicals', () => {
    expect(conflicts).toEqual([])
  })

  it('has no phrase that normalizes to nothing', () => {
    for (const g of defaultSynonyms.terms) for (const v of g.variants) expect(normalizeText(v), v).not.toBe('')
  })

  it('covers every registry keyword with at least one known word', () => {
    const uncovered = registry.entries.flatMap((e) => e.keywords).filter((k) => !words(k).some((w) => syn.vocabulary.has(w)))
    expect(uncovered).toEqual([])
  })

  it('never turns a stop word into a term', () => {
    expect([...STOP_WORDS].filter((w) => syn.phrases.has(w))).toEqual([])
  })
})
