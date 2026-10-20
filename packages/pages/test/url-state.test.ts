import { describe, expect, it } from 'vitest'
import { CASH_OUT_PARAMS } from '../src/cash-out/params.ts'
import { defaultValues, defineParams, readParams, shareUrl, writeParams } from '../src/tool/url-state.ts'

const schema = defineParams({
  mode: { kind: 'enum', default: 'a', values: ['a', 'b'] as const },
  amount: { kind: 'number', default: 5000, min: 0, max: 1_000_000 },
  months: { kind: 'number', default: 12, min: 1, max: 360, integer: true },
})

describe('URL state', () => {
  it('writes nothing for the defaults, so the default link is the clean canonical URL', () => {
    expect(writeParams(schema, defaultValues(schema))).toBe('')
    expect(shareUrl('https://hisabkhata.com', '/tools/x', schema, defaultValues(schema))).toBe('https://hisabkhata.com/tools/x')
  })

  it('round-trips every value through the query string', () => {
    const values = { mode: 'b' as const, amount: 12500.5, months: 36 }
    const query = writeParams(schema, values)
    expect(query).toBe('?mode=b&amount=12500.5&months=36')
    const back = readParams(schema, query)
    expect(back.values).toEqual(values)
    expect(back.issues).toEqual([])
    expect(back.present).toEqual(['mode', 'amount', 'months'])
  })

  it('keeps keys in schema order whatever order the values come in', () => {
    expect(writeParams(schema, { months: 24, mode: 'b' })).toBe('?mode=b&months=24')
  })

  it('reads Bangla digits, commas and ৳ in a hand-typed link', () => {
    expect(readParams(schema, '?amount=৳১০,০০০').values.amount).toBe(10000)
  })

  it('falls back to the default and reports bad values', () => {
    const { values, issues } = readParams(schema, '?mode=zzz&amount=abc&months=0.5')
    expect(values).toEqual(defaultValues(schema))
    expect(issues).toEqual([
      { key: 'mode', value: 'zzz', reason: 'unknown-value' },
      { key: 'amount', value: 'abc', reason: 'invalid' },
      { key: 'months', value: '0.5', reason: 'invalid' },
    ])
  })

  it('rejects values outside the bounds', () => {
    const { issues } = readParams(schema, '?amount=-5&months=999')
    expect(issues.map((i) => i.reason)).toEqual(['min', 'max'])
  })

  it('ignores unknown and empty parameters (utm tags, fbclid)', () => {
    const { values, issues, present } = readParams(schema, '?utm_source=fb&fbclid=x&amount=')
    expect(values).toEqual(defaultValues(schema))
    expect(issues).toEqual([])
    expect(present).toEqual([])
  })

  it('leaves out null numbers (an empty field)', () => {
    expect(writeParams(schema, { amount: null as unknown as number, mode: 'b' })).toBe('?mode=b')
  })

  it('cash out: a C1-c link restores mode, amount and the Priyo usage', () => {
    const query = writeParams(CASH_OUT_PARAMS, { mode: 'charge', amount: 10000, used: 45000 })
    expect(query).toBe('?amount=10000&used=45000')
    expect(readParams(CASH_OUT_PARAMS, query).values).toEqual({ mode: 'charge', amount: 10000, used: 45000 })
    expect(readParams(CASH_OUT_PARAMS, '?mode=max').values).toEqual({ mode: 'max', amount: 5000, used: 0 })
  })
})
