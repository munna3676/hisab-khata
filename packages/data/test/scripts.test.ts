/// <reference types="node" />
import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { utils } from '@noble/ed25519'
import { keyIdOf, openSignedManifest, publicKeyOf, sha256Hex, toHex, type DataManifest } from '../src/manifest.ts'

const repo = new URL('../../../', import.meta.url).pathname
const tmp = mkdtempSync(join(tmpdir(), 'hisab-data-'))
afterAll(() => rmSync(tmp, { recursive: true, force: true }))

const run = (script: string, args: string[], env: Record<string, string> = {}) => {
  const r = spawnSync('node', [`scripts/${script}`, ...args], { cwd: repo, encoding: 'utf8', env: { ...process.env, ...env } })
  return { code: r.status, out: r.stdout, err: r.stderr }
}

/** A copy of data/ to change freely. */
const copyData = (name: string) => {
  const dir = join(tmp, name)
  cpSync(join(repo, 'data'), dir, { recursive: true })
  return dir
}
const editJson = (dir: string, path: string, edit: (data: any) => void) => {
  const data = JSON.parse(readFileSync(join(dir, path), 'utf8'))
  edit(data)
  writeFileSync(join(dir, path), JSON.stringify(data, null, 2) + '\n')
}

describe('scripts/check-data.mjs', () => {
  it('passes the repo data with --allow-unverified and fails without it', () => {
    const allowed = run('check-data.mjs', ['--allow-unverified', '--today=2026-10-20'])
    expect(allowed.code, allowed.err).toBe(0)
    expect(allowed.out).toMatch(/0 errors/)
    const strict = run('check-data.mjs', ['--today=2026-10-20'])
    expect(strict.code).toBe(1)
    expect(strict.err).toMatch(/mfs-charges\.json:\/channels\/0 is unverified/)
  })
  it('warns after 60 days and fails after 120 for a verified Fact', () => {
    const dir = copyData('stale')
    editJson(dir, 'finance/loan-dbr.json', (f) => {
      f.checked = '2026-08-01'
      delete f.note
    })
    const warn = run('check-data.mjs', [`--root=${dir}`, '--allow-unverified', '--today=2026-10-20'])
    expect(warn.code, warn.err).toBe(0)
    expect(warn.err).toMatch(/STALE {7}finance\/loan-dbr\.json:\/ checked 80 days ago/)
    const fail = run('check-data.mjs', [`--root=${dir}`, '--allow-unverified', '--today=2026-12-10'])
    expect(fail.code).toBe(1)
    expect(fail.err).toMatch(/finance\/loan-dbr\.json:\/ checked 131 days ago \(2026-08-01\), over 120/)
  })
  it('fails on schema errors, bounds, unknown files and missing registry files', () => {
    const dir = copyData('broken')
    editJson(dir, 'mfs-charges.json', (f) => {
      f.channels[0].value.bands[0].per1000 = 75
    })
    editJson(dir, 'religion/zakat.json', (f) => {
      f.value.ratePct = 'two and a half'
    })
    writeFileSync(join(dir, 'stray.json'), '{}')
    rmSync(join(dir, 'gold/bajus-rates.json'))
    const r = run('check-data.mjs', [`--root=${dir}`, '--allow-unverified', '--today=2026-10-20'])
    expect(r.code).toBe(1)
    expect(r.err).toMatch(/mfs-charges\.json: channels\/0\/value\/bands\/0\/per1000 = 75 is outside 0…50/)
    expect(r.err).toMatch(/religion\/zakat\.json: \/value\/ratePct must be number/)
    expect(r.err).toMatch(/stray\.json: not in the data contract/)
    expect(r.err).toMatch(/registry: home reads data\/gold\/bajus-rates\.json, which does not exist/)
  })
  it('rejects a bad --today', () => {
    expect(run('check-data.mjs', ['--today=yesterday']).code).toBe(1)
  })
})

describe('scripts/build-manifest.mjs and sign-manifest.mjs', () => {
  it('hashes every bundled file, and the signature verifies with the public key', async () => {
    const out = join(tmp, 'release')
    const built = run('build-manifest.mjs', [`--out=${out}/manifest.json`, '--version=7', '--date=2026-10-20', `--snapshot=${out}/snapshot.json`])
    expect(built.code, built.err).toBe(0)
    const manifest = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8')) as DataManifest
    expect(manifest).toMatchObject({ format: 1, version: 7, date: '2026-10-20' })
    expect(manifest.files['registry/tools.json']).toBeUndefined()
    const bytes = readFileSync(join(repo, 'data/mfs-charges.json'))
    expect(manifest.files['mfs-charges.json']).toEqual({ sha256: await sha256Hex(new Uint8Array(bytes)), bytes: bytes.length })
    const snapshot = JSON.parse(readFileSync(join(out, 'snapshot.json'), 'utf8'))
    expect(Object.keys(snapshot.files).sort()).toEqual(Object.keys(manifest.files).sort())

    // A throwaway key pair, only for this test.
    const secretKey = utils.randomSecretKey()
    const publicKey = await publicKeyOf(secretKey)
    const signedRun = run('sign-manifest.mjs', [`--in=${out}/manifest.json`, `--out=${out}/manifest.signed.json`], {
      HISAB_DATA_SIGNING_KEY: toHex(secretKey),
    })
    expect(signedRun.code, signedRun.err).toBe(0)
    const signed = JSON.parse(readFileSync(join(out, 'manifest.signed.json'), 'utf8'))
    const keyId = await keyIdOf(publicKey)
    expect(signed.keyId).toBe(keyId)
    const opened = await openSignedManifest(signed, { [keyId]: publicKey })
    expect(opened).toEqual({ ok: true, manifest })

    const pub = run('sign-manifest.mjs', ['--public-key'], { HISAB_DATA_SIGNING_KEY: Buffer.from(secretKey).toString('base64') })
    expect(JSON.parse(pub.out)).toEqual({ keyId, publicKey: toHex(publicKey) })
  })
  it('refuses to build from invalid data, and to sign without a key', () => {
    const dir = copyData('invalid-release')
    editJson(dir, 'finance/excise-duty.json', (f) => {
      f.value[0].duty = -1
    })
    const r = run('build-manifest.mjs', [`--data=${dir}`, `--out=${join(tmp, 'never/manifest.json')}`])
    expect(r.code).toBe(1)
    expect(r.err).toMatch(/finance\/excise-duty\.json/)
    const env = { ...process.env }
    delete env.HISAB_DATA_SIGNING_KEY
    const unsigned = spawnSync('node', ['scripts/sign-manifest.mjs'], { cwd: repo, encoding: 'utf8', env })
    expect(unsigned.status).toBe(1)
  })
})

describe('scripts/changelog.mjs', () => {
  it('lists changed, added and removed Facts between two folders, keyed by id', () => {
    const before = copyData('before')
    const after = copyData('after')
    editJson(after, 'mfs-charges.json', (f) => {
      f.channels.find((c: any) => c.value.id === 'bkash-agent').value.bands[0].per1000 = 17.5
      f.channels = f.channels.filter((c: any) => c.value.id !== 'upay-atm')
    })
    editJson(after, 'finance/excise-duty.json', (f) => {
      f.value[0].upTo = 450000
    })
    editJson(after, 'finance/loan-dbr.json', (f) => {
      f.checked = '2026-10-19' // re-verified, value unchanged: not a change
    })
    const r = run('changelog.mjs', [`--from=${before}`, `--to=${after}`, '--date=2026-10-20'])
    expect(r.code, r.err).toBe(0)
    const entries = JSON.parse(r.out)
    expect(entries.map((e: any) => e.key)).toEqual([
      'finance/excise-duty.json',
      'mfs-charges.json#channels/bkash-agent',
      'mfs-charges.json#channels/upay-atm',
    ])
    expect(entries[1]).toMatchObject({ source: 'https://www.bkash.com/en/help/fees-and-charges', date: '2026-10-20' })
    expect(entries[1].old.bands[0].per1000).toBe(18.5)
    expect(entries[1].new.bands[0].per1000).toBe(17.5)
    expect(entries[2].new).toBeNull()
  })
  it('--write adds the entries to the top of a change log that passes its schema', async () => {
    const before = copyData('log-before')
    const after = copyData('log-after')
    editJson(after, 'religion/fitra.json', (f) => {
      f.value.items[0].perPerson = 115
    })
    writeFileSync(join(tmp, 'changelog.json'), JSON.stringify({ entries: [{ key: 'old', old: 1, new: 2, source: null, date: '2026-01-01' }] }))
    const r = run('changelog.mjs', [`--from=${before}`, `--to=${after}`, '--date=2026-10-20', `--write=${join(tmp, 'changelog.json')}`])
    expect(r.code, r.err).toBe(0)
    const log = JSON.parse(readFileSync(join(tmp, 'changelog.json'), 'utf8'))
    expect(log.entries.map((e: any) => e.key)).toEqual(['religion/fitra.json', 'old'])
    const { checkDataFile } = await import('../src/checks.ts')
    expect(checkDataFile('changelog.json', log)).toEqual([])
  })
})

describe('scripts/check-data.mjs dates', () => {
  it('rejects a checked date or --today that is not on the calendar (2026-02-31 is not March 3)', () => {
    const dir = copyData('bad-date')
    editJson(dir, 'finance/loan-dbr.json', (f) => {
      f.checked = '2026-02-31'
      delete f.note
    })
    const r = run('check-data.mjs', [`--root=${dir}`, '--allow-unverified', '--today=2026-10-20'])
    expect(r.code).toBe(1)
    expect(r.err).toMatch(/finance\/loan-dbr\.json:\/ has a bad checked date: 2026-02-31/)
    for (const today of ['2026-02-31', '2026-13-01', '2026', '']) expect(run('check-data.mjs', ['--allow-unverified', `--today=${today}`]).code).toBe(1)
  })
  it('fails a Fact checked in the future', () => {
    const dir = copyData('future')
    editJson(dir, 'finance/loan-dbr.json', (f) => {
      f.checked = '2026-10-21'
      delete f.note
    })
    const r = run('check-data.mjs', [`--root=${dir}`, '--allow-unverified', '--today=2026-10-20'])
    expect(r.code).toBe(1)
    expect(r.err).toMatch(/checked in the future/)
  })
})

describe('scripts/changelog.mjs arguments', () => {
  it('refuses a --from that git would read as an option', () => {
    const r = run('changelog.mjs', ['--from=--output=/tmp/x'])
    expect(r.code).not.toBe(0)
    expect(r.err).toMatch(/not a folder or git ref: --output=\/tmp\/x/)
  })
})

describe('scripts/sign-manifest.mjs keys', () => {
  it('refuses a key that is not 32 bytes', () => {
    const r = run('sign-manifest.mjs', ['--public-key'], { HISAB_DATA_SIGNING_KEY: toHex(new Uint8Array(16)) })
    expect(r.code).toBe(1)
    expect(r.err).toMatch(/must be 32 bytes/)
  })
})
