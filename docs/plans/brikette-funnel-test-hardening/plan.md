---
Type: Plan
Status: Complete
Domain: UI | QA
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-funnel-test-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 91%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
artifact: plan
---

# Brikette Funnel Test Hardening Plan

## Summary
This plan executed the queued funnel test hardening workstream end-to-end for dispatches `0112`-`0116`. The implementation added direct contract tests at high-risk seams (shared booking controls, recovery fallback behavior, apartment and sticky CTA handoff mapping) and expanded resilience-oriented Playwright coverage. The build also resolved lint blockers discovered during validation (`import/first` in a new test and hardcoded translation default handling in `SocialProofSection`). Scoped validation for `@apps/brikette` now passes with warnings-only lint output.

## Active tasks
- [x] TASK-01: Add `BookingCalendarPanel` direct contract tests
- [x] TASK-02: Add `useRecoveryResumeFallback` direct hook tests
- [x] TASK-03: Add apartment booking URL matrix tests (NR/Flex, 2/3 pax)
- [x] TASK-04: Add room-detail sticky CTA URL matrix tests (multi-room)
- [x] TASK-05: Add funnel resilience E2E coverage and fix introduced test/lint issues

## Goals
- Protect shared booking control behavior with direct assertions.
- Protect recovery resume side effects from silent regressions.
- Protect hardcoded handoff mapping contracts with matrix tests.
- Add resilience journey coverage for sold-out and API-failure cases.

## Non-goals
- Full test-suite execution locally.
- Refactor of booking architecture.

## Constraints & Assumptions
- Constraints:
  - Local policy prohibits running Jest/e2e suites.
  - Validation limited to scoped `typecheck`/`lint`.
- Assumptions:
  - CI will execute runtime tests and remains required final quality gate.

## Inherited Outcome Contract
- **Why:** Funnel breakage risk was concentrated in shared booking controls and handoff/resilience paths with no direct tests.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Add missing direct tests for shared booking controls, recovery fallback behavior, apartment and sticky CTA URL wiring, and booking resilience journeys, then pass scoped `typecheck` and `lint` gates.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brikette-funnel-test-hardening/fact-find.md`
- Key findings used:
  - Five dispatches mapped to five concrete testing tasks.
  - Shared component and resilience seams had highest revenue risk.

## Proposed Approach
- Option A:
  - Add broad tests first, then repair lint/type issues.
  - Pros: maximum test additions quickly.
  - Cons: validation churn and reruns.
- Option B:
  - Add tests per dispatch seam, clear blockers immediately, then run scoped validation gates.
  - Pros: deterministic progress and clean handoff.
  - Cons: slightly more sequencing overhead.
- Chosen approach:
  - Option B.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | BookingCalendarPanel direct contract tests | 92% | M | Complete (2026-03-02) | - | TASK-05 |
| TASK-02 | IMPLEMENT | useRecoveryResumeFallback direct hook tests | 92% | S | Complete (2026-03-02) | - | TASK-05 |
| TASK-03 | IMPLEMENT | ApartmentBookContent handoff URL matrix tests | 90% | M | Complete (2026-03-02) | - | TASK-05 |
| TASK-04 | IMPLEMENT | RoomDetailContent sticky URL matrix tests | 89% | M | Complete (2026-03-02) | - | TASK-05 |
| TASK-05 | IMPLEMENT | Resilience E2E tests + lint/type hardening | 90% | M | Complete (2026-03-02) | TASK-01,TASK-02,TASK-03,TASK-04 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04 | - | Independent dispatch-seam test additions |
| 2 | TASK-05 | TASK-01..TASK-04 | Resilience spec finalization + validation cleanup |

## Tasks

### TASK-01: Add `BookingCalendarPanel` direct contract tests
- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/test/components/booking-calendar-panel.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-02)
- **Affects:** `apps/brikette/src/test/components/booking-calendar-panel.test.tsx`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 92%
  - Implementation: 92% - deterministic component seam with mockable dependencies.
  - Approach: 92% - direct contract assertions at shared control boundary.
  - Impact: 93% - shared funnel control regressions now fail in tests.
- **Acceptance:**
  - Pax min/max clamp behavior asserted.
  - Date range change callback forwarding asserted.
  - Action slot render behavior asserted.
- **Validation contract (TC-01):**
  - TC-01: min/max button disabled behavior covered.
  - TC-02: increment/decrement callback payloads covered.
  - TC-03: range callback and rendered date labels covered.
- **Build evidence:** test file created with five contract tests.

### TASK-02: Add `useRecoveryResumeFallback` direct hook tests
- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/hooks/useRecoveryResumeFallback.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `apps/brikette/src/hooks/useRecoveryResumeFallback.test.ts`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 92%
  - Implementation: 94% - pure side-effect hook with explicit dependencies.
  - Approach: 92% - mocks isolate expiry vs valid-state branches.
  - Impact: 90% - stale resume regressions now surfaced by tests.
- **Acceptance:**
  - Expired resume path clears state and rewrites query.
  - Valid resume path does not mutate state or URL.
  - Prompt visibility return value behavior covered.
- **Validation contract (TC-02):**
  - TC-01: expired branch side effects asserted.
  - TC-02: valid branch no-op asserted.
  - TC-03: `showRebuildQuotePrompt` true/false branches asserted.
- **Build evidence:** test file created with four hook tests.

### TASK-03: Add apartment booking URL matrix tests (NR/Flex, 2/3 pax)
- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/test/components/apartment/apartment-booking-url-matrix.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-02)
- **Affects:** `apps/brikette/src/test/components/apartment/apartment-booking-url-matrix.test.tsx`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 90% - matrix assertions straightforward after dependency mocks.
  - Approach: 90% - explicit per-plan/per-pax table prevents silent mapping drift.
  - Impact: 90% - separate apartment revenue stream mapping protected.
- **Acceptance:**
  - All four combinations (`nr/flex x 2/3 pax`) assert room code and campaign values.
  - Handoff URL path/date/pax query assertions included.
- **Validation contract (TC-03):**
  - TC-01: room code per combination asserted.
  - TC-02: `utm_campaign` per combination asserted.
  - TC-03: canonical octorate calendar URL asserted.
- **Build evidence:** matrix test file created; lint issue fixed via `import/first` exemption comment.

### TASK-04: Add room-detail sticky CTA URL matrix tests (multi-room)
- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/test/components/room-detail-sticky-url-matrix.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-02)
- **Affects:** `apps/brikette/src/test/components/room-detail-sticky-url-matrix.test.tsx`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 89%
  - Implementation: 90% - sticky component seam already mock-friendly.
  - Approach: 88% - focused on URL mapping integrity without duplicating GA4 tests.
  - Impact: 89% - sticky CTA routing regressions now guarded across multiple rooms.
- **Acceptance:**
  - `room_10`, `room_11`, `room_12` mappings asserted against expected rate codes.
  - Sticky URL includes checkin/checkout and result endpoint.
- **Validation contract (TC-04):**
  - TC-01: per-room rate code mapping asserted.
  - TC-02: endpoint and date query parameters asserted.
- **Build evidence:** matrix test file created with parameterized assertions.

### TASK-05: Add funnel resilience E2E coverage and fix introduced test/lint issues
- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/e2e/availability-resilience.spec.ts` plus validation cleanup in touched files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-02)
- **Affects:** `apps/brikette/e2e/availability-resilience.spec.ts`, `apps/brikette/src/components/landing/SocialProofSection.tsx`, `apps/brikette/src/test/components/booking-calendar-panel.test.tsx`
- **Depends on:** TASK-01,TASK-02,TASK-03,TASK-04
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% - resilient journey scenarios added with controlled routing stubs.
  - Approach: 90% - targets sold-out, API-failure, and homepage-widget funnel traversal.
  - Impact: 90% - broader path-level resilience protection.
- **Acceptance:**
  - Sold-out availability scenario added.
  - `/api/availability` failure scenario added with handoff still navigable.
  - Homepage widget to `/book` to handoff traversal scenario added.
  - Validation blockers resolved (`import/first`, translation default literal, selector correctness, e2e syntax fix).
- **Validation contract (TC-05):**
  - TC-01: `pnpm --filter @apps/brikette typecheck` passes.
  - TC-02: `pnpm --filter @apps/brikette lint` passes (warnings-only).
  - TC-03: `pnpm --filter @apps/brikette exec eslint e2e/availability-resilience.spec.ts` passes.
- **Build evidence:** all three validation commands executed successfully.

## Risks & Mitigations
- CI-only runtime test execution pending.
  - Mitigation: run CI and inspect new test job results before promotion.

## Observability
- Logging:
  - `None: test-only changes`
- Metrics:
  - CI pass/fail for new tests.
- Alerts/Dashboards:
  - `None: existing CI notifications apply`

## Acceptance Criteria (overall)
- [x] Five queued dispatch scopes implemented.
- [x] New tests added for each scope.
- [x] Scoped `typecheck` and `lint` gates pass.

## Decision Log
- 2026-03-02: Consolidated dispatches `0112`-`0116` into one funnel hardening plan for single-cycle execution.

## Overall-confidence Calculation
- Weighted average by effort (`S=1`, `M=2`):
  - `(92*2 + 92*1 + 90*2 + 89*2 + 90*2) / 9 = 90.44%`
- Rounded plan confidence: **91%**.
