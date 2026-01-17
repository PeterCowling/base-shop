---
Type: Plan
Status: Active
Domain: Repo
Created: 2026-01-17
Created-by: Claude Opus 4.5
Last-updated: 2026-01-17
Last-updated-by: Claude Opus 4.5
---

# Ralph Methodology Adoption Plan

## Overview

Adopt Ralph Wiggum methodology principles for agent-agnostic, iteration-based development. This is a **consolidation plan** — we integrate Ralph patterns into the existing structure rather than creating parallel systems.

## Goals

1. **Slim down `AGENTS.md`** from ~767 lines to ~80-100 lines (operational focus)
2. **Reuse existing structure** — `.claude/prompts/`, `docs/plans/`, existing policy docs
3. **Add planning/building mode prompts** to `.claude/prompts/` (not new `.agent/` dir)
4. **Clarify persistent task state** — per-feature plans in `docs/plans/`, root `IMPLEMENTATION_PLAN.md` becomes index
5. **Strengthen backpressure** with robust validation script
6. **Create agent-neutral guidance** that works for Claude, Codex, and future agents

## Current State Analysis

### What Already Exists (KEEP)

| File/Dir | Lines | Purpose | Action |
|----------|-------|---------|--------|
| `AGENTS.md` | 766 | Universal runbook | **SLIM** to ~100-120 lines |
| `CLAUDE.md` | 762 | Claude-specific | **SLIM** to ~200 lines, remove duplication |
| `docs/git-safety.md` | 408 | Full git safety guide | **KEEP** as canonical |
| `docs/git-hooks.md` | 314 | Hook documentation | **KEEP** as canonical |
| `docs/incident-prevention.md` | 90 | Protection layers summary | **KEEP** as canonical |
| `docs/RECOVERY-PLAN-2026-01-14.md` | ~300 | Incident details | **KEEP** in place |
| `docs/plans/` | 27 files | Per-feature plans | **KEEP** — this IS the task state |
| `docs/historical/plans/` | 3 files | Archived plans | **KEEP** as archive |
| `.claude/prompts/` | 11 files | Task prompts for Claude | **EXTEND** with plan/build modes |
| `.claude/SKILLS_INDEX.md` | ~200 | Skills catalog | **UPDATE** index |
| `docs/INDEX_FOR_CLAUDE.md` | ~390 | Quick reference | **UPDATE** with new structure |
| `docs/AGENTS.docs.md` | ~150 | AI-first doc runbook | **KEEP** — defines plan metadata schema |
| `__tests__/docs/testing.md` | ~75 | Testing guide | **UPDATE** to align with testing policy |
| `IMPLEMENTATION_PLAN.md` | ~93 | Sprint/feature tracker | **REPURPOSE** as now/next index |

### What Doesn't Exist (CREATE)

| File | Purpose |
|------|---------|
| `CODEX.md` | Codex-specific context (conditional, not absolute) |
| `.claude/prompts/plan-feature.md` | Planning mode prompt |
| `.claude/prompts/build-feature.md` | Building mode prompt |
| `scripts/validate-changes.sh` | Robust backpressure script |

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
| Incident details | `docs/RECOVERY-PLAN-2026-01-14.md` | docs/git-safety.md |
| Protection layers | `docs/incident-prevention.md` | AGENTS.md |
| Testing policy | `docs/testing-policy.md` (NEW) | AGENTS.md (brief), CLAUDE.md, `__tests__/docs/testing.md` |
| Plan metadata schema | `docs/AGENTS.docs.md` § "Plan docs follow a shared pattern" | AGENTS.md, plan templates |
| Commands reference | `AGENTS.md` | CLAUDE.md, INDEX_FOR_CLAUDE.md |
| Feature task state | `docs/plans/<feature>-plan.md` | IMPLEMENTATION_PLAN.md (index) |
| Claude tool hints | `CLAUDE.md` | — |
| Codex environment | `CODEX.md` | — |

### Plan Metadata Schema (Canonical Definition)

The canonical plan metadata schema is defined in `docs/AGENTS.docs.md`. All plan templates MUST use this schema:

```yaml
Type: Plan
Status: Active | Completed | Superseded | Frozen
Domain: <CMS | Runtime | Platform | Commerce | etc.>
Last-reviewed: YYYY-MM-DD          # Required
Relates-to charter: <path>          # Optional, when plan implements a charter
Created: YYYY-MM-DD                 # Optional but recommended
Created-by: <Human | Claude <model> | Codex>  # Optional but recommended
Last-updated: YYYY-MM-DD            # Optional
Last-updated-by: <same format>      # Optional
```

**Note:** `Last-reviewed` and `Relates-to charter` come from `docs/AGENTS.docs.md`. `Created`/`Created-by` were added for attribution tracking. Both are valid; prefer the full set for new plans.

## Tasks

### Phase 1: Create Missing Files (Non-Breaking)

- [ ] Create `docs/testing-policy.md` — extract from AGENTS.md § "Testing Policy"
- [ ] Create `CODEX.md` — conditional guidance (not absolute "no network")
- [ ] Create `.claude/prompts/plan-feature.md` — planning mode prompt (use canonical schema from `docs/AGENTS.docs.md`)
- [ ] Create `.claude/prompts/build-feature.md` — building mode prompt
- [ ] Create `scripts/validate-changes.sh` — robust validation script (POSIX-compatible, no bash 4+ features)

### Phase 2: Slim Down AGENTS.md

- [ ] Replace detailed git safety with brief summary + link to `docs/git-safety.md`
- [ ] Replace detailed testing policy with brief summary + link to `docs/testing-policy.md`
- [ ] Keep plan lifecycle section but trim to essentials
- [ ] Keep commands table, validation gate, workflow summary
- [ ] Target: ~80-100 lines (down from ~767)

### Phase 3: Slim Down CLAUDE.md

- [ ] Remove content duplicated from AGENTS.md
- [ ] Remove detailed policies (now in dedicated docs)
- [ ] Keep: architecture overview, layer hierarchy, tool hints, common patterns
- [ ] Add: reference to `.claude/prompts/` for workflow prompts
- [ ] Target: ~150-200 lines (down from ~550)

### Phase 4: Repurpose IMPLEMENTATION_PLAN.md

- [ ] Convert from sprint tracker to "now/next" index
- [ ] Add links to active `docs/plans/*.md` files
- [ ] Define clear purpose: "What are we working on now?"

### Phase 5: Reconcile Existing Docs

- [ ] Update `__tests__/docs/testing.md` to use targeted test commands (not `pnpm test`)
- [ ] Add "See `docs/testing-policy.md` for agent-specific rules" to `__tests__/docs/testing.md`
- [ ] Verify `docs/AGENTS.docs.md` plan schema aligns with new plan template
- [ ] Check for other docs that reference `pnpm test` and add warnings/links

### Phase 6: Update Indexes

- [ ] Update `docs/INDEX_FOR_CLAUDE.md` with new structure
- [ ] Update `.claude/SKILLS_INDEX.md` with new prompts
- [ ] Update `.claude/prompts/README.md` with new prompt entries
- [ ] Add redirects/links from old locations to new canonical locations

### Phase 7: Validation

- [ ] Test planning mode prompt with Claude
- [ ] Test building mode prompt with Claude
- [ ] Test planning mode prompt with Codex (if available)
- [ ] Test building mode prompt with Codex (if available)
- [ ] Verify `scripts/validate-changes.sh` catches failures correctly
- [ ] Verify no broken references in docs

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
- Commit after each completed task
- Push every 2 hours or 3 commits
- **NEVER run:** `git reset --hard`, `git clean -fd`, `git push --force`

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
- Required metadata: Type, Status, Domain, Created, Created-by

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

1. **Read the plan**
   - Open `docs/plans/<feature>-plan.md`
   - Identify the top unchecked `[ ]` task

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

7. **Update plan**
   - Mark task `[x]` in the plan file
   - Update `Last-updated` and `Last-updated-by`

8. **Repeat**
   - Move to next unchecked task
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

### scripts/validate-changes.sh (NEW — Robust Version)

```bash
#!/bin/bash
# Validation gate — run before every commit
# Fails loud when it can't map changes to tests

set -e

echo "╔════════════════════════════════════════╗"
echo "║  Validation Gate                       ║"
echo "╚════════════════════════════════════════╝"

# 1. Typecheck
echo ""
echo "▶ Typecheck"
pnpm typecheck || { echo "❌ Typecheck failed"; exit 1; }
echo "✓ Typecheck passed"

# 2. Lint
echo ""
echo "▶ Lint"
pnpm lint || { echo "❌ Lint failed"; exit 1; }
echo "✓ Lint passed"

# 3. Find changed files
echo ""
echo "▶ Finding changed files..."

CHANGED=""
if git diff --cached --quiet 2>/dev/null; then
    # No staged changes, check working tree
    CHANGED=$(git diff --name-only HEAD 2>/dev/null | grep -E '\.(ts|tsx)$' || true)
else
    # Use staged changes
    CHANGED=$(git diff --cached --name-only 2>/dev/null | grep -E '\.(ts|tsx)$' || true)
fi

if [ -z "$CHANGED" ]; then
    echo "ℹ No changed TS/TSX files detected"
    echo ""
    echo "✓ All checks passed (no tests to run)"
    exit 0
fi

echo "Changed files:"
echo "$CHANGED" | sed 's/^/  /'

# 4. Map changes to packages and tests
echo ""
echo "▶ Running targeted tests..."

TESTED=0
SKIPPED=0
declare -A PACKAGES_TESTED

for file in $CHANGED; do
    # Skip test files themselves, .d.ts files
    if [[ "$file" == *.test.ts* ]] || [[ "$file" == *.spec.ts* ]] || [[ "$file" == *.d.ts ]]; then
        continue
    fi

    # Determine package from path
    PKG_PATH=""
    FILTER=""

    if [[ "$file" == packages/* ]]; then
        PKG_NAME=$(echo "$file" | cut -d/ -f2)
        PKG_PATH="packages/$PKG_NAME"
        FILTER="@acme/$PKG_NAME"
    elif [[ "$file" == apps/* ]]; then
        PKG_NAME=$(echo "$file" | cut -d/ -f2)
        PKG_PATH="apps/$PKG_NAME"
        FILTER="@apps/$PKG_NAME"
    else
        echo "  ⚠ Cannot map to package: $file"
        ((SKIPPED++))
        continue
    fi

    # Find corresponding test file
    BASE="${file%.ts}"
    BASE="${BASE%.tsx}"
    TEST_FILE=""

    for pattern in "${BASE}.test.ts" "${BASE}.test.tsx" "${BASE}.spec.ts" "${BASE}.spec.tsx"; do
        if [ -f "$pattern" ]; then
            TEST_FILE="$pattern"
            break
        fi
    done

    if [ -z "$TEST_FILE" ]; then
        echo "  ⚠ No test file found for: $file"
        ((SKIPPED++))
        continue
    fi

    # Run test (skip if we already tested this package with same file)
    TEST_KEY="${FILTER}:${TEST_FILE}"
    if [ -z "${PACKAGES_TESTED[$TEST_KEY]}" ]; then
        echo "  ▶ Testing: $TEST_FILE"
        if pnpm --filter "$FILTER" test -- "$TEST_FILE" --maxWorkers=2 2>&1; then
            echo "  ✓ Passed: $TEST_FILE"
            ((TESTED++))
        else
            echo "  ❌ Failed: $TEST_FILE"
            exit 1
        fi
        PACKAGES_TESTED[$TEST_KEY]=1
    fi
done

# 5. Summary
echo ""
echo "════════════════════════════════════════"
echo "Summary:"
echo "  Tests run: $TESTED"
echo "  Skipped (no test found): $SKIPPED"

if [ $SKIPPED -gt 0 ]; then
    echo ""
    echo "⚠ Warning: $SKIPPED changed files have no corresponding tests."
    echo "  Consider adding tests for these files."
fi

echo ""
echo "✓ All validation checks passed"
```

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

### IMPLEMENTATION_PLAN.md (Repurposed as Index)

```markdown
---
Type: Index
Status: Active
Domain: Base-Shop
Last-updated: YYYY-MM-DD
Last-updated-by: <agent or human>
---

# Now / Next / Later

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

- [ ] `AGENTS.md` reduced to ~80-100 lines
- [ ] `CLAUDE.md` reduced to ~150-200 lines
- [ ] Both Claude and Codex can use plan/build prompts
- [ ] `validate-changes.sh` catches failures AND warns on missing tests
- [ ] Per-feature plans in `docs/plans/` are the canonical task state
- [ ] `IMPLEMENTATION_PLAN.md` serves as useful index, not duplicate state
- [ ] No broken references in docs
- [ ] Total agent context load reduced by >40%

## Open Questions

1. **Should we add a `--strict` mode to validate-changes.sh that fails on missing tests?**
   - Pro: Enforces test coverage
   - Con: May block legitimate changes to untested code

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
