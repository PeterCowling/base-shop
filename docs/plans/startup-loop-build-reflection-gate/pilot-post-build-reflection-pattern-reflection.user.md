---
schema_version: pattern-reflection.v1
feature_slug: post-build-reflection-prompting
generated_at: 2026-02-27T18:00:00Z
entries:
  - pattern_summary: LLM compliance-check step replaceable with deterministic category lint
    category: deterministic
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/_archive/post-build-reflection-prompting/results-review.user.md#new-idea-candidates
    idea_key: post-build-reflection-category-lint
    classifier_input:
      idea_id: post-build-reflection-category-lint
      title: Mechanistic lint check that New Idea Candidates covers all five categories
      source_path: docs/plans/_archive/post-build-reflection-prompting/results-review.user.md
      source_excerpt: compliance checking (are all five categories addressed?) is a deterministic pattern-match, not a reasoning task
      created_at: 2026-02-26T00:00:00Z
      trigger: artifact_delta
      artifact_id: results-review
      evidence_refs:
        - docs/plans/_archive/post-build-reflection-prompting/results-review.user.md#new-idea-candidates
      area_anchor: startup-loop build output quality
      content_tags:
        - process
        - reliability
  - pattern_summary: Batch of bounded markdown edits handled manually instead of via skill
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/_archive/post-build-reflection-prompting/results-review.user.md#new-idea-candidates
    idea_key: post-build-docs-patch-skill
    classifier_input:
      idea_id: post-build-docs-patch-skill
      title: docs-patch skill for batched additive SKILL.md edits
      source_path: docs/plans/_archive/post-build-reflection-prompting/results-review.user.md
      source_excerpt: A docs-patch skill that handles batches of bounded markdown edits to SKILL.md files would eliminate the lp-do-build overhead
      created_at: 2026-02-26T00:00:00Z
      trigger: artifact_delta
      artifact_id: results-review
      evidence_refs:
        - docs/plans/_archive/post-build-reflection-prompting/results-review.user.md#new-idea-candidates
      area_anchor: skill workflow efficiency
      content_tags:
        - process
        - skills
---

# Pattern Reflection

## Patterns

- `deterministic` | `LLM compliance-check step replaceable with deterministic category lint` | routing: `defer` | occurrences: `1`
  - Below threshold for loop_update (requires 3+). Deferred. First observation; watch for recurrence.
- `ad_hoc` | `Batch of bounded markdown edits handled manually instead of via skill` | routing: `defer` | occurrences: `1`
  - Below threshold for skill_proposal (requires 2+). Deferred. First observation.

## Access Declarations

None identified.
