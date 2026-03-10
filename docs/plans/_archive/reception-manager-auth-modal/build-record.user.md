---
Type: Build-Record
Status: Complete
Feature-Slug: reception-manager-auth-modal
Completed-date: 2026-03-09
artifact: build-record
---

# Build Record: ManagerAuthModal Extraction

## Outcome Contract

- **Why:** Duplicate manager-auth modal code means any UX or auth pattern change must be applied to two identical files — risk of divergence.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Single ManagerAuthModal component replaces both DrawerOverrideModal and VarianceSignoffModal copy-paste pair.
- **Source:** auto

## What Was Built

Extracted the shared manager-authentication modal body into a new `ManagerAuthModal` component at `apps/reception/src/components/till/ManagerAuthModal.tsx`. The component accepts all variable strings as props (`title`, `description`, `notePlaceholder`, `noteRequiredError`, `selfConflictError`, `submitLabel`, `successToast`, `shiftOwnerName`, `shiftOwnerUid`) plus optional `testIdPrefix` and `noteSuffix` (default `"note"`) for test-ID attribution. It contains all shared logic: email/password/note state, `verifyManagerCredentials`, self-conflict check (by UID or name), and `onConfirm` callback. Both `DrawerOverrideModal` and `VarianceSignoffModal` were rewritten as thin wrappers. `DrawerOverrideModal` passes `testIdPrefix="drawer-override"` and `noteSuffix="reason"` to preserve the existing `data-cy="drawer-override-reason"` test attribute.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/reception typecheck` | Pass | No type errors |
| `pnpm --filter @apps/reception lint` | Pass | No lint errors |

## Validation Evidence

- TypeScript: no errors on `pnpm --filter @apps/reception typecheck`
- Lint: clean on `pnpm --filter @apps/reception lint`
- Bug scan: 0 findings written to `bug-scan-findings.user.json`
- `data-cy="drawer-override-reason"` preserved via `noteSuffix="reason"` prop
- Self-conflict check logic and toast remain intact in shared component
- `withModalBackground` applied once (inside ManagerAuthModal) — wrappers do not double-wrap

## Scope Deviations

None.
