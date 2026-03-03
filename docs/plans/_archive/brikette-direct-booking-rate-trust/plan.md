---
Type: Plan
Status: Archived
Domain: Brikette/UX
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Completed: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-direct-booking-rate-trust
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted with downward bias
Auto-Build-Intent: plan+auto
---

# Brikette Direct Booking Rate Trust Plan

## Summary

This plan fixes four concrete gaps in Brikette's direct-booking trust proposition: an internal discount claim inconsistency (10% in the hero modal vs 25% everywhere else), a below-fold perks placement on the `/book` page, the absence of a "Best Rate Guarantee" badge on room cards, and an expired `/deals` page showing an empty state to all current visitors. All changes are copy/layout adjustments within existing component boundaries — no schema changes, no new architecture. Direct booking share is declining (18%, target 27%) and these are the lowest-effort, highest-credibility fixes available before considering third-party tooling.

## Active tasks

- [x] TASK-01: Fix i18n discount claim inconsistency (18 locales)
- [x] TASK-02: Reposition DirectPerksBlock above room list on /book
- [x] TASK-03: Add Best Rate Guarantee badge to RoomCard
- [x] TASK-04: Restore /deals page with evergreen perks entry
- [x] TASK-05: Add regression tests for copy consistency and active-deal state

## Goals
- Eliminate the in-production 10%-vs-25% inconsistency on the offers modal across all 18 locales
- Make the "why book direct" perks block visible before a guest sees room prices on `/book`
- Surface the "Best price guaranteed" claim at the room card level (not just on room detail pages)
- Restore the `/deals` page to an active state year-round

## Non-goals
- Live OTA price comparison widget (no Octorate channel manager API available)
- Third-party price SaaS (Triptease, Hotels Network) — deferred
- Loyalty / CRM mechanics — deferred
- Rate parity monitoring tooling — deferred

## Constraints & Assumptions
- Constraints:
  - All copy in i18n JSON files — no hardcoded strings in components
  - Static Next.js export (Cloudflare Pages) — no runtime rate lookups
  - `[CONFIRM BEFORE MERGE]` annotation on TASK-01: operator must confirm "up to 25% off" is accurate before the PR ships. Fallback: change to "exclusive direct-only perks" with no % claim.
  - Badge must ship with a claim path (WhatsApp/email link) — do not ship without it
- Assumptions:
  - "Up to 25% off" is the intended current claim (appears on 3 production surfaces)
  - `_tokens.bestPriceGuaranteed` is an i18n key in the `_tokens` namespace accessible from `RoomCard.tsx`
  - No active A/B test is running on the booking funnel

## Inherited Outcome Contract

- **Why:** Direct booking share declining (21.8% → 18%) while forecast targets 27% P50. Trust signals are inconsistent and below the fold — guests have no reason to trust the direct channel at the moment of decision.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Increase direct booking share toward 27% P50 target. Proxy: GA4 CTA click events on `/book` and `/rooms` pre-Octorate-handoff, measured over 30 days post-deploy.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/brikette-direct-booking-rate-trust/fact-find.md`
- Key findings used:
  - `offers.perks.discount` = "Up to 10% off" in `modals.json`; all other surfaces say "Up to 25% off" — modal is the outlier
  - `DirectPerksBlock` is sequenced after `RoomsSection` in `BookPageContent.tsx` — below-fold
  - `RoomCard.tsx` `RoomCardPrice` type has no `compareAtPrice`; badge is static (no type change needed)
  - `deals.ts` single entry expired Oct 2025; `/deals` page in empty state for all current visitors
  - `StickyBookNow.tsx` established badge pattern (`BadgeCheck` + `_tokens.bestPriceGuaranteed`) to reuse
  - EU DMA/EC commitments: rate parity clauses removed; Best Rate Guarantee mechanism is legally safe
  - 18 locales: ar, da, de, en, es, fr, hi, hu, it, ja, ko, no, pl, pt, ru, sv, vi, zh

## Proposed Approach

The scope is intentionally narrow: fix existing signals rather than add new systems. The four gaps (copy inconsistency, positioning, room-card badge, empty deals page) are all reachable with existing component patterns and i18n plumbing. No DECISION tasks are warranted — all design choices (badge pattern = StickyBookNow; claim path = existing WhatsApp/email link; evergreen deal = far-future end date) are resolved by existing codebase precedent.

**Chosen approach:** Wave 1 executes all four content/layout changes in parallel (independent files). Wave 2 adds regression tests that lock in the corrected state.

## Plan Gates
- Foundation Gate: Pass (Deliverable-Type ✓, Execution-Track ✓, Primary-Execution-Skill ✓, test landscape ✓, testability ✓)
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes (all IMPLEMENT tasks ≥80%; no blocking decision gates)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix i18n discount claim — 18 locale modals.json files | 85% | S | Complete (2026-02-27) | - | TASK-05 |
| TASK-02 | IMPLEMENT | Reposition DirectPerksBlock above room list on /book | 80% | S | Complete (2026-02-27) | - | TASK-05 |
| TASK-03 | IMPLEMENT | Add Best Rate Guarantee badge to RoomCard | 80% | M | Complete (2026-02-27) | - | TASK-05 |
| TASK-04 | IMPLEMENT | Restore /deals page with evergreen perks entry | 85% | S | Complete (2026-02-27) | - | TASK-05 |
| TASK-05 | IMPLEMENT | Add regression tests (copy consistency, deal count, badge presence) | 85% | S | Complete (2026-02-27) | TASK-01, TASK-02, TASK-03, TASK-04 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04 | None | All touch independent files; execute in parallel |
| 2 | TASK-05 | All Wave 1 complete | Tests validate the new corrected state |

## Tasks

---

### TASK-01: Fix i18n discount claim inconsistency (18 locale modals.json files)
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/locales/<lang>/modals.json` for all 18 locales — `offers.perks.discount` value corrected to match the "Up to 25% off" claim used on all other surfaces
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/locales/ar/modals.json`, `apps/brikette/src/locales/da/modals.json`, `apps/brikette/src/locales/de/modals.json`, `apps/brikette/src/locales/en/modals.json`, `apps/brikette/src/locales/es/modals.json`, `apps/brikette/src/locales/fr/modals.json`, `apps/brikette/src/locales/hi/modals.json`, `apps/brikette/src/locales/hu/modals.json`, `apps/brikette/src/locales/it/modals.json`, `apps/brikette/src/locales/ja/modals.json`, `apps/brikette/src/locales/ko/modals.json`, `apps/brikette/src/locales/no/modals.json`, `apps/brikette/src/locales/pl/modals.json`, `apps/brikette/src/locales/pt/modals.json`, `apps/brikette/src/locales/ru/modals.json`, `apps/brikette/src/locales/sv/modals.json`, `apps/brikette/src/locales/vi/modals.json`, `apps/brikette/src/locales/zh/modals.json`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 90% — 18 locale files, each with a single key update; paths confirmed; i18n structure is namespace-parallel
  - Approach: 90% — i18n JSON update is the established pattern; no component code changes needed
  - Impact: 85% — corrects in-production inconsistency (three surfaces say 25%, modal says 10%); 15% residual: if operator confirms 25% is inaccurate, copy must change again before merging
- **Acceptance:**
  - All 18 `modals.json` files contain matching `offers.perks.discount` value
  - EN value matches `dealsPage.json → perksList[0].title` (both "Up to 25% off")
  - i18n-parity CI test passes (no new failures)
  - **[CONFIRM BEFORE MERGE]** Operator has confirmed "up to 25% off" is accurate for the current Octorate rate structure
- **Validation contract (TC-01):**
  - TC-01: Load homepage in EN; click "Direct booking perks • Best price guaranteed" link → modal opens → `offers.perks.discount` text reads "Up to 25% off your room rate"
  - TC-02: Repeat TC-01 in IT locale → modal shows Italian translation consistent with 25% claim (not 10%)
  - TC-03: New cross-namespace equality test (written in TASK-05) passes in CI: `modals.offers.perks.discount` aligns with `dealsPage.perksList[0].title`
- **Execution plan:**
  - Read EN `modals.json` to confirm the current `offers.perks.discount` key path and value
  - Read each of the 17 non-EN `modals.json` files to confirm the parallel key exists and holds the translated form of "10% off" (or check if any already say 25%)
  - Update all files that need changing; for non-EN locales, update the translated value to match the percentage claim (25%), keeping the translated surrounding text
  - Run the i18n-parity CI test after changes to confirm no structural issues
- **Planning validation:**
  - Checks run: locale directory confirmed at `apps/brikette/src/locales/`; 18 language directories confirmed; modals.json namespace confirmed; key path confirmed by fact-find investigation
  - Unexpected findings: None anticipated; any locale file with a different structure will be surfaced at build time
- **Scouts:** Before editing all 18, read 2-3 non-EN files to confirm the key structure is identical; confirm the surrounding text differs only in language (not in the percentage value format)
- **Edge Cases & Hardening:**
  - If any non-EN locale already says 25% (already fixed): leave it; log in commit message
  - If any non-EN locale has a significantly different offers.perks structure: flag for operator review before editing
  - Consumer tracing: `offers.perks.discount` is consumed by `OffersModal`, which is opened from multiple surfaces: `HomeContent.tsx` (hero link), and potentially `/deals` and other pages that render the modal trigger. The fix (updating the value) applies to all consumers uniformly — no surface-specific change needed. All surfaces read from the same `modals.json` namespace key.
- **What would make this >=90%:** Operator confirms 25% is accurate (removes the merge-blocking annotation)
- **Rollout / rollback:**
  - Rollout: deploy to staging; verify modal copy in EN + IT + at least 2 other locales before production push
  - Rollback: revert commit; no data migration required
- **Documentation impact:** None: no doc changes needed
- **Notes / references:**
  - Fact-find confirmed: `apps/brikette/src/locales/en/modals.json` `offers.perks.discount` = "Up to 10% off your room rate"
  - `apps/brikette/src/locales/en/dealsPage.json` `perksList[0].title` = "Up to 25% off"

---

### TASK-02: Reposition DirectPerksBlock above room list on /book
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` — `DirectPerksBlock` rendered above `RoomsSection`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 80%
  - Implementation: 90% — single JSX file reorder; no logic changes; component is already imported
  - Approach: 85% — moving above `RoomsSection` is clear; exact optimal position (before room header vs between header and cards) may need minor judgment at build time
  - Impact: 80% — perks will be visible before room prices (deterministic); Held-back test: no single unknown drops Impact below 80 because any above-fold placement is better than current below-fold placement regardless of exact position
- **Acceptance:**
  - On `/book`, `DirectPerksBlock` appears before the first room card in document order
  - No existing snapshot/render tests broken (CI validates)
  - Visual check on staging: perks block visible without scrolling on standard mobile viewport (375px width)
- **Validation contract (TC-02):**
  - TC-01: Navigate to `/en/book`; without scrolling, verify "Why book direct?" heading is visible above the first room listing
  - TC-02: Playwright E2E (or manual staging check): DOM order of `DirectPerksBlock` container precedes `RoomsSection` container
  - TC-03: CI passes with no snapshot regression failures
- **Execution plan:**
  - Read `BookPageContent.tsx` to understand exact JSX structure and current position of `DirectPerksBlock` relative to `RoomsSection`
  - Move `DirectPerksBlock` JSX element to a position directly above `RoomsSection` (or above the section heading if there is one)
  - Verify no props change needed (component is already in scope)
  - Push to CI; confirm no snapshot failures
- **Planning validation:**
  - Checks run: `BookPageContent.tsx` identified as the target file; `DirectPerksBlock` confirmed as a child component; `RoomsSection` confirmed as the sibling to reorder relative to
  - Unexpected findings: None — this is a pure JSX reorder
- **Scouts:** Read `BookPageContent.tsx` at build start to confirm the exact JSX tree before moving
- **Edge Cases & Hardening:**
  - If the perks block is inside a conditional render (e.g. only shown for hostel vs apartment): keep same conditional; just reorder position
  - Consumer tracing: `DirectPerksBlock` props are unchanged; no consumer impact
- **What would make this >=90%:** Visual regression test or Playwright viewport assertion confirming above-fold visibility
- **Rollout / rollback:**
  - Rollout: deploy to staging; visual check on mobile and desktop
  - Rollback: revert single file; no state or data changes
- **Documentation impact:** None
- **Notes / references:**
  - Fact-find: "perks block on `/book` is sequenced after the room list in `BookPageContent` — missed opportunity to anchor the value proposition before the CTA"

---

### TASK-03: Add Best Rate Guarantee badge to RoomCard
- **Type:** IMPLEMENT
- **Deliverable:** Badge rendered in `PriceBlock` inside the shared UI package, data-driven via a new optional `badge` field on `RoomCardPrice`; brikette adapter populates it. Three files changed.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/ui/src/types/roomCard.ts`, `packages/ui/src/molecules/RoomCard.tsx`, `apps/brikette/src/components/rooms/RoomCard.tsx`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 80%
  - Implementation: 85% — `PriceBlock` private component in `packages/ui/src/molecules/RoomCard.tsx` identified as the rate display owner; `RoomCardPrice` type in `packages/ui/src/types/roomCard.ts` confirmed; brikette adapter at `apps/brikette/src/components/rooms/RoomCard.tsx` confirmed as the prop-builder. All three files are known; no unexpected architecture.
  - Approach: 80% — data-driven badge via optional `badge?: { text: string; claimUrl: string }` field on `RoomCardPrice` is the cleanest approach: keeps brikette copy out of the shared package; UI package stays generic. Claim path uses WhatsApp link pattern confirmed in `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx` (`https://wa.me/393287073695`). Held-back test: `_tokens.bestPriceGuaranteed` key may not exist — if absent, add it; this doesn't change approach. No unknown drops Approach below 80.
  - Impact: 80% — badge will render on all RoomCard instances (deterministic once implemented); claim link functional. Held-back test: no single unknown drops Impact below 80; badge uses a proven pattern
- **Acceptance:**
  - `packages/ui/src/types/roomCard.ts` — `RoomCardPrice` has optional `badge?: { text: string; claimUrl: string }`
  - `packages/ui/src/molecules/RoomCard.tsx` — `PriceBlock` renders badge below price when `price.badge` is present; no badge when `price.soldOut` is true or `price.badge` is absent
  - `apps/brikette/src/components/rooms/RoomCard.tsx` — `price.badge` populated with `{ text: _tokens.bestPriceGuaranteed, claimUrl: "https://wa.me/393287073695" }` for non-sold-out rooms
  - Badge renders on both `/book` and `/rooms` (same brikette `RoomCard` component; automatic)
  - New test in TASK-05 asserts badge text presence
- **Validation contract (TC-03):**
  - TC-01: `ga4-11-select-item-room-ctas.test.tsx` (extended in TASK-05): render brikette `RoomCard` with non-sold-out room → "Best price guaranteed" text present in output
  - TC-02: Render brikette `RoomCard` with `soldOut: true` → badge text absent
  - TC-03: Badge `href` link resolves to `https://wa.me/393287073695`; no dead link
  - TC-04: Other consumers of `packages/ui` `RoomCard` (if any) that do not pass `price.badge` render normally — badge is optional/absent by default
- **Execution plan:**
  - Read `packages/ui/src/types/roomCard.ts` to confirm `RoomCardPrice` type fields
  - Read `packages/ui/src/molecules/RoomCard.tsx` `PriceBlock` (lines 111-156) to understand the exact JSX to extend
  - Add `badge?: { text: string; claimUrl: string }` to `RoomCardPrice`
  - In `PriceBlock`, add below the price `<div>`: if `price.badge && !price.soldOut`, render `<a href={price.badge.claimUrl}><BadgeCheck />{price.badge.text}</a>` (small text, same styling pattern as `StickyBookNow`)
  - Read `apps/brikette/src/components/rooms/RoomCard.tsx` to find where `price` object is assembled (lines 172-190 per investigation)
  - In brikette adapter: read `_tokens.bestPriceGuaranteed` from `_tokens` namespace; if key is absent, add it to `_tokens.json` in all 18 locales; add `badge: soldOut ? undefined : { text: tTokens("bestPriceGuaranteed"), claimUrl: "https://wa.me/393287073695" }` to the price object
  - Push to CI; confirm TypeScript types pass across all packages (monorepo typecheck)
- **Planning validation:**
  - Checks run: `PriceBlock` is private, not exported — confirmed safe to modify without public API impact; `RoomCardPrice` is in `packages/ui/src/types/` — adding optional field is backward-compatible; brikette adapter assembles price on lines 172-190; WhatsApp number confirmed as `393287073695` from `ApartmentBookContent.tsx`
  - Unexpected findings: Rate display is NOT in the brikette wrapper — it is in the shared UI package's private `PriceBlock`. This is why three files require changes.
- **Consumer tracing (M effort):**
  - New field `badge?: { text: string; claimUrl: string }` on `RoomCardPrice`: consumed by `PriceBlock` in `packages/ui/src/molecules/RoomCard.tsx`. No other consumer reads this field (it's new). Callers that don't pass `badge` are unchanged because the field is optional.
  - Modified `PriceBlock` behavior: additive only — renders badge when `badge` is present, silent when absent. Existing callers passing no `badge` are unaffected.
  - Modified brikette adapter: populates `badge` for non-sold-out rooms only. No other brikette component consumes the badge value outside `UiRoomCard` rendering. `BookPageContent` and `RoomsPageContent` both get the badge automatically through the same `RoomCard` component — no additional changes needed there.
- **Scouts:** Read `packages/ui/src/types/roomCard.ts` and `packages/ui/src/molecules/RoomCard.tsx` at build start to confirm exact type shape and PriceBlock structure before editing
- **Edge Cases & Hardening:**
  - Badge must not appear when `soldOut: true` — guard at both the adapter level (don't set badge) and the PriceBlock level (`price.badge && !price.soldOut`)
  - Optional field: other consumers of `UiRoomCard` in the monorepo (if any, outside brikette) do not need to pass `badge` — it defaults to absent/hidden
  - Mobile viewport: use inline/small text with icon, consistent with StickyBookNow badge sizing
  - TypeScript: monorepo typecheck must pass after type extension in `packages/ui`
- **What would make this >=90%:** Add a Playwright test confirming badge visibility on mobile viewport; confirm `_tokens.bestPriceGuaranteed` exists in all 18 locales before shipping
- **Rollout / rollback:**
  - Rollout: deploy to staging; verify badge visible on `/book` and `/rooms` room cards
  - Rollback: revert all three files; optional `badge` field removal is backward-compatible
- **Documentation impact:** None
- **Notes / references:**
  - `PriceBlock` is at lines 111-156 in `packages/ui/src/molecules/RoomCard.tsx` (investigation confirmed)
  - Brikette adapter price object assembled at lines 172-190 in `apps/brikette/src/components/rooms/RoomCard.tsx`
  - WhatsApp claim path: `https://wa.me/393287073695` — pattern from `ApartmentBookContent.tsx`

---

### TASK-04: Restore /deals page with evergreen perks entry
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/routes/deals/deals.ts` — expired deal removed; evergreen "direct booking perks" entry added with far-future end date
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/routes/deals/deals.ts`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 95% — trivial data change; `Deal` type confirmed; backward-compatible
  - Approach: 90% — evergreen entry with far-future `endDate` (2099-12-31) is the established pattern for always-active entries; `deals.ts` supports multiple entries
  - Impact: 85% — `/deals` page exits empty state (deterministic); `DirectBookingPerks` card renders with evergreen deal data
- **Acceptance:**
  - `/deals` page no longer shows `emptyState` for any current visitor
  - Evergreen deal card renders with correct perk information
  - `DealsPageContent` GA4 promotion event fires for the evergreen entry
  - Expired `sep20_oct31_15off` deal removed or confirmed non-rendering (end date in past)
- **Validation contract (TC-04):**
  - TC-01: Navigate to `/en/deals` → at least one deal card renders; no `emptyState.subtitle` visible
  - TC-02: Evergreen deal card displays with expected perks (not placeholder/empty data)
  - TC-03: Active-deal count unit test (written in TASK-05) passes: `getActiveDealCount(deals, new Date()) >= 1`
- **Execution plan:**
  - Read `deals.ts` to confirm current Deal type shape and the expired entry
  - Read `DealsPageContent.tsx` to understand how deals are rendered and how `emptyState` is triggered
  - Remove `sep20_oct31_15off` entry (or leave it — its end date is past so it won't render, but removing is cleaner)
  - Read `deals.ts` to confirm the exact `DealConfig` type shape — the proposed evergreen object `{ id, discountPct, startDate, endDate, rules }` is an approximation; the actual type (e.g. `DealConfig` in `apps/brikette/src/routes/deals/deals.ts`) may have additional required `validity` fields. Add all required fields from the type definition before writing the new entry.
  - Verify the card renders with appropriate perk copy (it will use `dealsPage.json` i18n for labels)
- **Planning validation:**
  - Checks run: `deals.ts` structure confirmed; `Deal` type shape confirmed; `DealsPageContent` empty-state trigger confirmed
  - Validation artifacts: Fact-find: "single deal entry `{ id: 'sep20_oct31_15off', discountPct: 15, endDate: '2025-10-31' }`"
  - Unexpected findings: None
- **Scouts:** Read `Deal` type definition before adding the evergreen entry to confirm all required fields
- **Edge Cases & Hardening:**
  - If a seasonal deal is added in future, it will appear alongside the evergreen entry — this is correct behaviour
  - If `Deal.rules` has a different shape than assumed: read type before writing
  - `discountPct: 25` on evergreen entry must match the "Up to 25% off" claim — make it consistent with TASK-01
- **What would make this >=90%:** Confirm `Deal` type fields by reading the type definition at build time; add active-deal count test (TASK-05)
- **Rollout / rollback:**
  - Rollout: deploy to staging; verify `/deals` shows deal card
  - Rollback: revert `deals.ts`; no database changes
- **Documentation impact:** None
- **Notes / references:**
  - `dealsPage.json` i18n keys drive the deal card copy; no separate copy change needed if the existing keys are appropriate for the evergreen entry

---

### TASK-05: Add regression tests for copy consistency, deal count, and badge presence
- **Type:** IMPLEMENT
- **Deliverable:** New test assertions in existing test files — cross-namespace discount claim equality; active-deal count ≥ 1; "Best price guaranteed" badge text in `RoomCard` render
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/test/content-readiness/i18n/i18n-parity-quality-audit.test.ts`, `apps/brikette/src/test/components/ga4-34-deals-page-promotions.test.tsx`, `apps/brikette/src/test/components/ga4-11-select-item-room-ctas.test.tsx`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — test files identified and confirmed by codemoot fact-checking; patterns (RTL, equality assertions) are standard
  - Approach: 85% — three concrete test additions; each maps to a clear assertion
  - Impact: 85% — tests will prevent regression recurrence (deterministic)
- **Acceptance:**
  - i18n cross-namespace equality: `modals.json → offers.perks.discount` contains "25" (the percentage); fails if reverted to "10%"
  - Active-deal count: `getActiveDealCount(deals, new Date())` returns ≥ 1; fails if deals array is all-expired
  - Badge presence: `RoomCard` render test asserts "Best price guaranteed" text is present when `soldOut` is false
  - All tests pass in CI
- **Validation contract (TC-05):**
  - TC-01: `i18n-parity-quality-audit.test.ts` — new assertion: EN `modals.offers.perks.discount` value contains "25%" → passes post-TASK-01
  - TC-02: `ga4-34-deals-page-promotions.test.tsx` — new assertion: `getActiveDealCount(deals, new Date()) >= 1` → passes post-TASK-04
  - TC-03: `ga4-11-select-item-room-ctas.test.tsx` — new assertion: render brikette `RoomCard` with non-sold-out room → "Best price guaranteed" text present → passes post-TASK-03
- **Execution plan:**
  - Read all three test files to understand existing test structure and patterns before adding assertions
  - Add TC-01 assertion to `i18n-parity-quality-audit.test.ts`: import EN `modals.json` and EN `dealsPage.json`; assert both discount claim values contain "25"
  - Add TC-02 assertion to `ga4-34-deals-page-promotions.test.tsx`: import `deals.ts`; if a `getActiveDealCount` helper does not already exist in `deals.ts`, create it (inline filter: `deals.filter(d => !d.endDate || new Date(d.endDate) >= new Date()).length`); assert count ≥ 1
  - Add TC-03 to `ga4-11-select-item-room-ctas.test.tsx`: render brikette `RoomCard` with non-sold-out room mock props; assert "Best price guaranteed" text appears in output
  - Push to CI; confirm all three pass
- **Planning validation:**
  - Test files confirmed by codemoot critique in fact-find Phase 7a Round 3
  - Test patterns: RTL render + text assertion is standard; equality assertion on JSON import is standard
- **Scouts:** Read each test file before adding assertions to match existing style (describe/it structure, mock patterns, import style)
- **Edge Cases & Hardening:**
  - The i18n equality test must handle translated values in non-EN locales — scope the assertion to EN files only (or extract the percentage digit separately)
  - Date-sensitive deal count test: use a fixed "today" reference or mock `new Date()` to avoid flakiness on date boundary
- **What would make this >=90%:** Playwright visual regression for the badge and the perks repositioning (out of scope for this task — deferred)
- **Rollout / rollback:**
  - Rollout: N/A — tests are additive; no behaviour change
  - Rollback: revert test file; no other impact
- **Documentation impact:** None

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix i18n discount claim | Yes — all 18 locale paths confirmed; `modals.json` namespace confirmed | None | No |
| TASK-02: Reposition DirectPerksBlock | Yes — `BookPageContent.tsx` identified; `DirectPerksBlock` + `RoomsSection` confirmed as siblings | [Scope gap] Minor: exact JSX tree depth not verified at planning time; straightforward to inspect at build start | No |
| TASK-03: Add Best Rate Guarantee badge | Yes — `PriceBlock` in `packages/ui/src/molecules/RoomCard.tsx` confirmed as rate display owner (lines 111-156); `RoomCardPrice` in `packages/ui/src/types/roomCard.ts` confirmed; brikette adapter confirmed (lines 172-190); WhatsApp number `393287073695` confirmed from `ApartmentBookContent.tsx`; 3-file change plan established | [Undefined config key] Minor: `_tokens.bestPriceGuaranteed` may not exist; Scout at build start resolves (add if absent) | No |
| TASK-04: Restore /deals page | Yes — `deals.ts` structure confirmed; `Deal` type shape confirmed from fact-find | None | No |
| TASK-05: Add regression tests | Yes — all three test files confirmed at correct paths by codemoot Round 3; test patterns identified | None | No |

No Critical simulation findings. Plan eligible for `Status: Active`.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| "Up to 25% off" overstated — operator confirms lower figure | Low | Medium | `[CONFIRM BEFORE MERGE]` gate on TASK-01; fallback: remove % claim entirely |
| Non-EN locale file has different key structure for `offers.perks.discount` | Low | Low | Scout in TASK-01: read 2-3 non-EN files before bulk edit |
| `_tokens.bestPriceGuaranteed` key absent from `_tokens.json` | Medium | Low | Scout in TASK-03: read `_tokens.json` first; add key if absent |
| DirectPerksBlock reposition breaks snapshot test | Low | Low | CI catches immediately; 1-line snapshot update |
| Evergreen deal `Deal` type field mismatch | Low | Low | Scout in TASK-04: read `Deal` type before writing new entry |
| Badge visible on sold-out rooms (unintended) | Low | Low | Guard in TASK-03: `{!soldOut && <Badge ... />}` |

## Observability
- Metrics: GA4 CTA click events (pre-Octorate-handoff) on `/book` and `/rooms`; baseline measurement before deploy, compare at 14-day and 30-day post-deploy
- Logging: None — all changes are static
- Alerts/Dashboards: Octorate direct booking share (trailing 30-day, target: 18% → 27%)

## Acceptance Criteria (overall)

- [ ] All 18 `modals.json` files have consistent "Up to 25% off" discount claim (or operator-confirmed value)
- [ ] `DirectPerksBlock` visible above room list on `/book` without scrolling on 375px mobile viewport
- [ ] "Best price guaranteed" badge with claim path visible on room cards on `/book` and `/rooms`
- [ ] `/deals` page shows at least one active deal card (no empty state)
- [ ] All five TASK regression tests pass in CI
- [ ] Operator has confirmed "up to 25%" claim before production deploy

## Decision Log

- 2026-02-27: No DECISION tasks created. All approach decisions resolved from codebase evidence:
  - Badge pattern: `StickyBookNow.tsx` (`BadgeCheck` + `_tokens.bestPriceGuaranteed`) — reuse established
  - Claim path: WhatsApp/email link (existing patterns in codebase)
  - Deals page: evergreen entry with `endDate: "2099-12-31"` — backward-compatible
  - Wave 1 parallel, Wave 2 tests — no sequencing dependencies within Wave 1

## Overall-confidence Calculation

- TASK-01: 85%, S=1
- TASK-02: 80%, S=1
- TASK-03: 80%, M=2
- TASK-04: 85%, S=1
- TASK-05: 85%, S=1
- Weighted sum: (85 + 80 + 160 + 85 + 85) / (1+1+2+1+1) = 495 / 6 = 82.5%
- Rounded with downward bias: **80%**
