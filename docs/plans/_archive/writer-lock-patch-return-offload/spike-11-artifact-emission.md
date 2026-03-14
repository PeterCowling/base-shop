---
artifact: spike-result
task: TASK-11
plan: docs/plans/writer-lock-patch-return-offload/plan.md
date: 2026-03-12
---

# SPIKE-11 Result: bounded artifact-emission path under isolated runner

## Status

Pass. The `-o` flag with a self-contained prompt produces a clean unified diff artifact promptly. Protocol and helper work may resume.

## Question

Can the TASK-10 artifact-emission contract (self-contained prompt + `-o` flag) produce a prompt unified diff artifact in a temp repo without mutating the shared checkout?

## Runner Contract Under Test

Identical to TASK-08/09 isolated home:

- copied `auth.json`
- minimal `config.toml`

```toml
model = "gpt-5.4"
model_reasoning_effort = "high"
personality = "pragmatic"
```

## Key Change From TASK-09

Prompt redesigned per TASK-10 root-cause analysis:

| Property | TASK-09 (failed) | TASK-11 (passed) |
|---|---|---|
| File content | Referenced by filename ("sample.txt with content alpha") | Supplied inline in prompt text |
| Tool-constraint language | Present ("do not write files, do not run commands") | Absent |
| Task framing | Agentic ("you are in a repo…") | Pure text transformation |

## Command Used

```bash
TMPROOT=/tmp/writer-lock-task10-verify
ISOHOME=$TMPROOT/codex-home-min
REPO=$TMPROOT/repo

rm -rf "$TMPROOT"
mkdir -p "$ISOHOME" "$REPO"
cp /Users/petercowling/.codex/auth.json "$ISOHOME/auth.json"
cat > "$ISOHOME/config.toml" <<'EOF'
model = "gpt-5.4"
model_reasoning_effort = "high"
personality = "pragmatic"
EOF

cd "$REPO"
git init -q
printf "alpha\n" > sample.txt

CODEX_HOME="$ISOHOME" nvm exec 22 -- codex exec \
  --sandbox read-only \
  -C "$REPO" \
  -o "$TMPROOT/last-message.txt" \
  "Produce a unified diff in standard format that would change the text \`alpha\` to \`beta\` in a file named sample.txt. Output only the unified diff, nothing else." \
  > "$TMPROOT/exec-stdout.txt" \
  2> "$TMPROOT/exec-stderr.txt"
```

## Observed Result

- exit code: 0
- `last-message.txt` contained:

```diff
--- sample.txt
+++ sample.txt
@@ -1 +1 @@
-alpha
+beta
```

- run completed promptly (no manual kill required)
- stderr reported `mcp startup: no servers` — no MCP or state contamination
- `sample.txt` in temp repo still contained `alpha` — no mutation
- shared checkout unchanged (confirmed via `git status --porcelain`)

## Pass/Fail Against TASK-11 Acceptance

| Acceptance item | Result |
|---|---|
| Uses the TASK-10 artifact-emission contract in a temp repo | Pass |
| Records exit code, runtime behavior, and emitted-artifact status | Pass |
| Confirms the shared checkout remained unchanged | Pass |

## Validation Contract (TC-11)

| Check | Result |
|---|---|
| TC-01: spike artifact exists with exact command, exit code, and emitted-artifact status | Pass |
| TC-02: spike artifact states whether the chosen output channel solved the empty final-message problem | Pass — `-o` now writes correctly |
| TC-03: spike artifact states whether protocol/helper work can resume | Pass — resume TASK-03 |

## Verdict

Pass.

The `-o` / `output-last-message` path is the correct artifact-extraction channel. The TASK-09 failure was entirely caused by prompt design triggering an agentic tool-call loop. Switching to a self-contained, pure-text-transformation prompt eliminates the hang and produces a clean unified diff artifact on first attempt.

## Pilot Artifact-Emission Contract (for TASK-03 onwards)

```bash
CODEX_HOME="$ISOHOME" nvm exec 22 -- codex exec \
  --sandbox read-only \
  -C "$PACKET_REPO" \
  -o "$PATCH_FILE" \
  "<self-contained prompt: inline content, no tool-constraint language, text-transformation framing>"
```

Prompt design rules (see `memory/reference_codex_isolated_runner.md`):
1. Supply file content inline — do not reference files by name as things to inspect.
2. No tool-constraint language ("do not write files" etc.).
3. Frame as pure text transformation answerable from model weights.

## Follow-on

TASK-03 and TASK-04 may now resume. Update their confidences to actualized values (conditional patterns resolved).
