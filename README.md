# হিসাব খাতা

টাকা, ব্যাংক আর সরকারি কাজের হিসাব, এক খাতায়। A free Bangla-first utility
for Bangladesh: MFS charges, bank and remittance comparison, ~50 calculators
and government-task guides. One codebase ships the website and the iOS and
Android apps.

| Path | What it holds |
|---|---|
| `apps/web` | Astro 7 static site, Preact islands, Tailwind 4: the site shell (`src/layouts/Shell.astro`), the Home page (Bangla at `/`, English at `/en/`), the calculator template and the Cash Out, EMI, DPS, FDR, loan eligibility, loan comparison, savings goal, VAT, discount and percentage, profit margin and salary pages (`/tools/<id>`, `/en/tools/<id>`), a noindex placeholder for every other registry route, component gallery at `/dev/gallery`, token showcase at `/dev/tokens` |
| `packages/pages` | Page bodies shared with the app: the calculator page template and each tool's island (see its README and `docs/adding-a-tool.md`) |
| `packages/core` | Calculation engines for every tool (pure TypeScript, tested) |
| `packages/tokens` | Design tokens from the Figma file (light + dark + motion) → `dist/tokens.css` and the Tailwind `dist/theme.css` |
| `packages/ui` | Preact components, icons and the motion utilities, shared by the website and the app (see its README) |
| `tests/visual` | Playwright: gallery screenshots at 390/1440 px and Home at 360/390/768/1024/1440 px in light and dark, axe, touch targets, no sideways scroll, registry routes, Home links, hreflang pairs, view transitions, token checks |
| `data/` | Every rate, charge and slab as a Fact with its source and checked date |
| `docs/decisions/0001-stack.md` | Chosen stack and the phased build plan |
| `docs/engine-review.md` | Open questions and data to confirm for each engine |

```sh
pnpm install
pnpm dev                    # web dev server (PORT=4401 pnpm dev for another port)
pnpm build                  # tokens + static site into apps/web/dist
pnpm test                   # unit tests in every package (core, ui, tokens --check)
pnpm typecheck              # tsc / astro check everywhere
pnpm test:visual            # Playwright; starts a dev server on $PORT (default 4400)
SECTION=base PORT=4401 pnpm shots   # screenshots of /dev/gallery#base only
pnpm check:data             # every Fact has a source; warns when one is over 60 days old
pnpm check:js               # after build: JS per page, fails tool pages over 25 KB gz, Home over 10 KB
```

Screenshots land in `test-results/gallery/<section|all>/<theme>-<width>.png` and
`test-results/home/<bn|en>-<theme>-<width>.png`; each calculator page in
`test-results/<id>/<lang>-<mode>-<theme>-<width>.png` (plus `print-a4.pdf`). Web icons (favicon, apple-touch-icon,
manifest icons) are made from `design/launch/app-icon-1024.png` by `node scripts/make-icons.mjs`.
In this container Playwright uses the preinstalled Chromium at
`/opt/pw-browsers/chromium` automatically; never run `playwright install` here.
