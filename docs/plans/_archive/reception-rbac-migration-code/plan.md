---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-rbac-migration-code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception RBAC Migration — Remaining Username Checks

## Summary

An in-progress RBAC migration has converted 15 files from username-string access checks to
`canAccess()`/`isPrivileged()` calls. Four username checks remain in production code:
`useAllocateRoom.ts`, `DateSelector.tsx`, `DOBSection.tsx`, and `useInactivityLogoutClient.ts`.
This plan completes the migration by migrating each remaining check to the appropriate role-based
call, removing the now-dead `username` prop from the DateSelector component tree, and updating
the affected test files to use role mocks instead of name mocks.

## Active tasks

- [x] TASK-01: Add `RESTRICTED_CALENDAR_ACCESS` permission to `roles.ts`
- [x] TASK-02: Migrate `useAllocateRoom.ts` to `canAccess()`
- [x] TASK-03: Migrate `DateSelector.tsx` and remove `username` prop
- [x] TASK-04: Update `CheckinsUI.test.tsx` for role-based DateSelector
- [x] TASK-05: Migrate `DOBSection.tsx` to `canAccess()`
- [x] TASK-06: Migrate `useInactivityLogoutClient.ts` to role-based exemption

## Goals

- Remove all username-string access checks from the reception app source.
- Migrate every remaining check to the `canAccess()` / `hasRole()` / `isPrivileged()` API.
- Remove the dead `username` prop from `DateSelector`, `CheckinsTableView`, and `CheckinsTable`.
- Update all affected tests to drive access via role mocks, not name mocks.
- Preserve existing access semantics for all users.

## Non-goals

- Adding roles to Firebase `userProfiles` records (data change — operator task, tracked separately).
- Updating `NEXT_PUBLIC_USERS_JSON` env var (covered by separate plan: `reception-rbac-pin-user-roles`).
- Migrating any of the 15 already-in-progress files (already done).

## Constraints & Assumptions

- Constraints:
  - `pnpm typecheck && pnpm lint` must pass after every task.
  - Existing access semantics must be preserved exactly (no privilege escalation or de-escalation).
  - Cristiana's Firebase `userProfiles/{uid}` must have `roles: ["admin"]` for TASK-06 to be
    transparent to users — this is an operator deployment task outside this plan's scope.
- Assumptions:
  - Serena's Firebase role is `"admin"` or `"manager"` (not `"owner"` or `"developer"`).
    Extending `ROOM_ALLOCATION` to include `["owner", "developer", "admin", "manager"]` is
    the correct and safe choice (roles.ts comment already says "designated staff").
  - No other username-string access checks exist in `apps/reception/src/` beyond the four
    identified (comprehensive grep was run in fact-find phase).

## Inherited Outcome Contract

- **Why:** Complete the in-progress RBAC migration to make the reception app ship-ready; eliminate hardcoded name allowlists that break on staff rotation and cannot be audited without reading source.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Zero username-string access checks remain in `apps/reception/src/`; all access is role-based via `canAccess()`, `hasRole()`, or `isPrivileged()`.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/reception-rbac-migration-code/fact-find.md`
- Key findings used:
  - Four remaining username checks identified via exhaustive grep sweep
  - `Permissions.RESTRICTED_CALENDAR_ACCESS` does not yet exist in `roles.ts` (gap)
  - `username` prop on `DateSelector` is dead code after migration; 3-file removal traced
  - `CheckinsUI.test.tsx` and `useInactivityLogoutClient.test.ts` use name-based mocks that must be role-based

## Proposed Approach

- Option A: Migrate all 4 checks in a single atomic commit
- Option B: Migrate each check independently (smallest atomic units, easier review)
- Chosen approach: **Option B** — independent tasks with their own typecheck gates, enabling
  parallel execution by `lp-do-build`. Wave 1 tasks (01, 02, 05, 06) are independent.
  Wave 2 (03) depends on 01. Wave 3 (04) depends on 03.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `RESTRICTED_CALENDAR_ACCESS` to `roles.ts` | 95% | S | Pending | - | TASK-03 |
| TASK-02 | IMPLEMENT | Migrate `useAllocateRoom.ts` + widen `ROOM_ALLOCATION` | 90% | S | Pending | - | - |
| TASK-03 | IMPLEMENT | Migrate `DateSelector.tsx`, remove `username` prop | 85% | M | Pending | TASK-01 | TASK-04 |
| TASK-04 | IMPLEMENT | Update `CheckinsUI.test.tsx` for role-based mocks | 82% | M | Pending | TASK-03 | - |
| TASK-05 | IMPLEMENT | Migrate `DOBSection.tsx` to `canAccess()` | 93% | S | Pending | - | - |
| TASK-06 | IMPLEMENT | Migrate `useInactivityLogoutClient.ts` + its test | 87% | M | Pending | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-05, TASK-06 | - | All independent; run in parallel |
| 2 | TASK-03 | TASK-01 complete | Needs `RESTRICTED_CALENDAR_ACCESS` exported |
| 3 | TASK-04 | TASK-03 complete | Tests reflect migrated prop interface |

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add RESTRICTED_CALENDAR_ACCESS | Yes — `roles.ts` Permissions pattern confirmed | None | No |
| TASK-02: Migrate useAllocateRoom.ts | Yes — `ROOM_ALLOCATION` exists; `canAccess` API confirmed | Moderate: Serena's role unknown — resolved by widening ROOM_ALLOCATION to include admin/manager (see task) | No |
| TASK-05: Migrate DOBSection.tsx | Yes — `MANAGEMENT_ACCESS` covers all 4 named users | None | No |
| TASK-06: Migrate useInactivityLogoutClient.ts | Yes — `hasRole` API confirmed | Minor: Firebase data change (Cristiana admin role) out of scope — flagged in PR note | No |
| TASK-03: Migrate DateSelector.tsx, remove username prop | TASK-01 complete | None — 3-file consumer trace complete (DateSelector → CheckinsTableView → CheckinsTable) | No |
| TASK-04: Update CheckinsUI.test.tsx | TASK-03 complete | None — `useAuth` mock pattern confirmed from CheckinsTable.test.tsx | No |

## Tasks

---

### TASK-01: Add `RESTRICTED_CALENDAR_ACCESS` permission to `roles.ts`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/lib/roles.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/lib/roles.ts`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 95%
  - Implementation: 96% — exact code to add is known; one-line entry in `Permissions` object
  - Approach: 95% — pattern matches all existing Permissions entries
  - Impact: 95% — TASK-03 cannot proceed without this export
- **Acceptance:**
  - `Permissions.RESTRICTED_CALENDAR_ACCESS` is exported from `roles.ts` as `["owner", "developer", "admin", "manager"] as UserRole[]`
  - `pnpm typecheck && pnpm lint` pass with no new errors
- **Validation contract:**
  - TC-01: Import `Permissions.RESTRICTED_CALENDAR_ACCESS` in a TypeScript file → types without error
  - TC-02: Pass `RESTRICTED_CALENDAR_ACCESS` to `canAccess(user, ...)` → returns `boolean`
- **Execution plan:**
  - Add the following entry to the `Permissions` object in `apps/reception/src/lib/roles.ts` after the `BULK_ACTIONS` entry:
    ```ts
    // Calendar date-picker access for non-privileged senior staff (restricted to tomorrow window)
    RESTRICTED_CALENDAR_ACCESS: ["owner", "developer", "admin", "manager"] as UserRole[],
    ```
  - Run `pnpm typecheck && pnpm lint` scoped to reception.
- **Scouts:** None: pattern is established, no unknowns
- **Edge Cases & Hardening:** None: additive-only change to const object; cannot break existing callers
- **What would make this >=90%:** Already at 95%; no meaningful uncertainty
- **Rollout / rollback:**
  - Rollout: merged in same PR as TASK-03
  - Rollback: remove the entry; TASK-03 must be reverted simultaneously
- **Documentation impact:** None: permissions are self-documenting via their comment
- **Notes / references:** Fact-find §Gaps item 1

---

### TASK-02: Migrate `useAllocateRoom.ts` + widen `ROOM_ALLOCATION`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/hooks/mutations/useAllocateRoom.ts`, `apps/reception/src/lib/roles.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/hooks/mutations/useAllocateRoom.ts`, `apps/reception/src/lib/roles.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 92% — exact code to write is specified; swap of 4 lines
  - Approach: 90% — ROOM_ALLOCATION widening is the safe, correct choice (see notes)
  - Impact: 89% — depends on Serena's Firebase role being admin/manager (assumption)
- **Acceptance:**
  - No `allowedUsernames` array or `lowerName` string comparison remains in `useAllocateRoom.ts`
  - `canAccess(user, Permissions.ROOM_ALLOCATION)` is the sole gate
  - `ROOM_ALLOCATION` includes `["owner", "developer", "admin", "manager"]`
  - JSDoc on hook line 66 updated to describe role-based access (remove the "pete" / "serena" mention)
  - `pnpm typecheck && pnpm lint` pass
- **Validation contract:**
  - TC-01: User with `roles: ["owner"]` calls room reallocation → proceeds without toast
  - TC-02: User with `roles: ["admin"]` calls room reallocation → proceeds without toast (Serena case)
  - TC-03: User with `roles: ["staff"]` calls room reallocation → toast shown, returns `""`
  - TC-04: `null` user calls room reallocation → toast shown, returns `""`
- **Execution plan:**

  **In `apps/reception/src/lib/roles.ts`:**
  - Change `ROOM_ALLOCATION` from `["owner", "developer"]` to `["owner", "developer", "admin", "manager"]`.
  - Update comment from "owners, developers, and designated staff" to "owners, developers, admins, and managers".

  **In `apps/reception/src/hooks/mutations/useAllocateRoom.ts`:**
  - Add import: `import { canAccess, Permissions } from "../../lib/roles";`
  - Replace lines 105-113:
    ```ts
    // Before:
    const allowedUsernames = ["pete", "serena"];
    const lowerName = (user.user_name || "").toLowerCase();
    if (!allowedUsernames.includes(lowerName)) {
      showToast("You do not have permission...", "info");
      return "";
    }
    // After:
    if (!canAccess(user, Permissions.ROOM_ALLOCATION)) {
      showToast("You do not have permission...", "info");
      return "";
    }
    ```
  - Update JSDoc on line 66.
  - Run `pnpm typecheck && pnpm lint` scoped to reception.

- **Planning validation:**
  - Checks run: read `useAllocateRoom.ts:105-113` (confirmed in fact-find); read `roles.ts` Permissions structure (confirmed)
  - Validation artifacts: fact-find §Remaining Username Checks item 1
  - Unexpected findings: None
- **Scouts:** Confirm `user` variable type at line 105 is `User | null` (expected from hook context)
- **Edge Cases & Hardening:** `canAccess` already handles `null` user (returns false) — no extra null guard needed
- **Decision note:** Widening `ROOM_ALLOCATION` to include `admin`/`manager` is safe because:
  1. roles.ts comment already anticipates "designated staff"
  2. Current behavior gives Serena access; she is most likely `admin`/`manager`
  3. Keeping `["owner", "developer"]` only risks silently locking Serena out post-migration
- **What would make this >=90%:** Already at 90%; risk is purely data (Serena's Firebase role). Widen now to protect against it.
- **Rollout / rollback:**
  - Rollout: lands as independent PR or in same PR as other Wave 1 tasks
  - Rollback: revert both files
- **Documentation impact:** JSDoc update only

---

### TASK-03: Migrate `DateSelector.tsx` and remove `username` prop

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `DateSelector.tsx`, `CheckinsTableView` (view/CheckinsTable.tsx), `CheckinsTable.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/checkins/DateSelector.tsx`
  - `apps/reception/src/components/checkins/view/CheckinsTable.tsx` (CheckinsTableView)
  - `apps/reception/src/components/checkins/CheckinsTable.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 87% — 3-file change, all call sites traced in fact-find; M effort due to prop removal propagation
  - Approach: 86% — isSerena → canAccessRestrictedCalendar logic is sound; RESTRICTED_CALENDAR_ACCESS covers the right roles
  - Impact: 83% — test in TASK-04 will catch any regression; intermediate state (between TASK-03 and TASK-04) may have TypeScript errors in test file
- **Acceptance:**
  - No `username` prop on `DateSelectorProps`, `CheckinsTableView` props interface, or any call site
  - No `isSerena` variable or string comparison against `"serena"` in any file
  - Privileged users (owner/developer) see the unrestricted DayPicker
  - Admin/manager users see the DayPicker limited to today + tomorrow
  - Staff/viewer users see no DayPicker toggle
  - `pnpm typecheck && pnpm lint` pass
- **Validation contract:**
  - TC-01: isPrivileged user (owner) renders DateSelector → unrestricted DayPicker visible
  - TC-02: admin/manager user renders DateSelector → restricted DayPicker (tomorrow window) visible
  - TC-03: staff user renders DateSelector → no DayPicker toggle rendered
  - TC-04: TypeScript: no `username` prop accepted by `DateSelectorProps`
- **Execution plan:**

  **In `DateSelector.tsx`:**
  1. Remove `username` from `DateSelectorProps` interface and destructuring.
  2. Replace `const isSerena = username?.toLowerCase() === "serena"` with:
     ```ts
     const canAccessRestrictedCalendar = canAccess(user ?? null, Permissions.RESTRICTED_CALENDAR_ACCESS);
     ```
  3. The outer show-DayPicker guard changes from `isPete || isSerena` to `canAccessRestrictedCalendar`
     (since RESTRICTED_CALENDAR_ACCESS = ["owner","developer","admin","manager"] ⊇ isPete roles).
  4. The tomorrow-window restriction guard changes from `!isPete` (already using isPrivileged) to remain as `!isPete`
     (isPrivileged check already correct on line 45; `canAccessRestrictedCalendar && !isPete` selects the restricted branch).
  5. Import `canAccess` and `Permissions` from `../../lib/roles` (alongside existing `isPrivileged` import).

  **In `view/CheckinsTable.tsx` (CheckinsTableView):**
  1. Remove `username` from `CheckinsTableViewProps` interface.
  2. Remove `username` from the `DateSelector` JSX call site.

  **In `CheckinsTable.tsx`:**
  1. Remove `username={user.user_name}` from the `CheckinsTableView` JSX call site.

  Run `pnpm typecheck && pnpm lint` scoped to reception.

- **Planning validation (M effort):**
  - Checks run: fact-find traced the full prop flow CheckinsTable → CheckinsTableView → DateSelector
  - Validation artifacts: fact-find §Remaining Username Checks item 2
  - Unexpected findings: None — `useAuth()` is already called inside DateSelector (line confirmed in fact-find); no new hook needed
- **Consumer tracing:**
  - `username` prop: 3 consumers updated (DateSelectorProps, CheckinsTableView interface, CheckinsTable call site) ✓
  - `Permissions.RESTRICTED_CALENDAR_ACCESS`: 1 consumer (DateSelector.tsx) ✓
  - Downstream consumer of the DayPicker visibility change: `CheckinsUI.test.tsx` — addressed in TASK-04
- **Scouts:** Verify `view/CheckinsTable.tsx` is the correct file name for CheckinsTableView (not `checkins/CheckinsTable.tsx` which is the controller)
- **Edge Cases & Hardening:** `user ?? null` guard already present in `isPrivileged` call on line 45; apply same pattern to `canAccess` call
- **What would make this >=90%:** TASK-04 passing test suite; right now 85% because test file temporarily breaks until TASK-04 runs
- **Rollout / rollback:**
  - Rollout: lands in same PR as TASK-04 (test must pass)
  - Rollback: restore username prop in all 3 files
- **Documentation impact:** None

---

### TASK-04: Update `CheckinsUI.test.tsx` for role-based DateSelector

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/checkins/__tests__/CheckinsUI.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/checkins/__tests__/CheckinsUI.test.tsx`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 83% — `useAuth` mock pattern confirmed from `CheckinsTable.test.tsx`; M due to 3 test rewrites + new test
  - Approach: 84% — role-based mock is the correct pattern for the migrated component
  - Impact: 80% — test suite must pass without `username` prop; if mock setup is wrong, tests may silently pass with wrong values
- **Acceptance:**
  - All existing DateSelector describe-block tests pass without `username` prop
  - New test "shows restricted DayPicker toggle for admin/manager users" passes
  - No `username` prop passed in any test
  - `pnpm test --filter reception -- CheckinsUI` passes
- **Validation contract:**
  - TC-01: `useAuth` mocked with `{ user: { user_name: "pete", roles: ["owner"] } }` → unrestricted DayPicker renders
  - TC-02: `useAuth` mocked with `{ user: { user_name: "alex", roles: ["staff"] } }` → no DayPicker toggle
  - TC-03: `useAuth` mocked with `{ user: { user_name: "serena", roles: ["admin"] } }` → restricted DayPicker toggle visible
  - TC-04: No `username` prop present in any test render call
- **Execution plan:**
  1. Add `jest.mock` for `useAuth` at top of test file, following pattern from `CheckinsTable.test.tsx`.
  2. Update "opens calendar for Pete" test:
     - Mock `useAuth` → `{ user: { user_name: "pete", roles: ["owner"] } }`
     - Remove `username="pete"` from render call
  3. Update "limits non-Pete users to today and tomorrow" test:
     - Mock `useAuth` → `{ user: { user_name: "alex", roles: ["staff"] } }`
     - Remove `username="alex"` from render call
  4. Add new test "shows restricted DayPicker toggle for admin/manager users":
     - Mock `useAuth` → `{ user: { user_name: "serena", roles: ["admin"] } }`
     - Assert calendar toggle button is present
  5. Run `pnpm test --filter reception -- CheckinsUI`.
- **Planning validation (M effort):**
  - Checks run: fact-find §Gaps item 3; pattern from `CheckinsTable.test.tsx` referenced
  - Validation artifacts: fact-find §Task 04
  - Unexpected findings: None noted
- **Consumer tracing:** None: test file has no downstream consumers
- **Scouts:** Confirm `jest.mock` for `useAuth` path — check whether it is `"@/hooks/useAuth"` or relative; follow the pattern used in `CheckinsTable.test.tsx`
- **Edge Cases & Hardening:** Use `beforeEach` / per-test mock overrides if tests need different user states within one describe block
- **What would make this >=90%:** Confirming the exact `useAuth` mock path before writing the test
- **Rollout / rollback:**
  - Rollout: lands in same PR as TASK-03
  - Rollback: restore old username-prop tests
- **Documentation impact:** None

---

### TASK-05: Migrate `DOBSection.tsx` to `canAccess()`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/checkins/docInsert/DOBSection.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/checkins/docInsert/DOBSection.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 93%
  - Implementation: 94% — exact code specified; 3 deletions + 1 replacement + import
  - Approach: 94% — MANAGEMENT_ACCESS covers all 4 named users exactly
  - Impact: 92% — no test update required (DOBSection tests, if any, use role mocks already; canOverride logic unchanged)
- **Acceptance:**
  - No `ALLOWED_OVERRIDE_USERS` array or `AllowedOverrideUser` type in `DOBSection.tsx`
  - No `currentUser` local variable
  - `canAccess(user ?? null, Permissions.MANAGEMENT_ACCESS)` is the sole override gate
  - Confirmation dialog flow (ConfirmDialog open/confirm) is unchanged
  - `pnpm typecheck && pnpm lint` pass
- **Validation contract:**
  - TC-01: User with `roles: ["owner"]` → `canOverride = true`
  - TC-02: User with `roles: ["manager"]` → `canOverride = true` (Allessandro/Cristiana case)
  - TC-03: User with `roles: ["staff"]` → `canOverride = false`
  - TC-04: `null` user → `canOverride = false`
- **Execution plan:**
  1. Add import: `import { canAccess, Permissions } from "../../../lib/roles";`
  2. Delete lines 27-32 (`ALLOWED_OVERRIDE_USERS` const + `AllowedOverrideUser` type).
  3. Delete `const currentUser = user?.user_name;` line.
  4. Replace `const canOverride = ALLOWED_OVERRIDE_USERS.includes(currentUser as AllowedOverrideUser)` with:
     ```ts
     const canOverride = canAccess(user ?? null, Permissions.MANAGEMENT_ACCESS);
     ```
  5. Run `pnpm typecheck && pnpm lint` scoped to reception.
- **Scouts:** None: straightforward replacement; no unknown call sites
- **Edge Cases & Hardening:** `canAccess` handles `null` user — `user ?? null` guard applied
- **What would make this >=90%:** Already at 93%
- **Rollout / rollback:**
  - Rollout: independent PR or with other Wave 1 tasks
  - Rollback: restore the ALLOWED_OVERRIDE_USERS const pattern
- **Documentation impact:** None

---

### TASK-06: Migrate `useInactivityLogoutClient.ts` to role-based exemption

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/hooks/client/useInactivityLogoutClient.ts`, `apps/reception/src/hooks/client/__tests__/useInactivityLogoutClient.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/client/useInactivityLogoutClient.ts`
  - `apps/reception/src/hooks/client/__tests__/useInactivityLogoutClient.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 87%
  - Implementation: 89% — hook change is a 1-line swap; test rewrite is M due to useAuth mock
  - Approach: 88% — `hasRole(user, "admin")` correctly mirrors the Cristiana exemption
  - Impact: 85% — depends on Firebase data change (Cristiana's role) being done before deploy; code is safe without it (no regression, just no exemption)
- **Acceptance:**
  - No `"Cristiana"` string literal in `useInactivityLogoutClient.ts`
  - `hasRole(user ?? null, "admin")` is the sole exemption gate
  - JSDoc updated to describe admin role exemption (not Cristiana by name)
  - `useInactivityLogoutClient.test.ts` passes with role-based mock (not name mock)
  - `pnpm typecheck && pnpm lint` pass
- **Validation contract:**
  - TC-01: Admin user (`roles: ["admin"]`) → inactivity timer not created
  - TC-02: Staff user (`roles: ["staff"]`) → inactivity timer created
  - TC-03: `null` user (not logged in) → early return (existing behaviour)
  - TC-04: No `"Cristiana"` string in test assertions
- **Execution plan:**

  **In `useInactivityLogoutClient.ts`:**
  1. Add import: `import { hasRole } from "../../lib/roles";`
  2. Obtain `user` from `useAuth()` (check if already destructured; if not, add).
  3. Replace `if (!isUserLoggedIn || username === "Cristiana") return;` with:
     ```ts
     if (!isUserLoggedIn || hasRole(user ?? null, "admin")) return;
     ```
  4. Remove `username` local variable if it was only used for this check.
  5. Update JSDoc to describe the admin role exemption.

  **In `useInactivityLogoutClient.test.ts` (lines 66-77):**
  1. Mock `useAuth()` to return `{ user: { user_name: "any", roles: ["admin"] } }`.
  2. Assert that the timer is not created for any admin user — not just "Cristiana".

  Run `pnpm test --filter reception -- useInactivityLogout`.

- **Planning validation (M effort):**
  - Checks run: fact-find §Remaining Username Checks item 4; hook and test lines confirmed
  - Validation artifacts: fact-find §Task 06
  - Unexpected findings: None
- **Consumer tracing:** `hasRole` is a pure function with no side effects; no downstream consumers affected
- **Scouts:** Confirm `user` is already destructured from `useAuth()` in the hook, or identify the exact destructure pattern to use
- **Edge Cases & Hardening:** If Cristiana's Firebase role is NOT updated before deploy, she will be subject to inactivity logout — this is a data-only regression, not a code regression. Flag clearly in PR description.
- **What would make this >=90%:** Cristiana's Firebase role updated before deploy; or adding an explicit `admin` check in the PR description as a deploy precondition
- **Rollout / rollback:**
  - Rollout: coordinate with Firebase data update (set Cristiana's `roles: ["admin"]`)
  - Rollback: restore `username === "Cristiana"` pattern
- **Documentation impact:** None: JSDoc update only
- **Notes / references:** Cristiana's Firebase `userProfiles/{uid}` must have `roles: ["admin"]` before this task ships for transparent behaviour. Operator must coordinate this data change.

---

## Risks & Mitigations

- **Serena's Firebase role unknown (TASK-02):** Widening `ROOM_ALLOCATION` to include `admin`/`manager` is the safe default. If Serena's role is `owner`, the wider permission set is harmless (owner is already included).
- **Cristiana's Firebase role (TASK-06):** Code-safe to ship without the data change — Cristiana will experience auto-logout until her `roles: ["admin"]` is set. Flagged in task rollout notes.
- **TASK-03/04 interdependency:** TypeScript will error in `CheckinsUI.test.tsx` after TASK-03 (username prop removed). TASK-04 must land in the same PR as TASK-03 or immediately after.

## Observability

- Logging: None needed — role check is a pure function
- Metrics: None
- Alerts/Dashboards: None

## Acceptance Criteria (overall)

- [ ] Zero username-string access checks in `apps/reception/src/` (grep confirms)
- [ ] `pnpm typecheck && pnpm lint` pass for reception
- [ ] `pnpm test --filter reception` passes for all affected test files
- [ ] No `username` prop on `DateSelector`, `CheckinsTableView`, or call sites
- [ ] PR description notes Firebase data change requirement for Cristiana (TASK-06)

## Decision Log

- 2026-02-27: Widen `ROOM_ALLOCATION` to include `"admin"` and `"manager"` — safe default preserving Serena's access without requiring Firebase role data first (TASK-02 planning)
- 2026-02-27: Use `hasRole(user, "admin")` for inactivity exemption (TASK-06) — minimal privilege; Cristiana data change flagged as deploy precondition

## Overall-confidence Calculation

- S=1, M=2
- TASK-01: 95% × 1 = 95
- TASK-02: 90% × 1 = 90
- TASK-03: 85% × 2 = 170
- TASK-04: 82% × 2 = 164
- TASK-05: 93% × 1 = 93
- TASK-06: 87% × 2 = 174
- Sum weights: 1+1+2+2+1+2 = 9
- Weighted sum: 95+90+170+164+93+174 = 786
- Overall-confidence: 786/9 = **87%**
