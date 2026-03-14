---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Build-completed: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-prime-actor-claims-compat
Dispatch-ID: IDEA-DISPATCH-20260314200000-0003
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 95%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-prime-actor-claims-compat/analysis.md
---

# Reception Prime Actor Claims Compat Plan

## Summary

Three residual issues survived the `prime-outbound-auth-hardening` build (TASK-07, 2026-03-14): `actorSource: 'reception_proxy'` in two Prime API files is a misleading audit label now that UID is verified via HMAC-SHA256; two test assertions in `review-threads.test.ts` pin the old value; and the `PRIME_ACTOR_CLAIMS_SECRET` comment in both `.env.example` files describes the wrong failure mode. This plan fixes all three: rename `actorSource` to `'reception_staff'` in `review-campaign-send.ts` and `review-thread-send.ts`, update the two test fixtures that pin the old value, and enhance the `.env.example` wording to describe the actual Reception-side 502 failure mode (thrown by `buildPrimeActorHeaders()` before Prime is called). TASK-01 and TASK-02 must land together; TASK-03 is independent.

## Active tasks
- [x] TASK-01: Rename actorSource in review-campaign-send.ts and review-thread-send.ts
- [x] TASK-02: Update actorSource assertions in review-threads.test.ts
- [x] TASK-03: Update PRIME_ACTOR_CLAIMS_SECRET comment in both .env.example files

## Goals
- Replace misleading `actorSource: 'reception_proxy'` label with `'reception_staff'` in D1 audit records going forward.
- Update the two test fixtures that pin the old value so CI passes after the source rename.
- Improve `.env.example` wording to accurately describe the Reception-side 502 failure mode for local-dev diagnostics.

## Non-goals
- Rebuilding the actor claims system (already correct).
- Adding a Prime health-check endpoint (operator-gated open question).
- Retroactively rewriting historical D1 records with the old `actorSource` value.
- Adding a new `actorSource` value beyond the rename — no enum gating exists.

## Constraints & Assumptions
- Constraints:
  - `actorSource` is a free-form `TEXT` column in Prime D1; no schema migration required.
  - `.env.local` files are gitignored; only `.env.example` files are tracked and can carry documentation improvements.
  - `validatePrimeActorClaimsConfig()` is defined but not wired anywhere in `apps/prime` today; no startup hook exists on CF Pages Functions.
  - TASK-02 must be committed in the same PR as TASK-01; merging TASK-01 alone will break CI.
- Assumptions:
  - `actorSource: 'reception_staff'` accurately describes a verified Reception staff origin (HMAC-verified UID).
  - The `actorSource` field value is not parsed or branched on by any downstream logic (confirmed: free-form audit string written to D1, not an enum gate).
  - Both `.env.example` files already contain a `PRIME_ACTOR_CLAIMS_SECRET=` entry; TASK-03 is a comment wording update, not a new entry.

## Inherited Outcome Contract

- **Why:** The `prime-outbound-auth-hardening` build removed the compat fallback but left two residual issues: `actorSource: 'reception_proxy'` in audit records is misleading now that the UID is verified, and `PRIME_ACTOR_CLAIMS_SECRET` is absent from local dev env files, causing Reception-side failures (surfaced as 502 by most routes via `inboxApiErrorResponse`, thrown by `buildPrimeActorHeaders()` before Prime is called) with no clear diagnostic indicator in the `.env.example` wording.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this change, `actorSource` in D1 audit records accurately reflects a verified Reception staff origin (`'reception_staff'`), existing tests that pin `'reception_proxy'` are updated to the new value, and the existing `PRIME_ACTOR_CLAIMS_SECRET` entries in both `.env.example` files are updated with clearer wording about the Reception-side failure mode (surfaced as 502 by `inboxApiErrorResponse` after `buildPrimeActorHeaders()` throws before Prime is called) so new contributors can diagnose misconfiguration without reading the source.
- **Source:** auto

## Analysis Reference
- Related analysis: `docs/plans/reception-prime-actor-claims-compat/analysis.md`
- Selected approach inherited:
  - Option A (actorSource): rename `'reception_proxy'` → `'reception_staff'` in `review-campaign-send.ts:67` and `review-thread-send.ts:66`.
  - Option A (env docs): update `PRIME_ACTOR_CLAIMS_SECRET` comment wording in both `.env.example` files to describe the Reception-side 502 failure mode.
- Key reasoning used:
  - `'reception_staff'` is semantically accurate for a HMAC-verified staff request; `'reception_proxy'` was appropriate when the UID was forwarded without verification.
  - Using `'reception_staff'` (not `'reception_staff_compose'`) preserves per-path distinguishability — broadcast-send is a different flow from review-send.
  - `.env.example` is the only durable fix surface; `.env.local` files are gitignored.

## Selected Approach Summary
- What was chosen:
  - Rename `actorSource` to `'reception_staff'` in two Prime API files.
  - Update two test assertions in `review-threads.test.ts` to match.
  - Update `PRIME_ACTOR_CLAIMS_SECRET` comment in both `.env.example` files to describe the primary failure mode accurately (Reception-side 502, not Prime 503).
- Why planning is not reopening option selection:
  - Analysis chose decisively; all three alternatives were rejected with explicit rationale.
  - No operator-only fork remains; the open question (health-check endpoint) is explicitly deferred.

## Fact-Find Support
- Supporting brief: `docs/plans/reception-prime-actor-claims-compat/fact-find.md`
- Evidence carried forward:
  - `actorSource: 'reception_proxy'` confirmed at `review-campaign-send.ts:67` and `review-thread-send.ts:66`.
  - `review-threads.test.ts:2742` and `:3045` both contain `"actorSource":"reception_proxy"` in `source_metadata_json` fixture strings.
  - `staff-broadcast-send.ts:129` uses `'reception_staff_compose'` (already correct; target consistency reference).
  - `apps/prime/.env.example:31` says "Missing or too short → all mutation endpoints return 503 (claims-secret-not-configured)" — this describes the Prime-side failure mode, not the Reception-side 502 that fires first when the secret is missing in Reception.
  - `apps/reception/.env.example:90` says "Missing → Reception cannot sign actor claims; Prime mutation endpoints will fail" — vague; doesn't name the 502 surfacing path.
  - `buildPrimeActorHeaders()` at `apps/reception/src/lib/inbox/prime-review.server.ts:259-271` throws `Error: PRIME_ACTOR_CLAIMS_SECRET is required` if secret absent; `inboxApiErrorResponse` at `apps/reception/src/lib/inbox/api-route-helpers.ts:73` defaults to status 502.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Rename actorSource in review-campaign-send.ts and review-thread-send.ts | 97% | S | Complete (2026-03-14) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Update actorSource assertions in review-threads.test.ts | 97% | S | Complete (2026-03-14) | TASK-01 | - |
| TASK-03 | IMPLEMENT | Update PRIME_ACTOR_CLAIMS_SECRET comment in both .env.example files | 95% | S | Complete (2026-03-14) | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — server-side only; no UI changes | None | No rendering path or visual design involved |
| UX / states | N/A — no UI state paths affected | None | Server-side CF Pages Function changes only |
| Security / privacy | N/A — actorSource is labelling only; HMAC-SHA256 auth path unchanged | None | Renaming a free-form audit string does not affect auth correctness; `.env.example` update is documentation only |
| Logging / observability / audit | Required — actorSource in D1 records becomes `'reception_staff'` (accurate); `.env.example` wording improvement reduces time-to-diagnose misconfiguration | TASK-01, TASK-03 | Audit clarity improvement; no new logging infrastructure |
| Testing / validation | Required — 2 test fixture strings in `review-threads.test.ts` must be updated to match renamed actorSource | TASK-02 | Predictable scope: lines 2742 and 3045 only; no new test complexity |
| Data / contracts | N/A — `actorSource` is free-form TEXT; no schema migration; no breaking contract change | None | D1 column type confirmed free-form; no API contract surface change |
| Performance / reliability | N/A — no hot paths affected; string literal rename only | None | No performance change |
| Rollout / rollback | Required — TASK-01 and TASK-02 must land together; TASK-03 is independent; single PR rollback by reverting string values | TASK-01, TASK-02, TASK-03 | No deploy-order constraint; CF Pages redeploy sufficient for rollback |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03 | - | Independent; can be done in parallel within the same PR |
| 2 | TASK-02 | TASK-01 | Must follow TASK-01; both in same PR commit |

## Delivered Processes

None: no material process topology change. This plan renames a free-form audit label in two Prime API files, updates two test fixture strings, and updates comment wording in two `.env.example` files. No workflow, lifecycle state, CI lane, deploy sequence, approval path, or operator runbook is altered.

## Tasks

---

### TASK-01: Rename actorSource in review-campaign-send.ts and review-thread-send.ts
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/prime/functions/api/review-campaign-send.ts` and `apps/prime/functions/api/review-thread-send.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/prime/functions/api/review-campaign-send.ts`, `apps/prime/functions/api/review-thread-send.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 97%
  - Implementation: 97% — exact lines confirmed (review-campaign-send.ts:67, review-thread-send.ts:66); trivial string substitution; no logic change
  - Approach: 98% — `actorSource` is confirmed free-form TEXT; no downstream consumers branch on its value; rename is safe
  - Impact: 97% — new D1 records will carry `'reception_staff'`; historical records remain as-is (expected and documented)
- **Acceptance:**
  - `grep -r "reception_proxy" apps/prime/functions/api/` returns no matches.
  - `grep "actorSource" apps/prime/functions/api/review-campaign-send.ts` returns `actorSource: 'reception_staff'`.
  - `grep "actorSource" apps/prime/functions/api/review-thread-send.ts` returns `actorSource: 'reception_staff'`.
- **Engineering Coverage:**
  - UI / visual: N/A — server-side CF Pages Function; no rendering path
  - UX / states: N/A — no UI state change
  - Security / privacy: N/A — `actorSource` is a free-form audit label; HMAC-SHA256 identity verification path is unchanged
  - Logging / observability / audit: Required — `actorSource` in D1 records becomes `'reception_staff'` for all new writes from these two endpoints; accurate audit trail for thread-send and campaign-send paths
  - Testing / validation: N/A — no test assertions in source files; TASK-02 owns the fixture updates in the test files
  - Data / contracts: N/A — `actorSource` is free-form TEXT; no schema migration; no API contract change
  - Performance / reliability: N/A — string literal rename only; zero runtime performance impact
  - Rollout / rollback: Required — must land in same PR as TASK-02 (merging alone breaks CI); CF Pages redeploy sufficient; rollback by reverting `'reception_staff'` back to `'reception_proxy'` in both files
- **Validation contract (TC-01):**
  - TC-01: `grep -r "reception_proxy" apps/prime/functions/api/` → zero matches
  - TC-02: `grep "actorSource" apps/prime/functions/api/review-thread-send.ts` → contains `'reception_staff'`
  - TC-03: `grep "actorSource" apps/prime/functions/api/review-campaign-send.ts` → contains `'reception_staff'`
- **Execution plan:** Red → Green → Refactor
  - In `apps/prime/functions/api/review-thread-send.ts` at line 66: change `actorSource: 'reception_proxy'` → `actorSource: 'reception_staff'`
  - In `apps/prime/functions/api/review-campaign-send.ts` at line 67: change `actorSource: 'reception_proxy'` → `actorSource: 'reception_staff'`
  - Verify no other `'reception_proxy'` strings remain in `apps/prime/functions/api/`
- **Planning validation (required for M/L):** None: S effort — file paths and exact lines confirmed by direct read; no additional validation required
- **Scouts:** None: source confirmed as free-form string; no downstream consumers branch on actorSource value; no schema migration needed
- **Edge Cases & Hardening:**
  - Historical D1 records retain `'reception_proxy'` — expected and acceptable; no mitigation needed.
  - `review-campaign-send` has no current Reception caller — rename is preemptive correctness for future direct API callers, not a live compat fix.
- **What would make this >=90%:** Already at 97%; no blocking uncertainty remains.
- **Rollout / rollback:**
  - Rollout: Deploy as part of normal Prime CF Pages release; no deploy-order constraint vs Reception.
  - Rollback: Revert both string values to `'reception_proxy'` and redeploy. Historical records unaffected.
- **Documentation impact:** None: `.env.example` documentation handled in TASK-03.
- **Notes / references:**
  - Confirmed: `staff-broadcast-send.ts:129` already uses `'reception_staff_compose'` — choosing `'reception_staff'` (not `'reception_staff_compose'`) preserves per-path distinguishability for audit purposes.
  - `review-campaign-send` has no current Reception caller (TC-02 in `send-prime-inbox-thread.test.ts` asserts `sendPrimeInboxThread` never calls this endpoint; `replayPrimeInboxCampaignDelivery` calls `/api/review-campaign-replay`); this rename is a correctness fix for any future direct caller.
  - See `docs/plans/reception-prime-actor-claims-compat/analysis.md` § Chosen Approach for full rationale.
- **Build evidence (Complete 2026-03-14):**
  - Mode 2 (Data Simulation). Attempt 1. Result: Pass.
  - `grep "actorSource" apps/prime/functions/api/review-thread-send.ts` → `actorSource: 'reception_staff'` ✓
  - `grep "actorSource" apps/prime/functions/api/review-campaign-send.ts` → `actorSource: 'reception_staff'` ✓
  - `grep -r "reception_proxy" apps/prime/functions/api/` → 0 matches ✓
  - Typecheck: `pnpm --filter @apps/prime typecheck` exits 0 ✓
  - Committed in commit `33ae94be06` (Wave 2 prime shared contract build, same writer-lock batch).
  - Engineering coverage: Logging/observability/audit — actorSource in new D1 records is 'reception_staff' ✓

---

### TASK-02: Update actorSource assertions in review-threads.test.ts
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/prime/functions/__tests__/review-threads.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/prime/functions/__tests__/review-threads.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 97%
  - Implementation: 97% — exact fixture strings confirmed at lines 2742 and 3045; trivial string substitution within JSON fixture strings; no logic change
  - Approach: 98% — test fixtures must mirror the source values to pass CI; the target value is the same as TASK-01's output
  - Impact: 97% — CI passes after TASK-01+TASK-02 are committed together
- **Acceptance:**
  - Line 2742 `source_metadata_json` fixture string contains `"actorSource":"reception_staff"`.
  - Line 3045 `source_metadata_json` fixture string contains `"actorSource":"reception_staff"`.
  - `grep '"reception_proxy"' apps/prime/functions/__tests__/review-threads.test.ts` returns no matches.
  - `staff-broadcast-send.test.ts:244` assertion for `'reception_staff_compose'` is unchanged (out of scope).
- **Engineering Coverage:**
  - UI / visual: N/A — test file only; no rendering path
  - UX / states: N/A — no UI state
  - Security / privacy: N/A — test fixture string update only
  - Logging / observability / audit: N/A — fixture strings mirror source values; no audit logic in tests
  - Testing / validation: Required — two fixture strings at exactly-identified lines must be updated to unblock CI after TASK-01; no new test cases added
  - Data / contracts: N/A — fixture strings describe expected D1 record state; updating them to match the renamed actorSource value is a contract consistency fix
  - Performance / reliability: N/A — test-only change
  - Rollout / rollback: Required — must commit in same PR as TASK-01; rollback by reverting both files together
- **Validation contract:**
  - TC-01: `grep '"actorSource":"reception_staff"' apps/prime/functions/__tests__/review-threads.test.ts` → matches at (at least) lines 2742 and 3045
  - TC-02: `grep '"actorSource":"reception_proxy"' apps/prime/functions/__tests__/review-threads.test.ts` → zero matches
  - TC-03: `grep "reception_staff_compose" apps/prime/functions/__tests__/staff-broadcast-send.test.ts` → line 244 still present (no regression)
- **Execution plan:** Red → Green → Refactor
  - In `apps/prime/functions/__tests__/review-threads.test.ts` at line 2742: change `"actorSource":"reception_proxy"` → `"actorSource":"reception_staff"` within the `source_metadata_json` fixture string
  - In `apps/prime/functions/__tests__/review-threads.test.ts` at line 3045: same change
  - Verify no other `"reception_proxy"` strings remain in the file
- **Planning validation (required for M/L):** None: S effort — exact lines confirmed by direct read; no additional validation required
- **Scouts:** None: fixture strings are hardcoded JSON fragments; no dynamic generation involved
- **Edge Cases & Hardening:**
  - Ensure the JSON within `source_metadata_json` is syntactically valid after the edit (it is a string-literal embedded in a TS fixture; the change is a value substitution only).
  - `staff-broadcast-send.test.ts:244` uses `'reception_staff_compose'` and must NOT be changed.
- **What would make this >=90%:** Already at 97%.
- **Rollout / rollback:**
  - Rollout: Same commit/PR as TASK-01.
  - Rollback: Revert alongside TASK-01.
- **Documentation impact:** None.
- **Notes / references:**
  - Line numbers reference the state of the file as read on 2026-03-14. The fixture strings are inside `D1PreparedStatement` mock arrays within large test blocks; edits are string-level only.
- **Build evidence (Complete 2026-03-14):**
  - Mode 2 (Data Simulation). Attempt 1. Result: Pass.
  - `grep '"actorSource":"reception_staff"' apps/prime/functions/__tests__/review-threads.test.ts` → matches at lines 2742 and 3045 ✓
  - `grep '"actorSource":"reception_proxy"' apps/prime/functions/__tests__/review-threads.test.ts` → 0 matches ✓
  - `grep "reception_staff_compose" apps/prime/functions/__tests__/staff-broadcast-send.test.ts` → present and unchanged ✓
  - Committed in commit `33ae94be06` (same writer-lock batch as TASK-01).
  - Engineering coverage: Testing/validation — both fixture strings updated; CI will pass ✓

---

### TASK-03: Update PRIME_ACTOR_CLAIMS_SECRET comment in both .env.example files
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/prime/.env.example` and `apps/reception/.env.example`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/prime/.env.example`, `apps/reception/.env.example`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — comment-only edit in tracked files; no runtime impact; wording is well-defined from analysis
  - Approach: 97% — `.env.example` files are the only durable tracked fix surface for local-dev DX; `.env.local` is gitignored
  - Impact: 93% — DX improvement for future contributors; no operational risk
- **Acceptance:**
  - `apps/prime/.env.example` `PRIME_ACTOR_CLAIMS_SECRET` comment block explicitly states that the **primary** failure mode for a missing secret in local dev is a **Reception-side 502** (thrown by `buildPrimeActorHeaders()` before Prime is called; surfaced via `inboxApiErrorResponse`), not just a Prime-side 503.
  - `apps/reception/.env.example` `PRIME_ACTOR_CLAIMS_SECRET` comment block is updated to describe the same Reception-side 502 failure mode explicitly (previously vague: "Reception cannot sign actor claims; Prime mutation endpoints will fail").
  - No env var values are changed; only comment lines are edited.
  - Both files remain syntactically valid shell-env format.
- **Engineering Coverage:**
  - UI / visual: N/A — documentation file only
  - UX / states: N/A — no UI state
  - Security / privacy: N/A — comment update only; no secrets or values changed
  - Logging / observability / audit: Required — improves local-dev diagnostic clarity; contributors can identify the 502 failure root cause without reading source
  - Testing / validation: N/A — no test coverage needed for comment-only doc changes
  - Data / contracts: N/A — no schema or contract change
  - Performance / reliability: N/A — documentation only
  - Rollout / rollback: Required — documentation-only; rollback by reverting comment text in both `.env.example` files; no operational impact
- **Validation contract:**
  - TC-01: `grep -A5 "PRIME_ACTOR_CLAIMS_SECRET" apps/prime/.env.example` → comment block mentions "502" or "Reception-side" failure mode
  - TC-02: `grep -A5 "PRIME_ACTOR_CLAIMS_SECRET=" apps/reception/.env.example` → comment block mentions "502" or "Reception-side" failure mode explicitly
  - TC-03: `grep "PRIME_ACTOR_CLAIMS_SECRET=" apps/prime/.env.example` → still present (not removed)
  - TC-04: `grep "PRIME_ACTOR_CLAIMS_SECRET=" apps/reception/.env.example` → still present (not removed)
- **Execution plan:** Red → Green → Refactor
  - In `apps/prime/.env.example` lines 30–32: update the "Misconfiguration behaviour" block. Current text says "Missing or too short → all mutation endpoints return 503 (claims-secret-not-configured)". Update to add explicit note: the **primary** local-dev failure mode when the secret is absent from Reception's env is a **Reception-side 502** thrown by `buildPrimeActorHeaders()` before Prime is ever called — most routes surface this as 502 via `inboxApiErrorResponse`. The Prime-side 503 applies only when Prime's secret is absent or too short.
  - In `apps/reception/.env.example` lines 89–90: update the "Misconfiguration behaviour" block. Current text says "Missing → Reception cannot sign actor claims; Prime mutation endpoints will fail". Update to: "Missing → `buildPrimeActorHeaders()` throws before calling Prime; Reception routes surface this as 502 (not a Prime-side 503)".
- **Planning validation (required for M/L):** None: S effort — file content confirmed by direct read; wording target is well-defined
- **Scouts:** None: these are comment-only edits to tracked files; no dependencies
- **Edge Cases & Hardening:**
  - Do not change the `PRIME_ACTOR_CLAIMS_SECRET=` value line itself.
  - Do not alter other entries in the same files.
  - The Prime `.env.example` comment already mentions the `validatePrimeActorClaimsConfig` warns behaviour — this note may remain or be updated to clarify that `validatePrimeActorClaimsConfig` is currently not wired anywhere, so request-time failure is the only guaranteed signal.
- **What would make this >=90%:** Already at 95%. Residual 5% is the subjective judgement call on exact phrasing; any reasonable accurate description satisfies acceptance.
- **Rollout / rollback:**
  - Rollout: Can be included in the same PR as TASK-01+TASK-02 or a separate PR.
  - Rollback: Edit comments back; no operational impact.
- **Documentation impact:** This task is itself a documentation improvement. No further docs needed.
- **Notes / references:**
  - `buildPrimeActorHeaders()` source: `apps/reception/src/lib/inbox/prime-review.server.ts:259-271`
  - `inboxApiErrorResponse` default status 502: `apps/reception/src/lib/inbox/api-route-helpers.ts:73`
- **Build evidence (Complete 2026-03-14):**
  - Mode 2 (Data Simulation). Attempt 1. Result: Pass.
  - `apps/prime/.env.example` Misconfiguration block updated: mentions "502 via inboxApiErrorResponse (NOT a Prime-side 503)" and notes validatePrimeActorClaimsConfig not wired ✓
  - `apps/reception/.env.example` Misconfiguration block updated: "buildPrimeActorHeaders() throws before calling Prime; Reception routes surface this as 502 via inboxApiErrorResponse (not a Prime-side 503)" ✓
  - `PRIME_ACTOR_CLAIMS_SECRET=` entry still present in both files ✓
  - Committed in commit `33ae94be06` (same writer-lock batch).
  - Engineering coverage: Logging/observability/audit — .env.example wording now accurately describes Reception-side 502 failure mode ✓

---

## Risks & Mitigations
- **Historical D1 records**: `actorSource: 'reception_proxy'` in pre-fix records will be inconsistent with post-fix `'reception_staff'` records. Mitigation: none needed — expected and documented. Historical records remain valid audit data.
- **Undiscovered actorSource consumer**: Static search confirmed no branch/filter on this value; dynamic usage in operator tooling not fully auditable. Mitigation: planning confirms no BOS or reception reporting queries filter by `actorSource: 'reception_proxy'`; risk is low.
- **TASK-01/TASK-02 split commit**: If TASK-01 is merged without TASK-02, CI will fail. Mitigation: TASK-02 depends on TASK-01 explicitly; both must be in the same PR.

## Observability
- Logging: None — string rename; no new logs.
- Metrics: None — no metrics change.
- Alerts/Dashboards: None — no alerting impact.

## Acceptance Criteria (overall)
- [ ] `grep -r "reception_proxy" apps/prime/functions/api/` returns zero matches.
- [ ] `grep '"actorSource":"reception_proxy"' apps/prime/functions/__tests__/review-threads.test.ts` returns zero matches.
- [ ] `apps/prime/.env.example` and `apps/reception/.env.example` both describe the Reception-side 502 failure mode for missing `PRIME_ACTOR_CLAIMS_SECRET`.
- [ ] CI passes (review-threads.test.ts assertions pass with renamed value).
- [ ] `staff-broadcast-send.test.ts:244` assertion for `'reception_staff_compose'` is unchanged.

## Decision Log
- 2026-03-14: Chosen `'reception_staff'` over `'reception_staff_compose'` to preserve per-path distinguishability for D1 audit records. See analysis.md § Chosen Approach.
- 2026-03-14: Health-check endpoint for `validatePrimeActorClaimsConfig` deferred — operator input required on whether Prime should expose an unauthenticated endpoint.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Rename actorSource in review-campaign-send.ts and review-thread-send.ts | Yes — source file lines confirmed at review-campaign-send.ts:67 and review-thread-send.ts:66; no other callers depend on this string value | None | No |
| TASK-02: Update actorSource assertions in review-threads.test.ts | Yes — TASK-01 must complete first (dependency set); fixture lines confirmed at review-threads.test.ts:2742 and 3045; no dynamic fixture generation | None | No |
| TASK-03: Update PRIME_ACTOR_CLAIMS_SECRET comment in .env.example files | Yes — both .env.example files confirmed to contain PRIME_ACTOR_CLAIMS_SECRET= entries; comment blocks confirmed by direct read; fully independent of TASK-01/TASK-02 | None | No |

## Overall-confidence Calculation
- All tasks are S effort (weight 1)
- TASK-01: 97% × 1 = 97
- TASK-02: 97% × 1 = 97
- TASK-03: 95% × 1 = 95
- Overall: (97 + 97 + 95) / 3 = 96.3% → rounded to 95% (conservative rounding)
