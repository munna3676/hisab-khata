# @hisab/core

Calculation engines for every হিসাব খাতা tool. Pure TypeScript: no DOM, no
framework, no network, no dependencies. The web app, the iOS/Android apps and
the tests all import the same functions, so a number is computed one way
everywhere.

## Rules for a module

- One tool (or one family of tools) per file: `src/<tool>.ts`, tested in
  `test/<tool>.test.ts`. `src/emi.ts` is the reference module to copy.
- Export an `XxxInput` interface, a `validateXxx(input)` that returns the name
  of the wrong field or `null`, and a `calculateXxx(input)` that assumes valid
  input and returns a plain result object. Extra modes (e.g. "VAT বাদ দাও",
  "কত তোলা যাবে") are extra functions or an input field, not separate files.
- Money is rounded with `round()` from `src/lib/money.ts` only when it is
  shown or carried to the next step; keep full precision inside a formula.
- Never hard-code a charge, rate, slab, fee, limit or price that can change.
  Take it as a parameter (typed as the shape the JSON in `data/` will have)
  so a data update never needs a code change. Fixed facts of nature or law
  that do not change (1 ভরি = 11.664 g, the revised Bangla calendar) may be
  constants, with a comment naming the source.
- Formatting (Bangla digits, ৳, lakh commas) lives in `src/lib/format.ts`;
  engines return numbers, never formatted strings, except tools whose output
  is text (number to words, Bijoy ↔ Unicode).
- Tests: at least one case checked by hand or against an official/independent
  source (say which in the test name), edge cases (zero, very large, invalid),
  and the example shown in the Figma screen when there is one.

## Commands

```sh
pnpm --filter @hisab/core test
pnpm --filter @hisab/core typecheck
```
