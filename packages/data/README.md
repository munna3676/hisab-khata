# @hisab/data

Typed access to `data/`: the page registry, the data contract every rate file
must pass, and the signed data store the app updates from without a store
release. Depends on @noble/ed25519 (release signatures), @hisab/core (the
shapes engines take) and, at build time only, ajv 8 (JSON Schema → standalone
validators).

## What lives where

| Path | What it holds |
|---|---|
| `data/registry/tools.json` | One entry per user-facing page: id, kind, section, routes, Bangla/English names, keywords, related pages, engine, data files, Figma frames |
| `data/*.json`, `data/<group>/*.json` | Rates, slabs, fees and rules. Every changeable number is a Fact `{ value, unit?, source, checked, note? }` |
| `data/_schema/<name>.schema.json` | One JSON Schema (2020-12) per kind of file; `fact`, `common` and `registry` are shared |
| `src/contract.ts` | `DATA_FILES`: file pattern → schema, sanity bounds, Facts or editorial, bundled in the app or not |
| `src/types.ts` | A TypeScript type per file, built from the @hisab/core engine types (`MfsChargesFile.channels[i].value` is an `MfsChannel`) and `DataFileTypes` (path → type) |
| `src/checks.ts` | `checkDataFile(path, data)`: schema + bounds + engine rules (rising slabs, grade scales, MFS bands, wizard answers) |
| `src/generated/validators.js` | ajv standalone code for every schema: pure ESM, no `eval`/`new Function`, committed |
| `src/manifest.ts` | Manifest and signature helpers (WebCrypto SHA-256, Ed25519 via `signAsync`/`verifyAsync`) |
| `src/store.ts` | `DataStore`: bundled snapshot, signed updates, atomic swap, last good set; `memoryStorage()` |
| `src/registry.ts` | `registry`, `getEntry`, `entriesInSection`, `hubItems`, `routeFor` |
| `design/figma-map.json` | Every Figma frame → the page it draws (or the overlay/state), its variant and width |

## Data files

| File | Engine / page | Value |
|---|---|---|
| `mfs-charges.json` | mfs-charge | `channels: Fact<MfsChannel>[]`, `referenceByService` |
| `mfs-providers.json` | MFS pages | helpline, USSD, bill-pay categories per provider |
| `banks.json`, `banks/<id>.json` | bank pages | bank directory; each bank's FDR/DPS/loan rates |
| `remittance.json` | remittance compare | countries, channels, `services: Fact<RemittanceService>[]` |
| `electricity-tariff.json` | electricity-bill | companies + `ElectricityTariffTable` |
| `income-tax-<year>.json` | income-tax | `IncomeTaxRules` |
| `data-packs.json` | data-pack | operators, `packs: Fact<DataPack[]>[]` (one per operator) |
| `commerce/couriers.json`, `delivery-zones.json` | delivery-profit | courier id → `CourierRate`; zone chips |
| `commerce/vat-rates.json`, `sd-rates.json` | vat, invoice | rate chips, default VAT |
| `finance/interest-tax.json`, `excise-duty.json` | dps, fdr | `taxPct`; `ExciseSlab[]` |
| `finance/loan-dbr.json`, `loan-caps.json`, `loan-fees.json` | loan tools | DBR chips; optional caps and fee hint |
| `finance/salary-presets.json`, `savings-goal-presets.json` | salary, savings-goal | presets |
| `finance/sanchayapatra.json` | sanchayapatra | `SanchayapatraScheme[]` + names |
| `finance/currency-rates.json` | currency, remittance | one bank's `CurrencyRate[]` |
| `gold/bajus-rates.json`, `jewellery-rules.json` | gold, jewelry-bill, zakat | karat rates per ভরি; মজুরি/VAT/cut rules |
| `religion/zakat.json`, `fitra.json`, `sehri-iftar-method.json`, `ramadan.json` | religion tools | nisab, `FitraRates`, `SehriIftarMethod`, Ramadan start |
| `dates/hijri-offset.json`, `special-days.json`, `weekend.json`, `holidays-<year>.json` | date tools | offset, `SpecialDay[]`, off days, `Holiday[]` |
| `jobs/govt-age-limit.json` | job-age-limit | `JobAgeLimit` + chips + extensions |
| `land/conventions.json`, `registration-costs.json` | land tools | `LandConvention` chips; `LandCostRule[]` |
| `education/board-grading.json`, `board-subjects.json`, `ugc-grading.json` | gpa, cgpa | grade scales, subject rows |
| `districts.json` | sehri-iftar | `District[]` |
| `guides/<slug>.json` | guides | documents, steps, fees (Facts), tips, FAQ, sources, wizard questions and results |
| `search/synonyms.json`, `text/name-variants.json`, `changelog.json` | search, name-spelling, change log | editorial, no Facts |

Seeded values come only from @hisab/core test fixtures and Figma texts. Each
seeded Fact has `checked: "2000-01-01"` and the note `unverified — seeded from
Figma/test fixture`; `source` is the official page to verify it at. After
checking a value there, set `checked` to that day and delete the note.

## Rules

- Every changeable leaf is a Fact. A new file needs a schema in `data/_schema`,
  an entry in `src/contract.ts` and a type in `src/types.ts`; then run
  `node scripts/build-validators.mjs` and commit `src/generated/`.
- Registry ids are stable kebab-case; never rename one (saved items and share links keep it).
- Routes are ASCII. English is the Bangla path under `/en`. A `[param]` segment
  (e.g. `/bank/[bank]/fdr`) is filled from data.
- Bangla `name`/`description` are copied from the Figma text. Where they are not
  (`draftCopy: true`) an editor still has to check them.
- `section` is `root` or a hub id; hubs list their pages in `items` (Figma order).
- Every Figma frame must appear in an entry's `figma` list or in `design/figma-map.json`.
- Nothing in `data/registry/` or the editorial files may use the keys `source`
  or `checked` (the checker would read it as a Fact).

## Releasing data to the app

```sh
node scripts/check-data.mjs                     # schema, bounds, staleness (warn > 60 days, fail > 120)
node scripts/build-manifest.mjs --snapshot=packages/data/dist/snapshot.json
HISAB_DATA_SIGNING_KEY=<hex> node scripts/sign-manifest.mjs
node scripts/changelog.mjs --from=<previous tag> --write
```

Publish `manifest.signed.json` and the data files under one URL. The app builds
a `DataStore` with the snapshot, the trusted public keys (`sign-manifest.mjs
--public-key` prints the keyId and key) and a storage adapter (Capacitor
Filesystem or IndexedDB in packages/platform). `update()` accepts a release only
when the signature verifies with a trusted key, the version is higher, every
changed file has its signed SHA-256 and passes `checkDataFile`, and no bundled
file is missing. It writes the new set to the spare slot and flips one pointer;
`load()` re-verifies both stored sets and uses the highest verified version
(so a rewritten pointer cannot roll the app back), then the bundle. `update()`
runs `load()` first when the app has not, so a replayed older release can never
overwrite a newer stored one. Files and the manifest over `maxFileBytes` (2 MB)
are refused, a file before it is downloaded (its signed size is known).

## Commands

```sh
pnpm --filter @hisab/data test
pnpm --filter @hisab/data typecheck
pnpm --filter @hisab/data validators   # rebuild src/generated after a schema change
pnpm --filter @hisab/data check        # check-data with --allow-unverified (what CI runs for now)
```

Tests that read files with `node:fs` start with `/// <reference types="node" />`;
`src/` stays free of Node types because it also runs in the app.
