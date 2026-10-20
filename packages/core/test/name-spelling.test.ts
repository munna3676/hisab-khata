import { describe, expect, it } from 'vitest'
import {
  checkNameSpelling,
  compareNames,
  MAX_NAME_ENTRIES,
  MAX_NAME_PARTS,
  nameSeverity,
  validateNameSpelling,
  type NameEntry,
  type NameVariantGroup,
} from '../src/name-spelling.ts'

// Test data shaped like data/text/name-variants.json: মোঃ/MD and মোহাম্মদ/Mohammad
// are two forms of one name, so they share a family but not a group.
const VARIANTS: NameVariantGroup[] = [
  { id: 'mohammad', family: 'mohammad', variants: ['মোহাম্মদ', 'মুহাম্মদ', 'মোহাম্মাদ', 'Mohammad', 'Muhammad', 'Mohammed'] },
  { id: 'md', family: 'mohammad', variants: ['মোঃ', 'মো.', 'MD', 'Mohd'] },
  { id: 'mosammat', family: 'mosammat', variants: ['মোছাম্মৎ', 'মোসাম্মৎ', 'Mosammat', 'Mst'] },
  { id: 'mst', family: 'mosammat', variants: ['মোছাঃ', 'মোসাঃ'] },
]
const GUIDES = { nid: 'nid-correction', ssc: 'certificate-correction', 'birth-registration': 'birth-registration', passport: 'e-passport' }

// The four boxes on the G1 screen, in its order: NID, SSC সনদ, জন্ম নিবন্ধন, পাসপোর্ট (ইংরেজি).
const FIGMA: NameEntry[] = [
  { id: 'nid', name: 'মোহাম্মদ রফিকুল ইসলাম' },
  { id: 'ssc', name: 'মোঃ রফিকুল ইসলাম' },
  { id: 'birth-registration', name: 'মোহাম্মদ রফিকুল ইসলাম' },
  { id: 'passport', name: 'MD RAFIQUL ISLAM' },
]

describe('name-spelling', () => {
  it('matches the Figma example (G1): ১টা অমিল, SSC has "মোঃ" where the others have "মোহাম্মদ"', () => {
    const r = checkNameSpelling({ entries: FIGMA, variants: VARIANTS, guides: GUIDES })
    expect(r.allMatch).toBe(false)
    expect(r.issues).toHaveLength(1)
    const issue = r.issues[0]!
    expect(issue.position).toBe(0)
    expect(issue.level).toBe('variant')
    expect(issue.severity).toBe('medium')
    expect(issue.forms).toEqual([
      { text: 'মোহাম্মদ', documents: ['nid', 'birth-registration'] },
      { text: 'মোঃ', documents: ['ssc', 'passport'] },
    ])
    expect(issue.majority).toEqual(['nid', 'birth-registration'])
    expect(issue.odd).toEqual(['ssc', 'passport'])
    expect(issue.guideIds).toEqual(['certificate-correction', 'e-passport'])
  })

  it('matches the Figma তুলনা rows: NID-জন্ম নিবন্ধন মিলেছে, NID-SSC অমিল: মোহাম্মদ / মোঃ, SSC-পাসপোর্ট মিলেছে (মোঃ = MD)', () => {
    const { pairs } = checkNameSpelling({ entries: FIGMA, variants: VARIANTS })
    const pair = (a: string, b: string) => pairs.find((p) => p.a === a && p.b === b)!
    expect(pairs).toHaveLength(6)

    expect(pair('nid', 'birth-registration').match).toBe(true)
    expect(pair('nid', 'birth-registration').tokens.every((t) => t.level === 'same')).toBe(true)

    const nidSsc = pair('nid', 'ssc')
    expect(nidSsc.match).toBe(false)
    expect(nidSsc.severity).toBe('medium')
    expect(nidSsc.tokens.filter((t) => t.severity)).toEqual([
      { a: 'মোহাম্মদ', b: 'মোঃ', level: 'variant', severity: 'medium' },
    ])

    const sscPassport = pair('ssc', 'passport')
    expect(sscPassport.match).toBe(true)
    expect(sscPassport.tokens[0]).toEqual({ a: 'মোঃ', b: 'MD', level: 'translit', severity: null, groupId: 'md' })
    expect(sscPassport.tokens.slice(1).map((t) => t.level)).toEqual(['translit', 'translit'])
  })

  it('reports no issue when every document agrees', () => {
    const r = checkNameSpelling({
      entries: [
        { id: 'nid', name: 'মোঃ রফিকুল ইসলাম' },
        { id: 'ssc', name: 'মোঃ রফিকুল ইসলাম' },
        { id: 'passport', name: 'Md. Rafiqul Islam' },
      ],
      variants: VARIANTS,
    })
    expect(r).toMatchObject({ allMatch: true, issues: [], severity: null })
    expect(r.pairs.every((p) => p.match)).toBe(true)
  })

  it('ignores case, extra spaces and punctuation', () => {
    const r = compareNames('  MD.  RAFIQUL   ISLAM ', 'Md Rafiqul Islam')
    expect(r.match).toBe(true)
    expect(r.tokens.map((t) => t.level)).toEqual(['same', 'same', 'same'])
    // মোঃ, মো: and মো. are the same abbreviation.
    expect(compareNames('মোঃ করিম', 'মো: করিম').match).toBe(true)
    expect(compareNames('মোঃ করিম', 'মো. করিম').match).toBe(true)
  })

  it('reads initials written with dots, spaces or together as one part', () => {
    const r = compareNames('A.K.M. Fazlul Haque', 'A K M FAZLUL HAQUE')
    expect(r.match).toBe(true)
    expect(r.tokens.map((t) => t.a)).toEqual(['A.K.M.', 'Fazlul', 'Haque'])
    expect(compareNames('AKM Fazlul Haque', 'A.K.M. Fazlul Haque').match).toBe(true)
    // A dot with no space after it still splits two parts.
    expect(compareNames('Md.Rafiqul Islam', 'Md Rafiqul Islam').match).toBe(true)
  })

  it('treats Mohammad / Muhammad and Bangla vowel swaps (ী/ি, ূ/ু) as low-severity spelling differences', () => {
    const en = compareNames('Mohammad Rafiqul Islam', 'Muhammad Rafiqul Islam')
    expect(en.severity).toBe('low')
    expect(en.tokens[0]).toMatchObject({ a: 'Mohammad', b: 'Muhammad', level: 'spelling', severity: 'low' })

    const bn = compareNames('রফিকুল ইসলাম', 'রফীকূল ইসলাম')
    expect(bn.tokens[0]).toMatchObject({ level: 'spelling', severity: 'low' })
    // With the variant list, মোহাম্মদ and মুহাম্মদ are listed spellings of one form.
    expect(compareNames('মোহাম্মদ', 'মুহাম্মদ', VARIANTS).tokens[0]).toMatchObject({ level: 'spelling', groupId: 'mohammad' })
  })

  it('matches Bangla and English spellings of the same part by sound (transliteration)', () => {
    const r = compareNames('আব্দুর রহমান চৌধুরী', 'ABDUR RAHMAN CHOWDHURY')
    expect(r.match).toBe(true)
    expect(r.tokens.map((t) => t.level)).toEqual(['translit', 'translit', 'translit'])
    expect(compareNames('শাহরিয়ার হোসেন', 'Shahriar Hossain').match).toBe(true)
    expect(compareNames('মোস্তফা কামাল', 'Mostofa Kamal').match).toBe(true)
    expect(compareNames('রফিকুল', 'KARIM').tokens[0]!.level).toBe('different')
  })

  it('without variant data, MD is read by sound; with it, MD goes with মোঃ, not মোহাম্মদ (Figma note)', () => {
    expect(compareNames('MD', 'মোহাম্মদ').tokens[0]!.level).toBe('translit')
    expect(compareNames('MD', 'মোহাম্মদ', VARIANTS).tokens[0]!.level).toBe('variant')
    expect(compareNames('MD', 'মোঃ', VARIANTS).tokens[0]!.level).toBe('translit')
  })

  it('reports a missing or extra part as high severity and puts it in its own slot', () => {
    const r = compareNames('মোঃ রফিকুল ইসলাম', 'রফিকুল ইসলাম', VARIANTS)
    expect(r.tokens[0]).toEqual({ a: 'মোঃ', b: null, level: 'missing', severity: 'high' })
    expect(r.severity).toBe('high')

    const check = checkNameSpelling({
      entries: [
        { id: 'nid', name: 'রফিকুল ইসলাম' },
        { id: 'ssc', name: 'মোঃ রফিকুল ইসলাম' },
        { id: 'birth-registration', name: 'মোঃ রফিকুল ইসলাম' },
      ],
      variants: VARIANTS,
      guides: GUIDES,
    })
    expect(check.issues).toHaveLength(1)
    // Two documents have the part the reference lacks, so the reference is the odd one.
    expect(check.issues[0]).toMatchObject({
      position: 0,
      level: 'extra',
      severity: 'high',
      majority: ['ssc', 'birth-registration'],
      odd: ['nid'],
      guideIds: ['nid-correction'],
    })
  })

  it('reports a part split or joined differently as a spacing difference', () => {
    const r = compareNames('আবুল কালাম আজাদ', 'আবুলকালাম আজাদ')
    expect(r.tokens[0]).toEqual({ a: 'আবুল কালাম', b: 'আবুলকালাম', level: 'spacing', severity: 'low' })
    expect(r.tokens[1]!.level).toBe('same')

    const check = checkNameSpelling({
      entries: [
        { id: 'nid', name: 'আবুল কালাম আজাদ' },
        { id: 'ssc', name: 'আবুলকালাম আজাদ' },
        { id: 'passport', name: 'ABUL KALAM AZAD' },
      ],
    })
    expect(check.issues).toHaveLength(1)
    expect(check.issues[0]).toMatchObject({ level: 'spacing', severity: 'low', odd: ['ssc'] })
  })

  it('reports a different part as high severity', () => {
    const r = checkNameSpelling({
      entries: [
        { id: 'nid', name: 'মোছাম্মৎ নাসরিন আক্তার' },
        { id: 'ssc', name: 'মোছাম্মৎ নাসরিন খাতুন' },
      ],
      variants: VARIANTS,
    })
    expect(r.severity).toBe('high')
    expect(r.issues[0]).toMatchObject({ position: 2, level: 'different', forms: [{ text: 'আক্তার' }, { text: 'খাতুন' }] })
  })

  it('maps levels to severities', () => {
    expect(nameSeverity('same')).toBeNull()
    expect(nameSeverity('translit')).toBeNull()
    expect(nameSeverity('spelling')).toBe('low')
    expect(nameSeverity('spacing')).toBe('low')
    expect(nameSeverity('variant')).toBe('medium')
    expect(nameSeverity('missing')).toBe('high')
  })

  it('rejects invalid input', () => {
    expect(validateNameSpelling({ entries: FIGMA, variants: VARIANTS })).toBeNull()
    expect(validateNameSpelling({ entries: FIGMA.slice(0, 1) })).toBe('entries')
    expect(validateNameSpelling({ entries: [FIGMA[0]!, { ...FIGMA[1]!, id: 'nid' }] })).toBe('entries')
    expect(validateNameSpelling({ entries: [FIGMA[0]!, { id: 'ssc', name: ' ... ' }] })).toBe('name')
    expect(validateNameSpelling({ entries: FIGMA, variants: [{ id: 'a', variants: ['MD'] }, { id: 'b', variants: ['Md.'] }] })).toBe(
      'variants',
    )
    expect(validateNameSpelling({ entries: FIGMA, variants: [{ id: 'a', variants: [] }] })).toBe('variants')
  })

  it('handles a very long name without trouble', () => {
    const long = Array.from({ length: 40 }, (_, i) => `নাম${i}`).join(' ')
    expect(compareNames(long, long).match).toBe(true)
  })

  it('review: an added or dropped final vowel is a different name, not a transliteration (রহিমা ≠ RAHIM)', () => {
    // These matched before: the consonant skeleton r-m / s-n hid the vowel.
    expect(compareNames('রহিমা খাতুন', 'RAHIM KHATUN').tokens[0]).toMatchObject({ level: 'different', severity: 'high' })
    expect(compareNames('হাসিনা', 'HASAN').match).toBe(false)
    expect(compareNames('কামাল', 'KAMALA').match).toBe(false)
    expect(compareNames('Rahim', 'Rahima').tokens[0]!.level).toBe('different')
    expect(compareNames('রহিম', 'রহিমা').tokens[0]!.level).toBe('different')
  })

  it('review: common Bangla ↔ English spellings still match (inherent vowel, silent e, final h, ফলা, ঋ-কার)', () => {
    const same = [
      ['দত্ত', 'DUTTA'],
      ['দেবব্রত', 'DEBABRATA'],
      ['শুভ', 'SHUVO'],
      ['রফিক', 'RAFIQUE'],
      ['হক', 'HAQUE'],
      ['রায়', 'ROY'],
      ['দে', 'DEY'],
      ['উল্লাহ', 'ULLAH'],
      ['শাহ', 'SHAH'],
      ['সালেহ', 'SALEH'],
      ['চৌধুরী', 'CHOWDHURY'],
      ['মিয়া', 'MIA'],
      ['বিশ্বাস', 'BISWAS'],
      ['হৃদয়', 'HRIDOY'],
      ['কৃষ্ণ', 'KRISHNA'],
      ['মন্ডল', 'MONDAL'],
      ['বেগম', 'BEGUM'],
      ['আক্তার', 'AKTER'],
      ['সুলতানা', 'SULTANA'],
    ]
    expect(same.filter(([a, b]) => !compareNames(a!, b!).match)).toEqual([])
  })

  it('review: two Bangla spellings that both match the English one are still reported (no chaining)', () => {
    // রফিকুল ~ RAFIQUL and রফীকুল ~ RAFIQUL, but রফিকুল ≠ রফীকুল: this used to give allMatch.
    const r = checkNameSpelling({
      entries: [
        { id: 'nid', name: 'রফিকুল ইসলাম' },
        { id: 'ssc', name: 'রফীকুল ইসলাম' },
        { id: 'passport', name: 'RAFIQUL ISLAM' },
      ],
      guides: GUIDES,
    })
    expect(r.allMatch).toBe(false)
    expect(r.severity).toBe('low')
    expect(r.issues).toHaveLength(1)
    expect(r.issues[0]).toMatchObject({
      position: 0,
      level: 'spelling',
      majority: ['nid', 'passport'],
      odd: ['ssc'],
      guideIds: ['certificate-correction'],
      forms: [
        { text: 'রফিকুল', documents: ['nid', 'passport'] },
        { text: 'রফীকুল', documents: ['ssc'] },
      ],
    })
    // The issues agree with the pairs: a pair that does not match always shows up as an issue.
    expect(r.pairs.filter((p) => !p.match).map((p) => [p.a, p.b])).toEqual([['nid', 'ssc']])
  })

  it('review: refuses pasted paragraphs and too many documents (lining up costs parts²)', () => {
    const name = (n: number) => Array.from({ length: n }, (_, i) => `Part${i}`).join(' ')
    const two = (n: number) => [
      { id: 'a', name: name(n) },
      { id: 'b', name: 'Rafiq' },
    ]
    expect(validateNameSpelling({ entries: two(MAX_NAME_PARTS) })).toBeNull()
    expect(validateNameSpelling({ entries: two(MAX_NAME_PARTS + 1) })).toBe('name')
    expect(validateNameSpelling({ entries: two(5000) })).toBe('name')
    const many = Array.from({ length: MAX_NAME_ENTRIES + 1 }, (_, i) => ({ id: `d${i}`, name: 'Rafiq' }))
    expect(validateNameSpelling({ entries: many })).toBe('entries')
    expect(validateNameSpelling({ entries: many.slice(0, MAX_NAME_ENTRIES) })).toBeNull()
  })

  it('review: zero-width characters, NFD input and empty-after-punctuation names', () => {
    // রফিকুল typed with a zero-width joiner and in decomposed form.
    expect(compareNames('র\u200Dফিকুল ইসলাম', 'রফিকুল ইসলাম'.normalize('NFD')).match).toBe(true)
    expect(validateNameSpelling({ entries: [{ id: 'a', name: 'Rafiq' }, { id: 'b', name: '\u200B .,-' }] })).toBe('name')
  })
})
