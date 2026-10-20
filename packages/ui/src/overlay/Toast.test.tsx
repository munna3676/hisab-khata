import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TOAST_DURATION, TOAST_LIMIT, Toast, ToastViewport, createToaster } from './Toast'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

describe('Toast', () => {
  it('draws the Figma toast: tick dot, text, slide-up entrance', () => {
    render(<Toast>লিংক কপি হয়েছে।</Toast>)
    const el = document.querySelector('[data-toast]')!
    expect(el.textContent).toBe('লিংক কপি হয়েছে।')
    expect(el.className).toContain('bg-ink')
    expect(el.className).toContain('animate-toast-in')
  })
})

describe('ToastViewport + toaster', () => {
  it('announces toasts in a polite live region that is always present', () => {
    const t = createToaster()
    render(<ToastViewport toaster={t} position="inline" />)
    const region = screen.getByRole('status')
    expect(region.getAttribute('aria-live')).toBe('polite')
    expect(region.textContent).toBe('')
    act(() => {
      t.show('ধন্যবাদ! রিপোর্ট পেয়েছি, ২৪ ঘণ্টার মধ্যে যাচাই করব।')
    })
    expect(region.textContent).toContain('রিপোর্ট পেয়েছি')
  })

  it('auto-dismisses after the duration, then leaves after the exit animation', () => {
    const t = createToaster()
    render(<ToastViewport toaster={t} position="inline" />)
    act(() => {
      t.show({ message: 'সেভ হয়েছে' })
    })
    advance(TOAST_DURATION - 1)
    expect(document.querySelector('[data-toast]')!.className).toContain('animate-toast-in')
    advance(1)
    expect(document.querySelector('[data-toast]')!.className).toContain('animate-toast-out')
    advance(200)
    expect(document.querySelector('[data-toast]')).toBeNull()
  })

  it('pauses while hovered and restarts on leave', () => {
    const t = createToaster()
    render(<ToastViewport toaster={t} position="inline" />)
    act(() => {
      t.show({ message: 'PDF সেভ হয়েছে', duration: 1000 })
    })
    const el = document.querySelector('[data-toast]')!
    advance(800)
    fireEvent.mouseEnter(el)
    advance(5000)
    expect(t.getAll()[0]!.leaving).toBe(false)
    fireEvent.mouseLeave(el)
    advance(999)
    expect(t.getAll()[0]!.leaving).toBe(false)
    advance(1)
    expect(t.getAll()[0]!.leaving).toBe(true)
  })

  it('stays held while focus is inside, even after the pointer leaves', () => {
    const t = createToaster()
    render(<ToastViewport toaster={t} position="inline" />)
    act(() => {
      t.show({ message: 'হিসাবটা সরানো হয়েছে', duration: 1000, action: { label: 'ফেরত আনো', onClick: () => {} } })
    })
    const el = document.querySelector('[data-toast]')!
    const action = screen.getByRole('button', { name: 'ফেরত আনো' })
    fireEvent.mouseEnter(el)
    action.focus()
    fireEvent.focusIn(action)
    fireEvent.mouseLeave(el)
    advance(5000)
    expect(t.getAll()[0]!.leaving).toBe(false)
    // Focus leaving the toast (not moving inside it) restarts the full timer.
    fireEvent.focusOut(action, { relatedTarget: document.body })
    advance(999)
    expect(t.getAll()[0]!.leaving).toBe(false)
    advance(1)
    expect(t.getAll()[0]!.leaving).toBe(true)
  })

  it('duration 0 stays until dismissed', () => {
    const t = createToaster()
    const id = t.show({ message: 'থাকবে', duration: 0 })
    vi.advanceTimersByTime(60_000)
    expect(t.getAll()).toHaveLength(1)
    t.dismiss(id)
    vi.advanceTimersByTime(200)
    expect(t.getAll()).toHaveLength(0)
  })

  it('runs the action and dismisses', () => {
    const t = createToaster()
    const undo = vi.fn()
    render(<ToastViewport toaster={t} position="inline" />)
    act(() => {
      t.show({ message: 'মুছে ফেলা হয়েছে', action: { label: 'ফেরত আনো', onClick: undo } })
    })
    fireEvent.click(screen.getByRole('button', { name: 'ফেরত আনো' }))
    expect(undo).toHaveBeenCalledOnce()
    expect(t.getAll()[0]!.leaving).toBe(true)
  })

  it(`keeps at most ${TOAST_LIMIT} on screen`, () => {
    const t = createToaster()
    for (let i = 0; i < TOAST_LIMIT + 1; i++) t.show(`বার্তা ${i}`)
    expect(t.getAll().filter((x) => !x.leaving)).toHaveLength(TOAST_LIMIT)
    expect(t.getAll()[0]!.leaving).toBe(true)
  })
})
