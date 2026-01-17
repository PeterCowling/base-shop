---
Type: Plan
Status: Active
Domain: Repo
Created: 2026-01-16
Created-by: Codex
Last-updated: 2026-01-17
Last-updated-by: Codex
Last-reviewed: 2026-01-17
Relates-to charter: none (repo tooling)
---

# Lint-staged Autostash Avoidance Plan

## Problem
Pre-commit runs `lint-staged`. By default, lint-staged creates an `automatic lint-staged backup` stash before running tasks so it can revert on errors. Timeouts/interrupts (SIGINT, crashes) can leave this stash behind even when there are no partially staged files, creating confusing repo state and a real "lost work" footgun.

We want a hook workflow that never creates a lint-staged backup stash ("no autostash ever") while remaining safe and predictable.

## Key lint-staged behaviors (v15.2.0+)
- Default behavior: creates a backup stash and attempts to revert on errors.
- `--no-stash`: disables the backup stash and does not revert in case of errors. It also implies `--no-hide-partially-staged`.
- Safety implication: with `--no-stash`, partially staged files are dangerous because lint-staged will not hide unstaged hunks; tasks that modify files (e.g. `eslint --fix`) can end up staging/committing unintended hunks.

## Goals
- Ensure pre-commit creates no `automatic lint-staged backup` stash in any outcome (success, lint error, timeout, SIGINT).
- Make partially staged files a hard error before lint-staged runs.
- Enforce "lint + typecheck must pass before GitHub integration" using CI-required checks; optionally add local hooks as best-effort early feedback.

## Non-goals
- Claiming pre-commit can universally prevent pushes with failing commits (hooks are bypassable with `--no-verify` or by pushing from environments without hooks).
- Disabling lint rules or lowering lint coverage.
- Running monorepo-wide lint/typecheck in pre-commit (keep pre-commit fast).
- Changing unrelated Git safety rules.

## Current State
- Root `simple-git-hooks` runs `pnpm exec ... lint-staged` on `pre-commit`.
- Root `lint-staged` config runs `eslint --fix --max-warnings=0 ...` on staged JS/TS files.
- `lint-staged` is currently resolved to `15.5.2` (declared as `^15.2.10`).

## Proposed Approach
### Local hooks (best-effort)
1. Pre-commit guard (required correctness gate)
   - Detect any partially staged paths (present in both staged and unstaged diffs) using NUL-delimited git output.
   - If any exist: abort with an actionable message and do not run lint-staged.
2. Run lint-staged with stash disabled
   - Use `pnpm exec lint-staged --no-stash`.
   - Treat the changed failure semantics as deliberate: if tasks modify files and the hook fails later, the repo may be left modified (no automatic revert).
3. Decide fix vs check-only behavior (must be explicit)
   - Recommended: make the hook check-only (remove `--fix`) and provide explicit `pnpm lint:fix` / `pnpm lint:staged:fix` commands.
   - Alternative: keep `--fix`, but document that failures can leave changes staged and require the developer to review/re-run.

### CI + branch protection (authoritative)
- Run `pnpm lint` and `pnpm typecheck` in GitHub Actions on PRs.
- Require those checks in the GitHub `main` ruleset so merges to `main` cannot happen unless lint and typecheck pass.

(Optional) Pre-push
- Add `pre-push` hook to run `pnpm typecheck` (or a scoped/cached variant) to catch failures before pushing; note it is still bypassable.

## Implementation Tasks
1. Document lint-staged semantics in this plan (backup stash default, `--no-stash` "no revert on error", and the implied `--no-hide-partially-staged`).
2. Add a pre-commit partial-staging guard script:
   - Use `git diff --name-only -z --cached` and `git diff --name-only -z` (or porcelain v2 `-z`) to correctly handle spaces and edge cases.
   - Abort before lint-staged with a message explaining why partial staging is blocked (prevents unstaged hunks being committed under `--no-stash`).
3. Update the pre-commit hook:
   - Run the guard first.
   - Run `pnpm exec lint-staged --no-stash`.
4. Add developer commands:
   - `pnpm lint:staged` mirrors hook behavior.
   - If moving to check-only: add `pnpm lint:staged:fix` and/or `pnpm lint:fix` for explicit auto-fix.
5. Add/confirm CI enforcement:
   - Ensure a workflow runs `pnpm lint` and `pnpm typecheck`.
   - Update branch protection/rulesets to require those checks for merging to `main`.
6. Update docs:
   - Developer docs: explain "no partial staging" rule, `--no-stash` tradeoffs, and recovery guidance (what to do if the hook leaves changes).
   - `AGENTS.md`: note the hard partial-staging guard is required for correctness under `--no-stash`.

## Validation
- No-stash invariant:
  - After any failed/aborted run (lint error, typecheck error, SIGINT), `git stash list` shows no new `automatic lint-staged backup` entries.
  - No leftover lint-staged temp artifacts under `.git/` after aborted runs.
- Partial staging:
  - With a partially staged file, the guard aborts before lint-staged and nothing is stashed or auto-staged.
- Failure semantics clarity:
  - If using `--fix`, intentionally trigger a later failure and confirm the repo is left in a predictable state (document expected `git status` output and next steps).
- CI enforcement:
  - A PR with lint/typecheck failures cannot be merged to `main` due to required status checks.

## Risks and Mitigations
- Risk: `--no-stash` disables revert-on-error; a failed hook can leave modified/staged files.
  - Mitigation: prefer check-only in hooks, or clearly document the "fix then re-run commit" workflow.
- Risk: `--no-stash` implies `--no-hide-partially-staged`; partially staged files can lead to unstaged hunks being committed.
  - Mitigation: mandatory partial-staging guard as a correctness gate.
- Risk: Developers rely on partial staging workflows.
  - Mitigation: provide guidance for splitting commits (separate files, temporary commit, or use branch-based workflows).

## Open Questions
- Do we want pre-commit to be check-only (recommended) or keep `eslint --fix`?
- Where should typecheck run locally (pre-push only, or also pre-commit for stricter gating)?
- Should we pin `lint-staged` to an exact version to avoid behavior changes in future minors?
