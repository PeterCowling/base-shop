---
Type: Build-Record
Status: Complete
Feature-Slug: reception-staff-accounts-lifecycle-permissions
Completed-date: 2026-03-09
artifact: build-record
---

# Build Record: Reception Staff Accounts Lifecycle & Permissions

## Outcome Contract

- **Why:** Staff access management needs full lifecycle controls; create-only flows leave operational gaps and force manual backend intervention for revocation and permission updates.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff Accounts screen supports account create/remove plus permission grant/revoke workflows through validated API paths and clear operator UX.
- **Source:** operator

## What Was Built

No new code change was required in this closure cycle. Repo audit confirmed the lifecycle and permission-management surface is already implemented. `apps/reception/src/components/userManagement/StaffAccountsForm.tsx` now lists current accounts, supports permission editing, and supports removal of staff access. `apps/reception/src/app/api/users/provision/route.ts` already exposes `GET`, `PATCH`, and `DELETE` flows for account listing, role updates, and deactivation-style staff-access removal, with audit writes and self-protection behavior. Existing route and UI tests already cover these behaviors.

## Tests Run

No new validation commands were required in this closure pass because the implementation was already present and unchanged. Closure is based on static repo evidence and existing test coverage.

## Validation Evidence

- `StaffAccountsForm.tsx` contains account list loading, role draft editing, permission save, and remove-staff-access UX
- `/api/users/provision/route.ts` already implements `GET`, `PATCH`, and `DELETE` handlers
- Route tests cover map-form role writes, permission updates, and access-removal behavior
- UI tests cover managed-account rendering and form interactions

## Scope Deviations

The implemented surface is narrower than the original plan language in one respect: removal is deactivation-style access revocation, not hard account deletion. That still satisfies the safe first-release intent described in the plan.
