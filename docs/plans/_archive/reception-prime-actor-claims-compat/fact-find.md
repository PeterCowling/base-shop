---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-prime-actor-claims-compat
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-prime-actor-claims-compat/analysis.md
Trigger-Source: direct-inject
Trigger-Why: Staff identity tokens missing from messaging requests would record a fake UID and silently block broadcasts; but this scope needs re-evaluation against the actual codebase state after prime-outbound-auth-hardening.
Trigger-Intended-Outcome: type: operational | statement: All Prime mutation endpoints correctly record verified staff identity with no silent fallbacks, and broadcast blocking has a visible error path. | source: auto
---

# Reception Prime Actor Claims Compat Fact-Find Brief

## Scope

### Summary

The dispatch (`IDEA-DISPATCH-20260314200000-0003`) describes a state where `resolveActorClaimsWithCompat()` falls back to `uid: 'reception_proxy', roles: []` when the `x-prime-actor-claims` header is absent, causing audit trail pollution and silent broadcast blocking. Investigation reveals this compat fallback was **fully removed** by commit `02435507f2` (TASK-07 of `prime-outbound-auth-hardening`, 2026-03-14). The function now hard-rejects with 401 on missing or invalid claims.

The residual scope — worth a targeted plan — consists of three distinct issues that survive the TASK-07 fix:

1. **`PRIME_ACTOR_CLAIMS_SECRET` not set in local dev**: `apps/reception/.env.local`, `apps/prime/.env.local`, and root `.env.local` all exist but none contain `PRIME_ACTOR_CLAIMS_SECRET`. When a Reception mutation is attempted locally, `buildPrimeActorHeaders()` throws `Error: PRIME_ACTOR_CLAIMS_SECRET is required to sign actor claims` — this causes a Reception-side 500 before Prime is ever called. On Prime's side, if the secret is absent from the CF env, the resolver returns 503 `claims-secret-not-configured`. Both failure modes manifest as opaque 500/503 errors with no clear operator-facing explanation. The `validatePrimeActorClaimsConfig` helper added in TASK-06 warns/throws at startup but only if explicitly called — it is not wired to a health-check route or startup hook on Prime CF Pages Functions (which have no startup hook).

2. **`actorSource: 'reception_proxy'` label is now misleading**: `review-campaign-send.ts` line 67 and `review-thread-send.ts` line 66 pass `actorSource: 'reception_proxy'` as an internal classification string into `sendPrimeReviewCampaign` and `sendPrimeReviewThread`. This is a different field from the uid fallback (which is gone), but the string `'reception_proxy'` in the audit trail suggests an anonymous proxy origin when the actor UID is now verified and populated. This should be `'reception_staff'` or similar.

3. **Deploy-order risk has no automated gate**: The results-review for `prime-outbound-auth-hardening` explicitly flagged: "TASK-07 carries a hard deploy-order requirement (Reception TASK-02 must be confirmed in production before TASK-07 is merged); this enforcement currently relies entirely on the PR description note with no automated check." This was deferred to a spike candidate but has not been addressed.

### Goals

1. Confirm the precise current codebase state of actor claims (compat path removal — confirmed complete).
2. Identify residual issues that still require work.
3. Scope a targeted plan covering: env var documentation/local-dev DX, `actorSource` label correctness, and optionally the deploy-order gap.

### Non-goals

- Rebuilding the actor claims system — it is correct and complete.
- Adding Firebase Admin SDK to Prime.
- Changing guest-facing auth flows.
- Retroactively correcting audit records with `reception_proxy` actorSource.

### Constraints & Assumptions

- Constraints:
  - Prime runs on Cloudflare Pages Functions; no traditional startup hook exists.
  - `PRIME_ACTOR_CLAIMS_SECRET` must be set in both Reception (signer) and Prime (verifier) CF environments with the same value.
  - The `actorSource` field is an internal string in the Prime D1 schema; changing it does not affect verifiability of the actor uid.
- Assumptions:
  - The compat window described in the dispatch no longer exists; the investigation confirmed removal.
  - Local dev failing with a Reception-side 500 (from `buildPrimeActorHeaders()` throwing when the secret is absent) is the primary DX issue remaining. The `.env.local` files are gitignored — the durable fix surface is the tracked `.env.example` files and/or project documentation, not the ignored local files themselves.
  - The `actorSource` label change is safe and does not require a schema migration (it is a free-form string column).

## Outcome Contract

- **Why:** The `prime-outbound-auth-hardening` build removed the compat fallback but left two residual correctness issues: `actorSource: 'reception_proxy'` in audit records is misleading now that the UID is verified, and the `PRIME_ACTOR_CLAIMS_SECRET` is absent from all local `.env.local` files causing opaque 500/503 errors for any local dev trying to use Prime mutation endpoints.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this change, `actorSource` in D1 audit records accurately reflects a verified Reception staff origin (`'reception_staff'` or equivalent), existing tests that pin `'reception_proxy'` are updated to the new value, and the existing `PRIME_ACTOR_CLAIMS_SECRET` entries in both `.env.example` files are updated with clearer wording about the Reception-side 500 failure mode (thrown by `buildPrimeActorHeaders()` before Prime is called) so new contributors can diagnose misconfiguration without reading the source.
- **Source:** auto

## Current Process Map

- Trigger: Staff member in Reception app performs any of 8 Prime mutation operations (draft save, resolve, dismiss, send, broadcast send, campaign create, campaign update, campaign send replay).
- End condition: Prime D1 record is written with a verified staff UID. Unauthorized or unsigned requests are rejected before any write occurs.

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Reception auth | Staff request hits Reception Next.js API route → `requireStaffAuth` validates Firebase ID token → extracts `{ uid, roles }` from RTDB userProfiles | Reception Next.js, Firebase RTDB | `apps/reception/src/app/api/mcp/_shared/staff-auth.ts` | None — this layer is correct |
| Actor claims signing | `buildPrimeActorHeaders(actorUid, roles)` signs `{ uid, roles, iat }` with `PRIME_ACTOR_CLAIMS_SECRET` via HMAC-SHA256 (`crypto.subtle`) → produces `x-prime-actor-claims: <b64url-payload>.<b64url-sig>` | `apps/reception/src/lib/inbox/prime-review.server.ts:259-271`, `apps/reception/src/lib/inbox/actor-claims.ts` | Missing env: `buildPrimeActorHeaders()` throws `Error: PRIME_ACTOR_CLAIMS_SECRET is required` → Reception returns 500 before Prime is called. This is the first failure mode for local dev (not Prime 503). Recovery: set secret in `.env.local`. |
| Prime claims verification | `resolveActorClaims(request, env)` or `resolveActorClaimsWithCompat(request, env)` (alias) → checks secret length ≥32 → verifies HMAC → checks iat clock skew ±5min → returns `{ uid, roles }` or 401/503 | `apps/prime/functions/lib/actor-claims-resolver.ts` | Missing env: returns 503 `claims-secret-not-configured`; missing header: returns 401 `missing`; bad sig: returns 401 `invalid-sig` |
| Broadcast role gate | After claims verified, `enforceBroadcastRoleGate(roles, uid)` checks roles ∈ `{owner, admin}` → returns 403 if not; applied on `staff-broadcast-send`, `review-campaign-send`, and conditionally on `review-thread-send` (broadcast threads only) | `apps/prime/functions/lib/broadcast-role-gate.ts` | None — gate is correctly wired |
| actorSource field | After uid extracted, actorSource `'reception_proxy'` is passed as a classification string into `sendPrimeReviewThread`/`sendPrimeReviewCampaign` — stored in D1 for audit | `apps/prime/functions/api/review-thread-send.ts:66`, `apps/prime/functions/api/review-campaign-send.ts:67` | Misleading label: uid is now verified but actorSource still reads as anonymous proxy |

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:**
  - n/a
- **Expected Artifacts:**
  - n/a
- **Expected Signals:**
  - n/a

### Prescription Candidates

| Prescription ID | Prescription Family | Required Route | Required Inputs | Expected Artifacts | Expected Signals |
|---|---|---|---|---|---|
| n/a | n/a | n/a | n/a | n/a | n/a |

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/functions/lib/actor-claims-resolver.ts` — resolver that was previously `resolveActorClaimsWithCompat`; now a hard-gate; compat fallback removed in TASK-07 (commit `02435507f2`)
- `apps/reception/src/lib/inbox/prime-review.server.ts:259-271` — `buildPrimeActorHeaders` signing point; throws if `PRIME_ACTOR_CLAIMS_SECRET` absent
- `apps/prime/functions/api/staff-broadcast-send.ts` — broadcast endpoint; both `resolveActorClaims` and `enforceBroadcastRoleGate` applied

### Key Modules / Files

- `apps/prime/functions/lib/actor-claims.ts` — `signActorClaims`/`verifyActorClaims` HMAC-SHA256 utilities (Prime side, also used by tests)
- `apps/reception/src/lib/inbox/actor-claims.ts` — `signActorClaims` only (Reception sign-only half)
- `apps/prime/functions/lib/actor-claims-resolver.ts` — `resolveActorClaims`, `resolveActorClaimsWithCompat` (alias), `validatePrimeActorClaimsConfig`
- `apps/prime/functions/lib/broadcast-role-gate.ts` — `enforceBroadcastRoleGate`, `isBroadcastRoleAuthorized`
- `apps/prime/.env.example` — documents `PRIME_ACTOR_CLAIMS_SECRET` with generation instructions
- `apps/reception/.env.example` — documents `PRIME_ACTOR_CLAIMS_SECRET` with generation instructions
- `apps/prime/wrangler.toml` — documents secret as required with wrangler command
- `apps/reception/wrangler.toml` — documents secret as required with wrangler command
- `apps/prime/functions/__tests__/helpers.ts` — `TEST_ACTOR_CLAIMS_SECRET`, `signTestActorClaims`, `createMockEnv` (default includes secret)
- `apps/prime/functions/__tests__/actor-claims-config.test.ts` — TASK-06 validation tests (8 TCs)

### Patterns & Conventions Observed

- Fixed field ordering for HMAC: both implementations serialize as `{ uid, roles, iat }` — byte-identical round-trips confirmed. Evidence: `apps/prime/functions/lib/actor-claims.ts:74` (`serializePayload` function with comment "Fixed field order: uid, roles, iat") and `apps/reception/src/lib/inbox/actor-claims.ts:51` (inline comment "Fixed field order: uid, roles, iat — canonical for this header contract").
- `resolveActorClaimsWithCompat` is an alias for `resolveActorClaims` — the function name was preserved to avoid a large rename, but the compat fallback logic (uid: 'reception_proxy', roles: []) was removed entirely. The docstring confirms this: "The compat fallback (plain x-prime-actor-uid header) was removed in TASK-07."
- `PRIME_ACTOR_CLAIMS_SECRET` is documented as required in both `.env.example` files and both `wrangler.toml` files. It is not set in root `.env.local` (confirmed absent).
- `actorSource` field is distinct from actor uid — it is a free-form classification string, not a security boundary. The string `'reception_proxy'` in this field survived TASK-07 because it refers to the origin path, not the uid fallback.

### Data & Contracts

- Types/schemas/events:
  - `ActorClaims: { uid: string; roles: string[]; iat: number }` — defined in `apps/prime/functions/lib/actor-claims.ts:23-27`
  - `ResolvedActorClaims: { uid: string; roles: string[] }` — returned by resolver after timestamp is consumed
  - `ActorClaimsEnv: { PRIME_ACTOR_CLAIMS_SECRET?: string }` — Prime env interface
  - Header format: `x-prime-actor-claims: <b64url-payload>.<b64url-sig>` where payload is UTF-8 JSON of `ActorClaims` encoded as base64url
- Persistence:
  - Actor UID written to D1 `message_drafts.created_by_uid` and `message_campaigns.created_by_uid`
  - `actorSource` written to D1 audit/message records (free-form classification)
- API/contracts:
  - All 8 mutation endpoints call `resolveActorClaims`/`resolveActorClaimsWithCompat` before any D1 write
  - Broadcast endpoints additionally call `enforceBroadcastRoleGate` after claims verification

### Dependency & Impact Map

- Upstream dependencies:
  - `PRIME_ACTOR_CLAIMS_SECRET` must be set in both Reception CF Worker env and Prime CF Pages env
  - Firebase auth (Reception side) provides uid and roles; these are signed and forwarded
- Downstream dependents:
  - Prime D1 audit records (`message_drafts`, `message_campaigns`) rely on `created_by_uid` being real
  - Broadcast role gate downstream of claims verification
- Likely blast radius:
  - Scope is small: `actorSource` label change touches 2 files; env var local-dev documentation touches `.env.example` files and optionally `AGENTS.md`/memory
  - No schema changes required

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (Prime functions test suite)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/prime/jest.config.ts` (CI only)
- CI integration: Yes, runs in CI

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Actor claims config validation | Unit | `apps/prime/functions/__tests__/actor-claims-config.test.ts` | 8 TCs covering missing/short/same-as-gateway/valid; production vs dev mode |
| Actor claims signing round-trip | Implicitly via mutation endpoint tests | `apps/prime/functions/__tests__/review-threads.test.ts`, `review-campaign-auth.test.ts`, `staff-initiate-thread.test.ts` | Uses `signTestActorClaims` helper |
| Missing claims → 401 | TASK-07 TC-A03 | `apps/prime/functions/__tests__/review-threads.test.ts` | Confirmed: missing header → 401 |
| Broadcast role gate | TC-B01 (DM allow), TC-B02 (broadcast block without role) | `apps/prime/functions/__tests__/staff-initiate-thread.test.ts` | Conditional gate confirmed |
| Reception signing path | Unit-ish | `apps/reception/src/lib/inbox/__tests__/initiate-prime-outbound-thread.test.ts` | Tests signing via `buildPrimeActorHeaders` |

#### Coverage Gaps

- `apps/reception/src/lib/inbox/__tests__/initiate-prime-outbound-thread.test.ts:98` asserts that `x-prime-actor-claims` is omitted when `actorUid` is absent — the header omission is covered. The uncovered gap is what happens when a Reception API route calls a Prime mutation while actorUid is undefined and Prime returns 401 — the caller's handling of that 401 is not tested.
- No integration test for the cross-process sign→verify round-trip with the real shared secret.
- `actorSource` field value is pinned in existing tests: `apps/prime/functions/__tests__/review-threads.test.ts:2742,3045` assert `actorSource: 'reception_proxy'` in `source_metadata_json`; `apps/prime/functions/__tests__/staff-broadcast-send.test.ts:244` asserts `actorSource: 'reception_staff_compose'`. An `actorSource` label rename on `review-campaign-send.ts` and `review-thread-send.ts` requires updating these test assertions to match the new value.

### Recent Git History (Targeted)

- `apps/prime/functions/lib/actor-claims-resolver.ts` — `02435507f2` (TASK-07): compat fallback removed; `resolveActorClaimsWithCompat` became alias; `f34f5ee936` (TASK-06): `validatePrimeActorClaimsConfig` added
- `apps/prime/functions/lib/actor-claims.ts` — `6ba8330911` (TASK-01): initial HMAC utilities
- `apps/reception/src/lib/inbox/actor-claims.ts` — `6ba8330911` (TASK-01): Reception sign-only half

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No UI changes involved in residual scope | None | No |
| UX / states | N/A | Server-side only; no UI state paths affected | None | No |
| Security / privacy | Required | HMAC-SHA256 claims fully implemented and verified; compat fallback removed; broadcast role gate active; `actorSource` label mismatch is labelling only, not a security gap | `actorSource: 'reception_proxy'` could confuse audit readers but does not affect auth correctness | Yes — analysis should confirm `actorSource` label change is audit-correctness, not security |
| Logging / observability / audit | Required | `resolveActorClaims` logs structured errors for all rejection cases; `validatePrimeActorClaimsConfig` warns/throws at startup | Missing env var causes Reception-side 500 before Prime is called — not a Prime-side 503; `actorSource: 'reception_proxy'` in audit records is misleading now that UID is verified | Yes — env var DX and actorSource label |
| Testing / validation | Required | Config validation tests: 8 TCs; mutation endpoint tests use `signTestActorClaims`; TASK-07 missing-claims→401 confirmed; `actorSource` pinned in `review-threads.test.ts:2742,3045` and `staff-broadcast-send.test.ts:244`; header omission for `actorUid=undefined` covered in `initiate-prime-outbound-thread.test.ts:98` | Gap: test for downstream Reception route handling when Prime returns 401 (not the header omission itself, but the error surfacing path) | Yes — targeted gap fill |
| Data / contracts | Required | `ActorClaims` type and payload format stable; field ordering canonicalized; sign/verify implementations are byte-identical | `actorSource` value in D1 is stale string — not a schema gap but an audit data quality issue | Yes — actorSource label |
| Performance / reliability | N/A | HMAC-SHA256 via `crypto.subtle` is ~0.1ms per call; no performance concern | None | No |
| Rollout / rollback | Required | Both `resolveActorClaims` and the alias `resolveActorClaimsWithCompat` are fully hardened; no compat window remains; deploy-order risk is documented but not gated | Deploy-order risk (Reception TASK-02 confirmed before TASK-07 merged) has no automated enforcement; documented as spike in results-review | Yes — carry deploy-order gap to analysis as advisory |

## Questions

### Resolved

- Q: Does `resolveActorClaimsWithCompat` still have the `reception_proxy` fallback?
  - A: No. TASK-07 (commit `02435507f2`, 2026-03-14) removed the fallback. The function is now an alias for `resolveActorClaims` and hard-rejects with 401 when the header is absent.
  - Evidence: `apps/prime/functions/lib/actor-claims-resolver.ts:90-95`, docstring: "The compat fallback (plain x-prime-actor-uid header) was removed in TASK-07."

- Q: Is `PRIME_ACTOR_CLAIMS_SECRET` set in any deployment environment?
  - A: Documented as required in both `.env.example` files and both `wrangler.toml` files. The actual secret value would be in CF secrets (wrangler pages secret put / wrangler secret put) for production/staging — not inspectable from the repo. Confirmed absent from root `.env.local` and from any app-level `.env.local`.
  - Evidence: `apps/prime/.env.example:33`, `apps/reception/.env.example:93`, `apps/prime/wrangler.toml:32-39`, `apps/reception/wrangler.toml:47-58`

- Q: Are the sign/verify implementations byte-identical?
  - A: Yes. Both use `JSON.stringify({ uid: claims.uid, roles: claims.roles, iat })` with fixed field order `uid → roles → iat`. Reception's inline comment and Prime's `serializePayload` function confirm the same ordering. The `signTestActorClaims` helper in tests uses the same fixed ordering.
  - Evidence: `apps/prime/functions/lib/actor-claims.ts:73-74`, `apps/reception/src/lib/inbox/actor-claims.ts:50-51`

- Q: Which operations require actor claims (mutation) vs read-only?
  - A: 8 mutation endpoints require claims: `review-thread-draft` (PUT), `review-thread-resolve` (POST), `review-thread-dismiss` (POST), `review-thread-send` (POST), `staff-initiate-thread` (POST), `staff-broadcast-send` (POST), `review-campaign-send` (POST), `review-campaign` (POST create + PUT update). Read endpoints (`review-threads` GET list, `review-thread` GET detail, `review-campaign` GET) do not require claims.
  - Evidence: `apps/prime/functions/api/` — all 8 mutation files call `resolveActorClaims` or `resolveActorClaimsWithCompat`

- Q: Does any deployment currently rely on the compat path?
  - A: No. TASK-07 removed the compat path. Any deployment not sending signed claims would receive 401 (missing) at the Prime layer — it would not silently fall back to `reception_proxy`.
  - Evidence: `apps/prime/functions/lib/actor-claims-resolver.ts:61-67` — missing header → 401

- Q: Is the broadcast blocking behavior silent or visible?
  - A: Broadcast blocking is now a hard 403 with a machine-readable error body `{success: false, error: 'insufficient-role'}`. It is not silent. The previous silence (roles: [] from compat fallback) no longer exists.
  - Evidence: `apps/prime/functions/lib/broadcast-role-gate.ts:42-46`

- Q: When was the compat path introduced?
  - A: The compat fallback was introduced as a deliberate backward-compatibility window during `prime-outbound-auth-hardening` TASK-03 and removed in TASK-07. It was never a bug — it was a planned migration window. Both tasks completed on 2026-03-14.
  - Evidence: `docs/plans/_archive/prime-outbound-auth-hardening/plan.md:36-37`

### Open (Operator Input Required)

- Q: Should a health-check route be added to Prime that calls `validatePrimeActorClaimsConfig` and returns a degraded status when the secret is misconfigured, so that misconfiguration is visible at deploy time without waiting for the first real request?
  - Why operator input is required: this requires a decision about whether Prime should expose an unauthenticated health/status endpoint, which is a product and security trade-off.
  - Decision impacted: scope of the planned fix (whether it includes a new Prime health endpoint)
  - Decision owner: operator
  - Default assumption: no health endpoint; rely on per-request 503 logging only. Note: `validatePrimeActorClaimsConfig()` is defined but not invoked anywhere in `apps/prime` today — it is not wired to any startup or health path; the only guaranteed signal is request-time failure. Risk: misconfiguration is invisible until the first mutation request fails.

## Confidence Inputs

- Implementation: 95% — the compat path removal is complete and confirmed; residual scope (actorSource label, env DX) is straightforward
  - What would raise to 99%: CI test run confirming TASK-07 tests pass
- Approach: 90% — the residual issues are low-risk cosmetic/DX fixes
  - What would raise to 95%: confirmation that `actorSource` column is free-form (not an enum constraint in D1 schema)
- Impact: 85% — primary impact is audit record clarity and local dev DX
  - What would raise to 90%: confirmation that the `actorSource` field is displayed in any operator-visible report
- Delivery-Readiness: 90% — all code paths well-understood; scope is small
  - What would raise to 95%: operator confirms health endpoint is out of scope
- Testability: 90% — straightforward unit test additions; no E2E required
  - What would raise to 95%: `actorSource` value is asserted in one existing test

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `PRIME_ACTOR_CLAIMS_SECRET` not set in production CF environment | Low (documented and wrangler.toml has instructions) | High (all 8 mutation endpoints return 503) | Deploy runbook verification; `validatePrimeActorClaimsConfig` throws in production mode |
| Deploy-order regression: TASK-07 deployed before Reception TASK-02 | Low (already completed, historical risk) | High (all mutation endpoints would receive 401 for unsigned requests) | Risk is historical — both already deployed; no current active risk |
| `actorSource: 'reception_proxy'` misleads future audit analysis | Medium (any engineer reading D1 records would see this) | Low (no functional impact) | Rename to `'reception_staff'` in 2 files |
| `buildPrimeActorHeaders` returns `undefined` when `actorUid` is absent | Medium (callers use optional uid parameter) | Medium (no claims header sent → 401 from Prime) | Current behavior is correct rejection; but callers should handle 401 from Prime gracefully |

## Planning Constraints & Notes

- Must-follow patterns:
  - Any new env var references must be added to both `.env.example` files and both `wrangler.toml` files
  - `actorSource` field value change requires no D1 migration (free-form string)
  - Test changes must use `signTestActorClaims` helper from `helpers.ts` — do not duplicate HMAC logic in tests
- Rollout/rollback expectations:
  - `actorSource` label change: deploy together in one PR; no ordering requirement; rollback is safe
  - Historical D1 records with `reception_proxy` actorSource remain as-is (no retroactive correction)
- Observability expectations:
  - `resolveActorClaims` already logs structured errors; no new observability work needed

## Suggested Task Seeds (Non-binding)

- TASK-01: Rename `actorSource: 'reception_proxy'` → `'reception_staff'` in `review-campaign-send.ts` and `review-thread-send.ts`; update existing test assertions in `review-threads.test.ts:2742,3045` (which pin `'reception_proxy'` in `source_metadata_json`) to match the new value
- TASK-02: Update both `.env.example` files (`apps/reception/.env.example` and `apps/prime/.env.example`) to add an explicit note about the Reception-side 500 failure mode (when the secret is absent, Reception throws before calling Prime — not a Prime 503) so that local devs diagnosing failures have a clear starting point in the documented variable description
- TASK-03: Add test for Reception API route handling of 401 from Prime when the signed claims are invalid (bad secret mismatch scenario) — the live route paths always have a valid `auth.uid` from `requireStaffAuth`, so the test target is secret mismatch or clock-skew rejection, not `actorUid=undefined` which is a helper-only path
- TASK-04 (optional): Wire `validatePrimeActorClaimsConfig` to Prime's `/api/health` endpoint if one exists or is added

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - All 8 Prime mutation endpoints continue to reject unsigned requests with 401
  - `actorSource` field in D1 writes contains `'reception_staff'` or similarly accurate label
  - Tests cover `actorSource` assertion and `actorUid=undefined` path
- Post-delivery measurement plan:
  - Inspect a D1 query after next real broadcast to confirm actorSource is `reception_staff`

## Evidence Gap Review

### Gaps Addressed

- Confirmed whether compat fallback exists: removed in TASK-07 (commit `02435507f2`). No gap.
- Confirmed `PRIME_ACTOR_CLAIMS_SECRET` env var presence: absent from `.env.local` (both root and app-level). Present in `.env.example` and `wrangler.toml` documentation. CF production secrets are not inspectable from the repo — correctness in production cannot be confirmed statically.
- Confirmed sign/verify byte-identity: both implementations use `JSON.stringify({ uid, roles, iat })` with identical field ordering. Confirmed in both source files.
- Confirmed which operations require actor claims: 8 mutation endpoints identified. Read endpoints confirmed as not requiring claims.
- Confirmed broadcast blocking is not silent: hard 403 with structured error body after TASK-04.

### Confidence Adjustments

- Implementation confidence raised from initial 80% to 95% after confirming TASK-07 completion and reviewing all 8 mutation endpoint files.
- Scope narrowed from "remove compat path" to "actorSource label + env DX" — this lowers delivery effort significantly.

### Remaining Assumptions

- Production CF secrets contain `PRIME_ACTOR_CLAIMS_SECRET` set correctly (value matches between Prime and Reception workers). Cannot verify from repo.
- `actorSource` column in D1 is a free-form `TEXT` field (no enum constraint). Consistent with observed values (`reception`, `reception_staff_compose`, `reception_proxy`) — all strings, no schema hints of enumeration.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Compat fallback existence check | Yes | None — fallback confirmed removed by TASK-07 | No |
| 8 mutation endpoint coverage | Yes | None — all 8 files call resolveActorClaims | No |
| Byte-identical serialization | Yes | None — both implementations confirmed identical field ordering | No |
| `PRIME_ACTOR_CLAIMS_SECRET` deployment state | Partial | [Minor] Cannot confirm CF production secrets statically | No (runtime-only) |
| `actorSource` label scope | Yes | [Minor] Misleading string value in 2 files; no functional impact | No |
| Broadcast role gate | Yes | None — hard 403 confirmed; not silent | No |
| Reception signing error path | Yes | [Minor] `buildPrimeActorHeaders` returns undefined for `actorUid=undefined`; no claims header sent; Prime returns 401; callers must handle 401 | No |
| Deploy-order risk (historical) | Yes | [Minor] No automated gate; risk is historical (both tasks deployed same day) | No |

## Scope Signal

Signal: right-sized

Rationale: The dispatch described a problem already resolved; the fact-find identifies a realistic residual scope of 2–3 small tasks (actorSource label fix, env DX, targeted test additions). No expansion is warranted — the core security work is complete.

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: none
- Recommended next step: `/lp-do-analysis reception-prime-actor-claims-compat`
