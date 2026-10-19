import {
  gradeByName,
  gradeForMarks,
  gradeForPoint,
  isValidGradeScale,
  type GradeBand,
} from './lib/land-gold-edu-grading.ts'
import { round } from './lib/money.ts'

/**
 * The education boards' scale for SSC/দাখিল and HSC/আলিম: A+ 80–100 = 5,
 * A 70–79 = 4, A- 60–69 = 3.5, B 50–59 = 3, C 40–49 = 2, D 33–39 = 1,
 * F 0–32 = 0. Pass another scale through GpaInput.scale if the boards change it.
 */
export const BOARD_GRADE_SCALE: readonly GradeBand[] = [
  { grade: 'A+', minMarks: 80, point: 5 },
  { grade: 'A', minMarks: 70, point: 4 },
  { grade: 'A-', minMarks: 60, point: 3.5 },
  { grade: 'B', minMarks: 50, point: 3 },
  { grade: 'C', minMarks: 40, point: 2 },
  { grade: 'D', minMarks: 33, point: 1 },
  { grade: 'F', minMarks: 0, point: 0 },
]

/** Points of the 4th subject that do not count; only the part above this is added. */
export const DEFAULT_FOURTH_SUBJECT_BASE = 2

export interface GpaSubject {
  /** e.g. 'বাংলা'; echoed back in the result. */
  name?: string
  /** Letter grade from the screen's picker, e.g. 'A+'. Used when given. */
  grade?: string
  /** Marks obtained, turned into a grade when no letter is given. */
  marks?: number
  /** Full marks: 100, or 200 for a two-paper subject. Defaults to 100. */
  fullMarks?: number
  /** True for the 4th (ঐচ্ছিক) subject. At most one. */
  optional?: boolean
}

/**
 * SSC/দাখিল and HSC/আলিম are worked out the same way; only the subject list
 * differs (SSC: 9 compulsory and group subjects, HSC: 6), which the screen
 * takes from data.
 */
export interface GpaInput {
  subjects: readonly GpaSubject[]
  scale?: readonly GradeBand[]
  fourthSubjectBase?: number
}

export interface GpaSubjectResult {
  name: string
  grade: string
  point: number
  optional: boolean
}

export interface GpaResult {
  /** False when any compulsory subject is F. */
  passed: boolean
  /** Two decimals, capped at the top point (5); 0 when failed. */
  gpa: number
  /** The letter the GPA reads as: A+ for 5, A for 4.00–4.99 and so on; F when failed. */
  letter: string
  /** "৯ বিষয়ে ৪২ পয়েন্ট". */
  compulsoryPoints: number
  compulsoryCount: number
  /** The 4th subject's point, or null without one. */
  fourthPoint: number | null
  /** "৪র্থ বিষয়ের ২ বোনাস": its point above the base, never below 0. */
  fourthBonus: number
  /** compulsoryPoints + fourthBonus, the number divided by compulsoryCount. */
  totalPoints: number
  /** True when the GPA was cut down to the top point. */
  capped: boolean
  /** Indexes of compulsory subjects that are F. */
  failed: number[]
  subjects: GpaSubjectResult[]
}

export type GpaError = 'subjects' | 'fourth' | 'scale' | 'fourthBase'

function subjectBand(s: GpaSubject, scale: readonly GradeBand[]): GradeBand | undefined {
  if (s.grade !== undefined) return gradeByName(s.grade, scale)
  const full = s.fullMarks ?? 100
  if (s.marks === undefined || !(full > 0) || !(s.marks >= 0 && s.marks <= full)) return undefined
  return gradeForMarks((s.marks / full) * 100, scale)
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateGpa(input: GpaInput): GpaError | null {
  const scale = input.scale ?? BOARD_GRADE_SCALE
  if (!isValidGradeScale(scale)) return 'scale'
  const optional = input.subjects.filter((s) => s.optional).length
  if (input.subjects.length === optional) return 'subjects'
  if (!input.subjects.every((s) => subjectBand(s, scale) !== undefined)) return 'subjects'
  if (optional > 1) return 'fourth'
  const base = input.fourthSubjectBase ?? DEFAULT_FOURTH_SUBJECT_BASE
  if (!(base >= 0 && base <= scale[0]!.point)) return 'fourthBase'
  return null
}

/**
 * Board GPA: the compulsory and group subjects' points, plus the 4th
 * subject's points above 2, divided by the number of compulsory subjects and
 * capped at 5. An F in any compulsory subject fails the exam (GPA 0); an F in
 * the 4th subject only loses the bonus.
 */
export function calculateGpa(input: GpaInput): GpaResult {
  const scale = input.scale ?? BOARD_GRADE_SCALE
  const base = input.fourthSubjectBase ?? DEFAULT_FOURTH_SUBJECT_BASE
  const fail = scale.at(-1)!
  const top = scale[0]!.point

  const subjects = input.subjects.map((s, i) => {
    const band = subjectBand(s, scale)!
    return { name: s.name ?? String(i + 1), grade: band.grade, point: band.point, optional: s.optional === true }
  })
  const compulsory = subjects.filter((s) => !s.optional)
  const fourth = subjects.find((s) => s.optional)
  const failed = subjects.flatMap((s, i) => (!s.optional && s.grade === fail.grade ? [i] : []))

  const compulsoryPoints = compulsory.reduce((sum, s) => sum + s.point, 0)
  const fourthBonus = fourth ? Math.max(0, fourth.point - base) : 0
  const totalPoints = compulsoryPoints + fourthBonus
  const raw = totalPoints / compulsory.length
  const passed = failed.length === 0
  const gpa = passed ? round(Math.min(raw, top), 2) : 0

  return {
    passed,
    gpa,
    letter: passed ? gradeForPoint(gpa, scale).grade : fail.grade,
    compulsoryPoints,
    compulsoryCount: compulsory.length,
    fourthPoint: fourth ? fourth.point : null,
    fourthBonus,
    totalPoints,
    capped: passed && raw > top,
    failed,
    subjects,
  }
}
