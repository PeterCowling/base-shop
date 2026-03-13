---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-activity-duration
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-008
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/prime-activity-duration/analysis.md
---

# Prime Activity Duration Plan

## Summary

Add an optional `durationMinutes?: number` field to `ActivityInstance` and update three hardcoded 2-hour call sites across two files to use `Math.max(1, activity.durationMinutes ?? 120)`. This makes activity finish times and lifecycle state (live/ended) data-driven per instance, defaulting to 120 minutes for existing records. No RTDB migration is needed (schemaless). The change is fully backwards-compatible, affects 4 files, and is validated by one new test case for non-default duration lifecycle boundary.

## Active tasks
- [x] TASK-01: Add `durationMinutes?: number` to `ActivityInstance` — Complete (2026-03-13)
- [x] TASK-02: Update 3 call sites in 2 files to use per-instance duration — Complete (2026-03-13)
- [x] TASK-03: Add non-default duration lifecycle test cases — Complete (2026-03-13)

## Goals
- Activity finish times reflect the actual planned duration of each instance
- Live/ended lifecycle state is correct for non-120-minute activities
- Existing instances without `durationMinutes` behave identically to today (120-minute default)
- All three hardcoded call sites updated atomically in TASK-02

## Non-goals
- `ActivityTemplate` default duration (per-template inheritance) — future enhancement
- Staff activity creation UI within prime — no such UI exists
- Firebase security rules changes — duration is display metadata, no auth implications
- Any activity management admin panel

## Constraints & Assumptions
- Constraints:
  - RTDB is schemaless — no migration; `durationMinutes` will be absent on all existing instances
  - No Zod schema validates `ActivityInstance` at runtime — TypeScript-only type update sufficient
  - `chat/channel/page.tsx` has a copy-paste of `resolveLifecycle` — must be updated in the same task as `ActivitiesClient.tsx`
- Assumptions:
  - Staff set `durationMinutes` via Firebase console when creating new instances; existing instances fall back to 120 min
  - `durationMinutes` values are positive integers (minutes); zero or negative are guarded with `Math.max(1, ...)`

## Inherited Outcome Contract

- **Why:** The prime guest app shows activity finish times based on a fixed 2-hour assumption. Staff-run activities vary in length. Without a configurable duration field, every activity incorrectly shows the same finish time, and the live/ended lifecycle is wrong for any activity that isn't exactly 2 hours.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Activity finish times and lifecycle states reflect the real planned duration stored per instance, defaulting to 120 minutes when no duration is set.
- **Source:** auto

## Analysis Reference
- Related analysis: `docs/plans/prime-activity-duration/analysis.md`
- Selected approach inherited:
  - Option A: add `durationMinutes?: number` to `ActivityInstance`; update `formatFinishTime` to accept full `ActivityInstance`; update both `resolveLifecycle` copies to use `Math.max(1, activity.durationMinutes ?? 120)`
- Key reasoning used:
  - Option A is the minimal correct fix — no new network calls, no new RTDB paths, no migration
  - Option B (separate RTDB config node) rejected: two-source fan-in for a single field, over-engineered
  - Option C (remove finish time) rejected: degrades UX with no benefit
  - `formatFinishTime` signature change to `ActivityInstance` preferred over explicit `(startTime, durationMinutes = 120)` params because `resolveLifecycle` already takes the full object — consistency reduces future divergence

## Selected Approach Summary
- What was chosen:
  - Add `durationMinutes?: number` to `ActivityInstance` type
  - Change `formatFinishTime(startTime: number)` → `formatFinishTime(activity: ActivityInstance)` (one call site at `ActivitiesClient.tsx:139`)
  - Update `resolveLifecycle` in `ActivitiesClient.tsx:67` to use `Math.max(1, activity.durationMinutes ?? 120)`
  - Update `resolveLifecycle` in `chat/channel/page.tsx:44` (copy-paste) to use `Math.max(1, activity.durationMinutes ?? 120)`
  - Add test cases validating non-default (30 min) duration lifecycle boundary
- Why planning is not reopening option selection:
  - Analysis settled the approach decisively with full evidence coverage
  - No operator-only questions remain open

## Fact-Find Support
- Supporting brief: `docs/plans/prime-activity-duration/fact-find.md`
- Evidence carried forward:
  - 3 hardcoded call sites confirmed at exact file/line locations (verified in planning validation)
  - RTDB is schemaless — old records safe; no migration needed
  - No Zod/runtime schema on `ActivityInstance` — TypeScript-only update sufficient
  - `formatFinishTime` has exactly one call site: `ActivitiesClient.tsx:139`
  - Test file at `apps/prime/src/app/(guarded)/activities/__tests__/attendance-lifecycle.test.tsx` — 151 lines, tests render lifecycle states via component render

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `durationMinutes?: number` to `ActivityInstance` | 95% | S | Complete (2026-03-13) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Update 3 call sites in 2 files to use per-instance duration | 90% | S | Complete (2026-03-13) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Add non-default duration lifecycle test cases | 85% | S | Complete (2026-03-13) | TASK-02 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | `formatFinishTime` updated — correct finish time shown in ActivityCard | TASK-02 | One call site at `ActivitiesClient.tsx:139` |
| UX / states | Both `resolveLifecycle` copies updated — correct live/ended boundary for non-120-min activities | TASK-02 | 3 call sites in 2 files updated atomically |
| Security / privacy | N/A — display-only field; no auth implications | — | `durationMinutes` is display metadata |
| Logging / observability / audit | N/A — no new metrics needed; trivial arithmetic change | — | Duration is display-only |
| Testing / validation | Add non-default duration (30 min) test cases to confirm lifecycle boundary | TASK-03 | Existing tests cover default (120 min) behavior implicitly |
| Data / contracts | `ActivityInstance` type gains optional `durationMinutes?: number` field; RTDB schemaless — no migration | TASK-01 | Old instances fall back to 120 min via `?? 120` |
| Performance / reliability | N/A — trivial arithmetic; no new network call | — | No performance impact |
| Rollout / rollback | Additive type change; backwards compatible; rollback = `git revert` on 4 files; no DB state | TASK-01, TASK-02 | Clean rollback with zero RTDB state to undo |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Type update; no dependencies |
| 2 | TASK-02 | TASK-01 complete | TypeScript compiler enforces type-before-call-site |
| 3 | TASK-03 | TASK-02 complete | Tests validate completed implementation |

## Delivered Processes

None: no material process topology change. This plan modifies three utility functions and one TypeScript interface within the prime guest app. No CI/deploy lane, operator runbook, Firebase security rule, or multi-step workflow is altered.

## Tasks

### TASK-01: Add `durationMinutes?: number` to `ActivityInstance`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/prime/src/types/messenger/activity.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:** `apps/prime/src/types/messenger/activity.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Build evidence:** Commit `242e3b6caa`. TypeScript clean (`tsc --noEmit` and pre-commit typecheck via turbo both passed). Lint clean. `durationMinutes?: number` field added after `startTime` with JSDoc documenting minutes unit, optional default (120 min), and zero-guard note. TC-P01 and TC-P02 verified by compiler: optional field accepted with and without value.
- **Confidence:** 95%
  - Implementation: 95% — add one optional field to a TypeScript interface; exact target file and interface confirmed; no ambiguity
  - Approach: 95% — `durationMinutes?: number` is the only sensible type (minutes as positive integer); optional field is backwards-compatible by definition
  - Impact: 95% — change is purely additive; existing consumers compile without change; new consumers in TASK-02 are in scope
- **Acceptance:**
  - `ActivityInstance` interface includes `durationMinutes?: number` with a JSDoc comment noting the field is in minutes and optional (defaults to 120 min when absent)
  - TypeScript compiles without errors in `apps/prime`
  - No other type or file is changed in this task
- **Engineering Coverage:**
  - UI / visual: N/A — type-only change, no render logic
  - UX / states: N/A — type-only change
  - Security / privacy: N/A — display metadata, no auth implications
  - Logging / observability / audit: N/A
  - Testing / validation: N/A — type addition is non-breaking; TASK-03 adds the relevant test cases
  - Data / contracts: Required — `ActivityInstance` interface updated; RTDB is schemaless so no migration needed; old instances without the field will read as `undefined` and fall back to `?? 120` in TASK-02
  - Performance / reliability: N/A
  - Rollout / rollback: Required — additive type change; rollback = revert `activity.ts`; no DB state
- **Validation contract (TC-P01):**
  - TC-P01: TypeScript compiler accepts `ActivityInstance` with `durationMinutes: 60` — no error
  - TC-P02: TypeScript compiler accepts `ActivityInstance` without `durationMinutes` — no error (field is optional)
  - Note: TC-P prefix distinguishes plan-level pre-build checks from existing test file labels (`TC-01/TC-02/TC-03` in `attendance-lifecycle.test.tsx`)
- **Execution plan:** Red → `tsc` reports no errors on `activity.ts` already → add field → Green → verify `tsc` still clean → Refactor → add JSDoc comment noting minutes unit and optional fallback behaviour
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** None: no unknown dependencies; RTDB schemaless behavior confirmed in fact-find
- **Edge Cases & Hardening:** Zero/negative values are guarded in TASK-02 (not in this type — the type allows any number; the guard is in the calculation)
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: deploy with TASK-02 and TASK-03 in the same build
  - Rollback: `git revert` this file; no RTDB state to clean up
- **Documentation impact:**
  - JSDoc comment on field documents the minutes unit and `undefined` fallback behavior
- **Notes / references:**
  - `apps/prime/src/types/messenger/activity.ts` lines 20–41 — `ActivityInstance` interface confirmed in planning validation

---

### TASK-02: Update 3 call sites in 2 files to use per-instance duration
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx`, `apps/prime/src/app/(guarded)/chat/channel/page.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Build evidence:** Commit `7286a4f63a`. `formatFinishTime` signature updated to `(activity: ActivityInstance)` with `Math.max(1, activity.durationMinutes ?? 120)` guard. Call site at `ActivitiesClient.tsx:139` updated from `formatFinishTime(activity.startTime)` to `formatFinishTime(activity)`. `resolveLifecycle` in both `ActivitiesClient.tsx` and `chat/channel/page.tsx` updated from `2 * 60 * 60 * 1000` to `Math.max(1, activity.durationMinutes ?? 120) * 60 * 1000`. TypeScript clean. Lint clean. Pre-existing DS lint warnings on `chat/channel/page.tsx` (BRIK-3 deferred) are not introduced by this change.
- **Affects:** `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx`, `apps/prime/src/app/(guarded)/chat/channel/page.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 95% — all 3 call sites confirmed at exact locations; `formatFinishTime` signature change has exactly 1 caller; `Math.max(1, activity.durationMinutes ?? 120)` arithmetic is unambiguous
  - Approach: 95% — analysis settled the signature choice with explicit rationale; zero-guard specified
  - Impact: 90% — existing tests exercise the 120-min default path; tests should continue to pass because mock activities have no `durationMinutes` → `undefined ?? 120` → unchanged behavior
- **Acceptance:**
  - `formatFinishTime` signature changed from `(startTime: number)` to `(activity: ActivityInstance)` — uses `activity.startTime` and `Math.max(1, activity.durationMinutes ?? 120)` internally
  - Call site at `ActivitiesClient.tsx:139` updated from `formatFinishTime(activity.startTime)` to `formatFinishTime(activity)`
  - `resolveLifecycle` in `ActivitiesClient.tsx` (around line 67) updated: `const end = start + 2 * 60 * 60 * 1000;` → `const end = start + Math.max(1, activity.durationMinutes ?? 120) * 60 * 1000;`
  - `resolveLifecycle` in `chat/channel/page.tsx` (around line 44) updated identically
  - TypeScript compiles without errors
  - Existing tests pass unchanged (existing mock activities have no `durationMinutes` → 120-min default behavior preserved)
  - Expected user-observable behavior:
    - [ ] An activity with `durationMinutes: 30` and `startTime` 25 min ago shows status "Live now" (not "ended")
    - [ ] An activity with `durationMinutes: 30` and `startTime` 35 min ago shows status "Ended"
    - [ ] An activity with no `durationMinutes` shows same finish time as before (120-min default)
    - [ ] An activity with `durationMinutes: 0` uses 1 minute (guard prevents immediate-end bug)
- **Engineering Coverage:**
  - UI / visual: Required — `formatFinishTime` now computes finish time using `activity.durationMinutes ?? 120`; rendered time changes for non-120-min activities
  - UX / states: Required — both `resolveLifecycle` copies updated; live/ended boundary now respects `durationMinutes`
  - Security / privacy: N/A — display-only arithmetic change
  - Logging / observability / audit: N/A
  - Testing / validation: Required — existing tests validate 120-min default path is unchanged; TASK-03 adds non-default duration cases
  - Data / contracts: Required — `formatFinishTime` signature change: one caller at `ActivitiesClient.tsx:139` updated; `resolveLifecycle` callers (in `useMemo` at ~lines 259, 263, 267 in `ActivitiesClient.tsx` and at `chat/channel/page.tsx:136`) already pass the full `ActivityInstance` object — no changes needed to call sites of `resolveLifecycle`
  - Performance / reliability: N/A — trivial arithmetic change
  - Rollout / rollback: Required — additive change; `git revert` rolls back; no DB state
- **Validation contract (TC-P03):**
  - TC-P03: Activity with `durationMinutes: undefined` → `resolveLifecycle` computes `end = startTime + 120 * 60 * 1000` (unchanged behavior)
  - TC-P04: Activity with `durationMinutes: 30` and `now = startTime + 25 * 60 * 1000` → `resolveLifecycle` returns `'live'`
  - TC-P05: Activity with `durationMinutes: 30` and `now = startTime + 35 * 60 * 1000` → `resolveLifecycle` returns `'ended'`
  - TC-P06: Activity with `durationMinutes: 0` → `Math.max(1, 0) = 1` minute; `end = startTime + 1 * 60 * 1000`; prevents immediate-end
  - TC-P07: `formatFinishTime(activity)` with `durationMinutes: undefined` returns same string as previous `formatFinishTime(activity.startTime)`
- **Execution plan:**
  - Red → read both files; verify exact function bodies match planning validation evidence → no test added yet (Red phase is code reading)
  - Green → update `formatFinishTime` signature in `ActivitiesClient.tsx`; update its call site at line 139; update `resolveLifecycle` body in `ActivitiesClient.tsx`; update `resolveLifecycle` body in `chat/channel/page.tsx`
  - Refactor → verify `tsc` compiles cleanly; add code comment on `Math.max(1, ...)` guard noting it prevents immediate-end on `durationMinutes: 0`
- **Planning validation:**
  - Checks run: read `ActivitiesClient.tsx` and `chat/channel/page.tsx` in full
  - Validation artifacts: confirmed `formatFinishTime` at line 57 (single call site at line 139); `resolveLifecycle` in `ActivitiesClient.tsx` at line 67; `resolveLifecycle` in `chat/channel/page.tsx` at line 44; `resolveLifecycle` callers already pass full `ActivityInstance` object
  - Unexpected findings: none; line numbers in fact-find were off by 1–2 lines (trivial, no execution impact)
- **Consumer tracing:**
  - New field `durationMinutes` introduced in TASK-01 — consumed by: `formatFinishTime` (updated in this task), `resolveLifecycle` in `ActivitiesClient.tsx` (updated in this task), `resolveLifecycle` in `chat/channel/page.tsx` (updated in this task). All consumers addressed.
  - Modified: `formatFinishTime` signature changes — single caller at `ActivitiesClient.tsx:139` updated from `formatFinishTime(activity.startTime)` to `formatFinishTime(activity)`. No other callers exist (confirmed by `grep -rn "formatFinishTime" apps/prime/src` → single result in fact-find).
  - `resolveLifecycle` callers pass `(a, now)` or `(activity, Date.now())` — they already pass the full `ActivityInstance` object; no call-site changes needed.
- **Scouts:** None: zero-guard `Math.max(1, ...)` specified in analysis; no edge case undefined
- **Edge Cases & Hardening:**
  - `durationMinutes: 0` → `Math.max(1, 0) = 1` — activity ends 1 minute after start (not immediately)
  - `durationMinutes: undefined` → `undefined ?? 120` = 120 — identical to current behavior
  - `durationMinutes: negative` → `Math.max(1, negative) = 1` — same guard applies
- **What would make this >=90%:** Already at 90%. The 5% gap reflects the test validation coming in TASK-03 rather than being in this task.
- **Rollout / rollback:**
  - Rollout: ship together with TASK-01 and TASK-03; no feature flag needed
  - Rollback: `git revert` these 2 files; no RTDB state to clean up
- **Documentation impact:**
  - Add `// durationMinutes: 0 guard — prevents immediate-end bug` comment on the Math.max line
- **Notes / references:**
  - Tech debt: copy-paste `resolveLifecycle` duplication between `ActivitiesClient.tsx` and `chat/channel/page.tsx` is a maintenance liability; consolidation is out of scope for this plan but noted for future refactor
  - Post-fix note: staff should document in their Firebase console workflow that `durationMinutes` (in minutes) should be set when creating new activity instances; absence defaults to 120 min

---

### TASK-03: Add non-default duration lifecycle test cases
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/prime/src/app/(guarded)/activities/__tests__/attendance-lifecycle.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Build evidence:** Commit `ed0ecd9bef`. Refactored `useChat` mock from static inline object to `jest.fn()` with `mockReturnValue()` to support per-test activity fixtures. Extracted `defaultActivities` constant for reuse. Added new `describe("ActivitiesClient — non-default durationMinutes lifecycle")` block with TC-P09 (25 min elapsed, durationMinutes:30 → live) and TC-P10 (35 min elapsed, durationMinutes:30 → ended). All existing tests preserved. TypeScript clean. 1 file changed, 98 insertions(+), 30 deletions(-).
- **Affects:** `apps/prime/src/app/(guarded)/activities/__tests__/attendance-lifecycle.test.tsx`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — test file is clear; `useChat` mock needs refactoring from static inline to `jest.fn()` to support per-test activity fixtures; small mock refactor well understood
  - Approach: 90% — testing via component render is the established pattern in the file; adding new `describe` block with overridden `useChat` mock is standard Jest practice
  - Impact: 85% — test additions validate the core behavior change from TASK-02; ensures non-default duration lifecycle boundary is regression-protected
- **Acceptance:**
  - New test cases exist in `attendance-lifecycle.test.tsx` (or a new `describe` block) covering:
    - [ ] Activity with `durationMinutes: 30` and `startTime: Date.now() - 25 * 60 * 1000` renders as live (not ended)
    - [ ] Activity with `durationMinutes: 30` and `startTime: Date.now() - 35 * 60 * 1000` renders as ended
    - [ ] Activity with no `durationMinutes` and `startTime: Date.now() - 10 * 60 * 1000` still renders as live (120-min default preserved)
  - All existing tests continue to pass
  - `pnpm --filter prime test attendance-lifecycle` passes (via CI — not run locally per testing policy)
- **Engineering Coverage:**
  - UI / visual: N/A — test-only change
  - UX / states: Required — new test cases validate lifecycle state boundaries for non-default duration
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — core coverage for the feature change; ensures regression protection for non-120-min lifecycle boundary
  - Data / contracts: N/A — no type changes in this task
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — test-only change
- **Validation contract (TC-P08):**
  - TC-P08: `attendance-lifecycle.test.tsx` all tests pass (existing + new)
  - TC-P09: New test renders activity with `durationMinutes: 30`, `startTime: Date.now() - 25 * 60 * 1000` — expects "Live now" badge visible
  - TC-P10: New test renders activity with `durationMinutes: 30`, `startTime: Date.now() - 35 * 60 * 1000` — expects "Event ended" badge (or equivalent ended text)
- **Execution plan:**
  - Red → confirm test file structure; note that current `useChat` mock is a static inline object at module level, making it impossible to override per-test without refactoring
  - Green → refactor the `useChat` mock to use `jest.fn()` with `.mockReturnValue()` so tests can override activities per describe block; add new `describe('non-default duration lifecycle')` block with two test cases (25-min elapsed → live, 35-min elapsed → ended) using `durationMinutes: 30` fixtures; verify all existing tests in the file still pass
  - Refactor → ensure mock refactor is clean (no behavior change to existing tests)
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** None: mock refactor pattern is standard Jest; `jest.fn().mockReturnValue(...)` is established in this test suite
- **Edge Cases & Hardening:** None for test-only change; the edge cases are covered by TC-P09 and TC-P10
- **What would make this >=90%:**
  - Direct unit test of `resolveLifecycle` (if it were exported) would give higher precision; currently tested via component render which adds integration surface
- **Rollout / rollback:**
  - Rollout: ship with TASK-01 + TASK-02
  - Rollback: `git revert` test file; existing tests were passing before this task
- **Documentation impact:**
  - None
- **Notes / references:**
  - Testing policy: tests run in CI only; use `gh run watch` to monitor. NEVER run `jest` locally.

---

## Risks & Mitigations
- **Staff forget to set `durationMinutes` on new instances** — Likelihood: High | Impact: Low — defaults to 120 min gracefully; documented in TASK-02 code comment
- **`resolveLifecycle` duplication in `chat/channel/page.tsx` grows into divergence** — Likelihood: Low | Impact: Medium — noted as tech debt in TASK-02; out of scope to consolidate now; recorded for future refactor

## Observability
- Logging: None needed — display-only change
- Metrics: None needed
- Alerts/Dashboards: None needed

## Acceptance Criteria (overall)
- [x] `ActivityInstance` type has `durationMinutes?: number` field
- [x] All 3 hardcoded `2 * 60 * 60 * 1000` constants replaced with `Math.max(1, activity.durationMinutes ?? 120) * 60 * 1000`
- [x] `formatFinishTime` signature updated and its call site updated
- [x] TypeScript compiles cleanly across all affected files
- [x] Existing `attendance-lifecycle.test.tsx` tests pass
- [x] New test cases for `durationMinutes: 30` lifecycle boundary pass

## Decision Log
- 2026-03-13: `formatFinishTime` signature takes full `ActivityInstance` object (not explicit `startTime, durationMinutes` params) — consistent with `resolveLifecycle` pattern; reduces future signature divergence
- 2026-03-13: Zero/negative `durationMinutes` guard: `Math.max(1, ...)` applied in both `formatFinishTime` and `resolveLifecycle`; prevents immediate-end bug on `durationMinutes: 0`

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Type update | Yes | None — optional field addition is non-breaking; compiler enforces type availability before TASK-02 can use it | No |
| TASK-02: Call site updates | Yes (TASK-01 type must exist) | None — all 3 call sites confirmed; `formatFinishTime` caller count confirmed as 1; `resolveLifecycle` callers already pass full `ActivityInstance` — no call-site changes needed beyond function bodies | No |
| TASK-03: Test additions | Yes (TASK-02 implementation must be complete) | Minor: `useChat` mock needs small refactor from static inline to `jest.fn()` for per-test overrides — well-understood pattern, no blocking issue | No |

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01: 95% × S(1) = 95
- TASK-02: 90% × S(1) = 90
- TASK-03: 85% × S(1) = 85
- Overall-confidence = (95 + 90 + 85) / 3 = 90%
