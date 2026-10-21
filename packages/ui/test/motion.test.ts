import { describe, expect, it } from 'vitest'
import tokens from '@hisab/tokens/tokens.json'
import { DURATIONS, countUp, cubicBezier } from '../src/lib/motion'

describe('motion', () => {
  it('DURATIONS equals tokens.json motion.duration', () => {
    const { $note: _note, ...fromTokens } = tokens.motion.duration as Record<string, number> & { $note?: string }
    expect(DURATIONS).toEqual(fromTokens)
  })

  it('countUp jumps straight to the end with reduced motion', async () => {
    document.documentElement.dataset.motion = 'reduce'
    const seen: number[] = []
    await countUp(1234, (v) => seen.push(v))
    expect(seen).toEqual([1234])
    delete document.documentElement.dataset.motion
  })

  it('cubicBezier matches the CSS curve at its ends and is monotonic for the ease-out token', () => {
    const ease = cubicBezier(0.2, 0, 0, 1)
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
    let last = 0
    for (let i = 1; i <= 20; i++) {
      const v = ease(i / 20)
      expect(v).toBeGreaterThanOrEqual(last)
      last = v
    }
    // ease-out: well past half way at the midpoint.
    expect(ease(0.5)).toBeGreaterThan(0.75)
    expect(cubicBezier(0.25, 0.25, 0.75, 0.75)(0.3)).toBeCloseTo(0.3, 4)
  })

  it('countUp ends exactly on the target and stops when aborted', async () => {
    document.documentElement.dataset.motion = 'full'
    const seen: number[] = []
    await countUp(500, (v) => seen.push(v), { from: 100 })
    expect(seen.at(-1)).toBe(500)
    expect(seen.every((v) => v >= 100 && v <= 500)).toBe(true)
    const ctrl = new AbortController()
    const later: number[] = []
    const run = countUp(500, (v) => later.push(v), { signal: ctrl.signal })
    ctrl.abort()
    await run
    expect(later).toEqual([])
    delete document.documentElement.dataset.motion
  })
})
