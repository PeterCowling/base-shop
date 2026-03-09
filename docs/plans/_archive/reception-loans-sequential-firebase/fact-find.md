---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Data
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: reception-loans-sequential-firebase
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-loans-sequential-firebase/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309113000-0003
---

# Reception Loans — Sequential Firebase Reads/Writes Fact-Find Brief

## Scope

### Summary

`useLoansMutations.ts` chains multiple sequential Firebase operations per loan action. The critical path is `removeLoanItem`: it performs `get()` (read deposit amount), `remove()` (delete txn), conditionally `logActivity()` (write), conditionally `addToAllTransactions()` (read-then-write), then `removeOccupantIfEmpty()` (read-then-conditionally-remove). For bulk checkout with 10 keycard loans, this serialises approximately 40 round-trips. Firebase multi-path atomic `update()` — already used elsewhere in the codebase (e.g. `useActivitiesMutations`) — can collapse the write operations into 1-2 round-trips, and the pre-read for `removeLoanItem` can be eliminated by passing in the already-known deposit amount from context.

### Goals

1. Eliminate the `get()` pre-read in `removeLoanItem` by sourcing the deposit amount from the already-subscribed `LoanDataContext` state.
2. Collapse multi-step remove sequences in `removeOccupantIfEmpty` and `removeLoanTransactionsForItem` into single multi-path `update()` calls using Firebase's atomic null-write approach (setting a path to `null` deletes it).
3. Reduce the avoidable Firebase round-trips within `useLoansMutations` itself. For 10 keycard removals, the hook currently issues: 1 `get()` (deposit pre-read) + 1 `remove()` (txn delete) + 1 `removeOccupantIfEmpty get()` + 1 conditional `remove()` = ~4 hook-level ops per item = ~40 hook-level ops total. After the refactor, the hook issues 1 `update()` per item (txn null-write + optional occupant null-write in the same call) = ~10 hook-level ops. Note: each item still also triggers `logActivity()` (~1 op) + `addToAllTransactions()` (~2 ops including its read guard), and `Checkout.tsx` issues its own `addToAllTransactions()` before the hook call (~2 ops). These are outside the hook's scope and unchanged. The total end-to-end ops per item drops from ~8-9 to ~5-6, for a 35-40% reduction in Firebase operations at bulk checkout.
4. Maintain offline queue compatibility — `saveLoan` already uses `queueOfflineWrite`; removal operations are already online-only gated.

### Non-goals

- Re-architecture of `LoanDataContext` or the subscription model.
- Changes to `useActivitiesMutations` (already uses multi-path atomic updates).
- Changes to `useAllTransactions` (has its own idempotency guard that requires a read first — kept as-is).
- Changing `updateLoanDepositType`'s read pattern (the `get()` there is needed to compute `newDeposit = 10 * txn.count`; unless `count` is passed in, this read cannot be eliminated — leave for a follow-on if needed).
- Changing `convertKeycardDocToCash` (chains `update()` + `addToAllTransactions()` + `logActivity()` — none of these ops contain pre-reads eliminable by context data; all three are semantically required).

### Constraints & Assumptions

- Constraints:
  - Firebase Realtime Database multi-path `update()` limits: a single update object can contain up to 1000 path entries (well within scope here).
  - `removeOccupantIfEmpty` logic requires knowing whether the occupant node is empty after removal. With a multi-path approach, we can pass `null` for both the txn and the occupant node in one call when the caller already knows the occupant has no remaining loans (context-driven).
  - `LoanDataContext` already maintains a full optimistic local state clone — the deposit amount and loan items are available without a Firebase read.
  - Offline writes: removal operations already gate with `if (!online) return error` — no change needed.
- Assumptions:
  - The `LoanDataContext` state is the source of truth for which txns exist per occupant at the time of removal — callers can pass the deposit/count directly rather than having `removeLoanItem` re-read from Firebase.
  - The occupant-emptiness check after removal can use the optimistic post-removal count computed from context state (avoiding the second `get()` call entirely).

## Outcome Contract

- **Why:** Sequential Firebase round-trips add latency to checkout operations and increase the window for partial-failure states in bulk checkout flows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Loan removal uses Firebase multi-path atomic updates where possible. The avoidable hook-level round-trips in `useLoansMutations` are eliminated: bulk checkout (10 keycard loans) completes with ~10 hook-level Firebase ops rather than ~40, a 75% reduction in the ops this hook alone controls. End-to-end Firebase operations per item drop from ~8-9 to ~5-6 (35-40% total reduction; the remaining ops are in `addToAllTransactions` and `logActivity` which are out of scope).
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/checkout/Checkout.tsx:149` — `handleRemoveLoanItem` — calls `addToAllTransactions` (fire-and-forget) then `removeLoanItem` from `LoanDataContext`; this is the bulk-checkout entry point. Called once per loan icon click in `CheckoutTable`.
- `apps/reception/src/components/loans/LoansContainer.tsx:118` — `handleReturnLoanTransaction` — calls `addActivity`, `addToAllTransactions`, `saveLoan`, then `removeLoanTransactionsForItem`; the Loans page entry point.

### Key Modules / Files

- `apps/reception/src/hooks/mutations/useLoansMutations.ts` — the target hook; contains all five mutation functions.
- `apps/reception/src/context/LoanDataContext.tsx` — wraps `useLoansMutations`; exposes context mutations + optimistic local state (`loansState`). Callers reach the hook via context.
- `apps/reception/src/components/checkout/Checkout.tsx` — primary bulk-removal caller.
- `apps/reception/src/components/loans/LoansContainer.tsx` — secondary single-return caller; also does a separate `get()` for occupant keycard count (`getOccupantKeycardCount`) that is a standalone read.
- `apps/reception/src/hooks/mutations/useAllTransactionsMutations.ts` — dependency of `removeLoanItem`; contains its own pre-read guard for idempotency; cannot be eliminated.
- `apps/reception/src/hooks/mutations/useActivitiesMutations.ts` — already uses multi-path atomic `update(ref(database), updates)` pattern; serves as the reference pattern for the refactor.
- `apps/reception/src/hooks/mutations/__tests__/useLoansMutations.test.ts` — existing unit test coverage; will need extension.
- `apps/reception/src/schemas/loansSchema.ts` — types (`LoanTransaction`, `LoanMethod`, etc.) — no changes needed.

### Patterns & Conventions Observed

- **Multi-path atomic write pattern** (already in codebase): `const updates: Record<string, unknown | null> = {}; updates['path/to/node'] = value; await update(ref(database), updates)`. Setting a path to `null` is the Firebase null-write delete. Used in `useActivitiesMutations.addActivity` (write), `removeLastActivity` (delete via null-write). `useLoansMutations` should adopt this pattern.
- **Optimistic state cloning**: `LoanDataContext` already mirrors the Firebase subscription in `loansState` and updates it synchronously on successful mutations. The local clone contains all transaction data needed to avoid pre-reads.
- **Online-only gating**: All removal mutations short-circuit with an error and `Promise.resolve(null)` when `!online`. No offline queue path for removals (by design).
- **No try/catch in `useLoansMutations`**: comment in hook states "No try/catch blocks. We rely on `.then(...).catch(...)`". The async function `removeLoanTransactionsForItem` already uses try/catch; this is fine to continue.

### Data & Contracts

- Types/schemas/events:
  - `LoanTransaction` = `{ count, createdAt, depositType, deposit, item, type }` — all fields available in `loansState`.
  - `LoanMethod` = `"CASH" | "PASSPORT" | "LICENSE" | "ID" | "NO_CARD"`.
  - Firebase data path: `loans/<bookingRef>/<occupantId>/txns/<transactionId>`.
  - Occupant node path: `loans/<bookingRef>/<occupantId>`.
- Persistence:
  - Firebase Realtime Database — multi-path `update()` is natively atomic and supported at root ref.
  - Offline sync via `queueOfflineWrite` (IndexedDB) — only used in `saveLoan`; removals are online-only.
- API/contracts:
  - `removeLoanItem` signature: `(bookingRef, occupantId, transactionId, itemName)` — currently fetches `deposit` from Firebase. Proposed change: accept `deposit?: number` and `txnsRemaining?: number` from caller (or source from context at call site in `LoanDataContext`).
  - `removeOccupantIfEmpty` signature: `(bookingRef, occupantId)` — currently does a `get()` to check emptiness. Proposed: accept optional `isEmpty?: boolean` from caller, skip get when supplied.
  - `removeLoanTransactionsForItem` signature: `(bookingRef, occupantId, itemName)` — currently does a `get()` to find matching txn IDs. Proposed change: accept `matchingTxnIds?: string[]` from caller; when supplied, skip the `get()` and use the provided IDs directly in the multi-path `update()` null-write. `LoanDataContext.removeLoanTransactionsForItemAndUpdate` already computes matching txn IDs from `loansState` and can pass them in.

### Dependency & Impact Map

- Upstream dependencies:
  - `firebase/database` — `get`, `ref`, `remove`, `update` (all already imported).
  - `useActivitiesMutations.logActivity` — async, one Firebase write per call; unchanged.
  - `useAllTransactions.addToAllTransactions` — has its own pre-read; unchanged.
- Downstream dependents:
  - `LoanDataContext` wraps all 5 hook functions — signatures must remain compatible or context wrapper updated in parallel.
  - `Checkout.tsx` → calls `removeLoanItem` via context.
  - `LoansContainer.tsx` → calls `removeLoanTransactionsForItem` via context; also calls `getOccupantKeycardCount` directly (not part of this hook — separate local read in component, separate concern).
- Likely blast radius:
  - Changes confined to `useLoansMutations.ts` (hook internals) + `LoanDataContext.tsx` (if signature changes propagate).
  - No changes to UI components if signatures are kept backward-compatible.
  - If `removeLoanItem` gains an optional `deposit` param: `LoanDataContext.removeLoanItemAndUpdate` already knows the txn (from `loansState`) — it can pass the deposit without component changes.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (`renderHook`, `act`)
- Commands: Tests run in CI only — never locally. Push to `origin/dev` and monitor with `gh run watch` (per repo policy in `docs/testing-policy.md`).
- CI integration: governed test runner via `pnpm -w run test:governed` in CI pipeline

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `saveLoan` — online path | Unit | `useLoansMutations.test.ts` | Calls `update`, no offline fallback tested |
| `saveLoan` — offline path | Unit | `useLoansMutations.test.ts` | Queue path verified |
| `removeLoanTransactionsForItem` — parallel removal ordering | Unit | `useLoansMutations.test.ts` | Confirms cleanup check only runs after all removes complete |
| `removeLoanTransactionsForItem` — failure propagation | Unit | `useLoansMutations.test.ts` | Remove rejection skips cleanup check |
| Online-only gate: `removeOccupantIfEmpty` | Unit | `useLoansMutations.test.ts` | Verifies error set, no Firebase call |
| Online-only gate: `removeLoanItem` | Unit | `useLoansMutations.test.ts` | Verifies error set, no Firebase call |
| Online-only gate: `updateLoanDepositType` | Unit | `useLoansMutations.test.ts` | Verifies error set, no Firebase call |

#### Coverage Gaps

- Untested paths:
  - `removeLoanItem` — happy path (no test for the `get` → `remove` → `logActivity` → `addToAllTransactions` → `removeOccupantIfEmpty` chain when online).
  - `removeLoanItem` — Keycard branch (activity log + deposit refund path).
  - `removeOccupantIfEmpty` — happy path when occupant has remaining txns (returns null without removing).
  - `removeOccupantIfEmpty` — happy path when occupant is empty (removes occupant node).
  - `updateLoanDepositType` — online happy path.
  - `convertKeycardDocToCash` — any coverage (does `update()` + `addToAllTransactions()` + `logActivity()` sequentially — not a single write as previously stated; all three ops are unavoidable for this function).
  - The new multi-path write paths will need unit tests that assert a single `update()` call with the correct path map (replacing the current multi-call sequence tests).

#### Testability Assessment

- Easy to test: all Firebase operations are already mocked in tests (`getMock`, `updateMock`, `removeMock`). Converting from `remove(ref(db, path))` to `update(ref(db), { [path]: null })` is directly testable by asserting `updateMock` is called with a specific payload and `removeMock` is not called.
- Hard to test: nothing particularly difficult; the hook is already designed for isolated unit testing.
- Test seams needed: pass `deposit` and occupancy status as optional params into `removeLoanItem` / `removeOccupantIfEmpty` — this creates clean testability without needing to mock `get()` for those code paths.

#### Recommended Test Approach

- Unit tests: extend `useLoansMutations.test.ts` — add happy-path tests for `removeLoanItem` (Keycard and non-Keycard), `removeOccupantIfEmpty`, `updateLoanDepositType`, `convertKeycardDocToCash`. Assert the new multi-path update shape. Assert `removeMock` is NOT called (replaced by null-write in `updateMock`).
- Integration tests: not required; the LoanDataContext tests in `LoanDataContext.test.tsx` cover the context wrapper behavior.
- E2E tests: not required for this change.

### Recent Git History (Targeted)

- `208a3326ee` (2026-03-09) — `simplify(reception): round 2 atomic fixes` — removed unused `_user = useAuth()` from `useLoansMutations`; this was the most recent change to the file. No structural change to the sequential operation pattern — confirming the problem is unchanged.
- `e75f7396cd` — `feat(reception): process integrity hardening` — hardened auth, email, mutations, and component reliability; established the current `.then().catch()` chain pattern.
- `7e84800700` — `feat(reception): wire offline sync infrastructure — Wave 2` — introduced `queueOfflineWrite` in `saveLoan`; removal operations were explicitly left as online-only in this commit.

## Questions

### Resolved

- Q: Is the `get()` in `removeLoanItem` required for business logic, or only to retrieve the deposit amount for the refund entry?
  - A: Only to retrieve deposit amount. The `deposit` field is already stored in `LoanDataContext.loansState` (sourced from the Firebase subscription) and can be passed in by the context wrapper without an extra Firebase round-trip.
  - Evidence: `LoanDataContext.tsx:106-175` — `removeLoanItemAndUpdate` already has the txn ID but doesn't pass deposit; `loansState[bookingRef][occupantId].txns[txnId].deposit` is available in context state.

- Q: Can `removeOccupantIfEmpty`'s `get()` be eliminated?
  - A: Yes, conditionally. The context wrapper knows the post-removal txn count from the optimistic `loansState` clone. If 0 txns remain after removing the target txn, the occupant path can be null-written in the same multi-path update. The `get()` is then unnecessary.
  - Evidence: `LoanDataContext.tsx:137-176` — optimistic removal already computes `Object.keys(newTxns).length === 0` and deletes the occupant/booking from local state; the same computation can drive whether to include the occupant path in the Firebase multi-path update.

- Q: Does the `removeLoanTransactionsForItem` function have a different caller profile, and is the first `get()` avoidable?
  - A: Yes to both. It is called from `LoansContainer` (single-item return on the Loans page, not bulk checkout). The first `get()` reads all txns to find which match the target item — but `LoanDataContext.removeLoanTransactionsForItemAndUpdate` at lines 189-197 already iterates `loansState` to identify matching txn IDs for its optimistic state update. Those pre-identified matching txn IDs can be passed into the hook as a parameter, eliminating the first `get()` entirely. The full optimization then becomes: pass pre-computed matching txn IDs from context state into the hook → single `update()` call with null-writes for all matched txns + optional occupant null-write. This is an expanded but well-evidenced scope addition.
  - Evidence: `LoanDataContext.tsx:189-197` — `Object.entries(newTxns).forEach` already identifies matching txn IDs from local state. `useLoansMutations.ts:114-156` — the `get()` is the first operation and its data is replicated in context.

- Q: Does `useAllTransactions.addToAllTransactions` need to remain sequential (blocking)?
  - A: Yes. It has an idempotency guard: it reads the transaction first and refuses to overwrite non-void fields. This read cannot be removed without removing the safety guard. Leave `addToAllTransactions` unchanged.
  - Evidence: `useAllTransactionsMutations.ts:58-76`.

- Q: Does the existing test for `removeLoanTransactionsForItem` (the parallel removal ordering test) need rewriting after the refactor?
  - A: Yes. The test currently asserts that `removeMock` is called N times sequentially. After refactor, `removeMock` will not be called at all (replaced by a single `updateMock` with null-writes). The test must be rewritten to assert the new `update()` call shape.
  - Evidence: `useLoansMutations.test.ts:130-208`.

### Open (Operator Input Required)

None. All questions resolved from codebase evidence.

## Scope Signal

Signal: right-sized

Rationale: The scope targets exactly the two functions with avoidable sequential reads (`removeLoanItem`, `removeOccupantIfEmpty`) and the one function where the multi-call sequence can be collapsed (`removeLoanTransactionsForItem`). `updateLoanDepositType` is excluded because its `get()` is load-bearing (needs `count` to compute deposit). `convertKeycardDocToCash` is excluded because, while it chains `update()` + `addToAllTransactions()` + `logActivity()`, none of those ops contain a pre-read eliminable by context data (its ops are all semantically required). The blast radius is tightly bounded to the hook and its context wrapper.

## Confidence Inputs

- **Implementation:** 90% — The code paths are fully read. The multi-path update pattern is established in `useActivitiesMutations`. The main complexity is refactoring `LoanDataContext.removeLoanItemAndUpdate` to extract and pass the deposit value before calling the hook. This is a mechanical change with clear precedent.
  - To raise to >=80: already there.
  - To raise to >=90: already there.

- **Approach:** 85% — Firebase null-write batching is the standard pattern for atomic multi-path deletes. The `LoanDataContext` already has all data to avoid pre-reads. The 15% gap is the untested interaction between the new optional params on `removeLoanItem` and downstream callers — specifically whether any direct callers outside the context wrapper exist (confirmed: none do for `removeLoanItem`; `LoansContainer` uses the context).
  - To raise to >=90: verify no direct callers bypass `LoanDataContext` for removals (confirmed above — all callers go through context).

- **Impact:** 75% — For a 10-keycard bulk checkout, the hook-level ops drop from ~40 to ~10 (75% reduction in hook-controlled ops), but total end-to-end Firebase ops per item also include `logActivity` (~1 op/item, unavoidable), `addToAllTransactions` (~2 ops/item including read guard, unchanged), and `Checkout.tsx`'s own `addToAllTransactions` call (~2 ops/item, unchanged). Total end-to-end ops per item therefore drops from ~8-9 to ~5-6 (35-40% overall reduction). Real-world impact depends on network latency, but this meaningfully reduces the serialised op count for the hook's critical path.
  - To raise to >=80: confirm no other avoidable ops were missed in the caller chain.
  - To raise to >=90: measure actual checkout latency before/after in staging.

- **Delivery-Readiness:** 88% — All evidence gathered. Implementation path is clear. Tests need extension but the test infrastructure is solid. No external service changes.
  - To raise to >=90: confirm no type errors introduced by the optional param additions.

- **Testability:** 85% — Hook is already unit-testable with mocked Firebase. Converting from `remove()` to `update(..., {path: null})` is directly assertable. One complexity: the LoanDataContext wrapper tests will need updating to verify the deposit is read from local state.
  - To raise to >=90: write tests for all currently untested happy paths before or alongside the refactor.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| LoanDataContext state is stale at time of removal (deposit/count wrong) | Low | Medium | The context state is driven by a Firebase realtime subscription; staleness window is ms-level. The current code also relies on the same subscription for UI display. Acceptable risk; document as a known constraint. |
| Optional `deposit` param not passed correctly from context wrapper | Low | Low | Caught by extended unit tests asserting the `update()` payload contains the correct deposit path. |
| Test breakage: existing `removeLoanTransactionsForItem` parallel-removal test assumes `remove()` calls | Certain (known) | Low | Must rewrite that specific test; accounted for in task seeds. |
| Firebase multi-path update rejected for paths with special characters in keys | Very Low | Low | Transaction IDs are generated by `generateTransactionId()` (timestamp-based, safe characters). No special chars in booking refs. |
| `removeOccupantIfEmpty` callers outside identified set | Low | Medium | Confirmed: `removeOccupantIfEmpty` is exported from the hook and wrapped in context; all callers go via context. The context wrapper is the only public interface. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `update(ref(database), pathMap)` with `null` values for deletes (Firebase null-write pattern) — matches `useActivitiesMutations` precedent.
  - Keep `removeLoanItem` backward-compatible: new `deposit` param should be optional (fall back to `get()` if not provided, or assert context always passes it — plan task must decide).
  - Context wrapper (`LoanDataContext`) must source deposit from `loansState` before calling the hook, not from the hook's return.
  - Tests: CI only — never run locally. Push and use `gh run watch`.
- Rollout/rollback expectations:
  - No feature flag needed — internal implementation change with no UI surface. Rollback is revert of the PR.
- Observability expectations:
  - Firebase console request count for the `/loans` path should show reduction after deploy. No structured metrics hook needed for this change.

## Suggested Task Seeds (Non-binding)

1. **Refactor `removeLoanItem` to accept optional `deposit` param; replace `get()` + sequential chain with multi-path `update()`** — core change; extend tests.
2. **Refactor `removeOccupantIfEmpty` to accept optional `isEmpty` boolean; use null-write when true** — eliminates second `get()`.
3. **Refactor `removeLoanTransactionsForItem` to accept optional `matchingTxnIds?: string[]` param; when provided, skip `get()` and batch matched removals + occupant cleanup into one `update()`** — eliminates the first `get()` and collapses N `remove()` + conditional `remove()` into 1 `update()`.
4. **Update `LoanDataContext.removeLoanItemAndUpdate` to extract deposit from `loansState` and pass to hook** — no signature change at UI level.
5. **Update `LoanDataContext.removeLoanTransactionsForItemAndUpdate` to extract matching txn IDs from `loansState` and pass to hook** — already iterates `loansState` to find matching txns for optimistic update; same IDs passed as hook param.
6. **Rewrite `removeLoanTransactionsForItem` parallel-removal test; add happy-path tests for `removeLoanItem` (Keycard and non-Keycard) and `removeOccupantIfEmpty`** — fix broken test + close coverage gaps.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `useLoansMutations.ts` — no `remove()` calls in `removeLoanItem` or `removeLoanTransactionsForItem`; single `update()` per operation with null-write paths; `get()` skipped when optional params supplied.
  - `LoanDataContext.tsx` — `removeLoanItemAndUpdate` reads deposit from `loansState` before calling hook; `removeLoanTransactionsForItemAndUpdate` extracts matching txn IDs from `loansState` and passes them to hook.
  - `useLoansMutations.test.ts` — extended tests for all 5 functions; `removeMock` not called in updated paths; `updateMock` called with correct null-write map; `getMock` not called when optional params are supplied.
  - CI passes.
- Post-delivery measurement plan: Firebase console — monitor request volume on `/loans` path post-deploy.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `removeLoanItem` read chain (get→remove→logActivity→addToAllTransactions→removeOccupantIfEmpty) | Yes | None | No |
| `removeOccupantIfEmpty` redundant get | Yes | None | No |
| `removeLoanTransactionsForItem` N-remove + second get | Yes | None | No |
| Caller inventory (Checkout.tsx, LoansContainer.tsx) | Yes | None | No |
| LoanDataContext optimistic state data availability | Yes | None | No |
| `useActivitiesMutations` multi-path pattern (reference) | Yes | None | No |
| `useAllTransactions` idempotency guard (cannot remove pre-read) | Yes | None | No |
| Test landscape — existing coverage and gaps | Yes | None | No |
| Offline-only gate for removals | Yes | None | No |
| Signature backward-compatibility | Yes | Minor: optional params must be confirmed as context-always-supplied | No (accounted for in planning constraints) |

## Evidence Gap Review

### Gaps Addressed

1. **Citation integrity** — All non-trivial claims traced to specific file+line. Entry points verified in `Checkout.tsx:149`, `LoansContainer.tsx:118`. Dependency chain verified in `useAllTransactionsMutations.ts:58-76`.
2. **Boundary coverage** — Error/fallback paths inspected (online gate, `.catch()` chains). No auth/authz surface in the mutation path itself (online status is the only gate).
3. **Testing/validation** — Existing tests read and verified. Coverage gaps explicitly identified. Test rewrite requirement noted (parallel removal test).
4. **Confidence calibration** — Scores reflect actual evidence; `updateLoanDepositType` left out of scope because its pre-read is load-bearing (no inflation of optimistic impact).

### Confidence Adjustments

- Implementation held at 90% (not 95%) because the `LoanDataContext` wrapper change requires extracting the deposit from `loansState` — a small but real change to the wrapper logic that hasn't been prototyped.
- Impact held at 75% (not higher) because the end-to-end total op reduction is ~35-40% (not ~75%) once `addToAllTransactions`, `logActivity`, and the `Checkout.tsx`-level ops are included. The 75% figure reflects the more conservative total view.

### Remaining Assumptions

- `loansState` in context is always consistent with Firebase at the time of removal (realtime subscription; acceptable latency risk).
- No direct callers of `removeLoanItem`/`removeOccupantIfEmpty` outside `LoanDataContext` (confirmed by file search — 11 files reference the hook, all via context or in tests).

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-loans-sequential-firebase --auto`
