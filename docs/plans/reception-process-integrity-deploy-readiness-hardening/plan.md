---
Type: Plan
Status: Complete
Domain: UI/API/Data
Workstream: Engineering
Created: 2026-03-05
Last-reviewed: 2026-03-05
Last-updated: 2026-03-05
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-process-integrity-deploy-readiness-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tool-process-audit
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Deploy Readiness Hardening Plan

## Summary
Executed the non-low reception re-audit findings requested by the operator, excluding the explicitly deferred low-priority dead-path/process-drift item.

## Active tasks
- [x] TASK-01: Staff account lifecycle fail-closed hardening.
- [x] TASK-02: Multi-night guest deletion cleanup coverage for checkins/checkouts/roomByDate.
- [x] TASK-03: Fail-closed all-transactions mutation guard behavior.
- [x] TASK-04: Booking-email occupant ID derivation hardening (`__notes` exclusion).
- [x] TASK-05: Deploy config externalization for endpoint/test-recipient constants.
- [x] TASK-06: Staff onboarding setup-email failure visibility hardening.
- [x] TASK-07: Firebase env schema strictness hardening for non-test execution.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Roll back auth user on profile-write failure; remove staff access via role revocation semantics | 86% | M | Complete (2026-03-05) | - | TASK-06 |
| TASK-02 | IMPLEMENT | Ensure occupant deletion cleanup spans stay date range; fallback to full scans if dates missing | 90% | M | Complete (2026-03-05) | - | - |
| TASK-03 | IMPLEMENT | Convert non-throwing all-transactions guard returns into fail-closed throws + tests | 88% | S | Complete (2026-03-05) | - | - |
| TASK-04 | IMPLEMENT | Validate booking payload with booking schema and ignore `__notes` key for link generation | 90% | S | Complete (2026-03-05) | - | - |
| TASK-05 | IMPLEMENT | Externalize Alloggiati/email constants and server Firebase env aliases | 85% | S | Complete (2026-03-05) | - | TASK-01 |
| TASK-06 | IMPLEMENT | Surface setup-email dispatch failures in staff-account creation flow + test | 87% | S | Complete (2026-03-05) | TASK-01 | - |
| TASK-07 | IMPLEMENT | Enforce strict Firebase env validation outside test mode | 86% | S | Complete (2026-03-05) | - | - |

## Acceptance Criteria
- [x] Provision flow no longer leaves a newly-created auth user without rollback when profile write fails.
- [x] Staff removal semantics do not hard-delete profile records into orphan state; managed-role visibility is filtered.
- [x] Guest deletion removes occupant references across full booking-date span (or full-node fallback when date metadata is absent).
- [x] All-transactions critical guard failures fail closed via thrown errors.
- [x] Booking-email link derivation ignores non-occupant keys such as `__notes`.
- [x] Alloggiati + booking-email runtime endpoints support environment overrides.
- [x] Staff account setup email failures are visible and retryable from UI.
- [x] Firebase env schema enforces required non-empty values for non-test runtime.

## Execution Evidence
- Dispatch:
  - `docs/plans/reception-process-integrity-deploy-readiness-hardening/dispatch.v2.json`
- Code updates:
  - `apps/reception/src/app/api/users/provision/route.ts`
  - `apps/reception/src/app/api/mcp/_shared/staff-auth.ts`
  - `apps/reception/src/app/api/statistics/yoy/route.ts`
  - `apps/reception/src/hooks/mutations/useDeleteGuestFromBooking.ts`
  - `apps/reception/src/hooks/mutations/useAllTransactionsMutations.ts`
  - `apps/reception/src/services/useBookingEmail.ts`
  - `apps/reception/src/services/alloggiatiService.ts`
  - `apps/reception/src/utils/emailConstants.ts`
  - `apps/reception/src/components/userManagement/StaffAccountsForm.tsx`
  - `apps/reception/src/components/ServiceWorkerRegistration.tsx`
  - `apps/reception/src/schemas/firebaseEnvSchema.ts`
  - `apps/reception/.env.example`
  - `.gitignore`
  - `apps/reception/database-debug.log` (deleted)
- Verification updates:
  - `apps/reception/src/app/api/users/provision/__tests__/route.test.ts`
  - `apps/reception/src/hooks/mutations/__tests__/useDeleteGuestFromBooking.test.ts`
  - `apps/reception/src/hooks/mutations/__tests__/useAllTransactionsMutations.test.ts`
  - `apps/reception/src/services/__tests__/useBookingEmail.test.ts`
  - `apps/reception/src/components/userManagement/__tests__/StaffAccountsForm.test.tsx`
- Validation:
  - `pnpm --filter @apps/reception typecheck` (pass)
  - `pnpm --filter @apps/reception lint` (pass with existing DS warnings in `StaffAccountsForm.tsx`)
  - `pnpm --filter @apps/reception build` (pass)

## Explicitly Deferred
- Per operator instruction, keep low-priority dead-path/process-drift item unchanged:
  - placeholder mutation in `useConfirmOrder.ts`
  - duplicate legacy `_useDeleteGuestFromBooking.ts`
  - README dead-flag note

## Next Build Step
- Completed for this cycle.

