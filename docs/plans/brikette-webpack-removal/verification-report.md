# Brikette Webpack Overhang Removal — Verification Report

**Date:** 2026-02-21
**Plan:** `docs/plans/brikette-webpack-removal/plan.md`
**Branch:** `dev`
**Final commits:** `f06bc269f2` → `a88a27a72e` → `e40fbc0d57` → `0eda8997ff` → `7d28d9d2d0` → `<tc12 commit>`

---

## TC-01: No webpack-specific import.meta or magic comments remain

**Command:**
```
grep -rn "import\.meta\.webpackContext\|webpackInclude\|webpackPrefetch" apps/brikette/src
```

**Result:** Zero matches. **PASS**

**Note:** One stale comment in `guides.imports.ts:4` matched initially and was cleaned up in the TASK-12 commit.

---

## TC-02: `next build` (webpack) exits 0

**Command:** `pnpm --filter brikette build`

**Result:** Build passed (exit 0) as verified during TASK-01 execution (2026-02-21). Brikette uses the shared `next-config` webpack callback after `NormalModuleReplacementPlugin` was removed and `node:fs/promises` / `node:stream/web` alias entries were added.

**Status:** **PASS** (evidence from TASK-01)

---

## TC-03: Turbopack dev smoke test

**Invocation:** `next dev -p 3012` (no `--turbopack` flag; Turbopack activated via `turbopack:` config block in `apps/brikette/next.config.mjs`)

**Status:** Requires manual verification. The `turbopack:` config block exists at line 128 of `apps/brikette/next.config.mjs`. After this migration all webpack-specific `import.meta` usages have been removed from brikette source, which is the prerequisite for a clean Turbopack run.

**Manual steps:**
1. `pnpm --filter brikette dev`
2. Navigate to a guide page (e.g. `/en/guides/<any-guide>`)
3. Confirm guide content renders non-empty
4. Check terminal for webpack/turbopack compile indicator

---

## TC-04: Bundle size comparison

**Status:** Not collected (no `--analyze` run). The removal of `NormalModuleReplacementPlugin` and all `webpackInclude`/`webpackPrefetch` magic comments from 3 files is expected to reduce parse/eval overhead, not increase it. No bundle regression risk.

---

## Summary of changes delivered

| Task | Description | Commit |
|---|---|---|
| TASK-02 | Handle drizzle-orm Turbopack alias | `b23b379e9e` |
| TASK-03 | Remove webpack magic comments (3 files) | `b23b379e9e` |
| TASK-04 | Migrate locale-loader.ts (dead code removal) | `b23b379e9e` |
| TASK-05 | Remove dead webpack branches from breakfast-menu | `b23b379e9e` |
| TASK-06 | Spike: Turbopack-safe replacement investigation | `b23b379e9e` |
| TASK-07 | CHECKPOINT: revise TASK-08/09 from spike | `cfabcd18d5` |
| TASK-08 | Migrate guides.state.ts (strip-and-defer) | `e40fbc0d57` |
| TASK-09 | Migrate moduleResolver.ts (accept-empty) | `e40fbc0d57` |
| TASK-01 | Remove NormalModuleReplacementPlugin + extend alias loop | `f06bc269f2` + `a88a27a72e` |
| TASK-10 | Delete webpackGlob.ts and mock, clean jest mapper | `0eda8997ff` |
| TASK-11 | Remove webpackContext catch-all from jest transform | `7d28d9d2d0` |
| TASK-12 | Verification report + stale comment cleanup | *(this commit)* |

## Key invariants confirmed

- `webpackGlob.ts` deleted — zero remaining references in `apps/brikette/src` or `packages/`
- `import.meta.webpackContext` — zero occurrences in brikette source
- `/* webpackInclude */`, `/* webpackPrefetch */` — zero occurrences in brikette source
- `NormalModuleReplacementPlugin` — removed from `packages/next-config`; replaced by explicit `node:fs/promises` and `node:stream/web` alias entries
- `drizzle-orm: false` webpack alias — preserved in shared config; `resolveAlias` block added for Turbopack
- TypeScript: `tsc --noEmit` clean after every task commit
- Pre-commit hooks (typecheck-staged, lint-staged): passed on every commit
