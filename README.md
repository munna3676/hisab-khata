# হিসাব খাতা

টাকা, ব্যাংক আর সরকারি কাজের হিসাব, এক খাতায়। A free Bangla-first utility
for Bangladesh: MFS charges, bank and remittance comparison, ~50 calculators
and government-task guides. One codebase ships the website and the iOS and
Android apps.

| Path | What it holds |
|---|---|
| `packages/core` | Calculation engines for every tool (pure TypeScript, tested) |
| `packages/tokens` | Design tokens from the Figma file (light + dark) |
| `data/` | Every rate, charge and slab as a Fact with its source and checked date |
| `docs/decisions/0001-stack.md` | Chosen stack and the phased build plan |
| `docs/engine-review.md` | Open questions and data to confirm for each engine |

```sh
pnpm install
pnpm test          # all packages
pnpm check:data    # every Fact has a source; warns when one is over 60 days old
```
