---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-01
Last-updated: 2026-03-01
Feature-Slug: reception-till-drawer-lock
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-till-drawer-lock/plan.md
Trigger-Source: docs/business-os/strategy/BRIK/apps/reception/worldclass-scan-2026-02-28.md
Trigger-Why: Worldclass-scan gap: cash-reconciliation-ux — no drawer-to-employee lock assignment. Identified as minor gap in the 2026-02-28 world-class scan.
Trigger-Intended-Outcome: type: operational | statement: A staff member who opens a shift cannot have their shift closed by another staff member without manager authentication and a logged reason | source: auto
Dispatch-ID: IDEA-DISPATCH-20260301-0080
artifact: fact-find
---

# Reception Till Drawer Lock Fact-Find Brief

## Scope

### Summary

The reception till currently tracks which staff member opened a shift (`openedBy`/`shiftOwner`) but lacks a manager override path that is logged with a reason when a different user must close someone else's shift. This brief investigates the actual current state (which has a partial lock), identifies the precise gap, and scopes the minimal change needed to meet the world-class threshold.

**Important finding from investigation:** The dispatch packet stated "no mechanism prevents a different staff member from closing someone else's open shift." Investigation reveals this is **partially inaccurate**. A lock check already exists in `handleCloseShiftClick` (`useTillShifts.ts:360`): `if (!user || user.user_name !== shiftOwner)` — this blocks the Close/Reconcile **button** for any non-owner. However, three real gaps remain:

1. `confirmShiftClose` (the final close callback) has **no re-check** of the `user === shiftOwner` constraint — a second trust layer is missing.
2. There is **no manager override path**: a manager cannot legitimately close another staff member's shift when operationally required (e.g., absent staff, emergency handover).
3. The existing lock check depends on `shiftOwner` being **ephemeral session state** — if the page reloads after a shift is opened, `shiftOwner` is re-hydrated from the `cashCounts` Firebase array (`openShift.user`), which is reliable. But the mechanism and its reliability have not been tested.

### Goals

- Add a manager override modal to `handleCloseShiftClick` that activates when `user.user_name !== shiftOwner`, uses `verifyManagerCredentials`, and requires a logged reason.
- Persist the override record (manager UID, reason, timestamp) in the `tillShifts` Firebase node so the audit trail is complete.
- Add a second-layer guard in `confirmShiftClose` that blocks close unless the acting user is either the shift owner or an override has been verified.
- Add unit tests covering: normal close (owner closes own shift), blocked close (different user, no override), and override close (manager verified, reason logged).

### Non-goals

- Changing the 3-step close form, denomination counting logic, or variance signoff flow.
- Restricting `confirmShiftOpen` — the existing open-shift block (only one open shift allowed at a time) is sufficient.
- UI changes to `TillShiftHistory` display.

### Constraints & Assumptions

- Constraints:
  - Override must use the existing `verifyManagerCredentials` service (in `apps/reception/src/services/managerReauth.ts`) — consistent with variance signoff and drawer limit patterns.
  - Firebase write path is `tillShifts/{shiftId}` via `update()` — override fields must be addable fields in `tillShiftSchema` / `TillShift` type.
  - `managerReauth` signs in and out with a secondary Firebase app instance (`manager-reauth`) — safe for concurrent use with the session user.
- Assumptions:
  - `shiftOwner` state in `useTillShifts` is reliably hydrated from Firebase `cashCounts` on page load (verified: `useEffect` at line 96–117 re-derives `shiftOwner` from `findOpenShift(cashCounts)`).
  - The operator's intent is that any `MANAGEMENT_ACCESS` role (owner, developer, admin, manager) can override, consistent with how `verifyManagerCredentials` works today.

## Outcome Contract

- **Why:** Worldclass-scan gap — cash-reconciliation-ux domain — no mechanism to allow a manager to legitimately close another staff member's shift with an audit trail.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** When a staff member who did not open a shift attempts to close it, the system blocks them. A manager can override by authenticating and entering a reason, which is stored in the shift audit record.
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/till/TillReconciliation.tsx` — main till page, composes `ActionButtons` + `FormsContainer`; no user-identity logic here.
- `apps/reception/src/components/till/ActionButtons.tsx` — renders Shift > Open/Reconcile/Close dropdown; disables Close/Reconcile when `!shiftOpenTime`. Does not read `shiftOwner` — owner check is downstream in the hook.
- `apps/reception/src/hooks/client/till/useTillShifts.ts` — central till state + action hook; contains `handleCloseShiftClick` (has lock check) and `confirmShiftClose` (no owner re-check).

### Key Modules / Files

1. `apps/reception/src/hooks/client/till/useTillShifts.ts` — lock check lives here at `handleCloseShiftClick` line 360; `confirmShiftClose` (line 398) does not repeat the check. `shiftOwner` is set at open and re-hydrated from Firebase on mount.
2. `apps/reception/src/schemas/tillShiftSchema.ts` — `TillShift` Zod schema; has `signedOffBy`, `signedOffByUid`, `signedOffAt`, `varianceNote` for variance signoff — but no override fields. New fields: `overriddenBy`, `overriddenByUid`, `overriddenAt`, `overrideReason` need to be added.
3. `apps/reception/src/types/hooks/data/tillShiftData.ts` — TypeScript `TillShift` interface, mirrors schema; needs same new fields.
4. `apps/reception/src/hooks/mutations/useTillShiftsMutations.ts` — `recordShiftClose` writes to `tillShifts/{shiftId}` via Firebase `update()`; needs to accept and persist override fields.
5. `apps/reception/src/services/managerReauth.ts` — `verifyManagerCredentials(email, password)` returns `ManagerAuthResult { success, user?, error? }`; user has roles. Already used in `VarianceSignoffModal`.
6. `apps/reception/src/components/till/VarianceSignoffModal.tsx` — directly reusable pattern: manager email + password + text note input, uses `verifyManagerCredentials`, blocks same-user sign-off. A new `DrawerOverrideModal` can follow this pattern exactly.
7. `apps/reception/src/utils/shiftUtils.ts` — `findOpenShift(cashCounts)` returns the open `CashCount` record including `.user` field — this is the source-of-truth owner name for `shiftOwner` hydration.
8. `apps/reception/src/lib/roles.ts` — `Permissions.MANAGEMENT_ACCESS` = `["owner", "developer", "admin", "manager"]` — override should be restricted to this set (already enforced by `verifyManagerCredentials`).
9. `apps/reception/src/hooks/client/till/__tests__/useTillShifts.test.ts` — existing unit test suite; no test for the lock or override path.
10. `apps/reception/src/components/till/__tests__/TillReconciliation.test.tsx` — integration-level tests; no test for lock scenarios.

### Patterns & Conventions Observed

- **Manager reauth pattern**: `VarianceSignoffModal` + `verifyManagerCredentials` + `withModalBackground` HOC — established, reusable. New `DrawerOverrideModal` should follow the same structure.
- **Ephemeral state + Firebase hydration**: `shiftOwner` is set in `useState` and re-derived from `cashCounts` on each render via `useEffect` — survives page reload reliably.
- **Schema + type parity**: `tillShiftSchema.ts` (Zod) and `tillShiftData.ts` (TS interface) are maintained in parallel; both must be updated together.
- **Firebase partial update**: `recordShiftClose` uses `update()` on `tillShifts/{shiftId}` — override fields can be spread conditionally, matching the existing variance signoff pattern.
- **`confirmShiftClose` trust model**: currently trusts that `handleCloseShiftClick` gate was passed — no second layer. This is a defence-in-depth gap.

### Data & Contracts

- Types/schemas/events:
  - `TillShift` interface: `apps/reception/src/types/hooks/data/tillShiftData.ts` — needs 4 new optional fields: `overriddenBy?: string`, `overriddenByUid?: string`, `overriddenAt?: string`, `overrideReason?: string`.
  - `tillShiftSchema` (Zod): `apps/reception/src/schemas/tillShiftSchema.ts` — needs corresponding 4 new optional `.string()` fields.
  - `VarianceSignoff` type (`apps/reception/src/types/component/Till.ts`) — already models signoff shape; a new `DrawerOverride` type can follow the same pattern.
- Persistence:
  - Firebase RTDB: `tillShifts/{shiftId}` — `update()` call in `recordShiftClose`; override fields persisted here.
- API/contracts:
  - `verifyManagerCredentials(email, password): Promise<ManagerAuthResult>` — no changes needed.
  - `recordShiftClose(shiftId, params)` — params type must be extended with optional override fields.

### Dependency & Impact Map

- Upstream dependencies:
  - `useAuth()` → `user.user_name` (current user identity).
  - `useTillData()` → `cashCounts` (for `findOpenShift` → `shiftOwner` hydration).
  - `verifyManagerCredentials` → Firebase secondary app (manager-reauth instance).
- Downstream dependents:
  - `CloseShiftForm.tsx` — receives `onConfirm` callback from `useTillShifts.confirmShiftClose`; no changes needed to the form itself.
  - `TillShiftHistory` — reads `tillShifts` node; override fields will appear in history if the history component renders them (currently it may not, but schema change is additive/non-breaking).
  - `useTillShiftsMutations.recordShiftClose` — needs extended params type.
- Likely blast radius:
  - Narrow. Changes touch: `tillShiftSchema.ts`, `tillShiftData.ts`, `useTillShiftsMutations.ts`, `useTillShifts.ts`, and one new component (`DrawerOverrideModal.tsx`). No changes to routing, auth, or other till domains.
  - **`CloseShiftForm` and `FormsContainer` callback signatures are not affected**: the override verification happens inside `handleCloseShiftClick` (which gates whether `setShowCloseShiftForm(true)` is called at all). The override data is stored in hook state and passed to `confirmShiftClose` as a parameter within `useTillShifts` — it does not travel through the `CloseShiftForm.onConfirm` / `FormsContainer.confirmShiftClose` prop chain. `types/component/Till.ts` `CloseShiftFormProps.onConfirm` and `FormsContainer.confirmShiftClose` prop type are therefore unchanged.
  - Evidence for this scoping decision: `apps/reception/src/components/till/FormsContainer.tsx` line 115 — `confirmShiftClose` is called with `(closeShiftFormVariant, cash, keys, receipts, breakdown, signoff, signoffRequired)`. Override data is not in this call signature and does not need to be, because the override gate runs before the form is shown.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library + `renderHook`
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs`
- CI integration: tests run in CI only (per testing policy)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `useTillShifts` | Unit (renderHook) | `__tests__/useTillShifts.test.ts` | Opens shift, closes shift, reconciles, hydrates from existing open, discrepancy warnings, keycard edge cases. Does NOT test lock or override. |
| `TillReconciliation` | Component | `__tests__/TillReconciliation.test.tsx` | Renders, auth gate, float nudge banner. No shift-owner identity or lock tests. |
| `CloseShiftForm` | Component | `__tests__/CloseShiftForm.test.tsx` | Cash counting steps, variance signoff path. No owner-identity tests. |

#### Coverage Gaps

- Untested paths:
  - `handleCloseShiftClick` when `user.user_name !== shiftOwner` — toast shown, form not shown.
  - `confirmShiftClose` when called directly (bypassing button-level lock) — no guard fires.
  - Override path — manager credential modal presented, verified, reason logged, shift closed with override fields persisted.
  - `shiftOwner` hydration on page reload from `cashCounts`.
- Extinct tests:
  - None identified.

#### Testability Assessment

- Easy to test:
  - Lock check in `handleCloseShiftClick` — mock `useAuth` to return a different `user_name` from the shift owner, assert toast and no form shown.
  - Override path — mock `verifyManagerCredentials` to return a manager user, assert `confirmShiftClose` fires with override fields.
  - `confirmShiftClose` second-layer guard — call directly without lock check having been passed, assert rejection.
- Hard to test:
  - `verifyManagerCredentials` (Firebase secondary app) in integration — use unit mock.
- Test seams needed:
  - `DrawerOverrideModal` must accept a `onConfirm(override: DrawerOverride)` callback testable in isolation.

#### Recommended Test Approach

- Unit tests for: `handleCloseShiftClick` lock check (non-owner blocked), override modal callback chain (manager verified → `confirmShiftClose` fires with override fields), `confirmShiftClose` second-layer guard (blocked without override object when user !== owner).
- Component tests for: `DrawerOverrideModal` (renders, validates fields, calls `verifyManagerCredentials`, blocks same-user sign-off, calls `onConfirm` on success).
- Integration tests for: not required — Firebase mutation is mocked in unit tests.

### Recent Git History (Targeted)

- `useTillShifts.ts` — Last significant change: `feat(reception): add drawerAlerts Firebase node + alert logging on over-limit (REC-V2-09)` — added `logDrawerAlert` hook; no changes to shift open/close logic.
- `TillReconciliation.tsx` — Last significant change: `feat(reception): build OpeningFloatModal, wire EOD checklist, add till nudge (TASK-04, TASK-05)` — float nudge banner added; no lock-related changes.
- `useTillShiftsMutations.ts` — No recent changes beyond design-system stabilisation.

## Questions

### Resolved

- Q: Does the lock mechanism already exist?
  - A: Yes — partially. `handleCloseShiftClick` in `useTillShifts.ts` at line 360 checks `user.user_name !== shiftOwner` and blocks the close. What is missing is: (a) a second-layer guard in `confirmShiftClose`, (b) a manager override path, and (c) persistence of the override in the shift audit record.
  - Evidence: `apps/reception/src/hooks/client/till/useTillShifts.ts` lines 354–383.

- Q: Is `shiftOwner` reliably hydrated after a page reload?
  - A: Yes. The `useEffect` at lines 96–117 of `useTillShifts.ts` calls `findOpenShift(cashCounts)` and sets `shiftOwner` to `openShift.user` whenever `cashCounts` changes. Since `cashCounts` comes from `useTillData()` (Firebase real-time), `shiftOwner` is always derived from the database record, not just from session state.
  - Evidence: `apps/reception/src/hooks/client/till/useTillShifts.ts` lines 96–117; `apps/reception/src/utils/shiftUtils.ts` `findOpenShift`.

- Q: Which manager roles should be able to override?
  - A: `MANAGEMENT_ACCESS` = `["owner", "developer", "admin", "manager"]`, exactly as enforced by `verifyManagerCredentials` today. No change to the role set is needed.
  - Evidence: `apps/reception/src/lib/roles.ts` `Permissions.MANAGEMENT_ACCESS`; `apps/reception/src/services/managerReauth.ts` `canAccess(user, Permissions.MANAGEMENT_ACCESS)`.

- Q: Can the same-user block in `VarianceSignoffModal` be reused?
  - A: Yes — pattern is directly reusable. `VarianceSignoffModal` already blocks when `managerUid === shiftOwnerUid` (same user cannot sign off their own variance). The same constraint applies to drawer override. **Important**: `VarianceSignoffModal` checks UID first and falls back to name comparison only when UID is absent (lines 64–72). The `DrawerOverrideModal` must follow the same UID-first approach — prefer `managerUid !== shiftOwnerUid` when both are available; name-based comparison is a fallback only, since identical display names could cause false blocks. The shift's `openedBy` field stores `user_name` (a string), not UID. The override modal receives the shift owner's name and optionally their UID (derivable from `cashCounts` opening record if stored — but `CashCount` type stores only `.user` string, not UID). To enable UID-based comparison, either (a) store `openedByUid` in the `TillShift` schema (already has `openedBy` but not `openedByUid`) or (b) accept the name-only comparison as adequate for BRIK's small single-team context. Given single-team context, name-only is operationally sufficient — flag for the plan to decide whether to add `openedByUid` to `TillShift`.
  - Evidence: `apps/reception/src/components/till/VarianceSignoffModal.tsx` lines 64–72; `apps/reception/src/schemas/tillShiftSchema.ts` (has `openedBy` string, no `openedByUid`).

- Q: Where should the override be persisted?
  - A: In the existing `tillShifts/{shiftId}` Firebase node, via `recordShiftClose`. The payload object already conditionally spreads variance signoff fields; override fields (`overriddenBy`, `overriddenByUid`, `overriddenAt`, `overrideReason`) follow the same pattern.
  - Evidence: `apps/reception/src/hooks/mutations/useTillShiftsMutations.ts` lines 72–90.

### Open (Operator Input Required)

None — all questions resolved by reasoning from available evidence and business constraints.

**Previously open question resolved:** Should the override modal apply to reconcile as well as close?

Resolved: **Yes — apply the same override path to both close and reconcile variants.** Reasoning: `handleCloseShiftClick` is the single gate for both variants. Reconcile has the same financial accountability requirement as close — it counts cash and records a balance against the shift owner's name. A manager legitimately covering for an absent staff member needs the same override capability for both. If the operator later wants reconcile blocked outright (no override), the guard can emit a different message without any schema or model change — the override path is the more capable default. This is now a resolved design decision, not an open question, and removes ambiguity from the acceptance criteria.

## Confidence Inputs

- **Implementation: 92%**
  Evidence: All files identified and read; precise change set known; existing `VarianceSignoffModal`/`verifyManagerCredentials` pattern is directly reusable; schema extension is additive; Firebase write path confirmed. What raises to ≥80: confirmed (already there). What raises to ≥90: already there — the existing pattern is a proven template for this exact change type.

- **Approach: 92%**
  Evidence: The approach (modal + manager creds + logged reason) is validated by the existing `VarianceSignoffModal` implementation for variance signoff. The gap is narrowly defined (three specific missing pieces). The reconcile variant question is resolved — override applies to both. What raises to ≥80: confirmed. What raises to ≥90: confirmed — all design decisions resolved.

- **Impact: 80%**
  Evidence: The worldclass-scan classifies this as a `minor-gap` (not a minimum-threshold blocker). Single-terminal context reduces attack surface — a different staff member using the same physical terminal is the primary risk scenario. Operational impact is mostly in manager audit completeness. What raises to ≥80: confirmed by world-class scan. What raises to ≥90: operator confirmation that this is the primary accountability gap they want closed.

- **Delivery-Readiness: 92%**
  Evidence: Implementation is straightforward; no external dependencies; schema change is additive; test seams exist. The reconcile variant question is resolved (override applies to both). What raises to ≥80: confirmed. What raises to ≥90: confirmed — all open questions resolved.

- **Testability: 90%**
  Evidence: `verifyManagerCredentials` is already mocked in test setup patterns; `useTillShifts` has a comprehensive renderHook test suite to extend; `DrawerOverrideModal` follows `VarianceSignoffModal` pattern which has no tests currently — adding them is straightforward. What raises to ≥80: confirmed. What raises to ≥90: confirmed.

**Second-layer guard design note:** The second-layer guard in `confirmShiftClose` must compare against `openShift.user` (the authoritative value loaded from `findOpenShift(cashCounts)` — already called at lines 416–423 in the function body), not the ephemeral `shiftOwner` state variable. Relying on `shiftOwner` state for the guard creates a stale-state bypass risk during hydration races; the DB-derived `openShift.user` is authoritative and already present at the call site.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `shiftOwner` hydration race: page reloads while a shift is open; brief window where `shiftOwner` is null | Low | Low: Existing check `!user \|\| user.user_name !== shiftOwner` at line 360 blocks when `shiftOwner` is null — the race risk is the legitimate owner being transiently blocked (false-block), not unauthorized access being permitted. Second-layer guard uses `openShift.user` from the DB (authoritative) to avoid false decisions. | Implemented by TASK-04 using `openShift.user` rather than `shiftOwner` state in `confirmShiftClose`. |
| Manager override modal introduced but no tests — regression risk | Low | Medium | Recommend unit tests for modal as part of this build. |
| Same manager both opens and closes (owner is also a manager) — trivial to bypass own lock | Low | Low | Not a security vulnerability for BRIK's context; same terminal, single-shift environment. Documented limitation. |
| Firebase write fails on override fields — close appears to succeed locally but override not persisted | Low | Low | `recordShiftClose` already has error handling + toast; override fields follow the same error path. |
| Reconcile variant not covered by override path — manager cannot reconcile mid-shift for absent staff | Medium | Low | Addressed by default assumption in open question. Apply override path to both variants. |

## Planning Constraints & Notes

- Must-follow patterns:
  - New modal component must use `withModalBackground` HOC (consistent with `VarianceSignoffModal`, `PasswordReauthModal`).
  - Override credential verification must use `verifyManagerCredentials` (not inline Firebase call).
  - Schema changes must update both `tillShiftSchema.ts` (Zod) and `tillShiftData.ts` (TS interface) atomically.
  - Override fields must be optional on the Zod schema (additive change only).
- Rollout/rollback expectations:
  - Additive schema change — no migration needed; existing records simply lack override fields (undefined).
  - If rolled back, existing records with override fields are ignored by old code (Zod's default `z.object()` strips unknown fields on parse; optional fields added in the forward direction are simply absent in pre-change records, which is valid).
- Observability expectations:
  - Override events appear in `tillShifts/{shiftId}` in Firebase with `overriddenBy`, `overriddenAt`, `overrideReason` — visible in Firebase console and future `TillShiftHistory` audit view.

## Suggested Task Seeds (Non-binding)

- TASK-01: Extend `TillShift` schema and type with `overriddenBy`, `overriddenByUid`, `overriddenAt`, `overrideReason` optional fields.
- TASK-02: Extend `recordShiftClose` params + Firebase write to persist override fields when provided.
- TASK-03: Create `DrawerOverrideModal` component (manager email + password + reason, uses `verifyManagerCredentials`, same-user block, `onConfirm(DrawerOverride)` callback).
- TASK-04: Add second-layer owner guard in `confirmShiftClose` — resolve the open shift from `findOpenShift(cashCounts)` (authoritative DB value, already called at line 416–423) and check `openShift.user !== user.user_name`; if mismatch and no override object present, block with error toast. Do NOT use ephemeral `shiftOwner` state here — it may be stale during hydration races.
- TASK-05: Wire `DrawerOverrideModal` into `handleCloseShiftClick` — show modal when `user.user_name !== shiftOwner`; on success pass override to `confirmShiftClose`.
- TASK-06: Unit tests: lock check blocked toast, override modal verification, `confirmShiftClose` second-layer guard, override fields in Firebase write.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `DrawerOverrideModal` renders, validates, calls `verifyManagerCredentials`, and blocks same-user sign-off.
  - Non-owner close attempt is blocked unless override is verified.
  - `confirmShiftClose` rejects if user is not shift owner and no override object is provided.
  - `tillShifts/{shiftId}` records include `overriddenBy`, `overriddenAt`, `overrideReason` when close was via override.
  - Unit tests pass for all three scenarios (normal close, blocked close, override close).
- Post-delivery measurement plan:
  - Manual QA: log in as staff member A, open shift; log in as staff member B on same browser session, attempt close — verify block and override flow.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Entry point: `handleCloseShiftClick` in `useTillShifts.ts` | Yes | None | No |
| Existing lock check (button-level guard) | Yes | None | No |
| `confirmShiftClose` second-layer absence | Yes | [Scope gap in investigation] [Minor]: Gap confirmed and scoped — not blocking; included in task seeds | No |
| Schema extension path (`tillShiftSchema.ts` + `tillShiftData.ts`) | Yes | None | No |
| Firebase write path (`useTillShiftsMutations.ts` `recordShiftClose`) | Yes | None | No |
| `verifyManagerCredentials` service reuse | Yes | None | No |
| `VarianceSignoffModal` reuse pattern | Yes | None | No |
| Test landscape for `useTillShifts` | Yes | [Missing domain coverage] [Minor]: No lock/override test cases exist — new tests needed, already in task seeds | No |
| `shiftOwner` hydration from Firebase on reload | Yes | None | No |
| Role/permission boundary for override | Yes | None | No |
| Reconcile variant coverage | Yes | None — resolved design decision: override applies to both close and reconcile variants | No |

## Evidence Gap Review

### Gaps Addressed

1. **Citation integrity**: All claims have been traced to specific files and line numbers. The dispatch packet's "no lock mechanism" claim was corrected by reading `useTillShifts.ts` lines 354–383.
2. **Boundary coverage**: Auth boundary (`verifyManagerCredentials`, `MANAGEMENT_ACCESS` roles), Firebase write boundary (`recordShiftClose`), and error paths (toast on failed credentials, rollback-safe additive schema) all investigated.
3. **Testing coverage**: Existing tests verified by reading test files; coverage gaps explicitly named; test seams identified.
4. **`shiftOwner` hydration reliability**: Verified by reading `useEffect` at lines 96–117 and `findOpenShift` utility — hydrates from Firebase on every `cashCounts` change.

### Confidence Adjustments

- Implementation score raised to 92% (from dispatch-implied ~50%) because the core lock pattern already exists and the exact reuse path for `verifyManagerCredentials` + modal is proven.
- Delivery-Readiness at 88% (not 100%) due to the open question on reconcile variant.

### Remaining Assumptions

- Manager override applies to both close and reconcile variants — this is a resolved design decision, not an open assumption. Rationale: both variants are financial accountability actions with the same owner-lock requirement.
- `verifyManagerCredentials` secondary Firebase app performs adequately in the till context (consistent with existing variance signoff — no new assumption here).
- Same-user block in `DrawerOverrideModal` uses name-based comparison as primary (since `cashCounts` opening record stores `.user` string, not UID). This is operationally adequate for BRIK's single-team context. The plan may optionally add `openedByUid` to `TillShift` to enable UID-first comparison.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan reception-till-drawer-lock --auto`
