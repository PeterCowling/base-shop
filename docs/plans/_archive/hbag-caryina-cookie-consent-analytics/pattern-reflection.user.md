---
schema_version: pattern-reflection.v1
feature_slug: hbag-caryina-cookie-consent-analytics
generated_at: 2026-03-01T00:00:00Z
entries:
  - pattern_summary: Generated content JSON not updated when source content packet changes
    category: access_gap
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/hbag-caryina-cookie-consent-analytics/results-review.user.md#new-idea-candidates
      - docs/plans/hbag-caryina-cookie-consent-analytics/build-record.user.md#operator-actions-required-before-launch
    idea_key: hbag-caryina-site-content-regen-gate
    classifier_input:
      idea_id: hbag-caryina-site-content-regen-gate
      title: Pre-launch gate to regenerate site-content JSON after content packet changes
      source_path: docs/plans/hbag-caryina-cookie-consent-analytics/results-review.user.md
      source_excerpt: TASK-06 updated the content packet but site-content.generated.json must be regenerated separately — discovered mid-build as a manual follow-up step
      created_at: 2026-03-01T00:00:00Z
      trigger: operator_idea
      artifact_id: results-review
      evidence_refs:
        - docs/plans/hbag-caryina-cookie-consent-analytics/build-record.user.md#operator-actions-required-before-launch
      area_anchor: caryina pre-launch content freshness — generated JSON stale after content packet update
      content_tags:
        - content
        - pre-launch
        - automation

## Access Declarations
- data_source: GA4 Measurement ID (operator-held)
  required_access_type: credentials
  verified_before_build: false
  discovery_event: false
  notes: Known upfront — plan documented placeholder approach; ID must be supplied by operator at deploy time
