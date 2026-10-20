// DOM helpers shared by the overlay group: focusable lookup, the modal stack
// (only the top overlay handles Esc and traps focus), and a ref-counted body
// scroll lock. No framework code here, so the logic is easy to unit test.

const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'summary',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** Elements inside `root` that Tab can reach, in DOM order (hidden ones skipped). */
export function focusableIn(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => {
    if (el.closest('[inert],[hidden],[aria-hidden="true"]')) return false
    if (el.tabIndex < 0) return false
    // Radio groups: only the checked radio (or the first, when none is) takes a Tab stop.
    if (el instanceof HTMLInputElement && el.type === 'radio' && el.name) {
      const group = [...root.querySelectorAll<HTMLInputElement>('input[type="radio"]')].filter((r) => r.name === el.name)
      const checked = group.find((r) => r.checked)
      return checked ? checked === el : group[0] === el
    }
    return true
  })
}

/**
 * Keeps Tab and Shift+Tab inside `root`: from the last stop Tab wraps to the first,
 * and from the first (or from `root` itself) Shift+Tab wraps to the last.
 * Returns true when it moved focus (the caller then prevents the default).
 */
export function wrapTab(root: HTMLElement, backwards: boolean, active: Element | null): boolean {
  const stops = focusableIn(root)
  if (stops.length === 0) {
    root.focus()
    return true
  }
  const first = stops[0]!
  const last = stops[stops.length - 1]!
  const inside = active instanceof Node && root.contains(active)
  if (backwards && (!inside || active === first || active === root)) {
    last.focus()
    return true
  }
  if (!backwards && (!inside || active === last)) {
    first.focus()
    return true
  }
  return false
}

// ---- modal stack ----
const stack: object[] = []

export function pushModal(token: object) {
  stack.push(token)
}
export function popModal(token: object) {
  const i = stack.lastIndexOf(token)
  if (i >= 0) stack.splice(i, 1)
}
export function isTopModal(token: object): boolean {
  return stack[stack.length - 1] === token
}

// ---- scroll lock ----
let locks = 0
let saved: { overflow: string; paddingRight: string } | null = null

/** Stops the page behind an open overlay from scrolling. Ref-counted for stacked overlays. */
export function lockScroll() {
  if (typeof document === 'undefined') return
  locks += 1
  if (locks > 1) return
  const html = document.documentElement
  const body = document.body
  const gap = window.innerWidth - html.clientWidth
  saved = { overflow: html.style.overflow, paddingRight: body.style.paddingRight }
  html.style.overflow = 'hidden'
  // Keep the layout from jumping where the scrollbar was.
  if (gap > 0) body.style.paddingRight = `${gap}px`
  html.dataset.scrollLocked = ''
}

export function unlockScroll() {
  if (typeof document === 'undefined' || locks === 0) return
  locks -= 1
  if (locks > 0 || !saved) return
  document.documentElement.style.overflow = saved.overflow
  document.body.style.paddingRight = saved.paddingRight
  delete document.documentElement.dataset.scrollLocked
  saved = null
}

/** Number of overlays holding the scroll lock (for tests). */
export function scrollLockCount(): number {
  return locks
}

/** Clock for drag velocity; a function so tests can stub it. */
export const clock = { now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) }
