import { afterEach, describe, expect, it, vi } from 'vitest'
import { LARGE_MARKER } from '../src/store.ts'
import { STORAGE_PREFIX, createWebPlatform, localStorageBackend, webNotifier, type WebEnv } from '../src/web.ts'

/** happy-dom's globals with a navigator we control. */
function env(navigator: Partial<Navigator> = {}, extra: Partial<WebEnv> = {}): WebEnv {
  return {
    window,
    document,
    navigator: { onLine: true, ...navigator } as Navigator,
    localStorage: window.localStorage,
    indexedDB: undefined,
    Notification: undefined,
    ...extra,
  }
}

const png = { name: 'card.png', type: 'image/png', data: new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }) }

afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('web share', () => {
  it('uses navigator.share when the browser can share the files', async () => {
    const share = vi.fn(async (_data: ShareData) => undefined)
    const platform = createWebPlatform(env({ share, canShare: () => true }))
    expect(await platform.share({ title: 'হিসাব খাতা', url: 'https://hisabkhata.com/tools/emi', files: [png] })).toBe('shared')
    const data = share.mock.calls[0]![0]
    expect(data.files?.[0]).toBeInstanceOf(File)
    expect(data.files?.[0]?.name).toBe('card.png')
  })

  it('reports a dismissed share sheet as cancelled', async () => {
    const share = vi.fn(async () => {
      throw new DOMException('dismissed', 'AbortError')
    })
    expect(await createWebPlatform(env({ share })).share({ url: 'https://hisabkhata.com/' })).toBe('cancelled')
  })

  it('downloads files the browser cannot share', async () => {
    const clicks: string[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicks.push(this.download)
    })
    const share = vi.fn(async () => undefined)
    const platform = createWebPlatform(env({ share, canShare: () => false }))
    expect(await platform.share({ files: [png] })).toBe('downloaded')
    expect(share).not.toHaveBeenCalled()
    expect(clicks).toEqual(['card.png'])
    expect(document.querySelector('a[download]')).toBeNull()
  })

  it('copies the link when there is no share sheet (desktop)', async () => {
    const writeText = vi.fn(async () => undefined)
    const platform = createWebPlatform(env({ clipboard: { writeText } as unknown as Clipboard }))
    expect(await platform.share({ text: 'EMI ৳১৬,৬০৭', url: 'https://hisabkhata.com/tools/emi?p=500000' })).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('https://hisabkhata.com/tools/emi?p=500000')
    expect(await createWebPlatform(env()).share({ url: 'https://x.test/' })).toBe('unsupported')
  })
})

describe('web print, links, haptics, app info', () => {
  it('prints with window.print and opens only safe external links', async () => {
    const print = vi.fn()
    const open = vi.fn(() => null)
    const platform = createWebPlatform(env({}, { window: { print, open } as unknown as Window }))
    await platform.print()
    expect(print).toHaveBeenCalledOnce()
    await platform.openExternal('https://www.bkash.com/')
    expect(open).toHaveBeenCalledWith('https://www.bkash.com/', '_blank', 'noopener,noreferrer')
    await expect(platform.openExternal('javascript:alert(1)')).rejects.toThrow(/refusing/)
    await expect(platform.openExternal('/relative')).rejects.toThrow(/absolute/)
  })

  it('has no-op haptics and reports the web', async () => {
    const platform = createWebPlatform(env())
    await expect(platform.haptic('success')).resolves.toBeUndefined()
    expect(await platform.appInfo()).toEqual({ kind: 'web', native: false })
    expect(platform.kind).toBe('web')
  })
})

describe('web store', () => {
  it('keeps values in localStorage under the hk: prefix and ignores other keys', async () => {
    window.localStorage.setItem('other-site-key', 'x')
    const { store } = createWebPlatform(env())
    await store.set('favorites', ['emi'])
    expect(window.localStorage.getItem(`${STORAGE_PREFIX}favorites`)).toBe('["emi"]')
    expect(await store.keys()).toEqual(['favorites'])
    expect(await store.get('favorites')).toEqual(['emi'])
  })

  it('reads a large-value marker without IndexedDB as missing', async () => {
    await localStorageBackend(window.localStorage).write('big', LARGE_MARKER)
    expect(await createWebPlatform(env()).store.get('big')).toBeUndefined()
  })

  it('works without localStorage (private mode) from memory', async () => {
    const { store } = createWebPlatform(env({}, { localStorage: undefined }))
    await store.set('k', 1)
    expect(await store.get('k')).toBe(1)
  })
})

describe('web network', () => {
  it('reports online state and online/offline events', async () => {
    const nav = { onLine: true, connection: { type: 'wifi' } } as unknown as Navigator
    const platform = createWebPlatform(env({}, { navigator: nav }))
    expect(await platform.network.status()).toEqual({ online: true, type: 'wifi' })
    const seen: boolean[] = []
    const stop = platform.network.subscribe((status) => seen.push(status.online))
    ;(nav as { onLine: boolean }).onLine = false
    window.dispatchEvent(new Event('offline'))
    stop()
    window.dispatchEvent(new Event('online'))
    expect(seen).toEqual([false])
    expect(await platform.network.status()).toEqual({ online: false, type: 'none' })
  })
})

describe('web reminders', () => {
  function fakeNotification(permission: NotificationPermission) {
    const shown: { title: string; body?: string }[] = []
    const Fake = function (this: unknown, title: string, options?: NotificationOptions) {
      shown.push({ title, body: options?.body })
    } as unknown as typeof Notification
    Object.assign(Fake, {
      permission,
      requestPermission: vi.fn(async () => {
        ;(Fake as { permission: NotificationPermission }).permission = 'granted'
        return 'granted'
      }),
    })
    return { Fake, shown }
  }

  it('is unsupported without the Notification API', async () => {
    const notifier = webNotifier({ Notification: undefined })
    expect(await notifier.permission()).toBe('unsupported')
    expect(await notifier.schedule([{ id: 1, title: 't', body: 'b', at: new Date() }])).toBe(false)
  })

  it('asks for permission once and fires reminders while the page is open', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-01T10:00:00Z'))
    const { Fake, shown } = fakeNotification('default')
    const notifier = webNotifier({ Notification: Fake })
    expect(await notifier.permission()).toBe('prompt')
    expect(await notifier.requestPermission()).toBe('granted')

    const at = new Date('2026-03-01T11:00:00Z')
    expect(await notifier.schedule([{ id: 7, title: 'ইফতার', body: 'ঢাকায় ইফতার ৫:৫৮', at, repeat: 'day' }])).toBe(true)
    expect(await notifier.pending()).toEqual([7])
    vi.advanceTimersByTime(60 * 60 * 1000)
    expect(shown).toEqual([{ title: 'ইফতার', body: 'ঢাকায় ইফতার ৫:৫৮' }])
    // A daily reminder re-arms itself for the next day.
    expect(await notifier.pending()).toEqual([7])
    vi.advanceTimersByTime(24 * 60 * 60 * 1000)
    expect(shown).toHaveLength(2)

    await notifier.cancel([7])
    expect(await notifier.pending()).toEqual([])
  })

  it('skips a one-off reminder in the past and moves a repeating one to its next time', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-05T10:00:00Z'))
    const { Fake, shown } = fakeNotification('granted')
    const notifier = webNotifier({ Notification: Fake })
    await notifier.schedule([
      { id: 1, title: 'old', body: '', at: new Date('2026-03-01T09:00:00Z') },
      { id: 2, title: 'daily', body: '', at: new Date('2026-03-01T09:00:00Z'), repeat: 'day' },
    ])
    expect(await notifier.pending()).toEqual([2])
    vi.advanceTimersByTime(23 * 60 * 60 * 1000)
    expect(shown.map((s) => s.title)).toEqual(['daily'])
  })

  it('refuses to schedule when permission was denied', async () => {
    const { Fake } = fakeNotification('denied')
    const notifier = webNotifier({ Notification: Fake })
    expect(await notifier.requestPermission()).toBe('denied')
    expect(await notifier.schedule([{ id: 1, title: 't', body: 'b', at: new Date(Date.now() + 1000) }])).toBe(false)
  })
})
