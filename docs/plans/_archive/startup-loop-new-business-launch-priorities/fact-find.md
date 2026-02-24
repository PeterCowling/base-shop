---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Business-OS
Workstream: Mixed
Created: 2026-02-24
Last-updated: 2026-02-24
Feature-Slug: startup-loop-new-business-launch-priorities
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: startup-loop, lp-site-upgrade, lp-launch-qa, lp-do-plan
Related-Plan: docs/plans/startup-loop-new-business-launch-priorities/plan.md
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
artifact: fact-find
direct-inject: true
direct-inject-rationale: User requested launch-factory focus on leveraging existing loop information into practical WEBSITE v1->v2 iteration.
---

# Startup Loop Website Iteration Factory Priorities Fact-Find

## Scope
### Summary
Define immediate process priorities for turning existing startup-loop artifacts into fast, repeatable website iterations (`v1`, then `v2+`) for new businesses.

Primary question: how to use information already produced by ASSESSMENT, MARKET, PRODUCTS, SELL, and LOGISTICS to ship a high-quality Level-1 site with strong copy and SEO foundations, without re-discovery.

### Goals
- Make a website-ready content/structure contract canonical for every pre-website launch.
- Convert existing loop artifacts into page-ready copy, metadata, and trust blocks automatically.
- Remove per-business hardcoding and manual copy stitching from first-launch site builds.
- Enable deterministic iteration when upstream artifacts change.

### Non-goals
- Weekly decision-support workflows.
- Day-1/day-7/day-14 verification programs.
- Denominator-gated spend policy work.
- Cross-business KPI optimization strategy.

### Constraints & Assumptions
- Constraints:
  - Stage and gate authority remains `docs/business-os/startup-loop/loop-spec.yaml`.
  - WEBSITE-01 contract path remains `docs/business-os/strategy/<BIZ>/site-v1-builder-prompt.user.md`.
  - Canonical output paths remain governed by `docs/business-os/startup-loop/artifact-registry.md`.
- Assumptions:
  - Inference: enough source information already exists pre-launch; bottleneck is transformation into website assets.
  - Inference: biggest throughput gain comes from eliminating manual copy assembly and hardcoded per-business content modules.

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/workflow-prompts/_templates/website-first-build-framework-prompt.md`
- `docs/business-os/startup-loop/process-registry-v2.md`
- `docs/business-os/startup-loop/artifact-registry.md`
- `docs/business-os/startup-loop/aggregate-pack-contracts.md`
- `docs/business-os/startup-loop-workflow.user.md`
- `docs/business-os/startup-baselines/_templates/content-packet-template.md`
- `docs/business-os/startup-baselines/HBAG-content-packet.md`
- `apps/caryina/src/lib/contentPacket.ts`

### Key Modules / Files
- `docs/business-os/workflow-prompts/_templates/website-first-build-framework-prompt.md`
  - WEBSITE-01 requires source audit from strategy index, brand dossier, intake, offer, channels, measurement, app scaffold, and legacy baseline.
- `docs/business-os/startup-loop/process-registry-v2.md`
  - OFF-3 defines WEBSITE-01 bootstrap + WEBSITE-02 recurring content/merch iteration.
- `docs/business-os/startup-loop/artifact-registry.md`
  - Canonical artifacts exist for offer/channels/forecast and aggregate packs; no canonical row for `website-content-packet`.
- `docs/business-os/startup-baselines/_templates/content-packet-template.md`
  - Generic template exists for a startup content packet.
- `docs/business-os/startup-baselines/HBAG-content-packet.md`
  - Practical example of website-ready copy/SEO packet compiled from startup-loop artifacts.
- `docs/business-os/strategy/HBAG/site-v1-builder-prompt.user.md`
  - WEBSITE-01 source map includes the content packet as an input.
- `apps/caryina/src/lib/contentPacket.ts`
  - Runtime website copy is currently hardcoded and business-specific (`HBAG` sources embedded as constants).
- `docs/plans/hbag-startup-loop-content-integration/plan.md`
  - Prior successful one-business implementation proving this approach works.

### Patterns & Conventions Observed
- Pattern: WEBSITE-01 contracts are strong and explicit about inputs and build constraints.
  - evidence: WEBSITE-01 prompt template + HBAG builder prompt
- Pattern: OFF-3 process explicitly owns first-build and recurring website content refresh.
  - evidence: process-registry OFF-3 + stage coverage map
- Pattern: Source artifacts are abundant before launch (assessment/intake/offer/channels/product evidence).
  - evidence: WEBSITE-01 required source audit inputs + HBAG strategy/startup-baseline artifacts
- Pattern: Website content packet exists in template and real usage but is not codified as a canonical startup-loop artifact.
  - evidence: content-packet template + HBAG-content-packet + artifact-registry omission
- Pattern: Runtime consumption currently relies on hardcoded TypeScript text in app code, not a generated artifact pipeline.
  - evidence: `apps/caryina/src/lib/contentPacket.ts`

### Data & Contracts
- Stage/flow contract:
  - `docs/business-os/startup-loop/loop-spec.yaml`
- WEBSITE-01 source contract:
  - `docs/business-os/workflow-prompts/_templates/website-first-build-framework-prompt.md`
- Process ownership (content/merch iteration):
  - `docs/business-os/startup-loop/process-registry-v2.md` (OFF-3)
- Aggregate standing-info contracts:
  - `docs/business-os/startup-loop/aggregate-pack-contracts.md`
- Existing website content packet contract (non-canonical today):
  - `docs/business-os/startup-baselines/_templates/content-packet-template.md`

### Website Iteration Leverage Map
| Upstream loop source | Existing artifact(s) | Website surface it should drive | Current state | Immediate leverage gap |
|---|---|---|---|---|
| ASSESSMENT / Intake | `<BIZ>-intake-packet.user.md`, current-situation, measurement plan | Homepage angle, trust blocks, legal/support baseline, measurement hooks | Available in docs | Not transformed into typed site-ready payload |
| MARKET | `<BIZ>-offer.md`, market evidence, keyword priors | Hero messaging, objections/FAQ, metadata seeds | Available in docs | Manual copy extraction |
| SELL | `<BIZ>-channels.md`, CTA/channel language | CTA labels, conversion-path framing, support copy | Available in docs | No deterministic mapping contract |
| PRODUCTS | product-from-photo, line map, product pack | PLP/PDP naming, feature bullets, family grouping | Available in docs | No automated claim-safe extraction |
| LOGISTICS (conditional) | logistics-pack (when present) | Shipping/returns/duty copy and promises | Conditionally available | Not wired to page-policy blocks |
| WEBSITE-01 | site-v1-builder prompt | Build scope + source map for v1 | Strong contract exists | Output still requires manual content wiring |

### Dependency & Impact Map
- Upstream dependencies:
  - WEBSITE-01 active prompt
  - offer/channels/intake/brand docs
  - product evidence (+ logistics where applicable)
- Downstream dependents:
  - DO fact-find/plan/build speed
  - quality of v1 copy/SEO baseline
  - ability to iterate v2 quickly when artifacts change
- Blast radius if unresolved:
  - repeated manual copy work per business
  - inconsistent copy quality/claim safety
  - slower first-launch cycle time

### Practical Gap Snapshot (Observed)
| Surface | Evidence | Gap | Launch impact |
|---|---|---|---|
| Content packet standardization | Template + HBAG packet exist | No canonical registry contract | Re-implementation per business |
| Runtime content consumption | `apps/caryina/src/lib/contentPacket.ts` hardcoded copy | No generated content artifact ingestion | High manual maintenance and drift risk |
| WEBSITE-01 to usable page copy | WEBSITE-01 source map is rich | No compiler from source artifacts to page modules | Slower v1 and v2 iteration |
| SEO bootstrap | SEO terms present in packet | No reusable pipeline to metadata + visible copy | Weak repeatability across launches |
| Logistics-to-policy copy (physical products) | Conditional logistics pack contract exists | No deterministic mapping into shipping/returns blocks | Ops inconsistency at launch |

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Canonical website-content packet reduces first-launch copy assembly time materially | contract + compiler | Medium | 1 sprint |
| H2 | Generated site-content modules outperform hardcoded per-app copy for maintainability and speed | compiler + runtime adapter | Medium | 1 sprint |
| H3 | Artifact-delta mapping can drive v2 backlog generation without rediscovery | diff mapper + route map | Medium | 1 sprint |
| H4 | Claim-safety lint tied to product/logistics evidence reduces launch copy regressions | lint rules + source refs | Low-Medium | <1 sprint |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | WEBSITE-01 already requires broad source map; HBAG packet proves practical conversion | WEBSITE-01 template + HBAG packet | High |
| H2 | Current runtime still hardcoded in app module | `apps/caryina/src/lib/contentPacket.ts` | High |
| H3 | OFF-3 and WEBSITE-02 require recurring iteration but lack deterministic transform pipeline | process-registry + workflow docs | High |
| H4 | Product evidence constraints are already captured in packet format | HBAG packet + product evidence docs | High |

#### Recommended Validation Approach
- Quick probe:
  - implement content-packet canonical contract + one compiler run for an active business.
- Structured test:
  - generate site-content payload and replace hardcoded runtime module in one app (`apps/caryina`) with parity checks.
- Deferred validation:
  - compare cycle-time and manual-touch metrics across 2-3 launches.

### Prioritized Website Iteration Factory Backlog
| Priority | Item | Why now | Acceptance criteria | Dependencies | Evidence refs |
|---|---|---|---|---|---|
| P0 | WIF-01 Canonical `website-content-packet` Contract | Exists in practice, not standardized | Add canonical artifact row + required section schema + consumer rules in artifact registry | none | `artifact-registry.md`, content packet template |
| P0 | WIF-02 `compile-website-content-packet` Builder | Removes manual copy stitching | One command compiles packet from intake/offer/channels/product/logistics + source ledger + fail reasons | WIF-01 | WEBSITE-01 template, HBAG packet |
| P0 | WIF-03 Site Content Materializer | Eliminates hardcoded per-business content files | Generate typed runtime payload (for home/shop/PDP/support/policies/SEO metadata) consumed by app; no manual copy constants in app module | WIF-02 | `apps/caryina/src/lib/contentPacket.ts` |
| P0 | WIF-04 Artifact-Delta to Website-Backlog Mapper | Enables fast `v2+` iteration | On source artifact change, emit affected routes/blocks + suggested update tasks | WIF-01, WIF-02 | process-registry OFF-3, WEBSITE-02 workflow |
| P1 | WIF-05 SEO Bootstrap Generator | Makes L1 site SEO-ready on day one | Generate page metadata/keyword clusters/visible SEO blocks from packet with source traceability | WIF-02 | HBAG packet SEO sections |
| P1 | WIF-06 Claim-Safety Copy Lint | Prevents unsupported public claims | Lint fails on forbidden claims or copy not traceable to source evidence constraints | WIF-02 | HBAG packet constraints + product evidence |
| P1 | WIF-07 Physical-Product Policy Block Mapper | Uses LOGISTICS info where relevant | Shipping/returns/duties/support copy auto-populated from logistics/ops inputs for physical-product profiles | WIF-02 | aggregate-pack contracts (LOGISTICS) |
| P2 | WIF-08 Website Iteration Throughput Telemetry | Lets factory improve itself | Track `artifact-change -> live-site-change` lead time, manual edits, and rework count | WIF-03, WIF-04 | OFF-3 recurring iteration contract |

### Test Landscape
#### Test Infrastructure
- Contract tests:
  - schema checks for `website-content-packet` sections and required source ledger.
- Integration tests:
  - compiler output parity vs expected fixture.
  - materializer parity in app runtime for one business.
- Existing guardrails:
  - WEBSITE contract parity test: `scripts/src/startup-loop/__tests__/website-contract-parity.test.ts`

#### Coverage Gaps
- No standardized tests for content-packet generation across businesses.
- No tests ensuring runtime copy is generated instead of hardcoded.
- No diff-to-backlog test seam for WEBSITE-02 recurring iterations.

#### Recommended Test Approach
- Add golden fixtures for at least two profiles:
  - digital/low-logistics
  - physical-product/logistics-aware
- Add one end-to-end test:
  - source artifacts -> compiled packet -> generated runtime payload -> page metadata snapshot.

## Questions
### Resolved
- Q: Is there already enough information in the loop to build a good L1 site?
  - A: Yes. WEBSITE-01 required source map plus offer/channels/product evidence already provide adequate v1 inputs.
- Q: Is the main bottleneck missing research?
  - A: No. Main bottleneck is transformation and reuse of existing information into website iteration assets.

### Open (User Input Needed)
- Q: Should `website-content-packet` be mandatory for all `launch-surface=pre-website` businesses before DO build starts?
  - Why it matters: determines fail-closed vs optional behavior for WIF-01/02.
  - Decision impacted: gate strictness and launch consistency.
  - Default assumption + risk: default mandatory; risk is initial friction for first adoption cycle.
- Q: Should generated site-content payloads be committed to repo or built at runtime from markdown on each build?
  - Why it matters: affects determinism, diff reviewability, and CI speed.
  - Decision impacted: WIF-03 implementation architecture.
  - Default assumption + risk: commit generated artifacts for traceability; risk is larger diffs.

## Confidence Inputs
- Implementation: 85%
  - Evidence basis: patterns and artifacts already exist; work is normalization + automation.
  - Raise to >=90: complete WIF-01 to WIF-03 for one business.
- Approach: 94%
  - Evidence basis: directly addresses observed manual bottlenecks in WEBSITE-01 to runtime path.
  - Raise to >=90: already >=90.
- Impact: 92%
  - Evidence basis: targets copy/SEO/site-iteration throughput where repeated effort currently occurs.
  - Raise to >=90: already >=90.
- Delivery-Readiness: 82%
  - Evidence basis: prerequisites exist; standards and tooling need to be formalized.
  - Raise to >=90: pilot compiler/materializer on HBAG and run one replicate on a second business.
- Testability: 86%
  - Evidence basis: deterministic compile/materialize outputs are fixture-friendly.
  - Raise to >=90: add end-to-end fixture pipeline tests.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Overfitting content packet schema to one business pattern | Medium | Medium | Start with minimum required blocks + profile extensions |
| Generated copy becomes stale if source change triggers are weak | Medium | Medium-High | Add explicit artifact-delta mapper and CI check |
| Claim-safety lint false positives slow execution | Medium | Medium | Start with high-confidence forbidden claims and widen gradually |
| Runtime generation introduces build complexity | Medium | Medium | Prefer committed generated payload with deterministic builder |
| Logistics mapping is skipped for physical-product launches | Medium | High | Make LOGISTICS-aware policy blocks explicit in WIF-07 contract |

## Planning Constraints & Notes
- Must-follow patterns:
  - WEBSITE-01 remains the first-build contract and source-map authority.
  - OFF-3 remains process owner for recurring website content/merch iteration.
- Rollout expectations:
  - Pilot on HBAG path first, then extract business-agnostic contract.
- Observability expectations:
  - Track transformation latency and manual-touch count per iteration cycle.

## Suggested Task Seeds (Non-binding)
- TASK-WIF-01: Add canonical `website-content-packet` artifact contract to registry and process references.
- TASK-WIF-02: Build packet compiler from existing loop artifacts with traceability ledger.
- TASK-WIF-03: Replace hardcoded app copy module with generated typed payload consumption.
- TASK-WIF-04: Implement artifact-delta mapper to produce WEBSITE-02 iteration backlog seeds.
- TASK-WIF-05: Add SEO + claim-safety lint checks to pre-launch content gate.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `startup-loop`, `lp-do-plan`, `lp-launch-qa`
- Deliverable acceptance package:
  - standardized packet contract + compiler + runtime materializer + lint checks
- Post-delivery measurement plan:
  - compare first-launch and first-iteration lead times before vs after pipeline.

## Evidence Gap Review
### Gaps Addressed
- Confirmed the practical transformation gap from loop artifacts to runtime website copy.
- Confirmed existing per-business precedent (HBAG) and current hardcoded runtime limitation.

### Confidence Adjustments
- Impact confidence increased because gaps are implementation/contract gaps, not missing research.

### Remaining Assumptions
- Mandatory vs optional gate policy for `website-content-packet` remains an operator policy decision.
- Generated-artifact storage mode (committed vs runtime-generated) remains an architecture decision.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - none (policy choices can be defaulted and revisited)
- Recommended next step:
  - `/lp-do-plan docs/plans/startup-loop-new-business-launch-priorities/fact-find.md`
