import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { useState } from 'preact/hooks'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { digitsOf, groupTyped, NumberField } from './NumberField'
import { TextField } from './TextField'

afterEach(cleanup)

describe('TextField', () => {
  it('labels the input, describes it with the unit and helper, and draws the Figma box', () => {
    render(<TextField label="মেয়াদ" suffix="মাস" helper="১ থেকে ৬০ মাস" />)
    const input = screen.getByLabelText('মেয়াদ') as HTMLInputElement
    const describedBy = input.getAttribute('aria-describedby')!.split(' ')
    expect(describedBy.map((id) => document.getElementById(id)?.textContent)).toEqual(['মাস', '১ থেকে ৬০ মাস'])
    const box = input.parentElement!
    expect(box.className).toContain('h-13')
    expect(box.className).toContain('focus-within:after:opacity-100')
  })

  it('error replaces the helper, sets aria-invalid and the accent border', () => {
    render(<TextField label="পরিমাণ" prefix="৳" helper="সাহায্য" error="কমপক্ষে ৫০ টাকা লিখতে হবে" />)
    const input = screen.getByLabelText('পরিমাণ')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(screen.queryByText('সাহায্য')).toBeNull()
    expect(screen.getByText('কমপক্ষে ৫০ টাকা লিখতে হবে').className).toContain('text-accent')
    expect(input.parentElement!.className).toContain('after:border-accent')
  })

  it('unit boxes are hidden from the name: the label names the field, the unit only describes it', () => {
    const { container } = render(<TextField label="কত টাকা?" prefix="৳" />)
    const input = screen.getByLabelText('কত টাকা?') as HTMLInputElement
    const unit = document.getElementById(input.getAttribute('aria-describedby')!)!
    expect(unit.textContent).toBe('৳')
    expect(unit.getAttribute('aria-hidden')).toBe('true')
    // The name is the label text alone, not the unit or the typed value.
    expect(document.getElementById(input.getAttribute('aria-labelledby')!)!.textContent).toBe('কত টাকা?')
    // Exactly one <label>, which holds the unit, so a tap on the unit focuses the input without JS.
    const labels = container.querySelectorAll('label')
    expect(labels).toHaveLength(1)
    expect(labels[0]!.getAttribute('for')).toBe(input.id)
    expect(labels[0]!.contains(unit)).toBe(true)
    expect(labels[0]!.contains(input)).toBe(true)
  })

  it('keeps the units inside the 1.5px border, drawn as an inset ring (Figma inside stroke)', () => {
    render(<TextField label="হার" suffix="%" />)
    const box = screen.getByLabelText('হার').parentElement!
    expect(box.className).toContain('p-[1.5px]')
    expect(box.className).toContain('before:inset-ring-[1.5px]')
    expect(box.className).toContain('before:inset-ring-line')
    expect(box.className).not.toContain('before:border-[1.5px]')
  })

  it('the message line is a live region that is there before any message, so a new error is announced', () => {
    function Demo() {
      const [error, setError] = useState<string | undefined>(undefined)
      return (
        <>
          <TextField label="পরিমাণ" error={error} />
          <button type="button" onClick={() => setError('কমপক্ষে ৫০ টাকা লিখতে হবে')}>
            ভুল
          </button>
        </>
      )
    }
    render(<Demo />)
    const input = screen.getByLabelText('পরিমাণ')
    const region = input.closest('[data-invalid], div.grid')!.querySelector('[aria-live="polite"]')!
    expect(region.textContent).toBe('')
    expect(region.className).toContain('sr-only')
    expect(input.hasAttribute('aria-describedby')).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'ভুল' }))
    const after = input.closest('div.grid')!.querySelector('[aria-live="polite"]')!
    expect(after).toBe(region)
    expect(region.textContent).toBe('কমপক্ষে ৫০ টাকা লিখতে হবে')
    expect(region.className).not.toContain('sr-only')
    expect(input.getAttribute('aria-describedby')).toBe(region.id)
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  it('disabled dims the box and disables the input', () => {
    render(<TextField label="বন্ধ" disabled />)
    const input = screen.getByLabelText('বন্ধ') as HTMLInputElement
    expect(input.disabled).toBe(true)
    expect(input.parentElement!.className).toContain('opacity-50')
  })

  it('every field gets its own id', () => {
    render(
      <>
        <TextField label="এক" />
        <TextField label="দুই" />
      </>,
    )
    expect(screen.getByLabelText('এক').id).not.toBe(screen.getByLabelText('দুই').id)
  })
})

describe('digit helpers', () => {
  it('detects which digits are typed', () => {
    expect(digitsOf('৫০০০', 'en')).toBe('bn')
    expect(digitsOf('5000', 'bn')).toBe('en')
    expect(digitsOf('', 'bn')).toBe('bn')
  })

  it('groups the typed amount the South Asian way and keeps typed decimals', () => {
    expect(groupTyped('৫০০০০', 'bn')).toBe('৫০,০০০')
    expect(groupTyped('1234567.5', 'bn')).toBe('12,34,567.5')
    expect(groupTyped('৳ ১০০০', 'en')).toBe('১,০০০')
    expect(groupTyped('abc', 'bn')).toBe('abc')
  })
})

describe('NumberField', () => {
  it('uses the decimal keyboard and the Number/L style', () => {
    render(<NumberField label="কত টাকা?" prefix="৳" />)
    const input = screen.getByLabelText('কত টাকা?')
    expect(input.getAttribute('inputmode')).toBe('decimal')
    expect(input.className).toContain('text-number-l')
  })

  it('accepts Bangla and English digits and reports the amount on every keystroke', () => {
    const onValueChange = vi.fn()
    render(<NumberField label="পরিমাণ" onValueChange={onValueChange} min={50} />)
    const input = screen.getByLabelText('পরিমাণ') as HTMLInputElement
    fireEvent.input(input, { target: { value: '৫,০০০' } })
    expect(onValueChange).toHaveBeenLastCalledWith(5000, { text: '৫,০০০', valid: true })
    fireEvent.input(input, { target: { value: '20' } })
    expect(onValueChange).toHaveBeenLastCalledWith(20, { text: '20', valid: false })
  })

  it('shows "numbers only" at once and range errors after blur', () => {
    render(<NumberField label="পরিমাণ" min={50} unit="টাকা" />)
    const input = screen.getByLabelText('পরিমাণ') as HTMLInputElement
    fireEvent.input(input, { target: { value: '১২ক' } })
    expect(screen.getByText('শুধু সংখ্যা লেখো')).toBeTruthy()
    expect(input.getAttribute('aria-invalid')).toBe('true')

    fireEvent.input(input, { target: { value: '২০' } })
    expect(screen.queryByText(/কমপক্ষে/)).toBeNull()
    fireEvent.blur(input)
    expect(screen.getByText('কমপক্ষে ৫০ টাকা লিখতে হবে')).toBeTruthy()
  })

  it('groups the amount on blur in the digits that were typed', () => {
    render(<NumberField label="পরিমাণ" />)
    const input = screen.getByLabelText('পরিমাণ') as HTMLInputElement
    fireEvent.input(input, { target: { value: '50000' } })
    fireEvent.blur(input)
    expect(input.value).toBe('50,000')
  })

  it('an outside value (quick-value chip) rewrites the text; its own echo does not', () => {
    function Demo() {
      const [value, setValue] = useState<number | null>(5000)
      return (
        <>
          <NumberField label="পরিমাণ" value={value} onValueChange={setValue} formatOnBlur={false} />
          <button type="button" onClick={() => setValue(25000)}>
            ২৫ হাজার
          </button>
        </>
      )
    }
    render(<Demo />)
    const input = screen.getByLabelText('পরিমাণ') as HTMLInputElement
    expect(input.value).toBe('৫,০০০')
    fireEvent.input(input, { target: { value: '৫০০' } })
    expect(input.value).toBe('৫০০')
    fireEvent.click(screen.getByRole('button', { name: '২৫ হাজার' }))
    expect(input.value).toBe('২৫,০০০')
  })

  it('an outside error wins over the built-in messages', () => {
    render(<NumberField label="পরিমাণ" error="মাসিক লিমিট পার" />)
    expect(screen.getByText('মাসিক লিমিট পার')).toBeTruthy()
  })
})
