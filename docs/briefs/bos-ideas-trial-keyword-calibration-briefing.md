---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: BOS
Created: 2026-03-09
Last-updated: 2026-03-09
Topic-Slug: bos-ideas-trial-keyword-calibration
---

# BOS Ideas Trial Keyword Calibration Briefing

## Executive Summary

The backlog wording is stale. On March 9, 2026, the ideas trial pipeline already contains the keyword-calibration implementation: a dedicated calibration script exists, routing consumes priors through `scoreT1Match()`, and the CLI is registered. The live gap is operational rather than code-level: the expected priors file is absent, there is no production caller that runs calibration on a cadence, and the current trial queue provides no terminal `artifact_delta` outcomes for the calibrator to learn from.

Also, the current keyword list is 38 terms, not 42, as of March 9, 2026.

## Questions Answered

- Is `bos:ideas-trial:keyword-calibration` still unimplemented?
  No. The implementation landed on 2026-03-04 and remains present in the live codebase.
- Does the live routing path currently learn from keyword priors?
  Not in practice. The router can consume priors, but the expected priors artifact is missing.
- Is there enough live queue feedback for the calibrator to run today?
  Not for `artifact_delta` dispatches. Current terminal queue outcomes are `operator_idea` only.
- What is the real remaining gap?
  Operationalization: producing terminal `artifact_delta` feedback and running calibration often enough to materialize the priors file.

## Revised Task

Replace the stale idea wording with this narrower task:

`BOS ideas-trial — operationalize reconcile-first keyword calibration fast track`

Meaning:
- keep the existing weighted-keyword implementation,
- run completion reconciliation before calibration so recoverable queue evidence is usable immediately,
- surface explicit diagnostics when artifact-delta feedback is still absent instead of pretending the implementation is missing.

## High-Level Architecture

- Components:
  - `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` - defines the T1 keyword list, loads priors, scores keyword matches, and routes dispatches.
  - `scripts/src/startup-loop/ideas/lp-do-ideas-keyword-calibrate.ts` - reads `queue-state.json`, computes keyword priors, and writes `keyword-calibration-priors.json`.
  - `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts` - marks queue dispatches as completed when later build work can be matched back to a slug.
  - `docs/business-os/startup-loop/ideas/trial/queue-state.json` - live feedback source for the calibrator.
  - `scripts/package.json` - exposes the manual calibration CLI.
- Data stores / external services:
  - `docs/business-os/startup-loop/ideas/trial/queue-state.json` - live queue state.
  - `docs/business-os/startup-loop/ideas/trial/keyword-calibration-priors.json` - expected priors artifact; currently missing.

## End-to-End Flow

### Primary flow

1. `lp-do-ideas-trial.ts` defines a static T1 keyword list and a default priors path under `docs/business-os/startup-loop/ideas/trial/keyword-calibration-priors.json`.
   Evidence: `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts:30-90`
2. Runtime routing calls `scoreT1Match()`, which loads priors if present, applies per-keyword adjustments to a base score of `0.75`, and clamps the result to `0..1`.
   Evidence: `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts:868-894`
3. The routing decision uses `scoreT1Match()` with `T1_ROUTING_THRESHOLD = 0.6` to choose `briefing_ready`, `fact_find_ready`, or `micro_build_ready`.
   Evidence: `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts:77-78`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts:1270-1278`
4. The calibrator reads `queue-state.json`, filters to terminal `artifact_delta` dispatches, maps `completed -> +4` and `skipped -> -8`, applies a minimum keyword gate of `5`, and writes priors atomically.
   Evidence: `scripts/src/startup-loop/ideas/lp-do-ideas-keyword-calibrate.ts:8-31`, `scripts/src/startup-loop/ideas/lp-do-ideas-keyword-calibrate.ts:117-120`, `scripts/src/startup-loop/ideas/lp-do-ideas-keyword-calibrate.ts:208-283`
5. A manual CLI exists as `startup-loop:ideas-keyword-calibrate`.
   Evidence: `scripts/package.json:41`

### Current operating reality

- The archived plan for this work is marked complete and describes the exact code that now exists.
  Evidence: `docs/plans/_archive/ideas-keyword-calibration-feedback-loop/plan.md:21-31`
- The expected priors artifact is not present at `docs/business-os/startup-loop/ideas/trial/keyword-calibration-priors.json`.
  Evidence: runtime default path in `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts:83-90`; targeted read-only existence check on 2026-03-09 found no file at that path.
- The live queue currently reports `239` enqueued, `231` completed, and `494` total dispatches at top level.
  Evidence: `docs/business-os/startup-loop/ideas/trial/queue-state.json:1-12`
- A targeted read-only inspection on 2026-03-09 found `198` `artifact_delta` dispatches and all of them are still `queue_state: "enqueued"`; all `231` terminal entries were `operator_idea`.
  Evidence: read-only queue inspection against `docs/business-os/startup-loop/ideas/trial/queue-state.json` on 2026-03-09; representative `artifact_delta` packet remains enqueued in `docs/business-os/startup-loop/ideas/trial/queue-state.json` and is routed with base `confidence: 0.75`.

## Data & Contracts

- Key types/schemas:
  - `T1_SEMANTIC_KEYWORDS` - current 38-term list.
  - `KeywordCalibrationPriors` - `{ calibrated_at, event_count, keywords_calibrated, keywords_below_gate, priors, candidates }`.
  - `CalibrationResult` - `{ ok, reason?, dry_run, priors? }`.
- Source of truth:
  - Keyword list and scoring logic: `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`
  - Calibration algorithm: `scripts/src/startup-loop/ideas/lp-do-ideas-keyword-calibrate.ts`
  - Feedback corpus: `docs/business-os/startup-loop/ideas/trial/queue-state.json`
- Notable clarification:
  - The live T1 list has 38 entries as of 2026-03-09, not 42.
  - Evidence: `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts:30-71`

## Configuration, Flags, and Operational Controls

- Manual command:
  - `pnpm --filter scripts startup-loop:ideas-keyword-calibrate`
  - Evidence: `scripts/package.json:41`
- Data gate:
  - `MIN_KEYWORDS_GATE = 5`
  - Evidence: `scripts/src/startup-loop/ideas/lp-do-ideas-keyword-calibrate.ts:31`
- Current ops note:
  - The generated process-improvements feed explicitly says calibration should be added to a periodic weekly cadence.
  - Evidence: `docs/business-os/_data/process-improvements.json:1387-1395`

## Error Handling and Failure Modes

- Missing or corrupt priors file causes graceful degradation to base scores.
  Evidence: `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts:154-176`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts:878-886`
- Calibration returns `no_terminal_dispatches` when no terminal `artifact_delta` entries are available.
  Evidence: `scripts/src/startup-loop/ideas/lp-do-ideas-keyword-calibrate.ts:228-230`
- Queue completion only mutates dispatches whose `processed_by.target_slug` or `processed_by.fact_find_slug` matches the feature slug; unmatched dispatches remain untouched.
  Evidence: `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts:57-90`
- `lp-do-build` documents a queue-state completion hook, but current live data indicates it is not producing terminal `artifact_delta` feedback at scale.
  Evidence: `.claude/skills/lp-do-build/SKILL.md:272-291`

## Tests and Coverage

- Existing tests cover calibration logic, priors-aware scoring, threshold behavior, and CLI registration.
  Evidence: `scripts/src/startup-loop/__tests__/lp-do-ideas-keyword-calibrate.test.ts:259-366`
- Not investigated:
  - CI status of these tests in the latest pipeline run. Local Jest execution is repo-policy restricted.

## Unknowns / Follow-ups

- Unknown: why `artifact_delta` entries are not reaching terminal states in the live queue.
  - How to verify: trace current `processed_by` population and completion-hook matching for artifact-delta-originated builds through `docs/business-os/startup-loop/ideas/trial/queue-state.json`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`, and the active `lp-do-build` execution path.
- Unknown: whether calibration should remain manual or be promoted into weekly orchestration.
  - How to verify: inspect `lp-weekly` execution docs and any active automation entrypoints that call startup-loop maintenance utilities.

## If You Later Want to Change This (Non-plan)

- Likely change points:
  - Add a production caller or weekly cadence for `startup-loop:ideas-keyword-calibrate`.
  - Ensure artifact-delta-originated work writes stable `processed_by` slugs that the completion hook can later resolve.
  - Decide whether priors should be committed as a standing artifact or regenerated ephemerally.
- Key risks:
  - Reopening the original backlog item as "missing implementation" would be inaccurate.
  - Wiring periodic calibration without first fixing terminal `artifact_delta` feedback will still produce `no_terminal_dispatches`.
