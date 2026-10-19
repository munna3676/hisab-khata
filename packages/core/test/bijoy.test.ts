import { describe, expect, it } from 'vitest'
import { bijoyToUnicode, calculateBijoy, unicodeToBijoy, validateBijoy } from '../src/bijoy.ts'

const ZWJ = String.fromCharCode(0x200d)
const ZWNJ = String.fromCharCode(0x200c)

describe('bijoy', () => {
  it('matches the Figma example (T1): হিসাব খাতায় স্বাগতম… → SutonnyMJ', () => {
    const unicode = 'হিসাব খাতায় স্বাগতম। এখানে সব হিসাব বাংলায়।'
    const bijoy = 'wnmve LvZvq ¯^vMZg| GLv‡b me wnmve evsjvq|'
    expect(unicodeToBijoy(unicode)).toBe(bijoy)
    expect(bijoyToUnicode(bijoy)).toBe(unicode)
  })
  it('matches an independent converter: the bnbijoy2unicode README sentence', () => {
    // @codesigntheory/bnbijoy2unicode README: "Avgvi †mvbvi evsjv, Avwg †Zvgvq fv‡jvevwm|"
    const bijoy = 'Avgvi †mvbvi evsjv, Avwg †Zvgvq fv‡jvevwm|'
    const unicode = 'আমার সোনার বাংলা, আমি তোমায় ভালোবাসি।'
    expect(bijoyToUnicode(bijoy)).toBe(unicode)
    expect(unicodeToBijoy(unicode)).toBe(bijoy)
  })
  it('matches an independent converter: the bijoy2unicode README sentence (reph, ya-phala, conjuncts)', () => {
    const bijoy = 'Kg©KZ©vi e¨w³MZ I PvKzix msµvšÍ Z_¨vw`'
    const unicode = 'কর্মকর্তার ব্যক্তিগত ও চাকুরী সংক্রান্ত তথ্যাদি'
    expect(bijoyToUnicode(bijoy)).toBe(unicode)
    expect(unicodeToBijoy(unicode)).toBe(bijoy)
  })
  it('moves pre-base vowel signs (ি ে ৈ) behind the whole cluster', () => {
    expect(bijoyToUnicode('wcÖq')).toBe('প্রিয়')
    expect(bijoyToUnicode('‡¯œn')).toBe('স্নেহ')
    expect(bijoyToUnicode('‰Ze')).toBe('তৈব')
    expect(unicodeToBijoy('প্রিয়')).toBe('wcÖq')
    expect(unicodeToBijoy('দৈনিক')).toBe('‰`wbK')
  })
  it('joins and splits o-kar and ou-kar', () => {
    expect(bijoyToUnicode('‡Kvb')).toBe('কোন')
    expect(bijoyToUnicode('‡KŠkj')).toBe('কৌশল')
    expect(unicodeToBijoy('কোন')).toBe('†Kvb')
    expect(unicodeToBijoy('মৌমাছি')).toBe('†gŠgvwQ')
    expect(unicodeToBijoy('ভালো')).toBe('fv‡jv')
    // Decomposed ে + া from some keyboards is the same ো.
    expect(unicodeToBijoy('কোন')).toBe('†Kvb')
  })
  it('places reph before its cluster and after a pre-kar', () => {
    expect(bijoyToUnicode('KxwZ©')).toBe('কীর্তি')
    expect(bijoyToUnicode('Kvh©')).toBe('কার্য')
    expect(bijoyToUnicode('m~h©')).toBe('সূর্য')
    expect(unicodeToBijoy('কীর্তি')).toBe('KxwZ©')
    expect(unicodeToBijoy('ধর্ম')).toBe('ag©')
  })
  it('keeps র + য-ফলা (i¨ve, written with ZWJ) apart from reph', () => {
    expect(bijoyToUnicode('i¨ve')).toBe('র' + ZWJ + '্যাব')
    expect(unicodeToBijoy('র' + ZWJ + '্যাব')).toBe('i¨ve')
    expect(unicodeToBijoy('র' + ZWNJ + '্যাব')).toBe('i¨ve')
  })
  it('handles ra-phala, conjuncts and hasanta', () => {
    expect(unicodeToBijoy('প্রধানমন্ত্রী')).toBe('cÖavbgš¿x')
    expect(bijoyToUnicode('cÖavbgš¿x')).toBe('প্রধানমন্ত্রী')
    expect(unicodeToBijoy('রাষ্ট্র')).toBe('ivóª')
    expect(unicodeToBijoy('দ্রুত')).toBe('`ª“Z')
    expect(bijoyToUnicode('`ªæZ')).toBe('দ্রুত')
    expect(unicodeToBijoy('লক্ষ্মী')).toBe('j²x')
    expect(unicodeToBijoy('আনন্দ')).toBe('Avb›`')
    expect(bijoyToUnicode('¯’vb')).toBe('স্থান')
    expect(bijoyToUnicode('jøvn')).toBe('ল্লাহ')
    expect(unicodeToBijoy('ক্' + ZWNJ)).toBe('K&')
    expect(unicodeToBijoy('বাক্')).toBe('evK&')
    expect(bijoyToUnicode('K&')).toBe('ক্' + ZWNJ)
  })
  it('handles chandrabindu, ং, ঃ, digits and the taka sign', () => {
    expect(unicodeToBijoy('চাঁদ')).toBe('Pvu`')
    expect(unicodeToBijoy('কেঁদে')).toBe('†Ku‡`')
    expect(bijoyToUnicode('†Ku‡`')).toBe('কেঁদে')
    expect(bijoyToUnicode('‡uK')).toBe('কেঁ')
    expect(unicodeToBijoy('দুঃখ ৳১২৫')).toBe('`ytL $125')
    expect(bijoyToUnicode('`ytL $125')).toBe('দুঃখ ৳১২৫')
  })
  it('repairs C1 control codes from a Latin-1 paste', () => {
    // 0x87 is ‡ in Windows-1252.
    expect(bijoyToUnicode(String.fromCharCode(0x87) + 'Kvb')).toBe('কোন')
  })
  it('hand-checked: the government letterhead line as typed in SutonnyMJ', () => {
    expect(bijoyToUnicode('MYcÖRvZš¿x evsjv‡`k miKvi')).toBe('গণপ্রজাতন্ত্রী বাংলাদেশ সরকার')
    expect(bijoyToUnicode('RvZxq ivR¯^ †evW©')).toBe('জাতীয় রাজস্ব বোর্ড')
    expect(unicodeToBijoy('জাতীয় রাজস্ব বোর্ড')).toBe('RvZxq ivR¯^ †evW©')
  })
  it('reads ø as ল-ফলা after a consonant or half form, স্ন on its own', () => {
    expect(bijoyToUnicode('¤øvb')).toBe('ম্লান')
    expect(bijoyToUnicode('Møvm')).toBe('গ্লাস')
    expect(bijoyToUnicode('ø')).toBe('স্ন')
  })
  it('round-trips conjunct-heavy words', () => {
    const words = (
      'উৎসব শ্রমিক রাষ্ট্রপতি ক্ষুদ্র বৃষ্টি পৃথিবী কৃষি হৃদয় শুভ গুণ রূপ রুটি স্তুতি সম্পর্ক কৌতূহল বিজ্ঞান ' +
      'উজ্জ্বল ব্রাহ্মণ আহ্বান চিহ্ন অপরাহ্ণ স্বাস্থ্য ঊর্ধ্ব কার্যালয় সর্বোচ্চ শৃঙ্খলা আকাঙ্ক্ষা লক্ষ্য আষাঢ় ' +
      'বৈদ্যুতিক উদ্ভিদ উচ্ছ্বাস জ্যোতি স্মরণ ম্লান তত্ত্ব সন্ধ্যা ঘণ্টা ঠাণ্ডা বিষ্ণু স্খলন বাক্স পক্ব দুগ্ধ ' +
      'সঙ্ঘ বাঞ্ছা ঝঞ্ঝা অট্টালিকা উত্থান আত্মা অন্বেষণ অপ্সরা কুব্জ সম্প্রতি ফাল্গুন শ্মশান নিষ্ক্রিয় স্তূপ ' +
      'কেন্দ্র বিদ্যুৎ বাঁশ দুঃখ চৌদ্দ কর্তৃপক্ষ মাতৃভাষা সূর্যোদয় ক্রুদ্ধ শ্রুতি ভ্রূণ'
    ).split(' ')
    for (const w of words) expect(bijoyToUnicode(unicodeToBijoy(w))).toBe(w)
  })
  it('round-trips a paragraph Unicode → Bijoy → Unicode', () => {
    const text =
      'বাংলাদেশ ব্যাংকের নির্দেশনা অনুযায়ী, প্রতিটি ক্ষুদ্র ও মাঝারি প্রতিষ্ঠান স্বয়ংক্রিয়ভাবে কর্মকর্তাদের ' +
      'বেতন-ভাতা পরিশোধ করবে। সংশ্লিষ্ট কর্তৃপক্ষ দ্রুত ব্যবস্থা নেবে; সর্বোচ্চ ৫০,০০০ টাকা।'
    expect(bijoyToUnicode(unicodeToBijoy(text))).toBe(text)
  })
  it('handles empty text and leaves Latin punctuation alone', () => {
    expect(unicodeToBijoy('')).toBe('')
    expect(bijoyToUnicode('')).toBe('')
    expect(unicodeToBijoy('(ক), [খ]!')).toBe('(K), [L]!')
  })
  it('warns about the wrong direction and English letters', () => {
    expect(calculateBijoy({ text: 'আমার', direction: 'toUnicode' })).toEqual({ text: 'আমার', warning: 'alreadyUnicode' })
    expect(calculateBijoy({ text: 'Avgvi', direction: 'toUnicode' })).toEqual({ text: 'আমার', warning: null })
    expect(calculateBijoy({ text: 'আমার PDF', direction: 'toBijoy' }).warning).toBe('latin')
    expect(calculateBijoy({ text: 'আমার', direction: 'toBijoy' })).toEqual({ text: 'Avgvi', warning: null })
  })
  it('writes য-ফলা on a vowel letter (অ্যা, এ্যা) as A¨v, the way Bijoy types it', () => {
    expect(unicodeToBijoy('অ্যাপ')).toBe('A¨vc')
    expect(unicodeToBijoy('অ্যাকাউন্ট')).toBe('A¨vKvD›U')
    expect(unicodeToBijoy('এ্যাপল')).toBe('G¨vcj')
    expect(bijoyToUnicode('A¨vKvD›U')).toBe('অ্যাকাউন্ট')
    // অয় (vowel + য়) is not য-ফলা.
    expect(unicodeToBijoy('অয়')).toBe('Aq')
  })
  it('reads text written by independent encoders (unicode2ascii 1.1.0, @codesigntheory/bnunicode2ansi 1.6.1)', () => {
    // Their outputs use the other glyph widths: « for ্র, š— for ন্ত, … for ৃ, y for ু, ­ (soft hyphen) for ল-ফলা.
    const cases: [string, string][] = [
      ['M«v‡gi ‡c«g', 'গ্রামের প্রেম'],
      ['emš—', 'বসন্ত'],
      ['e…wó', 'বৃষ্টি'],
      ['Kyâ', 'কুব্জ'],
      ['µy×', 'ক্রুদ্ধ'],
      ['k…•Ljv', 'শৃঙ্খলা'],
      ['¯­¨ve', 'স্ল্যাব'],
      ['‡c­b', 'প্লেন'],
      ['c«¯—yZ', 'প্রস্তুত'],
      ['e«vþYevwoqv', 'ব্রাহ্মণবাড়িয়া'],
      ['mswkøó', 'সংশ্লিষ্ট'],
      ['D‡jøL', 'উল্লেখ'],
    ]
    for (const [bijoy, unicode] of cases) expect(bijoyToUnicode(bijoy)).toBe(unicode)
  })
  it('reads the alternate glyphs ÿ (ক্ষ) and ¹ (জ্ঞ) found in older files', () => {
    expect(bijoyToUnicode('wkÿv gš¿Yvjq')).toBe('শিক্ষা মন্ত্রণালয়')
    expect(bijoyToUnicode('¹vb')).toBe('জ্ঞান')
    expect(unicodeToBijoy('জ্ঞান')).toBe('Ávb')
  })
  it('keeps spaces, line breaks and unknown characters as they are', () => {
    expect(bijoyToUnicode('Avwg\n\t‡m ')).toBe('আমি\n\tসে ')
    expect(unicodeToBijoy('আমি\n\tসে ')).toBe('Avwg\n\t†m ')
    expect(bijoyToUnicode('   ')).toBe('   ')
    expect(unicodeToBijoy('🙂 ক')).toBe('🙂 K')
  })
  it('validates input', () => {
    expect(validateBijoy({ text: 'x'.repeat(100_000), direction: 'toBijoy' })).toBeNull()
    expect(validateBijoy({ text: 5 as unknown as string, direction: 'toBijoy' })).toBe('text')
    expect(validateBijoy({ text: 'x'.repeat(100_001), direction: 'toBijoy' })).toBe('text')
    expect(validateBijoy({ text: 'ক', direction: 'sideways' as 'toBijoy' })).toBe('direction')
    expect(validateBijoy({ text: '', direction: 'toUnicode' })).toBeNull()
  })
})
