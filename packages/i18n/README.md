# @hisab/i18n

Locales, interface copy and locale formatting shared by the website and the app.
Bangla is served at `/` and English under `/en/`.

| File | What it holds |
|---|---|
| `src/bn.json`, `src/en.json` | Interface copy by area: `app`, `nav`, `brand`, `search`, `home`, `allTools`, `saved`, `action`, `field`, `validation`, `result`, `verified`, `content`, `wizard`, `sheet.*` (share, reportError, rateAlert, installApp, externalLink, bankSort, bankAdd, remittanceSort, messMember), `picker`, `toast`, `state` (offline, stale, 404, loading), `contact`, `footer`, `disclaimer`, `shareCard` |
| `src/messages.ts` | Loads both message files; `t(lang, key, vars)`, `translator(lang)`, `MessageKey` (every dotted key, checked at compile time), `DRAFT_BN_KEYS`, `pickMessages` |
| `src/t.ts` | The same `t()` without the message files, for islands: they get their few keys in one language as a prop (`pickMessages` on the server, `provideMessages` in the island) |
| `src/format.ts` | `formatNumberIn`, `formatTakaIn`, `formatPercentIn`, `plainDigits`, `formatDateIn`, `formatLongDateIn` over `@hisab/core/lib/format` |
| `src/routes.ts` | `routeOf(id, lang, params)`, `matchRoute(path)`, `switchLanguage(href, lang)`, `alternates(href)` from `data/registry/tools.json` |
| `src/locale.ts` | `localePath`, `neutralPath`, `langOfPath`: the `/en` prefix rule |

```ts
import { t } from '@hisab/i18n/messages'
t('bn', 'search.resultsFor', { query: 'EMI', count: 6 }) // '"EMI" এর জন্য ৬টি ফলাফল'
t('en', 'sheet.bankAdd.selected', { count: 1 })          // '1 bank selected'
switchLanguage('/bank/brac-bank/fdr?amount=5000', 'en')  // '/en/bank/brac-bank/fdr?amount=5000'
```

- Placeholders: `{name}`; number values get the page's digits and lakh commas
  (pass years as `plainDigits(lang, 2026)`); `{count:bank|banks}` picks a word
  by count (English only needs it).
- Bangla copy is verbatim from the Figma file (frame texts plus the copy the
  packages/ui components took from Figma design context). The keys in
  `DRAFT_BN_KEYS` were written here. English is from the A10 English home frame
  where it exists, otherwise a faithful translation.
- Page names and descriptions live in `data/registry/tools.json`, not here;
  tool-specific labels and sample values stay with their pages.
- Tests check key and placeholder parity between bn and en, digit scripts, and
  route switching for every registry entry.

```sh
pnpm --filter @hisab/i18n test
pnpm --filter @hisab/i18n typecheck
```
