---
schema_version: pattern-reflection.v1
feature_slug: lp-do-ideas-queue-state-sync
generated_at: 2026-03-02T17:30:00.000Z
entries:
  - pattern_summary: "Stale dispatches accumulate when build completion is not auto-synced to queue state"
    category: "ad_hoc"
    routing_target: "defer"
    occurrence_count: 1
    evidence_refs:
      - "docs/plans/lp-do-ideas-queue-state-sync/results-review.user.md#new-idea-candidates"
    idea_key: "brikette-sales-funnel-analysis-dispatch-backfill"
---

# Pattern Reflection

## Patterns

- **Pattern:** Stale dispatches accumulate when build completion is not auto-synced to queue state
  - **Category:** ad_hoc
  - **Routing:** defer (occurrence_count: 1; ad_hoc requires >= 2 for skill_proposal)
  - **Evidence:** 5 brikette-sales-funnel-analysis dispatches confirmed as stale in fact-find (queue_state: auto_executed, plan archived). Excluded from this plan scope.
  - **Suggested next action:** Create a targeted data-repair card to backfill the 5 stale dispatches once the new hook is confirmed operational.

## Access Declarations

None identified
