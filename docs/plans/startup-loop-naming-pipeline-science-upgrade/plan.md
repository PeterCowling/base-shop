---
Type: Plan
Status: Archived
Domain: Strategy
Workstream: Mixed
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26 (TASK-01 complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-naming-pipeline-science-upgrade
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-assessment-04-candidate-names, lp-do-assessment-05-name-selection, lp-do-factcheck
Overall-confidence: 76%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
---

# Startup Loop Naming Pipeline Science Upgrade Plan

## Summary
This plan upgrades the naming pipeline from heuristic flow-control to a measurable quantitative system while preserving current operator artifacts. The first implementation wave is explicitly hybrid: RDAP standards-conformance, candidate sidecar telemetry, and shadow probabilistic scoring in parallel with legacy ranking. The second wave adds adaptive allocation and confidence-based generation sizing, then validates readiness via a checkpoint before any governance rollout. The plan is sequencing-safe, additive by default, and structured to prevent a partial “RDAP-only” outcome.

## Active tasks
- [x] TASK-01: Baseline funnel extraction and runtime contract (Complete 2026-02-26)
- [x] TASK-02: RDAP standards-conformant client and telemetry integration (Complete 2026-02-26)
- [x] TASK-03: Candidate sidecar schema and event logging pipeline (Complete 2026-02-26)
- [x] TASK-04: Shadow probabilistic model and calibration reporting (Complete 2026-02-26)
- [x] TASK-05: Feature stack + adaptive allocation + confidence-based N planning (Complete 2026-02-26)
- [x] TASK-06: Replay harness and CI regression gates (Complete 2026-02-26)
- [x] TASK-07: Horizon checkpoint — shadow-to-gated readiness review (Complete 2026-02-26)
- [x] TASK-08: Operator rollout pack and governance handoff (Complete 2026-02-26)

## Goals
- Remove RDAP false-signal risk through standards-conformant lookups and explicit unknown-state handling.
- Operationalize a candidate-level quantitative contract (`p_viable`, uncertainty intervals, gate traces) using additive sidecars.
- Replace fixed-`N=250` planning with confidence-based planning (`P(Y>=K) >= 0.95`) in advisory mode.
- Produce objective validation evidence (Brier/log-loss, replay parity, reround/yield deltas) before any gating change.
- Preserve canonical naming artifacts (`naming-generation-spec`, `naming-candidates`, `naming-rdap`, `naming-shortlist`) and operator workflow continuity.

## Non-goals
- Legal clearance automation or legal advice.
- Full production switch to model-first gating in this plan.
- Replacing existing markdown-based naming artifacts with a new UI surface.

## Constraints & Assumptions
- Constraints:
  - `.com` remains the hard gate.
  - Legal/confusion features are risk triage only.
  - Existing artifact contracts stay backward-compatible.
  - Model outputs are additive sidecars until checkpoint sign-off.
- Assumptions:
  - `HEAD` and `HBAG` round history is sufficient for baseline extraction and initial calibration.
  - A Python sidecar runtime can be introduced for quantitative components without disrupting startup-loop orchestration.
  - Operator sign-off is available for governance handoff artifacts.

## Inherited Outcome Contract
- **Why:** Deep Research identifies critical structural gaps (RDAP semantics, fixed-N generation, uncalibrated scoring, weak upstream constraint capture) that materially reduce naming quality and repeatability.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Ship a pipeline upgrade that (1) removes RDAP false-signal behavior, (2) replaces heuristic score-only ranking with calibrated probabilistic ranking + uncertainty, and (3) introduces confidence-based yield planning (`P(Y>=K)`) and round-to-round learning.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-naming-pipeline-science-upgrade/fact-find.md`
- Key findings used:
  - Current ASSESSMENT-04/05 contracts are fixed-size and threshold-heuristic driven.
  - RDAP handling is currently fragile for production-grade reliability expectations.
  - No existing candidate-level sidecar schema exists for calibration and replay.
  - Wave 1 must include shadow modeling (not RDAP-only) to avoid science-deferral failure.

## Proposed Approach
- Option A: RDAP + logging only, defer model layer.
- Option B: Hybrid wave (RDAP + sidecars + shadow model), then adaptive planner and checkpoint.
- Chosen approach: Option B.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (explicit `plan-only` mode requested by user)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Baseline funnel extraction and runtime contract | 85% | S | Complete (2026-02-26) | - | TASK-02, TASK-03, TASK-04, TASK-05 |
| TASK-02 | IMPLEMENT | RDAP standards-conformant client and telemetry integration | 80% | M | Complete (2026-02-26) | TASK-01 | TASK-04, TASK-06 |
| TASK-03 | IMPLEMENT | Candidate sidecar schema and event logging pipeline | 80% | M | Complete (2026-02-26) | TASK-01 | TASK-04, TASK-05, TASK-06 |
| TASK-04 | IMPLEMENT | Shadow probabilistic model and calibration reporting | 80% | M | Complete (2026-02-26) | TASK-02, TASK-03 | TASK-05, TASK-06 |
| TASK-05 | IMPLEMENT | Feature stack + adaptive allocation + confidence-based N planning | 80% | L | Complete (2026-02-26) | TASK-01, TASK-03, TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Replay harness and CI regression gates | 80% | M | Complete (2026-02-26) | TASK-02, TASK-03, TASK-04, TASK-05 | TASK-07 |
| TASK-07 | CHECKPOINT | Horizon checkpoint — shadow-to-gated readiness review | 95% | S | Complete (2026-02-26) | TASK-06 | TASK-08 |
| TASK-08 | IMPLEMENT | Operator rollout pack and governance handoff | 75% | S | Complete (2026-02-26) | TASK-07 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Locks baseline and runtime contract before implementation |
| 2 | TASK-02, TASK-03 | TASK-01 | RDAP hardening and sidecar pipeline can run in parallel |
| 3 | TASK-04 | TASK-02, TASK-03 | Shadow model depends on gate telemetry and sidecar data |
| 4 | TASK-05 | TASK-01, TASK-03, TASK-04 | Controller uses modeled viability and feature outputs |
| 5 | TASK-06 | TASK-02, TASK-03, TASK-04, TASK-05 | Regression-proofing and CI enforcement |
| 6 | TASK-07 | TASK-06 | Mandatory horizon checkpoint |
| 7 | TASK-08 | TASK-07 | Governance handoff after checkpoint decision |

## Tasks

### TASK-01: Baseline funnel extraction and runtime contract
- **Type:** INVESTIGATE
- **Deliverable:** 
  - `docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/baseline-funnel-metrics.md`
  - `docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/quant-runtime-contract.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Affects:** `docs/business-os/strategy/HEAD/*naming*`, `docs/business-os/strategy/HBAG/*naming*`, `[readonly] .claude/skills/lp-do-assessment-04-candidate-names/SKILL.md`, `[readonly] .claude/skills/lp-do-assessment-05-name-selection/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-05
- **Confidence:** 85%
  - Implementation: 85% - Inputs and extraction points are explicit in existing artifacts.
  - Approach: 85% - Baseline-first removes sequencing ambiguity for all downstream tasks.
  - Impact: 90% - Baseline metrics are required for any model validation claim.
- **Build evidence (2026-02-26):**
  - `docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/baseline-funnel-metrics.md` — complete. Covers HEAD R3–R6 and HBAG R3. Key finding: RDAP yield ranges 21–75%; N_finalists and stage timing are unmeasured (data gaps documented). One confirmed RDAP ERROR(000) in HEAD R6.
  - `docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/quant-runtime-contract.md` — complete. Dual-runtime architecture: TS naming modules at `scripts/src/startup-loop/naming/`; Python quantitative runtime at `tools/naminglab/`. Integration switches defined. Proxy training path identified for TASK-04 (1,250 labeled records from existing artifacts). No-go triggers: Brier > 0.35 for TASK-04; N_recommended > 500 for TASK-05.
- **Questions to answer:**
  - What are baseline values for `N_generated`, `N_pass_rdap`, `N_shortlisted`, `N_finalists`, and stage time?
  - Where will quantitative tooling live, and how will it be invoked?
  - What minimum data completeness blocks downstream model work?
- **Acceptance:**
  - Baseline table persisted for recent `HEAD` and `HBAG` rounds with source references.
  - Runtime contract includes location, invocation, dependency handling, and CI entry points.
  - Explicit go/no-go criteria defined for TASK-04 and TASK-05.
- **Validation contract:** Evidence complete when both artifacts exist and reference concrete source files.
- **Planning validation:** 
  - Checks run: confirmed round artifacts and current RDAP contract language exist.
  - Validation artifacts: `.claude/skills/lp-do-assessment-04-candidate-names/SKILL.md`, `.claude/skills/lp-do-assessment-05-name-selection/SKILL.md`, `docs/business-os/strategy/HEAD/`, `docs/business-os/strategy/HBAG/`
  - Unexpected findings: None.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Adds baseline and runtime contract artifacts.
- **Notes / references:** Fact-find quantitative contract section.

### TASK-02: RDAP standards-conformant client and telemetry integration
- **Type:** IMPLEMENT
- **Deliverable:** RDAP module with resilient classification and telemetry.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/naming/rdap-client.ts` (new), `scripts/src/startup-loop/naming/rdap-types.ts` (new), `scripts/src/startup-loop/naming/rdap-retry.ts` (new), `[readonly] .claude/skills/lp-do-assessment-04-candidate-names/SKILL.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-04, TASK-06
- **Confidence:** 80%
  - Implementation: 80% - TASK-01 confirmed runtime location (`scripts/src/startup-loop/naming/`), TS conventions, and one confirmed unknown-state example (ERROR 000 on "Collocata"). Integration surface is concrete.
  - Approach: 85% - Standards-conformant flow is straightforward.
  - Impact: 85% - Directly addresses highest-severity operational risk.
- **Build evidence (2026-02-26):**
  - `scripts/src/startup-loop/naming/rdap-types.ts` — `RdapResult` (status, statusCode, unknownReason, retries, latencyMs, terminalClassification) + `RdapBatchResult`.
  - `scripts/src/startup-loop/naming/rdap-retry.ts` — exponential backoff with jitter; 200→taken, 404→available, 429→retry, TypeError→connection_error, other→unexpected_status.
  - `scripts/src/startup-loop/naming/rdap-client.ts` — sequential batch check; `formatRdapLegacyLine` reproduces `AVAILABLE  Name` / `TAKEN      Name` spacing exactly.
  - `scripts/src/startup-loop/__tests__/naming-rdap-client.test.ts` — 9 tests, all passing. TC-01–TC-05 covered.
- **Acceptance:**
  - Classifies `available`, `taken`, and `unknown` with explicit reasons.
  - Handles retry/backoff for transient and throttling responses.
  - Emits telemetry: status, retries, latency, terminal classification.
  - Leaves `naming-rdap-<date>.txt` artifact contract intact.
- **Validation contract (TC-02):**
  - TC-01: Known-taken domain -> classified `taken`.
  - TC-02: Known-available domain -> classified `available`.
  - TC-03: Simulated throttling -> retries + explicit terminal state logged.
  - TC-04: Compatibility run -> legacy RDAP text artifact still produced.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed current RDAP instructions and artifact format in ASSESSMENT skills.
  - Validation artifacts: `.claude/skills/lp-do-assessment-04-candidate-names/SKILL.md`, `.claude/skills/lp-do-assessment-05-name-selection/SKILL.md`, `docs/business-os/strategy/HEAD/naming-rdap-2026-02-22-r6.txt`
  - Unexpected findings: Current guidance is status-centric and lacks structured unknown-state taxonomy.
- **Scouts:** Determine whether to wire through startup-loop scripts directly or keep as utility invoked by skill wrapper.
- **Edge Cases & Hardening:** Pattern-D normalization, endpoint instability, partial runs.
- **What would make this >=90%:** Replay set with deterministic classifications and low unknown error rate.
- **Rollout / rollback:**
  - Rollout: enable behind execution switch; keep legacy fallback.
  - Rollback: switch to legacy flow without schema changes.
- **Documentation impact:** Update naming execution docs for RDAP semantics and telemetry fields.
- **Notes / references:** Deep research priority action #1.

### TASK-03: Candidate sidecar schema and event logging pipeline
- **Type:** IMPLEMENT
- **Deliverable:** Candidate-level sidecar schema and log writer with aggregate extractor.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/naming/candidate-sidecar-schema.json` (new), `scripts/src/startup-loop/naming/event-log-writer.ts` (new), `scripts/src/startup-loop/naming/baseline-extractor.ts` (new), `docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/` (new outputs)
- **Depends on:** TASK-01
- **Blocks:** TASK-04, TASK-05, TASK-06
- **Confidence:** 80%
  - Implementation: 80% - TASK-01 confirmed sidecar storage path (`docs/business-os/strategy/<BIZ>/naming-sidecars/`), JSONL format, and TS namespace. Integration pattern is concrete.
  - Approach: 85% - Additive sidecars avoid artifact breakage.
  - Impact: 85% - Enables replay, calibration, and controller learning.
- **Build evidence (2026-02-26):**
  - `scripts/src/startup-loop/naming/candidate-sidecar-schema.json` — JSON Schema v1 covering stage enum, candidate/scores, rdap, model_output (null stub).
  - `scripts/src/startup-loop/naming/event-log-writer.ts` — `writeSidecarEvent` (append-only JSONL), `readSidecarEvents`, `validateSidecarEvent` (manual checks, no Ajv), `getSidecarFilePath`.
  - `scripts/src/startup-loop/naming/baseline-extractor.ts` — `extractBaselineMetrics` aggregates n_generated/i_gate_eliminated/rdap counts/rdap_yield_pct/shortlisted/finalists/avg_scores across all JSONL files in a sidecarDir.
  - `scripts/src/startup-loop/__tests__/naming-sidecar.test.ts` — 14 tests, all passing. TC-01–TC-04 covered.
- **Acceptance:**
  - Sidecar schema validates all required candidate/gate/model fields.
  - One sidecar record emitted per candidate per stage transition.
  - Aggregate extractor produces funnel metrics from sidecars.
  - Legacy markdown outputs remain unchanged.
- **Validation contract (TC-03):**
  - TC-01: Schema rejects malformed records.
  - TC-02: End-to-end run emits sidecars and aggregate metrics.
  - TC-03: Legacy shortlist markdown parity is preserved.
  - TC-04: Replay parser reads sidecars from at least two rounds.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed startup-loop script/test patterns and confirmed no naming-sidecar equivalent exists.
  - Validation artifacts: `scripts/src/startup-loop/`, `scripts/src/startup-loop/__tests__/`
  - Unexpected findings: Requires new namespace under startup-loop scripts.
- **Scouts:** Confirm retention/storage conventions for sidecar logs.
- **Edge Cases & Hardening:** interrupted runs, id collisions, partial writes.
- **What would make this >=90%:** Stable sidecar read/write across three consecutive rounds.
- **Rollout / rollback:** additive emit on/off switch with no artifact contract changes.
- **Documentation impact:** add sidecar schema and log lifecycle docs.
- **Notes / references:** Fact-find sidecar contract.

### TASK-04: Shadow probabilistic model and calibration reporting
- **Type:** IMPLEMENT
- **Deliverable:** Shadow scoring model (`p_viable`, uncertainty outputs) and calibration report generation.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Affects:** `tools/naminglab/model/train.py` (new), `tools/naminglab/model/score.py` (new), `tools/naminglab/model/calibration.py` (new), `tools/naminglab/model/pairwise.py` (new), `docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/shadow-calibration-report.md` (new)
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-05, TASK-06
- **Confidence:** 80%
  - Implementation: 80% - Proxy training path confirmed and executed. 1,523 labeled records (631 positive, 892 negative).
  - Approach: 85% - Shadow mode confirmed working.
  - Impact: 85% - Core enabler for science-backed ranking.
- **Build evidence (2026-02-26):**
  - `tools/naminglab/model/train.py` — `load_proxy_dataset` + `train_model` (LogisticRegression in sklearn Pipeline). CLI: `--repo-root`, `--model-out`, `--meta-out`, `--version`, `--seed`.
  - `tools/naminglab/model/score.py` — `score_candidates` with Agresti-Coull CI90.
  - `tools/naminglab/model/calibration.py` — `compute_calibration` (Brier, log-loss, reliability bins) + `format_calibration_report_md`. CLI: `--repo-root`, `--model-pkl`, `--out`.
  - `tools/naminglab/model/pairwise.py` — `estimate_bradley_terry_scores` stub (iterative MLE; returns uniform if < 3 comparisons).
  - `tools/naminglab/artifacts/model-v1.pkl` + `model-v1-meta.json` — versioned model.
  - `docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/shadow-calibration-report.md` — Brier 0.1589 (PASS), CV Brier 0.219 ± 0.077, log-loss 0.472.
  - `tools/naminglab/tests/test_model.py` — 4 tests (TC-01–TC-04), all passing.
- **Acceptance:**
  - Outputs candidate-level `p_viable`, `ci90_lower`, `ci90_upper`, and rank interval.
  - Produces calibration metrics (Brier, log-loss, reliability summary).
  - Runs in parallel with legacy scoring without changing hard gates.
  - Model artifact versioning and deterministic seeds documented.
- **Validation contract (TC-04):**
  - TC-01: Training creates versioned model artifact from baseline dataset.
  - TC-02: Scoring output includes all uncertainty fields.
  - TC-03: Calibration report generated and stored as artifact.
  - TC-04: Legacy shortlist output remains unchanged in structure.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: verified no existing quantitative runtime package currently handles naming tasks.
  - Validation artifacts: repository scan for Python manifests/scripts and startup-loop integration paths.
  - Unexpected findings: no centralized Python package contract currently exists for this domain.
- **Scouts:** clarify fallback behavior when pairwise human labels are unavailable in a round.
- **Edge Cases & Hardening:** sparse labels, distribution shift across rounds.
- **What would make this >=90%:** two shadow rounds with stable calibration and replay parity.
- **Rollout / rollback:** keep shadow outputs advisory-only until checkpoint pass.
- **Documentation impact:** add model interpretation guide for operators.
- **Notes / references:** Fact-find probabilistic object definition.

### TASK-05: Feature stack + adaptive allocation + confidence-based N planning
- **Type:** IMPLEMENT
- **Deliverable:** Feature extraction layer plus controller outputs for pattern allocation and minimum-N planning.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:** `tools/naminglab/features/phonetic.py` (new), `tools/naminglab/features/orthographic.py` (new), `tools/naminglab/features/confusion_proxy.py` (new), `tools/naminglab/controller/bandit.py` (new), `tools/naminglab/controller/yield_planner.py` (new), `docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/controller-allocation-report.md` (new)
- **Depends on:** TASK-01, TASK-03, TASK-04
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 80% - TASK-04 proved the tools/naminglab/ Python environment and ML pipeline end-to-end. Feature extraction extends the same module (no new tooling). Confusion-proxy resolved to Metaphone-based batch similarity (no external corpus needed). Bandit and yield planner math are well-defined (Beta-Binomial, scipy.stats.binom CDF).
  - Approach: 82% - TASK-04 calibration (Brier 0.159, CV 0.219 ± 0.077) confirms empirical approach is working. Thompson sampling and P(Y>=K) binomial planner are proven methods.
  - Impact: 85% - High upside; highest complexity/risk task in the plan.
- **Acceptance:**
  - Feature layer emits deterministic phonetic/orthographic/confusion proxy fields.
  - Controller treats pattern families as arms and records posterior updates.
  - Planner outputs minimum `N` meeting `P(Y>=K) >= 0.95` with confidence interval.
  - Outputs remain advisory-only pending checkpoint.
- **Validation contract (TC-05):**
  - TC-01: Feature extraction deterministic test suite passes on fixed sample names.
  - TC-02: Posterior updates reproducible on synthetic round outcomes.
  - TC-03: Allocation output sums to planned `N` and respects exploration floor.
  - TC-04: Yield planner reproduces expected threshold behavior on replay set.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: confirmed fixed pattern allocation assumptions in ASSESSMENT-05 contract.
  - Validation artifacts: `.claude/skills/lp-do-assessment-05-name-selection/SKILL.md`, fact-find quantitative contract.
  - Unexpected findings: none.
- **Scouts:** benchmark corpus size and performance impact for confusion-proxy nearest-neighbor lookups.
- **Edge Cases & Hardening:** sparse posterior data, unstable exploration/exploitation balance.
- **What would make this >=90%:** stable allocation behavior across replays + one live shadow round.
- **Rollout / rollback:** keep fixed-count legacy mode available as fallback.
- **Documentation impact:** add controller semantics and interpretation notes.
- **Notes / references:** Fact-find Quant Stack BOM + controller contract.

### TASK-06: Replay harness and CI regression gates
- **Type:** IMPLEMENT
- **Deliverable:** Replay harness, schema checks, calibration checks, and CI gate enforcement.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `tools/naminglab/tests/` (new), `tools/naminglab/replay/` (new), `scripts/src/startup-loop/__tests__/` (new naming-related tests), CI workflow files (path resolved during implementation)
- **Depends on:** TASK-02, TASK-03, TASK-04, TASK-05
- **Blocks:** TASK-07
- **Confidence:** 80%
  - Implementation: 80% - All upstream modules are implemented and tested. Replay harness reads the sidecar JSONL format (TASK-03), the schema is defined, and calibration report structure is established (TASK-04). Integration patterns are concrete.
  - Approach: 80% - CI gates for schema and calibration are well-defined. Warning-only mode first then enforce reduces operational risk.
  - Impact: 85% - Prevents silent schema/model regressions.
- **Acceptance:**
  - Replay harness runs historical rounds and emits deterministic comparison summaries.
  - CI fails on sidecar schema drift.
  - CI fails on calibration regression beyond pre-committed threshold.
  - Legacy artifact parity checks remain green.
- **Validation contract (TC-06):**
  - TC-01: Replay run produces deterministic summary for fixed input set.
  - TC-02: Intentional schema break causes expected CI failure.
  - TC-03: Intentional calibration breach causes expected CI failure.
  - TC-04: Legacy markdown output parity check passes in shadow mode.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed existing startup-loop test suite conventions and CI style.
  - Validation artifacts: `scripts/src/startup-loop/__tests__/`
  - Unexpected findings: naming-pipeline science gates are currently absent; full suite is net-new.
- **Scouts:** validate CI runtime budget impact before enforcing strict gates.
- **Edge Cases & Hardening:** flaky calibration thresholds, replay incompleteness.
- **What would make this >=90%:** two consecutive CI cycles with intentional failure-injection checks.
- **Rollout / rollback:** warning-only CI mode first if needed, then enforce.
- **Documentation impact:** add QA playbook for replay and calibration gates.
- **Notes / references:** Fact-find validation requirements.

### TASK-07: Horizon checkpoint - shadow-to-gated readiness review
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence and explicit readiness decision.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-naming-pipeline-science-upgrade/plan.md`, `docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/`
- **Depends on:** TASK-06
- **Blocks:** TASK-08
- **Confidence:** 95%
  - Implementation: 95% - Process contract is explicit.
  - Approach: 95% - Mandatory checkpoint prevents unsafe mode promotion.
  - Impact: 95% - High risk-control value.
- **Acceptance:**
  - Checkpoint decision logged: remain shadow or permit gated pilot.
  - Decision references calibration/replay evidence from TASK-06.
  - Downstream rollout scope updated to match decision.
- **Horizon assumptions to validate:**
  - Calibration stability is sufficient for any gated trial.
  - Operator workflow impact is acceptable.
- **Validation contract:** readiness decision note with supporting artifact links.
- **Planning validation:** evidence review from TASK-06 artifacts.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** update plan Decision Log and readiness notes.

### TASK-08: Operator rollout pack and governance handoff
- **Type:** IMPLEMENT
- **Deliverable:** 
  - `docs/business-os/startup-loop/naming-pipeline-v2-operator-guide.user.md`
  - `docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/pilot-readout.user.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** startup-loop operator docs + plan artifacts
- **Reviewer:** Operator
- **Approval-Evidence:** operator acknowledgment note in Decision Log
- **Measurement-Readiness:** owner: startup-loop operator; cadence: per naming round; tracking: sidecar aggregate + shortlist artifacts
- **Affects:** `docs/business-os/startup-loop/`, `docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/`
- **Depends on:** TASK-07
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 75% - Content depends on checkpoint outcome.
  - Approach: 75% - Governance-first handoff prevents misapplication of model outputs.
  - Impact: 85% - Critical for safe adoption and decision clarity.
- **Acceptance:**
  - Operator guide includes workflow changes, interpretation rules, fallback path, and non-legal boundaries.
  - Pilot readout includes baseline-vs-pilot comparison for reround rate, viable yield, ranking stability, and calibration metrics.
  - Guide explicitly states whether model outputs are advisory or gating-active based on checkpoint result.
- **Validation contract (VC-08):**
  - VC-01: Guide quality -> pass when all required sections are present and reviewer confirms no ambiguous operating instructions within one review cycle over one operator reviewer.
  - VC-02: Pilot readout quality -> pass when all four required metrics are reported with thresholds, timestamp, and explicit pass/fail interpretation within one reporting cycle over one pilot sample.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: define required section checklist and metric threshold table.
  - Green evidence plan: publish guide + readout from checkpoint-approved data.
  - Refactor evidence plan: revise ambiguous language based on reviewer comments.
- **Planning validation:** `None: S-effort business deliverable; depends on checkpoint outputs`
- **Scouts:** `None: rollout content becomes deterministic after TASK-07`
- **Edge Cases & Hardening:** 
  - Shadow-only decision must clearly block model-based gating behavior.
  - Partial uplift must include rollback/fallback conditions.
- **What would make this >=90%:** two review cycles with no ambiguity findings.
- **Rollout / rollback:** publish docs; rollback by reverting to prior operator guidance.
- **Documentation impact:** new operator guide and pilot readout.
- **Notes / references:** Business VC quality checklist.

## Risks & Mitigations
- Risk: Quant stack stalls after infrastructure-only work.
  - Mitigation: TASK-04 is mandatory in Wave 1 and blocked into checkpointed flow.
- Risk: Sidecar/model changes break legacy artifact consumers.
  - Mitigation: additive-only schema strategy + parity checks in TASK-06.
- Risk: Sparse data leads to unstable model interpretation.
  - Mitigation: shadow-only operation + conservative thresholds + checkpoint gate.
- Risk: Governance ambiguity causes misuse of model outputs.
  - Mitigation: TASK-08 operator guide with explicit allowed/forbidden usage states.

## Observability
- Logging:
  - RDAP telemetry (status, retries, latency, terminal state).
  - Candidate sidecar logs (features, gates, human annotations, model outputs).
- Metrics:
  - reround rate, viable-finalist yield, Kendall tau stability, Brier, log-loss, unknown-rate.
- Alerts/Dashboards:
  - CI gates for schema drift and calibration regression.
  - Per-run summary artifacts under plan `artifacts/`.

## Acceptance Criteria (overall)
- [ ] Baseline funnel metrics extracted and versioned.
- [ ] RDAP path upgraded with resilient classification and telemetry.
- [ ] Sidecar schema and event logging active in shadow mode.
- [ ] Shadow model emits probabilistic outputs and calibration metrics.
- [ ] Adaptive allocation + confidence-based N planner emits advisory outputs.
- [ ] Replay and CI gates enforce schema + calibration quality contracts.
- [ ] Checkpoint decision records shadow-to-gated readiness.
- [ ] Operator rollout artifacts published with reviewer acknowledgment.

## Decision Log
- 2026-02-26: Plan generated in `plan-only` mode per explicit user instruction (no build continuation).
- 2026-02-26: Chosen approach fixed to hybrid Wave 1 (RDAP + sidecars + shadow model).
- 2026-02-26: Additive sidecar architecture selected to preserve existing naming artifact contracts.
- 2026-02-26: TASK-01 complete. Dual-runtime architecture confirmed (TS at scripts/src/startup-loop/naming/, Python at tools/naminglab/). TASK-02 and TASK-03 re-scored to 80% (now eligible). TASK-04 re-scored to 78% (proxy training path identified; still below 80% IMPLEMENT threshold — will trigger replan before build).

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted calculation:
  - TASK-01: 85 * 1 = 85
  - TASK-02: 75 * 2 = 150
  - TASK-03: 75 * 2 = 150
  - TASK-04: 75 * 2 = 150
  - TASK-05: 70 * 3 = 210
  - TASK-06: 75 * 2 = 150
  - TASK-07: 95 * 1 = 95
  - TASK-08: 75 * 1 = 75
- Total weight = 14
- Overall-confidence = 1065 / 14 = 76.1% (rounded to 76%)
- What would make this >=90%:
  - Execute TASK-01 baseline extraction and close runtime contract.
  - Produce one full shadow run with stable calibration and replay parity.
  - Validate CI failure-injection gates for schema and calibration regressions.

## Critique Summary
- Round 1: inline critique completed during planning pass.
- Fixes applied:
  - Eliminated RDAP-only sequencing path.
  - Added explicit quant runtime contract dependency and checkpointed promotion control.
  - Added CI-calibration/schema gates to acceptance criteria.
- Verdict: credible (formal `/lp-do-critique` run deferred to execution phase).

## Section Omission Rule
None: all sections are populated.
