const BN = '০১২৩৪৫৬৭৮৯'

/** "1,234.5" → "১,২৩৪.৫". Leaves every non-digit character as it is. */
export function toBanglaDigits(text: string | number): string {
  return String(text).replace(/[0-9]/g, (d) => BN[Number(d)]!)
}

/** "১,২৩৪.৫" → "1,234.5". Leaves every non-digit character as it is. */
export function toEnglishDigits(text: string): string {
  return text.replace(/[০-৯]/g, (d) => String(BN.indexOf(d)))
}

/**
 * Reads a number the way people type it in a form: Bangla or English digits,
 * lakh-style or western commas, spaces, a leading ৳ or Tk. Returns null when
 * the text is not a number, so the UI can show its "invalid input" state.
 */
export function parseAmount(text: string): number | null {
  const cleaned = toEnglishDigits(text)
    .replace(/৳|tk\.?|taka|টাকা/gi, '')
    .replace(/[,\s_]/g, '')
  if (cleaned === '' || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}
