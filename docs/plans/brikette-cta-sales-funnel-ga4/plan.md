---
Type: Plan
Status: Active
Domain: UI | Data
Workstream: Mixed
Created: 2026-02-15
Last-updated: 2026-02-18 (TASK-30, TASK-31, TASK-32, TASK-33, TASK-34, TASK-40, TASK-41 complete — Wave 7 in progress)
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
  - Decision A: URL strategy — RESOLVED (TASK-22, 2026-02-18): use `/{lang}/book` for all in-app navigation; `getSlug` for SEO-facing external URLs only
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
| TASK-22 | INVESTIGATE | Route truth verification: test in-app nav for localized slugs on static export | 90% | S | Complete (2026-02-18) | — | TASK-26,TASK-27 |
| TASK-23 | IMPLEMENT | Extract Octorate URL builder from Booking2Modal into shared utility + unit tests | 85% | M | Complete (2026-02-18) | — | TASK-27 |
| TASK-24 | IMPLEMENT | Remove ModalType booking/booking2 + delete packages/ui booking modal primitives (scope expanded: all packages/ui consumers) | 85% | S | Complete (2026-02-18) | — | TASK-25,TASK-26 |
| TASK-25 | IMPLEMENT | Remove brikette booking modal infrastructure (lazy-modals, payloadMap, global-modals, delete files) | 85% | M | Complete (2026-02-18) | TASK-24 | TASK-26,TASK-28 |
| TASK-26 | IMPLEMENT | Migrate 9x openModal("booking") call sites to router.push/Link | 85% | M | Complete (2026-02-18) | TASK-22,TASK-24 | TASK-28 |
| TASK-27 | IMPLEMENT | Migrate 2x openModal("booking2") in RoomCard to direct Octorate link (Decision B + E queryState) | 82% | M | Complete (2026-02-18) | TASK-22,TASK-23,TASK-24 | TASK-28 |
| TASK-28 | IMPLEMENT | Delete ga4-09/ga4-10 extinct tests + update 7 affected modal-era tests | 85% | M | Complete (2026-02-18) | TASK-25,TASK-26,TASK-27 | TASK-29 |
| TASK-29 | CHECKPOINT | Horizon checkpoint: reassess post-modal-removal before GA4/content tracks begin | 95% | S | Complete (2026-02-18) | TASK-28 | TASK-20,TASK-21,TASK-30,TASK-31,TASK-37,TASK-40,TASK-41,TASK-42 |
| TASK-30 | IMPLEMENT | Create trackThenNavigate(eventName, params, navigate, timeoutMs) helper + unit tests | 85% | S | Complete (2026-02-18) | TASK-29 | TASK-32,TASK-35 |
| TASK-31 | IMPLEMENT | Add fireViewPromotion, fireSelectPromotion (new) + update fireSelectItem with full item fields | 87% | S | Complete (2026-02-18) | TASK-29,TASK-37 | TASK-33,TASK-34,TASK-36 |
| TASK-32 | IMPLEMENT | Update RoomsSection.onRoomSelect: full select_item fields + begin_checkout via trackThenNavigate (no RoomCard duplicate) | 82% | M | Complete (2026-02-18) | TASK-29,TASK-30,TASK-31,TASK-15 | — |
| TASK-33 | IMPLEMENT | Add search_availability to /book date picker (submit + initial valid URL params) | 82% | S | Complete (2026-02-18) | TASK-29,TASK-31,TASK-15 | — |
| TASK-34 | IMPLEMENT | Add view_promotion + select_promotion to deals page | 82% | S | Complete (2026-02-18) | TASK-29,TASK-31,TASK-15 | — |
| TASK-35 | IMPLEMENT | Add begin_checkout to StickyBookNow click (via trackThenNavigate) | 82% | S | Pending | TASK-29,TASK-30,TASK-15 | — |
| TASK-36 | IMPLEMENT | Wire cta_click to OffersModal + content-page CTAs (header/hero/widget already wired) | 85% | S | Pending | TASK-29,TASK-31,TASK-15 | — |
| TASK-37 | IMPLEMENT | Update GA4_ENUMS + delete superseded helpers + clean prefetchInteractive dead imports | 88% | S | Complete (2026-02-18) | TASK-29 | TASK-31 |
| TASK-38 | IMPLEMENT | Playwright smoke test: navigate /book with dates, intercept g/collect, assert select_item + begin_checkout + Octorate URL | 82% | M | Pending | TASK-29,TASK-32,TASK-15 | — |
| TASK-39 | IMPLEMENT | Add test coverage for reportWebVitals.ts (absorbed from brik-ga4-baseline-lock TASK-04) | 80% | S | Complete (2026-02-18) | — | — |
| TASK-40 | IMPLEMENT | Update verification protocol (DebugView via GA Analytics Debugger, SPA page_view step, custom dimensions) | 85% | S | Complete (2026-02-18) | TASK-29 | — |
| TASK-41 | IMPLEMENT | Verify and implement page_view on SPA route changes (Home → /book internal navigation) | 80% | S | Complete (2026-02-18) | TASK-29 | — |
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
| 6a | TASK-20, TASK-21, TASK-30, TASK-37, TASK-40, TASK-41, TASK-42 | TASK-29 | Parallel: TASK-37 (enum cleanup) must complete before TASK-31 starts |
| 6b | TASK-31 | TASK-37 | Helpers using cleaned enums; TASK-31 now depends on TASK-37 (replan delta) |
| 7 | TASK-13, TASK-14, TASK-32, TASK-33, TASK-34, TASK-35, TASK-36 | Wave 6b per task + TASK-15 | Parallel: all implementation tracks; TASK-13 needs TASK-20, TASK-14 needs TASK-21 |
| 8 | TASK-38 | TASK-32, TASK-15 + staging deploy | Playwright smoke test (staging only; requires staging deploy after Wave 7) |

**Max parallelism:** 4 (Wave 1) / 8 (Wave 6–7)
**Critical path:** TASK-22 → TASK-26 → TASK-28 → TASK-29 → TASK-30 → TASK-32 → TASK-38
**Total pending tasks:** 24 (Waves 1–8, excluding CHECKPOINT TASK-29)

**Merge unit PR strategy for TASK-24–28:**
- **Option A (recommended):** single PR containing all of TASK-24/25/26/27/28. Cleanest; TypeScript is always green at merge.
- **Option B:** stacked PRs, but "CI-green" means green *after stacking onto all prior PRs in the chain*, not individually. PR for TASK-25 stacks on TASK-24's branch; etc. Do not merge any PR in the chain until the full stack is ready.
- Wave 1/2/3/4 describes *development order*, not *merge order*. All TASK-24–28 changes are committed but held until the full stack is CI-green.

**Wave 6 ordering update (TASK-29 checkpoint):** TASK-37 now BLOCKS TASK-31 (TASK-31 depends on cleaned enums/helpers). TASK-37 must complete before TASK-31 starts. Within Wave 6:
- **Start immediately:** TASK-37 (enums + cleanup), TASK-30 (trackThenNavigate), TASK-20, TASK-21, TASK-40, TASK-41, TASK-42 (Admin dims — start first to allow 24–48h propagation delay)
- **After TASK-37 complete:** TASK-31 (helpers using clean enums)
- **After TASK-31 complete:** TASK-33, TASK-34, TASK-36 (consume new helpers)

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
- **Status:** Complete (2026-02-18)
- **Build evidence:** Static code analysis (no staging deploy needed). `generateStaticParams()` produces `/{lang}/book/index.html` only. Cloudflare `_redirects` 200-rewrites are edge-only (HTTP requests), not in-SPA client router. `router.push("/it/prenota")` would 404 on static export. Outcome B confirmed: use `/{lang}/book` for all in-app navigation. `fact-find.md` updated with full resolution notes.
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
- **Status:** Complete (2026-02-18)
- **Build evidence:** `buildOctorateUrl.ts` created with discriminated union return, `codice=45111`, NR/Flex routing, deal+UTM params, 5 validation guards. `buildOctorateUrl.test.ts`: 15/15 tests pass. Scout finding: param name is `room` (not `codfta`); NR/Flex rate codes come from `roomsData[id].rateCodes.direct.nr/flex`; endpoint is `confirm.xhtml`.
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
- **Status:** Complete (2026-02-18)
- **Build evidence (scope expanded):** Original scope insufficient — packages/ui TypeScript would fail unless all internal consumers were fixed. Controlled scope expansion documented here: context.ts (ModalType), index.ts, types.ts (5 booking interfaces removed), lazy-modals.ts, GlobalModals.tsx (all booking state/memo/callback/JSX removed), RoomsSection.tsx (openModal removed), ApartmentDetailsSection.tsx + ApartmentHeroSection.tsx + DealsPage.tsx + MobileNav.tsx (useModal → onBookingCtaClick callback prop), DesktopHeader.tsx (useModal removed, book() removed, onBookClick simplified), LandingHeroSection.tsx (handleReserve → no-op), ModalBasics.test.tsx (3 BookingModal2 tests removed), BookingModal.tsx + BookingModal2.tsx deleted. TypeScript check: 0 errors after fixes. TC-01 (packages/ui TypeScript clean): Pass. TASK-25 (brikette lazy-modals/payloadMap/global-modals) and TASK-26 (brikette-specific call sites) remain separate.
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
- **Status:** Complete (2026-02-18)
- **Affects:**
  - `apps/brikette/src/context/modal/global-modals/BookingModal.tsx` (delete)
  - `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx` (delete)
  - `apps/brikette/src/context/modal/lazy-modals.ts`
  - `apps/brikette/src/context/modal/payloadMap.ts` (deferred: payload types left for TASK-26 cleanup)
  - `apps/brikette/src/context/modal/global-modals.tsx`
- **Depends on:** TASK-24
- **Blocks:** TASK-26, TASK-28
- **Confidence:** 85%
  - Implementation: 88% — surgical file deletions + targeted removals from 3 files.
  - Approach: 88% — changes are clearly specified in fact-find blast radius section.
  - Impact: 85% — TypeScript ensures no dangling references compile after TASK-24.
- **Acceptance:**
  - `lazy-modals.ts`: `BookingModal` and `BookingModal2` lazy imports removed + type imports `UIBookingModalProps`, `UIBookingModal2Props` removed ✓
  - `payloadMap.ts`: payload types deferred to TASK-26 (no TypeScript errors; call sites still compile via ModalType union)
  - `global-modals.tsx`: `BookingGlobalModal` and `Booking2GlobalModal` imports and switcher branches removed ✓
  - Files `BookingModal.tsx` and `Booking2Modal.tsx` deleted ✓
  - TypeScript compilation clean (combined with TASK-24) ✓
- **Validation contract:**
  - TC-01: TypeScript compilation passes after TASK-24 + TASK-25 combined ✓ (0 errors, brikette typecheck clean)
  - TC-02: `grep -r "openModal.*booking" apps/brikette/src/context/` returns 0 results ✓
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** Revert commit
- **Documentation impact:** None
- **Build evidence (2026-02-18):**
  - Deleted: `global-modals/BookingModal.tsx`, `global-modals/Booking2Modal.tsx`
  - Stripped: `lazy-modals.ts` — removed UIBookingModalProps/UIBookingModal2Props type imports and BookingModal/BookingModal2 lazy exports
  - Stripped: `global-modals.tsx` — removed Booking2GlobalModal/BookingGlobalModal imports and booking/booking2 JSX switcher branches
  - Deferred: `payloadMap.ts` payload types (BookingPayload/Booking2Payload) — safe to defer as ModalType union still includes booking/booking2; no TypeScript error; will be cleaned in TASK-26
  - brikette TypeScript: 0 errors after changes
  - Committed as part of Wave 1 commit: `066b4d0e4b` (24 files changed)

---

### TASK-26: Migrate 9x openModal("booking") call sites to router.push/Link
- **Type:** IMPLEMENT
- **Deliverable:** Updated files across 8 components/pages (per blast radius table in fact-find)
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Build-Evidence:**
  - Red: TASK-25 deferred `payloadMap.ts` cleanup (BookingPayload/Booking2Payload types); confirmed `openModal("booking")` pattern used in all 9 call sites.
  - Green: All 9 `openModal("booking")` call sites migrated — HomeContent, BookingWidget, ContentStickyCta, ExperiencesPageContent, NotFoundView, DealsPageContent (×2), OffersModal. URL follows Decision A (`/${lang}/book`). `useModal` hook removed from components that exclusively used booking.
  - TC-01: `grep -r 'openModal.*"booking"' apps/brikette/src/ --include="*.tsx"` → 0 production results (only comments in hooks.ts). ✓
  - TC-02: modal-integration-tc09 test — BookingWidget submit → navigates to /book. PASS. ✓
  - TC-03: OffersModal "Reserve Now" → calls closeModal + router.push. PASS. ✓
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
- **Status:** Complete (2026-02-18)
- **Build evidence:**
  - `RoomCard.tsx`: removed `useModal`; added `useRouter`, `buildOctorateUrl`, `BOOKING_CODE`; added `queryState`/`datePickerRef` props; precomputes `nrOctorateUrl`/`flexOctorateUrl` useMemos; "valid" → `window.location.href = octorateUrl`; "absent"/url-fail → `router.push(/${lang}/book)`; actions `disabled` guards invalid + url-build-fail
  - `RoomsSection.tsx` (scope expansion): `queryState` prop destructured; `onRoomSelect` navigates via `buildOctorateUrl`+`window.location.href` when "valid"; fallback to `/${lang}/book` for absent
  - `BookPageContent.tsx`: passes `queryState="valid"` to `RoomsSection`
  - TypeScript: 0 errors; no production `openModal("booking2")` calls remain

---

### TASK-28: Delete extinct tests + update 7 modal-era tests
- **Type:** IMPLEMENT
- **Deliverable:** Deleted test files (×2) + updated test assertions in 7 test files
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Affects:**
  - `apps/brikette/src/test/components/ga4-09-booking-modal-begin-checkout.test.tsx` (deleted)
  - `apps/brikette/src/test/components/ga4-10-booking2-modal-begin-checkout.test.tsx` (deleted)
  - `apps/brikette/src/test/components/modal-integration-tc09.test.tsx` (updated: router.push not openModal)
  - `apps/brikette/src/test/components/content-sticky-cta.test.tsx` (updated: navigation not openModal)
  - `apps/brikette/src/test/components/deals-page.test.tsx` (updated: router.push to /book)
  - `apps/brikette/src/test/components/experiences-page.test.tsx` (updated: router.push not openModal; +next/link mock)
  - `apps/brikette/src/test/components/ga4-11-select-item-room-ctas.test.tsx` (updated: removed ModalContext Provider + openModal assertions)
  - `apps/brikette/src/test/context/modal-provider-effects.test.tsx` (file not found — no-op, confirmed non-existent)
  - `apps/brikette/src/test/components/ga4-cta-click-header-hero-widget.test.tsx` (updated: added useRouter mock)
  - `apps/brikette/src/test/components/ga4-modal-lifecycle.test.tsx` (deleted — extinct test; booking modals removed; controlled scope expansion)
- **Depends on:** TASK-25, TASK-26, TASK-27
- **Blocks:** TASK-29
- **Build evidence (2026-02-18):**
  - Deleted ga4-09, ga4-10, ga4-modal-lifecycle test files (3 extinct tests removed; ga4-modal-lifecycle added as controlled scope expansion)
  - Updated 6 live test files (modal-provider-effects.test.tsx confirmed non-existent — no-op)
  - 6/6 test suites pass; 18/18 tests pass; 0 TypeScript errors
  - All `openModal("booking")` / `openModal("booking2")` assertions removed
  - BookingWidget now asserts router.push("/en/book?checkin=...&checkout=...&pax=N")
  - ContentStickyCta now asserts router.push("/en/book")
  - GA4-11 select_item assertion retained; ModalContext.Provider wrapper removed
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
- **Status:** Complete (2026-02-18)
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
- **Build evidence (2026-02-18):** `/lp-replan` executed. All 3 horizon assumptions validated:
  1. **TypeScript clean:** ✅ 0 errors in brikette + packages/ui after full Track E work.
  2. **Duplicate GA4 events:** 3 findings with plan deltas applied:
     - `fireSelectItem` already wired in `apps/brikette/src/components/rooms/RoomsSection.tsx` (line 38). TASK-32 updated: do not add a second `select_item` fire from RoomCard; instead update RoomsSection's `onRoomSelect` to fire with full GA4 item fields + wrap navigation in `trackThenNavigate` for `begin_checkout`.
     - `fireCTAClick` already wired in Header, HomeContent, BookingWidget (tests confirm). TASK-36 scope reduced: only OffersModal + content-page CTAs remain.
     - `ga4-events.ts` contains `fireBeginCheckoutGeneric`/`fireBeginCheckoutGenericAndNavigate` with `source: "booking_modal" | "booking2_modal"` params (superseded). TASK-37 scope expanded to remove these + clean `prefetchInteractive.ts` dead BookingModal imports.
  3. **RoomCard rendering:** ✅ `queryState` prop in place (line 39), TypeScript clean, no issues.

---

### TASK-30: Create trackThenNavigate helper + unit tests
- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/utils/trackThenNavigate.ts` (new) + unit tests
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:**
  - `apps/brikette/src/utils/trackThenNavigate.ts` (new)
  - `apps/brikette/src/test/utils/trackThenNavigate.test.ts` (new)
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
- **Build completion evidence (2026-02-18):**
  - `apps/brikette/src/utils/trackThenNavigate.ts` already existed with full implementation: `getGtag()` null guard, `navigated` flag, 200ms timeout, `transport_type: "beacon"`, `event_callback: go`. Caller contract documented in JSDoc.
  - `apps/brikette/src/test/utils/trackThenNavigate.test.ts` already existed with TC-01 through TC-05 using `jest.useFakeTimers()`.
  - Verification: `pnpm -w run test:governed -- jest -- --config apps/brikette/jest.config.cjs --testPathPattern='trackThenNavigate'` → 5/5 tests pass.
  - TC-06 (integration-level caller contract) deferred to TASK-32 per plan spec.

---

### TASK-31: Create new GA4 event helpers + unit tests
- **Type:** IMPLEMENT
- **Deliverable:** New/updated helper functions in `apps/brikette/src/utils/ga4-events.ts`: `fireViewPromotion` (new), `fireSelectPromotion` (new), `fireSelectItem` (updated for full GA4 item fields)
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:**
  - `apps/brikette/src/utils/ga4-events.ts`
  - `apps/brikette/src/test/utils/ga4-events-contract.test.ts` (new TASK-31 describe block)
- **Depends on:** TASK-29, TASK-37
- **Blocks:** TASK-33, TASK-34, TASK-36
- **Confidence:** 87%
  - Implementation: 88% — follows established `getGtag()` + `window.gtag("event", ...)` pattern exactly.
  - Approach: 90% — event shapes fully specified in fact-find Event Contract table.
  - Impact: 85% — additive helpers; no call sites wired yet (done in TASK-32-36).
- **Scope note (TASK-29 checkpoint):** `fireSearchAvailability` and `fireCTAClick` (`fireCtaClick`) already exist in `ga4-events.ts`. Scope reduces to: (1) ADD `fireViewPromotion` + `fireSelectPromotion` (genuinely new); (2) UPDATE `fireSelectItem` to include full GA4 item fields (`item_name`, `item_category`, `affiliation`, `currency`) if not already present; (3) verify `fireSearchAvailability` signature matches fact-find contract (no raw date strings, use `nights` + `lead_time_days`). TASK-37 runs first to remove superseded helpers and clean enums; TASK-31 depends on TASK-37.
- **Acceptance:**
  - `fireViewPromotion({ items: [...promotions] })` — deals promotions model (NEW)
  - `fireSelectPromotion({ items: [...promotions] })` — single deal click (NEW)
  - `fireSelectItem` updated: all items[] include `item_id`, `item_name`, `item_category: "hostel"`, `affiliation: "Hostel Brikette"`, `currency: "EUR"`, `item_variant` ("nr" or "flex")
  - `fireSearchAvailability` verified: `nights`, `lead_time_days`, `pax` only (no raw date strings)
  - `begin_checkout` in deal context includes `coupon: deal.id` (deal code propagated from URL param)
  - All helpers use canonical enums from TASK-37; unit tests assert gtag called with correct shape
- **Validation contract:**
  - TC-01: `fireViewPromotion` → gtag called with `view_promotion` + promotions array
  - TC-02: `fireSelectPromotion` → gtag called with `select_promotion` + single promotion
  - TC-03: `fireSelectItem` → gtag called with correct item including `item_name`, `item_category`, `affiliation`, `currency`
  - TC-04: `fireSearchAvailability` → no raw date strings in params (only `nights`, `lead_time_days`)
  - TC-05: `begin_checkout` with `deal` context includes `coupon: deal.id`
- **Build completion evidence (2026-02-18):**
  - `GA4Promotion` and `GA4Item` interfaces added to `ga4-events.ts`.
  - `buildRoomItem` updated: return type `GA4Item`, adds `item_category: "hostel"`, `affiliation: "Hostel Brikette"`, `currency: "EUR"`. `itemName?` param added; falls back to `roomSku`.
  - `fireViewPromotion(promotions)` and `fireSelectPromotion(promotion)` added (new).
  - `fireSelectItem` and `fireViewItemList` updated to pass `itemName` through `buildRoomItem`.
  - `fireSearchAvailability` verified: already correct (no raw dates; uses `nights` + `lead_time_days`).
  - `coupon?: string` param added to both `fireBeginCheckoutRoomSelected` and `fireBeginCheckoutRoomSelectedAndNavigate`; omitted from payload when absent.
  - Tests: `apps/brikette/src/test/utils/ga4-events-contract.test.ts` — added "ga4-events TASK-31 contracts" describe block: TC-01..TC-05 + 2 buildRoomItem assertions = 8 new tests. Total 13/13 pass.

---

### TASK-32: Wire select_item + begin_checkout on RoomCard direct Octorate navigation
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/components/rooms/RoomsSection.tsx` — onRoomSelect fires `select_item` with full GA4 item fields + wraps Octorate navigation in `trackThenNavigate` for `begin_checkout`
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/components/rooms/RoomsSection.tsx`
  - `[readonly] apps/brikette/src/utils/trackThenNavigate.ts`
  - `[readonly] apps/brikette/src/utils/ga4-events.ts`
- **Depends on:** TASK-29, TASK-30, TASK-31, TASK-15
- **Blocks:** —
- **Confidence:** 82%
  - Implementation: 82% — RoomsSection.tsx already fires `fireSelectItem` in `onRoomSelect`; task updates it with full item fields and wraps navigation in trackThenNavigate.
  - Approach: 85% — callback prop pattern per Decision C; GA4 in app layer.
  - Impact: 88% — this is the core e-commerce event; without it the funnel has no select_item or begin_checkout.
- **Architecture note (TASK-29 checkpoint):** `fireSelectItem` is already wired in `apps/brikette/src/components/rooms/RoomsSection.tsx` line 38 (fires on every `onRoomSelect` when `itemListId` is provided). **Do NOT add a second `select_item` fire in `RoomCard.tsx`** — that would duplicate the event on every room click. Instead, TASK-32 updates `RoomsSection.tsx`'s `onRoomSelect` handler to:
  1. Update the existing `fireSelectItem` call to include full GA4 item fields (look up `room` from `roomsData` by sku; add `item_name`, `item_category: "hostel"`, `affiliation: "Hostel Brikette"`, `currency: "EUR"`, `item_variant`)
  2. Replace direct `window.location.href` Octorate navigation with `trackThenNavigate("begin_checkout", {...}, () => window.location.assign(octorateUrl))`
  3. Preserve existing `/book` fallback path for `queryState !== "valid"`
- **Acceptance:**
  - **Event ordering:** `fireSelectItem({...})` fire-and-forget first; then `trackThenNavigate` for `begin_checkout`. No chaining inside event_callback.
  - `onRoomSelect` handler in `RoomsSection.tsx` applies shouldInterceptClick guard and `isNavigating` ref before navigation
  - `items[]` includes: `item_id` (room.sku), `item_name` (room display title from roomsData), `item_category: "hostel"`, `affiliation: "Hostel Brikette"`, `currency: "EUR"`, `item_variant` ("nr" or "flex")
  - Navigation occurs only via `window.location.assign(octorateUrl)` inside the `navigate` callback
  - Both events verified in staging via Network tab (items[] and item_id present in collect request)
- **Validation contract:**
  - TC-01: `onRoomSelect` (valid queryState, no modifiers) → `select_item` gtag called fire-and-forget with correct item incl. item_name, item_category, affiliation, currency
  - TC-02: `onRoomSelect` → `trackThenNavigate` called with `begin_checkout`; navigation occurs after callback or timeout
  - TC-03: navigation to Octorate URL occurs via `window.location.assign` inside navigate callback
  - TC-04: `trackThenNavigate` called with `transport_type: "beacon"` (asserted via mock)
  - TC-05: second invocation while `isNavigating=true` → no duplicate GA4 events fired
- **Rollout / rollback:** Revert commit
- **Build completion evidence (2026-02-18):**
  - `apps/brikette/src/components/rooms/RoomsSection.tsx`: imported `trackThenNavigate` and `buildRoomItem`; added closure-level `isNavigating` guard; fireSelectItem unchanged (buildRoomItem already provides full item fields via TASK-31); replaced `window.location.href = result.url` with `trackThenNavigate("begin_checkout", { source: "room_card", checkin, checkout, pax, item_list_id, items: [buildRoomItem(...)] }, () => window.location.assign(result.url))`.
  - Event ordering: `fireSelectItem` fire-and-forget → `isNavigating = true` → `trackThenNavigate`.
  - `/book` fallback path unchanged (no GA4 event on fallback navigation).
  - Tests added to `ga4-11-select-item-room-ctas.test.tsx`: TASK-32 describe block — TC-01 (full GA4 item shape), TC-02/TC-04 (beacon + event_callback), TC-03 (assign not called immediately, only in callback), TC-05 (double-click guard). 5/5 pass.

---

### TASK-33: Add search_availability to /book date picker
- **Type:** IMPLEMENT
- **Deliverable:** Updated `BookPageContent.tsx` firing `search_availability` on date picker submit and on initial valid URL param load
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
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
  - TC-01: Submit with valid dates → gtag called with `search_availability` + correct nights/lead_time_days/pax ✓
  - TC-02: Mount with no URL params → gtag NOT called on mount ✓
  - TC-03: Mount with valid URL params → gtag called once ✓
- **Build evidence (2026-02-18):**
  - `BookPageContent.tsx`: added `useRef`, `isValidSearch` helper, `lastSearchKeyRef` (dedupe), `mountedSearchRef` (URL-param-present gate); mount effect fires `search_availability` only when `params.has("checkin") && params.has("checkout") && isValidSearch(...)`; `applyQuery` fires on submit with key-dedupe.
  - Test: `ga4-33-book-page-search-availability.test.tsx` — 3/3 pass (TC-01 submit, TC-02 no-params, TC-03 mount).

---

### TASK-34: Add view_promotion + select_promotion to deals page
- **Type:** IMPLEMENT
- **Deliverable:** Updated `DealsPageContent.tsx` firing `view_promotion` + `select_promotion`
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:**
  - `apps/brikette/src/app/[lang]/deals/DealsPageContent.tsx`
  - `apps/brikette/src/test/components/ga4-34-deals-page-promotions.test.tsx` (new)
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
- **Build evidence (2026-02-18):**
  - `DealsPageContent.tsx`: mount `useEffect` fires `fireViewPromotion` for all DEALS; `openBooking` callback fires `fireSelectPromotion` + `router.push(…?deal=ID)` when `kind === "deal"`.
  - DealCard mock uses `data-cy` (project testIdAttribute); fake timer set to 2025-10-01 (active period for sep20_oct31_15off).
  - Test: `ga4-34-deals-page-promotions.test.tsx` — 2/2 pass (TC-01 view_promotion, TC-02 select_promotion + navigation).

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

### TASK-36: Wire cta_click to OffersModal + content-page CTAs
- **Type:** IMPLEMENT
- **Deliverable:** Updated `OffersModal.tsx` firing `fireCtaClick` before router.push; content-page CTAs wired via TASK-14
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/context/modal/global-modals/OffersModal.tsx`
- **Depends on:** TASK-29, TASK-31, TASK-15
- **Blocks:** —
- **Confidence:** 85%
  - Implementation: 87% — one component; existing `fireCtaClick` pattern in place.
  - Approach: 88% — follows same pattern as already-wired CTAs.
  - Impact: 82% — OffersModal is a conversion surface; closing the gap closes the funnel.
- **Scope note (TASK-29 checkpoint):** Header, HomeContent (hero), and BookingWidget already fire `fireCtaClick` correctly (confirmed by ga4-cta-click-header-hero-widget test passing). `DesktopHeader.tsx`/`MobileNav.tsx` (packages/ui) already use callback props that wire to `fireCtaClick` in Header.tsx (brikette). **TASK-36 scope reduces to OffersModal only.** Content-page CTA click is wired as part of TASK-14 (which adds `ContentStickyCta` + GA4 event together).
- **Acceptance:**
  - OffersModal "Reserve Now" fires `fireCtaClick({ ctaId: "offers_modal_reserve", ctaLocation: "offers_modal" })` before `router.push("/{lang}/book")`
  - No modal intercept in cta_click; event fires on navigation intent only
  - `ContentStickyCta` cta_click handled in TASK-14
- **Validation contract:**
  - TC-01: OffersModal "Reserve Now" click → gtag called with `cta_click` + `cta_id: "offers_modal_reserve"` + `cta_location: "offers_modal"`
  - TC-02: Navigation to /book still occurs after event fires
- **Rollout / rollback:** Revert commit

---

### TASK-37: Update GA4_ENUMS + clean superseded helpers + prefetch dead imports
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/utils/ga4-events.ts` (enum + helper cleanup) + cleaned `apps/brikette/src/utils/prefetchInteractive.ts`
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/utils/ga4-events.ts`
  - `apps/brikette/src/utils/prefetchInteractive.ts`
- **Depends on:** TASK-29
- **Blocks:** TASK-31
- **Confidence:** 88%
  - Implementation: 90% — straightforward enum update + helper deletion; TypeScript catches misuse.
  - Approach: 90% — remove deleted modal types; add new enums from fact-find; delete superseded helpers.
  - Impact: 88% — maintains enum authority; prevents enum drift in TASK-31/32/33/34/35/36; fixes dead webpack prefetch imports.
- **Scope note (TASK-29 checkpoint):** Scope expanded beyond enum values. Additional items found during checkpoint:
  1. `prefetchInteractive.ts` lines 87-88 contain `await import("@acme/ui/organisms/modals/BookingModal")` / `BookingModal2` — both modules are deleted; these are dead webpack prefetch imports that will cause build warnings or chunk-not-found errors in production. Must be removed.
  2. `fireBeginCheckoutGeneric` + `fireBeginCheckoutGenericAndNavigate` in `ga4-events.ts` have `source: "booking_modal" | "booking2_modal"` types — these are superseded helpers with no call sites; remove them.
  3. `ContentStickyCta.tsx` has a stale comment "opens BookingModal" (line 5) and stale i18n key `modals:booking.buttonAvailability` — low priority cleanup, absorb into TASK-14 or TASK-26 followup.
- **Acceptance:**
  - `modal_type` enum: `booking` and `booking2` removed; `offers`, `location`, `contact`, `facilities`, `language` retained
  - `item_list_id` enum: `room_detail` verified present (confirm, add if not)
  - `cta_id` enum: `offers_modal_reserve` verified present (confirm, add if not)
  - `cta_location` enum: `offers_modal` verified present (confirm, add if not)
  - `fireBeginCheckoutGeneric` + `fireBeginCheckoutGenericAndNavigate` deleted (no call sites outside ga4-events.ts)
  - `prefetchInteractive.ts`: BookingModal + BookingModal2 `webpackPrefetch` dynamic imports removed; file otherwise unchanged
  - All references to removed enum values produce TypeScript errors (confirming their absence)
  - Note: the Analytics Enums section in this plan shows the target state; TASK-37 job is to make `ga4-events.ts` match that list
- **Validation contract:**
  - TC-01: TypeScript compilation clean with new enums and deleted helpers
  - TC-02: Existing tests using retained enum values still pass
  - TC-03: `grep "BookingModal" apps/brikette/src/utils/prefetchInteractive.ts` returns 0 results

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
- **Status:** Complete (2026-02-18)
- **Build evidence:** 4 new tests added to existing `apps/brikette/src/test/performance/reportWebVitals.test.ts` (7 total, all pass). Scout finding: transport is `gtag("event", "web_vitals", {...})` not `navigator.sendBeacon` — plan description was incorrect; tests written for actual gtag transport. Also discovered try/catch error swallowing, enabling the "swallows errors" test. Run with `--config apps/brikette/jest.config.cjs` (brikette-specific `@/` alias required; governed runner needs explicit config flag for brikette tests).
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
- **Build completion evidence (2026-02-18):**
  - `docs/plans/brikette-cta-sales-funnel-ga4/verification.md` updated (TASK-16 output; no separate verification-protocol.md created).
  - Added: Google Analytics Debugger extension instructions (not `?gtm_debug`); `debug_mode: true` as staging-only code patch alternative.
  - Added: SPA `page_view` verification step (Pattern B — single fire on hard load, one per SPA nav; pass/fail criteria).
  - Added: `view_promotion` and `select_promotion` event checklists with payload shape.
  - Updated: `select_item` and `begin_checkout` checklists reflect full GA4Item fields (`item_category`, `affiliation`, `currency`) and `trackThenNavigate` beacon pattern.
  - Added: custom dimensions verification step (after TASK-42).
  - Added: Network tab filter `**/g/collect` (catches both GET and POST beacon).
  - Removed: obsolete `modal_open`/`modal_close` section (BookingModal deleted in TASK-37).
  - VC pass: all 6 acceptance criteria satisfied.

---

### TASK-41: Verify and implement page_view on SPA route changes
- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/app/layout.tsx` or root provider updated to fire `page_view` on client-side navigation (if not already present); unit test
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:**
  - `apps/brikette/src/app/layout.tsx` (Pattern B chosen — no changes needed; already correct)
  - `apps/brikette/src/components/analytics/PageViewTracker.tsx` (new — already existed)
  - `apps/brikette/src/test/components/page-view-tracker.test.tsx` (new — already existed, fixed)
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
- **Build completion evidence (2026-02-18):**
  - Scout confirmed: inline gtag snippet in `layout.tsx` does NOT use `send_page_view: false` → Pattern B chosen (skip initial render, fire on subsequent pathname changes only).
  - `apps/brikette/src/components/analytics/PageViewTracker.tsx` already existed with full Pattern B implementation: `isFirstRender` ref skips initial render; fires `gtag("config", GA_MEASUREMENT_ID, { page_path, page_location })` on `usePathname()` changes.
  - `apps/brikette/src/app/layout.tsx` already imports and renders `<PageViewTracker />` conditionally at line 126 (body, after `{children}`).
  - `apps/brikette/src/test/components/page-view-tracker.test.tsx` already existed. Fixed: removed `jest.resetModules()` from `beforeEach` + replaced all dynamic `require()` calls with static import to eliminate multiple-React-instances "Invalid hook call" error.
  - Verification: `pnpm -w run test:governed -- jest -- --config apps/brikette/jest.config.cjs --testPathPattern='page-view-tracker'` → 4/4 tests pass (TC-02: no fire on initial render; TC-01: fires on SPA nav; extended: fires on each nav; noop guard).
  - Staging DebugView verification deferred to TASK-40 protocol (requires staging deploy).

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
