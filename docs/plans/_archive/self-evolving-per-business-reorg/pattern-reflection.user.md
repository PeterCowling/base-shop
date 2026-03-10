---
schema_version: pattern-reflection.v1
feature_slug: self-evolving-per-business-reorg
generated_at: 2026-03-03T09:57:00.000Z
entries:
  - summary: "Stale-path grep verification is a manual step in every reorg build"
    category: deterministic
    routing_target: defer
    occurrence_count: 2
  - summary: "Directory reorg + path constant update is a repeatable pattern"
    category: deterministic
    routing_target: defer
    occurrence_count: 2
---

# Pattern Reflection

## Patterns

1. **Stale-path grep verification is a manual step in every reorg build**
   - Category: deterministic
   - Routing: defer (occurrence_count=2, below threshold of 3 for loop_update)
   - Occurrences: 2 (startup-loop-root-containers, self-evolving-per-business-reorg)
   - Notes: Both reorg builds required a comprehensive grep for stale paths after file moves. A deterministic post-move scanner could automate this.

2. **Directory reorg + path constant update is a repeatable pattern**
   - Category: deterministic
   - Routing: defer (occurrence_count=2, below threshold of 3 for loop_update)
   - Occurrences: 2 (startup-loop-root-containers, self-evolving-per-business-reorg)
   - Notes: Both dispatches followed the same sequence: create dirs, git mv files, update TS constants, update embedded paths, verify. A path-migration skill could codify this.

## Access Declarations

None identified.
