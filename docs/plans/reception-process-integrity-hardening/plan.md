---
Type: Plan
Status: Complete
Domain: UI/API/Data
Workstream: Engineering
Created: 2026-03-05
Last-reviewed: 2026-03-05
Last-updated: 2026-03-05
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-process-integrity-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tool-process-audit
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Process Integrity Hardening Plan

## Summary
This plan operationalizes process-audit issues 2-8 for the reception app. The work hardens outcome truthfulness (no false success signals), enforces fail-closed behavior in critical mutation workflows, improves write integrity under partial/concurrent conditions, tightens booking-email payload semantics, and closes verification gaps with targeted regression tests.

## Active tasks
- [x] TASK-01: Fix booking email false-success path and caller feedback
- [x] TASK-02: Enforce cancellation activity outcome verification
- [x] TASK-03: Make extension resolution fail-closed on booking-date mutation failures
- [x] TASK-04: Consolidate booking-date mutation writes into atomic multi-path update
- [x] TASK-05: Harden financials room writes for concurrency safety
- [x] TASK-06: Strengthen booking-email semantic payload validation
- [x] TASK-07: Close verification coverage gaps for issues 2-8

## Goals
- Prevent silent or misleading success states in reception workflows.
- Ensure status transitions reflect real mutation outcomes.
- Reduce data integrity risks from split writes and concurrent updates.
- Add focused tests for high-risk paths.

## Non-goals
- Full architecture rewrite to event sourcing.
- Broader domain redesign outside reception risk items 2-8.

## Constraints & Assumptions
- Constraints:
  - Keep changes scoped to reception and directly coupled MCP tool schema where needed.
  - Use targeted validations only.
- Assumptions:
  - Existing behavior in unrelated apps/packages must remain unchanged.

## Inherited Outcome Contract
- **Why:** Close high-impact reception process integrity gaps discovered in workflow audit issues 2-8.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception mutations and draft-email flows become fail-closed for critical outcomes, enforce stronger request validation, and add regression coverage for every patched risk path.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-process-integrity-hardening/fact-find.md`
- Key findings used:
  - False-success booking email behavior in UI + hook.
  - Missing cancellation verification and extension status gating.
  - Non-atomic booking-date writes and financial race risk.
  - Weak booking-email payload semantics and missing tests.

## Proposed Approach
- Option A: Incremental hardening in existing hooks/routes with targeted tests.
- Option B: Broader architecture refactor.
- Chosen approach: Option A (bounded, high-value, low regression risk).

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Booking email truthfulness + UI feedback | 90% | S | Complete | - | TASK-02,TASK-06,TASK-07 |
| TASK-02 | IMPLEMENT | Cancellation outcome verification | 85% | M | Complete | TASK-01 | TASK-07 |
| TASK-03 | IMPLEMENT | Fail-closed prime extension status transition | 85% | M | Complete | - | TASK-07 |
| TASK-04 | IMPLEMENT | Atomic booking-date multi-path write | 82% | M | Complete | TASK-03 | TASK-07 |
| TASK-05 | IMPLEMENT | Concurrency-safe financials write semantics | 80% | M | Complete | - | TASK-07 |
| TASK-06 | IMPLEMENT | Booking email semantic payload validation | 88% | S | Complete | TASK-01 | TASK-07 |
| TASK-07 | CHECKPOINT | Verification closure and residual risk check | 85% | S | Complete | TASK-02,TASK-03,TASK-04,TASK-05,TASK-06 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03, TASK-05 | - | Independent foundations |
| 2 | TASK-02, TASK-04, TASK-06 | Wave 1 | Depends on behavior contracts from wave 1 |
| 3 | TASK-07 | Wave 2 | Verification checkpoint |

## Tasks
### TASK-01 — Fix booking email false-success path and caller feedback
- Type: IMPLEMENT
- Execution-Skill: lp-do-build
- Affects: `apps/reception/src/services/useBookingEmail.ts`, `apps/reception/src/components/checkins/EmailBookingButton.tsx`, `apps/reception/src/services/__tests__/useBookingEmail.test.ts`

### TASK-02 — Enforce cancellation activity outcome verification
- Type: IMPLEMENT
- Execution-Skill: lp-do-build
- Affects: `apps/reception/src/hooks/mutations/useCancelBooking.ts`, `apps/reception/src/hooks/mutations/__tests__/useCancelBooking.test.ts`

### TASK-03 — Make extension resolution fail-closed on booking-date mutation failures
- Type: IMPLEMENT
- Execution-Skill: lp-do-build
- Affects: `apps/reception/src/hooks/mutations/useChangeBookingDatesMutator.ts`, `apps/reception/src/hooks/mutations/usePrimeRequestResolution.ts`, `apps/reception/src/hooks/mutations/__tests__/usePrimeRequestResolution.test.ts`, `apps/reception/src/hooks/mutations/__tests__/useChangeBookingDatesMutator.test.ts`

### TASK-04 — Consolidate booking-date mutation writes into atomic multi-path update
- Type: IMPLEMENT
- Execution-Skill: lp-do-build
- Affects: `apps/reception/src/hooks/mutations/useChangeBookingDatesMutator.ts`, `apps/reception/src/hooks/mutations/__tests__/useChangeBookingDatesMutator.test.ts`

### TASK-05 — Harden financials room writes for concurrency safety
- Type: IMPLEMENT
- Execution-Skill: lp-do-build
- Affects: `apps/reception/src/hooks/mutations/useFinancialsRoomMutations.ts`, `apps/reception/src/hooks/mutations/__tests__/useFinancialsRoomMutations.test.ts`

### TASK-06 — Strengthen booking-email semantic payload validation
- Type: IMPLEMENT
- Execution-Skill: lp-do-build
- Affects: `apps/reception/src/app/api/mcp/booking-email/route.ts`, `packages/mcp-server/src/tools/booking-email.ts`, `apps/reception/src/app/api/mcp/__tests__/booking-email.route.test.ts`, `packages/mcp-server/src/__tests__/booking-email.test.ts`

### TASK-07 — Verification closure and residual risk check
- Type: CHECKPOINT
- Execution-Skill: lp-do-build
- Affects: `docs/plans/reception-process-integrity-hardening/plan.md`

## Risks & Mitigations
- Risk: behavior changes in hook return contracts.
  - Mitigation: update call site(s) + targeted tests.
- Risk: transaction semantics may alter mocks/test harness behavior.
  - Mitigation: update unit tests to new Firebase operation path.

## Acceptance Criteria (overall)
- [x] Booking email UI cannot report success when draft creation fails.
- [x] Cancellation flow surfaces occupant-level activity failures (no silent pass).
- [x] Prime extension status cannot advance after date mutation failure.
- [x] Booking date writes use single atomic multi-path update for non-financial nodes.
- [x] Financial room writes use concurrency-safe update semantics.
- [x] Booking email schemas enforce URL-form occupant links.
- [x] Regression tests added/updated for patched paths.

## Decision Log
- 2026-03-05: Prioritize bounded hardening over full architecture rewrite to ship risk reduction now.
- 2026-03-05: Completed issues 2-8 hardening via lp-do-ideas dispatch set and lp-do-build execution cycle.

## Execution Evidence
- Workflow routing:
  - Added dispatch.v2 packets `IDEA-DISPATCH-20260305164000-2201` through `2207` to `docs/business-os/startup-loop/ideas/trial/queue-state.json`.
  - Persisted fact-find and plan artifacts under `docs/plans/reception-process-integrity-hardening/`.
- Validation:
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @acme/mcp-server typecheck`
  - `pnpm --filter @apps/reception lint` (passes with pre-existing warnings in `StaffAccountsForm.tsx`)
  - `pnpm --filter @acme/mcp-server lint`
- Verification coverage updates:
  - Added/updated targeted tests for booking email truthfulness, cancellation partial-failure surfacing, prime-extension fail-closed status, atomic booking-date write shape, financial transaction semantics, and URL payload validation.

## Overall-confidence Calculation
- Weighted confidence (S=1, M=2):
  - (90*1 + 85*2 + 85*2 + 82*2 + 80*2 + 88*1 + 85*1) / 11 = 85.2% ~ 86%
