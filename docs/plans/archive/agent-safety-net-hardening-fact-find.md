---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Created: 2026-02-06
Last-updated: 2026-02-06 (rev3: post-critique-round-2)
Feature-Slug: agent-safety-net-hardening
Related-Plan: docs/plans/agent-safety-net-hardening-plan.md
Business-Unit: PLAT
Card-ID: PLAT-OPP-0004
---

# Agent Safety Net Hardening Fact-Find Brief

## Scope

### Summary

Close the gaps in the existing 4-layer agent safety system so that destructive git commands and hook bypasses cannot be silently executed by AI agents. The system must enforce "wait for a lock, don't bypass it" and "never lose uncommitted work" while keeping all legitimate agent work (edits, commits, pushes to feature branches) unblocked.

### Goals

- Implement functional Claude Code PreToolUse hooks that block destructive git patterns at the tool-call level (Layer 4)
- Add `permissions.deny` and `permissions.ask` rules that override wildcard allow-list entries for destructive commands and bypasses respectively
- Move hook-bypass patterns (`SKIP_WRITER_LOCK`, `SKIP_SIMPLE_GIT_HOOKS`, `--no-verify`) from allow-list to ask-list (require human approval at point of use)
- Ensure the agent git guard (`scripts/agent-bin/git`) is always on PATH for Claude Code sessions
- Tighten git guard pattern matching to catch directory paths, globs, bare `git reset`, and additional destructive patterns (`switch --discard-changes`, `checkout -f`, `push --mirror`, `clean` variants, `core.hooksPath` overrides)
- Wire the orphaned protected-branch commit guard into the pre-commit chain
- Fix stash policy: allow read-only ops and `stash push`, ask for `pop`/`apply`, deny `drop`/`clear`

### Non-goals

- Multi-writer locking (separate initiative: `docs/plans/multi-writer-git-locking-plan.md`)
- Replacing the writer lock system (stays as-is)
- Blocking legitimate agent work (file edits, commits, pushes to feature branches)
- Full shell testing framework installation (bats/shunit2) — the minimal Jest harness is in-scope

### Constraints & Assumptions

- Constraints:
  - Must work with Claude Code's hook API (confirmed: PreToolUse, SessionStart, permissions.deny, permissions.ask all supported)
  - Must not break existing human workflows — hard-deny operations require dropping to a regular terminal; ask-gated operations can be approved in-session
  - Changes to `.claude/settings.json` affect all users who clone the repo
  - Changes to `.claude/settings.local.json` are per-machine and not committed
  - Hook scripts must be fast (<1s) to avoid degrading agent responsiveness
  - Dev environments are macOS-only (no Windows/WSL/Linux portability needed currently)
- Assumptions:
  - Claude Code's `permissions.deny` rules take precedence over `allow` rules (confirmed by API docs: deny > ask > allow evaluation order)
  - `CLAUDE_ENV_FILE` in SessionStart hooks persists PATH changes for all subsequent Bash invocations (confirmed)
  - `jq` is available on dev machines; fallback to `node -e` (guaranteed by pnpm/Node requirement) if absent
  - "Work" means file content (working tree bytes). Staging state (index) is not covered by "never lose work" — `git reset HEAD <file>` (unstage) and `git restore --staged` are allowed

## Repo Audit (Current State)

### Entry Points

- `.claude/settings.json` — project-level Claude Code config (committed); defines hooks and base permissions
- `.claude/settings.local.json` — per-machine Claude Code config (not committed); contains the bulk of allow-listed permissions
- `scripts/agent-bin/git` — the agent git guard wrapper (116 lines)
- `scripts/git-hooks/pre-commit.sh` — pre-commit hook chain entry point
- `scripts/git-hooks/pre-push-safety.sh` — pre-push safety checks
- `scripts/git-hooks/require-writer-lock.sh` — writer lock enforcement (called from pre-commit and pre-push)
- `scripts/agents/with-git-guard.sh` — PATH wrapper that activates the git guard
- `scripts/agents/integrator-shell.sh` — combined writer-lock + git-guard entry point

### Key Modules / Files

- `scripts/agent-bin/git` — Intercepts `git` commands on PATH. Blocks: worktree, reset (with flags), clean -fd, push --force, rebase, commit --amend, checkout/restore `.`/`:/`, all stash ops. **Only active when launched via `with-git-guard.sh`.**
- `scripts/git/writer-lock.sh` — Single-writer mutex using atomic `mkdir`. Token-based release. Stale lock auto-recovery. 258 lines.
- `scripts/git-hooks/block-commit-on-protected-branches.sh` — Blocks commits on `main`/`master`. **Orphaned: not called from pre-commit chain.**
- `scripts/git-hooks/prepare-commit-msg-safety.sh` — Blocks `--amend` and commit-message reuse workflows.
- `scripts/git-hooks/pre-rebase-safety.sh` — Blocks all rebase operations by default (bypass: `ALLOW_GIT_REBASE=1`).
- `docs/incident-prevention.md` — Documents Layer 4 as "Configured" but it is actually a no-op.
- `docs/git-hooks.md` — Documents active hooks and bypass procedures. Notes that hooks can't prevent discards.
- `docs/git-safety.md` — Comprehensive safety reference.

### Patterns & Conventions Observed

- **Defense in depth:** Multiple layers (docs → hooks → guard → settings) intentionally overlap. Pattern: `scripts/git-hooks/` for hook scripts, `scripts/agent-bin/` for PATH-level guards, `scripts/agents/` for wrapper entry points.
- **Bypass env vars:** Each guard has an emergency bypass: `SKIP_WRITER_LOCK=1`, `SKIP_SIMPLE_GIT_HOOKS=1`, `ALLOW_GIT_REBASE=1`, `ALLOW_COMMIT_ON_PROTECTED_BRANCH=1`, `ALLOW_COMMIT_MSG_REUSE=1`. All documented as "human only, emergency."
- **Git hook registration:** `simple-git-hooks` in `package.json` maps hook names to shell command chains. Changes require `pnpm run prepare` to install.
- **Claude Code hooks:** JSON config in `.claude/settings.json`. PreToolUse hooks receive `tool_input` on stdin as JSON. Exit code 2 = block (reason on stderr). JSON stdout with `permissionDecision: "deny"` also blocks.

### Data & Contracts

- Types/schemas:
  - Claude Code hook input: `{ session_id, cwd, hook_event_name, tool_name, tool_input: { command, description, timeout, run_in_background } }`
  - Claude Code hook output (blocking): `{ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "..." } }` or exit code 2 with reason on stderr
  - Claude Code hook output (PATH modification via SessionStart): writes `export PATH=...` to `$CLAUDE_ENV_FILE`
  - Permission rule syntax: `Bash(pattern)` where pattern uses glob matching. Deny rules use identical syntax to allow rules.
- Persistence:
  - Writer lock: `<git-common-dir>/base-shop-writer-lock/` directory with `meta` file (token, PID, timestamp)
  - Claude Code permissions: `.claude/settings.json` (committed), `.claude/settings.local.json` (not committed), `~/.claude/settings.json` (user-level)
- API/event contracts:
  - Claude Code hook events: `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `SessionStart`, `UserPromptSubmit`, `Stop`, `SubagentStart`, `Notification`, `PermissionRequest`
  - SessionStart provides `CLAUDE_ENV_FILE` for persistent env var injection

### Dependency & Impact Map

- Upstream dependencies:
  - `jq` (for JSON parsing in hook scripts; fallback to `node -e` if absent)
  - `simple-git-hooks` ^2.11.0 (resolved 2.13.1; hook registration)
  - Claude Code hook API (stable; well-documented)
- Downstream dependents:
  - **All agents and human developers** are affected by changes to `.claude/settings.json` and git hooks
  - `scripts/agents/integrator-shell.sh` depends on `with-git-guard.sh` and `with-writer-lock.sh`
  - `docs/incident-prevention.md` and `docs/git-hooks.md` reference the protection layers and must be updated
- Likely blast radius:
  - **Low risk if done incrementally.** Each change (hook script, settings deny rule, pre-commit chain addition) is independent and testable in isolation.
  - **Medium risk for settings.local.json changes** — removing allow-list entries means agents will be prompted for permission where they previously auto-executed. This is the desired behavior (deny by default, human approves) but could interrupt agent flow for legitimate operations if deny rules are too broad.
  - **No risk to production.** All changes are local developer tooling. No production code is modified.

### Command Policy Matrix

See **`docs/git-safety.md` § Command Policy Matrix** — that is the canonical, stable source of truth for all deny/ask/allow decisions. The fact-find brief does not duplicate the matrix; all enforcement points reference the canonical doc.

Key decisions captured there:
- **Deny:** instant-destruction commands (reset --hard, clean -f, push --force, checkout -f, switch --discard-changes, stash drop/clear, worktree, rebase, amend, core.hooksPath overrides, absolute-path git with destructive args)
- **Ask:** bypass mechanisms (--no-verify, SKIP_* env vars, ALLOW_* env vars), single-file working-tree discards (`git restore <file>`, `git checkout -- <file>`), bare `git reset <ref>`, stash pop/apply, push --delete, non-FF pull
- **Allow:** read-only ops, staging, normal commit/push, stash list/show/push, unstage, fetch, pull --ff-only, clean --dry-run

### Test Landscape

#### Test Infrastructure

- **Frameworks:** Jest (unit/integration), Cypress (E2E), Playwright (E2E)
- **Commands:** `pnpm test`, `pnpm test:e2e`
- **CI integration:** Tests run in GitHub Actions; pre-commit/pre-push hooks run locally only
- **Coverage tools:** None configured for shell scripts

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Safety scripts (all) | none | none | **Zero automated tests for any safety script** |
| Git hooks (all 11 scripts) | manual only | `docs/git-hooks.md` L266-293 | Manual procedure documented; not automated |
| Writer lock | none | none | No tests for acquire/release/stale recovery |
| Agent git guard | none | none | No tests for pattern matching logic |

#### Test Patterns & Conventions

- Unit tests: Jest with TypeScript. Located in `__tests__/` directories or co-located `.test.ts` files.
- Shell script tests: **No convention exists.** No shell testing framework (`bats`, `shunit2`, `shellspec`) is installed.
- Test data: Jest uses inline fixtures and mock functions.

#### Coverage Gaps (Planning Inputs)

- **Untested paths:**
  - `scripts/agent-bin/git` — all pattern matching logic (116 lines, 0 tests)
  - `scripts/git/writer-lock.sh` — acquire/release/stale/token logic (258 lines, 0 tests)
  - `scripts/git-hooks/*` — all 11 hook scripts (0 tests)
  - Claude Code PreToolUse hook scripts (don't exist yet)

#### Testability Assessment

- **Easy to test:** The agent git guard (`scripts/agent-bin/git`) has clear input (command + args) and output (exit code + stderr). Can be tested by calling it with various git command patterns and asserting exit codes.
- **Hard to test:** Writer lock stale detection (requires simulating dead PIDs on same hostname). Git hooks require a real git repo context to test properly.
- **Test seams needed:** The PreToolUse hook scripts will receive JSON on stdin and produce exit codes + stderr/stdout — highly testable with shell scripts that pipe JSON in.

#### Recommended Test Approach

- **Table-driven Jest harness:** A single test file using `child_process.spawnSync` against a shared table of `{ command, expectedDecision }` cases derived from the Command Policy Matrix. Tests both the PreToolUse hook (pipe JSON stdin, assert exit code) and the git guard (pass args, assert exit code). No new shell testing framework needed.
- **Drift detection:** If the test table and the matrix diverge, tests fail — this is the mechanism that prevents the three enforcement points from drifting.

### Recent Git History (Targeted)

- `scripts/agent-bin/git` — last modified during initial safety system build (Jan 2026). No changes since.
- `scripts/git-hooks/*` — pre-commit chain last changed to add writer lock and partial staging guards (Jan-Feb 2026).
- `.claude/settings.json` — hooks section added but left empty. Most recent changes added `model: "opus"`.
- `.claude/settings.local.json` — grown incrementally as new commands are needed. Bypass patterns added during early agent development when hooks were blocking work.

## External Research

### Claude Code Hook API (confirmed capabilities)

- **PreToolUse hooks:** Receive `tool_input` as JSON on stdin. Block via exit code 2 (stderr = reason) or JSON `permissionDecision: "deny"`. Can modify commands via `updatedInput`. Can add context via `additionalContext`. Matcher filters on tool name (regex), not command content. Source: Claude Code hooks documentation.
- **SessionStart hooks:** Have access to `CLAUDE_ENV_FILE` for persisting env vars (including PATH). This is the correct way to ensure `agent-bin/git` is always on PATH. Source: Claude Code hooks documentation.
- **permissions.deny:** Fully supported. Evaluation order: deny > ask > allow. Same syntax as allow rules. Can target specific command patterns: `Bash(git reset --hard:*)`. Source: Claude Code permissions documentation.
- **Hook timeout:** Default 600 seconds for command hooks. Configurable per-hook.
- **Compatibility:** Verified against current Claude Code version in use.

## Questions

### Resolved

- Q: Does Claude Code support `permissions.deny`?
  - A: Yes. Deny rules take precedence over allow rules. Syntax is identical to allow rules.
  - Evidence: Claude Code permissions documentation confirms deny > ask > allow evaluation order.

- Q: Can a PreToolUse hook block execution and provide a reason to the agent?
  - A: Yes. Exit code 2 with reason on stderr, or JSON with `permissionDecision: "deny"` and `permissionDecisionReason`.
  - Evidence: Claude Code hooks documentation.

- Q: Can PATH be modified for all Claude Code Bash invocations?
  - A: Yes, via a SessionStart hook that writes to `CLAUDE_ENV_FILE`.
  - Evidence: Claude Code hooks documentation. `CLAUDE_ENV_FILE` is only available in SessionStart hooks.

- Q: Will deny rules in `.claude/settings.json` (committed) be visible to all repo cloners?
  - A: Yes. Project-level settings are loaded for everyone. This is the correct place for deny rules — they should be universal.
  - Evidence: Claude Code settings precedence: project < local < user. Deny rules from any level take effect.

- Q: Can the PreToolUse hook catch commands with env var prefixes like `SKIP_WRITER_LOCK=1 git commit`?
  - A: Yes. The hook receives the full command string in `tool_input.command`. Pattern matching in the hook script can detect env var prefixes.
  - Evidence: Claude Code PreToolUse input schema includes full `command` field.

- Q: Should deny rules go in `.claude/settings.json` (committed) or `.claude/settings.local.json` (per-machine)?
  - A: **Committed (`settings.json`).** Deny rules should be universal protection. Hard-deny operations require dropping to a regular terminal — that 10-second friction is intentional.
  - Decision: Deny and ask rules go in `.claude/settings.json`. Allow rules remain in `.claude/settings.local.json` (per-machine, evolving).

- Q: Which operations should be "hard deny" vs "ask for approval"?
  - A: **Deny:** Commands that destroy work instantly with no undo (reset --hard, clean -f, push --force, checkout -f, switch --discard-changes, stash drop/clear, worktree, rebase, amend, core.hooksPath overrides). **Ask:** Bypass mechanisms a human might need in an emergency (--no-verify, SKIP_* env vars, ALLOW_* env vars, stash pop/apply, push --delete).
  - Rationale: Deny means "this should never happen from Claude Code." Ask means "a human can consciously approve in-session." See Command Policy Matrix for the full list.

- Q: Is it acceptable that humans must drop to a regular terminal for hard-deny operations?
  - A: Yes. That is the design intent. The hard-deny list is operations that should never be agent-initiated. A human who truly needs `git reset --hard` uses a terminal.

- Q: Does "losing staging state" violate "never lose uncommitted work"?
  - A: No. "Work" means file content (working tree bytes). Unstaging (`git reset HEAD <file>`, `git restore --staged`) doesn't lose content — these are **allowed**. However, bare `git reset <ref>` (which moves HEAD and defaults to `--mixed`) is **ask** because it can unstage everything and cause confusion even though it doesn't destroy content.

- Q: Should `stash push` be allowed, asked, or denied?
  - A: **Allowed.** `stash push` is a safety mechanism, not destructive. Policy: allow `stash list/show/push`, ask `stash pop/apply` (conflict risk), deny `stash drop/clear` (permanent loss).

- Q: Does "hook bypasses" include `--no-verify` and `core.hooksPath` overrides?
  - A: Yes. `--no-verify`/`-n` → ask. `core.hooksPath` overrides → deny. Both are now in the Command Policy Matrix.

- Q: Do we need to protect against absolute-path git invocation (`/usr/bin/git`)?
  - A: Partially. The PreToolUse hook and permissions.deny see the full command string, so `/usr/bin/git reset --hard` is caught at those layers. The PATH-level guard can't help here, but that's defense in depth working as designed.

- Q: Do we need to block remote-destructive operations beyond force-push?
  - A: `push --mirror` → deny (overwrites entire remote). `push --delete <branch>` → ask (sometimes legitimate for cleanup). Both added to Command Policy Matrix.

- Q: How does `scripts/agent-bin/git` find the real git binary?
  - A: Self-contained. Iterates PATH entries, skips its own directory (`wrapper_dir`), takes the first `git` executable found. No dependency on env vars from `with-git-guard.sh`. SessionStart PATH injection is safe as-is — no recursion risk.
  - Evidence: `scripts/agent-bin/git` lines 8-26.

- Q: What are the exact wildcard allows in `settings.local.json` that deny must override?
  - A: Six broad patterns: `Bash(git push:*)` (L14), `Bash(git stash:*)` (L15), `Bash(git checkout:*)` (L16), `Bash(git restore:*)` (L17), `Bash(git reset:*)` (L18), `Bash(git worktree:*)` (L65). Plus bypass patterns: `Bash(SKIP_SIMPLE_GIT_HOOKS=1 git commit:*)` (L170), `Bash(SKIP_WRITER_LOCK=1 git:*)` (L177). No `--no-verify` or `core.hooksPath` currently allow-listed (would get prompted).

- Q: Should we require `jq` or use a fallback for JSON parsing in hook scripts?
  - A: **Use `jq` with fallback to `node -e`** (Node is guaranteed by the pnpm/monorepo requirement). Fallback chain: jq → node -e → fail with install instruction. Python3 is not reliably universal.

- Q: Should PreToolUse rewrite commands to safe alternatives?
  - A: **No, not for v1.** Block and explain. The agent reads the denial reason and chooses a safe alternative itself. Rewriting adds complexity and surprising behavior.

- Q: Should `.claude/settings.json` also contain a minimal safe allow-list?
  - A: Yes. The committed file should have deny rules, ask rules, and a small allow-list for safe read-only git operations. This reduces dependence on `settings.local.json` and ensures new cloners have a sane baseline.

### Open (User Input Needed)

None — all questions resolved.

## Confidence Inputs (for /plan-feature)

- **Implementation:** 92%
  - The Claude Code hook API is well-documented and confirmed to support everything we need (PreToolUse blocking, SessionStart PATH injection, permissions.deny). The git guard pattern matching fixes are straightforward shell script edits. The pre-commit chain wiring is a one-line change to `package.json`.
  - What would raise to 95%+: a working prototype of the PreToolUse hook script validated against real Claude Code behavior.

- **Approach:** 90%
  - Defense in depth with three independent mechanisms (PreToolUse hooks, deny rules, SessionStart PATH injection) is clearly the right approach. Each mechanism covers gaps the others can't: deny rules are static but bypass-proof; hooks are dynamic but can be circumvented by bugs; PATH injection ensures the guard runs even without hooks.
  - Minor uncertainty: whether deny rules in `.claude/settings.json` create friction for legitimate human workflows. Mitigation: deny only clearly destructive patterns, not broad categories.

- **Impact:** 95%
  - Blast radius is very low. All changes are local developer tooling (Claude Code settings, shell scripts, git hooks). No production code is modified. Each change is independent and can be rolled back by reverting a single file.
  - The only risk is over-blocking legitimate agent operations, which would manifest as permission prompts (not errors) and is easily corrected by adjusting deny patterns.

- **Testability:** 75%
  - No shell testing framework exists, but a minimal Jest harness using `child_process.spawnSync` against a table of cases is feasible without new framework dependencies. Both the PreToolUse hook (JSON stdin → exit code) and git guard (args → exit code) have clean interfaces for table-driven tests.
  - What would raise to 90%: the test harness covering all patterns in the Command Policy Matrix with a shared test case table that also serves as a drift-detection mechanism.

## Planning Constraints & Notes

- Must-follow patterns:
  - Hook scripts go in `.claude/hooks/` (new directory, following Claude Code conventions)
  - Git hook chain changes go in `package.json` `simple-git-hooks` section + `pnpm run prepare`
  - All deny/ask rules use the same `Bash(pattern)` syntax as existing allow rules
  - SessionStart hook uses `CLAUDE_ENV_FILE` (only available in SessionStart, not other hook types)
  - **Rule drift prevention:** The Command Policy Matrix in `docs/git-safety.md` is the single source of truth (canonical, stable — survives fact-find archival). All three enforcement points (PreToolUse hook, permissions rules, git guard) must include a comment referencing it. When patterns change, update all three plus the matrix.
- Rollout/rollback expectations:
  - Incremental rollout: hooks first, then deny/ask rules, then settings cleanup
  - Each change is a single file edit — rollback is `git revert` of one commit
  - Test each change manually against the acceptance matrix below before proceeding
- Observability expectations:
  - PreToolUse hook should output clear messages when blocking (agent sees reason, can adjust)
  - SessionStart hook should be silent on success (no noise in agent startup)
  - Consider a PostToolUse audit hook (log all git commands) as a future enhancement

### Acceptance Test Matrix (Manual)

After rollout, verify these scenarios manually:

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
| `git -C subdir status` | Allowed (no prompt) |
| `git reset --hard` | **Denied** by PreToolUse + permissions.deny + git guard |
| `git push --force` | **Denied** by PreToolUse + permissions.deny + git guard |
| `git push --force-with-lease` | **Denied** by PreToolUse + permissions.deny + git guard |
| `git checkout -- .` | **Denied** by PreToolUse + permissions.deny + git guard |
| `git checkout -- src/` | **Denied** by PreToolUse + permissions.deny + git guard (directory path) |
| `git clean -fd` | **Denied** by PreToolUse + permissions.deny + git guard |
| `git clean -f` | **Denied** by PreToolUse + permissions.deny + git guard |
| `git stash drop` | **Denied** by PreToolUse + permissions.deny + git guard |
| `git switch --discard-changes main` | **Denied** by PreToolUse + permissions.deny + git guard |
| `git -c core.hooksPath=/dev/null commit` | **Denied** by PreToolUse + permissions.deny |
| `/usr/bin/git reset --hard` | **Denied** by PreToolUse + permissions.deny (absolute path caught) |
| `git commit --no-verify` | **Ask** (permissions.ask) + **Blocked** by git guard (belt-and-suspenders) |
| `SKIP_WRITER_LOCK=1 git commit` | **Ask** (permissions.ask) + **Blocked** by git guard |
| `git restore foo.ts` | **Ask** — human approves single-file discard |
| `git checkout -- foo.ts` | **Ask** — human approves single-file discard |
| `git reset HEAD~1` | **Ask** — human approves bare reset (moves HEAD) |
| `git stash pop` | **Ask** — human sees approval prompt |
| `git push origin --delete old-branch` | **Ask** — human sees approval prompt |
| `git pull` (without --ff-only) | **Ask** or fails if pull.ff=only is set |

## Suggested Task Seeds (Non-binding)

1. **Create `.claude/hooks/` directory and PreToolUse hook script** — Parse `tool_input.command` from stdin JSON (jq with node -e fallback). Implement the full deny list from the Command Policy Matrix in `docs/git-safety.md`. Exit 2 with clear reason on stderr. Include a comment referencing the policy matrix as source of truth. Must also catch: absolute-path git (`/usr/bin/git`), env var prefixes (`SKIP_*`), `core.hooksPath` overrides, `--no-verify`/`-n`, `switch --discard-changes`/`-f`, `checkout -f`, `push --mirror`, `clean` variants, `--force-with-lease`.
2. **Create SessionStart hook for PATH injection and git config** — Write to `CLAUDE_ENV_FILE` to: (a) prepend `scripts/agent-bin/` to PATH, (b) set `git config --global pull.ff only` (ensures non-FF pulls fail cleanly instead of silently merging). Silent on success. The git guard wrapper is self-contained (finds real git by skipping its own dir on PATH) — no additional env vars needed.
3. **Add `permissions.deny` and `permissions.ask` rules to `.claude/settings.json`** — Deny list: all hard-deny patterns from the Command Policy Matrix. Ask list: all ask patterns (bypass env vars, `--no-verify`, single-file restore/checkout, bare `git reset <ref>`, stash pop/apply, push --delete, non-FF pull). Also add a minimal safe allow-list for read-only git operations to reduce dependence on `settings.local.json`.
4. **Tighten agent git guard pattern matching** — Expand `scripts/agent-bin/git` to match the full Command Policy Matrix: block `checkout -f`/`switch --discard-changes`/`switch -f`, expand checkout/restore to catch directory paths and globs (not just `.`/`:/`), block bare `git reset <ref>` (defaults to --mixed), block `git reset --merge`/`--keep`, block `clean -f` (all variants not just -fd), block `push --force-with-lease`/`--mirror`, block `core.hooksPath` overrides, **hard-block `--no-verify`/`-n` and `SKIP_*` env var detection** (catches bypasses hidden inside wrapper scripts where permissions.ask can't see them). Allow `stash list`/`stash show`/`stash push` while blocking `stash pop/apply/drop/clear`. Allow `clean --dry-run`/`-n`. Add comment referencing policy matrix.
5. **Wire orphaned branch guard into pre-commit chain** — Add `scripts/git-hooks/block-commit-on-protected-branches.sh` call to `package.json` pre-commit chain. Also add `staging` to the protected list (currently only checks `main`/`master`). Run `pnpm run prepare` to install.
6. **Update `.claude/settings.json` hook configuration** — Replace empty PreToolUse hooks array with the new hook script. Add SessionStart hook. Wire both to the scripts created in tasks 1-2.
7. **Clean up `settings.local.json` allow-list** — Remove the six broad destructive wildcards (`git reset:*`, `git push:*`, `git checkout:*`, `git restore:*`, `git stash:*`, `git worktree:*`) and replace with safe variants (e.g., `git push origin:*` for non-force pushes). Remove bypass env var patterns (`SKIP_WRITER_LOCK=1 git:*`, `SKIP_SIMPLE_GIT_HOOKS=1 git commit:*`). These are now governed by ask rules in the committed settings.
8. **Create table-driven Jest test harness** — A single test file (`scripts/__tests__/git-safety-policy.test.ts`) using `child_process.spawnSync` against a shared table of `{ command, expectedDecision }` cases derived from the Command Policy Matrix. Tests both the PreToolUse hook (pipe JSON stdin, assert exit code) and the git guard (pass args, assert exit code). If the test table and the matrix diverge, tests fail — this prevents drift across the three enforcement points.
9. **Update documentation** — Fix `docs/incident-prevention.md` (Layer 4 status: actually configured now, not a no-op). Update `docs/git-hooks.md` (add branch guard to active hooks table, add `staging` to protected branches). Update `docs/git-safety.md` if the Command Policy Matrix needs further adjustments. Add maintenance note about keeping three enforcement points aligned.

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: None. All questions resolved (deny vs ask policy decided, wrapper recursion confirmed safe, stash policy explicit, command coverage expanded, maintenance hazard addressed).
- Recommended next step: Proceed to `/plan-feature agent-safety-net-hardening`
