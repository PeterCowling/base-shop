---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI/API/Data
Workstream: Engineering
Created: 2026-03-05
Last-updated: 2026-03-05
Feature-Slug: reception-process-integrity-deploy-readiness-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tool-process-audit
Related-Plan: docs/plans/reception-process-integrity-deploy-readiness-hardening/plan.md
Trigger-Why: Operator requested forwarding all non-low reception re-audit issues through lp-do-ideas -> lp-do-build workflow.
Trigger-Intended-Outcome: type: operational | statement: Reception deploy-critical flows fail closed, cleanup invariants hold across multi-day stays, and endpoint/config coupling no longer depends on hardcoded values. | source: operator
---

# Reception Deploy Readiness Hardening Fact-Find

## Scope
### Summary
Convert remaining non-low reception audit findings into deploy-ready hardening changes with direct regression coverage.

### Goals
- Prevent staff-account lifecycle partial failures from leaving inconsistent operational state.
- Ensure guest deletion cleanup covers full stay ranges, not just check-in date.
- Enforce fail-closed behavior for non-throwing all-transactions mutation guards.
- Reject non-occupant keys in booking-email link derivation.
- Remove hardcoded deploy-sensitive endpoint constants from key flows.
- Surface setup-email failures explicitly in staff onboarding UI.
- Tighten Firebase env validation semantics for non-test execution.

### Non-goals
- Full auth-admin migration for server-side user deletion through service-account APIs.
- Rework of low-priority dead-path/process-drift items intentionally excluded by operator.

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/app/api/users/provision/route.ts`
- `apps/reception/src/hooks/mutations/useDeleteGuestFromBooking.ts`
- `apps/reception/src/hooks/mutations/useAllTransactionsMutations.ts`
- `apps/reception/src/services/useBookingEmail.ts`
- `apps/reception/src/utils/emailConstants.ts`
- `apps/reception/src/components/userManagement/StaffAccountsForm.tsx`
- `apps/reception/src/schemas/firebaseEnvSchema.ts`

### Key Findings
- Provision route could create auth user then fail profile write without rollback.
- Guest deletion cleanup was bounded to check-in date roomByDate path.
- All-transactions mutation used non-throwing early returns on critical guard failures.
- Booking-email guest ID derivation accepted non-occupant keys (for example `__notes`).
- Alloggiati/email endpoints used hardcoded fallback values with no env override path.
- Staff account creation could show success copy even when setup-email dispatch failed.
- Firebase env schema relaxed required fields under CI, weakening deployment-time validation.

## Suggested Task Seeds (Non-binding)
- TASK-01: Staff account lifecycle fail-closed hardening (rollback + access removal semantics).
- TASK-02: Multi-night occupant cleanup in delete-guest mutation.
- TASK-03: Fail-closed all-transactions guard behavior and tests.
- TASK-04: Booking-email occupant key validation hardening and tests.
- TASK-05: Config externalization for endpoint/test-recipient constants.
- TASK-06: Staff onboarding setup-email failure visibility and tests.
- TASK-07: Env schema strictness update for non-test execution.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan reception-process-integrity-deploy-readiness-hardening --auto`

