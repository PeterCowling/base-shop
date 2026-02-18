---
Type: Plan
Status: Active
Domain: UI | Data
Workstream: Mixed
Created: 2026-02-15
Last-updated: 2026-02-18
Feature-Slug: brikette-cta-sales-funnel-ga4
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-design-spec, /lp-seo
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); weighted by Effort (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: BRIK-005
---

# Brikette CTA + GA4 Sales Funnel — Plan v2

> **Historical context (completed + superseded tasks):** `docs/plans/brikette-cta-sales-funnel-ga4/plan-v1.md`

## Summary

**Scope amendment 2026-02-18:** The original plan (v1, which improved booking modals) is superseded
by a clean break: remove `BookingModal` / `Booking2Modal` entirely and route all booking-intent CTAs
directly to the `/{lang}/book` page or Octorate. Eleven original tasks are archived in plan-v1.md;
six completed tasks remain valid.

The target funnel is: CTA click → `/{lang}/book` (date picker + room list + conversion content) →
direct Octorate navigation from RoomCard with `begin_checkout`. The `/book` page currently has zero
persuasive content — it needs conversion content (DirectBookingPerks, social proof, FAQ, location)
and structured data. Ten other high-traffic pages have zero or weak booking CTAs. The GA4 e-commerce
pipeline is partially implemented — `view_item_list` (TASK-07, complete) and `view_item` (TASK-08,
complete) already exist; `select_item`, `search_availability`, `view_promotion`, `select_promotion`,
and reliable `begin_checkout` (with `items[]`) are still missing.

## Goals

- **Track E (prerequisite):** Remove `BookingModal`/`Booking2Modal` and all 9+2 call sites; route
  all booking-intent CTAs to `/{lang}/book` or direct Octorate links per the blast radius table
- **Track A:** Transform `/book` into a conversion-optimized page: add DirectBookingPerks, social
  proof, FAQ, LocationInline, lodging + FAQPage + BreadcrumbList JSON-LD, improved H1/meta; deal
  applied banner when `?deal=ID` param present
- **Track B:** Add `ContentStickyCta` to all 10 high-traffic pages that currently lack booking CTAs
- **Track C:** Implement coherent GA4 funnel: `cta_click` → `page_view(/book)` → `view_item_list`
  → `search_availability` → `select_item` → `begin_checkout`; add `view_promotion`/`select_promotion`
  for deals; apply `trackThenNavigate` for all outbound Octorate navigations; verify SPA page_view
  fires on internal navigation (Home → /book)
- **Track D:** Unit tests for all new helpers/events; Playwright smoke test on staging; GA4 DebugView
  + Network payload verification protocol; register custom dimensions in GA4 Admin

## Non-goals

- Octorate booking engine changes (external system)
- `purchase` event tracking (blocked by Octorate one-directional redirect; see fact-find for deferred options)
- A/B testing framework
- Booking modal usability improvements (modals being deleted)
- Google Ads / Search Console linking

## Constraints & Assumptions

- Constraints:
  - All GA4 verification must happen on staging (`staging.brikette-website.pages.dev`)
  - Staging is static export; middleware does NOT run; no SSR/ISR
  - Staging GA4 stream isolation is a hard gate for Track C verification (TASK-15 already complete)
  - `packages/ui` must not import `apps/brikette/*` analytics utilities — callback-prop pattern enforced
  - Track E (modal removal) must fully land before Track A/B/C tasks that touch CTA components
  - GA4 stack is gtag-based (not GTM); `?gtm_debug` does not work for DebugView; use Google Analytics
    Debugger extension or `debug_mode: true` in gtag config
  - Decision A (URL strategy: canonical `/{lang}/book` vs `getSlug` for in-app navigation) is
    provisional until TASK-22 route truth verification completes
  - **Next.js App Router does NOT auto-fire GA4 `page_view` on client-side navigation** — requires
    an explicit `gtag("config", ...)` or `gtag("event", "page_view", ...)` call in a
    `usePathname()`/`useEffect` hook (TASK-41)
  - **TASK-24 through TASK-28 form a single merge unit** — TASK-24 alone breaks TypeScript
    compilation (consumers not yet updated); these tasks must ship as one PR or tightly stacked PRs
    where each individual PR is CI-green before merging
- Assumptions:
  - Item identity: `items[].item_id = Room.sku` from `apps/brikette/src/data/roomsData.ts`
  - Item fields: `item_name` (room display title), `item_category: "hostel"` (static),
    `affiliation: "Hostel Brikette"` (static), `currency: "EUR"` (static)
  - Deals tracking: `view_promotion`/`select_promotion` model (not items model)
  - GA4 staging stream: separate data stream within same property (not separate property)
  - `trackThenNavigate` API: `(eventName, params, navigate, timeoutMs)` — helper owns
    `event_callback: go` wiring internally; caller is responsible for `e.preventDefault()` on
    outbound `<a>` elements; `navigate` callback uses `window.location.assign(href)`

## Fact-Find Reference

- Related brief: `docs/plans/brikette-cta-sales-funnel-ga4/fact-find.md`
- Key architectural decisions from fact-find:
  - Decision A: URL strategy (provisional: canonical `/{lang}/book` for in-app nav; pending TASK-22 verification)
  - Decision B: Dates gate — disable RoomCard CTAs until valid dates present on `/book`
  - Decision C: Analytics placement — callback props from app layer; `packages/ui` stays dumb
  - Decision D: Deals — `view_promotion`/`select_promotion`, navigate to `/book?deal=ID`
  - Decision E: RoomCard on `/rooms` — when `queryState === "absent"`, navigate to `/book` (not Octorate)

## Scope Amendment (2026-02-18)

**Decision (Pete):** Clean break from booking modals. Eleven original tasks superseded; six completed
tasks remain valid. See `plan-v1.md` for full detail on superseded tasks.

**Completed tasks that remain valid:** TASK-01, TASK-07, TASK-08, TASK-15, TASK-16 (DebugView method
needs amendment in TASK-40), TASK-18.

**Pending tasks that remain valid (reframed):** TASK-20, TASK-21, TASK-13, TASK-14.

## Monorepo Boundary Rule

`packages/ui` must not import `apps/brikette/*` analytics utilities.

**Pattern (Decision C):** UI components expose optional callback props; the app layer wires them to GA4 helpers:
- `onPrimaryCtaClick?: (ctaId: string, ctaLocation: string) => void`
- `onRoomCardClick?: (room: Room, plan: "nr" | "flex") => void`
- `onStickyCheckoutClick?: () => void`
- etc.

Brikette app passes `fireCTAClick`, `fireSelectItem`, `trackThenNavigate`-wrapped handlers via these props.

## Analytics Enums (Authoritative — post-amendment)

Source of truth: `apps/brikette/src/utils/ga4-events.ts` (`GA4_ENUMS`). Updated post-amendment to remove modal types.

- `item_list_id`: `home_rooms_carousel`, `rooms_index`, `book_rooms`, `room_detail`
- `cta_id`: `header_check_availability`, `mobile_nav_check_availability`, `hero_check_availability`, `booking_widget_check_availability`, `room_card_reserve_nr`, `room_card_reserve_flex`, `sticky_book_now`, `deals_book_direct`, `content_sticky_check_availability`, `offers_modal_reserve`
- `cta_location`: `desktop_header`, `mobile_nav`, `home_hero`, `home_booking_widget`, `rooms_list`, `book_page`, `room_detail`, `deals_page`, `guide_detail`, `about_page`, `bar_menu`, `breakfast_menu`, `assistance`, `how_to_get_here`, `offers_modal`
- `modal_type` (retained non-booking modals only): `offers`, `location`, `contact`, `facilities`, `language`
- `item_variant` (rate plan): `flex`, `nr`
- `source`: `header`, `mobile_nav`, `hero`, `booking_widget`, `deals`, `room_card`, `sticky_cta`, `offers_modal`, `unknown`

## Proposed Approach

Track E first (hard prerequisite):
1. Verify route truth (TASK-22) — canonical vs getSlug for in-app navigation
2. Extract Octorate URL builder utility (TASK-23) — load-bearing for RoomCard migration
3. Remove ModalType + packages/ui booking modal primitives (TASK-24) — TypeScript foundation
4. Remove brikette booking modal infrastructure (TASK-25) — delete files, lazy-modals, payloadMap
5. Migrate all openModal("booking") call sites (TASK-26) — 9 sites to Link/router.push
6. Migrate RoomCard to direct Octorate links with Decision B/E queryState (TASK-27) — 2 sites
7. Test cleanup + updates (TASK-28) — delete ga4-09/ga4-10, update 7 tests
8. Checkpoint (TASK-29)

Tracks A + B + C + D in parallel after checkpoint:
- Track C: trackThenNavigate helper, GA4 event helpers, enum update, wire all new events
- Track A: /book page conversion content + JSON-LD + deal banner
- Track B: ContentStickyCta to content pages
- Track D: custom dimensions ops, SPA page_view verification, verification protocol, reportWebVitals test

Playwright smoke test (TASK-38) last — requires staging deploy after Wave 7.

## Plan Gates

- Foundation Gate: **Pass** — fact-find has Deliverable-Type, Execution-Track, Primary-Execution-Skill, testability landscape, delivery-readiness confidence input
- Sequenced: **Yes** (see Parallelism Guide)
- Edge-case review complete: **Yes** — Decision A provisional pending TASK-22; all call sites documented; dates gate specified (Decision B/E); merge unit constraint documented for TASK-24–28
- Auto-build eligible: **Yes** (TASK-22 at 90%, TASK-23 at 85%; all Track E tasks ≥80 with no blocking decision gates)

## Task Summary

### Completed (for reference)

| Task ID | Type | Description | Confidence | Effort | Status |
|---|---|---|---:|---:|---|
| TASK-01 | IMPLEMENT | GA4 contract primitives (enums + item builder + dedupe scaffold) | 85% | S | Complete (2026-02-15) |
| TASK-07 | IMPLEMENT | view_item_list impressions with dedupe | 85% | M | Complete (2026-02-15) |
| TASK-08 | IMPLEMENT | view_item on room detail + apartment pages | 85% | M | Complete (2026-02-15) |
| TASK-15 | IMPLEMENT | Staging GA4 stream isolation | 85% | M | Complete (2026-02-15) |
| TASK-16 | IMPLEMENT | Verification protocol doc (DebugView method amended by TASK-40) | 85% | M | Complete (2026-02-15) |
| TASK-18 | IMPLEMENT | Impression dedupe fix (per-navigation) | 85% | S | Complete (2026-02-15) |

### Pending

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-13 | IMPLEMENT | Upgrade /book page (conversion content + JSON-LD + deal banner + i18n) | 80% | L | Pending | TASK-20,TASK-29 | — |
| TASK-14 | IMPLEMENT | Add ContentStickyCta to guide/about/menu content pages (Link-based) | 80% | M | Pending | TASK-21,TASK-29 | — |
| TASK-20 | INVESTIGATE | Lock /book JSON-LD field list + @type strategy + absolute URL source + snapshot-test plan | 85% | S | Pending | TASK-29 | TASK-13 |
| TASK-21 | INVESTIGATE | Content sticky CTA scope decision (pages + copy + Link-only approach) | 85% | S | Pending | TASK-29 | TASK-14 |
| TASK-22 | INVESTIGATE | Route truth verification: test in-app nav for localized slugs on static export | 90% | S | Pending | — | TASK-26,TASK-27 |
| TASK-23 | IMPLEMENT | Extract Octorate URL builder from Booking2Modal into shared utility + unit tests | 85% | M | Pending | — | TASK-27 |
| TASK-24 | IMPLEMENT | Remove ModalType booking/booking2 + delete packages/ui booking modal primitives | 85% | S | Pending | — | TASK-25,TASK-26 |
| TASK-25 | IMPLEMENT | Remove brikette booking modal infrastructure (lazy-modals, payloadMap, global-modals, delete files) | 85% | M | Pending | TASK-24 | TASK-26,TASK-28 |
| TASK-26 | IMPLEMENT | Migrate 9x openModal("booking") call sites to router.push/Link | 85% | M | Pending | TASK-22,TASK-24 | TASK-28 |
| TASK-27 | IMPLEMENT | Migrate 2x openModal("booking2") in RoomCard to direct Octorate link (Decision B + E queryState) | 82% | M | Pending | TASK-22,TASK-23,TASK-24 | TASK-28 |
| TASK-28 | IMPLEMENT | Delete ga4-09/ga4-10 extinct tests + update 7 affected modal-era tests | 85% | M | Pending | TASK-25,TASK-26,TASK-27 | TASK-29 |
| TASK-29 | CHECKPOINT | Horizon checkpoint: reassess post-modal-removal before GA4/content tracks begin | 95% | S | Pending | TASK-28 | TASK-20,TASK-21,TASK-30,TASK-31,TASK-37,TASK-40,TASK-41,TASK-42 |
| TASK-30 | IMPLEMENT | Create trackThenNavigate(eventName, params, navigate, timeoutMs) helper + unit tests | 85% | S | Pending | TASK-29 | TASK-32,TASK-35 |
| TASK-31 | IMPLEMENT | Create GA4 helpers: fireSearchAvailability, fireViewPromotion, fireSelectPromotion, fireCTAClick (updated) + unit tests | 85% | S | Pending | TASK-29 | TASK-33,TASK-34,TASK-36 |
| TASK-32 | IMPLEMENT | Wire select_item + begin_checkout on RoomCard direct Octorate navigation (via trackThenNavigate) | 83% | M | Pending | TASK-29,TASK-30,TASK-31,TASK-15 | — |
| TASK-33 | IMPLEMENT | Add search_availability to /book date picker (submit + initial valid URL params) | 82% | S | Pending | TASK-29,TASK-31,TASK-15 | — |
| TASK-34 | IMPLEMENT | Add view_promotion + select_promotion to deals page | 82% | S | Pending | TASK-29,TASK-31,TASK-15 | — |
| TASK-35 | IMPLEMENT | Add begin_checkout to StickyBookNow click (via trackThenNavigate) | 82% | S | Pending | TASK-29,TASK-30,TASK-15 | — |
| TASK-36 | IMPLEMENT | Add cta_click to header/hero/BookingWidget/OffersModal/content-page CTAs (navigation-based) | 82% | M | Pending | TASK-29,TASK-31,TASK-15 | — |
| TASK-37 | IMPLEMENT | Update GA4_ENUMS: remove booking/booking2 modal_type, add new enum values | 88% | S | Pending | TASK-29 | — |
| TASK-38 | IMPLEMENT | Playwright smoke test: navigate /book with dates, intercept g/collect, assert select_item + begin_checkout + Octorate URL | 82% | M | Pending | TASK-29,TASK-32,TASK-15 | — |
| TASK-39 | IMPLEMENT | Add test coverage for reportWebVitals.ts (absorbed from brik-ga4-baseline-lock TASK-04) | 80% | S | Pending | — | — |
| TASK-40 | IMPLEMENT | Update verification protocol (DebugView via GA Analytics Debugger, SPA page_view step, custom dimensions) | 85% | S | Pending | TASK-29 | — |
| TASK-41 | IMPLEMENT | Verify and implement page_view on SPA route changes (Home → /book internal navigation) | 80% | S | Pending | TASK-29 | — |
| TASK-42 | IMPLEMENT | Register GA4 custom dimensions in GA4 Admin (cta_id, cta_location, item_list_id, coupon) | 90% | S | Pending | TASK-31,TASK-37 | — |

> Effort scale: S=1, M=2, L=3. CHECKPOINT tasks excluded from confidence weighting.

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-22, TASK-23, TASK-24, TASK-39 | — | All independent: route truth verify, URL builder, ModalType removal, reportWebVitals test |
| 2 | TASK-25 | TASK-24 | Brikette modal infrastructure removal (depends on ModalType cleanup) |
| 3 | TASK-26, TASK-27 | TASK-22, TASK-24 (both); TASK-23 also for TASK-27 | Parallel call site migrations; TASK-22 verdict must be known for URL path |
| 4 | TASK-28 | TASK-25, TASK-26, TASK-27 | Test cleanup; all migrations must be complete |
| 5 | TASK-29 | TASK-28 | CHECKPOINT — must invoke /lp-replan before proceeding |
| 6 | TASK-20, TASK-21, TASK-30, TASK-31, TASK-37, TASK-40, TASK-41, TASK-42 | TASK-29 | Parallel: decisions + helpers + enum + protocol + SPA page_view + custom dimensions |
| 7 | TASK-13, TASK-14, TASK-32, TASK-33, TASK-34, TASK-35, TASK-36 | Wave 6 per task + TASK-15 | Parallel: all implementation tracks; TASK-13 needs TASK-20, TASK-14 needs TASK-21 |
| 8 | TASK-38 | TASK-32, TASK-15 + staging deploy | Playwright smoke test (staging only; requires staging deploy after Wave 7) |

**Max parallelism:** 4 (Wave 1) / 8 (Wave 6–7)
**Critical path:** TASK-22 → TASK-26 → TASK-28 → TASK-29 → TASK-30 → TASK-32 → TASK-38
**Total pending tasks:** 24 (Waves 1–8, excluding CHECKPOINT TASK-29)

**Merge unit PR strategy for TASK-24–28:**
- **Option A (recommended):** single PR containing all of TASK-24/25/26/27/28. Cleanest; TypeScript is always green at merge.
- **Option B:** stacked PRs, but "CI-green" means green *after stacking onto all prior PRs in the chain*, not individually. PR for TASK-25 stacks on TASK-24's branch; etc. Do not merge any PR in the chain until the full stack is ready.
- Wave 1/2/3/4 describes *development order*, not *merge order*. All TASK-24–28 changes are committed but held until the full stack is CI-green.

**Wave 6 suggested sub-ordering (still parallel, but start in this order to reduce fallout):**
TASK-37 (enums, establishes authoritative values) → TASK-31 (helpers, consume enums) → TASK-30 (trackThenNavigate) → TASK-41 (page_view) → TASK-40 (protocol doc) → TASK-42 (Admin dims — start **first** among Wave 6 ops tasks to account for 24–48h propagation delay).

## Tasks

### TASK-01: GA4 contract primitives
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Deliverable:** `apps/brikette/src/utils/ga4-events.ts`
- **Notes:** Completed. GA4_ENUMS values amended in TASK-37 (remove modal_type booking/booking2).

---

### TASK-07: view_item_list impressions with dedupe
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Notes:** Valid. Rooms index, book page rooms list, home rooms carousel. Per-navigation dedupe from TASK-18.

---

### TASK-08: view_item on room detail + apartment pages
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Notes:** Valid.

---

### TASK-15: Staging GA4 stream isolation
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Notes:** Valid. Separate GA4 data stream for staging; `NEXT_PUBLIC_GA_MEASUREMENT_ID` env-scoped per environment.

---

### TASK-16: Verification protocol doc
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Notes:** Valid but needs amendment: DebugView must use Google Analytics Debugger extension (not `?gtm_debug`). TASK-40 updates the doc.

---

### TASK-18: Impression dedupe fix (per-navigation)
- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-15)
- **Notes:** Valid.

---

### TASK-13: Upgrade /book page (conversion content + JSON-LD + deal banner + i18n)
- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` + new `BookPageStructuredData.tsx` + `bookPage.json` additions
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
  - `apps/brikette/src/app/[lang]/book/page.tsx`
  - `apps/brikette/src/components/seo/BookPageStructuredData.tsx` (new)
  - `apps/brikette/src/locales/en/bookPage.json`
- **Depends on:** TASK-20, TASK-29
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 80% — all needed components exist (`DirectBookingPerks`, `SocialProofSection`, `FaqStrip`, `LocationInline`); composition is the bulk of the work. JSON-LD field list + absolute URL source decided in TASK-20 first.
  - Approach: 82% — `dealsPage` namespace coupling in `DirectBookingPerks` needs resolution (allow book page to load additional namespaces — simplest approach).
  - Impact: 85% — high-impact: /book is the universal booking entry point post-amendment.
- **Acceptance:**
  - /book renders: DirectBookingPerks (above room cards), social proof strip, FAQ section, LocationInline, "Book Direct" value prop
  - H1: "Book Direct at Hostel Brikette, Positano" (no "only hostel" claim)
  - Meta title: "Book Direct at Hostel Brikette Positano | Best Price + Free Breakfast"
  - BookPageStructuredData renders `<script type="application/ld+json">` with LodgingBusiness + FAQPage + BreadcrumbList
  - JSON-LD `url` and `image` fields use `getSiteBaseUrl()` helper (locked in TASK-20); staging must not leak production domain
  - `<link rel="canonical">` set consistently with canonical URL policy from TASK-20
  - JSON-LD validates via Schema Markup Validator (schema.org correctness)
  - **Deal applied banner:** when `/book?deal=SUMMER25` URL param is present, a visible "Deal applied: SUMMER25" banner renders above the room cards; deal code is propagated into `buildOctorateUrl` calls (via TASK-23) so the discount applies at Octorate checkout
  - All new keys in `bookPage.json`; no hardcoded copy in components; no i18n key leakage on 3 non-EN locales
- **Validation contract:**
  - TC-01: Snapshot test for BookPageStructuredData JSON output — matches expected lodging schema fields
  - TC-02: No `aggregateRating` in JSON-LD output (third-party ratings not first-party)
  - TC-03: DirectBookingPerks renders without namespace errors on /book
  - TC-04: 3 non-EN locale renders show translated copy (not raw i18n keys)
  - TC-05: `/book?deal=SUMMER25` → deal banner visible; deal code present in Octorate URL generated by buildOctorateUrl
  - TC-06: `/book` with no deal param → no banner rendered
- **Execution plan:** Red (test snapshot fails) → Green (component added) → Refactor (key cleanup)
- **Planning validation:**
  - Checks run: None (planning-only)
  - Unexpected findings: `DirectBookingPerks` uses `dealsPage` namespace — plan allows additional namespace load on /book
- **Rollout / rollback:**
  - Rollout: additive; new components loaded on /book only
  - Rollback: revert commit
- **Documentation impact:** `docs/plans/brikette-cta-sales-funnel-ga4/fact-find.md` — mark Track A complete
- **Notes:** Does not depend on TASK-12 (modal copy, superseded). Structured data strategy locked in TASK-20.

---

### TASK-14: Add ContentStickyCta to content pages (Link-based)
- **Type:** IMPLEMENT
- **Deliverable:** Updated `GuideContent`, `BarMenuContent`, `BreakfastMenuContent`, about page, assistance pages, how-to-get-here pages with `<Link href="/{lang}/book">` sticky CTA
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/components/guides/GuideContent.tsx` (or equivalent)
  - `apps/brikette/src/app/[lang]/about/page.tsx`
  - `apps/brikette/src/app/[lang]/bar-menu/page.tsx`
  - `apps/brikette/src/app/[lang]/breakfast-menu/page.tsx`
  - `apps/brikette/src/app/[lang]/assistance/` pages
  - `apps/brikette/src/app/[lang]/how-to-get-here/` pages
  - `apps/brikette/src/components/cta/ContentStickyCta.tsx`
- **Depends on:** TASK-21, TASK-29
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 80% — `ContentStickyCta` exists and was already used (now Link-only, no modal); straightforward composition on target pages.
  - Approach: 82% — scope (which pages) determined by TASK-21.
  - Impact: 82% — adds booking path to 10 currently dead-end pages.
- **Acceptance:**
  - All pages identified in TASK-21 render `ContentStickyCta` with `<Link href="/{lang}/book">` (no `openModal`)
  - No `useModal` import on pages that only have the sticky CTA
  - CTA is session-dismissible per existing mechanism
  - cta_click event fires on click (TASK-36 dependency) — add `onCtaClick` prop if not already present
- **Validation contract:**
  - TC-01: ContentStickyCta renders `<a>` with expected href on 3 content page types
  - TC-02: openModal is not called anywhere in updated ContentStickyCta
  - TC-03: Click fires cta_click GA4 event (assert gtag called)
- **Execution plan:** Red → Green → Refactor
- **Planning validation:** None (planning-only)
- **Rollout / rollback:** Additive; revert commit
- **Documentation impact:** None

---

### TASK-20: Lock /book JSON-LD field list + @type strategy + absolute URL source + snapshot-test plan
- **Type:** INVESTIGATE
- **Deliverable:** Decision memo appended to `docs/plans/brikette-cta-sales-funnel-ga4/fact-find.md` (or inline decision note in TASK-13)
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Depends on:** TASK-29
- **Blocks:** TASK-13
- **Confidence:** 85%
  - Implementation: 85% — requires checking schema.org for `Hostel` vs `LodgingBusiness` type definitions.
  - Approach: 85% — decision is clear (use `Hostel`; omit `aggregateRating`; use static fields only).
  - Impact: 85% — prevents rework/bikeshedding on JSON-LD structure.
- **Questions to answer:**
  - `@type: "Hostel"` vs `"LodgingBusiness"` — which is more specific and supported?
  - Minimum required field set: `name`, `address`, `geo`, `url`, `image`, `checkinTime`, `checkoutTime`, `amenityFeature`, `priceRange`, `potentialAction: ReserveAction` — is this correct?
  - How to validate: Schema Markup Validator for schema.org; Rich Results Test for eligibility (not correctness)
  - `aggregateRating`: confirm third-party badges (Hostelworld, Booking.com) are not eligible for structured data markup
  - **Absolute URL source (static export constraint):** `headers().get("host")` is NOT available in static export (no server runtime). Lock to `NEXT_PUBLIC_SITE_URL` environment variable + a single `getSiteBaseUrl()` helper. This helper is the single source of truth for all absolute URLs in JSON-LD and canonical tags. Enforce: `new URL(path, getSiteBaseUrl()).toString()`.
  - **Canonical URL policy:** if Decision A results in both `/en/book` and `/en/prenota` being accessible (even temporarily), define which is canonical and set `<link rel="canonical">` + JSON-LD `url` field consistently to that choice. Specify this policy so TASK-13 and TASK-22 are coordinated.
- **Acceptance:**
  - `@type` strategy chosen with rationale
  - Minimum field set enumerated (static vs derived, how each is sourced)
  - Absolute URL source decided: `NEXT_PUBLIC_SITE_URL` + `getSiteBaseUrl()` helper documented; `headers().get("host")` ruled out (static export)
  - Canonical URL policy documented (which slug is canonical if both exist post-Decision A)
  - Snapshot test approach confirmed (what the `<script>` output must contain)
  - Validation tooling documented
- **Validation contract:** Decision memo written and reviewed; TASK-13 can proceed.

---

### TASK-21: Content sticky CTA scope + copy + Link-only approach
- **Type:** INVESTIGATE
- **Deliverable:** Decision memo (inline in fact-find or separate planning note)
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Depends on:** TASK-29
- **Blocks:** TASK-14
- **Confidence:** 85%
  - Implementation: 85% — scope and copy decisions needed before TASK-14.
  - Approach: 85% — Link-only approach confirmed (Decision C: no modal).
  - Impact: 85% — prevents scope creep or under-delivery on TASK-14.
- **Questions to answer:**
  - Which specific pages should receive `ContentStickyCta`? (Guide detail pages, how-to-get-here detail, assistance detail, about, bar-menu, breakfast-menu — all 10 listed in fact-find)
  - Dismiss TTL: session-dismiss (current behavior) or page-specific dismiss?
  - Copy: use existing `_tokens.checkAvailability` or book-specific copy?
  - Should it appear on index pages (assistance index, how-to-get-here index)?
- **Acceptance:**
  - Page list finalized
  - Dismiss TTL decided
  - Copy source decided (token vs custom)
  - Any z-index conflicts with guide TOC or image lightbox noted

---

### TASK-22: Route truth verification (Decision A)
- **Type:** INVESTIGATE
- **Deliverable:** Decision A updated in `docs/plans/brikette-cta-sales-funnel-ga4/fact-find.md` with verified URL strategy; update all call site table entries accordingly
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-cta-sales-funnel-ga4/fact-find.md` (decision update only)
- **Depends on:** —
- **Blocks:** TASK-26, TASK-27
- **Confidence:** 90%
  - Implementation: 90% — verification is a test operation; requires staging deploy or local dev.
  - Approach: 90% — two outcomes are clearly defined.
  - Impact: 90% — if verification shows getSlug fails for in-app nav, all call sites must use canonical `/{lang}/book`; wrong URL choice breaks Italian/German/etc. users.
- **Questions to answer:**
  - Does `router.push("/it/prenota")` (or `<Link href="/it/prenota">`) resolve correctly in the Next.js App Router on static export?
  - Does direct load of `https://staging.brikette-website.pages.dev/it/prenota` return 200 with correct content?
  - What does the browser URL bar show after in-app navigation to `/it/prenota` vs `/it/book`?
- **Acceptance:**
  - Test A (external direct load) and Test B (in-app navigation) documented with actual results
  - Decision A in fact-find updated: either "use `getSlug` everywhere" or "use `/{lang}/book` for in-app, `getSlug` for external only"
  - Call site table updated if needed
- **Validation contract:** Test results documented; Decision A marked "Verified (YYYY-MM-DD)" in fact-find.
- **Planning validation:** None (investigation task)

---

### TASK-23: Extract Octorate URL builder from Booking2Modal into shared utility
- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/utils/buildOctorateUrl.ts` (new) + `apps/brikette/src/utils/buildOctorateUrl.test.ts` (new)
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/utils/buildOctorateUrl.ts` (new)
  - `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx` ([readonly — source of truth for URL params])
- **Depends on:** —
- **Blocks:** TASK-27
- **Confidence:** 85%
  - Implementation: 85% — URL params are visible in `Booking2Modal.tsx`; extraction is mechanical. Risk: undiscovered param for NR vs Flex rate selection (need to verify rate code param name).
  - Approach: 88% — standalone utility with unit tests is the right pattern; prevents drift.
  - Impact: 90% — load-bearing for TASK-27 and TASK-13 deal propagation; wrong URL silently breaks room-specific bookings.
- **Acceptance:**
  - `buildOctorateUrl({ checkin, checkout, pax, plan, roomSku, rateCodes, bookingCode, deal? })` exported from new utility
  - **Return type is a discriminated union:** `{ ok: true; url: string } | { ok: false; error: "missing_rate_code" | "missing_booking_code" | "invalid_dates" }` — never throws; never returns null
  - Callers (RoomCard, StickyBookNow) check `result.ok` before rendering the Octorate link; render disabled CTA with appropriate message when `!result.ok`
  - Unit tests assert exact URL string for NR and Flex for at least 2 different rooms
  - Deal param (`&deal=ID&utm_source=site&utm_medium=deal&utm_campaign=ID`) included when `deal` is provided
  - `codice=45111` always present
- **Validation contract:**
  - TC-01: `buildOctorateUrl({ plan: "nr", roomSku: "brik-room-1", rateCodes: ..., ...dates })` → URL contains `&checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&codice=45111&pax=N` + NR rate params
  - TC-02: `plan: "flex"` → URL contains Flex rate params instead
  - TC-03: `deal: "SUMMER25"` → URL contains `&deal=SUMMER25&utm_source=site&utm_medium=deal&utm_campaign=SUMMER25`
  - TC-04: `deal: undefined` → URL does not contain `&deal=`
- **Execution plan:** Red (tests written referencing non-existent util) → Green (util extracted) → Refactor
- **Planning validation:** Checks run: read `Booking2Modal.tsx` for URL construction logic
- **Scouts:** Verify: what is the param name for the room-specific NR/Flex rate code? (Hypothesis: `codfta` or similar Octorate param — must confirm from Booking2Modal source.)
- **Edge Cases & Hardening:** Apartment entry in roomsData has TODO placeholders for rate codes — `buildOctorateUrl` must guard against undefined rate codes (return null or throw with informative error).
- **Rollout / rollback:** Additive new utility; Booking2Modal still imports its internal URL builder until TASK-27 deletes it.
- **Documentation impact:** None

---

### TASK-24: Remove ModalType booking/booking2 + delete packages/ui booking modal primitives
- **Type:** IMPLEMENT
- **Deliverable:** Modified `packages/ui/src/context/modal/context.ts`, deleted `packages/ui/src/organisms/modals/BookingModal.tsx` + `BookingModal2.tsx`, updated `packages/ui/src/organisms/modals/index.ts`
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `packages/ui/src/context/modal/context.ts`
  - `packages/ui/src/organisms/modals/BookingModal.tsx` (delete)
  - `packages/ui/src/organisms/modals/BookingModal2.tsx` (delete)
  - `packages/ui/src/organisms/modals/index.ts`
- **Depends on:** —
- **Blocks:** TASK-25, TASK-26
- **Confidence:** 85%
  - Implementation: 88% — deletions + type removal; TypeScript will surface all remaining consumers.
  - Approach: 90% — remove from the type system first; consumers must be updated before TypeScript will compile.
  - Impact: 85% — safe only after consumer call sites are verified; TASK-25/26/27 handle consumers.
- **Acceptance:**
  - `ModalType` union no longer contains `"booking"` or `"booking2"`
  - `BookingModal.tsx` and `BookingModal2.tsx` deleted from `packages/ui/src/organisms/modals/`
  - `index.ts` exports updated accordingly
  - Verify no non-brikette consumers exist before deletion (`grep -r "BookingModal" packages/ --include="*.tsx"` excluding deleted files)
- **Validation contract:**
  - TC-01: TypeScript compilation clean after TASK-24 + TASK-25 + TASK-26 + TASK-27 + TASK-28 are all landed (not independently)
  - TC-02: No import of `BookingModal` or `BookingModal2` from packages outside their deleted path
- **Execution plan:** Red (TypeScript fails with consumers still using deleted types) → Green (all consumers removed in TASK-25/26) → Refactor
- **Merge unit constraint:** TASK-24 alone produces TypeScript errors. **TASK-24/25/26/27/28 must be submitted as a single PR or tightly stacked PRs where each individual PR is CI-green before merging.** Do not merge TASK-24 independently.
- **Scouts:** Run `grep -r "BookingModal\|booking2" packages/ --include="*.tsx"` excluding `ui/organisms/modals` to confirm no other package consumers.
- **Rollout / rollback:** Revert commit. TypeScript enforces safety before merge.
- **Documentation impact:** None

---

### TASK-25: Remove brikette booking modal infrastructure
- **Type:** IMPLEMENT
- **Deliverable:** Deleted `BookingModal.tsx` + `Booking2Modal.tsx` from brikette global-modals; updated `lazy-modals.ts`, `payloadMap.ts`, `global-modals.tsx`
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/context/modal/global-modals/BookingModal.tsx` (delete)
  - `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx` (delete)
  - `apps/brikette/src/context/modal/lazy-modals.ts`
  - `apps/brikette/src/context/modal/payloadMap.ts`
  - `apps/brikette/src/context/modal/global-modals.tsx`
- **Depends on:** TASK-24
- **Blocks:** TASK-26, TASK-28
- **Confidence:** 85%
  - Implementation: 88% — surgical file deletions + targeted removals from 3 files.
  - Approach: 88% — changes are clearly specified in fact-find blast radius section.
  - Impact: 85% — TypeScript ensures no dangling references compile after TASK-24.
- **Acceptance:**
  - `lazy-modals.ts`: `BookingModal` and `BookingModal2` lazy imports removed + type imports `UIBookingModalProps`, `UIBookingModal2Props` removed
  - `payloadMap.ts`: `BookingPayload`, `Booking2Payload`, `parseBookingPayload`, `parseBooking2Payload` deleted; `booking` and `booking2` keys removed from `ModalPayloadMap`
  - `global-modals.tsx`: `BookingGlobalModal` and `Booking2GlobalModal` imports and switcher branches removed
  - Files `BookingModal.tsx` and `Booking2Modal.tsx` deleted
  - TypeScript compilation clean (combined with TASK-24/26/27/28)
- **Validation contract:**
  - TC-01: TypeScript compilation passes after TASK-24 + TASK-25 combined (consumers not yet resolved — this task is part of the merge unit)
  - TC-02: `grep -r "openModal.*booking" apps/brikette/src/context/` returns 0 results
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** Revert commit
- **Documentation impact:** None

---

### TASK-26: Migrate 9x openModal("booking") call sites to router.push/Link
- **Type:** IMPLEMENT
- **Deliverable:** Updated files across 8 components/pages (per blast radius table in fact-find)
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/app/[lang]/HomeContent.tsx` (lines 44, 50)
  - `apps/brikette/src/components/landing/BookingWidget.tsx` (line 186)
  - `apps/brikette/src/components/cta/ContentStickyCta.tsx` (line 134)
  - `apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx` (line 123)
  - `apps/brikette/src/components/not-found/NotFoundView.tsx` (line 112)
  - `apps/brikette/src/app/[lang]/deals/DealsPageContent.tsx` (lines 297, 300)
  - `apps/brikette/src/context/modal/global-modals/OffersModal.tsx` (line 55)
- **Depends on:** TASK-22, TASK-24
- **Blocks:** TASK-28
- **Confidence:** 85%
  - Implementation: 85% — URL path strategy confirmed by TASK-22; call sites clearly documented.
  - Approach: 88% — simple substitution: `openModal("booking")` → `router.push(\`/${lang}/book\`)` or `<Link href>`.
  - Impact: 85% — all booking CTA paths change; verified by TypeScript (after TASK-24 removes ModalType).
- **Acceptance:**
  - All 9 `openModal("booking")` call sites migrated per blast radius table
  - Components that exclusively used `openModal("booking")` drop the `useModal()` hook entirely
  - Components retaining other modal types keep the hook
  - URL path follows Decision A verdict from TASK-22
- **Validation contract:**
  - TC-01: `grep -r 'openModal.*"booking"' apps/brikette/src/ --include="*.tsx"` returns 0 results after migration
  - TC-02: BookingWidget submit → navigates to /book (router.push asserted in updated modal-integration-tc09 test)
  - TC-03: OffersModal "Reserve Now" → calls closeModal + router.push (not openModal)
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** Revert commit
- **Documentation impact:** None

---

### TASK-27: Migrate 2x openModal("booking2") in RoomCard to direct Octorate links
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/components/rooms/RoomCard.tsx` with direct `<a href={octorateUrl}>` and Decision B/E queryState logic
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/components/rooms/RoomCard.tsx`
  - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` (add `queryState` prop passing)
  - `[readonly] apps/brikette/src/utils/buildOctorateUrl.ts` (from TASK-23)
- **Depends on:** TASK-22, TASK-23, TASK-24
- **Blocks:** TASK-28
- **Confidence:** 82%
  - Implementation: 82% — RoomCard has all the data needed (`checkIn`, `checkOut`, `adults`, `room.rateCodes.direct.nr/flex`, `BOOKING_CODE`); `buildOctorateUrl` from TASK-23 is the URL builder.
  - Approach: 85% — Decision B (disabled state) and Decision E (absent → navigate to /book) are well-specified.
  - Impact: 88% — fixes the critical "RoomCard with no dates navigates to Octorate with garbage" UX regression.
- **Acceptance:**
  - RoomCard accepts `queryState: "valid" | "invalid" | "absent"` prop (replacing the former `hasValidQuery?: boolean` tri-state footgun):
    - `queryState === "invalid"` (from /book page, dates not set or invalid): button visually disabled (`aria-disabled`); if `datePickerRef` is provided, click scrolls to date picker with shake animation + accessible message; if no `datePickerRef`, button stays disabled with tooltip (no scroll — avoids undefined scroll behavior on non-/book contexts)
    - `queryState === "absent"` (no date context, e.g. /rooms page): button navigates to `/{lang}/book` (Decision E)
    - `queryState === "valid"` (from /book page, valid dates): button fires `select_item` + `begin_checkout` (via TASK-32) then navigates to Octorate
  - RoomCard "Reserve Now" buttons are `<a href={octorateUrl}>` (no `openModal("booking2")`)
  - When `buildOctorateUrl` returns `{ ok: false }`: button renders as disabled (not an `<a>` link) with an appropriate fallback message; no Octorate navigation
  - `BookPageContent.tsx` passes `queryState={validDates ? "valid" : "invalid"}` and `datePickerRef` to `RoomsSection`/`RoomCard`
  - `/rooms` page does NOT pass `queryState` (defaults to `"absent"`); does NOT pass `datePickerRef`
- **Validation contract:**
  - TC-01: RoomCard with `queryState="invalid"` → renders button as `aria-disabled`, click does not navigate
  - TC-02: RoomCard with `queryState="absent"` → renders active button pointing to `/{lang}/book`
  - TC-03: RoomCard with `queryState="valid"` → renders active `<a href>` pointing to Octorate URL with correct params
  - TC-04: Octorate URL from RoomCard matches URL from extracted builder unit test (TASK-23)
- **Execution plan:** Red → Green → Refactor
- **Planning validation:** Read RoomCard lines 120-209 to confirm data availability — confirmed (checkIn, checkOut, adults, room.rateCodes.direct.nr/flex available at call site)
- **Scouts:** Confirm `room.rateCodes.direct.nr` and `.flex` are always populated in `roomsData.ts` (apartment entry has TODOs — guard must handle undefined)
- **Edge Cases & Hardening:** Apartment rate code TODOs — `buildOctorateUrl` must return null for missing rate codes; RoomCard must not render Octorate link when null.
- **Rollout / rollback:** Revert commit
- **Documentation impact:** None

---

### TASK-28: Delete extinct tests + update 7 modal-era tests
- **Type:** IMPLEMENT
- **Deliverable:** Deleted test files (×2) + updated test assertions in 7 test files
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/test/components/ga4-09-booking-modal-begin-checkout.test.tsx` (delete)
  - `apps/brikette/src/test/components/ga4-10-booking2-modal-begin-checkout.test.tsx` (delete)
  - `apps/brikette/src/test/components/modal-integration-tc09.test.tsx` (update: router.push not openModal)
  - `apps/brikette/src/test/components/content-sticky-cta.test.tsx` (update: navigation not openModal)
  - `apps/brikette/src/test/components/deals-page.test.tsx` (update: router.push to /book?deal=...)
  - `apps/brikette/src/test/components/experiences-page.test.tsx` (update: router.push not openModal)
  - `apps/brikette/src/test/components/ga4-11-select-item-room-ctas.test.tsx` (update: Octorate URL, not openModal)
  - `apps/brikette/src/test/context/modal-provider-effects.test.tsx` (update: use retained modal type)
  - `apps/brikette/src/test/components/ga4-cta-click-header-hero-widget.test.tsx` (update: navigation assertions)
- **Depends on:** TASK-25, TASK-26, TASK-27
- **Blocks:** TASK-29
- **Confidence:** 85%
  - Implementation: 88% — test changes mirror the production changes; extinct tests are straightforward deletes.
  - Approach: 88% — update assertions to match new navigation patterns.
  - Impact: 85% — all 23 pending Jest tests must pass before checkpoint.
- **Acceptance:**
  - `pnpm --filter brikette test` passes clean (no failures, no skips added)
  - ga4-09 and ga4-10 test files deleted (not skipped)
  - 7 updated tests assert navigation (router.push/Link/href) not openModal
  - `modal-provider-effects.test.tsx` uses a retained modal type (`"location"` or similar)
- **Validation contract:**
  - TC-01: `pnpm --filter brikette test` exits 0
  - TC-02: No remaining assertion like `expect(openModal).toHaveBeenCalledWith("booking", ...)` in test suite
- **Execution plan:** Red (delete extinct tests first; update assertions to match new behavior) → Green → Refactor
- **Rollout / rollback:** Revert commit
- **Documentation impact:** None

---

### TASK-29: CHECKPOINT — Horizon checkpoint post-modal-removal
- **Type:** CHECKPOINT
- **Deliverable:** Reassessed plan via `/lp-replan` for Track A/B/C/D tasks
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-cta-sales-funnel-ga4/plan.md`
- **Depends on:** TASK-28
- **Blocks:** TASK-20, TASK-21, TASK-30, TASK-31, TASK-37, TASK-40, TASK-41, TASK-42
- **Confidence:** 95%
  - Implementation: 95% — process is defined.
  - Approach: 95% — prevents deep dead-end execution.
  - Impact: 95% — controls downstream risk.
- **Acceptance:**
  - `/lp-build` executor confirms TASK-28 complete and test suite green
  - `/lp-replan` run on TASK-20, TASK-21, TASK-30–TASK-42 with updated evidence
  - Plan updated and re-sequenced if needed
- **Horizon assumptions to validate:**
  - Is the TypeScript compilation fully clean after all Track E work? (No residual booking/booking2 references)
  - Are any Track C events already accidentally duplicated in the existing code (from superseded TASK-06/11)?
  - Are there any RoomCard rendering issues post-queryState on staging?
- **Validation contract:** TASK-28 complete; `pnpm --filter brikette test` green; plan updated post-replan.

---

### TASK-30: Create trackThenNavigate helper + unit tests
- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/utils/trackThenNavigate.ts` (new) + unit tests
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/utils/trackThenNavigate.ts` (new)
- **Depends on:** TASK-29
- **Blocks:** TASK-32, TASK-35
- **Confidence:** 85%
  - Implementation: 88% — API is fully specified; existing `getGtag()` pattern available.
  - Approach: 90% — canonical outbound reliability helper; locked API prevents drift.
  - Impact: 85% — outbound event loss is the primary risk for begin_checkout; this mitigates it.
- **Acceptance:**
  - `trackThenNavigate(eventName, params, navigate, timeoutMs = 200)` exported
  - API: helper builds gtag call internally with `transport_type: "beacon"` and `event_callback: go`
  - `go` is defined before event fire; `navigated` flag prevents double-call
  - If `getGtag()` returns null, navigate is called immediately (no hang)
  - **200ms timeout rationale:** empirically-established UX trade-off — short enough to feel near-instant, long enough for most browsers to dispatch the beacon before page unload. Document this in the helper's JSDoc comment.
  - **Caller contract for outbound `<a>` elements:**
    - **shouldInterceptClick guard (required at every call site):** only intercept when `e.button === 0` (primary button) AND `!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey` AND `target !== "_blank"`. If the guard fails, do NOT call `e.preventDefault()` — let the browser handle Cmd/Ctrl-click (new tab), middle-click, right-click normally. Best-effort: fire the GA4 event without beacon delay in that case (no navigation block).
    - When guard passes: call `e.preventDefault()` first, then `trackThenNavigate(...)`; the `navigate` callback performs navigation via `window.location.assign(href)`. This is the caller's responsibility, not the helper's.
    - **Double-click / multi-tap deduplication (required at every call site):** set an `isNavigating` flag (React ref or state) on first intercept; ignore subsequent clicks until navigation completes. This prevents duplicate `select_item`/`begin_checkout` fires on mobile double-tap.
- **Validation contract:**
  - TC-01: gtag called with `{ transport_type: "beacon", event_callback: <fn> }` + all passed params
  - TC-02: navigate called after event_callback fires (not before)
  - TC-03: navigate called after timeout if callback never fires (mock setTimeout)
  - TC-04: navigate called immediately when gtag is absent (null guard)
  - TC-05: navigate not called twice when both callback and timeout fire
  - TC-06: Caller contract documented — test that when invoked from an `<a>` onClick, `e.preventDefault()` was called before navigate and navigation occurs only via `window.location.assign(href)` inside the navigate callback (integration-level assertion in TASK-32 tests)
- **Execution plan:** Red (all TCs written) → Green (util implemented) → Refactor
- **Rollout / rollback:** Additive new util; revert commit
- **Documentation impact:** None

---

### TASK-31: Create new GA4 event helpers + unit tests
- **Type:** IMPLEMENT
- **Deliverable:** New helper functions in `apps/brikette/src/utils/ga4-events.ts`: `fireSearchAvailability`, `fireViewPromotion`, `fireSelectPromotion`, `fireCTAClick` (updated), `fireSelectItem` (updated for direct-nav context)
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/utils/ga4-events.ts`
- **Depends on:** TASK-29
- **Blocks:** TASK-33, TASK-34, TASK-36
- **Confidence:** 85%
  - Implementation: 88% — follows established `getGtag()` + `window.gtag("event", ...)` pattern exactly.
  - Approach: 88% — event shapes fully specified in fact-find Event Contract table.
  - Impact: 85% — additive helpers; no call sites wired yet (done in TASK-32-36).
- **Acceptance:**
  - `fireSearchAvailability({ nights, lead_time_days, pax })` — no raw date strings
  - `fireViewPromotion({ items: [...promotions] })` — deals promotions model
  - `fireSelectPromotion({ items: [...promotions] })` — single deal click
  - `fireCTAClick({ cta_id, cta_location })` — updated to drop modal intercept context
  - `fireSelectItem({ item_list_id, item_list_name, items[] })` — updated for direct-nav context (no modal)
  - **All item events include required GA4 e-commerce fields:**
    - `item_id` (= room.sku from roomsData)
    - `item_name` (= room display title / name string)
    - `item_category: "hostel"` (static)
    - `affiliation: "Hostel Brikette"` (static)
    - `currency: "EUR"` (static)
    - `item_variant` ("nr" or "flex")
  - `begin_checkout` in deal context includes `coupon: deal.id` (deal code propagated from URL param)
  - All helpers use canonical enums from TASK-37; unit tests assert gtag called with correct shape
- **Validation contract:**
  - TC-01 through TC-05: one test per helper asserting full gtag call args using canonical enums
  - TC-06: `fireSelectItem` includes `item_name`, `item_category`, `affiliation`, `currency` in items[]
  - TC-07: `begin_checkout` with `deal` context includes `coupon: deal.id`

---

### TASK-32: Wire select_item + begin_checkout on RoomCard direct Octorate navigation
- **Type:** IMPLEMENT
- **Deliverable:** Updated `RoomCard.tsx` firing `select_item` + `begin_checkout` via `trackThenNavigate` before Octorate navigation; unit test
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/components/rooms/RoomCard.tsx`
  - `[readonly] apps/brikette/src/utils/trackThenNavigate.ts`
  - `[readonly] apps/brikette/src/utils/ga4-events.ts`
- **Depends on:** TASK-29, TASK-30, TASK-31, TASK-15
- **Blocks:** —
- **Confidence:** 83%
  - Implementation: 83% — RoomCard already has all needed data post-TASK-27; just needs GA4 event wiring.
  - Approach: 85% — callback prop pattern per Decision C; GA4 in app layer.
  - Impact: 88% — this is the core e-commerce event; without it the funnel has no select_item or begin_checkout.
- **Acceptance:**
  - **Event ordering (explicit decision):** fire `select_item` fire-and-forget (no beacon delay needed), then use `trackThenNavigate` only for `begin_checkout`. This ensures navigation is not blocked waiting for `select_item` callback, and occasional ordering noise in raw streams is acceptable. Do not chain `begin_checkout` inside `select_item`'s event_callback (adds latency, no funnel benefit).
  - onClick applies shouldInterceptClick guard (TASK-30 caller contract) and `isNavigating` ref before calling `e.preventDefault()`
  - Pattern: `fireSelectItem({...})` (fire-and-forget) → `trackThenNavigate("begin_checkout", {...}, () => window.location.assign(octorateUrl))`
  - `item_list_id` sourced from props (e.g. `"book_rooms"` or `"rooms_index"`)
  - `items[]` includes: `item_id` (room.sku), `item_name` (room display title), `item_category: "hostel"`, `affiliation: "Hostel Brikette"`, `currency: "EUR"`, `item_variant` ("nr" or "flex")
  - Navigation occurs only via `window.location.assign(octorateUrl)` inside the `navigate` callback — never directly from the onClick handler
  - Both events verified in staging via Network tab (items[] and item_id present in collect request)
- **Validation contract:**
  - TC-01: onClick (plain left click, no modifiers) → `e.preventDefault()` called; `select_item` gtag called fire-and-forget with correct item (incl. item_name, item_category, affiliation, currency)
  - TC-02: onClick → `trackThenNavigate` called with `begin_checkout` event; navigation occurs after callback or timeout
  - TC-03: navigation to Octorate URL occurs via `window.location.assign` inside navigate callback
  - TC-04: `trackThenNavigate` called with `transport_type: "beacon"` (asserted via mock)
  - TC-05: Cmd+click (metaKey=true) → `e.preventDefault()` NOT called; browser handles normally
  - TC-06: second click while `isNavigating=true` → `e.preventDefault()` NOT called; no duplicate GA4 events fired
- **Rollout / rollback:** Revert commit

---

### TASK-33: Add search_availability to /book date picker
- **Type:** IMPLEMENT
- **Deliverable:** Updated `BookPageContent.tsx` firing `search_availability` on date picker submit and on initial valid URL param load
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
  - `[readonly] apps/brikette/src/utils/ga4-events.ts`
- **Depends on:** TASK-29, TASK-31, TASK-15
- **Blocks:** —
- **Confidence:** 82%
  - Implementation: 85% — fire on "Update" button click and on mount when URL params are valid.
  - Approach: 88% — `nights` and `lead_time_days` derived from dates; no raw date strings in params.
  - Impact: 80% — analytically valuable (measures date-search dropoff) but not blocking other funnel events.
- **Acceptance:**
  - `fireSearchAvailability({ nights, lead_time_days, pax })` fires on "Update" submit
  - Fires once on mount if `?checkin=X&checkout=Y` params are valid dates (with at least 1 night)
  - Does not fire on invalid/empty date fields
  - **Search-key dedupe:** deduplication key must include `checkin + checkout + pax`, not just navigation/session. When user changes dates and re-submits on the same page, `search_availability` fires again (and `view_item_list` should also re-fire — coordinate with existing TASK-07 dedupe so the post-search list impression is not suppressed by the initial-load impression)
  - Dedupe guard: does not fire twice for the same `(checkin, checkout, pax)` triple in one render cycle
- **Validation contract:**
  - TC-01: Submit with valid dates → gtag called with `search_availability` + correct nights/lead_time_days/pax
  - TC-02: Submit with invalid dates → gtag NOT called
  - TC-03: Mount with valid URL params → gtag called once

---

### TASK-34: Add view_promotion + select_promotion to deals page
- **Type:** IMPLEMENT
- **Deliverable:** Updated `DealsPageContent.tsx` firing `view_promotion` + `select_promotion`
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/app/[lang]/deals/DealsPageContent.tsx`
  - `[readonly] apps/brikette/src/utils/ga4-events.ts`
- **Depends on:** TASK-29, TASK-31, TASK-15
- **Blocks:** —
- **Confidence:** 82%
  - Implementation: 85% — simple event fire; deal card data is local to `DealsPageContent`.
  - Approach: 88% — promotions model confirmed in Decision D; `promotion_id` = deal ID string.
  - Impact: 80% — analytically valuable for deal funnel visibility.
- **Acceptance:**
  - `fireViewPromotion` fires once on render when deal cards are present
  - `fireSelectPromotion` fires on "Book Direct" deal card click
  - `promotion_id` = deal ID string; `promotion_name` = deal title
  - `select_promotion` fires before `router.push("/{lang}/book?deal=ID")`
- **Validation contract:**
  - TC-01: Render → `view_promotion` called with deals promotions array
  - TC-02: Click → `select_promotion` called with single promotion; then navigation to /book?deal=ID

---

### TASK-35: Add begin_checkout to StickyBookNow click
- **Type:** IMPLEMENT
- **Deliverable:** Updated `StickyBookNow.tsx` (packages/ui) with optional `onBeforeNavigate` callback prop; wired in brikette app layer to fire `begin_checkout` via `trackThenNavigate`
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `packages/ui/src/organisms/StickyBookNow.tsx`
  - `apps/brikette/src/app/[lang]/rooms/[id]/page.tsx` (or wrapper that renders StickyBookNow)
  - `[readonly] apps/brikette/src/utils/trackThenNavigate.ts`
- **Depends on:** TASK-29, TASK-30, TASK-15
- **Blocks:** —
- **Confidence:** 82%
  - Implementation: 85% — StickyBookNow is a plain `<a>`; add `onBeforeNavigate?: () => void` optional prop; app layer wires `trackThenNavigate`.
  - Approach: 88% — callback prop pattern (Decision C); UI stays dumb.
  - Impact: 80% — StickyBookNow is high-intent (room detail page) but currently fires zero GA4 events.
- **Acceptance:**
  - StickyBookNow exposes `onBeforeNavigate?: () => void` optional prop
  - When prop provided: **onClick calls `e.preventDefault()`**, then calls `onBeforeNavigate()` which invokes `trackThenNavigate("begin_checkout", {...}, () => window.location.assign(href))`
  - When prop not provided: navigation proceeds normally (backward-compatible — no `e.preventDefault()`)
  - `items[]` includes room context (`item_id: room.sku`, `item_name`, `item_category: "hostel"`, `affiliation: "Hostel Brikette"`, `currency: "EUR"`, `item_variant` from rate-code context)
  - Note: room context must be passed from the room detail page down through the component tree to the StickyBookNow wrapper
- **Validation contract:**
  - TC-01: onClick with `onBeforeNavigate` → `e.preventDefault()` called; callback fired; navigation occurs via `window.location.assign(href)` inside callback
  - TC-02: onClick without `onBeforeNavigate` → navigation proceeds normally (backward-compatible)
  - TC-03: `trackThenNavigate` called with `begin_checkout` + correct item (incl. item_name, item_category, affiliation, currency)
- **Scouts:** Confirm room context is available in the component tree at the StickyBookNow render point. If not, assess cost of threading props vs. using URL params from page context.

---

### TASK-36: Add cta_click to header/hero/BookingWidget/OffersModal CTAs (navigation-based)
- **Type:** IMPLEMENT
- **Deliverable:** Updated CTA components firing `fireCTAClick` on navigation (not modal-open) events
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `packages/ui/src/organisms/DesktopHeader.tsx`
  - `packages/ui/src/organisms/MobileNav.tsx`
  - `apps/brikette/src/app/[lang]/HomeContent.tsx`
  - `apps/brikette/src/components/landing/BookingWidget.tsx`
  - `apps/brikette/src/context/modal/global-modals/OffersModal.tsx`
- **Depends on:** TASK-29, TASK-31, TASK-15
- **Blocks:** —
- **Confidence:** 82%
  - Implementation: 83% — each component needs an `onPrimaryCtaClick` callback prop (Decision C); app layer wires `fireCTAClick`.
  - Approach: 85% — standard callback prop pattern; no GA4 in packages/ui.
  - Impact: 82% — `cta_click` is the funnel entry point; without it, the CTA→/book conversion cannot be measured.
- **Acceptance:**
  - Header, mobile nav, hero, BookingWidget CTAs each fire `fireCTAClick({ cta_id, cta_location })` on navigate-to-book click
  - OffersModal "Reserve Now" fires `fireCTAClick({ cta_id: "offers_modal_reserve", cta_location: "offers_modal" })`
  - No modal intercept in cta_click; events fire on navigation intent only
  - `ContentStickyCta` cta_click wired via TASK-14 (separate task)
- **Validation contract:**
  - TC-01 through TC-05: one test per CTA surface asserting gtag called with correct cta_id + cta_location
- **Rollout / rollback:** Revert commit

---

### TASK-37: Update GA4_ENUMS: remove booking/booking2 modal_type + add new values
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/utils/ga4-events.ts` GA4_ENUMS (or equivalent enum object)
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/utils/ga4-events.ts`
- **Depends on:** TASK-29
- **Blocks:** —
- **Confidence:** 88%
  - Implementation: 90% — straightforward enum update; TypeScript catches misuse.
  - Approach: 90% — remove deleted modal types; add new enums from fact-find.
  - Impact: 88% — maintains enum authority; prevents enum drift in TASK-31/32/33/34/35/36.
- **Acceptance:**
  - `modal_type` enum: `booking` and `booking2` removed; `offers`, `location`, `contact`, `facilities`, `language` retained
  - `item_list_id` enum: `room_detail` verified present (may already exist — confirm, add if not)
  - `cta_id` enum: `offers_modal_reserve` verified present (listed in authoritative section above — confirm, add if not)
  - `cta_location` enum: `offers_modal` verified present (listed in authoritative section above — confirm, add if not)
  - Note: the Analytics Enums section in this plan already shows the target state; TASK-37 job is to make `ga4-events.ts` match that authoritative list — verify presence, do not assume values are missing
  - All references to removed enum values produce TypeScript errors (confirming their absence)
- **Validation contract:**
  - TC-01: TypeScript compilation clean with new enums
  - TC-02: Existing tests using retained enum values still pass

---

### TASK-38: Playwright smoke test for GA4 events on staging
- **Type:** IMPLEMENT
- **Deliverable:** New Playwright test file; documented run instructions for staging
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/test/e2e/ga4-smoke.test.ts` (or `playwright/` directory)
- **Depends on:** TASK-29, TASK-32, TASK-15
- **Blocks:** —
- **Confidence:** 82%
  - Implementation: 82% — intercept pattern for GA4 collect endpoint is well-documented in Playwright.
  - Approach: 85% — verified approach; Playwright available in repo.
  - Impact: 85% — makes GA4 verification repeatable by CI on every staging deploy.
- **Acceptance:**
  - Test navigates to `https://staging.brikette-website.pages.dev/en/book?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&pax=2`
  - **Intercepts requests matching `**/g/collect`** (wildcard — captures GET and POST; matches both `www.google-analytics.com` and `region1.google-analytics.com` variants)
  - For POST requests: parse body as URLSearchParams (Measurement Protocol batch format); for GET requests: parse query string. Event name is in `en=` param.
  - Clicks first room card NR CTA
  - Asserts intercepted request contains `en=select_item` with correct `item_id`
  - Asserts intercepted request contains `en=begin_checkout` with correct `item_id`
  - **Asserts `tid` parameter in intercepted request matches staging measurement ID** (from `NEXT_PUBLIC_GA_MEASUREMENT_ID` staging env; confirms stream isolation)
  - Asserts navigation URL matches `book.octorate.com`
  - **Localized slug scenario:** additionally navigate to `/it/<book-slug>?checkin=...&checkout=...&pax=2` (slug determined by TASK-22 verdict), click first room card, assert same `select_item` + `begin_checkout` events fire — guards Decision A routing on static export
  - Test is skipped in CI unless `RUN_GA4_SMOKE=true` env is set (staging-only)
- **Validation contract:**
  - TC-01: Full test scenario described above passes on staging
- **Scouts:** Confirm GA4 collect endpoint (`**/g/collect`) is correct; confirm Playwright intercept works with beacon transport (intercept is at network level, so transport type does not matter).

---

### TASK-39: Add test coverage for reportWebVitals.ts
- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/test/performance/reportWebVitals-coverage.test.ts` (new or updated)
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/test/performance/reportWebVitals-coverage.test.ts`
  - `[readonly] apps/brikette/src/performance/reportWebVitals.ts`
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 80% — absorbed from `brik-ga4-baseline-lock` TASK-04; test seam not yet decided.
  - Approach: 82% — mock `web-vitals` callbacks to trigger `sendBeacon` call; assert payload.
  - Impact: 80% — baseline coverage gap; prevents regression.
- **Acceptance:**
  - At least one test verifies `reportWebVitals` calls `navigator.sendBeacon` with correct endpoint and payload when a web vital fires
  - `pnpm --filter brikette test` passes
- **Validation contract:**
  - TC-01: Mock `web-vitals` onCLS callback → `sendBeacon` called with correct params
- **Scouts:** Decide test seam: mock `navigator.sendBeacon` directly, or mock the `web-vitals` import. Choose based on what's most stable (prefer mocking at the narrowest boundary).

---

### TASK-40: Update verification protocol (DebugView + SPA page_view + custom dimensions)
- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/plans/brikette-cta-sales-funnel-ga4/verification-protocol.md` (or updated TASK-16 output)
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `docs/plans/brikette-cta-sales-funnel-ga4/verification-protocol.md` (update)
- **Depends on:** TASK-29
- **Blocks:** —
- **Confidence:** 85%
  - Implementation: 88% — update existing doc; primary changes are DebugView method + new verification steps.
  - Approach: 88% — clear spec: use Google Analytics Debugger extension, not `?gtm_debug`.
  - Impact: 82% — prevents wasted time debugging DebugView not showing events.
- **Acceptance:**
  - Protocol references Google Analytics Debugger browser extension for DebugView activation (not `?gtm_debug`)
  - `debug_mode: true` in gtag config documented as staging-only alternative
  - Verification steps cover: select_item, begin_checkout (with items[]), search_availability, view_promotion, select_promotion, cta_click
  - **SPA page_view step:** verify that navigating internally from Home → /book produces a `page_view` event with correct `page_path` and `page_location` in DebugView and Network tab
  - Network tab probe steps documented (filter `**/g/collect`)
  - **Custom dimensions step:** verify `cta_id`, `cta_location`, `item_list_id`, `coupon` are visible in GA4 DebugView event params after TASK-42 configuration

---

### TASK-41: Verify and implement page_view on SPA route changes
- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/app/layout.tsx` or root provider updated to fire `page_view` on client-side navigation (if not already present); unit test
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/app/layout.tsx` (or root provider/client component)
  - `apps/brikette/src/utils/ga4-events.ts` (possibly — may add `firePageView` helper)
- **Depends on:** TASK-29
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 80% — Next.js App Router does NOT auto-fire GA4 `page_view` on client-side navigation (gtag snippet fires only on initial hard-load); requires explicit `gtag("config", ...)` or `gtag("event", "page_view", ...)` in a `usePathname()`/`useEffect` hook.
  - Approach: 85% — standard Next.js + gtag pattern is well-documented; add a `PageViewTracker` client component using `usePathname()` + `useEffect`.
  - Impact: 85% — without this, GA4 Funnel Exploration missing `page_view(/book)` step when user navigates internally (Home → /book), breaking the funnel visualization.
- **Acceptance:**
  - Investigate first: does the existing gtag snippet use `send_page_view: false`? Does any hook already call `gtag("config", ...)` on pathname change?
  - **Choose and implement one pattern — document the choice in a code comment:**
    - **Pattern A (recommended if snippet has `send_page_view: false`):** add `PageViewTracker` using `usePathname()` + `useEffect` that fires `gtag("event", "page_view", { page_path: pathname, page_location: window.location.href })` on every pathname change including initial load
    - **Pattern B (if snippet already handles initial load):** add `PageViewTracker` that fires `gtag("config", MEASUREMENT_ID, { page_path: pathname })` on pathname changes only (skips initial render with a `isFirst` ref) — this sends `page_view` via the config call automatically
  - Do NOT mix both patterns — double page_view on SPA navigation is a silent data quality failure. Document which is chosen and why.
  - Does not cause duplicate page_view on initial load (verify in DebugView: only one page_view on hard load)
  - Verified on staging: navigate from Home → /book via header CTA; confirm exactly one `page_view` with `page_path: "/en/book"` in DebugView and Network tab
- **Validation contract:**
  - TC-01: Mock `usePathname()` change → `gtag("event", "page_view", ...)` called with updated path and location
  - TC-02: Does not fire on initial render — only on pathname change
- **Scouts:** Search `apps/brikette/src/` for any existing `page_view` or `pageview` gtag call to avoid duplication before implementing.
- **Rollout / rollback:** Additive component; revert commit
- **Documentation impact:** TASK-40 verification protocol must cover SPA route-change page_view step

---

### TASK-42: Register GA4 custom dimensions in GA4 Admin (ops task)
- **Type:** IMPLEMENT
- **Deliverable:** Documented GA4 Admin configuration: `cta_id`, `cta_location`, `item_list_id`, `coupon` registered as event-scoped custom dimensions; screenshot or confirmation in verification-protocol.md
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - GA4 Admin — not a code change; requires GA4 property access
  - `docs/plans/brikette-cta-sales-funnel-ga4/verification-protocol.md` (add confirmation screenshot/note)
- **Depends on:** TASK-31, TASK-37
- **Blocks:** —
- **Confidence:** 90%
  - Implementation: 95% — manual GA4 Admin steps; well-documented procedure.
  - Approach: 90% — event-scoped custom dimensions are the correct type for per-event params.
  - Impact: 85% — without registration, custom params (`cta_id`, `cta_location`, `item_list_id`) appear in `event_params` but are NOT queryable in GA4 Explorations or custom reports; this is a silent reporting gap.
- **Acceptance:**
  - **Start immediately at Wave 6 open** (do not wait for other Wave 6 tasks) — 24–48h propagation delay means delaying registration delays when dimensions appear in Explorations
  - GA4 Admin → Custom Definitions → Custom Dimensions (event-scoped):
    - `cta_id` → dimension created
    - `cta_location` → dimension created
    - `item_list_id` → dimension created
    - `coupon` → **verify first:** check if GA4 already has a built-in "Coupon" dimension available in Explorations (some properties surface this automatically for e-commerce events). If already available and queryable, do NOT create a duplicate custom dimension. Document the outcome either way.
  - Screenshot or written confirmation of all 4 dimensions (or 3 if coupon is built-in) visible in GA4 Admin documented in verification-protocol.md (TASK-40 output)
  - Note: propagation delay means dimensions are registerable on day 1 but may not appear in Explorations until 24–48h later — register early
- **Validation contract:**
  - TC-01: All 4 custom dimensions visible in GA4 Admin → Custom Definitions after configuration
- **Execution plan:** Manual: GA4 Admin → Property → Custom Definitions → Create dimension × 4
- **Rollout / rollback:** GA4 Admin changes; revert by deleting the custom dimension definitions if needed
- **Documentation impact:** TASK-40 verification protocol

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Route truth verification (TASK-22) reveals getSlug slugs fail for in-app navigation on static export | Medium | High | TASK-22 is Wave 1 (before any call site migration); all 9+2 migrations blocked until verdict. Provisional strategy already uses canonical `/{lang}/book`. |
| Octorate URL param for NR/Flex rate code is not `rateCodes.direct.nr/flex` as assumed | Low | High | TASK-23 scouts: read Booking2Modal.tsx source before writing tests. URL builder fails gracefully (null) for missing rate codes. |
| Track E TypeScript changes break compilation before all consumer migrations land | Medium | Low | TASK-24 first (ModalType), then TASK-25 (infrastructure), then TASK-26/27 (consumers). TASK-24–28 are a single merge unit — never merge TASK-24 alone. TypeScript errors are the safety net, not the failure. |
| SPA page_view not firing on internal navigation (Home → /book) | High | High | TASK-41 is Wave 6; verified before verification protocol finalised. Next.js App Router requires explicit `usePathname()` hook for gtag page_view. |
| GA4 custom dimensions not registered — `cta_id`, `cta_location` not queryable in reports | High if missed | Medium | TASK-42 Wave 6 ops task. Explicitly planned. 24–48h propagation delay — register early in Wave 6. |
| StickyBookNow room context not available at render point (TASK-35) | Medium | Medium | TASK-35 scouts: confirm component tree. If context unavailable, fall back to generic begin_checkout without specific room item. |
| Staging GA4 stream not isolated before Track C tasks begin | High if missed | High | TASK-15 already complete; this is a hard gate for TASK-32–TASK-36. |
| Book page conversion content (TASK-13) hurts LCP | Low | Medium | All proposed components are lightweight (text + icons). Monitor LCP via existing Web Vitals reporting. |
| Playwright smoke test (TASK-38) can't intercept beacon transport requests | Low | Low | Playwright intercept works at network level regardless of transport type. Wildcard `**/g/collect` catches both GET and POST. |
| SPA page_view double-counts on initial load (TASK-41) | Medium | Medium | Must choose one pattern (A or B) and document it. Verify in DebugView: exactly one page_view on hard load, one on each SPA navigation. |
| Cmd/Ctrl-click on Octorate CTA breaks (opens same tab instead of new tab) | High | Medium | shouldInterceptClick guard required at all trackThenNavigate call sites. Guard is in TASK-30 caller contract; enforced by TC-05 in TASK-32. |
| view_item_list undercounts post-search list on /book (dedupe suppresses re-fire) | Medium | Medium | TASK-33 search-key dedupe (checkin+checkout+pax) resets view_item_list dedupe on meaningful query changes. Coordinate with TASK-07 dedupe implementation. |
| buildOctorateUrl returns error state (apartment missing rate codes) — UI silently shows broken CTA | Low | High | Discriminated union return type; RoomCard renders disabled button on `{ ok: false }` (TASK-23/27). User sees fallback, not a broken navigation. |

## Observability

- **GA4 events:** Each new event verified via Google Analytics Debugger extension + Network tab `**/g/collect` payload inspection + GA4 Realtime report
- **SPA page_view:** Verify Home → /book navigation produces `page_view` with correct `page_path` (TASK-41)
- **Funnel visualization:** GA4 Funnel Exploration: `page_view(/book)` → `view_item_list` → `search_availability` → `select_item` → `begin_checkout`
- **Custom dimensions:** `cta_id`, `cta_location`, `item_list_id`, `coupon` queryable in GA4 Explorations after TASK-42 registration
- **Structured data:** Schema Markup Validator for schema.org correctness; Rich Results Test for eligibility only (not correctness)
- **Web Vitals:** Existing `reportWebVitals.ts` + `web_vitals` GA4 event; monitor LCP on /book post-TASK-13
- **Staging:** Deploy trigger → Playwright smoke test → manual verification checklist (TASK-40 protocol)

## Acceptance Criteria (overall)

- [ ] TypeScript compilation clean — no references to `"booking"` or `"booking2"` modal types; no `openModal("booking")` or `openModal("booking2")` call sites
- [ ] All brikette Jest tests pass (`pnpm --filter brikette test`)
- [ ] /book page: conversion-optimized H1/meta, DirectBookingPerks, social proof, FAQ, LocationInline, lodging + FAQPage + BreadcrumbList JSON-LD (no third-party aggregateRating); deal applied banner when `?deal=ID` present
- [ ] JSON-LD absolute URLs sourced from env config (not hardcoded); staging must not leak production domain
- [ ] All 10 high-traffic pages with zero/weak CTAs have at least one booking CTA
- [ ] GA4 funnel events implemented: `view_item_list`, `view_item`, `search_availability`, `select_item`, `begin_checkout` (with items[] incl. item_name, item_category, affiliation, currency), `cta_click`, `view_promotion`, `select_promotion`
- [ ] `begin_checkout` always includes `items[]` (room context always known at click time); no availability-only begin_checkout events remain
- [ ] `begin_checkout` in deal context includes `coupon: deal.id`
- [ ] Booking modals fully removed — 4 files deleted, 11 call sites migrated
- [ ] `trackThenNavigate` used for all outbound Octorate navigations (RoomCard, StickyBookNow); caller always calls `e.preventDefault()` first; navigate callback uses `window.location.assign(href)`
- [ ] SPA page_view fires on internal navigation (e.g. Home → /book); verified in DebugView
- [ ] GA4 custom dimensions registered: cta_id, cta_location, item_list_id, coupon
- [ ] GA4 events verified on staging (Google Analytics Debugger + Network tab `**/g/collect` proof)
- [ ] `tid` in GA4 collect requests matches staging measurement ID (stream isolation confirmed)
- [ ] Structured data validates for schema.org correctness (Schema Markup Validator)
- [ ] Playwright smoke test passes on staging
- [ ] Decision A resolved (route truth verification complete)

## Decision Log

- 2026-02-15: GA4 semantics model A chosen (clean funnel; availability-only exits not polluting begin_checkout)
- 2026-02-15: Staging GA4 stream isolation: separate data stream within same property (not separate property)
- 2026-02-15: Item identity: `items[].item_id = Room.sku` (not Octorate room/rate codes)
- 2026-02-18: **Scope amendment — clean break from booking modals.** Decision (Pete): remove BookingModal/Booking2Modal entirely; route all CTAs to /book or Octorate directly. 11 tasks superseded. See plan-v1.md.
- 2026-02-18: Decision B (dates gate): RoomCard CTAs disabled until valid dates present on /book
- 2026-02-18: Decision C (analytics placement): callback props from app layer; packages/ui stays dumb
- 2026-02-18: Decision D (deals): view_promotion/select_promotion model; navigate to /book?deal=ID
- 2026-02-18: Decision E (RoomCard on /rooms): `queryState === "absent"` → navigate to /book (not Octorate). `hasValidQuery?: boolean` tri-state replaced with `queryState: "valid" | "invalid" | "absent"` discriminated union.
- 2026-02-18: Decision A (URL strategy): provisional — use `/{lang}/book` for in-app navigation until TASK-22 verifies getSlug behavior on static export
- 2026-02-18: Merge unit policy — TASK-24/25/26/27/28 must ship as a single PR or tightly stacked PRs (CI-green at each step); TASK-24 alone is not independently mergeable

## Overall-confidence Calculation

Pending tasks only (S=1, M=2, L=3). CHECKPOINT tasks excluded.

| Task | Confidence | Effort | Weight × Confidence |
|---|---|---|---|
| TASK-22 | 90% | S=1 | 90 |
| TASK-23 | 85% | M=2 | 170 |
| TASK-24 | 85% | S=1 | 85 |
| TASK-25 | 85% | M=2 | 170 |
| TASK-26 | 85% | M=2 | 170 |
| TASK-27 | 82% | M=2 | 164 |
| TASK-28 | 85% | M=2 | 170 |
| TASK-30 | 85% | S=1 | 85 |
| TASK-31 | 85% | S=1 | 85 |
| TASK-32 | 83% | M=2 | 166 |
| TASK-33 | 82% | S=1 | 82 |
| TASK-34 | 82% | S=1 | 82 |
| TASK-35 | 82% | S=1 | 82 |
| TASK-36 | 82% | M=2 | 164 |
| TASK-37 | 88% | S=1 | 88 |
| TASK-20 | 85% | S=1 | 85 |
| TASK-13 | 80% | L=3 | 240 |
| TASK-21 | 85% | S=1 | 85 |
| TASK-14 | 80% | M=2 | 160 |
| TASK-38 | 82% | M=2 | 164 |
| TASK-39 | 80% | S=1 | 80 |
| TASK-40 | 85% | S=1 | 85 |
| TASK-41 | 80% | S=1 | 80 |
| TASK-42 | 90% | S=1 | 90 |

**Total weight:** 35
**Weighted sum:** 2922
**Overall-confidence:** 2922 ÷ 35 = **84%**
