# Adding a calculator with the tool page template

Every calculator page is the same template (phase 3b): breadcrumb, H1, subtitle, the verified
line (or "যাচাই বাকি"), the calculator island (input card, live result card with count-up,
comparison/breakdown, callout, action bar with share link, PDF/print and the "ভুল পেলেন?" report
sheet), numbered tips or steps, FAQ (with FAQPage JSON-LD), related tools from the registry and
the ad slot. Cash Out (`packages/pages/src/cash-out/`, `/tools/cash-out`) is the reference
implementation: copy its files and change the parts below.

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
- Quick-value chips and other fixed UI lists go here too (`QUICK_AMOUNTS`).

## 2. Copy — `packages/pages/src/<id>/copy.ts`

`COPY = { key: { bn: '…', en: '…' } }`. Bangla verbatim from Figma; mark anything you wrote
yourself with a `// draft` comment (and list it in docs/open-items.md). Placeholders are `{name}`
and are filled with `interpolate(lang, text, vars)`. Generic strings (validation, toasts, sheet,
"সাধারণ প্রশ্ন", "আরও টুল", "যাচাই বাকি") are already in `@hisab/i18n` (`t(lang, 'validation.min')`…);
add a new generic key to both `bn.json` and `en.json` and, if not from Figma, to `DRAFT_BN_KEYS`.

## 3. Model — `packages/pages/src/<id>/model.ts` (pure, unit-tested)

```ts
export function emiOutcome(input: EmiInput & { lang: Lang }): ToolOutcome<EmiResult>
```

- Return `{ kind: 'empty' }` while a required field is empty or not a number (the island passes
  `null` for those), `{ kind: 'error', error: { title, body, fix? }, fields? }` for a fixable input
  error (C1-d), or `{ kind: 'result', result, fields? }`.
- `fields` maps a param key to a message shown under that field (red), e.g. the C1-c warning.
- Use the engine's `validateXxx` before `calculateXxx`. All numbers via `formatTakaIn` /
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

- `const { values, set } = useUrlState(PARAMS)` — inputs ⇄ URL (`history.replaceState`).
- `useSubtitle(text)` only if a mode changes the page subtitle (C1-b).
- `useMemo(() => xxxOutcome({...}), [deps])`.
- Inputs inside `<InputCard>`: `SegmentedControl` (modes), `NumberField` (`value={values.x}`,
  `onValueChange={(v) => set('x', v)}`, `error={fields.x}`, `lang`, `prefix="৳"`/`suffix`),
  `QuickValues`, `Select`/`Picker` as Figma shows.
- Results: `<ResultEmpty>` / `<ResultError onFix>` / `<ResultCard>` + `<CompareList>` (comparisons)
  or `BreakdownTable` from `@hisab/ui/content` (schedules), `<ToolCallout>`, then
  `<ToolActions lang toolId title shareText reportItems>`.
- Wrap in `<CalculatorFrame inputs={…} results={…} />` (stacked on phones/tablets, 380px input
  card + results side by side from an 840px container).
- Add an island entry `packages/pages/src/islands/<id>.ts` that re-exports only the island, so the
  client bundle leaves out the registry-driven content:
  `export { EmiCalculator } from '../emi/EmiCalculator.tsx'`.
- Export the rest from `packages/pages/src/<id>/index.ts` and add `"./<id>": "./src/<id>/index.ts"`
  to `packages/pages/package.json` `exports`.

## 6. Web page — `apps/web`

1. `src/components/tools/<Tool>Page.astro` (copy `CashOutPage.astro`): read data with
   `dataFile('<file>.json')` from `src/lib/data.ts` (validated with `checkDataFile`; a bad file
   fails the build), build `content`, render
   `<ToolPage content={content}><XxxCalculator client:load lang={lang} … /></ToolPage>`.
2. `src/pages/<route>.astro` and `src/pages/en/<route>.astro` (the registry routes, e.g.
   `src/pages/tools/emi.astro`): `<EmiPage lang="bn" />` / `lang="en"`.
3. Add the id to `BUILT_PAGES` in `src/lib/tools.ts` so `[...slug].astro` stops making the
   placeholder (the page becomes indexable, with FAQPage/BreadcrumbList/WebApplication JSON-LD).

The template (`src/components/tool/ToolPage.astro`) already does the head, JSON-LD, the hydrated
FAQ (`client:visible`), recents, the print stylesheet (`@hisab/pages/styles.css`, A4) and the
report endpoint (`/api/report`, see docs/open-items.md).

## 7. Tests

- `packages/pages/test/<id>.test.tsx`: the model against the Figma example values (each mode and
  error state), the content numbers, and one island test (link restores inputs, typing updates
  the URL). Copy `test/cash-out.test.tsx`.
- `tests/visual/<id>.spec.ts`: copy `tests/visual/cash-out.spec.ts`, change `MODES`, `expectMode`
  and the texts. It covers 360/390/768/1024/1440 × light/dark, each mode, axe, 44px targets, no
  sideways scroll, share link restore, no-JS result, JSON-LD, report sheet and print.

## 8. Before committing

```sh
pnpm install --frozen-lockfile && pnpm typecheck && pnpm test
node scripts/check-data.mjs --allow-unverified
pnpm build && PW_SERVER=preview PORT=4410 pnpm test:visual
```

Look at `test-results/<id>/*.png` against the Figma frames and note every deviation in
docs/open-items.md.
