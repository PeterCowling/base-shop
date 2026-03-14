---
Status: Complete
Feature-Slug: reception-keycard-return-error
Completed-date: 2026-03-14
artifact: build-record
---

# Build Record: Keycard Return Error Visibility

## Outcome Contract

- **Why:** Keycard return failures were sometimes silently swallowed when the error message didn't match "return failed".
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All keycard return failures surface a toast notification to the user.
- **Source:** operator

## Build Summary

The `handleReturn` catch block in `SafeManagement.tsx` was simplified to always show a toast error when a keycard return attempt fails, removing the conditional check that previously gated the toast on a specific error message string. Any exception or false return from `returnKeycardsToSafe` now unconditionally calls the toast handler so staff always see feedback when the operation does not complete.

## Engineering Coverage Evidence

- TypeScript validation passed: `pnpm --filter @apps/reception typecheck` — no errors.
- No new tests required: the change removes a conditional guard — it simplifies a single catch block with no new logic branches introduced.

## Workflow Telemetry Summary

Telemetry recorded via `lp-do-ideas-record-workflow-telemetry`. Gaps are expected for micro-builds (no fact-find/plan stages).

| Module | Context Bytes |
|---|---:|
| .claude/skills/lp-do-build/modules/build-code.md | 4577 |

Gaps noted: stages lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan — expected (micro-build track). Token capture: not available (deterministic execution).
