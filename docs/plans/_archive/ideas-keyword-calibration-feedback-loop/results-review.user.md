---
Type: Results-Review
Status: Draft
Feature-Slug: ideas-keyword-calibration-feedback-loop
Review-date: 2026-03-04
artifact: results-review
---

# Results Review

## Observed Outcomes
- Calibration script (`lp-do-ideas-keyword-calibrate.ts`, 340 lines) reads queue-state.json, filters to terminal artifact_delta dispatches, computes per-keyword effectiveness deltas (completed→+4, skipped→-8), and writes priors JSON atomically.
- Binary `matchesT1()` replaced with weighted `scoreT1Match()` returning 0–1 score: base 0.75 + calibration delta/100, compared against `T1_ROUTING_THRESHOLD=0.6`.
- 15-case test suite validates all TC contracts for calibration and weighted matching.
- Candidate keyword surfacing identifies high-frequency non-T1 terms for operator review.
- SELF_TRIGGER_PROCESSES registration and package.json script entry ensure the calibration script is discoverable and runnable.

## Standing Updates
- No standing updates: no registered artifacts changed

## New Idea Candidates
<!-- Scan for signals in these five categories. For each, cite a "Trigger observation" from this build. Use "None." if no evidence found for any category.
  1. New standing data source — external feed, API, or dataset suitable for Layer A standing intelligence
  2. New open-source package — library to replace custom code or add capability
  3. New skill — recurring agent workflow ready to be codified as a named skill
  4. New loop process — missing stage, gate, or feedback path in the startup loop
  5. AI-to-mechanistic — LLM reasoning step replaceable with a deterministic script
-->
- New standing data source — None.
- New open-source package — None.
- New skill — None.
- New loop process — The calibration priors file (`keyword-calibration-priors.json`) is a new feedback artifact in the ideas subsystem. Consider adding a periodic calibration run to the weekly loop cadence once sufficient dispatch volume accumulates (MIN_KEYWORDS_GATE=5 per keyword group).
- AI-to-mechanistic — The calibration script itself is a mechanistic replacement: LLM routing judgment for keyword relevance is now supplemented by deterministic delta scores computed from dispatch outcomes. This is additive (priors adjust the base score) rather than a full replacement.

## Standing Expansion
- No standing expansion: no new external data sources or artifacts identified

## Intended Outcome Check

<!--
Warn mode (introduced TASK-06, startup-loop-why-intended-outcome-automation, 2026-02-25).
This section is non-blocking during the warn window. After one loop cycle (~14 days) it
will be promoted to a hard gate. A valid verdict keyword is required to clear the warn.
-->

- **Intended:** Produce a deterministic calibration script that analyzes confirmed vs skipped dispatches and adjusts T1 semantic keyword weights, creating a feedback loop from dispatch outcomes to routing accuracy.
- **Observed:** Calibration script reads queue-state.json, computes per-keyword deltas from terminal artifact_delta dispatches, writes priors JSON. scoreT1Match() integrates priors into routing decisions with threshold-based classification. 15 test cases validate all contracts.
- **Verdict:** met
- **Notes:** All three deliverables (calibration script, weighted matching, test suite) are functional and validated. The feedback loop is operational — running `startup-loop:ideas-keyword-calibrate` updates priors that are consumed by the next routing decision.
