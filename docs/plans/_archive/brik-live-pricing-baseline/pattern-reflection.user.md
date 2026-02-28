---
schema_version: pattern-reflection.v1
feature_slug: brik-live-pricing-baseline
generated_at: 2026-02-27T21:30:00Z
entries:
  - pattern_summary: Temporal dead zone from variable declared after the callback that uses it
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/brik-live-pricing-baseline/plan.md#scouts
      - docs/plans/brik-live-pricing-baseline/critique-history.md
    idea_key: brik-roomcard-tdz-variable-ordering
    classifier_input:
      idea_id: brik-roomcard-tdz-variable-ordering
      title: useCallback TDZ when variable is declared after the callback that captures it
      source_path: docs/plans/brik-live-pricing-baseline/plan.md
      source_excerpt: title is declared at line 383, after openNonRefundable at line 252 — adding to useCallback deps without hoisting creates a TDZ ReferenceError
      created_at: 2026-02-27T00:00:00Z
      trigger: artifact_delta
      artifact_id: plan
      evidence_refs:
        - docs/plans/brik-live-pricing-baseline/plan.md#scouts
      area_anchor: React useCallback dependencies and variable hoisting
      content_tags:
        - react
        - hooks
        - code-quality
---

# Pattern Reflection

## Patterns

- `ad_hoc` | `Temporal dead zone from variable declared after the callback that uses it` | routing: `defer` | occurrences: `1`
  - A variable (`title`) was computed at line 383 in `RoomCard.tsx` but needed inside a `useCallback` at line 252. Adding it to the `useCallback` deps array without hoisting would cause a JavaScript `ReferenceError` at runtime. The codemoot plan critique (Round 3) flagged this before implementation. The fix was a simple reorder with no logic change.
  - Occurrence count is 1. Routing: `defer` (ad_hoc threshold for `skill_proposal` is occurrence_count >= 2).

## Access Declarations

None identified. All required access (GA4 property, MCP tools, codebase) was available and declared before build started.
