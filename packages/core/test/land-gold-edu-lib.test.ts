import { describe, expect, it } from 'vitest'
import { gradeByName, gradeForMarks, gradeForPoint, isValidGradeScale } from '../src/lib/land-gold-edu-grading.ts'
import { cleanQuantity, splitQuantity } from '../src/lib/land-gold-edu-units.ts'
import { BOARD_GRADE_SCALE } from '../src/gpa.ts'
import { UGC_GRADE_SCALE } from '../src/cgpa.ts'

describe('land-gold-edu units', () => {
  it('trims float noise but keeps small quantities', () => {
    expect(cleanQuantity(0.1 + 0.2)).toBe(0.3)
    expect(cleanQuantity(4355.999999999999)).toBe(4356)
    expect(cleanQuantity(0.0000229568)).toBe(0.0000229568)
    expect(cleanQuantity(0)).toBe(0)
  })
  it('splits into mixed units with the remainder on the last', () => {
    expect(splitQuantity(43560, [14400, 720, 45])).toEqual([3, 0, 8])
    expect(splitQuantity(26.244, [11.664, 0.729, 0.1215, 0.01215])).toEqual([2, 4, 0, 0])
    expect(splitQuantity(0, [10, 1])).toEqual([0, 0])
  })
})

describe('land-gold-edu grading', () => {
  it('accepts the board and UGC scales and rejects broken ones', () => {
    expect(isValidGradeScale(BOARD_GRADE_SCALE)).toBe(true)
    expect(isValidGradeScale(UGC_GRADE_SCALE)).toBe(true)
    expect(isValidGradeScale([])).toBe(false)
    expect(isValidGradeScale([{ grade: 'A', minMarks: 40, point: 4 }])).toBe(false)
    const band = (grade: string, minMarks: number, point: number) => ({ grade, minMarks, point })
    expect(isValidGradeScale([band('A', 50, 1), band('F', 0, 2)])).toBe(false)
    expect(isValidGradeScale([band('A', 50, 4), band('A', 0, 0)])).toBe(false)
  })
  it('finds bands by marks, name and point', () => {
    expect(gradeForMarks(79.9, BOARD_GRADE_SCALE).grade).toBe('A')
    expect(gradeByName(' a- ', BOARD_GRADE_SCALE)?.point).toBe(3.5)
    expect(gradeByName('E', BOARD_GRADE_SCALE)).toBeUndefined()
    expect(gradeForPoint(4.89, BOARD_GRADE_SCALE).grade).toBe('A')
    expect(gradeForPoint(3.42, UGC_GRADE_SCALE).grade).toBe('B+')
  })
})

describe('land-gold-edu helpers (independent checks)', () => {
  it('snaps a count within float error of a whole number', () => {
    const sizes = [11.664, 0.729, 0.1215, 0.01215]
    // 5 ভরি 8 আনা 5 রতি 1 পয়েন্ট in grams, summed the way a user's boxes are.
    const grams = 5 * 11.664 + 8 * 0.729 + 5 * 0.1215 + 1 * 0.01215
    expect(splitQuantity(grams, sizes)).toEqual([5, 8, 5, 1])
    expect(splitQuantity(4355.999999999999, [720, 45])).toEqual([6, 0.8])
    expect(splitQuantity(0, [11.664, 0.729]).every((n) => Object.is(n, 0))).toBe(true)
  })
  it('rejects a scale whose grades only differ in case, as gradeByName could not tell them apart', () => {
    const band = (grade: string, minMarks: number, point: number) => ({ grade, minMarks, point })
    expect(isValidGradeScale([band('A', 50, 4), band('a', 0, 0)])).toBe(false)
    expect(isValidGradeScale([band(' ', 50, 4), band('F', 0, 0)])).toBe(false)
  })
})
