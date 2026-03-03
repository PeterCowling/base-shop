---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28 (TASK-05 complete)
Audit-Ref: 6389af29db025372e129738f54132a7a68b35231
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-eod-day-closed-confirmation
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# EOD Day-Closed Confirmation Plan

## Summary

`EodChecklistContent` currently shows till/safe/stock done-or-not but provides no act of closure: no button, no stored record, no closed state. This means managers must navigate away and rely on memory. The worldclass audit gap item "(d) offline-readable stored summary" is unmet. This plan adds a one-tap "Confirm day closed" button (visible when all three checks are complete and no closure record exists for today), writes a `eodClosures/<YYYY-MM-DD>` record to Firebase RTDB on confirmation, and renders a "Day closed" banner with timestamp on re-entry. The change touches the EOD checklist component, three new support files (schema, read hook, write hook), updated `database.rules.json`, and associated test files.

## Active tasks

- [x] TASK-01: Add `eodClosures` Firebase security rules
- [x] TASK-02: Create `eodClosureSchema.ts`
- [x] TASK-03: Create `useEodClosureData.ts` read hook
- [x] TASK-04: Create `useEodClosureMutations.ts` write hook
- [x] TASK-05: Update `EodChecklistContent.tsx` and tests

## Goals

- Surface a "Confirm day closed" button when all three EOD checks pass and no closure record exists for today.
- Write a `eodClosures/<YYYY-MM-DD>` record to Firebase with timestamp and confirming user.
- Show a "Day closed" banner with timestamp on re-entry when a record exists for today.
- Gate the confirmation button and closed-state banner behind `Permissions.MANAGEMENT_ACCESS` in `EodChecklistContent` (UI/action gating — no permission change to existing code). Firebase data-layer read uses the established `.read: "auth != null"` pattern, consistent with all other operational nodes.

## Non-goals

- Unlocking or editing a closed day.
- Showing historical closures beyond today.
- Any change to the underlying till/safe/stock completion signals.
- Navigation changes to the `/eod-checklist` route.
- Offline-first PWA persistence (RTDB does not cache this path offline by default; session-loaded data is sufficient for the reception context).

## Constraints & Assumptions

- Constraints:
  - Firebase Realtime Database only (not Firestore).
  - `set()` for idempotent date-keyed write; if full same-day audit trail is ever needed, switch to `push` at `eodClosures/<date>/confirmations/<push-id>` (out of scope now).
  - Must follow hook + mutation pattern: read hook in `hooks/data/`, write hook in `hooks/mutations/`, Zod schema in `schemas/`.
  - Test IDs must use `data-cy` attribute (`testIdAttribute: "data-cy"` in jest.setup.ts).
  - Italy timezone for all date keys: `extractItalyDate(getItalyIsoString())`.
  - Firebase rules must be updated to explicitly restrict `eodClosures` writes to `MANAGEMENT_ACCESS` roles (owner, developer, admin, manager). Without an explicit rule the `$other` wildcard allows any authenticated user to write — that is too broad for a management-only confirmation record.
- Assumptions:
  - Closed-state UX: banner-only (no underlying status cards when day is closed). Default assumption; easily changed post-delivery.
  - `user.user_name` is always present for authenticated `MANAGEMENT_ACCESS` users (confirmed in `userProfileSchema`).
  - `eodClosures` is a new top-level Firebase node with no existing data.

## Inherited Outcome Contract

- **Why:** The EOD checklist was delivered with sub-task status indicators but no act of day closure. The worldclass audit gap stated "(d) offline-readable stored summary" as a requirement. That criterion is unmet by the current read-only view. This stores a closure record visible on re-entry without reloading underlying data.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After the build, a manager who has completed all three EOD tasks can confirm day closure in one tap on the `/eod-checklist` page. The confirmation is stored in Firebase and visible as a timestamped "Day closed" state on any subsequent visit to the page on the same day — including after reloading or navigating away.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/brik-eod-day-closed-confirmation/fact-find.md`
- Key findings used:
  - All four resolved questions (no re-auth, date-keyed `set`, loading guard suppresses button, `extractItalyDate` for key).
  - Firebase security rules analysis: `$other` wildcard permits any `auth != null` write; explicit `eodClosures` rule required.
  - Mutation pattern from `useSafeCountsMutations.ts`.
  - Read hook pattern from `useFirebaseSubscription.ts` / `useInventoryLedger.ts`.
  - Schema pattern from `safeCountSchema.ts`.
  - Test mock pattern from `EodChecklistContent.test.tsx`.

## Proposed Approach

- Option A: `set` on date-keyed path `eodClosures/<YYYY-MM-DD>` — idempotent, one record per day.
- Option B: `push` to `eodClosures/<YYYY-MM-DD>/confirmations/<push-id>` — full same-day audit trail.
- Chosen approach: **Option A**. The EOD closure is a day-level fact, not an audit log. Idempotency is the correct model: the most recent confirmation is authoritative, and re-confirming is a safe no-op from a data integrity perspective. Option B adds query complexity (read all children to determine if closed) for a benefit not required by the current worldclass gap. If audit trail is ever needed it can be added as a separate collection.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `eodClosures` Firebase security rules | 95% | S | Complete (2026-02-28) | - | TASK-04 |
| TASK-02 | IMPLEMENT | Create `eodClosureSchema.ts` | 95% | S | Complete (2026-02-28) | - | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Create `useEodClosureData.ts` read hook | 90% | S | Complete (2026-02-28) | TASK-02 | TASK-05 |
| TASK-04 | IMPLEMENT | Create `useEodClosureMutations.ts` write hook | 90% | S | Complete (2026-02-28) | TASK-01, TASK-02 | TASK-05 |
| TASK-05 | IMPLEMENT | Update `EodChecklistContent.tsx` and tests | 85% | M | Complete (2026-02-28) | TASK-03, TASK-04 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | No dependencies; can run in parallel |
| 2 | TASK-03, TASK-04 | TASK-02 (both); TASK-01 (TASK-04 only) | TASK-03 depends only on TASK-02; TASK-04 depends on both TASK-01 and TASK-02; wave begins once all wave-1 tasks are complete; TASK-03 and TASK-04 can run in parallel |
| 3 | TASK-05 | TASK-03, TASK-04 | Component update needs both hooks |

## Tasks

---

### TASK-01: Add `eodClosures` Firebase security rules

- **Type:** IMPLEMENT
- **Deliverable:** code-change — updated `apps/reception/database.rules.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/database.rules.json`
- **Depends on:** -
- **Blocks:** TASK-04
- **Status:** Complete (2026-02-28)
- **Build evidence:** Commit `6a9d5e3e4f`. `eodClosures` node added to `database.rules.json` with `.read: "auth != null"` and `$dateKey` write rule restricted to owner/developer/admin/manager only, `newData.exists()` guard present, no `!data.exists()` (overwrite permitted). JSON validated clean. Typecheck + lint passed via pre-commit hooks.
- **Confidence:** 95%
  - Implementation: 95% — rules pattern is well-established; `tillShifts` shows the `newData.exists()` write-gate pattern (allows create and overwrite); `inventory/items` shows the management-only role restriction (owner, developer, admin, manager — no staff). MANAGEMENT_ACCESS roles are owner, developer, admin, manager.
  - Approach: 95% — add an explicit `eodClosures` node with `.read: "auth != null"` and `$dateKey: { ".write": "<management-role-check> && newData.exists()" }`. The `newData.exists()` constraint is appropriate (allows create and overwrite — `set()` first-write and re-confirmation). No `!data.exists()` constraint because re-confirmation (overwrite) must be permitted.
  - Impact: 95% — without this rule, any authenticated user can write to `eodClosures` via the `$other` wildcard. Adding this rule is a security improvement with zero functional downside.
- **Acceptance:**
  - `eodClosures` node added to `database.rules.json` with `.read: "auth != null"` and a `$dateKey` write rule restricted to owner, developer, admin, and manager roles.
  - `newData.exists()` on write (allows create and overwrite; prevents deletion via write).
  - Rule structure is consistent with `tillShifts.$shiftId` pattern (no `!data.exists()` so overwrite is permitted).
  - Read access is `.read: "auth != null"` — broad authenticated-user read, consistent with the established pattern for all operational nodes in the rules file (`cashCounts`, `safeCounts`, `tillShifts`, `inventory` all use the same broad-read + restricted-write pattern). UI-level access control via `Permissions.MANAGEMENT_ACCESS` in `EodChecklistContent` is the authoritative UX gate; data-layer read is permissive by design.
- **Validation contract:**
  - TC-01: Rule exists in JSON for `eodClosures` node.
  - TC-02: Write condition checks owner/developer/admin/manager role flags.
  - TC-03: `newData.exists()` present to prevent null-write deletion.
  - TC-04: No `!data.exists()` constraint (overwrite permitted for re-confirmation).
- **Execution plan:** Red (no rule → any auth write permitted) → Green (add explicit node) → Refactor (none needed)
- **Planning validation (required for M/L):** None: S effort task
- **Scouts:** None: rules file read directly, pattern confirmed from `tillShifts` node
- **Edge Cases & Hardening:**
  - Overwrite on same day: `newData.exists()` allows this — correct.
  - Deletion prevention: `newData.exists()` blocks null-write — desired.
  - Staff role (not manager): excluded from write rule — correct.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: deploy rules change to Firebase console (or via CI if rules are deployed automatically).
  - Rollback: revert the `eodClosures` block from `database.rules.json`; existing `$other` wildcard remains.
- **Documentation impact:** None
- **Notes / references:**
  - Pattern references: `tillShifts.$shiftId` in `apps/reception/database.rules.json` (uses `newData.exists()` without `!data.exists()` — the overwrite-permitted write pattern); `inventory/items.$itemId` (management-only role restriction, no staff — the role-restriction pattern for eodClosures). Both patterns are needed; neither alone is the complete template.
  - MANAGEMENT_ACCESS roles: owner, developer, admin, manager (from `lib/roles.ts`).

---

### TASK-02: Create `eodClosureSchema.ts`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — new file `apps/reception/src/schemas/eodClosureSchema.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/schemas/eodClosureSchema.ts`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04
- **Status:** Complete (2026-02-28)
- **Build evidence:** Commit `6a9d5e3e4f`. `eodClosureSchema.ts` created with `z.object({ date, timestamp, confirmedBy, uid? })` and `EodClosure` type export. File naming convention confirmed. Typecheck + lint passed via pre-commit hooks.
- **Confidence:** 95%
  - Implementation: 95% — schema follows established Zod pattern in `safeCountSchema.ts`. All field types are simple (`z.string()`, `z.string().optional()`).
  - Approach: 95% — `z.object({...})` for single record, `z.record(eodClosureSchema)` not needed (single-path read, not a collection).
  - Impact: 95% — foundational type contract for both hooks. No risk.
- **Acceptance:**
  - `eodClosureSchema` exported as Zod schema with fields: `date: z.string()`, `timestamp: z.string()`, `confirmedBy: z.string()`, `uid: z.string().optional()`.
  - `EodClosure` type exported as `z.infer<typeof eodClosureSchema>`.
  - File follows naming convention: `apps/reception/src/schemas/eodClosureSchema.ts`.
- **Validation contract:**
  - TC-01: Schema accepts valid object `{ date: "2026-02-28", timestamp: "...", confirmedBy: "pete" }`.
  - TC-02: Schema accepts object with `uid` present.
  - TC-03: Schema rejects object missing `date`.
  - TC-04: Schema rejects object missing `confirmedBy`.
- **Execution plan:** Red (no schema) → Green (create file) → Refactor (none)
- **Planning validation (required for M/L):** None: S effort task
- **Scouts:** None: pattern direct copy from `safeCountSchema.ts`
- **Edge Cases & Hardening:** None: schema is minimal and unambiguous
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: new file, no changes to existing code until consumed by hooks.
  - Rollback: delete file (no dependents until TASK-03/04 are built).
- **Documentation impact:** None
- **Notes / references:**
  - Pattern: `apps/reception/src/schemas/safeCountSchema.ts`

---

### TASK-03: Create `useEodClosureData.ts` read hook

- **Type:** IMPLEMENT
- **Deliverable:** code-change — new file `apps/reception/src/hooks/data/useEodClosureData.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/hooks/data/useEodClosureData.ts`, `[readonly] apps/reception/src/hooks/data/useFirebaseSubscription.ts`, `[readonly] apps/reception/src/schemas/eodClosureSchema.ts`, `[readonly] apps/reception/src/utils/dateUtils.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-05
- **Status:** Complete (2026-02-28)
- **Build evidence:** Commit `1272fde23d`. `useEodClosureData.ts` created — wraps `useFirebaseSubscription<EodClosure>` at `eodClosures/${dateKey}` path with `eodClosureSchema`. Returns `{ closure, loading, error }`. Typecheck + lint passed.
- **Confidence:** 90%
  - Implementation: 90% — wraps `useFirebaseSubscription`; date key derivation uses `extractItalyDate(getItalyIsoString())` which is well-tested. The path is `eodClosures/<dateKey>`.
  - Approach: 90% — direct use of `useFirebaseSubscription<EodClosure>(path, eodClosureSchema)`. No custom `onValue` subscription needed.
  - Impact: 90% — pure new code, no existing consumers affected.
- **Acceptance:**
  - Hook returns `{ closure: EodClosure | null, loading: boolean, error: unknown }`.
  - Path computed as `eodClosures/${extractItalyDate(getItalyIsoString())}`.
  - `loading` is `true` until first Firebase response.
  - `closure` is `null` if no record exists for today.
  - `closure` is `EodClosure` if record exists.
- **Validation contract:**
  - TC-01: Hook wraps `useFirebaseSubscription` at the correct path.
  - TC-02: Returns `closure: null` when subscription data is null.
  - TC-03: Returns `closure: EodClosure` when subscription data is valid.
- **Execution plan:** Red (no hook) → Green (create file) → Refactor (none)
- **Planning validation (required for M/L):** None: S effort task
- **Scouts:**
  - `extractItalyDate` exists in `dateUtils.ts` at line 831 — confirmed in fact-find.
  - `useFirebaseSubscription` signature: `<T>(path: string, schema?: ZodTypeAny)` → `{ data: T | null, loading, error }` — confirmed.
- **Edge Cases & Hardening:**
  - Empty path guard: `extractItalyDate` always returns a valid date string — no empty path risk.
  - Schema validation failure: `useFirebaseSubscription` handles Zod errors internally (toast + retain previous data).
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: new file, no side effects until TASK-05 wires it.
  - Rollback: delete file.
- **Documentation impact:** None
- **Notes / references:**
  - Pattern: `apps/reception/src/hooks/data/inventory/useInventoryLedger.ts` (thin wrapper over `useFirebaseSubscription`).

---

### TASK-04: Create `useEodClosureMutations.ts` write hook + tests

- **Type:** IMPLEMENT
- **Deliverable:** code-change — new files `apps/reception/src/hooks/mutations/useEodClosureMutations.ts` and `apps/reception/src/hooks/mutations/__tests__/useEodClosureMutations.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/hooks/mutations/useEodClosureMutations.ts`, `apps/reception/src/hooks/mutations/__tests__/useEodClosureMutations.test.ts`, `[readonly] apps/reception/src/schemas/eodClosureSchema.ts`, `[readonly] apps/reception/src/services/useFirebase.ts`, `[readonly] apps/reception/src/context/AuthContext.tsx`, `[readonly] apps/reception/src/utils/dateUtils.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-05
- **Status:** Complete (2026-02-28)
- **Build evidence:** Commit `1272fde23d`. `useEodClosureMutations.ts` created — `confirmDayClosed()` with auth guard, `extractItalyDate`/`getItalyIsoString` date key, Zod `safeParse`, `set(ref(database, 'eodClosures/${dateKey}'), result.data)`, error toasts. `useEodClosureMutations.test.ts`: TC-01 (write path) and TC-02 (no-user guard) both pass. Typecheck + lint passed.
- **Confidence:** 90%
  - Implementation: 90% — mutation pattern is mechanical; `useSafeCountsMutations.ts` provides the exact template.
  - Approach: 90% — `useCallback` + auth guard + `set(ref(database, 'eodClosures/${dateKey}'), payload)` + Zod `safeParse` + `showToast` on error + `useMemo` on return. The write uses `set` not `push` (idempotent overwrite).
  - Impact: 90% — new code, no existing behavior changes.
- **Acceptance:**
  - `useEodClosureMutations` exports `{ confirmDayClosed: () => Promise<void> }`.
  - `confirmDayClosed` guards on `user` (early return if null).
  - `confirmDayClosed` computes `dateKey = extractItalyDate(getItalyIsoString())`.
  - `confirmDayClosed` constructs payload: `{ date: dateKey, timestamp: getItalyIsoString(), confirmedBy: user.user_name, uid: user.uid }`.
  - `confirmDayClosed` runs `eodClosureSchema.safeParse(payload)` before writing.
  - `confirmDayClosed` calls `set(ref(database, 'eodClosures/${dateKey}'), parsed.data)`.
  - On Zod parse failure: `showToast(getErrorMessage(result.error), "error")` and return.
  - On Firebase write error: `showToast("Failed to confirm day closed.", "error")`.
  - Tests (in `useEodClosureMutations.test.ts`):
    - TC-01: `confirmDayClosed` called with valid user → `set` called with correct path and payload.
    - TC-02: `confirmDayClosed` called with no user → `set` not called, early return.
- **Validation contract:**
  - TC-01: writes `set(ref(db, 'eodClosures/2026-02-28'), { date: '2026-02-28', timestamp: '...', confirmedBy: 'pete', uid: undefined })` when user mock has `uid` undefined.
  - TC-02: `set` not called when `userMock = null`.
- **Execution plan:** Red (no hook or tests) → Green (create hook + tests) → Refactor (none)
- **Planning validation (required for M/L):** None: S effort task
- **Scouts:**
  - `user.uid` is `string | undefined` (from `User` type in `userDomain.ts`) — hook must treat it as optional.
  - `showToast` import from `../../utils/toastUtils`.
  - `getErrorMessage` import from `../../utils/errorMessage`.
- **Edge Cases & Hardening:**
  - `user.uid` optional: include in payload as `uid: user.uid ?? undefined` (passes Zod `z.string().optional()`).
  - Re-confirmation (same day): `set` overwrites — safe, no guard needed.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: new file; no consumers until TASK-05.
  - Rollback: delete files.
- **Documentation impact:** None
- **Notes / references:**
  - Pattern: `apps/reception/src/hooks/mutations/useSafeCountsMutations.ts`
  - Test pattern: `apps/reception/src/hooks/mutations/__tests__/useSafeCountsMutations.test.tsx`

---

### TASK-05: Update `EodChecklistContent.tsx` and tests

- **Type:** IMPLEMENT
- **Deliverable:** code-change — updated `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` and `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Build evidence:** Commit `ff3f4e9e8e`. `EodChecklistContent.tsx` updated — `useEodClosureData()` and `useEodClosureMutations()` called unconditionally before `canView` gate. `allDone = tillDone && safeDone && stockDone` derived. Day-closed banner (`data-cy="day-closed-banner"`) renders when `closure !== null && !eodClosureLoading`. Confirm button (`data-cy="confirm-day-closed"`) renders when `allDone && !eodClosureLoading && closure === null`. `EodChecklistContent.test.tsx` updated — TC-10 through TC-13 added; all 13 tests pass. Typecheck clean. Lint clean (7 pre-existing warnings, 0 errors).
- **Affects:** `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx`, `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx`, `[readonly] apps/reception/src/hooks/data/useEodClosureData.ts`, `[readonly] apps/reception/src/hooks/mutations/useEodClosureMutations.ts`
- **Depends on:** TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — component wiring is straightforward; the existing hook mock pattern in the test file extends cleanly. The closed-state layout (banner-only) is the chosen default.
  - Approach: 85% — call `useEodClosureData()` and `useEodClosureMutations()` in the component; derive `allDone = tillDone && safeDone && stockDone`; render logic: (a) loading → loading indicator, (b) closure exists → closed banner, (c) allDone + no closure → confirm button, (d) else → status cards.
  - Impact: 85% — modifies an existing component; blast radius is contained to a single page with no downstream consumers.
- **Acceptance:**
  - "Confirm day closed" button renders when `allDone && !eodClosureLoading && !closure`.
  - Clicking the button calls `confirmDayClosed()`.
  - "Day closed" banner renders when `closure !== null` and `!eodClosureLoading`, showing `closure.confirmedBy` and formatted `closure.timestamp`.
  - While `eodClosureLoading === true`, neither button nor banner is shown.
  - Existing TC-01 through TC-09 continue to pass unchanged.
  - New tests TC-10 through TC-13 pass.
  - TypeScript clean (`pnpm --filter reception typecheck`).
  - Lint clean (`pnpm --filter reception lint`).
- **Validation contract:**
  - TC-10: `allDone=true`, `closure=null`, `eodClosureLoading=false` → confirm button visible, banner absent.
  - TC-11: `allDone=true`, `closure={...}`, `eodClosureLoading=false` → banner with timestamp visible, confirm button absent.
  - TC-12: `allDone=false` (any incomplete) → confirm button absent.
  - TC-13: confirm button clicked → `confirmDayClosed` mock called once.
- **Execution plan:** Red (no button/banner, TC-10–TC-13 absent) → Green (add hooks, render logic, tests) → Refactor (clean up loading guard logic if needed)
- **Planning validation (required for M/L):**
  - Checks run:
    - New output: `closure` from `useEodClosureData` — consumed by render logic in this task only. No other consumer.
    - New output: `confirmDayClosed` from `useEodClosureMutations` — consumed by button `onClick` in this task only. No other consumer.
    - Modified behavior: `EodChecklistContent` renders — no callers (page renders it directly). Page file has no changes.
    - Loading guard: `eodClosureLoading` must be checked before rendering button or banner to prevent flash.
  - Validation artifacts: TC-10 through TC-13 explicit acceptance criteria above.
  - Unexpected findings: none.
- **Scouts:**
  - `useEodClosureData` returns `{ closure, loading: eodClosureLoading, error }` — map `loading` to `eodClosureLoading` for clarity.
  - `useEodClosureMutations` returns `{ confirmDayClosed }`.
  - All hooks must be called before any conditional return (React rules of hooks — existing pattern in component already calls 3 hooks unconditionally before `if (!canView) return null`). New hooks must also be called before the `canView` gate.
  - Test mock for `useEodClosureData`: `jest.mock("../../../hooks/data/useEodClosureData", ...)` using the `var` pre-hoisting pattern matching the existing test file.
  - Test mock for `useEodClosureMutations`: `jest.mock("../../../hooks/mutations/useEodClosureMutations", ...)`.
  - `data-cy` test IDs: `data-cy="confirm-day-closed"` for the button, `data-cy="day-closed-banner"` for the banner.
- **Edge Cases & Hardening:**
  - Loading race: all three loading states (`tillLoading`, `safeLoading`, `stockLoading`, `eodClosureLoading`) must all be false before confirm button is shown.
  - Re-render after confirmation: `useEodClosureData` subscription will update when Firebase write completes, causing `closure` to become non-null and button to disappear — this is the correct reactive behavior.
  - `canView` gate: hooks are called unconditionally before `if (!canView) return null` to satisfy React rules. The gate prevents render output but hooks still run (consistent with existing pattern).
- **What would make this >=90%:**
  - Schema test for `eodClosureSchema` (could add to task but is already covered by TASK-02 acceptance criteria).
  - Integration test confirming button → Firebase write → subscription update cycle end-to-end (out of scope for unit tests).
- **Rollout / rollback:**
  - Rollout: deploy with TASK-01 rules already deployed (write access required). If rules are deployed atomically, order is: TASK-01 first (rules), then TASK-05 (component).
  - Rollback: revert `EodChecklistContent.tsx` to prior version; delete new hook and schema files; revert rules.
- **Documentation impact:** None
- **Notes / references:**
  - Banner display format for timestamp: use `formatItalyDateTimeFromIso(closure.timestamp)` from `dateUtils.ts` for a human-readable "DD/MM/YYYY, HH:MM" string.
  - Confirm button label: "Conferma chiusura giornaliera" (Italian, consistent with existing Italian UI labeling in the component's "End of Day" heading which reads "Fine Giornata" or "End of Day" — match the app's language convention for this screen; use Italian if the heading is Italian).
  - If the existing component heading is English ("End of Day"), use "Confirm day closed" for the button.

---

## Risks & Mitigations

- Firebase rules not deployed before component: **Hard release gate.** TASK-01 rules must be deployed to Firebase before or atomically with TASK-05 component deployment. If TASK-05 ships before TASK-01 rules are live, `confirmDayClosed` writes fall through to the `$other` wildcard and succeed for any authenticated user. This is the wrong authorization model and must not be allowed in production.
- Re-confirmation UX: once day is closed, button disappears and banner appears. There is no "re-open" mechanism. If a manager makes an error (closes too early), they must wait until the next calendar day. This is acceptable for the current scope.

## Observability

- Logging: `showToast("Failed to confirm day closed.", "error")` on write failure — consistent with existing patterns.
- Metrics: None — operational feature, no analytics.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] "Confirm day closed" button visible on `/eod-checklist` when till, safe, and stock are all done and no closure record exists for today.
- [ ] Clicking "Confirm day closed" writes a record to `eodClosures/<YYYY-MM-DD>` in Firebase.
- [ ] On re-entry, if today's closure record exists, a "Day closed" banner with timestamp and confirming user is shown instead of the status cards.
- [ ] Existing tests TC-01 through TC-09 pass.
- [ ] New tests TC-10 through TC-13 pass.
- [ ] `useEodClosureMutations` unit tests (TC-01, TC-02) pass.
- [ ] `pnpm --filter reception typecheck && pnpm --filter reception lint` clean.
- [ ] Firebase rules updated with explicit `eodClosures` node restricting writes to management roles.

## Decision Log

- 2026-02-28: `set` chosen over `push` for day-closed writes. Rationale: EOD closure is a day-level fact; most recent confirmation is authoritative; idempotent overwrite is safer than append for this use case. Full audit trail deferred.
- 2026-02-28: Closed-state UX: banner-only (no underlying status cards when closed). Default assumption; changeable post-delivery.
- 2026-02-28: No re-authentication required for day-closed confirmation. Rationale: routine end-of-shift action, already gated by `MANAGEMENT_ACCESS`. Variance signoff requires re-auth because it overrides financial discrepancy; this does not.
- 2026-02-28: `eodClosures` Firebase read rule set to `.read: "auth != null"` (all authenticated users). Rationale: consistent with the established system-wide pattern (`cashCounts`, `safeCounts`, `tillShifts`, `inventory` all use broad read + restricted write). The `Permissions.MANAGEMENT_ACCESS` check in `EodChecklistContent` is the access gate for UX; Firebase read permissiveness is intentional and consistent.

## Overall-confidence Calculation

- TASK-01: 95%, S (weight 1)
- TASK-02: 95%, S (weight 1)
- TASK-03: 90%, S (weight 1)
- TASK-04: 90%, S (weight 1)
- TASK-05: 85%, M (weight 2)

- Numerator: (95×1) + (95×1) + (90×1) + (90×1) + (85×2) = 95 + 95 + 90 + 90 + 170 = 540
- Denominator: 1+1+1+1+2 = 6
- Overall-confidence = 540 / 6 = 90% (rounded to 90%)

Note: Anti-bias rules applied. TASK-05 Implementation dimension arrived at 85 independently via: entry point read, hook wiring is clear, test mock pattern verified. Held-back test for TASK-05 at 85: "what single unknown would push below 85?" — none that would drop below 85; the mock pattern is established, but the loading-guard interaction with 4 hooks could introduce a subtle render ordering issue. Score: 85%.

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add `eodClosures` rules | Yes | None | No |
| TASK-02: Create `eodClosureSchema.ts` | Yes | None | No |
| TASK-03: Create `useEodClosureData.ts` | Yes — depends on TASK-02 (schema); TASK-02 in wave 1 before this | None | No |
| TASK-04: Create `useEodClosureMutations.ts` | Yes — depends on TASK-01 (rules) and TASK-02 (schema); both in wave 1 | None | No |
| TASK-05: Update `EodChecklistContent.tsx` | Yes — depends on TASK-03 and TASK-04; both in wave 2 before this | [Minor] React hooks-before-return: new hooks must be added before `if (!canView) return null`. Documented in Scouts. | No — handled in Scouts |
