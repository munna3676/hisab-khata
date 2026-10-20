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

  it('disabled: the group says so and no option can be chosen', () => {
    const onChange = vi.fn()
    render(<SegmentedControl label="ধরন" options={options} disabled onChange={onChange} />)
    const group = screen.getByRole('radiogroup', { name: 'ধরন' })
    expect(group.getAttribute('aria-disabled')).toBe('true')
    expect(group.className).toContain('opacity-50')
    for (const radio of screen.getAllByRole('radio') as HTMLInputElement[]) expect(radio.disabled).toBe(true)
    expect(group.querySelector('label')!.className).not.toContain('pressable')
  })

  it('a single disabled option is skipped while the others work', () => {
    render(<SegmentedControl label="ধরন" options={[options[0], { ...options[1], disabled: true }]} />)
    expect((screen.getByRole('radio', { name: 'কত তোলা যাবে' }) as HTMLInputElement).disabled).toBe(true)
    expect((screen.getByRole('radio', { name: 'তুললে চার্জ কত' }) as HTMLInputElement).disabled).toBe(false)
  })

  it('draws the Figma box: 44px, paper, 1.5px inset line ring over the options, keyboard ring on the group', () => {
    render(<SegmentedControl label="ধরন" options={options} />)
    const cls = screen.getByRole('radiogroup').className
    expect(cls).toContain('h-touch')
    expect(cls).toContain('bg-paper')
    expect(cls).toContain('after:inset-ring-[1.5px]')
    expect(cls).toContain('after:z-10')
    expect(cls).toContain('has-focus-visible:outline-2')
  })

  it('cross-fades the two text colours: the chosen option shows the on-accent copy, the other the soft one', () => {
    render(<SegmentedControl label="ধরন" options={options} defaultValue="reverse" />)
    const label = screen.getByRole('radio', { name: 'কত তোলা যাবে' }).closest('label')!
    const [soft, onAccent] = [...label.querySelectorAll('span')]
    expect(soft!.className).toContain('opacity-0')
    expect(onAccent!.className).toContain('opacity-100')
    expect(onAccent!.getAttribute('aria-hidden')).toBe('true')
    expect(soft!.className).toContain('transition-opacity')
  })

  it('three options split the width in thirds', () => {
    const three = [
      { value: 'm', label: 'মাসিক' },
      { value: 'y', label: 'বার্ষিক' },
      { value: 't', label: 'মোট' },
    ]
    const { container } = render(<SegmentedControl label="সময়কাল" options={three} defaultValue="t" />)
    const indicator = container.querySelector<HTMLElement>('[aria-hidden="true"].bg-accent')!
    expect(indicator.style.width).toBe(`${100 / 3}%`)
    expect(indicator.style.transform).toBe('translateX(200%)')
  })
})
