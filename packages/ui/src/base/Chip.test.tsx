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

  it('href renders a link chip with the same 44px hit area and no pressed state', () => {
    render(
      <Chip href="/search?q=EMI" numeric={false} selected>
        লোন EMI
      </Chip>,
    )
    const link = screen.getByRole('link', { name: 'লোন EMI' })
    expect(link.getAttribute('href')).toBe('/search?q=EMI')
    expect(link.className).toContain('min-h-touch')
    expect(link.className).toContain('type-label')
    expect(link.className).toContain('before:bg-sheet')
    expect(link.hasAttribute('aria-pressed')).toBe(false)
    expect(screen.queryByRole('button')).toBeNull()
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

  it('draws the keyboard focus ring around the 36px pill, not the 44px hit area', () => {
    render(<Chip>৫,০০০</Chip>)
    const cls = screen.getByRole('button', { name: '৫,০০০' }).className
    expect(cls).toContain('focus-visible:outline-hidden')
    expect(cls).toContain('focus-visible:before:outline-2')
    expect(cls).toContain('focus-visible:before:outline-offset-2')
    expect(cls).toContain('focus-visible:before:outline-accent')
    // Press tint follows the pill too.
    expect(cls).toContain('after:inset-y-1')
  })

  it('disabled chips are dimmed and do not fire', () => {
    const onClick = vi.fn()
    render(<Chip disabled onClick={onClick}>১০,০০০</Chip>)
    const chip = screen.getByRole('button', { name: '১০,০০০' }) as HTMLButtonElement
    expect(chip.disabled).toBe(true)
    expect(chip.className).toContain('opacity-50')
    fireEvent.click(chip)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('a filter chip toggles aria-pressed when its owner flips selected', () => {
    function Filter() {
      const [on, setOn] = useState(false)
      return (
        <Chip numeric={false} selected={on} onClick={() => setOn((v) => !v)}>
          সরকারি
        </Chip>
      )
    }
    render(<Filter />)
    const chip = screen.getByRole('button', { name: 'সরকারি' })
    expect(chip.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(chip)
    expect(chip.getAttribute('aria-pressed')).toBe('true')
    expect(chip.className).toContain('before:border-accent')
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
