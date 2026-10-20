# @hisab/data

Typed access to `data/`: the page registry, the Fact files and (later) the signed
data packs the app downloads. Depends on ajv 8 + ajv-formats (JSON Schema),
@noble/ed25519 (pack signatures) and @hisab/core (the shapes engines expect).

## What lives where

| Path | What it holds |
|---|---|
| `data/registry/tools.json` | One entry per user-facing page: id, kind, section, routes, Bangla/English names, keywords, related pages, engine, data files, Figma frames |
| `data/_schema/registry.schema.json` | Schema for the registry |
| `data/_schema/fact.schema.json` | Schema for one Fact `{ value, unit?, source, checked, note? }` |
| `design/figma-map.json` | Every Figma frame → the page it draws (or the overlay/state), its variant and width |
| `src/registry.ts` | `registry`, `getEntry`, `entriesInSection`, `hubItems`, `routeFor` |

## Rules for the registry

- Ids are stable kebab-case; never rename one (saved items and share links keep it).
- Routes are ASCII. English is the Bangla path under `/en`. A `[param]` segment
  (e.g. `/bank/[bank]/fdr`) is filled from data.
- Bangla `name`/`description` are copied from the Figma text. Where they are not
  (`draftCopy: true`) an editor still has to check them.
- `section` is `root` or a hub id; hubs list their pages in `items` (Figma order).
- Every Figma frame must appear in an entry's `figma` list or in `design/figma-map.json`.
- Nothing in `data/registry/` may use the keys `source` or `checked`
  (`scripts/check-data.mjs` would read it as a Fact).

## Commands

```sh
pnpm --filter @hisab/data test
pnpm --filter @hisab/data typecheck
```

Tests that read files with `node:fs` start with `/// <reference types="node" />`;
`src/` stays free of Node types because it also runs in the app.
