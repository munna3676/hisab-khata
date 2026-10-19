import {
  gradeByName,
  gradeForMarks,
  gradeForPoint,
  isValidGradeScale,
  type GradeBand,
} from './lib/land-gold-edu-grading.ts'
import { round } from './lib/money.ts'

/**
 * The UGC uniform grading system for public and private universities (from
 * the 2006–07 session): A+ 80+ = 4.00, A 75 = 3.75, A- 70 = 3.50, B+ 65 = 3.25,
 * B 60 = 3.00, B- 55 = 2.75, C+ 50 = 2.50, C 45 = 2.25, D 40 = 2.00, F = 0.
 * A university with its own scale passes it through CgpaInput.scale.
 */
export const UGC_GRADE_SCALE: readonly GradeBand[] = [
  { grade: 'A+', minMarks: 80, point: 4 },
  { grade: 'A', minMarks: 75, point: 3.75 },
  { grade: 'A-', minMarks: 70, point: 3.5 },
  { grade: 'B+', minMarks: 65, point: 3.25 },
  { grade: 'B', minMarks: 60, point: 3 },
  { grade: 'B-', minMarks: 55, point: 2.75 },
  { grade: 'C+', minMarks: 50, point: 2.5 },
  { grade: 'C', minMarks: 45, point: 2.25 },
  { grade: 'D', minMarks: 40, point: 2 },
  { grade: 'F', minMarks: 0, point: 0 },
]

/** One course: its credits and a letter grade, marks in percent, or a grade point. */
export interface CgpaCourse {
  credits: number
  grade?: string
  marks?: number
  point?: number
}

/** A semester as its GPA and credits (the screen), or as its courses. */
export interface CgpaSemester {
  gpa?: number
  credits?: number
  courses?: readonly CgpaCourse[]
}

export interface CgpaInput {
  /** Semesters so far; "আরেকটা সেমিস্টার যোগ করো" adds one. */
  semesters: readonly CgpaSemester[]
  /** চাওয়া CGPA; leave out to skip the target card. */
  targetCgpa?: number
  /** Credits still to take toward the target (পরের সেমিস্টারের ক্রেডিট). */
  nextCredits?: number
  scale?: readonly GradeBand[]
}

export interface CgpaSemesterResult {
  gpa: number
  credits: number
  /** gpa × credits. */
  points: number
}

export interface CgpaTarget {
  target: number
  nextCredits: number
  /** GPA needed over nextCredits, rounded up to two decimals so it is enough. */
  requiredGpa: number
  /** False when it would take more than the top point (4.00). */
  reachable: boolean
  /** True when the CGPA already holds the target with any GPA (requiredGpa 0). */
  alreadyMet: boolean
}

export interface CgpaResult {
  /** Two decimals. */
  cgpa: number
  letter: string
  totalCredits: number
  /** "৪৯ ক্রেডিটে মোট ১৬৭.৮ পয়েন্ট". */
  totalPoints: number
  semesters: CgpaSemesterResult[]
  target: CgpaTarget | null
}

export type CgpaError = 'semesters' | 'target' | 'nextCredits' | 'scale'

function coursePoint(c: CgpaCourse, scale: readonly GradeBand[]): number | undefined {
  if (c.point !== undefined) return c.point >= 0 && c.point <= scale[0]!.point ? c.point : undefined
  if (c.grade !== undefined) return gradeByName(c.grade, scale)?.point
  if (c.marks !== undefined && c.marks >= 0 && c.marks <= 100) return gradeForMarks(c.marks, scale).point
  return undefined
}

function isCredits(v: number | undefined): v is number {
  return v !== undefined && v > 0 && Number.isFinite(v)
}

function isValidSemester(s: CgpaSemester, scale: readonly GradeBand[]): boolean {
  if (s.courses) {
    return s.courses.length > 0 && s.courses.every((c) => isCredits(c.credits) && coursePoint(c, scale) !== undefined)
  }
  return s.gpa !== undefined && s.gpa >= 0 && s.gpa <= scale[0]!.point && isCredits(s.credits)
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateCgpa(input: CgpaInput): CgpaError | null {
  const scale = input.scale ?? UGC_GRADE_SCALE
  if (!isValidGradeScale(scale)) return 'scale'
  if (input.semesters.length === 0 || !input.semesters.every((s) => isValidSemester(s, scale))) return 'semesters'
  if (input.targetCgpa !== undefined) {
    if (!(input.targetCgpa >= 0 && input.targetCgpa <= scale[0]!.point)) return 'target'
    if (!isCredits(input.nextCredits)) return 'nextCredits'
  }
  return null
}

/** Credit-weighted GPA of one semester's courses. */
export function semesterGpa(courses: readonly CgpaCourse[], scale: readonly GradeBand[] = UGC_GRADE_SCALE): CgpaSemesterResult {
  const credits = courses.reduce((sum, c) => sum + c.credits, 0)
  const points = courses.reduce((sum, c) => sum + c.credits * coursePoint(c, scale)!, 0)
  return { gpa: round(points / credits, 2), credits, points: round(points, 4) }
}

/**
 * CGPA = Σ(GPA × credits) ÷ Σ credits, with semester GPAs taken as given. The
 * target line solves (points + x × nextCredits) ÷ (credits + nextCredits) = target.
 */
export function calculateCgpa(input: CgpaInput): CgpaResult {
  const scale = input.scale ?? UGC_GRADE_SCALE
  const semesters = input.semesters.map((s) =>
    s.courses ? semesterGpa(s.courses, scale) : { gpa: s.gpa!, credits: s.credits!, points: round(s.gpa! * s.credits!, 4) },
  )
  const totalCredits = semesters.reduce((sum, s) => sum + s.credits, 0)
  const totalPoints = round(
    semesters.reduce((sum, s) => sum + s.points, 0),
    4,
  )
  const cgpa = round(totalPoints / totalCredits, 2)

  let target: CgpaTarget | null = null
  if (input.targetCgpa !== undefined && input.nextCredits !== undefined) {
    const needed = (input.targetCgpa * (totalCredits + input.nextCredits) - totalPoints) / input.nextCredits
    // Round up so the GPA shown is enough; toPrecision drops float noise first (3.7 must not become 3.71).
    const requiredGpa = Math.max(0, Math.ceil(Number((needed * 100).toPrecision(12))) / 100)
    target = {
      target: input.targetCgpa,
      nextCredits: input.nextCredits,
      requiredGpa,
      reachable: requiredGpa <= scale[0]!.point,
      alreadyMet: needed <= 0,
    }
  }

  return { cgpa, letter: gradeForPoint(cgpa, scale).grade, totalCredits, totalPoints, semesters, target }
}
