---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: reception-alloggiati-jsonp-timeout
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-alloggiati-jsonp-timeout/plan.md
Trigger-Why: Government compliance submission can silently stall with no timeout, leaving the UI stuck indefinitely and potentially missing the 24h legal deadline for Italian guest registration.
Trigger-Intended-Outcome: type: operational | statement: Add a 30-second timeout to the Alloggiati JSONP Promise so that unresponsive callbacks reject cleanly, free all resources, and surface an error to the operator | source: operator
---

# Alloggiati JSONP Timeout Fact-Find Brief

## Scope

### Summary

`sendAlloggiatiRecordsToGoogleScript` in `alloggiatiService.ts` submits Italian guest registration records (Alloggiati Web — mandatory within 24h of check-in) via a JSONP pattern. The Promise currently has four rejection paths: `script.onerror` (fires when the script element fails to load — network error, 404, etc., without callback invocation); and three paths inside the callback once it fires — Zod schema rejection (invalid payload shape), GAS error payload (`"error" in response && response.error`), and missing `resultDetails`. There is no rejection path for the case where the script loads successfully (no `onerror`) but the JSONP callback is never invoked — for example, when the GAS response is valid JavaScript that does not call the expected callback name. In that scenario the Promise hangs indefinitely, `useAlloggiatiSender.isLoading` stays `true` forever, and no error is surfaced to the operator or guest. This is a compliance risk: a missed submission that appears to be in progress.

### Goals

- Add a `setTimeout`-based rejection path to `sendAlloggiatiRecordsToGoogleScript` that fires after 30 seconds if neither the callback nor `onerror` has resolved the Promise.
- Ensure the timeout handler performs the same cleanup as the existing paths: delete `window[callbackName]`, remove the script element from the DOM.
- Ensure that when the callback or `onerror` fires *before* the timeout, the timeout is cancelled (`clearTimeout`) to prevent a spurious rejection after a successful resolve.
- Add a test case covering the timeout path.

### Non-goals

- Replacing JSONP with a server-side fetch proxy (noted as adjacent future work — not in scope here).
- Adding retry logic (a follow-on concern; the operator needs a clear failure signal first).
- Changing the GAS endpoint URL or submission format.
- Touching `useAlloggiatiSender.ts` (the timeout is properly owned at the service layer; the hook already handles Promise rejection by setting `error` state).

### Constraints & Assumptions

- Constraints:
  - The fix must be contained entirely to `alloggiatiService.ts` and its test file.
  - No new dependencies. `setTimeout`/`clearTimeout` are browser globals already available in this client-side code.
  - The timeout value should be a named constant at the top of the function (not a magic number) for legibility.
- Assumptions:
  - 30 seconds is an appropriate timeout for a GAS → Alloggiati Web round trip. GAS web apps have a 6-minute execution limit, but a network-stall scenario will typically manifest as a silent hang rather than a slow response. 30 seconds is long enough to avoid false timeouts under normal latency and short enough to give meaningful feedback.
  - The test environment uses Jest fake timers (`jest.useFakeTimers`) — the test for the timeout path will need to use `jest.runAllTimers()` or `jest.advanceTimersByTime(30001)`.

## Outcome Contract

- **Why:** Government compliance submission can silently stall, leaving `isLoading: true` indefinitely and potentially missing the 24h legal window for Italian guest registration without any operator notification.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `sendAlloggiatiRecordsToGoogleScript` rejects with a descriptive error after 30 seconds if the JSONP callback never fires, cleans up all resources (window callback, script DOM node), and the new timeout path is covered by a test.
- **Source:** operator

## Access Declarations

None — all investigation is against local source files and test files with no external service access required.

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/services/alloggiatiService.ts:43` — `sendAlloggiatiRecordsToGoogleScript(occupantRecords, testMode)` — the JSONP Promise factory. Entry point for the fix.

### Key Modules / Files

- `apps/reception/src/services/alloggiatiService.ts` — contains the entire JSONP implementation. 137 lines. The Promise constructor runs from line 50 to 136.
- `apps/reception/src/hooks/mutations/useAlloggiatiSender.ts` — the only call site. Wraps the service call, manages `isLoading` + `error` state, handles the `catch` branch with `setError(message)`. Not modified by this task.
- `apps/reception/src/services/__tests__/alloggiatiService.test.ts` — existing test file with 3 test cases (callback fires, `onerror`, invalid payload). The timeout path test goes here.

### Patterns & Conventions Observed

- Cleanup pattern is consistent: both the success callback and `onerror` do `delete window[callbackName]` then `removeChild(script)` before resolving/rejecting. The timeout handler must follow the same pattern.
- Callback name is `jsonpCallback_${Date.now()}_${randomHex}` — unique per call, no collision risk.
- The service file is pure TypeScript with no React imports — it stays that way.
- Tests use `jest.spyOn(document, "createElement")` to capture the script element and `jest.spyOn(document.body, "appendChild")` to confirm it was appended. The timeout test will additionally need `jest.useFakeTimers()` to advance time without actually waiting.

### Data & Contracts

- Types/schemas/events:
  - `GASResponseSchema` (Zod union) — validates the raw JSONP payload. Unchanged.
  - `AlloggiatiResultDetail[]` — the Promise resolution type. Unchanged.
- API/contracts:
  - The function signature `(occupantRecords: string[], testMode: boolean): Promise<AlloggiatiResultDetail[]>` is unchanged — rejection via timeout is additive.
  - `useAlloggiatiSender` calls `sendAlloggiatiRecordsToGoogleScript` and already handles Promise rejection by setting `error` state. The timeout rejection will propagate correctly through the existing `catch` block.

### Dependency & Impact Map

- Upstream dependencies: `document.createElement`, `document.body.appendChild`, `window` (global) — all available in the browser and in jsdom (test env).
- Downstream dependents: `useAlloggiatiSender.ts` is the only call site. Its existing `catch` block handles any rejection, so no changes needed there.
- Likely blast radius: minimal. One file changed (plus its test). The success and `onerror` paths are unchanged — only a new `clearTimeout` call is added to each.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + jsdom (same as all reception tests)
- Commands: tests run in CI only — validated via CI run after PR push (repo policy: no local Jest execution)
- CI integration: reception Jest suite runs on CI

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Callback fires (success) | Unit | `alloggiatiService.test.ts:45` | Covered |
| `script.onerror` rejection | Unit | `alloggiatiService.test.ts:84` | Covered |
| Invalid callback payload | Unit | `alloggiatiService.test.ts:107` | Covered |
| **Callback never fires (timeout)** | Unit | **Missing** | Not covered — this is the gap |

#### Coverage Gaps

- Untested paths: timeout path — script loads but callback never invoked. This is the primary risk scenario.

#### Testability Assessment

- Easy to test: `jest.useFakeTimers()` in the timeout test case, then `jest.advanceTimersByTime(30001)` to trigger the timeout without the real 30s wait. Assert that the Promise rejects with the expected message, the window callback is deleted, and the script element has no parent.
- Test seams needed: none — the existing `document.createElement` spy infrastructure in `beforeEach` already captures the script element.

## Questions

### Resolved

- Q: What timeout duration is appropriate?
  - A: 30 seconds (`JSONP_TIMEOUT_MS = 30_000`). GAS web apps respond within seconds under normal conditions; a 30s timeout will only fire on genuine stalls. The 24h legal window means we want to surface failures quickly enough for the operator to retry manually — 30s is fast enough. A shorter value (10s) risks false timeouts under GAS cold-start latency.
  - Evidence: GAS web app execution model; Alloggiati Web is a synchronous web service.

- Q: Does the `useAlloggiatiSender` hook need changes?
  - A: No. Its `catch` block at line 55 already does `setError(message); return null;` for any rejection. The timeout rejection propagates correctly with no changes needed.
  - Evidence: `apps/reception/src/hooks/mutations/useAlloggiatiSender.ts:55-59`

- Q: Is there a risk of double-rejection (timeout fires + callback fires simultaneously)?
  - A: No. The `clearTimeout(timeoutId)` call in the callback and in `onerror` prevents the timeout from firing after either has already resolved/rejected. A Promise can only settle once, so even without `clearTimeout` there would be no functional error — but clearing the timer is correct for resource cleanup.
  - Evidence: JavaScript Promise semantics; `clearTimeout` is idempotent.

- Q: Should the timeout error message include the duration?
  - A: Yes — `"Alloggiati submission timed out after 30 seconds."` is self-documenting and avoids ambiguity if the timeout constant is later changed.
  - Evidence: convention in existing `console.error("[useAlloggiatiSender]", message)` — the message is the user-facing and log-facing string.

- Q: Is there a memory leak risk from the window callback if timeout fires?
  - A: Resolved. The timeout handler deletes `window[callbackName]` as its first action (same pattern as callback and onerror). After the timeout fires, if the GAS script eventually executes and attempts to invoke the callback name, `window[callbackName]` will be undefined — the call throws a `ReferenceError` in the browser console but the Promise is already settled and app state is unaffected. No memory leak.
  - Evidence: `alloggiatiService.ts:60,128` — cleanup pattern confirmed in both existing paths.

### Open (Operator Input Required)

None — all questions resolved by reasoning from the code and documented constraints.

## Confidence Inputs

- Implementation: 98% — the fix is a `setTimeout` + `clearTimeout` pattern, fully understood from the code. No ambiguity.
  - To reach 99%: confirm CI passes post-implementation (all existing tests green + new timeout test green).
- Approach: 95% — the `setTimeout` pattern is the standard JSONP timeout idiom.
  - To reach 99%: confirm GAS execution behaviour under network stall in production (cannot be tested locally).
- Impact: 90% — this eliminates the indefinite hang. The operator gets a clear error message within 30 seconds of a stall.
  - What would raise it: a production stall event that can be confirmed resolved by the fix.
- Delivery-Readiness: 98% — self-contained, one file + one test, no dependencies.
- Testability: 95% — Jest fake timers make the timeout path straightforward to test.
  - To reach 99%: confirm jsdom fake timer compatibility with `setTimeout` in the test (standard — no issues expected).

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 30s timeout too short for GAS cold-start | Low | Medium — spurious timeout during normal operation | Named constant `JSONP_TIMEOUT_MS` makes it trivial to adjust. GAS cold-starts are typically <5s. |
| Fake timer setup in test conflicts with `beforeEach` restore | Low | Low — test fails but source is correct | Scope `jest.useFakeTimers()` to the specific test case with `afterEach(() => jest.useRealTimers())` |
| GAS script executes after timeout and calls deleted callback | Very low | None — browser logs a ReferenceError but Promise is already settled; app state unaffected | `window[callbackName]` is deleted by timeout handler; late invocation does not affect settled Promise |

## Planning Constraints & Notes

- Must-follow patterns:
  - Named constant at file scope: `const JSONP_TIMEOUT_MS = 30_000;`
  - Same cleanup sequence as existing paths: delete window callback → remove script from DOM → reject/resolve
  - `clearTimeout` added to both the success callback and `onerror` handler
- Rollout/rollback expectations: trivial — contained to one service file. Rollback = revert the diff.
- Observability expectations: the timeout rejection propagates to `useAlloggiatiSender`'s `error` state and is logged via `console.error("[useAlloggiatiSender]", message)`. No additional instrumentation needed for this change.

## Suggested Task Seeds (Non-binding)

- TASK-01: Add `JSONP_TIMEOUT_MS` constant + `setTimeout` rejection path to `sendAlloggiatiRecordsToGoogleScript`, with `clearTimeout` in callback and `onerror`. Add timeout test case to `alloggiatiService.test.ts`.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| JSONP Promise construction (service layer) | Yes | None | No |
| Cleanup path on timeout | Yes — mirrors existing onerror cleanup | None | No |
| Call site (useAlloggiatiSender) | Yes — no changes needed | None | No |
| Test landscape — existing cases | Yes — 3 existing tests confirmed | None | No |
| Test landscape — timeout case | Yes — gap confirmed, approach designed | None | No |
| Resource leak (window callback after timeout) | Yes — delete pattern confirmed correct | None | No |
| Double-rejection risk | Yes — `clearTimeout` prevents it | None | No |

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `sendAlloggiatiRecordsToGoogleScript` rejects with `"Alloggiati submission timed out after 30 seconds."` after 30s when callback never fires
  - `window[callbackName]` is deleted and script element has no parent after timeout
  - `clearTimeout` is called in both the success callback and `onerror`
  - New test case passes under `jest.useFakeTimers()`
  - All existing 3 test cases still pass
- Post-delivery measurement plan: monitor `useAlloggiatiSender` error state in production; a timeout rejection will appear in `console.error` with the message above.

## Evidence Gap Review

### Gaps Addressed

- Full service implementation read (`alloggiatiService.ts`) — JSONP Promise structure fully understood.
- Only call site (`useAlloggiatiSender.ts`) confirmed — no other consumers.
- Existing test file read — coverage gaps confirmed, test approach fully specified.

### Confidence Adjustments

- No downward adjustments. All confidence inputs are high (≥90%) because the fix is self-contained and the problem is precisely bounded.

### Remaining Assumptions

- GAS cold-start latency does not regularly exceed 30 seconds (low risk; observable in production if wrong).

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-alloggiati-jsonp-timeout --auto`
