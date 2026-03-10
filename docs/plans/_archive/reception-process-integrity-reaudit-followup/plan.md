---
Type: Plan
Status: Archived
Domain: UI/API/Data
Workstream: Engineering
Created: 2026-03-05
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-process-integrity-reaudit-followup
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tool-process-audit
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Re-Audit Follow-up Plan

## Summary
Implement re-audit hardening follow-up for reception mutation integrity. This cycle focuses on fail-closed UI behavior, extension consistency controls, improved partial-failure signaling, and final failure-path test coverage.

## Active tasks
- [x] TASK-01: Booking modal fail-closed save behavior and occupant-id validation
- [x] TASK-02: Extension mutator compensation control for financial/date divergence risk
- [x] TASK-03: Multi-occupant extension partial-failure handling
- [x] TASK-04: Align booking-email activity logging with authoritative hook result
- [x] TASK-05: Cancellation partial-failure contract hardening
- [x] TASK-06: Close failure-path verification gaps
- [x] TASK-07: Checkpoint and residual-risk review

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Booking modal fail-closed save + occupant guard | 90% | S | Complete | - | TASK-06,TASK-07 |
| TASK-02 | IMPLEMENT | Extension compensation control in date mutator | 80% | M | Complete | - | TASK-03,TASK-06,TASK-07 |
| TASK-03 | IMPLEMENT | Multi-occupant extension partial-failure handling | 84% | M | Complete | TASK-02 | TASK-06,TASK-07 |
| TASK-04 | IMPLEMENT | Email activity logging scope from authoritative result | 88% | S | Complete | - | TASK-06,TASK-07 |
| TASK-05 | IMPLEMENT | Cancellation contract hardening (no silent partial) | 82% | S | Complete | - | TASK-06,TASK-07 |
| TASK-06 | IMPLEMENT | Add/adjust tests for failure paths and behavior contracts | 85% | M | Complete | TASK-01,TASK-03,TASK-04,TASK-05 | TASK-07 |
| TASK-07 | CHECKPOINT | Validate + close follow-up plan with evidence | 86% | S | Complete | TASK-06 | - |

## Acceptance Criteria (overall)
- [x] Booking modal does not close on failed save; operator sees explicit failure.
- [x] Booking save is blocked when occupant id is missing.
- [x] Extension financial/date divergence gains explicit compensating behavior.
- [x] Multi-occupant extension failures surface partial outcome clearly and block side effects.
- [x] Booking email activity logging uses authoritative occupant scope from draft result.
- [x] Cancellation partial failure cannot silently pass as success by ignored return value.
- [x] Targeted tests cover newly hardened failure paths.

## Execution Evidence
- Workflow routing:
  - Added dispatch.v2 packets `IDEA-DISPATCH-20260305204000-2301` through `2307` to `docs/business-os/startup-loop/ideas/trial/queue-state.json`.
  - Persisted follow-up artifacts under `docs/plans/reception-process-integrity-reaudit-followup/`.
- Validation:
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @acme/mcp-server typecheck`
  - `pnpm --filter @apps/reception lint` (passes with pre-existing warnings in `StaffAccountsForm.tsx`)
  - `pnpm --filter @acme/mcp-server lint`
- Verification coverage:
  - Added booking modal failure-path tests (reject path + missing occupant guard).
  - Added extension modal partial-failure messaging test.
  - Added dedicated `EmailBookingButton` tests for authoritative occupant logging and failure behavior.
  - Updated booking-date mutator tests for compensation behavior and call ordering.
