---
schema_version: pattern-reflection.v1
feature_slug: reception-eod-closeout
generated_at: 2026-02-28T00:00:00Z
entries:
  - pattern_summary: Codex exec flag API mismatch causes build offload fallback to inline
    category: access_gap
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - "docs/plans/reception-eod-closeout/plan.md#task-01-build-evidence"
---

# Pattern Reflection: Reception EOD Close-Out

## Patterns

### Pattern 1 — Codex exec flag API mismatch causes build offload fallback to inline

- **Summary:** Codex exec flag API changed — `-a never` flag removed in current version (`/Users/petercowling/.nvm/versions/node/v22.16.0/bin/codex`). The `build-offload-protocol.md` uses `codex exec -a never --sandbox workspace-write` which now returns `EXIT:2 "unexpected argument '-a' found"`. This causes every build offload attempt to fall through to inline execution.
- **Category:** `access_gap` (infrastructure mismatch discovered mid-build)
- **Routing:** `defer` (occurrence_count = 1; below `access_gap` promotion threshold)
- **Occurrence count:** 1

**Recommended action when threshold is met:** Update `build-offload-protocol.md` to use the current codex exec API. Look up `codex exec --help` to identify the current flag for bypassing approvals and confirm the sandbox mode flag.

## Access Declarations

- **Source:** `codex` binary at `/Users/petercowling/.nvm/versions/node/v22.16.0/bin/codex`
- **Required access type:** `exec` (build task offload)
- **Verified before build:** Yes — binary exists and `codex --version` returns successfully
- **Discovery event:** Yes — flag API mismatch discovered at offload invocation time (not at preflight)
