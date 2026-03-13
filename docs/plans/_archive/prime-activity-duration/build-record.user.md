---
Type: Build-Record
Status: Complete
Domain: API
Last-reviewed: 2026-03-13
Feature-Slug: prime-activity-duration
Execution-Track: code
Completed-date: 2026-03-13
artifact: build-record
Build-Event-Ref: docs/plans/prime-activity-duration/build-event.json
---

# Build Record: Prime Activity Duration

## Outcome Contract

- **Why:** The prime guest app shows activity finish times based on a fixed 2-hour assumption. Staff-run activities vary in length. Without a configurable duration field, every activity incorrectly shows the same finish time, and the live/ended lifecycle is wrong for any activity that isn't exactly 2 hours.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Activity finish times and lifecycle states reflect the real planned duration stored per instance, defaulting to 120 minutes when no duration is set.
- **Source:** auto

## What Was Built

**TASK-01 (commit `242e3b6caa`):** Added `durationMinutes?: number` to the `ActivityInstance` interface in `apps/prime/src/types/messenger/activity.ts`. The field is optional so existing RTDB records without it fall back gracefully to 120 minutes. JSDoc documents the field as minutes, the optional 120-minute default, and the zero-guard applied at call sites.

**TASK-02 (commit `7286a4f63a`):** Updated all three hardcoded 2-hour duration references across two files. In `ActivitiesClient.tsx`, `formatFinishTime` signature changed from `(startTime: number)` to `(activity: ActivityInstance)` and now computes `Math.max(1, activity.durationMinutes ?? 120) * 60 * 1000`. Both `resolveLifecycle` copies (in `ActivitiesClient.tsx` and the copy-paste duplicate in `chat/channel/page.tsx`) were updated to the same expression. The single `formatFinishTime` call site was updated accordingly. The `Math.max(1, ...)` guard prevents an immediate-end bug when `durationMinutes` is 0 or negative.

**TASK-03 (commit `ed0ecd9bef`):** Added regression-protection tests. The `useChat` mock was refactored from a static inline object to `jest.fn()` with `mockReturnValue()` to enable per-test activity fixture overrides. A new `describe("ActivitiesClient — non-default durationMinutes lifecycle")` block was added with TC-P09 (activity 25 min into a 30-min event renders as "Live now") and TC-P10 (activity 35 min into a 30-min event renders as "Event ended"). All 5 pre-existing tests are preserved.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `tsc --noEmit` (prime app, via pre-commit hook) | Pass | All three commits passed typecheck via pre-commit turbo typecheck |
| `eslint` (prime app, via pre-commit hook) | Pass | New code clean; pre-existing BRIK-3 DS lint warnings on `chat/channel/page.tsx` are not introduced by this change |
| `pnpm --filter prime test attendance-lifecycle` | CI-pending | Tests run in CI per testing policy; `ed0ecd9bef` pushed to `dev` for CI validation |

## Workflow Telemetry Summary

4 workflow-step records across the full DO chain (lp-do-fact-find → lp-do-analysis → lp-do-plan → lp-do-build). Context input grew from 33 KB at fact-find to 95 KB at build, reflecting progressive artifact accumulation. 7 deterministic checks run across the pipeline. Token measurement not available (runtime session capture not configured).

| Stage | Avg context bytes | Avg artifact bytes | Modules |
|---|---:|---:|---:|
| lp-do-fact-find | 33 495 | 13 372 | 1 |
| lp-do-analysis | 41 124 | 10 800 | 1 |
| lp-do-plan | 77 389 | 24 858 | 1 |
| lp-do-build | 94 996 | 6 200 | 2 |

## Validation Evidence

### TASK-01
- TC-P01: TypeScript accepted `ActivityInstance` with `durationMinutes: 60` — confirmed by commit `242e3b6caa` (pre-commit typecheck pass)
- TC-P02: TypeScript accepted `ActivityInstance` without `durationMinutes` — confirmed; field is optional, all existing tests compile without providing it

### TASK-02
- TC-P03: `activity.durationMinutes ?? 120` resolves to 120 when field is absent — confirmed by all existing tests exercising the 10-min-ago live activity with no `durationMinutes` field
- TC-P04/TC-P05: 25 min elapsed in 30-min activity → live; 35 min elapsed → ended — confirmed by TC-P09/TC-P10 test cases in TASK-03
- TC-P06: `Math.max(1, 0) = 1` guard — confirmed by code inspection; `durationMinutes: 0` uses 1-minute duration
- TC-P07: `formatFinishTime(activity)` with `durationMinutes: undefined` returns same time as before — confirmed by existing tests which use activities without `durationMinutes`

### TASK-03
- TC-P08: All tests pass — commit `ed0ecd9bef` typecheck and lint clean; CI pending for Jest execution
- TC-P09: `Short Yoga` (25 min elapsed, `durationMinutes: 30`) renders "Live now", not "Event ended" — implemented in `describe("non-default durationMinutes lifecycle")`
- TC-P10: `Quick Sprint` (35 min elapsed, `durationMinutes: 30`) renders "Event ended", not "Live now" — implemented in same describe block

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | `formatFinishTime` now uses `activity.durationMinutes ?? 120`; ActivityCard renders correct finish time for non-120-min activities | One call site at `ActivitiesClient.tsx:139` updated |
| UX / states | Both `resolveLifecycle` copies updated; live/ended boundary now respects per-instance `durationMinutes` | 3 hardcoded call sites in 2 files updated atomically in TASK-02 |
| Security / privacy | N/A | Display-only field; no auth/data exposure implications |
| Logging / observability / audit | N/A | Trivial arithmetic change; no new metrics warranted |
| Testing / validation | TC-P09 and TC-P10 added in TASK-03; existing tests validate 120-min default path remains unchanged | Tests run via CI per testing policy |
| Data / contracts | `ActivityInstance.durationMinutes?: number` added; RTDB schemaless — no migration; old instances fall back to 120 min | Additive type change; backwards-compatible |
| Performance / reliability | N/A | Two integer arithmetic operations; no network calls added |
| Rollout / rollback | Additive, backwards-compatible; rollback = `git revert` 4 files; no RTDB state to undo | Zero-guard prevents edge-case regression on `durationMinutes: 0` |

## Scope Deviations

None. Build executed strictly within plan scope. The copy-paste `resolveLifecycle` duplication in `chat/channel/page.tsx` was noted as tech debt in TASK-02 but consolidation remains out of scope per plan constraints.
