/**
 * Letter-grade scales for the GPA (board) and CGPA (university) engines. A
 * band covers marks from `minMarks` up to the next band's minimum; the scale
 * runs from the best grade down to F at 0. Scales come from data, so a board
 * or university that changes its scale needs no code change.
 */
export interface GradeBand {
  /** e.g. 'A+'. */
  grade: string
  /** Lowest percentage of full marks for this grade. */
  minMarks: number
  /** Grade point, e.g. 5 (board) or 4 (university) for A+. */
  point: number
}

/** True when minimums fall strictly to 0, points never rise, and grades are unique. */
export function isValidGradeScale(scale: readonly GradeBand[]): boolean {
  if (scale.length === 0 || scale.at(-1)!.minMarks !== 0) return false
  const names = new Set(scale.map((b) => b.grade))
  if (names.size !== scale.length) return false
  return scale.every((b, i) => {
    if (!(b.point >= 0 && b.minMarks >= 0 && b.minMarks <= 100)) return false
    const prev = scale[i - 1]
    return !prev || (b.minMarks < prev.minMarks && b.point <= prev.point)
  })
}

/** The band for a percentage of full marks (0–100). Assumes a valid scale. */
export function gradeForMarks(pct: number, scale: readonly GradeBand[]): GradeBand {
  return scale.find((b) => pct >= b.minMarks) ?? scale.at(-1)!
}

/** The band named `grade` ('A+', 'a+' and ' A+ ' all match), or undefined. */
export function gradeByName(grade: string, scale: readonly GradeBand[]): GradeBand | undefined {
  const name = grade.trim().toUpperCase()
  return scale.find((b) => b.grade.toUpperCase() === name)
}

/** The letter a GPA reads as: the best band whose point it reaches (4.89 on the board scale → A). */
export function gradeForPoint(gpa: number, scale: readonly GradeBand[]): GradeBand {
  return scale.find((b) => gpa >= b.point) ?? scale.at(-1)!
}
