---
schema_version: pattern-reflection.v1
feature_slug: brik-recovery-quote-server-email-send-point
generated_at: 2026-03-02T14:00:00Z
entries:
  - pattern_summary: tsconfig local paths block did not inherit base email package mappings
    category: access_gap
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/brik-recovery-quote-server-email-send-point/build-record.user.md#task-03
    idea_key: brik-tsconfig-email-path-mapping-gap
    classifier_input:
      idea_id: brik-tsconfig-email-path-mapping-gap
      title: brikette tsconfig did not inherit @acme/email path mappings from base config
      source_path: docs/plans/brik-recovery-quote-server-email-send-point/build-record.user.md
      source_excerpt: apps/brikette/tsconfig.json local paths block did not inherit base mappings; @acme/email/send was unresolvable without this change
      created_at: 2026-03-02T00:00:00Z
      trigger: artifact_delta
      artifact_id: build-record
      evidence_refs:
        - docs/plans/brik-recovery-quote-server-email-send-point/build-record.user.md#task-03
      area_anchor: brikette tsconfig path resolution and package inheritance
      content_tags:
        - typescript
        - monorepo
        - config
    access_declarations:
      - data_source: "@acme/email package path mappings in base tsconfig"
        required_access_type: other
        verified_before_build: false
        discovery_event: true
        notes: The base tsconfig defines @acme/email and @acme/email/* path mappings, but apps/brikette/tsconfig.json has a local paths block that does not extend those entries. Discovered during TASK-03 typecheck. Fixed by adding the mappings directly to the local paths block. Future routes or utilities that import @acme/email in brikette will work correctly now.
---

# Pattern Reflection

## Patterns

- `access_gap` | `tsconfig local paths block did not inherit base email package mappings` | routing: `defer` | occurrences: `1`

## Access Declarations

- @acme/email package path mappings in base tsconfig | access: `other` | verified_before_build: `false` | discovery_event: `true` | notes: brikette local paths block did not include @acme/email mappings; discovered and fixed during TASK-03 typecheck pass.
