---
Type: Plan
Status: Active
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-prime-deprecated-endpoint-cleanup
Dispatch-ID: IDEA-DISPATCH-20260314200000-0007
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: none
---

# Reception/Prime Deprecated Endpoint Cleanup Plan

## Summary

Two deprecated code paths exist alongside their already-shipped replacements: `initiatePrimeOutboundThread()` in `apps/reception/src/lib/inbox/prime-review.server.ts` (which calls `/api/staff-initiate-thread`) and the route file `apps/prime/functions/api/staff-initiate-thread.ts`. The replacement path (`staffBroadcastSend()` / `/api/staff-broadcast-send`) is live.

**Caller search results (confirmed at planning time):**
- `initiatePrimeOutboundThread` production callers in `apps/reception/src/app/`: zero.
- `initiatePrimeOutboundThread` import sites outside its own definition and test file: none.
- `/api/staff-initiate-thread` references in production code: only inside the deprecated function body (being deleted) and a comment in `staff-broadcast-send.ts` (harmless).
- Both deprecated artefacts are safe to delete from a caller-graph perspective.

**Test coverage gap (discovered at planning time — drives two-task structure):**

Critique confirmed that the dedicated test files for the deprecated code cover auth contract behaviours that the replacement test files do not yet exercise:

1. `apps/prime/functions/__tests__/staff-initiate-thread.test.ts` contains the only prime-side broadcast-endpoint tests asserting: unsigned request → 401, invalid signature → 401, missing `PRIME_ACTOR_CLAIMS_SECRET` → 503, and staff vs owner/admin role gating. `staff-broadcast-send.test.ts` covers flow/error paths only and does not exercise those auth paths.

2. `apps/reception/src/lib/inbox/__tests__/initiate-prime-outbound-thread.test.ts` is the only Reception-side test asserting `x-prime-actor-claims` signing and omission behaviour for a Prime mutation proxy. `prime-compose/route.test.ts` mocks `staffBroadcastSend` at the module level and does not cover header construction.

The plan therefore has two tasks: first port this auth/claims coverage to the replacement test files, then delete the deprecated code and its now-superseded tests.

## Active tasks

- [ ] TASK-01: Port auth and claims coverage to replacement test files
- [ ] TASK-02: Delete deprecated function and endpoint

## Goals

- Ensure auth/claims test coverage from deprecated test files is preserved in the replacement test files before deletion.
- Remove `initiatePrimeOutboundThread()` from `prime-review.server.ts` and its dedicated test file.
- Remove `apps/prime/functions/api/staff-initiate-thread.ts` and its dedicated test file.
- Confirm TypeScript compiles cleanly after deletion.

## Non-goals

- Changing `staffBroadcastSend` or `/api/staff-broadcast-send` behaviour.
- Porting every test case — only the coverage categories absent from the replacement files: auth/claims verification.
- Removing the comment in `staff-broadcast-send.ts` line 50 (comment-only reference to old endpoint, harmless).

## Constraints & Assumptions

- Constraints:
  - Tests run in CI only — no local Jest runs. TypeScript typecheck (`pnpm --filter @apps/reception typecheck`, `pnpm --filter @apps/prime typecheck`) is the local validation gate.
  - Writer lock must be acquired via `with-writer-lock.sh` for the commit.
  - `pnpm --filter @apps/reception lint` and `pnpm --filter @apps/prime lint` used for scoped linting (not root turbo).
- Assumptions:
  - The `.open-next/` build artefact is generated output; production callers verified via source-only search.
  - `staff-broadcast-send.ts` uses the same auth middleware chain (`enforceStaffOwnerApiGate`, `resolveActorClaims`, `enforceBroadcastRoleGate`) as `staff-initiate-thread.ts`, so the coverage port is mechanical: the same test helpers and assertion patterns apply.

## Inherited Outcome Contract

- **Why:** Remove dead code created by the single-hop broadcast refactor. Reduces maintenance surface and eliminates the risk of accidentally calling the deprecated path. Ensure no regression coverage is lost in the process.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After the change, `initiatePrimeOutboundThread` does not exist, `/api/staff-initiate-thread` does not exist, the replacement test files cover the auth contract that the deleted tests previously owned, and TypeScript compiles cleanly.
- **Source:** auto

## Analysis Reference

- Related analysis: none (micro-build — no analysis stage required)
- Selected approach: delete deprecated artefacts after first porting auth coverage to replacement test files.
- Key reasoning: caller search confirmed zero production callers; both carry `@deprecated` JSDoc; critique surfaced that test files are not solely for deleted code — they hold live auth contract coverage that must be preserved before deletion.

## Selected Approach Summary

- What was chosen: two-task sequential approach — port auth coverage first, then delete.
- Why planning is not reopening option selection: the alternative (delete and add coverage after) would create a window where live auth contracts have no regression tests in CI; porting first eliminates that window entirely.

## Fact-Find Support

- Supporting brief: none (micro-build; evidence gathered inline at planning time).
- Evidence carried forward:
  - `initiatePrimeOutboundThread` exported from `prime-review.server.ts` lines 592–613.
  - `staffBroadcastSend` exported from `prime-review.server.ts` lines 624–645.
  - `staff-initiate-thread.ts` and `staff-broadcast-send.ts` use the same auth middleware chain — confirmed by reading both files.
  - `staff-broadcast-send.test.ts` does not import `signTestActorClaims`, does not set `x-prime-actor-claims` headers in any test case, and has no 401 assertions.
  - `prime-compose/route.test.ts` mocks `staffBroadcastSend` and does not exercise header construction in `prime-review.server.ts`.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Port auth and claims coverage to replacement test files | 85% | S | Pending | - | TASK-02 |
| TASK-02 | IMPLEMENT | Delete deprecated function and endpoint | 90% | S | Pending | TASK-01 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A | - | Pure server-side changes; no UI surface |
| UX / states | N/A | - | No UX change |
| Security / privacy | Required — ensure auth/claims coverage survives deletion | TASK-01 | The deleted test files are the only auth regression coverage for broadcast endpoints; TASK-01 ports it first |
| Logging / observability / audit | N/A | - | No logging changes |
| Testing / validation | Required — port auth coverage, delete deprecated tests, typecheck both apps | TASK-01, TASK-02 | Auth coverage ported before deletion |
| Data / contracts | Required — verify no production importers of deleted export | TASK-02 | Caller search confirmed zero production importers |
| Performance / reliability | N/A | - | Deletion; no performance surface |
| Rollout / rollback | Required — two-commit sequence; each individually revertible | TASK-01, TASK-02 | No migration; rollback = revert commit(s) |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Must complete before TASK-02 |
| 2 | TASK-02 | TASK-01 complete | Sequential only; coverage must exist before deletion |

## Delivered Processes

None: no material process topology change. The broadcast pipeline (`staffBroadcastSend` → `/api/staff-broadcast-send`) is unchanged. This cleanup removes a dead code path and its dedicated tests after porting their unique coverage.

## Tasks

### TASK-01: Port auth and claims coverage to replacement test files

- **Type:** IMPLEMENT
- **Deliverable:** code-change — add auth/role-gate test cases to `apps/prime/functions/__tests__/staff-broadcast-send.test.ts`; create new `apps/reception/src/lib/inbox/__tests__/staff-broadcast-send.test.ts` that directly tests `staffBroadcastSend` header construction (mirroring the existing `initiate-prime-outbound-thread.test.ts` pattern).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/prime/functions/__tests__/staff-broadcast-send.test.ts` (add auth/role-gate test cases)
  - `apps/reception/src/lib/inbox/__tests__/staff-broadcast-send.test.ts` (new file — direct lib-level tests of `staffBroadcastSend` header construction and omission)
  - `[readonly] apps/prime/functions/api/staff-broadcast-send.ts` (reference for auth middleware shape)
  - `[readonly] apps/reception/src/lib/inbox/prime-review.server.ts` (source for `staffBroadcastSend` and `buildPrimeActorHeaders`)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 85% — the auth middleware chain in `staff-broadcast-send.ts` is identical to `staff-initiate-thread.ts` (same three imported gate functions). Test helpers are available. New Reception-side test follows exact same pattern as `initiate-prime-outbound-thread.test.ts` (mock `server-only`, import `staffBroadcastSend`, mock `fetch`, assert request URL/headers). Pattern is well-established by the existing file.
  - Approach: 95% — creating a new direct lib-level test for `staffBroadcastSend` is the only approach that can actually exercise `buildPrimeActorHeaders` inside `prime-review.server.ts`.
  - Impact: 85% — after this task, both the Prime-side auth contract and the Reception-side header construction are regression-covered on live paths. Held-back test: "What single unknown would push Impact below 80?" — none identified; the test pattern for both new tests is fully determined by the existing `initiate-prime-outbound-thread.test.ts` and `staff-initiate-thread.test.ts` patterns.
  - Composite (min): 85%
- **Acceptance:**
  - [ ] `apps/prime/functions/__tests__/staff-broadcast-send.test.ts` includes cases for: unsigned request → 401, invalid `x-prime-actor-claims` signature → 401, missing `PRIME_ACTOR_CLAIMS_SECRET` → 503, staff role → 403, owner role → proceeds past gate (200/409).
  - [ ] `apps/reception/src/lib/inbox/__tests__/staff-broadcast-send.test.ts` (new file) includes: post to `/api/staff-broadcast-send` with `actorUid` → `x-prime-actor-claims` header present and correctly formatted; post without `actorUid` → `x-prime-actor-claims` header absent; Prime config absent → returns null without calling fetch.
  - [ ] `pnpm --filter @apps/prime lint` exits clean (test files are linted even though excluded from typecheck).
  - [ ] `pnpm --filter @apps/reception lint` exits clean.
  - Note: `pnpm --filter @apps/... typecheck` does not typecheck `__tests__/**` files (tsconfig excludes them). TypeScript correctness for test files is validated by CI jest/ts-jest compilation.
- **Engineering Coverage:**
  - UI / visual: N/A — test file changes only
  - UX / states: N/A — no UX change
  - Security / privacy: Required — new tests directly assert auth contract behaviour on the live broadcast endpoint and header construction for the live `staffBroadcastSend` helper
  - Logging / observability / audit: N/A
  - Testing / validation: Required — new test cases and a new test file
  - Data / contracts: N/A — no contract changes; tests assert existing behaviour
  - Performance / reliability: N/A
  - Rollout / rollback: Required — adding tests only; no risk; rollback = revert commit
- **Validation contract:**
  - TC-01: `apps/prime/functions/__tests__/staff-broadcast-send.test.ts` contains test cases for unsigned request → 401 and invalid sig → 401.
  - TC-02: `apps/prime/functions/__tests__/staff-broadcast-send.test.ts` contains a test case for missing `PRIME_ACTOR_CLAIMS_SECRET` → 503.
  - TC-03: `apps/prime/functions/__tests__/staff-broadcast-send.test.ts` contains test cases for staff role → 403 and owner/admin role → proceeds past gate.
  - TC-04: New `apps/reception/src/lib/inbox/__tests__/staff-broadcast-send.test.ts` exists and imports `staffBroadcastSend` from `../prime-review.server`.
  - TC-05: New reception test asserts signed `x-prime-actor-claims` header is present when actorUid is provided.
  - TC-06: New reception test asserts `x-prime-actor-claims` header is absent when actorUid is not provided.
  - TC-07: New reception test asserts `null` return when Prime config is not set (RECEPTION_PRIME_API_BASE_URL absent).
  - TC-08: `pnpm --filter @apps/prime lint` exits 0.
  - TC-09: `pnpm --filter @apps/reception lint` exits 0.
- **Execution plan:**
  - Red: (tests are additive; no red/green cycle for additive tests)
  - Green:
    1. In `staff-broadcast-send.test.ts` (prime): import `signTestActorClaims`, `TEST_ACTOR_CLAIMS_SECRET`, `createMockD1Database`, `createMockEnv`, `createPagesContext` from `./helpers`. Add describe block for auth/role-gate coverage with cases for: unsigned → 401, invalid sig → 401, missing secret → 503, staff-only → 403, owner → 200/409, admin → 200/409.
    2. Create `apps/reception/src/lib/inbox/__tests__/staff-broadcast-send.test.ts`: mock `server-only`, import `staffBroadcastSend`, set env vars, mock `fetch`. Test cases: actorUid present → header signed and formatted; actorUid absent → header absent; config absent → null without fetch; network error → propagates throw; non-ok HTTP → propagates throw.
  - Refactor: Run `pnpm --filter @apps/prime lint` and `pnpm --filter @apps/reception lint`. Commit if clean.
- **Planning validation:**
  - Checks run:
    - Read `apps/prime/functions/__tests__/staff-broadcast-send.test.ts` — confirmed no auth/claims test cases.
    - Read `apps/prime/functions/__tests__/staff-initiate-thread.test.ts` TC-07 through TC-12 — confirmed auth coverage pattern.
    - Read `apps/prime/functions/api/staff-broadcast-send.ts` and `staff-initiate-thread.ts` — confirmed identical import list for the three auth gate functions.
    - Read `apps/reception/src/lib/inbox/__tests__/initiate-prime-outbound-thread.test.ts` — confirmed pattern for lib-level header construction test using `fetch` mock.
    - Read `apps/reception/src/lib/inbox/prime-review.server.ts` lines 645–665 — confirmed `staffBroadcastSend` calls `buildPrimeActorHeaders(input.actorUid, input.roles)`.
    - Confirmed `apps/reception/tsconfig.json` excludes `**/__tests__/**` and `**/*.test.*` — typecheck gate does not cover test files; lint gate used instead.
  - Validation artifacts: inline readings above.
  - Unexpected findings: none.
- **Scouts:** `apps/prime/functions/__tests__/helpers.ts` exports `signTestActorClaims` and `TEST_ACTOR_CLAIMS_SECRET` — available to `staff-broadcast-send.test.ts` without modification.
- **Edge Cases & Hardening:** `prime-compose/route.test.ts` still mocks `staffBroadcastSend` — no change needed to that file. Coverage of header construction from the reception side is fully handled by the new direct lib test.
- **What would make this >=90%:** Confirm (during build) that `staff-broadcast-send.ts` auth middleware returns the same error JSON shapes as `staff-initiate-thread.ts` — making the ported assertions 1:1 correct.
- **Rollout / rollback:**
  - Rollout: single commit; CI validates test compilation.
  - Rollback: revert commit.
- **Documentation impact:** None.
- **Notes / references:**
  - Auth gates source: `apps/prime/functions/lib/broadcast-role-gate.ts`, `apps/prime/functions/lib/actor-claims-resolver.ts`, `apps/prime/functions/lib/staff-owner-gate.ts`
  - Test helpers: `apps/prime/functions/__tests__/helpers.ts`

---

### TASK-02: Delete deprecated function and endpoint

- **Type:** IMPLEMENT
- **Deliverable:** code-change — remove `initiatePrimeOutboundThread` from `prime-review.server.ts`, delete `staff-initiate-thread.ts`, delete both dedicated test files.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/lib/inbox/prime-review.server.ts` (remove lines 578–613 — `initiatePrimeOutboundThread` JSDoc + function body)
  - `apps/reception/src/lib/inbox/__tests__/initiate-prime-outbound-thread.test.ts` (delete file)
  - `apps/prime/functions/api/staff-initiate-thread.ts` (delete file)
  - `apps/prime/functions/__tests__/staff-initiate-thread.test.ts` (delete file)
  - `[readonly] apps/prime/functions/api/staff-broadcast-send.ts` (no change — comment-only reference)
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — exact line ranges verified; zero production callers confirmed; deletion is mechanical; auth coverage is ported by TASK-01 so deletion is safe.
  - Approach: 95% — deletion of dead code with zero callers and confirmed coverage migration is the only valid approach.
  - Impact: 90% — TypeScript compiles cleanly after deletion (no remaining consumers of deleted export). Held-back test: no single unresolved unknown would drop any dimension below 80: callers searched exhaustively; coverage ported by TASK-01; only comment references remain after deletion.
  - Composite (min): 90%
- **Acceptance:**
  - [ ] `initiatePrimeOutboundThread` no longer exists in `prime-review.server.ts`.
  - [ ] `apps/prime/functions/api/staff-initiate-thread.ts` is deleted.
  - [ ] `apps/reception/src/lib/inbox/__tests__/initiate-prime-outbound-thread.test.ts` is deleted.
  - [ ] `apps/prime/functions/__tests__/staff-initiate-thread.test.ts` is deleted.
  - [ ] `pnpm --filter @apps/reception typecheck` exits clean.
  - [ ] `pnpm --filter @apps/prime typecheck` exits clean.
  - [ ] `pnpm --filter @apps/reception lint` and `pnpm --filter @apps/prime lint` exit clean.
- **Engineering Coverage:**
  - UI / visual: N/A — pure server-side deletion
  - UX / states: N/A
  - Security / privacy: N/A — auth coverage preserved by TASK-01; deletion reduces attack surface
  - Logging / observability / audit: N/A
  - Testing / validation: Required — delete both dedicated test files; typecheck confirms no broken imports
  - Data / contracts: Required — caller search confirmed zero production importers; deleting the export must not break any module
  - Performance / reliability: N/A
  - Rollout / rollback: Required — single commit; revert to restore
- **Validation contract:**
  - TC-01: After deletion, `pnpm --filter @apps/reception typecheck` exits 0.
  - TC-02: After deletion, `pnpm --filter @apps/prime typecheck` exits 0.
  - TC-03: `grep -r "initiatePrimeOutboundThread" apps/reception/src apps/prime/src` returns no results.
  - TC-04: `test ! -f apps/prime/functions/api/staff-initiate-thread.ts` passes (file does not exist). Note: `staff-broadcast-send.ts` retains a comment-only reference to the old endpoint name — this is expected and harmless; the validation checks only that the route *file* is deleted.
- **Execution plan:**
  - Red: (no failing tests to write — this is a deletion; the deleted test files covered only the deleted code)
  - Green:
    1. Delete lines 578–613 from `apps/reception/src/lib/inbox/prime-review.server.ts`.
    2. Delete `apps/reception/src/lib/inbox/__tests__/initiate-prime-outbound-thread.test.ts`.
    3. Delete `apps/prime/functions/api/staff-initiate-thread.ts`.
    4. Delete `apps/prime/functions/__tests__/staff-initiate-thread.test.ts`.
  - Refactor: Run `pnpm --filter @apps/reception typecheck` and `pnpm --filter @apps/prime typecheck`. Run `pnpm --filter @apps/reception lint` and `pnpm --filter @apps/prime lint`. Commit if clean.
- **Planning validation:** (see TASK-01 planning validation — same search evidence applies)
- **Scouts:** None: pure deletion after confirmed zero-caller search and TASK-01 coverage migration.
- **Edge Cases & Hardening:**
  - Generated `.open-next/` copy at `apps/reception/.open-next/...prime-review.server.ts` — build output only; not compiled by `pnpm typecheck`.
  - Comment reference in `staff-broadcast-send.ts` line 50 — not a code reference; TypeScript will not error.
  - `docs/business-os/startup-loop/ideas/trial/queue-state.json` references — historical JSON state data; not code.
- **What would make this >=90%:** Already at 90%. To reach 95%: run typecheck locally before commit to eliminate residual uncertainty.
- **Rollout / rollback:**
  - Rollout: single commit on `dev` branch; CI typecheck enforces correctness.
  - Rollback: `git revert <commit-sha>`.
- **Documentation impact:** None.
- **Notes / references:**
  - `@deprecated` annotation on `initiatePrimeOutboundThread`: `prime-review.server.ts` lines 578–591.
  - `@deprecated` annotation on endpoint: `staff-initiate-thread.ts` lines 27–33.
  - Replacement: `staffBroadcastSend()` lines 624–645; `/api/staff-broadcast-send`.

## Risks & Mitigations

- **Risk:** Missed caller via dynamic import or string concatenation. **Mitigation:** Function name and endpoint path string grepped across all `.ts`/`.tsx` source files. No dynamic import pattern found. Risk: very low.
- **Risk:** Auth coverage port in TASK-01 has a subtle assertion mismatch (different error JSON shape between endpoints). **Mitigation:** Both endpoints use the same imported gate functions from the same lib files — confirmed by reading both source files. If a mismatch is found during build, the ported assertion is adjusted before TASK-02 proceeds.
- **Risk:** `.open-next/` stale artefact causes confusion. **Mitigation:** Build artefacts are not source-of-truth; regenerated on next build.

## Observability

- Logging: None.
- Metrics: None.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] Auth/claims coverage for `staff-broadcast-send` endpoint and `prime-compose` route exists in replacement test files (TC-07-equivalent cases).
- [ ] `initiatePrimeOutboundThread` is removed from `prime-review.server.ts`.
- [ ] `apps/prime/functions/api/staff-initiate-thread.ts` is deleted.
- [ ] Both dedicated test files for deprecated code are deleted.
- [ ] `pnpm --filter @apps/reception typecheck` and `pnpm --filter @apps/prime typecheck` pass.
- [ ] `pnpm --filter @apps/reception lint` and `pnpm --filter @apps/prime lint` pass.
- [ ] No CI failures related to the deleted code.

## Decision Log

- 2026-03-14: Caller search confirmed zero production callers. Critique Round 1 (score 8/10, lp_score 4.0): TC-04 grep inconsistency fixed. Critique Round 2 (score 7/10, lp_score 3.5): two auth coverage gaps in replacement test files and wrong package filter names (`@acme` vs `@apps`) identified — plan restructured to two tasks, package filter names corrected. Critique Round 3 (score 7/10, lp_score 3.5, Critical finding): TASK-01 acceptance criterion for `prime-compose/route.test.ts` header-construction coverage was not achievable (that file mocks `staffBroadcastSend` and cannot observe headers built inside `prime-review.server.ts`). Also: tsconfig excludes `__tests__/**` so typecheck gate does not apply to test files. Resolution: replaced `prime-compose/route.test.ts` criterion with creation of new `apps/reception/src/lib/inbox/__tests__/staff-broadcast-send.test.ts` (direct lib-level test mirroring existing `initiate-prime-outbound-thread.test.ts` pattern). Validation gate for TASK-01 changed to lint-only (not typecheck). Critical finding resolved in-plan before final status set.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Port auth and claims coverage | Yes — source files read; helpers confirmed available; auth middleware chain confirmed identical in both endpoints; new reception-side test file pattern established by `initiate-prime-outbound-thread.test.ts`; tsconfig test exclusion noted — lint gate used | [Type contract gap — Minor]: tsconfig excludes test files from typecheck; resolved by using lint-only gate for TASK-01 and noting CI ts-jest covers type correctness | No (resolved in plan) |
| TASK-02: Delete deprecated function and endpoint | Yes — depends on TASK-01; zero callers confirmed; auth coverage will exist after TASK-01; file-existence check used for TC-04 to avoid false failure from comment reference | None | No |

## Overall-confidence Calculation

- TASK-01: S effort (weight=1), confidence=85%
- TASK-02: S effort (weight=1), confidence=90%
- Overall-confidence = (85×1 + 90×1) / 2 = **87.5% → 85%** (rounded down to nearest 5 per scoring rules)
