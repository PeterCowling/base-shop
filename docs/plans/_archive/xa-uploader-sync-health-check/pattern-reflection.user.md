---
schema_version: pattern-reflection.v1
feature_slug: xa-uploader-sync-health-check
generated_at: 2026-02-28T00:00:00Z
entries:
  - pattern_summary: "Encapsulated env var pre-flight check before expensive pipeline"
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - "docs/plans/xa-uploader-sync-health-check/results-review.user.md#new-idea-candidates"
    idea_key: xa-uploader-env-preflight-pattern
---

# Pattern Reflection

## Patterns

- **Encapsulated env var pre-flight check before expensive pipeline** (`ad_hoc`, occurrence_count=1, routing: `defer`)
  - Pattern: TASK-01 introduced `getCatalogContractReadiness()` as a dedicated export that checks env var presence and returns a structured `{ configured, errors }` result — rather than calling private getters directly from the route layer. This pattern (check-then-surface-errors before expensive operations, encapsulated in a single export) could be reused in other apps with external service dependencies.
  - Routing rationale: `ad_hoc`, `occurrence_count=1` → threshold for `skill_proposal` is ≥2. Defer until a second app independently needs the same pattern.

## Access Declarations

None identified.
