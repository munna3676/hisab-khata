// What DPS and FDR share: the source-tax help line and the excise duty answer, both read from
// data/finance (interest-tax.json, excise-duty.json), and the summary rows for tax and excise.
import type { ExciseSlab } from '@hisab/core/lib/finance-slabs'
import type { ExciseDutyFile, InterestTaxFile } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import type { SummaryRow } from '../tool/parts.tsx'
import { fill, plain, taka } from '../tool/say.ts'
import { localize, type CopyTable } from '../tool/text.ts'

export const DEPOSIT_COPY = {
  taxLabel: { bn: 'উৎসে কর', en: 'Tax at source' },
  /** Figma F7: "সাধারণত TIN থাকলে ১০%, না থাকলে ১৫%।" */
  taxHelper: { bn: 'সাধারণত TIN থাকলে {with}%, না থাকলে {without}%।', en: 'Usually {with}% with a TIN, {without}% without.' },
  taxHelperWithOnly: { bn: 'সাধারণত TIN থাকলে {with}%।', en: 'Usually {with}% with a TIN.' }, // draft
  taxRow: { bn: 'উৎসে কর ({pct}%)', en: 'Tax at source ({pct}%)' },
  exciseRow: { bn: 'আবগারি শুল্ক', en: 'Excise duty' },
  minus: { bn: '− {amount}', en: '− {amount}' },
  /** draft: the Figma FAQ item is closed. */
  exciseAnswer: {
    bn: 'হ্যাঁ, বছরে একবার, সেই বছরের সর্বোচ্চ স্থিতির উপর। {free} পর্যন্ত কোনো শুল্ক নেই; {free} থেকে {next} পর্যন্ত বছরে {duty}। এখানকার হিসাবে শুল্ক থাকলে "হিসাব" এ আলাদা লাইনে দেখায়।',
    en: 'Yes, once a year, on that year’s highest balance. Nothing is due up to {free}; from {free} to {next} it is {duty} a year. When it applies, the "Breakdown" shows it on its own line.',
  },
} as const satisfies CopyTable

/** The tax field's help line from data/finance/interest-tax.json. */
export function taxHelperText(lang: Lang, file: InterestTaxFile): string {
  const copy = localize(DEPOSIT_COPY, lang)
  const { withTinPct, withoutTinPct } = file.value
  return withoutTinPct === undefined
    ? fill(lang, copy.taxHelperWithOnly, { with: plain(lang, withTinPct) })
    : fill(lang, copy.taxHelper, { with: plain(lang, withTinPct), without: plain(lang, withoutTinPct) })
}

/** The excise duty FAQ answer from data/finance/excise-duty.json (first free slab and the next one). */
export function exciseAnswer(lang: Lang, file: ExciseDutyFile): string {
  const copy = localize(DEPOSIT_COPY, lang)
  const slabs = file.value
  const free = slabs.find((s) => s.duty === 0)?.upTo ?? 0
  const next = slabs.find((s) => s.duty > 0)
  return fill(lang, copy.exciseAnswer, { free: taka(lang, free), next: taka(lang, next?.upTo ?? free), duty: taka(lang, next?.duty ?? 0) })
}

/** Tax and (when due) excise rows of the "হিসাব" card, as amounts taken off. */
export function deductionRows(
  lang: Lang,
  copy: { taxRow: string; exciseRow: string; minus: string },
  taxPct: number,
  tax: number,
  excise: number,
): SummaryRow[] {
  const rows: SummaryRow[] = [{ key: 'tax', label: fill(lang, copy.taxRow, { pct: plain(lang, taxPct) }), value: fill(lang, copy.minus, { amount: taka(lang, tax) }) }]
  if (excise > 0) rows.push({ key: 'excise', label: copy.exciseRow, value: fill(lang, copy.minus, { amount: taka(lang, excise) }) })
  return rows
}

export type { ExciseSlab }
