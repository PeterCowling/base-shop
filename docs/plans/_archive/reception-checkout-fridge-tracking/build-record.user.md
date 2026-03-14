# Build Record — Fridge Item Tracking on the Checkout Screen

**Feature slug:** reception-checkout-fridge-tracking
**Build date:** 2026-03-13
**Build status:** Complete
**Tasks executed:** TASK-01 through TASK-07 (all 7 tasks)

## Outcome Contract

- **Why:** Staff need to record at checkout whether a guest used the fridge, and see that flag on the checkout screen so nothing is missed before the guest leaves.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can toggle a fridge-used flag per guest on the checkout screen; the FRIDGE column shows a fridge icon when the flag is set, so staff know to retrieve fridge items before the guest departs.
- **Source:** operator

## What Was Built

### TASK-01: Schema and Types
- `apps/reception/src/schemas/fridgeStorageSchema.ts` — Zod schema `fridgeStorageRecordSchema` (`{ used: boolean }`) and `fridgeStorageSchema` (record map).
- `apps/reception/src/types/hooks/data/fridgeStorageData.ts` — TypeScript interfaces (`FridgeStorageRecord`, `FridgeStorage`).

### TASK-02: Read Hook
- `apps/reception/src/hooks/data/useFridgeStorageData.ts` — subscribes to `fridgeStorage` Firebase node via `useFirebaseSubscription<FridgeStorage>`, validates with Zod, returns `{ fridgeStorage, loading, error }`.

### TASK-03: Write Mutation Hook
- `apps/reception/src/hooks/mutations/useSetFridgeUsedMutation.ts` — writes `{ used: boolean }` to `fridgeStorage/<occupantId>` via Firebase `update()`, exposes `setFridgeUsed(occupantId, used)`.

### TASK-04: CheckoutTable Component Update
- `apps/reception/src/components/checkout/CheckoutTable.tsx`:
  - `Guest.fridge?: string` → `Guest.fridgeUsed?: boolean`
  - Added `onToggleFridge` and `pendingFridgeOccupantIds` props
  - FRIDGE cell: shows `Refrigerator` icon when `fridgeUsed === true`; always renders toggle button (disabled when occupantId is in pending set)

### TASK-05: Checkout.tsx Wiring
- `apps/reception/src/components/checkout/Checkout.tsx`:
  - Subscribes to `useFridgeStorageData()`
  - `pendingFridgeOccupantIds: Set<string>` state with functional `Set` updates
  - `onToggleFridge` useCallback: add to pending → Firebase write → remove from pending in `finally`
  - `fridgeUsed` derived in useMemo guest derivation from `fridgeStorage[occupantId]?.used`

### TASK-06: Lifecycle Cleanup and Security Rules
- `apps/reception/src/hooks/mutations/useArchiveCheckedOutGuests.ts` — reads `fridgeStorage/<occupantId>`, copies to `archive/fridgeStorage/<occupantId>`, then nulls live path.
- `apps/reception/src/hooks/mutations/useDeleteGuestFromBooking.ts` — adds `fridgeStorage/${occupantId}: null` to atomic delete updates.
- `apps/reception/database.rules.json` — explicit `fridgeStorage` node rule: any authenticated role (staff/manager/owner/admin/developer) can read/write; null writes permitted (no `newData.exists()`).

### TASK-07: Tests
- `apps/reception/src/schemas/__tests__/fridgeStorageSchema.test.ts` — 8 schema unit tests
- `apps/reception/src/hooks/data/__tests__/useFridgeStorageData.test.ts` — 4 hook subscription tests
- `apps/reception/src/hooks/mutations/__tests__/useSetFridgeUsedMutation.test.ts` — 3 mutation unit tests
- `apps/reception/src/components/checkout/__tests__/CheckoutTable.component.test.tsx` — 4 new component tests (fridge icon, no-icon, disabled pending, callback)
- `apps/reception/src/components/checkout/__tests__/Checkout.test.tsx` — 1 integration test for onToggleFridge
- `apps/reception/src/parity/__tests__/checkout-route.parity.test.tsx` — added fridge hook mocks; stale snapshot deleted for regeneration
- `apps/reception/src/rules/__tests__/databaseRules.test.ts` — 2 fridgeStorage rule tests (create+null-write allowed; unauthenticated denied)
- `apps/reception/src/hooks/mutations/__tests__/useDeleteGuestFromBooking.test.ts` — added `fridgeStorage/occ1: null` to expected updates map

## Key Decisions

- **No `newData.exists()` in Firebase rule**: archive and delete-guest flows write null, so the rule must allow it. All other explicitly-named nodes have `newData.exists()` — fridgeStorage is the exception by design.
- **Pending state as `Set<string>`**: functional updates prevent stale-closure bugs when multiple toggles fire concurrently.
- **Read path mirrors bag-storage exactly**: `useFirebaseSubscription` → Zod validate → `{}` default when absent.
- **No rollback on write failure**: write is fast (<200ms); error toasted; no optimistic UI to reverse.

## Engineering Coverage Evidence

All 7 tasks completed with validation gates passed:
- TypeScript: 0 errors in `@apps/reception` (typecheck pass confirmed in TASK-07 commit hook output)
- ESLint: 0 errors (14 pre-existing warnings in unrelated files)
- TC contracts: 8 + 4 + 3 + 4 + 1 + 2 = 22 test cases across schema, hook, component, integration, rules files
- Pre-commit hooks: passed on all commits

## Workflow Telemetry Summary

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-analysis | 1 | 1.00 | 63605 | 16294 | 0.0% |
| lp-do-plan | 1 | 1.00 | 102346 | 47935 | 0.0% |
| lp-do-build | 1 | 2.00 | 103023 | 0 | 0.0% |

- Context input bytes across all stages: 268,974
- Artifact bytes produced: 64,229
- Modules loaded: 4
- Deterministic checks: 5
