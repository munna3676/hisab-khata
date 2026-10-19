# 0001 — Tech stack for web, iOS and Android

Status: accepted (2026-10-19). Chosen by a five-proposal, three-judge review; scores below.

## Decision

The website is built with Astro 7 as static pages, using Preact 10 islands, Tailwind CSS 4 and View Transitions. The same Preact page components also run as a small Vite 8 + Preact single-page app, and Capacitor 8 packages that app for Android and iOS. Everything sits on the existing pnpm monorepo: the @hisab/core engines, @hisab/tokens and the data/ Facts with their schema and checker. Hosting is Cloudflare Pages (free), with one Cloudflare Worker for forms and alert sign-ups. Rate alerts go out as Firebase Cloud Messaging topic messages. All builds, including iOS on macos-26 runners, run on GitHub Actions, so no Mac is ever needed.

## Why

The three judges' average scores favour the Astro + Capacitor proposal (7.5), ahead of React Router + Capacitor (7.17), SvelteKit + Capacitor (6.83), Expo (5.67) and Flutter + Jaspr (5.17). Google search is the main traffic source, and most users are on low-end Android phones on slow data. Astro ships 0 KB of JavaScript on content pages and about 12-20 KB on calculator pages, the lightest of all five options, and that matters even more once AdSense is added. For the apps, Capacitor bundles all code and data inside the binary. The apps work offline from first launch, the download is the smallest (about 5-9 MB), and native features (reminders, push alerts, native share/print, haptics, quick actions, universal links, swipe-back) make the case under Apple 4.2. The judges' biggest objection to the Astro plan was forcing a multi-page Astro site into Capacitor (build.format 'file' plus ClientRouter). I replace that with the runner-ups' pattern: the app is a tiny Preact single-page shell that renders the very same page components, which matches Capacitor's 'serve index.html for every path' routing. Instead of re-porting the MVP, the plan reuses what is already in the repo: 34 engine modules (about 5,200 lines plus about 3,200 lines of tests), Figma tokens, the Fact schema and check-data.mjs. Monthly rate changes reach installed apps as signed JSON data, not code, so no store release is needed. Recurring cost stays at Apple's $99/yr plus the domain.

| Stack | Average score |
|---|---|
| Astro 7 static + Preact islands + Tailwind 4 + View Transitions, wrapped in Capacitor 8 (judge scores 8, 6.5, 8) | 7.5 |
| React 19 + React Router 8 prerender + Tailwind 4/shadcn + Motion 14, wrapped in Capacitor 8 (judge scores 6, 8, 7.5) | 7.17 |
| SvelteKit 3 + Svelte 5, prerendered web + SPA shell in Capacitor 8 (judge scores 7, 7, 6.5) | 6.83 |
| Expo SDK 58 universal app with Expo Router static web, EAS (judge scores 6.5, 5.5, 5) | 5.67 |
| Flutter 3.47 native apps + Jaspr static SEO site (judge scores 7.5, 4, 4) | 5.17 |

## Stack

| Layer | Choice | Why |
|---|---|---|
| Monorepo and language | pnpm 10.28 workspaces (existing). TypeScript 7.0.2 in packages. Node 24 LTS (Astro 7 needs Node 22.22 or newer; update .nvmrc). apps/web pins TypeScript 6 only for `astro check`, because @astrojs/check declares a TS ^5/^6 peer. | Already in place and tested. One language for the web, the apps, the Worker and the scripts. |
| Calculation engines | Existing @hisab/core: 34 tool modules plus 8 lib modules, tested with Vitest 5.0.5. New engines still to add: income tax (with freelancer mode), electricity bill, name spelling, MFS comparison helper and search intent. | Already written under the 'no hard-coded rates' rule. The web, the apps, search answer cards and the future admin all call the same functions, so numbers can never disagree. |
| Data | data/*.json Facts {value, source, checked}, validated by the existing fact.schema.json and check-data.mjs. check-data keeps its warning at 60 days; add a hard fail at 120 days. Add per-file JSON Schemas compiled with ajv 8.20 in standalone mode (no eval inside the app), plus sanity bounds such as 'cash-out per 1000 between 0 and 50'. | Keeps the owner's Git workflow. One pipeline feeds the static web HTML, the snapshot bundled in the app, the runtime data sync and the change log. |
| Web framework | Astro 7.4.0 (exact pin), output 'static', i18n routing with Bangla at the root and English under /en/. Also @astrojs/preact 6.1.0 and @astrojs/sitemap 3.7.4. .astro files stay thin page shells (head, meta, JSON-LD, island directives). | Pages ship zero JS by default and are full HTML, the best SEO and Core Web Vitals profile for low-end phones. Cloudflare owns Astro and it stays MIT-licensed. |
| UI components | Preact 10.29.8 (pinned; move to 11 after it matures) with @preact/signals 2.11.3. Shared state lives in module-level signal stores, so nanostores is not needed. packages/ui holds the 60+ components. packages/pages holds pure page-body components that receive data through props. | About 5 KB runtime with JSX, which the agent writes most reliably and which Figma MCP's React+Tailwind output maps onto almost directly. The same component is rendered to zero-JS HTML on the web and mounted from live data in the app. |
| App shell (single-page app) | apps/app: Vite 8.3.4 + Preact single-page app with the preact-iso 2.12.2 router (lazy routes). It composes the same packages/pages bodies and reads data from the runtime data store. | Capacitor serves index.html for any path without an extension (confirmed in the Android and iOS source), so a single-page app is the natural fit. It avoids the build.format 'file' and ClientRouter gotchas, keeps the tab bar persistent, and lets brand-new guides appear as data-only routes. |
| Styling and tokens | Tailwind CSS 4.3.3 through @tailwindcss/vite. The @theme block is generated from packages/tokens/src/tokens.json by extending build.mjs. Colours stay as hex CSS variables with light and dark sets plus a [data-theme] override. Container queries handle tablet. stylelint 17 rules: transitions only on transform and opacity, and no color-mix() or opacity modifiers on token colours, for older WebKit. | One source of truth from Figma. Purged CSS is about 8-15 KB gz. Avoiding colour features that need iOS 16.4 keeps styling safe on older Safari. |
| Fonts | Self-hosted woff2 subsets (Bengali + Basic Latin + digits + ৳) built in CI with fonttools from @fontsource 5.3 sources. Anek Bangla in one or two heading weights, Noto Sans Bengali 400/600 for body, IBM Plex Mono for Latin digits only. Bangla digits and ৳ fall back to Noto Sans Bengali with tabular-nums. font-display swap, and only the body font is preloaded. | Fonts are the largest first-visit cost (about 150-200 KB, cached immutably afterwards). IBM Plex Mono has no Bengali digits or ৳, so the fallback is required. |
| Animation | CSS transitions plus motion tokens. Web pages use cross-document View Transitions. The app uses document.startViewTransition with a CSS keyframe fallback. motion 14.4.0 is used only through its vanilla animate() for number count-ups, springs and list reordering (FLIP), with an exact pin and 12.x as the fallback. Haptics come from @capacitor/haptics. | Polished hover, press and page motion for almost no JS, running on the compositor. Lite and reduced-motion modes protect weak GPUs. |
| Native shell | Capacitor 8.5.3. Android: minSdk 24, target/compile SDK 36. iOS deployment target 16.4 by default (15.0 if the owner wants iPhone 6s/7/SE-1). Swift Package Manager. Assets are bundled, with no server.url. The generated android/ and ios/ projects are committed. | Offline from first launch, a 5-9 MB download, and native project files edited as text and compiled in CI. |
| Native plugins | @capacitor/app 8.1.2, share 8.0.3, filesystem 8.1.5, preferences 8.0.1, haptics 8.0.2, local-notifications 8.3.1, browser 8.0.5, keyboard 8.0.6, network 8.0.1, status-bar 8.0.4, splash-screen 8.0.2, text-zoom 8.0.1, SystemBars (core); @capacitor-firebase/messaging 8.5.2, @capacitor-firebase/crashlytics 8.5.2, @capgo/capacitor-printer 8.1.8, @capawesome/capacitor-app-shortcuts 8.0.3, @capacitor-community/in-app-review 8.0.0; @capacitor/assets 3.0.5 for icons and splash. capacitor-widget-bridge 8.1.0 is held back for a WidgetKit escalation if Apple asks for more. | These give the app real native value under Apple 4.2. All are maintained 8.x releases and none needs custom Swift or Kotlin for v1. |
| Platform adapter | packages/platform: share(), haptic(), print(), notify(), store(), openExternal() and network(). There is a Capacitor implementation and a web fallback (navigator.share, window.print, localStorage/IndexedDB, Web Push). | Components never import Capacitor directly, so almost every feature can be tested in Chromium inside the container. |
| On-device storage | App: @capacitor/preferences for settings, favorites, recents, saved results and checklist progress, and @capacitor/filesystem (Directory.Data) for the synced data cache. Web: localStorage plus IndexedDB, behind the same store API. | No login, and nothing leaves the device. Native Preferences avoids iOS evicting WebView storage. |
| Search | MiniSearch 7.2.0 index built at build time over tools, guides, FAQ answers and banks, loaded lazily when the search box gets focus. A Bangla normalizer (digits, ZWJ/ZWNJ/hasanta, kar/phala variants). The Banglish transliteration and synonym map lives in data/search/synonyms.json. An intent parser handles 'bkash cash out 5000', 'bikash 5k' and 'বিকাশ ক্যাশআউট ৫০০০' and calls @hisab/core to fill an answer card. | Works offline with no server cost. The synonyms are data, so search quality improves without an app release. |
| Share, print and PDF | A Canvas 2D renderer draws the 1080x1080 result card after document.fonts.ready. Web shares it with navigator.share({files}) or offers a download. The app writes it to the Filesystem cache and opens @capacitor/share. Share links store inputs in query parameters while the canonical URL stays clean. Printing uses print CSS (A4, page breaks): window.print on web and @capgo/capacitor-printer printWebView in the app, where the system print dialog offers Save as PDF. | The browser and OS shape Bengali conjuncts correctly; jsPDF and pdf-lib do not. Canvas avoids the html-to-image foreignObject quirks seen in WKWebView. |
| Offline web | A workbox-build 7.4.1 service worker generated after the build. It precaches formula-tool pages, JS, CSS and font subsets, and uses stale-while-revalidate for /data/*, with an offline page and an update prompt. The app has no service worker because everything is already local. | @vite-pwa/astro only declares support up to Astro 5, so a direct workbox-build step is the dependable route. |
| Hosting and CDN | Cloudflare Pages (free), deployed by GitHub Actions with wrangler 4.151 direct upload (so Pages' build quota is not used). Static files: _headers (immutable hashed assets, a short cache on the manifest, CORS on /data/* for capacitor://localhost and https://localhost, the AASA content-type), _redirects for old MVP URLs, /.well-known/apple-app-site-association and assetlinks.json, robots.txt, ads.txt. | $0 hosting with unlimited static bandwidth. About 1,000-2,500 files is well under the 20,000-file limit. Because the output is plain static files, a later move to Workers static assets is trivial. |
| Backend | One Cloudflare Worker, with no database in v1. /api/report and /api/contact create GitHub Issues in a private 'inbox' repo through a fine-grained token; GitHub then emails the owner. Spam protection is Turnstile on web and a rate-limit binding plus honeypot and size caps in the app. /api/alerts/web subscribes and unsubscribes a web FCM token to and from topics on the server side. D1 is optional for later. | No server state to run. It avoids D1's hard-enforced free-tier limits and the Worker's per-request fan-out limit (50 subrequests). |
| Push and rate alerts | Firebase Cloud Messaging on the free Spark plan. Apps subscribe to topics such as mfs.bkash.cashout or gold.22k on the device. Web tokens come from the firebase 13 JS SDK, loaded only when the alert sheet opens, and are subscribed to the same topics through the Worker. On a data merge, a GitHub Action sends FCM HTTP v1 topic messages for the changed Facts, plus a silent 'data-updated' message. | One message per topic, whatever the subscriber count. No user database, no accounts, $0. |
| CI/CD | GitHub Actions (public repo recommended). Ubuntu jobs: typecheck, Vitest, check-data, builds, Playwright (Chromium + WebKit + Firefox), Lighthouse CI 0.15.1, Pages deploy, Android AAB plus a KVM emulator smoke run with screenshots, daily source monitor, data release and push. macos-26 jobs: the released (non-beta) Xcode 26.x, iOS archive, simulator screenshots, TestFlight upload with an App Store Connect API key, triggered on tags or manual dispatch. Codemagic is a backup lane only. | The agent can read every log and artifact through gh. Expo, Codemagic, dl.google.com and the Playwright CDN are blocked from the container, so GitHub is the reliable loop. |
| Testing | Vitest 5.0.5 (engines, search corpus, manifest and signature), Playwright 1.64.1 at 360/390/768/1024/1440 in both themes, @axe-core/playwright 4.14.0, @cloudflare/vitest-pool-workers 0.23.0 for the Worker, and Lighthouse CI budgets. Figma frame baselines are fetched once and committed under design/baselines. | Makes up for having no devices with automated, screenshot-producing checks. Computed-style assertions are more reliable than strict pixel diffs against Figma's renderer. |
| Monitoring | Cloudflare Web Analytics (cookieless), Google Search Console with CrUX data, and Firebase Crashlytics for native crashes plus JS errors logged as non-fatals. | Safari Web Inspector needs a Mac. Remote error logging is how iOS-only bugs get seen. |
| Ads | Web: AdSense mobile banner, 300x250 and leaderboard in fixed-size reserved slots, injected after idle or first interaction and never above the result. Apps: no ads in v1. Later option: @capacitor-community/admob 8.2.1 with UMP consent. | Protects LCP, CLS and INP on low-end phones, and keeps app review and privacy labels simple. |
| Code updates over the air | None in v1; data-only updates. Self-hosted @capgo/capacitor-updater stays a possible later add-on for bug fixes only. | Apple enforced guideline 2.5.2 more strictly in 2026, and monthly rates don't need code updates. |
| Admin dashboard (later) | Stage A: Sveltia CMS 0.248 at /admin behind Cloudflare Access, editing data/*.json through pull requests. Stage B: a Preact admin app reusing packages/ui, behind Access, that reads the GitHub inbox through the Worker. | Git stays the source of truth, so validation, the change log, data sync and push all keep working with no rework. |

## Not chosen

- **React 19 + React Router 8 + Tailwind 4/shadcn + Capacitor 8 (avg 7.17)**: Runner-up. Very close on build velocity, but it carries the heaviest web JavaScript of the Capacitor options (about 98 KB brotli baseline, about 141 KB gzip on a calculator page), which falls on the Google-search majority using low-end Android. It also has more dependencies to keep updated (React Router's framework mode has a history of churn, vaul is stale, and it adds html-to-image and jsPDF). Kept as the fallback.
- **SvelteKit 3 + Svelte 5 + Capacitor 8 (avg 6.83)**: A clean dual build, but every page is fully hydrated (55-90 KB) against Astro's 0-20 KB. SvelteKit 3.0 was released on 2026-10-01, after the agent's training data, so code drift is likely. It declares a TypeScript ^6 peer while the repo uses TS 7. Figma's React+Tailwind output has to be translated into Svelte for every component. It also contained two factual errors: that the WebView API for Ads is Android-only, and that FCM web topics are impossible.
- **Expo SDK 58 universal app (avg 5.67)**: It gives the best in-app feel, but the worst web experience on the main traffic channel: about 232 KB brotli of framework JS and a 0.6-1.0 s hydration long task, so calculators become interactive after about 2.5-3.5 s on 4G. The app is the largest (15-25 MB). It has an iOS 16.4 floor and its EAS free tiers cap out. api.expo.dev is blocked from the agent's container, so the agent cannot run or observe builds.
- **Flutter 3.47 apps + Jaspr static site (avg 5.17)**: Smooth native apps, but every one of the 60+ components and every Figma change is built twice, in Flutter and in Jaspr, which is 1.6-1.8 times the UI work, and the two will drift. The main traffic channel would depend on Jaspr, which is pre-1.0 and has essentially one maintainer. It discards the existing TypeScript core (about 5,200 lines plus about 3,200 lines of tests, not the 1,925 lines it claimed). Codemagic logs are unreadable from the container, and Bangla PDF depends on a tiny community package.

## App Store and Play review

APPLE (guideline 4.2: 'elevate it beyond a repackaged website'; 4.2.2: no 'web clippings, content aggregators, or a collection of links')

1. It is not a website in a frame.
- All HTML, JS, fonts and data are bundled. There is no server.url and allowNavigation is empty, so the app never loads the website.
- All calculators, banks, guides and saved items work in airplane mode from first launch, which reviewers test.
- Source and remittance links open in SFSafariViewController (@capacitor/browser) behind a disclaimer sheet, never in the main view.

2. Native features a website cannot match, each visible within the first minute:
- Sehri/iftar local-notification reminders for a chosen district.
- Push rate alerts (FCM through APNs) per item.
- Native share sheet carrying a generated 1080x1080 PNG.
- Native print and Save-to-Files for EMI schedules, invoices and checklists (printWebView).
- Haptics on calculate, toggles and errors.
- Home-screen quick actions: bKash cash out, EMI, today's sehri/iftar.
- Universal Links that reopen a shared calculation with its inputs.
- In-app review prompt after repeated successful use.
- Respect for the iOS text size (text-zoom) plus the in-app large-font option, and dark mode synced with the status bar and splash.

3. App-like interface.
- Persistent bottom tab bar, with View Transition push and pop animations.
- iOS edge-swipe back through a CAPBridgeViewController subclass with allowsBackForwardNavigationGestures = true.
- Bottom sheets with drag-to-dismiss.
- Web habits switched off: no tap highlight, no long-press callouts, no text selection on chrome, controlled overscroll, no pinch zoom in the app build.
- Safe areas respected, and the keyboard accessory bar kept so the decimal pad has a Done key.
- The iOS build contains no website header or footer, cookie banner, AdSense, install-app sheet or mention of Google Play.

4. Guides are interactive, not a list of links: checklists that save progress, a step wizard and a fee calculator.

5. Metadata and IP (rules 4.1, 5.2.1, 2.3.7).
- Name হিসাব খাতা with an English subtitle such as 'Charge, EMI & Govt Guide'.
- No bKash, Nagad, Rocket or Upay logos or names in the icon, name, subtitle, keywords or screenshots. Brand names appear only as text inside the app and in the description, with a 'not affiliated' line.
- Category Utilities, secondary Reference, not Finance. Age rating 4+.

6. Financial rule 5.1.1(ix) and 3.2.1(viii).
- Review notes and the description state: information and calculators only; no accounts, no money movement, no loans; numbers from public sources linked inside the app.
- If a reviewer still insists, enroll as an organization (D-U-N-S is free but takes about 2 weeks and needs a trade licence) and transfer the app.

7. Privacy.
- No tracking SDKs and no ATT prompt.
- Ship PrivacyInfo.xcprivacy, with UserDefaults declared as reason CA92.1 for Preferences; Firebase SDKs include their own manifests.
- App Privacy labels: Device ID (push token) and crash data, both for App Functionality and not linked to identity.
- Privacy policy URL on the site.

8. Build requirements. Built with the released Xcode 26.x on a macos-26 runner (the iOS 26 SDK has been required since 2026-04-28; never a beta Xcode). Universal app with 6.9-inch iPhone and 13-inch iPad screenshots captured from simulators in CI with Bangla captions.

9. Review notes template.
- No login needed.
- A numbered list of each native feature and where to find it.
- An airplane-mode demo.
- The information-only statement.
- A 60-90 second screen recording made by the owner on an iPhone.

10. If rejected under 4.2.
- Reply in Resolution Center with the video.
- Ship a WidgetKit home-screen widget (today's sehri/iftar or a saved rate) using capacitor-widget-bridge 8.1.0 and a small Swift widget extension compiled in CI. This branch is prepared in phase 10 but held back.
- Budget 1-3 review rounds.
- Never remove native features in later updates, because 4.2 can be raised on every update.

GOOGLE PLAY

1. Account gate. A personal account created after 2023-11-13 needs a closed test with at least 12 opted-in testers for 14 consecutive days before it can apply for production (Help answer 14151465). Organization accounts are exempt.
- The test starts at the end of phase 4 with an early Android build. The owner recruits testers through a Google Group.
- After 14 days, answer the production-access questionnaire.

2. Technical requirements.
- targetSdk 36 (Capacitor 8 default); edge-to-edge through SystemBars and CSS env().
- Play App Signing, with the upload key and a service account held as GitHub secrets. The AAB is built and uploaded from CI.
- 16 KB page-size compliance checked in App Bundle Explorer.
- Notification permission (Android 13+) is requested only when the user turns on an alert or reminder.
- No exact-alarm permission: reminders use allowWhileIdle and the UI says 'about'.

3. Declarations.
- Data safety: device ID for push and crash logs, encrypted in transit, nothing sold or shared.
- Ads: none in v1.
- Financial features declaration: calculators and information only, no lending.
- Government information: the store listing and the app state that it does not represent a government body, and every guide links its official source.
- Content rating questionnaire.
- Target audience 18+, to stay out of Families policy scope.

4. Bundled offline content and native integrations rule out 'webview spam'. Downloaded JSON is data, so the executable-code rule does not apply.

5. Release path. Read the free pre-launch report (real devices), then release production as a staged rollout from 20% to 100%.

## Animation

MOTION TOKENS
Generated alongside the colour tokens.
- Durations: press 90 ms, release and hover 160 ms, toast 200 ms, tabs indicator 220 ms, page 240 ms, sheet 280 ms.
- Easing: ease-out cubic-bezier(.2,0,0,1) and ease-in cubic-bezier(.3,0,1,1). A spring is written with CSS linear() (Chrome 113+, Safari 17.2+) and falls back to ease-out.
- Rule enforced by stylelint: only transform and opacity are ever transitioned. Shadows animate through the opacity of a pseudo-element, never box-shadow. No backdrop-filter blur. will-change only while an animation runs.

HOVER (desktop and pointer devices only)
Applies under @media (hover:hover) and (pointer:fine), so touch devices never get stuck hover states.
- Cards lift translateY(-2px) and fade in an elevation pseudo-element.
- Buttons shift tint.
- Links animate an underline with scaleX.
- Tool icons nudge with scale(1.04).

PRESS (every pressable)
- :active applies scale(.97) plus a pressed tint over 90 ms, and releases over 160 ms. A passive touchstart listener on the document makes :active fire on iOS.
- -webkit-tap-highlight-color is transparent and touch-action: manipulation removes tap delay.
- In the app, the platform adapter adds haptics: light impact on primary buttons, selection on toggles and pickers, success on calculate and save, warning on validation errors.

FOCUS
A 2 px brand ring through :focus-visible, with an outline-offset transition, for keyboard users.

MICRO-INTERACTIONS
- Result card enters with fade and translateY(8px) over 200 ms. The main number counts up with motion's animate() (about 450 ms, formatted live in Bangla or English digits).
- Save heart does a scale pop with a spring.
- Checklist ticks draw an SVG stroke-dashoffset over 240 ms, with a haptic in the app.
- Tabs indicator slides with transform.
- Compare tray and filter/sort reordering use FLIP with motion animate() on transform, limited to the first 30 items.
- 'Best' and 'cheapest' badges fade and scale in.
- Toasts slide up above the bottom nav and are announced with aria-live.
- Skeleton shimmer is a translated gradient on a pseudo-element.
- Bottom sheets slide up with translateY 100% to 0 over the scrim fade. Drag-to-dismiss uses pointer events with a velocity threshold and rubber-banding. On desktop the sheet becomes a centred dialog that fades and scales from .96 to 1.

PAGE TRANSITIONS, WEB
- Cross-document View Transitions with @view-transition { navigation: auto } (Chrome 126+, Android Chrome, Safari 18.2+; Firefox simply navigates).
- Root crossfade plus a 16 px slide. Direction comes from view-transition types (back vs forward).
- Shared-element morph from a hub card's icon and title to the tool header via view-transition-name.
- The header and bottom nav get their own names so they stay still.

PAGE TRANSITIONS, APP
- The preact-iso navigation is wrapped in document.startViewTransition (WKWebView on iOS 18+, Android WebView 111+). Pushing a page slides from the right, going back slides right, and switching tabs crossfades as native apps do.
- Older WebKit (iOS 16.4-17) gets a CSS keyframe enter animation on the new route container.
- iOS edge-swipe back is native (WKWebView back-forward gestures). A popstate the app did not trigger itself skips the JS transition, so nothing animates twice.
- The Android back button closes an open sheet first, then navigates.

REDUCED MOTION
Triggered by prefers-reduced-motion or the in-app setting, which sets html[data-motion=reduce].
- No transforms, no count-up and no shared-element morphs.
- Only opacity fades of 100 ms or less; view transitions become a plain crossfade.
- Playwright runs with emulateMedia({reducedMotion:'reduce'}) to assert this.

LOW-END PHONES
html[data-motion=lite] is set when navigator.deviceMemory <= 2, hardwareConcurrency <= 4 or Save-Data is on.
- No shared-element morphs or shimmer.
- Page transitions become a 150 ms fade, and count-ups are capped at 300 ms.

PERFORMANCE
- Motion costs almost nothing up front: CSS is free, and motion's animate() is imported dynamically on the first result.
- Smoothness on the cheapest GPUs (Mali-G52 class) is checked by the owner on a real low-end phone in phase 7. The agent cannot measure frame rates in the container.

## Responsive layout

ONE MOBILE-FIRST LAYOUT
The 390 px Figma frames are the base layout. It is tested at 360, 390 and 414 px, because 360 is the most common low-end Android width. The 1440 px frames define the desktop layout.

BREAKPOINTS (Tailwind, in the generated @theme)
- sm 600: large phones and landscape; 2-column grids.
- md 768: tablet portrait.
- lg 1024: switch to the desktop shell.
- xl 1280.

Below lg (phones and tablets): the mobile shell.
- Bottom nav (Home, Search, All tools, Saved), 56 px plus env(safe-area-inset-bottom).
- Compact header.
- Sheets slide up from the bottom.

At lg and above (iPad landscape, laptops): the desktop shell.
- Top header nav.
- A 1080 px content column centred with auto margins, which reproduces the 1440 frame's 180 px side margins exactly.
- Sheets become centred dialogs (max 560 px) and pickers become popovers or dialogs.

TABLET (768-1023 px, no Figma frames)
These are derived rules that the owner approves in phase 3:
- Mobile navigation stays.
- Forms are capped at about 640 px and centred.
- The tool grid uses 3 columns, the bank list 2.
- Container queries decide component layout from the component's own width, not the screen's. The calculator form and result card sit side by side once their container passes 840 px, and the result card and bank card switch between stacked and row layouts. The same component therefore behaves correctly on a tablet, in a desktop sidebar and on a phone.

TABLES (EMI schedule, DPS, bank compare)
- Mobile: horizontal scroll inside the table container, with a sticky first column and header.
- Desktop: the full table.
- A test asserts the page never scrolls horizontally (scrollWidth <= innerWidth).

TYPE AND SPACING
- Token sizes from Figma in rem, on the 4 px spacing grid; headings step up at lg to match the desktop frames.
- The large-font option scales the root size to 112.5% or 125%. Layouts are tested at 125% and, in the app, at the OS text size via text-zoom.

TOUCH TARGETS
A Playwright test checks that every interactive element's hit area is at least 44x44 px, padding included.

SAFE AREAS AND NOTCHES
- Viewport meta uses viewport-fit=cover.
- The header uses env(safe-area-inset-top) for the notch and Dynamic Island.
- The bottom nav, sheets and toasts use max(8px, env(safe-area-inset-bottom)).
- Landscape adds left and right insets.
- Android 15+ forces edge-to-edge at targetSdk 35+; Capacitor 8 SystemBars plus the same env() variables handle it.
- Status bar and navigation bar icon styles follow the theme. Splash and background colours match the tokens.

KEYBOARD
- @capacitor/keyboard uses native resize on iOS and adjustResize on Android.
- The focused input scrolls into view.
- The bottom nav hides while the keyboard is open (keyboard events in the app, visualViewport on web).
- Numeric fields use inputmode=decimal and accept both Bangla and English digits.

HOVER
Hover styles apply only under (hover:hover) and (pointer:fine).

VERIFICATION
- Playwright full-page screenshots at 360x800, 390x844, 768x1024, 1024x768 and 1440x900, in light and dark, on every template.
- The 390 and 1440 shots are compared with the cached Figma baselines using computed-style checks plus the agent's visual review. Owner review covers 768 and 1024.
- In CI, the Android emulator and iOS simulator capture key screens to verify safe areas and the keyboard.

## Data updates

PRINCIPLE
Rates, charges, slabs, guides, the tools registry and search synonyms are all data. Installed apps download changed data, never code. That keeps the app outside Apple 2.5.2 and Google's executable-code rule. There are no over-the-air code updates in v1.

1. SOURCE OF TRUTH
- data/*.json Facts {value, unit?, source, checked, note?} in Git: mfs.json, banks/*.json, electricity.json, tax.json, sanchayapatra.json, remittance.json, gold.json, packs.json, guides/*.json, search/synonyms.json, registry/tools.json.
- Every edit goes through a pull request, made by the owner, the agent or the later admin CMS.

2. CHECKS ON EVERY PULL REQUEST (CI)
- check-data.mjs fails on a missing source or a bad date, warns at more than 60 days and fails at more than 120.
- ajv validates each file against its schema.
- Sanity bounds catch typos (for example, cash-out per 1000 between 0 and 50).
- A bot comment shows each changed key as old → new with its source.
- A draft change-log entry is generated in bn and en.

3. ON MERGE TO MAIN (data-release.yml)
- The web is rebuilt and deployed. Numbers are baked into the static HTML and the sitemap lastmod changes, so Google sees fresh pages within minutes.
- Content-hashed files are published to /data/v1/<name>.<sha8>.json with an immutable one-year cache.
- /data/v1/manifest.json is published as {schema:1, dataVersion:'2026-10-19.1', minAppSchema:1, files:{mfs:{path, sha256, bytes}, ...}, generatedAt}, along with manifest.sig, an Ed25519 signature whose private key is a GitHub secret.
- The manifest is cached for at most 300 s with stale-while-revalidate.
- CORS headers allow capacitor://localhost and https://localhost.
- scripts/notify-topics.mjs sends user-facing FCM topic messages for the changed Facts (for example mfs.bkash.cashout) plus a silent 'data-updated' message.

4. IN THE INSTALLED APP
- The binary ships a snapshot of every data file, so the first launch works fully offline.
- On launch, on resume (at most every 6 h, skipped when offline or in Save-Data mode) and on a 'data-updated' push, the app fetches the 1-2 KB manifest and its signature.
- It verifies the signature (WebCrypto Ed25519, or @noble/ed25519 on older WebViews), then downloads only the files whose hash changed, typically a few KB a month.
- Each file is checked against its SHA-256, the ajv standalone validators and the sanity bounds.
- The files are written to Filesystem Directory.Data under data/<dataVersion>/, and a pointer in Preferences is swapped atomically.
- The data store updates, so open screens re-render with the new numbers and 'last verified' badges. A small toast can say 'রেট আপডেট হয়েছে' (rates updated).
- On any failure the app keeps the last good copy.
- A stale badge appears when the data is more than 45 days old or any Fact's checked date is more than 60 days old.

5. GUIDES AND CONTENT
- Guides are block-typed JSON (checklist, steps, fee table and calculator, FAQ, warning, sources) rendered by generic components.
- In the app, /guides/:slug resolves from synced data, so a brand-new guide that uses existing block types appears without a release. New search synonyms and new answer-card data arrive the same way.
- A new calculator with new logic, a new native plugin or a new permission still needs a store release.

6. SCHEMA CHANGES
- Additive changes stay in v1.
- A breaking change publishes /data/v2/ alongside v1, which keeps being generated until old installs are rare.
- The minAppSchema gate makes old binaries keep their last compatible data and show an 'update the app' banner.

7. WEB
The service worker serves /data/* stale-while-revalidate. Open tabs re-check the manifest on visibilitychange.

8. MONTHLY OWNER WORKFLOW
1. The daily source-monitor workflow fetches each source URL, extracts the configured section (CSS selector, regex or PDF text) and hashes it. On a change it opens a GitHub issue listing the affected Facts. It never publishes scraped numbers automatically.
2. The owner, or the agent on request, edits the JSON with the new value, source and today's checked date in a pull request.
3. The owner checks the CI diff comment and merges.
4. The web is live in minutes. Apps update within 6 h or on the next open, sooner thanks to the silent push. Subscribed users get the rate alert.
5. Optional later: auto-merge for daily currency and gold series, only when they come from a structured official source and change by less than ±5%. This is the owner's decision.

## Repository layout

```
hisab-khata/
├─ apps/
│  ├─ web/                      # Astro 7 static site (bn at /, en at /en/) → Cloudflare Pages
│  │  ├─ astro.config.ts        # output static, i18n, preact, sitemap, tailwind vite plugin
│  │  ├─ src/pages/             # thin .astro shells per template: index, [section]/, tools/[tool]/,
│  │  │                         #   mfs/[brand]/[action]/, banks/, banks/[id]/[tab]/, banks/compare/,
│  │  │                         #   remittance/[country]/, guides/[slug]/, saved/, changelog/, en/...
│  │  ├─ src/layouts/           # Base.astro (head, meta, hreflang, JSON-LD, theme pre-paint script)
│  │  ├─ sw/                    # workbox-build config (post-build)
│  │  └─ public/                # _headers, _redirects, robots.txt, ads.txt, fonts/, .well-known/
│  ├─ app/                      # Vite 8 + Preact single-page shell → Capacitor 8
│  │  ├─ src/main.tsx           # boot: data store, platform adapter, router
│  │  ├─ src/routes.tsx         # preact-iso routes → same packages/pages bodies
│  │  ├─ capacitor.config.ts    # bundled assets, no server.url, plugins config
│  │  ├─ android/               # generated by `cap add android`, committed
│  │  └─ ios/                   # generated by `cap add ios` (SPM), committed; MainViewController.swift (swipe-back)
│  ├─ worker/                   # Cloudflare Worker: /api/report, /api/contact, /api/alerts/web
│  └─ admin/                    # LATER (optional): Sveltia CMS config, then Preact admin app
├─ packages/
│  ├─ core/                     # EXISTING @hisab/core: 34 engines + lib + Vitest (add income-tax, electricity, name-spelling)
│  ├─ tokens/                   # EXISTING @hisab/tokens: tokens.json → tokens.css (+ tailwind @theme, motion tokens)
│  ├─ ui/                       # NEW: 60+ Preact components, islands, icons, motion utilities
│  ├─ pages/                    # NEW: pure page-body components per template (data via props), shared by web + app
│  ├─ data/                     # NEW: typed loaders, ajv standalone validators, manifest builder, runtime store + sync
│  ├─ search/                   # NEW: normalizer, Banglish/synonym loader, intent parser, index builder
│  ├─ platform/                 # NEW: share/haptic/print/notify/store/openExternal/network (web + capacitor)
│  └─ i18n/                     # NEW: bn.json, en.json, route pairs for language switch
├─ data/                        # EXISTING contract
│  ├─ _schema/                  # fact.schema.json (+ per-file schemas)
│  ├─ registry/tools.json       # tool registry: id, section, tags, bn/en names, related
│  ├─ mfs.json  electricity.json  tax.json  sanchayapatra.json  remittance.json  gold.json  packs.json ...
│  ├─ banks/*.json   guides/*.json   search/synonyms.json
│  └─ changelog.json            # generated
├─ design/
│  ├─ baselines/                # Figma frame PNGs (390/1440, light/dark), fetched once and committed
│  └─ figma-map.json            # frame id → route / overlay / state / theme / width
├─ scripts/                     # EXISTING check-data.mjs + build-manifest.mjs, sign-manifest.mjs, changelog.mjs,
│                               #   notify-topics.mjs, source-monitor.mjs, subset-fonts.mjs, capture-store-shots.mjs
├─ tests/
│  ├─ e2e/                      # Playwright: tools, flows, offline, share-link, print
│  ├─ visual/                   # gallery + templates at 5 viewports × 2 themes
│  ├─ seo/                      # mvp-baseline.json, crawl-diff, hreflang/sitemap checks
│  └─ search-corpus.json        # 200+ queries → expected hits/answers
├─ .github/workflows/           # ci.yml, deploy-web.yml, data-release.yml, source-monitor.yml, android.yml, ios.yml
├─ docs/                        # decisions.md, data-update-runbook.md, release-runbook.md, review-notes.md
├─ package.json  pnpm-workspace.yaml  .nvmrc (24)  renovate.json
```

## Dashboard later

The dashboard plugs in later without rework, because everything in v1 already treats Git as the source of truth and runs off the same Worker and components.

ADMIN DASHBOARD, STAGE A (about a day of work)
- Sveltia CMS 0.248 (or Decap 3.17) is added at /admin on the same Pages site, protected by Cloudflare Access (free for up to 50 users, login with your Gmail by one-time PIN).
- It edits data/*.json and guides through pull requests, using the existing schemas for its form fields.
- Merging a pull request runs the same pipeline as today: check-data, ajv and sanity bounds, change log, web rebuild, signed manifest, app data sync and FCM rate alerts. Nothing in the web, app or data code changes.

ADMIN DASHBOARD, STAGE B (when wanted)
apps/admin is a small Preact app reusing packages/ui (tables, forms, sheets) and @hisab/core (to preview results with the new numbers), served behind Cloudflare Access. It shows:
1. A data-freshness table built from the manifest and the checked dates, with a 'mark verified today' button that opens a pull request.
2. The error-report and contact inbox, read from the private GitHub inbox repo through a Worker route.
3. Source-monitor alerts, which are GitHub issues.
4. Alert topics and recent sends.
5. Optionally, zero-result search queries.
D1 is added only if reports need queries GitHub cannot do. The Worker already exists, so this is new routes only.

USER DASHBOARD
- Without login, a 'My Hisab' page combines Saved results, Favorites, Recents, checklist progress and alert or reminder subscriptions. All of it is already stored on the device by the v1 store API, so it is a new page template in the same component system.
- Cross-device sync would need user accounts. That is a deliberate scope change (privacy policy, store forms, a backend database), not a dashboard add-on, and nothing in v1 blocks it.

## Build plan

### Phase 1: Foundation (repo, tokens, CI, Figma baselines), about week 1

A working monorepo skeleton that deploys a preview the owner can open, with the Figma tokens wired in and every check automated from day one.

Deliverables:

- apps/web (Astro 7.4.0 static, bn root + /en/, Preact integration) and apps/app (Vite 8 + Preact + preact-iso), both rendering a token showcase page
- New packages ui, pages, data, search, platform and i18n; the existing packages/core and packages/tokens wired in as they are (no re-port)
- packages/tokens/build.mjs extended to emit a Tailwind @theme and motion tokens next to tokens.css; scripts/subset-fonts.mjs produces Bangla/Latin woff2 subsets
- design/baselines/: every Figma frame screenshot fetched once through Figma MCP, spread across days to stay within rate limits, plus design/figma-map.json mapping each frame to its route, state, theme and width
- CI: ci.yml (typecheck, Vitest on @hisab/core, check-data, tokens --check, builds, Playwright Chromium; WebKit and Firefox on CI only) and deploy-web.yml (wrangler direct upload; one preview URL per branch)
- Node 24 LTS in .nvmrc, exact version pins, a Renovate config (weekly, grouped), and docs/decisions.md recording the stack, versions and iOS minimum

Owner:

- Decide: public or private GitHub repo (public recommended for free macOS CI); individual or organization developer accounts; iOS minimum 16.4 (default) or 15
- Buy the .com domain at Cloudflare Registrar, create the Cloudflare account, and add a Cloudflare API token (Pages edit) as a GitHub secret
- Start Apple Developer and Google Play Console enrollment now, because identity checks take days. Have an international-enabled (dual-currency) card ready.
- Confirm the Figma file is in the team where you have a Full seat (a View seat allows only a few MCP calls a month) and share its URL
- Share the live MVP URL, its sitemap and its source repo
- On Grameenphone, Robi and Banglalink mobile data, open https://<preview-url>/cdn-cgi/trace and send the 'colo=' line, which shows whether Cloudflare serves you from Dhaka or Singapore

Verified by: CI is green on the first pull request. A Playwright computed-style test asserts that the CSS variables equal tokens.json (for example --brand-accent = #9e1f2a in light and #ef7480 in dark). Showcase screenshots are taken in both themes, and a check confirms the baseline manifest lists every Figma frame. The owner opens the preview URL on a phone.

### Phase 2: Foundation (component library from the Figma design system), weeks 2-3

All 60+ Figma components, with every variant, built once in Preact and reviewable in a gallery, including the motion system.

Deliverables:

- packages/ui components with all variants: Button, IconButton, Chip, Card, ToolCard, NumberField (accepts Bangla and English digits), Select, SegmentedControl, ResultCard, BreakdownTable, Verified badge (date + source), Tabs, BottomSheet/Dialog (focus trap, drag-to-dismiss), generic searchable Picker, DatePicker (Bangla and English digits), Toast, Skeleton, EmptyState, Banner (offline/stale), BottomNav, TopHeader, Breadcrumb, ShareBar, AdSlot, FAQ accordion, Checklist, Stepper
- Motion system: press, hover, focus, sheet, toast, tabs and skeleton behaviour, plus data-motion=lite and data-motion=reduce modes
- A /dev/gallery route in both the web and app builds showing every variant in light and dark
- Tests: tap targets at least 44 px, axe-core, keyboard focus traps for sheets and pickers, reduced-motion behaviour, and a stylelint rule allowing transitions only on transform and opacity

Owner:

- Open the gallery preview on your phone and desktop; comment on anything that differs from Figma (as pull request comments or one list)
- Approve how Bangla-digit numbers look (IBM Plex Mono has no Bangla digits or ৳, so they fall back to Noto Sans Bengali with tabular figures)

Verified by: Playwright gallery screenshots at 390 and 1440 px in both themes are compared side by side with the cached Figma component screenshots, using the agent's visual review with a loose pixel tolerance. Computed-style assertions check font family, size, line-height, radius and token colours. axe-core must report zero serious violations, and the tap-target, focus and reduced-motion tests must pass.

### Phase 3: App shell, navigation, states and page transitions, weeks 3-4

Every page template exists in both shells (Astro web and app) with responsive layouts, navigation, themes, language and page transitions.

Deliverables:

- Mobile shell (bottom nav, below 1024 px) and desktop shell (top header, 1080 px column), tablet rules and safe-area handling
- About 30 page templates written as pure page bodies, each with a thin Astro shell and a matching app route: Home (search hero placeholder), 6 section hubs, All Tools (filter island), Saved (on-device), About, Privacy, Contact, Disclaimer, Change log, English home, and 404, offline, stale, loading and empty states
- data/registry/tools.json driving the hubs, All Tools, related tools and later search
- Page transitions: cross-document View Transitions on the web, startViewTransition plus a CSS fallback in the app, with direction-aware push, back and tab animations
- Theme toggle with a pre-paint script (no flash), Bangla/English digits toggle, large-font option, and a language switch to the paired /en/ URL
- A route-parity test that fails if any web template lacks an app route

Owner:

- Review the preview at phone, tablet and desktop sizes and approve the tablet layout rules (there are no Figma tablet frames)
- Confirm the navigation feel on your phone browser (transitions, back behaviour)

Verified by: Playwright takes full-page screenshots at 360, 390, 768, 1024 and 1440 px in both themes and compares the 390 and 1440 shots with the Figma baselines. A test asserts no horizontal scroll. The app shell runs under vite preview through the same e2e suite at 390 px. The view-transition smoke test must show no console errors, and the reduced-motion test must pass.

### Phase 4: MVP parity and web cutover (SEO-safe), weeks 4-5

The new site replaces the MVP on the production domain with no ranking loss, and the Play 14-day closed-test clock starts.

Deliverables:

- mfs.json with Facts for all 7 MVP providers; MFS brand × action pages (bKash, Nagad, Rocket, Upay × cash out, send money, cash in, bill pay, limits), each with a worked example and an amount table rendered into the HTML
- EMI, DPS and FDR pages on the existing engines; golden fixtures captured from the MVP over an input grid prove identical outputs
- SEO: Bangla-first titles and meta, canonical, hreflang bn/en/x-default, JSON-LD (BreadcrumbList, WebApplication, FAQPage kept), sitemap with lastmod from checked dates, robots, and _redirects for every changed MVP URL
- tests/seo/mvp-baseline.json plus a CI test that fails if any MVP URL returns 404 or loses its title or H1
- AdSlot component (reserved size, loaded on idle), Cloudflare Web Analytics, and a privacy policy updated for ads and analytics
- A first minimal Android build (Capacitor shell with the MVP tools), built as an AAB on GitHub Actions and uploaded to Play closed testing

Owner:

- Compare the preview with the live MVP and approve the cutover (switch the production domain to the new Pages project)
- Add the site to Google Search Console, submit the sitemap, and apply for AdSense
- In Play Console: create the app, complete the App content forms (privacy policy URL, ads: no, data safety draft, content rating, target audience 18+), and create the upload key and service account (the agent gives exact steps)
- Recruit 12 or more testers into a Google Group and opt them into the closed test; they must stay opted in for 14 consecutive days

Verified by: Golden tests run in Vitest. A Playwright crawl-diff compares the MVP and the preview: status codes, titles, canonicals, H1s, JSON-LD parse and calculator outputs. Lighthouse CI on the slow-4G mobile profile must meet LCP 2.5 s or less, CLS 0.05 or less, and JS 50 KB gz or less per page excluding ads. After cutover the agent re-crawls production. The Android job uploads emulator screenshots as an artifact that the agent reads with gh.

### Phase 5: About 50 calculators and tools, with share, save and print, weeks 5-8

Every calculator, converter and text tool is live on the web (and in the app shell), with results that can be saved, shared as an image or link, and printed.

Deliverables:

- One ToolPage template plus a per-tool config (inputs, result fields, Facts used, FAQ copy, related tools) for all ~50 tools, using the existing engines
- New engines with tests: income tax (fiscal year 2026-27, including freelancer mode), electricity bill (BPDB, DPDC, DESCO, NESCO, WZPDCO, BREB slabs), name spelling checker (curated dictionary), MFS comparison
- Fact files: tax.json, electricity.json, sanchayapatra.json, gold.json, packs.json, fitra and zakat nisab inputs, job age limits, land units, grade tables, courier zones, Ramadan schedule by district
- 1080x1080 Canvas share card; share links that restore inputs (canonical stays clean); saved results, favorites and recents on the device
- Print layouts for the EMI schedule, DPS table, mess hisab, invoice (logo stays on the device) and checklist

Owner:

- Verify every new Fact (value, official source URL, checked date) in the checklist on each data pull request; you are responsible for the numbers. Supply official sources where the agent's fetch is blocked.
- Review tools in batches of 5-10 on your phone and leave comments

Verified by: Vitest runs per engine, including hand-checked or official worked examples and the Figma example values. Playwright e2e runs per tool: fill inputs, then expect the formatted result in Bangla and English digits. The share card PNG is snapshotted and the agent inspects Bangla conjunct shaping. Each print view is rendered with page.pdf(), converted to PNG and inspected. Share-link round-trip and storage persistence tests must pass.

### Phase 6: Banks, MFS compare, remittance, guides and wizard, weeks 7-9

All comparison sections and government-task guides, with their pickers, trays and interactive guide features.

Deliverables:

- banks/*.json for about 60 banks (loan, DPS, FDR, account and card Facts); bank list with filters, sort and a compare tray (maximum 3, toast on the 4th, FLIP animation); one web page per bank tab (/banks/{id}/{tab}/); bank compare page with a shareable URL
- MFS comparison with a 'cheapest' badge; remittance.json plus a compare by country, amount and method with a 'best' badge and an outbound-link sheet that carries a disclaimer
- guides/*.json in a block schema for NID correction, e-passport, birth registration, driving licence, namjari, wrong-number money, bKash to bank, Saudi to bKash, hundi danger and account hacked, plus category hubs (legal papers, education, expatriate)
- Guide checklist with progress saved, numbered steps, fee calculator and FAQ; a step-by-step wizard driven by a decision tree in the guide JSON
- All 8 pickers wired to data (country, district, land unit, grade, date, electricity company, sanchayapatra type, currency)

Owner:

- Check the guide content against official sites (fees, documents, steps) and approve the wording of the safety guides (hundi danger, account hacked)
- Spot-check bank data; decide whether launch needs all 60 banks or the top 25 first

Verified by: Schema validation runs for banks and guides. Unit tests cover the compare and 'best' logic. Playwright e2e covers the tray limit, filters and sort, wizard paths, checklist persistence and the outbound sheet. Visual checks compare against the baselines at 390 and 1440 px in both themes.

### Phase 7: Smart search, offline web, English, accessibility and performance, weeks 9-10

Search answers Bangla, Banglish and English queries with direct answer cards. The web works offline for formula tools. English is complete, and the site is accessible and fast on low-end phones.

Deliverables:

- packages/search: normalizer, data/search/synonyms.json, an intent parser (MFS brand + action + amount, EMI, gold, land units) and an answer card computed by @hisab/core; the index loads lazily on focus
- Workbox service worker: precached formula tools, stale-while-revalidate data, offline page, update prompt
- Full /en/ coverage with hreflang pairs
- Accessibility pass: labels, aria-live results, lang attributes, focus order, large font, screen-reader names
- Low-end motion mode tuned; Lighthouse CI budgets enforced on every pull request
- Optional (if the owner agrees): anonymous logging of zero-result queries (text only) to the Worker, to tune synonyms

Owner:

- Try 30 or more real searches the way people actually type (Banglish, typos, mixed digits) and send the misses
- Test the site on your cheapest Android phone on mobile data and report anything slow or janky (ideally a 2-3 GB RAM phone)

Verified by: A Vitest query corpus of 200 or more queries (for example 'bkash cash out 5000', 'bikash 5k', 'বিকাশ ক্যাশআউট ৫০০০', 'nogod send money') checks the expected top-3 hits and the answer values. A Playwright offline test visits a page, goes offline, reloads a tool and computes a result. Sitemap and hreflang are validated, axe-core runs on every template, and Lighthouse CI budgets must pass.

### Phase 8: Data pipeline and tiny backend, weeks 10-11

Monthly data updates, the change log, source monitoring, error reports and rate alerts all run automatically for $0.

Deliverables:

- build-manifest and sign-manifest scripts (hashed /data/v1 files, Ed25519 signature); the runtime data store with verify, validate and atomic swap
- Change-log generator (bn and en) feeding the /changelog page and an RSS feed; a pull-request bot comment showing old → new values; check-data hard fail at more than 120 days
- source-monitor.yml (daily cron that opens an issue when a source changes) and data-release.yml (deploy, manifest, FCM topic sends)
- Cloudflare Worker: /api/report and /api/contact create issues in a private inbox repo (Turnstile, rate limit, honeypot); /api/alerts/web subscribes web tokens to topics. The topic-management endpoint is verified first; if it is unavailable, the fallback is per-token storage in D1.
- Firebase project with the web rate-alert sheet (lazy-loaded SDK) and the report-error sheet prefilled with page, data key and app version

Owner:

- Create the Firebase project and a service account, the private inbox repo, a fine-grained GitHub token (issues on that repo only) and a Turnstile site; add them as secrets (the agent gives exact steps)
- Generate the Ed25519 key pair with the command the agent provides and store the private key as a GitHub secret
- Subscribe your own browser to a 'test' alert topic

Verified by: Unit tests cover the manifest builder, signature verification, rejection of tampered files and rejection of a newer schema. Worker tests run in @cloudflare/vitest-pool-workers. A rehearsal changes a Fact on a branch: the preview manifest diff appears, and a test push reaches the owner's browser. A dry run of the source monitor opens a test issue.

### Phase 9: Native apps (Capacitor shells, native features, CI builds, internal testing), weeks 11-13

Real Android and iOS apps that are offline, app-like and native-integrated, delivered to the owner through Play internal testing and TestFlight.

Deliverables:

- capacitor.config with bundled assets, no server.url and no allowNavigation; android/ and ios/ committed; icons and splash from @capacitor/assets; SystemBars, status bar theming and safe areas
- App feel: Android back button closes sheets first; iOS swipe-back through a MainViewController subclass; web habits switched off; keyboard handling; haptics
- Native features: data sync (launch, resume, silent push), Preferences storage, sehri/iftar local reminders by district, FCM rate alerts, share image file, native print, quick actions, Universal Links and App Links (AASA and assetlinks.json), in-app review, Crashlytics
- android.yml: AAB build, KVM emulator smoke flow with screenshots, upload to internal and closed tracks
- ios.yml on macos-26: released Xcode 26.x, archive and export, simulator screenshots of key flows in both themes, TestFlight upload with the App Store Connect API key

Owner:

- In Apple's portal: create the App ID with the Push Notifications and Associated Domains capabilities, an APNs key (upload it to Firebase) and an App Store Connect API key (add it as a GitHub secret)
- Install the TestFlight and Play internal builds and run the device checklist: airplane mode, reminders, alerts, share to WhatsApp, Save as PDF, opening a shared link from WhatsApp, swipe back, numeric keyboard, dark mode, large text, Android back button
- Report results with screenshots or screen recordings

Verified by: The agent downloads the CI artifacts (emulator and simulator screenshots) with gh and inspects them. TestFlight processing must succeed with no privacy-manifest warnings. The Play pre-launch report (real devices) and the owner's device checklist results are reviewed.

### Phase 10: Store hardening and listing assets, weeks 13-14 (while the 14-day closed test runs)

Everything Apple and Google need for a first-try approval is ready: metadata, screenshots, declarations, review notes and an escalation branch.

Deliverables:

- Store listings in bn and en (name হিসাব খাতা, subtitle, description with a non-affiliation disclaimer, no brand logos or brand names in the name, icon or keywords)
- Screenshots: 6.9-inch iPhone, 13-inch iPad, Android phone and tablet, generated from CI simulators and emulators with Bangla captions, plus a dimension-check script
- Privacy policy and disclaimer updated for the apps, push and on-device storage; PrivacyInfo.xcprivacy; App Privacy label answers; Play Data safety, Financial features (calculators only) and government-information disclaimer
- docs/review-notes.md listing each native feature and where to find it, an airplane-mode demo and the information-only statement
- A WidgetKit widget branch (capacitor-widget-bridge plus a Swift extension compiled in CI), prepared but not shipped

Owner:

- Record a 60-90 second screen video on your iPhone: airplane-mode calculators, a reminder, sharing an image, Save as PDF
- Paste the agent-prepared answers into App Store Connect and Play Console; confirm the support email and URL (Cloudflare Email Routing to your Gmail is free)

Verified by: The agent checks every item against Apple guidelines 4.2, 4.2.2, 5.1.1(ix) and 5.2.1 and the Play policy items. Screenshot dimensions are validated. App Store Connect must show no metadata or privacy warnings. The widget branch must compile on macos-26.

### Phase 11: Store submission and launch, weeks 14-16

Both apps are live in the stores, and the first monthly data update is proven to reach installed apps without a release.

Deliverables:

- Play: production access application after 14 days of closed testing, then a staged rollout from 20% to 100%
- Apple: submission with review notes and video; Resolution Center replies; the WidgetKit escalation shipped only if the app is rejected under 4.2
- Install-app sheet and Smart App Banner switched on for the web (links to both stores)
- A launch rehearsal of the monthly data update: change one Fact, merge, and confirm that installed apps show the new value and the alert arrives
- Monitoring runbook: Search Console and Core Web Vitals, Crashlytics, the error inbox, stale-data warnings

Owner:

- Press the submit buttons; answer Google's closed-test questionnaire honestly; reply to Apple's reviewer if asked (the agent drafts the replies)
- Announce the launch; keep the monthly data-verification routine going (about 1-2 hours a month)

Verified by: Both store listings are live. The rehearsal must show the changed value on the owner's installed apps within one launch, with no new release, and the rate alert must be received. Real-user Core Web Vitals are watched in Search Console and Crashlytics should show no new crash clusters.

## Accounts and costs

| Item | Cost | When |
|---|---|---|
| Domain (.com) via Cloudflare Registrar (at-cost pricing) | About US$10-11 per year | Phase 1 |
| Apple Developer Program (individual; organization needs a D-U-N-S number, free but slow) | US$99 per year (pay with an international-enabled dual-currency card) | Start enrollment in phase 1; needed by phase 9 |
| Google Play Console (personal account, needs identity verification; 12 testers for 14 days before production) | US$25 one-time | Register in phase 1; closed test starts at the end of phase 4 |
| GitHub (repo, Actions CI including macos-26 iOS builds, Issues inbox) | $0. A public repo gets unmetered standard runners including macOS. A private repo gets 2,000 minutes a month, with macOS counted at 10x (about 200 macOS minutes). | Phase 1 |
| Cloudflare: Pages, Workers, Turnstile, Web Analytics, Email Routing, Access (up to 50 users) | $0 on free plans; Workers Paid at $5/month only if free limits are ever exceeded | Phase 1 (Pages); phase 8 (Worker, Turnstile); later (Access for the admin) |
| Firebase project on the Spark plan (Cloud Messaging, Crashlytics) | $0 | Phase 8 (web alerts); phase 9 (apps) |
| Google Search Console and AdSense (web ads; needs approval) | $0 (AdSense pays you) | Phase 4, after the cutover |
| Figma (existing student-tier team with a Full seat; Code Connect not available) | $0 | Phase 1 onward (baselines cached in the repo) |
| Codemagic personal account (backup iOS build lane only; its logs are not readable by the agent) | $0 for 500 macOS minutes a month | Only if the GitHub macOS lane fails |
| AdMob (optional app ads later) and self-hosted Capgo (optional code updates later) | $0 | After launch, if decided |
| Optional low-end Android test phone (2-3 GB RAM) if you don't already own one | About BDT 5,000-9,000 one-time | By phase 7 (performance and animation checks) |
| TOTAL | Year 1: about US$135 (US$99 + US$25 + about US$11), plus the optional phone. Later years: about US$110 a year. | Across phases 1-11 |

## Risks

| Risk | Mitigation |
|---|---|
| Apple rejects the app under 4.2 or 4.2.2 as a 'repackaged website' (a real risk for any WebView app, and on every update, not only the first) | Bundled offline content, a visible native feature set, swipe-back and other app-like polish, no web chrome, review notes plus a demo video, a WidgetKit widget branch ready as escalation, a budget of 1-3 review rounds, and never removing native features in later updates. |
| Apple applies 5.1.1(ix) ('financial services must come from a legal entity') to an individual developer | State information-only clearly in the app, the listing and the review notes; use the Utilities category. Fallback: organization enrollment with a D-U-N-S number (free, about 2 weeks, needs a trade licence) and an app transfer. |
| Trademark or impersonation flags over bKash, Nagad, bank names or logos | No logos anywhere. Brand names appear only as text inside the app and in descriptions, never in the app name, icon, keywords or screenshots, with a non-affiliation disclaimer on every MFS or bank page. |
| Google Play's 12-tester, 14-day gate delays the Android launch | Start the closed test at the end of phase 4 with an early build so the clock runs in parallel; the owner recruits testers through a Google Group; an organization account is exempt. |
| The two rendering shells (Astro static web and the Preact single-page app) drift apart | All page bodies are shared, pure Preact components; the shells are 10-20 lines each; a route-parity test; the same e2e suite runs against both builds. React Router is the planned escape hatch if Astro 7 causes friction. |
| Very fresh major versions (Astro 7, Preact 11, Motion 14) and TypeScript 7 against @astrojs/check's TS ^6 peer | Exact pins (Astro 7.4.0, Preact 10.29.8, Motion pinned with 12.x as fallback); TypeScript 6 in apps/web only for astro check; Renovate grouped weekly with a smoke test; an Astro 6.4.8 fallback documented. |
| Cold start (about 1.2-2.5 s) and animation jank in WebViews on low-end Android | Native splash, small local bundle, lite motion mode (deviceMemory, hardwareConcurrency, Save-Data), transform and opacity only, no blur, and the owner testing on a 2-3 GB RAM phone in phases 7 and 9. |
| Tailwind 4 styling on iOS 15 and Safari 15 | iOS app minimum is 16.4 by default (the owner can choose 15). Hex colour tokens, stylelint bans on color-mix() and opacity modifiers on tokens, and Tailwind 4.1+ fallbacks keep the web usable on older Safari. |
| AdSense hurts Core Web Vitals and therefore SEO and revenue | Reserved fixed-size slots (CLS about 0), loading after idle or first interaction, never above the result, capped ad density on mobile; field Core Web Vitals watched in Search Console. |
| A wrong charge or rate damages trust or causes harm | Every number is a Fact with a source and checked date shown to users; the owner verifies data on each pull request; scraped values are never auto-published; stale badges at 45 and 60 days; a disclaimer on every page; a one-tap error report. |
| No Mac and no devices for the agent; iOS-only bugs are hard to see | Simulator and emulator screenshots from CI read through gh, Crashlytics remote JS error logging, Playwright WebKit in CI, a device checklist for the owner in every native phase, and Play pre-launch reports on real devices. |
| Figma MCP limits (about 200 calls a day on a Full seat; a View seat gets almost none), Code Connect unavailable, and the Figma REST API blocked from the container | Keep the file in the Full-seat team; fetch baselines once and commit them; no Code Connect dependency; the prototype-link map is built from frame names into figma-map.json, plus a crawl test that every in-app link resolves to a route or overlay. |
| The server-side web FCM topic subscription endpoint changes or is unavailable | Verify it in phase 8; fallback is per-token storage in D1 with batched sends from a scheduled Worker. App alerts (device-side topics) are unaffected. |
| Sehri/iftar reminders arrive a few minutes late (Android 14+ denies exact alarms by default) | allowWhileIdle notifications; the UI says 'about'; the exact time is always shown in the app. |
| The service-worker cache serves stale or broken assets on the web | Versioned precache, stale-while-revalidate only for data, an update prompt, a kill-switch SW version, and the offline e2e test in CI. |
| iOS CI minutes run out on a private repo | Public repo by default; iOS builds only on tags or manual dispatch; data-only updates keep native rebuilds to a few a month; Codemagic's 500 free minutes as backup. |
| Cloudflare's free plan routes Bangladeshi traffic through Singapore, so TTFB is higher than estimated | Measure the colo from Grameenphone, Robi and Banglalink in phase 1; static files and immutable caching keep the penalty small; LCP budgets are measured, not assumed. |

## Open questions for the owner

- What is the final domain? (The repo's schema mentions hisabkhata.app, while the brief says .com.) Is it the same domain the live MVP uses?
- Should the GitHub repo be public (free macOS CI, logs fully visible to the agent) or private (code hidden, about 200 macOS minutes a month)?
- Will you enroll in Apple and Google as an individual, or as an organization with a trade licence and D-U-N-S number? An organization skips Google's 12-tester rule and lowers the Apple 5.1.1(ix) risk.
- Which phones can you test on (Android model, RAM and Android version; iPhone model and iOS version)? Do you have an iPhone at all?
- Minimum iOS for the app: 16.4 (recommended; drops iPhone 6s, 7 and first-gen SE from the app only) or 15.0 (wider reach, stricter CSS rules)?
- No ads in the apps for v1 (recommended for review and speed), with AdMob reconsidered after launch? Is that OK?
- Can you recruit 12 or more Android testers who will stay opted in for 14 days (friends, family, a Facebook group)?
- Who verifies the numbers each month, and how much time can you give it? Should daily currency and gold rates ever auto-publish from official sources?
- Is anonymous logging of searches that returned no results (search text only, no identifiers) acceptable to improve Banglish search? It would be disclosed in the privacy policy.
- Please share the live MVP URL, its sitemap and its repo, and confirm the Figma file URL is in the team where you have a Full seat.
- Which support email and contact name should appear in the store listings and privacy policy?
- For launch, all ~60 banks and all 10 guides, or a smaller verified set first (for example the top 25 banks) with the rest added as data updates?
