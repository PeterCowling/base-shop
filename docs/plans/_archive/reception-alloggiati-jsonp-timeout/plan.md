---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Completed: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-alloggiati-jsonp-timeout
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Alloggiati JSONP Timeout Plan

## Summary

`sendAlloggiatiRecordsToGoogleScript` in `alloggiatiService.ts` submits mandatory Italian guest
registration records (Alloggiati Web) via JSONP. The Promise has no timeout: if the GAS script
loads but the JSONP callback is never invoked, the Promise hangs indefinitely, `isLoading` stays
`true` forever, and no error reaches the operator. This plan adds a 30-second `setTimeout`
rejection path with correct resource cleanup, a `clearTimeout` call in both the success callback
and `onerror`, and a test case for the new path.

## Active tasks

- [x] TASK-01: Add JSONP timeout and clearTimeout to alloggiatiService + test

## Goals

- Reject with a clear error message after 30 seconds if the JSONP callback never fires.
- Clean up `window[callbackName]` and the script DOM node on timeout.
- Prevent spurious timeout rejection when callback or `onerror` fires first (`clearTimeout`).
- Cover the new path with a test.

## Non-goals

- Retry logic (operator needs a failure signal first).
- Server-side fetch proxy to replace JSONP (adjacent future work).
- Changes to `useAlloggiatiSender.ts` (the hook already handles rejection).
- Changes to the GAS endpoint or submission format.

## Constraints & Assumptions

- Constraints:
  - Fix confined to `alloggiatiService.ts` and its test file.
  - No new npm dependencies — `setTimeout`/`clearTimeout` are browser globals.
  - `JSONP_TIMEOUT_MS` must be a named constant at file scope.
  - Tests run in CI only (repo policy).
- Assumptions:
  - 30 seconds is appropriate — GAS cold-starts are typically <5s; 30s avoids false timeouts.
  - `clearTimeout(undefined)` is valid in TypeScript (browser type: `id?: number`) — used when `timeoutId` has not yet been assigned in the async race where callback fires before `setTimeout` is called (impossible in practice, but typed correctly).

## Inherited Outcome Contract

- **Why:** Government compliance submission can silently stall, leaving `isLoading: true` indefinitely and potentially missing the 24h legal window for Italian guest registration.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `sendAlloggiatiRecordsToGoogleScript` rejects with a descriptive error after 30 seconds if the JSONP callback never fires, cleans up all resources, and the timeout path is covered by a CI-green test.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-alloggiati-jsonp-timeout/fact-find.md`
- Key findings used:
  - Four existing rejection paths: `script.onerror` (load failure), Zod invalid payload, GAS error payload, missing `resultDetails` — all handled. Missing path: callback never invoked.
  - `useAlloggiatiSender.ts` is the only call site; its `catch` block at line 55 handles all rejections.
  - `timeoutId` must be declared as `let ... | undefined` before the callback function to allow `clearTimeout(timeoutId)` inside the callback without TypeScript temporal dead zone error.
  - Test uses `jest.useFakeTimers()` + `jest.advanceTimersByTime(30001)` to trigger timeout synchronously.

## Proposed Approach

- Option A: `setTimeout` + `clearTimeout` pattern — declare `let timeoutId` before the callback, assign after `appendChild`, call `clearTimeout(timeoutId)` in callback and `onerror`, add a test using Jest fake timers.
- Option B: Wrap in `Promise.race` against a timeout Promise — adds indirection, doesn't clean up the `window[callbackName]` or script DOM node. Inferior.
- **Chosen approach:** Option A. Minimal, contained, matches existing cleanup patterns.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add JSONP timeout + clearTimeout + test | 90% | S | Complete (2026-02-27) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Self-contained, single file pair |

## Tasks

---

### TASK-01: Add JSONP timeout and clearTimeout to alloggiatiService + test

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/services/alloggiatiService.ts` + new test case in `apps/reception/src/services/__tests__/alloggiatiService.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/reception/src/services/alloggiatiService.ts`, `apps/reception/src/services/__tests__/alloggiatiService.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — complete code pattern specified: `let timeoutId: ReturnType<typeof setTimeout> | undefined` declared before callback, assigned `= setTimeout(...)` after `appendChild`, `clearTimeout(timeoutId)` added to callback and `onerror`. No unknown variables remain.
  - Approach: 95% — `setTimeout` + `clearTimeout` is the canonical JSONP timeout pattern. Scoping via `let ... | undefined` avoids TypeScript TDZ error while keeping `clearTimeout(undefined)` a no-op.
  - Impact: 90% — eliminates indefinite hang; rejection propagates through `useAlloggiatiSender`'s existing `catch` block cleanly. Held-back test: if GAS cold-start exceeds 30s, a false timeout could occur. Even in that case, Impact > 80 — a false timeout gives an actionable error, which is better than a perpetual hang. No single unknown would drop Impact below 80.
- **Acceptance:**
  - `JSONP_TIMEOUT_MS = 30_000` constant declared at file scope.
  - `sendAlloggiatiRecordsToGoogleScript` rejects with `"Alloggiati submission timed out after 30 seconds."` when callback never fires after 30s.
  - `window[callbackName]` is deleted and script element has no parent node after timeout.
  - `clearTimeout` is called in both the success callback and `onerror` handler.
  - All three existing test cases still pass.
  - New timeout test case passes in CI.
- **Validation contract (TC-XX):**
  - TC-01: Callback fires before timeout → Promise resolves, `clearTimeout` cancels the timer, no spurious rejection.
  - TC-02: `script.onerror` fires before timeout → Promise rejects with "Network error", `clearTimeout` cancels the timer.
  - TC-03: Neither fires; `jest.advanceTimersByTime(30001)` → Promise rejects with "Alloggiati submission timed out after 30 seconds.", `window[callbackName]` is undefined, `scriptEl.parentNode` is null.
  - TC-04: Invalid callback payload before timeout → Promise rejects with `/Invalid response format/`, `clearTimeout` cancels the timer.
- **Execution plan:** Red → Green → Refactor
  - **Red:** Add TC-03 test case to `alloggiatiService.test.ts` using `jest.useFakeTimers()` + `jest.advanceTimersByTime(30001)`. Test fails: no timeout exists yet.
  - **Green:** In `alloggiatiService.ts`: (1) add `const JSONP_TIMEOUT_MS = 30_000;` at file scope after imports; (2) declare `let timeoutId: ReturnType<typeof setTimeout> | undefined;` at the top of the Promise constructor body, before the callback definition; (3) add `clearTimeout(timeoutId);` as the first line of the JSONP callback (before the `delete window[callbackName]` line); (4) add `clearTimeout(timeoutId);` as the first line of `script.onerror`; (5) after `document.body.appendChild(script)`, assign `timeoutId = setTimeout(() => { delete (window as unknown as Record<string, unknown>)[callbackName]; if (script.parentNode) { script.parentNode.removeChild(script); } reject(new Error("Alloggiati submission timed out after 30 seconds.")); }, JSONP_TIMEOUT_MS);` — note the guarded DOM removal `if (script.parentNode)` is required; an unguarded `removeChild(script)` is unscoped and would throw before reaching `reject`, reintroducing the hang. TC-03 now passes.
  - **Refactor:** None required — the implementation is already minimal.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: the `let timeoutId | undefined` pattern is standard; `clearTimeout(undefined)` is valid per TypeScript browser types (`id?: number`). No probe required.
- **Edge Cases & Hardening:**
  - Late callback after timeout: `window[callbackName]` is deleted by timeout handler → invocation throws `ReferenceError` in browser console but Promise is already settled, app state unaffected.
  - Race: callback fires at same tick as timeout fires → `clearTimeout` in callback is a no-op if timeout has already fired; Promise can only settle once (second `reject` is ignored). No data hazard.
  - `testMode: true` path: same code path — no special handling needed.
- **What would make this >=90%:** Already at 90%. Reaching 95% requires CI green confirmation.
- **Rollout / rollback:**
  - Rollout: merge to dev → CI confirms all 4 test cases pass → standard PR merge.
  - Rollback: revert the two-file diff. Zero coupling to other modules.
- **Documentation impact:** None: internal service with no public API contract.
- **Notes / references:**
  - `alloggiatiService.ts:50–136` — Promise constructor, full code read confirmed.
  - `useAlloggiatiSender.ts:55–59` — call site `catch` block handles rejection.
  - Fact-find: `docs/plans/reception-alloggiati-jsonp-timeout/fact-find.md`.
- **Build evidence (2026-02-27):**
  - Codex offload: attempted, fell back to inline (flag API changed in installed version).
  - Implementation: `const timeout = { id: undefined as ReturnType<typeof setTimeout> | undefined }` pattern used to satisfy ESLint `prefer-const` — mutable ref object avoids TDZ while keeping `clearTimeout(timeout.id)` correct in closures.
  - ESLint lint-staged: first attempt failed (`let timeoutId` flagged as prefer-const). Fixed to mutable const ref. Second attempt clean.
  - TypeScript diagnostics: 0 errors on both files (MCP type server).
  - Pre-commit hooks: typecheck + lint passed (turbo, 19 tasks). Pre-existing warnings in unrelated reception files — not caused by this change.
  - Commit: `3edee4504d` on branch `dev`.
  - Post-build validation: Mode 2 (Data Simulation), Attempt 1, Pass. All 4 TCs verified by code reasoning (browser-env function; CI-only test policy applies).
  - Refactor: `let timeoutId` → `const timeout = { id }` mutable ref (prefer-const compliance).

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add JSONP timeout + test | Yes — no dependencies | None | No |

Notes:
- `let timeoutId` declared before callback function — no TDZ issue; TypeScript accepts `clearTimeout(undefined)`.
- `clearTimeout(timeoutId)` in both callback and `onerror` — no double-rejection risk (Promise settles once).
- `jest.advanceTimersByTime` fires `setTimeout` synchronously in fake timer mode — promise rejection awaitable immediately after.
- DOM removal in timeout handler must use guarded form `if (script.parentNode) { script.parentNode.removeChild(script); }` — same as existing callback and `onerror` patterns. Unguarded `removeChild(script)` throws before `reject(...)`.
- "missing resultDetails" else-branch in callback is unreachable after a successful Zod union parse (either `resultDetails` or `error: true` must be present); code is defensive but branch adds no test surface.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| GAS cold-start >30s causes false timeout | Low | Medium — operator sees spurious error | `JSONP_TIMEOUT_MS` is a named constant; trivial to adjust upward if needed. Monitor GAS cold-start latency. |
| Late GAS callback invocation after timeout logs ReferenceError | Very low | None — app state unaffected | Expected behaviour; document in code comment if desired. |

## Observability

- Logging: Timeout rejection propagates to `useAlloggiatiSender`'s `catch` → `console.error("[useAlloggiatiSender]", "Alloggiati submission timed out after 30 seconds.")`.
- Metrics: None: no additional instrumentation added.
- Alerts/Dashboards: None: not in scope.

## Acceptance Criteria (overall)

- [ ] `JSONP_TIMEOUT_MS = 30_000` constant at file scope of `alloggiatiService.ts`
- [ ] `sendAlloggiatiRecordsToGoogleScript` rejects with timeout message after 30s when callback never fires
- [ ] `clearTimeout` called in both callback and `onerror`
- [ ] All 3 prior test cases still pass in CI
- [ ] New timeout test case (TC-03) passes in CI

## Decision Log

- 2026-02-27: `let timeoutId | undefined` chosen over `const` to avoid TypeScript TDZ error when referencing `timeoutId` inside the callback before the `setTimeout` assignment. `clearTimeout(undefined)` is a valid no-op per browser TypeScript types.
- 2026-02-27: Timeout duration 30s — GAS cold-starts typically <5s; 30s avoids false timeouts while giving meaningful feedback within the 24h compliance window.
- 2026-02-27: Option A (setTimeout + clearTimeout) chosen over Option B (Promise.race) — Option B cannot clean up `window[callbackName]` or the script DOM node.

## Overall-confidence Calculation

- TASK-01: 90% × S (weight 1)
- Overall = 90 × 1 / 1 = **90%**
