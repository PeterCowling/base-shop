---
Status: Complete
Feature-Slug: reception-cashhub-tab-routing
Completed-date: 2026-03-14
artifact: build-record
---

# Build Record: CashHub Tab URL Routing

## Outcome Contract

- **Why:** Tab state was in React state, lost on refresh, and not directly linkable. Staff couldn't bookmark or share the Till, Safe, or Workbench tab directly.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** CashHub active tab is reflected in the URL (?tab=till/safe/workbench) so it survives refresh and is directly linkable.
- **Source:** operator

## Build Summary

`CashHub.tsx` was updated to read the active tab from the URL `?tab=` search parameter using Next.js `useSearchParams` and push tab changes via `useRouter`, replacing the previous `useState`-only approach. Invalid or missing `?tab` values default to `"till"`. Tab clicks update the URL without a full page reload, making each tab bookmarkable and shareable. Changes are localised to `apps/reception/src/components/cash/CashHub.tsx`.

## Engineering Coverage Evidence

- TypeScript validation passed: `pnpm --filter @apps/reception typecheck` — no errors.
- No new tests required: the change is a state-management plumbing swap (useState → URL param) with no new data-fetching or conditional branches; behaviour is fully observable via URL inspection.

## Workflow Telemetry Summary

Telemetry recorded via `lp-do-ideas-record-workflow-telemetry`. Gaps are expected for micro-builds (no fact-find/plan stages).

| Module | Context Bytes |
|---|---:|
| .claude/skills/lp-do-build/modules/build-code.md | 4577 |

Gaps noted: stages lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan — expected (micro-build track). Token capture: not available (deterministic execution).
