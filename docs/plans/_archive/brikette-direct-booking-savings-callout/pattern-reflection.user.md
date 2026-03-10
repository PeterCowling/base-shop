---
schema_version: pattern-reflection.v1
feature_slug: brikette-direct-booking-savings-callout
generated_at: 2026-02-27T00:00:00Z
entries:
  - pattern_summary: Python script used to propagate EN fallback keys to 17 non-EN locale files
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/brikette-direct-booking-savings-callout/plan.md#task-05
      - docs/plans/brikette-direct-booking-savings-callout/build-record.user.md#what-was-built
    idea_key: brikette-locale-fallback-propagation-script
    classifier_input:
      idea_id: brikette-locale-fallback-propagation-script
      title: Automate EN fallback propagation to non-EN locale files
      source_path: docs/plans/brikette-direct-booking-savings-callout/build-record.user.md
      source_excerpt: Python json.load/json.dumps(ensure_ascii=False) script safely added keys to 17 non-Latin locale files
      created_at: 2026-02-27T00:00:00Z
      trigger: artifact_delta
      artifact_id: build-record
      evidence_refs:
        - docs/plans/brikette-direct-booking-savings-callout/build-record.user.md#what-was-built
      area_anchor: brikette i18n locale propagation — repeatable multi-file JSON edit
      content_tags:
        - i18n
        - automation
        - tooling
---

# Pattern Reflection

## Patterns

- `ad_hoc` | `Python script used to propagate EN fallback keys to 17 non-EN locale files` | routing: `defer` | occurrences: `1`

  When adding new i18n keys to EN locale files, the corresponding EN fallback must be added to all 17 non-EN locale files. This build used a Python `json.load`/`json.dumps(ensure_ascii=False)` script to do this safely without corrupting non-Latin characters (Cyrillic, Arabic, CJK). This is a recurring pattern (any new i18n key addition triggers this step) and a candidate for a deterministic automation tool once observed a second time.

## Access Declarations

None identified.
