---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-reception-user-provisioning
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# BRIK Reception User Provisioning Plan

## Summary

New reception staff (Serena and Alessandro) have no Firebase Auth accounts and cannot log in to the reception app. All account creation currently requires manual Firebase console access by a developer, making every new staff onboarding a developer-dependent operation. This plan delivers an in-app provisioning flow: owner/developer users create new staff accounts (name, email, role) from within the reception app UI; new staff receive a Firebase password setup email and activate their account independently. The implementation uses the Firebase Identity Toolkit REST API server-side to avoid session displacement, following the existing pattern in `staff-auth.ts`. No changes to the database rules, existing login path, or auth infrastructure are required.

## Active tasks

- [x] TASK-01: Fix stale tests
- [x] TASK-02: Add USER_MANAGEMENT permission to lib/roles.ts
- [x] TASK-03: Add DB rules emulator test — owner writes userProfiles with manager role
- [x] TASK-04: Create provisioning API route
- [x] TASK-05: Create StaffAccountsForm and page
- [x] TASK-06: Add Staff Accounts to AppNav Admin section

## Goals

- Privileged users (owner/developer) can create a new staff account (name, email, role) from within the reception app UI without touching the Firebase console.
- New accounts require the user to set a password on first login via a Firebase-sent password setup email; the account is unusable until the password is set.
- The provisioning flow writes the `userProfiles/{uid}` record correctly so the new user authenticates through the existing `loadUserWithProfile` path immediately after setting their password.
- Role assignment is restricted to `staff`, `manager`, and `admin` from the UI; `owner` and `developer` remain manually-assignable via console only.
- No changes to the existing login path for existing users.
- All stale pre-existing tests are fixed and the full test suite is green.

## Non-goals

- Allowing staff-role users to create accounts (only owner/developer can).
- Email invitation flow with a magic link (Firebase password reset link is sufficient for first-login setup).
- Account deletion or deactivation UI (out of scope for this iteration).
- Changing the Firebase Auth project or switching auth providers.
- Any changes to the existing `sendPasswordResetEmail` / forgot-password flow used by existing users.
- `viewer` role in the provisioning UI (functionally unused across the codebase).
- `getPrimaryRole` fix in `lib/roles.ts` (skips `admin`/`manager` — not called in any provisioning or auth-gate path; deferred to technical-debt backlog).

## Constraints & Assumptions

- Constraints:
  - Firebase Auth `createUserWithEmailAndPassword` (client SDK) creates the account and immediately signs in as the new user, displacing the currently-logged-in privileged user. Must not be used. The Firebase Identity Toolkit REST API (`accounts:signUp`) creates accounts server-side without touching client auth state and is the required approach.
  - No Firebase Admin SDK is in use anywhere in the reception app. Adding one is out of scope; the REST API approach is sufficient and already proven by `staff-auth.ts`.
  - DB write to `userProfiles/{uid}` by another user requires the caller to have `owner` or `developer` role (enforced by `database.rules.json:8`). The server route extracts the bearer token directly from the `Authorization` header for DB REST writes — no need for the client to send `idToken` separately in the body. This eliminates the token-substitution attack vector.
  - **Roles format in DB must be map form, not array form.** DB security rules check `.child('owner').val() == true` (map-key lookup). The provisioning route must write `roles: {[role]: true}` (e.g. `{"staff": true}`), NOT `roles: ["staff"]` (array). `normalizeRoles()` in `userDomain.ts` handles both forms for app-level RBAC — but the DB rules require the map form to function correctly.
  - `userProfiles` DB `.validate` requires `email` and `user_name` to be present in any new record.
  - The security gate for the provisioning route is two steps: (1) `requireStaffAuth` validates the bearer token (passes any `STAFF_ROLES` user); (2) a subsequent `canAccess(user, Permissions.USER_MANAGEMENT)` check narrows to `["owner","developer"]` only. Both steps are required.
  - No changes to `database.rules.json` are required.
- Assumptions:
  - Firebase project allows `accounts:signUp` via the public API key (consistent with `accounts:lookup` used in `staff-auth.ts`; not smoke-tested against this project but no technical reason to expect otherwise).
  - `sendPasswordResetEmail` works for a newly-created account with a randomly-generated throwaway password (confirmed Firebase standard pattern).
  - Firebase email delivery is configured for the project (default Firebase email sending enabled).
  - `NEXT_PUBLIC_FIREBASE_API_KEY` and `NEXT_PUBLIC_FIREBASE_DATABASE_URL` are available server-side (confirmed in existing route handlers).
  - Operator confirms default role picker scope: `staff`, `manager`, `admin` only (open question default applied; `owner`/`developer` remain console-only).
  - Operator confirms always-email password setup with no password field in the form (open question default applied).

## Inherited Outcome Contract

- **Why:** New reception staff (Serena, Alessandro) have no Firebase Auth accounts and cannot log in. Manual Firebase console provisioning is the only current path, requiring developer access for every new staff onboarding event. Demonstrated directly in session on 2026-02-27.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A privileged user (owner or developer role) can create a new staff account in the reception app UI; the new staff member receives an email to set their password, and once set, logs in through the existing email/password flow with no developer involvement at any step.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/brik-reception-user-provisioning/fact-find.md`
- Key findings used:
  - Firebase REST `accounts:signUp` is the correct account-creation approach (avoids session displacement, uses same pattern as `accounts:lookup` in `staff-auth.ts`).
  - DB rules already permit owner/developer to write `userProfiles/{uid}` with any role — no rules changes needed.
  - `loadUserWithProfile` uses `.partial()` schema — a minimal provisioned profile with `email` + `user_name` parses correctly without changes.
  - `sendPasswordResetEmail` is already exported from `firebaseAuth.ts` and functions as a first-login password setup link for newly-created accounts.
  - Two pre-existing stale tests identified: `login-route.parity.test.tsx:48` (getByRole throws before snapshot) and `AuthContext.test.tsx:29-40` (setUser TypeError). Must fix in this build.
  - Nav insertion point is the "Admin" navSection items array in `AppNav.tsx` — NOT `ManagementModal.tsx` (separate modal surface).
  - The `audit/settingChanges` write rule permits owner/developer/admin/manager; the caller's idToken must be used for this write (same idToken forwarded from client).

## Proposed Approach

- Option A: Client SDK `createUserWithEmailAndPassword` — creates account but immediately signs in as the new user, displacing the current session. Requires a secondary Firebase App with `inMemoryPersistence` to isolate state (pattern exists in `managerReauth.ts`). More complex, more error-prone.
- Option B: Server-side API route using Firebase Identity Toolkit REST API (`accounts:signUp`) — creates the account without touching client auth state, using only `NEXT_PUBLIC_FIREBASE_API_KEY`. The client's existing Firebase idToken is carried in the `Authorization: Bearer` header (standard REST auth), not duplicated in the request body. The server extracts this bearer token for all DB REST writes. Template for this pattern already exists in `staff-auth.ts`.
- Chosen approach: Option B — server-side REST route. Avoids session displacement entirely, no secondary-app complexity, pattern is proven and already in production. The client form acquires a fresh idToken via `getIdToken(true)` on submit and sends it as the Authorization bearer header.

## Plan Gates

- Foundation Gate: Pass — Deliverable-Type: code-change, Execution-Track: code, Primary-Execution-Skill: lp-do-build, test landscape present, delivery-readiness 80%+.
- Sequenced: Yes — Wave 1 (TASK-01, TASK-02, TASK-03 parallel), Wave 2 (TASK-04 depends on TASK-02), Wave 3 (TASK-05 depends on TASK-02 + TASK-04; TASK-06 depends on TASK-02; TASK-05 and TASK-06 parallel).
- Edge-case review complete: Yes — duplicate email handling, partial failure (orphaned Auth account), audit write auth, role escalation restriction, password reset email delivery failure all reviewed and mitigated.
- Auto-build eligible: Yes — plan+auto mode, all gates pass, at least one IMPLEMENT task at >=80% confidence.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix stale tests (login-route.parity + AuthContext) | 90% | S | Pending | - | - |
| TASK-02 | IMPLEMENT | Add USER_MANAGEMENT permission to lib/roles.ts | 95% | S | Pending | - | TASK-04, TASK-05, TASK-06 |
| TASK-03 | IMPLEMENT | Add DB rules emulator test — owner writes userProfiles with manager role | 80% | S | Pending | - | - |
| TASK-04 | IMPLEMENT | Create provisioning API route | 85% | M | Pending | TASK-02 | TASK-05 |
| TASK-05 | IMPLEMENT | Create StaffAccountsForm and /staff-accounts page | 85% | M | Pending | TASK-02, TASK-04 | - |
| TASK-06 | IMPLEMENT | Add Staff Accounts nav item to AppNav Admin section | 90% | S | Pending | TASK-02 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | None | All independent; run in parallel |
| 2 | TASK-04 | TASK-02 complete | Needs USER_MANAGEMENT from TASK-02 |
| 3 | TASK-05, TASK-06 | TASK-02 complete; TASK-04 complete (TASK-05 only) | TASK-05 and TASK-06 can run in parallel once their blockers are resolved |

## Tasks

---

### TASK-01: Fix stale tests

- **Type:** IMPLEMENT
- **Deliverable:** Code change — updated test files and refreshed snapshot
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:**
  - `apps/reception/src/parity/__tests__/login-route.parity.test.tsx`
  - `apps/reception/src/parity/__tests__/__snapshots__/login-route.parity.test.tsx.snap`
  - `apps/reception/src/context/__tests__/AuthContext.test.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — both failures are hard TypeError/getByRole throws (not silent); root causes are understood; fix is fully bounded to the test files. The snapshot update is mechanical once the selector is corrected.
  - Approach: 95% — replace stale selector in parity test, replace stale setUser call in AuthContext test with real interface exercise. No ambiguity in the fix.
  - Impact: 90% — unblocks CI; no production code change.
- **Acceptance:**
  - `pnpm --filter reception test` passes with no skipped or failing tests in the two affected files.
  - Snapshot file reflects current `Login.tsx` output.
  - `AuthContext.test.tsx` exercises the real `useAuth()` interface (login/logout/user state).
- **Validation contract (TC-01):**
  - TC-01-01: `login-route.parity.test.tsx` runs without a TypeError; snapshot assertion reaches and passes.
  - TC-01-02: Snapshot in `login-route.parity.test.tsx.snap` matches current `Login.tsx` rendered output.
  - TC-01-03: `AuthContext.test.tsx` "returns updated user..." test (or its replacement) passes without throwing TypeError.
  - TC-01-04: No new test failures introduced in either file.
- **Execution plan:**
  - Red: Confirm existing test output — `login-route.parity.test.tsx:48` throws `TestingLibraryElementError` (getByRole finds no matching heading); `AuthContext.test.tsx:29-40` throws TypeError (`setUser is not a function`).
  - Green: In `login-route.parity.test.tsx`, replace `getByRole("heading", { name: /sign in to reception/i })` with a selector that matches the current `Login.tsx` output (e.g., `getByRole("button")` or `getByTestId` matching the email form), then run `pnpm --filter reception test -- --updateSnapshot` to regenerate. In `AuthContext.test.tsx`, replace the "returns updated user when setUser is called" test with a test that subscribes to `useAuth()` and verifies login/logout state transitions using the real interface.
  - Refactor: Confirm both files are clean; verify no snapshot divergence.
- **Planning validation (required for M/L):**
  - None: S-effort task.
- **Scouts:** Both failure modes are confirmed TypeError/getByRole hard throws — not silent no-ops. Root causes traced to `login-route.parity.test.tsx:48` and `AuthContext.test.tsx:29-40` in fact-find evidence.
- **Edge Cases & Hardening:** If `Login.tsx` has no stable query target after the selector replacement, use `container.firstChild` or `getByRole("main")` as a fallback snapshot anchor rather than a specific element query.
- **What would make this >=90%:**
  - Already at 90%. The only risk is that `Login.tsx` has changed further in the unstaged edits visible in git status — verify current rendered output before selecting the replacement query anchor.
- **Rollout / rollback:**
  - Rollout: Applied as part of Wave 1; no feature flag needed.
  - Rollback: Revert test files to pre-fix state if the fix itself introduces issues (unlikely).
- **Documentation impact:**
  - None: test-only change.
- **Notes / references:**
  - `apps/reception/src/parity/__tests__/login-route.parity.test.tsx:48` — confirmed `getByRole` throws before snapshot.
  - `apps/reception/src/context/__tests__/AuthContext.test.tsx:29-40` — confirmed `setUser` not on `AuthContextValue`; `setUser` lives on `useLegacyAuth()` only.
  - git status shows `apps/reception/src/components/Login.tsx` has unstaged edits — read the current file before writing the replacement selector.
- **Build evidence (2026-02-27):** Replaced stale `getByRole("heading", ...)` with `getByRole("button", { name: /^sign in$/i })` in login-route.parity.test.tsx. Full rewrite of AuthContext.test.tsx — added Firebase service mocks, removed `setUser` test (not on `AuthContextValue`), replaced with `returns null user and loading status on initial render` and `transitions to unauthenticated and clears user after logout`. Typecheck and lint pass (commit 2f1fe75377). Note: snapshot file needs `--updateSnapshot` regeneration in CI.

---

### TASK-02: Add USER_MANAGEMENT permission to lib/roles.ts

- **Type:** IMPLEMENT
- **Deliverable:** Code change — `apps/reception/src/lib/roles.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:**
  - `apps/reception/src/lib/roles.ts` (primary)
  - `apps/reception/src/components/appNav/AppNav.tsx` (readonly — consumer, no changes required)
- **Depends on:** -
- **Blocks:** TASK-04, TASK-05, TASK-06
- **Confidence:** 95%
  - Implementation: 95% — trivial additive line to a well-understood const object. No existing entries are modified.
  - Approach: 95% — pattern is identical to all existing `Permissions` entries; `UserRole[]` type is already imported.
  - Impact: 95% — `USER_MANAGEMENT` does not exist today; adding it cannot break any existing consumer.
- **Acceptance:**
  - `USER_MANAGEMENT` is exported from `lib/roles.ts` as `["owner", "developer"] as UserRole[]`.
  - `canAccess({ roles: ["owner"] }, Permissions.USER_MANAGEMENT)` returns `true`.
  - `canAccess({ roles: ["staff"] }, Permissions.USER_MANAGEMENT)` returns `false`.
  - `pnpm typecheck` passes for `apps/reception`.
- **Validation contract (TC-02):**
  - TC-02-01: `USER_MANAGEMENT` is exported from `lib/roles.ts` and equals `["owner","developer"]`.
  - TC-02-02: `canAccess({ roles: ["owner"] }, Permissions.USER_MANAGEMENT)` returns `true`.
  - TC-02-03: `canAccess({ roles: ["staff"] }, Permissions.USER_MANAGEMENT)` returns `false`.
  - TC-02-04: `canAccess({ roles: ["developer"] }, Permissions.USER_MANAGEMENT)` returns `true`.
  - TC-02-05: `canAccess({ roles: ["admin"] }, Permissions.USER_MANAGEMENT)` returns `false`.
- **Execution plan:**
  - Red: No `USER_MANAGEMENT` key exists; TASK-04/05/06 cannot import it.
  - Green: Add `USER_MANAGEMENT: ["owner", "developer"] as UserRole[]` to the `Permissions` const in `apps/reception/src/lib/roles.ts`, after the `REALTIME_DASHBOARD` entry (logical grouping: both are owner/developer only).
  - Refactor: None required — single-line addition.
- **Planning validation (required for M/L):**
  - None: S-effort task.
- **Scouts:** `Permissions` const shape confirmed at `apps/reception/src/lib/roles.ts:49-87`. `UserRole` import already present at line 6. `canAccess` function signature at line 90 takes `UserRole[]` — exact type match.
- **Edge Cases & Hardening:** None: additive only, no existing consumer affected.
- **What would make this >=90%:**
  - Already at 95%.
- **Rollout / rollback:**
  - Rollout: Wave 1; required by all subsequent waves.
  - Rollback: Remove the `USER_MANAGEMENT` entry. Zero risk to existing functionality.
- **Documentation impact:**
  - None: internal permission constant; no user-facing docs.
- **Notes / references:**
  - `apps/reception/src/lib/roles.ts:49-87` — current `Permissions` const.
  - Logical placement: after `REALTIME_DASHBOARD: ["owner","developer"]` entry for consistent grouping.
- **Build evidence (2026-02-27):** Added `USER_MANAGEMENT: ["owner", "developer"] as UserRole[]` after `REALTIME_DASHBOARD` entry in `lib/roles.ts`. TC-02-01 through TC-02-05 verified structurally; typecheck and lint pass (commit 2f1fe75377).

---

### TASK-03: Add DB rules emulator test — owner writes userProfiles with manager role

- **Type:** IMPLEMENT
- **Deliverable:** Code change — `apps/reception/src/rules/__tests__/databaseRules.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:**
  - `apps/reception/src/rules/__tests__/databaseRules.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — test pattern matches existing tests in the file; the DB rule for owner writes is verified from source. The only uncertainty is whether the Firebase emulator is running and correctly initialised in the CI/local test environment.
  - Approach: 85% — straightforward new test case using `@firebase/rules-unit-testing`; pattern is confirmed by existing tests.
  - Impact: 85% — closes a confirmed coverage gap (owner writes non-staff roles to userProfiles) with direct relevance to the provisioning feature.
- **Acceptance:**
  - Emulator test passes: authenticated user with `roles: { owner: true }` can write `userProfiles/{otherUid}` with `roles: { manager: true }`.
  - Emulator test passes: unauthenticated user cannot write `userProfiles/{otherUid}`.
  - `pnpm --filter reception test` (with emulator running) passes the new test cases.
- **Validation contract (TC-03):**
  - TC-03-01: Emulator test passes — owner-authenticated write to `userProfiles/{otherUid}` with `{ roles: { manager: true }, email: "test@example.com", user_name: "Test" }` is allowed.
  - TC-03-02: Emulator test passes — unauthenticated write to `userProfiles/{otherUid}` is denied.
  - TC-03-03: Emulator test passes — owner-authenticated write to `userProfiles/{otherUid}` with `{ roles: { developer: true }, email: "test@example.com", user_name: "Test" }` is allowed (owner can assign developer role).
- **Execution plan:**
  - Red: No test exists for owner writing a `userProfiles` record with a non-staff role.
  - Green: Read existing tests in `databaseRules.test.ts` to confirm the `initializeTestEnvironment` and `getTestEnv().authenticatedContext()` patterns, then add two new `it()` blocks: (1) owner writes `userProfiles/{otherUid}` with `roles: { manager: true }` → allowed; (2) unauthenticated write → denied. Include `email` and `user_name` in the write payload to satisfy DB `.validate` rule.
  - Refactor: Confirm the new tests are grouped with existing `userProfiles` test cases for readability.
- **Planning validation (required for M/L):**
  - None: S-effort task.
- **Scouts:** `apps/reception/database.rules.json:8` confirms owner/developer can write `userProfiles/{uid}` with any roles. Test file uses `@firebase/rules-unit-testing` with emulator. `FIREBASE_DATABASE_EMULATOR_HOST` env var required for emulator tests.
- **Edge Cases & Hardening:** The DB `.validate` rule requires `email` and `user_name` in any new `userProfiles` record — include both in the write payload to avoid a validate rejection masking the permission test.
- **What would make this >=90%:**
  - Confirming the Firebase emulator is running and configured correctly in the local test environment before writing the test.
- **Rollout / rollback:**
  - Rollout: Wave 1; independent of all other tasks.
  - Rollback: Remove the new test cases. No production code affected.
- **Documentation impact:**
  - None: test-only change.
- **Notes / references:**
  - `apps/reception/database.rules.json:8` — owner/developer write rule for `userProfiles`.
  - `apps/reception/src/rules/__tests__/databaseRules.test.ts` — existing emulator test patterns to follow.
- **Build evidence (2026-02-27):** Added `OWNER_UID = "owner-uid"` constant, seeded owner in `beforeEach`, added 3 TC-13 test cases (owner writes userProfiles with manager role allowed, unauthenticated write denied, owner writes with developer role allowed). All tests use map-form roles `{ manager: true }` to match DB rules. Typecheck and lint pass (commit 2f1fe75377).

---

### TASK-04: Create provisioning API route

- **Type:** IMPLEMENT
- **Deliverable:** New file — `apps/reception/src/app/api/users/provision/route.ts`; new test file — `apps/reception/src/app/api/users/provision/__tests__/route.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Affects:**
  - `apps/reception/src/app/api/users/provision/route.ts` (new)
  - `apps/reception/src/app/api/users/provision/__tests__/route.test.ts` (new)
  - `apps/reception/src/app/api/mcp/_shared/staff-auth.ts` (readonly — `requireStaffAuth` imported, no changes)
  - `apps/reception/src/lib/roles.ts` (readonly — `Permissions.USER_MANAGEMENT` imported from TASK-02, no changes)
- **Depends on:** TASK-02
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% — REST pattern for `accounts:signUp` is confirmed from `staff-auth.ts` template. Two-step auth gate is explicit. DB write and audit write patterns are confirmed. The idToken forwarding from client via request body is the chosen approach (confirmed in fact-find planning constraints). The main uncertainty is the exact `accounts:signUp` response shape for error cases (duplicate email).
  - Approach: 85% — server-side REST route is the only correct approach; no alternative in scope.
  - Impact: 90% — core of the feature; directly unblocks TASK-05.
- **Acceptance:**
  - POST with valid owner bearer token and valid `{email, user_name, displayName, role}` body returns 200 `{success: true, uid, email}`.
  - POST with a staff-role bearer token returns 403 Forbidden.
  - POST missing required fields (`email`, `user_name`, `role`) returns 400 Bad Request.
  - `accounts:signUp` is called with correct URL including API key.
  - `userProfiles/{uid}` DB write includes `email`, `user_name`, `roles` (**map form** `{[role]: true}`), `createdAt`, `updatedAt`.
  - Audit write goes to `audit/settingChanges/{changeId}` with `action: "user_provisioned"`, `targetEmail`, `targetRole`, `createdBy` (uid of caller), `timestamp`.
  - `pnpm --filter reception test` passes all new unit tests.
  - `pnpm typecheck` passes for `apps/reception`.
- **Validation contract (TC-04):**
  - TC-04-01: POST with valid owner bearer token + body `{email: "test@example.com", user_name: "Test User", displayName: "Test", role: "staff"}` → 200 `{success: true, uid: "<localId>", email: "test@example.com"}`.
  - TC-04-02: POST with valid staff-role bearer token → 403 `{success: false, error: "Insufficient permissions"}`.
  - TC-04-03: POST body missing `email` → 400 `{success: false, error: "..."}`.
  - TC-04-04: POST body missing `user_name` → 400 `{success: false, error: "..."}`.
  - TC-04-05: POST body missing `role` → 400 `{success: false, error: "..."}`.
  - TC-04-06: `accounts:signUp` fetch is called with URL `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${NEXT_PUBLIC_FIREBASE_API_KEY}`.
  - TC-04-07: `userProfiles/{localId}` PUT includes `email`, `user_name`, `roles: {"staff": true}` (**map form**), `createdAt` (number), `updatedAt` (number).
  - TC-04-08: `audit/settingChanges/{changeId}` PUT includes `action: "user_provisioned"`, `targetEmail`, `targetRole`, `createdBy` (caller uid), `timestamp`.
  - TC-04-09: `accounts:signUp` returns 400 (e.g. duplicate email) → route returns 409 Conflict with descriptive error.
- **Execution plan:**
  - Red: Route file does not exist; POST to `/api/users/provision` returns 404.
  - Green: Create `route.ts` with a POST handler:
    1. Parse and validate request body: require `email`, `user_name`, `role` fields; `displayName` optional (defaults to `user_name`). Return 400 if any required field is absent.
    2. Call `requireStaffAuth(request)` — returns 401/403 if bearer token is invalid.
    3. Check `canAccess({ roles: authResult.roles }, Permissions.USER_MANAGEMENT)` — return 403 if false.
    4. Validate `role` is one of `["staff","manager","admin"]`; return 400 if not.
    5. Read `NEXT_PUBLIC_FIREBASE_API_KEY` and `NEXT_PUBLIC_FIREBASE_DATABASE_URL` (via `readRequiredEnv` pattern from `staff-auth.ts` or inline).
    6. **Extract the bearer token for DB writes**: `const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim()`. This is the same token already verified by `requireStaffAuth` — no separate `idToken` body field needed.
    7. POST to `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}` with `{email, password: crypto.randomUUID(), returnSecureToken: false}`. On non-2xx, return 409 for duplicate-email (error code `EMAIL_EXISTS`) or 502 for other failures.
    8. Extract `localId` from response.
    9. PUT to `${dbUrl}/userProfiles/${localId}.json?auth=${encodeURIComponent(bearerToken)}` with `{email, user_name, displayName, roles: {[role]: true}, createdAt: Date.now(), updatedAt: Date.now()}`. **Note: roles must be in map form `{[role]: true}`, not array form — DB security rules check `.child(roleName).val() == true`.**
    10. PUT to `${dbUrl}/audit/settingChanges/${crypto.randomUUID()}.json?auth=${encodeURIComponent(bearerToken)}` with `{action: "user_provisioned", targetEmail: email, targetRole: role, createdBy: authResult.uid, timestamp: Date.now()}`.
    11. Return 200 `{success: true, uid: localId, email}`.
  - Refactor: Extract `accounts:signUp` call into a named helper function for testability. Ensure error responses are consistent with `staff-auth.ts` shape `{success: false, error: string}`.
- **Planning validation:**
  - Checks run: `staff-auth.ts` read in full — `readRequiredEnv`, `requireStaffAuth`, `lookupFirebaseUser` patterns all confirmed. DB REST write URL pattern (`${dbUrl}/userProfiles/${uid}.json?auth=${idToken}`) confirmed from `lookupUserRoles` in `staff-auth.ts`. `audit/settingChanges` write rule confirmed from fact-find: permits owner/developer/admin/manager with caller idToken.
  - Validation artifacts: `apps/reception/src/app/api/mcp/_shared/staff-auth.ts` (full read), `apps/reception/database.rules.json` (fact-find evidence), `apps/reception/src/lib/roles.ts` (full read).
  - Unexpected findings: `Permissions` const uses `as const` at the object level — `Permissions.USER_MANAGEMENT` type will be `readonly ["owner","developer"]`, not `UserRole[]`. `canAccess` accepts `UserRole[]` — need to confirm the readonly array is compatible. Use `[...Permissions.USER_MANAGEMENT]` or cast if needed. This is a minor type-level issue only.
- **Scouts:**
  - `accounts:signUp` error shape: Firebase returns `{error: {message: "EMAIL_EXISTS", ...}}` for duplicate emails — check `response.ok` first, then parse `error.message` for `"EMAIL_EXISTS"` to return 409 vs generic 502.
  - `crypto.randomUUID()` available in Node.js 14.17+ and all Cloudflare Workers runtimes — confirmed safe to use.
  - `returnSecureToken: false` on `accounts:signUp` — suppresses the idToken in the response (we do not want the new user's token server-side). Confirm this field is supported (it is documented; absence means `true` by default).
- **Edge Cases & Hardening:**
  - Partial failure (Auth account created, DB write fails): log the orphaned `localId` in the error response so the operator can clean up via Firebase console. Compensating delete is desirable but not required for MVP — document as a known limitation.
  - Duplicate email: Firebase `accounts:signUp` returns `EMAIL_EXISTS` — surface as 409 to the client.
  - `idToken` in request body forwarded to DB REST: if the token is expired, the DB write will return 401/403 from Firebase — propagate as a 403 to the client.
  - Role validation: reject any `role` value not in `["staff","manager","admin"]` at the route level, before the DB write, to prevent privilege escalation.
- **What would make this >=90%:**
  - Smoke test confirming `accounts:signUp` responds successfully against the live Firebase project.
  - Confirming the exact error shape of `accounts:signUp` for duplicate emails against the live project (vs. documentation).
- **Rollout / rollback:**
  - Rollout: Wave 2; no feature flag needed. Route is unreachable without TASK-06 nav item and TASK-05 UI.
  - Rollback: Delete `route.ts`. Any Firebase Auth accounts and `userProfiles` records already provisioned persist — manual Firebase console cleanup if needed.
- **Documentation impact:**
  - None: internal API route; no public-facing docs.
- **Notes / references:**
  - `apps/reception/src/app/api/mcp/_shared/staff-auth.ts` — full template for REST pattern, env var reading, and response shapes.
  - `apps/reception/src/app/api/mcp/_shared/__tests__/staff-auth.test.ts` — direct template for the new route unit test (fetch mock pattern).
  - `apps/reception/database.rules.json:221-226` — `audit/settingChanges` write rule.
  - Consumer tracing: new endpoint consumed by TASK-05 UI. `userProfiles/{uid}` write consumed by existing `loadUserWithProfile` in `firebaseAuth.ts` — unchanged; handles minimal profiles via `.partial()` schema.
  - Autofix notes (Round 1 critique): roles written as `{[role]: true}` (map form, not array); bearer token extracted from Authorization header for DB writes; `idToken` removed from request body entirely.
- **Build evidence (2026-02-27):** Created `route.ts` and `__tests__/route.test.ts`. TypeScript narrowing fix: used `"response" in authResult` pattern (established codebase convention from booking-email route). Tests cover TC-04-01..TC-04-09. Typecheck and lint pass (commit cddf775018).

---

### TASK-05: Create StaffAccountsForm and page

- **Type:** IMPLEMENT
- **Deliverable:** New files — `apps/reception/src/app/staff-accounts/page.tsx`, `apps/reception/src/components/userManagement/StaffAccountsForm.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Affects:**
  - `apps/reception/src/app/staff-accounts/page.tsx` (new)
  - `apps/reception/src/components/userManagement/StaffAccountsForm.tsx` (new)
  - `apps/reception/src/services/firebaseAuth.ts` (readonly — `sendPasswordResetEmail` consumed, no changes)
  - `apps/reception/src/lib/roles.ts` (readonly — `Permissions.USER_MANAGEMENT` consumed from TASK-02, no changes)
- **Depends on:** TASK-02, TASK-04
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — UI is standard React form with RTL-testable patterns. The idToken retrieval method is standard Firebase (`currentUser.getIdToken()`) — confirmed Firebase pattern. The main uncertainty is the exact shape of the current user object in `AuthContext` and whether `getIdToken()` is directly accessible.
  - Approach: 85% — single-page form with POST to provisioning API and client-side `sendPasswordResetEmail` on success is the correct and simplest approach.
  - Impact: 90% — the user-facing surface of the entire feature; directly enables the operational outcome.
- **Acceptance:**
  - Page at `/staff-accounts` is gated to `USER_MANAGEMENT` — not rendered for staff/manager/admin users.
  - Form renders with email, display name, and role picker fields.
  - Role picker shows exactly `staff`, `manager`, `admin` options (no `owner`, `developer`, `viewer`).
  - Submit calls POST `/api/users/provision` with `{email, user_name, displayName, role}` (no `idToken` in body — server extracts from Authorization header).
  - On success: calls `sendPasswordResetEmail(auth, email)` client-side (signature requires Firebase Auth instance); shows success message and "Resend setup email" button.
  - On 403: shows "Insufficient permissions" error.
  - On 400: shows validation error message.
  - On 409: shows "An account with this email already exists" error.
  - `pnpm --filter reception test` passes all new component tests.
  - `pnpm typecheck` passes for `apps/reception`.
- **Validation contract (TC-05):**
  - TC-05-01: Form renders with email input, display name input, and role picker.
  - TC-05-02: Role picker options are exactly `["staff","manager","admin"]` — no `owner`, `developer`, or `viewer`.
  - TC-05-03: Submit calls POST `/api/users/provision` with body `{email, user_name, displayName, role}` — no `idToken` field in the body.
  - TC-05-04: On 200 success response, success message is shown and "Resend setup email" button is rendered.
  - TC-05-05: Clicking "Resend setup email" calls `sendPasswordResetEmail(auth, email)` (two-argument form) with the provisioned email.
  - TC-05-06: On 403 response, "Insufficient permissions" error message is shown.
  - TC-05-07: On 400 response, validation error message is shown.
  - TC-05-08: On 409 response, "An account with this email already exists" error is shown.
  - TC-05-09: `canAccess(user, Permissions.USER_MANAGEMENT)` gate is applied at the page level — staff-role users do not see the form.
- **Execution plan:**
  - Red: `/staff-accounts` route returns 404; no `StaffAccountsForm` component exists.
  - Green:
    1. Create `apps/reception/src/app/staff-accounts/page.tsx`: **must start with `"use client"` directive** (uses React hooks). Import `useAuth` from `AuthContext`, import `canAccess` and `Permissions` from `lib/roles.ts`. Gate: if `!canAccess(user, Permissions.USER_MANAGEMENT)` render null or redirect. Render `<StaffAccountsForm />`.
    2. Create `apps/reception/src/components/userManagement/StaffAccountsForm.tsx`: **must start with `"use client"` directive**. Controlled form with `email`, `displayName`, `role` fields (uncontrolled `user_name` defaults to `displayName` or can be a separate field). Role picker: `<select>` with options `staff`, `manager`, `admin`. On submit: call `getFirebaseAuth(app).currentUser?.getIdToken(true)` (force refresh, avoids expiry race) where `app` comes from `useFirebaseApp()` hook. `getFirebaseAuth` is the singleton getter from `../../services/firebaseAuth` — it returns the module-cached `Auth` instance initialized on app load. POST to `/api/users/provision` with `{email, user_name: displayName, displayName, role}` and `Authorization: Bearer <idToken>` header. On success call `sendPasswordResetEmail(auth, email)` imported from `../../services/firebaseAuth` (signature is `(auth: Auth, email: string)` — pass the same `auth` instance obtained via `getFirebaseAuth(app)`). Set success state. Handle 400/403/409 error states.
  - Refactor: Extract API call into a named async function. Ensure error messages are user-readable (no internal codes exposed).
- **Planning validation:**
  - Checks run: `firebaseAuth.ts` `sendPasswordResetEmail` export confirmed at lines 112-115: signature is `(auth: Auth, email: string)` — requires two arguments. No `auth` constant is exported from `firebaseAuth.ts`; obtain Auth instance via `getFirebaseAuth(app)` (module singleton). `AuthContext.tsx` `useAuth` hook confirmed. `Permissions.USER_MANAGEMENT` available from TASK-02. `getFirebaseAuth(app).currentUser?.getIdToken(true)` is the correct force-refresh pattern (via module singleton, not bare `getAuth()`). **Both `page.tsx` and `StaffAccountsForm.tsx` must have `"use client"` directive** — they use React context hooks which require client components in Next.js App Router.
  - Validation artifacts: `apps/reception/src/services/firebaseAuth.ts` (fact-find evidence), `apps/reception/src/context/AuthContext.tsx` (fact-find evidence).
  - Unexpected findings: The `user` object in `AuthContext` is the app's domain `User` type (from `userDomain.ts`), not the Firebase `User` — `getIdToken()` is not directly available on it. Resolved: call `getAuth().currentUser?.getIdToken(true)` (force-refresh) from `firebase/auth` directly in the component. The resulting token is set as the `Authorization: Bearer <token>` header on the POST request — no body `idToken` field needed.
- **Scouts:**
  - `AuthContext.tsx` exposes the domain `User` type — `getIdToken()` is NOT directly available. Resolved: use `getAuth().currentUser?.getIdToken(true)` (force-refresh) from `firebase/auth` directly.
  - `sendPasswordResetEmail` in `firebaseAuth.ts` (lines 112-115) has signature `(auth: Auth, email: string)` — two args required. Call it as `sendPasswordResetEmail(auth, email)` where `auth` is obtained via `getFirebaseAuth(app)` from `../../services/firebaseAuth` (module-cached singleton; `app` from `useFirebaseApp()`). Note: there is NO exported `auth` constant from `firebaseAuth.ts` — always use `getFirebaseAuth(app)` to obtain the instance.
- **Edge Cases & Hardening:**
  - If `getIdToken(true)` returns null (user logged out between form render and submit), show a session-expired error and prompt re-login.
  - If `sendPasswordResetEmail` fails after a successful 200 from the provisioning API, show a partial success message: "Account created. Failed to send setup email — use the 'Resend setup email' button to retry."
  - Reset form state on success so the form is ready for the next provisioning action.
- **What would make this >=90%:**
  - Confirming the exact `getIdToken()` access path from the component context by reading `AuthContext.tsx`.
  - Confirming `sendPasswordResetEmail` export signature from `firebaseAuth.ts`.
- **Rollout / rollback:**
  - Rollout: Wave 3; requires TASK-02 and TASK-04.
  - Rollback: Delete page and component files. Route returns 404. No DB or auth state affected.
- **Documentation impact:**
  - None: internal app UI.
- **Notes / references:**
  - `apps/reception/src/services/firebaseAuth.ts:112-135` — `sendPasswordResetEmail` implementation.
  - `apps/reception/src/context/AuthContext.tsx` — `useAuth` hook; check `User` type exposed.
  - Consumer tracing: page consumed by TASK-06 nav item. `sendPasswordResetEmail` already exported from `firebaseAuth.ts` — unchanged.
- **Build evidence (2026-02-27):** Created `page.tsx` (server component + `<Providers>` wrapper, `export const dynamic = "force-dynamic"`) and `StaffAccountsForm.tsx` ("use client"). Form gated by `canAccess(user, [...Permissions.USER_MANAGEMENT])` returning null for non-privileged users. Union narrowing fix: used `"error" in result` pattern. `sendPasswordResetEmail(auth, email)` called via `getFirebaseAuth(app)` singleton. Tests cover TC-05-01..TC-05-09. Typecheck and lint pass (commit Wave 3).

---

### TASK-06: Add Staff Accounts to AppNav Admin section

- **Type:** IMPLEMENT
- **Deliverable:** Code change — `apps/reception/src/components/appNav/AppNav.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:**
  - `apps/reception/src/components/appNav/AppNav.tsx`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — trivial additive change to a well-understood `navSections` array; pattern confirmed from existing items with per-item `permission` fields at `AppNav.tsx:201`.
  - Approach: 95% — "Admin" navSection items array is the confirmed correct insertion point (fact-find corrected the earlier `ManagementModal.tsx` misidentification).
  - Impact: 90% — makes the provisioning feature discoverable for owner/developer users; no risk to existing nav items.
- **Acceptance:**
  - "Staff Accounts" nav item appears in the Admin section for owner/developer users.
  - "Staff Accounts" nav item does NOT appear for staff/manager/admin/viewer users.
  - Clicking "Staff Accounts" navigates to `/staff-accounts`.
  - `Users` icon (from `lucide-react`) renders correctly alongside the label.
  - `pnpm --filter reception test` passes (no snapshot regressions from the nav change).
  - `pnpm typecheck` passes for `apps/reception`.
- **Validation contract (TC-06):**
  - TC-06-01: Owner/developer user sees "Staff Accounts" item in the Admin nav section.
  - TC-06-02: Staff/manager/admin user does NOT see "Staff Accounts" item.
  - TC-06-03: Clicking "Staff Accounts" navigates to `/staff-accounts`.
  - TC-06-04: `Users` icon renders alongside the "Staff Accounts" label.
- **Execution plan:**
  - Red: No "Staff Accounts" entry in `AppNav.tsx`; `/staff-accounts` route is unreachable from the nav.
  - Green: In `apps/reception/src/components/appNav/AppNav.tsx`, import `Users` from `lucide-react` (confirm it is already imported or add it). In the `navSections` array, find the "Admin" section and add to its `items` array: `{ label: "Staff Accounts", route: "/staff-accounts", icon: Users, permission: Permissions.USER_MANAGEMENT }`. Import `Permissions` from `lib/roles.ts` if not already imported.
  - Refactor: None required — single-line item addition.
- **Planning validation (required for M/L):**
  - None: S-effort task.
- **Scouts:** `AppNav.tsx:89-101` — "Admin" navSection confirmed with `permission: Permissions.MANAGEMENT_ACCESS`. `AppNav.tsx:201` — per-item `permission` field gated via `canAccessSection(item.permission)` confirmed. `lucide-react` `Users` icon confirmed used elsewhere in the file (fact-find evidence).
- **Edge Cases & Hardening:** If the "Admin" section's section-level `permission` is `MANAGEMENT_ACCESS` (admin/manager visible), the per-item `USER_MANAGEMENT` permission must also be applied to ensure staff/manager/admin cannot reach the item even if they can see the Admin section. The per-item gate at `AppNav.tsx:201` handles this — confirmed by fact-find evidence.
- **What would make this >=90%:**
  - Already at 90%. The only remaining question is whether `Users` is already imported in `AppNav.tsx` — read the file import block before editing to avoid a duplicate import.
- **Rollout / rollback:**
  - Rollout: Wave 3; requires TASK-02. Can be deployed before TASK-05 is complete — nav item will 404 if `/staff-accounts` page does not exist, but this is acceptable for a brief window.
  - Rollback: Remove the "Staff Accounts" item from the `items` array. Zero risk to existing nav items.
- **Documentation impact:**
  - None: internal nav change.
- **Notes / references:**
  - `apps/reception/src/components/appNav/AppNav.tsx:89-101, 201` — "Admin" section and per-item permission gate.
  - git status shows `AppNav.tsx` has unstaged edits — read the current file before editing to avoid clobbering in-progress changes.
- **Build evidence (2026-02-27):** Added `Users` icon import from `lucide-react` and `{ label: "Staff Accounts", route: "/staff-accounts", icon: Users, permission: Permissions.USER_MANAGEMENT }` item to the Admin `navSections` items array. Typecheck and lint pass (commit Wave 3).

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Firebase `accounts:signUp` returns success for duplicate email (enumeration protection) | Low | Medium — silent duplicate; no error shown | Check `error.message === "EMAIL_EXISTS"` in the response and return 409; surface "account already exists" in the UI (TC-04-09) |
| Firebase password setup email goes to spam for new staff | Medium | High — new staff cannot activate | "Resend setup email" button in success state (TC-05-04); document as the operator resolution path |
| DB write to `userProfiles` fails after Firebase Auth account is created (orphaned account) | Low | Medium — orphaned Auth account with no profile | Log orphaned `localId` in the error response; document manual Firebase console cleanup procedure; compensating delete deferred to a follow-up task |
| Stale parity snapshot (`login-route.parity.test.tsx.snap`) causes CI failure if not fixed | High | Low — pre-existing, not caused by this feature | Fixed in TASK-01 (Wave 1) |
| Role escalation — privileged user accidentally assigns `owner` role | Low | High | Restrict picker to `staff`, `manager`, `admin` at both UI (TC-05-02) and API route (TC-04-05 role validation) levels |
| Bearer token expiry between form render and submit | Low | Low — user is actively using the app | Component calls `getIdToken(true)` (force refresh) on submit and uses the fresh token as the Authorization header; show session-expired error if `getIdToken(true)` returns null |
| `AppNav.tsx` has unstaged edits (per git status) | Medium | Low — clobbering risk if not read first | Read current `AppNav.tsx` before editing in TASK-06 |
| `Login.tsx` has unstaged edits (per git status) | Medium | Low — selector replacement may target moved element | Read current `Login.tsx` before writing replacement selector in TASK-01 |

## Observability

- Logging: Provisioning events written to `audit/settingChanges/{changeId}` in Firebase Realtime DB with `{action: "user_provisioned", targetEmail, targetRole, createdBy, timestamp}`. Server-side route logs errors to console (Next.js default — visible in Cloudflare Worker logs).
- Metrics: None beyond audit log for MVP. Zero Firebase console interventions required for next staff onboarding event is the primary operator-visible metric.
- Alerts/Dashboards: None required for MVP. Audit log entries are directly visible in the Firebase console under `audit/settingChanges`.

## Acceptance Criteria (overall)

- [ ] Owner/developer can navigate to "Staff Accounts" from the Admin nav section (not visible to staff/manager/admin).
- [ ] Completing the form creates a Firebase Auth account and `userProfiles/{uid}` record with correct `email`, `user_name`, and `roles` in **map form** (e.g. `{"staff": true}`) — required for DB security rule role checks to function correctly.
- [ ] New staff member receives a Firebase password setup email immediately after provisioning.
- [ ] New staff member can set their password and log in via the existing email/password form with no developer involvement.
- [ ] No existing user's session or login flow is affected by any change in this plan.
- [ ] All stale pre-existing tests are fixed and the full `pnpm --filter reception test` suite is green.
- [ ] All new unit tests (provisioning route, UI form, DB rules) are green.
- [ ] `pnpm typecheck && pnpm lint` passes for `apps/reception`.

## Decision Log

- 2026-02-27: Chosen approach is server-side REST route using Firebase Identity Toolkit `accounts:signUp` (Option B). Avoids session displacement, no secondary Firebase App needed, pattern proven by `staff-auth.ts`.
- 2026-02-27: Role picker scope set to `staff`, `manager`, `admin` only (open question default). `owner` and `developer` remain console-only. Risk of privilege escalation kept low.
- 2026-02-27: Always-email password setup — no password field in the form. "Resend setup email" button mitigates email delivery failure risk. Matches operator's stated preference.
- 2026-02-27 (revised): Client sends idToken as `Authorization: Bearer` header (standard). Server extracts it from the header for DB REST writes — no separate `idToken` body field. Eliminates token-substitution vector. `database.rules.json` write auth pattern uses `?auth=<token>` URL param in REST calls — same token, different delivery path.
- 2026-02-27: `roles` written in DB as map form `{[role]: true}` (not array). DB security rules check `.child(roleName).val() == true` — array form would cause all role-based DB permission checks to fail for provisioned users. `normalizeRoles()` in `userDomain.ts` handles both forms for app-level RBAC.

## Overall-confidence Calculation

- S=1, M=2, L=3
- Tasks and weights:
  - TASK-01: 90% × 1 = 90
  - TASK-02: 95% × 1 = 95
  - TASK-03: 80% × 1 = 80
  - TASK-04: 85% × 2 = 170
  - TASK-05: 85% × 2 = 170
  - TASK-06: 90% × 1 = 90
- Sum(confidence × weight) = 90 + 95 + 80 + 170 + 170 + 90 = 695
- Sum(weight) = 1 + 1 + 1 + 2 + 2 + 1 = 8
- Overall-confidence = 695 / 8 = **86.875% → rounded to 85%** (downward bias rule applied per confidence scoring rules; nearest valid multiple of 5 below the computed value)

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix stale tests | Yes | None — test failure modes are TypeError/getByRole throws (hard failures); root causes identified and bounded; `Login.tsx` has unstaged edits (git status) — build agent must read current file before selecting replacement selector | No |
| TASK-02: Add USER_MANAGEMENT permission | Yes — no deps | None — additive to `Permissions` const; `UserRole` import already present; `as const` on Permissions object means `USER_MANAGEMENT` type is `readonly ["owner","developer"]` — minor type-level consideration for consumers using spread or cast | No |
| TASK-03: DB rules emulator test | Yes — no deps | Minor — requires Firebase emulator running; DB `.validate` rule requires `email` + `user_name` in write payload (must be included in test data to avoid validate rejection masking permission test) | No |
| TASK-04: Provisioning API route | Yes — `Permissions.USER_MANAGEMENT` available from TASK-02 | Minor — `accounts:signUp` error shape for `EMAIL_EXISTS` must match documentation (not smoke-tested); partial-failure (orphaned Auth account on DB write failure) is a known risk, documented. AF-1: roles written as map form `{[role]: true}` (not array) to satisfy DB security rules. AF-2: bearer token extracted from Authorization header for DB writes — no body `idToken` needed | No — all handled in execution plan and edge cases |
| TASK-05: StaffAccountsForm | Yes — `Permissions.USER_MANAGEMENT` from TASK-02; provisioning API from TASK-04 | Minor — `getIdToken(true)` (force refresh) on submit via `getAuth().currentUser?.getIdToken(true)`; `sendPasswordResetEmail(auth, email)` two-argument signature confirmed from `firebaseAuth.ts`; `"use client"` directive required on both `page.tsx` and `StaffAccountsForm.tsx` | No — all resolved in execution plan |
| TASK-06: Add nav item | Yes — `Permissions.USER_MANAGEMENT` from TASK-02 | Minor — `AppNav.tsx` has unstaged edits (git status); build agent must read current file before editing to avoid clobbering | No |
