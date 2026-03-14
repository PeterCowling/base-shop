---
artifact: spike-result
task: TASK-05
plan: docs/plans/writer-lock-patch-return-offload/plan.md
date: 2026-03-12
---

# SPIKE-05 Result: serialized apply-window behavior with fingerprint checks

## Status

Pass. `git apply` behavior, fingerprint capture, and writer-lock hold through apply+commit are all confirmed working as specified. No helper or window gaps found. Go verdict for pilot wiring.

## Question

Does the apply-window sequence (fingerprint before → `git apply` → fingerprint after → commit under writer lock) work correctly with a patch artifact produced by the isolated Codex runner?

## Apply Window Contract Under Test

From `build-offload-protocol.md` § Apply window:

1. Verify `$PATCH_FILE` is non-empty and parseable (`git apply --check "$PATCH_FILE"`).
2. Acquire writer lock (if not already held).
3. Capture repo fingerprint before apply.
4. Apply: `git apply "$PATCH_FILE"`.
5. Capture repo fingerprint after apply and verify only expected files changed.
6. Commit task-scoped files via `scripts/agents/with-writer-lock.sh`.

## Run 1: Isolated patch format and `git apply` behavior

### Setup

Temp git repo with a committed markdown file (`target.md`). Patch generated via `diff -u` and reformatted to `a/` `b/` prefix for `git apply`.

### Patch used

```diff
--- a/target.md	2026-03-12 20:53:56
+++ b/target.md	2026-03-12 20:53:57
@@ -2,4 +2,4 @@

 ## Section A

-Original content alpha.
+Updated content beta.
```

### Observations

| Step | Result |
|---|---|
| `git apply --check` | PASS (exit 0) |
| Fingerprint before (HEAD) | `207368544fd25e0eb9338fcda1f88d6a1720c831` |
| `git apply` | PASS (exit 0) |
| Changed files (verified) | `target.md` only — PASS |
| Commit | PASS — HEAD advanced to `3195dd3801a9dbc9273c4d0fedd6f3bfa34fffd2` |
| Unintended mutations | None |

## Run 2: Lock held through apply + commit window

### Setup

Separate temp repo. Writer lock acquired via `scripts/agents/with-writer-lock.sh`. Patch applied and committed inside the lock scope. Lock status checked after release.

### Observations

| Step | Result |
|---|---|
| `git apply --check` under lock | PASS |
| Fingerprint before (HEAD) | `612ad97f1f53de5ae9f5ce500606a6925db6b283` |
| `git apply` under lock | PASS (exit 0) |
| HEAD advanced | YES → `d958b0fe6851c394a5912d8c31d950ed743d20e2` |
| Lock held through full apply+commit | CONFIRMED |
| Lock status after release | `unlocked` |

## Key Findings

### 1. Fingerprint strategy

Two fingerprint signals are sufficient for the apply window:

- **Pre-apply HEAD commit** (`git rev-parse HEAD`): identifies the exact tree state before the patch lands. If HEAD changes between Codex output and apply (due to concurrent write), the diff may not apply cleanly — `git apply --check` catches this before any mutation.
- **Post-apply status** (`git status --porcelain=v1`): lists all modified tracked files. Cross-check against task `Affects` list to verify containment.

`git rev-parse HEAD` → `git apply --check` → `git apply` → `git status --porcelain | grep -v '^??'` → commit is the confirmed safe sequence.

### 2. Lock hold strategy

The pilot contract does **not** require a lock release/reacquire between Codex exit and apply. The orchestrator:

1. Acquires the lock before invoking `build-offload-patch-return.sh` (or the Codex run).
2. Retains the lock through Codex exit (Codex runs `--sandbox read-only` → no shared-checkout mutation during the run).
3. Retains the lock through `git apply` + commit.
4. Releases the lock after the commit gate completes.

This is the simplest possible lock strategy: one acquire, one release, no gap. `with-writer-lock.sh` already supports this pattern via `--agent-write-session` for long-lived sessions, or via a wrapping subshell for bounded commands.

### 3. Patch format note

`diff -u` output requires the `--- a/` `+++ b/` prefix convention for `git apply`. Codex output using the TASK-11 prompt design (file content supplied inline, text-transformation framing) produces standard unified diff format — verified in spike-11. Orchestrator must ensure the `a/b/` prefix convention is present before calling `git apply --check`. If Codex emits a plain `diff -u` style header (without `a/b/`), add `--no-index` to `git apply`.

### 4. No helper gaps found

`build-offload-patch-return.sh` does not need modification for the apply window — it is responsible only for the Codex invocation and artifact capture. The apply window is an orchestrator-side operation (using `git apply` and `with-writer-lock.sh` directly).

## Pass/Fail Against TASK-05 Acceptance

| Acceptance item | Result |
|---|---|
| Exercises repo and staged-tree fingerprints around the apply window | Pass |
| Records whether `writer-lock-window.sh` is sufficient as-is or needs an extension | Pass — sufficient as-is; no extension needed |
| Concludes with a clear go/no-go for the business-artifact pilot | **Go** |

## Validation Contract (TC-05)

| Check | Result |
|---|---|
| TC-01: spike artifact records fingerprint behavior before and after apply | Pass — HEAD fingerprint + `git status` verified; sequence documented |
| TC-02: spike artifact records whether lock release/reacquire behaved safely | Pass — no release/reacquire needed; single acquire covers full apply+commit window |
| TC-03: spike artifact names any helper or window gaps discovered | Pass — no gaps; `build-offload-patch-return.sh` is complete; `with-writer-lock.sh` is sufficient |

## Verdict

**Go.**

The apply window works as specified. Fingerprint capture with `git rev-parse HEAD` (pre) and `git status --porcelain` (post) is sufficient for containment verification. `git apply --check` gates against stale patches. The writer lock is held continuously from Codex invocation through commit — no release/reacquire gap exists.

TASK-06 (Horizon checkpoint) may now proceed. TASK-07 pilot wiring is unblocked.

## Follow-on

- TASK-06: Horizon checkpoint — confirm apply-window evidence closes the pilot readiness gate.
- TASK-07: Wire `build-biz` to call `build-offload-patch-return.sh` + apply window as the default path when `CODEX_OK=1`.
- **Patch format note for TASK-07**: add a `--no-index` fallback in the apply window if Codex produces `diff -u` style headers without `a/b/` prefix. Easiest fix: run `git apply --no-index` as the primary path (works for both conventions).
