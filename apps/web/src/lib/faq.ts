// The FAQ Item behaviour (packages/ui FaqItem) for server-rendered FAQ lists, without hydrating
// them: the question button toggles aria-expanded and the answer's hidden="until-found", sets
// data-toggled so only answers opened by hand animate (content.css), and find-in-page opens a
// closed answer (beforematch). One delegated listener per page.

function setOpen(button: HTMLButtonElement, panel: HTMLElement, open: boolean, byHand: boolean) {
  button.setAttribute('aria-expanded', String(open))
  if (open) {
    panel.removeAttribute('hidden')
    panel.setAttribute('data-open', '')
  } else {
    panel.setAttribute('hidden', 'until-found')
    panel.removeAttribute('data-open')
  }
  if (byHand) panel.setAttribute('data-toggled', '')
}

const panelOf = (button: Element) => {
  const id = button.getAttribute('aria-controls')
  return id ? document.getElementById(id) : null
}

export function enhanceFaq(root: Document | HTMLElement) {
  root.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-faq-item] button[aria-controls]')
    const panel = button && panelOf(button)
    if (!button || !panel) return
    setOpen(button, panel, button.getAttribute('aria-expanded') !== 'true', true)
  })
  root.addEventListener(
    'beforematch',
    (event) => {
      const panel = event.target as HTMLElement
      const button = panel.id ? document.querySelector<HTMLButtonElement>(`[aria-controls="${CSS.escape(panel.id)}"]`) : null
      if (button) setOpen(button, panel, true, false)
    },
    true,
  )
}
