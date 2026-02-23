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

**Feature workflow**: `/lp-do-fact-find` → `/lp-do-plan` → `/lp-do-build` → `/lp-do-replan` (when tasks are below execution threshold, blocked, or scope shifts)

**Idea generation**: `/idea-generate` — Cabinet Secretary sweep that generates, filters, prioritizes business ideas and seeds lp-do-fact-find docs. Feeds into the feature workflow above.
- Full pipeline: `/idea-generate` → `/lp-do-fact-find` → `/lp-do-plan` → `/lp-do-build`
- Spec: `.claude/skills/idea-generate/SKILL.md`
- Stances: `--stance=improve-data` (default) or `--stance=grow-business` (activates traction mode for market-facing L1-L2 businesses)
- Shared personas: `.claude/skills/_shared/cabinet/` (filter, prioritizer, dossier template, lens files)

Skills live in `.claude/skills/<name>/SKILL.md`. Claude Code auto-discovers them; Codex reads them directly.
For a short entrypoint into the workflow (progressive disclosure), see `docs/agents/feature-workflow-guide.md`.

## Skills

A skill is a local instruction set stored in `.claude/skills/<name>/SKILL.md`.

### Available skills

All skills listed here use the same name in both Claude Code and Codex. The canonical file is `.claude/skills/<name>/SKILL.md`.

- `biz-product-brief`: Produce a concise product brief artifact that is decision-ready, scoped, and measurable. (file: `.claude/skills/biz-product-brief/SKILL.md`)
- `biz-spreadsheet`: Define an operations spreadsheet deliverable with schema, formula logic, ownership, and a starter CSV template. (file: `.claude/skills/biz-spreadsheet/SKILL.md`)
- `biz-update-people`: Update People doc based on code attribution, reflection learnings, and role changes. (file: `.claude/skills/biz-update-people/SKILL.md`)
- `biz-update-plan`: Update Business Plan based on scan evidence, card reflections, and strategic decisions. (file: `.claude/skills/biz-update-plan/SKILL.md`)
- `draft-email`: Draft a decision-ready outbound or response email artifact with channel-safe structure, clear CTA, and review checklist. (file: `.claude/skills/draft-email/SKILL.md`)
- `draft-marketing`: Create channel-specific marketing asset drafts with clear positioning, CTA, and measurable campaign intent. (file: `.claude/skills/draft-marketing/SKILL.md`)
- `draft-outreach`: Draft sales and partnership outreach scripts (DMs, cold emails, follow-ups, objection handlers) for 1:1 relationship building. (file: `.claude/skills/draft-outreach/SKILL.md`)
- `draft-whatsapp`: Draft WhatsApp-ready business messages with concise structure, clear CTA, and compliance-aware guardrails. (file: `.claude/skills/draft-whatsapp/SKILL.md`)
- `frontend-design`: Create distinctive, production-grade frontend interfaces grounded in this repo's design system. Use when asked to build web components, pages, or applications. (file: `.claude/skills/frontend-design/SKILL.md`)
- `guide-translate`: Propagate updated EN guide content to all locales using parallel translation. Requires EN audit to be clean first. (file: `.claude/skills/guide-translate/SKILL.md`)
- `idea-advance`: Propose lane transitions for Business OS cards based on stage document evidence and completion criteria. (file: `.claude/skills/idea-advance/SKILL.md`)
- `idea-develop`: Convert a raw idea from inbox to a worked idea with card and initial Fact-find stage doc using agent APIs. (file: `.claude/skills/idea-develop/SKILL.md`)
- `idea-forecast`: Build a 90-day startup forecast and proposed goals from a business idea and product specs using web research. (file: `.claude/skills/idea-forecast/SKILL.md`)
- `idea-generate`: Radical business growth process auditor. Cabinet Secretary orchestrates multi-lens composite idea generation with attribution, confidence gating, and priority ranking. (file: `.claude/skills/idea-generate/SKILL.md`)
- `idea-readiness`: Readiness gate for idea generation. Audit business-plan freshness, outcome clarity, tooling/data availability, and market-research freshness; fail closed on critical gaps. (file: `.claude/skills/idea-readiness/SKILL.md`)
- `idea-scan`: Scan docs/business-os/ for changes and create business-relevant ideas from findings. (file: `.claude/skills/idea-scan/SKILL.md`)
- `ideas-go-faster`: Radical business growth process auditor. Cabinet Secretary orchestrates multi-lens composite idea generation with attribution, confidence gating, and priority ranking. (file: `.claude/skills/ideas-go-faster/SKILL.md`)
- `lp-assessment-bootstrap`: Bootstrap a brand-dossier.user.md for a business entering the startup loop. Used at S0/S1 when the doc is missing, or at DO before /lp-design-spec. (file: `.claude/skills/lp-assessment-bootstrap/SKILL.md`)
- `lp-baseline-merge`: Join startup-loop fan-out outputs (S2B + S3 + S6B) into a single baseline snapshot and draft manifest. (file: `.claude/skills/lp-baseline-merge/SKILL.md`)
- `lp-bos-sync`: S5B BOS sync stage worker. Persists prioritized baseline outputs to Business OS (D1) via agent API, then emits S5B stage-result.json. (file: `.claude/skills/lp-bos-sync/SKILL.md`)
- `lp-channels`: Startup channel strategy + GTM skill (S6B). Analyzes channel-customer fit, selects 2-3 launch channels with rationale, and produces a 30-day GTM timeline. (file: `.claude/skills/lp-channels/SKILL.md`)
- `lp-design-qa`: Audit a built UI against the design spec and design system for visual consistency, accessibility, responsive behavior, and token compliance. (file: `.claude/skills/lp-design-qa/SKILL.md`)
- `lp-design-spec`: Translate a feature requirement into a concrete frontend design specification mapped to the design system, theme tokens, and per-business brand language. (file: `.claude/skills/lp-design-spec/SKILL.md`)
- `lp-design-system`: Apply design tokens and system patterns correctly. Reference for semantic colors, spacing, typography, borders, and shadows. Never use arbitrary values. (file: `.claude/skills/lp-design-system/SKILL.md`)
- `lp-do-assessment-01-problem-statement`: Problem framing for new startups (ASSESSMENT-01). Produces a falsifiable problem statement artifact before entering ASSESSMENT intake. Upstream of lp-do-assessment-02-solution-profiling. (file: `.claude/skills/lp-do-assessment-01-problem-statement/SKILL.md`)
- `lp-do-assessment-02-solution-profiling`: Solution space scanning for new startups (ASSESSMENT-02). Produces a structured deep-research-ready prompt covering 5-10 candidate product-type options with feasibility flags. (file: `.claude/skills/lp-do-assessment-02-solution-profiling/SKILL.md`)
- `lp-do-assessment-03-solution-selection`: Solution selection gate for new startups (ASSESSMENT-03). Builds an evaluation matrix and produces a shortlist of 1-2 options with elimination rationale. Explicit kill gate. (file: `.claude/skills/lp-do-assessment-03-solution-selection/SKILL.md`)
- `lp-do-assessment-04-candidate-names`: Full naming pipeline orchestrator (ASSESSMENT-04). Runs four parts: spec → generate 250 candidates → RDAP batch check → rank shortlist. (file: `.claude/skills/lp-do-assessment-04-candidate-names/SKILL.md`)
- `lp-do-assessment-05-name-selection`: Produce a naming-generation-spec.md for a business. Part 1 of a 4-part naming pipeline (spec → generate → RDAP batch check → rank). (file: `.claude/skills/lp-do-assessment-05-name-selection/SKILL.md`)
- `lp-do-assessment-06-distribution-profiling`: Distribution profiling for new startups (ASSESSMENT-06). Elicits ≥2 launch channels with cost/effort estimates and ICP fit rationale. (file: `.claude/skills/lp-do-assessment-06-distribution-profiling/SKILL.md`)
- `lp-do-assessment-07-measurement-profiling`: Measurement profiling for new startups (ASSESSMENT-07). Elicits tracking setup, ≥2 key metrics, success thresholds, and data collection feasibility. (file: `.claude/skills/lp-do-assessment-07-measurement-profiling/SKILL.md`)
- `lp-do-assessment-08-current-situation`: Current situation for new startups (ASSESSMENT-08). Elicits operator-direct knowledge: launch surface, inventory readiness, commercial architecture, and pre-locked channel decisions. (file: `.claude/skills/lp-do-assessment-08-current-situation/SKILL.md`)
- `lp-do-assessment-10-brand-profiling`: Brand profiling for new startups (ASSESSMENT-10). Confirms business name, defines audience, personality, and voice & tone. Upstream of lp-do-assessment-11-brand-identity. (file: `.claude/skills/lp-do-assessment-10-brand-profiling/SKILL.md`)
- `lp-do-assessment-11-brand-identity`: Visual brand identity for new startups (ASSESSMENT-11). Produces brand-dossier with colour palette, typography, imagery direction, and token overrides. (file: `.claude/skills/lp-do-assessment-11-brand-identity/SKILL.md`)
- `lp-do-assessment-12-promote`: Brand dossier promotion gate (ASSESSMENT-12). Validates completeness of a Draft brand dossier and promotes to Active with operator confirmation. (file: `.claude/skills/lp-do-assessment-12-promote/SKILL.md`)
- `lp-do-build`: Thin build orchestrator. Executes one runnable task per cycle from an approved plan using canonical gates, track-specific executors, and shared ops utilities. (file: `.claude/skills/lp-do-build/SKILL.md`)
- `lp-do-critique`: Hardnosed critic for lp-do-fact-find, lp-do-plan, lp-offer, and process/skill documents. Surfaces weak claims, missing evidence, hidden assumptions, feasibility gaps, and unaddressed risks with no glazing. (file: `.claude/skills/lp-do-critique/SKILL.md`)
- `lp-do-fact-find`: Thin orchestrator for discovery, intake routing, and evidence-first fact-finding. Routes to specialized modules and emits planning or briefing artifacts with a shared schema. (file: `.claude/skills/lp-do-fact-find/SKILL.md`)
- `lp-do-factcheck`: Verify the accuracy of statements in markdown documents by auditing the actual repository state. Directly fix inaccuracies in-place rather than producing a separate report. (file: `.claude/skills/lp-do-factcheck/SKILL.md`)
- `lp-do-plan`: Thin orchestrator for confidence-gated planning. Routes to track-specific planning modules and optionally hands off to /lp-do-build when explicit auto-build intent is present. (file: `.claude/skills/lp-do-plan/SKILL.md`)
- `lp-do-replan`: Thin orchestrator for resolving low-confidence plan tasks with evidence, explicit precursor tasks, stable task IDs, and checkpoint-aware reassessment. (file: `.claude/skills/lp-do-replan/SKILL.md`)
- `lp-experiment`: Startup experiment design and weekly readout for the S8/S10 build-measure-decide loop. (file: `.claude/skills/lp-experiment/SKILL.md`)
- `lp-forecast`: S3 startup 90-day forecaster — build P10/P50/P90 scenario bands from zero operational data. (file: `.claude/skills/lp-forecast/SKILL.md`)
- `lp-guide-audit`: Run SEO audit and iteratively fix all issues for English guide content only. No translation. (file: `.claude/skills/lp-guide-audit/SKILL.md`)
- `lp-guide-improve`: Main entry point for guide improvement — interactive workflow selection for audit, translation, or both. (file: `.claude/skills/lp-guide-improve/SKILL.md`)
- `lp-launch-qa`: Pre-launch quality assurance gate for startup loop (S9B). Validates conversion flows, SEO technical readiness, performance budget, and legal compliance before a site goes live. (file: `.claude/skills/lp-launch-qa/SKILL.md`)
- `lp-measure`: Bootstrap measurement infrastructure for a startup before or just after website launch. (file: `.claude/skills/lp-measure/SKILL.md`)
- `lp-offer`: Startup offer design skill (S2B). Consolidates ICP, positioning, pricing, and offer design into one artifact with 6 sections. (file: `.claude/skills/lp-offer/SKILL.md`)
- `lp-onboarding-audit`: Audit an app's onboarding flow against the "Onboarding Done Right" checklist. Produces a planning-ready brief. (file: `.claude/skills/lp-onboarding-audit/SKILL.md`)
- `lp-other-products`: Produce a deep research prompt for adjacent product range exploration covering customer JTBD, product candidate set, prioritisation rubric, and 90-day MVP plan. (file: `.claude/skills/lp-other-products/SKILL.md`)
- `lp-prioritize`: S5 startup go-item ranking — score and select top 2-3 items to pursue. (file: `.claude/skills/lp-prioritize/SKILL.md`)
- `lp-readiness`: Startup preflight gate (S1). Lightweight readiness check before entering the offer-building stage. (file: `.claude/skills/lp-readiness/SKILL.md`)
- `lp-refactor`: Refactor React components for better maintainability, performance, or patterns. Covers hook extraction, component splitting, type safety, memoization, and composition. (file: `.claude/skills/lp-refactor/SKILL.md`)
- `lp-seo`: S6B phased SEO strategy skill — keyword research, content clustering, SERP analysis, technical audit, and snippet optimization for any business. (file: `.claude/skills/lp-seo/SKILL.md`)
- `lp-sequence`: Topologically sort plan tasks into correct implementation order, preserve stable task IDs by default, and add explicit dependency/blocker metadata. (file: `.claude/skills/lp-sequence/SKILL.md`)
- `lp-signal-review`: Weekly signal strengthening review for startup loop runs. Audits a run against ten structural signal-strengthening principles and emits a Signal Review artifact with ranked Finding Briefs. (file: `.claude/skills/lp-signal-review/SKILL.md`)
- `lp-site-upgrade`: Build website-upgrade strategy in three layers: platform capability baseline, per-business upgrade brief, and lp-do-fact-find handoff packet. (file: `.claude/skills/lp-site-upgrade/SKILL.md`)
- `lp-visual`: Generate or enhance HTML documentation with polished visual diagrams (Mermaid flowcharts, state machines, sequence diagrams, Chart.js dashboards). (file: `.claude/skills/lp-visual/SKILL.md`)
- `lp-weekly`: S10 weekly orchestration wrapper. Coordinates the full weekly decision, audit/CI, measurement compilation, and experiment lane flows into one deterministic sequence. (file: `.claude/skills/lp-weekly/SKILL.md`)
- `meta-loop-efficiency`: Weekly startup-loop skill efficiency audit. Scans lp-* + startup-loop + draft-outreach skills with deterministic heuristics and emits a ranked opportunity artifact. (file: `.claude/skills/meta-loop-efficiency/SKILL.md`)
- `meta-reflect`: Capture session learnings and propose targeted improvements to docs, skills, or core agent instructions. Evidence-based only — closes the feedback loop directly by updating existing files. (file: `.claude/skills/meta-reflect/SKILL.md`)
- `meta-user-test`: Run a repeatable two-layer site audit: full sitemap JS-off coverage for complete issue inventory, then focused JS-on flow checks for hydration/booking UX. (file: `.claude/skills/meta-user-test/SKILL.md`)
- `ops-git-recover`: Recover from confusing git states. Use when git status is unexpected, commits seem lost, you have a detached HEAD, or merge conflicts are overwhelming. (file: `.claude/skills/ops-git-recover/SKILL.md`)
- `ops-inbox`: Process pending Brikette customer emails and generate draft responses using MCP tools. (file: `.claude/skills/ops-inbox/SKILL.md`)
- `ops-ship`: Ship local changes to origin/dev with hard-enforced git safety policy, integrator-shell lock/guard flow, validate-changes gating, and CI watch-fix loops until required checks pass. (file: `.claude/skills/ops-ship/SKILL.md`)
- `review-plan-status`: Report on the status of incomplete plans — how many tasks remain in each. Optionally lp-do-factcheck plans before reporting. (file: `.claude/skills/review-plan-status/SKILL.md`)
- `startup-loop`: Chat command wrapper for operating Startup Loop runs. Supports /startup-loop start|status|submit|advance with strict stage gating, prompt handoff, and Business OS sync checks. (file: `.claude/skills/startup-loop/SKILL.md`)

### Design & Visual routing

When the user's request involves building or modifying UI:
1. Load `frontend-design` for aesthetic direction grounded in the design system
2. Reference `lp-design-system` for token quick-ref during implementation
3. After significant UI work, suggest `/lp-visual` to document the feature visually

When the user's request involves documentation or diagrams:
1. Load `lp-visual` for diagram/chart creation
2. If the doc is for a specific business, derive palette from the brand dossier (see `references/css-variables.md` Brand-Derived Palettes)
3. Reference `lp-design-system` for consistent color language

### How to use `lp-*` skills

- Trigger rule: if a user asks for a specific `lp-*` skill (for example `/lp-do-plan`) or the task clearly matches one above, load that skill file and follow it.
- Progressive loading: read only the needed sections first; load referenced files on-demand.
- Path resolution: resolve relative paths from the skill directory before trying alternatives.
- Reuse over rewrite: prefer referenced templates/scripts/assets shipped with the skill.

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

Prompting policy for shared worktrees:
- Do **not** pause to ask for confirmation solely because unrelated/untracked files appeared.
- Continue by default and keep your commit scope limited to files required for the current task.
- Only stop and ask if there is a direct conflict with your intended edits or a git consistency issue.

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
