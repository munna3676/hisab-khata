import { getPublicKeyAsync, signAsync, verifyAsync } from '@noble/ed25519'

/**
 * The signed data manifest: which data files make up one release, with the
 * SHA-256 of each file's exact bytes. scripts/build-manifest.mjs writes it,
 * scripts/sign-manifest.mjs signs it with Ed25519, and the app's store
 * (store.ts) accepts a release only when the signature and every hash check
 * out. Uses WebCrypto (Node 22, browsers, Android/iOS WebViews) and
 * @noble/ed25519's async API, so no Node or Capacitor import is needed.
 */

export interface ManifestFile {
  /** Lower-case hex SHA-256 of the file's bytes. */
  sha256: string
  bytes: number
}

export interface DataManifest {
  format: 1
  /** Rises with every release; the store never moves to a lower or equal version. */
  version: number
  /** Release date, YYYY-MM-DD. */
  date: string
  /** Path under data/ → hash. */
  files: Record<string, ManifestFile>
}

/** What is published next to the data files (manifest.signed.json). */
export interface SignedManifest {
  /** Names the public key that verifies it, so keys can be rotated. */
  keyId: string
  /** The manifest JSON exactly as signed; parse it only after verifying. */
  manifest: string
  /** Base64 Ed25519 signature over the UTF-8 bytes of `manifest`. */
  signature: string
}

const encoder = new TextEncoder()

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function fromHex(hex: string): Uint8Array {
  if (!/^(?:[0-9a-f]{2})*$/i.test(hex)) throw new Error('not a hex string')
  return Uint8Array.from(hex.match(/../g) ?? [], (h) => parseInt(h, 16))
}

export function toBase64(bytes: Uint8Array): string {
  let text = ''
  for (const b of bytes) text += String.fromCharCode(b)
  return btoa(text)
}

export function fromBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

/** Hex SHA-256 of bytes, or of a string's UTF-8 bytes. */
export async function sha256Hex(data: Uint8Array | string): Promise<string> {
  const bytes = typeof data === 'string' ? encoder.encode(data) : data
  return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>)))
}

/** Short id of a public key: the first 8 bytes of its SHA-256, in hex. */
export async function keyIdOf(publicKey: Uint8Array): Promise<string> {
  return (await sha256Hex(publicKey)).slice(0, 16)
}

/** Signs a manifest (scripts and tests only; the secret key never ships in the app). */
export async function signManifest(manifest: DataManifest, secretKey: Uint8Array): Promise<SignedManifest> {
  const text = JSON.stringify(manifest, null, 2)
  const signature = await signAsync(encoder.encode(text), secretKey)
  return { keyId: await keyIdOf(await getPublicKeyAsync(secretKey)), manifest: text, signature: toBase64(signature) }
}

/**
 * The manifest inside a signed envelope when its signature verifies with the
 * trusted key it names and its shape is right; otherwise a reason. Never
 * throws on hostile input.
 */
export async function openSignedManifest(
  signed: unknown,
  trustedKeys: Readonly<Record<string, Uint8Array>>,
): Promise<{ ok: true; manifest: DataManifest } | { ok: false; reason: string }> {
  if (!isRecord(signed) || typeof signed.keyId !== 'string' || typeof signed.manifest !== 'string' || typeof signed.signature !== 'string') {
    return { ok: false, reason: 'unsigned' }
  }
  const key = Object.hasOwn(trustedKeys, signed.keyId) ? trustedKeys[signed.keyId] : undefined
  if (!key) return { ok: false, reason: 'unknown-key' }
  let verified = false
  try {
    // zip215: false is RFC 8032's stricter check (no non-canonical encodings).
    verified = await verifyAsync(fromBase64(signed.signature), encoder.encode(signed.manifest), key, { zip215: false })
  } catch {
    verified = false
  }
  if (!verified) return { ok: false, reason: 'bad-signature' }
  let manifest: unknown
  try {
    manifest = JSON.parse(signed.manifest)
  } catch {
    return { ok: false, reason: 'bad-manifest' }
  }
  return isManifest(manifest) ? { ok: true, manifest } : { ok: false, reason: 'bad-manifest' }
}

/** Shape check for a parsed manifest (it is signed, but a signed bug must not crash the app). */
export function isManifest(m: unknown): m is DataManifest {
  if (!isRecord(m) || m.format !== 1 || !Number.isSafeInteger(m.version) || (m.version as number) < 0) return false
  if (typeof m.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(m.date) || !isRecord(m.files)) return false
  return Object.entries(m.files).every(
    ([path, f]) =>
      isSafePath(path) && isRecord(f) && typeof f.sha256 === 'string' && /^[0-9a-f]{64}$/.test(f.sha256) && Number.isSafeInteger(f.bytes),
  )
}

/** A relative data path with no '..', no leading '/', no backslash: safe to append to a base URL. */
export function isSafePath(path: string): boolean {
  return /^[a-z0-9][a-z0-9._-]*(\/[a-z0-9][a-z0-9._-]*)*\.json$/.test(path) && !path.split('/').includes('..')
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
