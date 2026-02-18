---
Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-01-20
Created: 2026-01-17
Created-by: Claude Opus 4.5
Last-updated: 2026-02-02
Last-updated-by: Codex (GPT-5.2)
---

# CODEX.md — Codex Agent Context

This file contains Codex-specific guidance. For universal commands, see `AGENTS.md`.

## Safety Rules (CRITICAL)

**IMPORTANT**: Codex does not have safety hooks like Claude Code. You MUST follow these rules based on documentation alone.

### Destructive / History-Rewriting Commands — STOP (Do Not Run)

Codex has no tool-level safety hooks in this repo. Treat the following as **forbidden for agents** (even if the user asks):

**Git commands that MUST NOT be run:**
- `git reset --hard/--merge/--keep` (loses work)
- `git clean -fd` (deletes untracked files permanently)
- `git push --force`, `-f`, `--force-with-lease`, `--mirror` (overwrites remote history)
- `git checkout -- .` / `git restore .` / bulk pathspecs (discards modifications)
- `git stash` mutations: `push`, `pop`, `apply`, `drop`, `clear`, bare `git stash` (hidden debt/loss)
- `git rebase`, `git commit --amend` (rewrites history)
- `git checkout -f`, `git switch --discard-changes` (forces discards)
- Bypasses: `--no-verify`, `SKIP_WRITER_LOCK=1`, `-c core.hooksPath=...` (disables safety)
- `rm -rf` on project directories (irreversible deletion)

**Other restrictions:**
- `pnpm test` (unfiltered) → Use targeted tests instead
- Commits to `main`/`staging` → Commit on `dev` only

### How to STOP and Hand Off

When you hit a situation that *seems* to require one of the commands above:

1. **Do NOT run the command**
2. **Capture diagnostics** (safe, read-only):
   - `git status --porcelain=v1 -b`
   - `git diff --stat`
   - `git log --oneline -10`
   - `scripts/git/writer-lock.sh status`
3. **Explain** which command would be risky and why it’s forbidden for agents
4. **Offer safer alternatives** (checkpoint commit, revert, wait for writer lock)
5. **Ask the user to decide next steps** and point them to `docs/git-safety.md` if a human must perform a destructive recovery

**Example**:
```
User: Clean up all the untracked files
You: The command you’re asking for is `git clean -fd`, which permanently deletes untracked files.
     That is a common cause of accidental rollbacks / lost work, so I won’t run it as an agent.

     Safer options:
     - Review what’s untracked: `git status --porcelain`
     - Dry-run the clean: `git clean -n`
     - Delete specific files manually
     - Add patterns to `.gitignore` so they stop appearing

     If you still want a full clean, please follow `docs/git-safety.md` and run it yourself.
```

### Reference

For the full rationale behind these safety rules, see:
- `AGENTS.md` § "Git Rules → Destructive / history-rewriting commands"
- `.agents/safety/rationale.md`
- `docs/git-safety.md`

### Local Enforcement (Recommended)

Codex has no repo-native pre-execution hooks. To hard-block the most dangerous git commands for agent sessions,
run Codex inside the repo’s “integrator mode” (writer lock + git guard):

```bash
scripts/agents/integrator-shell.sh -- codex
```

This blocks commands like `git reset --hard`, `git clean -fd`, force pushes, `rebase`, stash mutations, and `commit --amend`,
blocks repo-wide/bulk discard patterns (`git restore` / `git checkout --`), and enforces a single-writer lock for commits/pushes.
blocks repo-wide/bulk discard patterns (`git restore` / `git checkout --`), and enforces a single-writer lock for commits/pushes.

If you are running Codex non-interactively (no TTY; e.g. CI or API-driven agents), you can't open an integrator subshell.
Instead, wrap each command that may write (git operations, installs, builds) with:

```bash
scripts/agents/integrator-shell.sh -- <command> [args...]
```

## Environment Awareness

Codex may run in various configurations. Adapt behavior based on what's available:

### If Network Is Disabled

- `git push`, `git fetch` → Won't work; create commits for human to push
- `pnpm add <pkg>` → Won't work; dependencies must be pre-installed
- External API calls → Won't work; mock or skip

### If Network Is Enabled

- Follow normal `AGENTS.md` workflow including push/PR rules

### Detecting Environment

```bash
# Check if network is available
curl -s --max-time 2 https://github.com > /dev/null 2>&1 && echo "Network OK" || echo "No network"

# Check if we can push
git remote -v  # If empty or unreachable, commits are local-only
```

## Workflow Adaptations

| Situation | Adaptation |
|-----------|------------|
| No network | Create commits locally; note "ready to push" in plan |
| Limited time | Focus on one task; leave clear state for next session |
| Missing dependency | Note in plan; don't attempt workarounds |
| Can't run tests | Note which tests need running; don't skip validation intent |

## Type Intelligence (MCP)

When asked to “check types” or “check TypeScript errors,” use the MCP TypeScript language tools first (fast, on-demand). See `docs/ide/agent-language-intelligence-guide.md` for setup and scripts. `pnpm typecheck && pnpm lint` remains the final validation gate before commits.

Prompt template to enforce MCP usage: see `docs/ide/type-check-sop.md`.

## Output Expectations

When network is unavailable, end sessions with:
```markdown
## Session End

Commits ready to push:
- abc1234: Add validation to checkout form
- def5678: Add tests for validation

Next steps for human:
1. `git push origin HEAD`
2. Open PR
3. Continue with remaining tasks in docs/plans/<feature>-plan.md
```

## Attribution

```
Co-Authored-By: Codex <noreply@openai.com>
```

## Feature Workflow (Fact-Find → Plan → Build → Re-Plan)

Codex follows the same confidence-gated workflow as Claude Code. Since Codex has no skill loader or slash commands, invoke each phase by reading the skill file and following its instructions.

Workflow entrypoint (progressive disclosure): `docs/agents/feature-workflow-guide.md`.

### The Loop

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  lp-fact-find   │────▶│ lp-plan  │────▶│ lp-build  │
│             │     │              │     │               │
│ Audit repo  │     │ Tasks with   │     │ Only builds   │
│ Map impact  │     │ confidence % │     │ tasks ≥80%    │
│ Resolve Qs  │     │ per task     │     │               │
└─────────────┘     └──────────────┘     └───────┬───────┘
       ▲                    ▲                     │
       │              ┌─────┴─────┐               │
       └──────────────│  lp-replan   │◀──────────────┘
                      │            │  confidence <80%
                      └────────────┘
```

### How to Invoke Each Phase

| Phase | Action | Skill file |
|-------|--------|-----------|
| Fact-find | Read and follow | `.claude/skills/lp-fact-find/SKILL.md` |
| Plan | Read and follow | `.claude/skills/lp-plan/SKILL.md` |
| Build | Read and follow | `.claude/skills/lp-build/SKILL.md` |
| Re-plan | Read and follow | `.claude/skills/lp-replan/SKILL.md` |

### Confidence System

Each task gets a confidence percentage (0-100%) based on three dimensions:

| Dimension | Question |
|-----------|----------|
| **Implementation** | Do we know exactly how to write correct code? |
| **Approach** | Is this the best long-term solution? |
| **Impact** | Do we fully understand what this touches and won't break? |

Overall confidence = minimum of the three.

**Thresholds:**
- **80%+** → Build the task
- **60-79%** → Build with caution, flag risks
- **Below 60%** → Do NOT build. Re-plan first.

### Open Questions Policy

When uncertain about the right approach:
1. **First**: investigate the repo (read code, trace dependencies, check tests)
2. **Second**: search externally if it's a knowledge gap
3. **Third**: select the best long-term solution based on evidence
4. **Only then**: ask the user if genuinely unable to determine the answer

### Example Session

```
1. Read `.claude/skills/lp-fact-find/SKILL.md`
2. Audit the affected codebase areas, produce a brief
3. Read `.claude/skills/lp-plan/SKILL.md`
4. Create plan at `docs/plans/<feature>-plan.md` with confidence scores
5. If all tasks ≥80%:
   - Read `.claude/skills/lp-build/SKILL.md`
   - Build tasks one at a time
6. If any task <80%:
   - Read `.claude/skills/lp-replan/SKILL.md`
   - Investigate, update confidence, loop back to step 5
```

### Other Available Skills

**Complete skill catalog:**
```bash
scripts/agents/list-skills
```

The skill registry (`.agents/registry/skills.json`) lists all available skills with descriptions. Core workflow skills: `lp-fact-find`, `lp-plan`, `lp-build`, `lp-replan`. Read each skill's `SKILL.md` file for instructions.

## What Stays the Same

- Read `AGENTS.md` for commands and rules
- Follow `docs/plans/` workflow
- Use the lp-fact-find → plan → build → lp-replan loop (see above)
- Run validation before committing (when possible)
- Never take shortcuts on large-scale fixes
