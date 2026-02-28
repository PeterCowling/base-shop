---
schema_version: pattern-reflection.v1
feature_slug: hbag-pdp-return-visit-capture
generated_at: 2026-02-28T00:00:00Z
entries:
  - pattern_summary: Fire-and-forget email with no queryable capture store
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/hbag-pdp-return-visit-capture/results-review.user.md#new-idea-candidates
    idea_key: hbag-notify-me-db-capture-store
    classifier_input:
      idea_id: hbag-notify-me-db-capture-store
      title: Track notify-me submissions in a DB table to enable automated follow-up campaigns
      source_path: docs/plans/hbag-pdp-return-visit-capture/results-review.user.md
      source_excerpt: v1 fire-and-forget sends to merchant inbox — no queryable capture store for automated follow-up
      created_at: 2026-02-28T00:00:00Z
      trigger: artifact_delta
      artifact_id: results-review
      evidence_refs:
        - docs/plans/hbag-pdp-return-visit-capture/results-review.user.md#new-idea-candidates
      area_anchor: HBAG PDP return-visit capture — email submission persistence
      content_tags:
        - conversion
        - email
        - database
  - pattern_summary: Email send path has no delivery confirmation or bounce visibility
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/hbag-pdp-return-visit-capture/results-review.user.md#new-idea-candidates
    idea_key: hbag-notify-me-resend-upgrade
    classifier_input:
      idea_id: hbag-notify-me-resend-upgrade
      title: Upgrade email provider to Resend for deliverability and bounce tracking
      source_path: docs/plans/hbag-pdp-return-visit-capture/results-review.user.md
      source_excerpt: sendSystemEmail via Gmail SMTP silently simulates if credentials absent; no delivery confirmation or bounce visibility
      created_at: 2026-02-28T00:00:00Z
      trigger: artifact_delta
      artifact_id: results-review
      evidence_refs:
        - docs/plans/hbag-pdp-return-visit-capture/results-review.user.md#new-idea-candidates
      area_anchor: HBAG PDP return-visit capture — email provider reliability
      content_tags:
        - email
        - deliverability
        - infrastructure
---

# Pattern Reflection

## Patterns

- `ad_hoc` | `Fire-and-forget email with no queryable capture store` | routing: `defer` | occurrences: `1`
- `ad_hoc` | `Email send path has no delivery confirmation or bounce visibility` | routing: `defer` | occurrences: `1`

Both patterns are deferred: each is observed for the first time in this build. The ad_hoc promotion threshold is `occurrence_count >= 2`. If either pattern recurs in a future build, it should be promoted to a `skill_proposal`.

## Access Declarations

None identified.
