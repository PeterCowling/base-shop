# Codex Isolated Runner Contract

Canonical source: `docs/plans/writer-lock-patch-return-offload/runtime-isolation-investigation.md`

## Verified model

`gpt-5.4` — the only confirmed working model for ChatGPT-account-backed Codex runs on this machine.

**Do not guess model names.** `gpt-4.1` and similar produce: `"model is not supported when using Codex with a ChatGPT account"` and exit non-zero.

## Minimal `config.toml`

```toml
model = "gpt-5.4"
model_reasoning_effort = "high"
personality = "pragmatic"
```

## Isolated home seeding

Required: `auth.json` (copied from `~/.codex/auth.json`) + `config.toml` above.
Excluded: no `[mcp_servers.*]`, no `state_5.sqlite*`, no `archived_sessions/`, no `shell_snapshots/`.

## Invocation

```bash
CODEX_HOME="$ISOHOME" nvm exec 22 -- codex exec \
  --sandbox read-only \
  -C "$REPO" \
  -o "$OUTPUT_FILE" \
  "<prompt>"
```

## Prompt design rules (verified 2026-03-12)

The `-o` flag only writes when the session reaches a clean terminal state. To avoid the model entering an agentic tool-call loop:

1. **Supply file content inline** — do not reference the repo or filename as something to inspect. The model will call `cat`/`git` if it thinks it needs to read a file.
2. **No tool-constraint language** — phrases like "do not write files" or "do not run commands" signal tool use is in scope. Remove them.
3. **Frame as pure text transformation** — "Given the text X, produce Y" is answerable from weights alone.

Bad (hangs): `"You are in a repo containing sample.txt with content alpha. Return ONLY a unified diff..."`
Good (works): `"Produce a unified diff in standard format that would change the text \`alpha\` to \`beta\` in a file named sample.txt. Output only the unified diff, nothing else."`
