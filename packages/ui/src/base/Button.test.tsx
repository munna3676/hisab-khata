import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Share } from '../icons/base'
import { Button } from './Button'
import { IconButton } from './IconButton'
import { Spinner } from './Spinner'

afterEach(cleanup)

describe('Button', () => {
  it('is a pressable 44px button of type button with the variant colours', () => {
    render(<Button icon={<Share />}>শেয়ার করো</Button>)
    const button = screen.getByRole('button', { name: 'শেয়ার করো' })
    expect(button.getAttribute('type')).toBe('button')
    expect(button.className).toContain('pressable')
    expect(button.className).toContain('min-h-touch')
    expect(button.className).toContain('bg-accent')
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('secondary and ghost use the Figma colours, lg is 52px', () => {
    render(
      <>
        <Button variant="secondary">দ্বিতীয়</Button>
        <Button variant="ghost" size="lg">ঘোস্ট</Button>
      </>,
    )
    expect(screen.getByRole('button', { name: 'দ্বিতীয়' }).className).toMatch(/border-line.*bg-sheet.*text-ink/)
    const ghost = screen.getByRole('button', { name: 'ঘোস্ট' })
    expect(ghost.className).toContain('text-blue')
    expect(ghost.className).toContain('min-h-13')
  })

  it('renders a link when href is given', () => {
    render(<Button href="/tools">সব টুল</Button>)
    const link = screen.getByRole('link', { name: 'সব টুল' })
    expect(link.getAttribute('href')).toBe('/tools')
  })

  it('disabled buttons do not fire', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>বন্ধ</Button>)
    const button = screen.getByRole('button', { name: 'বন্ধ' }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('loading shows a spinner, sets aria-busy and swallows presses but stays focusable', () => {
    const onClick = vi.fn()
    render(<Button loading icon={<Share />} onClick={onClick}>সেভ হচ্ছে</Button>)
    const button = screen.getByRole('button', { name: 'সেভ হচ্ছে' }) as HTMLButtonElement
    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(button.disabled).toBe(false)
    expect(button.querySelector('svg')?.getAttribute('class')).toContain('hk-spin')
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('a disabled link loses its href', () => {
    render(<Button href="/x" disabled>লিংক</Button>)
    const link = screen.getByRole('link', { name: 'লিংক' })
    expect(link.hasAttribute('href')).toBe(false)
    expect(link.getAttribute('aria-disabled')).toBe('true')
  })
})

describe('IconButton', () => {
  it('has its label as the accessible name and a 44px box', () => {
    render(
      <IconButton label="শেয়ার">
        <Share />
      </IconButton>,
    )
    const button = screen.getByRole('button', { name: 'শেয়ার' })
    expect(button.className).toContain('size-touch')
    expect(button.className).toContain('pressable')
  })

  it('a toggle reports aria-pressed and uses the selected tint', () => {
    render(
      <IconButton label="সেভ" pressed>
        <Share />
      </IconButton>,
    )
    const button = screen.getByRole('button', { name: 'সেভ' })
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(button.className).toContain('bg-accent-tint')
    expect(button.className).not.toContain('text-ink')
  })
})

describe('Spinner', () => {
  it('is decorative unless labelled', () => {
    const { container } = render(<Spinner />)
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
    render(<Spinner label="লোড হচ্ছে" />)
    expect(screen.getByRole('img', { name: 'লোড হচ্ছে' })).toBeTruthy()
  })
})
