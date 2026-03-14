---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: reception-till-reconciliation-bugs
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-till-reconciliation-bugs/fact-find.md
Related-Plan: docs/plans/reception-till-reconciliation-bugs/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception Till Reconciliation Bugs — Analysis

## Decision Frame

### Summary
Five confirmed code-level bugs in the till reconciliation subsystem of `apps/reception`. All five have verified fix locations. The analysis must resolve two open choices before planning: (1) Bug 3 UX approach — whether to remove the optimistic keycard state update or replace it with an optimistic-update-plus-rollback pattern; (2) Plan grouping strategy — single plan or one plan per bug/file. All other bugs have a single viable fix path.

### Goals
- All five bugs fixed, regression-tested, and merged.
- Till reconciliation workflows operational: edit/delete modes reachable, float form closes after success, keycard Firebase errors surface as toasts, keycard reconcile record carries correct difference, shift-close cannot carry stale override state.

### Non-goals
- UX redesign beyond the minimum needed for each fix.
- Other till subsystem areas (TillShiftHistory, DrawerLimitWarning, safe management).
- Performance optimisation.

### Constraints & Assumptions
- Constraints:
  - Firebase Realtime DB; all write mutations through custom Firebase hooks.
  - Tests run in CI only. NEVER run jest locally.
  - Writer lock required for commits.
  - Pre-commit hook runs `turbo lint` on all changed packages.
- Assumptions:
  - `useEndOfDayReportData.ts` confirmed to NOT read `difference` from reconcile-type cashCount records (grep verified). Bug 4 fix has no downstream consumer to update.
  - Reception app is on a stable LAN/WiFi connection; Firebase write latency is typically <100ms in production context.

## Inherited Outcome Contract

- **Why:** Five confirmed bugs blocking operational till workflows (edit/delete transaction modes unreachable, float confirmation leaves modal open, keycard Firebase errors silent, keycard audit record corrupt, shift-close retry retains stale override).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All five defects fixed, regression tests passing in CI. Till reconciliation workflows operate correctly: staff can enter and exit edit/delete modes, the float form closes on success, keycard errors surface as toasts, keycard reconcile records carry correct values, and shift-close does not carry stale override state across attempts.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-till-reconciliation-bugs/fact-find.md`
- Key findings used:
  - Bug 1: `ActionButtonsProps` interface (lines 14–30) verified — no `setIsEditMode`/`setIsDeleteMode`. Fix requires two files: `ActionButtons.tsx` + `TillReconciliation.tsx` wiring.
  - Bug 2: `confirmFloat` success path missing `ui.setCashForm("none")` — single line insert, pattern from `confirmExchange`.
  - Bug 3: `updateSafeKeycards` called before `await recordKeycardTransfer` — async ordering error. `useKeycardTransfer` confirmed async/throws.
  - Bug 4: `addCashCount("reconcile", 0, 0, ...)` — `difference` arg hardcoded 0; `diff` (= `counted - expectedKeycardsAtClose`) computed at line 618 but not passed. Signature verified. No downstream consumers of this field.
  - Bug 5: `confirmShiftClose` two early-return branches (lines 446–451 and 455–461) do not reset `pendingOverride`.
  - `TillReconciliation.test.tsx` fully mocks ActionButtons — Bug 1 TC requires a new direct test file.

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Fix correctness | Each fix must eliminate the defect without introducing new bugs | Critical |
| Pattern consistency | Fixes should match existing codebase patterns to reduce review friction | High |
| UX impact | Especially relevant for Bug 3 — change must not noticeably degrade perceived responsiveness | Medium |
| Test isolation | Each bug must have an independently verifiable regression TC | High |
| Scope minimality | Avoid scope creep beyond the confirmed defects | High |

## Options Considered

### Bug 3 — Async Ordering (the only non-trivial approach decision)

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Remove optimistic update | Await Firebase write, THEN call `updateSafeKeycards`. Wrap entire block in try/catch; show toast on error. | Simple, correct, matches SafeManagement.tsx pattern. No rollback state needed. | Keycard count in UI updates after Firebase round-trip (~50–150ms LAN). Slight perceived lag on button tap. | None — this is the simpler of two correct approaches | Yes |
| B — Optimistic update + rollback | Call `updateSafeKeycards` immediately, then await Firebase write; on error, reverse the state update and show toast. | Immediate UI feedback on tap. More responsive feel. | Requires storing previous count, adding rollback logic, significantly more complex. Two possible out-of-sync states on error. | Rollback logic could introduce race condition if user taps again before error resolves | Yes |

### Plan Grouping Strategy

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Single plan, 5 tasks | One plan with one IMPLEMENT task per bug. Tasks for Bugs 2+3 share `useTillReconciliationLogic.ts`; Bugs 4+5 share `useTillShifts.ts`; Bug 1 is independent. | Shared test infrastructure, single commit scope, one archive. No inter-plan dependency. | If one task blocks, the whole plan stalls. | Minimal — all 5 fixes are independently bounded. | Yes |
| B — Split plans per file | Three mini-plans: (1) ActionButtons Bug 1, (2) useTillReconciliationLogic Bugs 2+3, (3) useTillShifts Bugs 4+5. | Each mini-plan is independently archivable. | Overhead of 3 plans, 3 critique loops, 3 build cycles, 3 archive commits. Disproportionate for 5 point fixes. | None | Yes |

## Engineering Coverage Comparison

| Coverage Area | Option A (Bug 3: remove optimistic) | Option B (Bug 3: optimistic+rollback) | Chosen implication |
|---|---|---|---|
| `UI / visual` | Bug 1 adds menu items using existing DS ActionDropdown pattern — same for both options | Same | Verify ActionDropdown usage pattern in ActionButtons during build |
| `UX / states` | Keycard count updates after ~100ms LAN write. Acceptable in production context. | Immediate count update; rollback required on error | Option A: minor lag, simpler states. Option B: more states, rollback complexity |
| `Security / privacy` | N/A — no auth/data exposure change | Same | N/A |
| `Logging / observability / audit` | Bug 3 error surfaced as toast. Bug 4 `difference` field corrected. All errors visible. | Same, plus rollback event would need separate toast | Option A simpler error surface |
| `Testing / validation` | 5 regression TCs; Bug 1 needs dedicated ActionButtons.test.tsx | Same + rollback state TC required | Option A has fewer test paths |
| `Data / contracts` | Bug 4 fix confirmed safe — no downstream `difference` consumers found | Same | Fix is safe to land |
| `Performance / reliability` | Slight keycard update lag (~100ms). Firebase error contained as toast, no silent failure. | Faster UI; more code surface for reliability bugs | Option A is more reliable with less code |
| `Rollout / rollback` | N/A — no schema migration, rollback = revert commit | Same | N/A |

## Chosen Approach

**Recommendation:** Single plan (Option A for grouping) + remove optimistic update (Option A for Bug 3).

**Why this wins:**
- **Bug 3**: Option A (await-then-update) matches the `SafeManagement.tsx` pattern for `recordKeycardTransfer` (confirmed — `SafeManagement.tsx` line 304 wraps the call in a `run:` step that awaits). Rollback (Option B) adds significant complexity for negligible UX benefit on a LAN connection where round-trips are <150ms. Staff interaction with keycard buttons is deliberate (multi-tap unlikely during the write window).
- **Grouping**: Single plan eliminates the overhead of 3 separate artifact sets for 5 point fixes. All five tasks can be sequenced independently; if one stalls, the plan is still `Partially complete` rather than blocked. The shared test infrastructure (same mock patterns) makes a single plan natural.
- **Bug 1 test strategy**: Create `ActionButtons.test.tsx` — follows the repo pattern of component-level test files. Clean isolation, no interference with `TillReconciliation.test.tsx`.

**What it depends on:**
- `TillReconciliation.tsx` prop-forwarding of `setIsEditMode`/`setIsDeleteMode` to `ActionButtons` (lightweight — both setters already returned by `useTillReconciliationUI`).
- Bug 1 test: ActionDropdown or Button click simulation in a new test file.
- No audit consumer updates needed for Bug 4 (confirmed).

### Rejected Approaches
- **Bug 3 optimistic + rollback** — adds rollback state management and race-condition risk. The correct behavior is await-then-update; the LAN latency is acceptable. Rejected: complexity exceeds benefit.
- **Split plans per file** — disproportionate overhead for 5 bounded point fixes with shared infrastructure. Rejected: wasteful process overhead.

### Open Questions (Operator Input Required)
None. All decisions are resolvable from codebase evidence and standard engineering practice.

## End-State Operating Model

None: no material process topology change — five pure React hook/component fixes. No CI/deploy/release lane, approval path, workflow lifecycle state, or operator runbook is affected.

## Planning Handoff

- **Planning focus:**
  - **Bug 1 (`ActionButtons.tsx` + `TillReconciliation.tsx`):** Extend `ActionButtonsProps` interface, add Edit/Delete menu items calling `setIsEditMode(true)`/`setIsDeleteMode(true)`, wire new props from `useTillReconciliationUI` through `TillReconciliation.tsx`. Create `ActionButtons.test.tsx` for the regression TC. This group is independent of the other two.
  - **Bugs 2 + 3 (`useTillReconciliationLogic.ts`):** Insert `ui.setCashForm("none")` in `confirmFloat` success path (Bug 2). Reorder `confirmAddKeycard`/`confirmReturnKeycard` to await-then-update-state with try/catch (Bug 3). These two fixes share the same file and should be in one plan task to avoid edit conflicts.
  - **Bugs 4 + 5 (`useTillShifts.ts`):** Change `addCashCount("reconcile", 0, 0, ...)` to `addCashCount("reconcile", 0, diff, ...)` at line 622 (Bug 4). Add `setPendingOverride(false)` before each early-return in `confirmShiftClose` (Bug 5). These two fixes share the same file and should be in one plan task.
- **Validation implications:**
  - All 5 regression TCs are independently verifiable. No shared state between test cases.
  - Bug 1 TC requires a new `ActionButtons.test.tsx` — verify DS component mock setup in jest.config.cjs is inherited before implementing.
  - Bug 3 TC: mock `useKeycardTransfer` to reject → assert toast shown AND state not updated; mock to resolve → assert state updated. Confirm no call sites consume the return value of `confirmAddKeycard`/`confirmReturnKeycard` before rewriting (return type changes from `Promise<void>` to `void`).
- **Sequencing constraints:**
  - Bugs 2+3 share `useTillReconciliationLogic.ts` — must be one plan task to avoid edit conflicts.
  - Bugs 4+5 share `useTillShifts.ts` — must be one plan task.
  - Bug 1 group is independent and can be sequenced in any order relative to the other two groups.
  - Net: 3 logical groups by file scope, each independently implementable.
- **Risks to carry into planning:**
  - Bug 1 test mock: `TillReconciliation.test.tsx` fully mocks ActionButtons (`jest.mock("../ActionButtons")`). New `ActionButtons.test.tsx` must set up its own DS mock environment. Verify DS imports are available in Jest config.
  - Bug 3 optimistic removal: function currently `return`s the Promise from `recordKeycardTransfer`. After rewrite as async/await with try/catch, return type changes from `Promise<void>` to `void`. Confirm no callers consume the return value. (Grep in plan task.)

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Bug 1: ActionButtons DS mock setup in new test file | Low | Low | Requires reading jest.config.cjs and DS mock patterns; bounded to Bug 1 group | Verify DS mock setup during Bug 1 group implementation |
| Bug 3: callers consuming return value of confirmAddKeycard / confirmReturnKeycard | Low | Moderate | Not grepped in analysis — bounded investigation | Bugs 2+3 group execution plan must include grep for call sites before rewrite |
| Bug 4: semantic reuse of `difference` field for keycard diff | Low | Low | Confirmed no downstream consumers (grep verified). Theoretical concern only. | No action needed — carry as FYI note in plan |

## Planning Readiness
- Status: Go
- Rationale: All five fixes have verified locations, chosen approach is decisive (no operator forks), grouping is resolved (3 tasks by file scope), test strategy is clear. No open questions remain.
