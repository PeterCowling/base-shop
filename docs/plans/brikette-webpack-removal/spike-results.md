---
Type: Spike-Results
Status: Complete
Date: 2026-02-20
Feature-Slug: brikette-webpack-removal
Spike-Task: TASK-06
Blocks: TASK-07
---

# TASK-06 Spike Results: Turbopack-safe replacement for `import.meta.webpackContext`

## Executive Summary

`import.meta.glob` is **not available** in the brikette Next.js + Turbopack environment. It is a Vite-exclusive API. Turbopack's official documentation lists static and dynamic ESM `import` as supported module mechanisms with no glob import API. No file in the brikette codebase actually calls `import.meta.glob(...)` — all references are comments noting its absence.

The correct replacement pattern for all three primary consumers (`guides.state.ts`, `moduleResolver.ts`, `locale-loader.ts`) is either the **explicit-imports pattern** already implemented in `guides.imports.ts`, or **accept-empty** (where no modules are being discovered anyway). Variable-path dynamic imports (e.g. `` await import(`./locales/${lang}/${ns}.json`) ``) are confirmed working under Turbopack — used by `locale-loader.guides.ts`, `travelHelp.ts`, `testimonials.ts`, and `faq.ts` today.

---

## Q1: Is `import.meta.glob` available in Next.js + Turbopack?

**Verdict: NO — `import.meta.glob` is not supported.**

### Evidence

1. **No existing usage in the codebase**: `grep -r "import.meta.glob" apps/ --include="*.ts" --include="*.tsx"` finds only comments:
   - `apps/brikette/src/utils/webpackGlob.ts` — comment referencing Vite's API as historical context
   - `apps/brikette/src/locales/guides.state.ts` — comment about `import.meta.glob` being unavailable
   - `apps/brikette/src/locales/guides.fs.ts` — comment noting `import.meta.glob` is unavailable in Vitest
   - `apps/brikette/src/locales/guides.list.ts` — comment noting `import.meta.glob` may not work in Vitest
   - `apps/brikette/src/locales/guides.imports.ts` — comment: "when `import.meta.webpackContext` is unavailable (e.g. Turbopack)"

   No file actually *calls* `import.meta.glob(...)`.

2. **Provenance**: `import.meta.glob` was introduced by Vite as a bundler-specific extension. Turbopack implements `import.meta.webpackContext` (the webpack analog). Neither API is cross-bundler. Next.js + Turbopack does not polyfill Vite's API.

3. **Recursive patterns**: Moot — `import.meta.glob` is unavailable.

**Go/no-go for `import.meta.glob`**: **NO-GO for all consumers.**

---

## Q2: Sync vs async — can `import.meta.glob` be used for synchronous initialization?

**Verdict: Irrelevant — `import.meta.glob` is not available.**

In Vite, `import.meta.glob` with `{ eager: true }` returns a `Record<string, module>` synchronously. This distinction has no bearing on the migration since the API is unavailable.

The real sync/async question for `guides.state.ts` is addressed in Q3.

---

## Q3: Is top-level `await` viable for `guides.state.ts` startup initialization?

**Verdict: NOT RECOMMENDED. Strip webpack branches; defer startup seeding to follow-on.**

### Analysis of `guides.state.ts` initialization

The file comment at line ~148 explicitly states: "Avoid top-level await to keep the browser build target at `es2020`." Top-level `await` would propagate async module semantics to all 5 importers (`guides.predicates.ts`, `guides.get.ts`, `guides.list.ts`, `guides.peek.ts`, `guides.test-helpers.ts`).

**Recommended approach for TASK-08**: Strip the webpack branches. When `initialModuleOverrides` is not provided (current Turbopack behavior), state starts empty and `guides.backend.ts` handles loading per-request as today. The module-load side effect (`resetGuidesState(initialModuleOverrides)` at line 173) continues to work correctly.

**Post-TASK-08 follow-on** (out of scope for this plan): Wire `loadGuidesModuleOverridesFromFsSync()` from `guides.fs.ts` into `instrumentation.ts` to restore startup-time state caching as a performance improvement.

---

## Q4: Does `import.meta.glob` support the JSON-LD naming-convention regex?

**Verdict: Irrelevant — `import.meta.glob` unavailable. Accept-empty is correct for `moduleResolver.ts`.**

### Critical finding: Zero live modules exist

Search for files matching the JSON-LD discovery regex under `src/routes/guides/blocks/` returns **zero matching files**. The naming-convention files (`.jsonld`, `.schema`, `JsonLd`, `JsonLD`, `StructuredData`, `MetaBridge`) do not exist in the scanned path. The `src/schema/` directory contains `.jsonld` data files but these are outside the `blocks/` scan path and are JSON data (not TSX renderers).

**Conclusion**: `JSON_LD_MODULES` is `{}` under both webpack and Turbopack today because no matching modules exist. The discovery mechanism has never found any modules to populate. JSON-LD in guides is implemented via hardcoded React components, not via the webpackContext discovery mechanism.

**Go/no-go**: **ACCEPT-EMPTY.** `moduleResolver.ts` can be migrated by removing the webpack context call and hardcoding `JSON_LD_MODULES = {}` (preserving test fixtures). No replacement discovery mechanism is needed.

### Callers of `resolveHeadRenderer`

- `apps/brikette/src/routes/guides/blocks/handlers/jsonLdBlock.tsx:18` — `applyJsonLdBlock` calls `resolveHeadRenderer(options.module, options.exportName)`. If `null` is returned, it logs a warning and returns without adding a head slot. **This is already the current behavior under Turbopack — no additional regression.**
- `apps/brikette/src/routes/guides/blocks/utils/index.ts:5` — re-exports `resolveHeadRenderer` (no direct caller).

**Blast radius: contained.** Sole caller handles `null` gracefully.

---

## Q5: Does Turbopack support variable-path dynamic imports?

**Verdict: YES — variable-path dynamic imports work under Turbopack.**

### Evidence

The following files use variable-path dynamic import patterns and are active under Turbopack today:

| File | Pattern |
|---|---|
| `src/locales/locale-loader.guides.ts` | `` await import(`./${lang}/${ns}.json`) `` |
| `src/utils/travelHelp.ts` | `` await import(`../locales/${lang}/travelHelp.json`) `` |
| `src/utils/testimonials.ts` | `` await import(`../locales/${lang}/testimonials.json`) `` |
| `src/utils/faq.ts` | `` await import(`../locales/${lang}/faq.json`) `` |

These files function correctly without `/* webpackInclude */` comments.

**Important**: Without `/* webpackInclude */` filters, Turbopack bundles all reachable JSON files matching the import path template. This is acceptable — consistent with what `locale-loader.guides.ts` already does today. TASK-03 (magic comment removal) is safe; the imports continue working.

---

## Recommended Migration Approach Per Consumer

### Consumer 1: `guides.state.ts` (TASK-08)

**Approach**: Strip webpack branches; accept empty-map init as baseline.

**Concrete steps**:
1. Remove `import { getWebpackContext, supportsWebpackGlob, webpackContextToRecord } from "../utils/webpackGlob"`.
2. Remove `export const supportsImportMetaGlob = supportsWebpackGlob;` — confirmed zero importers outside this file.
3. Replace the three `shouldUseRealModules ? webpackContextToRecord(...) : {}` ternaries with `{}` unconditionally. The `overrides`-based path remains intact.
4. Remove `shouldUseRealModules` and related variables.
5. `resetGuidesState(initialModuleOverrides)` at module load continues to work — empty state is the correct Turbopack baseline; `guides.backend.ts` handles per-request loading.

**Revised confidence for TASK-08**: **85%** (approach confirmed; only risk is optional startup seeding, deferred to follow-on).

### Consumer 2: `moduleResolver.ts` (TASK-09)

**Approach**: Accept-empty. Remove webpack context call; hardcode `JSON_LD_MODULES = {}` plus test fixtures.

**Concrete steps**:
1. Remove `import { getWebpackContext, supportsWebpackGlob, webpackContextToRecord } from "@/utils/webpackGlob"`.
2. Remove `JSON_LD_CONTEXT` export and the `webpackContextToRecord` call.
3. Replace with: `export const JSON_LD_MODULES: Record<string, unknown> = { ...TEST_JSON_LD_MODULES };`
4. Add code comment: JSON-LD module discovery removed 2026-02-20; no modules matched the discovery pattern at removal time.

**Revised confidence for TASK-09**: **90%** (accept-empty confirmed safe; zero live modules; sole caller handles null gracefully).

### Consumer 3: `locale-loader.ts` (TASK-04 — spike-independent, confirmed)

Confirmed spike-independent per plan. Variable-path dynamic imports work under Turbopack (Q5). Migration is dead code removal only — remove `getWebpackContext` import, wrapper functions, and the webpack context branch.

---

## Go/No-Go Summary

| Consumer | API Candidate | Verdict | Recommended Approach |
|---|---|---|---|
| `guides.state.ts` | `import.meta.glob` | NO-GO (unavailable) | Strip webpack branches; empty-map init; defer startup seeding |
| `guides.state.ts` | `guides.imports.ts` explicit imports | GO (async only) | Remains the per-request fallback via `guides.backend.ts` |
| `moduleResolver.ts` | `import.meta.glob` | NO-GO (unavailable) | — |
| `moduleResolver.ts` | Accept-empty (`{}`) | GO | Zero live modules; accept-empty is already the Turbopack behavior |
| `locale-loader.ts` | Variable-path dynamic import | GO | Already works; TASK-04 is dead code removal only |

---

## Implications for TASK-07 CHECKPOINT

| Task | Pre-spike confidence | Post-spike confidence | Key change |
|---|---|---|---|
| TASK-08 | 60% | 85% | Approach confirmed: strip webpack branches, accept empty-map init, defer startup seeding. |
| TASK-09 | 55% | 90% | Accept-empty confirmed safe: zero live modules; sole caller handles null gracefully. |

Both tasks are now above their build-eligibility thresholds (TASK-08 ≥ 80%, TASK-09 ≥ 60%). CHECKPOINT can approve both for execution.

**No new tasks required.** The follow-on startup seeding task (wiring `guides.fs.ts` into `instrumentation.ts`) is a performance improvement beyond this plan's scope.

---

## Appendix: Key File References

| File | Role |
|---|---|
| `apps/brikette/src/utils/webpackGlob.ts` | Webpack-only glob abstraction — to be deleted in TASK-10 |
| `apps/brikette/src/locales/guides.state.ts` | Primary webpack consumer — migrated in TASK-08 |
| `apps/brikette/src/locales/guides.imports.ts` | Explicit-imports Turbopack-safe loader — existing fallback pattern |
| `apps/brikette/src/locales/guides.fs.ts` | Node FS-based loader — provides sync override seeding mechanism |
| `apps/brikette/src/locales/guides.backend.ts` | Per-request fallback via `loadGuidesNamespaceFromImports()` — unchanged |
| `apps/brikette/src/locales/locale-loader.ts` | Webpack consumer — dead code removal in TASK-04 |
| `apps/brikette/src/locales/locale-loader.guides.ts` | Variable-path import — working under Turbopack today |
| `apps/brikette/src/routes/guides/blocks/utils/moduleResolver.ts` | Webpack consumer — accept-empty in TASK-09 |
| `apps/brikette/src/routes/guides/blocks/handlers/jsonLdBlock.tsx` | Sole caller of `resolveHeadRenderer` — handles null gracefully |
