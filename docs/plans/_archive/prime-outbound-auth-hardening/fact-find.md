---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: prime-outbound-auth-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/prime-outbound-auth-hardening/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260314160001-BRIK-004
Trigger-Why:
Trigger-Intended-Outcome:
---

# Prime Outbound Auth Hardening Fact-Find Brief

## Scope

### Summary

The Prime messaging staff API endpoints use a shared static gateway token (`PRIME_STAFF_OWNER_GATE_TOKEN`) or Cloudflare Access session cookie to authenticate callers, but then trust the caller-supplied `x-prime-actor-uid` request header to identify which staff member is acting. Any caller who holds the gateway token can assert any UID without server-side verification. This applies to **8** staff-facing mutation endpoints: `staff-initiate-thread`, `review-thread-draft`, `review-thread-resolve`, `review-thread-dismiss`, `review-thread-send`, `review-campaign-send`, `review-campaign` (POST create), and `review-campaign` (PUT update). The broadcast initiation path (`staff-initiate-thread` + `review-campaign-send`) is the most consequential because a single call sends a message to all active guests.

The caller of these endpoints is the reception app's Next.js API layer (`apps/reception/src/app/api/mcp/`), which does verify the staff member's Firebase ID token before forwarding requests to Prime (`requireStaffAuth` in `apps/reception/src/app/api/mcp/_shared/staff-auth.ts`). So at the Prime→Reception integration layer, identity is derived from a verified token. The vulnerability is that the Prime Cloudflare Pages Functions have no way to confirm the UID they receive actually corresponds to the token used to pass the gateway.

### Goals

1. Ensure `x-prime-actor-uid` arriving at Prime API endpoints is verifiably bound to the caller identity, not freely injectable by the caller.
2. Add a broadcast role permission gate — only staff with at least `admin` or `owner` role can trigger a whole-hostel broadcast.
3. Do so without requiring a full Firebase SDK on the Cloudflare Pages Functions layer.

### Non-goals

- Rebuilding the full multi-staff auth system for Prime (out of scope; currently a single shared PIN).
- Adding per-request Firebase token verification on all Prime endpoints (the CF Worker environment lacks the Firebase Admin SDK).
- Changing guest-facing auth flows.

### Constraints & Assumptions

- Constraints:
  - Prime runs as Cloudflare Pages Functions; no Firebase Admin SDK, no Node.js crypto beyond WebCrypto.
  - The static gateway token `PRIME_STAFF_OWNER_GATE_TOKEN` is a shared secret used as the access credential — it CANNOT be used as the HMAC signing key (critique finding C-01: any gateway-token holder could mint valid claims).
  - The reception app has Firebase ID tokens for every authenticated staff member (from `requireStaffAuth`).
  - Cloudflare Access (`cf-access-authenticated-user-email`) is available in production but only gives an email, not a UID.
- Assumptions:
  - The correct minimal fix requires a **separate** signing secret (`PRIME_ACTOR_CLAIMS_SECRET`) present in both the reception app env and the Prime Pages Functions env, independent of `PRIME_STAFF_OWNER_GATE_TOKEN`. Reception signs a short-lived claims payload; Prime verifies. A forger who holds only the gateway token cannot mint valid claims without the separate signing secret.
  - `requireStaffAuth` in reception already validates the Firebase ID token and extracts UID and roles — these are the authoritative values to sign.
  - Broadcast role gate requires `owner` or `admin`. `developer` is excluded (see Resolved questions).

## Outcome Contract

- **Why:** Staff identity is caller-controlled at the Prime API layer — any holder of the gateway token can attribute actions to any staff UID, including audit records, broadcast sends, and message attributions. This is a correctness and audit-integrity issue, and for broadcast specifically it is a direct-harm risk (messages to all active guests attributed to wrong person).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this change, the actor UID recorded at the Prime layer is cryptographically bound to a short-lived signed claims header verified with a separate signing secret. A caller with only the gateway token cannot forge a different UID. The broadcast send path additionally requires the caller to hold the `owner` or `admin` role (exact allowlist, not hierarchical — roles are a flat set).
- **Source:** auto

## Current Process Map

- Trigger: Staff member in the reception app initiates a whole-hostel broadcast via the "Prime compose" UI.
- End condition: Message is queued for delivery to all active guests; draft is created in the Prime D1 database attributed to a staff UID; telemetry event is recorded in the reception database.

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Reception auth (verified) | Staff fires POST /api/mcp/inbox/prime-compose → `requireStaffAuth` validates Firebase ID token via Identity Toolkit API → retrieves roles from RTDB `userProfiles/{uid}` → returns `{ uid, roles }` | Reception Next.js API layer | `apps/reception/src/app/api/mcp/_shared/staff-auth.ts` lines 120–164 | None; this layer is correctly gated |
| Reception→Prime forwarding | `initiatePrimeOutboundThread({ text, actorUid: auth.uid })` called → adds `x-prime-actor-uid: <uid>` header → calls Prime `POST /api/staff-initiate-thread` with gateway token | `apps/reception/src/lib/inbox/prime-review.server.ts` `buildPrimeActorHeaders` | lines 258–260 | UID is forwarded as a plain header — no signature |
| Prime gateway enforcement | `enforceStaffOwnerApiGate` checks: if dev, pass; if `PRIME_ENABLE_STAFF_OWNER_ROUTES=true`, pass; else check `cf-access-authenticated-user-email` or `x-prime-access-token == PRIME_STAFF_OWNER_GATE_TOKEN` | Prime Cloudflare Pages Function | `apps/prime/functions/lib/staff-owner-gate.ts` | Validates caller has token; does NOT bind token to any specific identity |
| Prime actor UID consumption | `const actorUid = request.headers.get('x-prime-actor-uid')?.trim() \|\| 'prime-owner'` — trusted as-is; recorded in draft, mutations, and campaign records | `staff-initiate-thread.ts`, `review-thread-resolve.ts`, `review-thread-dismiss.ts`, `review-thread-draft.ts`, `review-thread-send.ts`, `review-campaign-send.ts`, `review-campaign.ts` (POST line 77), `review-campaign.ts` (PUT line 122) | All 8 endpoints | **C-04: UID is caller-controlled** — any valid gateway token holder can assert any UID |
| Broadcast send execution | `review-campaign-send.ts` reads actorUid from header → passes to `sendPrimeReviewCampaign` as actorSource `reception_proxy` → no role check on actorUid | `apps/prime/functions/api/review-campaign-send.ts` lines 26–50 | **L-04: No broadcast role gate** — any valid gateway token holder can trigger broadcast |

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:** n/a
- **Expected Artifacts:** n/a
- **Expected Signals:** n/a

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/functions/api/staff-initiate-thread.ts` — creates broadcast thread + initial draft; reads actor UID from header (line 43)
- `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts` — reception route that drives the full broadcast initiation; verified auth at line 13; forwards verified uid at lines 42–44
- `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts` — send-existing-thread path; verified auth, forwards uid at lines 45–69

### Key Modules / Files

- `apps/prime/functions/lib/staff-owner-gate.ts` — gateway enforcement; validates static token or CF Access session; no per-caller identity binding
- `apps/reception/src/app/api/mcp/_shared/staff-auth.ts` — the correctly-implemented auth layer: Firebase ID token → UID + roles; this is the trust anchor
- `apps/prime/functions/api/review-campaign-send.ts` — broadcast campaign send; reads actor UID from header; has KV rate-limit keyed on actorUid (which is manipulable)
- `apps/prime/functions/api/review-campaign.ts` — POST (`createPrimeReviewCampaign`, line 77) and PUT (`updatePrimeReviewCampaign`, line 122) mutation paths both trust caller-supplied `x-prime-actor-uid`; omitted from original inventory (critique finding C-02)
- `apps/prime/functions/api/review-thread-resolve.ts` — resolve mutation; reads actor UID from header
- `apps/prime/functions/api/review-thread-dismiss.ts` — dismiss mutation; reads actor UID from header
- `apps/prime/functions/api/review-thread-draft.ts` — save draft; reads actor UID from header
- `apps/prime/functions/api/review-thread-send.ts` — send draft; reads actor UID from header
- `apps/prime/functions/api/staff-auth-session.ts` — PIN-based auth for guest-facing Prime staff session; separate from gateway token path; issues Firebase custom tokens; references `PRIME_STAFF_AUTH_UID` env var (single UID for the whole app PIN session)

### Patterns & Conventions Observed

- All 8 mutation endpoints share the same `x-prime-actor-uid || 'prime-owner'` fallback pattern — evidence of a systemic pattern, not a one-off.
- `activity-manage.ts` derives actor identity differently: reads `cf-access-authenticated-user-email` from the CF Access header and uses that as `createdBy` — a read-only audit field, not a RBAC check.
- The `review-campaign-send.ts` rate-limit key is `ratelimit:broadcast_send:${actorUid}` — if the actorUid is forged, the rate limit applies to the wrong identity bucket.
- Reception's `buildPrimeActorHeaders` is a thin wrapper that just adds the header if a uid is present; no signing occurs.
- `PRIME_STAFF_OWNER_GATE_TOKEN` is a shared static secret known by the reception worker; it is in the Prime Cloudflare Pages environment.

### Data & Contracts

- Types/schemas/events:
  - `x-prime-actor-uid` header: plain string, no signature; consumed in 8 Prime mutation endpoints (`staff-initiate-thread`, `review-thread-draft`, `review-thread-resolve`, `review-thread-dismiss`, `review-thread-send`, `review-campaign-send`, `review-campaign` POST, `review-campaign` PUT)
  - `x-prime-access-token` header: the static shared secret for the gateway check
  - `StaffOwnerGateEnv` in `staff-owner-gate.ts`: `PRIME_STAFF_OWNER_GATE_TOKEN`, `PRIME_ENABLE_STAFF_OWNER_ROUTES`, `NODE_ENV`
  - No type that joins the gateway token to any specific actor UID exists anywhere in the codebase
- Persistence:
  - `actorUid` is persisted to D1 `prime_message_drafts.created_by_uid`, `prime_message_threads` event records, and campaign `created_by_uid` / `reviewer_uid` fields
  - All mutation results carry `actorUid` in the audit trail stored in D1
- API/contracts:
  - `initiatePrimeOutboundThread` in `prime-review.server.ts` accepts optional `actorUid` and forwards as header — no validation
  - All other `prime-review.server.ts` exported functions (`savePrimeInboxDraft`, `resolvePrimeInboxThread`, `dismissPrimeInboxThread`, `sendPrimeInboxThread`, `replayPrimeInboxCampaignDelivery`) accept optional `actorUid` and forward it

### Dependency & Impact Map

- Upstream dependencies:
  - Firebase Identity Toolkit (used by reception's `requireStaffAuth` for token verification)
  - `PRIME_STAFF_OWNER_GATE_TOKEN` — shared secret in both reception and Prime env
  - Firebase RTDB `userProfiles/{uid}` — used by reception to resolve roles
- Downstream dependents:
  - All Prime D1 audit records for staff actions (draft, resolve, dismiss, send, campaign-send)
  - Rate-limit buckets keyed on `actorUid` in Prime KV
  - Any future reporting/analytics on per-staff action attribution
- Likely blast radius of the fix:
  - Moderate: all 8 Prime mutation endpoints + `staff-owner-gate.ts` need changes
  - Reception side: `prime-review.server.ts` `buildPrimeActorHeaders` and all callers that supply `actorUid`
  - No schema migration required — the D1 field types don't change, just the source of the values

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (node environment) for Prime functions
- Commands: governed via pnpm (push to CI per testing policy)
- CI integration: standard CI pipeline

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `enforceStaffOwnerApiGate` | Unit | `apps/prime/functions/__tests__/staff-owner-access-gate.test.ts` | 3 TCs: deny without token, allow CF Access, allow with gate enabled. No test for UID injection. |
| `staff-initiate-thread` | Unit | `apps/prime/functions/__tests__/staff-initiate-thread.test.ts` | 6 TCs: auth gate, missing DB, validation, D1 error. **Zero tests verify UID handling or actor attribution.** |
| `review-thread-draft`, `review-thread-resolve`, `review-thread-dismiss`, `review-thread-send`, `review-campaign-send` | Unit | `apps/prime/functions/__tests__/review-threads.test.ts` | Happy-path coverage for all 5 route handlers including `x-prime-actor-uid` forwarding. Best extension point for new HMAC rejection and role-gate cases. |
| `requireStaffAuth` | Unit | `apps/reception/src/app/api/mcp/_shared/__tests__/staff-auth.test.ts` | Covers Firebase token verification and role checks. This layer is well-tested. |

#### Coverage Gaps

- Untested paths:
  - UID spoofing: no test sends a request with gateway token but a forged `x-prime-actor-uid` and asserts it is rejected or ignored
  - Broadcast role gate: no test that a `staff` role caller is blocked from `staff-initiate-thread` or `review-campaign-send`
  - Rate limit bypass via UID spoofing in `review-campaign-send`
- New tests needed:
  - TC: forged `x-prime-actor-uid` is rejected when HMAC signature is missing or invalid
  - TC: correct HMAC signature is accepted and UID extracted
  - TC: broadcast initiation with `staff` role is rejected with 403
  - TC: broadcast initiation with `owner`/`admin` role proceeds

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No UI changes — server-side only | None | No |
| UX / states | N/A | No user-facing states changed | None | No |
| Security / privacy | Required | Shared token validates caller but does not bind identity; actor UID is freely injectable; broadcast role gate absent | **High gap**: C-04 UID forgery + L-04 unbounded broadcast | Yes — core of this work |
| Logging / observability / audit | Required | actorUid is persisted in D1 audit records; current records may carry forged UIDs | Forged UIDs corrupt audit trail; post-fix old records not retroactively corrected | Yes — audit correctness |
| Testing / validation | Required | 6 TCs for `staff-initiate-thread` but none test UID handling; 0 TCs for broadcast role gate | Gap in security regression coverage | Yes — new TCs needed |
| Data / contracts | Required | No schema changes needed; `x-prime-actor-uid` header protocol changes; `buildPrimeActorHeaders` in reception changes | Backward-compat risk during rollout if Prime updated before reception | Yes |
| Performance / reliability | Required (low) | HMAC verification is O(1) CPU; adds one WebCrypto call per request; negligible on CF Workers | None material | No — note only |
| Rollout / rollback | Required | No feature flag today; change is a new enforcement layer | Must update Prime and reception atomically or keep backward-compat fallback during transition | Yes |

## Questions

### Resolved

- Q: Does `enforceStaffOwnerApiGate` validate identity or just access?
  - A: It validates access only (caller holds the static token), not identity. The UID is a separate, unvalidated header.
  - Evidence: `apps/prime/functions/lib/staff-owner-gate.ts` lines 17–48 — no UID derivation or verification occurs.

- Q: Is there another endpoint that correctly derives actor UID server-side?
  - A: `activity-manage.ts` uses `cf-access-authenticated-user-email` as `createdBy` — but this is an email string for audit, not a UID, and it only works when CF Access is active (not when the static token path is used). No endpoint derives a UID from the static token binding.
  - Evidence: `apps/prime/functions/api/activity-manage.ts` line 163.

- Q: What is the correct fix approach?
  - A: Option (b) with a separate-secret HMAC approach is recommended. The reception layer already holds the Firebase ID token and the verified UID and roles. It can sign a short-lived `{uid, roles, timestamp}` payload using HMAC-SHA256 (WebCrypto, available in both Next.js edge runtime and CF Workers) using a **new** secret `PRIME_ACTOR_CLAIMS_SECRET` that is independent of the gateway token. Prime verifies the HMAC before trusting the UID. **The gateway token `PRIME_STAFF_OWNER_GATE_TOKEN` MUST NOT be used as the signing key** — it is the access credential sent by the reception worker on every request, so any party who possesses the gateway token alone could mint valid claims for any UID.
  - **Scope of protection:** Using a separate `PRIME_ACTOR_CLAIMS_SECRET` closes the C-04 threat (a caller who holds only the gateway token impersonating a different UID). It does NOT protect against a fully-compromised reception runtime that has both secrets — but that is full service compromise, outside the stated threat model. The improvement is meaningful and appropriate for this deployment context.
  - The correct fix requires a **separate signing secret** (`PRIME_ACTOR_CLAIMS_SECRET`) present in both the reception app env and the Prime Pages Functions env, NOT equal to the gateway access token. A caller with only the gateway token cannot forge claims without the signing secret.
  - Option (a) Firebase ID token forwarding to Prime: viable but requires Prime to implement JWT verification against Google's JWKS endpoint (fetching `https://www.googleapis.com/robot/v1/metadata/x509/...`). WebCrypto RS256 verification is feasible on CF Workers but adds network round-trip and key-rotation complexity.
  - Option (c) staff DB lookup: requires new infrastructure, out of scope.
  - Evidence: `prime-review.server.ts` lines 217–220 confirm the gateway token is sent as `x-prime-access-token`; `staff-owner-gate.ts` line 22 confirms this is the same token checked server-side. The separate signing secret approach is the minimal correct fix.

- Q: What staff/auth data sources exist for role enforcement?
  - A: Firebase RTDB `userProfiles/{uid}` has roles for the two current staff members (Pete: `["owner","developer"]`, Cristiana: `["owner","admin"]`). Reception's `requireStaffAuth` already reads these roles. Prime has no direct RTDB access gated to `userProfiles`. The correct approach is for reception to include the actor's role in the signed payload, so Prime can enforce the role gate without a RTDB call.
  - Evidence: `docs/agents/memory/data-access.md` lines 69–76; `staff-auth.ts` lines 104–117.

- Q: Should the broadcast role gate require `owner` or `admin` or both?
  - A: The allowlist is `owner` and `admin` only. `developer` is intentionally excluded — it is a technical access role, not an operational staff role, and should not implicitly confer broadcast authority. Future `staff`-role members (Serena, Alessandro) should not be allowed to broadcast. Pete has both `owner` and `developer` roles; his broadcast access is covered by `owner`. This is the single canonical answer; the open question below about `developer` inclusion is pre-resolved here: do not include it.
  - Evidence: `data-access.md` lines 73–77 (Pete: owner + developer; Cristiana: owner + admin). Including `developer` in the allowlist would grant broadcast to any future developer-only account — an implicit privilege escalation risk.

- Q: What would a minimal secure fix look like without a full auth system rewrite?
  - A: Reception signs `{uid, roles, timestamp}` with HMAC-SHA256 using a separate `PRIME_ACTOR_CLAIMS_SECRET` env var (distinct from `PRIME_STAFF_OWNER_GATE_TOKEN`). Prime verifies the HMAC signature before reading UID and roles. Timestamp provides replay attack protection (e.g., ±5 min window). This replaces the plain `x-prime-actor-uid` header with a signed `x-prime-actor-claims` header. The existing gateway token validation in `enforceStaffOwnerApiGate` continues to serve as the coarse access gate; the signed claims (using the separate secret) serve as the identity and role layer. The two secrets are independently managed.

### Open (Operator Input Required)

None. All questions have been self-resolved from available evidence and business constraints.

## Confidence Inputs

- Implementation: 92% — the pattern is clear (HMAC-SHA256 claims signing), all data sources are verified, WebCrypto is available in both runtimes. Slight uncertainty around rollout ordering during deployment.
- Approach: 90% — HMAC signing with a separate claims secret (`PRIME_ACTOR_CLAIMS_SECRET`) is the minimal correct fix; it requires one new env var but no new infrastructure. Full Firebase token forwarding would be more robust but adds JWKS network dependency and complexity not justified for this use case.
- Impact: 95% — closes the UID forgery vulnerability on all 8 Prime mutation endpoints and adds the broadcast role gate.
- Delivery-Readiness: 90% — all questions resolved; requires one new env var (`PRIME_ACTOR_CLAIMS_SECRET`) to be provisioned in both reception and Prime; everything else is buildable from current evidence.
- Testability: 90% — HMAC verification is unit-testable; role gate is unit-testable; no E2E dependencies for the security logic.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Replay attack via stolen signed claims | Low | Medium | Timestamp in claims + ±5 min verification window on Prime side |
| Deployment race: Prime updated before reception sends signed claims | Medium | Low | Backward-compat period: Prime accepts both signed claims AND plain `x-prime-actor-uid` during rollout; remove fallback after both sides are deployed |
| `PRIME_ACTOR_CLAIMS_SECRET` rotation invalidates in-flight signed claims | Low | Low | Claims include timestamp so rotation only breaks in-flight requests; acceptable |
| Role list in signed claims becomes stale if roles change in RTDB | Low | Low | Claims are short-lived (signed at request time from fresh `requireStaffAuth` result); no caching |
| `PRIME_ACTOR_CLAIMS_SECRET` is weak or accidentally set to same value as `PRIME_STAFF_OWNER_GATE_TOKEN` | Low | Medium | Document minimum secret length (≥32 random chars); add env-startup validation to reject short secrets or identical values |

## Planning Constraints & Notes

- Must-follow patterns:
  - WebCrypto only for HMAC (both CF Workers and Next.js edge; no Node `crypto` module on CF Workers runtime)
  - Backward-compat fallback during rollout (Prime accepts both signed and unsigned header)
  - All tests must follow the governing test runner policy (push to CI, not local)
- Rollout/rollback expectations:
  - Step 1: Deploy Prime with signed-claims verification support. **Broadcast endpoints (`staff-initiate-thread`, `review-campaign-send`) do NOT use the compat fallback** — they require signed claims immediately (no UID accepted without a valid signature). Non-broadcast mutation endpoints accept both signed `x-prime-actor-claims` and plain `x-prime-actor-uid` fallback during the compat window.
  - Step 2: Deploy reception to send signed claims for all endpoints; verify Prime logs confirm signed claims are accepted.
  - Step 3: **Hard gate**: remove the plain-UID fallback from all remaining non-broadcast endpoints within one sprint of Step 2 (tracked as a blocking TASK in the plan, not deferred indefinitely).
  - Rationale: Broadcast endpoints are the highest-impact surface (send to all active guests). Requiring signed claims immediately on broadcast means the role gate is enforced from day one, at the cost of the broadcast feature being unavailable until reception is also deployed (Step 2). This is an acceptable window.
  - Rollback: revert to plain `x-prime-actor-uid` + no role gate at any step (actor UID defaults to `prime-owner`)
- Observability expectations:
  - Log rejected UID claims with reason (invalid HMAC, expired timestamp, insufficient role) for audit diagnostics

## Suggested Task Seeds (Non-binding)

- TASK-01: Add `signActorClaims(uid, roles, signingSecret)` and `verifyActorClaims(header, signingSecret)` utilities using WebCrypto HMAC-SHA256. Signing secret is a new env var `PRIME_ACTOR_CLAIMS_SECRET` — independent of `PRIME_STAFF_OWNER_GATE_TOKEN`. Reception signs; Prime verifies.
- TASK-02: Update `buildPrimeActorHeaders` in `prime-review.server.ts` to produce a signed `x-prime-actor-claims` header instead of forwarding plain `x-prime-actor-uid`
- TASK-03: Introduce `resolveActorClaims(request, env)` helper in Prime that verifies the HMAC signature and returns `{ uid, roles }` or null; update all 8 mutation endpoints to use it
- TASK-04: Add broadcast role gate in `staff-initiate-thread.ts` and `review-campaign-send.ts` (require `owner` or `admin` role in verified claims)
- TASK-05: Update tests in `review-threads.test.ts` and `staff-initiate-thread.test.ts` to cover HMAC rejection (missing sig, invalid sig, expired timestamp) + role gate; add new test cases for `review-campaign` POST/PUT which currently have no tests at all in `review-threads.test.ts` (the suite imports only the GET path from `review-campaign`)
- TASK-06: Backward-compat period: during rollout Prime accepts both signed `x-prime-actor-claims` AND unsigned `x-prime-actor-uid` (falls back to `prime-owner`); remove fallback after both sides are deployed

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: All 8 Prime mutation endpoints require signed actor claims (HMAC-SHA256 using separate `PRIME_ACTOR_CLAIMS_SECRET`, not the gateway token); broadcast endpoints additionally enforce `owner | admin` role gate; new unit tests cover HMAC rejection (invalid/missing/expired) and role gate; no E2E required
- Post-delivery measurement plan: Confirm no audit records with `actorUid = prime-owner` (the fallback default) appear in Prime D1 after the fix is deployed to production

## Evidence Gap Review

### Gaps Addressed

- All 8 mutation endpoints inspected and confirmed to share the same `x-prime-actor-uid` pattern (6 originally identified + 2 in `review-campaign.ts` POST/PUT found via critique)
- Correct auth layer in reception (`requireStaffAuth`) verified — it is the trust anchor
- Firebase RTDB role data confirmed available for role enforcement at reception layer
- WebCrypto availability on both CF Workers and Next.js confirmed from platform constraints
- Existing test coverage confirmed as covering access control but not UID handling or role gate

### Confidence Adjustments

- Implementation confidence raised to 92% after confirming all 8 endpoints share the same pattern (smaller blast radius than if each had a different approach)
- Testability confidence raised to 90% after confirming Jest node environment is available for Prime functions

### Remaining Assumptions

- `PRIME_ACTOR_CLAIMS_SECRET` (the new signing secret) must be ≥32 random chars and distinct from `PRIME_STAFF_OWNER_GATE_TOKEN` — needs env-setup documentation and startup validation
- Timestamp clock skew between reception Next.js Worker and Prime CF Pages Functions is within acceptable tolerance (both are Cloudflare edge, so within seconds)

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Gateway enforcement (`staff-owner-gate.ts`) | Yes | None — fully read | No |
| Actor UID consumption on all 8 mutation endpoints | Yes | Pattern confirmed across all 8 (6 initial + 2 in review-campaign POST/PUT via critique); no outliers | No |
| Reception→Prime forwarding layer (`prime-review.server.ts`) | Yes | `buildPrimeActorHeaders` confirmed as plain header forwarding | No |
| Reception auth layer (`staff-auth.ts`) | Yes | Correctly implements Firebase ID token verification + role lookup | No |
| Broadcast-specific endpoints | Yes | `staff-initiate-thread` and `review-campaign-send` identified; rate-limit bypass risk noted | No |
| Existing test coverage | Yes | Tests cover access gate; zero tests for UID handling or role gate | No |
| Staff/role data sources | Yes | Firebase RTDB `userProfiles/{uid}` confirmed; roles structure documented | No |
| Deployment/rollout risk | Yes | Backward-compat period needed; no feature flag infrastructure today | No |

## Scope Signal

- Signal: right-sized
- Rationale: The fix touches 8 Prime mutation endpoints, 2 reception helpers, and introduces 1 new utility (HMAC claims signing/verification) plus 1 new env var. All dependencies are in-repo, no new infrastructure required, and the pattern is consistent across all affected endpoints. All questions are resolved; the separate signing secret requirement is a clear, documented constraint.

## Critique

- Rounds: 3
- Final score: 3.8/5.0 (estimated post-autofix; raw Round 3 codemoot: 7/10 → lp_score 3.5; critical resolved via autofix)
- Final verdict: credible
- Critical findings addressed: 3 (C-01 HMAC design, C-02 endpoint inventory, rollout/role-gate conflict)
- Remaining findings: 3 warnings (threat model scope, data section count fix, scope rationale — all addressed via autofix)
- Critique history: `docs/plans/prime-outbound-auth-hardening/critique-history.md`

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis prime-outbound-auth-hardening`
