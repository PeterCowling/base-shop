# TASK-06: Route-Health Triage Report

**Date:** 2026-03-08
**Status:** Complete
**Plan:** docs/plans/reception-theme-styling-cohesion/plan.md

## Summary

Three of the four investigated routes have defects rooted in async data-loading rather than component logic: `EndOfDayPacket` produces a blank render when the Firebase pre-flight query stalls, and `RealTimeDashboard` stays permanently on "Loading data..." when Firebase does not resolve within a session. `DocInsertPage` carries a Turbopack module-identity risk from bare `@acme/design-system` barrel imports in its sub-components. `SafeManagement` is structurally sound — the reported crash is not reproducible from source analysis and is likely a transient Firebase or context-auth issue. All four defects are fully independent of the styling wave's archetype primitives.

---

## Route Triage

### /doc-insert (DocInsertPage.tsx)

- **Classification:** Potential Turbopack module-identity error / component render failure
- **Severity:** High (form unusable when triggered)
- **Root cause:** `DocInsertPage.tsx` itself imports only `@acme/design-system/atoms` (sub-path, safe). However its sub-components `row1.tsx`, `row3.tsx`, `AutoComplete.tsx`, and `DOBSection.tsx` all import from the `@acme/design-system` bare barrel (`import { Input, Select, … } from "@acme/design-system"`). Per the project's known Turbopack dual module-identity pattern (MEMORY.md), bare-specifier imports resolve to the package's exports map while sub-path imports (`/atoms`) bypass the alias — this creates two module instances for the same package on Turbopack. In reception's case, `apps/reception/next.config.mjs` has a bare-specifier alias for `@acme/ui` but NOT for `@acme/design-system`, so the DS package has no alias to cause the known "server relative imports" failure — however the inconsistent mix of bare and sub-path imports across the component tree creates a dual-instantiation risk (components from different module instances share no context). A secondary but lower-risk factor is that `useSingleGuestDetails` makes a network call keyed on `bookingRef` from URL search params — if the params are absent or the API returns an error, the `error` branch renders correctly rather than crashing. No unsafe null-access patterns were found in the component itself. The most likely crash vector is the bare `@acme/design-system` barrel import in sub-components under Turbopack.
- **Independence from styling wave:** Yes — the defect predates any archetype-primitive wrapping. Wrapping in `OperationalTableScreen` or `ScreenHeader` will not trigger or mask it. The fix (migrate sub-components from bare barrel to sub-path imports) is purely internal to the docInsert directory.
- **Recommended next step:** New separate plan — audit all `@acme/design-system` bare barrel imports in the reception app's docInsert sub-components and migrate to explicit sub-path imports (`@acme/design-system/atoms`, etc.). Track as a Turbopack compatibility clean-up task.

---

### /safe-management (SafeManagement.tsx)

- **Classification:** Likely transient data/auth issue — no structural component error found
- **Severity:** High (reported crash), but source analysis shows no reproducible crash path
- **Root cause:** The component calls `useSafeData()` which throws if rendered outside `SafeDataProvider`. The page (`apps/reception/src/app/safe-management/page.tsx`) correctly wraps the component: `<TillShiftProvider><SafeDataProvider><SafeManagement /></SafeDataProvider></TillShiftProvider>`. The `SafeDataProvider` is called without `startAt`/`endAt`, which is valid — `UseSafeLogicParams` treats both as optional, so `useSafeLogic` passes `undefined` to `useSafeCountsData`, resulting in a query with no date filter (loads all safe records). This is intentional for the management view. `SafeManagement` also calls `useTillShiftActions()` which requires `TillShiftProvider` — that is present. No unsafe prop accesses, no unguarded array/object access, no missing null checks were found. Error state is handled via `showToast`. The reported crash is most likely a transient Firebase permission or environment issue (missing Firebase credentials in the session, or a `RTDB_URL` env var not set), not a code defect in the component itself.
- **Independence from styling wave:** Yes — if a real crash exists, it is at the Firebase/auth layer, not in component rendering. Applying `OperationalTableScreen` / `ActionRail` archetypes would not affect data fetching or context provision.
- **Recommended next step:** Verify Firebase RTDB credentials and RTDB_URL are present in the deployment environment. If the crash cannot be reproduced after environment check, close as environment issue. No code change needed at this time; do not include in the styling wave plan.

---

### /end-of-day (EndOfDayPacket.tsx)

- **Classification:** Async state — conditional render gate that never opens
- **Severity:** Critical (route renders nothing useful until Firebase resolves)
- **Root cause:** The outer `EndOfDayPacket` component renders `EndOfDayPacketContent` only when `startAt !== null` (line 794: `{startAt && (<SafeDataProvider ...><EndOfDayPacketContent /></SafeDataProvider>)}`). `startAt` is initialized to `null` and is only set by the `determineStart()` async function which queries Firebase RTDB (`safeCounts` node) to find the most recent opening/reset record within a lookback window. The `TillDataProvider` renders unconditionally but the content is gated. If Firebase is unreachable, slow, or returns a permission error, the `catch` block calls `showToast` and returns without setting `startAt` — leaving the view permanently blank. There is no loading indicator for this outer shell, no timeout UI, and no fallback message when `startAt` remains null after the async query completes (or fails). The component imports `@acme/design-system` as a bare barrel (line 14) for the Table primitives — this carries the same Turbopack dual-identity risk as docInsert, but only surfaces after `startAt` resolves, making it a secondary concern.
- **Independence from styling wave:** Yes — the blank-render defect is in the data-loading shell (`EndOfDayPacket`), not in `EndOfDayPacketContent`. Wrapping the content in `OperationalTableScreen` or `ScreenHeader` archetypes would not change the fact that the wrapper never renders when Firebase is slow. The fix is to add a visible loading state and error fallback to the outer shell.
- **Recommended next step:** New separate plan — add a loading indicator and error/null fallback to the `EndOfDayPacket` outer shell for the period while `startAt` is still `null`. The minimal fix is to render a spinner or message when `startAt === null` after the async determination completes (differentiate "still determining" from "determination failed").

---

### /real-time-dashboard (RealTimeDashboard.tsx)

- **Classification:** Async state — loading flag that never resolves when Firebase is unavailable
- **Severity:** High (feature permanently shows "Loading data..." in degraded environments)
- **Root cause:** Both data hooks (`useAllFinancialTransactionsData` and `useCashCountsData`) initialize `loading: true` and only transition to `loading: false` inside the Firebase `onValue` callback (or its error handler). The component renders `<p className="p-4">Loading data...</p>` when `loading || cashLoading` is true (line 120-122). If the Firebase RTDB connection is never established — due to missing credentials, network unavailability, or Firebase auth rules blocking the query — the `onValue` callback never fires, both loading flags remain `true` indefinitely, and the component is permanently stuck on the loading message. The error branch (`error || cashError`) can only be reached if Firebase fires the error callback, which also requires a connection. There is no timeout mechanism in either hook to transition out of the loading state after a set duration. The 60-second `forceRefresh` interval (line 30-35) only re-renders the component — it does not retry the Firebase subscription. Chart.js is registered globally at module level (`Chart.register(...registerables)`) which is safe but means the import side-effect runs even during the loading state.
- **Independence from styling wave:** Yes — the defect is entirely in the data-loading and state-management layer. Adding `PageShell` wrapping (already present) or `OperationalTableScreen` archetypes would not affect Firebase subscription behavior.
- **Recommended next step:** Existing environment issue to verify first (same Firebase credentials check as safe-management). If the Firebase connection is confirmed healthy, create a separate plan to add timeout-based loading fallback to `useAllFinancialTransactionsData` and `useCashCountsData`, or add a client-side timeout in the component that transitions to an error state after N seconds without data.

---

## CHECKPOINT-01 Horizon Validation

- **Are all 4 routes confirmed independent of Wave 1 styling work?** Yes. Wave 1 applies `ScreenHeader` and layout structure to already-rendering routes. None of the 4 defects are caused by or interact with the `OperationalTableScreen`, `ScreenHeader`, `ActionRail`, or `FilterToolbar` archetypes. The blank/crash states exist before any archetype rendering would occur (they are in data-loading shells or Turbopack module resolution), so the styling wave cannot mask or worsen them.

- **Should any route be excluded from Wave 2 scope?** The following should be excluded from Wave 2 (the wave that applies archetypes to these specific routes) until their defects are resolved:
  - `/end-of-day` — blank render means Wave 2 archetype wrapping cannot be verified visually; fix the loading-gate defect first.
  - `/real-time-dashboard` — permanent loading state means Wave 2 archetype layout cannot be validated; resolve the Firebase connection or add timeout fallback first.
  - `/doc-insert` — the bare barrel import Turbopack risk should be resolved before Wave 2 wrapping, since adding archetype wrappers may add additional DS imports that exacerbate the dual-identity issue.
  - `/safe-management` — can proceed to Wave 2 once the Firebase/auth environment is confirmed healthy; no code change is required in the component itself.

- **Any immediate minimal fix warranted before Wave 2?**
  - **EndOfDayPacket**: Add a `<SmallSpinner />` (already imported in the file) when `startAt === null` — one-line change in the outer shell's return. This is low-risk and should be done before Wave 2 to enable visual validation.
  - **RealTimeDashboard**: No trivial minimal fix — requires either a hook-level timeout or Firebase connectivity diagnosis. Defer to a separate plan.
  - **DocInsertPage sub-components**: Migrate four files from `@acme/design-system` bare barrel to sub-path imports. Small-scope change, can be done as a pre-Wave-2 prerequisite.
  - **SafeManagement**: No code change needed; environment verification only.
