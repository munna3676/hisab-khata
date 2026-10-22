# @hisab/pages

Page bodies shared by the website (Astro, server-rendered + islands) and the later app shell
(Vite + Preact). They take everything through props: no fetching, no Astro, no Capacitor.

| Path | What it holds |
|---|---|
| `src/tool/` | The calculator page template: `url-state.ts` (inputs ⇄ query string), `validation.ts` (empty / invalid / error / result states), `verification.ts` (verified line or "যাচাই বাকি"), `content.ts` (title, breadcrumb, related tools from the registry), `hooks.ts` (`useUrlState`, `useSubtitle`), `say.ts` (taka/num/plain/fill), `text.ts` / `island-text.ts` (one language's copy and messages per island: `localize`, `islandText`, `useIslandText`), `ReportSheet` (loaded on first tap), `ToolHeader`, `ToolActions` (share, PDF/print, report sheet, toasts), `parts.tsx` (`ToolPage`, `CalculatorFrame`, `InputCard`, `ResultEmpty`, `ResultError`, `CompareList`, `ToolCallout`, `ToolSteps`, `RelatedTools`) |
| `src/cash-out/` | Cash Out: params, copy, model (pure), page content, `CashOutCalculator` island |
| `src/emi/`, `src/dps/`, `src/fdr/`, `src/loan-eligibility/`, `src/loan-compare/`, `src/savings-goal/` | The finance calculators, same layout as cash-out; `src/deposit/` holds what DPS and FDR share (tax help line, excise answer, deduction rows) |
| `src/age/`, `src/job-age-limit/`, `src/bangla-date/`, `src/hijri-date/`, `src/day-count/` | The date tools; they share `tool/DateField.tsx` (date boxes + the P5 picker sheet), `tool/today.ts` ("today" in Bangladesh) and `tool/date-say.ts` |
| `src/land-converter/`, `src/land-price/`, `src/gold-converter/`, `src/jewelry-bill/` | Land and gold tools; `src/land/units.ts` (P3 unit picker, unit names) and `src/gold/` (weight fields, the day's BAJUS rate) are shared, `tool/UnitTable.tsx` draws "সব এককে" |
| `src/islands/<id>.ts` | Hydration entries for the website: only the island |
| `src/styles.css` | `@source` for Tailwind and the A4 print stylesheet |

How to add a tool: [docs/adding-a-tool.md](../../docs/adding-a-tool.md).

```sh
pnpm --filter @hisab/pages test
pnpm --filter @hisab/pages typecheck
```
