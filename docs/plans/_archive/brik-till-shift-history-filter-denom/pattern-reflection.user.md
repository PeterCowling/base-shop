---
schema_version: pattern-reflection.v1
feature_slug: brik-till-shift-history-filter-denom
generated_at: "2026-02-28T00:00:00Z"
entries:
  - pattern_summary: "Auto-generate results-review when build-record reaches Complete"
    category: "ad_hoc"
    routing_target: "defer"
    occurrence_count: 1
    evidence_refs:
      - "docs/plans/brik-till-shift-history-filter-denom/results-review.user.md#new-idea-candidates"
  - pattern_summary: "Deterministic QA script for results-review sections"
    category: "ad_hoc"
    routing_target: "defer"
    occurrence_count: 1
    evidence_refs:
      - "docs/plans/brik-till-shift-history-filter-denom/results-review.user.md#new-idea-candidates"
---

# Pattern Reflection

## Patterns

- **Auto-generate results-review when build-record reaches Complete** — category: ad_hoc | routing: defer (occurrence_count 1, threshold 2 for ad_hoc) | Evidence: results-review was missing at plan completion despite build-record being written; required a separate manual step each cycle.

- **Deterministic QA script for results-review sections** — category: ad_hoc | routing: defer (occurrence_count 1) | Evidence: frontmatter/section/verdict checks are manual but follow a fixed checklist; same logic runs each cycle.

## Access Declarations

None identified.
