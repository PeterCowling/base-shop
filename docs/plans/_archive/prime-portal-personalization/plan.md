---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-portal-personalization
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-011
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/prime-portal-personalization/analysis.md
---

# Prime Portal Personalization Plan

## Summary

The prime guest portal reads the `?uuid=` URL parameter as the Firebase lookup key for all guest data without cross-checking it against the authenticated `prime_session` cookie — enabling any authenticated guest to read another occupant's data by substituting a valid-format `occ_<id>` in the URL. This plan hardens uuid resolution by extending `/api/guest-session` GET to return `guestUuid`, creating an `AuthSessionContext` populated at `GuardedGate`, and rewriting `useUuid` to read from the server-confirmed context first with localStorage fallback. Secondary fixes address a `find-booking` token scoping bug (lead vs. matched occupant), a stale `prime_guest_token` body-token reference in `digital-assistant/page.tsx` that breaks assistant auth, and stale type/mock divergence across tests.

## Active tasks

- [x] TASK-01: Extend `/api/guest-session` GET response to include `guestUuid`
- [x] TASK-02: Update `validateGuestToken` return type + all callers and test mocks
- [x] TASK-03: Create `AuthSessionContext` and populate it in `GuardedGate`
- [x] TASK-04: Rewrite `useUuid` to read from context with localStorage fallback + mismatch telemetry
- [x] TASK-05: Fix `find-booking` to issue token for `matchedOccupantId`
- [x] TASK-06: Fix `digital-assistant` stale token — switch to `prime_session` cookie auth in `/api/assistant-query`
- [x] TASK-07: Clean up stale `GuestSessionSnapshot` type + test mocks for `validateGuestToken` / `readGuestSession`
- [x] TASK-08: Add unit tests for `useUuid` (context, localStorage fallback, null-both, mismatch event)
- [x] TASK-09: Capture pre-release baseline for `/error` redirect rate

## Goals

- Eliminate the `?uuid=` URL tamper vector for guest data access.
- Bind uuid resolution to the server-validated session (`prime_session` cookie path).
- Fix `find-booking` to issue tokens for the matched occupant, not the lead guest.
- Fix `digital-assistant` broken auth caused by stale `prime_guest_token` body token.
- Remove stale `prime_guest_token` localStorage reference.
- Clean up `GuestSessionSnapshot` type divergence and stale test mocks.
- Add test coverage for uuid tamper, mismatch, and localStorage fallback.

## Non-goals

- Rewriting Firebase RTDB security rules (out-of-codebase-scope; operator confirmation needed).
- Staff/pin-auth flows.
- Owner dashboard data access.
- Any UI redesign.
- Addressing `fetchViaFullScan` passive full-scan exposure (separate feature slug needed).

## Constraints & Assumptions

- Constraints:
  - Cloudflare Pages Functions (CF Pages edge) — no server-side React rendering in the data-fetch path; context must be populated client-side after a GET to `/api/guest-session`.
  - 26 `useUuid()` call sites must continue to work after the change; `useUuid()` API surface stays `string` (empty string fallback, not `string | null`, per current return type).
  - `validateGuestToken()` has 4 production callers: `app/page.tsx`, `app/portal/page.tsx`, `app/(guarded)/layout.tsx`, `hooks/useSessionValidation.ts` — all are affected by the return-type change.
  - Stale test mocks for `validateGuestToken` (passing a token param that the current implementation doesn't accept) and `readGuestSession` (expecting a `token` field not in `GuestSessionSnapshot`) must be fixed before TASK-02 merges to avoid CI breakage.
  - `app/page.tsx` (root page, outside `(guarded)/` group) intentionally excluded from `AuthSessionContext` coverage — uses localStorage uuid via `useUuid` fallback. Plan adds a code comment documenting this deliberate exclusion.
- Assumptions:
  - Firebase RTDB rules are assumed open (API-key-only) — this determines whether the fix is urgent vs. defense-in-depth, but does not change what is built.
  - `/api/assistant-query` validates `body.token` using `validateGuestSessionToken()` (CF Functions library, cookie-independent). The fix is to switch it to `prime_session` cookie auth (same pattern as all other CF Functions).
  - `GuestSessionToken` in Firebase includes `guestUuid` for all active sessions (written by `guest-session` POST and `find-booking`).

## Inherited Outcome Contract

- **Why:** Guest portal personalization relies on the `?uuid=` query parameter in a fragile way that could cause data leakage or silent fallback to wrong guest data.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All entry points to the guarded home pass uuid exclusively through the server-validated session; uuid tamper risk is eliminated; no guest can access another guest's data by manipulating the URL parameter.
- **Source:** auto

## Analysis Reference

- Related analysis: `docs/plans/prime-portal-personalization/analysis.md`
- Selected approach inherited: Option A — extend `/api/guest-session` GET to return `guestUuid`, update `validateGuestToken` to return `{status, guestUuid}`, populate `AuthSessionContext` at `GuardedGate`, rewrite `useUuid` to read context first with localStorage fallback.
- Key reasoning used:
  - Minimal blast radius: 26 call sites unchanged; `useUuid()` API surface unchanged.
  - Surgical fix: uuid is sourced from server-validated session, not from URL.
  - Graceful degradation: context null → localStorage fallback → null (hooks already gate on `!!uuid`).
  - Options B/C/D rejected — B is disproportionate, C doesn't fix the security issue, D requires Firebase custom auth.

## Selected Approach Summary

- What was chosen: Server-authoritative uuid via `AuthSessionContext` populated at `GuardedGate`, with localStorage fallback for transient failures and for `app/page.tsx` root-page path.
- Why planning is not reopening option selection: Analysis made the decision decisively. All four alternatives have documented rejection rationale. The only open question (Firebase RTDB rules) is operator-only and does not change what is built.

## Fact-Find Support

- Supporting brief: `docs/plans/prime-portal-personalization/fact-find.md`
- Evidence carried forward:
  - `useUuid.ts` reads URL first, overrides localStorage on every navigation — primary tamper vector.
  - `validateGuestToken()` currently returns a bare `TokenValidationResult` string — no uuid in response.
  - `/api/guest-session` GET currently returns `{status, expiresAt}` only (line 75 of `guest-session.ts`).
  - `GuestSessionToken` in Firebase has `guestUuid: string | null` (line 28 of `guest-session.ts`).
  - `find-booking.ts` issues token for `leadOccupantId` on line 114, not `matchedOccupantId`.
  - `digital-assistant/page.tsx:107` sends `localStorage.getItem('prime_guest_token')` to `/api/assistant-query` — key never written → always `null` → always 400.
  - `/api/assistant-query` validates `body.token ?? null` via `validateGuestSessionToken()` — body-token auth path, not cookie.
  - Stale tests: `guestSessionGuard.test.ts` calls `validateGuestToken('token-123', fetch)` with a token param (no longer accepted); expects `readGuestSession` to return `token` field; `useSessionValidation.test.ts` passes `token: 'token-123'` prop (not in hook interface).

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extend `/api/guest-session` GET to return `guestUuid` | 90% | S | Complete (2026-03-13) | - | TASK-02 |
| TASK-07 | IMPLEMENT | Clean up stale `GuestSessionSnapshot` type + test mocks | 85% | S | Complete (2026-03-13) | - | TASK-02 |
| TASK-05 | IMPLEMENT | Fix `find-booking` token issuance to use `matchedOccupantId` | 90% | S | Complete (2026-03-13) | - | - |
| TASK-09 | IMPLEMENT | Capture pre-release baseline for `/error` redirect rate | 85% | S | Complete (2026-03-13) | - | - |
| TASK-02 | IMPLEMENT | Update `validateGuestToken` return type + all 4 callers | 85% | M | Complete (2026-03-13) | TASK-01, TASK-07 | TASK-03 |
| TASK-06 | IMPLEMENT | Fix `digital-assistant` auth — switch `/api/assistant-query` to cookie auth | 80% | S | Complete (2026-03-13) | - | - |
| TASK-03 | IMPLEMENT | Create `AuthSessionContext` + populate in `GuardedGate` | 85% | M | Complete (2026-03-13) | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Rewrite `useUuid` — context-first, localStorage fallback, mismatch telemetry | 85% | M | Complete (2026-03-13) | TASK-03 | TASK-08 |
| TASK-08 | IMPLEMENT | Add unit tests for `useUuid` (context, fallback, null-both, mismatch) | 80% | M | Complete (2026-03-13) | TASK-04 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — no UI changes | — | No visual changes in this plan |
| UX / states | Context-null degrades to localStorage fallback; no new user-facing state; network error state unchanged | TASK-03, TASK-04 | If context is null AND localStorage is null, `useUuid` returns empty string and hooks remain gated; redirect to `/error` unchanged |
| Security / privacy | uuid sourced from server-validated session; URL param is advisory only; mismatch event emitted | TASK-01, TASK-02, TASK-03, TASK-04 | Eliminates URL tamper vector; Firebase RTDB rules remain open (operator action needed for full enforcement) |
| Logging / observability / audit | Mismatch analytics event in `useUuid`; pre-release baseline captured; `console.warn` in `guest-booking.ts` unchanged | TASK-04, TASK-09 | Mismatch event fires when URL uuid differs from context uuid |
| Testing / validation | TASK-07 fixes stale mocks before TASK-02 return-type change; TASK-08 adds `useUuid` context tests; existing tests updated for new return type | TASK-07, TASK-02, TASK-08 | TASK-07 must merge before or simultaneously with TASK-02 to prevent CI breakage |
| Data / contracts | `/api/guest-session` GET response adds `guestUuid` field; `validateGuestToken` return type changes from string enum to `{status, guestUuid}` | TASK-01, TASK-02 | Additive change; old callers updated in same TASK-02 |
| Performance / reliability | One additional field in GET response — negligible; context blocks children render (populated in `GuardedGate` before `allowed` state); graceful fallback for transient GET failure | TASK-03, TASK-04 | 26 hook call sites unchanged; no new network calls |
| Rollout / rollback | No feature flag; code revert restores prior behavior; bookmarked `/?uuid=<id>` links work via localStorage fallback | All | Simple rollback; no DB migration |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-07, TASK-05, TASK-06, TASK-09 | — | All independent; run in parallel |
| 2 | TASK-02 | TASK-01 done, TASK-07 done | Both Wave 1 tasks must complete first |
| 3 | TASK-03 | TASK-02 done | Creates AuthSessionContext |
| 4 | TASK-04 | TASK-03 done | Rewrites useUuid |
| 5 | TASK-08 | TASK-04 done | Tests for context-based useUuid |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| GuardedGate auth + uuid binding | Guest navigates to any route under `(guarded)/` | (1) `GuardedGate` calls `validateGuestToken()` → now returns `{status, guestUuid}`. (2) On `valid`, stores `guestUuid` in `AuthSessionContext`. (3) Renders children with context populated. (4) `useUuid()` in any child reads context uuid. (5) On transient failure (`network_error`), context is null — `useUuid` falls back to localStorage. (6) 30-min `useSessionValidation` interval unchanged. | TASK-01 → TASK-02 → TASK-03 → TASK-04 | Context-population race: must ensure context is stored before `gateState='allowed'` triggers child render; TASK-03 execution plan must address this ordering. |
| uuid resolution in data hooks | Any guarded-section component mounts | `useUuid()` reads `AuthSessionContext` first (server-confirmed). Falls back to `localStorage['prime_guest_uuid']` if context absent. URL `?uuid` param is advisory only; if it differs from context uuid, mismatch event emitted and context uuid wins. | TASK-03, TASK-04 | `app/page.tsx` root page: intentionally excluded from context — uses localStorage path. Code comment added. |
| find-booking token issuance | Guest submits surname + bookingRef at `/find-my-stay` | Token issued for `matchedOccupantId` (not `leadOccupantId`). Non-lead guests get session scoped to their own uuid. | TASK-05 | Single-occupant bookings: behavior identical (matched = lead). |
| Digital assistant auth | Guest submits query in `/digital-assistant` | `digital-assistant/page.tsx` removes `prime_guest_token` body field; sends query without token body field. `/api/assistant-query` validates via `prime_session` cookie (same pattern as `/api/guest-session`). | TASK-06 | `/api/assistant-query` must be updated to use cookie-based `validateGuestSessionToken` helper (or inline cookie parse). |
| Type / test cleanup | — | `GuestSessionSnapshot` type does not include `token` field. Tests for `readGuestSession` expect no `token` in snapshot. `validateGuestToken` mock shape updated to return `{status, guestUuid}`. `useSessionValidation` tests drop stale `token` prop. | TASK-07, TASK-02 | Must complete before TASK-02 merges to avoid CI failure window. |

## Tasks

### TASK-01: Extend `/api/guest-session` GET response to include `guestUuid`

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/prime/functions/api/guest-session.ts` — GET handler returns `{status, expiresAt, guestUuid}`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/prime/functions/api/guest-session.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% — One-line change: `jsonResponse({ status: 'ok', expiresAt: session.expiresAt, guestUuid: session.guestUuid })`. `session.guestUuid` is already on `GuestSessionToken` (verified: line 28 of `guest-session.ts`). Held-back test: could `session.guestUuid` be `null` for some tokens? Yes — the field is `string | null`. The response will correctly return `null` in that case; TASK-03 must handle null gracefully (fall back to localStorage).
  - Approach: 95% — Additive; backward-compatible. Consumers that ignore the new field are unaffected.
  - Impact: 85% — This is the foundation change; without it, context cannot be populated from the server.
- **Acceptance:**
  - [ ] GET `/api/guest-session` with a valid `prime_session` cookie returns `{status: 'ok', expiresAt: ..., guestUuid: 'occ_...' | null}`.
  - [ ] GET with an expired or missing token still returns the existing 410/401 responses (unchanged).
  - [ ] TypeScript compiles without errors.
- **Engineering Coverage:**
  - UI / visual: N/A — server-only change
  - UX / states: N/A — no user-facing state change
  - Security / privacy: Required — `guestUuid` is only returned for a valid, non-expired session (same guard as `expiresAt`)
  - Logging / observability / audit: N/A — no new logging needed for this field
  - Testing / validation: Required — add/update unit test for GET handler to assert `guestUuid` is present in response
  - Data / contracts: Required — response type extends from `{status, expiresAt}` to `{status, expiresAt, guestUuid}`
  - Performance / reliability: N/A — one additional string field in response
  - Rollout / rollback: N/A — additive field; revert is a one-line change
- **Validation contract (TC-01):**
  - TC-01: GET with valid `prime_session` cookie → response body includes `guestUuid: 'occ_<13 digits>'` matching the session's stored value.
  - TC-02: GET with valid session where `session.guestUuid` is `null` → response body includes `guestUuid: null`.
  - TC-03: GET with expired token → 410 response; no `guestUuid` in body.
- **Execution plan:** Red → Green → Refactor
  - Red: Write unit test asserting GET response includes `guestUuid` field (currently absent).
  - Green: Change `jsonResponse({ status: 'ok', expiresAt: session.expiresAt })` on line 75 to `jsonResponse({ status: 'ok', expiresAt: session.expiresAt, guestUuid: session.guestUuid ?? null })`.
  - Refactor: Verify TypeScript types for the response shape are explicit (add an interface `GuestSessionGetResponse` if not present).
- **Planning validation (required for M/L):** S effort — not required.
- **Scouts:** `session.guestUuid` confirmed as `string | null` on `GuestSessionToken` interface (line 28 of `guest-session.ts`). All active tokens written by `guest-session.ts` POST and `find-booking.ts` include this field.
- **Edge Cases & Hardening:** `guestUuid` may be `null` for legacy tokens created before the field was added. Context consumer (TASK-03) must handle null and fall back to localStorage. No migration of existing tokens needed — null is an acceptable value.
- **What would make this >=90%:** Already at 90%; the only uncertainty is `null` guestUuid for legacy tokens, but this is handled by TASK-03 graceful fallback.
- **Rollout / rollback:**
  - Rollout: Deploy as part of the feature branch; no staged rollout needed.
  - Rollback: Revert the one-line change to `jsonResponse(...)`.
- **Documentation impact:** None — internal API; no public docs.
- **Notes / references:** `apps/prime/functions/api/guest-session.ts` line 75 is the exact change location.

---

### TASK-07: Clean up stale `GuestSessionSnapshot` type + test mocks

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/prime/src/lib/auth/__tests__/guestSessionGuard.test.ts`, `apps/prime/src/hooks/__tests__/useSessionValidation.test.ts`, and any other test file with stale `token` mock field or `token` parameter on `validateGuestToken`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/prime/src/lib/auth/__tests__/guestSessionGuard.test.ts`, `apps/prime/src/hooks/__tests__/useSessionValidation.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 85% — Current stale patterns are concrete and located: `guestSessionGuard.test.ts` calls `validateGuestToken('token-123', fetch)` (token param not accepted by current implementation), expects `readGuestSession` to return a `token` field (not in current `GuestSessionSnapshot`), and calls `clearGuestSession` expecting 5 `removeItem` calls (but only 4 keys in `PRIME_GUEST_SESSION_KEYS`). `useSessionValidation.test.ts` passes `token: 'token-123'` prop (not in hook interface). Fixes are mechanical. Cap at 85 because a full grep for other stale references is needed before declaring complete.
  - Approach: 90% — The fix is straightforward: remove stale fields from test mocks and test call signatures.
  - Impact: 90% — Prevents CI breakage when TASK-02 changes the return type of `validateGuestToken`.
- **Acceptance:**
  - [ ] `guestSessionGuard.test.ts`: `readGuestSession` test no longer asserts a `token` field in the snapshot result.
  - [ ] `guestSessionGuard.test.ts`: `clearGuestSession` test asserts exactly 4 `removeItem` calls (not 5).
  - [ ] `guestSessionGuard.test.ts`: `validateGuestToken` is called with `fetchImpl` only (no token param).
  - [ ] `useSessionValidation.test.ts`: no `token` prop passed to `useSessionValidation` hook.
  - [ ] TypeScript compiles without errors on affected test files.
  - [ ] All existing test assertions that are semantically valid still pass.
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — this task IS the test cleanup
  - Data / contracts: Required — removes stale `token` field from test mock of `GuestSessionSnapshot`
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — test-only change
- **Validation contract (TC-07):**
  - TC-07-01: `guestSessionGuard.test.ts` passes (no TS errors, no test failures).
  - TC-07-02: `useSessionValidation.test.ts` passes (no TS errors, no test failures).
  - TC-07-03: `grep -r "prime_guest_token" apps/prime/src` finds only `digital-assistant/page.tsx` (the live bug, addressed in TASK-06) — no remaining stale references in non-TASK-06-scope files.
- **Execution plan:** Red → Green → Refactor
  - Red: Run `tsc` on affected test files — confirm TS errors from stale `token` field and param.
  - Green: Remove `token: ' token-123 '` from `getItem` mock and from `session` expected object in `guestSessionGuard.test.ts`. Update `clearGuestSession` assertion from 5 to 4 calls. Remove token-param from `validateGuestToken` calls. Remove `token: 'token-123'` prop from `useSessionValidation` render hooks.
  - Refactor: Run `grep -r "prime_guest_token" apps/prime/src` to confirm no remaining stale refs outside TASK-06 scope.
- **Planning validation (required for M/L):** S effort — not required.
- **Scouts:** Confirmed stale patterns located in exactly 2 test files. Full grep run during planning confirms no other test files mock `validateGuestToken` with a token parameter.
- **Edge Cases & Hardening:** After removing the `token` field from the `readGuestSession` mock, the `buildGuestHomeUrl` assertion in the same test still works (it uses `session.uuid`, not `session.token`).
- **What would make this >=90%:** Running tsc locally to confirm exact error list before fixing. Currently capped at 85 due to possible additional stale references not yet confirmed by exhaustive grep.
- **Rollout / rollback:** Test-only change; rollback is trivially reverting the test edits.
- **Documentation impact:** None.
- **Notes / references:** `guestSessionGuard.test.ts` line 20 (`prime_guest_token` mock key), line 31 (stale `token` field in expected snapshot), line 48 (5-call clearGuestSession assertion), line 57-60 (token param on validateGuestToken). `useSessionValidation.test.ts` lines 28, 50, 67 (stale `token` prop).

---

### TASK-05: Fix `find-booking` token issuance to use `matchedOccupantId`

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/prime/functions/api/find-booking.ts` — token issued for `matchedOccupantId` (not `leadOccupantId`).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/prime/functions/api/find-booking.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — The bug is on line 114: `guestUuid: leadOccupantId` should be `guestUuid: matchedOccupantId`. The `matchedOccupantId` variable is already available at line 90. The `computeTokenExpiry` call currently uses `leadOccupant?.checkOutDate` — this must also be updated to use `booking[matchedOccupantId]?.checkOutDate`.
  - Approach: 90% — Correct the token to be scoped to the matched occupant; single-occupant bookings are unaffected (matched = lead).
  - Impact: 85% — Non-lead guests currently get a session scoped to the lead's uuid. After this fix, they get their own session. Behavioral change is intentional and correct.
- **Acceptance:**
  - [ ] When a non-lead occupant's surname matches, the issued token's `guestUuid` equals `matchedOccupantId` (not `leadOccupantId`).
  - [ ] When the lead guest's surname matches, behavior is identical (matched = lead → unchanged).
  - [ ] Token expiry uses the matched occupant's `checkOutDate` (not the lead's).
  - [ ] TypeScript compiles without errors.
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: Required — non-lead guests now see their own personalization; regression risk if test for single-occupant is absent
  - Security / privacy: Required — this fix closes a data-routing bug (non-lead gets lead's data)
  - Logging / observability / audit: N/A
  - Testing / validation: Required — add test asserting non-lead match → `guestUuid` = `matchedOccupantId`
  - Data / contracts: Required — `GuestSessionToken.guestUuid` is now the matched occupant, not the lead
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — simple code change; rollback is code revert
- **Validation contract (TC-05):**
  - TC-05-01: Non-lead occupant's surname matched → token `guestUuid` === `matchedOccupantId`.
  - TC-05-02: Lead occupant's surname matched → token `guestUuid` === lead's id (same as current behavior).
  - TC-05-03: Token `expiresAt` uses matched occupant's `checkOutDate`.
- **Execution plan:** Red → Green → Refactor
  - Red: Add test for non-lead match asserting `guestUuid === matchedOccupantId`.
  - Green: Change line 114 from `guestUuid: leadOccupantId` to `guestUuid: matchedOccupantId`. Update `computeTokenExpiry` call to use `booking[matchedOccupantId]?.checkOutDate`.
  - Refactor: Remove the now-unused `leadOccupant` const (line 107) unless it is used elsewhere in the function.
- **Planning validation (required for M/L):** S effort — not required.
- **Scouts:** `matchedOccupantId` is guaranteed non-null at the point of token issuance (the function returns 404 if null at line 99). `computeTokenExpiry` exists in `../lib/guest-token` — confirmed at line 9 of `find-booking.ts`.
- **Edge Cases & Hardening:** Single-occupant bookings: `matchedOccupantId === leadOccupantId` → behavior unchanged. Multi-occupant where matched guest has no `checkOutDate`: `computeTokenExpiry` receives `''` or `undefined`; verify it handles this gracefully (same as current lead-guest path).
- **What would make this >=90%:** Verifying `computeTokenExpiry` handles `undefined` checkOutDate gracefully (same risk exists on the current lead-guest path, so not a new regression).
- **Rollout / rollback:** Deploy as part of feature branch. Rollback: revert lines 107/114.
- **Documentation impact:** None.
- **Notes / references:** `find-booking.ts` line 107 (`const leadOccupant`), line 114 (`guestUuid: leadOccupantId`), line 116 (`computeTokenExpiry(leadOccupant?.checkOutDate...)`).

---

### TASK-09: Capture pre-release baseline for `/error` redirect rate

- **Type:** IMPLEMENT
- **Deliverable:** Baseline measurement note in `docs/plans/prime-portal-personalization/plan.md` Decision Log (or a separate `baseline.md` artifact) documenting the current `/error` redirect rate from `useUuid`. Required before TASK-04 ships.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/prime-portal-personalization/` (baseline record only)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — Requires reading analytics/observability data for `/error` redirect events. Source is `logger.error` calls in `useUuid.ts` — check if these are captured by the client error logger (Sentry or equivalent) or a custom analytics event. If no analytics for `/error` redirects exist, the baseline is "no existing measurement" and TASK-04 adds the first instrumentation.
  - Approach: 90% — Baseline capture is a non-code artifact; the important thing is that it exists before TASK-04 ships.
  - Impact: 85% — Without a baseline, the post-ship measurement cannot confirm whether the change reduced or increased `/error` redirects.
- **Acceptance:**
  - [ ] A baseline note is recorded (either in Decision Log or a `baseline.md` artifact).
  - [ ] The note states either: (a) current `/error` redirect rate from `useUuid` (if measurable), or (b) "no existing measurement — TASK-04 instrumentation establishes the baseline."
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: Required — this task establishes the observability baseline
  - Testing / validation: N/A
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: N/A
- **Validation contract (TC-09):**
  - TC-09-01: Baseline note exists in plan Decision Log before TASK-04 ships.
- **Execution plan:** Red → Green → Refactor
  - Red: None — this is an informational capture task.
  - Green: Query error logger / analytics for `/error` redirect events from `useUuid`. Record result in Decision Log.
  - Refactor: None.
- **Planning validation (required for M/L):** S effort — not required.
- **Scouts:** `useUuid.ts` calls `logger.error(...)` before `router.replace('/error')`. Whether these events are captured depends on the `@acme/lib/logger/client` implementation.
- **Edge Cases & Hardening:** If no measurement exists, document that and proceed — TASK-04 adds the first instrumentation.
- **What would make this >=90%:** Confirming the client logger sends events to an observable sink (Sentry, GA4, etc.).
- **Rollout / rollback:** N/A — documentation artifact.
- **Documentation impact:** Produces a baseline note in the Decision Log.
- **Notes / references:** `apps/prime/src/hooks/useUuid.ts` lines 59-63 and 72-76 (logger.error calls before /error redirects).

---

### TASK-02: Update `validateGuestToken` return type + all 4 callers

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/prime/src/lib/auth/guestSessionGuard.ts` (`validateGuestToken` returns `{status: TokenValidationResult, guestUuid: string | null}`); updated callers: `app/page.tsx`, `app/portal/page.tsx`, `app/(guarded)/layout.tsx`, `hooks/useSessionValidation.ts`; updated tests.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/prime/src/lib/auth/guestSessionGuard.ts`, `apps/prime/src/app/page.tsx`, `apps/prime/src/app/portal/page.tsx`, `apps/prime/src/app/(guarded)/layout.tsx`, `apps/prime/src/hooks/useSessionValidation.ts`
- **Depends on:** TASK-01, TASK-07
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% — All 4 callers are identified and located. The return type change is straightforward: parse the JSON response to extract `guestUuid`. Cap at 85: the caller update for `useSessionValidation` needs care — the hook currently does not store the result (only checks for `expired`/`invalid`); after this change, it does not need to consume `guestUuid`, but the TypeScript type must align. Held-back test: does any caller destructure `validateGuestToken()` result as a string (e.g., `if (result === 'valid')`)? Yes — all 4 callers do. These must be updated to `if (result.status === 'valid')`.
  - Approach: 90% — Additive change; existing string union becomes a sub-field `result.status`. `TokenValidationResult` type is preserved.
  - Impact: 80% — All callers must be updated atomically with the return type change to avoid TypeScript errors. Held-back test: if any caller is missed, TypeScript will error and CI will fail. Confident this is 80 because the grep confirmed exactly 4 production callers and the test mocks were cleaned in TASK-07.
- **Acceptance:**
  - [ ] `validateGuestToken()` returns `Promise<{status: TokenValidationResult, guestUuid: string | null}>`.
  - [ ] All 4 production callers updated: string-comparison `result === 'valid'` becomes `result.status === 'valid'` (and equivalent for `'expired'`, `'invalid'`, `'network_error'`).
  - [ ] `GuardedGate` (layout.tsx) stores `result.guestUuid` in a local variable for use in TASK-03.
  - [ ] `useSessionValidation` does not need `guestUuid`; it only checks `status`; type compiles.
  - [ ] TypeScript compiles without errors on all affected files.
  - [ ] All pre-existing tests for these callers pass (mocks already updated in TASK-07).
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A — no user-visible change; gate behavior identical
  - Security / privacy: N/A — `guestUuid` is now available in the response; TASK-03 uses it
  - Logging / observability / audit: N/A
  - Testing / validation: Required — all mocks in TASK-07 must reflect the new return shape; integration tests for `layout.test.tsx` and `portal/__tests__/page.test.tsx` must pass
  - Data / contracts: Required — `TokenValidationResult` kept as `status` sub-field; new `guestUuid` field added
  - Performance / reliability: N/A — one additional field parsed from GET response
  - Rollout / rollback: N/A — code revert
- **Validation contract (TC-02):**
  - TC-02-01: `validateGuestToken()` with 200 response → `{status: 'valid', guestUuid: 'occ_...'}`.
  - TC-02-02: `validateGuestToken()` with 410 response → `{status: 'expired', guestUuid: null}`.
  - TC-02-03: `validateGuestToken()` with 401 response → `{status: 'invalid', guestUuid: null}`.
  - TC-02-04: `validateGuestToken()` with network error → `{status: 'network_error', guestUuid: null}`.
  - TC-02-05: `layout.tsx` GuardedGate calls `validateGuestToken()` and correctly branches on `result.status`.
- **Execution plan:** Red → Green → Refactor
  - Red: Update `guestSessionGuard.test.ts` mock expectations to return `{status: ..., guestUuid: ...}` shape (TASK-07 cleaned up the stale token param; this task updates the return shape in test mocks).
  - Green: Update `validateGuestToken` to: (1) parse response JSON (`await response.json()`) on 200, (2) return `{status: 'valid', guestUuid: data.guestUuid ?? null}`. For non-200 responses: return `{status: ..., guestUuid: null}`. Update all 4 callers to use `result.status` instead of direct string comparison.
  - Refactor: Introduce a `GuestTokenValidationResult` interface (or type alias) so the new return type is named and importable.
- **Planning validation (required for M/L):**
  - Checks run: Grep confirmed 4 production callers (no others). All callers only check `result === 'valid'`, `'expired'`, `'invalid'`, `'network_error'` — all use string-equality comparisons.
  - Validation artifacts: `apps/prime/src/app/page.tsx:25`, `apps/prime/src/app/portal/page.tsx` (validateGuestToken call), `apps/prime/src/app/(guarded)/layout.tsx:46`, `apps/prime/src/hooks/useSessionValidation.ts:34`.
  - Unexpected findings: `useSessionValidation` hook does NOT store the return value — only checks for `expired`/`invalid` to call back. It does not need `guestUuid`; however, the type must still be updated or TypeScript will error if the mock returns the new shape but the hook's typed usage of the old string-return is strict. Verify the hook uses `const result = await validateGuestToken(); if (result === 'expired')` — must change to `result.status`.

**Consumer tracing:**
  - New output: `guestUuid: string | null` on `validateGuestToken` return.
  - Consumers: `GuardedGate` in `layout.tsx` (stores for TASK-03). `app/page.tsx` does NOT use `guestUuid` (root page uses localStorage path). `portal/page.tsx` does NOT use `guestUuid` (redirects to `/?uuid=` from localStorage). `useSessionValidation` does NOT use `guestUuid`.
  - All non-consuming callers are explicitly safe: they ignore the new field. No silent-fallback risk.

- **Scouts:** `validateGuestToken` implementation confirmed at `guestSessionGuard.ts:47-70`. Returns bare `TokenValidationResult` string. GET response is currently `{status, expiresAt}` — after TASK-01, it is `{status, expiresAt, guestUuid}`.
- **Edge Cases & Hardening:** If the GET response body is not valid JSON (malformed response), `response.json()` throws — must be caught and return `{status: 'network_error', guestUuid: null}`. Current implementation uses a `try/catch` that covers this case.
- **What would make this >=90%:** Running a full tsc compile on the branch after all 4 callers are updated.
- **Rollout / rollback:** Code revert restores old string-return behavior.
- **Documentation impact:** None — internal function; no public API.
- **Notes / references:** All 4 production callers identified and located in planning validation above.

---

### TASK-06: Fix `digital-assistant` auth — switch `/api/assistant-query` to cookie auth

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/prime/functions/api/assistant-query.ts` (validate via `prime_session` cookie, not body token); updated `apps/prime/src/app/(guarded)/digital-assistant/page.tsx` (remove `prime_guest_token` body field).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/prime/functions/api/assistant-query.ts`, `apps/prime/src/app/(guarded)/digital-assistant/page.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — `/api/assistant-query` currently calls `validateGuestSessionToken(body.token ?? null, env)` from `../lib/guest-session`. The fix is to switch to cookie-based validation: parse `prime_session` from `request.headers.get('Cookie')` (same pattern as `guest-session.ts:55-57`) then call `validateGuestSessionToken(token, env)`. `digital-assistant/page.tsx` removes `token: localStorage.getItem('prime_guest_token')` from the request body. Cap at 80: need to confirm `validateGuestSessionToken` in `functions/lib/guest-session.ts` is compatible with cookie-sourced tokens (it is — it validates any token string against Firebase, regardless of source).
  - Approach: 85% — The `prime_session` cookie value IS the token. The existing `validateGuestSessionToken` function accepts a `string | null` — cookie value is the right input.
  - Impact: 75% — Currently the assistant is silently broken (always gets 400 because body token is null). After this fix, auth will use the same `prime_session` cookie as all other endpoints. Risk: if a guest somehow has a valid session cookie but no `guestUuid` in their session (null), the assistant returns 422 (existing guard at line 133 of `assistant-query.ts`). This is the correct behavior.
- **Acceptance:**
  - [ ] POST `/api/assistant-query` with a valid `prime_session` cookie and no `token` body field → authenticates successfully and queries the assistant.
  - [ ] POST without a valid cookie → 401 or appropriate error (not 400 for missing body token).
  - [ ] `digital-assistant/page.tsx` no longer reads `localStorage.getItem('prime_guest_token')`.
  - [ ] TypeScript compiles without errors.
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: Required — assistant was silently broken; now it works. Test with a valid session.
  - Security / privacy: Required — remove body-token auth path; cookie-only is more secure (HttpOnly cookie not accessible to JS)
  - Logging / observability / audit: N/A
  - Testing / validation: Required — add/update CF Function test for `assistant-query` asserting cookie-based auth works
  - Data / contracts: Required — `AssistantQueryBody` no longer requires `token` field
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — code revert
- **Validation contract (TC-06):**
  - TC-06-01: POST with valid `prime_session` cookie → assistant query succeeds (200 or 429 rate-limited).
  - TC-06-02: POST with no cookie and no body token → 401 (not 400).
  - TC-06-03: `digital-assistant/page.tsx` does not contain `prime_guest_token` string.
- **Execution plan:** Red → Green → Refactor
  - Red: Write test asserting cookie-based auth on `assistant-query`.
  - Green: In `assistant-query.ts`, add cookie parser (reuse the `parseCookie` pattern from `guest-session.ts`) to extract `prime_session` from `request.headers.get('Cookie')`. Pass to `validateGuestSessionToken(cookieToken, env)`. Remove `body.token` usage. In `digital-assistant/page.tsx`, remove `token: localStorage.getItem('prime_guest_token')` from the POST body.
  - Refactor: Remove `token?` from `AssistantQueryBody` interface in `assistant-query.ts`.
- **Planning validation (required for M/L):** S effort — not required.
- **Scouts:** `validateGuestSessionToken` confirmed in `functions/lib/guest-session.ts` — validates a token string against Firebase `guestSessionsByToken/`. Cookie value is the raw token string — same format as what `find-booking` writes. Confirmed `parseCookie` already exists in `guest-session.ts` as a local function — can be moved to `functions/lib/` or duplicated (duplication is acceptable for S-effort CF Functions).
- **Edge Cases & Hardening:** If request has no `Cookie` header, `parseCookie` returns `null`. Do NOT pass null to `validateGuestSessionToken` — instead, add an explicit guard before calling it: `if (!cookieToken) return errorResponse('Unauthorized', 401)`. This returns 401 (Unauthorized) rather than the 400 "token is required" that `validateGuestSessionToken(null)` would return. TC-06-02 asserts 401 for this case.
- **What would make this >=90%:** Confirming there are no other body-token consumers of `assistant-query` (e.g., a mobile wrapper or legacy client that sets `body.token` explicitly).
- **Rollout / rollback:** Code revert. Note: assistant was already broken before this fix; rollback restores the broken state.
- **Documentation impact:** None.
- **Notes / references:** `assistant-query.ts:26-29` (AssistantQueryBody interface), `:127` (validateGuestSessionToken call), `digital-assistant/page.tsx:107` (stale localStorage read).

---

### TASK-03: Create `AuthSessionContext` + populate in `GuardedGate`

- **Type:** IMPLEMENT
- **Deliverable:** New `apps/prime/src/contexts/auth/AuthSessionContext.tsx`; updated `apps/prime/src/app/(guarded)/layout.tsx` (`GuardedGate` stores `guestUuid` from `validateGuestToken` result in context).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/prime/src/app/(guarded)/layout.tsx`, new `apps/prime/src/contexts/auth/AuthSessionContext.tsx`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% — Standard React context pattern. New file creates context with `guestUuid: string | null`. `GuardedGate` state must be extended: after `validateGuestToken()` returns `{status: 'valid', guestUuid}`, store `guestUuid` in context state before setting `gateState='allowed'`. Context provider wraps `{children}` in the `GuardedGate` return. Key ordering constraint: context must be populated before `gateState='allowed'` is set (otherwise children mount before context is ready). Cap at 85: the exact state update ordering (context set then gate-state set) requires careful implementation to avoid a render where children see null context.
  - Approach: 90% — Standard React context; well-understood pattern in this codebase (other contexts exist: `ChatProvider`, `PinAuthProvider`).
  - Impact: 80% — Context is the foundation for TASK-04. If context population ordering is wrong, TASK-04's `useUuid` will fall back to localStorage on first render (acceptable but means tamper vector survives first render). Held-back test: what if `guestUuid` is `null` even for a valid session? Context stores `null` — TASK-04 must handle this by falling back to localStorage.
- **Acceptance:**
  - [ ] `AuthSessionContext` exports `guestUuid: string | null` and a `useAuthSession()` hook.
  - [ ] `GuardedGate` populates context with `guestUuid` from `validateGuestToken` result before rendering children.
  - [ ] On `network_error`, context `guestUuid` is `null` (children fall back to localStorage via TASK-04).
  - [ ] On `isAuthenticated` (staff/pin path), context `guestUuid` is `null` (pin-auth path does not use uuid).
  - [ ] TypeScript compiles without errors.
  - [ ] Existing `layout.test.tsx` tests pass.
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: Required — on transient failure (network_error), context is null; children degrade via localStorage fallback (TASK-04); no visible UX change
  - Security / privacy: Required — context is the authoritative uuid source; populated only from server-validated session
  - Logging / observability / audit: N/A
  - Testing / validation: Required — add test asserting context is populated with correct `guestUuid` after GuardedGate allows
  - Data / contracts: Required — `AuthSessionContext` interface: `{ guestUuid: string | null }`
  - Performance / reliability: Required — context must be set before children render; use React state update ordering (single state object or batched `useState` calls)
  - Rollout / rollback: N/A — code revert
- **Validation contract (TC-03):**
  - TC-03-01: GuardedGate with valid session → context `guestUuid` is `'occ_<id>'` when children render.
  - TC-03-02: GuardedGate with network_error → context `guestUuid` is `null` when children render.
  - TC-03-03: GuardedGate with isAuthenticated (pin/staff) → context `guestUuid` is `null` (pin path does not set uuid).
  - TC-03-04: `useAuthSession()` outside `AuthSessionContext.Provider` returns `{ guestUuid: null }` (safe default).
- **Execution plan:** Red → Green → Refactor
  - Red: Write test asserting `GuardedGate` provides non-null `guestUuid` via context when `validateGuestToken` returns `{status: 'valid', guestUuid: 'occ_test'}`.
  - Green: Create `AuthSessionContext.tsx` with `createContext<{guestUuid: string | null}>({guestUuid: null})`. Export `useAuthSession` hook. Update `GuardedGate`: add `const [sessionUuid, setSessionUuid] = useState<string | null>(null)`. In `resolveAccess`, after `validation.status === 'valid'`, call `setSessionUuid(validation.guestUuid)` then `setGateState('allowed')`. In React 18, multiple `setState` calls in an async `useEffect` callback are automatically batched (React 18 automatic batching applies to async event handlers and promises — no `startTransition` or `flushSync` required). Both state values will be set in the same batch, preventing an intermediate render with `sessionUuid` set but `gateState` still `'checking'`. TC-03-01 must assert children see non-null context when gateState is 'allowed'. Wrap `{children}` return with `<AuthSessionContext.Provider value={{guestUuid: sessionUuid}}>`.
  - Refactor: Confirm context file is co-located with other contexts (`apps/prime/src/contexts/`); export from an index if one exists.
- **Planning validation (required for M/L):**
  - Checks run: Existing contexts confirmed at `apps/prime/src/contexts/messaging/` — `ChatProvider.tsx`, `PinAuthProvider.tsx`. Pattern established. `GuardedGate` state is managed via `useState<GateState>` — adding `useState<string | null>` is consistent.
  - Validation artifacts: `apps/prime/src/app/(guarded)/layout.tsx` lines 22-23 (state declarations), lines 37-53 (resolveAccess), line 103 (children render).
  - Unexpected findings: `GuardedGate` sets `gateState='allowed'` in two places: (1) `isAuthenticated` branch (line 40-42), (2) `validation === 'valid'` branch (line 51-53). The `isAuthenticated` path does NOT go through `validateGuestToken` — it skips to `allowed` immediately. This path will have `sessionUuid = null`. TASK-04 must handle this: when `isAuthenticated`, uuid comes from localStorage (pin-auth users don't have a guest uuid anyway).

**Consumer tracing:**
  - New output: `AuthSessionContext` with `guestUuid: string | null`.
  - Consumers: `useUuid` (TASK-04). No other consumer planned.
  - All other components do not read `AuthSessionContext` — safe.

- **Scouts:** React batched state updates: in React 18+, multiple `setState` calls in an async function are batched by default (using `startTransition` or automatic batching). Setting `setSessionUuid` then `setGateState` in the same microtask should result in a single render with both values set. Verify React version in `apps/prime/package.json` is 18+.
- **Edge Cases & Hardening:** If `validation.guestUuid` is `null` (valid session but no uuid on token), context stores `null` — TASK-04 falls back to localStorage. This is correct behavior (legacy tokens or edge case).
- **What would make this >=90%:** Verifying React 18+ batching behavior with a test that confirms children do not see a null-context intermediate render (i.e., context and gate-state are both set before any child renders).
- **Rollout / rollback:** New file created; rollback removes the file and reverts `layout.tsx`.
- **Documentation impact:** None.
- **Notes / references:** `apps/prime/src/app/(guarded)/layout.tsx` lines 36-68 (resolveAccess). React 18 automatic batching: https://react.dev/blog/2022/03/29/react-v18#new-feature-automatic-batching.

---

### TASK-04: Rewrite `useUuid` — context-first, localStorage fallback, mismatch telemetry

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/prime/src/hooks/useUuid.ts` — reads `AuthSessionContext` first, falls back to `localStorage['prime_guest_uuid']`, emits mismatch telemetry when URL uuid differs from context uuid, removes URL-as-primary-source behavior.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/prime/src/hooks/useUuid.ts`
- **Depends on:** TASK-03
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 85% — Current `useUuid` has one complexity: it returns `string` (not `string | null`) — the callers expect an empty string `''` when no uuid is available. The new implementation must preserve this: return `''` when context is null AND localStorage is null. Cap at 85: the current implementation uses `useRouter` and `useSearchParams` — the new implementation still needs `useSearchParams` to read the URL uuid for mismatch detection, but must NOT use it as the primary source. Dependency array changes.
  - Approach: 85% — Reading from context first is correct. The mismatch event logic is clear. URL uuid is still read for: (1) mismatch detection, (2) initial route validation (the URL sets context when arriving via deep link — but wait: the URL uuid is set by `portal/page.tsx` calling `buildGuestHomeUrl(session)` which uses localStorage uuid, so URL and context should match; mismatch indicates substitution).
  - Impact: 80% — 26 call sites depend on `useUuid()`. Held-back test: what if context is null on first render and localStorage is also empty (mid-session navigation)? Current behavior: redirect to `/error`. New behavior should be identical for the null-both case. Must confirm this. If any call site breaks due to changed hook behavior, this is critical.
- **Acceptance:**
  - [ ] `useUuid()` returns context uuid when `AuthSessionContext.guestUuid` is non-null and valid format.
  - [ ] When context is null, falls back to `localStorage['prime_guest_uuid']`.
  - [ ] When both context and localStorage are null/empty, returns `''` and logs redirect to `/error` (same as current behavior).
  - [ ] When URL uuid differs from context uuid, emits a mismatch analytics event and uses context uuid (ignores URL).
  - [ ] All 26 existing call sites unchanged (API surface: `useUuid(): string`).
  - [ ] TypeScript compiles without errors.
  - [ ] `app/page.tsx` path: context is null → falls back to localStorage → returns stored uuid correctly.
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: Required — null-both case still redirects to `/error`; no new error state for guests
  - Security / privacy: Required — URL uuid no longer overrides context; tamper vector eliminated
  - Logging / observability / audit: Required — mismatch analytics event emitted via `logger` when URL uuid ≠ context uuid
  - Testing / validation: Required — TASK-08 covers this (ordered dependency)
  - Data / contracts: N/A — hook return type unchanged (`string`)
  - Performance / reliability: Required — context read is synchronous (no await); localStorage fallback is synchronous; no new network calls
  - Rollout / rollback: N/A — code revert
- **Validation contract (TC-04):**
  - TC-04-01: Context has `guestUuid: 'occ_1234567890123'` → `useUuid()` returns `'occ_1234567890123'`.
  - TC-04-02: Context is null, localStorage has `'occ_1234567890123'` → `useUuid()` returns `'occ_1234567890123'`.
  - TC-04-03: Context is null, localStorage is null → `useUuid()` returns `''` and triggers `/error` redirect.
  - TC-04-04: URL has `?uuid=occ_9999999999999`, context has `occ_1234567890123` → returns `occ_1234567890123` + emits mismatch event.
  - TC-04-05: URL has no uuid param → no mismatch event; context uuid returned normally.
- **Execution plan:** Red → Green → Refactor
  - Red: Write tests for TC-04-01 through TC-04-05 (TASK-08 formalizes these; at least stubs/todos added here).
  - Green: Rewrite `useUuid`: (1) Read `useAuthSession()` from `AuthSessionContext`. (2) In `useEffect`, resolve uuid: try context first, then localStorage. (3) If URL uuid present and differs from resolved uuid, emit mismatch event. Use `recordActivationFunnelEvent` (the pattern used in `digital-assistant/page.tsx:127` and elsewhere in the prime app) rather than bare `logger.warn` — this ensures the event reaches an observable analytics sink (not console-only). Event type: `'security_uuid_mismatch'` or equivalent. (4) If resolved uuid is valid format, `setUuid(resolved)`. (5) If no resolved uuid, `logger.error(...)` + `router.replace('/error')`. (6) Remove `searchParams` from primary source; keep it only for mismatch detection. (7) Return `uuid` (string, default `''`).
  - Refactor: Clean up old `uuidFromURL` variable naming — rename to `urlUuid` for clarity; confirm `recordActivationFunnelEvent` import path is available in `useUuid.ts` context.
- **Planning validation (required for M/L):**
  - Checks run: All 26 call sites verified to call `useUuid()` with no arguments and use the return value as a Firebase key (string). None destructure or type-narrow the return.
  - Validation artifacts: `apps/prime/src/hooks/pureData/useFetchBookingsData.client.ts` (representative call site), `apps/prime/src/hooks/useOccupantDataSources.ts` (orchestrator).
  - Unexpected findings: Current `useUuid` returns `string` (not `string | null`). State initialized to `''`. The new implementation must preserve this return type so all 26 call sites remain unchanged. The `!!uuid` guard in data hooks gates on empty string correctly.

**Consumer tracing:**
  - Existing consumers: all 26 data hooks via `useUuid()`. API surface unchanged (`string`). No consumer needs updating.
  - New internal dependency: `useAuthSession()` from `AuthSessionContext`. This context is provided by `GuardedGate` — all 26 hooks are inside `(guarded)/` route. `app/page.tsx` root page does not have the provider — `useAuthSession()` returns `{guestUuid: null}` (safe default defined in TASK-03).

- **Scouts:** Current `useUuid.ts` uses `useRouter` (for redirect) and `useSearchParams` (for URL read). After the change: `useRouter` still needed for `/error` redirect; `useSearchParams` still needed for mismatch detection but not for primary uuid resolution. `useAuthSession` is new.
- **Edge Cases & Hardening:** UUID format validation still applies: context uuid is `string | null` from the server, but the format is already validated when the token was created. Can still validate format as a sanity check. If format invalid (e.g., old token), fall back to localStorage.
- **What would make this >=90%:** Running the full test suite with the new implementation and confirming all 26 hooks still pass their existing tests.
- **Rollout / rollback:** Code revert restores URL-first behavior.
- **Documentation impact:** Add code comment in `app/page.tsx` (as resolved in analysis) documenting deliberate exclusion from `AuthSessionContext`.
- **Notes / references:** `apps/prime/src/hooks/useUuid.ts` (full rewrite). 26 call sites verified in fact-find.

---

### TASK-08: Add unit tests for `useUuid` — context, localStorage fallback, null-both, mismatch

- **Type:** IMPLEMENT
- **Deliverable:** New/updated `apps/prime/src/hooks/__tests__/useUuid.test.ts` with full unit test coverage for the rewritten hook.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/prime/src/hooks/__tests__/useUuid.test.ts` (new or updated)
- **Depends on:** TASK-04
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — Test structure is clear (TC-04 cases are already defined). Cap at 80: `useSearchParams` and `useAuthSession` require mocking in the test environment. Next.js hooks (`useSearchParams`, `useRouter`) typically require `<Suspense>` wrappers in tests. Need to verify existing test patterns for other hooks using `useSearchParams`.
  - Approach: 85% — Unit tests for React hooks using `renderHook` + mock context providers. Standard pattern.
  - Impact: 80% — Validates that the security fix is testable and that regressions will be caught in CI. Held-back test: if the mocking pattern for `useSearchParams` is non-standard in this codebase, tests may be flaky — check existing hook tests first.
- **Acceptance:**
  - [ ] TC-04-01 through TC-04-05 implemented as actual test assertions (not todos).
  - [ ] Tests run without errors in the prime app test suite.
  - [ ] Mismatch event assertion verifies `logger.warn` or equivalent analytics call is made with expected arguments.
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A — testing only
  - Security / privacy: Required — tests verify the tamper scenario (TC-04-04) is handled correctly
  - Logging / observability / audit: Required — TC-04-04 asserts mismatch event is emitted
  - Testing / validation: Required — this task IS the testing
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — test-only
- **Validation contract (TC-08):**
  - TC-08-01: All TC-04-01 through TC-04-05 pass.
  - TC-08-02: Tests complete without `act()` warnings or console errors.
- **Execution plan:** Red → Green → Refactor
  - Red: Write all 5 TC-04 tests using `renderHook` with mocked `AuthSessionContext`, `useRouter`, `useSearchParams`, `localStorage`. All fail because TASK-04 is already done (this task follows TASK-04).
  - Green: Fix any test infrastructure issues (Suspense wrappers, mock patterns). All tests pass.
  - Refactor: Extract mock helpers into a test utility if they are reusable.
- **Planning validation (required for M/L):**
  - Checks run: Existing hook tests at `apps/prime/src/hooks/__tests__/` — `useSessionValidation.test.ts` uses `renderHook` from `@testing-library/react` and mocks `validateGuestToken`. No `useSearchParams` usage in existing hook tests — need to verify the pattern by checking brikette or other apps for `useSearchParams` mocking.
  - Unexpected findings: `useUuid.ts` currently has zero test coverage — confirmed by absence of `apps/prime/src/hooks/__tests__/useUuid.test.ts`. This task creates the file from scratch.

- **Scouts:** Mock patterns needed: `jest.mock('next/navigation')` for `useSearchParams`/`useRouter`; a context wrapper for `AuthSessionContext`; `jest.spyOn(localStorage, 'getItem')` for localStorage mock.
- **Edge Cases & Hardening:** Test the `app/page.tsx` scenario: context returns `null` but localStorage has a valid uuid — hook returns the localStorage uuid (no redirect to `/error`).
- **What would make this >=90%:** Verifying `useSearchParams` mock pattern works in the prime app test env by checking an existing test using `useSearchParams`.
- **Rollout / rollback:** Test-only; no production impact.
- **Documentation impact:** None.
- **Notes / references:** `apps/prime/src/hooks/__tests__/` (directory), `apps/prime/src/hooks/__tests__/useSessionValidation.test.ts` (mock pattern reference).

---

## Risks & Mitigations

- **Context-population ordering race (Medium likelihood, Medium impact):** `GuardedGate` must set context before `gateState='allowed'` to avoid children mounting with null context. React 18 automatic batching should handle this, but must be verified in TASK-03 tests. Mitigation: TC-03-01 specifically tests that context is non-null when children see `gateState='allowed'`.
- **TASK-02/TASK-07 CI ordering (High likelihood if split across PRs, Low impact if bundled):** `validateGuestToken` return-type change breaks stale mocks. Mitigation: TASK-07 is a blocking dependency for TASK-02; plan enforces this via task sequencing.
- **`app/page.tsx` root page uuid fallback (High — architectural fact, Low impact):** Root page intentionally excluded from `AuthSessionContext`. Uses localStorage uuid. This is correct and safe. Code comment added in TASK-04.
- **`guestUuid: null` in valid sessions (Low likelihood, Low impact):** Some legacy tokens may have `guestUuid: null` even when `status: 'valid'`. TASK-03 context stores null; TASK-04 falls back to localStorage. Behavior degrades gracefully.
- **`fetchViaFullScan` passive exposure (High likelihood — pre-existing):** `useFetchBookingsData` downloads entire `bookings/` root for un-indexed occupants. Not addressed in this plan. Separate feature slug needed. Logged as adjacent risk.
- **Firebase RTDB rules unknown (High, High):** Determines whether tamper fix is "urgent security" or "defense in depth". Plan proceeds regardless; operator should confirm before assigning deadline urgency.

## Observability

- Logging: `useUuid` emits a `logger.warn` analytics event when URL uuid differs from context uuid.
- Metrics: Pre-release baseline for `/error` redirect rate captured in TASK-09 before TASK-04 ships.
- Alerts/Dashboards: None added in this plan. Post-ship: monitor `/error` redirect rate for anomaly vs. baseline.

## Acceptance Criteria (overall)

- [ ] GET `/api/guest-session` returns `guestUuid` for a valid session.
- [ ] `validateGuestToken()` returns `{status, guestUuid}` object; all 4 production callers updated.
- [ ] `AuthSessionContext` populated in `GuardedGate` before children render.
- [ ] `useUuid()` reads context first, falls back to localStorage; URL uuid is advisory only.
- [ ] URL uuid substitution by an authenticated guest no longer changes the Firebase lookup key.
- [ ] `find-booking` issues token for `matchedOccupantId`, not `leadOccupantId`.
- [ ] `digital-assistant` uses `prime_session` cookie auth (no longer broken silently).
- [ ] `GuestSessionSnapshot` type and all test mocks match current implementation; no stale `token` field.
- [ ] All CI tests pass, including new `useUuid` tests.
- [ ] Pre-release baseline for `/error` redirect rate recorded.

## Decision Log

- 2026-03-13: `app/page.tsx` (root page, outside `(guarded)/` group) intentionally excluded from `AuthSessionContext` — uses `useUuid` localStorage fallback path. This is correct because: (1) the session POST already wrote `guestUuid` to localStorage, (2) the root page is not a tamper entry point (bookmarks to `/?uuid=<id>` use a uuid that was set from localStorage in `buildGuestHomeUrl`, so URL and localStorage match). Code comment added in TASK-04.
- 2026-03-13: TASK-07 (mock cleanup) blocking dependency on TASK-02 — enforced to prevent CI failure window where return-type change is live but stale mocks still exist.
- 2026-03-13: `/api/assistant-query` uses body-token auth (`validateGuestSessionToken(body.token ?? null)`), not `prime_session` cookie. TASK-06 switches to cookie auth. This is the same pattern as all other CF Functions and is the correct fix.
- 2026-03-13: `fetchViaFullScan` passive data exposure deferred — separate feature slug needed. [Adjacent: delivery-rehearsal]
- 2026-03-13 (TASK-09 baseline): No existing measurement for `/error` redirects from `useUuid`. `logger.error` in `useUuid.ts` (lines 59-62 and 72-75) routes to `console.error` only — no observable analytics sink. TASK-04 will add the first instrumentation via `recordActivationFunnelEvent` with event type `'security_uuid_mismatch'`. Pre-release baseline: **no existing measurement** — TASK-04 instrumentation establishes the baseline. (TC-09-01 satisfied)

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extend guest-session GET | Yes — `GuestSessionToken.guestUuid` exists on Firebase record; session already has the field | None | No |
| TASK-07: Clean up stale type + mocks | Yes — stale patterns located and bounded (2 files); independent | None | No |
| TASK-05: Fix find-booking token issuance | Yes — `matchedOccupantId` in scope at token creation; independent | [Minor] `computeTokenExpiry` called with `booking[matchedOccupantId]?.checkOutDate` — verify no undefined-handling gap vs. lead-occupant path (same risk existed before) | No |
| TASK-09: Capture pre-release baseline | Yes — independent; client logger path verified | None | No |
| TASK-02: Update validateGuestToken return type | Partial — requires TASK-01 (server field) and TASK-07 (clean mocks); both are Wave 1 | [Type contract gap] [Minor]: `response.json()` call must be added to 200-path; currently returns bare string without parsing body. Must add `await response.json()` and handle parse errors → already in `try/catch` block, safe | No |
| TASK-06: Fix assistant-query cookie auth | Yes — `parseCookie` pattern confirmed in `guest-session.ts`; independent | [Minor] `parseCookie` is a local function in `guest-session.ts` — must be duplicated or moved to lib; duplication is acceptable for S-effort CF Functions | No |
| TASK-03: Create AuthSessionContext | Yes — TASK-02 provides `{status, guestUuid}` return; React context pattern established in codebase | [Integration boundary] [Minor]: React 18 automatic batching for `setSessionUuid + setGateState` — must verify no intermediate null-context render; TC-03-01 covers this | No |
| TASK-04: Rewrite useUuid | Yes — TASK-03 provides `useAuthSession()`; `app/page.tsx` context-null case handled (returns `{guestUuid: null}`) | None — null-both fallback chain is explicit; mismatch event is additive | No |
| TASK-08: Add useUuid tests | Yes — TASK-04 complete; mock patterns identified | [Minor]: `useSearchParams` mock pattern for prime app test env not verified; may require `Suspense` wrapper; existing tests don't use it — first use | No |

## Overall-confidence Calculation

- TASK-01: 90% × S(1) = 90
- TASK-07: 85% × S(1) = 85
- TASK-05: 90% × S(1) = 90
- TASK-09: 85% × S(1) = 85
- TASK-02: 85% × M(2) = 170
- TASK-06: 80% × S(1) = 80
- TASK-03: 85% × M(2) = 170
- TASK-04: 85% × M(2) = 170
- TASK-08: 80% × M(2) = 160
- Sum of weighted confidence: 90+85+90+85+170+80+170+170+160 = 1100
- Sum of effort weights: 1+1+1+1+2+1+2+2+2 = 13
- Overall-confidence = 1100 / 13 = 84.6% → rounded to 85%
- Frontmatter value: 85% (revised from 78% initial estimate)
