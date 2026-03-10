---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Business-OS
Workstream: Mixed
Created: 2026-02-22
Last-updated: 2026-02-22
Feature-Slug: startup-loop-standing-info-gap-analysis
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-sequence, lp-do-replan
Related-Plan: docs/plans/startup-loop-standing-info-gap-analysis/plan.md
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Startup Loop Standing Information Model Gap Analysis — Fact-Find Brief

## Scope
### Summary
This fact-find compares the **current repo-implemented operating model** against the **proposed two-layer model** provided in this request:
1. Layer A: standing information (MARKET, SELL, PRODUCTS, LOGISTICS) that is revised over time and emits ideas.
2. Layer B: implementation loop (fact-find -> plan -> build) that validates and executes ideas, then updates standing information.

Current-state findings are derived from repository evidence only (primarily `loop-spec.yaml`, startup-loop skill contracts, and artifact contracts). Proposed-state findings are taken from the user-provided target spec in this thread.

> **NOTE:** A stable snapshot of the proposed target model must be persisted at `docs/plans/startup-loop-standing-info-gap-analysis/proposed-target-model.md` before planning begins (see TASK-00). The gap matrix is built against this spec; any later drift in the thread invalidates the gap analysis.

### Goals
- Produce a decision-grade gap analysis between current and proposed operating systems.
- Identify structural, contract, and artifact-level differences.
- Provide migration-ready task seeds that can be sequenced in planning.

### Non-goals
- Implementing the redesign in this fact-find.
- Reviewing or preserving the existing kanban/card lane interface as a required interface model.

### Constraints & Assumptions
- Constraints:
  - Current-state source of truth is repository code/docs as of commit `b18aa4ee5f`.
  - This analysis excludes kanban-as-interface per user instruction.
- Assumptions:
  - Proposed target stage names/artifacts in this request are authoritative for desired-state comparison.
  - Existing startup-loop tests/contracts are still expected to guard whatever migration follows.

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/startup-loop/loop-spec.yaml` — canonical stage graph and gates.
- `docs/business-os/startup-loop/artifact-registry.md` — canonical producer/consumer artifact paths.
- `.claude/skills/startup-loop/modules/assessment-intake-sync.md` — ASSESSMENT carry-forward synthesis contract.
- `.claude/skills/lp-offer/SKILL.md` — MARKET-06 offer artifact contract.
- `.claude/skills/lp-channels/SKILL.md` — SELL-01 channel strategy contract.
- `.claude/skills/lp-do-fact-find/SKILL.md` — LOOP fact-find output contract.
- `.claude/skills/lp-do-plan/SKILL.md` — LOOP plan handoff contract.
- `.claude/skills/lp-do-build/SKILL.md` — LOOP build completion contract.
- `.claude/skills/startup-loop/modules/cmd-start.md` — startup-loop start gate language and stage handoffs.

### Key Modules / Files
- `docs/business-os/startup-loop/loop-spec.yaml` - Stage topology, ordering, and join-barrier contracts.
- `docs/business-os/startup-loop/artifact-registry.md` - Canonical artifacts currently tracked (`offer`, `channels`, `forecast`, `seo`, `briefing_contract`).
- `.claude/skills/startup-loop/modules/assessment-intake-sync.md` - Current ASSESSMENT carry-forward behavior and locked fields.
- `.claude/skills/lp-offer/SKILL.md` - Current offer output and required sections.
- `.claude/skills/lp-channels/SKILL.md` - Current sell-stage decomposition and DEP gates.
- `.claude/skills/lp-do-fact-find/SKILL.md` - Current fact-find output path and critique requirement.
- `.claude/skills/lp-do-plan/SKILL.md` - Current plan path and planning gates.
- `.claude/skills/lp-do-build/SKILL.md` - Current build completion and archive behavior.
- `docs/business-os/market-research/_templates/*.md` - Current MARKET-01..05 prompt templates.
- `docs/business-os/startup-baselines/HEAD-2026-02-12assessment-intake-packet.user.md` - Representative standing baseline artifact.

### Patterns & Conventions Observed
- The startup loop is still modeled as a **single directed stage graph** with containers and stages, not as two explicit top-level layers (`loop-spec.yaml:111`, `loop-spec.yaml:523`).
- ASSESSMENT outputs are synthesized into one intake packet with precursor provenance and selective field-locking (`assessment-intake-sync.md:101`, `assessment-intake-sync.md:197`).
- MARKET is currently six stages ending in offer design at `MARKET-06` (`loop-spec.yaml:325`, `loop-spec.yaml:365`).
- SELL is currently two stages: strategy and activation readiness (`loop-spec.yaml:419`, `loop-spec.yaml:433`).
- LOOP implementation is represented as a DO stage with three processes (`fact-find`, `plan`, `build`) (`loop-spec.yaml:498`).
- Output artifacts in canonical registry are limited to a small set; no market/sell/product/logistics aggregate-pack family exists (`artifact-registry.md:24`).

### Data & Contracts
- Stage topology (current):
  - `PRODUCT` exists with `PRODUCT-01` and conditional `PRODUCT-02`, then `MARKET-01..06`, then fan-out to `S3`, `SELL-01`, `PRODUCT-02` and join at `S4` (`loop-spec.yaml:280`, `loop-spec.yaml:303`, `loop-spec.yaml:559`).
- S4 join has 3 required inputs and 3 optional inputs (`loop-spec.yaml:452–467`):
  - Required: `MARKET-06.offer`, `S3.forecast`, `SELL-01.channels`
  - Optional: `SELL-01.seo`, `SELL-01.outreach`, `PRODUCT-02.adjacent_product_research`
- DO (implementation loop) contract currently centers on plan artifacts and BOS stage-doc sync, not explicit `build-record.user.md` / `results-review.user.md` contracts (`loop-spec.yaml:498`, `lp-do-build/SKILL.md:164`).
- Fact-find output path is currently `docs/plans/<feature-slug>/fact-find.md` (`lp-do-fact-find/SKILL.md:144`).

### Current vs Proposed Gap Matrix
| Area | Current State (Repo Evidence) | Proposed Target | Gap | Severity |
|---|---|---|---|---|
| Operating model layers | Single startup-loop graph with containers/stages (`loop-spec.yaml:111`) | Explicit two-layer model (standing info + implementation loop) | Layer boundary is implicit, not contract-first | High |
| Standing domains | Containers (`type: container`): ASSESSMENT, PRODUCT, MARKET, SELL (`loop-spec.yaml:224`, `:280`, `:303`, `:404`); MEASURE-01/02 are individual stages with `stage_group: MEASURE`, not a container | Standing domains: MARKET, SELL, PRODUCTS, LOGISTICS | PRODUCTS (as strategy domain) and LOGISTICS domain absent | High |
| MARKET sequence shape | `MARKET-01` starts at competitor mapping, ends `MARKET-06` offer (`loop-spec.yaml:325`, `loop-spec.yaml:365`) | `MARKET-01..11` including problem framing, ICP baseline, synthesis, aggregate pack | Stage model and numbering materially different; 5 proposed stages missing. **OPEN**: must confirm whether new stages are appended after MARKET-06 (existing IDs stable) or inserted before existing stages (renumbering = breaking change for all stage-addressing, tests, and skill references). "Problem framing" and "ICP baseline" in proposed MARKET overlap semantically with ASSESSMENT-01/02 — planning must state explicitly that MARKET-01 remains competitor mapping (current) and new stages are additive. | High |
| SELL sequence shape | `SELL-01` strategy + GTM, `SELL-02` activation gate (`loop-spec.yaml:419`, `loop-spec.yaml:433`) | `SELL-01..08` with economics, funnel, SEO/outreach as first-class stages, aggregate pack | 6 proposed SELL stages not yet first-class stage IDs; SEO and outreach currently exist as `secondary_skills` within SELL-01 (`loop-spec.yaml:422–425`) but lack independent artifact contracts and gate enforcement | High |
| PRODUCTS standing intelligence | Only PRODUCT container with `PRODUCT-01 product-from-photo` and conditional adjacent research (`loop-spec.yaml:293`, `loop-spec.yaml:389`) | `PRODUCTS-01..07` strategy/intelligence stack | Current PRODUCT is product-definition + optional expansion, not standing product strategy system | High |
| LOGISTICS standing intelligence | No `LOGISTICS` stage/container IDs in loop spec (`rg` count = 0) | `LOGISTICS-01..07` standing delivery intelligence | Entire domain absent from canonical stage graph and contracts | High |
| Ideas interface contract | No `IDEAS-*` stages/artifacts in loop spec/dictionary (`rg` count = 0) | `IDEAS-01 backlog`, `IDEAS-02 card template`, `IDEAS-03 portfolio` | Idea interface is not modeled as first-class artifact contract | High |
| Implementation loop artifacts | Fact-find/plan/build are process steps; outputs are plan docs and build evidence blocks (`lp-do-fact-find/SKILL.md:144`, `lp-do-build/SKILL.md:168`) | LOOP artifacts: `fact-find-brief.user.md`, `fact-find-findings.user.md`, `build-record.user.md`, `results-review.user.md` | Current artifact names and lifecycle differ; explicit results-review contract missing | High |
| Feedback-to-standing update contract | Weekly readout exists at S10, but no mandatory post-build standing-pack update rule (`loop-spec.yaml:523`) | Every loop outcome must update standing assumptions/confidence/registers | Closed-loop update semantics are partial and not enforceable by contract | High |
| Aggregate packs | Core artifact registry tracks 5 entries: offer, channels, forecast, seo, and briefing_contract schema-contract (`artifact-registry.md:24–30`) | `market-pack`, `sell-pack`, `product-pack`, `logistics-pack` | Aggregate-pack interface family missing; no standing-intelligence aggregate artifact contracts exist | High |
| Carry-forward semantics | Intake sync has preserve/overwrite rules and operator-locked fields (`assessment-intake-sync.md:165`, `assessment-intake-sync.md:197`) | Explicit carry modes: link-only vs revision-living | Partial foundation exists, but no formal per-field carry-mode taxonomy | Medium |
| Document hygiene standard | Metadata is inconsistent across standing artifacts (example: intake has rich owner/provenance, offer has duplicate status keys and no review trigger) (`HEAD-intake-packet.user.md:1`, `PET-offer.md:1`) | Uniform hygiene header on standing docs: owner, review trigger, confidence+why, changes, evidence, open questions | No universal enforced schema for these fields across standing `.user.md` docs | High |
| Legacy naming consistency | `cmd-start` still uses old "S2/S6 deep research completion" language (`cmd-start.md:159`) | Clean MARKET/SELL/PRODUCTS/LOGISTICS language | Documentation contract drift remains in startup-loop helper module | Medium |

### Delivery & Channel Landscape
- Audience/recipient:
  - Startup-loop maintainers and operators who will execute redesign in repo.
  - Expert reviewers without repo access (this brief is written as a standalone decision record).
- Channel constraints:
  - Canonical contracts are markdown docs + YAML + skill files in-repo.
  - Migration must preserve deterministic stage/gate automation behavior.
- Existing templates/assets:
  - Fact-find template: `docs/plans/_templates/fact-find-planning.md`.
  - Evidence gap review checklist: `docs/plans/_templates/evidence-gap-review-checklist.md`.
- Approvals/owners:
  - User/operator decision on target model is authoritative.
- Compliance constraints:
  - Not investigated: no external legal/compliance scope for this specific architecture migration.
- Measurement hooks:
  - Contract checks and targeted startup-loop test suites are available and already used in current flow.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Splitting standing intelligence into MARKET/SELL/PRODUCTS/LOGISTICS with aggregate packs will improve manageability without breaking stage automation | Ability to map existing gates/artifacts to new stage IDs cleanly | Medium | Medium |
| H2 | Explicit IDEAS interface artifacts will reduce random task intake and increase fact-find quality | Enforceable idea-card contract and source-link fields | Medium | Medium |
| H3 | Explicit `results-review` outputs will improve standing-doc freshness and confidence calibration | Loop contract changes in DO/build + standing pack update protocol | Medium | Medium |
| H4 | Kanban interface can be removed from model semantics without blocking implementation loop execution | Decoupling BOS lane/card coupling from required operating contracts | Medium | Medium |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Current flow already supports staged contracts and join barriers; decomposition is feasible | `loop-spec.yaml:446`, `loop-spec.yaml:535` | Medium |
| H2 | Current system has idea skills and feature workflow but no first-class IDEAS artifact contract | `AGENTS.md:110`, `AGENTS.md:112`, zero-match scans for `idea-backlog.user.md` | High |
| H3 | Current build loop archives plan but does not require explicit `results-review.user.md` | `lp-do-build/SKILL.md:176`, zero-match scan for `results-review.user.md` | High |
| H4 | BOS/kanban hooks are present in spec but not intrinsic to core stage computations | `loop-spec.yaml:482`, `loop-spec.yaml:503` | Medium |

#### Falsifiability Assessment
- Easy to test:
  - Presence/absence of stage IDs, artifact names, and contracts.
  - Migration readiness of stage graph and S4 join keys.
- Hard to test:
  - Behavioral quality improvements from standing/ideas redesign before implementation.
- Validation seams needed:
  - End-to-end migration tests for stage addressing, manifest updates, baseline merge, startup-loop tools.

#### Recommended Validation Approach
- Quick probes:
  - Contract scans for new stage IDs, artifacts, and header schema enforcement.
- Structured tests:
  - Startup-loop targeted test slices covering stage graph, stage addressing, S4 join, and MCP startup-loop tools.
- Deferred validation:
  - Real-world operating outcomes (decision speed, hypothesis quality) after 2-4 weekly cycles.

### Test Landscape
#### Test Infrastructure
- Startup-loop suites exist in `scripts/src/startup-loop/__tests__/` and `packages/mcp-server` startup-loop test harnesses.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Stage graph and contracts | Unit/integration | `scripts/src/startup-loop/__tests__/*` | Strong coverage currently for existing model |
| MCP startup-loop tools | Integration | `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts` and startup-loop suite | Strong for existing stage IDs |

#### Coverage Gaps
- Gap-specific redesign tests for proposed `MARKET-11`, `SELL-08`, `PRODUCTS-*`, `LOGISTICS-*`, and `IDEAS-*` do not exist yet (because those contracts do not yet exist).

#### Recommended Test Approach
- Add staged migration tests alongside each contract change, not as one big-bang suite.

### Recent Git History (Targeted)
- Not investigated: this fact-find focused on current contract state, not commit-by-commit causality.

## Questions
### Resolved
- Q: Is current system already split into explicit standing-info vs implementation layers?
  - A: Partially in practice, but not as explicit two-layer top-level contracts.
  - Evidence: `loop-spec.yaml:498` (DO process loop) plus stage graph in same file.

- Q: Does current model include first-class IDEAS artifacts (`IDEAS-01..03`)?
  - A: No.
  - Evidence: zero matches for `IDEAS-` IDs and target filenames across loop spec/dictionary/docs.

- Q: Are PRODUCTS and LOGISTICS standing containers already present?
  - A: No.
  - Evidence: loop spec stage IDs include `PRODUCT`, but no `PRODUCTS-*` or `LOGISTICS-*` IDs (`loop-spec.yaml:280`; zero-match scans).

- Q: Is there a formal current carry-forward mechanism from ASSESSMENT?
  - A: Yes, via intake sync with preserve/refresh rules; but not yet link-vs-revision typed.
  - Evidence: `assessment-intake-sync.md:101`, `assessment-intake-sync.md:165`, `assessment-intake-sync.md:197`.

### Open (User Input Needed)
- Q: Should LOGISTICS be a required pre-SELL dependency for all businesses, or only for physical-product/logistics-heavy profiles?
  - Why it matters: changes graph topology and gating strictness.
  - Decision impacted: stage ordering and block conditions.
  - Decision owner: user/operator.
  - Default assumption + risk: default `conditional by business profile`; risk is under-enforcement for edge cases.

- Q: Should IDEAS artifacts be stage-gated in startup-loop, or remain an external pre-loop interface contract?
  - Why it matters: determines whether stage graph expands or only artifact contracts expand.
  - Decision impacted: loop complexity and migration effort.
  - Decision owner: user/operator.
  - Default assumption + risk: default external interface contract; risk is weaker runtime enforcement.

## Confidence Inputs
- Implementation: 84%
  - Evidence basis: gaps are concrete and contract-visible; migration touches core graph/gates/artifacts but is structurally tractable.
  - To reach >=80: maintain staged migration with compatibility aliases where needed.
  - To reach >=90: predefine full old->new ID mapping and run green test matrix per batch.

- Approach: 88%
  - Evidence basis: current system already has stage/gate contract discipline; redesign can reuse that scaffolding.
  - To reach >=80: keep canonical source as `loop-spec.yaml` + generated map.
  - To reach >=90: lock an explicit migration playbook for sequence, aliases, and deprecation windows.

- Impact: 82%
  - Evidence basis: proposed model directly addresses observed missing contracts (domains, idea interface, aggregate packs, feedback loop).
  - To reach >=90: preserve existing S4/SELL activation safety semantics during migration; demonstrate improved decision throughput across 2+ weekly cycles post-cutover.

- Delivery-Readiness: 79%
  - Evidence basis: technical path is clear; two strategic decisions remain open (LOGISTICS gating mode, IDEAS stage location).
  - To reach >=80: resolve the two open questions.
  - To reach >=90: approve a phased plan with explicit acceptance criteria and rollback points.

- Testability: 86%
  - Evidence basis: existing startup-loop suites provide strong scaffolding for contract migration validation.
  - To reach >=80: keep changes small and test-coupled.
  - To reach >=90: include MCP startup-loop integration checks in each migration wave.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Big-bang stage rename breaks automation | Medium | High | Use phased migration with compatibility aliases and per-wave test gates |
| Over-modeling domains increases operator friction | Medium | Medium | Keep aggregate packs and stage bundles lightweight; enforce only decision-critical fields |
| IDEAS contract becomes duplicate of existing plan intake | Medium | Medium | Define strict purpose: idea card is pre-fact-find hypothesis contract, not task spec |
| LOGISTICS required too early blocks digital-only businesses | Medium | Medium | Make LOGISTICS activation profile-aware (conditional) |
| Standing docs drift without enforced review triggers | High | High | Add hygiene schema + lint check for required metadata fields |
| Feedback loop remains advisory, not enforced | Medium | High | Add explicit post-build standing update gate and artifact checks |
| Residual legacy naming creates operator confusion | Medium | Medium | Sweep startup-loop helper docs and generated operator views after each topology change |
| Removing kanban dependencies accidentally breaks BOS sync paths | Medium | Medium | Treat kanban deprecation as interface de-scope; keep BOS sync optional/non-blocking unless explicitly required |

## Planning Constraints & Notes
- Must-follow patterns:
  - `loop-spec.yaml` remains canonical for stage topology.
  - Regenerate stage-operator map/table after dictionary changes.
  - Validate with startup-loop contract lint + targeted startup-loop suites.
- Rollout/rollback expectations:
  - Prefer phased migration (domain-by-domain) over one cutover.
  - Keep compatibility aliases until all skill/docs/tests are updated.
- Observability expectations:
  - Every migration wave should include explicit green validation logs for contract lint + targeted tests.

## Suggested Task Seeds (Non-binding)
0. TASK-00: Resolve two architecture decisions (LOGISTICS gating mode — required vs. conditional by business profile; IDEAS embedding — stage-gated in loop vs. external pre-loop interface contract) and lock the proposed target model as a stable versioned doc at `docs/plans/startup-loop-standing-info-gap-analysis/proposed-target-model.md`. Also confirm whether MARKET expansion appends new stage IDs after MARKET-06 (additive) or inserts and renumbers existing IDs (breaking). Planning may not proceed until all three decisions are recorded in this doc.
1. TASK-01: Define canonical two-layer contract doc (`Layer A standing`, `Layer B loop`) and lifecycle semantics.
2. TASK-02: Introduce standing-domain stage graph additions for `PRODUCTS-*` and `LOGISTICS-*` (profile-aware where needed).
3. TASK-03: Expand MARKET to `MARKET-01..11` and SELL to `SELL-01..08` with exact artifact contracts.
4. TASK-04: Add IDEAS interface artifacts (`idea-backlog.user.md`, `idea-card.user.md`, `idea-portfolio.user.md`) and handoff contract to fact-find.
5. TASK-05: Add explicit carry-mode schema (`link` vs `revision`) for standing fields inherited from ASSESSMENT/intake.
6. TASK-06: Define and enforce standing doc hygiene schema (owner, next review trigger/date, confidence+why, evidence, change log, open questions).
7. TASK-07: Add aggregate pack contracts (`market-pack`, `sell-pack`, `product-pack`, `logistics-pack`) and S4/decision consumers.
8. TASK-08: Add loop output contracts for `fact-find-brief`, `fact-find-findings`, `build-record`, `results-review` (or formalize equivalent canonical artifacts).
9. TASK-09: Add closed-loop enforcement rule: completed loop cycles must update standing assumptions/confidence/risk registers.
10. TASK-10: Run full doc/skill/spec consistency sweep to remove legacy naming and stale references.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-sequence`, `lp-do-replan`
- Deliverable acceptance package:
  - Updated loop spec and stage dictionary
  - Updated skill contracts and prompt templates
  - Updated artifact registry and standing schemas
  - Passing contract lint and targeted startup-loop tests
- Post-delivery measurement plan:
  - Track weekly: standing doc freshness, number of idea cards promoted to fact-find, fact-find->plan conversion quality, and closed-loop update completion rate.

## Evidence Gap Review
### Gaps Addressed
- Established canonical current-state from stage spec, artifacts, and skill contracts.
- Verified absence of proposed IDs/artifacts using repository-wide pattern scans.
- Captured concrete examples of metadata inconsistency in standing documents.

### Confidence Adjustments
- Reduced Delivery-Readiness to 79% due to two unresolved architecture decisions (LOGISTICS gating and IDEAS embedding location).
- Kept Approach/Testability high because migration can be validated with existing contract/test infrastructure.

### Remaining Assumptions
- Proposed target model semantics in this request are stable enough to plan against once locked in `proposed-target-model.md` by TASK-00 (currently an open risk — see Planning Readiness blocking items).
- Kanban deprecation means BOS lane coupling should not be treated as primary interface in this redesign.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - Complete TASK-00: resolve two design decisions from `## Questions > Open` (LOGISTICS gating, IDEAS embedding location) and lock the proposed target model in `proposed-target-model.md` with the MARKET stage numbering policy confirmed.
- Recommended next step:
  - Complete TASK-00, then `/lp-do-plan startup-loop-standing-info-gap-analysis`

## Section Omission Rule
Not investigated: external legal/policy constraints and historical commit-causality deep dive were intentionally excluded to keep this brief focused on contract-level architecture gaps.
