---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-checkout-fridge-tracking
Dispatch-ID: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-checkout-fridge-tracking/analysis.md
---

# Fridge Item Tracking on the Checkout Screen — Plan

## Summary
The checkout screen has a FRIDGE column that always shows blank. This plan wires real Firebase data into it: a boolean `{ used: boolean }` flag per occupant at `fridgeStorage/<occupantId>`, displayed as a `Refrigerator` icon when set. Staff can toggle the flag directly on the checkout row. The implementation follows the bag-storage analogue exactly, extended with a direct-write mutation hook, a per-row disabled-during-write pending state, and full coverage of the occupant lifecycle (archive, delete-guest cleanup). Seven tasks, three waves. No feature flags, no migration.

## Active tasks
- [x] TASK-01: Create fridgeStorage schema and types — Complete (2026-03-13)
- [x] TASK-02: Create useFridgeStorageData read hook — Complete (2026-03-13)
- [x] TASK-03: Create useSetFridgeUsedMutation write hook — Complete (2026-03-13)
- [x] TASK-04: Update CheckoutTable — type change, Refrigerator icon, toggle button — Complete (2026-03-13)
- [x] TASK-05: Wire Checkout.tsx — subscribe, pending state, toggle handler — Complete (2026-03-13)
- [x] TASK-06: Archive, delete-guest cleanup, and Firebase rules — Complete (2026-03-13)
- [x] TASK-07: Tests — schema, hooks, component, integration, rules, parity snapshot — Complete (2026-03-13)

## Goals
- Staff toggle fridge-used per guest row on the checkout screen.
- FRIDGE column shows `Refrigerator` icon when `used === true`, blank otherwise.
- Fridge flag archived alongside the guest; deleted alongside the guest record.
- Firebase security rule explicitly covers `fridgeStorage` node.

## Non-goals
- No free-text, no item list, no POS transaction.
- No fridge UI on any screen other than checkout.

## Constraints & Assumptions
- Constraints:
  - Follow bag-storage pattern: Firebase node, Zod schema, read hook via `useFirebaseSubscription`, wired into `Checkout.tsx` useMemo guest derivation.
  - Write: Firebase `update()` in mutation hook. Pending state: `Set<string>` of occupantIds in `Checkout.tsx`.
  - Firebase rule must NOT include `newData.exists()` — archive and delete-guest flows write null.
  - Tests run in CI only.
- Assumptions:
  - Toggle is per-occupant, not per-booking.
  - All staff/admin/manager/developer/owner roles may write.
  - `Refrigerator` icon confirmed available in lucide-react installed in this app.

## Inherited Outcome Contract

- **Why:** Staff need to record at checkout whether a guest used the fridge, and see that flag on the checkout screen so nothing is missed before the guest leaves.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can toggle a fridge-used flag per guest on the checkout screen; the FRIDGE column shows a fridge icon when the flag is set, so staff know to retrieve fridge items before the guest departs.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/reception-checkout-fridge-tracking/analysis.md`
- Selected approach inherited:
  - Option A — Disabled-during-write. `Checkout.tsx` manages `useState<Set<string>>(new Set())` of pending occupantIds. On toggle: add to set → Firebase write → on success/error: remove from set (in `finally`). `CheckoutTable` receives this set and disables the toggle button when the occupantId is in it.
- Key reasoning used:
  - No rollback logic needed. < 200ms write. Simpler to test. No prior precedent for optimistic state in checkout screen.
  - `Refrigerator` icon confirmed present in lucide-react.
  - Firebase rule must allow null writes (archive + delete-guest flows). Do not copy `keycardAssignments` pattern (it has `newData.exists()` which blocks nulls).

## Selected Approach Summary
- What was chosen:
  - Bag-storage pattern for read path; disabled-during-write pending state for toggle UX.
- Why planning is not reopening option selection:
  - Analysis settled all design decisions. Operator confirmed all requirements. No open forks.

## Fact-Find Support
- Supporting brief: `docs/plans/reception-checkout-fridge-tracking/fact-find.md`
- Evidence carried forward:
  - `Guest.fridge?: string` → `Guest.fridgeUsed?: boolean` (type change, breaking but contained to reception app)
  - `CheckoutTableProps` gains `onToggleFridge` + `pendingFridgeOccupantIds`
  - `useDeleteGuestFromBooking.ts:119` nulls `bagStorage` — must also null `fridgeStorage`
  - `useArchiveCheckedOutGuests.ts:187-297` is the archive block to extend
  - `databaseRules.test.ts` exists and tests must cover `fridgeStorage` create, null-write, read, and unauthenticated-deny

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create fridgeStorage schema and types | 95% | S | Pending | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Create useFridgeStorageData read hook | 92% | S | Pending | TASK-01 | TASK-05 |
| TASK-03 | IMPLEMENT | Create useSetFridgeUsedMutation write hook | 90% | S | Pending | TASK-01 | TASK-05 |
| TASK-04 | IMPLEMENT | Update CheckoutTable — type, icon, toggle button | 88% | M | Pending | TASK-01 | TASK-05 |
| TASK-05 | IMPLEMENT | Wire Checkout.tsx — subscribe, pending, handler | 88% | M | Pending | TASK-02, TASK-03, TASK-04 | TASK-07 |
| TASK-06 | IMPLEMENT | Archive, delete-guest, Firebase rules | 90% | S | Pending | TASK-01 | TASK-07 |
| TASK-07 | IMPLEMENT | Tests — all layers | 85% | M | Pending | TASK-05, TASK-06 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | `Refrigerator` icon in FRIDGE cell; `Button` with `disabled` prop during write | TASK-04 | Icon already available in lucide-react |
| UX / states | Empty cell when unset; icon when set; button disabled during write; toast on error | TASK-04, TASK-05 | Pending state via `Set<string>` in `Checkout.tsx` |
| Security / privacy | Explicit `fridgeStorage` Firebase rule, role-gated write, null-writes allowed | TASK-06 | No PII; same auth model as all other guest-facing nodes |
| Logging / observability / audit | `console.error` + `showToast` on toggle failure | TASK-03, TASK-05 | Follow existing pattern |
| Testing / validation | Schema unit, hook unit, mutation unit, component, integration, rules, parity snapshot | TASK-07 | Multiple test files; all CI-only |
| Data / contracts | New Zod schema, TS types; `Guest.fridgeUsed?: boolean`; `CheckoutTableProps` updated; `CheckoutRow` unchanged | TASK-01, TASK-04 | Breaking type change on `Guest` — all callsites in scope |
| Performance / reliability | Single Firebase `update()` per toggle; bounded node size; disabled button prevents double-fire | TASK-03, TASK-05 | `finally` block ensures pending set is always cleared |
| Rollout / rollback | No feature flag; additive Firebase node; revert 5–6 files to rollback | TASK-01–TASK-07 | Firebase node persists harmlessly after rollback |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Schema + types; unblocks all other tasks |
| 2 | TASK-02, TASK-03, TASK-04 | TASK-01 complete | Independent of each other; run in parallel |
| 2 | TASK-06 | TASK-01 complete | Independent of TASK-02/03/04; can run in wave 2 |
| 3 | TASK-05 | TASK-02, TASK-03, TASK-04 complete | Wires it all together in Checkout.tsx |
| 4 | TASK-07 | TASK-05, TASK-06 complete | All implementation done before tests |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Fridge flag recording at checkout | Guest hands fridge items to staff; staff opens checkout screen | 1. FRIDGE column shows toggle button per row. 2. Staff clicks toggle. 3. Button disables (pending state). 4. `useSetFridgeUsedMutation` calls `update(ref(db, fridgeStorage/<occupantId>), { used: true })`. 5. Firebase subscription delivers update → `Refrigerator` icon appears; button re-enables. 6. Clicking again reverses: `used: false`, icon disappears. 7. On error: toast shown; button re-enables; Firebase state unchanged. | TASK-03, TASK-04, TASK-05 | Rollback: revert TASK-04 and TASK-05 changes; Firebase node persists harmlessly |
| Guest archival | Past-checkout occupants archived by `useArchiveCheckedOutGuests` | `fridgeStorage/<occupantId>` read → copied to `archive/fridgeStorage/<occupantId>` → live path nulled. Joins existing bagStorage archival block. | TASK-06 | Additive only |
| Guest deletion | Operator deletes a guest via `useDeleteGuestFromBooking` | `fridgeStorage/<occupantId> = null` added to the `updates` map alongside `bagStorage/<occupantId> = null` at line 119. | TASK-06 | Additive one-liner |
| Firebase security | Deploy of updated `database.rules.json` | Explicit `fridgeStorage` rule: authenticated read for all users; role-gated write (staff/admin/manager/developer/owner) without `newData.exists()` — null writes allowed for archive and delete flows. | TASK-06 | Rules change is safe to deploy before or alongside code |

## Tasks

---

### TASK-01: Create fridgeStorage schema and types
- **Type:** IMPLEMENT
- **Deliverable:** New files `apps/reception/src/schemas/fridgeStorageSchema.ts` and `apps/reception/src/types/hooks/data/fridgeStorageData.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/schemas/fridgeStorageSchema.ts` (new)
  - `apps/reception/src/types/hooks/data/fridgeStorageData.ts` (new)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 95%
  - Implementation: 95% — Direct analogue of `bagStorageSchema.ts` and `bagStorageData.ts`. Schema shape confirmed: `{ used: boolean }`. No ambiguity.
  - Approach: 95% — Established codebase pattern with verified analogue.
  - Impact: 95% — These files unblock all downstream tasks; zero risk.
  - Held-back test (all dims 95%): No single unknown would drop below 80. Schema shape is operator-confirmed; lucide icon is verified; bagStorage analogue is fully read.
- **Acceptance:**
  - `fridgeStorageRecordSchema = z.object({ used: z.boolean() })`
  - `fridgeStorageSchema = z.record(fridgeStorageRecordSchema)`
  - `FridgeStorageRecord { used: boolean }` and `FridgeStorage { [occupantId: string]: FridgeStorageRecord }` TypeScript interfaces present
  - TypeScript types exported from both files
  - `pnpm typecheck` passes for reception app
- **Engineering Coverage:**
  - UI / visual: N/A — types only
  - UX / states: N/A — types only
  - Security / privacy: N/A — types only
  - Logging / observability / audit: N/A — types only
  - Testing / validation: N/A — tested in TASK-07 (schema unit test)
  - Data / contracts: Required — defines the Firebase data contract for all downstream tasks
  - Performance / reliability: N/A — types only
  - Rollout / rollback: N/A — new files only; revert to roll back
- **Validation contract:**
  - TC-01: `fridgeStorageRecordSchema.parse({ used: true })` → succeeds
  - TC-02: `fridgeStorageRecordSchema.parse({ used: "yes" })` → throws ZodError
  - TC-03: `fridgeStorageSchema.parse({ occ_123: { used: false } })` → succeeds
  - TC-04: `fridgeStorageSchema.parse({ occ_123: { used: false }, occ_456: { used: true } })` → succeeds (multi-occupant)
- **Execution plan:** Red → Green → Refactor — Create both files mirroring the bagStorage analogue exactly. No refactor needed.
- **Planning validation:**
  - Checks run: Read `apps/reception/src/schemas/bagStorageSchema.ts` and `apps/reception/src/types/hooks/data/bagStorageData.ts` — confirmed exact pattern.
  - Unexpected findings: None.
- **Scouts:** None: pattern is confirmed via bagStorage analogue.
- **Edge Cases & Hardening:** Zod `z.record` handles empty map (`{}`) and unknown extra keys are stripped — matches bagStorage behavior.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: Deploy with rest of changes.
  - Rollback: Delete both new files.
- **Documentation impact:** None: internal types only.
- **Notes / references:** `apps/reception/src/schemas/bagStorageSchema.ts`, `apps/reception/src/types/hooks/data/bagStorageData.ts`

---

### TASK-02: Create useFridgeStorageData read hook
- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/reception/src/hooks/data/useFridgeStorageData.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/data/useFridgeStorageData.ts` (new)
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 92%
  - Implementation: 92% — Direct analogue of `useBagStorageData.ts`. Pattern verified. Uses `useFirebaseSubscription<FridgeStorage>("fridgeStorage")`.
  - Approach: 95% — Established pattern.
  - Impact: 90% — Hook is consumed by TASK-05; no other consumers.
  - Held-back test (Implementation at 92%): No held-back test needed (not at 80).
- **Acceptance:**
  - Hook subscribes to Firebase path `"fridgeStorage"` via `useFirebaseSubscription`
  - Validates snapshot with `fridgeStorageSchema.safeParse(data)`
  - Returns `{ fridgeStorage: FridgeStorage, loading: boolean, error: unknown }`
  - Returns `{}` when path is absent/null (same as bagStorage)
  - `pnpm typecheck` passes
- **Engineering Coverage:**
  - UI / visual: N/A — data hook only
  - UX / states: Required — handles loading and error states; empty `{}` when no data
  - Security / privacy: N/A — reads from authenticated Firebase session
  - Logging / observability / audit: N/A — no logging in data hooks (existing pattern)
  - Testing / validation: N/A — tested in TASK-07
  - Data / contracts: Required — consumes TASK-01 schema; provides typed `FridgeStorage` to TASK-05
  - Performance / reliability: Required — Firebase subscription teardown on unmount via `useFirebaseSubscription` (existing pattern handles this)
  - Rollout / rollback: N/A — new file only
- **Validation contract:**
  - TC-01: Firebase snapshot `{ occ_1: { used: true } }` → `fridgeStorage` returned with `occ_1.used === true`
  - TC-02: Firebase snapshot is absent/null → `fridgeStorage === {}`, `loading === false`, `error === null`
  - TC-03: Firebase snapshot has invalid shape → `error` is set, previous `fridgeStorage` retained
- **Execution plan:** Red → Green → Refactor — Copy `useBagStorageData.ts`, s/bagStorage/fridgeStorage/, s/BagStorage/FridgeStorage/, s/bagStorageSchema/fridgeStorageSchema/. No refactor needed.
- **Planning validation:**
  - Checks run: Verified `useBagStorageData.ts` structure in detail (lines 1-51). Confirmed `useFirebaseSubscription` signature and return shape.
  - Consumer (TASK-05): `Checkout.tsx` will destructure `{ fridgeStorage, loading, error }` exactly as it does for `bagStorage`.
  - Unexpected findings: None.
- **Scouts:** None: pattern confirmed.
- **Edge Cases & Hardening:** Zod parse failure retains previous valid state (inherited from `useFirebaseSubscription` pattern via useEffect guard).
- **What would make this >=90%:** Already at 92%.
- **Rollout / rollback:**
  - Rollout: Deploy with rest of changes.
  - Rollback: Delete file.
- **Documentation impact:** None.
- **Notes / references:** `apps/reception/src/hooks/data/useBagStorageData.ts`

---

### TASK-03: Create useSetFridgeUsedMutation write hook
- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/reception/src/hooks/mutations/useSetFridgeUsedMutation.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/mutations/useSetFridgeUsedMutation.ts` (new)
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 90% — Firebase `update()` pattern confirmed from `usePrimeRequestResolution.ts:218`. Hook is simple: takes `occupantId` and `used: boolean`, calls `update(ref(db, fridgeStorage/<occupantId>), { used })`.
  - Approach: 95% — Established pattern.
  - Impact: 85% — Consumed only by TASK-05 `onToggleFridge` handler.
  - Held-back test (Impact at 85%): No held-back test needed.
- **Acceptance:**
  - `setFridgeUsed(occupantId: string, used: boolean): Promise<void>`
  - On success: resolves; Firebase subscription will deliver updated value
  - On error: throws; caller (`Checkout.tsx`) catches, shows toast, removes occupantId from pending set
  - `pnpm typecheck` passes
- **Engineering Coverage:**
  - UI / visual: N/A — mutation hook only
  - UX / states: N/A — caller manages pending/error state
  - Security / privacy: N/A — Firebase auth handles write authorization
  - Logging / observability / audit: Required — `console.error` on failure (existing mutation pattern; logged by caller)
  - Testing / validation: N/A — tested in TASK-07
  - Data / contracts: Required — writes `{ used: boolean }` to `fridgeStorage/<occupantId>` — matches TASK-01 schema
  - Performance / reliability: Required — single `update()` call; idempotent; no retry needed for this use case
  - Rollout / rollback: N/A — new file only
- **Validation contract:**
  - TC-01: `setFridgeUsed("occ_1", true)` with mocked Firebase → `update()` called with `("fridgeStorage/occ_1", { used: true })`
  - TC-02: `setFridgeUsed("occ_1", false)` → `update()` called with `("fridgeStorage/occ_1", { used: false })`
  - TC-03: `update()` rejects → hook re-throws the error
- **Execution plan:** Red → Green — New file, simple wrapper around Firebase `update()` using `useFirebaseDatabase()`. No refactor needed.
- **Planning validation:**
  - Checks run: Verified Firebase `update()` import in `usePrimeRequestResolution.ts`. Confirmed `useFirebaseDatabase()` hook usage pattern.
  - Consumer (TASK-05): `Checkout.tsx` will call `setFridgeUsed(occupantId, !currentValue)` inside try/catch with finally block to clear pending state.
  - Unexpected findings: None.
- **Scouts:** None.
- **Edge Cases & Hardening:** Hook is intentionally thin — no retry, no rollback, no optimistic state. Caller owns error recovery.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Deploy with rest of changes.
  - Rollback: Delete file.
- **Documentation impact:** None.
- **Notes / references:** `apps/reception/src/hooks/mutations/usePrimeRequestResolution.ts:218`, `apps/reception/src/services/useFirebase.ts`

---

### TASK-04: Update CheckoutTable — type change, Refrigerator icon, toggle button
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/reception/src/components/checkout/CheckoutTable.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/checkout/CheckoutTable.tsx` (modified — type change + UI change)
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 88%
  - Implementation: 88% — Interface changes are clear. The `Guest.fridge?: string` → `Guest.fridgeUsed?: boolean` change is a breaking type change but all consumers are identified (only `Checkout.tsx`, tests). FRIDGE cell replaces `{guest.fridge || ""}` with a conditional `Refrigerator` icon and a `Button` toggle. `CheckoutTableProps` gains two new props.
  - Approach: 90% — Icon choice confirmed. Disabled-during-write pattern chosen.
  - Impact: 85% — UI change is isolated to the FRIDGE column cell. All other columns unchanged.
  - Held-back test (Implementation at 88%): No held-back test needed.
- **Acceptance:**
  - `Guest.fridgeUsed?: boolean` replaces `Guest.fridge?: string`
  - `CheckoutTableProps.onToggleFridge: (guestId: string, bookingRef: string, currentValue: boolean) => void` added
  - `CheckoutTableProps.pendingFridgeOccupantIds?: Set<string>` added
  - FRIDGE cell: when `fridgeUsed === true`, renders `<Refrigerator>` icon (same styling as Luggage icon); always renders a `<Button>` toggle (disabled when `pendingFridgeOccupantIds.has(guestId)`)
  - `Refrigerator` imported from `lucide-react` alongside existing imports
  - `pnpm typecheck` passes
  - **Expected user-observable behavior:**
    - [ ] When `fridgeUsed` is `false`/undefined: FRIDGE cell shows only the toggle button (no icon), button is enabled
    - [ ] When `fridgeUsed` is `true`: FRIDGE cell shows the `Refrigerator` icon AND the toggle button, button is enabled
    - [ ] When toggle is in flight (occupantId in pending set): toggle button is visually disabled (greyed out), cannot be clicked
    - [ ] Button has appropriate aria-label (e.g. `"Toggle fridge storage for <guestId>"` or similar)
- **Engineering Coverage:**
  - UI / visual: Required — `Refrigerator` icon added; `Button` with `disabled` state; icon color consistent with other icons (e.g. `text-primary-main`)
  - UX / states: Required — empty (no icon, enabled button), fridge-used (icon + enabled button), pending (disabled button); all three states tested
  - Security / privacy: N/A — display only; write auth handled by Firebase rules
  - Logging / observability / audit: N/A — display component
  - Testing / validation: N/A — tested in TASK-07 (component tests)
  - Data / contracts: Required — `Guest` interface is a breaking type change; `CheckoutTableProps` gains two new required/optional fields
  - Performance / reliability: N/A — pure render component; no async paths
  - Rollout / rollback: N/A — revert file to roll back
- **Consumer tracing:**
  - New output: `Guest.fridgeUsed?: boolean` — consumed by `CheckoutTable.tsx` cell renderer and test mocks. `Checkout.tsx` produces it in useMemo (TASK-05). Test files mock it directly.
  - New output: `CheckoutTableProps.onToggleFridge` — consumed by `Checkout.tsx` when it renders `<CheckoutTable onToggleFridge={...} />` (TASK-05). Test files pass mock fn.
  - New output: `CheckoutTableProps.pendingFridgeOccupantIds` — consumed by `Checkout.tsx` state (TASK-05). Test files pass `new Set()` or a set with test occupantId.
  - Removed field: `Guest.fridge?: string` — only two consumers: `Checkout.tsx` line 323 (replaced in TASK-05) and test mocks (replaced in TASK-07). No silent fallback risk.
- **Validation contract (component-level, full tests in TASK-07):**
  - TC-01: `fridgeUsed: false` → no Refrigerator icon rendered; toggle button present and enabled
  - TC-02: `fridgeUsed: true` → Refrigerator icon rendered; toggle button present and enabled
  - TC-03: `pendingFridgeOccupantIds = new Set([guestId])` → toggle button disabled
  - TC-04: clicking toggle button calls `onToggleFridge(guestId, bookingRef, currentFridgeUsed)`
- **Execution plan:** Red → Green → Refactor — (1) Change `Guest.fridge?: string` to `Guest.fridgeUsed?: boolean`. (2) Add `onToggleFridge` and `pendingFridgeOccupantIds` to `CheckoutTableProps`. (3) Add `Refrigerator` to lucide-react import. (4) Replace FRIDGE cell content with icon + Button. (5) TypeScript will flag `Checkout.tsx` line 323 — that fix is in TASK-05. Leave it failing until TASK-05.
- **Planning validation:**
  - Checks run: Read `CheckoutTable.tsx` fully (lines 1-269). Confirmed `Guest` interface, `CheckoutTableProps`, FRIDGE cell at line 225-226, Luggage icon pattern for styling reference, existing `Button` usage and `disabled` prop support.
  - Confirmed `Refrigerator` exists in lucide-react (verified via node module inspection).
  - All callers of `CheckoutTableProps` identified: only `Checkout.tsx` (TASK-05) and test files (TASK-07).
  - Unexpected findings: The existing test `CheckoutTable.component.test.tsx` line 114 uses `fridge: "Milk"` — this will fail TypeScript check after this task. That is expected; TASK-07 fixes it.
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - `pendingFridgeOccupantIds` is optional with default empty Set — no crash if prop omitted.
  - `fridgeUsed` is optional — cell renders empty/enabled by default.
- **What would make this >=90%:** Needs TASK-07 tests to confirm all states; implementation evidence is strong at 88%.
- **Rollout / rollback:**
  - Rollout: TypeScript will error in `Checkout.tsx` until TASK-05 lands — must deploy TASK-04 and TASK-05 together.
  - Rollback: Revert file.
- **Documentation impact:** None.
- **Notes / references:** Luggage icon pattern in `CheckoutTable.tsx:218-224` for styling reference.

---

### TASK-05: Wire Checkout.tsx — subscribe, pending state, toggle handler
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/reception/src/components/checkout/Checkout.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/checkout/Checkout.tsx` (modified — new import, new state, new useMemo field, new handler, new props to CheckoutTable)
- **Depends on:** TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-07
- **Confidence:** 88%
  - Implementation: 88% — Pattern is bagStorage analogue. Key addition is `useState<Set<string>>(new Set())` for pending occupantIds and the `onToggleFridge` callback. All integration points are confirmed.
  - Approach: 90% — All approach decisions are made; disabled-during-write is chosen.
  - Impact: 85% — Completes the feature end-to-end. Risk is low — other checkout functionality is unchanged.
  - Held-back test (Implementation at 88%): No held-back test needed.
- **Acceptance:**
  - `useFridgeStorageData` imported and subscribed; `fridgeStorage`, `fridgeStorageLoading`, `fridgeStorageError` destructured
  - `fridgeStorageLoading` merged into consolidated `loading` boolean (line 102 block)
  - `fridgeStorageError` merged into consolidated `error` (line 113 block)
  - `const [pendingFridgeOccupantIds, setPendingFridgeOccupantIds] = useState<Set<string>>(new Set())` declared
  - `const { setFridgeUsed } = useSetFridgeUsedMutation()` imported and called
  - `guest.fridgeUsed` populated in useMemo from `fridgeStorage[occupantId]?.used === true` (replaces `fridge: ""`)
  - `onToggleFridge` callback: adds occupantId to pending set → calls `setFridgeUsed(occupantId, !currentValue)` → `finally`: removes from pending set → `catch`: shows toast
  - `<CheckoutTable>` receives `onToggleFridge` and `pendingFridgeOccupantIds`
  - `pnpm typecheck` passes (no TypeScript errors)
  - **Expected user-observable behavior:**
    - [ ] On page load: FRIDGE column reflects Firebase state immediately
    - [ ] Toggle click: button disables; icon updates after Firebase write completes (< 1s in normal conditions)
    - [ ] Toggle error: toast message appears; button re-enables; Firebase state unchanged
    - [ ] Toggle reversal: clicking an already-set fridge sets `used: false`; icon disappears
- **Engineering Coverage:**
  - UI / visual: Required — renders `<CheckoutTable pendingFridgeOccupantIds={...} />` which controls disabled state
  - UX / states: Required — all four states (unset, set, pending, error) flow through this component
  - Security / privacy: N/A — no new auth surface
  - Logging / observability / audit: Required — `console.error` + `showToast` in catch block of `onToggleFridge`
  - Testing / validation: N/A — tested in TASK-07 (integration test)
  - Data / contracts: Required — `fridgeUsed: fridgeStorage[occupantId]?.used === true` replaces `fridge: ""` at useMemo line 323; `CheckoutTable` props updated
  - Performance / reliability: Required — `Set<string>` state uses functional update pattern to avoid stale closures: `setPendingFridgeOccupantIds(prev => new Set([...prev, occupantId]))` / `setPendingFridgeOccupantIds(prev => { const next = new Set(prev); next.delete(occupantId); return next; })`
  - Rollout / rollback: N/A — revert file to roll back
- **Consumer tracing:**
  - `fridgeStorage[occupantId]?.used === true` — produces `Guest.fridgeUsed: boolean` → consumed by `CheckoutTable.tsx` FRIDGE cell (TASK-04). Full chain complete.
  - `pendingFridgeOccupantIds` — produced here, consumed by `CheckoutTable.tsx` as prop (TASK-04). Full chain complete.
  - `onToggleFridge` — produced here, consumed by `CheckoutTable.tsx` `<Button onClick>` (TASK-04). Full chain complete.
  - `fridgeStorageLoading` / `fridgeStorageError` — merged into consolidated loading/error in Checkout.tsx exactly as bagStorage at lines 102-122. No silent fallback.
- **Validation contract (integration-level, full tests in TASK-07):**
  - TC-01: `useFridgeStorageData` returns `{ occ_1: { used: true } }` → `Guest.fridgeUsed === true` for occ_1 row
  - TC-02: Toggle click for occ_1 → `setFridgeUsed("occ_1", false)` called; `pendingFridgeOccupantIds` contains `"occ_1"` during write
  - TC-03: `setFridgeUsed` rejects → toast shown; `pendingFridgeOccupantIds` cleared
- **Execution plan:** Red → Green → Refactor — (1) Import `useFridgeStorageData` and `useSetFridgeUsedMutation`. (2) Add subscription call and destructure. (3) Merge loading/error. (4) Add `useState` for pending set. (5) Add `useCallback` `onToggleFridge` handler with try/finally. (6) Update useMemo: replace `fridge: ""` with `fridgeUsed: fridgeStorage[occupantId]?.used === true`. (7) Pass new props to `<CheckoutTable>`. (8) Run typecheck.
- **Planning validation:**
  - Checks run: Read `Checkout.tsx` fully (lines 1-371). Confirmed loading/error consolidation pattern at lines 102-122. Confirmed bagStorage subscription pattern at lines 96-99. Confirmed useMemo guest derivation at lines 291-329. Confirmed `<CheckoutTable>` render at lines 358-363.
  - Confirmed `useCallback` is already imported at line 5 — no new import needed for handler.
  - Confirmed `useState` is already imported at line 5.
  - Confirmed `showToast` utility is imported at line 27.
  - Unexpected findings: None.
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - `finally` block always clears pending set — button cannot stay stuck in disabled state.
  - `Set<string>` functional update avoids stale-closure bugs.
  - `fridgeStorage[occupantId]?.used === true` is safe — optional chaining handles absent/null node.
- **What would make this >=90%:** Needs TASK-07 integration test evidence; implementation is clear at 88%.
- **Rollout / rollback:**
  - Rollout: Must deploy with TASK-04 (TypeScript contract enforced across both files).
  - Rollback: Revert file. TASK-04 must also be reverted simultaneously.
- **Documentation impact:** None.
- **Notes / references:** bagStorage pattern at `Checkout.tsx:96-99, 102-122, 291-329`.

---

### TASK-06: Archive, delete-guest cleanup, and Firebase rules
- **Type:** IMPLEMENT
- **Deliverable:** Updated `useArchiveCheckedOutGuests.ts`, `useDeleteGuestFromBooking.ts`, `database.rules.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/mutations/useArchiveCheckedOutGuests.ts` (modified — additive fridgeStorage block)
  - `apps/reception/src/hooks/mutations/useDeleteGuestFromBooking.ts` (modified — additive one-liner)
  - `apps/reception/database.rules.json` (modified — new fridgeStorage rule)
- **Depends on:** TASK-01
- **Blocks:** TASK-07
- **Confidence:** 90%
  - Implementation: 90% — Archive: direct extension of bagStorage block at lines 187-297 — read, copy to archive, null. Delete: one-liner alongside line 119. Rules: new block, no `newData.exists()`.
  - Approach: 95% — All three changes are additive and confirmed by analysis.
  - Impact: 85% — No existing behavior changed; all three changes are additive.
  - Held-back test (Implementation at 90%): No held-back test needed.
- **Acceptance:**
  - `useArchiveCheckedOutGuests.ts`: `fridgeStorage/<occupantId>` read → `archive/fridgeStorage/<occupantId>` copied → live path nulled (same pattern as bagStorage block)
  - `useDeleteGuestFromBooking.ts`: `updates["fridgeStorage/${occupantId}"] = null` added alongside `updates["bagStorage/${occupantId}"] = null`
  - `database.rules.json`: new `"fridgeStorage"` object with `".read": "auth != null"` and `"$occupantId": { ".write": "<role-gated, no newData.exists()>" }`
  - Write rule is role-gated (owner/developer/admin/manager/staff) WITHOUT `!data.exists()` and WITHOUT `newData.exists()` — null writes must be allowed for archive and delete flows. Rule expression: `auth != null && root.child('userProfiles').child(auth.uid).exists() && (role check: owner||developer||admin||manager||staff)`
  - `pnpm typecheck` passes
- **Engineering Coverage:**
  - UI / visual: N/A — backend/rules only
  - UX / states: N/A — backend/rules only
  - Security / privacy: Required — explicit Firebase rule with role-gated write; null writes allowed for archive/delete flows
  - Logging / observability / audit: N/A — archive/delete follow existing patterns (no extra logging)
  - Testing / validation: N/A — tested in TASK-07 (rules test + delete test)
  - Data / contracts: Required — archive path `archive/fridgeStorage/<occupantId>` is new; delete null is additive to existing updates map
  - Performance / reliability: N/A — additive read+write in existing bulk update operations
  - Rollout / rollback: N/A — additive changes; Firebase node harmless if not archived/deleted
- **Validation contract:**
  - TC-01: Archive flow — `fridgeStorage/occ_1` exists → `archive/fridgeStorage/occ_1` populated, live path nulled
  - TC-02: Archive flow — `fridgeStorage/occ_1` absent → no archive write, live path null set anyway (same as bagStorage)
  - TC-03: Delete guest flow — `updates` map includes `"fridgeStorage/occ_1": null`
  - TC-04: Firebase rules — authenticated staff can write `fridgeStorage/occ_1 = { used: true }` (create)
  - TC-05: Firebase rules — authenticated staff can write `fridgeStorage/occ_1 = null` (delete/null write)
  - TC-06: Firebase rules — unauthenticated caller cannot write `fridgeStorage/occ_1`
- **Execution plan:** Red → Green — Three separate additive edits. (1) Archive hook: add fridgeStorage block after bagStorage block (lines 294-297), following identical pattern. (2) Delete hook: add one-liner after bagStorage null at line 119. (3) Rules: add `fridgeStorage` block before `$other` catch-all.
- **Planning validation:**
  - Checks run: Read archive hook lines 187-297 in full. Read delete hook lines 106-119. Read `database.rules.json` fully (confirmed `$other` wildcard position at end; confirmed no node named `completedTasks` or `bagStorage` exists as an explicit named rule — `$other` wildcard at line 263 covers them with `".write": "auth != null"`, no role gating). The fridgeStorage rule must be composed from the role-check expression pattern used by `tillShifts` and similar nodes, but WITHOUT `!data.exists()` and WITHOUT `newData.exists()` — null writes must be permitted for the archive and delete-guest flows. Explicit rule structure to use: `".write": "auth != null && root.child('userProfiles').child(auth.uid).exists() && (root.child('userProfiles').child(auth.uid).child('roles').child('owner').val() == true || root.child('userProfiles').child(auth.uid).child('roles').child('developer').val() == true || root.child('userProfiles').child(auth.uid).child('roles').child('admin').val() == true || root.child('userProfiles').child(auth.uid).child('roles').child('manager').val() == true || root.child('userProfiles').child(auth.uid).child('roles').child('staff').val() == true)"`.
  - Unexpected findings: None.
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - Archive null-path: if `fridgeStorage/<occupantId>` doesn't exist, `bagStorageSnap.exists()` guard means archive write is skipped but live null is still queued — correct behavior, fridge mirrors this.
  - Rules deploy order: `$other` wildcard covers the node until the explicit rule is deployed — no security gap during rolling deploy.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Rules change can deploy before or alongside code. Archive/delete changes are additive and safe at any time.
  - Rollback: Revert the three file changes. Firebase node persists harmlessly.
- **Documentation impact:** None.
- **Notes / references:** `apps/reception/src/hooks/mutations/useArchiveCheckedOutGuests.ts:187-297`, `apps/reception/src/hooks/mutations/useDeleteGuestFromBooking.ts:119`, `apps/reception/database.rules.json`

---

### TASK-07: Tests — all layers
- **Type:** IMPLEMENT
- **Deliverable:** New and updated test files across schema, hooks, mutation, component, integration, rules, parity
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/schemas/__tests__/fridgeStorageSchema.test.ts` (new)
  - `apps/reception/src/hooks/data/__tests__/useFridgeStorageData.test.ts` (new)
  - `apps/reception/src/hooks/mutations/__tests__/useSetFridgeUsedMutation.test.ts` (new)
  - `apps/reception/src/components/checkout/__tests__/CheckoutTable.component.test.tsx` (modified — update fridge test case)
  - `apps/reception/src/components/checkout/__tests__/Checkout.test.tsx` (modified — add fridge integration test case)
  - `apps/reception/src/rules/__tests__/databaseRules.test.ts` (modified — add fridgeStorage rule tests)
  - `apps/reception/src/hooks/mutations/__tests__/useDeleteGuestFromBooking.test.ts` (modified — add fridgeStorage to expected updates map)
  - `apps/reception/src/parity/__tests__/checkout-route.parity.test.tsx` (modified — regenerate snapshot)
- **Depends on:** TASK-05, TASK-06
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — All test patterns have analogues in the existing codebase. `databaseRules.test.ts` uses `@firebase/rules-unit-testing` — may require setup/teardown for the new test cases but the pattern is established. Parity snapshot is auto-regenerated by running the test with `--updateSnapshot`.
  - Approach: 90% — Clear pattern from existing tests.
  - Impact: 85% — Tests are CI gate; if any fail, the build fails.
  - Held-back test (Implementation at 85%): No held-back test needed (not at 80).
- **Acceptance:**
  - `fridgeStorageSchema.test.ts`: TC-01 through TC-04 from TASK-01 pass
  - `useFridgeStorageData.test.ts`: TC-01 through TC-03 from TASK-02 pass
  - `useSetFridgeUsedMutation.test.ts`: TC-01 through TC-03 from TASK-03 pass
  - `CheckoutTable.component.test.tsx`: updated fridge test (line 114 block) uses `fridgeUsed: true` and asserts `Refrigerator` icon title visible and toggle button present; adds disabled-state test case
  - `Checkout.test.tsx`: new test case mocks `useFridgeStorageData` (same pattern as `bagStorageDataMock`), mocks `useSetFridgeUsedMutation`, renders `Checkout`, clicks toggle button, asserts mutation hook called with correct args
  - `databaseRules.test.ts`: TC-04 through TC-06 from TASK-06 pass (create, null-write, unauthenticated-deny)
  - `useDeleteGuestFromBooking.test.ts`: expected `updates` map at line 80 includes `"fridgeStorage/occ1": null`
  - Parity snapshot: regenerated (`--updateSnapshot`) and committed
  - All tests pass in CI
- **Engineering Coverage:**
  - UI / visual: Required — CheckoutTable component tests cover icon and button rendering
  - UX / states: Required — component tests cover disabled state; integration test covers toggle interaction
  - Security / privacy: Required — rules tests cover create, null-write, unauthenticated-deny
  - Logging / observability / audit: N/A — no instrumentation tests
  - Testing / validation: Required — this task IS the testing layer
  - Data / contracts: Required — schema tests validate Zod contract; hook tests validate Firebase path and return shape; delete hook test validates updates map
  - Performance / reliability: N/A — no load or timing tests
  - Rollout / rollback: N/A — test-only task
- **Consumer tracing:**
  - All new test files are self-contained consumers of the production code from TASK-01–TASK-06. No additional consumer tracing needed.
- **Validation contract:**
  - Per TASK-01–TASK-06 TC rows above (all carried into this task's test implementation).
  - Additional: CI must not fail on any modified or new test file.
- **Execution plan:** Red → Green — (1) Write schema test (new file, analogue of `bagStorageSchema.test.ts`). (2) Write `useFridgeStorageData` hook test (mock `useFirebaseSubscription`, assert return shape). (3) Write `useSetFridgeUsedMutation` test (mock Firebase `update`, assert calls). (4) Update `CheckoutTable.component.test.tsx` line 114 block. (5) Add `Checkout.test.tsx` integration case (mock `useFridgeStorageData` and `useSetFridgeUsedMutation`, render, click, assert). (6) Update `databaseRules.test.ts` (add three cases inside existing `describe` block). (7) Update `useDeleteGuestFromBooking.test.ts` (add `"fridgeStorage/occ1": null` to `toEqual` at line 80). (8) Run parity snapshot test with `--updateSnapshot`.
- **Planning validation:**
  - Checks run: Read `CheckoutTable.component.test.tsx` lines 114-141 (fridge test block). Read `checkout-route.parity.test.tsx` structure. Read `databaseRules.test.ts` setup pattern (lines 17-55). Read `useDeleteGuestFromBooking.test.ts` lines 75-94. Confirmed mock patterns for `useBagStorageData` in both `Checkout.test.tsx` and `checkout-route.parity.test.tsx` — `useFridgeStorageData` mock follows the same shape.
  - Confirmed: `Checkout.test.tsx` renders the real `Checkout` component. `onToggleFridge` is an internal callback — the test asserts it by mocking `useSetFridgeUsedMutation` and checking the mock was called after the toggle button is clicked, not by mocking the prop directly.
  - Confirmed: `databaseRules.test.ts` uses `initializeTestEnvironment` from `@firebase/rules-unit-testing` — the existing setup and teardown handles new test cases without structural change.
  - Unexpected findings: `useDeleteGuestFromBooking.test.ts` uses `toEqual` on exact `updates` map — adding `fridgeStorage/occ1: null` will cause the existing test to fail until this task is complete. This is expected and acceptable since TASK-06 and TASK-07 are in the same final wave.
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - Parity snapshot: use `--updateSnapshot` flag on the specific test file only. Do not update all snapshots globally.
  - Rules test: ensure null-write test actually uses `remove()` or `set(null)` — Firebase RTDB treats `null` as deletion.
- **What would make this >=90%:** Execution against actual CI results showing all tests pass.
- **Rollout / rollback:**
  - Rollout: Test files are inert in production; deploy with rest of changes.
  - Rollback: Revert test files alongside production files.
- **Documentation impact:** None.
- **Notes / references:** `apps/reception/src/schemas/__tests__/bagStorageSchema.test.ts`, `apps/reception/src/parity/__tests__/checkout-route.parity.test.tsx`, `apps/reception/src/rules/__tests__/databaseRules.test.ts:17-55`, `apps/reception/src/hooks/mutations/__tests__/useDeleteGuestFromBooking.test.ts:75-94`

---

## Risks & Mitigations
- TASK-04 + TASK-05 must deploy together (TypeScript enforces it — TASK-04 changes `Guest.fridge?: string` which is referenced in `Checkout.tsx` line 323; TASK-05 fixes the reference).
- `useDeleteGuestFromBooking.test.ts` will fail after TASK-06 lands until TASK-07 updates the expected map — acceptable since both are in wave 4.
- Parity snapshot must be regenerated before pushing TASK-07 — stale snapshot causes deterministic CI failure.
- Firebase rules null-write behavior: verified that omitting `newData.exists()` allows null writes. Must not accidentally copy `keycardAssignments` rule pattern.

## Observability
- Logging: `console.error` + `showToast` on toggle failure in `onToggleFridge` catch block.
- Metrics: None added.
- Alerts/Dashboards: None added.

## Acceptance Criteria (overall)
- [ ] FRIDGE column shows `Refrigerator` icon when `fridgeStorage/<occupantId>.used === true`, blank otherwise
- [ ] Staff can toggle the flag per row; toggle disables during write and re-enables on success/error
- [ ] Toggle error shows toast; Firebase state unchanged
- [ ] `fridgeStorage` node archived on guest archival
- [ ] `fridgeStorage` node nulled on guest deletion
- [ ] Explicit Firebase security rule for `fridgeStorage` deployed (no `newData.exists()`)
- [ ] All new and modified tests pass in CI
- [ ] `pnpm typecheck` and `pnpm lint` pass for reception app

## Decision Log
- 2026-03-13: Operator confirmed boolean flag `{ used: boolean }` (not free-text), inline toggle on checkout screen, `Refrigerator` icon.
- 2026-03-13: Analysis chose disabled-during-write (Option A) over optimistic update (Option B) — no rollback complexity.
- 2026-03-13: Firebase rule must not include `newData.exists()` — null writes required for archive and delete flows. `keycardAssignments` pattern rejected (has `newData.exists()`). No existing named node lacks `newData.exists()` while also being role-gated. Rule must be composed from scratch using the standard role-check expression (owner||developer||admin||manager||staff) without any `data.exists()` or `newData.exists()` guards.
- [Adjacent: delivery-rehearsal] `useBagStorageData` has no dedicated hook unit test (pre-existing gap) — not in scope for this plan, route to future fact-find if needed.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create fridgeStorage schema and types | Yes | None | No |
| TASK-02: Create useFridgeStorageData read hook | Yes — TASK-01 produces `FridgeStorage` type | None | No |
| TASK-03: Create useSetFridgeUsedMutation write hook | Yes — TASK-01 produces type contract for write payload | None | No |
| TASK-04: Update CheckoutTable — type, icon, toggle button | Yes — TASK-01 produces `Guest.fridgeUsed` type | [Type contract gap / Minor]: TypeScript will error in `Checkout.tsx` line 323 until TASK-05 lands — expected and acceptable since TASK-04+05 deploy together | No — by design; deploy pair |
| TASK-05: Wire Checkout.tsx | Yes — TASK-02 provides `fridgeStorage` data; TASK-03 provides `setFridgeUsed`; TASK-04 provides updated `CheckoutTableProps` | None | No |
| TASK-06: Archive, delete-guest, Firebase rules | Yes — TASK-01 provides type context; changes are additive; no dependency on TASK-02–05 | None | No |
| TASK-07: Tests — all layers | Yes — TASK-05 and TASK-06 complete; all production code exists | [Ordering / Minor]: `useDeleteGuestFromBooking.test.ts` toEqual will fail after TASK-06 but before TASK-07 in isolation — acceptable since both land in wave 4 together | No — wave 4 deploys together |

## Overall-confidence Calculation
- TASK-01: 95% × S(1) = 95
- TASK-02: 92% × S(1) = 92
- TASK-03: 90% × S(1) = 90
- TASK-04: 88% × M(2) = 176
- TASK-05: 88% × M(2) = 176
- TASK-06: 90% × S(1) = 90
- TASK-07: 85% × M(2) = 170
- Sum(weighted): 889 / Sum(weights): 10 = **88.9% → 89% (rounded to nearest 5%: 90%)**
- Reported Overall-confidence: **90%** (88.9% rounds to nearest 5% = 90%; frontmatter updated to match).
