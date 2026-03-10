---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Strategy
Workstream: Mixed
Created: 2026-02-26
Last-updated: 2026-02-26
Feature-Slug: startup-loop-naming-pipeline-science-upgrade
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-assessment-04-candidate-names, lp-do-assessment-05-name-selection, lp-do-factcheck
Related-Plan: docs/plans/startup-loop-naming-pipeline-science-upgrade/plan.md
Trigger-Why: Deep Research returned a high-confidence diagnosis that the current naming pipeline is structurally insufficient for world-class outcomes and needs a science-backed redesign.
Trigger-Intended-Outcome: type: measurable | statement: Upgrade the naming pipeline to a stage-gated probabilistic system that improves viable-finalist yield reliability to confidence-based targets while reducing false availability/legal-risk passes | source: operator
---

# Startup Loop Naming Pipeline Science Upgrade Fact-Find Brief

## Scope
### Summary
This fact-find converts the newly delivered Deep Research output into an evidence-first implementation brief for upgrading the startup-loop naming pipeline. It focuses on pipeline mechanics, data model requirements, risk gates, and measurable validation design.

### Goals
- Preserve the Deep Research output as a canonical source artifact.
- Audit current naming-pipeline implementation constraints in repository skills and strategy artifacts.
- Define implementation-ready work lanes for a probabilistic, stage-gated naming system.
- Identify minimum evidence and instrumentation needed before planning/build.

### Non-goals
- Generating new candidate brand names.
- Performing legal trademark clearance.
- Writing plan/build tasks in this run.

### Constraints & Assumptions
- Constraints:
  - `.com` availability remains a hard gate.
  - Legal/trademark outputs are risk-screening only, not legal advice.
  - Existing naming artifact contract (`naming-generation-spec`, `naming-candidates`, `naming-rdap`, `naming-shortlist`) must remain compatible.
- Assumptions:
  - Existing ASSESSMENT-04/05 pipeline remains the orchestration base and is upgraded in-place.
  - Multi-round historical artifacts are representative enough for initial calibration priors.

## Outcome Contract
- **Why:** Deep Research identifies critical structural gaps (RDAP semantics, fixed-N generation, uncalibrated scoring, weak upstream constraint capture) that materially reduce naming quality and repeatability.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Ship a pipeline upgrade that (1) removes RDAP false-signal behavior, (2) replaces heuristic score-only ranking with calibrated probabilistic ranking + uncertainty, and (3) introduces confidence-based yield planning (`P(Y>=K)`) and round-to-round learning.
- **Source:** operator

### Success Metrics (non-negotiable for planning)
- Reduce reround frequency by at least 25% at equal finalist target `K`.
- Improve viable-finalist yield per run by at least 20% against baseline.
- Improve ranking stability (Kendall tau across raters/runs) by at least 0.15.
- Achieve calibrated viability probabilities with Brier score improvement vs baseline heuristic proxy.

## Quantitative Implementation Contract
### Baseline Funnel Extraction (hard prerequisite)
No modeling work proceeds until baseline extraction is complete for recent rounds (`HEAD`, `HBAG`) and stored as a versioned artifact.

| Metric | Definition | Required for model? | Source path |
|---|---|---|---|
| `N_generated` | Total generated candidates by round and by pattern family | Yes | `naming-candidates-<date>.md` |
| `N_pass_lexical` | Pass count for lexical/risk screens (initially backfilled manually where absent) | Yes | new sidecar logs + shortlist notes |
| `N_pass_rdap` | Pass count + rate; include unknown/429/timeout buckets | Yes | `naming-rdap-<date>.txt` + new RDAP telemetry |
| `N_shortlisted` | Operator shortlist count | Yes | `naming-shortlist-<date>.user.md` |
| `N_finalists` | Final accepted names per round | Yes | strategy notes / operator decisions |
| `stage_time_minutes` | Operator/agent time per stage | Yes | run logs |
| `posthoc_regret` | Optional regret marker on rejected late names | Optional (v1) | retrospective annotations |

### Probabilistic Object Definition (v0)
- Candidate viability probability:
  - `p_i = P(candidate_i is viable finalist | x_i)` where viable finalist means pass all automated gates and survive operator shortlist.
- Gate probabilities:
  - `p_{i,g} = P(pass gate g | x_i)` for gate decomposition and diagnostics.
- Pairwise human preference:
  - `P(i > j | x)` using Bradley-Terry style pairwise model.
- Uncertainty outputs required per candidate:
  - `p_i_mean`, `ci90_lower`, `ci90_upper`, `rank_interval`.
- Shadow-mode objective (Wave 1):
  - Produce probabilistic outputs in parallel with legacy D/W/P/E/I ranking without changing hard production gates.

### Quant Stack BOM (required)
#### Tier 0 (mandatory, Wave 1)
| Need | Runtime commitment | Libraries |
|---|---|---|
| Data processing + schema validation | Python sidecar CLI (`tools/naminglab`) | `pandas`, `pyyaml`, `jsonschema` |
| Numerical simulation | Python | `numpy`, `scipy` |
| Deterministic string similarity | Python | `rapidfuzz` |
| Retry/backoff and resilience | Python | `tenacity` |
| Test harness | Python | `pytest`, `hypothesis` |

#### Tier 1 (mandatory, Wave 1 shadow)
| Need | Model choice | Libraries |
|---|---|---|
| Viability probability | Logistic baseline + calibration | `scikit-learn` |
| Pairwise ranking | Bradley-Terry/Plackett-Luce style model | `choix` (or local implementation) |
| Uncertainty | Bootstrap + calibrated probability intervals | `numpy`, `scikit-learn` |
| Gate-rate priors | Beta-Binomial updates | `numpy` |

#### Tier 2 (required in Wave 2 unless disproven by tests)
| Need | Model choice | Libraries |
|---|---|---|
| Phonetic risk features | Metaphone/phonetic encodings | `jellyfish` |
| Word familiarity | Zipf/frequency features | `wordfreq` |
| Transliteration normalization | Multi-language normalization | `Unidecode` |

#### Tier 3 (optional, only if Tier 1/2 underperform)
| Need | Model choice | Libraries |
|---|---|---|
| Hierarchical Bayesian rater drift | Full Bayesian model | `pymc`, `arviz` |
| Multi-objective search at scale | Pareto optimization | `pymoo` or `nevergrad` |

### Event Log + Sidecar Schema (required)
All pipeline runs must emit structured sidecar events in addition to markdown artifacts.

```json
{
  "run_id": "uuid",
  "round_id": "2026-02-22-r6",
  "candidate_id": "uuid",
  "name": "example",
  "pattern_family": "A",
  "features": {
    "length": 9,
    "zipf": 3.2,
    "metaphone": "AKSMPL",
    "min_edit_distance_competitor": 3
  },
  "gate": {
    "rdap": { "result": "available", "http_status": 404, "retries": 1, "latency_ms": 220 },
    "lexicon": { "flag_negative": false, "flag_claim": false, "markets": ["it", "en"] },
    "confusion_proxy": { "risk_score": 0.24, "nearest_marks": ["markA"] }
  },
  "human": {
    "ratings": [{ "rater_id": "op-1", "rubric_version": "v2", "dims": { "D": 4, "W": 4, "P": 5, "E": 4, "I": 5 } }],
    "pairwise": [{ "vs_candidate_id": "uuid-2", "winner": "self" }]
  },
  "model": {
    "p_viable": 0.61,
    "ci90": [0.47, 0.73],
    "model_version": "v0.1-shadow"
  }
}
```

### Wave 1 Delivery Contract (committed)
Wave 1 is not RDAP-only. Wave 1 must ship three things together:
1. Standards-conformant RDAP correctness + telemetry.
2. Structured event logging + baseline funnel extraction.
3. Shadow probabilistic scoring path producing `p_viable` + uncertainty in parallel to legacy ranking.

### Yield Planning Method (required math)
Replace fixed `N=250` planning with confidence-based target sizing.
- Candidate-level survival:
  - `Y = sum_{i=1..N} Bernoulli(p_i)` where `p_i` is modeled viability probability.
- Planning gate:
  - Find smallest `N` such that `P(Y>=K) >= 0.95`.
- Computation:
  - Default Monte Carlo estimator (fast path).
  - Optional Poisson-binomial approximation for cross-check.
  - Report both expected yield `E[Y]` and confidence interval.

## Evidence Audit (Current State)
### Entry Points
- `.claude/skills/lp-do-assessment-04-candidate-names/SKILL.md` - canonical ASSESSMENT-04 pipeline orchestrator.
- `.claude/skills/lp-do-assessment-05-name-selection/SKILL.md` - canonical ASSESSMENT-05 spec-authoring and rubric contract.
- `docs/business-os/strategy/HEAD/2026-02-22-naming-generation-spec.md` - active multi-round spec showing real-world guardrails and elimination logic.
- `docs/business-os/strategy/HBAG/2026-02-21-naming-research-summary.user.md` - prior naming research summary and domain-first framing.
- `docs/business-os/strategy/HBAG/candidate-names-prompt-r2.md` - prior deep-research prompt baseline.
- `docs/plans/startup-loop-naming-pipeline-science-upgrade/deep-research-response-2026-02-26.md` - new source research (saved verbatim).

### Key Modules / Files
- `.claude/skills/lp-do-assessment-04-candidate-names/SKILL.md`
  - Enforces sequential Part 1-5 flow and quality gate behavior.
  - Hardcodes generation count to 250 and downstream filtering/ranking expectations.
- `.claude/skills/lp-do-assessment-05-name-selection/SKILL.md`
  - Defines D/W/P/E/I rubric and fixed pattern distributions.
  - Defines RDAP protocol language used by downstream checks.
- `docs/business-os/strategy/HEAD/2026-02-22-naming-generation-spec.md`
  - Demonstrates production usage with Round 6 history and territory gates.
  - Shows local policy evolution (I hard gate, anti-criteria expansion, elimination ledger growth).
- `docs/business-os/strategy/HEAD/naming-candidates-2026-02-22-r6.md`
  - Evidence that generation can produce large candidate sets but still requires heavy post-filtering.
- `docs/business-os/strategy/HEAD/naming-rdap-2026-02-22-r6.txt`
  - Evidence of current RDAP artifact contract and status-based filtering.
- `docs/business-os/strategy/HEAD/naming-shortlist-2026-02-22-r6.user.md`
  - Evidence of top-20 ranking behavior and score band reporting.

### Patterns & Conventions Observed
- Current pipeline contract is fixed-length generation (`exactly 250`), then RDAP gate, then top-20 shortlist ranking.
  - Evidence: `.claude/skills/lp-do-assessment-04-candidate-names/SKILL.md` (Part 2 prompt and Part 4 ranking rules).
- Current score framing uses D/W/P/E/I with legacy heuristic bands (high-priority `>=18`, shortlist `>=14`).
  - Evidence: `.claude/skills/lp-do-assessment-05-name-selection/SKILL.md`.
- Current pattern allocations are fixed by rule (A/B/C/D/E counts) rather than yield-adaptive.
  - Evidence: `.claude/skills/lp-do-assessment-05-name-selection/SKILL.md`.
- Automatic reround trigger is based on available-name count and score threshold, not probabilistic forecast.
  - Evidence: `.claude/skills/lp-do-assessment-04-candidate-names/SKILL.md` (`<10 available names >=14`).
- Active production specs have already introduced stricter contextual gates (e.g., I hard gate, territory integrity tests), indicating drift beyond base template.
  - Evidence: `docs/business-os/strategy/HEAD/2026-02-22-naming-generation-spec.md`.

### Data & Contracts
- Types/schemas/events:
  - Implicit contract across files per round:
    - `<date>-naming-generation-spec.md`
    - `naming-candidates-<date>.md`
    - `naming-rdap-<date>.txt`
    - `naming-shortlist-<date>.user.md` (+ `.user.html`)
  - No explicit probabilistic metadata schema observed (no posterior/CI/rank-interval fields).
- Persistence:
  - Strategy-folder per-business artifacts persist full round history (`HEAD` and `HBAG` both show multi-round archives).
- API/contracts:
  - RDAP check currently operationalized as HTTP status interpretation around `rdap.verisign.com` endpoint in skill scripts.
  - Registrar-price confirmation requirement exists in spec text, but no automated structured field observed in artifacts.

### Dependency & Impact Map
- Upstream dependencies:
  - ASSESSMENT problem/option/brand docs feeding ASSESSMENT-05 spec authoring.
  - Startup-loop sequencing and skill contracts.
- Downstream dependents:
  - Name confirmation feeds subsequent startup-loop stages (distribution, measurement, brand execution).
  - Any naming scoring/routing changes affect candidate generation prompts, shortlist quality gates, and operator review burden.
- Likely blast radius:
  - Skills: `lp-do-assessment-04-candidate-names`, `lp-do-assessment-05-name-selection`.
  - Strategy artifacts structure and parser expectations.
  - Any reporting/ops scripts relying on current score bands or fixed candidate counts.
  - Operator workflows currently trained on D/W/P/E/I + threshold semantics.

### Delivery & Channel Landscape
- Audience/recipient:
  - Startup-loop operator (decision owner), skill maintainers, and implementation agent(s).
- Channel constraints:
  - Primary channel is markdown artifacts in repo.
  - Execution environment uses skill-driven orchestration and shell-based RDAP checks.
- Existing templates/assets:
  - Existing naming-spec and shortlist templates in ASSESSMENT-04/05 skills.
  - Multiple historical strategy artifacts for calibration and retrospective analysis.
- Approvals/owners:
  - Operator approves shortlist outcomes and rerounds.
  - Skill maintainers approve contract-level changes in ASSESSMENT pipeline.
- Compliance constraints:
  - Trademark risk handling is screening only in-pipeline.
  - Claim-risk and regulatory language controls required for regulated categories.
- Measurement hooks:
  - Current measurable hooks are mostly counts/bands in shortlist artifacts.
  - No formal reliability, calibration, or forecast-accuracy telemetry in current contract.
  - No structured candidate-level sidecar schema in current contract.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Standards-conformant RDAP handling will reduce false availability outcomes vs current status-only checks | RDAP client redesign + replay set | Medium | 1-2 weeks |
| H2 | Probabilistic scoring with uncertainty yields more stable top-20 than heuristic composite score only | Historical rounds + pairwise rater data | Medium-High | 2-4 weeks |
| H3 | Dynamic pattern allocation outperforms fixed A/B/C/D/E quotas on viable survivors per round | Per-pattern outcome logging + controller | Medium | 2-3 weeks |
| H4 | Pre-generation MRD gate reduces late-stage legal/language eliminations | MRD schema + gating adoption | Medium | 2-4 weeks |
| H5 | Reliability gating (inter-rater) reduces shortlist volatility and reround churn | Human evaluation protocol | Medium | 2-4 weeks |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Deep research identifies RDAP semantics/operational risk as top critical fix; current skills use status-centric protocol | `deep-research-response-2026-02-26.md`, ASSESSMENT-04/05 skills | Medium-High |
| H2 | Current score model is heuristic and threshold-based; deep research provides probabilistic alternative | ASSESSMENT-05 skill + deep research | Medium |
| H3 | Current pattern allocations are fixed; multi-round artifacts show changing yield profiles | ASSESSMENT-05 skill + HEAD round artifacts | Medium |
| H4 | Current pre-generation intake lacks explicit MRD structure | ASSESSMENT-05 required inputs + deep research MRD | Medium |
| H5 | Current process has no explicit reliability gates | ASSESSMENT-04/05 outputs and shortlist artifacts | Medium |
| H6 | Current process has no committed computational runtime/library stack for modeling | Fact-find audit + skill contracts | High |

#### Falsifiability Assessment
- Easy to test:
  - RDAP client behavior vs replay datasets and known outcomes.
  - Forecasted vs observed viable-yield error by round.
- Hard to test:
  - True legal-confusion outcome without downstream legal review feedback loops.
  - Long-term brand-performance impact from naming choices.
- Validation seams needed:
  - Structured event logging across generation, gating, and ranking.
  - Human pairwise judgment protocol with rater metadata.

#### Recommended Validation Approach
- Quick probes:
  - Run RDAP replay audit on prior round names using standards-conformant client.
  - Backtest fixed-threshold ranking vs probabilistic rerank on prior round artifacts.
- Structured tests:
  - Pilot two rounds with dynamic allocation controller and compare viable yield + reround count.
  - Introduce inter-rater protocol and measure reliability before/after rubric changes.
  - Measure calibration quality (`Brier`, `log loss`, reliability curve) for shadow model.
- Deferred validation:
  - Correlate shortlisted names with downstream conversion/engagement only after sufficient deployment cycles.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - No dedicated naming-pipeline test suite discovered in current skill artifacts.
  - No existing Python-side quantitative harness discovered in naming scope.
- Commands:
  - Operational checks are shell/script driven (`curl` RDAP loops, artifact generation flows).
- CI integration:
  - No explicit CI gates found for naming-pipeline quality metrics in reviewed artifacts.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Naming pipeline contract | Manual artifact inspection + skill-level quality gates | ASSESSMENT-04/05 skills + strategy round outputs | Process guards exist, but no automated calibration/reliability tests observed |
| Quantitative scoring | Not implemented | Not investigated in current naming artifacts | Gap to be filled by Wave 1 shadow-mode harness |

#### Coverage Gaps
- Untested paths:
  - RDAP semantics under rate-limits/edge responses.
  - Probabilistic score calibration drift over rounds.
  - Pattern allocation policy performance under changing priors.
  - Sidecar schema compatibility and replay determinism.
- Extinct tests:
  - Not investigated: no archived automated naming tests identified in this run.

#### Testability Assessment
- Easy to test:
  - Deterministic gate functions and schema validation.
- Hard to test:
  - Human preference stability without panel protocol.
- Test seams needed:
  - Event logs, replay datasets, and benchmark corpora for competitor/trademark neighborhoods.

#### Recommended Test Approach
- Unit tests for:
  - RDAP response classification and retry/backoff logic.
  - Gate calculators and threshold/risk policy functions.
  - Feature extraction and schema validation for candidate sidecars.
- Integration tests for:
  - End-to-end run artifact generation with mock RDAP responses.
  - Multi-round priors update and allocation controller behavior.
  - Shadow path output parity (legacy artifacts unchanged + probabilistic sidecar emitted).
- E2E tests for:
  - Operator-facing shortlist generation and reround triggering.
- Contract tests for:
  - Artifact schemas and required metadata compatibility.
  - Sidecar JSON schema and versioning compatibility.

### Recent Git History (Targeted)
- `docs/business-os/strategy/HEAD/2026-02-22-naming-generation-spec.md` and related naming prompt/spec files show only broad workspace checkpoint commits in the current visible history sample.
  - Evidence: `git log --oneline -- <target paths>` returned `19b4c203f0` and `39b9863cfb` generic checkpoint commits.
  - Implication: commit-level intent traceability for naming pipeline changes is weak; planning should include explicit change records.

## External Research (If Needed)
- Finding: Deep Research identifies four structural deficits in the current pipeline (constraint under-specification, uncalibrated heuristic scoring, RDAP operational fragility, no multi-round learning).
  - Source: `docs/plans/startup-loop-naming-pipeline-science-upgrade/deep-research-response-2026-02-26.md`
- Finding: Recommended target architecture is stage-gated + probabilistic + multi-objective with explicit uncertainty and learning loops.
  - Source: `docs/plans/startup-loop-naming-pipeline-science-upgrade/deep-research-response-2026-02-26.md`

## Questions
### Resolved
- Q: Should this run continue into planning automatically?
  - A: No. Operator explicitly instructed to stop after fact-find artifact production.
  - Evidence: direct user instruction in this run.
- Q: Is the current naming pipeline purely theoretical or already in active multi-round use?
  - A: It is active and multi-round in strategy artifacts (`HEAD` and `HBAG` directories include spec/candidates/rdap/shortlist histories).
  - Evidence: `docs/business-os/strategy/HEAD/*naming*`, `docs/business-os/strategy/HBAG/*naming*`.
- Q: Is a hard `.com` gate already codified as policy?
  - A: Yes; current skills and specs treat `.com` as hard gate for shortlist progression.
  - Evidence: ASSESSMENT-04/05 skills and active naming specs.
- Q: Does current pipeline contain probabilistic calibration outputs (confidence intervals, rank intervals)?
  - A: No explicit probabilistic output fields were found in reviewed artifacts.
  - Evidence: naming spec/candidate/shortlist artifacts reviewed in `HEAD` and `HBAG`.
- Q: Should Wave 1 be RDAP-only or include probabilistic work?
  - A: Wave 1 must include shadow probabilistic scoring (non-gating) plus RDAP hardening and instrumentation. This is the minimum viable science path that avoids stalling after infrastructure-only work.
  - Evidence: Deep Research recommendations + current contract gaps in this fact-find.

### Open (Operator Input Required)
- None at fact-find stage. Sequencing ambiguity is resolved by default to Wave 1 hybrid (RDAP + logs + shadow model).

## Confidence Inputs
- Implementation: 78%
  - Evidence basis: skill contracts and artifact landscape are clear; core pipeline touchpoints are localized.
  - Raise to >=80: confirm exact code/script ownership for RDAP and ranking execution paths.
  - Raise to >=90: complete one replay-backed prototype proving improved gate correctness without artifact contract breakage.
- Approach: 84%
  - Evidence basis: deep research gives coherent architecture and method stack; current gaps are concrete.
  - Raise to >=80: already met.
  - Raise to >=90: add one benchmarked alternative architecture comparison (minimal vs full Bayesian stack) with costed tradeoffs.
- Impact: 82%
  - Evidence basis: current pain points align directly with proposed interventions (yield reliability, false positives, reround churn).
  - Raise to >=80: already met.
  - Raise to >=90: quantify baseline failure rates from recent rounds and model expected deltas per intervention.
- Delivery-Readiness: 74%
  - Evidence basis: evidence and source artifact are complete, and Wave 1 sequencing now committed to hybrid shadow mode.
  - Raise to >=80: finalize repository location and owner for `tools/naminglab` runtime.
  - Raise to >=90: secure explicit owner mapping and acceptance metrics for each implementation lane.
- Testability: 72%
  - Evidence basis: test seams are identifiable; harness design is now defined but not implemented.
  - Raise to >=80: implement minimal replay harness + artifact/sidecar contract tests.
  - Raise to >=90: add inter-rater protocol and calibration metrics into CI-grade reporting.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| RDAP semantics still misinterpreted in edge conditions | Medium | High | Build standards-conformant client + replay tests + rate-limit handling telemetry |
| Over-complex modelling delays practical delivery | Medium | High | Stage implementation (Wave 1 correctness/instrumentation, Wave 2 probabilistic ranking) |
| Legacy artifact consumers break on schema changes | Medium | High | Preserve current artifact contract and add additive metadata only initially |
| Legal-risk proxy overconfidence | Medium | High | Keep proxy as triage only and require explicit legal escalation path |
| Cross-lingual lexicon bias creates false positives/negatives | Medium | Medium-High | Human review loop on Tier-1 markets and periodic bias audit |
| Stakeholder preference drift invalidates calibration | Medium | Medium | Freeze round-level rubric versions and track raters |
| Data sparsity weakens priors early | High | Medium | Use conservative priors and emphasize exploration in early rounds |
| Planning scope creep combines too many changes at once | High | Medium-High | Gate by measurable milestones and explicit wave boundaries |
| Quant stack remains aspirational and never operationalized | Medium | High | Require Wave 1 shadow-mode outputs and sidecar schema as acceptance gates |

## Planning Constraints & Notes
- Must-follow patterns:
  - Maintain hard `.com` gate.
  - Keep legal outputs as risk-screening, not legal advice.
  - Preserve canonical naming artifact paths and filenames.
  - Keep legacy ranking path active until shadow-model calibration passes thresholds.
- Rollout/rollback expectations:
  - Roll out behind feature toggles or mode flags where possible.
  - Preserve ability to run legacy ranking path during initial validation.
- Observability expectations:
  - Add event logs for gate outcomes, failure reasons, and calibration metrics from first implementation slice.
  - Emit sidecar model outputs on every run in Wave 1 (even when not gating).

## Suggested Task Seeds (Non-binding)
- TASK-01: RDAP standards-conformance hardening (bootstrap, response parsing, retry/backoff, telemetry).
  - Acceptance: replay set pass-rate target met; unknown/429 tracked; deterministic retry policy tested.
- TASK-02: Baseline funnel extraction + MRD schema + readiness gate.
  - Acceptance: baseline table persisted for recent rounds; MRD validator blocks under-specified runs.
- TASK-03: Shadow probabilistic viability model (`p_viable` + `ci90`) in parallel with legacy score.
  - Acceptance: sidecar output emitted for all candidates; calibration metrics (`Brier`, `log loss`) reported.
- TASK-04: Dynamic allocation controller v0 (Beta-Binomial + Thompson sampling by pattern family).
  - Acceptance: controller outputs next-round allocation with logged priors/posteriors.
- TASK-05: Trademark/confusion proxy and cross-lingual risk-screen module (triage only).
  - Acceptance: explainable risk flags with nearest-neighbor evidence; no legal-clearance claims.
- TASK-06: Validation harness (replay tests, reliability protocol, calibration dashboards, schema CI checks).
  - Acceptance: CI job fails on schema drift or calibration regression beyond threshold.
- TASK-07: Artifact compatibility layer + migration notes for operators.
  - Acceptance: legacy markdown artifacts unchanged in structure; additive sidecar path documented and validated.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-do-assessment-04-candidate-names`
  - `lp-do-assessment-05-name-selection`
  - `lp-do-factcheck`
- Deliverable acceptance package:
  - Updated skill contracts for ASSESSMENT-04/05
  - Replay-validated RDAP client behavior report
  - Baseline funnel report + shadow-model calibration report with measurable deltas
  - Quant stack BOM and runtime owner decision (`tools/naminglab`)
  - Backward-compatible artifact output examples
- Post-delivery measurement plan:
  - Track per-round viable yield, reround rate, false-availability corrections, ranking stability metrics, and calibration drift.

## Evidence Gap Review
### Gaps Addressed
- Preserved Deep Research output verbatim as canonical input artifact.
- Mapped research claims to current repository skill contracts and active multi-round artifacts.
- Identified concrete implementation seams and measurable validation paths.

### Confidence Adjustments
- Increased Approach confidence after confirming current-state evidence alignment with research diagnosis.
- Reduced Delivery-Readiness/Testability from optimistic levels due to absent harness implementation and unresolved runtime ownership for `tools/naminglab`.

### Remaining Assumptions
- Assumes current naming artifacts represent representative failure distributions for calibration bootstrapping.
- Assumes existing skill-based orchestration remains the correct integration surface.
- Assumes operator accepts staged rollout rather than one-shot full replacement.
- Assumes Python sidecar runtime is acceptable for quantitative components while preserving markdown-first outputs.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - Assign runtime ownership for quantitative sidecar implementation (`tools/naminglab`) and CI integration.
- Recommended next step:
  - `/lp-do-plan startup-loop-naming-pipeline-science-upgrade --auto` (deferred in this run per explicit operator instruction to stop after fact-find).
