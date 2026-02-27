---
Status: Complete
Feature-Slug: reception-rbac-pin-user-roles
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record — Reception RBAC: PIN User Roles Data Fix

## What Was Built

**TASK-01 — Schema fix (`userDomain.ts` + test rewrite)**

`userSchema` in `apps/reception/src/types/domains/userDomain.ts` was extended to include
an optional `roles` field using the pre-existing `userRolesSchema` union type. Before this
change, `usersRecordSchema.parse()` silently discarded `roles` from any JSON entry that
included them. After the change, roles pass through the parse step correctly.

The test file `getUserByPin.test.ts` was fully rewritten. The pre-existing `loadUtil`
harness used `import.meta.env.VITE_USERS_JSON` — a Vite-specific env API that doesn't
work in Jest, causing the test suite to fail to load entirely. The harness was replaced
with a `jest.isolateModules` + `process.env.NEXT_PUBLIC_USERS_JSON` pattern that matches
what the production module actually reads. All three original tests are preserved (now
actually diagnostic). Two new `usersRecordSchema roles round-trip` tests verify the schema
fix directly via schema direct-import (avoids module-level parse caching).

**TASK-02 — Env data (`apps/reception/.env.local`)**

`NEXT_PUBLIC_USERS_JSON` updated with `roles` populated for all five users:
- Pete (777777): `["owner"]`
- Serena (222222): `["owner"]`
- Alessandro (212121): `["staff"]`
- Dom (343434): `["staff"]` (conservative default — shares Serena's email; no evidence of elevated access)
- Cristiana (333333): `["admin"]` (confirmed by prior RBAC plan's inactivity exemption decision)

File is gitignored; change is local-only.

**TASK-03 — Developer docs (`apps/reception/.env.example`)**

New PIN user roster section added between the Firebase and Till settings sections.
Documents the variable format, valid role values, consequences of missing roles, and
provides an example entry with a fake PIN. This was the only env variable absent from
`.env.example`.

**TASK-04 — Deprecation notice (`apps/reception/src/utils/getUserByPin.ts`)**

`@deprecated` JSDoc added to `getUserByPin`. Explains that the function is not wired into
the auth flow, that device-PIN quick-unlock relies on Firebase `onAuthStateChanged`, and
that the function may be wired in future for a shift-PIN staff login path or removed if
that path is not needed. The linter also added an `as unknown as Record<string, User>`
cast at the parse call site to resolve the inferred Zod type vs the hand-written `User`
type (no semantic change — cast only).

## Tests Run

```
pnpm -w run test:governed -- jest -- \
  --config apps/reception/jest.config.cjs \
  --testPathPattern="getUserByPin" --no-coverage
```

Result: **5/5 tests passed** (32.8 s)

| Test | Result |
|---|---|
| getUserByPin › returns the matching user | ✓ |
| getUserByPin › returns null for unknown PIN | ✓ |
| getUserByPin › returns null when JSON parsing fails | ✓ |
| usersRecordSchema roles round-trip › passes roles through parse | ✓ |
| usersRecordSchema roles round-trip › parses entry with no roles without error | ✓ |

Typecheck: `pnpm --filter @apps/reception typecheck` — **clean** (0 errors).
Lint: all staged files linted — **0 errors, 8 pre-existing warnings** (unrelated files).

## Validation Evidence

| Contract | Evidence |
|---|---|
| TC-01: roles survive parse | `usersRecordSchema roles round-trip › passes roles through parse` — ✓ |
| TC-02: absent roles → undefined | `usersRecordSchema roles round-trip › parses entry with no roles without error` — ✓ |
| TC-03: existing tests pass | 3/3 original `getUserByPin` tests — ✓ (now also diagnostic, not vacuous) |
| TASK-02 acceptance: 5 users, valid roles | Node parse script: 5/5 users, `allValid: true` |
| TASK-03 acceptance: NEXT_PUBLIC_USERS_JSON in env.example | Confirmed by file read — section present at lines 14–20 |
| TASK-04 acceptance: @deprecated JSDoc present | Confirmed by file read — lines 12–17 of getUserByPin.ts |

## Scope Deviations

**Controlled expansion — TASK-01:** The pre-existing `loadUtil` harness in
`getUserByPin.test.ts` used `import.meta.env.VITE_USERS_JSON` which caused a
`SyntaxError: Cannot use 'import.meta' outside a module` at suite load time — the entire
test file was non-executable. The harness was replaced with `jest.isolateModules` +
`process.env.NEXT_PUBLIC_USERS_JSON` to make the suite loadable and the tests meaningful.
This is still within TASK-01 scope (the file was in `Affects`). The original three test
assertions are preserved with `toMatchObject` instead of `toEqual` (safer with optional
`roles` field now present in parsed output). No other tests files were modified.

## Outcome Contract

- **Why:** RBAC migration lands correctly only if every user object carries a populated
  `roles` array; silently missing roles cause `canAccess()` to return `false` for all
  gated features, locking that user out.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `usersRecordSchema` passes `roles` through; `.env.local`
  has roles populated for all five PIN users; schema confirmed by test.
- **Source:** auto
