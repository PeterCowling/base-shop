# Fact-Find: Reception RBAC Migration — Remaining Username Checks

**Status: Ready-for-planning**
**Slug:** reception-rbac-migration-code
**Date:** 2026-02-27
**Priority:** P1 (ship blocker)
**Business:** BRIK

---

## Business Context

The reception app is mid-migration from username-string access checks to a role-based system
(`canAccess()` / `isPrivileged()` / `hasRole()`) defined in `apps/reception/src/lib/roles.ts`.
This migration eliminates hardcoded name allowlists (e.g. `["pete", "serena"]`) that break
whenever staff rotate and cannot be audited without reading source code.

Fifteen files have already been committed (or are staged). The remaining four username checks
must be cleared before the migration can be declared complete.

---

## Current State

### The permission model (`apps/reception/src/lib/roles.ts`)

Key exported symbols:

| Symbol | Behaviour |
|---|---|
| `canAccess(user, permission[])` | True if user has any role in the array |
| `isPrivileged(user)` | True for `owner` or `developer` roles |
| `isOwner(user)` | True for `owner` role only |
| `isDeveloper(user)` | True for `developer` role only |
| `hasRole(user, role)` | Exact single-role test |
| `Permissions.ROOM_ALLOCATION` | `["owner", "developer"]` |
| `Permissions.MANAGEMENT_ACCESS` | `["owner", "developer", "admin", "manager"]` |
| `Permissions.BULK_ACTIONS` | `["owner", "developer", "admin", "manager"]` |
| `Permissions.REALTIME_DASHBOARD` | `["owner", "developer"]` |
| `Permissions.ALLOGGIATI_ACCESS` | `["owner", "developer"]` |
| `Permissions.TILL_ACCESS` | `["owner", "developer", "admin", "manager", "staff"]` |

Roles defined in `UserRoleSchema`: `admin`, `manager`, `staff`, `viewer`, `owner`, `developer`.

### Migration pattern (from already-migrated files)

**ManModal.tsx** (`apps/reception/src/components/appNav/ManModal.tsx:43`):
```ts
interactive={canAccess(authUser, Permissions.MANAGEMENT_ACCESS)}
```

**TillModal.tsx** (`apps/reception/src/components/appNav/TillModal.tsx:43`):
```ts
interactive={canAccess(authUser, Permissions.TILL_ACCESS)}
```

**CheckinsHeader.tsx** (`apps/reception/src/components/checkins/header/CheckinsHeader.tsx:54`):
```ts
{canAccess(user ?? null, Permissions.BULK_ACTIONS) && (...)}
```

**Live.tsx** (`apps/reception/src/components/live/Live.tsx:18`):
```ts
if (!props.user || !canAccess(props.user as User, Permissions.REALTIME_DASHBOARD)) {
```

Pattern: import `canAccess` and the relevant `Permissions` constant from `../../lib/roles`;
replace any username string test with the appropriate `canAccess(user, Permissions.X)` call.

---

## Remaining Username Checks — Full Inventory

The grep for `=== "pete"`, `=== "serena"`, `=== "Pete"`, `=== "Serena"`, and `ALLOWED_OVERRIDE`
across `apps/reception/src/` found exactly these locations:

### 1. `useAllocateRoom.ts` — hardcoded allowlist blocks room reallocation

**File:** `apps/reception/src/hooks/mutations/useAllocateRoom.ts:105-113`

```ts
const allowedUsernames = ["pete", "serena"];
const lowerName = (user.user_name || "").toLowerCase();
if (!allowedUsernames.includes(lowerName)) {
  showToast(
    "You do not have permission to update this occupant's room.",
    "info"
  );
  return "";
}
```

**Semantic intent:** Only specific named users may reassign a guest's allocated room
(move them between room index entries, with upgrade/downgrade logging).

**Correct mapping:** `Permissions.ROOM_ALLOCATION` (`["owner", "developer"]`) already exists
in `roles.ts` at line 57 with the comment "Room allocation — owners, developers, and
designated staff". This maps cleanly: "pete" is owner/developer, "serena" is presumably
an admin or manager who needs this permission. The correct fix is
`canAccess(user, Permissions.ROOM_ALLOCATION)`. If serena must retain access, her
Firebase role record should include `"owner"`, `"developer"`, or the
`ROOM_ALLOCATION` permission set should be extended to include `"admin"` — a data/config
decision for the operator, not a code decision.

---

### 2. `DateSelector.tsx` — `isSerena` check gates restricted DayPicker calendar

**File:** `apps/reception/src/components/checkins/DateSelector.tsx:46` and `:136-163`

```ts
const isPete = isPrivileged(user ?? null);        // line 45 — already migrated
const isSerena = username?.toLowerCase() === "serena";  // line 46 — NOT migrated
```

```ts
if (isPete || isSerena) {
  // Show DayPicker — unrestricted for isPete, limited to tomorrow for isSerena
}
```

The `username` prop flows from `CheckinsTable.tsx:252` → `CheckinsTableView:121` → `DateSelector:42`.
`DateSelector` already calls `useAuth()` internally and already derives `isPete` correctly.
The `username` prop exists solely to support the `isSerena` check.

**Semantic intent:** Staff who are not privileged (owner/developer) but are trusted
senior staff may access the DayPicker, but only for a one-day window (today + tomorrow).
Privileged users get an unrestricted picker.

**Correct mapping:** Two-level DayPicker access:
- Unrestricted picker: `isPrivileged(user)` — already correct (line 45).
- Restricted picker (tomorrow window): A new permission is needed —
  `Permissions.RESTRICTED_CALENDAR_ACCESS` = `["owner", "developer", "admin", "manager"]`.
  This replaces `isSerena`. The component can then read user directly from `useAuth()`
  (it already does) and the `username` prop becomes removable entirely.

The `username` prop must also be removed from `CheckinsTableView` props interface and
from the `CheckinsTable.tsx:252` call site.

**Test impact:** `CheckinsUI.test.tsx:98-117` tests "opens calendar for Pete" using
`username="pete"`. After migration, this test must mock `useAuth()` to return a user
with `isPrivileged` true (owner/developer role) rather than passing a username prop.
The test at line 120-140 ("limits non-Pete users") similarly relies on `username="alex"`;
it should be updated to verify that a user with no privileged role sees no DayPicker toggle.

---

### 3. `DOBSection.tsx` — literal name list gates age-restriction overrides

**File:** `apps/reception/src/components/checkins/docInsert/DOBSection.tsx:27-32` and `:186-189`

```ts
const ALLOWED_OVERRIDE_USERS = [
  "Allessandro",
  "Cristiana",
  "Pete",
  "Serena",
] as const;
```

```ts
const currentUser = user?.user_name;
const canOverride = ALLOWED_OVERRIDE_USERS.includes(
  currentUser as AllowedOverrideUser
);
```

**Semantic intent:** Certain staff may override the 18–39 age restriction on date-of-birth
entry after a confirmation dialog. The four named users span ownership, management, and
senior staff — this is a management-level override capability.

**Correct mapping:** `Permissions.MANAGEMENT_ACCESS` (`["owner", "developer", "admin", "manager"]`)
covers all four names:
- Pete → owner/developer
- Serena → admin/manager
- Allessandro → admin/manager
- Cristiana → admin/manager (also appears in `useInactivityLogoutClient.ts` — see below)

Replace `ALLOWED_OVERRIDE_USERS` array and the `.includes()` check with:
```ts
const canOverride = canAccess(user ?? null, Permissions.MANAGEMENT_ACCESS);
```
Remove the `ALLOWED_OVERRIDE_USERS` const and `AllowedOverrideUser` type.

---

### 4. `useInactivityLogoutClient.ts` — Cristiana exemption from auto-logout (ADDITIONAL FIND)

**File:** `apps/reception/src/hooks/client/useInactivityLogoutClient.ts:36`

```ts
if (!isUserLoggedIn || username === "Cristiana") return;
```

This was not in the original dispatch scope but was found in the comprehensive grep.

**Semantic intent:** A specific user (Cristiana) works at a fixed desk terminal that should
never auto-logout due to inactivity. This is a "kiosk mode" or "static workstation" concern.

**Correct mapping:** This requires a new permission or role flag. Three options:
- Option A: New `Permissions.NO_INACTIVITY_TIMEOUT` = `["admin"]` (or a specific role).
- Option B: Check if the user has the `"admin"` role specifically — `hasRole(user, "admin")`.
- Option C: Add a `"kiosk"` role to `UserRoleSchema` for this exact use case.

The most conservative migration that preserves current behaviour without over-granting
is Option B: `hasRole(user, "admin")` — if Cristiana is given the `"admin"` role in
Firebase, the behaviour is unchanged. The test at
`useInactivityLogoutClient.test.ts:66-77` must be updated to mock `useAuth()` returning
a user with the `"admin"` role, not username "Cristiana".

**Note:** This is an in-scope addition — the dispatch asked for a grep sweep and this
is exactly what the sweep found.

---

## Gaps Identified

1. `Permissions.RESTRICTED_CALENDAR_ACCESS` does not exist in `roles.ts`. It needs to be added
   before `DateSelector.tsx` can be migrated.

2. `DateSelector.tsx` receives a `username` prop purely for the `isSerena` check. After
   migration the prop becomes dead code and must be removed from the component interface,
   the view component (`CheckinsTableView`), and the controller (`CheckinsTable`).

3. Tests in `CheckinsUI.test.tsx` use `username="pete"` and `username="alex"` as the
   mechanism to control DayPicker visibility. These tests do not mock `useAuth()`. After
   migration they must mock `useAuth()` to drive the `isPrivileged` / `canAccess` paths
   instead of the username prop.

4. `useInactivityLogoutClient.test.ts` tests the Cristiana exemption by name. The test
   must be rewritten to use a role-based mock.

5. `Permissions.ROOM_ALLOCATION` is defined but was never wired up in `useAllocateRoom.ts`.
   This is the simplest of the four fixes — a one-line import addition + predicate swap.

6. No new `Permissions` entry is needed for `DOBSection.tsx` — `MANAGEMENT_ACCESS` covers
   the full existing allowlist.

---

## Proposed Tasks

### Task 01 — Add `RESTRICTED_CALENDAR_ACCESS` permission to `roles.ts`

**File:** `apps/reception/src/lib/roles.ts`

Add a new entry to the `Permissions` object:
```ts
// Calendar date-picker access for non-privileged senior staff (restricted to tomorrow window)
RESTRICTED_CALENDAR_ACCESS: ["owner", "developer", "admin", "manager"] as UserRole[],
```

**Acceptance criteria:**
- `Permissions.RESTRICTED_CALENDAR_ACCESS` is exported and typed.
- `pnpm typecheck && pnpm lint` pass with no new errors.

---

### Task 02 — Migrate `useAllocateRoom.ts` to `canAccess()`

**File:** `apps/reception/src/hooks/mutations/useAllocateRoom.ts:105-113`

Replace the `allowedUsernames` allowlist block with:
```ts
if (!canAccess(user, Permissions.ROOM_ALLOCATION)) {
  showToast(
    "You do not have permission to update this occupant's room.",
    "info"
  );
  return "";
}
```

Import `canAccess` and `Permissions` from `../../lib/roles`. Remove the
`allowedUsernames` and `lowerName` locals. Update the JSDoc comment on the hook
(line 66: "Allows 'pete' or 'serena' to change...") to describe role-based access.

**Acceptance criteria:**
- No `allowedUsernames` array or `lowerName` string comparison remains.
- `canAccess(user, Permissions.ROOM_ALLOCATION)` is the sole gate.
- `pnpm typecheck && pnpm lint` pass.

---

### Task 03 — Migrate `DateSelector.tsx` and remove `username` prop

**Files:**
- `apps/reception/src/components/checkins/DateSelector.tsx`
- `apps/reception/src/components/checkins/view/CheckinsTable.tsx`
- `apps/reception/src/components/checkins/CheckinsTable.tsx`

Changes:
1. In `DateSelector.tsx`: remove `username` from `DateSelectorProps` and the destructure.
   Replace `const isSerena = username?.toLowerCase() === "serena"` with:
   ```ts
   const canAccessRestrictedCalendar = canAccess(user ?? null, Permissions.RESTRICTED_CALENDAR_ACCESS);
   ```
   Replace all `isSerena` references with `canAccessRestrictedCalendar && !isPete`
   (so privileged users continue to get the unrestricted picker; non-privileged management
   gets the tomorrow-limited picker).
2. In `CheckinsTableView` (view/CheckinsTable.tsx): remove `username` from the Props
   interface and from the `DateSelector` call site.
3. In `CheckinsTable.tsx`: remove `username={user.user_name}` from the
   `CheckinsTableView` call.

**Acceptance criteria:**
- No `username` prop remains on `DateSelector`, `CheckinsTableView`, or their call sites.
- No `isSerena` or string comparison against `"serena"` remains.
- Privileged users (owner/developer) still see the unrestricted DayPicker.
- Admin/manager users see the DayPicker limited to today + tomorrow.
- Staff/viewer users see no DayPicker toggle.
- `pnpm typecheck && pnpm lint` pass.

---

### Task 04 — Update `CheckinsUI.test.tsx` for role-based DateSelector

**File:** `apps/reception/src/components/checkins/__tests__/CheckinsUI.test.tsx`

Add a `jest.mock` for `useAuth` at the top of the file (following the pattern used in
`CheckinsTable.test.tsx`). Update the existing DateSelector tests:

- "opens calendar for Pete" → mock `useAuth` to return `{ user: { user_name: "pete", roles: ["owner"] } }`;
  remove `username="pete"` prop.
- "limits non-Pete users to today and tomorrow" → mock `useAuth` to return
  `{ user: { user_name: "alex", roles: ["staff"] } }`; remove `username="alex"` prop.
- Add a new test: "shows restricted DayPicker toggle for admin/manager users" → mock
  `useAuth` with role `"manager"`, verify the calendar toggle button is present.

**Acceptance criteria:**
- All three existing `DateSelector` describe-block tests pass under the new role-based
  implementation.
- New test for the restricted calendar path passes.
- No `username` prop is passed in any test.

---

### Task 05 — Migrate `DOBSection.tsx` to `canAccess()`

**File:** `apps/reception/src/components/checkins/docInsert/DOBSection.tsx`

Replace:
```ts
const ALLOWED_OVERRIDE_USERS = ["Allessandro", "Cristiana", "Pete", "Serena"] as const;
type AllowedOverrideUser = (typeof ALLOWED_OVERRIDE_USERS)[number];
// ... later:
const currentUser = user?.user_name;
const canOverride = ALLOWED_OVERRIDE_USERS.includes(currentUser as AllowedOverrideUser);
```

With:
```ts
const canOverride = canAccess(user ?? null, Permissions.MANAGEMENT_ACCESS);
```

Import `canAccess` and `Permissions` from `../../../lib/roles`. Remove the
`ALLOWED_OVERRIDE_USERS` const, `AllowedOverrideUser` type, and `currentUser` local.

**Acceptance criteria:**
- No `ALLOWED_OVERRIDE_USERS` array or literal name comparisons remain.
- `canAccess(user, Permissions.MANAGEMENT_ACCESS)` is the sole override gate.
- The confirmation dialog flow (ConfirmDialog open/confirm) is unchanged.
- `pnpm typecheck && pnpm lint` pass.

---

### Task 06 — Migrate `useInactivityLogoutClient.ts` to role-based exemption

**File:** `apps/reception/src/hooks/client/useInactivityLogoutClient.ts`

Replace:
```ts
if (!isUserLoggedIn || username === "Cristiana") return;
```

With:
```ts
if (!isUserLoggedIn || hasRole(user ?? null, "admin")) return;
```

Import `hasRole` from `../../lib/roles`. Remove the `username` local variable.
Update the JSDoc comment to describe the `admin` role exemption rather than naming
"Cristiana". Update `useInactivityLogoutClient.test.ts:66-77` to mock `useAuth()`
returning `{ user: { user_name: "any", roles: ["admin"] } }` and to assert the
timer is not created for any admin user — not just a specific name.

**Note on role assignment:** The operator must ensure Cristiana's Firebase user record
carries `roles: ["admin"]` for this migration to preserve her existing exemption.
This is a data change, not a code change, and is outside the scope of this plan but
should be called out in the implementation PR description.

**Acceptance criteria:**
- No `"Cristiana"` string literal remains in the hook implementation.
- `hasRole(user, "admin")` is the exemption gate.
- `useInactivityLogoutClient.test.ts` passes with a role-based mock, not a name mock.
- `pnpm typecheck && pnpm lint` pass.

---

## Confidence Assessment

**Overall confidence: 92%**

- The role-to-permission mapping for Tasks 02, 03, and 05 is unambiguous: the existing
  `Permissions` constants in `roles.ts` already describe the correct intent in their
  comments, and the named individuals (Pete = owner/developer, Serena/Allessandro/Cristiana
  = admin/manager) map cleanly.
- The `RESTRICTED_CALENDAR_ACCESS` permission name is new and must be added (Task 01) —
  low risk, one-liner addition.
- Task 06 (`useInactivityLogoutClient`) requires a Firebase data change for Cristiana's
  role assignment. The code change itself is straightforward, but the operator must
  coordinate the Firebase update. Flagged as a dependency.
- The `username` prop removal (Task 03) touches three files and one test file. The
  propagation is fully traced — `CheckinsTable → CheckinsTableView → DateSelector` — and
  the view-layer removal is mechanical. Test impact is confined to `CheckinsUI.test.tsx`.
- No other username string checks exist in `apps/reception/src/` after the grep sweep.
  The four checks identified here are the complete remaining set.

**Open question (low risk):** Should `Permissions.ROOM_ALLOCATION` be extended to include
`"admin"` or `"manager"` to accommodate Serena's current access in `useAllocateRoom`?
Current definition is `["owner", "developer"]` only. If Serena holds `owner` or
`developer` in Firebase, no change is needed. If she holds `admin` or `manager`, the
permission set must be widened. This is a Firebase data question, not a code question,
but must be confirmed before Task 02 ships.
