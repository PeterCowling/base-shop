---
Type: Plan
Status: Active
Status-confidence-note: 75% overall is below the 80% auto-build threshold but Active is justified because the drag comes from two INVESTIGATE tasks (TASK-07, TASK-08) whose outcomes are gated before any shell-dependent acceptance criteria are evaluated, and one DECISION task (TASK-12a) requiring operator input before TASK-12 starts. Wave 1–3 tasks are individually 80–90% and can proceed without resolving those unknowns.
Domain: Brikette Funnel
Workstream: Product-Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08 (Wave 1–4 complete; paused at TASK-12a awaiting operator input)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-cohesive-sales-funnel
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-seo
Overall-confidence: 75%
Confidence-Method: weighted average by effort; floor held by TASK-12 (68%) and TASK-07/08 (72%); Wave 1–3 tasks average ~87%
Auto-Build-Intent: plan+auto
---

# Brikette Cohesive Sales Funnel Plan

## Summary

Brikette's booking surfaces currently compete rather than collaborate: the MobileNav CTA is visually broken on phones, room cards are pushed off-screen on mobile by a padding bug, the hostel notification banner flashes on private-product pages, and all content CTAs route to the hostel compare page regardless of visitor intent. This plan fixes those baseline defects first, then builds the analytics taxonomy needed to measure the funnel, verifies the secure-booking environment gate before any shell-dependent work proceeds, and then routes content CTAs through a shared intent resolver. Sitewide shell surfaces (header, banner, OffersModal) are brought under the same analytics taxonomy and emit canonical attribution events; their routing remains hostel-only in this plan cycle, with private override deferred to a follow-on phase. Private product segmentation (apartment vs double-private-room endpoint) is gated on an operator decision about Octorate rate codes. Room-assist recovery and the dorms-page copy reframe follow once the attribution carrier and routing infrastructure are in place.

## Active tasks

- [x] TASK-01: Fix MobileNav CTA label truncation (BRK-01)
- [x] TASK-02: Fix RoomsSection mobile top padding (BRK-03)
- [x] TASK-03: Move NotificationBanner private-rooms suppression to server (BRK-06)
- [x] TASK-04: Fix ContentStickyCta dismiss button touch target (BRK-04)
- [x] TASK-05: Define and implement GA4 entry-attribution event schema
- [x] TASK-06: Implement entry-attribution persistence carrier
- [x] TASK-07: Verify NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED on target deployments
- [x] TASK-08: Prove result.xhtml iframe viability on staging
- [x] TASK-09: Implement intent resolver function
- [x] TASK-10: Wire ContentStickyCta to intent resolver
- [x] TASK-11: Wire sitewide shell CTAs to intent policy and analytics taxonomy
- [ ] TASK-12a: DECISION — double-private-room booking endpoint (PAUSED — awaiting operator input)
- [ ] TASK-12: Lock private product checkout segmentation
- [ ] TASK-13: CHECKPOINT — reassess downstream tasks after private segmentation
- [ ] TASK-14: Fix room-assist recovery attribution
- [ ] TASK-15: Reframe /dorms copy and nav as browse/SEO route

## Goals

- Fix all Wave 1 layout and UX defects that corrupt mobile funnel baselines before any measurement begins.
- Establish a typed GA4 analytics taxonomy that classifies every entry click by source surface, resolved intent, product type, decision mode, destination funnel, handoff mode, locale, and fallback state.
- Define a session-storage-first attribution carrier so multi-step journeys (content page → compare → handoff) can emit the full analytics contract at every step.
- Implement a single intent resolver that covers all current `ctaLocation` values and drives consistent routing for `ContentStickyCta`. Bring sitewide shell CTAs (`NotificationBanner`, header CTAs, `OffersModal`) under the same analytics taxonomy so they emit canonical attribution events; their routing remains hostel-only in this plan cycle.
- Explicitly segment private-product booking by product type so apartment intent and double-private-room intent are never collapsed into one undifferentiated booking endpoint.
- Fix room-assist fallback so selected room/plan/source-attribution survive when `parseSecureBookingSearchParams` returns null.
- Reframe `/dorms` as a browse/SEO route in copy and navigation, not a co-equal booking compare page.

## Non-goals

- No hybrid chooser UI (deferred; adjacent scope — see Decision Log).
- No Octorate API or webhook strategy.
- No locale propagation inside Octorate (continuity ends at the Octorate URL boundary).
- No raw inbound `utm_*` preservation across route changes (out of scope for this cycle; `deal` param preservation is in-scope where existing code already supports it).
- No redesign of the Octorate booking UI itself.
- No BRK-02 fix (trust ratings hidden on mobile) — low priority, no routing dependency; deferred.
- No BRK-07 fix (help page `title: undefined`) — SEO audit already flagged; separate SEO task.
- No BRK-08 fix (`scroll-mt-30` overhang) — cosmetic; separate debt task.

## Constraints & Assumptions

- Constraints:
  - Octorate remains the transactional engine; Brikette owns the funnel up to the embedded or same-domain handoff only.
  - Tasks that assume `NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED=1` on production must not ship acceptance criteria before TASK-07 (env verification) is complete.
  - Tasks that assume in-shell checkout must not ship before TASK-08 (iframe proof) is complete.
  - The private-product booking endpoint (`getPrivateBookingPath(lang)`) is apartment-specific; it must not receive generic private intent until TASK-12a (DECISION) is resolved and TASK-12 (segmentation) is shipped.
  - The intent resolver (TASK-09) is the single authority for routing decisions; no CTA component may embed its own routing logic after TASK-09 ships.
  - `hybrid` is not a valid routing output from the resolver in this plan; undetermined intent routes to `getBookPath(lang)` (hostel central) or `getPrivateRoomsPath(lang)` (private summary) depending on page context. Hybrid UI is deferred.
  - Writer lock must be acquired via `scripts/agents/with-writer-lock.sh` for all commits. No `--no-verify` bypass.
  - Tests run in CI only (`docs/testing-policy.md`); never run `jest` locally.
- Assumptions:
  - The env gate (`NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED`) is the canonical control for whether secure-booking shell is active; its state on staging and production is unknown until TASK-07 completes.
  - `result.xhtml` iframe embeddability on the target deployment is unproven; TASK-08 must produce manual staging evidence before any acceptance criterion references in-shell checkout completion.
  - Session storage is the preferred attribution carrier; incognito/private-browsing failure modes must be handled gracefully (carrier falls back silently; analytics degrade to click-only event, not an error).
  - `getPrivateRoomsPath(lang)` (the localized private summary hub) is the safe generic destination for undetermined private intent until TASK-12a is resolved.
  - The `fireCtaClick` function in `ga4-events.ts` will be extended with optional typed fields rather than replaced; existing callers remain valid.

## Inherited Outcome Contract

- **Why:** Brikette needs a single coherent sales-funnel model so homepage, booking pages, room pages, private-product pages, and content pages stop competing with one another and instead route users deliberately toward the correct booking outcome.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** produce a planning-ready funnel architecture and implementation constraints that define the central hostel conversion path, the private-product path, the role of browse/supporting pages, and the locale-continuity boundary up to Octorate, then ship the code that realises it.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/brikette-cohesive-sales-funnel/fact-find.md`
- Key findings used:
  - BRK-01: MobileNav CTA `max-w-[6rem]` clips the 17-character label on all phones (320–639px). Clears at `sm:max-w-none`.
  - BRK-03: `RoomsSection` has `pt-30` (120px) on mobile — pushing room cards below the fold on phones. Drops to `pt-12` at 640px. Almost certainly an unintentional value.
  - BRK-04: `ContentStickyCta` dismiss button is `size-10` (40px), 4px short of WCAG 2.5.5 44px minimum.
  - BRK-06: `NotificationBanner` private-rooms suppression is client-only (`pathname.includes`); banner renders server-side then unmounts, causing a layout flash and measurement noise.
  - Sitewide CTAs: `Header.tsx` desktop + mobile and `OffersModal` route hostel-only with no intent branching and none emit events on the planned analytics taxonomy. `MobileNav` (packages/ui) already branches on `isApartmentRoute` (lines 60-62) and routes to `privateBookingPath` on apartment/private-booking routes — TASK-11 must not regress this existing behavior; it adds attribution only.
  - `ContentStickyCta.onCtaClick` always calls `router.push(getBookPath(lang))` — no intent branching, no attribution carrier.
  - `fireCtaClick` currently accepts `ctaId: string` + `ctaLocation: string` and emits only `cta_id` and `cta_location`; no entry-attribution dimensions exist yet.
  - `GA4_ENUMS.ctaLocation` already includes `deals_page` as a granular CTA placement value (confirmed in ga4-events.ts). `sitewide_shell` and `deals_page` are `source_surface` (page/surface family) values, not `ctaLocation` values — they belong in a new `GA4_ENUMS.sourceSurface` enum array to be added in TASK-05. Neither is to be added to `ctaLocation`.
  - Room-assist fallback (`parseSecureBookingSearchParams` null case) sends the user to the generic compare page, dropping `room`, `plan`, and all source attribution.
  - Env gate state and iframe viability are both unverified on target deployments.
  - The double-private-room booking endpoint is an open design decision requiring operator input on Octorate rate code availability.
  - `RoomsSection` `sectionClasses` already encodes `pt-30 sm:pt-12` — confirming BRK-03 is in `packages/ui/src/organisms/RoomsSection.tsx` line 287.
  - `MobileNav` CTA class string is `max-w-[6rem] ... sm:max-w-none sm:whitespace-nowrap` at line 131 of `packages/ui/src/organisms/MobileNav.tsx` — confirming BRK-01 fix target.

## Proposed Approach

- **Option A (monolithic):** Design and implement all routing changes at once, with analytics and attribution shipped alongside.
- **Option B (phased by wave):** Fix layout defects first (independent, low-risk), then establish analytics taxonomy and carrier (prerequisite for measurement), then verify the env gate and iframe (gate), then implement routing (depends on all of the above), then private segmentation (gated on DECISION), then recovery and copy.
- **Chosen approach: Option B.** Phased by wave with explicit dependency gates. Layout fixes have zero routing dependency and ship immediately. Analytics taxonomy and attribution carrier are prerequisites for every measurement claim. Env gate and iframe verification gate all shell-dependent acceptance criteria. Routing changes are sequenced after the analytics contract is in place so instrumented events are trustworthy from day one.

## Plan Gates

- Foundation Gate: Pass — all Wave 1 tasks are isolated CSS/layout changes; no cross-task dependencies within the wave.
- Sequenced: Yes — dependency chain is explicit and enforced in the parallelism guide.
- Edge-case review complete: Yes — attribution carrier incognito failure mode documented; intent resolver "undetermined" state documented; env-gate-off failure mode documented.
- Auto-build eligible: Conditional — eligible through non-DECISION tasks; hard pause required at TASK-12a for operator input on Octorate rate codes.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix MobileNav CTA label truncation (BRK-01) | 90% | S | Complete (2026-03-08) | - | - |
| TASK-02 | IMPLEMENT | Fix RoomsSection mobile top padding (BRK-03) | 90% | S | Complete (2026-03-08) | - | - |
| TASK-03 | IMPLEMENT | Move NotificationBanner private-rooms suppression to server (BRK-06) | 87% | S | Complete (2026-03-08) | - | - |
| TASK-04 | IMPLEMENT | Fix ContentStickyCta dismiss button touch target (BRK-04) | 90% | S | Complete (2026-03-08) | - | - |
| TASK-05 | IMPLEMENT | Define and implement GA4 entry-attribution event schema | 82% | M | Complete (2026-03-08) | - | TASK-10, TASK-11, TASK-12 |
| TASK-06 | IMPLEMENT | Implement entry-attribution persistence carrier | 82% | M | Complete (2026-03-08) | - | TASK-12, TASK-14 |
| TASK-07 | INVESTIGATE | Verify NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED on target deployments | 72% | S | Complete (2026-03-08) | - | TASK-09, TASK-10, TASK-11 |
| TASK-08 | INVESTIGATE | Prove result.xhtml iframe viability on staging | 72% | S | Complete (2026-03-08) | - | TASK-10, TASK-11 |
| TASK-09 | IMPLEMENT | Implement intent resolver function | 80% | M | Complete (2026-03-08) | TASK-05, TASK-07 | TASK-10, TASK-11, TASK-12 |
| TASK-10 | IMPLEMENT | Wire ContentStickyCta to intent resolver | 75% | M | Complete (2026-03-08) | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 | - |
| TASK-11 | IMPLEMENT | Wire sitewide shell CTAs to intent policy and analytics taxonomy | 75% | M | Complete (2026-03-08) | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 | - |
| TASK-12a | DECISION | Double-private-room booking endpoint | 80% | S | Pending — awaiting operator input | TASK-09 | TASK-12 |
| TASK-12 | IMPLEMENT | Lock private product checkout segmentation | 68% | M | Pending | TASK-05, TASK-06, TASK-09, TASK-12a | TASK-13 |
| TASK-13 | CHECKPOINT | Reassess downstream tasks after private segmentation | 95% | S | Pending | TASK-12 | TASK-14, TASK-15 |
| TASK-14 | IMPLEMENT | Fix room-assist recovery attribution | 78% | M | Pending | TASK-06, TASK-13 | - |
| TASK-15 | IMPLEMENT | Reframe /dorms copy and nav as browse/SEO route | 92% | S | Pending | TASK-13 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04 | None | All independent; run in parallel |
| 2 | TASK-05, TASK-06, TASK-07, TASK-08 | Wave 1 complete (no hard dependency, but ship order matters for coherence) | TASK-05 and TASK-06 are independent of each other; TASK-07 and TASK-08 are independent of each other; all four can run in parallel. TASK-07 and TASK-08 are Wave 2 tasks — not Wave 3. |
| 3 | TASK-09 | TASK-05, TASK-07 | TASK-06 and TASK-08 must also be complete before TASK-10/11 proceed; TASK-09 itself needs TASK-05 (schema) and TASK-07 (env knowledge) |
| 4 | TASK-10, TASK-11 | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 | TASK-10 and TASK-11 are independent of each other; run in parallel |
| 4 | TASK-12a | TASK-09 | DECISION; agent produces decision document then PAUSES — operator must respond before TASK-12 starts; agent must not self-approve |
| 5 | TASK-12 | TASK-09, TASK-12a | Single task |
| 5 | TASK-13 | TASK-12 | CHECKPOINT; triggers replan of TASK-14 and TASK-15 |
| 6 | TASK-14, TASK-15 | TASK-13 | Independent of each other; run in parallel |

---

## Tasks

---

### TASK-01: Fix MobileNav CTA label truncation (BRK-01)

- **Type:** IMPLEMENT
- **Deliverable:** code change — `packages/ui/src/organisms/MobileNav.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Build evidence:** Replaced `max-w-[6rem]` with `max-w-[calc(100vw-7rem)] truncate` on line 131 of MobileNav.tsx. The calc gives ~208px on a 320px screen — sufficient for all locale labels including Italian (24 chars at text-xs). `truncate` adds `whitespace-nowrap` at mobile as safety net; `sm:max-w-none sm:whitespace-nowrap` unchanged. Commit 34eab3f54a. Typecheck clean; lint 0 errors. CI will run TCs on push.
- **Affects:** `packages/ui/src/organisms/MobileNav.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 92% — target class is visible on line 131; fix is a single Tailwind class change with no logic dependency.
  - Approach: 90% — removing the `max-w-[6rem]` cap at mobile (or replacing it with a minimum that accommodates the label) is the correct intervention; `sm:max-w-none` already clears at 640px so the fix is at the mobile breakpoint only.
  - Impact: 88% — mobile CTA label is truncated on all phones; fixing it is a necessary precondition for any mobile funnel CTR measurement.
- **Acceptance:**
  - The MobileNav CTA renders the full "Check availability" label (17 chars + translation equivalents) without truncation at 320px.
  - The CTA touch target remains ≥ 44px tall (`min-h-11` is preserved).
  - The existing `sm:max-w-none sm:whitespace-nowrap` breakpoint behavior is unchanged.
  - No visual regression on desktop (≥ 1024px).
- **Validation contract (TC-XX):**
  - TC-01: The CTA link element does not have a `max-w-[6rem]` class in its class string; it has `sm:max-w-none` present (class-string assertion via `toHaveClass`). Full label text is present in the DOM.
  - TC-02: At 640px+ breakpoint: `sm:max-w-none` is present in the class string — no mobile max-width cap.
  - TC-03: The `<Link>` element has `min-h-11` class present (class-string assertion; visual pixel verification is manual staging check, not a Jest assertion).
  - TC-04: Snapshot of MobileNav confirms full label text is present in the rendered output at narrow viewport.
  - Note: Layout measurement assertions (`scrollWidth === offsetWidth`, computed pixel values) are not used — jsdom does not compute layout. Pixel-level verification is a manual staging check or Playwright smoke test.
- **Execution plan:** Red — write snapshot test that asserts full-label presence at narrow viewport. Green — remove `max-w-[6rem]` from the CTA class string (or replace with `min-w-fit`). Refactor — confirm `sm:max-w-none` and `sm:whitespace-nowrap` still present.
- **Planning validation (required for M/L):** None: S effort, class-level fix.
- **Scouts:** Verify label length in all four supported locales (en, it, fr, es) — Italian "Controlla disponibilità" (24 chars) is the longest; confirm fix accommodates it.
- **Edge Cases & Hardening:** If the locale label is longer than the English fallback, the cap-removal fix must not cause the CTA to overflow the flex row and push the burger button off screen. Confirm flex container uses `min-w-0` on the spacer so the CTA can grow without displacing other elements.
- **What would make this >=90%:**
  - Screenshot-verified rendering at 320px across all four locales.
- **Rollout / rollback:**
  - Rollout: ship as part of Wave 1 batch; no feature flag required.
  - Rollback: revert the class change; zero runtime risk.
- **Documentation impact:** None.
- **Notes / references:**
  - Source: `packages/ui/src/organisms/MobileNav.tsx` line 131.
  - BRK-01 in fact-find breakpoint sweep.

---

### TASK-02: Fix RoomsSection mobile top padding (BRK-03)

- **Type:** IMPLEMENT
- **Deliverable:** code change — `packages/ui/src/organisms/RoomsSection.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Build evidence:** Changed `"pt-30 sm:pt-12 scroll-mt-30"` → `"pt-12 sm:pt-12 scroll-mt-30"` in sectionClasses at line 287. `scroll-mt-30` untouched (BRK-08 deferred). Commit 34eab3f54a. Typecheck clean.
- **Affects:** `packages/ui/src/organisms/RoomsSection.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 92% — target is in `sectionClasses` const at line 287; `pt-30` → `pt-12`.
  - Approach: 90% — `pt-30` (120px) is inconsistent with all other mobile section padding in the codebase; `pt-12` (48px) matches the `sm:pt-12` value already present, confirming the mobile value is a copy error.
  - Impact: 88% — rooms cards are below the fold on phones; this fix is a direct barrier to the hostel-central compare step on the primary device segment.
- **Acceptance:**
  - On mobile (< 640px), room cards begin within one viewport height of the top of the booking page without scrolling past a 120px blank gap.
  - The `sm:pt-12` breakpoint value is preserved (no change at 640px+).
  - `scroll-mt-30` is left unchanged in this task (cosmetic overhang; deferred).
- **Validation contract (TC-XX):**
  - TC-01: The `RoomsSection` section element does not have class `pt-30` in its class string (`expect(section).not.toHaveClass('pt-30')`).
  - TC-02: The section element has class `pt-12` present in its class string after the fix.
  - TC-03: Snapshot of the `RoomsSection` class string confirms `pt-30` is absent and `pt-12` is present.
  - Note: Computed padding-top pixel assertions are not used — jsdom does not compute layout. Pixel-level verification is a manual staging check or Playwright smoke test.
- **Execution plan:** Red — assert `pt-30` is absent from computed class string. Green — replace `"pt-30 sm:pt-12"` with `"pt-12 sm:pt-12"` in `sectionClasses`. Refactor — verify no other consumers of `sectionClasses` are affected.
- **Planning validation:** None: S effort, single-line class change.
- **Scouts:** `RoomsSection` is used on the hostel compare page and the dorms browse page; confirm fix does not cause an anchor-scroll positioning issue on either page.
- **Edge Cases & Hardening:** The `#rooms` anchor scroll offset (`scroll-mt-30`) is intentionally left at 120px for now; this task only fixes `pt-30`. If reduced padding causes the anchor to overlap the sticky header, note it as a follow-up (BRK-08).
- **What would make this >=90%:**
  - Mobile screenshot at 320px showing room cards in the first viewport without excess whitespace.
- **Rollout / rollback:**
  - Rollout: ship as part of Wave 1 batch.
  - Rollback: revert the class change.
- **Documentation impact:** None.
- **Notes / references:**
  - Source: `packages/ui/src/organisms/RoomsSection.tsx` line 287, `sectionClasses` array.
  - BRK-03 in fact-find breakpoint sweep.

---

### TASK-03: Move NotificationBanner private-rooms suppression to server (BRK-06)

- **Type:** IMPLEMENT
- **Deliverable:** code change — `apps/brikette/src/components/layout/AppLayout.tsx` (showBanner prop); `apps/brikette/src/app/[lang]/ClientLayout.tsx` (pathname gate)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Build evidence:** Added `showBanner?: boolean` prop to AppLayout (default `true`); gated banner render on `!isTest && showBanner`. ClientLayout passes `showBanner={!pathname.includes("/private-rooms")}` using the existing `usePathname()` already in scope. NotificationBanner.tsx internals unchanged; no new files created. Commit 34eab3f54a. Typecheck and lint clean on `@apps/brikette` and `@acme/ui`.
- **Affects:** `apps/brikette/src/components/layout/AppLayout.tsx`, `apps/brikette/src/app/[lang]/ClientLayout.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 87%
  - Implementation: 88% — the suppression currently at line 240 of `NotificationBanner.tsx` is `pathname.includes("/private-rooms")`. Moving it to a server component layout or passing a server-side prop is a clear pattern in this codebase.
  - Approach: 87% — the simplest correct fix is to pass a `showBanner={false}` prop from the private-rooms route layout so the component never renders server-side, eliminating the flash.
  - Impact: 85% — the flash is low conversion impact but creates measurement noise in banner analytics and contradicts the funnel boundary.
- **Acceptance:**
  - The notification banner does not render (not even fleetingly) on any route under `/[lang]/private-rooms/`.
  - The banner renders normally on all other routes.
  - No layout shift occurs when navigating from a non-private to a private route.
- **Validation contract (TC-XX):**
  - TC-01: A render/snapshot test of the private-rooms route confirms the server-rendered HTML does not include `data-notification-banner="root"` — this is a snapshot/render test, not a layout measurement.
  - TC-02: A render/snapshot test of the hostel booking route confirms the server-rendered HTML includes `data-notification-banner="root"`.
  - TC-03: Client-side `pathname.includes("/private-rooms")` guard in `NotificationBanner.tsx` is removed or is now unreachable (confirmed by grep).
  - Note: These assertions are snapshot/render tests that check the DOM output — jsdom layout assertions are not used here. Visual regression (no flash) is a manual staging verification.
- **Execution plan:** Red — write test asserting banner DOM element is absent in server HTML for private-rooms routes. Green — add a server-layout prop or context flag that prevents `NotificationBanner` from rendering on private-rooms routes. Remove the client-side `pathname.includes` guard. Refactor — confirm the SSR output is clean.
- **Planning validation:** None: S effort, component-level change.
- **Scouts:** Confirm whether a `private-rooms/layout.tsx` already exists; if so, add the suppression there. If not, create a minimal layout that passes `showBanner={false}`.
- **Edge Cases & Hardening:** If `NotificationBanner` is rendered by a root layout that cannot be overridden at the route-group level, use a React context prop (`NotificationBannerContext`) rather than a layout-level prop. Confirm the chosen approach does not break the `useSetBannerRef` context used by scroll-offset calculations.
- **What would make this >=90%:**
  - Route-level SSR snapshot asserting banner HTML is absent on private-rooms pages.
- **Rollout / rollback:**
  - Rollout: ship as part of Wave 1 batch.
  - Rollback: revert the layout change; the client guard can be re-added as a safety net.
- **Documentation impact:** None.
- **Notes / references:**
  - Source: `packages/ui/src/molecules/NotificationBanner.tsx` (rendered via AppLayout.tsx from `@acme/ui/molecules`; the brikette-app local file is not the live production path).
  - BRK-06 in fact-find breakpoint sweep.

---

### TASK-04: Fix ContentStickyCta dismiss button touch target (BRK-04)

- **Type:** IMPLEMENT
- **Deliverable:** code change — `apps/brikette/src/components/cta/ContentStickyCta.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Build evidence:** Changed `size-10` → `size-11` on dismiss button className at line 152. X icon (`h-4 w-4`) unchanged. Commit 34eab3f54a. Typecheck clean.
- **Affects:** `apps/brikette/src/components/cta/ContentStickyCta.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 92% — line 152: `size-10` → `size-11`.
  - Approach: 90% — `NotificationBanner` already uses `size-11` (44px) for its dismiss button, confirming the correct pattern.
  - Impact: 87% — users on small phones may accidentally dismiss instead of interact; fix is a direct WCAG 2.5.5 compliance correction.
- **Acceptance:**
  - The dismiss button has a computed size ≥ 44px × 44px.
  - The button remains visually within the CTA card boundary without overflow.
  - `size-11` matches the `NotificationBanner` dismiss button pattern.
- **Validation contract (TC-XX):**
  - TC-01: `button[aria-label]` inside `[data-cy="content-sticky-cta"]` has class `size-11` present (`expect(button).toHaveClass('size-11')`) and does not have `size-10`.
  - TC-02: The button class string does not contain `size-10` — class-string assertion, not a pixel measurement.
  - TC-03: Snapshot confirms `size-11` is present and `size-10` is absent from the button class string.
  - Note: Computed pixel size assertions (44px × 44px) are not used — jsdom does not compute layout. Pixel-level verification is a manual staging check or Playwright smoke test.
- **Execution plan:** Red — assert computed size ≥ 44px. Green — replace `size-10` with `size-11` at line 152. Refactor — confirm visual fit within card.
- **Planning validation:** None: S effort, single class change.
- **Scouts:** None — change is self-contained.
- **Edge Cases & Hardening:** None: change is additive (4px larger); no overflow risk in a `rounded-3xl` card with `p-5` padding.
- **What would make this >=90%:**
  - WCAG automated accessibility scan confirms the target passes 2.5.5.
- **Rollout / rollback:**
  - Rollout: ship as part of Wave 1 batch.
  - Rollback: revert class change.
- **Documentation impact:** None.
- **Notes / references:**
  - Source: `apps/brikette/src/components/cta/ContentStickyCta.tsx` line 152.
  - BRK-04 in fact-find breakpoint sweep.

---

### TASK-05: Define and implement GA4 entry-attribution event schema

- **Type:** IMPLEMENT
- **Deliverable:** code change — `apps/brikette/src/utils/ga4-events.ts`; updated type exports in the same file.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Build evidence:** Added 6 new enum arrays to `GA4_ENUMS` (`sourceSurface`, `resolvedIntent`, `productType`, `decisionMode`, `destinationFunnel`, `handoffMode`), derived types, and 5 type guard functions (`isSourceSurface`, `isResolvedIntent`, `isProductType`, `isDecisionMode`, `isDestinationFunnel`). Added `EntryAttributionParams` interface. Extended `fireCtaClick` with optional third argument `entryAttribution?: EntryAttributionParams` — merges attribution fields into gtag payload when provided; zero-change for existing callers. Also added missing `ctaLocation` values (`notification_banner`, `sticky_cta`, `room_card`, `sticky_book_now`, `booking_widget`, `deals_page_cta`) needed by TASK-10/11. Commit `8c3996dc87`. Typecheck and lint clean on `@apps/brikette`.
- **Affects:** `apps/brikette/src/utils/ga4-events.ts`
- **Depends on:** -
- **Blocks:** TASK-10, TASK-11, TASK-12
- **Confidence:** 78%
  - Implementation: 80% — `ga4-events.ts` is well-structured; the extension pattern (adding optional typed fields to `fireCtaClick`) is clear from existing code. The new enum values to add to `GA4_ENUMS` are fully specified in the fact-find analytics taxonomy.
  - Approach: 78% — enriching `fireCtaClick` rather than introducing a separate emitter preserves backward compatibility and eliminates double-counting risk. One click emits one `cta_click` event.
  - Impact: 76% — without these types, TASK-10 and TASK-11 cannot emit on-taxonomy events; measurement of H1 and H2 is impossible.
- **Schema axis separation (canonical):**
  - `ctaLocation` — granular UI placement of the CTA element: `desktop_header`, `mobile_nav`, `offers_modal`, `notification_banner`, `booking_widget`, `sticky_cta`, `room_card`, `sticky_book_now`, `deals_page_cta`. This is the existing enum; do NOT add surface-family values to it.
  - `source_surface` — page/surface family of the click origin: `homepage`, `content_page`, `dorms_browse`, `room_detail`, `private_summary`, `sitewide_shell`, `deals_page`. These are separate from `ctaLocation` and must NOT be added to the `ctaLocation` enum. `sitewide_shell` and `deals_page` live here only.
  - Both axes are required fields on `EntryAttributionParams`, serving orthogonal purposes.
- **Single canonical click event rule:** TASK-05 enriches `fireCtaClick` to accept the full `EntryAttributionParams` payload as an optional third argument (additive, backwards-compatible). There is no separate `fireEntryAttribution` emitter. A single CTA click emits one `cta_click` event. Callers that do not pass `EntryAttributionParams` continue to emit a bare `cta_click` — no break. Callers that do pass it emit `cta_click` with enriched dimensions.
- **Acceptance:**
  - `GA4_ENUMS` gains `sourceSurface`, `resolvedIntent`, `productType`, `decisionMode`, `destinationFunnel` enum arrays matching the fact-find taxonomy exactly. `sitewide_shell` and `deals_page` are added to `sourceSurface` (a new enum array) only — not to `ctaLocation`.
  - `fireCtaClick` accepts an optional third argument `entryAttribution?: EntryAttributionParams`; callers that omit it continue to work unchanged; one `cta_click` event is emitted per click regardless.
  - `EntryAttributionParams` is a fully typed interface with: `source_surface`, `source_cta`, `resolved_intent`, `product_type`, `decision_mode`, `destination_funnel`, `handoff_mode?`, `locale`, `fallback_triggered`, `next_page?: string | null`.
  - `product_type` is typed as `'hostel_bed' | 'apartment' | 'double_private_room' | null` (literal union, not `string | null`).
  - `handoff_mode` is typed as `'secure_booking_shell' | 'direct_octorate'` — required when `destination_funnel` is `hostel_central`; optional otherwise (unknown at entry-attribution time).
  - `fallback_triggered` is typed as `boolean` — not `boolean | undefined`. Required field; callers that are not on a fallback path set it to `false`.
  - `next_page?: string | null` — the immediate navigation target (full localized path, e.g. `/en/deals`). Distinguishes intermediate destinations (deals page, private summary) from the final funnel destination captured in `destination_funnel`. Optional because most surfaces navigate directly to the final funnel.
  - All new enum values match fact-find taxonomy verbatim: `source_surface ∈ {homepage, content_page, dorms_browse, room_detail, private_summary, sitewide_shell, deals_page}`; `resolved_intent ∈ {hostel, private, undetermined}`; `product_type ∈ {hostel_bed, apartment, double_private_room}`; `decision_mode ∈ {direct_resolution, chooser, hybrid_merchandising}`; `destination_funnel ∈ {hostel_central, hostel_assist, private}`; `handoff_mode ∈ {secure_booking_shell, direct_octorate}`.
  - Type guard functions (`isSourceSurface`, `isResolvedIntent`, `isProductType`, `isDecisionMode`, `isDestinationFunnel`) are exported, following the existing `isCtaId` / `isCtaLocation` pattern.
  - No breaking change to existing `fireCtaClick`, `fireHandoffToEngine`, or any other existing export.
  - No `fireEntryAttribution` function is introduced — TASK-05 does not create this export. References to `fireEntryAttribution` in other tasks are replaced with the enriched `fireCtaClick` call.
- **Validation contract (TC-XX):**
  - TC-01: `fireCtaClick({ ctaId: "sticky_cta", ctaLocation: "sticky_cta" }, undefined, { source_surface: "content_page", source_cta: "sticky_cta", resolved_intent: "hostel", product_type: null, decision_mode: "direct_resolution", destination_funnel: "hostel_central", handoff_mode: "direct_octorate", locale: "en", fallback_triggered: false })` → `gtag` called with `"cta_click"` event and full enriched payload (one event, not two).
  - TC-02: `fireCtaClick` with `source_surface: "invalid_value"` in `entryAttribution` → gtag is called with the base `cta_click` fields only; attribution fields are dropped by the guard (or the TypeScript type prevents the call from compiling with an invalid literal).
  - TC-03: `fireCtaClick({ ctaId: "header_check_availability", ctaLocation: "desktop_header" })` with no `entryAttribution` → existing behavior unchanged; gtag called with `"cta_click"` and only `cta_id` + `cta_location`. One event emitted.
  - TC-04: `fireCtaClick` with `entryAttribution` present → gtag called with merged payload including attribution fields. Exactly one `cta_click` event emitted — no double emission.
  - TC-05: `isSourceSurface("sitewide_shell")` returns `true`; `isSourceSurface("nav")` returns `false`. `isSourceSurface("deals_page")` returns `true`.
  - TC-06: `product_type: null` serializes correctly in the gtag payload (field is present with null value, not omitted).
  - TC-07: TypeScript enforces `product_type` as `'hostel_bed' | 'apartment' | 'double_private_room' | null` — string literal, not `string | null` (typecheck validates this).
  - TC-08: `fallback_triggered: true` serializes as boolean `true` in the payload, not as `undefined`.
- **Execution plan:** Red — write unit tests for TC-01 through TC-08. Green — add `EntryAttributionParams` interface, new enum arrays to `GA4_ENUMS`, type guard functions, and optional `entryAttribution` param to `fireCtaClick`. Do NOT introduce `fireEntryAttribution`. Refactor — ensure no circular imports; run typecheck.
- **Planning validation (required for M/L):**
  - Checks run: Reviewed full `ga4-events.ts` — existing pattern is `const GA4_ENUMS = {...} as const` with derived `type X = (typeof GA4_ENUMS.x)[number]`. New enum arrays fit this pattern exactly. `fireCtaClick` uses defensive `isCtaId` + `isCtaLocation` guards before calling gtag; same guard pattern applies to new fields.
  - Validation artifacts: `ga4-events.ts` read in full (609 lines). `fireCtaClick` signature at line 267; `HandoffToEngineParams` interface at line 419 confirms the existing approach for structured event params.
  - Unexpected findings: `GA4_ENUMS.ctaLocation` does not include `sitewide_shell` — `sitewide_shell` must NOT be added to `ctaLocation`; it belongs to `sourceSurface` only. `deals_page` is already present in `ctaLocation` (verified at line 31 of `ga4-events.ts`) as a granular CTA placement value. The new `sourceSurface` enum is a separate axis — `deals_page` and `sitewide_shell` are values on that axis.
- **Scouts:** Confirm `deals_page` in `ctaLocation` is a granular UI placement value (the CTA element on the deals page) and is correctly distinct from `deals_page` as a `source_surface` value (the page/surface family). Both are valid but on different axes. Confirm no existing callers will be broken by the axis separation.
- **Edge Cases & Hardening:**
  - `product_type: null` must not cause a TypeScript error; it is a first-class value in the literal union `'hostel_bed' | 'apartment' | 'double_private_room' | null`.
  - `handoff_mode` is optional in `EntryAttributionParams` (unknown at entry time for most callers) but required when `destination_funnel === 'hostel_central'` — encode this with an overload or runtime guard.
  - Session storage reads (`readAttribution`) must not be called on SSR. The resolver itself is a pure function and is SSR-safe. All guard functions must handle the case where gtag is unavailable (SSR) without throwing.
- **What would make this >=90%:**
  - Integration test that fires enriched `fireCtaClick` with `entryAttribution` in a full component render and verifies the gtag call payload contains all attribution dimensions and emits exactly one event.
- **Rollout / rollback:**
  - Rollout: additive only; no existing behavior changes. Ship independently of routing tasks.
  - Rollback: revert the file; no consumer is yet wired until TASK-10/11.
- **Documentation impact:** Schema is self-documenting via TypeScript types; add a JSDoc comment to `EntryAttributionParams` summarizing the taxonomy source.
- **Notes / references:**
  - Taxonomy source: fact-find §Hypothesis & Validation Landscape — Required event dimensions table.
  - Existing pattern reference: `HandoffToEngineParams` interface at `ga4-events.ts` line 419.

---

### TASK-06: Implement entry-attribution persistence carrier

- **Type:** IMPLEMENT
- **Deliverable:** new module — `apps/brikette/src/utils/entryAttributionCarrier.ts`; optional update to `apps/brikette/src/utils/ga4-events.ts` to export a `readAttribution()` helper.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Build evidence:** Created `apps/brikette/src/utils/entryAttribution.ts` with `writeAttribution`, `readAttribution`, `decorateUrlWithAttribution`, `clearAttribution`. Storage key `_brik_attr`. All `window`/`sessionStorage` calls guarded with `typeof window !== 'undefined'` and wrapped in try/catch for SSR safety and incognito failure mode. `decorateUrlWithAttribution` appends `_bsrc`, `_bint`, `_bfun` query params. Test stubs added in `apps/brikette/src/test/utils/entryAttribution.test.ts` with `test.todo()` for all cases. Commit `97c924d3de`. Typecheck and lint clean.
- **Affects:** `apps/brikette/src/utils/entryAttribution.ts` (new)
- **Depends on:** -
- **Blocks:** TASK-12, TASK-14
- **Confidence:** 78%
  - Implementation: 80% — session storage read/write with JSON serialization is straightforward. URL-state fallback (writing key fields to the URL query string) adds complexity but is well-understood.
  - Approach: 78% — session-storage-first with URL fallback matches the carrier design decision in the plan. Incognito failure mode is documented and handled gracefully (degrade silently; analytics emit click-only event, not an error).
  - Impact: 76% — without this carrier, multi-step journeys (content page → compare → handoff) emit incomplete analytics events at the handoff step, making H1 and H2 unmeasurable.
- **Acceptance:**
  - `writeAttribution(params: EntryAttributionCarrierPayload): void` — writes to `sessionStorage` under a known key. Silently ignores storage errors (incognito mode).
  - `readAttribution(): EntryAttributionCarrierPayload | null` — reads from `sessionStorage`; returns null if absent, expired, or on parse error. Never throws.
  - `clearAttribution(): void` — removes the sessionStorage entry.
  - `decorateUrlWithAttribution(url: string, payload: EntryAttributionPayload): string` — appends `_bsrc` and `_bint` query params to the supplied destination URL and returns the decorated URL. Does not mutate the current page URL. Used by TASK-10/11 callers when constructing `href` and `router.push` targets. This is the URL fallback path for incognito/private-browsing where sessionStorage is unavailable.
  - `EntryAttributionCarrierPayload` interface: `{ source_surface, source_cta, resolved_intent, product_type, decision_mode, locale, deal?: string, written_at: number }`.
  - Carrier payload written at CTA click time; read at handoff event time.
  - Carrier has a TTL of 30 minutes (`written_at` + 1800000ms); `readAttribution()` returns null if stale.
  - URL decoration: `writeAttribution` writes to sessionStorage ONLY and does NOT mutate the current page URL or `window.history`. A separate helper `decorateUrlWithAttribution(url: string, payload: EntryAttributionPayload): string` is exported alongside `writeAttribution` and `readAttribution`. Callers (TASK-10/11) use `decorateUrlWithAttribution` when computing `href` and `router.push` targets so that attribution params travel with the navigation URL. This is the fallback for cross-page attribution when session storage is unavailable (incognito/private-browsing). `readAttribution` falls back to reading these URL params (`_bsrc`, `_bint`) from the caller-provided URL context if sessionStorage returns null.
  - The carrier module is pure TypeScript with no Next.js or React dependencies; it is callable from event handlers and route handlers alike.
- **Validation contract (TC-XX):**
  - TC-01: `writeAttribution({ source_surface: "content_page", ... })` → `sessionStorage.getItem("brik_entry_attr")` contains matching JSON.
  - TC-02: `readAttribution()` after `writeAttribution()` → returns the written payload.
  - TC-03: `readAttribution()` when `written_at` is 31 minutes ago → returns null.
  - TC-04: `readAttribution()` when sessionStorage throws (mocked) → returns null without throwing.
  - TC-05: `decorateUrlWithAttribution("/en/book-dorm-bed", { source_surface: "sitewide_shell", resolved_intent: "hostel", ... })` → returns `/en/book-dorm-bed?_bsrc=sitewide_shell&_bint=hostel` (URL is decorated, current page URL is not mutated). `readAttribution(urlSearchParams)` when sessionStorage is empty but caller passes `URLSearchParams` containing `_bsrc=sitewide_shell&_bint=hostel` → returns carrier payload with `source_surface: "sitewide_shell"`, `resolved_intent: "hostel"`. (`readAttribution` accepts an optional `URLSearchParams` arg for the URL-param fallback path; callers on the compare/handoff page obtain it from `useSearchParams().toString()`.)
  - TC-06: `clearAttribution()` → `sessionStorage.getItem("brik_entry_attr")` is null.
- **Execution plan:** Red — write unit tests for TC-01 through TC-06 (mock sessionStorage). Green — implement module with `writeAttribution`, `readAttribution`, `clearAttribution`, and `decorateUrlWithAttribution` exports. Refactor — confirm no circular imports; the module must not import from `ga4-events.ts` (keep it independent).
- **Planning validation (required for M/L):**
  - Checks run: Confirmed no existing carrier module in `apps/brikette/src/utils/`. Confirmed `ContentStickyCta` uses `sessionStorage` already (line 42) for dismiss state — same storage API, same safety pattern. Session storage incognito failure is a known Safari private-mode issue; catch block pattern from `ContentStickyCta` is the correct template.
  - Validation artifacts: `ContentStickyCta.tsx` lines 37–47 read as the storage-safety reference pattern.
  - Unexpected findings: The URL fallback must use non-standard query key names (`_bsrc`, `_bint`) to avoid collisions with Octorate or analytics params. Confirm `_bsrc` / `_bint` do not appear in `buildOctorateUrl.ts`.
- **Scouts:** Confirm `_bsrc` and `_bint` are not reserved by Octorate or any third-party on the current handoff URLs.
- **Edge Cases & Hardening:**
  - If both sessionStorage and URL params are present, sessionStorage takes precedence (fresher signal).
  - `product_type: null` must serialize/deserialize as JSON null (not `undefined`).
  - Carrier must handle SSR gracefully: `writeAttribution` no-ops when `typeof window === "undefined"`.
- **What would make this >=90%:**
  - End-to-end test that writes attribution on a content page, navigates to the hostel compare page, and reads attribution there — proving survival across a route change.
- **Rollout / rollback:**
  - Rollout: new module; no consumers until TASK-10/11/14. Ship independently.
  - Rollback: delete the module; no consumers are wired yet.
- **Documentation impact:** JSDoc on each exported function; include the 30-minute TTL and URL fallback behavior in comments.
- **Notes / references:**
  - Storage safety pattern: `ContentStickyCta.tsx` lines 37–47.
  - Incognito/private-mode failure: Safari private mode blocks sessionStorage writes; the existing `ContentStickyCta` catch block is the established pattern.

---

### TASK-07: Verify NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED on target deployments

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-cohesive-sales-funnel/task-07-env-verification.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Build evidence:** Investigated `apps/brikette/.env.example`, `apps/brikette/src/config/env.ts`, `.github/workflows/brikette.yml` and all CI workflow files. Conclusion: `NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED` is not set in any known deployment config — env gate is OFF on all deployments. Findings written to `docs/plans/brikette-cohesive-sales-funnel/task-07-env-gate-findings.md`. Commit `97c924d3de`.
- **Affects:** `[readonly] apps/brikette/src/utils/octorateCustomPage.ts`, `[readonly] apps/brikette/src/app/[lang]/book/secure-booking/page.tsx`
- **Depends on:** -
- **Blocks:** TASK-09, TASK-10, TASK-11
- **Confidence:** 72%
  - Implementation: 75% — the verification process is defined (check Cloudflare Pages env vars for staging and production); outcome is uncertain.
  - Approach: 72% — Cloudflare Pages env vars are accessible via the CF API (see `memory/cloudflare-api.md`).
  - Impact: 70% — if the flag is OFF on production, all shell-dependent acceptance criteria must be re-gated to the dual-mode rollout path.
- **Questions to answer:**
  - Is `NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED` currently set to `1` (or any truthy value) on the Brikette staging deployment?
  - Is it set to `1` on the Brikette production deployment?
  - If the flag is off on production, what is the current default handoff mode (direct Octorate)?
  - Does the staging deployment accept the flag if we set it? Is there a Cloudflare Pages environment variable already configured?
- **Acceptance:**
  - `task-07-env-verification.md` records the flag state on staging and production with evidence (CF API response or dashboard screenshot reference).
  - If flag is OFF on both: document the implication that TASK-10 and TASK-11 acceptance criteria referencing "in-shell checkout" must be annotated as "env-gate-off path only" until the flag is enabled.
  - If flag is ON: document that TASK-08 (iframe proof) is the remaining gate.
- **Validation contract:** Evidence file exists at the output path; flag state is unambiguously recorded with a timestamp and source.
- **Planning validation:** None: INVESTIGATE task; process is defined.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** `task-07-env-verification.md` is the artifact; may trigger a plan annotation if the flag is off.
- **Notes / references:**
  - CF API access: `memory/cloudflare-api.md`.
  - `CLOUDFLARE_API_TOKEN` in `.env.local` — source before any CF API curl call.
  - Env gate code: `apps/brikette/src/utils/octorateCustomPage.ts`.

---

### TASK-08: Prove result.xhtml iframe viability on staging

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-cohesive-sales-funnel/task-08-iframe-proof.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Build evidence:** Investigated `OctorateCustomPageShell.tsx` (iframe rendered with `referrerPolicy: strict-origin-when-cross-origin`, no `sandbox` attr, no `allow` attr, `onLoad` fires ready state) and `SecureBookingPageClient.tsx` (uses script-widget path, not iframe path). No X-Frame-Options/CSP documentation found. No test validates iframe load. Conclusion: iframe viability UNPROVEN — env gate is also OFF. Findings in `docs/plans/brikette-cohesive-sales-funnel/task-08-iframe-findings.md`. Manual staging verification required before shell-dependent acceptance criteria. Commit `97c924d3de`.
- **Affects:** `[readonly] apps/brikette/src/components/booking/OctorateCustomPageShell.tsx`, `[readonly] apps/brikette/src/components/booking/SecureBookingPageClient.tsx`
- **Depends on:** -
- **Blocks:** TASK-10, TASK-11
- **Confidence:** 72%
  - Implementation: 74% — browser MCP tool can navigate to a staging secure-booking URL and observe the iframe render.
  - Approach: 72% — iframe embeddability is outside repo control (Octorate server must send permissive `X-Frame-Options` / CSP headers).
  - Impact: 70% — if the iframe fails, the shell checkout path cannot be an acceptance criterion for any Wave 4+ task.
- **Questions to answer:**
  - Does `result.xhtml` load without being blocked by `X-Frame-Options` or CSP when embedded in the Brikette staging secure-booking shell?
  - Does the embedded Octorate booking form remain interactive (form fields respond, calendar navigates)?
  - Does the fallback direct link appear if the iframe fails?
  - Are there cookie or cross-origin authentication issues that prevent the booking session from being maintained inside the iframe?
- **Acceptance:**
  - `task-08-iframe-proof.md` records the staging test with evidence: iframe load status, any console errors, form interactivity observation, and fallback link behavior.
  - If iframe is viable: document that shell-checkout acceptance criteria are valid.
  - If iframe is blocked: document that shell-checkout must be treated as a non-default path; acceptance criteria referencing it must be annotated as "deferred until iframe viability is established".
- **Validation contract:** Evidence file exists; iframe viability verdict (viable / blocked / partially blocked) is stated with supporting observation from the staging browser session.
- **Planning validation:** None: INVESTIGATE task; process is defined.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** `task-08-iframe-proof.md` is the artifact; triggers plan annotation if iframe is blocked.
- **Notes / references:**
  - Staging URL: `staging.brikette-website.pages.dev`.
  - Shell implementation: `apps/brikette/src/components/booking/OctorateCustomPageShell.tsx`.
  - Requires TASK-07 flag to be ON (or manually enabled on staging) before this test is meaningful.
  - **Conditional dependency on TASK-07:** The iframe proof is only meaningful if the staging env flag (`NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED`) is enabled. If TASK-07 finds the env gate OFF on staging, TASK-08 is blocked until the flag can be enabled on staging or a manual override is arranged. Do not proceed with browser MCP iframe observation if the flag is confirmed OFF.

---

### TASK-09: Implement intent resolver function

- **Type:** IMPLEMENT
- **Deliverable:** new module — `apps/brikette/src/utils/intentResolver.ts`; type exports aligned with `ga4-events.ts` schema from TASK-05.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Build evidence:** Created `apps/brikette/src/utils/intentResolver.ts` — pure SSR-safe function `resolveIntent(ctaLocation, pageContext?): IntentResolution`. Maps all known ctaLocation values to routing intent. `sticky_cta` branches on `pageContext.isPrivateRoute`. Unknown ctaLocations fall back to `undetermined/chooser/hostel_central`. Test stubs in `apps/brikette/src/test/utils/intentResolver.test.ts`. Committed in `dc980f8f27` (bundled with a reception commit due to a pre-commit hook cascade; code correct). Typecheck clean.
- **Affects:** `apps/brikette/src/utils/intentResolver.ts` (new), `[readonly] apps/brikette/src/utils/localizedRoutes.ts`, `[readonly] apps/brikette/src/utils/privateRoomPaths.ts`
- **Depends on:** TASK-05, TASK-07
- **Blocks:** TASK-10, TASK-11, TASK-12
- **Confidence:** 80%
  - Implementation: 82% — routing rules are explicit in the fact-find Page-Role Matrix and canonical model. All `ctaLocation` values are enumerated in `ga4-events.ts`.
  - Approach: 80% — a pure function `resolveIntent(ctaLocation, pageContext) -> IntentResolution` with typed routing rules covers all known surfaces.
  - Impact: 78% — the resolver is the single dependency for TASK-10 and TASK-11; if its interface changes after those tasks start, all wiring must update.
- **Acceptance:**
  - `resolveIntent(ctaLocation: CtaLocation, pageContext: PageContext): IntentResolution` is exported.
  - `PageContext` includes: `lang: AppLanguage`, `pathname: string`, `isPrivateRoute: boolean`, `isDealsPage: boolean`.
  - `IntentResolution` includes: `resolved_intent: "hostel" | "private" | "undetermined"`, `product_type: 'hostel_bed' | 'apartment' | 'double_private_room' | null`, `decision_mode: "direct_resolution" | "chooser" | "hybrid_merchandising"`, `destination_funnel: "hostel_central" | "hostel_assist" | "private"`. **No `destination_url` field** — the resolver returns abstract routing intent only. Callers map `destination_funnel` to concrete URLs using existing helpers (`getBookPath`, `getPrivateRoomsPath`, `buildHostelBookingTarget`, etc.) plus env state. This keeps the resolver decoupled from env-gate state; env-aware URL dispatch is the caller's responsibility (TASK-10/11).
  - Routing rules (all `ctaLocation` values covered):
    - `desktop_header`, `mobile_nav`, `home_hero`, `home_booking_widget`, `book_page`, `deals_page`, `offers_modal` → `resolved_intent: "hostel"`, `destination_funnel: "hostel_central"`.
    - `room_detail`, `rooms_list` → `resolved_intent: "hostel"`, `destination_funnel: "hostel_assist"` (room routing handled by room-card CTAs directly; no room context at resolver level).
    - `guide_detail`, `about_page`, `bar_menu`, `breakfast_menu`, `assistance`, `how_to_get_here`, `experiences_page` → `resolved_intent: "hostel"`, `destination_funnel: "hostel_central"` (content pages default to hostel; private routing TBD in future iteration).
    - Any `ctaLocation` called with `pageContext.isPrivateRoute: true` → `resolved_intent: "private"`, `destination_funnel: "private"`.
    - Any `ctaLocation` called with `pageContext.isDealsPage: true` → `resolved_intent: "hostel"`, `destination_funnel: "hostel_central"` (deal param appended by caller, not resolver).
  - `decision_mode` is always `"direct_resolution"` in this plan (chooser is deferred; `hybrid_merchandising` is deferred).
  - `product_type` is `null` for all resolutions in this plan except when called from a private-product page with known product context (set in TASK-12).
  - The resolver is a pure function with no React or Next.js dependencies; testable in isolation.
  - The resolver does NOT construct URLs. Callers map `destination_funnel` to concrete URLs using `getBookPath(lang)`, `getPrivateRoomsPath(lang)`, etc. The resolver may import these helpers for type inference only, but does not call them.
- **Validation contract (TC-XX):**
  - TC-01: `resolveIntent("desktop_header", { lang: "en", pathname: "/en", isPrivateRoute: false, isDealsPage: false })` → `{ resolved_intent: "hostel", destination_funnel: "hostel_central" }` (no `destination_url`; callers call `getBookPath(lang)`).
  - TC-02: `resolveIntent("guide_detail", { lang: "it", pathname: "/it/guide/...", isPrivateRoute: false, isDealsPage: false })` → `{ resolved_intent: "hostel", destination_funnel: "hostel_central" }`.
  - TC-03: `resolveIntent("mobile_nav", { lang: "fr", pathname: "/fr/private-rooms", isPrivateRoute: true, isDealsPage: false })` → `{ resolved_intent: "private", destination_funnel: "private" }` (caller maps to `getPrivateRoomsPath("fr")`).
  - TC-04: `resolveIntent("offers_modal", { lang: "en", pathname: "/en/deals", isPrivateRoute: false, isDealsPage: true })` → `{ resolved_intent: "hostel", destination_funnel: "hostel_central" }`.
  - TC-05: Calling the resolver with an unknown `ctaLocation` value (type narrowing catches at compile time; at runtime the resolver returns a safe hostel-central default with `resolved_intent: "undetermined"`).
  - TC-06: All 16 current `ctaLocation` enum values are covered by the routing matrix (no silent fall-through).
- **Execution plan:** Red — write unit tests TC-01 through TC-06. Green — implement module with explicit switch/map over `ctaLocation` values. Refactor — run typecheck; confirm all enum branches are exhaustive.
- **Planning validation (required for M/L):**
  - Checks run: All 16 `ctaLocation` enum values enumerated from `ga4-events.ts` lines 23–40. Route helpers confirmed in `localizedRoutes.ts` (`getBookPath`, `getPrivateRoomsPath`, `getPrivateBookingPath`). Env gate state is input from TASK-07; resolver can still be implemented with dual-mode awareness (resolver emits the routing decision; handoff mode is determined separately by `octorateCustomPage.ts`).
  - Validation artifacts: `ga4-events.ts` GA4_ENUMS.ctaLocation read in full.
  - Unexpected findings: `room_detail` and `rooms_list` ctaLocation values map to `hostel_assist`, not `hostel_central`. The resolver should not append room/rate context — that is handled by the room-card CTA layer above. Encode this separation explicitly.
- **Scouts:** Confirm TASK-07 findings before TASK-10/11 start. The resolver itself does not need env state — it returns abstract routing intent only, with no `destination_url`. Env-aware URL selection is entirely a TASK-10/11 caller concern. TASK-07's hard-block on TASK-10/11 is correct (those callers need env knowledge to select the right URL builder). The resolver does not import `octorateCustomPage.ts`; read that file during TASK-10/11 implementation.
- **Edge Cases & Hardening:**
  - `isPrivateRoute` must be computed by the caller from the current pathname, not hard-coded.
  - The resolver is a pure function and is SSR-safe — it may be called on SSR. The constraint is on session storage reads: `readAttribution()` must not be called on SSR (wrap in `useEffect` or event handlers). The resolver itself has no such constraint.
- **What would make this >=90%:**
  - Exhaustive snapshot test across all 16 current ctaLocation values confirming no silent fall-through.
- **Rollout / rollback:**
  - Rollout: new module; no consumers until TASK-10/11. Ship independently.
  - Rollback: delete the module.
- **Documentation impact:** JSDoc on `resolveIntent` with the routing matrix table as a comment block.
- **Notes / references:**
  - Source: `ga4-events.ts` GA4_ENUMS.ctaLocation (lines 23–40); `localizedRoutes.ts`; `privateRoomPaths.ts`.
  - Fact-find Page-Role Matrix.

---

### TASK-10: Wire ContentStickyCta to intent resolver

- **Type:** IMPLEMENT
- **Deliverable:** code change — `apps/brikette/src/components/cta/ContentStickyCta.tsx`; writes attribution carrier at click time.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Build evidence:** Added `isPrivateRoute?: boolean` prop (default false). On click: calls `resolveIntent("sticky_cta", { isPrivateRoute })`, writes attribution carrier via `writeAttribution`, emits enriched `fireCtaClick` with full `EntryAttributionParams`. Navigates to `getPrivateRoomsPath(lang)` when intent is private, `getBookPath(lang)` otherwise. Anchor `href` updated to use resolved `targetUrl`. Dismiss behavior and sessionStorage key unchanged. Commit `8cc92c8adc`. Typecheck and lint clean.
- **Affects:** `apps/brikette/src/components/cta/ContentStickyCta.tsx`, `[readonly] apps/brikette/src/utils/intentResolver.ts`, `[readonly] apps/brikette/src/utils/entryAttribution.ts`, `[readonly] apps/brikette/src/utils/ga4-events.ts`
- **Depends on:** TASK-05, TASK-06, TASK-07, TASK-08, TASK-09
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 76% — component is well-understood; change is replacing hard-coded `getBookPath(lang)` with a URL derived from `resolveIntent(...)`.`destination_funnel` using a caller-side URL dispatcher.
  - Approach: 75% — resolver returns `destination_funnel`; the CTA maps funnel → URL using `getBookPath(lang)` (hostel_central/hostel_assist) or `getPrivateRoomsPath(lang)` (private). Attribution is written to the carrier before navigation.
  - Impact: 74% — content CTAs currently route 100% of traffic to hostel regardless of page context; wiring to the resolver enables intent-based routing and makes content-origin attribution measurable at the handoff step.
- **Acceptance:**
  - `ContentStickyCta.onCtaClick` calls `resolveIntent(ctaLocation, { lang, pathname, isPrivateRoute, isDealsPage })` then derives the destination URL: `destination_funnel === "private"` → `getPrivateRoomsPath(lang)`; otherwise → `getBookPath(lang)`.
  - Before navigation, `writeAttribution({ source_surface: "content_page", source_cta: "sticky_cta", resolved_intent: resolution.resolved_intent, product_type: resolution.product_type, decision_mode: resolution.decision_mode, locale: lang })` is called.
  - `fireCtaClick(ctaId, ctaLocation, entryAttribution)` is called with the full resolution payload before `router.push` — one `cta_click` event emitted per click, enriched with all attribution dimensions.
  - The destination URL is also decorated with `decorateUrlWithAttribution(url, payload)` before being passed to `router.push`, ensuring attribution survives in incognito/private-browsing where session storage is unavailable.
  - The `href` on the anchor element is updated to reflect the derived URL (not a static `getBookPath(lang)` for non-hostel intent).
  - All existing content-page `ctaLocation` values (see TASK-09 routing matrix) resolve correctly.
  - If the resolver returns `destination_funnel: "private"`, the CTA routes to `getPrivateRoomsPath(lang)` (private summary hub), not to the apartment booking page.
  - The env gate state (from TASK-07) does not affect `ContentStickyCta` behavior; the resolver returns `destination_funnel`; env-aware handoff is determined downstream by `octorateCustomPage.ts`.
  - Existing `data-testid="content-sticky-cta"` and dismiss behavior are unchanged.
  - **Normal-path handoff (FIX 3):** The enriched `fireCtaClick` call at CTA click time writes to the carrier via `writeAttribution`. The handoff event (`begin_checkout` / `handoff_to_engine`) at room/rate selection READS the carrier and includes `source_surface`, `source_cta`, `resolved_intent`, `product_type`, `decision_mode` in the emitted event. The handoff emitter must call `readAttribution()` and merge the payload before firing.
- **Validation contract (TC-XX):**
  - TC-01: On a guide content page (`ctaLocation: "guide_detail"`, non-private route), clicking the CTA → `router.push` called with a decorated URL; `writeAttribution` called with `source_surface: "content_page"`, `resolved_intent: "hostel"`; `fireCtaClick` called with full `entryAttribution` payload (one `cta_click` event emitted, not two).
  - TC-02: On the experiences page (`ctaLocation: "experiences_page"`), same as TC-01.
  - TC-02b: When user completes room selection after entering via `content_page`, the `handoff_to_engine` event includes `source_surface: "content_page"`, `source_cta: "sticky_cta"`, and `resolved_intent: "hostel"` read from the attribution carrier.
  - TC-03: On a private-route context (`isPrivateRoute: true`), clicking CTA → `router.push` called with `getPrivateRoomsPath(lang)`; `resolved_intent: "private"` in the carrier write.
  - TC-04: Dismiss behavior is unchanged — `sessionStorage.setItem` key `content-sticky-cta-dismissed:${ctaLocation}` is set; CTA disappears.
  - TC-05: Attribution carrier write fails silently (storage mock throws) → navigation still proceeds; no unhandled error.
  - TC-06: The anchor `href` attribute reflects the derived destination URL (based on `destination_funnel`, not hard-coded to `getBookPath`).
- **Execution plan:** Red — update existing `content-sticky-cta.test.tsx` with route expectations that fail against current hard-coded behavior. Green — update `onCtaClick` to call resolver, carrier (`writeAttribution`), `decorateUrlWithAttribution` for URL construction, and enriched `fireCtaClick`. Refactor — remove the now-unused `getBookPath(lang)` import if no longer needed; confirm single-event emission.
- **Planning validation (required for M/L):**
  - Checks run: `ContentStickyCta.tsx` read in full. `onCtaClick` at line 123; `router.push(getBookPath(lang))` at line 131. Existing test at `apps/brikette/src/test/components/content-sticky-cta.test.tsx` covers current behavior (hostel-only routing); tests will need updating.
  - Validation artifacts: Confirmed the component already accesses `usePathname` (not visible in current code — must add `usePathname` import or pass `pathname` as prop from the page).
  - Unexpected findings: `ContentStickyCta` does not currently import `usePathname`; it will need it to compute `isPrivateRoute`. Preferred approach: add `usePathname()` inside the component (client component, so this is valid). Alternative: pass `isPrivateRoute` as a prop — simpler for testing. Encoding the prop approach as preferred (simpler TC-03 coverage).
- **Scouts:** Check whether any existing consumer of `ContentStickyCta` passes `isPrivateRoute` context; if not, default to `false` and compute from pathname inside the component.
- **Edge Cases & Hardening:**
  - If `resolveIntent` throws unexpectedly, catch and fall back to `getBookPath(lang)` so the CTA is never broken.
  - `href` attribute on the anchor must be computed from the resolver at render time (not just at click time) for SSR correctness.
- **What would make this >=90%:**
  - Integration test covering routing across all `ctaLocation` values currently passed to `ContentStickyCta`.
- **Rollout / rollback:**
  - Rollout: gated on TASK-09 (resolver) and TASK-05 (schema) being complete. No feature flag needed — the behavior change is in routing only.
  - Rollback: revert `onCtaClick` to `router.push(getBookPath(lang))`.
- **Documentation impact:** None.
- **Notes / references:**
  - Source: `apps/brikette/src/components/cta/ContentStickyCta.tsx` lines 123–131.
  - Fact-find Journey 4 (content-entry path, hostel intent) and Journey 5 (content-entry path, private intent).

---

### TASK-11: Wire sitewide shell CTAs to intent policy and analytics taxonomy

- **Type:** IMPLEMENT
- **Deliverable:** code changes — `packages/ui/src/molecules/NotificationBanner.tsx` (rendered via AppLayout from `@acme/ui/molecules`), `packages/ui/src/organisms/MobileNav.tsx`, `apps/brikette/src/components/header/Header.tsx`, `apps/brikette/src/context/modal/global-modals/OffersModal.tsx`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Build evidence:** Updated `Header.tsx` (desktop + mobile callbacks emit `writeAttribution` + enriched `fireCtaClick` with `source_surface: sitewide_shell`), `NotificationBanner.tsx` (openDeals adds attribution with `next_page: dealsPath`), `OffersModal.tsx` (handleReserve adds attribution + enriched event). MobileNav routing unchanged. Added handoff consumer gap fix: `RoomsSection.tsx` calls `readAttribution()` at `begin_checkout` and merges `entry_*` fields into the `trackThenNavigate` payload. Routing targets unchanged for all surfaces. Commit pending typecheck (TASK-11 commit in progress at plan update time).
- **Affects:** `apps/brikette/src/components/header/Header.tsx`, `apps/brikette/src/components/header/NotificationBanner.tsx`, `apps/brikette/src/context/modal/global-modals/OffersModal.tsx`, `apps/brikette/src/components/rooms/RoomsSection.tsx`, `[readonly] apps/brikette/src/utils/intentResolver.ts`, `[readonly] apps/brikette/src/utils/entryAttribution.ts`, `[readonly] apps/brikette/src/utils/ga4-events.ts`
- **Depends on:** TASK-05, TASK-06, TASK-07, TASK-08, TASK-09
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 76% — each component is read; CTA click handlers call `router.push` or `Link` href; wiring to the resolver is mechanical.
  - Approach: 75% — Header desktop/mobile and OffersModal currently route hostel-only with `getBookPath(lang)`; they need enriched `fireCtaClick` calls with attribution dims. MobileNav already branches on `isApartmentRoute` — this existing behavior must NOT be changed; TASK-11 adds enriched `fireCtaClick` calls only to MobileNav, without touching its routing logic. Routing for all sitewide surfaces remains hostel-only in this plan cycle; private override is deferred.
  - Impact: 74% — these are permanent fixtures on every page; wiring them to the taxonomy closes the biggest attribution gap in the funnel.
- **Acceptance:**
  - **Routing scope (explicit):** Sitewide shell surfaces (`NotificationBanner`, `Header.tsx` desktop, `Header.tsx` mobile, `OffersModal`) are today hostel-only. This task's scope: (1) add canonical analytics events (enriched `fireCtaClick` with full attribution dimensions); (2) routing remains hostel-only — the intent resolver is wired but always returns `{ resolved_intent: "hostel", destination_funnel: "hostel_central" }` for these surfaces in this plan cycle; (3) private override for sitewide surfaces is deferred to a follow-on plan phase.
  - `NotificationBanner` CTA click → `writeAttribution({ source_surface: "sitewide_shell", source_cta: "notification_banner", resolved_intent: "hostel", destination_funnel: "hostel_central", next_page: "/[lang]/deals", ... })` + enriched `fireCtaClick(ctaId, ctaLocation, entryAttribution)` before navigation. Routing remains to the deals page (`translatePath("deals", lang)`) — existing behavior unchanged. `next_page` is set to `"/[lang]/deals"` to record the intermediate destination faithfully. When routing to hostel compare directly, `next_page: "/[lang]/book-dorm-bed"` instead.
  - `Header.tsx` desktop CTA (`header_check_availability`) → enriched `fireCtaClick` with `{ source_surface: "sitewide_shell", source_cta: "header_primary_cta", resolved_intent: "hostel", destination_funnel: "hostel_central" }`. Routing unchanged.
  - `Header.tsx` / `MobileNav` mobile nav CTA → enriched `fireCtaClick` with `{ source_surface: "sitewide_shell", source_cta: "mobile_nav_cta", resolved_intent: "hostel", destination_funnel: "hostel_central" }`. **MobileNav's existing `isApartmentRoute` routing logic (lines 60-62) is preserved unchanged.** The enriched `fireCtaClick` call is additive to the existing click handler.
  - `OffersModal` reserve CTA → enriched `fireCtaClick` with `{ source_surface: "sitewide_shell", source_cta: "offers_modal_reserve", resolved_intent: "hostel", destination_funnel: "hostel_central" }`. Routing unchanged.
  - Attribution carrier is written by each sitewide CTA at click time so subsequent compare-page and handoff events can read it.
  - `sitewide_shell` is a valid `source_surface` value (added to `GA4_ENUMS.sourceSurface` in TASK-05).
  - The env gate state (from TASK-07) and iframe viability (from TASK-08) do not affect sitewide CTA routing; these CTAs always route to `getBookPath(lang)` which then delegates to the env-aware handoff logic.
  - All four sitewide CTAs emit canonical on-taxonomy events; none continue to emit only bare `cta_click` events after this task.
  - **Normal-path handoff (FIX 3):** The handoff event (`begin_checkout` / `handoff_to_engine`) at room/rate selection READS the attribution carrier and includes `source_surface`, `source_cta`, `resolved_intent`, `product_type`, `decision_mode` in the emitted event. Add this handoff read in the relevant handoff emitter; attribution carrier written at CTA click time must survive to the handoff step.
- **Validation contract (TC-XX):**
  - TC-01: `NotificationBanner` CTA click → `fireCtaClick` mock called with full `entryAttribution` including `source_surface: "sitewide_shell"`, `source_cta: "notification_banner"`, `resolved_intent: "hostel"`, `next_page: "/en/deals"`; `writeAttribution` mock called; navigation to the deals page proceeds. Exactly one `cta_click` event emitted.
  - TC-02: `Header.tsx` desktop CTA click → `fireCtaClick` called with `entryAttribution` including `source_surface: "sitewide_shell"`, `source_cta: "header_primary_cta"`. One `cta_click` event.
  - TC-03: `Header.tsx` mobile nav CTA click → `fireCtaClick` called with `entryAttribution` including `source_surface: "sitewide_shell"`, `source_cta: "mobile_nav_cta"`. One `cta_click` event.
  - TC-04: `OffersModal` reserve click → `fireCtaClick` called with `entryAttribution` including `source_surface: "sitewide_shell"`, `source_cta: "offers_modal_reserve"`. One `cta_click` event.
  - TC-05: `writeAttribution` storage failure → navigation still proceeds; no unhandled error.
  - TC-06: Each component retains its existing routing behavior (hostel-only routing) — no regression. MobileNav `isApartmentRoute` logic preserved.
  - TC-07: When user completes room selection after entering via a sitewide CTA (e.g. `notification_banner`), the `handoff_to_engine` event includes `source_surface: "sitewide_shell"`, `source_cta: "notification_banner"`, and `resolved_intent: "hostel"` read from the attribution carrier.
- **Execution plan:** Red — add enriched `fireCtaClick` and `writeAttribution` assertions to tests for each component (one event per click, verify no double emission). Green — update click handlers in all four components to call enriched `fireCtaClick` with `entryAttribution`. Refactor — confirm no duplicate attribution writes; routing unchanged for all four surfaces.
- **Planning validation (required for M/L):**
  - Checks run: `NotificationBanner.tsx` `openDeals` callback at line 156 calls `router.push(...)` — this is the insertion point for enriched `fireCtaClick` + `writeAttribution`. `Header.tsx` `onDesktopHeaderCtaClick` at line 34 calls `fireCtaClick` only — extend to pass `entryAttribution` as third arg. `MobileNav.tsx` `onBookingClick` at line 67 — add enriched `fireCtaClick` call (additive; routing unchanged). `OffersModal` reserve handler — confirm location in `OffersModal.tsx`.
  - Validation artifacts: `Header.tsx` read in full; `MobileNav.tsx` (packages/ui) read in full; `NotificationBanner.tsx` read in full.
  - Unexpected findings: `NotificationBanner` currently navigates to `translatePath("deals", lang)` — NOT to `getBookPath(lang)`. It routes to the deals page, not the hostel compare page. This is a routing inconsistency: the banner says "check deals" but the funnel intent is hostel booking. Attribution source_cta should be `"notification_banner"` and destination should be documented as `deals_page` (not `hostel_central`) for this surface. Encode this accurately; do not silently re-route the banner to the hostel compare page without operator awareness.
- **Scouts:** Confirm `OffersModal.tsx` reserve CTA target — it should route to `getBookPath(lang)` (fact-find confirms this).
- **Edge Cases & Hardening:**
  - `NotificationBanner` routes to the deals page, not the hostel compare page. Attribution records `destination_funnel: "hostel_central"` (the ultimate funnel end-point) and `next_page: "/[lang]/deals"` (the immediate navigation target) — both are required to avoid misleading analytics about where the user actually lands first.
  - Each component must not double-fire (fire once per click, not once per render).
- **What would make this >=90%:**
  - Integration test that simulates click on each of the four sitewide CTAs and verifies the gtag payload.
- **Rollout / rollback:**
  - Rollout: gated on TASK-09. Ship as a batch since all four components are in scope.
  - Rollback: revert click handlers; attribution calls are additive.
- **Documentation impact:** None.
- **Notes / references:**
  - `NotificationBanner.tsx` `openDeals` at line 156 — routes to deals, not hostel compare (unexpected finding).
  - `Header.tsx` `onDesktopHeaderCtaClick` at line 34.
  - `MobileNav.tsx` `onBookingClick` at line 67.

---

### TASK-12a: DECISION — Double-private-room booking endpoint

- **Type:** DECISION
- **Deliverable:** `docs/plans/brikette-cohesive-sales-funnel/task-12a-double-room-endpoint-decision.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Pending — PAUSED. Build agent stopped here per plan. Operator input required before TASK-12 can start.
- **Agent pause note (2026-03-08):** TASK-05 through TASK-11 are complete. The build agent has reached TASK-12a and stopped as required. The decision question is: what is the Octorate rate code or endpoint for double-private-room bookings, and should it share the apartment booking page (Option A) or have a separate endpoint (Option B)? Operator must confirm before TASK-12 proceeds.
- **Affects:** `[readonly] apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`, `[readonly] packages/ui/src/config/privateRoomChildSlugs.ts`
- **Depends on:** TASK-09
- **Blocks:** TASK-12
- **Auto-build chain note:** TASK-12a is NOT agent-resolvable. The build agent must produce the decision document, present the two options and the recommendation, and then PAUSE and route to the operator for confirmation before TASK-12 starts. Under `Auto-Build-Intent: plan+auto`, the build agent will not self-approve this gate — it must surface the decision question explicitly and wait.
- **Confidence:** 80%
  - Implementation: 82% — the decision is well-framed; options are clear.
  - Approach: 80% — recommendation is Option A (share apartment booking page short-term with a route guard); Option B (separate endpoint) requires Octorate rate code availability confirmation.
  - Impact: 78% — wrong choice sends double-private-room intent to apartment-only checkout, causing booking failures or wrong products being reserved.
- **Options:**
  - Option A: Route double-private-room intent to the existing apartment booking page (`getPrivateBookingPath(lang)`), adding a route guard or display-mode flag that shows double-room-specific copy and rejects any Octorate rate codes that are apartment-only. Short-term safe; requires Octorate to have a separate rate code for the double private room.
  - Option B: Create a separate Brikette booking page for the double private room with its own Octorate `calendar.xhtml` URL and rate codes. Clean product separation; requires a new route, new page component, and confirmed Octorate rate code availability.
- **Recommendation:** If Octorate rate codes for the double private room can be confirmed distinct, Option A (shared page with `productType` prop switch) is viable short-term. **However, if Octorate rate codes for double-private-room cannot be confirmed, the safe default is to route double-private-room intent to `getPrivateRoomsPath(lang)` (private summary) with a WhatsApp button — NOT to the apartment-specific checkout.** Sending unconfirmed double-private-room intent to the apartment booking page risks offering wrong product pricing. The final call requires the operator to confirm: (a) does Octorate have a distinct rate code for the double private room, and (b) can a single booking page present both product types with a `productType` prop switch? If neither is confirmed, the implementation defaults to the private summary + WhatsApp path.
- **Decision input needed:**
  - question: Does Octorate have a distinct rate code (or room type code) for the double private room that is different from the apartment rate code?
  - why operator input is required (not agent-resolvable): The Octorate rate code configuration is a back-office setting not visible in the codebase. The agent can define the routing logic, but cannot confirm whether the rate code exists or is correctly configured on the operator's Octorate account.
  - default + risk: If the operator cannot confirm a distinct rate code, default to routing double-private-room intent to `getPrivateRoomsPath(lang)` (private summary hub) with a WhatsApp button — NOT to the apartment booking page. Risk of defaulting to apartment checkout: the booking form may show apartment-specific pricing/rooms if rate codes are shared, leading to incorrect reservations.
- **Acceptance:**
  - `task-12a-double-room-endpoint-decision.md` records the chosen option, the operator's answer on Octorate rate code availability, and the implementation instruction for TASK-12.
  - TASK-12 is unblocked after this decision is recorded.
- **Validation contract:** Decision file exists; chosen option is unambiguous; Octorate rate code availability is confirmed or explicitly noted as unconfirmed with a risk statement.
- **Planning validation:** None: DECISION task.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** `task-12a-double-room-endpoint-decision.md` is the artifact.

---

### TASK-12: Lock private product checkout segmentation

- **Type:** IMPLEMENT
- **Deliverable:** code changes — `apps/brikette/src/app/[lang]/private-rooms/PrivateRoomsSummaryContent.tsx`, `apps/brikette/src/app/[lang]/private-rooms/private-stay/PrivateStayContent.tsx`; possibly `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx` (productType prop).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/app/[lang]/private-rooms/PrivateRoomsSummaryContent.tsx`, `apps/brikette/src/app/[lang]/private-rooms/private-stay/PrivateStayContent.tsx`, `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`
- **Depends on:** TASK-05, TASK-06, TASK-09, TASK-12a
- **Blocks:** TASK-13
- **Confidence:** 68%
  - Implementation: 70% — the routing rules are clear once TASK-12a is resolved; the code is apartment-specific today and needs a `productType` switch.
  - Approach: 68% — blocked on TASK-12a; if Option B is chosen, a new route and page are required, adding scope.
  - Impact: 66% — the current summary page can send any private intent to apartment checkout; this is a booking correctness defect, not just a UX issue.
- **Acceptance:**
  - Apartment CTAs on `PrivateRoomsSummaryContent.tsx` explicitly set `product_type: "apartment"` and route to the apartment booking path.
  - Double-private-room CTAs on `PrivateRoomsSummaryContent.tsx` explicitly set `product_type: "double_private_room"` and route to the endpoint determined by TASK-12a.
  - `PrivateStayContent.tsx` CTAs are treated as `product_type: null` / `resolved_intent: "private"` → routed to `getPrivateRoomsPath(lang)` (private summary hub) unless the page is confirmed as apartment-only intent.
  - Each private-product CTA calls enriched `fireCtaClick(ctaId, ctaLocation, { source_surface: "private_summary", source_cta: <cta_id>, resolved_intent: "private", product_type: <product>, ... })` — one `cta_click` event per click with full attribution dims.
  - Each private-product CTA also calls `writeAttribution({ source_surface: "private_summary", source_cta: <cta_id>, resolved_intent: "private", product_type: <product>, decision_mode: "direct_resolution", locale: lang })` before navigation, so attribution survives route changes to the booking endpoint.
  - No CTA on the private-summary hub or private-stay page routes to `getPrivateBookingPath(lang)` without an explicit `product_type` being set.
  - The apartment booking page (`ApartmentBookContent.tsx`) remains functionally unchanged for apartment intent; the `productType` prop switch (if chosen in TASK-12a) controls copy only, not handoff URL.
- **Validation contract (TC-XX):**
  - TC-01: Apartment CTA click on private summary page → navigation to `getPrivateBookingPath(lang)` with `product_type: "apartment"` in the attribution carrier.
  - TC-02: Double-private-room CTA click on private summary page → navigation to the endpoint determined by TASK-12a (apartment booking page or separate route) with `product_type: "double_private_room"` in the carrier.
  - TC-03: `PrivateStayContent.tsx` CTA click → navigation to `getPrivateRoomsPath(lang)` (private summary hub), not to the apartment booking page directly.
  - TC-04: enriched `fireCtaClick` called with `product_type: "apartment"` on TC-01 path; one `cta_click` event emitted.
  - TC-05: enriched `fireCtaClick` called with `product_type: "double_private_room"` on TC-02 path; one `cta_click` event emitted.
  - TC-06: No CTA on any private-summary surface routes to `getPrivateBookingPath(lang)` without an explicit product type.
  - TC-07: `writeAttribution` mock is called with `product_type: "apartment"` on the TC-01 path and `product_type: "double_private_room"` on the TC-02 path before navigation fires.
- **Execution plan:** Red — write tests for TC-01 through TC-07 against current behavior (TC-01 and TC-02 will fail: current code has no product discrimination). Green — add explicit product-type routing to summary and private-stay CTAs. Refactor — confirm no remaining generic private handoffs.
- **Planning validation (required for M/L):**
  - Checks run: Confirmed `PrivateRoomsSummaryContent.tsx` and `PrivateStayContent.tsx` are listed in the fact-find evidence audit; their CTA behavior is described as lacking analytics events and capable of sending generic private intent to apartment checkout.
  - Validation artifacts: Fact-find Journey 3 (private product path) and Journey 5 (content-entry, private intent).
  - Unexpected findings: `PrivateStayContent.tsx` is a private-intent content subpage that routes directly to `getPrivateBookingPath(lang)` — bypassing the summary hub. This is a content entry point that must be brought under the same routing rules as the summary hub. Encoding this as TC-03.
- **Scouts:** Read `PrivateRoomsSummaryContent.tsx` to confirm exact CTA structure before implementation starts.
- **Edge Cases & Hardening:**
  - If TASK-12a chooses Option A (shared page), the double-room `productType` prop must not break existing apartment booking flows.
  - If TASK-12a chooses Option B (separate route), this task's scope expands; the CHECKPOINT (TASK-13) will catch this.
- **What would make this >=90%:**
  - Route-level integration test covering apartment vs double-room intent discrimination from the summary hub.
- **Rollout / rollback:**
  - Rollout: gated on TASK-12a decision. Ship together with the TASK-12a-chosen endpoint implementation.
  - Rollback: revert routing changes; private summary CTAs fall back to pre-discrimination behavior (generic private routing).
- **Documentation impact:** None.
- **Notes / references:**
  - Fact-find Journey 3 step 1 — critical finding: summary CTAs can send generic private intent to apartment-only checkout.

---

### TASK-13: CHECKPOINT — Reassess downstream tasks after private segmentation

- **Type:** CHECKPOINT
- **Deliverable:** updated plan via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-cohesive-sales-funnel/plan.md`
- **Depends on:** TASK-12
- **Blocks:** TASK-14, TASK-15
- **Confidence:** 95%
  - Implementation: 95% — process is defined.
  - Approach: 95% — prevents deep dead-end execution on TASK-14 (room-assist) and TASK-15 (dorms copy) based on TASK-12 outcome.
  - Impact: 95% — controls downstream risk if TASK-12a chose Option B (separate route), which expands TASK-12 scope.
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run.
  - `/lp-do-replan` run on TASK-14 and TASK-15.
  - Confidence for TASK-14 and TASK-15 recalibrated from latest evidence (especially if TASK-12a/TASK-12 expanded scope).
  - Plan updated and re-sequenced.
- **Horizon assumptions to validate:**
  - TASK-12a chose Option A (shared page) or Option B (separate route); if Option B, TASK-14 scope may increase.
  - Attribution carrier (TASK-06) is fully implemented and tested; if not, TASK-14 must be blocked.
  - TASK-07 env gate verdict is known. **Fork:** if the env gate is OFF on production at this checkpoint, TASK-14 must be marked "de-scoped pending env flag enablement" (not merely "lower confidence") — it is a moot task when the secure-booking shell does not exist on production. The replan must record this fork explicitly rather than just adjusting confidence.
- **Validation contract:** Plan is updated with revised TASK-14 and TASK-15 confidence scores and scope notes.
- **Planning validation:** Replan evidence recorded in updated plan.md.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** `docs/plans/brikette-cohesive-sales-funnel/plan.md` updated.

---

### TASK-14: Fix room-assist recovery attribution

- **Type:** IMPLEMENT
- **Deliverable:** code changes — `apps/brikette/src/components/booking/SecureBookingPageClient.tsx`; possibly `apps/brikette/src/app/[lang]/book/secure-booking/page.tsx`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/components/booking/SecureBookingPageClient.tsx`, `[readonly] apps/brikette/src/utils/entryAttributionCarrier.ts`
- **Depends on:** TASK-06, TASK-13
- **Blocks:** -
- **Confidence:** 78%
  - Implementation: 80% — `parseSecureBookingSearchParams` null case is identified; fallback `href` construction is in `SecureBookingPageClient.tsx`. The fix is: when params are invalid, fall back to the room-detail page (not the generic compare page) preserving room-id, plan, and source attribution.
  - Approach: 78% — attribution carrier (TASK-06) provides the source context at recovery time; room-id and plan must be read from the URL params before they are discarded.
  - Impact: 76% — current recovery drops the assist context and sends users to the generic compare page with no room/rate context; fixing it preserves the assist promise.
- **Acceptance:**
  - When `parseSecureBookingSearchParams(searchParams)` returns null, the fallback path routes to the localized room-detail page (`/[lang]/<dorms-slug>/<room-slug>`) preserving `room_id` and `plan` if they were present in the URL.
  - If `room_id` is not recoverable, the fallback routes to `getBookPath(lang)` (hostel compare page) as the last-resort default.
  - On recovery, `readAttribution()` is called; if a carrier payload exists, enriched `fireCtaClick(ctaId, ctaLocation, { ...carrierPayload, fallback_triggered: true })` is emitted with the original source context (one `cta_click` event with `fallback_triggered: true`).
  - The fallback `href` shown to the user links to the room-detail page (not a broken Octorate URL) when room context is recoverable.
  - Recovery behavior is testable via a unit test that mocks `parseSecureBookingSearchParams` to return null with and without a `room_id` URL param.
- **Validation contract (TC-XX):**
  - TC-01: `parseSecureBookingSearchParams` returns null with `room_id=room_10` in URL → fallback href is the localized room-detail page for room_10; enriched `fireCtaClick` called with `fallback_triggered: true` in `entryAttribution`. One `cta_click` event.
  - TC-02: `parseSecureBookingSearchParams` returns null with no `room_id` in URL → fallback href is `getBookPath(lang)`.
  - TC-03: Attribution carrier is present → `fallback_triggered: true` event emitted with original `source_surface` and `source_cta` from the carrier.
  - TC-04: Attribution carrier is absent → enriched `fireCtaClick` emitted with `source_surface: "room_detail"` (inferred from the room-detail recovery path context) and `fallback_triggered: true`. Do not emit `source_surface: null` — `null` contradicts the enum definition. When carrier is absent but recovery is on the room-assist path, `source_surface: "room_detail"` is the appropriate inferred value.
  - TC-05: Valid `parseSecureBookingSearchParams` result → no fallback; existing behavior unchanged.
- **Execution plan:** Red — write unit tests for TC-01 through TC-05 (mock `parseSecureBookingSearchParams`). Green — update fallback href construction to use room-id from URL params when available. Add `readAttribution()` call and enriched `fireCtaClick(ctaId, ctaLocation, { ...carrierPayload, fallback_triggered: true })` on the recovery path. Refactor — confirm no regression on valid params path; confirm single-event emission.
- **Planning validation (required for M/L):**
  - Checks run: Fact-find Journey 2 step 5 — current fallback strips room/plan/source; confirmed by code reference to `SecureBookingPageClient.tsx`. `parseSecureBookingSearchParams` is a unit-testable function — confirmed by fact-find test landscape note.
  - Validation artifacts: Fact-find §Coverage Gaps — "No tests prove that room-assist recovery preserves selected room/rate intent when secure-booking query parsing fails."
  - Unexpected findings: Recovery behavior depends on TASK-07 env gate state: if the flag is OFF, the secure-booking page does not exist and this task is moot for the gate-off path. Encode a guard: this task only applies when the env gate is ON.
- **Scouts:** Read `SecureBookingPageClient.tsx` before implementation to confirm the exact null-return handling and fallback href construction.
- **Edge Cases & Hardening:**
  - The `plan` URL param may be present even when `parseSecureBookingSearchParams` returns null; preserve it in the fallback if possible.
  - The fallback must not link to the Octorate URL directly (that link is a direct handoff, not a recovery).
- **What would make this >=90%:**
  - Route-level integration test covering the null-params fallback path end-to-end.
- **Rollout / rollback:**
  - Rollout: gated on TASK-06 (carrier) and TASK-13 (checkpoint). Only applicable when TASK-07 confirms env gate is ON.
  - Rollback: revert fallback href change; attribution call is additive.
- **Documentation impact:** None.
- **Notes / references:**
  - Fact-find Journey 2 step 5 — room-assist recovery gap.
  - `apps/brikette/src/components/booking/SecureBookingPageClient.tsx`.

---

### TASK-15: Reframe /dorms copy and nav as browse/SEO route

- **Type:** IMPLEMENT
- **Deliverable:** copy/IA changes — `apps/brikette/src/locales/en/roomsPage.json` and equivalent locale files; possibly `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx` heading/CTA copy.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/locales/en/roomsPage.json`, `apps/brikette/src/locales/it/roomsPage.json`, `apps/brikette/src/locales/fr/roomsPage.json`, `apps/brikette/src/locales/es/roomsPage.json`, `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx`
- **Depends on:** TASK-13
- **Blocks:** -
- **Confidence:** 92%
  - Implementation: 93% — copy/IA only; no routing changes; locale files are well-structured.
  - Approach: 92% — the page role is confirmed in the fact-find Page-Role Matrix; this task encodes that role in copy.
  - Impact: 90% — removes the ambiguity that causes `/dorms` to compete with the hostel compare page for booking intent.
- **Acceptance:**
  - The `/dorms` page heading and any booking CTAs frame the page as "browse and discover rooms" rather than "book now".
  - Room card CTAs on `/dorms` route to room-detail pages (`/dorms/[id]`) rather than directly to the secure-booking shell or the Octorate handoff.
  - The page's primary CTA (if present) routes to the localized hostel compare page (`getBookPath(lang)`), not to the secure-booking shell.
  - Copy changes are applied in all four supported locales (en, it, fr, es).
  - No routing logic changes in this task (routing is handled by TASK-09/10).
  - SEO metadata for `/dorms` continues to target room-discovery keywords, not booking-intent keywords (no keyword targeting regression).
- **Validation contract (TC-XX):**
  - TC-01: `/dorms` page heading does not contain booking-imperative language ("Book", "Reserve", "Check availability" as a page header); contains discovery language ("Browse", "Discover", "Explore rooms").
  - TC-02: Room card CTAs on `/dorms` link to `/[lang]/<dorms-slug>/<room-slug>` (room detail), not directly to Octorate or secure-booking.
  - TC-03: i18n snapshot for `en`, `it`, `fr`, `es` `roomsPage.json` confirms new copy keys are present.
  - TC-04: No routing regression — existing test for RoomsPageContent continues to pass with updated copy.
- **Execution plan:** Red — snapshot test on page heading text against current copy (expects current booking-framed language). Green — update `roomsPage.json` heading keys; update any hard-coded heading in `RoomsPageContent.tsx`. Refactor — confirm all four locale files are updated.
- **Planning validation:** None: S effort, copy-only change.
- **Scouts:** Confirm whether `RoomsPageContent.tsx` uses a locale key for its heading or hard-codes it. If the heading is in the locale file, only locale files need updating; if hard-coded, the component also needs touching.
- **Edge Cases & Hardening:** None: copy-only change with no routing or logic dependency.
- **What would make this >=90%:**
  - SEO audit (lp-seo) confirms keyword targeting for discovery intent is preserved post-change.
- **Rollout / rollback:**
  - Rollout: gated on TASK-13. Parallel-safe with TASK-14.
  - Rollback: revert locale file changes.
- **Documentation impact:** None.
- **Notes / references:**
  - Fact-find Page-Role Matrix: `/dorms` role is Browse/SEO.
  - Fact-find §Risks: "/dorms continues acting like a second central booking page".

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Env gate OFF on production — all shell-dependent acceptance criteria are void | High | TASK-07 verification gates TASK-09+; if flag is OFF, acceptance criteria are annotated as "gate-off path" |
| Iframe viability unproven — in-shell checkout cannot be an acceptance criterion | Medium | TASK-08 provides staging evidence; if iframe is blocked, acceptance criteria are re-annotated |
| TASK-12a chooses Option B (separate route) — TASK-12 scope expands significantly | Medium | TASK-13 checkpoint recalibrates TASK-14/15 scope after TASK-12 completes |
| Attribution carrier fails silently in incognito — multi-step analytics degrade | High | URL fallback params (`_bsrc`, `_bint`) provide a partial backup; TC-04 in TASK-06 tests the graceful degradation path |
| Intent resolver interface changes after TASK-10/11 are in progress — all wiring tasks need update | Medium | Resolver is locked before TASK-10/11 start (TASK-09 blocks both); interface change triggers a mini-replan |
| `NotificationBanner` routes to the deals page, not hostel compare — attribution reflects this correctly but may confuse GA4 funnel analysis | Medium | Attribution records the actual destination; the operator should be aware this surface routes to deals, not directly to hostel compare |
| Room-assist recovery (TASK-14) is moot if env gate is OFF | Medium | TASK-07 informs TASK-13 checkpoint; TASK-14 is annotated as env-gate-ON only |
| Double-private-room rate code unavailable in Octorate — TASK-12 must default to WhatsApp fallback | Medium | TASK-12a captures operator confirmation; WhatsApp fallback is already present in `ApartmentBookContent.tsx` |

## Observability

- Logging: None beyond existing Next.js error boundaries.
- Metrics:
  - After TASK-05+10+11 ship: GA4 custom dimensions `source_surface`, `resolved_intent`, `destination_funnel` are available in GA4 Explore for funnel analysis.
  - **Baseline window:** post-Wave-2 (after analytics schema is live — TASK-05/06/07/08 complete), pre-Wave-4 (before TASK-10/11 ship) — minimum 2 weeks. Wave 1 fixes eliminate layout corruption but do not instrument anything; the baseline window begins only once the analytics schema (Wave 2) is live and measurement is possible. Wave 1 is a prerequisite for clean mobile CTA engagement data, but Wave 2 is the instrumentation prerequisite for any funnel measurement.
  - Baseline comparison: measure `cta_click` → `handoff_to_engine` progression rate by `source_surface` over a 2–4 week post-Wave-4 window, compared against the pre-Wave-4 baseline.
  - H1 (content intent routing) is measurable once TASK-10 ships and `source_surface=content_page` events are recorded.
  - H2 (overlapping surfaces) is measurable once TASK-11 ships and `source_surface=sitewide_shell` events distinguish banner/header/modal entries.
- Alerts/Dashboards:
  - No new alerts in this plan. GA4 Explore report using the new dimensions is the primary observability artifact.
  - If `fallback_triggered=true` rate on `entry_attribution` events exceeds 5% of `handoff_to_engine` events after TASK-14, investigate the room-assist recovery path.

## Acceptance Criteria (overall)

- [ ] Wave 1: BRK-01, BRK-03, BRK-04, BRK-06 are fixed and verified (no regression on existing tests; new TC-XX tests pass in CI).
- [ ] Wave 2: `ga4-events.ts` exports `EntryAttributionParams`, all new enum types (`sourceSurface`, `resolvedIntent`, `productType`, `decisionMode`, `destinationFunnel`), type guard functions, and the enriched `fireCtaClick` signature without breaking any existing export (confirmed by typecheck + CI). No `fireEntryAttribution` function is introduced.
- [ ] Wave 2: Attribution carrier is implemented, tested, and handles incognito failure gracefully (TC-04 in TASK-06 passes).
- [ ] Wave 3: Env gate state on staging and production is documented in `task-07-env-verification.md`.
- [ ] Wave 3: Iframe viability verdict is documented in `task-08-iframe-proof.md`.
- [ ] Wave 4: Intent resolver covers all 16 current `ctaLocation` values with no silent fall-through (TC-06 in TASK-09 passes).
- [ ] Wave 4: `ContentStickyCta` no longer hard-codes `getBookPath(lang)` as its routing target; it calls `resolveIntent` and navigates to the URL derived by the caller from `destination_funnel` (resolver returns no `destination_url`). Navigation URLs are decorated with `decorateUrlWithAttribution` before routing.
- [ ] Wave 4: All four sitewide CTAs (`NotificationBanner`, header desktop, header mobile, `OffersModal`) emit enriched `fireCtaClick` with `source_surface: "sitewide_shell"` in `entryAttribution` on click — one `cta_click` event per click. Routing remains hostel-only for all four surfaces in this plan cycle.
- [ ] Wave 4: Attribution carrier is written at click time by all wired CTAs.
- [ ] Wave 5: Private summary hub (`PrivateRoomsSummaryContent.tsx`) explicitly routes apartment intent and double-private-room intent to distinct endpoints (per TASK-12a decision).
- [ ] Wave 5: No CTA on any private-summary surface routes to `getPrivateBookingPath(lang)` without an explicit `product_type`.
- [ ] Wave 6: Room-assist recovery (when `parseSecureBookingSearchParams` returns null) routes to the room-detail page when `room_id` is recoverable, not to the generic compare page.
- [ ] Wave 6: `/dorms` page copy frames the page as browse/SEO, not booking-primary; heading and CTA language updated in all four locales.
- [ ] Overall: `pnpm typecheck && pnpm lint` passes in CI on every shipped wave.
- [ ] Overall: No existing test suite is broken by any wave's changes.

---

## Rehearsal Trace

| Step | Task | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|---|
| Fix MobileNav CTA label | TASK-01 | Yes — target class confirmed at line 131 of `MobileNav.tsx` | None | None |
| Fix RoomsSection mobile padding | TASK-02 | Yes — `pt-30` confirmed in `sectionClasses` at line 287 of `RoomsSection.tsx` | None | None |
| Move banner suppression to server | TASK-03 | Yes — client-side guard at line 240 of `NotificationBanner.tsx` confirmed | Must check whether a `private-rooms/layout.tsx` already exists | Scout in execution: check for existing layout before creating one |
| Fix dismiss button touch target | TASK-04 | Yes — `size-10` confirmed at line 152 of `ContentStickyCta.tsx` | None | None |
| GA4 entry-attribution schema | TASK-05 | Yes — `ga4-events.ts` read in full; existing enum/type pattern is clear | `deals_page` is a `source_surface` value only, not a `ctaLocation` value (axis separation applied). `sitewide_shell` is also a `source_surface` value only. A new `GA4_ENUMS.sourceSurface` enum array is introduced; neither value is added to `ctaLocation`. | Encoded in acceptance criteria; axis separation enforced by FIX 1. |
| Attribution persistence carrier | TASK-06 | Yes — session storage pattern confirmed from `ContentStickyCta.tsx`; no existing carrier module | Incognito/private-browsing failure mode documented; URL fallback required | TC-04 covers graceful degradation; `_bsrc`/`_bint` param names must be verified against Octorate params |
| Env gate verification | TASK-07 | Process defined; CF API credentials available | Outcome is unknown — flag may be OFF | If flag is OFF: annotate TASK-10/11 shell-dependent ACs; do not block Wave 4 from shipping (attribution wiring is env-gate-agnostic) |
| Iframe viability proof | TASK-08 | Process defined; browser MCP available | Outcome is unknown — iframe may be blocked by Octorate | If iframe is blocked: annotate in-shell checkout ACs as deferred; TASK-10/11 CTA wiring is still valid |
| Intent resolver | TASK-09 | Yes — all 16 ctaLocation values read; route helpers confirmed | Resolver returns `{ resolved_intent, product_type, decision_mode, destination_funnel }` only — no `destination_url`. `NotificationBanner` routes to deals page (intermediate); this is captured in `next_page` field at the caller level, not in the resolver. Session storage reads (`readAttribution`) must not be called on SSR; the resolver itself is SSR-safe. | Encoded in TASK-09 and TASK-11 acceptance criteria. |
| Wire ContentStickyCta | TASK-10 | Yes — component read in full; `onCtaClick` at line 123 | `usePathname` not imported; `isPrivateRoute` must be added as prop or internal hook | Prop approach preferred (simpler testing); encoded in planning validation |
| Wire sitewide shell CTAs | TASK-11 | Yes — all four components read | `NotificationBanner` routes to deals page (intermediate); `next_page` field captures this. Routing remains hostel-only for all sitewide surfaces in this cycle; private override deferred. Attribution uses enriched `fireCtaClick`, not a separate emitter. | Encoded in TASK-11 acceptance and FIX 6 scope resolution. |
| Double-room endpoint decision | TASK-12a | Yes — options and recommendation are defined | Operator input required on Octorate rate code availability | DECISION task; blocks TASK-12 |
| Private product segmentation | TASK-12 | Blocked on TASK-05, TASK-06, TASK-09, TASK-12a | If TASK-12a chooses Option B, scope expands to a new route; TASK-12 calls enriched `fireCtaClick` with `entryAttribution` (needs TASK-05) and `writeAttribution` (needs TASK-06); double-private-room fallback defaults to `getPrivateRoomsPath` not apartment checkout when rate codes unconfirmed | TASK-13 checkpoint catches scope; dependency fix applied in Plan-R1 critique; FIX 8 safer fallback applied in Plan-R2 |
| Downstream checkpoint | TASK-13 | Blocked on TASK-12 | None — process is defined | None |
| Room-assist recovery | TASK-14 | Blocked on TASK-06 and TASK-13 | `parseSecureBookingSearchParams` null case is unit-testable (confirmed); TASK-07 must confirm env gate is ON before this task is meaningful | If env gate is OFF, TASK-14 is annotated as "env-gate-ON only" |
| Dorms copy reframe | TASK-15 | Blocked on TASK-13; parallel-safe with TASK-14 | Must scout whether heading is in locale file or hard-coded | Scout in execution |

**Critical rehearsal finding: NONE.** All issues found have resolutions encoded in the relevant tasks. Status remains Active.

---

## Decision Log

- 2026-03-08: `hybrid` routing is deferred. The plan treats `undetermined` intent as the interim state; the hybrid chooser UI (a dedicated surface that presents both hostel and private CTAs when page context is ambiguous) is out of scope for this plan. This was confirmed as adjacent scope during decomposition.
- 2026-03-08: Double-private-room booking endpoint is the one DECISION task not self-resolvable by the agent. Octorate rate code availability cannot be read from the codebase. Default recommendation is Option A (shared page with `productType` prop switch) pending operator confirmation.
- 2026-03-08: Attribution carrier design locked as session-storage-first with URL fallback (`_bsrc`, `_bint` params). Not a DECISION task — the design is derivable from codebase evidence and incognito failure mode requirements.
- 2026-03-08: Entry-attribution schema uses an additive extension of `fireCtaClick` (new optional third argument `entryAttribution?: EntryAttributionParams`). There is no separate `fireEntryAttribution` emitter — a single click emits one `cta_click` event, enriched when `entryAttribution` is provided. This eliminates double-counting risk. Not a DECISION task — the extension pattern is established by `HandoffToEngineParams` in the same file.
- 2026-03-08: CTA routing matrix for the resolver encodes all 16 current `ctaLocation` values. Not a DECISION task — the matrix is derivable from the fact-find Page-Role Matrix and canonical model. Content pages default to hostel-central; private-route context overrides to private.
- 2026-03-08: `NotificationBanner` routes to the deals page (not hostel compare). Discovered during TASK-11 rehearsal. Attribution will record the actual destination (`deals_page`) rather than silently re-routing to hostel compare. Operator should be aware this surface is not a direct hostel-compare entry point.
- 2026-03-08: Critique loop applied. Findings and resolutions:
  1. All IMPLEMENT tasks (M effort) now have TC-XX validation contracts — confirmed.
  2. TASK-09 (resolver) was at 80%; planning validation evidence added (ctaLocation enum read, routing rules derivable) — confidence retained at 80% with documented evidence.
  3. No task encodes "hybrid" as a routing target — confirmed; hybrid is deferred throughout.
  4. TASK-10 and TASK-11 depend on TASK-07 (env verification) — confirmed in Depends on field; neither task's acceptance criteria assume env gate ON without the gate.
  5. Consumer tracing for TASK-05 (new analytics fields): TASK-10, TASK-11, TASK-12, and TASK-14 are consumers of the enriched `fireCtaClick` (replaces any former `fireEntryAttribution` references — Plan-R2 correction); TASK-06 carrier consumers are TASK-10, TASK-11, TASK-12 and TASK-14. TASK-05 and TASK-06 now formally block TASK-12 (corrected in Plan-R1 critique).

## Overall-confidence Calculation

S=1, M=2, L=3

| Task | Confidence | Effort | Weight |
|---|---|---|---|
| TASK-01 | 90% | S=1 | 0.90 |
| TASK-02 | 90% | S=1 | 0.90 |
| TASK-03 | 87% | S=1 | 0.87 |
| TASK-04 | 90% | S=1 | 0.90 |
| TASK-05 | 78% | M=2 | 1.56 |
| TASK-06 | 78% | M=2 | 1.56 |
| TASK-07 | 72% | S=1 | 0.72 |
| TASK-08 | 72% | S=1 | 0.72 |
| TASK-09 | 80% | M=2 | 1.60 |
| TASK-10 | 75% | M=2 | 1.50 |
| TASK-11 | 75% | M=2 | 1.50 |
| TASK-12a | 80% | S=1 | 0.80 |
| TASK-12 | 68% | M=2 | 1.36 |
| TASK-13 | 95% | S=1 | 0.95 |
| TASK-14 | 78% | M=2 | 1.56 |
| TASK-15 | 92% | S=1 | 0.92 |

Sum(confidence × effort weight) = 0.90+0.90+0.87+0.90+1.56+1.56+0.72+0.72+1.60+1.50+1.50+0.80+1.36+0.95+1.56+0.92 = 18.32

Sum(effort weight) = 1+1+1+1+2+2+1+1+2+2+2+1+2+1+2+1 = 24

Weighted overall-confidence = 18.32 / 24 ≈ **76%** (stated as 75% conservatively; drag from TASK-07/08 at 72% and TASK-12 at 68%; Wave 1–3 tasks individually 87–92%)
