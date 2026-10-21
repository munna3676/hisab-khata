# Open items

Things reviewers left open while building phases 1–2 and the shared packages
(2026-10-20). Each is either a product/design decision for the owner or a
follow-up for a later phase. Re-check this list in the final audit.

## Design decisions for the owner

- `border/line` against paper is 1.16:1 (light) and 1.40:1 (dark), below the
  3:1 WCAG asks for input edges. It comes from the Figma tokens.
- Footer links are 30px tall (Figma row pitch); they pass WCAG 2.5.8 through the
  inline-list exemption but are under the 44px goal.
- Deliberate differences kept: the Verified Line source link is underlined
  (WCAG 1.4.1); the desktop dialog is 560px (token) instead of 520px; the
  dialog shadow uses the shadow token instead of Figma's raw rgba.
- Bangla text renders 2–4% narrower than in Figma (font metrics of the
  self-hosted Noto Sans Bengali). 1.5px borders show as 1px on 1x screens.

## Follow-ups for page building (phase 3+)

- ~~SearchBar needs more sizes~~: done in phase 3a (`hero` 560×60, `medium` 44px bordered
  field without a button for the 342×44 / 1080×44 search fields; check `medium` against the
  search screens when they are built).
- AnswerCard has a new `question` field; Priyo Agent leads bKash cash-out cards.
- mfs-compare ranks can tie (1, 1, 3); name-spelling has new validation results
  for more than 40 name parts or 10 documents.
- Server-rendered link-mode TabBars cannot scroll the selected tab into view on
  narrow phones without hydration.
- At 320px with 125% font the gallery page scrolls 15px sideways (not from the
  base section).

## Data and search

- 123 seeded Facts are unverified; CI runs check-data with --allow-unverified.
- The data manifest has no expiry, so a server could keep serving an old signed
  manifest forever (freeze attack). Needs an expiry/max-age design.
- The change log's git-ref mode is untested.
- synonyms.json maps 'gb'/'জিবি' to 'এমবি' and 'গজ' to 'বর্গগজ' — review for
  false-positive intents.
- 'vat 2024' and 'bkash 2025' are read as amounts; decide whether to ignore
  4-digit years.
- Weak fuzzy matches: 'namaz' finds invoice, 'hello' finds a guide. Add
  synonyms or registry entries (prayer time, unit converter).
- data/text/name-variants.json: split the মোহাম্মদ/মোঃ/MD group by `family`
  and add `family` to the schema.
- guide.schema.json `fees` cannot yet hold a full GuideFeeTable; the F4 MFS
  comparison row spec should move into data.

## Engines

- ~~core currency `isValidRate` accepts Infinity~~: fixed in phase 3d (rejects non-finite rates).
- name-spelling: sound matching is heuristic (Hasan vs Hossain reads as a
  spelling difference); a 2–2 split with an English reference goes to the
  reference's script.

## Phase 3a (site shell and Home), 2026-10-20

- Home deviations from Figma: while the MFS Facts are unverified, আজকের খাতা shows a
  "যাচাই বাকি" badge and a one-line note instead of the green Verified Line, so the card is
  taller than in 01 Home / D1. The tool cards use the longer mobile descriptions on desktop too.
  English (A10 is an abbreviated frame) gets the full home with English copy; its chips,
  section subtitles, today rows and tool texts are translations (not in Figma). Desktop
  section links are at least 44px wide, so they sit 4px further apart than in D1.
- New draft Bangla copy (in DRAFT_BN_KEYS): home.yourTools, home.perThousand,
  home.unverified, home.unverifiedNote, home.banglaMainNote, state.comingSoonTitle/Body.
- The "তোমার টুল" row (favourites, then recents from @hisab/platform) has no Figma frame; it is
  hidden when empty, so a first visit matches Figma. Placeholder tool pages record recents.
- Every non-home registry route is a noindex placeholder (title, breadcrumb, "শীঘ্রই আসছে");
  hubs list their pages. /search already runs the offline index, but its island bundles the
  registry and synonyms (about 200 KB raw); trim it when the real search screen is built.
- og:image is the 512px app icon until a 1200×630 share image exists. The site origin is
  https://hisabkhata.com (override with SITE=…); confirm the production domain.
- Build output uses `build.format: 'preserve'` so URLs match the registry (`/tools/emi`, `/en/`);
  check Cloudflare Pages serves `/tools/emi` from `tools/emi.html` without a redirect.
- View transitions: forward/back typing uses the Navigation API (Chromium); Safari gets the
  forward slide in both directions.
- The date line is built at build time and recomputed on load for today in Asia/Dhaka.

## Phase 3b (calculator template, Cash Out), 2026-10-20

- Cash Out deviations from Figma: the desktop title is the registry name without "ক্যালকুলেটর"
  (D2 has it; the D · C1 frames do not). Desktop follows the D · C1 frames, not D2: callout and
  action bar run the full results width with the mobile callout copy, and the rail shows Tool Cards
  instead of D2's text links. "আরও টুল" lists the registry's four `related` pages (Figma shows two,
  send money and VAT, which is not in the registry list). While the MFS Facts are unverified the
  page head shows "যাচাই বাকি" + a note instead of the Verified Line. The C1-c result card also
  shows the saving line. Tablet (768) caps the calculator at 640px; the article spans the column.
- The page compares the seven Figma ways only; data/mfs-charges.json also has Nagad ATM (৭/হাজার,
  no limits) and Upay agent/ATM. Decide whether they join the list ("৭টা উপায়" copy would change).
- Draft copy (Cash Out, in packages/pages/src/cash-out/copy.ts and content.ts): answers to FAQ 2
  and 3 (closed in Figma), the share text, the per-transaction/monthly limit messages, the
  "এই ব্যালেন্স থেকে তোলা যাবে না" state, and all English. New draft i18n keys: verified.pending,
  verified.pendingNote, result.emptyHint, toast.reportFailed, toast.shareFailed, content.printedOn.
- Ties: Priyo-over-limit and the ordinary agent both cost ৳১৮৫ in C1-c; the page orders ties in
  Figma's channel order (CASH_OUT_CHANNELS), not data order.
- "ভুল পেলেন?" posts JSON to /api/report, which does not exist until the phase 8 Worker; until then
  sending shows the "could not be sent" toast. The report sheet's source field is now type="text"
  (inputmode url): the prefilled "https://" in a type="url" field blocked sending (bug in @hisab/ui).
- Share sends the link (navigator.share or copy); the 1080×1080 share card (Figma S1 sheet with the
  card preview and targets) is phase 5.
- ~~The Cash Out island is about 61 KB gz of JS~~: done in phase 3c (see below).
- Without JS the inputs are inert (the default result and the full comparison are in the HTML).

## Phase 3c (JavaScript weight), 2026-10-21

- Cash Out loads 22.4 KB gz before any tap plus 2.3 KB at idle (recents), was 61.8 KB plus a
  22 KB lazy motion chunk; Home 5.7 KB, was 17.7 KB (`pnpm check:js`, CI and
  tests/visual/budget.spec.ts enforce 25 / 10 KB). Done: one language's strings per page
  (islandText / `@hisab/i18n/t`), deep ui imports and per-glyph icon modules, a requestAnimationFrame
  count-up instead of `motion`, report sheet, toasts and the platform adapter on first tap,
  Capacitor out of the web bundle (`@hisab/platform/native`), the FAQ and Home's "তোমার টুল" without
  Preact, and two chunk groups (`apps/web/astro.config.ts`).
- Still in the budget: Vite's preload helper (~0.8 KB; Astro keeps build.modulePreload on) and the
  recents record's store (~2.3 KB at idle, `@hisab/platform/collections` keeps all four lists).
  `motion` is no longer used by any page; keep it for springs/FLIP or drop the dependency.
- The first toast mounts its live region, then adds the message ~60 ms later so screen readers
  announce it; check with VoiceOver/TalkBack.

## Phase 3c (finance calculators: EMI, DPS, FDR, loan eligibility, loan comparison, savings goal)

- Figma numbers the engine does not match (the pages show the engine): F8-b FDR renew every 3
  months shows ৳১,০৯,৩৪৩ (profit ৳১০,৩৮১, tax ৳১,০৩৮); the engine, which renews with the
  after-tax amount, gives ৳১,০৯,৩০৮ (৳১০,৩৪৩ / ৳১,০৩৪). F10 offer B: ৳৮৯,২৯৭ interest,
  ৳৯৯,২৯৭ total and ৳৩,৫৬১ saving (Figma ৳৮৯,২৮৪ / ৳৯৯,২৮৪ / ৳৩,৫৭৪). C4: ৳২০,৮৩৩ without
  return (Figma ৳২০,৮৩৪). Update the Figma frames.
- Layout deviations: the EMI table lists every month in a scroll box titled "মাসভিত্তিক পরিশোধ"
  (Figma: the first 3 months, "(প্রথম ৩ মাস)"), and prints all of them. DPS has a year-by-year
  table that Figma does not show (the task asks for a printable DPS schedule). Loan Comparison puts
  each offer's loan on its own row (Figma pairs it with the rate; ৫,০০,০০০ does not fit half a
  390px card). "লাখ"/"কম" after the result number use the card's smaller suffix style (Figma: same
  size). FDR F8-b, DPS F7-b and the D · frames are modes of the same page (?mode=renew,
  ?comp=quarterly). Related tools come from the registry (`bank-detail-*` pages have [param] routes,
  so EMI/DPS/FDR list fewer cards than Figma's two/three rows).
- Draft copy (marked `// draft` in each `copy.ts`): the closed FAQ answers (EMI "প্রথম দিকে সুদ
  বেশি কেন?", DPS excise duty, FDR auto-renew), the DPS year table and its note, the EMI schedule
  note, the FDR renew-term error, the loan-eligibility "no room" error, the loan-compare tie and
  "কম" screen-reader word, savings-goal 0% line, all share texts, report-sheet items, chip-row
  names, "পূর্ণ সংখ্যায় লেখো", and all English.
- Data: data/finance/interest-tax.json now also has withoutTinPct 15 (seeded from the F7 helper
  text, unverified). Excise duty is taken in DPS/FDR from data/finance/excise-duty.json; the Figma
  examples are under the ৳৪ লাখ free limit, so they show none (the row appears when it applies).
  savings-goal-presets.json has no target/months, so the purpose chips only name the plan (share
  text) and change no numbers; it has no English labels (they are in the page copy). loan-caps.json
  and loan-fees.json are empty and unused; Loan Comparison and Savings Goal have no verified line.
- Restored links write fractions with two decimals in the field ("১০.৫০" for rate 10.5); a
  NumberField option to keep "১০.৫" would read better.
- Loan eligibility shows "৳১১.২ লাখ" with one decimal (rounded); below one lakh it shows whole taka.

## Phase 3d (money calculators: VAT, discount, profit margin, salary, income tax, Sanchayapatra, currency, data pack)

- Engines unchanged except core currency `isValidRate`, which now rejects non-finite rates
  (Infinity, NaN) in validation and in the "অন্য মুদ্রায়" table (test in currency.test.ts); the
  item under "Engines" above is done.
- VAT: SD (data/commerce/sd-rates.json, listed in the registry entry) has no field in C1/C4-b, so
  the page leaves SD out; add an SD picker if a later frame shows one. The rate is the four data
  chips only (no free rate field, as in Figma; any 0–100 rate works from a link). Amounts with paisa
  show two decimals (Figma examples are whole taka). Mobile C1 hides the first "হিসাব" row under
  the bottom nav; the page follows D · C1 (মূল দাম / VAT (১৫%) / মোট).
- Discount: a discount over 100% is a field error with the empty result (no C1-d style frame for
  this tool). Profit margin: "বেচতে হবে" shows whole taka (engine 1,142.86 → ৳১,১৪৩ as in Figma);
  a loss is labelled "ক্ষতি" with the amount positive (draft); cost 0 shows "—" for markup.
- Salary: medical % and conveyance (rest of gross) come from the "common" preset in
  data/finance/salary-presets.json; the preset's deductions (provident fund, welfare fund) are not
  shown (no Figma frame). Parts over the gross give an error with a "বাড়িভাড়া N% দিয়ে হিসাব করো"
  fix (draft copy). The page head shows "যাচাই বাকি" (Figma C5 has no verified line).
- Income tax: the minimum-tax area is fixed to Dhaka/Chattogram city (৳৫,০০০; C6 has no area
  field), so people elsewhere see a higher minimum than theirs; add an area choice. C6-b follows
  Figma: the main number is the ordinary-slab tax and the sub line is the engine's freelancer result
  with the data's 100% exemption ("পাস হলে ৳০"). Taxpayer chips are the three Figma ones (data also
  has freedomFighter). No FAQ (none in Figma). The Figma verified line "স্ল্যাব: FY ২০২৬-২৭ ·
  করমুক্ত সীমা ৪,০০,০০০" is the "যাচাই বাকি" state while the file is unverified.
- Sanchayapatra, Figma vs engine/data: Figma C7 takes a flat 10% tax (হাতে ৳৪,৪৭৪); the data's
  NBR slab is 5% up to ৳৫ লাখ, so the page shows হাতে ৳৪,৭২২ (৳৪,৯৭১ profit matches). The callout
  still quotes the Finance Bill's 10% proposal (Figma copy). The rate table is built from data:
  the chosen scheme's slabs plus the other schemes' range (১১.৮% – ১১.৯৩%); Figma's
  "১১.৭৭% – ১১.৯৮%" is not in data. data/finance/sanchayapatra.json gained a "pensioner" scheme
  (Figma P7 name/detail; rates, quarterly payout and the 0%/10% tax slabs from the engine test
  fixture), unverified. Labels for quarterly/maturity results, the "… এর বেশি" row and the
  purchase-limit error/fix are draft.
- Currency: the page head shows "যাচাই বাকি" (F11 mobile has no verified line; P8 has one at the
  bottom, here a draft "ব্যাংক · তারিখ এর হার" line). The "অন্য মুদ্রায়" table lists every other
  currency on the sheet (Figma shows AED, USD, GBP; the sheet also has EUR). MYR is a Figma chip
  without a rate: picking it shows the P8 "ব্যাংকের তালিকায় নেই" text as an error; it is disabled in
  the sheet. Picker search label/placeholder and the no-rate title are draft. Converting taka to a
  foreign currency (engine `fromBdt`) has no Figma frame.
- Data pack: only Grameenphone has packs in data/data-packs.json, so Robi, Banglalink and Teletalk
  show "শীঘ্রই" (as in Figma). The Figma callout's second sentence is a note for the data team
  ("packs.json আপডেট করতে হবে"); the page uses a draft sentence instead. No packs in budget is an
  error with the cheapest matching pack as the fix (draft). "৩০ GB": the unit uses the result
  card's smaller suffix style.
- Picker sheets (P7, P8): new shared `PickerField` (tool/PickerField.tsx) loads `ChoiceSheet` on the
  first tap (BottomSheet + Picker, ~5 KB lazy). P7 lists options without a search box, as in Figma.
- Draft copy (marked `// draft` in each copy.ts): every share text, report-sheet items not in
  Figma, the discount chip-row name, "ক্ষতি", the no-markup sub line, "মার্জিন ১০০% এর কম লেখো",
  the salary structure error/fix and "অন্যান্য ভাতা", the items above, and all English.
- JS before any tap (pnpm check:js): VAT 20.8, discount 20.7, profit margin 20.9, salary 21.1,
  income tax 22.9, Sanchayapatra 23.8, currency 23.5, data pack 22.5 KB gz (budget 25). The two
  picker pages are closest to the budget.
