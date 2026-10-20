import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WizardOption, WizardOptionGroup } from './WizardOption'

afterEach(cleanup)

const OPTIONS = [
  { value: 'name', label: 'নিজের নাম' },
  { value: 'parents', label: 'বাবা-মায়ের নাম' },
  { value: 'dob', label: 'জন্ম তারিখ', disabled: true },
]

const radio = (name: string) => screen.getByRole('radio', { name }) as HTMLInputElement

describe('WizardOption', () => {
  it('is a native radio labelled by its text on a 44px+ card', () => {
    render(<WizardOption name="q" value="a" label="বাবা-মায়ের নাম" />)
    const r = radio('বাবা-মায়ের নাম')
    expect(r.type).toBe('radio')
    expect(r.value).toBe('a')
    const card = r.closest('label')!
    expect(card.className).toContain('min-h-touch')
    expect(card.className).toContain('pressable')
    expect(card.className).toContain('has-checked:border-accent')
    expect(card.className).toContain('has-focus-visible:outline-2')
  })

  it('reports its value when chosen', () => {
    const onChange = vi.fn()
    render(<WizardOption name="q" value="a" label="এ" onChange={onChange} />)
    fireEvent.click(radio('এ'))
    expect(onChange).toHaveBeenCalledWith('a', expect.anything())
  })
})

describe('WizardOptionGroup', () => {
  it('is a fieldset named by its legend, with radios sharing one name', () => {
    render(<WizardOptionGroup legend="NID তে কোন তথ্য ভুল আছে?" options={OPTIONS} />)
    const group = screen.getByRole('group', { name: 'NID তে কোন তথ্য ভুল আছে?' })
    expect(group.tagName).toBe('FIELDSET')
    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    expect(radios).toHaveLength(3)
    expect(new Set(radios.map((r) => r.name)).size).toBe(1)
    expect(radios[0]!.name).not.toBe('')
    expect(radios.every((r) => !r.checked)).toBe(true)
  })

  it('selecting one deselects the other (single choice)', () => {
    const onChange = vi.fn()
    render(<WizardOptionGroup legend="প্রশ্ন" options={OPTIONS} defaultValue="name" onChange={onChange} />)
    expect(radio('নিজের নাম').checked).toBe(true)
    fireEvent.click(radio('বাবা-মায়ের নাম'))
    expect(onChange).toHaveBeenCalledWith('parents')
    expect(radio('বাবা-মায়ের নাম').checked).toBe(true)
    expect(radio('নিজের নাম').checked).toBe(false)
  })

  it('disabled options are disabled radios and not pressable', () => {
    render(<WizardOptionGroup legend="প্রশ্ন" options={OPTIONS} />)
    expect(radio('জন্ম তারিখ').disabled).toBe(true)
    expect(radio('জন্ম তারিখ').closest('label')!.className).not.toContain('pressable')
  })

  it('a hidden legend still names the group', () => {
    render(<WizardOptionGroup legend="লুকানো প্রশ্ন" legendHidden options={OPTIONS} name="w" />)
    expect(screen.getByRole('group', { name: 'লুকানো প্রশ্ন' })).toBeTruthy()
    expect(screen.getByText('লুকানো প্রশ্ন').className).toContain('sr-only')
    expect(radio('নিজের নাম').name).toBe('w')
  })

  it('controlled value wins over clicks until the parent updates', () => {
    const onChange = vi.fn()
    render(<WizardOptionGroup legend="প্রশ্ন" options={OPTIONS} value="name" onChange={onChange} />)
    fireEvent.click(radio('বাবা-মায়ের নাম'))
    expect(onChange).toHaveBeenCalledWith('parents')
    expect(radio('নিজের নাম').checked).toBe(true)
  })
})
