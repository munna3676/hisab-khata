// JS side of the motion system. CSS does press/hover/enter/exit; JS is only for count-ups
// (a requestAnimationFrame tween here, a few hundred bytes) and, later, springs and FLIP through
// motion's vanilla animate() loaded lazily. The count-up used to load motion too (about 22 KB gz
// on every calculator page); it only needs one eased number, so it no longer does.
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
  if (signal?.aborted) return
  const ease = cubicBezier(...EASE_OUT)
  await new Promise<void>((resolve) => {
    let frame = 0
    let start: number | undefined
    const stop = () => {
      cancelAnimationFrame(frame)
      resolve()
    }
    const step = (now: number) => {
      if (signal?.aborted) return stop()
      start ??= now
      const t = Math.min(1, (now - start) / ms)
      onUpdate(t >= 1 ? to : from + (to - from) * ease(t))
      if (t >= 1) resolve()
      else frame = requestAnimationFrame(step)
    }
    signal?.addEventListener('abort', stop, { once: true })
    frame = requestAnimationFrame(step)
  })
}

/** CSS cubic-bezier(x1, y1, x2, y2) as a function of progress 0…1 (Newton steps, then bisection). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const x = (s: number) => ((ax * s + bx) * s + cx) * s
  const y = (s: number) => ((ay * s + by) * s + cy) * s
  const dx = (s: number) => (3 * ax * s + 2 * bx) * s + cx
  return (t) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    let s = t
    for (let i = 0; i < 8; i++) {
      const err = x(s) - t
      if (Math.abs(err) < 1e-6) return y(s)
      const d = dx(s)
      if (Math.abs(d) < 1e-6) break
      s -= err / d
    }
    let lo = 0
    let hi = 1
    s = t
    for (let i = 0; i < 30 && hi - lo > 1e-6; i++) {
      if (x(s) < t) lo = s
      else hi = s
      s = (lo + hi) / 2
    }
    return y(s)
  }
}
