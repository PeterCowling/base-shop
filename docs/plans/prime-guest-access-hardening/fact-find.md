---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: API | Infra | UI
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: prime-guest-access-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/prime-guest-access-hardening/plan.md
Dispatch-ID: IDEA-DISPATCH-20260306191000-9028
Trigger-Why:
Trigger-Intended-Outcome:
---

# Prime Guest Access Hardening — Fact-Find Brief

## Scope

### Summary

The Prime guest portal moved onto a public custom domain (`guests.hostel-positano.com`) and retains a convenience-first session model that is now the wrong posture for a production attack surface. Four critical/high issues were confirmed by direct code read: an unprotected door-code endpoint (no auth, no rate limit), non-cryptographic door code generation, a fail-open network-error bypass in the auth gate, and XSS-vulnerable localStorage session storage. This fact-find maps the full attack surface and produces a planning-ready hardening path.

### Goals

- Require authenticated guest session for all door-code operations
- Fix fail-open network-error handling so network outages deny, not grant, portal access
- Replace Math.random() with crypto.getRandomValues() for door code generation
- Migrate guest session token from localStorage to HttpOnly cookie to eliminate XSS read surface
- Document Firebase Security Rules gap for `checkInCodes/` and add rule tightening as a task
- Produce tasks at ≥80% confidence ready for immediate build handoff

### Non-goals

- Staff/admin path hardening (separate domain; PinAuth + Firebase custom token path is out of scope here)
- CORS policy or response-header policy rewrite (adjacent; see dispatch `adjacent_later`)
- Direct-message and assistant endpoint review (adjacent; listed in dispatch)
- CF Access for guest routes (already documented in ADR from prime-edge-tls-hardening)

### Constraints & Assumptions

- Constraints:
  - `apps/prime` is a Next.js static export deployed to CF Pages — no SSR, no Next.js middleware enforcement
  - CF Pages Functions (`apps/prime/functions/`) are the only server-side enforcement layer available
  - Session cookies set by CF Functions must use `Set-Cookie` in the HTTP response; client JS must not set them
  - Static export means `(guarded)/layout.tsx` runs client-side only — cannot add server-side redirect
  - KV namespace binding pattern already established in `find-booking.ts` and `guest-session.ts`; follow same pattern
- Assumptions:
  - Firebase Security Rules for `checkInCodes/` are not in the repo (no `.rules` file found); assumed permissive or unknown
  - The guest UUID format `occ_\d{13}` is an occupant ID derived from booking system timestamps — treat as guessable
  - Door codes are physical main-door access codes — CRITICAL asset; treat as highest-sensitivity credential
  - CF Workers global `crypto` (Web Crypto API) is available in CF Pages Functions for `getRandomValues()`

## Outcome Contract

- **Why:** The app has moved onto a public custom domain, and the current guest-access design still relies on a convenience-oriented token handoff rather than a strongly bounded session model. That was tolerable while the app was effectively preview-grade, but it is now the wrong security posture for guest-linked booking data, door access instructions, and any future expansion of the portal surface.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A planning-ready hardening path exists for Prime guest access covering server-bound guest sessions, fail-closed portal validation, authenticated door-code retrieval, stronger booking-link issuance controls, and the browser security controls needed for a public guest portal.
- **Source:** operator

## Access Declarations

| Source | Access Type | Status |
|---|---|---|
| `apps/prime/functions/` source files | Read (local) | Verified |
| `apps/prime/src/` source files | Read (local) | Verified |
| Firebase Security Rules | Read (local) | UNVERIFIED — no `.rules` file in repo; rules live in Firebase console |
| CF Pages KV bindings config | Read (wrangler.toml) | Verified via code pattern in guest-session.ts |

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/functions/api/check-in-code.ts` — door-code GET/POST endpoint (CF Pages Function)
- `apps/prime/functions/api/guest-session.ts` — guest token verification endpoint
- `apps/prime/functions/api/find-booking.ts` — booking lookup + guest token issuance
- `apps/prime/src/app/g/page.tsx` — post-verification session write to localStorage
- `apps/prime/src/app/portal/page.tsx` — portal access gate (client-side, fail-open)
- `apps/prime/src/app/(guarded)/layout.tsx` — guarded layout gate (client-side, fail-open)

### Key Modules / Files

- `apps/prime/src/lib/auth/guestSessionGuard.ts` — `readGuestSession()` / `validateGuestToken()` — maps 5xx/network → `'network_error'`
- `apps/prime/src/hooks/useCheckInCode.ts` — orchestrates fetch + auto-generate for door code; calls `/api/check-in-code` with uuid + checkOutDate, **no auth token**
- `apps/prime/src/hooks/pureData/useFetchCheckInCode.ts` — reads `checkInCodes/byUuid/${uuid}` **directly from Firebase SDK** (bypasses CF Function proxy)
- `apps/prime/src/hooks/useUuid.ts` — sources uuid from URL param `?uuid=` or falls back to localStorage `prime_guest_uuid`; validates as `occ_\d{13}`
- `apps/prime/src/contexts/messaging/PinAuthProvider.tsx` — staff auth via Firebase custom token; stores `prime_role`, `prime_user_id`, `prime_staff_auth_token`, `prime_staff_claims` in localStorage
- `apps/prime/src/lib/security/dataAccessModel.ts` — data access matrix (`arrival_code: 'FUNCTION_ONLY'`); `evaluateSdkAccess()` is NOT called from `useFetchCheckInCode`
- `apps/prime/src/app/(guarded)/main-door-access/page.tsx` — renders door code; uses `useCheckInCode` which calls endpoint without auth

### Patterns & Conventions Observed

- **KV rate limiting pattern**: `guest-session.ts` and `find-booking.ts` both bind a KV namespace for per-IP rate limiting. `check-in-code.ts` does not follow this pattern — its `Env` interface has no KV namespace.
- **Session guard pattern**: `readGuestSession()` reads 5 localStorage keys; `validateGuestToken()` GETs `/api/guest-session?token=...`. Token is the primary auth credential and should never be XSS-readable.
- **CF Function + Firebase REST pattern**: Functions authenticate to Firebase via `FirebaseRest` helper using `CF_FIREBASE_API_KEY`. Client SDK uses Firebase Auth directly for non-FUNCTION_ONLY flows.
- **Data access model**: `dataAccessModel.ts` declares `arrival_code: 'FUNCTION_ONLY'` but `useFetchCheckInCode` reads Firebase SDK directly — the model is unenforced at the call site.

### Data & Contracts

- Guest session keys (localStorage): `prime_guest_token` (32-char hex), `prime_guest_booking_id`, `prime_guest_uuid` (`occ_\d{13}`), `prime_guest_first_name`, `prime_guest_verified_at`
- Staff session keys (localStorage): `prime_role`, `prime_user_id`, `prime_staff_auth_token`, `prime_staff_claims`
- Firebase paths: `guestSessionsByToken/{token}` (guest sessions), `checkInCodes/byCode/{code}`, `checkInCodes/byUuid/{uuid}`
- Door code format: `BRK-XXXXX` where X ∈ `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (31 chars); 5 positions = 31^5 ≈ 28.6M combinations
- Door code expiry: checkout date + 48h (checkout epoch + 172800000ms)

### Dependency & Impact Map

- Upstream dependencies:
  - Firebase Realtime Database (guest sessions, check-in codes) — must remain available for session validation
  - `CF_PRIME_RATE_LIMIT` KV namespace (already bound for guest-session and find-booking)
- Downstream dependents:
  - `main-door-access/page.tsx` consumes `useCheckInCode` — changes to auth requirements propagate here
  - `portal/page.tsx` and `(guarded)/layout.tsx` consume `validateGuestToken` — fail-closed fix affects both
  - `useFetchCheckInCode` reads Firebase SDK directly — session-cookie approach may affect Firebase Auth state requirement
- Likely blast radius:
  - Auth gate change (fail-closed): portal + all guarded routes (booking-details, door-access, etc.)
  - Session cookie migration: all CF Functions that validate guest token + client `guestSessionGuard.ts`
  - check-in-code auth: `useCheckInCode.ts` must forward session credential; currently sends none

### Test Landscape

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| SDK data access model | Unit | `src/app/(guarded)/__tests__/sdk-auth-failclosed.test.tsx` | `evaluateSdkAccess()` function only; no integration coverage |
| Staff auth bootstrap | Unit (spike) | `src/services/__tests__/staff-auth-bootstrap.spike.test.ts` | Spike-only, not production gate |
| PinAuth replacement | Unit | `src/contexts/messaging/__tests__/PinAuthProvider.replacement.test.tsx` | Exists but narrow |
| check-in-code endpoint | None | — | No test coverage for the unprotected endpoint |
| guest session guard | None | — | No test for fail-open path |
| find-booking rate limit | None | — | No integration test |

#### Coverage Gaps

- No test for `network_error` fail-open in `guestSessionGuard.ts`
- No test for `/api/check-in-code` auth bypass (no auth required currently)
- No test enforcing that `arrival_code` flows use FUNCTION_ONLY path

#### Recommended Test Approach

- Unit tests for: `validateGuestToken` fail-closed behavior, `evaluateCheckInCodeAccess` (new — token validation logic)
- Integration tests: CF Function request/response for check-in-code (auth required), cookie-setting on session creation
- E2E: Not required for this hardening — unit + integration gates are sufficient given static export architecture

## Security Findings

### CRITICAL

**C1 — Unprotected door-code endpoint**
- File: `apps/prime/functions/api/check-in-code.ts:55-148`
- Issue: `GET /api/check-in-code?uuid=<uuid>` returns door code with no session token. `POST /api/check-in-code` generates a door code with uuid + checkOutDate with no session token and no rate limit. UUID format is `occ_\d{13}` (booking system timestamp — guessable).
- Impact: Anyone who can guess or enumerate a guest UUID can retrieve or generate a physical main-door access code without credentials.

**C2 — Non-cryptographic door code generation**
- File: `apps/prime/functions/api/check-in-code.ts:38-44`
- Issue: `generateCode()` uses `Math.floor(Math.random() * CODE_CHARACTERS.length)`. CF Workers runtime provides `crypto.getRandomValues()` (Web Crypto API) globally. Math.random() in V8 is predictable given seed state, especially if generation time is known.
- Impact: Door codes are not randomly distributed with cryptographic strength. With ~28M combinations and predictable generation, targeted brute-force is feasible.

### HIGH

**H1 — Fail-open network_error in auth gate**
- Files: `apps/prime/src/app/portal/page.tsx:61`, `apps/prime/src/app/(guarded)/layout.tsx:63`
- Issue: Both files contain `if (result === 'valid' || result === 'network_error')` to grant access. `guestSessionGuard.ts` maps any 5xx or network exception to `'network_error'`. A targeted DoS on the `/api/guest-session` endpoint (or a transient network error) will grant portal access to any visitor who has a stale session token in localStorage.
- Impact: Auth bypass on network degradation; no token validation required in offline/degraded state.

**H2 — XSS-readable session token in localStorage**
- Files: `apps/prime/src/app/g/page.tsx:97-105`, `apps/prime/src/lib/auth/guestSessionGuard.ts`
- Issue: `prime_guest_token` (32-char hex — the primary auth credential) is stored in localStorage. Any XSS vulnerability in the app (including third-party scripts in CSP `unsafe-inline`) can exfiltrate this token. Token controls access to booking data and (via the unprotected endpoint) door codes.
- Impact: Full session hijack via XSS. CSP currently allows `script-src 'unsafe-inline'` which does not prevent inline injection from compromised markup.

### MEDIUM

**M1 — Data access model not enforced at call site**
- Files: `apps/prime/src/lib/security/dataAccessModel.ts:17` (`arrival_code: 'FUNCTION_ONLY'`), `apps/prime/src/hooks/pureData/useFetchCheckInCode.ts`
- Issue: The data access model declares `arrival_code` as `FUNCTION_ONLY`, meaning it should only be fetched through a CF Function, not the Firebase SDK directly. `useFetchCheckInCode` reads `checkInCodes/byUuid/${uuid}` via Firebase SDK, bypassing this intent. The protection is only as strong as Firebase Security Rules (unknown/unverified).
- Impact: If Firebase Security Rules are permissive on `checkInCodes/`, any authenticated Firebase user can read any guest's check-in code directly.

**M2 — Firebase Security Rules unknown**
- No `.rules` file in repository. Firebase Security Rules for `checkInCodes/` and `guestSessionsByToken/` paths are managed exclusively in the Firebase console and unverifiable from code review.
- Impact: Cannot confirm server-side enforcement of data access boundaries without out-of-band verification.

## Questions

### Resolved

- Q: Is the guarded layout server-enforced?
  - A: No. `(guarded)/layout.tsx` is `'use client'` and Next.js static export produces no server component execution. Enforcement is entirely client-side.
  - Evidence: `apps/prime/src/app/(guarded)/layout.tsx:1`

- Q: Does the check-in-code POST endpoint use `crypto.getRandomValues()` or `Math.random()`?
  - A: `Math.random()` — not cryptographically secure.
  - Evidence: `apps/prime/functions/api/check-in-code.ts:38-44`

- Q: Does `useCheckInCode` send a guest session token when calling `/api/check-in-code`?
  - A: No. `useCheckInCode` sends only `{ uuid, checkOutDate }` in the POST body. No Authorization header, no session cookie, no token.
  - Evidence: `apps/prime/src/hooks/useCheckInCode.ts:110-116`

- Q: Is there an existing KV namespace that can be reused for check-in-code rate limiting?
  - A: Yes. `CF_PRIME_RATE_LIMIT` KV namespace is already used in `guest-session.ts` and `find-booking.ts`. The same binding can be extended to check-in-code with a different key prefix.
  - Evidence: `apps/prime/functions/api/guest-session.ts:16-21`, `apps/prime/functions/api/find-booking.ts`

- Q: What is the right session mechanism for a static-export app on CF Pages?
  - A: HttpOnly session cookies set by CF Pages Functions. The Function can respond with `Set-Cookie: prime_session=<token>; HttpOnly; Secure; SameSite=Strict; Path=/`. Subsequent requests automatically include the Cookie header. CF Pages Functions can read and validate it. This is architecturally supported with static export.
  - Evidence: CF Pages Functions are edge workers that can set response headers including Set-Cookie. Static export doesn't preclude this; the client's browser handles cookie storage and transmission natively.

- Q: Is PinAuth (staff auth) in scope?
  - A: No. Staff auth uses Firebase custom tokens (not localStorage guest tokens); it is a separate security perimeter. The staff localStorage keys (`prime_staff_auth_token` etc.) represent a similar XSS risk but are lower priority since staff accounts are controlled credentials. Out of scope for this dispatch.
  - Evidence: `apps/prime/src/contexts/messaging/PinAuthProvider.tsx`

### Open (Operator Input Required)

- Q: What are the current Firebase Security Rules for `checkInCodes/` and `guestSessionsByToken/`?
  - Why operator input is required: Rules are only in Firebase console; no `.rules` file in repo. Agent cannot read console state.
  - Decision impacted: Whether TASK-04 (Firebase rules tightening) is urgent (rules permissive = must fix) or advisory (rules already restrictive = lower priority).
  - Decision owner: Peter Cowling
  - Default assumption + risk: Assume rules are permissive (worst case). Plan includes tightening task. If rules are already correctly scoped, that task becomes a verification-only task.

## Confidence Inputs

- Implementation: 88% — all key files read; attack surface fully mapped. Slight gap: Firebase rules state unknown.
- Approach: 90% — HttpOnly cookie pattern is well-established for CF Workers; KV rate limit pattern already in codebase.
- Impact: 95% — findings directly traceable to code; physical door code exposure is unambiguous.
- Delivery-Readiness: 87% — all four high-priority tasks have clear execution paths. Firebase rules task is conditionally scoped.
- Testability: 80% — unit tests for fail-closed logic and cookie validation are straightforward. CF Function integration tests require test harness.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Cookie migration breaks offline PWA mode | Medium | High | `useCheckInCode` has offline cache path. Session cookie persists across offline periods but cannot be renewed offline. Plan must verify offline flow continues to work for cached door codes. |
| HttpOnly cookie same-origin issue with CF Pages Functions | Low | High | CF Pages Functions run on the same origin as the Pages app. Same-origin cookie is sent automatically. Low risk but verify wrangler.toml binding ensures same-origin routing. |
| Firebase rules are already restrictive — TASK-04 is wasted effort | Low | Low | Worst case: verification confirms rules are correct. Task converts to audit-only. |
| Fail-closed change breaks offline portal access | Medium | Medium | Users offline with a valid session token will now hit `network_error` and be denied. Must implement a grace period or cached-session fallback in the guard. |
| Math.random() replacement has no behavior change for end-users | None | None | Transparent; code format unchanged. Low risk. |

## Planning Constraints & Notes

- Must-follow patterns:
  - KV rate limit key prefix: `check-in-code:{ip}` to namespace separately from `guest-session:` and `find-booking:` prefixes
  - CF Function session validation: read `Authorization: Bearer <token>` header OR `Cookie: prime_session=<token>`; validate against `guestSessionsByToken/{token}` in Firebase
  - HttpOnly cookie path: `Path=/` (all routes); `SameSite=Strict`; `Secure`; `HttpOnly`; max-age = token expiry (48h after checkout)
  - Fail-closed fix must maintain a UX for offline guests: show "Connect to verify your session" rather than silently failing — offline cached door code fetch is already handled in `useCheckInCode`
- Rollout/rollback expectations:
  - Fail-closed fix: instant rollback by reverting the condition. No state change.
  - check-in-code auth: CF Function change. Rollback by reverting Function file + redeploy.
  - Cookie migration: atomic with session guard changes. Must be deployed together. If rollback needed, revert both Function and client guard.
  - Math.random() fix: backward-compatible; existing codes unaffected.
- Observability expectations:
  - Add `console.warn` log when check-in-code request is rejected for missing token (CF Function)
  - Add `console.warn` log when guest session validation denies on `network_error` (client)

## Suggested Task Seeds

- TASK-01: Fix fail-open `network_error` → fail-closed in `portal/page.tsx` and `(guarded)/layout.tsx` + add unit test
- TASK-02: Add session token validation + KV rate limit to `/api/check-in-code` (GET + POST)
- TASK-03: Replace `Math.random()` with `crypto.getRandomValues()` in check-in-code generation
- TASK-04: Firebase Security Rules audit for `checkInCodes/` and `guestSessionsByToken/` (INVESTIGATE task)
- TASK-05: Migrate guest session token from localStorage to HttpOnly cookie (CF Function `Set-Cookie` + client guard update)

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| check-in-code endpoint auth gap | Yes | None | No |
| Math.random() in code generation | Yes | None | No |
| Fail-open network_error paths | Yes | None | No |
| localStorage session XSS surface | Yes | None | No |
| Firebase rules state | Partial | [Moderate] Cannot verify from code alone | No — Open Q to operator, default assumption documented |
| Offline PWA impact of fail-closed fix | Yes | [Minor] Offline users denied portal; need UX message | No — Planning constraint documented |
| Cookie migration offline interaction | Yes | [Moderate] Cookie session cannot renew offline | No — Planning constraint documented |
| Data access model enforcement | Yes | [Minor] `useFetchCheckInCode` bypasses FUNCTION_ONLY intent | No — TASK-04 (Firebase rules) covers protective layer |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** Four findings (C1, C2, H1, H2) map to four tasks with clear execution paths and no ambiguous dependencies. Firebase rules (TASK-04) is scoped as INVESTIGATE to contain uncertainty. The cookie migration (TASK-05) is M-effort with known CF Pages Function patterns. Scope aligns exactly with dispatch's stated boundary.

## Evidence Gap Review

### Gaps Addressed

- Confirmed check-in-code endpoint has no auth (direct code read, not inferred)
- Confirmed Math.random() usage (direct code read line 38-44)
- Confirmed fail-open condition in both portal and guarded layout (direct code read)
- Confirmed localStorage session storage for both guest and staff paths
- Confirmed KV rate limit pattern exists and can be reused
- Confirmed CF Pages Function capability for HttpOnly cookie setting

### Confidence Adjustments

- Implementation raised from 80% to 88% after reading all 10 relevant files
- Testability stayed at 80% — CF Function integration test harness is not pre-built; requires test setup work in TASK-01/TASK-02

### Remaining Assumptions

- Firebase Security Rules state: assumed permissive (worst case); TASK-04 resolves this
- Offline grace-period UX: assumed "show error + retry" is acceptable; operator may prefer session caching for offline

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: All four CRITICAL/HIGH findings remediated and covered by tests; door-code endpoint requires valid session token; fail-open condition removed
- Post-delivery measurement plan: Smoke test `/api/check-in-code` without auth token → expect 401; with valid token → expect code returned; curl through TLS 1.3 with HttpOnly cookie in response

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None (open Firebase rules question is scoped as INVESTIGATE task, not a planning blocker)
- Recommended next step: `/lp-do-plan prime-guest-access-hardening --auto`
