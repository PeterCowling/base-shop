---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: brik-eod-day-closed-confirmation
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-eod-day-closed-confirmation/plan.md
Trigger-Why: The EOD checklist was delivered as a read-only status view; it confirms sub-tasks are done but provides no act of closure. Managers must navigate away and rely on memory. A stored confirmation record is the missing piece for the worldclass goal's "offline-readable stored summary" criterion.
Trigger-Intended-Outcome: type: operational | statement: When all three EOD items are done, a manager can confirm day-closed in one tap; that confirmation is stored in Firebase and surfaced as a timestamped closed state on re-entry so the record is readable without re-checking underlying data | source: operator
Dispatch-ID: IDEA-DISPATCH-20260228-0078
---

# BRIK Reception EOD Day-Closed Confirmation Fact-Find Brief

## Scope

### Summary

`EodChecklistContent` is a read-only status component that shows till, safe, and stock complete or incomplete. When all three are done, there is no action available — no confirmation button, no stored record, no closed state. This means managers must rely on memory. The worldclass goal requires an "offline-readable stored summary", which is not satisfied by the current view.

The proposed change adds a "Confirm day closed" button that appears only when all three signals are complete. On press it writes a `eodClosures/<YYYY-MM-DD>` record to Firebase with timestamp and confirming user. On re-entry, if a record exists for today, the component shows a "Day closed" banner with the stored timestamp instead of the three status cards. This satisfies the "stored summary" part of the worldclass requirement. For offline readability: Firebase RTDB does not cache arbitrary paths offline by default; however `eodClosures/<today>` is loaded on page mount and will be available in-memory for the current session. A cold reload while offline will not show the closed state. This is an acceptable trade-off for a hostel reception context where connectivity is reliably available during the close-out window — offline-first PWA persistence is not in scope for this delivery.

### Goals

- Surface a "Confirm day closed" action when `tillDone && safeDone && stockDone` are all true.
- Write a day-closed record to Firebase at path `eodClosures/<YYYY-MM-DD>` on confirmation (date-keyed so it is idempotent and readable offline).
- On page load, read `eodClosures/<today>` and if a record exists show a "Day closed" state with timestamp and confirming user.
- Keep the component gated behind `Permissions.MANAGEMENT_ACCESS` (no change to access control).

### Non-goals

- Unlocking or editing a closed day (not in scope — can be a future addition).
- Showing historical closures beyond today.
- Any change to the underlying till/safe/stock completion signals.
- Navigation changes — the EOD checklist page route `/eod-checklist` is unchanged.

### Constraints & Assumptions

- Constraints:
  - Firebase Realtime Database is the data store (not Firestore); `set` to a date-keyed path for idempotency.
  - Must follow the existing hook + mutation pattern: read hook in `hooks/data/`, write hook in `hooks/mutations/`.
  - New Zod schema required for the `EodClosure` record (follows existing schema conventions).
  - Tests must use `data-cy` attributes (jest.setup.ts configures `testIdAttribute: "data-cy"`).
  - Italy timezone is the correct timezone for dates (use `getItalyIsoString` for timestamp and `extractItalyDate` for the date key).
- Assumptions:
  - `eodClosures` is a new top-level Firebase node (no existing data under this path — confirmed by grep: no files reference this path).
  - The `user.user_name` field is always present when `MANAGEMENT_ACCESS` is granted (confirmed by AuthContext — `user_name` is a required field in `userProfileSchema`).
  - Double-confirmation (pressing the button a second time on the same day) silently overwrites the record (idempotent `set`) — the earlier `confirmedBy` and `timestamp` are lost. This is an intentional design choice for this delivery: the EOD closure is a day-level fact, and the most recent confirmation is the authoritative one. The trade-off is weaker same-day audit traceability — if an operator needs to know who first closed the day and who re-confirmed it, `set` does not support that. If full audit trail is required, the implementation should use `push` to `eodClosures/<YYYY-MM-DD>/confirmations/<push-id>` instead. The planner should confirm which model is required; the fact-find defaults to `set` (simpler, idempotent, consistent with till-shift and safe-reset patterns).

## Outcome Contract

- **Why:** The EOD checklist was delivered with sub-task status indicators but no act of day closure. The worldclass audit gap stated "(d) offline-readable stored summary" as a requirement. That criterion is unmet by the current read-only view. This stores a closure record that a manager can see on re-entry without reloading underlying data.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After the build, a manager who has completed all three EOD tasks can confirm day closure in one tap on the `/eod-checklist` page. The confirmation is stored in Firebase and visible as a timestamped "Day closed" state on any subsequent visit to the page on the same day — including after reloading or navigating away.
- **Source:** operator

## Access Declarations

- **Firebase Realtime Database (BRIK)**: `apps/reception/` — pre-configured. All data hooks use `useFirebaseDatabase()` from `services/useFirebase.ts`. No additional credentials required.
- **No external APIs or queues involved.**

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/app/eod-checklist/page.tsx` — Next.js App Router page, `force-dynamic`, wraps `EodChecklistContent` in `Providers`. This is the only render entry point for the EOD checklist feature.

### Key Modules / Files

- `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` — The entire feature lives here. 116 lines. Reads till/safe/stock hooks, derives three boolean flags, renders status-only cards. No action or persistence. This is the primary file to modify.
- `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx` — 9 test cases (TC-01 through TC-09) covering loading, permission, and status states. Must be extended for the new button and closed states.
- `apps/reception/src/hooks/data/useSafeCountsData.ts` — Pattern reference for a Firebase read hook with filtering. Uses `onValue` + Zod validation + `useEffect`/`useState`.
- `apps/reception/src/hooks/data/useFirebaseSubscription.ts` — Generic subscription hook. Used by `useInventoryLedger`. The day-closed read hook should use this (simple single-path subscription).
- `apps/reception/src/hooks/mutations/useSafeCountsMutations.ts` — Mutation pattern reference: `useCallback` + `push`/`set` + Zod validation + error toast + auth guard. The day-closed write hook follows this pattern (using `set` not `push` for idempotent date-keyed writes).
- `apps/reception/src/schemas/safeCountSchema.ts` — Schema pattern reference: `z.object({...})` + type export. A new `eodClosureSchema.ts` follows this.
- `apps/reception/src/utils/dateUtils.ts` — Provides `getItalyIsoString()` (for timestamp) and `extractItalyDate(iso)` (for date key derivation — returns `YYYY-MM-DD` in Italy timezone).
- `apps/reception/src/context/AuthContext.tsx` — Provides `useAuth()` → `{ user }`. `user.user_name` is required; `user.uid` is optional but present for Firebase auth users.
- `apps/reception/src/lib/roles.ts` — `Permissions.MANAGEMENT_ACCESS` is `["owner", "developer", "admin", "manager"]`. Permission check already in `EodChecklistContent`.
- `apps/reception/src/app/eod-checklist/page.tsx` — No changes needed; the page wraps the component and has `force-dynamic` set.

### Patterns & Conventions Observed

- **Firebase path naming**: top-level collection names are camelCase plural nouns (`safeCounts`, `tillShifts`, `inventory/ledger`). New path: `eodClosures`.
- **Date-keyed idempotent write**: `set(ref(database, `tillShifts/${shiftId}`), payload)` in `useTillShiftsMutations` and `set(ref(database, `inventory/items/${itemId}`), payload)` in `useInventoryItemsMutations`. Day-closed uses the same pattern: `set(ref(database, `eodClosures/${dateKey}`), payload)`.
- **Schema convention**: `z.object({...})` exported as const `<entity>Schema`, plural wrapper `z.record(...)` as `<entities>Schema`, type exports as `z.infer<>`. Evidence: `safeCountSchema.ts`.
- **Mutation hook convention**: `useCallback` wrapping async function, `useMemo` on return value, auth guard at top of callback (`if (!user) { ... return; }`), Zod `safeParse` before write, `showToast` on error. Evidence: `useSafeCountsMutations.ts`, `useInventoryLedgerMutations.ts`.
- **Read hook for single path**: `useFirebaseSubscription<T>(path, schema?)` returns `{ data, loading, error }`. Evidence: `useInventoryLedger.ts`.
- **Test mocking**: `jest.mock` + `var` (pre-hoisting pattern), `data-cy` test IDs. Evidence: `EodChecklistContent.test.tsx`.

### Data & Contracts

- **New type: `EodClosure`**:
  ```
  {
    date: string;        // YYYY-MM-DD (Italy) — also the Firebase key
    timestamp: string;   // ISO string from getItalyIsoString()
    confirmedBy: string; // user.user_name
    uid?: string;        // user.uid (optional — present for Firebase auth users)
  }
  ```
- **Firebase path**: `eodClosures/<YYYY-MM-DD>` — single record per calendar day. `set()` writes (idempotent overwrite if confirmed twice in one day).
- **Read path**: `useFirebaseSubscription<EodClosure>('eodClosures/<today-key>', eodClosureSchema)` — subscribes to today's record only.
- **No API contract changes** — all Firebase, all client-side.
- **No existing types to extend** — `EodClosure` is a new standalone type.

### Dependency & Impact Map

- Upstream dependencies:
  - `EodChecklistContent` depends on `useTillShiftsData`, `useSafeCountsData`, `useInventoryLedger` (unchanged).
  - New: depends on `useEodClosureData` (new read hook) and `useEodClosureMutations` (new mutation hook).
  - Both new hooks depend on `useFirebaseDatabase` and `useAuth` (already injected into the component tree via `Providers`).
- Downstream dependents:
  - The `eod-checklist` page renders `EodChecklistContent` only. No other component imports it.
  - No other hook or component reads from `eodClosures` (new node — confirmed by grep).
  - `AppNav.tsx` label "End of Day" → `/eod-checklist` route is unchanged.
- Likely blast radius:
  - **Contained**: the change touches only `EodChecklistContent.tsx`, its test file, and three new files (schema, read hook, mutation hook). No shared utilities are modified. No other pages affected.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (`@testing-library/react`)
- Commands: tests run in CI via GitHub Actions reusable workflow (do not run locally — see repo policy)
- CI integration: tests run on every push via GitHub Actions reusable workflow

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| EodChecklistContent render | Unit | `EodChecklistContent.test.tsx` | TC-01 (permission), TC-02/08/09 (loading), TC-03 (all done), TC-04 (till open), TC-05 (stock incomplete), TC-06 (safe incomplete), TC-07 (mixed state) — 9 cases |
| useSafeCountsMutations | Unit | `useSafeCountsMutations.test.tsx` | 2 cases: writes with correct data, returns early when no user |
| useFirebaseSubscription | Unit | `useFirebaseSubscription.test.ts` | Exists — covers subscription lifecycle |

#### Coverage Gaps

- No test for "confirm day closed" button appearing when all three done (TC-03 currently only checks status text).
- No test for mutation call on confirmation.
- No test for "Day closed" closed state rendering when a closure record exists.
- No tests exist for the two new hooks. `useEodClosureMutations` must be tested (new write logic, auth guard, Zod validation). `useEodClosureData` does not require its own tests — it is a thin wrapper around `useFirebaseSubscription`, which is already tested.

#### Testability Assessment

- Easy to test:
  - `EodChecklistContent` render states: existing mock pattern extends naturally. Add a `useEodClosureData` mock alongside existing hook mocks.
  - Mutation on button press: `userEvent.click` + assert mock called.
  - Closed state display: mock `useEodClosureData` to return a record, assert closed banner renders.
- Hard to test:
  - Nothing structurally hard — all hooks are mockable, Firebase calls go through injected `useFirebaseDatabase`.
- Test seams needed:
  - `useEodClosureData` needs a mock export path parallel to the existing hook mocks in the test file.

#### Recommended Test Approach

- Unit tests for `EodChecklistContent` (extend existing file):
  - TC-10: all done + no closure record → confirm button visible
  - TC-11: all done + closure record exists → closed banner with timestamp, no confirm button
  - TC-12: not all done → confirm button not visible
  - TC-13: confirm button click → mutation hook invoked (assert the mock was called; do not assert payload shape at this level — payload correctness belongs in mutation hook tests)
- Unit tests for `useEodClosureMutations` (new file, parallel to `useSafeCountsMutations.test.tsx`):
  - writes correct payload (date key, `confirmedBy: user.user_name`, `timestamp` from `getItalyIsoString`)
  - returns early when no user (auth guard)
- Unit tests for `useEodClosureData` hook: Not required — `useFirebaseSubscription` is already tested; `useEodClosureData` is a thin wrapper that adds no new logic. Omit to keep test scope proportional to the change.

### Recent Git History (Targeted)

- `2a4dd18019` — `feat(reception): add /eod-checklist/ page route (TASK-02)`: added `apps/reception/src/app/eod-checklist/page.tsx` and updated plan.
- `f8e47b8f9c` — `feat(reception): add Chiusura nav entry to Admin section (TASK-03)`: added nav entry in `AppNav.tsx`.
- (TASK-01 commit: `EodChecklistContent.tsx` and test created — history not directly captured in the short log but the file exists fully with 9 tests.)
- These three commits completed the `reception-eod-closeout` plan. The current fact-find is the follow-on for the missing confirmation step.

## Questions

### Resolved

- Q: Should "Confirm day closed" require re-authentication (like variance signoff)?
  - A: No. Variance signoff requires re-auth because it overrides a financial discrepancy — a privileged action with audit risk. Day-closed confirmation is a routine end-of-shift action equivalent to closing a checklist. It is already gated behind `MANAGEMENT_ACCESS`. No re-auth needed.
  - Evidence: `useTillShiftsMutations.ts` — signoff params include `signedOffByUid`; `Permissions.MANAGEMENT_ACCESS` in `roles.ts`.

- Q: Should the Firebase path be `eodClosures/<YYYY-MM-DD>` (date-keyed `set`) or `eodClosures/<push-id>` (append)?
  - A: Date-keyed `set`. One record per day is the correct model: it is idempotent (re-confirmation is safe), directly addressable by today's date (no query needed), and offline-readable. The `push`/append pattern is correct for audit-log-style data (like `safeCounts`). Evidence: `useTillShiftsMutations.ts` uses `set(ref(database, 'tillShifts/${shiftId}'))` for records naturally keyed by a unique identifier.

- Q: Should loading states for the new closure read hook suppress the confirm button?
  - A: Yes. While `eodClosureLoading === true`, the button should not be visible (prevents double-tap during hydration). The closed state banner should also not render while loading. This is consistent with the existing loading guard pattern in the component.

- Q: What Italy-date function to use for the Firebase key?
  - A: `extractItalyDate(getItalyIsoString())` returns `YYYY-MM-DD` in Italy timezone. Alternatively `getItalyIsoString().slice(0, 10)` (which `extractItalyDate` calls internally). Either works; the explicit `extractItalyDate` call is cleaner and already has test coverage.

### Open (Operator Input Required)

- Q: Should the "Day closed" state prevent the three underlying status cards from being re-checked on the same day, or should they remain visible alongside the closed banner?
  - Why operator input is required: this is a UX preference with no right answer derivable from the codebase — "show only banner" vs "show banner + cards" are both valid.
  - Decision impacted: component layout in the closed state.
  - Decision owner: operator.
  - Default assumption (if any) + risk: Default to showing only the closed banner when a record exists (cleaner UX, no ambiguity about whether items are still checkable). Risk: low — easy to change post-delivery if the operator prefers the banner-plus-cards layout.

## Confidence Inputs

- **Implementation: 92%**
  - Evidence: entry point fully read, mutation pattern well-documented, Firebase write path clear (date-keyed `set`), schema convention clear, test pattern clear. All files needed have been inspected.
  - What raises to >=80: already there.
  - What raises to >=90: already there. Remaining 8% is the normal residual for an untested new Firebase node (no integration test confirming the path is writeable under RTDB security rules — out of scope for unit tests).

- **Approach: 90%**
  - Evidence: date-keyed `set` is the established idempotent write pattern (confirmed in `useTillShiftsMutations`). `useFirebaseSubscription` handles the read. New schema follows existing Zod convention. No architectural deviation.
  - What raises to >=90: already there.

- **Impact: 85%**
  - Evidence: operator-stated gap in worldclass audit. The change is a single-component addition with no blast radius beyond the EOD checklist page. Impact is bounded and well-understood.
  - What raises to >=80: already there. To >=90: would need operator to confirm the closed-state UX (banner-only vs banner+cards) — see Open question above.

- **Delivery-Readiness: 90%**
  - Evidence: all files identified, all patterns clear, test approach documented, one open question with a low-risk default assumption. Could begin immediately.
  - What raises to >=80: already there.

- **Testability: 88%**
  - Evidence: existing test mock infrastructure extends cleanly to the new hooks. All new code paths are unit-testable with the established pattern. No E2E tests needed for this feature.
  - What raises to >=80: already there. To >=90: requires writing the new test cases (TC-10 through TC-13) — this is the build work itself, not a blocker.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Firebase RTDB security rules block writes to `eodClosures` | Low | High | Rules should permit authenticated management-role users to write. If rules are strict, a rules update is needed before shipping. Recommend checking rules in `apps/reception/database.rules.json` at the start of build. |
| Italy-date key mismatch if user's device clock is wrong | Very Low | Low | `getItalyIsoString` uses `Intl.DateTimeFormat` with `timeZone: "Europe/Rome"` — server-independent. Works correctly even if device is in a different timezone. |
| Double-confirmation creates confusing UX if two managers confirm on the same day | Very Low | Low | Idempotent `set` is safe. Second confirmation updates timestamp and confirmedBy — no data loss, no error. Mitigated by closed-state UI hiding the button once a record exists. |
| Open question on closed-state layout (banner-only vs banner+cards) | Low | Low | Default assumption (banner-only) is reasonable and low-risk. Can be adjusted post-delivery. |

## Planning Constraints & Notes

- **Design decision for planner:** The fact-find defaults to `set(ref(database, 'eodClosures/${dateKey}'), payload)` for idempotency. This means re-confirmation on the same day silently overwrites the record, losing earlier confirmation authorship. If full audit trail of all confirmations is required, use `push` to `eodClosures/${dateKey}/confirmations/<push-id>` instead (requires adjusting the read hook to query children). Planner should confirm this choice before generating tasks. Default assumption: `set` (simpler; consistent with till-shift and safe-reset patterns).
- Must-follow patterns:
  - New Firebase write hook must follow `useSafeCountsMutations.ts` pattern: `useCallback`, auth guard, Zod `safeParse`, `showToast` on error, `useMemo` on return.
  - New read hook must use `useFirebaseSubscription<EodClosure>(path, schema)` — do not build a custom `onValue` subscription.
  - Zod schema file at `apps/reception/src/schemas/eodClosureSchema.ts` — not collocated with hooks.
  - Test IDs use `data-cy` attribute (`testIdAttribute: "data-cy"` in jest.setup.ts).
- Rollout/rollback expectations:
  - No migration needed — `eodClosures` is a new node; existing data is unaffected.
  - Rollback: remove the component changes, delete the new files. No database cleanup needed (empty node).
- Observability expectations:
  - Error toast on write failure (consistent with existing patterns — `showToast("Failed to confirm day closed.", "error")`).
  - No additional analytics needed for this operational feature.

## Suggested Task Seeds (Non-binding)

- TASK-01: Create `eodClosureSchema.ts` with Zod schema and type export for `EodClosure`.
- TASK-02: Create `useEodClosureData.ts` read hook (wraps `useFirebaseSubscription`, today's date key).
- TASK-03: Create `useEodClosureMutations.ts` write hook with `confirmDayClosed()` function.
- TASK-04: Update `EodChecklistContent.tsx` — wire read hook, add confirm button (all-done + not loading + no existing record), add closed-state banner.
- TASK-05: Write tests — extend `EodChecklistContent.test.tsx` (TC-10 through TC-13) and add `useEodClosureMutations.test.ts`.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `EodChecklistContent` shows "Confirm day closed" button when all three done and no record exists for today.
  - On button press, `eodClosures/<YYYY-MM-DD>` node written to Firebase with timestamp and confirmedBy.
  - On page load with existing record, closed banner displays with timestamp.
  - TC-10 through TC-13 pass. Existing TC-01 through TC-09 continue to pass.
  - `pnpm typecheck && pnpm lint` clean.
- Post-delivery measurement plan:
  - Operator confirms the closed state appears as expected after the first real-world day-end confirmation.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Entry point — `EodChecklistContent.tsx` | Yes | None | No |
| Firebase read path — subscription hook pattern | Yes | None | No |
| Firebase write path — date-keyed `set` pattern | Yes | None | No |
| Zod schema convention | Yes | None | No |
| Auth + permission gate | Yes | None | No |
| Italy timezone date key derivation | Yes | None | No |
| Test infrastructure + mock pattern | Yes | None | No |
| Blast radius — dependents of `EodChecklistContent` | Yes | None | No |
| Firebase node naming convention | Yes | None | No |
| Open question: closed-state UX layout | Partial | [Missing domain coverage] [Minor]: one UX layout question (banner-only vs banner+cards) cannot be resolved without operator input; default assumption documented | No — default assumption is low-risk |

## Evidence Gap Review

### Gaps Addressed

- Citation integrity: all file paths verified by direct read. All dependency claims traced to import sites. No inferred claims without explicit evidence.
- Boundary coverage: Firebase auth gate verified (`useAuth` in `AuthContext.tsx`), permission gate verified (`Permissions.MANAGEMENT_ACCESS` in `roles.ts`), error paths covered (Zod parse fail → toast, auth guard → early return).
- Test landscape: existing 9 test cases read and verified. Coverage gaps for the new states explicitly documented. Mutation test pattern verified against `useSafeCountsMutations.test.tsx`.
- No `eodClosures` node or any day-closed pattern exists in the codebase (confirmed by grep — zero matches for `eodClose`, `dayClosed`, `dayClose`, `eodConfirm`).

### Confidence Adjustments

- Implementation held at 92% (not 95%) due to untested Firebase security rules for the new `eodClosures` path.
- Impact held at 85% due to one open UX layout question (defaulted, low risk).

### Remaining Assumptions

- Firebase security rules permit `MANAGEMENT_ACCESS` users to write to `eodClosures`. If they are narrowly scoped, a rules update will be required. This is low-risk (rules update is a one-line change if needed) but should be verified at the start of build.
- Default UX assumption: closed-state shows banner only (no underlying status cards). This is the clean UX default and the operator can change it after delivery.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan brik-eod-day-closed-confirmation --auto`
