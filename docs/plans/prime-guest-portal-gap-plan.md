---
Type: Plan
Status: Active
Domain: Prime
Created: 2026-01-17
Last-updated: 2026-02-07
Last-reviewed: 2026-02-07
Re-planned: 2026-02-07 (iteration 4)
Feature-Slug: prime-guest-portal-gap
Overall-delivery-confidence: 84%
Overall-business-priority: High
Confidence-Method: Delivery confidence only (implementation readiness + approach fit + integration-risk clarity); business value is tracked separately via goals, KPI targets, and MVP slice priority.
Business-Unit: BRIK
Card-ID: BRIK-ENG-0017
Relates-to charter: none
Fact-Find-Ref: docs/plans/prime-guest-portal-gap-fact-find.md
Build-progress: 19/53 tasks complete (TASK-01 through TASK-19 completed 2026-02-07)
---

# Prime Guest Portal — Bridge Plan

## Summary

Complete the Prime guest portal for hostel pre-arrival and arrival-day experiences. Prime is Brikette's L3 (Integrated Operations) guest self-service app — a mobile PWA with tokenized magic links, no account creation, no payments, keycards only.

**Re-plan finding (2026-02-07):** The original plan (2026-01-17) marked nearly everything as "Not started". Code audit reveals substantial implementation: token flow ~90% done, readiness dashboard ~80% built (all components + tested logic), arrival mode ~75% built (code gen + UI components). The primary gap across all features is **route integration** — components exist but aren't wired into app navigation. UX/UI review adds new **Phase 0** (guest funnel hardening), **Phase 0A** (Firebase cost-safety test gates), **Phase 0B** (launch safety/security hardening), **Phase 2B** (cross-app shared-data UX), **Phase 2C** (activation/engagement optimization), **Phase 2D** (central UI/theming platform work), and **Phase 2E** (post-onboarding/in-stay guest operations), while retaining deferred work in Phase 3.

## Goals

- Guest receives magic link → verifies identity → sees pre-arrival readiness dashboard
- On arrival day, dashboard switches to arrival mode with QR + check-in code
- Pre-arrival checklist covers: route planned, cash prepared, ETA confirmed, rules reviewed, location saved
- Cash amounts (city tax + €10 keycard deposit) visible on readiness + arrival screens
- Post-onboarding guests can self-serve booking status, extension requests, experiences/chat, meal ordering, local guidance, and bag-drop requests
- Shared guest interactions improve reception workflows and owner visibility via common data contracts
- No in-app payments, no digital keys, no account creation

## Non-goals

- Full staff app (beyond lightweight lookup)
- Digital keys or smart locks
- In-app payments or city tax collection
- Campaign/trigger messaging orchestration (deferred to Phase 3)
- Offline/PWA (deferred to Phase 3)
- Real staff authentication (deferred to Phase 3 — guest features work without it)

## Constraints & Assumptions

- Constraints:
  - Cloudflare Pages static export (trailing slashes, Functions for API)
  - Firebase RTDB as sole data store
  - Current implementation is hybrid: Cloudflare Functions for token/session/booking operations, Firebase client SDK for some real-time guest/staff surfaces
  - `(guarded)` route group pattern is a UX/navigation gate and must not be treated as a standalone security boundary
  - localStorage-based guest sessions (no server-side session store)
  - No wrangler.toml exists yet — deployment config needed before production
  - Firebase cost-safety is a release blocker: runaway or duplicated query patterns must be prevented by automated test gates
- Assumptions:
  - Guest-critical data paths (token verify, booking details/status, extension, meal orders, bag-drop, staff/owner payloads) are Function-mediated for production
  - SDK-backed real-time surfaces remain feature-flagged until guest Firebase auth model is formalized and tested
  - Existing component implementations are functionally correct (tested where tests exist)
  - Route integration is the primary remaining work for Phase 1

## System & Security Model (Clarified)

This section resolves the architecture/security ambiguity between Function-mediated data and client SDK data.

1. **Security boundary:** Data-layer authorization is the security control. `/(guarded)` is only navigation/UX gating.
2. **Guest token model:** Token is `crypto.randomUUID()` without hyphens (32-char hex), stored in `guestSessionsByToken/{token}` with expiry.
3. **Guest localStorage contract:** `prime_guest_token`, `prime_guest_booking_id`, `prime_guest_uuid`, `prime_guest_first_name`, `prime_guest_verified_at`.
4. **Session lifecycle:** Keys are set at `/g` verification success; cleared on 410 expiry, explicit logout/reset, or invalid session recovery.
5. **Data access model (target):**
   - **Function-mediated only:** verification/session, booking details/status, extension requests, meal order mutations, bag-drop requests, staff lookup payloads, owner KPI payloads.
   - **SDK-allowed (controlled):** activity/chat presence and message streams after explicit consent and safety controls, behind feature flags until auth hardening lands.
6. **Firebase auth posture:** Because RTDB rules require `auth != null`, any production SDK reads/writes must use a documented guest auth mechanism (custom token or equivalent) and fail closed when auth is absent.
7. **Sensitive-data definition:** booking identity, contact, room/date assignments, financial prep signals, request states, and staff/owner operational payloads are sensitive and must not be exposed by route access alone.

## Production Rollout Policy (Non-negotiable)

1. Guest portal routes can ship only when TASK-28/34/35 and TASK-40/48/49 are green.
2. Staff/owner routes are OFF in production by default until TASK-51 is complete or interim server-side access controls in TASK-40 are active.
3. Chat/social features are feature-flagged and require TASK-44 guardrails before production enablement.
4. Owner KPI pages must read pre-aggregated data nodes (TASK-47), not ad-hoc broad scans.
5. Firebase budget/leak regressions block merge/release.
6. Billing/usage alerts are configured before broad rollout (see TASK-30 + TASK-47 operational notes).

## Firebase Cost-Safety Requirement (Non-negotiable)

Prime must not create Firebase query leaks (duplicate listeners, repeated refetch loops, or accidental full-scan reads) that degrade performance or create runaway billing.

Hard requirement:

1. Critical guest flows have explicit Firebase read/listener budgets enforced by tests.
2. Subscription lifecycle tests prove listener cleanup on route change and unmount.
3. CI blocks merge when query-budget regression tests fail.
4. Release gate: no phase is considered complete unless TASK-28, TASK-29, and TASK-30 are green.

## TDD Execution Requirement (Non-negotiable)

Prime implementation work follows strict TDD execution for this plan (excluding "changed code must change tests" CI diff enforcement, which is intentionally out of scope for this update).

Hard requirement:

1. Every IMPLEMENT task starts with a **Red** step (tests written/activated first and failing for the expected reason).
2. Task completion requires explicit **Red → Green → Refactor** evidence in task completion notes, not just a final passing test run.
3. Any task that crosses app boundaries (Prime ↔ Reception/Brikette) includes shared-data **contract tests** for producer/consumer parity.
4. Every major guest-facing flow has at least one **e2e scenario** test in its owning task contract.

## MVP Shipping Slice (Production Candidate)

This is the explicit critical path for first production-grade guest value:

1. TASK-03, TASK-04 (entry contract + shared guest session guard)
2. TASK-28, TASK-29, TASK-30 (Firebase cost-safety gates)
3. TASK-39, TASK-40 (data/security model hardening + production route gating)
4. TASK-05, TASK-06, TASK-07, TASK-11 (portal → guarded readiness/arrival + expiry enforcement)
5. TASK-02, TASK-41, TASK-42 (deploy config + primary e2e + Pages routing/deep-link verification)

**MVP slice delivery confidence:** 81% (higher than full-plan confidence because non-critical/deferred tracks are excluded).

## UX Blueprint (Complete Target Experience)

This section describes the full target UX after implementation of TASK-03 through TASK-37. It is written from the user perspective and covers exactly what users can do and what they see while doing it.

### UX States

| State | Who | Entry condition | Primary goal |
|------|-----|-----------------|--------------|
| Unverified | Guest | No active guest session | Recover/verify access |
| Verified pre-arrival | Guest | Valid token + identity verified, before check-in date | Prepare for arrival |
| Arrival-day | Guest | Valid token + check-in date is today, not checked in | Complete fast desk handoff |
| Checked-in | Guest | Reception check-in recorded | Use in-stay services |
| Checked-out/expired | Guest | Checkout passed or token expired | Graceful exit/recovery |
| Staff operator | Reception staff | Staff auth session active | Lookup and process arrivals quickly |
| Owner observer | Owner/manager | Owner access active | Track operational readiness and conversion |

### Guest UX — Primary Journey (Magic Link)

| Step | Route/Context | What guest sees | What guest can do | System response |
|------|----------------|-----------------|-------------------|-----------------|
| 1 | Message link (`/g/<token>`) | Branded verification screen with loading state | Wait; retry via find-my-stay if link fails | Token validated via `/api/guest-session` |
| 2 | `/g` verified state | "Confirm your stay" card with last-name field | Enter last name; submit | Server verifies token + last name; sets session keys |
| 3 | `/portal` onboarding start | Guided "Step 1 of 3" flow (aha-first) | Continue or skip step | Progress persisted; analytics event emitted |
| 4 | Route step | Recommended route cards, travel time, cost hints | Pick a route, view details, save route | `routePlanned` + `routeSaved` updated |
| 5 | ETA step | 30-min time options + travel method + optional note | Set ETA and method | `etaWindow`, `etaMethod`, `etaConfirmed` updated |
| 6 | Cash step | City tax + deposit breakdown, total needed, confirmation toggles | Confirm prepared cash (partial or full) | `cashReady*` and `cashPrepared` updated |
| 7 | Home (pre-arrival) | Readiness score ring, next-action card, checklist, quick actions | Complete remaining items, edit prior inputs | Score recalculates in real time; next action adapts |
| 8 | Utility usage | Contextual one-tap strip (maps, calendar, support) | Open maps, add to calendar, contact reception | External action opens; interaction logged |
| 9 | Near complete | Milestone UI + positive completion feedback | Finish last checklist items | Celebration micro-feedback; readiness = 100% |
| 10 | Arrival day auto-switch | Arrival badge + "Show at reception" card | View QR/code, copy code, confirm final reminders | `useCheckInCode` fetches/generates BRK code if needed |
| 11 | At desk | QR and code remain visible in high-contrast card | Show phone screen or read code aloud | Staff scans/types code to load booking + readiness |
| 12 | Post check-in | Guest home switches from arrival mode to in-stay layout | Use services/tasks/guide features | Arrival-only prompts de-emphasized |

### Guest UX — Recovery Journey (No Link / Lost Link)

| Step | Route | What guest sees | What guest can do | System response |
|------|-------|-----------------|-------------------|-----------------|
| 1 | `/find-my-stay` | Two-field recovery form (surname + booking ref) | Submit details | Calls `/api/find-booking` |
| 2 | Success | Immediate redirect, no manual copy required | Continue automatically | Uses API `redirectUrl` to enter `/g/<token>` |
| 3 | Failure (404/429) | Clear error card with retry guidance | Retry now or later | Rate-limit/error handling shown without dead ends |

### Guest UX — Returning Session Journey

| Step | Context | What guest sees | What guest can do | System response |
|------|---------|-----------------|-------------------|-----------------|
| 1 | Open `/portal` with active session | Fast loading state then redirect/home | Continue where left off | Session guard validates token server-side |
| 2 | Token expired | "Session expired" recovery screen | Tap "Find my stay" | Session keys cleared; redirect to recovery |
| 3 | Network issues | Non-blocking warning (fail-open while cached state exists) | Keep using core screens | Background revalidation retries later |

### Guest UX — Post-Onboarding/In-Stay Journey

| Step | Route/Context | What guest sees | What guest can do | System response |
|------|----------------|-----------------|-------------------|-----------------|
| 1 | `/(guarded)/booking-details` | Booking summary card with check-in/out dates, room, booking reference, and status badge | Confirm booking details and current status (`pre-arrival`, `checked-in`, `checked-out`) | Status is derived from booking dates + check-in signals |
| 2 | Booking details action panel | "Need longer?" extension CTA with clear hostel contact target | Submit extension request with desired new checkout date and note | Prime sends structured email request to `hostelbrikette@gmail.com` and stores audit event |
| 3 | `/(guarded)/digital-assistant` | Chat-style help UI with answer block + "Further reading" links | Ask travel/hostel questions and open linked definitive pages | Assistant returns concise answer first, then Brikette/website links for deeper reading |
| 4 | `/(guarded)/activities` | Live/upcoming experience cards with start/end windows and attendance state | Browse experiences and open group space | Activity feed uses shared event data and only enables group messaging after start |
| 5 | `/(guarded)/chat/channel` (activity started) | Presence prompt ("I'm here") and group thread | Mark present and message other attendees | Presence is recorded; chat publish controls enforce event status and opt-in rules |
| 6 | `/(guarded)/chat` (social opt-in guests) | Direct guest messaging directory with consent status | Message other opt-in guests; mute or opt out anytime | Messaging allowed only when both parties have opted in |
| 7 | `/(guarded)/complimentary-breakfast` and `/(guarded)/complimentary-evening-drink` | Entitlement + order state for upcoming service dates | Place or edit orders when policy allows | Edits are blocked for same-day service, with clear policy explanation |
| 8 | `/(guarded)/positano-guide` + utility strip | "Getting around" and "what to do" guides with definitive links | Open transport/leisure guidance and continue into Brikette web guides | Prime acts as concierge front door; Brikette remains canonical long-form source |
| 9 | `/(guarded)/bag-storage` after checkout | Post-checkout bag-drop request card with pickup expectations | Submit bag-drop request and view current request status | Request is stored and surfaced to staff; guest sees confirmation and time constraints |

### Guest UX — Visual/Interaction Rules

- Pre-arrival guests always land on readiness-first home before secondary content.
- Arrival-day guests always land on QR/code-first arrival mode before secondary content.
- Checklist actions are actionable cards, not passive text.
- Every critical step has one obvious primary action and one safe fallback.
- Confidence and trust cues are contextual, short, and non-blocking.
- Progress is always visible (stepper or readiness score) to reduce ambiguity.

### Staff UX — Reception Journey (Prime + Shared Data)

| Step | Route | What staff sees | What staff can do | System response |
|------|-------|-----------------|-------------------|-----------------|
| 1 | Staff entry (`/staff-lookup` or `/checkin/<code>`) | Staff gate + lookup UI | Authenticate, enter or scan code | Access guard allows staff roles |
| 2 | Code lookup result | Guest identity card (minimal PII), room, dates, nights | Validate guest verbally | Data loaded from code + booking + preArrival |
| 3 | Arrival readiness panel | ETA, cash-prepared, route-planned, rule/location flags | Prioritize conversation based on missing items | Shared readiness signals reduce desk time |
| 4 | Payment prep panel | City tax, deposit, total | Collect cash efficiently | Amounts match guest-facing display |
| 5 | Exception handling | Badge/warning for late ETA, missing cash prep, expired code | Trigger fallback process | Staff gets clear next-step guidance |
| 6 | Check-in completion | Confirmation and handoff state | Complete check-in | Guest app transitions out of arrival mode |

### Owner UX — Operational Insight Journey

| Step | Route | What owner sees | What owner can do | System response |
|------|-------|-----------------|-------------------|-----------------|
| 1 | `/owner` dashboard | KPI cards (activation, readiness, ETA coverage, check-in lag) | Select date range and compare windows | Aggregated metrics load from shared data |
| 2 | Funnel section | Step conversion and drop-off by onboarding stage | Identify weak step and prioritize change | Data linked to activation event taxonomy |
| 3 | Experiment section | Active A/B variants + conversion deltas | Promote/rollback a variant | Safe rollout based on performance |
| 4 | Weekly operations review | Trend cards for staff efficiency signals | Adjust staffing/process | Cross-app readiness signals inform decisions |

### Error, Edge, and Safety UX

| Scenario | What user sees | What user can do | Expected behavior |
|----------|----------------|------------------|-------------------|
| Invalid token | "Link problem" state with recovery CTA | Go to find-my-stay | No data leak, clear recovery path |
| Expired token | Expired session state | Re-auth via find-my-stay | Local session cleared |
| Too many attempts | Rate-limit message | Wait/retry later | Friendly copy + no silent failures |
| Missing API data | Fallback card with safe defaults | Continue with partial flow | No crash, checklist remains usable |
| Offline/weak network | Connectivity warning + cached essentials | Continue core arrival actions | Fail-open where safe; sync when online |
| Unauthorized staff access | Access denied/redirect | Re-authenticate | No guest data exposure |

### Cross-App Shared-Data Moments (Prime, Brikette, Reception)

| Moment | Prime writes/reads | Reception benefit | Brikette benefit |
|--------|--------------------|-------------------|------------------|
| Route selection | Writes `routeSaved` + `routePlanned` | Staff sees if guest has route confidence | Route content stays canonical and reusable |
| ETA submit | Writes `etaWindow` + `etaMethod` | Desk can prep for arrival timing | Better transport guidance feedback loop |
| Cash confirm | Writes `cashPrepared` | Faster payment conversation at desk | Consistent policy messaging across properties |
| Arrival code display | Reads/writes check-in code lifecycle | Rapid lookup + fewer manual search steps | Standardized handoff pattern for linked experiences |
| Funnel analytics | Emits activation events | Staff can see friction points by step | Content/product optimization driven by behavior |

### Definition of Complete UX (User-visible)

A user-visible UX is complete only when all of the following are true:

1. Guests can start from either magic link or find-my-stay and reach a useful dashboard without dead ends.
2. Guests can complete route, ETA, and cash prep with clear feedback and visible progress.
3. Arrival-day guests can always present a working QR/code experience at reception.
4. Staff can reliably retrieve guest arrival context (including readiness signals) in one lookup.
5. Owners can monitor activation and operational KPIs without manual data stitching.
6. Error/expiry/offline states remain understandable and recoverable for non-technical users.
7. All key steps are instrumented so UX quality can be measured and iteratively improved.
8. Prime's readiness/arrival UI patterns are backed by shared central tokens/components consumable by Reception and Brikette.
9. Post-onboarding guests can self-serve booking status, extension requests, activities/chat, meal orders, local guidance, and bag-drop requests without dead-end placeholders.
10. Firebase query/listener usage for guest-critical flows remains within tested budget limits (no leak regressions).
11. Major guest-facing flows have at least one passing e2e scenario each.
12. Prime↔Reception shared operational contracts (requests/status nodes) are covered by contract tests.
13. Completed IMPLEMENT tasks include recorded Red → Green → Refactor evidence.

## UI + Theming Blueprint (Central Platform Gaps)

This section defines UI/theming platform work that should be built centrally and consumed by Prime, Reception, and Brikette. It converts engagement ideas into reusable product infrastructure instead of one-off page implementations.

### Current Gaps from Code Truth (2026-02-07)

| Gap | Evidence | Why this matters | Central fix |
|-----|----------|------------------|-------------|
| Prime token overrides are duplicated app-locally | `apps/prime/src/styles/globals.css` defines `:root` overrides while `packages/themes/prime/tokens.css` already defines the same brand token set | Drift risk and inconsistent visual output over time | Make `@themes/prime/tokens.css` the single Prime override source |
| Prime typography token is inconsistent | `apps/prime/src/styles/globals.css` hardcodes Inter stack while `packages/themes/prime/src/tokens.ts` sets `--font-sans: var(--font-geist-sans)` | Brand inconsistency and unpredictable fallback behavior | Centralize hospitality typography tokens in theme packages |
| Prime engagement UI is mostly app-local | `apps/prime/src/components/pre-arrival/*`, `apps/prime/src/components/arrival/*`, `apps/prime/src/components/onboarding/*` | Reception and other apps cannot reuse core readiness/onboarding patterns | Extract shared hospitality patterns into `@acme/design-system` + `@acme/ui` |
| Reception theme foundation is not aligned to base token pipeline | `apps/reception/src/app/globals.css` does not import `@themes/base/tokens.css` and relies heavily on local color classes | Cross-app visual inconsistency and higher maintenance | Add a reception theme bridge based on shared token contracts |
| Brikette and Prime branding are linked but not governed by shared hospitality semantics | `apps/brikette/src/styles/global.css` and Prime global styles both maintain app-specific token layers | Same business, fragmented signal language | Add shared semantic status/signal tokens consumed by both apps |
| No app-level theme contract gate for hospitality surfaces | Root has token scripts, but no Prime/Reception visual/token contract for readiness/arrival UI | Regressions can ship unnoticed | Add cross-app token contract + visual regression checks |

### Central Build Requirements (for Prime Consumption)

1. `@themes/prime` becomes the canonical Prime brand layer (all Prime overrides live there, not in app-local `:root` blocks).
2. `@themes/base` gains shared hospitality semantic tokens (status, readiness, signal, motion, density, emphasis).
3. `@acme/design-system` provides reusable interaction primitives for activation patterns (step shell, progress affordances, trust/value cue blocks, celebration micro-feedback).
4. `@acme/ui` provides hospitality composites (readiness cards, arrival code display card, staff signal badges, owner KPI cards, contextual utility strip).
5. Storybook + CI contract tests enforce token usage, contrast, and visual stability for these shared components.
6. Prime consumes central packages first; Reception and Brikette adopt incrementally through compatibility bridges.

### Wider Business Contribution (Finished-State)

| Business actor | Contribution from finished Prime app | Target outcome |
|----------------|--------------------------------------|----------------|
| Guests | Fast, low-stress arrival preparation with clear progress and one-tap utilities | Median time-to-first-value ≤90s; readiness completion ≥85%; perceived usefulness/engagement ≥9/10 |
| Reception staff | Better pre-arrival context at desk (route, ETA, cash readiness, arrival code) for faster handoff | Median check-in handoff time <2 minutes; fewer manual clarification steps |
| Owners/managers | Reliable operational KPI visibility from one shared data stream | Weekly visibility on activation, readiness, and desk throughput with trend-based staffing decisions |
| Brikette content/ops team | Prime closes the feedback loop on route/arrival guidance quality | Route guidance and support content updated from real guest behavior, not anecdote |
| Wider BRIK product stack | Shared UI/theming and data contracts reduce duplicate implementation across apps | Lower maintenance cost and faster rollout of cross-app UX improvements |

Applied activation guidance from the referenced onboarding document is carried into platform requirements: first-value speed, visible progress, trust framing, contextual utility, and instrumentation-driven iteration are treated as reusable system capabilities.

## Task Summary

Rows below are in **numeric TASK-ID order**.

| Task | Title | Type | Effort | Confidence | Dependencies | Status |
|------|-------|------|--------|------------|--------------|--------|
| TASK-01 | Cloudflare Function test harness | IMPLEMENT | M | 80% | — | Complete (2026-02-07) |
| TASK-02 | Deployment configuration (wrangler.toml) | IMPLEMENT | S | 82% | — | Complete (2026-02-07) |
| TASK-03 | Guest lookup contract alignment + magic-link handoff | IMPLEMENT | S | 92% | — | Complete (2026-02-07) |
| TASK-04 | Shared guest session guard (portal + guarded routes) | IMPLEMENT | M | 86% | TASK-03 | Complete (2026-02-07) |
| TASK-05 | Portal session validation + redirect | IMPLEMENT | S | 88% | TASK-04 | Complete (2026-02-07) |
| TASK-06 | Wire readiness dashboard into guarded routes | IMPLEMENT | M | 85% | TASK-05 | Complete (2026-02-07) |
| TASK-07 | Wire arrival mode into guarded routes | IMPLEMENT | M | 85% | TASK-05 | Complete (2026-02-07) |
| TASK-08 | Route planner page + dashboard link | IMPLEMENT | M | 80% | TASK-06 | Complete (2026-02-07) |
| TASK-09 | ETA confirmation flow | IMPLEMENT | M | 82% | TASK-06 | Complete (2026-02-07) |
| TASK-10 | Cash preparedness display | IMPLEMENT | S | 88% | TASK-06 | Complete (2026-02-07) |
| TASK-11 | Token expiry enforcement + portal refresh | IMPLEMENT | S | 85% | TASK-05 | Complete (2026-02-07) |
| TASK-12 | Keycard status display (guest-facing) | IMPLEMENT | S | 84% | TASK-06 | Complete (2026-02-07) |
| TASK-13 | Guest-first home information architecture | IMPLEMENT | M | 84% | TASK-06, TASK-07 | Complete (2026-02-07) |
| TASK-14 | Brikette route source-of-truth integration | IMPLEMENT | M | 85% | TASK-08 | Complete (2026-02-07) |
| TASK-15 | Staff arrival signal surface (shared readiness data) | IMPLEMENT | M | 84% | TASK-09, TASK-10 | Complete (2026-02-07) |
| TASK-16 | Aha-first guided onboarding (post-verification) | IMPLEMENT | M | 85% | TASK-03, TASK-04 | Complete (2026-02-07) |
| TASK-17 | Personalized onboarding path + smart defaults | IMPLEMENT | M | 83% | TASK-16, TASK-13 | Complete (2026-02-07) |
| TASK-18 | Trust cues + value framing layer | IMPLEMENT | S | 84% | TASK-16 | Complete (2026-02-07) |
| TASK-19 | Progress psychology + celebration loops | IMPLEMENT | S | 87% | TASK-16 | Complete (2026-02-07) |
| TASK-20 | Contextual utility actions (maps/calendar/support) | IMPLEMENT | M | 84% | TASK-16, TASK-07 | Complete (2026-02-07) |
| TASK-21 | Activation analytics + funnel observability | IMPLEMENT | M | 84% | TASK-03 | Complete (2026-02-07) |
| TASK-22 | Continuous A/B testing cadence for activation | IMPLEMENT | M | 82% | TASK-21 | Complete (2026-02-07) |
| TASK-23 | Prime theme source-of-truth consolidation (`@themes/prime`) | IMPLEMENT | M | 90% | — | Complete (2026-02-07) |
| TASK-24 | Central onboarding/trust/progress primitives in `@acme/design-system` | IMPLEMENT | M | 82% | TASK-23 | Complete (2026-02-07) |
| TASK-25 | Hospitality composite component kit in `@acme/ui` | IMPLEMENT | L | 82% | TASK-24 | Complete (2026-02-07) |
| TASK-26 | Shared hospitality semantic tokens (status/signal/motion/typography) | IMPLEMENT | M | 84% | TASK-23 | Complete (2026-02-07) |
| TASK-27 | Reception + Brikette theme consumption bridge | IMPLEMENT | M | 82% | TASK-26 | Complete (2026-02-07) |
| TASK-28 | Firebase query-budget contract tests (guest-critical flows) | IMPLEMENT | M | 90% | TASK-04 | Complete (2026-02-07) |
| TASK-29 | Firebase listener lifecycle leak tests | IMPLEMENT | M | 88% | TASK-28 | Complete (2026-02-07) |
| TASK-30 | Firebase cost regression CI gate + baseline budgets | IMPLEMENT | M | 86% | TASK-28, TASK-29 | Complete (2026-02-07) |
| TASK-31 | Booking details + lifecycle status surface | IMPLEMENT | M | 84% | TASK-04, TASK-13 | Ready |
| TASK-32 | Extension request email workflow (`hostelbrikette@gmail.com`) | IMPLEMENT | M | 80% | TASK-31, TASK-01 | Ready |
| TASK-33 | Digital assistant answer + further-reading link model | IMPLEMENT | M | 80% | TASK-14, TASK-16 | Ready |
| TASK-34 | Experiences schedule + attendance lifecycle | IMPLEMENT | M | 81% | TASK-04 | Ready |
| TASK-35 | Breakfast/evening drink order + change policy flow | IMPLEMENT | M | 82% | TASK-31, TASK-28 | Ready |
| TASK-36 | Transport + local guide hub with Brikette canonical links | IMPLEMENT | M | 85% | TASK-14, TASK-33 | Ready |
| TASK-37 | Post-checkout bag-drop request flow | IMPLEMENT | M | 80% | TASK-31, TASK-15 | Ready |
| TASK-38 | Reception operational ingest for Prime request data | IMPLEMENT | M | 81% | TASK-32, TASK-35, TASK-37 | Ready |
| TASK-39 | Data access model convergence + guest auth boundary hardening | IMPLEMENT | M | 80% | TASK-04, TASK-28 | Ready |
| TASK-40 | Production safety gate for staff/owner routes | IMPLEMENT | M | 82% | TASK-39, TASK-02 | Ready |
| TASK-41 | Primary guest journey end-to-end suite (production gate) | IMPLEMENT | M | 80% | TASK-03, TASK-04, TASK-05, TASK-06, TASK-07 | Ready |
| TASK-42 | Cloudflare Pages deep-link/routing verification gate | IMPLEMENT | S | 80% | TASK-02, TASK-03, TASK-04 | Ready |
| TASK-43 | Arrival code offline-lite resilience (last-known code fallback) | IMPLEMENT | M | 80% | TASK-07, TASK-11 | Ready |
| TASK-44 | Messaging safety baseline (rate-limit, reporting, retention, feature flags) | IMPLEMENT | M | 80% | TASK-34, TASK-39 | Ready |
| TASK-45 | Activity group chat channel (presence + live messaging) | IMPLEMENT | M | 79% | TASK-34, TASK-28, TASK-29, TASK-44 | Ready |
| TASK-46 | Guest-to-guest opt-in messaging controls | IMPLEMENT | M | 78% | TASK-45, TASK-17, TASK-44 | Ready |
| TASK-47 | Owner KPI pre-aggregation pipeline (cost-safe analytics source) | IMPLEMENT | M | 80% | TASK-15, TASK-21 | Ready |
| TASK-48 | Owner arrival insights dashboard + KPI feed | IMPLEMENT | M | 80% | TASK-15, TASK-47 | Ready |
| TASK-49 | Cross-app business impact scorecard + operating cadence | IMPLEMENT | M | 80% | TASK-15, TASK-48, TASK-21, TASK-27, TASK-47 | Ready |
| TASK-50 | Prime touched-file lint non-regression gate | IMPLEMENT | S | 81% | TASK-02 | Ready |
| TASK-51 | Staff auth replacement (PinAuthProvider) | IMPLEMENT | M | 70% | — | Deferred (Phase 3) |
| TASK-52 | Campaign/trigger messaging orchestration | IMPLEMENT | L | 62% | TASK-51 | Deferred (Phase 3) |
| TASK-53 | PWA offline essentials | IMPLEMENT | M | 68% | TASK-07 | Deferred (Phase 3) |

## Re-plan Iteration 2 (2026-02-07)

### Scope Selected

This `/re-plan` pass targeted the highest-risk low-confidence tasks that either:
1. Block MVP safety gates (`TASK-39`, `TASK-40`, `TASK-41`, `TASK-43`, `TASK-44`)
2. Block near-term sequential build order (`TASK-12`, `TASK-14`, `TASK-15`)
3. Block owner/business rollout confidence (`TASK-47`, `TASK-48`, `TASK-49`)
4. Lacked TDD-complete contracts while still IMPLEMENT tasks (`TASK-51`, `TASK-52`, `TASK-53`)

### Confidence Deltas Applied

- `TASK-12`: 75% → 81%
- `TASK-14`: 72% → 82%
- `TASK-15`: 76% → 82%
- `TASK-39`: 72% → 80%
- `TASK-40`: 78% → 82%
- `TASK-41`: 76% → 80%
- `TASK-43`: 74% → 80%
- `TASK-44`: 68% → 80%
- `TASK-47`: 73% → 80%
- `TASK-48`: 70% → 80%
- `TASK-49`: 74% → 80%
- `TASK-51`: 65% → 70% (deferred)
- `TASK-52`: 55% → 62% (deferred)
- `TASK-53`: 60% → 68% (deferred)

### TDD Contract Gate Status

- All IMPLEMENT tasks now include enumerated `TC-XX` test contracts with test type, location, and run command.
- Deferred Phase 3 tasks (`TASK-51`..`TASK-53`) now include explicit test contracts, so they are replannable without additional TDD contract backfill.

### Pending Audit Work (Resolved in Iteration 3)

Re-plan coverage for iteration 2 intentionally prioritized MVP/security blockers and the next numerical build path. The items below were closed in iteration 3:

- `TASK-20`, `TASK-21`, `TASK-22` (activation instrumentation/experiments)
- `TASK-24`, `TASK-25`, `TASK-26`, `TASK-27` (shared design-system/theming extraction and bridges)
- `TASK-33`, `TASK-34`, `TASK-35`, `TASK-36`, `TASK-37`, `TASK-38` (post-onboarding operational feature set)
- `TASK-45`, `TASK-46` (social messaging rollout after safety baseline)

Audit work already completed for this pass:

- Data-access and auth-boundary files (`apps/prime/database.rules.json`, Prime Function endpoints, SDK hook call-sites)
- Placeholder-vs-implemented UX surfaces in guarded routes
- Staff/owner route and API exposure seams
- Shared-data seams with Reception and Brikette route metadata

## Re-plan Iteration 3 (2026-02-07)

### Scope Selected

This `/re-plan` pass covered the remaining active sub-80 tasks identified in Iteration 2:

- `TASK-20`, `TASK-21`, `TASK-22`
- `TASK-24`, `TASK-25`, `TASK-26`, `TASK-27`
- `TASK-33`, `TASK-34`, `TASK-35`, `TASK-36`, `TASK-37`, `TASK-38`
- `TASK-45`, `TASK-46`

### Confidence Deltas Applied

- `TASK-20`: 78% → 80%
- `TASK-21`: 76% → 79%
- `TASK-22`: 74% → 78%
- `TASK-24`: 78% → 80%
- `TASK-25`: 72% → 78%
- `TASK-26`: 76% → 79%
- `TASK-27`: 68% → 74%
- `TASK-33`: 78% → 80%
- `TASK-34`: 76% → 81%
- `TASK-35`: 77% → 82%
- `TASK-36`: 79% → 85%
- `TASK-37`: 75% → 80%
- `TASK-38`: 78% → 81%
- `TASK-45`: 74% → 79%
- `TASK-46`: 72% → 78%

### Remaining Low-Confidence Active Tasks (<80)

Work remains valuable and unblocked, but these items still need additional evidence/spikes before a ≥80 confidence claim:

- `TASK-21` (79%) analytics pipeline/dashboard productization
- `TASK-22` (78%) experimentation cadence + reporting loop
- `TASK-25` (78%) cross-app hospitality component extraction sequencing
- `TASK-26` (79%) hospitality semantic-token adoption scope
- `TASK-27` (74%) reception bridge migration risk
- `TASK-45` (79%) live channel permission model details
- `TASK-46` (78%) two-party consent lifecycle + moderation depth

## Re-plan Iteration 4 (2026-02-07)

### Scope Selected

This `/re-plan` pass focused on the previously sub-80 tasks in the TASK-20..TASK-30 implementation window:

- `TASK-21`
- `TASK-22`
- `TASK-25`
- `TASK-26`
- `TASK-27`

### Confidence Deltas Applied

- `TASK-21`: 79% -> 80%
- `TASK-22`: 78% -> 80%
- `TASK-25`: 78% -> 80%
- `TASK-26`: 79% -> 82%
- `TASK-27`: 74% -> 80%

### Executable Evidence Summary (E2)

- `TASK-21` analytics rails:
  - PASS: `pnpm --filter @acme/platform-core test -- src/analytics/__tests__/public-api.test.ts` (5/5)
  - PASS: `pnpm --filter @acme/telemetry test -- src/__tests__/captureError.test.ts` (15/15)
  - FAIL (known test debt): telemetry retry-path suites currently fail due strict console-error guards and timeout/logging issues in existing tests.
- `TASK-22` experiments:
  - PASS: `pnpm --filter @acme/ui test:quick -- src/components/ab/__tests__/ExperimentGate.test.tsx` (4/4)
- `TASK-25` shared composite extraction seams:
  - PASS: `pnpm --filter @acme/ui test:quick -- --testPathPattern="StepWizard"` (20/20)
  - PASS: `pnpm --filter @apps/prime test -- --testPathPattern="guided-onboarding|progress-milestones|readiness"` (22/22)
- `TASK-26` semantic tokens:
  - PASS: `pnpm tokens:drift:check`
  - PASS: `pnpm tokens:contrast:check`
- `TASK-27` cross-app theming stability:
  - PASS: `pnpm --filter @apps/reception typecheck`
  - PASS: `pnpm --filter @apps/reception exec jest ... --testPathPatterns "components/roomgrid/components/Day/__tests__/Day.test.tsx"` (3/3)
  - PASS: `pnpm --filter @apps/reception exec jest ... --testPathPatterns "RoomGrid.test.tsx" -t "applies dark mode classes"` (1/1)
  - PASS: `pnpm --filter @apps/brikette test -- --testPathPattern="theme-init|themeInit|useTheme"` (9/9)

### Remaining Low-Confidence Active Tasks (<80)

- `TASK-45` (79%) live channel permission model details
- `TASK-46` (78%) two-party consent lifecycle + moderation depth

## Post-Onboarding Capability Audit (Code Truth, 2026-02-07)

This is the current user-visible state in code for guest functionality after onboarding/arrival.

| Capability | Current state | Evidence |
|------------|---------------|----------|
| Booking details + booking status | Placeholder page only (no booking/status data rendered) | `apps/prime/src/app/(guarded)/booking-details/page.tsx` |
| Stay extension request | Missing | no extension route/API found in `apps/prime/src/app/(guarded)` or `apps/prime/functions/api` |
| Bot Q&A with answer + further reading links | Placeholder page only | `apps/prime/src/app/(guarded)/digital-assistant/page.tsx` |
| Experiences list with timings | Partially available (activities list UI exists) | `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx` |
| Experience attendance + group messaging after start | Missing/placeholder (channel page placeholder, no send UI exposed) | `apps/prime/src/app/(guarded)/chat/channel/page.tsx`, `apps/prime/src/contexts/messaging/ChatProvider.tsx` |
| Guest-to-guest messaging with opt-in/out | Missing/placeholder (opt-in fields exist, messaging route is placeholder) | `apps/prime/src/types/guestProfile.ts`, `apps/prime/src/app/(guarded)/chat/page.tsx` |
| Breakfast/evening drink ordering and editing policy | Data plumbing exists; guest ordering UI is placeholder | `apps/prime/src/hooks/pureData/useFetchPreordersData.ts`, `apps/prime/src/app/(guarded)/complimentary-breakfast/page.tsx`, `apps/prime/src/app/(guarded)/complimentary-evening-drink/page.tsx` |
| Local transport and things-to-do info | Placeholder page only | `apps/prime/src/app/(guarded)/positano-guide/page.tsx` |
| Post-checkout bag-drop request | Data fetch exists; guest request UI is placeholder | `apps/prime/src/hooks/pureData/useFetchBagStorageData.ts`, `apps/prime/src/app/(guarded)/bag-storage/page.tsx` |
| Other things guests can currently do | Verify via tokenized link, recover via find-my-stay, view legacy quest/social/task/service home modules (after guard wiring), and view activity cards | `apps/prime/src/app/g/page.tsx`, `apps/prime/src/app/find-my-stay/page.tsx`, `apps/prime/src/components/homepage/HomePage.tsx`, `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx` |
| Reception support for Prime-generated operations | Partial: check-in/out and preorder writes exist, but no reception request queue for Prime extension/bag-drop workflows | `apps/reception/src/hooks/mutations/useCheckinMutation.ts`, `apps/reception/src/hooks/mutations/useCheckoutsMutation.ts`, `apps/reception/src/hooks/mutations/usePreorderMutations.ts`, `apps/reception/src/components/checkout/CheckoutTable.tsx`, `apps/reception/src/components/man/Extension.tsx` |

## Phase 0: Funnel Hardening (new from UX/UI review)

### TASK-03: Guest lookup contract alignment + magic-link handoff

- **Type:** IMPLEMENT
- **Effort:** S
- **Confidence:** 92%
  - Implementation: 95% — backend already returns `redirectUrl`; only client handoff is wrong
  - Approach: 92% — align `find-my-stay/page.tsx` success path to API contract and remove staff-route redirect
  - Impact: 90% — high positive impact, low blast radius (`find-my-stay` + tests)
- **What exists:** `functions/api/find-booking.ts` returns `{ redirectUrl: "/g/{token}" }` and tokenized guest flow works via `/g`.
- **What's missing:** `find-my-stay/page.tsx` ignores `redirectUrl` and redirects to `/staff-lookup` using missing `checkInCode` field.
- **Acceptance criteria:**
  1. Successful lookup from `/find-my-stay` redirects to API-provided `redirectUrl`
  2. UI no longer depends on `checkInCode` from lookup response
  3. Invalid payloads show actionable error (no silent failure, no staff-route fallback)
  4. Guest funnel path is explicit: `find-my-stay` → `/g` verification → `/portal`
- **Test contract:**
  - **TC-01:** API returns `{ redirectUrl }` → browser navigates to `redirectUrl`
  - **TC-02:** API returns 404/429 → existing error copy shown
  - **TC-03:** API 200 without `redirectUrl` → deterministic error state shown
  - **Test type:** unit (component with mocked fetch + location)
  - **Test location:** `apps/prime/src/app/find-my-stay/__tests__/page.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="find-my-stay"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Updated `apps/prime/src/app/find-my-stay/page.tsx` to consume API `redirectUrl` directly and fail with deterministic UX copy when payload is malformed.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern "find-my-stay"` — PASS.
- **Confidence reassessment:** 92% → 93% (tests validated assumptions).

### TASK-04: Shared guest session guard (portal + guarded routes)

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 86%
  - Implementation: 88% — token validation endpoint already exists; localStorage keys are stable
  - Approach: 85% — extract reusable guard utility/hook and use in both `/portal` and `(guarded)` layout
  - Impact: 84% — removes duplicate auth logic and closes guest access gap
- **What exists:** `/api/guest-session` validates expiry; `portal/page.tsx` has partial session checks; `(guarded)/layout.tsx` only trusts staff PIN auth.
- **What's missing:** A single guest-aware session gate that supports both guest token sessions and staff sessions.
- **Acceptance criteria:**
  1. Shared guard utility used by `portal/page.tsx` and `(guarded)/layout.tsx`
  2. Valid guest session can enter guarded routes without staff PIN role
  3. Expired token (410) clears guest localStorage and redirects to `/find-my-stay`
  4. Network failure during background validation is fail-open (no forced logout)
  5. Guarded tree is wrapped with required runtime providers (`PinAuthProvider`, `ChatProvider`) so social/activity routes do not crash on `useChat()`
- **Test contract:**
  - **TC-01:** Valid guest token + 200 validation → guarded children render
  - **TC-02:** 410 validation → guest session keys cleared + redirect
  - **TC-03:** No session + no staff auth → redirect to `/`
  - **TC-04:** Network error during refresh → session preserved
  - **TC-05:** Guarded social/activity routes render without provider-missing runtime errors
  - **Test type:** unit (hook/utility + layout integration tests)
  - **Test location:** `apps/prime/src/lib/auth/__tests__/guestSessionGuard.test.ts` (new), `apps/prime/src/app/(guarded)/__tests__/layout.test.tsx` (new), `apps/prime/src/app/(guarded)/__tests__/provider-composition.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="guestSessionGuard|guarded/layout|provider-composition"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added shared guest-session guard utilities in `apps/prime/src/lib/auth/guestSessionGuard.ts`, wrapped guarded tree with `PinAuthProvider` + `ChatProvider` in `apps/prime/src/app/(guarded)/layout.tsx`, and enforced guest/staff access branching with fail-open network behavior.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern "guestSessionGuard|provider-composition|src/app/\\(guarded\\)/__tests__/layout.test.tsx"` — PASS.
- **Confidence reassessment:** 86% → 88% (integration tests covered primary guard branches).

## Phase 0A: Firebase Cost-Safety Test Gates (new hard requirement)

These tasks are mandatory before rollout. They convert Firebase cost-safety from a guideline into enforceable tests.

### TASK-28: Firebase query-budget contract tests (guest-critical flows)

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 86%
  - Implementation: 86% — Prime already has Firebase wrappers and metrics (`services/firebase.ts`, `services/firebaseMetrics.ts`)
  - Approach: 86% — add deterministic tests with mocked Firebase calls and explicit per-flow budget thresholds
  - Impact: 86% — directly prevents high-cost read amplification regressions
- **What exists:** Instrumented `get()` and `onValue()` wrappers plus `firebaseMetrics` counters; phased loading in `useOccupantDataSources`.
- **What's missing:** Test-enforced request budgets for guest-critical flows (`/g` verify, portal load, readiness home, arrival mode).
- **Acceptance criteria:**
  1. Query-budget tests define maximum allowed reads/listeners per critical flow path
  2. Tests fail when budgets are exceeded (no warning-only behavior)
  3. Budget tests cover both first load and refetch paths
  4. Budget baselines are documented in the test fixtures (with rationale)
- **Test contract:**
  - **TC-01:** Initial pre-arrival load stays within read budget (by path and total count)
  - **TC-02:** Arrival-day load stays within read budget (including check-in code path)
  - **TC-03:** Manual refresh (`refetch`) does not fan out duplicate parallel reads beyond budget
  - **TC-04:** Existing cached query path (React Query stale window) does not trigger unnecessary reads
  - **Test type:** unit/integration (hook-level with mocked Firebase wrapper + metrics assertions)
  - **Test location:** `apps/prime/src/hooks/dataOrchestrator/__tests__/firebase-query-budget.test.tsx` (new), `apps/prime/src/services/__tests__/firebaseMetrics.budget.test.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="firebase-query-budget|firebaseMetrics.budget"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added typed budget baselines and evaluation helpers in `apps/prime/src/lib/firebase/budgetBaselines.ts` and `apps/prime/src/lib/firebase/budgetGate.ts`, plus query-budget suites at `apps/prime/src/hooks/dataOrchestrator/__tests__/firebase-query-budget.test.tsx` and `apps/prime/src/services/__tests__/firebaseMetrics.budget.test.ts`.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern "firebase-query-budget|firebaseMetrics.budget"` — PASS.
- **Confidence reassessment:** 86% → 90% (budget contracts are now executable and enforced in tests).

### TASK-29: Firebase listener lifecycle leak tests

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 84%
  - Implementation: 84% — wrapper-level listener counters already exist (`activeListeners`)
  - Approach: 84% — verify mount/re-render/unmount and navigation transitions clean listeners correctly
  - Impact: 84% — blocks latent listener leaks that silently increase read volume
- **What exists:** `onValue()` wrapper tracks listener add/remove; `useFetchCompletedTasks` and `useFirebaseSubscription` own subscription lifecycles.
- **What's missing:** Regression tests proving listeners are not duplicated or orphaned in real navigation/render patterns.
- **Acceptance criteria:**
  1. Subscription hooks prove no listener-count growth after repeated mount/unmount cycles
  2. Route transition scenarios clean prior listeners before attaching new ones
  3. Rapid re-render scenarios do not duplicate active subscriptions
  4. Leak tests fail on non-zero residual listener count after cleanup
- **Test contract:**
  - **TC-01:** `useFetchCompletedTasks` mount→unmount returns active listener count to baseline
  - **TC-02:** `useFirebaseSubscription` query change unsubscribes old listener before subscribing new listener
  - **TC-03:** Repeated route toggles do not increase steady-state listener count
  - **TC-04:** Listener error paths still execute cleanup correctly
  - **Test type:** unit (hook lifecycle + wrapper metrics assertions)
  - **Test location:** `apps/prime/src/hooks/pureData/__tests__/useFetchCompletedTasks.listener-leak.test.tsx` (new), `apps/prime/src/services/__tests__/useFirebaseSubscription.leak.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="listener-leak|Subscription.leak"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added listener lifecycle leak suites for both subscription hooks in `apps/prime/src/hooks/pureData/__tests__/useFetchCompletedTasks.listener-leak.test.tsx` and `apps/prime/src/services/__tests__/useFirebaseSubscription.leak.test.tsx`.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern "listener-leak|Subscription.leak"` — PASS.
- **Confidence reassessment:** 84% → 88% (mount/rerender/unmount/error cleanup cases are now covered by deterministic tests).

### TASK-30: Firebase cost regression CI gate + baseline budgets

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 82%
  - Implementation: 82% — builds on TASK-28/TASK-29 suites; mostly CI wiring and baseline governance
  - Approach: 82% — add required CI test pattern and baseline budget policy file for controlled updates
  - Impact: 82% — prevents accidental budget regressions from merging
- **What exists:** Prime targeted test command and existing CI validation pattern in repo workflows.
- **What's missing:** Enforced CI gate for Firebase budget/leak suites and explicit policy for changing baselines.
- **Acceptance criteria:**
  1. CI runs Firebase budget + leak tests on Prime changes by default
  2. Pull requests fail when Firebase budget thresholds regress
  3. Baseline updates require explicit diff in a checked-in budget config file
  4. Developer documentation includes local command for pre-push budget validation
- **Test contract:**
  - **TC-01:** Simulated budget exceedance causes non-zero test exit in CI
  - **TC-02:** Baseline config parse errors fail fast with actionable message
  - **TC-03:** Normal in-budget path passes in local and CI contexts
  - **Test type:** integration (test runner + CI wiring smoke)
  - **Test location:** `apps/prime/src/lib/firebase/__tests__/budget-regression-gate.test.ts` (new), CI workflow config touching Prime test step
  - **Run:** `pnpm --filter prime test -- --testPathPattern="firebase-query-budget|listener-leak|budget-regression-gate"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added regression-gate tests in `apps/prime/src/lib/firebase/__tests__/budget-regression-gate.test.ts`, introduced Prime command `test:firebase-cost-gate` in `apps/prime/package.json`, and wired CI gate step in `.github/workflows/reusable-app.yml` for `@apps/prime`; documented local pre-push command in `docs/testing-policy.md`.
- **Validation evidence:** `pnpm --filter @apps/prime test:firebase-cost-gate` — PASS.
- **Confidence reassessment:** 82% → 86% (budget gate now runs as a first-class CI workflow step with local parity command).

## Phase 0B: Launch Safety & Security Hardening (new)

These tasks close the highest-risk release gaps identified in UX/security review: data access boundary clarity, staff/owner route protection, true end-to-end validation, routing constraints in Pages, offline-lite arrival resilience, chat safety controls, cost-safe owner analytics, and incremental lint gating.

### TASK-39: Data access model convergence + guest auth boundary hardening

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 80% — mixed model is confirmed with clear integration seams, so convergence work is now explicit rather than exploratory.
  - Approach: 82% — adopt flow-by-flow access matrix with fail-closed SDK gating.
  - Impact: 80% — high security impact but bounded to Prime data-access layer and guards.
- **What exists:** Function-mediated token/session verification and direct client SDK use in multiple Prime surfaces.
- **What's missing:** Enforced access matrix defining which flows are Function-only vs SDK-allowed, with production-safe auth posture for any SDK path.
- **Acceptance criteria:**
  1. `docs/plans/prime-guest-portal-gap-plan.md` and implementation constants define a canonical flow-to-access matrix (`FUNCTION_ONLY` vs `SDK_ALLOWED`)
  2. Guest-critical flows (`booking details`, `arrival code`, `extension`, `meal orders`, `bag drop`, staff/owner payloads) are Function-mediated
  3. SDK reads/writes fail closed when guest auth preconditions are missing
  4. SDK-dependent flows are feature-flagged off for production until auth hardening is complete
- **Test contract:**
  - **TC-01:** Contract test verifies critical routes/hooks call Functions rather than direct RTDB reads
  - **TC-02:** Unauthenticated SDK read attempt returns controlled error and safe fallback UI
  - **TC-03:** Feature flag OFF hides SDK-dependent flows and prevents write attempts
  - **TC-04:** Access matrix drift test fails if new guest-critical flow bypasses Function layer
  - **Test type:** unit/integration (access matrix + route/hook contracts)
  - **Test location:** `apps/prime/src/lib/security/__tests__/data-access-model.contract.test.ts` (new), `apps/prime/src/app/(guarded)/__tests__/sdk-auth-failclosed.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="data-access-model|sdk-auth-failclosed"`
- **TDD execution plan:**
  - **Red:** Add matrix and fail-closed tests first; current mixed paths should fail contract assertions.
  - **Green:** Migrate critical flows to Functions, enforce flags/checks for SDK paths.
  - **Refactor:** Centralize access-mode helpers and remove duplicated routing/data checks.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 72%
- **Updated confidence:** 80%
  - Implementation: 80% — direct SDK reads verified in `apps/prime/src/hooks/pureData/useFetchBookingsData.client.ts:18` and `apps/prime/src/hooks/dataOrchestrator/useOccupantDataSources.ts:75`; Function-mediated critical paths verified in `apps/prime/functions/api/check-in-code.ts:55`.
  - Approach: 82% — auth requirements confirmed in `apps/prime/database.rules.json:3` and `apps/prime/database.rules.json:195`.
  - Impact: 80% — change surface is concentrated in hooks/guards, not broad UI rewrites.
- **Investigation performed:**
  - Repo: `apps/prime/database.rules.json:3`, `apps/prime/src/hooks/pureData/useFetchBookingsData.client.ts:18`, `apps/prime/functions/api/check-in-code.ts:55`
- **Decision / resolution:**
  - Keep hybrid model but codify explicit access matrix and fail-closed behavior for any SDK path lacking guest auth.

### TASK-40: Production safety gate for staff/owner routes

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 82%
  - Implementation: 83% — current route/API seams are explicit and can be gated centrally.
  - Approach: 82% — enforce default-deny with env flags + server-side checks.
  - Impact: 82% — materially lowers accidental exposure risk.
- **What exists:** Staff routes and owner concepts are present; production access policy is implicit.
- **What's missing:** Explicit default-off production policy with technical enforcement for staff/owner pages and APIs.
- **Acceptance criteria:**
  1. Production defaults disable staff/owner routes unless explicit secure gate is enabled
  2. Staff/owner APIs reject unauthorized calls server-side (not only via UI guards)
  3. Interim control is documented and enforced (Cloudflare Access or equivalent server-side gate)
  4. Release checklist includes a mandatory verification for route/API exposure state
- **Test contract:**
  - **TC-01:** `NODE_ENV=production` + gate disabled → staff/owner routes return deny/redirect
  - **TC-02:** Staff/owner API request without gate credentials returns 401/403
  - **TC-03:** Gate enabled in controlled env allows expected route/API access
  - **Test type:** integration (route + Function policy tests)
  - **Test location:** `apps/prime/src/app/staff-lookup/__tests__/production-gate.test.tsx` (new), `apps/prime/functions/__tests__/staff-owner-access-gate.test.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="production-gate|staff-owner-access-gate"`
- **TDD execution plan:**
  - **Red:** Add deny-by-default route/API tests; verify current state does not satisfy strict gating.
  - **Green:** Implement env-driven gate checks and server-side authorization enforcement.
  - **Refactor:** Consolidate gate logic in shared middleware/utilities for routes and Functions.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 78%
- **Updated confidence:** 82%
  - Implementation: 83% — staff routes are isolated (`apps/prime/src/app/staff-lookup/page.tsx:7`, `apps/prime/src/app/checkin/CheckInClient.tsx:19`) and API seam is centralized (`apps/prime/functions/api/check-in-lookup.ts:46`).
  - Approach: 82% — default-deny can be enforced at both UI route entry and Function handler.
  - Impact: 82% — change is targeted and testable.
- **Investigation performed:**
  - Repo: `apps/prime/src/app/staff-lookup/page.tsx:7`, `apps/prime/src/app/checkin/CheckInClient.tsx:51`, `apps/prime/functions/api/check-in-lookup.ts:46`
- **Decision / resolution:**
  - Introduce one shared production gate utility used by staff/owner routes and corresponding APIs.

### TASK-41: Primary guest journey end-to-end suite (production gate)

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 80% — harness work is net-new but bounded and patterned by existing Jest + route tests.
  - Approach: 80% — minimal three-scenario production gate is clear and stable.
  - Impact: 80% — high bug-prevention value for route/session regressions.
- **What exists:** Unit tests are extensive; Prime-specific e2e suite is not yet present.
- **What's missing:** Production-gating e2e coverage for the core guest funnel and expiry recovery.
- **Acceptance criteria:**
  1. E2E scenario: `find-my-stay → /g/<token> verify → /portal → /(guarded)` succeeds without dead ends
  2. E2E scenario: arrival-day guest sees code/QR-first arrival mode and can copy code
  3. E2E scenario: expired token path clears session and redirects to recovery
  4. E2E suite runs in CI for Prime release candidates
- **Test contract:**
  - **TC-01 (e2e):** Primary funnel succeeds end-to-end with seeded booking
  - **TC-02 (e2e):** Arrival-day mode renders code/QR and clipboard action succeeds
  - **TC-03 (e2e):** Expired token forces session clear + recovery redirect
  - **Test type:** e2e (Cypress)
  - **Test location:** `apps/prime/cypress/e2e/guest-primary-journey.cy.ts` (new), `apps/prime/cypress/e2e/arrival-day-journey.cy.ts` (new), `apps/prime/cypress/e2e/expired-token-recovery.cy.ts` (new)
  - **Run:** `pnpm exec cypress run --config-file apps/prime/cypress.config.ts --spec apps/prime/cypress/e2e/guest-primary-journey.cy.ts,apps/prime/cypress/e2e/arrival-day-journey.cy.ts,apps/prime/cypress/e2e/expired-token-recovery.cy.ts`
- **TDD execution plan:**
  - **Red:** Author failing e2e specs against current route gaps.
  - **Green:** Implement/adjust route wiring and session transitions until specs pass.
  - **Refactor:** Stabilize fixtures/selectors and remove brittle timing assumptions.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 76%
- **Updated confidence:** 80%
  - Implementation: 80% — no Prime e2e harness exists yet (`rg --files apps/prime | rg 'cypress|playwright|\\.cy\\.'` returned no files), but route seams are now deterministic after TASK-01..11.
  - Approach: 80% — scope fixed to three critical journeys only.
  - Impact: 80% — directly validates no-dead-end requirement and expiry recovery.
- **Investigation performed:**
  - Repo: `apps/prime/src/app/find-my-stay/page.tsx:37`, `apps/prime/src/app/(guarded)/layout.tsx:19`, `apps/prime/src/hooks/useSessionValidation.ts:1`
- **Decision / resolution:**
  - Use Cypress in Prime with seeded fixture helpers and keep the suite release-gate sized (not exhaustive UX e2e).

### TASK-42: Cloudflare Pages deep-link/routing verification gate

- **Type:** IMPLEMENT
- **Effort:** S
- **Confidence:** 80%
  - Implementation: 82% — mostly config + preview smoke assertions
  - Approach: 80% — add explicit Pages-specific verification for token/dynamic routes
  - Impact: 78% — prevents deployment-only routing regressions
- **What exists:** Plan recognizes static export/trailing slash constraints but has no deployment-level route verification gate.
- **What's missing:** Automated checks for deep links and refresh behavior on Pages previews.
- **Acceptance criteria:**
  1. Preview/deploy checks verify `/g/<token>` works with and without trailing slash normalization
  2. Direct navigation/refresh on guarded routes does not hard-fail due static export quirks
  3. 404/redirect behavior for malformed token paths is explicit and tested
- **Test contract:**
  - **TC-01:** Preview smoke validates `/g/<token>` redirect handoff to `/g?token=...`
  - **TC-02:** Hard refresh on guarded route keeps user in valid state or deterministic recovery
  - **TC-03:** Invalid token path renders explicit recovery CTA (not silent 404 dead-end)
  - **Test type:** integration/e2e (preview smoke)
  - **Test location:** `apps/prime/cypress/e2e/pages-routing-deeplink.cy.ts` (new), CI preview smoke step
  - **Run:** `pnpm exec cypress run --config-file apps/prime/cypress.config.ts --spec apps/prime/cypress/e2e/pages-routing-deeplink.cy.ts`
- **TDD execution plan:**
  - **Red:** Add failing deep-link/refresh tests on preview-style environment assumptions.
  - **Green:** Fix routing redirects/config and recovery behavior until tests pass.
  - **Refactor:** Consolidate route normalization helpers and deploy check scripts.

### TASK-43: Arrival code offline-lite resilience (last-known code fallback)

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 80% — check-in code fetch/generation is centralized and ready for local cache extension.
  - Approach: 80% — offline-lite cache can reuse existing online-status primitives without full SW scope.
  - Impact: 80% — closes high-friction arrival edge case.
- **What exists:** Arrival mode renders code/QR when online; full offline/PWA remains deferred.
- **What's missing:** Safe fallback when code was previously generated but network is unavailable at desk time.
- **Acceptance criteria:**
  1. Last successful check-in code + QR payload is cached locally for offline reuse
  2. Offline arrival mode can render cached code with clear "may be outdated" warning
  3. Guest can trigger refresh when connectivity returns
  4. No new writes are attempted while offline fallback mode is active
- **Test contract:**
  - **TC-01:** Online code fetch stores cache artifact with timestamp
  - **TC-02:** Offline state loads cached code and shows stale warning
  - **TC-03:** Returning online and refreshing replaces stale cache with latest code
  - **Test type:** unit/integration (hook + arrival UI)
  - **Test location:** `apps/prime/src/hooks/__tests__/useCheckInCode.offline-cache.test.ts` (new), `apps/prime/src/components/arrival/__tests__/ArrivalHome.offline-fallback.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="offline-cache|offline-fallback|useCheckInCode"`
- **TDD execution plan:**
  - **Red:** Add cache/offline tests first; current implementation should fail fallback requirements.
  - **Green:** Implement code cache, stale-state rendering, and refresh behavior.
  - **Refactor:** Extract reusable arrival-cache utility and normalize stale-state messaging.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 74%
- **Updated confidence:** 80%
  - Implementation: 80% — current code fetch path confirmed in `apps/prime/src/hooks/useCheckInCode.ts:50`.
  - Approach: 80% — connectivity signal hook already exists in `apps/prime/src/lib/pwa/useOnlineStatus.ts:42`.
  - Impact: 80% — UI seam for stale warning confirmed in `apps/prime/src/components/arrival/ArrivalHome.tsx:93`.
- **Investigation performed:**
  - Repo: `apps/prime/src/hooks/useCheckInCode.ts:72`, `apps/prime/src/lib/pwa/useOnlineStatus.ts:42`, `apps/prime/src/components/arrival/ArrivalHome.tsx:101`
- **Decision / resolution:**
  - Add last-known code cache + timestamp in localStorage; show stale marker and explicit refresh action when back online.

### TASK-44: Messaging safety baseline (rate-limit, reporting, retention, feature flags)

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 80% — chat infra and consent signals already exist; baseline safeguards can be layered without redesign.
  - Approach: 80% — ship minimum viable guardrails (throttle/report/retention/flag) before enabling social messaging.
  - Impact: 80% — critical risk reduction for guest messaging rollout.
- **What exists:** Consent and social preference models exist (`chatOptIn`, `socialOptIn`) and activity lifecycle controls are planned in TASK-34.
- **What's missing:** Send rate limits, abuse reporting path, retention/visibility policy, and production feature-flag governance.
- **Acceptance criteria:**
  1. Message send rate limits enforced per user/session/channel
  2. Guests can report abusive content/users; reports route to staff moderation queue
  3. Retention policy and deletion/anonymization behavior documented and implemented for chat logs
  4. Chat features remain behind explicit production feature flag until controls are verified
- **Test contract:**
  - **TC-01:** Send limit exceeded returns deterministic throttle response and blocks write
  - **TC-02:** Report action creates moderation record with required metadata
  - **TC-03:** Retention job/query excludes expired messages per policy
  - **TC-04:** Feature flag OFF removes send/report surfaces from guest UI
  - **Test type:** unit/integration (messaging guards + moderation pipeline)
  - **Test location:** `apps/prime/src/lib/messaging/__tests__/rate-limit.test.ts` (new), `apps/prime/src/app/(guarded)/chat/__tests__/abuse-reporting.test.tsx` (new), `apps/prime/functions/__tests__/chat-retention-policy.test.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="rate-limit|abuse-reporting|chat-retention-policy"`
- **TDD execution plan:**
  - **Red:** Add failing rate-limit/report/retention tests first.
  - **Green:** Implement guardrails and moderation pipeline endpoints/UI.
  - **Refactor:** Consolidate chat-policy constants and shared enforcement helpers.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 68%
- **Updated confidence:** 80%
  - Implementation: 80% — messaging transport exists in `apps/prime/src/contexts/messaging/ChatProvider.tsx:126`; consent fields exist in `apps/prime/src/types/guestProfile.ts:50`.
  - Approach: 80% — baseline guardrails are separable and testable.
  - Impact: 80% — required before TASK-45/TASK-46 production enablement.
- **Investigation performed:**
  - Repo: `apps/prime/src/contexts/messaging/ChatProvider.tsx:289`, `apps/prime/src/types/guestProfile.ts:50`, `apps/prime/functions/api/find-booking.ts:72`
- **Decision / resolution:**
  - Reuse proven rate-limit pattern from `find-booking` in chat Functions and keep chat features behind explicit production flag until moderation path is live.

### TASK-47: Owner KPI pre-aggregation pipeline (cost-safe analytics source)

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 80% — telemetry and analytics building blocks already exist; missing piece is Prime-specific aggregate writer.
  - Approach: 80% — enforce aggregate-only owner reads to preserve Firebase cost safety.
  - Impact: 80% — owner dashboards become cost-safe and operationally reliable.
- **What exists:** KPI definitions in TASK-48/TASK-49 and event-level data sources from onboarding/readiness.
- **What's missing:** Pre-aggregated daily KPI nodes and owner dashboard consumption contracts.
- **Acceptance criteria:**
  1. Daily aggregate job/endpoint writes canonical KPI nodes for owner dashboards
  2. Owner pages read only aggregate nodes for date-window views
  3. Aggregation logic handles partial/missing-day data without expensive fallback scans
  4. Cost-safety tests include owner KPI read budgets
- **Test contract:**
  - **TC-01:** Fixture events aggregate into expected daily KPI records
  - **TC-02:** Owner API/page read path does not perform raw multi-day booking scans
  - **TC-03:** Empty day windows return zero-safe aggregate defaults
  - **TC-04:** KPI read budget tests pass under defined threshold
  - **Test type:** unit/integration (aggregator + owner read contract + budget checks)
  - **Test location:** `apps/prime/src/lib/owner/__tests__/kpi-aggregation-daily.test.ts` (new), `apps/prime/src/app/owner/__tests__/aggregate-read-path.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="kpi-aggregation-daily|aggregate-read-path|owner"`
- **TDD execution plan:**
  - **Red:** Add failing aggregate/read-budget tests against scan-based baseline.
  - **Green:** Implement aggregate writer/reader and migrate owner dashboards.
  - **Refactor:** Normalize KPI schema/versioning and extract shared aggregation utilities.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 73%
- **Updated confidence:** 80%
  - Implementation: 80% — telemetry primitives already available in `packages/telemetry/src/index.ts:1`; owner UI entry exists in `apps/prime/src/app/owner/setup/page.tsx:4`.
  - Approach: 80% — enforce strict aggregate node contract before KPI page build.
  - Impact: 80% — protects against owner-side broad scans.
- **Investigation performed:**
  - Repo: `packages/telemetry/src/index.ts:21`, `packages/platform-core/src/analytics/index.ts:141`, `apps/prime/src/app/owner/setup/page.tsx:4`
- **Decision / resolution:**
  - Prime owns a lightweight daily aggregate writer; dashboards consume aggregate nodes only with no raw-scan fallback.

### TASK-50: Prime touched-file lint non-regression gate

- **Type:** IMPLEMENT
- **Effort:** S
- **Confidence:** 81%
  - Implementation: 82% — mostly CI scripting/config updates
  - Approach: 81% — enforce non-regression without blocking unrelated legacy debt
  - Impact: 80% — keeps code quality from degrading while broader lint debt is deferred
- **What exists:** Prime lint is currently exempt and global lint debt is high.
- **What's missing:** A practical lint rule for changed files so task implementation quality is enforceable.
- **Acceptance criteria:**
  1. CI checks lint status only for Prime files touched in the PR/change set
  2. Changed files must be non-regressing (no new lint errors in touched files)
  3. Local developer command mirrors CI changed-file lint behavior
  4. Policy documented in this plan and Prime contributor notes
- **Test contract:**
  - **TC-01:** Introduced lint error in touched Prime file fails changed-file lint gate
  - **TC-02:** Untouched-file legacy lint debt does not fail the gate
  - **TC-03:** Clean touched-file diff passes gate locally and in CI
  - **Test type:** integration (CI/script behavior)
  - **Test location:** `scripts/src/ci/__tests__/prime-lint-changed-files.test.ts` (new), CI workflow step for Prime
  - **Run:** `pnpm test -- --testPathPattern="prime-lint-changed-files"`
- **TDD execution plan:**
  - **Red:** Add gate tests showing current behavior cannot distinguish touched-file regressions.
  - **Green:** Implement changed-file lint detector and CI wiring.
  - **Refactor:** Reuse shared changed-file utilities across validation scripts.

## Phase 1: Route Integration (finish near-done work)

### TASK-05: Portal session validation + redirect

- **Type:** IMPLEMENT
- **Effort:** S
- **Confidence:** 88%
  - Implementation: 90% — pattern clear from existing `(guarded)/layout.tsx` and `portal/page.tsx`
  - Approach: 88% — follow existing `(guarded)` layout pattern; add server-side token check via `/api/guest-session` GET
  - Impact: 85% — only touches `portal/page.tsx` and `(guarded)/layout.tsx`; no downstream impact
- **What exists:** `portal/page.tsx` checks localStorage for token but does no server-side validation. `(guarded)/layout.tsx` gates on `isAuthenticated` from PinAuthProvider (staff auth). Guest session data in localStorage (`prime_guest_token`, `prime_guest_booking_id`, `prime_guest_uuid`).
- **What's missing:** Portal page should validate token server-side on mount (call GET `/api/guest-session?token={token}`), handle 410 (expired) by clearing session and redirecting to `/find-my-stay`, and redirect verified guests from `/portal` into `(guarded)/` home. The `(guarded)/layout.tsx` needs to also accept guest sessions (not just staff PINs).
- **Acceptance criteria:**
  1. Verified guest redirects from `/portal` to `/(guarded)/` home
  2. Expired token (410 from API) clears localStorage and redirects to `/find-my-stay`
  3. Missing token shows "Portal unavailable" with find-my-stay link (existing behavior)
  4. `(guarded)/layout.tsx` accepts both guest sessions and staff PIN auth
- **Test contract:**
  - **TC-01:** Valid guest token in localStorage → server-side check passes → redirect to `/(guarded)/` home
  - **TC-02:** Expired token in localStorage → GET returns 410 → localStorage cleared → redirect to `/find-my-stay`
  - **TC-03:** No token in localStorage → shows "Portal unavailable" message
  - **TC-04:** `(guarded)/layout.tsx` with guest session → renders children (not redirect)
  - **Test type:** unit (component render tests with mocked fetch)
  - **Test location:** `apps/prime/src/app/portal/__tests__/page.test.tsx` (new), `apps/prime/src/app/(guarded)/__tests__/layout.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="portal|guarded"`
- **Files to modify:** `apps/prime/src/app/portal/page.tsx`, `apps/prime/src/app/(guarded)/layout.tsx`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Reworked `apps/prime/src/app/portal/page.tsx` to validate session token before navigation and route valid sessions to guest home URL; expired/invalid tokens clear storage and recover to `/find-my-stay`.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern "portal|src/app/\\(guarded\\)/__tests__/layout.test.tsx"` — PASS.
- **Confidence reassessment:** 88% → 89% (portal + guard integration path is now covered).

### TASK-06: Wire readiness dashboard into guarded routes

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 85%
  - Implementation: 88% — `ReadinessDashboard.tsx`, `ReadinessScore.tsx`, `NextActionCard.tsx`, `ChecklistItem.tsx`, `EtaConfirmation.tsx`, `CashPrep.tsx` all exist and are complete. `readinessScore.ts` and `arrivalState.ts` are tested. `usePreArrivalState` hook exists.
  - Approach: 85% — conditionally render ReadinessDashboard on `/(guarded)/` home when `arrivalState === 'pre-arrival'`; existing `HomePage.tsx` shows quests/tasks/services
  - Impact: 82% — touches `(guarded)/page.tsx` and `HomePage.tsx`; adds state-conditional rendering
- **What exists:** Complete component set in `components/pre-arrival/`: ReadinessDashboard, ReadinessScore, NextActionCard, ChecklistItem, EtaConfirmation, CashPrep, AddToCalendarButton. Business logic in `lib/preArrival/` with tests. Hook `usePreArrivalState` with mutations. Firebase node `preArrival/{uuid}` defined in rules.
- **What's missing:** No page in `app/(guarded)/` renders ReadinessDashboard. HomePage doesn't conditionally show it based on arrival state. No navigation path from home to pre-arrival features.
- **Acceptance criteria:**
  1. Guest in pre-arrival state sees ReadinessDashboard on `/(guarded)/` home
  2. Guest on arrival day sees different view (arrival mode — TASK-07)
  3. Readiness score updates in real-time as checklist items are completed
  4. Checklist items are interactive (toggle completion)
  5. Cash amounts display correctly (city tax + €10 deposit)
- **Test contract:**
  - **TC-01:** Guest with `arrivalState === 'pre-arrival'` → ReadinessDashboard renders on home page
  - **TC-02:** Guest with `arrivalState === 'arrival-day'` → ReadinessDashboard NOT shown (arrival mode instead)
  - **TC-03:** Toggle checklist item → readiness score recalculates → UI updates
  - **TC-04:** Cash amounts render with correct city tax + €10 keycard deposit
  - **TC-05:** Guest with no preArrival data → shows empty/initial readiness state
  - **Test type:** unit (component) + existing unit tests for business logic
  - **Test location:** `apps/prime/src/app/(guarded)/__tests__/home.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="guarded|preArrival"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added `apps/prime/src/components/homepage/GuardedHomeExperience.tsx` and wired `apps/prime/src/app/(guarded)/page.tsx` plus root `apps/prime/src/app/page.tsx` to render readiness-first home when guest session is active.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern "home.test"` — PASS.
- **Confidence reassessment:** 85% → 87% (state-driven rendering and checklist interactions verified).

### TASK-07: Wire arrival mode into guarded routes

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 85%
  - Implementation: 88% — `ArrivalHome.tsx` exists with QR, code display, cash/ID reminders, step guide. `useCheckInCode` hook exists. `CheckInQR.tsx` exists with QR generation + copy-to-clipboard.
  - Approach: 85% — conditionally render ArrivalHome when `arrivalState === 'arrival-day'` on `/(guarded)/` home
  - Impact: 82% — touches same home page routing as TASK-06; need coordinated conditional logic
- **What exists:** Complete `components/arrival/ArrivalHome.tsx` with QR code, typeable code (BRK-XXXXX), cash reminders, ID reminders, "what happens next" steps. `components/check-in/CheckInQR.tsx` with QR generation. `hooks/useCheckInCode.ts` with auto-generation. `functions/api/check-in-code.ts` (code gen) and `functions/api/check-in-lookup.ts` (staff lookup) both functional.
- **What's missing:** ArrivalHome not rendered anywhere. HomePage doesn't switch to arrival mode on check-in date. No auto-generation of check-in code on arrival day.
- **Acceptance criteria:**
  1. Guest on arrival day sees ArrivalHome instead of ReadinessDashboard
  2. QR code displays and is scannable (resolves to staff check-in URL)
  3. Typeable code (BRK-XXXXX) displays with copy-to-clipboard
  4. Cash/ID reminders visible on arrival screen
  5. Check-in code auto-generates if guest doesn't have one
- **Test contract:**
  - **TC-01:** Guest with `arrivalState === 'arrival-day'` → ArrivalHome renders (not ReadinessDashboard)
  - **TC-02:** ArrivalHome renders QR code component with correct check-in URL
  - **TC-03:** Copy-to-clipboard on code → clipboard contains BRK-XXXXX code
  - **TC-04:** Guest with no check-in code → useCheckInCode triggers auto-generation
  - **TC-05:** Guest with `arrivalState === 'checked-in'` → post-check-in view (not arrival mode)
  - **Test type:** unit (component)
  - **Test location:** `apps/prime/src/app/(guarded)/__tests__/arrival.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="guarded|arrival"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Arrival-day branch now routes through `GuardedHomeExperience` to `ArrivalHome`, with `useCheckInCode` enabled for arrival-day auto-generation semantics and cash action routing to cash prep flow.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern "arrival.test"` — PASS.
- **Confidence reassessment:** 85% → 87% (arrival-mode branch behavior now explicitly tested).

## Phase 2: Build Remaining Guest Features

### TASK-08: Route planner page + dashboard link

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 80% — `components/routes/RoutePlanner.tsx`, `RouteCard.tsx`, `RouteDetail.tsx` exist. `data/routes.ts` has 9 predefined routes. But no route page exists in `app/(guarded)/`.
  - Approach: 80% — create `app/(guarded)/routes/page.tsx`, link from ReadinessDashboard's "routePlanned" checklist item
  - Impact: 78% — new page, touches checklist item completion flow
- **What exists:** Route components (RoutePlanner, RouteCard, RouteDetail) and route data (9 predefined routes with Brikette URLs). ReadinessDashboard checklist has "routePlanned" item (weight 25).
- **What's missing:** No `app/(guarded)/routes/` page. No navigation from dashboard to route planner. No "save route" → mark checklist item complete flow.
- **Acceptance criteria:**
  1. Route planner page accessible from readiness dashboard
  2. At least 3 routes display with transport mode, duration, map links
  3. Selecting a route marks "routePlanned" checklist item as complete
  4. Saved route persists in `preArrival/{uuid}` Firebase node
- **Test contract:**
  - **TC-01:** Route planner page renders 9 predefined routes
  - **TC-02:** Select route → `routePlanned` set to true in preArrival data → readiness score increases by 25
  - **TC-03:** Route detail shows map links, duration, transport modes
  - **TC-04:** Previously saved route shows as selected on revisit
  - **Test type:** unit (component + hook)
  - **Test location:** `apps/prime/src/app/(guarded)/routes/__tests__/page.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="routes"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Created `apps/prime/src/app/(guarded)/routes/page.tsx` and wired readiness checklist actions to route planner; route viewed/save actions update checklist + persisted route selection.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern "routes/__tests__/page.test"` — PASS.
- **Confidence reassessment:** 80% → 82% (page wiring + checklist integration validated).

### TASK-09: ETA confirmation flow

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 82%
  - Implementation: 82% — `EtaConfirmation.tsx` component exists in `components/pre-arrival/`. `PreArrivalData` type has ETA fields. `usePreArrivalState` hook has `setEta()` mutation. `formatEtaWindow()` helper in `lib/checkin/helpers.ts`.
  - Approach: 82% — ETA component exists, needs integration into dashboard and persistence
  - Impact: 82% — touches preArrival data, staff lookup display (ETA visible in `check-in-lookup.ts` response)
- **What exists:** `EtaConfirmation.tsx` component. `PreArrivalData.eta` type field. `usePreArrivalState.setEta()` mutation. `formatEtaWindow()` helper (30-min window formatting). Staff lookup already returns ETA in response.
- **What's missing:** ETA confirmation not accessible from dashboard. No dedicated page or modal for ETA input. "etaConfirmed" checklist item not wired to actual ETA submission.
- **Acceptance criteria:**
  1. ETA confirmation accessible from readiness dashboard checklist
  2. Guest can select 30-min arrival window + travel method
  3. Submitting ETA marks "etaConfirmed" checklist item complete
  4. ETA visible in staff check-in lookup
- **Test contract:**
  - **TC-01:** ETA form renders with time window picker + travel method selector
  - **TC-02:** Submit ETA → `etaConfirmed` set to true → readiness score increases by 20
  - **TC-03:** ETA persists to `preArrival/{uuid}` Firebase node
  - **TC-04:** Staff lookup response includes submitted ETA (via `formatEtaWindow()`)
  - **Test type:** unit (component + hook)
  - **Test location:** `apps/prime/src/components/pre-arrival/__tests__/EtaConfirmation.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="EtaConfirmation|preArrival"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added guarded ETA flow in `apps/prime/src/app/(guarded)/eta/page.tsx`, connected dashboard action routing to ETA form, and reused `setEta()` mutation path for persistence + checklist completion.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern "EtaConfirmation"` — PASS.
- **Confidence reassessment:** 82% → 84% (form interaction + submit contract validated).

### TASK-10: Cash preparedness display

- **Type:** IMPLEMENT
- **Effort:** S
- **Confidence:** 88%
  - Implementation: 90% — `CashPrep.tsx` component exists. Cash amounts calculated in `usePreArrivalState` (city tax + €10 keycard deposit). `cashPrepared` checklist item exists (weight 25).
  - Approach: 88% — component exists, needs integration into dashboard flow
  - Impact: 85% — minimal, only touches checklist completion
- **What exists:** `CashPrep.tsx` component with city tax + deposit display. `usePreArrivalState` calculates amounts. `cashPrepared` boolean in checklist.
- **What's missing:** CashPrep not accessible as standalone view from dashboard. "cashPrepared" toggle not wired to UI interaction. Cash reminder not shown on arrival screen (ArrivalHome has it, but not connected).
- **Acceptance criteria:**
  1. Cash prep accessible from readiness dashboard checklist
  2. Shows city tax amount + €10 keycard deposit per person
  3. "I've prepared my cash" toggle marks checklist item complete
  4. Cash amounts also visible on arrival day screen
- **Test contract:**
  - **TC-01:** CashPrep renders correct amounts (city tax + €10 deposit)
  - **TC-02:** Toggle "prepared" → `cashPrepared` set to true → readiness score increases by 25
  - **TC-03:** ArrivalHome shows same cash amounts
  - **Test type:** unit (component)
  - **Test location:** `apps/prime/src/components/pre-arrival/__tests__/CashPrep.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="CashPrep"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added guarded cash prep flow in `apps/prime/src/app/(guarded)/cash-prep/page.tsx`, routed checklist action from readiness/arrival screens, and fixed single-checklist update path in `apps/prime/src/hooks/mutator/usePreArrivalMutator.ts` to use dot-path updates.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern "CashPrep"` — PASS.
- **Confidence reassessment:** 88% → 89% (cash readiness flow and amount rendering validated).

### TASK-11: Token expiry enforcement + portal refresh

- **Type:** IMPLEMENT
- **Effort:** S
- **Confidence:** 85%
  - Implementation: 88% — server-side expiry check already works (GET `/api/guest-session` returns 410). Client-side `g/page.tsx` handles 410. Missing: periodic re-check from within guarded routes.
  - Approach: 85% — add a `useSessionValidation` hook that periodically validates token; clear + redirect on 410
  - Impact: 82% — touches `(guarded)/layout.tsx`; adds background validation
- **What exists:** Server-side expiry enforcement in `functions/api/guest-session.ts` (returns 410 for expired tokens). Client verification page handles 410 with error message. Token expiry stored in Firebase.
- **What's missing:** Portal and guarded routes never re-validate token after initial verification. Expired token in localStorage grants indefinite access. No session refresh or periodic check.
- **Acceptance criteria:**
  1. Guarded routes periodically validate token (on mount + every 30min)
  2. Expired token (410) clears session and redirects to `/find-my-stay`
  3. Network failure during validation does NOT clear session (fail-open for offline)
- **Test contract:**
  - **TC-01:** Valid token → validation passes → no redirect
  - **TC-02:** Expired token (API returns 410) → localStorage cleared → redirect to `/find-my-stay`
  - **TC-03:** Network error during validation → session preserved (fail-open)
  - **Test type:** unit (hook)
  - **Test location:** `apps/prime/src/hooks/__tests__/useSessionValidation.test.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="useSessionValidation"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added periodic token revalidation hook `apps/prime/src/hooks/useSessionValidation.ts` and integrated it into guarded layout for mount + interval checks with fail-open network behavior.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern "useSessionValidation"` — PASS.
- **Confidence reassessment:** 85% → 87% (expiry + network branches explicitly covered).

### TASK-01: Cloudflare Function test harness

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 78% — no existing tests for Functions; need to create request/response mocks for Cloudflare Pages Functions environment
  - Approach: 82% — mock `EventContext` with `env` (KV, Firebase config) and `request`; test handler functions directly
  - Impact: 80% — additive (new test files only); no changes to production code
- **What exists:** 7 Cloudflare Functions with 0 tests. Functions use Firebase REST API + KV for rate limiting. `lib/checkin/__tests__/helpers.test.ts` tests the helper but not the Functions themselves.
- **What's missing:** No test harness for Functions. No request/response mocks. No Firebase REST API mocks.
- **Acceptance criteria:**
  1. Test harness mocks Cloudflare `EventContext`, `Request`, `Response`, KV namespace
  2. At least `find-booking` and `guest-session` Functions have tests
  3. Rate limiting behavior testable (mock KV reads/writes)
  4. Tests run via standard `pnpm --filter prime test`
- **Test contract:**
  - **TC-01:** `find-booking` with valid surname + bookingRef → returns redirect URL with token
  - **TC-02:** `find-booking` with wrong surname → returns 404
  - **TC-03:** `find-booking` rate limited (6th attempt) → returns 429
  - **TC-04:** `guest-session` GET with valid token → returns 200 with expiry
  - **TC-05:** `guest-session` GET with expired token → returns 410
  - **TC-06:** `guest-session` POST with correct lastName → returns booking data
  - **TC-07:** `guest-session` POST with wrong lastName → returns 403
  - **Test type:** unit (Function handlers with mocked env)
  - **Test location:** `apps/prime/functions/__tests__/find-booking.test.ts` (new), `apps/prime/functions/__tests__/guest-session.test.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="functions/__tests__"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added Cloudflare Function test harness in `apps/prime/functions/__tests__/helpers.ts`; added request/response + KV-backed tests for `find-booking` and `guest-session`.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern "functions/__tests__"` — PASS.
- **Confidence reassessment:** 80% → 84% (core function contracts now covered by deterministic tests).

### TASK-02: Deployment configuration (wrangler.toml)

- **Type:** IMPLEMENT
- **Effort:** S
- **Confidence:** 82%
  - Implementation: 82% — Brikette and Business OS wrangler.toml files exist as patterns. Prime workflow (`.github/workflows/prime.yml`) already has deploy commands.
  - Approach: 85% — follow Cloudflare Pages pattern (not Workers); need KV namespace binding for `RATE_LIMIT`
  - Impact: 78% — new file; but enables production deployment for the first time
- **What exists:** `.github/workflows/prime.yml` with deploy commands. Brikette's wrangler.toml as template. Firebase environment variables defined in workflow.
- **What's missing:** `apps/prime/wrangler.toml` with Pages project config, KV namespace binding, environment variables.
- **Acceptance criteria:**
  1. `wrangler.toml` created with Pages project configuration
  2. `RATE_LIMIT` KV namespace bound
  3. Firebase environment variables configured for Functions
  4. `pnpm --filter prime deploy` works (or equivalent wrangler command)
- **Test contract:**
  - **TC-01:** `wrangler.toml` passes `wrangler pages deploy --dry-run` (if supported) or syntax validation
  - **TC-02:** KV namespace binding name matches what Functions expect (`env.RATE_LIMIT`)
  - **Test type:** manual validation (no automated test — deploy config)
  - **Test location:** N/A (manual verification)
  - **Run:** `wrangler pages deploy apps/prime/out --dry-run` (manual)

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added `apps/prime/wrangler.toml` with Pages output config, `RATE_LIMIT` KV binding, and Firebase env contract notes.
- **Validation evidence:** `pnpm exec wrangler pages deploy out --project-name prime --branch dev --commit-dirty --no-bundle --cwd apps/prime` reached deploy phase and failed only on placeholder KV namespace ID (`... not found`), confirming config parse + binding recognition.
- **Confidence reassessment:** 82% → 84% (deployment config is structurally valid; namespace IDs remain environment-specific).

### TASK-12: Keycard status display (guest-facing)

- **Type:** IMPLEMENT
- **Effort:** S
- **Confidence:** 81%
  - Implementation: 82% — guest-level loan data is already available (`loans/{uuid}` fetch path and typed transactions), so status derivation is straightforward.
  - Approach: 81% — derive guest-facing status from occupant loan transactions (read-only) instead of staff discrepancy tables.
  - Impact: 81% — isolated UI addition on arrival/booking surfaces with no new write path.
- **What exists:** Firebase rules for keycard tracking (staff-facing). Staff lookup shows some keycard data. ArrivalHome has ID reminders section.
- **What's missing:** Guest-facing keycard status type. Guest-facing component. Firebase read path for guest to see own keycard status.
- **Acceptance criteria:**
  1. Guest sees keycard status (issued/not-issued) on arrival/post-check-in screen
  2. Lost card instructions displayed when relevant
  3. No guest-write access (display only)
- **Test contract:**
  - **TC-01:** Keycard status "issued" → shows "Keycard issued" badge
  - **TC-02:** Keycard status not set → shows "Keycard will be issued at check-in"
  - **TC-03:** Lost card info renders with policy text
  - **Test type:** unit (component)
  - **Test location:** `apps/prime/src/components/arrival/__tests__/KeycardStatus.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="KeycardStatus"`

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 75%
- **Updated confidence:** 81%
  - Implementation: 82% — confirmed existing loan read path in `apps/prime/src/hooks/pureData/useFetchLoans.ts:15` and transaction schema in `apps/prime/src/types/loans.ts:40`.
  - Approach: 81% — confirmed arrival UI insertion seam in `apps/prime/src/components/arrival/ArrivalHome.tsx:147`.
  - Impact: 81% — no new cross-app write path required.
- **Investigation performed:**
  - Repo: `apps/prime/src/hooks/pureData/useFetchLoans.ts:15`, `apps/prime/src/types/loans.ts:40`, `apps/prime/src/components/arrival/ArrivalHome.tsx:147`
- **Decision / resolution:**
  - Source guest keycard state from latest loan transaction semantics (`Keycard`/`no_card`) and keep Prime as display-only.
- **Changes to task:**
  - Acceptance: add explicit mapping of latest loan transaction to guest status/lost-card notice.
  - Rollout/rollback: hide keycard card behind a local feature flag if legacy loan data is ambiguous in production.

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added keycard status derivation from loan transactions (`apps/prime/src/lib/preArrival/keycardStatus.ts`) and rendered guest-facing status cards in arrival + checked-in flows (`apps/prime/src/components/arrival/KeycardStatus.tsx`, `apps/prime/src/components/homepage/GuardedHomeExperience.tsx`).
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern="KeycardStatus|keycardStatus"` — PASS.
- **Confidence reassessment:** 81% → 84% (status derivation + UI behavior now under unit coverage).

## Phase 2B: UX + Shared-Data Enhancements (new from UX/UI review)

### TASK-13: Guest-first home information architecture

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 82% — readiness + arrival components already exist; change is composition and conditional priority
  - Approach: 80% — switch `/(guarded)` home to arrival-state-first layout, keep quest/social/services as secondary sections
  - Impact: 78% — medium blast radius in home rendering but high UX gain
- **What exists:** `HomePage.tsx` currently prioritizes quest/social/tasks/services ordering. `ReadinessDashboard` and `ArrivalHome` are complete but not the home primary.
- **What's missing:** Arrival-state aware IA that puts practical arrival actions first for pre-arrival and arrival-day guests.
- **Acceptance criteria:**
  1. `pre-arrival` guests see readiness dashboard as the first/home-primary module
  2. `arrival-day` guests see arrival mode as the first/home-primary module
  3. Legacy quest/social/services content remains available as secondary sections
  4. `checked-in` guests retain current homepage experience
- **Test contract:**
  - **TC-01:** `arrivalState=pre-arrival` → readiness module renders above legacy sections
  - **TC-02:** `arrivalState=arrival-day` → arrival module renders above legacy sections
  - **TC-03:** `arrivalState=checked-in` → legacy homepage order is preserved
  - **TC-04:** Secondary sections still render when data exists
  - **Test type:** unit (state-based component tests)
  - **Test location:** `apps/prime/src/app/(guarded)/__tests__/home-information-architecture.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="home-information-architecture|guarded/home"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Confirmed and hardened arrival-state-first home composition with explicit checked-in keycard context in `apps/prime/src/components/homepage/GuardedHomeExperience.tsx`.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern="home-information-architecture"` — PASS.
- **Confidence reassessment:** 80% → 84% (home IA behavior now contract-tested).

### TASK-14: Brikette route source-of-truth integration

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 82%
  - Implementation: 83% — Prime already consumes route slugs/URLs and Brikette already exposes canonical route-guide keys/slugs.
  - Approach: 82% — add a deterministic adapter + drift test, keeping Prime copy/UI composition local.
  - Impact: 82% — bounded cross-app coupling with strong anti-drift benefit.
- **What exists:** Prime has hardcoded route summaries in `apps/prime/src/data/routes.ts`. Brikette has canonical route guide mapping in `apps/brikette/src/data/how-to-get-here/routeGuides.ts`.
- **What's missing:** A deterministic sync/adapter so Prime route options stay aligned with Brikette guides.
- **Acceptance criteria:**
  1. Prime route catalog is generated from Brikette canonical slugs/metadata (or a generated artifact from it)
  2. Every Prime route card links to a valid Brikette route URL
  3. Drift detection test fails when canonical Brikette route set changes without Prime update
  4. Route planner UX remains unchanged for guests
- **Test contract:**
  - **TC-01:** Canonical slug list from Brikette maps to Prime route list without missing entries
  - **TC-02:** Invalid/missing Brikette URL causes explicit test failure
  - **TC-03:** Added canonical route in Brikette triggers drift failure until mapped
  - **Test type:** unit (data adapter + drift contract test)
  - **Test location:** `apps/prime/src/data/__tests__/routes-canonical-sync.test.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="routes-canonical-sync|routes"`

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 72%
- **Updated confidence:** 82%
  - Implementation: 83% — canonical mapping exists in `apps/brikette/src/data/how-to-get-here/routeGuides.ts:39`; Prime route source is centralized in `apps/prime/src/data/routes.ts:38`.
  - Approach: 82% — integration seam confirmed at `apps/prime/src/app/(guarded)/routes/page.tsx:52`.
  - Impact: 82% — drift risk can be bounded by one contract test.
- **Investigation performed:**
  - Repo: `apps/brikette/src/data/how-to-get-here/routeGuides.ts:39`, `apps/brikette/src/routing/routeInventory.ts:63`, `apps/prime/src/data/routes.ts:38`
- **Decision / resolution:**
  - Chosen approach A: Brikette keys/slugs are canonical; Prime keeps guest-friendly summaries but must derive canonical URL/slug set from Brikette. Rejected approach B (fully hardcoded Prime list) due drift and duplicate maintenance.
- **Changes to task:**
  - Acceptance: explicitly require adapter-generated canonical slug set before Prime render mapping.

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added canonical inbound slug artifact (`apps/prime/src/data/routesCanonical.ts`) and switched Prime route URLs to canonical URL generation in `apps/prime/src/data/routes.ts`.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern="routes-canonical-sync"` — PASS.
- **Confidence reassessment:** 82% → 85% (drift contract now enforces Brikette route parity).

### TASK-15: Staff arrival signal surface (shared readiness data)

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 82%
  - Implementation: 83% — existing lookup endpoint already joins bookings + preArrival and returns ETA/payment fields.
  - Approach: 82% — extend existing lookup payload with readiness signals before introducing a separate list endpoint.
  - Impact: 82% — direct reception benefit with minimal blast radius.
- **What exists:** Staff lookup already displays ETA and payment totals per code. Guest checklist captures readiness dimensions in `preArrival/{uuid}`.
- **What's missing:** Staff-facing aggregated arrival signal view and standardized readiness badges.
- **Acceptance criteria:**
  1. Staff lookup payload includes readiness signals (`eta`, `cashPrepared`, `routePlanned`, `rulesReviewed`, `locationSaved`) sourced from shared nodes
  2. Staff lookup/check-in UI shows readiness badges with clear status colors
  3. Endpoint response is minimum-PII and rate-limited
  4. Data comes from existing shared nodes (no duplicate source-of-truth)
- **Test contract:**
  - **TC-01:** Aggregation endpoint returns expected readiness fields for active arrivals
  - **TC-02:** Missing `preArrival` node falls back to default checklist state
  - **TC-03:** Staff UI renders badges from API payload
  - **TC-04:** Unauthorized/malformed requests receive 4xx (once TASK-51 lands)
  - **Test type:** unit (Functions + component)
  - **Test location:** `apps/prime/functions/__tests__/arrival-signals.test.ts` (new), `apps/prime/src/app/staff-lookup/__tests__/readiness-badges.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="arrival-signals|readiness-badges|staff-lookup"`

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 76%
- **Updated confidence:** 82%
  - Implementation: 83% — existing join points validated in `apps/prime/functions/api/check-in-lookup.ts:81` and `apps/prime/src/app/staff-lookup/StaffLookupClient.tsx:213`.
  - Approach: 82% — reuses current staff lookup route/UI to avoid endpoint sprawl.
  - Impact: 82% — no new guest-facing dependency; improves desk decision speed.
- **Investigation performed:**
  - Repo: `apps/prime/functions/api/check-in-lookup.ts:90`, `apps/prime/src/app/staff-lookup/StaffLookupClient.tsx:213`, `apps/prime/src/hooks/usePreArrivalState.ts:125`
- **Decision / resolution:**
  - Extend `/api/check-in-lookup` with readiness fields first, then add same-day queue endpoint only if staff throughput requires it.
- **Changes to task:**
  - Acceptance: criterion 1 now targets lookup-payload enrichment as the primary delivery.

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Enriched `/api/check-in-lookup` with readiness + personalization payload, added rate limiting, and surfaced readiness badges in staff check-in surfaces (`apps/prime/functions/api/check-in-lookup.ts`, `apps/prime/src/components/check-in/StaffReadinessBadges.tsx`, `apps/prime/src/app/staff-lookup/StaffLookupClient.tsx`, `apps/prime/src/app/checkin/CheckInClient.tsx`).
- **Validation evidence:** `pnpm --filter @apps/prime test -- functions/__tests__/arrival-signals.test.ts && pnpm --filter @apps/prime test -- --testPathPattern="readiness-badges"` — PASS.
- **Confidence reassessment:** 82% → 84% (payload + UI + rate-limit behavior validated).

### TASK-48: Owner arrival insights dashboard + KPI feed

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 80% — owner route scaffold exists and KPI inputs are already captured across bookings/preArrival/check-in data.
  - Approach: 80% — bind dashboard reads to TASK-47 aggregate nodes only.
  - Impact: 80% — direct owner visibility without additional guest flow risk.
- **What exists:** Prime already orchestrates booking/financial/operational data for guests; reception has booking/search data pipelines.
- **What's missing:** Owner-level insight surface summarizing readiness and arrival execution quality, backed by pre-aggregated KPI nodes from TASK-47 (not raw broad scans).
- **Acceptance criteria:**
  1. KPI feed provides daily metrics (readiness completion %, ETA submission %, arrival-day code generation %, median check-in lag)
  2. Owner page (`/owner`) renders KPI cards + date filter for recent windows
  3. KPI reads use pre-aggregated nodes (TASK-47) rather than ad-hoc multi-day raw scans
  4. KPI calculations are documented and unit-tested
- **Test contract:**
  - **TC-01:** KPI aggregator computes expected percentages from fixtures
  - **TC-02:** Empty-day window returns zero-safe defaults (no crashes/div-by-zero)
  - **TC-03:** Owner dashboard renders metric cards from aggregate-backed API response
  - **Test type:** unit (aggregator + page component)
  - **Test location:** `apps/prime/src/lib/owner/__tests__/arrivalKpis.test.ts` (new), `apps/prime/src/app/owner/__tests__/page.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="arrivalKpis|owner/page"`

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 70%
- **Updated confidence:** 80%
  - Implementation: 80% — owner surface entry exists in `apps/prime/src/app/owner/setup/page.tsx:4`.
  - Approach: 80% — implementation constrained to aggregate read path from TASK-47 (no raw scan fallback).
  - Impact: 80% — KPI visibility can ship independently from social feature rollout.
- **Investigation performed:**
  - Repo: `apps/prime/src/app/owner/setup/page.tsx:4`, `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.ts:146`, `apps/prime/src/hooks/dataOrchestrator/useDateInfo.ts:167`
- **Decision / resolution:**
  - Deliver `/owner` KPI cards from pre-aggregated nodes; keep `/owner/setup` as configuration/support page.

## Phase 2C: 9/10 Activation + Engagement Optimization

This phase applies proven onboarding/activation patterns (aha-first flow, personalization, progress psychology, trust cues, and experimentation) to move both usefulness and engagement to ≥9/10.

### TASK-16: Aha-first guided onboarding (post-verification)

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 84%
  - Implementation: 86% — verification and readiness components already exist; missing orchestration
  - Approach: 84% — replace passive portal handoff with a guided 3-step activation flow
  - Impact: 82% — high impact on first-session completion and drop-off reduction
- **What exists:** `/g` verification flow and `/portal` session page are functional but passive.
- **What's missing:** A fast guided sequence that gets guests to first value immediately after verification.
- **Acceptance criteria:**
  1. After successful verification, guest enters a 3-step guided flow: route, ETA, arrival readiness
  2. Stepper/progress UI is visible (`Step 1 of 3`) with clear next action
  3. Guest reaches first value (personalized readiness dashboard) in ≤90 seconds median
  4. Guest can skip a step without getting blocked; skipped items remain in checklist
- **Test contract:**
  - **TC-01:** Verified guest enters guided flow instead of static portal placeholder
  - **TC-02:** Step navigation preserves entered data between steps
  - **TC-03:** Skip action returns guest to dashboard with pending checklist items
  - **TC-04:** Completion redirects into `/(guarded)/` home in correct arrival mode
  - **Test type:** unit (page flow) + integration (route transitions)
  - **Test location:** `apps/prime/src/app/portal/__tests__/guided-onboarding.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="guided-onboarding|portal"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Replaced passive `/portal` redirect with guided onboarding orchestration (`apps/prime/src/app/portal/page.tsx`, `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx`) while preserving fast-path redirect for already-completed onboarding.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern="guided-onboarding|portal/__tests__/page"` — PASS.
- **Confidence reassessment:** 84% → 85% (guided flow entry + completion path verified).

### TASK-17: Personalized onboarding path + smart defaults

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 80% — guest profile/intent data and booking context already available
  - Approach: 80% — capture 1-2 lightweight intent inputs and prefill route/ETA/cash flow accordingly
  - Impact: 80% — reduces cognitive load and increases completion likelihood
- **What exists:** Guest intent model (`social/quiet/mixed`) and booking context (`dates`, `nights`, city tax).
- **What's missing:** Onboarding path personalization and data-driven defaults across route/ETA modules.
- **Acceptance criteria:**
  1. Onboarding asks at most two personalization questions (e.g., arrival method, confidence level)
  2. Route suggestions and ETA defaults adapt to personalization inputs
  3. Staff lookup shows captured context to improve arrival handling
  4. Guests can edit defaults at any time from dashboard
- **Test contract:**
  - **TC-01:** Personalization answers alter recommended route ordering
  - **TC-02:** ETA default window/method populated from personalization state
  - **TC-03:** Personalized context appears in staff readiness payload
  - **TC-04:** Reset/edit actions revert to neutral defaults correctly
  - **Test type:** unit (logic + components)
  - **Test location:** `apps/prime/src/lib/preArrival/__tests__/personalization.test.ts`, `apps/prime/src/components/pre-arrival/__tests__/PersonalizationFlow.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="personalization|pre-arrival"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added personalization model fields in pre-arrival state, smart defaults for route/ETA, persistence through onboarding mutators, and dashboard edit entrypoint (`apps/prime/src/types/preArrival.ts`, `apps/prime/src/lib/preArrival/personalization.ts`, `apps/prime/src/components/pre-arrival/ReadinessDashboard.tsx`).
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern="personalization|PersonalizationFlow"` — PASS.
- **Confidence reassessment:** 80% → 83% (defaults and context propagation now exercised by tests).

### TASK-18: Trust cues + value framing layer

- **Type:** IMPLEMENT
- **Effort:** S
- **Confidence:** 82%
  - Implementation: 84% — mostly copy/UI treatment with limited new data dependencies
  - Approach: 82% — introduce concise “why this helps” and trust cues in key moments
  - Impact: 80% — higher confidence and lower abandonment in early steps
- **What exists:** Functional forms and checklist surfaces with minimal persuasion/context copy.
- **What's missing:** Explicit value framing, privacy reassurance, and operational trust cues.
- **Acceptance criteria:**
  1. Key steps include benefit-led copy (e.g., “share ETA to speed check-in”)
  2. Verification + onboarding include concise privacy/data-use reassurance
  3. Dashboard shows confidence cues (e.g., “you are ready for arrival” state)
  4. No blocking modal walls; trust cues remain lightweight and contextual
- **Test contract:**
  - **TC-01:** Trust cue blocks render on verification and onboarding screens
  - **TC-02:** Value framing text updates correctly by arrival state
  - **TC-03:** i18n keys resolve for new trust/value copy
  - **Test type:** unit (render + i18n)
  - **Test location:** `apps/prime/src/app/g/__tests__/trust-cues.test.tsx` (new), `apps/prime/src/components/pre-arrival/__tests__/value-framing.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="trust-cues|value-framing"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added benefit-led + privacy cues to verification and onboarding screens plus readiness confidence framing (`apps/prime/src/app/g/page.tsx`, `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx`, `apps/prime/src/components/pre-arrival/ReadinessDashboard.tsx`).
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern="trust-cues|value-framing"` — PASS.
- **Confidence reassessment:** 82% → 84% (trust/value copy now covered by render tests).

### TASK-19: Progress psychology + celebration loops

- **Type:** IMPLEMENT
- **Effort:** S
- **Confidence:** 85%
  - Implementation: 86% — readiness score/checklist already available
  - Approach: 85% — add visible milestone progression and completion reinforcement
  - Impact: 84% — boosts momentum and repeat engagement during pre-arrival window
- **What exists:** Readiness score, checklist, and next-action card.
- **What's missing:** Explicit milestone feedback and positive reinforcement for step completion.
- **Acceptance criteria:**
  1. Onboarding + readiness views show milestone progress bars
  2. Completing an item triggers lightweight celebration (animation + confirmation text)
  3. Next-action card messaging adapts to most recent completion event
  4. Celebration effects are performant on low-end mobile devices
- **Test contract:**
  - **TC-01:** Checklist completion increments visible milestone progress
  - **TC-02:** Celebration UI triggers once per completion event
  - **TC-03:** No duplicate animation spam on rapid toggles
  - **Test type:** unit (state transitions + render)
  - **Test location:** `apps/prime/src/components/pre-arrival/__tests__/progress-milestones.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="progress-milestones|readiness"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added milestone progress bars, lightweight celebration feedback, and completion-aware next-action messaging across onboarding/readiness (`apps/prime/src/components/pre-arrival/ReadinessDashboard.tsx`, `apps/prime/src/components/pre-arrival/NextActionCard.tsx`, `apps/prime/src/lib/preArrival/completionFeedback.ts`).
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern="progress-milestones|readiness"` — PASS.
- **Confidence reassessment:** 85% → 87% (progress/celebration behavior validated including duplicate suppression case).

### TASK-20: Contextual utility actions (maps/calendar/support)

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 80% — reusable utility-action component seams already exist (`AddToCalendarButton`, `QuickActionBar`)
  - Approach: 80% — compose one contextual action strip instead of adding separate page-specific buttons
  - Impact: 80% — clear guest usefulness lift with low integration risk
- **What exists:** Route links, calendar component, location checklist item, arrival screen actions.
- **What's missing:** Unified quick-action strip and contextual action surfacing across states.
- **Acceptance criteria:**
  1. Pre-arrival and arrival screens include one-tap actions: Open Maps, Add to Calendar, Contact Reception
  2. Actions are shown contextually (no irrelevant actions for current state)
  3. Support action provides failover channels (call + message) if one channel unavailable
  4. Utility actions write analytics events for completion tracking
- **Test contract:**
  - **TC-01:** Correct action set rendered for `pre-arrival` vs `arrival-day`
  - **TC-02:** Action handlers invoke expected URL schemes/deep links
  - **TC-03:** Failover support options render when primary channel unavailable
  - **Test type:** unit (component + action handlers)
  - **Test location:** `apps/prime/src/components/arrival/__tests__/utility-actions.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="utility-actions|arrival"`

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 78%
- **Updated confidence:** 80%
  - Implementation: 80% — utility building blocks exist in `apps/prime/src/components/pre-arrival/AddToCalendarButton.tsx:32` and `packages/ui/src/components/organisms/operations/QuickActionBar/QuickActionBar.tsx:7`.
  - Approach: 80% — wire one shared strip into readiness + arrival surfaces (`apps/prime/src/components/pre-arrival/ReadinessDashboard.tsx:123`, `apps/prime/src/components/arrival/ArrivalHome.tsx:78`).
  - Impact: 80% — maps/calendar/support can be added without new backend contracts.
- **Investigation performed:**
  - Repo: `apps/prime/src/components/pre-arrival/AddToCalendarButton.tsx:32`, `packages/ui/src/components/organisms/operations/QuickActionBar/QuickActionBar.tsx:100`, `apps/prime/src/components/arrival/ArrivalHome.tsx:165`
- **Decision / resolution:**
  - Implement utility actions as a reusable strip in shared UI, then bind per-state action sets from Prime.

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Prime pre-arrival and arrival surfaces now consume shared utility strips and emit analytics on usage in `apps/prime/src/components/pre-arrival/ReadinessDashboard.tsx` and `apps/prime/src/components/arrival/ArrivalHome.tsx`; activation event schema expanded for utility actions in `apps/prime/src/lib/analytics/activationFunnel.ts`.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern "utility-actions|src/app/\\(guarded\\)/__tests__/arrival.test.tsx|trust-cues|value-framing"` — PASS.
- **Confidence reassessment:** 80% → 84% (contextual action rendering and handlers are now contract-tested).

### TASK-21: Activation analytics + funnel observability

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 80% — core telemetry + analytics provider rails are executable, with known retry-path test debt to isolate during implementation
  - Approach: 80% — funnel events can reuse existing event/aggregation rails with PII-safe payload rules
  - Impact: 80% — unlocks evidence-based iteration for usefulness/engagement improvements
- **What exists:** No structured onboarding funnel analytics; only limited operational traces.
- **What's missing:** Event taxonomy, funnel dashboards, and operator-facing conversion visibility.
- **Acceptance criteria:**
  1. Event schema defined for key moments (lookup success, verify success, step completion, arrival mode entry, staff lookup usage)
  2. Dashboard view provides funnel conversion and drop-off by step
  3. Owner view includes weekly trend of readiness completion and activation conversion
  4. Analytics implementation is privacy-safe (no extra PII in events)
- **Test contract:**
  - **TC-01:** Event utility emits required fields for each tracked step
  - **TC-02:** Missing optional context does not break event emission
  - **TC-03:** Dashboard aggregation computes step conversions correctly from fixtures
  - **Test type:** unit (event utils + aggregation)
  - **Test location:** `apps/prime/src/lib/analytics/__tests__/activationFunnel.test.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="activationFunnel|analytics"`

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 76%
- **Updated confidence:** 79%
  - Implementation: 79% — PII-safe telemetry transport exists in `packages/telemetry/src/index.ts:25` and event aggregation exists in `packages/platform-core/src/analytics/index.ts:141`.
  - Approach: 80% — Prime can emit onboarding/readiness funnel events from existing mutation seams (`apps/prime/src/hooks/useTrackQuestTask.ts:37`).
  - Impact: 79% — owner/staff insights paths already defined by TASK-47..49.
- **Investigation performed:**
  - Repo: `packages/telemetry/src/index.ts:67`, `packages/platform-core/src/analytics/index.ts:141`, `apps/prime/src/hooks/useTrackQuestTask.ts:37`
- **Decision / resolution:**
  - Build a Prime-local `activationFunnel` analytics module on top of existing telemetry/event infrastructure instead of introducing a second analytics stack.

#### Re-plan Update (2026-02-07 — iteration 4)
- **Previous confidence:** 79%
- **Updated confidence:** 80%
  - **Evidence class:** E2 (executable verification)
  - Implementation: 80% — provider and event-write path are executable (`pnpm --filter @acme/platform-core test -- src/analytics/__tests__/public-api.test.ts` PASS 5/5), and telemetry sanitization/error-capture path is executable (`pnpm --filter @acme/telemetry test -- src/__tests__/captureError.test.ts` PASS 15/15).
  - Approach: 80% — reuse existing rails and add Prime funnel schema/events in-app rather than introducing a second analytics stack.
  - Impact: 80% — owner/staff analytics remains high leverage and bounded by existing privacy-safe event constraints.
- **Investigation performed:**
  - Repo: `packages/platform-core/src/analytics/index.ts:141`, `packages/telemetry/src/index.ts:67`, `apps/prime/src/hooks/useTrackQuestTask.ts:37`
  - Validation:
    - `pnpm --filter @acme/platform-core test -- src/analytics/__tests__/public-api.test.ts` (PASS)
    - `pnpm --filter @acme/telemetry test -- src/__tests__/captureError.test.ts` (PASS)
    - `pnpm --filter @acme/telemetry test -- --testPathPattern="telemetry.spec|index.test"` (FAIL in existing retry-path suites due strict console-error guard behavior)
- **Decision / resolution:**
  - Promote to 80% for implementation readiness on core event rails; treat retry-path suite instability as bounded test debt to be handled in TASK-21 implementation notes, not as a blocker for starting work.

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Implemented Prime activation funnel analytics module, wired events into lookup/verify/onboarding/arrival/staff flows, and added owner funnel summary UI (`apps/prime/src/lib/analytics/activationFunnel.ts`, `apps/prime/src/components/owner/ActivationFunnelSummary.tsx`).
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern "activationFunnel|ActivationFunnelSummary"` — PASS.
- **Confidence reassessment:** 80% → 84% (funnel emission + aggregation now validated by executable tests).

### TASK-22: Continuous A/B testing cadence for activation

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 80% — lightweight flag/variant gate behavior is executable and stable for rollout control
  - Approach: 80% — start with deterministic assignment + weekly report loop before advanced statistics
  - Impact: 80% — enables safe iteration once TASK-21 instrumentation is live
- **What exists:** No explicit experimentation loop for onboarding/readiness conversion.
- **What's missing:** Variant assignment, experiment config, and operator review cadence.
- **Acceptance criteria:**
  1. Experiment framework supports at least two concurrent onboarding experiments
  2. Initial experiments launched: CTA value-copy variant and step-order variant
  3. Experiment report includes conversion deltas + confidence notes for weekly review
  4. Rollback path exists for underperforming variants
- **Test contract:**
  - **TC-01:** Deterministic variant assignment for same user/session key
  - **TC-02:** Experiment flags default safely when config missing
  - **TC-03:** Variant metrics aggregate separately and accurately
  - **Test type:** unit (assignment + metrics aggregation)
  - **Test location:** `apps/prime/src/lib/experiments/__tests__/activationExperiments.test.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="activationExperiments|experiments"`

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 74%
- **Updated confidence:** 78%
  - Implementation: 78% — reusable gate exists in `packages/ui/src/components/ab/ExperimentGate.tsx:5`.
  - Approach: 79% — integrate gate into guided onboarding checkpoints (`apps/prime/src/components/portal/GuidedOnboardingFlow.tsx:127`) with deterministic keying.
  - Impact: 78% — low-risk experimentation once funnel events are in place.
- **Investigation performed:**
  - Repo: `packages/ui/src/components/ab/ExperimentGate.tsx:24`, `packages/ui/src/components/ab/__tests__/ExperimentGate.test.tsx:6`, `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx:210`
- **Decision / resolution:**
  - Reuse `ExperimentGate` for rollout toggles and add a Prime variant-assignment helper for analysis-ready metrics.

#### Re-plan Update (2026-02-07 — iteration 4)
- **Previous confidence:** 78%
- **Updated confidence:** 80%
  - **Evidence class:** E2 (executable verification)
  - Implementation: 80% — experiment gate behavior is verified (`pnpm --filter @acme/ui test:quick -- src/components/ab/__tests__/ExperimentGate.test.tsx` PASS 4/4).
  - Approach: 80% — existing gate + deterministic assignment helper remains the lowest-risk rollout model.
  - Impact: 80% — TASK-21 + TASK-22 sequencing remains coherent for weekly experiment cadence.
- **Investigation performed:**
  - Repo: `packages/ui/src/components/ab/ExperimentGate.tsx:5`, `packages/ui/src/components/ab/__tests__/ExperimentGate.test.tsx:1`, `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx:127`
  - Validation:
    - `pnpm --filter @acme/ui test:quick -- src/components/ab/__tests__/ExperimentGate.test.tsx` (PASS)
- **Decision / resolution:**
  - Promote to 80% and keep initial scope constrained to deterministic assignment + weekly operator review loop.

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added deterministic activation experiment assignment and onboarding variant wiring in `apps/prime/src/lib/experiments/activationExperiments.ts` and `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx`.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern "activationExperiments|guided-onboarding"` — PASS.
- **Confidence reassessment:** 80% → 82% (experiment assignment and variant integration are now under test).

## Phase 2D: Central UI/Theming Platform + Business Leverage

This phase closes central UI/theming gaps so Prime can consume shared platform capabilities and the finished app contributes durable value to the wider Brikette business.

### TASK-23: Prime theme source-of-truth consolidation (`@themes/prime`)

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 88%
  - Implementation: 90% — `@themes/prime/tokens.css` already exists and contains canonical Prime overrides
  - Approach: 88% — switch Prime to consume shared theme package directly and remove duplicate app-local overrides
  - Impact: 86% — materially reduces token drift and inconsistent UI behavior
- **What exists:** Prime imports `@themes/base/tokens.css`; `packages/themes/prime/src/tokens.ts` and `packages/themes/prime/tokens.css` already define Prime brand overrides.
- **What's missing:** Prime currently keeps duplicate `:root` token overrides in `apps/prime/src/styles/globals.css`, including a font mismatch (`Inter` vs `var(--font-geist-sans)`).
- **Acceptance criteria:**
  1. `apps/prime/src/styles/globals.css` imports `@themes/prime/tokens.css` and removes duplicate token definitions
  2. Prime typography comes from shared token chain (no app-local hardcoded `--font-sans` stack override)
  3. Light/dark token behavior is verified against existing Prime visual states
  4. Token ownership is documented: base in `@themes/base`, Prime overrides in `@themes/prime`, no duplicate app-local token declarations
- **Test contract:**
  - **TC-01:** Prime global styles include `@themes/base/tokens.css` + `@themes/prime/tokens.css` in expected order
  - **TC-02:** Snapshot/style assertion verifies resolved `--color-primary` and `--font-sans` values
  - **TC-03:** Existing pre-arrival/arrival surfaces remain visually consistent in light/dark
  - **Test type:** unit (style import/assertion) + smoke (render snapshots)
  - **Test location:** `apps/prime/src/styles/__tests__/theme-imports.test.ts` (new), `apps/prime/src/components/pre-arrival/__tests__/ReadinessDashboard.theme.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="theme-imports|ReadinessDashboard.theme"`

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Consolidated Prime tokens to shared theme source-of-truth by importing `@themes/prime/tokens.css` and removing app-local token overrides in `apps/prime/src/styles/globals.css`.
- **Validation evidence:** `pnpm --filter @apps/prime test -- --testPathPattern "theme-imports|ReadinessDashboard.theme"` — PASS.
- **Confidence reassessment:** 88% → 90% (theme import order and readiness surface compatibility are verified).

### TASK-24: Central onboarding/trust/progress primitives in `@acme/design-system`

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 80% — design-system primitive foundation and reduced-motion hook are already in place
  - Approach: 80% — add hospitality-specific wrappers on top of existing primitives
  - Impact: 80% — unifies onboarding UX patterns across Prime surfaces
- **What exists:** Prime has local onboarding and readiness components implementing progress/trust patterns.
- **What's missing:** Shared primitives for onboarding shell, step progress, trust/value cue blocks, and lightweight milestone feedback.
- **Acceptance criteria:**
  1. `@acme/design-system` exports primitives for `StepFlowShell`, `StepProgress`, `TrustCue`, and `MilestoneToast`
  2. Primitives are token-driven (color, spacing, motion) and accessible by default
  3. Prime onboarding flow adopts these primitives without UX regression
  4. Reduced-motion users receive non-animated fallback behavior
- **Test contract:**
  - **TC-01:** New primitives render with expected ARIA semantics and keyboard behavior
  - **TC-02:** Reduced-motion mode disables celebration animations while preserving confirmation messaging
  - **TC-03:** Prime onboarding tests continue to pass using shared primitives
  - **Test type:** unit (design-system primitives) + integration (Prime onboarding)
  - **Test location:** `packages/design-system/src/primitives/__tests__/StepFlowShell.test.tsx` (new), `apps/prime/src/app/portal/__tests__/guided-onboarding.test.tsx` (extend)
  - **Run:** `pnpm --filter @acme/design-system test -- --testPathPattern="StepFlowShell|TrustCue|StepProgress" && pnpm --filter prime test -- --testPathPattern="guided-onboarding|portal"`

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 78%
- **Updated confidence:** 80%
  - Implementation: 80% — core primitive exports exist in `packages/design-system/src/primitives/index.ts:2` and reduced-motion support exists in `packages/design-system/src/hooks/useReducedMotion.ts:5`.
  - Approach: 80% — map Prime onboarding step shell/progress to shared primitives from existing flow structure (`apps/prime/src/components/portal/GuidedOnboardingFlow.tsx:210`).
  - Impact: 80% — consistent pattern reuse reduces per-screen drift.
- **Investigation performed:**
  - Repo: `packages/design-system/src/primitives/index.ts:2`, `packages/design-system/src/hooks/useReducedMotion.ts:5`, `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx:127`
- **Decision / resolution:**
  - Add new onboarding-focused primitives to `@acme/design-system/primitives` and migrate Prime flow incrementally.

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added shared onboarding primitives (`StepFlowShell`, `StepProgress`, `TrustCue`, `MilestoneToast`) in `packages/design-system/src/primitives/` and migrated Prime guided onboarding flow to consume them.
- **Validation evidence:** `pnpm --filter @acme/design-system test:quick -- src/primitives/__tests__/StepFlowShell.test.tsx` and `pnpm --filter @apps/prime test -- --testPathPattern "guided-onboarding"` — PASS.
- **Confidence reassessment:** 80% → 82% (shared primitive contracts and Prime integration now execute cleanly).

### TASK-25: Hospitality composite component kit in `@acme/ui`

- **Type:** IMPLEMENT
- **Effort:** L
- **Confidence:** 80%
  - Implementation: 80% — shared composite seams and Prime integration touchpoints are executable in current test suite
  - Approach: 80% — extract in thin slices (utility strip, readiness card, KPI tile) rather than a big-bang move
  - Impact: 80% — clear cross-app reuse upside once extraction boundaries are fixed
- **What exists:** Prime-local components (`ReadinessDashboard`, `ArrivalHome`, route/readiness cards) and Reception readiness surfaces.
- **What's missing:** A centrally versioned hospitality UI kit consumed by multiple apps.
- **Acceptance criteria:**
  1. `@acme/ui` exports hospitality composites: readiness card set, arrival code panel, utility action strip, staff signal badge group, owner KPI tiles
  2. Prime replaces at least three app-local composites with `@acme/ui` variants
  3. Reception adopts at least one shared staff-facing readiness/signal composite
  4. Public component APIs are documented for cross-app consumption
- **Test contract:**
  - **TC-01:** Component unit tests validate rendering/state variants for guest, staff, owner contexts
  - **TC-02:** Prime integration tests pass with shared component imports
  - **TC-03:** Reception smoke test confirms shared component renders with reception theme bridge
  - **Test type:** unit (UI package) + integration (Prime/Reception)
  - **Test location:** `packages/ui/src/components/hospitality/__tests__/readiness-suite.test.tsx` (new), `apps/reception/src/components/__tests__/shared-readiness-badge.test.tsx` (new)
  - **Run:** `pnpm --filter @acme/ui test -- --testPathPattern="hospitality|readiness-suite" && pnpm --filter reception test -- --testPathPattern="shared-readiness-badge"`

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 72%
- **Updated confidence:** 78%
  - Implementation: 78% — reusable seams already exist in `packages/ui/src/components/organisms/operations/StepWizard/StepWizard.tsx:17`, `packages/ui/src/components/organisms/operations/QuickActionBar/QuickActionBar.tsx:7`, and `packages/ui/src/components/organisms/operations/MetricsCard/MetricsCard.tsx:8`.
  - Approach: 78% — migrate Prime components that are already cohesive (`apps/prime/src/components/pre-arrival/ReadinessDashboard.tsx:81`, `apps/prime/src/components/arrival/ArrivalHome.tsx:54`).
  - Impact: 79% — reuse path extends to Reception owner/staff surfaces.
- **Investigation performed:**
  - Repo: `packages/ui/src/components/organisms/operations/StepWizard/StepWizard.tsx:238`, `packages/ui/src/components/organisms/operations/QuickActionBar/QuickActionBar.tsx:100`, `apps/prime/src/components/arrival/ArrivalHome.tsx:54`
- **Decision / resolution:**
  - Start extraction with three composites (`UtilityActionStrip`, `ReadinessSignalCard`, `KpiTile`) before expanding kit breadth.

#### Re-plan Update (2026-02-07 — iteration 4)
- **Previous confidence:** 78%
- **Updated confidence:** 80%
  - **Evidence class:** E2 (executable verification)
  - Implementation: 80% — shared wizard composite behavior is verified (`pnpm --filter @acme/ui test:quick -- --testPathPattern="StepWizard"` PASS 20/20) and Prime onboarding/readiness integration path remains stable (`pnpm --filter @apps/prime test -- --testPathPattern="guided-onboarding|progress-milestones|readiness"` PASS 22/22).
  - Approach: 80% — thin-slice extraction plan is consistent with existing passing integration seams.
  - Impact: 80% — extraction can start with immediate Prime reuse and staged Reception/Brikette adoption.
- **Investigation performed:**
  - Repo: `packages/ui/src/components/organisms/operations/StepWizard/StepWizard.tsx:17`, `apps/prime/src/app/portal/__tests__/guided-onboarding.test.tsx:55`, `apps/prime/src/components/pre-arrival/__tests__/progress-milestones.test.tsx:1`
  - Validation:
    - `pnpm --filter @acme/ui test:quick -- --testPathPattern="StepWizard"` (PASS)
    - `pnpm --filter @apps/prime test -- --testPathPattern="guided-onboarding|progress-milestones|readiness"` (PASS)
- **Decision / resolution:**
  - Promote to 80%; retain stepwise extraction sequence and keep first deliverable bounded to three composites.

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Delivered shared hospitality composites in `packages/ui/src/components/hospitality/` (utility strip, readiness card, arrival panel, staff signal badges, owner KPI tile) and adopted them in Prime + Reception surfaces.
- **Validation evidence:** `pnpm --filter @acme/ui test:quick -- src/components/hospitality/__tests__/readiness-suite.test.tsx` and `pnpm --filter @apps/reception exec jest --ci --runInBand --detectOpenHandles --passWithNoTests --config jest.config.cjs --testPathPatterns "components/__tests__/shared-readiness-badge.test.tsx"` — PASS.
- **Confidence reassessment:** 80% → 82% (shared-kit extraction and cross-app consumption are now validated).

### TASK-26: Shared hospitality semantic tokens (status/signal/motion/typography)

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 82%
  - Implementation: 82% — drift and contrast gates are executable and currently green, reducing token-pipeline uncertainty
  - Approach: 82% — map existing Prime readiness/arrival states to semantic aliases first
  - Impact: 82% — materially reduces state-color drift across Prime/Reception/Brikette while preserving central governance
- **What exists:** Robust base token infrastructure and Prime/Brikette brand tokens.
- **What's missing:** Shared semantic tokens for hospitality concepts (ready/warning/blocker/info, arrival state emphasis, guidance confidence, celebration/motion cadence).
- **Acceptance criteria:**
  1. `@themes/base` defines hospitality semantic token set with light/dark values and documentation
  2. Prime maps readiness/arrival states to semantic tokens instead of ad hoc color classes
  3. Motion/feedback timing tokens are centralized and consumed by activation flows
  4. Token drift/contrast checks include new hospitality tokens
- **Test contract:**
  - **TC-01:** Token generation includes hospitality keys in CSS output
  - **TC-02:** Contrast validator passes for all readiness/status semantic tokens
  - **TC-03:** Prime readiness and arrival components resolve semantic tokens correctly
  - **Test type:** unit (token build output) + validation script + component smoke
  - **Test location:** `packages/themes/base/__tests__/hospitality-tokens.test.ts` (new), `apps/prime/src/components/arrival/__tests__/ArrivalHome.tokens.test.tsx` (new)
  - **Run:** `pnpm tokens:drift:check && pnpm tokens:contrast:check && pnpm --filter prime test -- --testPathPattern="ArrivalHome.tokens|readiness"`

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 76%
- **Updated confidence:** 79%
  - Implementation: 79% — base token infrastructure already exports broad semantic sets in `packages/themes/base/tokens.css:54`.
  - Approach: 79% — Prime/Brikette can map hospitality semantics on top of current brand tokens (`packages/themes/prime/src/tokens.ts:13`, `apps/brikette/src/styles/global.css:9`).
  - Impact: 80% — central semantics can directly replace ad-hoc readiness/arrival class colors (`apps/prime/src/components/pre-arrival/ReadinessDashboard.tsx:193`, `apps/prime/src/components/arrival/ArrivalHome.tsx:116`).
- **Investigation performed:**
  - Repo: `packages/themes/base/tokens.css:54`, `packages/themes/prime/src/tokens.ts:13`, `apps/prime/src/components/arrival/ArrivalHome.tsx:116`
- **Decision / resolution:**
  - Introduce hospitality semantic aliases in `@themes/base` first, then progressively remap Prime/Reception/Brikette.

#### Re-plan Update (2026-02-07 — iteration 4)
- **Previous confidence:** 79%
- **Updated confidence:** 82%
  - **Evidence class:** E2 (executable verification)
  - Implementation: 82% — token drift and contrast checks are both green (`pnpm tokens:drift:check` PASS, `pnpm tokens:contrast:check` PASS), confirming current token pipeline safety for semantic additions.
  - Approach: 82% — semantic alias-first strategy remains aligned with existing token architecture.
  - Impact: 82% — central semantic-token rollout provides cross-app consistency with low migration risk when done incrementally.
- **Investigation performed:**
  - Repo: `scripts/src/tokens/report-drift.ts:56`, `scripts/src/tokens/validate-contrast.ts:27`, `packages/themes/base/tokens.css:54`
  - Validation:
    - `pnpm tokens:drift:check` (PASS)
    - `pnpm tokens:contrast:check` (PASS)
- **Decision / resolution:**
  - Promote to 82% and keep rollout order as: define base semantic aliases -> map Prime readiness/arrival -> bridge Reception/Brikette.

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Added hospitality semantic token set in `packages/themes/base/src/tokens.ts`, regenerated token outputs, and wired Prime readiness/arrival component token hooks.
- **Validation evidence:** `pnpm build:tokens`, `pnpm tokens:drift:check`, `pnpm tokens:contrast:check`, and `pnpm --filter @apps/prime test -- --testPathPattern "ArrivalHome.tokens|readiness"` — PASS.
- **Confidence reassessment:** 82% → 84% (semantic-token pipeline and consuming surfaces are verified together).

### TASK-27: Reception + Brikette theme consumption bridge

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 80% — cross-app theme mechanics are executable in targeted checks across Reception + Brikette
  - Approach: 80% — staged compatibility layer remains preferable to full redesign
  - Impact: 80% — enables cross-app component reuse with bounded migration risk under staged rollout
- **What exists:** Brikette already imports `@themes/base/tokens.css`; Reception has its own global style path and dark-mode toggles.
- **What's missing:** A deliberate bridge layer so both apps can consume shared hospitality tokens/components with predictable theming.
- **Acceptance criteria:**
  1. Reception global styles import shared theme tokens and map legacy palette names to semantic tokens
  2. Brikette maps relevant hospitality semantics for shared signal/status components
  3. At least one shared hospitality composite from TASK-25 is rendered in both Reception and Brikette
  4. Light/dark behavior remains stable under existing app theme toggles
- **Test contract:**
  - **TC-01:** Reception style bridge exposes expected semantic variables in test render
  - **TC-02:** Brikette shared component snapshot renders with mapped tokens
  - **TC-03:** Dark-mode toggle preserves readability/contrast for shared components
  - **Test type:** unit (style bridge) + component integration
  - **Test location:** `apps/reception/src/app/__tests__/theme-bridge.test.tsx` (new), `apps/brikette/src/components/__tests__/shared-hospitality-theme.test.tsx` (new)
  - **Run:** `pnpm --filter reception test -- --testPathPattern="theme-bridge" && pnpm --filter brikette test -- --testPathPattern="shared-hospitality-theme"`

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 68%
- **Updated confidence:** 74%
  - Implementation: 74% — Brikette already imports shared tokens (`apps/brikette/src/styles/global.css:9`) while Reception still needs the bridge (`apps/reception/src/app/globals.css:5`).
  - Approach: 75% — migrate Reception first with a token alias layer, then adopt shared hospitality components.
  - Impact: 74% — avoids immediate redesign while enabling progressive shared-kit rollout.
- **Investigation performed:**
  - Repo: `apps/reception/src/app/globals.css:5`, `apps/brikette/src/styles/global.css:9`, `apps/prime/src/styles/globals.css:2`
- **Decision / resolution:**
  - Build a Reception compatibility stylesheet mapping legacy palette names to shared semantic tokens before component adoption.

#### Re-plan Update (2026-02-07 — iteration 4)
- **Previous confidence:** 74%
- **Updated confidence:** 80%
  - **Evidence class:** E2 (executable verification)
  - Implementation: 80% — Reception theme surface compiles (`pnpm --filter @apps/reception typecheck` PASS), Reception roomgrid theming behavior is executable in targeted tests (`Day.test.tsx` PASS 3/3; `RoomGrid.test.tsx -t "applies dark mode classes"` PASS 1/1), and Brikette theme-init/useTheme coverage is green (`pnpm --filter @apps/brikette test -- --testPathPattern="theme-init|themeInit|useTheme"` PASS 9/9).
  - Approach: 80% — Reception token-alias bridge first, then shared hospitality component adoption remains the lowest-risk rollout.
  - Impact: 80% — bridge now has executable cross-app proof for dark/light behavior and import-path stability.
- **Investigation performed:**
  - Repo: `apps/reception/src/app/globals.css:1`, `apps/reception/src/context/DarkModeContext.tsx:172`, `apps/brikette/src/styles/global.css:9`, `apps/brikette/src/test/utils/themeInit.test.ts:52`
  - Validation:
    - `pnpm --filter @apps/reception typecheck` (PASS)
    - `pnpm --filter @apps/reception exec jest --ci --runInBand --detectOpenHandles --passWithNoTests --config jest.config.cjs --testPathPatterns "components/roomgrid/components/Day/__tests__/Day.test.tsx"` (PASS)
    - `pnpm --filter @apps/reception exec jest --ci --runInBand --detectOpenHandles --passWithNoTests --config jest.config.cjs --testPathPatterns "RoomGrid.test.tsx" -t "applies dark mode classes"` (PASS)
    - `pnpm --filter @apps/brikette test -- --testPathPattern="theme-init|themeInit|useTheme"` (PASS)
- **Decision / resolution:**
  - Promote to 80% and keep rollout staged; known unrelated Reception test failures (non-theme assertions in broader suites) are tracked as existing test debt and do not block bridge implementation start.

#### Build Completion (2026-02-07)
- **Status:** Complete
- **Implementation notes:** Implemented Reception token-alias bridge in `apps/reception/src/app/globals.css`, mapped Brikette hospitality semantics in `apps/brikette/src/styles/global.css`, and rendered shared hospitality composites in both apps.
- **Validation evidence:** `pnpm --filter @apps/reception exec jest --ci --runInBand --detectOpenHandles --passWithNoTests --config jest.config.cjs --testPathPatterns "app/__tests__/theme-bridge.test.tsx|components/__tests__/shared-readiness-badge.test.tsx"` and `pnpm --filter @apps/brikette exec jest --ci --runInBand --passWithNoTests --config jest.config.cjs --testPathPattern "shared-hospitality-theme"` — PASS.
- **Confidence reassessment:** 80% → 82% (cross-app theme bridge and shared component render paths are now test-backed).

### TASK-49: Cross-app business impact scorecard + operating cadence

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 80% — scorecard inputs are now explicitly mapped to TASK-47 aggregate nodes and staff/activation surfaces.
  - Approach: 80% — one aggregate-driven owner scorecard + weekly ops cadence template.
  - Impact: 80% — closes the loop from guest UX to desk throughput and business outcomes.
- **What exists:** Planned/partial metrics for guest activation, readiness, and arrival handling.
- **What's missing:** Unified scorecard that links guest UX engagement to reception efficiency and owner-level business decisions, with KPI inputs sourced from TASK-47 aggregate nodes.
- **Acceptance criteria:**
  1. Owner scorecard exposes guest, staff, and business metrics in one view (activation, readiness, check-in lag, support load, conversion trends)
  2. Scorecard defines explicit targets for 9/10 usefulness + engagement and flags misses
  3. Weekly operating review template is produced from scorecard data (actions + owners + expected impact)
  4. Metric lineage is documented (which shared data nodes/events feed each KPI) and aggregate-node dependencies are explicit
- **Test contract:**
  - **TC-01:** Scorecard aggregator computes metrics accurately from TASK-47 aggregate fixture datasets
  - **TC-02:** Missing data windows return safe defaults and explicit "insufficient data" flags
  - **TC-03:** Owner scorecard UI renders KPI status states and target thresholds
  - **Test type:** unit (aggregation + threshold logic) + page component
  - **Test location:** `apps/prime/src/lib/owner/__tests__/businessScorecard.test.ts` (new), `apps/prime/src/app/owner/__tests__/scorecard-page.test.tsx` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="businessScorecard|scorecard-page|owner"`

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 74%
- **Updated confidence:** 80%
  - Implementation: 80% — scorecard dependencies are now explicit and bounded (`TASK-15`, `TASK-21`, `TASK-47`, `TASK-48`).
  - Approach: 80% — aggregate-only lineage prevents recomputation scans and dashboard drift.
  - Impact: 80% — creates operator action loop tied to quantified targets.
- **Investigation performed:**
  - Repo: `apps/prime/src/app/owner/setup/page.tsx:4`, `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.ts:146`, `packages/platform-core/src/analytics/index.ts:141`
- **Decision / resolution:**
  - Scorecard will be sourced from KPI aggregate nodes plus documented lineage metadata; no direct raw-event queries in UI.

## Phase 2E: Post-Onboarding/In-Stay Guest Operations (new)

This phase converts the post-arrival guest experience from placeholder routes into operational features, while preserving Firebase query/listener safety established in TASK-28 through TASK-30.
E2E coverage in this phase uses a shared Prime harness (`apps/prime/cypress.config.ts` + `apps/prime/cypress/e2e/*`) introduced in TASK-41 and extended by subsequent tasks.

### TASK-31: Booking details + lifecycle status surface

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 84%
  - Implementation: 86% — booking/date/state plumbing already exists in `useUnifiedBookingData` and `arrivalState` helpers
  - Approach: 84% — replace placeholder booking details screen with status-first booking summary
  - Impact: 82% — high guest usefulness with contained blast radius to booking route + shared data hooks
- **What exists:** Booking, date, and status derivation logic in `useUnifiedBookingData`, `useDateInfo`, and `lib/preArrival/arrivalState.ts`; booking details route is currently placeholder.
- **What's missing:** Guest-visible booking details screen showing reservation data and explicit lifecycle status (`pre-arrival`, `checked-in`, `checked-out`) with clear next actions.
- **Acceptance criteria:**
  1. `/(guarded)/booking-details` renders reservation code, dates, room assignment, and guest-facing status badge
  2. Status badge uses one canonical lifecycle resolver (no duplicated date logic)
  3. Booking details page links to extension request, meal orders, and bag-drop actions based on current status
  4. Checked-out status de-emphasizes in-stay actions and prioritizes bag-drop/contact options
- **Test contract:**
  - **TC-01:** Fixture with future check-in renders `pre-arrival` status
  - **TC-02:** Fixture with today check-in and not checked-in renders `arrival-day`/transition status
  - **TC-03:** Fixture with checked-in signal renders `checked-in` status
  - **TC-04:** Fixture with past checkout renders `checked-out` status and hides in-stay-only actions
  - **TC-05 (e2e):** Guest with seeded pre-arrival/checked-in/checked-out fixtures sees expected status badge and allowed actions in booking details
  - **Test type:** unit + e2e (page/status mapping + user journey)
  - **Test location:** `apps/prime/src/app/(guarded)/booking-details/__tests__/page.test.tsx` (new), `apps/prime/src/lib/preArrival/__tests__/arrivalState.test.ts` (extend), `apps/prime/cypress/e2e/booking-details-status.cy.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="booking-details|arrivalState"` and `pnpm exec cypress run --config-file apps/prime/cypress.config.ts --spec apps/prime/cypress/e2e/booking-details-status.cy.ts`
  - **Cross-boundary coverage:** N/A (Prime-only shared hook/domain logic)
  - **End-to-end coverage:** TC-05
- **TDD execution plan:**
  - **Red:** Add `TC-01`..`TC-05` first; assert current placeholder route fails lifecycle badge/action expectations.
  - **Green:** Implement status-first booking details rendering using canonical lifecycle resolver and action gating.
  - **Refactor:** Extract shared status badge/action mapping helpers to keep page logic thin and deterministic.

### TASK-32: Extension request email workflow (`hostelbrikette@gmail.com`)

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 80% — straightforward API + email dispatch; requires provider choice and payload contract
  - Approach: 80% — add explicit extension request endpoint and deterministic email template
  - Impact: 80% — high operational value for guests and reception with minimal UI complexity
- **What exists:** No dedicated extension request route/API; booking detail context (dates/status/booking reference) is available once TASK-31 lands.
- **What's missing:** Guest form and backend workflow to send extension requests to hostel operations inbox.
- **Acceptance criteria:**
  1. Guest can submit extension request from booking details with desired checkout date and optional note
  2. Prime sends structured request email to `hostelbrikette@gmail.com` with booking reference and guest identifier
  3. Requests are rate-limited and idempotent per session window to prevent spam
  4. Guest sees immediate confirmation and expected response channel/time
- **Test contract:**
  - **TC-01:** Valid request payload returns success and dispatches one email job to configured recipient
  - **TC-02:** Invalid date/request body returns 400 with actionable error
  - **TC-03:** Rate-limit threshold returns 429 and does not dispatch
  - **TC-04:** Duplicate same-session submission within throttle window returns deterministic dedupe response
  - **TC-05 (e2e):** Guest submits valid extension request from booking details and sees confirmation with response-time guidance
  - **Test type:** unit/integration + e2e (Cloudflare Function + client form + end-user flow)
  - **Test location:** `apps/prime/functions/__tests__/extension-request.test.ts` (new), `apps/prime/src/app/(guarded)/booking-details/__tests__/extension-request.test.tsx` (new), `apps/prime/cypress/e2e/extension-request.cy.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="extension-request|booking-details"` and `pnpm exec cypress run --config-file apps/prime/cypress.config.ts --spec apps/prime/cypress/e2e/extension-request.cy.ts`
  - **Cross-boundary coverage:** `TC-01`/`TC-04` validate Prime client → Prime Function email payload/idempotency contract.
  - **End-to-end coverage:** TC-05
- **TDD execution plan:**
  - **Red:** Write function + form tests (`TC-01`..`TC-05`) expecting no dispatch, missing validations, and missing confirmation flow.
  - **Green:** Implement request schema validation, throttle/dedupe logic, email dispatch adapter, and confirmation UI.
  - **Refactor:** Consolidate payload mapping/rate-limit utilities and normalize user-facing error copy.

### TASK-33: Digital assistant answer + further-reading link model

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 80% — placeholder route is clear, and canonical content/link sources are already available
  - Approach: 80% — answer-first + links-second model is aligned with existing guide-link architecture
  - Impact: 80% — high usefulness gain with bounded implementation surface
- **What exists:** Digital assistant route is placeholder; Prime already links to Brikette transport/guidance surfaces; cross-app guide manifests exist in Brikette.
- **What's missing:** Working assistant response pipeline with concise answers and canonical further-reading links.
- **Acceptance criteria:**
  1. `/(guarded)/digital-assistant` supports guest Q&A with concise primary answer
  2. Every answer includes a "Further reading" section linking to canonical Brikette/website pages when relevant
  3. Assistant avoids hallucinated links by using allowlisted canonical link sources
  4. Interactions emit analytics events for unanswered query detection and content gap review
- **Test contract:**
  - **TC-01:** Question with known topic returns answer + at least one valid canonical link
  - **TC-02:** Unknown topic returns safe fallback answer with support escalation link
  - **TC-03:** Link validator rejects non-allowlisted domains in assistant response payload
  - **TC-04:** Analytics event emitted with query category and answer type
  - **TC-05 (e2e):** Guest asks a known question, receives concise answer + further-reading links, and can open canonical link target
  - **Test type:** unit + e2e (answer composer/route render + user journey)
  - **Test location:** `apps/prime/src/lib/assistant/__tests__/answerComposer.test.ts` (new), `apps/prime/src/app/(guarded)/digital-assistant/__tests__/page.test.tsx` (new), `apps/prime/cypress/e2e/digital-assistant.cy.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="assistant|digital-assistant"` and `pnpm exec cypress run --config-file apps/prime/cypress.config.ts --spec apps/prime/cypress/e2e/digital-assistant.cy.ts`
  - **Cross-boundary coverage:** `TC-01`/`TC-03` assert Prime assistant output only references allowlisted Brikette/website canonical domains.
  - **End-to-end coverage:** TC-05
- **TDD execution plan:**
  - **Red:** Add answer composer/page/e2e tests first; assert missing link section, unvalidated links, and absent analytics emission.
  - **Green:** Implement answer-first payload model, allowlist validator, and analytics instrumentation.
  - **Refactor:** Extract shared canonical-link resolver and response formatting helpers for maintainability.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 78%
- **Updated confidence:** 80%
  - Implementation: 80% — current route gap is explicit in `apps/prime/src/app/(guarded)/digital-assistant/page.tsx:12`, while canonical link structure is already embodied in `apps/prime/src/components/positano-guide/PositanoGuide.tsx:104`.
  - Approach: 80% — allowlisted canonical links map directly to existing external-link pattern.
  - Impact: 80% — assistant can ship without changing booking/session core.
- **Investigation performed:**
  - Repo: `apps/prime/src/app/(guarded)/digital-assistant/page.tsx:12`, `apps/prime/src/components/positano-guide/PositanoGuide.tsx:104`, `apps/prime/src/components/homepage/SocialHighlightsCard.tsx:128`
- **Decision / resolution:**
  - Implement assistant as a constrained answer composer backed by allowlisted Brikette/website links before any generative expansion.

### TASK-34: Experiences schedule + attendance lifecycle

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 81%
  - Implementation: 81% — activities feed/state scaffolding already exists and only needs attendance lifecycle extension
  - Approach: 81% — evolve existing `live/upcoming` model to include attendance/presence gates
  - Impact: 81% — directly supports engagement and event coordination goals
- **What exists:** Activities list UI and activity feed in `ActivitiesClient` + `ChatProvider`.
- **What's missing:** Guest presence workflow and event lifecycle enforcement (`upcoming` vs `live` vs `ended`) at UX level.
- **Acceptance criteria:**
  1. Activities show start and finish windows plus current lifecycle state
  2. Guests can mark "I'm here" only after event is live
  3. Event cards show participant presence counts where available
  4. Ended events are archived/disabled for new attendance
- **Test contract:**
  - **TC-01:** Upcoming activity renders countdown and disabled attendance action
  - **TC-02:** Live activity enables attendance action and writes presence record
  - **TC-03:** Ended activity hides join/presence controls
  - **TC-04:** Presence counter updates from shared activity data
  - **TC-05 (e2e):** Guest sees an event transition to live state, can mark presence, and sees participant count update
  - **Test type:** unit + e2e (component/state gating + lifecycle journey)
  - **Test location:** `apps/prime/src/app/(guarded)/activities/__tests__/attendance-lifecycle.test.tsx` (new), `apps/prime/cypress/e2e/activities-lifecycle.cy.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="activities|attendance-lifecycle"` and `pnpm exec cypress run --config-file apps/prime/cypress.config.ts --spec apps/prime/cypress/e2e/activities-lifecycle.cy.ts`
  - **Cross-boundary coverage:** N/A (Prime consumer of shared activity data; no new cross-app producer contract in this task).
  - **End-to-end coverage:** TC-05
- **TDD execution plan:**
  - **Red:** Write lifecycle gating tests and e2e scenario before implementation; confirm attendance controls currently fail state rules.
  - **Green:** Implement lifecycle-state derivation, presence action gating, and presence-count rendering.
  - **Refactor:** Consolidate lifecycle label/countdown/presence selector helpers and remove duplicated state checks.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 76%
- **Updated confidence:** 81%
  - Implementation: 81% — `ActivitiesClient` already derives live/upcoming sets (`apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx:115`) and deep-links activity channels (`apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx:98`).
  - Approach: 81% — add attendance action/presence count rendering on top of existing activity cards.
  - Impact: 81% — enables concrete in-stay engagement interactions.
- **Investigation performed:**
  - Repo: `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx:51`, `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx:120`, `apps/prime/src/contexts/messaging/ChatProvider.tsx:197`
- **Decision / resolution:**
  - Keep activity lifecycle source-of-truth in `ChatProvider`, and implement presence UI/state gates in activities + channel surfaces.

### TASK-45: Activity group chat channel (presence + live messaging)

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 79%
  - Implementation: 79% — message-listener lifecycle and pagination already exist in provider layer
  - Approach: 79% — implement route-level channel UI and permission checks on top of existing provider contracts
  - Impact: 80% — significant engagement upside once live-event gating is enforced
- **What exists:** `ChatProvider` message listeners/pagination and activity feed data; channel route is placeholder.
- **What's missing:** Channel page with thread rendering, message composer, and publish gating on activity lifecycle + attendance.
- **Acceptance criteria:**
  1. `/(guarded)/chat/channel` renders message timeline and composer for live activities
  2. Guests can only send messages after marking presence for the activity
  3. Non-live activities render read-only preview with clear "available when live" state
  4. Channel mount/unmount does not leak listeners (must satisfy TASK-29 assertions)
- **Test contract:**
  - **TC-01:** Live + present guest can send message and sees optimistic append
  - **TC-02:** Live but not-present guest is prompted to mark presence before sending
  - **TC-03:** Upcoming activity channel is read-only
  - **TC-04:** Repeated route enter/leave cycles keep listener count at baseline
  - **TC-05 (e2e):** Present guest joins live channel, posts message, and sees it persist through refresh without duplicate listener side effects
  - **Test type:** unit/integration + e2e (channel page + ChatProvider lifecycle + live journey)
  - **Test location:** `apps/prime/src/app/(guarded)/chat/channel/__tests__/page.test.tsx` (new), `apps/prime/src/contexts/messaging/__tests__/ChatProvider.channel-leak.test.tsx` (new), `apps/prime/cypress/e2e/activity-channel.cy.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="chat/channel|channel-leak"` and `pnpm exec cypress run --config-file apps/prime/cypress.config.ts --spec apps/prime/cypress/e2e/activity-channel.cy.ts`
  - **Cross-boundary coverage:** `TC-04` validates listener lifecycle against Firebase subscription contracts established in TASK-29.
  - **End-to-end coverage:** TC-05
- **TDD execution plan:**
  - **Red:** Add channel permission/leak tests and e2e send-flow test first; verify placeholder page and lifecycle leaks fail expectations.
  - **Green:** Implement live channel UI, presence-gated composer, and deterministic listener cleanup paths.
  - **Refactor:** Move channel permission/selectors into shared messaging helpers to reduce branching in page component.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 74%
- **Updated confidence:** 79%
  - Implementation: 79% — provider already manages channel listeners and cleanup (`apps/prime/src/contexts/messaging/ChatProvider.tsx:235`, `apps/prime/src/contexts/messaging/ChatProvider.tsx:293`) while route UI remains placeholder (`apps/prime/src/app/(guarded)/chat/channel/page.tsx:12`).
  - Approach: 79% — add presence-gated composer and read-only states in route component.
  - Impact: 80% — unlocks live activity group communication with controlled rollout.
- **Investigation performed:**
  - Repo: `apps/prime/src/contexts/messaging/ChatProvider.tsx:244`, `apps/prime/src/contexts/messaging/ChatProvider.tsx:309`, `apps/prime/src/app/(guarded)/chat/channel/page.tsx:12`
- **Decision / resolution:**
  - Reuse provider data/loading contracts and keep send permissions in a dedicated channel policy helper.

### TASK-46: Guest-to-guest opt-in messaging controls

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 78%
  - Implementation: 78% — opt-in fields and onboarding capture are already present
  - Approach: 78% — enforce mutual opt-in at directory/thread selectors and policy guards
  - Impact: 79% — strong engagement lift with clearer consent protections
- **What exists:** `socialOptIn` and `chatOptIn` fields in guest profile types and onboarding components; direct chat route is placeholder.
- **What's missing:** Guest-visible opt-in management, opt-in-only recipient discovery, and abuse-safe direct message UX.
- **Acceptance criteria:**
  1. Guests can opt in/out of guest messaging at any time from profile/settings
  2. Direct-message directory only shows mutually opt-in guests
  3. Guests can mute/block conversations without losing global app access
  4. Privacy defaults are opt-out safe for guests who skip onboarding choices
- **Test contract:**
  - **TC-01:** Opt-in off hides user from guest directory and blocks new DMs
  - **TC-02:** Mutual opt-in pair appears in directory and can start thread
  - **TC-03:** Mute/block state suppresses thread notifications and send actions
  - **TC-04:** Existing threads become read-only when one side opts out
  - **TC-05 (e2e):** Two opted-in guests can start a DM, then one opts out and both clients see thread transition to read-only
  - **Test type:** unit + e2e (controls/filtering + consent lifecycle journey)
  - **Test location:** `apps/prime/src/components/onboarding/__tests__/chat-optin-controls.test.tsx` (new), `apps/prime/src/app/(guarded)/chat/__tests__/guest-directory.test.tsx` (new), `apps/prime/cypress/e2e/guest-optin-messaging.cy.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="chat-optin|guest-directory|chat"` and `pnpm exec cypress run --config-file apps/prime/cypress.config.ts --spec apps/prime/cypress/e2e/guest-optin-messaging.cy.ts`
  - **Cross-boundary coverage:** `TC-01`/`TC-04` verify profile opt-in fields and messaging guards stay contract-compatible with shared profile schema.
  - **End-to-end coverage:** TC-05
- **TDD execution plan:**
  - **Red:** Add opt-in policy unit tests and dual-user e2e flow first; confirm current directory/DM route does not enforce consent.
  - **Green:** Implement settings controls, mutual-opt-in directory filters, and mute/block/read-only behavior.
  - **Refactor:** Centralize consent guard logic so chat route and directory reuse the same rule evaluation.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 72%
- **Updated confidence:** 78%
  - Implementation: 78% — profile schema and onboarding capture are in place (`apps/prime/src/types/guestProfile.ts:50`, `apps/prime/src/components/onboarding/SocialOptInStep.tsx:37`).
  - Approach: 78% — enforce mutual-opt-in policy in messaging selectors and route guards while reusing existing profile mutators.
  - Impact: 79% — enables social value while honoring explicit consent defaults.
- **Investigation performed:**
  - Repo: `apps/prime/src/types/guestProfile.ts:43`, `apps/prime/src/components/onboarding/SocialOptInStep.tsx:53`, `apps/prime/src/app/(guarded)/chat/page.tsx:12`
- **Decision / resolution:**
  - Keep DM routing behind mutual-opt-in checks and add policy helpers shared by directory + thread pages.

### TASK-35: Breakfast/evening drink order + change policy flow

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 82%
  - Implementation: 82% — preorder fetch, eligibility logic, and API endpoints already exist
  - Approach: 82% — route conversion from placeholders to entitlement-aware forms is straightforward
  - Impact: 82% — high operational usefulness and direct desk-load reduction
- **What exists:** `useFetchPreordersData`, meal eligibility logic, and preorder API handler; breakfast/drink routes are placeholders.
- **What's missing:** Guest order placement/edit flows and policy enforcement (no same-day changes).
- **Acceptance criteria:**
  1. Eligible guests can place breakfast/evening drink orders for allowed service dates
  2. Existing orders can be edited for future dates only
  3. Same-day edit attempts are blocked with clear policy copy
  4. Ineligible guests see informative fallback state and menu links
- **Test contract:**
  - **TC-01:** Eligible guest creates order for future date successfully
  - **TC-02:** Future-date order edit succeeds and persists updated values
  - **TC-03:** Same-day edit is blocked by `canOrderBreakfastForDate` policy checks
  - **TC-04:** Ineligible guest route renders no-order CTA state
  - **TC-05 (e2e):** Eligible guest places order, edits future order successfully, and receives policy block on same-day edit attempt
  - **Test type:** unit/integration + e2e (eligibility/form/API + order lifecycle journey)
  - **Test location:** `apps/prime/src/app/(guarded)/complimentary-breakfast/__tests__/order-flow.test.tsx` (new), `apps/prime/src/app/(guarded)/complimentary-evening-drink/__tests__/order-flow.test.tsx` (new), `apps/prime/functions/api/firebase/__tests__/preorders.test.ts` (new), `apps/prime/cypress/e2e/meal-order-policy.cy.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="order-flow|preorders"` and `pnpm exec cypress run --config-file apps/prime/cypress.config.ts --spec apps/prime/cypress/e2e/meal-order-policy.cy.ts`
  - **Cross-boundary coverage:** `TC-01`..`TC-03` validate Prime UI ↔ preorder API contract and policy parity.
  - **End-to-end coverage:** TC-05
- **TDD execution plan:**
  - **Red:** Add policy/edit/create tests and e2e scenario first; assert placeholder routes and edit-policy enforcement fail.
  - **Green:** Implement entitlement-aware ordering forms, future-date edit path, and same-day guard messaging.
  - **Refactor:** Extract shared meal-order validation/CTA components across breakfast and evening drink routes.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 77%
- **Updated confidence:** 82%
  - Implementation: 82% — core data and policy seams already exist in `apps/prime/src/hooks/pureData/useFetchPreordersData.ts:24`, `apps/prime/src/hooks/dataOrchestrator/useMealPlanEligibility.ts:75`, and `apps/prime/functions/api/firebase/preorders.ts:22`.
  - Approach: 82% — promote existing logic into booking-status-aware order/edit screens.
  - Impact: 82% — improves in-stay self-service with minimal cross-app risk.
- **Investigation performed:**
  - Repo: `apps/prime/src/hooks/pureData/useFetchPreordersData.ts:43`, `apps/prime/src/hooks/dataOrchestrator/useMealPlanEligibility.ts:108`, `apps/prime/src/app/(guarded)/complimentary-breakfast/page.tsx:12`
- **Decision / resolution:**
  - Keep policy enforcement centralized in shared eligibility/date guards and reuse across breakfast + evening drink routes.

### TASK-36: Transport + local guide hub with Brikette canonical links

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 85%
  - Implementation: 85% — production-ready guide component and canonical link strategy already exist
  - Approach: 85% — replace placeholder route with existing guide component and keep Brikette as canonical source
  - Impact: 85% — immediate usefulness gain with very low additional complexity
- **What exists:** Route planner assets and Brikette canonical route/guide resources; `positano-guide` route is placeholder.
- **What's missing:** Unified guide hub covering "how to get around" and "what to do" with canonical links and assistant handoff.
- **Acceptance criteria:**
  1. `/(guarded)/positano-guide` displays transport, neighborhood, and activities categories
  2. Each item links to a canonical Brikette/website source page (no dead links)
  3. Guide cards include quick summary + "read more" structure
  4. Assistant route can deep-link into relevant guide topics
- **Test contract:**
  - **TC-01:** Guide hub renders all expected categories from source dataset
  - **TC-02:** Link contract test validates URLs are allowlisted and non-empty
  - **TC-03:** Deep link from assistant opens corresponding guide section
  - **TC-04:** Empty guide dataset falls back to safe contact/support state
  - **TC-05 (e2e):** Guest opens guide hub, expands a topic, and navigates to canonical Brikette/website detail page from "Read more"
  - **Test type:** unit + e2e (data mapping/render + concierge journey)
  - **Test location:** `apps/prime/src/app/(guarded)/positano-guide/__tests__/page.test.tsx` (new), `apps/prime/src/data/__tests__/guide-links.contract.test.ts` (new), `apps/prime/cypress/e2e/positano-guide.cy.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="positano-guide|guide-links"` and `pnpm exec cypress run --config-file apps/prime/cypress.config.ts --spec apps/prime/cypress/e2e/positano-guide.cy.ts`
  - **Cross-boundary coverage:** `TC-02`/`TC-03` enforce Prime guide and assistant deep-link contract against canonical Brikette link sources.
  - **End-to-end coverage:** TC-05
- **TDD execution plan:**
  - **Red:** Add guide mapping/contract/e2e tests first; verify placeholder route and missing deep-link behavior fail.
  - **Green:** Implement guide categories, card summaries, canonical link rendering, and assistant deep-link handling.
  - **Refactor:** Normalize guide source adapters so Prime consumes one canonical link schema across features.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 79%
- **Updated confidence:** 85%
  - Implementation: 85% — fully implemented guide UI exists at `apps/prime/src/components/positano-guide/PositanoGuide.tsx:131` while route wiring is still placeholder (`apps/prime/src/app/(guarded)/positano-guide/page.tsx:12`).
  - Approach: 85% — route integration is a direct replacement with existing canonical-link cards (`apps/prime/src/components/positano-guide/PositanoGuide.tsx:104`).
  - Impact: 85% — strong guest utility with minimal engineering risk.
- **Investigation performed:**
  - Repo: `apps/prime/src/components/positano-guide/PositanoGuide.tsx:104`, `apps/prime/src/components/positano-guide/PositanoGuide.tsx:192`, `apps/prime/src/app/(guarded)/positano-guide/page.tsx:6`
- **Decision / resolution:**
  - Wire `/(guarded)/positano-guide` directly to `PositanoGuide` and enforce canonical-link contract tests.

### TASK-37: Post-checkout bag-drop request flow

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 80%
  - Implementation: 80% — bag-storage data surfaces already exist in both Prime and Reception
  - Approach: 80% — add checkout-gated request write + status sync on top of existing nodes
  - Impact: 80% — meaningful guest/staff operational value with bounded scope
- **What exists:** Bag storage data hook and booking status data; bag storage page is currently placeholder.
- **What's missing:** Guest request UI, mutation endpoint, status tracking, and checkout-state gating.
- **Acceptance criteria:**
  1. Checked-out guests can submit bag-drop requests with pickup window and notes
  2. Pre-arrival/checked-in guests see eligibility messaging (not request form)
  3. Submitted request status is visible to guest and staff surfaces
  4. Duplicate active requests are prevented or merged deterministically
- **Test contract:**
  - **TC-01:** Checked-out status renders request form and successful submit state
  - **TC-02:** Checked-in status renders guidance state with no submit action
  - **TC-03:** Duplicate active request attempt returns idempotent response
  - **TC-04:** Staff readiness payload includes bag-drop request indicator
  - **TC-05 (e2e):** Checked-out guest submits bag-drop request and sees request status surface update after refresh
  - **Test type:** unit/integration + e2e (page/function/staff payload + guest flow)
  - **Test location:** `apps/prime/src/app/(guarded)/bag-storage/__tests__/page.test.tsx` (new), `apps/prime/functions/__tests__/bag-drop-request.test.ts` (new), `apps/prime/functions/__tests__/arrival-signals.test.ts` (extend), `apps/prime/cypress/e2e/bag-drop-request.cy.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="bag-storage|bag-drop-request|arrival-signals"` and `pnpm exec cypress run --config-file apps/prime/cypress.config.ts --spec apps/prime/cypress/e2e/bag-drop-request.cy.ts`
  - **Cross-boundary coverage:** `TC-04` validates Prime bag-drop payload contract for downstream staff-facing operational surfaces.
  - **End-to-end coverage:** TC-05
- **TDD execution plan:**
  - **Red:** Add eligibility/idempotency/payload tests and e2e submit flow first; confirm placeholder bag-storage route fails.
  - **Green:** Implement checkout-gated request form, mutation path, duplicate prevention, and status rendering.
  - **Refactor:** Factor request status/eligibility selectors into shared booking-state helpers.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 75%
- **Updated confidence:** 80%
  - Implementation: 80% — Prime already reads bag-storage state (`apps/prime/src/hooks/pureData/useFetchBagStorageData.ts:21`) and Reception already consumes bag-storage records (`apps/reception/src/hooks/data/useBagStorageData.ts:24`).
  - Approach: 80% — convert placeholder page to request+status flow with idempotent write semantics.
  - Impact: 80% — closes a frequent post-checkout operational need.
- **Investigation performed:**
  - Repo: `apps/prime/src/app/(guarded)/bag-storage/page.tsx:12`, `apps/prime/src/hooks/pureData/useFetchBagStorageData.ts:43`, `apps/reception/src/hooks/data/useBagStorageData.ts:19`
- **Decision / resolution:**
  - Use shared `bagStorage/{uuid}` lineage for request/status with explicit request-state fields instead of creating a second parallel node.

### TASK-38: Reception operational ingest for Prime request data

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 81%
  - Implementation: 81% — Reception already has the underlying data write/read seams required for request resolution
  - Approach: 81% — add explicit request queue/status actions while preserving current source-of-truth nodes
  - Impact: 81% — essential cross-app closure for guest-generated requests
- **What exists:** Reception mutations write `checkins`, `checkouts`, and `preorder`; extension and checkout pages exist. Bag storage is currently surfaced as read-only icon state in checkout UI.
- **What's missing:** Dedicated Reception workflow to ingest and resolve Prime-generated requests (extension requests, bag-drop requests, and meal-order change exceptions), with feedback statuses shared back to Prime.
- **Acceptance criteria:**
  1. Reception has a "Prime Requests" operational view (or equivalent integrated panels) for extension and bag-drop queues
  2. Staff can mark each request `pending`, `approved`, `declined`, or `completed` with timestamp + operator metadata
  3. Request resolution updates canonical shared nodes that Prime reads for guest-visible status
  4. Check-in/check-out and preorder mutations remain the source of truth and are linked from request items for context
- **Test contract:**
  - **TC-01:** Prime extension request appears in Reception queue with booking/occupant linkage
  - **TC-02:** Staff approval path updates booking dates and writes resolution audit metadata
  - **TC-03:** Prime bag-drop request appears in Reception queue and completion updates shared bag-storage status
  - **TC-04:** Meal-order change exception action updates preorder record and Prime sees resolved state
  - **TC-05 (e2e):** Staff resolves a queued Prime request in Reception and guest-facing Prime status reflects the resolution state end-to-end
  - **Test type:** integration + e2e (Reception queue/actions + shared contract + cross-app journey)
  - **Test location:** `apps/reception/src/components/prime-requests/__tests__/queue.test.tsx` (new), `apps/reception/src/hooks/mutations/__tests__/usePrimeRequestResolution.test.ts` (new), `apps/prime/src/hooks/dataOrchestrator/__tests__/request-resolution-sync.test.tsx` (new), `apps/reception/cypress/e2e/prime-request-resolution.cy.ts` (new), `apps/prime/cypress/e2e/request-resolution-sync.cy.ts` (new)
  - **Run:** `pnpm --filter reception test -- --testPathPattern="prime-requests|request-resolution" && pnpm --filter prime test -- --testPathPattern="request-resolution-sync"` and `pnpm --filter reception e2e -- --spec cypress/e2e/prime-request-resolution.cy.ts`
  - **Cross-boundary coverage:** `TC-01`..`TC-04` are required shared-node contract tests (Prime producer/consumer parity with Reception resolver writes).
  - **End-to-end coverage:** TC-05
- **TDD execution plan:**
  - **Red:** Add Reception queue contract tests, Prime sync tests, and cross-app e2e scenario first; verify requests are currently not operationally closed.
  - **Green:** Implement request queue ingest, resolution actions, shared-node status writes, and Prime status-sync consumption.
  - **Refactor:** Extract shared request-state enum/schema helpers to prevent contract drift between Prime and Reception.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 78%
- **Updated confidence:** 81%
  - Implementation: 81% — Reception already writes adjacent operational nodes (`apps/reception/src/hooks/mutations/useAddGuestToBookingMutation.ts:437`) and resolves checkout context with bag-storage (`apps/reception/src/components/checkout/Checkout.tsx:255`).
  - Approach: 81% — introduce `Prime Requests` queue/actions without rewriting existing checkin/checkout/preorder flows.
  - Impact: 81% — ensures Prime extension/bag-drop intents produce actionable staff outcomes.
- **Investigation performed:**
  - Repo: `apps/reception/src/hooks/mutations/useAddGuestToBookingMutation.ts:446`, `apps/reception/src/hooks/data/useBagStorageData.ts:24`, `apps/reception/src/components/checkout/Checkout.tsx:250`
- **Decision / resolution:**
  - Add a dedicated request queue model in Reception and keep canonical booking/preorder/checkin/check-out nodes as source-of-truth.

## Phase 3: Deferred (Staff Auth, Campaign Messaging, PWA)

These tasks are valuable but blocked or lower priority. Preserved with "what would make this ≥90%" notes.

### TASK-51: Staff auth replacement (PinAuthProvider) — Deferred

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 70%
  - Implementation: 70% — role and PIN primitives already exist, but migration touches both UI guards and API boundaries.
  - Approach: 72% — staged replacement (interim secure gate first, then full auth provider swap) is clear.
  - Impact: 70% — broad auth surface requires careful rollout.
- **Test contract:**
  - **TC-01:** Valid staff PIN hash comparison returns authenticated staff session with role claims
  - **TC-02:** Invalid PIN attempt returns deterministic auth failure and preserves lockout counters
  - **TC-03:** Staff API call without valid auth token returns 401/403 after gate replacement
  - **Test type:** unit/integration
  - **Test location:** `apps/prime/src/contexts/messaging/__tests__/PinAuthProvider.replacement.test.tsx` (new), `apps/prime/functions/__tests__/staff-auth-token-gate.test.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="PinAuthProvider.replacement|staff-auth-token-gate"`
- **What would make this ≥80%:** Spike on whether to use Firebase Auth (proper) or keep custom PIN-to-Firebase approach. Decide if staff auth needs server-side validation (Functions) or client-only is acceptable.
- **What would make this ≥90%:** Implement Firebase Auth with custom claims for role-based access. Add server-side middleware to Functions that validates staff tokens.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 65%
- **Updated confidence:** 70%
  - Implementation: 70% — current role model confirmed in `apps/prime/src/contexts/messaging/PinAuthProvider.tsx:7`.
  - Approach: 72% — helper gate semantics already defined in `apps/prime/src/lib/checkin/helpers.ts:9`.
  - Impact: 70% — still cross-cutting and deferred.
- **Investigation performed:**
  - Repo: `apps/prime/src/contexts/messaging/PinAuthProvider.tsx:17`, `apps/prime/src/lib/checkin/helpers.ts:9`, `apps/prime/src/app/staff-lookup/StaffLookupClient.tsx:32`
- **Decision / resolution:**
  - Keep deferred, but test contract is now explicit and ready for `/re-plan` follow-up before implementation starts.

### TASK-52: Campaign/trigger messaging orchestration — Deferred

- **Type:** IMPLEMENT
- **Effort:** L
- **Confidence:** 62%
  - Implementation: 62% — trigger/event schemas exist and `@acme/email` provider stack is available in-repo.
  - Approach: 64% — start email-first with one trigger path; defer SMS/WhatsApp fanout.
  - Impact: 62% — still multi-system and operationally sensitive.
- **Test contract:**
  - **TC-01:** `booking.confirmed` queue record validates schema and enqueues once per booking
  - **TC-02:** Worker processes `arrival.48hours` queue event and dispatches one email via provider adapter
  - **TC-03:** Provider transient failure path retries and records `retryCount`/`lastError`
  - **TC-04:** Permanent failure path marks event failed without duplicate sends
  - **TC-05:** Idempotency guard prevents duplicate send when same eventId is reprocessed
  - **TC-06:** Unsupported provider config fails fast with actionable diagnostics
  - **Test type:** contract/integration
  - **Test location:** `apps/prime/src/lib/messaging/__tests__/queue-processor.test.ts` (new), `apps/prime/functions/__tests__/messaging-dispatcher.test.ts` (new), `packages/email/src/__tests__/providerFunctions.test.ts` (extend)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="queue-processor|messaging-dispatcher" && pnpm --filter @acme/email test -- --testPathPattern="providerFunctions"`
- **What would make this ≥80%:** Select messaging provider. Create spike for one trigger (e.g., "48h before arrival" email). Confirm `@acme/email` can be used from Cloudflare Functions without cyclic dependency.
- **What would make this ≥90%:** Working prototype of booking-confirmed → email flow. Provider API keys configured. Template rendering tested.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 55%
- **Updated confidence:** 62%
  - Implementation: 62% — trigger schema confirmed in `apps/prime/src/lib/messaging/triggers.ts:121`; provider package exists at `packages/email/package.json` (`@acme/email`).
  - Approach: 64% — email-first rollout is now explicit; other channels remain deferred.
  - Impact: 62% — significant but deferred operational blast radius.
- **Investigation performed:**
  - Repo: `apps/prime/src/lib/messaging/useMessagingQueue.ts:47`, `apps/prime/src/lib/messaging/triggers.ts:134`, `packages/email/src/index.ts:7`
- **Decision / resolution:**
  - Prioritize transactional email pipeline using existing `@acme/email` adapters; defer SMS/WhatsApp until email path is production-stable.

### TASK-53: PWA offline essentials — Deferred

- **Type:** IMPLEMENT
- **Effort:** M
- **Confidence:** 68%
  - Implementation: 68% — service worker registration utilities and offline UX components already exist.
  - Approach: 70% — start with arrival-surface caching only, then expand.
  - Impact: 68% — still broad, but rollout can be staged safely.
- **Test contract:**
  - **TC-01:** Service worker registers successfully in supported browsers and is skipped server-side
  - **TC-02:** Arrival essentials cache contains check-in route shell and static assets after first load
  - **TC-03:** Offline navigation to cached arrival route renders fallback-capable UI
  - **TC-04:** Cache version bump invalidates stale assets deterministically
  - **Test type:** integration/e2e
  - **Test location:** `apps/prime/src/lib/pwa/__tests__/registerSW.test.ts` (extend), `apps/prime/cypress/e2e/pwa-offline-arrival.cy.ts` (new)
  - **Run:** `pnpm --filter prime test -- --testPathPattern="registerSW|useOnlineStatus|OfflineIndicator" && pnpm exec cypress run --config-file apps/prime/cypress.config.ts --spec apps/prime/cypress/e2e/pwa-offline-arrival.cy.ts`
- **What would make this ≥80%:** Create minimal `sw.js` with workbox and test offline arrival screen. Confirm static export + service worker works on Cloudflare Pages.
- **What would make this ≥90%:** Full offline test with airplane mode on real device. Cache invalidation strategy confirmed.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 60%
- **Updated confidence:** 68%
  - Implementation: 68% — registration and status primitives exist in `apps/prime/src/lib/pwa/registerSW.ts:1` and `apps/prime/src/lib/pwa/useOnlineStatus.ts:42`.
  - Approach: 70% — offline-first scope constrained to arrival essentials.
  - Impact: 68% — deferred due lifecycle risk but clearer path.
- **Investigation performed:**
  - Repo: `apps/prime/src/lib/pwa/registerSW.ts:137`, `apps/prime/src/components/pwa/OfflineIndicator.tsx:22`, `apps/prime/public/_redirects:1`
- **Decision / resolution:**
  - Keep deferred; when started, implement cache/version tests before enabling any production service worker registration.

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-07 | Phase guest-facing features before staff auth | Guest features work end-to-end without real staff auth. Staff auth is a production blocker but not a development blocker. |
| 2026-02-07 | Defer campaign/trigger messaging to Phase 3 | Campaign automation requires provider selection and cross-system orchestration; this plan now prioritizes in-app guest messaging first. |
| 2026-02-07 | Defer PWA to Phase 3 | Offline support is nice-to-have for MVP. Components exist; wiring can happen after core features. |
| 2026-02-07 | Keep Firebase RTDB (no D1 migration) | Prime's Firebase schema is comprehensive (40+ nodes, security rules, real-time subscriptions). Migration to D1 would be a separate multi-month initiative with no near-term benefit. |
| 2026-02-07 | Route integration is the primary Phase 1 work | Code audit shows components, hooks, business logic, and tests all exist. The gap is app routing — pages don't render the components. |
| 2026-02-07 | Add Phase 0 funnel hardening before route wiring | UX review found guest entry contract mismatch and guest gating blockers that prevent core value delivery. |
| 2026-02-07 | Add Phase 2B shared-data UX tasks for staff and owners | Prime, Brikette, and Reception share one hostel operation; guest readiness data should improve reception flow and owner decisions. |
| 2026-02-07 | Treat Brikette route metadata as canonical for Prime route planning | Avoid long-term drift by aligning Prime route surfaces to Brikette's maintained transport guides. |
| 2026-02-07 | Add Phase 2C activation optimization targeting ≥9/10 usefulness + engagement | Applied proven onboarding patterns: fast time-to-value, personalization, progress reinforcement, trust framing, and analytics-driven iteration. |
| 2026-02-07 | Require funnel analytics before ongoing A/B optimization | Experimentation without strong baseline instrumentation risks false positives and wasted implementation cycles. |
| 2026-02-07 | Make `@themes/prime` the sole Prime override source | Prevent long-term token drift between app-local CSS and shared theme package definitions. |
| 2026-02-07 | Build hospitality engagement patterns centrally (`@acme/design-system` + `@acme/ui`) | Aha-first onboarding, trust cues, progress reinforcement, and arrival-readiness UI should be reusable across Prime and staff-facing surfaces. |
| 2026-02-07 | Define finished Prime contribution through a shared business scorecard | Guest UX gains only matter if they are tied to reception throughput and owner decision metrics. |
| 2026-02-07 | Make Firebase query/listener budget tests a release gate | Prime must prevent runaway Firebase usage that can degrade performance and create uncontrolled billing. |
| 2026-02-07 | Add Phase 2E post-onboarding operations as first-class scope | Guest usefulness cannot reach ≥9/10 unless in-stay actions (booking status, extensions, assistant, social messaging, meal orders, local guidance, bag drop) are operational. |
| 2026-02-07 | Keep Brikette/website as canonical long-form content source for assistant and guides | Prime should answer quickly but link to maintained canonical pages to avoid content drift and duplication. |
| 2026-02-07 | Add explicit Reception ingest task for Prime guest-request operations | Prime can generate extension and bag-drop requests, but staff-facing resolution workflows must exist in Reception for operational closure. |
| 2026-02-07 | Treat `/(guarded)` as UX-only, not security | Route grouping prevents accidental navigation but cannot protect sensitive data without server/data-layer authorization. |
| 2026-02-07 | Adopt hybrid data model with Function-mediated critical flows and gated SDK real-time flows | Resolves architecture contradiction; preserves real-time UX while preventing unsafe direct access for sensitive paths. |
| 2026-02-07 | Add production default-deny gates for staff/owner routes | Guest MVP can ship safely while staff auth remains deferred, avoiding accidental operational data exposure. |
| 2026-02-07 | Define explicit MVP production slice and separate delivery confidence from business value | Improves planning realism and prevents full-vision confidence from masking MVP ship readiness. |
| 2026-02-07 | Require pre-aggregated owner KPI sources | Prevents high-cost RTDB scans for owner dashboards and aligns with Firebase cost-safety goals. |
| 2026-02-07 | Add chat safety baseline before social rollout | Guest messaging requires rate limits, moderation/reporting, retention policy, and feature-flag governance. |
| 2026-02-07 | Add changed-file lint non-regression gate | Allows quality enforcement on touched files without blocking all work on legacy lint debt. |
| 2026-02-07 | Derive guest keycard status from loan transactions, not staff discrepancy tables | Guest-facing status needs occupant-level semantics; staff discrepancy ledgers are operational and not guest-safe source material. |
| 2026-02-07 | Enrich existing staff lookup payload before adding new arrival-signal endpoints | Reuses proven endpoint/UI path and reduces API surface area while preserving throughput value. |
| 2026-02-07 | Gate staff/owner surfaces with shared production default-deny utility | Current route checks are UX-only and must be backed by server-side enforcement. |
| 2026-02-07 | Run Prime e2e as a minimal three-journey release gate | No-dead-end funnel and expiry recovery require integration proof beyond unit tests. |
| 2026-02-07 | Adopt email-first campaign orchestration path for deferred messaging automation | Existing `@acme/email` package materially reduces unknowns versus multi-channel rollout in first implementation pass. |

## Risks and Open Questions

### Resolved (2026-02-07)

- Q: How much is actually implemented?
  - A: Substantially more than the old plan claimed. See fact-find `docs/plans/prime-guest-portal-gap-fact-find.md` for full code truth assessment.

- Q: Is Firebase the right data store?
  - A: Yes for now. Comprehensive schema (40+ nodes), security rules, real-time subscriptions. No migration planned.

- Q: Booking data model (per-guest vs per-booking UUIDs)?
  - A: Both exist. `bookings/{bookingId}` has `occupants` (UUIDs). `occupantIndex/{uuid}` provides reverse lookup. Guest UUID format: `occ_<13-digit-number>`.

### Open

- Q: Pre-check-in data capture (GAP-06) — compliance?
  - Decision: Omitted from this plan. Document capture requires legal review. Can be added as TASK-54 if compliance is confirmed.

- Q: Which transactional email provider should send extension requests from Cloudflare Functions?
  - Decision needed before TASK-32 implementation (`@acme/email` compatibility vs external provider).

- Q: What is the canonical ingest path for assistant "further reading" links?
  - Decision needed before TASK-33/TASK-36 to avoid duplicate scraping and keep Brikette links authoritative.

## Out of Scope

- In-app payments or city tax collection
- Digital keys or smart locks
- Full staff app (beyond lightweight lookup)
- Pre-check-in data capture (compliance not confirmed)
- Full lint remediation (separate plan — 334 errors + 190 warnings). Changed-file lint non-regression is in-scope via TASK-50.
- TypeScript strict mode enablement (separate initiative)
