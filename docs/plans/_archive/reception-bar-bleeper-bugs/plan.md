---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-bar-bleeper-bugs
Dispatch-ID: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 89%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-bar-bleeper-bugs/analysis.md
---

# Reception Bar — Bleeper Bugs Plan

## Summary

Six confirmed defects in the bar/bleeper subsystem of `apps/reception` are fixed together in a single PR using Option A (minimal targeted fixes). Bug 3 fixes Go mode by removing a misplaced `chooseNext()` call; Bug 5 adds error handling for Firebase write failures; Bug 6 removes a redundant auto-fill `useEffect`; Bug 4 fixes preorder eligibility to check tonight's night only; Bug 7 stabilises React keys; Bug 8 corrects misleading placeholder text. All changes are pure client-side, independently reversible via git revert, and require no Firebase migration. Tests covering all 6 fixed paths are added in a dedicated task.

## Active tasks
- [x] TASK-01: Fix Bug 3 — guard doConfirmPayment go branch
- [x] TASK-02: Fix Bug 6 — remove auto-fill useEffect
- [x] TASK-03: Fix Bug 5 — check BleeperResult + toast on failure
- [x] TASK-04: Fix Bug 4 — isEligibleForPreorder tonight filter + buildRow display
- [x] TASK-05: Fix Bug 7 — stable key fallback in TicketItems
- [x] TASK-06: Fix Bug 8 — update placeholder text
- [x] TASK-07: Unit tests for all 6 fixed paths

## Goals
- Fix all 6 confirmed bar/bleeper defects with the smallest viable change surface.
- Preserve existing codebase patterns; no architectural changes.
- Add unit tests for all fixed code paths (CI-only per testing policy).

## Non-goals
- Redesigning the bleeper assignment system.
- Adding new bleeper features.
- Refactoring unrelated bar components.

## Constraints & Assumptions
- Constraints:
  - Firebase write API: `useBleeperMutations.setBleeperAvailability` only — no direct Firebase `set()` in components.
  - Tests run in CI only, never locally (`docs/testing-policy.md`).
  - Error surfacing must use existing `showToast` (already imported in `OrderTakingContainer.tsx`) — `NotificationProviderWithGlobal` is in the component tree above confirmed from `App.tsx`.
- Assumptions:
  - Bug 3 and Bug 6 are independent fixes shipping together for UX completeness. Bug 3 alone makes Go mode correct; Bug 6 removes confusing pre-fill.
  - Preorder night keys are ordinal strings `night1`, `night2`; `parseLocalDate` from `dateUtils.ts` is reusable.
  - `checkInDate` absent for an active occupant is handled gracefully with `false` return.

## Inherited Outcome Contract

- **Why:** Live audit on 2026-03-13 found these bugs causing incorrect bleeper assignments during bar shifts — staff can't reliably use Go mode, COMP eligibility is wrong, Firebase errors are silent, and the UI misleads. All 6 defects confirmed in source code.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 6 confirmed bar/bleeper defects resolved: Go mode correctly skips bleeper reservation, COMP screen filters to tonight only, Firebase write failures are surfaced to staff, bleep number field initialises clean, ticket list renders stably without key churn, placeholder text matches actual behaviour.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/reception-bar-bleeper-bugs/analysis.md`
- Selected approach inherited:
  - Option A — Minimal targeted fixes for all 6 bugs, shipped together.
- Key reasoning used:
  - Smallest change surface on production-live payment code. Each bug has a clear, independently testable fix. Bug 3+6 ship together for UX completeness but are not functionally dependent. Option B (refactor) adds regression risk on critical payment path without correctness gain.

## Selected Approach Summary
- What was chosen:
  - Option A: minimal targeted fixes. One change per bug, smallest possible diff, all shipped together in one PR.
- Why planning is not reopening option selection:
  - Analysis is decisive. All 6 bugs have confirmed root causes. No open questions remain. Engineering coverage is complete.

## Fact-Find Support
- Supporting brief: `docs/plans/reception-bar-bleeper-bugs/fact-find.md`
- Evidence carried forward:
  - Bug 3: `if (usage === "go") { chooseNext(); }` — wrong branch calls chooseNext; `finalBleep` is hardcoded `"go"`.
  - Bug 4: night keys are ordinal (`night1/night2`); `parseLocalDate` exists in `dateUtils.ts`; `checkInDate` available from `bookings` data.
  - Bug 5: `setBleeperAvailability` returns `BleeperResult { success: boolean }`; `showToast` already imported in `OrderTakingContainer.tsx`.
  - Bug 6: `useEffect` at lines 252-256 auto-fills `bleepNumber` from `firstAvailableBleeper`; `PaymentSection.displayNumber` shows suggestion visually without state mutation.
  - Bug 7: `key={it.id ?? crypto.randomUUID()}` at `TicketItems.tsx:22`.
  - Bug 8: placeholder `'Leave blank for "go"'` at `PaymentSection.tsx:60`.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix Bug 3 — guard doConfirmPayment go branch | 90% | S | Complete (2026-03-13) | - | TASK-07 |
| TASK-02 | IMPLEMENT | Fix Bug 6 — remove auto-fill useEffect | 95% | S | Complete (2026-03-13) | - | TASK-07 |
| TASK-03 | IMPLEMENT | Fix Bug 5 — check BleeperResult + toast | 88% | S | Complete (2026-03-13) | - | TASK-07 |
| TASK-04 | IMPLEMENT | Fix Bug 4 — isEligibleForPreorder tonight + buildRow | 85% | M | Complete (2026-03-13) | - | TASK-07 |
| TASK-05 | IMPLEMENT | Fix Bug 7 — stable key fallback in TicketItems | 95% | S | Complete (2026-03-13) | - | TASK-07 |
| TASK-06 | IMPLEMENT | Fix Bug 8 — update placeholder text | 97% | S | Complete (2026-03-13) | - | TASK-07 |
| TASK-07 | IMPLEMENT | Unit tests for all 6 fixed paths | 85% | M | Complete (2026-03-13) | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Bug 8: correct placeholder text; Bug 6: field no longer pre-fills on load | TASK-06, TASK-02 | Single-line and useEffect removal; `PaymentSection.displayNumber` unchanged |
| UX / states | Bug 3: Go mode correctly skips bleeper reservation end-to-end; Bug 4: COMP screen shows only tonight-eligible guests | TASK-01, TASK-04 | Bug 3+6 ship together for UX completeness |
| Security / privacy | N/A | - | No auth or PII changes |
| Logging / observability / audit | Bug 5: Firebase write failure now surfaced via `showToast("error")` and aborts confirmation | TASK-03 | Uses existing `showToast` import; staff can retry |
| Testing / validation | New unit tests for all 6 fixed paths; existing tests must not break | TASK-07 | Tests in CI only per policy |
| Data / contracts | Bug 5: `BleeperResult.success` now enforced at call site | TASK-03 | Existing `BleeperResult` type; no schema change |
| Performance / reliability | Bug 7: stable key fallback eliminates UUID-driven remounts | TASK-05 | Index fallback only when `it.id` absent |
| Rollout / rollback | Standard git revert; no Firebase migration; no deploy-lane change | All tasks | Pure client-side changes |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06 | - | All touch different files/regions; fully parallelisable |
| 2 | TASK-07 | All Wave 1 tasks | Tests require fixes to exist in the code; write after fixes land |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Payment confirmation — Go mode | Staff selects Go toggle and taps Pay | (1) `doConfirmPayment` called with `usage="go"`. (2) Guard skips `chooseNext()`. (3) `finalBleep` stays `"go"`. (4) `setBleeperAvailability` not called. (5) `confirmOrder("go", ...)` records sale without bleeper. | TASK-01 | None — bleep mode path unchanged |
| Payment confirmation — Firebase error | Firebase write fails during bleeper reservation | (1) `result = await setBleeperAvailability(n, false)`. (2) `if (!result.success)`: `showToast("Failed to reserve bleeper. Please try again.", "error")` and return. (3) `confirmOrder` NOT called. (4) Staff retries. | TASK-03 | Race condition (simultaneous orders) partially mitigated; full idempotency out of scope |
| Bleep # field initialisation | Staff opens /bar page | (1) `bleepNumber` state starts `""`. (2) No `useEffect` auto-fills it. (3) `PaymentSection.displayNumber` shows `firstAvailableBleeper` as visual suggestion only (no state mutation). | TASK-02, TASK-06 | None — bleep-mode path reads typed value or calls `chooseNext()` as fallback |
| COMP screen eligibility | Staff opens COMP screen | (1) For each checked-in occupant, extract `checkInDate` from bookings data. (2) Compute `nightKey = "night" + (daysSinceCheckIn + 1)`. (3) Check only `preorder[id][nightKey]` for non-NA entries. (4) `buildRow` plan display shows tonight's breakfast, not first night's. | TASK-04 | `checkInDate` absent → `false` (safe default); no display impact |
| Ticket item rendering | Any state change in bar order | `key={it.id ?? i}` — stable index fallback; no remounts for items without `id`. | TASK-05 | None |

## Tasks

---

### TASK-01: Fix Bug 3 — guard doConfirmPayment go branch
- **Type:** IMPLEMENT
- **Deliverable:** Code change to `apps/reception/src/components/bar/orderTaking/OrderTakingContainer.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Build evidence:** Changed `if (usage === "go") { chooseNext(); } else { ... }` to `if (usage !== "go") { ... }`. TypeScript + ESLint pass. TC-01/TC-02 added in TASK-07 verify correct behaviour.
- **Affects:** `apps/reception/src/components/bar/orderTaking/OrderTakingContainer.tsx`
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 90%
  - Implementation: 95% — exact lines identified; change is inverting one branch
  - Approach: 90% — confirmed from source read; `finalBleep` hardcoded `"go"` so skipping the block leaves it correctly set
  - Impact: 85% — verified by reading PayModal.tsx that go/bleep toggle is independent; Go mode will work after this fix alone
- **Acceptance:**
  - `doConfirmPayment("cash", "go")` does NOT call `setBleeperAvailability`
  - `doConfirmPayment("cash", "bleep")` with typed number calls `setBleeperAvailability`
  - `finalBleep` remains `"go"` when `usage === "go"` and no `chooseNext()` runs
  - Existing bleep-mode path unchanged
- **Engineering Coverage:**
  - UI / visual: N/A — no UI change
  - UX / states: Required — Go mode correctly skips bleeper reservation
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — covered by TASK-07 TC-01/TC-02
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required — git revert restores previous behaviour
- **Validation contract (TC-01):**
  - TC-01: call `doConfirmPayment("cash", "go")` → `setBleeperAvailability` NOT called; `confirmOrder` called with first arg `"go"`
  - TC-02: call `doConfirmPayment("cash", "bleep")` with `bleepNumber="3"` → `setBleeperAvailability(3, false)` called; `confirmOrder` called with first arg `"3"`
- **Execution plan:** Red -> Green -> Refactor
  - Red: Existing test passes for bleep mode; no test for go mode yet (added in TASK-07)
  - Green: In `doConfirmPayment`, swap the bug: change `if (usage === "go") { chooseNext(); } else { ... }` so the go branch does NOT call `chooseNext()`. The corrected logic: `if (usage !== "go") { const typed = bleepNumber.trim().toLowerCase(); ... }`. `finalBleep` starts as `"go"` and stays `"go"` when usage is go.
  - Refactor: None needed — minimal change, existing logic unchanged for bleep path
- **Planning validation (required for M/L):**
  - None: S effort task
- **Scouts:** `finalBleep` is initialised to `"go"` (hardcoded string literal, not from state) — confirmed from line 263. Swapping the guard leaves the go path correct without any further changes.
- **Edge Cases & Hardening:**
  - `usage === "go"` with a typed `bleepNumber`: after fix, `bleepNumber` is ignored in go path — correct behaviour (Go mode should not reference bleep # field).
- **What would make this >=90%:** Reading existing passing tests for go-mode interaction — currently there are none, hence 90% not 95%.
- **Rollout / rollback:**
  - Rollout: Ship in same PR as TASK-02 (UX completeness); no feature flag needed
  - Rollback: Git revert of this change restores prior buggy behaviour
- **Documentation impact:**
  - None
- **Notes / references:**
  - Analysis constraint: ship in same PR as TASK-02 for UX completeness; they are not functionally dependent

---

### TASK-02: Fix Bug 6 — remove auto-fill useEffect
- **Type:** IMPLEMENT
- **Deliverable:** Code change to `apps/reception/src/components/bar/orderTaking/OrderTakingContainer.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Build evidence:** Removed 4-line `useEffect` that auto-filled `bleepNumber` from `firstAvailableBleeper`. Removed `firstAvailableBleeper` from `useBleepersData()` destructuring (unused after removal). TC-05 verifies `bleepNumber` starts `""`.
- **Affects:** `apps/reception/src/components/bar/orderTaking/OrderTakingContainer.tsx`
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 95%
  - Implementation: 97% — remove 4-line `useEffect` at lines 252-256; confirmed `PaymentSection.displayNumber` already provides visual suggestion
  - Approach: 95% — `displayNumber` renders `firstAvailableBleeper` without committing to state
  - Impact: 95% — field initialises clean; bleep-mode path uses `chooseNext()` fallback when field empty
- **Acceptance:**
  - On page load, `bleepNumber` state starts `""` and stays `""` until staff type
  - `PaymentSection` still shows `firstAvailableBleeper` as visual suggestion (via `displayNumber`)
  - Go mode selection via PayModal toggle is unaffected
  - `firstAvailableBleeper` removed from `OrderTakingContainer`'s `useBleepersData` destructuring (unused after useEffect removal; TypeScript will flag it otherwise)
  - Existing tests pass
- **Engineering Coverage:**
  - UI / visual: Required — field no longer shows stale value on load
  - UX / states: Required — Go mode no longer obscured by pre-filled state
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — covered by TASK-07 TC-05
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required — git revert restores prior behaviour
- **Validation contract (TC-05):**
  - TC-05: render `OrderTakingContainer` → verify `bleepNumber` starts `""` and the auto-fill `useEffect` is not present
- **Execution plan:** Red -> Green -> Refactor
  - Red: Currently bleepNumber is auto-filled on mount (confirmed from existing test renders)
  - Green: Delete the `useEffect` block at lines 252-256 of `OrderTakingContainer.tsx` (the one that sets `bleepNumber` from `firstAvailableBleeper`). Also remove `firstAvailableBleeper` from the `useBleepersData()` destructuring at line 69 — it is no longer used in this component (PaymentSection calls `useBleepersData()` itself). No other changes.
  - Refactor: None — `PaymentSection.displayNumber` already handles visual suggestion; `bleepNumber` stays in `useCallback` deps for `doConfirmPayment` (bleep path still reads it)
- **Planning validation (required for M/L):**
  - None: S effort task
- **Scouts:** `PaymentSection.displayNumber` uses `firstAvailableBleeper` directly from `useBleepersData()` (confirmed — `PaymentSection.tsx:23,26-31`). Removing the `useEffect` has no effect on `displayNumber`.
- **Edge Cases & Hardening:**
  - Staff clears the field manually in bleep mode: `doConfirmPayment` bleep branch handles empty `bleepNumber` via `chooseNext()` fallback — unchanged.
- **What would make this >=90%:** Already >=90%. None needed.
- **Rollout / rollback:**
  - Rollout: Ship in same PR as TASK-01
  - Rollback: Git revert
- **Documentation impact:**
  - None
- **Notes / references:**
  - `firstAvailableBleeper` may no longer be needed in `OrderTakingContainer`'s deps after the `useEffect` is removed — check if it's still used in other `useCallback`s. It is NOT used in `doConfirmPayment` (that uses `findNextAvailableBleeper`). Remove from destructuring if unused after the useEffect is gone.

---

### TASK-03: Fix Bug 5 — check BleeperResult + toast on failure
- **Type:** IMPLEMENT
- **Deliverable:** Code change to `apps/reception/src/components/bar/orderTaking/OrderTakingContainer.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Build evidence:** Captured `setBleeperAvailability` result; added `if (!result.success) { showToast(...); return; }` guard. TC-03/TC-04 verify failure aborts and success continues.
- **Affects:** `apps/reception/src/components/bar/orderTaking/OrderTakingContainer.tsx`
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 88%
  - Implementation: 92% — `showToast` already imported; `BleeperResult.success` pattern confirmed from `useBleeperMutations.ts`
  - Approach: 88% — abort on failure is correct; toast "Try again" message is the right staff-facing pattern
  - Impact: 85% — risk: aborted order on Firebase failure may frustrate staff; toast message must be clear
- **Acceptance:**
  - `setBleeperAvailability` returns `{success: false}` → `showToast` called with error type AND `confirmOrder` NOT called
  - `setBleeperAvailability` returns `{success: true}` → `confirmOrder` called normally
  - Toast message reads: `"Failed to reserve bleeper. Please try again."`
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: Required — Firebase failure now visible as toast, not silent
  - Security / privacy: N/A
  - Logging / observability / audit: Required — staff-visible error on write failure
  - Testing / validation: Required — covered by TASK-07 TC-03/TC-04
  - Data / contracts: Required — `BleeperResult` contract now enforced at call site
  - Performance / reliability: N/A
  - Rollout / rollback: Required — git revert restores prior (silent) behaviour
- **Validation contract (TC-03):**
  - TC-03: mock `setBleeperAvailability` returning `{success: false}` → `showToast` called, `confirmOrder` NOT called
  - TC-04: mock `setBleeperAvailability` returning `{success: true}` → `confirmOrder` called
- **Execution plan:** Red -> Green -> Refactor
  - Red: Currently `await setBleeperAvailability(n, false)` result is ignored
  - Green: Capture result: `const result = await setBleeperAvailability(n, false);`. Add: `if (!result.success) { showToast("Failed to reserve bleeper. Please try again.", "error"); return; }`. Then call `confirmOrder` on the next line as before.
  - Refactor: None needed
- **Planning validation (required for M/L):**
  - None: S effort task
- **Scouts:** `showToast` import confirmed at `OrderTakingContainer.tsx:18`. Toast API: `showToast(message: string, type: "success" | "warning" | "error")` — confirmed from usage at line 196. `BleeperResult.success` confirmed from `useBleeperMutations.ts:47`.
- **Edge Cases & Hardening:**
  - If database not initialized: `setBleeperAvailability` returns `{success: false, error: "Database not initialized"}` — this case will now correctly abort and toast the staff.
  - Invalid bleeper number (1-18 check): same abort path.
- **What would make this >=90%:** Confirming `showToast` renders in the component tree during tests without `NotificationProviderWithGlobal` wrapper. The existing pattern (line 196) shows it works in the existing mocked test environment.
- **Rollout / rollback:**
  - Rollout: No flag needed; change is strictly additive error surfacing
  - Rollback: Git revert
- **Documentation impact:**
  - None
- **Notes / references:**
  - Analysis risk: "Toast message must clearly say 'Try again' not just 'Error'" — carried into Acceptance criteria above

---

### TASK-04: Fix Bug 4 — isEligibleForPreorder tonight filter + buildRow display
- **Type:** IMPLEMENT
- **Deliverable:** Code change to `apps/reception/src/components/bar/CompScreen.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Build evidence:** Extracted `getTonightNightKey(checkInDate)` and `isEligibleForPreorderTonight(preorderData, checkInDate)` as named module-level exports. Uses `parseLocalDate` + `daysSinceCheckIn + 1` to compute ordinal night key. Replaced `Object.values(occPre).some(...)` with `isEligibleForPreorderTonight(...)` at call site. Fixed `buildRow` to use `getTonightNightKey(occupantCheckIn)`. TC-06a–TC-06f cover all edge cases.
- **Affects:** `apps/reception/src/components/bar/CompScreen.tsx`, `[readonly] apps/reception/src/utils/dateUtils.ts`
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 88% — `parseLocalDate` confirmed exported from `dateUtils.ts`; night-key pattern `night{N}` confirmed; `checkInDate` available via `bookings` data at call site
  - Approach: 85% — ordinal key confirmed from `preorderData.ts` and `ModalPreorderDetails.tsx`; `daysSinceCheckIn + 1 = nightIndex` is the correct mapping (night1 = check-in night)
  - Impact: 83% — `checkInDate` absent handled safely with `false` default; `buildRow` plan display also corrected
- **Acceptance:**
  - `isEligibleForPreorderTonight(preorderData, checkInDate)` with only non-today night data → `false`
  - `isEligibleForPreorderTonight(preorderData, checkInDate)` with tonight's night having non-NA entry → `true`
  - `isEligibleForPreorderTonight(preorderData, checkInDate)` with tonight's night all-NA → `false`
  - `isEligibleForPreorderTonight(undefined, checkInDate)` → `false`
  - `isEligibleForPreorderTonight(preorderData, "")` → `false`
  - `buildRow` plan column shows tonight's breakfast, not the first-key breakfast
  - Existing CompScreen tests pass
- **Engineering Coverage:**
  - UI / visual: Required — `buildRow` plan column shows correct tonight data
  - UX / states: Required — COMP screen eligibility list is now date-correct
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — covered by TASK-07 TC-06
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required — git revert
- **Validation contract (TC-06):**
  - TC-06a: `isEligibleForPreorderTonight` with `night1` (non-tonight for a guest on night 2) → `false`
  - TC-06b: `isEligibleForPreorderTonight` with tonight's key having `breakfast: "Cooked"` → `true`
  - TC-06c: `isEligibleForPreorderTonight` with tonight's key all-NA → `false`
  - TC-06d: `isEligibleForPreorderTonight` with no preorder data → `false`
- **Execution plan:** Red -> Green -> Refactor
  - Red: Current `isEligibleForPreorder` checks all nights; tests pass with any-night eligibility
  - Green:
    1. Import `parseLocalDate` from `../../utils/dateUtils` in `CompScreen.tsx`.
    2. Extract a pure function `isEligibleForPreorderTonight(preorderData: PreorderData | undefined, checkInDate: string): boolean` above the component (makes it directly unit-testable without render). Logic: parse `checkInDate`; compute `daysSinceCheckIn` (floor of date diff in ms / 86400000); derive `nightKey = "night" + (daysSinceCheckIn + 1)`; check only `preorderData[nightKey]` for non-NA values. Return `false` for absent `checkInDate`, absent `preorderData`, or absent `nightKey`.
    3. At the call site inside the `useMemo`, extract `checkInDate` per occupant before calling: `const bookingRef = guestsByBooking?.[id]?.reservationCode ?? "N/A"; const occupantBooking = bookings?.[bookingRef]?.[id]; const checkInDate = occupantBooking && "checkInDate" in occupantBooking && typeof occupantBooking.checkInDate === "string" ? occupantBooking.checkInDate : "";` Then call `isEligibleForPreorderTonight(preorder?.[id] as PreorderData | undefined, checkInDate)`.
    4. Fix `buildRow` plan display: replace `firstNightKey = Object.keys(occPre)[0]` logic with the same night-key computation using `occupantCheckIn` (already available in `buildRow` scope). Use `occPre[nightKey]?.breakfast ?? "NA"`.
  - Refactor: None — the extracted pure function is the only abstraction needed
- **Planning validation:**
  - Checks run: read `CompScreen.tsx:185-234`, `preorderData.ts`, `ModalPreorderDetails.tsx:18-22`, `dateUtils.ts:676`
  - Validation artifacts: `parseLocalDate` returns `Date | undefined`; night-key pattern `night{N}` confirmed; `checkInDate` in `occupantBooking` confirmed from test fixture (`{occ1: {checkInDate: "2025-01-01"}}`)
  - Unexpected findings: `buildRow` uses `occupantCheckIn` (already computed) — re-use this directly for `buildRow`'s plan display fix without duplicating the extraction logic
- **Scouts:**
  - `parseLocalDate` is at `dateUtils.ts:676`, exported.
  - `ModalPreorderDetails.tsx:18` imports `addDays`, `parseLocalDate` from `dateUtils` — same import pattern to use.
  - `getNightIndex` in `ModalPreorderDetails.tsx` is a local helper; copy the pattern or use a local `daysSinceCheckIn + 1` computation directly.
- **Edge Cases & Hardening:**
  - `checkInDate` absent → `false` (safe default; no guest shown as ineligible incorrectly)
  - `parseLocalDate` returns `undefined` → `false`
  - Guest on check-in day (daysSince=0) → `nightKey="night1"` — correct
  - Guest past their last preorder night → `preorderData[nightKey]` is `undefined` → `false` — correct
- **What would make this >=90%:** Confirming exact `parseLocalDate` return type behaviour for an invalid date string (returns `undefined` per the function signature — safe).
- **Rollout / rollback:**
  - Rollout: No flag; pure eligibility logic change with safe defaults
  - Rollback: Git revert
- **Documentation impact:**
  - None
- **Notes / references:**
  - `buildRow` plan display also uses `firstNightKey` from `Object.keys(occPre)[0]`; must be fixed in this same task per analysis planning handoff.

---

### TASK-05: Fix Bug 7 — stable key fallback in TicketItems
- **Type:** IMPLEMENT
- **Deliverable:** Code change to `apps/reception/src/components/bar/sales/TicketItems.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Build evidence:** Changed `key={it.id ?? crypto.randomUUID()}` to `key={it.id ?? i}`. TC-07 spies on `crypto.randomUUID` and asserts it is NOT called.
- **Affects:** `apps/reception/src/components/bar/sales/TicketItems.tsx`
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 95%
  - Implementation: 98% — single token change on line 22
  - Approach: 95% — index fallback is stable across renders; items without `id` no longer remount
  - Impact: 95% — eliminates UUID churn; no other rendering logic affected
- **Acceptance:**
  - `li` elements with absent `id` use stable index as key across re-renders
  - No unmount/remount for items without `id` on state changes
  - Items with a valid `id` continue to use `id` as key
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — covered by TASK-07 TC-07
  - Data / contracts: N/A
  - Performance / reliability: Required — eliminates UUID-driven remounts
  - Rollout / rollback: Required — git revert
- **Validation contract (TC-07):**
  - TC-07: render `TicketItems` with items lacking `id`; trigger state change; verify `li` keys are stable (index-based, not UUID-based)
- **Execution plan:** Red -> Green -> Refactor
  - Red: Current `key={it.id ?? crypto.randomUUID()}` generates new key on every render
  - Green: Change `key={it.id ?? crypto.randomUUID()}` to `key={it.id ?? i}` on `TicketItems.tsx:22`. The `i` parameter is already the array index from `.map((it, i) => ...)`.
  - Refactor: None
- **Planning validation (required for M/L):**
  - None: S effort task
- **Scouts:** Array `.map((it, i) => ...)` already passes `i` — confirmed from `TicketItems.tsx:20`. Change is one token.
- **Edge Cases & Hardening:** None — index is stable for the lifetime of the order list render.
- **What would make this >=90%:** Already >=90%.
- **Rollout / rollback:**
  - Rollout: No flag; render-only change
  - Rollback: Git revert
- **Documentation impact:** None
- **Notes / references:** None

---

### TASK-06: Fix Bug 8 — update placeholder text
- **Type:** IMPLEMENT
- **Deliverable:** Code change to `apps/reception/src/components/bar/orderTaking/PaymentSection.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Build evidence:** Changed `placeholder='Leave blank for "go"'` to `placeholder="No bleepers available"`. TC-08 verifies placeholder is present when `firstAvailableBleeper` is null.
- **Affects:** `apps/reception/src/components/bar/orderTaking/PaymentSection.tsx`
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 97%
  - Implementation: 99% — single string change on line 60
  - Approach: 97% — placeholder is only visible when `displayNumber` is empty (all 18 bleepers in use); "No bleepers available" accurately describes that state
  - Impact: 97% — removes misleading text; aligns with actual behaviour after Bug 6 fix
- **Acceptance:**
  - Placeholder text reads `"No bleepers available"` (visible only when `firstAvailableBleeper` is `null`)
  - Field value (`displayNumber`) is unaffected
  - Existing snapshot or text tests pass or are updated to match new placeholder
- **Engineering Coverage:**
  - UI / visual: Required — placeholder text corrected
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — covered by TASK-07 TC-08
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required — git revert
- **Validation contract (TC-08):**
  - TC-08: render `PaymentSection` with `bleepNumber=""` and `firstAvailableBleeper=null` → placeholder reads `"No bleepers available"`
- **Execution plan:** Red -> Green -> Refactor
  - Red: Current placeholder is `'Leave blank for "go"'` which contradicts auto-fill behaviour
  - Green: Change `placeholder='Leave blank for "go"'` to `placeholder="No bleepers available"` on `PaymentSection.tsx:60`.
  - Refactor: None
- **Planning validation (required for M/L):**
  - None: S effort task
- **Scouts:** `PaymentSection.tsx:58-60` — `value={displayNumber}` and `placeholder` are separate props; changing placeholder does not affect value rendering.
- **Edge Cases & Hardening:** None — pure copy change.
- **What would make this >=90%:** Already >=90%.
- **Rollout / rollback:**
  - Rollout: No flag
  - Rollback: Git revert
- **Documentation impact:** None
- **Notes / references:**
  - After Bug 6 (TASK-02), `displayNumber` will show `firstAvailableBleeper` as a visual suggestion when `bleepNumber` is `""`. The placeholder is only visible when `displayNumber` is also `""` (i.e., `firstAvailableBleeper` is `null`). The new text is accurate.

---

### TASK-07: Unit tests for all 6 fixed paths
- **Type:** IMPLEMENT
- **Deliverable:** New/updated test files covering all 6 bug fixes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Build evidence:** TC-01–TC-05 in `OrderTakingContainer.test.tsx` (updated); TC-06a–TC-06f in `CompScreen.eligibility.test.ts` (new); TC-07 in `TicketItems.test.tsx` (new); TC-08 in `PaymentSection.test.tsx` (new). Updated `setBleeperAvailability` mock default to `{ success: true }`. All TC contracts met.
- **Affects:**
  - `apps/reception/src/components/bar/orderTaking/__tests__/OrderTakingContainer.test.tsx` (extend existing)
  - `apps/reception/src/components/bar/__tests__/CompScreen.preorder.test.tsx` (extend existing)
  - `apps/reception/src/components/bar/sales/__tests__/TicketItems.test.tsx` (new file)
  - `apps/reception/src/components/bar/orderTaking/__tests__/PaymentSection.test.tsx` (new file)
  - `apps/reception/src/components/bar/__tests__/CompScreen.eligibility.test.ts` (new file — pure function unit test for `isEligibleForPreorderTonight`)
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 88% — existing test patterns well-established (`capturedProps` mock pattern; hook mocks); `isEligibleForPreorderTonight` extracted as pure function (directly testable without render)
  - Approach: 85% — test fixtures for Bug 4 (multi-night preorder, specific today date) require careful date mocking
  - Impact: 83% — tests run CI-only; date mocking for Bug 4 is the highest-risk part
- **Acceptance:**
  - TC-01: `doConfirmPayment("cash", "go")` → `setBleeperAvailability` NOT called
  - TC-02: `doConfirmPayment("cash", "bleep")` with number → `setBleeperAvailability` called
  - TC-03: `setBleeperAvailability` returns `{success: false}` → `showToast` called, `confirmOrder` NOT called
  - TC-04: `setBleeperAvailability` returns `{success: true}` → `confirmOrder` called
  - TC-05: `OrderTakingContainer` renders with `bleepNumber` starting `""`; no auto-fill effect
  - TC-06a: `isEligibleForPreorderTonight({night1:...}, checkInDate for night1 = today)` → `true`
  - TC-06b: `isEligibleForPreorderTonight({night1:...}, checkInDate for night2 = today)` → `false`
  - TC-06c: `isEligibleForPreorderTonight({night2:{breakfast:"NA",drink1:"NA",drink2:"NA"}}, checkInDate for night2 = today)` → `false`
  - TC-06d: `isEligibleForPreorderTonight(undefined, anyDate)` → `false`
  - TC-07: render `TicketItems` with items without `id`; re-render; `li` keys stable (index)
  - TC-08: render `PaymentSection` with `firstAvailableBleeper=null`; placeholder = `"No bleepers available"`
  - All existing tests in `OrderTakingContainer.test.tsx` and `CompScreen.preorder.test.tsx` still pass
- **Engineering Coverage:**
  - UI / visual: Required — TC-08 verifies placeholder text
  - UX / states: Required — TC-01/TC-02/TC-03/TC-04/TC-05/TC-06 verify state transitions
  - Security / privacy: N/A
  - Logging / observability / audit: Required — TC-03 verifies toast fired
  - Testing / validation: Required — this is the testing task
  - Data / contracts: Required — TC-03/TC-04 verify BleeperResult contract enforcement
  - Performance / reliability: Required — TC-07 verifies stable key
  - Rollout / rollback: N/A — tests only
- **Validation contract:** See Acceptance above (TC-01 through TC-08).
- **Execution plan:** Red -> Green -> Refactor
  - Red: Missing TC-01, TC-02, TC-03, TC-04, TC-05, TC-06*, TC-07, TC-08 — these test paths do not currently exist
  - Green:
    - **TC-01/TC-02/TC-03/TC-04/TC-05**: Extend `OrderTakingContainer.test.tsx`. Add mock for `useBleeperMutations` capturing `setBleeperAvailability` calls. Add mock for `confirmOrder`. Add mock for `showToast` (from `toastUtils`). Test `doConfirmPayment` via `capturedProps.onConfirmPayment`. For TC-05, verify initial render has `capturedProps.bleepNumber === ""`.
    - **TC-06 (pure function)**: Create `CompScreen.eligibility.test.ts` (no render needed). Import `isEligibleForPreorderTonight` from `CompScreen.tsx` (export it). Mock `Date` constructor or use a fixed today date via `jest.setSystemTime`. Test the 4 TC-06 scenarios.
    - **TC-07**: Create `TicketItems.test.tsx`. Before render, spy on `crypto.randomUUID` (`jest.spyOn(crypto, "randomUUID")`). Render `TicketItems` with items that have no `id`. Assert `crypto.randomUUID` is NOT called. This confirms the index fallback is used instead of UUID generation.
    - **TC-08**: Create `PaymentSection.test.tsx`. Mock `useBleepersData` to return `firstAvailableBleeper: null`. Render `PaymentSection`. Assert `getByPlaceholderText("No bleepers available")`.
  - Refactor: None — tests are additive
- **Planning validation:**
  - Checks run: read existing `OrderTakingContainer.test.tsx` (capturedProps pattern), `CompScreen.preorder.test.tsx` (hook mocks), `useBleepersData` mock pattern
  - Validation artifacts: Existing patterns confirmed — `jest.mock` on hook paths, capturedProps capture from mocked child components
  - Unexpected findings: `isEligibleForPreorderTonight` must be exported from `CompScreen.tsx` to be directly unit-testable. TASK-04 execution must export it. Alternative: test via CompScreen render with mocked hooks — valid but heavier. Export is cleaner; add it in TASK-04.
- **Scouts:**
  - `showToast` import path: `apps/reception/src/utils/toastUtils` — mock as `jest.mock("../../../utils/toastUtils", () => ({ showToast: jest.fn() }))` from the test file location.
  - Date mocking for TC-06: use `jest.useFakeTimers().setSystemTime(new Date("2025-01-02"))` to make "today" a known date. Set `checkInDate = "2025-01-01"` → daysSince=1 → `night2`. Test preorder with `night2` eligible.
- **Edge Cases & Hardening:**
  - Existing tests must not be broken — run all tests in the `bar` subdirectory in CI to verify.
  - Export of `isEligibleForPreorderTonight` from `CompScreen.tsx` must be named export (not default) to avoid changing the component's existing default export.
- **What would make this >=90%:** Already confirmed mock patterns; main risk is date mocking for TC-06. Using `jest.useFakeTimers` is standard.
- **Rollout / rollback:**
  - Rollout: Tests run in CI only; no production impact
  - Rollback: Git revert (tests only)
- **Documentation impact:** None
- **Notes / references:**
  - Export `isEligibleForPreorderTonight` as named export in TASK-04; import it in TC-06 test file.
  - After Bug 6 fix (TASK-02), `firstAvailableBleeper` may be removed from `OrderTakingContainer`'s `useBleepersData` destructuring. Update test mocks accordingly.

---

## Risks & Mitigations
- **`checkInDate` absent for an active occupant (Bug 4)** — Medium likelihood, Low impact. Function returns `false` (safe default). Test TC-06d covers this.
- **Bug 5 toast aborts an in-progress order** — Low likelihood, Medium impact. Toast message explicitly says "Try again" so staff understands what to do. This is correct behavior — don't confirm without bleeper reservation.
- **`showToast` mock in tests** — Low likelihood, Low impact. Existing `showToast` usage at line 196 of same file provides precedent for how it's called; mock pattern is standard.
- **Date mocking for TC-06** — Low likelihood, Low impact. `jest.useFakeTimers` / `jest.setSystemTime` is standard Jest; no unusual dep.

## Observability
- Logging: Bug 5 fix adds `showToast("error")` visible to staff — no server-side logging change.
- Metrics: None changed.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [ ] Go mode (`usage === "go"`) does NOT call `setBleeperAvailability` and records order with bleeper `"go"`
- [ ] Firebase write failure shows toast to staff and aborts order confirmation
- [ ] Bleep # field starts empty on page load with no auto-fill
- [ ] COMP screen shows only guests with tonight's preorder as eligible
- [ ] Ticket items with no `id` use stable index-based React keys
- [ ] Placeholder text reads `"No bleepers available"` (visible when all 18 bleepers in use)
- [ ] All existing bar tests pass unchanged
- [ ] New unit tests for TC-01 through TC-08 pass in CI

## Decision Log
- 2026-03-13: Chose Option A (minimal targeted fixes) over Option B (refactor) — smaller diff on critical payment path; same correctness outcome. [Analysis decision carried forward]
- 2026-03-13: Bug 3+6 ship in same PR for UX completeness; they are functionally independent. Go mode is correct after Bug 3 alone; Bug 6 removes confusing pre-fill.
- 2026-03-13: `isEligibleForPreorderTonight` extracted as named exported pure function from `CompScreen.tsx` to enable direct unit testing without render.
- 2026-03-13: `showToast` used for Bug 5 error notification (already imported, same pattern as existing warning at line 196).

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix Bug 3 go branch | Yes — `doConfirmPayment` at lines 260-304 confirmed; `finalBleep` hardcoded `"go"` confirmed | None | No |
| TASK-02: Fix Bug 6 useEffect | Yes — `useEffect` at lines 252-256 confirmed; `PaymentSection.displayNumber` provides visual suggestion independently | None | No |
| TASK-03: Fix Bug 5 BleeperResult | Yes — `showToast` imported at line 18; `BleeperResult.success` confirmed from `useBleeperMutations.ts:47` | None | No |
| TASK-04: Fix Bug 4 night filter | Yes — `parseLocalDate` exported from `dateUtils.ts:676`; `checkInDate` available via `bookings[bookingRef][id]`; `isEligibleForPreorderTonight` can be extracted as pure function | Minor: `isEligibleForPreorderTonight` must be exported for TC-06 — resolved in Decision Log | No (resolved) |
| TASK-05: Fix Bug 7 key stability | Yes — `it.id ?? crypto.randomUUID()` at `TicketItems.tsx:22`; `i` already in map callback | None | No |
| TASK-06: Fix Bug 8 placeholder | Yes — placeholder at `PaymentSection.tsx:60` confirmed | None | No |
| TASK-07: Unit tests | Yes — existing patterns in `OrderTakingContainer.test.tsx` and `CompScreen.preorder.test.tsx` confirmed; `jest.useFakeTimers` available for date mocking | None | No |

## Overall-confidence Calculation
- TASK-01: 90% × 1 (S) = 90
- TASK-02: 95% × 1 (S) = 95
- TASK-03: 88% × 1 (S) = 88
- TASK-04: 85% × 2 (M) = 170
- TASK-05: 95% × 1 (S) = 95
- TASK-06: 97% × 1 (S) = 97
- TASK-07: 85% × 2 (M) = 170
- Sum of weighted confidence: 90+95+88+170+95+97+170 = 805
- Sum of effort weights: 1+1+1+2+1+1+2 = 9
- Overall-confidence = 805 / 9 ≈ 89%
