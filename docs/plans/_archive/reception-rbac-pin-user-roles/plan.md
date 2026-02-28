---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Build-completed: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-rbac-pin-user-roles
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception RBAC — PIN User Roles Data Fix

## Summary

The Zod schema that parses `NEXT_PUBLIC_USERS_JSON` (`userSchema` in `userDomain.ts`) only
declares `email` and `user_name`, silently stripping `roles` from any entry that includes
them. The live env value also has no `roles` on any user. These two problems must be fixed
together: the schema extended, the env value populated. `getUserByPin` is currently unwired
from the runtime auth flow (device PIN quick-unlock uses Firebase session directly), so this
fix is forward-looking hardening — but it is required for the RBAC migration to be
consistent and for a future shift-PIN path to work without silent role loss. A deprecation
note will be added to `getUserByPin.ts` to clarify its unwired state.

## Active tasks

- [x] TASK-01: Extend `userSchema` to include optional `roles` field — Complete (2026-02-27)
- [x] TASK-02: Update `NEXT_PUBLIC_USERS_JSON` in `.env.local` with roles for all five users — Complete (2026-02-27)
- [x] TASK-03: Document `NEXT_PUBLIC_USERS_JSON` in `.env.example` — Complete (2026-02-27)
- [x] TASK-04: Add `@deprecated` JSDoc to `getUserByPin.ts` — Complete (2026-02-27)

## Goals

- Ensure `usersRecordSchema.parse()` passes `roles` through rather than stripping them.
- Populate correct roles for all five PIN users in `.env.local`.
- Document the env variable format for developers cloning the repo.
- Clarify `getUserByPin.ts` status so future engineers are not confused.

## Non-goals

- Wiring `getUserByPin` into `AuthContext` or `Login.tsx` (separate decision, separate plan).
- Changing Firebase user profile roles (separate operational action).
- Modifying any permission checks in components (completed in prior RBAC migration plan).

## Constraints & Assumptions

- Constraints:
  - `.env.local` is gitignored and must never be committed. TASK-02 is a local-only change.
  - `.env.example` IS committed — TASK-03 changes must not contain real secrets.
  - `getUserByPin` has 0 production callers. Deprecation only; no behaviour change.
- Assumptions:
  - Dom (343434) role: `["staff"]` — shares email with Serena (possible family member
    sharing an account) but has no evidence of elevated access in any historical allowlist
    or permission group. Conservative default is staff. **Resolved by DECISION self-resolve
    gate** (no evidence of owner/manager privileges in any prior or current code).
  - Cristiana (333333) role: `["admin"]` — the prior RBAC migration plan (reception-rbac-
    migration-code) explicitly set the inactivity logout exemption to `hasRole(user, "admin")`
    because Cristiana (the only named non-owner exemption) is the admin user. **Resolved by
    DECISION self-resolve gate** from prior plan evidence.

## Inherited Outcome Contract

- **Why:** RBAC migration lands correctly only if every user object carries a populated
  `roles` array; silently missing roles cause `canAccess()` to return `false` for all gated
  features, locking that user out.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `usersRecordSchema` passes `roles` through; `.env.local`
  has roles populated for all five PIN users; schema confirmed by test.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/reception-rbac-pin-user-roles/fact-find.md`
- Key findings used:
  - `userSchema` at `userDomain.ts:65` missing `roles` — confirmed by direct read.
  - `userRolesSchema` already defined at `userDomain.ts:9-14` — can be reused directly.
  - `getUserByPin` has 0 callers outside tests (grep confirmed).
  - Live env value at `.env.local:17` — five users, no roles.
  - `.env.example` — `NEXT_PUBLIC_USERS_JSON` absent.
  - Test `getUserByPin.test.ts` references `VITE_USERS_JSON` variable name in setup —
    may require `jest.isolateModules()` when adding new roles test case.

## Proposed Approach

- Option A: Extend `userSchema` with `roles: userRolesSchema` (optional); update env; deprecate.
- Option B: Remove `getUserByPin` entirely and skip env fix (roles come from Firebase only).
- Chosen approach: **Option A.** Removing `getUserByPin` now would destroy the shift-PIN
  pattern (useful for staff-without-Firebase-accounts scenario). The schema fix is
  trivially safe; the env update hardens the data regardless of whether the function is
  wired. Option B trades a 5-minute fix for a hard architectural decision.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extend `userSchema` to include optional `roles` field | 85% | S | Complete (2026-02-27) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Update `.env.local` NEXT_PUBLIC_USERS_JSON with roles | 85% | S | Complete (2026-02-27) | TASK-01 | - |
| TASK-03 | IMPLEMENT | Document `NEXT_PUBLIC_USERS_JSON` in `.env.example` | 90% | S | Complete (2026-02-27) | - | - |
| TASK-04 | IMPLEMENT | Add `@deprecated` JSDoc to `getUserByPin.ts` | 85% | S | Complete (2026-02-27) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03, TASK-04 | — | Independent files; run in parallel |
| 2 | TASK-02 | TASK-01 | Env update after schema confirmed |

## Tasks

---

### TASK-01: Extend `userSchema` to include optional `roles` field

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/types/domains/userDomain.ts`,
  `apps/reception/src/utils/__tests__/getUserByPin.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** Wave-1 commit f5aedc73c5. `userSchema` now includes `roles: userRolesSchema`. Test harness rewritten (replaced broken `import.meta.env`/`VITE_USERS_JSON` with `jest.isolateModules` + `process.env.NEXT_PUBLIC_USERS_JSON`). 5/5 tests pass (3 original + 2 new roles round-trip). Typecheck clean. Controlled scope expansion: `loadUtil` harness in test file fixed (necessary to make suite loadable — pre-existing breakage). Linter added `as unknown as Record<string, User>` cast in getUserByPin.ts (resolved inferred type vs User type mismatch; no semantic change).
- **Affects:**
  - `apps/reception/src/types/domains/userDomain.ts`
  - `apps/reception/src/utils/__tests__/getUserByPin.test.ts`
  - `[readonly] apps/reception/src/utils/getUserByPin.ts` (schema consumer; no change)
- **Depends on:** —
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 92% — `userRolesSchema` is a module-level const in the same file as
    `userSchema`; it is in scope without needing to be exported. One-line schema extension.
  - Approach: 88% — new test must use the schema direct-import path (see Execution plan).
  - Impact: 85% — `getUserByPin` is currently unwired so roles fix is forward-looking;
    no existing component changes needed.
- **Acceptance:**
  - `userSchema` includes `roles: userRolesSchema` (the union schema from line 9–14).
  - `usersRecordSchema` (derived via `z.record(userSchema)`) passes roles through parse.
  - All three existing `getUserByPin.test.ts` tests continue to pass.
  - New test: `usersRecordSchema.parse({ "123": { email: "a@b.com", user_name: "X", roles: ["owner"] } })` → `.["123"].roles` equals `["owner"]`.
- **Validation contract:**
  - TC-01: Entry with `roles: ["owner"]` → `usersRecordSchema.parse()` → roles survive. Tested via schema direct-import (see Execution plan step 3).
  - TC-02: Entry with no `roles` field → parse succeeds; result has `roles: undefined`. Tested via schema direct-import.
  - TC-03: Existing `getUserByPin.test.ts` tests pass. Note: the existing test harness sets `import.meta.env.VITE_USERS_JSON` (confirmed), not `process.env.NEXT_PUBLIC_USERS_JSON` (which the production module reads). All three existing tests therefore exercise an empty user object and pass vacuously — they are not diagnostic of schema correctness. TC-03 passing is a necessary but not sufficient signal; TC-01 and TC-02 via schema direct-import are the authoritative checks.
- **Execution plan:**
  1. Open `userDomain.ts`. At line 65, extend `userSchema` to add `roles: userRolesSchema`
     — `userRolesSchema` is a module-level const in the same file (lines 9–14); it is in
     scope without exporting.
  2. Run the governed test runner to confirm all three existing tests pass.
  3. Add a new test in `getUserByPin.test.ts` that directly imports `usersRecordSchema`
     from `../types/domains/userDomain` and calls `.parse()` on a plain object — no env
     var, no module reload. **Do NOT extend the `loadUtil` harness or set `VITE_USERS_JSON`
     for this test.** The existing harness injects into `VITE_USERS_JSON`, which the
     production module never reads (`getUserByPin.ts` reads `NEXT_PUBLIC_USERS_JSON`);
     any test using that harness is vacuous and will not validate the schema fix.
     Required test structure:
     ```ts
     import { usersRecordSchema } from "../../types/domains/userDomain";
     describe("usersRecordSchema roles round-trip", () => {
       it("passes roles through parse", () => {
         const result = usersRecordSchema.parse({
           "123": { email: "a@b.com", user_name: "X", roles: ["owner"] },
         });
         expect(result["123"].roles).toEqual(["owner"]);
       });
       it("parses entry with no roles without error", () => {
         const result = usersRecordSchema.parse({
           "456": { email: "b@c.com", user_name: "Y" },
         });
         expect(result["456"].roles).toBeUndefined();
       });
     });
     ```
  4. Run governed tests again — all pass.
- **Planning validation:**
  - Checks run: read `userDomain.ts` lines 1–84 (confirmed `userRolesSchema` at 9–14,
    `userSchema` at 65, `usersRecordSchema` at 76; `userRolesSchema` is module-level const,
    in scope for schema extension without exporting).
  - Validation artifacts: fact-find.md quotes exact line numbers and code.
  - Confirmed: test file at line 4 sets `import.meta.env.VITE_USERS_JSON` — this is not
    the variable the production module reads. Existing tests pass vacuously. New test must
    use schema direct-import.
- **Scouts:** Resolved — `userRolesSchema` is a module-level `const` (not exported) at
  `userDomain.ts:9`. It is in scope within the same file for the schema extension. No
  export is needed for TASK-01; exporting it would only be necessary if tests import it
  directly, and the required test approach (schema direct-import via `usersRecordSchema`)
  does not need it.
- **Edge Cases & Hardening:** Entries with no `roles` field must still parse without error
  (`.optional()`). Entries with invalid role strings will throw (Zod enum — acceptable
  defensive behaviour).
- **What would make this >=90%:** N/A — scout resolved; test strategy mandated; no
  remaining open questions.
- **Rollout / rollback:**
  - Rollout: schema change is purely additive (`.optional()` means no breaking change for
    callers with role-absent data).
  - Rollback: revert the one-line schema change.
- **Documentation impact:** None: change is internal to schema; `getUserByPin` JSDoc
  updated in TASK-04.
- **Notes / references:**
  - `userDomain.ts:9–14` — `userRolesSchema` definition (non-exported module-level const).
  - `userDomain.ts:65–76` — `userSchema` and `usersRecordSchema` to be modified.
  - `getUserByPin.test.ts:4` — confirmed: uses `VITE_USERS_JSON`, not
    `NEXT_PUBLIC_USERS_JSON`; existing tests are vacuous.

---

### TASK-02: Update `.env.local` NEXT_PUBLIC_USERS_JSON with roles

- **Type:** IMPLEMENT
- **Deliverable:** config-change — `apps/reception/.env.local` (gitignored; local-only)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** `.env.local` line 17 updated. Verified by node parse: 5/5 users have valid `UserRole[]` roles (Dom=staff, Serena=owner, Pete=owner, Alessandro=staff, Cristiana=admin). File is gitignored; no commit needed.
- **Affects:**
  - `apps/reception/.env.local`
- **Depends on:** TASK-01 (schema must pass roles through before env value is useful)
- **Blocks:** —
- **Confidence:** 85%
  - Implementation: 95% — single line edit in a local config file.
  - Approach: 95% — roles are resolved; no open decisions.
  - Impact: 85% — `getUserByPin` is unwired; effect is currently latent but correct.
- **Acceptance:**
  - `.env.local` line 17 contains `NEXT_PUBLIC_USERS_JSON` as a compact JSON single-line
    value with `roles` populated for all five users.
  - All role values are valid `UserRole` strings.
  - No other lines in `.env.local` are modified.
- **Validation contract:**
  - TC-01: Value parses via `usersRecordSchema.parse(JSON.parse(value))` without error.
  - TC-02: Each parsed user object has a non-empty `roles` array.
- **Execution plan:**
  1. Read `.env.local` to locate line 17.
  2. Replace the `NEXT_PUBLIC_USERS_JSON` value with:
     ```
     NEXT_PUBLIC_USERS_JSON={"343434":{"email":"sery399@gmail.com","user_name":"Dom","roles":["staff"]},"222222":{"email":"sery399@gmail.com","user_name":"Serena","roles":["owner"]},"777777":{"email":"peter.cowling1976@gmail.com","user_name":"Pete","roles":["owner"]},"212121":{"email":"ponticorvoalessandro@gmail.com","user_name":"Alessandro","roles":["staff"]},"333333":{"email":"cmarzano@gmail.com","user_name":"Cristiana","roles":["admin"]}}
     ```
  3. Verify `.env.local` is gitignored (it is — confirmed in fact-find).
- **Scouts:** None: role values are resolved by DECISION self-resolve gate.
- **Edge Cases & Hardening:** None: `.env.local` is local-only and never committed.
- **What would make this >=90%:** N/A — pure config update; already near ceiling.
- **Rollout / rollback:**
  - Rollout: local change only; no deployment step.
  - Rollback: revert `.env.local` to previous value.
- **Documentation impact:** None: `.env.example` documentation is in TASK-03.
- **Notes / references:**
  - Dom=`["staff"]`, Cristiana=`["admin"]` — resolved by DECISION self-resolve gate (see Assumptions section).

---

### TASK-03: Document `NEXT_PUBLIC_USERS_JSON` in `.env.example`

- **Type:** IMPLEMENT
- **Deliverable:** docs-change — `apps/reception/.env.example`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** Wave-1 commit f5aedc73c5. New section inserted between Firebase and Till settings sections. Includes format explanation, valid roles list, and example entry with fake PIN.
- **Affects:**
  - `apps/reception/.env.example`
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 90%
  - Implementation: 98% — purely additive doc change.
  - Approach: 98% — clear gap; format is well understood.
  - Impact: 90% — developer experience; prevents misconfiguration.
- **Acceptance:**
  - `.env.example` includes `NEXT_PUBLIC_USERS_JSON` with a comment block explaining:
    - PIN keys are numeric strings.
    - Each value is `{ email, user_name, roles }`.
    - Valid roles: `owner`, `developer`, `admin`, `manager`, `staff`, `viewer`.
    - Roles must be set correctly or all role-gated features will be inaccessible.
    - An example entry with a fake PIN.
  - No real credentials or PINs are included.
  - No other lines in `.env.example` are modified.
- **Validation contract:**
  - TC-01: `.env.example` contains `NEXT_PUBLIC_USERS_JSON`.
  - TC-02: Example value in comment contains at least one fake PIN entry with `roles`.
- **Execution plan:**
  1. Open `.env.example`. Add a new section after the Firebase block (after line 12),
     before the Till settings section (before line 14). Insert:
     ```
     # ── PIN user roster (required if using PIN quick-unlock) ───────────────────────
     # JSON map of PIN → user object. Each entry must include email, user_name, and roles.
     # Valid roles: owner | developer | admin | manager | staff | viewer
     # If roles is missing, all role-gated features will be silently inaccessible to that user.
     # Example (use real values in .env.local — never commit real PINs):
     # NEXT_PUBLIC_USERS_JSON={"000000":{"email":"user@example.com","user_name":"ExampleUser","roles":["staff"]}}
     NEXT_PUBLIC_USERS_JSON=
     ```
- **Scouts:** None.
- **Edge Cases & Hardening:** None.
- **What would make this >=90%:** Already at 90%. No further improvement needed.
- **Rollout / rollback:** Rollback: revert the `.env.example` lines.
- **Documentation impact:** This IS the documentation change.
- **Notes / references:** Placement: after Firebase section, before Till settings. No real data.

---

### TASK-04: Add `@deprecated` JSDoc to `getUserByPin.ts`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/utils/getUserByPin.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** Wave-1 commit f5aedc73c5. `@deprecated` JSDoc added before `getUserByPin` function. Typecheck clean. Linter also added `as unknown as` cast at schema parse site (type safety fix).
- **Affects:**
  - `apps/reception/src/utils/getUserByPin.ts`
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 85%
  - Implementation: 95% — add JSDoc comment; one-line change.
  - Approach: 90% — decision is clear from fact-find analysis.
  - Impact: 85% — developer ergonomics only; no runtime effect.
- **Acceptance:**
  - `getUserByPin.ts` has a JSDoc comment on `getUserByPin` that marks it `@deprecated`
    and explains it is currently unwired from the auth flow.
  - Comment includes a note that the function is safe to wire in future (after TASK-01
    schema fix) or to remove if shift-PIN auth is not needed.
  - No logic changes; no test changes.
- **Validation contract:**
  - TC-01: File compiles with no new TypeScript errors.
  - TC-02: Existing `getUserByPin.test.ts` tests still pass.
- **Execution plan:**
  1. Add JSDoc immediately before `export function getUserByPin`:
     ```ts
     /**
      * @deprecated Not currently wired into the auth flow.
      * The device-PIN quick-unlock in Login.tsx relies on the existing Firebase session
      * (onAuthStateChanged) rather than this lookup. This function may be wired in
      * future for a shift-PIN staff login path. Remove if that path is not needed.
      */
     ```
  2. Run `pnpm typecheck` targeting `apps/reception` to confirm no new errors.
- **Scouts:** None.
- **Edge Cases & Hardening:** None: purely additive JSDoc.
- **What would make this >=90%:** N/A — trivial documentation addition.
- **Rollout / rollback:** Rollback: remove the JSDoc comment.
- **Documentation impact:** This IS the documentation change (inline).
- **Notes / references:** `getUserByPin` has 0 production callers; 1 test file (confirmed by fact-find grep).

---

## Risks & Mitigations

- **getUserByPin.ts test VITE_USERS_JSON discrepancy (Major — mitigated)**: The test file
  (confirmed at line 4) sets `import.meta.env.VITE_USERS_JSON`, not
  `process.env.NEXT_PUBLIC_USERS_JSON` (which the production module reads). All three
  existing tests therefore inject into an unread variable — they exercise an empty user
  object and pass vacuously. This means TC-03 ("existing tests unaffected") is trivially
  true but not diagnostic. The TASK-01 new test must use `usersRecordSchema.parse()`
  directly (schema direct-import) and must NOT extend the `loadUtil` harness. See
  TASK-01 execution plan step 3 for the required test structure.
- **Dom's shared email with Serena**: If Dom is actually an owner-level user (e.g. Serena's
  family member with shared email), assigning `["staff"]` would restrict their access. This
  is a known uncertainty; the conservative default is correct. Operator can update `.env.local`
  if Dom needs elevated access.
- **OPERATIONS_ACCESS anomaly — admin excluded from basic operations**: `roles.ts`
  `OPERATIONS_ACCESS` grants access to `["owner", "developer", "staff"]` only — it does NOT
  include `admin` or `manager`. This means Cristiana (`["admin"]`) can reach
  `MANAGEMENT_ACCESS` features but cannot access basic operations features that
  `["staff"]` users (e.g. Alessandro) can. This is a pre-existing quirk in `roles.ts` and
  is out of scope for this plan. Operator should be aware that assigning Cristiana `admin`
  does not grant a superset of staff permissions.
- **Firebase profile roles not populated (prerequisite for full RBAC effectiveness)**: The
  device PIN quick-unlock in `Login.tsx` re-hydrates the user from Firebase
  `userProfiles/{uid}` via `onAuthStateChanged`. Roles come from the Firebase DB profile,
  not from `NEXT_PUBLIC_USERS_JSON`. If Firebase profiles lack `roles`, permission checks
  will still fail at runtime regardless of the fixes in this plan. Verification that
  Firebase user profiles carry correct `roles` values is a prerequisite for the broader
  RBAC migration to be fully effective. This is an explicit non-goal here and must be
  addressed separately.

## Observability

- None: no runtime logging changes. Schema validation errors surface at startup (caught and
  defaulted to `{}` in `getUserByPin.ts`).

## Acceptance Criteria (overall)

- [ ] `usersRecordSchema.parse({ "123": { email: "a@b.com", user_name: "X", roles: ["owner"] } })` returns `{ "123": { email: "a@b.com", user_name: "X", roles: ["owner"] } }`
- [ ] All existing `getUserByPin.test.ts` tests pass.
- [ ] `.env.local` has `roles` populated for all five PIN users with valid role values.
- [ ] `.env.example` documents `NEXT_PUBLIC_USERS_JSON` with format explanation.
- [ ] `getUserByPin.ts` has `@deprecated` JSDoc explaining unwired state.
- [ ] `pnpm typecheck` (reception) passes with no new errors.

## Decision Log

- 2026-02-27: Dom role assigned `["staff"]` (DECISION self-resolve gate — no evidence of elevated access; conservative default).
- 2026-02-27: Cristiana role assigned `["admin"]` (DECISION self-resolve gate — prior RBAC migration plan used `hasRole(user, "admin")` for inactivity exemption, confirming admin status).
- 2026-02-27: `getUserByPin` disposition: deprecate/document, do not wire or remove (option b from fact-find Gap 3). Shift-PIN path kept open for future.

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extend userSchema with roles | Yes — `userRolesSchema` confirmed present and in scope (module-level const, same file, no export needed) | Major (mitigated): test harness uses `VITE_USERS_JSON` not `NEXT_PUBLIC_USERS_JSON` — existing tests are vacuous. New test must use schema direct-import; extending `loadUtil` is prohibited. See execution plan step 3. | Yes — mandatory test strategy specified in execution plan |
| TASK-02: Update .env.local roles | Partial — depends on TASK-01 schema fix | None | No |
| TASK-03: Document env.example | Yes — fully independent | None | No |
| TASK-04: Deprecate getUserByPin | Yes — fully independent | None | No |

No critical simulation findings. One Major finding (VITE_USERS_JSON harness) is mitigated by the mandatory test strategy in TASK-01 execution plan step 3.

## Overall-confidence Calculation

- S=1 weight for all tasks
- TASK-01: 85% × 1 = 85
- TASK-02: 85% × 1 = 85
- TASK-03: 90% × 1 = 90
- TASK-04: 85% × 1 = 85
- Overall: (85 + 85 + 90 + 85) / 4 = **86%**
