// Cash Out: inputs → everything the calculator shows, as plain data (no DOM), so the website,
// the app and the unit tests share one implementation. All arithmetic is @hisab/core mfs-charge.
import {
  calculateMfsCharge,
  calculateMfsCompare,
  calculateMfsCompareMax,
  validateMfsCompare,
  validateMfsCompareMax,
  type MfsChannel,
  type MfsLimitKind,
  type MfsUsage,
} from '@hisab/core/mfs-charge'
import { formatNumberIn, formatTakaIn } from '@hisab/i18n/format'
import type { Lang } from '@hisab/i18n/locale'
import { interpolate, t } from '@hisab/i18n/messages'
import type { CompareBrand, CompareRowState } from '@hisab/ui/base'
import type { ReportErrorItem } from '@hisab/ui/overlay'
import type { ToolError, ToolOutcome } from '../tool/validation.ts'
import { CHANNEL_TEXT, COPY, PROVIDER_NAME, REFERENCE_PHRASE } from './copy.ts'
import { QUOTA_CHANNEL, type CashOutMode } from './params.ts'

export interface CashOutInput {
  lang: Lang
  mode: CashOutMode
  /** Amount to cash out (charge mode) or the wallet balance (max mode); null while the field is empty or not a number. */
  amount: number | null
  /** Taka already taken at the Priyo price this month; null counts as 0. */
  used: number | null
  /** The channels to compare, from data/mfs-charges.json. */
  channels: readonly MfsChannel[]
  /** Channel the saving is measured against (referenceByService.cashOut). */
  referenceId?: string
}

export interface CashOutRow {
  id: string
  provider: string
  brand?: CompareBrand
  /** "DBBL ATM বা ব্রাঞ্চ · ৯.০০/হাজার" */
  method: string
  /** Right column: the charge (charge mode) or what you get (max mode). */
  value: string
  /** Under it: "মোট ৳৫,০৪৫.০০" or "চার্জ ৳৪৪.৬০". */
  sub: string
  state: CompareRowState
  badge?: string
}

export interface CashOutResult {
  mode: CashOutMode
  /** Result card. */
  label: string
  value: number
  decimals?: number
  sub: string[]
  compareTitle: string
  compareColumn: string
  rows: CashOutRow[]
  /** Warn callout above the result (C1-c, Priyo limit). */
  topCallout?: string
  /** Callout under the list. */
  callout: string
  shareText: string
}

const tk = (lang: Lang, value: number, decimals?: number) => formatTakaIn(lang, value, decimals === undefined ? {} : { decimals })
const num = (lang: Lang, value: number, decimals?: number) => formatNumberIn(lang, value, decimals === undefined ? {} : { decimals })
const say = (lang: Lang, text: Record<Lang, string>, vars?: Record<string, string>) => interpolate(lang, text[lang], vars)

export function providerName(lang: Lang, channel: MfsChannel): string {
  return PROVIDER_NAME[channel.provider]?.[lang] ?? channel.provider
}

export function methodName(lang: Lang, channel: MfsChannel): string {
  return CHANNEL_TEXT[channel.id]?.method[lang] ?? channel.channel
}

/** "রকেট, DBBL ATM": the name the result card and share text use. */
export function channelName(lang: Lang, channel: MfsChannel): string {
  const short = CHANNEL_TEXT[channel.id]?.short[lang] ?? channel.channel
  return `${providerName(lang, channel)}, ${short}`
}

const BRANDS: readonly string[] = ['bkash', 'nagad', 'rocket']
const brandOf = (channel: MfsChannel) => (BRANDS.includes(channel.provider) ? (channel.provider as CompareBrand) : undefined)

/** The charge per 1,000 at the channel's normal price (its first band). */
export function per1000(channel: MfsChannel): number {
  return calculateMfsCharge({ amount: 1000, channel }).per1000
}

function usageFor(used: number | null): Record<string, MfsUsage> {
  return used && used > 0 ? { [QUOTA_CHANNEL]: { quotaUsed: used } } : {}
}

function limitError(lang: Lang, kind: MfsLimitKind, allowed: number | null): { error: ToolError; field: string } {
  const max = allowed === null ? '' : tk(lang, allowed)
  if (kind === 'minPerTxn') {
    const message = t(lang, 'validation.min', { min: max })
    return { error: { title: say(lang, COPY.limitTitle), body: message }, field: message }
  }
  const fix = allowed !== null && allowed > 0 ? { label: say(lang, COPY.fixWith, { max }), field: 'amount', value: allowed } : undefined
  if (kind === 'maxPerDay') {
    return {
      error: { title: t(lang, 'validation.dailyLimitTitle'), body: t(lang, 'validation.dailyLimitHint', { max }), fix },
      field: say(lang, COPY.dailyLimitField, { max }),
    }
  }
  const field = say(lang, kind === 'maxPerTxn' ? COPY.txnLimitField : COPY.monthLimitField, { max })
  return { error: { title: say(lang, COPY.limitTitle), body: say(lang, COPY.limitBody, { max }), fix }, field }
}

/** Everything the Cash Out calculator shows for these inputs. */
export function cashOutOutcome(input: CashOutInput): ToolOutcome<CashOutResult> {
  return input.mode === 'max' ? maxOutcome(input) : chargeOutcome(input)
}

function chargeOutcome({ lang, amount, used, channels, referenceId }: CashOutInput): ToolOutcome<CashOutResult> {
  if (amount === null) return { kind: 'empty' }
  const usage = usageFor(used)
  const compareInput = { amount, channels: [...channels], usage, referenceId }
  if (validateMfsCompare(compareInput) !== null) return { kind: 'empty' }
  const r = calculateMfsCompare(compareInput)

  if (r.allOverLimit || !r.cheapest) {
    const first = r.rows.find((row) => row.limit)
    const { error, field } = limitError(lang, first?.limit?.kind ?? 'maxPerDay', r.maxAllowed)
    return { kind: 'error', error, fields: { amount: field } }
  }

  const cheapest = r.cheapest
  const fields: Record<string, string> = {}
  let topCallout: string | undefined
  const priyo = r.rows.find((row) => row.channel.id === QUOTA_CHANNEL)
  if (priyo?.quota?.exceeded && priyo.limit === null) {
    const quota = num(lang, priyo.quota.monthlyAmount)
    fields.used = say(lang, COPY.usedOver, { amount: tk(lang, amount), quota })
    if (priyo.quota.leftBefore > 0) {
      topCallout = say(lang, COPY.quotaCallout, {
        used: tk(lang, priyo.quota.usedBefore),
        amount: tk(lang, amount),
        quota,
        rate: num(lang, priyo.band.per1000 ?? priyo.per1000, 2),
        left: tk(lang, priyo.quota.leftBefore),
      })
    }
  }

  const sub = [say(lang, COPY.youGet, { amount: tk(lang, amount) }), say(lang, COPY.keepInWallet, { amount: tk(lang, cheapest.total) })]
  const reference = REFERENCE_PHRASE[referenceId ?? '']?.[lang]
  if (r.savingVsReference !== null && r.savingVsReference > 0 && reference) {
    sub.push(say(lang, COPY.lessThan, { reference, amount: tk(lang, r.savingVsReference) }))
  }

  const rows: CashOutRow[] = r.rows.map((row) => {
    const overQuota = row.quota?.exceeded === true
    const rate = num(lang, row.band.per1000 ?? row.per1000, 2)
    const state: CompareRowState = row === cheapest ? 'best' : row.limit || overQuota ? 'warning' : 'default'
    return {
      id: row.channel.id,
      provider: providerName(lang, row.channel),
      brand: brandOf(row.channel),
      method: `${methodName(lang, row.channel)} · ${say(lang, overQuota ? COPY.overQuota : COPY.perThousand, { rate })}`,
      value: tk(lang, row.charge, 2),
      sub: say(lang, COPY.total, { amount: tk(lang, row.total, 2) }),
      state,
      badge: state === 'best' ? say(lang, COPY.cheapest) : state === 'warning' ? say(lang, COPY.overLimit) : undefined,
    }
  })

  const name = channelName(lang, cheapest.channel)
  return {
    kind: 'result',
    fields,
    result: {
      mode: 'charge',
      label: t(lang, 'result.cheapestIs', { name }),
      value: cheapest.charge,
      decimals: 2,
      sub,
      compareTitle: say(lang, COPY.compareCharge),
      compareColumn: say(lang, COPY.compareChargeColumn),
      rows,
      topCallout,
      callout: say(lang, COPY.calloutCharge),
      shareText: say(lang, COPY.shareText, { amount: tk(lang, amount), charge: tk(lang, cheapest.charge, 2), name }),
    },
  }
}

function maxOutcome({ lang, amount: balance, used, channels }: CashOutInput): ToolOutcome<CashOutResult> {
  if (balance === null) return { kind: 'empty' }
  const usage = usageFor(used)
  const input = { balance, channels: [...channels], usage }
  if (validateMfsCompareMax(input) !== null) return { kind: 'empty' }
  const r = calculateMfsCompareMax(input)
  const best = r.best
  if (!best) {
    return { kind: 'error', error: { title: say(lang, COPY.noBalanceTitle), body: say(lang, COPY.noBalanceBody) } }
  }
  const sub = [say(lang, COPY.charge, { amount: tk(lang, best.charge, 2) }), say(lang, COPY.leftInWallet, { amount: tk(lang, best.leftover, 2) })]
  // A limit, not the balance, capped it: say which (an info line, not a field error).
  if (best.limitedBy === 'maxPerDay' || best.limitedBy === 'maxPerTxn' || best.limitedBy === 'maxPerMonth') {
    sub.push(limitError(lang, best.limitedBy, best.amount).field)
  }

  const rows: CashOutRow[] = r.rows.map((row) => {
    const usageOf = usage[row.channel.id]
    const band = row.amount > 0 ? calculateMfsCharge({ amount: row.amount, channel: row.channel, usage: usageOf }).band : row.channel.bands[0]!
    const rate = num(lang, band.per1000 ?? 0, 2)
    const overQuota = row.quota?.exceeded === true && row.amount > 0
    const state: CompareRowState = row === best ? 'best' : row.amount === 0 ? 'warning' : 'default'
    return {
      id: row.channel.id,
      provider: providerName(lang, row.channel),
      brand: brandOf(row.channel),
      method: `${methodName(lang, row.channel)} · ${say(lang, overQuota ? COPY.overQuota : COPY.perThousand, { rate })}`,
      value: tk(lang, row.amount),
      sub: say(lang, COPY.charge, { amount: tk(lang, row.charge, 2) }),
      state,
      badge: state === 'best' ? say(lang, COPY.cheapest) : state === 'warning' ? say(lang, COPY.overLimit) : undefined,
    }
  })

  const name = channelName(lang, best.channel)
  return {
    kind: 'result',
    result: {
      mode: 'max',
      label: say(lang, COPY.bestMax, { name }),
      value: best.amount,
      sub,
      compareTitle: say(lang, COPY.compareMax),
      compareColumn: say(lang, COPY.compareMaxColumn),
      rows,
      callout: say(lang, COPY.calloutMax),
      shareText: say(lang, COPY.shareTextMax, { amount: tk(lang, balance), best: tk(lang, best.amount), name }),
    },
  }
}

/** The "ভুল পেলেন?" list: one entry per channel with its price per 1,000. */
export function reportItems(lang: Lang, channels: readonly MfsChannel[]): ReportErrorItem[] {
  return channels.map((channel) => ({
    value: channel.id,
    label: say(lang, COPY.reportItem, {
      provider: providerName(lang, channel),
      method: methodName(lang, channel),
      rate: tk(lang, per1000(channel), 2),
    }),
  }))
}
