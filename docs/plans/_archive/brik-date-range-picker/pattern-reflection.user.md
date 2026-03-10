---
schema_version: pattern-reflection.v1
feature_slug: brik-date-range-picker
generated_at: 2026-02-28T18:25:00Z
entries:
  - pattern_summary: Lint-gate hotspots hit predictably on large UI surface rewires
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/brik-date-range-picker/build-record.user.md#scope-deviations
      - docs/plans/brik-date-range-picker/results-review.user.md#new-idea-candidates
    idea_key: brik-drp-lint-preflight-gap
    classifier_input:
      idea_id: brik-drp-lint-preflight-gap
      title: Add lint-constraint preflight checklist before large UI surface rewires
      source_path: docs/plans/brik-date-range-picker/results-review.user.md
      source_excerpt: multiple controlled scope expansions were required in this build to clear lint gates that were predictable upfront
      created_at: 2026-02-28T00:00:00Z
      trigger: operator_idea
      artifact_id: results-review
      evidence_refs:
        - docs/plans/brik-date-range-picker/build-record.user.md#scope-deviations
      area_anchor: brikette UI surface rewire — lint hotspot expansions
      content_tags:
        - process
        - lint
        - planning

  - pattern_summary: Manual i18n key propagation to 17 non-EN locales with no gate
    category: deterministic
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/brik-date-range-picker/build-record.user.md#what-was-built
      - docs/plans/brik-date-range-picker/results-review.user.md#new-idea-candidates
    idea_key: brik-drp-locale-parity-check
    classifier_input:
      idea_id: brik-drp-locale-parity-check
      title: Deterministic locale-key parity check for new i18n keys across namespace files
      source_path: docs/plans/brik-date-range-picker/results-review.user.md
      source_excerpt: manually propagated new keys to EN plus 17 non-EN locale files across two namespaces — no automated gate existed
      created_at: 2026-02-28T00:00:00Z
      trigger: operator_idea
      artifact_id: results-review
      evidence_refs:
        - docs/plans/brik-date-range-picker/build-record.user.md#what-was-built
      area_anchor: brikette i18n — locale key parity enforcement gap
      content_tags:
        - i18n
        - process
        - deterministic
---

# Pattern Reflection

## Patterns

- `ad_hoc` | `Lint-gate hotspots hit predictably on large UI surface rewires` | routing: `defer` | occurrences: `1`
  - Four lint-rule violations (max-lines-per-function, ds/no-hardcoded-copy, import/first, simple-import-sort) required controlled scope expansions during Wave 2 migration. These rule constraints are known upfront and could be flagged in a planning preflight step before committing to a surface-migration task scope.

- `deterministic` | `Manual i18n key propagation to 17 non-EN locales with no gate` | routing: `defer` | occurrences: `1`
  - New i18n keys for `modals` and `bookPage` namespaces were added to EN and then manually copied as placeholders to 17 non-EN locale files. No automated parity check gate confirmed coverage. This pattern has also appeared in prior locale-heavy builds (guide translations, bookPage additions). Occurrence count set to 1 for this specific build artifact; likely higher across the full build history.

## Access Declarations

None identified.
