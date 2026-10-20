import { describe, expect, it, vi } from 'vitest'
import { blobToBase64, createCapacitorPlatform, type CapacitorPlugins, type FilesystemPlugin } from '../src/capacitor.ts'

/** In-memory fakes of the Capacitor plugins, recording every call. */
function fakePlugins(options: { permission?: 'granted' | 'denied' | 'prompt'; shareError?: Error } = {}) {
  const calls: [string, unknown][] = []
  const prefs = new Map<string, string>()
  const files = new Map<string, string>()
  let permission = options.permission ?? 'granted'
  const pendingIds = new Set<number>()
  const networkListeners: ((s: { connected: boolean; connectionType: 'wifi' | 'cellular' | 'none' | 'unknown' }) => void)[] = []
  const loads: string[] = []
  const filesystem: FilesystemPlugin = {
    async writeFile(o) {
      calls.push(['writeFile', o])
      files.set(`${o.directory}/${o.path}`, o.data)
      return { uri: `file:///${o.directory}/${o.path}` }
    },
    async readFile(o) {
      const data = files.get(`${o.directory}/${o.path}`)
      if (data === undefined) throw new Error('File does not exist')
      return { data }
    },
    async deleteFile(o) {
      files.delete(`${o.directory}/${o.path}`)
    },
    async readdir(o) {
      const prefix = `${o.directory}/${o.path}/`
      return { files: [...files.keys()].filter((k) => k.startsWith(prefix)).map((k) => ({ name: k.slice(prefix.length) })) }
    },
  }
  const plugins: CapacitorPlugins = {
    share: async () => {
      loads.push('share')
      return {
        async share(o) {
          calls.push(['share', o])
          if (options.shareError) throw options.shareError
          return {}
        },
      }
    },
    haptics: async () => ({
      impact: async (o) => void calls.push(['impact', o]),
      notification: async (o) => void calls.push(['notification', o]),
      selectionStart: async () => undefined,
      selectionChanged: async () => void calls.push(['selectionChanged', null]),
      selectionEnd: async () => undefined,
    }),
    preferences: async () => {
      loads.push('preferences')
      return {
        get: async ({ key }) => ({ value: prefs.get(key) ?? null }),
        set: async ({ key, value }) => void prefs.set(key, value),
        remove: async ({ key }) => void prefs.delete(key),
        keys: async () => ({ keys: [...prefs.keys()] }),
      }
    },
    filesystem: async () => filesystem,
    localNotifications: async () => ({
      schedule: async (o) => {
        calls.push(['schedule', o])
        for (const n of o.notifications) pendingIds.add(n.id)
        return { notifications: o.notifications.map((n) => ({ id: n.id })) }
      },
      cancel: async (o) => {
        for (const n of o.notifications) pendingIds.delete(n.id)
      },
      getPending: async () => ({ notifications: [...pendingIds].map((id) => ({ id })) }),
      checkPermissions: async () => ({ display: permission }),
      requestPermissions: async () => {
        calls.push(['requestPermissions', null])
        if (permission === 'prompt') permission = 'granted'
        return { display: permission }
      },
    }),
    browser: async () => ({ open: async (o) => void calls.push(['browser', o]) }),
    network: async () => ({
      getStatus: async () => ({ connected: true, connectionType: 'cellular' }),
      addListener: async (_event, listener) => {
        networkListeners.push(listener)
        return { remove: async () => void networkListeners.splice(networkListeners.indexOf(listener), 1) }
      },
    }),
    app: async () => ({ getInfo: async () => ({ name: 'হিসাব খাতা', id: 'com.hisabkhata.app', build: '12', version: '1.2.0' }) }),
  }
  return { plugins, calls, prefs, files, loads, networkListeners }
}

const ios = { isNativePlatform: () => true, getPlatform: () => 'ios' }

describe('capacitor platform', () => {
  it('detects iOS or Android from the Capacitor global and reads app info', async () => {
    const { plugins } = fakePlugins()
    const platform = createCapacitorPlatform(plugins, ios)
    expect(platform.kind).toBe('ios')
    expect(createCapacitorPlatform(plugins, { getPlatform: () => 'android' }).kind).toBe('android')
    expect(await platform.appInfo()).toEqual({ kind: 'ios', native: true, version: '1.2.0', build: '12', id: 'com.hisabkhata.app' })
  })

  it('writes shared files to the cache and passes their URIs to the share sheet', async () => {
    const { plugins, calls } = fakePlugins()
    const platform = createCapacitorPlatform(plugins, ios)
    const data = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' })
    expect(await platform.share({ title: 'ফলাফল', url: 'https://hisabkhata.com/tools/emi', files: [{ name: 'card.png', type: 'image/png', data }] })).toBe('shared')
    expect(calls[0]).toEqual(['writeFile', { path: 'share/card.png', data: 'AQID', directory: 'CACHE', recursive: true }])
    expect(calls[1]![1]).toMatchObject({ files: ['file:///CACHE/share/card.png'], url: 'https://hisabkhata.com/tools/emi' })
  })

  it('reports a dismissed share sheet as cancelled and rethrows other errors', async () => {
    const cancelled = createCapacitorPlatform(fakePlugins({ shareError: new Error('Share canceled') }).plugins, ios)
    expect(await cancelled.share({ text: 'x' })).toBe('cancelled')
    const broken = createCapacitorPlatform(fakePlugins({ shareError: new Error('boom') }).plugins, ios)
    await expect(broken.share({ text: 'x' })).rejects.toThrow('boom')
  })

  it('maps haptic kinds to the Haptics plugin', async () => {
    const { plugins, calls } = fakePlugins()
    const platform = createCapacitorPlatform(plugins, ios)
    await platform.haptic('tap')
    await platform.haptic('selection')
    await platform.haptic('error')
    expect(calls).toEqual([
      ['impact', { style: 'LIGHT' }],
      ['selectionChanged', null],
      ['notification', { type: 'ERROR' }],
    ])
  })

  it('never throws from haptics', async () => {
    const { plugins } = fakePlugins()
    plugins.haptics = async () => {
      throw new Error('not implemented')
    }
    await expect(createCapacitorPlatform(plugins, ios).haptic('tap')).resolves.toBeUndefined()
  })

  it('stores small values in Preferences and large ones as files', async () => {
    const { plugins, prefs, files } = fakePlugins()
    const { store } = createCapacitorPlatform(plugins, ios)
    await store.set('favorites', ['emi'])
    expect(prefs.get('favorites')).toBe('["emi"]')
    const big = 'x'.repeat(70 * 1024)
    await store.set('data:mfs-charges', big)
    expect(files.has('DATA/store/data%3Amfs-charges.json')).toBe(true)
    expect(await store.get('data:mfs-charges')).toBe(big)
    expect(await store.keys()).toEqual(['data:mfs-charges', 'favorites'])
    await store.remove('data:mfs-charges')
    expect(files.size).toBe(0)
  })

  it('loads each plugin once, and only when used', async () => {
    const { plugins, loads } = fakePlugins()
    const platform = createCapacitorPlatform(plugins, ios)
    expect(loads).toEqual([])
    await platform.store.set('a', 1)
    await platform.store.get('a')
    expect(loads).toEqual(['preferences'])
  })

  it('schedules local notifications after asking for permission', async () => {
    const { plugins, calls } = fakePlugins({ permission: 'prompt' })
    const { notify } = createCapacitorPlatform(plugins, ios)
    const at = new Date('2027-02-08T11:50:00Z')
    expect(await notify.schedule([{ id: 3, title: 'সেহরি', body: 'সেহরির শেষ ৫:১২', at, repeat: 'day', data: { route: '/tools/sehri-iftar' } }])).toBe(true)
    expect(calls.map(([name]) => name)).toEqual(['requestPermissions', 'schedule'])
    expect(calls[1]![1]).toEqual({
      notifications: [
        { id: 3, title: 'সেহরি', body: 'সেহরির শেষ ৫:১২', schedule: { at, repeats: true, every: 'day', allowWhileIdle: true }, extra: { route: '/tools/sehri-iftar' } },
      ],
    })
    expect(await notify.pending()).toEqual([3])
    await notify.cancel([3])
    expect(await notify.pending()).toEqual([])
  })

  it('does not schedule when notifications are denied', async () => {
    const { plugins } = fakePlugins({ permission: 'denied' })
    const { notify } = createCapacitorPlatform(plugins, ios)
    expect(await notify.permission()).toBe('denied')
    expect(await notify.schedule([{ id: 1, title: 't', body: 'b', at: new Date() }])).toBe(false)
  })

  it('opens web links in the in-app browser and refuses unsafe schemes', async () => {
    const { plugins, calls } = fakePlugins()
    const platform = createCapacitorPlatform(plugins, ios)
    await platform.openExternal('https://www.bb.org.bd/')
    expect(calls).toEqual([['browser', { url: 'https://www.bb.org.bd/' }]])
    await expect(platform.openExternal('file:///etc/passwd')).rejects.toThrow(/refusing/)
  })

  it('reports network status and changes, and stops listening', async () => {
    const { plugins, networkListeners } = fakePlugins()
    const { network } = createCapacitorPlatform(plugins, ios)
    expect(await network.status()).toEqual({ online: true, type: 'cellular' })
    const seen: boolean[] = []
    const stop = network.subscribe((s) => seen.push(s.online))
    await vi.waitFor(() => expect(networkListeners).toHaveLength(1))
    networkListeners[0]!({ connected: false, connectionType: 'none' })
    stop()
    await vi.waitFor(() => expect(networkListeners).toHaveLength(0))
    expect(seen).toEqual([false])
  })

  it('removes a listener that attaches after unsubscribe', async () => {
    const { plugins, networkListeners } = fakePlugins()
    const { network } = createCapacitorPlatform(plugins, ios)
    network.subscribe(() => undefined)()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(networkListeners).toHaveLength(0)
  })

  it('prints with the printer plugin when one is given', async () => {
    const { plugins } = fakePlugins()
    const printWebView = vi.fn(async () => undefined)
    await createCapacitorPlatform({ ...plugins, printer: async () => ({ printWebView }) }, ios).print()
    expect(printWebView).toHaveBeenCalledOnce()
  })

  it('encodes blobs to base64 in chunks', async () => {
    const bytes = new Uint8Array(100_000).map((_, i) => i % 256)
    const encoded = await blobToBase64(new Blob([bytes]))
    expect(Buffer.from(encoded, 'base64').equals(Buffer.from(bytes))).toBe(true)
  })
})
