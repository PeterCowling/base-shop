---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Critique-Score: 4.0
Critique-Verdict: credible
Feature-Slug: brikette-duplicate-screens
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/brikette-duplicate-screens/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260310122535-0004
Trigger-Why:
Trigger-Intended-Outcome:
---

# Brikette Duplicate Screens Fact-Find Brief

## Scope
### Summary
Two private-room booking screens — `ApartmentBookContent.tsx` and `DoubleRoomBookContent.tsx` — share ~85% structural overlap but have accumulated silent drift divergences over time without any shared abstraction or review mechanism. The most impactful divergence is the analytics layer: the apartment screen uses the deprecated `fireHandoffToEngine` call while the double-room screen uses the newer `trackThenNavigate` + `readAttribution` pattern, meaning apartment handoffs currently send no attribution data. Additional drift includes visual token inconsistencies, a missing test suite on double-room, and feature flags (`isLongStay`, `data-testid`) that exist on one component but not the other.

This fact-find scopes the fix to: (1) aligning the analytics pattern on apartment, (2) correcting visual token drift, and (3) adding test coverage for double-room. Full component extraction into a shared base is explicitly out of scope — the intentional differences (pax range, rate codes, FitCheck presence) make extraction non-trivial and not warranted for the current drift surface.

### Goals
- Identify and document all confirmed drift divergences between the two booking screens.
- Fix the analytics attribution gap on `ApartmentBookContent` (highest business impact).
- Correct visual token divergences so both screens render consistently.
- Add component-level tests for `DoubleRoomBookContent` to close the coverage gap.

### Non-goals
- Full shared-base component extraction (deferred — intentional differences are non-trivial).
- Unifying pax handling, rate codes, or room-specific copy.
- Removing `FitCheck` from the apartment screen.
- Adding a general-purpose "duplicate screen detector" to CI (future Ideas candidate, not now).

### Constraints & Assumptions
- Constraints:
  - Must not break existing GA4 event contracts. Apartment analytics events must preserve all existing fields; only the call pattern changes.
  - `fireHandoffToEngine` in `ga4-events.ts` must remain (other callers may exist).
  - No i18n changes — namespaces differ intentionally.
- Assumptions:
  - The `trackThenNavigate` + `readAttribution` pattern in `DoubleRoomBookContent` is the canonical pattern going forward, based on code evidence.
  - `isLongStay` is apartment-specific behaviour; it is intentional that double-room does not have it.
  - Visual token drift (`brand-accent` vs `brand-primary` for NR button, badge text colour, dark mode border) are bugs, not intentional design differences.

## Outcome Contract

- **Why:** Drift between near-duplicate screens is compounding silently; attribution data is already missing from apartment bookings, and visual inconsistencies are live. Fixing now prevents further compounding before the next feature layer touches these screens.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both booking screens use the canonical analytics pattern (attribution present on all handoffs); visual tokens are consistent; double-room has component-level tests matching apartment coverage.
- **Source:** auto

## Current Process Map

None: local code path only

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:**
  - n/a
- **Expected Artifacts:**
  - n/a
- **Expected Signals:**
  - n/a

## Evidence Audit (Current State)
### Entry Points
- `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx` — apartment booking client component (280 lines)
- `apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx` — double-room booking client component (267 lines)

### Key Modules / Files
- `apps/brikette/src/utils/ga4-events.ts` — contains `fireHandoffToEngine`, `createBrikClickId`, `fireWhatsappClick`
- `apps/brikette/src/utils/trackThenNavigate.ts` — contains `trackThenNavigate`; uses `transport_type: "beacon"` with 200ms timeout fallback and a navigation callback
- `apps/brikette/src/utils/entryAttribution.ts` — contains `readAttribution`; returns attribution carrier object or `null` when no carrier was set
- `apps/brikette/src/test/app/private-rooms/ga4-07-apartment-checkout.test.tsx` — apartment analytics test (exists)
- `apps/brikette/src/test/app/private-rooms/apartment-booking-url-matrix.test.tsx` — apartment URL matrix test (exists)
- `apps/brikette/src/components/apartment/FitCheck.tsx` — apartment-only component (intentional)
- `apps/brikette/src/components/booking/BookingCalendarPanel.tsx` — shared booking calendar (used by both)
- `apps/brikette/src/components/booking/PolicyFeeClarityPanel.tsx` — shared policy panel (used by both)

### Patterns & Conventions Observed
- **Analytics pattern (canonical, double-room):** `readAttribution()` called separately; `attributionFields` object built with explicit field renaming (`entry_source_surface`, `entry_source_cta`, etc.); spread into `trackThenNavigate("handoff_to_engine", { ...payload, ...attributionFields }, () => window.location.assign(url))`. When `readAttribution()` returns `null`, `attributionFields` spreads to empty object — null guard is required in migration.
- **Analytics pattern (deprecated, apartment):** `fireHandoffToEngine({ ...payload })` — no attribution call; attribution data absent from handoff events.
- **Token usage (NR button, double-room, correct):** `hover:border-brand-primary` + `bg-brand-primary/10` + `group-hover:bg-brand-primary`.
- **Token usage (NR button, apartment, drifted):** `hover:border-brand-accent` + `bg-brand-accent/10` + `group-hover:bg-brand-accent` — uses `brand-accent` where double-room uses `brand-primary`.
- **Badge text (double-room):** `text-brand-on-accent` — correct on-accent contrast token.
- **Badge text (apartment):** `text-brand-heading` — incorrect; heading token not appropriate for coloured badge background.
- **Dark mode border (double-room):** `dark:border-white/30` present on date selector card (line 154), rate options card (line 185), and WhatsApp CTA (line 257).
- **Dark mode border (apartment):** absent from all three corresponding elements — dark mode gap on 3 UI surfaces.
- evidence: `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`, `apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx`

### Data & Contracts
- Types/schemas/events:
  - `fireHandoffToEngine` payload: `{ handoff_mode, engine_endpoint, checkin, checkout, pax, rate_plan, room_id, source_route, cta_location, brik_click_id }`
  - `trackThenNavigate` payload (double-room, inferred from usage): includes same fields + attribution fields from `readAttribution()`
  - GA4 event contracts: must not regress; apartment must emit all current fields plus attribution enrichment
- Persistence:
  - `sessionStorage` key `apartment_booking_return` — apartment-only, intentional
- API/contracts:
  - `buildOctorateCalendarUrl` — shared utility, unchanged

### Dependency & Impact Map
- Upstream dependencies:
  - `ga4-events.ts` — both components; analytics pattern change targets apartment only
  - `BookingCalendarPanel` — shared, no change
  - `hotel.ts` / `BOOKING_CODE` — shared constants, no change
- Downstream dependents:
  - GA4 event stream: apartment handoff events will gain attribution fields after fix
  - No downstream code consumers of these components (route-level leaf components)
- Likely blast radius:
  - Small: apartment analytics call change is self-contained; visual token changes are CSS-only; test additions are additive

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest (governed runner), React Testing Library
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern=<pattern> --no-coverage`
- CI integration: Tests run in CI only (per `docs/testing-policy.md`)

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Apartment analytics | Unit (Jest) | `ga4-07-apartment-checkout.test.tsx` | Covers `fireHandoffToEngine` call — must be updated to test `trackThenNavigate` after migration |
| Apartment URL matrix | Unit (Jest) | `apartment-booking-url-matrix.test.tsx` | URL construction; unaffected by analytics change |
| Double-room | — | None | No component-level tests exist |

#### Coverage Gaps
- Untested paths:
  - `DoubleRoomBookContent.tsx` — zero test coverage; no analytics test, no URL matrix test
- Extinct tests:
  - None identified

#### Testability Assessment
- Easy to test:
  - Analytics call verification (mock `trackThenNavigate` / `readAttribution`, assert called with correct payload)
  - Visual token correctness (snapshot or className assertion)
- Hard to test:
  - Full booking flow E2E (Octorate redirect) — out of scope for this task
- Test seams needed:
  - None new required; existing mocking patterns from `ga4-07-apartment-checkout.test.tsx` apply

#### Recommended Test Approach
- Unit tests for: `DoubleRoomBookContent` analytics call (`trackThenNavigate` + `readAttribution`), button click triggers correct URL construction
- Integration tests for: None required at this scope
- E2E tests for: Not in scope
- Contract tests for: Not in scope

### Recent Git History (Targeted)
- `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx` — diverged from double-room at commit `de22fda440` ("TASK-12 — lock private product checkout segmentation"). Analytics pattern preserved from pre-split state; double-room was updated later to `trackThenNavigate` pattern but apartment was not backported.

## Engineering Coverage Matrix
| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | Both screens render NR/Flex booking cards; visual tokens diverged (brand-accent vs brand-primary for NR card, badge text, dark mode border) | Token drift is live; NR button on apartment renders with accent colour instead of primary | Yes — fix token divergences |
| UX / states | Required | Pax state, date state, long-stay flag — apartment only. isValidRange gating on both. | No UX regression risk from analytics change or token fix | No — no UX state changes |
| Security / privacy | N/A | No auth, no PII beyond what's already in URL params. | None | No |
| Logging / observability / audit | Required | GA4 events via `fireHandoffToEngine` (apartment) and `trackThenNavigate` (double-room). Attribution data absent from apartment handoffs. | Attribution gap is the primary business risk — apartment bookings cannot be attributed to source. | Yes — migrate apartment to `trackThenNavigate` + `readAttribution` |
| Testing / validation | Required | Apartment: 2 test files. Double-room: 0 test files. | Double-room has no tests; apartment test must be updated after analytics migration. | Yes — add double-room tests, update apartment test |
| Data / contracts | Required | GA4 event payload contracts. `sessionStorage` apartment key. | Must not drop existing GA4 fields when migrating analytics call. | Yes — verify field parity |
| Performance / reliability | Required | Beacon transport confirmed on both: `fireHandoffToEngine` uses beacon; `trackThenNavigate.ts:69` explicitly passes `transport_type: "beacon"` with 200ms timeout fallback and navigation callback. | No performance gap — migration is transport-equivalent. | No |
| Rollout / rollback | Required | No feature flag. Change is atomic per-component. | Simple code change; rollback = revert commit. Low risk. | No — standard rollback |

## Questions
### Resolved
- Q: Is `trackThenNavigate` the canonical pattern or is `fireHandoffToEngine` still live?
  - A: `trackThenNavigate` + `readAttribution` is the newer canonical pattern, confirmed by its presence in `DoubleRoomBookContent`. `fireHandoffToEngine` remains in codebase but double-room was migrated away from it, making it the pattern to match.
  - Evidence: `apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx`

- Q: Is `brand-accent` vs `brand-primary` for the NR card an intentional design difference or drift?
  - A: Drift. Both screens should use `brand-primary` for the NR card — the apartment screen was not updated when the double-room NR card was corrected. The flex card on both screens correctly uses `brand-primary`.
  - Evidence: Visual inspection of both component files; flex card on apartment uses `brand-primary`, confirming NR `brand-accent` is inconsistent even within the same component.

- Q: Should `isLongStay` be added to `DoubleRoomBookContent`?
  - A: No. `isLongStay` gates `data-long-stay-primary` on the WhatsApp CTA, which is apartment-specific product behaviour. Double-room has a fixed pax of 2 and different pricing dynamics; long-stay pricing logic does not apply.
  - Evidence: `isLongStay = nights > 14` only meaningful when pax/rate-code vary with stay length — apartment-only concern.

- Q: Does `trackThenNavigate` use beacon transport like `fireHandoffToEngine`?
  - A: Yes. `trackThenNavigate.ts:69` explicitly passes `transport_type: "beacon"` to `gtag`. It fires the event then calls the navigation callback (with 200ms timeout fallback). This is functionally equivalent to `fireHandoffToEngine` for same-tab navigation — no separate INVESTIGATE task is needed.
  - Evidence: `apps/brikette/src/utils/trackThenNavigate.ts:24,69`

### Open (Operator Input Required)
None. All decisions are agent-resolvable from code evidence.

## Confidence Inputs
- Implementation: 92% — entry points and drift divergences fully mapped; `trackThenNavigate` transport mode confirmed beacon; null guard pattern documented from double-room reference; only minor field-parity verification remains.
- Approach: 90% — fix-in-place approach is clearly right given intentional differences; no extraction needed.
- Impact: 85% — analytics attribution gap is measurable; visual fixes are low-risk. Attribution impact on GA4 attributable sessions is not quantified but is directionally clear.
- Delivery-Readiness: 90% — code evidence strong; transport mode confirmed; null guard pattern confirmed; dark mode scope corrected to 3 elements.
- Testability: 90% — existing test patterns directly applicable; test seams already in place.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `readAttribution()` returns null — migration omits null guard | Medium | Medium — runtime error spreading null to trackThenNavigate payload | Require null guard in analytics IMPLEMENT task acceptance; pattern is in `DoubleRoomBookContent:106-117` |
| NR button token fix (`brand-accent` → `brand-primary`) inverts intentional within-component colour differentiation | Low | Low-Medium — visual regression; apartment intentionally differentiates NR (accent) vs flex (primary) | Confirm design intent before committing token change |
| GA4 field regression during analytics migration | Low | High — drops existing event data | Field-by-field comparison of current `fireHandoffToEngine` call vs `trackThenNavigate` call required in acceptance |
| Dark mode added to apartment cards without UI QA | Low | Low — visual regression in dark mode | Manual QA pass on apartment booking page in dark mode after fix |

## Planning Constraints & Notes
- Must-follow patterns:
  - Analytics migration must preserve all existing GA4 event fields; field parity check is required before marking TASK complete.
  - Existing apartment tests (`ga4-07-apartment-checkout.test.tsx`) must be updated — not deleted — after analytics migration.
  - Tests run in CI only; do not run Jest locally.
- Rollout/rollback expectations:
  - All changes are atomic; rollback = git revert. No feature flag needed.
- Observability expectations:
  - After analytics migration, apartment `handoff_to_engine` events in GA4 should carry attribution fields matching double-room events.

## Suggested Task Seeds (Non-binding)
1. **IMPLEMENT**: Migrate `ApartmentBookContent` analytics call from `fireHandoffToEngine` to `trackThenNavigate` + attribution pattern matching `DoubleRoomBookContent`. Acceptance must include: field parity vs current `fireHandoffToEngine` call, null guard for `readAttribution()` returning null, update `ga4-07-apartment-checkout.test.tsx`. (Transport mode confirmed beacon — no separate INVESTIGATE needed.)
2. **IMPLEMENT**: Fix visual token drift: NR button hover `brand-accent` → `brand-primary`, badge text `text-brand-heading` → `text-brand-on-accent`, add `dark:border-white/30` to date selector card, rate options card, and WhatsApp CTA in apartment. Confirm NR=accent vs NR=primary design intent before committing.
3. **IMPLEMENT**: Add `DoubleRoomBookContent` component-level test suite (analytics call with attribution fields, URL construction per plan, button disabled state when no valid range).

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - None
- Deliverable acceptance package:
  - Both components use `trackThenNavigate` + `readAttribution` for checkout handoff
  - NR button hover tokens are `brand-primary` on both screens
  - Badge text is `text-brand-on-accent` on both screens
  - WhatsApp CTA has `dark:border-white/30` on both screens
  - `DoubleRoomBookContent` has ≥1 analytics test and ≥1 URL construction test
  - All existing apartment tests pass
- Post-delivery measurement plan:
  - Verify GA4 `handoff_to_engine` events from apartment carry attribution fields in next session after deploy

## Evidence Gap Review
### Gaps Addressed
- Analytics pattern confirmed by direct code comparison of both component files.
- Token divergences confirmed by token-by-token comparison.
- Test coverage gap confirmed by direct search: no test files found for `DoubleRoomBookContent`.
- Transport mode gap explicitly flagged as planning precondition (INVESTIGATE task seeded).

### Confidence Adjustments
- Transport mode verification gap reduces Implementation confidence from 95% to 88% — explicit precondition task mitigates planning risk.

### Remaining Assumptions
- `trackThenNavigate` transport mode is compatible with same-tab navigation (to be verified).
- Badge text `text-brand-on-accent` is the correct contrast token for the saving badge background — inferred from double-room code; no design spec verification.

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| ApartmentBookContent analytics | Yes | None | No |
| DoubleRoomBookContent analytics (canonical reference) | Yes | None | No |
| Visual token drift (NR card) | Yes | None | No |
| Badge text token drift | Yes | None | No |
| Dark mode border gap | Yes | None | No |
| Test landscape (apartment) | Yes | None | No |
| Test landscape (double-room) | Yes | [Missing] No tests exist | No — gap documented, test task seeded |
| `trackThenNavigate` transport mode | Partial | [Unverified] Transport compatibility with same-tab navigation | Yes — INVESTIGATE task required before IMPLEMENT |
| ga4-events.ts function signatures | Partial | Not directly read — inferred from usage patterns | No — planning precondition added |

## Scope Signal
- Signal: right-sized
- Rationale: Scope covers exactly the confirmed drift divergences (4 items) plus a test coverage gap, with no extraction work. All items are bounded to two leaf components with no shared downstream consumers. The only uncertainty (transport mode) is covered by a precondition INVESTIGATE task. No operator forks remain.

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-analysis brikette-duplicate-screens`
