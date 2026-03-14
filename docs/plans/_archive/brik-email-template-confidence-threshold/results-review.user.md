---
Type: Results-Review
Status: Draft
Feature-Slug: brik-email-template-confidence-threshold
Review-date: 2026-03-13
artifact: results-review
---

# Results Review

## Observed Outcomes
- TASK-01 (Complete 2026-03-13): Added `selectSingleQuestionTemplate` helper to `draft-generate.ts` mirroring `selectQuestionTemplateCandidate` semantics. The single-question path now gates on category hints first, then falls back to `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR = 70`. Rejected candidates produce `payload.template_used.subject === null`, `follow_up_required === true` on `question_blocks[0]`, and emit `email_fallback_detected` telemetry. TC-01-01 through TC-01-05 pass (hinted-reject, unhinted-reject, hinted-prefer, unhinted-accept, composite-regression).
- TASK-02 (Complete 2026-03-13): Removed `"booking-issues"` from `STRICT_REFERENCE_CATEGORIES` in `draft-quality-check.ts`. FAQ drafts for booking-issues scenarios no longer produce false `missing_required_reference` failures when no booking action is required. Enforcement preserved for `booking_action_required=true` and all other strict categories. TC-02-01 through TC-02-03 pass.
- 2 of 2 tasks completed.

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
- New loop process — Add a pre-push broken-symlink hygiene check to the repo's validate-changes gates. Trigger observation: the planned wave commit was blocked by a pre-existing broken symlink under `.agents/skills/`, requiring an out-of-scope fix commit before CI could proceed. Suggested next action: create card.
- AI-to-mechanistic — None.

## Standing Expansion
- No standing expansion: no new external data sources or artifacts identified

## Intended Outcome Check

<!--
Warn mode (introduced TASK-06, startup-loop-why-intended-outcome-automation, 2026-02-25).
This section is non-blocking during the warn window. After one loop cycle (~14 days) it
will be promoted to a hard gate. A valid verdict keyword is required to clear the warn.
-->

- **Intended:** Per-question confidence floor and category-compatibility check gate template block acceptance in draft-generate; below-threshold single-question emails emit follow_up_required with the escalation fallback sentence and no template text. booking-issues removed from STRICT_REFERENCE_CATEGORIES to eliminate false reference-link quality failures on FAQ drafts.
- **Observed:** The single-question path now uses the same hint-first and `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR = 70` gating semantics as the composite selector. Rejected candidates produce `follow_up_required === true`, null template subject, and `email_fallback_detected` telemetry (TC-01-01, TC-01-02). Hinted candidates are preferred over higher-confidence unhinted candidates (TC-01-03). Unhinted candidates ≥70 confidence are accepted (TC-01-04). Composite path is unaffected (TC-01-05). `booking-issues` removed from `STRICT_REFERENCE_CATEGORIES`: FAQ drafts with no booking action no longer fail `missing_required_reference` (TC-02-01); action-required enforcement and other strict categories unchanged (TC-02-02, TC-02-03).
- **Verdict:** Met
- **Notes:** All 2 tasks completed successfully.
