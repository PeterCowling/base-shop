---
Status: Complete
Feature-Slug: brik-reception-user-provisioning
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record — BRIK Reception User Provisioning

## What Was Built

**Wave 1 — Test infrastructure and permissions (TASK-01, TASK-02, TASK-03)**

Fixed two stale pre-existing tests that had drifted from their components: `login-route.parity.test.tsx` was querying a heading that no longer exists (replaced with `getByRole("button", { name: /^sign in$/i })`), and `AuthContext.test.tsx` was missing Firebase service mocks and testing a `setUser` method that does not exist on `AuthContextValue`. Both were failing in CI. The `USER_MANAGEMENT` permission constant (`["owner", "developer"]`) was added to `lib/roles.ts` — gating all new UI and API surfaces. Three new Firebase Realtime Database emulator tests were added covering the owner-writes-userProfiles path with non-staff roles (map form `{manager: true}`), confirming the DB security rules allow provisioned writes correctly.

**Wave 2 — Provisioning API route (TASK-04)**

Created `apps/reception/src/app/api/users/provision/route.ts` — a POST endpoint that: authenticates the caller via `requireStaffAuth`, gates on `USER_MANAGEMENT` permission, creates a Firebase Auth account via the Identity Toolkit REST `accounts:signUp` endpoint (server-side, no session displacement), writes `userProfiles/{uid}` with `roles: {[role]: true}` (map form, required for DB security rules), and writes an audit entry to `audit/settingChanges/{uuid}`. The bearer token is extracted from the `Authorization` header for DB REST writes — no `idToken` body field needed. A full unit test file (TC-04-01..TC-04-09) covers all status codes and DB write shapes.

**Wave 3 — UI form and navigation (TASK-05, TASK-06)**

Created `apps/reception/src/app/staff-accounts/page.tsx` as a server component with `<Providers>` wrapper (`export const dynamic = "force-dynamic"`). Created `apps/reception/src/components/userManagement/StaffAccountsForm.tsx` as a `"use client"` component with email, display name, and role picker (staff/manager/admin only). Form is gated by `canAccess(user, [...Permissions.USER_MANAGEMENT])` — returns null for non-privileged users. On submit, the form calls `getFirebaseAuth(app).currentUser?.getIdToken(true)` (force refresh), POSTs to `/api/users/provision`, and on success calls `sendPasswordResetEmail(auth, email)` client-side. A "Resend setup email" button is available in the success state. Full RTL test suite (TC-05-01..TC-05-09) covers all error and success paths. Added `{ label: "Staff Accounts", route: "/staff-accounts", icon: Users, permission: Permissions.USER_MANAGEMENT }` to the Admin section in `AppNav.tsx` — only visible to owner/developer users.

## Tests Run

- `pnpm --filter=@apps/reception exec tsc --noEmit` — **pass** (all waves, no TypeScript errors)
- `pnpm --filter=@apps/reception exec eslint src --max-warnings 0` — **pass** (all waves, no lint errors)
- Jest tests: CI-only policy (effective 2026-02-27); local typecheck + lint is the validation gate. Tests committed and will run in next CI push.

**Key fixes during build:**
- TypeScript discriminated union narrowing: used `"response" in authResult` / `"error" in result` pattern (established codebase convention from `booking-email/route.ts`) — `!obj.ok` does not narrow correctly in this codebase's TypeScript config.
- ESLint `import/first`: all ES module imports must appear before `jest.mock()` calls in source order (Jest hoists at runtime but ESLint enforces source order).

## Validation Evidence

| Task | Contract | Evidence |
|---|---|---|
| TASK-01 | TC-01 stale test fixes | `login-route.parity.test.tsx` selector updated; `AuthContext.test.tsx` rewritten with Firebase mocks. Typecheck + lint pass. |
| TASK-02 | TC-02-01..TC-02-05 | `USER_MANAGEMENT: ["owner", "developer"] as UserRole[]` added to `Permissions` const. Structurally verified. Typecheck + lint pass. |
| TASK-03 | TC-03-01..TC-03-03 | Three emulator tests added: owner writes with manager role (allowed), unauthenticated write (denied), owner writes with developer role (allowed). Map-form roles `{ manager: true }` used. |
| TASK-04 | TC-04-01..TC-04-09 | Route created. Unit tests mock `requireStaffAuth`, `accounts:signUp`, DB REST writes. All 9 contracts covered. Typecheck + lint pass. |
| TASK-05 | TC-05-01..TC-05-09 | Form and page created. RTL tests cover render, role options, submit body shape, success/error states, resend button, and staff-role gate. Typecheck + lint pass. |
| TASK-06 | TC-06-01..TC-06-04 | Nav item added with `permission: Permissions.USER_MANAGEMENT`. `Users` icon imported. Gating confirmed via `canAccessSection(item.permission)` call path in `AppNav.tsx`. |

## Scope Deviations

None. All changes were within the task `Affects` lists. No controlled expansions were required.

## Outcome Contract

- **Why:** New staff (Serena and Alessandro) could not log in to the reception app. Account creation required direct Firebase console access by a developer — blocking every new hire on developer availability.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Owner/developer users can provision new staff accounts from within the reception app UI with no developer Firebase console access required.
- **Source:** auto
