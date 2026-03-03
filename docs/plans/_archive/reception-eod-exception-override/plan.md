---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-01
Last-reviewed: 2026-03-01
Last-updated: 2026-03-01T09:25:00Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-eod-exception-override
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception EOD Exception Override Plan

## Summary

`EodChecklistContent` enforces a hard `allDone` gate that blocks the "Confirm day closed" button when any of the three required steps (Till, Safe, Stock) is incomplete. No escape path exists for legitimate operational exceptions. This plan adds a manager reauth override path: when `allDone` is false and no closure record exists, a management user can click "Override & close day", authenticate with manager credentials, provide a mandatory reason, and proceed. The override data is persisted in the closure record. The existing `verifyManagerCredentials` / `VarianceSignoffModal` pattern is reused exactly; no new auth mechanism is introduced. The "Day closed" banner is extended to surface override details when present.

## Active tasks

- [x] TASK-01: Extend `eodClosureSchema` with optional override fields — Complete (2026-03-01)
- [x] TASK-02: Add `confirmDayClosedWithOverride` mutation to `useEodClosureMutations` — Complete (2026-03-01)
- [x] TASK-03: Create `EodOverrideModal` component — Complete (2026-03-01)
- [x] TASK-04: Wire override modal into `EodChecklistContent` and update banner — Complete (2026-03-01)
- [x] TASK-05: Write tests for override path — Complete (2026-03-01)

## Goals

- Allow EOD closure to proceed when a legitimate exception prevents checklist completion.
- Require manager credential authentication before any override is accepted.
- Require a non-empty reason string documenting why the step was skipped.
- Persist override identity and reason in the closure record for auditability.
- Follow the existing `verifyManagerCredentials` / `VarianceSignoffModal` pattern — no new auth mechanism.

## Non-goals

- Removing the `allDone` gate for normal operation.
- Adding override capability inside individual checklist steps (till-close, safe-reconcile).
- Changing `eodClosures/$dateKey` Firebase write rules (already management-only).
- Changing the banner for the normal (all-steps-complete) closure path. Banner is only extended for override closures.

## Constraints & Assumptions

- Constraints:
  - Reuse `verifyManagerCredentials` verbatim — no new auth mechanism.
  - Extend `eodClosureSchema` with optional fields only; must not break existing record reads.
  - Modal must use `withModalBackground` + `ModalContainer` pattern.
  - `Input`/`Textarea` must use `compatibilityMode="no-wrapper"`.
  - `data-cy` attributes required on all interactive elements for test infra.
  - DO NOT apply the different-manager separation constraint (this is operational authorisation, not financial peer-separation).
- Assumptions:
  - Float step is intentionally outside `allDone`; override gate covers only Till/Safe/Stock.
  - Override is available when `!allDone && !eodClosureLoading && closure === null`.

## Inherited Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Management users (owner/developer/admin/manager) can close the day in legitimate exception cases without calling a developer, eliminating the operational blocker identified in the worldclass scan (end-of-day-closeout domain).
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/reception-eod-exception-override/fact-find.md`
- Key findings used:
  - `allDone = tillDone && safeDone && stockDone` (line 63 of `EodChecklistContent.tsx`) — exact gate to work around.
  - `eodClosureSchema` is `{ date, timestamp, confirmedBy, uid? }` — extend with optional override fields.
  - `verifyManagerCredentials` in `managerReauth.ts` is the auth service; `VarianceSignoffModal.tsx` is the direct reference implementation.
  - Firebase rules already permit manager writes to `eodClosures/$dateKey` — no rules change needed.
  - 18 existing test cases in `EodChecklistContent.test.tsx` remain valid after changes.

## Proposed Approach

The only viable approach given the constraints is to follow the `VarianceSignoffModal` pattern:

1. Extend the schema with optional override fields (backwards-compatible).
2. Add a new mutation variant that accepts and persists those fields.
3. Create a new `EodOverrideModal` component that wraps `verifyManagerCredentials` and a reason field.
4. Conditionally render an override button in `EodChecklistContent` and update the banner.
5. Write tests.

No alternative approach considered — the pattern is well-established and the constraints leave no design forks.

**Chosen approach:** Serial: schema → mutation → modal → wire → test.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extend `eodClosureSchema` with optional override fields | 95% | S | Complete (2026-03-01) | - | TASK-02, TASK-05 |
| TASK-02 | IMPLEMENT | Add `confirmDayClosedWithOverride` mutation | 90% | S | Complete (2026-03-01) | TASK-01 | TASK-04, TASK-05 |
| TASK-03 | IMPLEMENT | Create `EodOverrideModal` component | 90% | M | Complete (2026-03-01) | - | TASK-04, TASK-05 |
| TASK-04 | IMPLEMENT | Wire override modal + update banner in `EodChecklistContent` | 90% | M | Complete (2026-03-01) | TASK-02, TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Write tests for override path | 85% | M | Complete (2026-03-01) | TASK-01, TASK-02, TASK-03, TASK-04 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03 | - | Schema and modal component have no mutual dependency; can run in parallel |
| 2 | TASK-02 | TASK-01 complete | Mutation depends on extended schema type |
| 3 | TASK-04 | TASK-02, TASK-03 complete | Wiring needs both the mutation and the modal |
| 4 | TASK-05 | TASK-01–04 complete | Tests cover all new code paths |

## Tasks

---

### TASK-01: Extend `eodClosureSchema` with optional override fields

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/schemas/eodClosureSchema.ts` — adds three optional Zod fields to `eodClosureSchema` and updates the `EodClosure` type.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Build evidence:** Committed in `c6544be0b4`. Added `overrideReason`, `overrideManagerName`, `overrideManagerUid` optional fields to `eodClosureSchema`. Added `EodOverrideSignoff` interface to schema file (per simulation note — enables parallel TASK-03 execution). `pnpm -F "@apps/reception" typecheck` passes. No type errors introduced.
- **Affects:** `apps/reception/src/schemas/eodClosureSchema.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-05
- **Confidence:** 95%
  - Implementation: 95% — schema file read; exact fields identified; Zod optional string pattern already used for `uid`. No unknowns.
  - Approach: 95% — optional field extension is the standard backwards-compatible Zod pattern in this codebase. Evidence: `uid: z.string().optional()` already present.
  - Impact: 95% — downstream consumers (`useEodClosureData` via `useFirebaseSubscription`, `EndOfDayPacket`, `ManagerAuditContent`) all ignore unknown fields or parse with optional-tolerant schema; no breakage possible.
- **Acceptance:**
  - `eodClosureSchema` includes `overrideReason: z.string().optional()`, `overrideManagerName: z.string().optional()`, `overrideManagerUid: z.string().optional()`.
  - `EodClosure` type reflects the new optional fields.
  - Existing `eodClosureSchema.safeParse({ date, timestamp, confirmedBy })` (no override fields) still returns `success: true`.
  - Existing test fixtures in `EodChecklistContent.test.tsx` that construct closure objects without override fields still parse without error.
- **Validation contract (TC-XX):**
  - TC-01: `eodClosureSchema.safeParse({ date: '2026-03-01', timestamp: 'T', confirmedBy: 'pete' })` → `success: true`, `data.overrideReason === undefined`.
  - TC-02: `eodClosureSchema.safeParse({ date: '2026-03-01', timestamp: 'T', confirmedBy: 'pete', overrideReason: 'Safe inaccessible', overrideManagerName: 'alice', overrideManagerUid: 'uid-2' })` → `success: true`, all override fields present in `data`.
  - TC-03: `EodClosure` TypeScript type includes `overrideReason?: string`, `overrideManagerName?: string`, `overrideManagerUid?: string`.
- **Execution plan:** Add three `.optional()` string fields to the Zod object after `uid`. Run `pnpm typecheck` scoped to `apps/reception` to confirm no type errors introduced.
- **Planning validation (required for M/L):** None: S effort.
- **Scouts:** None: no unknowns — schema pattern is well-established in this file.
- **Edge Cases & Hardening:** Records written before this change have no override fields; Zod `.optional()` parses them as `undefined`, which is correct. No migration needed.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: Schema change is applied at build time; no deploy coordination needed.
  - Rollback: Remove the three optional fields; existing records are unaffected.
- **Documentation impact:** None: internal schema type.
- **Notes / references:** Reference: `apps/reception/src/schemas/eodClosureSchema.ts` (current state read in fact-find).

---

### TASK-02: Add `confirmDayClosedWithOverride` mutation to `useEodClosureMutations`

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/hooks/mutations/useEodClosureMutations.ts` — adds `confirmDayClosedWithOverride(signoff: EodOverrideSignoff): Promise<void>` callback and exports the `EodOverrideSignoff` type.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Build evidence:** Committed in `e96a59c6a4`. `confirmDayClosedWithOverride` added using `useCallback` pattern mirroring `confirmDayClosed`. `EodOverrideSignoff` imported from schema. Return type updated to include both callbacks. `useMemo` updated to include new callback. Typecheck passes. Also fixed pre-existing unused-var lint error in `CloseShiftForm.tsx` (count → _count) to unblock hook.
- **Affects:** `apps/reception/src/hooks/mutations/useEodClosureMutations.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 90%
  - Implementation: 90% — hook file read fully; existing `confirmDayClosed` is the exact template. New callback follows the same `useCallback` + `safeParse` + `set()` pattern. Only addition is the `signoff` parameter merged into payload.
  - Approach: 95% — directly mirrors the existing mutation. No design forks.
  - Impact: 90% — `useEodClosureMutations` return type will expand from `{ confirmDayClosed }` to `{ confirmDayClosed, confirmDayClosedWithOverride }`. The only consumer (`EodChecklistContent`) destructures only `confirmDayClosed` today — this is an additive change. Held-back test: could `EodChecklistContent` break if the hook return type changes? No — TypeScript allows destructuring a subset; adding a new key to the return object is non-breaking.
- **Acceptance:**
  - `useEodClosureMutations` returns `{ confirmDayClosed, confirmDayClosedWithOverride }`.
  - `confirmDayClosedWithOverride` accepts `EodOverrideSignoff = { overrideManagerName: string, overrideManagerUid?: string, overrideReason: string }`.
  - Payload includes all existing closure fields plus `overrideReason`, `overrideManagerName`, `overrideManagerUid`.
  - `eodClosureSchema.safeParse` validates the full payload before write.
  - On validation failure: `showToast` called with error message, function returns without writing.
  - On Firebase write failure: `showToast("Failed to confirm day closed.", "error")` called.
  - `EodOverrideSignoff` type exported for use by `EodOverrideModal` and `EodChecklistContent`.
- **Validation contract (TC-XX):**
  - TC-01: Happy path — `confirmDayClosedWithOverride({ overrideManagerName: 'alice', overrideManagerUid: 'uid-2', overrideReason: 'Safe locked' })` → Firebase `set()` called once with payload including override fields.
  - TC-02: Firebase `set()` throws → `showToast("Failed to confirm day closed.", "error")` called; no unhandled rejection.
  - TC-03: `confirmDayClosed` still works unchanged (existing TC-13 in `EodChecklistContent.test.tsx` covers this).
- **Execution plan:** Add `EodOverrideSignoff` type. Add `confirmDayClosedWithOverride` using `useCallback` mirroring `confirmDayClosed` but merging signoff into payload. Extend the `useMemo` return. Run `pnpm typecheck` scoped to `apps/reception`.

  **Consumer tracing — new output `confirmDayClosedWithOverride`:**
  - Producer: `useEodClosureMutations` hook.
  - Consumer: `EodChecklistContent` — to be added in TASK-04. No existing consumer reads this field yet. This is safe: the hook's return type is additive; existing destructuring in `EodChecklistContent` (`const { confirmDayClosed }`) is unchanged.

  **Consumer tracing — modified return type of `useEodClosureMutations`:**
  - The return type annotation expands from `{ confirmDayClosed: () => Promise<void> }` to include `confirmDayClosedWithOverride`. The only caller is `EodChecklistContent.tsx` which destructures `{ confirmDayClosed }` — the new field is simply not destructured there yet, which is valid TypeScript. TASK-04 adds the new destructure.

- **Planning validation (required for M/L):** None: S effort.
- **Scouts:** None: no unknowns.
- **Edge Cases & Hardening:** If `user` is null when `confirmDayClosedWithOverride` is called, return early (same guard as `confirmDayClosed`). The `overrideManagerName` field in the signoff is always populated by `EodOverrideModal` before calling `onConfirm`.
- **What would make this >=90%:** Already at 90%. Held-back test passed.
- **Rollout / rollback:**
  - Rollout: Additive hook change; safe to deploy independently.
  - Rollback: Remove the new callback from the hook; `EodChecklistContent` destructures only what it uses.
- **Documentation impact:** None: internal hook.
- **Notes / references:** Pattern reference: `apps/reception/src/hooks/mutations/useEodClosureMutations.ts` (read in full).

---

### TASK-03: Create `EodOverrideModal` component

- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/reception/src/components/eodChecklist/EodOverrideModal.tsx` — manager reauth modal for EOD exception override.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Build evidence:** Committed in `c6544be0b4` (Wave 1 alongside TASK-01). New file `EodOverrideModal.tsx` created using `VarianceSignoffModal` as structural template. Different-manager check removed. No `shiftOwner` props. `withModalBackground(memo(EodOverrideModalBase))` export pattern followed. All `data-cy` attributes applied. Import sort corrected on first lint run. Typecheck passes.
- **Affects:** `apps/reception/src/components/eodChecklist/EodOverrideModal.tsx` (new file), `[readonly] apps/reception/src/services/managerReauth.ts`, `[readonly] apps/reception/src/components/till/VarianceSignoffModal.tsx`, `[readonly] apps/reception/src/components/bar/orderTaking/modal/ModalContainer.tsx`, `[readonly] apps/reception/src/hoc/withModalBackground.tsx`
- **Depends on:** -
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 90%
  - Implementation: 90% — `VarianceSignoffModal.tsx` is a direct template read in full. Component structure, field layout, `verifyManagerCredentials` call, `withModalBackground` HOC wrapping, `memo()`, `Button`/`Input`/`Textarea` usage are all established. Difference from `VarianceSignoffModal`: no different-manager check; no `shiftOwner` props; different heading/description text.
  - Approach: 95% — single valid approach. No design forks.
  - Impact: 85% — new file only; no existing file modified. Risk of incorrect import path resolution: import paths relative to `eodChecklist/` differ slightly from `till/` for `managerReauth` and `ModalContainer`. Held-back test: could import path resolution fail? Unlikely — paths are deterministic from `eodChecklist/` directory. The fact-find identified both paths (`../../services/managerReauth`, `../bar/orderTaking/modal/ModalContainer`) as used in adjacent files.
- **Acceptance:**
  - `EodOverrideModal` accepts `{ onConfirm: (signoff: EodOverrideSignoff) => void, onCancel: () => void }`.
  - Renders email, password, and reason fields (all with `data-cy` attributes).
  - Calls `verifyManagerCredentials(email, password)` on submit.
  - On success: calls `onConfirm({ overrideManagerName, overrideManagerUid, overrideReason })`.
  - On failure: shows error message in the form; does not call `onConfirm`.
  - Empty reason field: shows error before calling `verifyManagerCredentials`.
  - Empty email or password: shows error before calling `verifyManagerCredentials`.
  - Submit button shows "Verifying..." while `isSubmitting` is true.
  - Exported via `export default withModalBackground(memo(EodOverrideModalBase))`.
  - **NO** different-manager check — any manager can authorise the override.
- **Validation contract (TC-XX):**
  - TC-01: Renders with email, password, reason fields and a submit button.
  - TC-02: Empty reason → "Override reason is required." error shown; `verifyManagerCredentials` not called.
  - TC-03: Empty email → "Email and password are required." error; `verifyManagerCredentials` not called.
  - TC-04: `verifyManagerCredentials` returns `{ success: false, error: "Invalid email or password." }` → error shown in form; `onConfirm` not called.
  - TC-05: `verifyManagerCredentials` returns `{ success: true, user: { uid: 'uid-2', user_name: 'alice', ... } }` → `onConfirm` called with `{ overrideManagerName: 'alice', overrideManagerUid: 'uid-2', overrideReason: 'reason text' }`.
  - TC-06: Submit button shows "Verifying..." while `isSubmitting` is true.
  - TC-07: `onCancel` called when Cancel button clicked.
- **Execution plan:**
  1. Create `EodOverrideModal.tsx` using `VarianceSignoffModal.tsx` as structural template.
  2. Remove the different-manager separation check.
  3. Remove `shiftOwner*` props.
  4. Replace variance-specific heading/description with override-specific text ("Manager Authorisation Required" / "One or more required steps could not be completed. Provide your credentials and a reason to proceed.").
  5. `onConfirm` callback carries `EodOverrideSignoff` (imported from `useEodClosureMutations`).
  6. Add `data-cy` attributes: `eod-override-email`, `eod-override-password`, `eod-override-reason`, `eod-override-submit`, `eod-override-cancel`, `eod-override-error`.
  7. Export as `withModalBackground(memo(EodOverrideModalBase))`.

  **Consumer tracing — `EodOverrideModal` output (the component itself):**
  - Consumer: `EodChecklistContent` (TASK-04). The component is imported and conditionally rendered. No other consumer.

- **Planning validation (required for M/L):**
  - Checks run: `VarianceSignoffModal.tsx` read in full (fact-find). Import paths verified for `eodChecklist/` directory context.
  - Validation artifacts: `VarianceSignoffModal.tsx` lines 1-159 confirmed as template. `withModalBackground.tsx` confirmed wraps with `SimpleModal`. `ModalContainer` confirmed at `../bar/orderTaking/modal/ModalContainer`.
  - Unexpected findings: None.
- **Scouts:** Verify import path for `EodOverrideSignoff` type from `useEodClosureMutations` — relative path from `eodChecklist/` is `../../hooks/mutations/useEodClosureMutations`.
- **Edge Cases & Hardening:** `verifyManagerCredentials` network failure returns `{ success: false, error: "Network error. Check your connection." }` — the modal's error display handles this generically.
- **What would make this >=90%:** Held-back test on Impact dimension: could path resolution fail? `../../services/managerReauth` and `../../hooks/mutations/useEodClosureMutations` from `components/eodChecklist/` are the same depth as from `components/till/` — both resolve correctly. Raising to 90% requires building and type-checking. Already at 90% with held-back test passed via path analysis.
- **Rollout / rollback:**
  - Rollout: New file only; no existing code changes. Safe to deploy in isolation (component is unused until TASK-04 wires it in).
  - Rollback: Delete the file.
- **Documentation impact:** None: internal component.
- **Notes / references:** Template: `apps/reception/src/components/till/VarianceSignoffModal.tsx`. `getUserDisplayName` from `../../lib/roles` used to get manager display name from `ManagerAuthResult.user`.

---

### TASK-04: Wire override modal into `EodChecklistContent` and update banner

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` — adds override button conditional render, `EodOverrideModal` usage, and extends the "Day closed" banner with override details.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Build evidence:** Committed in `602667ab92`. `showOverrideModal` state added. `confirmDayClosedWithOverride` destructured from hook. Override button conditional added after confirm button block. `EodOverrideModal` conditional render added. Banner extended with `day-closed-override-note` section guarded by `closure.overrideReason`. Import sort corrected on first lint run. Typecheck passes.
- **Affects:** `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx`, `[readonly] apps/reception/src/components/eodChecklist/EodOverrideModal.tsx`, `[readonly] apps/reception/src/hooks/mutations/useEodClosureMutations.ts`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 90% — `EodChecklistContent.tsx` read in full. Exact mutation sites identified: line 63 (`allDone`), lines 194–203 (confirm button conditional), lines 65–83 (banner). The changes are surgical — no structural rewrite needed.
  - Approach: 90% — single valid approach given constraints.
  - Impact: 90% — only `EodChecklistContent` is modified. The component is self-contained; no other component imports it (it is rendered by a page). Banner extension is backwards-compatible: new conditional block renders only when `closure.overrideReason` is truthy.
- **Acceptance:**
  - `showOverrideModal` state added (boolean, default false).
  - `confirmDayClosedWithOverride` destructured from `useEodClosureMutations()`.
  - Override button rendered when `!allDone && !eodClosureLoading && closure === null`. Button text: "Override & close day". `data-cy="eod-override-button"`.
  - Clicking override button sets `showOverrideModal = true`.
  - `EodOverrideModal` rendered when `showOverrideModal` is true.
  - `EodOverrideModal.onConfirm`: calls `confirmDayClosedWithOverride(signoff)` then sets `showOverrideModal = false`.
  - `EodOverrideModal.onCancel`: sets `showOverrideModal = false`.
  - Banner: when `closure !== null && closure.overrideReason`, renders an additional section showing override reason and authorising manager name. `data-cy="day-closed-override-note"`.
  - Existing confirm button path unchanged: `{allDone && !eodClosureLoading && (confirm button)}`.
  - Existing banner for normal closure unchanged.
- **Validation contract (TC-XX):**
  - TC-01: `allDone=false`, `closure=null`, `eodClosureLoading=false` → override button visible; confirm button absent.
  - TC-02: `allDone=true`, `closure=null`, `eodClosureLoading=false` → confirm button visible; override button absent.
  - TC-03: Override button clicked → `EodOverrideModal` rendered.
  - TC-04: `EodOverrideModal.onConfirm` called → `confirmDayClosedWithOverride` called; modal hidden.
  - TC-05: `EodOverrideModal.onCancel` called → modal hidden; `confirmDayClosedWithOverride` not called.
  - TC-06: `closure` has `overrideReason` and `overrideManagerName` → `day-closed-override-note` visible with reason and manager name text.
  - TC-07: `closure` has no `overrideReason` → `day-closed-override-note` absent.
  - TC-08: `allDone=false`, `closure !== null` (day already closed by override earlier) → override button absent; banner visible.
- **Execution plan:**
  1. Import `EodOverrideModal` and `EodOverrideSignoff`.
  2. Add `showOverrideModal` state.
  3. Destructure `confirmDayClosedWithOverride` from `useEodClosureMutations()`.
  4. Below the confirm button block, add the override button conditional.
  5. Below the float modal, add `EodOverrideModal` conditional render.
  6. In the banner block (lines 65–83), add a conditional section for override note.

  **Consumer tracing — `confirmDayClosedWithOverride` (new output from TASK-02):**
  - Producer: `useEodClosureMutations` hook (TASK-02).
  - Consumer: `EodChecklistContent` — this task. Call site: `EodOverrideModal.onConfirm` handler.
  - No other consumers exist. Safe.

  **Consumer tracing — `EodOverrideModal` component (new output from TASK-03):**
  - Producer: `EodOverrideModal.tsx` (TASK-03).
  - Consumer: `EodChecklistContent` — this task. Renders conditionally.
  - No other consumers exist. Safe.

  **Consumer tracing — `closure.overrideReason` (new optional field from TASK-01):**
  - The banner reads `closure.overrideReason`. TypeScript will enforce this as `string | undefined` since the field is optional. The conditional `closure.overrideReason &&` guards the render correctly.
  - `EndOfDayPacket.tsx` and `ManagerAuditContent.tsx` do not read override fields — confirmed in fact-find. No changes needed there.

- **Planning validation (required for M/L):**
  - Checks run: `EodChecklistContent.tsx` read in full (lines 1–213). Exact mutation sites confirmed: line 63 for `allDone`, lines 194–203 for confirm button, lines 65–83 for banner.
  - Validation artifacts: Component structure is simple (no complex state machine); changes are additive conditional blocks.
  - Unexpected findings: None.
- **Scouts:** Verify `void confirmDayClosedWithOverride(signoff)` usage — existing pattern is `onClick={() => void confirmDayClosed()}` (line 198); apply same void-wrapping for the async call.
- **Edge Cases & Hardening:**
  - If `confirmDayClosedWithOverride` throws after `EodOverrideModal` calls `onConfirm`, the modal will already have closed. The toast error from the mutation will surface the failure. This matches the existing `confirmDayClosed` behaviour.
  - `allDone=false` but `closure !== null` (rare: day already closed by another route) — override button must not show. The condition `closure === null` gates this correctly.
- **What would make this >=90%:** Already at 90%. Held-back test: could the import of `EodOverrideModal` introduce a circular dependency? No — `EodOverrideModal` is in the same directory and imports from `services/` and `hooks/` only; no circular path.
- **Rollout / rollback:**
  - Rollout: Safe incremental deploy — override button only appears when `allDone` is false; normal operation is unchanged.
  - Rollback: Remove override button block and banner extension. Override records remain in Firebase (harmless, fields are optional).
- **Documentation impact:** None: internal component.
- **Notes / references:** Exact line numbers confirmed from fact-find code read.

---

### TASK-05: Write tests for override path

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx` (new test cases TC-19 through TC-26) + new `apps/reception/src/components/eodChecklist/__tests__/EodOverrideModal.test.tsx`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Build evidence:** Committed in `81200f05b9`. `EodOverrideModal.test.tsx` created with TC-01 through TC-07 using `withModalBackground` passthrough mock, `ModalContainer` passthrough mock, `verifyManagerCredentials` mock (relative path `../../../services/managerReauth`), and `getUserDisplayName` mock. `EodChecklistContent.test.tsx` extended with `confirmDayClosedWithOverrideMock` var, updated `useEodClosureMutations` mock, new `EodOverrideModal` mock exposing `onConfirm`/`onCancel` via `data-cy` attributes, TC-19 through TC-26. All `data-cy` attribute targeting (testIdAttribute: "data-cy"). Typecheck and lint pass.
- **Affects:** `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx`, `apps/reception/src/components/eodChecklist/__tests__/EodOverrideModal.test.tsx` (new file), `[readonly] apps/reception/src/components/eodChecklist/EodOverrideModal.tsx`, `[readonly] apps/reception/src/components/eodChecklist/EodChecklistContent.tsx`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — existing 18-test file read in full; mock patterns are fully understood. New tests follow the same mock infrastructure. The only uncertainty is the exact mock path for `EodOverrideModal` in `EodChecklistContent.test.tsx` (needs to be the relative path from the test file, not an `@/` alias).
  - Approach: 90% — RTL unit tests are the correct and only required approach. Pattern is established.
  - Impact: 85% — tests provide the CI gate for correctness. No runtime impact. Small risk: if mock path for `verifyManagerCredentials` in `EodOverrideModal.test.tsx` is incorrect, tests will fail to intercept the mock (known Jest behaviour — must use relative path matching the import in the component). This is a standard Jest gotcha, explicitly noted in MEMORY.md.
- **Acceptance:**
  - `EodChecklistContent.test.tsx` gains TC-19 through TC-26 (see Validation contract).
  - New `EodOverrideModal.test.tsx` with TC-01 through TC-07 (matching the TASK-03 validation contract).
  - All existing TC-01–TC-18 continue to pass without modification.
  - All new tests follow `data-cy` attribute targeting (`testIdAttribute: "data-cy"` per `jest.setup.ts`).
- **Validation contract (TC-XX):**

  **EodChecklistContent.test.tsx additions:**
  - TC-19: `allDone=false`, `closure=null`, `eodClosureLoading=false` → `eod-override-button` present; `confirm-day-closed` absent.
  - TC-20: `allDone=true`, `closure=null`, `eodClosureLoading=false` → `confirm-day-closed` present; `eod-override-button` absent.
  - TC-21: `allDone=false`, `closure !== null` (already closed) → `eod-override-button` absent; `day-closed-banner` present.
  - TC-22: Override button clicked → `EodOverrideModal` rendered (mock present with `data-cy="eod-override-modal"`).
  - TC-23: `EodOverrideModal.onConfirm` called → `confirmDayClosedWithOverrideMock` called with signoff payload; modal hidden.
  - TC-24: `EodOverrideModal.onCancel` called → modal hidden; `confirmDayClosedWithOverrideMock` not called.
  - TC-25: Closure has `overrideReason` and `overrideManagerName` → `day-closed-override-note` present with correct text.
  - TC-26: Closure has no `overrideReason` → `day-closed-override-note` absent.

  **EodOverrideModal.test.tsx:**
  - TC-01: Renders with email, password, reason inputs and submit/cancel buttons.
  - TC-02: Empty reason → error message shown; `verifyManagerCredentials` not called.
  - TC-03: Empty email → error shown; `verifyManagerCredentials` not called.
  - TC-04: `verifyManagerCredentials` returns `{ success: false, error: '...' }` → error shown; `onConfirm` not called.
  - TC-05: `verifyManagerCredentials` returns `{ success: true, user: { uid: 'uid-2', user_name: 'alice' } }` → `onConfirm` called with correct `EodOverrideSignoff`.
  - TC-06: Submit button shows "Verifying…" while submitting.
  - TC-07: Cancel button clicked → `onCancel` called.

- **Execution plan:**
  1. In `EodChecklistContent.test.tsx`: add mock for `EodOverrideModal` (similar to existing `OpeningFloatModal` mock — expose `onConfirm`/`onCancel` via `data-cy` attributes). Add `confirmDayClosedWithOverrideMock`. Add TC-19–TC-26.
  2. Create `EodOverrideModal.test.tsx`: mock `../../services/managerReauth` (relative path matches component import). Mock `withModalBackground` to render children directly. Mock `getUserDisplayName` to return `user.user_name`. Write TC-01–TC-07 using `act` + `fireEvent`/`userEvent`.
  3. Run via `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=EodOverride --no-coverage` (CI only per policy — do not run locally, just ensure tests are correct).

  **Consumer tracing — new tests read `overrideReason` from `closure` (schema extended in TASK-01):**
  - Test fixtures that construct `closure` objects with `overrideReason` require `EodClosure` type to include the optional field. This is guaranteed by TASK-01's schema extension.

- **Planning validation (required for M/L):**
  - Checks run: existing test file read in full (TC-01–TC-18). Mock patterns for `OpeningFloatModal`, `useEodClosureMutations`, `useEodClosureData` confirmed.
  - Validation artifacts: `jest.setup.ts` `testIdAttribute: "data-cy"` confirmed in MEMORY.md. Relative import mock pattern confirmed in MEMORY.md note on Jest mock resolution.
  - Unexpected findings: MEMORY.md notes that relative imports are not intercepted by `@/` alias mocks — mock path for `verifyManagerCredentials` in `EodOverrideModal.test.tsx` must use the relative path `../../services/managerReauth` (relative from the test file location at `eodChecklist/__tests__/`), which resolves to `apps/reception/src/services/managerReauth`. This is the same relative depth as `till/__tests__/` for VarianceSignoffModal.
- **Scouts:** Verify `withModalBackground` mock pattern for isolated modal component tests — check if `VarianceSignoffModal` or `OpeningFloatModal` have standalone test files for reference.
- **Edge Cases & Hardening:** Ensure `act()` wrappers around async `verifyManagerCredentials` mock responses to prevent React state update warnings in tests.
- **What would make this >=90%:** Running tests in CI and observing green output. The 15% gap is standard for test authoring: the exact mock wiring is written at build time, not verifiable at planning time.
- **Rollout / rollback:**
  - Rollout: Tests ship alongside implementation; CI validates on push.
  - Rollback: Delete test file additions if feature is rolled back.
- **Documentation impact:** None.
- **Notes / references:** MEMORY.md: "Relative imports not intercepted by `@/` alias mocks." MEMORY.md: `testIdAttribute: "data-cy"`. Existing test file TC-01–TC-18 read in full.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Schema extension breaks existing closure reads | Low | Low | All new fields `optional()` in Zod; existing records parse cleanly. Covered by TC-01 of TASK-01. |
| Control erosion — override used as routine shortcut | Low | Moderate | Requires manager credentials + mandatory reason. Closure record stores override details for owner review. |
| Different-manager rule accidentally applied (copy-paste error) | Low | Moderate | Plan explicitly prohibits it. Build instructions call it out. No `shiftOwner` props in `EodOverrideModal`. |
| Jest mock path incorrect for `verifyManagerCredentials` | Low | Low | MEMORY.md pattern applied: use relative path `../../services/managerReauth` from `eodChecklist/__tests__/`. |
| `verifyManagerCredentials` network failure leaves modal open | Low | Low | Service returns `{ success: false, error: "Network error..." }` — modal displays error; user can retry or cancel. |

## Observability

- Logging: None: no server-side logging in this app; Firebase writes are the audit trail.
- Metrics: Presence of `overrideReason` field in `eodClosures` Firebase records signals override usage.
- Alerts/Dashboards: None: out of scope for this change.

## Acceptance Criteria (overall)

- [ ] Override button appears when any required checklist step is incomplete and no closure record exists.
- [ ] Override button is absent when all steps are complete (normal path unaffected).
- [ ] Override modal requires valid manager credentials; invalid credentials show error and block submission.
- [ ] Override modal requires a non-empty reason; empty reason shows error and blocks credential check.
- [ ] Successful override writes closure record to Firebase with `overrideReason`, `overrideManagerName`, `overrideManagerUid` populated.
- [ ] "Day closed" banner shows override note (reason + manager name) when `overrideReason` is present.
- [ ] All 18 existing test cases continue to pass.
- [ ] New test cases TC-19–TC-26 in `EodChecklistContent.test.tsx` pass in CI.
- [ ] New `EodOverrideModal.test.tsx` TC-01–TC-07 pass in CI.
- [ ] No TypeScript errors (`pnpm typecheck` scoped to `apps/reception`).

## Decision Log

- 2026-03-01: No different-manager separation constraint on EOD override — this is operational exception authorisation, not financial peer-separation (as in `VarianceSignoffModal`). Evidence: `VarianceSignoffModal.tsx` lines 64–72.
- 2026-03-01: Override operates at the overall EOD gate level (not per-step) — free-text reason captures which specific step(s) are blocked. Keeps implementation minimal, consistent with `VarianceSignoffModal` one-signoff-per-close pattern.
- 2026-03-01: Float step excluded from override scope — Float is already excluded from `allDone` gate; no override needed for it.

## Overall-confidence Calculation

- TASK-01: 95% × S(1) = 95
- TASK-02: 90% × S(1) = 90
- TASK-03: 90% × M(2) = 180
- TASK-04: 90% × M(2) = 180
- TASK-05: 85% × M(2) = 170
- Sum weights: 1+1+2+2+2 = 8
- Overall-confidence = (95+90+180+180+170)/8 = 715/8 = **89%** (rounded to 90%)

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extend eodClosureSchema | Yes | None | No |
| TASK-02: Add confirmDayClosedWithOverride mutation | Yes — TASK-01 provides extended EodClosure type; `eodClosureSchema.safeParse` accepts full payload | None | No |
| TASK-03: Create EodOverrideModal | Yes — `verifyManagerCredentials` exists and is unchanged; `withModalBackground`, `ModalContainer`, `Input`, `Textarea`, `Button` all confirmed present; `EodOverrideSignoff` type available from TASK-02 (parallel path: TASK-03 can import the type definition directly, which is available once TASK-01 defines it since type is co-located with mutation hook) | [Minor] TASK-03 imports `EodOverrideSignoff` from `useEodClosureMutations` which is added in TASK-02; if TASK-03 runs in parallel with TASK-02 (Wave 1), the type import will not exist yet. Resolution: TASK-03 can define `EodOverrideSignoff` type inline locally as a temporary measure, or TASK-02 must complete first. | No — resolved: Parallelism Guide places TASK-03 in Wave 1 alongside TASK-01, but `EodOverrideSignoff` type should be extracted to `eodClosureSchema.ts` (co-located with the schema) in TASK-01 so it is available to TASK-03 without needing TASK-02 to complete first. Build agent must apply this pattern. |
| TASK-04: Wire override modal + banner | Yes — TASK-02 (mutation) and TASK-03 (modal component) are prerequisites and in prior waves | None | No |
| TASK-05: Write tests | Yes — all implementation tasks complete; EodClosure type includes override fields; component API is stable | None | No |

**Simulation note on TASK-03 type import:** The `EodOverrideSignoff` type is co-located with the mutation hook in TASK-02. To enable TASK-01/TASK-03 parallel execution, the build agent should define `EodOverrideSignoff` in `eodClosureSchema.ts` (TASK-01) rather than in `useEodClosureMutations.ts` (TASK-02). This makes the type available from TASK-01 onward. TASK-02 then imports `EodOverrideSignoff` from the schema file rather than defining it. This is a minor implementation note — no structural change to the plan is required; it does not affect task confidence or sequencing.
