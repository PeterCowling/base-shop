---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Critique-Score: 4.0
Critique-Verdict: credible
Critique-Rounds: 1
Domain: Platform
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: prime-portal-personalization
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/prime-portal-personalization/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-011
Trigger-Why: Guest portal personalization relies on the ?uuid= query parameter in a fragile way that could cause data leakage or silent fallback to wrong guest data.
Trigger-Intended-Outcome: type: operational | statement: All entry points to the guarded home pass uuid through localStorage-backed session only, with no direct URL parameter reads for data access decisions; uuid tamper risk is eliminated by server-side session verification. | source: auto
---

# Prime Portal Personalization Fact-Find Brief

## Scope

### Summary

The prime guest portal uses a `?uuid=` URL query parameter (`occ_<13 digits>`) to identify the guest within Firebase. This parameter is read by `useUuid.ts` and used directly as a Firebase lookup key throughout the entire guarded section — without server-side cross-checking to confirm the uuid belongs to the authenticated session. The authentication layer (HttpOnly cookie `prime_session`) was hardened in TASK-05 to use a server-validated cookie, but `useUuid` still accepts the uuid from the URL and falls back to localStorage, while data hooks pass it directly to Firebase RTDB. The concern is whether a guest can tamper with `?uuid=` to read another occupant's data.

### Goals
- Determine the exact code path by which `?uuid=` is read, validated, and trusted.
- Determine whether the authenticated session (`prime_session` cookie) cross-checks the uuid.
- Determine what happens when the param is missing, malformed, or tampered with.
- Determine whether uuid is persisted to localStorage and whether that eliminates re-read-from-URL risk.
- Produce a clear threat model and recommended changes for hardening.

### Non-goals
- Staff/pin-auth flows (separate auth path).
- Owner dashboard data access.
- Firebase RTDB security rules as configured in Firebase console (out-of-codebase-scope — not in this repo; operator must confirm rules before the plan can set tamper fix as Critical vs. advisory priority).

### Constraints & Assumptions
- Constraints:
  - Cloudflare Pages Functions (edge) — no server-side React rendering in the data-fetch path.
  - Firebase RTDB security rules are unknown; assumed to be open or API-key-only given the FUNCTION_ONLY access model for sensitive flows (see `dataAccessModel.ts`).
- Assumptions:
  - Firebase RTDB rules do not enforce per-occupant access for SDK paths at this time (based on `FUNCTION_ONLY` pattern for all sensitive flows).
  - The `prime_session` HttpOnly cookie is the canonical auth credential; uuid is supplemental identity carried in localStorage/URL for client routing.

## Outcome Contract

- **Why:** Guest portal personalization relies on the `?uuid=` query parameter in a fragile way that could cause data leakage or silent fallback to wrong guest data.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All entry points to the guarded home pass uuid exclusively through the server-validated session; uuid tamper risk is eliminated; no guest can access another guest's data by manipulating the URL parameter.
- **Source:** auto

## Current Process Map

- Trigger: Guest receives a deep link `/g/<token>` (from email or `/find-my-stay` flow).
- End condition: Guest lands on guarded home `/?uuid=<occ_id>` and the page renders personalized data.

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Deep link entry | 1. Guest visits `/g/<token>`. 2. `GuestEntryContent` reads `?token` from URL. 3. GET `/api/guest-session?token=<token>` validates existence and expiry in Firebase. 4. Guest submits last name via POST `/api/guest-session` with `{token, lastName}`. 5. Server checks last name against Firebase, sets `prime_session` HttpOnly cookie, returns `{bookingId, guestUuid, guestFirstName}`. 6. Client writes `bookingId`, `guestUuid`, `firstName`, `verifiedAt` to localStorage. 7. Redirects guest to `/portal`. | Cloudflare Pages Function, Firebase RTDB | `apps/prime/src/app/g/page.tsx`, `apps/prime/functions/api/guest-session.ts` | `prime_guest_token` key in localStorage is still referenced by `digital-assistant/page.tsx:107` but not written by the current POST flow (stale reference). |
| Portal entry / guided onboarding | 1. `/portal` page runs `readGuestSession()` from localStorage. 2. Calls `validateGuestToken()` which GETs `/api/guest-session` using `prime_session` cookie. 3. If valid, shows `GuidedOnboardingFlow`. 4. On complete, calls `buildGuestHomeUrl(session)` → `/?uuid=<session.uuid>`. 5. Router replaces to guarded home with `?uuid=` in URL. | Client, Cloudflare Pages Function | `apps/prime/src/app/portal/page.tsx`, `apps/prime/src/lib/auth/guestSessionGuard.ts` | uuid is read from localStorage and placed back into URL by client — no server cross-check. |
| Guarded layout auth gate | 1. `GuardedGate` calls `validateGuestToken()` (cookie-based). 2. If valid, sets `gateState='allowed'` and renders children. 3. Periodic re-validation via `useSessionValidation` at 30-min interval. | Client | `apps/prime/src/app/(guarded)/layout.tsx` | Gate checks session validity but NOT that uuid in URL belongs to the session. |
| uuid resolution in data hooks | 1. All guarded-section data hooks call `useUuid()`. 2. `useUuid` reads `?uuid` from URL, validates format (`/^occ_\d{13}$/i`), falls back to `localStorage['prime_guest_uuid']` if absent from URL. 3. The validated uuid is used as the Firebase lookup key for `bookings/`, `guestsDetails/`, `loans/`, etc. | Client, Firebase RTDB | `apps/prime/src/hooks/useUuid.ts`, `apps/prime/src/hooks/pureData/useFetchBookingsData.client.ts` | **uuid from URL is NOT cross-checked against the session (prime_session cookie / Firebase session token).** An attacker who is authenticated (has a valid session) can substitute another guest's `occ_<id>` in the URL to attempt to read their data. |
| Find-My-Stay entry | 1. Guest submits surname + bookingRef. 2. GET `/api/find-booking` matches surname → returns `{redirectUrl: "/g/<token>"}`. 3. Client assigns `window.location` to the URL. | Cloudflare Pages Function, Firebase RTDB | `apps/prime/functions/api/find-booking.ts` | `find-booking` issues a token scoped to `leadOccupantId` (lead guest or first occupant), not necessarily the matched occupant. Non-lead occupants who match surname get a token scoped to the lead guest. |

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:** n/a
- **Expected Artifacts:** n/a
- **Expected Signals:** n/a

### Prescription Candidates

| Prescription ID | Prescription Family | Required Route | Required Inputs | Expected Artifacts | Expected Signals |
|---|---|---|---|---|---|
| n/a | | | | | |

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/src/app/g/page.tsx` — deep link token entry; sets localStorage session after last-name verification
- `apps/prime/src/app/portal/page.tsx` — portal/guided-onboarding entry; reads from localStorage, validates session via cookie
- `apps/prime/src/app/(guarded)/layout.tsx` — guarded section entry gate; validates session via cookie, does NOT check uuid
- `apps/prime/src/hooks/useUuid.ts` — uuid resolution hook; reads `?uuid` from URL, falls back to localStorage; used by all data hooks
- `apps/prime/functions/api/guest-booking.ts` — booking snapshot endpoint; validates token from cookie/param, cross-checks `guestUuid` against booking
- `apps/prime/functions/api/find-booking.ts` — booking lookup entry; issues token for lead guest (not necessarily matched occupant)

### Key Modules / Files

- `apps/prime/src/lib/auth/guestSessionGuard.ts` — client-side session read/clear/validate; `readGuestSession()` reads 4 localStorage keys (no `token`); `validateGuestToken()` uses cookie-only GET to `/api/guest-session`
- `apps/prime/functions/lib/guest-session.ts` — server: validates token from Firebase `guestSessionsByToken/<token>` with expiry check
- `apps/prime/functions/lib/guest-token.ts` — token generation (`crypto.randomUUID()` stripped of dashes, 32 hex chars)
- `apps/prime/src/hooks/pureData/useFetchBookingsData.client.ts` — primary data hook; uses uuid from `useUuid()` for reverse index lookup and Firebase RTDB read directly
- `apps/prime/src/lib/security/dataAccessModel.ts` — declares `FUNCTION_ONLY` for all sensitive flows; booking_details, loans, etc. are `FUNCTION_ONLY`
- `apps/prime/src/app/(guarded)/digital-assistant/page.tsx:107` — reads `prime_guest_token` from localStorage (stale reference — this key is no longer written)

### Patterns & Conventions Observed

- Session auth is cookie-based (`prime_session` HttpOnly, `Secure`, `SameSite=Strict`) — secure against CSRF and JS exfiltration — evidence: `apps/prime/functions/api/guest-session.ts:170`
- uuid validation uses `z.string().regex(/^occ_\d{13}$/i)` — format-only, not identity-verified — evidence: `apps/prime/src/hooks/useUuid.ts:16-18`
- `FUNCTION_ONLY` policy exists in `dataAccessModel.ts` for sensitive flows but is **not enforced at the hook level** — `useFetchBookingsData` reads Firebase RTDB directly with SDK (not through a function proxy)
- Token expiry is set to 48 hours after checkout — evidence: `apps/prime/functions/lib/guest-token.ts:22`
- Rate limiting on `/api/find-booking` (5 attempts per IP per hour) and `/api/guest-session` POST (5 attempts per IP:token per 15 minutes) — evidence: `apps/prime/functions/api/find-booking.ts:29-30`, `apps/prime/functions/api/guest-session.ts:45-46`

### Data & Contracts

- Types/schemas/events:
  - `GuestSessionSnapshot` (client): `{bookingId, uuid, firstName, verifiedAt}` — no token field (tests are using a stale snapshot that includes `token`, creating a test/type mismatch)
  - `PRIME_GUEST_SESSION_KEYS`: `['prime_guest_booking_id', 'prime_guest_uuid', 'prime_guest_first_name', 'prime_guest_verified_at']` — `prime_guest_token` is absent from this list but still referenced in `digital-assistant/page.tsx`
  - uuid regex: `^occ_\d{13}$` — format-only validation
- Persistence:
  - `prime_session` HttpOnly cookie — set by POST `/api/guest-session`; source of truth for authentication
  - `prime_guest_uuid` in localStorage — used by `useUuid` fallback when URL param absent; written once at verification
  - `prime_guest_booking_id`, `prime_guest_first_name`, `prime_guest_verified_at` in localStorage — supplemental session metadata
  - `prime_guided_onboarding_complete:<bookingId>` in localStorage — per-booking onboarding flag
- API/contracts:
  - `/api/guest-session` GET: accepts `prime_session` cookie OR `?token=` query param (legacy fallback); returns `{status, expiresAt}`
  - `/api/guest-booking` GET: accepts `prime_session` cookie or `?token=` query param; cross-checks `guestUuid` in the session against the booking occupant list
  - `/api/find-booking` GET: returns `{redirectUrl: "/g/<token>"}` — issues token for lead guest, not necessarily matched occupant

### Dependency & Impact Map

- Upstream dependencies:
  - Firebase RTDB (direct SDK reads from client for all booking/loans/preorders data)
  - Cloudflare Pages Functions (session token validation, booking snapshot endpoint)
- Downstream dependents:
  - All guarded-section data hooks depend on `useUuid()` returning the correct uuid
  - `useFetchBookingsData` (reverse index + full scan), `useFetchLoans`, `useFetchGuestDetails`, `useFetchGuestByRoom`, `useFetchBagStorageData`, `useFetchPreordersData`, `useFetchGuestProfile`, `useFetchQuestProgress`, `useFetchCheckInCode`, `useFetchPreArrivalData` — all call `useUuid()` directly (26 call sites)
  - `validateGuestToken()` callers (return type change in TASK-02 affects these): `apps/prime/src/app/portal/page.tsx`, `apps/prime/src/app/(guarded)/layout.tsx`, `apps/prime/src/hooks/useSessionValidation.ts`. Additional callers not enumerated — a complete grep of `validateGuestToken` call sites is required before TASK-02 proceeds.
- Likely blast radius:
  - Any change to uuid resolution in `useUuid` affects all 26 dependent call sites
  - Adding server-side uuid cross-check requires a new API route or enhancing `/api/guest-session` GET response
  - Changing `validateGuestToken` return type affects all callers; full call site enumeration required before TASK-02

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library (unit/integration), Cypress (e2e)
- Commands: pnpm --filter prime test (governed runner: pnpm -w run test:governed)
- CI integration: yes — runs in CI pipeline

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| guestSessionGuard | Unit | `src/lib/auth/__tests__/guestSessionGuard.test.ts` | Tests `readGuestSession`, `clearGuestSession`, `validateGuestToken`, `buildGuestHomeUrl` — references stale `token` field in GuestSessionSnapshot |
| Portal page | Integration | `src/app/portal/__tests__/page.test.tsx`, `guided-onboarding.test.tsx` | Tests redirect on valid/expired session; mocks `readGuestSession` with stale `token` field |
| Session validation hook | Unit | `src/hooks/__tests__/useSessionValidation.test.ts` | Tests valid/expired/network_error cases; references `token` param in hook call but current hook has no `token` param |
| useUuid | Not found | — | No direct test for useUuid hook; uuid tamper / cross-check coverage: **NONE** |
| Guest entry /g/page | Unit | `src/app/g/__tests__/trust-cues.test.tsx` | Only tests trust copy rendering; verification and POST flow untested at integration level |
| find-booking | No direct test | — | No unit tests for the find-booking CF function |
| guest-session CF function | No direct test | — | No unit tests for CF function |

#### Coverage Gaps

- Untested paths:
  - uuid tamper scenario (no test asserts that supplying a different uuid is rejected)
  - `useUuid()` fallback from URL to localStorage (no unit test)
  - `find-booking` issuing token for lead guest when non-lead guest surname matched (no test)
  - Stale `prime_guest_token` reference in `digital-assistant/page.tsx` — will silently send `null` to `/api/assistant-query`

### Recent Git History (Targeted)

Not investigated: git history for this feature area not examined in this fact-find.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No UI-only changes expected; uuid resolution is backend-facing | — | No |
| UX / states | Required | Error state exists (redirect to /error) when uuid invalid/missing; no UX for "uuid tampered" case | No specific error state for uuid mismatch; guest gets silent redirect to /error which may be confusing | Minimal — keep error redirect but add instrumentation |
| Security / privacy | Required | `prime_session` HttpOnly cookie is secure; uuid validated by format only (not cross-checked against session); Firebase RTDB reads bypass server for all booking data via SDK | Critical: uuid can be substituted by any valid-format `occ_<13 digits>` string if Firebase rules allow open reads with API key | Yes — primary concern |
| Logging / observability / audit | Required | `console.warn` on guestUuid mismatch in guest-booking.ts (server-only); client-side error logger on invalid uuid | No audit log for uuid substitution attempts; no analytics event on uuid mismatch | Yes — add anomaly tracking for uuid mismatch |
| Testing / validation | Required | Session guard tests exist but use stale type (token field); useUuid has zero test coverage; uuid tamper has zero test coverage | Major gaps in uuid resolution and tamper detection testing | Yes — test seeds needed |
| Data / contracts | Required | `GuestSessionSnapshot` type has diverged from tests (stale `token` field in test mocks); `PRIME_GUEST_SESSION_KEYS` does not include `prime_guest_token` yet it is still read by digital-assistant | Type/implementation divergence; stale localStorage key read | Yes — type contract cleanup needed |
| Performance / reliability | N/A | uuid resolution is synchronous localStorage read; no perf concern | — | No |
| Rollout / rollback | Required | No feature flag needed; change is auth-path hardening; rollback is code revert | Hardening the auth path may break existing sessions that rely on URL-only uuid (e.g. shared links navigated directly) | Yes — migration strategy for URL-based routing needed |

## Questions

### Resolved

- Q: Does the server cross-check the uuid in the session against the uuid in the URL?
  - A: **No.** The guarded layout only checks that the `prime_session` cookie is valid (via `/api/guest-session`). It does not compare the uuid in the URL against the session's `guestUuid`. The uuid comes entirely from the URL (`?uuid=`) or localStorage — never from the server-verified session in the client request path.
  - Evidence: `apps/prime/src/app/(guarded)/layout.tsx` — `validateGuestToken()` call; `apps/prime/src/lib/auth/guestSessionGuard.ts` — `validateGuestToken` returns `valid/expired/invalid/network_error` only, not the session payload.

- Q: What happens when `?uuid=` is absent from the URL?
  - A: `useUuid` falls back to `localStorage['prime_guest_uuid']`. If absent there too, it redirects to `/error`.
  - Evidence: `apps/prime/src/hooks/useUuid.ts:49-64`.

- Q: What happens when `?uuid=` is malformed?
  - A: Format is validated with `z.string().regex(/^occ_\d{13}$/i)`. Invalid format redirects to `/error`.
  - Evidence: `apps/prime/src/hooks/useUuid.ts:67-76`.

- Q: Is the uuid persisted after first read?
  - A: Yes — the uuid is stored in `localStorage['prime_guest_uuid']` during the `/g/<token>` verification step. But `useUuid` still reads from the URL first on every navigation (URL takes precedence over localStorage). An attacker can override the stored value by adding `?uuid=` to any URL in the guarded section.
  - Evidence: `apps/prime/src/app/g/page.tsx:98-100`; `apps/prime/src/hooks/useUuid.ts:31-54`.

- Q: Can a guest access another guest's data by manipulating `?uuid=`?
  - A: **Potentially yes.** The `prime_session` cookie proves the guest is authenticated. The uuid is the key used for all Firebase RTDB reads. If Firebase RTDB security rules allow read access to any path under an API-key-authenticated connection (rather than per-occupant rules), then substituting a valid `occ_<13 digits>` value would expose that occupant's booking, financial, and personal data. The `FUNCTION_ONLY` access model in `dataAccessModel.ts` documents the intended policy but the data hooks (`useFetchBookingsData`, etc.) do NOT enforce it — they use the Firebase SDK directly.
  - Evidence: `apps/prime/src/lib/security/dataAccessModel.ts` — FUNCTION_ONLY declared for `booking_details`; `apps/prime/src/hooks/pureData/useFetchBookingsData.client.ts:140-156` — SDK reads directly with uuid, no function proxy.

- Q: What are the correct token expiry / token scoping rules?
  - A: Token expires 48 hours after guest checkout. Token is scoped to `bookingId + guestUuid`. `/api/guest-booking` validates both — if `guestUuid` from session is not in the booking, it returns 404 (no silent fallback introduced recently). But `/api/find-booking` issues a token for `leadOccupantId` regardless of which occupant's surname was matched — so non-lead occupants who look up their booking get a token scoped to the lead guest.
  - Evidence: `apps/prime/functions/lib/guest-token.ts:22-32`; `apps/prime/functions/api/guest-booking.ts:148-161`; `apps/prime/functions/api/find-booking.ts:105-117`.

- Q: Is there a `prime_guest_token` localStorage key still in use?
  - A: Partially. `PRIME_GUEST_SESSION_KEYS` no longer includes `prime_guest_token`, and `readGuestSession()` does not read it. But `digital-assistant/page.tsx:107` still reads `localStorage.getItem('prime_guest_token')` directly, and the tests for `guestSessionGuard` mock it (stale). This key is never written by the current session establishment flow, so digital-assistant sends `null` as the token in its POST body.
  - Evidence: `apps/prime/src/app/(guarded)/digital-assistant/page.tsx:107`; `apps/prime/src/lib/auth/guestSessionGuard.ts:1-6`.

### Open (Operator Input Required)

- Q: What are the current Firebase RTDB security rules for the `bookings/`, `guestsDetails/`, `loans/` paths?
  - Why operator input is required: Firebase RTDB security rules are not in the codebase — they are configured in the Firebase console. Without this, the actual exploitability of the uuid tamper vector cannot be confirmed (it could be mitigated or fully exploitable depending on rules).
  - Decision impacted: Whether the fix is urgent (rules are open/API-key-only → critical) or advisory (rules already enforce per-occupant access → medium risk).
  - Decision owner: Peter Cowling / BRIK operator.
  - Default assumption (if any) + risk: Given that `dataAccessModel.ts` documents `FUNCTION_ONLY` as the intended policy for `booking_details` etc. but the hooks bypass it, the rules are likely open to any authenticated SDK connection. If this assumption is wrong and rules already enforce per-occupant reads, the urgency drops.

## Confidence Inputs

- Implementation: 80%
  - Evidence: Complete entry-to-data-read path traced. Main unknown is Firebase RTDB rules.
  - To raise to ≥90: Confirm Firebase RTDB rules for `bookings/`, `guestsDetails/`, `loans/` paths.
- Approach: 75%
  - Evidence: Two viable approaches identified (server-side uuid cross-check vs. FUNCTION_ONLY enforcement). Clear winner exists (cookie-session-to-uuid binding at GuardedGate).
  - To raise to ≥90: Confirm RTDB rules to size the urgency; confirm no existing tests rely on URL-uuid-substitution behavior.
- Impact: 85%
  - Evidence: 26 call sites affected if `useUuid` changes; data exposure risk is concrete.
  - To raise to ≥90: Confirm RTDB rules (quantifies actual exploitability).
- Delivery-Readiness: 75%
  - Evidence: Entry points and data-hook dependency graph fully mapped; Firebase rules unknown.
  - To raise to ≥80: Answer the Firebase RTDB rules open question.
- Testability: 85%
  - Evidence: uuid validation is pure function logic; session cross-check can be unit tested via hook mock; integration test at GuardedLayout level is feasible.
  - To raise to ≥90: Add dedicated `useUuid` unit tests and uuid-mismatch scenario tests.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Guest can tamper `?uuid=` to read another occupant's Firebase data | Medium (if RTDB rules are open) | High (PII: names, room numbers, financials, dates) | Enforce server-side uuid cross-check in GuardedGate + confirm RTDB rules |
| `find-booking` issues tokens for lead guest when non-lead occupant searched | Medium | Medium (non-lead guest sees lead guest's personalization, not their own) | Fix token issuance to use `matchedOccupantId` not `leadOccupantId` |
| `prime_guest_token` stale localStorage read in digital-assistant | High (always occurs) | Low (assistant query sends null token, may cause API auth failure silently) | Remove stale `prime_guest_token` read; use `prime_session` cookie path |
| Tests use stale `GuestSessionSnapshot` type with `token` field | High (tests are passing but mock divergence masks real interface) | Low (test false confidence) | Clean up test mocks to match actual interface |
| `useUuid` URL-first priority allows uuid override on any navigation | High (design) | Medium (precondition for tamper) | Change `useUuid` to prefer localStorage-backed session, reject URL uuid if it doesn't match session |
| Firebase RTDB rules unknown — exploitability unconfirmed | High (lack of evidence) | High (if rules are open) | Confirm rules; if open, escalate fix to critical |
| Non-lead occupant token scoping: lead guest gets personalization, not the actual guest who looked up | Medium | Medium (wrong personalization experience for multi-occupant bookings) | Fix `find-booking` to scope token to matched occupant |
| `fetchViaFullScan` downloads entire `bookings/` root for un-indexed occupants (first login) | High (fires on every first login without cached index) | High (all booking data sent to client browser; passive PII exposure regardless of tamper intent) | Enforce FUNCTION_ONLY for booking_details in TASK-04; or add a separate hardening task to remove full-scan fallback |
| `AuthSessionContext` null/empty if `/api/guest-session` GET fails transiently at GuardedGate | Medium | High (all 26 data hooks return empty uuid, page breaks silently) | Fallback strategy required in Planning Constraints: if context is not populated, fall back to localStorage uuid with error telemetry rather than empty string |

## Planning Constraints & Notes

- Must-follow patterns:
  - Server-mediated auth already uses HttpOnly cookie; uuid cross-check should extend this pattern (e.g., `/api/guest-session` GET response can return `guestUuid` for client to store authoritatively).
  - `FUNCTION_ONLY` is the declared policy in `dataAccessModel.ts` for sensitive flows — hardening should enforce this policy, not invent a new one.
  - All data hooks call `useUuid()` — fix must be backward-compatible or all 26 call sites need updating.
  - `AuthSessionContext` failure-mode constraint: if `AuthSessionContext` is not populated (e.g., transient `/api/guest-session` GET failure at GuardedGate), `useUuid()` must degrade gracefully — fall back to localStorage uuid with error telemetry, not silently return an empty string. An empty string uuid causes all 26 data hooks to silently disable (enabled: `!!uuid` is false) without user-visible feedback.
- Rollout/rollback expectations:
  - Hardening is a security fix — no feature flag needed. Rollback is code revert.
  - If uuid source changes from URL to session-backed, existing bookmarked links (`/?uuid=<id>`) will still work as long as the session is valid and the stored uuid matches.
- Observability expectations:
  - Add an analytics event when uuid from URL does not match uuid from session (mismatch detection).
  - Retain the existing `console.warn` in `guest-booking.ts` for server-side mismatch.

## Suggested Task Seeds (Non-binding)

- TASK-01: Enhance `/api/guest-session` GET to return `guestUuid` in the response body (alongside `expiresAt`)
- TASK-02: Update `validateGuestToken` (client) to return the session payload (uuid) instead of just a status string
- TASK-03: In `GuardedGate`, bind the authenticated uuid to a React context (AuthSessionContext) after session validation
- TASK-04: Rewrite `useUuid` to read from `AuthSessionContext` (server-confirmed uuid) rather than URL/localStorage
- TASK-05: Fix `find-booking` to issue token scoped to `matchedOccupantId` (not `leadOccupantId`)
- TASK-06: Remove stale `prime_guest_token` read from `digital-assistant/page.tsx`
- TASK-07: Clean up stale `token` field from `GuestSessionSnapshot` type and all test mocks
- TASK-08: Add test coverage for uuid tamper, uuid mismatch, and `useUuid` localStorage fallback — **must follow TASK-04** (tests cannot accurately cover hardened uuid behavior until `AuthSessionContext` exists)
- TASK-09: Confirm Firebase RTDB security rules; if open to any API-key connection, file a separate hardening task

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - All guarded-section data hooks source uuid exclusively from the server-validated session context, not from URL query params.
  - `/api/guest-session` GET returns `guestUuid` so the client can bind it authoritatively.
  - `useUuid` no longer accepts URL-supplied uuid that doesn't match the session.
  - Stale `prime_guest_token` reference removed from `digital-assistant/page.tsx`.
  - `GuestSessionSnapshot` type and tests cleaned up.
  - Test coverage added for uuid tamper and mismatch scenarios.
- Post-delivery measurement plan:
  - Zero occurrences of uuid-mismatch analytics events in the 7 days after release (baseline: 0 events pre-release, since the event does not yet exist).
  - No increase in `/error` redirect rate compared to 7-day pre-release baseline (baseline must be captured from analytics before the release ships).

## Evidence Gap Review

### Gaps Addressed

- Full entry-to-data-read path traced end to end (deep link → verification → guarded home → Firebase read).
- Auth mechanism (cookie vs. URL token) fully mapped with server source code.
- Stale `prime_guest_token` references identified and documented.
- Test coverage gaps for uuid tamper scenario explicitly confirmed (zero coverage).
- `find-booking` occupant scoping bug (lead vs. matched occupant) identified.

### Confidence Adjustments

- Implementation confidence raised from initial ~60% to 80% after tracing all 26 `useUuid` call sites.
- Security / privacy risk elevated to High based on `FUNCTION_ONLY` declared vs. actual SDK-direct reads.
- Firebase RTDB rules remain the only structural unknown — this does not block planning but may change urgency.

### Remaining Assumptions

- Firebase RTDB rules are assumed to be open (API-key-only) based on the `FUNCTION_ONLY` declared policy gap. If rules are per-occupant, risk drops to Low.
- The 26 `useUuid` call sites were identified via `grep` — all are within the `apps/prime/src` directory and are data hooks, not route guards.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Deep link entry (`/g/<token>`) | Yes | None | No |
| Guest session API (server) | Yes | None | No |
| Portal/onboarding entry | Yes | None | No |
| Guarded layout auth gate | Yes | None — coverage confirmed that uuid check is absent (this is the finding, not a scope gap) | No |
| `useUuid` hook resolution logic | Yes | None | No |
| Firebase data hooks (26 call sites) | Partial | [Missing domain coverage] [Minor]: Firebase RTDB security rules not inspected (console/Firebase, not in repo) | No — operator question captured |
| find-booking occupant scoping | Yes | None | No |
| Stale localStorage key references | Yes | None | No |
| Test coverage assessment | Yes | None | No |
| Type/interface divergence | Yes | None | No |

## Scope Signal

**Signal: right-sized**

Rationale: The investigation covers the complete auth + uuid resolution chain from entry point to Firebase read. The scope captures the primary security concern (uuid tamper), a secondary correctness bug (lead-guest token scoping), and a cleanup task (stale localStorage reference). Adding Firebase RTDB rule review would expand scope to infrastructure-level work that is not within the codebase and would require separate operator access — correctly classified as an Open question, not a scope expansion.

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: none
- Recommended next step:
  - `/lp-do-analysis prime-portal-personalization`
