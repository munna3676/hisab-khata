// Signs a data manifest with Ed25519 so the app's store (packages/data/src/store.ts)
// accepts it. The 32-byte secret key comes from the environment, as hex or base64:
//   HISAB_DATA_SIGNING_KEY=<secret> node scripts/sign-manifest.mjs \
//     [--in=packages/data/dist/manifest.json] [--out=packages/data/dist/manifest.signed.json]
//   HISAB_DATA_SIGNING_KEY=<secret> node scripts/sign-manifest.mjs --public-key
//     prints the keyId and public key (hex) to build into the app's trustedKeys.
// The key lives only in CI secrets; tests make a throwaway pair of their own.
import { readFileSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { fromBase64, fromHex, isManifest, keyIdOf, publicKeyOf, signManifest, toHex } from '../packages/data/src/manifest.ts'

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3)
const repo = new URL('../', import.meta.url).pathname

const raw = process.env.HISAB_DATA_SIGNING_KEY?.trim()
if (!raw) {
  console.error('ERROR  HISAB_DATA_SIGNING_KEY is not set (32-byte Ed25519 secret key, hex or base64)')
  process.exit(1)
}
const secretKey = /^[0-9a-f]{64}$/i.test(raw) ? fromHex(raw) : fromBase64(raw)
if (secretKey.length !== 32) {
  console.error('ERROR  HISAB_DATA_SIGNING_KEY must be 32 bytes')
  process.exit(1)
}

if (process.argv.includes('--public-key')) {
  const publicKey = await publicKeyOf(secretKey)
  console.log(JSON.stringify({ keyId: await keyIdOf(publicKey), publicKey: toHex(publicKey) }))
  process.exit(0)
}

const input = resolve(repo, arg('in') ?? 'packages/data/dist/manifest.json')
const output = resolve(repo, arg('out') ?? 'packages/data/dist/manifest.signed.json')
const manifest = JSON.parse(readFileSync(input, 'utf8'))
if (!isManifest(manifest)) {
  console.error(`ERROR  ${relative(repo, input)} is not a data manifest`)
  process.exit(1)
}
const signed = await signManifest(manifest, secretKey)
writeFileSync(output, JSON.stringify(signed, null, 2) + '\n')
console.log(`signed version ${manifest.version} with key ${signed.keyId} → ${relative(repo, output)}`)
