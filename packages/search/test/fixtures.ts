import type { MfsChannel } from '@hisab/core/mfs-charge'
import type { AnswerData } from '../src/intent.ts'

// Illustrative tariffs in the shape of data/mfs-charges.json, so the tests do
// not move when the real rates are updated. Not real rates.

const limits = { maxPerDay: 30000, maxPerMonth: 200000 }

export const mfsChannels: MfsChannel[] = [
  { id: 'bkash-agent', provider: 'bkash', service: 'cashOut', channel: 'agent', bands: [{ from: 0, per1000: 18.5 }], limits },
  {
    id: 'bkash-priyo-agent',
    provider: 'bkash',
    service: 'cashOut',
    channel: 'priyoAgent',
    bands: [{ from: 0, per1000: 13.95 }],
    quota: { monthlyAmount: 50000, over: [{ from: 0, per1000: 18.5 }] },
    limits,
  },
  { id: 'bkash-atm', provider: 'bkash', service: 'cashOut', channel: 'atm', bands: [{ from: 0, per1000: 14.9 }], limits },
  { id: 'nagad-app', provider: 'nagad', service: 'cashOut', channel: 'app', bands: [{ from: 0, per1000: 12.99 }], limits },
  { id: 'rocket-agent', provider: 'rocket', service: 'cashOut', channel: 'agent', bands: [{ from: 0, per1000: 16.7 }], limits },
  { id: 'upay-agent', provider: 'upay', service: 'cashOut', channel: 'agent', bands: [{ from: 0, per1000: 14 }], limits },
  {
    id: 'bkash-send-app',
    provider: 'bkash',
    service: 'sendMoney',
    channel: 'app',
    bands: [{ from: 0 }, { from: 100, flat: 5 }],
    limits,
  },
  { id: 'nagad-send-app', provider: 'nagad', service: 'sendMoney', channel: 'app', bands: [{ from: 0 }], limits },
  { id: 'rocket-send-app', provider: 'rocket', service: 'sendMoney', channel: 'app', bands: [{ from: 0, flat: 5 }], limits },
  { id: 'upay-send-app', provider: 'upay', service: 'sendMoney', channel: 'app', bands: [{ from: 0 }], limits },
]

export const answerData: AnswerData = {
  mfsChannels,
  goldPricePerVori: { '22K': 140000, '21K': 133000, '18K': 114000 },
  silverPricePerVori: { '22K': 2500 },
  currencyRates: [
    { code: 'USD', buy: 120, sell: 122 },
    { code: 'SAR', buy: 32 },
  ],
  vatRatePct: 15,
}

export const today = { year: 2026, month: 10, day: 20 }
