---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-01
Last-reviewed: 2026-03-01
Last-updated: 2026-03-01
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-till-drawer-lock
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Till Drawer Lock Plan

## Summary

The reception till already blocks a non-owner from clicking Close/Reconcile (button-level guard in `handleCloseShiftClick`), but three gaps remain: no second-layer guard in `confirmShiftClose`, no manager override path for legitimate handover scenarios, and no audit record when a manager does close on behalf of staff. This plan adds a `DrawerOverrideModal` component (following the `VarianceSignoffModal` pattern), extends the `TillShift` schema and mutation with override fields, and wires a second-layer guard + override flow into `useTillShifts`. All three gaps are closed with unit tests covering normal, blocked, and override paths.

## Active tasks

- [x] TASK-01: Extend TillShift schema and type with override fields
- [x] TASK-02: Extend recordShiftClose mutation to persist override fields
- [x] TASK-03: Create DrawerOverrideModal component
- [x] TASK-04: Add second-layer guard and override wiring in useTillShifts
- [x] CHECKPOINT-05: Horizon checkpoint — verify integration before tests
- [x] TASK-06: Add unit tests for lock, override, and guard paths

## Goals

- Close the manager override gap: a manager can legitimately close/reconcile another staff member's shift by authenticating and logging a reason.
- Add a second-layer trust boundary in `confirmShiftClose` using the DB-authoritative `openShift.user` value.
- Persist override metadata (`overriddenBy`, `overriddenByUid`, `overriddenAt`, `overrideReason`) in Firebase for the audit trail.
- Cover all three paths with unit tests.

## Non-goals

- Changes to the 3-step close form, denomination counting, or variance signoff flow.
- Changes to `confirmShiftOpen` or open-shift blocking logic.
- UI changes to `TillShiftHistory` display — `TillShiftHistory` uses explicit table columns; override fields will be stored in Firebase (via schema extension) but will not be rendered until a future UI update adds the columns. That future work is out of scope for this plan.
- Adding `openedByUid` to `TillShift` (operationally unnecessary for BRIK's single-team context — documented as known limitation).

## Constraints & Assumptions

- Constraints:
  - Override modal must use `verifyManagerCredentials` (no inline Firebase call).
  - New modal uses `withModalBackground` HOC, matching `VarianceSignoffModal`/`PasswordReauthModal`.
  - Schema changes update both `tillShiftSchema.ts` (Zod) and `tillShiftData.ts` (TS interface) atomically in TASK-01.
  - Second-layer guard in `confirmShiftClose` checks `openShift.user` (from `findOpenShift(cashCounts)` — already called at line 416–423), NOT `shiftOwner` ephemeral state.
  - Tests run in CI only; do not run `jest` locally.
- Assumptions:
  - `MANAGEMENT_ACCESS` role set (`["owner", "developer", "admin", "manager"]`) is correct for override — unchanged from `verifyManagerCredentials` today.
  - Same-user block in `DrawerOverrideModal` uses name-based comparison as the primary mechanism (adequate for BRIK single-team; `openedByUid` not stored in `CashCount`).
  - Override applies to both `"close"` and `"reconcile"` variants (resolved design decision).

## Inherited Outcome Contract

- **Why:** Worldclass-scan gap — cash-reconciliation-ux domain — no mechanism to allow a manager to legitimately close another staff member's shift with an audit trail.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** When a staff member who did not open a shift attempts to close it, the system blocks them. A manager can override by authenticating and entering a reason, which is stored in the shift audit record.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/reception-till-drawer-lock/fact-find.md`
- Key findings used:
  - Lock check already exists at `useTillShifts.ts:360` — button-level only; `confirmShiftClose` has no second layer.
  - `VarianceSignoffModal` + `verifyManagerCredentials` is the proven reuse pattern for manager credential modals.
  - `confirmShiftClose` already calls `findOpenShift(cashCounts)` at line 416 — authoritative owner available at guard insertion point.
  - Schema/type dual-file pattern: `tillShiftSchema.ts` and `tillShiftData.ts` must be updated atomically.
  - `CloseShiftForm`/`FormsContainer` callback signatures are NOT affected — override gate fires in `handleCloseShiftClick` before the form is shown.

## Proposed Approach

- Option A: Single-modal approach — `DrawerOverrideModal` is presented inline in `TillReconciliation` via hook state; on confirm, override object is stored in hook state and passed through to `confirmShiftClose`.
- Option B: Inline `PasswordReauthModal` + separate reason field — reuse existing `PasswordReauthModal` for credential check, then a second step for reason.
- Chosen approach: **Option A.** `DrawerOverrideModal` is a self-contained component that collects manager credentials + reason in one step, consistent with `VarianceSignoffModal`. Less UI state complexity. Override data is stored in `pendingOverride` hook state (not passed as a parameter through `CloseShiftForm` or `FormsContainer`); `confirmShiftClose` accesses `pendingOverride` via closure — its public callback signature visible to `FormsContainer`/`CloseShiftForm` is unchanged. When `pendingOverride` is present AND `openShift.user !== user.user_name`, close proceeds with override fields persisted via `recordShiftClose`.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extend TillShift schema + type with override fields | 95% | S | Complete (2026-03-01) | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Extend recordShiftClose mutation to persist override fields | 90% | S | Complete (2026-03-01) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Create DrawerOverrideModal component | 90% | M | Complete (2026-03-01) | TASK-01 | TASK-04 |
| TASK-04 | IMPLEMENT | Second-layer guard + override wiring in useTillShifts | 85% | M | Complete (2026-03-01) | TASK-02, TASK-03 | CHECKPOINT-05 |
| CHECKPOINT-05 | CHECKPOINT | Horizon checkpoint — verify integration before tests | 95% | S | Complete (2026-03-01) | TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Unit tests for lock, override, and guard paths | 85% | M | Complete (2026-03-01) | CHECKPOINT-05 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Schema + type foundation; unblocks all other tasks |
| 2 | TASK-02, TASK-03 | TASK-01 | Parallel — mutation extension and modal component are independent |
| 3 | TASK-04 | TASK-02, TASK-03 | Wire guard + modal into hook |
| 4 | CHECKPOINT-05 | TASK-04 | Replan gate before tests |
| 5 | TASK-06 | CHECKPOINT-05 | Tests after all implementation complete |

## Tasks

---

### TASK-01: Extend TillShift schema and type with override fields

- **Type:** IMPLEMENT
- **Deliverable:** Updated `tillShiftSchema.ts` + `tillShiftData.ts` + new `DrawerOverride` type in `types/component/Till.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Build Evidence:** Four override fields added to `tillShiftSchema` (Zod), `TillShift` interface, and `DrawerOverride` interface added to `types/component/Till.ts`. `pnpm typecheck` passes. Committed in HEAD (82972da7f4).
- **Affects:**
  - `apps/reception/src/schemas/tillShiftSchema.ts`
  - `apps/reception/src/types/hooks/data/tillShiftData.ts`
  - `apps/reception/src/types/component/Till.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 95%
  - Implementation: 95% — both files read; exact field list known; strictly additive change with no consumer impact. Held-back test: no single unknown would drop this below 95.
  - Approach: 95% — additive Zod optional fields follow identical pattern to `signedOffBy`/`signedOffByUid`/`signedOffAt`/`varianceNote` already in schema.
  - Impact: 95% — pure type/schema extension; no runtime behaviour change; existing records unaffected.
- **Acceptance:**
  - `tillShiftSchema` parses existing records without error (new fields absent → valid).
  - `tillShiftSchema` parses records with all four override fields present.
  - `TillShift` TypeScript interface has four new optional string fields: `overriddenBy?`, `overriddenByUid?`, `overriddenAt?`, `overrideReason?`.
  - `DrawerOverride` type added to `types/component/Till.ts` with shape `{ overriddenBy: string; overriddenByUid?: string; overriddenAt: string; overrideReason: string }`.
  - `pnpm typecheck` passes on `apps/reception`.
- **Validation contract (TC-XX):**
  - TC-01: Parse a `tillShift` record with no override fields → no Zod error.
  - TC-02: Parse a `tillShift` record with all four override fields populated → all fields present in output.
  - TC-03: TypeScript import of `DrawerOverride` from `types/component/Till.ts` compiles without error.
- **Execution plan:**
  - Red: `tillShiftSchema` lacks override fields; `TillShift` interface lacks them; `DrawerOverride` type does not exist.
  - Green: Add `overriddenBy: z.string().optional()`, `overriddenByUid: z.string().optional()`, `overriddenAt: z.string().optional()`, `overrideReason: z.string().optional()` to `tillShiftSchema`. Add matching `overriddenBy?: string; overriddenByUid?: string; overriddenAt?: string; overrideReason?: string` to `TillShift` interface. Add `DrawerOverride` interface to `types/component/Till.ts`.
  - Refactor: None needed — change is minimal.
- **Planning validation (required for M/L):** None: S effort task.
- **Scouts:** None: no unknowns — schema pattern is identical to existing variance signoff fields.
- **Edge Cases & Hardening:**
  - Existing Firebase records lacking override fields: handled by Zod `.optional()` — fields will be `undefined`, not an error.
  - `tillShiftsSchema` (z.record) wraps `tillShiftSchema` — no change needed, inherits new fields automatically.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: additive schema change — no Firebase migration needed.
  - Rollback: remove the four fields; existing records with override fields ignored by old code (Zod strips unknown fields on `.parse()`).
- **Documentation impact:** None: internal schema extension.
- **Notes / references:**
  - `tillShiftSchema.ts` exports both `tillShiftSchema` and `TillShift` (inferred type) — after TASK-01 the inferred type and the hand-written interface in `tillShiftData.ts` must match. Note: `tillShiftData.ts` defines `TillShift` as a hand-written interface (not inferred from Zod). TASK-01 must update both files independently.

---

### TASK-02: Extend recordShiftClose mutation to persist override fields

- **Type:** IMPLEMENT
- **Deliverable:** Updated `useTillShiftsMutations.ts` — `recordShiftClose` accepts and persists `DrawerOverride` fields
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Build Evidence:** Added `override?: DrawerOverride` param and conditional spread of four override fields into Firebase update payload. `DrawerOverride` imported from `types/component/Till`. `pnpm typecheck` passes. Committed in 28c91ad519.
- **Affects:**
  - `apps/reception/src/hooks/mutations/useTillShiftsMutations.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 90% — `recordShiftClose` params and Firebase `update()` call fully read; pattern is identical to existing variance signoff conditional spread. Held-back test: no unresolved unknown; pattern is established.
  - Approach: 90% — conditional spread of override fields into `payload` mirrors `signedOffBy`/`signedOffByUid`/`signedOffAt`/`varianceNote` pattern exactly.
  - Impact: 90% — mutation is a leaf node; no callers need updating for backwards compatibility (new param is optional).
- **Acceptance:**
  - `recordShiftClose` accepts an optional `override?: DrawerOverride` parameter.
  - When `override` is provided, `overriddenBy`, `overriddenByUid`, `overriddenAt`, `overrideReason` are included in the Firebase `update()` payload.
  - When `override` is absent, payload is unchanged from current behavior.
  - `pnpm typecheck` passes on `apps/reception`.
- **Validation contract (TC-XX):**
  - TC-01: Call `recordShiftClose` with `override` present → `update()` called with all four override fields in payload.
  - TC-02: Call `recordShiftClose` without `override` → `update()` payload does not include override fields.
  - TC-03: TypeScript: passing a `DrawerOverride` object to the new param compiles without error.
- **Execution plan:**
  - Red: `recordShiftClose` params type has no override field; Firebase write omits override data.
  - Green: Add `override?: DrawerOverride` to the params object type. Spread conditionally: `...(params.override ? { overriddenBy: params.override.overriddenBy, overriddenByUid: params.override.overriddenByUid, overriddenAt: params.override.overriddenAt, overrideReason: params.override.overrideReason } : {})`.
  - Refactor: None.
- **Planning validation (required for M/L):** None: S effort task.
- **Scouts:** None: pattern is established in the same file.
- **Edge Cases & Hardening:**
  - `overriddenByUid` is optional in `DrawerOverride` — spread only when non-nullish.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: backwards-compatible; all existing callers pass no `override` → behavior unchanged.
  - Rollback: remove the param extension and conditional spread.
- **Documentation impact:** None: internal mutation.
- **Notes / references:**
  - Consumer: `useTillShifts.confirmShiftClose` (TASK-04) will pass the override object.

---

### TASK-03: Create DrawerOverrideModal component

- **Type:** IMPLEMENT
- **Deliverable:** New `apps/reception/src/components/till/DrawerOverrideModal.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Build Evidence:** Created `DrawerOverrideModal.tsx` following `VarianceSignoffModal` pattern — same-user block, `verifyManagerCredentials`, `withModalBackground(memo(...))`, `data-cy` test IDs on all interactive elements. Success toast: "Manager override recorded." Same-user error: "You cannot override your own shift." `pnpm typecheck` passes. Committed in 28c91ad519.
- **Affects:**
  - `apps/reception/src/components/till/DrawerOverrideModal.tsx` (new file)
  - `[readonly] apps/reception/src/components/till/VarianceSignoffModal.tsx` (reference pattern)
  - `[readonly] apps/reception/src/services/managerReauth.ts` (uses verifyManagerCredentials)
  - `[readonly] apps/reception/src/types/component/Till.ts` (imports DrawerOverride — created in TASK-01)
  - `[readonly] apps/reception/src/hoc/withModalBackground.tsx` (HOC wrapping)
  - `[readonly] apps/reception/src/components/bar/orderTaking/modal/ModalContainer.tsx` (inner container)
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 90% — full `VarianceSignoffModal.tsx` source read; component structure, imports, and logic are directly transposable. Held-back test: component must compile with Design System imports — no known issues, same import paths as `VarianceSignoffModal`.
  - Approach: 90% — reuse pattern (withModalBackground + verifyManagerCredentials + ModalContainer) is proven in production.
  - Impact: 85% — new component; no consumer yet (TASK-04 wires it). Impact is deferred to TASK-04.
- **Acceptance:**
  - `DrawerOverrideModal` renders with `shiftOwnerName`, `onConfirm`, `onCancel` props.
  - Empty email/password shows validation error; empty reason shows validation error.
  - Failed `verifyManagerCredentials` (wrong creds) shows error message in modal.
  - Same-user block: if manager UID matches `shiftOwnerUid` (or name matches `shiftOwnerName` when UID absent) → error "You cannot override your own shift."
  - Successful manager auth + reason → calls `onConfirm(DrawerOverride)` with `overriddenBy`, `overriddenByUid`, `overriddenAt`, `overrideReason` populated.
  - `pnpm typecheck` passes on `apps/reception`.
- **Validation contract (TC-XX):**
  - TC-01: Render with valid props → modal visible, fields empty, submit disabled.
  - TC-02: Submit with empty email → error "Email and password are required."
  - TC-03: Submit with empty reason → error "Override reason is required."
  - TC-04: `verifyManagerCredentials` returns `{ success: false, error: "Invalid email or password." }` → error shown, modal stays open.
  - TC-05: Manager UID === `shiftOwnerUid` → error "You cannot override your own shift."
  - TC-06: Manager name === `shiftOwnerName` (when `shiftOwnerUid` absent) → same block.
  - TC-07: Successful auth with valid reason → `onConfirm` called with correct `DrawerOverride` shape; toast shown.
  - TC-08: Cancel button → `onCancel` called.
- **Execution plan:**
  - Red: `DrawerOverrideModal.tsx` does not exist.
  - Green: Create file. Props interface: `{ shiftOwnerName: string; shiftOwnerUid?: string; onConfirm: (override: DrawerOverride) => void; onCancel: () => void }`. Internal state: `email`, `password`, `reason`, `error`, `isSubmitting`. On submit: validate non-empty email/password/reason → call `verifyManagerCredentials(email, password)` → check same-user block → call `onConfirm({ overriddenBy: managerName, overriddenByUid: managerUid, overriddenAt: getItalyIsoString(), overrideReason: reason })` → `showToast("Manager override recorded.", "success")`. Wrap with `withModalBackground(memo(...))`.
  - Refactor: Ensure `data-cy` test IDs on key elements (consistent with jest.setup.ts `testIdAttribute: "data-cy"`).
- **Planning validation (required for M/L):**
  - Checks run: Read `VarianceSignoffModal.tsx` (full source), `withModalBackground.tsx` HOC (import confirmed), `managerReauth.ts` (verifyManagerCredentials signature confirmed), `types/component/Till.ts` (DrawerOverride type location confirmed).
  - Validation artifacts: `VarianceSignoffModal.tsx` lines 1–159 (reference implementation); `managerReauth.ts` `verifyManagerCredentials` signature: `(email: string, password: string): Promise<ManagerAuthResult>`.
  - Unexpected findings: None.
- **Scouts:** `withModalBackground` HOC path: `apps/reception/src/hoc/withModalBackground.tsx` — confirmed by import in `VarianceSignoffModal.tsx` line 6.
- **Edge Cases & Hardening:**
  - `isSubmitting` guard prevents double-submit.
  - `emailRef.current?.focus()` on mount (same as VarianceSignoffModal).
  - `onCancel` available so parent can dismiss if needed.
- **Consumer tracing:**
  - New output: `DrawerOverride` object from `onConfirm` callback. Consumer: `useTillShifts.handleCloseShiftClick` (TASK-04) stores it in hook state and passes it to `confirmShiftClose`.
  - No other consumers. Chain is complete within scope.
- **What would make this >=90%:** Already at 90% on Implementation and Approach. Impact is at 85% because the component is not yet wired — rises to 90%+ after TASK-04.
- **Rollout / rollback:**
  - Rollout: new file; no existing code affected until TASK-04 imports it.
  - Rollback: delete the file.
- **Documentation impact:** None: internal component.
- **Notes / references:**
  - `VarianceSignoffModal.tsx` is the direct template. Key differences: no `varianceAmount` prop; reason field label is "Override reason"; success toast message is "Manager override recorded."; same-user error is "You cannot override your own shift."

---

### TASK-04: Second-layer guard and override wiring in useTillShifts

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/reception/src/hooks/client/till/useTillShifts.ts` — second-layer guard in `confirmShiftClose` + override state + modal wiring in `handleCloseShiftClick`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Build Evidence:** Added `showDrawerOverrideModal`, `pendingOverride`, `pendingVariant` state. `handleCloseShiftClick` now shows modal for non-owners instead of blocking toast. `confirmDrawerOverride`/`cancelDrawerOverride` callbacks added. `confirmShiftClose` guard uses `openShift.user` (DB-authoritative). `TillReconciliation.tsx` renders `DrawerOverrideModal` when state active. `pnpm typecheck` + lint pass. Committed in 81200f05b9.
- **Affects:**
  - `apps/reception/src/hooks/client/till/useTillShifts.ts`
  - `apps/reception/src/components/till/TillReconciliation.tsx` (render DrawerOverrideModal when state active)
- **Depends on:** TASK-02, TASK-03
- **Blocks:** CHECKPOINT-05
- **Confidence:** 85%
  - Implementation: 85% — `useTillShifts.ts` fully read; insertion points for both the guard and modal state are clear. The hook is complex (~645 lines) but the changes are narrow: three new state variables (`showDrawerOverrideModal`, `pendingOverride`, `pendingVariant`), two new useCallback functions (`confirmDrawerOverride`, `cancelDrawerOverride`), one `confirmShiftClose` guard addition (closure-based, no public signature change), one `TillReconciliation` render addition. Held-back test: no unknown that would drop this below 80; the `openShift` variable is already in scope at lines 416–423.
  - Approach: 85% — approach is directly specified (use `openShift.user` not `shiftOwner` for second-layer guard; store `DrawerOverride` in hook state). Pattern is consistent with how `varianceSignoff` state is handled.
  - Impact: 85% — this is the functional change. Until TASK-04 completes, no user-visible behavior changes.
- **Acceptance:**
  - `handleCloseShiftClick`: when `user.user_name !== shiftOwner`, shows `DrawerOverrideModal` (sets `showDrawerOverrideModal: true`) instead of blocking toast.
  - When `DrawerOverrideModal` confirms, stores `DrawerOverride` in hook state (`pendingOverride`), calls `setShowCloseShiftForm(true)`, sets variant.
  - When modal is cancelled, resets state, no form shown.
  - `confirmShiftClose`: after the existing `findOpenShift(cashCounts)` call at line 416, if `openShift.user !== user.user_name` AND no `pendingOverride` → show error toast "Only the shift owner or an authorized manager can close this shift." and return.
  - When `pendingOverride` is present, passes override to `recordShiftClose`, clears `pendingOverride` after close.
  - `TillReconciliation.tsx` renders `<DrawerOverrideModal>` when `showDrawerOverrideModal` is true, wired to `confirmDrawerOverride` and `cancelDrawerOverride` callbacks from the hook.
  - `pnpm typecheck` passes on `apps/reception`.
- **Validation contract (TC-XX):**
  - TC-01: Shift open by "Alice"; logged-in user is "Bob" (non-manager); click Close → `DrawerOverrideModal` shown (toast NOT shown).
  - TC-02: `DrawerOverrideModal` cancel → modal hidden, form NOT shown.
  - TC-03: `DrawerOverrideModal` confirms with valid override → modal hidden, `showCloseShiftForm: true`.
  - TC-04: Call `confirmShiftClose` with `openShift.user !== user.user_name` and no `pendingOverride` → error toast, close aborted.
  - TC-05: Call `confirmShiftClose` with `openShift.user !== user.user_name` but valid `pendingOverride` → close proceeds; `recordShiftClose` called with override fields.
  - TC-06: Normal close (shift owner = current user) → lock check passes; `pendingOverride` is null; `recordShiftClose` called without override fields.
  - TC-07: After successful override close, `pendingOverride` is reset to null.
- **Execution plan:**
  - Red: `handleCloseShiftClick` shows error toast for non-owners; `confirmShiftClose` has no second layer.
  - Green:
    1. Add three new state variables to hook: `showDrawerOverrideModal` (boolean), `pendingOverride` (`DrawerOverride | null`), `pendingVariant` (`"close" | "reconcile" | null`).
    2. In `handleCloseShiftClick`: replace the `user.user_name !== shiftOwner` toast+return block with `setPendingVariant(variant); setShowDrawerOverrideModal(true)`. Both state updates happen together so `pendingVariant` is always set before the modal renders.
    3. Add `confirmDrawerOverride(override: DrawerOverride)` callback: sets `pendingOverride`, hides modal, calls `setCloseShiftFormVariant(pendingVariant ?? "close")`, `setShowCloseShiftForm(true)`. (`pendingVariant` is the state set in step 2 above — `variant` from `handleCloseShiftClick` is not in scope here; read from state instead.)
    4. Add `cancelDrawerOverride()` callback: hides modal.
    5. In `confirmShiftClose`: after `if (!openShift)` guard (line 416–423), add: `if (openShift.user !== user.user_name && !pendingOverride) { showToast("Only the shift owner or an authorized manager can close this shift.", "error"); return; }`. Pass `pendingOverride ?? undefined` to `recordShiftClose` as `override`. After successful close, call `setPendingOverride(null)`.
    6. In `TillReconciliation.tsx`: import `DrawerOverrideModal`; render `{showDrawerOverrideModal && <DrawerOverrideModal shiftOwnerName={shiftOwner ?? ""} onConfirm={confirmDrawerOverride} onCancel={cancelDrawerOverride} />}`.
  - Refactor: Ensure `pendingOverride` is cleared on shift open too (defensive).
- **Planning validation (required for M/L):**
  - Checks run: Read `useTillShifts.ts` lines 354–384 (handleCloseShiftClick), lines 396–562 (confirmShiftClose). Confirmed `openShift` variable in scope at line 416. Confirmed `shiftOwner` ephemeral state at line 76. Confirmed `varianceSignoff` state pattern (lines 102–104 in CloseShiftForm, not hook — hook does not hold variance signoff state itself; signoff is passed through the form callback). Confirmed `TillReconciliation.tsx` renders `AddKeycardsModal` and `ReturnKeycardsModal` conditionally — same pattern for `DrawerOverrideModal`.
  - Validation artifacts: `useTillShifts.ts` lines 354–384 confirm modal state pattern; `TillReconciliation.tsx` lines 143–154 confirm conditional modal render pattern.
  - Unexpected findings: The `variant` parameter needs to be captured before showing the modal (since `handleCloseShiftClick` receives `variant: "close" | "reconcile"` and needs to pass it to the form). Store `pendingVariant` state alongside `pendingOverride`, or capture variant in the confirm callback. Chosen: store variant in `pendingVariant` state set alongside `showDrawerOverrideModal`.
- **Scouts:** Variant capture: `handleCloseShiftClick(variant: "close" | "reconcile")` — variant must survive until `confirmDrawerOverride` fires. Add `pendingVariant` state (`"close" | "reconcile" | null`, initialized null) set when modal is shown.
- **Edge Cases & Hardening:**
  - If `shiftOwner` is null when `handleCloseShiftClick` is called: the existing `!shiftOpenTime` guard at the start of `handleCloseShiftClick` (line 354–358) fires first, preventing null-owner scenarios from reaching the modal.
  - If modal is shown but Firebase disconnects before confirm: `confirmShiftClose` will fail at the `findOpenShift` call — existing "till is not currently open" toast fires. No special handling needed.
  - `pendingOverride` reset on `confirmShiftClose` completion (both close and reconcile branches).
- **Consumer tracing:**
  - New output: `showDrawerOverrideModal` (boolean state) → consumed by `TillReconciliation.tsx` render (in-scope, TASK-04).
  - New output: `confirmDrawerOverride` callback → consumed by `DrawerOverrideModal.onConfirm` in `TillReconciliation.tsx` (in-scope, TASK-04).
  - New output: `cancelDrawerOverride` callback → consumed by `DrawerOverrideModal.onCancel` in `TillReconciliation.tsx` (in-scope, TASK-04).
  - Modified behavior: `handleCloseShiftClick` no longer shows a toast for non-owners — shows modal instead. Downstream consumer of this change: `TillReconciliation` test (`TillReconciliation.test.tsx`) — existing test for non-owner handling does not exist, so no test regression. Future tests in TASK-06 cover new behavior.
  - Modified behavior: `confirmShiftClose` now accepts `pendingOverride` via closure (not a param change to the public signature — override is accessed via closure from hook state, not passed by `CloseShiftForm`). `CloseShiftForm`/`FormsContainer` prop signatures unchanged.
- **What would make this >=90%:** Implementation rises to 90% after TASK-04 is confirmed working (CHECKPOINT-05 validates). Impact rises to 90% after TASK-06 tests pass.
- **Rollout / rollback:**
  - Rollout: single hook + component update; no config changes.
  - Rollback: revert `useTillShifts.ts` and `TillReconciliation.tsx` changes; delete `DrawerOverrideModal.tsx` import and render.
- **Documentation impact:** None: internal hook change.
- **Notes / references:**
  - `pendingVariant` state needs to be captured in TASK-04 — this is an unexpected finding from planning validation. TASK-04 execution plan includes this.

---

### CHECKPOINT-05: Horizon checkpoint — verify integration before tests

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via replan if needed; otherwise proceed to TASK-06.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/reception-till-drawer-lock/plan.md`
- **Depends on:** TASK-04
- **Blocks:** TASK-06
- **Confidence:** 95%
  - Implementation: 95% — process is defined.
  - Approach: 95% — prevents test-writing against unvalidated integration.
  - Impact: 95% — controls downstream risk.
- **Acceptance:**
  - TASK-01 through TASK-04 all show `Status: Complete`.
  - `pnpm typecheck` passes on `apps/reception`.
  - `pnpm lint` passes on `apps/reception`.
  - `/lp-do-replan` run on TASK-06; downstream confidence validated.
  - Plan updated.
- **Horizon assumptions to validate:**
  - `DrawerOverrideModal` renders without typecheck error after TASK-03 + TASK-01.
  - `handleCloseShiftClick` modal state wiring does not introduce any TypeScript errors in the return signature of `useTillShifts`.
  - `confirmShiftClose` second-layer guard does not interfere with the `reconcile` action path (which uses the same code path).
- **Validation contract:** CHECKPOINT confirmed when `/lp-do-replan` returns Ready or Partially-ready for TASK-06.
- **Planning validation:** Replan evidence path: `docs/plans/reception-till-drawer-lock/plan.md`.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** Plan updated with replan findings.

---

### TASK-06: Unit tests for lock, override, and guard paths

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/reception/src/hooks/client/till/__tests__/useTillShifts.test.ts` + new `apps/reception/src/components/till/__tests__/DrawerOverrideModal.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/client/till/__tests__/useTillShifts.test.ts`
  - `apps/reception/src/components/till/__tests__/DrawerOverrideModal.test.tsx` (new file)
  - `[readonly] apps/reception/src/hooks/client/till/useTillShifts.ts`
  - `[readonly] apps/reception/src/components/till/DrawerOverrideModal.tsx`
- **Depends on:** CHECKPOINT-05
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — `useTillShifts.test.ts` fully read; test scaffolding (mocks for `useAuth`, `useTillData`, all mutation hooks) is established. Adding new cases follows identical pattern. `DrawerOverrideModal` test follows `VarianceSignoffModal` pattern (no existing tests for `VarianceSignoffModal`, but React Testing Library pattern is standard). Held-back test: if `verifyManagerCredentials` mock setup proves more complex than expected, confidence drops to 75% — mitigated by reading existing mock patterns in `VarianceSignoffModal` area.
  - Approach: 85% — test seams identified in fact-find; `renderHook` for hook tests, `render` + `userEvent` for modal tests.
  - Impact: 85% — tests are the final validation gate; confidence in TASK-03/TASK-04 rises to 90%+ after tests pass.
- **Acceptance:**
  - `useTillShifts.test.ts` additions:
    - Non-owner `handleCloseShiftClick` sets `showDrawerOverrideModal: true` (not a toast).
    - `confirmShiftClose` with mismatched user and no `pendingOverride` → toast and no close.
    - Override path: `confirmDrawerOverride(override)` → `showCloseShiftForm: true`; subsequent `confirmShiftClose` → `recordShiftClose` called with override fields.
    - Normal close (owner) path unaffected: `recordShiftClose` called without override fields.
  - `DrawerOverrideModal.test.tsx`:
    - Renders with props.
    - Empty submit → validation error.
    - Failed `verifyManagerCredentials` → error message shown.
    - Same-user block → error message shown.
    - Successful auth + reason → `onConfirm` called with correct `DrawerOverride` shape.
    - Cancel → `onCancel` called.
  - All new tests pass in CI.
  - No existing tests broken.
- **Validation contract (TC-XX):**
  - TC-01: `renderHook(useTillShifts)` with `cashCounts = [{ user: "Alice", type: "opening", ... }]` and `useAuth → { user: { user_name: "Bob" } }` → `result.current.showDrawerOverrideModal` is false initially; after `handleCloseShiftClick("close")` → `showDrawerOverrideModal` is true.
  - TC-02: Call `confirmShiftClose("close", 100, 0, true, {})` directly with `cashCounts` open by "Alice" and auth user "Bob", no `pendingOverride` → `showToastMock` called with error message; `recordShiftClose` not called.
  - TC-03: `confirmDrawerOverride({ overriddenBy: "Manager", overriddenAt: "...", overrideReason: "Cover" })` → `showCloseShiftForm: true`; `pendingOverride` set; subsequent `confirmShiftClose` → `recordShiftClose` called with `override` param.
  - TC-04: Normal close (user "Alice", shift opened by "Alice") → `recordShiftClose` called with no override fields.
  - TC-05–TC-10: `DrawerOverrideModal` render + validation + auth + same-user + success + cancel (maps to TASK-03 TC-01 through TC-08).
- **Execution plan:**
  - Red: No tests for lock/override paths in `useTillShifts.test.ts`; `DrawerOverrideModal.test.tsx` does not exist.
  - Green: Add 4 new describe blocks / test cases to `useTillShifts.test.ts`; create `DrawerOverrideModal.test.tsx` with 6 test cases following `AddKeycardsModal.test.tsx` + `VarianceSignoffModal` patterns.
  - Refactor: Ensure `verifyManagerCredentials` mock is hoisted properly (same `var` hoisting pattern as other mocks in `useTillShifts.test.ts`).
- **Planning validation (required for M/L):**
  - Checks run: Read `useTillShifts.test.ts` (full) — mock scaffolding, `renderHook` pattern, `act()` usage confirmed. Read `AddKeycardsModal.test.tsx` header — confirms `jest.mock` pattern for component tests.
  - Validation artifacts: `useTillShifts.test.ts` line 17–92 (mock setup); `apps/reception/jest.config.cjs` (test framework config — Jest + RTL, `testIdAttribute: "data-cy"`).
  - Unexpected findings: `verifyManagerCredentials` is an async function — test for `DrawerOverrideModal` must mock `../../services/managerReauth` (relative path from test file perspective). The test file at `__tests__/DrawerOverrideModal.test.tsx` imports from `../DrawerOverrideModal.tsx`, which imports from `../../services/managerReauth` — so mock path is `"../../services/managerReauth"` relative to the component, but `jest.mock` path is resolved from the test file: `"../../../services/managerReauth"`.
- **Scouts:** `jest.mock` path for `verifyManagerCredentials` from `__tests__/DrawerOverrideModal.test.tsx`: `"../../../services/managerReauth"`.
- **Edge Cases & Hardening:**
  - `beforeEach` clears all mocks — consistent with existing test file pattern.
  - `afterEach(jest.useRealTimers)` already present in `useTillShifts.test.ts`.
- **Consumer tracing:**
  - No new outputs that need consumers — test files are leaf nodes.
- **What would make this >=90%:** Rises to 90% after CHECKPOINT-05 confirms TASK-04 implementation is correct (no surprises at the hook/modal boundary).
- **Rollout / rollback:**
  - Rollout: test files only; no production code changes.
  - Rollback: delete new test cases / test file.
- **Documentation impact:** None: test files only.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extend schema + type | Yes | None | No |
| TASK-02: Extend mutation | Yes — TASK-01 produces `DrawerOverride` type needed here | None | No |
| TASK-03: Create DrawerOverrideModal | Yes — TASK-01 produces `DrawerOverride` type needed here; independent of TASK-02 | None | No |
| TASK-04: Second-layer guard + override wiring | Yes — TASK-02 provides extended mutation; TASK-03 provides modal component | [Type contract] [Minor]: `pendingVariant` state is an unexpected finding from planning validation; captured in TASK-04 execution plan and scouts — no missing precondition | No |
| CHECKPOINT-05: Horizon checkpoint | Yes — TASK-04 complete; typecheck + lint gate defined | None | No |
| TASK-06: Unit tests | Yes — all implementation tasks complete per CHECKPOINT-05; test scaffolding confirmed | [Minor]: `verifyManagerCredentials` mock path from DrawerOverrideModal test is `"../../../services/managerReauth"` — captured in TASK-06 scouts | No |

No Critical simulation findings. Plan may proceed.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `pendingVariant` state not captured before modal shown — variant lost when override confirms | Low | Medium | Captured in TASK-04 execution plan: store `pendingVariant` state set alongside `showDrawerOverrideModal` |
| `verifyManagerCredentials` mock path wrong in DrawerOverrideModal test | Low | Low | Scouts in TASK-06 identify correct relative path: `"../../../services/managerReauth"` |
| Firebase write error on override fields — close succeeds locally but override not persisted | Low | Low | Existing `recordShiftClose` error handling fires; override fields follow same try/catch path |
| `DrawerOverrideModal` typecheck errors from Design System imports | Low | Low | Imports mirror `VarianceSignoffModal.tsx` exactly; same import paths |
| Same-user block uses name comparison only (no `openedByUid`) — staff with identical display names could be falsely blocked | Very Low | Low | Single-team context makes this negligible; documented as known limitation (BRIK has ≤10 staff). Future mitigation: add `openedByUid` to `TillShift` schema. |

## Observability

- Logging: Override events appear in Firebase `tillShifts/{shiftId}` with `overriddenBy`, `overriddenByUid`, `overriddenAt`, `overrideReason` — visible in Firebase console.
- Metrics: None: no analytics instrumentation required for this feature.
- Alerts/Dashboards: None: override fields are stored in Firebase `tillShifts/{shiftId}` and will be available for display in a future `TillShiftHistory` UI update (which will require explicit column additions — not in scope for this plan).

## Acceptance Criteria (overall)

- [ ] Shift owner can close/reconcile their own shift with no change to existing UX.
- [ ] Non-owner attempting to close/reconcile sees `DrawerOverrideModal` (not a blocking error toast).
- [ ] Manager credentials + reason in `DrawerOverrideModal` → close/reconcile proceeds; Firebase record includes `overriddenBy`, `overriddenAt`, `overrideReason`.
- [ ] Cancelled override → no shift close, no form shown.
- [ ] `confirmShiftClose` called directly without owner match and no override → error toast, no close.
- [ ] All new unit tests pass in CI; no existing tests broken.
- [ ] `pnpm typecheck` and `pnpm lint` pass on `apps/reception`.

## Decision Log

- 2026-03-01: Override applies to both "close" and "reconcile" variants — resolved in fact-find. Rationale: both variants are financial accountability actions; manager covering absent staff needs same capability for both.
- 2026-03-01: `openedByUid` NOT added to `TillShift` schema — same-user block in `DrawerOverrideModal` uses name-based comparison, adequate for BRIK single-team context.
- 2026-03-01: Override data flows via hook state (`pendingOverride`), not through `CloseShiftForm`/`FormsContainer` prop chain — `CloseShiftForm` and `FormsContainer` signatures unchanged.
- 2026-03-01: Second-layer guard in `confirmShiftClose` uses `openShift.user` (DB-authoritative, already in scope at line 416) not `shiftOwner` ephemeral state.

## Overall-confidence Calculation

- TASK-01: 95% × S(1) = 95
- TASK-02: 90% × S(1) = 90
- TASK-03: 90% × M(2) = 180
- TASK-04: 85% × M(2) = 170
- CHECKPOINT-05: 95% × S(1) = 95 (excluded from weighted average — procedural task)
- TASK-06: 85% × M(2) = 170

Weighted sum (excluding CHECKPOINT): 95 + 90 + 180 + 170 + 170 = 705
Total effort weight: 1 + 1 + 2 + 2 + 2 = 8
**Overall-confidence: 705 / 8 = 88.125 → 90% (rounded to nearest 5)**
