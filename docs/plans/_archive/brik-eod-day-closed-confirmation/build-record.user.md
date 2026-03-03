---
Status: Complete
Feature-Slug: brik-eod-day-closed-confirmation
Completed-date: 2026-02-28
artifact: build-record
---

# Build Record — EOD Day-Closed Confirmation

## What Was Built

**Wave 1 — Firebase rules and schema (TASK-01, TASK-02):**
Added an explicit `eodClosures` node to `apps/reception/database.rules.json` with `.read: "auth != null"` (consistent with all operational nodes) and `$dateKey` write access restricted to owner/developer/admin/manager roles only with a `newData.exists()` guard preventing null-write deletions. Created `apps/reception/src/schemas/eodClosureSchema.ts` — a Zod schema with `date`, `timestamp`, `confirmedBy`, and optional `uid` fields, following the established `safeCountSchema` pattern. Committed as `6a9d5e3e4f`.

**Wave 2 — Read hook and write hook with tests (TASK-03, TASK-04):**
Created `apps/reception/src/hooks/data/useEodClosureData.ts` — a thin wrapper over `useFirebaseSubscription<EodClosure>` at the `eodClosures/<YYYY-MM-DD>` path. Returns `{ closure, loading, error }` using Italy timezone for the date key. Created `apps/reception/src/hooks/mutations/useEodClosureMutations.ts` — `confirmDayClosed()` with auth guard, Italy-timezone date key, Zod `safeParse` validation before write, `set(ref(database, 'eodClosures/${dateKey}'), result.data)`, and error toasts on both validation and Firebase failures. Test file at `apps/reception/src/hooks/mutations/__tests__/useEodClosureMutations.test.ts` with TC-01 (write path validation) and TC-02 (no-user early return). Committed as `1272fde23d`.

**Wave 3 — Component update (TASK-05):**
Updated `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` to call `useEodClosureData()` and `useEodClosureMutations()` unconditionally before the `canView` gate (React rules of hooks compliance). Derived `allDone = tillDone && safeDone && stockDone`. Added two conditional rendering paths: (1) when `!eodClosureLoading && closure !== null`, the component renders a "Day closed" banner (`data-cy="day-closed-banner"`) showing `closure.confirmedBy` and `formatItalyDateTimeFromIso(closure.timestamp)` instead of the status cards; (2) when `allDone && !eodClosureLoading` and no closure exists, a "Confirm day closed" button (`data-cy="confirm-day-closed"`) appears below the three status cards. Clicking the button calls `confirmDayClosed()`, which writes the date-keyed record to Firebase and triggers a subscription update that hides the button and shows the banner on the same render cycle. Updated `EodChecklistContent.test.tsx` with TC-10 through TC-13 using the `var` pre-hoisting mock pattern. Committed as `ff3f4e9e8e`.

## Tests Run

| Command | Scope | Outcome |
|---|---|---|
| `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=useEodClosureMutations.test --no-coverage` | TASK-04 mutation hook tests | TC-01, TC-02: 2/2 pass |
| `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=EodChecklistContent.test --no-coverage` | TASK-05 component tests | TC-01 through TC-13: 13/13 pass |

## Validation Evidence

**TASK-01** — TC-01: `eodClosures` node present in `database.rules.json`; TC-02: write condition includes owner/developer/admin/manager role checks; TC-03: `newData.exists()` guard present. Verified by direct file inspection post-commit.

**TASK-02** — Schema shape verified: `date: z.string()`, `timestamp: z.string()`, `confirmedBy: z.string()`, `uid: z.string().optional()`. Type exported as `EodClosure`. Pattern consistent with `safeCountSchema.ts`.

**TASK-03** — `useEodClosureData` wraps `useFirebaseSubscription<EodClosure>` at `eodClosures/${extractItalyDate(getItalyIsoString())}`, returns `{ closure, loading, error }`. Verified by inspection.

**TASK-04** — TC-01: `set` called with path `eodClosures/2026-02-28` and payload `{ date, timestamp, confirmedBy: 'pete', uid: undefined }`. TC-02: `set` not called when user is null. Both pass.

**TASK-05** — TC-10: button visible when allDone=true, closure=null, loading=false. TC-11: banner visible with confirmedBy and formatted timestamp when closure exists. TC-12: button absent when allDone=false. TC-13: `confirmDayClosed` called once on button click. All 13 tests pass. TypeScript clean (`pnpm --filter @apps/reception typecheck` exits 0). Lint: 0 errors, 7 pre-existing warnings.

## Scope Deviations

None. All changes stayed within the `Affects` fields declared in the plan.

Note: during TASK-05, the concurrent `brik-eod-float-set` build's linter pass injected `useCashCountsData` mock and TC-14–TC-17 (float tests) into the test file via the lint-staged hook. Those additions were removed before commit to preserve scope isolation; they will be re-added by the `brik-eod-float-set` build when it implements the float component section.

## Outcome Contract

- **Why:** The EOD checklist was delivered with sub-task status indicators but no act of day closure. The worldclass audit gap stated "(d) offline-readable stored summary" as a requirement. That criterion is unmet by the current read-only view. This stores a closure record visible on re-entry without reloading underlying data.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After the build, a manager who has completed all three EOD tasks can confirm day closure in one tap on the `/eod-checklist` page. The confirmation is stored in Firebase and visible as a timestamped "Day closed" state on any subsequent visit to the page on the same day — including after reloading or navigating away.
- **Source:** operator
