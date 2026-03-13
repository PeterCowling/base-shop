---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: reception-checkout-fridge-tracking
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-checkout-fridge-tracking/fact-find.md
Related-Plan: docs/plans/reception-checkout-fridge-tracking/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Fridge Item Tracking on the Checkout Screen — Analysis

## Decision Frame
### Summary
The checkout screen already has a FRIDGE column that always shows blank. All operator decisions are confirmed: data model is `{ used: boolean }` at `fridgeStorage/<occupantId>`, write path is an inline toggle per row, display is an icon. The implementation follows the bag-storage pattern exactly, extended with a direct-write mutation hook (bag storage is set via Prime; fridge is set directly from the checkout screen). The one design decision not fixed by the operator is how the toggle handles the async write window — this analysis resolves it.

### Goals
- Staff toggle fridge-used per guest on the checkout screen.
- FRIDGE column shows `Refrigerator` icon when `used === true`, blank otherwise.
- Fridge flag is archived alongside the guest.

### Non-goals
- No free-text, no item list, no POS transaction.
- No fridge UI on any other screen.

### Constraints & Assumptions
- Constraints:
  - Must follow bag-storage read pattern (Firebase node, Zod schema, data hook, `Checkout.tsx` integration).
  - Write path via new mutation hook using Firebase `update()`.
  - `Refrigerator` icon confirmed available in lucide-react installed in reception app.
  - Tests CI-only.
- Assumptions:
  - Toggle is per-occupant (not per-booking).
  - All authenticated staff roles may write (same as all other guest-facing mutations).

## Inherited Outcome Contract

- **Why:** Staff need to record at checkout whether a guest used the fridge, and see that flag on the checkout screen so nothing is missed before the guest leaves.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can toggle a fridge-used flag per guest on the checkout screen; the FRIDGE column shows a fridge icon when the flag is set, so staff know to retrieve fridge items before the guest departs.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-checkout-fridge-tracking/fact-find.md`
- Key findings used:
  - `Guest.fridge?: string` already exists in `CheckoutTable.tsx` — will change to `fridgeUsed?: boolean`
  - `bagStorage` pattern is the complete analogue for the read path
  - `Refrigerator` icon confirmed present in lucide-react version installed in the app
  - `useArchiveCheckedOutGuests` needs an additive `fridgeStorage` block
  - Existing `CheckoutTable.component.test.tsx` fridge test uses stale `fridge: "Milk"` — must update
  - `checkout-route.parity.test.tsx` snapshot must be regenerated
  - No per-row async pending state precedent in checkout screen — the one open design point

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Pattern consistency | Codebase coherence; reduces future maintenance cost | High |
| UX correctness | Staff must not be able to double-fire the toggle or get stuck in a broken state | High |
| Test coverage completeness | CI gate; CI-only test runs | High |
| Implementation simplicity | Small internal tool; minimal code surface | Medium |
| Rollback safety | No migration, no feature flag needed | Low (already guaranteed) |

## Options Considered

Two approaches exist only for the toggle pending-state handling. Everything else (Firebase path, schema, hook structure, icon choice, archive update) is fixed by the operator decisions and the established pattern.

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Disabled-during-write | Disable the toggle button while the Firebase `update()` is in flight. Local state: `isPending` boolean per row (lifted into `CheckoutTable` or managed in `Checkout.tsx` via a `Set` of pending occupantIds). On success: Firebase subscription delivers updated value → button re-enables with new state. On error: toast + re-enable. | Simple. No optimistic-state rollback logic. Consistent with how the Complete button works (it already invokes async and implicitly blocks re-click via its callback). Matches existing patterns in the codebase. | Visible latency: button is briefly greyed out. For a fast local Firebase write (< 200ms) this is barely perceptible. | None material. | Yes |
| B — Optimistic update | Immediately flip `fridgeUsed` in local state before the Firebase `update()` returns. On error: roll back the local state + show toast. | Zero perceived latency. | Adds rollback logic — a second state path. More code. Overkill for a < 200ms write to a local Firebase RTDB. The bag-storage display has no rollback logic and no issues reported. | Rollback failure leaves UI out of sync with Firebase. | Yes, but not preferred |

## Engineering Coverage Comparison

| Coverage Area | Option A (Disabled-during-write) | Option B (Optimistic update) | Chosen implication (Option A) |
|---|---|---|---|
| UI / visual | `Refrigerator` icon, toggle button disabled during write. Standard `Button` component with `disabled` prop — already supported by design system. | `Refrigerator` icon, instant visual flip. No disabled state needed. | Icon + `Button` with `disabled` prop during async write. Simple, no extra state machine. |
| UX / states | Empty: blank cell. Loaded/false: icon not shown, toggle button shown. Loaded/true: icon shown + toggle button shown. Pending: button disabled. Error: toast + button re-enabled. | Same states minus pending/disabled. Adds: optimistic state + rollback state. | Pending state managed via `isPending` per occupant in `Checkout.tsx` (a `Set<string>` of occupantIds currently writing). Passed to `CheckoutTable` alongside `onToggleFridge`. |
| Security / privacy | Explicit `fridgeStorage` Firebase rule with role-gated write. Same for both options. | Same. | Add `fridgeStorage` rule to `database.rules.json`. |
| Logging / observability / audit | `console.error` + `showToast` on mutation failure. Same for both. | Same. | Follow existing pattern. |
| Testing / validation | `isPending` logic is trivial to test — mock the mutation hook to not resolve and assert button is disabled. | Rollback logic requires additional test cases for failure path. | Fewer test paths to cover under Option A. |
| Data / contracts | `Guest.fridgeUsed?: boolean` replaces `Guest.fridge?: string`. `CheckoutTableProps` gains `onToggleFridge` and `pendingFridgeOccupantIds?: Set<string>`. New schema, types, data hook, mutation hook. Same for both options (type contract is identical). | Same. | Breaking type change on `Guest` interface — all callsites updated. |
| Performance / reliability | Identical Firebase write in both cases. Disabled button prevents double-fire without needing a debounce guard. | Same Firebase write. Requires rollback on error, which is a second async state update. | Option A is marginally more reliable (no rollback race condition). |
| Rollout / rollback | No feature flag. Revert 4–5 files. Firebase node persists harmlessly. Same for both. | Same. | No flag needed. |

## Chosen Approach
- **Recommendation:** Option A — Disabled-during-write.
- **Why this wins:** It requires no rollback logic. Firebase RTDB writes to a local node are fast enough that the disabled window is imperceptible. It is simpler to test — the pending state has exactly one success path and one error path, both trivially mockable. Option B's zero-latency advantage is not worth the rollback complexity for a < 200ms internal-tool write.
- **What it depends on:** Firebase RTDB being reachable (same dependency as the rest of the checkout screen — no new dependency introduced).

### Rejected Approaches
- Option B (Optimistic update) — Rejected. The latency benefit is negligible for a < 200ms internal-tool write. The rollback code adds a second state path and additional test cases with no material UX improvement.

### Open Questions (Operator Input Required)
None — all operator decisions confirmed in the fact-find update.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Fridge flag recording | No digital step. Paper/verbal only. | Guest hands fridge items to staff at checkout. | 1. Staff opens checkout screen. 2. Guest row shows FRIDGE column with a toggle button. 3. Staff clicks toggle — button disables immediately. 4. Firebase `update()` writes `fridgeStorage/<occupantId> = { used: true }`. 5. Firebase subscription delivers update → `Refrigerator` icon appears; button re-enables. 6. Clicking again reverses: `used: false`, icon disappears. | Rest of checkout flow (loans, keycard, Complete button) unchanged. | Toggle must disable during write to prevent double-fire. Error path: toast + re-enable. |
| FRIDGE column display | `{guest.fridge \|\| ""}` — always blank. | Firebase subscription delivers `fridgeUsed: true`. | `Refrigerator` icon shown in FRIDGE cell when `fridgeUsed === true`; blank otherwise. Consistent with Luggage icon for bag storage. | Column header, table layout, all other cells unchanged. | Icon import must be added to `CheckoutTable.tsx`; existing `Guest.fridge?: string` field changes to `fridgeUsed?: boolean`. |
| Guest archival | `useArchiveCheckedOutGuests` does not cover `fridgeStorage`. | Archival triggered for past-checkout occupants. | `fridgeStorage/<occupantId>` read → copied to `archive/fridgeStorage/<occupantId>` → live path nulled. | All other archival paths unchanged. | Additive only; no migration. |
| Guest deletion | `useDeleteGuestFromBooking` nulls `bagStorage/<occupantId>` at line 119 but has no fridge equivalent. | Operator deletes a guest record. | `fridgeStorage/<occupantId>` is nulled in the same `updates` map alongside `bagStorage`. Prevents orphaned fridge records. | All other deletion paths unchanged. | Additive one-liner; no migration. |
| Firebase security | `$other` wildcard covers `fridgeStorage`. | Deploy of updated `database.rules.json`. | Explicit `fridgeStorage` rule block: read for any authenticated user; write gated on staff/admin/manager/developer/owner role (same as all other guest-facing nodes). | All other rules unchanged. | Must deploy `database.rules.json` changes before or alongside code changes. |

## Planning Handoff
- Planning focus:
  - Task sequencing: schema + types → data hook → mutation hook → `CheckoutTable.tsx` type/UI change → `Checkout.tsx` wiring → archive hook → delete-guest cleanup → Firebase rules → tests (schema, hook, mutation, component, integration, parity snapshot).
  - Toggle pending state: `Checkout.tsx` manages a `pendingFridgeOccupantIds: Set<string>`, passed down to `CheckoutTable` as a prop. On toggle call: add occupantId to set; on success/error: remove from set. `CheckoutTable` uses the set to compute `disabled` prop on the toggle button.
  - `CheckoutTableProps` change: add `onToggleFridge: (guestId: string, bookingRef: string, currentValue: boolean) => void` and `pendingFridgeOccupantIds?: Set<string>`.
  - `Guest` interface change: `fridge?: string` → `fridgeUsed?: boolean`. All callers: `Checkout.tsx` (useMemo line 323), `CheckoutTable.component.test.tsx`, `checkout-route.parity.test.tsx`.
  - Lucide icon: `Refrigerator` from `lucide-react` — confirmed present. Import alongside existing icon imports in `CheckoutTable.tsx`.
  - Firebase rules: add `fridgeStorage` block with a role-gated write rule (any of owner/developer/admin/manager/staff) that does **not** include `newData.exists()` — the archive and delete-guest flows both null `fridgeStorage/<occupantId>`, so the rule must permit null writes. Model the write predicate after `completedTasks` (any per-occupant write allowed for authenticated staff, including nulls).
  - **Delete-guest cleanup**: `useDeleteGuestFromBooking.ts` nulls `bagStorage/<occupantId>` at line 119 when a guest is deleted. The same null must be added for `fridgeStorage/<occupantId>` to avoid orphaned records. This is an additive one-liner alongside the existing bag-storage null.
- Validation implications:
  - Must write: `fridgeStorageSchema.test.ts` (schema unit), `useFridgeStorageData` hook test, `useSetFridgeUsedMutation` unit test, updated `CheckoutTable.component.test.tsx` (replace `fridge: "Milk"` test with `fridgeUsed: true` icon+button assertion, add disabled-during-pending test), regenerate `checkout-route.parity.test.tsx` snapshot.
  - `Checkout.test.tsx` integration case: mock `useFridgeStorageData` (same pattern as `bagStorageDataMock` at line 83), mock the new mutation hook `useSetFridgeUsedMutation`, render the `Checkout` component, click the toggle button (found by aria-label), assert the mocked mutation hook was called with the correct occupantId and boolean value. Do not attempt to mock `onToggleFridge` directly — it is an internal callback, not an injected prop.
  - `useDeleteGuestFromBooking.test.ts` must be updated: the existing `toEqual` assertion at line 80 checks the exact `updates` map; adding `fridgeStorage/<occupantId>: null` to the production hook will cause this test to fail. The test expectation must include `"fridgeStorage/occ1": null` alongside `"bagStorage/occ1": null`.
  - `apps/reception/src/rules/__tests__/databaseRules.test.ts` exists and must be updated: add test cases asserting (a) authenticated staff can write (create) `fridgeStorage/<occupantId>`, (b) authenticated staff can null (delete) `fridgeStorage/<occupantId>` — required by archive and delete-guest flows, (c) any authenticated user can read `fridgeStorage/<occupantId>`, and (d) unauthenticated callers cannot write.
  - All tests run in CI only — push to trigger.
- Sequencing constraints:
  - Schema + types must exist before hook files (TypeScript import ordering).
  - `CheckoutTable.tsx` type change must land before `Checkout.tsx` wiring (TypeScript will catch mismatches).
  - Firebase rules update is independent and can land in the same commit.
  - Archive hook change is independent — can be a separate task or bundled.
- Risks to carry into planning:
  - `Set<string>` as a React prop: must use `useState` with functional updates to avoid stale closure issues. Plan must specify `useState<Set<string>>(new Set())` and update pattern.
  - Parity snapshot must be regenerated — CI will fail if stale snapshot remains.

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Stale parity snapshot causes CI failure | Certain | Low | Snapshot is regenerated during build task, not analysis | Plan must include explicit "update snapshot" step |
| `Set<string>` state mutation pitfall | Medium | Medium — subtle React bug | Implementation detail, not a design decision | Plan must specify immutable `Set` update pattern (`new Set([...prev, id])`) |
| Toggle error leaves button disabled if error handler is incomplete | Low | Low | Implementation detail | Plan must ensure `finally` block always removes from pending set |
| Firebase rules deploy order | Low | Low — `$other` wildcard covers new node until explicit rule is deployed | Not a blocking risk | Note in plan: rules change is safe to deploy before or alongside code |
| Orphaned `fridgeStorage` record on guest deletion | Low | Low — small data, harmless | `useDeleteGuestFromBooking` confirmed to null `bagStorage` but not fridge — must add fridge null to same hook | Plan must include `useDeleteGuestFromBooking` update as a task |

## Planning Readiness
- Status: Go
- Rationale: All operator decisions confirmed. Approach chosen. Engineering coverage fully mapped. No open operator questions. Implementation path is a direct extension of the bag-storage pattern with one new design point (disabled-during-write pending state) fully resolved.
