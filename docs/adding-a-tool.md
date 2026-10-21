# Adding a calculator with the tool page template

Every calculator page is the same template (phase 3b): breadcrumb, H1, subtitle, the verified
line (or "যাচাই বাকি"), the calculator island (input card, live result card with count-up,
comparison/breakdown, callout, action bar with share link, PDF/print and the "ভুল পেলেন?" report
sheet), numbered tips or steps, FAQ (with FAQPage JSON-LD), related tools from the registry and
the ad slot. Cash Out (`packages/pages/src/cash-out/`, `/tools/cash-out`) is the reference for a
comparison tool with data; EMI (`packages/pages/src/emi/`) for a formula tool with a schedule,
DPS/FDR for data-backed modes, Loan Comparison for a custom table. Copy the closest one and change
the parts below.

In the steps, `<id>` is the registry id (e.g. `emi`) and `<Tool>` its PascalCase name (`Emi`).

## 0. Check what you need

- The registry entry in `data/registry/tools.json`: `route`, `name`, `shortName`, `description`,
  `section`, `related`, `engine`, `dataFiles`, `figma`. Title, subtitle, breadcrumb and "আরও টুল"
  come from it; do not copy them into the page.
- The engine in `packages/core/src/<engine>.ts`: its `XxxInput`, `validateXxx`, `calculateXxx`.
  Never change engine math for a page; if something is missing, add it to docs/open-items.md.
- The data file(s) in `data/` (if any) and their type in `packages/data/src/types.ts`
  (`DataFileTypes['<file>.json']`).
- The Figma frames (`figma.mobile` / `figma.desktop` in the entry). Read the frame texts from the
  metadata dump; take a few screenshots with the Figma MCP (`get_screenshot`, base64) for instance
  texts (field labels, chips, result lines, compare rows, callouts, FAQ).

## 1. URL parameters — `packages/pages/src/<id>/params.ts`

```ts
import { defineParams } from '../tool/url-state.ts'
export const EMI_PARAMS = defineParams({
  principal: { kind: 'number', default: 500000, min: 0, max: 1_000_000_000 },
  rate: { kind: 'number', default: 12, min: 0, max: 100 },
  months: { kind: 'number', default: 36, min: 1, max: 600, integer: true },
  mode: { kind: 'enum', default: 'emi', values: ['emi', 'principal'] as const }, // only if Figma has modes
})
```

- Keys are short ASCII query names; defaults are the Figma example values (the server renders
  them, so the page has a full result without JS, and the default link is the clean canonical URL).
- `min`/`max` are only sanity bounds for links. Business limits (daily limits, slabs) belong to the
  model, so the person sees the C1-d style error with a fix button.
- Quick-value chips and other fixed UI lists go here too (`QUICK_AMOUNTS`, `TERM_CHIPS`).
- Next to the params, an `XXX_LIMITS` object with what the engine's `validateXxx` accepts
  (`{ months: { min: 1, max: 600, integer: true } }`); the model turns it into field messages.
- A default that must equal a data value (e.g. the 10% tax from finance/interest-tax.json) stays a
  literal here; the unit test asserts it matches the data file.

## 2. Copy — `packages/pages/src/<id>/copy.ts`

`COPY = { key: { bn: '…', en: '…' } } as const satisfies CopyTable` (nested tables are fine, e.g.
`providers: { bkash: { bn, en } }`), plus `export type XxxCopy = Localized<typeof COPY>`. Bangla
verbatim from Figma; mark anything you wrote yourself with a `// draft` comment (and list it in
docs/open-items.md). Placeholders are `{name}` and are filled with `interpolate(lang, text, vars)`.

The island never imports `COPY` or the @hisab/i18n message files (that put both languages into
every page's JavaScript). The server passes `text={islandText(lang, COPY, XXX_MESSAGE_KEYS)}`: the
copy in one language plus the @hisab/i18n keys the island calls `t()` with. Keys the template
uses (ToolActions, ResultEmpty, number field messages, quick values) are added by `islandText`
(`TOOL_MESSAGE_KEYS`); list the tool's own in `XXX_MESSAGE_KEYS` in content.ts.
`test/island-text.test.tsx` renders every island with only those strings and fails on a missing key. Generic strings (validation, toasts, sheet,
"সাধারণ প্রশ্ন", "আরও টুল", "যাচাই বাকি") are already in `@hisab/i18n` (`t(lang, 'validation.min')`…);
add a new generic key to both `bn.json` and `en.json` and, if not from Figma, to `DRAFT_BN_KEYS`.

## 3. Model — `packages/pages/src/<id>/model.ts` (pure, unit-tested)

```ts
export function emiOutcome(input: { lang: Lang; copy: EmiCopy; … }): ToolOutcome<EmiResult>
```

- Take the copy as `copy` (one language, `localize(COPY, lang)` in tests and content.ts), never
  import `COPY` in model.ts or the island. Import `t`/`interpolate` from `@hisab/i18n/t` (the
  runtime without the message files), not `@hisab/i18n/messages`.

- Return `{ kind: 'empty' }` while a required field is empty or not a number (the island passes
  `null` for those), `{ kind: 'error', error: { title, body, fix? }, fields? }` for a fixable input
  error (C1-d), or `{ kind: 'result', result, fields? }`.
- `fields` maps a param key to a message shown under that field (red), e.g. the C1-c warning.
- Use the engine's `validateXxx` before `calculateXxx`, or check the inputs first with
  `fieldIssues(values, XXX_LIMITS, rangeSay(lang, copy.wholeMonths))` from `tool/validation.ts`
  and return `{ kind: 'empty', fields }` when it finds something (the field shows the message).
- Numbers via `taka(lang, v)` (whole taka, as the finance frames show), `num`, `plain` (rates as
  typed: ১০, ৯.৫) and `fill(lang, text, vars)` from `tool/say.ts`, or `formatTakaIn` /
  `formatNumberIn` from `@hisab/i18n/format` (Bangla digits on bn pages).
- The result carries what the island shows: result card `label`/`value`/`decimals`/`sub`, the
  comparison or breakdown rows, callout text and a one-line `shareText`.
- `checkNumber(text, rules)` from `@hisab/pages/tool` gives the empty/invalid/min/max/ok state of
  free text if the tool needs it outside NumberField.

## 4. Page content — `packages/pages/src/<id>/content.ts`

```ts
export function emiContent(lang: Lang, file?: SomeFile): ToolPageContent {
  return toolPageContent('emi', lang, {
    data: dataStatus(factsUsed),          // leave out for formula-only tools (no verified line)
    steps: { title: COPY.stepsTitle[lang], items: [{ title, body }] },
    faq: { title: t(lang, 'content.faq'), items: [{ question, answer }] },
  })
}
```

Numbers in tips and FAQ answers are computed from the data/engine, never typed in.

## 5. Island — `packages/pages/src/<id>/<Tool>Calculator.tsx`

Copy `CashOutCalculator.tsx`. The pieces:

- Props `lang` and `text: IslandText<typeof COPY>`; the first line is
  `const COPY = useIslandText(lang, text)` (registers the messages, returns the copy).
- Import ui components from their own modules (`@hisab/ui/base/NumberField`,
  `@hisab/ui/nav/ResultCard`, `@hisab/ui/content/BreakdownTable`), not the group barrels.
- `const { values, set } = useUrlState(PARAMS)` — inputs ⇄ URL (`history.replaceState`).
- `useSubtitle(text)` only if a mode changes the page subtitle (C1-b).
- `useMemo(() => xxxOutcome({...}), [deps])`.
- Inputs inside `<InputCard>`: `NumberField` (`value={values.x}`, `onValueChange={(v) => set('x', v)}`,
  `error={fields.x}`, `messages={fieldMessages(lang)}`, `lang`, `prefix="৳"` / `"%"` / the unit
  word, `formatOnBlur={false}` for rates), `FieldPair` (two fields on one row), `ModeSwitch`
  (a labelled SegmentedControl for modes), `ChoiceChips` (chips with labels: "৩ বছর", "৫০%"),
  `QuickValues` (amount chips), `Select`/`Picker` as Figma shows. Keep a ৳ amount of 6+ digits on
  a full-width row: half a 390px card cannot show ৫,০০,০০০.
- Results: `<ResultEmpty>` / `<ResultError onFix>` / `<ResultCard>` (`decimals={0}` for whole
  taka, `suffix` for "লাখ" or "কম") + `<SummaryCard title rows>` (Figma "মোট হিসাব" KV card),
  `<CompareList>` (comparisons) or `BreakdownTable` from `@hisab/ui/content/BreakdownTable`
  (schedules: give it `maxHeight`; the print stylesheet prints every row), `<ToolCallout>`
  (`tone="info"` for the blue Figma callouts), then `<ToolActions lang toolId title shareText reportItems>`.
- Wrap in `<CalculatorFrame inputs={…} results={…} />` (stacked on phones/tablets, 380px input
  card + results side by side from an 840px container).
- Add an island entry `packages/pages/src/islands/<id>.ts` that re-exports only the island, so the
  client bundle leaves out the registry-driven content:
  `export { EmiCalculator } from '../emi/EmiCalculator.tsx'`.
- Export the rest from `packages/pages/src/<id>/index.ts` and add `"./<id>": "./src/<id>/index.ts"`
  to `packages/pages/package.json` `exports`.
- A new shared ui component the template uses on every page (like KVRow) goes into the
  `TOOL_TEMPLATE` chunk group in `apps/web/astro.config.ts`; a tool-only one does not.

## 6. Web page — `apps/web`

1. `src/components/tools/<Tool>Page.astro` (copy `EmiPage.astro`, or `DpsPage.astro` for a tool
   with data): read data with
   `dataFile('<file>.json')` from `src/lib/data.ts` (validated with `checkDataFile`; a bad file
   fails the build), build `content`, render
   `<ToolPage content={content}><XxxCalculator client:load lang={lang} text={islandText(lang, XXX_COPY, XXX_MESSAGE_KEYS)} … /></ToolPage>`.
2. `src/pages/<route>.astro` and `src/pages/en/<route>.astro` (the registry routes, e.g.
   `src/pages/tools/emi.astro`): `<EmiPage lang="bn" />` / `lang="en"`.
3. Add the id to `BUILT_PAGES` in `src/lib/tools.ts` so `[...slug].astro` stops making the
   placeholder (the page becomes indexable, with FAQPage/BreadcrumbList/WebApplication JSON-LD;
   FAQPage only when the tool has a FAQ). The JS budget check and test read this list too.
4. Formula tools (no data file, e.g. EMI) leave `data` out of the content, so there is no
   verified line; "আরও টুল" skips registry `related` pages with a `[param]` route.

The template (`src/components/tool/ToolPage.astro`) already does the head, JSON-LD, the FAQ
(server-rendered FaqList plus a few lines of script in `src/lib/faq.ts`, no island), recents (on idle), the print stylesheet (`@hisab/pages/styles.css`, A4) and the
report endpoint (`/api/report`, see docs/open-items.md).

## 7. Tests

- `packages/pages/test/<id>.test.tsx` (or a `describe` in `test/finance.test.tsx`): the model
  against the Figma example values (each mode and error state), the content numbers, data-backed
  defaults, and one island test (link restores inputs, typing updates the URL). Where Figma and
  the engine disagree, assert the engine's number and say so in the test name.
- Add the island to `CASES` in `packages/pages/test/island-text.test.tsx` with links for every
  state: it renders the island with only its own strings and fails on a missing message key.
- `tests/visual/<id>.spec.ts`: call `toolSuite({ id, path, h1, enH1, modes, expectMode, value,
  enValue, share, ldTypes, schedule? })` from `tests/visual/tool-suite.ts` (see `emi.spec.ts`).
  It covers 390/1440 × light/dark × each mode (screenshots in `test-results/<id>/`), axe, 44px
  targets at 360/390/1440, no sideways scroll, no console errors, the English page, share link
  restore, the no-JS result, JSON-LD, the report sheet and print (a schedule prints every row).
  `tests/visual/budget.spec.ts` picks the page up from `BUILT_PAGES` by itself.

## 8. Before committing

```sh
pnpm install --frozen-lockfile && pnpm typecheck && pnpm test
node scripts/check-data.mjs --allow-unverified
pnpm build && pnpm check:js && PW_SERVER=preview PORT=4410 pnpm test:visual
```

`pnpm check:js` (scripts/check-js-budget.mjs, also in CI) fails when a built tool page loads more
than 25 KB gz of JavaScript before any tap (Home: 10 KB); `tests/visual/budget.spec.ts` checks
the same in the browser. If a new page goes over, look at `node scripts/check-js-budget.mjs
--verbose` (and `SOURCEMAP=1 pnpm build` to see what is inside a chunk). Things that only a tap
needs (sheets, a long schedule, share/print) belong behind `import()`.

Look at `test-results/<id>/*.png` against the Figma frames and note every deviation in
docs/open-items.md.
