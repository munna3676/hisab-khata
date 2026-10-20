// Drag-to-dismiss for the bottom sheet (docs/decisions/0001-stack.md, Micro-interactions):
// pointer events on the grab area move the sheet with `translate` only. Dragging up
// rubber-bands; letting go dismisses when the sheet was flicked down fast enough or
// pulled far enough, otherwise it springs back over --duration-sheet.
import { clock } from './dom'

/** Thresholds, exported for tests and for callers that want to tune them. */
export const DRAG_DISMISS = {
  /** Release speed (px per ms, downwards) that dismisses however short the pull. */
  velocity: 0.5,
  /** A flick still has to travel this far, so a tap with jitter never closes. */
  minFlick: 12,
  /** Share of the sheet height that dismisses on a slow release. */
  distance: 0.3,
  /** Pixels that always dismiss on a slow release, whatever the height (tall sheets). */
  maxDistance: 200,
} as const

export interface DragRelease {
  /** Downward offset in px when the pointer was let go (negative = dragged up). */
  offset: number
  /** Downward speed in px/ms over the last ~100 ms. */
  velocity: number
  /** Height of the sheet in px. */
  height: number
}

/** True when a release should close the sheet. */
export function shouldDismiss({ offset, velocity, height }: DragRelease): boolean {
  if (offset <= 0) return false
  if (velocity >= DRAG_DISMISS.velocity && offset >= DRAG_DISMISS.minFlick) return true
  const limit = Math.min(Math.max(height, 1) * DRAG_DISMISS.distance, DRAG_DISMISS.maxDistance)
  return offset >= limit
}

/** Resistance when dragging up past the resting position: moves less the further you pull. */
export function rubberBand(offset: number, dimension: number): number {
  if (offset >= 0) return offset
  const d = Math.max(dimension, 1)
  const c = 0.55
  return -(1 - 1 / ((-offset * c) / d + 1)) * d * 0.25
}

interface Sample {
  t: number
  y: number
}

/** Pointer tracker: feed it moves, ask for the release velocity. */
export class DragTracker {
  private samples: Sample[] = []
  readonly startY: number

  constructor(y: number) {
    this.startY = y
    this.samples.push({ t: clock.now(), y })
  }

  move(y: number): number {
    const t = clock.now()
    this.samples.push({ t, y })
    // Keep ~100 ms of history for the velocity estimate.
    while (this.samples.length > 2 && t - this.samples[0]!.t > 100) this.samples.shift()
    return y - this.startY
  }

  velocity(): number {
    const first = this.samples[0]!
    const last = this.samples[this.samples.length - 1]!
    const dt = last.t - first.t
    return dt > 0 ? (last.y - first.y) / dt : 0
  }
}
