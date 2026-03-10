---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08
Status: Archived
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-payment-prop-drilling
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Payment Prop-Drilling Plan

## Summary

Replace the prop-drilling chain in the checkins payment component subtree with a locally-scoped `PaymentContext`. The current design passes 5 callbacks + `splitPayments` + `isDisabled` through `RoomPaymentButton → PaymentForm → PaymentDropdown → SplitList → PaymentSplitRow`, with no intermediate transformation. The refactor introduces `PaymentContext.tsx` (co-located in `roomButton/`), updates `RoomPaymentButton` to mount the provider, lets each child consume only what it needs, eliminates `PaymentDropdown` (its only logic moves to `PaymentForm`), and cleans up dead props in `PaymentSplitRow`. All source component changes land in one atomic commit to avoid broken intermediate states. Existing unit tests are updated to use context wrappers; a new `RoomPaymentButton` smoke test covers provider wiring.

## Active tasks

- [x] TASK-01: Create `PaymentContext.tsx` — Complete (2026-03-08)
- [x] TASK-02: Implement full source refactor atomically — Complete (2026-03-08)
- [x] TASK-03: Update tests and add `RoomPaymentButton` smoke test — Complete (2026-03-08)
- [x] TASK-04: Typecheck and lint validation — Complete (2026-03-08)

## Goals

- Reduce `PaymentForm`'s prop interface from 8 to 0 explicit data/callback props.
- Eliminate `PaymentDropdown` as a pure wrapper (inline its only logic into `PaymentForm`).
- Allow `SplitList` and `PaymentSplitRow` to pull shared state/callbacks from context.
- Remove dead props from `PaymentSplitRow` (`showAddButton`, `handleAddPaymentRow`, `handleRemovePaymentRow`).
- Keep `index` and `sp` as explicit props on `PaymentSplitRow` (row-local iterator values).
- Retain `menuOpen` as local state in `PaymentForm` (correctly local — not shared state).
- All existing behaviour preserved; tests updated to use context wrapper pattern.

## Non-goals

- Changing payment business logic in `RoomPaymentButton` / `useLocalFinancials` / `handlePayment`.
- Migrating to a global state library.
- Touching financial data hooks (`useActivitiesMutations`, `useAllTransactionsMutations`, `useFinancialsRoomMutations`).
- Changing `PaymentSplit` / `PaymentType` types.
- Adding integration tests for the Firebase payment flow (out of scope — future task).

## Constraints & Assumptions

- Constraints:
  - Context must be locally scoped (one provider instance per `RoomPaymentButton`) — multiple checkin rows render simultaneously; no shared global payment state.
  - `PaymentProvider` is a production-only provider that derives its value from passed data (not accepting a `value` prop). Tests use the raw `PaymentContext.Provider` with a mock `PaymentContextValue`.
  - `usePaymentContext` must throw if called outside a provider.
  - Context value must be wrapped in `useMemo` to preserve `memo()` effectiveness on child components.
  - TASK-02 must be committed atomically — `RoomPaymentButton`, `PaymentForm`, `SplitList`, `PaymentSplitRow`, and the deletion of `PaymentDropdown` must land in a single commit. Any subset of these changes leaves the app in a broken compile state.
  - Tests run in CI only — do not run locally.
- Assumptions:
  - No production code outside `roomButton/` imports `PaymentDropdown`, `SplitList`, or `PaymentSplitRow`. Confirmed by search in fact-find.
  - `SplitList.test.tsx` icon selector (`container.querySelector('svg[data-icon=...]')`) may need a separate fix if icons change — noted as Minor advisory.

## Inherited Outcome Contract

- **Why:** Full-app simplify sweep identified the payment component chain as the most severe prop-drilling anti-pattern in the reception app. The three-layer pass-through makes the payment flow extremely hard to test, modify, or extend safely.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Payment state is managed via a context rather than threaded through 3 component layers. PaymentDropdown is eliminated. PaymentForm prop interface reduces from 8 to 0 meaningful props.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/reception-payment-prop-drilling/fact-find.md`
- Key findings used:
  - All four payment component files read and prop chains mapped end-to-end.
  - `PaymentDropdown` confirmed as eliminable: only own logic is a div wrapper + "Confirm Payment" button.
  - `PaymentSplitRow` dead props confirmed: `showAddButton` discarded; `handleAddPaymentRow`/`handleRemovePaymentRow` received but never called.
  - Context precedents confirmed: `TillDataContext.tsx` (top-level), `roomgrid/context/mainContext.tsx` (co-located).
  - Test files for all four components confirmed; `RoomPaymentButton` has zero tests.
  - `CheckInRow` schema confirmed: required fields `bookingRef: string`, `occupantId: string`, `checkInDate: string`, `rooms: string[]`; `financials` is optional.

## Proposed Approach

- **Option A:** Introduce a shared `PaymentContext`, eliminate `PaymentDropdown`, land all source changes atomically. Production provider owns the `useMemo`-wrapped value; tests inject via raw `PaymentContext.Provider`.
- **Option B:** Keep `PaymentDropdown` as a thin context consumer (no elimination), thread only data through context while keeping callbacks as props.
- **Chosen approach:** Option A. `PaymentDropdown` has no meaningful logic to justify its existence once prop threading is removed. Eliminating it reduces the component tree depth and deletes one file + one test. The confirm button moves into `PaymentForm`'s `PopoverContent`, which is a natural location. Option B preserves unnecessary indirection. All source changes in Option A must land atomically (one commit) to avoid broken intermediate states — this is explicitly enforced in TASK-02.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create `PaymentContext.tsx` | 90% | S | Pending | - | TASK-02 |
| TASK-02 | IMPLEMENT | Implement full source refactor atomically | 85% | L | Pending | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Update tests + add `RoomPaymentButton` smoke test | 85% | M | Pending | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Typecheck and lint validation | 95% | S | Pending | TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Context definition; no dependencies |
| 2 | TASK-02 | TASK-01 complete | All source changes in one atomic commit — no sub-parallelism |
| 3 | TASK-03 | TASK-02 complete | Tests once source is stable |
| 4 | TASK-04 | TASK-03 complete | Final validation |

## Tasks

---

### TASK-01: Create `PaymentContext.tsx`

- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/reception/src/components/checkins/roomButton/PaymentContext.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/checkins/roomButton/PaymentContext.tsx` (new)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 95% — interface shape fully specified; context creation pattern well-established in the app.
  - Approach: 90% — `TillDataContext` + `mainContext` precedents; `useMemo` requirement explicit.
  - Impact: 90% — new file only; no production code changes yet; zero blast radius for this task alone.
- **Acceptance:**
  - `PaymentContext.tsx` exports: `PaymentContextValue` interface, `PaymentContext` (raw context), `PaymentProvider` component, `usePaymentContext` hook.
  - `PaymentContextValue` contains: `splitPayments: PaymentSplit[]`, `outstanding: number`, `isDisabled: boolean`, `handleAmountChange: (index: number, newAmount: string) => void`, `handleSetPayType: (index: number, newPayType: PaymentType) => void`, `handleAddPaymentRow: () => void`, `handleRemovePaymentRow: (index: number) => void`, `handleImmediatePayment: (event: MouseEvent<HTMLButtonElement>) => Promise<void>`.
  - `PaymentProvider` accepts the above fields + `children: ReactNode` as props; does NOT accept a `value` prop.
  - Context value inside `PaymentProvider` is wrapped in `useMemo` with all 8 fields in the dependency array.
  - `usePaymentContext` throws `"usePaymentContext must be used within a PaymentProvider"` if called outside any provider.
  - File typechecks cleanly with no new errors.
- **Validation contract (TC-01):**
  - TC-01: `usePaymentContext` called inside `<PaymentContext.Provider value={mockValue}>` → returns the mock value without throwing. (Validated in TASK-03 tests.)
  - TC-02: `usePaymentContext` called outside any provider → throws with the specified error message. (Validated in TASK-03 tests.)
- **Execution plan:** Red → Green → Refactor
  - Red: no `PaymentContext.tsx` exists.
  - Green: create file with full interface + provider + hook.
  - Refactor: verify `useMemo` dependency array is complete (no stale closures).
- **Planning validation:**
  - Checks run: `TillDataContext.tsx` and `mainContext.tsx` reviewed for pattern conformity.
  - Validation artifacts: `createContext<T | undefined>(undefined)` + typed hook pattern confirmed.
  - Unexpected findings: None.
- **Scouts:** None: context creation fully specified; no ambiguous decision points.
- **Edge Cases & Hardening:**
  - `useMemo` dependency array must include all 8 context value fields to prevent stale callback references.
  - `PaymentProvider` must NOT accept a `value` prop — tests use `<PaymentContext.Provider value={...}>` (the raw context) instead.
- **What would make this >=90%:** Already at 90%. >=95% after TASK-01 typechecks cleanly.
- **Rollout / rollback:**
  - Rollout: new file only; no effect until TASK-02 mounts the provider.
  - Rollback: delete `PaymentContext.tsx`.
- **Documentation impact:** None: internal refactor.
- **Notes / references:** Pattern precedents: `apps/reception/src/context/TillDataContext.tsx`, `apps/reception/src/components/roomgrid/context/mainContext.tsx`.

---

### TASK-02: Implement full source refactor atomically

- **Type:** IMPLEMENT
- **Deliverable:** Modified `roomPaymentButton.tsx`, `PaymentForm.tsx`, `SplitList.tsx`, `PaymentSplitRow.tsx`; deleted `PaymentDropdown.tsx` — all in one commit.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/checkins/roomButton/roomPaymentButton.tsx`
  - `apps/reception/src/components/checkins/roomButton/PaymentForm.tsx`
  - `apps/reception/src/components/checkins/roomButton/SplitList.tsx`
  - `apps/reception/src/components/checkins/roomButton/PaymentSplitRow.tsx`
  - `apps/reception/src/components/checkins/roomButton/PaymentDropdown.tsx` (DELETE)
  - `[readonly] apps/reception/src/components/checkins/roomButton/PaymentContext.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 90% — all five source files fully read; changes are mechanical with full type enforcement from TypeScript.
  - Approach: 85% — atomic commit strategy eliminates the broken intermediate state concern; slight uncertainty on memoization correctness at runtime.
  - Impact: 85% — user-visible layout must match exactly; `w-72 p-3` div and button position must be preserved in `PaymentForm`.
- **Acceptance:**
  - **`roomPaymentButton.tsx`:** renders `<PaymentProvider outstanding={...} splitPayments={...} isDisabled={...} handleAmountChange={...} handleSetPayType={...} handleAddPaymentRow={...} handleRemovePaymentRow={...} handleImmediatePayment={...}><PaymentForm /></PaymentProvider>` with no props on `<PaymentForm>`. All state and callbacks flow through the provider.
  - **`PaymentForm.tsx`:** `PaymentFormProps` is empty (removed or `type PaymentFormProps = Record<string, never>`). Consumes `splitPayments`, `outstanding`, `isDisabled`, `handleImmediatePayment` from `usePaymentContext()`. `menuOpen` and `handleOpenChange` remain as local state. `PopoverContent` directly renders the `w-72 p-3` div containing `<SplitList />` and the "Confirm Payment" button (inlined from deleted `PaymentDropdown`). Import of `PaymentDropdown` is removed.
  - **`SplitList.tsx`:** `SplitListProps` is empty (removed). Consumes `splitPayments`, `isDisabled`, `handleAddPaymentRow`, `handleRemovePaymentRow` from `usePaymentContext()`. Add/Remove buttons continue to render in `SplitList` (unchanged). `<PaymentSplitRow>` is called with only `index={idx}` and `sp={sp}` as explicit props.
  - **`PaymentSplitRow.tsx`:** `PaymentSplitRowProps` contains only `index: number` and `sp: PaymentSplit`. Props `handleAmountChange`, `handleSetPayType`, `isDisabled`, `showAddButton`, `handleAddPaymentRow`, `handleRemovePaymentRow` are removed. Consumes `isDisabled`, `handleAmountChange`, `handleSetPayType` from `usePaymentContext()`. `isRowZero` local variable preserved.
  - **`PaymentDropdown.tsx`:** file deleted. No import of it remains anywhere.
  - All five files (plus deletion) committed in a single git commit.
  - **Expected user-observable behaviour:**
    - Payment button renders with correct icon (Banknote/CreditCard/Plus) and amount label.
    - Clicking the icon opens the Popover with split rows + "Confirm Payment" button visible.
    - Clicking the amount label triggers immediate payment.
    - Disabled state: both buttons greyed/cursor-not-allowed; popover cannot open.
    - Split rows: row 0 amount read-only; rows 1+ editable; add/remove buttons work.
    - Pay-type toggle on any row cycles between CASH/CC.
  - All files typecheck cleanly after atomic commit.
- **Validation contract (TC-02):**
  - TC-01: After commit, `pnpm --filter @apps/reception typecheck` exits 0.
  - TC-02: `PaymentForm` import of `PaymentDropdown` is absent (grep check).
  - TC-03: `PaymentSplitRow` interface contains only `index` + `sp` (grep check).
  - TC-04: `PaymentDropdown.tsx` file does not exist (filesystem check).
- **Execution plan:** Red → Green → Refactor
  - Red: edit all five files to their new forms; do not commit individually — changes are interdependent.
  - Green: all edits complete; single atomic commit with all files.
  - Refactor: remove unused imports from each file (e.g., `PaymentDropdown` import from `PaymentForm`; prop types from components).
- **Planning validation:**
  - Checks run: all five source files read end-to-end in fact-find. `PaymentDropdown.tsx` layout (`w-72 p-3` div + confirm button class) noted for preservation in `PaymentForm`.
  - Validation artifacts: `PaymentSplitRow` dead props confirmed lines 14-35. `SplitList` add/remove button rendering confirmed lines 46-63.
  - Unexpected findings: None.
- **Consumer tracing (L effort):**
  - `PaymentContext.tsx` (TASK-01): All 8 fields from `PaymentContextValue` must be supplied by `PaymentProvider` in `roomPaymentButton.tsx`. TypeScript enforces completeness.
  - `PaymentForm.tsx`: now a zero-prop component. Only consumer is `roomPaymentButton.tsx`. No other production file imports it.
  - `SplitList.tsx`: now a zero-prop component. Only consumer is `PaymentForm.tsx`. No other production file imports it.
  - `PaymentSplitRow.tsx`: now a 2-prop component (`index`, `sp`). Only consumer is `SplitList.tsx`. No other production file imports it.
  - `PaymentDropdown.tsx`: deleted. Its only consumer was `PaymentForm.tsx` (import removed in this task). Test file `PaymentDropdown.test.tsx` deleted in TASK-03.
  - `handleImmediatePayment`: available in context; consumed by `PaymentForm` (direct payment button on right) AND the inlined confirm button in `PaymentForm`'s `PopoverContent`. Both consumers read from the same context reference — no duplication.
- **Scouts:** Confirm `PaymentProvider` must be INSIDE the `memo()` return of `RoomPaymentButton` (not above it) — each row must have its own isolated provider instance.
- **Edge Cases & Hardening:**
  - Preserve `w-72 p-3` div wrapper around `SplitList` + confirm button in `PaymentForm`'s `PopoverContent`.
  - Confirm button class to preserve: `w-full bg-primary-dark hover:bg-primary-main text-primary-fg rounded-lg px-3 py-1 mt-2 focus:outline-none transition-colors ${isDisabled ? "cursor-not-allowed opacity-70" : ""}`.
  - `useMemo` in `PaymentProvider` must include all 8 fields — stale callbacks would silently break split updates.
  - `memo()` wrappers on all four components must be retained.
- **What would make this >=90%:** Confirm visual layout in dev environment post-build + smoke test passing in CI.
- **Rollout / rollback:**
  - Rollout: one commit; no feature flag needed.
  - Rollback: `git revert` the atomic commit.
- **Documentation impact:** None.
- **Notes / references:** Atomic commit is a hard constraint — do not split into sub-commits for `PaymentForm` alone or `SplitList` alone; each partial state is a compilation error.

---

### TASK-03: Update tests and add `RoomPaymentButton` smoke test

- **Type:** IMPLEMENT
- **Deliverable:** Modified `PaymentForm.test.tsx`, `SplitList.test.tsx`, `PaymentSplitRow.test.tsx`; deleted `PaymentDropdown.test.tsx`; new `roomPaymentButton.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/checkins/__tests__/PaymentForm.test.tsx`
  - `apps/reception/src/components/checkins/__tests__/SplitList.test.tsx`
  - `apps/reception/src/components/checkins/__tests__/PaymentSplitRow.test.tsx`
  - `apps/reception/src/components/checkins/__tests__/PaymentDropdown.test.tsx` (DELETE)
  - `apps/reception/src/components/checkins/__tests__/roomPaymentButton.test.tsx` (NEW)
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 90% — all test files read; wrapper pattern is mechanical; `CheckInRow` schema confirmed.
  - Approach: 85% — smoke test fixture schema is now fully specified; mutation hook mocking is standard Jest pattern.
  - Impact: 85% — tests must pass in CI; any incomplete mock causes incorrect failure.
- **Acceptance:**
  - **`PaymentForm.test.tsx`:** Each test case wraps `<PaymentForm />` in `<PaymentContext.Provider value={mockContextValue}>`. Existing 2 test cases pass. Test also asserts: clicking the right-hand amount button (direct payment button) calls `handleImmediatePayment` from context (TC for the direct payment path).
  - **`SplitList.test.tsx`:** Wraps `<SplitList />` in `<PaymentContext.Provider value={mockContextValue}>` with no props on `<SplitList>`. Existing add/remove tests pass.
  - **`PaymentSplitRow.test.tsx`:** Renders `<PaymentSplitRow index={1} sp={split} />` (only 2 props) inside `<PaymentContext.Provider value={mockContextValue}>`. Existing amount change + paytype toggle tests pass.
  - **`PaymentDropdown.test.tsx`:** deleted (component no longer exists).
  - **`roomPaymentButton.test.tsx`** (new): 1 smoke test covering the full `RoomPaymentButton → PaymentProvider → PaymentForm → SplitList → PaymentSplitRow` provider-wiring path:
    - Mocks at module level: `jest.mock("../../../hooks/mutations/useActivitiesMutations")`, `jest.mock("../../../hooks/mutations/useAllTransactionsMutations")`, `jest.mock("../../../hooks/mutations/useFinancialsRoomMutations")`.
    - Mocks `react-dom`'s `createPortal` (same pattern as `PaymentForm.test.tsx`).
    - `mockBooking` fixture includes all required `CheckInRow` fields: `bookingRef: "TEST-001"`, `occupantId: "occ-001"`, `checkInDate: "2026-03-08"`, `rooms: ["101"]`, `financials: { totalDue: 50, totalPaid: 0, balance: 50, totalAdjust: 0, transactions: {} }`.
    - Asserts (step 1): amount button renders (`€50.00` label visible), not disabled.
    - Asserts (step 2): clicking the icon/trigger button opens the popover — the "Confirm Payment" button becomes visible, verifying `PaymentForm`'s `PopoverContent` renders correctly through the context provider.
    - Asserts (step 3): a split row input is visible (verifying `SplitList` and `PaymentSplitRow` render through the context without missing data).
    - Asserts: `usePaymentContext` hook validation — calling from inside the provider returns context values without throwing (TC-01 from TASK-01), tested via a minimal consumer component rendered inside `<RoomPaymentButton>`.
    - Asserts: calling `usePaymentContext` outside provider throws (TC-02 from TASK-01) — tested separately in the same file with a minimal render helper outside any payment tree.
  - No tests skipped with `describe.skip` or `it.skip` (no new skips introduced).
- **Validation contract (TC-03):**
  - TC-01: `PaymentForm` test with mock context → `€10.00` label visible, "Confirm Payment" button in popover.
  - TC-02: `PaymentForm` test — clicking right-hand amount button → `handleImmediatePayment` called.
  - TC-03: `SplitList` test with mock context → add/remove handlers called on button click.
  - TC-04: `PaymentSplitRow` test with 2-prop interface + mock context → amount change and paytype toggle fire correctly.
  - TC-05: `RoomPaymentButton` smoke — `€50.00` label visible, amount button not disabled.
  - TC-06: `RoomPaymentButton` smoke — click icon trigger → "Confirm Payment" button visible in popover; split row amount input visible.
  - TC-07: `usePaymentContext` inside provider (via `RoomPaymentButton`) → returns context values (no throw).
  - TC-08: `usePaymentContext` outside provider → throws.
- **Execution plan:** Red → Green → Refactor
  - Red: after TASK-02, existing tests fail (components no longer accept props).
  - Green: add `PaymentContext.Provider` wrappers; update prop calls to context mock; write smoke test.
  - Refactor: confirm all mock values are type-correct against `PaymentContextValue` (TypeScript enforces this).
- **Planning validation:**
  - Checks run: `checkInRowSchema.ts` read — required fields confirmed: `bookingRef`, `occupantId`, `checkInDate`, `rooms`; `financials` is `optional()`.
  - Test infrastructure confirmed: `jest.setup.ts` configures `testIdAttribute: "data-cy"`.
  - `PaymentForm.test.tsx` already mocks `react-dom.createPortal` — copy pattern for smoke test.
  - Validation artifacts: fixture shape fully specified above.
  - Unexpected findings: None.
- **Consumer tracing (M effort):**
  - `roomPaymentButton.test.tsx` is new; only consumer is CI test runner. No blast radius.
  - `mockContextValue` used in three updated test files — TypeScript ensures all 8 `PaymentContextValue` fields are present.
- **Scouts:** Verify module paths for `useActivitiesMutations`, `useAllTransactionsMutations`, `useFinancialsRoomMutations` in `roomPaymentButton.tsx` import statements before writing mocks.
- **Edge Cases & Hardening:**
  - Smoke test: use `totalDue: 50, totalPaid: 0` so `outstanding = 50 > 0` and button is enabled at render.
  - Mock context value in leaf component tests must include all 8 fields — TypeScript will catch any omission.
  - `SplitList.test.tsx` icon selector (`container.querySelector('svg[data-icon=...]')`) — update if icons have changed, otherwise preserve.
- **What would make this >=90%:** All tests pass in CI.
- **Rollout / rollback:**
  - Rollout: test-only changes; no production impact.
  - Rollback: revert test files; restore `PaymentDropdown.test.tsx`; delete `roomPaymentButton.test.tsx`.
- **Documentation impact:** None.
- **Notes / references:** `jest.setup.ts` uses `data-cy` attribute. No `data-testid` in new tests.

---

### TASK-04: Typecheck and lint validation

- **Type:** IMPLEMENT
- **Deliverable:** Clean `pnpm typecheck` and `pnpm lint` output for `apps/reception`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** Any files with residual TypeScript or lint errors from TASK-01–03.
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — purely mechanical; TypeScript and ESLint will surface any issues.
  - Approach: 95% — standard validation gate.
  - Impact: 95% — confidence gate for the full build.
- **Acceptance:**
  - `pnpm --filter @apps/reception typecheck` exits with 0 errors.
  - `pnpm --filter @apps/reception lint` exits with 0 new errors (existing pre-approved exceptions in `exceptions.json` are unchanged).
  - No unused imports remain in refactored files.
  - No dead prop declarations remain in `PaymentSplitRow`.
- **Validation contract (TC-04):**
  - TC-01: typecheck exits 0 on `apps/reception`.
  - TC-02: lint exits 0 on changed files.
- **Execution plan:** Red → Green → Refactor — run typecheck; fix residual issues; run lint; fix residual issues.
- **Planning validation:** None needed in planning phase; this task is the validation gate.
- **Scouts:** None: standard validation task.
- **Edge Cases & Hardening:** If any `@ts-ignore` comments exist in refactored files, remove them (none expected per fact-find).
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:** None: validation task.
- **Documentation impact:** None.

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create `PaymentContext.tsx` | Yes | None | No |
| TASK-02: Full atomic source refactor | Yes (TASK-01 complete) | None — atomic commit enforces all changes land together; no broken intermediate states possible | No |
| TASK-03: Update tests + smoke test | Yes (TASK-02 complete — all source stable) | [Minor] `SplitList.test.tsx` icon selector is icon-library-dependent; handle inline if needed | No |
| TASK-04: Typecheck + lint | Yes (TASK-03 complete) | None | No |

## Delivery Rehearsal

**Data lens:** No database records or external data required. Context value flows entirely from `RoomPaymentButton` in-memory state. No finding.

**Process/UX lens:** User-visible flow: payment button renders → click icon → popover opens → split rows visible → "Confirm Payment" submits (note: no popover-close action is wired on confirm — `PaymentForm` wires `handleImmediatePayment` only; popover-close-on-confirm is not part of this refactor scope). The inlined "Confirm Payment" button preserves position from deleted `PaymentDropdown`. The direct payment button (right-hand amount label) calls `handleImmediatePayment` directly — this path is explicitly validated in TASK-03 TC-02. No finding.

**Security lens:** No auth boundary, permission check, or data access rule introduced or modified. No finding.

**UI lens:** TASK-02 modifies `PaymentForm` (visible component). Rendering path: `PaymentForm` inside `Popover > PopoverContent`, rendered by `RoomPaymentButton` inside `CheckinsTable` row. Layout preservation (`w-72 p-3`, button order, classes) is explicit in TASK-02 acceptance. No finding.

**Adjacent ideas routed to Decision Log:**
- [Adjacent: delivery-rehearsal] Integration tests for `handlePayment` / `useLocalFinancials` would strengthen coverage but require additional Firebase hook mocking beyond scope — route to post-build reflection.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `useMemo` deps incomplete — stale callback | Low | Medium | TASK-01 acceptance enforces all 8 fields in dep array; TypeScript catches type-level issues |
| Atomic commit partially staged by mistake | Low | Low | TASK-02 notes atomic commit requirement explicitly; build agent must verify all 5 file changes staged together |
| Smoke test fixture missing required `CheckInRow` fields | Low | Low | Schema confirmed; required fields (`bookingRef`, `occupantId`, `checkInDate`, `rooms`) all specified in TASK-03 |
| `SplitList.test.tsx` icon selector breakage | Low | Low | Flagged; fix inline in TASK-03 if icons have changed |
| `PaymentDropdown.test.tsx` deletion surfaces if referenced elsewhere | Low | Low | Confirmed no other imports; deletion is clean |

## Observability

- Logging: None — pure UI refactor; no logging changes.
- Metrics: None.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] `PaymentContext.tsx` created: `PaymentContextValue` interface, `PaymentContext`, `PaymentProvider` (no `value` prop), `usePaymentContext` (throws outside provider), context value `useMemo`-wrapped.
- [ ] All 5 source file changes committed atomically in TASK-02.
- [ ] `RoomPaymentButton` mounts `PaymentProvider` with zero-prop `PaymentForm` child.
- [ ] `PaymentForm` is a zero-prop component; `menuOpen` local state preserved; "Confirm Payment" inlined.
- [ ] `PaymentDropdown.tsx` deleted.
- [ ] `SplitList.tsx` zero-prop; consumes from context.
- [ ] `PaymentSplitRow.tsx` has only `index` + `sp` as explicit props; dead props removed.
- [ ] `PaymentForm.test.tsx`, `SplitList.test.tsx`, `PaymentSplitRow.test.tsx` updated to context-wrapper pattern; all pass.
- [ ] `PaymentDropdown.test.tsx` deleted.
- [ ] `roomPaymentButton.test.tsx` added with smoke test + `usePaymentContext` hook validation; passes.
- [ ] `pnpm --filter @apps/reception typecheck` exits 0.
- [ ] `pnpm --filter @apps/reception lint` exits 0 (no new errors).

## Decision Log

- 2026-03-08: Chose Option A (eliminate `PaymentDropdown`) over Option B (retain as context consumer). Rationale: `PaymentDropdown` has no meaningful logic; its sole content (layout div + confirm button) is trivially inlineable into `PaymentForm`'s `PopoverContent`.
- 2026-03-08: Collapsed TASK-02/03/04 (original plan) into single atomic TASK-02. Rationale: all source file changes are interdependent; any subset of changes leaves the app in a broken compile state. Atomic commit is the only safe execution unit.
- 2026-03-08: [Adjacent: delivery-rehearsal] Integration tests for `handlePayment`/`useLocalFinancials` noted as adjacent scope — route to post-build reflection.

## Overall-confidence Calculation

- TASK-01: 90% × S(1) = 90
- TASK-02: 85% × L(3) = 255
- TASK-03: 85% × M(2) = 170
- TASK-04: 95% × S(1) = 95
- Sum weights: 1+3+2+1 = 7
- Sum weighted: 90+255+170+95 = 610
- Overall-confidence = 610/7 ≈ 87%
