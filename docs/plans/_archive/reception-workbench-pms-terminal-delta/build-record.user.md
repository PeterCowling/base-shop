---
Status: Complete
Feature-Slug: reception-workbench-pms-terminal-delta
Completed-date: 2026-03-14
artifact: build-record
---

# Build Record: Workbench PMS vs Terminal Delta Row

## Outcome Contract

- **Why:** Staff had to manually subtract PMS CC total from terminal batch total to spot discrepancies. The workbench showed no summary.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Workbench shows a "PMS vs Terminal" delta row so staff can spot CC discrepancies at a glance.
- **Source:** operator

## Build Summary

A new summary row was added to `ReconciliationWorkbench.tsx` that computes and displays the PMS card-payment total, the terminal batch total, and their delta side by side. The delta cell is styled green when the difference is zero and red otherwise, giving staff an immediate visual cue for card-payment discrepancies without manual arithmetic. The change is confined to `apps/reception/src/components/till/ReconciliationWorkbench.tsx`.

## Engineering Coverage Evidence

- TypeScript validation passed: `pnpm --filter @apps/reception typecheck` — no errors.
- No new tests required: the row is a derived display value computed from existing data already present in the component; no new data-fetching hooks, async paths, or business-logic branches were introduced.

## Workflow Telemetry Summary

Telemetry recorded via `lp-do-ideas-record-workflow-telemetry`. Gaps are expected for micro-builds (no fact-find/plan stages).

| Module | Context Bytes |
|---|---:|
| .claude/skills/lp-do-build/modules/build-code.md | 4577 |

Gaps noted: stages lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan — expected (micro-build track). Token capture: not available (deterministic execution).
