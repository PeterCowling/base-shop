# Build Offload Protocol (Shared)

Used by `lp-do-build/SKILL.md` (Executor Dispatch), `modules/build-code.md`, `modules/build-biz.md`, `modules/build-spike.md`, `modules/build-investigate.md`.

> **Reference pattern:** `_shared/critique-loop-protocol.md` (established). Key divergence: critique uses `codemoot review` which returns structured text parsed to JSON; build offload uses `codex exec` which writes files to disk via tool-calling. Do NOT substitute `codemoot run` for file-writing tasks — `codemoot run` is a text-generation pipeline only and does not write files.

## When to Use This Protocol

Before routing to any executor module, check whether codex is available under Node 22:

```
nvm exec 22 codex --version >/dev/null 2>&1 && CODEX_OK=1 || CODEX_OK=0
```

If `CODEX_OK=1`: use **offload route** (see Offload Invocation below).
If `CODEX_OK=0` (nvm unavailable, Node 22 not installed, or codex not installed): use **inline route** — fall through to the existing executor module workflow unchanged.

> **Note on CODEMOOT_OK vs CODEX_OK:** The critique loop uses `CODEMOOT_OK` (checks for `codemoot` availability). The build offload uses `CODEX_OK` (checks for `codex` directly). These are separate checks for separate features. When both are needed in the same skill, run each check independently — they are not interchangeable.

> **Why `nvm exec 22` for invocation:** codex uses `#!/usr/bin/env node`. Running the binary path directly may pick up the shell's default Node (which may be older than v22). Always invoke via `nvm exec 22 codex` to guarantee the correct runtime.

## Offload Invocation

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

**Flag reference (from `codex exec --help`):**
- `-a never` — never ask for approval; required for non-interactive automated execution
- `--sandbox workspace-write` — allows file writes within the repo working directory; required for IMPLEMENT, SPIKE, and INVESTIGATE tasks that produce file artifacts
- `-o /tmp/codex-build-output.txt` — writes the final agent message to a file for build evidence block

Record the exit code. Log it to the plan build evidence block.

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

When `CODEX_OK=0`, execute the task inline using the relevant executor module — the existing workflow unchanged:

```
CODEX_OK=0 → execute inline per modules/build-code.md (or build-biz.md, build-spike.md, build-investigate.md)
```

No new logic is required in the fallback path. The inline executor is the baseline; offload is additive.

## Writer Lock Contract

1. Claude acquires the writer lock **before** invoking `codex exec`:
   ```bash
   bash scripts/agents/with-writer-lock.sh -- codex exec ...
   ```
2. `with-writer-lock.sh` exports `BASESHOP_WRITER_LOCK_TOKEN` to child processes (confirmed from `scripts/agents/with-writer-lock.sh` line 136).
3. Codex runs as a child process and inherits the token — it does not acquire the lock itself.
4. Claude retains the lock through post-execution verification and commit.
5. Claude releases the lock after the commit gate completes.

**Do not release the lock before verifying Affects files and running the commit gate.** The lock prevents concurrent writes from other agents during Codex execution.

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
