---
Type: Micro-Build
Status: Active
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-workbench-entry-delete
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314161500-0009
Related-Plan: none
---

# PMS Posting + Terminal Batch Delete Micro-Build

## Scope
- Change: (a) expose Firebase key alongside each PMS posting and terminal batch; (b) add `removePmsPosting` and `removeTerminalBatch` mutations; (c) add delete buttons on workbench entry listing
- Non-goals: Edit/update existing entries, confirmation dialogs

## Execution Contract
- Affects:
  - `apps/reception/src/hooks/data/till/usePmsPostings.ts`
  - `apps/reception/src/hooks/data/till/useTerminalBatches.ts`
  - `apps/reception/src/hooks/mutations/usePmsPostingsMutations.ts`
  - `apps/reception/src/hooks/mutations/useTerminalBatchesMutations.ts`
  - `apps/reception/src/components/till/ReconciliationWorkbench.tsx`
- Acceptance checks:
  - Delete button visible next to each PMS posting and terminal batch in the workbench listing
  - Clicking delete removes the entry from Firebase
  - TypeScript passes
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`

## Outcome Contract
- **Why:** There was no way to correct a mistakenly entered PMS posting or terminal batch; staff had to manually edit Firebase or create a compensating entry.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can delete incorrect PMS posting or terminal batch entries directly from the workbench.
- **Source:** operator
