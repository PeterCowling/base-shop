---
schema_version: pattern-reflection.v1
feature_slug: hbag-pdp-trust-cues
generated_at: 2026-02-28T15:30:00Z
entries:
  - pattern_summary: Concurrent agent constraint violation — hardcoded string bypassed content-packet invariant
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/hbag-pdp-trust-cues/build-record.user.md#scope-deviations
      - docs/plans/hbag-pdp-trust-cues/results-review.user.md#new-idea-candidates
    idea_key: hbag-trust-cues-hardcoded-string-regression
    classifier_input:
      idea_id: hbag-trust-cues-hardcoded-string-regression
      title: Add deterministic lint check to catch hardcoded trust-line strings in PDP wiring
      source_path: docs/plans/hbag-pdp-trust-cues/results-review.user.md
      source_excerpt: concurrent agent committed a hardcoded trustLine constraint violation that had to be corrected before the wave-3 commit
      created_at: "2026-02-28T00:00:00Z"
      trigger: artifact_delta
      artifact_id: results-review
      evidence_refs:
        - docs/plans/hbag-pdp-trust-cues/results-review.user.md#new-idea-candidates
      area_anchor: content-packet invariant enforcement in PDP wiring
      content_tags:
        - reliability
        - process
        - concurrent-agents

  - pattern_summary: Materializer does not model new manual content-packet extensions — risk of silent overwrite
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/hbag-pdp-trust-cues/plan.md#non-goals
      - docs/plans/hbag-pdp-trust-cues/results-review.user.md#new-idea-candidates
    idea_key: hbag-trust-cues-materializer-parity-gate
    classifier_input:
      idea_id: hbag-trust-cues-materializer-parity-gate
      title: Add pre-merge materializer-parity gate for manual site-content.generated.json extensions
      source_path: docs/plans/hbag-pdp-trust-cues/results-review.user.md
      source_excerpt: the materializer does not model productPage.trustStrip; _manualExtension is a temporary guard and a follow-on mitigation task is explicitly noted in the plan non-goals
      created_at: "2026-02-28T00:00:00Z"
      trigger: artifact_delta
      artifact_id: results-review
      evidence_refs:
        - docs/plans/hbag-pdp-trust-cues/results-review.user.md#new-idea-candidates
      area_anchor: site-content.generated.json materializer parity
      content_tags:
        - reliability
        - process
        - materializer
---

# Pattern Reflection

## Patterns

- `ad_hoc` | `Concurrent agent constraint violation — hardcoded string bypassed content-packet invariant` | routing: `defer` | occurrences: `1`
  - A concurrent agent (`hbag-pdp-shipping-returns`) committed a hard-coded `trustLine` string to `page.tsx`, violating the plan constraint that all trust copy must flow from the content packet. The violation was caught and corrected in the same wave-3 atomic commit. No existing lint rule or automated check prevented it. Occurrence count 1 — below the `ad_hoc` promotion threshold of 2; routing: defer.

- `ad_hoc` | `Materializer does not model new manual content-packet extensions — risk of silent overwrite` | routing: `defer` | occurrences: `1`
  - The plan explicitly noted that the materializer does not model `productPage.trustStrip` and added a `_manualExtension` guard as a temporary mitigation. A future materializer re-run would silently remove the trust copy. No pre-merge parity gate exists. Occurrence count 1 — below the `ad_hoc` promotion threshold of 2; routing: defer.

## Access Declarations

None identified.
