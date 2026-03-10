---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: UI | QA
Workstream: Engineering
Created: 2026-03-02
Last-updated: 2026-03-02
Last-reviewed: 2026-03-02
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-funnel-test-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brikette-funnel-test-hardening/plan.md
Dispatch-IDs: IDEA-DISPATCH-20260302093958-0112,IDEA-DISPATCH-20260302093958-0113,IDEA-DISPATCH-20260302093958-0114,IDEA-DISPATCH-20260302093958-0115,IDEA-DISPATCH-20260302093958-0116
Trigger-Source: dispatch-routed
Trigger-Why: Funnel revenue risk remained concentrated in untested booking entry and handoff paths, especially shared booking controls and resilience behavior.
Trigger-Intended-Outcome: "type: operational | statement: Add direct automated coverage for shared booking controls, recovery fallback logic, apartment/sticky CTA URL wiring, and booking resilience scenarios so funnel regressions fail in CI before release | source: operator"
---

# Brikette Funnel Test Hardening Fact-Find

## Scope
### Summary
This fact-find targeted five queued SELL dispatches focused on booking-funnel test risk. Existing parser, hook, and URL-builder tests were already strong, but direct coverage was missing at the component contract layer and resilience journey layer.

### Goals
- Add direct component contract tests for `BookingCalendarPanel`.
- Add direct hook tests for `useRecoveryResumeFallback`.
- Add URL-matrix tests for apartment booking plan+pax mappings.
- Add URL-matrix tests for room-detail sticky CTA mappings across multiple rooms.
- Add Playwright resilience coverage for sold-out and availability API failure flows, plus homepage widget funnel traversal.

### Non-goals
- Re-architect booking flow components.
- Replace existing GA4 contract tests.
- Execute Jest/Playwright suites locally (CI remains source of truth).

### Constraints & Assumptions
- Constraints:
  - Follow repo testing policy: no local Jest/e2e execution.
  - Keep work scoped to the queued dispatch risks.
- Assumptions:
  - Existing warnings in `@apps/brikette` lint output are pre-existing and out of this task scope.

## Outcome Contract
- **Why:** Funnel breakage risk was concentrated in shared booking controls and handoff/resilience paths with no direct tests.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Add missing direct tests for shared booking controls, recovery fallback behavior, apartment and sticky CTA URL wiring, and booking resilience journeys, then pass scoped `typecheck` and `lint` gates.
- **Source:** operator

## Access Declarations
None.

## Evidence Audit (Current State)
### Entry Points
- `apps/brikette/src/components/booking/BookingCalendarPanel.tsx`
- `apps/brikette/src/hooks/useRecoveryResumeFallback.ts`
- `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`
- `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`
- `apps/brikette/e2e/availability-smoke.spec.ts`

### Key Modules / Files
- `apps/brikette/src/test/components/booking-calendar-panel.test.tsx` - new direct shared-control coverage.
- `apps/brikette/src/hooks/useRecoveryResumeFallback.test.ts` - new direct recovery hook coverage.
- `apps/brikette/src/test/components/apartment/apartment-booking-url-matrix.test.tsx` - new apartment matrix coverage.
- `apps/brikette/src/test/components/room-detail-sticky-url-matrix.test.tsx` - expanded sticky URL matrix coverage.
- `apps/brikette/e2e/availability-resilience.spec.ts` - new resilience/funnel traversal scenarios.

### Test Landscape
#### Existing Test Coverage
- Strong existing coverage in parser/hook/url-builder utilities.
- Indirect-only coverage for multiple funnel-critical surfaces.

#### Coverage Gaps
- `BookingCalendarPanel` had zero direct tests.
- `useRecoveryResumeFallback` had zero direct tests.
- Apartment handoff matrix had no explicit all-combinations guard.
- Sticky CTA URL coverage was narrow to one path.
- E2E resilience scenarios were absent.

#### Recommended Test Approach
- Component/unit contract tests for deterministic controls and side effects.
- URL matrix tests for mapping-heavy handoffs.
- E2E journey tests for sold-out and API-failure behavior.

## Questions
### Resolved
- Q: Should this work be split across multiple slugs or delivered as one queued hardening batch?
  - A: One slug, one plan, five dispatches mapped to five tasks.
  - Evidence: queue packet set `0112`-`0116` shared funnel-risk objective and adjacent anchors.

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 93%
  - Evidence basis: bounded test-only changes with known anchors.
  - To reach >=95: CI run confirmation for newly added tests.
- Approach: 90%
  - Evidence basis: direct tests added at the exact uncovered seams.
  - To reach >=95: add remaining uncovered entrypoint tests (`BookingWidget`, `BookPageContent`) in follow-up dispatch.
- Impact: 88%
  - Evidence basis: shared controls and handoff wiring now fail fast in automated checks.
  - To reach >=90: pass/fail evidence from CI test execution.
- Delivery-Readiness: 95%
  - Evidence basis: all targeted artifacts are implemented and lint/type gates are passing.
- Testability: 92%
  - Evidence basis: seams are now explicitly tested with deterministic mocks.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| New tests pass locally but fail in CI runtime | Medium | Medium | Push and verify CI test results before release promotion. |
| Remaining untested entry points (`BookingWidget`, `BookPageContent`) still regress | Medium | High | Add follow-up dispatch to extend direct coverage. |

## Suggested Task Seeds (Non-binding)
- Add direct tests for `BookingWidget` submit/URL behavior.
- Add integration tests for `BookPageContent` CTA chain continuity.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `none`
- Deliverable acceptance package:
  - New test files + scoped validation evidence.
- Post-delivery measurement plan:
  - CI pass on `@apps/brikette` tests and no regressions in funnel smoke.

## Evidence Gap Review
### Gaps Addressed
- Closed all five queued dispatch gaps with concrete test artifacts.

### Confidence Adjustments
- Raised implementation confidence from dispatch baseline to >90% after adding all targeted tests and clearing type/lint gates.

### Remaining Assumptions
- CI execution remains pending for full runtime verification.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None.
- Recommended next step:
  - `/lp-do-plan brikette-funnel-test-hardening --auto`
