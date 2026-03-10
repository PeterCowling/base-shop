# Build Record — Reception RBAC Migration (Remaining Username Checks)

**Date:** 2026-02-27
**Plan slug:** reception-rbac-migration-code
**Status:** Complete

---

## What was built

Completed the in-progress RBAC migration for the reception app. Four production username-string access checks were migrated to role-based calls. All changes preserve existing access semantics.

### Changes shipped (2 commits)

**Commit 1 — Wave 1 (d7f0551b94)**
- `roles.ts`: Added `Permissions.RESTRICTED_CALENDAR_ACCESS` for calendar access gating
- `roles.ts`: Widened `Permissions.ROOM_ALLOCATION` from `["owner","developer"]` to `["owner","developer","admin","manager"]`
- `useAllocateRoom.ts`: Replaced `["pete","serena"]` allowlist with `canAccess(user, Permissions.ROOM_ALLOCATION)`
- `DOBSection.tsx`: Replaced `ALLOWED_OVERRIDE_USERS` literal list + `.includes()` with `canAccess(user ?? null, Permissions.MANAGEMENT_ACCESS)`; fixed `useCallback` dep array
- `useInactivityLogoutClient.ts`: Replaced `username === "Cristiana"` with `hasRole(user ?? null, "admin")`; updated `useEffect` dep array
- `useInactivityLogoutClient.test.ts`: Migrated mock from name-based to role-based; all 3 tests pass

**Commit 2 — Wave 2+3 (77bf4e8bea)**
- `DateSelector.tsx`: Replaced `isSerena` username check with `canAccess(user ?? null, Permissions.RESTRICTED_CALENDAR_ACCESS)`; outer guard now `canAccessRestrictedCalendar`; restricted window uses `!isPete`; removed `username` prop from interface
- `view/CheckinsTable.tsx`: Removed `username` from `Props` interface and `DateSelector` call site
- `CheckinsTable.tsx`: Removed `username={user.user_name}` from `CheckinsTableView` call
- `CheckinsUI.test.tsx`: Added `useAuth` mock; rewrote 3 tests + added new admin/manager calendar test (4 DateSelector tests, 1 StatusButton test — all pass)

---

## Validation

- TypeScript: `tsc --noEmit` — clean (0 errors)
- Lint: `eslint` on all changed files — 0 errors (1 pre-existing DS layout warning in DateSelector, not introduced by this change)
- Tests: 8/8 pass (`CheckinsUI.test.tsx` × 5, `useInactivityLogoutClient.test.ts` × 3)
- Grep: `grep -rn '=== "pete"\|=== "serena"\|=== "Cristiana"\|ALLOWED_OVERRIDE' apps/reception/src --include="*.ts" --include="*.tsx"` (excluding test files) — **zero results**

---

## Acceptance criteria check

- [x] Zero username-string access checks in `apps/reception/src/` (grep confirms)
- [x] `pnpm typecheck && pnpm lint` pass for reception
- [x] All affected tests pass
- [x] No `username` prop on `DateSelector`, `CheckinsTableView`, or call sites
- [x] PR/commit description notes Firebase data change requirement for Cristiana (TASK-06)

---

## Operator action required before deploy

**Cristiana's Firebase `userProfiles/{uid}` must have `roles: ["admin"]`** before this lands in production. Without it, her auto-logout exemption will stop working. This is a data change — see TASK-06 in the plan for details.
