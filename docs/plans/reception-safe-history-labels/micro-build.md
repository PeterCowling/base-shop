---
Type: Micro-Build
Status: Active
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-safe-history-labels
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314161500-0004
Related-Plan: none
---

# Safe History Type Labels + Stable Expand Key Micro-Build

## Scope
- Change: (a) Add a `SAFE_TYPE_LABEL` map to render human-readable labels instead of raw camelCase DB type strings; (b) switch `expandedRows` from index-based to stable-key-based so expanding a row survives data reloads
- Non-goals: Sorting, filtering, or pagination of safe history

## Execution Contract
- Affects: `apps/reception/src/components/safe/SafeManagement.tsx`
- Acceptance checks:
  - Safe history table "Type" column shows human-readable labels (e.g. "Bank Deposit" not "bankDeposit")
  - Expanding a row detail does not shift to wrong row when list refreshes
  - TypeScript passes with no new errors
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`
- Rollback note: Revert the SAFE_TYPE_LABEL map and expandedRows key changes in SafeManagement.tsx

## Outcome Contract
- **Why:** Raw camelCase DB strings ("bankDeposit", "pettyWithdrawal", "safeReset") are not legible to reception staff; index-based row expansion shows wrong details when list ordering changes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Safe history type column shows plain English labels; "View Details" always expands the correct row regardless of data reload order.
- **Source:** operator
