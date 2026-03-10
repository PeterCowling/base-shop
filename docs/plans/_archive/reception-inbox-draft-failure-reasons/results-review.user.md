---
Type: Results-Review
Status: Draft
Feature-Slug: reception-inbox-draft-failure-reasons
Review-date: 2026-03-07
artifact: results-review
---

# Results Review

## Observed Outcomes
- Draft generation failures now store a `draftFailureCode` and `draftFailureMessage` in thread metadata via `deriveDraftFailureReason()` and `draftFailureReasonFromCode()`.
- Three failure categories are distinguished: `invalid_input` (empty body), `quality_gate_failed` (with specific failed check labels), and `generation_failed` (unexpected error fallback). Recovery adds `max_retries_exceeded`.
- The DraftReviewPanel banner now shows the specific failure message (e.g., "Auto-draft failed: Draft did not pass quality checks: unanswered questions, missing signature.") instead of a generic message.
- The ThreadList badge shows the failure message as a hover tooltip.
- Stale failure reasons are cleared to null on successful draft generation (sync, recovery, and regeneration paths).
- 10 unit tests added covering all derivation and code-lookup paths.

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
- New loop process — None.
- AI-to-mechanistic — None.

## Standing Expansion
- No standing expansion: no new external data sources or artifacts identified

## Intended Outcome Check

<!--
Warn mode (introduced TASK-06, startup-loop-why-intended-outcome-automation, 2026-02-25).
This section is non-blocking during the warn window. After one loop cycle (~14 days) it
will be promoted to a hard gate. A valid verdict keyword is required to clear the warn.
-->

- **Intended:** Draft generation failures store a reason code and human-readable message in thread metadata, displayed in the inbox UI so staff knows what went wrong without investigating.
- **Observed:** Draft generation failures now store a reason code and human-readable message in thread metadata. The failure reason is surfaced in the DraftReviewPanel banner and as a badge tooltip in the thread list. All three server-side paths (sync, recovery, regeneration) are covered.
- **Verdict:** Met
- **Notes:** Both tasks completed. All acceptance criteria met.
