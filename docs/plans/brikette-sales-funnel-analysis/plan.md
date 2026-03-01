---
Type: Plan
Status: Active
Domain: UI | SEO | Analytics | Integration
Workstream: Mixed
Created: 2026-03-01
Last-reviewed: 2026-03-01
Last-updated: 2026-03-01
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-sales-funnel-analysis
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-seo,draft-email
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: in-progress
---

# Brikette Ideal Sales Funnel Plan

## Summary
This plan turns the Brikette ideal-funnel fact-find into an execution sequence that removes booking dead ends while preserving the non-negotiable hostel contracts: `2..8` nights, max `8` adults per booking, and adults-only hostel flow.

The plan intentionally separates internal delivery from external unknowns. Two boundary investigations (Octobook post-handoff enforcement and click-id export persistence) run first, but do not block pre-handoff funnel improvements.

Live production routing on Cloudflare currently shows canonical/alias drift (duplicate `200` aliases and canonical targets returning `404`), so redirect/canonical convergence is treated as explicit implementation scope, not implicit SEO cleanup.

This run has progressed through `/lp-do-build` cycles; remaining work is constrained by external production redirect convergence.

## Active tasks
- [x] TASK-01: Validate Octobook post-handoff enforcement boundary (GV-01)
- [x] TASK-02: Validate click-id persistence in Octorate exports (GV-02)
- [x] TASK-03: Add CI-first fast feedback target for booking funnel contracts
- [x] TASK-04: Implement canonical `BookingSearch` contract and best-effort cross-tab continuity
- [x] TASK-05: Realign route behavior and CTAs to ideal funnel roles
- [x] TASK-06A: Implement pre-handoff hostel validation UX + split-booking guidance
- [x] TASK-06B: Implement no-JS hostel assisted-booking policy and boundary-aware copy
- [x] TASK-07A: Canonicalize handoff analytics schema and `brik_click_id` event payload
- [x] TASK-07B: Apply click-id handoff URL and reconciliation policy based on export evidence
- [~] TASK-08: Apply booking-surface SEO/indexation contract + production redirect convergence — Blocked (live canonical targets still 404)
- [x] TASK-09A: Ship indicative pricing fallback with auto-seed removal
- [x] TASK-09B: Implement indicative pricing governance and stale-data ops controls
- [x] TASK-10: Validate recovery compliance and technical channel readiness
- [x] TASK-11: Ship recovery MVP (email-only) with resume-link flow and proxy audiences
- [~] TASK-12: Horizon checkpoint and confidence recalibration — Blocked (depends on TASK-08 external convergence)

## Goals
- Deliver a dead-end-free booking funnel with room-detail fast lane and `/book` comparison role.
- Keep hostel constraints as hard contracts across UI, URL builder, no-JS, and analytics layers.
- Establish one canonical booking state contract with explicit precedence and continuity behavior.
- Canonicalize handoff analytics for no-API operational reconciliation and recovery targeting.
- Preserve conversion anchoring when search is absent through governed indicative pricing.
- Converge live production route aliases to one-hop permanent redirect policy with valid canonical targets.

## Non-goals
- Replacing Octobook checkout.
- Paid API/webhook adoption.
- Deterministic booking-level attribution claims without export evidence.

## Constraints & Assumptions
- Constraints:
  - Hostel contracts are strict: `2..8` nights, max `8` adults, adults-only.
  - Over-limit demand must route to split-booking guidance or assisted path; never silent dead-end.
  - URL continuity must avoid per-change churn; only explicit action writes are allowed.
  - Production redirect source-of-truth must be Worker/middleware/edge rules on live Cloudflare target; `_redirects` alone is insufficient for production parity.
  - Local Jest/e2e execution is not used in this workflow; CI remains the pass/fail source of truth.
- Assumptions:
  - Cross-tab continuity is best-effort via shared storage with TTL; cold-state behavior must still convert safely.
  - Existing Brikette route architecture can consume a canonical booking state service without platform migration.

## Inherited Outcome Contract
- **Why:** Brikette needs an ideal, low-friction funnel where room-intent users can book fast, comparison users can browse clearly, and no route traps users in invalid or ambiguous state.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** migrate to a session-first booking funnel with explicit validity contracts (2-8 nights, max 8 adults in hostel), direct room-detail handoff, and no dead-end transitions.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brikette-sales-funnel-analysis/fact-find.md`
- Key findings used:
  - Booking continuity is currently fragmented across URL and route-local state.
  - Hard hostel constraints already exist in core validators and handoff URL builder.
  - Route CTA behavior still over-relies on `/book` fallback.
  - Analytics contract is not fully canonicalized.
  - Live production routing currently has canonical/alias mismatch (`200` duplicates + `404` canonical targets) and needs explicit redirect convergence.
  - Post-handoff recovery and indicative pricing must be first-class to maximize impact under no-API constraints.

## Proposed Approach
- Option A: UX/state changes first, boundary unknowns later.
  - Pros: immediate surface improvements.
  - Cons: risk of overclaims and rework.
- Option B: external boundary investigations first, then full delivery.
  - Pros: stronger certainty before implementation.
  - Cons: delays clear internal improvements.
- Chosen approach: parallel foundation.
  - Run boundary checks and CI feedback harness first; then execute state/analytics/route/contract work in waves so high-value funnel improvements are not blocked by export-side unknowns.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Validate Octobook post-handoff enforcement boundary | 70% | M | Complete (2026-03-01) | - | TASK-06B, TASK-12 |
| TASK-02 | INVESTIGATE | Validate click-id persistence in Octorate exports | 70% | M | Complete (2026-03-01) | - | TASK-07B, TASK-12 |
| TASK-03 | IMPLEMENT | CI-first fast feedback target for booking contracts | 85% | M | Complete (2026-03-01) | - | TASK-04, TASK-05, TASK-07A |
| TASK-04 | IMPLEMENT | Canonical `BookingSearch` + best-effort cross-tab continuity | 80% | L | Complete (2026-03-01) | TASK-03 | TASK-05, TASK-06A, TASK-07A, TASK-08, TASK-09A |
| TASK-05 | IMPLEMENT | Route/CTA realignment to ideal funnel roles | 85% | L | Complete (2026-03-01) | TASK-03, TASK-04 | TASK-08, TASK-09A, TASK-12 |
| TASK-06A | IMPLEMENT | Hostel pre-handoff validation UX + split-booking guidance | 85% | M | Complete (2026-03-01) | TASK-04 | TASK-06B, TASK-11, TASK-12 |
| TASK-06B | IMPLEMENT | Hostel no-JS assisted policy + copy finalization | 75% | M | Complete (2026-03-01) | TASK-01, TASK-06A | TASK-12 |
| TASK-07A | IMPLEMENT | Canonical handoff analytics schema + click-id event payload | 85% | M | Complete (2026-03-01) | TASK-03, TASK-04 | TASK-07B, TASK-11, TASK-12 |
| TASK-07B | IMPLEMENT | Click-id handoff URL + reconciliation join policy | 75% | S | Complete (2026-03-01) | TASK-02, TASK-07A | TASK-12 |
| TASK-08 | IMPLEMENT | Booking-surface SEO/indexation + live Cloudflare redirect/canonical convergence | 85% | M | Blocked (2026-03-01) | TASK-04 | TASK-12 |
| TASK-09A | IMPLEMENT | Indicative pricing fallback coupled with auto-seed removal | 85% | M | Complete (2026-03-01) | TASK-04, TASK-05 | TASK-09B, TASK-12 |
| TASK-09B | IMPLEMENT | Indicative pricing governance/staleness controls | 75% | S | Complete (2026-03-01) | TASK-09A | TASK-12 |
| TASK-10 | INVESTIGATE | Recovery compliance + technical channel readiness | 70% | M | Complete (2026-03-01) | - | TASK-11 |
| TASK-11 | IMPLEMENT | Recovery MVP (email-only) + resume-link + proxy audiences | 80% | L | Complete (2026-03-01) | TASK-06A, TASK-07A, TASK-10 | TASK-12 |
| TASK-12 | CHECKPOINT | Horizon checkpoint + `/lp-do-replan` for next tranche | 95% | S | Blocked (2026-03-01) | TASK-01, TASK-02, TASK-05, TASK-06A, TASK-06B, TASK-07A, TASK-07B, TASK-08, TASK-09A, TASK-09B, TASK-11 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-10 | - | Boundary and channel discovery + CI feedback harness |
| 2 | TASK-04, TASK-07A | TASK-03 (TASK-04), TASK-03,TASK-04 (TASK-07A) | State foundation then early analytics normalization |
| 3 | TASK-05, TASK-06A, TASK-08 | TASK-04 (and TASK-03 for TASK-05) | Funnel behavior, hostel enforcement, SEO + production redirect convergence |
| 4 | TASK-09A, TASK-06B, TASK-07B | TASK-04,TASK-05 (TASK-09A), TASK-01,TASK-06A (TASK-06B), TASK-02,TASK-07A (TASK-07B) | Indicative fallback ships with auto-seed removal and boundary-dependent contracts |
| 5 | TASK-09B, TASK-11 | TASK-09A (TASK-09B), TASK-06A,TASK-07A,TASK-10 (TASK-11) | Governance closure + recovery MVP delivery |
| 6 | TASK-12 | All blocking tasks complete | Mandatory confidence recalibration |

- Max parallelism: 4 tasks (Wave 1)
- Critical path: TASK-03 -> TASK-04 -> TASK-07A -> TASK-05 -> TASK-09A -> TASK-11 -> TASK-12

## Simulation Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Octobook enforcement boundary | Yes | None | No |
| TASK-02: Click-id export persistence | Yes | None | No |
| TASK-03: CI feedback harness | Yes | None | No |
| TASK-04: `BookingSearch` continuity contract | Partial | [Integration boundary][Major]: legacy query-param consumers may bypass canonical state unless all call sites are migrated together | Yes |
| TASK-05: Route/CTA realignment | Yes | None | No |
| TASK-06A: Hostel validation + split-booking | Yes | None | No |
| TASK-06B: Hostel no-JS policy | Partial | [Missing precondition][Moderate]: copy and claims depend on TASK-01 boundary output | Yes |
| TASK-07A: Canonical analytics schema | Partial | [Type contract gap][Major]: payload schema change requires synchronized emitters and downstream consumers | Yes |
| TASK-07B: Handoff URL click-id policy | Partial | [Missing data dependency][Moderate]: export persistence evidence from TASK-02 controls deterministic join claims | Yes |
| TASK-08: SEO/indexation + production redirects | Partial | [Ordering inversion][Major]: live aliases currently include duplicate `200` paths and canonical targets that return `404`; one-hop redirect convergence required before policy can be considered complete | Yes |
| TASK-09A: Indicative fallback + auto-seed removal | Yes | None | No |
| TASK-09B: Indicative governance | Partial | [Missing data dependency][Moderate]: owner/cadence process must be documented to avoid stale anchors | Yes |
| TASK-10: Recovery readiness | Yes | None | No |
| TASK-11: Recovery MVP email-only | Yes | None | No |
| TASK-12: Checkpoint | Partial | [Missing precondition][Major]: depends on TASK-08 live redirect/canonical convergence | Yes |

## Tasks

### TASK-01: Validate Octobook post-handoff enforcement boundary (GV-01)
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-sales-funnel-analysis/artifacts/octobook-enforcement-matrix.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Affects:** `docs/plans/brikette-sales-funnel-analysis/artifacts/octobook-enforcement-matrix.md`, `[readonly] apps/brikette/src/utils/buildOctorateUrl.ts`
- **Depends on:** -
- **Blocks:** TASK-06B, TASK-12
- **Confidence:** 70%
  - Implementation: 75% - bounded evidence capture once access is granted.
  - Approach: 70% - depends on available Octobook controls.
  - Impact: 85% - defines claim boundary and no-JS contract language.
- **Questions to answer:**
  - Are stay and pax constraints enforceable after user edits in Octobook?
  - Is adults-only behavior enforceable or only guidance post-handoff?
- **Acceptance:**
  - Matrix classifies each contract as `Brikette`, `Octobook`, or `Both`.
  - Any non-enforceable post-handoff contract has explicit mitigation wording.
- **Validation contract:** evidence includes screenshots/exports with verification date.
- **Planning validation:** existing in-app enforcement boundary documented.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** update enforcement wording in fact-find/plan as needed.
- **Build evidence (2026-03-01):**
  - Produced deliverable: `docs/plans/brikette-sales-funnel-analysis/artifacts/octobook-enforcement-matrix.md`
  - Live verification evidence captured via Octobook browser session:
    - `obs_d1420a3b-1469-46c5-bb49-cc3381ea191b` (valid handoff result page),
    - `obs_ff925511-865b-44db-b57e-99f9329132a6` (`pax=9` path),
    - `obs_96aa67fb-97fc-4807-b4fb-8903069c47c3` (post-handoff availability/calendar),
    - `obs_e7da237d-8c01-4550-967d-66f648c8d924` (calendar min-stay evidence).
  - Acceptance: pass (ownership matrix + mitigation wording included).

### TASK-02: Validate click-id persistence in Octorate exports (GV-02)
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-sales-funnel-analysis/artifacts/click-id-export-persistence.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Affects:** `docs/plans/brikette-sales-funnel-analysis/artifacts/click-id-export-persistence.md`, `[readonly] apps/brikette/src/utils/ga4-events.ts`
- **Depends on:** -
- **Blocks:** TASK-07B, TASK-12
- **Confidence:** 70%
  - Implementation: 75% - sampling and field audit are bounded.
  - Approach: 70% - export variability may limit certainty.
  - Impact: 85% - sets deterministic vs proxy attribution boundary.
- **Questions to answer:**
  - Do handoff params persist in any export field?
  - If not, what proxy join strategy is safe?
- **Acceptance:**
  - Deterministic-vs-proxy decision is evidence-backed and documented.
- **Validation contract:** sampled export rows + field mapping decision note.
- **Planning validation:** current event schema and known exports reviewed.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** informs TASK-07B and reporting language.
- **Build evidence (2026-03-01):**
  - Produced deliverable: `docs/plans/brikette-sales-funnel-analysis/artifacts/click-id-export-persistence.md`
  - Repo evidence confirms no current `brik_click_id` propagation in:
    - `apps/brikette/src/utils/buildOctorateUrl.ts`
    - `apps/brikette/src/utils/ga4-events.ts`
  - Blocker: export-row sampling evidence unavailable in this execution context; deterministic mode cannot be validated.
  - Gate result: completed with proxy-mode reconciliation decision; deterministic mode remains pending future export evidence.

### TASK-03: Add CI-first fast feedback target for booking funnel contracts
- **Type:** IMPLEMENT
- **Deliverable:** isolated CI target for booking state + CTA routing checks with runtime under 2 minutes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/brikette/package.json`, `apps/brikette/src/test/*booking*`, `.github/workflows/*`, `[readonly] docs/testing-policy.md`
- **Depends on:** -
- **Blocks:** TASK-04, TASK-05, TASK-07A
- **Confidence:** 85%
  - Implementation: 85% - bounded target and known workflow patterns.
  - Approach: 85% - mitigates CI-only feedback latency risk.
  - Impact: 85% - reduces iteration drag on high-blast tasks.
- **Acceptance:**
  - CI target executes only booking-funnel contract tests.
  - Runtime stays below agreed threshold for quick loops.
- **Validation contract (TC-03):**
  - TC-01: target runs in CI and reports independently.
  - TC-02: target covers booking state precedence and CTA routing assertions.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: existing workflow and test-target discovery.
  - Validation artifacts: this plan + current CI policy docs.
- **Scouts:** `None: bounded infra task`
- **Edge Cases & Hardening:** avoid duplicate pipeline cost and noisy failure duplication.
- **What would make this >=90%:** two consecutive CI runs with stable runtime and clear failure diagnostics.
- **Rollout / rollback:**
  - Rollout: add target as non-optional booking-funnel gate.
  - Rollback: keep tests but fold back into broader suite if signal quality is poor.
- **Documentation impact:** update testing notes for booking funnel tasks.
- **Build evidence (2026-03-01):**
  - Added CI target workflow: `.github/workflows/brikette-booking-funnel-contracts.yml`
  - Added package target: `apps/brikette/package.json` -> `test:booking-funnel-contracts`
  - CI target scope covers booking state and CTA routing/event contracts via:
    - `src/test/components/room-detail-date-picker.test.tsx`
    - `src/test/components/ga4-11-select-item-room-ctas.test.tsx`
    - `src/test/components/ga4-cta-click-header-hero-widget.test.tsx`
    - `src/test/components/sticky-book-now-octorate-url-prop.test.tsx`
    - `src/test/utils/buildOctorateUrl.test.ts`
  - Validation passes:
    - `pnpm --filter @apps/brikette typecheck`
    - `pnpm --filter @apps/brikette lint`
    - `bash scripts/validate-changes.sh`
  - Local Jest runs intentionally skipped per repo testing policy (CI is source of truth).

### TASK-04: Implement canonical `BookingSearch` and best-effort cross-tab continuity
- **Type:** IMPLEMENT
- **Deliverable:** typed `BookingSearch` state service with precedence contract and cold-state-safe behavior
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/brikette/src/app/[lang]/HomeContent.tsx`, `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx`, `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`, `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`, `apps/brikette/src/components/landing/BookingWidget.tsx`, `apps/brikette/src/utils/*booking*`
- **Depends on:** TASK-03
- **Blocks:** TASK-05, TASK-06A, TASK-07A, TASK-08, TASK-09A
- **Confidence:** 80%
  - Implementation: 80% - CI harness from TASK-03 now isolates and accelerates migration feedback.
  - Approach: 80% - contract is explicit and validation loop is now scoped for rapid iteration.
  - Impact: 90% - removes the main source of continuity dead ends.
- **Acceptance:**
  - Canonical state precedence is implemented: parseable URL -> parseable shared store TTL -> empty state.
  - Validation runs after hydration to derive `validationErrors[]` and `hasValidSearch`.
  - URL writes occur only on explicit `Apply/Search/Update`, share, and handoff actions.
  - Shared store writes are debounced on runtime changes, with immediate flush on apply/share/handoff actions.
  - Cross-tab continuity is explicitly best-effort, not guaranteed.
  - Cold-state room-detail entry remains conversion-safe.
- **Validation contract (TC-04):**
  - TC-01: parseable URL entry hydrates canonical state even when policy-invalid.
  - TC-02: warm shared storage hydrates new tab within TTL.
  - TC-03: stale/missing shared storage yields empty state and prompt.
  - TC-04: explicit apply updates URL once via replace-state behavior.
  - TC-05: room-detail opened cold-state (no URL, no shared store) shows date prompt + indicative pricing and no dead-end CTA.
  - TC-06: policy-invalid hydrated state preserves entered values and shows corrective/split guidance instead of clearing inputs.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: booking state consumer discovery across app and shared UI.
  - Validation artifacts: fact-find and ideal-system docs.
  - Consumer tracing (new outputs):
    - `BookingSearch`, `hasValidSearch`, `booking_source`, `store_expires_at`.
    - Consumers: route controllers, CTA builders, analytics emitter wrappers.
  - Modified behavior check:
    - Legacy query readers must migrate in same wave to avoid silent fallback.
- **Scouts:** identify non-booking routes reading booking params.
- **Edge Cases & Hardening:** invalid ranges, locale parsing, DST night-count stability.
- **What would make this >=90%:** full CI contract suite green after migration of all discovered consumers.
- **Rollout / rollback:**
  - Rollout: route-scoped feature flag migration.
  - Rollback: revert to prior state-read path behind feature flag.
- **Documentation impact:** update booking-state contract artifact.
- **Build evidence (2026-03-01):**
  - Added canonical booking-state utility: `apps/brikette/src/utils/bookingSearch.ts`
    - URL-first hydration (`url -> shared_store -> empty`)
    - Validation metadata (`hasValidSearch`, `validationErrors[]`)
    - Shared-store TTL persistence (`store_expires_at`)
  - Migrated booking-state consumers:
    - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
    - `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`
    - `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx`
    - `apps/brikette/src/components/landing/BookingWidget.tsx`
    - `apps/brikette/src/app/[lang]/HomeContent.tsx`
  - Cold-state behavior updated:
    - Removed room-detail auto-seed URL write on mount.
    - Empty search now stays explicit (`source = empty`) instead of forced date injection.
  - Validation:
    - `pnpm --filter @apps/brikette typecheck` (pass)
    - `pnpm --filter @apps/brikette lint` (pass)

### TASK-05: Realign route behavior and CTAs to ideal funnel roles
- **Type:** IMPLEMENT
- **Deliverable:** room-detail fast lane and `/book` comparison behavior with dorms inline date/pax controls
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/brikette/src/app/[lang]/HomeContent.tsx`, `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx`, `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`, `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`, `packages/ui/src/organisms/RoomsSection.tsx`, `packages/ui/src/organisms/StickyBookNow.tsx`
- **Depends on:** TASK-03, TASK-04
- **Blocks:** TASK-08, TASK-09A, TASK-12
- **Confidence:** 85%
  - Implementation: 85% - route ownership and CTA seams are known.
  - Approach: 85% - role contract is explicit per route.
  - Impact: 90% - directly removes avoidable mid-funnel friction.
- **Acceptance:**
  - Room-detail valid search goes direct handoff by default.
  - `/book` is comparison role for undecided users.
  - `/dorms` supports inline date/pax updates and valid-state direct handoff.
  - `/dorms` “Private” filter remains hostel-domain only in this system contract.
  - Room-detail load no longer auto-seeds booking params.
- **Validation contract (TC-05):**
  - TC-01: homepage widget enters `/book` with hydration behavior.
  - TC-02: dorm card CTA valid-state handoffs directly; invalid-state routes to date action.
  - TC-03: room-detail no longer rewrites URL on load.
  - TC-04: details links remain clean without mandatory booking params.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: CTA path and fallback discovery in app + shared UI.
  - Validation artifacts: fact-find route analysis sections.
- **Scouts:** detect duplicate locale wrapper logic.
- **Edge Cases & Hardening:** back/forward navigation, refresh behavior, invalid range edits.
- **What would make this >=90%:** CI route-contract suite pass across mobile/desktop variants.
- **Rollout / rollback:**
  - Rollout: `/dorms` then room-detail.
  - Rollback: route-level CTA policy rollback by feature flag.
- **Documentation impact:** refresh route behavior matrix artifact.
- **Build evidence (2026-03-01):**
  - Route behavior updates:
    - `/[lang]/dorms` now includes inline date/pax controls and propagates explicit `queryState` to room CTAs.
    - Valid dorms query states now route direct to handoff URLs; absent/invalid states preserve comparison behavior.
    - Room-detail auto-seed URL behavior removed during TASK-04 completion.
  - Files updated:
    - `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx`
    - `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`
    - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
  - Validation:
    - `pnpm --filter @apps/brikette typecheck` (pass)
    - `pnpm --filter @apps/brikette lint` (pass)

### TASK-06A: Implement hostel pre-handoff validation UX and split-booking guidance
- **Type:** IMPLEMENT
- **Deliverable:** validation UX contract and guided over-limit path for hostel booking
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/brikette/src/utils/bookingDateRules.ts`, `apps/brikette/src/utils/buildOctorateUrl.ts`, `apps/brikette/src/app/[lang]/book/*`, `apps/brikette/src/app/[lang]/dorms/*`
- **Depends on:** TASK-04
- **Blocks:** TASK-06B, TASK-11, TASK-12
- **Confidence:** 85%
  - Implementation: 85% - core constraints already exist in canonical utilities.
  - Approach: 85% - policy is fixed and unambiguous.
  - Impact: 90% - removes invalid-state dead ends.
- **Acceptance:**
  - Hostel inputs and handoff guards enforce `2..8` nights and max `8` adults.
  - Any over-limit request shows split-booking guidance and assisted path.
  - Adults-only hostel semantics remain explicit in UI and event labels.
- **Validation contract (TC-06A):**
  - TC-01: `pax=9` in hostel cannot handoff and shows split-booking guidance.
  - TC-02: `<2` nights and `>8` nights cannot handoff and show corrective message.
  - TC-03: child-specific hostel paths are absent or blocked.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: validator and handoff guard usage mapping.
  - Validation artifacts: fact-find constraints and current utility contracts.
- **Scouts:** verify private/apartment validators are isolated.
- **Edge Cases & Hardening:** partial dates, timezone boundaries, malformed URL ingress.
- **What would make this >=90%:** CI edge-case suite proving guidance path on all hostel surfaces.
- **Rollout / rollback:**
  - Rollout: enable validation UX on all hostel routes simultaneously.
  - Rollback: preserve hard guard; temporarily simplify guidance copy if needed.
- **Documentation impact:** add split-booking guidance contract note.
- **Build evidence (2026-03-01):**
  - Enforced/communicated hostel constraints across booking surfaces with explicit corrective guidance:
    - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
    - `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx`
    - `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`
  - Added split-booking + assisted-booking guidance copy for invalid states (2-8 nights, max 8 adults, adults-only hostel semantics).
  - Pre-handoff invalid states now block direct handoff paths through `queryState="invalid"` routing contracts.
  - Validation:
    - `pnpm --filter @apps/brikette typecheck` (pass)
    - `pnpm --filter @apps/brikette lint` (pass)

### TASK-06B: Implement hostel no-JS assisted policy and boundary-aware copy
- **Type:** IMPLEMENT
- **Deliverable:** no-JS hostel path that avoids unconstrained direct booking and presents clear assisted conversion
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/brikette/src/app/[lang]/book/page.tsx`, `apps/brikette/src/app/[lang]/dorms/[id]/*`, `docs/plans/brikette-sales-funnel-analysis/artifacts/no-js-policy-copy.md`
- **Depends on:** TASK-01, TASK-06A
- **Blocks:** TASK-12
- **Confidence:** 75%
  - Implementation: 75% - implementation is bounded but boundary/copy depends on GV-01.
  - Approach: 75% - final wording depends on proven Octobook enforcement capability.
  - Impact: 85% - preserves non-negotiable constraints in no-JS flows.
- **Acceptance:**
  - Hostel no-JS path does not expose unconstrained direct booking.
  - Assisted conversion path is explicit and actionable.
  - Assisted requests include known booking context (dates/pax/room) when available.
  - Copy matches enforcement boundary evidence.
- **Validation contract (TC-06B):**
  - TC-01: no-JS hostel page renders assisted path only.
  - TC-02: policy copy matches TASK-01 matrix outcomes.
  - TC-03: assisted conversion payload carries known context when present.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: no-JS render paths and fallback links.
  - Validation artifacts: TASK-01 matrix.
- **Scouts:** `None: bounded surface`
- **Edge Cases & Hardening:** localization parity for assisted instructions.
- **What would make this >=90%:** verified no-JS snapshots per locale + policy review signoff.
- **Rollout / rollback:**
  - Rollout: tie launch to TASK-01 completion.
  - Rollback: keep assisted path active; revert copy only.
- **Documentation impact:** add no-JS contract snippet to plan artifacts.
- **Build evidence (2026-03-01):**
  - No-JS hostel policy switched to assisted path:
    - `apps/brikette/src/app/[lang]/book/page.tsx`
    - `apps/brikette/src/app/[lang]/dorms/[id]/page.tsx`
  - Boundary-aware copy artifact produced:
    - `docs/plans/brikette-sales-funnel-analysis/artifacts/no-js-policy-copy.md`
  - Copy aligned to TASK-01 enforcement matrix boundaries.
  - Validation:
    - `pnpm --filter @apps/brikette typecheck` (pass)
    - `pnpm --filter @apps/brikette lint` (pass)

### TASK-07A: Canonicalize analytics schema and click-id event payload
- **Type:** IMPLEMENT
- **Deliverable:** one canonical `handoff_to_engine` schema with required fields across CTA surfaces
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/brikette/src/utils/ga4-events.ts`, `apps/brikette/src/components/*booking*`, `apps/brikette/src/app/[lang]/**/Book*`
- **Depends on:** TASK-03, TASK-04
- **Blocks:** TASK-07B, TASK-11, TASK-12
- **Confidence:** 85%
  - Implementation: 85% - event seams are known and already partially consolidated.
  - Approach: 85% - schema contract is explicit.
  - Impact: 90% - enables reliable no-API measurement and audience building.
- **Acceptance:**
  - `handoff_to_engine` fires once per explicit handoff action.
  - Required fields present: `checkin`, `checkout`, `pax`, `rate_plan`, `room_id`, `source_route`, `cta_location`, `brik_click_id`, `engine_endpoint`, `handoff_mode`.
  - `brik_click_id` is generated per handoff attempt and is not persisted as reusable booking continuity state.
  - Invalid-state interactions do not emit handoff events.
- **Validation contract (TC-07A):**
  - TC-01: all primary CTA surfaces emit canonical payload.
  - TC-02: duplicate-event suppression works on same-tab navigation.
  - TC-03: rate-plan value parity across NR/Flex room actions.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: event emitters and consumer references.
  - Validation artifacts: fact-find analytics contract section.
  - Consumer tracing (new outputs):
    - New outputs: canonical schema fields and per-attempt click-id in event payload.
    - Consumers: telemetry queries, recovery audience definitions, reconciliation scripts.
  - Modified behavior check:
    - Legacy consumers expecting old shape must migrate in this wave.
- **Scouts:** inventory any external dashboards keyed to old event names.
- **Edge Cases & Hardening:** beacon dispatch timing on same-tab navigation.
- **What would make this >=90%:** staging payload validation + stable CI event-contract tests.
- **Rollout / rollback:**
  - Rollout: canonical schema first with bounded compatibility shim window.
  - Rollback: restore compatibility payload wrapper if required.
- **Documentation impact:** publish canonical event-schema artifact.
- **Build evidence (2026-03-01):**
  - Canonical handoff schema upgraded in `apps/brikette/src/utils/ga4-events.ts`:
    - required payload fields include `checkin`, `checkout`, `pax`, `rate_plan`, `room_id`, `source_route`, `cta_location`, `brik_click_id`, `engine_endpoint`, `handoff_mode`
    - added per-attempt click-id generator `createBrikClickId()`
  - Primary handoff CTA emitters migrated to canonical event payload:
    - `apps/brikette/src/components/rooms/RoomsSection.tsx`
    - `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`
    - `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`
  - Invalid-state handoff suppression maintained via existing `queryState` guards.
  - Validation:
    - `pnpm --filter @apps/brikette typecheck` (pass)
    - `pnpm --filter @apps/brikette lint` (pass)

### TASK-07B: Apply click-id handoff URL and reconciliation join policy
- **Type:** IMPLEMENT
- **Deliverable:** policy-controlled click-id usage in handoff URLs and reconciliation documentation
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/brikette/src/utils/buildOctorateUrl.ts`, `docs/plans/brikette-sales-funnel-analysis/artifacts/reconciliation-policy.md`
- **Depends on:** TASK-02, TASK-07A
- **Blocks:** TASK-12
- **Confidence:** 75%
  - Implementation: 75% - small implementation, but policy branch depends on TASK-02 evidence.
  - Approach: 75% - deterministic/proxy mode must match export reality.
  - Impact: 75% - prevents overclaims and keeps attribution framing correct.
- **Acceptance:**
  - URL click-id behavior matches evidence-backed policy.
  - Reconciliation policy explicitly states deterministic or proxy mode.
- **Validation contract (TC-07B):**
  - TC-01: handoff URL includes/excludes click-id per policy.
  - TC-02: reconciliation artifact language matches TASK-02 findings.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:** links TASK-02 output and TASK-07A schema.
- **Scouts:** `None: policy-bound task`
- **Edge Cases & Hardening:** avoid appending unusable identifiers when policy is proxy mode.
- **What would make this >=90%:** evidence of stable policy operation across one reporting cycle.
- **Rollout / rollback:**
  - Rollout: apply policy switch after TASK-02 approval.
  - Rollback: revert to event-only click-id usage.
- **Documentation impact:** update no-API reconciliation runbook.
- **Build evidence (2026-03-01):**
  - Added policy artifact:
    - `docs/plans/brikette-sales-funnel-analysis/artifacts/reconciliation-policy.md`
  - Proxy-mode contract codified in URL builder:
    - `apps/brikette/src/utils/buildOctorateUrl.ts` accepts optional `brikClickId` input but intentionally does not append it in proxy mode.
  - Policy alignment:
    - URL contract: click-id excluded
    - Analytics contract: click-id retained in canonical handoff event payload
  - Validation:
    - `pnpm --filter @apps/brikette typecheck` (pass)

### TASK-08: Apply booking-surface SEO/indexation contract and production redirect convergence
- **Type:** IMPLEMENT
- **Deliverable:** route indexation/canonical matrix plus metadata/link updates and production redirect convergence matrix
- **Execution-Skill:** lp-seo
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Blocked (2026-03-01)
- **Affects:** `apps/brikette/src/app/[lang]/book/page.tsx`, `apps/brikette/src/app/_lib/metadata.ts`, `apps/brikette/src/components/*booking*`, `docs/plans/brikette-sales-funnel-analysis/artifacts/seo-indexation-matrix.md`, `docs/plans/brikette-sales-funnel-analysis/artifacts/production-redirect-matrix.md`, `[external] live Cloudflare Worker/middleware redirect rules`
- **Depends on:** TASK-04
- **Blocks:** TASK-12
- **Confidence:** 85%
  - Implementation: 85% - metadata and link points are known.
  - Approach: 85% - policy matrix makes decisions explicit and stable.
  - Impact: 85% - prevents crawl/index drift from booking-state changes.
- **Acceptance:**
  - Matrix defines route policy for `/dorms`, `/dorms/[slug]`, `/book`, and param variants.
  - Param variants canonicalize to clean routes.
  - Internal link generation does not propagate booking params as crawl paths.
  - `/book` defaults to `noindex,follow`.
  - Outbound handoff links apply `rel="nofollow noopener noreferrer"`.
  - Production alias families have one canonical target each with one-hop permanent redirects on live Cloudflare source-of-truth.
  - Canonical targets verified as `200` and never `404` for booking-surface route families.
- **Validation contract (TC-08):**
  - TC-01: metadata and canonical tags match matrix.
  - TC-02: handoff links include required rel attributes.
  - TC-03: live curl matrix confirms one-hop permanent redirects for alias sources and `200` on canonical targets.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: metadata/canonical/robots references across booking surfaces.
  - Validation artifacts: fact-find SEO contract section.
- **Scouts:** confirm sitemap generation excludes booking engine destinations and excludes redirect-source aliases.
- **Edge Cases & Hardening:** locale parity for metadata policy and mixed-trailing-slash alias behavior.
- **What would make this >=90%:** Search Console verification cycle confirming policy adherence plus live redirect matrix stable across two checks.
- **Rollout / rollback:**
  - Rollout: ship metadata policy and live redirect convergence together as one SEO contract change.
  - Rollback: revert route-specific metadata overrides.
- **Documentation impact:** retain matrix as ongoing policy source.
- **Build evidence (2026-03-01):**
  - Implemented SEO/indexation code updates:
    - `/book` now emits `noindex,follow` via `buildAppMetadata(... isPublished: false)` in `apps/brikette/src/app/[lang]/book/page.tsx`
    - outbound handoff anchors include `rel="nofollow noopener noreferrer"` in:
      - `apps/brikette/src/app/[lang]/book/page.tsx` (noscript fallback)
      - `packages/ui/src/organisms/StickyBookNow.tsx`
    - internal room detail links remain clean (no booking-param propagation) in `packages/ui/src/organisms/RoomsSection.tsx`
  - Produced artifacts:
    - `docs/plans/brikette-sales-funnel-analysis/artifacts/seo-indexation-matrix.md`
    - `docs/plans/brikette-sales-funnel-analysis/artifacts/production-redirect-matrix.md`
  - Blocker:
    - live redirect convergence is not complete; current curl matrix shows canonical booking-surface targets returning `404` (`/book`, `/it/prenota`, `/en/dorms`, `/it/camere-condivise`).
  - Gate result: task remains blocked pending Cloudflare route-rule convergence to `200` canonical targets.

### TASK-09A: Ship indicative pricing fallback with auto-seed removal
- **Type:** IMPLEMENT
- **Deliverable:** empty-search indicative pricing UX coupled with room-detail auto-seed removal
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`, `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`, `packages/ui/src/organisms/RoomsSection.tsx`, `apps/brikette/src/data/indicative_prices.json`
- **Depends on:** TASK-04, TASK-05
- **Blocks:** TASK-09B, TASK-12
- **Confidence:** 85%
  - Implementation: 85% - display behavior is bounded and route-scoped.
  - Approach: 85% - directly mitigates conversion-anchor risk from auto-seed removal.
  - Impact: 85% - preserves pricing context in cold/empty search states.
- **Acceptance:**
  - Auto-seeding is removed and no-date states show indicative anchor with disclosure.
  - Valid-search states show live prices.
  - Live-price failures show `Rates temporarily unavailable` with explicit next action.
  - Live-price fetches are debounced and session-cached by `(checkin, checkout, pax, rate_plan)`.
  - Price units are explicit and consistent (per person/per room/per stay as applicable).
  - Cold-state entries remain actionable and non-blocking.
- **Validation contract (TC-09A):**
  - TC-01: no-search room-detail displays indicative anchor and prompt.
  - TC-02: valid-search entry shows live computed price.
  - TC-03: no dead-end CTA is presented in no-search state.
  - TC-04: valid-search fetch failure shows temporary-unavailable fallback and preserved next action.
  - TC-05: repeated identical search uses cache path and avoids duplicate burst fetches.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: no-date price rendering paths and auto-seed behaviors.
  - Validation artifacts: fact-find indicative pricing contract.
- **Scouts:** `None: coupled with TASK-05 route changes`
- **Edge Cases & Hardening:** missing room anchor values fallback to neutral prompt.
- **What would make this >=90%:** post-rollout conversion trend remains stable on no-search entries.
- **Rollout / rollback:**
  - Rollout: deploy together with auto-seed removal.
  - Rollback: restore neutral no-price prompt if anchors are unreliable.
- **Documentation impact:** update pricing fallback policy note.
- **Build evidence (2026-03-01):**
  - Added indicative pricing seed data:
    - `apps/brikette/src/data/indicative_prices.json`
  - Wired absent-search fallback behavior:
    - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` uses indicative room-price overrides when no search is present.
    - `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx` shows indicative anchor copy in no-search state.
  - Auto-seed removal coupling:
    - Room-detail mount-time URL auto-seeding already removed during TASK-04 migration.
  - Validation:
    - `pnpm --filter @apps/brikette typecheck` (pass)
    - `pnpm --filter @apps/brikette lint` (pass)

### TASK-09B: Implement indicative pricing governance and stale-data controls
- **Type:** IMPLEMENT
- **Deliverable:** governance artifact and stale-data suppression policy
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Affects:** `docs/plans/brikette-sales-funnel-analysis/artifacts/indicative-pricing-governance.md`, `apps/brikette/src/data/indicative_prices.json`
- **Depends on:** TASK-09A
- **Blocks:** TASK-12
- **Confidence:** 75%
  - Implementation: 75% - small scope but operational owner/cadence must be explicit.
  - Approach: 75% - governance quality determines anchor reliability.
  - Impact: 75% - prevents stale/misleading prices.
- **Acceptance:**
  - Owner, cadence, basis fields, and stale threshold are documented.
  - Stale data suppresses indicative anchors automatically.
- **Validation contract (TC-09B):**
  - TC-01: stale dataset scenario hides anchors.
  - TC-02: fresh dataset scenario shows anchors with last-updated context.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:** links TASK-09A outputs to governance rules.
- **Scouts:** `None: operational artifact`
- **Edge Cases & Hardening:** localized currency display consistency.
- **What would make this >=90%:** one full refresh cycle executed on cadence with no stale breaches.
- **Rollout / rollback:**
  - Rollout: enable stale-check gate with first governed dataset update.
  - Rollback: hide indicative prices if governance breaks.
- **Documentation impact:** governance artifact becomes operational reference.
- **Build evidence (2026-03-01):**
  - Added governance artifact:
    - `docs/plans/brikette-sales-funnel-analysis/artifacts/indicative-pricing-governance.md`
  - Implemented stale suppression gates in runtime consumers:
    - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
    - `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`
  - Fresh vs stale behavior:
    - fresh seed -> show indicative anchor
    - stale seed -> suppress anchor and show neutral fallback

### TASK-10: Validate recovery compliance and technical channel readiness
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-sales-funnel-analysis/artifacts/recovery-readiness.md`
- **Execution-Skill:** draft-email
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Affects:** `docs/plans/brikette-sales-funnel-analysis/artifacts/recovery-readiness.md`
- **Depends on:** -
- **Blocks:** TASK-11
- **Confidence:** 70%
  - Implementation: 75% - bounded discovery and decision recording.
  - Approach: 70% - depends on legal/channel ownership input.
  - Impact: 85% - prevents delivery stall in recovery implementation.
- **Questions to answer:**
  - Consent model and retention rules for quote capture.
  - Existing technical dispatch path for email (provider, trigger path, failure handling).
  - WhatsApp feasibility without new procurement.
- **Acceptance:**
  - Readiness artifact marks each channel as `ready`, `blocked`, or `needs setup`.
  - MVP channel decision is explicit.
- **Validation contract:** reviewer acknowledgement and dated decision in artifact.
- **Planning validation:** references existing tooling and privacy constraints.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** locks scope for TASK-11.
- **Build evidence (2026-03-01):**
  - Produced deliverable: `docs/plans/brikette-sales-funnel-analysis/artifacts/recovery-readiness.md`
  - MVP channel decision recorded as email-only.
  - Blockers recorded: reviewer acknowledgement + compliance owner inputs (consent, retention, dispatch ownership).
  - Gate result: completed for planning scope with explicit compliance prerequisites carried into TASK-11.

### TASK-11: Ship recovery MVP (email-only) with resume-link flow
- **Type:** IMPLEMENT
- **Deliverable:** optional email quote capture with resume-link reconstruction and proxy audience signals
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/brikette/src/app/[lang]/book/*`, `apps/brikette/src/app/[lang]/dorms/[id]/*`, `apps/brikette/src/utils/ga4-events.ts`, `docs/plans/brikette-sales-funnel-analysis/artifacts/recovery-runbook.md`
- **Depends on:** TASK-06A, TASK-07A, TASK-10
- **Blocks:** TASK-12
- **Confidence:** 80%
  - Implementation: 80% - email-only MVP and local payload storage remove provider coupling for first release.
  - Approach: 80% - scope fixed to bounded resume-link + consent metadata contract.
  - Impact: 85% - addresses highest-leverage leak under third-party checkout.
- **Acceptance:**
  - Valid-search users can opt-in for email quote capture with resume link.
  - Resume links are query-based in MVP with explicit TTL (7 days) and expiry fallback behavior.
  - Capture payload includes booking context and consent metadata only.
  - Proxy audience events are emitted from handoff and lead-capture signals.
- **Validation contract (TC-11):**
  - TC-01: capture UI appears only for valid-search contexts and requires explicit opt-in.
  - TC-02: non-expired resume link restores booking context safely.
  - TC-03: consent and retention metadata are present in stored payload.
  - TC-04: expired or invalid resume link lands on recoverable state with `Rebuild your quote`.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: recovery entry points and event consumers.
  - Validation artifacts: TASK-10 readiness artifact.
  - Consumer tracing (new outputs):
    - `lead_capture_id`, `resume_link`, `consent_version`, `recovery_channel`.
    - Consumers: email dispatch path, telemetry rollups, proxy audience definitions.
- **Scouts:** verify existing email tooling reuse path.
- **Edge Cases & Hardening:** duplicate submissions, expired resume links, consent withdrawal handling.
- **What would make this >=90%:** provider dry-run, legal signoff, and first week telemetry stability.
- **Rollout / rollback:**
  - Rollout: feature-flag by route and traffic slice.
  - Rollback: disable capture while retaining direct handoff path.
- **Documentation impact:** publish recovery runbook and KPI checks.
- **Build evidence (2026-03-01):**
  - `/lp-do-replan` round 1 recorded in `docs/plans/brikette-sales-funnel-analysis/replan-notes.md`; confidence lifted to `80%`.
  - Added email-only recovery capture UI and expiry handling:
    - `apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx`
    - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
    - `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`
  - Added recovery resume-link and payload utilities:
    - `apps/brikette/src/utils/recoveryQuote.ts`
    - `apps/brikette/src/utils/bookingSearch.ts` (`clearBookingSearch`)
  - Added proxy audience and lead-capture analytics events:
    - `apps/brikette/src/utils/ga4-events.ts`
  - Added runbook artifact:
    - `docs/plans/brikette-sales-funnel-analysis/artifacts/recovery-runbook.md`
  - Validation passes:
    - `pnpm --filter @apps/brikette typecheck`
    - `pnpm --filter @apps/brikette lint`
    - `pnpm --filter @acme/ui typecheck`
    - `pnpm --filter @acme/ui lint`
    - `bash scripts/validate-changes.sh`

### TASK-12: Horizon checkpoint - reassess downstream plan
- **Type:** CHECKPOINT
- **Deliverable:** updated plan confidence and dependency recalibration via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Blocked (2026-03-01)
- **Affects:** `docs/plans/brikette-sales-funnel-analysis/plan.md`
- **Depends on:** TASK-01, TASK-02, TASK-05, TASK-06A, TASK-06B, TASK-07A, TASK-07B, TASK-08, TASK-09A, TASK-09B, TASK-11
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - checkpoint process is explicit.
  - Approach: 95% - required after boundary-sensitive work.
  - Impact: 95% - prevents low-confidence continuation.
- **Acceptance:**
  - Checkpoint run completed through `/lp-do-build` contract.
  - `/lp-do-replan` invoked for any blocked/low-confidence next tranche.
  - Updated sequence and confidence recorded.
- **Horizon assumptions to validate:**
  - External boundary findings did not invalidate core funnel direction.
  - Recovery and pricing governance are operationally sustainable.
- **Validation contract:** checkpoint note includes confidence deltas and updated blockers.
- **Planning validation:** references artifacts from TASK-01, TASK-02, TASK-10.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** updates plan for next build slice.
- **Build evidence (2026-03-01):**
  - CHECKPOINT gate not runnable because dependency `TASK-08` remains blocked by live Cloudflare redirect/canonical convergence.
  - `/lp-do-replan` was executed for low-confidence `TASK-11` and succeeded; no additional in-repo precursors can unblock `TASK-08`.

## Risks & Mitigations
- Legacy URL consumers silently bypass canonical booking state.
  - Mitigation: consumer tracing in TASK-04 and CI target from TASK-03.
- Export persistence does not support deterministic joins.
  - Mitigation: TASK-07B enforces proxy-mode language and policy.
- No-JS behavior drifts from hard constraints.
  - Mitigation: TASK-06B blocked by TASK-01 boundary proof.
- Indicative pricing becomes stale or misleading.
  - Mitigation: TASK-09B stale suppression and owner/cadence governance.
- Recovery dispatch not technically feasible in current stack.
  - Mitigation: TASK-10 explicit technical readiness gate before TASK-11.
- Live production route aliases and canonical targets diverge from intended policy.
  - Mitigation: TASK-08 production redirect matrix + live curl verification before completion.

## Observability
- Logging:
  - Booking state source (`url`, `shared_store`, `empty`) and validation outcomes.
  - Recovery capture outcomes and dispatch failures.
- Metrics:
  - `handoff_to_engine` volume and payload completeness rate.
  - Invalid-state interaction rates by reason code.
  - Split-booking guidance trigger rate.
  - Indicative-pricing usage versus live-pricing usage.
  - Recovery opt-in and resume-link usage rates.
- Alerts/Dashboards:
  - Event payload completeness drops.
  - Indicative pricing stale-threshold breach.
  - Post-change handoff-rate anomaly.

## Acceptance Criteria (overall)
- [ ] Canonical booking state contract is active across `/[lang]`, `/[lang]/dorms`, `/[lang]/dorms/[slug]`, and `/[lang]/book`.
- [ ] Cross-tab continuity is best-effort and cold-state flows remain conversion-safe with no dead-end CTAs.
- [ ] Hostel contracts are enforced pre-handoff with split-booking guidance for over-limit demand.
- [ ] Hostel no-JS path follows assisted policy unless post-handoff enforcement is proven.
- [ ] Canonical analytics schema is emitted consistently across handoff CTAs.
- [ ] SEO/indexation policy matrix is implemented and route metadata aligns with it.
- [ ] Live production alias routes converge to one-hop permanent redirects with canonical targets returning `200`.
- [ ] Parseable but invalid user inputs are preserved and routed to correction/split-booking guidance (not cleared to empty state).
- [ ] Indicative pricing fallback ships with auto-seed removal and stale-data controls.
- [ ] Recovery MVP ships as email-only unless readiness artifact upgrades channel scope.

## Decision Log
- 2026-03-01: Plan maintained in `plan-only` mode per operator instruction.
- 2026-03-01: Cross-tab continuity marked best-effort; cold-state continuity is explicitly handled as a first-class behavior.
- 2026-03-01: Analytics work split into schema-first (`TASK-07A`) and export-dependent policy (`TASK-07B`) to avoid measurement delays.
- 2026-03-01: Hostel enforcement work split into pre-handoff UX (`TASK-06A`) and no-JS boundary/copy (`TASK-06B`).
- 2026-03-01: Recovery MVP scope locked to email-only until technical/channel readiness confirms expansion.
- 2026-03-01: Indicative pricing fallback moved to ship with auto-seed removal (`TASK-09A`).
- 2026-03-01: Hydration contract clarified to parse-then-validate so policy-invalid intent is preserved for corrective UX.
- 2026-03-01: `brik_click_id` lifecycle constrained to per-attempt handoff state, not shared continuity state.
- 2026-03-01: TASK-08 expanded to include live Cloudflare redirect/canonical convergence based on production evidence (`200` alias duplicates and `404` canonical targets).

## Overall-confidence Calculation
- Effort weights: S=1, M=2, L=3
- Sum(confidence * weight) = 2390
- Sum(weight) = 30
- Overall-confidence = 2390 / 30 = 79.7% -> 80%

## Critique Loop
- Input source: operator critique (2026-03-01) applied as hardening pass.
- Main changes incorporated:
  - Added cold-state continuity acceptance and best-effort continuity wording.
  - Split overloaded enforcement and analytics tasks.
  - Added CI-first feedback harness task to align with CI-only execution posture.
  - Added SEO indexation matrix artifact deliverable.
  - Moved indicative fallback to ship with auto-seed removal.
  - Scoped recovery MVP to email-only pending channel readiness.
- Remaining known unknowns:
  - Octobook post-handoff constraint enforcement capability (TASK-01).
  - Click-id export persistence (TASK-02).

## Section Omission Rule
None: all plan template sections are applicable.
