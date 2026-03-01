---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Brikette Funnel
Workstream: Product-Engineering
Created: 2026-03-01
Last-updated: 2026-03-01
Last-reviewed: 2026-03-01
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-sales-funnel-analysis
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-seo, draft-email
Related-Plan: docs/plans/brikette-sales-funnel-analysis/plan.md
artifact: fact-find
Trigger-Source: direct-operator-decision: revised-ideal-funnel-under-octobook-no-paid-api
Trigger-Why: remove conversion dead ends and align Brikette funnel to an ideal session-first model under Octobook constraints
Trigger-Intended-Outcome: "type: operational | statement: implement an ideal, no-dead-end booking funnel with pre-handoff enforced booking limits and post-handoff guidance/recovery unless Octobook enforcement is verified | source: operator"
---

# Brikette Ideal Sales Funnel Fact-Find Brief

## Scope
### Summary
Assess the revised ideal funnel against current `apps/brikette` implementation and produce an implementation-ready fact-find that eliminates dead ends unless blocked by true impracticality.

### Goals
- Define a canonical booking state model for Brikette routes and CTA behavior.
- Preserve hard booking constraints as non-negotiable contracts.
- Surface only real blockers, contract conflicts, and sequencing risks that would create dead ends.
- Provide planning-ready task seeds that can be executed without architectural churn.
- Elevate post-handoff recovery to a first-class workstream under third-party checkout constraints.
- Preserve conversion anchoring without auto-seeded dates via an indicative pricing policy.

### Non-goals
- No code changes in this phase.
- No plan task execution.
- No speculative paid API dependencies.

### Constraints & Assumptions
- Constraints:
  - Hostel booking must enforce stay range `2..8` nights and max `8` pax per booking.
  - Hostel flow is adults-only; children are not accepted in hostel booking state/contracts.
  - If stay/pax demand exceeds per-booking limits (for example group/longer stays), funnel must route to multi-booking guidance rather than fail silently.
  - Octobook remains third-party checkout with limited post-click control.
  - Dead-end definition: any state where the user cannot proceed to either (a) valid Octobook handoff, or (b) a clear alternative conversion path (quote capture, contact, or WhatsApp).
- Assumptions:
  - Runtime booking state plus shared-tab continuity storage with TTL is feasible across `/[lang]`, `/[lang]/dorms`, `/[lang]/dorms/[slug]`, `/[lang]/book`.
  - Canonical handoff analytics can be normalized without paid API.

## System Contracts (Non-Negotiable)
### State Precedence & Persistence Contract
- URL params are ingress/egress format, not in-site continuity mechanism.
- Cross-tab continuity policy: use shared-tab storage with TTL (`localStorage`) for booking state continuity between tabs; runtime route state remains authoritative after hydration.
- On route load:
  1. If URL contains parseable `checkin/checkout/pax`, hydrate runtime state and shared-tab store from URL.
  2. Else if shared-tab store contains parseable non-stale booking state, hydrate runtime state from shared-tab store.
  3. Else use empty search state (date/pax prompt + indicative pricing only).
- Validation runs after hydration; parseable invalid states must preserve user-entered values and show corrective/split-booking guidance (no silent reset to empty).
- URL writes are allowed only for:
  - explicit `Apply/Search/Update` actions (single `replaceState`, no navigation push),
  - explicit share/copy-link action, and
  - Octobook handoff URL construction.
- URL must not be rewritten on every picker change.

### Enforcement Boundary Contract
- Brikette can enforce hostel constraints pre-handoff (UI validation + URL build guard).
- Octobook-side edit behavior is a separate enforcement boundary and must be validated/configured.
- No-JS fallback must not silently bypass non-negotiable hostel constraints.
- Until Octobook-side enforcement is confirmed, wording must be “pre-handoff enforced by Brikette” rather than guaranteed end-to-end enforcement.

### No-JS Booking Policy Contract
- Hostel no-JS path must not offer unconstrained direct Octobook booking.
- Hostel no-JS path must offer a clear alternative conversion path (contact/WhatsApp/assisted booking request) with explicit next action.
- Any future no-JS direct booking for hostel requires proof that non-negotiable constraints are still enforced post-handoff.

### Rate Plan Exposure Contract
- Room detail: expose both NR and Flex when search is valid.
- Listing and comparison surfaces: NR default + per-room Flex upsell affordance.
- Analytics payloads must carry selected rate plan consistently.

### Analytics Event Schema Contract
- Canonical outbound event: `handoff_to_engine`.
- Required params:
  - `checkin`, `checkout`, `pax`, `rate_plan`, `room_id`, `source_route`, `cta_location`, `brik_click_id`, `engine_endpoint`, `handoff_mode`.
- Firing rules:
  - fire once per explicit user handoff action,
  - never fire on render/hydration,
  - invalid-state interactions fire non-handoff UX event only (no false handoff emission).
- `brik_click_id` lifecycle is per-handoff-attempt interaction state, not continuity booking state: generated on click, never reused across attempts, not persisted in shared booking store.
- `begin_checkout` remains temporary compatibility only and must be explicitly sunset.

### SEO & Indexation Contract
- Canonical URLs for booking surfaces must strip booking query params.
- Parameterized variants must canonicalize to clean route URL.
- `/{lang}/book` defaults to `noindex,follow` unless explicit ranking strategy overrides it.
- Outbound booking-engine links use `rel=\"nofollow noopener noreferrer\"`.

### Indicative Pricing Contract (Search Absent State)
- When no valid search exists, show indicative anchor price (`From €X*`) with disclosure text.
- Dataset minimum fields:
  - `room_id`, `currency`, `indicative_from_per_night`, `basis`, `last_updated`.
- Governance:
  - named owner, update cadence, and stale-data threshold required.
  - if stale beyond threshold, indicative price is hidden and replaced with neutral prompt.

## Outcome Contract
- **Why:** Brikette needs an ideal, low-friction funnel where room-intent users can book fast, comparison users can browse clearly, and no route traps users in invalid or ambiguous state.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** migrate to a session-first booking funnel with explicit validity contracts (2–8 nights, max 8 adults in hostel), direct room-detail handoff, and no dead-end transitions.
- **Source:** operator

## Access Declarations
- `Octorate/Octobook backoffice configuration` - read access required to verify post-handoff enforcement (`UNVERIFIED`).
- `Octorate booking export samples` - read access required to verify click-id/query persistence (`UNVERIFIED`).
- `Ad/retargeting platform audiences (if recovery workstream enabled)` - read access to validate proxy audience feasibility (`UNVERIFIED`).

## Evidence Audit (Current State)
### Entry Points
- `apps/brikette/src/app/[lang]/HomeContent.tsx` - homepage booking state and room-carousel CTA routing.
- `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx` - dorms listing behavior and availability defaults.
- `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx` - room-detail state parsing, auto-seeding, sticky handoff.
- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` - comparison page booking query normalization.

### Key Modules / Files
- `apps/brikette/src/components/landing/BookingWidget.tsx` - writes query params into browser URL on each change and submits to `/book`.
- `apps/brikette/src/components/rooms/RoomsSection.tsx` - route-level CTA behavior, `singleCtaMode`, handoff routing.
- `packages/ui/src/organisms/RoomsSection.tsx` - detail link query propagation and single/dual CTA rendering.
- `packages/ui/src/molecules/SlideItem.tsx` - homepage room detail links omit booking context.
- `apps/brikette/src/utils/bookingDateRules.ts` - source of truth for min/max stay and pax limits.
- `apps/brikette/src/utils/buildOctorateUrl.ts` - hard validation gate before any direct handoff URL is emitted.
- `apps/brikette/src/utils/ga4-events.ts` - mixed `begin_checkout` and `handoff_to_engine` instrumentation contract.
- `apps/brikette/src/app/[lang]/book/page.tsx` - `/book` metadata and no-JS Octorate fallback link.
- `apps/brikette/src/app/_lib/metadata.ts` - noindex behavior controlled by `isPublished` flag.
- `packages/ui/src/organisms/StickyBookNow.tsx` - sticky deep-link fallback behavior and query parsing.

### Patterns & Conventions Observed
- Booking state is currently fragmented across component-local state and URL query params, not one canonical object.
- Current implementation still favors URL-carried continuity over session-carried continuity.
- Hostel validation is already strict in core utilities (`isValidStayRange`, `isValidPax`) and should remain canonical.
- Direct handoff and analytics behavior are partially migrated but not consistently canonicalized.

### Data & Contracts
- Hard booking rule contract (already implemented):
  - `HOSTEL_MIN_STAY_NIGHTS = 2`
  - `HOSTEL_MAX_STAY_NIGHTS = 8`
  - `HOSTEL_MAX_PAX = 8`
  - Evidence: `apps/brikette/src/utils/bookingDateRules.ts`.
- Handoff gate contract:
  - Any invalid date/pax combination fails URL build (`invalid_dates`).
  - Evidence: `apps/brikette/src/utils/buildOctorateUrl.ts`.
- Hostel adult-only representation today:
  - Hostel handoff builder carries `pax`/`adulti` only; no hostel child selector contract exists.
  - Evidence: `apps/brikette/src/utils/buildOctorateUrl.ts`.
- Apartment flow is already separately modeled:
  - Distinct private-room booking flow and CTA path.
  - Evidence: `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`.
- Inventory segmentation current truth:
  - Dedicated apartment/private route exists.
  - Apartment/private inventory presence in hostel comparison surfaces has been reported in prior funnel analysis and must be resolved as an explicit product policy in planning.

### Dependency & Impact Map
- Upstream dependencies:
  - Next App Router pages for `/[lang]`, `/[lang]/dorms`, `/[lang]/dorms/[id]`, `/[lang]/book`.
  - Shared UI packages (`packages/ui`) for room cards/sections/sticky CTA.
- Downstream dependents:
  - Octorate handoff URLs and GA4 handoff events.
  - Existing Jest contracts that currently assert URL auto-seeding and `begin_checkout` behavior.
- Likely blast radius:
  - Booking state sync layer, CTA routers, analytics wrapper, SEO metadata on `/book`, and related tests.

### Live Cloudflare Production Routing Facts (2026-03-01)
- Host checked: `https://hostel-positano.com` (Cloudflare production).
- Confirmed:
  - `/` returns `301` to `/en`.
  - `http://hostel-positano.com` returns `301` to `https://hostel-positano.com/`.
  - `/directions/foo` returns `301` to `/en/how-to-get-here/foo`.
- Mismatches requiring routing/canonical convergence:
  - `/en/rooms` is `200` while `/en/dorms` is `404`.
  - `/en/apartment` is `200` while `/en/private-rooms` is `404`.
  - `/en/dorms/double_room` is `404` (no live redirect to private-room target).
  - `/de/book` is `200` while `/de/buchen` is `404`; canonical for `/de/book` points to `/de/buchen` (broken canonical target).
  - `/es/reservar` and `/es/book` both return `200` (duplicate live aliases).
  - `/en/help` and `/en/assistance` both return `200` (duplicate live aliases), with mixed slash redirect behavior.
- Operational implication:
  - Current live routing behavior does not match intended canonical path policy and will cause crawl duplication, broken canonicals, and avoidable 404 leakage unless production redirect rules are explicitly converged.

## Simulation Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Booking state lifecycle (`/en` -> `/dorms` -> `/dorms/[slug]` -> `/book`) | Yes | [Scope gap][Major]: no shared session object exists yet; multiple state sources can diverge | Yes |
| New-tab room-detail entry from listing/home | Partial | [Boundary][Major]: `sessionStorage` does not carry to copied/new-tab URLs unless explicit URL hydration contract is applied | Yes |
| Copy/paste/share-link continuity | Partial | [Contract][Major]: no explicit “copy quote link” mechanism exists; state can be lost in shared URLs | Yes |
| Browser back/forward with picker changes | Partial | [Ordering][Moderate]: current URL-write behavior masks state source ownership and may regress once URL auto-write is removed | Yes |
| Hostel validity contracts | Yes | None | No |
| Adults-only hostel vs apartment segmentation | Partial | [Contract gap][Moderate]: hostel contract is adult-only in practice but not yet centralized in one typed booking state spec | Yes |
| Direct handoff path consistency | Yes | [Ordering inversion][Major]: routes still depend on `/book` fallback where direct handoff is intended when state is valid | Yes |
| Measurement and reconciliation layer | Yes | [Integration boundary][Major]: `begin_checkout` and `handoff_to_engine` coexist, preventing clean canonical reporting | Yes |
| No-JS fallback path | Partial | [Boundary][Major]: no-JS Octorate fallback can bypass in-app validation expectations unless explicit constrained strategy is defined | Yes |
| SEO/indexation controls for booking surfaces | Partial | [Boundary][Moderate]: `/book` indexability and outbound nofollow rules are not fully aligned to desired strategy | Yes |
| Live Cloudflare route/canonical parity | No | [Ordering inversion][Major]: live aliases include `200` duplicates and `404` canonical targets where permanent redirects are expected | Yes |

## Questions
### Resolved
- Q: Should the funnel relax hostel stay/pax constraints to simplify implementation?
  - A: No. Keep 2–8 nights and max 8 pax per booking as strict hard gates.
  - Evidence: operator direction + existing validation contract in `bookingDateRules.ts` and `buildOctorateUrl.ts`.
- Q: Should children be accepted in hostel booking surfaces?
  - A: No. Hostel remains adults-only; child handling belongs only to apartment/private-room domain if/when represented.
  - Evidence: operator direction + existing hostel contract uses only `pax`/`adulti` with no child input path.
- Q: Is the ideal funnel blocked by hard impracticality today?
  - A: No architectural hard-stop found; blockers are sequencing/consistency issues, not impossibility.
  - Evidence: all required behaviors can be mapped to existing routes/components without platform migration.
- Q: Can Brikette alone guarantee those constraints after users land on Octobook?
  - A: No guaranteed claim is justified from repo-only evidence. Brikette enforces pre-handoff; Octobook post-handoff edit constraints require separate configuration validation.
  - Evidence: boundary between in-app URL build validation and third-party checkout editability.
- Q: Is `brik_click_id` proven usable for booking-level reconciliation today?
  - A: Not yet. It is not implemented in current handoff builder/event payloads and export persistence is unverified.
  - Evidence: `apps/brikette/src/utils/buildOctorateUrl.ts`, `apps/brikette/src/utils/ga4-events.ts`.
- Q: How is cross-tab continuity handled under a session-first funnel without reintroducing URL propagation?
  - A: Shared-tab store with TTL is the contract for new-tab continuity; URL remains ingress/egress and explicit action output only.
  - Evidence: simulation finding on sessionStorage tab-scoping and need for non-URL continuity path.
- Q: What is the no-JS policy for hostel booking under non-negotiable constraints?
  - A: Hostel no-JS must use assisted conversion path (contact/WhatsApp) unless post-handoff constraints are proven enforceable.
  - Evidence: enforcement boundary + no-JS simulation risk.
- Q: Do we need production permanent redirects beyond current live behavior?
  - A: Yes. Live Cloudflare behavior shows canonical/alias drift and broken canonical targets that require explicit Worker/edge redirect convergence.
  - Evidence: live HTTP checks on `hostel-positano.com` (2026-03-01): `/en/rooms` 200 + `/en/dorms` 404, `/de/book` 200 + `/de/buchen` 404, `/es/reservar` and `/es/book` both 200.

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 81%
  - Evidence basis: clear route/module ownership and constraints encoded in core utils; still dependent on enforcing a strict state precedence migration.
  - To reach >=80: already met.
  - To reach >=90: complete typed `BookingSearch` migration with parity tests and boundary validation of no-JS/new-tab/share-link behavior.
- Approach: 83%
  - Evidence basis: session-first model is correct direction, but requires explicit contracts to avoid dual-state drift.
  - To reach >=80: already met.
  - To reach >=90: prove stable route behavior under refresh/new-tab/share/no-JS scenarios.
- Impact: 80%
  - Evidence basis: removes known friction points and aligns conversion flow; full upside depends on adding recovery and indicative pricing workstreams.
  - To reach >=80: already met.
  - To reach >=90: validate recovery workstream and indicative pricing impacts with production proxy metrics.
- Delivery-Readiness: 82%
  - Evidence basis: system contracts now explicit; still requires two boundary validations before “enforced end-to-end” claims.
  - To reach >=80: already met.
  - To reach >=90: complete enforcement/export persistence validations and lock acceptance criteria.
- Testability: 81%
  - Evidence basis: strong test surface exists, but many tests encode URL-first legacy behavior and must be migrated deliberately.
  - To reach >=80: already met.
  - To reach >=90: add state-contract tests for session hydration precedence and adults-only hostel invariants.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Session state and URL state diverge during migration | Medium | High | Define strict precedence contract: URL-on-entry hydrate -> session authoritative in-app -> URL only on explicit share/handoff. |
| Removing room-detail auto-seed breaks existing assumptions | High | Medium | Update tests and fallback copy in same change-set; avoid partial rollout. |
| Mixed analytics events persist and degrade reconciliation | High | Medium | Canonicalize to `handoff_to_engine` and keep compatibility event as explicit temporary shim only. |
| Group/long-stay users hit hard validation with no escape path | Medium | High | Add explicit split-booking flow guidance (2+ bookings) instead of silent disable/fail. |
| Booking-surface SEO/indexation policy remains inconsistent (`/book` indexing + outbound booking crawl discoverability) | Medium | Medium | Set explicit route indexing policy, nofollow outbound handoff where applicable, and keep booking-engine paths out of first-party crawl strategy. |
| Existing tests enforce old behavior and stall implementation | High | Medium | Plan test-contract migration as first-class workstream, not cleanup. |
| Octobook post-handoff constraints differ from Brikette rules | Medium | High | Validate and configure Octobook constraints; if not enforceable, downgrade claims to guidance + recovery path. |
| `brik_click_id` not recoverable in exports | Medium | Medium | Treat reconciliation as aggregate/proxy by default; only promote click-level attribution after evidence. |
| No indicative pricing anchor after removing auto-seeding | High | Medium | Add indicative pricing dataset + display policy before or alongside auto-seed removal. |
| Recovery workstream and consent/compliance model are under-specified | Medium | High | Ship recovery with explicit opt-in model, data-retention rules, privacy copy, and channel-specific consent handling (email/WhatsApp/retargeting). |
| Live production routing/canonical drift causes crawl duplication and 404 leakage | High | High | Add explicit production redirect/canonical convergence task (Worker/edge source-of-truth), verify with curl matrix before considering funnel rollout complete. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Preserve `bookingDateRules.ts` as canonical hostel validity authority.
  - Keep apartment/private flow isolated from hostel adult-only booking contract.
- Rollout/rollback expectations:
  - Roll out in thin vertical slices by route class, with test updates per slice.
  - Keep rollback path by feature-level reverts; avoid broad multi-route untested switches.
- Observability expectations:
  - Every handoff CTA emits one canonical event with enough context for no-API reconciliation.

## Suggested Task Seeds (Non-binding)
- GV-01: Validate Octobook post-handoff enforcement capability for min/max stay and max pax; classify each constraint as Brikette-only, Octobook-only, or both.
- GV-02: Validate whether any export field preserves click-id/query attribution; keep reconciliation aggregate/proxy until proven.
- Create a single typed `BookingSearch` state contract and hydration/write rules (runtime/shared-tab store primary, URL secondary).
- Add shared-tab continuity layer with TTL and stale eviction policy for cross-tab booking state.
- Wire `/en/dorms` with inline date/pax bar and valid-state direct handoff (not forced `/book` fallback).
- Remove room-detail load-time URL auto-seeding; preserve explicit-entry hydration behavior.
- Align CTA policy: room-detail fast lane direct handoff; `/book` comparison role for undecided users.
- Implement hostel adults-only invariant across form controls, labels, validation, and event payload naming.
- Implement hostel no-JS assisted conversion path consistent with non-negotiable constraints.
- Add split-booking guidance for attempts above per-booking constraints.
- Canonicalize handoff analytics to schema contract and add `brik_click_id` propagation contract.
- Implement indicative pricing baseline (`From €X*`) with source-of-truth dataset, owner, cadence, stale-data rule, and disclosure copy.
- Add post-handoff recovery flow: optional quote capture (email/WhatsApp), retargeting proxies, resume-booking deep links, and consent-compliant data handling.
- Apply SEO controls (`/book` indexing policy, outbound handoff `rel` policy, canonical param stripping).
- Add production redirect/canonical convergence matrix for live Cloudflare Worker routing:
  - pick one canonical route per alias family,
  - implement one-hop `301` redirects at production source-of-truth,
  - eliminate canonical tags that target `404` URLs,
  - verify alias/canonical status matrix on live host.

## Required Plan-Doc Updates From This Fact-Find
- Expand SEO/indexation scope to include live Cloudflare redirect/canonical convergence (not metadata-only).
- Add a production redirect matrix artifact deliverable and one-hop live verification (`curl` matrix) as acceptance criteria.
- Update simulation trace to mark TASK-08 as `Partial` until duplicate alias `200`s and canonical-to-`404` paths are resolved.
- Add explicit risk + mitigation for live route/canonical drift affecting crawl health and funnel discoverability.
- Add overall acceptance criterion: live aliases permanently redirect to canonical `200` targets.
- Record decision-log entry tying TASK-08 scope expansion to 2026-03-01 production evidence.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-seo`
  - `draft-email`
- Deliverable acceptance package:
  - Route behavior matrix implemented and tested for `/[lang]`, `/[lang]/dorms`, `/[lang]/dorms/[id]`, `/[lang]/book`.
  - Canonical booking state contract with strict hostel invariants.
  - Updated analytics and handoff URL contracts.
  - SEO policy updates for booking surfaces.
- Post-delivery measurement plan:
  - Monitor handoff counts, repeat-handoff proxies, and quote-capture usage as no-API conversion indicators.

## Evidence Gap Review
### Gaps Addressed
- Confirmed strict current hostel validation limits in code and tests.
- Confirmed where URL auto-seeding and query persistence still drive behavior.
- Confirmed analytics dual-contract issue and where canonical handoff support already exists.
- Confirmed `/book` metadata currently defaults to indexable behavior.
- Added explicit state precedence, enforcement boundary, and rate-plan exposure contracts to prevent interpretation drift.
- Added dead-end definition and explicit invalid-state escape-path requirement.

### Confidence Adjustments
- Increased delivery-readiness confidence after confirming constraints already exist in core validation utilities.
- Reduced testability confidence slightly due to extensive existing tests asserting old URL-first behavior.

### Remaining Assumptions
- Octobook can be configured (or is already configured) to align with Brikette’s hard hostel constraints post-handoff.
- Booking export surfaces may or may not preserve click-id attribution; until verified, reconciliation remains aggregate/proxy.
- Shared-tab continuity storage usage is acceptable for Brikette traffic profile and privacy posture.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None structural. First execution wave must start with GV-01 and GV-02 and include production redirect/canonical convergence before route-level success metrics are treated as decision-grade.
- Recommended next step:
  - `/lp-do-plan brikette-sales-funnel-analysis --auto` (when you want to proceed)
