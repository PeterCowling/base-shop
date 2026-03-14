---
Type: Build-Record
Status: Complete
Domain: API
Last-reviewed: 2026-03-14
Feature-Slug: prime-outbound-auth-hardening
Execution-Track: code
Completed-date: 2026-03-14
artifact: build-record
Build-Event-Ref: docs/plans/prime-outbound-auth-hardening/build-event.json
---

# Build Record — prime-outbound-auth-hardening

**Feature-Slug:** prime-outbound-auth-hardening
**Dispatch-ID:** IDEA-DISPATCH-20260314160001-BRIK-004
**Date completed:** 2026-03-14
**Build method:** lp-do-build (code track)

---

## Outcome Contract

- **Why:** Staff identity is caller-controlled at the Prime API layer — any gateway-token holder can attribute actions to any staff UID, including audit records, broadcast sends, and message attributions. For broadcast this is a direct-harm risk (messages to all active guests attributed to wrong person).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this change, the actor UID recorded at the Prime layer is cryptographically bound to a short-lived signed claims header verified with a separate signing secret. A caller with only the gateway token cannot forge a different UID. The broadcast send path additionally requires `owner` or `admin` role (exact allowlist, not hierarchical).
- **Source:** auto

---

## What Was Built

**TASK-01 — WebCrypto HMAC-SHA256 primitives** (commit `6ba8300911`): Created `apps/prime/functions/lib/actor-claims.ts` with `signActorClaims({uid, roles, iat?})` and `verifyActorClaims(header, secret)`. Both functions use `crypto.subtle` exclusively (CF Workers compatible). The signed format is `<b64url-payload>.<b64url-sig>` with fixed-key-order JSON payload `{uid, roles, iat}` and a ±5 min timestamp window.

**TASK-02 — Reception signing side** (commit `fd9826a6a5`): Created `apps/reception/src/lib/inbox/actor-claims.ts` mirroring the signing logic. Made `buildPrimeActorHeaders` async and added `roles: string[]` parameter. Extended all 5 reception prime-proxy functions (`savePrimeInboxDraft`, `resolvePrimeInboxThread`, `dismissPrimeInboxThread`, `sendPrimeInboxThread`, `initiatePrimeOutboundThread`) to accept and forward `roles`. Updated all 5 reception route call sites to pass `auth.roles`.

**TASK-03 — Prime verification layer** (commit `fd9826a6a5`): Created `apps/prime/functions/lib/actor-claims-resolver.ts` with `resolveActorClaims` (broadcast, no compat fallback), `resolveActorClaimsWithCompat` (non-broadcast, compat window), and `isActorClaimsResponse` type guard. Updated all 8 Prime mutation endpoints — `staff-initiate-thread.ts` and `review-campaign-send.ts` use `resolveActorClaims`; the remaining 6 use `resolveActorClaimsWithCompat`. All 8 `Env` interfaces extended with `PRIME_ACTOR_CLAIMS_SECRET?: string`.

**TASK-04 — Broadcast role gate** (commit `5005a893b2`): Created `apps/prime/functions/lib/broadcast-role-gate.ts` with `isBroadcastRoleAuthorized(roles)` and `enforceBroadcastRoleGate(roles, uid)`. Blanket gate wired into `staff-initiate-thread.ts` and `review-campaign-send.ts`. Conditional gate in `review-thread-send.ts` — fires only when `isWholeHostelBroadcastThread(threadRecord.thread)` is true; DM sends bypass completely. Double DB read accepted to avoid coupling role-gate logic into the send helper.

**TASK-05 — Test coverage** (commit `3297751207`): Added `signTestActorClaims` helper and `TEST_ACTOR_CLAIMS_SECRET` constant to `helpers.ts`; `PRIME_ACTOR_CLAIMS_SECRET` added to `createMockEnv` defaults. Updated 7 existing test files to use signed headers and new function signatures. Created new `review-campaign-auth.test.ts` covering POST/PUT auth. Added auth coverage block and DM regression tests to `review-threads.test.ts`. Key cases covered: missing sig → 401, tampered sig → 401, expired → 401, staff role on broadcast → 403, DM send with staff role → not 403 (regression gate).

**TASK-06 — Env validation and docs** (commit `f34f5ee936`): Added `validatePrimeActorClaimsConfig()` to `actor-claims-resolver.ts` — validates secret present, ≥32 chars, not equal to gateway token; warns in non-production, throws in production. Created `apps/prime/.env.example` with `PRIME_ACTOR_CLAIMS_SECRET` entry. Updated `apps/prime/wrangler.toml` with full REQUIRED SECRETS block. Appended Prime signing vars section to `apps/reception/.env.example` and `apps/reception/wrangler.toml`. Unit tests in `actor-claims-config.test.ts` (10 TCs).

**TASK-07 — Compat fallback removal** (commit `02435507f2`): `resolveActorClaimsWithCompat` now delegates directly to `resolveActorClaims` — the plain `x-prime-actor-uid` fallback is gone. All 8 Prime mutation endpoints now require signed `x-prime-actor-claims`; missing header → 401 `{error: 'missing'}`. Updated TC-A03 in `review-threads.test.ts` and TC-04 in `review-campaign-auth.test.ts` to reflect the new 401 expectation.

---

## Commits

| Commit | Task | Description |
|---|---|---|
| `6ba8300911` | TASK-01 | WebCrypto HMAC-SHA256 sign/verify primitives |
| `fd9826a6a5` | TASK-02 + TASK-03 | Reception signing side + Prime resolver + all 8 endpoints |
| `5005a893b2` | TASK-04 | Broadcast role gate |
| `3297751207` | TASK-05 | Full test coverage |
| `f34f5ee936` | TASK-06 | Env validation + wrangler docs |
| `02435507f2` | TASK-07 | Compat fallback removal |

---

## Validation Evidence

### TASK-01
- TC-01 through TC-09: sign/verify round-trip, tamper, expire, future, missing, malformed — all traced via build-validate simulation. TypeScript fix applied: `toBase64Url` signature widened to `ArrayBuffer | Uint8Array`.

### TASK-02
- `buildPrimeActorHeaders` async + `roles` forwarded across all 5 proxy functions. Reception typecheck passes clean.

### TASK-03
- `resolveActorClaims` (no compat) and `resolveActorClaimsWithCompat` (compat window) created. All 8 endpoints updated. Both Prime typecheck (app + functions) and Reception typecheck pass. Lint 0 errors.

### TASK-04
- Broadcast blanket gate on `staff-initiate-thread` and `review-campaign-send`. Conditional gate in `review-thread-send` fires only on whole-hostel threads. Linter import-sort and i18n-exempt annotations applied. Prime typecheck passes.

### TASK-05
- TC-A01 (invalid sig → 401), TC-A02 (absent secret → 503), TC-A03 (missing claims → 401, after TASK-07 update), TC-A04 (valid → proceed).
- TC-B01 (DM + staff role → not 403), TC-B02 (broadcast + staff role → 403), TC-B03 (broadcast + owner → proceed).
- staff-initiate-thread TC-07–12: unsigned → 401, tampered → 401, owner → proceed, staff → 403, admin → proceed, absent secret → 503.
- review-campaign-auth TC-01–05: POST + PUT auth coverage.
- All reception assertion updates for new function signatures.

### TASK-06
- `validatePrimeActorClaimsConfig` TC-01–10 pass. `.env.example` and `wrangler.toml` files updated. Engineering coverage script passes (`{"valid":true,"errors":[],"warnings":[]}`).

### TASK-07
- All 8 endpoints reject unsigned request with 401 `{error:'missing'}`. `TODO: remove compat - TASK-07` comment absent from codebase. Prime typecheck passes.

---

## Workflow Telemetry Summary

- Feature slug: `prime-outbound-auth-hardening`
- Records: 1
- Token measurement coverage: 0.0%

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-build | 1 | 2.00 | 174039 | 0 | 0.0% |

**Totals:** context input bytes: 174039 · artifact bytes: 0 (recorded pre-artifact-write) · modules counted: 2 · deterministic checks: 1

**Gaps:** stages lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan missing records; token capture: 0 (no CODEX_THREAD_ID or session ID provided).

---

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A — server-side only | No rendering changes |
| UX / states | N/A — server-side only | Error responses (401/403) are machine-readable API errors |
| Security / privacy | Closes UID forgery across all 8 endpoints. HMAC-SHA256 with separate secret (`PRIME_ACTOR_CLAIMS_SECRET` ≠ gateway token). Broadcast role gate (owner/admin allowlist) active from TASK-04 deploy. Non-broadcast forgery closed by TASK-07. | Scope: gateway-token leakage; full Reception compromise is out of scope |
| Logging / observability / audit | Structured `console.error` entries for HMAC rejection with reason (`missing`, `invalid-sig`, `claims-secret-not-configured`, `claims-secret-misconfigured`). Broadcast actorUid cryptographically bound from TASK-04; non-broadcast from TASK-07. | Pre-fix historical records unchanged |
| Testing / validation | `actor-claims-config.test.ts` (10 TCs), `review-campaign-auth.test.ts` (5 TCs), `staff-initiate-thread.test.ts` (6 new TCs), `review-threads.test.ts` (7 new TCs), reception assertion updates (3 files). CI-only test policy. | DM regression gate added (TC-B01) |
| Data / contracts | New `x-prime-actor-claims` header replaces `x-prime-actor-uid`. D1 schema unchanged. `PRIME_ACTOR_CLAIMS_SECRET` env var documented in both `.env.example` files and both `wrangler.toml` files. | `x-prime-actor-uid` no longer accepted after TASK-07 |
| Performance / reliability | One `crypto.subtle.verify` call per request (~0.1ms). KV rate-limit key on `review-campaign-send` now keyed to verified actorUid. | No performance regression |
| Rollout / rollback | Deploy order: Prime (TASK-01/03/04/06) → Reception (TASK-02) → TASK-07. Compat window provided and subsequently removed. Rollback: re-add compat fallback, attribution collapses to `prime-owner`. | Broadcast unavailable between Prime and Reception deploys — minimise window |

---

## Scope Deviations

- TASK-04 included `review-thread-send.ts` conditional gate (not originally in TASK-03 scope) — controlled expansion to cover the hybrid broadcast/DM endpoint. Critique autofix C-01.
- TASK-05 expanded to `staff-broadcast-send.test.ts` assertion for `roles` arg — required because `buildPrimeActorHeaders` became async in TASK-02 and that function is used in `staffBroadcastSend`. Bounded to same objective.
