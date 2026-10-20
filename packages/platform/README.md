# @hisab/platform

The platform adapter. Components call `getPlatform()` and never import Capacitor
directly, so nearly everything can be tested in a browser (or happy-dom).

```ts
import { getPlatform, collectionsFor } from '@hisab/platform/index'

const platform = getPlatform()
const outcome = await platform.share({ title, url, files: [{ name: 'card.png', type: 'image/png', data: blob }] })
// 'shared' | 'downloaded' | 'copied' | 'cancelled' | 'unsupported' → pick the toast
await platform.haptic('success')
await collectionsFor(platform.store).favorites.toggle('emi')
```

| File | What it holds |
|---|---|
| `src/types.ts` | `Platform`: `share`, `haptic`, `print`, `notify` (schedule/cancel/pending reminders, permission), `store`, `openExternal` (http(s), mailto, tel only), `network` (status + subscribe), `appInfo` |
| `src/store.ts` | `KeyValueStore` (async JSON get/set/remove/keys), `jsonStore` (small backend + large backend over 64 KB or on quota errors), `memoryStore`, `namespaced` |
| `src/web.ts` | `createWebPlatform()`: navigator.share → download (files) → clipboard (links); window.print; localStorage (`hk:` prefix) + IndexedDB; Notification API reminders while a tab is open; online/offline events; no-op haptics |
| `src/capacitor.ts` | `createCapacitorPlatform(loaders)`: @capacitor/share (files written to `Directory.Cache` first), haptics, preferences + filesystem (`Directory.Data/store/`), local-notifications, browser, network, app; plus an optional printer plugin. Plugins are typed by local minimal interfaces and loaded lazily, once each |
| `src/capacitor-plugins.ts` | The real `import('@capacitor/…')` loaders, for the app build only |
| `src/capacitor-modules.d.ts` | Stand-in module declarations until the plugins are installed; delete it then |
| `src/collections.ts` | Favorites (☆), recent pages, recent searches and saved calculations/checklists on any `KeyValueStore`; `collectionsFor(store)` shares one instance per store |
| `src/index.ts` | `getPlatform()` (Capacitor when `window.Capacitor.isNativePlatform()` and plugins are registered, else web), `usePlugins()`, `setPlatform()`, `isNativePlatform()` |

## In the app (apps/app)

Install the plugins listed in docs/decisions/0001-stack.md, delete
`src/capacitor-modules.d.ts`, then at start-up:

```ts
import { usePlugins } from '@hisab/platform/index'
import { capacitorPlugins } from '@hisab/platform/capacitor-plugins'
usePlugins(capacitorPlugins)
```

The website never imports `capacitor-plugins.ts`, so its bundle never references
`@capacitor/*`. Inside the app without `usePlugins()`, `getPlatform()` falls back
to the web implementation and warns.

## Notes

- Web reminders fire only while a tab is open (no push server); sehri/iftar
  reminders that must fire with the app closed are native-only.
- The Vibration API is left off on the web on purpose.
- `window.print()` does nothing in WKWebView; pass a `printer` loader (for
  example @capgo/capacitor-printer's `printWebView`) once it is installed. Its
  API in `PrinterPlugin` is unverified until then.
- The IndexedDB backend has no unit test (happy-dom has no IndexedDB); it was
  checked by hand in Chromium (set/get/keys/shrink/remove of a 100 KB value).
- @noble/ed25519 is available for verifying signed data packs.

```sh
pnpm --filter @hisab/platform test
pnpm --filter @hisab/platform typecheck
```
