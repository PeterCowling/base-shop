---
Type: Fact-Find
Outcome: Planning
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-08
Last-updated: 2026-03-08
Feature-Slug: reception-payment-prop-drilling
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-payment-prop-drilling/plan.md
Dispatch-ID: IDEA-DISPATCH-20260308214000-0003
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Payment Prop-Drilling Fact-Find Brief

## Scope

### Summary
The reception checkins payment component chain has significant prop drilling across four layers. `RoomPaymentButton` (the state owner) renders `PaymentForm`, which renders `PaymentDropdown`, which renders `SplitList`, which renders `PaymentSplitRow`. Each layer does have some own logic — `PaymentForm` manages `menuOpen` and the trigger button, `PaymentDropdown` hosts the "Confirm Payment" button, `SplitList` renders the add/remove row controls — but the callbacks and shared state (5 callbacks + `splitPayments` + `isDisabled`) still pass unchanged through each layer to reach leaf consumers. The goal is to introduce a React context scoped to the payment subtree so that each component pulls only what it needs directly, replacing the threading pattern.

### Goals
- Reduce `PaymentForm`'s prop interface from 8 props to ~2 (outstanding + isDisabled or zero, with everything else via context).
- Eliminate `PaymentDropdown` as a pure wrapper, or give it meaningful responsibility.
- Allow `SplitList` and `PaymentSplitRow` to pull their required values from context rather than receiving them as props.
- Remove dead props from `PaymentSplitRow` (`showAddButton`, `handleAddPaymentRow`, `handleRemovePaymentRow` — all currently unused in the component body). Note: `index` and `sp` must remain as explicit props since they are row-local values provided by the list iterator in `SplitList`.
- Preserve all existing behaviour with full test coverage retained.

### Non-goals
- Changing the payment business logic inside `RoomPaymentButton`/`useLocalFinancials` / `handlePayment`.
- Migrating to a global state library.
- Touching financial data hooks (`useActivitiesMutations`, `useAllTransactionsMutations`, `useFinancialsRoomMutations`).
- Changing the `PaymentSplit` / `PaymentType` types.

### Constraints & Assumptions
- Constraints:
  - Context must be locally scoped — not a global provider — to keep payment state encapsulated per `RoomPaymentButton` instance. Multiple checkin rows can be visible simultaneously.
  - Existing Jest unit tests for `PaymentForm`, `SplitList`, and `PaymentSplitRow` must continue to pass after updating to use a `PaymentContext.Provider` wrapper. If `PaymentDropdown` is eliminated, its test file (`PaymentDropdown.test.tsx`) should be deleted — its coverage is superseded by the updated `PaymentForm` test covering the confirm button in context.
  - The Popover open/close state (`menuOpen`, `handleOpenChange`) is `PaymentForm`-local and correctly should stay in `PaymentForm` — it does not need to be in context.
- Assumptions:
  - No other files in the reception codebase import from `PaymentDropdown`, `SplitList`, or `PaymentSplitRow` other than their direct parent. Confirmed by search below.
  - The context should live co-located with `RoomPaymentButton` in `apps/reception/src/components/checkins/roomButton/`.

## Outcome Contract

- **Why:** Full-app simplify sweep identified the payment component chain as the most severe prop-drilling anti-pattern in the reception app. The three-layer pass-through makes the payment flow extremely hard to test, modify, or extend safely.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Payment state is managed via a context or local hook rather than threaded through 3 component layers. PaymentDropdown either gains meaningful logic or is eliminated. PaymentForm prop interface reduces from 8 to ≤3 meaningful props.
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/checkins/roomButton/roomPaymentButton.tsx` — state owner and root of the payment subtree. Receives a single `booking: CheckInRow` prop. Manages `splitPayments`, `outstanding`, `isDisabled`, and all five callbacks internally. Renders `PaymentForm` with 8 props.

### Key Modules / Files

- `apps/reception/src/components/checkins/roomButton/roomPaymentButton.tsx` — state + logic. Defines `useLocalFinancials` hook, `handlePayment`, and all five callback handlers. Good design: logic is well-isolated here.
- `apps/reception/src/components/checkins/roomButton/PaymentForm.tsx` — 8-prop interface (outstanding, splitPayments, 5 callbacks, isDisabled). Owns only `menuOpen` local state + Popover trigger. Passes 7 of 8 props unchanged to `PaymentDropdown`. The `outstanding` and `splitPayments` props are used locally for display (label, icon).
- `apps/reception/src/components/checkins/roomButton/PaymentDropdown.tsx` — 7-prop interface. Passes 5 props to `SplitList`, uses `handleImmediatePayment` and `isDisabled` for its "Confirm Payment" button. Pure wrapper otherwise. **This component is a viable elimination candidate**: its only own logic is the "Confirm Payment" button, which could move to `PaymentForm`.
- `apps/reception/src/components/checkins/roomButton/SplitList.tsx` — 6-prop interface. Iterates `splitPayments`, renders `PaymentSplitRow` per row, passes `handleAddPaymentRow` and `handleRemovePaymentRow` alongside the row's props. The Add/Remove buttons are **rendered in `SplitList`** (not in `PaymentSplitRow`), making those props to `PaymentSplitRow` redundant.
- `apps/reception/src/components/checkins/roomButton/PaymentSplitRow.tsx` — 7-prop interface. Explicitly destructures `showAddButton: _showAddButton` (renamed to discard it). Also receives `handleAddPaymentRow` and `handleRemovePaymentRow` but never uses them. Only uses: `index`, `sp`, `isDisabled`, `handleAmountChange`, `handleSetPayType`.
- `apps/reception/src/types/component/roomButton/types.ts` — defines `PaymentType` and `PaymentSplit`. Simple, stable.
- `apps/reception/src/components/checkins/__tests__/PaymentForm.test.tsx` — unit test for `PaymentForm`, passes all 8 props as mocks.
- `apps/reception/src/components/checkins/__tests__/PaymentDropdown.test.tsx` — unit test for `PaymentDropdown`, passes all 7 props as mocks.
- `apps/reception/src/components/checkins/__tests__/SplitList.test.tsx` — unit test for `SplitList`, passes all 6 props as mocks.
- `apps/reception/src/components/checkins/__tests__/PaymentSplitRow.test.tsx` — unit test for `PaymentSplitRow`, passes all 7 props including unused ones.

### Patterns & Conventions Observed

- **Context pattern already used in the codebase.** `apps/reception/src/context/` has `TillDataContext.tsx`, `LoanDataContext.tsx`, `SafeDataContext.tsx`, `DialogContext.tsx`. Pattern: `createContext<T | undefined>(undefined)` + typed `useXxxContext()` hook that asserts non-null. Also used in `apps/reception/src/components/roomgrid/context/mainContext.tsx` (co-located context inside a component subtree).
- **Co-located context pattern.** `roomgrid/context/mainContext.tsx` is a precedent for placing context inside a component directory rather than the top-level `context/` folder. Payment context should follow this pattern.
- **`memo()` applied everywhere.** All four payment components export `memo(ComponentFn)`. This is a performance micro-optimization consistent with the checkins table rendering many rows. With context, context value memoization via `useMemo` in the provider is essential.

### Data & Contracts

- Types/schemas/events:
  - `PaymentSplit`: `{ id: string; amount: number; payType: PaymentType }` — `apps/reception/src/types/component/roomButton/types.ts`
  - `PaymentType`: `"CASH" | "CC"` — same file
  - Context value shape (proposed): `{ splitPayments: PaymentSplit[]; isDisabled: boolean; outstanding: number; handleAmountChange: (index, amount) => void; handleSetPayType: (index, payType) => void; handleAddPaymentRow: () => void; handleRemovePaymentRow: (index) => void; handleImmediatePayment: (e) => Promise<void> }`
- Persistence:
  - None at context level — persistence is in `roomPaymentButton.tsx` via `saveFinancialsRoom`, `addToAllTransactions`, `addActivity`.
- API/contracts:
  - `handleImmediatePayment: (event: MouseEvent<HTMLButtonElement>) => Promise<void>` — used by both `PaymentForm` (direct payment button) and `PaymentDropdown` (confirm button). Must remain available to both consumers via context.

### Dependency & Impact Map

- Upstream dependencies:
  - `roomPaymentButton.tsx` ← `BookingRow.tsx` (in checkins view) — confirmed by grep; receives single `booking: CheckInRow` prop.
- Downstream dependents (files importing the four payment components):
  - `PaymentForm.tsx` ← imported only by `roomPaymentButton.tsx`.
  - `PaymentDropdown.tsx` ← imported only by `PaymentForm.tsx`.
  - `SplitList.tsx` ← imported only by `PaymentDropdown.tsx`.
  - `PaymentSplitRow.tsx` ← imported only by `SplitList.tsx`.
  - All confirmed by search — no production code consumers outside `roomButton/`. Direct test file imports exist in `apps/reception/src/components/checkins/__tests__/` (one per component) — these are test-only and will be updated as part of the build.
- Likely blast radius:
  - **Contained entirely within the `roomButton/` directory.** No other part of the app imports these components. Tests import them directly for isolated unit testing.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library + `@testing-library/user-event`
- Commands: `pnpm --filter reception test` (CI only per policy — do not run locally)
- CI integration: Jest runs in CI on push/PR

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| PaymentForm | Unit (RTL) | `__tests__/PaymentForm.test.tsx` | 2 test cases: label rendering, disabled state |
| PaymentDropdown | Unit (RTL) | `__tests__/PaymentDropdown.test.tsx` | 1 test case: confirm payment button fires |
| SplitList | Unit (RTL) | `__tests__/SplitList.test.tsx` | 1 test case: add/remove button interactions |
| PaymentSplitRow | Unit (RTL) | `__tests__/PaymentSplitRow.test.tsx` | 1 test case: amount change + paytype toggle |
| RoomPaymentButton (root) | None | — | No unit or integration tests for the state-owner component |

#### Coverage Gaps

- Untested paths:
  - `roomPaymentButton.tsx` — the state owner has zero tests. Integration-level behaviour (payment flow, split computation, base row recalc) is untested.
  - `useLocalFinancials` hook — no isolated test.
- Extinct tests (post-refactor):
  - All four existing unit tests pass dead props (`handleAddPaymentRow`, `handleRemovePaymentRow`, `showAddButton` to `PaymentSplitRow`). These will need updating to wrap the component in a `PaymentContext.Provider` instead of passing props. Tests can remain isolated — wrapper pattern is sufficient.

#### Testability Assessment

- Easy to test:
  - All four components can continue to be tested in isolation by wrapping with `<PaymentContext.Provider value={mockContextValue}>`.
- Hard to test:
  - `roomPaymentButton.tsx` integration (involves Firebase mutation hooks) — out of scope for this refactor's test additions.
- Test seams needed:
  - A `PaymentContext.Provider` must be exported from the new context file for test use.

#### Recommended Test Approach

- Unit tests for:
  - Update `PaymentForm.test.tsx`, `SplitList.test.tsx`, and `PaymentSplitRow.test.tsx` to wrap components with `<PaymentContext.Provider value={mockContextValue}>` instead of passing props.
  - Delete `PaymentDropdown.test.tsx` if `PaymentDropdown` is eliminated; the "Confirm Payment" button is then tested via `PaymentForm.test.tsx`.
- Integration tests for: Add at least one `RoomPaymentButton` smoke test (render the root component with a mock `booking` fixture, verify the pay button renders and the popover content is accessible). This covers the new provider wiring, which is the riskiest part of the refactor and currently has no test coverage.
- E2E tests for: None — E2E coverage of the payment flow is a future concern outside this refactor.

### Recent Git History (Targeted)

- `apps/reception/src/components/checkins/roomButton/*` — No recent changes since the `fix: resolve raw-tailwind-color CI baseline violations` commit (b42b4b6). The component files appear stable and unchanged for the duration of active development.

## Questions

### Resolved

- Q: Can `PaymentDropdown` be eliminated entirely?
  - A: Yes, it is viable. `PaymentDropdown`'s only own logic is a div wrapper and the "Confirm Payment" button. That button can move into `PaymentForm`'s `PopoverContent` block. `SplitList` would then be a direct child of `PopoverContent`. This eliminates one component file and one layer of indirection.
  - Evidence: `PaymentDropdown.tsx` lines 37-58 — only contains layout div, `<SplitList ...>`, and one `<Button onClick={handleImmediatePayment}>`.

- Q: Where should the context file live?
  - A: Co-located in `apps/reception/src/components/checkins/roomButton/PaymentContext.tsx`. Precedent: `apps/reception/src/components/roomgrid/context/mainContext.tsx` is a co-located context inside a component directory.
  - Evidence: `roomgrid/context/mainContext.tsx` pattern.

- Q: Which props should remain as explicit props vs. move to context?
  - A: `PaymentForm` can keep `outstanding` as a prop because it is used for the button label — but even that can go in context. Given that `RoomPaymentButton` is the sole parent, the cleanest design is: context contains everything (`splitPayments`, `outstanding`, `isDisabled`, all 5 callbacks). `PaymentForm` receives zero props (or a single `className` if needed). This mirrors the TillDataContext / roomgrid mainContext pattern where the provider exposes all shared state.
  - Evidence: `TillDataContext.tsx` — provider wraps all data, children consume via `useTillData()`.

- Q: Does `showAddButton` in `PaymentSplitRow` serve any purpose?
  - A: No. It is renamed to `_showAddButton` in the destructuring (line 35) and never used. It was passed down as `idx === 0` from `SplitList`, but `SplitList` itself already renders the Plus/Trash buttons conditionally based on `idx`. The prop should be removed entirely.
  - Evidence: `PaymentSplitRow.tsx` line 35, `SplitList.tsx` lines 46-63.

- Q: Does `handleAddPaymentRow` / `handleRemovePaymentRow` in `PaymentSplitRow` do anything?
  - A: No. They are received in the interface but never called within `PaymentSplitRow`. The add/remove buttons that invoke these handlers are rendered in `SplitList`, not in `PaymentSplitRow`. These props should be removed from `PaymentSplitRowProps`.
  - Evidence: `PaymentSplitRow.tsx` lines 14-23 (interface), lines 29-73 (body — neither handler called).

- Q: Will context memoization be needed given `memo()` is on all components?
  - A: Yes. The context value object must be wrapped in `useMemo` in the provider to prevent re-renders of all consumers on every `RoomPaymentButton` render. Without memoization, `memo()` on child components is ineffective since context changes trigger re-render regardless.
  - Evidence: React docs + `TillDataContext.tsx` line uses `useMemo` for the context value.

### Open (Operator Input Required)

None. All questions are resolvable from code evidence and React conventions.

## Confidence Inputs

- Implementation: 95%
  - Evidence: All four target files fully read. Prop chains fully mapped. Context pattern precedents exist in the codebase. No external API or DB involved.
  - Raises to >=80: Already there.
  - Raises to >=90: Already there. 95% not 100% because context memoization must be validated in build.
- Approach: 90%
  - Evidence: Context pattern well-precedented in app. Co-located context precedent confirmed. Elimination of PaymentDropdown is clean — no hidden responsibility.
  - Raises to >=80: Already there.
  - Raises to >=90: Already there.
- Impact: 80%
  - Evidence: Blast radius is entirely within `roomButton/`. No external consumers. Test updates are predictable (wrapper pattern).
  - Raises to >=80: Already there.
  - Raises to >=90: Full integration test coverage of `RoomPaymentButton` — out of scope for this refactor.
- Delivery-Readiness: 90%
  - Evidence: All files identified, pattern established, test update strategy clear. No blockers.
  - Raises to >=80: Already there.
  - Raises to >=90: Already there.
- Testability: 85%
  - Evidence: All four components can be tested via context provider wrapping. Tests are straightforward to update.
  - Raises to >=80: Already there.
  - Raises to >=90: Adding a dedicated test for `PaymentContext` provider would confirm context value exposure.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Context re-render storm if value not memoized | Medium | Medium | Wrap context value in `useMemo` in provider; existing `memo()` on components provides guard |
| Test update omission (tests still pass old prop signatures) | Low | Low | Update all four test files as part of the build; TypeScript will catch prop mismatches at compile time |
| `PaymentDropdown` elimination breaks snapshot tests | Low | Low | Check `__snapshots__/` directory — no snapshot tests found for these components |
| `handleImmediatePayment` used in two places (PaymentForm + PaymentDropdown / its replacement) | Low | None | Context exposes it once; both consumers pull from context — no duplication |

## Planning Constraints & Notes

- Must-follow patterns:
  - Context file named `PaymentContext.tsx`, co-located in `roomButton/`.
  - Export `PaymentContext` (the raw React context), `PaymentProvider` (production provider — derives its own value from the props `RoomPaymentButton` passes; does NOT accept a `value` prop), and `usePaymentContext` from that file.
  - For test isolation, also export the `PaymentContextValue` interface so tests can construct mock values and wrap components with `<PaymentContext.Provider value={mockValue}>` directly (bypassing the production provider). This follows the `TillDataContext` / `mainContext` split — production providers derive state from hooks/props; tests use the raw context object for injection.
  - `usePaymentContext` must throw if called outside a provider (pattern matches `TillDataContext` guard).
  - Context value object inside `PaymentProvider` must be memoized with `useMemo`.
- Rollout/rollback expectations:
  - Single PR. No feature flag needed — this is an internal refactor with no user-visible change.
  - Rollback: revert PR. No migration or data change.
- Observability expectations:
  - None — pure UI refactor. No logging changes needed.

## Suggested Task Seeds (Non-binding)

1. Create `PaymentContext.tsx` in `roomButton/` — define `PaymentContextValue` interface, `createContext`, `PaymentProvider` component, `usePaymentContext` hook.
2. Update `RoomPaymentButton` to wrap `PaymentForm` with `<PaymentProvider>` instead of passing 8 props.
3. Refactor `PaymentForm` to consume from context; keep only `menuOpen` as local state; remove prop threading to `PaymentDropdown` (or inline dropdown content directly).
4. Either eliminate `PaymentDropdown` (move "Confirm Payment" button into `PaymentForm`'s `PopoverContent`) or have it consume from context.
5. Refactor `SplitList` to consume from context (drop all prop threading).
6. Refactor `PaymentSplitRow` to consume `handleAmountChange`, `handleSetPayType`, `isDisabled` from context; keep `index` and `sp` as explicit props (row-local values from `SplitList` iterator); remove the dead props `showAddButton`, `handleAddPaymentRow`, `handleRemovePaymentRow` entirely.
7. Update `PaymentForm.test.tsx`, `SplitList.test.tsx`, `PaymentSplitRow.test.tsx` to use `PaymentContext.Provider` wrapper instead of prop injection; delete or replace `PaymentDropdown.test.tsx` if `PaymentDropdown` is eliminated.
7b. Add one `RoomPaymentButton` smoke test:
  - Fixture requirement: include `financials: { totalDue: 50, totalPaid: 0, ... }` so `outstanding > 0` and the button is not disabled at render.
  - Mock the three mutation hooks (`useActivitiesMutations`, `useAllTransactionsMutations`, `useFinancialsRoomMutations`) at the module level to prevent Firebase/auth calls.
  - Verify: pay button renders, clicking the icon opens the popover with "Confirm Payment" button visible.
8. Run typecheck and lint to confirm no residual prop mismatches.

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - All files in `roomButton/` typecheck cleanly.
  - Three updated payment unit tests pass (`PaymentForm`, `SplitList`, `PaymentSplitRow` — each using `PaymentContext.Provider` wrapper). If `PaymentDropdown` is eliminated, its test file is deleted; if retained as a context consumer, its test is updated (4 test files).
  - One new `RoomPaymentButton` smoke test passes (with non-zero financials fixture and mutation hook mocks).
  - `pnpm lint` passes for the `reception` app.
  - `PaymentForm` prop interface ≤ 3 props.
  - `PaymentSplitRow` has no dead props (`showAddButton`, `handleAddPaymentRow`, `handleRemovePaymentRow` removed).
- Post-delivery measurement plan:
  - Visual QA of payment flow in dev environment (open popover, add split, confirm payment).

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| PaymentForm — prop interface and rendering | Yes | None | No |
| PaymentDropdown — pure wrapper identification | Yes | None | No |
| SplitList — prop pass-through and own rendering | Yes | None | No |
| PaymentSplitRow — dead prop identification | Yes | None | No |
| RoomPaymentButton — state owner and callbacks | Yes | None | No |
| Context pattern conventions in the app | Yes | None | No |
| Test landscape and update strategy | Yes | Minor: `SplitList.test.tsx` uses `container.querySelector('svg[data-icon=...]')` which is icon-implementation-dependent; may need updating independently | No |
| External consumer blast radius | Yes | None | No |
| Type definitions (`PaymentSplit`, `PaymentType`) | Yes | None | No |

## Evidence Gap Review

### Gaps Addressed

- Full prop chain mapped from `RoomPaymentButton` through all four layers.
- Dead props in `PaymentSplitRow` confirmed by reading the component body.
- All external consumers verified absent (grep across `apps/reception/src`).
- Context pattern conventions confirmed from existing context files.
- Test coverage for all four components confirmed — files exist, contents read.

### Confidence Adjustments

- No downward adjustments needed. Evidence is complete for planning purposes.
- Implementation confidence raised from initial dispatch estimate (0.75) to 0.95 after reading all component files.

### Remaining Assumptions

- `RoomPaymentButton` is always rendered one-per-row with no parent trying to share payment state across rows — confirmed by single `booking: CheckInRow` prop shape. If this assumption changes, context scoping must be revisited.

## Scope Signal

- Signal: right-sized
- Rationale: The change touches five source files in `roomButton/`, introduces one new context file, updates 3–4 unit test files, and adds one smoke test. Blast radius is fully contained — no production code outside `roomButton/` imports these components. All patterns needed exist in the codebase. No new infrastructure required.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan reception-payment-prop-drilling --auto`
