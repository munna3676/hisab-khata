# Engine review notes

Open questions and data to confirm, collected when each engine group was written and then independently re-verified (2026-10-19).
Engines take every changeable number as a parameter; the JSON shapes below are what `data/` must provide.

## finance

| Module | Verifier verdict | Bugs fixed |
|---|---|---|
| `dps.ts` | fixed | validateDps used `compounding in CREDIT_EVERY_MONTHS`, so 'constructor' and 'toString' passed validation. calculateDps then did month % Function (NaN) and never credited profit before maturity. Now uses Object.hasOwn.<br>validateDps rejected exciseSlabs: [] even though calculateDps defaults to [] and the slab helper documents [] as 'no excise duty'. An empty table is now accepted as none. |
| `fdr.ts` | fixed | validateFdr rejected exciseSlabs: [], although calculateFdr defaults to [] (no excise duty). Now accepted. The old test that expected 'excise' for [] now uses a malformed table instead. |
| `loan-eligibility.ts` | correct | — |
| `loan-compare.ts` | correct | — |
| `savings-goal.ts` | fixed | monthsUntil did not count a month when the goal was the last day of a shorter month. 2026-01-31 → 2026-02-28 gave 0 (validation then rejected it as months=0), 2026-03-31 → 2026-04-30 gave 0, and 2028-02-29 → 2029-02-28 gave 11 instead of 12. A month now also counts when the goal day is the last day of its month (leap years handled through Date.UTC day 0). |
| `sanchayapatra.ts` | fixed | validateSanchayapatra used `scheme.payout in PAYOUTS_PER_YEAR`, so 'toString' passed and produced NaN results. Now uses Object.hasOwn. |
| `currency.ts` | fixed | validateCurrency did not check direction. An unknown value such as 'sideways' passed and calculateCurrency silently treated it as fromBdt (1,000 → 30.64). It now returns the new additive error 'direction'. |
| `salary.ts` | fixed | A fixed conveyance with sub-paisa digits (e.g. 1500.555) was returned unrounded. The breakdown then summed to 50,000.005 instead of gross. Conveyance is now rounded before otherAllowance is derived (1,500.56 + 499.44). |
| `finance-slabs.ts` | correct | — |

**Open concerns**

- Figma C4 (28:7332) rounds two numbers on one screen differently: 19,660 is rounded to the nearest taka, 20,834 (= 20,833.33) is rounded up. The engine rounds both to the nearest taka (20,833). Either Figma or the rounding rule needs a product decision. Also, the nearest-taka 19,660 grows to only 4,99,992.24, a few taka short of the 5,00,000 goal.
- Figma F10 (27:6681) offer B uses whole-taka EMI × 36 (interest 89,284), while offer A follows the reducing-balance schedule (97,858). The engine is consistent (B = 89,296.90, saving 3,560.73), so the Figma B cells should be updated.
- Excise duty is modelled per account year (12-month blocks from opening) on the gross balance after profit is credited, and is taken from the maturity amount. Real banks charge per calendar year on the highest day-end balance, and in renew mode the account only ever holds the after-tax balance. Results differ only near slab limits (up to one slab step, e.g. ৳150 a year).
- The FY2026-27 excise-free limit of Tk 4 lakh is the budget proposal of 11 Jun 2026 (Daily Star, Ittefaq, bdnews24). The final Finance Act 2026 / NBR SRO values, including the slabs above Tk 50 lakh, must be confirmed before writing data/finance/excise-duty.json.
- Sanchayapatra: Figma applies a flat 10% tax (Finance Bill 2026 proposal), while NBR's rule is 5% when total holding ≤ 5 lakh and 10% above. Rates for Jul–Dec 2026 could not be fetched from nationalsavings.gov.bd (.gov.bd DNS unreachable here). Both are data questions; the engine takes either rule as taxSlabs. Certificate denomination steps (multiples of 10,000) are not validated.
- DPS quarterly mode (monthly simple accrual credited quarterly) is 75,855.58 for 1,000/month at 9% over 5 years. Prime Bank's chart prints 75,850, so per-bank charts can differ by a few taka. DPS tax is taken once at maturity (as the screen shows); a taxTiming option would be needed if a bank takes it yearly.
- Currency: the government's cash incentive on inward remittance (currently a percentage on top of the bank rate) is not modelled. If the remittance screen should show it, it needs an incentivePct data parameter.
- CurrencyError gained the value 'direction' (additive). UI code that switches exhaustively on CurrencyError must add that case.

**Builder questions**

- Figma C4 (28:7332) uses two rounding rules on one screen. '১৯,৬৬০' is 19,660.31 rounded to the nearest taka, but 'মুনাফা ছাড়া লাগত ৳২০,৮৩৪' is 20,833.33 rounded up. The engine rounds both to the nearest taka (monthlyWithoutReturn = 20,833). Either update Figma to 20,833, or round both up (then 19,661 / 4,71,864 / 28,136).
- Figma F10 (27:6681) offer B: interest ৳৮৯,২৮৪ comes from whole-taka EMI 16,369 × 36 − principal. The reducing-balance schedule from calculateEmi gives ৳৮৯,২৯৬.৯০, so total cost is ৳৯৯,২৯৬.৯০ and the saving ৳৩,৫৬০.৭৩, not ৳৯৯,২৮৪ / ৳৩,৫৭৪. Offer A in Figma (97,858) does follow the schedule, so Figma B should be updated.
- Sanchayapatra source tax: the screen applies a flat 10% at 5 lakh, citing the Finance Bill 2026 proposal. NBR's Feb 2026 clarification says 5% when total holding ≤ Tk 5 lakh, 10% above, and 0% on pensioner up to 5 lakh. Data must state which rule is in force; the engine takes either as taxSlabs.
- Sanchayapatra rates for Jul–Dec 2026: news says they are unchanged from Jan–Jun 2026 (max 11.82–11.98%), but one Jan 2026 report says the max was cut to 10.59%. The per-scheme slab values need to be read from the NSD notification dated 02-07-2026 (nationalsavings.gov.bd), which WebFetch could not reach here (DNS failure for .gov.bd and the news sites).
- Excise duty FY2026-27: confirmed only that the free limit rose to Tk 4 lakh (budget 11 Jun 2026; charged once a year), and the older 150 / 500 / 3,000 slabs. The slabs above Tk 50 lakh are not confirmed and must be taken from the Finance Act 2026 or NBR SRO.
- Excise timing is simplified: once per account year from opening, on that year's highest balance, taken from the maturity amount. Real banks charge on a calendar-year cycle and debit the account. Is this approximation acceptable, or should the engine take an opening month?
- DPS tax is taken once on total profit at maturity, as Figma shows. If banks in the data take it yearly when profit is credited, add a taxTiming option.
- The 5-year Bangladesh Sanchayapatra ('maturity' payout) is treated as simple profit (investment × rate × years), as NSD has historically paid it. Premature-encashment year-wise rates are not modelled. Is that needed for C7?
- The desktop 'F7-b DPS — ত্রৈমাসিক চক্রবৃদ্ধি' frame has no node id in the task and was not found in the file, so there is no quarterly-mode Figma example to test against. The engine follows the accrue-monthly, credit-quarterly convention and is hand-checked on a 3-month case.
- The task's F11 node id 26:6940 does not exist; the Currency Converter screen is node 27:6940.

**Data each module needs**

- `dps.ts`
  - taxPct ← data/finance/interest-tax.json: {"value":{"withTinPct":10,"withoutTinPct":15},"unit":"percent","source":"https://nbr.gov.bd/...","checked":"YYYY-MM-DD"}
  - exciseSlabs ← data/finance/excise-duty.json: {"value":[{"upTo":400000,"duty":0},{"upTo":500000,"duty":150},{"upTo":1000000,"duty":500},{"upTo":5000000,"duty":3000},{"upTo":<n>,"duty":<n>},…,{"upTo":null,"duty":<n>}],"unit":"BDT per year by highest balance","source":"<Finance Act 2026 / NBR SRO URL>","checked":"YYYY-MM-DD"}. upTo values must rise strictly and the last one must be null (ExciseSlab[]).
- `fdr.ts`
  - taxPct ← data/finance/interest-tax.json (same shape as dps)
  - exciseSlabs ← data/finance/excise-duty.json (same shape as dps)
  - Optional: renew/compounding period presets {"value":[3],"unit":"months"} if banks offer other auto-renew periods
- `loan-eligibility.ts`
  - maxDebtBurdenPct chips ← data/finance/loan-dbr.json: {"value":[40,50],"unit":"percent of take-home income","source":"<Bangladesh Bank consumer-credit guideline URL>","checked":"YYYY-MM-DD"}
  - Optional maxLoanCap ← data/finance/loan-caps.json: {"value":{"personal":<taka>,"car":<taka>,…},"unit":"BDT","source":"<Bangladesh Bank circular URL>","checked":"YYYY-MM-DD"}
- `loan-compare.ts`
  - None required: rate and processing fee are typed by the user per offer. Optional default fee hint: data/finance/loan-fees.json {"value":{"processingFeePct":<n>},"unit":"percent","source":"<bank schedule of charges URL>","checked":"YYYY-MM-DD"}
- `savings-goal.ts`
  - None for the engine (the rate is user input). Optional UI presets for the purpose chips (বিয়ে, বাইক, বিদেশে পড়া, জরুরি তহবিল): data/finance/savings-goal-presets.json {"value":[{"id":"wedding","labelBn":"বিয়ে","target":<taka>,"months":<n>}],"source":…,"checked":…}
- `sanchayapatra.ts`
  - scheme ← data/finance/sanchayapatra.json: {"value":[{"id":"paribar","nameBn":"পরিবার সঞ্চয়পত্র","years":5,"payout":"monthly","rateSlabs":[{"upTo":750000,"ratePct":11.93},{"upTo":null,"ratePct":<n>}],"taxSlabs":[{"upTo":500000,"taxPct":5},{"upTo":null,"taxPct":10}],"minInvestment":<taka>,"maxInvestment":<taka>},{"id":"pensioner","payout":"quarterly","taxSlabs":[{"upTo":500000,"taxPct":0},{"upTo":null,"taxPct":10}],…},{"id":"three-month","years":3,"payout":"quarterly",…},{"id":"bangladesh-5y","years":5,"payout":"maturity",…}],"unit":"percent","source":"https://nationalsavings.gov.bd/…","checked":"YYYY-MM-DD"}. payout is 'monthly' | 'quarterly' | 'maturity'. upTo values rise strictly and the last one is null.
- `currency.ts`
  - rates ← data/finance/currency-rates.json: {"value":{"bank":"Dutch-Bangla Bank","rateType":"TT clean","asOf":"YYYY-MM-DD","rates":[{"code":"SAR","nameBn":"সৌদি রিয়াল","buy":32.641,"sell":<n>,"unit":1},{"code":"AED",…},{"code":"USD",…},{"code":"MYR",…},{"code":"GBP",…},{"code":"EUR",…}]},"unit":"BDT per unit","source":"<bank rate-sheet URL>","checked":"YYYY-MM-DD"} (updated daily)
  - Optional spread/fee presets per channel: {"value":[{"id":"card","spreadPct":<n>,"feeBdt":<n>}],…}
- `salary.ts`
  - structure presets ← data/finance/salary-presets.json: {"value":[{"id":"common","labelBn":"প্রচলিত কাঠামো","basicPctOfGross":60,"houseRentPctOfBasic":50,"medicalPctOfBasic":10,"conveyance":null}],"unit":"percent","source":"<source URL>","checked":"YYYY-MM-DD"}
  - Optional deduction presets: {"value":[{"label":"প্রভিডেন্ট ফান্ড","kind":"pctOfBasic","value":10}],…}

## commerce

| Module | Verifier verdict | Bugs fixed |
|---|---|---|
| `vat.ts` | correct | — |
| `percentage.ts` | fixed | calculateSuccessiveDiscount carried the unrounded price into the next step, so the shown step table did not add up in about 75% of random cases (e.g. 622.63 − 128.88 shown as 493.74). README says to round money when it is carried to the next step. Each step now works on the rounded price. |
| `profit-margin.ts` | fixed | calculatePriceFromMargin with basis 'markup' and cost 0 returned marginPct = the markup (30) instead of 30/130 = 23.08.<br>calculateBreakEven snapped with toPrecision(12), which cut off the real fraction for counts of 1e12 and above and rounded the units down (1e13 ÷ 3 gave 3,333,333,333,330 instead of 3,333,333,333,334). It now uses a relative float-noise tolerance. |
| `invoice.ts` | correct | — |
| `delivery-profit.ts` | fixed | compareDeliveryProfit spread the caller's object, so a codPct override in the form state applied to every courier (Steadfast got 5% instead of its own 1%). The comment promises each courier's own COD, so the override is now dropped explicitly.<br>validateDeliveryProfit accepted returnChargePct = Infinity, which gave returnLoss Infinity. It now requires a finite value. |
| `mess.ts` | fixed | Each shared bill was split on its own, so the leftover paisa of every bill went to the first member (two ৳100 bills among 3 gave 66.68 / 66.66 / 66.66 while sharedPerHead showed 66.67). Equal bills and by-meal bills are now each split as one sum: 66.67 / 66.67 / 66.66.<br>A test comment described the meal split wrongly; it is corrected. |
| `rent-split.ts` | fixed | With wholeTaka, a rent, bill or fixed room rent that has paisa produced parts that did not add up (rent 10,000.5 over 2 → 5,001 + 5,000; fixed room 3,333.5 → total 10,000.5). This breaks the 'parts still add up exactly' promise, so validation now rejects it ('rent' / 'utilities' / 'roomRent').<br>The room-rent remainder was computed from a float sum of the fixed rents; it now uses sumMoney and round. |
| `commerce-allocate.ts` | fixed | The toPrecision(12) snap dropped real digits once a share passed about 1e10 paisa (100 crore taka): parts were off by up to ৳0.13 and did not add up (1,196 of 20,000 fuzz cases). For example, allocate(75427625625.09, [2.337]) returned 75427625625.1. It now uses a relative float-noise tolerance, and a defensive loop handles an overshoot. |

**Open concerns**

- The VAT/SD order (SD first, VAT on value + SD) and the 15% standard rate are still backed only by secondary sources and the Figma. nbr.gov.bd, bdlaws and steadfast.com.bd were unreachable from this sandbox (proxy 403 / DNS failure), so a person should check them against the VAT & SD Act 2012 s.32 and the current Finance Act before filling vat-rates.json.
- Steadfast's COD base ('after deducting delivery charge') and the meaning of 'রিটার্ন চার্জ নেই' (returnChargePct 0 or 100) come only from the Figma callout; the official terms page was blocked.
- rent-split perPerson = room total ÷ people is rounded for display. For a room with 3 people, perPerson × 3 can differ from the room total by a paisa (it is not allocated by largest remainder).
- With wholeTaka, validateRentSplit now rejects amounts that have paisa. The UI must either hide the whole-taka toggle for such amounts or show that error.
- marginToMarkup(100) and markupToMargin(-100) still return Infinity. They are helpers with no validation; callers must keep margin < 100.
- The mess and rent-split modes 'room-rent' and sharedPaid have no matching field in the Figma screens (the '৪টা রুম' node was never found). The builder's open questions on these still stand.

**Builder questions**

- Steadfast real rates: the Figma uses ৳80 for 1 kg inside Dhaka. 2026 third-party tables show a ৳55 base inside the city, an older merchant page shows 70/100/130, and Steadfast's pricing page is route-based (pickup × destination). Someone must fill data/commerce/couriers.json from the merchant panels. The zone keys may need to be routes rather than plain zones.
- Steadfast returns: the Figma callout says 'রিটার্ন চার্জ নেই'. Does that mean a returned parcel costs nothing (returnChargePct 0), or that the delivery charge is still billed with no extra fee (returnChargePct 100)? Pathao and RedX return policies were not found online.
- Pathao and RedX COD %: third-party sources disagree (0%, 0.5% or 1% inside Dhaka) and say whether it is charged on the whole collection. codBase and codPct are per-courier data fields.
- VAT/SD rule (SD first, VAT on value + SD) and the 15% standard rate come only from secondary sources and a bilingual copy of the Act. nbr.gov.bd, bdlaws.minlaw.gov.bd and cpd.org.bd were blocked from this sandbox (proxy 403, WebFetch DNS failure). A person should check them against the VAT & SD Act 2012 and the current Finance Act before setting the source/checked fields in vat-rates.json.
- '৪টা রুম': I could not find a Figma node with that name. get_metadata lists only the Cover and Design System pages, and the screens' parent page is not listed. I covered it with the 'room-rent' mode and a 4-room test (one fixed room rent, the rest split equally). The designer should confirm what that screen expects.
- Rent-split rounding: the Figma rounds each room to the whole taka (sum 23,999 ≠ 24,000). The engine returns paisa, and Math.round of it matches the Figma. With wholeTaka: true the parts add up exactly, so room 3 becomes ৳6,546. The UI/design should pick one.
- Invoice amount-in-words: calculateInvoice(input, toWords?) expects the text group to export a (amount: number) => string converter, e.g. number → 'পঁচিশ হাজার টাকা মাত্র'. Please confirm that function's name and signature.
- Invoice: should VAT apply to the delivery charge by default? It is currently false, set with the vatOnDelivery flag.
- Mess: the Figma table settles only bazar (deposit − meal cost) and shows the খালা bill 'আলাদা'. The engine returns mealBalance, sharedBalance and the full balance. The sheet (E3-b) has no field for money paid toward shared costs (sharedPaid). Should the UI add one?

**Data each module needs**

- `vat.ts`
  - data/commerce/vat-rates.json: { "rates": { "value": [{ "pct": 15, "label": "স্ট্যান্ডার্ড" }, { "pct": 10 }, { "pct": 7.5 }, { "pct": 5 }], "unit": "percent", "source": "<NBR URL>", "checked": "YYYY-MM-DD" }, "defaultPct": { "value": 15, "unit": "percent", "source": "<VAT & SD Act s.15 URL>", "checked": "YYYY-MM-DD" } }. These feed VatInput.ratePct and the invoice VAT field
  - Optional data/commerce/sd-rates.json: { "rates": { "value": [{ "pct": number, "label": string }], "unit": "percent", "source": "<SD schedule URL>", "checked": "YYYY-MM-DD" } } for an SD picker. SD depends on HS code, so free entry also works
- `invoice.ts`
  - Reuses data/commerce/vat-rates.json (see vat.ts) for the VAT % field; nothing else
- `delivery-profit.ts`
  - data/commerce/couriers.json: { "<courierId>": { "value": { "name": "Steadfast", "codBase": "collected" | "collected-minus-delivery", "returnChargePct": number /* percent of delivery charge a returned parcel costs: 0 = free, 100 = full charge */, "zones": { "inside-dhaka" | "sub-dhaka" | "outside-dhaka" | …: { "slabs": [{ "maxKg": number, "charge": number }] /* lightest first */, "extra": { "stepKg": number, "charge": number }, "codPct": number } } }, "unit": "BDT", "source": "<courier rate page URL>", "checked": "YYYY-MM-DD", "note": "merchant rates excl. VAT" }, … } for steadfast, pathao, redx. The fact's value is exactly the engine's CourierRate
  - data/commerce/delivery-zones.json: { "zones": { "value": [{ "id": "inside-dhaka", "label": "ঢাকার ভেতরে" }, { "id": "outside-dhaka", "label": "ঢাকার বাইরে" }], "source": "<URL>", "checked": "YYYY-MM-DD" } } for the এলাকা chips

## dates

| Module | Verifier verdict | Bugs fixed |
|---|---|---|
| `dates-calendar.ts` | correct | — |
| `age.ts` | correct | — |
| `job-age-limit.ts` | fixed | validateJobAgeLimit accepted an extension with no `years` (e.g. JSON {id, months: 21}) because isWhole(undefined) is true; calculate then returned maxAge {years: NaN, months: NaN} and NaN dates. Now rejected as 'extensions'.<br>validateJobAgeLimit threw a TypeError on a missing `limit` instead of returning 'limit'. Now guarded. |
| `bangla-date.ts` | fixed | validateBanglaDate accepted a special day with a missing name (`s.name !== ''` is true for undefined), so `undefined` could appear in result.specialDays. It now requires a non-empty string. |
| `hijri-date.ts` | correct | — |
| `day-count.ts` | fixed | validateDayCount and validateAddDays threw a TypeError when work.weekend (or holidays) was not an array, e.g. from a malformed data file. They now return 'work'. |
| `sehri-iftar.ts` | fixed | The default IFB_METHOD margins (sehri 1, iftar 2) did not reproduce the IFB timetable or the Figma table (20 Feb iftar 5:59 instead of 5:58; also 28 Feb, 1 Mar, 10 Mar and 18 Mar off by one). Changed to 0.8 and 1.7, which match all 12 known rows exactly, and documented why. The data shape for data/religion/sehri-iftar-method.json should become { fajrAngle: 18, sehriPrecautionMin: 0.8, iftarPrecautionMin: 1.7, utcOffsetMinutes: 360 }.<br>A method part passed as undefined (e.g. { fajrAngle: undefined } from a half-filled UI or data object) overwrote the default with undefined, so validation returned 'method'. resolve() now skips undefined parts. |

**Open concerns**

- IFB's official per-district PDFs and every Bangladeshi news site were unreachable: WebFetch failed DNS and the proxy returned 403. The 12 IFB Dhaka rows come from WebSearch summaries of republished tables. The 0.8 / 1.7 minute margins are an empirical fit, not IFB's stated method, so they should be checked against the official IFB 2027 timetable when it is published. District times are computed, not IFB's own district table: Chattogram is within 1 minute of one republished row, but another outlet (dhakapost) quoted 5:10 / 5:56 for it.
- Bangla dates before 14 Apr 2019 use the 2019 rules, as the spec asks. Mastheads printed between 1987 and 2019 under the old rules (Falgun 31 days in leap years) can differ by a day, e.g. 21 Feb 2018 was printed as ৯ ফাল্গুন. During the transition, Falgun 1425 had 30 days starting 13 Feb 2019, so 21 Feb 2019 was ৯ ফাল্গুন; the engine says ৮ ফাল্গুন.
- ICU's Umm al-Qura table differs from the official Umm al-Qura tables (hijridate) by up to 2 days outside 1420–1450 AH (before 1999 and after 2029). This is now documented in hijri-date.ts. Results are labelled 'আনুমানিক' and Bangladesh follows local moon sighting anyway.
- The Figma screens disagree on the Hijri offset: D4 and D3 use raw Umm al-Qura (offset 0), D5-b uses -1. Real 2026 dates in Bangladesh (Ramadan from 19 Feb, Eid ul-Fitr 21 Mar, Eid ul-Adha 28 May) all match offset -1, which supports a data default of -1. Product still needs to decide what the যেমন আছে chip means.
- Job age limit: whether completing the limit ends eligibility could not be confirmed from a primary PSC circular. That rule (born 2 Nov 1993 or later for 32 on 1 Nov 2025) matches the Figma and the 50th BCS window in the builder's report. Whether a 29 Feb birthday falls on 28 Feb or 1 Mar in a common year is still a policy choice.
- districts.json is in packages/core/data, not the repo-root data/ folder, so scripts/check-data.mjs does not validate it. Its coordinates come from a community dataset (nuhil/bangladesh-geocode); I spot-checked them and the division counts (13/11/10/8/8/6/4/4) are correct.

**Builder questions**

- districts.json location: the task says data/districts.json, but this agent may only write inside packages/core, so it is at /home/user/hisab-khata/packages/core/data/districts.json and is imported by test/sehri-iftar.test.ts. scripts/check-data.mjs only walks the repo-root data/ folder, so it does not check this file. Move it (e.g. to data/geo/districts.json) or extend check-data.
- District coordinates and Bangla names come from a community dataset (nuhil/bangladesh-geocode, district headquarters), not an official BBS/LGED source. For exact IFB district times, IFB's own per-district 2026 tables could be stored as data instead of computing them.
- Islamic Foundation's official site, kivabe.com, jagonews24 and similar were unreachable: WebFetch failed DNS and the proxy returned 403. The IFB Dhaka rows and other facts were taken from WebSearch summaries of IFB-based republished tables. Please verify the defaults (Fajr 18°, -1 min, +2 min) against the official IFB PDF. The current engine differs by 1 minute on two of the six rows checked (20 Feb and 18 Mar iftar).
- Figma Hijri inconsistency: D4 (19 Oct 2026 = ৮ জমাদিউল আউয়াল) and D3 (16 Dec = ৭ রজব) show Umm al-Qura with offset 0, but D5-b (14 Apr 2027 = ৬ জিলকদ) is Umm al-Qura -1. Real Bangladesh dates in 2026 (Ramadan from 19 Feb, ৩০ রমজান on 20 Mar, ২৫ সফর on 9 Aug) were all Umm al-Qura -1. Decide the data default (suggest -1) and whether the যেমন আছে chip means raw Umm al-Qura or the Bangladesh default.
- Job age limit: the engine treats completing the limit (e.g. the 32nd birthday) as the end of eligibility, matching Figma and the BCS circulars, and adds extensions together. Confirm both rules, and confirm the current quota/relaxation list for data/jobs/govt-age-limit.json, since the Nov 2024 ordinance made 32 uniform.
- A 29 February birthday is counted on 28 February in common years. Confirm, or switch to 1 March.
- The revised Bangla calendar is applied to every year, including dates before 14 Apr 2019. This is what keeps ১৬ ডিসেম্বর ১৯৭১ = ১ পৌষ. Dates in old printed calendars that used the 1987 rules can differ by a day.

**Data each module needs**

- `job-age-limit.ts`
  - data/jobs/govt-age-limit.json: Fact { value: { minYears: 18, maxYears: 32, presets: [30, 32, 35], limitDayIncluded: false, extensions: [{ id: 'covid-relaxation', label: string, years: number, months?: number }] }, source: Bangladesh Gazette / Ministry of Public Administration URL, checked: 'YYYY-MM-DD' }
- `bangla-date.ts`
  - data/dates/special-days.json: Fact { value: [{ calendar: 'gregorian' | 'bangla', month: 1-12, day: 1-31, name: string }] e.g. { calendar: 'gregorian', month: 12, day: 16, name: 'বিজয় দিবস' }, { calendar: 'bangla', month: 1, day: 1, name: 'পহেলা বৈশাখ' }, source, checked }
- `hijri-date.ts`
  - data/dates/hijri-offset.json: Fact { value: -1, unit: 'days', source: Islamic Foundation national moon-sighting committee announcement URL, checked: 'YYYY-MM-DD', note: 'Bangladesh vs Umm al-Qura for the current month' }
- `day-count.ts`
  - data/dates/weekend.json: Fact { value: [5, 6], unit: 'weekday (0 = Sunday)', source: Ministry of Public Administration notification URL, checked }
  - data/dates/holidays-2026.json: Fact { value: [{ date: 'YYYY-MM-DD', name: string, kind?: 'public' | 'executive' | 'optional' }], source: Cabinet Division yearly holiday notification URL, checked } (one file per year)
- `sehri-iftar.ts`
  - data/religion/sehri-iftar-method.json: Fact { value: { fajrAngle: 18, sehriPrecautionMin: 1, iftarPrecautionMin: 2, utcOffsetMinutes: 360 }, source: IFB timetable URL, checked }
  - data/religion/ramadan.json: Fact { value: { hijriYear: 1447, start: '2026-02-19', days: 30 }, source: IFB moon-sighting announcement URL, checked }
  - packages/core/data/districts.json (created): Fact { value: [{ id: 'dhaka', en: 'Dhaka', bn: 'ঢাকা', division: 'Dhaka', divisionBn: 'ঢাকা', lat: 23.7115, lng: 90.4111 }, ... 64 rows], unit, source, checked: '2026-10-19', note }

## land-gold-edu

| Module | Verifier verdict | Bugs fixed |
|---|---|---|
| `land-gold-edu-units.ts` | fixed | splitQuantity could leave a float-noise remainder just below a whole unit, so 5 ভরি 8 আনা 5 রতি 1 পয়েন্ট (and 49 other inputs) split back as point 0.999999999999. It now snaps any count within total x 1e-11 of a whole number, zeroes the rest when it snaps, and never returns -0. |
| `land-gold-edu-grading.ts` | fixed | isValidGradeScale accepted a scale with grades 'A' and 'a' (or a blank name), which gradeByName cannot tell apart. Uniqueness now uses the same normalisation as gradeByName, and blank names are rejected. |
| `land.ts` | fixed | landConvention spread explicit undefined overrides over the standard sizes, so { kathaSqft: undefined } (an empty 'অন্য এলাকা' box) was rejected. Undefined now keeps the standard size.<br>validateLand accepted areas that overflow to Infinity (1e305 একর gave sqft Infinity). It now returns 'value', and isValidConvention rejects sizes so small that 1 sq ft overflows. |
| `land-price.ts` | fixed | validateLandPrice accepted area x price combinations that overflow (1e300 acre at ৳1e10/sq ft gave total Infinity, and 1e305 acre at price 0 gave sqft Infinity). It now returns 'area' or 'price'.<br>Precision clean-up, not a visible bug: total, the মৌজা value and per-unit costs are now worked out as area-in-price-unit x price, exact when the units match. A 1.6M-case random comparison found no visible change after round(). |
| `gold.ts` | fixed | The split showed 0.999999999999 পয়েন্ট (fixed in splitQuantity, see the units helper).<br>isValidGoldWeight rejected a part left undefined ({ vori: 2, ana: undefined }), though calculate treats it as 0. It is now accepted.<br>validateGold accepted weights and prices that overflow to Infinity (1e307 ভরি; 1e300 ভরি at ৳1e10). It now returns 'weight' or 'price'. pointsPerRoti must be a safe integer.<br>value was worked out from the 12-digit-trimmed ভরি count, which can be off by about ৳0.76 at 10 lakh ভরি. It now uses the untrimmed grams. |
| `jewelry-bill.ts` | fixed | Validation accepted bills or old gold that overflow to Infinity. It now returns 'weight' or 'oldGold'. It uses the shared isValidPointsPerRoti, and accepts weight parts left undefined. |
| `zakat.ts` | fixed | Validation accepted asset totals or nisab products that overflow (two assets of 1e308). It now returns 'assets' or 'rates'. The calculation itself was correct. |
| `fitra.ts` | correct | — |
| `gpa.ts` | correct | — |
| `cgpa.ts` | fixed | validateCgpa accepted credit totals that overflow (two semesters of 1e308 credits gave a NaN CGPA). It now returns 'semesters'. The calculation itself was correct. |

**Open concerns**

- Figma L2 shows ৳15,15,152 per শতাংশ. That divides by a rounded 1 কাঠা = 1.65 শতাংশ, while its own ৳3,472 per sq ft uses 720 sq ft. The engine is exact at 720 sq ft and gives ৳15,12,500. I agree the engine is right: the design number should change, or the product must choose a '১.৬৫ শতাংশ' কাঠা on purpose.
- Web research was limited. WebFetch fails DNS, and curl to minland.gov.bd gets a proxy 403, so only search summaries were available. Confirmed that way: the UGC scale, 1 ভরি = 11.664 g, and 1 কানি = 17,280 sq ft. Not confirmed from an official page: 1 রতি = 10 পয়েন্ট (DEFAULT_POINTS_PER_ROTI), the 2026 fitra rates and Islamic Foundation date, the regional কানি presets (Chattogram 40 শতক, Cumilla 30 শতক), the old-gold cut percentages, and the current jewellery VAT rule.
- Board GPA rounds half-up to 2 decimals (44/9 gives 4.89, matching the Figma). No board circular was found to rule out truncation (4.88).
- In GPA marks mode a subject is graded on its overall percentage. Boards also require a pass in each part (CQ/MCQ/practical) separately, so a student with 33% overall who failed one part would show D instead of F. Letter-grade mode, which the Figma uses, is unaffected.
- LAND_CONVENTIONS (regional কানি) are exported constants beside the data JSON the builder proposed. They are customs rather than rates, and every value can be overridden, but data/land/conventions.json should be the source of truth.
- New exports: isValidPointsPerRoti in gold.ts, and an optional pointsPerRoti argument on isValidGoldWeight. Both are backward compatible. No other module outside the group imports these files.

**Builder questions**

- Figma L2 contradicts itself. Per শতাংশ ৳15,15,152 divides by a rounded 1 কাঠা = 1.65 শতাংশ, while per sq ft ৳3,472 uses 720 sq ft. The engine is exact at 720 sq ft (1 কাঠা = 1.6529 শতাংশ), giving ৳15,12,500 per শতাংশ. Should the design change to ৳15,12,500, or does the product want a 'কাঠা = ১.৬৫ শতাংশ' convention (kathaSqft 718.74, which makes per sq ft ৳3,478)?
- পয়েন্ট size: the engine defaults to 1 রতি = 10 পয়েন্ট (1 ভরি = 960 পয়েন্ট), but no official or BAJUS source confirmed it. Please confirm with a jeweller or BAJUS, or keep pointsPerRoti in data.
- Jewellery VAT: the Figma adds 5% VAT on gold + মজুরি. Reports from June 2026 describe a 2026-27 budget proposal for a fixed ৳2,500 per ভরি, and later BAJUS notices quote prices 'ভ্যাটসহ'. Which rule is in force today? The engine supports vatPct, vatPerVori, or none (rate includes VAT).
- Old-gold cut: one 2024 report of the BAJUS directive gives 10% on exchange and 15% on buyback; another says the buyback cut fell from 20% to 15%. Which values should go in data, and is the cut applied to the rate excluding VAT and মজুরি?
- Zakat: which BAJUS gold rate should set the gold nisab and value own gold (22K selling rate as the screen implies, or 24K/pure)? Is the extra 'auto' (Hanafi: gold-only → gold nisab, else silver) wanted in the UI, and can an Islamic Foundation citation be added?
- Regional কানি presets (Chattogram 40 শতক, Cumilla/Noakhali 30 শতক) come from unofficial calculators. The Ministry page gives 17,280 sq ft and also an inconsistent '120 শতাংশ = 1 কানি' line. Confirm before showing these as chips.
- GPA rounding: the engine rounds half-up to 2 decimals (matches the Figma 4.89 and the familiar HSC values 4.92/4.67). No board circular was found confirming rounding versus truncation.
- Fitra 2026: the Figma table (110/530/2,310/1,980/2,805) matches the previously announced rates and says 'গত বছরের মতোই'. The 25 Feb 2026 Islamic Foundation announcement should be confirmed for data/religion/fitra.json.
- Research was limited: WebFetch failed DNS for every host, including en.wikipedia.org, and curl to .gov.bd got a proxy 403. Official pages (minland.gov.bd, BAJUS, Islamic Foundation) were read only through web-search summaries, so data/ Facts need a human check at the source.

**Data each module needs**

- `land.ts`
  - data/land/conventions.json — Fact whose value is a list of region chips: [{ "id": "standard", "label": "ঢাকা · ৭২০ বর্গফুট", "kathaSqft": 720, "kathaPerBigha": 20, "kaniSqft": 17280 }, { "id": "chattogram", "label": "চট্টগ্রাম (কানি ৪০ শতক)", "kathaSqft": 720, "kathaPerBigha": 20, "kaniSqft": 17424 }, { "id": "cumilla", "label": "কুমিল্লা-নোয়াখালী (কানি ৩০ শতক)", "kathaSqft": 720, "kathaPerBigha": 20, "kaniSqft": 13068 }]. Each object is passed as LandInput.convention (Partial<LandConvention>).
- `land-price.ts`
  - data/land/registration-costs.json — Fact whose value is a LandCostRule[], e.g. [{ "id": "stamp", "pct": 1.5 }, { "id": "registration", "pct": 1 }, { "id": "local-govt", "pct": 3 }, { "id": "source-tax", "pct": 8, "perUnit": 2000000, "perUnitOf": "katha", "combine": "max" }, { "id": "mutation", "fixed": 1170 }]. These are example values, not verified rates. Source tax differs by area, so the data may need one list per area id: { "<areaId>": LandCostRule[] }.
  - Optional মৌজা rate per mouza: { "price": number, "unit": LandUnit } passed as LandPriceInput.mouzaRate.
- `gold.ts`
  - data/gold/bajus-rates.json — Fact whose value is the day's rate sheet: { "date": "2026-10-13", "gold": { "22K": 228031, "21K": 217767, "18K": number, "traditional": number }, "silver": { "22K": number, "21K": number, "18K": number, "traditional": number } }, all taka per ভরি (11.664 g). It also feeds jewelry-bill and zakat.
  - Optional data/gold/units.json: { "pointsPerRoti": 10 } if the team wants the পয়েন্ট convention data-driven.
- `jewelry-bill.ts`
  - data/gold/jewellery-rules.json — Fact value: { "minMakingPct": 6, "vatPct": 5, "vatPerVori": null, "exchangeDeductionPct": 10, "buybackDeductionPct": 15 }. Exactly one of vatPct or vatPerVori should be set, matching the current NBR rule. The day's karat rates come from data/gold/bajus-rates.json.
- `zakat.ts`
  - data/religion/zakat.json — Fact value: { "nisabGoldVori": 7.5, "nisabSilverVori": 52.5, "ratePct": 2.5 }
  - Daily prices from data/gold/bajus-rates.json: goldPricePerVori (which karat to use, e.g. 22K, is a data/UI decision) and silverPricePerVori (e.g. silver 22K ৳4,199 on the Figma screen).
- `fitra.ts`
  - data/religion/fitra.json — Fact value: { "year": 2026, "announced": "2026-02-25", "items": [{ "id": "atta", "perPerson": 110, "kgPerPerson": 1.65 }, { "id": "barley", "perPerson": 530, "kgPerPerson": 3.3 }, { "id": "dates", "perPerson": 2310, "kgPerPerson": 3.3 }, { "id": "raisins", "perPerson": 1980, "kgPerPerson": 3.3 }, { "id": "cheese", "perPerson": 2805, "kgPerPerson": 3.3 }] } (labels আটা/যব/খেজুর/কিসমিস/পনির live in UI copy)
- `gpa.ts`
  - data/education/board-grading.json — Fact value: { "scale": [{ "grade": "A+", "minMarks": 80, "point": 5 }, { "grade": "A", "minMarks": 70, "point": 4 }, { "grade": "A-", "minMarks": 60, "point": 3.5 }, { "grade": "B", "minMarks": 50, "point": 3 }, { "grade": "C", "minMarks": 40, "point": 2 }, { "grade": "D", "minMarks": 33, "point": 1 }, { "grade": "F", "minMarks": 0, "point": 0 }], "fourthSubjectBase": 2 }
  - data/education/board-subjects.json (for the screen's subject rows): { "ssc": { "science": ["বাংলা", "ইংরেজি", "গণিত", "তথ্য ও যোগাযোগ প্রযুক্তি", "ধর্ম", "বাংলাদেশ ও বিশ্বপরিচয়", "পদার্থবিজ্ঞান", "রসায়ন", "জীববিজ্ঞান"], "humanities": [...], "business": [...], "fourth": ["উচ্চতর গণিত", "কৃষিশিক্ষা", ...] }, "hsc": { "science": [...6 names], ... } } — curriculum data, not used by the engine.
- `cgpa.ts`
  - data/education/ugc-grading.json — Fact value: [{ "grade": "A+", "minMarks": 80, "point": 4 }, { "grade": "A", "minMarks": 75, "point": 3.75 }, { "grade": "A-", "minMarks": 70, "point": 3.5 }, { "grade": "B+", "minMarks": 65, "point": 3.25 }, { "grade": "B", "minMarks": 60, "point": 3 }, { "grade": "B-", "minMarks": 55, "point": 2.75 }, { "grade": "C+", "minMarks": 50, "point": 2.5 }, { "grade": "C", "minMarks": 45, "point": 2.25 }, { "grade": "D", "minMarks": 40, "point": 2 }, { "grade": "F", "minMarks": 0, "point": 0 }]; optionally per-university overrides { "<universityId>": GradeBand[] }.

## text-and-rates

| Module | Verifier verdict | Bugs fixed |
|---|---|---|
| `number-words.ts` | fixed | Plain style printed binary noise as fraction digits for large numbers: 1234567890123.45 read 'Point Four Five Zero One Nine Five', and NUMBER_WORDS_MAX read 'Point Nine Nine Zero Two Three Four'. The cause was toFixed(6). It now uses the shortest decimal string (String(value)) and rounds to 6 places only when there are more digits.<br>Cheque style returned whole = -0 for amount -0, which validation accepts. It is now normalised to 0. |
| `bijoy.ts` | fixed | অ্যা / এ্যা (a vowel letter with য-ফলা, as in অ্যাপ and অ্যাকাউন্ট) was written as 'A&hvc', which SutonnyMJ shows as অ্‌যাপ with a visible hasanta and which decodes to অ্‌যাপ. It is now written as 'A¨vc', the form both independent encoders produce.<br>The alternate glyph ¹ (জ্ঞ), which both independent decoders read, passed through unconverted. The decoder now reads it, and the encoder still writes Á. |
| `font-style.ts` | fixed | The comment said q has no small capital and is left as it is, but the code maps q to ǫ (U+01EB). I corrected the comment. Behaviour is unchanged, and a test now covers it. |
| `mfs-charge.ts` | fixed | An amount above 0 but below half a paisa (e.g. 0.004) passed validation, rounded to 0 and gave per1000 = NaN. validateMfsCharge and validateMfsCompare now require at least 1 paisa after rounding. |
| `electricity-bill.ts` | fixed | Tariff data with a misspelt bill part in vatOn or rebate.on (e.g. 'meter') passed isValidTariff and made VAT NaN. Both lists are now checked.<br>meterType 'toString' or a ToD period 'constructor' passed validation, because inherited object keys counted as present, and then broke the bill arithmetic. Both checks now use Object.hasOwn. |
| `income-tax.ts` | fixed | investmentForFullRebate was one taka too high when float noise met Math.ceil (2,500.05 ÷ 15% gave 16,668 instead of 16,667). It now rounds before ceil.<br>category 'toString' or area 'constructor' passed validation (inherited keys). Both checks now use Object.hasOwn. |
| `data-pack.ts` | fixed | An operator chip sent twice was listed twice in operatorsWithoutData / operatorsWithoutMatch. The chosen operators are now de-duplicated. |

**Open concerns**

- I could not open any official source (NBR, BERC, Bangladesh Bank, providers, Wikipedia): WebFetch fails with DNS errors. Independent checks used npm packages (reachable through the registry) and hand arithmetic with earlier published tariffs. The rate values in the test fixtures (the Figma's June 2026 LT-A steps, FY 2026-27 tax thresholds, Priyo 13.95/50k, Nagad 12.99) are still unverified against official pages.
- bijoy.ts: the decoders disagree on three glyphs. ² is read as ক্ষ্ম here but as ক্ষ্ণ by both independent decoders. è is read as ্ণ here but as ্ন by both. ø is read as ল-ফলা after a consonant here but always as স্ন by bnbijoy2unicode. The choices here follow what the independent encoders write. Width variants also differ from both independent encoders (z/y for ু, ª/« for ্র, „/… for ৃ, Í/— for ্ত): ু is z only after ক, so তুমি is written Zywg. Everything decodes correctly, but these need a visual check in a real SutonnyMJ install.
- bijoy.ts: a ZWJ half-form such as ক্‍ষ is written as K& + l and reads back with ZWNJ, so it is not a perfect round trip.
- number-words.ts: 17 of the 100 Bangla words for 0–99 are spelling variants where independent tables disagree (ঊন vs উন for 29/39/…/89, আটাশ vs আঠাশ, অষ্টাশি vs আটাশি, বায়ান্ন vs বাহান্ন). The table follows Bangla Academy-style ঊন forms, which is a product/editorial decision. Only 88 (অষ্টাশি) matches neither npm table.
- electricity-bill.ts: fractional units give a nonsensical row label (75.5 units makes a row '76–75.5'). The amounts are right. Requiring whole units, or a different label rule, is a product decision, so I left it unchanged.
- income-tax.ts: investmentForFullRebate is the investment for the largest legal rebate. It can suggest investing past the point where the area minimum tax makes the extra rebate useless (e.g. slab tax 2,500 against a 3,000 minimum). The screen may want min(rebateLimit, grossTax − minimumTax) for that hint instead.
- The open questions in the builder's report still stand: FY 2026-27 thresholds (4.0L vs 3.75L), Priyo Agent quota rules, the electricity VAT base, and missing Figma node ids for T1-b, T1-c, the T3 English variant and C6-b.

**Builder questions**

- I could not open any official source. WebFetch failed with DNS errors for every host, and curl through the proxy got 403 for nbr.gov.bd, berc.org.bd, bb.org.bd, bkash.com, thedailystar.net and wikipedia.org. Rates and rules were confirmed only from search-result summaries, so the data team should check every value against NBR, BERC, Bangladesh Bank and the providers before publishing.
- Income tax FY 2026-27: sources conflict. The general tax-free limit is 4,00,000 (Daily Star, Finance Act; also the Figma) or 3,75,000 (the budget proposal). Women/65+ is 4,25,000 or 4,50,000. Disabled is 5,00,000 or 5,25,000. Freedom fighters is 5,25,000 or 5,50,000. Minimum tax is either a flat 5,000 or 3,000–5,000 by area. It is also unclear whether the freelancer/content-creator exemption was enacted and whether the ITES exemption runs past June 2027. The Finance Act 2026 text is needed.
- bKash Priyo Agent: the Figma and a UNB release say ৳13.95 per 1,000 up to ৳50,000 a month. A June 2026 Observer report says ৳14.90 within a smaller threshold (৳25,000 in some quotes). Nagad's app rate of 12.99 was not confirmed. When a transaction crosses the Priyo quota and pays the full rate, does it still use up the remaining quota? The engine assumes it does not.
- Electricity VAT base: the Figma's 99.80 means 5% on energy + demand charge, but one calculator says VAT is on energy only. VAT on meter rent and the prepaid rebate (0.5% was quoted) need confirmation per distribution company. The tariff shape supports all of these.
- Figma: get_metadata lists only the Cover and Design System pages, so I could not find the T1-b and T1-c screens, the English variant of T3, or the desktop 'C6-b আয়কর — ফ্রিল্যান্সার' screen without node ids. The engines support both Bijoy directions, both English systems and a freelancer mode. If those screens show extra states or inputs, please send their node ids.
- For Unicode→Bijoy, where SutonnyMJ has width variants, glyph choices follow common usage (cÖ/MÖ vs ª, z vs y for ু, … vs „ for ৃ, † at word start). A visual check in a real SutonnyMJ install would confirm them. Every choice decodes back correctly either way.
- Product choice for number words: the default hundred word is 'শত' (পাঁচশত) and the alternative is 'শো' (পাঁচশো). The 1–99 spellings follow common Bangla Academy forms (ঊনত্রিশ etc.) and were not checked against the dictionary online.

**Data each module needs**

- `mfs-charge.ts`
  - data/mfs-charges.json → { channels: Fact<MfsChannel>[], referenceByService: { cashOut: string, sendMoney: string, … } }. Each Fact is { value, source, checked } so every provider's rate carries its own source. MfsChannel = { id: string, provider: 'bkash'|'nagad'|'rocket'|'upay'|…, service: 'cashOut'|'sendMoney'|'cashIn'|'billPay'|'payment', channel: 'agent'|'priyoAgent'|'app'|'ussd'|'atm'|'branch'|'priyoNumber'|'other', bands: { from: number, per1000?: number, pct?: number, flat?: number, min?: number, max?: number }[], quota?: { monthlyAmount: number, over: bands[] }, limits?: { minPerTxn?: number, maxPerTxn?: number, maxPerDay?: number, maxPerMonth?: number }, step?: number }. The first band must have from: 0.
  - Values on the Figma screens: bKash any agent 18.50; bKash Priyo Agent 13.95 with quota { monthlyAmount: 50000, over: [{ from: 0, per1000: 18.5 }] }; bKash ATM 14.90; Nagad app 12.99; Nagad *167# 15.00; Rocket agent 16.70; Rocket DBBL ATM/branch 9.00; cash-out limits { maxPerDay: 30000, maxPerMonth: 200000 }.
  - Send money on the Figma screen: Priyo number bands [{ from: 0 }] with quota { monthlyAmount: 25000, over: [{ from: 0 }, { from: 100, flat: 5 }] }; other numbers via the app [{ from: 0 }, { from: 100, flat: 5 }]. Cash-in limits { maxPerDay: 50000, maxPerMonth: 300000 }.
- `electricity-bill.ts`
  - data/electricity-tariff.json → Fact<{ companies: { id: 'bpdb'|'desco'|'dpdc'|'nesco'|'wzpdcl'|'breb', bn: string, en: string }[], tariffs: Record<categoryId, ElectricityTariff>, overrides?: Record<companyId, Record<categoryId, Partial<ElectricityTariff>>> }>
  - ElectricityTariff = { category: 'LT-A'|'LT-E'|…, slabs: { upTo: number|null, rate: number }[], lifeline?: { maxUnits: number, rate: number }, todRates?: Record<'peak'|'offPeak'|'flat'|string, number>, demandChargePerKw: number, meterRent?: Record<'singlePhase'|'threePhase'|string, number>, vatPct: number, vatOn: ('energy'|'demand'|'meterRent')[], rebate?: { pct: number, on: ('energy'|'demand'|'meterRent')[], prepaidOnly?: boolean }, minimumEnergyCharge?: number }
  - LT-A (June 2026, as on the Figma screen): slabs [75→5.26, 200→8.50, 300→9.10, 400→9.62, 600→15.01, null→17.35], lifeline { maxUnits: 50, rate: 4.63 }, demandChargePerKw 42, vatPct 5, vatOn ['energy','demand']
- `income-tax.ts`
  - data/income-tax-<incomeYear>.json (e.g. income-tax-2026-27.json) → Fact<IncomeTaxRules> where IncomeTaxRules = { incomeYear: string, thresholds: { general: number, womenOrSenior: number, disabled: number, freedomFighter: number, thirdGender?: number, julyWarrior?: number }, disabledDependentExtra?: number, slabs: { width: number|null, ratePct: number }[], rebate: { incomePct: number, investmentPct: number, cap: number }, minimumTax: Record<'dhakaCtgCity'|'otherCity'|'rest'|string, number>, freelance?: { exemptPct: number, exemptCap: number|null, bankingChannelOnly?: boolean } }
  - Values used in the tests (Figma FY 2026-27): thresholds general 400000, womenOrSenior 425000, disabled 500000, freedomFighter 525000; slabs 300000@10, 400000@15, 500000@20, 2000000@25, null@30; rebate { 3, 15, 1000000 }; minimumTax dhakaCtgCity 5000
- `data-pack.ts`
  - data/data-packs.json → { operators: { id: 'gp'|'robi'|'banglalink'|'teletalk'|'airtel', bn: string, en: string }[], packs: Fact<DataPack[]>[] }, with one Fact per operator carrying its own source URL and checked date. DataPack = { id: string, operator: string, price: number (taka incl. VAT/SD), dataGb: number, validityDays: integer, name?: string }
