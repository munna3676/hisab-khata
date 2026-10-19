import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SegmentedControl } from './SegmentedControl'

afterEach(cleanup)

const options = [
  { value: 'charge', label: 'তুললে চার্জ কত' },
  { value: 'reverse', label: 'কত তোলা যাবে' },
] as const

describe('SegmentedControl', () => {
  it('is a labelled radio group with the first option chosen by default', () => {
    render(<SegmentedControl label="হিসাবের ধরন" options={options} />)
    expect(screen.getByRole('radiogroup', { name: 'হিসাবের ধরন' })).toBeTruthy()
    const first = screen.getByRole('radio', { name: 'তুললে চার্জ কত' }) as HTMLInputElement
    const second = screen.getByRole('radio', { name: 'কত তোলা যাবে' }) as HTMLInputElement
    expect(first.checked).toBe(true)
    expect(second.checked).toBe(false)
    expect(first.name).toBe(second.name)
  })

  it('choosing an option moves the accent block and reports the value', () => {
    const onChange = vi.fn()
    const { container } = render(<SegmentedControl label="ধরন" options={options} onChange={onChange} />)
    const indicator = container.querySelector<HTMLElement>('[aria-hidden="true"].bg-accent')!
    expect(indicator.style.transform).toBe('translateX(0%)')
    fireEvent.click(screen.getByRole('radio', { name: 'কত তোলা যাবে' }))
    expect(onChange).toHaveBeenCalledWith('reverse')
    expect((screen.getByRole('radio', { name: 'কত তোলা যাবে' }) as HTMLInputElement).checked).toBe(true)
    expect(indicator.style.transform).toBe('translateX(100%)')
    expect(indicator.className).toContain('duration-tab')
  })

  it('follows a controlled value', () => {
    render(<SegmentedControl label="ধরন" options={options} value="reverse" />)
    expect((screen.getByRole('radio', { name: 'কত তোলা যাবে' }) as HTMLInputElement).checked).toBe(true)
  })

  it('gives each control its own radio name', () => {
    render(
      <>
        <SegmentedControl label="এক" options={options} />
        <SegmentedControl label="দুই" options={options} />
      </>,
    )
    const names = screen.getAllByRole('radio').map((r) => (r as HTMLInputElement).name)
    expect(new Set(names).size).toBe(2)
  })
})
