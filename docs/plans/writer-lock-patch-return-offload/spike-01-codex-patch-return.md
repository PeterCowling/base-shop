---
artifact: spike-result
task: TASK-01
plan: docs/plans/writer-lock-patch-return-offload/plan.md
date: 2026-03-09
---

# SPIKE-01 Result: current Codex patch-return contract

## Status: Invalidating — CLI/runtime evidence blocks immediate pilot implementation

## Question
Can the current local Codex CLI produce a usable patch-return artifact in a non-interactive read-only run, so the patch-return pilot can proceed without shared-checkout mutation?

## Local CLI Help Evidence

Command used:

```bash
source ~/.nvm/nvm.sh >/dev/null 2>&1
nvm exec 22 -- codex exec --help
```

Observed relevant options:
- `--sandbox read-only | workspace-write | danger-full-access`
- `--full-auto`
- `--dangerously-bypass-approvals-and-sandbox`
- `--output-last-message`

Observed absence:
- no exposed `-a never` flag in current help output

## Probe A — read-only temp git repo, unified diff request

Command used:

```bash
TMPDIR=/tmp/writer-lock-patch-return-spike1
rm -rf "$TMPDIR"
mkdir -p "$TMPDIR"
cd "$TMPDIR"
git init -q
printf "alpha\n" > sample.txt

cat > prompt.txt <<'EOF'
You are in a temporary git repository containing sample.txt with content alpha.
Return ONLY a unified diff patch that changes sample.txt so the content becomes beta.
Do not write files. Do not run commands that mutate the repository. Do not wrap the patch in markdown fences.
EOF

source ~/.nvm/nvm.sh >/dev/null 2>&1
nvm exec 22 -- codex exec \
  --sandbox read-only \
  -C "$TMPDIR" \
  -o "$TMPDIR/last-message.txt" \
  "$(cat prompt.txt)"
```

### Result
- Run did not complete promptly; probe was terminated manually after roughly one minute.
- `last-message.txt` was absent/empty.
- `codex-stdout.txt` contained only:

```text
Running node v22.16.0 (npm v10.9.2)
```

- `codex-stderr.txt` showed:
  - `approval: never`
  - `sandbox: read-only`
  - MCP startup attempts despite the task being a self-contained temp repo
  - `ts-language` MCP failure (`Connection refused`)
  - repeated state DB migration warnings: `migration 18 was previously applied but is missing in the resolved migrations`
  - no emitted unified diff payload before termination

### Interpretation
- The old active guidance is invalidated: current help does not expose `-a never`.
- A plain `codex exec --sandbox read-only ...` run is **not** presently a reliable fire-and-forget patch-return path in this environment.

## Probe B — `--ephemeral` + attempted MCP disable + unified diff request

Command used:

```bash
TMPDIR=/tmp/writer-lock-patch-return-spike2
rm -rf "$TMPDIR"
mkdir -p "$TMPDIR"
cd "$TMPDIR"
git init -q
printf "alpha\n" > sample.txt

cat > prompt.txt <<'EOF'
You are in a temporary git repository containing sample.txt with content alpha.
Return ONLY a unified diff patch that changes sample.txt so the content becomes beta.
Do not write files. Do not run commands that mutate the repository. Do not wrap the patch in markdown fences.
EOF

source ~/.nvm/nvm.sh >/dev/null 2>&1
nvm exec 22 -- codex exec \
  --ephemeral \
  -c 'mcp_servers={}' \
  --sandbox read-only \
  -C "$TMPDIR" \
  -o "$TMPDIR/last-message.txt" \
  "$(cat prompt.txt)"
```

### Result
- Run again failed to complete promptly; probe was terminated manually after roughly thirty seconds.
- `last-message.txt` was absent/empty.
- `codex-stdout.txt` again contained only the Node version banner.
- `codex-stderr.txt` still showed MCP startup activity:
  - `base-shop starting`
  - `ts-language starting`
  - `ts-language` connection failure
  - repeated state DB warnings
  - no emitted patch payload before termination

### Interpretation
- `--ephemeral` plus `-c 'mcp_servers={}'` did **not** isolate the run from the current MCP/state startup behavior in this environment.
- The patch-return pilot cannot assume that a self-contained packet run will currently emit a patch artifact under the local default Codex runtime.

## Patch Artifact Assessment

Tested artifact format:
- unified diff

Observed outcome:
- no diff artifact was emitted in either probe
- therefore `git apply --check` could not be executed against a returned patch

Why unified diff remains the recommended target artifact:
- it is easy to validate with `git apply --check`
- it fits the pre-apply fingerprint and narrow-window model already documented in `writer-lock-operational-hardening`
- it keeps the orchestrator-side apply step deterministic

## Recommended Invocation + Artifact Pair

### Recommended target pair for the pilot
- Invocation shape:

```bash
nvm exec 22 -- codex exec --sandbox read-only -C /tmp/task-packet-repo -o /tmp/task-packet-repo/last-message.txt "$(cat prompt.txt)"
```

- Artifact shape:

```text
unified diff
```

### Important qualifier
This is the **target** pair for the pilot, not a validated ready-to-ship contract. The current local runtime did not complete either read-only probe or emit a patch artifact, so TASK-02 must treat environment/runtime repair or isolation as a prerequisite decision.

## Pass/Fail Against TASK-01 Acceptance

| Acceptance item | Result |
|---|---|
| Records the current local `codex exec --help` contract relevant to non-interactive runs | Pass |
| Tests at least one patch-return artifact format suitable for later apply | Pass (unified diff tested) |
| Concludes with one recommended invocation + artifact pair for the pilot | Pass, with invalidating qualifier |

## Verdict

**Invalidating.**

The patch-return design remains the correct direction, but the current local Codex runtime is not yet a dependable executor for a self-contained read-only patch-return packet:
- active `-a never` guidance is stale
- read-only probes did not emit artifacts
- MCP/state startup behavior interfered even in a temp-repo spike

## Required Follow-on for TASK-02 Checkpoint

TASK-02 must decide between:
1. adding an environment-repair precursor before TASK-03/TASK-04, or
2. redefining the runner shape so the patch-return helper isolates Codex from the current MCP/state startup path

The checkpoint should **not** allow TASK-03/TASK-04 to proceed as originally written without addressing this finding.
