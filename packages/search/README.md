# @hisab/search

Offline search for হিসাব খাতা: a MiniSearch 7 index built over the page registry
(`@hisab/data/registry`), FAQ answers and banks; a Bangla normalizer (digits,
ZWJ/ZWNJ/hasanta, kar/phala variants); the Banglish and synonym map in
`data/search/synonyms.json`; and an intent parser ('bkash cash out 5000',
'bikash 5k', 'বিকাশ ক্যাশআউট ৫০০০') that calls @hisab/core to fill an answer card.

- One concern per file: `src/<name>.ts`, tested in `test/<name>.test.ts`,
  imported as `@hisab/search/<name>`.
- No DOM and no network: the index is built at build time and loaded lazily.
- Registry `keywords` already carry Bangla, Banglish and misspelt forms; the
  synonym map adds the rest.

```sh
pnpm --filter @hisab/search test
pnpm --filter @hisab/search typecheck
```
