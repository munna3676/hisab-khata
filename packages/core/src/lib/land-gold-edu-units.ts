/**
 * Helpers for the unit converters (land, gold). Quantities are not money, so
 * they are trimmed of float noise instead of rounded to paisa.
 */

/** 4355.999999999999 → 4356. Keeps 12 significant digits, enough for any area or weight. */
export function cleanQuantity(value: number): number {
  return value === 0 ? 0 : Number(value.toPrecision(12))
}

/**
 * Breaks a total into mixed units, largest first (বিঘা-কাঠা-ছটাক, ভরি-আনা-রতি-
 * পয়েন্ট). `sizes` are the units in the total's base unit. Every unit but the
 * last gets a whole number; the last takes what is left, which may be a fraction.
 */
export function splitQuantity(total: number, sizes: readonly number[]): number[] {
  // Float error grows with the total (and the total may itself be trimmed to 12
  // digits), so a count this close to a whole number is that whole number.
  const tolerance = total * 1e-11
  let rest = total
  return sizes.map((size, i) => {
    const count = rest / size
    const whole = Math.round(count) || 0 // never -0
    const isWhole = Math.abs(count - whole) * size <= tolerance
    if (i === sizes.length - 1) return isWhole ? whole : cleanQuantity(count)
    if (isWhole) {
      // Nothing real is left for the smaller units: 5-8-5-0.999999999999 is 5-8-5-1.
      rest = 0
      return whole
    }
    const floor = Math.floor(count)
    rest -= floor * size
    return floor
  })
}
