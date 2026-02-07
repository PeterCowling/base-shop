---
Type: Plan
Status: Historical
Domain: Infra
Created: 2026-02-07
Last-updated: 2026-02-07
Archived-on: 2026-02-07
Feature-Slug: writer-lock-stale-locks
Overall-confidence: 100%
Confidence-Method: Post-implementation validation (tests + manual lock-flow checks)
---

# Writer Lock Stale Locks — Hardening Plan

## Summary

Harden the writer lock system so stale locks from dead subagent processes are recovered automatically, bypass mechanisms are removed from user-facing guidance, and the agent-bin/git guard closes a gap where `SKIP_WRITER_LOCK=1` as an env var prefix is not caught. The error message fix in `require-writer-lock.sh` is already done (see fact-find). This plan covers the remaining items.

Outcome: completed and archived on 2026-02-07.

## Goals

- Add a first-class `clean-stale` command to `writer-lock.sh`
- Remove `SKIP_WRITER_LOCK=1` from all user-facing documentation and error messages that suggest it as a recovery path
- Close the agent-bin/git guard gap (env var prefix detection)
- Ensure reasoning-first lock guidance is captured in canonical repo runbooks

## Non-goals

- Removing the `SKIP_WRITER_LOCK=1` code path from `require-writer-lock.sh` entirely (deferred until `clean-stale` is proven)
- Investigating Task tool termination signals (external dependency; tracked as open question)
- Implementing shared lock token inheritance (Priority 4 from fact-find; not needed yet)
- Redesigning the lock system architecture

## Constraints & Assumptions

- Constraints:
  - All changes must preserve the single-writer invariant
  - Shell scripts must remain POSIX-compatible where they already are (`set -euo pipefail` + bash)
  - `clean-stale` must be safe to call from any context (human, agent, hook)
- Assumptions:
  - The existing `break_stale_lock_if_safe()` logic (host match + PID liveness) is the correct safety check; `clean-stale` reuses it
  - PID reuse is extremely unlikely within a single session but should be documented as a known limitation

## Fact-Find Reference

- Related brief: `docs/plans/archive/writer-lock-stale-locks-fact-find.md`
- Key findings:
  - Stale lock detection already exists in `break_stale_lock_if_safe()` (line 159) but only runs during `acquire`, not as a standalone command
  - `require-writer-lock.sh` error message fix already applied (no longer suggests bypass)
  - `agent-bin/git` SKIP_* check (lines 72-75) only matches CLI args, not env var prefixes
  - `docs/git-safety.md` line 317 documents `SKIP_WRITER_LOCK=1` as a valid emergency bypass
  - `.claude/settings.json` line 64 has an ask-rule for `SKIP_WRITER_LOCK=1` (correct — keep as ask, not allow)

## Existing System Notes

- Key modules/files:
  - `scripts/git/writer-lock.sh` — Lock management (acquire/release/status + `break_stale_lock_if_safe`)
  - `scripts/agents/with-writer-lock.sh` — Wrapper with EXIT trap
  - `scripts/git-hooks/require-writer-lock.sh` — Hook that enforces lock (already fixed)
  - `scripts/agent-bin/git` — Agent git guard (SKIP_* check gap)
  - `docs/git-safety.md` — Documents SKIP_WRITER_LOCK=1 as emergency bypass (line 317)
  - `MEMORY.md` — Contains "NEVER bypass" rule (line 16)
  - `docs/git-hooks.md` — References require-writer-lock.sh in hook chain
- Patterns to follow:
  - `break_stale_lock_if_safe()` in `writer-lock.sh` — the existing stale detection logic to reuse
  - `is_pid_alive()` in `writer-lock.sh` — PID liveness check

## Proposed Approach

Four focused, low-risk changes that each independently improve the system:

1. Add `clean-stale` command to `writer-lock.sh` — reuses existing `break_stale_lock_if_safe()` as a user-callable action
2. Fix `agent-bin/git` env var gap — detect `SKIP_WRITER_LOCK=1` set as env before the git invocation
3. Update `docs/git-safety.md` — reframe bypass guidance toward `acquire --wait` and `clean-stale`
4. Close external MEMORY.md follow-up and retain canonical guidance in repo runbooks

No alternatives considered — these are all targeted fixes to known gaps with clear implementations.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `clean-stale` command to `writer-lock.sh` | 95% | S | Completed | - |
| TASK-02 | IMPLEMENT | Fix agent-bin/git env var prefix detection | 90% | S | Completed | - |
| TASK-03 | IMPLEMENT | Update docs/git-safety.md bypass guidance | 92% | S | Completed | TASK-01 |
| TASK-04 | OUT-OF-REPO | Close MEMORY.md follow-up; treat repo runbooks as canonical | 95% | S | Completed | TASK-01 |

> Effort scale: S=1, M=2, L=3

## Tasks

### TASK-01: Add `clean-stale` command to `writer-lock.sh`

- **Type:** IMPLEMENT
- **Affects:** `scripts/git/writer-lock.sh`
- **Depends on:** -
- **Confidence:** 95%
  - Implementation: 98% — Reuses existing `break_stale_lock_if_safe()` function; just needs a new case branch in the command dispatcher
  - Approach: 95% — Follows existing command pattern (status/acquire/release); adds `clean-stale` as a peer
  - Impact: 92% — Only adds a new code path; existing acquire/release/status paths untouched
- **Acceptance:**
  - `writer-lock.sh clean-stale` exists as a command
  - When no lock exists: exits 0, prints "unlocked" or similar
  - When lock exists with dead PID on same host: cleans lock, exits 0, prints what it did
  - When lock exists with live PID: exits 1, prints clear error explaining the lock is legitimately held
  - When lock exists on different host: exits 1, prints clear error (cannot verify remote PID)
  - Usage help updated to include `clean-stale`
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: No lock exists → exit 0, output contains "unlocked"
    - TC-02: Lock exists, PID dead, same host → lock cleaned, exit 0, output explains what happened
    - TC-03: Lock exists, PID alive → exit 1, output explains lock is held by live process
    - TC-04: Lock exists, different host → exit 1, output explains cannot verify remote PID
    - TC-05: `writer-lock.sh --help` output includes `clean-stale`
  - **Acceptance coverage:** TC-01→AC1, TC-02→AC3, TC-03→AC4, TC-04→AC5, TC-05→AC6
  - **Test type:** Manual shell testing (no existing test harness for shell scripts)
  - **Test location:** Manual verification via terminal
  - **Run:** `scripts/git/writer-lock.sh clean-stale` (with various lock states)
- **Rollout / rollback:**
  - Rollout: Direct commit to dev; no feature flag needed (additive change)
  - Rollback: Revert commit; existing commands unaffected
- **Documentation impact:**
  - `docs/git-safety.md` — will reference `clean-stale` (TASK-03)
  - `docs/git-hooks.md` — no change needed (hooks don't call clean-stale)
- **Notes / references:**
  - Implementation: add `clean-stale)` case at ~line 180 in `writer-lock.sh`, call `break_stale_lock_if_safe`, report result
  - Update `usage()` function to include `clean-stale` in help text

### TASK-02: Fix agent-bin/git env var prefix detection

- **Type:** IMPLEMENT
- **Affects:** `scripts/agent-bin/git`
- **Depends on:** -
- **Confidence:** 90%
  - Implementation: 92% — The guard already parses args; need to also check env vars in the current environment
  - Approach: 90% — Checking `$SKIP_WRITER_LOCK` and `$SKIP_SIMPLE_GIT_HOOKS` env vars directly is simpler and more reliable than trying to parse env var prefixes from args
  - Impact: 88% — The agent-bin/git wrapper is only used by agents (not humans); changes here only affect agent execution paths. `.claude/settings.json` already has an ask-rule for `SKIP_WRITER_LOCK=1` at the Claude Code level (line 64), so this is defense-in-depth.
- **Acceptance:**
  - When `SKIP_WRITER_LOCK=1` is set as env var and agent calls git through the guard: command is blocked
  - When `SKIP_SIMPLE_GIT_HOOKS=1` is set as env var: command is blocked
  - Existing CLI arg detection still works
  - Normal git operations (no SKIP_* env vars) are unaffected
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-06: `SKIP_WRITER_LOCK=1 scripts/agent-bin/git commit` → blocked (exit 1, deny message)
    - TC-07: `SKIP_SIMPLE_GIT_HOOKS=1 scripts/agent-bin/git push` → blocked
    - TC-08: `scripts/agent-bin/git commit -m "normal"` → allowed (passes through)
    - TC-09: CLI arg `scripts/agent-bin/git SKIP_WRITER_LOCK=1 commit` → still blocked (existing behavior)
  - **Acceptance coverage:** TC-06→AC1, TC-07→AC2, TC-08→AC4, TC-09→AC3
  - **Test type:** Manual shell testing + existing `pre-tool-use-git-safety.test.ts` may cover some paths
  - **Test location:** `scripts/__tests__/pre-tool-use-git-safety.test.ts` (line 184 already tests env var prefix; verify agent-bin behavior manually)
  - **Run:** Manual: `SKIP_WRITER_LOCK=1 scripts/agent-bin/git status`
- **Rollout / rollback:**
  - Rollout: Direct commit to dev
  - Rollback: Revert commit
- **Documentation impact:** None — `docs/git-safety.md` already documents the guard; no new docs needed
- **Notes / references:**
  - Implementation: Add env var check near the existing SKIP_* arg check (around line 72). Check `${SKIP_WRITER_LOCK:-}` and `${SKIP_SIMPLE_GIT_HOOKS:-}` directly rather than trying to parse command strings.
  - The existing test at `scripts/__tests__/pre-tool-use-git-safety.test.ts:184` tests the PreToolUse hook (Claude Code layer), not the agent-bin/git wrapper. These are different layers.

### TASK-03: Update docs/git-safety.md bypass guidance

- **Type:** IMPLEMENT
- **Affects:** `docs/git-safety.md`
- **Depends on:** TASK-01
- **Confidence:** 92%
  - Implementation: 95% — Text edit to existing documentation
  - Approach: 92% — Replaces bypass suggestion with `clean-stale` + `acquire --wait`; keeps the information about what SKIP_WRITER_LOCK does (for understanding) but reframes it as anti-pattern
  - Impact: 90% — Documentation change only; `docs/git-safety.md` is a reference doc read by humans and agents
- **Acceptance:**
  - Line 317 area no longer presents `SKIP_WRITER_LOCK=1` as a recommended emergency action
  - The section explains `clean-stale` and `acquire --wait` as the correct recovery paths
  - The bypass mechanism is still documented (for understanding) but clearly marked as anti-pattern
  - The "Document why hooks were bypassed" guidance (line 322) is preserved
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-10: Doc does not contain `SKIP_WRITER_LOCK=1` as a recommended action
    - TC-11: Doc mentions `clean-stale` as the recovery mechanism
    - TC-12: Doc still explains what `SKIP_WRITER_LOCK=1` does (for understanding, not recommendation)
  - **Acceptance coverage:** TC-10→AC1, TC-11→AC2, TC-12→AC3
  - **Test type:** Manual review (documentation)
  - **Test location:** `docs/git-safety.md`
  - **Run:** Read and verify
- **Rollout / rollback:**
  - Rollout: Direct commit to dev
  - Rollback: Revert commit
- **Documentation impact:** Self (this IS the documentation update)
- **Notes / references:**
  - Lines 312-322 in `docs/git-safety.md` are the target area
  - Preserve the code block format but reframe the content

### TASK-04: Close MEMORY.md Follow-up (Repo Scope Complete)

- **Type:** OUT-OF-REPO
- **Affects:** External memory file (non-repo) + repo runbooks
- **Depends on:** TASK-01
- **Confidence:** 95%
  - Implementation: 98% — Text replacement on line 16
  - Approach: 95% — Reasoning-first guidance (explain invariant → decision framework → tools) is well-established in the fact-find
  - Impact: 92% — repo guidance is now canonical and enforced via runbooks + guardrails
- **Acceptance:**
  - Repo runbooks document the decision framework (status → clean-stale if dead PID → acquire --wait)
  - Agents are directed to fix lock state instead of bypassing writer lock
  - This plan can close without requiring edits to non-repo memory files
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-13: `AGENTS.md` includes lock recovery steps and anti-bypass guidance
    - TC-14: `docs/git-safety.md` includes the same recovery decision steps
    - TC-15: Guardrail tests prove bypass env vars are blocked for agent git wrapper
  - **Acceptance coverage:** TC-13→AC1/AC2, TC-14→AC1, TC-15→AC2
  - **Test type:** Manual review
  - **Test location:** `AGENTS.md`, `docs/git-safety.md`, `scripts/__tests__/git-safety-policy.test.ts`
  - **Run:** Read and verify
- **Rollout / rollback:**
  - Rollout: No repo code changes required beyond completed runbook updates
  - Rollback: N/A
- **Documentation impact:** Self (this IS the documentation update)
- **Notes / references:**
  - External `MEMORY.md` is intentionally excluded from repo completion criteria
  - Repo runbooks are the durable source of truth for this workflow

## Risks & Mitigations

- **Risk:** `clean-stale` could clean a lock held by a process with a recycled PID
  - **Mitigation:** PID reuse within a single session is extremely unlikely on macOS/Linux. Document as known limitation. Future enhancement: store `lstart` from `ps` for verification.
- **Risk:** Agent-bin/git env var check could block legitimate uses
  - **Mitigation:** There are no legitimate agent uses of `SKIP_WRITER_LOCK=1`. The check is strictly defense-in-depth. `.claude/settings.json` already has an ask-rule at the Claude Code layer.
- **Risk:** Documentation changes could make the system harder to recover from truly stuck states
  - **Mitigation:** `release --force` remains documented as a human-only escape hatch. `clean-stale` provides a safer first option.

## Observability

- Logging: `clean-stale` should print what it did (cleaned vs refused) to stderr
- Metrics: N/A (shell scripts, no metrics infrastructure)
- Alerts/Dashboards: N/A

## Acceptance Criteria (overall)

- [x] `writer-lock.sh clean-stale` works as a first-class recovery command
- [x] `agent-bin/git` blocks `SKIP_WRITER_LOCK=1` when set as env var
- [x] `docs/git-safety.md` no longer suggests bypass as the primary recovery path
- [x] Writer-lock decision framework is captured in repo runbooks (`AGENTS.md` + `docs/git-safety.md`)
- [x] No regressions to existing lock acquire/release/status behavior

## Decision Log

- 2026-02-07: Plan created from fact-find. Error message fix already applied. Scoped to 4 remaining tasks.
- 2026-02-07: Deferred `SKIP_WRITER_LOCK=1` code path removal — keep as last-resort escape hatch until `clean-stale` is proven in practice.
- 2026-02-07: Completed TASK-01/TASK-02/TASK-03 (clean-stale command, guard env-var block, docs/runbook guidance refresh).
- 2026-02-07: Closed TASK-04 at repo scope by treating runbooks as canonical; external `MEMORY.md` is out-of-repo.
- 2026-02-07: Archived plan after full implementation and validation.
