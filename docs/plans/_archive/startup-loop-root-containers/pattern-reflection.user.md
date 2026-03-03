---
schema_version: pattern-reflection.v1
feature_slug: startup-loop-root-containers
generated_at: 2026-03-03T00:00:00Z
entries:
  - pattern_summary: Stale path references discovered far beyond fact-find enumeration
    category: deterministic
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/startup-loop-root-containers/build-record.user.md#scope-deviations
      - docs/plans/startup-loop-root-containers/results-review.user.md#new-idea-candidates
    idea_key: stale-path-scan-gate
    classifier_input:
      idea_id: stale-path-scan-gate
      title: Add repo-wide stale path scan gate when container/file moves occur
      source_path: docs/plans/startup-loop-root-containers/results-review.user.md
      source_excerpt: TASK-06 expanded to fix ~70 additional stale references discovered by comprehensive grep
      created_at: 2026-03-03T00:00:00Z
      trigger: artifact_delta
      artifact_id: results-review
      evidence_refs:
        - docs/plans/startup-loop-root-containers/results-review.user.md#new-idea-candidates
      area_anchor: startup-loop build verification and path integrity
      content_tags:
        - process
        - reliability
  - pattern_summary: Manual grep used to verify exhaustive path migration
    category: deterministic
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/startup-loop-root-containers/build-record.user.md#scope-deviations
      - docs/plans/startup-loop-root-containers/results-review.user.md#new-idea-candidates
    idea_key: deterministic-moved-path-manifest-check
    classifier_input:
      idea_id: deterministic-moved-path-manifest-check
      title: Deterministic moved-path manifest check to auto-verify all old-to-new references
      source_path: docs/plans/startup-loop-root-containers/results-review.user.md
      source_excerpt: comprehensive grep was used manually to find stale references during scope expansion
      created_at: 2026-03-03T00:00:00Z
      trigger: artifact_delta
      artifact_id: results-review
      evidence_refs:
        - docs/plans/startup-loop-root-containers/results-review.user.md#new-idea-candidates
      area_anchor: startup-loop build automation and verification tooling
      content_tags:
        - automation
        - tooling
  - pattern_summary: Multi-surface path updates needed across scripts, docs, skills, registries
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/startup-loop-root-containers/build-record.user.md#tasks-completed
      - docs/plans/startup-loop-root-containers/results-review.user.md#new-idea-candidates
    idea_key: root-container-path-migration-skill
    classifier_input:
      idea_id: root-container-path-migration-skill
      title: Codify reusable root-container path migration skill for docs and code refs
      source_path: docs/plans/startup-loop-root-containers/results-review.user.md
      source_excerpt: this build required broad multi-surface path updates including scripts, docs, skills, and registries
      created_at: 2026-03-03T00:00:00Z
      trigger: artifact_delta
      artifact_id: results-review
      evidence_refs:
        - docs/plans/startup-loop-root-containers/results-review.user.md#new-idea-candidates
      area_anchor: startup-loop skill library and reuse
      content_tags:
        - skill
        - reuse
---

# Pattern Reflection

## Patterns

- `deterministic` | `Stale path references discovered far beyond fact-find enumeration` | routing: `defer` | occurrences: `1`
- `deterministic` | `Manual grep used to verify exhaustive path migration` | routing: `defer` | occurrences: `1`
- `ad_hoc` | `Multi-surface path updates needed across scripts, docs, skills, registries` | routing: `defer` | occurrences: `1`

## Access Declarations

None identified.
