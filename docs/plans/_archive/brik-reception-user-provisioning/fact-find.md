---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: brik-reception-user-provisioning
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-reception-user-provisioning/plan.md
Trigger-Why: New reception staff (Serena, Alessandro) have no Firebase Auth accounts and cannot log in at all. Account creation requires manual Firebase console access by a developer. This is a blocking operational dependency that makes onboarding any new staff member dependent on developer intervention.
Trigger-Intended-Outcome: "type: operational | statement: Any privileged user (owner/developer) can create a new staff account from within the reception app, and new accounts unlock with a first-login password-set flow instead of arriving with a pre-set password. | source: operator"
---

# BRIK Reception User Provisioning — Fact-Find Brief

## Scope

### Summary

The reception app currently has no in-app account creation flow. All Firebase Auth accounts must be provisioned manually via the Firebase console, and role assignment requires a developer to write directly to Firebase Realtime DB at `userProfiles/{uid}`. New staff members (Serena and Alessandro) cannot log in because they have no Firebase Auth account at all.

The operator wants: privileged users (owner/developer) can create accounts for new staff from within the app. New accounts have no password on creation; on first login attempt the new staff member is prompted to set a password before they can access the app.

### Goals

- Privileged users can create a new staff account (name, email, role) from within the reception app UI without touching the Firebase console.
- New accounts require the user to set a password on first login. Until a password is set, the account is unusable.
- The provisioning flow writes the `userProfiles/{uid}` record correctly so the new user can authenticate through the existing `loadUserWithProfile` path immediately after they set their password.
- Role assignment defaults to `staff` at creation time, with privileged users able to assign higher roles up to a configurable cap.
- No changes required to the existing login path for existing users.

### Non-goals

- Allowing staff-role users to create accounts (only owner/developer can).
- Email invitation flow with a magic link (Firebase password reset link is sufficient for first-login setup).
- Account deletion or deactivation UI (out of scope for this iteration).
- Changing the Firebase Auth project or switching auth providers.
- Any changes to the existing `sendPasswordResetEmail` / forgot-password flow used by existing users.

### Constraints & Assumptions

- Constraints:
  - Firebase Auth `createUserWithEmailAndPassword` (client SDK) creates the account and immediately signs in as the new user — displacing the currently-logged-in privileged user. Must be worked around.
  - Firebase Identity Toolkit REST API (`accounts:signUp`) can create accounts server-side without touching client auth state, using only `NEXT_PUBLIC_FIREBASE_API_KEY` — same key and pattern already used in `staff-auth.ts`.
  - No Firebase Admin SDK is in use anywhere in the reception app today. Adding a server-side API route is the correct architectural approach.
  - DB write to `userProfiles/{uid}` by another user requires the caller to have `owner` or `developer` role (enforced by `database.rules.json:8`).
  - `userProfiles` DB `.validate` requires `email` and `user_name` to be present in any new record.
- Assumptions:
  - Firebase project allows `accounts:signUp` via public API key (same as `accounts:lookup` — no known reason to expect otherwise).
  - `sendPasswordResetEmail` works for a newly-created account with a randomly-generated throwaway password — confirmed Firebase standard pattern.
  - Firebase email delivery is configured for the project (at minimum, default Firebase email sending enabled).
  - The `NEXT_PUBLIC_FIREBASE_API_KEY` and `NEXT_PUBLIC_FIREBASE_DATABASE_URL` env vars are already available server-side (confirmed in existing route handlers and `.env.local`).

## Outcome Contract

- **Why:** New reception staff (Serena, Alessandro) have no Firebase Auth accounts and cannot log in. Manual Firebase console provisioning is the only current path — requiring developer access for every new staff onboarding. Demonstrated directly in session on 2026-02-27.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A privileged user (owner or developer role) can create a new staff account in the reception app UI; the new staff member receives an email to set their password, and once set, logs in through the existing email/password flow with no developer involvement at any step.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/Login.tsx` — sole login UI. Four screens: email/password, forgot-password, PIN setup, PIN unlock. No account creation entry point.
- `apps/reception/src/App.tsx` — auth gate: renders `<Login>` when `user` is null, `<AuthenticatedApp>` when authenticated.
- `apps/reception/src/app/api/mcp/_shared/staff-auth.ts` — only server-side auth code; uses Firebase Identity Toolkit REST API directly. Template for the new provisioning route.

### Key Modules / Files

1. `apps/reception/src/services/firebaseAuth.ts` — all Firebase Auth operations: `loginWithEmailPassword`, `sendPasswordResetEmail`, `loadUserWithProfile`, `subscribeToAuthState`. `createUserWithEmailAndPassword` is NOT imported — absent from the entire codebase.
2. `apps/reception/src/context/AuthContext.tsx` — `AuthProvider` and `useAuth` hook. Exposes `login`, `logout`, `reauthenticate`. No `createUser` or `inviteUser` surface.
3. `apps/reception/src/components/Login.tsx` — Login UI with four screens. "Forgot password?" triggers `sendPasswordResetEmail`. No sign-up screen.
4. `apps/reception/src/app/api/mcp/_shared/staff-auth.ts` — server-side: reads `NEXT_PUBLIC_FIREBASE_API_KEY`, calls `identitytoolkit.googleapis.com/v1/accounts:lookup`. This is the direct template for a `accounts:signUp` provisioning route.
5. `apps/reception/database.rules.json` — `userProfiles/$uid` write rule: self-write restricted to `staff`-only roles; owner/developer can write any profile with any roles.
6. `apps/reception/src/types/domains/userDomain.ts` — `UserRole` enum: `admin | manager | staff | viewer | owner | developer`. `userProfileSchema` requires `email` and `user_name`.
7. `apps/reception/src/lib/roles.ts` — `Permissions.MANAGEMENT_ACCESS = ["owner","developer","admin","manager"]`. No `USER_MANAGEMENT` permission constant yet — needs adding as `["owner","developer"]`.
8. `apps/reception/src/services/managerReauth.ts` — secondary Firebase app pattern with `inMemoryPersistence`. Confirms this architectural pattern exists and is in production use. Not needed for the REST-based approach, but confirms the codebase is familiar with it.
9. `apps/reception/src/components/appNav/AppNav.tsx` — sidebar nav. `navSections` array (line ~79) has a "Management" section (no permission gate — all authenticated users) and an "Admin" section (`permission: Permissions.MANAGEMENT_ACCESS`). Items within a section can also carry per-item `permission` fields (`AppNav.tsx:201`). The new "Staff Accounts" item belongs in the "Admin" section with `permission: Permissions.USER_MANAGEMENT`. Role check is applied in `canAccessSection()` at line 129 using `canAccess(user, permission)`.
10. `apps/reception/src/App.tsx` — `loadUserWithProfile` called by `subscribeToAuthState`; reads `userProfiles/{uid}` on login. No changes needed if provisioned profile matches `userProfileSchema`.

Note: `apps/reception/src/components/appNav/ManagementModal.tsx` is a **modal** (rendered via `AppModals.tsx` when `activeModal === "management"`), not a nav insertion point. The nav sidebar is `AppNav.tsx`. These are separate surfaces.

### Patterns & Conventions Observed

- **Firebase client SDK only (no Admin SDK)** — evidence: `apps/reception/src/services/firebaseAuth.ts` imports only from `firebase/auth` and `firebase/database`. No `firebase-admin` anywhere in reception.
- **Identity Toolkit REST API pattern** — `staff-auth.ts` calls `identitytoolkit.googleapis.com/v1/accounts:lookup` with the public API key. The `accounts:signUp` endpoint uses the exact same pattern.
- **Server-side route handler pattern** — MCP handlers live in `apps/reception/src/app/api/mcp/`. The provisioning endpoint follows this structure with `requireStaffAuth` gating at privileged roles.
- **Role check via `canAccess(user, Permissions.X)`** — used in `AppNav.tsx:129` and `AppNav.tsx:201` to gate sections and individual items. New `USER_MANAGEMENT` permission follows the same pattern. Items in the "Admin" navSection can have their own `permission` field — confirmed by `AppNav.tsx:201`.
- **`sendPasswordResetEmail` already in production** — `apps/reception/src/services/firebaseAuth.ts:112-135`. Used on the "Forgot password?" screen today. Re-used for first-login password setup.
- **Audit log write requires caller idToken** — `audit/settingChanges` write rule (`database.rules.json:221-226`) permits owner/developer/admin/manager. The server-side provisioning route receives the caller's Firebase idToken from the client request (same as the `userProfiles` DB write) and must use that idToken for the audit write too. If the audit write omits auth, the DB rule rejects it silently.

### Data & Contracts

- Types/schemas/events:
  - `UserRole` — `z.enum(["admin","manager","staff","viewer","owner","developer"])` — `userDomain.ts:5`
  - `userProfileSchema` — `{ uid, email, user_name, displayName?, roles? }` — `userDomain.ts:16`. DB rule `.validate` enforces `email` + `user_name` present.
  - `LoginResult` — `{ success, user?, error? }` — `firebaseAuth.ts:59`. No `CreateUserResult` type exists — must add.
- Persistence:
  - Firebase Auth — account identity store. Create via `POST identitytoolkit.googleapis.com/v1/accounts:signUp?key={apiKey}`. Response: `{ localId, email, idToken, ... }`.
  - Firebase Realtime DB — `userProfiles/{uid}` — role and display name store. Authenticated write via DB REST endpoint using caller's idToken.
- API/contracts:
  - `accounts:signUp` — `POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={apiKey}` — body: `{ email, password, returnSecureToken: true }`. Create with randomly-generated throwaway password; immediately send password reset email.
  - `accounts:lookup` — already used in `staff-auth.ts:75-93` — confirmed REST pattern.
  - Firebase DB REST write — `PUT https://{databaseURL}/userProfiles/{localId}.json?auth={callerIdToken}` — authenticated with the privileged user's idToken (passed from client to server route).

### Dependency & Impact Map

- Upstream dependencies:
  - Firebase Auth project — must allow email/password sign-in (confirmed: used today).
  - `NEXT_PUBLIC_FIREBASE_API_KEY` — already present and available server-side.
  - `NEXT_PUBLIC_FIREBASE_DATABASE_URL` — already present and available server-side.
  - DB security rules — no changes needed; existing owner/developer write rule already permits any `userProfiles` write.
- Downstream dependents:
  - `loadUserWithProfile` in `firebaseAuth.ts` — reads `userProfiles/{uid}` on login. No changes needed if provisioned profile has `email` + `user_name`.
  - `requireStaffAuth` in `staff-auth.ts` — reads `userProfiles/{uid}` for role check; no changes needed.
  - All role-gated UI (`ManModal.tsx`, `canAccess()`) — unaffected.
- Likely blast radius:
  - New files: 1 API route handler (`/api/users/provision/route.ts`), 1 UI component (`StaffAccountsModal.tsx`), 1 page (`/staff-accounts/page.tsx`), 1 unit test for the route.
  - Modified files: `lib/roles.ts` (add `USER_MANAGEMENT`), `appNav/AppNav.tsx` (add Staff Accounts item to Admin navSection), optionally `firebaseAuth.ts` (add `sendPasswordSetupEmail` alias). No changes to `database.rules.json`.
  - Risk of breaking existing auth: **low** — entirely additive, no existing flow modified.

### Delivery & Channel Landscape

- Audience/recipient: Reception app privileged users (owner/developer roles) — currently Pete and Cristiana. New staff members receive a Firebase-sent password setup email.
- Channel constraints: Firebase sends the password setup email through its default email template. Custom templates are a Firebase console config — out of scope.
- Existing templates/assets: Firebase default password reset email.
- Approvals/owners: Peter Cowling (operator).
- Compliance constraints: Firebase Auth password reset email is explicitly requested by account action. No additional consent required for an internal staff app.
- Measurement hooks: Log provisioning events to `audit/settingChanges` in the DB: `{ action: "user_provisioned", targetEmail, targetRole, createdBy: uid, timestamp }`.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + `@testing-library/react` (unit/component), `@firebase/rules-unit-testing` (DB rules emulator)
- Commands: `pnpm --filter reception test` (unit); DB rules require `FIREBASE_DATABASE_EMULATOR_HOST` + running emulator
- CI integration: `reusable-app.yml`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Login UI | Snapshot + interaction | `src/parity/__tests__/login-route.parity.test.tsx` | Covers email form, forgot-password — no account creation |
| firebaseAuth service | Unit | `src/services/__tests__/firebaseAuth.test.ts` | `loadUserWithProfile`, `sendPasswordResetEmail` (mocked not exercised) |
| AuthContext | Unit | `src/context/__tests__/AuthContext.test.tsx` | Tests `useAuth` guard; `setUser` call is now a deprecated no-op — stale |
| DB rules | Integration (emulator) | `src/rules/__tests__/databaseRules.test.ts` | Covers staff/manager read-write; no test for owner writing non-staff roles to userProfiles |
| staff-auth (MCP) | Unit | `src/app/api/mcp/_shared/__tests__/staff-auth.test.ts` | Bearer token, role check — good coverage; direct template for new route test |

#### Coverage Gaps

- Untested paths:
  - `userProfiles/{uid}` write by owner/developer with `manager`/`admin` roles (DB rules test gap).
  - Account creation via `accounts:signUp` REST endpoint — no test exists.
  - `sendPasswordResetEmail` called for a newly-created account.
  - New provisioning API route handler (to be created).
  - New staff accounts UI component (to be created).
- Extinct tests:
  - `AuthContext.test.tsx:29-40` — test "returns updated user when setUser is called" calls `result.current.setUser(user)` on the return value of `useAuth()`. `AuthContextValue` does NOT include `setUser` (that is on `useLegacyAuth()`). This causes a **TypeError at runtime** — the test throws before reaching the `expect` assertion. Not a silent no-op; a hard runtime error. Fix: replace this test with one that exercises the real `useAuth()` interface (login/logout/user state).
  - `login-route.parity.test.tsx:48` — calls `screen.getByRole("heading", { name: /sign in to reception/i })`. The current `Login.tsx` has no matching heading. `getByRole` **throws before `toMatchSnapshot()` is reached** (line 53). Fix requires replacing the selector AND refreshing the snapshot — not just a snapshot refresh.

#### Testability Assessment

- Easy to test:
  - New provisioning API route — fetch mocks (same as `staff-auth.test.ts` pattern).
  - DB rules test for owner writing non-staff `userProfiles` — straightforward new test case.
  - UI form validation — React Testing Library.
  - `sendPasswordResetEmail` re-use — already mocked in service test.
- Hard to test:
  - End-to-end Firebase email delivery — requires real Firebase project or SMTP emulator.
  - Verifying the throwaway password is not guessable — by design not testable.
- Test seams needed:
  - Inject `fetch` mock in new provisioning route test (same seam as `staff-auth.test.ts`).
  - Firebase Auth state mock for UI component test.

#### Recommended Test Approach

- Unit tests for: new provisioning API route; `createProvisionedAccount` service helper; DB rules — owner writes `userProfiles` with `manager` role.
- Integration tests for: Firebase emulator full-flow (optional, deferred — not required for MVP).
- E2E tests for: manual verification on staging sufficient for MVP.
- Snapshot update: `login-route.parity.test.tsx.snap` — must update to match current `Login.tsx` output (pre-existing stale snapshot, must fix in this build).
- Stale test fix: `AuthContext.test.tsx` — replace `setUser` test with real auth state subscription mock.

### Recent Git History (Targeted)

- `1499cffeb7` — unstaged edits include `Login.tsx`, `ManModal.tsx`, `TillModal.tsx` — in-progress changes (from current git status)
- `8621ef9bdb` — last significant DB rules change (bookingMeta rule added); confirms rules are actively maintained
- No recent commit touches `firebaseAuth.ts` account creation surface — confirms `createUserWithEmailAndPassword` is genuinely absent

## Questions

### Resolved

- Q: Can owner/developer write a `userProfiles/{uid}` record with `manager` or `admin` roles via the existing DB rules?
  - A: Yes. The owner/developer write path at `userProfiles/$uid.write` has no restriction on what roles can be set in the new data. Only the self-write path is restricted to `staff`-only roles.
  - Evidence: `apps/reception/database.rules.json:8`

- Q: Does `sendPasswordResetEmail` work for a newly-created account with a randomly-generated password?
  - A: Yes. Firebase's password reset flow is independent of the current password. Standard Firebase pattern for admin-provisioned accounts. The "reset" email is functionally the first-time password setup link.
  - Evidence: `apps/reception/src/services/firebaseAuth.ts:112-135`

- Q: Does creating an account with the client SDK displace the current session?
  - A: Yes. `createUserWithEmailAndPassword` signs in as the new user immediately. The correct solution is the server-side `accounts:signUp` REST endpoint, which creates the account without touching any client auth state.
  - Evidence: `apps/reception/src/services/managerReauth.ts:23-29` (confirms awareness of session-displacement risk), `apps/reception/src/app/api/mcp/_shared/staff-auth.ts:75-93` (confirms REST pattern)

- Q: Is the `accounts:signUp` REST endpoint available without a service account key?
  - A: Yes. Same as `accounts:lookup` used in `staff-auth.ts` — requires only `NEXT_PUBLIC_FIREBASE_API_KEY`. No service account needed.
  - Evidence: `apps/reception/src/app/api/mcp/_shared/staff-auth.ts:75-93`

- Q: Where is the UI hook point for "manage staff"?
  - A: `apps/reception/src/components/appNav/AppNav.tsx` — the sidebar nav. The "Admin" section (line 89) has `permission: Permissions.MANAGEMENT_ACCESS` and its items can carry per-item `permission` fields, gated via `canAccessSection(item.permission)` at `AppNav.tsx:201`. Adding `{ label: "Staff Accounts", route: "/staff-accounts", icon: Users, permission: Permissions.USER_MANAGEMENT }` to the "Admin" section's `items` array is the correct insertion point.
  - Evidence: `apps/reception/src/components/appNav/AppNav.tsx:89-101, 201`
  - Note: `ManagementModal.tsx` is a separate modal surface (rendered by `AppModals.tsx`) — not a nav insertion point.

- Q: Does `loadUserWithProfile` need changes for newly-provisioned profiles?
  - A: No. It reads `userProfiles/{uid}` via `userProfileSnapshotSchema.partial()` — a minimal profile with only `email` + `user_name` (required by DB validate rule) will parse correctly. The `resolveUserName` fallback chain ensures a usable display name.
  - Evidence: `apps/reception/src/services/firebaseAuth.ts:23-49, 137-188`

- Q: Should `viewer` role be included in the provisioning role picker?
  - A: No. `viewer` is defined in `UserRoleSchema` but functionally unused — absent from all `Permissions` groups, blocked from MCP API access, not checked in any DB rule. Omit from the UI picker. Expose: `staff`, `manager`, `admin` (and `owner`/`developer` only if operator confirms Open Q1 wants to allow it).
  - Evidence: `apps/reception/src/app/api/mcp/_shared/staff-auth.ts:23-29`, `apps/reception/src/lib/roles.ts:49-87`

### Open (Operator Input Required)

- Q: Which roles should be assignable through the provisioning UI?
  - Why operator input is required: This is a business policy decision about privilege escalation risk, not a technical question. All six roles are technically writable by owner/developer via DB rules.
  - Decision impacted: The role selector options shown in the Staff Accounts form.
  - Decision owner: Peter Cowling
  - Default assumption (if any) + risk: Default — expose `staff`, `manager`, `admin` only. `owner` and `developer` remain manually-assignable via Firebase CLI/console only. Risk: low — escalation to super-admin roles stays gated to developer access as it is today.

- Q: Should the provisioning flow always send a password setup email (user sets their own password), or should the privileged user be able to set the password directly?
  - Why operator input is required: Security and UX policy choice. "Always email" is simpler and more secure (privileged user never knows the new staff member's password). "Set directly" requires secure out-of-band password sharing.
  - Decision impacted: Whether the provisioning form includes a password field.
  - Decision owner: Peter Cowling
  - Default assumption (if any) + risk: Default — always send email, no password field in the form. Matches operator's stated idea ("first time they attempt to log in, they can do so by creating a password"). Risk: if Firebase email delivery fails or goes to spam, the new staff member cannot activate without operator re-sending the email — add a "Resend setup email" action to mitigate.

## Confidence Inputs

- **Implementation: 88%**
  - Evidence basis: Firebase REST `accounts:signUp` pattern confirmed via `staff-auth.ts`. DB rules for owner/developer writes verified. No Admin SDK needed. Secondary-app pattern confirmed in production (not needed for this approach, but shows codebase maturity). Stale tests need correction — bounded scope.
  - What would raise to >=90: Smoke test confirming `accounts:signUp` works against the live Firebase project; operator confirmation of Open Q1 and Q2 (both have safe defaults).

- **Approach: 85%**
  - Evidence basis: Two viable paths identified; server-side REST route is clearly superior (no session displacement, no secondary-app complexity). Pattern is proven by `staff-auth.ts`. Choice between paths is resolved.
  - What would raise to >=90: Operator confirming role policy and password flow preference.

- **Impact: 90%**
  - Evidence basis: Two named staff members (Serena, Alessandro) have zero access today — directly blocking operational use. The feature does not change any existing login path.
  - What would raise to >=90: Already there. Direct operator confirmation of the blocking problem in session.

- **Delivery-Readiness: 80%**
  - Evidence basis: All required patterns exist. No new infrastructure needed. Two open questions have safe defaults. Two pre-existing stale tests must be corrected in this build.
  - What would raise to >=90: Stale snapshot fix confirmed running, open questions answered.

- **Testability: 82%**
  - Evidence basis: New API route is fully unit-testable via fetch mocks (identical pattern to `staff-auth.test.ts`). DB rules emulator test for owner writes is straightforward. UI form testable with RTL. E2E email delivery is not unit-testable but acceptable to defer.
  - What would raise to >=90: DB rules emulator confirmed running locally.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Firebase `accounts:signUp` returns success for duplicate email (enumeration protection) | Low | Medium — silent duplicate; no error shown | Check if `localId` from `accounts:signUp` already has a `userProfiles` entry before writing; surface "account already exists" error in UI |
| Firebase password setup email goes to spam for new staff | Medium | High — new staff cannot activate | Add "Resend setup email" action to Staff Accounts UI; document this as the resolution path |
| DB write to `userProfiles` fails after Firebase Auth account created (partial failure / orphaned account) | Low | Medium — orphaned Auth account with no profile | Implement compensating delete of Auth account on DB write failure, or document cleanup procedure |
| Stale parity snapshot (`login-route.parity.test.tsx.snap`) causes CI failure on next run | High | Low — pre-existing, not caused by this feature | Fix snapshot in the same build (Step 6 in scope simulation) |
| Role escalation — privileged user accidentally assigns `owner` role | Low (if default role picker used) | High | Restrict picker to `staff`, `manager`, `admin` by default (Open Q1 default) |

## Planning Constraints & Notes

- Must-follow patterns:
  - **Security gate is two steps**: (1) `requireStaffAuth` validates the bearer token and returns a verified Firebase user; (2) a subsequent check that the verified user's role is in `["owner","developer"]` (i.e. `canAccess(user, Permissions.USER_MANAGEMENT)`). `requireStaffAuth` alone passes any `STAFF_ROLES` user (`staff`, `manager`, `admin`, `owner`, `developer`) — insufficient for the provisioning endpoint. Both steps are required.
  - Firebase REST API for account creation (not client SDK) — avoids session displacement, mirrors `staff-auth.ts:75-93`. The client sends its idToken in the request; the server uses that idToken for both the `userProfiles` DB write and the `audit/settingChanges` write.
  - `userProfiles` write must include `email` and `user_name` (DB rule `.validate` enforces these).
  - Nav insertion point: add item with `permission: Permissions.USER_MANAGEMENT` to the "Admin" section's `items` array in `AppNav.tsx:navSections` — NOT to `ManagementModal.tsx` (that is a separate modal surface).
  - No changes to `database.rules.json` required.
- Rollout/rollback expectations:
  - Entirely additive. No existing flow is modified. Rollback = remove the new route and nav item. Provisioned Firebase Auth accounts and `userProfiles` entries persist — manual Firebase console cleanup if needed.
- Observability expectations:
  - Log provisioning events to `audit/settingChanges` in the DB: `{ action: "user_provisioned", targetEmail, targetRole, createdBy: uid, timestamp }`.

## Suggested Task Seeds (Non-binding)

1. Fix stale tests: replace `getByRole` selector + refresh snapshot in `login-route.parity.test.tsx`; replace TypeError-causing `setUser` call in `AuthContext.test.tsx` with test exercising real `login`/`logout` interface.
2. Add `USER_MANAGEMENT` permission (`["owner","developer"]`) to `lib/roles.ts`.
3. Add DB rules test: owner writes `userProfiles` with `manager` role (using emulator).
4. Create provisioning API route at `apps/reception/src/app/api/users/provision/route.ts`: `requireStaffAuth` + `USER_MANAGEMENT` role check → `accounts:signUp` REST → DB REST write of `userProfiles` (caller idToken) → audit write to `settingChanges` (same idToken) → return `{ uid, email }`.
5. Create `StaffAccountsForm` component and `/staff-accounts` page: form (email, display name, role picker — staff/manager/admin), calls provisioning API, client-side `sendPasswordResetEmail` on success, "Resend setup email" affordance.
6. Add "Staff Accounts" to "Admin" navSection items array in `AppNav.tsx` with `permission: Permissions.USER_MANAGEMENT`.
7. Manual smoke test on staging: create account, receive email, set password, log in.
8. **Non-goal (explicitly scoped out):** `getPrimaryRole` in `lib/roles.ts` skips `admin` and `manager` (returns null for those roles). This function is NOT called in the provisioning flow or in `canAccess()` — it is used only for display logic (e.g. showing a user's primary role label in the UI). It does not affect auth, role-gating, or DB rules. No fix required for this feature; add to technical-debt backlog separately.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - Owner/developer can navigate to Staff Accounts from the management nav (gated, not visible to staff/admin).
  - Completing the form creates a Firebase Auth account and `userProfiles` record with correct email, user_name, and role.
  - New staff member receives a Firebase password setup email.
  - New staff member can set their password and log in via the existing email/password form.
  - No existing user's session or login flow is affected.
  - All stale tests fixed; new unit tests green; `pnpm typecheck && pnpm lint` passes.
- Post-delivery measurement plan:
  - Serena and Alessandro can log in without developer intervention — verified by operator.
  - Zero Firebase console interventions required for next staff onboarding event.

## Evidence Gap Review

### Gaps Addressed

1. **All entry points read** — `Login.tsx`, `App.tsx`, `firebaseAuth.ts`, `staff-auth.ts`, `AuthContext.tsx`, `AppNav.tsx`, `managerReauth.ts`, `lib/roles.ts`, `database.rules.json`, `userDomain.ts`. Initial round cited `ManagementModal.tsx` as the nav insertion point — corrected to `AppNav.tsx` Admin navSection after verifying role-gate location. Every claim is traced to a specific file after corrections.
2. **Security boundary fully analyzed** — DB rules verified to permit owner/developer writes with any roles; self-write restriction to `staff` confirmed. No `database.rules.json` changes needed.
3. **Session displacement risk identified and resolved** — REST route approach eliminates the risk entirely. No secondary-app workaround needed.
4. **Test landscape fully read** — stale tests identified and scoped for correction. New test requirements specified per task seed.
5. **Business impact is direct and measurable** — two named staff members cannot log in today.

### Confidence Adjustments

- Implementation dropped from potential 95% to 88%: stale tests must be corrected; Firebase email delivery not smoke-tested against this project.
- Testability at 82% (not higher): DB rules emulator setup not confirmed running locally.

### Remaining Assumptions

- Firebase project allows `accounts:signUp` via public API key (consistent with `accounts:lookup` usage — no reason to expect otherwise, but not smoke-tested).
- Firebase email delivery is configured and not rate-limited for the project's domain.
- Operator confirms default assumptions for Open Q1 (role picker: staff/manager/admin) and Open Q2 (always-email, no password field).

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Login UI / auth entry point | Yes | None | No |
| Firebase Auth service (`firebaseAuth.ts`) | Yes | `createUserWithEmailAndPassword` absent — confirmed gap, not oversight | No |
| Server-side auth pattern (`staff-auth.ts`) | Yes | None — REST pattern confirmed as template for new route | No |
| DB security rules for `userProfiles` write | Yes | None — owner/developer write with any roles already permitted | No |
| `loadUserWithProfile` downstream behavior | Yes | None — `.partial()` schema handles minimal profiles | No |
| Role permission constants (`lib/roles.ts`) | Yes | `USER_MANAGEMENT` permission missing — needs adding | No (scoped as new task) |
| Management nav hook point (`AppNav.tsx`) | Yes | Initial claim cited `ManagementModal.tsx:11-16` — corrected. Actual insertion point is `AppNav.tsx` "Admin" navSection items array with per-item `permission` field. `ManagementModal.tsx` is a separate modal surface. | No (scoped as corrected task seed 5) |
| Existing test coverage + stale tests | Yes | Two stale tests: `AuthContext.test.tsx:29-40` (TypeError, not a no-op) and `login-route.parity.test.tsx:48` (`getByRole` throws before snapshot) — pre-existing, must fix in build | No (scoped as task seed 1) |
| DB rules test for owner writes non-staff roles | Partial | No test case exists — gap confirmed | No (scoped as task seed 3) |
| Firebase email delivery behavior | No | Not investigated: requires live Firebase smoke test | No (acceptable to defer; documented as remaining assumption) |

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None — two open questions have safe defaults that allow planning to proceed.
- Recommended next step: `/lp-do-plan`
