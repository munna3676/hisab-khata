/**
 * Bijoy (SutonnyMJ and the other "MJ" ANSI fonts) ⇄ Unicode Bangla.
 *
 * Bijoy stores Bangla in the code points of Windows-1252: each byte is a
 * glyph, typed in visual order. So ি, ে and ৈ come before the consonant
 * they follow when spoken, reph (©) comes after its consonant, and ো / ৌ are
 * split around it (‡Kv = কো, ‡KŠ = কৌ). Conversion maps the glyphs and then
 * moves those signs into Unicode's logical order, or back.
 *
 * Glyph table: the SutonnyMJ code chart used by the open-source converters
 * @codesigntheory/bnbijoy2unicode and @codesigntheory/bnunicode2ansi
 * (Utsob Roy, MIT, https://gitlab.com/codesigntheory/bnunicode2ansi) and
 * bijoy2unicode (Md. Jehad, MIT, https://www.npmjs.com/package/bijoy2unicode).
 * Where they disagree, this file follows the pair that both encoders write:
 * ² = ক্ষ্ম (j²x = লক্ষ্মী), è = ণ-ফলা (nè = হ্ণ). ¹, an older জ্ঞ that both
 * decoders read, is read but never written. A font encoding is a fixed
 * fact, so the table is a constant here, not data.
 */

const ZWJ = '\u200D'
const ZWNJ = '\u200C'
const HASANTA = '্'

type Kind = 'vowel' | 'cons' | 'half' | 'phala' | 'preKar' | 'postKar' | 'reph' | 'sign' | 'other'

/** Bijoy glyph(s) → Unicode, with the role the glyph plays in a syllable. */
const BIJOY_TABLE: readonly (readonly [string, string, Kind])[] = [
  // Independent vowels. "Av" must win over "A".
  ['Av', 'আ', 'vowel'], ['A', 'অ', 'vowel'], ['B', 'ই', 'vowel'], ['C', 'ঈ', 'vowel'], ['D', 'উ', 'vowel'],
  ['E', 'ঊ', 'vowel'], ['F', 'ঋ', 'vowel'], ['G', 'এ', 'vowel'], ['H', 'ঐ', 'vowel'], ['I', 'ও', 'vowel'],
  ['J', 'ঔ', 'vowel'],
  // Consonants.
  ['K', 'ক', 'cons'], ['L', 'খ', 'cons'], ['M', 'গ', 'cons'], ['N', 'ঘ', 'cons'], ['O', 'ঙ', 'cons'],
  ['P', 'চ', 'cons'], ['Q', 'ছ', 'cons'], ['R', 'জ', 'cons'], ['S', 'ঝ', 'cons'], ['T', 'ঞ', 'cons'],
  ['U', 'ট', 'cons'], ['V', 'ঠ', 'cons'], ['W', 'ড', 'cons'], ['X', 'ঢ', 'cons'], ['Y', 'ণ', 'cons'],
  ['Z', 'ত', 'cons'], ['_', 'থ', 'cons'], ['`', 'দ', 'cons'], ['a', 'ধ', 'cons'], ['b', 'ন', 'cons'],
  ['c', 'প', 'cons'], ['d', 'ফ', 'cons'], ['e', 'ব', 'cons'], ['f', 'ভ', 'cons'], ['g', 'ম', 'cons'],
  ['h', 'য', 'cons'], ['i', 'র', 'cons'], ['j', 'ল', 'cons'], ['k', 'শ', 'cons'], ['l', 'ষ', 'cons'],
  ['m', 'স', 'cons'], ['n', 'হ', 'cons'], ['o', 'ড়', 'cons'], ['p', 'ঢ়', 'cons'], ['q', 'য়', 'cons'],
  ['r', 'ৎ', 'cons'],
  // Whole conjuncts drawn as one glyph.
  ['°', 'ক্ক', 'cons'], ['±', 'ক্ট', 'cons'], ['²', 'ক্ষ্ম', 'cons'], ['³', 'ক্ত', 'cons'], ['´', 'ক্ম', 'cons'],
  ['µ', 'ক্র', 'cons'], ['¶', 'ক্ষ', 'cons'], ['·', 'ক্স', 'cons'], ['¸', 'গু', 'cons'], ['º', 'গ্দ', 'cons'],
  ['»', 'গ্ধ', 'cons'], ['¼', 'ঙ্ক', 'cons'], ['½', 'ঙ্গ', 'cons'], ['¾', 'জ্জ', 'cons'], ['À', 'জ্ঝ', 'cons'],
  ['Á', 'জ্ঞ', 'cons'], ['¹', 'জ্ঞ', 'cons'], ['Â', 'ঞ্চ', 'cons'], ['Ã', 'ঞ্ছ', 'cons'], ['Ä', 'ঞ্জ', 'cons'], ['Å', 'ঞ্ঝ', 'cons'],
  ['Æ', 'ট্ট', 'cons'], ['Ç', 'ড্ড', 'cons'], ['È', 'ণ্ট', 'cons'], ['É', 'ণ্ঠ', 'cons'], ['Ê', 'ণ্ড', 'cons'],
  ['Ë', 'ত্ত', 'cons'], ['Ì', 'ত্থ', 'cons'], ['Î', 'ত্র', 'cons'], ['Ï', 'দ্দ', 'cons'], ['×', 'দ্ধ', 'cons'],
  ['Ø', 'দ্ব', 'cons'], ['Ù', 'দ্ম', 'cons'], ['Ú', 'ন্ঠ', 'cons'], ['Û', 'ন্ড', 'cons'], ['Ü', 'ন্ধ', 'cons'],
  ['Ý', 'ন্স', 'cons'], ['Þ', 'প্ট', 'cons'], ['ß', 'প্ত', 'cons'], ['à', 'প্প', 'cons'], ['á', 'প্স', 'cons'],
  ['â', 'ব্জ', 'cons'], ['ã', 'ব্দ', 'cons'], ['ä', 'ব্ধ', 'cons'], ['å', 'ভ্র', 'cons'], ['ç', 'ম্ফ', 'cons'],
  ['é', 'ল্ক', 'cons'], ['ê', 'ল্গ', 'cons'], ['ë', 'ল্ট', 'cons'], ['ì', 'ল্ড', 'cons'], ['í', 'ল্প', 'cons'],
  ['î', 'ল্ফ', 'cons'], ['ï', 'শু', 'cons'], ['ð', 'শ্চ', 'cons'], ['ñ', 'শ্ছ', 'cons'], ['ò', 'ষ্ণ', 'cons'],
  ['ó', 'ষ্ট', 'cons'], ['ô', 'ষ্ঠ', 'cons'], ['õ', 'ষ্ফ', 'cons'], ['ö', 'স্খ', 'cons'], ['÷', 'স্ট', 'cons'],
  ['ù', 'স্ফ', 'cons'], ['û', 'হু', 'cons'], ['ü', 'হৃ', 'cons'], ['ý', 'হ্ন', 'cons'], ['þ', 'হ্ম', 'cons'],
  ['ÿ', 'ক্ষ', 'cons'],
  // ø is স্ন on its own but ল-ফলা after a consonant (jø = ল্ল); see readCluster.
  ['ø', 'স্ন', 'cons'],
  // Half forms: the first consonant of a conjunct, joined to the next glyph.
  ['®', 'ষ্', 'half'], ['¯', 'স্', 'half'], ['”', 'চ্', 'half'], ['˜', 'দ্', 'half'], ['™', 'দ্', 'half'],
  ['š', 'ন্', 'half'], ['›', 'ন্', 'half'], ['¤', 'ম্', 'half'], ['•', 'ঙ্', 'half'],
  // Phala and other following forms, joined to the glyph before.
  ['¨', '্য', 'phala'], ['ª', '্র', 'phala'], ['«', '্র', 'phala'], ['Ö', '্র', 'phala'], ['¬', '্ল', 'phala'],
  ['\u00AD', '্ল', 'phala'], ['^', '্ব', 'phala'], ['¡', '্ব', 'phala'], ['Ÿ', '্ব', 'phala'], ['¦', '্ব', 'phala'],
  ['¥', '্ম', 'phala'], ['§', '্ম', 'phala'], ['œ', '্ন', 'phala'], ['è', '্ণ', 'phala'], ['ú', '্প', 'phala'],
  ['‹', '্ক', 'phala'], ['Œ', '্ক্র', 'phala'], ['—', '্ত', 'phala'], ['Í', '্ত', 'phala'], ['‘', '্তু', 'phala'],
  ['’', '্থ', 'phala'], ['¢', '্ভ', 'phala'], ['£', '্ভ্র', 'phala'], ['¿', '্ত্র', 'phala'],
  // Explicit hasanta; ZWNJ keeps it visible instead of forming a conjunct.
  ['&', HASANTA + ZWNJ, 'phala'],
  // Vowel signs typed before the consonant.
  ['w', 'ি', 'preKar'], ['†', 'ে', 'preKar'], ['‡', 'ে', 'preKar'], ['ˆ', 'ৈ', 'preKar'], ['‰', 'ৈ', 'preKar'],
  // Vowel signs typed after it (several glyph widths for ু, ূ, ৃ).
  ['v', 'া', 'postKar'], ['x', 'ী', 'postKar'], ['y', 'ু', 'postKar'], ['z', 'ু', 'postKar'], ['æ', 'ু', 'postKar'],
  ['“', 'ু', 'postKar'], ['–', 'ু', 'postKar'], ['~', 'ূ', 'postKar'], ['ƒ', 'ূ', 'postKar'], ['‚', 'ূ', 'postKar'],
  ['„', 'ৃ', 'postKar'], ['…', 'ৃ', 'postKar'], ['Š', 'ৗ', 'postKar'],
  ['©', 'র্', 'reph'],
  ['s', 'ং', 'sign'], ['t', 'ঃ', 'sign'], ['u', 'ঁ', 'sign'],
  // Digits, danda, quotes, taka sign.
  ['0', '০', 'other'], ['1', '১', 'other'], ['2', '২', 'other'], ['3', '৩', 'other'], ['4', '৪', 'other'],
  ['5', '৫', 'other'], ['6', '৬', 'other'], ['7', '৭', 'other'], ['8', '৮', 'other'], ['9', '৯', 'other'],
  ['|', '।', 'other'], ['Ò', '“', 'other'], ['Ó', '”', 'other'], ['Ô', '‘', 'other'], ['Õ', '’', 'other'],
  ['Ñ', '-', 'other'], ['$', '৳', 'other'],
]

const BIJOY_LOOKUP = new Map(BIJOY_TABLE.map(([b, u, kind]) => [b, { b, u, kind }]))

/**
 * Text pasted from an old file sometimes carries C1 control codes (U+0080–U+009F)
 * where Windows-1252 has printable glyphs (0x87 should be ‡). Map them back.
 */
const CP1252_C1 = '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008DŽ\u008F\u0090‘’“”•–—˜™š›œ\u009DžŸ'

interface Token {
  b: string
  u: string
  kind: Kind
}

function tokenizeBijoy(text: string): Token[] {
  const fixed = text.replace(/[\u0080-\u009F]/g, (c) => CP1252_C1[c.charCodeAt(0) - 0x80]!)
  const tokens: Token[] = []
  for (let i = 0; i < fixed.length; ) {
    const two = BIJOY_LOOKUP.get(fixed.slice(i, i + 2))
    const one = BIJOY_LOOKUP.get(fixed[i]!)
    const hit = two ?? one
    if (hit) {
      tokens.push(hit)
      i += hit.b.length
    } else {
      tokens.push({ b: fixed[i]!, u: fixed[i]!, kind: 'other' })
      i += 1
    }
  }
  return tokens
}

/** Pre-kar ে with a following া or ৗ is one vowel sign: ো, ৌ. */
function joinKars(pre: string, post: string): string {
  if (pre === 'ে' && post.startsWith('া')) return 'ো' + post.slice(1)
  if (pre === 'ে' && post.startsWith('ৗ')) return 'ৌ' + post.slice(1)
  return pre + post
}

/** Bijoy (SutonnyMJ) text → Unicode Bangla, NFC-normalised. */
export function bijoyToUnicode(text: string): string {
  const tokens = tokenizeBijoy(text)
  let out = ''
  let i = 0
  while (i < tokens.length) {
    const first = tokens[i]!
    if (first.kind !== 'preKar' && first.kind !== 'cons' && first.kind !== 'half') {
      out += first.u
      i++
      continue
    }

    let pre = ''
    let signs = ''
    if (first.kind === 'preKar') {
      pre = first.u
      i++
      // ঁ is sometimes typed between the pre-kar and its consonant.
      while (tokens[i]?.kind === 'sign') signs += tokens[i++]!.u
    }

    // The consonant cluster: half forms, one consonant glyph, phala forms.
    let cluster = ''
    while (tokens[i]?.kind === 'half') cluster += tokens[i++]!.u
    // After a half form ø is ল-ফলা (¤ø = ম্ল), so it is left for the phala loop.
    if (tokens[i]?.kind === 'cons' && !(cluster !== '' && tokens[i]!.b === 'ø')) cluster += tokens[i++]!.u
    if (cluster === '') {
      out += pre + signs
      continue
    }
    for (let t = tokens[i]; t && (t.kind === 'phala' || t.b === 'ø'); t = tokens[++i]) {
      cluster += t.b === 'ø' ? '্ল' : t.u
    }
    // A half form meeting a phala gives a doubled hasanta (¯ + Í = স্ + ্ত).
    cluster = cluster.replace(/্্+/g, HASANTA)
    // i¨ (i¨ve, RAB) is র + য-ফলা, not reph: Unicode writes it র + ZWJ + ্য.
    if (cluster === 'র্য') cluster = 'র' + ZWJ + '্য'

    // Reph, post-kars and signs may follow in any order.
    let reph = false
    let post = ''
    for (let t = tokens[i]; t; t = tokens[++i]) {
      if (t.kind === 'reph') reph = true
      else if (t.kind === 'postKar') post += t.u
      else if (t.kind === 'sign') signs += t.u
      else break
    }
    out += (reph ? 'র্' : '') + cluster + joinKars(pre, post) + signs
  }
  return out.normalize('NFC')
}

/**
 * Unicode cluster pieces → Bijoy glyphs, matched longest first. A consonant
 * pair not listed here is written with an explicit hasanta (&), which every
 * MJ font shows correctly.
 */
const CLUSTER_GLYPHS: Readonly<Record<string, string>> = {
  'ক্ক': '°', 'ক্ট': '±', 'ক্ষ্ম': '²', 'ক্ত': '³', 'ক্ম': '´', 'ক্র': 'µ', 'ক্ষ': '¶', 'ক্স': '·', 'ক্ব': 'K¡',
  'গ্দ': 'º', 'গ্ধ': '»', 'গ্র': 'MÖ', 'গ্ল': 'Mø', 'ঙ্ক': '¼', 'ঙ্গ': '½', 'ঙ্ক্ষ': '•¶', 'ঙ্খ': '•L', 'ঙ্ঘ': '•N',
  'চ্চ': '”P', 'চ্ছ': '”Q', 'চ্ছ্ব': '”Q¡', 'চ্ঞ': '”T', 'জ্জ': '¾', 'জ্জ্ব': '¾¡', 'জ্ঝ': 'À', 'জ্ঞ': 'Á', 'জ্ব': 'R¡',
  'ঞ্চ': 'Â', 'ঞ্ছ': 'Ã', 'ঞ্জ': 'Ä', 'ঞ্ঝ': 'Å', 'ট্ট': 'Æ', 'ট্ব': 'U¡', 'ড্ড': 'Ç',
  'ণ্ট': 'È', 'ণ্ঠ': 'É', 'ণ্ড': 'Ê', 'ণ্ব': 'Y^', 'ত্ত': 'Ë', 'ত্ত্ব': 'Ë¡', 'ত্থ': 'Ì', 'ত্র': 'Î', 'ত্ব': 'Z¡',
  'থ্ব': '_¡', 'দ্গ': '˜M', 'দ্ঘ': '˜N', 'দ্দ': 'Ï', 'দ্ধ': '×', 'দ্ব': 'Ø', 'দ্ভ': '™¢', 'দ্ম': 'Ù', 'ধ্ব': 'aŸ',
  'ন্ট': '›U', 'ন্ঠ': 'Ú', 'ন্ড': 'Û', 'ন্ত': 'šÍ', 'ন্ত্র': 'š¿', 'ন্ত্ব': 'šÍ¡', 'ন্থ': 'š’', 'ন্দ': '›`',
  'ন্দ্ব': '›Ø', 'ন্ধ': 'Ü', 'ন্ব': 'š^', 'ন্স': 'Ý',
  'প্ট': 'Þ', 'প্ত': 'ß', 'প্প': 'à', 'প্স': 'á', 'প্র': 'cÖ', 'প্ল': 'cø', 'ব্জ': 'â', 'ব্দ': 'ã', 'ব্ধ': 'ä',
  'ব্ব': 'eŸ', 'ব্ল': 'eø', 'ভ্র': 'å', 'ম্প': '¤ú', 'ম্প্র': '¤cÖ', 'ম্ফ': 'ç', 'ম্ব': '¤^', 'ম্ভ': '¤¢',
  'ম্ভ্র': '¤£', 'ম্ম': '¤§', 'ম্ল': '¤ø',
  'ল্ক': 'é', 'ল্গ': 'ê', 'ল্ট': 'ë', 'ল্ড': 'ì', 'ল্প': 'í', 'ল্ফ': 'î', 'ল্ব': 'j¦', 'ল্ল': 'jø',
  'শ্চ': 'ð', 'শ্ছ': 'ñ', 'শ্ব': 'k¦', 'শ্ল': 'kø', 'ষ্ক': '®‹', 'ষ্ক্র': '®Œ', 'ষ্ট': 'ó', 'ষ্ঠ': 'ô', 'ষ্ণ': 'ò',
  'ষ্প': '®ú', 'ষ্ফ': 'õ', 'ষ্ম': '®§',
  'স্ক': '¯‹', 'স্ক্র': '¯Œ', 'স্খ': 'ö', 'স্ট': '÷', 'স্ত': '¯Í', 'স্ত্র': '¯¿', 'স্থ': '¯’', 'স্প': '¯ú',
  'স্ফ': 'ù', 'স্ব': '¯^', 'স্ম': '¯§', 'স্ল': '¯ø', 'হ্ন': 'ý', 'হ্ম': 'þ', 'হ্ব': 'nŸ', 'হ্ল': 'n¬',
  ['র' + ZWJ + '্য']: 'i¨',
  ['র' + ZWNJ + '্য']: 'i¨',
  // Phala forms that attach to any consonant.
  '্র': 'ª', '্য': '¨', '্ব': '¡', '্ম': '¥', '্ন': 'œ', '্ণ': 'è', '্ল': '¬',
  // Single consonants.
  'ক': 'K', 'খ': 'L', 'গ': 'M', 'ঘ': 'N', 'ঙ': 'O', 'চ': 'P', 'ছ': 'Q', 'জ': 'R', 'ঝ': 'S', 'ঞ': 'T',
  'ট': 'U', 'ঠ': 'V', 'ড': 'W', 'ঢ': 'X', 'ণ': 'Y', 'ত': 'Z', 'থ': '_', 'দ': '`', 'ধ': 'a', 'ন': 'b',
  'প': 'c', 'ফ': 'd', 'ব': 'e', 'ভ': 'f', 'ম': 'g', 'য': 'h', 'র': 'i', 'ল': 'j', 'শ': 'k', 'ষ': 'l',
  'স': 'm', 'হ': 'n', 'ড়': 'o', 'ঢ়': 'p', 'য়': 'q',
}
const LONGEST_CLUSTER_KEY = Math.max(...Object.keys(CLUSTER_GLYPHS).map((k) => k.length))

/** Consonant + vowel sign drawn as one glyph. */
const KAR_LIGATURES: Readonly<Record<string, string>> = {
  'গু': '¸', 'শু': 'ï', 'হু': 'û', 'হৃ': 'ü', 'রু': 'i“', 'রূ': 'iƒ', 'ন্তু': 'š‘', 'স্তু': '¯‘',
}

/** Everything outside a consonant cluster. */
const OTHER_GLYPHS: Readonly<Record<string, string>> = {
  'অ': 'A', 'আ': 'Av', 'ই': 'B', 'ঈ': 'C', 'উ': 'D', 'ঊ': 'E', 'ঋ': 'F', 'এ': 'G', 'ঐ': 'H', 'ও': 'I', 'ঔ': 'J',
  'ৎ': 'r', 'ং': 's', 'ঃ': 't', 'ঁ': 'u', '্': '&',
  'া': 'v', 'ি': 'w', 'ী': 'x', 'ু': 'y', 'ূ': '~', 'ৃ': '„', 'ে': '‡', 'ৈ': '‰', 'ৗ': 'Š',
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  '।': '|', '“': 'Ò', '”': 'Ó', '‘': 'Ô', '’': 'Õ', '৳': '$', [ZWJ]: '', [ZWNJ]: '',
}

const CONSONANTS = 'কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ'
const KARS = 'ািীুূৃেৈোৌৗ'
const SIGNS = 'ঁংঃ'

/** Length of the consonant at `i` (2 for ড়, ঢ়, য় written with a nukta), or 0. */
function consonantAt(s: string, i: number): number {
  const c = s[i]
  if (c === undefined || !CONSONANTS.includes(c)) return 0
  return s[i + 1] === '়' ? 2 : 1
}

function isBangla(c: string | undefined): boolean {
  return c !== undefined && ((c >= 'ঀ' && c <= '৿') || c === ZWJ || c === ZWNJ)
}

function clusterToBijoy(cluster: string): string {
  let out = ''
  for (let i = 0; i < cluster.length; ) {
    let matched = false
    for (let len = Math.min(LONGEST_CLUSTER_KEY, cluster.length - i); len > 0; len--) {
      const glyph = CLUSTER_GLYPHS[cluster.slice(i, i + len)]
      if (glyph !== undefined) {
        out += glyph
        i += len
        matched = true
        break
      }
    }
    if (!matched) {
      out += OTHER_GLYPHS[cluster[i]!] ?? cluster[i]!
      i++
    }
  }
  return out
}

/** The glyph for a vowel sign written after the cluster (ু and ৃ have width variants). */
function postKarGlyph(kar: string, cluster: string): string {
  const last = cluster.replace(/়$/, '').at(-1)
  if (kar === 'ু') return last === 'ক' ? 'z' : last === 'র' ? '“' : 'y'
  if (kar === 'ূ') return last === 'র' ? 'ƒ' : '~'
  if (kar === 'ৃ') return last === 'ক' || last === 'ত' ? '…' : '„'
  return OTHER_GLYPHS[kar] ?? kar
}

/** Unicode Bangla → Bijoy (SutonnyMJ) text. Non-Bangla characters pass through. */
export function unicodeToBijoy(text: string): string {
  const s = text.normalize('NFC')
  let out = ''
  for (let i = 0; i < s.length; ) {
    if (!consonantAt(s, i)) {
      const c = s[i]!
      // অ্যা / এ্যা: a vowel letter carrying য-ফলা is typed A¨v, not A&hv.
      if ((c === 'অ' || c === 'এ') && s[i + 1] === HASANTA && s[i + 2] === 'য' && s[i + 3] !== '়') {
        out += OTHER_GLYPHS[c]! + '¨'
        i += 3
        continue
      }
      out += OTHER_GLYPHS[c] ?? c
      i++
      continue
    }
    const wordStart = !isBangla(s[i - 1])

    // Reph: র + hasanta at the head of a cluster.
    let reph = false
    if (s[i] === 'র' && s[i + 1] === HASANTA && consonantAt(s, i + 2)) {
      reph = true
      i += 2
    }
    const start = i
    i += consonantAt(s, i)
    for (;;) {
      const j = s[i] === ZWJ || s[i] === ZWNJ ? i + 1 : i
      if (s[j] !== HASANTA || !consonantAt(s, j + 1)) break
      i = j + 1 + consonantAt(s, j + 1)
    }
    const cluster = s.slice(start, i)

    let hasanta = false
    if (s[i] === HASANTA) {
      hasanta = true
      i++
      if (s[i] === ZWNJ || s[i] === ZWJ) i++
    }
    const kar = !hasanta && s[i] !== undefined && KARS.includes(s[i]!) ? s[i++]! : ''
    let signs = ''
    while (s[i] !== undefined && SIGNS.includes(s[i]!)) signs += OTHER_GLYPHS[s[i++]!]!

    const ePre = wordStart ? '†' : '‡'
    let pre = ''
    let post = ''
    let body = clusterToBijoy(cluster)
    if (kar === 'ি') pre = 'w'
    else if (kar === 'ে') pre = ePre
    else if (kar === 'ৈ') pre = '‰'
    else if (kar === 'ো') [pre, post] = [ePre, 'v']
    else if (kar === 'ৌ') [pre, post] = [ePre, 'Š']
    else if (kar !== '' && KAR_LIGATURES[cluster + kar] !== undefined) body = KAR_LIGATURES[cluster + kar]!
    else if (kar !== '') post = postKarGlyph(kar, cluster)

    out += pre + body + (hasanta ? '&' : '') + (reph ? '©' : '') + post + signs
  }
  return out
}

export type BijoyDirection = 'toBijoy' | 'toUnicode'

export interface BijoyInput {
  text: string
  /** "toBijoy" (ইউনিকোড → বিজয়) or "toUnicode" (বিজয় → ইউনিকোড). */
  direction: BijoyDirection
}

export interface BijoyResult {
  text: string
  /**
   * A hint for the screen: "alreadyUnicode" when Bijoy → Unicode was asked
   * for text that is already Unicode Bangla (wrong direction), "latin" when
   * Unicode → Bijoy text has English letters, which a SutonnyMJ font would
   * show as Bangla glyphs. Null when nothing looks off.
   */
  warning: 'alreadyUnicode' | 'latin' | null
}

/** Longest text the screen converts at once. */
export const BIJOY_MAX_LENGTH = 100_000

export type BijoyError = 'text' | 'direction'

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateBijoy(input: BijoyInput): BijoyError | null {
  if (typeof input.text !== 'string' || input.text.length > BIJOY_MAX_LENGTH) return 'text'
  if (input.direction !== 'toBijoy' && input.direction !== 'toUnicode') return 'direction'
  return null
}

/** Converts the text in the chosen direction. */
export function calculateBijoy(input: BijoyInput): BijoyResult {
  if (input.direction === 'toBijoy') {
    return { text: unicodeToBijoy(input.text), warning: /[A-Za-z]/.test(input.text) ? 'latin' : null }
  }
  const alreadyUnicode = /[ঀ-৿]/.test(input.text)
  return { text: alreadyUnicode ? input.text : bijoyToUnicode(input.text), warning: alreadyUnicode ? 'alreadyUnicode' : null }
}
