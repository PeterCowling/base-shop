---
Type: Plan
Status: Historical
Domain: Repo
Last-reviewed: 2026-01-17
Relates-to charter: none
Created: 2026-01-16
Created-by: Codex
Last-updated: 2026-01-17
Last-updated-by: Codex
Owner: Peter Cowling
Target: TBD
Related-PR: #7157
Completed: 2026-01-17
Completed-by: Codex
---

# Lint-staged Autostash Avoidance Plan

## Problem
Pre-commit runs `lint-staged`. By default, lint-staged creates a `lint-staged automatic backup` stash before running tasks so it can revert on errors. Timeouts/interrupts (SIGINT, crashes) can leave this stash behind even when there are no partially staged files, creating confusing repo state and a real "lost work" footgun.

We want a hook workflow that never creates a lint-staged backup stash ("no autostash ever") while remaining safe and predictable.

## Key lint-staged behaviors (current repo: 15.5.2)
- Default behavior: creates a backup stash (`lint-staged automatic backup`) and attempts to revert on errors.
- `--no-stash`: disables the backup stash and does not revert in case of errors.
- In lint-staged `15.2.0` through `16.1.0`, `--no-stash` also effectively enables behavior equivalent to `--no-hide-partially-staged`, which makes partially staged files dangerous.
  - In `16.1.1`, upstream changed semantics to prevent unstaged changes being committed when using `--no-stash`; re-evaluate this plan when upgrading.
- Safety implication: with `--no-stash` (and in our current 15.5.2 behavior), partially staged files are dangerous even with check-only tasks because lint-staged can re-add files to the index during its apply phase, which can stage unstaged hunks.

## Goals
- Ensure pre-commit creates no `lint-staged automatic backup` stash in any outcome (success, lint error, timeout, SIGINT).
- Make partially staged files a hard error before lint-staged runs.
- Enforce "lint + typecheck must pass before GitHub integration" using CI-required checks; optionally add local hooks as best-effort early feedback.

## Non-goals
- Claiming pre-commit can universally prevent pushes with failing commits (hooks are bypassable with `--no-verify` or by pushing from environments without hooks).
- Disabling lint rules or lowering lint coverage.
- Running monorepo-wide lint/typecheck in pre-commit (keep pre-commit fast).
- Changing unrelated Git safety rules.

## Current State
- Root `simple-git-hooks` runs `pnpm exec ... lint-staged` on `pre-commit`.
- Root `lint-staged` config runs `eslint --fix --max-warnings=0 ...` on staged JS/TS files (this must change if hooks are to be check-only).
- `lint-staged` is currently resolved to `15.5.2` (declared as `^15.2.10`).

## Proposed Approach
### Local hooks (best-effort)
1. Pre-commit guard (required correctness gate)
   - Detect partially staged paths by parsing `git status --porcelain=v2 -z` (NUL-delimited; safe for spaces/renames) and blocking any path that is modified in both the index and the working tree.
   - If any exist: abort with an actionable message and do not run lint-staged.
2. Run lint-staged with stash disabled
   - Use `pnpm exec lint-staged --no-stash`.
   - Treat the changed failure semantics as deliberate: `--no-stash` disables lint-staged's revert-on-error safety net, so the hook must remain check-only and guarded against partial staging.
3. Hooks are check-only (no `--fix`)
   - Do not run `eslint --fix` in pre-commit. Auto-fix is unreliable for most failures and any hook-driven mutations become riskier under `--no-stash` (no revert on error).
   - If lint/typecheck fails, the commit attempt should fail with actionable output, and fixes are applied by a developer or by an agent in a follow-up edit pass.
4. Agent commit workflow (when asked to "commit/push to GitHub")
   - Run lint (and fix any lint errors by editing code), re-run until clean.
   - Run typecheck (and fix any type errors by editing code), re-run until clean.
   - Only then attempt `git commit` / `git push` (never `--no-verify`).

### CI + branch protection (authoritative)
- Run `pnpm lint` and `pnpm typecheck` in GitHub Actions on PRs.
- Require those checks in the GitHub `main` ruleset so merges to `main` cannot happen unless lint and typecheck pass.
- Also require PRs (no direct pushes to `main`) so checks cannot be bypassed by skipping the PR workflow.

Pre-push (recommended default for local typecheck)
- Run `pnpm typecheck` in a `pre-push` hook (leverages incremental `tsc -b` + `turbo run typecheck` caching). This catches problems before remote CI churn without making every local commit slow. Keep pre-commit fast and predictable.

Dependency pinning (recommended)
- Pin `lint-staged` deliberately (at least major+minor, ideally exact) because this policy is sensitive to subtle behavioral changes across versions.
- Only upgrade `lint-staged` with an explicit review and validation run that exercises the failure modes this plan cares about (interruptions, partial staging, and no-stash invariants).

## Active tasks

None - this plan is historical/completed.

## Validation
- No-stash invariant:
  - After any failed/aborted run (lint error, typecheck error, SIGINT), `git stash list` is unchanged.
  - `.git/lint-staged_unstaged.patch` does not exist after aborted runs.
- Partial staging:
  - With a partially staged file, the guard aborts before lint-staged and nothing is stashed or auto-staged.
- Check-only hooks:
  - Intentionally trigger a lint failure and confirm the repo remains unchanged (`git diff` and `git diff --cached` are unchanged after the failed commit attempt).
- CI enforcement:
  - A PR with lint/typecheck failures cannot be merged to `main` due to required status checks.

## Risks and Mitigations
- Risk: `--no-stash` disables revert-on-error; if hooks mutate files, a failed hook can leave modified/staged files.
  - Mitigation: keep hooks check-only (no `--fix`) so failures leave no repo mutations to unwind.
- Risk: Partially staged files can lead to unstaged hunks being staged under `--no-stash` behavior.
  - Mitigation: mandatory partial-staging guard as a correctness gate.
- Risk: Developers rely on partial staging workflows.
  - Mitigation: provide guidance for splitting commits (separate files, temporary commit, or use branch-based workflows).

## Rollback
- Temporary unblock (local): set `SKIP_SIMPLE_GIT_HOOKS=1` to bypass hooks if a new guard breaks commits unexpectedly; restore once fixed.
- Revert (repo): revert the commits that changed `simple-git-hooks` / guard script / lint-staged config via a PR (use `git revert`, not resets).
- Scope reduction: if the guard is too aggressive, prefer tightening detection logic or messaging over removing the guard (partial staging remains a correctness risk under `--no-stash` behavior).

## Related Documents
- `AGENTS.md` (Git safety rules; no `--no-verify`)
- `docs/git-safety.md`
- `docs/git-hooks.md`
- `docs/RECOVERY-PLAN-2026-01-14.md`

## Completion Summary
- Pre-commit runs a mandatory partial-staging guard before `lint-staged --no-stash`, eliminating lint-staged backup stashes in the hook path.
- Hook tasks are check-only (no `--fix`), with `pnpm lint:staged` for debugging parity.
- Local `pre-push` runs `pnpm typecheck`; CI + `main` ruleset remains the authoritative enforcement point for merge gating.
