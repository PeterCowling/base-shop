---
Type: Runbook
Status: Canonical
Domain: Repo
Last-reviewed: 2026-01-20
---

# AGENTS.md — Operational Runbook

This is the universal runbook for AI agents (Claude, Codex, etc.) working in Base-Shop.

## No Shortcuts — Core Principle

**Always do what's best for the long term. Never take a convenient shortcut that creates tech debt.**

This applies to all decisions: architecture, implementation, testing, error handling, naming, documentation. When faced with a choice between "quick fix" and "proper solution," choose the proper solution.

Examples of prohibited shortcuts:
- Suppressing type errors instead of fixing root causes
- Skipping tests to ship faster
- Copy-pasting code instead of extracting shared logic
- Hardcoding values that should be configurable
- Adding `// TODO: fix later` without a plan to actually fix it
- Ignoring edge cases because "it probably won't happen"
- Using `any` types to silence TypeScript
- Commenting out broken code instead of removing/fixing it

**The only exception:** The user explicitly instructs you to take a shortcut. If you're uncertain whether something constitutes acceptable pragmatism vs. tech debt, **ask the user** before proceeding.

When you identify that the "right" solution requires significantly more work, explain the tradeoff and let the user decide — don't silently choose the shortcut.

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

Planning prompt: `.agents/skills/workflows/plan-feature.md`
Building prompt: `.agents/skills/workflows/build-feature.md`

**Skill system**: See `.agents/README.md` for the full skill catalog and usage guide.

## Progressive Context Loading

When you encounter errors or unfamiliar situations, load additional context on-demand rather than asking immediately.

### Protocol

1. **Check the manifest first**: `.agents/skills/manifest.yaml` lists skills with `triggers` — error patterns that indicate when a skill is relevant
2. **Match your error to triggers**: If you see an error like `Cannot use import statement outside a module`, search the manifest for matching triggers
3. **Load the skill**: Read the corresponding skill file (e.g., `.agents/skills/testing/jest-esm-issues.md`)
4. **Follow the workflow**: Each skill has step-by-step instructions

### Example

```
Error: Cannot use import statement outside a module
```

1. Search manifest → find `jest-esm-issues` skill with matching trigger
2. Read `.agents/skills/testing/jest-esm-issues.md`
3. Apply the fix: `JEST_FORCE_CJS=1 pnpm --filter <pkg> test -- path/to/file.test.ts`

### Available Troubleshooting Skills

| Error Pattern | Skill | Location |
|---------------|-------|----------|
| `Cannot use import statement outside a module` | jest-esm-issues | `.agents/skills/testing/jest-esm-issues.md` |
| `git status` confusing / lost commits | git-recovery | `.agents/skills/safety/git-recovery.md` |
| `ERESOLVE` / peer dependency errors | dependency-conflicts | `.agents/skills/domain/dependency-conflicts.md` |

### When to Ask vs. When to Load Context

| Situation | Action |
|-----------|--------|
| Error matches a trigger in manifest | Load the skill, try the fix |
| Error is unclear after reading skill | Ask user with context from skill |
| No matching skill exists | Ask user, then consider creating skill |
| Ambiguous user intent | Ask user for clarification |

## Plan Documentation

- Plans live in `docs/plans/<name>-plan.md`
- Never delete — archive to `docs/historical/plans/`
- Required metadata: Type, Status, Domain, Last-reviewed, Relates-to charter
- **When the user asks for a plan:** the plan must be persisted as a Plan doc (not just chat output). If no relevant Plan doc exists (or it's not in Plan format), create/update one in the most appropriate location (default: `docs/plans/`; CMS threads: `docs/cms-plan/`) and populate it with the planning/audit results (summary, tasks, acceptance criteria, risks).

### Handling Audit Limits

When audit/exploration work hits a limit (context, time, scope), **do not simply stop**:

1. **Pause and document** — Add a `## Pending Audit Work` section to the plan
2. **Be specific** — Include enough detail to accelerate resumption:
   - Areas/files already examined
   - Areas remaining unexplored
   - Specific questions needing answers
   - Search patterns or entry points for resumption
3. **Mark partial findings** — Tag incomplete items with `(partial)` or `(needs-verification)`
4. **Estimate remaining scope** — e.g., "~15 more files" or "3 subsystems"

This ensures future sessions pick up efficiently rather than re-auditing completed work.

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

## Session Reflection (Optional)

After completing significant work, consider capturing learnings to improve future agent work.

**When to reflect:**
- Completed a multi-task plan
- Resolved unexpected problems with novel solutions
- Discovered gaps in documentation or skills

**How to reflect:**
1. Read `.agents/skills/workflows/session-reflection.md`
2. Create a learning file in `.agents/learnings/`
3. Note problems, patterns that worked, skill gaps, tooling ideas

**Privacy:** Learnings are gitignored. Never include customer data, secrets, or PII.

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
