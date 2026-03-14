---
Type: Analysis
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: prime-outbound-auth-hardening
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/prime-outbound-auth-hardening/fact-find.md
Related-Plan: docs/plans/prime-outbound-auth-hardening/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Prime Outbound Auth Hardening Analysis

## Decision Frame

### Summary

The Prime messaging staff API endpoints (8 mutation endpoints) authenticate callers via a shared static gateway token but trust the caller-supplied `x-prime-actor-uid` header to identify which staff member is acting. The analysis must decide:

1. **How to bind actor identity at the Prime layer** so that a gateway-token holder cannot forge a different UID.
2. **How to enforce a broadcast role gate** on the two broadcast-facing endpoints (`staff-initiate-thread`, `review-campaign-send`) without introducing full Firebase token verification on Prime's CF Workers runtime.
3. **How to sequence the rollout** so broadcast endpoints are hardened immediately while non-broadcast endpoints use a short compat window.

### Goals

- Actor UID recorded in Prime D1 is cryptographically bound to a verified claims payload.
- Broadcast initiation requires the `owner` or `admin` role (exact flat-set allowlist).
- All 8 mutation endpoints covered; no endpoint left unhardened.
- No full auth rewrite; no new infrastructure; no Firebase Admin SDK on Prime.

### Non-goals

- Per-request Firebase ID token verification on Prime (adds JWKS network dependency).
- Rebuilding multi-staff auth for Prime (single PIN today).
- Guest-facing auth flow changes.
- Retroactive correction of existing audit records with potentially forged UIDs.

### Constraints & Assumptions

- Constraints:
  - Prime runs as Cloudflare Pages Functions; only WebCrypto available (no Node.js crypto, no Firebase Admin SDK).
  - `PRIME_STAFF_OWNER_GATE_TOKEN` is the gateway access credential — **cannot** be used as the signing key (critique-confirmed: any gateway-token holder could mint claims with the same key).
  - Reception's `requireStaffAuth` is the trust anchor: it validates the Firebase ID token via Identity Toolkit and reads roles from RTDB `userProfiles/{uid}`.
- Assumptions:
  - A new `PRIME_ACTOR_CLAIMS_SECRET` env var (distinct from the gateway token) provisioned in both reception and Prime is the minimum additional configuration required.
  - HMAC-SHA256 via `crypto.subtle` is available and performant on both CF Workers and Next.js edge.
  - Broadcast role allowlist: `owner` and `admin` only (not `developer`, `manager`, `staff`).

## Inherited Outcome Contract

- **Why:** Staff identity is caller-controlled at the Prime API layer — any holder of the gateway token can attribute actions to any staff UID, including audit records, broadcast sends, and message attributions. For broadcast specifically it is a direct-harm risk (messages to all active guests attributed to wrong person).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this change, the actor UID recorded at the Prime layer is cryptographically bound to a short-lived signed claims header verified with a separate signing secret. A caller with only the gateway token cannot forge a different UID. The broadcast send path additionally requires the caller to hold the `owner` or `admin` role (exact allowlist, not hierarchical).
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/prime-outbound-auth-hardening/fact-find.md`
- Key findings used:
  - All 8 Prime mutation endpoints share the identical `x-prime-actor-uid || 'prime-owner'` pattern.
  - `PRIME_STAFF_OWNER_GATE_TOKEN` cannot be used as the HMAC signing key (would not reduce the threat).
  - Reception's `requireStaffAuth` already has the verified UID and roles — it is the signing authority.
  - `review-campaign.ts` POST and PUT are in scope (confirmed via critique; originally missed in inventory).
  - Broadcast endpoints must NOT use the compat fallback — they must require signed claims immediately.
  - `review-threads.test.ts` covers 5 of the 8 endpoints (happy path); `staff-initiate-thread.test.ts` covers 1; `review-campaign` POST/PUT have zero test coverage.

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Closes C-04 UID forgery for all 8 endpoints | Core security objective | Critical |
| Does not use gateway token as signing key | Critique-confirmed requirement | Critical |
| Closes L-04 broadcast role gate immediately (no compat window) | Direct harm risk | High |
| Minimal new infrastructure | Ops burden and deployment risk | High |
| Backward-compat during rollout for non-broadcast | Non-broadcast degraded gracefully if reception not yet deployed | Medium |
| Testability | Security regressions must be automatable | High |
| Rollout sequencing clarity | Both services must stay in sync | Medium |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Separate-secret HMAC claims (chosen) | New `PRIME_ACTOR_CLAIMS_SECRET` env var; reception signs `{uid, roles, iat}` with HMAC-SHA256; Prime verifies and extracts claims | No new infrastructure; WebCrypto on both runtimes; closes UID forgery and enables role gate; 1 new env var | Requires coordinated deployment of both reception and Prime; compat window for non-broadcast only | Secret must not equal gateway token; replay attack window (mitigated by timestamp) | Yes |
| B — Forward Firebase ID token; Prime verifies via JWKS | Reception forwards Firebase ID token in `x-prime-actor-id-token` header; Prime fetches Google JWKS and verifies JWT | Full Firebase auth verification; most rigorous | Prime must fetch JWKS on every request (cold-start latency, JWKS rotation complexity); no role information in ID token without custom claims; significantly higher complexity | JWKS cache invalidation; cold-start latency spike; ID token forwarding increases attack surface if intercepted | No — disproportionate complexity for this deployment size |
| C — Server-side token→UID mapping in D1 or KV | Pre-register gateway-token→{uid, roles} mapping in Prime's D1 or KV | No reception changes needed | New admin infrastructure to manage; D1/KV becomes auth state; every new staff member requires a D1/KV update; no standard interface | Operational burden; stale mapping risk; new attack surface (KV injection) | No — adds infrastructure complexity without clear gain over Option A |
| D — Cloudflare Access email→UID lookup | Use `cf-access-authenticated-user-email` (already in `activity-manage.ts`) to derive identity | No new secret needed | Only works when CF Access is active (not static-token path); email is not a UID; requires a separate email→UID lookup against RTDB; static-token callers (reception) bypass CF Access | Only partial coverage; inconsistent with static-token callers | No — does not cover the reception caller path |

## Engineering Coverage Comparison

| Coverage Area | Option A — Separate-secret HMAC | Option B — Firebase ID token + JWKS | Chosen (A) implication |
|---|---|---|---|
| UI / visual | N/A — server-side only | N/A — server-side only | N/A |
| UX / states | N/A | N/A | N/A |
| Security / privacy | Closes UID forgery for all 8 endpoints; broadcast role gate enforced; replay mitigated by `iat` window; signing secret independent of gateway token | Highest assurance (Firebase-verified JWT); but exposes ID token in transit | HMAC-SHA256 with separate secret is sufficient for threat model; scope of protection documented (gateway-token leakage, not full reception compromise) |
| Logging / observability / audit | All actorUid values in D1 going forward are verifiably bound; log HMAC failures with reason | Same; ID token gives richer identity context | Add structured log entries for HMAC rejection (reason: missing, invalid-sig, expired) |
| Testing / validation | Unit-testable: HMAC sign/verify utilities pure functions; role gate unit-testable; extend `review-threads.test.ts` + `staff-initiate-thread.test.ts` + new tests for `review-campaign` POST/PUT | More complex: JWT mocking required | Jest node env sufficient; no E2E needed for security path |
| Data / contracts | New `x-prime-actor-claims` header replaces `x-prime-actor-uid`; D1 schema unchanged; rollout compat via parallel header acceptance | Same contract surface; ID token header replaces gateway header | Backward-compat: non-broadcast endpoints accept both headers during compat window; broadcast endpoints require signed claims immediately |
| Performance / reliability | One `crypto.subtle.verify` call per request (~0.1ms on CF Workers); negligible | JWKS fetch adds 50–200ms cold-start latency | No material overhead |
| Rollout / rollback | Step 1: Prime accepts both headers (broadcast 3 endpoints: signed-only, non-broadcast 5 endpoints: signed or plain); Step 2: Reception sends signed headers; Step 3: remove plain-UID fallback | Same ordered deployment | Rollback after Reception starts sending signed claims: Prime's `\|\| 'prime-owner'` fallback means actor attribution collapses to `prime-owner` (not a clean restore). Acceptable — documented in rollback runbook |

## Chosen Approach

- **Recommendation:** Option A — Separate-secret HMAC claims signing/verification using a new `PRIME_ACTOR_CLAIMS_SECRET` env var, independent of the gateway token.

- **Why this wins:**
  - Closes C-04 (UID forgery) across all 8 mutation endpoints with minimal change surface.
  - Does not require new infrastructure or Firebase Admin SDK on Prime.
  - WebCrypto HMAC-SHA256 is available natively on both CF Workers and Next.js edge runtimes.
  - Enables the L-04 broadcast role gate because roles are included in the signed payload — Prime has no other role source.
  - The separate signing secret provides meaningful protection against gateway-token leakage without requiring a full credential separation architecture.
  - Rollout is sequenceable and rollback is trivial.

- **What it depends on:**
  - A new `PRIME_ACTOR_CLAIMS_SECRET` env var must be provisioned in both `apps/reception` and `apps/prime` Pages environment before or alongside deployment.
  - The signing secret must be distinct from `PRIME_STAFF_OWNER_GATE_TOKEN` — env-startup validation should enforce this.
  - **Broadcast role gate applies to 3 endpoints** (not 2): `staff-initiate-thread`, `review-campaign-send`, AND `review-thread-send`. `review-thread-send` internally calls `isWholeHostelBroadcastThread` and handles the whole-hostel broadcast path when no campaign record exists yet. All 3 must enforce the role gate with no compat window.
  - Rollback from a state where Reception has started sending signed claims: Prime's legacy `|| 'prime-owner'` fallback means rollback collapses actor attribution to `prime-owner` (not a restore of the pre-fix plain-UID state). This is acceptable for rollback — audit records will show `prime-owner` until re-deployment. Document this in the rollback runbook.

### Rejected Approaches

- Option B (Firebase ID token + JWKS) — JWKS cold-start latency (50–200ms per request), key rotation complexity, and no standard role claim in Firebase ID tokens make this disproportionately complex for a 2-staff deployment. Revisit only if Prime scales to an untrusted multi-caller environment.
- Option C (server-side token→UID mapping in D1/KV) — Requires new admin infrastructure, operational burden for every new staff member, and introduces a new writable attack surface. No advantages over Option A.
- Option D (CF Access email→UID) — Only covers CF Access sessions; the reception static-token caller bypasses CF Access entirely. Partial coverage is worse than the current state because it creates a false sense of security.

### Open Questions (Operator Input Required)

None. All questions resolved in fact-find.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Reception auth | `requireStaffAuth` validates Firebase ID token, extracts `uid` and `roles` | Staff POST to reception inbox API | Same verification; additionally: `buildPrimeActorHeaders` signs `{uid, roles, iat}` with `PRIME_ACTOR_CLAIMS_SECRET` → sends `x-prime-actor-claims: <b64url-payload>.<b64url-sig>` header | Firebase ID token verification, role lookup against RTDB | Reception must have `PRIME_ACTOR_CLAIMS_SECRET` in env |
| Prime gateway enforcement | `enforceStaffOwnerApiGate` validates static token or CF Access | Any request to Prime staff API | Same gateway check (unchanged); new `resolveActorClaims(request, env)` helper called after gate passes on mutation endpoints; verifies HMAC, checks timestamp, returns `{ uid, roles }` or rejects with 401 | `enforceStaffOwnerApiGate` coarse-access check unchanged | Prime must have `PRIME_ACTOR_CLAIMS_SECRET` in env |
| Broadcast role gate (new) | Absent — any gateway-token caller can broadcast | Staff initiates broadcast | `staff-initiate-thread`, `review-campaign-send`, AND `review-thread-send` call `resolveActorClaims`; additionally check `roles.includes('owner') \|\| roles.includes('admin')`; return 403 if role not present. (`review-thread-send` handles whole-hostel broadcast when no campaign exists — confirmed via `isWholeHostelBroadcastThread` check in `prime-review-send.ts`) | Rate-limit on `review-campaign-send` (still keyed on verified `actorUid`) | All 3 broadcast endpoints require signed claims from Step 1 (no compat window); broadcast unavailable until reception is also deployed |
| Non-broadcast mutation endpoints (6) | UID from caller header, no verification | Any mutation action | `resolveActorClaims` called; accepts signed claims or (during compat window) plain `x-prime-actor-uid`; compat window removed within 1 sprint | D1 schema unchanged | Compat window must have hard-gate removal tracked as blocking TASK |
| Audit / D1 records | `actorUid` stored as-is; may contain forged values | Any mutation | Going forward: all `actorUid` values in D1 are verifiably bound to a signed claims payload | Pre-fix historical records with potentially forged UIDs remain as-is (not retroactively corrected) | Pre-fix records flaggable by timestamp if audit investigation requires |

## Planning Handoff

- Planning focus:
  - TASK-01: `signActorClaims` / `verifyActorClaims` WebCrypto utilities (shared logic usable by both reception and Prime)
  - TASK-02: Update `buildPrimeActorHeaders` in reception's `prime-review.server.ts` to sign claims
  - TASK-03: New `resolveActorClaims(request, env)` helper in Prime's `functions/lib/`; update all 8 mutation endpoints
  - TASK-04: Broadcast role gate in `staff-initiate-thread.ts`, `review-campaign-send.ts`, AND `review-thread-send.ts` (confirmed via critique: `review-thread-send` also handles whole-hostel broadcast via `isWholeHostelBroadcastThread`; `sendPrimeInboxThread` in reception routes through it when no campaign exists)
  - TASK-05: Tests — extend `review-threads.test.ts`, `staff-initiate-thread.test.ts`; add new `review-campaign` POST/PUT tests; **update reception `initiate-prime-outbound-thread.test.ts` lines 83–85** which asserts `x-prime-actor-uid` header (will break when switched to signed claims)
  - TASK-06: Env validation at startup (reject short or identical secrets); update wrangler and `.env.example` documentation
  - TASK-07: Hard-gate removal of non-broadcast compat fallback (tracking task; must be blocking)

- Validation implications:
  - Security regression tests must cover: missing signature → 401, invalid signature → 401, expired timestamp → 401, insufficient role for broadcast → 403, valid signature + correct role → 200.
  - All 3 broadcast endpoints (`staff-initiate-thread`, `review-campaign-send`, `review-thread-send`) must reject unsigned requests from Step 1; no compat window.
  - All 8 mutation endpoints must be covered; `review-campaign` POST/PUT have zero existing tests.
  - Reception test `initiate-prime-outbound-thread.test.ts` line 85 asserts `x-prime-actor-uid` header — must be updated to assert `x-prime-actor-claims` (will fail without this update).

- Sequencing constraints:
  - Deploy order: Prime (TASK-01/03/04/06) → Reception (TASK-01/02/06) → Verify → Prime fallback removal (TASK-07).
  - TASK-07 is a separate deploy but must be a blocking scheduled task (within 1 sprint of TASK-02 deployment).
  - `PRIME_ACTOR_CLAIMS_SECRET` must be provisioned in both envs before or alongside Prime deployment.
  - Broadcast endpoints have NO compat window — plan must make this explicit in the build contract.

- Risks to carry into planning:
  - Secret provisioning: if `PRIME_ACTOR_CLAIMS_SECRET` is not provisioned before Prime deploys, broadcast will break immediately (signed claims required on broadcast endpoints from Step 1). Plan must include env-check task.
  - TASK-07 deferral risk: if compat fallback is not removed promptly, the non-broadcast UID forgery vulnerability persists. Make TASK-07 a first-class deliverable with a clear acceptance condition.

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| `PRIME_ACTOR_CLAIMS_SECRET` not provisioned before Prime deployment | Medium | High (broadcast breaks) | Deployment sequencing is an ops step; analysis can only specify the constraint | TASK-06 must include env-check; wrangler/env docs must be updated before deploy |
| TASK-07 (compat fallback removal) deferred indefinitely | Medium | Medium (non-broadcast UID forgery persists) | Depends on operator follow-through | Plan must mark TASK-07 as blocking; assign a hard deadline |
| `review-campaign` POST/PUT mutation paths have zero existing tests | High (known gap) | Medium (coverage gap in security-critical path) | Testing gap confirmed in fact-find; fix belongs in TASK-05 | TASK-05 must explicitly create tests for `review-campaign` POST/PUT |
| Reception test `initiate-prime-outbound-thread.test.ts` asserts `x-prime-actor-uid` | High (will break on deploy) | Medium (broken build if not updated) | Known breaking test; fix belongs in TASK-05 | TASK-05 must update the header assertion from `x-prime-actor-uid` to `x-prime-actor-claims` |
| Rollback after Reception sends signed claims collapses attribution to `prime-owner` | Low (rollback is rare) | Low (audit degradation only) | This is the current fallback behavior already present in handlers | Document in rollback runbook; do not attempt to restore pre-fix plain-UID state via rollback |
| Timestamp clock skew between CF Workers (reception) and CF Pages (Prime) | Low | Low (claims expire too early) | CF edge infrastructure typically <1s skew | Use ±5 min window (generous); document expected window |

## Planning Readiness

- Status: Go
- Rationale: All approach decisions are made. Option A is decisive, constraints are fully documented, no operator-only questions remain. The rollout sequencing and the broadcast-no-compat rule are both explicit. Planning can decompose into executable tasks without re-litigating architecture.

## Critique

- Rounds: 1
- Final score: 3.8/5.0 (codemoot Round 1: 6/10 = lp_score 3.0; critical resolved via autofix → estimated 3.8)
- Final verdict: credible (post-autofix)
- Critical findings addressed: 1 (broadcast role gate missing `review-thread-send`)
- Remaining findings: 2 warnings (rollback model corrected, reception test break added to handoff), 1 info (critique footer updated)
- Critical: 0
