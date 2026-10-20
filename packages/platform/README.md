# @hisab/platform

The platform adapter: `share()`, `haptic()`, `print()`, `notify()`, `store()`,
`openExternal()` and `network()`. There is a web implementation (navigator.share,
window.print, localStorage/IndexedDB, Web Push) and a Capacitor one; components
never import Capacitor directly, so nearly everything is testable in Chromium.

- One concern per file: `src/<name>.ts`, tested in `test/<name>.test.ts`
  (happy-dom environment, see `vitest.config.ts`), imported as `@hisab/platform/<name>`.
- @noble/ed25519 is available for verifying signed data packs.
- Capacitor plugins are not installed yet; write the native side against a small
  local interface so it can be wired up when apps/app exists.

```sh
pnpm --filter @hisab/platform test
pnpm --filter @hisab/platform typecheck
```
