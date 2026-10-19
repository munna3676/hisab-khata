import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { useState } from 'preact/hooks'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Chip } from './Chip'
import { QuickValues } from './QuickValues'

afterEach(cleanup)

describe('Chip', () => {
  it('is a 44px pressable button whose 36px pill is drawn 4px in', () => {
    render(<Chip>৫,০০০</Chip>)
    const chip = screen.getByRole('button', { name: '৫,০০০' })
    expect(chip.className).toContain('min-h-touch')
    expect(chip.className).toContain('before:inset-y-1')
    expect(chip.className).toContain('text-number-m')
    expect(chip.hasAttribute('aria-pressed')).toBe(false)
  })

  it('selected sets aria-pressed and the accent colours', () => {
    render(<Chip selected>৫,০০০</Chip>)
    const chip = screen.getByRole('button', { name: '৫,০০০' })
    expect(chip.getAttribute('aria-pressed')).toBe('true')
    expect(chip.className).toContain('before:bg-accent-tint')
    expect(chip.className).toContain('text-accent')
  })

  it('word chips use the label style', () => {
    render(<Chip numeric={false} selected={false}>সব</Chip>)
    const chip = screen.getByRole('button', { name: 'সব' })
    expect(chip.className).toContain('type-label')
    expect(chip.getAttribute('aria-pressed')).toBe('false')
  })
})

describe('QuickValues', () => {
  it('formats amounts in Bangla digits and marks the current one', () => {
    render(<QuickValues label="দ্রুত পরিমাণ" values={[1000, 5000, 25000]} value={5000} prefix="৳" />)
    expect(screen.getByRole('group', { name: 'দ্রুত পরিমাণ' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '৳৫,০০০' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: '৳২৫,০০০' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('reports the picked amount', () => {
    const onPick = vi.fn()
    function Demo() {
      const [value, setValue] = useState<number | null>(null)
      return (
        <QuickValues
          label="দ্রুত"
          values={[1000, 5000]}
          value={value}
          digits="en"
          onPick={(v) => {
            setValue(v)
            onPick(v)
          }}
        />
      )
    }
    render(<Demo />)
    fireEvent.click(screen.getByRole('button', { name: '1,000' }))
    expect(onPick).toHaveBeenCalledWith(1000)
    expect(screen.getByRole('button', { name: '1,000' }).getAttribute('aria-pressed')).toBe('true')
  })
})
