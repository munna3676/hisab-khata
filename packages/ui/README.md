# @hisab/ui

Preact 10 components shared by the website (Astro islands or zero-JS SSR) and the
app shell. Styling is Tailwind 4 classes on the token theme from @hisab/tokens.

## Layout and ownership

| Path | Owner | Import as |
|---|---|---|
| `src/base/` (Button, IconButton, Chip, NumberField, Select, SegmentedControl…) | base builder | `@hisab/ui/base` |
| `src/nav/` (BottomNav, TopHeader, Tabs, Breadcrumb, Stepper) | nav builder | `@hisab/ui/nav` |
| `src/content/` (Card, ToolCard, ResultCard, BreakdownTable, Banner, Skeleton…) | content builder | `@hisab/ui/content` |
| `src/overlay/` (BottomSheet/Dialog, Picker, DatePicker, Toast) | overlay builder | `@hisab/ui/overlay` |
| `src/icons/<group>.tsx` | that group's builder | `@hisab/ui/icons` |
| `src/icons/Icon.tsx`, `common.tsx`, `index.ts`, `src/lib/`, `src/styles/` | shared, read-only | `@hisab/ui/icons`, `@hisab/ui/lib` |

Each group folder has `index.ts` (its public barrel) and `<group>.css` (its own
CSS, already imported by `src/styles/index.css`). A component is
`src/<group>/<Name>.tsx` exporting `Name` and `NameProps`, plus one line in the
barrel: `export { Name, type NameProps } from './Name'`. Unit tests go next to it
as `<Name>.test.tsx` (Vitest + happy-dom + @testing-library/preact).

## Rules

- Colours, type, radius, spacing, motion come from tokens only: `bg-accent`,
  `text-ink`, `border-line`, `type-h2`, `rounded-card`, `p-4`, `min-h-touch`,
  `duration-sheet`, `ease-out`. The default Tailwind palette, radii and text
  sizes are removed on purpose; no raw hex and no px a token covers.
- Every tappable element: `pressable` (press scale .97 + tint) and at least 44 px
  (`min-h-touch min-w-touch`). Cards: `lift`. Standalone links: `link-underline`.
  Icons that nudge: `nudge`. `hover:` classes already apply only on hover+fine-pointer devices.
- Transition or animate only transform/translate/scale/rotate and opacity.
  Enter/exit: `animate-rise-in`, `animate-sheet-in/out`, `animate-dialog-in/out`,
  `animate-toast-in/out`, `animate-scrim-in/out`, `animate-fade-in/out`, `animate-pop`,
  `animate-shimmer`, `animate-draw`. All honour `html[data-motion=lite|reduce]`.
- Count-ups: `countUp()` from `@hisab/ui/lib` (lazy-loads motion). Class joining: `cx()`.
- Dark mode needs no `dark:` classes: token colours switch by themselves.
