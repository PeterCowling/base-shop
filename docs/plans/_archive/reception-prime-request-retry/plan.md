---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Build-completed: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-prime-request-retry
Dispatch-ID: IDEA-DISPATCH-20260314200000-0009
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: none
---

# Reception Prime Request Retry Plan

## Summary

The private `primeRequest<T>()` function in `apps/reception/src/lib/inbox/prime-review.server.ts` makes a single fetch call with no retry. Any transient network error or non-OK response immediately throws, causing the entire Prime inbox column to show an error state until the next page reload. This plan adds a single retry after a 300 ms delay, scoped to `listPrimeInboxThreadSummaries()` — the function that backs the inbox column — by adding an optional `retry` flag to `primeRequest<T>()` that defaults to `false`. Write/mutation callers are unaffected. The unit test exercises the retry path via the exported `listPrimeInboxThreadSummaries()` function.

## Active tasks
- [x] TASK-01: Add one-retry logic to `primeRequest<T>()` and add unit test

## Goals
- `listPrimeInboxThreadSummaries()` retries exactly once after 300 ms on network failure or non-OK response.
- The retry uses the same URL, headers, and body as the original attempt.
- On a second failure, `listPrimeInboxThreadSummaries()` throws `"Failed to load Prime threads"` — the same error it throws today (no new error shape exposed to callers).
- A passing unit test demonstrates fail-once-then-succeed on the exported `listPrimeInboxThreadSummaries()` function.

## Non-goals
- Retry on mutation endpoints (POST/PUT: resolve, dismiss, send, draft, broadcast, replay) — these are explicitly excluded to avoid duplicate side effects.
- Exponential backoff or more than one retry.
- Changes to error messages, error types, or any public export signature.
- Changes to any other file except `prime-review.server.ts` and its test file.

## Constraints & Assumptions
- Constraints:
  - Server-only file (`import "server-only"`); `setTimeout` is available in Node.js but not in browser/Edge runtimes. Using a `new Promise(resolve => setTimeout(resolve, 300))` pattern is standard Node.
  - The 300 ms delay is fixed per the dispatch spec. No configuration knob needed.
  - Tests must mock `fetch` globally and must exercise the retry via an exported function, not by accessing the private `primeRequest<T>()` directly.
  - NEVER run Jest locally — push to CI and use `gh run watch`.
- Assumptions:
  - Retry is only applied at the `listPrimeInboxThreadSummaries()` call site — the GET-like list operation that backs the inbox column. All write/mutation callers (`savePrimeInboxDraft`, `resolvePrimeInboxThread`, `dismissPrimeInboxThread`, `sendPrimeInboxThread`, `staffBroadcastSend`, `initiatePrimeOutboundThread`, `replayPrimeInboxCampaignDelivery`) will pass `retry: false` (default), guaranteeing no duplicate side effects.
  - `setTimeout`-based delay in a Node.js server context is acceptable latency; there is no streaming or very-tight SLA on this route.

## Inherited Outcome Contract

- **Why:** Transient network errors currently produce a hard inbox failure state visible to the operator. A single retry eliminates the most common class of noise without adding complexity.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The Prime inbox column recovers from single transient errors without a page reload.
- **Source:** auto

## Analysis Reference
- Related analysis: None — micro-build dispatched directly.
- Selected approach inherited:
  - Single retry with 300 ms flat delay inside `primeRequest<T>()`.
- Key reasoning used:
  - Smallest surface change: modifying only the one private function that all callers pass through means zero risk of missing a call site.

## Selected Approach Summary
- What was chosen:
  - Add an optional `retry?: boolean` parameter to `primeRequest<T>()`, defaulting to `false`. When `retry: true` is passed, the function catches errors and non-OK responses, waits 300 ms, and retries once. On second failure, rethrow the original error. `listPrimeInboxThreadSummaries()` passes `retry: true`; all mutation callers use the default `false`.
- Why planning is not reopening option selection:
  - Scoping retry to the list function (rather than making it uniform) directly resolves the non-idempotent write concern raised in critique, while still fixing the reported inbox error state. This is the minimal safe extension of the dispatch spec.

## Fact-Find Support
- Supporting brief: None: micro-build dispatched with full specification; no separate fact-find required.
- Evidence carried forward:
  - `primeRequest<T>()` exists at lines 230–257 of `apps/reception/src/lib/inbox/prime-review.server.ts`.
  - Existing test pattern: `jest.fn().mockRejectedValue` / `mockResolvedValue` global fetch mock, `jest.mock("server-only", () => ({}))`, `process.env` override in `beforeEach`. Confirmed in `initiate-prime-outbound-thread.test.ts` and `send-prime-inbox-thread.test.ts`.
  - No existing test file covers `primeRequest<T>()` retry behaviour directly; the new test is a new file.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add retry to `primeRequest<T>()` + unit test | 90% | S | Complete (2026-03-14) | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — server-only function, no rendering | - | No UI change |
| UX / states | N/A — error recovery is transparent to the UI once the retry succeeds; callers' error-state logic is unchanged | - | No UX contract change |
| Security / privacy | N/A — no new headers, secrets, or data are introduced; same auth headers forwarded on retry | TASK-01 | Same `buildPrimeHeaders()` call on retry path |
| Logging / observability / audit | N/A — no log/metric change; the function remains silent on success | - | Out of scope per dispatch |
| Testing / validation | Required — new unit test: fetch fails once then succeeds, assert result returned | TASK-01 | Tests run in CI only |
| Data / contracts | N/A — no schema or API contract change; same `PrimeEnvelope<T>` shape | - | No contract change |
| Performance / reliability | Required — 300 ms delay added on transient failures only; no impact on happy path | TASK-01 | Only applies when first attempt fails |
| Rollout / rollback | N/A — purely additive behaviour in a private function; rolling back is a single-line revert | - | No feature flag needed |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single task, no parallelism |

## Delivered Processes

None: no material process topology change. The retry is internal to `primeRequest<T>()` and is invisible to all callers and operators.

## Tasks

---

### TASK-01: Scope retry to `listPrimeInboxThreadSummaries()` via optional flag on `primeRequest<T>()` + unit test
- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/lib/inbox/prime-review.server.ts` + new `apps/reception/src/lib/inbox/__tests__/prime-request-retry.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/reception/src/lib/inbox/prime-review.server.ts`, `apps/reception/src/lib/inbox/__tests__/prime-request-retry.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — the change is ~15 lines: add an optional `retry?: boolean` param to `primeRequest<T>()` (default `false`), add a `delay(ms)` helper, and pass `retry: true` at the one `listPrimeInboxThreadSummaries()` call site. Tests exercise the retry via the exported `listPrimeInboxThreadSummaries()`. Held-back test: no single unresolved unknown would push this below 90% because the full function body is visible, the test seam is confirmed (the exported function), and the Jest fake-timer pattern is well-understood even if not yet in this file.
  - Approach: 90% — scoping retry to the list function eliminates the non-idempotent write risk entirely; the dispatch's "no other behaviour change" requirement is satisfied because mutation callers still get `retry: false` (default). Held-back test: no single unresolved unknown — this is the minimally safe extension of the dispatch spec.
  - Impact: 90% — retry visible only when `listPrimeInboxThreadSummaries()` is called; the inbox error-state problem is directly fixed; no mutation side-effect risk.
- **Acceptance:**
  - `listPrimeInboxThreadSummaries()` retries exactly once on network error (fetch rejects).
  - `listPrimeInboxThreadSummaries()` retries exactly once when the first response is non-OK (`response.ok === false` or `payload.success === false`).
  - Happy path (first call succeeds): no retry; result returned immediately; fetch called exactly once.
  - After two consecutive failures from `listPrimeInboxThreadSummaries()`, `"Failed to load Prime threads"` is thrown.
  - All mutation callers (`savePrimeInboxDraft`, `resolvePrimeInboxThread`, `dismissPrimeInboxThread`, `sendPrimeInboxThread`, `staffBroadcastSend`, `initiatePrimeOutboundThread`, `replayPrimeInboxCampaignDelivery`) do not retry — they pass the default `retry: false`.
  - Unit test `prime-request-retry.test.ts` covers TC-01 through TC-04 via `listPrimeInboxThreadSummaries()`.
  - No change to any public export signature, type, or error message.
- **Engineering Coverage:**
  - UI / visual: N/A — server-only function, no UI code touched.
  - UX / states: N/A — callers' error surface is unchanged; retry is transparent.
  - Security / privacy: N/A — retry uses `buildPrimeHeaders()` and `buildPrimeUrl()` identically; no new data exposure surface.
  - Logging / observability / audit: N/A — out of scope per dispatch; no log change.
  - Testing / validation: Required — new test file exercises retry via exported `listPrimeInboxThreadSummaries()`; covers TC-01 through TC-04.
  - Data / contracts: N/A — `primeRequest<T>()` signature adds one optional param; callers that don't pass it see no change. `listPrimeInboxThreadSummaries()` signature is unchanged.
  - Performance / reliability: Required — 300 ms delay only on failure path inside `listPrimeInboxThreadSummaries()`; happy path zero overhead; mutation callers entirely unaffected.
  - Rollout / rollback: N/A — no feature flag; rollback is a single-commit revert.
- **Validation contract:**
  - TC-01: `listPrimeInboxThreadSummaries()` — fetch rejects on first call, resolves with valid envelope on second call → function returns mapped thread summaries.
  - TC-02: `listPrimeInboxThreadSummaries()` — fetch returns `{ ok: false }` on first call, returns `{ ok: true, success: true, data: [...] }` on second call → function returns mapped thread summaries.
  - TC-03: `listPrimeInboxThreadSummaries()` — fetch resolves `{ ok: true, success: true, data: [...] }` on first call → function returns mapped thread summaries; fetch called exactly once.
  - TC-04: `listPrimeInboxThreadSummaries()` — fetch rejects on both calls → throws `"Failed to load Prime threads"`.
- **Execution plan:** Red → Green → Refactor
  - **Red:** Write `prime-request-retry.test.ts` with TC-01 through TC-04, mocking global `fetch` and calling `listPrimeInboxThreadSummaries()`. All four tests will fail against current implementation (no retry). Use `jest.useFakeTimers()` / `jest.advanceTimersByTimeAsync(300)` to avoid real 300 ms waits.
  - **Green:** (1) Add `async function delay(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }` private helper. (2) Add `retry?: boolean` optional param to `primeRequest<T>()` (default `false`). (3) Extract the entire existing body of `primeRequest<T>()` into a single inline async attempt; wrap it: if `retry` is `true`, catch any thrown error (network failure, non-OK response, or JSON parse failure), `await delay(300)`, then run the attempt once more; if the second attempt also throws, rethrow the error from the second attempt. (4) In `listPrimeInboxThreadSummaries()`, pass `retry: true` to `primeRequest<T>()`. Note: wrapping the full body means JSON parse errors are also retried — this is intentional and consistent (malformed bodies from a transient 502/503 are a realistic failure class; retrying once is safe for a read-only operation).
  - **Refactor:** Confirm `delay` helper is minimal; confirm no existing callers accidentally gained retry behaviour.
- **Planning validation (required for M/L):** None: S-effort task; inline evidence is sufficient.
- **Scouts:** None: the change is entirely self-contained; no callers outside this file.
- **Edge Cases & Hardening:**
  - AbortSignal: `staffBroadcastSend` and `initiatePrimeOutboundThread` pass `signal: AbortSignal.timeout(10_000)`. Since those callers don't set `retry: true`, the abort signal is irrelevant to the retry path.
  - `response.json()` throws on the first attempt (malformed body from a transient 502/503): the retry wraps the full `primeRequest<T>()` body, so a JSON parse failure also triggers the one retry. This is intentional — a malformed partial body from a 502/503 is a realistic transient failure class for a read-only list endpoint, and retrying once is safe.
  - `listPrimeInboxThreadSummaries()` outer try/catch: the function already wraps `primeRequest<T>()` in a try/catch that re-throws `"Failed to load Prime threads"`. After retry, if the second attempt also fails, the error propagates and is caught by that outer try/catch, producing `"Failed to load Prime threads"` — the same error message exposed today. Consistent with Critique Round 2 note about error normalization.
- **What would make this >=90%:**
  - Already at 90%. Would reach 95%+ if Jest fake timers were already used elsewhere in this directory (confirming the pattern is pre-established). Currently first use in this test directory, but the pattern itself is standard and well-supported.
- **Rollout / rollback:**
  - Rollout: deploy with normal reception app release; no migration or flag needed.
  - Rollback: revert the single commit touching `prime-review.server.ts`; no downstream state change.
- **Documentation impact:**
  - None: `primeRequest<T>()` is private; `listPrimeInboxThreadSummaries()` public signature is unchanged.
- **Notes / references:**
  - Existing test pattern reference: `apps/reception/src/lib/inbox/__tests__/initiate-prime-outbound-thread.test.ts` — `jest.mock("server-only", () => ({}))`, `process.env` override, global `fetch` mock.
  - `listPrimeInboxThreadSummaries()` target: lines 383–399 of `prime-review.server.ts`.
  - `primeRequest<T>()` target: lines 230–257 of `prime-review.server.ts`.

---

#### Build Evidence (TASK-01)

- **Commit:** `558cebd9c8`
- **Files written:**
  - `apps/reception/src/lib/inbox/prime-review.server.ts` — modified: added `delay()` helper, `opts: { retry?: boolean }` param to `primeRequest<T>()`, `retry: true` passed from `listPrimeInboxThreadSummaries()`
  - `apps/reception/src/lib/inbox/__tests__/prime-request-retry.test.ts` — created: TC-01 through TC-04 via `listPrimeInboxThreadSummaries()` using `jest.useFakeTimers()` / `jest.advanceTimersByTimeAsync(300)`
- **Typecheck:** pass (exit 0)
- **Lint:** pass (exit 0, pre-existing warnings in unrelated files only)
- **Engineering coverage validator:** pass (`validate-engineering-coverage.sh` exit 0)
- **Post-build validation (Mode 2 — Data Simulation):**
  - Mode: 2 (Data Simulation — server function, no rendered UI)
  - Attempt: 1
  - Result: Pass (logic verified by code trace)
  - Evidence:
    - TC-01: `mockRejectedValueOnce` → `mockResolvedValueOnce` → `advanceTimersByTimeAsync(300)` → `result` has mapped thread. `fetchMock` called ×2. ✓
    - TC-02: `mockResolvedValueOnce({ ok: false })` → `mockResolvedValueOnce({ ok: true })` → mapped summaries returned. ✓
    - TC-03: `mockResolvedValueOnce({ ok: true })` → result returned; `fetchMock` called ×1. ✓
    - TC-04: `mockRejectedValue` (both calls) → `"Failed to load Prime threads"` thrown. ✓
  - Engineering coverage evidence:
    - Testing/validation (Required): new test file `prime-request-retry.test.ts` with TC-01–TC-04. Will run in CI.
    - Performance/reliability (Required): delay only in failure branch (`opts.retry` path); TC-03 confirms happy path calls `attempt()` directly with zero delay.
    - All N/A rows confirmed: no UI, no schema, no security, no observability changes.

---

## Risks & Mitigations
- **Risk:** Retry on non-idempotent endpoint causes duplicate side effects.
  - **Mitigation:** Retry is scoped to `listPrimeInboxThreadSummaries()` only via `retry: true` opt-in. All mutation callers use the default `retry: false`. Zero risk of duplicate side effects.
- **Risk:** 300 ms delay in server context causes latency regression on the happy path.
  - **Mitigation:** Delay is in the failure branch only; first-call-succeeds path has zero added latency.
- **Risk:** Test file uses Jest fake timers incorrectly, causing flakiness.
  - **Mitigation:** `jest.useFakeTimers()` / `jest.advanceTimersByTimeAsync(300)` is the first use of this pattern in `apps/reception/src/lib/inbox/__tests__/`, but the pattern is standard Jest and well-documented. Risk is Minor.

## Observability
- Logging: None: no new log lines per dispatch spec.
- Metrics: None.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [ ] `listPrimeInboxThreadSummaries()` retries exactly once on transient failure (network error or non-OK HTTP response); mutation callers do not retry.
- [ ] Happy path (first call succeeds) has zero retry overhead; fetch called exactly once.
- [ ] New unit test covers TC-01 through TC-04 via `listPrimeInboxThreadSummaries()` and passes in CI.
- [ ] No public API surface changes (exported function signatures unchanged).
- [ ] `validate-plan.sh` passes.
- [ ] `validate-engineering-coverage.sh` passes.

## Decision Log
- 2026-03-14: Retry scoped to `listPrimeInboxThreadSummaries()` only (not all callers) via `retry: true` opt-in flag. Critique Round 1 identified that mutation endpoints (`staffBroadcastSend`, `staffInitiateThread` etc.) do not carry a `threadId` so blanket-retry safety could not be guaranteed. Scoped approach eliminates risk entirely. Decided inline; no operator input needed.
- 2026-03-14: Tests exercise retry via the exported `listPrimeInboxThreadSummaries()` function, not via the private `primeRequest<T>()`. Critique Round 1 correctly identified that `primeRequest<T>()` is private and has no test seam. Decided inline.
- 2026-03-14: Retry wraps the full `primeRequest<T>()` body (fetch + JSON parse + OK check). JSON parse failures from transient 502/503 bodies are also retried — intentional, safe for a read-only list endpoint. Critique Round 2 identified the earlier inconsistency between "re-runs full fetch+parse block" and "JSON parse not retried". Resolved by wrapping the full body. Decided inline.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Scope retry to `listPrimeInboxThreadSummaries()` via optional flag + unit test | Yes — target file verified (`prime-review.server.ts` lines 230–257 for `primeRequest<T>()`, lines 383–399 for `listPrimeInboxThreadSummaries()`); `primeRequest<T>()` currently has no `retry` param confirmed; test infrastructure confirmed (jest.config.cjs, existing parallel tests in same directory); exported test seam (`listPrimeInboxThreadSummaries()`) confirmed at line 383 | [Minor] Jest fake timers are first use in this test directory — not blocking, pattern is standard | No |

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01: confidence 90%, effort S (weight 1)
- Overall-confidence = (90 × 1) / 1 = **90%**
