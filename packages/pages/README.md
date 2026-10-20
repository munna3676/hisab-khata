# @hisab/pages

Page bodies shared by the website (Astro, server-rendered + islands) and the later app shell
(Vite + Preact). They take everything through props: no fetching, no Astro, no Capacitor.

| Path | What it holds |
|---|---|
| `src/tool/` | The calculator page template: `url-state.ts` (inputs ⇄ query string), `validation.ts` (empty / invalid / error / result states), `verification.ts` (verified line or "যাচাই বাকি"), `content.ts` (title, breadcrumb, related tools from the registry), `hooks.ts` (`useUrlState`, `useSubtitle`), `ToolHeader`, `ToolActions` (share, PDF/print, report sheet, toasts), `parts.tsx` (`ToolPage`, `CalculatorFrame`, `InputCard`, `ResultEmpty`, `ResultError`, `CompareList`, `ToolCallout`, `ToolSteps`, `RelatedTools`) |
| `src/cash-out/` | Cash Out: params, copy, model (pure), page content, `CashOutCalculator` island |
| `src/islands/<id>.ts` | Hydration entries for the website: only the island |
| `src/styles.css` | `@source` for Tailwind and the A4 print stylesheet |

How to add a tool: [docs/adding-a-tool.md](../../docs/adding-a-tool.md).

```sh
pnpm --filter @hisab/pages test
pnpm --filter @hisab/pages typecheck
```
