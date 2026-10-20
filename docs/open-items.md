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

- SearchBar needs more sizes: Figma pages use 342×44, 560×60 and 1080×44.
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

- core currency `isValidRate` accepts Infinity (guarded in search; fix in core).
- name-spelling: sound matching is heuristic (Hasan vs Hossain reads as a
  spelling difference); a 2–2 split with an English reference goes to the
  reference's script.
