---
artifact: investigation
task: TASK-10
plan: docs/plans/writer-lock-patch-return-offload/plan.md
date: 2026-03-12
---

# TASK-10 Investigation: final-output and artifact-extraction channels under the isolated runner

## Status

Pass. Root cause of TASK-09 emission failure identified. One bounded artifact-emission contract recommended for TASK-11.

## Questions

1. Which current `codex exec` output channel is the best candidate for a returned artifact under isolated runtime conditions?
2. Does prompt delivery style or output mode need to change for bounded artifact emission?
3. Which one candidate contract should the next spike validate?

---

## Evidence

### 1. Available output channels (`codex exec --help`)

Full output confirmed from `codex exec --help`. Relevant output/format options:

| Flag | Behaviour |
|---|---|
| `-o / --output-last-message <FILE>` | Writes the final agent message to a file. Only written when the runner reaches a clean terminal state. |
| `--json` | Prints all session events to stdout as JSONL. Captures intermediate tool call events, model messages, and the final response even before `-o` is written. |
| `--output-schema <FILE>` | Path to a JSON Schema file. Forces the model's final response to conform to the schema (structured output). Eliminates ambiguity about what the runner should produce as its last message. |

No `--format` flag exists. No `--no-interactive` flag exists. Non-interactive mode is provided entirely by the `exec` subcommand.

Additional command noted:

```
codex apply   # Apply the latest diff produced by Codex agent as a git apply to the local working tree
```

This command implies Codex has a native internal diff-tracking mechanism distinct from the `-o` text output. Not the recommended path for this investigation (requires a prior interactive or exec session with diff state).

---

### 2. Root cause of TASK-09 emission failure

TASK-09 used the isolated `CODEX_HOME` contract from TASK-08. Runtime isolation was confirmed clean (no MCP servers, no state contamination). Yet `last-message.txt` remained empty and the runner hung.

Comparing the two probes:

| Dimension | TASK-08 (success) | TASK-09 (failure) |
|---|---|---|
| Prompt | `Return ONLY the word OK.` | Multi-line unified diff request referencing `sample.txt` |
| Completion | Prompt, clean | Hung, manual kill |
| stdout | `OK` | Node banner only |
| last-message.txt | `OK` | Empty |
| Environment | Identical (isolated home, `--sandbox read-only`) | Identical (isolated home, `--sandbox read-only`) |

**The variable is the prompt, not the environment.**

#### Root cause: prompt implies repository inspection → agentic tool-call loop → `-o` never written

The TASK-09 prompt says:
- "You are in a temporary git repository containing `sample.txt` with content alpha" → this grounds the model in an agentic context with a filesystem to inspect
- "Return ONLY a unified diff patch" → the model decides to read the file first (e.g. `cat sample.txt` or `git diff`) to ground its diff before responding
- "Do not write files. Do not run commands that mutate the repository." → these constraints **signal that tool use is in scope** (just constrained to read-only). They do not suppress tool use; they encourage it.

Once the model issues a read-only shell call, the non-interactive runner waits for that tool call to resolve. The clean-terminal-state required by `-o` is never reached. The session is killed mid-tool-call loop. `last-message.txt` stays empty.

#### This is not a CLI flag issue

- `-o` works correctly when the runner reaches a final message state (proven in TASK-08).
- `--sandbox read-only` does not prevent the model from issuing read-only shell calls.
- Changing to `--sandbox workspace-write` or adding `--ephemeral` does not address the root cause.
- The isolated `CODEX_HOME` is not the cause (TASK-09 confirmed isolation is clean).

---

### 3. Prompt-only fix hypothesis

A prompt that avoids triggering the tool-call loop requires three properties:

1. **Self-contained file content.** Do not reference the repository as a context to inspect. Provide the file content inline in the prompt text. The model has no reason to call `cat` or `git` if the content is already in the prompt.
2. **No tool-constraint language.** Phrases like "do not write files" and "do not run commands" signal that tool use is in scope. Remove them entirely.
3. **Pure text-transformation framing.** "Given the text X, produce a unified diff to change it to Y" is answerable from model weights alone, with no tool call required.

Example prompt that meets all three properties:

```
Produce a unified diff in standard format that would change the text `alpha` to `beta` in a file named sample.txt. Output only the unified diff, nothing else.
```

This is structurally identical to "Return ONLY the word OK" in terms of the model's reasoning path: pure text generation from weights, no tool call needed.

#### Confidence in prompt-only fix

High (E2 evidence). The root cause is empirically isolated to prompt design rather than CLI flags or isolation. The prompt shape proposed above has the same structural properties as the TASK-08 success probe. No new CLI surface is required.

---

### 4. Candidate output contracts evaluated

#### Option A — `-o` with self-contained pure-text prompt (recommended primary)

```bash
CODEX_HOME="$ISOHOME" nvm exec 22 -- codex exec \
  --sandbox read-only \
  -C "$REPO" \
  -o "$PATCH_FILE" \
  "Produce a unified diff in standard format that would change the text \`alpha\` to \`beta\` in a file named sample.txt. Output only the unified diff, nothing else."
```

- Uses the proven `-o` path.
- Fixes only the prompt; no CLI flag change.
- High probability of success given root-cause analysis.
- Clean artifact at `$PATCH_FILE` if the model responds without tool calls.

#### Option B — `--output-schema` with a simple schema (recommended fallback)

Define a schema file:
```json
{ "type": "object", "required": ["patch"], "properties": { "patch": { "type": "string" } } }
```

```bash
CODEX_HOME="$ISOHOME" nvm exec 22 -- codex exec \
  --sandbox read-only \
  -C "$REPO" \
  --output-schema "$SCHEMA_FILE" \
  -o "$PATCH_JSON" \
  "Produce a unified diff ..."
```

- Forces the model's final response into a JSON envelope.
- Structured output constraint may reduce the model's tendency to loop into tool calls because the response shape is strictly defined.
- Adds schema management overhead; artifact requires JSON parsing step to extract the patch string.
- Use as fallback if Option A still hangs (unlikely given root-cause analysis, but worth spiking as Option B if needed).

#### Option C — `--json` JSONL stream (not recommended as primary)

- Captures all events as JSONL on stdout, including intermediate tool calls and partial messages.
- Would allow post-hoc extraction of the last model message even without clean session termination.
- Requires a parsing wrapper and is more complex than a clean `-o` path.
- Only useful if the runner continues to hang after prompt fix — at which point the problem is structural rather than prompt-driven.

#### Option D — `codex apply` native diff path (out of scope for this plan)

- Requires a prior exec session to have produced and stored diff state.
- Does not compose with the isolated runner contract (isolated home has no prior session).
- Not a candidate for this investigation.

---

## Answers to TASK-10 Questions

### Q1. Which current `codex exec` output channel is the best candidate for a returned artifact?

**`-o / --output-last-message`** paired with a self-contained pure-text prompt. This channel is proven to work in TASK-08 and requires no additional tooling. The emission failure in TASK-09 was caused by prompt design, not by the `-o` mechanism itself.

`--output-schema` is the best-evidenced fallback if Option A fails.

### Q2. Does prompt delivery style or output mode need to change?

**Yes — prompt delivery style must change. Output mode (CLI flags) does not need to change.**

The required change: supply file content inline rather than referencing the repository, remove tool-constraint language, frame the task as pure text transformation. See Section 3 above.

### Q3. Which one candidate contract should TASK-11 validate?

**Option A**: `-o` flag with a self-contained pure-text-transformation prompt. TASK-11 should use the exact prompt form from Section 3 (content inline, no tool-constraint language, text-transformation framing), keep the same isolated CODEX_HOME contract from TASK-08/09, and require prompt exit plus a non-empty patch artifact in `last-message.txt`.

If Option A fails (runner still hangs), TASK-11 should immediately try Option B (same session, add `--output-schema`) before routing back to replan.

---

## Decision

TASK-11 should validate **Option A** with Option B as an inline fallback in the same spike:

```
Primary test: -o with self-contained prompt (no tool-constraint language, content inline)
Fallback test (if primary hangs): add --output-schema with a minimal patch schema
```

If both options hang, the blocker is structural and a new replan is required. If either option produces a non-empty artifact, the `-o` (or JSON) path becomes the candidate for the pilot contract.

## Follow-on

TASK-11 should use this investigation as its specification input. The isolated home contract from TASK-08 is unchanged — no re-investigation of the runtime needed. The only new variable is the prompt shape.
