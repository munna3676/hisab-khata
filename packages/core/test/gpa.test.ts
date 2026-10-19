import { describe, expect, it } from 'vitest'
import { BOARD_GRADE_SCALE, calculateGpa, validateGpa, type GpaSubject } from '../src/gpa.ts'

const g = (grade: string, optional = false): GpaSubject => ({ grade, optional })

describe('gpa', () => {
  it('matches the Figma example (E1, SSC বিজ্ঞান): ৯ বিষয়ে ৪২ পয়েন্ট + ৪র্থ বিষয়ের ২ বোনাস = ৪৪ ÷ ৯ = ৪.৮৯', () => {
    const subjects = [
      { name: 'বাংলা', grade: 'A+' },
      { name: 'ইংরেজি', grade: 'A' },
      { name: 'গণিত', grade: 'A+' },
      { name: 'তথ্য ও যোগাযোগ প্রযুক্তি', grade: 'A+' },
      { name: 'ধর্ম', grade: 'A+' },
      { name: 'বাংলাদেশ ও বিশ্বপরিচয়', grade: 'A+' },
      { name: 'পদার্থবিজ্ঞান', grade: 'A' },
      { name: 'রসায়ন', grade: 'A+' },
      { name: 'জীববিজ্ঞান', grade: 'A' },
      { name: 'উচ্চতর গণিত', grade: 'A', optional: true },
    ]
    const r = calculateGpa({ subjects })
    expect(r).toMatchObject({ passed: true, gpa: 4.89, letter: 'A', compulsoryPoints: 42, compulsoryCount: 9 })
    expect(r).toMatchObject({ fourthPoint: 4, fourthBonus: 2, totalPoints: 44, capped: false })
    expect(r.subjects[9]).toEqual({ name: 'উচ্চতর গণিত', grade: 'A', point: 4, optional: true })
  })
  it('hand-checked HSC/আলিম: ৫টি A+ আর ১টি A- = ২৮.৫, ৪র্থ বিষয় B থেকে ১ বোনাস → ২৯.৫ ÷ ৬ = ৪.৯২', () => {
    const r = calculateGpa({ subjects: [g('A+'), g('A+'), g('A+'), g('A+'), g('A+'), g('A-'), g('B', true)] })
    expect(r).toMatchObject({ gpa: 4.92, compulsoryCount: 6, fourthBonus: 1 })
  })
  it('caps at 5 when the bonus pushes it over', () => {
    const r = calculateGpa({ subjects: [...Array.from({ length: 9 }, () => g('A+')), g('A+', true)] })
    expect(r).toMatchObject({ gpa: 5, letter: 'A+', capped: true, totalPoints: 48 })
  })
  it('fails on an F in any compulsory subject', () => {
    const r = calculateGpa({ subjects: [g('A+'), g('F'), g('A+'), g('A+', true)] })
    expect(r).toMatchObject({ passed: false, gpa: 0, letter: 'F', failed: [1] })
  })
  it('an F or a C in the 4th subject only loses the bonus', () => {
    const failedFourth = calculateGpa({ subjects: [g('A'), g('A'), g('F', true)] })
    expect(failedFourth).toMatchObject({ passed: true, gpa: 4, fourthBonus: 0 })
    expect(calculateGpa({ subjects: [g('A'), g('A'), g('C', true)] }).fourthBonus).toBe(0)
    expect(calculateGpa({ subjects: [g('A'), g('A')] })).toMatchObject({ gpa: 4, fourthPoint: null })
  })
  it('turns marks into grades on the board scale', () => {
    const marks = (m: number, fullMarks?: number) =>
      calculateGpa({ subjects: [{ marks: m, fullMarks }] }).subjects[0]!.grade
    expect([80, 79, 60, 33, 32, 0, 100].map((m) => marks(m))).toEqual(['A+', 'A', 'A-', 'D', 'F', 'F', 'A+'])
    expect(marks(150, 200)).toBe('A')
  })
  it('takes a changed scale and base from data', () => {
    const r = calculateGpa({ subjects: [g('A'), g('A+', true)], scale: BOARD_GRADE_SCALE, fourthSubjectBase: 3 })
    expect(r.fourthBonus).toBe(2)
  })
  it('validates input', () => {
    expect(validateGpa({ subjects: [] })).toBe('subjects')
    expect(validateGpa({ subjects: [g('A', true)] })).toBe('subjects')
    expect(validateGpa({ subjects: [g('E')] })).toBe('subjects')
    expect(validateGpa({ subjects: [{ marks: 101 }] })).toBe('subjects')
    expect(validateGpa({ subjects: [{}] })).toBe('subjects')
    expect(validateGpa({ subjects: [g('A'), g('A', true), g('B', true)] })).toBe('fourth')
    expect(validateGpa({ subjects: [g('A')], scale: [{ grade: 'A', minMarks: 50, point: 5 }] })).toBe('scale')
    expect(validateGpa({ subjects: [g('A')], fourthSubjectBase: 6 })).toBe('fourthBase')
    expect(validateGpa({ subjects: [g('a+'), g('A', true)] })).toBeNull()
  })
})

describe('gpa (independent checks)', () => {
  it('hand-checked HSC: A+, A, A, A-, B, A+ = ২৪.৫ + ৪র্থ বিষয় A থেকে ২ = ২৬.৫ ÷ ৬ = ৪.৪২ (A)', () => {
    const r = calculateGpa({ subjects: [g('A+'), g('A'), g('A'), g('A-'), g('B'), g('A+'), g('A', true)] })
    expect(r).toMatchObject({ compulsoryPoints: 24.5, totalPoints: 26.5, gpa: 4.42, letter: 'A' })
  })
  it('hand-checked SSC: ৩ A+, ৩ A, ৩ B = ৩৬ ÷ ৯ = ৪.০০; a D in the 4th subject adds nothing', () => {
    const subjects = [...['A+', 'A+', 'A+', 'A', 'A', 'A', 'B', 'B', 'B'].map((x) => g(x)), g('D', true)]
    expect(calculateGpa({ subjects })).toMatchObject({ gpa: 4, letter: 'A', fourthPoint: 1, fourthBonus: 0 })
  })
  it('reads the GPA as the board letter: 3.5 → A-, 3.0 → B, 2.5 → C, 1.0 → D', () => {
    const letter = (grades: string[]) => calculateGpa({ subjects: grades.map((x) => g(x)) }).letter
    expect(letter(['A-', 'A-'])).toBe('A-')
    expect(letter(['B', 'B'])).toBe('B')
    expect(letter(['B', 'C'])).toBe('C')
    expect(letter(['D', 'D'])).toBe('D')
  })
  it('grades a two-paper subject (২০০ নম্বর) on its percentage: 159 → A, 160 → A+, 65 → F, 66 → D', () => {
    const grade = (marks: number) => calculateGpa({ subjects: [{ marks, fullMarks: 200 }] }).subjects[0]!.grade
    expect([159, 160, 65, 66].map(grade)).toEqual(['A', 'A+', 'F', 'D'])
  })
})
