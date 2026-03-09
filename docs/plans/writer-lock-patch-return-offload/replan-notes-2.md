---
artifact: replan-notes
task-trigger: TASK-09 SPIKE (isolated runner unified-diff failure)
scope: TASK-03, TASK-04, TASK-05, TASK-07
date: 2026-03-09
Replan-round: 2
---

# Replan Notes — Artifact Emission Precursor Chain

## Trigger

TASK-09 reviewed the isolated runner path defined by TASK-08 and classified the downstream implementation path as invalidated in its current form.

## Confirmed Evidence

### 1. Runtime isolation works

- temporary `CODEX_HOME` with copied `auth.json` plus minimal `config.toml`
- stderr reported `mcp startup: no servers`
- no shared-home MCP startup
- no shared-home state DB migration warnings

### 2. Prompt unified-diff emission still failed

- stdout contained only the Node banner
- `last-message.txt` remained empty
- no unified diff artifact was emitted
- the run did not complete promptly and was terminated manually after roughly thirty seconds

### 3. Safety contract held

- shared checkout before/after snapshots matched exactly
- temp repo file content remained unchanged (`sample.txt` stayed `alpha`)

## Replan Decision

Do **not** proceed directly from TASK-09 into protocol/helper implementation.

Add another explicit precursor chain:

1. `TASK-10` INVESTIGATE
   - determine which final-output channel is reliable under the isolated runner
   - compare `output-last-message`, JSON event output, prompt delivery shape, and structured output options from the current CLI surface
   - recommend one bounded artifact-emission contract for the next spike
2. `TASK-11` SPIKE
   - validate that bounded artifact-emission contract in a temp repo
   - require prompt exit plus emitted artifact before protocol/helper work resumes

## Why This Precursor Chain Is Required

Without output-channel evidence:

- TASK-03 would update active protocol/docs around an artifact contract that still does not emit
- TASK-04 would encode helper behavior against an empty final-message path
- TASK-05 would still be blocked by upstream artifact transport uncertainty rather than testing the apply window itself

This is a different unknown from TASK-08. Runtime contamination is now reduced; artifact emission remains unresolved.

## Downstream Task Deltas

### TASK-03

- Old state: blocked only on isolated-runner proof
- New state: blocked behind output-channel investigation plus artifact-emission spike
- Confidence: reduced below IMPLEMENT threshold until emitted-artifact evidence exists

### TASK-04

- Old state: helper could follow protocol once isolated runner worked
- New state: helper remains blocked because the isolated runner still does not return an artifact
- Confidence: reduced below IMPLEMENT threshold until upstream artifact-extraction behavior is evidenced

### TASK-05

- Old state: apply-window spike assumed helper-ready patch artifacts
- New state: still blocked behind helper and artifact-emission proof
- Confidence: remains below SPIKE threshold until helper path is real

## Sequencing Outcome

Stable IDs preserved. New tasks inserted ahead of protocol/helper work:

1. TASK-01 complete
2. TASK-02 complete
3. TASK-08 complete
4. TASK-09 complete
5. TASK-10 investigate artifact-emission channel
6. TASK-11 spike bounded artifact-emission path
7. TASK-03 protocol/docs
8. TASK-04 helper
9. TASK-05 apply-window spike
10. TASK-06 checkpoint
11. TASK-07 pilot

## Ready State After Replan

**Partially ready.**

The plan remains buildable because the new precursor chain is runnable. The next eligible task is `TASK-10` (INVESTIGATE). Downstream IMPLEMENT/SPIKE tasks stay intentionally below threshold until emitted-artifact evidence exists.
