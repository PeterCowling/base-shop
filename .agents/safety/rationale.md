# Safety Rules Rationale

This document explains WHY each safety rule exists, including incident history and safe alternatives.

## Git Safety Rules

### `git reset --hard` — PROHIBITED without explicit user confirmation

**Why dangerous:**
- Permanently discards all uncommitted changes (staged and unstaged)
- Cannot be undone — work is lost forever
- Often used reflexively when "things are messy" but destroys valuable work

**Incident history:**
- **2026-01-14**: Agent ran `git reset --hard` during cleanup, losing several hours of uncommitted work. Required manual reconstruction from memory and partial backups. See `docs/RECOVERY-PLAN-2026-01-14.md` for details.

**Safe alternatives:**
| Instead of | Do this |
|------------|---------|
| `git reset --hard` | `git stash` (preserves changes, can recover later) |
| Undo last commit | `git reset --soft HEAD~1` (keeps changes staged) |
| Discard one file | `git checkout -- <file>` (targeted, not global) |
| Start fresh | `git stash && git checkout -b new-branch` |

**When it might be legitimate:**
- User explicitly requests it after understanding the risk
- Working directory has no valuable uncommitted changes
- Always list what will be lost BEFORE running

---

### `git push --force` — PROHIBITED without explicit user confirmation

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
| `git push --force` | `git push --force-with-lease` (fails if remote changed) |
| Fix pushed commit | `git revert <commit>` (creates new commit, preserves history) |
| Update branch | `git pull --rebase && git push` (integrate remote changes first) |

**When it might be legitimate:**
- Rebasing a feature branch that only you are working on
- Cleaning up commits before PR merge (use `--force-with-lease`)
- Always confirm no one else has pushed to the branch

---

### `git clean -fd` — PROHIBITED without explicit user confirmation

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

**When it might be legitimate:**
- After reviewing `git clean -n` output carefully
- In CI where working directory should be pristine
- User explicitly confirms after seeing what will be deleted

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

### Committing to `main` — PROHIBITED

**Why dangerous:**
- `main` is the production branch
- Direct commits bypass PR review
- Can break CI/CD pipelines
- Harder to rollback than reverting a PR

**Safe alternatives:**
- Create `work/*` branch for all work
- Open PR for review
- Let CI validate changes
- Squash-merge to keep history clean

---

## File Safety Rules

### `rm -rf` on project directories — PROHIBITED without explicit user confirmation

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

**When it might be legitimate:**
- Cleaning known build artifacts (`dist/`, `.next/`, `node_modules/`)
- User explicitly confirms the exact path
- Always double-check the path before running

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

**Reference:** See `.agents/skills/testing/jest-esm-issues.md` for detailed workflow.

---

## Summary

All safety rules follow a common principle: **prefer reversible operations over irreversible ones**.

When in doubt:
1. **STOP** — Don't run the command
2. **ASK** — Explain the risk to the user
3. **OFFER ALTERNATIVES** — Suggest safer approaches
4. **WAIT** — Only proceed with explicit confirmation
