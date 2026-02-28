---
Type: Runbook
Status: Canonical
Domain: Repo
Last-reviewed: 2026-02-23
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
| Typecheck | `pnpm --filter <pkg> typecheck` |
| Lint | `pnpm --filter <pkg> lint` |
| Test feedback | `gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId')` |
| Validate all (local default) | `bash scripts/validate-changes.sh` |

## Validation Gate (Before Every Commit)

```bash
# Scope validation to changed packages only (preferred default).
pnpm --filter <pkg> typecheck && pnpm --filter <pkg> lint
# Default local gate (policy + typecheck + lint — no test execution):
bash scripts/validate-changes.sh
```

If multiple packages changed, run typecheck + lint for each affected package.

Only run full-repo `pnpm typecheck` / `pnpm lint` when:
- The user explicitly asks for a full validation, or
- The change is cross-cutting and impacts many packages, or
- A targeted run fails with a non-localized error and full validation is needed to diagnose.

**Rule:** Never commit code that fails validation. Fix first.

## Git Rules

- **No worktrees.** Base-Shop runs with a single checkout to avoid cross-worktree confusion.
- **Single writer.** With 1 human + up to 10 agents, only one process may write at a time.
  - Start an “integrator shell” before editing, committing, or pushing: `scripts/agents/integrator-shell.sh -- codex`
  - For long read-only discovery/planning/dry-run sessions, use guard-only mode (no writer lock): `scripts/agents/integrator-shell.sh --read-only -- codex`
  - Or open a locked shell: `scripts/agents/with-writer-lock.sh`
  - If you are running in a non-interactive environment (no TTY; e.g. CI or API-driven agents), you cannot open a subshell. Wrap each write-related command instead:
    - `scripts/agents/integrator-shell.sh -- <command> [args...]`
    - Wait mode is FIFO queue-ordered (first-come, first-served). In non-interactive agent runs, waiting is **poll-based** (**30s** checks) and **hard-stops after 5 minutes** with an error so the agent can report the issue (stale locks are auto-cleaned only when PID is dead on this host).
  - Check status: `scripts/git/writer-lock.sh status` (token is redacted by default)
  - Show full token (human only): `scripts/git/writer-lock.sh status --print-token`
  - If lock handling blocks your git write:
    - `scripts/git/writer-lock.sh status`
    - `scripts/git/writer-lock.sh clean-stale` (only if holder PID is dead on this host)
    - `scripts/agents/with-writer-lock.sh -- <git-write-command>` (or `scripts/agents/integrator-shell.sh -- <command>`)
  - Agents must not use `SKIP_WRITER_LOCK=1`; fix lock state instead
- **Branch flow:** `dev` → `staging` → `main`
  - Commit locally on `dev`
  - Ship `dev` to staging (PR + auto-merge): `scripts/git/ship-to-staging.sh`
  - Promote `staging` to production (PR + auto-merge): `scripts/git/promote-to-main.sh`
- **Commit every 30 minutes** or after completing any significant change
- **Push `dev` every 2 hours** (or every 3 commits) — GitHub is your backup

**Destructive / history-rewriting commands (agents: never):**
- `git reset --hard`, `git clean -fd`, `git push --force` / `-f`
- Also treat these as forbidden: `git checkout -- .` / `git restore .`, **any bulk discard** via `git checkout -- <pathspec...>` or `git restore -- <pathspec...>` (multiple files, directories, or globs), `git stash` mutations (`push` / `pop` / `apply` / `drop` / `clear`, including bare `git stash`), `git rebase` (incl. `-i`), `git commit --amend`

If one of these commands seems necessary, STOP and ask for help. Full guide: [docs/git-safety.md](docs/git-safety.md)

## Testing Rules

- **Tests run in CI only.** Do not run Jest or e2e commands locally. Push to `dev` and watch CI for results.
- **CI feedback:** `gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId')`
- **GitHub Actions is source of truth for required tests:** rely on CI/merge-gate for test pass/fail gating.
- **ESM vs CJS in Jest (CI debugging):** If CI fails with ESM parsing errors (`Cannot use import statement outside a module` or `import.meta` issues), add `JEST_FORCE_CJS=1` to the CI command to force the CommonJS preset.

Full policy: [docs/testing-policy.md](docs/testing-policy.md)

## Task Workflow

1. Check active plans in `docs/plans/` or `IMPLEMENTATION_PLAN.md`
   - If the user asked for a plan and no relevant Plan doc exists, create one (see “Plan Documentation”) before proceeding.
2. Pick one task (atomic, single focus)
3. Study relevant files before editing
4. Implement → Validate → Commit
5. Mark task complete, move to next

**Feature workflow**: `/lp-do-fact-find` → `/lp-do-plan` → `/lp-do-build` → `/lp-do-replan` (when tasks are below execution threshold, blocked, or scope shifts)

**Idea generation**: `/lp-do-idea-generate` — Cabinet Secretary sweep that generates, filters, prioritizes business ideas and seeds lp-do-fact-find docs. Feeds into the feature workflow above.
- Full pipeline: `/lp-do-idea-generate` → `/lp-do-fact-find` → `/lp-do-plan` → `/lp-do-build`
- Spec: `.claude/skills/idea-generate/SKILL.md`
- Stances: `--stance=improve-data` (default) or `--stance=grow-business` (activates traction mode for market-facing L1-L2 businesses)
- Shared personas: `.claude/skills/_shared/cabinet/` (filter, prioritizer, dossier template, lens files)

Skills live in `.claude/skills/<name>/SKILL.md`. Claude Code auto-discovers them; Codex reads them directly.
For diagnostic and utility tool skills, see the index at `.claude/skills/tools-index.md`.
For a short entrypoint into the workflow (progressive disclosure), see `docs/agents/feature-workflow-guide.md`.

## Skills

Skills live in `.claude/skills/<name>/SKILL.md` (Claude Code auto-discovers; Codex discovers via `.agents/skills/` mirror).
Discover all skills: `scripts/agents/list-skills` or Codex `/skills`.
For tool/utility skill index: `.claude/skills/tools-index.md`.
For workflow entrypoint: `docs/agents/feature-workflow-guide.md`.

## Plan Confidence Policy

In plan docs, use **confidence** / **Overall-confidence** for plan confidence values.

- **Confidence ≥90 is a motivation, not a quota.** Do not "raise confidence" by deleting planned work or narrowing scope without an explicit user decision.
- **How to raise confidence credibly:** add evidence (file references, call-site maps), add/strengthen tests, run targeted validations, or add a small SPIKE/INVESTIGATE task to remove uncertainty.
- **If confidence <90:** keep the work, but add a clear **"What would make this ≥90%"** section (concrete actions/evidence that would raise confidence).
- **Build gates:**
  - `IMPLEMENT` and `SPIKE` tasks require **≥80%** confidence and must be unblocked.
  - `INVESTIGATE` tasks require **≥60%** confidence and must be unblocked.
  - `CHECKPOINT` is procedural and handled by `/lp-do-build` checkpoint contract.
  - If below threshold, stop and run `/lp-do-replan`.

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
| `git status` confusing / lost commits | ops-git-recover | `.claude/skills/ops-git-recover/SKILL.md` |
| `ERESOLVE` / peer dependency errors | code-fix-deps | `.claude/skills/code-fix-deps/SKILL.md` |

### When to Ask vs. When to Load Context

| Situation | Action |
|-----------|--------|
| Error matches a trigger in manifest | Load the skill, try the fix |
| Error is unclear after reading skill | Ask user with context from skill |
| No matching skill exists | Ask user, then consider creating skill |
| Ambiguous user intent | Ask user for clarification |

## User-Facing Step-by-Step Standard (Required)

When the user asks for setup help, manual operations, or any "step-by-step" guidance, instructions must be executable without interpretation.

### Hard requirements for every procedural step

Each step must include all of the following sections:

1. `DO` — exact action and click path
   - Include exact URLs to open
   - Include exact menu/button path (for example: `Settings -> Environments -> production -> Variables`)
2. `SAVE` — exact output artifact
   - Exact filename(s), destination folder/path, or field value to record
3. `DONE WHEN` — objective completion check
   - Observable state that confirms success
4. `IF BLOCKED` — fallback path
   - What to do if UI labels differ, permissions are missing, or the control is unavailable

### Non-negotiable quality rules

- Never provide output filenames without explicit actions to produce them.
- Never use vague verbs like "review", "update", or "check" without exact click path and expected result.
- Always include copy/paste-ready URLs for external tools or dashboards.
- When text must be entered, provide exact text in a copy block.
- When evidence is required, list the complete required artifact set and destination path.
- If sequence matters, state strict order and do-not-skip dependencies.

### Required response template for procedural guidance

Use this structure in user-facing instructions:

```md
### Step <N> — <Outcome>
DO:
1. Open: <URL>
2. Click: <exact path>
3. Enter: <exact value>

SAVE:
- <filename-or-value> -> <destination path>

DONE WHEN:
- <observable success condition>

IF BLOCKED:
- <fallback action>
```

If any required section above is missing, the instructions are incomplete.

## Plan Documentation

- **Current / maintained plans** live in `docs/plans/` (or the domain’s plan directory like `docs/cms-plan/`) and should follow canonical path `docs/plans/<slug>/plan.md` (legacy flat path is read-only compatibility).
- **Completed plans** keep `Status: Complete`; they may remain in place or be moved to `docs/plans/archive/` as storage policy, while keeping `Status: Complete`.
- **Superseded plans** live in `docs/historical/plans/` (or the domain’s historical directory).
- **When superseding a plan (v2, rewrites, etc.)**
  - Prefer keeping the *canonical* plan path stable (create the new plan under the original name in `docs/plans/`).
  - Move the prior plan to `docs/historical/plans/` and update its header to `Status: Superseded`.
  - Add a forward pointer in the superseded plan header: `Superseded-by: <path-to-new-plan>`.
  - If you must disambiguate filenames, append a date (preferred) like `-superseded-YYYY-MM-DD` rather than adding `-v2` to the current plan.
- Required metadata: Type, Status, Domain, Last-reviewed, Relates-to charter
- **When the user asks for a plan:** the plan must be persisted as a Plan doc (not just chat output). If no relevant Plan doc exists (or it's not in Plan format), create/update one in the most appropriate location (default: `docs/plans/<slug>/plan.md`; CMS threads may use their domain plan directory) and populate it with the planning/audit results (summary, tasks, acceptance criteria, risks).

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

- PRs are pipeline artifacts:
  - `dev` → `staging` is shipped via PR + auto-merge (`scripts/git/ship-to-staging.sh`).
  - `staging` → `main` is promoted via PR + auto-merge (`scripts/git/promote-to-main.sh`).
- Keep PR green and mergeable — fix CI failures promptly
- **Never merge directly to `main`** — always use PR workflow
- All CI checks must pass before auto-merge
- Reviews are optional; no approval required for merge

## File Boundaries

- Target ≤350 lines per file (planning documents are exempt)
- Read before editing
- Study existing patterns before adding code

## Multi-Agent Environment

Base-Shop supports multiple agents working concurrently. The writer lock system ensures only one agent writes at a time, but you may encounter:

- **Expected:** Files, commits, or branches created by other agents or the user
- **Expected:** Uncommitted changes from another agent currently holding the writer lock
- **Normal operation:** Pull the latest changes with `git fetch origin && git pull --ff-only origin dev` before starting work

When to STOP and ask:
- Git state is internally inconsistent (conflicts, detached HEAD, corrupt objects)
- You're asked to perform work that conflicts with visible uncommitted changes
- Merge conflicts appear that you cannot safely resolve
- Branch structure doesn't match expected flow (`dev -> staging -> main`)

When to proceed normally:
- Files exist that you didn't create (other agents' work)
- Recent commits from other agents on `dev`
- Untracked files outside your work scope
- Unrelated modified files in the working tree that do not conflict with your task
- Files deleted, moved, or renamed by another agent that you were **not** working on

Prompting policy for shared worktrees:
- Do **not** pause to ask for confirmation solely because unrelated/untracked files appeared.
- Do **not** pause to ask for confirmation because files you were **not** working on were deleted or moved by another agent. Stay calm and proceed.
- Continue by default and keep your commit scope limited to files required for the current task.
- **One exception — own-file deletion:** if a file you were actively editing in the current session has been deleted by another agent, flag it to the user before continuing. Do not flag deletions of files you never touched.

## Quick Reference

| Scenario | Action |
|----------|--------|
| Git state internally inconsistent | STOP. Run `git status`, share output, ask user |
| Files/commits from other agents | Normal — pull latest and proceed |
| Files deleted/moved by another agent (files you weren't working on) | Normal — ignore, proceed |
| File deleted by another agent that you were actively editing | FLAG to user, then stop |
| Tests failing | Fix before commit. Never skip validation |
| Need to undo | Use `git revert`, never `reset --hard` |
| Large-scale fix needed | Create plan in `docs/plans/`, don't take shortcuts |
| User asks for "step-by-step" help | Use mandatory `DO`/`SAVE`/`DONE WHEN`/`IF BLOCKED` format with exact URLs and click paths |
| MCP TypeScript intelligence | See `docs/ide/agent-language-intelligence-guide.md` |
| Asked to check types | Use MCP TypeScript tools first; run `pnpm --filter <pkg> typecheck` for affected packages (full `pnpm typecheck` only if explicitly requested) |

## Session Reflection (Optional)

After completing significant work, consider capturing learnings to improve future agent work.

**When to reflect:**
- Completed a multi-task plan
- Resolved unexpected problems with novel solutions
- Discovered gaps in documentation or skills

**How to reflect:**
1. Use `/tools-meta-reflect` (or read `.claude/skills/tools-meta-reflect/SKILL.md`)
2. Follow the skill workflow: identify friction, classify by layer, propose atomic changes to existing docs/skills
3. All improvements go into existing target files — no separate learnings store

**Privacy:** Never include customer data, secrets, or PII in documentation updates.

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
