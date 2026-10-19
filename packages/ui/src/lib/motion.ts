// JS side of the motion system. CSS does press/hover/enter/exit; JS is only for
// count-ups, springs and FLIP, through motion's vanilla animate() loaded lazily.
import { currentMotion } from './settings'

export type DurationName = 'press' | 'hover' | 'release' | 'toast' | 'tab' | 'page' | 'sheet' | 'countup'

/** Full-motion durations in ms; equal to tokens.json motion.duration (checked by test/motion.test.ts). */
export const DURATIONS: Readonly<Record<DurationName, number>> = {
  press: 90,
  hover: 160,
  release: 160,
  toast: 200,
  tab: 220,
  page: 240,
  sheet: 280,
  countup: 450,
}

/** cubic-bezier(.2,0,0,1) and cubic-bezier(.3,0,1,1) as motion easing arrays. */
export const EASE_OUT: [number, number, number, number] = [0.2, 0, 0, 1]
export const EASE_IN: [number, number, number, number] = [0.3, 0, 1, 1]

/** Effective motion mode: 'full' | 'lite' | 'reduce'. */
export const motionMode = currentMotion

/** Current duration in ms for the active motion mode (reads --duration-<name> from tokens.css). */
export function duration(name: DurationName): number {
  if (typeof document === 'undefined') return DURATIONS[name]
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--duration-${name}`).trim()
  const ms = raw.endsWith('ms') ? parseFloat(raw) : raw.endsWith('s') ? parseFloat(raw) * 1000 : NaN
  return Number.isFinite(ms) ? ms : DURATIONS[name]
}

export function reducedMotion(): boolean {
  return currentMotion() === 'reduce'
}

export interface CountUpOptions {
  from?: number
  /** Stops the animation (e.g. on unmount); onUpdate is not called again. */
  signal?: AbortSignal
}

/**
 * Animates a number from `from` (default 0) to `to`, calling onUpdate with each
 * frame's value (format it yourself, e.g. with Bangla digits). Reduced motion
 * jumps straight to `to`; lite mode is capped by --duration-countup (300 ms).
 */
export async function countUp(to: number, onUpdate: (value: number) => void, { from = 0, signal }: CountUpOptions = {}) {
  const ms = duration('countup')
  if (reducedMotion() || ms <= 0 || from === to) {
    onUpdate(to)
    return
  }
  const { animate } = await import('motion')
  if (signal?.aborted) return
  const controls = animate(from, to, { duration: ms / 1000, ease: EASE_OUT, onUpdate })
  signal?.addEventListener('abort', () => controls.stop(), { once: true })
  await controls
}
