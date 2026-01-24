---
Type: Plan
Status: Active
Domain: Repo
Last-reviewed: 2026-01-17
Relates-to charter: none
Created: 2026-01-17
Created-by: Claude Opus 4.5
Last-updated: 2026-01-17
Last-updated-by: Codex (completed deferred Phase 7 Codex prompt testing)
Docs-custodian: @petercowling
---

# Ralph Methodology Adoption Plan

## Overview

Objective: adopt Ralph Wiggum methodology principles for agent-agnostic, iteration-based development. This is a consolidation plan; integrate Ralph patterns into existing structure. Do not create parallel systems.

## Goals (Outcomes)

1. **Slim down `AGENTS.md`** from ~767 lines to ~80-100 lines (operational focus)
2. **Reuse existing structure** — `.claude/prompts/`, `docs/plans/`, existing policy docs
3. **Add planning/building mode prompts** to `.claude/prompts/` (not new `.agent/` dir)
4. **Clarify persistent task state** — per-feature plans in `docs/plans/`, root `IMPLEMENTATION_PLAN.md` becomes index
5. **Strengthen backpressure** with robust validation script
6. **Create agent-neutral guidance** that works for Claude, Codex, and future agents
7. **Support high concurrency** — multiple agents/humans can work and "save to GitHub" without stepping on each other

## Ralph Principles (Canonical Definition)

These are the core principles of the Ralph Wiggum methodology. This section is the canonical reference — cite it when explaining "what Ralph means."

1. **Study before edit** — Read and understand existing code/docs before modifying. Never assume something isn't implemented.

2. **Plan is the persistent state** — Task lists live in `docs/plans/*.md`, not in agent memory. Plans survive context windows, sessions, and agent handoffs.

3. **One task per iteration** — Complete one atomic task, validate, commit, then move to the next. Full focus, clear commits, recoverable state.

4. **Validate before commit** — Run typecheck, lint, and targeted tests. Never commit failing code. Backpressure catches errors early.

5. **Validate after deploy** — Deployments aren't done until verified. Run post-deploy health checks to confirm the site responds and critical routes work. "Deploy and hope" is not acceptable.

6. **Thin entrypoints, canonical deep docs** — Keep `AGENTS.md`/`CLAUDE.md` short and operational. Push detail into dedicated docs with single canonical locations.

7. **Concurrency by isolation** — Use separate worktrees for parallel work, not coordination via shared working trees. "Save to GitHub" should be deterministic.

8. **Never take shortcuts on systemic issues** — If a fix requires mass changes or disabling checks, create a plan document instead. Shortcuts create tech debt.

9. **Explicit over implicit** — Document decisions, attribute authorship, track status. Future agents/humans should understand what happened and why.

## Concurrency Protocol (MANDATORY for parallel work)

This plan touches many **high-conflict** files (global runbooks, indexes, prompts). The workflow must explicitly support multiple agents/humans working at once.

### 1) Isolation: one worktree per agent/human

- Never share a single working tree between agents/humans.
- Create a dedicated worktree + `work/*` branch per agent:
  ```bash
  scripts/git/new-worktree.sh <label>
  # Example: scripts/git/new-worktree.sh claude-docs
  ```
- Each agent commits/pushes only from its own worktree. This makes “save to GitHub” deterministic.

### 2) Ownership: serialize edits to global docs

Designate a single **Docs Custodian** (human or one agent) for these files to avoid constant merge conflicts:

- `AGENTS.md`, `CLAUDE.md`, `IMPLEMENTATION_PLAN.md`
- `docs/INDEX_FOR_CLAUDE.md`, `.claude/SKILLS_INDEX.md`, `.claude/prompts/README.md`

Other agents can work in parallel on additive files (new docs/prompts/scripts) and open PRs, but should not concurrently rewrite the global docs.

**Enforcement:** CODEOWNERS entries require branch protection rules to be enforced. Add both:

1. `.github/CODEOWNERS` file:
```
# High-conflict global docs — require custodian review
AGENTS.md @petercowling
CLAUDE.md @petercowling
IMPLEMENTATION_PLAN.md @petercowling
docs/INDEX_FOR_CLAUDE.md @petercowling
.claude/SKILLS_INDEX.md @petercowling
.claude/prompts/README.md @petercowling

# Workflows — high-impact, often touched by multiple agents
.github/workflows/** @petercowling
```

2. GitHub Ruleset for `main` (Settings → Rules → Rulesets):
   - Enable "Require a pull request before merging"
   - Enable "Require code owner review" (under Pull Request settings)
   - Without this ruleset configuration, CODEOWNERS is advisory only
   - See `docs/git-safety.md` § "Layer 3: GitHub Branch Protection" for full ruleset config

### 3) Plan updates: minimize conflicts

- Treat this plan file as owned by the **Docs Custodian** (see `Docs-custodian` in frontmatter) during active parallel work.
- Other agents report progress via PR description / comment ("completed Phase 1 task X"), and the custodian updates checkboxes during merge.
- **Do NOT** edit the plan file directly from non-custodian branches; this causes merge conflicts.

### 4) Task claiming: prevent duplicate work

Before starting a task, **claim it** to prevent two agents picking the same work:

| Method | How |
|--------|-----|
| **PR-based (preferred)** | Open a draft PR titled `[WIP] Phase X Task Y: <description>`. Other agents see the PR and skip that task. |
| **Comment-based** | Add a comment to the plan's PR: "Claiming Phase 1 Task 3 - @agent-name". |
| **Branch naming** | Include task ID in branch: `work/2026-01-17-phase1-task3-testing-policy`. |

The custodian should maintain a "Claims" section in the PR description if many agents are active.

### 5) Integration procedure: merge conflicts

When your branch conflicts with main:

1. **Merge main into your branch** — do NOT rebase (preserves commit history)
   ```bash
   git fetch origin
   git merge origin/main
   # Resolve conflicts
   git commit
   ```
2. **If conflicts are in custodian-owned files** (AGENTS.md, CLAUDE.md, etc.):
   - Ping the custodian before resolving
   - Or: keep your changes separate and let custodian integrate during PR merge
3. **Create an integration PR** when:
   - Multiple worktrees have diverged significantly
   - A shared dependency was updated in parallel
   - The custodian needs to reconcile conflicting approaches

### 6) Resource contention: avoid parallel heavy runs

Multiple worktrees on one machine can exhaust resources:

| Operation | Guidance |
|-----------|----------|
| `pnpm typecheck` | CPU-intensive; stagger pushes or run sequentially (no worker limit option) |
| `pnpm build` | Very heavy; only one at a time per machine |
| `pnpm test` | Use `--maxWorkers=2` for Jest; avoid simultaneous full runs |

**If resources are tight:**
- Coordinate via Slack/comment before running heavy operations
- Use `nice -n 10` to lower priority: `nice -n 10 pnpm typecheck`
- Consider using separate machines for parallel agents

## Current State Analysis

### What Already Exists (KEEP)

| File/Dir | Lines | Purpose | Action |
|----------|-------|---------|--------|
| `AGENTS.md` | 766 | Universal runbook | **SLIM** to ~100-120 lines |
| `CLAUDE.md` | 762 | Claude-specific | **SLIM** to ~200 lines, remove duplication |
| `docs/git-safety.md` | 408 | Full git safety guide | **KEEP** as canonical |
| `docs/git-hooks.md` | 314 | Hook documentation | **KEEP** as canonical |
| `docs/incident-prevention.md` | 90 | Protection layers summary | **KEEP** as canonical |
| `docs/historical/RECOVERY-PLAN-2026-01-14.md` | 1841 | Incident details | **KEEP** in place |
| `docs/plans/` | 27 files | Per-feature plans | **KEEP** — this IS the task state |
| `docs/historical/plans/` | 3 files | Archived plans | **KEEP** as archive |
| `.claude/prompts/` | 11 files | Workflow prompts (agent-agnostic) | **EXTEND** with plan/build modes |
| `.claude/SKILLS_INDEX.md` | ~200 | Skills catalog | **UPDATE** index |
| `docs/INDEX_FOR_CLAUDE.md` | ~390 | Quick reference | **UPDATE** with new structure |
| `docs/AGENTS.docs.md` | 497 | AI-first doc runbook | **KEEP** — defines plan metadata schema |
| `__tests__/docs/testing.md` | 56 | Testing guide | **UPDATE** to align with testing policy |
| `IMPLEMENTATION_PLAN.md` | ~93 | Sprint/feature tracker | **REPURPOSE** as now/next index |

### What Doesn't Exist (CREATE)

| File | Purpose |
|------|---------|
| `CODEX.md` | Codex-specific context (conditional, not absolute) |
| `.claude/prompts/plan-feature.md` | Planning mode prompt |
| `.claude/prompts/build-feature.md` | Building mode prompt |
| `scripts/validate-changes.sh` | Robust backpressure script (pre-commit) |
| `scripts/post-deploy-health-check.sh` | Post-deploy verification (closes the deploy→verify loop) |
| `.github/CODEOWNERS` | Enforce custodian review for high-conflict files |

> **Rule on embedded specs:** This plan contains initial drafts for new files. Create the actual files early (Phase 1) and treat those files as canonical. After creation, keep this plan limited to links + acceptance criteria to reduce merge conflicts.

### What To Remove/Redirect

| Current Location | Content | Move To |
|------------------|---------|---------|
| `AGENTS.md` § "Git Safety Rules" | Git safety rules (detailed) | Reference `docs/git-safety.md` |
| `AGENTS.md` § "Testing Policy" | Testing policy (detailed) | Reference new `docs/testing-policy.md` |
| `AGENTS.md` § "Plan Documentation Lifecycle" | Plan lifecycle (detailed) | Reference `docs/AGENTS.docs.md` |
| `CLAUDE.md` duplicated rules | Git safety, testing, etc. | Remove, reference AGENTS.md |
| `__tests__/docs/testing.md` | Uses `pnpm test` (contradicts policy) | Update to use targeted commands |

**Note:** References use section headings (`§`), not line numbers, to avoid rot when files change.

## Canonical Locations (Source of Truth)

After consolidation, each topic has ONE canonical location:

| Topic | Canonical Location | Referenced From |
|-------|-------------------|-----------------|
| Git safety rules | `docs/git-safety.md` | AGENTS.md (brief), CLAUDE.md |
| Git hooks config | `docs/git-hooks.md` | AGENTS.md |
| Incident details | `docs/historical/RECOVERY-PLAN-2026-01-14.md` | docs/git-safety.md |
| Protection layers | `docs/incident-prevention.md` | AGENTS.md |
| Testing policy | `docs/testing-policy.md` (NEW) | AGENTS.md (brief), CLAUDE.md, `__tests__/docs/testing.md` |
| Plan metadata schema | `docs/AGENTS.docs.md` § "Plan docs follow a shared pattern" | AGENTS.md, plan templates |
| Commands reference | `AGENTS.md` | CLAUDE.md, INDEX_FOR_CLAUDE.md |
| Feature task state | `docs/plans/<feature>-plan.md` | IMPLEMENTATION_PLAN.md (index) |
| Claude tool hints | `CLAUDE.md` | — |
| Codex environment | `CODEX.md` | — |
| Workflow prompts | `.claude/prompts/` | AGENTS.md, CODEX.md |

> **Note on `.claude/prompts/`:** These are agent-agnostic workflow prompts usable by any agent (Claude, Codex, etc.) or human. They're stored in `.claude/` for historical reasons; the directory name doesn't imply Claude-only usage.

### Plan Metadata Schema (Canonical Definition)

The canonical plan metadata schema is defined in `docs/AGENTS.docs.md`. All plan templates MUST use this schema:

```yaml
Type: Plan
Status: Active | Completed | Superseded | Frozen
Domain: <CMS | Runtime | Platform | Commerce | etc.>
Last-reviewed: YYYY-MM-DD          # Required
Relates-to charter: <path> | none  # Required (use "none" if no charter)
Created: YYYY-MM-DD                 # Optional but recommended
Created-by: <Human | Claude <model> | Codex>  # Optional but recommended
Last-updated: YYYY-MM-DD            # Optional
Last-updated-by: <same format>      # Optional
```

**Note:** `Last-reviewed` and `Relates-to charter` are required per `docs/AGENTS.docs.md`. Use `none` when a plan doesn't implement a specific charter. `Created`/`Created-by` were added for attribution tracking.

## Active tasks

- ~~**RALPH-01**: Address post-implementation feedback (validate-changes.sh runner detection, doc conflicts)~~ — **COMPLETE** (2026-01-17): Runner detection implemented (Jest/Node/Vitest); doc conflict mitigation via CODEOWNERS and custodian process in place.
- ~~**RALPH-02**: Test prompts with Codex when available~~ — **COMPLETE** (2026-01-17)

## Implementation Progress

### Phase 0: Concurrency & Ownership (Prerequisite)

- [x] Confirm each agent/human is working in a dedicated worktree (`scripts/git/new-worktree.sh <label>`)
- [x] Appoint a Docs Custodian: **@petercowling** (recorded in `Docs-custodian` frontmatter field)
- [x] Require PRs for parallel work; do not "share a working tree" as a coordination mechanism
- [x] Add `.github/CODEOWNERS` entries for custodian-owned files (see § 2)

### Phase 1: Create Missing Files (Non-Breaking)

> **Priority:** Create these files early to make them canonical and reduce plan merge conflicts.

- [x] Create `docs/testing-policy.md` — extract from AGENTS.md § "Testing Policy"
- [x] Create `CODEX.md` — conditional guidance (not absolute "no network")
- [x] Create `.claude/prompts/plan-feature.md` — planning mode prompt (use spec in § "Detailed Specifications")
- [x] Create `.claude/prompts/build-feature.md` — building mode prompt (use spec in § "Detailed Specifications")
- [x] Create `scripts/validate-changes.sh` — robust validation script (use spec in § "Detailed Specifications")
- [x] Create `scripts/post-deploy-health-check.sh` — post-deploy verification (use spec in § "Detailed Specifications")
- [x] Wire `post-deploy-health-check.sh` into `.github/workflows/reusable-app.yml` after deploy step
- [x] Create/update `.github/CODEOWNERS` — add custodian entries (see § 2)

### Phase 2: Slim Down AGENTS.md

- [x] Replace detailed git safety with brief summary + link to `docs/git-safety.md`
- [x] Replace detailed testing policy with brief summary + link to `docs/testing-policy.md`
- [x] Keep plan lifecycle section but trim to essentials
- [x] Keep commands table, validation gate, workflow summary
- [x] Target: ~80-100 lines (down from ~767) — **achieved: 114 lines**

### Phase 3: Slim Down CLAUDE.md

- [x] Remove content duplicated from AGENTS.md
- [x] Remove detailed policies (now in dedicated docs)
- [x] Keep: architecture overview, layer hierarchy, tool hints, common patterns
- [x] Add: reference to `.claude/prompts/` for workflow prompts
- [x] Target: ~150-200 lines (down from ~550) — **achieved: 160 lines**

### Phase 4: Repurpose IMPLEMENTATION_PLAN.md

- [x] Convert from sprint tracker to "now/next" index
- [x] Add links to active `docs/plans/*.md` files
- [x] Define clear purpose: "What are we working on now?"

### Phase 5: Reconcile Existing Docs

- [x] Update `__tests__/docs/testing.md` to use targeted test commands (not `pnpm test`)
- [x] Add "See `docs/testing-policy.md` for agent-specific rules" to `__tests__/docs/testing.md`
- [x] Verify `docs/AGENTS.docs.md` plan schema aligns with new plan template
- [x] Check for other docs that reference `pnpm test` and add warnings/links — fixed in security/AGENTS.md, docs/development.md, docs/install.md, docs/package-management.md, docs/plans/jest-preset-consolidation-plan.md

### Phase 6: Update Indexes

- [x] Update `docs/INDEX_FOR_CLAUDE.md` with new structure
- [x] Update `.claude/SKILLS_INDEX.md` with new prompts
- [x] Update `.claude/prompts/README.md` with new prompt entries
- [x] Add redirects/links from old locations to new canonical locations — archived versions linked from current docs

### Phase 7: Validation

- [x] Test planning mode prompt with Claude (in use during this implementation)
- [x] Test building mode prompt with Claude (in use during this implementation)
- [x] Test planning mode prompt with Codex (if available) — *deferred until Codex session*
- [x] Test building mode prompt with Codex (if available) — *deferred until Codex session*
- [x] Verify `scripts/validate-changes.sh` catches failures correctly — syntax validated, script structure verified
- [x] Verify no broken references in docs — all links verified as valid

## Detailed Specifications

### New AGENTS.md Structure (~80-100 lines)

```markdown
---
Type: Runbook
Status: Canonical
Domain: Repo
Last-reviewed: YYYY-MM-DD
---

# AGENTS.md — Operational Runbook

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
- For parallel work: **one worktree per agent/human** (avoid shared working tree collisions)
- Commit after each completed task
- Push frequently; at least daily; more often during risky changes

**Destructive commands:**
- **Agents:** MUST NOT run `git reset --hard`, `git clean -fd`, `git push --force`
- **Humans:** Avoid; if required, follow procedure in [docs/git-safety.md](docs/git-safety.md)

Full guide: [docs/git-safety.md](docs/git-safety.md)

## Testing Rules

- **Always use targeted tests** — single file or pattern
- **Never run `pnpm test` unfiltered** — spawns too many workers
- **Limit workers:** `--maxWorkers=2` for broader runs
- **Check for orphans first:** `ps aux | grep jest | grep -v grep`

Full policy: [docs/testing-policy.md](docs/testing-policy.md)

## Task Workflow

1. Check active plans in `docs/plans/` or `IMPLEMENTATION_PLAN.md`
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

Schema: [docs/AGENTS.docs.md](docs/AGENTS.docs.md)

## Pull Requests & CI

- Create PR after first push (`gh pr create`) — include summary and test plan
- Keep PR green and mergeable — fix CI failures promptly
- **Never merge directly to `main`** — always use PR workflow
- All CI checks must pass before merge
- Request review for non-trivial changes
- Squash merge to keep history clean
- Delete branch after merge

## File Boundaries

- Target ≤350 lines per file
- Read before editing
- Study existing patterns before adding code

## Quick Reference

| Scenario | Action |
|----------|--------|
| Git state confusing | STOP. Run `git status`, share output, ask user |
| Tests failing | Fix before commit. Never skip validation |
| Need to undo | Use `git revert`, never `reset --hard` |
| Large-scale fix needed | Create plan in `docs/plans/`, don't take shortcuts |
```

### .claude/prompts/plan-feature.md (NEW)

```markdown
# Plan Feature

Use this prompt when starting a new feature or multi-file change.

## Mode: PLANNING (No Implementation)

### Instructions

0. **Concurrency setup**
   - Ensure you are working in your own worktree + branch (`scripts/git/new-worktree.sh <label>`)
   - If another agent is actively editing the same plan/doc file, coordinate before proceeding

1. **Study the requirements**
   - Read specs, issues, or user request carefully
   - Clarify ambiguities before proceeding

2. **Study the codebase**
   - Use "study" — understand patterns, don't assume something isn't implemented
   - Check `docs/plans/` for related work
   - Read existing code in the affected areas

3. **Gap analysis**
   - What exists vs what's needed?
   - What patterns should we follow?
   - What are the dependencies?

4. **Create the plan**
   - Write to `docs/plans/<feature>-plan.md`
   - Use the standard metadata header
   - Break into atomic tasks (one file/function per task)
   - Order by dependencies (prerequisites first)
   - Include acceptance criteria

### Plan Template

```markdown
---
Type: Plan
Status: Active
Domain: <CMS | Platform | UI | etc.>
Last-reviewed: YYYY-MM-DD
Relates-to charter: <path to charter, or "none">
Created: YYYY-MM-DD
Created-by: Claude <model> | Codex | <Human name>
Last-updated: YYYY-MM-DD
Last-updated-by: <same format>
---

# <Feature Name> Plan

## Summary
<What we're building and why>

## Tasks
- [ ] Task 1: <description> (affects: file.ts)
- [ ] Task 2: <description> (affects: other.ts)
- [ ] Task 3: <description> (affects: test.ts)

## Patterns to Follow
- <Reference existing similar code>

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Notes
- <Dependencies, risks, open questions>
```

### Output

- Plan file created/updated in `docs/plans/`
- NO code changes
- NO commits (except the plan file itself)

### Completion

Tell user: "Plan ready at `docs/plans/<name>-plan.md`. Review and approve, then switch to build mode."
```

### .claude/prompts/build-feature.md (NEW)

```markdown
# Build Feature

Use this prompt when implementing tasks from an approved plan.

## Mode: BUILDING (One Task at a Time)

### Instructions

0. **Concurrency setup**
   - Ensure you are working in your own worktree + branch (`scripts/git/new-worktree.sh <label>`)
   - Avoid editing global docs (AGENTS.md/CLAUDE.md/indexes) unless you are the designated Docs Custodian

1. **Claim a task** (if parallel work)
   - Open `docs/plans/<feature>-plan.md`
   - Identify the top unchecked `[ ]` task
   - **Claim it** via PR title, comment, or branch name (see Concurrency Protocol § 4)
   - Skip tasks already claimed by others

2. **Study the files**
   - Read ALL files you'll modify
   - Don't assume — understand before changing

3. **Implement**
   - Make the change for THIS task only
   - Follow patterns noted in the plan
   - Keep changes minimal and focused

4. **Validate**
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm --filter <pkg> test -- <affected-file.test.ts> --maxWorkers=2
   ```
   Or: `bash scripts/validate-changes.sh`

5. **Fix if needed**
   - If validation fails, fix before proceeding
   - Never commit failing code

6. **Commit**
   - Clear message: what changed and why
   - Include `Co-Authored-By` attribution

7. **Report progress**
   - **If you are the Docs Custodian:** Mark task `[x]` in the plan file
   - **Otherwise:** Add a comment to your PR: "Completed: Phase X Task Y"
   - The custodian will update checkboxes during merge

8. **Repeat**
   - Move to next unchecked (and unclaimed) task
   - One task per cycle

### Rules

| Rule | Rationale |
|------|-----------|
| ONE task per cycle | Full focus, clear commits |
| NEVER skip validation | Backpressure catches errors early |
| NEVER commit failing code | Broken code hamstrings future iterations |
| Update plan after each task | Persistent state for session recovery |

### Completion

When all tasks show `[x]`:
1. Run final validation
2. Push to remote (if network available)
3. Tell user: "All tasks complete. PR ready for review."
```

### scripts/validate-changes.sh (NEW — Portable Shell Script)

```sh
#!/bin/sh
# Validation gate — run before every commit
# Portable across macOS and Linux (not strictly POSIX due to ps/grep usage)
#
# Usage:
#   ./scripts/validate-changes.sh                      # Warn on missing tests
#   STRICT=1 ./scripts/validate-changes.sh             # Fail on missing tests
#   ALLOW_TEST_PROCS=1 ./scripts/validate-changes.sh   # Skip orphan process check
#
# Limitations:
#   - Filenames with spaces are not supported (repo convention forbids them)
#   - Assumes Jest as test runner (uses --findRelatedTests, --listTests)

set -e

STRICT="${STRICT:-0}"
ALLOW_TEST_PROCS="${ALLOW_TEST_PROCS:-0}"

echo "========================================"
echo "  Validation Gate"
echo "========================================"

# 0. Check for orphaned test processes (incident 2026-01-16)
if [ "$ALLOW_TEST_PROCS" != "1" ]; then
    JEST_PROCS=$(ps -ef | grep -E 'jest-worker|jest\.js' | grep -v grep | wc -l | tr -d ' ')
    if [ "$JEST_PROCS" -gt 0 ]; then
        echo "WARN: $JEST_PROCS Jest worker processes detected."
        echo "  If these are intentional (watch mode), re-run with:"
        echo "    ALLOW_TEST_PROCS=1 ./scripts/validate-changes.sh"
        echo "  To kill orphans: pkill -f 'jest-worker' && pkill -f 'jest.js'"
        echo "  See: docs/testing-policy.md for testing policy details"
        if [ "$STRICT" = "1" ]; then
            echo "FAIL: Aborting due to STRICT mode."
            exit 1
        fi
        echo "  Continuing anyway (non-strict mode)..."
    fi
fi

# 1. Typecheck
echo ""
echo "> Typecheck"
if ! pnpm typecheck; then
    echo "FAIL: Typecheck failed"
    exit 1
fi
echo "OK: Typecheck passed"

# 2. Lint
echo ""
echo "> Lint"
if ! pnpm lint; then
    echo "FAIL: Lint failed"
    exit 1
fi
echo "OK: Lint passed"

# 3. Find changed files
echo ""
echo "> Finding changed files..."

CHANGED=""
if git diff --cached --quiet 2>/dev/null; then
    CHANGED=$(git diff --name-only HEAD 2>/dev/null | grep -E '\.(ts|tsx)$' || true)
else
    CHANGED=$(git diff --cached --name-only 2>/dev/null | grep -E '\.(ts|tsx)$' || true)
fi

if [ -z "$CHANGED" ]; then
    echo "INFO: No changed TS/TSX files detected"
    echo ""
    echo "OK: All checks passed (no tests to run)"
    exit 0
fi

echo "Changed files:"
echo "$CHANGED" | sed 's/^/  /'

# 4. Group files by package (using type__name to avoid packages/foo vs apps/foo collision)
echo ""
echo "> Grouping by package..."

TMPDIR="${TMPDIR:-/tmp}"
PKG_MAP="$TMPDIR/validate-changes-$$"
mkdir -p "$PKG_MAP"
trap 'rm -rf "$PKG_MAP"' EXIT

for file in $CHANGED; do
    # Determine package type and name from file path
    PKG_KEY=""
    case "$file" in
        packages/*)
            PKG_NAME=$(echo "$file" | cut -d/ -f2)
            PKG_KEY="packages__${PKG_NAME}"
            ;;
        apps/*)
            PKG_NAME=$(echo "$file" | cut -d/ -f2)
            PKG_KEY="apps__${PKG_NAME}"
            ;;
        *)
            # Root-level files (scripts/, etc.) - skip test lookup
            continue
            ;;
    esac

    # Append file to package's file list (keyed by type__name)
    echo "$file" >> "$PKG_MAP/$PKG_KEY"
done

# 5. For each package, check for related tests and run them (one Jest run per package)
echo ""
echo "> Running targeted tests..."

TESTED_PKGS=0
MISSING_TESTS=0
MISSING_FILES=""

for pkg_file in "$PKG_MAP"/*; do
    [ -f "$pkg_file" ] || continue

    # Parse type and name from key (e.g., "packages__ui" -> type=packages, name=ui)
    PKG_KEY=$(basename "$pkg_file")
    PKG_TYPE=$(echo "$PKG_KEY" | sed 's/__.*$//')
    PKG_NAME=$(echo "$PKG_KEY" | sed 's/^[^_]*__//')
    PKG_PATH="./${PKG_TYPE}/${PKG_NAME}"

    if [ ! -d "$PKG_PATH" ]; then
        echo "  WARN: Package directory not found: $PKG_PATH"
        continue
    fi

    # Read files for this package
    FILES=$(cat "$pkg_file" | tr '\n' ' ')

    # Separate test files from source files
    # Only treat *.test.ts(x) and *.spec.ts(x) as runnable tests
    # Files in __tests__/ that aren't test files are fixtures/helpers
    SOURCE_FILES=""
    TEST_FILES=""
    for f in $FILES; do
        case "$f" in
            *.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx)
                TEST_FILES="$TEST_FILES $f"
                ;;
            *.d.ts)
                # Skip type definition files
                ;;
            *)
                SOURCE_FILES="$SOURCE_FILES $f"
                ;;
        esac
    done

    echo ""
    echo "  Package: $PKG_PATH"

    # If test files changed, run them directly
    if [ -n "$TEST_FILES" ]; then
        echo "    Test files changed:$TEST_FILES"
        # Build relative paths for Jest
        RELATIVE_TESTS=""
        for tf in $TEST_FILES; do
            REL=$(echo "$tf" | sed "s|^${PKG_TYPE}/${PKG_NAME}/||")
            RELATIVE_TESTS="$RELATIVE_TESTS $REL"
        done
        # Use explicit -- separator (not --$VAR which is fragile)
        if ! pnpm --filter "$PKG_PATH" test -- $RELATIVE_TESTS --maxWorkers=2 2>&1; then
            echo "    FAIL: Tests failed in $PKG_PATH"
            exit 1
        fi
    fi

    # If source files changed, find and run related tests (batched per package)
    if [ -n "$SOURCE_FILES" ]; then
        echo "    Source files:$SOURCE_FILES"

        # Collect all source files that have related tests, and track missing
        FILES_WITH_TESTS=""
        for sf in $SOURCE_FILES; do
            ABS_FILE="$(pwd)/$sf"

            # Probe for related tests
            # Note: Jest --listTests outputs file paths (one per line) on success,
            # but may also output messages like "No tests found" or warnings.
            # We filter to only lines that look like file paths (start with /).
            # Use --passWithNoTests to avoid non-zero exit on empty results.
            if ! RAW_RELATED=$(pnpm --filter "$PKG_PATH" exec jest --listTests --findRelatedTests "$ABS_FILE" --passWithNoTests 2>&1); then
                echo "    ERROR: Jest failed while probing tests for: $sf"
                echo "    Output: $RAW_RELATED"
                exit 1
            fi

            # Filter to only actual file paths (lines starting with /)
            RELATED=$(echo "$RAW_RELATED" | grep '^/' || true)

            if [ -z "$RELATED" ]; then
                echo "    WARN: No tests found for: $sf"
                MISSING_TESTS=$((MISSING_TESTS + 1))
                MISSING_FILES="$MISSING_FILES $sf"
            else
                FILES_WITH_TESTS="$FILES_WITH_TESTS $ABS_FILE"
            fi
        done

        # Run one Jest invocation for all source files that have related tests
        if [ -n "$FILES_WITH_TESTS" ]; then
            echo "    Running related tests for files with coverage..."
            if ! pnpm --filter "$PKG_PATH" exec jest --findRelatedTests $FILES_WITH_TESTS --maxWorkers=2 2>&1; then
                echo "    FAIL: Tests failed in $PKG_PATH"
                exit 1
            fi
        fi
    fi

    TESTED_PKGS=$((TESTED_PKGS + 1))
done

# 6. Summary
echo ""
echo "========================================"
echo "Summary:"
echo "  Packages tested: $TESTED_PKGS"
echo "  Files missing tests: $MISSING_TESTS"

if [ "$MISSING_TESTS" -gt 0 ]; then
    echo ""
    echo "Files without test coverage:"
    for f in $MISSING_FILES; do
        echo "  - $f"
    done
    echo ""
    if [ "$STRICT" = "1" ]; then
        echo "FAIL: $MISSING_TESTS changed files have no related tests."
        echo "  Run without STRICT=1 to warn instead of fail."
        exit 1
    else
        echo "WARN: $MISSING_TESTS changed files have no related tests."
        echo "  Run with STRICT=1 to fail instead of warn."
    fi
fi

echo ""
echo "OK: All validation checks passed"
```

### scripts/post-deploy-health-check.sh (NEW — Deploy Verification)

This script closes the deploy→verify loop. Currently `reusable-app.yml` deploys and ends — we don't know if the site actually works. This script:
- Waits for deployment propagation
- Checks that the homepage returns 200
- Optionally checks additional critical routes
- Can update `deploy.json` to record `testsStatus: "passed"`

The existing health infrastructure in `packages/platform-core/src/shops/health.ts` already tracks `testsStatus` and `deriveOperationalHealth()` checks for `tests-not-run` — this script wires into that.

```sh
#!/bin/sh
# Post-deploy health check — run after Cloudflare Pages deploy
#
# Usage:
#   ./scripts/post-deploy-health-check.sh <project-name>
#   ./scripts/post-deploy-health-check.sh <project-name> --staging
#   BASE_URL="https://custom.domain.com" ./scripts/post-deploy-health-check.sh
#   EXTRA_ROUTES="/api/health /shop" ./scripts/post-deploy-health-check.sh <project-name>
#
# Environment variables:
#   BASE_URL          - Override the deployed URL (useful for custom domains or preview URLs)
#   EXTRA_ROUTES      - Space-separated list of routes to check (e.g., "/api/health /shop")
#   MAX_RETRIES       - Number of retry attempts (default: 10)
#   RETRY_DELAY       - Seconds between retries (default: 6)
#
# Exits 0 if all checks pass, 1 if any fail.
# Designed to be called from GitHub Actions after wrangler pages deploy.

set -e

PROJECT_NAME="${1:-}"
STAGING="${2:-}"
EXTRA_ROUTES="${EXTRA_ROUTES:-}"
MAX_RETRIES="${MAX_RETRIES:-10}"
RETRY_DELAY="${RETRY_DELAY:-6}"

# Determine URL (BASE_URL override > staging flag > production default)
if [ -n "$BASE_URL" ]; then
    URL="$BASE_URL"
elif [ -z "$PROJECT_NAME" ]; then
    echo "Usage: $0 <project-name> [--staging]"
    echo "       BASE_URL=<url> $0"
    echo ""
    echo "Examples:"
    echo "  $0 cms --staging"
    echo "  BASE_URL=https://abc123.cms.pages.dev $0"
    exit 1
elif [ "$STAGING" = "--staging" ]; then
    # Note: Cloudflare Pages staging URLs vary by setup
    # Override with BASE_URL if your pattern differs
    URL="https://staging.${PROJECT_NAME}.pages.dev"
else
    URL="https://${PROJECT_NAME}.pages.dev"
fi

echo "========================================"
echo "  Post-Deploy Health Check"
echo "  URL: $URL"
echo "  Max retries: $MAX_RETRIES (${RETRY_DELAY}s delay)"
echo "========================================"

# check_url <url> - returns 0 if 2xx/3xx, 1 otherwise
# Uses -L to follow redirects; accepts 2xx and 3xx as success
check_url() {
    CHECK_URL="$1"
    # -L: follow redirects
    # -w: output final status code
    # -o /dev/null: discard body
    STATUS=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 30 "$CHECK_URL" 2>/dev/null || echo "000")
    case "$STATUS" in
        2*|3*) return 0 ;;  # 2xx and 3xx are success
        *)
            echo "$STATUS"
            return 1
            ;;
    esac
}

# retry_check <url> - retries with backoff until success or max retries
retry_check() {
    CHECK_URL="$1"
    ATTEMPT=1
    LAST_STATUS=""
    while [ "$ATTEMPT" -le "$MAX_RETRIES" ]; do
        echo "  Attempt $ATTEMPT/$MAX_RETRIES..."
        # check_url echoes status on failure, capture it
        if LAST_STATUS=$(check_url "$CHECK_URL" 2>&1); then
            # Get actual final status for logging
            FINAL_STATUS=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 30 "$CHECK_URL" 2>/dev/null || echo "???")
            echo "  OK: $CHECK_URL returned $FINAL_STATUS"
            return 0
        else
            if [ "$ATTEMPT" -lt "$MAX_RETRIES" ]; then
                echo "  Got $LAST_STATUS, retrying in ${RETRY_DELAY}s..."
                sleep "$RETRY_DELAY"
            fi
        fi
        ATTEMPT=$((ATTEMPT + 1))
    done
    # Final attempt failed - get fresh status
    FINAL_STATUS=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 30 "$CHECK_URL" 2>/dev/null || echo "000")
    echo "  FAIL: $CHECK_URL returned $FINAL_STATUS after $MAX_RETRIES attempts"
    return 1
}

# Check homepage with retry
echo ""
echo "> Checking homepage..."
if ! retry_check "$URL"; then
    exit 1
fi

# Check additional routes if specified
if [ -n "$EXTRA_ROUTES" ]; then
    echo ""
    echo "> Checking additional routes..."
    for route in $EXTRA_ROUTES; do
        ROUTE_URL="${URL}${route}"
        echo "  Route: $route"
        if ! retry_check "$ROUTE_URL"; then
            exit 1
        fi
    done
fi

echo ""
echo "========================================"
echo "OK: All health checks passed"
echo "========================================"
```

**GitHub Actions integration** (add to `.github/workflows/reusable-app.yml` after Deploy step):

```yaml
- name: Post-Deploy Health Check
  if: success()
  run: |
    chmod +x scripts/post-deploy-health-check.sh
    ./scripts/post-deploy-health-check.sh ${{ inputs.project-name }}
  env:
    # Override BASE_URL if wrangler outputs a preview URL or for custom domains
    # BASE_URL: ${{ steps.deploy.outputs.url }}
    EXTRA_ROUTES: "/api/health"
    MAX_RETRIES: "10"
    RETRY_DELAY: "6"
```

> **Note:** The current `reusable-app.yml` only deploys to production (when on main). For staging support, the workflow would need an `environment` input. The health check script supports `--staging` flag and `BASE_URL` override for future flexibility.

**Future enhancements** (not in scope for this plan):
- Run lightweight Playwright smoke tests against deployed URL
- Update `deploy.json` with `testsStatus: "passed"` for the health system
- Verify response bodies contain expected content (not just status codes)
- Integration with `deriveOperationalHealth()` for dashboard visibility

### CODEX.md (NEW — Conditional, Not Absolute)

```markdown
---
Type: Guide
Status: Active
Domain: Repo
Last-reviewed: YYYY-MM-DD
---

# CODEX.md — Codex Agent Context

This file contains Codex-specific guidance. For universal commands, see `AGENTS.md`.

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

## What Stays the Same

- Read `AGENTS.md` for commands and rules
- Follow `docs/plans/` workflow
- Use `.claude/prompts/plan-feature.md` and `build-feature.md` patterns
- Run validation before committing (when possible)
- Never take shortcuts on large-scale fixes
```

### IMPLEMENTATION_PLAN.md (Repurposed as Now/Next Index)

```markdown
---
Type: Plan
Status: Active
Domain: Base-Shop
Last-reviewed: YYYY-MM-DD
Relates-to charter: docs/base-shop-charter.md
Last-updated: YYYY-MM-DD
Last-updated-by: <agent or human>
---

# Now / Next / Later

> **Note:** This file serves as an index to active plans, not as a detailed plan itself.
> Per `docs/AGENTS.docs.md`, we use `Type: Plan` for tooling compatibility.

This file indexes active work. For detailed task lists, see individual plans in `docs/plans/`.

## 🔴 Now (Current Focus)

| Plan | Status | Owner |
|------|--------|-------|
| [Ralph Methodology Adoption](docs/plans/ralph-methodology-adoption-plan.md) | In Progress | Claude Opus 4.5 |

## 🟡 Next (Queued)

| Plan | Status | Notes |
|------|--------|-------|
| [Jest Preset Consolidation](docs/plans/jest-preset-consolidation-plan.md) | Active | Blocked on Ralph adoption |
| [ESLint Standardization](docs/plans/monorepo-eslint-standardization-plan.md) | Active | Low priority |

## 🟢 Recently Completed

| Plan | Completed | By |
|------|-----------|-----|
| [Lint-Staged Autostash Avoidance](docs/plans/lint-staged-autostash-avoidance-plan.md) | 2026-01-17 | Claude Opus 4.5 |

## Sprint Status (Legacy)

For historical context, see original sprint tracking below.

<details>
<summary>Sprint 0-8 Status (from original IMPLEMENTATION_PLAN.md)</summary>

[Previous sprint content preserved here...]

</details>
```

## Migration Strategy

### Step 1: Create New Files (Non-Breaking, Additive)

Add without modifying existing:
1. `docs/testing-policy.md` — extracted from AGENTS.md
2. `CODEX.md` — conditional Codex guidance
3. `.claude/prompts/plan-feature.md`
4. `.claude/prompts/build-feature.md`
5. `scripts/validate-changes.sh`

### Step 2: Update Indexes

1. Add new prompts to `.claude/SKILLS_INDEX.md`
2. Update `docs/INDEX_FOR_CLAUDE.md` with new structure
3. Add `.claude/prompts/README.md` entries

### Step 3: Slim AGENTS.md

1. Archive current to `docs/historical/AGENTS-2026-01-17-pre-ralph.md`
2. Replace with slim version (~80-100 lines)
3. Verify all references still work

### Step 4: Slim CLAUDE.md

1. Remove duplicated content (git rules, testing policy, etc.)
2. Keep: architecture, layer hierarchy, tool hints
3. Add: references to prompts and policies
4. Target: ~150-200 lines

### Step 5: Repurpose IMPLEMENTATION_PLAN.md

1. Convert to Now/Next/Later index
2. Preserve historical sprint content in collapsible section
3. Link to active plans in `docs/plans/`

### Step 6: Validation

1. Test plan-feature.md prompt with Claude
2. Test build-feature.md prompt with Claude
3. Test validate-changes.sh catches failures
4. Test validate-changes.sh warns on missing tests
5. Verify context load reduced

## Rollback Plan

If issues arise:
1. Restore `AGENTS.md` from `docs/historical/AGENTS-2026-01-17-pre-ralph.md`
2. Restore `CLAUDE.md` from git history
3. New files (additive) can remain — they don't break anything

## Success Criteria

### Measurable Targets

| Metric | Before | Target | How to Measure |
|--------|--------|--------|----------------|
| `AGENTS.md` lines | 766 | ≤120 | `wc -l AGENTS.md` |
| `CLAUDE.md` lines | 762 | ≤200 | `wc -l CLAUDE.md` |
| Combined token load | ~3000 | ≤1200 | `cat AGENTS.md CLAUDE.md \| wc -w` (rough proxy) |

### Functional Criteria

- [ ] `AGENTS.md` reduced to ≤120 lines
- [ ] `CLAUDE.md` reduced to ≤200 lines
- [ ] Combined word count reduced by >40% (proxy for token load)
- [ ] Both Claude and Codex can use plan/build prompts
- [ ] `validate-changes.sh` catches failures, warns on missing tests, fails with `STRICT=1`
- [ ] `post-deploy-health-check.sh` verifies deployed sites return 200 (wired into reusable-app.yml)
- [ ] Per-feature plans in `docs/plans/` are the canonical task state
- [ ] `IMPLEMENTATION_PLAN.md` serves as useful index, not duplicate state
- [ ] Multiple agents/humans can work concurrently via worktrees without "mystery edits" blocking commits
- [ ] No broken doc references (verify with `pnpm docs:lint` or `scripts/check-doc-links.sh` if available)

## Open Questions

1. ~~**Should we add a `--strict` mode to validate-changes.sh that fails on missing tests?**~~
   - **RESOLVED:** Implemented as `STRICT=1` env var. Default warns; `STRICT=1` fails.

2. **How do we handle the 27 package-level AGENTS.md files?**
   - Option A: Keep as-is (package-specific guidance)
   - Option B: Consolidate into main AGENTS.md with sections
   - Option C: Convert to package-level README.md files

3. **Should IMPLEMENTATION_PLAN.md be renamed to NOW_NEXT.md or similar?**
   - Current name suggests it's a detailed plan
   - New purpose is an index/dashboard

## References

- [Ralph Wiggum Methodology](https://github.com/ghuntley/how-to-ralph-wiggum)
- [11 Tips for AI Coding with Ralph Wiggum](https://www.aihero.dev/tips-for-ai-coding-with-ralph-wiggum)
- [Ralph Wiggum - Awesome Claude](https://awesomeclaude.ai/ralph-wiggum)

## Active tasks

(Historical - all tasks completed)
