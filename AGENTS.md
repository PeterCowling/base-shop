---
Type: Runbook
Status: Canonical
Domain: Repo
Last-reviewed: 2026-02-01
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

## Validation Gates

```bash
# Checkpoint commits: rely on pre-commit (staged lint + affected typecheck).
# Before pushing:     pre-push enforces `pnpm typecheck && pnpm lint`.
```

**Rule:** Never push code that fails validation. Fix first.

## Git Rules

- Work on `work/*` branches only — never commit to `main`
- For parallel work: **one worktree per agent/human** (`scripts/git/new-worktree.sh <label>`)
- If you operate in the **main checkout** (not recommended), acquire the writer lock first (`scripts/agents/with-writer-lock.sh`). Commits/pushes are blocked otherwise.
- **Commit every 30 minutes** or after completing any significant change
- **Push every 2 hours** (or every 3 commits) — GitHub is your backup

**Destructive / history-rewriting commands (agents: never):**
- `git reset --hard`, `git clean -fd`, `git push --force` / `-f`
- Also treat these as forbidden: `git checkout -- .` / `git restore .`, `git stash drop` / `git stash clear`, `git rebase` (incl. `-i`), `git commit --amend`

If one of these commands seems necessary, STOP and ask for help. Full guide: [docs/git-safety.md](docs/git-safety.md)

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

**Feature workflow**: `/fact-find` → `/plan-feature` → `/build-feature` → `/re-plan` (if confidence <80%)

Skills live in `.claude/skills/<name>/SKILL.md`. Claude Code auto-discovers them; Codex reads them directly.
For a short entrypoint into the workflow (progressive disclosure), see `docs/agents/feature-workflow-guide.md`.

## Confidence Index (CI) Policy (Planning)

In plan docs, **CI** means **Confidence Index** (plan confidence), not CI/CD.

- **CI ≥90 is a motivation, not a quota.** Do not “raise CI” by deleting planned work or narrowing scope without an explicit user decision.
- **How to raise CI credibly:** add evidence (file references, call-site maps), add/strengthen tests, run targeted validations, or add a small spike/INVESTIGATE task to remove uncertainty.
- **If CI <90:** keep the work, but add a clear **“What would make this ≥90%”** section (concrete actions/evidence that would raise confidence).
- **Build gate still applies:** `/build-feature` only proceeds on **IMPLEMENT** tasks that are **≥80%** confidence and unblocked. If <80%, stop and `/re-plan`.

## Progressive Context Loading

When you encounter errors or unfamiliar situations, load additional context on-demand rather than asking immediately.

### Protocol

1. **Check available skills**: Skills live in `.claude/skills/<name>/SKILL.md` — each has a `description` field listing when to use it
2. **Match your error to a skill**: If you see a relevant error pattern, read the corresponding skill
3. **Follow the workflow**: Each skill has step-by-step instructions

### Example

```
Error: Cannot use import statement outside a module
```

1. Read `.claude/skills/jest-esm-issues/SKILL.md`
2. Apply the fix: `JEST_FORCE_CJS=1 pnpm --filter <pkg> test -- path/to/file.test.ts`

### Available Troubleshooting Skills

| Error Pattern | Skill | Location |
|---------------|-------|----------|
| `Cannot use import statement outside a module` | jest-esm-issues | `.claude/skills/jest-esm-issues/SKILL.md` |
| `git status` confusing / lost commits | git-recovery | `.claude/skills/git-recovery/SKILL.md` |
| `ERESOLVE` / peer dependency errors | dependency-conflicts | `.claude/skills/dependency-conflicts/SKILL.md` |

### When to Ask vs. When to Load Context

| Situation | Action |
|-----------|--------|
| Error matches a trigger in manifest | Load the skill, try the fix |
| Error is unclear after reading skill | Ask user with context from skill |
| No matching skill exists | Ask user, then consider creating skill |
| Ambiguous user intent | Ask user for clarification |

## Plan Documentation

- **Current / maintained plans** live in `docs/plans/` (or the domain’s plan directory like `docs/cms-plan/`) and should follow `docs/plans/<name>-plan.md`.
- **Completed (but still useful) plans** live in `docs/plans/archive/`.
- **Superseded plans** live in `docs/historical/plans/` (or the domain’s historical directory).
- **When superseding a plan (v2, rewrites, etc.)**
  - Prefer keeping the *canonical* plan path stable (create the new plan under the original name in `docs/plans/`).
  - Move the prior plan to `docs/historical/plans/` and update its header to `Status: Superseded`.
  - Add a forward pointer in the superseded plan header: `Superseded-by: <path-to-new-plan>`.
  - If you must disambiguate filenames, append a date (preferred) like `-superseded-YYYY-MM-DD` rather than adding `-v2` to the current plan.
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
| MCP TypeScript intelligence | See `docs/ide/agent-language-intelligence-guide.md` |
| Asked to check types | Use MCP TypeScript tools first; `pnpm typecheck` remains the validation gate |

## Session Reflection (Optional)

After completing significant work, consider capturing learnings to improve future agent work.

**When to reflect:**
- Completed a multi-task plan
- Resolved unexpected problems with novel solutions
- Discovered gaps in documentation or skills

**How to reflect:**
1. Use `/session-reflection` (or read `.claude/skills/session-reflection/SKILL.md`)
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
| Business OS charter | [docs/business-os/business-os-charter.md](docs/business-os/business-os-charter.md) |
| Incident details | [docs/historical/RECOVERY-PLAN-2026-01-14.md](docs/historical/RECOVERY-PLAN-2026-01-14.md) |
| Incident prevention | [docs/incident-prevention.md](docs/incident-prevention.md) |

**Previous version:** [docs/historical/AGENTS-2026-01-17-pre-ralph.md](docs/historical/AGENTS-2026-01-17-pre-ralph.md)
