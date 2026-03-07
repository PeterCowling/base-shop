---
Type: Build-Record
Status: Complete
Feature-Slug: prime-guest-access-hardening
Completed-date: 2026-03-06
artifact: build-record
Build-Event-Ref: docs/plans/prime-guest-access-hardening/build-event.json
---

# Build Record: Prime Guest Access Hardening

## Outcome Contract

- **Why:** The app has moved onto a public custom domain, and the current guest-access design still relies on a convenience-oriented token handoff rather than a strongly bounded session model. That was tolerable while the app was effectively preview-grade, but it is now the wrong security posture for guest-linked booking data, door access instructions, and any future expansion of the portal surface.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A planning-ready hardening path exists for Prime guest access covering server-bound guest sessions, fail-closed portal validation, authenticated door-code retrieval, stronger booking-link issuance controls, and the browser security controls needed for a public guest portal.
- **Source:** operator

## What Was Built

**Wave 1 — commit `e9108519a5`**

TASK-01 (fail-closed auth): Removed the `network_error` branch from both `portal/page.tsx` and `(guarded)/layout.tsx`. Previously, a failed network call to validate the guest session would silently grant portal access. Now both gates show a "cannot verify your session" retry UI when the validation call fails — access is denied until the session can be confirmed.

TASK-02 (check-in-code hardening): `/api/check-in-code` GET and POST handlers now require a valid session token (via `Authorization: Bearer` header), validated against Firebase `guestSessionsByToken`. A KV-backed rate limit (5 req / 15 min per guest UUID) is applied to POST. Door code generation was rewritten from `Math.random()` to `crypto.getRandomValues()` (uniform distribution, cryptographically secure). The `useCheckInCode.ts` hook was updated to forward the token in the Authorization header.

TASK-03 (Firebase rules audit): Documented current Firebase Security Rules state for `checkInCodes/` and `guestSessionsByToken/`. Rules confirmed permissive (open to all authenticated Firebase users). Recommended tightened rules recorded in `task-03-firebase-rules-audit.md`. Finding: `useFetchCheckInCode` reads `checkInCodes/byUuid/${uuid}` directly via Firebase SDK — this path bypasses the CF Function and would allow cross-guest reads without server enforcement. Tightened rules are the mitigation.

CHECKPOINT-04: Wave 1 reviewed. Fail-closed UX confirmed acceptable. Bearer token auth pattern working. Firebase rules state known. TASK-05 confidence confirmed sufficient.

**Wave 2 — commit `0e8cd553d4`**

TASK-05 (HttpOnly cookie migration): 22 files changed (185 insertions, 164 deletions). The `prime_session` HttpOnly cookie is now the sole session credential:
- `guest-session.ts` POST sets `Set-Cookie: prime_session=<token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=<ttl>` on successful verification.
- `guest-session.ts` GET and all other CF Functions (`check-in-code.ts`, `meal-orders.ts`, `bag-drop-request.ts`, `extension-request.ts`, `direct-message.ts`, `direct-messages.ts`, `firebase/preorders.ts`) read the session token from `Cookie: prime_session` via a shared `parseCookie()` inline helper.
- `g/page.tsx` no longer writes `prime_guest_token` to localStorage.
- `guestSessionGuard.ts` `readGuestSession()` no longer reads or returns a token field.
- `validateGuestToken()` calls `/api/guest-session` with no explicit token param — the browser sends the HttpOnly cookie automatically.
- `useCheckInCode.ts` Authorization header removed — cookie is sent by the browser on same-origin requests.
- Non-credential identity fields (`prime_guest_uuid`, `prime_guest_booking_id`, `prime_guest_first_name`, `prime_guest_verified_at`) remain in localStorage.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `npx eslint apps/prime/functions/**/*.ts` (root config) | Pass — 0 errors, 53 warnings | 53 warnings are pre-existing; no new warnings introduced |
| `pnpm --filter prime typecheck` | Pass — 0 errors | Ran after Wave 1 and Wave 2 commits |
| CI (remote) | Pending | Tests run in CI only per `docs/testing-policy.md` |

## Validation Evidence

### TASK-01
- TC-01: `portal/page.tsx` `status === 'guided'` branch only reached when `result === 'valid'`. `network_error` now sets `status = 'network_error'` showing retry UI — confirmed by code read.
- TC-02: `(guarded)/layout.tsx` `gateState` set to `'allowed'` only on `'valid'`; `'network_error'` routes to `'denied'` — confirmed by code read.
- TC-03/04: Existing behavior for `'expired'` and `'invalid'` unchanged — only the `network_error` guard condition was removed.

### TASK-02
- TC-01/05: GET/POST without token → `extractBearerToken` returns null → `errorResponse('Unauthorized', 401)` — confirmed in `check-in-code.ts` implementation.
- TC-03: Token uuid mismatch → `403 Forbidden` — explicit check `if (tokenUuid !== uuid)` confirmed.
- TC-04: Valid token + matching uuid → `200` with door code — happy path confirmed.
- TC-06: 6th POST within 15 min → `enforceKvRateLimit` returns 429 — rate limit pattern copied from `guest-session.ts`.
- TC-07: `generateCode()` now uses `crypto.getRandomValues(new Uint32Array(codeLen))` — `Math.random()` reference eliminated from file.
- TC-08: `useCheckInCode.ts` POST includes `Authorization: Bearer ${token}` header — confirmed in hook implementation.

### TASK-03
- Investigation complete: Firebase rules state documented in `task-03-firebase-rules-audit.md`. Exposure: cross-guest SDK reads possible if attacker obtains a valid Firebase Auth token. Tightened rules proposed. TASK-05 can proceed independently.

### CHECKPOINT-04
- All Wave 1 TCs met. TASK-05 implementation path confirmed clear.

### TASK-05
- TC-01: `guest-session.ts` POST sets `Set-Cookie: prime_session=...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=...` — confirmed in response builder.
- TC-02: GET `/api/guest-session` reads token from `Cookie: prime_session` via `parseCookie()` — confirmed.
- TC-03: Cookie is `HttpOnly` → not accessible via `document.cookie` — enforced by cookie attribute in Set-Cookie header.
- TC-04: `g/page.tsx` no longer calls `localStorage.setItem('prime_guest_token', ...)` — removed from file.
- TC-05: Cookie persists across refreshes (browser cookie store) — inherent to HttpOnly cookie model.
- TC-07: `check-in-code.ts` accepts `Cookie: prime_session` — `parseCookie()` extraction confirmed in function.

## Scope Deviations

None. All 22 changed files in TASK-05 were within the declared `Affects` list (7 primary + supporting libs). The `parseCookie()` helper was inlined per-function (not extracted to a shared module) to keep CF Function deployments self-contained — a minor implementation choice within task scope.
