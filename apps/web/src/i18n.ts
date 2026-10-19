// Minimal strings for the Phase 1 pages. Real copy moves to packages/i18n later.
export type Lang = 'bn' | 'en'

export const LANGS: readonly Lang[] = ['bn', 'en']

export function langOf(locale: string | undefined): Lang {
  return locale === 'en' ? 'en' : 'bn'
}

/** Locale-neutral path ("/en/x" → "/x") and the URL of that path in a language. */
export function neutralPath(pathname: string): string {
  const p = pathname.replace(/^\/en(?=\/|$)/, '')
  return p === '' ? '/' : p
}
export function localePath(lang: Lang, path: string): string {
  const p = neutralPath(path)
  return lang === 'en' ? (p === '/' ? '/en/' : `/en${p}`) : p
}

export const strings = {
  bn: {
    siteName: 'হিসাব খাতা',
    tagline: 'টাকা, ব্যাংক আর সরকারি কাজের হিসাব, এক খাতায়',
    showcaseTitle: 'ডিজাইন টোকেন',
    showcaseIntro: 'Figma ফাইলের রং, লেখার ধরন, কোণ, ফাঁক আর মোশন — লাইট ও ডার্ক দুই মোডে।',
    colors: 'রং',
    light: 'লাইট',
    dark: 'ডার্ক',
    system: 'সিস্টেম',
    type: 'লেখার ধরন',
    radius: 'কোণের বাঁক',
    spacing: 'ফাঁক',
    motion: 'মোশন',
    breakpoints: 'স্ক্রিনের মাপ',
    sample: 'বিকাশ ক্যাশ আউট ৳৫,০০০ — চার্জ ৳৯২.৫০',
    numberSample: '৳ 1,23,456.50',
    theme: 'থিম',
    motionMode: 'মোশন',
    auto: 'অটো',
    full: 'পূর্ণ',
    lite: 'হালকা',
    reduce: 'কম',
    pressMe: 'চাপ দিন',
    hoverCard: 'কার্ডে মাউস রাখুন',
    hoverCardBody: 'কার্ড ২px উপরে ওঠে, ছায়া ফুটে ওঠে।',
    link: 'সব টুল দেখুন',
    countUp: 'গুনে ওঠা সংখ্যা',
    replay: 'আবার চালান',
    currentWidth: 'এখন যে মাপ',
    switchLang: 'English',
    gallery: 'কম্পোনেন্ট গ্যালারি',
  },
  en: {
    siteName: 'Hisab Khata',
    tagline: 'Money, banks and government tasks, in one ledger',
    showcaseTitle: 'Design tokens',
    showcaseIntro: 'Colours, text styles, radius, spacing and motion from the Figma file, in light and dark.',
    colors: 'Colours',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    type: 'Text styles',
    radius: 'Radius',
    spacing: 'Spacing',
    motion: 'Motion',
    breakpoints: 'Breakpoints',
    sample: 'bKash cash out ৳5,000 — charge ৳92.50',
    numberSample: '৳ 1,23,456.50',
    theme: 'Theme',
    motionMode: 'Motion',
    auto: 'Auto',
    full: 'Full',
    lite: 'Lite',
    reduce: 'Reduced',
    pressMe: 'Press me',
    hoverCard: 'Hover this card',
    hoverCardBody: 'The card lifts 2px and its shadow fades in.',
    link: 'See all tools',
    countUp: 'Count-up',
    replay: 'Replay',
    currentWidth: 'Current width',
    switchLang: 'বাংলা',
    gallery: 'Component gallery',
  },
} as const satisfies Record<Lang, Record<string, string>>

export type Strings = (typeof strings)[Lang]
