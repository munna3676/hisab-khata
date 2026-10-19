import { describe, expect, it } from 'vitest'
import tokens from '@hisab/tokens/tokens.json'
import { DURATIONS, countUp } from '../src/lib/motion'

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
})
