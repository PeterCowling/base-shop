---
Type: Build-Record
Status: Complete
Feature-Slug: reception-staff-accounts-pete-only-access
Completed-date: 2026-03-09
artifact: build-record
---

# Build Record: Reception Staff Accounts Pete-Only Access

## Outcome Contract

- **Why:** User-account provisioning is high-risk; the operator requested strict ownership control to prevent unauthorized account or permission changes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff Accounts actions are restricted to the Pete account under a clear, testable access policy with denied users blocked from executing management operations.
- **Source:** operator

## What Was Built

No new code change was required in this closure cycle. Repo audit confirmed the Pete-only access policy is already implemented. The shared identity policy helper lives in `apps/reception/src/lib/staffAccountsAccess.ts` and supports configured uid/email allowlists. The UI enforces the policy in `apps/reception/src/components/userManagement/StaffAccountsForm.tsx`, the admin navigation enforces it in `apps/reception/src/hoc/withIconModal.tsx` and `apps/reception/src/components/appNav/AppNav.tsx`, and the server-authoritative gate enforces it in `apps/reception/src/app/api/users/provision/route.ts`. Existing tests cover allow/deny behavior in the route, UI, and modal layers.

## Tests Run

No new validation commands were required in this closure pass because the implementation was already present and unchanged. Closure is based on static repo evidence and existing test coverage.

## Validation Evidence

- `isStaffAccountsPeteIdentity(...)` exists in `apps/reception/src/lib/staffAccountsAccess.ts`
- `StaffAccountsForm.tsx` blocks non-Pete identities with a clear denial state
- `/api/users/provision` rejects non-Pete callers server-side
- `withIconModal` and `AppNav` hide Pete-only Staff Accounts entry points for non-Pete identities
- Existing tests cover route, UI, and modal Pete-only behavior

## Scope Deviations

The original fact-find treated canonical Pete identity key and break-glass policy as blocking governance inputs. The implementation proceeded with a configurable allowlist helper and email fallback, so the remaining gap is governance hardening, not feature absence.
