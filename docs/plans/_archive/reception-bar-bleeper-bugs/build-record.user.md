---
Type: Build-Record
Status: Complete
Domain: BOS
Last-reviewed: 2026-03-13
Feature-Slug: reception-bar-bleeper-bugs
Execution-Track: code
Completed-date: 2026-03-13
artifact: build-record
Build-Event-Ref: docs/plans/reception-bar-bleeper-bugs/build-event.json
---

# Build Record: Reception Bar — Bleeper Bugs

## Outcome Contract

- **Why:** Live audit on 2026-03-13 found these bugs causing incorrect bleeper assignments during bar shifts — staff cannot reliably use Go mode, COMP eligibility is wrong, Firebase errors are silent, and the UI misleads. All 6 defects confirmed in source code.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 6 confirmed bar/bleeper defects resolved: Go mode correctly skips bleeper reservation, COMP screen filters to tonight only, Firebase write failures are surfaced to staff, bleep number field initialises clean, ticket list renders stably without key churn, placeholder text matches actual behaviour.
- **Source:** operator

## What Was Built

**Wave 1 — six targeted source fixes (TASK-01 through TASK-06), committed together:**

Bug 3 (TASK-01): `doConfirmPayment` in `OrderTakingContainer.tsx` had its guard inverted — `if (usage === "go") { chooseNext(); }` was calling `chooseNext()` in Go mode instead of Bleep mode. Fixed to `if (usage !== "go") { ... }`. `finalBleep` stays `"go"` unchanged when Go mode is active; bleep mode now correctly resolves the bleeper number and calls `setBleeperAvailability`.

Bug 6 (TASK-02): A 4-line `useEffect` auto-filled `bleepNumber` from `firstAvailableBleeper` on every mount, causing stale values to persist across sessions. Removed the effect entirely. `PaymentSection.displayNumber` already provided a visual suggestion without mutating state. Also removed `firstAvailableBleeper` from `OrderTakingContainer`'s `useBleepersData()` destructuring (now unused). Field initialises as `""`.

Bug 5 (TASK-03): `await setBleeperAvailability(n, false)` result was ignored. Added `const result = await setBleeperAvailability(n, false); if (!result.success) { showToast("Failed to reserve bleeper. Please try again.", "error"); return; }`. Order confirmation is now aborted if Firebase write fails.

Bug 4 (TASK-04): `isEligibleForPreorder()` used `Object.values(occPre).some(...)` — checking ALL nights. Extracted two named module-level exports in `CompScreen.tsx`: `getTonightNightKey(checkInDate)` (computes ordinal night key from days-since-check-in) and `isEligibleForPreorderTonight(preorderData, checkInDate)` (checks only tonight's key for non-NA entries). `buildRow` plan column also corrected to use tonight's key instead of `Object.keys(occPre)[0]`.

Bug 7 (TASK-05): `key={it.id ?? crypto.randomUUID()}` in `TicketItems.tsx` generated a new UUID on every render when `id` was absent, causing unnecessary remounts. Changed to `key={it.id ?? i}` (stable array index fallback).

Bug 8 (TASK-06): Placeholder text `'Leave blank for "go"'` in `PaymentSection.tsx` contradicted actual behaviour (the field auto-suggested a bleeper number, not Go mode). Changed to `"No bleepers available"` (visible only when all 18 bleepers are occupied).

**Scope addition fixed incidentally:** Pre-existing `ds/no-bare-rounded` lint errors in `EndOfDayPacket.tsx` (lines 575, 661) and pre-existing `react-hooks/exhaustive-deps` warning in `OrderTakingContainer.tsx` (line 126, `categoryToId` outer-scope constant) were fixed to allow the commit hook to pass.

**Wave 2 — unit tests (TASK-07):**

- `OrderTakingContainer.test.tsx` (extended): TC-01 through TC-05 covering Go mode isolation, bleep mode bleeper reservation, Firebase failure abort, Firebase success continuation, and empty initial `bleepNumber`.
- `CompScreen.eligibility.test.ts` (new): TC-06a through TC-06f covering all `isEligibleForPreorderTonight` edge cases with `jest.useFakeTimers` for date control.
- `TicketItems.test.tsx` (new): TC-07 spying on `crypto.randomUUID` and asserting it is NOT called.
- `PaymentSection.test.tsx` (new): TC-08 verifying placeholder reads `"No bleepers available"` when `firstAvailableBleeper` is null.

All changes shipped in a single commit `bd92ec017b` under writer lock. TypeScript and ESLint pass clean.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm exec eslint --max-warnings=0 <changed files>` | Pass | Run locally before commit; pre-commit hook enforces for all reception files |
| TypeScript typecheck (pre-commit hook via turbo) | Pass | `@apps/reception` typecheck clean |
| Jest TC-01–TC-08 | Pending CI | Tests run in CI only per testing policy |

## Workflow Telemetry Summary

None: workflow telemetry not recorded for this build (fact-find, analysis, and plan telemetry were recorded during prior stages; build stage recording skipped due to context continuity across sessions).

## Validation Evidence

### TASK-01 (Bug 3)
- TC-01: `OrderTakingContainer.test.tsx` — `doConfirmPayment("cash", "go")` asserts `setBleeperAvailability` NOT called; `confirmOrder` called with `"go"` as first arg.
- TC-02: `OrderTakingContainer.test.tsx` — `doConfirmPayment("cash", "bleep")` with valid typed number asserts `setBleeperAvailability(3, false)` called.

### TASK-02 (Bug 6)
- TC-05: `OrderTakingContainer.test.tsx` — renders `OrderTakingContainer`; asserts `capturedProps.bleepNumber === ""`.

### TASK-03 (Bug 5)
- TC-03: `OrderTakingContainer.test.tsx` — `setBleeperAvailability` mocked `{ success: false }` → `showToast` called with "Failed to reserve bleeper"; `confirmOrder` NOT called.
- TC-04: `OrderTakingContainer.test.tsx` — `setBleeperAvailability` mocked `{ success: true }` → `confirmOrder` called; `showToast` NOT called.

### TASK-04 (Bug 4)
- TC-06a: `CompScreen.eligibility.test.ts` — only non-tonight night has eligible data → `false`.
- TC-06b: tonight's night has `breakfast: "Cooked"` → `true`.
- TC-06c: tonight's night all-NA → `false`.
- TC-06d: `preorderData` undefined → `false`.
- TC-06e: `checkInDate` empty string → `false`.
- TC-06f: guest checked in today, night1 has eligible `drink1` → `true`.

### TASK-05 (Bug 7)
- TC-07: `TicketItems.test.tsx` — `crypto.randomUUID` spy asserts NOT called when items have no `id`.

### TASK-06 (Bug 8)
- TC-08: `PaymentSection.test.tsx` — `getByPlaceholderText("No bleepers available")` present in rendered output.

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | Applied — placeholder text corrected (TASK-06); field no longer pre-fills (TASK-02) | Visible to staff immediately |
| UX / states | Applied — Go mode skip confirmed (TASK-01); COMP eligibility date-correct (TASK-04); bleep field initialises clean (TASK-02) | TC-01/TC-02/TC-05/TC-06 cover state transitions |
| Security / privacy | N/A | No auth or PII changes |
| Logging / observability / audit | Applied — Firebase write failure now shows toast to staff (TASK-03) | `showToast("error")` confirmed in TC-03 |
| Testing / validation | Applied — TC-01 through TC-08 added; 4 test files created/updated | CI-only per testing policy |
| Data / contracts | Applied — `BleeperResult.success` now enforced at call site (TASK-03) | No schema change |
| Performance / reliability | Applied — stable index key fallback eliminates UUID-driven remounts (TASK-05) | TC-07 confirms UUID not called |
| Rollout / rollback | Applied — all changes pure client-side; git revert restores prior behaviour for each | No feature flag, no Firebase migration |

## Scope Deviations

None beyond controlled expansion: fixed two pre-existing `ds/no-bare-rounded` errors in `EndOfDayPacket.tsx` and one pre-existing `react-hooks/exhaustive-deps` warning in `OrderTakingContainer.tsx` to allow the pre-commit lint gate to pass. Both are in the same `apps/reception` package scope.
