---
Type: Build-Record
Status: Complete
Domain: UI
Last-reviewed: 2026-03-12
Feature-Slug: xa-uploader-memory-leak-fixes
Execution-Track: code
Completed-date: 2026-03-12
artifact: build-record
---

# Build Record: XA Admin Tool Memory/Freeze Fixes

## Outcome Contract

- **Why:** Background requests and polling loops run without cleanup, causing memory leaks and potential frozen UI during normal use
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** All fetch calls use AbortController with cleanup on unmount; all setTimeout handles cleaned up in finally blocks; fetch operations have 10s timeout
- **Source:** operator

## What Was Built

Four targeted fixes to prevent memory leaks and UI freezes in the XA admin tool:

1. **deployHook.ts** -- Moved `clearTimeout` from the catch block and post-try position into a `finally` block in `triggerDeployHookOnce`, ensuring the timeout handle is always cleaned up regardless of how the fetch resolves.

2. **CatalogProductImagesFields.client.tsx** -- Added AbortController cancellation to the `usePersistedImageCleanup` polling loop. The polling `setTimeout` chain now listens for abort signals, and the DELETE fetch call passes the abort signal. A cleanup effect aborts on unmount. This prevents the polling loop from continuing after the component unmounts.

3. **useCatalogConsole.client.ts** -- Added a `createTimeoutSignal` helper that creates a 10-second timeout AbortController (composable with a parent signal for cleanup-on-unmount). Applied to `loadSession` and `loadCatalogFromServer` so they abort after 10 seconds. Compacted the return object to stay within the max-lines-per-function lint limit.

4. **CurrencyRatesPanel.client.tsx** -- Added a 10-second timeout to the `loadRates` fetch in the useEffect, with proper cleanup of both the timeout and abort controller in the finally block and the effect cleanup function.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter xa-uploader exec tsc --noEmit` | Pass | No type errors |
| `pnpm --filter xa-uploader lint` | Pass | Only pre-existing warnings (tap-size, hardcoded-copy) |

## Workflow Telemetry Summary

None: workflow telemetry not recorded.

## Validation Evidence

### Fix 1: deployHook clearTimeout
- clearTimeout moved to finally block at line 374-382 -- verified by code review and typecheck

### Fix 2: usePersistedImageCleanup AbortController
- AbortController added with cleanup effect -- verified by typecheck
- Polling loop checks `controller.signal.aborted` -- verified by code review
- DELETE fetch passes `signal: controller.signal` -- verified by code review

### Fix 3: useCatalogConsole 10s timeout
- `createTimeoutSignal` helper composes timeout + parent signal -- verified by typecheck
- loadSession and loadCatalogFromServer use the helper -- verified by code review

### Fix 4: CurrencyRatesPanel 10s timeout
- Timeout added to loadRates useEffect -- verified by typecheck
- Cleanup function clears timeout and aborts -- verified by code review

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | No visual changes |
| UX / states | N/A | Cleanup logic only; no user-visible state changes |
| Security / privacy | N/A | No security surface changes |
| Logging / observability / audit | N/A | Existing console.warn preserved for image cleanup errors |
| Testing / validation | Typecheck + lint pass | Tests run in CI only per testing policy |
| Data / contracts | N/A | No API contract changes |
| Performance / reliability | Improved | Fetch timeouts prevent indefinite hangs; AbortController prevents leaked polling |
| Rollout / rollback | Low risk | Pure additive cleanup; revert commit reverts all changes |

## Scope Deviations

None. The dispatch referenced `catalogCloudPublish.ts` but that file has no setTimeout/clearTimeout patterns. The equivalent pattern in `catalogContractClient.ts` already has clearTimeout in a finally block, so no change was needed there.
