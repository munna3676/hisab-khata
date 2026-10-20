# @hisab/i18n

Locales and UI strings shared by the website and the app. Bangla is served at
`/` and English under `/en/`; `src/locale.ts` holds that rule (`localePath`,
`neutralPath`, `langOfPath`), and the page registry's routes follow it.

- Page names and descriptions live in `data/registry/tools.json`, not here; this
  package holds interface copy (buttons, labels, errors) and locale formatting.
- Number and taka formatting already exists in `@hisab/core/lib/format`; reuse it.
- Bangla copy comes from the Figma file; mark anything written here instead.

```sh
pnpm --filter @hisab/i18n test
pnpm --filter @hisab/i18n typecheck
```
