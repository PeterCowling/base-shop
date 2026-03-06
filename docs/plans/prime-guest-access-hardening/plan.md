---
Type: Plan
Status: Active
Domain: API | Infra | UI
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-guest-access-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Prime Guest Access Hardening Plan

## Summary

Four confirmed security findings in the Prime guest portal require fixing before the public custom domain (`guests.hostel-positano.com`) can be considered production-hardened: an unprotected door-code endpoint (no auth, no rate limit — Physical-access critical), non-cryptographic door code generation, a fail-open network-error bypass in both auth gates, and an XSS-readable guest session token in localStorage. This plan addresses them in two waves. Wave 1 runs in parallel: fail-closed fix (S), door-code auth + crypto hardening (M), and Firebase Security Rules audit (S/INVESTIGATE). Wave 2 (after CHECKPOINT-04) migrates the guest session token from localStorage to an HttpOnly cookie to close the XSS surface.

## Active tasks

- [ ] TASK-01: Fix fail-open network_error → fail-closed in portal and guarded layout
- [ ] TASK-02: Add session token validation, rate limit, and crypto fix to /api/check-in-code
- [ ] TASK-03: Firebase Security Rules audit for checkInCodes/ and guestSessionsByToken/
- [ ] CHECKPOINT-04: Verify Wave 1 before cookie migration
- [ ] TASK-05: Migrate guest session token from localStorage to HttpOnly cookie

## Goals

- Eliminate unauthenticated door-code retrieval and generation
- Remove fail-open network-error bypass from all auth gates
- Replace non-cryptographic code generation with Web Crypto
- Eliminate XSS-readable guest session token
- Leave door-code offline cache and PWA offline flow intact

## Non-goals

- Staff/admin path hardening (PinAuth / Firebase custom token — separate perimeter)
- CORS policy or response-header policy changes (adjacent)
- Direct-message and assistant endpoint review (adjacent)
- CF Access for guest routes (covered by ADR from prime-edge-tls-hardening)

## Constraints & Assumptions

- Constraints:
  - Static export + CF Pages Functions: no SSR, no Next.js middleware. CF Functions are the only server-side enforcement layer.
  - KV namespace `RATE_LIMIT` already bound in `wrangler.toml` — no new binding needed.
  - HttpOnly cookies set by CF Pages Functions are on the same origin as the Pages static assets — cookie is sent automatically on all same-origin requests.
  - CI/tests run remotely only (docs/testing-policy.md). Do not run tests locally.
- Assumptions:
  - Firebase Security Rules for `checkInCodes/` are permissive or unknown (no .rules file in repo) — worst-case assumption governs TASK-03 urgency.
  - Door codes are physical access credentials — highest sensitivity.
  - `crypto.getRandomValues()` is available in CF Pages Functions runtime (confirmed: `compatibility_flags = ["nodejs_compat"]` + CF Workers Web Crypto API is global).

## Inherited Outcome Contract

- **Why:** The app has moved onto a public custom domain, and the current guest-access design still relies on a convenience-oriented token handoff rather than a strongly bounded session model. That was tolerable while the app was effectively preview-grade, but it is now the wrong security posture for guest-linked booking data, door access instructions, and any future expansion of the portal surface.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A planning-ready hardening path exists for Prime guest access covering server-bound guest sessions, fail-closed portal validation, authenticated door-code retrieval, stronger booking-link issuance controls, and the browser security controls needed for a public guest portal.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/prime-guest-access-hardening/fact-find.md`
- Key findings used:
  - C1: `/api/check-in-code` GET/POST — no session token, no rate limit (lines 55-148)
  - C2: `generateCode()` uses `Math.random()` (lines 38-44)
  - H1: `network_error` grants access in `portal/page.tsx:61` and `(guarded)/layout.tsx:63`
  - H2: `prime_guest_token` stored in localStorage (`g/page.tsx:97-105`)
  - KV binding confirmed: `binding = "RATE_LIMIT"` in `wrangler.toml` — no new binding needed

## Proposed Approach

- Option A: Fix each issue independently in task order (chosen)
- Option B: Batch all changes into one large PR

- **Chosen approach:** Option A — independent tasks per finding. Fail-closed (TASK-01) and check-in-code hardening (TASK-02) are safe to ship independently. Cookie migration (TASK-05) is gated behind CHECKPOINT-04 to assess offline impact after earlier tasks land.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix fail-open network_error → fail-closed in portal + guarded layout | 90% | S | Pending | - | CHECKPOINT-04 |
| TASK-02 | IMPLEMENT | Add auth validation + rate limit + crypto fix to /api/check-in-code | 85% | M | Pending | - | CHECKPOINT-04 |
| TASK-03 | INVESTIGATE | Firebase Security Rules audit for checkInCodes/ + guestSessionsByToken/ | 80% | S | Pending | - | CHECKPOINT-04 |
| CHECKPOINT-04 | CHECKPOINT | Verify Wave 1 before cookie migration | — | — | Pending | TASK-01, TASK-02, TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Migrate guest session token from localStorage to HttpOnly cookie | 75% | L | Pending | CHECKPOINT-04 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | All independent; no file overlap between TASK-01 and TASK-02 |
| 2 | CHECKPOINT-04 | TASK-01, TASK-02, TASK-03 complete | Invoke /lp-do-replan for TASK-05 before continuing |
| 3 | TASK-05 | CHECKPOINT-04 | L-effort; confidence expected to rise post-CHECKPOINT |

**File overlap check (Wave 1):**
- TASK-01 touches: `portal/page.tsx`, `(guarded)/layout.tsx`, test file
- TASK-02 touches: `functions/api/check-in-code.ts`, `src/hooks/useCheckInCode.ts`
- TASK-03 touches: no code (investigation only — writes `docs/plans/prime-guest-access-hardening/task-03-firebase-rules-audit.md`)
- No overlap. Wave 1 tasks can run as parallel subagents.

## Tasks

---

### TASK-01: Fix fail-open network_error → fail-closed in portal and guarded layout

- **Type:** IMPLEMENT
- **Deliverable:** Modified `portal/page.tsx` and `(guarded)/layout.tsx`; new unit test in `(guarded)/__tests__/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/prime/src/app/portal/page.tsx`, `apps/prime/src/app/(guarded)/layout.tsx`, `[readonly] apps/prime/src/lib/auth/guestSessionGuard.ts`
- **Depends on:** -
- **Blocks:** CHECKPOINT-04
- **Confidence:** 90%
  - Implementation: 95% — exact lines identified; trivial condition change at two call sites. No logic change to `validateGuestToken` needed.
  - Approach: 95% — pattern is single condition removal (`|| result === 'network_error'`); unit test follows existing `sdk-auth-failclosed.test.tsx` pattern.
  - Impact: 90% — directly closes H1. Minor gap: offline UX behavior for guests who have a valid but unverifiable session (must show retry UI, not silent denial). Execution plan specifies this.
- **Acceptance:**
  - `portal/page.tsx`: access is denied (redirect to `/error` or show "Cannot verify your session — please check your connection" message) when `validateGuestToken()` returns `'network_error'`
  - `(guarded)/layout.tsx`: gate state is `'denied'` (not `'allowed'`) when validation returns `'network_error'`
  - A unit test confirms `network_error` results in denied state for both paths
  - Expected user-observable behavior:
    - [ ] Guest with valid session and good network: portal loads normally (no change)
    - [ ] Guest with valid session and network error: sees "Unable to verify your session. Please check your connection and try again." — NOT granted access
    - [ ] Guest with invalid token: denied (unchanged behavior)
- **Validation contract (TC):**
  - TC-01: `validateGuestToken` returns `'valid'` → portal renders, gate state = `'allowed'`
  - TC-02: `validateGuestToken` returns `'network_error'` → portal denies access, gate state = `'denied'`
  - TC-03: `validateGuestToken` returns `'expired'` → portal denies access (unchanged from current behavior)
  - TC-04: `validateGuestToken` returns `'invalid'` → portal denies access (unchanged from current behavior)
- **Execution plan:**
  - Red: Write test TC-02 that expects `gate_state = 'denied'` for `network_error` — test fails (current code allows)
  - Green: Remove `|| result === 'network_error'` from portal condition (line 61) and layout condition (line 63). Add offline-aware UX message for denied state.
  - Refactor: Confirm no other callers of `validateGuestToken` silently treat `network_error` as success (grep codebase). Update error message copy to be user-friendly.
- **Planning validation:**
  - Checks run: Read `portal/page.tsx:61`, `(guarded)/layout.tsx:63` directly — confirmed exact condition
  - Checks run: Searched for other `network_error` consumers — found only these two files
  - Unexpected findings: None
- **Consumer tracing:**
  - Modified behavior: `portal/page.tsx` condition changes — downstream: user sees denied UI instead of portal content when network is degraded
  - `(guarded)/layout.tsx` condition changes — downstream: all guarded routes deny access on network error
  - No new values produced; no new consumers to update
- **Scouts:** None — single-condition removal, no hidden side effects
- **Edge Cases & Hardening:**
  - Offline guest with valid cached door code (localStorage): `useCheckInCode` has its own offline cache path (`getCachedCheckInCode`). Deny on portal does not affect the cached door code display (different component). Acceptable trade-off.
  - Guest on poor connection (intermittent): may see "verify session" error transiently — refetch button in UI mitigates.
- **What would make this >=90%:** Already at 90%. Would reach 95% with a confirmed E2E test covering network-error scenario in staging.
- **Rollout / rollback:**
  - Rollout: Deploy via standard CI push to `dev` → `staging` → `main`
  - Rollback: Revert condition change (single-line revert); redeploy
- **Documentation impact:** None
- **Notes / references:** `portal/page.tsx:61`, `(guarded)/layout.tsx:63`, `guestSessionGuard.ts` (validateGuestToken maps 5xx → 'network_error')

---

### TASK-02: Add session token validation, rate limit, and crypto fix to /api/check-in-code

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/prime/functions/api/check-in-code.ts` and `apps/prime/src/hooks/useCheckInCode.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/prime/functions/api/check-in-code.ts`, `apps/prime/src/hooks/useCheckInCode.ts`, `[readonly] apps/prime/functions/api/guest-session.ts`, `[readonly] apps/prime/wrangler.toml`
- **Depends on:** -
- **Blocks:** CHECKPOINT-04
- **Confidence:** 85%
  - Implementation: 85% — KV rate limit and Firebase token validation patterns established in `guest-session.ts`. `crypto.getRandomValues()` Web Crypto API available in CF Workers runtime. One gap: CF Function integration test harness not pre-built.
  - Approach: 85% — copy rate limit pattern from `guest-session.ts` (same RATE_LIMIT KV, same key prefix convention); read guest token from `Authorization: Bearer <token>` header; validate against Firebase `guestSessionsByToken/{token}`. Same pattern as existing GET handler in `guest-session.ts:55-80`.
  - Impact: 90% — directly closes C1 (unauthenticated endpoint) and C2 (weak code generation).
- **Acceptance:**
  - GET `/api/check-in-code?uuid=<uuid>`: requires `Authorization: Bearer <token>` header; validates token against Firebase; returns 401 if missing/invalid; returns 200 with door code if valid and token's uuid matches requested uuid
  - POST `/api/check-in-code`: requires `Authorization: Bearer <token>` header; validates token; applies KV rate limit (5 req / 15 min per IP); returns 401 if missing/invalid; returns 429 if rate-limited
  - `generateCode()` uses `crypto.getRandomValues()` not `Math.random()`
  - `useCheckInCode.ts` forwards guest token in `Authorization: Bearer` header on POST
- **Validation contract (TC):**
  - TC-01: GET without token → 401 Unauthorized
  - TC-02: GET with invalid/expired token → 401 Unauthorized
  - TC-03: GET with valid token but uuid mismatch (token's uuid ≠ requested uuid) → 403 Forbidden
  - TC-04: GET with valid token and matching uuid → 200 with door code
  - TC-05: POST without token → 401 Unauthorized
  - TC-06: POST with valid token, 6th request within 15 min → 429 Too Many Requests
  - TC-07: POST with valid token within limit → code generated using crypto-safe characters, format BRK-XXXXX
  - TC-08: `useCheckInCode` POST includes `Authorization: Bearer <token>` header
- **Execution plan:**
  - Red: Write unit tests for TC-01, TC-05 (no auth → 401) — currently fail since endpoint accepts any request
  - Green:
    1. Add `RATE_LIMIT?: KVNamespace` to `check-in-code.ts` Env interface
    2. Add `extractBearerToken(request)` helper (reads `Authorization` header)
    3. Add `validateGuestSessionToken(firebase, token)` helper (reads `guestSessionsByToken/{token}` from Firebase, checks expiry, returns uuid)
    4. In `onRequestGet`: call `extractBearerToken`, if missing → 401; call `validateGuestSessionToken`, if invalid → 401; if token's uuid ≠ query uuid → 403
    5. In `onRequestPost`: add bearer token extraction/validation (same flow); add KV rate limit (key: `check-in-code:{ip}`, max 5/15min, matching `guest-session.ts` pattern)
    6. Replace `generateCode()`: use `crypto.getRandomValues(new Uint32Array(CODE_LENGTH))` — each element modulo CODE_CHARACTERS.length; generates uniform distribution
    7. In `useCheckInCode.ts` POST body call: add `headers: { Authorization: \`Bearer ${token}\` }` where `token = readGuestSession().token`
  - Refactor: Add type for rate limit KV key prefix constant; confirm `validateGuestSessionToken` is shared-importable for TASK-05 reuse
- **Planning validation:**
  - Checks run: Read `guest-session.ts` GET handler — confirmed Firebase token validation pattern at lines 55-80
  - Checks run: Read `wrangler.toml` — confirmed `RATE_LIMIT` KV binding exists, no new binding needed
  - Checks run: Confirmed `crypto.getRandomValues()` available via `nodejs_compat` compatibility flag
  - Checks run: Read `useCheckInCode.ts:110-116` — confirmed no auth header sent currently
  - Unexpected findings: `useFetchCheckInCode` reads Firebase SDK directly for code retrieval (bypasses CF Function GET). This is separate from the CF Function GET path. TASK-02 hardens the CF Function GET for any direct callers (staff dashboard, external). Firebase SDK direct access protection is covered by TASK-03 (Firebase rules).
- **Consumer tracing:**
  - New: CF Function GET now requires Authorization header → consumers: any direct callers of `/api/check-in-code?uuid=...`. In current codebase, the client uses Firebase SDK directly via `useFetchCheckInCode` for code retrieval — CF Function GET may be unused by client. Protection still needed for external/staff callers.
  - New: CF Function POST now requires Authorization header → consumer: `useCheckInCode.ts` POST call must send `Authorization: Bearer ${token}`. Update at `useCheckInCode.ts:110-116`.
  - Modified: `generateCode()` output format unchanged (BRK-XXXXX) — no consumers need updating.
  - Unchanged consumer: `useFetchCheckInCode` reads Firebase SDK directly — not affected by CF Function changes; protected by Firebase rules (TASK-03).
- **Scouts:** Confirm `guestSessionsByToken/{token}` Firebase path structure matches `guest-session.ts:55` read pattern before implementing validator.
- **Edge Cases & Hardening:**
  - Token in request matches guestSession but uuid mismatch (token belongs to different guest): return 403, not 401 — prevents timing-based token enumeration
  - Rate limit key collision with other functions: use prefix `cic:` (not `rl:` used by guest-session) to namespace separately
  - KV `RATE_LIMIT` is optional in Env type — if undefined (local dev), skip rate limiting gracefully rather than crashing
- **What would make this >=90%:** CF Function integration test harness built and TC-01 through TC-08 confirmed passing in CI. Currently at 85% due to integration test gap.
- **Rollout / rollback:**
  - Rollout: Deploy CF Function changes via CI. Client hook change ships with same deploy.
  - Rollback: Revert function file + hook file; redeploy. KV rate limit data is ephemeral (TTL-based), no data migration.
- **Documentation impact:** None — internal API, no public docs
- **Notes / references:** Rate limit pattern: `guest-session.ts:36-60`; Firebase token validation: `guest-session.ts:55-80`; generateCode replacement: `check-in-code.ts:38-44`

---

### TASK-03: Firebase Security Rules audit for checkInCodes/ and guestSessionsByToken/

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/prime-guest-access-hardening/task-03-firebase-rules-audit.md` — documents current rules, assesses exposure, proposes tightened rules
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/prime-guest-access-hardening/task-03-firebase-rules-audit.md`, `[readonly] apps/prime/src/hooks/pureData/useFetchCheckInCode.ts`
- **Depends on:** -
- **Blocks:** CHECKPOINT-04
- **Confidence:** 80%
  - Implementation: 80% — steps are clear: inspect Firebase console rules for `checkInCodes/` and `guestSessionsByToken/`, document current state, assess `useFetchCheckInCode` SDK access model.
  - Approach: 80% — standard Firebase rules audit; MCP tool or Firebase REST API can retrieve rules if console is accessible; operator can also provide directly.
  - Impact: 80% — determines whether M1 (data access model violation) is exploitable; informs TASK-05 design.
- **Questions to answer:**
  - What are the current Firebase Security Rules for `checkInCodes/byUuid/{uuid}` and `checkInCodes/byCode/{code}`?
  - What are the rules for `guestSessionsByToken/{token}`?
  - Can an authenticated Firebase guest user read any UUID's door code via the SDK (bypassing the CF Function)?
  - Are rules time-limited (e.g., requiring valid Firebase Auth token) or open to all authenticated users?
- **Acceptance:**
  - Rules for `checkInCodes/` documented with current state
  - Rules for `guestSessionsByToken/` documented
  - Assessment: are rules correctly scoped to prevent cross-guest data access?
  - Proposed rule changes recorded if current rules are permissive
  - Recommendation for whether TASK-05 depends on tightened rules or can proceed independently
- **Validation contract:** Investigation is complete when rules are documented and exposure assessment is written. If rules are permissive: proposed tightened rules are included in the artifact, and a follow-up IMPLEMENT task for rule deployment is recommended. If rules are already restrictive: document evidence and close investigation as advisory-only.
- **Planning validation:** None — investigation task.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** Produces `task-03-firebase-rules-audit.md` as the investigation artifact.
- **Notes / references:** `useFetchCheckInCode.ts` reads `checkInCodes/byUuid/${uuid}` directly via Firebase SDK. `dataAccessModel.ts:17` declares `arrival_code: 'FUNCTION_ONLY'` but this is unenforced at the hook call site.

---

### CHECKPOINT-04: Verify Wave 1 before cookie migration

- **Type:** CHECKPOINT
- **Status:** Pending
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** TASK-05
- **Purpose:** Reassess TASK-05 confidence after TASK-01/02/03 complete. Specifically:
  1. TASK-01 is live → confirm offline UX (deny + retry) is acceptable to operator before extending cookie migration
  2. TASK-02 is live → confirm bearer token auth pattern works in production before extending to cookie model
  3. TASK-03 is complete → Firebase rules state known; incorporate into TASK-05 design if needed
- **Replan scope:** `/lp-do-replan TASK-05` — update confidence based on Wave 1 evidence; resolve offline cookie interaction; confirm TASK-05 implementation path.

---

### TASK-05: Migrate guest session token from localStorage to HttpOnly cookie

- **Type:** IMPLEMENT
- **Deliverable:** Modified CF Functions (`guest-session.ts`, `find-booking.ts`) and client session files (`g/page.tsx`, `guestSessionGuard.ts`, `(guarded)/layout.tsx`, `portal/page.tsx`); updated `check-in-code.ts` to accept `Cookie: prime_session` in addition to Authorization header
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:**
  - `apps/prime/functions/api/guest-session.ts`
  - `apps/prime/functions/api/find-booking.ts`
  - `apps/prime/functions/api/check-in-code.ts`
  - `apps/prime/src/app/g/page.tsx`
  - `apps/prime/src/lib/auth/guestSessionGuard.ts`
  - `apps/prime/src/app/(guarded)/layout.tsx`
  - `apps/prime/src/app/portal/page.tsx`
  - `[readonly] apps/prime/wrangler.toml`
- **Depends on:** CHECKPOINT-04
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 75% — 7 files across CF Functions + client; offline cookie persistence behavior not yet confirmed in CF Pages context; CHECKPOINT-04 evidence will raise this.
  - Approach: 80% — HttpOnly cookie via CF Pages Function `Set-Cookie` is well-established. Cookie is same-origin (CF Pages Function runs on same origin as static assets). Browser handles cookie on all requests automatically.
  - Impact: 90% — directly closes H2 (localStorage XSS surface for auth token). `prime_guest_token` removed from XSS-readable storage.
  - Held-back test for 80% Approach: "What single unknown would push Approach below 80?" — If CF Pages Functions cannot set `Set-Cookie` that persists across static asset requests (different request handler). Evidence: CF Pages Functions ARE HTTP interceptors on the same origin; `Set-Cookie` from a Function response IS stored by browser. No single unknown would drop below 80. Score: 80 justified.
- **Acceptance:**
  - POST to `/api/guest-session` (verification success) returns `Set-Cookie: prime_session=<token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=<expiry>`
  - `g/page.tsx` no longer writes `prime_guest_token` to localStorage after verification
  - `guestSessionGuard.ts` `readGuestSession()` does not include token in returned object (token is HttpOnly — not readable by JS)
  - `validateGuestToken()` calls `/api/guest-session` with no explicit token query param; CF Function reads `Cookie: prime_session` header
  - `check-in-code.ts` accepts `Cookie: prime_session` as alternative to `Authorization: Bearer` (both work during transition; Authorization removed after cookie migration is confirmed stable)
  - `find-booking.ts` redirect URL does not include token in query string (token is set as cookie in the redirect response, not embedded in URL)
  - `prime_guest_uuid`, `prime_guest_booking_id`, `prime_guest_first_name`, `prime_guest_verified_at` remain in localStorage (non-credential identity fields — acceptable)
- **Validation contract (TC):**
  - TC-01: POST `/api/guest-session` with valid surname → response includes `Set-Cookie: prime_session=...; HttpOnly` header
  - TC-02: Subsequent GET `/api/guest-session` with session cookie → returns valid session (no Authorization header needed)
  - TC-03: `document.cookie` does not contain `prime_session` (HttpOnly prevents JS access)
  - TC-04: `localStorage.getItem('prime_guest_token')` returns null after migration (token not written)
  - TC-05: Guest refreshes page → session cookie persists; portal access still granted (browser sends cookie automatically)
  - TC-06: Session cookie expires → guest denied access; re-verification flow triggers
  - TC-07: `check-in-code.ts` POST with valid session cookie (no Authorization header) → door code returned (200)
- **Execution plan:**
  - Red: Write TC-03 (expect `document.cookie` sans `prime_session`) and TC-04 (expect localStorage has no token) — currently fail.
  - Green:
    1. `guest-session.ts` POST success handler: add `Set-Cookie` header to response with `HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=<expiresAt - now>`
    2. `guest-session.ts` GET handler: read token from `Cookie: prime_session` cookie (parse `request.headers.get('Cookie')`) in addition to existing query param
    3. `g/page.tsx`: remove `localStorage.setItem('prime_guest_token', token)` write; keep all other localStorage writes
    4. `guestSessionGuard.ts` `readGuestSession()`: remove `prime_guest_token` read from localStorage; return session object without token field (or `token: null`)
    5. `validateGuestToken()`: change call from `/api/guest-session?token=...` to `/api/guest-session` (no token param; cookie is auto-sent by browser `fetch`)
    6. `check-in-code.ts`: add cookie extraction fallback — if no Authorization header, read `Cookie: prime_session`; validate token from cookie
    7. `find-booking.ts`: confirm redirect after token issuance — the token is written by `guest-session.ts` POST (step 1); `find-booking.ts` redirects to `/g/{token}` which triggers verification flow; the cookie is set during the POST to guest-session; no URL change needed
  - Refactor: Extract `extractSessionToken(request)` helper shared by `guest-session.ts`, `check-in-code.ts` to DRY token extraction logic (Authorization header OR Cookie).
- **Planning validation:**
  - Checks run: Read `wrangler.toml` — no `RATE_LIMIT` or cookie-specific config needed
  - Checks run: Confirmed 7 affected files; no additional callers of `readGuestSession()` beyond `portal/page.tsx` and `(guarded)/layout.tsx`
  - Checks run: Confirmed `find-booking.ts` issues redirect to `/g/{token}` — token embedded in URL is a separate flow (guest deep-link path, not the session cookie). The deep link URL contains the token but the token is validated by `guest-session.ts` POST which then sets the cookie. URL token is the one-time verification token, not the session cookie.
  - Unexpected findings: `find-booking.ts` redirects to `/g/{token}` — the URL token is a one-time verification token (used in `g/page.tsx` to POST to `/api/guest-session`). The session cookie is set by that POST. URL token is not the same as session cookie. No change to `find-booking.ts` redirect needed.
- **Consumer tracing:**
  - Modified: `readGuestSession()` return type: `token` field removed/nulled → all callers that read `session.token` must be updated
    - `useCheckInCode.ts` reads `readGuestSession().token` to build Authorization header (added in TASK-02) → update to remove Authorization header (cookie takes over for check-in-code.ts); OR keep Authorization header reading from session and set token to null (will break TASK-02 auth). Resolution: TASK-05 must update `useCheckInCode.ts` to remove the `Authorization` header since cookie is now auto-sent. This is in scope.
    - `validateGuestToken()` no longer passes token in query param → update call signature
  - Modified: `(guarded)/layout.tsx` reads `session.token` (if any) — after TASK-01 fix, this only calls `validateGuestToken()` which no longer needs explicit token. Safe.
  - Modified: `portal/page.tsx` — same pattern as layout. Safe.
  - New: `guest-session.ts` POST sets cookie → consumer: browser sends cookie automatically on subsequent requests. No code change needed at consumers.
- **Scouts:** Confirm `fetch('/api/guest-session', { credentials: 'same-origin' })` (or just `fetch` default) sends cookies on same-origin CF Pages Function calls. Default `fetch` without `credentials` setting: in browser, same-origin cookies are included by default (credentials defaults to `'same-origin'` in modern browsers). Confirm no `fetch` calls use `credentials: 'omit'`.
- **Edge Cases & Hardening:**
  - Session cookie expiry during active session: user redirected to re-verify (same as expired localStorage token today — no behavior regression)
  - Offline: cookie persists in browser storage across offline periods (browser cookie store is offline-capable). Fail-closed (TASK-01) means offline = denied for portal; offline cached door code still available via `getCachedCheckInCode`.
  - Cookie cleared by user: same as today (user loses session, must re-verify). No regression.
  - `SameSite=Strict`: means cookie NOT sent on cross-site navigations. Guest deep links from email open the page, then `g/page.tsx` runs `POST /api/guest-session` (same-origin) which sets the cookie. The initial navigation to `/g/{token}` doesn't need the cookie. Correct behavior.
- **What would make this >=90%:** Confirmed E2E test of cookie-based auth flow in staging + confirmed offline behavior in PWA context (CHECKPOINT-04 evidence will provide this).
- **Rollout / rollback:**
  - Rollout: Deploy all affected files together as atomic commit. CF Function + client changes must ship together.
  - Rollback: Revert all 7 files; redeploy. Guests with active sessions will need to re-verify (token no longer in localStorage after rollback — acceptable).
- **Documentation impact:** None — internal implementation
- **Notes / references:** `guest-session.ts` POST handler; `g/page.tsx:97-105`; `guestSessionGuard.ts`; `(guarded)/layout.tsx:63`; `portal/page.tsx:61`

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix fail-open | Yes | None | No |
| TASK-02: Auth + rate limit + crypto | Yes | [Minor] `useFetchCheckInCode` reads Firebase SDK directly — CF Function GET hardening doesn't block this path. Protected by TASK-03 (Firebase rules). | No — explicitly documented in consumer tracing |
| TASK-03: Firebase rules audit | Yes | [Minor] Operator must access Firebase console — investigation cannot complete without out-of-band access | No — INVESTIGATE task; CHECKPOINT-04 handles if rules turn out to block TASK-05 design |
| CHECKPOINT-04: Verify Wave 1 | Yes — depends on TASK-01, TASK-02, TASK-03 | None | No |
| TASK-05: Cookie migration | Partial — TASK-02 adds bearer token auth; TASK-05 adds cookie auth. `useCheckInCode.ts` is updated in TASK-02 to send bearer token, then in TASK-05 to remove it. Ordering is correct. | [Moderate] `useCheckInCode.ts` is touched in both TASK-02 and TASK-05 — risk of execution plan conflict. TASK-05 depends on CHECKPOINT-04 which depends on TASK-02, so ordering is enforced. | No — dependency chain prevents conflict |

No Critical rehearsal findings. Plan proceeds to Phase 8 persist.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TASK-05 cookie migration breaks offline PWA | Medium | High | Fail-closed (TASK-01) already denies portal on network error. Cookie persists offline. Door code cache path unaffected. CHECKPOINT-04 confirms. |
| `useFetchCheckInCode` bypasses CF Function hardening (M1) | Medium | Medium | Firebase rules audit (TASK-03) + rules tightening if needed. If rules are already restrictive, exposure is low. |
| Wave 1 parallel execution touches `useCheckInCode.ts` overlap | Low | Low | TASK-02 owns `useCheckInCode.ts`; TASK-03 is investigation-only; TASK-01 doesn't touch it. No actual conflict. |
| TASK-05 `useCheckInCode.ts` touched in both TASK-02 and TASK-05 | Low | Medium | Enforced ordering: TASK-05 depends on CHECKPOINT-04 which depends on TASK-02. Sequential execution guaranteed. |

## Observability

- Logging: `console.warn` in CF Function when check-in-code request rejected for missing/invalid token (TASK-02)
- Logging: `console.warn` in client when portal denied due to network_error fail-closed (TASK-01)
- Metrics: None — no metrics infrastructure required for this hardening
- Alerts/Dashboards: None

## Acceptance Criteria (overall)

- [ ] `GET /api/check-in-code?uuid=...` without auth token returns 401
- [ ] `POST /api/check-in-code` without auth token returns 401
- [ ] `POST /api/check-in-code` rate-limited at 5 req/15min per IP
- [ ] Door code generation uses `crypto.getRandomValues()` (not `Math.random()`)
- [ ] `network_error` from `validateGuestToken()` results in portal access denied, not granted
- [ ] `prime_guest_token` not readable from `document.cookie` (HttpOnly)
- [ ] `localStorage.getItem('prime_guest_token')` returns null after TASK-05
- [ ] All unit tests for changed paths pass in CI

## Decision Log

- 2026-03-06: Chose bearer token auth (Authorization: Bearer) for TASK-02 as interim auth mechanism, replaced by cookie in TASK-05. This avoids a single massive change and allows Wave 1 to ship independently.
- 2026-03-06: Included `Math.random()` → `crypto.getRandomValues()` fix in TASK-02 (same file; no separate task needed).
- 2026-03-06: `find-booking.ts` URL token is the one-time verification token, not the session credential. No change to `find-booking.ts` needed for TASK-05. Verified by reading redirect target: `/g/{token}` → `g/page.tsx` → POST to `guest-session` which sets cookie.
- 2026-03-06: `prime_guest_uuid`, `prime_guest_booking_id`, `prime_guest_first_name`, `prime_guest_verified_at` remain in localStorage. These are identity fields, not auth credentials. Acceptable residual XSS surface; much lower value than the auth token.
- [Adjacent: delivery-rehearsal] Staff auth (PinAuth) also uses localStorage for `prime_staff_auth_token`. Out of scope for this dispatch. Route to future fact-find.

## Overall-confidence Calculation

| Task | Confidence | Effort | Weight | Contribution |
|---|---|---|---|---|
| TASK-01 | 90% | S=1 | 1 | 90 |
| TASK-02 | 85% | M=2 | 2 | 170 |
| TASK-03 | 80% | S=1 | 1 | 80 |
| TASK-05 | 75% | L=3 | 3 | 225 |
| **Total** | | | **7** | **565** |

Overall-confidence = 565 / 7 = **80.7% → 80%**
