---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: BOS
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: reception-bar-bleeper-bugs
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-bar-bleeper-bugs/analysis.md
Dispatch-IDs: IDEA-DISPATCH-20260313120000-0001,IDEA-DISPATCH-20260313120000-0002,IDEA-DISPATCH-20260313120000-0003,IDEA-DISPATCH-20260313120000-0004,IDEA-DISPATCH-20260313120000-0005,IDEA-DISPATCH-20260313120000-0006
Work-Package-Reason: All 6 bugs are co-located in the bar/bleeper subsystem (OrderTakingContainer, CompScreen, TicketItems, PaymentSection). They share overlapping state (bleepNumber, usage, firstAvailableBleeper) and must be fixed consistently to avoid inter-bug interactions. Single fact-find + single plan prevents duplicate mock setup and allows test coverage to be designed holistically.
Trigger-Why: Live audit on 2026-03-13 confirmed these bugs produce incorrect bleeper assignments, false COMP eligibility, silent Firebase write failures, stale UI state, and misleading placeholder text — all during active bar shifts.
Trigger-Intended-Outcome: type: operational | statement: All 6 confirmed bar/bleeper defects resolved, bar payment flow correctly distinguishes Go vs Bleep, COMP screen shows tonight-only eligibility, bleeper write failures surfaced to staff, field initialises clean, ticket list renders stably, placeholder reflects actual behaviour | source: operator
---

# Reception Bar — Bleeper Bugs Fact-Find Brief

## Scope
### Summary
Six confirmed defects in the bar/bleeper subsystem of the reception app (`apps/reception`), all discovered in a live audit on 2026-03-13. The bugs collectively break the "Bleep vs Go" payment flow, silently assign bleep numbers when staff intend Go, show incorrect preorder eligibility on the COMP screen, hide Firebase write errors, display stale state on page load, cause unnecessary React remounts, and show misleading UI text.

### Goals
- Produce a precise, evidence-backed plan for fixing all 6 bugs.
- Ensure fixes are consistent across the shared `bleepNumber`/`usage` state.
- Add or update unit tests for each corrected code path.

### Non-goals
- Redesigning the bleeper assignment architecture.
- Adding new bleeper features (e.g. multiple orders per bleeper).
- Fixing unrelated bar issues not in this work package.

### Constraints & Assumptions
- Constraints:
  - Firebase write API for bleepers is `useBleeperMutations.setBleeperAvailability` — callers may not bypass it.
  - Testing policy: tests run in CI only. No local `jest` runs.
  - Preorder date key format must be confirmed from `usePreorder` / Firebase shape (see Open Questions).
- Assumptions:
  - The Go mode is intended to seat a guest without reserving any physical bleeper.
  - `firstAvailableBleeper` from `useBleepersData` is the canonical source of the next free bleeper.
  - The `useEffect` in `OrderTakingContainer` that auto-fills `bleepNumber` state is redundant with `PaymentSection`'s `displayNumber` computed value, and should be removed.

## Outcome Contract

- **Why:** Live audit on 2026-03-13 found these bugs causing incorrect bleeper assignments during bar shifts — staff can't reliably use Go mode, COMP eligibility is wrong, Firebase errors are silent, and the UI misleads. All 6 defects confirmed in source code.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 6 confirmed bar/bleeper defects resolved: Go mode correctly skips bleeper reservation, COMP screen filters to tonight only, Firebase write failures are surfaced to staff, bleep number field initialises clean, ticket list renders stably without key churn, placeholder text matches actual behaviour.
- **Source:** operator

## Current Process Map

- Trigger: Staff member opens the Bar screen, takes an order, and proceeds to payment.
- End condition: Order is confirmed, Firebase is updated (sale recorded, bleeper marked in-use if applicable), UI resets for next order.

### Process Areas
| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Payment confirmation | Staff selects Bleep or Go toggle → enters bleep number or leaves blank → taps Pay. `doConfirmPayment` in OrderTakingContainer reads `usage` and `bleepNumber`, calls `chooseNext()` regardless of usage, writes to Firebase | `OrderTakingContainer.tsx:260-304`, `useBleeperMutations.ts` | See Bug 3, Bug 5 below | Go mode silently assigns a bleeper; Firebase write failure is not surfaced |
| COMP screen eligibility | Staff opens COMP screen; system checks `preorder` Firebase data per occupant to show who is eligible tonight | `CompScreen.tsx:185-194`, `usePreorder.ts` | See Bug 4 below | Checks all nights' preorder data, not just tonight — shows guests as eligible even when their preorder is for a different date |
| Bleep # field initialisation | On page load (or navigation to /bar), `bleepNumber` state starts `""`, useEffect auto-fills from `firstAvailableBleeper` | `OrderTakingContainer.tsx:252-256`, `PaymentSection.tsx:26-31` | See Bug 6, Bug 8 below | Field shows "5" (or whatever next available is) on fresh load even though no order has started; placeholder contradicts auto-fill |
| Ticket item rendering | Ticket list renders items with `key={it.id ?? crypto.randomUUID()}` | `TicketItems.tsx:22` | See Bug 7 below | Items without an `id` get a new UUID on every render → remounts on any state change |

## Evidence Audit (Current State)

### Entry Points
- `apps/reception/src/components/bar/orderTaking/OrderTakingContainer.tsx` — container for order-taking flow including bleeper state, payment confirmation
- `apps/reception/src/components/bar/CompScreen.tsx` — COMP/free-preorder eligibility screen
- `apps/reception/src/components/bar/sales/TicketItems.tsx` — order ticket item list
- `apps/reception/src/components/bar/orderTaking/PaymentSection.tsx` — bleep # input + total display

### Key Modules / Files
- `apps/reception/src/components/bar/orderTaking/OrderTakingContainer.tsx` — central bug surface (Bugs 3, 5, 6)
- `apps/reception/src/components/bar/CompScreen.tsx` — Bug 4 (preorder eligibility)
- `apps/reception/src/components/bar/sales/TicketItems.tsx` — Bug 7 (key instability)
- `apps/reception/src/components/bar/orderTaking/PaymentSection.tsx` — Bug 8 (misleading placeholder); also `displayNumber` computed value
- `apps/reception/src/hooks/mutations/useBleeperMutations.ts` — `setBleeperAvailability` returns `BleeperResult`; caller in OrderTakingContainer does not check result
- `apps/reception/src/hooks/data/bar/useBleepersData.ts` — `firstAvailableBleeper`, `findNextAvailableBleeper`
- `apps/reception/src/components/bar/orderTaking/__tests__/OrderTakingContainer.test.tsx` — existing tests (mock-based, captures child props)
- `apps/reception/src/components/bar/__tests__/CompScreen.preorder.test.tsx` — existing preorder test (covers double-click modal, not eligibility filter)
- `apps/reception/src/hooks/mutations/__tests__/useBleeperMutations.test.ts` — mutation hook tests

### Bug Evidence

#### Bug 3 — "Bleep or Go" choice ignored at payment
**File:** `apps/reception/src/components/bar/orderTaking/OrderTakingContainer.tsx` ~line 259-304

`doConfirmPayment` initialises `finalBleep = "go"` (hardcoded string, line 263). A nested helper `chooseNext()` sets `finalBleep` to the next available bleeper number when called. The `if (usage === "go")` branch at line 270 calls `chooseNext()` — which is the bug: the branch that should preserve Go mode instead overwrites `finalBleep` with a numeric bleeper. The `else` branch (bleep mode) also calls `chooseNext()` as fallback when `bleepNumber` is empty or invalid, which is correct.

Consequently, `if (finalBleep !== "go")` at line 288 is never true when a bleeper is available and usage is "go" — it always executes, marking a bleeper as in-use.

**Root cause:** The `if (usage === "go")` block calls `chooseNext()` when it should do nothing (keep `finalBleep = "go"`). Fix: when `usage === "go"`, skip `chooseNext()` entirely — remove or guard the call in that branch.

#### Bug 4 — Preorder eligibility ignores tonight's date
**File:** `apps/reception/src/components/bar/CompScreen.tsx:185-194`

```tsx
return Object.values(occPre).some(
  (night) =>
    night.breakfast !== "NA" ||
    night.drink1 !== "NA" ||
    night.drink2 !== "NA"
);
```

This iterates over ALL nights in the preorder map. A guest who had breakfast preordered for a past or future night will incorrectly appear eligible on tonight's COMP screen.

**Key data fact:** Preorder night keys are ordinal strings (`"night1"`, `"night2"`, ...), NOT calendar date strings. This is confirmed in `apps/reception/src/types/hooks/data/preorderData.ts:28-30`. `night1` is the first night of the stay, `night2` the second, etc. The service date for `night{n}` = `checkInDate + n days` (e.g. `night1` service = the morning after check-in).

**Fix approach:**
1. The current `isEligibleForPreorder(id: string)` has no access to `checkInDate`. Extend it to `isEligibleForPreorder(id: string, checkInDate: string)`.
2. Compute `daysSinceCheckIn = diffDays(today, parseLocalDate(checkInDate))` where `diffDays` is days difference.
3. Construct `nightKey = "night" + daysSinceCheckIn`.
4. Look up `occPre[nightKey]` and check that single entry.
5. The `checkInDate` for each occupant is available via `bookings[guestsByBooking[id].reservationCode][id].checkInDate` — already computed in `buildRow`. The `useMemo` may need restructuring so the check-in date is resolved before the eligibility loop, or eligibility can be computed inside `buildRow` after check-in date is known.
6. `getNightIndex()`, `addDays()`, and `parseLocalDate()` utilities already exist in `apps/reception/src/components/bar/ModalPreorderDetails.tsx` and `apps/reception/src/utils/dateUtils.ts` — reuse them.
7. If `checkInDate` is absent for an occupant, return `false` (safe default — treat as ineligible rather than showing false positive).

**Adjacent issue (same bug pattern):** `buildRow` at line 220-224 also uses `Object.keys(occPre)[0]` (first night's plan) for the plan badge display. This should be fixed to use tonight's night key with the same approach. Minor scope addition.

#### Bug 5 — Bleeper availability write has no error handling
**File:** `apps/reception/src/components/bar/orderTaking/OrderTakingContainer.tsx` ~line 288-292

`await setBleeperAvailability(n, false)` is called without checking the returned `BleeperResult`. `useBleeperMutations.setBleeperAvailability` returns `{ success: false, error: string }` on failure (Firebase error, invalid number) — but the caller does nothing with this.

**Consequence:** Firebase write failure is silent. Two rapid orders can each read the same `firstAvailableBleeper` (before either Firebase write completes), causing two orders to claim the same bleeper.

**Fix:** Check `result.success`; if false, surface an error notification to staff and do not complete the order confirmation.

#### Bug 6 — Bleep # field auto-fills on fresh load
**File:** `apps/reception/src/components/bar/orderTaking/OrderTakingContainer.tsx:252-256`

```tsx
useEffect(() => {
  if (!bleepNumber.trim() && firstAvailableBleeper) {
    setBleepNumber(firstAvailableBleeper.toString());
  }
}, [bleepNumber, firstAvailableBleeper]);
```

On mount, `bleepNumber` is `""`. The effect immediately fires and sets state to `firstAvailableBleeper` (e.g. "5"). This makes the field appear pre-filled from a prior session. It also makes Go mode impossible from the UI: if user clears the field, the effect re-fires and re-fills it.

`PaymentSection.tsx:26-31` already handles display via `displayNumber` computed value (shows suggestion when field is "" or "go"). The `useEffect` in `OrderTakingContainer` is redundant with this and actively harmful.

**Fix:** Remove the auto-fill `useEffect` from `OrderTakingContainer`. Leave `PaymentSection.displayNumber` as the sole place the suggestion is shown.

#### Bug 7 — React key instability on ticket items
**File:** `apps/reception/src/components/bar/sales/TicketItems.tsx:22`

```tsx
key={it.id ?? crypto.randomUUID()}
```

When `it.id` is absent (common for unsaved order items), a new UUID is generated every render. React sees a new key on every re-render → unmounts + remounts the `<li>`. This triggers transition animations, loses any element-level state, and is wasteful.

**Fix:** Use the index as fallback: `key={it.id ?? i}`. Array index as fallback is appropriate here — items are never reordered within the list; removal uses splice by index.

#### Bug 8 — Placeholder text contradicts actual behaviour
**File:** `apps/reception/src/components/bar/orderTaking/PaymentSection.tsx:60`

Placeholder: `'Leave blank for "go"'`

Actual behaviour: when field is blank, `displayNumber` shows the next available bleeper number (via `firstAvailableBleeper`). The field is never visually blank — it always shows a suggestion. The placeholder is only visible if `firstAvailableBleeper` is `null` (all bleeepers in use).

**Fix:** Change placeholder to `"No bleepers available"` (shown only when all 18 are in use). Or update it to match actual behaviour: `"Auto-fill: next free bleeper"`.

### Patterns & Conventions Observed
- Firebase mutations return structured `BleeperResult` — callers must check `success` field — evidence: `useBleeperMutations.ts:30-64`
- `useMemo` for derived display values preferred over `useEffect`-driven state — evidence: `PaymentSection.tsx:26-31`
- Tests use mock-capture pattern (capture props from mocked children, call directly) — evidence: `OrderTakingContainer.test.tsx:22-47`

### Data & Contracts
- Types/schemas/events:
  - `BleeperResult: { success: boolean; error?: string; message?: string }` — `types/bar/BleeperTypes.ts`
  - `PreorderData: Record<string, NightData>` where keys are night date strings — `CompScreen.tsx:29`
  - `NightData: { breakfast?: string; drink1?: string; drink2?: string }` — `CompScreen.tsx:23-27`
  - `BleepersState: Record<number, boolean>` — `types/bar/BleeperTypes.ts`
- Persistence:
  - Bleeper availability: Firebase Realtime DB path `bleepers/{n}` (boolean)
  - Preorder data: Firebase Realtime DB via `usePreorder` hook
- API/contracts:
  - `setBleeperAvailability(n: number, isAvailable: boolean): Promise<BleeperResult>`
  - `firstAvailableBleeper: number | null` — from `useBleepersData`
  - `findNextAvailableBleeper(startIndex?: number): number | null` — from `useBleepersData`

### Dependency & Impact Map
- Upstream dependencies:
  - Firebase Realtime DB (bleepers path, preorder path)
  - `useBleepersData` → `firstAvailableBleeper`, `findNextAvailableBleeper`
  - `usePreorder` → preorder Firebase data
- Downstream dependents:
  - Bar payment flow reads `bleepNumber` state to determine final bleeper for reservation
  - COMP screen reads `preorder` to determine eligibility display
  - `TicketItems` re-renders on any order state change
- Likely blast radius:
  - All bugs are localised to bar subsystem; no shared infrastructure impact
  - Bug 3+5 fixes touch `doConfirmPayment` — must not regress normal bleep flow
  - Bug 4 fix adds a date filter — must confirm date key format matches Firebase

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest + React Testing Library
- Commands: `pnpm --filter reception test` (CI only)
- CI integration: run in CI, never locally

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| OrderTakingContainer | Unit (mock-capture) | `orderTaking/__tests__/OrderTakingContainer.test.tsx` | Tests prop passing; does NOT test doConfirmPayment, bleeper assignment, or Go/Bleep toggle |
| CompScreen preorder | Unit | `bar/__tests__/CompScreen.preorder.test.tsx` | Tests double-click modal open/close; does NOT test `isEligibleForPreorder` logic |
| useBleeperMutations | Unit | `mutations/__tests__/useBleeperMutations.test.ts` | Mutation hook tested; call-site error-handling in container not tested |
| TicketItems | Not tested | — | No test file found |
| PaymentSection | Not tested | — | No test file found |

#### Coverage Gaps
- Untested paths:
  - `doConfirmPayment` with `usage === "go"` — never tested
  - `doConfirmPayment` with `setBleeperAvailability` returning `{ success: false }` — never tested
  - `isEligibleForPreorder` with multi-night preorder data including a future/past night — never tested
  - `TicketItems` key stability (no test file)
  - `PaymentSection` placeholder text (no test file)
- Extinct tests:
  - None identified

#### Recommended Test Approach
- Unit tests for:
  - `doConfirmPayment` with `usage === "go"` (should not call `setBleeperAvailability`)
  - `doConfirmPayment` with `setBleeperAvailability` returning `{ success: false }` (should show error, not confirm)
  - `isEligibleForPreorder` with only a past-night entry (should return false)
  - `isEligibleForPreorder` with tonight's entry with eligible data (should return true)
  - `TicketItems` with items lacking `id` — verify key stability across re-renders
  - `PaymentSection` placeholder text when `firstAvailableBleeper` is null
- Integration tests for: none needed (Firebase subscription is appropriately mocked in existing tests)
- E2E tests for: out of scope for this fix batch

### Recent Git History (Targeted)
- `apps/reception/src/components/bar/*` — Not investigated: recent git log not pulled; bugs confirmed via live code read and live audit.

## Engineering Coverage Matrix
| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | `PaymentSection.tsx` placeholder text; bleep # field display value | Bug 8: misleading placeholder. Bug 6: field shows number on load | Fix placeholder copy; remove auto-fill effect |
| UX / states | Required | Go/Bleep toggle in Pay modal; COMP eligibility display | Bug 3: Go state ignored in payment logic; Bug 4: COMP eligibility wrong date | Fix `doConfirmPayment` guard; fix `isEligibleForPreorder` date filter |
| Security / privacy | N/A | No auth or PII changes | None | — |
| Logging / observability / audit | Required | `useBleeperMutations` logs error to console but caller ignores return | Bug 5: Firebase write failure is silent to staff | Add result check + notify on failure |
| Testing / validation | Required | Existing tests in `OrderTakingContainer.test.tsx`, `CompScreen.preorder.test.tsx`; no tests for TicketItems or PaymentSection | Coverage gaps for all 6 bug paths | Add unit tests for each fixed path |
| Data / contracts | Required | `BleeperResult` return type is documented but not used at call site | Bug 5: contract violated at call site | Enforce result check in OrderTakingContainer |
| Performance / reliability | Required | Bug 7: React key churn on every render | `TicketItems`: unnecessary remounts | Fix key to use index fallback |
| Rollout / rollback | Required | Local `apps/reception` app; Firebase data persists independently | None — changes are pure client-side logic except Bug 5 notification | Standard Git revert path; no migration needed |

## Questions
### Resolved
- Q: Does `useBleeperMutations.setBleeperAvailability` surface errors to the caller?
  - A: Yes — returns `BleeperResult { success: boolean, error?: string }`. The catch block sets local error state and returns `{ success: false, error }`.
  - Evidence: `apps/reception/src/hooks/mutations/useBleeperMutations.ts:54-64`

- Q: Does `PaymentSection` already handle the visual auto-fill suggestion?
  - A: Yes — `displayNumber` computed value shows `firstAvailableBleeper` when `bleepNumber` is `""` or `"go"`. The `useEffect` in `OrderTakingContainer` is therefore redundant.
  - Evidence: `apps/reception/src/components/bar/orderTaking/PaymentSection.tsx:26-31`

- Q: Is the array index safe as a `key` fallback in `TicketItems`?
  - A: Yes — items are not reordered; removal uses splice by index and reassigns the full `items` array. Index-as-key is stable in this context.
  - Evidence: `apps/reception/src/components/bar/sales/TicketItems.tsx:20-29`

- Q: What is the preorder night key format in Firebase data?
  - A: Keys are ordinal strings `"night1"`, `"night2"`, etc. — NOT calendar date strings. `night{n}` service date = `checkInDate + n days`. Helper utilities `getNightIndex()`, `addDays()`, `parseLocalDate()` already exist in `ModalPreorderDetails.tsx` and `dateUtils.ts`.
  - Evidence: `apps/reception/src/types/hooks/data/preorderData.ts:20-30`; `apps/reception/src/components/bar/ModalPreorderDetails.tsx:18-22`, `66-72`

### Open (Operator Input Required)
None — all questions resolved during investigation.

## Confidence Inputs
- Implementation: 90%
  - Evidence: All 6 bugs have confirmed root causes with file+line pointers. Preorder key format confirmed (ordinal night keys). Bug 4 fix approach clarified: needs `checkInDate` param and night-index computation using existing utilities.
  - What would raise to ≥95: CI passing post-fix.
- Approach: 92%
  - Evidence: Fixes are minimal and localised; no architectural changes. Dual auto-fill interaction (Bug 3/6) fully mapped. Bug 4 fix pattern exists in `ModalPreorderDetails.tsx`.
  - What would raise to ≥95: Confirm exact `useMemo` restructuring approach in CompScreen during implementation.
- Impact: 90%
  - Evidence: All bugs confirmed in live audit. Fixes directly address observed behaviour.
  - What would raise to ≥95: CI passing post-fix.
- Delivery-Readiness: 90%
  - Evidence: All files identified, test patterns understood, utility functions for Bug 4 fix located. No blocking open questions.
  - What would raise to ≥95: Existing CompScreen preorder test updated to cover the night-filter logic.
- Testability: 82%
  - Evidence: Existing mock-capture test pattern is well-established. `usePreorder` mock follows the same pattern as other hooks in `CompScreen.preorder.test.tsx`. Bug 4 test needs `checkInDate` in mock booking data.
  - What would raise to ≥90: Add test fixtures with multi-night preorder data spanning past and future nights.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Bug 4 fix requires `isEligibleForPreorder` to accept `checkInDate` parameter and night-key computation from ordinal keys (`night1/night2`); useMemo restructuring may be needed | High | Medium | Night-key utilities already exist in `ModalPreorderDetails.tsx` and `dateUtils.ts`; pattern is established |
| `checkInDate` absent for an occupant — night-key computation returns NaN/wrong key, occupant silently treated as ineligible | Medium | Low | Return `false` when `checkInDate` is absent (safe default) |
| Removing auto-fill useEffect (Bug 6) breaks an undocumented flow that depends on state being pre-filled | Low | Medium | `PaymentSection.displayNumber` already provides the visual suggestion; no other consumer of `bleepNumber` state found that requires pre-fill |
| Bug 3 fix (guard on `chooseNext`) causes regression for normal bleep flow | Low | High | Normal bleep flow sets `usage === "bleep"` or falls through to default — guard is additive (`if usage === "go" skip chooseNext`) |
| Bug 5 error notification conflicts with existing notification system | Low | Low | Use existing `NotificationProviderWithGlobal` toast pattern already present in reception app |

## Planning Constraints & Notes
- Must-follow patterns:
  - Firebase mutations via `useBleeperMutations` only — no direct Firebase `set()` in components.
  - Error surfacing via `NotificationProviderWithGlobal` toast (already in `App.tsx` tree).
  - Tests follow mock-capture pattern in `OrderTakingContainer.test.tsx`.
  - No `useEffect` for state derivable from other state/props — use `useMemo` (established pattern in `PaymentSection`).
- Rollout/rollback expectations:
  - Standard Git revert; no DB migration; no feature flag needed.
- Observability expectations:
  - Bug 5 fix should emit a visible error notification (not just console.error) when Firebase write fails.

## Suggested Task Seeds (Non-binding)
- TASK-01: Fix Bug 3 — guard `chooseNext()` on `usage === "go"` in `doConfirmPayment`
- TASK-02: Fix Bug 5 — check `BleeperResult` return value and notify on failure
- TASK-03: Fix Bug 6 — remove redundant auto-fill `useEffect` from `OrderTakingContainer`
- TASK-04: Fix Bug 4 — extend `isEligibleForPreorder` to accept `checkInDate`, compute tonight's night key using `getNightIndex`/`addDays` pattern from `ModalPreorderDetails.tsx`, filter to that key only; also fix `buildRow` plan display to use tonight's key (same bug pattern)
- TASK-05: Fix Bug 7 — replace `crypto.randomUUID()` key fallback with index
- TASK-06: Fix Bug 8 — update placeholder text in `PaymentSection`
- TASK-07: Add unit tests for all fixed paths

## Execution Routing Packet
- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - All 6 bugs fixed with evidence in code
  - Unit tests added for all fixed paths and passing in CI
  - No regressions in existing bar tests
- Post-delivery measurement plan:
  - Live bar shift observation (manual) to confirm Go mode works, COMP screen shows correct eligibility

## Evidence Gap Review
### Gaps Addressed
- All 6 bug root causes confirmed with file+line evidence.
- Test coverage gaps identified per bug.
- `BleeperResult` return type and call-site behaviour confirmed.
- Dual auto-fill interaction (Bug 6 / `PaymentSection.displayNumber`) mapped.

### Confidence Adjustments
- Implementation confidence raised from initial estimate: preorder date key format is the only remaining gap (resolvable at build time from `usePreorder.ts`).

### Remaining Assumptions
- `chooseNext()` is only called to assign a bleeper for bleep mode, not for any other side effect.
- `checkInDate` is reliably populated for all currently checked-in occupants (field is optional in the type but expected to be present for active occupancies).

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Bug 3 — doConfirmPayment Go/Bleep logic | Yes | None | No |
| Bug 4 — isEligibleForPreorder night filter | Yes | Keys are ordinal `night1/night2` (confirmed `preorderData.ts`); fix requires `checkInDate` param + night-index computation; utilities exist in `ModalPreorderDetails.tsx` | No |
| Bug 5 — setBleeperAvailability result handling | Yes | None | No |
| Bug 6 — auto-fill useEffect interaction with PaymentSection | Yes | None | No |
| Bug 7 — TicketItems key stability | Yes | None | No |
| Bug 8 — PaymentSection placeholder text | Yes | None | No |
| Test coverage gaps | Yes | All 6 paths untested; TicketItems + PaymentSection have no test files | Tests to be created in plan |

## Scope Signal
Signal: right-sized
Rationale: All 6 bugs are in the same subsystem, confirmed with direct code evidence, and have clear localised fixes. The work package is bounded to bar-only components with no architectural changes or external research needed. The single open question (date key format) is low-risk and resolvable during implementation.

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items: none
- Recommended next step: `/lp-do-analysis reception-bar-bleeper-bugs`
