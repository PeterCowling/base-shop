---
Type: Analysis
Status: Ready-for-planning
Domain: Engineering
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: prime-activity-duration
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/prime-activity-duration/fact-find.md
Related-Plan: docs/plans/prime-activity-duration/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Prime Activity Duration Analysis

## Decision Frame

### Summary

Activity finish times and lifecycle states in the prime guest app are calculated using a hardcoded 2-hour (120-minute) constant. This constant appears in three places across two files. The decision is: how should duration become data-driven? The answer is unambiguous from the evidence — add an optional `durationMinutes` field to `ActivityInstance` and replace the constant with `Math.max(1, activity.durationMinutes ?? 120)`. The only non-trivial sub-decision is whether to guard against invalid zero/negative values, which analysis resolves here.

### Goals

- Activity finish times reflect the actual planned duration of each instance
- Live/ended lifecycle state is correct for non-120-minute activities
- Backwards-compatible: existing instances without `durationMinutes` behave identically to today (120-minute default)
- All three hardcoded call sites updated atomically

### Non-goals

- `ActivityTemplate` default duration (per-template inheritance) — future enhancement
- Staff activity creation UI within prime — no such UI exists; out of scope
- Firebase security rules changes — duration is display metadata, no auth implications
- Any activity management admin panel

### Constraints & Assumptions

- Constraints:
  - RTDB is schemaless (NoSQL JSON tree) — no migration, but no enforcement either; `durationMinutes` will be absent on all existing instances
  - No Zod schema validates `ActivityInstance` at runtime — TypeScript-only type update sufficient
  - `chat/channel/page.tsx` has a copy-paste of `resolveLifecycle` — must be updated in the same change

- Assumptions:
  - Staff will set `durationMinutes` via Firebase console when creating new instances; existing instances fall back to 120 min
  - `durationMinutes` values are positive integers (minutes); zero or negative should be guarded against

## Inherited Outcome Contract

- **Why:** The prime guest app shows activity finish times based on a fixed 2-hour assumption. Staff-run activities vary in length. Without a configurable duration field, every activity incorrectly shows the same finish time, and the live/ended lifecycle is wrong for any activity that isn't exactly 2 hours.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Activity finish times and lifecycle states reflect the real planned duration stored per instance, defaulting to 120 minutes when no duration is set.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/prime-activity-duration/fact-find.md`
- Key findings used:
  - Three hardcoded call sites confirmed: `ActivitiesClient.tsx:58` (`formatFinishTime`), `ActivitiesClient.tsx:69` (`resolveLifecycle`), `chat/channel/page.tsx:46` (copy-paste `resolveLifecycle`)
  - `ActivityInstance` type at `apps/prime/src/types/messenger/activity.ts` — no `durationMinutes` field
  - RTDB is schemaless — no migration; existing records default to 120 min via `?? 120`
  - `formatFinishTime` has exactly one call site (`ActivitiesClient.tsx:139`)
  - No Zod schema on `ActivityInstance`
  - Zero/negative `durationMinutes` risk identified — guard with `Math.max(1, ...)`

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Correct finish time for non-120-min activities | Core goal — current state is broken for any duration ≠ 2h | Must-pass |
| Backwards compatibility | Existing RTDB instances must not break | Must-pass |
| Zero code changes outside the 4 affected files | Avoids scope creep | High |
| Guard against invalid input | Prevents immediate-end bug on `durationMinutes: 0` | High |
| No RTDB migration required | Keeps rollout reversible and zero-risk | High |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Add `durationMinutes?: number` to type + update 3 call sites | Optional field on `ActivityInstance`; `Math.max(1, durationMinutes ?? 120)` in both `resolveLifecycle` and `formatFinishTime` | Zero migration; backwards compatible; minimal surface area; 4 files only | Staff must set field via Firebase console (no in-app creation UI) | Zero/negative guard omitted without care | Yes — chosen |
| B — Separate RTDB "activity config" node | Store duration in a separate path, e.g. `messaging/activities/config/{instanceId}/durationMinutes` | Clean separation of display config from instance data | Requires a second Firebase read per activity; no existing pattern; over-engineered for a single field | Two-source fan-in complicates lifecycle resolver | No |
| C — Remove finish time display entirely | Stop showing end time; only show start time | Eliminates the incorrect information | Removes useful guest-facing information | Degrades UX; guests lose ability to plan | No |

## Engineering Coverage Comparison

| Coverage Area | Option A (chosen) | Option B | Chosen implication |
|---|---|---|---|
| UI / visual | `formatFinishTime` updated → correct finish time shown | Same but requires second read | Plan must update `formatFinishTime` signature and one call site |
| UX / states | Both `resolveLifecycle` copies updated → correct live/ended boundary | Same but adds async dependency | Plan must update both copies atomically; test coverage for non-default duration |
| Security / privacy | N/A — display-only field | N/A | No auth changes |
| Logging / observability / audit | N/A | N/A | No new metrics needed |
| Testing / validation | Existing test passes; add non-default duration test case | Would require async test mocking | Add one test fixture with `durationMinutes: 30` to confirm lifecycle boundary |
| Data / contracts | `ActivityInstance` type gains optional field; RTDB schemaless | Adds new RTDB path, new type shape | RTDB records without field safe; old instances behave identically to today |
| Performance / reliability | Trivial arithmetic; no new network call | Second Firebase read per activity | No performance impact |
| Rollout / rollback | Additive type change; `git revert` rolls back fully | Rollback also requires RTDB path cleanup | Clean rollback: revert 4 files; no DB state |

## Chosen Approach

- **Recommendation:** Option A — add `durationMinutes?: number` to `ActivityInstance`, update `formatFinishTime` to accept the full `ActivityInstance` object, and update both `resolveLifecycle` copies to use `Math.max(1, activity.durationMinutes ?? 120)`.
- **Why this wins:** Option A is the minimal, correct fix. The type system already describes `ActivityInstance` exhaustively — adding one optional field follows the established pattern. No new network calls, no new RTDB paths, no migration. Option B introduces an unnecessary fan-in pattern for a single field. Option C degrades UX with no benefit.
- **What it depends on:** Firebase RTDB schemaless behavior (confirmed); no Zod schema on `ActivityInstance` (confirmed); `formatFinishTime` has a single call site (confirmed at `ActivitiesClient.tsx:139`).

### Rejected Approaches

- **Option B (separate RTDB config node)** — over-engineered for a single optional field. Creates a two-source fan-in for lifecycle resolution with no compensating benefit. Rejected.
- **Option C (remove finish time)** — removes useful guest information to avoid fixing the root cause. Rejected.

### Open Questions (Operator Input Required)

None. All decisions are resolvable from evidence and standard engineering practice.

## End-State Operating Model

None: no material process topology change. The change modifies three utility functions and one TypeScript interface within the prime guest app. No CI/deploy lane, operator runbook, Firebase security rule, or multi-step workflow is altered.

## Planning Handoff

- Planning focus:
  - TASK-01: Type update — `ActivityInstance` gains `durationMinutes?: number`
  - TASK-02: UI fix — `formatFinishTime` signature change to `(activity: ActivityInstance)` (preferred over explicit `startTime, durationMinutes` params because `resolveLifecycle` already takes the full object — signature consistency reduces future divergence) + both `resolveLifecycle` copies updated (3 call sites in 2 files)
  - TASK-03: Test — add one test fixture with `durationMinutes: 30` to `attendance-lifecycle.test.tsx` to confirm non-default lifecycle boundary; verify existing tests still pass
  - Tasks can be sequenced TASK-01 → TASK-02 → TASK-03 (type must exist before UI can use it; test validates both)

- Validation implications:
  - `resolveLifecycle` with `durationMinutes: 30` and `startTime: Date.now() - 25 * 60 * 1000` should return `'live'` (not yet ended at 30 min)
  - `resolveLifecycle` with `durationMinutes: 30` and `startTime: Date.now() - 35 * 60 * 1000` should return `'ended'`
  - `formatFinishTime` with `durationMinutes: undefined` should produce same output as current (120-min default)
  - `durationMinutes: 0` guard: `Math.max(1, 0)` → 1 minute; prevents immediate-end bug

- Sequencing constraints:
  - Type update must precede UI call-site changes (TypeScript compiler enforces)
  - Both `resolveLifecycle` copies should be updated in the same commit for atomicity
  - Tests come last (validate the completed implementation)

- Risks to carry into planning:
  - The two `resolveLifecycle` functions in different files are identical today — no divergence risk for this fix, but the duplication itself is a maintenance liability. Plan should note the duplication as a known code smell (out of scope to refactor now).

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Staff forget to set `durationMinutes` on new instances | High | Low — defaults to 120 min gracefully | Operator behavior outside analysis scope | Accept; document the default in code comment |
| `durationMinutes` copy-paste duplication in `chat/channel/page.tsx` grows | Low | Medium — future divergence risk | Not in scope to consolidate now | Note as tech debt in plan; flag for future refactor |

## Planning Readiness

- Status: Go
- Rationale: All evidence confirmed. Single viable option. No operator input required. 4 files, 3 call sites, 1 test update. Full backwards compatibility. Clean rollback.
