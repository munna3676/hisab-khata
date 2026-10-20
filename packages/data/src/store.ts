import { checkDataFile } from './checks.ts'
import { specFor } from './contract.ts'
import { isSafePath, openSignedManifest, sha256Hex, type DataManifest, type SignedManifest } from './manifest.ts'
import type { DataFileTypes } from './types.ts'

/**
 * The runtime data store the app reads rates from. It starts from the snapshot
 * bundled in the app, and update() moves to a newer release only when every
 * check passes: the manifest is signed by a trusted Ed25519 key, its version
 * is higher, every changed file has the manifest's SHA-256 and passes its
 * schema, bounds and engine rules, and no file the app ships with is missing.
 * The new set is written to the spare storage slot and then made active with
 * one write, so a crash mid-update leaves the last good set in place.
 * Storage and network come in through adapters; nothing here imports
 * Capacitor, the DOM or Node.
 */

/** Persistent string storage: Capacitor Filesystem/Preferences, IndexedDB, or a Map in tests. */
export interface StorageAdapter {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

/** The part of fetch() the store uses. */
export interface FetchResponse {
  ok: boolean
  status: number
  arrayBuffer(): Promise<ArrayBuffer>
}
export type Fetcher = (url: string) => Promise<FetchResponse>

/** A complete, checked set of data files. */
export interface DataSnapshot {
  manifest: DataManifest
  /** Path under data/ → parsed JSON. */
  files: Record<string, unknown>
}

export interface DataStoreOptions {
  /** The snapshot built into the app (scripts/build-manifest.mjs --snapshot). Trusted as is. */
  bundled: DataSnapshot
  /** keyId → Ed25519 public key. Only these keys can sign a release. */
  trustedKeys: Readonly<Record<string, Uint8Array>>
  storage: StorageAdapter
  /** URL of manifest.signed.json. */
  manifestUrl: string
  /** Where data files are served; defaults to the manifest's folder. */
  baseUrl?: string
  fetch?: Fetcher
  /** File check; defaults to checkDataFile (schema + bounds + engine rules). */
  check?: (path: string, data: unknown) => string[]
  /** Largest file accepted, in bytes. Default 2 MB. */
  maxFileBytes?: number
  /** Storage key prefix. Default 'hisab-data'. */
  keyPrefix?: string
}

export type UpdateResult =
  | { status: 'updated'; version: number; changed: string[] }
  | { status: 'current'; version: number }
  | { status: 'offline'; detail: string }
  | { status: 'rejected'; reason: RejectReason; detail?: string }

export type RejectReason =
  | 'unsigned'
  | 'unknown-key'
  | 'bad-signature'
  | 'bad-manifest'
  | 'missing-file'
  | 'download'
  | 'hash'
  | 'invalid'
  | 'storage'

/** What one storage slot holds: the signed manifest and the text of every file not taken from the bundle. */
interface StoredSet {
  signed: SignedManifest
  texts: Record<string, string>
}

type Slot = 'a' | 'b'

class Rejected extends Error {
  readonly reason: RejectReason
  readonly detail: string | undefined
  constructor(reason: RejectReason, detail?: string) {
    super(detail ?? reason)
    this.reason = reason
    this.detail = detail
  }
}

const decoder = new TextDecoder('utf-8', { fatal: true })

export class DataStore {
  private readonly options: DataStoreOptions
  private readonly check: (path: string, data: unknown) => string[]
  private current: DataSnapshot
  /** Texts of the current set's downloaded files (empty while on the bundle). */
  private currentTexts: Record<string, string> = {}
  private activeSlot: Slot | null = null
  private pending: Promise<UpdateResult> | null = null
  private readonly listeners = new Set<(snapshot: DataSnapshot) => void>()

  constructor(options: DataStoreOptions) {
    this.options = options
    this.check = options.check ?? checkDataFile
    this.current = options.bundled
  }

  /** The data in use now. */
  get snapshot(): DataSnapshot {
    return this.current
  }

  get version(): number {
    return this.current.manifest.version
  }

  /** One parsed data file, typed by its path; undefined when the release has no such file. */
  get<P extends keyof DataFileTypes & string>(path: P): DataFileTypes[P] | undefined {
    return this.current.files[path] as DataFileTypes[P] | undefined
  }

  /** Calls `listener` whenever load() or update() switches to another set. Returns an unsubscribe function. */
  subscribe(listener: (snapshot: DataSnapshot) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Picks the newest good set: the active storage slot, else the spare one (the
   * last good set), else the bundle. A stored set is checked again (signature,
   * hashes, schemas) because storage can be corrupted or tampered with, and it
   * is used only when it is newer than the bundle (an app update may ship newer data).
   */
  async load(): Promise<DataSnapshot> {
    const active = await this.readPointer()
    const order: Slot[] = active === 'b' ? ['b', 'a'] : ['a', 'b']
    for (const slot of order) {
      const raw = await this.safeGet(this.slotKey(slot))
      if (!raw) continue
      try {
        const stored = JSON.parse(raw) as StoredSet
        const snapshot = await this.verifySet(stored.signed, stored.texts ?? {}, (path) => {
          throw new Rejected('missing-file', path)
        })
        if (snapshot.manifest.version <= this.options.bundled.manifest.version) continue
        this.activeSlot = slot
        this.currentTexts = stored.texts
        this.swap(snapshot)
        return snapshot
      } catch {
        // A bad slot is skipped; the other slot or the bundle takes over.
      }
    }
    this.activeSlot = null
    this.currentTexts = {}
    this.swap(this.options.bundled)
    return this.current
  }

  /** Looks for a newer signed release and switches to it when it passes every check. Never throws. */
  update(): Promise<UpdateResult> {
    this.pending ??= this.runUpdate().finally(() => {
      this.pending = null
    })
    return this.pending
  }

  private async runUpdate(): Promise<UpdateResult> {
    const fetcher = this.options.fetch ?? ((url: string) => globalThis.fetch(url, { cache: 'no-store' }))
    let signedText: string
    try {
      const res = await fetcher(this.options.manifestUrl)
      if (!res.ok) return { status: 'offline', detail: `manifest HTTP ${res.status}` }
      signedText = decoder.decode(await res.arrayBuffer())
    } catch (e) {
      return { status: 'offline', detail: e instanceof Error ? e.message : String(e) }
    }
    try {
      let signed: unknown
      try {
        signed = JSON.parse(signedText)
      } catch {
        throw new Rejected('unsigned', 'manifest is not JSON')
      }
      const opened = await openSignedManifest(signed, this.options.trustedKeys)
      if (!opened.ok) throw new Rejected(opened.reason as RejectReason)
      if (opened.manifest.version <= this.version) return { status: 'current', version: this.version }

      const texts: Record<string, string> = {}
      const changed: string[] = []
      const snapshot = await this.verifySet(signed as SignedManifest, texts, async (path) => {
        // Not in the bundle with this hash: reuse the current set's copy, or download it.
        const reuse = this.currentTexts[path]
        if (reuse !== undefined && (await sha256Hex(reuse)) === opened.manifest.files[path]!.sha256) {
          texts[path] = reuse
        } else {
          texts[path] = await this.download(path, fetcher)
          changed.push(path)
        }
        return texts[path]!
      })

      const slot: Slot = this.activeSlot === 'a' ? 'b' : 'a'
      try {
        await this.options.storage.set(this.slotKey(slot), JSON.stringify({ signed: signed as SignedManifest, texts } satisfies StoredSet))
        await this.options.storage.set(this.pointerKey(), slot)
      } catch (e) {
        throw new Rejected('storage', e instanceof Error ? e.message : String(e))
      }
      this.activeSlot = slot
      this.currentTexts = texts
      this.swap(snapshot)
      return { status: 'updated', version: snapshot.manifest.version, changed: changed.sort() }
    } catch (e) {
      if (e instanceof Rejected) return { status: 'rejected', reason: e.reason, ...(e.detail ? { detail: e.detail } : {}) }
      return { status: 'rejected', reason: 'invalid', detail: e instanceof Error ? e.message : String(e) }
    }
  }

  /**
   * Checks a signed set and returns its snapshot. Files whose hash matches the
   * bundle come from the bundle; others from `texts`, or from `missing(path)`
   * when absent. Throws Rejected on the first failure.
   */
  private async verifySet(
    signed: SignedManifest,
    texts: Record<string, string>,
    missing: (path: string) => Promise<string> | never,
  ): Promise<DataSnapshot> {
    const opened = await openSignedManifest(signed, this.options.trustedKeys)
    if (!opened.ok) throw new Rejected(opened.reason as RejectReason)
    const { manifest } = opened
    for (const path of Object.keys(this.options.bundled.manifest.files)) {
      if (!Object.hasOwn(manifest.files, path)) throw new Rejected('missing-file', `${path} is not in the release`)
    }
    const files: Record<string, unknown> = {}
    for (const [path, entry] of Object.entries(manifest.files)) {
      if (!specFor(path)?.bundled) throw new Rejected('bad-manifest', `${path} is not a data file the app reads`)
      const bundledEntry = this.options.bundled.manifest.files[path]
      if (bundledEntry?.sha256 === entry.sha256 && Object.hasOwn(this.options.bundled.files, path)) {
        files[path] = this.options.bundled.files[path]
        continue
      }
      const text = Object.hasOwn(texts, path) ? texts[path]! : await missing(path)
      const bytes = new TextEncoder().encode(text)
      if (bytes.length !== entry.bytes || (await sha256Hex(bytes)) !== entry.sha256) throw new Rejected('hash', path)
      let data: unknown
      try {
        data = JSON.parse(text)
      } catch {
        throw new Rejected('invalid', `${path} is not JSON`)
      }
      const errors = this.check(path, data)
      if (errors.length) throw new Rejected('invalid', errors.slice(0, 5).join('; '))
      files[path] = data
    }
    return { manifest, files }
  }

  private async download(path: string, fetcher: Fetcher): Promise<string> {
    if (!isSafePath(path)) throw new Rejected('bad-manifest', `unsafe path ${path}`)
    const base = this.options.baseUrl ?? new URL('./', this.options.manifestUrl).href
    let buffer: ArrayBuffer
    try {
      const res = await fetcher(new URL(path, base).href)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      buffer = await res.arrayBuffer()
    } catch (e) {
      throw new Rejected('download', `${path}: ${e instanceof Error ? e.message : String(e)}`)
    }
    if (buffer.byteLength > (this.options.maxFileBytes ?? 2_000_000)) throw new Rejected('download', `${path} is too large`)
    try {
      return decoder.decode(buffer)
    } catch {
      throw new Rejected('invalid', `${path} is not UTF-8`)
    }
  }

  private swap(snapshot: DataSnapshot): void {
    const changed = snapshot !== this.current
    this.current = snapshot
    if (changed) for (const listener of this.listeners) listener(snapshot)
  }

  private async readPointer(): Promise<Slot | null> {
    const value = await this.safeGet(this.pointerKey())
    return value === 'a' || value === 'b' ? value : null
  }

  private async safeGet(key: string): Promise<string | null> {
    try {
      return await this.options.storage.get(key)
    } catch {
      return null
    }
  }

  private pointerKey(): string {
    return `${this.options.keyPrefix ?? 'hisab-data'}/active`
  }

  private slotKey(slot: Slot): string {
    return `${this.options.keyPrefix ?? 'hisab-data'}/set-${slot}`
  }
}

/** A StorageAdapter over a Map, for tests and for a session-only store. */
export function memoryStorage(map = new Map<string, string>()): StorageAdapter & { map: Map<string, string> } {
  return {
    map,
    get: async (key) => map.get(key) ?? null,
    set: async (key, value) => void map.set(key, value),
    remove: async (key) => void map.delete(key),
  }
}
