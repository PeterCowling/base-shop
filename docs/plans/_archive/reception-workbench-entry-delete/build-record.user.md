---
Status: Complete
Feature-Slug: reception-workbench-entry-delete
Completed-date: 2026-03-14
artifact: build-record
---

# Build Record: Workbench PMS Posting + Terminal Batch Delete

## Outcome Contract

- **Why:** Wrongly entered PMS postings and terminal batches could not be removed from the workbench. Staff had to leave erroneous entries in place.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** PMS postings and terminal batches can be deleted from the workbench.
- **Source:** operator

## Build Summary

Firebase IDs are now exposed alongside each entry by switching from array-index to `Object.entries` iteration in `usePmsPostings.ts` and `useTerminalBatches.ts`. Two new mutation functions — `removePmsPosting` and `removeTerminalBatch` — were added to their respective mutation hooks (`usePmsPostingsMutations.ts`, `useTerminalBatchesMutations.ts`) which call `remove()` on the matching Firebase ref. Delete buttons were added to each row in `ReconciliationWorkbench.tsx`, wired to the new mutations, and styled consistently with existing workbench controls.

## Engineering Coverage Evidence

- TypeScript validation passed: `pnpm --filter @apps/reception typecheck` — no errors.
- No new tests required: the mutations follow the exact same pattern as existing add mutations (same Firebase abstraction layer, same hook shape); the delete button render is straightforward UI with no conditional logic beyond what is already tested through the existing hook contract.

## Workflow Telemetry Summary

Telemetry recorded via `lp-do-ideas-record-workflow-telemetry`. Gaps are expected for micro-builds (no fact-find/plan stages).

| Module | Context Bytes |
|---|---:|
| .claude/skills/lp-do-build/modules/build-code.md | 4577 |

Gaps noted: stages lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan — expected (micro-build track). Token capture: not available (deterministic execution).
