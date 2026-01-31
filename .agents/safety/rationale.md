# Safety Rules Rationale

This document explains WHY each safety rule exists, including incident history and safe alternatives.

## Git Safety Rules

### `git reset --hard` — PROHIBITED for agents

**Why dangerous:**
- Permanently discards all uncommitted changes (staged and unstaged)
- Cannot be undone — work is lost forever
- Often used reflexively when "things are messy" but destroys valuable work

**Incident history:**
- **2026-01-14**: An agent ran `git reset --hard` during cleanup, losing large amounts of work. Recovery took days. See `docs/historical/RECOVERY-PLAN-2026-01-14.md` for details.

**Safe alternatives:**
| Instead of | Do this |
|------------|---------|
| `git reset --hard` | Make a checkpoint commit on `dev`, then use `git revert` to undo changes safely |
| Undo last commit | `git revert HEAD` (creates a new commit; no history rewrite) |
| Discard one file | `git restore --source <commit-hash> -- <file>` (targeted, not global) |
| Start fresh | Create a fresh clone from a clean base and abandon the broken checkout (do not use worktrees) |

**If a human truly needs to do this anyway:** follow `docs/git-safety.md` and create a backup branch first. Agents must not run `git reset --hard`.

---

### `git push --force` — PROHIBITED for agents

**Why dangerous:**
- Overwrites remote history
- Affects ALL collaborators who have pulled the branch
- Can cause permanent loss of commits others depend on
- CI pipelines may have already run on overwritten commits

**Incident history:**
- No specific incidents in this repo, but industry-standard prohibition

**Safe alternatives:**
| Instead of | Do this |
|------------|---------|
| `git push --force` | Create a new branch and PR instead of rewriting history |
| Fix pushed commit | `git revert <commit>` (creates a new commit; preserves history) |
| Update branch | `git fetch origin --prune` then merge (avoid rebase) |

**If a human truly needs to do this anyway:** follow `docs/git-safety.md` and coordinate with the team. Agents must not force-push.

---

### `git clean -fd` — PROHIBITED for agents

**Why dangerous:**
- Permanently deletes ALL untracked files
- Includes files you forgot to `git add`
- Includes new files you haven't committed yet
- Cannot be undone — files are gone forever

**Safe alternatives:**
| Instead of | Do this |
|------------|---------|
| `git clean -fd` | `git clean -n` (dry run — shows what WOULD be deleted) |
| Remove specific files | `rm <file>` (targeted, reversible with trash) |
| Ignore generated files | Add to `.gitignore` instead of deleting |

**If a human truly needs to do this anyway:** review `git clean -n` output first and follow `docs/git-safety.md`. Agents must not run `git clean -fd`.

---

## Test Safety Rules

### `pnpm test` (unfiltered) — PROHIBITED

**Why dangerous:**
- Spawns many Jest workers simultaneously
- Can exhaust system memory and crash the machine
- Makes the system unresponsive
- Tests may timeout and produce false failures

**Safe alternatives:**
| Instead of | Do this |
|------------|---------|
| `pnpm test` | `pnpm --filter <pkg> test -- path/to/file.test.ts` |
| Run multiple tests | `pnpm --filter <pkg> test -- --testPathPattern="pattern"` |
| Run all (if needed) | `pnpm --filter <pkg> test -- --maxWorkers=2` |

**Reference:** See `docs/testing-policy.md` for full testing guidelines.

---

## Branch Safety Rules

### Committing to `main` / `staging` — PROHIBITED

**Why dangerous:**
- `main` is the production branch; `staging` deploys to staging
- Direct commits bypass the release pipeline
- Can break CI/CD pipelines
- Harder to rollback than reverting a PR

**Safe alternatives:**
- Commit on `dev`
- Ship via PR `dev` → `staging` (auto-merge)
- Promote via PR `staging` → `main` (auto-merge)
- Let CI validate changes before merges

---

## File Safety Rules

### `rm -rf` on project directories — PROHIBITED for agents

**Why dangerous:**
- Recursive deletion is permanent
- Easy to mistype path and delete wrong directory
- No recycle bin — files are gone immediately
- Can delete uncommitted work, dependencies, or configuration

**Safe alternatives:**
| Instead of | Do this |
|------------|---------|
| `rm -rf node_modules` | `pnpm store prune` (cleans pnpm store safely) |
| Clean build outputs | `pnpm clean` or specific `rm -rf dist/` |
| Delete specific files | `rm <file>` (non-recursive, targeted) |

**If a human truly needs to do this anyway:** double-check the exact path and follow `docs/git-safety.md`. Agents must not run recursive deletes on project directories.

---

## Architectural Safety Rules

### UI Layer Hierarchy Violations — FIX BEFORE COMMIT

**Why important:**
- Atomic Design enforces one-way dependencies: Atoms → Molecules → Organisms → Templates → Pages
- Violations create circular dependencies that break builds
- Makes components harder to test in isolation
- Increases coupling and reduces reusability

**The hierarchy:**
```
Pages (apps/*/src/app/)
  ↑
Templates (packages/ui/components/templates/)
  ↑
Organisms (packages/ui/components/organisms/)
  ↑
Molecules (packages/ui/components/molecules/)
  ↑
Atoms (packages/ui/components/atoms/)
```

**How to detect violations:**
```bash
# Check for imports going the wrong direction
# Example: An atom importing from molecules
grep -r "from.*molecules" packages/ui/components/atoms/
```

**Common violations:**
| Violation | Fix |
|-----------|-----|
| Atom imports Molecule | Extract shared logic to a hook or util |
| Molecule imports Organism | Move shared code down to molecule level |
| Lower layer imports Page | Never do this — pages are endpoints |

**Reference:** See `docs/architecture.md` for full layering rules.

---

### Package Import Boundaries — FIX BEFORE COMMIT

**Why important:**
- Packages expose deliberate public APIs via `exports` map
- Internal paths (`src/internal/**`) can change without notice
- Importing internals creates fragile dependencies
- Breaks encapsulation and makes refactoring dangerous

**The rule:**
```typescript
// ✅ Good — use package exports
import { getShop } from '@acme/platform-core'
import { Button } from '@acme/ui'

// ❌ Bad — importing from internal paths
import { getShop } from '@acme/platform-core/src/internal/shops'
import { something } from '@acme/ui/src/components/atoms/Button'
```

**Package layering (high to low):**
```
Apps (apps/*)
  ↓
CMS-only packages (@acme/cms-marketing, @acme/configurator)
  ↓
@acme/ui (design system)
  ↓
@acme/platform-core (domain logic, persistence)
  ↓
Low-level libraries (@acme/types, @acme/date-utils, etc.)
```

**How to detect violations:**
```bash
# Find imports from internal package paths
grep -r "from '@acme/[^']*\/src\/" apps/ packages/
```

**When you need something not exported:**
1. Check if it's intentionally internal (probably is)
2. If legitimately needed, propose adding it to the package's public API
3. Never work around by importing from `src/`

**Reference:** See `docs/architecture.md` § "Package layering and public surfaces"

---

### ESM/CJS Module Compatibility — USE JEST_FORCE_CJS

**Why important:**
- Monorepo has mixed ESM and CJS modules
- Jest historically expects CJS
- ESM-only dependencies can cause transform errors
- `import.meta` is ESM-only and breaks in CJS context

**Common error patterns:**
- `Cannot use import statement outside a module`
- `import.meta is not defined`
- `SyntaxError: Unexpected token 'export'`

**The fix:**
```bash
# Force CJS mode for problematic tests
JEST_FORCE_CJS=1 pnpm --filter <pkg> test -- path/to/file.test.ts
```

**When to use:**
- Test imports ESM-only dependencies
- `import.meta` errors appear
- Transform errors despite correct config

**Reference:** See `.claude/skills/jest-esm-issues/SKILL.md` for detailed workflow.

---

## Summary

All safety rules follow a common principle: **prefer reversible operations over irreversible ones**.

When in doubt:
1. **STOP** — Don't run the command
2. **ASK** — Explain the risk to the user
3. **OFFER ALTERNATIVES** — Suggest safer approaches
4. **WAIT** — Only proceed with explicit confirmation
