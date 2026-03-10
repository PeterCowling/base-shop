---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI/API/Data
Workstream: Engineering
Created: 2026-03-05
Last-updated: 2026-03-05
Feature-Slug: reception-process-integrity-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tool-process-audit
Related-Plan: docs/plans/_archive/reception-process-integrity-hardening/plan.md
Trigger-Why: Close high-impact reception process integrity gaps discovered in workflow audit issues 2-8 (false-success email reporting, weak cancellation verification, extension status drift, non-atomic booking mutations, financial write races, weak payload semantics, and missing verification coverage).
Trigger-Intended-Outcome: type: operational | statement: Reception mutations and draft-email flows become fail-closed for critical outcomes, enforce stronger request validation, and add regression coverage for every patched risk path. | source: operator
---

# Reception Process Integrity Hardening Fact-Find Brief

## Scope
### Summary
Implement and verify targeted hardening changes for reception issues 2-8 from the process audit, with emphasis on eliminating silent failures and making outcome reporting truthful.

### Goals
- Remove false-success behavior in booking email draft flow.
- Prevent status drift in cancellation and prime extension paths.
- Reduce partial-write and concurrent-write corruption risks in booking/financial mutations.
- Strengthen booking-email payload semantics.
- Add tests to close identified verification gaps.

### Non-goals
- Full event-sourcing redesign for reception bookings.
- Full cross-service financial ledger migration.

## Outcome Contract
- **Why:** Close high-impact reception process integrity gaps discovered in workflow audit issues 2-8.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception mutations and draft-email flows become fail-closed for critical outcomes, enforce stronger request validation, and add regression coverage for every patched risk path.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/components/checkins/EmailBookingButton.tsx`
- `apps/reception/src/hooks/mutations/useCancelBooking.ts`
- `apps/reception/src/hooks/mutations/usePrimeRequestResolution.ts`
- `apps/reception/src/hooks/mutations/useChangeBookingDatesMutator.ts`
- `apps/reception/src/hooks/mutations/useFinancialsRoomMutations.ts`
- `apps/reception/src/app/api/mcp/booking-email/route.ts`
- `packages/mcp-server/src/tools/booking-email.ts`

### Key Findings
- Booking email send path swallows failures while caller reports success.
- Cancellation flow does not enforce activity/email result verification.
- Prime request status can advance after failed booking-date mutation.
- Booking date mutator performs sequential writes across dependent nodes.
- Financial room mutator uses read-merge-write (race risk).
- Booking email payload validation is syntactic only (`occupantLinks` not URL-validated).
- Test coverage lacks critical integration assertions for these flows.

## Suggested Task Seeds (Non-binding)
- TASK-01: Booking email truthfulness + UI feedback correctness.
- TASK-02: Cancellation result verification contract.
- TASK-03: Prime extension fail-closed status update.
- TASK-04: Atomic booking date mutation consolidation.
- TASK-05: Financial mutation concurrency hardening.
- TASK-06: Booking email semantic validation hardening.
- TASK-07: Verification coverage closure.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `tool-process-audit`
- Deliverable acceptance package:
  - Updated reception hooks/routes + targeted regression tests.
- Post-delivery measurement plan:
  - N/A for this code hardening cycle.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan reception-process-integrity-hardening --auto`
