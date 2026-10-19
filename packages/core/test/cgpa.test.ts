import { describe, expect, it } from 'vitest'
import { calculateCgpa, semesterGpa, validateCgpa } from '../src/cgpa.ts'

const figma = [
  { gpa: 3.4, credits: 15 },
  { gpa: 3.6, credits: 18 },
  { gpa: 3.25, credits: 16 },
]

describe('cgpa', () => {
  it('matches the Figma example (E2): ৪৯ ক্রেডিটে মোট ১৬৭.৮ পয়েন্ট → CGPA ৩.৪২', () => {
    const r = calculateCgpa({ semesters: figma })
    expect(r).toMatchObject({ cgpa: 3.42, totalCredits: 49, totalPoints: 167.8, letter: 'B+', target: null })
  })
  it('matches the Figma target card: ৩.৫০ চাইলে পরের ১৮ ক্রেডিটে লাগবে ৩.৭১', () => {
    const r = calculateCgpa({ semesters: figma, targetCgpa: 3.5, nextCredits: 18 })
    expect(r.target).toEqual({ target: 3.5, nextCredits: 18, requiredGpa: 3.71, reachable: true, alreadyMet: false })
  })
  it('hand-checked on the UGC scale: 3 cr A+, 3 cr B+, 1.5 cr A- = 27 ÷ 7.5 = 3.60', () => {
    const r = semesterGpa([
      { credits: 3, grade: 'A+' },
      { credits: 3, grade: 'B+' },
      { credits: 1.5, marks: 72 },
    ])
    expect(r).toEqual({ gpa: 3.6, credits: 7.5, points: 27 })
  })
  it('turns marks into UGC grades at the band edges', () => {
    const point = (marks: number) => semesterGpa([{ credits: 3, marks }]).gpa
    expect([80, 79, 75, 74, 65, 60, 55, 50, 45, 40, 39].map(point)).toEqual([
      4, 3.75, 3.75, 3.5, 3.25, 3, 2.75, 2.5, 2.25, 2, 0,
    ])
  })
  it('mixes semesters given as GPA and as courses, F counting as 0', () => {
    const r = calculateCgpa({
      semesters: [{ gpa: 3.5, credits: 12 }, { courses: [{ credits: 3, grade: 'F' }, { credits: 3, point: 4 }] }],
    })
    expect(r).toMatchObject({ totalCredits: 18, totalPoints: 54, cgpa: 3 })
  })
  it('rounds the required GPA up without a float bump (3.70 stays 3.70)', () => {
    const r = calculateCgpa({ semesters: [{ gpa: 3, credits: 10 }], targetCgpa: 3.35, nextCredits: 10 })
    expect(r.target!.requiredGpa).toBe(3.7)
  })
  it('says when the target is out of reach or already met', () => {
    const far = calculateCgpa({ semesters: [{ gpa: 2.5, credits: 100 }], targetCgpa: 3.5, nextCredits: 15 })
    expect(far.target).toMatchObject({ reachable: false })
    expect(far.target!.requiredGpa).toBeGreaterThan(4)
    const met = calculateCgpa({ semesters: [{ gpa: 3.9, credits: 100 }], targetCgpa: 3, nextCredits: 15 })
    expect(met.target).toMatchObject({ requiredGpa: 0, reachable: true, alreadyMet: true })
  })
  it('handles a perfect record, a zero GPA and very many credits', () => {
    expect(calculateCgpa({ semesters: [{ gpa: 4, credits: 160 }] })).toMatchObject({ cgpa: 4, letter: 'A+' })
    expect(calculateCgpa({ semesters: [{ gpa: 0, credits: 15 }] })).toMatchObject({ cgpa: 0, letter: 'F' })
    const many = Array.from({ length: 1000 }, () => ({ gpa: 3.33, credits: 18 }))
    expect(calculateCgpa({ semesters: many })).toMatchObject({ cgpa: 3.33, totalCredits: 18000 })
  })
  it('validates input', () => {
    expect(validateCgpa({ semesters: [] })).toBe('semesters')
    expect(validateCgpa({ semesters: [{ gpa: 4.5, credits: 15 }] })).toBe('semesters')
    expect(validateCgpa({ semesters: [{ gpa: 3, credits: 0 }] })).toBe('semesters')
    expect(validateCgpa({ semesters: [{ courses: [] }] })).toBe('semesters')
    expect(validateCgpa({ semesters: [{ courses: [{ credits: 3, grade: 'E' }] }] })).toBe('semesters')
    expect(validateCgpa({ semesters: figma, targetCgpa: 4.2, nextCredits: 18 })).toBe('target')
    expect(validateCgpa({ semesters: figma, targetCgpa: 3.5 })).toBe('nextCredits')
    expect(validateCgpa({ semesters: figma, scale: [] })).toBe('scale')
    expect(validateCgpa({ semesters: figma, targetCgpa: 3.5, nextCredits: 18 })).toBeNull()
  })
})

describe('cgpa (independent checks)', () => {
  it('hand-checked: 3.75×12 + 3.50×15 + 3.00×9 = 124.5 ÷ 36 = 3.4583 → 3.46 (B+)', () => {
    const semesters = [
      { gpa: 3.75, credits: 12 },
      { gpa: 3.5, credits: 15 },
      { gpa: 3, credits: 9 },
    ]
    expect(calculateCgpa({ semesters })).toMatchObject({ cgpa: 3.46, letter: 'B+', totalPoints: 124.5 })
    // 3.50 over 12 more: (3.5 × 48 − 124.5) ÷ 12 = 3.625 → 3.63; 3.60: 48.3 ÷ 12 = 4.025 → out of reach.
    const ok = calculateCgpa({ semesters, targetCgpa: 3.5, nextCredits: 12 }).target!
    expect(ok).toMatchObject({ requiredGpa: 3.63, reachable: true })
    const far = calculateCgpa({ semesters, targetCgpa: 3.6, nextCredits: 12 }).target!
    expect(far).toMatchObject({ requiredGpa: 4.03, reachable: false })
  })
  it('hand-checked courses on the UGC scale: 85, 77, 58 (1.5 cr) and 39 → 27.375 ÷ 10.5 = 2.61', () => {
    // 3 × 4 + 3 × 3.75 + 1.5 × 2.75 + 3 × 0 = 12 + 11.25 + 4.125 + 0.
    const r = semesterGpa([
      { credits: 3, marks: 85 },
      { credits: 3, marks: 77 },
      { credits: 1.5, marks: 58 },
      { credits: 3, marks: 39 },
    ])
    expect(r).toEqual({ gpa: 2.61, credits: 10.5, points: 27.375 })
  })
  it('needs exactly the target to hold it: a 4.00 student keeping 4.00 needs 4.00', () => {
    const r = calculateCgpa({ semesters: [{ gpa: 4, credits: 120 }], targetCgpa: 4, nextCredits: 12 })
    expect(r.target).toMatchObject({ requiredGpa: 4, reachable: true, alreadyMet: false })
  })
  it('refuses credits that would overflow', () => {
    expect(validateCgpa({ semesters: [{ gpa: 3, credits: 1e308 }, { gpa: 3, credits: 1e308 }] })).toBe('semesters')
  })
})
