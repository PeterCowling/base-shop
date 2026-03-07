---
Type: Plan
Status: Active
Domain: UI | SEO | Analytics | Integration
Workstream: Mixed
Created: 2026-03-01
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
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

This run has progressed through `/lp-do-build` cycles, but a route-localization audit on 2026-03-06 showed that several public non-English routes still expose English slugs. A new route-localization tranche is therefore inserted ahead of live Cloudflare convergence so production redirects target the final localized public contract once, not an intermediate state. `/lp-do-replan` on 2026-03-06 then added explicit precursor tasks for top-level slug policy and guide-fallback mapping so the remaining route-localization tasks are runnable at higher confidence instead of carrying unresolved scout notes.

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
- [x] TASK-08A: Verify app-owned booking-surface SEO/indexation contract closure
- [x] TASK-08B: Freeze live redirect inventory and canonical target map
- [x] TASK-13A: Implement route-localization inventory and regression audit gate
- [x] TASK-13F: Freeze top-level slug policy, allowlist, and apartment-route consumer map
- [x] TASK-13B: Localize top-level public route slugs and apartment booking route
- [x] TASK-13C: Localize dorm room detail slugs for non-English locales still using English
- [x] TASK-13G: Map guide-slug fallback causes and alias-preservation contract
- [x] TASK-13D: Localize live guide/article slugs still falling back to English
- [x] TASK-13E: Route-localization checkpoint and final canonical target refresh
- [~] TASK-08C: Apply live Cloudflare redirect convergence at the production source of truth — Blocked (live Pages deployment pending)
- [~] TASK-08D: Verify live one-hop redirects and canonical `200` targets — Blocked (depends on TASK-08C)
- [x] TASK-09A: Ship indicative pricing fallback with auto-seed removal
- [x] TASK-09B: Implement indicative pricing governance and stale-data ops controls
- [x] TASK-10: Validate recovery compliance and technical channel readiness
- [x] TASK-11: Ship recovery MVP (email-only) with resume-link flow and proxy audiences
- [~] TASK-12: Horizon checkpoint and confidence recalibration — Blocked (depends on TASK-08D live verification)

## Goals
- Deliver a dead-end-free booking funnel with room-detail fast lane and `/book` comparison role.
- Keep hostel constraints as hard contracts across UI, URL builder, no-JS, and analytics layers.
- Establish one canonical booking state contract with explicit precedence and continuity behavior.
- Canonicalize handoff analytics for no-API operational reconciliation and recovery targeting.
- Preserve conversion anchoring when search is absent through governed indicative pricing.
- Ensure non-English canonical public routes do not leak unintended English slugs outside an explicit allowlist.
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
  - Public route changes require redirect-compatible rollout; no localized slug may change without preserving deep-link and SEO continuity from the prior URL.
  - Internal App Router folder segments may remain English; only public canonical URLs must be localized.
  - Production redirect source-of-truth must be Worker/middleware/edge rules on live Cloudflare target; `_redirects` alone is insufficient for production parity.
  - Local Jest/e2e execution is not used in this workflow; CI remains the pass/fail source of truth.
- Assumptions:
  - Cross-tab continuity is best-effort via shared storage with TTL; cold-state behavior must still convert safely.
  - Existing Brikette route architecture can consume a canonical booking state service without platform migration.
  - Guide slug localization is coupled to guide label completeness and may require explicit overrides where locale content still falls back to English.

## Inherited Outcome Contract
- **Why:** Brikette needs an ideal, low-friction funnel where room-intent users can book fast, comparison users can browse clearly, and no route traps users in invalid or ambiguous state.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** migrate to a session-first booking funnel with explicit validity contracts (2-8 nights, max 8 adults in hostel), direct room-detail handoff, and no dead-end transitions.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brikette-sales-funnel-analysis/fact-find.md`
- Related briefing: `docs/briefs/brikette-route-localization-briefing.md`
- Key findings used:
  - Booking continuity is currently fragmented across URL and route-local state.
  - Hard hostel constraints already exist in core validators and handoff URL builder.
  - Route CTA behavior still over-relies on `/book` fallback.
  - Analytics contract is not fully canonicalized.
  - Live production routing currently has canonical/alias mismatch (`200` duplicates + `404` canonical targets) and needs explicit redirect convergence.
  - Public route-localization audit (2026-03-06) found real non-English English-slug leakage in the apartment booking route, legal-policy slugs, `hi`/`da` booking slug variants, `ja`/`ko` house-rules variants, `it` tag slug, room slugs in several non-Latin locales, and ~29-30 live guide slugs per locale still matching English.
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
| TASK-04 | IMPLEMENT | Canonical `BookingSearch` + best-effort cross-tab continuity | 80% | L | Complete (2026-03-01) | TASK-03 | TASK-05, TASK-06A, TASK-07A, TASK-08A, TASK-09A |
| TASK-05 | IMPLEMENT | Route/CTA realignment to ideal funnel roles | 85% | L | Complete (2026-03-01) | TASK-03, TASK-04 | TASK-08A, TASK-09A |
| TASK-06A | IMPLEMENT | Hostel pre-handoff validation UX + split-booking guidance | 85% | M | Complete (2026-03-01) | TASK-04 | TASK-06B, TASK-11, TASK-12 |
| TASK-06B | IMPLEMENT | Hostel no-JS assisted policy + copy finalization | 75% | M | Complete (2026-03-01) | TASK-01, TASK-06A | TASK-12 |
| TASK-07A | IMPLEMENT | Canonical handoff analytics schema + click-id event payload | 85% | M | Complete (2026-03-01) | TASK-03, TASK-04 | TASK-07B, TASK-11, TASK-12 |
| TASK-07B | IMPLEMENT | Click-id handoff URL + reconciliation join policy | 75% | S | Complete (2026-03-01) | TASK-02, TASK-07A | TASK-12 |
| TASK-08A | IMPLEMENT | Verify app-owned booking-surface SEO/indexation contract closure | 90% | S | Complete (2026-03-01) | TASK-04, TASK-05 | TASK-08B |
| TASK-08B | IMPLEMENT | Freeze live redirect inventory and canonical target map | 85% | S | Complete (2026-03-01) | TASK-08A | TASK-13A |
| TASK-13A | IMPLEMENT | Route-localization inventory + regression audit gate | 85% | M | Complete (2026-03-06) | TASK-08B | TASK-13F, TASK-13C, TASK-13G |
| TASK-13F | INVESTIGATE | Freeze top-level slug policy, allowlist, and apartment-route consumer map | 70% | S | Complete (2026-03-06) | TASK-13A | TASK-13B |
| TASK-13B | IMPLEMENT | Localize top-level public route slugs + apartment booking route | 85% | M | Complete (2026-03-06) | TASK-13A, TASK-13F | TASK-13E |
| TASK-13C | IMPLEMENT | Localize dorm room detail slugs for locales still using English | 80% | M | Complete (2026-03-06) | TASK-13A | TASK-13E |
| TASK-13G | INVESTIGATE | Map guide-slug fallback causes and alias-preservation contract | 70% | M | Complete (2026-03-06) | TASK-13A | TASK-13D |
| TASK-13D | IMPLEMENT | Localize live guide/article slugs still falling back to English | 80% | L | Complete (2026-03-07) | TASK-13A, TASK-13G | TASK-13E |
| TASK-13E | CHECKPOINT | Route-localization checkpoint + final canonical target refresh | 95% | S | Complete (2026-03-07) | TASK-13B, TASK-13C, TASK-13D | TASK-08C |
| TASK-08C | IMPLEMENT | Apply live Cloudflare redirect convergence at production source of truth | 80% | M | Blocked (2026-03-06) | TASK-13E | TASK-08D, TASK-12 |
| TASK-08D | INVESTIGATE | Verify live one-hop redirects and canonical `200` targets | 85% | S | Blocked (2026-03-06) | TASK-08C | TASK-12 |
| TASK-09A | IMPLEMENT | Indicative pricing fallback coupled with auto-seed removal | 85% | M | Complete (2026-03-01) | TASK-04, TASK-05 | TASK-09B, TASK-12 |
| TASK-09B | IMPLEMENT | Indicative pricing governance/staleness controls | 75% | S | Complete (2026-03-01) | TASK-09A | TASK-12 |
| TASK-10 | INVESTIGATE | Recovery compliance + technical channel readiness | 70% | M | Complete (2026-03-01) | - | TASK-11 |
| TASK-11 | IMPLEMENT | Recovery MVP (email-only) + resume-link + proxy audiences | 80% | L | Complete (2026-03-01) | TASK-06A, TASK-07A, TASK-10 | - |
| TASK-12 | CHECKPOINT | Horizon checkpoint + `/lp-do-replan` for next tranche | 95% | S | Blocked (2026-03-06) | TASK-08D | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-10 | - | Boundary and channel discovery + CI feedback harness |
| 2 | TASK-04, TASK-07A | TASK-03 (TASK-04), TASK-03,TASK-04 (TASK-07A) | State foundation then early analytics normalization |
| 3 | TASK-05, TASK-06A, TASK-08A | TASK-04 (and TASK-03 for TASK-05) | Funnel behavior, hostel enforcement, and app-owned SEO/indexation closure |
| 4 | TASK-09A, TASK-06B, TASK-07B | TASK-04,TASK-05 (TASK-09A), TASK-01,TASK-06A (TASK-06B), TASK-02,TASK-07A (TASK-07B) | Indicative fallback ships with auto-seed removal and boundary-dependent contracts |
| 5 | TASK-09B, TASK-11 | TASK-09A (TASK-09B), TASK-06A,TASK-07A,TASK-10 (TASK-11) | Governance closure + recovery MVP delivery |
| 6 | TASK-08B, TASK-13A | TASK-08A (TASK-08B), TASK-08B (TASK-13A) | Freeze current live map, then implement route-localization audit and final-contract inventory |
| 7 | TASK-13F, TASK-13C, TASK-13G | TASK-13A | Resolve top-level policy unknowns, room-slug implementation, and guide-fallback cause map in parallel |
| 8 | TASK-13B, TASK-13D | TASK-13A,TASK-13F (TASK-13B), TASK-13A,TASK-13G (TASK-13D) | Execute top-level and guide-slug localization once precursor evidence is frozen |
| 9 | TASK-13E, TASK-08C | TASK-13B,TASK-13C,TASK-13D (TASK-13E), TASK-13E (TASK-08C) | Refresh final canonical targets, then apply Cloudflare source-of-truth routing changes once |
| 10 | TASK-08D, TASK-12 | TASK-08C (TASK-08D), TASK-08D (TASK-12) | Live curl verification gate, then checkpoint |

- Max parallelism: 4 tasks (Wave 1)
- Critical path: TASK-03 -> TASK-04 -> TASK-05 -> TASK-08A -> TASK-08B -> TASK-13A -> TASK-13G -> TASK-13D -> TASK-13E -> TASK-08C -> TASK-08D -> TASK-12

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
| TASK-08A: App SEO/indexation closure | Yes | None | No |
| TASK-08B: Redirect inventory + canonical map | Yes | None | No |
| TASK-13A: Route-localization audit gate | Yes | None | No |
| TASK-13F: Top-level policy + consumer map | Yes | None | No |
| TASK-13B: Top-level localized route closure | Partial | [Missing precondition][Moderate]: waits on TASK-13F to freeze legal-route policy and explicit shared-spelling allowlist | Yes |
| TASK-13C: Dorm room slug localization | Partial | [Backward compatibility][Major]: reverse lookup and old slug deep links must survive locale-by-locale changes | Yes |
| TASK-13G: Guide fallback cause map | Yes | None | No |
| TASK-13D: Guide slug localization closure | Partial | [Missing precondition][Moderate]: waits on TASK-13G to freeze fallback causes and alias-preservation strategy | Yes |
| TASK-13E: Route-localization checkpoint | Partial | [Ordering dependency][Moderate]: must refresh canonical target map before external redirect rollout | Yes |
| TASK-08C: Live Cloudflare redirect convergence | Partial | [External dependency][Major]: production source-of-truth routing change is outside local app code and must wait for the refreshed localized target contract | Yes |
| TASK-08D: Live redirect verification | Partial | [Ordering dependency][Major]: cannot prove one-hop redirect behavior or canonical `200` targets until TASK-08C is applied live | Yes |
| TASK-09A: Indicative fallback + auto-seed removal | Yes | None | No |
| TASK-09B: Indicative governance | Partial | [Missing data dependency][Moderate]: owner/cadence process must be documented to avoid stale anchors | Yes |
| TASK-10: Recovery readiness | Yes | None | No |
| TASK-11: Recovery MVP email-only | Yes | None | No |
| TASK-12: Checkpoint | Partial | [Missing precondition][Major]: depends on TASK-08D live redirect verification | Yes |

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
- **Blocks:** TASK-06B
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
- **Blocks:** TASK-07B
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
- **Blocks:** TASK-05, TASK-06A, TASK-07A, TASK-08A, TASK-09A
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
- **Blocks:** TASK-08A, TASK-09A
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
- **Blocks:** TASK-06B, TASK-11
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
- **Blocks:** -
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
- **Blocks:** TASK-07B, TASK-11
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
- **Blocks:** -
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

### TASK-08A: Verify app-owned booking-surface SEO/indexation contract closure
- **Type:** IMPLEMENT
- **Deliverable:** verified route indexation/canonical matrix plus app-owned metadata/link updates aligned to the matrix
- **Execution-Skill:** lp-seo
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/brikette/src/app/[lang]/book/page.tsx`, `apps/brikette/src/app/_lib/metadata.ts`, `apps/brikette/src/components/*booking*`, `docs/plans/brikette-sales-funnel-analysis/artifacts/seo-indexation-matrix.md`
- **Depends on:** TASK-04, TASK-05
- **Blocks:** TASK-08B
- **Confidence:** 90%
  - Implementation: 90% - app-owned metadata and link points were already known and were updated in-repo.
  - Approach: 90% - isolating app-owned SEO closure from live edge routing removes the previous blended blocker.
  - Impact: 85% - keeps crawl/index behavior inside the app aligned even before external redirect convergence lands.
- **Acceptance:**
  - Matrix defines route policy for `/dorms`, `/dorms/[slug]`, `/book`, and param variants.
  - Param variants canonicalize to clean routes.
  - Internal link generation does not propagate booking params as crawl paths.
  - `/book` defaults to `noindex,follow`.
  - Outbound handoff links apply `rel="nofollow noopener noreferrer"`.
- **Validation contract (TC-08A):**
  - TC-01: metadata and canonical tags match matrix.
  - TC-02: handoff links include required `rel` attributes.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: metadata/canonical/robots references across booking surfaces.
  - Validation artifacts: fact-find SEO contract section and `seo-indexation-matrix.md`.
- **Scouts:** confirm sitemap generation excludes booking engine destinations and redirect-source aliases.
- **Edge Cases & Hardening:** locale parity for metadata policy and param-stripping consistency.
- **What would make this >=90%:** post-deploy metadata spot checks across 3-5 locale variants.
- **Rollout / rollback:**
  - Rollout: ship app-owned metadata and link contract changes together.
  - Rollback: revert route-specific metadata overrides.
- **Documentation impact:** retain app-owned SEO matrix as the source of truth for route policy.
- **Build evidence (2026-03-01):**
  - `/book` now emits `noindex,follow` via `buildAppMetadata(... isPublished: false)` in `apps/brikette/src/app/[lang]/book/page.tsx`.
  - Outbound handoff anchors include `rel="nofollow noopener noreferrer"` in:
    - `apps/brikette/src/app/[lang]/book/page.tsx` (noscript fallback)
    - `packages/ui/src/organisms/StickyBookNow.tsx`
  - Internal room detail links remain clean (no booking-param propagation) in `packages/ui/src/organisms/RoomsSection.tsx`.
  - Produced artifact:
    - `docs/plans/brikette-sales-funnel-analysis/artifacts/seo-indexation-matrix.md`

### TASK-08B: Freeze live redirect inventory and canonical target map
- **Type:** IMPLEMENT
- **Deliverable:** precise production redirect matrix naming every booking-surface alias family, canonical target, expected status, and verification path
- **Execution-Skill:** lp-seo
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Affects:** `docs/plans/brikette-sales-funnel-analysis/artifacts/production-redirect-matrix.md`
- **Depends on:** TASK-08A
- **Blocks:** TASK-13A
- **Confidence:** 85%
  - Implementation: 85% - the live routing evidence was already captured and written into the redirect matrix artifact.
  - Approach: 85% - separating inventory from implementation makes the remaining external change set concrete.
  - Impact: 85% - removes ambiguity about what Cloudflare must change.
- **Acceptance:**
  - Every booking-surface alias family has one named canonical target.
  - Matrix records expected live status for alias source and canonical target.
  - Broken canonical targets and duplicate-`200` alias families are explicitly listed.
- **Validation contract (TC-08B):**
  - TC-01: `production-redirect-matrix.md` covers booking-surface alias families observed in fact-find evidence.
  - TC-02: matrix differentiates app-owned canonical policy from external edge-routing fixes.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:** tied directly to fact-find production evidence and live curl snapshots.
- **Scouts:** `None: artifact already produced`
- **Edge Cases & Hardening:** mixed trailing slash behavior and locale-specific alias families remain explicit in the matrix.
- **What would make this >=90%:** second live inventory sample showing the same redirect failures before implementation.
- **Rollout / rollback:** `None: artifact/spec task`
- **Documentation impact:** redirect matrix becomes the implementation handoff for Cloudflare changes.
- **Build evidence (2026-03-01):**
  - Produced artifact:
    - `docs/plans/brikette-sales-funnel-analysis/artifacts/production-redirect-matrix.md`
  - Captured blocker evidence showing canonical booking-surface targets returning `404` (`/book`, `/it/prenota`, `/en/dorms`, `/it/camere-condivise`) and duplicate-live alias families that still return `200`.
  - Repo-side redirect source-of-truth hardening (2026-03-06):
    - `apps/brikette/scripts/generate-static-export-redirects.ts` now appends the full localized static-export rule set from `src/routing/staticExportRedirects.ts` instead of emitting only the old hand-maintained subset.
    - Regenerated `apps/brikette/public/_redirects` now contains the localized Cloudflare Pages redirect/rewrite rules expected by the route inventory.
    - `apps/brikette/scripts/verify-url-coverage.ts` now counts localized public URLs and parses actual `_redirects` source patterns, eliminating false-negative coverage failures from localized public paths and non-`/directions/*` redirect sources.
    - Local validation now reports `Cloudflare _redirects: verified (1407 localized rules)` and `All legacy URLs are covered!`; remaining TASK-08 work is therefore no longer blocked by in-repo redirect drift.

### TASK-08C: Apply live Cloudflare redirect convergence at production source of truth
- **Type:** IMPLEMENT
- **Deliverable:** production Cloudflare Pages routing artifact deployed so each booking-surface alias family resolves to one canonical live target via one-hop permanent redirects
- **Execution-Skill:** lp-seo
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Blocked (2026-03-06)
- **Affects:** `.github/workflows/brikette.yml`, `docs/brikette-deploy-decisions.md`, `[external] live Cloudflare Pages deploy on production branch`, `docs/plans/brikette-sales-funnel-analysis/artifacts/production-redirect-matrix.md`
- **Depends on:** TASK-13E
- **Blocks:** TASK-08D, TASK-12
- **Confidence:** 80%
  - Implementation: 75% - rule edits are straightforward once the production source of truth is available.
  - Approach: 85% - exact alias families are already known and TASK-13E refreshes the final localized canonical targets before rollout.
  - Impact: 90% - this is the actual blocker preventing the booking-surface SEO contract from being complete.
- **Acceptance:**
  - Every alias in the production redirect matrix returns one-hop `301` or `308` to its named canonical target.
  - No booking-surface canonical target returns `404`.
  - Cloudflare routing behavior matches the redirect matrix exactly.
- **Validation contract (TC-08C):**
  - TC-01: production rule changes are applied at the actual source of truth, not only in-repo mirrors or `_redirects`.
  - TC-02: the changed rule set covers every alias family named in `production-redirect-matrix.md`.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: compare app-owned canonical policy, route-localization contract, and live Cloudflare drift evidence.
  - Validation artifacts: `production-redirect-matrix.md`, `docs/briefs/brikette-route-localization-briefing.md`, refreshed route-localization checkpoint evidence.
- **Scouts:** resolved on 2026-03-07: production source of truth is the repo-managed Cloudflare Pages deploy path in `.github/workflows/brikette.yml`; live rollout still requires promotion of the updated artifact set.
- **Edge Cases & Hardening:** preserve locale parity, avoid multi-hop redirects, and ensure redirect sources do not remain indexable `200` pages.
- **What would make this >=90%:** direct access to the production routing source plus one successful staged rule update.
- **Rollout / rollback:**
  - Rollout: apply route-family changes in the production source of truth, then immediately run TASK-08D.
  - Rollback: restore prior route rules only if canonical targets regress or misroute.
- **Documentation impact:** apply the refreshed canonical target map from TASK-13E to the redirect matrix if any target choice changes during implementation.
- **Blocker:** live production deployment is still pending.
  - Repo-side route inventory, generated `_redirects`, deploy-health gates, and coverage verification are aligned locally as of 2026-03-07, but the updated Pages artifact set has not yet been promoted to production.
  - Direct local `wrangler` deploy is unavailable from this workspace because `pnpm exec wrangler whoami` returns `Not logged in`.
  - The normal git release path also stops before production today: `origin/dev` and `origin/staging` have no tree diff, so the auto `dev -> staging` PR closes immediately, while the existing `staging -> main` promotion remains blocked by unrelated staging pipeline failures.
- **Build evidence (2026-03-07):**
  - Confirmed the production routing source of truth is the repo-managed Cloudflare Pages deploy workflow:
    - `.github/workflows/brikette.yml`
    - `apps/brikette/wrangler.toml`
  - Hardened rollout gates to the finalized localized funnel contract:
    - static export validation now checks `apps/brikette/out/it/prenota.html`
    - static export validation now checks `apps/brikette/out/it/prenota-alloggi-privati.html`
    - staging post-deploy strict routes now require `/it/prenota /it/prenota-alloggi-privati`
    - production post-deploy strict routes now require `/it/prenota /it/prenota-alloggi-privati`
  - Updated the deploy runbook in `docs/brikette-deploy-decisions.md` so it matches the active Pages deploy path and localized booking-route contract.
  - Refreshed `docs/plans/brikette-sales-funnel-analysis/artifacts/production-redirect-matrix.md` with live `2026-03-07` evidence showing production still serves the pre-rollout route state:
    - `/it/prenota` -> `200`
    - `/it/book` -> `404`
    - `/it/prenota-alloggi-privati` -> `404`
    - `/it/book-private-accommodations` -> `200`
    - localized guide canonical sample -> `404`
    - legacy English guide alias sample -> `200`
  - Release-path findings:
    - Committed and pushed `fix(brikette): finalize localized route rollout` to `origin/dev` (`747196ad8c`).
    - Auto PR `dev -> staging` was created and closed with no remaining tree diff because `origin/staging` already contains the same effective Brikette tree.
    - Direct Cloudflare deploy remains blocked in this workspace by missing local `wrangler` auth.
    - Production rollout therefore depends on an eventual clean `staging -> main` promotion or refreshed Cloudflare deploy credentials.

### TASK-08D: Verify live one-hop redirects and canonical `200` targets
- **Type:** INVESTIGATE
- **Deliverable:** dated live curl verification proving redirect families resolve in one hop and canonical booking-surface targets return `200`
- **Execution-Skill:** lp-seo
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Blocked (2026-03-06)
- **Affects:** `docs/plans/brikette-sales-funnel-analysis/artifacts/production-redirect-matrix.md`
- **Depends on:** TASK-08C
- **Blocks:** TASK-12
- **Confidence:** 85%
  - Implementation: 85% - verification is straightforward once live routing changes exist.
  - Approach: 85% - the matrix already names the exact alias/canonical pairs to test.
  - Impact: 85% - provides the objective completion gate for the remaining external work.
- **Acceptance:**
  - Live curl matrix confirms one-hop permanent redirects for every alias source.
  - Every canonical target in the matrix returns `200`.
  - No canonical tag points to a non-resolving URL in the booking-surface family.
- **Validation contract (TC-08D):**
  - TC-01: dated live curl matrix recorded after TASK-08C implementation.
  - TC-02: verification output shows one-hop redirects and canonical `200` targets for all named route families.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:** uses the refreshed target map from TASK-13E as the authoritative checklist.
- **Scouts:** `None: pure verification gate`
- **Edge Cases & Hardening:** verify locale variants and mixed trailing slash entries where they appear in the matrix.
- **What would make this >=90%:** two separate live verification passes returning identical results.
- **Rollout / rollback:** `None: verification task`
- **Documentation impact:** append dated verification results to the redirect matrix artifact.
- **Blocker:** cannot run until TASK-08C updates live routing behavior.

### TASK-13A: Implement route-localization inventory and regression audit gate
- **Type:** IMPLEMENT
- **Deliverable:** route-localization audit command plus artifact enumerating public route families, non-English English-slug leakage, and explicit allowlisted shared-spelling exceptions
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:** `apps/brikette/scripts/verify-route-localization.ts`, `docs/plans/brikette-sales-funnel-analysis/artifacts/route-localization-contract.md`, `[readonly] apps/brikette/src/routing/routeInventory.ts`, `[readonly] apps/brikette/src/slug-map.ts`, `[readonly] packages/ui/src/config/roomSlugs.ts`, `[readonly] apps/brikette/src/guides/slugs/slugs.ts`
- **Depends on:** TASK-08B
- **Blocks:** TASK-13F, TASK-13C, TASK-13G
- **Confidence:** 85%
  - Implementation: 85% - the route sources are already known and centrally enumerable.
  - Approach: 85% - a deterministic audit gate is the cleanest way to prevent slug regressions before mutating public URLs.
  - Impact: 90% - gives the operator a route-family inventory and enforces the exact standard that non-English slugs should not silently remain English.
- **Acceptance:**
  - Script emits the canonical public route families by locale from repo-owned sources of truth.
  - Script flags top-level, room, and guide slugs that match English in non-English locales.
  - Output distinguishes approved shared spellings from true localization debt.
  - Artifact records the exact current exception list that downstream tasks must eliminate or explicitly preserve.
  - Expected user-observable behavior:
    - None: this is an audit/tooling task, but it directly protects future public URL behavior.
- **Validation contract (TC-13A):**
  - TC-01: audit command completes and produces a reproducible route-family inventory artifact.
  - TC-02: current known leaks from the 2026-03-06 briefing are detected by the audit output.
  - TC-03: approved shared-spelling cases are separated from true English fallback debt.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: verified route sources in `slug-map.ts`, `routeInventory.ts`, `roomSlugs.ts`, and guide slug generation.
  - Validation artifacts: `docs/briefs/brikette-route-localization-briefing.md`
  - Unexpected findings: apartment booking route is hardcoded outside the top-level slug map and must be treated as its own consumer set.
- **Scouts:** identify whether an existing route/SEO audit script can host this logic instead of adding a new standalone script.
- **Edge Cases & Hardening:** normalize ASCII transliterations, locale words that legitimately match English, and legal-route freezes without suppressing real debt.
- **What would make this >=90%:**
  - One dry-run implementation sketch proving the audit can enumerate every public route family without false positives.
- **Rollout / rollback:**
  - Rollout: add the audit script and artifact, then use it as the contract for all downstream slug changes.
  - Rollback: remove the new audit entry point only if it duplicates an existing stronger gate.
- **Documentation impact:**
  - Adds `route-localization-contract.md` as the canonical briefing-to-build handoff artifact.
- **Notes / references:**
  - Route-localization findings are documented in `docs/briefs/brikette-route-localization-briefing.md`.
- **Build evidence (2026-03-06):**
  - Added audit command: `apps/brikette/scripts/verify-route-localization.ts`
  - Added package script: `apps/brikette/package.json` -> `verify-route-localization`
  - Produced artifact: `docs/plans/brikette-sales-funnel-analysis/artifacts/route-localization-contract.md`
  - Detection counts from current route contract:
    - `top-level`: `38`
    - `nested-segment`: `1`
    - `special-route`: `17`
    - `room`: `40`
    - `guide`: `495`
  - Approved shared-spelling allowlist is enforced separately from debt:
    - `fr:experiences:experiences`
    - `fr:guides:guides`
  - Acceptance: pass (the audit writes the artifact and fails closed while debt remains).

### TASK-13F: Freeze top-level slug policy, allowlist, and apartment-route consumer map
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-sales-funnel-analysis/artifacts/top-level-route-policy.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `[readonly] apps/brikette/src/slug-map.ts`, `[readonly] apps/brikette/src/middleware.ts`, `[readonly] apps/brikette/src/app/[lang]/book-private-accommodations/page.tsx`, `[readonly] apps/brikette/scripts/generate-static-export-redirects.ts`
- **Depends on:** TASK-13A
- **Blocks:** TASK-13B
- **Confidence:** 70%
  - Implementation: 75% - the consumer set is finite and grep-traceable.
  - Approach: 70% - the remaining uncertainty is policy intent, not route mechanics.
  - Impact: 80% - removes the main unresolved ambiguity inside top-level slug localization.
- **Questions to answer:**
  - Are `privacy-policy` and `cookie-policy` intentionally frozen, or should they join the localized slug contract?
  - Which top-level shared-spelling cases are explicitly allowlisted rather than treated as debt?
  - What is the complete consumer map for `book-private-accommodations` across links, redirects, metadata, and route generation?
- **Acceptance:**
  - Artifact names the approved top-level allowlist and legal-route policy.
  - Apartment booking route consumer map is complete enough to drive a safe rename/localization.
  - `TASK-13B` no longer carries unresolved policy questions in scout notes.
- **Validation contract:** artifact cites repo paths for legal slugs, shared-spelling exceptions, and apartment-route consumers.
- **Planning validation:** derived from route-localization briefing plus targeted consumer tracing.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** records the approved top-level route policy that `TASK-13B` must implement.
- **Notes / references:**
  - This task formalizes the open issue from `critique-history.md` instead of leaving it as an inline scout note.
- **Build evidence (2026-03-06):**
  - Produced artifact: `docs/plans/brikette-sales-funnel-analysis/artifacts/top-level-route-policy.md`
  - Consumer map for `book-private-accommodations` frozen from repo traces across:
    - page entry points
    - middleware/routing
    - static redirect generation
    - private-room CTA surfaces
    - route/readiness tests
  - Policy decision recorded:
    - Approved shared spellings: `fr/experiences`, `fr/guides`
    - Not approved as canonicals: non-English `privacy-policy`, `cookie-policy`, `/hi/book`, `/da/book`, `/ja/house-rules`, `/ko/house-rules`, and Italian `tags`
  - Acceptance: pass (`TASK-13B` no longer carries unresolved top-level policy ambiguity).

### TASK-13B: Localize top-level public route slugs and apartment booking route
- **Type:** IMPLEMENT
- **Deliverable:** top-level public slug closure including localized apartment booking route, non-English legal/page slugs, and legacy redirect compatibility
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:** `apps/brikette/src/slug-map.ts`, `apps/brikette/src/routing/routeInventory.ts`, `apps/brikette/src/routing/sectionSegments.ts`, `apps/brikette/src/middleware.ts`, `apps/brikette/src/app/[lang]/book-private-accommodations/page.tsx`, `apps/brikette/scripts/generate-static-export-redirects.ts`, `apps/brikette/public/_redirects`
- **Depends on:** TASK-13A, TASK-13F
- **Blocks:** TASK-13E
- **Confidence:** 85%
  - Implementation: 80% - the change is broad but centralized in the top-level route contract.
  - Approach: 85% - moving top-level public URLs onto localized slugs before Cloudflare rollout avoids converging twice.
  - Impact: 90% - these are the most visible and commercially important route leaks.
- **Acceptance:**
  - Apartment booking route is represented by a locale-aware public slug contract rather than a hardcoded English path.
  - `privacy-policy` and `cookie-policy` are localized or explicitly replaced by approved locale-safe slugs.
  - `/hi/book`, `/da/book`, `/ja/house-rules`, `/ko/house-rules`, and `/it/.../tags/...` no longer remain unintended English public canonicals.
  - Legacy top-level URLs permanently redirect in one hop to the new localized canonical targets.
  - Expected user-observable behavior:
    - Non-English booking/legal/tag routes show locale-appropriate slugs in the address bar.
    - Existing bookmarked English aliases continue to land on the correct localized destination.
- **Validation contract (TC-13B):**
  - TC-01: route-localization audit passes for top-level route families outside the explicit allowlist.
  - TC-02: middleware redirects wrong-locale and legacy top-level aliases to the new localized slugs.
  - TC-03: generated redirect coverage includes the new top-level canonical and legacy routes.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: consumer trace for `book-private-accommodations`, legal slugs, booking slug, house-rules slug, and guide tag slug.
  - Validation artifacts: route-localization contract artifact from TASK-13A, existing `_redirects` coverage verification, middleware redirect tests.
  - Unexpected findings: apartment booking path is consumed across page generation, metadata, redirects, and private-room CTA entry points.
- **Scouts:** `None: TASK-13F freezes legal-route policy, allowlist, and apartment-route consumers first`
- **Edge Cases & Hardening:** preserve deep links, mixed trailing slash behavior, and locale switching behavior after public slug changes.
- **What would make this >=90%:**
  - Verified consumer map for every existing `book-private-accommodations` reference plus one successful redirect compatibility proof for a renamed top-level slug.
- **Rollout / rollback:**
  - Rollout: ship localized top-level slugs and redirect aliases together in the same release boundary.
  - Rollback: restore previous public slug aliases only if locale switching or canonical routing misresolves.
- **Documentation impact:**
  - Refresh route-localization contract artifact and redirect matrix with the final top-level canonical targets.
- **Notes / references:**
  - Requires scoped post-build QA loop on affected routes: targeted `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` for `/book`, apartment booking, legal pages, and guide tag pages after the build.
- **Build evidence (2026-03-06):**
  - Added `privateBooking` as a first-class localized route key in `apps/brikette/src/slug-map.ts`, `apps/brikette/src/types/slugs.ts`, and `apps/brikette/src/routing/sectionSegments.ts`, removing the hardcoded English apartment-booking route from the public contract.
  - Localized remaining top-level slug debt in `apps/brikette/src/slug-map.ts`:
    - booking: `/hi/aarakshan`, `/da/bestil`
    - legal: localized `privacyPolicy` / `cookiePolicy` slugs per non-English locale
    - house rules: localized `ja` + `ko`
    - guide tags: localized `it`
  - Centralized canonical top-level path generation via `apps/brikette/src/utils/localizedRoutes.ts` and replaced hardcoded booking/private-booking route emitters across app entry points and structured-data components.
  - Brought shared UI consumers and headers config into parity for the route contract:
    - `packages/ui/src/utils/buildNavLinks.ts`
    - `packages/ui/src/organisms/DesktopHeader.tsx`
    - `packages/ui/src/organisms/MobileNav.tsx`
    - `packages/ui/src/organisms/MobileMenu.tsx`
    - `apps/brikette/config/_headers`
  - Regenerated `apps/brikette/public/_redirects`; `pnpm --filter @apps/brikette exec tsx scripts/verify-url-coverage.ts` now reports:
    - `Cloudflare _redirects: verified (2553 localized rules)`
    - `Missing: 0`
    - `All legacy URLs are covered!`
  - Refreshed route-localization artifact via `verify-route-localization`; current route-family debt is:
    - top-level: `0`
    - nested segment: `0`
    - special route: `0`
    - room: `0`
    - guide: `495`
  - Validation:
    - `pnpm --filter @acme/ui typecheck`
    - `pnpm --filter @acme/ui lint`
    - `pnpm --filter @apps/brikette typecheck`
    - `pnpm --filter @apps/brikette lint` (`128 warnings / 0 errors`, existing baseline)

### TASK-13C: Localize dorm room detail slugs for non-English locales still using English
- **Type:** IMPLEMENT
- **Deliverable:** locale-appropriate dorm room detail slugs for currently English-fallback locales with reverse-lookup and legacy alias preservation
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:** `packages/ui/src/config/roomSlugs.ts`, `apps/brikette/src/app/[lang]/dorms/[id]/page.tsx`, `apps/brikette/src/routing/routeInventory.ts`, `apps/brikette/scripts/generate-static-export-redirects.ts`, `apps/brikette/public/_redirects`
- **Depends on:** TASK-13A
- **Blocks:** TASK-13E
- **Confidence:** 80%
  - Implementation: 75% - room slugs are centralized, but reverse lookup and redirect compatibility need careful handling.
  - Approach: 80% - this closes a visible public URL debt across high-intent room detail pages.
  - Impact: 85% - room-detail URLs are commercially important and indexable.
- **Acceptance:**
  - `ja`, `ko`, `zh`, `ar`, and `hi` no longer expose English dorm detail slugs for live room pages unless explicitly allowlisted.
  - `findRoomIdBySlug()` and static params continue to roundtrip correctly for localized slugs.
  - Old English room-detail aliases permanently redirect to the new localized URLs.
  - Expected user-observable behavior:
    - Non-English room detail pages show locale-appropriate room slugs in the browser URL.
    - Existing English room-detail links still resolve without dead ends.
- **Validation contract (TC-13C):**
  - TC-01: route-localization audit passes for room slugs in targeted locales.
  - TC-02: room slug forward and reverse lookup tests pass for old and new aliases.
  - TC-03: redirect coverage includes legacy English room-detail URLs for affected locales.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: consumer trace for `getRoomSlug()` and `findRoomIdBySlug()` across route generation, language switching, and room detail resolution.
  - Validation artifacts: route-localization contract artifact, room slug config, dorm route page.
  - Unexpected findings: some locales already rely on ASCII transliterations rather than native script, so the standard is locale-appropriate transliteration, not native-character slugs.
- **Scouts:** verify whether any room slugs are embedded in structured-data or sitemap outputs beyond route inventory.
- **Edge Cases & Hardening:** prevent slug collisions across room types and preserve canonical room resolution when language switching from old links.
- **What would make this >=90%:**
  - Collision scan and redirect compatibility proof for one targeted locale.
- **Rollout / rollback:**
  - Rollout: update room slugs and redirects atomically for all affected locales.
  - Rollback: restore previous room slugs only if reverse lookup or route resolution becomes ambiguous.
- **Documentation impact:**
  - Refresh route-localization contract artifact with final room-slug mappings.
- **Notes / references:**
  - Requires scoped post-build QA loop on room detail pages: targeted `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` for representative mobile and desktop room URLs.
- **Build evidence (2026-03-06):**
  - Localized all previously English-fallback dorm-room slugs in `packages/ui/src/config/roomSlugs.ts` for `ja`, `ko`, `zh`, `ar`, and `hi`.
  - Added generic legacy-English alias preservation in `packages/ui/src/config/roomSlugs.ts` via `getRoomSlugAliases()`, and updated `findRoomIdBySlug()` to resolve both canonical localized slugs and preserved English aliases.
  - Added canonical room-url enforcement in `apps/brikette/src/app/[lang]/dorms/[id]/page.tsx` using `permanentRedirect()` when a request resolves through a legacy alias instead of the localized canonical slug.
  - Added one-hop room-alias redirects in `apps/brikette/src/middleware.ts` for:
    - localized room alias paths
    - internal `/dorms/...` paths
    - legacy `/rooms/...` paths
  - Extended `apps/brikette/src/routing/staticExportRedirects.ts` to emit explicit room-alias redirects in `_redirects`; representative generated rules:
    - `/ja/heya/mixed-ensuite-dorm  /ja/heya/danjo-kongo-basu-tsuki-domitori  301`
    - `/ja/dorms/mixed-ensuite-dorm  /ja/heya/danjo-kongo-basu-tsuki-domitori  301`
    - `/ja/rooms/mixed-ensuite-dorm  /ja/heya/danjo-kongo-basu-tsuki-domitori  301`
  - Added regression coverage:
    - `packages/ui/src/config/__tests__/roomSlugs.test.ts`
    - `apps/brikette/src/test/middleware.test.ts`
  - Collision scan passed for the targeted locales:
    - `pnpm --filter @acme/ui exec tsx -e '...room-slug collision scan...'`
  - Route-localization artifact refreshed via `verify-route-localization`; `Unexpected room matches: 0`.
  - Validation:
    - `pnpm --filter @acme/ui typecheck`
    - `pnpm --filter @acme/ui lint`
    - `pnpm --filter @apps/brikette typecheck`
    - `pnpm --filter @apps/brikette lint` (`128 warnings / 0 errors`, existing baseline)

### TASK-13G: Map guide-slug fallback causes and alias-preservation contract
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-sales-funnel-analysis/artifacts/guide-slug-localization-map.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Pending
- **Affects:** `[readonly] apps/brikette/src/guides/slugs/slugs.ts`, `[readonly] apps/brikette/src/guides/slugs/labels.ts`, `[readonly] apps/brikette/src/guides/slugs/overrides.ts`, `[readonly] apps/brikette/src/routes.guides-helpers.ts`
- **Depends on:** TASK-13A
- **Blocks:** TASK-13D
- **Confidence:** 70%
  - Implementation: 75% - the current fallback logic and live guide set are enumerable.
  - Approach: 70% - the remaining uncertainty is cause classification and alias strategy, not whether the debt exists.
  - Impact: 85% - converts the lowest-confidence route-localization task into a bounded implementation contract.
- **Questions to answer:**
  - Which live non-English English-matching guide slugs are caused by placeholder labels versus intentional overrides versus transport terminology that should remain shared?
  - What alias-preservation strategy keeps existing indexed English-style guide URLs valid after localization?
  - Are there any slug collisions or resolver roundtrip risks in the target localized set?
- **Acceptance:**
  - Artifact classifies the remaining live English-matching guide slugs by cause.
  - Alias-preservation strategy is explicit enough for `TASK-13D` to implement without open-ended discovery.
  - `TASK-13D` rises to runnable confidence with scout uncertainty removed.
- **Validation contract:** artifact includes cause counts, representative examples, and the chosen alias-preservation contract with repo evidence.
- **Planning validation:** built from `guideSlug()`, `resolveGuideKeyFromSlug()`, and current live guide inventory counts.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** records the guide-specific implementation contract that `TASK-13D` must follow.
- **Notes / references:**
  - This task converts the guide-slug content dependency into a formal precursor chain.
- **Build evidence (2026-03-06):**
  - Produced artifact: `docs/plans/brikette-sales-funnel-analysis/artifacts/guide-slug-localization-map.md`
  - Cause classification for current live debt:
    - `explicit-override`: `495`
    - placeholder-label fallback: `0`
    - missing-label fallback: `0`
    - approved shared terminology: `0`
  - Concentration confirmed in transport/how-to-get-here guide families, plus small locale-specific assistance cases.
  - Alias risk recorded: `resolveGuideKeyFromSlug()` does not generically preserve historic slug aliases once canonical guide slugs change.
  - Acceptance: pass (`TASK-13D` now has a frozen cause map and alias-preservation contract).

### TASK-13D: Localize live guide/article slugs still falling back to English
- **Type:** IMPLEMENT
- **Deliverable:** live guide slug closure for non-English locales plus legacy alias/roundtrip preservation
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/brikette/src/guides/slugs/slugs.ts`, `apps/brikette/src/guides/slugs/labels.ts`, `apps/brikette/src/guides/slugs/overrides.ts`, `apps/brikette/src/routes.guides-helpers.ts`, `apps/brikette/src/app/[lang]/assistance/[article]/page.tsx`, `apps/brikette/src/app/[lang]/experiences/[slug]/page.tsx`, `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx`, `apps/brikette/scripts/generate-static-export-redirects.ts`, `apps/brikette/public/_redirects`
- **Depends on:** TASK-13A, TASK-13G
- **Blocks:** TASK-13E
- **Confidence:** 80%
  - Implementation: 75% - the surface area is large and content-linked, but the precursor map removes the open-ended discovery burden.
  - Approach: 80% - a targeted closure of remaining live English fallbacks is tractable once causes and alias strategy are frozen in TASK-13G.
  - Impact: 85% - guide URLs are a major share of localized organic surface area.
- **Acceptance:**
  - Non-English live guide slugs stop falling back to English except for an explicit, justified allowlist.
  - `resolveGuideKeyFromSlug()` continues to roundtrip localized canonical slugs.
  - Existing indexed English guide aliases remain reachable through permanent redirect or resolver compatibility.
  - Expected user-observable behavior:
    - Non-English help, experiences, and how-to-get-here guide URLs use locale-appropriate slugs.
    - Existing shared links to old English-style guide URLs still resolve cleanly.
- **Validation contract (TC-13D):**
  - TC-01: route-localization audit reports no unexpected English guide slug fallbacks for live guides.
  - TC-02: guide slug resolver tests pass for localized canonical slugs and legacy aliases.
  - TC-03: route inventory and redirect coverage continue to roundtrip for live guides after slug localization.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: consumer trace for `guideSlug()`, `guidePath()`, `resolveGuideKeyFromSlug()`, and guide navigation builders.
  - Validation artifacts: route-localization briefing, current guide slug generator, live guide inventory counts by locale.
  - Unexpected findings: roughly `29-30/119` live guide slugs per non-English locale still match English, concentrated in transport and logistics content.
- **Scouts:** `None: TASK-13G freezes fallback causes and alias-preservation strategy first`
- **Edge Cases & Hardening:** preserve roundtrip resolver behavior, avoid slug collisions, and keep already-indexed aliases valid.
- **What would make this >=90%:**
  - A per-locale cause breakdown of the remaining English-matching guide slugs plus a proven alias-preservation strategy.
- **Rollout / rollback:**
  - Rollout: localize guide slugs in one bounded tranche with alias preservation and refreshed route inventory.
  - Rollback: keep old alias-resolution support in place even if any localized slug set must be reverted.
- **Documentation impact:**
  - Refresh route-localization contract artifact with final guide-slug exceptions and removals.
- **Notes / references:**
  - Requires scoped post-build QA loop on representative `/assistance`, `/experiences`, and `/how-to-get-here` guide pages via targeted `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep`.
- **Build evidence (2026-03-07):**
  - Updated `apps/brikette/src/guides/slugs/slugs.ts` so non-English explicit overrides no longer pin the canonical slug when they merely repeat the English fallback slug.
  - Added guide alias preservation in `apps/brikette/src/guides/slugs/urls.ts`:
    - new `guideSlugAliases()` helper derives legacy aliases from superseded override values
    - `resolveGuideKeyFromSlug()` now resolves those legacy aliases in addition to canonical localized slugs and legacy compact key fallbacks
  - Re-exported the alias helper through:
    - `apps/brikette/src/guides/slugs/index.ts`
    - `apps/brikette/src/routes.guides-helpers.ts`
  - Added edge redirect coverage for superseded guide slugs in `apps/brikette/src/routing/staticExportRedirects.ts`, including both localized public bases and internal guide-base aliases.
  - Representative redirect coverage generated into `apps/brikette/public/_redirects`:
    - `/ja/akusesu/amalfi-positano-bus  /ja/akusesu/amaruhuikarapozita-nohebasu-hosuteruburiketute  301`
    - `/ja/how-to-get-here/amalfi-positano-bus  /ja/akusesu/amaruhuikarapozita-nohebasu-hosuteruburiketute  301`
  - Added regression coverage:
    - `apps/brikette/src/test/utils/guide-url-resolver.test.ts`
    - `apps/brikette/src/test/routing/staticExportRedirects.test.ts`
  - Source-side guide debt reduced to zero:
    - `pnpm --filter @apps/brikette exec tsx -e '...englishMatches=0...'`
  - Formal route-localization audit now passes with:
    - top-level: `0`
    - nested segment: `0`
    - special route: `0`
    - room: `0`
    - guide: `0`
  - Validation:
    - `pnpm --filter @apps/brikette typecheck`
    - `pnpm --filter @apps/brikette lint` (`128 warnings / 0 errors`, existing baseline)
    - targeted ESLint on changed guide-slug files (pass)
    - `pnpm --filter @apps/brikette run verify-route-localization` (pass)
    - `pnpm --filter @apps/brikette exec tsx scripts/verify-url-coverage.ts` (pass; `4533 localized rules`, `Missing: 0`)

### TASK-13E: Route-localization checkpoint + final canonical target refresh
- **Type:** CHECKPOINT
- **Deliverable:** updated plan confidence, refreshed localized canonical target map, and resequenced live redirect verification via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Affects:** `docs/plans/brikette-sales-funnel-analysis/plan.md`, `docs/plans/brikette-sales-funnel-analysis/artifacts/production-redirect-matrix.md`, `docs/plans/brikette-sales-funnel-analysis/artifacts/route-localization-contract.md`
- **Depends on:** TASK-13B, TASK-13C, TASK-13D
- **Blocks:** TASK-08C
- **Confidence:** 95%
  - Implementation: 95% - checkpoint process is defined.
  - Approach: 95% - prevents external redirect rollout against stale canonical targets.
  - Impact: 95% - ensures route-localization and Cloudflare convergence are joined cleanly.
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - `/lp-do-replan` run on downstream redirect verification tasks
  - final localized canonical target map recorded in `production-redirect-matrix.md`
  - `TASK-08C` and `TASK-08D` references updated against the final localized contract
- **Horizon assumptions to validate:**
  - Route-localization implementation did not introduce unresolved redirect or resolver collisions.
  - The final canonical public route contract is stable enough to roll into external Cloudflare routing once.
- **Validation contract:** checkpoint note includes confidence deltas, refreshed canonical targets, and any remaining explicit allowlist exceptions.
- **Planning validation:** references TASK-13A through TASK-13D outputs.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** refreshes the redirect matrix and final route-localization contract before live rollout.
- **Build evidence (2026-03-07):**
  - Route-localization tranche is now closed in-repo:
    - `TASK-13B` complete
    - `TASK-13C` complete
    - `TASK-13D` complete
  - Refreshed localized canonical contract artifacts:
    - `docs/plans/brikette-sales-funnel-analysis/artifacts/route-localization-contract.md`
    - `docs/plans/brikette-sales-funnel-analysis/artifacts/production-redirect-matrix.md`
  - Updated downstream readiness:
    - `TASK-08C` now waits on the final localized contract recorded after `TASK-13A` through `TASK-13D`.
    - `TASK-08D` remains blocked behind the external Cloudflare rollout.
  - Validation evidence reused from tranche closure:
    - `verify-route-localization` passes with zero unexpected matches across all route families.
    - `verify-url-coverage` passes with zero missing legacy URLs after the final contract refresh.

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
- **Blocks:** TASK-09B
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
- **Blocks:** -
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
- **Blocks:** -
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
- **Status:** Blocked (2026-03-06)
- **Affects:** `docs/plans/brikette-sales-funnel-analysis/plan.md`
- **Depends on:** TASK-08D
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
  - CHECKPOINT gate not runnable because dependency `TASK-08D` remains blocked pending TASK-08C live Cloudflare redirect convergence.
  - `/lp-do-replan` round 2 split the previous blended `TASK-08` into `TASK-08A/TASK-08B/TASK-08C/TASK-08D`, isolating the remaining blocker to external routing implementation plus live verification.
  - `/lp-do-plan` on 2026-03-06 inserted `TASK-13A/TASK-13B/TASK-13C/TASK-13D/TASK-13E` ahead of `TASK-08C` after the route-localization briefing showed the public canonical route contract is not yet fully localized.
  - `/lp-do-replan` on 2026-03-06 added `TASK-13F` and `TASK-13G` as formal precursors so top-level route policy ambiguity and guide-fallback ambiguity are no longer carried as inline scout notes.

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
  - Mitigation: TASK-08B freezes the current redirect matrix, TASK-13E refreshes it against the final localized contract, TASK-08C applies the live Cloudflare change, and TASK-08D verifies one-hop redirects plus canonical `200` targets before completion.
- Non-English canonical routes remain partially English and normalize the wrong public contract into production.
  - Mitigation: TASK-13A adds a deterministic audit gate, TASK-13B/TASK-13C/TASK-13D remove known route-family leaks, and TASK-13E refreshes final canonical targets before external rollout.

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
- [ ] Non-English canonical public routes no longer expose unintended English slugs outside an explicit allowlist.
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
- 2026-03-06: `/lp-do-replan` round 2 split blended `TASK-08` into `TASK-08A` (app SEO closure), `TASK-08B` (redirect inventory), `TASK-08C` (external Cloudflare implementation), and `TASK-08D` (live verification gate) so the remaining blocker is operationally precise.
- 2026-03-06: `/lp-do-plan` inserted a route-localization tranche (`TASK-13A` through `TASK-13E`) before `TASK-08C` so production redirect convergence targets the final localized public route contract rather than the pre-audit URL set.
- 2026-03-06: `/lp-do-replan` added `TASK-13F` (top-level policy/allowlist + apartment consumer map) and `TASK-13G` (guide fallback cause map + alias strategy) so `TASK-13B` and `TASK-13D` have explicit precursor chains instead of unresolved scout ambiguity.

## Overall-confidence Calculation
- Effort weights: S=1, M=2, L=3
- Sum(confidence * weight) = 3740
- Sum(weight) = 47
- Overall-confidence = 3740 / 47 = 79.6% -> 80%

## Critique Loop
- Input source: operator critique (2026-03-01) applied as hardening pass.
- Main changes incorporated:
  - Added cold-state continuity acceptance and best-effort continuity wording.
  - Split overloaded enforcement and analytics tasks.
  - Added CI-first feedback harness task to align with CI-only execution posture.
  - Added SEO indexation matrix artifact deliverable.
  - Moved indicative fallback to ship with auto-seed removal.
  - Scoped recovery MVP to email-only pending channel readiness.
  - Inserted a route-localization audit-and-fix tranche before live Cloudflare convergence so public non-English canonical URLs are finalized before production redirect rollout.
  - Converted unresolved route-localization scout ambiguity into formal precursor tasks (`TASK-13F`, `TASK-13G`) to satisfy replan gates.
- Remaining known unknowns:
  - Octobook post-handoff constraint enforcement capability (TASK-01).
  - Click-id export persistence (TASK-02).
  - Any final shared-spelling exceptions accepted after `TASK-13F` and `TASK-13G` evidence is gathered.

## Section Omission Rule
None: all plan template sections are applicable.
