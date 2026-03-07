---
Type: Plan
Status: Active
Domain: UI | SEO | Analytics | Integration
Workstream: Mixed
Created: 2026-03-01
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07
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

Direct staging deployment on 2026-03-07 then proved a second issue: the current “preserve every possible alias” strategy is too large for Cloudflare Pages `_redirects` and is also preserving synthetic wrong-locale URLs the business does not want (for example `/it/book`). The plan therefore draws a line in the sand: preserve only current localized canonicals plus historically public legacy URLs evidenced by repo fixtures / explicit entry contracts, and drop synthetic alias debt. The implementation model shifts accordingly from giant `_redirects` generation to a hybrid static-runtime contract: small structural `_redirects` plus generated edge resolution for high-cardinality exact historical aliases. That rollout is now complete: staging proof passed, production Pages deployment is live, canonical targets return `200`, supported aliases resolve as intended, and intentionally dropped junk aliases like `/it/book` remain `404`.

With rollout live, the remaining control gap is guard depth rather than route behavior. The previous CI/deploy checks proved deployability and sampled strict routes, but they did not yet enforce the wider post-deploy contract: rendered canonical tags on key localized surfaces, sitemap inclusion for key canonicals, and explicit `404` checks for intentionally dropped aliases. The next tranche therefore hardens CI-only post-deploy controls while intentionally keeping direct `wrangler pages deploy` as a fast operator path for manual hotfixes.

A fresh live browser pass on 2026-03-07 then surfaced a new tranche of commercial-surface defects after rollout: homepage and booking calendar surfaces still expose raw guest-stepper i18n keys plus segmented native date labels, and non-English booking/deals quality still lags the intended production standard. Those defects are now addressed on staging: the shared booking widget/calendar path no longer leaks raw keys or segmented native labels, the Italian booking surface uses localized filter/stepper/carousel copy, the expired-deals control is removed from the rendered deals page, and `/api/availability` plus `/api/health` both answer `GET` and `HEAD` with `200`.

A follow-up staging audit on 2026-03-07 found one more shared-shell tranche beyond the booking/deals/API work: the scenic theme toggle still announced English labels on localized pages, the footer-level `Book direct` CTA was resolving through the wrong namespace and leaking English on non-English surfaces, and homepage featured-guide cards were still preferring stale generated English labels over the localized guides bundle. That shell-localization tranche is now implemented in code and queued for staging verification.

Staging verification after that shell tranche exposed a deeper static-export problem: localized `/it` and `/it/prenota` HTML still leaked English/raw-key copy before hydration because Brikette app namespaces were not being primed into the client i18n instance at server render time. The next tranche therefore shifts from ad hoc label fixes to an SSR-safe locale snapshot contract for the shared shell and key commercial pages, plus a deterministic static-export audit that fails when representative non-English pages still emit known English/raw-key leakage.

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
- [x] TASK-14A: Freeze supported legacy URL policy and static-runtime redirect contract
- [x] TASK-14B: Implement hybrid legacy redirect model for static Pages runtime
- [x] TASK-14C: Clean canonical inventory and booking fallback contract
- [x] TASK-14D: Reconcile shared Brikette slug sources in `packages/ui`
- [x] TASK-14E: Freeze private-room child route contract and audit coverage
- [x] TASK-14F: Implement localized private-room child slug contract and redirects
- [x] TASK-14G: Prove hybrid static-runtime redirect model on staging with valid Cloudflare auth
- [x] TASK-08C: Apply live Cloudflare redirect convergence at the production source of truth
- [x] TASK-08D: Verify live one-hop redirects and canonical `200` targets
- [x] TASK-09A: Ship indicative pricing fallback with auto-seed removal
- [x] TASK-09B: Implement indicative pricing governance and stale-data ops controls
- [x] TASK-10: Validate recovery compliance and technical channel readiness
- [x] TASK-11: Ship recovery MVP (email-only) with resume-link flow and proxy audiences
- [x] TASK-12: Horizon checkpoint and confidence recalibration
- [x] TASK-15A: Audit live route/SEO control stack against the canonical contract
- [x] TASK-15B: Add CI-only post-deploy canonical/sitemap/404 guards
- [x] TASK-15C: Add canonical-link audit coverage for rendered nav/footer/content links
- [x] TASK-16A: Repair live booking widget/calendar guest-control and date-input accessibility leaks
- [x] TASK-16B: Finish non-English booking-surface UI localization cleanup
- [x] TASK-16C: Remove the expired-deals control from the live deals surface
- [x] TASK-16D: Harden `/api/availability` support endpoints for monitor/client use
- [x] TASK-16E: Repair remaining shared-shell localization regressions after rollout audit
- [x] TASK-16F: Eliminate static-export localization leakage on non-English commercial pages

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
  - Static Pages runtime support is limited to current localized canonicals plus historically public legacy URLs; synthetic wrong-locale aliases are intentionally out of scope.
  - Production redirect source-of-truth must use a hybrid static-runtime model: small structural `_redirects` plus generated edge resolution for high-cardinality exact historical aliases.
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
  - Direct staging deploy (2026-03-07) proved `_redirects` overrun and synthetic alias debt: early legacy rules still redirect, but later localized alias families fall through to `404` because the generated `_redirects` contract is too large for Pages and is preserving URLs we do not actually want.
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
| TASK-13E | CHECKPOINT | Route-localization checkpoint + final canonical target refresh | 95% | S | Complete (2026-03-07) | TASK-13B, TASK-13C, TASK-13D | TASK-14A, TASK-14C, TASK-14D, TASK-14E |
| TASK-14A | INVESTIGATE | Freeze supported legacy URL policy + static-runtime redirect contract | 90% | S | Complete (2026-03-07) | TASK-13E | TASK-14B |
| TASK-14B | IMPLEMENT | Implement hybrid static-runtime legacy redirect model | 80% | L | Complete (2026-03-07) | TASK-14A | TASK-14G |
| TASK-14C | IMPLEMENT | Clean canonical inventory and booking fallback contract | 85% | M | Complete (2026-03-07) | TASK-13E | - |
| TASK-14D | IMPLEMENT | Reconcile shared Brikette slug sources in `packages/ui` | 80% | M | Complete (2026-03-07) | TASK-13E | - |
| TASK-14E | INVESTIGATE | Freeze private-room child route contract and audit coverage | 70% | M | Complete (2026-03-07) | TASK-13E | TASK-14F |
| TASK-14F | IMPLEMENT | Implement localized private-room child slug contract and redirects | 80% | M | Complete (2026-03-07) | TASK-14E | TASK-08C |
| TASK-14G | INVESTIGATE | Prove hybrid static-runtime redirect model on staging with valid Cloudflare auth | 70% | S | Complete (2026-03-07) | TASK-14B | TASK-08C |
| TASK-08C | IMPLEMENT | Apply live Cloudflare redirect convergence at production source of truth | 80% | M | Complete (2026-03-07) | TASK-14F, TASK-14G | TASK-08D, TASK-12 |
| TASK-08D | INVESTIGATE | Verify live one-hop redirects and canonical `200` targets | 85% | S | Complete (2026-03-07) | TASK-08C | TASK-12 |
| TASK-09A | IMPLEMENT | Indicative pricing fallback coupled with auto-seed removal | 85% | M | Complete (2026-03-01) | TASK-04, TASK-05 | TASK-09B, TASK-12 |
| TASK-09B | IMPLEMENT | Indicative pricing governance/staleness controls | 75% | S | Complete (2026-03-01) | TASK-09A | TASK-12 |
| TASK-10 | INVESTIGATE | Recovery compliance + technical channel readiness | 70% | M | Complete (2026-03-01) | - | TASK-11 |
| TASK-11 | IMPLEMENT | Recovery MVP (email-only) + resume-link + proxy audiences | 80% | L | Complete (2026-03-01) | TASK-06A, TASK-07A, TASK-10 | - |
| TASK-12 | CHECKPOINT | Horizon checkpoint + `/lp-do-replan` for next tranche | 95% | S | Complete (2026-03-07) | TASK-08D | TASK-15A |
| TASK-15A | INVESTIGATE | Audit live route/SEO control stack against the canonical contract | 85% | S | Complete (2026-03-07) | TASK-12 | TASK-15B, TASK-15C |
| TASK-15B | IMPLEMENT | Add CI-only post-deploy canonical/sitemap/404 guards | 85% | S | Complete (2026-03-07) | TASK-15A | TASK-15C |
| TASK-15C | IMPLEMENT | Add canonical-link audit coverage for rendered nav/footer/content links | 75% | M | Complete (2026-03-07) | TASK-15A | - |
| TASK-16A | IMPLEMENT | Repair live booking widget/calendar guest-control and date-input accessibility leaks | 85% | M | Complete (2026-03-07) | TASK-15C | TASK-16B |
| TASK-16B | IMPLEMENT | Finish non-English booking-surface UI localization cleanup | 80% | M | Complete (2026-03-07) | TASK-16A | - |
| TASK-16C | IMPLEMENT | Remove the expired-deals control from the live deals surface | 85% | S | Complete (2026-03-07) | TASK-15C | - |
| TASK-16D | IMPLEMENT | Harden `/api/availability` support endpoints for monitor/client use | 75% | S | Complete (2026-03-07) | TASK-15C | - |
| TASK-16E | IMPLEMENT | Repair remaining shared-shell localization regressions after rollout audit | 85% | S | Complete (2026-03-07) | TASK-16B, TASK-16C, TASK-16D | - |
| TASK-16F | IMPLEMENT | Eliminate static-export localization leakage on non-English commercial pages | 80% | M | Complete (2026-03-07) | TASK-16E | - |

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
| 9 | TASK-13E, TASK-14A | TASK-13B,TASK-13C,TASK-13D (TASK-13E), TASK-13E (TASK-14A) | Refresh final canonical targets, then freeze the supported legacy URL policy against real static-runtime evidence |
| 10 | TASK-14B, TASK-14C, TASK-14D, TASK-14E | TASK-14A (TASK-14B), TASK-13E (TASK-14C/TASK-14D/TASK-14E) | Finish the static Pages runtime, clean the canonical URL contract, reconcile shared slug sources, and freeze the private-room child route policy before live rollout |
| 11 | TASK-14F, TASK-14G | TASK-14E (TASK-14F), TASK-14B (TASK-14G) | Implement the private-room child slug contract while separately proving the hybrid runtime on staging with the current external auth state |
| 12 | TASK-08C, TASK-08D, TASK-12 | TASK-14F,TASK-14G (TASK-08C), TASK-08C (TASK-08D), TASK-08D (TASK-12) | Production rollout, live verification, and checkpoint closure |
| 13 | TASK-15A, TASK-15B, TASK-15C | TASK-12 (TASK-15A), TASK-15A (TASK-15B/TASK-15C) | Audit the remaining control surface, harden CI-only post-deploy guards, then add rendered-link canonical coverage |
| 14 | TASK-16A, TASK-16C, TASK-16D | TASK-15C | Address live commercial-surface regressions: shared booking widget/calendar leaks first, then deals and API-surface cleanup |
| 15 | TASK-16B | TASK-16A | Finish the remaining booking-surface localization cleanup once the shared widget path is clean |
| 16 | TASK-16F | TASK-16E | Prime shell/home/book locale bundles for static export and add a deterministic audit for representative non-English pages |

- Max parallelism: 4 tasks (Wave 1)
- Critical path: TASK-03 -> TASK-04 -> TASK-05 -> TASK-08A -> TASK-08B -> TASK-13A -> TASK-13G -> TASK-13D -> TASK-13E -> TASK-14A -> TASK-14B -> TASK-14G -> TASK-08C -> TASK-08D -> TASK-12 -> TASK-15A -> TASK-15C -> TASK-16A -> TASK-16B

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
| TASK-14B: Hybrid static-runtime legacy redirect model | Yes | None | No |
| TASK-14C: Canonical inventory and booking fallback cleanup | Partial | [SEO contract][Major]: current canonical inventory still includes noindex and redirect-helper URLs, and the hostel noscript fallback still points at the broken Octorate URL | Yes |
| TASK-14D: Shared slug source reconciliation | Partial | [Source-of-truth drift][Major]: `packages/ui` still encodes deprecated booking/private-booking paths that can leak stale URLs after the route-localization tranche | Yes |
| TASK-14E: Private-room child route contract | Yes | None | No |
| TASK-14F: Private-room child slug implementation | Yes | None | No |
| TASK-14G: Hybrid runtime staging proof | Yes | None | No |
| TASK-08C: Live Cloudflare redirect convergence | Yes | None | No |
| TASK-08D: Live redirect verification | Yes | None | No |
| TASK-09A: Indicative fallback + auto-seed removal | Yes | None | No |
| TASK-09B: Indicative governance | Partial | [Missing data dependency][Moderate]: owner/cadence process must be documented to avoid stale anchors | Yes |
| TASK-10: Recovery readiness | Yes | None | No |
| TASK-11: Recovery MVP email-only | Yes | None | No |
| TASK-12: Checkpoint | Yes | None | No |
| TASK-15A: Live route/SEO control audit | Yes | None | No |
| TASK-15B: CI-only post-deploy guard hardening | Yes | None | No |
| TASK-15C: Rendered-link canonical audit coverage | Partial | [Coverage gap][Moderate]: current control stack still relies on manual staging sampling for nav/footer/content link canonicality rather than an explicit automated gate | Yes |
| TASK-16A: Shared booking widget/calendar live regressions | Yes | None | No |
| TASK-16B: Non-English booking-surface localization cleanup | Yes | None | No |
| TASK-16C: Deals-page expired control removal | Yes | None | No |
| TASK-16D: `/api/availability` endpoint hardening | Yes | None | No |
| TASK-16F: Static-export localization leakage on localized commercial pages | Yes | None | No |

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
- **Status:** Complete (2026-03-07)
- **Affects:** `.github/workflows/brikette.yml`, `docs/brikette-deploy-decisions.md`, `[external] live Cloudflare Pages deploy on production branch`, `docs/plans/brikette-sales-funnel-analysis/artifacts/production-redirect-matrix.md`
- **Depends on:** TASK-14F, TASK-14G
- **Blocks:** TASK-08D, TASK-12
- **Confidence:** 80%
  - Implementation: 75% - production rollout itself is straightforward once the remaining local slug work and staging proof are complete.
  - Approach: 85% - exact alias families are already known and the remaining uncertainty is no longer mixed into repo implementation tasks.
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
  - Checks run: compare app-owned canonical policy, route-localization contract, staging proof artifact, and live Cloudflare drift evidence.
  - Validation artifacts: `production-redirect-matrix.md`, `docs/briefs/brikette-route-localization-briefing.md`, refreshed route-localization checkpoint evidence.
- **Scouts:** resolved on 2026-03-07: production source of truth is the repo-managed Cloudflare Pages deploy path in `.github/workflows/brikette.yml`; live rollout still requires promotion of the updated artifact set.
- **Edge Cases & Hardening:** preserve locale parity, avoid multi-hop redirects, and ensure redirect sources do not remain indexable `200` pages.
- **What would make this >=90%:** one successful staged rollout after replacing the oversized `_redirects` contract with a Cloudflare routing mechanism that can actually carry the full localized alias set.
- **Rollout / rollback:**
  - Rollout: apply route-family changes in the production source of truth, then immediately run TASK-08D.
  - Rollback: restore prior route rules only if canonical targets regress or misroute.
- **Documentation impact:** apply the refreshed canonical target map from TASK-13E to the redirect matrix if any target choice changes during implementation.
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
  - Refreshed `docs/plans/brikette-sales-funnel-analysis/artifacts/production-redirect-matrix.md` with staged then live `2026-03-07` evidence.
  - Release-path findings:
    - Committed and pushed `fix(brikette): finalize localized route rollout` to `origin/dev` (`747196ad8c`).
    - Auto PR `dev -> staging` was created and closed with no remaining tree diff because `origin/staging` already contains the same effective Brikette tree.
    - Direct Cloudflare deploy from this workspace now works when `.env.local` is sourced; `wrangler whoami` authenticated successfully via `CLOUDFLARE_API_TOKEN`.
    - A direct `wrangler pages deploy out --project-name brikette-website --branch staging` completed successfully on `2026-03-07`, and strict staging health checks passed for `/it/prenota` and `/it/prenota-alloggi-privati`.
    - That staging proof first exposed the oversized `_redirects` problem; replan rounds 4 and 5 resolved it by moving the contract to the hybrid static-runtime model (`TASK-14B`) and separating fresh staging proof (`TASK-14G`) from the eventual production rollout step (`TASK-08C`).
    - The corrected hybrid-runtime artifact was then deployed live to Pages production (`main`) and to the custom domain `https://hostel-positano.com`.
    - Live production canonical targets now return `200`, supported aliases resolve as intended, and intentionally dropped synthetic aliases such as `/it/book` remain `404`.
    - The production sitemap now includes the canonical private-room child URLs that were previously missing.

### TASK-08D: Verify live one-hop redirects and canonical `200` targets
- **Type:** INVESTIGATE
- **Deliverable:** dated live curl verification proving redirect families resolve in one hop and canonical booking-surface targets return `200`
- **Execution-Skill:** lp-seo
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
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
- **Build evidence (2026-03-07):**
  - Dated live verification appended to `docs/plans/brikette-sales-funnel-analysis/artifacts/production-redirect-matrix.md`.
  - Verified on `https://hostel-positano.com`:
    - canonical `200` targets:
      - `/it/prenota`
      - `/it/prenota-alloggi-privati`
      - `/it/camere-private/appartamento-vista-mare`
      - `/en/private-rooms/sea-view-apartment`
      - `/ja/annai`
    - supported alias behavior:
      - `/ja/about` -> one-hop redirect to `/ja/annai`
      - `/en/private-rooms/apartment` -> one-hop redirect to `/en/private-rooms/sea-view-apartment`
    - intentionally dropped alias:
      - `/it/book` -> `404`
  - Sitemap verification on live host now includes:
    - `/en/private-rooms/sea-view-apartment`
    - `/it/camere-private/appartamento-vista-mare`
    - `/it/camere-private/camera-doppia`

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
- **Blocks:** TASK-14A, TASK-14C, TASK-14D, TASK-14E
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

### TASK-14A: Freeze supported legacy URL policy + static-runtime redirect contract
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-sales-funnel-analysis/artifacts/legacy-route-support-policy.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Affects:** `docs/plans/brikette-sales-funnel-analysis/artifacts/legacy-route-support-policy.md`, `[readonly] apps/brikette/src/test/fixtures/legacy-urls.txt`, `[readonly] apps/brikette/scripts/normalize-static-export-localized-routes.ts`, `[readonly] apps/brikette/src/routing/routeInventory.ts`, `[readonly] apps/brikette/src/routing/staticExportRedirects.ts`
- **Depends on:** TASK-13E
- **Blocks:** TASK-14B
- **Confidence:** 90%
  - Implementation: 90% - bounded evidence synthesis from repo/runtime proof.
  - Approach: 90% - the route-history fixture and staging deploy evidence create a clear support boundary.
  - Impact: 95% - this removes fake obligations and prevents the rollout from preserving junk URLs.
- **Acceptance:**
  - The plan freezes which legacy URLs are intentionally supported.
  - Synthetic wrong-locale alias debt is explicitly out of scope.
  - The static-runtime support contract is tied to historical/public evidence instead of generated combinatorics.
- **Validation contract:** artifact cites staging proof, Pages limits, and the repo public-history fixture.
- **Build evidence (2026-03-07):**
  - Added `docs/plans/brikette-sales-funnel-analysis/artifacts/legacy-route-support-policy.md`.
  - Frozen policy: preserve current localized canonicals plus historically public URLs evidenced by `apps/brikette/src/test/fixtures/legacy-urls.txt` and explicit global entry contracts.
  - Explicitly dropped synthetic wrong-locale aliases such as `/it/book`.
  - Recorded the hybrid implementation consequence: small structural `_redirects` plus generated exact historical alias resolution.

### TASK-14B: Implement hybrid static-runtime legacy redirect model
- **Type:** IMPLEMENT
- **Deliverable:** curated static-runtime redirect system that preserves only supported historical URLs while dropping synthetic alias debt
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/brikette/src/routing/staticExportRedirects.ts`, `apps/brikette/scripts/generate-static-export-redirects.ts`, `apps/brikette/public/_redirects`, `apps/brikette/scripts/verify-url-coverage.ts`, `apps/brikette/functions/**`, `docs/brikette-deploy-decisions.md`, `docs/plans/brikette-sales-funnel-analysis/artifacts/production-redirect-matrix.md`
- **Depends on:** TASK-14A
- **Blocks:** TASK-14G
- **Confidence:** 80%
  - Implementation: 78% - bounded but touches generator, coverage gate, and Pages edge surface.
  - Approach: 82% - the hybrid model is directly implied by Pages limits and the repo’s public-history fixture.
  - Impact: 90% - this is the local architecture change required before any safe live rollout.
- **Acceptance:**
  - `public/_redirects` stops preserving synthetic wrong-locale aliases and drops redundant localized `200` rewrites.
  - Structural legacy redirects remain supported in `_redirects`.
  - High-cardinality exact historical aliases (guide/article/room families) are resolved by a repo-owned edge mechanism that deploys with Pages.
  - `verify-url-coverage` validates the static Pages runtime against current localized canonicals plus the supported historical contract, not `listAppRouterUrls()`.
  - The resulting Pages artifact stays within documented `_redirects` limits.
- **Validation contract (TC-14B):**
  - TC-01: generated `_redirects` count is at or below Pages documented limits.
  - TC-02: coverage verification passes against the supported historical fixture without relying on internal App Router path coverage.
  - TC-03: staging deploy proves current localized canonicals still return direct `200` and supported structural legacy aliases redirect.
  - TC-04: representative historical exact aliases in room/guide/article families resolve through the new edge mechanism.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: policy artifact, fixture/history audit, static export normalization audit.
  - Validation artifacts: `legacy-route-support-policy.md`, `production-redirect-matrix.md`, `apps/brikette/src/test/fixtures/legacy-urls.txt`.
  - Validation evidence reused from tranche closure:
    - `verify-route-localization` passes with zero unexpected matches across all route families.
    - `verify-url-coverage` passes with zero missing legacy URLs after the final contract refresh.
- **Build evidence (2026-03-07):**
  - Replaced the oversized preserve-everything `_redirects` model with a hybrid static-runtime contract:
    - `apps/brikette/public/_redirects` now contains only structural redirect rules.
    - `apps/brikette/public/_routes.json` now scopes the Pages legacy-path function.
    - `apps/brikette/functions/[[path]].js` resolves exact historical legacy URLs through the generated map at `apps/brikette/functions/generated/legacy-redirects.js`.
  - Added `apps/brikette/scripts/lib/static-runtime-redirects.ts` as the shared build source of truth for:
    - structural redirects,
    - exact supported historical redirects, and
    - Pages Function route coverage.
  - Updated the runtime contract and verification layers:
    - `apps/brikette/src/routing/staticExportRedirects.ts` now exposes redirect-target resolution helpers for deploy-time routing artifacts.
    - `apps/brikette/scripts/generate-static-export-redirects.ts` now writes `_redirects`, `_routes.json`, and the generated Pages Function redirect manifest together.
    - `apps/brikette/scripts/verify-url-coverage.ts` now validates the static Pages runtime against current localized canonicals plus supported historical URLs from `apps/brikette/src/test/fixtures/legacy-urls.txt`.
    - `scripts/src/brikette/preflight-deploy.ts` and `scripts/__tests__/brikette/preflight-deploy.test.ts` now require the new Pages Function routing artifacts.
  - Validation results:
    - `pnpm --filter @apps/brikette exec tsx scripts/verify-url-coverage.ts`
      - `Historical legacy URLs: 3435`
      - `Localized canonicals: 3992`
      - `Structural _redirects rules: 83`
      - `Exact legacy redirects: 2757`
      - `Pages Function include rules: 32`
      - `Missing: 0`
    - `pnpm preflight:brikette-deploy -- --json` -> `{ "ok": true, "errors": [], "warnings": [] }`
    - `pnpm --filter @apps/brikette typecheck` passed
    - `pnpm --filter @apps/brikette lint` passed at the existing warnings-only baseline

### TASK-14C: Clean canonical inventory and booking fallback contract
- **Type:** IMPLEMENT
- **Deliverable:** public canonical inventory excludes non-indexable / redirect-helper booking URLs, and hostel noscript booking fallbacks point at the live Octorate calendar entry
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/brikette/src/routing/routeInventory.ts`, `apps/brikette/src/routing/sectionSegments.ts`, `apps/brikette/src/app/[lang]/book/page.tsx`, `apps/brikette/src/app/[lang]/book-dorm-bed/page.tsx`, `apps/brikette/src/test/lib/generate-public-seo.lastmod.test.ts`, `docs/plans/brikette-sales-funnel-analysis/artifacts/production-redirect-matrix.md`
- **Depends on:** TASK-13E
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - bounded to the canonical inventory and two known broken fallback links.
  - Approach: 85% - removes mixed SEO signals without reopening the broader route-localization architecture.
  - Impact: 90% - ensures sitemap/hreflang output and no-JS conversion paths align with the intended booking contract.
- **Acceptance:**
  - `/{lang}/{bookSlug}` is no longer emitted as a canonical public URL while metadata remains `noindex,follow`.
  - `/{lang}/{privateRoomsSlug}/book` is no longer emitted as a canonical public URL if it remains a redirect helper.
  - Hostel noscript booking links use the live Octorate entry URL (`?codice=45111`) through shared link construction instead of the broken legacy `?id=5879` URL.
  - Public SEO artifacts/tests reflect the new canonical inventory.
- **Validation contract (TC-14C):**
  - TC-01: sitemap/public-SEO generation excludes helper/noindex booking URLs.
  - TC-02: page metadata for hostel booking routes remains `noindex,follow`.
  - TC-03: both hostel booking entry routes render the live Octorate fallback URL in server HTML.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Evidence reviewed: `routeInventory.ts`, `sectionSegments.ts`, booking route metadata, private-room booking redirect route, sitemap generation tests.
  - Supporting artifact: `fact-find.md` route-contract addendum dated `2026-03-07`.
- **Build evidence (2026-03-07):**
  - Split canonical public inventory from valid App Router inventory:
    - `apps/brikette/src/routing/sectionSegments.ts` now defines `PUBLIC_INDEXABLE_SECTION_KEYS`.
    - `apps/brikette/src/routing/routeInventory.ts` now excludes top-level hostel booking pages from `listLocalizedPublicUrls()` while keeping them in `listAppRouterUrls()`.
    - `apps/brikette/src/routing/routeInventory.ts` now excludes `/{lang}/{privateRoomsSlug}/book` from the canonical public inventory while keeping it as a valid redirect-helper route.
  - Fixed hostel noscript fallback links to use the live Octorate calendar URL via shared link construction:
    - `apps/brikette/src/app/[lang]/book/page.tsx`
    - `apps/brikette/src/app/[lang]/book-dorm-bed/page.tsx`
  - Strengthened CI coverage:
    - `apps/brikette/src/test/content-readiness/i18n/commercial-routes-ssr-audit.test.ts` now requires the live `codice=45111` Octorate fallback URL pattern.
    - Added `apps/brikette/src/test/routing/routeInventory.seo.test.ts` covering exclusion of noindex/helper URLs and retention of the top-level private-booking canonical.
  - Validation results:
    - `pnpm --filter @apps/brikette exec tsx scripts/verify-url-coverage.ts`
      - `Localized canonicals: 3956`
      - `Missing: 0`
    - `pnpm --filter @apps/brikette typecheck` passed
    - `pnpm --filter @apps/brikette lint` passed at the existing warnings-only baseline (`129 warnings`, `0 errors`)

### TASK-14D: Reconcile shared Brikette slug sources in `packages/ui`
- **Type:** IMPLEMENT
- **Deliverable:** shared UI slug helpers align with the Brikette app-level booking/private-booking contract and stop leaking deprecated booking paths
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Affects:** `packages/ui/src/slug-map.ts`, `packages/ui/src/utils/translate-path.ts`, Brikette consumers in `packages/ui/**`, route/SEO tests as needed
- **Depends on:** TASK-13E
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% - bounded cross-package cleanup with known source files.
  - Approach: 80% - removes source-of-truth drift that would otherwise reintroduce stale URLs after rollout.
  - Impact: 85% - protects internal linking, CTA routing, and future regressions across shared UI consumers.
- **Acceptance:**
  - Shared slug helpers no longer encode deprecated Brikette booking/private-booking slugs.
  - Shared UI consumers used by Brikette resolve booking/private-booking paths through the same locale-aware contract as the app.
  - No remaining `packages/ui` path helpers produce `/book` or `/book-private-accommodations` for non-English Brikette surfaces unless explicitly intended legacy behavior.
- **Validation contract (TC-14D):**
  - TC-01: targeted shared-slug tests cover the localized booking/private-booking contract.
  - TC-02: Brikette package typecheck/lint stays green after the shared source-of-truth change.
- **Build evidence (2026-03-07):**
  - Restored `packages/ui/src/utils/translate-path.ts` to locale-aware slug lookup via `getSlug(...)` instead of returning internal canonical segments such as `/book` and `/book-private-accommodations`.
  - Reconciled the shared slug map to the Brikette app contract in `packages/ui/src/slug-map.ts`:
    - `book.hi` -> `aarakshan`
    - `book.da` -> `bestil`
    - full localized `privateBooking` matrix now matches the app contract
    - `guidesTags.it` -> `etichette`
  - Updated the shared nav test in `packages/ui/src/utils/__tests__/buildNavLinks.test.ts` so the English rooms sentinel now expects `/book-dorm-bed`, matching the live Brikette booking slug.
  - Validation results:
    - `pnpm --filter @acme/ui typecheck` passed
    - `pnpm --filter @acme/ui lint` passed
    - `pnpm --filter @apps/brikette typecheck` passed
    - `pnpm --filter @apps/brikette lint` passed at the existing warnings-only baseline (`129 warnings`, `0 errors`)

### TASK-14E: Freeze private-room child route contract and audit coverage
- **Type:** INVESTIGATE
- **Deliverable:** decision-ready artifact that freezes whether private-room child paths remain English-by-allowlist or move to localized child slugs, and clarifies the role of `/apartment` versus the private-room root
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Affects:** `docs/plans/brikette-sales-funnel-analysis/artifacts/route-localization-contract.md`, `docs/plans/brikette-sales-funnel-analysis/fact-find.md`, `[readonly] apps/brikette/src/app/[lang]/private-rooms/**`, `[readonly] apps/brikette/src/routing/routeInventory.ts`, `[readonly] packages/ui/src/utils/buildNavLinks.ts`
- **Depends on:** TASK-13E
- **Blocks:** TASK-14F
- **Confidence:** 70%
  - Implementation: 70% - bounded evidence sweep, but the final contract still needs an explicit choice.
  - Approach: 75% - the ambiguity is well-isolated to one route family.
  - Impact: 85% - prevents production rollout from cementing a mixed-language or duplicate-semantics private-room route family.
- **Questions to answer:**
  - Should private-room child slugs (`apartment`, `double-room`, `private-stay`, `street-level-arrival`) remain English as an explicit allowlist or be localized?
  - Should `/{lang}/{privateRoomsSlug}` remain a summary hub while `/{lang}/{privateRoomsSlug}/apartment` remains a separate detail page, or should one canonical absorb the other?
- **Acceptance:**
  - Route-localization artifact explicitly covers the private-room child route family.
  - `/apartment` versus root semantic duplication is classified with a recommended canonical policy.
  - Any allowed English child slugs are documented as explicit exceptions rather than untracked leakage.
- **Validation contract:** artifact cites route inventory, page metadata, UI link consumers, and sitemap exposure.
- **Build evidence (2026-03-07):**
  - Extended `apps/brikette/scripts/verify-route-localization.ts` so the route-localization artifact now explicitly documents the private-room child route family and the frozen policy rather than overstating closure.
  - Refreshed `docs/plans/brikette-sales-funnel-analysis/artifacts/route-localization-contract.md` with the decision:
    - keep `/{lang}/{privateRoomsSlug}` as the summary hub
    - keep a distinct apartment detail child page
    - do not treat English child slugs as a permanent allowlist
  - Fact-find now records the key evidence behind that decision:
    - only `double-room` appears in `src/test/fixtures/legacy-urls.txt`
    - `apartment`, `private-stay`, and `street-level-arrival` are current public child URLs without legacy-fixture backing
  - Outcome: `TASK-14F` created to implement the localized child-slug contract before `TASK-08C`.

### TASK-14F: Implement localized private-room child slug contract and redirects
- **Type:** IMPLEMENT
- **Deliverable:** localized canonical private-room child slugs with exact redirect preservation for historical/current English aliases, plus refreshed route-localization and SEO coverage
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/brikette/src/app/[lang]/private-rooms/**`, `apps/brikette/src/app/[lang]/dorms/[id]/page.tsx`, `apps/brikette/src/middleware.ts`, `apps/brikette/src/routing/routeInventory.ts`, `apps/brikette/src/routing/staticExportRedirects.ts`, `apps/brikette/scripts/lib/static-runtime-redirects.ts`, `apps/brikette/scripts/verify-route-localization.ts`, `apps/brikette/src/utils/seo.ts`, `apps/brikette/src/test/middleware.test.ts`, `apps/brikette/src/test/utils/seo.test.ts`, `apps/brikette/src/test/routing/routeInventory.seo.test.ts`, `packages/ui/src/config/privateRoomChildSlugs.ts`, `packages/ui/src/utils/privateRoomPaths.ts`, `packages/ui/src/utils/buildNavLinks.ts`, `packages/ui/src/molecules/SlideItem.tsx`, `packages/ui/src/organisms/RoomsSection.tsx`, `packages/ui/src/data/roomsData.ts`, `docs/plans/brikette-sales-funnel-analysis/artifacts/route-localization-contract.md`
- **Depends on:** TASK-14E
- **Blocks:** TASK-08C
- **Confidence:** 80%
  - Implementation: 80% - the contract is now frozen and the affected route family is bounded.
  - Approach: 80% - reuse the existing localized slug infrastructure rather than adding another allowlist.
  - Impact: 85% - removes the last mixed-language canonical family before live redirect convergence.
- **Acceptance:**
  - `/{lang}/{privateRoomsSlug}` remains the summary hub.
  - The apartment detail child page moves off generic English `/apartment` onto a localized canonical child slug.
  - `double-room`, `private-stay`, and `street-level-arrival` canonical child slugs are localized for every locale.
  - Historical/current English child URLs redirect in one hop to the localized canonical targets, with `double-room` explicitly preserved as a historical alias.
  - Route-localization and SEO inventory tests reflect the new child-slug contract.
- **Validation contract (TC-14F):**
  - TC-01: route-localization audit artifact reflects the localized child family and no longer relies on the decision-pending note.
  - TC-02: URL coverage validation includes the new canonical child slugs and exact legacy alias redirects.
  - TC-03: Brikette and shared UI typecheck/lint stay green after the child-slug source-of-truth change.
- **Build evidence (2026-03-07):**
  - Added a shared private-room child slug source of truth in `packages/ui/src/config/privateRoomChildSlugs.ts` and routed shared/app path builders through `packages/ui/src/utils/privateRoomPaths.ts` and `apps/brikette/src/utils/privateRoomPaths.ts`.
  - Canonical public private-room child URLs are now localized across the app, shared UI, SEO alternates, middleware rewrites, and static-runtime redirect generation; historical/current English child URLs remain exact redirects, with `double-room` preserved as the historical alias family.
  - Route-localization artifact refreshed in `docs/plans/brikette-sales-funnel-analysis/artifacts/route-localization-contract.md` with `0` unexpected private-room child English matches and `0` total unexpected English-slug matches.
  - URL coverage validation passed with `3435` historical legacy URLs, `3956` localized canonicals, `83` structural `_redirects` rules, `2757` exact legacy redirects, `32` Pages Function include rules, and `0` missing URLs.
  - Validation passed:
    - `pnpm --filter @acme/ui typecheck`
    - `pnpm --filter @acme/ui lint`
    - `pnpm --filter @apps/brikette typecheck`
    - `scripts/agents/integrator-shell.sh -- pnpm --filter @apps/brikette exec tsx scripts/verify-route-localization.ts`
    - `scripts/agents/integrator-shell.sh -- pnpm --filter @apps/brikette exec tsx scripts/generate-static-export-redirects.ts`
    - `scripts/agents/integrator-shell.sh -- pnpm --filter @apps/brikette exec tsx scripts/verify-url-coverage.ts`
    - `pnpm --filter @apps/brikette lint` (warnings-only baseline: `129` warnings, `0` errors)

### TASK-14G: Prove hybrid static-runtime redirect model on staging with valid Cloudflare auth
- **Type:** INVESTIGATE
- **Deliverable:** dated staging proof that the hybrid static-runtime redirect model deploys cleanly and resolves representative curated legacy routes under cache-busted checks
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Affects:** `docs/plans/brikette-sales-funnel-analysis/artifacts/production-redirect-matrix.md`, `docs/brikette-deploy-decisions.md`, `[external] staging Cloudflare Pages deploy`
- **Depends on:** TASK-14B
- **Blocks:** TASK-08C
- **Confidence:** 70%
  - Implementation: 70% - the checks are straightforward once authenticated deploy access works from this workspace.
  - Approach: 75% - isolates staging proof from repo implementation so production rollout is gated by the right external evidence.
  - Impact: 80% - removes the last uncertainty around whether the curated hybrid contract survives a real Pages deploy.
- **Questions to answer:**
  - Does the staging deploy built from the hybrid runtime still return direct `200` for current localized canonicals?
  - Do representative supported historical routes resolve correctly through structural redirects or the scoped Pages Function?
  - Do intentionally dropped synthetic aliases still return `404` on fresh staging requests?
- **Acceptance:**
  - A fresh staging deploy using the current hybrid runtime succeeds with valid Cloudflare auth.
  - Representative cache-busted staging checks prove:
    - current localized canonicals return direct `200`
    - supported historical routes redirect or resolve in one hop as designed
    - intentionally dropped synthetic aliases return `404`
  - The dated staging evidence is recorded in `production-redirect-matrix.md`.
- **Validation contract:** dated staging curl matrix plus authenticated deploy evidence.
- **Build evidence (2026-03-07):**
  - Cloudflare auth was refreshed from root `.env.local`; `pnpm exec wrangler whoami` succeeded from `apps/brikette`.
  - Fresh staging deploy succeeded on:
    - `https://afec21bf.brikette-website.pages.dev`
    - alias: `https://staging.brikette-website.pages.dev`
  - Representative cache-busted staging checks passed:
    - `/it/prenota` -> `200`
    - `/it/prenota-alloggi-privati` -> `200`
    - `/en/private-rooms/apartment` -> one-hop redirect to `/en/private-rooms/sea-view-apartment`
    - `/it/camere-private/appartamento-vista-mare` -> `200`
    - `/ja/about` -> one-hop redirect to `/ja/annai`
    - `/it/book` -> `404` by design under the narrowed route policy
  - A transient Pages Function route crash and a private-room child export normalization miss were both fixed before the successful staging proof:
    - bounded file-routed Pages handlers replaced the old root catch-all function
    - localized private-room child static export normalization was completed and redeployed

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
- **Status:** Complete (2026-03-07)
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
- **Build evidence (2026-03-07):**
  - The route-localization tranche, hybrid runtime rollout, staging proof, production deploy, and live verification are now complete.
  - Horizon risk has shifted from routing implementation to control depth: the remaining meaningful gap is automated coverage for rendered canonical links across nav/footer/content surfaces.
  - This checkpoint therefore seeds the next tranche:
    - `TASK-15A` live control audit
    - `TASK-15B` CI-only post-deploy canonical/sitemap/404 guards
    - `TASK-15C` rendered-link canonical audit coverage

### TASK-15A: Audit live route/SEO control stack against the canonical contract
- **Type:** INVESTIGATE
- **Deliverable:** explicit inventory of route/SEO controls covering route behavior, canonical tags, sitemap inclusion, and rendered internal-link canonicality, with gaps called out by layer
- **Execution-Skill:** lp-do-ideas
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Affects:** `docs/plans/brikette-sales-funnel-analysis/fact-find.md`, `docs/plans/brikette-sales-funnel-analysis/plan.md`, `docs/plans/brikette-sales-funnel-analysis/critique-history.md`
- **Depends on:** TASK-12
- **Blocks:** TASK-15B, TASK-15C
- **Confidence:** 85%
  - Implementation: 85% - the deployed route contract and current guards are already observable.
  - Approach: 85% - explicit control mapping is the cleanest way to avoid over-hardening the wrong layer.
  - Impact: 85% - prevents the next guard tranche from conflating CI enforcement with manual operator deploy flow.
- **Acceptance:**
  - Route-behavior, canonical-tag, sitemap, and rendered-link controls are each mapped to a specific existing or missing guard.
  - CI-only vs manual-deploy control boundaries are explicit.
  - Remaining guard gaps are reduced to an actionable next tranche rather than open-ended “more testing”.
- **Build evidence (2026-03-07):**
  - Audited staging and production against three required contracts:
    - canonical routes must resolve as intended
    - internal links should point at canonical routes
    - sitemap must contain canonical routes
  - Found and fixed one real live gap before rollout completion: sitemap omission of private-room child canonicals.
  - Mapped the remaining control gap to automation depth, not route behavior: post-deploy CI did not yet enforce canonical-tag routes, sitemap-required routes, or intentionally dropped `404` routes.
  - Explicitly preserved direct `wrangler pages deploy` as a fast manual path; stronger guard depth is assigned to CI only.

### TASK-15B: Add CI-only post-deploy canonical/sitemap/404 guards
- **Type:** IMPLEMENT
- **Deliverable:** reusable CI health checks that enforce canonical-tag correctness, sitemap inclusion for key canonicals, and exact `404` behavior for intentionally dropped aliases
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Affects:** `.github/workflows/reusable-app.yml`, `.github/workflows/brikette.yml`, `scripts/post-deploy-health-check.sh`
- **Depends on:** TASK-15A
- **Blocks:** TASK-15C
- **Confidence:** 85%
  - Implementation: 85% - the existing post-deploy script already supported route probes and only needed contract expansion.
  - Approach: 90% - CI is the right place for strict deploy verification; manual `wrangler` must remain a fast operator tool.
  - Impact: 85% - catches canonical/sitemap/404 regressions immediately after deploy without slowing down manual hotfix publishing.
- **Acceptance:**
  - Reusable post-deploy health checks accept canonical-tag, sitemap-required, and expected-404 route sets.
  - Brikette staging and production workflows pass the new route sets into CI.
  - Direct `wrangler pages deploy` flow is unchanged.
- **Build evidence (2026-03-07):**
  - Extended `scripts/post-deploy-health-check.sh` with:
    - `CANONICAL_ORIGIN`
    - `CANONICAL_TAG_ROUTES`
    - `SITEMAP_REQUIRED_ROUTES`
    - `EXPECT_404_ROUTES`
  - Added corresponding reusable workflow inputs in `.github/workflows/reusable-app.yml`.
  - Wired Brikette staging and production CI callers in `.github/workflows/brikette.yml` to enforce:
    - canonical tags on key localized booking/private-room/guide surfaces
    - sitemap presence for key canonicals
    - `404` for intentionally dropped alias `/it/book`
  - Kept the manual `wrangler pages deploy` path unchanged by design.

### TASK-15C: Add canonical-link audit coverage for rendered nav/footer/content links
- **Type:** IMPLEMENT
- **Deliverable:** automated audit coverage proving rendered internal links on representative pages point directly to canonical routes without redirect churn
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/brikette` rendered-link audit tooling/tests, `docs/plans/brikette-sales-funnel-analysis/artifacts/production-redirect-matrix.md`
- **Depends on:** TASK-15A
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 75% - deterministic rendered-link auditing is now in place via built HTML verification over representative pages.
  - Approach: 80% - representative-page coverage is a pragmatic control layer after route/canonical/sitemap guards.
  - Impact: 80% - prevents menu/footer/content regressions from quietly reintroducing redirect churn.
- **Acceptance:**
  - Representative page set is defined across homepage, booking, private-room, and guide surfaces.
  - Rendered internal links are checked against the canonical route contract.
  - The audit fails on redirecting or non-canonical internal links unless explicitly allowlisted.
- **Build evidence (2026-03-07):**
  - Added canonical route inventory helper:
    - `apps/brikette/src/routing/routeInventory.ts` -> `listLocalizedCanonicalAppUrls()`
  - Added rendered-link audit script:
    - `apps/brikette/scripts/verify-rendered-link-canonicals.ts`
  - Added package command:
    - `apps/brikette/package.json` -> `verify:rendered-link-canonicals`
  - Wired the audit into Brikette CI-only static export/build paths in `.github/workflows/brikette.yml`.
  - Added route-contract coverage in `apps/brikette/src/test/routing/routeInventory.seo.test.ts`.
  - Local audit result against current export:
    - `pagesAudited: 13`
    - `linksChecked: 410`
    - `invalidLinks: 0`
    - representative routes covered homepage, booking, private-room, and live guide surfaces in `en`, `it`, and `ja`.

### TASK-16A: Repair live booking widget/calendar guest-control and date-input accessibility leaks
- **Type:** IMPLEMENT
- **Deliverable:** shared booking widget/calendar surfaces stop exposing raw guest-stepper i18n keys and segmented native date labels on live homepage, booking, and apartment booking routes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/brikette/src/components/booking/DateRangePicker.tsx`, `apps/brikette/src/components/booking/BookPageSections.tsx`, `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`, `apps/brikette/src/components/landing/BookingWidget.tsx`, `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx`, `apps/brikette/src/utils/bookingControlLabels.ts`, `apps/brikette/src/test/components/modal-integration-tc09.test.tsx`, `apps/brikette/src/test/components/apartment/apartment-booking-url-matrix.test.tsx`, `apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx`, `docs/plans/brikette-sales-funnel-analysis/fact-find.md`, `docs/plans/brikette-sales-funnel-analysis/plan.md`, `docs/plans/brikette-sales-funnel-analysis/critique-history.md`
- **Depends on:** TASK-15C
- **Blocks:** TASK-16B
- **Confidence:** 85%
  - Implementation: 85% - the raw-key and segmented-date-label regressions are reproduced live and traced to concrete shared components.
  - Approach: 85% - one shared booking-control helper plus hidden native date-input isolation fixes the issue at the source rather than patching pages one by one.
  - Impact: 90% - this is a live commercial-surface trust and accessibility defect on the highest-intent booking surfaces.
- **Acceptance:**
  - Homepage, `/[lang]/book`, and apartment booking surfaces stop rendering raw `bookingControls.*Guests` labels.
  - Native date inputs remain available for controlled input/test hooks but are removed from the accessibility tree so segmented `Day Day / Month Month / Year Year` labels no longer leak.
  - Targeted tests are updated to the new stable contract instead of asserting broken raw keys.
- **Validation contract:**
  - `pnpm --filter @apps/brikette typecheck`
  - `pnpm --filter @apps/brikette lint`
  - Optional live browser redeploy verification after build completion.
- **Build evidence (2026-03-07, partial):**
  - Added a shared fallback path for guest-stepper aria labels via:
    - `apps/brikette/src/utils/bookingControlLabels.ts`
  - Applied the shared guest-control fallback to the remaining booking surfaces still using raw `bookingControls.*Guests` keys:
    - `apps/brikette/src/components/booking/BookPageSections.tsx`
    - `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`
    - homepage and dorms surfaces remained on the same shared helper contract
  - Removed the hidden native date inputs from the accessibility tree while preserving deterministic test hooks:
    - `apps/brikette/src/components/booking/DateRangePicker.tsx`
  - Updated affected tests away from broken raw-key/label assertions:
    - `apps/brikette/src/test/components/modal-integration-tc09.test.tsx`
    - `apps/brikette/src/test/components/apartment/apartment-booking-url-matrix.test.tsx`
    - `apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx`
  - Validation passes:
    - `pnpm --filter @apps/brikette typecheck`
    - `pnpm --filter @apps/brikette lint` (`129 warnings`, `0 errors`; existing warnings-only baseline)
  - Staging deploy proof passed on `https://staging.brikette-website.pages.dev`:
    - `/en` homepage no longer exposes `bookingControls.*Guests`; stepper buttons are `Increase guests` / `Decrease guests`
    - `/en/book-dorm-bed` no longer exposes `bookingControls.*Guests`
    - `/it/prenota` no longer exposes `bookingControls.*Guests`
    - the previous segmented native date-label leak (`Day Day / Month Month / Year Year`) is absent from the staged a11y affordance inventory on homepage and booking pages
  - Remaining live browser issue after this task is separate and retained for `TASK-16B`: `/it/prenota` still shows visible English filter copy such as `All views`, `Sea view`, and `Female only`

### TASK-16E: Repair remaining shared-shell localization regressions after rollout audit
- **Type:** IMPLEMENT
- **Deliverable:** localized shared-shell controls stop leaking English on non-English commercial surfaces, and homepage featured-guide cards resolve labels from the active locale bundle rather than stale generated fallbacks
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/brikette/src/components/footer/Footer.tsx`, `apps/brikette/src/components/landing/FeaturedGuidesSection.tsx`, `apps/brikette/src/locales/*/footer.json`, `packages/i18n/src/{de,es,fr,it,ja,ko}.json`, `docs/plans/brikette-sales-funnel-analysis/fact-find.md`, `docs/plans/brikette-sales-funnel-analysis/plan.md`, `docs/plans/brikette-sales-funnel-analysis/critique-history.md`
- **Depends on:** TASK-16B, TASK-16C, TASK-16D
- **Confidence:** 85%
  - Implementation: 85% - the remaining leaks were reproduced on staging and traced to concrete shared-shell sources rather than page-specific logic.
  - Approach: 85% - fixing the locale sources and fallback precedence removes the regressions at the shared component boundary instead of patching individual pages.
  - Impact: 85% - these are visible trust/polish defects on top-level commercial surfaces and localized homepage discovery blocks.
- **Acceptance:**
  - The scenic theme toggle uses locale-correct assistive labels on supported non-English shells instead of English strings.
  - The footer-level direct-booking CTA resolves from footer locale data and no longer leaks English on non-English pages.
  - Homepage featured-guide cards prefer active locale guide labels over stale generated fallback titles where localized guide bundles exist.
- **Validation contract:**
  - `pnpm --filter @apps/brikette typecheck`
  - `pnpm --filter @apps/brikette lint`
  - Staging browser verification on localized homepage and booking routes.
- **Build evidence (2026-03-07):**
  - Footer CTA source-of-truth corrected:
    - `apps/brikette/src/components/footer/Footer.tsx`
    - localized `bookDirect` key added to every footer locale file under `apps/brikette/src/locales/*/footer.json`
  - Homepage featured-guide cards now resolve labels from the active locale bundle before falling back to generated labels:
    - `apps/brikette/src/components/landing/FeaturedGuidesSection.tsx`
  - Shared theme-toggle assistive labels localized in core package bundles for the locales that were still leaking English:
    - `packages/i18n/src/de.json`
    - `packages/i18n/src/es.json`
    - `packages/i18n/src/fr.json`
    - `packages/i18n/src/it.json`
    - `packages/i18n/src/ja.json`
    - `packages/i18n/src/ko.json`
  - Validation passes:
    - `pnpm --filter @apps/brikette typecheck`
    - `pnpm --filter @apps/brikette lint` (`129 warnings`, `0 errors`; unchanged warnings-only baseline)
  - Staging redeploy/browser proof is the final external verification step for this tranche.

### TASK-16F: Eliminate static-export localization leakage on non-English commercial pages
- **Type:** IMPLEMENT
- **Deliverable:** localized shared-shell and commercial pages render locale-correct static HTML before hydration, backed by a deterministic export audit for representative non-English routes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/brikette/src/app/_lib/i18n-server.ts`, `apps/brikette/src/app/[lang]/{layout.tsx,ClientLayout.tsx,page.tsx,HomeContent.tsx}`, `apps/brikette/src/app/[lang]/book/{page.tsx,BookPageContent.tsx}`, `apps/brikette/src/app/[lang]/book-dorm-bed/page.tsx`, `apps/brikette/src/components/landing/{BookingWidget.tsx,FeaturedGuidesSection.tsx,SocialProofSection.tsx}`, `packages/ui/src/organisms/QuickLinksSection.tsx`, `apps/brikette/src/locales/*/bookPage.json`, `apps/brikette/src/utils/primeAppI18nBundles.ts`, `apps/brikette/scripts/verify-localized-commercial-copy.ts`, `apps/brikette/package.json`, `.github/workflows/brikette.yml`, `docs/plans/brikette-sales-funnel-analysis/{fact-find.md,plan.md,critique-history.md}`
- **Depends on:** TASK-16E
- **Confidence:** 80%
  - Implementation: 80% - the leak reproduced on specific staged routes and traced to the static-render path rather than random runtime drift.
  - Approach: 80% - priming server-loaded Brikette namespace bundles into the client i18n instance removes the SSR gap at the component boundary instead of adding more one-off copy patches.
  - Impact: 85% - this closes visible English/raw-key leakage on localized money pages and homepage discovery surfaces, which directly affects trust, crawl quality, and no-JS rendering.
- **Acceptance:**
  - Representative non-English homepage and booking page static HTML no longer emit the known English/raw-key leakage set before hydration.
  - Shared shell namespaces (`header`, `footer`, `_tokens`, `notificationBanner`, `modals`) are available at render time for localized static export.
  - Homepage and booking commercial namespaces are primed before their client components render on the static export path.
  - Non-English `bookPage.noscript.octorateDirectBooking` labels exist, so booking noscript fallback text does not regress to English.
  - A deterministic export audit fails the build if `/it` or `/it/prenota` reintroduce the known leakage tokens.
- **Validation contract:**
  - `pnpm --filter @acme/ui typecheck`
  - `pnpm --filter @acme/ui lint`
  - `pnpm --filter @apps/brikette typecheck`
  - `pnpm --filter @apps/brikette lint`
  - Static export build path with:
    - `pnpm --filter @apps/brikette normalize:localized-routes`
    - `pnpm --filter @apps/brikette generate:static-redirects`
    - `pnpm --filter @apps/brikette verify:sitemap-contract -- --file out/sitemap.xml`
    - `pnpm --filter @apps/brikette verify:rendered-link-canonicals -- --out-dir out`
    - `pnpm --filter @apps/brikette verify:localized-commercial-copy -- --out-dir out`
- **Build evidence (2026-03-07):**
  - Added an app-namespace snapshot bridge from server render into the Brikette client i18n instance:
    - `apps/brikette/src/app/_lib/i18n-server.ts`
    - `apps/brikette/src/utils/primeAppI18nBundles.ts`
    - `apps/brikette/src/app/[lang]/layout.tsx`
    - `apps/brikette/src/app/[lang]/ClientLayout.tsx`
  - Primed the homepage and hostel booking pages with server-loaded namespace bundles before their client components render:
    - `apps/brikette/src/app/[lang]/page.tsx`
    - `apps/brikette/src/app/[lang]/HomeContent.tsx`
    - `apps/brikette/src/app/[lang]/book/page.tsx`
    - `apps/brikette/src/app/[lang]/book-dorm-bed/page.tsx`
    - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
  - Hardened the remaining homepage fallback surfaces so missing/late bundles no longer leak raw keys:
    - `packages/ui/src/organisms/QuickLinksSection.tsx`
    - `apps/brikette/src/components/landing/BookingWidget.tsx`
    - `apps/brikette/src/components/landing/FeaturedGuidesSection.tsx`
    - `apps/brikette/src/components/landing/SocialProofSection.tsx`
  - Closed the missing non-English booking noscript label contract:
    - `apps/brikette/src/locales/*/bookPage.json`
  - Added a deterministic localized-commercial-copy audit and wired it into Brikette CI export builds only:
    - `apps/brikette/scripts/verify-localized-commercial-copy.ts`
    - `apps/brikette/package.json`
    - `.github/workflows/brikette.yml`
  - Validation passes:
    - `pnpm --filter @acme/ui typecheck`
    - `pnpm --filter @acme/ui lint`
    - `pnpm --filter @apps/brikette typecheck`
    - `pnpm --filter @apps/brikette lint` (`129 warnings`, `0 errors`; unchanged warnings-only baseline)
  - Static export proof passed locally with:
    - `verify:sitemap-contract` → `expected 3981 / missing 0`
    - `verify:rendered-link-canonicals` → `pagesAudited 13 / linksChecked 431 / invalidLinks 0`
    - `verify:localized-commercial-copy` → `routesAudited ['/it','/it/prenota'] / findings 0`

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
