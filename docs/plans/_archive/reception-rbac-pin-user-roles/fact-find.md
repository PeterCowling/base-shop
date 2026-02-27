---
Type: Fact-Find
Status: Archive
Feature-Slug: reception-rbac-pin-user-roles
---

# Fact-Find: Reception RBAC — PIN User Roles Data Gap

**Slug:** reception-rbac-pin-user-roles
**Business:** BRIK
**Priority:** P1 (ship blocker)
**Status:** Blocked — two role assignments need operator decision before tasks can be fully specified

---

## Business Context

The reception app is mid-way through an RBAC migration. All permission checks are being
replaced with `canAccess(user, Permissions.X)` and `isPrivileged(user)` calls sourced from
`apps/reception/src/lib/roles.ts`. When this migration lands, every user object that enters
`AuthContext` must carry a populated `roles` array, or all permission checks silently return
`false`, locking that user out of every gated feature.

PIN-auth users are loaded from `NEXT_PUBLIC_USERS_JSON` at build time via `getUserByPin.ts`.
The current env value contains five users, none with a `roles` field. The Zod schema that
parses the JSON (`usersRecordSchema`) also strips roles even if they were present in the raw
value. Both problems must be fixed together.

---

## Current State

### 1. getUserByPin.ts — module-level parse, roles stripped by schema

**File:** `apps/reception/src/utils/getUserByPin.ts` (lines 1–14)

```ts
let users: Record<string, User> = {};
try {
  users = usersRecordSchema.parse(
    JSON.parse(process.env["NEXT_PUBLIC_USERS_JSON"] ?? "{}")
  );
} catch {
  users = {};
}
```

`usersRecordSchema` is defined at `apps/reception/src/types/domains/userDomain.ts` line 76:

```ts
export const usersRecordSchema = z.record(userSchema);
```

`userSchema` (line 65) only declares `email` and `user_name`:

```ts
export const userSchema = z.object({
  email: z.string(),
  user_name: z.string(),
});
```

**Consequence:** Even if `NEXT_PUBLIC_USERS_JSON` contained `"roles": ["owner"]`, Zod would
strip it during parse. Roles must be added to `userSchema` to survive the parse step.

### 2. Current NEXT_PUBLIC_USERS_JSON value (from apps/reception/.env.local, line 17)

```json
{
  "343434": { "email": "sery399@gmail.com",               "user_name": "Dom"       },
  "222222": { "email": "sery399@gmail.com",               "user_name": "Serena"    },
  "777777": { "email": "peter.cowling1976@gmail.com",     "user_name": "Pete"      },
  "212121": { "email": "ponticorvoalessandro@gmail.com",  "user_name": "Alessandro"},
  "333333": { "email": "cmarzano@gmail.com",              "user_name": "Cristiana" }
}
```

No `roles` field on any entry.

### 3. Role system — role names and permission groups

**File:** `apps/reception/src/lib/roles.ts`

Valid `UserRole` values (from `userDomain.ts` line 5):
```
"admin" | "manager" | "staff" | "viewer" | "owner" | "developer"
```

Key permission groupings:
| Permission constant   | Roles that qualify                              |
|-----------------------|-------------------------------------------------|
| `TILL_ACCESS`         | owner, developer, admin, manager, **staff**     |
| `MANAGEMENT_ACCESS`   | owner, developer, admin, **manager**            |
| `ROOM_ALLOCATION`     | owner, developer                                |
| `SAFE_ACCESS`         | owner, developer, admin, manager, **staff**     |
| `OPERATIONS_ACCESS`   | owner, developer, **staff**                     |
| `REALTIME_DASHBOARD`  | owner, developer                                |
| `ALLOGGIATI_ACCESS`   | owner, developer                                |
| `STOCK_ACCESS`        | owner, developer, admin, manager                |
| `STATISTICS_ACCESS`   | owner, developer, admin, manager                |
| `BULK_ACTIONS`        | owner, developer, admin, manager                |

`isPrivileged()` = owner OR developer only.

Note: `OPERATIONS_ACCESS` does NOT include `manager` or `admin` — only
`owner`, `developer`, and `staff`. This looks like an omission but is out of scope for this
fact-find.

### 4. Auth flow — how PIN users reach AuthContext

The `Login.tsx` component handles two auth paths:

- **Email/password:** calls `useAuth().login()` → Firebase → `loadUserWithProfile()` →
  reads `userProfiles/{uid}` from Firebase Realtime DB → returns a `User` with `roles` set
  from the DB profile.

- **Device PIN (quick-unlock):** `Login.tsx` stores a `DevicePin` record in localStorage
  (hash only, no user object). On unlock, it calls `onLoginSuccess()` directly without
  touching `AuthContext`. The session relies on the existing Firebase `onAuthStateChanged`
  listener to re-hydrate the user from `userProfiles/{uid}`.

**Key finding:** `getUserByPin.ts` is NOT currently imported by any component. It exists as
a utility but is **not wired into the auth flow**. The "PIN users" described in the dispatch
packet refer to an older pattern. The file is called nowhere in the runtime code:

```
grep -r "getUserByPin" apps/reception/src (excluding tests and the file itself) → 0 results
```

This changes the nature of the problem. The real RBAC gap is:

1. `usersRecordSchema` does not include `roles` — so if `getUserByPin` were wired in the
   future, roles would be stripped.
2. The actual env value has no `roles` at all.
3. `NEXT_PUBLIC_USERS_JSON` is absent from `.env.example`.

The in-app PIN (quick-unlock in `Login.tsx`) is a device-local hash check against a stored
`DevicePin` record. It does **not** create a separate user session — it relies on the Firebase
auth session already being present. So PIN-auth users do get their roles from Firebase
`userProfiles/{uid}` via `subscribeToAuthState`, not from `NEXT_PUBLIC_USERS_JSON`.

### 5. env.example — NEXT_PUBLIC_USERS_JSON absent

**File:** `apps/reception/.env.example` (lines 1–40)

Confirmed: `NEXT_PUBLIC_USERS_JSON` is not documented in `.env.example`. The file is
otherwise comprehensive (Firebase keys, till settings, blind control, debug, email routing,
service worker version).

---

## Gaps Identified

### Gap 1 — usersRecordSchema strips roles (schema bug)

`userSchema` at `userDomain.ts:65` does not include `roles`. If `NEXT_PUBLIC_USERS_JSON`
were extended with roles, Zod would silently discard them. Must be fixed before the env
value is useful.

### Gap 2 — NEXT_PUBLIC_USERS_JSON has no roles on any user

The live env value at `.env.local:17` has five users and no role assignments. If
`getUserByPin` is wired into auth (current state: it is not, but migration may need it),
all five users would have `roles: undefined` → `canAccess()` returns `false` for every
gated feature.

### Gap 3 — getUserByPin not wired into runtime auth

`getUserByPin` is an orphaned utility with no callers in the production code path. The
dispatch packet assumes it feeds AuthContext — it does not, currently. The RBAC migration
plan should clarify whether:
  (a) `getUserByPin` will be wired in as a secondary auth path (e.g. shift PIN login for
      staff who don't have Firebase accounts), or
  (b) it can be removed or left as-is since all auth goes through Firebase.

### Gap 4 — NEXT_PUBLIC_USERS_JSON absent from .env.example

Developers cloning the repo have no documentation of the variable format or example values.

### Gap 5 — Role assignments for Dom and Cristiana need operator decision

- **Pete (777777):** `peter.cowling1976@gmail.com` — owner. Role: `["owner"]`. Clear.
- **Serena (222222):** `sery399@gmail.com` — owner (same email as Dom, different PIN).
  Role: `["owner"]`. Clear.
- **Dom (343434):** shares `sery399@gmail.com` with Serena. Unclear if Dom is an owner-level
  user or a staff member using a shared email. **Operator decision required.**
- **Alessandro (212121):** `ponticorvoalessandro@gmail.com` — staff name pattern → `["staff"]`.
  Likely correct but operator should confirm.
- **Cristiana (333333):** `cmarzano@gmail.com` — staff name pattern, but could be manager.
  **Operator decision required** (manager vs staff).

---

## Proposed Tasks

### Task 01 — Operator: Confirm role assignments for Dom and Cristiana
**Acceptance criteria:**
- Operator confirms whether Dom (343434) is `["owner"]`, `["manager"]`, or `["staff"]`.
- Operator confirms whether Cristiana (333333) is `["manager"]` or `["staff"]`.
- Written decision recorded in this plan directory before Task 02 proceeds.

### Task 02 — Extend usersRecordSchema to include roles field

**File:** `apps/reception/src/types/domains/userDomain.ts`

Change `userSchema` (line 65) to include optional `roles` using the existing
`userRolesSchema` definition, so Zod passes roles through rather than stripping them.
The `User` type already has `roles?: UserRole[]` at line 71, so only the schema needs
updating.

**Acceptance criteria:**
- `userSchema` includes `roles: userRolesSchema` (optional).
- `usersRecordSchema` derived from `userSchema` now passes roles through to the parsed user.
- Existing test in `getUserByPin.test.ts` continues to pass (roles-absent entries are fine).
- A new unit test asserts that a JSON entry with `"roles": ["owner"]` round-trips through
  `usersRecordSchema.parse()` and the resulting object has `roles: ["owner"]`.

### Task 03 — Add roles to NEXT_PUBLIC_USERS_JSON in .env.local

**File:** `apps/reception/.env.local` (line 17)

Update the env value with roles populated for all five users. Awaiting Task 01 for Dom and
Cristiana. Proposed value (pending operator confirmation):

```json
{
  "343434": { "email": "sery399@gmail.com",              "user_name": "Dom",       "roles": ["PENDING_OPERATOR_DECISION"] },
  "222222": { "email": "sery399@gmail.com",              "user_name": "Serena",    "roles": ["owner"] },
  "777777": { "email": "peter.cowling1976@gmail.com",    "user_name": "Pete",      "roles": ["owner"] },
  "212121": { "email": "ponticorvoalessandro@gmail.com", "user_name": "Alessandro","roles": ["staff"] },
  "333333": { "email": "cmarzano@gmail.com",             "user_name": "Cristiana", "roles": ["PENDING_OPERATOR_DECISION"] }
}
```

**Acceptance criteria:**
- `.env.local` line 17 contains a compact-JSON single-line value of
  `NEXT_PUBLIC_USERS_JSON` with `roles` populated for all five users.
- All roles are valid `UserRole` values.
- No other lines in `.env.local` are modified.

### Task 04 — Document NEXT_PUBLIC_USERS_JSON in .env.example

**File:** `apps/reception/.env.example`

Add a new section documenting `NEXT_PUBLIC_USERS_JSON` with format explanation and a
minimal example. Suggested placement: after the Firebase section, before Till settings.

**Acceptance criteria:**
- `.env.example` includes `NEXT_PUBLIC_USERS_JSON` with a comment block explaining:
  - The key is a PIN (numeric string).
  - Each value is `{ email, user_name, roles }`.
  - Valid roles are: `owner`, `developer`, `admin`, `manager`, `staff`, `viewer`.
  - An example entry is shown with a fake PIN and role.
- File otherwise unchanged.

### Task 05 — Clarify or wire getUserByPin in RBAC migration plan

**Scope:** Architecture decision only — no code change in this task.

Determine whether `getUserByPin` should be:
  (a) wired into `AuthContext` as a secondary login path for shift-PIN staff who do not
      have individual Firebase accounts, OR
  (b) left as-is (device-PIN quick-unlock in `Login.tsx` handles the only PIN flow and
      relies on Firebase session, so `getUserByPin` is redundant).

If (b), file a follow-up to remove or deprecate `getUserByPin.ts` to avoid future
confusion.

**Acceptance criteria:**
- A written decision note is added to this plan directory (e.g. `task-05-pin-auth-decision.md`).
- If (a): the `reception-rbac-migration-code` plan is updated to include wiring
  `getUserByPin` into `AuthContext` as a discrete step.
- If (b): a GitHub issue or plan entry is created to deprecate/remove `getUserByPin.ts`.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|-----------|-------|
| Schema bug (usersRecordSchema missing roles) | High | Confirmed by direct reading of userDomain.ts:65–76 |
| getUserByPin not wired into runtime auth | High | grep across full src tree returned 0 callers outside tests |
| Device-PIN flow uses Firebase session | High | Login.tsx confirmed — onLoginSuccess() relies on auth state listener |
| Pete = owner, Serena = owner, Alessandro = staff | High | Username + email evidence clear |
| Dom role | Low | Shares Serena's email, status unclear |
| Cristiana role | Medium | Could be manager based on responsibility level |
| env.example absence confirmed | High | Read directly, NEXT_PUBLIC_USERS_JSON absent |

**Overall status:** Blocked on operator role decision for Dom and Cristiana (Task 01).
Tasks 02, 04, and 05 can proceed immediately in parallel. Task 03 must wait for Task 01.

---

## Files Referenced

| File | Purpose |
|------|---------|
| `apps/reception/src/utils/getUserByPin.ts` | PIN user lookup — schema parse, roles stripped |
| `apps/reception/src/types/domains/userDomain.ts` | UserRole enum, userSchema, usersRecordSchema, normalizeRoles |
| `apps/reception/src/lib/roles.ts` | canAccess, isPrivileged, Permissions constants |
| `apps/reception/src/context/AuthContext.tsx` | Auth context — Firebase-only, no getUserByPin call |
| `apps/reception/src/services/firebaseAuth.ts` | loadUserWithProfile — where Firebase users get roles from DB |
| `apps/reception/src/components/Login.tsx` | Login UI — device-PIN quick-unlock flow |
| `apps/reception/src/components/appNav/AppNav.tsx` | canAccess usage, fallback for legacy users without roles |
| `apps/reception/src/components/appNav/ManModal.tsx` | canAccess(Permissions.MANAGEMENT_ACCESS) |
| `apps/reception/src/components/appNav/TillModal.tsx` | canAccess(Permissions.TILL_ACCESS) |
| `apps/reception/.env.local` | Live env — NEXT_PUBLIC_USERS_JSON with 5 users, no roles |
| `apps/reception/.env.example` | Documentation env — NEXT_PUBLIC_USERS_JSON absent |
| `apps/reception/src/utils/__tests__/getUserByPin.test.ts` | Existing tests — no roles tested |
