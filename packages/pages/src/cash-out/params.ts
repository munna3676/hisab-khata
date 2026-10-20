import { defineParams } from '../tool/url-state.ts'

/** The Cash Out inputs as they appear in a share link: /tools/cash-out?mode=max&amount=5000&used=45000. */
export const CASH_OUT_PARAMS = defineParams({
  /** তুললে চার্জ কত (charge) or কত তোলা যাবে (max). */
  mode: { kind: 'enum', default: 'charge', values: ['charge', 'max'] as const },
  /** The amount to cash out, or the wallet balance in "max" mode. Figma example: ৫০০০. */
  amount: { kind: 'number', default: 5000, min: 0, max: 100_000_000 },
  /** Taka already taken at the Priyo Agent price this month. */
  used: { kind: 'number', default: 0, min: 0, max: 100_000_000 },
})

export type CashOutMode = 'charge' | 'max'

/** Quick-amount chips (Figma "quick amounts"). */
export const QUICK_AMOUNTS = [1000, 5000, 10000, 25000] as const

/**
 * The seven ways Figma compares ("৭টা উপায়"), in Figma's order, which also breaks ties between
 * equal charges (C1-c lists the over-limit Priyo row before the ordinary agent). data/mfs-charges.json
 * also lists Nagad ATM and Upay, which the design does not show yet (docs/open-items.md).
 */
export const CASH_OUT_CHANNELS = [
  'rocket-atm',
  'nagad-app',
  'bkash-priyo-agent',
  'bkash-atm',
  'nagad-ussd',
  'rocket-agent',
  'bkash-agent',
] as const

/** The channel whose monthly quota the "আগে তুলেছ" field feeds. */
export const QUOTA_CHANNEL = 'bkash-priyo-agent'
