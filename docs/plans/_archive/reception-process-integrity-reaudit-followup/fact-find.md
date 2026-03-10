---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI/API/Data
Workstream: Engineering
Created: 2026-03-05
Last-updated: 2026-03-05
Feature-Slug: reception-process-integrity-reaudit-followup
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tool-process-audit
Related-Plan: docs/plans/_archive/reception-process-integrity-reaudit-followup/plan.md
Trigger-Why: Implement re-audit findings that still permit silent failure, partial commit ambiguity, and financial consistency risk in reception mutation workflows.
Trigger-Intended-Outcome: type: operational | statement: Reception mutation paths become fail-closed at UI boundaries, extension financial consistency gains compensating controls, and verification coverage closes remaining failure-path gaps. | source: operator
---

# Reception Re-Audit Follow-up Fact-Find Brief

## Scope
### Summary
Harden remaining high-risk reception paths identified in the re-audit after issues 2-8 rollout.

### Goals
- Prevent modal-level false success on booking date save failures.
- Remove invalid occupant-id fallback writes.
- Reduce extension mutation/financial mismatch risk with compensating controls.
- Reduce partial-commit ambiguity in multi-occupant extension flow.
- Align booking-email activity logging with authoritative recipient/occupant outcome.
- Close remaining test coverage gaps on failure paths.

### Non-goals
- Full backend rewrite of reception mutations to server-owned command handlers.
- Event-sourcing migration.

## Outcome Contract
- **Why:** Re-audit still finds silent-failure and consistency gaps in critical mutation flows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception mutation paths become fail-closed at UI boundaries, extension financial consistency gains compensating controls, and verification coverage closes remaining failure-path gaps.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/components/checkins/header/BookingModal.tsx`
- `apps/reception/src/components/man/modals/ExtensionPayModal.tsx`
- `apps/reception/src/hooks/mutations/useChangeBookingDatesMutator.ts`
- `apps/reception/src/components/checkins/EmailBookingButton.tsx`
- `apps/reception/src/services/useBookingEmail.ts`
- `apps/reception/src/hooks/mutations/useCancelBooking.ts`

### Key Findings
- Booking modal closes without awaiting mutation success.
- Missing occupant ID can write into `unknown_occupant` path.
- Extension date + financial operations are split and can diverge; no compensation path.
- Multi-occupant extension flow can partially succeed without explicit partial-result handling.
- Email-draft activity logging currently uses local email-map scope, not authoritative hook result scope.
- Failure-path verification remains incomplete.

## Suggested Task Seeds (Non-binding)
- TASK-01: Booking modal fail-closed save UX + occupant-id validation.
- TASK-02: Extension mutator financial compensation control.
- TASK-03: Multi-occupant extension partial-failure handling.
- TASK-04: Authoritative email activity logging scope.
- TASK-05: Cancellation partial-failure contract hardening.
- TASK-06: Verification closure for follow-up paths.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan reception-process-integrity-reaudit-followup --auto`
