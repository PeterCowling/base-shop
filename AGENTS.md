---
Type: Runbook
Status: Canonical
Domain: Repo
Last-reviewed: 2026-02-13
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
| Test (single file) | `pnpm --filter <pkg> test -- path/to/file.test.ts` |
| Test (pattern) | `pnpm --filter <pkg> test -- --testPathPattern="name"` |
| Validate all | `bash scripts/validate-changes.sh` |

## Validation Gate (Before Every Commit)

```bash
# Scope validation to changed packages only (preferred default).
pnpm --filter <pkg> typecheck && pnpm --filter <pkg> lint
# Plus: targeted tests for changed files (see scripts/validate-changes.sh)
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
    - Wait mode is FIFO queue-ordered (first-come, first-served) and waits forever by default; pass `--timeout <sec>` only when you explicitly want fast-fail behavior.
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

**Feature workflow**: `/lp-fact-find` → `/lp-plan` → `/lp-build` → `/lp-replan` (if confidence <80%)

**Idea generation**: `/idea-generate` — Cabinet Secretary sweep that generates, filters, prioritizes business ideas and seeds lp-fact-find docs. Feeds into the feature workflow above.
- Full pipeline: `/idea-generate` → `/lp-fact-find` → `/lp-plan` → `/lp-build`
- Spec: `.claude/skills/idea-generate/SKILL.md`
- Stances: `--stance=improve-data` (default) or `--stance=grow-business` (activates traction mode for market-facing L1-L2 businesses)
- Shared personas: `.claude/skills/_shared/cabinet/` (filter, prioritizer, dossier template, lens files)

Skills live in `.claude/skills/<name>/SKILL.md`. Claude Code auto-discovers them; Codex reads them directly.
For a short entrypoint into the workflow (progressive disclosure), see `docs/agents/feature-workflow-guide.md`.

## Skills

A skill is a local instruction set stored in `.claude/skills/<name>/SKILL.md`.

### Available `lp-*` skills

- `lp-baseline-merge`: Join startup-loop fan-out outputs into a baseline snapshot/manifest at S4. (file: `.claude/skills/lp-baseline-merge/SKILL.md`)
- `lp-brand-bootstrap`: Bootstrap `brand-language.user.md` for a business entering the startup loop. (file: `.claude/skills/lp-brand-bootstrap/SKILL.md`)
- `lp-build`: Execute approved plan tasks with confidence gating and required validation. (file: `.claude/skills/lp-build/SKILL.md`)
- `lp-channels`: Build startup channel strategy + GTM plan from offer outputs. (file: `.claude/skills/lp-channels/SKILL.md`)
- `lp-design-qa`: Audit implemented UI against design spec/system, accessibility, and responsiveness. (file: `.claude/skills/lp-design-qa/SKILL.md`)
- `lp-design-spec`: Convert requirements into concrete frontend design specs mapped to design tokens/system. (file: `.claude/skills/lp-design-spec/SKILL.md`)
- `lp-design-system`: Apply design tokens/system patterns correctly and avoid arbitrary UI values. (file: `.claude/skills/lp-design-system/SKILL.md`)
- `lp-experiment`: Run startup experiment design/readout workflow for S8/S10 build-measure-decide loops. (file: `.claude/skills/lp-experiment/SKILL.md`)
- `lp-fact-find`: Gather evidence/context before planning or as a standalone briefing. (file: `.claude/skills/lp-fact-find/SKILL.md`)
- `lp-forecast`: Produce startup 90-day P10/P50/P90 scenario forecasts. (file: `.claude/skills/lp-forecast/SKILL.md`)
- `lp-guide-audit`: Run English-guide SEO audit and iterative fixes. (file: `.claude/skills/lp-guide-audit/SKILL.md`)
- `lp-guide-improve`: Entry point for guide improvement workflow (audit, translation, or both). (file: `.claude/skills/lp-guide-improve/SKILL.md`)
- `lp-launch-qa`: Run pre-launch QA gate for startup loop readiness (conversion, SEO, performance, legal). (file: `.claude/skills/lp-launch-qa/SKILL.md`)
- `lp-measure`: Bootstrap startup measurement infrastructure pre-launch or post-launch. (file: `.claude/skills/lp-measure/SKILL.md`)
- `lp-offer`: Build startup offer artifact (ICP, positioning, pricing, objections). (file: `.claude/skills/lp-offer/SKILL.md`)
- `lp-onboarding-audit`: Audit product onboarding using the "Onboarding Done Right" checklist and produce a planning-ready brief. (file: `.claude/skills/lp-onboarding-audit/SKILL.md`)
- `lp-plan`: Create confidence-gated execution plans and auto-continue to build when eligible. (file: `.claude/skills/lp-plan/SKILL.md`)
- `lp-prioritize`: Rank startup go-items and select top priorities to pursue. (file: `.claude/skills/lp-prioritize/SKILL.md`)
- `lp-readiness`: Run startup preflight gate before offer-building. (file: `.claude/skills/lp-readiness/SKILL.md`)
- `lp-refactor`: Refactor React components for maintainability, performance, and pattern quality. (file: `.claude/skills/lp-refactor/SKILL.md`)
- `lp-replan`: Resolve low-confidence plan tasks with additional evidence and decisions. (file: `.claude/skills/lp-replan/SKILL.md`)
- `lp-seo`: Produce phased SEO strategy (keywords, clusters, SERP, technical, snippets). (file: `.claude/skills/lp-seo/SKILL.md`)
- `lp-sequence`: Topologically sequence/renumber plan tasks and dependency metadata. (file: `.claude/skills/lp-sequence/SKILL.md`)
- `lp-site-upgrade`: Create layered website-upgrade strategy and `lp-fact-find` handoff packet. (file: `.claude/skills/lp-site-upgrade/SKILL.md`)

### How to use `lp-*` skills

- Trigger rule: if a user asks for a specific `lp-*` skill (for example `/lp-plan`) or the task clearly matches one above, load that skill file and follow it.
- Progressive loading: read only the needed sections first; load referenced files on-demand.
- Path resolution: resolve relative paths from the skill directory before trying alternatives.
- Reuse over rewrite: prefer referenced templates/scripts/assets shipped with the skill.

## Confidence Index (CI) Policy (Planning)

In plan docs, **CI** means **Confidence Index** (plan confidence), not CI/CD.

- **CI ≥90 is a motivation, not a quota.** Do not "raise CI" by deleting planned work or narrowing scope without an explicit user decision.
- **How to raise CI credibly:** add evidence (file references, call-site maps), add/strengthen tests, run targeted validations, or add a small spike/INVESTIGATE task to remove uncertainty.
- **If CI <90:** keep the work, but add a clear **"What would make this ≥90%"** section (concrete actions/evidence that would raise confidence).
- **Build gate still applies:** `/lp-build` only proceeds on **IMPLEMENT** tasks that are **≥80%** confidence and unblocked. If <80%, stop and `/lp-replan`.

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

## Plan Documentation

- **Current / maintained plans** live in `docs/plans/` (or the domain’s plan directory like `docs/cms-plan/`) and should follow `docs/plans/<name>-plan.md`.
- **Completed plans** live in `docs/plans/archive/` with `Status: Archived`.
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

## Quick Reference

| Scenario | Action |
|----------|--------|
| Git state internally inconsistent | STOP. Run `git status`, share output, ask user |
| Files/commits from other agents | Normal — pull latest and proceed |
| Tests failing | Fix before commit. Never skip validation |
| Need to undo | Use `git revert`, never `reset --hard` |
| Large-scale fix needed | Create plan in `docs/plans/`, don't take shortcuts |
| MCP TypeScript intelligence | See `docs/ide/agent-language-intelligence-guide.md` |
| Asked to check types | Use MCP TypeScript tools first; run `pnpm --filter <pkg> typecheck` for affected packages (full `pnpm typecheck` only if explicitly requested) |

## Session Reflection (Optional)

After completing significant work, consider capturing learnings to improve future agent work.

**When to reflect:**
- Completed a multi-task plan
- Resolved unexpected problems with novel solutions
- Discovered gaps in documentation or skills

**How to reflect:**
1. Use `/meta-reflect` (or read `.claude/skills/meta-reflect/SKILL.md`)
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
