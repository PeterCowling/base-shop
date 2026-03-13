---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: prime-portal-personalization
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/prime-portal-personalization/fact-find.md
Related-Plan: docs/plans/prime-portal-personalization/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Prime Portal Personalization Analysis

## Decision Frame

### Summary

The prime guest portal personalization mechanism uses a `?uuid=` URL query parameter (`occ_<13 digits>`) as the Firebase lookup key for all guest data. The authentication layer (`prime_session` HttpOnly cookie) validates session ownership but does not bind the uuid to the session at the client level. This creates a design gap: an authenticated guest can substitute any valid-format `occ_<id>` in the URL and — depending on Firebase RTDB rules — read another occupant's booking, financial, and personal data. Additionally, the `useFetchBookingsData` full-scan fallback sends the entire `bookings/` root to the client browser on first login for any un-indexed occupant, which is a separate passive data exposure risk.

The decision is: which approach to take to bind uuid authoritatively to the server-validated session so that url substitution is no longer a viable data-access vector, and how to scope that fix relative to the secondary issues (find-booking token scoping, stale localStorage key, type cleanup, test coverage).

### Goals
- Eliminate the url-param tamper vector for guest data access.
- Bind uuid resolution to the server-validated session (`prime_session` cookie path).
- Fix find-booking to issue tokens for the matched occupant, not the lead guest.
- Remove stale `prime_guest_token` localStorage reference.
- Clean up `GuestSessionSnapshot` type divergence and stale test mocks.
- Add test coverage for uuid tamper, mismatch, and localStorage fallback.

### Non-goals
- Rewriting Firebase RTDB security rules (out-of-codebase-scope; operator confirmation needed).
- Staff/pin-auth flows.
- Owner dashboard data access.
- Any UI redesign.

### Constraints & Assumptions
- Constraints:
  - Cloudflare Pages Functions (CF Pages edge) — no server-side React rendering in the data-fetch path; context must be populated client-side after a GET to `/api/guest-session`.
  - 26 `useUuid()` call sites must continue to work after the change; blast radius must be managed.
  - `validateGuestToken()` has 4 production callers: `app/page.tsx`, `app/portal/page.tsx`, `app/(guarded)/layout.tsx`, `hooks/useSessionValidation.ts` — all are affected by a return-type change.
  - Tests mock `validateGuestToken` directly — changing its return type requires all mocks to be updated.
- Assumptions:
  - Firebase RTDB rules are assumed open (API-key-only) given the `FUNCTION_ONLY` declared vs. actual SDK-direct gap.
  - The chosen approach must degrade gracefully if `/api/guest-session` fails transiently — guests must not be silently locked out due to a network blip.

## Inherited Outcome Contract

- **Why:** Guest portal personalization relies on the `?uuid=` query parameter in a fragile way that could cause data leakage or silent fallback to wrong guest data.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All entry points to the guarded home pass uuid exclusively through the server-validated session; uuid tamper risk is eliminated; no guest can access another guest's data by manipulating the URL parameter.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/prime-portal-personalization/fact-find.md`
- Key findings used:
  - `useUuid()` reads `?uuid` from URL first, then localStorage fallback — URL takes precedence on every navigation, so any authenticated guest can override the stored uuid.
  - `GuardedGate` validates the `prime_session` cookie but never retrieves or checks the session's `guestUuid`.
  - `/api/guest-session` GET currently returns only `{status, expiresAt}` — no uuid in the response.
  - All 26 guarded-section data hooks call `useUuid()` and pass the result directly to Firebase SDK reads.
  - `FUNCTION_ONLY` policy is declared in `dataAccessModel.ts` for `booking_details`, `loans`, etc., but hooks bypass it by using Firebase SDK directly.
  - `find-booking` issues token for `leadOccupantId`, not `matchedOccupantId` — non-lead occupants get lead guest's personalization.
  - `digital-assistant/page.tsx:107` reads `prime_guest_token` from localStorage — this key is never written by the current session flow (always `null`).
  - `GuestSessionSnapshot` type omits `token` but test mocks include it — stale divergence.
  - `fetchViaFullScan` in `useFetchBookingsData` downloads the entire `bookings/` root for un-indexed occupants on first login.
  - `validateGuestToken` callers: `app/page.tsx`, `app/portal/page.tsx`, `app/(guarded)/layout.tsx`, `hooks/useSessionValidation.ts`.

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Eliminates uuid tamper vector | Core security goal — prevents cross-occupant data reads | Critical |
| Minimal consumer update burden | 26 call sites + 4 `validateGuestToken` callers affected | High |
| Graceful degradation on transient failure | Don't trade url tamper fragility for new session-context SPOF | High |
| Backward-compatible with existing bookmarked URLs | `/?uuid=<id>` links may be bookmarked; breaking them is a UX regression | Medium |
| Test seam quality | Hardening must be testable; context-based uuid is easier to mock than URL parsing | High |
| Addresses passive full-scan exposure | Separate risk but same threat surface | Medium |
| Implementation simplicity | Fewer layers = easier to maintain and audit | Medium |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Extend `/api/guest-session` GET + AuthSessionContext | Enhance GET to return `guestUuid`; update `validateGuestToken` to return `{status, guestUuid}`; store uuid in a new `AuthSessionContext` at `GuardedGate`; rewrite `useUuid` to read from context first, then localStorage fallback | Authoritative server-sourced uuid; tamper vector eliminated; clean context API; test seam is straightforward to mock | Changes `validateGuestToken` return type (4 callers + all mocks must update); adds one React context layer; requires `/api/guest-session` GET change | Context null on transient failure — must degrade to localStorage fallback with telemetry | Yes |
| B: Enforce FUNCTION_ONLY at hook level (route all data through CF Functions) | Rewrite data hooks to call CF Functions instead of Firebase SDK directly; CF Functions already validate session and cross-check `guestUuid` | Enforces declared policy; eliminates SDK direct access entirely; no URL param matters when server controls all data access | Massive blast radius: 26+ hooks, all need CF Function endpoints; massive latency increase (edge function per read vs. SDK); complete rewrite of data layer | Very high complexity, breaks phased loading (OPT-03), likely regression-prone; disproportionate to the risk | Yes (partial — use for new flows only) |
| C: UUID-lock in localStorage at first write, reject URL override | Change `useUuid` to always prefer `localStorage['prime_guest_uuid']` over URL; ignore URL uuid if localStorage has a value | No new API call; no context layer; minimal blast radius | Does not bind uuid to server-verified session — an attacker clears localStorage and loads uuid from URL; still tamper-able | Doesn't actually solve the security problem, only raises the bar slightly | No — insufficient |
| D: Firebase RTDB per-occupant security rules only | Operator configures Firebase rules to enforce `auth.uid === occupantId` — no code change | Solves the threat at the infrastructure layer | Requires Firebase custom auth tokens per guest (the SDK connection is currently anonymous/API-key); major infrastructure change; not in codebase scope; blocks fast path | Requires Firebase custom auth token issuance — new auth flow entirely; incompatible with current CF-managed session model in short term | No — out of scope for this plan |

## Engineering Coverage Comparison

| Coverage Area | Option A (Context-bound uuid) | Option B (Full FUNCTION_ONLY) | Chosen implication (Option A) |
|---|---|---|---|
| UI / visual | N/A — no UI changes | N/A | N/A — no UI changes |
| UX / states | Error state for transient context-null handled by localStorage fallback; no new user-facing state required | Major UX regression risk (latency per read) | Context-null must degrade to localStorage fallback; `useUuid` returns localStorage uuid + emits telemetry when context is absent |
| Security / privacy | Eliminates URL tamper vector; uuid sourced from server-validated session | Eliminates URL tamper vector and SDK direct access entirely | uuid is authoritative from server; URL param is advisory only (used for deep link compatibility only, rejected if it mismatches context) |
| Logging / observability / audit | Add client-side event when URL uuid differs from context uuid (mismatch detection); retain server-side `console.warn` in `guest-booking.ts` | CF Function logs cover all data reads | Mismatch analytics event must be added to `useUuid`; baseline measurement before release needed |
| Testing / validation | `validateGuestToken` return type change requires mock updates (4 callers + tests); `AuthSessionContext` is straightforward to mock in tests; `useUuid` becomes testable as context consumer | All hooks need new test suites for CF endpoints | TASK-08 (tests) must follow TASK-04 (context); mock update burden is bounded and mechanical |
| Data / contracts | `/api/guest-session` GET response contract extends (`guestUuid` added); `validateGuestToken` return type changes from `TokenValidationResult` string enum to `{status, guestUuid}` object | All hook contracts change | Contract changes are additive; `TokenValidationResult` can be kept as a sub-field; backward-compatible if callers handle both shapes during migration |
| Performance / reliability | One additional field in `/api/guest-session` GET response — negligible; context is populated before children render (blocking at GuardedGate); no new network calls | Massive latency increase (26+ edge function calls per page load) | Degrade gracefully on transient GET failure: use localStorage uuid + telemetry; gate on `!!uuid` already protects hooks from empty uuid |
| Rollout / rollback | No feature flag needed; code revert restores prior behavior; existing bookmarked `/?uuid=<id>` links work as long as localStorage uuid matches session uuid (always true post-login) | Staged rollout possible per hook; high regression risk per hook | Simple rollback by code revert; bookmarked links should continue to work via localStorage fallback path |

## Chosen Approach

- **Recommendation:** Option A — extend `/api/guest-session` GET to return `guestUuid`, update `validateGuestToken` to return the session payload, populate `AuthSessionContext` at `GuardedGate`, and rewrite `useUuid` to read from context as primary source with localStorage as fallback.
- **Why this wins:**
  - Directly and surgically addresses the security gap: uuid is now sourced from the server-validated session, not from an unverified URL parameter.
  - Minimal blast radius compared to Option B: 4 caller sites for `validateGuestToken` return type change, plus mechanical mock updates in tests. The 26 data-hook call sites are unchanged — `useUuid()` API surface stays the same.
  - Clean degradation path: if `/api/guest-session` GET fails transiently (network error), `useUuid` falls back to `localStorage['prime_guest_uuid']` with an error telemetry event rather than returning empty string and breaking all 26 hooks silently. If context is null AND localStorage is also null (guest not yet authenticated), `useUuid` returns `null` and all downstream hooks remain gated on `!!uuid` — this is identical to today's not-yet-authenticated behavior.
  - Backward-compatible: bookmarked `/?uuid=<id>` URLs continue to work because localStorage still holds the correct uuid post-login; the URL param becomes advisory-only for deep-link compatibility, overridden by context.
  - Option B would require rewriting 26+ hooks and adding 26+ CF endpoints — completely disproportionate to the problem and would break the phased loading (OPT-03) architecture.
  - Option C does not actually fix the security issue.
  - Option D requires Firebase custom auth token infrastructure not in scope.

- **What it depends on:**
  - Operator confirming Firebase RTDB rules (does not block the fix, but determines whether the change is "urgent security" vs. "defense in depth" in priority).
  - Existing `/api/guest-session` GET already has the session data (`session.guestUuid` is on the `GuestSessionToken` record in Firebase) — adding it to the response is a one-line change.
  - `app/page.tsx` at root also calls `validateGuestToken()` and renders `GuardedHomeExperience` — it is outside the `(guarded)` route group and does not go through `GuardedLayout`. **Decision:** Accept that `app/page.tsx` will continue to source uuid from localStorage (via `useUuid` localStorage fallback path). This is correct and safe: the session POST already wrote `guestUuid` to localStorage, so the uuid is accurate; the root page is not a bookmarked tamper entry point. The plan should add a code comment at `app/page.tsx` documenting this deliberate exclusion from `AuthSessionContext` coverage.

### Rejected Approaches

- **Option B (Full FUNCTION_ONLY enforcement)** — Rejected. Correct in principle (it is the declared policy), but the blast radius is disproportionate: 26+ hooks require new CF endpoints, adding latency to every data read, and breaking phased loading. Appropriate as a long-term architecture direction for new flows, not as this fix.
- **Option C (localStorage-first with URL rejected)** — Rejected. Does not bind uuid to the server session. An attacker who clears localStorage and navigates with `?uuid=<target>` is still unimpeded. Not a security fix.
- **Option D (Firebase per-occupant rules)** — Rejected for this plan. Requires Firebase custom auth token issuance — a significant infrastructure change incompatible with the current CF-managed session model. Track as a separate hardening item.

### Open Questions (Operator Input Required)

- Q: What are the current Firebase RTDB security rules for `bookings/`, `guestsDetails/`, `loans/`?
  - Why operator input is required: rules are configured in the Firebase console, not in the codebase.
  - Planning impact: determines whether this fix is prioritized as critical (rules open/API-key-only → data exposure is real) or advisory (rules already enforce per-occupant reads → fix is defense-in-depth). The plan proceeds either way, but the operator should confirm urgency before setting deadline.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Deep link entry | GET `/api/guest-session?token=<token>` returns `{status, expiresAt}`; client writes uuid to localStorage | Guest visits `/g/<token>` and POST-verifies | Unchanged — token verification still writes `bookingId`, `guestUuid`, `firstName`, `verifiedAt` to localStorage after POST `/api/guest-session` | POST flow, Set-Cookie, localStorage writes | None — this area is unchanged |
| GuardedGate (auth check) | `validateGuestToken()` returns `'valid' \| 'expired' \| 'invalid' \| 'network_error'`; sets `gateState='allowed'` on valid; no uuid propagated | Guest navigates to any route under `(guarded)/` | (1) `validateGuestToken()` call now returns `{status, guestUuid \| null}`. (2) GuardedGate stores the returned `guestUuid` in a new `AuthSessionContext`. (3) On transient failure (network_error), context is null — `useUuid` falls back to localStorage. (4) 30-min `useSessionValidation` interval still fires; on expiry, clears session and redirects. | Session expiry/clear behavior; PinAuthProvider/staff path; 30-min interval | `app/page.tsx` root is outside `(guarded)/` group — it intentionally uses localStorage uuid via `useUuid` fallback; this is correct and safe (session POST wrote uuid to localStorage). Plan should add a code comment at `app/page.tsx` documenting this deliberate exclusion. |
| uuid resolution in data hooks | `useUuid()` reads `?uuid` from URL; falls back to localStorage; validates format | Any guarded-section component mounts | `useUuid()` reads `AuthSessionContext` first (server-confirmed uuid). If context is absent (transient failure), falls back to `localStorage['prime_guest_uuid']`. URL `?uuid` param is no longer an override — it is only used for initial deep-link routing compatibility (matching URL to stored session). If URL uuid differs from context uuid, a mismatch analytics event is emitted and context uuid wins. | Firebase lookup logic (reverse index + full scan); React Query caching; all 26 hook call sites | `app/page.tsx` is outside GuardedLayout so it has no `AuthSessionContext` — by design; `useUuid` localStorage fallback provides the correct uuid |
| find-booking token issuance | Token issued for `leadOccupantId`, not `matchedOccupantId` | Guest submits surname + bookingRef on `/find-my-stay` | Token issued for `matchedOccupantId`. If matched occupant is the lead, behavior is identical to current. Non-lead guests now get a session scoped to their own uuid, not the lead's. | Rate limiting; surname matching logic; redirect to `/g/<token>` | One edge case: if a booking has a single occupant who is both lead and matched, behavior is unchanged |
| `digital-assistant` stale token read | Reads `localStorage.getItem('prime_guest_token')` — always `null` under current flow; sends `null` to `/api/assistant-query` | Assistant query submitted | Remove `prime_guest_token` read; use cookie-based auth path (the assistant API should use `prime_session` cookie like all other endpoints) | Rest of digital-assistant functionality | `/api/assistant-query` endpoint must accept `prime_session` cookie instead of body `token` field; or the `token` field can be dropped from the request body if the endpoint validates via cookie |
| Type / test cleanup | `GuestSessionSnapshot` lacks `token` field; tests mock it with stale shape; `useSessionValidation` test references `token` param that doesn't exist on the hook | — | `GuestSessionSnapshot` type, test mocks, and `useSessionValidation` tests updated to match current implementation; no `token` param in hook or type | Behavior unchanged; only types and mocks cleaned up | Test suite must pass after type cleanup; no behavioral regressions |

## Planning Handoff

- Planning focus areas:
  - **API contract extension:** Extend `/api/guest-session` GET to return `guestUuid`. Update `validateGuestToken` return type from a string enum to an object `{status, guestUuid}`. This is the foundation — the context layer depends on it.
  - **Context layer:** Create `AuthSessionContext` populated by `GuardedGate` after session validation. Rewrite `useUuid` to read context first, then localStorage fallback, then return null. Emit mismatch telemetry if URL uuid differs from context uuid. Remove URL-as-primary-source behavior. The 26 data hook call sites are unchanged — `useUuid()` API surface stays `string | null`.
  - **Secondary correctness fixes (independent):** Fix `find-booking.ts` to issue tokens for `matchedOccupantId` instead of `leadOccupantId`. Remove stale `prime_guest_token` localStorage read from `digital-assistant/page.tsx` — inspect `/api/assistant-query` first to confirm it validates via `prime_session` cookie before removing the body token field; if not, an endpoint auth migration is required as part of this fix.
  - **Type and test cleanup:** Update `GuestSessionSnapshot` type and all test mocks for `validateGuestToken` and `readGuestSession` to match the current interface. Add unit tests for `useUuid` (context source, localStorage fallback, null-both-absent, mismatch event emission). Tests for `useUuid` context path must follow the context layer.
  - **Pre-release baseline:** Capture `/error` redirect rate before shipping.
- Validation implications:
  - All existing tests for `GuardedGate`, `portal/page.tsx`, and `useSessionValidation` require mock updates when `validateGuestToken` return type changes from string to object. These must be updated before or simultaneously with the API contract change to avoid CI breakage.
  - New tests for `useUuid` context path, localStorage fallback, null-both-absent, and mismatch detection are required before the artifact is complete.
  - The `/api/guest-session` GET endpoint needs a contract test confirming the `guestUuid` field is present in the response.
- Sequencing constraints:
  - API contract extension must precede the context layer (context population needs the payload shape).
  - Context layer must be complete before `useUuid` tests can accurately cover the context source path.
  - **CI ordering (critical):** Type and mock cleanup (updating `validateGuestToken` mocks) must land before or simultaneously with the API contract extension merge — do not merge the return-type change while tests still expect the old string shape.
  - Secondary correctness fixes and type/test cleanup are independent of the context layer and can proceed in parallel.
  - `app/page.tsx` (root page, outside `(guarded)/` group) is intentionally excluded from `AuthSessionContext` coverage — it uses localStorage uuid via `useUuid` fallback path. Plan should add a code comment at `app/page.tsx` documenting this deliberate exclusion.
- Risks to carry into planning:
  - `fetchViaFullScan` passive full-scan exposure is pre-existing and not addressed in this change set — planning must note it as a follow-up item requiring a separate feature slug.
  - `/api/assistant-query` endpoint auth model is unconfirmed — inspect before scoping the `digital-assistant` fix. If it requires an endpoint auth migration, scope and effort increase.

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| `app/page.tsx` outside `GuardedLayout` has no `AuthSessionContext` | High (architectural fact) | Low (uuid hooks in GuardedHomeExperience fall back to localStorage — correct because session POST wrote `guestUuid` to localStorage; root page is not a tamper entry point) | Decided: accept localStorage-only uuid for root page path; add code comment documenting deliberate exclusion | Plan should add comment at `app/page.tsx` noting the deliberate exclusion from AuthSessionContext coverage |
| Firebase RTDB rules unknown | High (external) | High (determines true severity of tamper risk) | Out of codebase scope | Operator must confirm before plan sets fix as critical vs. defense-in-depth |
| `fetchViaFullScan` passive full-scan data exposure | High (fires on first login for un-indexed occupants) | High (entire `bookings/` root downloaded to client browser) | Separate remediation — requires either function proxy enforcement or Firebase rules | Plan should note this as a follow-up; not addressed in this change set |
| `validateGuestToken` mock update burden | Medium (many test files) | Low-medium (tests fail until mocks updated, may block CI during migration) | Implementation detail for planning | Plan TASK-07 before merging TASK-02 to avoid CI breakage |
| `digital-assistant` `/api/assistant-query` endpoint auth model unknown | Medium | Low (assistant functionality already broken silently) | Endpoint not investigated in detail | Plan TASK-06 to audit the endpoint before removing the body token |

## Planning Readiness

- Status: Ready-for-planning
- Rationale: Chosen approach is decisive (Option A), all 4 rejected options have explicit rationale, sequencing constraints are clear, end-state operating model is complete, and the only remaining open question (Firebase RTDB rules) does not block the plan from proceeding.
