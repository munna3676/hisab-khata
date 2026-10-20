import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SearchBar } from './SearchBar'

afterEach(cleanup)

describe('SearchBar', () => {
  it('large: a search landmark with a labelled input and the খোঁজো button', () => {
    render(<SearchBar />)
    const form = screen.getByRole('search')
    expect(form.getAttribute('action')).toBe('/search')
    expect(form.className).toContain('h-14')
    const input = screen.getByRole('searchbox', { name: 'খোঁজো' }) as HTMLInputElement
    expect(input.placeholder).toBe('খোঁজো...')
    expect(input.name).toBe('q')
    expect(input.className).toContain('h-11')
    expect(screen.getByRole('button', { name: 'খোঁজো' }).getAttribute('type')).toBe('submit')
  })

  it('compact: a 40px pill without a button', () => {
    render(<SearchBar size="compact" />)
    expect(screen.getByRole('search').className).toContain('h-10')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('onSearch replaces navigation with the trimmed query', () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)
    fireEvent.input(screen.getByRole('searchbox'), { target: { value: '  বিকাশ ৫০০০ ' } })
    fireEvent.submit(screen.getByRole('search'))
    expect(onSearch).toHaveBeenCalledWith('বিকাশ ৫০০০')
  })

  it('reports typing', () => {
    const onInput = vi.fn()
    render(<SearchBar size="compact" onInput={onInput} />)
    fireEvent.input(screen.getByRole('searchbox'), { target: { value: 'emi' } })
    expect(onInput).toHaveBeenCalledWith('emi')
  })

  it('the blue ring follows focus in the input only; the button rings its own 72x40 block', () => {
    render(<SearchBar />)
    const form = screen.getByRole('search')
    expect(form.className).toContain('has-[input:focus]:after:opacity-100')
    expect(form.className).not.toContain('focus-within:')
    expect(form.className).toContain('after:transition-opacity')
    const button = screen.getByRole('button', { name: 'খোঁজো' })
    expect(button.className).toContain('focus-visible:outline-hidden')
    expect(button.className).toContain('focus-visible:before:outline-2')
    expect(button.className).toContain('before:inset-y-0.5')
    expect(button.className).toContain('h-11')
  })

  it('names the landmark only when asked, and takes custom texts', () => {
    render(<SearchBar landmarkLabel="টুল খোঁজো" label="টুলের নাম" placeholder="যেমন: EMI" buttonLabel="যাও" action="/tools" name="t" />)
    const form = screen.getByRole('search', { name: 'টুল খোঁজো' })
    expect(form.getAttribute('action')).toBe('/tools')
    const input = screen.getByRole('searchbox', { name: 'টুলের নাম' }) as HTMLInputElement
    expect(input.placeholder).toBe('যেমন: EMI')
    expect(input.name).toBe('t')
    expect(input.getAttribute('enterkeyhint')).toBe('search')
    expect(screen.getByRole('button', { name: 'যাও' })).toBeTruthy()
  })

  it('without onSearch the form submits normally (works without JS)', () => {
    render(<SearchBar />)
    const event = new Event('submit', { bubbles: true, cancelable: true })
    screen.getByRole('search').dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })
})
