import { cleanup, fireEvent, render, screen, within } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SheetSurface } from './BottomSheet'
import { InstallAppPrompt } from './InstallAppPrompt'
import { RateAlertForm } from './RateAlertForm'
import { ReportErrorForm } from './ReportErrorForm'
import { DEFAULT_SHARE_TARGETS, ShareCardPreview, ShareSheetBody, ShareTargets } from './ShareSheet'

afterEach(cleanup)

const REPORT_ITEMS = [
  { value: 'bkash-app', label: 'বিকাশ · অ্যাপে · ৳১৮.৫০' },
  { value: 'nagad-ussd', label: 'নগদ · *167# দিয়ে · ৳১৫.০০' },
]

describe('SheetSurface', () => {
  it('sheet: handle, Display/H2 title with a labelled ×, soft description; no shadow', () => {
    const onClose = vi.fn()
    render(
      <SheetSurface variant="sheet" title="ভুল পেলেন?" description="নাম বা ফোন নম্বর লাগবে না।" onCloseClick={onClose} closeLabel="বন্ধ করো">
        <p>body</p>
      </SheetSurface>,
    )
    const panel = document.querySelector<HTMLElement>('[data-sheet="sheet"]')!
    expect(panel.querySelector('[data-sheet-handle]')).toBeTruthy()
    expect(panel.className).toContain('rounded-t-[20px]')
    expect(panel.className).not.toContain('shadow-')
    expect(screen.getByRole('heading', { level: 2, name: 'ভুল পেলেন?' }).className).toContain('type-h2')
    expect(screen.getByText('নাম বা ফোন নম্বর লাগবে না।').className).toContain('text-soft')
    fireEvent.click(screen.getByRole('button', { name: 'বন্ধ করো' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('dialog (Figma desktop modal): no handle, 16px corners, drop shadow, 28px sides', () => {
    render(
      <SheetSurface variant="dialog" title="ভুল পেলেন?">
        <p>body</p>
      </SheetSurface>,
    )
    const panel = document.querySelector<HTMLElement>('[data-sheet="dialog"]')!
    expect(panel.querySelector('[data-sheet-handle]')).toBeNull()
    expect(panel.className).toContain('rounded-[16px]')
    expect(panel.className).toContain('shadow-[0_12px_40px_var(--overlay-shadow)]')
    expect(panel.querySelector('[data-sheet-body]')!.className).toContain('px-7')
  })

  it('responsive: a sheet below lg that turns into the shadowed dialog from lg', () => {
    render(<SheetSurface title="শেয়ার করো" />)
    const panel = document.querySelector<HTMLElement>('[data-sheet="responsive"]')!
    expect(panel.className).toContain('lg:rounded-[16px]')
    expect(panel.className).toContain('lg:shadow-[0_12px_40px_var(--overlay-shadow)]')
    expect(panel.querySelector('[data-sheet-handle]')!.className).toContain('lg:hidden')
  })
})

describe('ReportErrorForm (S2)', () => {
  it('labels every field and sends the picked item, the correction and no bare "https://"', () => {
    const onSubmit = vi.fn()
    render(<ReportErrorForm items={REPORT_ITEMS} defaultItem="nagad-ussd" onSubmit={onSubmit} />)
    const select = screen.getByLabelText('কোন সংখ্যাটা ভুল?') as HTMLSelectElement
    expect(select.value).toBe('nagad-ussd')
    expect(select.className).toContain('h-13')
    fireEvent.input(screen.getByLabelText('সঠিক তথ্য কী?'), { target: { value: '৳১৪.৫০' } })
    expect((screen.getByLabelText(/সূত্রের লিংক/) as HTMLInputElement).value).toBe('https://')
    fireEvent.submit(document.querySelector('form')!)
    expect(onSubmit).toHaveBeenCalledWith({ item: 'nagad-ussd', correct: '৳১৪.৫০', source: '' })
  })

  it('keeps a real source link and follows the select', () => {
    const onSubmit = vi.fn()
    render(<ReportErrorForm items={REPORT_ITEMS} onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText('কোন সংখ্যাটা ভুল?'), { target: { value: 'bkash-app' } })
    fireEvent.input(screen.getByLabelText(/সূত্রের লিংক/), { target: { value: 'https://www.bkash.com/charges' } })
    fireEvent.submit(document.querySelector('form')!)
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({ item: 'bkash-app', source: 'https://www.bkash.com/charges' })
  })
})

describe('RateAlertForm (S3)', () => {
  it('is a named group of checklist rows 16px apart, বিকাশ and নগদ ticked by default', () => {
    render(<RateAlertForm />)
    const group = screen.getByRole('group', { name: 'কোন রেট বদলালে জানাব' })
    // Figma 25:4502…4519: 52px items on a 68px pitch.
    expect(group.className).toContain('gap-4')
    const boxes = within(group).getAllByRole('checkbox') as HTMLInputElement[]
    expect(boxes.map((b) => b.checked)).toEqual([true, true, false, false])
  })

  it('submits the ticked topics and the trimmed email', () => {
    const onSubmit = vi.fn()
    render(<RateAlertForm onSubmit={onSubmit} defaultEmail="  rakib@example.com " />)
    fireEvent.click(screen.getByLabelText('রকেট'))
    fireEvent.click(screen.getByLabelText('বিকাশ'))
    fireEvent.submit(document.querySelector('form')!)
    expect(onSubmit).toHaveBeenCalledWith({ topics: ['nagad', 'rocket'], email: 'rakib@example.com' })
  })

  it('WhatsApp is a link when it has an href, else a button', () => {
    const onWhatsapp = vi.fn()
    const { unmount } = render(<RateAlertForm onWhatsapp={onWhatsapp} />)
    fireEvent.click(screen.getByRole('button', { name: /WhatsApp/ }))
    expect(onWhatsapp).toHaveBeenCalled()
    unmount()
    render(<RateAlertForm whatsappHref="https://whatsapp.com/channel/x" />)
    expect(screen.getByRole('link', { name: /WhatsApp/ }).getAttribute('rel')).toContain('noopener')
  })
})

describe('InstallAppPrompt (S4)', () => {
  it('heading names the sheet; three benefits; পরে and ইনস্টল করো share one row without truncating', () => {
    const onLater = vi.fn()
    const onInstall = vi.fn()
    render(<InstallAppPrompt titleId="install-title" onLater={onLater} onInstall={onInstall} />)
    expect(screen.getByRole('heading', { name: 'হিসাব খাতা ফোনে রাখো' }).id).toBe('install-title')
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    const later = screen.getByRole('button', { name: 'পরে' })
    const install = screen.getByRole('button', { name: 'ইনস্টল করো' })
    expect(later.parentElement).toBe(install.parentElement)
    expect(later.parentElement!.className).toContain('grid-cols-[minmax(max-content,1fr)_minmax(max-content,1fr)]')
    fireEvent.click(later)
    fireEvent.click(install)
    expect(onLater).toHaveBeenCalledTimes(1)
    expect(onInstall).toHaveBeenCalledTimes(1)
  })
})

describe('Share sheet (S1)', () => {
  it('targets are a named group of buttons in Figma order with 8px gaps', () => {
    const onSelect = vi.fn()
    render(<ShareTargets onSelect={onSelect} />)
    const group = screen.getByRole('group', { name: 'যেখানে পাঠাবে' })
    expect(group.className).toContain('gap-2')
    expect(group.className).not.toContain('-mx-')
    const buttons = within(group).getAllByRole('button')
    expect(buttons.map((b) => b.textContent)).toEqual(DEFAULT_SHARE_TARGETS.map((t) => t.label))
    fireEvent.click(screen.getByRole('button', { name: 'Messenger' }))
    expect(onSelect).toHaveBeenCalledWith('messenger')
  })

  it('a label may run into the gap instead of truncating to the column', () => {
    render(<ShareTargets />)
    const label = screen.getByText('Messenger')
    expect(label.className).toContain('max-w-[calc(100%+0.5rem)]')
    expect(label.closest('button')!.querySelector('[aria-hidden="true"]')!.className).toContain('size-13')
  })

  it('the card preview is one image named by its caption and amount', () => {
    render(<ShareSheetBody preview={<ShareCardPreview caption="আমি এই মাসে বাঁচালাম" amount="৳৪৭.৫০" detail="রকেট DBBL ATM" />} />)
    const img = screen.getByRole('img', { name: 'আমি এই মাসে বাঁচালাম ৳৪৭.৫০' })
    // The 2× layout is hidden from assistive tech; the image name says it all.
    expect(img.firstElementChild!.getAttribute('aria-hidden')).toBe('true')
  })
})
