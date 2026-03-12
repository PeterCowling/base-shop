---
artifact: spike-result
task: TASK-09
plan: docs/plans/writer-lock-patch-return-offload/plan.md
date: 2026-03-09
---

# SPIKE-09 Result: isolated runner with unified-diff prompt

## Status

Invalidating. Runtime isolation succeeded, but the isolated non-interactive runner still failed to emit a unified diff artifact promptly.

## Question

Can the `TASK-08` isolated runner contract produce a prompt unified diff artifact in a temp repo without mutating the shared checkout?

## Runner Contract Under Test

Temporary isolated home:

- copied `auth.json`
- minimal `config.toml`

Config used:

```toml
model = "gpt-5.4"
model_reasoning_effort = "high"
personality = "pragmatic"
```

Prompt used:

```text
You are in a temporary git repository containing sample.txt with content alpha.
Return ONLY a unified diff patch that changes sample.txt so the content becomes beta.
Do not write files. Do not run commands that mutate the repository. Do not wrap the patch in markdown fences.
```

## Command Used

```bash
TMPROOT=/tmp/writer-lock-task09
ISOHOME=$TMPROOT/codex-home-min
REPO=$TMPROOT/repo
PROMPT=$TMPROOT/prompt.txt

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

cat > "$PROMPT" <<'EOF'
You are in a temporary git repository containing sample.txt with content alpha.
Return ONLY a unified diff patch that changes sample.txt so the content becomes beta.
Do not write files. Do not run commands that mutate the repository. Do not wrap the patch in markdown fences.
EOF

source ~/.nvm/nvm.sh >/dev/null 2>&1
CODEX_HOME="$ISOHOME" nvm exec 22 -- codex exec \
  --sandbox read-only \
  -C "$REPO" \
  -o "$TMPROOT/last-message.txt" \
  "$(cat "$PROMPT")" \
  > "$TMPROOT/exec-stdout.txt" \
  2> "$TMPROOT/exec-stderr.txt"
```

## Observed Result

- isolated runner startup was clean:
  - stderr reported `mcp startup: no servers`
  - stderr did not show `base-shop starting`
  - stderr did not show `ts-language starting`
  - stderr did not show the prior state DB migration warnings
- stdout contained only the Node banner
- `last-message.txt` remained empty
- no unified diff artifact was emitted
- the run did not complete promptly and was terminated manually after roughly thirty seconds

The only stderr output beyond the startup banner was the shell-snapshot cleanup warning already seen in `TASK-08`.

## Shared Checkout Safety Check

Before and after the spike:

```bash
git -C /Users/petercowling/base-shop status --porcelain=v1 --untracked-files=all
```

Observed result:

- before/after snapshots matched exactly
- shared checkout remained unchanged

## Temp Repo Safety Check

Observed result inside `/tmp/writer-lock-task09/repo` after termination:

- `sample.txt` still contained `alpha`
- no patch was applied
- repo status still showed only the original untracked file

## Pass/Fail Against TASK-09 Acceptance

| Acceptance item | Result |
|---|---|
| Uses the TASK-08 runner contract in a temp git repo | Pass |
| Records exit code, runtime behavior, and whether a unified diff artifact was emitted | Pass, with invalidating result |
| Confirms the shared checkout remained unchanged | Pass |

## Verdict

Invalidating.

`TASK-08` solved the startup contamination problem, but it did not solve final artifact emission:

- the isolated home is clean
- the shared checkout remains untouched
- the runner still does not reliably emit a prompt unified diff artifact through the current `output-last-message` path

## Required Follow-on

Do not proceed directly to protocol/helper implementation.

The next slice must investigate the final-output and artifact-extraction contract under the isolated runner, then spike one bounded artifact-emission path before `TASK-03` and `TASK-04` resume.
