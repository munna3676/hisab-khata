import { round } from './lib/money.ts'
import {
  calculateMfsCompare,
  isValidMfsChannel,
  type MfsChannel,
  type MfsChargeResult,
  type MfsService,
  type MfsUsage,
} from './mfs-charge.ts'

/**
 * The "বিকাশ vs নগদ vs রকেট" screen (F4): every provider's channels for one
 * kind of transaction, ranked by charge for the person's amount, plus the
 * per-1,000 table with the cheapest cell of each row marked. All rates,
 * quotas and limits come from data/mfs-charges.json via mfs-charge.ts.
 */

// ---- Ranking: "নিজের টাকার পরিমাণে হিসাব করো" ----

export interface MfsRankingInput {
  /** Taka to cash out, send or pay. */
  amount: number
  /** Which transaction to compare; channels of other services are left out. */
  service: MfsService
  /** Every channel from data, in the data's order (ties keep this order). */
  channels: MfsChannel[]
  /** Usage by channel id, for quotas and limits. */
  usage?: Readonly<Record<string, MfsUsage>>
  /** Only these providers, e.g. ["bkash", "nagad", "rocket"]; all when left out. */
  providers?: string[]
}

export interface MfsRankingRow extends MfsChargeResult {
  channel: MfsChannel
  /** 1 for the cheapest; rows over a limit carry null. */
  rank: number | null
  /** No charge at all for this amount (প্রিয় নম্বরে ফ্রি, অ্যাপে ফ্রি). */
  free: boolean
  /**
   * Taka still free this month after this transaction, for a channel whose
   * quota price is free (bKash Priyo numbers: ৳২৫,০০০); null otherwise.
   */
  freeQuotaLeft: number | null
}

export interface MfsProviderBest {
  provider: string
  /** The provider's cheapest channel within its limits, or its first row when all are over a limit. */
  best: MfsRankingRow
  /** 1 for the cheapest provider; null when every channel of this provider is over a limit. */
  rank: number | null
  /** Taka more than the cheapest provider pays; 0 for the cheapest, null when over a limit. */
  moreThanCheapest: number | null
}

export interface MfsRankingResult {
  amount: number
  /** Cheapest first; rows over a limit go last. */
  rows: MfsRankingRow[]
  /** One line per provider, cheapest first. */
  providers: MfsProviderBest[]
  /** The cheapest row within its limits (সবুজ), or null when every row is over a limit. */
  cheapest: MfsRankingRow | null
  /** Most expensive allowed charge − cheapest charge: the most the person can save by choosing. */
  spread: number | null
  allOverLimit: boolean
  /** When all are over a limit, the largest amount any channel allows now. */
  maxAllowed: number | null
}

export type MfsRankingError = 'amount' | 'service' | 'channels' | 'usage'

function channelsFor(input: Pick<MfsRankingInput, 'service' | 'channels' | 'providers'>): MfsChannel[] {
  return input.channels.filter(
    (c) => c.service === input.service && (!input.providers || input.providers.includes(c.provider)),
  )
}

function isUsage(u: MfsUsage): boolean {
  return [u.quotaUsed, u.today, u.thisMonth].every((v) => v === undefined || (v >= 0 && Number.isFinite(v)))
}

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateMfsRanking(input: MfsRankingInput): MfsRankingError | null {
  if (!(Number.isFinite(input.amount) && round(input.amount) > 0)) return 'amount'
  if (!input.channels.every(isValidMfsChannel)) return 'channels'
  if (channelsFor(input).length === 0) return 'service'
  if (input.usage && !Object.values(input.usage).every(isUsage)) return 'usage'
  return null
}

/** Free quota left after this amount, when the in-quota price is free. */
function freeQuotaLeft(row: MfsChargeResult, channel: MfsChannel): number | null {
  if (!row.quota || !channel.bands.every((b) => !b.per1000 && !b.pct && !b.flat && !b.min)) return null
  return row.quota.leftAfter
}

/** Ranks charges given cheapest first: equal charges share a rank and the next one skips (1, 1, 3). */
function competitionRank(): (charge: number) => number {
  let seen = 0
  let last = Number.NaN
  let rank = 0
  return (charge) => {
    seen++
    if (charge !== last) rank = seen
    last = charge
    return rank
  }
}

/** Ranks every channel of one service for the amount, and each provider by its cheapest channel. */
export function calculateMfsRanking(input: MfsRankingInput): MfsRankingResult {
  const compared = calculateMfsCompare({ amount: input.amount, channels: channelsFor(input), usage: input.usage })

  // Equal charges share a rank (1, 1, 3): two free channels are both the cheapest.
  const rankOf = competitionRank()
  const rows = compared.rows.map(
    (r): MfsRankingRow => ({
      ...r,
      rank: r.limit === null ? rankOf(r.charge) : null,
      free: r.charge === 0,
      freeQuotaLeft: freeQuotaLeft(r, r.channel),
    }),
  )
  const cheapest = rows.find((r) => r.rank !== null) ?? null

  // Rows are already cheapest first, so a provider's first row is its best.
  const seen = new Map<string, MfsRankingRow>()
  for (const r of rows) if (!seen.has(r.channel.provider)) seen.set(r.channel.provider, r)
  const providerRankOf = competitionRank()
  const providers = [...seen.values()].map(
    (best): MfsProviderBest => ({
      provider: best.channel.provider,
      best,
      rank: best.limit === null ? providerRankOf(best.charge) : null,
      moreThanCheapest: best.limit === null && cheapest ? round(best.charge - cheapest.charge) : null,
    }),
  )

  const allowed = rows.filter((r) => r.rank !== null)
  return {
    amount: round(input.amount),
    rows,
    providers,
    cheapest,
    spread: cheapest ? round(allowed[allowed.length - 1]!.charge - cheapest.charge) : null,
    allOverLimit: compared.allOverLimit,
    maxAllowed: compared.maxAllowed,
  }
}

// ---- The per-1,000 table: rows of like channels, one column per provider ----

/** One table row: which channel each provider uses for it, e.g. "এজেন্ট ক্যাশ আউট (কম রেট)". */
export interface MfsTableRowSpec {
  id: string
  /** Channel id by provider; a provider without one shows an empty cell. */
  channels: Readonly<Record<string, string>>
}

export interface MfsTableInput {
  /** Taka to price each cell at; the screen uses 1,000 ("চার্জ প্রতি ১,০০০ টাকায়"). */
  amount: number
  /** Column order, e.g. ["bkash", "nagad", "rocket"]. */
  providers: string[]
  rows: MfsTableRowSpec[]
  channels: MfsChannel[]
  usage?: Readonly<Record<string, MfsUsage>>
}

export interface MfsTableCell {
  provider: string
  /** Null when this provider has no channel for the row. */
  result: (MfsChargeResult & { channel: MfsChannel }) | null
  /** Cheapest allowed cell in its row (সবুজ); every tied cell is marked. */
  cheapest: boolean
}

export interface MfsTableRow {
  id: string
  cells: MfsTableCell[]
}

export type MfsTableError = 'amount' | 'providers' | 'rows' | 'channels' | 'usage'

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateMfsTable(input: MfsTableInput): MfsTableError | null {
  if (!(Number.isFinite(input.amount) && round(input.amount) > 0)) return 'amount'
  if (input.providers.length === 0 || new Set(input.providers).size !== input.providers.length) return 'providers'
  if (!input.channels.every(isValidMfsChannel)) return 'channels'
  const ids = new Map(input.channels.map((c) => [c.id, c]))
  const rowsOk = input.rows.every((row) =>
    Object.entries(row.channels).every(([p, id]) => ids.get(id)?.provider === p && input.providers.includes(p)),
  )
  if (input.rows.length === 0 || !rowsOk) return 'rows'
  if (input.usage && !Object.values(input.usage).every(isUsage)) return 'usage'
  return null
}

/** Prices each row's channels at `amount` and marks the cheapest cell of each row. */
export function calculateMfsTable(input: MfsTableInput): MfsTableRow[] {
  const byId = new Map(input.channels.map((c) => [c.id, c]))
  return input.rows.map((spec) => {
    const present = input.providers.flatMap((p) => {
      const channel = byId.get(spec.channels[p] ?? '')
      return channel ? [channel] : []
    })
    const compared = present.length
      ? calculateMfsCompare({ amount: input.amount, channels: present, usage: input.usage }).rows
      : []
    const low = compared.find((r) => r.limit === null)?.charge
    const cells = input.providers.map((provider): MfsTableCell => {
      const result = compared.find((r) => r.channel.provider === provider) ?? null
      return { provider, result, cheapest: !!result && result.limit === null && result.charge === low }
    })
    return { id: spec.id, cells }
  })
}
