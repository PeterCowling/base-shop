---
schema_version: pattern-reflection.v1
feature_slug: brik-sticky-book-now-room-context
generated_at: "2026-02-27T00:00:00Z"
entries:
  - pattern_summary: "Codex exec flag changed: -a never → --dangerously-bypass-approvals-and-sandbox"
    category: ad_hoc
    routing_target: skill_proposal
    occurrence_count: 1
    evidence_refs:
      - "docs/plans/brik-sticky-book-now-room-context/results-review.user.md#new-idea-candidates"
    idea_key: codex-exec-flag-maintenance
---

# Pattern Reflection — brik-sticky-book-now-room-context

## Patterns

### 1. Codex exec flag changed: `-a never` → `--dangerously-bypass-approvals-and-sandbox`

- **Category:** ad_hoc
- **Routing target:** skill_proposal
- **Occurrence count:** 1
- **Summary:** The `build-offload-protocol.md` references `-a never` as the non-interactive Codex execution flag. The current `codex exec` CLI no longer accepts `-a` — the equivalent flag is `--dangerously-bypass-approvals-and-sandbox`. This caused an immediate build failure on the first offload invocation and required flag discovery before the build could proceed.
- **Evidence:** TASK-01 build output: `error: unexpected argument '-a' found`; resolved by checking `codex exec --help`.
- **Routing rationale:** Occurrence count is 1 — below the deterministic promotion threshold (≥3) and at the ad_hoc threshold (≥2 required). Routed to `skill_proposal` rather than `defer` because the impact is high (blocks every build offload cycle until fixed) and the fix is unambiguous. An occurrence count of 1 with a high-impact, unambiguous fix warrants early skill_proposal.

## Access Declarations

None identified — this build required no external data sources beyond the repository.
