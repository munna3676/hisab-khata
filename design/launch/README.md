# Launch: splash screen and app icon

From the Figma mobile page, row "লঞ্চ · স্প্ল্যাশ স্ক্রিন ও অ্যাপ আইকন" (read 2026-10-20).

| Figma frame | Node | File here |
|---|---|---|
| L1 স্প্ল্যাশ — লাইট | 106:22684 | `splash-light-ref.png` (reference render) |
| L2 স্প্ল্যাশ — ডার্ক | 106:22714 | `splash-dark-390.png` (1x) |
| L3 অ্যাপ আইকন — 1024 (iOS ও Play Store) | 106:22744 | `app-icon-1024.png` |
| L4 অ্যান্ড্রয়েড অ্যাডাপটিভ — ব্যাকগ্রাউন্ড | 106:22758 | `android-adaptive-background-1024.png` |
| L5 অ্যান্ড্রয়েড অ্যাডাপটিভ — ফোরগ্রাউন্ড (সেফ জোন ৬৬%) | 106:22759 | `android-adaptive-foreground-guide-1024.png` (has the safe-zone guide drawn in; export the foreground layer alone, transparent, before use) |
| L6 আইকন প্রিভিউ | 106:22765 | `icon-preview.png` |

## Splash design

- Background: paper (`bg/paper`) with the ruled ledger lines and the red margin line (`brand/margin`) on the left, as in the khata.
- Centre: the logo mark (red book, `brand/accent`) above the wordmark "হিসাব খাতা" (Anek Bangla, bold, `text/ink`).
- Bottom: tagline "টাকা আর সরকারি কাজের হিসাব, এক খাতায়" (`text/soft`).
- Dark: same layout on dark paper; the mark uses the dark accent (#ef7480).

## Where it is used

- Apps (phase 9): native splash for iOS (LaunchScreen storyboard) and Android 12+ SplashScreen API via `@capacitor/splash-screen` and `@capacitor/assets`, light and dark. The native splash shows the mark on the paper colour; an HTML boot screen in the app shell then shows the full design (lines, wordmark, tagline) until the first route renders, so the hand-off is seamless.
- Icons: `@capacitor/assets` generates every iOS and Android size from `app-icon-1024.png` and the adaptive background/foreground.
- Web: PWA manifest icons, `apple-touch-icon` and favicon come from the same icon.
