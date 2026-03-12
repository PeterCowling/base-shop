---
artifact: investigation
task: TASK-08
plan: docs/plans/writer-lock-patch-return-offload/plan.md
date: 2026-03-09
---

# TASK-08 Investigation: isolated Codex runner contract

## Status

Pass. A dedicated temporary `CODEX_HOME` is the correct isolation seam for the next patch-return spike.

## Questions

1. How should patch-return offload avoid the default MCP server set and shared Codex state DB?
2. What exact invocation contract is supported by the current local Codex binary for non-interactive read-only runs?
3. What minimal Codex-home contents are required for the next spike to run without inheriting the noisy default runtime?

## Evidence

### 1. The default Codex home is the source of the original startup contamination

Current user config at `/Users/petercowling/.codex/config.toml` contains:

- `[mcp_servers.ts-language]`
- `[mcp_servers.base-shop]`

Direct CLI evidence:

```bash
source ~/.nvm/nvm.sh >/dev/null 2>&1
nvm exec 22 -- codex mcp list
```

Observed result:

- `base-shop` enabled
- `ts-language` enabled

Read-only inventory of `/Users/petercowling/.codex` also shows shared state surfaces:

- `auth.json`
- `config.toml`
- `state_5.sqlite`
- `state_5.sqlite-wal`
- `archived_sessions/`
- `shell_snapshots/`

This matches the invalidating TASK-01 spike, which showed MCP startup and state DB warnings in an otherwise self-contained temp-repo probe.

### 2. The installed binary explicitly supports `CODEX_HOME`

Binary inspection:

```bash
strings /Users/petercowling/.vscode/extensions/openai.chatgpt-0.4.79-darwin-arm64/bin/macos-aarch64/codex \
  | rg "CODEX_HOME|config.toml|mcp_servers|ephemeral"
```

Observed relevant strings include:

- `CODEX_HOME`
- `failed to resolve CODEX_HOME`
- `Override a configuration value that would otherwise be loaded from ~/.codex/config.toml`
- `mcp_servers`

Conclusion:

- the current local binary has a first-class notion of an alternate Codex home
- this is a better isolation seam than trying to override the live shared home in place

### 3. A temporary isolated `CODEX_HOME` suppresses MCP startup cleanly

Probe setup:

```bash
TMPROOT=/tmp/writer-lock-task08
ISOHOME=$TMPROOT/codex-home-min
rm -rf "$TMPROOT"
mkdir -p "$ISOHOME"
cp /Users/petercowling/.codex/auth.json "$ISOHOME/auth.json"
cat > "$ISOHOME/config.toml" <<'EOF'
model = "gpt-5.4"
model_reasoning_effort = "high"
personality = "pragmatic"
EOF

source ~/.nvm/nvm.sh >/dev/null 2>&1
CODEX_HOME="$ISOHOME" nvm exec 22 -- codex mcp list
```

Observed result:

- `No MCP servers configured yet`

This proves the alternate home does not inherit the user MCP configuration.

### 4. The isolated home also fixes the non-interactive exec startup path

Probe setup:

```bash
TMPROOT=/tmp/writer-lock-task08
REPO=$TMPROOT/repo
mkdir -p "$REPO"
cd "$REPO"
git init -q
printf "alpha\n" > sample.txt

source ~/.nvm/nvm.sh >/dev/null 2>&1
CODEX_HOME="$TMPROOT/codex-home-min" nvm exec 22 -- codex exec \
  --sandbox read-only \
  -C "$REPO" \
  -o "$TMPROOT/last-message.txt" \
  "Return ONLY the word OK." \
  > "$TMPROOT/exec-stdout.txt" \
  2> "$TMPROOT/exec-stderr.txt"
```

Observed result:

- command completed promptly
- stdout contained `OK`
- `last-message.txt` contained `OK`
- stderr reported `mcp startup: no servers`
- stderr did not show `base-shop starting`
- stderr did not show `ts-language starting`
- stderr did not show the previous state DB migration warnings

The only notable stderr warning was a benign shell-snapshot cleanup warning under the temp home.

### 5. `auth.json` is required

Probe setup:

- temp `CODEX_HOME` with the same minimal `config.toml`
- no `auth.json`

Observed result:

- `codex exec` exited with repeated `401 Unauthorized`
- stderr ended with `Missing bearer or basic authentication in header`

Conclusion:

- the next spike must seed authentication into the isolated home

### 6. `auth.json` alone is not the reliable contract we should standardize on

Probe setup:

- temp `CODEX_HOME` containing only copied `auth.json`
- no `config.toml`

Observed result:

- `codex mcp list` still showed no configured servers
- `codex exec` started with `mcp startup: no servers`
- the run did not complete promptly and was terminated manually after about one minute
- unlike the `auth.json + config.toml` probe, it did not emit the final `OK`

Interpretation:

- `auth.json` appears sufficient to avoid inheriting user MCP servers
- but `auth.json` alone did not produce a reliable, prompt non-interactive runner in this investigation
- for the pilot, a minimal `config.toml` should be treated as part of the reliable contract rather than optional nice-to-have

## Supported Non-Interactive CLI Contract

Current help evidence:

```bash
source ~/.nvm/nvm.sh >/dev/null 2>&1
nvm exec 22 -- codex exec --help
```

Supported relevant options:

- `--sandbox read-only`
- `-C, --cd`
- `-o, --output-last-message`
- `--ephemeral`
- `-c, --config`

Important constraint:

- `codex exec` does not accept `-a/--ask-for-approval` even though root `codex --help` still documents it

Recommended interpretation for the pilot:

- do not use `codex exec -a never`
- rely on the observed exec behavior, which already reports `approval: never` in non-interactive runs
- keep the runner contract minimal and avoid `--ephemeral` until the isolated-home spike proves the unified-diff path end-to-end

## Recommended Runner Contract For TASK-09

### Primary strategy

Use a temporary dedicated `CODEX_HOME` per offload spike/run.

### Required seeded contents

- `auth.json`
- `config.toml`

### Required excluded pre-seeded contents

- no `[mcp_servers.*]` entries
- no copied `state_5.sqlite*`
- no copied `archived_sessions/`
- no copied `shell_snapshots/`
- no copied `skills/`

These state files may be created inside the temp home during execution, but they should not be inherited from the shared user home.

### Recommended minimal `config.toml`

```toml
model = "gpt-5.4"
model_reasoning_effort = "high"
personality = "pragmatic"
```

> **Model note**: `gpt-5.4` is the verified working model for ChatGPT-account-backed Codex runs on this machine. Other model names (e.g. `gpt-4.1`) produce `"model is not supported when using Codex with a ChatGPT account"` and exit non-zero. Always copy the model value from this contract rather than guessing a model name.

### Recommended invocation candidate

```bash
CODEX_HOME="$ISOHOME" nvm exec 22 -- codex exec \
  --sandbox read-only \
  -C "$PACKET_REPO" \
  -o "$LAST_MESSAGE_FILE" \
  "$(cat "$PROMPT_FILE")"
```

## Answers To TASK-08 Questions

### Q1. How should patch-return offload avoid the default MCP server set and shared Codex state DB?

By running Codex with a temporary dedicated `CODEX_HOME` that contains only the seeded files required for the packet run, rather than trying to neutralize the shared `~/.codex` in place.

### Q2. What exact invocation contract is supported by the current local Codex binary for non-interactive read-only runs?

The supported contract is `codex exec --sandbox read-only -C <dir> -o <file> <prompt>` with optional `-c` config overrides. The active `codex exec -a never` guidance is not supported by the current local binary.

### Q3. What minimal Codex-home contents are required for the next spike to run without inheriting the noisy default runtime?

For the next spike, the reliable minimal home is:

- copied `auth.json`
- minimal `config.toml`

No MCP definitions or prior state artifacts should be copied into that temp home.

## Decision

`TASK-09` should use the isolated-home strategy above and should not use the shared `~/.codex` runtime directly.

## Follow-on

`TASK-09` must now test the same isolated runner shape with the actual patch-return prompt and require a prompt unified-diff artifact before protocol/helper work resumes.
