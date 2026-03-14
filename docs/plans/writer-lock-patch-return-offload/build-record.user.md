# Build Record: Writer Lock Patch-Return Offload

**Plan:** docs/plans/writer-lock-patch-return-offload/plan.md
**Feature slug:** writer-lock-patch-return-offload
**Build completed:** 2026-03-12
**Business:** BRIK

## Outcome Contract

- **Why:** The shared-checkout mutable Codex offload pattern held the writer lock for the full Codex session, blocking unrelated repo work. The patch-return pilot externalises the Codex run to an isolated environment and narrows the lock window to only the apply-and-commit phase.
- **Intended Outcome Type:** Platform capability
- **Intended Outcome Statement:** The `lp-do-build` business-artifact lane uses patch-return offload by default when Codex is available, reducing writer-lock hold time and eliminating shared-checkout mutation during the Codex run.
- **Source:** docs/plans/writer-lock-patch-return-offload/plan.md

## What Was Built

The full patch-return pilot for the `build-biz` executor lane:

1. **Isolated runner contract** (`TASK-08/09`): isolated `CODEX_HOME` per run using only `auth.json` and a minimal `config.toml` (verified model `gpt-5.4`). Prevents MCP startup contamination.

2. **Artifact-emission spike** (`TASK-10/11`): root-cause analysis of TASK-09 failure (prompt design triggered agentic tool-call loop). Fix: self-contained text-transformation prompt with file content inline, no tool-constraint language. Verified: clean unified diff artifact, exit 0, no shared-checkout mutation.

3. **Protocol and executor docs** (`TASK-03`): `build-offload-protocol.md` Patch-Return Pilot Contract (runner setup, prompt design rules, invocation, apply window, fallback). `lp-do-build/SKILL.md` and `build-biz.md` updated to route `CODEX_OK=1` to the pilot.

4. **Offload helper** (`TASK-04`): `scripts/agents/build-offload-patch-return.sh` — takes `--prompt-file` and `--patch-out`, creates isolated CODEX_HOME, runs `codex exec --sandbox read-only`, captures unified-diff artifact. Fails closed on empty artifact or non-zero exit.

5. **Apply-window spike** (`TASK-05`): validated `git apply --check` → `git apply` → fingerprint check → commit sequence under continuous writer lock. `git rev-parse HEAD` (pre) and `git diff --name-only` (post) are the two sufficient fingerprint signals. Lock is acquired once before Codex run and released after commit — no release/reacquire gap.

6. **Pilot wiring** (`TASK-06/07`): `build-offload-protocol.md` §4 Apply Window activated; `build-biz.md` post-execution steps unconditional; `--no-index` fallback documented for Codex diff headers without `a/b/` prefix.

## Files Delivered

| File | Status |
|---|---|
| `scripts/agents/build-offload-patch-return.sh` | Created |
| `docs/plans/writer-lock-patch-return-offload/artifact-emission-investigation.md` | Created |
| `docs/plans/writer-lock-patch-return-offload/spike-11-artifact-emission.md` | Created |
| `docs/plans/writer-lock-patch-return-offload/spike-05-apply-window.md` | Created |
| `.claude/skills/_shared/build-offload-protocol.md` | Modified — Pilot Contract active |
| `.claude/skills/lp-do-build/SKILL.md` | Modified — CODEX_OK routing |
| `.claude/skills/lp-do-build/modules/build-biz.md` | Modified — pilot wired |

## Validation Summary

| Task | TC | Result |
|---|---|---|
| TASK-03 | TC-01/02/03 | All pass |
| TASK-04 | TC-01/02/03 | All pass (bash -n, dry-run artifacts, checkout unchanged) |
| TASK-05 | TC-01/02/03 | All pass (fingerprint, lock hold, no gaps) |
| TASK-07 | TC-01/02/03 | All pass (routing, fallback, diff-check) |

## Engineering Coverage Evidence

Plan execution-track: code. Changed files: shell scripts + skill/protocol markdown docs. No TypeScript, Jest, or compiled artifacts changed. `scripts/validate-engineering-coverage.sh` coverage check: skill docs and shell scripts are not governed by the Jest coverage contract — coverage requirement does not apply to this deliverable type.

## Workflow Telemetry Summary

- Modules used: `build-code.md`, `build-spike.md`, `build-investigate.md`, `build-biz.md`, `build-checkpoint.md`
- Input paths: `docs/plans/writer-lock-patch-return-offload/plan.md`, investigation/spike artifacts
- Deterministic check: `bash -n` (helper script), `grep` (TC checks)
- Codex token usage: not auto-captured (CODEX_THREAD_ID not available)
- Build cycles: 5 tasks + 1 checkpoint, all inline route

## Rollback

Revert the three skill/protocol docs and delete `scripts/agents/build-offload-patch-return.sh`. Legacy shared-checkout route documentation remains in `build-offload-protocol.md` under "Legacy Offload Invocation."
