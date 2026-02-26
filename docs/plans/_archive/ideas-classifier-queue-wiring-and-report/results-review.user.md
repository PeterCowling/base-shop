---
Type: Results-Review
Status: Draft
Feature-Slug: ideas-classifier-queue-wiring-and-report
Review-date: 2026-02-26
artifact: results-review
Business-Unit: BOS
---

# Results Review

## Observed Outcomes

- Queue scheduler (`planNextDispatches()`) now uses classifier output (urgency rank, effective priority rank, effort rank) when present, with a score offset of 10000 guaranteeing all classified entries always outrank any unclassified entry. The fallback to old 3-tier score is preserved for unclassified entries.
- Process improvements HTML report now groups ideas into canonical priority tier sections (P0 through P5 + Unclassified catch-all) with plain-English headings, replacing the previous free-text "Act/Investigate/Defer" grouping.
- All 39 ideas in `process-improvements.json` now carry `urgency`, `effort`, `proximity`, and `reason_code` fields populated by the classifier on each generator run.
- 63 tests pass (47 existing queue tests + 5 new TC-09 sort tests + 11 generate-process-improvements tests including 1 new classification-field assertion).

## Standing Updates

- `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json`: updated to document four new optional fields (`priority_tier`, `urgency`, `effort`, `reason_code`) — no further standing artifact update needed.
- `docs/business-os/process-improvements.user.html`: updated with tier-based grouping render JS — committed and backfilled by generator.
- `docs/business-os/_data/process-improvements.json`: all 39 ideas backfilled with full classification fields.

## New Idea Candidates

- Phase 4 enforcement gate — wire effective_priority_rank into the queue as a production constraint, blocking low-tier ideas from the DO lane until high-tier ideas clear | Trigger observation: this build wired classification into the scheduler in advisory mode; Phase 4 requirement was explicitly deferred in the classifier | Suggested next action: defer — create card after ~4 weeks of trial data
- Queue state persistence — the classification field is currently in-memory only; adding it to the serialized queue-state.json would allow backfill to survive process restarts | Trigger observation: classification is set on QueueEntry after enqueue and lost on re-hydration | Suggested next action: spike (assess queue-state.json schema extension)
- New open-source package: None identified.
- New skill: None — wiring work follows the standard lp-do-build code-change flow.
- New loop process: None — the classifier advisory mode and Phase 4 gate are already in the classifier design doc.
- AI-to-mechanistic: None — the classifier itself is already deterministic; the report grouping is now also deterministic (tier-based loop, no LLM reasoning).

## Standing Expansion

No standing expansion: all changes are within the existing startup-loop ideas subsystem. No new standing artifact registration required.

## Intended Outcome Check

- **Intended:** Queue scheduler uses effective_priority_rank+urgency+effort sort key from classifier output; report groups ideas by canonical tier and urgency; all existing ideas have full classification fields.
- **Observed:** All three components delivered. Queue scheduler uses composite classifier score (10000 - urgency*1000 - rank*10 + effort) when classification is present; HTML report groups by P0–P5 tier with plain-English headings; all 39 ideas in process-improvements.json have full classification fields.
- **Verdict:** Met
- **Notes:** The queue sort change is advisory only in Phase 1 — `planNextDispatches()` has no non-test production caller. The correct behaviour is confirmed by 5 new tests; production effect deferred to Phase 4 when a caller is wired.
