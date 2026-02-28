---
Status: Complete
Feature-Slug: reception-alloggiati-jsonp-timeout
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record — reception-alloggiati-jsonp-timeout

## What Was Built

**TASK-01:** Added a 30-second timeout to the JSONP Promise in `apps/reception/src/services/alloggiatiService.ts`.

Prior to this change the Promise had no time limit: if the Google Apps Script loaded but its JSONP callback never fired (e.g. changed response format, network stall), `sendAlloggiatiRecordsToGoogleScript` would hang indefinitely with `isLoading: true` and no operator notification — creating a silent compliance risk within the 24-hour Italian guest-registration window.

Changes made:
- Added `const JSONP_TIMEOUT_MS = 30_000` at file scope (after imports) as a named constant.
- Declared `const timeout = { id: undefined as ReturnType<typeof setTimeout> | undefined }` as a mutable ref object inside the Promise constructor body, before the JSONP callback definition. The object pattern (rather than `let timeoutId`) satisfies ESLint `prefer-const` while allowing closures to reference and update `timeout.id`.
- Added `clearTimeout(timeout.id)` as the first line of the JSONP success callback (before `delete window[callbackName]`).
- Added `clearTimeout(timeout.id)` as the first line of `script.onerror`.
- Added `timeout.id = setTimeout(() => { ... reject(new Error("Alloggiati submission timed out after 30 seconds.")); }, JSONP_TIMEOUT_MS)` after `document.body.appendChild(script)`. The DOM removal inside the timeout handler is guarded: `if (script.parentNode) { script.parentNode.removeChild(script); }`.

Added a fourth test case (`TC-03`) to `apps/reception/src/services/__tests__/alloggiatiService.test.ts` using `jest.useFakeTimers()` + `jest.advanceTimersByTime(30001)` to verify the timeout rejection path without relying on real time.

## Tests Run

No local test execution — repo policy: tests run in CI only (see `docs/testing-policy.md`).

Pre-commit hooks executed on commit `3edee4504d`:
- `typecheck-staged.sh` (turbo, 19 tasks): passed, 0 TypeScript errors on both affected files.
- `lint-staged-packages.sh`: first attempt failed (`let timeoutId` flagged as `prefer-const`); refactored to mutable ref object pattern; second attempt passed clean.

TypeScript MCP diagnostics (`mcp__ide__getDiagnostics`): 0 errors on `alloggiatiService.ts` and `alloggiatiService.test.ts`.

## Validation Evidence

Post-build validation Mode 2 (Data Simulation), Attempt 1 — Pass. All four TCs verified by code reasoning.

| TC | Description | Result |
|---|---|---|
| TC-01 | Callback fires before timeout → Promise resolves; `clearTimeout` cancels timer; no spurious rejection | Pass — `clearTimeout(timeout.id)` is first line of callback; Promise settles once |
| TC-02 | `script.onerror` fires before timeout → Promise rejects with "Network error"; `clearTimeout` cancels timer | Pass — `clearTimeout(timeout.id)` is first line of `onerror` |
| TC-03 | Neither fires; `jest.advanceTimersByTime(30001)` → Promise rejects with "Alloggiati submission timed out after 30 seconds."; `window[callbackName]` undefined; `scriptEl.parentNode` null | Pass — test case added; timeout fires, callback deleted, script detached before reject |
| TC-04 | Invalid callback payload → Promise rejects with `/Invalid response format/`; `clearTimeout` cancels timer | Pass — Zod `safeParse` fails; reject called inside callback after `clearTimeout` |

Acceptance criteria check:
- [x] `JSONP_TIMEOUT_MS = 30_000` constant at file scope of `alloggiatiService.ts`
- [x] `sendAlloggiatiRecordsToGoogleScript` rejects with `"Alloggiati submission timed out after 30 seconds."` when callback never fires after 30s
- [x] `window[callbackName]` is deleted and script element has no parent node after timeout
- [x] `clearTimeout` called in both success callback and `onerror` handler
- [x] New timeout test case (TC-03) present in the test file; all 3 prior cases unchanged

## Scope Deviations

None. Implementation confined to the two files listed in `Affects`: `alloggiatiService.ts` and `alloggiatiService.test.ts`.

## Outcome Contract

- **Why:** Government compliance submission can silently stall, leaving `isLoading: true` indefinitely and potentially missing the 24-hour legal window for Italian guest registration.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `sendAlloggiatiRecordsToGoogleScript` rejects with a descriptive error after 30 seconds if the JSONP callback never fires, cleans up all resources, and the timeout path is covered by a CI-green test.
- **Source:** operator
