---
Type: Plan
Status: Complete
Domain: Infra
Created: 2026-02-06
Created-by: Claude Opus 4.6
Last-reviewed: 2026-02-06
Last-updated: 2026-02-06
Feature-Slug: agent-safety-net-hardening
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); Overall = weighted min across tasks
Relates-to charter: none
Build-progress: 9/9 tasks complete
Business-Unit: PLAT
Card-ID: PLAT-OPP-0004
Fact-Find: docs/plans/agent-safety-net-hardening-fact-find.md
Critical-Findings:
  - Layer 4 (Claude Code PreToolUse hooks) is currently a no-op — empty hooks array
  - settings.local.json explicitly allows destructive wildcards (git reset:*, git push:*, etc.)
  - Agent git guard only activates via with-git-guard.sh wrapper, not by default
  - Block-commit-on-protected-branches.sh is orphaned (not in pre-commit chain)
  - Zero automated tests for any safety script
---

# Agent Safety Net Hardening — Plan

## Summary

Close the gaps in the existing 4-layer agent safety system so that destructive git commands and hook bypasses cannot be silently executed by AI agents. The system must enforce "wait for a lock, don't bypass it" and "never lose uncommitted work" while keeping all legitimate agent work unblocked.

The canonical source of truth for all deny/ask/allow decisions is **`docs/git-safety.md` § Command Policy Matrix**. All enforcement points reference that matrix; changes flow from the matrix outward.

## Active tasks (next to execute)

All tasks are pending. Execute in dependency order: SAFE-01 → SAFE-02 → SAFE-03 (these can overlap), then SAFE-04..SAFE-07 in parallel, then SAFE-08, then SAFE-09.

## Goals

- Implement functional Claude Code PreToolUse hooks that block destructive git patterns at the tool-call level (Layer 4)
- Add `permissions.deny` and `permissions.ask` rules that override wildcard allow-list entries
- Ensure the agent git guard is always on PATH for Claude Code sessions via SessionStart hook
- Tighten git guard pattern matching to match the full Command Policy Matrix
- Wire the orphaned protected-branch commit guard into the pre-commit chain
- Create a table-driven Jest test harness that prevents the three enforcement points from drifting
- Update documentation to reflect the actual state of protections

## Non-goals

- Multi-writer locking (separate initiative: `docs/plans/multi-writer-git-locking-plan.md`)
- Replacing the writer lock system
- Blocking legitimate agent work (file edits, commits, pushes to feature branches)
- Installing a shell testing framework (bats/shunit2/shellspec)

## Constraints & Assumptions

**Constraints**
- Hook scripts must be fast (<1s) to avoid degrading agent responsiveness
- Changes to `.claude/settings.json` affect all repo cloners (deny rules should be universal)
- Dev environments are macOS-only (no Windows/WSL/Linux portability needed currently)
- `simple-git-hooks` requires `pnpm run prepare` after config changes

**Assumptions**
- Claude Code's `permissions.deny` rules take precedence over `allow` rules (confirmed by API docs)
- `CLAUDE_ENV_FILE` in SessionStart hooks persists PATH changes (confirmed)
- `jq` available on dev machines; fallback to `node -e` (guaranteed by pnpm)
- "Work" = file content (working tree bytes). Staging state is not covered.

## Fact-Find Reference

- Brief: `docs/plans/agent-safety-net-hardening-fact-find.md` (rev3, Ready-for-planning)
- Confidence inputs from fact-find: Implementation 92%, Approach 90%, Impact 95%, Testability 75%

## Existing System Notes (code truth)

- `.claude/settings.json` (17 lines): Empty PreToolUse hooks array, only allows `Bash(head:*)`
- `.claude/settings.local.json` (354 lines): 6 broad destructive wildcards (`git push:*`, `git stash:*`, `git checkout:*`, `git restore:*`, `git reset:*`, `git worktree:*`), plus bypass patterns (`SKIP_WRITER_LOCK=1 git:*`, `SKIP_SIMPLE_GIT_HOOKS=1 git commit:*`)
- `scripts/agent-bin/git` (116 lines): Blocks worktree, reset with flags, clean -fd (but not -f alone), push --force, rebase, amend, checkout/restore `.`/`:/`, all stash ops. Only active via `with-git-guard.sh`.
- `scripts/git-hooks/block-commit-on-protected-branches.sh` (36 lines): Orphaned. Blocks commits on `main`/`master` but not `staging`.
- `scripts/git-hooks/pre-commit.sh` (12 lines): Chain does NOT include branch guard.
- `scripts/__tests__/` (22 test files): Zero tests for any safety script.

## Proposed Approach

### Phase 1 — Core enforcement (SAFE-01..03)

Create the three new enforcement mechanisms: PreToolUse hook script, SessionStart hook for PATH/config injection, and permissions deny/ask rules. These form the foundation.

### Phase 2 — Tighten existing layers (SAFE-04..07)

Expand the git guard pattern matching, wire the orphaned branch guard, update settings.json hook config, and clean up the allow-list. Each is independent.

### Phase 3 — Verification and docs (SAFE-08..09)

Create the test harness that prevents drift, and update all documentation.

---

## Tasks

### SAFE-01: Create PreToolUse hook script

- **Type:** IMPLEMENT
- **Effort:** M (3 files: hook script, jq fallback helper, hook config wiring)
- **Affects:** `.claude/hooks/pre-tool-use-git-safety.sh` (new), `.claude/hooks/parse-json.sh` (new helper) `[readonly]` `docs/git-safety.md`
- **Dependencies:** None
- **Blocks:** SAFE-06 (hook config wiring)

**Description:**

Create a PreToolUse hook script at `.claude/hooks/pre-tool-use-git-safety.sh` that:

1. Reads `tool_input` JSON from stdin (tool_name and tool_input.command)
2. Only acts on `Bash` tool calls (skip all others immediately — fast exit for non-Bash)
3. Extracts the command string from `tool_input.command`
4. Matches the command against the **Deny** patterns from `docs/git-safety.md` § Command Policy Matrix
5. On match: exits with code 2, stderr contains a clear reason message explaining what was blocked and why
6. On no match: exits 0 (allow)

**Pattern matching requirements (from Command Policy Matrix Deny table):**
- `git reset --hard` (all variants)
- `git reset --merge`, `git reset --keep`
- `git clean -f` (all variants: `-fd`, `-fdx`, `-ffdx`, combined flags containing `f`)
- `git checkout -f`, `git checkout --force`
- `git checkout -- .`, `git checkout -- <dir>/`, `git checkout -- <glob>`
- `git restore .`, `git restore <dir>/`, `git restore -- <glob>`
- `git restore --worktree` with broad pathspecs
- `git switch --discard-changes`, `git switch -f`
- `git push --force`, `git push -f`, `git push --force-with-lease`, `git push --mirror`
- `git rebase` (all variants)
- `git commit --amend`
- `git stash drop`, `git stash clear`
- `git worktree` (all operations)
- `git -c core.hooksPath=...` and `git config core.hooksPath`
- Absolute-path git with destructive args (e.g. `/usr/bin/git reset --hard`, `/opt/homebrew/bin/git clean -f`)

**JSON parsing:** Use `jq` with fallback to `node -e`:
```bash
parse_json() {
  if command -v jq &>/dev/null; then
    jq -r "$1" 2>/dev/null
  elif command -v node &>/dev/null; then
    node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log($1)" 2>/dev/null
  else
    echo "ERROR: neither jq nor node found" >&2; return 1
  fi
}
```

**Include a comment at the top of the script:**
```bash
# Source of truth: docs/git-safety.md § Command Policy Matrix (Deny table)
# When updating patterns, update the matrix first, then this script.
```

**Acceptance Criteria:**
1. Script blocks all Deny-table patterns and exits with code 2 + descriptive stderr
2. Script allows all Allow-table patterns (exit 0, no output)
3. Script processes non-Bash tool calls instantly (exit 0)
4. Script works with both `jq` and `node -e` fallback
5. Script runs in <100ms for typical commands
6. Script catches absolute-path git invocations (e.g. `/usr/bin/git reset --hard`)
7. Script catches env var prefixed commands (e.g. in the command string `SKIP_WRITER_LOCK=1 git commit`)

**Test Contract:**
- TC-01: `git reset --hard HEAD` → exit 2, stderr mentions "reset --hard"
- TC-02: `git clean -fd` → exit 2
- TC-03: `git clean -f` → exit 2
- TC-04: `git push --force origin main` → exit 2
- TC-05: `git push --force-with-lease` → exit 2
- TC-06: `git push --mirror` → exit 2
- TC-07: `git checkout -- .` → exit 2
- TC-08: `git checkout -- src/` → exit 2
- TC-09: `git restore .` → exit 2
- TC-10: `git switch --discard-changes main` → exit 2
- TC-11: `git checkout -f main` → exit 2
- TC-12: `git rebase main` → exit 2
- TC-13: `git commit --amend` → exit 2
- TC-14: `git stash drop` → exit 2
- TC-15: `git stash clear` → exit 2
- TC-16: `git worktree add ../foo` → exit 2
- TC-17: `git -c core.hooksPath=/dev/null commit` → exit 2
- TC-18: `git config core.hooksPath /dev/null` → exit 2
- TC-19: `/usr/bin/git reset --hard` → exit 2
- TC-20: `git status` → exit 0
- TC-21: `git commit -m "test"` → exit 0
- TC-22: `git push origin feature-branch` → exit 0
- TC-23: `git stash list` → exit 0
- TC-24: `git stash push` → exit 0
- TC-25: `git add .` → exit 0
- TC-26: `git log --oneline` → exit 0
- TC-27: `ls -la` (non-git command) → exit 0 (passthrough)
- TC-28: `git reset HEAD file.txt` → exit 0 (unstage, not destructive)
- TC-29: `git clean --dry-run` → exit 0 (preview only)
- TC-30: `git reset --merge` → exit 2
- TC-31: `git reset --keep` → exit 2

**Planning Validation:** Manual test of hook with piped JSON stdin simulating Claude Code input.

**Rollout/Rollback:** Script is inert until wired in SAFE-06. Rollback: delete file.

**Documentation Impact:** None yet (wired in SAFE-09).

**Confidence:**
- Implementation: 90% — hook API is well-documented; pattern matching is straightforward shell
- Approach: 92% — block-and-explain is the right v1 strategy; no command rewriting
- Impact: 95% — inert until wired; zero blast radius during development
- **Overall: 90%**

#### Build Completion (2026-02-06)
- **Status:** Complete
- **TDD cycle:**
  - Test cases executed: TC-01 through TC-31 plus extras (53 total tests)
  - Red-green cycles: 2 (initial implementation had bash syntax error; rewrote with simpler patterns)
  - Initial test run: FAIL (expected — hook not implemented)
  - Post-implementation: PASS (53/53)
- **Confidence reassessment:**
  - Original: 90%
  - Post-test: 92%
  - Delta reason: Tests validated all patterns; hook also handles compound commands (`echo test && git reset --hard`)
- **Validation:**
  - Ran: `pnpm exec jest scripts/__tests__/pre-tool-use-git-safety.test.ts` — PASS (53 tests, 53 passed)
  - Performance: 60ms per invocation (target <100ms)
- **Documentation updated:** None required (deferred to SAFE-09)
- **Implementation notes:** No separate `parse-json.sh` helper needed — JSON parsing is inline in the hook script (jq with node fallback). Script uses regex-based matching on normalized command string.

---

### SAFE-02: Create SessionStart hook for PATH injection and git config

- **Type:** IMPLEMENT
- **Effort:** S (1 file, simple script)
- **Affects:** `.claude/hooks/session-start.sh` (new) `[readonly]` `scripts/agent-bin/git`
- **Dependencies:** None
- **Blocks:** SAFE-06 (hook config wiring)

**Description:**

Create a SessionStart hook at `.claude/hooks/session-start.sh` that:

1. Writes to `$CLAUDE_ENV_FILE` to prepend `scripts/agent-bin/` to PATH (using the repo root derived from the script's location)
2. Sets `git config --global pull.ff only` (ensures non-FF pulls fail cleanly)
3. Is silent on success (no stdout noise in agent startup)
4. Handles missing `CLAUDE_ENV_FILE` gracefully (warn to stderr, exit 0 — don't block session start)

The git guard wrapper (`scripts/agent-bin/git`) is self-contained: it finds real git by iterating PATH and skipping its own directory. No additional env vars are needed.

**Include a comment:**
```bash
# Ensures agent git guard is always active for Claude Code sessions.
# The guard enforces docs/git-safety.md § Command Policy Matrix at PATH level.
```

**Acceptance Criteria:**
1. After hook runs, `which git` in a Claude Code Bash call resolves to `scripts/agent-bin/git`
2. `git config --get pull.ff` returns `only`
3. Hook produces no stdout on success
4. Hook handles missing `CLAUDE_ENV_FILE` without crashing

**Test Contract:**
- TC-32: Hook writes PATH export to `$CLAUDE_ENV_FILE` with `scripts/agent-bin` prepended
- TC-33: Hook runs `git config --global pull.ff only` successfully
- TC-34: Hook exits 0 on success
- TC-35: Hook exits 0 and warns on stderr when `CLAUDE_ENV_FILE` is unset

**Planning Validation:** Manual: set `CLAUDE_ENV_FILE` to a temp file, run hook, verify contents.

**Rollout/Rollback:** Inert until wired in SAFE-06. Rollback: delete file.

**Documentation Impact:** None yet (wired in SAFE-09).

**Confidence:**
- Implementation: 95% — trivial script, well-understood API
- Approach: 95% — SessionStart + CLAUDE_ENV_FILE is the documented mechanism
- Impact: 95% — inert until wired
- **Overall: 95%**

#### Build Completion (2026-02-06)
- **Status:** Complete (pre-existing)
- **Implementation notes:** Script already existed at `.claude/hooks/session-start.sh` with all required functionality. No code changes needed.
- **Validation:** Manual test confirmed PATH export to CLAUDE_ENV_FILE and graceful handling of missing env file.

---

### SAFE-03: Add permissions.deny and permissions.ask rules to settings.json

- **Type:** IMPLEMENT
- **Effort:** S (1 file edit)
- **Affects:** `.claude/settings.json`
- **Dependencies:** None (can be done independently, but logically pairs with SAFE-01/02)
- **Blocks:** SAFE-07 (allow-list cleanup)

**Description:**

Add `permissions.deny` and `permissions.ask` arrays to `.claude/settings.json`. These are project-level (committed) and affect all repo cloners.

**Deny rules** (hard block — agents cannot execute):
```json
"deny": [
  "Bash(git reset --hard:*)",
  "Bash(git reset --merge:*)",
  "Bash(git reset --keep:*)",
  "Bash(git clean -f:*)",
  "Bash(git clean -fd:*)",
  "Bash(git clean -fdx:*)",
  "Bash(git clean -ffdx:*)",
  "Bash(git checkout -f:*)",
  "Bash(git checkout --force:*)",
  "Bash(git checkout -- .:*)",
  "Bash(git restore .:*)",
  "Bash(git restore --worktree:*)",
  "Bash(git switch --discard-changes:*)",
  "Bash(git switch -f:*)",
  "Bash(git push --force:*)",
  "Bash(git push -f:*)",
  "Bash(git push --force-with-lease:*)",
  "Bash(git push --mirror:*)",
  "Bash(git rebase:*)",
  "Bash(git commit --amend:*)",
  "Bash(git stash drop:*)",
  "Bash(git stash clear:*)",
  "Bash(git worktree:*)",
  "Bash(git -c core.hooksPath:*)",
  "Bash(git config core.hooksPath:*)",
  "Bash(/usr/bin/git reset:*)",
  "Bash(/usr/bin/git clean:*)",
  "Bash(/usr/bin/git checkout -f:*)",
  "Bash(/usr/bin/git push --force:*)",
  "Bash(/opt/homebrew/bin/git reset:*)",
  "Bash(/opt/homebrew/bin/git clean:*)"
]
```

**Ask rules** (human approval required):
```json
"ask": [
  "Bash(git commit --no-verify:*)",
  "Bash(git commit -n:*)",
  "Bash(git push --no-verify:*)",
  "Bash(SKIP_WRITER_LOCK=1:*)",
  "Bash(SKIP_SIMPLE_GIT_HOOKS=1:*)",
  "Bash(ALLOW_GIT_REBASE=1:*)",
  "Bash(ALLOW_COMMIT_MSG_REUSE=1:*)",
  "Bash(ALLOW_COMMIT_ON_PROTECTED_BRANCH=1:*)",
  "Bash(git restore:*)",
  "Bash(git checkout --:*)",
  "Bash(git reset HEAD~:*)",
  "Bash(git stash pop:*)",
  "Bash(git stash apply:*)",
  "Bash(git push origin --delete:*)",
  "Bash(git push origin ::*)"
]
```

**Allow rules** (safe baseline for all cloners):
```json
"allow": [
  "Bash(head:*)",
  "Bash(git status:*)",
  "Bash(git log:*)",
  "Bash(git diff:*)",
  "Bash(git show:*)",
  "Bash(git branch:*)",
  "Bash(git remote:*)",
  "Bash(git fetch:*)",
  "Bash(git add:*)",
  "Bash(git rm --cached:*)",
  "Bash(git commit -m:*)",
  "Bash(git push origin:*)",
  "Bash(git pull --ff-only:*)",
  "Bash(git stash list:*)",
  "Bash(git stash show:*)",
  "Bash(git stash push:*)",
  "Bash(git reset HEAD:*)",
  "Bash(git restore --staged:*)",
  "Bash(git cherry-pick:*)",
  "Bash(git tag:*)",
  "Bash(git clean --dry-run:*)",
  "Bash(git clean -n:*)",
  "Bash(git ls-files:*)",
  "Bash(git ls-tree:*)",
  "Bash(git rev-parse:*)",
  "Bash(git check-ignore:*)",
  "Bash(git fsck:*)",
  "Bash(git read-tree:*)",
  "Bash(git mv:*)"
]
```

**Include a comment in the JSON (or adjacent doc) referencing:**
```
// Source of truth: docs/git-safety.md § Command Policy Matrix
// Evaluation order: deny > ask > allow
```

**Note on rule overlap:** `Bash(git restore:*)` appears in ask (catches single-file restores) while `Bash(git restore .:*)` appears in deny (catches bulk restores). Since deny > ask, bulk restores are blocked; single-file restores prompt the user.

**Acceptance Criteria:**
1. All Deny-table patterns are in `permissions.deny`
2. All Ask-table patterns are in `permissions.ask`
3. Safe read-only operations are in `permissions.allow`
4. JSON is valid and parseable
5. Deny rules override conflicting allow rules in `settings.local.json`

**Test Contract:**
- TC-36: `git reset --hard HEAD` in Claude Code → blocked (deny rule fires)
- TC-37: `git push --force origin main` → blocked
- TC-38: `git commit --no-verify -m "test"` → prompted (ask)
- TC-39: `SKIP_WRITER_LOCK=1 git commit` → prompted (ask)
- TC-40: `git restore foo.ts` → prompted (ask)
- TC-41: `git status` → allowed (no prompt)
- TC-42: `git commit -m "test"` → allowed (no prompt)
- TC-43: `git push origin feature` → allowed (no prompt)
- TC-44: `git stash list` → allowed (no prompt)
- TC-45: `git stash push` → allowed (no prompt)

**Planning Validation:** Verify JSON validity with `node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8'))"`.

**Rollout/Rollback:** Immediate effect on all Claude Code sessions using this repo. Rollback: `git revert` the commit.

**Documentation Impact:** `docs/incident-prevention.md` Layer 4 status needs updating (SAFE-09).

**Confidence:**
- Implementation: 92% — syntax confirmed; minor uncertainty on glob matching edge cases
- Approach: 90% — deny > ask > allow is the correct layering; slight risk of over-blocking
- Impact: 85% — this changes behavior for all agents immediately; careful testing needed
- **Overall: 85%**

#### Build Completion (2026-02-06)
- **Status:** Complete
- **Validation:** JSON validated with `node -e "JSON.parse(...)"`
- **Implementation notes:** 30 deny rules, 15 ask rules, 29 allow rules added. Combined with SAFE-06 (hook wiring) in a single edit to `.claude/settings.json`.

---

### SAFE-04: Tighten agent git guard pattern matching

- **Type:** IMPLEMENT
- **Effort:** M (1 file, but substantial logic changes + many new patterns)
- **Affects:** `scripts/agent-bin/git` `[readonly]` `docs/git-safety.md`
- **Dependencies:** None (can be done in parallel with SAFE-01..03)

**Description:**

Expand `scripts/agent-bin/git` to match the full Command Policy Matrix. Current gaps:

**New deny patterns to add:**
- `checkout -f` / `checkout --force` (force checkout)
- `switch --discard-changes` / `switch -f` (discard on switch)
- `push --force-with-lease` (already blocked but verify)
- `push --mirror` (overwrites entire remote)
- `clean -f` alone (currently only blocks `-fd` combination)
- `clean` with any flag combination containing `f` (e.g. `-fdx`, `-ffdx`, `-fx`)
- `reset --merge` / `reset --keep` (already blocked but verify)
- `-c core.hooksPath=...` (detect as first arg before subcommand)
- `config core.hooksPath` (persistent hook bypass)
- `--no-verify` / `-n` on commit/push (**hard-block at guard level** — belt-and-suspenders for ask enforcement weakness)
- Detection of `SKIP_*` env vars in args (hard-block at guard level)

**Expanded checkout/restore blocking:**
- Currently only matches literal `.`, `:/`, `:/.`, `:/*`
- Must also match: directory paths ending in `/`, glob patterns (`*.json`), `--` followed by multiple files

**Stash policy fix:**
- Currently blocks ALL stash operations
- New policy: allow `list`/`show`/`push`, block `pop`/`apply`/`drop`/`clear`

**Bare `git reset <ref>` handling:**
- Currently only blocks reset with flag args (`--hard`, `--soft`, etc.)
- Bare `git reset HEAD~1` (no flags, defaults to `--mixed`) should also be blocked
- `git reset HEAD <file>` (unstage) should be ALLOWED

**Add comment at top:**
```bash
# Source of truth: docs/git-safety.md § Command Policy Matrix
# When updating patterns, update the matrix first, then this script.
```

**Acceptance Criteria:**
1. All Deny-table patterns from the matrix are blocked (exit 1 + descriptive stderr)
2. All Allow-table patterns pass through (exit 0, executed normally)
3. `stash list`, `stash show`, `stash push` are allowed
4. `stash pop`, `stash apply`, `stash drop`, `stash clear` are blocked
5. `git reset HEAD file.txt` (unstage) is allowed
6. `git reset HEAD~1` (bare reset) is blocked
7. `git clean --dry-run` and `git clean -n` are allowed
8. `--no-verify` flag is blocked on commit and push
9. `SKIP_*` env var detection works (reads from args/env)
10. Existing safe operations continue to work

**Test Contract:**
- TC-46: `checkout -f main` → blocked
- TC-47: `switch --discard-changes main` → blocked
- TC-48: `clean -f` → blocked
- TC-49: `clean -fdx` → blocked
- TC-50: `clean --dry-run` → allowed
- TC-51: `checkout -- src/` → blocked (directory path)
- TC-52: `checkout -- .` → blocked (existing, verify preserved)
- TC-53: `stash list` → allowed
- TC-54: `stash show` → allowed
- TC-55: `stash push` → allowed
- TC-56: `stash pop` → blocked
- TC-57: `stash drop` → blocked
- TC-58: `stash clear` → blocked
- TC-59: `reset HEAD file.txt` → allowed (unstage)
- TC-60: `reset HEAD~1` → blocked (bare reset)
- TC-61: `-c core.hooksPath=/dev/null commit` → blocked
- TC-62: `commit --no-verify -m "x"` → blocked
- TC-63: `push --mirror` → blocked
- TC-64: `push origin feature` → allowed
- TC-65: `commit -m "test"` → allowed
- TC-66: `status` → allowed (passthrough)
- TC-67: `config core.hooksPath /dev/null` → blocked

**Planning Validation:** Test each pattern with direct invocation of the guard script.

**Rollout/Rollback:** Only affects sessions with git guard on PATH (currently: wrapper shells; after SAFE-02+06: all Claude Code sessions). Rollback: `git revert`.

**Documentation Impact:** `docs/git-hooks.md` stash policy note needs updating (SAFE-09).

**Confidence:**
- Implementation: 88% — many new patterns; risk of false positives on edge cases like `git reset HEAD file.txt` vs `git reset HEAD~1`
- Approach: 92% — matching the canonical matrix is clearly correct
- Impact: 90% — affects agent git operations; false positives are immediately visible (blocked + reason shown)
- **Overall: 88%**

#### Build Completion (2026-02-06)
- **Status:** Complete
- **Implementation notes:** 12 categories of changes: updated top comment, added `-c core.hooksPath` detection, added `SKIP_*` env var detection, enhanced reset blocking (bare `HEAD~N`), fixed clean pattern (any `-f` variant), added `push --mirror` and `--no-verify`, added `commit --no-verify`, expanded checkout/restore blocking (directories, globs, `--worktree`, `--force`), added `switch` subcommand, fixed stash policy (allow list/show/push, block pop/apply/drop/clear), added `config core.hooksPath` blocking.
- **Validation:** `bash -n scripts/agent-bin/git` — syntax OK

---

### SAFE-05: Wire orphaned branch guard into pre-commit chain

- **Type:** IMPLEMENT
- **Effort:** S (2 file edits: package.json + the guard script itself)
- **Affects:** `package.json` (simple-git-hooks section), `scripts/git-hooks/block-commit-on-protected-branches.sh`
- **Dependencies:** None

**Description:**

1. Add `scripts/git-hooks/block-commit-on-protected-branches.sh` to the pre-commit chain in `package.json`:
   ```json
   "pre-commit": "scripts/git-hooks/block-commit-on-protected-branches.sh && scripts/git-hooks/pre-commit.sh"
   ```
   (Run branch guard first — fail fast before lint/typecheck.)

2. Add `staging` to the protected branch list in `block-commit-on-protected-branches.sh` (currently only checks `main`/`master`).

3. Run `pnpm run prepare` to install the updated hooks.

**Acceptance Criteria:**
1. Commits on `main` branch are blocked with a clear error message
2. Commits on `master` branch are blocked
3. Commits on `staging` branch are blocked
4. Commits on `dev` or feature branches succeed normally
5. Bypass `ALLOW_COMMIT_ON_PROTECTED_BRANCH=1` still works for emergencies
6. Pre-commit chain runs the branch guard before other checks

**Test Contract:**
- TC-68: Commit on `main` → blocked with "protected branch" message
- TC-69: Commit on `staging` → blocked
- TC-70: Commit on `dev` → allowed (chain continues to next hook)
- TC-71: `ALLOW_COMMIT_ON_PROTECTED_BRANCH=1 git commit` on `main` → allowed (bypass works)
- TC-72: Commit on feature branch → allowed

**Planning Validation:** Read current pre-commit chain and package.json to confirm edit points.

**Rollout/Rollback:** Takes effect after `pnpm run prepare`. Rollback: revert package.json + re-run prepare.

**Documentation Impact:** `docs/git-hooks.md` needs updating (SAFE-09).

**Confidence:**
- Implementation: 95% — one-line chain edit + one branch name addition
- Approach: 95% — early fail-fast is correct pattern
- Impact: 90% — anyone on a protected branch gets blocked; that's the point
- **Overall: 90%**

#### Build Completion (2026-02-06)
- **Status:** Complete
- **Implementation notes:** Added `staging` to protected branches in `block-commit-on-protected-branches.sh`. Updated `package.json` `simple-git-hooks.pre-commit` to run branch guard first (`block-commit-on-protected-branches.sh && pre-commit.sh`). JSON validated.

---

### SAFE-06: Update settings.json hook configuration

- **Type:** IMPLEMENT
- **Effort:** S (1 file edit)
- **Affects:** `.claude/settings.json`
- **Dependencies:** SAFE-01, SAFE-02 (hook scripts must exist)

**Description:**

Replace the empty PreToolUse hooks array in `.claude/settings.json` with the actual hook scripts:

```json
{
  "model": "opus",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/pre-tool-use-git-safety.sh"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/session-start.sh"
          }
        ]
      }
    ]
  },
  "permissions": { ... }
}
```

Note: The PreToolUse matcher is `Bash` (only fires for Bash tool calls, not Read/Write/etc.).

**Acceptance Criteria:**
1. PreToolUse hook fires for every Bash tool call in Claude Code
2. SessionStart hook fires at session start
3. Non-Bash tool calls are not affected (no performance impact on Read/Write/Glob/etc.)
4. JSON is valid and parseable
5. Existing `model` setting is preserved

**Test Contract:**
- TC-73: Start new Claude Code session → `which git` resolves to `scripts/agent-bin/git`
- TC-74: Run `git reset --hard` in Claude Code → blocked by PreToolUse hook
- TC-75: Run `git status` in Claude Code → succeeds normally
- TC-76: Use Read tool in Claude Code → not affected by hook (no delay)

**Planning Validation:** Manual: start Claude Code session, verify hooks fire.

**Rollout/Rollback:** Takes effect on next Claude Code session start. Rollback: revert the JSON change.

**Documentation Impact:** None directly (covered in SAFE-09).

**Confidence:**
- Implementation: 92% — straightforward JSON config
- Approach: 95% — scoping matcher to `Bash` avoids unnecessary hook invocations
- Impact: 88% — affects all Claude Code sessions immediately; must work correctly
- **Overall: 88%**

#### Build Completion (2026-02-06)
- **Status:** Complete
- **Implementation notes:** Combined with SAFE-03 in a single write to `.claude/settings.json`. PreToolUse hook matcher scoped to `Bash` only. SessionStart hook added. Model setting preserved.

---

### SAFE-07: Clean up settings.local.json allow-list

- **Type:** IMPLEMENT
- **Effort:** S (1 file edit, not committed — per-machine)
- **Affects:** `.claude/settings.local.json`
- **Dependencies:** SAFE-03 (deny/ask rules must be in place before removing allow-list safety net)

**Description:**

Remove the six broad destructive wildcards from `settings.local.json`:
- Remove: `Bash(git push:*)` (line 14)
- Remove: `Bash(git stash:*)` (line 15)
- Remove: `Bash(git checkout:*)` (line 16)
- Remove: `Bash(git restore:*)` (line 17)
- Remove: `Bash(git reset:*)` (line 18)
- Remove: `Bash(git worktree:*)` (line 65)

Remove bypass env var patterns:
- Remove: `Bash(SKIP_SIMPLE_GIT_HOOKS=1 git commit:*)` (line 170)
- Remove: `Bash(SKIP_WRITER_LOCK=1 git:*)` (line 177)

These are now governed by the deny/ask/allow rules in `.claude/settings.json`. The broad wildcards in `settings.local.json` would otherwise override the ask rules (since `allow` entries let commands through without prompting).

**Note:** This is a local file (not committed). The task documents what to remove; each developer applies it to their own machine. Consider providing a migration script or documenting in the PR description.

**Acceptance Criteria:**
1. No broad destructive wildcards remain in `settings.local.json`
2. No bypass env var patterns remain
3. Legitimate git operations still work (the committed settings.json has a safe allow-list)
4. Operations governed by "ask" rules now actually prompt for approval

**Test Contract:**
- TC-77: `git checkout -- .` → blocked by deny (not silently allowed by local override)
- TC-78: `git restore foo.ts` → prompted by ask (not silently allowed by local override)
- TC-79: `SKIP_WRITER_LOCK=1 git commit` → prompted by ask (not silently allowed)
- TC-80: `git push origin feature` → still allowed (covered by committed allow-list)
- TC-81: `git commit -m "test"` → still allowed

**Planning Validation:** Manual: remove entries, verify Claude Code behavior.

**Rollout/Rollback:** Per-machine. Rollback: re-add the entries.

**Documentation Impact:** Note in PR description for other developers.

**Confidence:**
- Implementation: 95% — simple deletions
- Approach: 88% — risk that some legitimate operations now get ask-prompted unnecessarily; may need to add targeted allow rules
- Impact: 85% — changes developer experience; may surface unexpected prompts
- **Overall: 85%**

#### Build Completion (2026-02-06)
- **Status:** Complete
- **Implementation notes:** Removed 5 broad destructive wildcards (`git push:*`, `git stash:*`, `git checkout:*`, `git restore:*`, `git reset:*`), 1 worktree wildcard, and 2 bypass patterns (`SKIP_SIMPLE_GIT_HOOKS=1 git commit:*`, `SKIP_WRITER_LOCK=1 git:*`) from settings.local.json. JSON validated.

---

### SAFE-08: Create table-driven Jest test harness

- **Type:** IMPLEMENT
- **Effort:** M (1 new test file + shared test case table)
- **Affects:** `scripts/__tests__/git-safety-policy.test.ts` (new) `[readonly]` `scripts/agent-bin/git`, `.claude/hooks/pre-tool-use-git-safety.sh`
- **Dependencies:** SAFE-01, SAFE-04 (both enforcement scripts must exist to test against)

**Description:**

Create a single Jest test file that validates both enforcement points against a shared table of test cases derived from the Command Policy Matrix.

**Test architecture:**

```typescript
// scripts/__tests__/git-safety-policy.test.ts

import { spawnSync } from 'child_process';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../..');
const GIT_GUARD = path.join(REPO_ROOT, 'scripts/agent-bin/git');
const PRETOOLUSE_HOOK = path.join(REPO_ROOT, '.claude/hooks/pre-tool-use-git-safety.sh');

interface TestCase {
  command: string;          // The git command (or full command for hook)
  expectedDecision: 'deny' | 'allow';
  description: string;
}

const POLICY_TABLE: TestCase[] = [
  // Deny cases
  { command: 'git reset --hard HEAD', expectedDecision: 'deny', description: 'reset --hard' },
  { command: 'git clean -fd', expectedDecision: 'deny', description: 'clean -fd' },
  // ... (all TC-01 through TC-81 from task contracts above)

  // Allow cases
  { command: 'git status', expectedDecision: 'allow', description: 'status (read-only)' },
  { command: 'git commit -m "test"', expectedDecision: 'allow', description: 'normal commit' },
  // ...
];

describe('Git Safety Policy (git guard)', () => {
  test.each(POLICY_TABLE.filter(t => ...))('%s', (tc) => {
    const args = tc.command.replace(/^git\s+/, '').split(/\s+/);
    const result = spawnSync(GIT_GUARD, args, {
      env: { ...process.env, PATH: `...:${process.env.PATH}` },
      timeout: 5000,
    });
    if (tc.expectedDecision === 'deny') {
      expect(result.status).not.toBe(0);
    } else {
      // For allow cases, we can't actually run git — just verify the guard doesn't block
      // Use a mock git binary that exits 0
    }
  });
});

describe('Git Safety Policy (PreToolUse hook)', () => {
  test.each(POLICY_TABLE)('%s', (tc) => {
    const input = JSON.stringify({
      tool_name: 'Bash',
      tool_input: { command: tc.command }
    });
    const result = spawnSync(PRETOOLUSE_HOOK, [], {
      input,
      timeout: 5000,
    });
    if (tc.expectedDecision === 'deny') {
      expect(result.status).toBe(2);
    } else {
      expect(result.status).toBe(0);
    }
  });
});
```

**Key design decisions:**
- Single shared `POLICY_TABLE` array is the drift-detection mechanism
- If a pattern is added to the matrix but not the table, no test covers it → the developer is reminded to add it
- Git guard tests need a mock `git` binary (the real git would execute the command) — create a tiny `#!/bin/bash\nexit 0` script and put it on PATH after the guard
- PreToolUse hook tests can pipe JSON directly — clean interface

**Acceptance Criteria:**
1. Test file runs with `pnpm test` (Jest discovers it)
2. All TC-01 through TC-81 cases are represented in the test table
3. Tests pass for both the git guard and PreToolUse hook
4. Adding a new pattern to the matrix without updating enforcement scripts causes a test failure
5. Tests complete in <30 seconds total

**Test Contract:** This task IS the test harness — its acceptance criteria are the meta-tests.
- TC-82: `pnpm exec jest scripts/__tests__/git-safety-policy.test.ts` runs and passes
- TC-83: Intentionally break a pattern in the guard → test fails
- TC-84: Tests complete in <30s

**Planning Validation:** Verify Jest config discovers `scripts/__tests__/*.test.ts` files (already true — 22 test files exist there).

**Rollout/Rollback:** No runtime impact. Rollback: delete test file.

**Documentation Impact:** Mention test harness in `docs/git-safety.md` maintenance section (SAFE-09).

**Confidence:**
- Implementation: 82% — mock git binary setup and PATH manipulation in tests need care; Jest + spawnSync is well-understood
- Approach: 90% — table-driven testing against both enforcement points is the correct architecture for drift detection
- Impact: 95% — test-only, no runtime risk
- **Overall: 82%**

#### Build Completion (2026-02-06)
- **Status:** Complete
- **TDD cycle:**
  - Test cases executed: 106 tests across 6 describe blocks
  - Red-green cycles: 1 (2 tests needed skipHook adjustment — stash pop/apply are ask-level, not deny-level in hook)
  - Post-implementation: PASS (106/106)
- **Confidence reassessment:**
  - Original: 82%
  - Post-test: 88%
  - Delta reason: Mock git binary approach worked cleanly. `stash pop`/`apply` correctly identified as ask-level in hook vs deny-level in guard.
- **Validation:**
  - Ran: `pnpm exec jest scripts/__tests__/git-safety-policy.test.ts` — PASS (106 tests)
  - Combined: 159 tests total (53 + 106) in <10s
- **Implementation notes:** Shared `POLICY_TABLE` with `PolicyTestCase` interface. Mock git binary created in `beforeAll`/`afterAll`. `skipHook`/`skipGuard` flags handle divergent enforcement between layers (e.g. stash pop blocked by guard but only ask-level in hook).

---

### SAFE-09: Update documentation

- **Type:** IMPLEMENT
- **Effort:** S (3 file edits)
- **Affects:** `docs/incident-prevention.md`, `docs/git-hooks.md`, `docs/git-safety.md`
- **Dependencies:** SAFE-01..08 (all implementation done; docs describe final state)

**Description:**

1. **`docs/incident-prevention.md`:**
   - Update Layer 4 status from "Configured" (inaccurate) to "Active" with description of the PreToolUse hook
   - Add SessionStart hook to the protection layers description
   - Note that the git guard is now always active for Claude Code sessions (not just wrapper shells)

2. **`docs/git-hooks.md`:**
   - Add `block-commit-on-protected-branches.sh` to the active hooks table
   - Add `staging` to the list of protected branches
   - Update stash policy description (was: "all blocked"; now: "list/show/push allowed, pop/apply/drop/clear blocked")
   - Add note about `--no-verify` being hard-blocked by git guard

3. **`docs/git-safety.md`:**
   - Add a note in the Command Policy Matrix maintenance section about the Jest test harness
   - Add reference to the test file: `scripts/__tests__/git-safety-policy.test.ts`
   - Update "For AI Agents" section if any session start procedures changed

**Acceptance Criteria:**
1. `docs/incident-prevention.md` Layer 4 accurately describes active PreToolUse hooks
2. `docs/git-hooks.md` lists all active hooks including the branch guard
3. `docs/git-safety.md` references the test harness in the maintenance section
4. No inaccuracies remain in documentation about protection layer status

**Test Contract:**
- TC-85: Layer 4 in incident-prevention.md describes PreToolUse hooks (not "no-op")
- TC-86: git-hooks.md lists block-commit-on-protected-branches.sh as active
- TC-87: git-safety.md maintenance section mentions test harness

**Planning Validation:** Read current docs to identify exact edit points.

**Rollout/Rollback:** Documentation only. Rollback: `git revert`.

**Documentation Impact:** This IS the documentation task.

**Confidence:**
- Implementation: 95% — straightforward text edits
- Approach: 95% — docs should reflect reality
- Impact: 95% — no runtime impact
- **Overall: 95%**

#### Build Completion (2026-02-06)
- **Status:** Complete
- **Implementation notes:** Updated all three documentation files: `docs/incident-prevention.md` (Layer 4 now ACTIVE, stash policy, --no-verify), `docs/git-hooks.md` (branch guard added to table, staging protected, --no-verify note), `docs/git-safety.md` (new Maintenance section with test harness references, Layer 4 rewritten, stash commands updated).

---

## Dependency Graph

```
SAFE-01 (PreToolUse hook) ──┐
                             ├── SAFE-06 (wire hooks) ──┐
SAFE-02 (SessionStart hook) ─┘                          │
                                                        ├── SAFE-08 (tests) ── SAFE-09 (docs)
SAFE-03 (deny/ask rules) ── SAFE-07 (cleanup local)    │
                                                        │
SAFE-04 (tighten git guard) ────────────────────────────┘

SAFE-05 (wire branch guard) ── (independent, can run anytime)
```

## Confidence Summary

| Task | Effort | Implementation | Approach | Impact | Overall | Status |
|------|--------|---------------|----------|--------|---------|--------|
| SAFE-01: PreToolUse hook | M | 90% | 92% | 95% | 90% | Complete (2026-02-06) |
| SAFE-02: SessionStart hook | S | 95% | 95% | 95% | 95% | Complete (2026-02-06) |
| SAFE-03: Deny/ask rules | S | 92% | 90% | 85% | 85% | Complete (2026-02-06) |
| SAFE-04: Tighten git guard | M | 88% | 92% | 90% | 88% | Complete (2026-02-06) |
| SAFE-05: Wire branch guard | S | 95% | 95% | 90% | 90% | Complete (2026-02-06) |
| SAFE-06: Wire hook config | S | 92% | 95% | 88% | 88% | Complete (2026-02-06) |
| SAFE-07: Cleanup allow-list | S | 95% | 88% | 85% | 85% | Complete (2026-02-06) |
| SAFE-08: Jest test harness | M | 82% | 90% | 95% | 82% | Complete (2026-02-06) |
| SAFE-09: Update docs | S | 95% | 95% | 95% | 95% | Complete (2026-02-06) |

**Overall plan confidence: 82%** (bottleneck: SAFE-08 test harness implementation confidence at 82%)

All tasks are ≥80% — the plan is build-eligible.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Over-blocking legitimate agent operations | Agents get stuck on permission prompts, reduced productivity | Start with deny-only for clearly destructive patterns; monitor ask prompts in first week; adjust rules |
| Pattern matching false positives in git guard | Legitimate git commands blocked unexpectedly | Table-driven test harness (SAFE-08) catches edge cases; guard shows descriptive error messages |
| settings.local.json cleanup breaks existing workflows | Developer friction from unexpected prompts | Document in PR description; provide migration guidance; committed allow-list covers safe baseline |
| PreToolUse hook adds latency to every Bash call | Agent responsiveness degrades | Fast-path exit for non-git commands; target <100ms; matcher scoped to `Bash` only |
| Rule drift after initial deployment | Enforcement points diverge from matrix | Jest test harness (SAFE-08) detects drift; maintenance procedure documented in matrix |
| `git config --global pull.ff only` conflicts with existing config | Unexpected pull failures | This is intentional — non-FF pulls should fail; document the behavior change |

## Acceptance Test Matrix (Manual, Post-Rollout)

After all tasks complete, verify these scenarios in a fresh Claude Code session:

| Scenario | Expected Result |
|---|---|
| `git status`, `git diff`, `git log` | Allowed (no prompt) |
| `git stash list`, `git stash show` | Allowed (no prompt) |
| `git stash push` | Allowed (no prompt) |
| `git push origin my-branch` | Allowed (no prompt) |
| `git commit -m "test"` | Allowed (writer lock required by hook) |
| `git reset HEAD file.txt` | Allowed (no prompt, unstage only) |
| `git clean --dry-run` | Allowed (no prompt, preview only) |
| `git pull --ff-only` | Allowed (no prompt) |
| `git reset --hard` | **Denied** (3 layers) |
| `git push --force` | **Denied** (3 layers) |
| `git checkout -- .` | **Denied** (3 layers) |
| `git clean -fd` | **Denied** (3 layers) |
| `git stash drop` | **Denied** (3 layers) |
| `git switch --discard-changes main` | **Denied** (3 layers) |
| `/usr/bin/git reset --hard` | **Denied** (2 layers: hook + deny rule) |
| `git commit --no-verify` | **Ask** + guard block |
| `SKIP_WRITER_LOCK=1 git commit` | **Ask** + guard block |
| `git restore foo.ts` | **Ask** (human approves) |
| `git stash pop` | **Ask** (guard blocks) |
| `which git` | Resolves to `scripts/agent-bin/git` |

## Relationship to Other Plans

- **Multi-writer locking** (`docs/plans/multi-writer-git-locking-plan.md`): Addresses concurrent multi-agent writes with path-level locks. This plan closes single-agent safety gaps. Both are needed; this plan should complete first.
- **Agent context optimization** (`docs/plans/agent-context-optimization-plan.md`): Independent. Changes to AGENTS.md git rules section may need updating after this plan.
