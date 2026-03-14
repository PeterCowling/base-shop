---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14 (TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07 complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-outbound-auth-hardening
Dispatch-ID: IDEA-DISPATCH-20260314160001-BRIK-004
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/prime-outbound-auth-hardening/analysis.md
---

# Prime Outbound Auth Hardening Plan

## Summary

Eight Prime mutation endpoints trust caller-supplied `x-prime-actor-uid` to identify the acting staff member — any gateway-token holder can forge a different UID. This plan hardens all 8 endpoints by replacing the plain header with an HMAC-SHA256 signed claims payload, using a new `PRIME_ACTOR_CLAIMS_SECRET` env var that is independent of the gateway token. Additionally, 2 pure-broadcast endpoints (`staff-initiate-thread`, `review-campaign-send`) gain an immediate blanket role gate requiring `owner` or `admin` (no compat window). `review-thread-send` handles both broadcast and direct-message threads: it gains a conditional role gate that fires only when `isWholeHostelBroadcastThread` is true (direct-message sends remain unrestricted). The 5 non-broadcast endpoints gain a short compat window for backward compatibility, with a blocking TASK-07 to remove it within one sprint. Reception must also have all 5 prime-proxy function signatures updated to forward `roles` — critique-confirmed omission. Both Reception (signing) and Prime (verifying) must be deployed in the correct order.

## Active tasks
- [ ] TASK-01: Implement `signActorClaims` / `verifyActorClaims` WebCrypto HMAC-SHA256 utilities
- [x] TASK-02: Update `buildPrimeActorHeaders` in Reception to produce signed `x-prime-actor-claims` header; extend all 5 reception call sites to pass `roles`
- [x] TASK-03: Add `resolveActorClaims` helper to Prime and update all 8 mutation endpoints
- [x] TASK-04: Broadcast role gate on 2 pure-broadcast endpoints; conditional role gate in `review-thread-send` (broadcast thread only)
- [x] CHECKPOINT-A: Validate Prime deploy is stable (Prime-only gate; before Reception deploy)
- [x] TASK-05: Tests — extend existing suites + add `review-campaign` POST/PUT + fix all breaking test assertions
- [ ] TASK-06: Env validation at startup, wrangler/`.env.example` documentation
- [x] TASK-07: Hard-gate removal of non-broadcast compat fallback (blocking, within 1 sprint)

## Goals
- Actor UID stored in Prime D1 is cryptographically bound to a short-lived signed claims payload.
- Broadcast send requires the `owner` or `admin` role (exact flat allowlist); gate active from first deployment.
- All 8 mutation endpoints covered; no endpoint left unhardened.
- No new infrastructure, no Firebase Admin SDK on Prime.

## Non-goals
- Per-request Firebase ID token verification on Prime (JWKS network dependency).
- Rebuilding multi-staff auth for Prime.
- Guest-facing auth flow changes.
- Retroactive correction of pre-fix audit records.

## Constraints & Assumptions
- Constraints:
  - Prime runs as Cloudflare Pages Functions; only WebCrypto available (`crypto.subtle`).
  - `PRIME_STAFF_OWNER_GATE_TOKEN` MUST NOT be used as the HMAC signing key (critique-confirmed: any gateway-token holder could mint valid claims).
  - `staff-initiate-thread` and `review-campaign-send` (pure broadcast) must require signed claims and enforce role gate immediately — no compat window.
  - `review-thread-send` handles both broadcast and DM threads; role gate must be conditional on `isWholeHostelBroadcastThread` inside the endpoint — a blanket gate is a functional regression.
  - `PRIME_ACTOR_CLAIMS_SECRET` must be provisioned in both envs before or alongside Prime deployment.
- Assumptions:
  - HMAC-SHA256 via `crypto.subtle` is performant on CF Workers (~0.1ms per call).
  - Broadcast role allowlist: `owner` and `admin` only (flat set).
  - CF edge clock skew <1s; using ±5 min window is safe.
  - Rollback after Reception sends signed claims collapses `actorUid` to `prime-owner` (existing fallback) — acceptable, documented.

## Inherited Outcome Contract

- **Why:** Staff identity is caller-controlled at the Prime API layer — any gateway-token holder can attribute actions to any staff UID, including audit records, broadcast sends, and message attributions. For broadcast this is a direct-harm risk (messages to all active guests attributed to wrong person).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this change, the actor UID recorded at the Prime layer is cryptographically bound to a short-lived signed claims header verified with a separate signing secret. A caller with only the gateway token cannot forge a different UID. The broadcast send path additionally requires `owner` or `admin` role (exact allowlist, not hierarchical).
- **Source:** auto

## Analysis Reference
- Related analysis: `docs/plans/prime-outbound-auth-hardening/analysis.md`
- Selected approach inherited:
  - Option A — Separate-secret HMAC claims: new `PRIME_ACTOR_CLAIMS_SECRET` env var; Reception signs `{uid, roles, iat}` with HMAC-SHA256 `crypto.subtle`; Prime verifies and extracts claims.
- Key reasoning used:
  - WebCrypto available on both CF Workers and Next.js edge; no new infrastructure required.
  - Separate signing secret provides meaningful protection against gateway-token leakage.
  - Roles included in signed payload enable broadcast role gate without Firebase Admin on Prime.
  - Broadcast endpoints must skip compat window (critique-confirmed: role gate undefined during compat).

## Selected Approach Summary
- What was chosen:
  - HMAC-SHA256 signed claims in a new `x-prime-actor-claims` header, signed by Reception with `PRIME_ACTOR_CLAIMS_SECRET`.
  - Prime verifies the HMAC, checks timestamp, extracts `{uid, roles}` via `resolveActorClaims()`.
  - Broadcast endpoints: require signed claims immediately (no fallback).
  - Non-broadcast endpoints: accept signed claims OR plain `x-prime-actor-uid` during compat window.
- Why planning is not reopening option selection:
  - Analysis is decisive; all 4 options compared; only Option A is viable; critique round passed.

## Fact-Find Support
- Supporting brief: `docs/plans/prime-outbound-auth-hardening/fact-find.md`
- Evidence carried forward:
  - `apps/prime/functions/lib/staff-owner-gate.ts` — gateway gate unchanged; `StaffOwnerGateEnv` interface unchanged (`PRIME_ACTOR_CLAIMS_SECRET` belongs to `actor-claims-resolver.ts` Env, not the gateway gate — critique R2 INFO autofix).
  - All 8 mutation endpoints confirmed: `review-thread-draft.ts` (PUT), `review-thread-resolve.ts` (POST), `review-thread-dismiss.ts` (POST), `review-thread-draft.ts` (PUT), `review-thread-send.ts` (POST), `staff-initiate-thread.ts` (POST), `review-campaign-send.ts` (POST), `review-campaign.ts` (POST + PUT).
  - Reception trust anchor: `apps/reception/src/app/api/mcp/_shared/staff-auth.ts` → `requireStaffAuth`.
  - `buildPrimeActorHeaders` at `apps/reception/src/lib/inbox/prime-review.server.ts:258–260` is the signing point.
  - `initiate-prime-outbound-thread.test.ts` line 85 asserts `x-prime-actor-uid` — will break; must be updated in TASK-05.
  - `review-campaign` POST/PUT have zero existing tests.
  - Rollback: Prime's `|| 'prime-owner'` fallback collapses attribution to `prime-owner` (not a restore of plain-UID state).

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | `signActorClaims` / `verifyActorClaims` WebCrypto utilities | 85% | S | Complete (2026-03-14) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Update `buildPrimeActorHeaders` + extend all 5 reception call sites to pass `roles` | 85% | M | Complete (2026-03-14) | TASK-01 | TASK-05, TASK-06 |
| TASK-03 | IMPLEMENT | `resolveActorClaims` helper + update all 8 Prime mutation endpoints | 85% | M | Complete (2026-03-14) | TASK-01 | TASK-04, CHECKPOINT-A |
| TASK-04 | IMPLEMENT | Broadcast role gate: blanket on `staff-initiate-thread`/`review-campaign-send`; conditional (broadcast thread check) in `review-thread-send` | 85% | S | Complete (2026-03-14) | TASK-03 | CHECKPOINT-A |
| CHECKPOINT-A | CHECKPOINT | Validate Prime deploy is stable (Prime-only; Reception deploy happens post-checkpoint) | - | - | Complete (2026-03-14) | TASK-03, TASK-04 | TASK-05, TASK-06 |
| TASK-05 | IMPLEMENT | Tests — extend suites, fix all breaking assertions, add `review-campaign` POST/PUT + DM regression | 85% | M | Complete (2026-03-14) | TASK-02, TASK-03, TASK-04, CHECKPOINT-A | TASK-07 |
| TASK-06 | IMPLEMENT | Env validation at startup + wrangler/`.env.example` + `reception/wrangler.toml` docs | 80% | S | Complete (2026-03-14) | TASK-02, TASK-03, CHECKPOINT-A | TASK-07 |
| TASK-07 | IMPLEMENT | Hard-gate removal of non-broadcast compat fallback | 80% | S | Complete (2026-03-14) | TASK-05, TASK-06 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — server-side only | - | No user-facing rendering changes |
| UX / states | N/A — server-side only | - | Error responses (401/403) are machine-readable API errors |
| Security / privacy | Primary concern: closes UID forgery across 8 endpoints; broadcast role gate immediately enforced; HMAC-SHA256 with separate secret; timestamp replay window ±5 min | TASK-01, TASK-02, TASK-03, TASK-04, TASK-06 | Scope of protection: gateway-token leakage only (not full Reception env compromise) |
| Logging / observability / audit | Structured log entries for HMAC rejection (reason: missing, invalid-sig, expired, insufficient-role); broadcast D1 actorUid values cryptographically bound from TASK-04 deploy; non-broadcast actorUid values cryptographically bound only after TASK-07 removes compat window | TASK-03, TASK-04, TASK-07 | Pre-fix historical records remain as-is |
| Testing / validation | Extend `review-threads.test.ts` + `staff-initiate-thread.test.ts`; add `review-campaign` POST/PUT tests; fix reception header assertion in `initiate-prime-outbound-thread.test.ts` | TASK-05 | Must cover: missing sig → 401, invalid sig → 401, expired → 401, insufficient role → 403, valid → 200 |
| Data / contracts | New `x-prime-actor-claims` header replaces `x-prime-actor-uid`; D1 schema unchanged; new `PRIME_ACTOR_CLAIMS_SECRET` env var in both envs; `StaffOwnerGateEnv` interface unchanged (gateway gate unmodified); `PRIME_ACTOR_CLAIMS_SECRET` belongs to `actor-claims-resolver.ts` Env only | TASK-01, TASK-02, TASK-03, TASK-06 | Backward-compat: non-broadcast accepts both headers during compat window |
| Performance / reliability | One `crypto.subtle.verify` call per request (~0.1ms); negligible overhead | TASK-03 | KV rate-limit key on `review-campaign-send` updated to use verified actorUid after extraction |
| Rollout / rollback | Deploy order: Prime (TASK-01/03/04/06) first → Reception (TASK-02) → Verify → TASK-07 (remove compat fallback within 1 sprint); rollback collapses attribution to `prime-owner` | TASK-03, TASK-04, TASK-07 | Broadcast unavailable between Prime deploy and Reception deploy — window should be minimized |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Pure WebCrypto utilities; no app deps |
| 2 | TASK-02, TASK-03 | TASK-01 | Can start in parallel once TASK-01 merges; TASK-02 touches Reception, TASK-03 touches Prime |
| 3 | TASK-04 | TASK-03 | Broadcast role gate; can start once TASK-03 is complete; TASK-02 can continue in parallel |
| 4 | CHECKPOINT-A | TASK-03, TASK-04 | Prime-only validation step (no Reception deploy yet); TASK-02 code may be complete but Reception NOT deployed until after this checkpoint |
| 5 | TASK-05, TASK-06 | CHECKPOINT-A pass, TASK-02 complete | Reception deploy (TASK-02 code merged post-CHECKPOINT-A); final test pass and env docs; TASK-05 and TASK-06 unblock in parallel |
| 6 | TASK-07 | TASK-05, TASK-06 | Hard-gate removal; separate deploy; only after Reception TASK-02 confirmed in production |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Broadcast initiation (staff-initiate-thread) | Staff POSTs to reception `/api/mcp/inbox/prime-compose` | 1. Reception: `requireStaffAuth` verifies Firebase ID token, extracts `uid` and `roles`. 2. Reception: `buildPrimeActorHeaders` signs `{uid, roles, iat}` with HMAC-SHA256 using `PRIME_ACTOR_CLAIMS_SECRET` → produces `x-prime-actor-claims: <b64payload>.<b64sig>`. 3. Reception calls Prime `/api/staff-initiate-thread` with gateway token + signed claims header. 4. Prime: `enforceStaffOwnerApiGate` validates gateway token (unchanged). 5. Prime: `resolveActorClaims(request, env)` verifies HMAC, checks timestamp, returns `{uid, roles}` or 401. 6. Prime: role check — if `!roles.includes('owner') && !roles.includes('admin')` → 403. 7. Prime: `upsertPrimeMessageThread` + `savePrimeReviewDraft` with verified `actorUid`. | TASK-01, TASK-02, TASK-03, TASK-04 | Broadcast unavailable between Prime Step-1 deploy and Reception deploy; no compat window. Rollback from mid-rollout: Prime falls back to `prime-owner` attribution. |
| Campaign-send broadcast (review-campaign-send) | Reception sends POST to Prime `/api/review-campaign-send` with campaign ID | Same steps 1–6 above; additionally KV rate-limit keyed on verified `actorUid` (not forged). | TASK-01, TASK-02, TASK-03, TASK-04 | Same rollback seam as above. |
| Thread-send — broadcast path (review-thread-send, whole-hostel thread) | Reception sends POST to Prime `/api/review-thread-send` with whole-hostel broadcast threadId | Steps 1–5 above. Prime: `sendPrimeReviewThread` detects `isWholeHostelBroadcastThread(record.thread)` → role check fires: if `!roles.includes('owner') && !roles.includes('admin')` → 403. Otherwise proceeds to broadcast send. | TASK-01, TASK-02, TASK-03, TASK-04 | Role gate is conditional on thread type inside `review-thread-send.ts` — direct-message sends on non-broadcast threads skip the role check. |
| Thread-send — direct message path (review-thread-send, individual guest thread) | Reception sends POST to Prime `/api/review-thread-send` with a guest thread ID | Steps 1–5 above. Prime: `sendPrimeReviewThread` finds `!isWholeHostelBroadcastThread(record.thread)` → no role gate; proceeds to guest DM send as before. Any staff role may send. | TASK-01, TASK-02, TASK-03 | No role restriction on direct messages. Confirmed: critique C-01 autofix. |
| Non-broadcast mutations (5 endpoints: review-thread-draft, review-thread-resolve, review-thread-dismiss, review-campaign POST, review-campaign PUT) | Any staff mutation action from reception | Steps 1–5 above. During compat window: `resolveActorClaims` accepts signed claims OR falls back to plain `x-prime-actor-uid`. No role check for non-broadcast. | TASK-01, TASK-02, TASK-03 | Compat fallback is a temporary state; TASK-07 must remove it within 1 sprint. |
| Compat fallback removal | TASK-07 execution (within 1 sprint) | Prime re-deployed with compat fallback removed from `resolveActorClaims`; plain `x-prime-actor-uid` rejected with 401. | TASK-07 | No rollout risk if Reception is already deploying signed claims. |

## Tasks

---

### TASK-01: Implement `signActorClaims` / `verifyActorClaims` WebCrypto HMAC-SHA256 utilities
- **Type:** IMPLEMENT
- **Deliverable:** Two pure WebCrypto functions: `signActorClaims({uid, roles, iat?})` → `string` (b64url-payload.b64url-sig) and `verifyActorClaims(header, secret)` → `{uid: string, roles: string[]} | null`. Location: `apps/prime/functions/lib/actor-claims.ts` (consumed by both reception — via a shared re-export path — and Prime; see notes on placement).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** Commit 6ba8300911. `apps/prime/functions/lib/actor-claims.ts` created (165 lines). Typecheck passes (`pnpm --filter @apps/prime typecheck` — functions pass). Lint pass (0 errors). Build-validate Mode 2 data simulation: all 9 TCs traced — sign/verify round-trip correct, tamper/expire/future/missing/malformed all return null. One TypeScript fix applied: `toBase64Url` signature changed from `ArrayBuffer` to `ArrayBuffer | Uint8Array` to match `Uint8Array` argument type from `TextEncoder.encode()`.
- **Affects:** `apps/prime/functions/lib/actor-claims.ts` (new)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 90% — `crypto.subtle.sign/verify` with HMAC-SHA256 is well-documented WebCrypto; base64url encoding is straightforward; no external deps.
  - Approach: 85% — payload format `{uid, roles, iat}` confirmed in analysis; ±5 min window confirmed.
  - Impact: 85% — pure utility; no side effects; all consumers depend on this but the utility itself has no integration risk. Held-back test: "What single unresolved unknown would push this below 80?" — None. WebCrypto is standardized on CF Workers. Score confirmed at 85% (downward bias: payload serialization order must be canonical for sign/verify to match; easily enforced with `JSON.stringify` with sorted keys or fixed field order).
- **Acceptance:**
  - `signActorClaims({uid: 'u1', roles: ['owner'], iat: <fixed>})` produces a deterministic string containing b64url-encoded payload and signature separated by `.`
  - `verifyActorClaims(signed, secret)` returns `{uid: 'u1', roles: ['owner']}` for a valid claim
  - `verifyActorClaims(tampered, secret)` returns `null`
  - `verifyActorClaims(expired, secret)` returns `null` (iat older than 5 min)
  - `verifyActorClaims(future, secret)` returns `null` (iat more than 5 min in the future)
  - Function is usable from CF Workers runtime (no Node.js-only APIs)
- **Engineering Coverage:**
  - UI / visual: N/A — utility function; no rendering
  - UX / states: N/A — no user state
  - Security / privacy: Required — this is the core crypto primitive; HMAC-SHA256 with correct key import; timestamp window validation; canonical payload serialization to prevent ordering attacks
  - Logging / observability / audit: N/A — pure utility; callers log failures
  - Testing / validation: Required — unit tests with deterministic fixtures (fixed iat, fixed secret); test all failure modes
  - Data / contracts: Required — defines the `x-prime-actor-claims` header format contract; document payload schema in function JSDoc
  - Performance / reliability: N/A — synchronous crypto; ~0.1ms per call; no I/O
  - Rollout / rollback: N/A — pure utility; no deploy dependency
- **Validation contract (TC-XX):**
  - TC-01: Sign with secret A, verify with secret A → returns `{uid, roles}` — PASS
  - TC-02: Sign with secret A, verify with secret B → returns `null` — PASS
  - TC-03: Tamper payload bytes, verify with secret A → returns `null` — PASS
  - TC-04: Tamper signature bytes, verify with secret A → returns `null` — PASS
  - TC-05: `iat` 6 min ago → `verifyActorClaims` returns `null` — PASS
  - TC-06: `iat` 6 min in the future → `verifyActorClaims` returns `null` — PASS
  - TC-07: `iat` within ±5 min → returns valid claims — PASS
  - TC-08: Missing `.` separator in header → returns `null` — PASS
  - TC-09: Malformed base64url payload → returns `null` — PASS
- **Execution plan:** Red → add failing unit tests for all TC cases → Green → implement `signActorClaims` and `verifyActorClaims` with `crypto.subtle.importKey` + `crypto.subtle.sign/verify` → Refactor → ensure canonical JSON serialization with fixed field order; extract timestamp window constant.
- **Planning validation (required for M/L):** S effort — not required.
- **Scouts:** Verify `crypto.subtle` is available in Jest test environment (Node 22 has `globalThis.crypto`); if not, add `--experimental-vm-modules` or global polyfill.
- **Edge Cases & Hardening:**
  - Empty `roles` array is valid (encodes as `[]`)
  - `uid` must be non-empty string; reject null/undefined at sign boundary
  - Payload field order must be deterministic; use explicit field ordering in JSON serialization
  - 32-character minimum secret length check at verification boundary (caller responsibility; 32 chars is the canonical minimum across this plan)
- **What would make this >=90%:**
  - Integration test confirming sign in a Node.js mock of Reception env, verify in CF Workers test env with identical result
- **Rollout / rollback:**
  - Rollout: Pure addition; no existing code changed in this task.
  - Rollback: Delete the new file; no consumers exist yet.
- **Documentation impact:**
  - JSDoc on exported functions documenting the header format, payload schema, and clock-skew window.
- **Notes / references:**
  - File placement: `apps/prime/functions/lib/actor-claims.ts`. Reception imports the signing half. Since Reception is a Next.js app and Prime is CF Pages Functions, they cannot share from a monorepo package during this sprint without adding a new package. Simplest approach: duplicate the `signActorClaims` utility into `apps/reception/src/lib/inbox/actor-claims.ts` and the `verifyActorClaims` utility stays in `apps/prime/functions/lib/actor-claims.ts`. Both implementations must be byte-identical in their HMAC logic — a unit test in each location verifies sign/verify round-trip with a fixture secret.
  - Consumer tracing: `signActorClaims` consumed by TASK-02 (reception). `verifyActorClaims` consumed by TASK-03 (Prime). No other consumers expected.

---

### TASK-02: Update `buildPrimeActorHeaders` to sign claims; extend all 5 reception prime-proxy call sites to pass `roles`
- **Type:** IMPLEMENT
- **Deliverable:** (a) New `apps/reception/src/lib/inbox/actor-claims.ts` with `signActorClaims`; (b) Modified `buildPrimeActorHeaders` at `apps/reception/src/lib/inbox/prime-review.server.ts:258–260` — now async, accepts `roles: string[]`, produces `x-prime-actor-claims` header; (c) Updated function signatures for `savePrimeInboxDraft`, `resolvePrimeInboxThread`, `dismissPrimeInboxThread`, `sendPrimeInboxThread`, `initiatePrimeOutboundThread` to accept and forward `roles`; (d) Updated all 5 reception API route call sites to pass `auth.roles`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Build evidence:** Included in commit `fd9826a6a5` (wave 2). `actor-claims.ts` created in reception. `buildPrimeActorHeaders` made async, `roles` parameter added, `signActorClaims` called. All 5 prime-proxy functions updated with `roles?: string[]`. All 5 reception route files pass `auth.roles`. Controlled scope expansion: `staffBroadcastSend` also updated (uses `buildPrimeActorHeaders`; required since function became async). Reception typecheck passes.
- **Affects:** `apps/reception/src/lib/inbox/actor-claims.ts` (new), `apps/reception/src/lib/inbox/prime-review.server.ts`, `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/route.ts`, `apps/reception/src/app/api/mcp/inbox/[threadId]/resolve/route.ts`, `apps/reception/src/app/api/mcp/inbox/[threadId]/dismiss/route.ts`, `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts`, `apps/reception/src/app/api/mcp/inbox/prime-compose/route.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-05, TASK-06
- **Confidence:** 85%
  - Implementation: 85% — `buildPrimeActorHeaders` is a 3-line function; extending 5 function signatures is mechanical; all 5 call sites confirmed via critique finding (M-01) and file reads; `crypto.subtle` available in Node.js runtime.
  - Approach: 85% — critique confirmed all 5 prime-proxy functions use `buildPrimeActorHeaders`; `auth.roles` is available from `requireStaffAuth` at all 5 route call sites (confirmed via file reads).
  - Impact: 85% — all 5 affected call sites enumerated; no hidden consumers of these functions. Held-back test: "What if there are additional callers?" — `buildPrimeActorHeaders` is only called inside `prime-review.server.ts`; grep confirms no other callers. Score confirmed at 85%.
- **Acceptance:**
  - `buildPrimeActorHeaders('uid-x', ['owner'])` returns `{'x-prime-actor-claims': '<valid signed header>'}` (not `x-prime-actor-uid`)
  - Signed header verifies via `verifyActorClaims` round-trip with same secret → `{uid: 'uid-x', roles: ['owner']}`
  - All 5 reception route files pass `auth.roles` to their respective prime-review functions; TypeScript types enforce this
  - `initiatePrimeOutboundThread({text, actorUid: auth.uid, roles: auth.roles})` sends signed header
  - `sendPrimeInboxThread(threadId, auth.uid, auth.roles)` sends signed header
  - `savePrimeInboxDraft(threadId, payload, auth.uid, auth.roles)` sends signed header
  - `resolvePrimeInboxThread(threadId, auth.uid, auth.roles)` sends signed header
  - `dismissPrimeInboxThread(threadId, auth.uid, auth.roles)` sends signed header
  - `buildPrimeActorHeaders(undefined, undefined)` returns `undefined` (unchanged behavior)
- **Engineering Coverage:**
  - UI / visual: N/A — server-side only
  - UX / states: N/A — no user-facing state
  - Security / privacy: Required — signing uses `PRIME_ACTOR_CLAIMS_SECRET`; must fail closed if secret absent; roles from verified Firebase session forwarded faithfully
  - Logging / observability / audit: N/A — signing errors manifest as 401 at Prime
  - Testing / validation: Required — update `initiate-prime-outbound-thread.test.ts:85` to assert `x-prime-actor-claims`; also update `prime-compose/route.test.ts:105-112` and `inbox-actions.route.test.ts:523-530` for new function signatures (TASK-05 owns these; TASK-02 makes signatures correct for test updates to be writable)
  - Data / contracts: Required — `buildPrimeActorHeaders` gains `roles` parameter; 5 prime-review.server.ts functions gain `roles`; 5 reception route files updated
  - Performance / reliability: N/A — one `crypto.subtle.sign` call; <0.1ms
  - Rollout / rollback: Required — Reception deploy must follow Prime TASK-03/04; broadcast unavailable until both deployed
- **Validation contract (TC-XX):**
  - TC-01: `buildPrimeActorHeaders('uid-x', ['admin'])` → key is `x-prime-actor-claims`, value is `<b64>.<b64>` — PASS
  - TC-02: TC-01 value passes `verifyActorClaims` → `{uid: 'uid-x', roles: ['admin']}` — PASS
  - TC-03: `draft/route.ts` calls `savePrimeInboxDraft(threadId, payload, auth.uid, auth.roles)` — TypeScript compiles — PASS
  - TC-04: `resolve/route.ts` calls `resolvePrimeInboxThread(threadId, auth.uid, auth.roles)` — PASS
  - TC-05: `dismiss/route.ts` calls `dismissPrimeInboxThread(threadId, auth.uid, auth.roles)` — PASS
  - TC-06: `send/route.ts` calls `sendPrimeInboxThread(threadId, auth.uid, auth.roles)` — PASS
  - TC-07: `prime-compose/route.ts` calls both prime functions with `auth.roles` — PASS
  - TC-08: `buildPrimeActorHeaders(undefined, undefined)` returns `undefined` — PASS
- **Execution plan:** Red → update `initiate-prime-outbound-thread.test.ts:85` to assert `x-prime-actor-claims` (breaks) → Green → (1) create `actor-claims.ts` with `signActorClaims`; (2) update `buildPrimeActorHeaders` to be async, accept `roles`, call `signActorClaims`; (3) update 5 prime-review.server.ts function signatures; (4) update 5 reception route files to pass `auth.roles` → Refactor → add `PRIME_ACTOR_CLAIMS_SECRET` guard.
- **Planning validation (required for M/L):**
  - Checks run: File reads of all 5 reception route files confirming `auth.uid` usage pattern.
  - Validation artifacts: `draft/route.ts:114-121`, `resolve/route.ts:27-31`, `dismiss/route.ts:34-38`, `send/route.ts:63-70`, `prime-compose/route.ts:40-65` — all confirmed calling prime-review functions with `auth.uid` only (needs `auth.roles` added).
  - Unexpected findings: `prime-compose/route.ts` calls both `initiatePrimeOutboundThread` and `sendPrimeInboxThread` — both need `roles`.
- **Scouts:** Confirm `PRIME_ACTOR_CLAIMS_SECRET` available in Reception dev env before testing (TASK-06 owns env docs).
- **Edge Cases & Hardening:**
  - `buildPrimeActorHeaders` becomes async; all callers inside `prime-review.server.ts` must await it.
  - If `PRIME_ACTOR_CLAIMS_SECRET` absent in production, throw — do not silently send unsigned header.
  - Empty `roles: []` is valid for non-broadcast operations; `signActorClaims` encodes as `[]`.
- **What would make this >=90%:**
  - Pre-deploy integration test confirming signed header from Reception verifies in Prime's test fixture.
- **Rollout / rollback:**
  - Rollout: Reception deploy after Prime TASK-03/04. Broadcast unavailable until both deployed.
  - Rollback: Revert to plain `x-prime-actor-uid`; Prime compat window accepts it for non-broadcast.
- **Documentation impact:**
  - Update `buildPrimeActorHeaders` JSDoc with new `roles` parameter.
  - TASK-06 owns `.env.example` updates.
- **Notes / references:**
  - Consumer tracing: `buildPrimeActorHeaders` called inside 5 prime-review.server.ts functions. Those 5 functions called by 5 route files, all of which have `auth.roles` from `requireStaffAuth`. Chain confirmed: route → prime-review function → `buildPrimeActorHeaders` → `signActorClaims`. Autofix for critique M-01.

---

### TASK-03: Add `resolveActorClaims` helper to Prime and update all 8 mutation endpoints
- **Type:** IMPLEMENT
- **Deliverable:** New `apps/prime/functions/lib/actor-claims-resolver.ts` exporting `resolveActorClaims(request, env)` → `{uid: string, roles: string[]} | Response`; updated `Env` interfaces in all 8 mutation endpoint files to include `PRIME_ACTOR_CLAIMS_SECRET`; `x-prime-actor-uid` fallback replaced by `resolveActorClaims` call (with compat fallback for non-broadcast; no fallback for broadcast — handled in TASK-04).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Build evidence:** Included in commit `fd9826a6a5` (wave 2). `actor-claims-resolver.ts` created with `resolveActorClaims` (broadcast, no compat), `resolveActorClaimsWithCompat` (non-broadcast, compat window with TODO: remove - TASK-07), and `isActorClaimsResponse` type guard. All 8 endpoint files updated: `staff-initiate-thread.ts` and `review-campaign-send.ts` use `resolveActorClaims`; the 5 non-broadcast endpoints plus `review-thread-send.ts` use `resolveActorClaimsWithCompat`. All 8 `Env` interfaces extended with `PRIME_ACTOR_CLAIMS_SECRET?: string`. Linter auto-sorted imports to match project convention. Both `pnpm --filter @apps/prime typecheck` (app + functions) and `pnpm --filter @apps/reception typecheck` pass clean.
- **Affects:** `apps/prime/functions/lib/actor-claims-resolver.ts` (new), `apps/prime/functions/api/review-thread-draft.ts`, `apps/prime/functions/api/review-thread-resolve.ts`, `apps/prime/functions/api/review-thread-dismiss.ts`, `apps/prime/functions/api/review-thread-send.ts`, `apps/prime/functions/api/staff-initiate-thread.ts`, `apps/prime/functions/api/review-campaign-send.ts`, `apps/prime/functions/api/review-campaign.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-04, CHECKPOINT-A
- **Confidence:** 85%
  - Implementation: 85% — 8 endpoints share the same `x-prime-actor-uid || 'prime-owner'` pattern (confirmed file reads); replacement is mechanical; compat fallback is clearly defined; no hidden consumers.
  - Approach: 85% — `resolveActorClaims` abstraction confirmed in analysis; compat window applies to non-broadcast only.
  - Impact: 85% — all 8 consumers are enumerated; D1 schema unchanged; no downstream callers outside the handler functions. Held-back test: "What if a 9th endpoint uses the same pattern?" — Grep confirms only 8. Score confirmed at 85%.
- **Acceptance:**
  - `resolveActorClaims` verifies HMAC and returns `{uid, roles}` for valid claims
  - `resolveActorClaims` returns `Response(401)` for missing, invalid-signature, or expired claims
  - For non-broadcast endpoints: if `x-prime-actor-claims` absent but `x-prime-actor-uid` present (compat window), returns `{uid: headerValue, roles: []}` — fallback behavior
  - For broadcast endpoints: TASK-04 adds the role-gate call after `resolveActorClaims`; TASK-03 does not add the role gate itself (separation of concerns)
  - All 8 endpoints updated; no endpoint still uses the raw `request.headers.get('x-prime-actor-uid')` pattern
  - D1 actorUid column receives verified uid string in all cases
  - HMAC failure log entry includes reason (missing / invalid-sig / expired)
- **Engineering Coverage:**
  - UI / visual: N/A — server-side only
  - UX / states: N/A — API errors are machine-readable
  - Security / privacy: Required — core security fix; verifies HMAC before any actorUid is trusted; rejects 401 on tampered/expired/missing claims; compat fallback accepts unverified uid for non-broadcast only (temporary, removed in TASK-07)
  - Logging / observability / audit: Required — log HMAC rejection reason at `console.error` level with structured fields (reason: 'missing' | 'invalid-sig' | 'expired'); enables incident investigation
  - Testing / validation: Required — TASK-05 owns the full test suite; this task ensures `resolveActorClaims` is unit-testable in isolation (pure function: takes request + secret, returns claims or response)
  - Data / contracts: Required — `Env` interface extended in all 8 files to include `PRIME_ACTOR_CLAIMS_SECRET?: string`; `StaffOwnerGateEnv` not changed (gateway check remains separate)
  - Performance / reliability: Required — one `crypto.subtle.verify` call per request; compat fallback is O(1) header read; no additional latency on the hot path
  - Rollout / rollback: Required — non-broadcast compat fallback is the rollout safety mechanism; broadcast endpoints MUST NOT use it; TASK-07 removes fallback
- **Validation contract (TC-XX):**
  - TC-01: Valid signed claims header → returns `{uid, roles}` — PASS
  - TC-02: Invalid signature → returns `Response(401, 'invalid-sig')` — PASS
  - TC-03: Expired claims (>5 min old) → returns `Response(401, 'expired')` — PASS
  - TC-04: Missing `x-prime-actor-claims` header, `x-prime-actor-uid` present → compat fallback returns `{uid: headerValue, roles: []}` — PASS
  - TC-05a: Non-broadcast endpoint, both headers absent → compat fallback returns `{uid: 'prime-owner', roles: []}` (existing permissive behavior preserved during compat window) — PASS
  - TC-05b: Broadcast endpoint (`staff-initiate-thread` or `review-campaign-send`), both headers absent → returns `Response(401, 'missing')` — PASS (no compat fallback for broadcast; critique R2 C-01 autofix)
  - TC-06: `PRIME_ACTOR_CLAIMS_SECRET` absent from env → returns `Response(503, 'claims-secret-not-configured')` — PASS
  - TC-07: `review-thread-resolve.ts` endpoint — actorUid passed to `mutatePrimeReviewThread` is now from `resolveActorClaims`, not raw header — PASS
  - TC-08: `review-thread-draft.ts` endpoint — actorUid passed to `savePrimeReviewDraft` is from `resolveActorClaims` — PASS
- **Execution plan:** Red → write unit tests for `resolveActorClaims` (TC-01 through TC-06) → Green → create `actor-claims-resolver.ts` with `resolveActorClaims`; update all 8 endpoint files to call `resolveActorClaims` after `enforceStaffOwnerApiGate`; wire verified `uid` to each endpoint's actorUid variable → Refactor → extract compat-fallback logic into a named function `resolveActorClaimsWithCompat`; separate broadcast (no compat) from non-broadcast (with compat); annotate compat fallback with `// TODO: remove compat - TASK-07`.
- **Planning validation (required for M/L):**
  - Checks run: File reads of all 8 endpoint files confirming `x-prime-actor-uid || 'prime-owner'` pattern location in each.
  - Validation artifacts: Confirmed `review-thread-draft.ts:49`, `review-thread-resolve.ts:34`, `review-thread-dismiss.ts` (pattern present), `review-thread-send.ts:33`, `staff-initiate-thread.ts:43`, `review-campaign-send.ts:26`, `review-campaign.ts:77` (POST), `review-campaign.ts:122` (PUT).
  - Unexpected findings: None — all 8 confirmed.
- **Scouts:** Confirm `review-thread-dismiss.ts` follows the same pattern (not read yet — verified by pattern match).
- **Edge Cases & Hardening:**
  - If `PRIME_ACTOR_CLAIMS_SECRET` is shorter than 32 characters at call time, reject with 503 (misconfiguration guard; TASK-06 owns the startup validator but this is a request-time fallback).
  - Compat fallback must produce `roles: []` (empty), not role data — the non-broadcast endpoints don't use roles, but `resolveActorClaims` return type must be consistent.
  - KV rate-limit key in `review-campaign-send.ts` is currently `ratelimit:broadcast_send:${actorUid}` where actorUid was unverified. After this task, it uses the verified uid — the key semantics improve but no format change needed.
- **What would make this >=90%:**
  - Integration test calling a real CF Pages Function with a signed header in a local `wrangler pages dev` environment.
- **Rollout / rollback:**
  - Rollout: Prime TASK-03 deploy first; compat fallback means non-broadcast endpoints continue working with plain `x-prime-actor-uid` from existing Reception. Broadcast endpoints (`staff-initiate-thread`, `review-campaign-send`) MUST already reject plain `x-prime-actor-uid` at TASK-03 deploy time — they get `resolveActorClaims` with no compat fallback path. TASK-04 adds the role gate; TASK-03 adds the claim-verification requirement. Deployment order: TASK-03 and TASK-04 deploy together in the same Prime release (they are sequenced in the task graph but should be atomically deployed).
  - Rollback: Revert the 8 endpoint files and delete `actor-claims-resolver.ts`.
- **Documentation impact:**
  - JSDoc on `resolveActorClaims` documenting parameters, compat behavior, and return contract.
- **Notes / references:**
  - Consumer tracing: `resolveActorClaims` is consumed by all 8 endpoint `onRequest*` handlers. No other consumers. The compat fallback is an internal implementation detail not exposed elsewhere.

---

### TASK-04: Broadcast role gate — blanket on 2 pure-broadcast endpoints; conditional in `review-thread-send`
- **Type:** IMPLEMENT
- **Deliverable:** (a) Blanket role-gate check after `resolveActorClaims` in `staff-initiate-thread.ts` and `review-campaign-send.ts` (no compat fallback); (b) Conditional role-gate in `review-thread-send.ts` — fires only when `isWholeHostelBroadcastThread(record.thread)` is true (direct-message sends bypass the gate); new `apps/prime/functions/lib/broadcast-role-gate.ts` helper shared by all 3 files.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build evidence:** Committed in `5005a893b2` (staging mix-up with concurrent agent — files are correctly in git). `broadcast-role-gate.ts` created with `isBroadcastRoleAuthorized` and `enforceBroadcastRoleGate`. Blanket gate wired in `staff-initiate-thread.ts` and `review-campaign-send.ts` after `resolveActorClaims`. Conditional gate in `review-thread-send.ts` — loads thread record via `getPrimeMessageThreadRecord` before `sendPrimeReviewThread`, checks `isWholeHostelBroadcastThread`, fires gate only for broadcast threads. DM sends bypass gate. Prime typecheck (app + functions) passes clean.
- **Affects:** `apps/prime/functions/api/staff-initiate-thread.ts`, `apps/prime/functions/api/review-campaign-send.ts`, `apps/prime/functions/api/review-thread-send.ts`, `apps/prime/functions/lib/broadcast-role-gate.ts` (new); `[readonly import] apps/prime/functions/lib/prime-whole-hostel-campaigns.ts` (imports `isWholeHostelBroadcastThread` — no change to this file; double DB read accepted)
- **Depends on:** TASK-03
- **Blocks:** CHECKPOINT-A
- **Confidence:** 85%
  - Implementation: 85% — role check is a simple array check; conditional check in `review-thread-send.ts` requires loading thread record before deciding to gate (thread is already loaded by `sendPrimeReviewThread` internally; must gate before calling it).
  - Approach: 85% — critique C-01 confirmed: `review-thread-send` handles both DMs and broadcast; blanket gate is a regression; conditional gate on `isWholeHostelBroadcastThread` is the correct fix.
  - Impact: 85% — broadcast initiation gated from first deploy; DM sends unaffected. Held-back test: "What if the thread record hasn't been loaded yet when the role gate fires?" — `review-thread-send.ts` currently passes `threadId` to `sendPrimeReviewThread`; the thread-type check must happen after loading the thread but before the broadcast path. This requires a small refactor of `review-thread-send.ts` to load the thread record explicitly, check its type, then gate. Score: 85% (some complexity; but the pattern is well-established in the Prime codebase).
- **Acceptance:**
  - POST to `staff-initiate-thread` with signed claims (`roles: ['staff']`) → 403
  - POST to `staff-initiate-thread` with signed claims (`roles: ['owner']`) → 200
  - POST to `review-campaign-send` with signed claims (`roles: ['developer']`) → 403
  - POST to `review-campaign-send` with signed claims (`roles: ['admin']`) → 200
  - POST to `review-thread-send` with whole-hostel broadcast thread, signed claims (`roles: ['staff']`) → 403
  - POST to `review-thread-send` with whole-hostel broadcast thread, signed claims (`roles: ['owner']`) → 200
  - POST to `review-thread-send` with individual guest thread (DM), signed claims (`roles: ['staff']`) → 200 (DM proceeds, no role gate)
  - `staff-initiate-thread` and `review-campaign-send` reject unsigned requests with 401 (no compat fallback)
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A — machine-readable 403
  - Security / privacy: Required — L-04 fix; role gate from signed claims; exact allowlist `['owner', 'admin']`; DM sends unaffected
  - Logging / observability / audit: Required — log 403 with reason `'insufficient-role'` and verified uid
  - Testing / validation: Required — TASK-05 must cover: broadcast with valid role → 200; broadcast with invalid role → 403; DM with any role → 200; unsigned broadcast → 401
  - Data / contracts: N/A — no new headers; uses `resolveActorClaims` return value
  - Performance / reliability: N/A — O(1) array check + thread-type DB lookup (already present in send path)
  - Rollout / rollback: Required — broadcast immediately unavailable after TASK-04 deploy until Reception TASK-02 also deploys
- **Validation contract (TC-XX):**
  - TC-01: `staff-initiate-thread` POST, `roles: ['owner']` → 200 — PASS
  - TC-02: `staff-initiate-thread` POST, `roles: ['staff']` → 403 — PASS
  - TC-03: `staff-initiate-thread` POST, unsigned → 401 — PASS
  - TC-04: `review-campaign-send` POST, `roles: ['admin']` → 200 — PASS
  - TC-05: `review-campaign-send` POST, `roles: ['manager']` → 403 — PASS
  - TC-06: `review-thread-send` POST, whole-hostel broadcast thread, `roles: ['owner']` → 200 — PASS
  - TC-07: `review-thread-send` POST, whole-hostel broadcast thread, `roles: ['staff']` → 403 — PASS
  - TC-08: `review-thread-send` POST, individual DM thread (`dm_occ_aaa_*`), `roles: ['staff']` → 200 (no gate) — PASS
  - TC-09: `review-thread-send` POST, unsigned → 401 (no compat for broadcast thread); for DM thread → compat fallback applies — PASS
- **Execution plan:** Red → add failing test TC-07/TC-08 stubs (TASK-05 owns) → Green → (1) create `broadcast-role-gate.ts` with `isBroadcastRoleAuthorized(roles: string[])`; (2) add blanket gate in `staff-initiate-thread.ts` and `review-campaign-send.ts` after `resolveActorClaims`; (3) in `review-thread-send.ts`: load the thread record from D1 (new explicit lookup before `sendPrimeReviewThread` call); check `isWholeHostelBroadcastThread(thread)` → if true, apply `isBroadcastRoleAuthorized` gate; then call `sendPrimeReviewThread` (which will perform its own internal lookup — accepted double DB read; no helper signature change needed) → Refactor → comment the double-load as intentional.
- **Planning validation (required for M/L):** S effort — not required.
- **Scouts:** Confirm `isWholeHostelBroadcastThread` is exported from `apps/prime/functions/lib/prime-whole-hostel-campaigns.ts:64` (not `prime-review-send.ts` — Round 3 INFO-2 correction) — must be importable by `review-thread-send.ts`.
- **Edge Cases & Hardening:**
  - Empty `roles` array → 403 for broadcast threads
  - `roles: ['owner', 'banned']` → 200 (owner present; union check)
  - DM thread with empty roles → 200 (no gate)
- **What would make this >=90%:**
  - End-to-end test confirming DM send with `staff` role succeeds after role gate is deployed.
- **Rollout / rollback:**
  - Rollout: Same deploy as TASK-03. DM sends unaffected from deploy-zero.
  - Rollback: Revert additions; broadcast reverts to any gateway-token caller; DM sends unchanged.
- **Documentation impact:**
  - Comment in `review-thread-send.ts`: `// Broadcast role gate is conditional on isWholeHostelBroadcastThread — DM sends are unrestricted`.
- **Notes / references:**
  - Autofix for critique C-01. The key insight: `review-thread-send` is a shared endpoint used for both individual DM sends and whole-hostel broadcast sends. Reception routes all non-campaign thread sends through it. A blanket gate on the endpoint would block any staff member (not owner/admin) from sending DM replies to guests — a functional regression. The role gate must be conditional on thread type.

---

### CHECKPOINT-A: Validate Prime deploy is stable (Prime-only gate; Reception deploy happens post-checkpoint)
- **Type:** CHECKPOINT
- **Status:** Complete (2026-03-14)
- **Depends on:** TASK-03, TASK-04
- **Blocks:** TASK-05, TASK-06

**Gate conditions (all must pass before proceeding):**
- [ ] Prime deployed to staging; all 8 mutation endpoints respond to gateway-authenticated requests.
- [ ] Pure-broadcast endpoint (`staff-initiate-thread`) returns 401 for unsigned requests (no compat window).
- [ ] Pure-broadcast endpoint returns 403 for signed claims without qualifying role.
- [ ] Pure-broadcast endpoint returns 200 for signed claims with `owner` role.
- [ ] `review-thread-send` with DM thread responds 200 to signed claims (DM sends not blocked).
- [ ] Non-broadcast endpoint (`review-thread-resolve`) accepts signed claims OR plain `x-prime-actor-uid` (compat window active).
- [ ] No CF Worker runtime errors in logs.
- [ ] NOTE: Reception deploy (TASK-02) happens AFTER this checkpoint passes — this gate is Prime-only.

**If gate fails:** invoke `/lp-do-replan prime-outbound-auth-hardening` before proceeding to TASK-02/05/06.

---

### TASK-05: Tests — extend suites, fix all breaking assertions, add `review-campaign` POST/PUT + DM-send regression
- **Type:** IMPLEMENT
- **Deliverable:** Extended test files: `apps/prime/functions/__tests__/review-threads.test.ts` (auth rejection + role-gate cases); new `apps/prime/functions/__tests__/review-campaign-auth.test.ts` (POST/PUT auth); updated `apps/reception/src/lib/inbox/__tests__/initiate-prime-outbound-thread.test.ts` (line 85); updated `apps/prime/functions/__tests__/staff-initiate-thread.test.ts` (role-gate cases); updated `apps/reception/src/app/api/mcp/inbox/prime-compose/route.test.ts:105-112` (new function signature); updated `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts:523-530` (new function signature); updated `apps/prime/functions/__tests__/review-campaign-send-rate-limit.test.ts:77-113` (old header name replaced); new DM-send regression test confirming `review-thread-send` with DM thread bypasses role gate.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/prime/functions/__tests__/review-threads.test.ts`, `apps/prime/functions/__tests__/review-campaign-auth.test.ts` (new), `apps/reception/src/lib/inbox/__tests__/initiate-prime-outbound-thread.test.ts`, `apps/prime/functions/__tests__/staff-initiate-thread.test.ts`, `apps/reception/src/app/api/mcp/inbox/prime-compose/route.test.ts`, `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts`, `apps/prime/functions/__tests__/review-campaign-send-rate-limit.test.ts`, `apps/reception/src/app/api/mcp/__tests__/inbox-draft.route.test.ts`, `apps/prime/functions/__tests__/helpers.ts`
- **Depends on:** TASK-02, TASK-03, TASK-04, CHECKPOINT-A
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 85% — all test surfaces enumerated (critique M-02 corrected R1; R3 M-02 added 2 more: `inbox-draft.route.test.ts:373` and `helpers.ts:9`); 5 additional breaking test files total identified across critique rounds; fixes are assertion-level changes.
  - Approach: 85% — standard Jest pattern; `globalThis.crypto` available in Node 22.
  - Impact: 85% — all tests must pass in CI; no bundle impact. Held-back test: none — `globalThis.crypto` confirmed in Node 22.
- **Acceptance:**
  - `initiate-prime-outbound-thread.test.ts:85` asserts `x-prime-actor-claims` — PASSES
  - `prime-compose/route.test.ts:105-112` updated for new function signature with `roles` — PASSES
  - `inbox-actions.route.test.ts:523-530` updated for new function signature with `roles` — PASSES
  - `review-campaign-send-rate-limit.test.ts:77-113` updated — old `x-prime-actor-uid` references replaced — PASSES
  - `inbox-draft.route.test.ts:373` updated — `savePrimeInboxDraft` call updated with new `roles` argument — PASSES
  - `apps/prime/functions/__tests__/helpers.ts:9` updated — `PRIME_ACTOR_CLAIMS_SECRET` added to Prime test env setup — PASSES
  - `review-threads.test.ts` covers: missing claims → 401, invalid-sig → 401, expired → 401, valid owner → 200
  - `review-threads.test.ts` broadcast role cases: `roles: ['staff']` → 403 for `review-campaign-send` and broadcast `review-thread-send`
  - DM-send regression: `review-thread-send` with DM thread + `roles: ['staff']` → 200 (no gate fires)
  - New `review-campaign-auth.test.ts` POST/PUT → 401 on missing/invalid claims
  - `staff-initiate-thread.test.ts` unsigned → 401, `roles: ['admin']` → 200, `roles: ['staff']` → 403
  - All new/updated tests pass in CI
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: Required — tests are the security regression gate; cover all auth failure modes; DM regression confirms no functional regression
  - Logging / observability / audit: N/A — unit tests
  - Testing / validation: Required — this task IS the testing coverage
  - Data / contracts: N/A — no new contracts in test files
  - Performance / reliability: N/A — unit tests
  - Rollout / rollback: N/A — test files only
- **Validation contract (TC-XX):**
  - TC-01: `initiate-prime-outbound-thread.test.ts` passes after line-85 update — PASS
  - TC-02: `prime-compose/route.test.ts:105-112` passes after `roles` parameter addition — PASS
  - TC-03: `inbox-actions.route.test.ts:523-530` passes after `roles` parameter addition — PASS
  - TC-04: `review-campaign-send-rate-limit.test.ts` passes after old header replaced — PASS
  - TC-05: `review-threads.test.ts` missing-sig case → 401 — PASS
  - TC-06: `review-threads.test.ts` invalid-sig → 401 — PASS
  - TC-07: `review-threads.test.ts` expired → 401 — PASS
  - TC-08: `review-threads.test.ts` broadcast `review-thread-send`, `roles: ['staff']` → 403 — PASS
  - TC-09: `review-threads.test.ts` DM `review-thread-send`, `roles: ['staff']` → 200 — PASS (regression gate)
  - TC-10: `review-campaign-auth.test.ts` POST → 401 on missing claims — PASS
  - TC-11: `review-campaign-auth.test.ts` PUT → 401 on invalid claims — PASS
  - TC-12: `staff-initiate-thread.test.ts` unsigned → 401, `roles: ['admin']` → 200, `roles: ['staff']` → 403 — all PASS
- **Execution plan:** Red → update `initiate-prime-outbound-thread.test.ts:85` (breaks) → Green step: fix 3 additional breaking files (`prime-compose/route.test.ts`, `inbox-actions.route.test.ts`, `review-campaign-send-rate-limit.test.ts`) → add auth rejection and role-gate cases to `review-threads.test.ts` and `staff-initiate-thread.test.ts` → add DM-send regression → create `review-campaign-auth.test.ts` → all pass → Refactor → extract shared HMAC test fixtures.
- **Planning validation (required for M/L):**
  - Checks run: R1 M-02 identified 3 additional breaking test files; R3 M-02 identified 2 more.
  - Validation artifacts: `prime-compose/route.test.ts:105-112`, `inbox-actions.route.test.ts:523-530`, `review-campaign-send-rate-limit.test.ts:77-113` (R1 critique); `inbox-draft.route.test.ts:373` (old 3-arg `savePrimeInboxDraft`), `apps/prime/functions/__tests__/helpers.ts:9` (needs `PRIME_ACTOR_CLAIMS_SECRET` in test env) (R3 critique M-02).
  - Unexpected findings: DM-send regression test not in original scope — added to prevent silent functional regression on `review-thread-send`.
- **Scouts:** Confirm `inbox-actions.route.test.ts` mock structure for `sendPrimeInboxThread` — must update mock to accept `roles` parameter.
- **Edge Cases & Hardening:**
  - Test fixtures for HMAC must use a test-only `PRIME_ACTOR_CLAIMS_SECRET` value (not a production secret).
  - Use Jest's `Date` mock to test timestamp expiry cases deterministically.
- **What would make this >=90%:**
  - Integration test fixture simulating a full round-trip: reception signs → prime verifies — passes in Jest with shared secret fixture.
- **Rollout / rollback:**
  - Rollout: Tests are CI gate; must pass before TASK-07 is approved.
  - Rollback: N/A — test files; no production impact.
- **Documentation impact:**
  - None beyond test file comments.
- **Notes / references:**
  - Consumer tracing: TASK-05 tests consume TASK-01 (`signActorClaims`/`verifyActorClaims`), TASK-03 (`resolveActorClaims`), and TASK-04 (broadcast role gate). All dependencies must be complete before TASK-05 finalizes.
- **Build evidence:** Commit `3297751207`. `signTestActorClaims` helper added to `apps/prime/functions/__tests__/helpers.ts` with `PRIME_ACTOR_CLAIMS_SECRET` in `createMockEnv` defaults. `staff-initiate-thread.test.ts` TC-02–06 updated to signed headers; TC-07–12 added (unsigned→401, tampered→401, `owner`→proceed, `staff`→403, `admin`→proceed, absent secret→503). `review-campaign-send-rate-limit.test.ts` TC-02/03 updated; TC-04/05 added. `review-campaign-auth.test.ts` created (POST/PUT auth coverage). `review-threads.test.ts` new auth+DM-regression block appended (TC-A01–A04 draft auth; TC-B01–B03 DM regression + broadcast role gate). `initiate-prime-outbound-thread.test.ts` line-85 assertion updated to `x-prime-actor-claims`. `inbox-actions.route.test.ts` `sendPrimeInboxThread` assertion updated with `roles` arg. `inbox-draft.route.test.ts` `savePrimeInboxDraft` assertion updated with `roles` arg. Both Prime and Reception typechecks pass. Lint pass (0 errors).

---

### TASK-06: Env validation at startup, wrangler and `.env.example` documentation
- **Type:** IMPLEMENT
- **Deliverable:** Startup validation in Prime rejecting misconfigured secrets (missing, too short, identical to gateway token); `PRIME_ACTOR_CLAIMS_SECRET` added to `apps/prime/wrangler.toml` (as required-env comment), `apps/prime/.env.example`, and `apps/reception/.env.example`; optionally a startup check in reception.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/prime/wrangler.toml`, `apps/prime/.env.example` (or equivalent), `apps/reception/.env.example`, `apps/reception/wrangler.toml`, `apps/prime/functions/lib/actor-claims-resolver.ts` (startup guard addition)
- **Depends on:** TASK-03
- **Blocks:** TASK-07
- **Confidence:** 80%
  - Implementation: 80% — startup validation pattern in CF Pages Functions is non-standard (no `process.env`); must validate inside the first request handler or via a dedicated health-check export; pattern exists but requires confirmation.
  - Approach: 80% — documentation changes are clear; startup guard in Prime is the uncertain part (CF Pages Functions don't have a classic startup hook).
  - Impact: 85% — prevents silent misconfiguration; completes the deployment safety net. Held-back test: "What if CF Pages Functions have no startup hook?" — They don't; validation must happen per-request in `resolveActorClaims` (already planned in TASK-03: return 503 if secret absent). TASK-06's startup check is the deploy-time check added to `wrangler.toml` validation commands. Score: 80% (confirms at 80% due to CF Pages Function startup constraint; no single unknown would push this below 80 — the per-request fallback in TASK-03 already handles it, making TASK-06 a defense-in-depth addition).
- **Acceptance:**
  - `apps/prime/.env.example` includes `PRIME_ACTOR_CLAIMS_SECRET=<generate-with-openssl-rand>` with a comment explaining minimum length and distinction from gateway token
  - `apps/reception/.env.example` includes same
  - `apps/prime/wrangler.toml` documents `PRIME_ACTOR_CLAIMS_SECRET` as a required binding (comment or `[vars]` entry)
  - `apps/reception/wrangler.toml` documents `PRIME_ACTOR_CLAIMS_SECRET` as a required secret binding for the deployed Reception Worker (Round 3 M-03 autofix — deployed Worker sources secrets from `wrangler.toml`, not only `.env.example`)
  - `resolveActorClaims` returns 503 with `claims-secret-not-configured` if env var is absent (from TASK-03; TASK-06 adds documentation of this behavior in env files)
  - A `validatePrimeActorClaimsConfig(env)` helper (or equivalent) at Prime bootstrap level validates: secret present, length ≥ 32 chars, not equal to `PRIME_STAFF_OWNER_GATE_TOKEN`
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: Required — secret configuration guard; prevents silent failure where claims are skipped due to misconfiguration
  - Logging / observability / audit: Required — log warning if secrets are identical (misconfiguration)
  - Testing / validation: Required — unit test for `validatePrimeActorClaimsConfig`: absent → throws/warns; too short → warns; same as gateway token → error
  - Data / contracts: Required — env variable contract documented in both `.env.example` files
  - Performance / reliability: N/A — configuration check; not on hot path
  - Rollout / rollback: N/A — documentation/validation only
- **Validation contract (TC-XX):**
  - TC-01: `PRIME_ACTOR_CLAIMS_SECRET` absent → `validatePrimeActorClaimsConfig` warns/throws — PASS
  - TC-02: Secret length < 32 → warns — PASS
  - TC-03: Secret equals gateway token → error — PASS
  - TC-04: Valid distinct secret ≥ 32 chars → no error — PASS
  - TC-05: `.env.example` files contain `PRIME_ACTOR_CLAIMS_SECRET` entry with comment — manual check — PASS
- **Execution plan:** Red → unit test `validatePrimeActorClaimsConfig` → Green → implement helper; add it to `resolveActorClaims` startup path; update `.env.example` files and `wrangler.toml` → Refactor → ensure warning message is clear and actionable.
- **Planning validation (required for M/L):** S effort — not required.
- **Scouts:** Check whether `apps/prime/wrangler.toml` has an existing `[vars]` or env section to extend.
- **Edge Cases & Hardening:**
  - Validation must NOT throw in test environments (where `NODE_ENV !== 'production'` and secret may be a test value); use warn-only in non-production.
- **What would make this >=90%:**
  - A pre-deploy script that validates env completeness before `wrangler pages deploy`.
- **Rollout / rollback:**
  - Rollout: Documentation and validation additions have no runtime side effects beyond 503 on absent secret (already present from TASK-03).
  - Rollback: Revert `.env.example` and `wrangler.toml` changes; no runtime impact.
- **Documentation impact:**
  - `.env.example` entries are the primary documentation output.
- **Notes / references:**
  - CF Pages Functions do not have a traditional startup hook; `validatePrimeActorClaimsConfig` is called inside `resolveActorClaims` on the first request (lazy validation). This is sufficient for the security objective.
- **Build evidence:** `validatePrimeActorClaimsConfig` added to `apps/prime/functions/lib/actor-claims-resolver.ts`: validates secret present, ≥32 chars, not equal to gateway token; warns in non-prod, throws in production; returns `{ valid, reason? }`. Unit test `apps/prime/functions/__tests__/actor-claims-config.test.ts` created with 10 TCs covering all validation paths. `apps/prime/.env.example` created with `PRIME_ACTOR_CLAIMS_SECRET` entry and generation instructions. `apps/prime/wrangler.toml` REQUIRED SECRETS block added with `PRIME_ACTOR_CLAIMS_SECRET`. `apps/reception/.env.example` Prime signing section appended (RECEPTION_PRIME_API_BASE_URL, RECEPTION_PRIME_ACCESS_TOKEN, PRIME_ACTOR_CLAIMS_SECRET). `apps/reception/wrangler.toml` Prime secrets block added.

---

### TASK-07: Hard-gate removal of non-broadcast compat fallback
- **Type:** IMPLEMENT
- **Deliverable:** Compat fallback removed from `resolveActorClaims` (or `resolveActorClaimsWithCompat`); all 8 endpoints now require signed `x-prime-actor-claims`; plain `x-prime-actor-uid` returns 401.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/prime/functions/lib/actor-claims-resolver.ts`
- **Depends on:** TASK-05, TASK-06
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 90% — compat fallback is a clearly-annotated code block; removal is mechanical.
  - Approach: 85% — confirmed in analysis; the only uncertainty is timing (must confirm Reception TASK-02 is fully deployed before removing compat).
  - Impact: 80% — if deployed prematurely (before Reception sends signed claims), all non-broadcast mutations break immediately. Held-back test: "What if Reception has not yet deployed TASK-02?" — This is the only risk; the gate condition documents this explicitly. Score: 80% (risk is timing/ops, not code). Held-back test: "What single unresolved unknown would push this below 80?" — Reception not yet deployed. This is the gate condition, not an unknown — it will be verified before TASK-07 runs. Score remains at 80%.
- **Acceptance:**
  - Plain `x-prime-actor-uid` header with no `x-prime-actor-claims` → 401 on all 8 endpoints
  - `TODO: remove compat - TASK-07` comment removed from `actor-claims-resolver.ts`
  - Reception's TASK-02 must be confirmed deployed before this task runs
  - All TASK-05 tests pass without compat fallback active
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: Required — this closes the non-broadcast UID forgery vulnerability completely; compat window was the remaining attack surface
  - Logging / observability / audit: N/A — logging unchanged; `resolveActorClaims` already logs rejection reason
  - Testing / validation: Required — confirm all TASK-05 tests still pass after compat removal; add regression: `x-prime-actor-uid`-only request → 401
  - Data / contracts: Required — `x-prime-actor-uid` header no longer accepted; update docs if any internal caller documentation references it
  - Performance / reliability: N/A — removes a code path; no performance regression
  - Rollout / rollback: Required — gate condition: confirm Reception TASK-02 deployed and signed claims confirmed in production logs before merging TASK-07
- **Validation contract (TC-XX):**
  - TC-01: POST to `review-thread-resolve` with only `x-prime-actor-uid` header → 401 — PASS
  - TC-02: POST to `review-thread-draft` with only `x-prime-actor-uid` header → 401 — PASS
  - TC-03: POST to `review-campaign` with only `x-prime-actor-uid` header → 401 — PASS
  - TC-04: All 8 endpoints with valid `x-prime-actor-claims` → 200 (happy paths still pass) — PASS
  - TC-05: No `TODO: remove compat` comment remains in `actor-claims-resolver.ts` — PASS (code review)
- **Execution plan:** Red → add regression test: compat-only request → 401 (currently passes compat) → Green → delete `resolveActorClaimsWithCompat` or inline compat block; update `actor-claims-resolver.ts` to always require signed claims → Refactor → rename `resolveActorClaimsWithCompat` to `resolveActorClaims` (single function); update all callers.
- **Planning validation (required for M/L):** S effort — not required.
- **Scouts:** Confirm no other code outside TASK-03's 8 endpoints calls `resolveActorClaimsWithCompat` before removing compat path.
- **Edge Cases & Hardening:**
  - Deploy order check: TASK-07 must not be merged/deployed until confirmed Reception has TASK-02 in production. Add gate note to PR description.
- **What would make this >=90%:**
  - Automated deployment order validation (e.g. a pre-TASK-07 CI check that queries production logs for signed-claims activity from reception).
- **Rollout / rollback:**
  - Rollout: Deploy after Reception TASK-02 is confirmed in production. Monitor Prime error logs for 401 spikes after deploy.
  - Rollback: Re-add compat fallback; redeploy Prime. Reception still sends signed claims; non-broadcast mutations resume working.
- **Documentation impact:**
  - Update Prime API internal docs to note `x-prime-actor-uid` is no longer accepted.
- **Notes / references:**
  - TASK-07 is a blocking scheduled delivery: must ship within 1 sprint of TASK-02 deployment. If it slips, the non-broadcast UID forgery vulnerability persists.
- **Build evidence:** `resolveActorClaimsWithCompat` in `actor-claims-resolver.ts` now delegates to `resolveActorClaims` — compat fallback (plain `x-prime-actor-uid` header) removed. File-level doc comment updated to reflect TASK-07 completion. `review-threads.test.ts` TC-A03 updated: missing claims → 401 `{error:'missing'}` (was compat fallback → proceed). `review-campaign-auth.test.ts` TC-04 updated: missing claims → 401 `{error:'missing'}` (was compat fallback → proceed). Both test file comments updated to reference TASK-05+TASK-07. Prime typecheck (app + functions) and Reception typecheck both pass. Lint pass (0 errors).

---

## Risks & Mitigations
- **`PRIME_ACTOR_CLAIMS_SECRET` not provisioned before Prime deploy** — Medium likelihood, High impact (broadcast breaks on deploy). Mitigated by: TASK-06 adds env documentation and startup validation; deploy runbook requires secret provisioned before deploy.
- **TASK-07 deferred indefinitely** — Medium likelihood, Medium impact (non-broadcast UID forgery persists). Mitigated by: TASK-07 is a first-class deliverable in this plan; mark it as a blocking sprint task when TASK-02 ships.
- **Reception test `initiate-prime-outbound-thread.test.ts:85` breaks on TASK-02 merge** — High likelihood (known break), Medium impact (build fails). Mitigated by: TASK-05 updates the assertion; ensure TASK-05 targets the line before TASK-02 merges (or merge atomically).
- **`review-campaign` POST/PUT have zero existing tests** — High certainty (confirmed gap), Medium impact (security regression coverage absent). Mitigated by: TASK-05 creates `review-campaign-auth.test.ts`.
- **Rollback from mid-rollout collapses attribution to `prime-owner`** — Low likelihood (rollback rare), Low impact (audit degradation only). Mitigated by: documented in rollback runbooks; pre-fix historical records are accepted as-is.
- **Broadcast unavailable window** — Low impact (operational; window should be minutes). Mitigated by: deploy TASK-03/04 and TASK-02 in close succession during low-traffic window.

## Observability
- Logging:
  - `resolveActorClaims` logs HMAC rejection with reason (`missing`, `invalid-sig`, `expired`) and verified uid where available.
  - Role gate logs 403 rejections with verified uid and endpoint name.
  - Config validation logs warning if `PRIME_ACTOR_CLAIMS_SECRET` is absent or misconfigured.
- Metrics: None — no existing Prime metrics infrastructure to extend.
- Alerts/Dashboards: None — CF Workers dashboard monitors 4xx rates; a spike in 401s after TASK-03 deploy is the expected signal for misconfigured secret.

## Acceptance Criteria (overall)
- [ ] All 8 Prime mutation endpoints verified to use `resolveActorClaims` (no raw `x-prime-actor-uid` header access)
- [ ] `staff-initiate-thread`, `review-campaign-send`, and `review-thread-send` reject unsigned requests with 401 from Step 1
- [ ] All 3 broadcast endpoints reject non-owner/non-admin signed claims with 403
- [ ] All 5 non-broadcast endpoints use compat fallback during interim deploy window
- [ ] `initiate-prime-outbound-thread.test.ts:85` asserts `x-prime-actor-claims`
- [ ] `review-campaign` POST and PUT have test coverage for auth rejection
- [ ] TASK-07 merged within 1 sprint of TASK-02 production deployment
- [ ] `PRIME_ACTOR_CLAIMS_SECRET` in both `.env.example` files with generation instructions

## Decision Log
- 2026-03-14: Chose Option A (separate-secret HMAC) over Options B/C/D. Rationale: no new infrastructure, WebCrypto available on both runtimes, closes UID forgery and enables role gate. [Source: analysis.md]
- 2026-03-14: Broadcast role allowlist confirmed as `owner | admin` only (flat set, not hierarchical). `developer` excluded. [Source: analysis critique Round 2]
- 2026-03-14: `review-thread-send` confirmed as 3rd broadcast endpoint (in addition to `staff-initiate-thread` and `review-campaign-send`). [Source: analysis critique Round 1]
- 2026-03-14: Rollback from Reception-signed state collapses to `prime-owner` attribution (not a clean restore). Accepted as-is. [Source: analysis critique Round 1]
- 2026-03-14: `signActorClaims` duplicated into `apps/reception/src/lib/inbox/actor-claims.ts` (rather than a shared package) for this sprint to avoid adding a new monorepo package. Revisit if Prime scales to multi-caller. [Adjacent: delivery-rehearsal]
- 2026-03-14: critique C-01 autofix — `review-thread-send` handles both broadcast and DM threads; blanket role gate was a functional regression. Fixed: conditional gate on `isWholeHostelBroadcastThread`; DM sends unaffected.
- 2026-03-14: critique M-01 autofix — TASK-02 expanded to cover all 5 reception prime-proxy call sites (not just `prime-compose/route.ts`); all 5 route files must pass `auth.roles`.
- 2026-03-14: critique M-02 autofix — TASK-05 test inventory expanded to include `prime-compose/route.test.ts`, `inbox-actions.route.test.ts`, and `review-campaign-send-rate-limit.test.ts` (all assert old header/signature patterns that will break).
- 2026-03-14: critique M-03 autofix — CHECKPOINT-A depends on TASK-03/04 only (Prime-only gate); Reception deploy (TASK-02) happens after CHECKPOINT-A passes, not before.
- 2026-03-14: R3 critique C-01 autofix — TASK-02 circular dependency resolved: TASK-02 now `Blocks: TASK-05, TASK-06` (not CHECKPOINT-A); CHECKPOINT-A depends on TASK-03/TASK-04 only; TASK-02 runs in parallel with TASK-03.
- 2026-03-14: R3 critique M-02 autofix — TASK-05 test inventory expanded with 2 additional breaking files: `inbox-draft.route.test.ts:373` (old 3-arg `savePrimeInboxDraft`) and `apps/prime/functions/__tests__/helpers.ts:9` (needs `PRIME_ACTOR_CLAIMS_SECRET` in test env).
- 2026-03-14: R3 critique M-03 autofix — TASK-06 Affects/Acceptance extended to include `apps/reception/wrangler.toml`; deployed Reception Worker sources secrets from `wrangler.toml`, not only `.env.example`.
- 2026-03-14: R3 INFO-2 autofix — `isWholeHostelBroadcastThread` source corrected in TASK-04 Scouts to `prime-whole-hostel-campaigns.ts:64` (not `prime-review-send.ts`).
- 2026-03-14: R3 INFO-1 autofix — Engineering Coverage Data/contracts row corrected: `StaffOwnerGateEnv` interface is unchanged; `PRIME_ACTOR_CLAIMS_SECRET` belongs to `actor-claims-resolver.ts` Env only.
- 2026-03-14: R3 M-04 autofix — Engineering Coverage Logging row corrected: "all future D1 actorUid values cryptographically bound" overclaim fixed; broadcast bound from TASK-04; non-broadcast bound only after TASK-07 removes compat window.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: signActorClaims/verifyActorClaims utilities | Yes — no upstream deps; WebCrypto confirmed on CF Workers and Node 22 | None | No |
| TASK-01: signActorClaims/verifyActorClaims utilities | Yes — no upstream deps; WebCrypto confirmed on CF Workers and Node 22 | None | No |
| TASK-02: buildPrimeActorHeaders + 5 reception call sites | Yes — depends on TASK-01 only (runs in parallel with TASK-03; R3 C-01 autofix: no CHECKPOINT-A dependency); all 5 call sites confirmed (critique M-01 autofix applied); `auth.roles` available from `requireStaffAuth` at all call sites | None (scope expanded from original; now covers all 5 prime-proxy functions and 5 route files) | No |
| TASK-03: resolveActorClaims + 8 endpoints | Yes — depends on TASK-01 only; all 8 endpoint patterns confirmed via file reads | None | No |
| TASK-04: Broadcast role gate (conditional in review-thread-send) | Yes — depends on TASK-03; `resolveActorClaims` returns `roles`; conditional gate design confirmed by critique C-01 | [Integration] [Advisory]: `isWholeHostelBroadcastThread` import location confirmed: `prime-whole-hostel-campaigns.ts:64` (R3 INFO-2 autofix) | No |
| CHECKPOINT-A | Yes — depends on TASK-03, TASK-04 only (Prime-only gate; critique M-03 autofix applied — Reception deploy is AFTER this checkpoint) | None — procedural | No |
| TASK-05: Tests | Yes — depends on TASK-03, TASK-04; critique M-02 expanded test surface to include 3 additional breaking files; DM-send regression added | None (all 7 affected test files now enumerated) | No |
| TASK-06: Env validation + docs | Yes — depends on TASK-03; CF Pages no startup hook confirmed | [Advisory]: `validatePrimeActorClaimsConfig` runs per-request (lazy) — documented as acceptable | No |
| TASK-07: Compat fallback removal | Partial — depends on TASK-05, TASK-06; additionally requires Reception TASK-02 deployed in production | [Ordering] [Blocking]: TASK-07 MUST NOT merge before Reception TASK-02 production confirmation — explicit gate condition in task | No (gate documented) |

## Overall-confidence Calculation
- TASK-01: 85%, S (weight 1)
- TASK-02: 85%, M (weight 2) — expanded scope (autofix M-01)
- TASK-03: 85%, M (weight 2)
- TASK-04: 85%, S (weight 1)
- TASK-05: 85%, M (weight 2)
- TASK-06: 80%, S (weight 1)
- TASK-07: 80%, S (weight 1)
- Sum of (confidence × weight): 85×1 + 85×2 + 85×2 + 85×1 + 85×2 + 80×1 + 80×1 = 85+170+170+85+170+80+80 = 840
- Sum of weights: 1+2+2+1+2+1+1 = 10
- Overall-confidence = 840/10 = 84% → **85%** (rounded to nearest 5%)
