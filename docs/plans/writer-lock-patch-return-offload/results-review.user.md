---
Type: Results-Review
Status: Draft
Feature-Slug: writer-lock-patch-return-offload
Review-date: 2026-03-12
artifact: results-review
---

# Results Review

## Observed Outcomes
- TASK-01: Complete (2026-03-09) — Validate the current Codex CLI invocation and patch artifact contract for patch-return offload
- TASK-02: Complete (2026-03-09) — Reassess downstream implementation from TASK-01 spike evidence
- TASK-08: Complete (2026-03-09) — Determine an isolated Codex runner contract that avoids default MCP and state-runtime interference
- TASK-09: Complete (2026-03-09) — Validate the isolated runner in a temp repo and require prompt unified-diff emission
- TASK-10: Complete (2026-03-12) — Determine which final-output and artifact-extraction channel is reliable under the isolated runner
- TASK-11: Complete (2026-03-12) — Validate one bounded artifact-emission path under the isolated runner and require prompt emitted output
- TASK-03: Complete (2026-03-12) — Update the shared build-offload protocol and business-artifact executor docs for the patch-return pilot
- TASK-04: Complete (2026-03-12) — Add the patch-return offload helper that materializes task packets and captures returned patch artifacts
- TASK-05: Complete (2026-03-12) — Validate serialized apply-window behavior with fingerprints and a controlled patch artifact
- TASK-06: Complete (2026-03-12) — Reassess pilot wiring from TASK-05 apply-window evidence
- TASK-07: Complete (2026-03-12) — Wire build-biz to the patch-return pilot with explicit shared-checkout fallback
- 11 of 11 tasks completed.

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
- New loop process — None. The build-biz.md change activates an existing planned pilot; it does not introduce a missing stage or gate that wasn't previously designed.
- AI-to-mechanistic — None.

## Standing Expansion
- No standing expansion: no new external data sources or artifacts identified

## Intended Outcome Check

<!--
Warn mode (introduced TASK-06, startup-loop-why-intended-outcome-automation, 2026-02-25).
This section is non-blocking during the warn window. After one loop cycle (~14 days) it
will be promoted to a hard gate. A valid verdict keyword is required to clear the warn.
-->

- **Intended:** `build-biz` lane uses patch-return offload by default when Codex is available; shared-checkout mutation eliminated during Codex run; writer-lock window narrowed to apply-and-commit phase only.
- **Observed:** All 11 plan tasks completed. Isolated runner contract validated (TASK-08/09/11). Apply window spiked and confirmed (TASK-05). Helper script created (TASK-04). Protocol docs updated (TASK-03). Pilot wired in build-biz.md and build-offload-protocol.md (TASK-07). The `build-biz` lane now routes `CODEX_OK=1` to `build-offload-patch-return.sh` with `--sandbox read-only`, then applies the patch under the held writer lock. Shared-checkout mutation is eliminated during the Codex phase.
- **Verdict:** Met
- **Notes:** The intended outcome is fully delivered. The only remaining gap is that pilot confidence is 84% — one real build task through the pilot path would raise it to ≥90%. This is noted in TASK-07's "What would make this >=90%" field and is appropriate for a pilot, not a blocker.
