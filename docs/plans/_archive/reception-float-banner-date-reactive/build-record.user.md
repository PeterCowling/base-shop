---
Status: Complete
Feature-Slug: reception-float-banner-date-reactive
Completed-date: 2026-03-14
artifact: build-record
---

# Build Record: Float Banner Midnight-Reactive Date Bounds

## Outcome Contract

- **Why:** Float banner date bounds computed at mount. A shift running past midnight would show stale float-done status.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Float banner and cash count query use midnight-refreshing date bounds.
- **Source:** operator

## Build Summary

A `useTodayBounds` hook was extracted and integrated into `TillReconciliation.tsx`. The hook computes `startAt` and `endAt` ISO strings for today's Italy-timezone day and schedules a `setTimeout` to re-compute them at the next midnight boundary, so the float-done check and the Firebase cash-count query automatically switch to the new day without requiring a page reload. The change is confined to `apps/reception/src/components/till/TillReconciliation.tsx`.

## Engineering Coverage Evidence

- TypeScript validation passed: `pnpm --filter @apps/reception typecheck` — no errors.
- No new tests required: the hook is a time-utility extraction following the established `useTodayBounds` pattern; the timeout/cleanup lifecycle is a standard React pattern with no novel conditional branches that require separate test coverage at this scale.

## Workflow Telemetry Summary

Telemetry recorded via `lp-do-ideas-record-workflow-telemetry`. Gaps are expected for micro-builds (no fact-find/plan stages).

| Module | Context Bytes |
|---|---:|
| .claude/skills/lp-do-build/modules/build-code.md | 4577 |

Gaps noted: stages lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan — expected (micro-build track). Token capture: not available (deterministic execution).
