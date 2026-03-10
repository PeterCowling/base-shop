---
Type: Results-Review
Status: Draft
Feature-Slug: startup-loop-structured-sidecar-introduction
Review-date: 2026-03-06
artifact: results-review
---

# Results Review

## Observed Outcomes
- TASK-01: Complete (2026-03-06) — Extract shared parse + classification module
- TASK-02: Complete (2026-03-06) — Implement results-review post-authoring extractor
- TASK-03: Complete (2026-03-06) — Implement pattern-reflection post-authoring extractor
- TASK-04: Complete (2026-03-06) — Add sidecar-prefer branch to generate-process-improvements
- TASK-05: Complete (2026-03-06) — Add sidecar-prefer branch to self-evolving-from-build-output
- TASK-06: Complete (2026-03-06) — Wire extractor steps into SKILL.md + update loop-output-contracts
- 6 of 6 tasks completed.

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
- Post-authoring sidecar extraction as a reusable loop process | Trigger observation: steps 2.1 and 2.55 wire deterministic extraction after each LLM authoring step — the same pattern could apply to any loop artifact that code immediately parses | Suggested next action: defer to next loop review
- Build-record structured extraction as AI-to-mechanistic candidate | Trigger observation: build-record.user.md Outcome Contract section is parsed by the emitter after every build — same pattern as results-review; could emit a machine-readable sidecar | Suggested next action: create INVESTIGATE task

## Standing Expansion
- No standing expansion: no new external data sources or artifacts identified

## Intended Outcome Check

<!--
Warn mode (introduced TASK-06, startup-loop-why-intended-outcome-automation, 2026-02-25).
This section is non-blocking during the warn window. After one loop cycle (~14 days) it
will be promoted to a hard gate. A valid verdict keyword is required to clear the warn.
-->

- **Intended:** generate-process-improvements.ts reads idea candidates from results-review.signals.json when present (falling back to markdown parse when absent), and self-evolving-from-build-output.ts reads from both sidecars at the file-loading layer. Zero regressions in existing behaviour.
- **Observed:** All 6 tasks delivered end-to-end: shared parse module extracted, two post-authoring extractor scripts created, sidecar-prefer branches added to both consumers, SKILL.md wired with steps 2.1 and 2.55, loop-output-contracts.md updated. Zero breaking changes confirmed — all historical plans without sidecars continue using the markdown fallback path. 17 new tests pass across 4 new test files; 5 additional sidecar-prefer TCs pass in self-evolving-signal-integrity test suite.
- **Verdict:** Met
- **Notes:** All 6 tasks completed successfully.
