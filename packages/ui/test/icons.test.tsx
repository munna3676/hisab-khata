import { render, screen } from '@testing-library/preact'
import { describe, expect, it } from 'vitest'
import { Check, Search } from '../src/icons'

describe('icons', () => {
  it('a labelled icon is an img with that name', () => {
    render(<Check label="ঠিক আছে" />)
    expect(screen.getByRole('img', { name: 'ঠিক আছে' })).toBeTruthy()
  })

  it('an unlabelled icon is hidden from assistive tech', () => {
    const { container } = render(<Search size={20} class="text-accent" />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('width')).toBe('20')
    expect(svg.getAttribute('class')).toContain('text-accent')
  })
})
