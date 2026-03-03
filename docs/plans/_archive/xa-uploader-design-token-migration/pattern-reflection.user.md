---
schema_version: pattern-reflection.v1
feature_slug: xa-uploader-design-token-migration
generated_at: 2026-02-28T00:00:00Z
entries:
  - pattern_summary: eslint --fix corrupts focus-ring utilities with double-prefix on auto-fix
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/xa-uploader-design-token-migration/build-record.user.md#unexpected-findings-resolved-without-scope-expansion
    idea_key: eslint-fix-focus-ring-double-prefix
    classifier_input:
      idea_id: eslint-fix-focus-ring-double-prefix
      title: eslint --fix double-prefixes focus-ring utilities — post-fix verification step needed
      source_path: docs/plans/xa-uploader-design-token-migration/results-review.user.md
      source_excerpt: eslint --fix rewrote focus:ring-2 focus:ring-X/20 to focus-visible:focus:ring-2 focus-visible:focus:ring-X/20 (double-prefix, invalid); all affected lines required manual correction
      created_at: 2026-02-28T00:00:00Z
      trigger: artifact_delta
      artifact_id: results-review
      evidence_refs:
        - docs/plans/xa-uploader-design-token-migration/build-record.user.md#unexpected-findings-resolved-without-scope-expansion
      area_anchor: XA uploader design system migration — eslint --fix side effects
      content_tags:
        - tooling
        - reliability
        - design-system
  - pattern_summary: ds/min-tap-size inline disable must be placed before className attribute line
    category: deterministic
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/xa-uploader-design-token-migration/build-record.user.md#unexpected-findings-resolved-without-scope-expansion
    idea_key: ds-min-tap-size-disable-placement
    classifier_input:
      idea_id: ds-min-tap-size-disable-placement
      title: ds/min-tap-size disable placement rule — fires on className attribute line not button tag
      source_path: docs/plans/xa-uploader-design-token-migration/results-review.user.md
      source_excerpt: ds/min-tap-size rule fires on className attribute line, not the button element opening tag — inline disables must be placed between JSX attributes immediately before className
      created_at: 2026-02-28T00:00:00Z
      trigger: artifact_delta
      artifact_id: results-review
      evidence_refs:
        - docs/plans/xa-uploader-design-token-migration/build-record.user.md#unexpected-findings-resolved-without-scope-expansion
      area_anchor: XA uploader design system migration — inline disable placement rules
      content_tags:
        - design-system
        - tooling
        - process
  - pattern_summary: Lint JSON output would reduce per-file agent reasoning in design-system migrations
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/xa-uploader-design-token-migration/results-review.user.md#new-idea-candidates
    idea_key: lint-json-output-pre-migration
    classifier_input:
      idea_id: lint-json-output-pre-migration
      title: Use eslint --format json before migration to get exact violation line numbers
      source_path: docs/plans/xa-uploader-design-token-migration/results-review.user.md
      source_excerpt: agent read each file manually to identify which rules needed targeted disables; eslint --format json would give exact line numbers deterministically
      created_at: 2026-02-28T00:00:00Z
      trigger: artifact_delta
      artifact_id: results-review
      evidence_refs:
        - docs/plans/xa-uploader-design-token-migration/results-review.user.md#new-idea-candidates
      area_anchor: XA uploader design system migration — AI-to-mechanistic opportunity
      content_tags:
        - tooling
        - ai-to-mechanistic
        - efficiency
---

# Pattern Reflection

## Patterns

- `ad_hoc` | `eslint --fix corrupts focus-ring utilities with double-prefix on auto-fix` | routing: `defer` | occurrences: `1`
- `deterministic` | `ds/min-tap-size inline disable must be placed before className attribute line` | routing: `defer` | occurrences: `1`
- `ad_hoc` | `Lint JSON output would reduce per-file agent reasoning in design-system migrations` | routing: `defer` | occurrences: `1`

## Access Declarations

None identified.
