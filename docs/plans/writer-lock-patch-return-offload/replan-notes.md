---
artifact: replan-notes
task-trigger: TASK-02 CHECKPOINT (invalidating runtime spike)
scope: TASK-03, TASK-04, TASK-05, TASK-07
date: 2026-03-09
Replan-round: 1
---

# Replan Notes — Runtime Isolation Precursor Chain

## Trigger

TASK-02 CHECKPOINT reviewed [spike-01-codex-patch-return.md](/Users/petercowling/base-shop/docs/plans/writer-lock-patch-return-offload/spike-01-codex-patch-return.md) and classified the downstream implementation path as invalidated in its current form.

## Confirmed Evidence

### 1. Active `codex exec` approval guidance is stale
- `codex exec --help` does not expose `-a/--ask-for-approval`.
- `codex exec -a never --help` exits with `unexpected argument '-a' found`.
- Root `codex --help` still advertises `-a/--ask-for-approval`, so the CLI surface is inconsistent.

### 2. Default runtime loads MCP and state surfaces that are irrelevant to a self-contained patch-return packet
- `codex mcp list` shows two enabled servers:
  - `base-shop`
  - `ts-language`
- `codex mcp get base-shop` and `codex mcp get ts-language` confirm both are enabled in the default config.
- Probe B attempted `--ephemeral -c 'mcp_servers={}'`, yet stderr still showed:
  - `base-shop starting`
  - `ts-language starting`
  - `ts-language` connection failure

### 3. The current local Codex home is a heavy shared runtime state, not a clean packet executor
Read-only inspection of `~/.codex` found:
- `auth.json`
- `config.toml`
- `state_5.sqlite`
- `state_5.sqlite-wal`
- `skills/`
- `shell_snapshots/`
- `archived_sessions/`

This is consistent with the spike stderr showing repeated state DB warnings and MCP startup noise during temp-repo packet probes.

## Replan Decision

Do **not** proceed directly from TASK-02 into protocol/helper implementation.

Add an explicit precursor chain:

1. `TASK-08` INVESTIGATE
   - determine the supported isolated Codex runner contract
   - define how patch-return runs avoid default MCP/state contamination
   - recommend the exact runner shape for the next spike
2. `TASK-09` SPIKE
   - validate that isolated runner shape in a temp git repo
   - require prompt exit plus emitted unified diff artifact before protocol/helper work resumes

## Why This Precursor Chain Is Required

Without runtime isolation evidence:
- TASK-03 would update active protocol/docs around an unproven runner
- TASK-04 would encode helper behavior against a runner that currently hangs and emits no artifact
- TASK-05 would be blocked by upstream tool uncertainty rather than testing the apply window itself

This would violate the confidence protocol: the unresolved unknown is non-trivial and therefore must become explicit precursor work.

## Downstream Task Deltas

### TASK-03
- Old state: ready to update protocol/docs immediately after TASK-02
- New state: blocked behind `TASK-08` and `TASK-09`
- Confidence: reduced below IMPLEMENT threshold until runtime isolation is evidenced

### TASK-04
- Old state: helper implementation could follow TASK-03 directly
- New state: helper blocked behind validated runner contract and protocol update
- Confidence: reduced below IMPLEMENT threshold until upstream runner behavior is evidenced

### TASK-05
- Old state: apply-window spike assumed helper-ready patch artifacts
- New state: blocked behind helper and isolated-runner proof
- Confidence: reduced below SPIKE threshold until helper path exists

### TASK-07
- Remains below threshold and blocked on the later pilot chain

## Sequencing Outcome

Stable IDs preserved. New tasks inserted ahead of protocol/helper work:

1. TASK-01 complete
2. TASK-02 complete
3. TASK-08 investigate runtime isolation
4. TASK-09 spike isolated runner
5. TASK-03 protocol/docs
6. TASK-04 helper
7. TASK-05 apply-window spike
8. TASK-06 checkpoint
9. TASK-07 pilot

## Ready State After Replan

**Partially ready.**

The plan remains buildable because the new precursor chain is runnable. The next eligible task is `TASK-08` (INVESTIGATE). Downstream IMPLEMENT/SPIKE tasks stay intentionally below threshold until the precursor evidence exists.
