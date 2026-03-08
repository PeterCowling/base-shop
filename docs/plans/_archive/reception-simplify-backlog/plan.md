---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08 21:10
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-simplify-backlog
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Simplify Backlog Plan

## Summary

Pure refactoring pass over `apps/reception/src/` targeting seven clusters of accumulated debt. No user-visible changes and no API surface changes. The work spans: extracting duplicated bar-domain interfaces into a shared type file; removing three thin pass-through hooks (one resolved risk: `SafeManagement` IS inside `TillShiftProvider` — all three wrappers can be removed); consolidating two copy-paste RadioButton sub-components into one generic primitive; confirming auth error coverage (already complete — no tasks needed); collapsing nine independent modal-state booleans in SafeManagement to a discriminated union; extracting dropdown-menu state from `KeycardDepositButton`; and adding root + segment-level error boundaries. Tasks are mostly independent and can be executed in parallel within sequenced waves.

## Active tasks
- [x] TASK-01: Extract BarOrderItem/BarOrder to BarOrderDomain.ts — Complete (2026-03-08)
- [x] TASK-02: Remove thin till wrapper hooks — Complete (2026-03-08)
- [x] TASK-03: Extract RadioOption shared component — Complete (2026-03-08)
- [x] TASK-04: Refactor SafeManagement modal state to discriminated union — Complete (2026-03-08)
- [x] TASK-05: Extract useDropdownMenu hook from KeycardDepositButton — Complete (2026-03-08)
- [x] TASK-06: Add error.tsx boundaries to reception app segments — Complete (2026-03-08)
- [x] TASK-07: CI green-check checkpoint — Complete (2026-03-08)

## Goals
- Eliminate three copies of identical `BarOrderItem`/`BarOrder` interface definitions
- Remove three zero-logic pass-through wrapper hooks and their vacuous tests
- Create one reusable generic `RadioOption<T>` component replacing two duplicate sub-components
- Confirm auth error coverage is complete (fact-find verified — no code change needed)
- Replace nine independent `show*` boolean flags in SafeManagement with a discriminated union
- Extract `useDropdownMenu()` hook from `KeycardDepositButton` complex local state
- Add `error.tsx` boundaries at the root app level and three critical route segments

## Non-goals
- Functional changes to bar order logic, till logic, or safe management business rules
- Changes outside `apps/reception/src/`
- New feature tests beyond what's needed to cover refactored code
- Any change to `useBarOrder`'s external API

## Constraints & Assumptions
- Constraints:
  - Tests run in CI only. Never run jest/pnpm test locally. Push and use `gh run watch`.
  - Writer lock via `scripts/agents/with-writer-lock.sh` — never `SKIP_WRITER_LOCK=1`.
  - `--no-verify` is forbidden on commits.
  - All existing tests must remain passing.
- Assumptions:
  - `SafeManagement` IS wrapped by `TillShiftProvider` in `apps/reception/src/app/safe-management/page.tsx` (verified during planning — see Decision Log). All three thin wrappers can be safely deleted.
  - `BarOrderItem.price` is required (not optional) in the new shared type — this matches actual usage in all three mutation files.
  - The test mock for `useTillShiftActions` (line 28-30 in `SafeManagement.test.tsx`) must be updated to mock `TillShiftProvider`/`useTillShiftContext` after TASK-02 removes the wrapper.

## Inherited Outcome Contract

- **Why:** Accumulated copy-paste and missing patterns from rapid delivery waves. These clusters create friction for future feature work and risk introducing subtle bugs when the same interface is updated in some files but not others.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 7 clusters resolved with no regressions. Shared type file `types/bar/BarOrderDomain.ts` created. Three thin hooks removed. `RadioOption` shared component created. Auth error paths confirmed. `SafeManagement` modal state converted to discriminated union. `useDropdownMenu` hook extracted. Error boundaries added to app segments.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-simplify-backlog/fact-find.md`
- Key findings used:
  - All three mutation hooks (`useAddItemToOrder`, `useRemoveItemFromOrder`, `useConfirmOrder`) define identical local `BarOrderItem`/`BarOrder` interfaces — confirmed by reading each file
  - `useTillShiftState` and `useTillTransactions` have zero production consumers (grep confirmed)
  - `useTillShiftActions` has one consumer (`SafeManagement.tsx`) and `SafeManagement` IS inside `TillShiftProvider` (confirmed in `apps/reception/src/app/safe-management/page.tsx`) — all three wrappers safe to remove
  - `SafeManagement.test.tsx` mocks `useTillShiftActions` at line 28-30 — must be updated to mock `useTillShiftContext` after wrapper removal
  - `DocRadioButton` and `RadioButton` sub-components are structurally identical except for value generic type and optional `iconClass`
  - No `error.tsx` files exist anywhere in the app (confirmed via find command)
  - Auth error coverage is complete (Cluster 4) — no code task needed

## Proposed Approach
- Option A: Tackle clusters in dependency order, one PR per cluster
- Option B: All clusters in one PR, sequenced as independent task waves within a single build session
- Chosen approach: Option B (single build session, wave-sequenced). All clusters are independent at the file level. Batching into one session reduces integration overhead and the checkpoint gate catches any CI issue before they compound. The SafeManagement test update for TASK-02/TASK-04 is the only cross-task dependency within the session.

## Plan Gates
- Foundation Gate: Pass
  - `Deliverable-Type: code-change` ✓
  - `Execution-Track: code` ✓
  - `Primary-Execution-Skill: lp-do-build` ✓
  - `Startup-Deliverable-Alias: none` ✓
  - Delivery-readiness: 85% ✓ (≥80 threshold)
  - Test landscape documented ✓
  - Testability assessment documented ✓
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extract BarOrderItem/BarOrder to BarOrderDomain.ts | 92% | S | Complete (2026-03-08) | - | - |
| TASK-02 | IMPLEMENT | Remove thin till wrapper hooks + update SafeManagement | 90% | S | Complete (2026-03-08) | - | TASK-04 |
| TASK-03 | IMPLEMENT | Extract RadioOption generic component | 88% | S | Complete (2026-03-08) | - | - |
| TASK-04 | IMPLEMENT | SafeManagement modal discriminated union | 85% | M | Complete (2026-03-08) | TASK-02 | TASK-07 |
| TASK-05 | IMPLEMENT | Extract useDropdownMenu from KeycardDepositButton | 85% | M | Complete (2026-03-08) | - | TASK-07 |
| TASK-06 | IMPLEMENT | Add error.tsx boundaries | 90% | S | Complete (2026-03-08) | - | TASK-07 |
| TASK-07 | CHECKPOINT | CI green-check gate | - | S | Complete (2026-03-08) | TASK-01,TASK-02,TASK-03,TASK-04,TASK-05,TASK-06 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-06 | - | All independent; TASK-02 output feeds TASK-04 |
| 2 | TASK-04, TASK-05 | TASK-02 must be complete before TASK-04 (SafeManagement test mock update) | TASK-05 is independent of TASK-04 |
| 3 | TASK-07 | All IMPLEMENT tasks | Checkpoint — CI verification |

## Tasks

---

### TASK-01: Extract BarOrderItem/BarOrder to BarOrderDomain.ts
- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/reception/src/types/bar/BarOrderDomain.ts`; updated imports in three mutation hook files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Build evidence:** Created `BarOrderDomain.ts` exporting `BarOrderItem` (price: number required) and `BarOrder` with JSDoc distinguishing it from `BarTypes.ts`. Removed local interface definitions from all three mutation files. Added `import type { BarOrder, BarOrderItem }` in `useAddItemToOrder.ts` and `useConfirmOrder.ts`; import only `{ BarOrder }` in `useRemoveItemFromOrder.ts` (BarOrderItem unused there — correct). Typecheck and lint both pass. Committed in `810f729625`.
- **Affects:**
  - `apps/reception/src/types/bar/BarOrderDomain.ts` (new)
  - `apps/reception/src/hooks/orchestrations/bar/actions/mutations/useAddItemToOrder.ts`
  - `apps/reception/src/hooks/orchestrations/bar/actions/mutations/useRemoveItemFromOrder.ts`
  - `apps/reception/src/hooks/orchestrations/bar/actions/mutations/useConfirmOrder.ts`
  - `[readonly] apps/reception/src/types/bar/BarTypes.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 92%
  - Implementation: 95% — All three files read; exact interface definitions confirmed identical. The only subtlety is `price: number` (required) vs `BarTypes.ts:SalesOrderItem.price?: number` (optional) — resolved: keep `price: number` in the new domain type.
  - Approach: 95% — Straightforward extraction; no generics or structural changes needed.
  - Impact: 88% — `useConfirmOrder` already imports `SalesOrder`/`SalesOrderItem` from `BarTypes.ts` for its confirmed-order path; the new `BarOrderDomain.ts` types cover only the in-progress unconfirmed order state reads. No consumer of `useBarOrder` is affected.
- **Acceptance:**
  - `apps/reception/src/types/bar/BarOrderDomain.ts` exists and exports `BarOrderItem` and `BarOrder`
  - `useAddItemToOrder.ts`, `useRemoveItemFromOrder.ts`, `useConfirmOrder.ts` each import `BarOrderItem` and `BarOrder` from `BarOrderDomain.ts` — no local interface definitions remain in these files
  - TypeScript compiles without errors for these files
  - Existing bar mutation tests pass (no logic change)
- **Validation contract:**
  - TC-01: Grep for `interface BarOrderItem` in `hooks/orchestrations/bar/actions/mutations/` returns zero results
  - TC-02: Grep for `interface BarOrder` in `hooks/orchestrations/bar/actions/mutations/` returns zero results
  - TC-03: `pnpm typecheck` passes for reception app
- **Execution plan:**
  1. Create `apps/reception/src/types/bar/BarOrderDomain.ts` with `BarOrderItem` (`price: number` required) and `BarOrder` interfaces
  2. In `useAddItemToOrder.ts`: remove local interface definitions, add import from `BarOrderDomain.ts`
  3. In `useRemoveItemFromOrder.ts`: remove local interface definitions, add import from `BarOrderDomain.ts`
  4. In `useConfirmOrder.ts`: remove local interface definitions, add import from `BarOrderDomain.ts`
  5. Verify `useBarOrder.ts` needs no changes (it doesn't reference the interfaces directly)
- **Planning validation:**
  - Checks run: Read all three source files; confirmed identical interface definitions; confirmed `BarTypes.ts:SalesOrderItem.price` is optional vs required in local copies
  - Validation artifacts: `fact-find.md` Cluster 1 evidence section
  - Unexpected findings: None
- **Scouts:** None: types are simple value interfaces with no runtime behavior
- **Edge Cases & Hardening:** `BarOrder` alias in `BarTypes.ts` (line 142) = `UnconfirmedSalesOrder`; new `BarOrder` in `BarOrderDomain.ts` is a different, more specific type. No naming conflict since the domain file is imported explicitly. Add JSDoc comment noting the distinction.
- **What would make this >=95%:** CI green run confirming zero typecheck errors
- **Rollout / rollback:**
  - Rollout: Single commit; no deploy required (internal type only)
  - Rollback: `git revert` — no data or API impact
- **Documentation impact:** None: internal type file
- **Notes / references:** `useConfirmOrder.ts` already imports `SalesOrder`/`SalesOrderItem` from `BarTypes.ts` — those imports are unaffected by this task

---

### TASK-02: Remove thin till wrapper hooks and update SafeManagement
- **Type:** IMPLEMENT
- **Deliverable:** Deleted files: `useTillShiftState.ts`, `useTillTransactions.ts`, `useTillShiftActions.ts` and their three test files; updated `SafeManagement.tsx` to call `useTillShiftContext()` directly
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Build evidence:** Deleted all 6 files. Updated `SafeManagement.tsx` to import `useTillShiftContext` from `TillShiftProvider` directly and destructure `{ returnKeycardsToSafe }` from it. Updated `SafeManagement.test.tsx` mock to target `useTillShiftContext` (was `useTillShiftActions`). Typecheck and lint pass. Committed in `810f729625`.
- **Affects:**
  - `apps/reception/src/hooks/client/till/useTillShiftState.ts` (delete)
  - `apps/reception/src/hooks/client/till/useTillTransactions.ts` (delete)
  - `apps/reception/src/hooks/client/till/useTillShiftActions.ts` (delete)
  - `apps/reception/src/hooks/client/till/__tests__/useTillShiftState.test.tsx` (delete)
  - `apps/reception/src/hooks/client/till/__tests__/useTillTransactions.test.tsx` (delete)
  - `apps/reception/src/hooks/client/till/__tests__/useTillShiftActions.test.tsx` (delete)
  - `apps/reception/src/components/safe/SafeManagement.tsx` (update import)
  - `apps/reception/src/components/safe/__tests__/SafeManagement.test.tsx` (update mock)
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 92% — All files read. `SafeManagement` IS inside `TillShiftProvider` (confirmed via `safe-management/page.tsx`). The three wrappers have no other production consumers. The test mock for `useTillShiftActions` (line 28-30) must be updated to mock `useTillShiftContext` from `TillShiftProvider`.
  - Approach: 90% — Delete files, update one import in `SafeManagement.tsx`, update one mock in the test file.
  - Impact: 88% — Removing 6 files. Vacuous tests deleted. No business logic change.
- **Acceptance:**
  - `useTillShiftState.ts`, `useTillTransactions.ts`, `useTillShiftActions.ts` no longer exist
  - Their three test files no longer exist
  - `SafeManagement.tsx` imports `useTillShiftContext` from `./hooks/client/till/TillShiftProvider` (or equivalent path) instead of `useTillShiftActions`
  - `SafeManagement.test.tsx` mocks `useTillShiftContext` correctly (providing `returnKeycardsToSafe` and other needed fields)
  - All SafeManagement tests pass
  - Grep for `useTillShiftState\|useTillTransactions\|useTillShiftActions` returns zero results outside of this plan doc
- **Validation contract:**
  - TC-01: `git ls-files apps/reception/src/hooks/client/till/useTillShiftState.ts` returns empty
  - TC-02: `git ls-files apps/reception/src/hooks/client/till/useTillTransactions.ts` returns empty
  - TC-03: `git ls-files apps/reception/src/hooks/client/till/useTillShiftActions.ts` returns empty
  - TC-04: SafeManagement test suite (13 tests) all pass in CI
- **Execution plan:**
  1. In `SafeManagement.tsx`: replace `import { useTillShiftActions } from "../../hooks/client/till/useTillShiftActions"` with `import { useTillShiftContext } from "../../hooks/client/till/TillShiftProvider"`; replace `useTillShiftActions()` call with `useTillShiftContext()`; update destructure to use `{ returnKeycardsToSafe }` directly from context
  2. In `SafeManagement.test.tsx`: remove mock for `useTillShiftActions`; add mock for `useTillShiftContext` from `TillShiftProvider` providing `returnKeycardsToSafe: jest.fn(() => true)` and any other fields SafeManagement needs from context
  3. Delete `useTillShiftState.ts`, `useTillTransactions.ts`, `useTillShiftActions.ts`
  4. Delete their three test files
- **Planning validation:**
  - Checks run: Read `safe-management/page.tsx` — confirmed `TillShiftProvider` wraps `SafeManagement`. Read `SafeManagement.test.tsx` lines 28-30 — confirmed mock structure. Read `SafeManagement.tsx` line 54 — confirmed single `useTillShiftActions` usage.
  - Validation artifacts: `fact-find.md` Cluster 2 section; `safe-management/page.tsx` content
  - Unexpected findings: `SafeManagement` IS inside `TillShiftProvider` (contradicted initial assumption in fact-find; resolved during planning)

**Consumer tracing for modified behavior:**
- `SafeManagement.tsx` currently imports `useTillShiftActions` → after change imports `useTillShiftContext`. The context shape is unchanged; only the import path changes. All other fields in `SafeManagement` come from `useSafeData()`, `useAuth()`, etc. — unaffected.
- `SafeManagement.test.tsx` mock at line 28-30 currently mocks `useTillShiftActions` module. After deletion, this mock must target `useTillShiftContext` from `TillShiftProvider`. The mock value shape stays the same (`{ returnKeycardsToSafe }` is a subset of the full context).

- **Scouts:** Verify no barrel re-export of the three wrapper hooks (e.g., no `index.ts` in `hooks/client/till/` that re-exports them). If found, remove the re-export too.
- **Edge Cases & Hardening:** Check that `TillShiftContext` throws correctly when used outside the provider — this is already handled in `TillShiftProvider.tsx` line 22 (`throw new Error(...)`). Since `SafeManagement` is inside the provider, this is safe.
- **What would make this >=95%:** CI green confirming no broken imports
- **Rollout / rollback:**
  - Rollout: Single commit; no deploy required
  - Rollback: `git revert`
- **Documentation impact:** None
- **Notes / references:** The test mock update is the most likely source of CI failure — mock must provide all fields `SafeManagement` uses from context, not just `returnKeycardsToSafe`

---

### TASK-03: Extract RadioOption generic component
- **Type:** IMPLEMENT
- **Deliverable:** New `apps/reception/src/components/common/RadioOption.tsx`; updated `DocumentTypeSelector.tsx` and `PaymentMethodSelector.tsx` to use it
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Build evidence:** Created `RadioOption<T extends string>` using `memo()` with props: `label`, `value`, `icon`, `iconClass?`, `currentValue`, `onChange`, `name`, `activeClassName?` (defaults to `"bg-surface-3"`). Both selector files updated to use `<RadioOption<DocumentType>>` and `<RadioOption<KeycardPayType>>` respectively. Local sub-components removed. Typecheck and lint pass. Committed in `810f729625`.
- **Affects:**
  - `apps/reception/src/components/common/RadioOption.tsx` (new)
  - `apps/reception/src/components/checkins/keycardButton/DocumentTypeSelector.tsx`
  - `apps/reception/src/components/checkins/keycardButton/PaymentMethodSelector.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 90% — Both sub-components read in full. Pattern is identical: `Input type="radio" sr-only`, label wrapper with active class, Lucide icon. Only difference is value type (generic) and optional `iconClass`. Generic component is straightforward.
  - Approach: 88% — `RadioOption<T extends string>` with props: `label`, `value: T`, `icon: LucideIcon`, `iconClass?: string`, `currentValue: T`, `onChange: () => void`, `name: string`. The `name` prop currently differs between the two uses (`docType` vs `payType`) so must be parameterized.
  - Impact: 88% — No logic change; pure structural consolidation. Neither component has tests, so no test updates needed.
- **Acceptance:**
  - `apps/reception/src/components/common/RadioOption.tsx` exports a `memo`-wrapped generic `RadioOption<T extends string>` component
  - `DocumentTypeSelector.tsx` uses `RadioOption<DocumentType>` — local `DocRadioButton` sub-component removed
  - `PaymentMethodSelector.tsx` uses `RadioOption<KeycardPayType>` — local `RadioButton` sub-component removed
  - Visual output is unchanged (same classes, same active state logic)
  - TypeScript compiles without errors
- **Validation contract:**
  - TC-01: Grep for `DocRadioButton` in `DocumentTypeSelector.tsx` returns zero results after change
  - TC-02: Grep for `const RadioButton` in `PaymentMethodSelector.tsx` returns zero results after change
  - TC-03: `pnpm typecheck` passes
  - TC-04: Expected user-observable behavior — no visual change for the keycard deposit UI
- **Execution plan:**
  1. Create `RadioOption.tsx` with generic `<T extends string>` interface, `Input compatibilityMode="no-wrapper"` pattern, `sr-only` class, active state via `bg-surface-3 font-semibold` (superset of both current active classes), `memo` wrapper
  2. Note: `DocRadioButton` uses `bg-surface-3` while `RadioButton` uses `bg-surface-3 font-semibold` — use `activeClassName?: string` prop to allow per-use customization, defaulting to `"bg-surface-3"`
  3. Update `DocumentTypeSelector.tsx`: import `RadioOption`, replace three `<DocRadioButton>` uses with `<RadioOption<DocumentType>>`, remove local sub-component
  4. Update `PaymentMethodSelector.tsx`: import `RadioOption`, replace three `<RadioButton>` uses with `<RadioOption<KeycardPayType>>` with `activeClassName="bg-surface-3 font-semibold"`, remove local sub-component
- **Planning validation:**
  - Checks run: Read both source files in full; compared interface shapes and class strings
  - Validation artifacts: `fact-find.md` Cluster 3 section
  - Unexpected findings: `DocRadioButton` omits `font-semibold` from its active state; `RadioButton` includes it — handle via `activeClassName` prop
- **Scouts:** Check `components/common/` for any existing RadioButton-like component that might conflict with naming
- **Edge Cases & Hardening:** `name` prop for the radio group must be parameterized (currently `"docType"` and `"payType"` — these differ and must be passed as a prop, not hardcoded)
- **What would make this >=95%:** Visual regression check confirming no UI change; currently not run
- **Rollout / rollback:**
  - Rollout: Single commit
  - Rollback: `git revert`
- **Documentation impact:** None
- **Notes / references:** `PaymentMethodSelector` layout uses `flex justify-around` (horizontal radio group) while `DocumentTypeSelector` uses `flex flex-col` (vertical) — this layout difference is in the parent fieldset, not the `RadioOption` sub-component, so extraction is clean

---

### TASK-04: SafeManagement modal state discriminated union
- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/components/safe/SafeManagement.tsx` updated to use `type SafeModal` discriminated union; `apps/reception/src/components/safe/__tests__/SafeManagement.test.tsx` confirmed passing
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Build evidence:** Added `type SafeModal = 'deposit' | 'withdrawal' | 'exchange' | 'bankDeposit' | 'pettyCash' | 'reconcile' | 'open' | 'reset' | 'return' | null`. Replaced all 9 `useState<boolean>` lines (lines 56-64) with single `useState<SafeModal>(null)`. All button `onClick` handlers updated to `setActiveModal('x')`; all close paths updated to `setActiveModal(null)`; all JSX conditionals use `activeModal === 'x'`. Grep confirms zero show* vars remain. TypeScript and lint pass. Committed in `ffb88b659b`.
- **Affects:**
  - `apps/reception/src/components/safe/SafeManagement.tsx`
  - `apps/reception/src/components/safe/__tests__/SafeManagement.test.tsx` (review only — likely no changes needed as tests are behavior-driven, not state-introspecting)
- **Depends on:** TASK-02
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 88% — `SafeManagement.tsx` read in full (593 lines). All 9 boolean flags identified at lines 56-64. All state-setting call sites identified in handlers. The test file (941 lines) relies entirely on rendered output (button labels, form text) — it does NOT assert on internal state variables. Therefore the test file needs no changes beyond what TASK-02 already applied to the mock.
  - Approach: 87% — Replace 9 booleans with one `useState<SafeModal>(null)` + update all `setShow*` calls to `setActiveModal('...')` / `setActiveModal(null)` + update all JSX conditionals from `{showX && <Form...>}` to `{activeModal === 'x' && <Form...>}`.
  - Impact: 82% — Logic-equivalent refactor; 9 boolean handlers each close at `setActiveModal(null)` instead of their own setter. Only-one-modal-at-a-time invariant is now enforced structurally rather than by convention.
- **Acceptance:**
  - `SafeManagement.tsx` contains `type SafeModal = 'deposit' | 'withdrawal' | 'exchange' | 'bankDeposit' | 'pettyCash' | 'reconcile' | 'open' | 'reset' | 'return' | null`
  - `SafeManagement.tsx` contains exactly one `useState<SafeModal>(null)` for modal state (not nine separate booleans)
  - All 9 `show*` boolean state declarations removed
  - All JSX conditionals updated to `activeModal === 'x'` pattern
  - All handler close calls replaced with `setActiveModal(null)`
  - All SafeManagement tests pass in CI (13 tests — behavior-driven, no state assertions)
  - Expected user-observable behavior: no change — modal show/hide behavior is identical
- **Validation contract:**
  - TC-01: Grep for `showDeposit\|showWithdrawal\|showExchange\|showBankDeposit\|showPettyCash\|showReconcile\|showOpen\|showReset\|showReturn` in `SafeManagement.tsx` returns zero results
  - TC-02: Grep for `useState<SafeModal>` in `SafeManagement.tsx` returns exactly 1 result
  - TC-03: All 13 SafeManagement tests pass in CI
  - TC-04: `pnpm typecheck` passes
- **Execution plan:**
  1. Add `type SafeModal = 'deposit' | 'withdrawal' | 'exchange' | 'bankDeposit' | 'pettyCash' | 'reconcile' | 'open' | 'reset' | 'return' | null` before the component
  2. Replace lines 56-64 (nine `useState<boolean>` declarations) with `const [activeModal, setActiveModal] = useState<SafeModal>(null)`
  3. Update all button `onClick` handlers: `setShowX(true)` → `setActiveModal('x')`
  4. In each `handle*` success block: `setShowX(false)` → `setActiveModal(null)`
  5. In each `onCancel` prop: `() => setShowX(false)` → `() => setActiveModal(null)`
  6. Update JSX conditionals: `{showX && <Form...>}` → `{activeModal === 'x' && <Form...>}`
  7. Run TypeScript check to confirm clean compilation
- **Planning validation:**
  - Checks run: Read `SafeManagement.tsx` lines 56-64 (all 9 flags confirmed); read all handler functions; read JSX conditional expressions; read full `SafeManagement.test.tsx` (941 lines) — confirmed tests are behavior-driven, not state-introspecting
  - Validation artifacts: SafeManagement source + test file read
  - Unexpected findings: Test file mocks `useTillShiftActions` — TASK-02 handles this. Test file does not reference internal state variables. No test changes needed in TASK-04 beyond what TASK-02 provides.

**Consumer tracing:**
- The 9 `show*` booleans are consumed only within `SafeManagement.tsx` itself (JSX conditionals and handler close calls). No other component reads them. Extraction is fully self-contained.
- The `expandedRows` state (table row expansion) is separate — do not touch it.

- **Scouts:** Verify no `show*` state is passed as a prop to any child component (confirmed: all child components receive only `onConfirm`/`onCancel` callbacks and data props — not the boolean flags themselves)
- **Edge Cases & Hardening:** The discriminated union enforces mutual exclusivity structurally — only one modal can be active at a time. Previous code allowed (in theory, never in practice) multiple modals open simultaneously. New code makes that impossible.
- **What would make this >=90%:** CI green run confirming all 13 tests pass
- **Rollout / rollback:**
  - Rollout: Single commit; no deploy required
  - Rollback: `git revert`
- **Documentation impact:** None
- **Notes / references:** `expandedRows: number[]` state at line 65 is unrelated to modal state — leave as-is

---

### TASK-05: Extract useDropdownMenu hook from KeycardDepositButton
- **Type:** IMPLEMENT
- **Deliverable:** New `apps/reception/src/hooks/client/keycardButton/useDropdownMenu.ts`; updated `apps/reception/src/components/checkins/keycardButton/KeycardDepositButton.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Build evidence:** Created `useDropdownMenu.ts` at `hooks/client/keycardButton/`. Hook encapsulates: `menuOpen`, `menuVisible`, `menuPosition`, `buttonRef`, `timeoutsRef`, `setTrackedTimeout`, cleanup effect, fade effect, `handleMenuToggle`, `closeMenu`. Returns `{ menuOpen, menuVisible, menuPosition, buttonRef, handleMenuToggle, closeMenu, setTrackedTimeout }`. `KeycardDepositButton.tsx` now calls `useDropdownMenu({ isDisabled })` and destructures the return. `handleConfirm` calls `closeMenu()` in its finally block. `confirmButtonRef` remains in component (not menu state). TypeScript and lint pass. Committed in `ffb88b659b`.
- **Affects:**
  - `apps/reception/src/hooks/client/keycardButton/useDropdownMenu.ts` (new)
  - `apps/reception/src/components/checkins/keycardButton/KeycardDepositButton.tsx`
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 87% — `KeycardDepositButton.tsx` read in full (399 lines). State cluster identified: `menuOpen` (line 81), `menuVisible` (line 82), `menuPosition` (lines 83-86), `buttonRef` (line 88), `timeoutsRef` (line 93), `setTrackedTimeout` callback (lines 94-104), cleanup effect (lines 106-110), fade-in/out effect (lines 165-176), `handleMenuToggle` (lines 207-226). Also `confirmButtonRef` (line 90) — this ref is not part of the menu state; leave in component.
  - Approach: 87% — Extract: `menuOpen`, `menuVisible`, `menuPosition`, `buttonRef`, `timeoutsRef`, `setTrackedTimeout`, cleanup effect, fade-out effect, `handleMenuToggle`, `closeMenu` function. Return API: `{ menuOpen, menuVisible, menuPosition, buttonRef, handleMenuToggle, closeMenu }`. The hook receives `isDisabled: boolean` as input (needed for `handleMenuToggle` guard).
  - Impact: 83% — No tests exist for `KeycardDepositButton` — extraction is unverified by test. Pure structural change; no logic change.
- **Acceptance:**
  - `apps/reception/src/hooks/client/keycardButton/useDropdownMenu.ts` exists and exports `useDropdownMenu`
  - `KeycardDepositButton.tsx` uses `useDropdownMenu({ isDisabled })` and destructures `{ menuOpen, menuVisible, menuPosition, buttonRef, handleMenuToggle, closeMenu }` from it
  - `KeycardDepositButton.tsx` no longer defines `menuOpen`, `menuVisible`, `menuPosition`, `buttonRef`, `timeoutsRef`, or `setTrackedTimeout` locally
  - `confirmButtonRef` remains in `KeycardDepositButton.tsx` (not menu state)
  - TypeScript compiles without errors
  - Expected user-observable behavior: no change — keycard deposit button behavior is identical
- **Validation contract:**
  - TC-01: Grep for `const \[menuOpen` in `KeycardDepositButton.tsx` returns zero results
  - TC-02: Grep for `const \[menuVisible` in `KeycardDepositButton.tsx` returns zero results
  - TC-03: Grep for `setTrackedTimeout` in `KeycardDepositButton.tsx` returns zero results (it lives in the hook)
  - TC-04: `pnpm typecheck` passes
- **Execution plan:**
  1. Create `apps/reception/src/hooks/client/keycardButton/` directory
  2. Create `useDropdownMenu.ts` with signature `useDropdownMenu({ isDisabled }: { isDisabled: boolean })`: move state declarations, refs, `setTrackedTimeout` callback, cleanup effect, fade-out effect, `handleMenuToggle`, and a `closeMenu` function that does `setMenuOpen(false); setTrackedTimeout(() => setMenuPosition(null), 200)`
  3. The hook calls `showToast` for the disabled warning — import `showToast` in the hook
  4. Return `{ menuOpen, menuVisible, menuPosition, buttonRef, handleMenuToggle, closeMenu }` as const
  5. In `KeycardDepositButton.tsx`: add import, call `useDropdownMenu({ isDisabled })`, destructure return, remove moved declarations. Update `handleConfirm` to call `closeMenu()` at the end (replacing the inline `setMenuOpen(false); setTrackedTimeout(...)` calls).
- **Planning validation:**
  - Checks run: Read `KeycardDepositButton.tsx` lines 80-230 in detail; traced all state usages; confirmed `confirmButtonRef` (line 90) is a separate concern from menu state; confirmed `handleConfirm` calls `setMenuOpen(false)` and `setTrackedTimeout(() => setMenuPosition(null), 200)` in the finally block (line 311-312) — replace with `closeMenu()`.
  - Validation artifacts: `fact-find.md` Cluster 6 section; full file read
  - Unexpected findings: `timeoutsRef` is shared between the menu animation and `handleConfirm` (the confirm handler uses `setTrackedTimeout` to add an 800ms delay). Moving `setTrackedTimeout` to the hook means `handleConfirm` must call `closeMenu()` from the hook (not `setTrackedTimeout` directly). The confirm handler's 800ms delay (`await new Promise(resolve => setTrackedTimeout(resolve, 800))`) is for submit guard timing — this also uses `setTrackedTimeout`. Either keep `setTrackedTimeout` accessible via the hook return, or move the submit delay to use plain `setTimeout`. Chosen: expose `setTrackedTimeout` in the hook return as well, so `handleConfirm` can still use it for its 800ms submit delay.

**Revised hook return API:** `{ menuOpen, menuVisible, menuPosition, buttonRef, handleMenuToggle, closeMenu, setTrackedTimeout }`

**Consumer tracing:**
- `menuOpen` used in: JSX conditional (line 374), `handleMenuToggle` logic, effect dependency
- `menuVisible` used in: JSX conditional (line 374)
- `menuPosition` used in: JSX conditional + passed as prop to `KeycardDepositMenu`
- `buttonRef` used in: passed to `<Button ref={buttonRef}>` (line 338) and in `handleMenuToggle`
- `handleMenuToggle` used in: `onClick` prop (line 339)
- `closeMenu` used in: `closeMenu` prop to `KeycardDepositMenu` (line 389), `handleConfirm` finally block
- `setTrackedTimeout` used in: `handleConfirm` 800ms delay (line 239)

All consumers addressed in execution plan above.

- **Scouts:** Check whether any other component imports from `KeycardDepositButton.tsx` — unlikely but verify
- **Edge Cases & Hardening:** Cleanup effect in hook must fire on unmount (already handled by the existing `useEffect` pattern)
- **What would make this >=90%:** A minimal unit test for `useDropdownMenu` covering open/close and position logic
- **Rollout / rollback:**
  - Rollout: Single commit
  - Rollback: `git revert`
- **Documentation impact:** None
- **Notes / references:** `KeycardDepositMenu.tsx` receives `menuOpen`, `menuPosition`, and `closeMenu` as props — these props don't change names, only their source moves from inline state to hook return

---

### TASK-06: Add error.tsx boundaries to reception app segments
- **Type:** IMPLEMENT
- **Deliverable:** New `apps/reception/src/app/error.tsx` (root); new `apps/reception/src/app/till-reconciliation/error.tsx`; new `apps/reception/src/app/safe-management/error.tsx`; new `apps/reception/src/app/bar/error.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Build evidence:** Created all 4 `error.tsx` files. Each has `"use client"` on line 1, correct `{ error: Error & { digest?: string }; reset: () => void }` props type, segment-specific messaging, and a "Try again" button calling `reset()`. Committed in `810f729625`.
- **Affects:**
  - `apps/reception/src/app/error.tsx` (new)
  - `apps/reception/src/app/till-reconciliation/error.tsx` (new)
  - `apps/reception/src/app/safe-management/error.tsx` (new)
  - `apps/reception/src/app/bar/error.tsx` (new)
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 90%
  - Implementation: 93% — Pattern is well-defined (Next.js App Router `error.tsx` must be `"use client"`, receives `error: Error & { digest?: string }` and `reset: () => void`).
  - Approach: 90% — Root `error.tsx` catches all unhandled runtime errors across all segments. Segment-level files provide the same fallback for the three highest-risk segments (financial operations). All four files share the same simple implementation.
  - Impact: 88% — Additive only; no changes to existing code. Will surface previously-silent runtime errors.
- **Acceptance:**
  - `apps/reception/src/app/error.tsx` exists, is `"use client"`, accepts `error: Error & { digest?: string }` and `reset: () => void` props, renders a user-friendly error message with a retry button
  - `apps/reception/src/app/till-reconciliation/error.tsx` exists with the same pattern
  - `apps/reception/src/app/safe-management/error.tsx` exists with the same pattern
  - `apps/reception/src/app/bar/error.tsx` exists with the same pattern
  - Expected user-observable behavior: when an uncaught runtime error occurs in any segment, the user sees a recovery UI with a "Try again" button rather than a blank page or unhandled rejection
- **Validation contract:**
  - TC-01: `find apps/reception/src/app -name "error.tsx"` returns 4 files
  - TC-02: All four files contain `"use client"` directive on line 1
  - TC-03: `pnpm typecheck` passes
- **Execution plan:**
  1. Create `apps/reception/src/app/error.tsx` — `"use client"` component accepting `{ error, reset }` props; renders a styled error card with message and "Try again" button calling `reset()`; use existing `PageShell` or minimal inline styling consistent with reception design tokens
  2. Create identical files at `till-reconciliation/error.tsx`, `safe-management/error.tsx`, `bar/error.tsx` — segment-level files can be identical to root or include segment-specific messaging
- **Planning validation:**
  - Checks run: Confirmed zero existing `error.tsx` files via `find` command; read `layout.tsx` to verify no existing error provider
  - Validation artifacts: `fact-find.md` Cluster 7 section
  - Unexpected findings: None
- **Scouts:** Confirm `apps/reception/src/app/not-found.tsx` exists — if so, the `error.tsx` pattern is consistent (already have one special route handler)
- **Edge Cases & Hardening:** Root `error.tsx` does NOT catch errors in the root layout itself — only per-segment errors. This is acceptable for this scope.
- **What would make this >=95%:** Manual browser test confirming recovery UI displays on thrown error
- **Rollout / rollback:**
  - Rollout: Single commit; additive files only
  - Rollback: `git revert` (error boundaries are additive — removal has no impact on normal paths)
- **Documentation impact:** None
- **Notes / references:** Next.js App Router error boundaries reset state on `reset()` — this is the expected behavior

---

### TASK-07: CI green-check checkpoint
- **Type:** CHECKPOINT
- **Status:** Complete (2026-03-08)
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06
- **Blocks:** -
- **Questions to assess at checkpoint:**
  - Are all CI checks green (typecheck, lint, tests)?
  - Do any grep validation contracts from TASK-01 through TASK-06 fail?
  - Are there any unexpected TypeScript errors from cross-task interactions?
- **Acceptance criteria to pass checkpoint:**
  - CI run green on all checks
  - Grep for `interface BarOrderItem` in mutation files: zero results
  - Grep for `useTillShiftState\|useTillTransactions\|useTillShiftActions` in source: zero results
  - Grep for `showDeposit\|showWithdrawal\|showExchange` etc. in `SafeManagement.tsx`: zero results
  - 4 `error.tsx` files exist in app directory
- **If checkpoint fails:**
  - Invoke `/lp-do-replan reception-simplify-backlog` to triage and replan affected tasks
- **Notes:** If CI is green, mark all tasks Complete. No replan needed.

---

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `SafeManagement.test.tsx` mock for `useTillShiftActions` not updated correctly in TASK-02 | Medium | Medium | Read test mock structure carefully; mock `useTillShiftContext` providing all fields SafeManagement needs from context (not just `returnKeycardsToSafe`) |
| `useDropdownMenu` `setTrackedTimeout` exposure creates coupling | Low | Low | `setTrackedTimeout` is returned from hook but its internal `timeoutsRef` is encapsulated — coupling is acceptable given the extraction boundary |
| TypeScript error from `BarOrderDomain.ts` `price` type mismatch at `useConfirmOrder.ts` call sites | Low | Medium | `useConfirmOrder` maps local `BarOrderItem` (required `price`) to `SalesOrderItem` (optional `price`) — direction is safe (required → optional widening at write sites) |
| Root `error.tsx` causes hydration mismatch | Low | Low | `"use client"` directive is mandatory and prevents hydration mismatch |

## Observability
- Logging: None: refactoring only; no new log statements
- Metrics: None: no new instrumentation
- Alerts/Dashboards: None: error boundaries will surface errors to existing error tracking (if Sentry is configured) — positive side effect

## Acceptance Criteria (overall)
- [ ] `apps/reception/src/types/bar/BarOrderDomain.ts` exists; zero local `BarOrderItem`/`BarOrder` definitions in mutation files
- [ ] `useTillShiftState.ts`, `useTillTransactions.ts`, `useTillShiftActions.ts` deleted; `SafeManagement.tsx` calls `useTillShiftContext()` directly
- [ ] `components/common/RadioOption.tsx` exists; used by both selector components
- [ ] `SafeManagement.tsx` uses `useState<SafeModal>(null)` — zero `show*` boolean flags
- [ ] `useDropdownMenu.ts` exists; `KeycardDepositButton.tsx` uses it
- [ ] 4 `error.tsx` files exist in app directory (root + 3 segments)
- [ ] All existing tests pass in CI
- [ ] `pnpm typecheck && pnpm lint` pass

## Decision Log
- 2026-03-08: Chose to remove all three thin wrapper hooks (including `useTillShiftActions`) after confirming `SafeManagement` is wrapped by `TillShiftProvider` in `apps/reception/src/app/safe-management/page.tsx` — initial fact-find had flagged this as unverified risk; planning phase resolved it.
- 2026-03-08: Chose single-session build (Option B) over per-cluster PRs (Option A) — all clusters are file-level independent; single session reduces overhead.
- 2026-03-08: Chose to expose `setTrackedTimeout` from `useDropdownMenu` hook (rather than moving submit delay logic) to avoid changing `handleConfirm` business logic during what is intended as a pure structural extraction.
- 2026-03-08: Confirmed TASK-04 (`SafeManagement` test) requires no additional test changes beyond TASK-02's mock update — all 13 tests are behavior-driven.

## Overall-confidence Calculation
- TASK-01: 92% × S(1) = 92
- TASK-02: 90% × S(1) = 90
- TASK-03: 88% × S(1) = 88
- TASK-04: 85% × M(2) = 170
- TASK-05: 85% × M(2) = 170
- TASK-06: 90% × S(1) = 90
- Sum weights: 1+1+1+2+2+1 = 8
- Overall = (92+90+88+170+170+90) / 8 = 700 / 8 = **87.5% → 87%**

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extract BarOrderDomain.ts | Yes — source files confirmed; `types/bar/` directory exists | None | No |
| TASK-02: Remove thin wrappers | Yes — `TillShiftProvider` wrapping confirmed; all consumers identified | Minor: test mock update required (mock `useTillShiftContext` instead of `useTillShiftActions`) — documented in execution plan | No |
| TASK-03: Extract RadioOption | Yes — both source files read; `components/common/` directory exists | Minor: `activeClassName` prop needed to handle divergent active state classes — documented in execution plan | No |
| TASK-04: SafeManagement discriminated union | Partial — depends on TASK-02 completing first (mock update). TASK-02 is in Wave 1, TASK-04 in Wave 2 — ordering is correct | None | No |
| TASK-05: Extract useDropdownMenu | Yes — `KeycardDepositButton.tsx` read in full; extraction boundary clear | Moderate: `setTrackedTimeout` must be exposed in hook return to avoid changing `handleConfirm` submit delay logic — documented and resolved in execution plan | No |
| TASK-06: Add error.tsx boundaries | Yes — zero existing error.tsx files confirmed; Next.js pattern well-understood | None | No |
| TASK-07: CI checkpoint | Yes — all prior tasks have validation contracts; checkpoint gates defined | None | No |

No Critical findings. All Major/Moderate findings are resolved in task execution plans.
