---
schema_version: pattern-reflection.v1
feature_slug: bos-ideas-dispatch-20260303-code-signals
generated_at: "2026-03-04T01:30:00.000Z"
entries:
  - pattern_summary: "Bridges built but not wired into post-build entry point"
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - "generate-process-improvements.ts required manual bridge wiring"
  - pattern_summary: "Severity-based routing not yet differentiated for dispatches"
    category: unclassified
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - "results-review New Idea Candidates: flat severity threshold"
---

# Pattern Reflection

## Patterns

- **Bridges built but not wired into post-build entry point** (ad_hoc, occurrence: 1, routing: defer): New signal bridges are standalone scripts but must also be imported and called from generate-process-improvements.ts to run automatically. This wiring step was missed in the initial build.
- **Severity-based routing not yet differentiated** (unclassified, occurrence: 1, routing: defer): All dispatch candidates use a flat severity threshold regardless of finding criticality. Tiered routing (critical → fact_find_ready, warning → briefing_ready) would improve signal quality.

## Access Declarations

None identified.
