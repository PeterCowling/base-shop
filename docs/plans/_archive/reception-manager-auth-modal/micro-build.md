---
Type: Micro-Build
Status: Archived
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: reception-manager-auth-modal
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260309143500-0002
Related-Plan: none
---

# ManagerAuthModal Extraction Micro-Build

## Scope
- Change: Extract shared `ManagerAuthModal` component from `DrawerOverrideModal` and `VarianceSignoffModal`. Both components share the same manager-auth form structure (email, password, note field, verifyManagerCredentials, self-conflict check). New component lives at `apps/reception/src/components/till/ManagerAuthModal.tsx`. Both originals become thin wrappers that adapt the generic callback to their specific result types.
- Non-goals: changing caller interfaces, changing visual design, changing test files, adding new features.

## Execution Contract
- Affects:
  - `apps/reception/src/components/till/ManagerAuthModal.tsx` (new)
  - `apps/reception/src/components/till/DrawerOverrideModal.tsx`
  - `apps/reception/src/components/till/VarianceSignoffModal.tsx`
- Acceptance checks:
  - TypeScript compiles with no errors
  - DrawerOverrideModal tests continue to pass (data-cy attrs preserved via testIdPrefix)
  - Lint passes
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @apps/reception lint`
- Rollback note: Revert the three file edits.

## Outcome Contract
- **Why:** Duplicate manager-auth modal code means any UX or auth pattern change must be applied to two identical files — risk of divergence.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Single ManagerAuthModal component replaces both DrawerOverrideModal and VarianceSignoffModal copy-paste pair.
- **Source:** auto
