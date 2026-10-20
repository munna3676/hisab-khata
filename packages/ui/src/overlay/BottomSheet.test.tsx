import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { useState } from 'preact/hooks'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BottomSheet, type BottomSheetProps } from './BottomSheet'
import { clock, scrollLockCount } from './dom'
import { DRAG_DISMISS, rubberBand, shouldDismiss } from './drag'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function Harness(props: Partial<BottomSheetProps> & { onCloseSpy?: (reason: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        শেয়ার
      </button>
      <BottomSheet
        title="শেয়ার করো"
        description="ফলাফলটা ছবি বা লিংক হিসেবে পাঠাও।"
        {...props}
        open={open}
        onClose={(reason) => {
          props.onCloseSpy?.(reason)
          setOpen(false)
        }}
      >
        <button type="button">WhatsApp</button>
        <button type="button">ছবি সেভ</button>
      </BottomSheet>
    </div>
  )
}

function openSheet() {
  const opener = screen.getByRole('button', { name: 'শেয়ার' })
  opener.focus()
  fireEvent.click(opener)
  return { opener, dialog: screen.getByRole('dialog') }
}

const tab = (shift = false) => fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Tab', shiftKey: shift })

describe('BottomSheet', () => {
  it('is a labelled, described modal dialog that takes focus and locks scrolling', () => {
    render(<Harness />)
    expect(screen.queryByRole('dialog')).toBeNull()
    const { dialog } = openSheet()
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(screen.getByRole('dialog', { name: 'শেয়ার করো' })).toBe(dialog)
    expect(document.getElementById(dialog.getAttribute('aria-describedby')!)?.textContent).toBe('ফলাফলটা ছবি বা লিংক হিসেবে পাঠাও।')
    expect(document.activeElement).toBe(dialog)
    expect(scrollLockCount()).toBe(1)
    expect(document.documentElement.style.overflow).toBe('hidden')
    // Rendered in a portal on <body>, with the slide-up / dialog-scale entrance.
    expect(dialog.closest('[data-overlay-root]')?.parentElement).toBe(document.body)
    expect(dialog.className).toContain('animate-sheet-in')
    expect(dialog.className).toContain('lg:animate-dialog-in')
  })

  it('traps focus: Tab wraps from the last control to the first and Shift+Tab back', () => {
    render(<Harness />)
    openSheet()
    const close = screen.getByRole('button', { name: 'বন্ধ করো' })
    const whatsapp = screen.getByRole('button', { name: 'WhatsApp' })
    const save = screen.getByRole('button', { name: 'ছবি সেভ' })
    // From the panel itself, Shift+Tab goes to the last control.
    tab(true)
    expect(document.activeElement).toBe(save)
    tab()
    expect(document.activeElement).toBe(close)
    tab(true)
    expect(document.activeElement).toBe(save)
    // In the middle, Tab is left to the browser (not prevented).
    whatsapp.focus()
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    whatsapp.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('pulls focus back in when something outside gets it', () => {
    render(<Harness />)
    const { opener } = openSheet()
    opener.focus()
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true)
  })

  it('Esc closes and focus returns to the opener', () => {
    const spy = vi.fn()
    render(<Harness onCloseSpy={spy} />)
    const { opener } = openSheet()
    screen.getByRole('button', { name: 'WhatsApp' }).focus()
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(spy).toHaveBeenCalledWith('escape')
    expect(document.activeElement).toBe(opener)
    expect(scrollLockCount()).toBe(0)
    // Plays the exit, then leaves the DOM.
    expect(screen.getByRole('dialog').className).toContain('animate-sheet-out')
  })

  it('unmounts after the exit animation', () => {
    vi.useFakeTimers()
    try {
      render(<Harness />)
      openSheet()
      fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
      act(() => {
        vi.advanceTimersByTime(400)
      })
      expect(screen.queryByRole('dialog')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('closes from the × and the scrim, but not when not dismissible', () => {
    const spy = vi.fn()
    const { unmount } = render(<Harness onCloseSpy={spy} />)
    openSheet()
    fireEvent.click(screen.getByRole('button', { name: 'বন্ধ করো' }))
    expect(spy).toHaveBeenLastCalledWith('close-button')
    fireEvent.click(screen.getByRole('button', { name: 'শেয়ার' }))
    fireEvent.click(document.querySelector('[data-sheet-scrim]')!)
    expect(spy).toHaveBeenLastCalledWith('scrim')
    unmount()

    const locked = vi.fn()
    render(<Harness onCloseSpy={locked} dismissible={false} />)
    openSheet()
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    fireEvent.click(document.querySelector('[data-sheet-scrim]')!)
    expect(locked).not.toHaveBeenCalled()
  })

  it('only the top sheet reacts to Esc', () => {
    const outer = vi.fn()
    const inner = vi.fn()
    const view = (innerOpen: boolean) => (
      <BottomSheet open title="বাইরে" onClose={outer}>
        <BottomSheet open={innerOpen} title="ভিতরে" onClose={inner}>
          <button type="button">ঠিক আছে</button>
        </BottomSheet>
      </BottomSheet>
    )
    const { rerender } = render(view(false))
    rerender(view(true))
    expect(scrollLockCount()).toBe(2)
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(inner).toHaveBeenCalledWith('escape')
    expect(outer).not.toHaveBeenCalled()
  })

  it('without a title is named by aria-label or labelledBy', () => {
    render(
      <BottomSheet open ariaLabel="অ্যাপ ইনস্টল" onClose={() => {}}>
        <p>…</p>
      </BottomSheet>,
    )
    expect(screen.getByRole('dialog', { name: 'অ্যাপ ইনস্টল' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'বন্ধ করো' })).toBeNull()
  })
})

describe('drag to dismiss', () => {
  it('threshold: a fast flick or a long pull dismisses, a short slow pull does not', () => {
    const height = 500
    expect(shouldDismiss({ offset: 40, velocity: 1, height })).toBe(true)
    expect(shouldDismiss({ offset: 40, velocity: 0.2, height })).toBe(false)
    expect(shouldDismiss({ offset: 6, velocity: 2, height })).toBe(false) // jitter on a tap
    expect(shouldDismiss({ offset: height * DRAG_DISMISS.distance, velocity: 0, height })).toBe(true)
    expect(shouldDismiss({ offset: height * DRAG_DISMISS.distance - 1, velocity: 0, height })).toBe(false)
    // Very tall sheets dismiss after maxDistance px.
    expect(shouldDismiss({ offset: DRAG_DISMISS.maxDistance, velocity: 0, height: 2000 })).toBe(true)
    // Dragging up never dismisses.
    expect(shouldDismiss({ offset: -80, velocity: -3, height })).toBe(false)
  })

  it('rubber-bands upward drags', () => {
    expect(rubberBand(30, 500)).toBe(30)
    const up = rubberBand(-200, 500)
    expect(up).toBeLessThan(0)
    expect(up).toBeGreaterThan(-200 * 0.5)
  })

  function dragSheet(points: [y: number, t: number][]) {
    const spy = vi.fn()
    render(
      <BottomSheet open variant="sheet" title="তারিখ" onClose={spy}>
        <p>…</p>
      </BottomSheet>,
    )
    const dialog = screen.getByRole('dialog')
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({ height: 500 } as DOMRect)
    const grab = dialog.querySelector<HTMLElement>('[data-sheet-grab]')!
    let now = 0
    vi.spyOn(clock, 'now').mockImplementation(() => now)
    const [[y0, t0], ...rest] = points
    now = t0
    fireEvent.pointerDown(grab, { clientY: y0, button: 0, pointerId: 1 })
    for (const [y, t] of rest) {
      now = t
      fireEvent.pointerMove(grab, { clientY: y, pointerId: 1 })
    }
    fireEvent.pointerUp(grab, { pointerId: 1 })
    return { spy, dialog }
  }

  it('a quick flick down closes with reason "drag"', () => {
    const { spy } = dragSheet([
      [100, 0],
      [120, 20],
      [160, 50],
    ])
    expect(spy).toHaveBeenCalledWith('drag')
  })

  it('a slow short pull springs back with a translate transition', () => {
    const { spy, dialog } = dragSheet([
      [100, 0],
      [130, 300],
      [160, 600],
    ])
    expect(spy).not.toHaveBeenCalled()
    expect(dialog.style.translate).toBe('')
    expect(dialog.style.transition).toContain('translate')
  })

  it('follows the pointer with translate while dragging', () => {
    render(
      <BottomSheet open variant="sheet" title="তারিখ" onClose={() => {}}>
        <p>…</p>
      </BottomSheet>,
    )
    const dialog = screen.getByRole('dialog')
    const grab = dialog.querySelector<HTMLElement>('[data-sheet-grab]')!
    fireEvent.pointerDown(grab, { clientY: 100, button: 0, pointerId: 1 })
    fireEvent.pointerMove(grab, { clientY: 150, pointerId: 1 })
    expect(dialog.style.translate).toBe('0 50px')
  })
})
