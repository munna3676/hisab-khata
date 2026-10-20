# @hisab/search

Offline search for হিসাব খাতা. It finds registry pages (`data/registry/tools.json`)
from Bangla, Banglish and English queries, typos and Bangla digits included,
and answers direct questions such as 'bkash cash out 5000' with an answer card.
No DOM and no network: the index is built at build time and loaded lazily.

| Module | What it does |
|---|---|
| `normalize.ts` | Bangla folds (digits, ZWJ/ZWNJ, ী/ি, ূ/ু, ণ/ন, শ/ষ/স, nukta so য়/য and ড়/ড় meet, ৎ, hasanta and য-ফলা, chandrabindu), Banglish folds (bhori/vori, nogod/nagad, bkaash/bkash, cash/kash), case endings (বিকাশের, takar) and the synonym map |
| `synonyms.ts` | The bundled `data/search/synonyms.json` as a ready lookup |
| `index.ts` | MiniSearch 7 index over the registry plus guide titles, summaries and FAQ questions; weights name 4, keywords 2.5, description 1, guide text 0.6; prefix and fuzzy matching tuned for Bangla; serialize, load and `lazySearch` |
| `intent.ts` | `parseIntent` → `{ kind, toolId, params }` and `answer()` → an answer card computed by @hisab/core from the data you pass in |
| `build-index.ts` | Build step: `node packages/search/src/build-index.ts <out.json>` writes the index (about 72 KB, 18 KB gzipped) |

```ts
import { lazySearch } from '@hisab/search/index'
import { parseIntent, answer } from '@hisab/search/intent'

const search = lazySearch(() => fetch('/search-index.json').then((r) => r.text()))
input.addEventListener('focus', () => void search.ready())

const hits = await search.search('bikash kash out') // [{ id: 'mfs-bkash-cash-out', entry, score, match, … }, …]
const intent = parseIntent('বিকাশ ক্যাশআউট ৫০০০') // { kind: 'mfs', toolId: 'cash-out', params: { service: 'cashOut', amount: 5000, provider: 'bkash' } }
const card = intent && answer(intent, { mfsChannels }, { lang: 'bn' })
// { title, question: 'বিকাশে ৫,০০০ টাকা ক্যাশ আউট', main: { label: 'বিকাশ প্রিয় এজেন্ট ক্যাশ আউট চার্জ', value: '৳৬৯.৭৫' }, lines, link: '/tools/cash-out?service=cashOut&amount=5000&provider=bkash' }
```

How it works:
- Search and the index use the same normalizer. The index keeps each word as typed and adds its canonical synonym, so prefixes still match while you type. The query uses the canonical form only.
- A page that matches only some of the query words is scaled down by (share matched)². Tools and hubs get ×1.2, pages planned for later ×0.8, and static pages ×0.85.
- Intents cover MFS cash out and send money (one provider, or every provider compared), EMI, land units, gold and silver weights and value, age from a birth date, VAT, percent and discount, numbers in words, and currency.
- A card's `question` restates the query as its heading ("বিকাশে ৫,০০০ টাকা ক্যাশ আউট", Figma Answer Card 7:302). For a named provider's cash out the Priyo Agent price comes first, then the other channels, as in that design.
- Queries longer than 200 characters are cut (search) or not read as an intent. A number with a leading zero (01712345678) is never an amount.
- `answer()` returns null when an input or the data it needs is missing. The search box then shows only `intentLink(intent)`, which opens the tool with the inputs it was given.
- Tool pages read their inputs back with `intentParams(location.search)`. The parameter names are the intent's `params` keys.

Quality is measured on `tests/search-corpus.json` (`test/corpus.test.ts`). At least 95% of queries must find an expected page in the top 3, and every `must` intent must parse and answer. When you add synonyms to `data/search/synonyms.json`, the tests check that no phrase folds into two canonicals and that every registry keyword is covered.

```sh
pnpm --filter @hisab/search test
pnpm --filter @hisab/search typecheck
```
