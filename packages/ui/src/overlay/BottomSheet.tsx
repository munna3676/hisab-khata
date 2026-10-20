import type { ComponentChildren, JSX, RefObject } from 'preact'
import { createPortal } from 'preact/compat'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks'
import { IconButton } from '../base/IconButton'
import { useUid } from '../base/uid'
import { Close } from '../icons/common'
import { cx } from '../lib/cx'
import { duration } from '../lib/motion'
import { focusableIn, isTopModal, lockScroll, popModal, pushModal, unlockScroll, wrapTab } from './dom'
import { DragTracker, rubberBand, shouldDismiss } from './drag'

/**
 * responsive = bottom sheet below lg, centred dialog from lg (1024px) up (the default).
 * sheet / dialog force one look (gallery specimens, or a sheet that must stay a sheet).
 */
export type SheetVariant = 'responsive' | 'sheet' | 'dialog'
export type SheetCloseReason = 'escape' | 'scrim' | 'close-button' | 'drag'
type HeadingLevel = 2 | 3 | 4

const RADIUS: Record<SheetVariant, string> = {
  // Figma sheet: 20px top corners. Desktop modal (D · S1–S4): 16px all round.
  sheet: 'rounded-t-[20px]',
  dialog: 'rounded-[16px]',
  responsive: 'rounded-t-[20px] lg:rounded-[16px]',
}
// Figma sheet: 12px top, 24px sides, 32px bottom (+ safe area), 16px between rows.
// Desktop modal: 24px top, 28px sides and bottom.
const HEAD: Record<SheetVariant, string> = {
  sheet: 'px-6 pt-3',
  dialog: 'px-7 pt-6',
  responsive: 'px-6 pt-3 lg:px-7 lg:pt-6',
}
const BODY: Record<SheetVariant, string> = {
  sheet: 'px-6 hko-sheet-pad',
  dialog: 'px-7 pb-7',
  responsive: 'px-6 hko-sheet-pad lg:px-7 lg:pb-7',
}
const HANDLE: Record<SheetVariant, string | null> = { sheet: '', dialog: null, responsive: 'lg:hidden' }

export interface SheetSurfaceProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'title' | 'class' | 'className'> {
  variant?: SheetVariant
  /** Display/H2 title row with the close button. Leave out for a sheet that starts with its own header (Install App). */
  title?: ComponentChildren
  titleId?: string
  /** Body/Small soft line under the title; becomes the dialog's description. */
  description?: ComponentChildren
  descriptionId?: string
  /** Heading level of the title (2 on a page; lower inside the gallery). */
  headingLevel?: HeadingLevel
  /** Shows the × button. */
  onCloseClick?: () => void
  closeLabel?: string
  class?: string
  bodyClass?: string
  panelRef?: RefObject<HTMLDivElement>
  /** Pointer handlers for the grab area (handle + title row); BottomSheet wires drag-to-dismiss here. */
  grabProps?: JSX.HTMLAttributes<HTMLDivElement>
  children?: ComponentChildren
}

/**
 * The sheet panel itself (Figma sheet frames 25:4257, 25:4394, 25:4492, 25:4612; desktop
 * "modal" 70:17388): handle, Display/H2 title with ×, optional description, then the body
 * on 16px rows. BottomSheet puts it in a modal layer; on its own it is a static specimen.
 */
export function SheetSurface({
  variant = 'responsive',
  title,
  titleId,
  description,
  descriptionId,
  headingLevel = 2,
  onCloseClick,
  closeLabel = 'বন্ধ করো',
  class: className,
  bodyClass,
  panelRef,
  grabProps,
  children,
  ...rest
}: SheetSurfaceProps) {
  const Heading = `h${headingLevel}` as 'h2'
  const handle = HANDLE[variant]
  const hasTitle = title != null && title !== false
  return (
    <div
      {...rest}
      ref={panelRef}
      class={cx('relative flex w-full min-w-0 flex-col overflow-hidden bg-sheet text-ink outline-hidden', RADIUS[variant], className)}
      data-sheet={variant}
    >
      <div
        {...grabProps}
        class={cx('grid shrink-0 gap-4', HEAD[variant], grabProps?.class as string | undefined)}
        data-sheet-grab
      >
        {handle != null && (
          <div aria-hidden="true" class={cx('flex justify-center', handle)} data-sheet-handle>
            <span class="h-1 w-10 rounded-[2px] bg-line" />
          </div>
        )}
        {hasTitle && (
          <div class="flex min-w-0 items-center gap-2">
            <Heading id={titleId} class="min-w-0 flex-1 type-h2 text-ink">
              {title}
            </Heading>
            {onCloseClick && (
              <IconButton label={closeLabel} onClick={onCloseClick} class="-my-1.75 -mr-2.5" data-sheet-close>
                <Close />
              </IconButton>
            )}
          </div>
        )}
      </div>
      <div
        class={cx(
          'grid min-h-0 min-w-0 content-start gap-4 overflow-y-auto overscroll-contain',
          hasTitle || handle != null ? 'pt-4' : 'pt-0',
          // A dialog with no title row starts right at the 24px top padding.
          !hasTitle && variant === 'responsive' && 'lg:pt-0',
          BODY[variant],
          bodyClass,
        )}
        data-sheet-body
      >
        {description != null && description !== false && (
          <p id={descriptionId} class="type-body-small text-soft">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}

export interface BottomSheetProps {
  open: boolean
  /** Called when the person asks to close (Esc, scrim tap, ×, drag down). Set `open` false to close. */
  onClose: (reason: SheetCloseReason) => void
  title?: ComponentChildren
  description?: ComponentChildren
  /** Accessible name when there is no visible title. */
  ariaLabel?: string
  /** Id of an element inside the body that names the dialog (e.g. InstallAppPrompt's heading). */
  labelledBy?: string
  variant?: SheetVariant
  closeLabel?: string
  /** False hides the × (the sheet still closes with Esc, the scrim and a drag). */
  showClose?: boolean
  /** False: Esc, scrim and drag do nothing (a form mid-submit). */
  dismissible?: boolean
  /** What gets focus on open: a selector inside the sheet or a ref. Default: the panel, so the title is read first. */
  initialFocus?: string | RefObject<HTMLElement>
  /** Return focus to the element that had it before opening (default true). */
  returnFocus?: boolean
  headingLevel?: HeadingLevel
  id?: string
  class?: string
  bodyClass?: string
  children?: ComponentChildren
}

const DESKTOP = '(min-width: 1024px)'

/**
 * BottomSheet → Dialog. Below lg it slides up from the bottom (translateY 100% → 0 over
 * 280 ms) over a fading scrim and can be dragged down to dismiss; from lg it is a centred
 * dialog (max-w-dialog) that fades and scales from .96. Modal: focus moves in and is
 * trapped, Esc closes, focus returns to the opener, the page behind does not scroll.
 * Rendered into document.body through a portal while open or animating out.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  description,
  ariaLabel,
  labelledBy,
  variant = 'responsive',
  closeLabel = 'বন্ধ করো',
  showClose = true,
  dismissible = true,
  initialFocus,
  returnFocus = true,
  headingLevel = 2,
  id,
  class: className,
  bodyClass,
  children,
}: BottomSheetProps) {
  const sheetId = useUid(id, 'sheet')
  const titleId = `${sheetId}-title`
  const descId = `${sheetId}-desc`
  const token = useMemo(() => ({}), [])
  const panelRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const dragRef = useRef<{ tracker: DragTracker; offset: number; height: number } | null>(null)
  const latest = useRef({ onClose, dismissible })
  latest.current = { onClose, dismissible }

  // `shown` stays true while the exit animation runs after `open` turns false.
  const [shown, setShown] = useState(open)
  const [entered, setEntered] = useState(false)
  if (open && !shown) setShown(true)
  const visible = open || shown
  const closing = !open && shown

  useEffect(() => {
    if (!visible) setEntered(false)
  }, [visible])

  // Open: remember the opener, join the modal stack, lock scroll, move focus in.
  // Close (or unmount): leave the stack, unlock, give focus back.
  useLayoutEffect(() => {
    if (!open || typeof document === 'undefined') return
    const active = document.activeElement
    openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null
    pushModal(token)
    lockScroll()
    const panel = panelRef.current
    if (panel) {
      let target: HTMLElement | null = null
      if (typeof initialFocus === 'string') target = panel.querySelector<HTMLElement>(initialFocus)
      else if (initialFocus) target = initialFocus.current
      ;(target ?? panel).focus({ preventScroll: true })
    }

    const onKey = (event: KeyboardEvent) => {
      if (!isTopModal(token) || !panelRef.current) return
      if (event.key === 'Escape') {
        if (!latest.current.dismissible) return
        event.preventDefault()
        event.stopPropagation()
        latest.current.onClose('escape')
      } else if (event.key === 'Tab') {
        if (wrapTab(panelRef.current, event.shiftKey, document.activeElement)) event.preventDefault()
      }
    }
    // Focus that escapes (a click on the page, a script) is pulled back in.
    const onFocusIn = (event: FocusEvent) => {
      const panelEl = panelRef.current
      if (!panelEl || !isTopModal(token)) return
      if (event.target instanceof Node && !panelEl.contains(event.target)) {
        ;(focusableIn(panelEl)[0] ?? panelEl).focus({ preventScroll: true })
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('focusin', onFocusIn)
      popModal(token)
      unlockScroll()
      const opener = openerRef.current
      if (returnFocus && opener?.isConnected) {
        const now = document.activeElement
        const panelEl = panelRef.current
        if (!now || now === document.body || (panelEl && panelEl.contains(now))) opener.focus({ preventScroll: true })
      }
    }
    // initialFocus/returnFocus are read once per opening on purpose.
  }, [open, token])

  // Exit: unmount when the out-animation ends (with a timer in case animations are off).
  useEffect(() => {
    if (!closing) return
    const timer = setTimeout(() => setShown(false), duration('sheet') + 80)
    return () => clearTimeout(timer)
  }, [closing])

  if (!visible || typeof document === 'undefined') return null

  const dialogMode = () =>
    variant === 'dialog' || (variant === 'responsive' && typeof window !== 'undefined' && !!window.matchMedia?.(DESKTOP).matches)

  const endDrag = (event: JSX.TargetedPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const panel = panelRef.current
    if (!drag || !panel) return
    dragRef.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    const velocity = drag.tracker.velocity()
    if (shouldDismiss({ offset: drag.offset, velocity, height: drag.height })) {
      latest.current.onClose('drag')
      return
    }
    // Spring back: translate (and the scrim's opacity) only.
    const ease = 'var(--duration-sheet) var(--ease-out)'
    panel.style.transition = `translate ${ease}`
    panel.style.translate = ''
    if (scrimRef.current) {
      scrimRef.current.style.transition = `opacity ${ease}`
      scrimRef.current.style.opacity = ''
    }
  }

  const grabProps: JSX.HTMLAttributes<HTMLDivElement> = {
    class: 'touch-none select-none',
    onPointerDown: (event) => {
      const panel = panelRef.current
      if (!panel || !latest.current.dismissible || event.button !== 0 || closing || dialogMode()) return
      if (event.target instanceof Element && event.target.closest('button, a, input, select, textarea')) return
      setEntered(true)
      const height = panel.getBoundingClientRect().height || panel.offsetHeight || window.innerHeight
      dragRef.current = { tracker: new DragTracker(event.clientY), offset: 0, height }
      event.currentTarget.setPointerCapture?.(event.pointerId)
      panel.style.transition = 'none'
      if (scrimRef.current) scrimRef.current.style.transition = 'none'
    },
    onPointerMove: (event) => {
      const drag = dragRef.current
      const panel = panelRef.current
      if (!drag || !panel) return
      drag.offset = rubberBand(drag.tracker.move(event.clientY), drag.height)
      panel.style.translate = `0 ${drag.offset}px`
      if (scrimRef.current) scrimRef.current.style.opacity = String(Math.max(0, 1 - Math.max(0, drag.offset) / drag.height))
    },
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  }

  const inAnim = { responsive: 'animate-sheet-in lg:animate-dialog-in', sheet: 'animate-sheet-in', dialog: 'animate-dialog-in' }[variant]
  const outAnim = { responsive: 'animate-sheet-out lg:animate-dialog-out', sheet: 'animate-sheet-out', dialog: 'animate-dialog-out' }[variant]
  const centred = variant === 'dialog' ? 'items-center p-6' : variant === 'responsive' ? 'items-end lg:items-center lg:p-6' : 'items-end'
  const width =
    variant === 'dialog' ? 'max-h-[85dvh] max-w-dialog' : variant === 'sheet' ? 'max-h-[92dvh] md:max-w-form' : 'max-h-[92dvh] md:max-w-form lg:max-h-[85dvh] lg:max-w-dialog'
  const hasTitle = title != null && title !== false

  return createPortal(
    <div class={cx('fixed inset-0 z-50 flex justify-center', centred)} data-overlay-root data-state={closing ? 'closing' : 'open'}>
      <div
        ref={scrimRef}
        aria-hidden="true"
        class={cx('absolute inset-0 bg-scrim', closing ? 'animate-scrim-out' : !entered && 'animate-scrim-in')}
        onClick={() => latest.current.dismissible && !closing && latest.current.onClose('scrim')}
        data-sheet-scrim
      />
      <SheetSurface
        variant={variant}
        role="dialog"
        aria-modal="true"
        aria-labelledby={hasTitle ? titleId : labelledBy}
        aria-label={hasTitle || labelledBy ? undefined : ariaLabel}
        aria-describedby={description != null ? descId : undefined}
        tabIndex={-1}
        id={sheetId}
        panelRef={panelRef}
        title={title}
        titleId={titleId}
        description={description}
        descriptionId={descId}
        headingLevel={headingLevel}
        closeLabel={closeLabel}
        onCloseClick={showClose && hasTitle ? () => latest.current.onClose('close-button') : undefined}
        grabProps={grabProps}
        bodyClass={bodyClass}
        class={cx(width, closing ? outAnim : !entered && inAnim, className)}
        onAnimationEnd={(event: JSX.TargetedAnimationEvent<HTMLDivElement>) => {
          if (event.target !== event.currentTarget) return
          if (closing) setShown(false)
          else setEntered(true)
        }}
        onTransitionEnd={(event: JSX.TargetedTransitionEvent<HTMLDivElement>) => {
          if (event.target === event.currentTarget) event.currentTarget.style.transition = ''
        }}
      >
        {children}
      </SheetSurface>
    </div>,
    document.body,
  )
}
