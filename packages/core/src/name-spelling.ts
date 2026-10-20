/**
 * The name-spelling checker (G1 নাম-বানান মিল চেকার): compares how one name
 * (own, father's or mother's) is written on NID, SSC certificate, birth
 * registration and passport, in Bangla or English, and reports the parts
 * that differ. Case, spacing, punctuation and initials are normalised away;
 * vowel and transliteration differences are matched loosely; which forms
 * count as the same name part (মোঃ = MD) or as a different form of it
 * (মোঃ ≠ মোহাম্মদ) comes from data/text/name-variants.json.
 */

/**
 * One form of a name part, in every script it is written in. Groups that
 * share a family are different forms of the same name: মোঃ/MD and
 * মোহাম্মদ/Mohammad are two groups of the family "mohammad".
 */
export interface NameVariantGroup {
  id: string
  variants: string[]
  family?: string
}

/** The name as one document has it. */
export interface NameEntry {
  /** Document id, e.g. "nid", "ssc", "birth-registration", "passport". */
  id: string
  name: string
}

export interface NameSpellingInput {
  /** At least two documents; the first is the reference the others line up against. */
  entries: NameEntry[]
  variants?: NameVariantGroup[]
  /** Correction guide id by document id, e.g. { nid: "nid-correction" }. */
  guides?: Readonly<Record<string, string>>
}

/**
 * How two name parts compare:
 * - same: identical once case and punctuation are ignored.
 * - translit: the same part in Bangla and English (রফিকুল / RAFIQUL, মোঃ / MD).
 * - spelling: the same part spelt differently (রফিকুল / রফীকুল, Mohammad / Muhammad).
 * - spacing: the same letters split differently (আবুল কালাম / আবুলকালাম).
 * - variant: another form of the same name (মোহাম্মদ / মোঃ).
 * - different: not the same name part.
 * - missing / extra: the part is only on one document.
 */
export type NameMatchLevel = 'same' | 'translit' | 'spelling' | 'spacing' | 'variant' | 'different' | 'missing' | 'extra'

export type NameSeverity = 'low' | 'medium' | 'high'

/** Null for levels that count as a match. */
export function nameSeverity(level: NameMatchLevel): NameSeverity | null {
  switch (level) {
    case 'same':
    case 'translit':
      return null
    case 'spelling':
    case 'spacing':
      return 'low'
    case 'variant':
      return 'medium'
    default:
      return 'high'
  }
}

const SEVERITY_RANK: Record<NameSeverity, number> = { low: 1, medium: 2, high: 3 }

function worse(a: NameSeverity | null, b: NameSeverity | null): NameSeverity | null {
  if (a === null) return b
  if (b === null) return a
  return SEVERITY_RANK[b] > SEVERITY_RANK[a] ? b : a
}

// ---- Normalising ----

type Script = 'bn' | 'en'

interface Token {
  /** As written, e.g. "মোঃ", "Md.", "A.K.M.". */
  text: string
  /** Lower case, no punctuation: "মো", "md", "akm". */
  form: string
  script: Script
  /** Set in an issue slot when this part is the reference's part(s) split or joined differently. */
  spacing?: 'start' | 'continued'
}

const BANGLA = /[\u0980-\u09FF]/

function scriptOf(text: string): Script {
  return BANGLA.test(text) ? 'bn' : 'en'
}

/** Lower case, NFC, without zero-width joiners, punctuation or the abbreviation visarga (মোঃ → মো). */
function formOf(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/\u0983/g, '')
    .replace(/[^\p{L}\p{M}\p{N}]/gu, '')
}

/**
 * Splits a name into parts. Spaces, commas, hyphens and slashes separate
 * parts; a dot, colon or visarga followed by a letter does too ("Md.Rafiqul").
 * Runs of single English letters are initials and become one part, so
 * "A.K.M.", "A K M" and "AKM" all read "akm".
 */
function tokenize(name: string): Token[] {
  const pieces = name
    .normalize('NFC')
    .replace(/[\u200B-\u200D\u00AD]/g, '')
    .split(/[\s,\-_/]+/)
    .flatMap((p, word) => p.split(/(?<=[.:\u0983])(?=[^\s.:])/).map((text) => ({ text, word })))
    .map(({ text, word }) => ({ text, word, form: formOf(text), script: scriptOf(text) }))
    .filter((t) => t.form !== '')

  const tokens: (Token & { initials: boolean; word: number })[] = []
  for (const { word, ...t } of pieces) {
    const prev = tokens[tokens.length - 1]
    const initial = /^[a-z]$/.test(t.form)
    if (initial && prev?.initials) {
      // "A.K.M." stays as written; "A K M" keeps its spaces.
      prev.text += (prev.word === word ? '' : ' ') + t.text
      prev.form += t.form
      prev.word = word
    } else tokens.push({ ...t, initials: initial, word })
  }
  return tokens.map(({ text, form, script }) => ({ text, form, script }))
}

/** Bangla vowel signs and letters that are often swapped in names: ী/ি, ূ/ু, ঈ/ই, ঊ/উ, ৎ/ত, chandrabindu, final hasanta. */
function banglaLoose(form: string): string {
  return form
    .replace(/\u09C0/g, '\u09BF')
    .replace(/\u09C2/g, '\u09C1')
    .replace(/\u0988/g, '\u0987')
    .replace(/\u098A/g, '\u0989')
    .replace(/\u09CE/g, '\u09A4')
    .replace(/\u0981/g, '')
    .replace(/\u09CD$/, '')
}

/** Bangla consonants as the Latin letters they are usually written with; vowels and হ are left out. */
const BN_SKELETON: Readonly<Record<string, string>> = {
  ক: 'k', খ: 'k', গ: 'g', ঘ: 'g', ঙ: 'ng', চ: 'c', ছ: 'c', জ: 'j', ঝ: 'j', ঞ: 'n',
  ট: 't', ঠ: 't', ড: 'd', ঢ: 'd', ণ: 'n', ত: 't', থ: 't', দ: 'd', ধ: 'd', ন: 'n',
  প: 'p', ফ: 'f', ব: 'b', ভ: 'b', ম: 'm', য: 'j', র: 'r', ল: 'l', শ: 's', ষ: 's',
  স: 's', 'ৎ': 't', 'ং': 'ng',
}

/**
 * The consonants of a name part in Latin letters, with aspiration, vowels,
 * h, w, y and doubled letters dropped, so "মোহাম্মদ", "Mohammad" and
 * "Muhammad" all read "md", "রফিকুল" and "Rafiqul" read "rfkl".
 */
function skeleton(token: Token): string {
  let latin: string
  if (token.script === 'bn') {
    // NFC keeps ড়, ঢ় and য় as a letter + nukta (they are composition exclusions), so read the pair first.
    const chars = [...token.form.normalize('NFC')]
    latin = ''
    for (let i = 0; i < chars.length; i++) {
      const pair = chars[i]! + (chars[i + 1] ?? '')
      if (pair === '\u09A1\u09BC' || pair === '\u09A2\u09BC') {
        latin += 'r'
        i++
      } else if (pair === '\u09AF\u09BC') i++
      // ব-ফলা and য-ফলা only lengthen the consonant before them: বিশ্বাস = Biswas, সত্য = Satya.
      else if (pair === '\u09CD\u09AC' || pair === '\u09CD\u09AF') i++
      // ঋ-কার is read "ri": কৃষ্ণ = Krishna, হৃদয় = Hridoy.
      else if (chars[i] === '\u09C3' || chars[i] === '\u098B') latin += 'r'
      else latin += BN_SKELETON[chars[i]!] ?? ''
    }
  } else {
    latin = token.form
      .replace(/[^a-z]/g, '')
      .replace(/sh/g, 's')
      .replace(/ch/g, 'c')
      .replace(/ck/g, 'k')
      .replace(/ph/g, 'f')
      .replace(/([kgtdbj])h/g, '$1')
      .replace(/q/g, 'k')
      .replace(/z/g, 'j')
      .replace(/v/g, 'b')
      .replace(/x/g, 'ks')
      .replace(/[aeiouyhw]/g, '')
  }
  return latin.replace(/h/g, '').replace(/(.)\1+/g, '$1')
}

/**
 * How a name part ends, so a consonant skeleton never hides an added or
 * dropped final vowel (রহিম / RAHIMA, Hasan / Hasina are different names):
 * - c: a consonant (রহিম, Rahim, রায়, Roy);
 * - v: a vowel (রহিমা, Rahima, আলী, Ali, Chowdhury);
 * - o: either, because the vowel is the unwritten inherent "o/a" or a
 *   silent letter (দত্ত = Dutta, দেবব্রত = Debabrata, শুভ = Shuvo, শুভো,
 *   Rafique). A final h after a vowel is not counted (উল্লাহ = Ulla, Shah).
 */
type Ending = 'c' | 'v' | 'o'

function endingOf(token: Token): Ending {
  if (token.script === 'bn') {
    const chars = [...token.form.replace(/(?<=[\u0985-\u0994\u09BE-\u09CC\u09D7])\u09B9$/, '')]
    const last = chars[chars.length - 1] ?? ''
    if (last === '\u09CB') return 'o'
    if (/[\u0985-\u0994\u09BE-\u09CC\u09D7]/.test(last)) return 'v'
    // A bare consonant after a conjunct keeps its inherent vowel: দত্ত, মিত্র, দেবব্রত.
    if (/[\u0995-\u09B9]/.test(last) && (chars[chars.length - 2] === '\u09CD' || chars[chars.length - 3] === '\u09CD')) return 'o'
    return 'c'
  }
  const latin = token.form.replace(/[^a-z]/g, '').replace(/(?<=[aeiou])h$/, '')
  const last = latin.slice(-1)
  if (last === 'o' || last === 'e') return 'o'
  if (last === 'a' || last === 'i' || last === 'u') return 'v'
  // Roy = রায়, but Dey = দে and Chowdhury = চৌধুরী.
  if (last === 'y') return /ey$/.test(latin) ? 'o' : /[aiou]y$/.test(latin) ? 'c' : 'v'
  return 'c'
}

function sameEnding(a: Token, b: Token): boolean {
  const ea = endingOf(a)
  const eb = endingOf(b)
  return ea === eb || ea === 'o' || eb === 'o'
}

// ---- Comparing parts ----

interface VariantIndex {
  /** Group by the normalised form of each variant. */
  byForm: Map<string, NameVariantGroup>
}

function indexVariants(groups: readonly NameVariantGroup[] | undefined): VariantIndex {
  const byForm = new Map<string, NameVariantGroup>()
  for (const g of groups ?? []) for (const v of g.variants) byForm.set(formOf(v), g)
  return { byForm }
}

export interface NameTokenMatch {
  /** The part on the first document of the pair; null when it is missing there. */
  a: string | null
  b: string | null
  level: NameMatchLevel
  severity: NameSeverity | null
  /** The variant group that made the two the same part, e.g. "md" for মোঃ = MD. */
  groupId?: string
}

function compareTokens(a: Token, b: Token, index: VariantIndex): { level: NameMatchLevel; groupId?: string } {
  if (a.form === b.form) return { level: 'same' }
  const ga = index.byForm.get(a.form)
  const gb = index.byForm.get(b.form)
  if (ga && gb) {
    if (ga === gb) return { level: a.script === b.script ? 'spelling' : 'translit', groupId: ga.id }
    if (ga.family !== undefined && ga.family === gb.family) return { level: 'variant' }
  }
  const sameSkeleton = skeleton(a) === skeleton(b) && skeleton(a) !== '' && sameEnding(a, b)
  if (a.script !== b.script) return { level: sameSkeleton ? 'translit' : 'different' }
  if (a.script === 'bn' && banglaLoose(a.form) === banglaLoose(b.form)) return { level: 'spelling' }
  return { level: sameSkeleton ? 'spelling' : 'different' }
}

/** Higher is a better match; used to line parts up. */
const LEVEL_SCORE: Partial<Record<NameMatchLevel, number>> = { same: 4, translit: 4, spelling: 3, variant: 2 }

/**
 * Lines two names up part by part (a weighted longest common subsequence
 * over parts that are not "different"), then explains each gap: the same
 * letters split differently, parts swapped for others, or parts missing.
 */
interface Aligned extends NameTokenMatch {
  /** How many parts of each name this entry covers (more than 1 only for "spacing"). */
  aCount: number
  bCount: number
}

function alignTokens(a: Token[], b: Token[], index: VariantIndex): Aligned[] {
  const n = a.length
  const m = b.length
  const cmp = a.map((ta) => b.map((tb) => compareTokens(ta, tb, index)))
  const score: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const s = LEVEL_SCORE[cmp[i]![j]!.level]
      score[i]![j] = Math.max(score[i + 1]![j]!, score[i]![j + 1]!, s ? s + score[i + 1]![j + 1]! : 0)
    }
  }

  const out: Aligned[] = []
  const gapA: Token[] = []
  const gapB: Token[] = []
  const flush = () => {
    if (gapA.length && gapB.length) {
      const joined = (g: Token[]): Token => ({
        text: g.map((t) => t.text).join(' '),
        form: g.map((t) => t.form).join(''),
        script: g[0]!.script,
      })
      const ja = joined(gapA)
      const jb = joined(gapB)
      const whole = compareTokens(ja, jb, index).level
      if ((gapA.length > 1 || gapB.length > 1) && whole !== 'different') {
        out.push({ a: ja.text, b: jb.text, level: 'spacing', severity: 'low', aCount: gapA.length, bCount: gapB.length })
        gapA.length = 0
        gapB.length = 0
        return
      }
    }
    const k = Math.max(gapA.length, gapB.length)
    for (let i = 0; i < k; i++) {
      const ta = gapA[i]
      const tb = gapB[i]
      const level: NameMatchLevel = ta && tb ? 'different' : ta ? 'missing' : 'extra'
      out.push({ a: ta?.text ?? null, b: tb?.text ?? null, level, severity: 'high', aCount: ta ? 1 : 0, bCount: tb ? 1 : 0 })
    }
    gapA.length = 0
    gapB.length = 0
  }

  let i = 0
  let j = 0
  while (i < n || j < m) {
    const c = i < n && j < m ? cmp[i]![j]! : null
    const s = c ? LEVEL_SCORE[c.level] : undefined
    if (c && s && score[i]![j] === s + score[i + 1]![j + 1]!) {
      flush()
      const match: Aligned = { a: a[i]!.text, b: b[j]!.text, level: c.level, severity: nameSeverity(c.level), aCount: 1, bCount: 1 }
      if (c.groupId !== undefined) match.groupId = c.groupId
      out.push(match)
      i++
      j++
    } else if (j >= m || (i < n && score[i + 1]![j] === score[i]![j])) gapA.push(a[i++]!)
    else gapB.push(b[j++]!)
  }
  flush()
  return out
}

// ---- Checking every document ----

export interface NamePairResult {
  a: string
  b: string
  /** No part differs (only "same" and "translit" parts). */
  match: boolean
  /** The worst severity among the parts, or null on a match. */
  severity: NameSeverity | null
  tokens: NameTokenMatch[]
}

export interface NameIssueForm {
  /** The part as these documents write it; null when they leave it out. */
  text: string | null
  documents: string[]
}

/** One place in the name where the documents disagree (১টা অমিল). */
export interface NameIssue {
  /** Which part of the reference name, 0-based; parts the reference lacks sit at the position they would take. */
  position: number
  /** The worst way two documents differ here. */
  level: NameMatchLevel
  severity: NameSeverity
  /** The forms used, one per group of documents that agree; the majority first. */
  forms: NameIssueForm[]
  /** Documents that agree with most others (same-script documents counted first). */
  majority: string[]
  /** Documents that differ from the majority: the ones to check or correct. */
  odd: string[]
  /** Correction guides for the odd documents, from input.guides. */
  guideIds: string[]
}

export interface NameSpellingResult {
  /** Every pair of documents, in input order (1–2, 1–3, …, 2–3, …). */
  pairs: NamePairResult[]
  issues: NameIssue[]
  /** The worst severity of any issue, or null when all documents match. */
  severity: NameSeverity | null
  allMatch: boolean
}

export type NameSpellingError = 'entries' | 'name' | 'variants'

/**
 * Most documents and most parts per name the checker takes. Lining names
 * up costs parts² per pair, so a pasted paragraph (thousands of parts)
 * would freeze the page; no real name or document set comes near these.
 */
export const MAX_NAME_ENTRIES = 10
export const MAX_NAME_PARTS = 40

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateNameSpelling(input: NameSpellingInput): NameSpellingError | null {
  const ids = input.entries.map((e) => e.id)
  if (input.entries.length < 2 || input.entries.length > MAX_NAME_ENTRIES) return 'entries'
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) return 'entries'
  const sizes = input.entries.map((e) => tokenize(e.name).length)
  if (!sizes.every((n) => n > 0 && n <= MAX_NAME_PARTS)) return 'name'
  // A spelling may sit in one group only; মোঃ and মো. reading alike within a group is fine.
  const owner = new Map<string, NameVariantGroup>()
  for (const g of input.variants ?? []) {
    if (!g.id || g.variants.length === 0) return 'variants'
    for (const v of g.variants) {
      const f = formOf(v)
      if (f === '' || (owner.has(f) && owner.get(f) !== g)) return 'variants'
      owner.set(f, g)
    }
  }
  return null
}

function pairResult(a: string, b: string, aligned: Aligned[]): NamePairResult {
  const tokens = aligned.map(({ aCount: _a, bCount: _b, ...match }): NameTokenMatch => match)
  const severity = tokens.reduce<NameSeverity | null>((s, t) => worse(s, t.severity), null)
  return { a, b, match: severity === null, severity, tokens }
}

/** Compares two names directly; `a` and `b` in the result are the names. */
export function compareNames(a: string, b: string, variants?: NameVariantGroup[]): NamePairResult {
  return pairResult(a, b, alignTokens(tokenize(a), tokenize(b), indexVariants(variants)))
}

interface Slot {
  position: number
  /** Each document's part here; null when it has none. */
  tokens: (Token | null)[]
}

/**
 * Puts every document's parts into the reference's slots. Parts a document
 * has beyond the reference go in an extra slot after the part they follow,
 * shared by every document that has one there.
 */
function buildSlots(all: Token[][], index: VariantIndex): Slot[] {
  const ref = all[0]!
  const main: (Token | null)[][] = ref.map((t) => [t])
  const extras = new Map<number, (Token[] | null)[]>()
  all.slice(1).forEach((doc, d) => {
    let ri = 0
    let di = 0
    const placed: (Token | null)[] = ref.map(() => null)
    const extra = new Map<number, Token[]>()
    for (const m of alignTokens(ref, doc, index)) {
      if (m.level === 'spacing') {
        // One joined part stands for all the reference parts it covers; the later ones only continue it.
        const parts = doc.slice(di, di + m.bCount)
        const joined: Token = {
          text: parts.map((t) => t.text).join(' '),
          form: parts.map((t) => t.form).join(''),
          script: parts[0]!.script,
          spacing: 'start',
        }
        placed[ri] = joined
        for (let k = 1; k < m.aCount; k++) placed[ri + k] = { ...joined, spacing: 'continued' }
      } else if (m.aCount && m.bCount) placed[ri] = doc[di]!
      else if (m.bCount) {
        const list = extra.get(ri) ?? []
        list.push(doc[di]!)
        extra.set(ri, list)
      }
      ri += m.aCount
      di += m.bCount
    }
    placed.forEach((t, k) => main[k]!.push(t))
    for (const [pos, list] of extra) {
      const row = extras.get(pos) ?? all.map(() => null)
      row[d + 1] = list
      extras.set(pos, row)
    }
  })

  const slots: Slot[] = []
  for (let k = 0; k <= ref.length; k++) {
    const row = extras.get(k)
    if (row) {
      slots.push({
        position: k,
        tokens: row.map((list) =>
          list ? { text: list.map((t) => t.text).join(' '), form: list.map((t) => t.form).join(''), script: list[0]!.script } : null,
        ),
      })
    }
    if (k < ref.length) slots.push({ position: k, tokens: main[k]! })
  }
  return slots
}

/** How two documents' parts in one slot compare; spacing parts only differ in how they are split. */
function slotLevel(ta: Token | null | undefined, tb: Token | null | undefined, index: VariantIndex): NameMatchLevel {
  if (!ta || !tb) return ta ? 'missing' : tb ? 'extra' : 'same'
  if (ta.spacing === 'continued' || tb.spacing === 'continued') return 'same'
  if (ta.spacing !== tb.spacing) return 'spacing'
  return compareTokens(ta, tb, index).level
}

/** Checks one name across every document. */
export function checkNameSpelling(input: NameSpellingInput): NameSpellingResult {
  const index = indexVariants(input.variants)
  const entries = input.entries
  const all = entries.map((e) => tokenize(e.name))
  const scripts = entries.map((e) => scriptOf(e.name))

  const pairs: NamePairResult[] = []
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      pairs.push(pairResult(entries[i]!.id, entries[j]!.id, alignTokens(all[i]!, all[j]!, index)))
    }
  }

  const issues: NameIssue[] = []
  for (const slot of buildSlots(all, index)) {
    // Group documents that agree on this part. A document joins the first
    // group whose every member it matches, never a chain: রফিকুল and রফীকুল
    // both match RAFIQUL but not each other, so they stay apart.
    let level: NameMatchLevel = 'same'
    let severity: NameSeverity | null = null
    const n = entries.length
    const levels = entries.map((_, i) => entries.map((_, j) => (i < j ? slotLevel(slot.tokens[i], slot.tokens[j], index) : 'same')))
    const levelOf = (i: number, j: number) => (i < j ? levels[i]![j]! : levels[j]![i]!)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const s = nameSeverity(levelOf(i, j))
        if (s !== null && worse(severity, s) !== severity) {
          severity = s
          level = levelOf(i, j)
        }
      }
    }
    const groupList: number[][] = []
    for (let k = 0; k < n; k++) {
      const home = groupList.find((g) => g.every((m) => nameSeverity(levelOf(m, k)) === null))
      if (home) home.push(k)
      else groupList.push([k])
    }
    if (groupList.length < 2 || severity === null) continue

    const sameScript = (g: number[]) => g.filter((k) => scripts[k] === scripts[0]).length
    const ordered = groupList.sort(
      (x, y) => sameScript(y) - sameScript(x) || y.length - x.length || Number(y.includes(0)) - Number(x.includes(0)),
    )
    const forms = ordered.map(
      (g): NameIssueForm => ({
        // Prefer a same-script document's spelling to name the group.
        text: (slot.tokens[g.find((k) => scripts[k] === scripts[0]) ?? g[0]!] ?? null)?.text ?? null,
        documents: g.map((k) => entries[k]!.id),
      }),
    )
    const odd = ordered.slice(1).flat().sort((x, y) => x - y)
    const guideIds = [...new Set(odd.flatMap((k) => (input.guides?.[entries[k]!.id] ? [input.guides[entries[k]!.id]!] : [])))]
    issues.push({
      position: slot.position,
      level,
      severity,
      forms,
      majority: forms[0]!.documents,
      odd: odd.map((k) => entries[k]!.id),
      guideIds,
    })
  }

  const severity = issues.reduce<NameSeverity | null>((s, i) => worse(s, i.severity), null)
  return { pairs, issues, severity, allMatch: issues.length === 0 }
}
