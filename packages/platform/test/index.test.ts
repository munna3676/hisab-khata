import { afterEach, describe, expect, it, vi } from 'vitest'
import { getPlatform, isNativePlatform, setPlatform, usePlugins } from '../src/index.ts'
import type { CapacitorPlugins } from '../src/capacitor.ts'

const g = globalThis as { Capacitor?: unknown }

afterEach(() => {
  delete g.Capacitor
  setPlatform(undefined)
  vi.restoreAllMocks()
})

describe('getPlatform', () => {
  it('is the web platform in a browser, created once', () => {
    expect(isNativePlatform()).toBe(false)
    expect(getPlatform().kind).toBe('web')
    expect(getPlatform()).toBe(getPlatform())
  })

  it('is the Capacitor platform inside the app once plugins are registered', () => {
    g.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android' }
    usePlugins({} as CapacitorPlugins)
    expect(isNativePlatform()).toBe(true)
    expect(getPlatform().kind).toBe('android')
  })

  it('falls back to the web platform inside the app without plugins', () => {
    g.Capacitor = { isNativePlatform: () => true }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    usePlugins(undefined as unknown as CapacitorPlugins)
    expect(getPlatform().kind).toBe('web')
    expect(warn).toHaveBeenCalledOnce()
  })
})
