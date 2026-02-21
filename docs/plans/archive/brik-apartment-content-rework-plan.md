---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-13
Feature-Slug: brik-apartment-content-rework
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-system
Overall-confidence: 91%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: TBD
---

# Apartment Content Rework Plan

## Summary

The apartment pages were built with correct technical plumbing (routes, FitCheck, Octorate, GA4, nav, structured data) but shipped with placeholder copy, an inverted page structure, factual inaccuracies, and broken WhatsApp links. This plan brings all 4 apartment pages into alignment with the revenue architecture brief, fixing 9 catalogued issues while preserving all existing functionality.

## Goals

- Fix hub page structure: hero above fold, then intent cards, FitCheck, CTAs
- Replace all placeholder copy with brief-aligned, positioning-accurate content
- Fix factual inaccuracies (kitchen size, bathroom count, details list)
- Fix broken WhatsApp links on sub-pages; add WhatsApp CTA to hub
- Add price anchoring signal
- Update SEO metadata to target brief's keyword clusters
- Update booking page GA4 placeholder price

## Non-goals

- Adding photography/video assets (pending from Pete)
- Octorate rate plan ID setup (external dependency)
- Translation to non-English locales (follow-on)
- Redesigning page layouts or adding new components
- Social proof / reviews module (separate scope)
- Cross-sell module from hostel booking flow

## Constraints & Assumptions

- Constraints:
  - Changes are content/copy/structure only — no new components
  - Must preserve existing test suite (120 suites, 755 tests, 0 failures)
  - English only; other locales fall back to English
  - Design system token compliance (no hardcoded colors)
- Assumptions:
  - WhatsApp number `393287073695` is correct for all apartment CTAs
  - "From €265/night" is acceptable as the starting price signal (shoulder season per brief)
  - Apartment spec from brief section 2 is accurate (100sqm, full kitchen, 2 bathrooms, sleeps 4)
  - "Sea-view balcony" removed from details list (default-safe; Pete can add back if property has one)

## Fact-Find Reference

- Related brief: `docs/plans/brik-apartment-content-rework-fact-find.md`
- Key findings:
  - I1: Hub page hero buried below fold (below CTA)
  - I2: All copy is placeholder-grade — meta titles, body text, highlights generic
  - I3: Details list factually wrong (kitchenette/1 bathroom/sea-view balcony)
  - I4: No WhatsApp CTA on hub page
  - I5: WhatsApp links empty on street-level and private-stay pages
  - I6: No price signal anywhere
  - I7: Booking page GA4 fires with placeholder €150 price
  - I8: Amenities list incomplete
  - I9: All OG images use same facade.avif (non-goal — depends on photography)

## Existing System Notes

- Key modules/files:
  - `apps/brikette/src/app/[lang]/apartment/ApartmentPageContent.tsx` — hub client component (render order)
  - `apps/brikette/src/locales/en/apartmentPage.json` — all apartment copy
  - `apps/brikette/src/app/[lang]/apartment/street-level-arrival/StreetLevelArrivalContent.tsx` — broken WhatsApp href
  - `apps/brikette/src/app/[lang]/apartment/private-stay/PrivateStayContent.tsx` — broken WhatsApp href
  - `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx` — GA4 placeholder price
  - `apps/brikette/src/data/roomsData.ts` — apartment basePrice placeholder
- Patterns to follow:
  - Copy changes in `apartmentPage.json` propagate via `useTranslation("apartmentPage")`
  - Hero, Highlights, Details, Amenities are `packages/ui` organisms that read from translations
  - WhatsApp URL pattern: `https://wa.me/393287073695` (from booking page)

## Proposed Approach

Three independent tasks, parallelizable after a brief validation:

1. **Content rewrite** (apartmentPage.json) — replace all placeholder copy, fix factual errors, add price signal, update SEO metadata. This is the bulk of the work and a single-file change.
2. **Structure + WhatsApp fixes** (3 TSX files) — reorder hub page JSX, fix empty WhatsApp hrefs on sub-pages, add WhatsApp CTA to hub.
3. **Booking data accuracy** (2 files) — update GA4 placeholder price and roomsData basePrice.

All three tasks can run in parallel because they touch different files. The content rewrite (TASK-01) and structure fixes (TASK-02) are the highest-priority pair — they address the CRITICAL issues. TASK-03 addresses LOW-priority data accuracy.

A final validation task (TASK-04) runs the full test suite and updates the GA4 test that asserts the old placeholder price.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---|---|---|---|
| TASK-01 | IMPLEMENT | Rewrite all apartment copy in apartmentPage.json | 92% | M | Complete (2026-02-13) | - | TASK-04 |
| TASK-02 | IMPLEMENT | Reorder hub page structure + fix WhatsApp links | 95% | S | Complete (2026-02-13) | - | TASK-04 |
| TASK-03 | IMPLEMENT | Update booking page GA4 price + roomsData basePrice | 90% | S | Complete (2026-02-13) | - | TASK-04 |
| TASK-04 | IMPLEMENT | Update tests and run full validation | 90% | S | Complete (2026-02-13) | TASK-01, TASK-02, TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01, TASK-02, TASK-03 | - | All three touch different files — fully parallel |
| 2 | TASK-04 | TASK-01, TASK-02, TASK-03 | Validation gate — update tests, run full suite |

**Max parallelism:** 3 | **Critical path:** 2 waves | **Total tasks:** 4

## Tasks

### TASK-01: Rewrite all apartment copy in apartmentPage.json

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/locales/en/apartmentPage.json`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-do-build
- **Affects:** `apps/brikette/src/locales/en/apartmentPage.json`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 92%
  - Implementation: 95% — single JSON file edit; all keys are known and documented in fact-find
  - Approach: 90% — copy direction is unambiguous; brief provides target keywords, positioning, and Fit Check content verbatim
  - Impact: 90% — all apartment pages read from this file; changes propagate automatically. No other pages affected.
- **Acceptance:**
  - Hub page meta: title targets "apartment Positano" cluster; description includes step-free, couples, price anchor
  - Hub body text: specific (100sqm, couples, step-free arrival, full kitchen, Positano character)
  - Hero title + intro: property-specific, not generic
  - Highlights: property-specific; highlight 3 does NOT use the word "steps"
  - Details list factually accurate: "Full kitchen" (not kitchenette), "2 bathrooms" (not 1), no "Sea-view balcony" claim
  - Amenities list: includes 2 bathrooms, 100sqm, terrace access (optional, next door)
  - Price signal: "from €265/night" appears in hub body or intro text
  - Sub-page copy preserved where already good (street-level-arrival and private-stay meta/hero are already OK)
  - FitCheck content unchanged (already matches brief section 7 verbatim)
- **Validation contract:**
  - TC-01: `meta.title` contains "Positano" → string assertion
  - TC-02: `meta.description` contains "step-free" or "no stairs" → string assertion
  - TC-03: `detailsList` contains "Full kitchen" and "2 bathrooms" → array assertion
  - TC-04: `detailsList` does NOT contain "Kitchenette" or "Sea-view balcony" → negative assertion
  - TC-05: `highlights.slides[2].text` does NOT contain "steps" (case-insensitive) → string assertion
  - TC-06: `body` or `heroIntro` contains "265" (price signal) → string assertion
  - TC-07: `amenitiesList` includes "2 bathrooms" → array assertion
  - Acceptance coverage: TC-01-02 (SEO), TC-03-04 (factual accuracy), TC-05 (brand safety), TC-06 (price signal), TC-07 (completeness)
  - Validation type: unit
  - Validation location: `apps/brikette/src/test/components/apartment/ApartmentContentAccuracy.test.tsx` (new)
  - Run/verify: `pnpm --filter brikette test -- ApartmentContentAccuracy`
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Checks run: `pnpm --filter brikette test -- apartment` — 19/19 PASS (baseline confirmed)
  - Existing `apartmentPage.json` fully read — all keys identified
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Direct deploy — copy changes only
  - Rollback: Revert `apartmentPage.json`
- **Documentation impact:** None
- **Notes / references:**
  - Brief keyword targets: section 9
  - Brief Fit Check content: section 7 (no changes needed — already verbatim)
  - Brief apartment spec: section 2 (100sqm, full kitchen, 2 bathrooms, sleeps 4)
  - Pricing: brief section 2 (shoulder from €265, in-season €495-550)

### TASK-02: Reorder hub page structure + fix WhatsApp links

- **Type:** IMPLEMENT
- **Deliverable:** Updated `ApartmentPageContent.tsx`, `StreetLevelArrivalContent.tsx`, `PrivateStayContent.tsx`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-do-build
- **Affects:** `apps/brikette/src/app/[lang]/apartment/ApartmentPageContent.tsx`, `apps/brikette/src/app/[lang]/apartment/street-level-arrival/StreetLevelArrivalContent.tsx`, `apps/brikette/src/app/[lang]/apartment/private-stay/PrivateStayContent.tsx`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 95%
  - Implementation: 98% — JSX reorder is a move operation; WhatsApp fix is a string constant change
  - Approach: 95% — brief specifies exact render order (section 6A); WhatsApp URL pattern proven in booking page
  - Impact: 92% — changes contained to 3 apartment TSX files; no shared components modified
- **Acceptance:**
  - Hub page render order: `HeroSection` → h1/body → intent cards → `FitCheck` → CTAs (primary + WhatsApp) → `HighlightsSection` → `GallerySection` → `AmenitiesSection` → `DetailsSection`
  - Hub page has WhatsApp secondary CTA (matching sub-page pattern)
  - `StreetLevelArrivalContent.tsx:73` WhatsApp href = `https://wa.me/393287073695`
  - `PrivateStayContent.tsx:84` WhatsApp href = `https://wa.me/393287073695`
  - WhatsApp URL defined as a shared constant at module level (not inline string)
  - All existing GA4 event tracking preserved (trackApartmentEvent calls unchanged)
- **Validation contract:**
  - TC-01: Hub page renders `HeroSection` before intent-routing cards in DOM order → DOM position check
  - TC-02: Hub page renders WhatsApp CTA link with href containing `wa.me/393287073695` → href assertion
  - TC-03: Street-level page WhatsApp href contains `393287073695` → href assertion
  - TC-04: Private-stay page WhatsApp href contains `393287073695` → href assertion
  - TC-05: Hub page still renders all existing sections (Hero, Highlights, Gallery, Amenities, Details) → presence check
  - Acceptance coverage: TC-01 (structure), TC-02-04 (WhatsApp fix), TC-05 (regression)
  - Validation type: unit
  - Validation location: `apps/brikette/src/test/components/apartment/ApartmentStructureAndLinks.test.tsx` (new)
  - Run/verify: `pnpm --filter brikette test -- ApartmentStructureAndLinks`
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Checks run: Read all 3 TSX files; confirmed render order and WhatsApp href locations
  - Unexpected findings: None — locations match fact-find exactly
- **Rollout / rollback:**
  - Rollout: Direct deploy
  - Rollback: Revert 3 TSX files
- **Documentation impact:** None
- **Notes / references:**
  - Brief section 6A: hub above-fold structure spec
  - Brief section 8: WhatsApp CTA on all pages
  - Existing correct WhatsApp URL: `ApartmentBookContent.tsx:23`

### TASK-03: Update booking page GA4 price + roomsData basePrice

- **Type:** IMPLEMENT
- **Deliverable:** Updated `ApartmentBookContent.tsx` and `roomsData.ts`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-do-build
- **Affects:** `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx`, `apps/brikette/src/data/roomsData.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 95% — two numeric constants to update
  - Approach: 85% — using €265 (shoulder minimum) as base price is the safest default; real seasonal pricing would require dynamic lookup which is out of scope
  - Impact: 90% — GA4 analytics values will change; roomsData basePrice affects any downstream consumers
- **Acceptance:**
  - `ApartmentBookContent.tsx` GA4 `begin_checkout` event uses `price: 265` (not 150)
  - `ApartmentBookContent.tsx` GA4 `value` calculation uses `nights * 265` (not nights * 150)
  - `roomsData.ts` apartment entry `basePrice.amount` = `265.0` (not 150.0)
  - TODO comments on rate plan IDs preserved (still pending Octorate setup)
- **Validation contract:**
  - TC-01: GA4 begin_checkout event `price` field = 265 → event assertion
  - TC-02: GA4 begin_checkout event `value` field = nights * 265 → event assertion
  - TC-03: roomsData apartment entry `basePrice.amount` = 265 → import assertion
  - Acceptance coverage: TC-01-02 (GA4 accuracy), TC-03 (data accuracy)
  - Validation type: unit
  - Validation location: `apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx` (update existing)
  - Run/verify: `pnpm --filter brikette test -- ga4-07-apartment-checkout`
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Checks run: Read `ApartmentBookContent.tsx` lines 68-69 and `roomsData.ts` line 331 — confirmed placeholder values
  - Unexpected findings: None
- **What would make this >=90%:**
  - Confirmed actual base price from Pete (currently using brief's shoulder-season minimum)
- **Rollout / rollback:**
  - Rollout: Direct deploy
  - Rollback: Revert 2 files
- **Documentation impact:** None
- **Notes / references:**
  - Brief section 2: "shoulder season from €265/night"
  - Existing GA4 test: `ga4-07-apartment-checkout.test.tsx` asserts `price: 150` — must update

### TASK-04: Update tests and run full validation

- **Type:** IMPLEMENT
- **Deliverable:** Updated and new test files; full suite green
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-do-build
- **Affects:** `apps/brikette/src/test/components/apartment/ApartmentContentAccuracy.test.tsx` (new), `apps/brikette/src/test/components/apartment/ApartmentStructureAndLinks.test.tsx` (new), `apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx` (update)
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 92% — test patterns well-established; mocking patterns exist in adjacent tests
  - Approach: 90% — testing content accuracy via translation file assertions is straightforward; DOM order tests use standard RTL patterns
  - Impact: 88% — new test files only; existing test update is a constant change
- **Acceptance:**
  - New `ApartmentContentAccuracy.test.tsx` passes all TCs from TASK-01
  - New `ApartmentStructureAndLinks.test.tsx` passes all TCs from TASK-02
  - Updated `ga4-07-apartment-checkout.test.tsx` asserts `price: 265` (not 150) and `value: 795` (3 nights * 265)
  - Full brikette test suite passes: `pnpm --filter brikette test` — 0 failures
  - Typecheck clean: `pnpm --filter brikette typecheck` — 0 errors
- **Validation contract:**
  - TC-01: All new/updated apartment tests pass → `pnpm --filter brikette test -- apartment` green
  - TC-02: Full brikette suite passes → `pnpm --filter brikette test` green, 0 failures
  - TC-03: Typecheck clean → `pnpm --filter brikette typecheck` exits 0
  - Acceptance coverage: TC-01 (apartment tests), TC-02 (regression), TC-03 (type safety)
  - Validation type: unit + typecheck
  - Validation location: all test files above
  - Run/verify: `pnpm --filter brikette test && pnpm --filter brikette typecheck`
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Checks run: `pnpm --filter brikette test -- apartment` — 19/19 PASS (baseline confirmed)
  - GA4 test reads `price: 150` on line 79 and `value: 450` on line 79 — confirmed values to update
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Tests ship with code changes
  - Rollback: Revert test files
- **Documentation impact:** None
- **Notes / references:**
  - Existing test mocking patterns: `ga4-07-apartment-checkout.test.tsx` (mock i18n, usePagePreload, FitCheck, dateUtils, next/link, next/navigation)
  - Content accuracy tests can assert directly on the JSON file (import and check values)

## Risks & Mitigations

- **"Sea-view balcony" removal may undersell property:** If the apartment does have a balcony with sea views, removing it from the details list undersells. Mitigation: safe default; Pete can add back with a single JSON edit.
- **Price signal "from €265" may not match actual rates:** Using shoulder-season minimum from brief. Mitigation: easy to update in `apartmentPage.json`; translation key makes it a single-line edit.
- **GA4 test update:** Existing test asserts `price: 150`. Must update to 265 in TASK-04. Mitigation: small change; test is well-structured.
- **Copy needs translation to 17 locales:** English-only for now; other locales fall back to English. Mitigation: accepted non-goal; follow-on with `/guide-translate` pattern.

## Observability

- Logging: GA4 events already in place (click_check_availability, click_whatsapp, begin_checkout)
- Metrics: CTA CTR on apartment pages (compare before/after content upgrade); hub page bounce rate
- Alerts/Dashboards: Manual monitoring initially; GA4 content groups already configured

## Acceptance Criteria (overall)

- [x] Hub page renders hero above fold, before intent cards and CTAs
- [x] All 4 apartment pages have WhatsApp CTAs with valid phone number
- [x] Meta titles target brief's keyword clusters (contain "Positano")
- [x] Details list is factually accurate (full kitchen, 2 bathrooms, no false claims)
- [x] Highlights do not use the word "steps"
- [x] Price signal visible ("from €265/night")
- [x] GA4 begin_checkout fires with price: 265 (not 150)
- [x] Full test suite passes (127 suites, 792 tests, 0 failures)
- [x] Typecheck clean

## Decision Log

- 2026-02-13: Use €265 (shoulder-season minimum) as base price default — pending Pete confirmation
- 2026-02-13: Remove "Sea-view balcony" from details list (safe default — mismatch risk > undersell risk at €500+/night)
- 2026-02-13: Keep existing sub-page copy where already good (street-level meta/hero, private-stay sections) — brief-aligned already

## Build Completion Log

- **Build date:** 2026-02-13
- **Wave 1 (parallel):** TASK-01, TASK-02, TASK-03 — all 3 completed via parallel subagents
- **Wave 2:** TASK-04 — test updates + full validation
- **Final validation:** 127 test suites, 792 tests passed, 0 failures; typecheck clean
- **Test adaptation:** `ApartmentStructureAndLinks.test.tsx` uses source-file string assertions (fs.readFileSync) instead of component rendering, due to `@acme/ui` organism mock complexity in Jest
- **Files changed:**
  - `apps/brikette/src/locales/en/apartmentPage.json` — complete copy rewrite
  - `apps/brikette/src/app/[lang]/apartment/ApartmentPageContent.tsx` — reordered structure, added WhatsApp CTA
  - `apps/brikette/src/app/[lang]/apartment/street-level-arrival/StreetLevelArrivalContent.tsx` — fixed WhatsApp URL
  - `apps/brikette/src/app/[lang]/apartment/private-stay/PrivateStayContent.tsx` — fixed WhatsApp URL
  - `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx` — GA4 price 150→265
  - `apps/brikette/src/data/roomsData.ts` — basePrice 150→265
  - `apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx` — updated price assertions
  - `apps/brikette/src/test/components/apartment/ApartmentContentAccuracy.test.tsx` (new)
  - `apps/brikette/src/test/components/apartment/ApartmentStructureAndLinks.test.tsx` (new)
