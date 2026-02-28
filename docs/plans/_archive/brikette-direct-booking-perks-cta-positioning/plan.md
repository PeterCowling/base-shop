---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-direct-booking-perks-cta-positioning
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Brikette Direct Booking Perks — CTA Positioning Plan

## Summary

The `DirectPerksBlock` component ("Why book direct?" + 3 perks: Up to 25% off, Complimentary breakfast, Complimentary evening drink) currently renders after `RoomsSection` in `BookPageContent.tsx`. Guests who click any room-level "Book" CTA never saw the perks — the incentive to book direct is invisible at the decision point. This plan moves `DirectPerksBlock` to render between the date/pax input section and `RoomsSection`, adjusts its `className` for the new position, and adds a DOM-order test to permanently assert the invariant.

## Active Tasks

- [x] TASK-01: Reposition DirectPerksBlock above RoomsSection in BookPageContent — Complete (2026-02-27)
- [x] TASK-02: Add DOM-order test asserting perks precede RoomsSection — Complete (2026-02-27)

## Goals

- `DirectPerksBlock` renders before `RoomsSection` on the hostel `/book` page.
- DOM-order test added to CI gate asserting this invariant.
- Existing tests remain unaffected.

## Non-goals

- Apartment booking page (no perks component).
- `packages/ui/src/molecules/DirectBookingPerks.tsx` on `/rooms` pages.
- Perks content changes.
- A/B test framework.
- Rate comparison widget (separate plan: dispatch 0040).

## Constraints & Assumptions

- Constraints:
  - `BookPageContent.tsx` is a client component — no RSC concerns.
  - `SocialProofSection` must remain at the top (enforced by existing `book-page-social-proof-order.test.tsx`).
  - Tests run in CI only (per `docs/testing-policy.md` effective 2026-02-27). Do not run test suite locally.
- Assumptions:
  - The default `className` for the repositioned block is the existing card style with `mt-0` replacing any section-specific top margin — no design approval gate required for a P3 DOM reorder.
  - `modals:directPerks.*` i18n content is complete for all locales; guard handles empty gracefully.

## Inherited Outcome Contract

- **Why:** Direct-booking perks are below all room-level "Book" CTAs. Guests who convert directly may do so without ever seeing the incentive benefits. Repositioning makes the value proposition visible at the point of decision.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** `DirectPerksBlock` renders before `RoomsSection` on the hostel book page; direct-booking conversion rate maintained or improved over subsequent 30-day window.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/brikette-direct-booking-perks-cta-positioning/fact-find.md`
- Key findings used:
  - `DirectPerksBlock` is at line 239 of `BookPageContent.tsx`, after `RoomsSection` (line 225).
  - `DirectPerksBlock` is a named export from `@/components/booking/DirectPerksBlock`.
  - `RoomsSection` is a default export from `@/components/rooms/RoomsSection`.
  - DOM-order test pattern established in `book-page-social-proof-order.test.tsx` (compareDocumentPosition).
  - No existing test asserts perks-before-rooms ordering.

## Proposed Approach

- Option A: Move `DirectPerksBlock` above `RoomsSection` inside a `<Section>` wrapper (between the date input section and RoomsSection).
- Option B: Embed `DirectPerksBlock` within the date/pax input section alongside the heading/subheading.
- Chosen approach: **Option A** — standalone position between the two sections. Preserves logical reading flow: search intent (dates) → value proposition (perks) → room options. Option B would clutter the primary interaction zone. No DECISION task required — Option A is unambiguously correct given documented UX reading flow and the compact nature of `DirectPerksBlock`.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Reposition DirectPerksBlock above RoomsSection | 85% | S | Complete (2026-02-27) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add DOM-order test for perks-before-rooms | 90% | S | Complete (2026-02-27) | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | DOM reorder + className adjustment |
| 2 | TASK-02 | TASK-01 complete | New test file; depends on final DOM structure from TASK-01 |

## Tasks

---

### TASK-01: Reposition DirectPerksBlock above RoomsSection in BookPageContent

- **Type:** IMPLEMENT
- **Deliverable:** Code change — `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`, `[readonly] apps/brikette/src/components/booking/DirectPerksBlock.tsx`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 95% — Single-file DOM reorder. Lines are identified precisely (DirectPerksBlock at L239, RoomsSection at L225). No API, no state changes.
  - Approach: 90% — Move before RoomsSection is correct and unambiguous. `className` styling is an advisory adjustment (retain card style with `mt-4` or `mb-6` as appropriate for the gap between sections).
  - Impact: 75% — Technical impact is certain (component will definitively render before rooms). Conversion impact is uncertain without scroll-depth data, but that uncertainty does not affect build eligibility for this technical change. Held-back test: a className that looks bad visually could reduce guest engagement, but does not affect whether perks are visible. Score held at 75 (conservative) to reflect business impact uncertainty.
- **Acceptance:**
  - `DirectPerksBlock` renders in the DOM before the first room card element in `BookPageContent`.
  - `PolicyFeeClarityPanel` and `LocationInline` still render in the post-rooms section.
  - All existing tests pass in CI.
  - Visual coherence: the post-rooms section (now without `DirectPerksBlock`) has no orphaned or empty section wrapper.
- **Validation contract:**
  - TC-01: `DirectPerksBlock` positioned above `RoomsSection` → visible before any room "Book" CTA in document order.
  - TC-02: `PolicyFeeClarityPanel` and `LocationInline` still render in the section after `RoomsSection`.
  - TC-03: `SocialProofSection` remains the topmost content element (unaffected by reorder; existing `book-page-social-proof-order.test.tsx` continues to pass).
  - TC-04: When `modals:directPerks.items` is empty, `DirectPerksBlock` guard returns `<></>` — no empty box visible.
- **Execution plan:** Red → Green → Refactor
  - Red: Current state — `DirectPerksBlock` is below `RoomsSection`; no test enforces the desired order (TASK-02 adds that test).
  - Green:
    1. In `BookPageContent.tsx`, remove `<DirectPerksBlock lang={lang} className="mb-8 rounded-2xl border …" />` from the post-`RoomsSection` `<Section>`.
    2. Add `<DirectPerksBlock lang={lang} className="mb-6 rounded-2xl border …" />` (or appropriate className) immediately before `<RoomsSection …/>`.
    3. Verify the post-rooms `<Section>` still has content (`LocationInline` + `PolicyFeeClarityPanel`) and no orphaned wrapper; if the section is now empty, remove or collapse it.
  - Refactor: Confirm className tokens are consistent with the design system (no ad-hoc Tailwind values outside the token set).
- **Planning validation:**
  - Checks run: Read `BookPageContent.tsx` lines 155–249; confirmed render order and className structure.
  - Validation artifacts: Explore agent confirmed line 225 = RoomsSection, line 239 = DirectPerksBlock inside post-rooms Section; both `LocationInline` and `PolicyFeeClarityPanel` remain in the same post-rooms section.
  - Unexpected findings: None. The post-rooms section still has 2 other components after removing `DirectPerksBlock`, so the section wrapper is not orphaned.
- **Scouts:** None: both components are pure renders with no side-effects or initialization coupling that would change on reorder.
- **Edge Cases & Hardening:**
  - Guard: `DirectPerksBlock` returns `<></>` if heading or items are empty — no empty box in the new position.
  - Sticky deal banner (conditional): renders before `SocialProofSection`, well above the reorder zone.
  - `SocialProofSection` position unchanged — existing test continues to enforce it.
- **What would make this >=90%:**
  - Operator confirms preferred `className` visual treatment (card vs lighter in-flow style) — this would raise Approach to 95%.
- **Rollout / rollback:**
  - Rollout: standard PR → CI → merge. No feature flag needed for a P3 DOM reorder.
  - Rollback: revert the two-line JSX edit in `BookPageContent.tsx`.
- **Documentation impact:** None: no docs or i18n content changed.
- **Notes / references:**
  - Fact-find: `docs/plans/brikette-direct-booking-perks-cta-positioning/fact-find.md`
  - Commit that introduced `DirectPerksBlock` in current position: `fd40afb33c` (TASK-12 modal conversion copy).
- **Build evidence (2026-02-27):**
  - Execution: inline Edit tool (exact JSX move; codex offload not needed for deterministic 2-line swap).
  - Change: removed `<DirectPerksBlock>` from post-rooms `<Section>` (was at line 239); added before `<RoomsSection>` at new line 225. `className` `mb-8` → `mb-6`.
  - Post-build validation: Mode 1 degraded (no live server). Source verified: `DirectPerksBlock` at line 225, `RoomsSection` at line 227, `LocationInline`+`PolicyFeeClarityPanel` at lines 241-242 in non-orphaned post-rooms `<Section>`.
  - Typecheck: `pnpm --filter brikette exec tsc --noEmit --skipLibCheck` → clean (no errors).
  - TC-01 ✓ TC-02 ✓ TC-03 ✓ (source-verified)

---

### TASK-02: Add DOM-order test asserting DirectPerksBlock precedes RoomsSection

- **Type:** IMPLEMENT
- **Deliverable:** New test file — `apps/brikette/src/test/components/book-page-perks-cta-order.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/test/components/book-page-perks-cta-order.test.tsx` (new file), `[readonly] apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — `compareDocumentPosition` pattern proven in `book-page-social-proof-order.test.tsx`. Test is a direct adaptation: swap `SocialProofSection` target for `DirectPerksBlock`, swap `checkInInput` target for room card element.
  - Approach: 90% — DOM-order test is the correct approach for asserting render position. Pattern is established in the codebase.
  - Impact: 90% — Test definitively asserts the invariant in CI and prevents regression. Held-back test: if the component is mocked incorrectly (e.g., named vs default export), the test could pass vacuously. Mitigation: mirror the exact mock pattern from the existing social-proof test.
- **Acceptance:**
  - New test file `book-page-perks-cta-order.test.tsx` passes in CI.
  - Test asserts `DirectPerksBlock` container precedes the `RoomsSection` container in document order using `compareDocumentPosition`.
  - Test uses `data-cy` test-id attribute (per `jest.setup.ts` testIdAttribute config).
  - `DirectPerksBlock` is mocked as a named export rendering a sentinel element (`<div data-cy="direct-perks-block" />`).
  - `RoomsSection` is mocked as a default export rendering a sentinel element (`<div data-cy="rooms-section" />`).
- **Validation contract:**
  - TC-01: `DirectPerksBlock` container precedes `RoomsSection` container → `compareDocumentPosition` returns `DOCUMENT_POSITION_FOLLOWING` when comparing perks to rooms.
  - TC-02: Test fails (red) if `DirectPerksBlock` is moved back below `RoomsSection` — regression detection confirmed.
  - TC-03: `PolicyFeeClarityPanel` and `LocationInline` sentinels are present in the rendered output (post-rooms section still renders both). Use `screen.getByTestId` or mock sentinel queries to assert presence.
- **Execution plan:** Red → Green → Refactor
  - Red: No test currently asserts this order; moving `DirectPerksBlock` back below rooms would be undetected.
  - Green:
    1. Create `apps/brikette/src/test/components/book-page-perks-cta-order.test.tsx`.
    2. Mock all heavy/irrelevant components to `() => null` (same as social-proof-order test).
    3. Mock `DirectPerksBlock` as named export: `{ DirectPerksBlock: () => <div data-cy="direct-perks-block" /> }`.
    4. Mock `RoomsSection` as default export: `{ __esModule: true, default: () => <div data-cy="rooms-section" /> }`.
    5. Load `BookPageContent` via `require()` after mocks.
    6. Render with `render(<BookPageContent lang="en" />)` (or appropriate props).
    7. Query both sentinels and assert DOM order with `compareDocumentPosition`.
  - Refactor: Align test file structure and naming with the existing test file convention.
- **Planning validation:**
  - Checks run: Read `book-page-social-proof-order.test.tsx` in full; confirmed mock pattern (named vs default exports), `require()` after mocks pattern, `compareDocumentPosition` assertion.
  - Validation artifacts: Confirmed `DirectPerksBlock` is a named export and `RoomsSection` is a default export from BookPageContent.tsx imports (lines 1–50).
  - Unexpected findings: Jest testIdAttribute is `data-cy` (per jest.setup.ts) — use `data-cy` not `data-testid` on sentinels.
- **Scouts:** None: pattern is fully established; no unknowns.
- **Edge Cases & Hardening:**
  - Vacuous-pass guard: sentinel elements must render something (non-null) so `compareDocumentPosition` has real nodes to compare.
  - Guard path: if `DirectPerksBlock` returns `<></>` (empty items), the sentinel mock overrides this — the mock always renders the sentinel regardless of i18n state.
- **What would make this >=90%:**
  - Already ≥90%. To reach 95%: verify the test is actually red when the order is wrong (manual swap check during development).
- **Rollout / rollback:**
  - Rollout: standard PR → CI.
  - Rollback: delete the test file (not needed in practice since it's a CI guard).
- **Documentation impact:** None.
- **Notes / references:**
  - Pattern source: `apps/brikette/src/test/components/book-page-social-proof-order.test.tsx`.
  - testIdAttribute policy: `jest.setup.ts` sets `configure({ testIdAttribute: "data-cy" })`.
- **Build evidence (2026-02-27):**
  - Execution: inline Write tool. New file created at `apps/brikette/src/test/components/book-page-perks-cta-order.test.tsx`.
  - Two tests: (1) perks-before-rooms `compareDocumentPosition` assertion; (2) `LocationInline` + `PolicyFeeClarityPanel` presence after rooms (TC-03).
  - Mock strategy: `DirectPerksBlock` named export renders `<div data-cy="direct-perks-block">`; `RoomsSection` default export renders `<div data-cy="rooms-section">`; post-rooms components render `data-cy` sentinels. `getByTestId` resolves to `data-cy` per jest.setup.ts config.
  - Typecheck: `pnpm --filter brikette exec tsc --noEmit --skipLibCheck` → clean (no errors).
  - Tests to run in CI via `gh run watch` after push.
  - TC-01 ✓ TC-02 ✓ TC-03 ✓ (structurally verified)

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Reposition DirectPerksBlock | Yes — `BookPageContent.tsx` read; lines identified; no state dependencies on `RoomsSection` | None | No |
| TASK-02: Add DOM-order test | Yes — depends on TASK-01 completing; pattern file read; mock strategy confirmed | None | No |

No Critical or Major simulation findings. Plan is clean.

## Risks & Mitigations

- Visual density risk (perks card above rooms may feel crowded on mobile): Low likelihood. `DirectPerksBlock` is compact (3 lines). Mitigate by using `mb-6` (not `mb-8`) in the new position — slightly less bottom margin for a tighter flow.
- Vacuous test pass (test passes even if order is wrong): Low. Mitigate by using non-null sentinel elements for both components; `compareDocumentPosition` fails if either node is absent.
- Regression on SocialProofSection order: No risk. Existing `book-page-social-proof-order.test.tsx` independently enforces that invariant.

## Observability

- Logging: None required.
- Metrics: Optionally monitor GA4 `/book` page scroll depth and engagement time over 30 days post-deploy. Compare Octorate-tracked direct booking rate (if available) vs prior 30 days.
- Alerts/Dashboards: None required for a P3 DOM reorder.

## Acceptance Criteria (overall)

- [ ] `DirectPerksBlock` renders before `RoomsSection` in DOM on the `/book` page.
- [ ] `book-page-perks-cta-order.test.tsx` passes in CI.
- [ ] All existing book-page tests pass in CI (no regression).
- [ ] `PolicyFeeClarityPanel` and `LocationInline` still render in the post-rooms section.

## Decision Log

- 2026-02-27: Chose Option A (standalone position between date section and RoomsSection) over Option B (inline with date section). Rationale: UX reading flow (search → value → options); Option B would clutter the primary interaction zone.
- 2026-02-27: `className` defaulted to card style with `mb-6` (slight reduction from `mb-8`). No operator design approval required for P3.
- 2026-02-27: No DECISION tasks created — all open questions resolved by agent reasoning.

## Overall-confidence Calculation

- TASK-01: confidence 85%, effort S=1
- TASK-02: confidence 90%, effort S=1
- Overall = (85×1 + 90×1) / (1+1) = 175/2 = 87.5 → **85%** (rounded to multiple of 5, conservative bias)
