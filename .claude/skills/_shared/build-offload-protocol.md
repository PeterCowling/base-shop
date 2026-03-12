# Build Offload Protocol (Shared)

Used by `lp-do-build/SKILL.md` (Executor Dispatch), `modules/build-code.md`, `modules/build-biz.md`, `modules/build-spike.md`, `modules/build-investigate.md`.

## Current Status

**Patch-return pilot: active for `build-biz` tasks.**

- Shared-checkout mutable Codex offload (`workspace-write`) remains disabled as a default workflow.
- The patch-return pilot contract (see `## Patch-Return Pilot Contract` below) is validated and active for business-artifact tasks routed through `modules/build-biz.md`.
- All other executor modules (`build-code.md`, `build-spike.md`, `build-investigate.md`) continue to execute inline. Extend pilot coverage only after per-track validation.
- Evidence base: `docs/plans/writer-lock-patch-return-offload/spike-11-artifact-emission.md` (2026-03-12).

> **Reference pattern:** `_shared/critique-loop-protocol.md` (established). Key divergence: critique uses `codemoot review` which returns structured text parsed to JSON; build offload uses `codex exec` which writes files to disk via tool-calling. Do NOT substitute `codemoot run` for file-writing tasks — `codemoot run` is a text-generation pipeline only and does not write files.

## When to Use This Protocol

Before routing to any executor module, check whether codex is available under Node 22:

```bash
nvm exec 22 codex --version >/dev/null 2>&1 && CODEX_OK=1 || CODEX_OK=0
```

If `CODEX_OK=0`: use **inline route** — fall through to the existing executor module workflow unchanged.

If `CODEX_OK=1` and executor is `build-biz`: use the **patch-return pilot** described in `## Patch-Return Pilot Contract` below.

If `CODEX_OK=1` and executor is anything else (`build-code`, `build-spike`, `build-investigate`): keep using the inline route. CLI availability alone does not authorize offload for unvalidated tracks.

> **Note on CODEMOOT_OK vs CODEX_OK:** The critique loop uses `CODEMOOT_OK` (checks for `codemoot` availability). The build offload uses `CODEX_OK` (checks for `codex` directly). These are separate checks for separate features. When both are needed in the same skill, run each check independently — they are not interchangeable.

> **Why `nvm exec 22` for invocation:** codex uses `#!/usr/bin/env node`. Running the binary path directly may pick up the shell's default Node (which may be older than v22). Always invoke via `nvm exec 22 codex` to guarantee the correct runtime.

## Patch-Return Pilot Contract

Active for `build-biz` tasks when `CODEX_OK=1`. Evidence base: `docs/plans/writer-lock-patch-return-offload/spike-11-artifact-emission.md`.

### 1. Runner setup (isolated CODEX_HOME)

Create a temporary isolated Codex home per offload run. Never reuse the shared `~/.codex` runtime.

```bash
TMPROOT=/tmp/codex-patch-return-$(date +%s)
ISOHOME=$TMPROOT/codex-home
PACKET_REPO=$TMPROOT/packet-repo
mkdir -p "$ISOHOME" "$PACKET_REPO"

# Required: auth + minimal config. Do NOT copy state_5.sqlite*, archived_sessions/, shell_snapshots/, or mcp_servers entries.
cp ~/.codex/auth.json "$ISOHOME/auth.json"
cat > "$ISOHOME/config.toml" <<'EOF'
model = "gpt-5.4"
model_reasoning_effort = "high"
personality = "pragmatic"
EOF
```

> **Model note**: `gpt-5.4` is the only verified working model for ChatGPT-account-backed Codex runs. Other model names (e.g. `gpt-4.1`) produce a "not supported" error. Always use this value — do not guess. See `memory/reference_codex_isolated_runner.md`.

### 2. Task packet (prompt construction)

The prompt must be self-contained. Three required properties (failure to follow any one will cause the runner to hang in an agentic tool-call loop and emit nothing):

1. **Supply file content inline** — paste the actual content into the prompt. Do not reference files by name as things to read or inspect. The model will call `cat` or `git` if it thinks it needs to check a file.
2. **No tool-constraint language** — do not write "do not write files" or "do not run commands". These phrases signal tool use is in scope. Omit them entirely.
3. **Pure text-transformation framing** — state the input, state the output format, ask for the output. The task must be answerable from model weights alone.

Example structure:
```
The content of <filename> is:

<paste file content verbatim>

Produce a unified diff in standard format that would change the above content to:

<paste target content verbatim>

Output only the unified diff, nothing else.
```

Write the prompt to a temp file:
```bash
cat > "$TMPROOT/prompt.txt" <<'EOF'
<assembled self-contained prompt>
EOF
```

### 3. Patch artifact (invocation + capture)

```bash
PATCH_FILE="$TMPROOT/patch.diff"

CODEX_HOME="$ISOHOME" nvm exec 22 -- codex exec \
  --sandbox read-only \
  -C "$PACKET_REPO" \
  -o "$PATCH_FILE" \
  "$(cat "$TMPROOT/prompt.txt")" \
  > "$TMPROOT/exec-stdout.txt" \
  2> "$TMPROOT/exec-stderr.txt"

PILOT_EXIT=$?
```

The `-o` (`--output-last-message`) flag writes the model's final response to `$PATCH_FILE`. This is the patch artifact.

Expected artifact format: standard unified diff (suitable for `git apply`).

### 4. Apply window

> **Status: pending TASK-05 spike validation.** The apply window contract is described here for reference. Do not rely on it for production use until TASK-05 confirms fingerprint and lock-window behavior.

Intended apply sequence (to be validated by TASK-05):
1. Verify `$PATCH_FILE` is non-empty and parseable (`git apply --check "$PATCH_FILE"`).
2. Acquire writer lock (if not already held).
3. Capture repo fingerprint before apply.
4. Apply: `git apply "$PATCH_FILE"`.
5. Capture repo fingerprint after apply and verify only expected files changed.
6. Commit task-scoped files via `scripts/agents/with-writer-lock.sh`.

### 5. Fallback policy

On any pilot failure (non-zero exit, empty `$PATCH_FILE`, `git apply --check` failure): fall back to inline execution via `modules/build-biz.md`. Record the failure reason and pilot exit code in the plan build evidence block. Do not retry the pilot more than once per task cycle.

---

## Legacy Offload Invocation (disabled — migration context only)

The sections below document the old shared-checkout mutable offload pattern. **Do not use these as the active default.** They are retained for migration reference only.

### Why the legacy path is disabled

- current `codex exec` help does not expose `-a never`
- shared-checkout mutable route (`workspace-write`) holds the writer lock for the full Codex session
- patch-return pilot replaces this route for build-biz tasks

### Legacy fail-closed rule

Do not run the legacy shared-checkout command below as a normal default:

```bash
nvm exec 22 codex exec -a never --sandbox workspace-write ...
```

Why this path is disabled:
- current local `codex exec` help no longer exposes `-a never`
- the shared-checkout mutable route holds the writer lock for the full Codex session
- the patch-return replacement is still under active investigation and has not been validated yet

Exact next step:
- execute the task inline via the relevant `lp-do-build` executor module
- or continue the patch-return implementation plan in `docs/plans/writer-lock-patch-return-offload/plan.md`

The remaining sections in this document describe the legacy shared-checkout protocol for migration context only. Do not treat them as the active default workflow.

### Prepare the task prompt

Write the task prompt to a temp file using a heredoc (safe for multi-line content with quotes and special characters — confirmed by TASK-01 spike in `lp-do-build-codex-offload` plan):

```bash
cat > /tmp/task-prompt.txt <<'EOF'
<task prompt content>
EOF
```

### Run codex exec

```bash
nvm exec 22 codex exec \
  -a never \
  --sandbox workspace-write \
  -o /tmp/codex-build-output.txt \
  "$(cat /tmp/task-prompt.txt)"
```

**Legacy flag reference (preserved for migration context):**
- `--sandbox workspace-write` — allows file writes within the repo working directory; required for IMPLEMENT, SPIKE, and INVESTIGATE tasks that produce file artifacts
- `-o /tmp/codex-build-output.txt` — writes the final agent message to a file for build evidence block

Record the exit code. Log it to the plan build evidence block.

> **Current lock-scope note:** `--sandbox workspace-write` makes this an explicit shared-checkout write session. Codex may write at any time during `codex exec`, so the orchestrator must hold the writer lock for the full mutable execution window. Use this route for bounded build execution only, not for discovery/planning or other mostly read-only agent sessions.

> **Do NOT use `--full-auto`** for automated build offload — it uses `-a on-request` which can pause waiting for input.

> **Do NOT use `codemoot run`** for file-writing tasks. `codemoot run` is a text-generation pipeline; all step outputs are stored in the session database as text artifacts only. Files are never written to disk.

## Task Prompt Schema

The prompt must be self-contained because codex starts a fresh session without the orchestrator's context. Include all of the following fields:

| Field | Content |
|---|---|
| Plan path | `docs/plans/<slug>/plan.md` — path to the plan file |
| Task ID | e.g., `TASK-03` |
| Task type | `IMPLEMENT`, `SPIKE`, or `INVESTIGATE` |
| Task description | Copy verbatim from the plan task description |
| Affects | Full list of files Codex may write: `path/to/file (create\|modify)`. Files marked `[readonly]` must not be modified. |
| Acceptance criteria | Copy verbatim from the plan task acceptance criteria |
| Execution-Track | `code`, `business-artifact`, or `mixed` |
| Deliverable-Type | e.g., `skill-update`, `code-change` |
| CODEX.md reference | "Follow safety rules in CODEX.md" |
| Testing-policy reference | "For any test invocations follow docs/testing-policy.md (governed Jest contract: `pnpm -w run test:governed -- jest -- <args>`)" |
| Writer lock note | "This task is run under a writer lock held by the orchestrator. Write only to the files listed in Affects above. Do not acquire the lock yourself." |

**Example prompt structure:**

```
You are executing a build task for the base-shop monorepo.

## Task Context
- Plan: docs/plans/<slug>/plan.md
- Task ID: TASK-NN
- Task type: IMPLEMENT
- Description: <task description verbatim>
- Execution-Track: business-artifact
- Deliverable-Type: skill-update

## Files You May Write (Affects)
- .claude/skills/_shared/example.md (create)

## Acceptance Criteria
- [ ] ...

## References
- Repo conventions and safety rules: CODEX.md
- Test invocations: docs/testing-policy.md

## Writer Lock
This task is run under a writer lock held by the orchestrator. Write only to the files
listed in Affects above. Do not acquire the lock yourself.
```

## Output Contract

| Signal | Meaning |
|---|---|
| Exit code `0` | Codex reported task completed |
| Exit code non-zero | Codex failed, timed out, or was interrupted |
| Files on disk | Claude checks Affects files exist (existence only — no content read) |
| `/tmp/codex-build-output.txt` | Final agent message; read last line only for build evidence block |

There is no structured JSON output (unlike `codemoot review`). The contract is: **exit code + file existence**. CI validates correctness.

**Non-zero exit handling:** Treat as invocation failure for this task cycle. Fall back to inline execution using the relevant executor module. Record the exit code and fallback reason in the plan build evidence block.

## Fallback Policy

Current active behavior is inline execution. When offload is disabled, execute the task inline using the relevant executor module:

```
execute inline per modules/build-code.md (or build-biz.md, build-spike.md, build-investigate.md)
```

No new logic is required in the fallback path. The inline executor is the baseline. Offload remains reactivation-only until the patch-return pilot is validated.

## Writer Lock Contract

1. Claude acquires the writer lock **before** invoking `codex exec`:
   ```bash
   bash scripts/agents/with-writer-lock.sh --agent-write-session -- nvm exec 22 codex exec ...
   ```
2. `with-writer-lock.sh` exports `BASESHOP_WRITER_LOCK_TOKEN` to child processes (confirmed from `scripts/agents/with-writer-lock.sh` line 136).
3. Codex runs as a child process and inherits the token — it does not acquire the lock itself.
4. Because `--sandbox workspace-write` can mutate the shared checkout at any time, Claude retains the lock through the full `codex exec` run and the serialized post-execution write/commit phase.
5. Claude releases the lock after the commit gate completes.

**Do not release the lock before Codex exits and the serialized post-execution write/commit phase completes.** In the current shared-checkout protocol, other writers must not enter while Codex-owned edits remain uncommitted in the working tree.

## Excluded Task Types

| Task Type | Reason for Exclusion |
|---|---|
| CHECKPOINT | CHECKPOINT triggers `/lp-do-replan` — a separate skill invocation requiring orchestrator-side logic. No implementation work happens in CHECKPOINT; Codex has nothing to execute. |
| DECISION | DECISION tasks require structured operator interaction and escalation. The output is a decision choice, not a file artifact. Codex cannot substitute for operator input. |

## Post-Execution Verification (Claude's responsibility)

After `codex exec` returns:

1. **Exit code check** — non-zero exit: treat as invocation failure, fall back to inline execution, record reason in plan build evidence block. Do not proceed.
2. **Existence check** — run `ls <affects-files>` to confirm each file in the Affects list exists. If a required file is missing: treat as task failure, fall back to inline. No content read required.
3. **Commit gate** — stage only task-scoped files (the Affects list). Run the writer lock commit via `scripts/agents/with-writer-lock.sh`. CI validates correctness.
4. **Post-task plan update** — mark task status Complete with date; add build evidence block (exit code, Affects files present, offload route used); update task summary and re-score dependent tasks.
