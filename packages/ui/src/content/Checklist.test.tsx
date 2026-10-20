import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Checklist, defaultProgressLabel } from './Checklist'
import { ChecklistItem } from './ChecklistItem'

afterEach(cleanup)
beforeEach(() => window.localStorage.clear())

const ITEMS = [
  { id: 'ssc', label: 'এসএসসি সনদ' },
  { id: 'birth', label: 'জন্ম নিবন্ধন' },
  { id: 'nid', label: 'বাবা-মায়ের NID' },
]

const badge = () => screen.getByText(/রেডি$/)

describe('ChecklistItem', () => {
  it('is a native checkbox labelled by its text, with a 44px row', () => {
    const onChange = vi.fn()
    render(<ChecklistItem label="জন্ম নিবন্ধন সনদের কপি" onChange={onChange} />)
    const box = screen.getByRole('checkbox', { name: 'জন্ম নিবন্ধন সনদের কপি' }) as HTMLInputElement
    expect(box.closest('label')!.className).toContain('min-h-touch')
    fireEvent.click(box)
    expect(box.checked).toBe(true)
    expect(onChange).toHaveBeenCalledWith(true, expect.anything())
  })

  it('disabled is not pressable', () => {
    render(<ChecklistItem label="বন্ধ" disabled />)
    const box = screen.getByRole('checkbox', { name: 'বন্ধ' }) as HTMLInputElement
    expect(box.disabled).toBe(true)
    expect(box.closest('label')!.className).not.toContain('pressable')
  })
})

describe('Checklist', () => {
  it('formats progress in Bangla digits', () => {
    expect(defaultProgressLabel(2, 5)).toBe('২/৫ রেডি')
    expect(defaultProgressLabel(10, 12)).toBe('১০/১২ রেডি')
  })

  it('counts ticked items and announces the badge politely', () => {
    const onChange = vi.fn()
    render(<Checklist title="কাগজপত্র" items={ITEMS} defaultChecked={['ssc']} onChange={onChange} />)
    expect(badge().textContent).toBe('১/৩ রেডি')
    const live = badge().closest('[aria-live]')!
    expect(live.getAttribute('aria-live')).toBe('polite')
    fireEvent.click(screen.getByRole('checkbox', { name: 'বাবা-মায়ের NID' }))
    expect(badge().textContent).toBe('২/৩ রেডি')
    // Reported in list order, not tick order.
    expect(onChange).toHaveBeenLastCalledWith(['ssc', 'nid'])
    fireEvent.click(screen.getByRole('checkbox', { name: 'এসএসসি সনদ' }))
    expect(badge().textContent).toBe('১/৩ রেডি')
    expect(onChange).toHaveBeenLastCalledWith(['nid'])
  })

  it('the list is named by the heading', () => {
    render(<Checklist title="কাগজপত্র" titleAs="h3" items={ITEMS} />)
    const heading = screen.getByRole('heading', { name: 'কাগজপত্র', level: 3 })
    expect(screen.getByRole('list').getAttribute('aria-labelledby')).toBe(heading.id)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('saves progress on the device and restores it', () => {
    const { unmount } = render(<Checklist items={ITEMS} storageKey="test-list" />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'জন্ম নিবন্ধন' }))
    expect(JSON.parse(window.localStorage.getItem('test-list')!)).toEqual(['birth'])
    unmount()
    render(<Checklist items={ITEMS} storageKey="test-list" />)
    expect((screen.getByRole('checkbox', { name: 'জন্ম নিবন্ধন' }) as HTMLInputElement).checked).toBe(true)
    expect(badge().textContent).toBe('১/৩ রেডি')
  })

  it('ignores saved ids that are no longer in the list and bad JSON', () => {
    window.localStorage.setItem('k', JSON.stringify(['gone', 'nid', 3]))
    render(<Checklist items={ITEMS} storageKey="k" />)
    expect(badge().textContent).toBe('১/৩ রেডি')
    cleanup()
    window.localStorage.setItem('k2', '{oops')
    render(<Checklist items={ITEMS} storageKey="k2" />)
    expect(badge().textContent).toBe('০/৩ রেডি')
  })

  it('progressLabel null hides the badge', () => {
    render(<Checklist items={ITEMS} progressLabel={null} />)
    expect(screen.queryByText(/রেডি/)).toBeNull()
  })

  it('controlled: shows `checked` and only reports changes', () => {
    const onChange = vi.fn()
    render(<Checklist items={ITEMS} checked={['ssc', 'birth', 'nid']} onChange={onChange} />)
    expect(badge().textContent).toBe('৩/৩ রেডি')
    fireEvent.click(screen.getByRole('checkbox', { name: 'এসএসসি সনদ' }))
    expect(onChange).toHaveBeenCalledWith(['birth', 'nid'])
  })
})

describe('controlled boxes stay in step with their props', () => {
  it('a controlled ChecklistItem whose parent declines the change stays unticked', () => {
    render(<ChecklistItem label="এক" checked={false} />)
    const box = screen.getByRole('checkbox', { name: 'এক' }) as HTMLInputElement
    fireEvent.click(box)
    expect(box.checked).toBe(false)
  })

  it('a controlled Checklist keeps the DOM equal to `checked`', () => {
    render(<Checklist items={ITEMS} checked={['ssc']} />)
    const box = screen.getByRole('checkbox', { name: 'জন্ম নিবন্ধন' }) as HTMLInputElement
    fireEvent.click(box)
    expect(box.checked).toBe(false)
    expect(badge().textContent).toBe('১/৩ রেডি')
  })
})
