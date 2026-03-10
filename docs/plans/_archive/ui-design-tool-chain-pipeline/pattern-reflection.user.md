---
schema_version: pattern-reflection.v1
feature_slug: ui-design-tool-chain-pipeline
generated_at: 2026-02-27T00:00:00Z
entries:
  - pattern_summary: Design gate only enforced at plan decomposition, not at fact-find stage
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/ui-design-tool-chain-pipeline/results-review.user.md#new-idea-candidates
    idea_key: design-gate-fact-find-extension
    classifier_input:
      idea_id: design-gate-fact-find-extension
      title: Extend Design-Spec-Required gate to lp-do-fact-find intake
      source_path: docs/plans/ui-design-tool-chain-pipeline/results-review.user.md
      source_excerpt: Design-Spec-Required is only enforced when the plan is being decomposed; a fact-find has no equivalent upfront signal
      created_at: 2026-02-27T00:00:00Z
      trigger: artifact_delta
      artifact_id: results-review
      evidence_refs:
        - docs/plans/ui-design-tool-chain-pipeline/results-review.user.md#new-idea-candidates
      area_anchor: UI design pipeline gating
      content_tags:
        - process
        - ui-design
        - gating
---

# Pattern Reflection

## Patterns

- `ad_hoc` | `Design gate only enforced at plan decomposition, not at fact-find stage` | routing: `defer` | occurrences: `1`

## Access Declarations

None identified.
