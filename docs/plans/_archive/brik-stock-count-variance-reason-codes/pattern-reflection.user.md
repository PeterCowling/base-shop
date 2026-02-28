---
schema_version: pattern-reflection.v1
feature_slug: brik-stock-count-variance-reason-codes
generated_at: 2026-02-28T22:00:00Z
entries:
  - pattern_summary: Codex used English fallback label in Italian operator tool; caught by test run
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/brik-stock-count-variance-reason-codes/build-record.user.md#scope-deviations
    idea_key: codex-locale-consistency-operator-ui
    classifier_input:
      idea_id: codex-locale-consistency-operator-ui
      title: Codex writes English strings in Italian operator UI; caught late by test
      source_path: docs/plans/brik-stock-count-variance-reason-codes/build-record.user.md
      source_excerpt: Codex initially used "Unspecified" as the buildReasonBreakdown fallback; corrected to "Non specificato" per plan spec
      created_at: 2026-02-28T00:00:00Z
      trigger: artifact_delta
      artifact_id: build-record
      evidence_refs:
        - docs/plans/brik-stock-count-variance-reason-codes/build-record.user.md#scope-deviations
      area_anchor: Codex offload locale consistency in Italian operator tools
      content_tags:
        - codex-offload
        - locale
        - reliability
---

# Pattern Reflection

## Patterns

- `ad_hoc` | `Codex used English fallback label in Italian operator tool; caught by test run` | routing: `defer` | occurrences: `1`

  When Codex implements a new UI element in the Italian-language reception app, it defaults to English labels for internal fallback strings. The correct Italian label was specified in the plan ("Non specificato") but Codex chose "Unspecified". The test suite caught it before any commit was made. At occurrence_count=1 this does not cross the skill_proposal threshold. Monitor for recurrence in future builds using Codex offload for Italian-facing operator tools.

## Access Declarations

None identified.
