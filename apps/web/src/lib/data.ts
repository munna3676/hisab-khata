// Build-time access to data/ for pages: every file is checked with @hisab/data's checkDataFile
// (JSON Schema, sanity bounds, engine rules) before a page may use it, so a bad data edit fails
// the build instead of shipping wrong numbers.
import { checkDataFile } from '@hisab/data/checks'
import type { DataFileTypes } from '@hisab/data/types'

const FILES = import.meta.glob<{ default: unknown }>(['../../../../data/*.json', '../../../../data/*/*.json', '!../../../../data/_schema/**'], {
  eager: true,
})

const cache = new Map<string, unknown>()

/** A data file by its path under data/ ('mfs-charges.json', 'finance/loan-dbr.json'), validated. */
export function dataFile<P extends keyof DataFileTypes & string>(path: P): DataFileTypes[P] {
  if (cache.has(path)) return cache.get(path) as DataFileTypes[P]
  const mod = FILES[`../../../../data/${path}`]
  if (!mod) throw new Error(`data: no file data/${path}`)
  const errors = checkDataFile(path, mod.default)
  if (errors.length) throw new Error(`data/${path} failed its checks:\n${errors.join('\n')}`)
  cache.set(path, mod.default)
  return mod.default as DataFileTypes[P]
}
