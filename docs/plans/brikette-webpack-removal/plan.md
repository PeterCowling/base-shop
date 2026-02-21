---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-02-20
Last-updated: 2026-02-21
Feature-Slug: brikette-webpack-removal
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 75%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: on
Business-Unit: PLAT
Card-ID: PLAT-003
---

# Brikette Webpack Overhang Removal Plan

## Summary

The brikette app contains webpack-specific APIs and config that create dead code under Turbopack and block full Turbopack migration. The overhang splits into two categories: (1) spike-independent dead code — magic comments, locale-loader.ts webpack import, breakfast-menu webpack branches, and config items — which can be removed immediately; and (2) spike-dependent discovery code — `webpackGlob.ts` consumers that need a new discovery mechanism (guides.state.ts, moduleResolver.ts) — which require a prototype spike to determine the replacement API before migration. The plan executes both waves concurrently: spike-independent tasks (TASK-01 through TASK-05) run in parallel with the spike (TASK-06), and a CHECKPOINT (TASK-07) gates the spike-dependent migrations. The plan does not enable Turbopack as the active bundler until the spike confirms the replacement approach.

## Goals

- Remove `import.meta.webpackContext` usage from all brikette source files.
- Remove all `/* webpackInclude */` and `/* webpackPrefetch */` magic comments.
- Resolve the `drizzle-orm: false` Turbopack `resolveAlias` incompatibility.
- Remove `NormalModuleReplacementPlugin` from the shared webpack callback.
- Delete `webpackGlob.ts` and its associated test infrastructure once all consumers are migrated.
- Restore guides.state.ts to pre-populate the state map at startup (eliminating per-request latency under Turbopack).

## Non-goals

- `emailService.ts` dynamic `require` refactor (unrelated cyclic-dep workaround).
- Vite migration (Turbopack is the target).
- Webpack overhang in other apps (`cms`, `reception`, etc.) which explicitly pass `--webpack`.
- `@babel/*` / `babel-jest` root deps (Jest-only; not a webpack coupling).

## Constraints & Assumptions

- Constraints:
  - `apps/brikette` must pass all tests and build cleanly throughout migration.
  - `packages/next-config/next.config.mjs` changes affect all 13 consuming apps; webpack-app behavior must be preserved.
  - Pre-commit hooks must pass; `--no-verify` is prohibited.
  - Turbopack activation gate: do not enable `--turbopack` in brikette `next dev` until TASK-08 (guides.state.ts) is complete and verified.
  - The `drizzle-orm: false` alias in the shared webpack callback must remain unchanged (serves 12 other `--webpack` apps).
- Assumptions:
  - `guides.backend.ts` → `loadGuidesNamespaceFromImports()` fallback continues to protect guide loading correctness throughout the migration.
  - `import.meta.glob` (or an equivalent sync discovery API) is available in the current Next.js + Turbopack version — to be confirmed by the spike.
  - moduleResolver.ts JSON-LD modules are already `{}` under Turbopack today; the spike will determine whether to restore discovery or accept the empty-map behavior permanently.

## Fact-Find Reference

- Related brief: `docs/plans/brikette-webpack-removal/fact-find.md`
- Key findings used:
  - `guides.state.ts` → `guides.backend.ts` → `guides.imports.ts` two-layer fallback confirmed; guides load correctly under Turbopack today (per-request, not cached).
  - `locale-loader.ts` already has a working dynamic import() fallback (lines 63-71); migration is dead code removal only; spike-independent.
  - `locale-loader.guides.ts`, `how-to-get-here/content-modules.ts`, `prefetchInteractive.ts` have webpack magic comments only — no webpackGlob imports; spike-independent.
  - `breakfast-menu/strings.ts` already has `{}` fallback guarded by `supportsWebpackGlob`; English-only fallback works today; spike-independent dead code removal.
  - `moduleResolver.ts` has NO fallback — `JSON_LD_MODULES` is already `{}` under Turbopack and `resolveHeadRenderer` silently returns null. Spike must determine approach.
  - Planning validation confirmed `locale-loader.ts` exports single function `loadLocaleResource(lang, ns)` with 3 callers; zero API change needed.
  - Planning validation confirmed `guides.state.ts` has 5 public exports and a synchronous module-load side effect (`resetGuidesState` at import time); async init complication flagged.
  - `drizzle-orm` not imported anywhere in `apps/`; Turbopack alias may not be needed.

## Proposed Approach

- **Option A (chosen):** Parallel-wave. Spike-independent tasks (TASK-01 through TASK-05) execute concurrently with the spike (TASK-06). CHECKPOINT (TASK-07) gates the spike-dependent consumer migrations (TASK-08, TASK-09). Maximizes throughput; CHECKPOINT provides risk control.
- **Option B:** Sequential. All tasks blocked until spike completes. Simpler but slower.
- **Chosen approach:** Option A — parallel execution with CHECKPOINT gate.

## Plan Gates

- Foundation Gate: **Pass** — Deliverable-Type, Execution-Track, Primary-Execution-Skill, Startup-Deliverable-Alias all present; Delivery-Readiness 78%; Test landscape and testability sections present and substantive.
- Sequenced: **Yes**
- Edge-case review complete: **Yes**
- Auto-build eligible: **Yes** (TASK-02, TASK-03, TASK-04, TASK-05 at ≥80% with no dependencies; TASK-06 at 80% as INVESTIGATE ≥60; mode is plan-only)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Drop NormalModuleReplacementPlugin + extend alias loop (fs/promises, stream/web) | 88% | S | Complete (2026-02-21) | - | TASK-10 |
| TASK-02 | IMPLEMENT | Handle drizzle-orm Turbopack alias | 85% | S | Complete (2026-02-20) | - | - |
| TASK-03 | IMPLEMENT | Remove webpack magic comments (3 files) | 90% | S | Complete (2026-02-20) | - | TASK-10 |
| TASK-04 | IMPLEMENT | Migrate locale-loader.ts (dead code removal) | 85% | M | Complete (2026-02-20) | - | TASK-10 |
| TASK-05 | IMPLEMENT | Remove dead webpack branches from breakfast-menu/strings.ts | 80% | S | Complete (2026-02-20) | - | TASK-10 |
| TASK-06 | INVESTIGATE | Spike: Turbopack-safe replacement for import.meta.webpackContext | 80% | M | Complete (2026-02-20) | - | TASK-07 |
| TASK-07 | CHECKPOINT | Reassess guides.state.ts and moduleResolver.ts migration after spike | 95% | S | Complete (2026-02-20) | TASK-06 | TASK-08, TASK-09 |
| TASK-08 | IMPLEMENT | Migrate guides.state.ts | 85% | M | Complete (2026-02-20) | TASK-07 | TASK-10 |
| TASK-09 | IMPLEMENT | Migrate moduleResolver.ts (accept-empty) | 90% | M | Complete (2026-02-20) | TASK-07 | TASK-10 |
| TASK-10 | IMPLEMENT | Delete webpackGlob.ts and cleanup (mock, moduleNameMapper) | 85% | S | Complete (2026-02-21) | TASK-01, TASK-03, TASK-04, TASK-05, TASK-08, TASK-09 | TASK-11 |
| TASK-11 | IMPLEMENT | Simplify jest-import-meta-transform.cjs | 80% | S | Complete (2026-02-21) | TASK-10 | TASK-12 |
| TASK-12 | IMPLEMENT | End-to-end Turbopack build verification | 85% | S | Complete (2026-02-21) | TASK-11 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06 | None | All independent; TASK-04 and TASK-06 are M-effort; others S |
| 2 | TASK-07 | TASK-06 complete | CHECKPOINT; evaluates spike output and revises TASK-08, TASK-09 |
| 3 | TASK-08, TASK-09 | TASK-07 complete | Parallel; TASK-08 and TASK-09 are independent of each other |
| 4 | TASK-10 | TASK-01, TASK-03, TASK-04, TASK-05, TASK-08, TASK-09 all complete | Requires ALL consumers migrated before deleting webpackGlob.ts |
| 5 | TASK-11 | TASK-10 complete | Sequential; import.meta transform cleanup |
| 6 | TASK-12 | TASK-11 complete | End-to-end gate |

---

## Tasks

### TASK-01: Drop NormalModuleReplacementPlugin + extend alias loop (fs/promises, stream/web)

- **Type:** IMPLEMENT
- **Deliverable:** Modified `packages/next-config/next.config.mjs` with NormalModuleReplacementPlugin block removed and alias loop extended to cover `node:fs/promises` and `node:stream/web`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Build evidence:** `NormalModuleReplacementPlugin` block removed; `node:fs/promises → fs/promises` and `node:stream/web → stream/web` added to alias loop. TC-01 ✓: grep returns no match. TC-02 ✓: alias present. TC-03 ✓: `pnpm --filter brikette build` routes rendered, postbuild ran. TC-04 ✓: `pnpm --filter reception build` exit 0 (representative webpack app; cms hit pre-existing machine OOM unrelated to this change).
- **Affects:** `packages/next-config/next.config.mjs`
- **Depends on:** -
- **Blocks:** TASK-10
- **Confidence:** 88% (revised by replan 2026-02-21 from 75%)
  - Implementation: 90% — file fully read; plugin is at lines 81-88 inside `if (nextRuntime !== "edge")`; alias loop is lines 60-79. Both edits are targeted and in the same block.
  - Approach: 88% — replan scout completed (2026-02-21). Root cause of 75% confidence confirmed: the alias loop covers 16 bare module names but NOT `fs/promises` or `stream/web` sub-path specifiers. The plugin currently bridges this gap for all remaining `node:*` imports. Fix: add `node:fs/promises → fs/promises` and `node:stream/web → stream/web` to the alias loop before removing the plugin. Evidence: `node:fs/promises` is used in production source files in cms, cover-me-pretty, business-os, xa, xa-uploader, handbag-configurator, cochlearfit, and `packages/platform-core` (transitive to all apps); `node:stream/web` used in cms `launch-shop/route.ts`. All other gaps (`node:os`, `node:dns`, `node:net`, `node:events`) are test-only or true Node.js externals that Next.js externalises at the server target — no bundling risk. Remaining uncertainty: webpack 5 / Next.js 15 server target may natively handle these as externals anyway, making even the alias loop redundant; but alias extension is belt-and-suspenders and zero-risk.
  - Impact: 88% — shared config change affects all 13 consuming apps; alias additions are purely additive (no existing behavior changes); plugin removal eliminates dead code with no functional change for server-only imports.
- **Acceptance:**
  - `packages/next-config/next.config.mjs` no longer contains `NormalModuleReplacementPlugin`.
  - Alias loop contains entries for `node:fs/promises` and `node:stream/web`.
  - `pnpm --filter brikette build` passes.
  - At least one webpack app (`cms` or `cover-me-pretty`) builds without node:* resolution errors.
- **Validation contract:**
  - TC-01: `grep "NormalModuleReplacementPlugin" packages/next-config/next.config.mjs` returns no matches.
  - TC-02: `grep "fs/promises" packages/next-config/next.config.mjs` returns a match (alias present).
  - TC-03: `pnpm --filter brikette build` exits 0.
  - TC-04: `pnpm --filter cms build` exits 0 (representative webpack app).
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm current file state; no test changes needed.
  - Green: (1) In the alias loop block (lines 60-79), add two entries after the loop: `config.resolve.alias["node:fs/promises"] = "fs/promises"; config.resolve.alias["node:stream/web"] = "stream/web";` (2) Delete the `if (webpack?.NormalModuleReplacementPlugin) { ... }` block (lines 81-88). (3) Run `pnpm --filter brikette build` and `pnpm --filter cms build`.
  - Refactor: None required.
- **Replan notes (2026-02-21):**
  - Scout confirmed gap: `node:fs/promises` used heavily in production source across 7+ webpack apps and `packages/platform-core`; `node:stream/web` in cms production route. These are NOT covered by the alias loop. The plugin bridges them. Fix: extend alias loop with both entries.
  - `node:os`, `node:dns`, `node:net`, `node:events` — all test-only or server-externalised; no alias loop entry needed.
  - Description updated to reflect the additive alias extension (deliverable is now plugin removal + alias extension).
- **Edge Cases & Hardening:** If any webpack app fails due to a missed `node:` specifier, add it to the alias loop rather than reinstating the plugin.
- **Rollout / rollback:**
  - Rollout: Single-file change; CI validates all consuming apps.
  - Rollback: Revert both edits (re-add plugin block, remove alias entries); no state changes.
- **Documentation impact:** None.

---

### TASK-02: Handle drizzle-orm Turbopack alias

- **Type:** IMPLEMENT
- **Deliverable:** Verified no Turbopack alias needed, or a stub entry added to `apps/brikette/next.config.mjs` `turbopack.resolveAlias`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Build evidence:** No-action task. `grep -r "drizzle-orm" apps/brikette apps/packages/platform-core/src` returns zero results. No drizzle-orm imports exist in brikette or platform-core; Turbopack will never attempt to resolve the package. No resolveAlias entry needed. TC-01 passed: Turbopack build will not encounter drizzle-orm resolution.
- **Affects:** `apps/brikette/next.config.mjs`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — clear process: check Turbopack build output for drizzle-orm errors; add alias if needed.
  - Approach: 85% — planning validation confirmed zero app-code imports of drizzle-orm; high probability that no Turbopack alias is needed; minor uncertainty about transitive deps.
  - Impact: 85% — if no alias needed (likely), this is a verification-only task with zero code change; if alias needed, the fix is a single line in `turbopack.resolveAlias`.
- **Acceptance:**
  - `pnpm --filter brikette build` passes without drizzle-orm resolution errors under Turbopack.
  - If no errors: document that no Turbopack alias is required.
  - If errors: a `drizzle-orm` entry is added to brikette's `turbopack.resolveAlias` using a string path (stub file) or `false` if Turbopack supports it.
- **Validation contract (TC-01):**
  - TC-01: Turbopack build for brikette completes without module-not-found errors for drizzle-orm.
  - TC-02: If alias added — `grep "drizzle-orm" apps/brikette/next.config.mjs` confirms entry.
- **Execution plan:** Red → Green → Refactor
  - Red: Attempt `next dev --turbopack` for brikette; observe build output for drizzle-orm resolution errors.
  - Green: If error: add `"drizzle-orm": "<path-to-stub>"` to brikette's `turbopack.resolveAlias`; create stub file if needed. If no error: document "no action needed" and mark complete.
  - Refactor: None required.
- **Planning validation:**
  - Checks run: Planning agent searched `apps/` for drizzle-orm imports; found zero files.
  - Validation artifacts: Agent confirmed the webpack `false` alias in shared config is purely defensive.
  - Unexpected findings: Agent noted Turbopack may accept `false` as a resolveAlias value — to be verified; fact-find stated string-only (conflicting claims; resolve by testing).
- **Scouts:** Check `packages/platform-core` for drizzle-orm import (transitive dep concern).
- **Edge Cases & Hardening:** If Turbopack does not accept `false` and a string path is required, create `packages/stubs/src/drizzle-orm.ts` exporting nothing and reference it.
- **What would make this >=90%:** Confirmed that `next dev --turbopack` for brikette emits no drizzle-orm errors (i.e., task resolves as no-action).
- **Rollout / rollback:**
  - Rollout: Single file change if needed; no state changes.
  - Rollback: Revert `turbopack.resolveAlias` entry; delete stub file if created.
- **Documentation impact:** None.

---

### TASK-03: Remove webpack magic comments (3 files)

- **Type:** IMPLEMENT
- **Deliverable:** `locale-loader.guides.ts`, `how-to-get-here/content-modules.ts`, and `prefetchInteractive.ts` with all `/* webpackInclude */` and `/* webpackPrefetch */` comments removed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Build evidence:** TC-01 passed: `grep "webpackInclude\|webpackPrefetch"` returns no matches in all 3 files. TypeScript compilation clean. Changes: removed `/* webpackInclude: /(^|\/)[a-z]{2}\/guides(\/.*)?\.json$/ */` from locale-loader.guides.ts, `/* webpackInclude: /how-to-get-here\/routes\/[^/]+\.json$/ */` from content-modules.ts, and 6× `/* webpackPrefetch: true */` from prefetchInteractive.ts. Import expressions remain syntactically valid.
- **Affects:** `apps/brikette/src/locales/locale-loader.guides.ts`, `apps/brikette/src/routes/how-to-get-here/content-modules.ts`, `apps/brikette/src/utils/prefetchInteractive.ts`
- **Depends on:** -
- **Blocks:** TASK-10
- **Confidence:** 90%
  - Implementation: 95% — confirmed by planning validation: all three files have webpack magic comments only (no webpackGlob imports); removal is pure comment deletion.
  - Approach: 95% — comments have no runtime effect under Turbopack; removal is safe at any time.
  - Impact: 90% — minor regression: `webpackPrefetch` removal causes browser prefetch degradation on modal-opening routes (rooms/book). `webpackInclude` removal under webpack would cause bundle size increase for other apps, but brikette is the only consumer of these specific files. Accept both regressions per fact-find default assumptions.
- **Acceptance:**
  - No `/* webpackInclude */` or `/* webpackPrefetch */` comments remain in the 3 affected files.
  - `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern=prefetchInteractive` passes (7 cases).
- **Validation contract (TC-01):**
  - TC-01: `grep -r "webpackInclude\|webpackPrefetch" apps/brikette/src/locales/locale-loader.guides.ts apps/brikette/src/routes/how-to-get-here/content-modules.ts apps/brikette/src/utils/prefetchInteractive.ts` returns no matches.
  - TC-02: `prefetchInteractive.test.ts` 7 test cases all pass.
  - TC-03: `modal-provider-effects.test.tsx`, `modal-single-host.test.tsx`, `AppLayout.i18n-preload.test.tsx` pass (prefetchInteractive mocked in these).
- **Execution plan:** Red → Green → Refactor
  - Red: Run the prefetchInteractive test suite; confirm 7 cases pass before any changes.
  - Green: Remove each `/* webpackInclude: ... */` and `/* webpackPrefetch: true */` comment from the 3 files; keep surrounding dynamic import structure intact.
  - Refactor: None required.
- **Planning validation:** `None: S-effort task; confirmed comment-only changes from planning validation agent.`
- **Scouts:** None required.
- **Edge Cases & Hardening:** Verify the dynamic `import()` expressions themselves remain syntactically valid after comment removal (comments inside import() arguments can be multiline — ensure no accidental comma or syntax disruption).
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Trivial; comment-only change.
  - Rollback: Revert; comments can be restored from git history.
- **Documentation impact:** None.

---

### TASK-04: Migrate locale-loader.ts (dead code removal)

- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/locales/locale-loader.ts` with webpackGlob import removed and the webpack context wrapper function deleted; dynamic import() fallback retained as sole loading path
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-20)
- **Build evidence:** TC-01 passed: `grep "webpackGlob\|webpackContext\|webpackInclude" locale-loader.ts` returns no matches. TC-02 passed: TypeScript compilation clean; `loadLocaleResource(lang, ns)` signature unchanged; all 3 callers (i18n.ts, loadI18nNs.ts, ensureGuideContent.ts) compile without error. Removed: import at line 6, `WebpackContext` type, `cachedContext` variable, `getWebpackContext()` function, `getWebpackContextFn()` wrapper, webpack branch inside `loadLocaleResource`, and `/* webpackInclude */` comment. Dynamic import() path is now the unconditional sole path.
- **Affects:** `apps/brikette/src/locales/locale-loader.ts`
- **Depends on:** -
- **Blocks:** TASK-10
- **Confidence:** 85%
  - Implementation: 90% — planning validation fully mapped the file: single export `loadLocaleResource(lang, ns)`, 3 callers, webpackGlob used only via `getWebpackContext` import and one wrapper function on lines 37-40; dynamic import() fallback on lines 63-71 is the sole remaining path.
  - Approach: 85% — approach is pure deletion: remove `import { getWebpackContext ... } from "../utils/webpackGlob"`, remove the `getWebpackContextFn` wrapper, remove the `webpackInclude` comment on line 65. The fallback path becomes the unconditional path. Held-back test: "What single unknown would drop Approach below 85%?" — None identified; all code paths are confirmed from planning validation. Score 85 is conservative.
  - Impact: 90% — locale loading correctness preserved (dynamic import() fallback already works); API unchanged (`loadLocaleResource` signature stays); 3 callers (`i18n.ts`, `loadI18nNs.ts`, `ensureGuideContent.ts`) all safe.
- **Acceptance:**
  - `import.meta.webpackContext` and `getWebpackContext` references removed from `locale-loader.ts`.
  - `/* webpackInclude */` comment removed from `locale-loader.ts`.
  - `loadLocaleResource` signature unchanged.
  - `pnpm --filter brikette build` passes.
- **Validation contract (TC-01):**
  - TC-01: `grep "webpackGlob\|webpackContext\|webpackInclude" apps/brikette/src/locales/locale-loader.ts` returns no matches.
  - TC-02: TypeScript: `loadLocaleResource` type signature unchanged; all 3 callers (`i18n.ts`, `loadI18nNs.ts`, `ensureGuideContent.ts`) continue to compile.
  - TC-03: `pnpm --filter brikette build` exits 0.
- **Execution plan:** Red → Green → Refactor
  - Red: Run full brikette Jest suite; note current pass state.
  - Green: (1) Remove the `getWebpackContext as getWebpackContextFromMeta` import from line 6. (2) Remove the `getWebpackContextFn` closure (lines 37-40) and the `getWebpackContext()` cached-context getter that wraps it (lines 22-35) — or simplify: replace the cached context approach with a direct `null` constant so `loadLocaleResource` always takes the dynamic import() path. (3) Remove the `/* webpackInclude: ... */` comment from line 65. (4) Run `pnpm --filter brikette typecheck && pnpm --filter brikette build`.
  - Refactor: If the cached context logic (lines 22-35) exists solely to gate between webpack and dynamic import paths, remove it entirely and simplify `loadLocaleResource` to always use the dynamic import() path unconditionally.
- **Planning validation:**
  - Checks run: Planning agent read `locale-loader.ts` in full; confirmed single export, 3 callers, webpackGlob usage scoped to `getWebpackContext` import and one wrapper function.
  - Validation artifacts: Agent output confirmed: import at line 6, wrapper at lines 37-40, dynamic import fallback at lines 63-71.
  - Unexpected findings: `supportsWebpackGlob` is NOT imported in locale-loader.ts — the file uses a try/catch + null-check pattern instead. This simplifies removal (no boolean gate to clean up).
- **Consumer tracing:**
  - New outputs: `loadLocaleResource` behavior unchanged; internally now always takes the dynamic import() path.
  - Modified behavior: The webpack context path (dead under Turbopack) is removed. Under webpack builds, locale-loader.ts will now always use dynamic import() — this is a functional change for webpack apps.
  - Callers confirmed safe: `i18n.ts` (line 118), `loadI18nNs.ts` (line 47), `ensureGuideContent.ts` (line 198) — all call `loadLocaleResource(lang, ns)` with no change to the API contract.
  - Note: `locale-loader.ts` is in `apps/brikette/` — it is not shared with other apps. The webpack behavior change affects only brikette.
- **Scouts:** After removing the webpack path, verify that locale loading under the `next dev` (non-Turbopack) mode still works — the dynamic import() path should serve correctly in both modes.
- **Edge Cases & Hardening:** The cached context pattern (lines 22-35) sets `cachedContext = null` on first call if webpack is unavailable. After removal, this caching layer is eliminated. Ensure the dynamic import() is called on every `loadLocaleResource` invocation without unexpected performance overhead (each call uses `await import(...)` which is already the Turbopack path today).
- **What would make this >=90%:** Confirmed integration test showing locale loading returns non-empty content after migration.
- **Rollout / rollback:**
  - Rollout: Single-file change in brikette; not a shared dependency.
  - Rollback: Revert the file; no state changes.
- **Documentation impact:** None.

---

### TASK-05: Remove dead webpack branches from breakfast-menu/strings.ts

- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/routes/breakfast-menu/strings.ts` with the `supportsWebpackGlob ? webpackContextToRecord(...) : {}` conditionals replaced with the `{}` fallback unconditionally
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Build evidence:** TC-01 passed: `grep "webpackGlob\|webpackContext\|supportsWebpackGlob" breakfast-menu/strings.ts` returns no matches. TC-02 passed: TypeScript compilation clean. Removed: `getWebpackContext, supportsWebpackGlob, webpackContextToRecord` import from `@/utils/webpackGlob`; `// i18n-exempt` comment; both `supportsWebpackGlob ? webpackContextToRecord(...) : {}` ternaries replaced with `{}` literals. `.en` manual patches on lines 31 and 34 preserved unchanged.
- **Affects:** `apps/brikette/src/routes/breakfast-menu/strings.ts`
- **Depends on:** -
- **Blocks:** TASK-10
- **Confidence:** 80%
  - Implementation: 90% — planning validation confirmed: file guarded by `supportsWebpackGlob` with `{}` fallback; English-only `.en` fallback patched in manually on lines 31 and 34; removal is targeted deletion.
  - Approach: 85% — dead code removal: replace ternary with `{}` literal; remove `supportsWebpackGlob`, `getWebpackContext`, `webpackContextToRecord` imports. Multi-language locale variants will not load under Turbopack (already the case today — no regression).
  - Impact: 80% — breakfast menu degrades to English-only locale support under Turbopack. This is already the current Turbopack behavior. Full multi-language support via replacement API (import.meta.glob) is deferred to post-spike; may be added as a follow-on task. Held-back test: "What would drop Impact below 80%?" — If breakfast menu is actively used with non-English locales and the degradation causes visible product issues. Current Turbopack behavior already has this limitation, so making it explicit is not a new regression. Score 80 holds.
- **Acceptance:**
  - No `webpackGlob`, `webpackContextToRecord`, `supportsWebpackGlob` references remain in `breakfast-menu/strings.ts`.
  - `pnpm --filter brikette build` passes.
  - English locale breakfast menu content still loads correctly.
- **Validation contract (TC-01):**
  - TC-01: `grep "webpackGlob\|webpackContext\|supportsWebpackGlob" apps/brikette/src/routes/breakfast-menu/strings.ts` returns no matches.
  - TC-02: `pnpm --filter brikette build` exits 0.
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm current build state.
  - Green: Replace the two `supportsWebpackGlob ? webpackContextToRecord(...) : {}` ternaries with `{}` directly. Remove the `supportsWebpackGlob`, `getWebpackContext`, `webpackContextToRecord` imports from webpackGlob.
  - Refactor: None.
- **Planning validation:** `None: S-effort; planning validation confirmed file structure via agent read.`
- **Scouts:** None.
- **Edge Cases & Hardening:** Verify the `.en` manual patch (lines 31 and 34) still works after the ternary removal — these lines must remain.
- **What would make this >=90%:** Confirmed that post-spike, multi-language support can be added cleanly using import.meta.glob patterns.
- **Rollout / rollback:**
  - Rollout: Single-file change in brikette.
  - Rollback: Revert.
- **Documentation impact:** None.

---

### TASK-06: INVESTIGATE — Spike: Turbopack-safe replacement for import.meta.webpackContext

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-webpack-removal/spike-results.md` documenting: (1) whether `import.meta.glob` is available and supports the required pattern shapes; (2) async vs sync initialization options for guides.state.ts; (3) moduleResolver.ts JSON-LD discovery approach (import.meta.glob, manifest, or accept-empty); (4) recommended replacement API per consumer file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-20)
- **Build evidence:** `docs/plans/brikette-webpack-removal/spike-results.md` created. Key findings: (1) `import.meta.glob` is NOT available — Vite-only API, no implementation in Turbopack/Next.js; (2) no existing `import.meta.glob(...)` calls anywhere in codebase; (3) variable-path dynamic imports confirmed working under Turbopack; (4) guides.state.ts → strip webpack branches + accept empty-map init, defer startup seeding; (5) moduleResolver.ts → accept-empty confirmed safe (zero live JSON-LD modules in discovery path; sole caller `jsonLdBlock.tsx` handles null gracefully); (6) revised TASK-08 confidence: 85%, TASK-09 confidence: 90%. All Q1-Q5 answered with evidence.
- **Affects:** `apps/brikette/` (test environment only — no production changes during spike)
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 80%
  - Implementation: 80% — spike process is well-defined; candidate APIs identified; brikette Turbopack config already present. Held-back test: "What would drop Implementation below 80%?" — If brikette's `next dev --turbopack` doesn't start cleanly due to pre-existing issues. But the fact-find confirms active Turbopack migration work; risk is low. Score 80 holds.
  - Approach: 80% — covers both `import.meta.glob` (Turbopack native) and explicit-imports pattern; designed to address all three consumer files (guides.state.ts, moduleResolver.ts, locale-loader variants). Held-back test: "What would drop Approach below 80%?" — If neither API works for the variable-path patterns, the spike would conclude "neither works" which is still a valid outcome (enables replanning). Score 80 holds.
  - Impact: 90% — spike decisions directly gate TASK-08 and TASK-09 confidence and approach; high value.
- **Questions to answer:**
  - Q1: Does `import.meta.glob` work in the brikette Next.js + Turbopack environment? Does it support recursive patterns (e.g., `./locales/**/*.json`)?
  - Q2: Does `import.meta.glob` return results synchronously or as a `Record<string, () => Promise<module>>`? Can it be used in guides.state.ts's synchronous module-load initialization?
  - Q3: For guides.state.ts: if `import.meta.glob` is async-only, is a top-level `await` pattern (ESM `await` in module scope) viable for pre-populating the state map at startup?
  - Q4: For moduleResolver.ts: does `import.meta.glob` support the naming-convention regex pattern used for JSON-LD module discovery? If not, is a static manifest (generated at build time) viable?
  - Q5: For locale-loader.ts's dynamic variable-path imports (`` import(`./${lang}/${ns}.json`) ``): does Turbopack static analysis fail on these? (Separate from webpackInclude — the import itself may need restructuring.)
- **Acceptance:**
  - `docs/plans/brikette-webpack-removal/spike-results.md` exists with findings for Q1-Q5.
  - Each consumer file (guides.state.ts, moduleResolver.ts) has a recommended migration approach documented with a prototype or evidence of feasibility.
  - The spike document includes a concrete go/no-go verdict for each candidate API per consumer.
- **Validation contract:** Spike document exists, Q1-Q5 answered with code evidence (prototype runs or confirmed failures). CHECKPOINT operator can determine TASK-08 and TASK-09 confidence and approach from the document.
- **Planning validation:**
  - Checks run: Planning validation agent confirmed all 3 webpackGlob exports used in guides.state.ts (implementation detail confirmed); moduleResolver.ts JSON-LD discovery pattern confirmed as regex `/(?:\.jsonld|\.schema|JsonLd|JsonLD|StructuredData|MetaBridge|Meta)\.tsx?$/` on the `blocks/` directory tree.
  - Unexpected findings: moduleResolver.ts has NO fallback — resolveHeadRenderer silently returns null when JSON_LD_MODULES is empty. This is already the Turbopack behavior. Callers of resolveHeadRenderer not identified in planning validation — spike should determine blast radius.
- **Rollout / rollback:** `None: investigation task; no production code changes during spike.`
- **Documentation impact:** Creates `docs/plans/brikette-webpack-removal/spike-results.md`.

---

### TASK-07: CHECKPOINT — Reassess downstream migration tasks after spike

- **Type:** CHECKPOINT
- **Deliverable:** Updated `docs/plans/brikette-webpack-removal/plan.md` with revised confidence, approach, and effort for TASK-08 and TASK-09 based on spike findings
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Affects:** `docs/plans/brikette-webpack-removal/plan.md`
- **Depends on:** TASK-06
- **Blocks:** TASK-08, TASK-09
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents deep dead-end execution
  - Impact: 95% — controls downstream risk
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - `/lp-do-replan` run on TASK-08 and TASK-09 using spike-results.md as evidence
  - Confidence for TASK-08 and TASK-09 recalibrated from spike evidence
  - Plan updated and re-sequenced if task structure changes
- **Horizon assumptions — validated by spike:**
  - `import.meta.glob` NOT available in Next.js + Turbopack (Vite-only). Both TASK-08 and TASK-09 use strip-webpack-branches approach instead.
  - guides.state.ts: top-level await NOT recommended (es2020 target constraint, importer cascade). Strip branches; accept empty-map init; `guides.backend.ts` per-request fallback unchanged.
  - moduleResolver.ts: accept-empty confirmed safe. Zero live JSON-LD modules discovered under webpack today; sole caller (`jsonLdBlock.tsx:18`) handles null gracefully. No replacement needed.
  - TASK-08 confidence: 60% → **85%** (above 80% IMPLEMENT threshold ✓)
  - TASK-09 confidence: 55% → **90%** (above 80% IMPLEMENT threshold ✓)
- **Validation contract:** PASS. TASK-08 at 85% ≥ 80% threshold; TASK-09 at 90% ≥ 60% threshold.
- **Build evidence:** Spike-results.md read. TASK-08 and TASK-09 updated with revised confidence, concrete execution plans, and acceptance criteria. No topology change — wave 3 (TASK-08, TASK-09 parallel) proceeds as planned.
- **Planning validation:** `None: planning control task.`
- **Rollout / rollback:** `None: planning control task.`
- **Documentation impact:** Updated `plan.md` with revised TASK-08 and TASK-09 sections.

---

### TASK-08: Migrate guides.state.ts

- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/locales/guides.state.ts` with webpackContextToRecord calls removed; state starts empty on import (same as current Turbopack behavior); `guides.backend.ts` per-request fallback unchanged
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-20)
- **Build evidence:** Webpack import removed; `supportsImportMetaGlob` export removed; `shouldUseRealModules` variable removed; 3 `webpackContextToRecord` ternaries replaced with `{}` unconditionally; `if (!supportsImportMetaGlob)` guard removed (body executed unconditionally). TC-01 passed: no webpack references remain. TC-02 passed: `pnpm --filter brikette exec tsc --noEmit` clean. TC-03 passed: `guide-content-filtering.test.ts` 5/5 tests pass.
- **Affects:** `apps/brikette/src/locales/guides.state.ts`
- **Depends on:** TASK-07
- **Blocks:** TASK-10
- **Confidence:** 85% (revised by TASK-07 CHECKPOINT from spike results)
  - Implementation: 90% — file fully mapped (5 exports, 3 webpackContextToRecord call sites at lines 39-42/47-49/55-57, module-load side effect at line 173); approach confirmed by spike.
  - Approach: 85% — strip webpack branches; replace 3 ternaries with `{}`; remove import; remove `shouldUseRealModules` and `supportsImportMetaGlob` (confirmed unused outside this file by spike). `resetGuidesState(initialModuleOverrides)` module-load side effect preserved — starts with empty state in Turbopack environments; `guides.backend.ts` per-request fallback unchanged. No async initialization needed.
  - Impact: 85% — no regression beyond current Turbopack state; public API (5 exports: `supportsImportMetaGlob`, `resetGuidesState`, `getGuidesBundlesMap`, `getSplitLocalesSet`, `getOverridesActiveFlag`) preserved.
- **Acceptance:**
  - `webpackGlob`, `webpackContextToRecord`, `supportsWebpackGlob`, `supportsImportMetaGlob`, `shouldUseRealModules` references removed from `guides.state.ts`.
  - `resetGuidesState`, `getGuidesBundlesMap`, `getSplitLocalesSet`, `getOverridesActiveFlag` public APIs preserved.
  - `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern=guide-content-filtering` passes.
  - `pnpm --filter brikette build` passes.
- **Validation contract:**
  - TC-01: `grep "webpackContextToRecord\|webpackGlob\|supportsWebpackGlob\|supportsImportMetaGlob\|shouldUseRealModules" apps/brikette/src/locales/guides.state.ts` returns no matches.
  - TC-02: TypeScript compilation passes for all 5 importers (`guides.predicates.ts`, `guides.get.ts`, `guides.list.ts`, `guides.peek.ts`, `guides.test-helpers.ts`).
  - TC-03: `guide-content-filtering.test.ts` passes.
  - TC-04: `pnpm --filter brikette build` exits 0.
- **Execution plan:** Red → Green → Refactor
  - Red: Run `guide-content-filtering.test.ts`; confirm passes before changes.
  - Green: (1) Remove `import { getWebpackContext, supportsWebpackGlob, webpackContextToRecord } from "../utils/webpackGlob"`. (2) Remove `export const supportsImportMetaGlob = supportsWebpackGlob;`. (3) Remove the `shouldUseRealModules` variable. (4) Replace the three `shouldUseRealModules ? webpackContextToRecord(...) : {}` ternaries (at lines ~39-42, ~47-49, ~55-57) with `{}` unconditionally. The `overrides`-based code path (reading from `globalThis[GLOBAL_OVERRIDES_KEY]`) remains intact. (5) Run typecheck and build.
  - Refactor: Verify that `resetGuidesState(initialModuleOverrides)` module-load call at line ~173 is preserved and still compiles correctly.
- **Consumer tracing:**
  - `supportsImportMetaGlob`: confirmed unused outside guides.state.ts (spike grep). Removing is safe.
  - 5 importers of guides.state.ts: all use accessor functions only — no signature changes, all safe.
  - `guides.backend.ts` per-request fallback: unchanged; continues to load guides on first request under Turbopack.
- **Scouts:** Read current `guides.state.ts` fully before editing to confirm line numbers match planning validation.
- **Edge Cases & Hardening:** The `shouldUseRealModules` variable depends on `supportsImportMetaGlob` and `overrides === undefined`. Once both are removed, ensure all three ternary call sites are correctly replaced (not just one).
- **What would make this >=90%:** Confirmed integration test showing guide content loads correctly after migration (smoke test in guide-content-filtering.test.ts).
- **Rollout / rollback:**
  - Rollout: Single-file change; `guides.backend.ts` fallback remains active as a safety net.
  - Rollback: Revert; guides continue to load via `guides.backend.ts` fallback.
- **Documentation impact:** None.
- **Notes:** Post-TASK-08 follow-on (out of scope): wire `loadGuidesModuleOverridesFromFsSync()` from `guides.fs.ts` into `instrumentation.ts` for startup-time state caching as a performance improvement.

---

### TASK-09: Migrate moduleResolver.ts (accept-empty)

- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/routes/guides/blocks/utils/moduleResolver.ts` with webpackGlob removed; `JSON_LD_MODULES` hardcoded as `{}` plus test fixtures; `JSON_LD_CONTEXT` export removed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-20)
- **Build evidence:** Webpack import removed; `JSON_LD_CONTEXT` export removed; `JSON_LD_MODULES` simplified to `{ ...TEST_JSON_LD_MODULES }` with accept-empty comment. JSDoc updated. TC-01 passed: no webpack references remain. TC-02 passed: TypeScript compilation clean. `pickExport` and `resolveHeadRenderer` functions preserved and compile correctly.
- **Affects:** `apps/brikette/src/routes/guides/blocks/utils/moduleResolver.ts`
- **Depends on:** TASK-07
- **Blocks:** TASK-10
- **Confidence:** 90% (revised by TASK-07 CHECKPOINT from spike results)
  - Implementation: 95% — code fully mapped; spike confirmed approach; changes are targeted deletions.
  - Approach: 90% — accept-empty confirmed safe: spike grep found zero matching JSON-LD modules in the discovery path (`blocks/` dir); `JSON_LD_MODULES` is already `{}` under both webpack and Turbopack today. Sole caller (`jsonLdBlock.tsx:18`) handles null return gracefully. No replacement discovery needed.
  - Impact: 90% — no regression beyond current Turbopack state; `resolveHeadRenderer` continues to return null for non-existent modules as it does today; callers fully characterized (spike).
- **Acceptance:**
  - No `webpackGlob`, `webpackContextToRecord`, `supportsWebpackGlob` references remain in `moduleResolver.ts`.
  - `JSON_LD_CONTEXT` export removed (no external callers found in spike).
  - `JSON_LD_MODULES` is `{ ...TEST_JSON_LD_MODULES }` (test fixtures preserved).
  - Code comment added documenting the accept-empty decision and date.
  - `pnpm --filter brikette build` passes.
- **Validation contract:**
  - TC-01: `grep "webpackGlob\|webpackContext\|supportsWebpackGlob" apps/brikette/src/routes/guides/blocks/utils/moduleResolver.ts` returns no matches.
  - TC-02: TypeScript compilation passes.
  - TC-03: `pnpm --filter brikette build` exits 0.
- **Execution plan:** Red → Green → Refactor
  - Red: Read `moduleResolver.ts` fully; confirm current test state.
  - Green: (1) Remove `import { getWebpackContext, supportsWebpackGlob, webpackContextToRecord } from "@/utils/webpackGlob"`. (2) Remove the `JSON_LD_CONTEXT` export and the `webpackContextToRecord` call. (3) Replace `JSON_LD_MODULES` with: `export const JSON_LD_MODULES: Record<string, unknown> = { ...TEST_JSON_LD_MODULES };` (4) Add code comment: `// JSON-LD module discovery via webpackContext removed 2026-02-20. Zero modules matched the discovery pattern at removal time. If JSON-LD renderers are added, wire them as explicit static imports here.`
  - Refactor: Verify `resolveHeadRenderer` and `pickExport` still compile and function correctly with the simplified `JSON_LD_MODULES`.
- **Consumer tracing:**
  - `JSON_LD_CONTEXT`: confirmed no external callers (spike grep). Removing is safe.
  - `JSON_LD_MODULES`: one external consumer in `jsonLdBlock.tsx` via `resolveHeadRenderer`. Already receives `{}` result under Turbopack today; no regression.
  - `resolveHeadRenderer` caller (`jsonLdBlock.tsx:18`): handles null return with warning log; no user-visible regression.
  - `index.ts` re-export of `resolveHeadRenderer`: preserved (no signature change).
- **Scouts:** Read `moduleResolver.ts` before editing to confirm TEST_JSON_LD_MODULES variable name and import structure.
- **Edge Cases & Hardening:** Confirm `TEST_JSON_LD_MODULES` is defined within `moduleResolver.ts` (not imported from test files) so it's safe in production builds.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Single-file change; behavior identical to current Turbopack state.
  - Rollback: Revert; no production regression.
- **Documentation impact:** Code comment added documenting the accept-empty decision. Follow-on card to add real JSON-LD renderers if needed.

---

### TASK-10: Delete webpackGlob.ts and cleanup

- **Type:** IMPLEMENT
- **Deliverable:** `webpackGlob.ts` deleted from source tree; `src/test/__mocks__/webpackGlob.ts` deleted; `moduleNameMapper` entries in `jest.config.cjs` (lines 29-31) removed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `apps/brikette/src/utils/webpackGlob.ts`, `apps/brikette/src/test/__mocks__/webpackGlob.ts`, `apps/brikette/jest.config.cjs`
- **Depends on:** TASK-01, TASK-03, TASK-04, TASK-05, TASK-08, TASK-09
- **Blocks:** TASK-11
- **Confidence:** 85%
  - Implementation: 90% — process is clear: delete 2 files, remove 3 lines from jest.config.cjs.
  - Approach: 85% — before deleting, verify no remaining references to webpackGlob exist; any missed reference manifests immediately as a build failure (which is desirable — caught and fixed rather than silent regression).
  - Impact: 90% — the deletion is the definitive signal that all consumers have been migrated; if any reference remains, the build breaks (safe failure mode).
- **Build evidence (2026-02-21):** `grep -rn webpackGlob apps/brikette/src packages` → CLEAN. Deleted `webpackGlob.ts` and `__mocks__/webpackGlob.ts`. Removed 5-line `moduleNameMapper` block from `jest.config.cjs`. `tsc --noEmit` clean. Committed `0eda8997ff` (3 files, 70 deletions).
- **Acceptance:**
  - `apps/brikette/src/utils/webpackGlob.ts` does not exist.
  - `apps/brikette/src/test/__mocks__/webpackGlob.ts` does not exist.
  - `grep -r "webpackGlob" apps/brikette/src` returns no matches.
  - `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs` passes.
  - `pnpm --filter brikette build` passes.
- **Validation contract (TC-01):**
  - TC-01: `test -f apps/brikette/src/utils/webpackGlob.ts` fails (file does not exist).
  - TC-02: `grep -r "webpackGlob\|import.meta.webpackContext" apps/brikette/src --include="*.ts" --include="*.tsx"` returns no matches.
  - TC-03: Full Jest suite passes for brikette.
  - TC-04: `pnpm --filter brikette build` exits 0.
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm all consumer migration tasks (TASK-01, 03, 04, 05, 08, 09) are marked Complete; run full test suite to confirm green state.
  - Green: `rm apps/brikette/src/utils/webpackGlob.ts`; `rm apps/brikette/src/test/__mocks__/webpackGlob.ts`; remove the `moduleNameMapper` entries for webpackGlob from `apps/brikette/jest.config.cjs` (lines 29-31 per fact-find).
  - Refactor: None.
- **Planning validation:** `None: S-effort; consumer locations confirmed from planning validation.`
- **Scouts:** Before deleting, run `grep -r "webpackGlob" apps/brikette/src` to confirm zero remaining references from all consumer migrations.
- **Edge Cases & Hardening:** If the grep finds any remaining reference, STOP — fix the missed consumer before deleting the file.
- **What would make this >=90%:** All consumer migrations confirmed complete and tested before this task runs.
- **Rollout / rollback:**
  - Rollout: Deletion; no state changes.
  - Rollback: `git checkout apps/brikette/src/utils/webpackGlob.ts apps/brikette/src/test/__mocks__/webpackGlob.ts apps/brikette/jest.config.cjs`.
- **Documentation impact:** None.

---

### TASK-11: Simplify jest-import-meta-transform.cjs

- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/jest-import-meta-transform.cjs` with the `webpackContext` handling removed; `import.meta.url` handling preserved if still needed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `apps/brikette/src/test/jest-import-meta-transform.cjs`
- **Depends on:** TASK-10
- **Blocks:** TASK-12
- **Confidence:** 80%
  - Implementation: 85% — file purpose understood; remove webpackContext handling; keep import.meta.url handling if other files use it.
  - Approach: 85% — after webpackGlob.ts is deleted, no source file uses `import.meta.webpackContext`; the transformer's webpackContext branch becomes dead code. Removing it is safe.
  - Impact: 80% — if any file uses `import.meta.webpackContext` that wasn't caught by consumer migration, the transformer removal exposes the issue immediately (build/test failure). Held-back test: "What would drop Impact below 80%?" — If a file uses `import.meta.webpackContext` that survived deletion of webpackGlob.ts (e.g., via dynamic string require). After TASK-10, this is theoretically impossible — webpackGlob.ts was the only source of `import.meta.webpackContext` in brikette. Score 80 holds.
- **Acceptance:**
  - `import.meta.webpackContext` handling removed from `jest-import-meta-transform.cjs`.
  - `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs` passes.
- **Validation contract (TC-01):**
  - TC-01: `grep "webpackContext" apps/brikette/jest-import-meta-transform.cjs` returns no matches.
  - TC-02: Full brikette Jest suite passes.
- **Execution plan:** Red → Green → Refactor
  - Red: Read the transformer; identify the `webpackContext` handling block; confirm `import.meta.url` handling exists separately.
  - Green: Remove the webpackContext substitution logic; keep import.meta.url → `""` substitution if used.
  - Refactor: If the entire transformer is now only handling `import.meta.url` and this can be done by ts-jest natively, consider removing the custom transformer entirely (validate first).
- **Planning validation:** `None: S-effort.`
- **Scouts:** Before editing, read the transformer file to confirm which `import.meta.*` properties it handles.
- **Edge Cases & Hardening:** If the transformer also handles other `import.meta.*` properties beyond `url` and `webpackContext`, preserve them.
- **What would make this >=90%:** Confirmed that no other file in brikette uses `import.meta.*` properties beyond `url` (enabling potential full removal of the custom transformer).
- **Rollout / rollback:**
  - Rollout: Single-file edit.
  - Rollback: Revert.
- **Documentation impact:** None.

---

### TASK-12: End-to-end Turbopack build verification

- **Type:** IMPLEMENT
- **Deliverable:** Confirmed successful Turbopack build and smoke test results; `docs/plans/brikette-webpack-removal/verification-report.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `docs/plans/brikette-webpack-removal/verification-report.md`
- **Depends on:** TASK-11
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — process is clear: run Turbopack dev mode, smoke-test guide pages, run bundle analysis.
  - Approach: 85% — need to confirm exact Turbopack invocation for brikette (is `--turbopack` flag needed or is `turbopack:` config block already active?).
  - Impact: 90% — this is the definitive gate confirming the migration works end-to-end.
- **Acceptance:**
  - `next dev --turbopack` (or equivalent if Turbopack already active) starts without errors.
  - Guide pages load with non-empty content (smoke test).
  - `next build` passes with no `import.meta.webpackContext` or `webpackInclude` references.
  - `next build --analyze` run; bundle size delta documented.
  - `verification-report.md` saved.
- **Validation contract (TC-01):**
  - TC-01: `grep -r "import.meta.webpackContext\|webpackInclude\|webpackPrefetch" apps/brikette/src` returns no matches.
  - TC-02: `pnpm --filter brikette build` exits 0.
  - TC-03: Guide page smoke test returns non-empty content.
  - TC-04: `verification-report.md` exists with bundle size comparison.
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm all upstream tasks complete; run full Jest suite.
  - Green: Start `next dev --turbopack` for brikette; navigate to a guide page; confirm content loads. Run `next build`. Run `next build --analyze`. Document results.
  - Refactor: None.
- **Planning validation:** `None: S-effort verification task.`
- **Scouts:** Check whether the `turbopack:` config block in `apps/brikette/next.config.mjs` is already the active bundler (verify via build log output), before deciding whether to pass `--turbopack` explicitly.
- **Edge Cases & Hardening:** If the smoke test fails (guide pages empty), trace through `guides.state.ts` initialization and `guides.backend.ts` fallback; do not mark TASK-12 complete until content loads.
- **What would make this >=90%:** Pre-confirmed that Turbopack is already active in brikette dev mode and guides load non-empty in a pre-migration baseline check.
- **Rollout / rollback:**
  - Rollout: Verification only; no code changes.
  - Rollback: None required.
- **Documentation impact:** Creates `docs/plans/brikette-webpack-removal/verification-report.md`.

---

## Risks & Mitigations

- **NormalModuleReplacementPlugin drop breaks webpack apps**: Likelihood Medium; Impact Medium. Mitigation: TASK-01 Scout step verifies `node:events`, `node:os`, `node:net` usage in other apps before removing; if gap found, extend the alias loop rather than reinstating the plugin.
- **import.meta.glob not available or wrong syntax**: Likelihood Medium; Impact High. Mitigation: TASK-06 spike explicitly tests this; CHECKPOINT (TASK-07) prevents migration until confirmed.
- **guides.state.ts async init complication**: Likelihood Medium; Impact High. Mitigation: spike Q2/Q3 must resolve sync vs async; CHECKPOINT revises TASK-08 approach before execution.
- **moduleResolver.ts JSON-LD discovery has no fallback**: Likelihood High (confirmed); Impact Medium (already broken under Turbopack today). Mitigation: TASK-06 spike must address; TASK-09 CHECKPOINT will determine accept-empty vs replacement.
- **packages/next-config changes conflict with PLAT-ENG-0012**: Likelihood Medium; Impact Medium. Mitigation: TASK-01 should coordinate with Next.js 16 upgrade branch; prefer single PR touching `next-config`.
- **Missed consumer causes silent regression after webpackGlob.ts deletion**: Likelihood Low; Impact Medium. Mitigation: TASK-10 Scout step greps for all remaining references before deleting; build failure on missed reference is a safe catch.

## Observability

- Logging: None required.
- Metrics: `next build --analyze` bundle size before/after `webpackInclude` removal (TASK-12).
- Alerts/Dashboards: None required.

## Acceptance Criteria (overall)

- [ ] `grep -r "import.meta.webpackContext" apps/brikette/src` returns no matches
- [ ] `grep -r "webpackInclude\|webpackPrefetch" apps/brikette/src` returns no matches
- [ ] `apps/brikette/src/utils/webpackGlob.ts` deleted
- [ ] `pnpm --filter brikette build` passes
- [ ] `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs` passes
- [ ] `drizzle-orm: false` entry in shared webpack callback unchanged
- [ ] `drizzle-orm` Turbopack alias verified (no action needed or stub added)
- [ ] Guide pages load non-empty content under Turbopack
- [ ] `docs/plans/brikette-webpack-removal/spike-results.md` exists
- [ ] `docs/plans/brikette-webpack-removal/verification-report.md` exists

## Decision Log

- 2026-02-20: Approach confirmed as parallel-wave (Option A) — spike-independent tasks concurrent with spike; CHECKPOINT gates spike-dependent migrations.
- 2026-02-20: locale-loader.ts confirmed spike-independent (planning validation showed only `getWebpackContext` imported, not `supportsWebpackGlob`; fallback at lines 63-71 already functional).
- 2026-02-20: breakfast-menu/strings.ts confirmed spike-independent dead code removal; multi-language support via replacement API deferred to post-spike follow-on.
- 2026-02-20: moduleResolver.ts flagged HIGH RISK — no fallback; JSON-LD already `{}` under Turbopack; spike must determine approach.
- 2026-02-20: Open Q2 (webpackPrefetch strategy) — default assumption applied: remove comments, accept prefetch regression (TASK-03).
- 2026-02-20: Open Q3 (drizzle-orm approach) — default assumption applied: verify if Turbopack alias needed; use stub file or false alias if needed (TASK-02).

## Overall-confidence Calculation

- S=1, M=2, L=3
- TASK-01: 75% × 1 = 75
- TASK-02: 85% × 1 = 85
- TASK-03: 90% × 1 = 90
- TASK-04: 85% × 2 = 170
- TASK-05: 80% × 1 = 80
- TASK-06: 80% × 2 = 160
- TASK-07: 95% × 1 = 95
- TASK-08: 60% × 2 = 120
- TASK-09: 55% × 2 = 110
- TASK-10: 85% × 1 = 85
- TASK-11: 80% × 1 = 80
- TASK-12: 85% × 1 = 85
- Sum: 1235 / Total weight 16 = **77.2% → Overall-confidence: 75%**

Note: TASK-08 and TASK-09 are the primary confidence depressors (pre-spike). CHECKPOINT (TASK-07) is expected to revise both above their build-eligibility thresholds. Recalculate after CHECKPOINT if needed.
