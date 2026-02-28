---
Type: Results-Review
Plan: startup-loop-naming-pipeline-science-upgrade
Completed: 2026-02-26
---

# Naming Pipeline Science Upgrade — Results Review

## Intended Outcome Check

**Intended:** Ship a pipeline upgrade that (1) removes RDAP false-signal behavior, (2) replaces heuristic score-only ranking with calibrated probabilistic ranking + uncertainty, and (3) introduces confidence-based yield planning and round-to-round learning.

**Observed:**
1. RDAP false-signal behavior addressed: unknown-state now explicit with retry/backoff. One confirmed real-world case (HEAD R6 "Collocata" ERROR 000) handled correctly.
2. Probabilistic ranking in shadow mode: p_viable + CI90 produced per candidate, Brier 0.159 (PASS). Not yet replacing heuristic ranking — remains additive annotation.
3. Confidence-based yield planning live: recommended N=17 for K=5 at 95% confidence. Round-to-round learning via PatternBandit operational but needs live round data to adapt.

**Assessment:** Intended outcome achieved for infrastructure delivery. Operational uplift (reduced rerounds, improved yield) cannot be measured until live rounds run through the new pipeline.

## Observed Outcomes

- 72 tests (49 Python, 23 TypeScript) all passing
- tools/naminglab/ Python package created: model, features, controller, replay modules
- scripts/src/startup-loop/naming/ TypeScript modules: RDAP client, sidecar writer, baseline extractor
- Checkpoint decision: shadow-continue (no gating changes)
- Operator guide and pilot readout delivered

## Standing Updates

- The `naming-pipeline-v2-operator-guide.user.md` should be referenced in the startup loop naming stage docs when the next naming round is set up
- The `model-v1.pkl` at `tools/naminglab/artifacts/` should be retrained after the first live round using actual sidecar events
- The `PatternBandit` prior should be updated with pattern-level RDAP data once it becomes available from live rounds

## New Idea Candidates

**New standing data source:**
- Naming pipeline sidecar logs for per-round naming analytics | trigger observation: Per-candidate stage event logs accumulate across naming rounds (`docs/business-os/strategy/<BIZ>/naming-sidecars/`). Once 3+ live rounds exist: structured dataset for quantitative analysis of naming patterns, yield trends, and operator preferences. Currently empty — will fill as naming rounds run.

**New open-source package:** None identified.

**New skill:** None identified directly. A future `/lp-naming-round` skill could orchestrate a full naming round with sidecar emission, shadow scoring, and bandit allocation as a single operator-facing command. Not yet warranted with one round of live data.

**New loop process:** A naming round review cadence (after each round, update model, bandit, and calibration report) is implied by the pipeline architecture but not yet formalized as a loop process. Consider adding to S0/naming stage process docs once 2+ live rounds complete.

**AI-to-mechanistic:** The yield planner (recommended N for P(Y>=K)>=0.95) replaces the current implicit judgment about how many names to generate. This is now a deterministic calculation from scipy.stats.binom — no LLM reasoning involved.

## Standing Expansion

No standing data changes were made in this build (sidecar logs directory created but empty; no BOS or strategy artifact modifications beyond naming tooling itself).

## Reflection Debt

None emitted. All tasks completed with clean TC/VC evidence. The one open thread (shadow-to-gated promotion) is explicitly deferred to a future checkpoint after live rounds, not a planning failure.
