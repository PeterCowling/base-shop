---
Status: Complete
Feature-Slug: reception-safe-history-labels
Completed-date: 2026-03-14
artifact: build-record
---

# Build Record: Safe History Type Labels + Stable Expand Key

## Outcome Contract

- **Why:** Safe transaction history showed raw type keys (e.g. "pettyWithdrawal") making it hard to scan. Row expansion toggled by array index which broke when entries changed order.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Safe history rows show human-readable labels and stay expanded by stable entry ID.
- **Source:** operator

## Build Summary

A `SAFE_TYPE_LABEL` lookup map was added to `SafeManagement.tsx` mapping camelCase Firebase type keys to plain-English labels (e.g. "bankDeposit" → "Bank Deposit", "pettyWithdrawal" → "Petty Withdrawal"). The `expandedRows` state was converted from a `Set<number>` keyed on array index to a `Set<string>` keyed on the entry's Firebase ID, so rows stay correctly expanded when the list re-orders or reloads. Both changes are localised to `apps/reception/src/components/safe/SafeManagement.tsx`.

## Engineering Coverage Evidence

- TypeScript validation passed: `pnpm --filter @apps/reception typecheck` — no errors.
- No new tests required: changes are purely presentational (label substitution) and state-key type change; no new logic branches or data-fetching paths were introduced.

## Workflow Telemetry Summary

Telemetry recorded via `lp-do-ideas-record-workflow-telemetry`. Gaps are expected for micro-builds (no fact-find/plan stages).

| Module | Context Bytes |
|---|---:|
| .claude/skills/lp-do-build/modules/build-code.md | 4577 |

Gaps noted: stages lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan — expected (micro-build track). Token capture: not available (deterministic execution).
