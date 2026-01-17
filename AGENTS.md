---
Type: Runbook
Status: Canonical
Domain: Repo
Last-reviewed: 2026-01-17
---

# AGENTS.md — Operational Runbook

This is the universal runbook for AI agents (Claude, Codex, etc.) working in Base-Shop.

## Commands

| Task | Command |
|------|---------|
| Install | `pnpm install` |
| Build | `pnpm build` |
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Test (single file) | `pnpm --filter <pkg> test -- path/to/file.test.ts` |
| Test (pattern) | `pnpm --filter <pkg> test -- --testPathPattern="name"` |
| Validate all | `bash scripts/validate-changes.sh` |

## Validation Gate (Before Every Commit)

```bash
pnpm typecheck && pnpm lint
# Plus: targeted tests for changed files (see scripts/validate-changes.sh)
```

**Rule:** Never commit code that fails validation. Fix first.

## Git Rules

- Work on `work/*` branches only — never commit to `main`
- For parallel work: **one worktree per agent/human** (`scripts/git/new-worktree.sh <label>`)
- **Commit every 30 minutes** or after completing any significant change
- **Push every 2 hours** (or every 3 commits) — GitHub is your backup

**Destructive commands:**
- **Agents:** MUST NOT run `git reset --hard`, `git clean -fd`, `git push --force`
- **Humans:** Avoid; if required, follow procedure in [docs/git-safety.md](docs/git-safety.md)

Full guide: [docs/git-safety.md](docs/git-safety.md)

## Testing Rules

- **Always use targeted tests** — single file or pattern
- **Never run `pnpm test` unfiltered** — spawns too many workers
- **Limit workers:** `--maxWorkers=2` for broader runs
- **Check for orphans first:** `ps aux | grep jest | grep -v grep`
- **ESM vs CJS in Jest:** If a test or imported file fails with ESM parsing errors (for example, `Cannot use import statement outside a module` or `import.meta` issues), rerun that test with `JEST_FORCE_CJS=1` to force the CommonJS preset and avoid ESM transform gaps.

Full policy: [docs/testing-policy.md](docs/testing-policy.md)

## Task Workflow

1. Check active plans in `docs/plans/` or `IMPLEMENTATION_PLAN.md`
   - If the user asked for a plan and no relevant Plan doc exists, create one (see “Plan Documentation”) before proceeding.
2. Pick one task (atomic, single focus)
3. Study relevant files before editing
4. Implement → Validate → Commit
5. Mark task complete, move to next

Planning prompt: `.claude/prompts/plan-feature.md`
Building prompt: `.claude/prompts/build-feature.md`

## Plan Documentation

- Plans live in `docs/plans/<name>-plan.md`
- Never delete — archive to `docs/historical/plans/`
- Required metadata: Type, Status, Domain, Last-reviewed, Relates-to charter
- **When the user asks for a plan:** the plan must be persisted as a Plan doc (not just chat output). If no relevant Plan doc exists (or it’s not in Plan format), create/update one in the most appropriate location (default: `docs/plans/`; CMS threads: `docs/cms-plan/`) and populate it with the planning/audit results (summary, tasks, acceptance criteria, risks).

Schema: [docs/AGENTS.docs.md](docs/AGENTS.docs.md)

## Pull Requests & CI

- PRs are zero-touch: auto-open on `work/*` push, labeled `zero-touch`, auto-merge on green, auto-close on failing checks or staleness (add `keep-open` to skip auto-close)
- If auto-open fails, create PR manually (`gh pr create --fill`) and enable auto-merge (`gh pr merge --auto --squash --delete-branch`)
- Keep PR green and mergeable — fix CI failures promptly
- **Never merge directly to `main`** — always use PR workflow
- All CI checks must pass before auto-merge
- Reviews are optional; no approval required for merge

## File Boundaries

- Target ≤350 lines per file (planning documents are exempt)
- Read before editing
- Study existing patterns before adding code

## Quick Reference

| Scenario | Action |
|----------|--------|
| Git state confusing | STOP. Run `git status`, share output, ask user |
| Tests failing | Fix before commit. Never skip validation |
| Need to undo | Use `git revert`, never `reset --hard` |
| Large-scale fix needed | Create plan in `docs/plans/`, don't take shortcuts |

---

## Detailed Documentation

For comprehensive guidance, see:

| Topic | Location |
|-------|----------|
| Git safety (full rules) | [docs/git-safety.md](docs/git-safety.md) |
| Git hooks | [docs/git-hooks.md](docs/git-hooks.md) |
| Testing policy | [docs/testing-policy.md](docs/testing-policy.md) |
| Plan metadata schema | [docs/AGENTS.docs.md](docs/AGENTS.docs.md) |
| Incident details | [docs/RECOVERY-PLAN-2026-01-14.md](docs/RECOVERY-PLAN-2026-01-14.md) |
| Incident prevention | [docs/incident-prevention.md](docs/incident-prevention.md) |

**Previous version:** [docs/historical/AGENTS-2026-01-17-pre-ralph.md](docs/historical/AGENTS-2026-01-17-pre-ralph.md)
