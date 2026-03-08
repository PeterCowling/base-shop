---
Type: Fact-Find
Outcome: Planning
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-08
Last-updated: 2026-03-08
Feature-Slug: reception-simplify-backlog
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-simplify-backlog/plan.md
Trigger-Why: Accumulated architectural debt from rapid-delivery waves; refactoring is needed to reduce maintenance burden and prevent regressions during future feature work.
Trigger-Intended-Outcome: type: operational | statement: All 7 identified clusters resolved — duplicated types extracted, thin pass-through wrappers removed or justified, shared RadioOption component created, auth error paths verified, SafeManagement modal state simplified, KeycardDepositButton dropdown state extracted, and error boundaries added to all app segments. | source: operator
---

# Reception Simplify Backlog Fact-Find Brief

## Scope
### Summary
A targeted refactoring pass over `apps/reception/src/` addressing seven clusters of accumulated debt identified during a full-app simplify sweep. No new features; pure DX and maintainability improvements. The codebase is large (~100 components, ~60 hooks) and these clusters represent copy-paste duplication, unnecessary indirection, and missing structural patterns. Scope is bounded — all changes are internal to the reception app with no API surface or user-visible behaviour changes.

### Goals
- Extract duplicated `BarOrderItem`/`BarOrder` interfaces into a shared location
- Remove or justify three thin client wrapper hooks that add no value
- Consolidate duplicate `RadioButton` sub-components into one shared primitive
- Confirm auth error paths are fully consolidated (already partially done)
- Replace 9 independent boolean modal flags in `SafeManagement` with a discriminated union
- Extract `useDropdownMenu()` hook from `KeycardDepositButton`'s 10+ local state vars
- Add segment-level `error.tsx` boundaries to all route segments under `apps/reception/src/app/`

### Non-goals
- Functional changes to bar order logic, till logic, or safe management business rules
- Changes outside `apps/reception/src/`
- New tests beyond what's needed to cover the extracted/moved code
- Any change to the `useBarOrder` orchestrator's external API

### Constraints & Assumptions
- Constraints:
  - Tests run in CI only — no local `jest` or `pnpm test`. Push and use `gh run watch`.
  - Writer lock must be acquired via `scripts/agents/with-writer-lock.sh` — never `SKIP_WRITER_LOCK=1`.
  - Pre-commit hooks (`--no-verify` forbidden).
  - All existing tests must continue to pass (test files import from current paths; any path moves must update imports).
- Assumptions:
  - The three thin till wrapper hooks (`useTillShiftState`, `useTillTransactions`, `useTillShiftActions`) are currently only consumed by `SafeManagement.tsx` (one import: `useTillShiftActions`) and their own test files — no component-level consumers found in `apps/reception/src/components/till/`.
  - `sendPasswordResetEmail` in `firebaseAuth.ts` intentionally does NOT use `mapAuthError` (inline handling for security-sensitive UX around email existence revelation) — this is a deliberate divergence, not a gap.
  - Error boundaries in Next.js App Router are per-segment `error.tsx` files that must be client components.

## Outcome Contract

- **Why:** Accumulated copy-paste and missing patterns from rapid delivery waves. These clusters create friction for future feature work and risk introducing subtle bugs when the same interface is updated in some files but not others.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 7 clusters resolved with no regressions. Shared type file `types/bar/BarOrderDomain.ts` created. Three thin hooks removed or explicitly justified. `RadioOption` shared component created. Auth error paths confirmed. `SafeManagement` modal state converted to discriminated union. `useDropdownMenu` hook extracted. Error boundaries added to all app segments.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points
- `apps/reception/src/app/layout.tsx` — root layout, no error.tsx present at root level
- `apps/reception/src/app/*/page.tsx` — 30+ route segments, none have adjacent `error.tsx`

### Key Modules / Files

**Cluster 1 — Bar mutation type duplication**
- `apps/reception/src/hooks/orchestrations/bar/actions/mutations/useAddItemToOrder.ts` — lines 12–22: defines `BarOrderItem` and `BarOrder` interfaces locally
- `apps/reception/src/hooks/orchestrations/bar/actions/mutations/useRemoveItemFromOrder.ts` — lines 11–21: exact copy of same two interfaces
- `apps/reception/src/hooks/orchestrations/bar/actions/mutations/useConfirmOrder.ts` — lines 14–24: exact copy again; also imports `SalesOrder`/`SalesOrderItem` from `types/bar/BarTypes.ts` for the final shape
- `apps/reception/src/types/bar/BarTypes.ts` — already has `SalesOrderItem` (lines 73–79) and `SalesOrder` (lines 81–89) which are the "confirmed" equivalents; also exports `BarOrder = UnconfirmedSalesOrder` alias (line 142) but this is a different structural shape (no `price` in items). The local `BarOrderItem` in the mutation files includes `price`, `count`, `lineType` — identical across all three files.
- `apps/reception/src/hooks/orchestrations/bar/actions/mutations/useBarOrder.ts` — orchestrator that composes all four mutation hooks; no local interface duplication here

**Overlap analysis:** `BarTypes.ts:SalesOrderItem` has `id?`, `product`, `price?`, `count`, `lineType?` — almost identical to the local `BarOrderItem` but `price` is optional in `SalesOrderItem` and required in the local copies. This divergence needs resolving during extraction. Target: new `types/bar/BarOrderDomain.ts`.

**Cluster 2 — Thin client wrapper hooks**
- `apps/reception/src/hooks/client/till/useTillShiftState.ts` — 15 lines, pure destructure of 7 fields from `useTillShiftContext()`
- `apps/reception/src/hooks/client/till/useTillTransactions.ts` — 17 lines, pure destructure of 10 fields
- `apps/reception/src/hooks/client/till/useTillShiftActions.ts` — 15 lines, pure destructure of 8 fields
- `apps/reception/src/hooks/client/till/TillShiftProvider.tsx` — source context; `useTillShiftContext()` exported directly
- Consumer search result: only `SafeManagement.tsx` (line 54) calls `useTillShiftActions()` in production code. `useTillShiftState` and `useTillTransactions` have NO production consumers — only their own test files.
- Tests: `useTillShiftState.test.tsx`, `useTillTransactions.test.tsx`, `useTillShiftActions.test.tsx` — each is a 1-test file that simply asserts the hook returns context values. These tests are vacuous (they test the context passthrough, not business logic) and would be deleted along with the hooks.

**Decision point:** `useTillShiftActions` has one real consumer (`SafeManagement`). Removing it means `SafeManagement` should call `useTillShiftContext()` directly. Since `TillShiftProvider` is only mounted in the till component tree, this requires verifying `SafeManagement` is rendered inside that tree. Evidence: `SafeManagement` is rendered directly from `apps/reception/src/app/safe-management/page.tsx` — it does NOT sit inside `TillShiftProvider`. The call to `returnKeycardsToSafe` via `useTillShiftActions()` already reaches the context — if `SafeManagement` is outside the `TillShiftProvider` tree, calling `useTillShiftContext()` directly would throw. This means the wrapper hooks may be providing a stable import boundary. This warrants investigation before removal.

**Cluster 3 — Copy-paste RadioButton components**
- `apps/reception/src/components/checkins/keycardButton/DocumentTypeSelector.tsx` — defines `DocRadioButton` (memo, lines 67–93): `label`, `value: DocumentType`, `icon: LucideIcon`, `currentValue: DocumentType`, `onChange: () => void`. Uses `Input compatibilityMode="no-wrapper"`, `sr-only` pattern, active state via `bg-surface-3`.
- `apps/reception/src/components/checkins/keycardButton/PaymentMethodSelector.tsx` — defines `RadioButton` (memo, lines 69–96): `label`, `value: KeycardPayType`, `icon: LucideIcon`, `iconClass?: string`, `currentValue: KeycardPayType`, `onChange: () => void`. Adds optional `iconClass` prop; slightly different layout (`flex justify-around` vs `flex flex-col`).
- The core pattern is identical: `Input type="radio" sr-only`, label wrapper, active state, icon. Only the value generic type and `iconClass` differ. Can be unified via generic `RadioOption<T extends string>`.
- Target: `apps/reception/src/components/common/RadioOption.tsx`

**Cluster 4 — Auth error mapper (verify)**
- `apps/reception/src/services/authErrors.ts` — shared `mapAuthError()` function exists
- `apps/reception/src/services/firebaseAuth.ts` — uses `mapAuthError` for `loginWithEmailPassword` catch (line 85). `sendPasswordResetEmail` uses inline error handling intentionally (security: suppresses user-not-found, has auth/invalid-email case not in `mapAuthError`) — this is justified divergence.
- `apps/reception/src/services/managerReauth.ts` — uses `mapAuthError` (line 65)
- **Status: COMPLETE.** All auth error catch paths either use `mapAuthError` or have documented reason not to. No remaining gaps.

**Cluster 5 — SafeManagement modal state**
- `apps/reception/src/components/safe/SafeManagement.tsx` — lines 56–64: 9 independent `useState<boolean>` flags: `showDeposit`, `showWithdrawal`, `showExchange`, `showBankDeposit`, `showPettyCash`, `showReconcile`, `showOpen`, `showReset`, `showReturn`. Plus `expandedRows` (not modal-related).
- Each flag is set to `true` on button click and `false` on confirm/cancel. Only one form is shown at a time based on the guard in the JSX.
- Refactor: `type SafeModal = 'deposit' | 'withdrawal' | 'exchange' | 'bankDeposit' | 'pettyCash' | 'reconcile' | 'open' | 'reset' | 'return' | null`, `const [activeModal, setActiveModal] = useState<SafeModal>(null)`.
- Test coverage: `apps/reception/src/components/safe/__tests__/SafeManagement.test.tsx` exists — must be updated after refactor.

**Cluster 6 — KeycardDepositButton complex local state**
- `apps/reception/src/components/checkins/keycardButton/KeycardDepositButton.tsx` — state vars: `buttonDisabled` (line 53), `keycardNumber` (line 54), `menuOpen` (line 81), `menuVisible` (line 82), `menuPosition` (line 83–86). Plus refs: `buttonRef`, `confirmButtonRef`, `timeoutsRef`. Animation logic: `setTrackedTimeout` callback (lines 94–104), cleanup effect (lines 106–110), fade-in/out effect (lines 165–176).
- The menu state cluster (`menuOpen`, `menuVisible`, `menuPosition`, `buttonRef`, `timeoutsRef`, `setTrackedTimeout`, `handleMenuToggle`) is self-contained and extractable to `useDropdownMenu()`.
- `payType` and `docType` are form state specific to this component — leave in place.
- `buttonDisabled` is submission guard — leave in place.
- `keycardNumber` is form input — leave in place.
- Proposed `useDropdownMenu()` API: returns `{ menuOpen, menuVisible, menuPosition, buttonRef, handleMenuToggle, closeMenu }`.
- Target: `apps/reception/src/hooks/client/checkins/useDropdownMenu.ts` (new directory) or `apps/reception/src/hooks/client/keycardButton/useDropdownMenu.ts`.

**Cluster 7 — Missing error.tsx boundaries**
- `apps/reception/src/app/layout.tsx` — root layout, no root `error.tsx`
- App segments without error boundaries (confirmed by directory listing): `rooms-grid`, `checkin`, `checkout`, `till-reconciliation`, `safe-management`, `safe-reconciliation`, `prepare-dashboard`, `real-time-dashboard`, `bar`, `loan-items`, `inbox`, `ingredient-stock`, `end-of-day`, `eod-checklist`, `extension`, `manager-audit`, `menu-performance`, `prepayments`, `prime-requests`, `reconciliation-workbench`, `staff-accounts`, `statistics`, `stock`, `variance-heatmap`, `alloggiati`, `audit`, `doc-insert`, `email-automation`, `live`
- Next.js App Router: `error.tsx` must be a Client Component (`"use client"`), receives `error: Error` and `reset: () => void` props
- Root `app/error.tsx` is the most impactful single addition (catches all segments). Per-segment files allow custom recovery UI.
- Practical approach: a root `error.tsx` + a few critical segment ones (`till-reconciliation`, `safe-management`, `bar`)

### Patterns & Conventions Observed
- Type files live in `types/bar/`, `types/domains/`, `types/hooks/data/` — pattern established; `types/bar/BarOrderDomain.ts` fits naturally
- Common components at `components/common/` — `RadioOption.tsx` fits there
- Client hooks at `hooks/client/<feature>/` — `useDropdownMenu.ts` fits at `hooks/client/keycardButton/`
- `memo()` used extensively for component optimization — preserve on extracted components
- `as const` return pattern used in all three thin wrappers

### Data & Contracts
- Types/schemas/events:
  - `BarOrderItem` (local, duplicated 3x): `{ product: string; price: number; count: number; lineType?: "bds" | "kds" }`
  - `BarOrder` (local, duplicated 3x): `{ confirmed: boolean; items: BarOrderItem[] }`
  - `SalesOrderItem` in `BarTypes.ts`: `{ id?: string; product: string; price?: number; count: number; lineType?: "bds" | "kds" }` — `price` is optional here but required in local copies
  - `SalesOrder` in `BarTypes.ts`: confirmed, full order with metadata fields
  - `BarOrder` alias in `BarTypes.ts` (line 142): `= UnconfirmedSalesOrder` (only `confirmed: boolean` + `items: SalesOrderItem[]`) — different from the local `BarOrder`
- Persistence:
  - Bar orders: Firebase RTDB at `/barOrders/unconfirmed` and `/barOrders/sales/<txnId>`
  - Safe counts: Firebase RTDB via `SafeDataContext`
  - Till shifts: Firebase RTDB via `TillShiftContext`

### Dependency & Impact Map
- Upstream dependencies:
  - Cluster 1: All three mutation hooks + `useBarOrder` orchestrator depend on local interfaces
  - Cluster 2: `TillShiftProvider` → `useTillShiftContext()` is the actual source; wrappers are intermediaries
  - Cluster 3: `KeycardDepositMenu.tsx` receives props from `KeycardDepositButton`; no other consumers of the sub-components
  - Cluster 6: `KeycardDepositMenu` receives `menuOpen`, `menuPosition`, `payType`, `docType`, `keycardNumber`, `buttonDisabled`, setters, `handleConfirm`, `closeMenu`
- Downstream dependents:
  - Cluster 1: `useBarOrder.ts` imports all four individual mutation hooks — not the interfaces directly, so extraction is transparent to it
  - Cluster 2: `SafeManagement.tsx` is the only production consumer of `useTillShiftActions`. Need to verify the `TillShiftProvider` wrapping situation before deletion.
  - Cluster 5: `SafeManagement.test.tsx` will need updating after discriminated union refactor
  - Cluster 7: No existing error boundaries — pure addition, no existing code changes
- Likely blast radius:
  - Cluster 1: Low — interface extraction only; `useConfirmOrder` already imports `SalesOrder`/`SalesOrderItem` from `BarTypes.ts` directly for the confirmed path, so the local `BarOrderItem`/`BarOrder` are used only for the in-progress state reads.
  - Cluster 2: Medium — removing `useTillShiftActions` requires understanding the provider tree. If `SafeManagement` is outside `TillShiftProvider`, the current code already has a latent bug (it would throw on mount if context is absent). Investigation needed.
  - Cluster 3: Low — pure extraction with identical logic
  - Cluster 4: Zero — already complete
  - Cluster 5: Low-Medium — logic change in one file, affects 9 state updates + tests
  - Cluster 6: Low-Medium — extraction from one component, well-bounded
  - Cluster 7: Low — additive only

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest + React Testing Library
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs` (governed runner)
- CI integration: Tests run in CI only; never locally

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| useAddItemToOrder | Unit | `__tests__/useAddItemToOrder.test.ts` | 1 test (merge case) |
| useRemoveItemFromOrder | Unit | `__tests__/useRemoveItemFromOrder.test.ts` | Exists |
| useConfirmOrder | Unit | `__tests__/useConfirmOrder.test.ts` | Exists |
| useTillShiftState | Unit | `__tests__/useTillShiftState.test.tsx` | 1 vacuous test (proves passthrough) |
| useTillTransactions | Unit | `__tests__/useTillTransactions.test.tsx` | 1 vacuous test |
| useTillShiftActions | Unit | `__tests__/useTillShiftActions.test.tsx` | 1 vacuous test |
| SafeManagement | Integration | `__tests__/SafeManagement.test.tsx` | Exists — will need update |
| KeycardDepositButton | None found | — | No tests; complex state extraction has no coverage anchor |
| error.tsx boundaries | None | — | Not applicable (integration concern) |

#### Coverage Gaps
- Untested paths:
  - `KeycardDepositButton` has no test file — extraction of `useDropdownMenu` will be unverified by tests unless new ones are added (low priority, pure extraction)
  - `DocumentTypeSelector` and `PaymentMethodSelector` have no test files
- Extinct tests (to delete):
  - `useTillShiftState.test.tsx`, `useTillTransactions.test.tsx`, `useTillShiftActions.test.tsx` — these test vacuous wrappers; should be deleted if hooks are removed

#### Recommended Test Approach
- Unit tests for: `RadioOption` generic component (render, active state, onChange)
- Integration tests for: `SafeManagement` — update existing test to use `activeModal` discriminated union if the test references modal state
- E2E tests for: none (refactoring only)

### Recent Git History (Targeted)
- `apps/reception/src/hooks/orchestrations/bar/actions/mutations/` — last commit `39927dc` ("sync workspace updates"), `b142a51` ("design-system plan work") — no recent structural changes; files are stable
- `apps/reception/src/components/safe/` — recent work in "Wave 3 screen polish" (`af1f086`) and "TASK-05 SafeManagement StatPanel" (`c3be6c3`) — SafeManagement was recently touched; discriminated union refactor is safe to sequence after polish work

## Questions
### Resolved
- Q: Do `useTillShiftState` and `useTillTransactions` have any production consumers?
  - A: No. Search across `apps/reception/src` shows only their own test files import them. `useTillShiftActions` has one consumer: `SafeManagement.tsx` (line 54).
  - Evidence: `Grep("useTillShiftState|useTillTransactions")` → 0 results outside tests

- Q: Is `sendPasswordResetEmail` a gap in auth error coverage?
  - A: No. It uses inline handling for security reasons (suppresses user-not-found to prevent email enumeration; handles `auth/invalid-email` which `mapAuthError` does not cover). The divergence is intentional and appropriate.
  - Evidence: `apps/reception/src/services/firebaseAuth.ts` lines 98–121

- Q: Does `BarTypes.ts:SalesOrderItem` overlap with the local `BarOrderItem` interfaces?
  - A: Partially. `SalesOrderItem.price` is optional (`price?`) while local `BarOrderItem.price` is required. These represent different lifecycle stages: local = in-progress editable order (price always known); `SalesOrderItem` = persisted record (price might be absent). The new `BarOrderDomain.ts` should keep `BarOrderItem` with required `price` and note the distinction.
  - Evidence: `BarTypes.ts` lines 73–79 vs mutation file local interfaces

- Q: Is `SafeManagement` mounted inside `TillShiftProvider`?
  - A: No direct evidence that it is. `SafeManagement` is rendered from `apps/reception/src/app/safe-management/page.tsx` directly. The `TillShiftProvider` wraps `TillReconciliation` inside `Till.tsx`, which is a separate route (`/till-reconciliation`). This means `SafeManagement` calling `useTillShiftContext()` should throw — unless there's a higher-level provider in the app layout or the safe-management page. This must be confirmed before removing the wrapper. If the context isn't provided at the safe-management route level, removing the wrapper changes nothing about the latent bug.
  - Evidence: `apps/reception/src/components/till/Till.tsx` wraps `TillShiftProvider` only around `TillReconciliation`. No evidence of a layout-level provider.
  - **Recommendation:** For Cluster 2, the safe path is: delete `useTillShiftState` and `useTillTransactions` (no production consumers), keep `useTillShiftActions` for now, and file a separate micro-task to audit the TillShiftProvider mounting before removing it.

- Q: Are there any `error.tsx` files anywhere in the reception app?
  - A: None found. `find apps/reception/src/app -name "error.tsx"` returned no results. The app relies entirely on Next.js default error handling.
  - Evidence: Bash find command, confirmed empty output

### Open (Operator Input Required)
None. All questions are resolvable from code.

## Confidence Inputs
- Implementation: 88%
  - Evidence: All source files read; exact change locations identified for 6/7 clusters; Cluster 4 is already complete. Cluster 2 has a risk item (TillShiftProvider mounting) with a safe mitigation path.
  - To reach 95%: Verify TillShiftProvider wrapping at the app layout level (e.g. read all `layout.tsx` files in app subdirectories).
- Approach: 90%
  - Evidence: Approach for each cluster is idiomatic React/TypeScript refactoring. No novel patterns required.
  - To reach 95%: Confirm no dynamic imports or barrel re-exports that would break on path moves.
- Impact: 95%
  - Evidence: All changes are internal to reception app; no API surface changes; no user-visible behaviour changes; pure DX.
  - To reach 98%: CI green run post-delivery.
- Delivery-Readiness: 85%
  - Evidence: Well-scoped, 7 independent clusters can be sequenced as separate tasks. No external dependencies.
  - To reach 90%: Resolve TillShiftProvider question definitively.
- Testability: 80%
  - Evidence: Most changes have existing tests or are additive (error boundaries). `KeycardDepositButton` extraction is the only gap with no test anchor.
  - To reach 90%: Add a minimal `useDropdownMenu` unit test.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `useTillShiftActions` removal breaks SafeManagement if TillShiftProvider is absent | Medium | High | Keep wrapper, only delete the two no-consumer hooks. File separate audit task. |
| `BarOrderDomain.ts` extraction changes `price` optionality — breaks TypeScript at call sites | Low | Medium | Confirm required `price` at all local call sites in the 3 mutation files before extracting; keep `price: number` (required) in new type |
| SafeManagement modal discriminated union — test file asserts on individual boolean flags | Low | Low | Read `SafeManagement.test.tsx` during implementation and update assertions to use `activeModal` |
| Error boundary `error.tsx` files cause hydration mismatch if not marked `"use client"` | Low | Medium | Standard pattern: always add `"use client"` directive to all error.tsx files |
| Removing vacuous wrapper tests reduces apparent coverage metrics | Low | Low | Coverage loss is real but appropriate — tests that verify a passthrough have no assertion value |

## Planning Constraints & Notes
- Must-follow patterns:
  - `memo()` on all extracted components
  - `"use client"` on all new `error.tsx` files
  - New type file in `types/bar/BarOrderDomain.ts` (not a mutation hook file)
  - `components/common/RadioOption.tsx` (consistent with existing common/ pattern)
  - No barrel re-exports — import directly from the new file paths
- Rollout/rollback expectations:
  - Each cluster is independent — can be landed as separate PRs or sequenced tasks
  - No database or API changes — rollback is a plain git revert
- Observability expectations:
  - Error boundaries will surface previously-silent runtime errors to Sentry (if configured) — this is a positive side effect, not a risk

## Suggested Task Seeds (Non-binding)
1. **TASK-01:** Extract `BarOrderItem`/`BarOrder` to `types/bar/BarOrderDomain.ts` and update all three mutation file imports
2. **TASK-02:** Delete `useTillShiftState.ts` and `useTillTransactions.ts` (no-consumer hooks) + their vacuous tests
3. **TASK-03:** Extract `RadioOption` generic component to `components/common/RadioOption.tsx`; refactor `DocumentTypeSelector` and `PaymentMethodSelector`
4. **TASK-04:** Refactor `SafeManagement` modal state from 9 booleans to discriminated union; update `SafeManagement.test.tsx`
5. **TASK-05:** Extract `useDropdownMenu()` hook from `KeycardDepositButton`
6. **TASK-06:** Add root `apps/reception/src/app/error.tsx` + segment-level error boundaries for `till-reconciliation`, `safe-management`, and `bar`
7. **TASK-07 (deferred):** Audit `TillShiftProvider` mounting scope and decide whether to remove `useTillShiftActions` wrapper

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `types/bar/BarOrderDomain.ts` exists and is imported by all three mutation hooks
  - `useTillShiftState.ts` and `useTillTransactions.ts` deleted; their test files deleted
  - `components/common/RadioOption.tsx` exists; `DocumentTypeSelector` and `PaymentMethodSelector` use it
  - `SafeManagement.tsx` uses `type SafeModal` discriminated union with `useState<SafeModal>(null)`
  - `useDropdownMenu` hook extracted; `KeycardDepositButton` uses it
  - `apps/reception/src/app/error.tsx` exists as `"use client"` component
  - All existing tests pass in CI
- Post-delivery measurement plan:
  - CI green run confirms no regressions
  - Grep confirms zero remaining local `BarOrderItem`/`BarOrder` interface definitions in mutation files
  - Grep confirms zero remaining `show*` boolean flags in `SafeManagement.tsx`

## Evidence Gap Review
### Gaps Addressed
- TillShiftProvider tree confirmed via `Till.tsx` source read
- `BarTypes.ts` `price` optionality difference identified and resolution path documented
- Production consumer count for all three thin wrappers confirmed via exhaustive grep

### Confidence Adjustments
- Implementation confidence raised to 88% after reading all source files (was estimated at 75% pre-read)
- Cluster 4 (auth errors) is already complete — reduces planned scope by one cluster

### Remaining Assumptions
- `TillShiftProvider` is not mounted at any layout level above `safe-management/page.tsx`. This is assessed as likely true based on `layout.tsx` read (no provider there) and `Till.tsx` read (provider only around `TillReconciliation`), but not 100% verified across all sub-layout files.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-simplify-backlog --auto`
