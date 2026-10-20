import type { ComponentChildren, JSX } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { Alert, Check, Info } from '../icons/common'
import { cx } from '../lib/cx'
import { duration } from '../lib/motion'

export type ToastTone = 'success' | 'info' | 'warn'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastProps {
  tone?: ToastTone
  children: ComponentChildren
  /** One text button at the end ("আবার দেখাও", "Undo"). */
  action?: ToastAction
  /** Leaving: plays the slide-down exit. */
  leaving?: boolean
  class?: string
  onMouseEnter?: JSX.MouseEventHandler<HTMLDivElement>
  onMouseLeave?: JSX.MouseEventHandler<HTMLDivElement>
  onFocusIn?: JSX.FocusEventHandler<HTMLDivElement>
  onFocusOut?: JSX.FocusEventHandler<HTMLDivElement>
}

const DOT: Record<ToastTone, { box: string; Icon: typeof Check }> = {
  success: { box: 'bg-good', Icon: Check },
  info: { box: 'bg-blue', Icon: Info },
  warn: { box: 'bg-warn', Icon: Alert },
}

/**
 * Toast (Figma T1 62:19861, T2 62:19991): ink box, 12px corners, 16/14px padding, a 24px
 * green dot with a tick, Body/Small text in paper. The colours invert in dark mode with the
 * tokens (light box, dark text), so it always stands off the page. Slides up 16px and fades
 * in; leaving reverses it (opacity only under reduced motion).
 */
export function Toast({ tone = 'success', children, action, leaving = false, class: className, ...handlers }: ToastProps) {
  const dot = DOT[tone]
  return (
    <div
      {...handlers}
      class={cx(
        'pointer-events-auto flex w-full min-w-0 items-center gap-3 rounded-[12px] bg-ink px-4 py-3.5 text-paper',
        leaving ? 'animate-toast-out' : 'animate-toast-in',
        className,
      )}
      data-toast={tone}
    >
      <span aria-hidden="true" class={cx('grid size-6 shrink-0 place-items-center rounded-full text-on-accent', dot.box)}>
        <dot.Icon size={16} stroke-width={2.5} />
      </span>
      <p class="min-w-0 flex-1 type-body-small">{children}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          class="pressable -my-2.5 -mr-2 grid min-h-touch min-w-touch shrink-0 place-items-center rounded-input px-2 type-label text-accent-tint"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// ---- toaster: a tiny store any island can push to ----

export interface ToastOptions {
  message: ComponentChildren
  tone?: ToastTone
  action?: ToastAction
  /** Milliseconds before it leaves by itself (default 4000; 0 = stays until dismissed). */
  duration?: number
}

export interface ToastItem extends Required<Pick<ToastOptions, 'tone' | 'duration'>> {
  id: number
  message: ComponentChildren
  action?: ToastAction
  leaving: boolean
}

export interface Toaster {
  /** Shows a toast; returns its id. A string is a success toast with that text. */
  show: (options: ToastOptions | string) => number
  /** Starts the exit; the toast is removed when it has played. */
  dismiss: (id: number) => void
  /** Stops the auto-dismiss timer (pointer over the toast, focus inside it). */
  pause: (id: number) => void
  /** Restarts the timer with the full duration. */
  resume: (id: number) => void
  clear: () => void
  getAll: () => readonly ToastItem[]
  subscribe: (listener: (items: readonly ToastItem[]) => void) => () => void
}

export const TOAST_DURATION = 4000
/** At most this many toasts on screen; older ones leave first. */
export const TOAST_LIMIT = 3

export function createToaster(): Toaster {
  let items: ToastItem[] = []
  let nextId = 1
  const listeners = new Set<(items: readonly ToastItem[]) => void>()
  const timers = new Map<number, ReturnType<typeof setTimeout>>()

  const emit = () => {
    for (const l of listeners) l(items)
  }
  const stopTimer = (id: number) => {
    const t = timers.get(id)
    if (t) clearTimeout(t)
    timers.delete(id)
  }
  const startTimer = (item: ToastItem) => {
    stopTimer(item.id)
    if (item.duration > 0) timers.set(item.id, setTimeout(() => toaster.dismiss(item.id), item.duration))
  }

  const toaster: Toaster = {
    show(options) {
      const o = typeof options === 'string' ? { message: options } : options
      const item: ToastItem = {
        id: nextId++,
        message: o.message,
        tone: o.tone ?? 'success',
        action: o.action,
        duration: o.duration ?? TOAST_DURATION,
        leaving: false,
      }
      items = [...items, item]
      const live = items.filter((t) => !t.leaving)
      if (live.length > TOAST_LIMIT) toaster.dismiss(live[0]!.id)
      startTimer(item)
      emit()
      return item.id
    },
    dismiss(id) {
      const item = items.find((t) => t.id === id)
      if (!item || item.leaving) return
      stopTimer(id)
      items = items.map((t) => (t.id === id ? { ...t, leaving: true } : t))
      emit()
      // Removed after the exit animation (--duration-toast; 100 ms or less with reduced motion).
      setTimeout(() => {
        items = items.filter((t) => t.id !== id)
        emit()
      }, duration('toast'))
    },
    pause(id) {
      stopTimer(id)
    },
    resume(id) {
      const item = items.find((t) => t.id === id)
      if (item && !item.leaving) startTimer(item)
    },
    clear() {
      for (const id of timers.keys()) stopTimer(id)
      items = []
      emit()
    },
    getAll: () => items,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
  return toaster
}

/** The app-wide toaster: `toaster.show('লিংক কপি হয়েছে।')`. */
export const toaster = createToaster()

export interface ToastViewportProps {
  toaster?: Toaster
  /** Name of the live region. */
  label?: string
  /**
   * fixed (default): pinned above the bottom nav below lg, bottom-centre from lg.
   * inline: in the flow (gallery specimens, tests).
   */
  position?: 'fixed' | 'inline'
  class?: string
}

/**
 * Where toasts appear: a polite live region (role=status) that is always in the page, so
 * screen readers announce each toast as it is added. Below lg it sits 16px above the
 * 56px bottom nav and the safe area; from lg, 24px from the bottom. A toast's timer is held
 * while the pointer is over it OR focus is inside it, and restarts only when both have left
 * (moving the mouse away must not time out a toast whose action has keyboard focus).
 */
export function ToastViewport({ toaster: store = toaster, label = 'বার্তা', position = 'fixed', class: className }: ToastViewportProps) {
  const [items, setItems] = useState<readonly ToastItem[]>(() => store.getAll())
  useEffect(() => {
    setItems(store.getAll())
    return store.subscribe((next) => setItems([...next]))
  }, [store])

  // Why each toast is held: hover and focus are tracked apart and resume needs both gone.
  const holds = useRef(new Map<number, { hover: boolean; focus: boolean }>())
  useEffect(() => {
    for (const id of holds.current.keys()) if (!items.some((t) => t.id === id)) holds.current.delete(id)
  }, [items])
  const hold = (id: number, reason: 'hover' | 'focus', on: boolean) => {
    const h = holds.current.get(id) ?? { hover: false, focus: false }
    if (h[reason] === on) return
    h[reason] = on
    holds.current.set(id, h)
    if (h.hover || h.focus) store.pause(id)
    else store.resume(id)
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      class={cx(
        'pointer-events-none flex flex-col items-center gap-2',
        position === 'fixed' ? 'hko-toasts fixed inset-x-0 z-60 px-4' : 'relative',
        className,
      )}
      data-toast-viewport
    >
      {items.map((item) => (
        <div key={item.id} class="flex w-full max-w-dialog justify-center">
          <Toast
            tone={item.tone}
            action={
              item.action && {
                label: item.action.label,
                onClick: () => {
                  item.action!.onClick()
                  store.dismiss(item.id)
                },
              }
            }
            leaving={item.leaving}
            onMouseEnter={() => hold(item.id, 'hover', true)}
            onMouseLeave={() => hold(item.id, 'hover', false)}
            onFocusIn={() => hold(item.id, 'focus', true)}
            onFocusOut={(event) => {
              // Focus moving between elements of the same toast keeps it held.
              if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return
              hold(item.id, 'focus', false)
            }}
          >
            {item.message}
          </Toast>
        </div>
      ))}
    </div>
  )
}
