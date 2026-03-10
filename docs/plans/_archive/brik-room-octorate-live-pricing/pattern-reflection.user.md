---
schema_version: pattern-reflection.v1
feature_slug: brik-room-octorate-live-pricing
generated_at: 2026-02-27T00:00:00Z
entries:
  - pattern_summary: Room ID mismatch discovered mid-build — numeric data-id vs text name
    category: access_gap
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/brik-room-octorate-live-pricing/build-record.user.md#scope-deviations
    idea_key: brik-room-octorate-id-matching
    classifier_input:
      idea_id: brik-room-octorate-id-matching
      title: Octorate room matching uses numeric data-id not text name
      source_path: docs/plans/brik-room-octorate-live-pricing/results-review.user.md
      source_excerpt: octorateRoomName text (Dorm/Double) does not match widgetRoomCode numeric; data-id attribute is the correct match key
      created_at: 2026-02-27T00:00:00Z
      trigger: artifact_delta
      artifact_id: build-record
      area_anchor: BRIK room availability matching — data-id vs name
      content_tags:
        - integration
        - data-model
    access_declarations:
      - data_source: Octorate Octobook HTML data-id attribute
        required_access_type: other
        verified_before_build: false
        discovery_event: true
        notes: The data-id attribute on the h1 element was not documented in the fact-find; confirmed during TASK-RPC Red step by inspecting the HTML parser in route.ts.
---

# Pattern Reflection

## Patterns

- `access_gap` | `Room ID mismatch discovered mid-build — numeric data-id vs text name` | routing: `defer` | occurrences: `1`

## Access Declarations

- Octorate Octobook HTML `data-id` attribute | access: `other` | verified_before_build: `false` | discovery_event: `true`
