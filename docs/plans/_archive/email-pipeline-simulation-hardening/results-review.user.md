---
Type: Results-Review
Status: Draft
Feature-Slug: email-pipeline-simulation-hardening
Review-date: 2026-03-06
artifact: results-review
---

# Results Review

## Observed Outcomes
- Compound guest emails with clauses joined by "and also", "and what", "as well as", etc. are now atomized before intent extraction runs. Each clause is processed as an independent fragment, preventing sub-questions from being silently dropped.
- Cross-array deduplication removes request items that overlap with question items from the same atomized message, so a single guest intent is no longer counted twice (once as a request, once as a question).
- The `booking_monitor` trigger field was split into `booking_action_required` (narrowed to operational verbs: cancel, modify, change, extend, new booking) and `booking_context` (broad informational mention). Quality gate link enforcement now keys off `booking_action_required` only — informational emails that mention "my booking" no longer produce spurious missing-link failures.
- A per-question confidence floor (`PER_QUESTION_FLOOR = 25`) was added to template ranking. Candidates below the floor are excluded, and the affected question block surfaces a `followUpRequired: true` flag instead of a low-confidence template answer. Unknown-topic questions now produce an explicit follow-up prompt rather than a fluent-but-wrong response.
- The `SYNONYMS` dictionary in the template ranker was extended with 15+ new entries (availability, pool, facility, amenity, parking, kitchen, tour, activity, etc.) and a `TOPIC_SYNONYMS` fallback was added in the coverage checker. Correctly paraphrased answers that match semantically but not lexically are no longer marked as partial coverage.
- A `delivery_status` field (`"ready" | "needs_patch" | "blocked"`) was added to every `draft_generate` response, computed deterministically from quality pass/fail and warning count. The email draft skill now enforces this as a hard gate: a `"blocked"` status prevents Gmail draft creation entirely, replacing the prior advisory quality check.

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

- **Intended:** Compound guest emails produce one intent per clause with no double-counted requests; composite template blocks have a confidence floor so unknown topics get an explicit follow-up instead of a wrong answer; `quality.passed=false` is surfaced as a machine-enforced `delivery_status: blocked` that prevents Gmail draft creation.
- **Observed:** All three goals delivered. Clause atomization + cross-dedup eliminates dropped sub-questions and double-counted intents. The `PER_QUESTION_FLOOR` threshold produces `followUpRequired: true` blocks for below-floor topics instead of wrong answers. The `delivery_status` field is machine-enforced in the email draft skill with `"blocked"` as a hard stop before `gmail_create_draft`.
- **Verdict:** Met
- **Notes:** All six simulation defect scenarios are addressed across three pipeline layers. No partial outcomes — each of the three stated goals has a corresponding implementation artifact (atomizeCompoundClauses + dedup, PER_QUESTION_FLOOR filter, computeDeliveryStatus + delivery_status gate) and a documented test commit. The booking trigger field split is a bonus structural improvement beyond the stated outcome that reduces false quality failures in the informational-email case.
