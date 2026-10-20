/// <reference types="node" />
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { utils } from '@noble/ed25519'
import { specFor } from '../src/contract.ts'
import { keyIdOf, publicKeyOf, sha256Hex, signManifest, type DataManifest, type SignedManifest } from '../src/manifest.ts'
import { DataStore, memoryStorage, type DataSnapshot, type FetchResponse, type StorageAdapter } from '../src/store.ts'

const dataDir = new URL('../../../data/', import.meta.url).pathname
const encoder = new TextEncoder()
const BASE = 'https://data.example/v1/'
const MANIFEST_URL = `${BASE}manifest.signed.json`

/** path → exact text of every bundled data file in the repo. */
const repoTexts: Record<string, string> = {}
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (name.startsWith('_')) continue
    if (statSync(path).isDirectory()) walk(path)
    else {
      const rel = relative(dataDir, path).split(sep).join('/')
      if (specFor(rel)?.bundled) repoTexts[rel] = readFileSync(path, 'utf8')
    }
  }
}
walk(dataDir)

async function manifestOf(texts: Record<string, string>, version: number): Promise<DataManifest> {
  const files: DataManifest['files'] = {}
  for (const [path, text] of Object.entries(texts)) {
    const bytes = encoder.encode(text)
    files[path] = { sha256: await sha256Hex(bytes), bytes: bytes.length }
  }
  return { format: 1, version, date: '2026-10-20', files }
}

// Throwaway keys, made for this test only.
let secretKey: Uint8Array
let trustedKeys: Record<string, Uint8Array>
let bundled: DataSnapshot

beforeAll(async () => {
  secretKey = utils.randomSecretKey()
  const publicKey = await publicKeyOf(secretKey)
  trustedKeys = { [await keyIdOf(publicKey)]: publicKey }
  const files: Record<string, unknown> = {}
  for (const [path, text] of Object.entries(repoTexts)) files[path] = JSON.parse(text)
  bundled = { manifest: await manifestOf(repoTexts, 100), files }
})

/** A fake CDN: URL → body. Records what was fetched. */
function server() {
  const bodies = new Map<string, string>()
  const fetched: string[] = []
  let down = false
  const fetch = async (url: string): Promise<FetchResponse> => {
    if (down) throw new Error('network down')
    fetched.push(url)
    const body = bodies.get(url)
    return {
      ok: body !== undefined,
      status: body === undefined ? 404 : 200,
      arrayBuffer: async () => encoder.encode(body ?? '').buffer as ArrayBuffer,
    }
  }
  return {
    bodies,
    fetched,
    fetch,
    setDown: (value: boolean) => void (down = value),
    /** Publishes a release: the given changes on top of the repo data, signed with `key`. */
    async publish(version: number, changes: Record<string, unknown>, opts: { key?: Uint8Array; drop?: string[]; serve?: Record<string, string> } = {}) {
      const texts = { ...repoTexts }
      for (const [path, data] of Object.entries(changes)) texts[path] = typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n'
      for (const path of opts.drop ?? []) delete texts[path]
      const manifest = await manifestOf(texts, version)
      const signed = await signManifest(manifest, opts.key ?? secretKey)
      bodies.set(MANIFEST_URL, JSON.stringify(signed))
      for (const [path, text] of Object.entries(texts)) bodies.set(BASE + path, opts.serve?.[path] ?? text)
      return { manifest, signed }
    },
  }
}

const mfs = (per1000: number) => {
  const data = JSON.parse(repoTexts['mfs-charges.json']!)
  data.channels[0].value.bands[0].per1000 = per1000
  return data
}

function storeWith(srv: ReturnType<typeof server>, storage: StorageAdapter = memoryStorage()) {
  return new DataStore({ bundled, trustedKeys, storage, manifestUrl: MANIFEST_URL, fetch: srv.fetch })
}

const agentRate = (store: DataStore) => store.get('mfs-charges.json')!.channels[0]!.value.bands[0]!.per1000

describe('DataStore', () => {
  it('starts from the bundled snapshot when storage is empty', async () => {
    const store = storeWith(server())
    await store.load()
    expect(store.version).toBe(100)
    expect(agentRate(store)).toBe(18.5)
  })

  it('downloads only the changed files of a newer signed release, and keeps them across restarts', async () => {
    const srv = server()
    const storage = memoryStorage()
    const store = storeWith(srv, storage)
    await store.load()
    const seen: number[] = []
    store.subscribe((s) => seen.push(s.manifest.version))
    await srv.publish(101, { 'mfs-charges.json': mfs(17.5) })
    expect(await store.update()).toEqual({ status: 'updated', version: 101, changed: ['mfs-charges.json'] })
    expect(srv.fetched).toEqual([MANIFEST_URL, `${BASE}mfs-charges.json`])
    expect(agentRate(store)).toBe(17.5)
    expect(seen).toEqual([101])

    const restarted = storeWith(srv, storage)
    await restarted.load()
    expect(restarted.version).toBe(101)
    expect(agentRate(restarted)).toBe(17.5)
    expect(await restarted.update()).toEqual({ status: 'current', version: 101 })
  })

  it('reuses its own downloaded copy of a file that did not change in the next release', async () => {
    const srv = server()
    const store = storeWith(srv)
    await store.load()
    await srv.publish(101, { 'mfs-charges.json': mfs(17.5) })
    await store.update()
    const zakat = JSON.parse(repoTexts['religion/zakat.json']!)
    zakat.value.ratePct = 2.6
    await srv.publish(102, { 'mfs-charges.json': mfs(17.5), 'religion/zakat.json': zakat })
    srv.fetched.length = 0
    expect(await store.update()).toEqual({ status: 'updated', version: 102, changed: ['religion/zakat.json'] })
    expect(srv.fetched).toEqual([MANIFEST_URL, `${BASE}religion/zakat.json`])
    expect(agentRate(store)).toBe(17.5)
  })

  it('never accepts unsigned or unverifiable manifests', async () => {
    const srv = server()
    const store = storeWith(srv)
    await store.load()
    const { manifest, signed } = await srv.publish(101, { 'mfs-charges.json': mfs(17.5) })

    srv.bodies.set(MANIFEST_URL, JSON.stringify(manifest))
    expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'unsigned' })
    srv.bodies.set(MANIFEST_URL, 'not json')
    expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'unsigned' })

    const tampered: SignedManifest = { ...signed, manifest: signed.manifest.replace('"version": 101', '"version": 999') }
    srv.bodies.set(MANIFEST_URL, JSON.stringify(tampered))
    expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'bad-signature' })

    const attacker = utils.randomSecretKey()
    const forged = await signManifest(manifest, attacker)
    srv.bodies.set(MANIFEST_URL, JSON.stringify(forged))
    expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'unknown-key' })
    srv.bodies.set(MANIFEST_URL, JSON.stringify({ ...forged, keyId: signed.keyId }))
    expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'bad-signature' })
    srv.bodies.set(MANIFEST_URL, JSON.stringify({ ...signed, signature: '!!!' }))
    expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'bad-signature' })

    expect(store.version).toBe(100)
    expect(agentRate(store)).toBe(18.5)
  })

  it('rejects a file whose bytes do not match the signed hash', async () => {
    const srv = server()
    const storage = memoryStorage()
    const store = storeWith(srv, storage)
    await store.load()
    await srv.publish(101, { 'mfs-charges.json': mfs(17.5) }, { serve: { 'mfs-charges.json': JSON.stringify(mfs(5)) } })
    expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'hash', detail: 'mfs-charges.json' })
    expect(agentRate(store)).toBe(18.5)
    expect(storage.map.size).toBe(0)
  })

  it('rejects signed data that fails its schema, bounds or engine rules', async () => {
    const srv = server()
    const store = storeWith(srv)
    await store.load()
    await srv.publish(101, { 'mfs-charges.json': mfs(185) })
    expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'invalid', detail: expect.stringMatching(/per1000 = 185/) })
    const excise = JSON.parse(repoTexts['finance/excise-duty.json']!)
    excise.value[1].upTo = 1
    await srv.publish(102, { 'finance/excise-duty.json': excise })
    expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'invalid' })
    await srv.publish(103, { 'religion/zakat.json': '{ not json' })
    expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'invalid' })
    expect(store.version).toBe(100)
  })

  it('rejects a release that drops a file the app needs, or adds one it does not know', async () => {
    const srv = server()
    const store = storeWith(srv)
    await store.load()
    await srv.publish(101, {}, { drop: ['gold/bajus-rates.json'] })
    expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'missing-file' })
    await srv.publish(102, { 'extra.json': { a: 1 } })
    expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'bad-manifest' })
  })

  it('reports offline without changing anything', async () => {
    const srv = server()
    const store = storeWith(srv)
    await store.load()
    expect(await store.update()).toEqual({ status: 'offline', detail: 'manifest HTTP 404' })
    srv.setDown(true)
    expect(await store.update()).toEqual({ status: 'offline', detail: 'network down' })
    expect(store.version).toBe(100)
  })

  it('keeps the last good set: a bad release changes nothing, a corrupt slot falls back to the other', async () => {
    const srv = server()
    const storage = memoryStorage()
    const store = storeWith(srv, storage)
    await store.load()
    await srv.publish(101, { 'mfs-charges.json': mfs(17.5) })
    await store.update()
    const goodSlots = new Map(storage.map)
    await srv.publish(102, { 'mfs-charges.json': mfs(500) })
    expect(await store.update()).toMatchObject({ status: 'rejected' })
    expect(storage.map).toEqual(goodSlots)

    await srv.publish(103, { 'mfs-charges.json': mfs(16) })
    expect(await store.update()).toMatchObject({ status: 'updated', version: 103 })
    const active = storage.map.get('hisab-data/active')!
    // Someone edits the active slot on disk: its hashes no longer match the signature.
    const slot = JSON.parse(storage.map.get(`hisab-data/set-${active}`)!)
    slot.texts['mfs-charges.json'] = slot.texts['mfs-charges.json'].replace('"per1000": 16', '"per1000": 1')
    storage.map.set(`hisab-data/set-${active}`, JSON.stringify(slot))
    const restarted = storeWith(srv, storage)
    await restarted.load()
    expect(restarted.version).toBe(101)
    expect(agentRate(restarted)).toBe(17.5)

    storage.map.set('hisab-data/set-a', '{')
    storage.map.set('hisab-data/set-b', '{')
    const fresh = storeWith(srv, storage)
    await fresh.load()
    expect(fresh.version).toBe(100)
  })

  it('uses the bundle when the stored set is older than it (after an app update)', async () => {
    const srv = server()
    const storage = memoryStorage()
    const store = storeWith(srv, storage)
    await store.load()
    await srv.publish(101, { 'mfs-charges.json': mfs(17.5) })
    await store.update()
    const newerBundle = { ...bundled, manifest: { ...bundled.manifest, version: 200 } }
    const updatedApp = new DataStore({ bundled: newerBundle, trustedKeys, storage, manifestUrl: MANIFEST_URL, fetch: srv.fetch })
    await updatedApp.load()
    expect(updatedApp.version).toBe(200)
    expect(agentRate(updatedApp)).toBe(18.5)
  })

  it('does not switch when storage cannot be written', async () => {
    const srv = server()
    const failing: StorageAdapter = { get: async () => null, set: async () => Promise.reject(new Error('disk full')), remove: async () => {} }
    const store = storeWith(srv, failing)
    await store.load()
    await srv.publish(101, { 'mfs-charges.json': mfs(17.5) })
    expect(await store.update()).toEqual({ status: 'rejected', reason: 'storage', detail: 'disk full' })
    expect(store.version).toBe(100)
  })

  it('runs one update at a time', async () => {
    const srv = server()
    const store = storeWith(srv)
    await store.load()
    await srv.publish(101, { 'mfs-charges.json': mfs(17.5) })
    const [a, b] = await Promise.all([store.update(), store.update()])
    expect(a).toBe(b)
    expect(srv.fetched.filter((u) => u === MANIFEST_URL)).toHaveLength(1)
  })
})

describe('DataStore against a hostile server or storage', () => {
  it('ignores a replayed older release once a newer one is in use', async () => {
    const srv = server()
    const storage = memoryStorage()
    const store = storeWith(srv, storage)
    await store.load()
    const old = await srv.publish(101, { 'mfs-charges.json': mfs(17.5) })
    await store.update()
    await srv.publish(102, { 'mfs-charges.json': mfs(16) })
    await store.update()
    const before = new Map(storage.map)
    srv.bodies.set(MANIFEST_URL, JSON.stringify(old.signed))
    expect(await store.update()).toEqual({ status: 'current', version: 102 })
    expect(agentRate(store)).toBe(16)
    expect(storage.map).toEqual(before)
  })

  it('an update() before load() cannot roll a newer stored release back to a replayed older one', async () => {
    const srv = server()
    const storage = memoryStorage()
    const first = storeWith(srv, storage)
    await first.load()
    await srv.publish(101, { 'mfs-charges.json': mfs(17.5) })
    await first.update()
    const replay = await srv.publish(102, { 'mfs-charges.json': mfs(17) })
    await srv.publish(103, { 'mfs-charges.json': mfs(16) })
    await first.update()
    expect(first.version).toBe(103)

    // Next launch: the app asks for an update first and the server replays 102.
    srv.bodies.set(MANIFEST_URL, JSON.stringify(replay.signed))
    const next = storeWith(srv, storage)
    expect(await next.update()).toEqual({ status: 'current', version: 103 })
    const restarted = storeWith(srv, storage)
    await restarted.load()
    expect(restarted.version).toBe(103)
    expect(agentRate(restarted)).toBe(16)
  })

  it('a pointer rewritten to the older slot does not roll the app back', async () => {
    const srv = server()
    const storage = memoryStorage()
    const store = storeWith(srv, storage)
    await store.load()
    await srv.publish(101, { 'mfs-charges.json': mfs(17.5) })
    await store.update()
    await srv.publish(102, { 'mfs-charges.json': mfs(16) })
    await store.update()
    const active = storage.map.get('hisab-data/active')!
    storage.map.set('hisab-data/active', active === 'a' ? 'b' : 'a')
    const restarted = storeWith(srv, storage)
    await restarted.load()
    expect(restarted.version).toBe(102)
  })

  it('refuses a file the signed manifest says is too large without downloading it, and an oversized manifest', async () => {
    const srv = server()
    const store = new DataStore({ bundled, trustedKeys, storage: memoryStorage(), manifestUrl: MANIFEST_URL, fetch: srv.fetch, maxFileBytes: 20_000 })
    await store.load()
    const big = mfs(17.5)
    const text = JSON.stringify(big, null, 2) + '\n' + ' '.repeat(30_000)
    await srv.publish(101, { 'mfs-charges.json': text })
    expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'download', detail: 'mfs-charges.json is too large' })
    expect(srv.fetched).toEqual([MANIFEST_URL])

    srv.bodies.set(MANIFEST_URL, ' '.repeat(30_000))
    expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'bad-manifest' })
    expect(store.version).toBe(100)
  })

  it('rejects a partial (truncated) download', async () => {
    const srv = server()
    const store = storeWith(srv)
    await store.load()
    const text = JSON.stringify(mfs(17.5), null, 2) + '\n'
    await srv.publish(101, { 'mfs-charges.json': text }, { serve: { 'mfs-charges.json': text.slice(0, text.length >> 1) } })
    expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'hash', detail: 'mfs-charges.json' })
    expect(store.version).toBe(100)
  })

  it('rejects a validly signed manifest with an unsafe path, a negative size or a key id that is an Object property', async () => {
    const srv = server()
    const store = storeWith(srv)
    await store.load()
    const { manifest } = await srv.publish(101, { 'mfs-charges.json': mfs(17.5) })
    const sha = manifest.files['mfs-charges.json']!.sha256
    for (const files of [{ ...manifest.files, '../secret.json': { sha256: sha, bytes: 10 } }, { ...manifest.files, 'mfs-charges.json': { sha256: sha, bytes: -1 } }]) {
      srv.bodies.set(MANIFEST_URL, JSON.stringify(await signManifest({ ...manifest, files }, secretKey)))
      expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'bad-manifest' })
    }
    const signed = await signManifest(manifest, secretKey)
    for (const keyId of ['__proto__', 'constructor', 'toString']) {
      srv.bodies.set(MANIFEST_URL, JSON.stringify({ ...signed, keyId }))
      expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'unknown-key' })
    }
    expect(store.version).toBe(100)
  })

  it('loads a stored set that lost its texts map and can still update from it', async () => {
    const srv = server()
    const storage = memoryStorage()
    const store = storeWith(srv, storage)
    await store.load()
    // A release that only bumps the version: every file comes from the bundle.
    await srv.publish(101, {})
    expect(await store.update()).toEqual({ status: 'updated', version: 101, changed: [] })
    const key = `hisab-data/set-${storage.map.get('hisab-data/active')}`
    const slot = JSON.parse(storage.map.get(key)!)
    delete slot.texts
    storage.map.set(key, JSON.stringify(slot))
    const restarted = storeWith(srv, storage)
    await restarted.load()
    expect(restarted.version).toBe(101)
    await srv.publish(102, { 'mfs-charges.json': mfs(16) })
    expect(await restarted.update()).toEqual({ status: 'updated', version: 102, changed: ['mfs-charges.json'] })
  })

  it('rejects schema-valid but absurd values in a signed release', async () => {
    const srv = server()
    const store = storeWith(srv)
    await store.load()
    const vat = JSON.parse(repoTexts['commerce/vat-rates.json']!)
    vat.defaultPct.value = 150
    await srv.publish(101, { 'commerce/vat-rates.json': vat })
    expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'invalid', detail: expect.stringMatching(/defaultPct\/value/) })
    const fitra = JSON.parse(repoTexts['religion/fitra.json']!)
    fitra.value.items[0].kgPerPerson = 1650
    await srv.publish(102, { 'religion/fitra.json': fitra })
    expect(await store.update()).toMatchObject({ status: 'rejected', reason: 'invalid', detail: expect.stringMatching(/kgPerPerson = 1650/) })
    expect(store.version).toBe(100)
  })
})
