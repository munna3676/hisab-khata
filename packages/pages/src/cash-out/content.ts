// Cash Out page content around the calculator: tips (Figma "চার্জ কমানোর ৪টা উপায়") and the FAQ,
// with every number read from data/mfs-charges.json.
import type { MfsChannel } from '@hisab/core/mfs-charge'
import type { MfsChargesFile } from '@hisab/data/types'
import { formatNumberIn } from '@hisab/i18n/format'
import type { Lang } from '@hisab/i18n/locale'
import { interpolate, t } from '@hisab/i18n/messages'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { dataStatus } from '../tool/verification.ts'
import { COPY } from './copy.ts'
import { localize } from '../tool/text.ts'
import { channelName, per1000 } from './model.ts'
import { CASH_OUT_CHANNELS, QUOTA_CHANNEL } from './params.ts'

export const CASH_OUT_ID = 'cash-out'

/** The @hisab/i18n keys the Cash Out island uses besides the template's (for islandText). */
export const CASH_OUT_MESSAGE_KEYS = ['result.cheapestIs', 'validation.dailyLimitTitle', 'validation.dailyLimitHint'] as const

/** The channels this page compares, in CASH_OUT_CHANNELS order, from the validated data file. */
export function cashOutChannels(file: MfsChargesFile): MfsChannel[] {
  const wanted: readonly string[] = CASH_OUT_CHANNELS
  const channels = file.channels
    .map((c) => c.value)
    .filter((c) => c.service === 'cashOut' && wanted.includes(c.id))
    .sort((a, b) => wanted.indexOf(a.id) - wanted.indexOf(b.id))
  const missing = CASH_OUT_CHANNELS.filter((id) => !channels.some((c) => c.id === id))
  if (missing.length) throw new Error(`cash-out: data/mfs-charges.json has no channel ${missing.join(', ')}`)
  return channels
}

function find(channels: readonly MfsChannel[], id: string): MfsChannel {
  const channel = channels.find((c) => c.id === id)
  if (!channel) throw new Error(`cash-out: no channel '${id}'`)
  return channel
}

/** "৯" for 9, "১৩.৯৫" for 13.95: rates as Figma writes them in prose. */
const rate = (lang: Lang, value: number) => formatNumberIn(lang, value, Number.isInteger(value) ? {} : { decimals: 2 })

export function cashOutContent(lang: Lang, file: MfsChargesFile): ToolPageContent {
  const channels = cashOutChannels(file)
  const facts = file.channels.filter((c) => channels.includes(c.value))
  const p = (id: string) => per1000(find(channels, id))
  const priyo = find(channels, QUOTA_CHANNEL)
  const quota = formatNumberIn(lang, priyo.quota?.monthlyAmount ?? 0)
  const cheapest = [...channels].sort((a, b) => per1000(a) - per1000(b))
  const first = cheapest[0]!
  const second = cheapest[1]!
  const saving = p('bkash-agent') - p(QUOTA_CHANNEL)
  const appSaving = p('nagad-ussd') - p('nagad-app')
  const appWhole = Math.floor(appSaving)
  const dayLimit = priyo.limits?.maxPerDay
  const bn = lang === 'bn'
  const copy = localize(COPY, lang)
  const fill = (text: string, vars: Record<string, string>) => interpolate(lang, text, vars)

  const steps = [
    {
      title: bn ? 'বিকাশে প্রিয় এজেন্ট সেট করো।' : 'Set a Priyo agent in bKash.',
      body: fill(bn ? 'প্রতি হাজারে {saving} টাকা বাঁচে, মাসে {quota} টাকা পর্যন্ত।' : 'Saves {saving} taka per thousand, up to {quota} taka a month.', {
        saving: rate(lang, saving),
        quota,
      }),
    },
    {
      title: bn ? 'বড় অঙ্ক ATM থেকে তোলো।' : 'Take large amounts from an ATM.',
      body: fill(bn ? '{name} সবচেয়ে সস্তা, প্রতি হাজারে {rate} টাকা।' : '{name} is the cheapest, {rate} taka per thousand.', {
        name: channelName(copy, first).replace(', ', bn ? 'ের ' : "'s "),
        rate: rate(lang, per1000(first)),
      }),
    },
    {
      title: bn ? 'নগদে USSD না, অ্যাপ ব্যবহার করো।' : 'In Nagad, use the app, not USSD.',
      body: fill(
        bn
          ? appSaving > appWhole
            ? 'অ্যাপে প্রতি হাজারে {n} টাকার বেশি কম।'
            : 'অ্যাপে প্রতি হাজারে {n} টাকা কম।'
          : appSaving > appWhole
            ? 'The app is more than {n} taka cheaper per thousand.'
            : 'The app is {n} taka cheaper per thousand.',
        { n: formatNumberIn(lang, appWhole) },
      ),
    },
    {
      title: bn ? 'দরকার না হলে ক্যাশ আউট কোরো না।' : 'Don’t cash out unless you need to.',
      body: bn ? 'QR পেমেন্ট, বিল পে আর রিচার্জে গ্রাহকের চার্জ নেই।' : 'QR payments, bill pay and recharge cost customers nothing.',
    },
  ]

  const faq = [
    {
      question: bn ? 'বিকাশে ১০০০ টাকা ক্যাশ আউটে কত চার্জ?' : 'What is the bKash charge to cash out 1,000 taka?',
      answer: fill(
        bn
          ? 'প্রিয় এজেন্টে {priyo} টাকা, অন্য এজেন্টে {agent} টাকা, ATM এ {atm} টাকা। চার্জ আলাদা করে ওয়ালেট থেকে কাটে।'
          : '{priyo} taka at a Priyo agent, {agent} taka at other agents and {atm} taka at an ATM. The charge is taken from the wallet separately.',
        { priyo: rate(lang, p(QUOTA_CHANNEL)), agent: rate(lang, p('bkash-agent')), atm: rate(lang, p('bkash-atm')) },
      ),
    },
    {
      // draft answer: the Figma frame shows this item closed.
      question: bn ? 'বিকাশ প্রিয় এজেন্টের লিমিট কত?' : 'What is the bKash Priyo agent limit?',
      answer: fill(
        bn
          ? 'মাসে {quota} টাকা পর্যন্ত প্রিয় এজেন্টের রেটে (প্রতি হাজারে {priyo} টাকা) তোলা যায়। কোনো লেনদেনে এই সীমা পার হলে পুরো লেনদেনে সাধারণ রেট {over} টাকা লাগে।'
          : 'Up to {quota} taka a month at the Priyo rate ({priyo} taka per thousand). A transaction that goes past it pays the normal rate, {over} taka, on the whole amount.',
        {
          quota,
          priyo: rate(lang, p(QUOTA_CHANNEL)),
          over: rate(lang, priyo.quota?.over[0]?.per1000 ?? p('bkash-agent')),
        },
      ) + (dayLimit ? ' ' + fill(bn ? 'দিনে সর্বোচ্চ {max} টাকা ক্যাশ আউট করা যায়।' : 'You can cash out at most {max} taka a day.', { max: formatNumberIn(lang, dayLimit) }) : ''),
    },
    {
      // draft answer: the Figma frame shows this item closed.
      question: bn ? 'কোন মোবাইল ব্যাংকিংয়ে চার্জ সবচেয়ে কম?' : 'Which mobile banking has the lowest charge?',
      answer: fill(
        bn
          ? 'এখানকার {count}টা উপায়ের মধ্যে {first} সবচেয়ে সস্তা, প্রতি হাজারে {firstRate} টাকা। তারপর {second}, {secondRate} টাকা।'
          : 'Of the {count} ways here, {first} is the cheapest at {firstRate} taka per thousand, then {second} at {secondRate} taka.',
        {
          count: formatNumberIn(lang, channels.length),
          first: channelName(copy, first).replace(', ', ' '),
          firstRate: rate(lang, per1000(first)),
          second: channelName(copy, second).replace(', ', ' '),
          secondRate: rate(lang, per1000(second)),
        },
      ),
    },
  ]

  return toolPageContent(CASH_OUT_ID, lang, {
    data: dataStatus(facts),
    steps: { title: copy.stepsTitle, items: steps },
    faq: { title: t(lang, 'content.faq'), items: faq },
  })
}
