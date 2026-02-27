---
artifact: replan-notes
task-trigger: TASK-02 CHECKPOINT (invalidating spike)
scope: TASK-03, TASK-04, TASK-05, TASK-06
date: 2026-02-27
Replan-round: 1
---

# Replan Notes — Offload Mechanism Redesign

## Trigger

TASK-02 CHECKPOINT classified TASK-01 spike as **Invalidating**.

**Finding:** `codemoot run` does NOT write files to disk. It is a text-generation pipeline. The `implement` step generates text output and stores it in the session database. Files are never written to the filesystem.

## Required Redesign

### Change offload mechanism from `codemoot run` to `codex exec`

**Old mechanism (invalidated):**
```bash
nvm exec 22 codemoot run "$(cat /tmp/task-prompt.txt)" --mode autonomous
```

**New mechanism (correct):**
```bash
nvm exec 22 codex exec "$(cat /tmp/task-prompt.txt)"
```

`codex exec` in its standard agentic mode uses tool-calling (bash, file read/write) to actually execute work and write files to the filesystem. This is the correct mechanism for build task offload.

### Why `codex exec` is correct

- `codex exec` invokes the codex agent with the repository as context
- The codex agent uses tool-calling to read files, run commands, and write output files
- This is confirmed by the fact-find: "codex exec is an alternative direct invocation" with `--sandbox workspace-write` allowing file writes
- The fact-find noted `codex exec` as the "lower-level alternative" but it is actually the CORRECT mechanism for file-writing tasks
- `codemoot run` wraps codex exec in a text-generation pipeline (plan→review→implement→code-review) but treats all output as TEXT ARTIFACTS, not filesystem operations

### Prompt transport update

`codex exec` accepts the task prompt the same way:
```bash
cat > /tmp/task-prompt.txt <<'EOF'
<task description>
EOF
nvm exec 22 codex exec "$(cat /tmp/task-prompt.txt)"
```

The `"$(cat /tmp/file)"` transport form confirmed working by TASK-01 spike. No change needed to transport form.

### Output contract update

- `codex exec` exit code: 0 = completed; non-zero = failed or interrupted
- Files written to disk: Claude re-reads Affects files to verify
- Final message capture: `--output-last-message <file>` flag available for build evidence
- No structured JSON output (same as before)

### Canonical `codex exec` invocation (verified from `codex exec --help`)

```bash
nvm exec 22 codex exec \
  -a never \
  --sandbox workspace-write \
  -o /tmp/codex-build-output.txt \
  "$(cat /tmp/task-prompt.txt)"
```

Flag verification (from `codex exec --help`):
- `-a never` — never ask for approval; non-interactive automated mode
- `--sandbox workspace-write` — allows file writes within the repo working directory
- `-o, --output-last-message <FILE>` — writes the final agent message to file for build evidence
- `"$(cat /tmp/file)"` — prompt transport (confirmed working from TASK-01 spike)

`--full-auto` is a convenience alias for `-a on-request --sandbox workspace-write` — NOT suitable for automated use since `on-request` can still pause. Use `-a never` explicitly.

### CODEMOOT_OK check

The CODEMOOT_OK check remains the same — it checks for `codemoot` availability because the critique loop still uses `codemoot review`. For the build offload, what we actually need is `codex` availability. However, since CODEMOOT_OK=1 implies codemoot is installed, and codemoot requires codex CLI, CODEMOOT_OK=1 also implies codex is available. The check can remain as-is for consistency.

Alternative: add a separate CODEX_OK check:
```bash
nvm exec 22 codex --version >/dev/null 2>&1 && CODEX_OK=1 || CODEX_OK=0
```

This is cleaner since the build offload uses codex directly. Recommend using CODEX_OK for the build offload protocol to avoid conflating critique availability with build offload availability.

### INVESTIGATE task invocation

Previously: `codemoot run` (DECISION self-resolve gate at plan time)
Updated: `codex exec` — same reasoning applies. INVESTIGATE tasks produce deliverable artifacts requiring write access. `codex exec` in agentic mode can write the artifact. The fact-find's note about `codex exec --sandbox read-only` not being able to write artifacts remains correct — use `codex exec` without `--sandbox read-only` (default workspace access allows writes).

### Secondary finding: `plan-review-implement.yml` missing

The workflow file is missing from the codemoot package install. For `codemoot review` (critique loop), this file is not needed — `review` command has its own code path. The missing file only affects `codemoot run`. Since we're switching to `codex exec`, this infrastructure issue is no longer a blocker. Document as a known limitation of `codemoot run` in the protocol.

## Task-by-Task Redesign Requirements

### TASK-03: Author `_shared/build-offload-protocol.md`

Update all references to:
- Replace `codemoot run` with `codex exec` as the offload invocation
- Replace CODEMOOT_OK check with CODEX_OK check for build offload (or keep CODEMOOT_OK with a note that it implies codex availability)
- Update "Offload Invocation" section to use `nvm exec 22 codex exec "$(cat /tmp/task-prompt.txt)"`
- Update "Output Contract" to reflect codex exec output model (exit code + disk state + optional `--output-last-message`)
- Add note: `codemoot run` is NOT suitable for file-writing tasks; use only for text-generation tasks (e.g., `results-review.user.md`)
- Keep all other sections (Task Prompt Schema, Fallback Policy, Writer Lock Contract, Excluded Types, Post-Execution Verification) — these are mechanism-independent

Confidence update: from 75% pre-CHECKPOINT → **85% post-CHECKPOINT** with redesigned mechanism. `codex exec` is the correct file-writing tool; mechanism is now confirmed. Remaining 15% gap: Codex quality for real tasks (empirical only) + first-use integration test.

### TASK-04: Update `lp-do-build/SKILL.md`

Update:
- CODEMOOT_OK check → CODEX_OK check, or add explicit note that CODEMOOT_OK=1 implies codex available
- Reference to `build-offload-protocol.md` remains correct (content updated in TASK-03)

Confidence: remains 80%.

### TASK-05: Update `modules/build-code.md` + `modules/build-biz.md`

Update:
- Offload Route sections reference `build-offload-protocol.md` which now specifies `codex exec`
- Track-specific notes (TDD, governed test invocation, Red→Green→Refactor) remain valid — these are prompt content additions for Codex regardless of invocation mechanism

Confidence: remains 80%.

### TASK-06: Update `modules/build-spike.md` + `modules/build-investigate.md`

Update:
- INVESTIGATE note: `codex exec` is correct (not `codex exec --sandbox read-only`); artifact write access required — same rationale, corrected mechanism
- Spike note: same mechanism change

Confidence: remains 80%.

## Revised Task Summary (post-replan)

| Task | Old Mechanism | New Mechanism | Confidence Change |
|---|---|---|---|
| TASK-03 | codemoot run | codex exec | 75%→85% (CHECKPOINT actualized; mechanism confirmed) |
| TASK-04 | codemoot run ref | codex exec ref | 80% (unchanged) |
| TASK-05 | codemoot run ref | codex exec ref | 80% (unchanged) |
| TASK-06 | codemoot run ref | codex exec ref | 80% (unchanged) |
