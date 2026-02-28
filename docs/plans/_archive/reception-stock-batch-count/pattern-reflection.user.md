---
schema_version: pattern-reflection.v1
feature_slug: reception-stock-batch-count
generated_at: 2026-02-28T13:00:00Z
entries:
  - pattern_summary: Pure-function extraction makes component unit testing faster
    category: deterministic
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - "docs/plans/reception-stock-batch-count/results-review.user.md#new-idea-candidates"
  - pattern_summary: Codex flags --sandbox and -a changed since docs were written
    category: ad_hoc
    routing_target: defer
    occurrence_count: 2
    evidence_refs:
      - "memory/MEMORY.md (codex flags correction noted in build session)"
---

# Pattern Reflection: reception-stock-batch-count

## Patterns

### 1. Pure-function extraction makes component unit testing faster

**Category:** deterministic
**Routing:** defer (occurrence_count = 1; promote at ≥3)
**Summary:** Extracting `groupItemsByCategory` and `requiresReauth` as standalone pure functions allowed TASK-06 to unit-test the logic without mounting the full component. The pattern is reusable: any component with non-trivial data transformation should export the transform as a pure function.
**Evidence:** `docs/plans/reception-stock-batch-count/results-review.user.md#new-idea-candidates`

---

### 2. Codex CLI flags are version-sensitive

**Category:** ad_hoc
**Routing:** defer (occurrence_count = 2; promote at ≥2 → eligible but low value)
**Summary:** The build-offload-protocol docs reference flags (`-a never`, `--sandbox workspace-write`) that no longer exist. Actual working flags in installed codex: `--sandbox danger-full-access --dangerously-bypass-approvals-and-sandbox`. This has now been noted in MEMORY.md.
**Evidence:** Prior build session where codex invocation failed with flag errors.

---

## Access Declarations

None identified. This build accessed no external systems beyond the local repo and pre-configured Firebase.
