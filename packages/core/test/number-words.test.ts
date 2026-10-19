import { describe, expect, it } from 'vitest'
import {
  banglaWords,
  calculateNumberWords,
  englishWords,
  NUMBER_WORDS_MAX,
  validateNumberWords,
} from '../src/number-words.ts'

describe('number-words', () => {
  it('matches the Figma example (T3): ৳১,২৫,০০০ → এক লক্ষ পঁচিশ হাজার টাকা মাত্র', () => {
    const r = calculateNumberWords({ amount: 125000, style: 'taka' })
    expect(r.bangla).toBe('এক লক্ষ পঁচিশ হাজার টাকা মাত্র')
    expect(r.english).toBe('One Lakh Twenty-Five Thousand Taka Only')
  })
  it('writes the English variant with million/billion', () => {
    const r = calculateNumberWords({ amount: 125000, style: 'taka', englishSystem: 'international' })
    expect(r.english).toBe('One Hundred Twenty-Five Thousand Taka Only')
    expect(englishWords(1_234_567_890, 'international')).toBe(
      'One Billion Two Hundred Thirty-Four Million Five Hundred Sixty-Seven Thousand Eight Hundred Ninety',
    )
  })
  it('hand-checked cheque with paisa: ১,২৩,৪৫,৬৭৮.৫০', () => {
    const r = calculateNumberWords({ amount: 12345678.5, style: 'taka' })
    expect(r.bangla).toBe('এক কোটি তেইশ লক্ষ পঁয়তাল্লিশ হাজার ছয়শত আটাত্তর টাকা পঞ্চাশ পয়সা মাত্র')
    expect(r.english).toBe(
      'One Crore Twenty-Three Lakh Forty-Five Thousand Six Hundred Seventy-Eight Taka and Fifty Paisa Only',
    )
    expect(r).toMatchObject({ whole: 12345678, paisa: 50 })
  })
  it('uses the irregular Bangla words for 1–99, not a built pattern', () => {
    const cases: [number, string][] = [
      [11, 'এগারো'], [14, 'চৌদ্দ'], [16, 'ষোলো'], [19, 'উনিশ'], [29, 'ঊনত্রিশ'],
      [37, 'সাঁইত্রিশ'], [42, 'বিয়াল্লিশ'], [46, 'ছেচল্লিশ'], [53, 'তিপ্পান্ন'], [68, 'আটষট্টি'],
      [73, 'তিয়াত্তর'], [79, 'ঊনআশি'], [88, 'অষ্টাশি'], [89, 'ঊননব্বই'], [99, 'নিরানব্বই'],
    ]
    for (const [n, word] of cases) expect(banglaWords(n)).toBe(word)
  })
  it('every number below 100 has its own single word', () => {
    const words = new Set(Array.from({ length: 100 }, (_, n) => banglaWords(n)))
    expect(words.size).toBe(100)
    for (const w of words) expect(w).not.toContain(' ')
  })
  it('reads hundreds, thousands and the hundred-word options', () => {
    expect(banglaWords(500)).toBe('পাঁচশত')
    expect(banglaWords(1505)).toBe('এক হাজার পাঁচশত পাঁচ')
    expect(banglaWords(1505, { hundred: 'শো' })).toBe('এক হাজার পাঁচশো পাঁচ')
    expect(banglaWords(250000, { lakh: 'লাখ' })).toBe('দুই লাখ পঞ্চাশ হাজার')
    expect(englishWords(101)).toBe('One Hundred One')
    expect(englishWords(1000)).toBe('One Thousand')
  })
  it('reads more than 99 crore by repeating কোটি', () => {
    expect(banglaWords(1_25_00_00_000)).toBe('একশত পঁচিশ কোটি')
    expect(englishWords(1_25_00_00_000)).toBe('One Hundred Twenty-Five Crore')
    expect(banglaWords(1e11)).toBe('দশ হাজার কোটি')
    expect(banglaWords(1e12)).toBe('এক লক্ষ কোটি')
  })
  it('handles zero, paisa only and float noise', () => {
    expect(calculateNumberWords({ amount: 0, style: 'taka' }).bangla).toBe('শূন্য টাকা মাত্র')
    expect(calculateNumberWords({ amount: 0, style: 'taka' }).english).toBe('Zero Taka Only')
    const p = calculateNumberWords({ amount: 0.75, style: 'taka' })
    expect(p.bangla).toBe('পঁচাত্তর পয়সা মাত্র')
    expect(p.english).toBe('Seventy-Five Paisa Only')
    expect(calculateNumberWords({ amount: 0.1 + 0.2, style: 'taka' }).paisa).toBe(30)
    expect(calculateNumberWords({ amount: 99.999, style: 'taka' }).bangla).toBe('একশত টাকা মাত্র')
  })
  it('plain style reads the fraction digit by digit', () => {
    const r = calculateNumberWords({ amount: 12.05, style: 'plain' })
    expect(r.bangla).toBe('বারো দশমিক শূন্য পাঁচ')
    expect(r.english).toBe('Twelve Point Zero Five')
    expect(calculateNumberWords({ amount: 7, style: 'plain' }).bangla).toBe('সাত')
  })
  it('handles the largest amount', () => {
    const r = calculateNumberWords({ amount: NUMBER_WORDS_MAX, style: 'taka' })
    expect(r.whole).toBe(9_999_999_999_999)
    expect(r.paisa).toBe(99)
    expect(r.bangla.startsWith('নয় লক্ষ নিরানব্বই হাজার নয়শত নিরানব্বই কোটি')).toBe(true)
  })
  it('matches two independent word tables (to-words 7.4.0 bn-BD and number-to-bangla 1.0.7, both MIT on npm)', () => {
    // Words both packages spell the same way. They differ from each other (and
    // from this table) only on spelling variants such as ঊন/উন, আটাশ/আঠাশ.
    const cases: [number, string][] = [
      [6, 'ছয়'], [9, 'নয়'], [12, 'বারো'], [14, 'চৌদ্দ'], [21, 'একুশ'], [24, 'চব্বিশ'], [27, 'সাতাশ'],
      [32, 'বত্রিশ'], [37, 'সাঁইত্রিশ'], [42, 'বিয়াল্লিশ'], [43, 'তেতাল্লিশ'], [56, 'ছাপ্পান্ন'], [62, 'বাষট্টি'],
      [66, 'ছেষট্টি'], [72, 'বাহাত্তর'], [76, 'ছিয়াত্তর'], [82, 'বিরাশি'], [84, 'চুরাশি'], [92, 'বিরানব্বই'], [98, 'আটানব্বই'],
    ]
    for (const [n, word] of cases) expect(banglaWords(n)).toBe(word)
  })
  it('hand-checked: ১০,০১,০০১.০১ with a zero in every group', () => {
    const r = calculateNumberWords({ amount: 1001001.01, style: 'taka' })
    expect(r.bangla).toBe('দশ লক্ষ এক হাজার এক টাকা এক পয়সা মাত্র')
    expect(r.english).toBe('Ten Lakh One Thousand One Taka and One Paisa Only')
    const intl = calculateNumberWords({ amount: 1001001.01, style: 'taka', englishSystem: 'international' })
    expect(intl.english).toBe('One Million One Thousand One Taka and One Paisa Only')
    // 1 কোটি = 10 million; 100 কোটি = 1 billion.
    expect(englishWords(1e7, 'international')).toBe('Ten Million')
    expect(englishWords(1e9)).toBe('One Hundred Crore')
  })
  it('plain style keeps the typed fraction for very large numbers (no binary noise)', () => {
    // 1234567890123.45 is stored as …123.449951171875; toFixed(6) used to read "চার চার নয় নয় পাঁচ এক".
    const r = calculateNumberWords({ amount: 1234567890123.45, style: 'plain' })
    expect(r.whole).toBe(1234567890123)
    expect(r.bangla.endsWith('একশত তেইশ দশমিক চার পাঁচ')).toBe(true)
    expect(r.english.endsWith('One Hundred Twenty-Three Point Four Five')).toBe(true)
    expect(calculateNumberWords({ amount: NUMBER_WORDS_MAX, style: 'plain' }).english.endsWith('Point Nine Nine')).toBe(true)
    // More than six decimals is rounded to six; below a millionth is nothing.
    expect(calculateNumberWords({ amount: 0.1234567, style: 'plain' }).english).toBe('Zero Point One Two Three Four Five Seven')
    expect(calculateNumberWords({ amount: 0.0000004, style: 'plain' }).bangla).toBe('শূন্য')
    expect(calculateNumberWords({ amount: 2.9999999, style: 'plain' }).bangla).toBe('তিন')
  })
  it('rounds the cheque amount to the paisa, half away from zero, and never returns -0', () => {
    expect(calculateNumberWords({ amount: 1.005, style: 'taka' }).bangla).toBe('এক টাকা এক পয়সা মাত্র')
    expect(calculateNumberWords({ amount: 0.004, style: 'taka' }).bangla).toBe('শূন্য টাকা মাত্র')
    expect(Object.is(calculateNumberWords({ amount: -0, style: 'taka' }).whole, 0)).toBe(true)
    expect(calculateNumberWords({ amount: 100, style: 'taka', bnHundred: 'শো', bnLakh: 'লাখ' }).bangla).toBe('একশো টাকা মাত্র')
  })
  it('validates input', () => {
    expect(validateNumberWords({ amount: Number.POSITIVE_INFINITY, style: 'taka' })).toBe('amount')
    expect(validateNumberWords({ amount: NUMBER_WORDS_MAX, style: 'plain' })).toBeNull()
    expect(validateNumberWords({ amount: -1, style: 'taka' })).toBe('amount')
    expect(validateNumberWords({ amount: Number.NaN, style: 'taka' })).toBe('amount')
    expect(validateNumberWords({ amount: 1e14, style: 'taka' })).toBe('amount')
    expect(validateNumberWords({ amount: 5, style: 'words' as 'taka' })).toBe('style')
    expect(validateNumberWords({ amount: 125000, style: 'taka' })).toBeNull()
  })
})
