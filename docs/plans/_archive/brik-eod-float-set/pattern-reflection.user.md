---
schema_version: pattern-reflection.v1
feature_slug: brik-eod-float-set
generated_at: 2026-02-28T00:00:00.000+01:00
entries:
  - pattern_summary: Concurrent agent lint pollution blocks commit hook on unrelated files
    category: ad_hoc
    routing_target: defer
    occurrence_count: 2
    evidence_refs:
      - docs/plans/brik-eod-float-set/build-record.user.md#scope-deviations
    idea_key: concurrent-agent-lint-pollution

  - pattern_summary: Codex under writer lock blocks governed test runner admission gate
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - docs/plans/brik-eod-float-set/build-record.user.md#what-was-built
    idea_key: codex-writer-lock-test-deadlock
---

# Pattern Reflection

## Patterns

**1. Concurrent agent lint pollution blocks commit hook on unrelated files**
- Category: ad_hoc
- Routing target: defer (occurrence_count=2, threshold for skill_proposal is >=2 — borderline; defer pending a third occurrence)
- Summary: Concurrent plans (brik-eod-day-closed-confirmation, brik-stock-count-variance-reason-codes) introduced lint errors in files not in scope for this build. The pre-commit lint-staged hook ran across all staged files including those from the concurrent agent's staged set. Required `eslint --fix` on out-of-scope files before retry.
- Idea_key: concurrent-agent-lint-pollution

**2. Codex under writer lock blocks governed test runner admission gate**
- Category: ad_hoc
- Routing target: defer (occurrence_count=1, threshold for skill_proposal is >=2)
- Summary: When codex was run inside the writer lock subshell, the governed test runner's admission gate timed out because the lock was already held. Pattern: run codex for file writes, kill before test phase, run tests directly outside the lock.
- Idea_key: codex-writer-lock-test-deadlock

## Access Declarations

None identified.
