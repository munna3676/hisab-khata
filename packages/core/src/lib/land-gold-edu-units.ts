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
  let rest = total
  return sizes.map((size, i) => {
    if (i === sizes.length - 1) return cleanQuantity(rest / size)
    const count = Math.floor(cleanQuantity(rest / size))
    rest -= count * size
    // What subtraction leaves below a trillionth of the total is float error, not weight or area.
    if (rest < total * 1e-12) rest = 0
    return count
  })
}
