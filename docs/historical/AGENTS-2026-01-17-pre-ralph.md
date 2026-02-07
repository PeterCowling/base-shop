---
Type: Runbook
Status: Canonical
Domain: Repo
Last-reviewed: 2026-01-15
Last-updated: 2026-01-16
Last-updated-by: Codex
---

# AGENTS — Repo Runbook

Use this file as the global checklist for working in the Skylar SRL monorepo.

---

## Git Safety Rules (MANDATORY)

> **⚠️ INCIDENT REFERENCE: On Jan 14, 2026, `git reset --hard` to an old commit destroyed 8 apps.**
> The agent tried to "fix" a confusing git state by resetting. All work since Dec 29 was lost.
> Recovery took days. See `docs/historical/RECOVERY-PLAN-2026-01-14.md` for details.
> **THESE RULES EXIST TO PREVENT THIS FROM HAPPENING AGAIN.**

These rules protect work from being lost. Agents MUST follow them automatically without user prompting.

### Rule 0: One Worktree Per Agent/Human (MANDATORY for parallel work)

**Trigger:** More than one agent/human is editing the repo at the same time, OR you need to “save to GitHub” while someone else keeps editing.

**Agent action:**
- Do **not** share a single working tree between agents/humans.
- Create a dedicated worktree + branch for each agent:
  ```bash
  scripts/git/new-worktree.sh <label>
  # Example: scripts/git/new-worktree.sh codex-hooks
  ```
  Or manually:
  ```bash
  git fetch origin
  git worktree add -b work/$(date +%Y-%m-%d)-<desc> .worktrees/$(date +%Y-%m-%d)-<desc> origin/main
  ```
- Commit/push only from your own worktree. This avoids “mystery edits” appearing mid-task and prevents accidental mixed commits.

**Why:** A shared working tree makes agents loop on “what changed?” and risks committing someone else’s edits. Worktrees isolate changes so “save to GitHub” is deterministic.

### Rule 1: Commit Every 30 Minutes

**Trigger:** After 30 minutes of work OR after completing any significant change (new file, major edit, feature complete).

**Agent action:**
```bash
# Check if there are uncommitted changes
git status --porcelain

# If changes exist and 30+ minutes since last commit (in your own worktree):
git add -A
git commit -m "WIP: <brief description of changes>

Co-Authored-By: Claude <model> <noreply@anthropic.com>"
```

**Why:** Uncommitted work is unrecoverable if something goes wrong. Frequent commits create restore points.

### Rule 2: Push Every 2 Hours (or Every 3 Commits)

**Trigger:** After 2 hours of work OR after 3 local commits, whichever comes first.

**Agent action:**
```bash
# Check commits ahead of remote
git rev-list --count @{upstream}..HEAD 2>/dev/null || echo "no upstream"

# If 3+ commits ahead OR 2+ hours since last push:
git push origin HEAD
```

**Why:** Local commits are lost if the machine fails. GitHub is the backup.

### Rule 2a: Create a Pull Request After Pushing

**Trigger:** After the first push of a `work/*` branch (and whenever new work is ready for review).

**Agent action:**
```bash
# Create a PR on GitHub (preferred), or with gh if available:
# gh pr create --fill --base main --head <branch>
```

**Why:** The PR is the durable handoff to humans and the gate for CI, staging, and approval.

### Rule 2b: Keep PRs Green and Mergeable

**Trigger:** Before requesting approval or merge.

**Agent action:**
- Ensure the PR has **no merge conflicts**.
- Ensure **GitHub Actions is green** (fix failures on the work branch and push).
- Do **not** bypass checks.

**Why:** Staging only updates after a clean merge to `main`, so conflicts and CI failures must be resolved first.

### Rule 3: Never Run Destructive Commands

**PROHIBITED commands (never run these):**
- `git reset --hard` — destroys uncommitted work
- `git reset --hard <old-commit>` — **CATASTROPHIC: deletes all work since that commit**
- `git clean -fd` — deletes untracked files permanently
- `git checkout -- .` — discards all local changes
- `git stash drop` — loses stashed work
- `git push --force` — overwrites remote history
- `git rebase -i` — can lose commits

**If user asks for these:** Refuse and explain the risk. Offer safer alternatives.

**Safe alternatives:**
| Instead of | Do this |
|------------|---------|
| `git reset --hard` | Create backup branch first, then discuss |
| `git reset --hard <old-commit>` | **NEVER** — this is how 8 apps were lost |
| `git clean` | Move files to `archive/` folder |
| `git checkout -- .` | Commit first, then discuss what to discard |
| Force push | Create a new branch instead |

### Rule 3a: Never "Fix" Git Problems by Resetting to Old Commits

**THIS IS HOW THE JAN 14, 2026 INCIDENT HAPPENED.**

The scenario:
1. Something seems wrong with git (merge conflicts, stash issues, confusing state)
2. Agent thinks: "I'll just reset to a known good state and reapply changes"
3. Agent runs `git reset --hard <some-old-commit>`
4. **ALL WORK SINCE THAT COMMIT IS DESTROYED**

**If git state is confusing:**
1. STOP — do not try to fix it
2. Run `git status` and `git stash list`
3. Share the output with the user
4. Ask: "Git is in an unexpected state. How would you like to proceed?"
5. **NEVER reset to an old commit as a "fix"**

### Rule 3b: Never Use Stash as Storage

**Stashes are temporary and dangerous:**
- Some tools can create hidden stashes automatically (lint-staged is configured to run with `--no-stash`, but other tooling may still stash)
- Stashes are local-only — not backed up to GitHub
- Stash conflicts are hard to resolve
- The Jan 14 incident involved 179 files stuck in a stash

**If you see stashed work:**
```bash
# Check for stashes
git stash list

# If stashes exist, DO NOT try to manage them
# Tell the user: "There are stashed changes. Please review with `git stash show -p stash@{0}`"
```

**Never run:**
- `git stash pop` — can cause conflicts that lead to destructive "fixes"
- `git stash drop` — permanently loses work
- `git stash clear` — loses all stashes

### Rule 4: Never Work Directly on `main`

**Before starting any work:**
```bash
# Check current branch
git branch --show-current

# If on main, create a work branch:
git checkout -b work/<date>-<brief-description>
# Example: work/2026-01-15-add-auth-feature
```

**Why:** Working on `main` risks accidental deployment. Feature branches isolate changes.

### Rule 5: Check Git Status Before Risky Operations

**Before running ANY of these:** `rm`, `mv`, `git checkout`, `git switch`, `pnpm install`

```bash
# First, check for uncommitted work
git status --porcelain

# If output is not empty, commit first:
git add -A && git commit -m "WIP: checkpoint before <operation>"
```

---

### Rule 6: Verify New Files Are Tracked Before Committing

**Trigger:** After creating or regenerating files, before any commit.

**Agent action:**
```bash
# Confirm untracked files and staged changes
git status --porcelain
git diff --cached --stat

# If new files are listed as untracked:
git add -A

# Confirm the new files are staged:
git diff --cached --stat
```

**If a new file will not stage:** run `git check-ignore -v <path>` and stop. Do not force-add or delete the file without user direction.

**If a new file disappears or goes missing:** STOP. Run `git status --porcelain` and `git ls-files --others --exclude-standard`, share the output, and ask the user how to proceed.

**Why:** Untracked files can be deleted by cleanup tools or external actions. Verifying staging prevents silent loss.

---

## Branching Strategy

### Branch Types

| Branch | Purpose | Who Creates | Deploys To |
|--------|---------|-------------|------------|
| `main` | Production code | Humans only (via PR merge) | Production (live sites) |
| `work/*` | Agent/human work | Agents or humans | Preview only |
| `hotfix/*` | Emergency fixes | Humans | Production (after review) |

### Rules for Agents

1. **Always work on `work/*` branches** — never commit directly to `main`
2. **Name branches clearly:** `work/YYYY-MM-DD-brief-description`
3. **Push branches to GitHub:** So humans can review and merge
4. **Open a PR after pushing:** Keep it updated as you work
5. **Never merge to main** — that's a human decision

### Creating a Work Branch (Agent Procedure)

```bash
# 1. Check for uncommitted work (Rule 5)
git status --porcelain
# If not empty, commit first before proceeding

# 2. Ensure we're up to date
git fetch origin

# 3. Create branch from latest main
git checkout main
git pull origin main
git checkout -b work/$(date +%Y-%m-%d)-<description>

# 4. Do work, commit frequently (Rule 1)
# 5. Push to GitHub (Rule 2)
git push -u origin HEAD

# 6. Open a PR (Rule 2a)
# Use GitHub UI or gh if available
```

---

## Human Workflow: Staging + Production

When an agent completes work, they push to a `work/*` branch and open a PR. Here's how humans deploy it:

### Step 1: Review the Work Branch

```bash
# See what the agent changed
git fetch origin
git log origin/main..origin/work/<branch-name> --oneline
git diff origin/main..origin/work/<branch-name> --stat
```

### Step 2: Open/Review the PR

1. Go to GitHub → Pull Requests → New Pull Request
2. Select `work/<branch-name>` → `main`
3. Confirm there are **no merge conflicts**
4. Confirm **GitHub Actions is green** (fix failures before approval)
5. Approve the PR

### Step 3: Merge to Main (Triggers Staging)

- Merge the PR in GitHub (required)
- Staging deploy runs automatically via GitHub Actions

### Step 4: Verify Staging

After merge to `main`:
- Check the Actions tab for build status
- Verify the staging URL for the app (see `docs/deployment-workflow.md`)

### Step 5: Promote to Production

- After visual review on staging, run the production workflow
- See `docs/deployment-workflow.md` for the exact steps

### Step 6: Clean Up (Optional)

```bash
# Delete the work branch after merge
git branch -d work/<branch-name>
git push origin --delete work/<branch-name>
```

---

## Quick Reference for Agents

### Start of Session Checklist

```bash
# 1. Check current branch (must not be main)
git branch --show-current
# If "main", create work branch (see Rule 4)

# 2. Check for uncommitted changes
git status --porcelain
# If not empty, commit them

# 3. Pull latest changes
git pull origin HEAD
```

### During Session

- Commit after every significant change (Rule 1)
- Push every 2 hours or 3 commits (Rule 2)
- Open a PR after the first push and keep it green (Rules 2a/2b)
- Never run destructive commands (Rule 3)

### End of Session

```bash
# 1. Commit any remaining changes
git add -A
git commit -m "WIP: session end checkpoint

Co-Authored-By: Claude <model> <noreply@anthropic.com>"

# 2. Push to GitHub
git push origin HEAD

# 3. Ensure PR exists and share the link with the user
```

---

## What Happens When (Decision Tree)

### User says "deploy" or "push to production"
1. Ensure all changes are committed, pushed, and a PR is open
2. Tell user: "PR is ready. Resolve conflicts + CI, merge to `main` to update staging, then visually review staging and promote to production."
3. Do NOT merge to main yourself

### User says "undo" or "revert"
1. Do NOT run `git reset --hard`
2. Ask: "What specifically do you want to undo?"
3. Offer: `git revert <commit>` (creates new commit that undoes changes)
4. Or: `git checkout <commit> -- <file>` (restores single file)

### User says "clean up" or "start fresh"
1. Do NOT run `git clean` or `git reset`
2. Commit current state first
3. Create a new branch from `main`
4. Archive unwanted files to `archive/` folder

### Something went wrong
1. STOP — don't run more commands
2. Run `git status` and `git log --oneline -10`
3. Share output with user
4. Consult `docs/historical/RECOVERY-PLAN-2026-01-14.md` for recovery procedures

### Git is in a confusing state (merge conflicts, stash issues, etc.)

**THIS IS THE EXACT SCENARIO THAT CAUSED THE JAN 14 INCIDENT.**

1. **STOP** — do NOT try to "fix" it
2. **DO NOT** run `git reset --hard` to any commit
3. **DO NOT** run `git stash pop` (always prohibited — let human decide)
4. Run these diagnostic commands and share output:
   ```bash
   git status
   git stash list
   git log --oneline -5
   git diff --stat
   ```
5. Tell user: "Git is in an unexpected state. I've shared the diagnostics above. Please advise how to proceed."
6. **Wait for human guidance** — do not attempt automated recovery

### Commit failed or was rejected by hooks

1. Read the error message carefully
2. Fix the underlying issue (lint error, type error, etc.)
3. Try the commit again
4. **DO NOT** use `--no-verify` to bypass hooks
5. **DO NOT** reset to avoid the problem

### User asks "why did my changes disappear?"

1. Check: `git stash list` — changes might be stashed
2. Check: `git reflog` — shows recent HEAD movements
3. Check: `git log --oneline -10` — verify recent commits
4. **DO NOT** try to "recover" by resetting to old commits
5. Share findings with user and ask how to proceed

---

## Technical Enforcement

> **Status: ✅ ALL LAYERS CONFIGURED**
>
> For full documentation, see:
> - [Git Safety Guide](docs/git-safety.md) - Comprehensive guide for humans
> - [Incident Prevention Summary](docs/incident-prevention.md) - One-page overview
> - [Git Hooks Documentation](docs/git-hooks.md) - Hook configuration details

These settings provide technical barriers that prevent accidents even if agents ignore the rules.

### Protection Layers (All Active)

| Layer | Status | What It Does |
|-------|--------|--------------|
| **Documentation** | ✅ | This file + CLAUDE.md instruct agents |
| **Git Hooks** | ✅ | Local hooks block secrets and force push |
| **GitHub Protection** | ✅ | Server-side PR + approval + CI requirement |
| **Claude Code Hooks** | ✅ | Blocks destructive commands at AI level |

### GitHub Branch Protection (CONFIGURED)

Go to GitHub → Settings → Rules → Rulesets → `main`:

| Setting | Value | Why |
|---------|-------|-----|
| **Require pull request before merging** | ✅ On | Prevents direct pushes to main |
| **Require approvals** | 1 | Human must review before merge |
| **Dismiss stale approvals** | ✅ On | Re-review if code changes |
| **Require status checks** | ✅ On | CI must pass before merge |
| **Require branches to be up to date** | ✅ On | Prevents merge conflicts |
| **Do not allow bypassing** | ✅ On | No exceptions, even for admins |
| **Restrict who can push** | Empty (no one) | All changes via PR only |
| **Allow force pushes** | ❌ Off | Prevents history destruction |
| **Allow deletions** | ❌ Off | Prevents branch deletion |

### Git Hooks (CONFIGURED)

The repo has these hooks via `simple-git-hooks`:

| Hook | Script | What it does |
|------|--------|--------------|
| `pre-commit` | `pre-commit-check-env.sh` + `no-partially-staged.js` + `lint-staged --no-stash` | Blocks secret env files, blocks partial staging, runs check-only lint without creating a backup stash |
| `pre-push` | `pre-push-safety.sh` + `pnpm typecheck` | Blocks non-fast-forward pushes to protected branches; runs typecheck before pushing |

**Setup after cloning:**
```bash
pnpm install
pnpm exec simple-git-hooks
```

**Full documentation:** [Git Hooks](docs/git-hooks.md)

### Claude Code Hooks (CONFIGURED)

Claude Code hooks intercept destructive commands before execution.

**Location:** `.claude/settings.json`

**Blocked commands:**
- `git reset --hard` - Destroys uncommitted work
- `git clean -fd` - Deletes untracked files
- `git checkout -- .` - Discards all local changes
- `git stash drop` / `git stash clear` - Loses stashed work
- `git push --force` / `git push -f` - Overwrites remote history
- `git rebase -i` - Can lose commits
- `--no-verify` - Bypasses safety hooks

If you attempt any of these commands, Claude Code will refuse with a message referencing this file.

---

Locale-specific visual systems and tone of voice live in:

- `apps/skylar/AGENTS.en.md` — warm red on cream "poster" system for EN.
- `apps/skylar/AGENTS.it.md` — Milan editorial guidelines.
- `apps/skylar/AGENTS.zh.md` — gold-on-black business card system for ZH.

For documentation structure and how to read/write docs as an agent, see:

- `docs/AGENTS.docs.md` — AI-first documentation runbook.

Always cross-check the relevant locale doc before touching copy, layout, or imagery inside `apps/skylar`.

## Core Workflow
- Install dependencies: `pnpm install`.
- Build all packages before starting any app: `pnpm build`.
- Regenerate config stubs after editing `packages/config/src/env/*.impl.ts`:
  - `pnpm --filter @acme/config run build:stubs`
- TypeScript path mapping: apps must map workspace packages to both `src` and `dist` so imports resolve pre/post build. See `docs/tsconfig-paths.md` for examples.

## Troubleshooting
- If `pnpm run dev` fails with an `array.length` error, see `docs/troubleshooting.md` for steps to capture detailed logs and stack traces.

## File Boundaries
- Keep each file focused on a single responsibility.
- Target ≤350 lines per file. If you must exceed this (e.g., generated output or framework-mandated structure), document the reason and plan a follow-up refactor.
- Prefer extracting helpers/components/modules over growing a single file.

## Security Work
- When performing security reviews or fixes, follow `security/AGENTS.md`.
  - Summary: prioritize externally reachable surfaces, authn/z, secrets, injections, deserialization, file handling, network/SSRF, path traversal, uploads, crypto, headers (CSP/CORS), CI/CD, IaC/cloud config. Provide runnable proofs via tests when possible. Keep all outputs local. For each finding include CWE/OWASP mapping, component path, risk, exploit narrative, minimal patch, and a test.

## Plan Documentation Lifecycle

Plans are critical artifacts for understanding project history and reconstruction. Follow these rules without exception.

### Plans Are NEVER Deleted

Plans are historical records needed for:
- Understanding why decisions were made
- Reconstructing timelines after incidents
- Auditing who did what and when

**Correct approach:**
```bash
# WRONG - Information destroyed
rm docs/plans/feature-xyz-plan.md

# RIGHT - Archive and mark complete
mv docs/plans/feature-xyz-plan.md docs/historical/plans/feature-xyz-plan.md
# Then add completion header to the file
```

### Required Plan Metadata

Every plan must include these fields at the top:

```markdown
---
Type: Plan
Status: Active | Completed | Superseded | Frozen
Domain: <CMS | Runtime | Platform | Commerce | etc.>
Created: YYYY-MM-DD
Created-by: <Human name> | Claude <model> | Codex
Last-updated: YYYY-MM-DD
Last-updated-by: <Human name> | Claude <model> | Codex
Completed: YYYY-MM-DD (if applicable)
Completed-by: <Human name> | Claude <model> | Codex (if applicable)
Superseded-by: <path to new plan> (if applicable)
---
```

### Authorship Attribution

Always track who did what:
- Human work: Use full name (e.g., "Peter Cowling")
- Claude work: Use "Claude <model>" (e.g., "Claude Opus 4.5")
- Codex work: Use "Codex"

In commit messages, use attribution matching the agent that did the work:
```
# Claude work:
Co-Authored-By: Claude <model> <noreply@anthropic.com>

# Codex work:
Co-Authored-By: Codex <noreply@openai.com>

# Mixed work (both agents contributed):
Co-Authored-By: Claude <model> <noreply@anthropic.com>
Co-Authored-By: Codex <noreply@openai.com>
```

### Plan Status Transitions

When completing a plan:
1. Update `Status:` to `Completed`
2. Add `Completed:` date and `Completed-by:` attribution
3. Add a "Completion Summary" section
4. Move to `docs/historical/plans/`

When superseding a plan:
1. Update old plan's `Status:` to `Superseded`
2. Add `Superseded-by:` pointing to new plan
3. Move old plan to `docs/historical/plans/`

See `CLAUDE.md` for detailed rationale and examples.

## Systemic Issues: Plan-First Approach (MANDATORY)

When encountering a problem that appears to require a large-scale fix (e.g., fixing 80+ files, disabling linters/type checkers, mass search-and-replace), **STOP and create a plan document instead of taking shortcuts**.

### What Constitutes a Shortcut

| Shortcut (AVOID) | Why It's Bad | Proper Approach |
|------------------|--------------|-----------------|
| `sed -i 's/old/new/g' **/*.ts` on 80+ files | Creates mass changes without understanding root cause | Create a plan to fix the underlying tooling issue |
| Adding `ignoreDuringBuilds: true` to Next.js config | Masks ESLint configuration problems | Create a plan to fix ESLint configuration |
| Adding `ignoreBuildErrors: true` to Next.js config | Masks TypeScript type issues | Create a plan to fix the type definitions |
| Deleting a file to fix an import error | Loses work and doesn't fix the actual problem | Fix the import path or module resolution |
| Disabling a test to make CI pass | Hides real bugs | Fix the code the test is catching |
| Using `any` type to silence TypeScript | Creates type safety holes | Fix the types properly |
| Mass-renaming imports without fixing the build system | Creates maintenance burden | Fix the build tooling (bundler, path aliases) |

### When to Create a Plan

Create a plan document in `docs/plans/` when:

1. **The fix affects 10+ files** — Large-scale changes need tracking and reversibility
2. **The fix involves disabling checks** — Linting, type checking, or test skipping
3. **The fix is a workaround, not a solution** — "This works but isn't the right way"
4. **The root cause is tooling or configuration** — Not just a code bug
5. **You're uncertain if the approach is correct** — Document reasoning for review

### Plan Creation Process

1. **Identify the problem clearly** — What's broken, what error messages appear
2. **Research the root cause** — Don't just fix symptoms
3. **Propose a proper solution** — How it should be fixed long-term
4. **Create the plan document**:
   ```bash
   # Location
   docs/plans/<descriptive-name>-plan.md

   # Required metadata (see Plan Documentation Lifecycle above)
   ---
   Type: Plan
   Status: Active
   Domain: <relevant domain>
   Created: <today's date>
   Created-by: <agent name>
   ---
   ```
5. **Tell the user** — "This is a systemic issue. I've created a plan at `docs/plans/xyz-plan.md` for the proper fix. Would you like to proceed with the plan, or should I apply a temporary workaround with a TODO noting the tech debt?"

### Example: Path Alias Issue

**Scenario:** The `@acme/ui` package uses `@ui/` path aliases that don't resolve in downstream apps.

**Wrong approach:**
```bash
# DON'T: Mass sed replace across 80+ files
sed -i 's/@ui\//..\/..\/src\//g' packages/ui/src/**/*.ts
```

**Right approach:**
1. Recognize this as a build tooling issue (tsc doesn't transform paths)
2. Create `docs/plans/ui-package-build-tooling-plan.md`
3. Document the proper solution (migrate to tsup/esbuild bundler)
4. Present the plan to the user before proceeding

### Reference Incident

On 2026-01-15, shortcuts were taken to "fix" build issues:
- `sed` replaced `@ui/` imports in 80+ files (created maintenance burden)
- `ignoreDuringBuilds: true` was added (masked ESLint config issues)
- `ignoreBuildErrors: true` was added (masked React 19 type issues)

These shortcuts created technical debt that now needs proper plans to resolve:
- `docs/plans/ui-package-build-tooling-plan.md`
- `docs/plans/monorepo-eslint-standardization-plan.md`

**Lesson:** Proper planning upfront prevents accumulated tech debt.

## Testing Policy (MANDATORY)

> **⚠️ INCIDENT REFERENCE: On Jan 16, 2026, orphaned Jest processes consumed 2.5GB+ RAM and caused system slowdown.**
> Multiple test runs were started but never terminated, accumulating over 2+ hours.
> The machine had only 93MB free RAM and load average of 7.73.
> **THESE RULES EXIST TO PREVENT THIS FROM HAPPENING AGAIN.**

### Rule 1: NEVER Run Broad Test Suites

**PROHIBITED test commands (never run these without explicit user request):**

```bash
# ❌ NEVER run these - they spawn many workers and take forever
pnpm test                           # Runs ALL tests in monorepo
pnpm --filter @acme/ui test         # Runs ALL tests in a large package
pnpm --filter @apps/cms test        # Runs ALL tests in an app
jest                                # Runs all tests in current directory
```

**Why:** Broad test runs spawn multiple Jest workers (4-8 per run), each consuming 200-500MB RAM. Multiple concurrent runs can easily consume 2-5GB and bring the system to a crawl.

**Exception (allowed only when explicitly requested):**
- You may run **all tests sequentially, one test file at a time**.
- Requirements:
  - Enumerate test files with `rg --files -g "*.{test,spec}.{ts,tsx,js,jsx,mjs,cjs}"` and run each file path explicitly.
  - Enumerate test files first (no globbed suite run).
  - Run each file individually (no parallel runs).
  - Stop on first failure, fix, then resume.
  - Use `--maxWorkers=1` (or `--runInBand`) for each file.
  - Still **never** run `pnpm test` unfiltered.
  - Check for orphaned Jest processes before starting (Rule 4).
  - Use the correct runner by location: Jest for unit/integration tests; Cypress for `test/e2e/**` and `apps/**/cypress/e2e/**` (see `docs/cypress.md`).
  - If Jest reports ESM parsing errors, retry the file with `JEST_FORCE_CJS=1` (some packages/scripts require CJS mode).
  - Once started, continue through the list without pausing for confirmations; only interrupt for a failure or a special setup requirement.

### Rule 2: Always Use Targeted Test Commands

**REQUIRED approach - always scope tests to the minimum necessary:**

```bash
# ✅ CORRECT: Run a single test file
pnpm --filter @acme/ui test -- src/atoms/Button.test.tsx

# ✅ CORRECT: Run tests matching a pattern
pnpm --filter @acme/ui test -- --testPathPattern="Button"

# ✅ CORRECT: Run a specific describe block or test
pnpm --filter @acme/ui test -- --testNamePattern="renders correctly"

# ✅ CORRECT: Combine file and test name patterns
pnpm --filter @acme/ui test -- src/atoms/Button.test.tsx -t "handles click"
```

### Rule 3: Limit Jest Workers

**When you must run broader tests, always limit workers:**

```bash
# ✅ Limit to 2 workers maximum
pnpm --filter @acme/ui test -- --maxWorkers=2

# ✅ Run sequentially (safest, slowest)
pnpm --filter @acme/ui test -- --runInBand
```

### Rule 4: Never Start Multiple Test Runs

**Before starting ANY test run:**

1. Check for existing Jest processes:
   ```bash
   ps aux | grep -E "(jest|vitest)" | grep -v grep
   ```

2. If processes exist, either:
   - Wait for them to complete, OR
   - Kill them first: `pkill -f jest`

3. Only then start your test run

**NEVER start a new test run in a different terminal while one is already running.**

### Rule 5: Clean Up Stuck Tests

**If tests seem stuck (running > 5 minutes for unit tests):**

```bash
# Check what's running
ps aux | grep jest | head -10

# Kill all Jest processes
pkill -f "jest-worker"
pkill -f "jest.js"

# Then re-run with --detectOpenHandles to find the issue
pnpm --filter <package> test -- <specific-file> --detectOpenHandles
```

### Test Scope Decision Tree

| Scenario | Command |
|----------|---------|
| Changed one file `Button.tsx` | `pnpm --filter @acme/ui test -- Button.test.tsx` |
| Changed one function | `pnpm --filter <pkg> test -- -t "function name"` |
| Changed a component + its tests | `pnpm --filter <pkg> test -- ComponentName` |
| Changed multiple files in one package | `pnpm --filter <pkg> test -- --maxWorkers=2` |
| Need to verify CI will pass | Ask user first; use `--maxWorkers=2` |
| User explicitly asks for full test run | Run **sequential single-file tests** only; no suite runs |

### Reference Commands

```bash
# Check for orphaned test processes
ps aux | grep -E "(jest|vitest)" | grep -v grep

# Kill all Jest processes
pkill -f "jest-worker" && pkill -f "jest.js"

# Check system resources
top -l 1 | head -10

# Run single test file (preferred)
pnpm --filter <package> test -- path/to/file.test.ts

# Run tests matching pattern
pnpm --filter <package> test -- --testPathPattern="pattern"

# Run with limited workers
pnpm --filter <package> test -- --maxWorkers=2
```

### Why This Matters

**Reference incident (2026-01-16):**
- 10+ Jest worker processes were running simultaneously
- Combined RAM usage: 2.5GB+
- System had only 93MB free RAM (out of 16GB)
- Load average: 7.73 (should be <4)
- Some processes had been running since 9:05AM (2+ hours)

**Lesson:** Always run the minimum necessary tests. One targeted test file runs in seconds and uses <100MB. A full package test suite spawns 4-8 workers at 200-500MB each.
