---
Type: Micro-Build
Status: Archived
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: reception-bar-menutype-dedup
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260309100000-0004
Related-Plan: none
---

# Reception Bar MenuType Dedup Micro-Build

## Scope
- Change:
  - Extract `MenuType` into one shared bar-domain types file and import it from all current consumers.
- Non-goals:
  - Changing menu-category semantics.
  - Bar UI or state-flow changes beyond the shared type location.

## Execution Contract
- Affects:
  - `apps/reception/src/components/bar/Bar.tsx`
  - `apps/reception/src/components/bar/HeaderControls.tsx`
  - `apps/reception/src/components/bar/orderTaking/OrderTakingContainer.tsx`
  - One new shared bar types module under `apps/reception/src/`
- Acceptance checks:
  - `MenuType` is declared once.
  - All three current consumers import the shared definition.
  - No runtime behavior changes.
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @apps/reception lint`
- Rollback note:
  - Revert the shared type extraction and restore local declarations.

## Outcome Contract
- **Why:** Three copies of the same type create drift risk whenever a menu category is added or renamed.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `MenuType` is defined once in a shared bar types file and imported by all current consumers.
- **Source:** operator
