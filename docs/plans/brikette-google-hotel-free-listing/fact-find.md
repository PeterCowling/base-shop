---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: SEO / Distribution
Workstream: Mixed
Created: 2026-02-18
Last-updated: 2026-02-18
Feature-Slug: brikette-google-hotel-free-listing
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brikette-google-hotel-free-listing/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Google Hotel Free Listing (via Octorate) — Fact-Find Brief

## Scope

### Summary

Hostel Brikette is missing from Google Hotel Search (the hotel booking panel that appears when users search for accommodation in Positano). The site has rich schema.org structured data, a first-party booking engine, and already uses Octorate as its channel manager/PMS. Octorate is a certified Google connectivity partner that can submit real-time rates and availability to Google's Hotel Prices API. Activating the free listing requires both a business-side Octorate configuration step and a small set of schema fixes on the codebase side.

### Goals

- Appear in Google Hotel Search free booking links ("Official Site" slot) for Positano accommodation queries
- Have the direct `/book` URL surfaced as the bookable endpoint Google serves to searchers
- Ensure schema.org structured data is consistent with what Google's price-accuracy crawlers expect

### Non-goals

- Google Hotel Ads (paid CPC/cost-per-stay) — free links first
- Google Vacation Rental path — Brikette is a hostel, not a vacation rental; it goes through the Hotel route
- Rebuilding the booking engine or migrating away from Octorate
- Modifying rate parity policy or OTA strategy

### Constraints & Assumptions

- Constraints:
  - Brikette already uses Octorate as its PMS/booking engine (`codice=45111`, confirmed via noscript fallback in `/app/[lang]/book/page.tsx:66`)
  - No `telephone` field in hotel schema — this is an explicit policy decision (`builders.ts:105`, comment: "no telephone per contact policy")
  - Schema `@type` for runtime output is `"Hostel"` throughout; static `.jsonld` snapshot files use `"Hotel"` but are test fixtures (`example.test` domain) and not production-served schema
- Assumptions:
  - Brikette has a Google Business Profile (CID `17733313080460471781` is referenced in `hasMap` and `sameAs`)
  - GBP verification status is unknown — must be confirmed
  - Octorate Metasearch package activation status is unknown — must be confirmed

---

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/app/[lang]/book/page.tsx:66` — `<noscript>` fallback reveals Octorate booking engine URL: `https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111`. Confirms Brikette is an active Octorate customer.
- `apps/brikette/src/components/seo/HomeStructuredData.tsx` — emits full `Hostel` + `HotelRoom[]` + `Offer[]` graph on homepage
- `apps/brikette/src/components/seo/BookStructuredData.tsx` — emits bare `Hostel` node on `/book` page (no `aggregateRating`, no `additionalProperty`)

### Key Modules / Files

- `apps/brikette/src/utils/schema/builders.ts` — central schema generation; `buildHotelNode()`, `buildOffer()`, `buildRoomNode()`
- `apps/brikette/src/config/hotel.ts` — hotel config: email, ratings, sameAs, priceRange, amenities, check-in/out
- `apps/brikette/src/config/baseUrl.ts` — BASE_URL resolution (env priority: `NEXT_PUBLIC_BASE_URL` → domain envs → `hostel-positano.com`)
- `apps/brikette/src/schema/hostel-brikette/hotel.jsonld` — stale test fixture (`example.test` domain, `@type: Hotel`)
- `apps/brikette/public/schema/hostel-brikette/hotel.jsonld` — byte-for-byte identical to src version; same test fixture
- `apps/brikette/src/schema/hostel-brikette/offers.jsonld` — empty `"@graph": []`
- `apps/brikette/src/app/[lang]/book/page.tsx` — the direct booking page Octorate will link to

### Data & Contracts

- Types/schemas/events:
  - `buildHotelNode()` returns an object with `@type: "Hostel"`, `@id: ${BASE_URL}/#hotel`, address, geo, priceRange, amenityFeature, openingHoursSpecification, checkinTime, checkoutTime, sameAs, hasMap, aggregateRating, image[]
  - `buildOffer(input)` adds `potentialAction.target.urlTemplate: "${BASE_URL}/api/quote?sku=..."` — this URL template is broken (no handler)
  - `hotel.ts` exports `CONTACT_EMAIL = "hostelpositano@gmail.com"`, `RATINGS_SNAPSHOT_DATE = "2025-11-01"`, combined `aggregateRating.ratingValue = 9.2` (3336 reviews)
- Persistence:
  - `apps/brikette/public/data/rates.json` — static per-SKU daily rate calendar; drives on-site booking widget; NOT connected to Google's feed
- API/contracts:
  - `${BASE_URL}/api/quote` — referenced in every `Offer` ReserveAction but **no route handler exists** (`src/app/api/` directory does not exist)
  - Octorate Booking Engine: `https://book.octorate.com/...?codice=45111` — this is the real booking endpoint

### Dependency & Impact Map

- Upstream dependencies:
  - `builders.ts` ← `hotel.ts` (config data) ← `config/baseUrl.ts` (URL resolution)
  - Schema components ← `builders.ts`
  - Octorate Booking Engine ← Octorate subscription (external)
  - Google Hotel Search ← Octorate rate feed (external, requires Metasearch package active)
- Downstream dependents:
  - `HomeStructuredData`, `BookStructuredData`, `RoomsStructuredData`, `RoomStructuredData` all consume `buildHotelNode()` / `buildOffer()`
  - Adding `reservationUrl` to the hotel node affects all pages that render the hotel node
- Likely blast radius:
  - Changes to `builders.ts` affect every page with JSON-LD output — low risk (additive changes only)
  - Fixing or removing the `/api/quote` URL template in `buildOffer()` affects offer nodes across rooms/home/book pages — additive or replacement only

### Delivery & Channel Landscape

- Audience/recipient: Google Hotel Search crawler + users searching for Positano accommodation on Google
- Channel constraints:
  - Google free booking links are zero-cost at the Google level
  - Octorate Metasearch package is a subscription component — pricing is quote-based, not publicly listed; may require plan upgrade
  - Google's price accuracy policy (enforced from September 22, 2025): structured data prices must match landing page prices at 98–100% accuracy
  - As of July 30, 2025, direct self-service rate management via GBP is no longer available — connectivity partner (Octorate) is now mandatory
- Existing templates/assets:
  - Octorate booking engine at `codice=45111` is live and handles the transaction
  - On-site `/book` page provides the landing page experience Octorate will use as the direct booking URL
- Approvals/owners:
  - Octorate subscription changes require owner (Peter) to log in to Octorate and confirm/upgrade
  - GBP verification requires owner to complete Google's verification flow
- Compliance constraints:
  - Google price accuracy policy: prices in Octorate's feed must match what users see on the `/book` landing page
  - NAP consistency: GBP name/address/phone must match Octorate account data exactly for property matching
- Measurement hooks:
  - Google Hotel Search impressions/clicks visible in Google Hotel Center (once activated)
  - In Octorate, bookings from Google free links show as green (G) icons in the Bookings view
  - GA4 booking funnel: `/book` page already instrumented for GA4 events (per existing brikette-cta-sales-funnel-ga4 work)

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Activating Octorate Metasearch + Google toggle will surface Brikette in Google Hotel Search within 2 weeks | GBP verified + Metasearch package active | Zero (just enable and observe) | 2 weeks |
| H2 | The broken `/api/quote` ReserveAction URL negatively impacts Google's ability to validate the booking flow | Google's crawler attempting to resolve the URL | Low (fix the URL and resubmit) | Unknown |
| H3 | Missing `reservationUrl` on the Hostel node causes Google to not find a direct booking URL | Google's hotel indexing logic | Low (add the field) | Unknown |
| H4 | Absence of `telephone` in schema slows or prevents GBP property matching | Google's NAP matching algorithm | Low (add the field if policy allows) | Unknown |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Octorate is a certified Google connectivity partner; free links route is documented | Octorate help.octorate.com, community.octorate.com | High |
| H2 | `/api/quote` route confirmed absent (`src/app/api/` does not exist) | Codebase inspection | Confirmed gap |
| H3 | `reservationUrl` not present in `buildHotelNode()` output | `builders.ts` inspection | Confirmed gap |
| H4 | `telephone` deliberately excluded per policy comment in `builders.ts:105` | `builders.ts:105` | Confirmed policy decision |

#### Recommended Validation Approach

- Quick probes:
  - Owner: check Octorate Menu > Upgrade > Version to confirm Metasearch package status (5 min)
  - Owner: check GBP verification status at google.com/business (5 min)
  - Dev: run Google Rich Results Test on `https://hostel-positano.com/en/` to confirm current schema output
- Structured tests:
  - After code changes: validate JSON-LD output with Google's Schema Markup Validator
  - After Octorate activation: monitor Google Hotel Center for property matching status (within 48 hours of activation)
- Deferred validation:
  - Full Google Hotel Search visibility: 2 weeks post-activation
  - Booking attribution via Octorate green (G) icons: monitor monthly

---

## External Research

- **Hostel eligibility confirmed**: Google Hotel Center explicitly lists hostels as an eligible hotel-owner property type. Google Vacation Rentals explicitly excludes hostels. Octorate documentation suggesting hostel ineligibility for Hotel Ads refers to its own internal routing for properties enrolled under Octorate's vacation rental product division — not a Google-level restriction. Source: Google Hotel Center Help (support.google.com/hotelprices/answer/9970971); Beds24 wiki; Cloudbeds hostel FAQ.
- **Octorate activation path**: Metasearch toggle at Marketing > Metasearch > Google ON. Requires: Channel Manager + Booking Engine + Metasearch package all active (Menu > Upgrade > Version). Source: community.octorate.com, help.octorate.com/en/articles/2412393.
- **Timeline**: 36 hours for Metasearch to activate, up to 2 additional weeks for Google inventory to update. Source: Octorate community article.
- **GBP requirement**: GBP must be verified; address+phone in GBP must exactly match Octorate account data. Source: Octorate help center.
- **Property matching**: Fully automatic via Octorate (address+phone-based). No Hotel Center account creation needed by property owner — Octorate manages this. Source: Octorate documentation.
- **Dorm beds**: Supported in Google Hotel Search. Connectivity partners route mixed dorms through the hotel product and display combined dorm-bed rates per party size. Source: Cloudbeds hostel restriction guide.
- **Google price accuracy policy**: Enforced from September 22, 2025. Feed prices must match landing page prices at 98–100% accuracy. Source: Google Hotel Center Help (support.google.com/hotelprices/answer/14739390).

---

## Questions

### Resolved

- Q: Is the Octorate Metasearch package currently active on Brikette's subscription?
  - A: **Yes — confirmed active as of 2026-02-18.** Octorate dashboard shows: *"Your Meta Search is active. Therefore, if you registered your Google My Business account properly with your exact address and map setup, the price of your Booking Engine will be visible on the second Google Hotel search block, for free."* The Google Free Listing / Price Comparison feature is active. No subscription upgrade required.
  - Evidence: Owner-confirmed via Octorate dashboard (Menu > Upgrade > Version)

- Q: Is a hostel eligible for Google Hotel free booking links, or must it use Google Vacation Rentals?
  - A: Google Hotel free booking links (not Vacation Rentals). Google explicitly includes hostels in the Hotel Center eligible property list. Google Vacation Rentals explicitly excludes hostels.
  - Evidence: `support.google.com/hotelprices/answer/9970971`, Beds24 wiki, Cloudbeds hostel FAQ

- Q: Does Brikette already use Octorate?
  - A: Yes — Octorate booking engine URL `https://book.octorate.com/...?codice=45111` is present in the site's noscript fallback.
  - Evidence: `apps/brikette/src/app/[lang]/book/page.tsx:66`

- Q: Does the `/api/quote` endpoint exist?
  - A: No — `src/app/api/` directory does not exist. The ReserveAction URLTemplate will 404 in production.
  - Evidence: Codebase inspection

### Open (User Input Needed)

- Q: Is Brikette's Google Business Profile currently verified?
  - Why it matters: An unverified GBP blocks property matching entirely. Verification can take days to weeks.
  - Decision impacted: Timeline — if GBP is not yet verified, that's the critical path item before anything else.
  - Decision owner: Peter
  - Verification path: Go to google.com/business → check for "Verified" badge on the Brikette listing.
  - Default assumption: GBP exists (CID is referenced in schema) but verification status unknown.

- Q: Should the `telephone` policy be revisited to improve NAP matching with GBP?
  - Why it matters: Google's property matching uses name + address + phone. Missing phone weakens the match signal, though geo+address may be sufficient for Positano (likely unique location).
  - Decision impacted: Whether to add `telephone` to `buildHotelNode()` output.
  - Decision owner: Peter (business/privacy decision)
  - Default assumption: Keep current policy (no telephone); geo+address match should be sufficient for a unique Positano location.

---

## Confidence Inputs

- **Implementation**: 85%
  - Basis: Exact file + line locations identified for all code changes. Schema generation is well-understood. Only open question is `/api/quote` resolution path.
  - To reach ≥80: Already there.
  - To reach ≥90: Decide on `/api/quote` approach (stub endpoint vs. replace URL with `/book`).

- **Approach**: 70%
  - Basis: Hostel eligibility confirmed. Octorate activation path is documented. Business-side steps are clear.
  - To reach ≥80: Confirm Octorate Metasearch package is active and GBP is verified.
  - To reach ≥90: Octorate activated + first property-matched confirmation in Google Hotel Center.

- **Impact**: 75%
  - Basis: Google Hotel Search is a high-intent channel (users actively searching for Positano accommodation). Octorate free links are zero-commission. No current Google Hotel presence means any listing is net-positive.
  - To reach ≥80: Confirm GBP is verified (removes the main timeline uncertainty).
  - To reach ≥90: Observe first Google Hotel impressions in Hotel Center dashboard.

- **Delivery-Readiness**: 70%
  - Basis: Octorate Metasearch confirmed active (2026-02-18). Code changes are ready to plan. One remaining blocker: GBP verification status unknown.
  - To reach ≥80: Owner confirms GBP is verified and address+phone match Octorate account data.
  - To reach ≥90: GBP confirmed verified + code tasks shipped.

- **Testability**: 60%
  - Basis: Schema changes are testable via Google's Rich Results Test and Schema Markup Validator. Octorate/GBP state is external and not automatable. Google Hotel Search appearance has a 2-week lag.
  - To reach ≥80: Add a schema output unit test verifying `reservationUrl` is present on the Hostel node.
  - To reach ≥90: Not realistic until external validation is possible post-activation.

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| ~~Octorate Metasearch package not included in current subscription tier~~ | ~~Medium~~ | ~~High~~ | **Resolved — Metasearch confirmed active (2026-02-18)** |
| GBP not yet verified | Medium | Critical — blocks all Google property matching until resolved | Check google.com/business immediately; Google verification can take 1–5 business days |
| Property not matched by Google (address overlap, overclustering) | Low-Medium | Medium — listing appears but does not show in Hotel Search | Octorate property matching is automatic; if NOT_MATCHED, manually align GBP data with Octorate account data |
| Octorate routes Brikette through Vacation Rental product instead of Hotel | Low | High — wrong product, hostel ineligible for Vacation Rentals | Confirm property type classification in Octorate account; should be "Hotel / Hostel" not "Vacation Rental" |
| `/api/quote` 404 causes Google crawler penalty on Offer schema | Low-Medium | Low-Medium — affects rich result eligibility, not core free listing | Fix: replace URL template with `/book?sku=...&checkin=...&checkout=...` or stub a redirect handler |
| Hardcoded `availability: InStock` on all Offers flagged by price accuracy crawler | Low | Medium — potential suppression if Google checks availability accuracy | Consider dynamically deriving from rates.json, or accept static value as best-effort for schema |
| NAP mismatch (no telephone) causes slow property matching | Low | Low — geo+address should be sufficient for unique Positano location | Monitor matching status in Hotel Center post-activation; add telephone to schema if matching fails |
| 2-week Google inventory update delay misaligns with business expectations | Certain | Low — timeline expectation setting only | Set expectation that free listing visibility takes up to 2 weeks after Octorate activation |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - All schema changes go through `builders.ts` — do not edit static `.jsonld` files for production behaviour
  - The static `src/schema/` and `public/schema/` JSON-LD files are test fixtures only (use `example.test` domain); if updating, update both copies together
  - Schema `@type` must remain `"Hostel"` in runtime output (consistent with existing implementation)
  - No `telephone` on hotel node unless owner explicitly approves the policy change
- Rollout/rollback expectations:
  - Code changes (schema additions) are additive and safe to ship independently of Octorate activation
  - Octorate Metasearch toggle can be reversed if needed (toggle off in Marketing > Metasearch)
- Observability expectations:
  - Google Rich Results Test: verify schema after deploy
  - Google Search Console: confirm no structured data errors post-deploy
  - Google Hotel Center (via Octorate): monitor property matching and impression data

---

## Suggested Task Seeds (Non-binding)

### Business tasks (owner, no code)
1. **Confirm Octorate Metasearch package status** — Log in to Octorate, Menu > Upgrade > Version. If inactive, contact Octorate to activate/purchase.
2. **Verify GBP listing** — Confirm Google Business Profile for Hostel Brikette is verified. If unverified, initiate verification flow (postcard / phone / video). Ensure name, address, and phone in GBP exactly match Octorate account data.
3. **Activate Google free booking links** — In Octorate: Marketing > Metasearch > toggle Google ON > Save. Requires Metasearch package active.
4. **Confirm property type in Octorate is "Hotel/Hostel"** (not "Vacation Rental") to ensure correct Google feed routing.

### Code tasks (developer)
5. **Add `reservationUrl` to Hostel schema node** — In `builders.ts` `buildHotelNode()`, add `"reservationUrl": "${BASE_URL}/book"` (or the localised equivalent). This surfaces the direct booking URL at the hotel entity level.
6. **Fix the broken `ReserveAction` URL template** — The `potentialAction.target.urlTemplate` in `buildOffer()` references `${BASE_URL}/api/quote` which 404s. Options: (a) stub a `/api/quote` redirect to `/book` with params, or (b) replace the URL template with `${BASE_URL}/book?sku={sku}&checkin={checkin}&checkout={checkout}`. Option (b) is simpler and avoids a dead API route.
7. **(Optional) Add `potentialAction` to the hotel node itself** — A `ReserveAction` on the `Hostel` node (not just individual `Offer` nodes) with `target.urlTemplate: "${BASE_URL}/book"` provides a hotel-level booking action for Google's crawler.
8. **(Low priority) Reconcile static `.jsonld` test fixtures** — Update `src/schema/hostel-brikette/hotel.jsonld` and its `public/` copy: change `@type` from `Hotel` to `Hostel` and note they are test fixtures. Not production-blocking but reduces confusion.

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build` (for code tasks 5–8)
- Supporting skills: none
- Deliverable acceptance package:
  - Business tasks: owner confirms Octorate activation + GBP verification complete
  - Code tasks: Google Rich Results Test passes for homepage and `/book` page; `reservationUrl` present in JSON-LD output; no `/api/quote` references remain
- Post-delivery measurement plan:
  - T+0: Rich Results Test validation
  - T+48h: Check Octorate property matching status in Hotel Center
  - T+2 weeks: Monitor Google Hotel Search for "Hostel Brikette" in Positano results
  - T+30 days: Review Google Hotel Center impressions/clicks; Octorate booking source attribution (green G icons)

---

## Evidence Gap Review

### Gaps Addressed

- Citation integrity: All non-trivial claims backed by file/line references or cited external sources
- Octorate hostel eligibility conflict: Fully resolved — hostels go through Google Hotels not Vacation Rentals; Octorate statement was platform-routing-specific
- `/api/quote` existence: Confirmed absent via direct codebase inspection
- Octorate customer status: Confirmed via `page.tsx:66` noscript fallback
- Dorm bed eligibility: Confirmed supported via Cloudbeds hostel documentation

### Confidence Adjustments

- Delivery-Readiness reduced to 55% (from initial ~70% estimate) because two owner-confirmable unknowns — Octorate Metasearch package activation and GBP verification — are on the critical path and could gate the entire effort
- Impact kept at 75% rather than 80%+ because Google property matching is automatic but unconfirmed; matching can fail silently for 2+ weeks

### Remaining Assumptions

- GBP CID `17733313080460471781` corresponds to a verified (not just claimed) GBP listing
- Brikette's Octorate account is classified as "Hotel" type (not "Vacation Rental"), routing it to the Hotel Ads/free links feed
- The on-site `/book` page URL (`https://hostel-positano.com/en/book`) will be accepted by Google as a valid direct booking landing page (not an OTA redirect)
- Octorate's booking engine dynamically serves competitive rates that will satisfy Google's price accuracy requirements

---

## Planning Readiness

- Status: **Needs-input**
- Blocking items:
  1. ~~Octorate Metasearch package active?~~ **Confirmed active (2026-02-18)**
  2. ~~Owner must confirm: Is the GBP verified?~~ **Confirmed verified (2026-02-18) — blue badge visible in GBP dashboard**
- Recommended next step:
  - Owner checks both items above (< 30 minutes). If both are confirmed, Delivery-Readiness rises to ≥80% and this brief is **Ready-for-planning**. Proceed to `/lp-do-plan`.
  - Code tasks (5–8) can be planned and executed independently — they do not require owner confirmation to proceed.
