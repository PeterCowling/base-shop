---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-02-20
Last-updated: 2026-02-20
Audit-Ref: working-tree (0a4d42a6 — file untracked at audit time)
Feature-Slug: brikette-webpack-removal
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brikette-webpack-removal/plan.md
Business-OS-Integration: on
Business-Unit: PLAT
Card-ID: PLAT-003
---

# Brikette Webpack Overhang Removal — Fact-Find Brief

## Scope

### Summary

The brikette app has accumulated webpack-specific code that creates friction for Turbopack migration and will break if the project ever moves to Vite or another bundler. The overhang falls into three tiers:

1. **Hard webpack APIs in source** — `import.meta.webpackContext` and `/* webpackInclude */` magic comments that have no Turbopack equivalent.
2. **Webpack-specific config syntax** — `drizzle-orm: false` alias (boolean-false not valid in Turbopack `resolveAlias`) and `NormalModuleReplacementPlugin` (drops cleanly).
3. **Optimization hints** — `/* webpackPrefetch */` comments that are silently ignored by Turbopack (feature regression but not a build failure).

Under Turbopack, `import.meta.webpackContext` resolves to `undefined`, so `guides.state.ts` produces empty in-memory module maps. However, `guides.backend.ts` immediately falls through to `loadGuidesNamespaceFromImports()` (from `guides.imports.ts`) whenever `getGuidesBundle()` returns `undefined` — which it always does when the state is empty. Guides load correctly under Turbopack today, but via per-request dynamic `import()` rather than from the pre-loaded state cache. Similarly, `locale-loader.ts` already has a dynamic `import()` fallback path active under Turbopack. The real costs of the webpack overhang are (a) performance regression — no startup-time caching, per-request dynamic import latency on every guide request; (b) dead code in the bundle — the `webpackContextToRecord` calls in `guides.state.ts` are never executed under Turbopack; (c) technical debt — `/* webpackInclude */` and `/* webpackPrefetch */` magic comments have no effect under Turbopack, and `drizzle-orm: false` is not valid Turbopack `resolveAlias` syntax. This is a technical debt and performance migration, not a production correctness emergency.

`guides.imports.ts` is already the application-level guides fallback (via the `guides.backend.ts` → `loadGuidesNamespaceFromImports()` call chain). "Promoting it to the primary path" means removing the dead webpack branches from `guides.state.ts` so the state is pre-populated at startup, not wiring a new fallback.

### Goals

- Replace `webpackGlob.ts` (`import.meta.webpackContext`) with an equivalent that works under Turbopack and in the test environment.
- Replace all `/* webpackInclude: ... */` dynamic import comments with bundler-agnostic equivalents (explicit import patterns or `import.meta.glob`).
- Remove `/* webpackPrefetch: true */` comments and decide on a Turbopack-compatible prefetch strategy.
- Add `drizzle-orm` stub entry to brikette's `turbopack.resolveAlias` (the `false` alias in the shared webpack callback is left unchanged — it serves the 12 other `--webpack` apps).
- Delete `NormalModuleReplacementPlugin` from shared config (no-op under Turbopack/Vite).
- Simplify or delete `jest-import-meta-transform.cjs` once `import.meta.webpackContext` is gone from source.

### Non-goals

- `emailService.ts` dynamic `require(moduleId)` refactor (unrelated to bundler — it hides a cyclic dep from webpack's static analysis; still functional under any bundler).
- Vite migration (out of scope; fixing for Turbopack is sufficient).
- Webpack overhang in other apps (`apps/cms`, `apps/reception`, etc.) which explicitly pass `--webpack` in their dev/build scripts.
- `@babel/*` / `babel-jest` root deps (Jest-only; not a webpack coupling).

### Constraints & Assumptions

- Constraints:
  - `apps/brikette` must continue to build and pass all tests throughout migration.
  - Turbopack activation gate: `apps/brikette/next.config.mjs` already contains a `turbopack:` config block (the Next.js 15 stable opt-in). Verify whether this means Turbopack is already the active bundler in dev/CI before treating any gate constraint as meaningful. If Turbopack is already active, the migration confirms and cleans up an already-working system; if not yet active, do not enable the config block until `guides.state.ts` is updated to pre-populate state at startup.
  - **Shared config blast radius — 13 apps**: `packages/next-config/next.config.mjs` is consumed by 13 apps: `brikette`, `business-os`, `cochlearfit`, `skylar`, `product-pipeline`, `xa`, `xa-b`, `handbag-configurator`, `cms`, `xa-j`, `xa-uploader`, `prime`, `cover-me-pretty`. The `drizzle-orm: false` alias change must either be scoped to brikette's own `turbopack.resolveAlias` (preferred) or verified safe for all 12 other apps. Other webpack callback changes (e.g. `NormalModuleReplacementPlugin` removal) apply to all 13.
  - Pre-commit hooks must pass; `--no-verify` is prohibited.
- Assumptions:
  - `import.meta.glob` (Turbopack's static glob API) is available and supports the required pattern shapes in the current Next.js + Turbopack version. *Unverified — must be confirmed in spike (Task 3). Variable-path dynamic imports may fail Turbopack static analysis entirely, not just lose pattern filtering.*
  - `guides.imports.ts` explicit-import pattern is acceptable as the primary guides loader if `import.meta.glob` is not available for dynamic-path patterns. (Currently the application-level fallback via `guides.backend.ts`; migration promotes it to the startup-time primary.)
  - `drizzle-orm` stub approach: a minimal stub file (e.g. `packages/stubs/src/drizzle-orm.ts` exporting nothing) is acceptable for the brikette `turbopack.resolveAlias` entry. The `false` alias in the shared webpack callback should be left unchanged (serves other apps that use `--webpack`).

---

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/next.config.mjs:136` — webpack callback: sets `resolve.alias` and `resolve.fallback`
- `packages/next-config/next.config.mjs:18` — shared webpack callback (chains into brikette via `sharedConfig.webpack(config, context)`)
- `apps/brikette/src/utils/webpackGlob.ts:1` — webpack glob abstraction entry, exposes `supportsWebpackGlob`, `getWebpackContext`, `webpackContextToRecord`

### Key Modules / Files

- `apps/brikette/src/utils/webpackGlob.ts` — uses `import.meta.webpackContext` (webpack-only); the central item to replace
- `apps/brikette/src/locales/guides.state.ts` — primary consumer (3 `webpackContextToRecord` calls for legacy/splitGlobal/splitContent bundles); falls back to `{}` when `supportsWebpackGlob` is false
- `apps/brikette/src/locales/guides.imports.ts` — Turbopack-safe guide loader using explicit per-slug `import()` calls. Currently the application-level fallback via `guides.backend.ts` → `loadGuidesNamespaceFromImports()`: when `getGuidesBundle()` returns `undefined` (state map is empty under Turbopack), `guides.backend.ts` calls into this module. Migration promotes it to the startup-time primary by wiring it into `guides.state.ts`.
- `apps/brikette/src/locales/locale-loader.ts:65` — consumer of webpackGlob + `/* webpackInclude: /(^|\/)[a-z]{2}\/[^/]+\.json$/ */` comment. **Has a real `dynamic import()` fallback path** — locale loading is already Turbopack-compatible functionally. Migration removes dead webpack branches and the `webpackInclude` optimization comment only.
- `apps/brikette/src/locales/locale-loader.guides.ts:22` — `/* webpackInclude: /(^|\/)[a-z]{2}\/guides(\/.*)?\.json$/ */` comment only (does NOT import webpackGlob)
- `apps/brikette/src/routes/guides/blocks/utils/moduleResolver.ts` — consumer of webpackGlob (JSON-LD module discovery)
- `apps/brikette/src/routes/breakfast-menu/strings.ts` — consumer of webpackGlob
- `apps/brikette/src/routes/how-to-get-here/content-modules.ts:11` — `/* webpackInclude: /how-to-get-here\/routes\/[^/]+\.json$/ */` comment only (no webpackGlob import)
- `apps/brikette/src/utils/prefetchInteractive.ts:85-90` — 6 `/* webpackPrefetch: true */` hints
- `packages/next-config/next.config.mjs:46,81` — `drizzle-orm: false` alias + `NormalModuleReplacementPlugin`

### Patterns & Conventions Observed

- `supportsWebpackGlob` boolean gate — evidence: `apps/brikette/src/utils/webpackGlob.ts:15`. All consumers check this flag before calling webpack APIs; fallback paths return `{}` or use `guides.imports.ts`.
- Test mock pattern: global `moduleNameMapper` in `jest.config.cjs:29-31` replaces `webpackGlob.ts` with `src/test/__mocks__/webpackGlob.ts` (exports `supportsWebpackGlob = false`, no-op stubs). This is why Jest currently passes despite the webpack-only API.
- `jest-import-meta-transform.cjs` — strips `import.meta` at the transformer layer before ts-jest sees it. The `import.meta` → `({})` fallback is the catch-all that makes `webpackGlob.ts` parse without error in Jest CJS mode.
- Turbopack `resolveAlias` already partially configured in `apps/brikette/next.config.mjs:128-135` with `@` and `@acme/design-system/utils/style` aliases.

### Data & Contracts

- Types/schemas/events:
  - `WebpackContextFactory`, `RequireContext`, `ModuleRecord<T>` — defined in or adjacent to `webpackGlob.ts`; consumers use `ModuleRecord<GuidesNamespace>` from `guides.state.ts`
  - If `import.meta.glob` replaces `webpackContext`, the return type changes from a `RequireContext` to a `Record<string, () => Promise<module>>` (async glob). `webpackContextToRecord` and its callers would need updating.
- Persistence:
  - No database writes involved — this is a build-time and bundle-loading concern only.
- API/contracts:
  - The `guides.imports.ts` pattern exposes `__CONTENT_KEYS_FOR_TESTS` (used by `guide-content-filtering.test.ts`). If this file becomes the canonical loader, its exports must remain stable.

### Dependency & Impact Map

- Upstream dependencies (what feeds into the affected code):
  - JSON locale files under `apps/brikette/src/locales/**/*.json` — source data for webpack context globs
  - `packages/next-config/next.config.mjs` — shared config inherited by all apps
- Downstream dependents (what consumes the affected code):
  - `guides.state.ts` → all guide page rendering across brikette (critical path)
  - `locale-loader.ts` / `locale-loader.guides.ts` → i18n namespace loading for all pages
  - `moduleResolver.ts` → JSON-LD structured data on guide pages
  - `breakfast-menu/strings.ts` → breakfast menu content
  - `how-to-get-here/content-modules.ts` → how-to-get-here route content
- Likely blast radius:
  - **Medium**: guides locale loading — `guides.backend.ts` provides a working fallback today. The correctness risk is conditional: only if `guides.backend.ts` is broken or bypassed. Primary impact is performance: guides load per-request via dynamic import instead of from pre-cached state. If `webpackGlob.ts` is deleted before guides.state.ts is updated to pre-populate the state map at startup, the per-request path remains but caching is lost.
  - **Medium–High**: `locale-loader.ts` — removal of `webpackInclude` comments under webpack will cause webpack to bundle all JSON files under the dynamic import path without pattern filtering (build size regression). Under Turbopack, variable-path dynamic imports may fail static analysis entirely (not merely lose filtering); this must be verified in the spike.
  - **Low**: `prefetchInteractive.ts` — removing `webpackPrefetch` comments causes a browser prefetch regression (no content failure).
  - **Low**: `drizzle-orm: false` alias — build-time only; app works fine without it if drizzle-orm is never imported on the client.
  - **Zero**: `NormalModuleReplacementPlugin` — drop it; Turbopack handles `node:*` natively.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (primary), Cypress (e2e), Playwright (e2e)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs`
- CI integration: reusable-app.yml in CI

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `webpackGlob.ts` | Unit (mock only) | `src/test/__mocks__/webpackGlob.ts` | Not tested directly; globally mocked in all Jest runs |
| `guides.imports.ts` | Unit | `guide-content-filtering.test.ts` | Tests that CONTENT_KEYS matches live guide set exactly |
| `guides.state.ts` (indirect) | Integration | `guide-diagnostics.test.ts` via `loadGuidesForTest` | Exercises state seeding via test helpers, not the webpack path |
| `locale-loader.ts` | None | — | No test coverage |
| `locale-loader.guides.ts` | None | — | No test coverage |
| `moduleResolver.ts` | None | — | No test coverage |
| `breakfast-menu/strings.ts` | None | — | No test coverage |
| `prefetchInteractive.ts` | Unit | `prefetchInteractive.test.ts` (7 cases) | Good coverage of scheduling, save-data guard, slow connection guard |
| `prefetchInteractive.ts` | Mock | `modal-provider-effects.test.tsx`, `modal-single-host.test.tsx`, `AppLayout.i18n-preload.test.tsx` | Mocked to prevent side-effects in unrelated tests |

#### Coverage Gaps

- Untested paths:
  - `locale-loader.ts` webpack context path (no test; only the Turbopack/empty-map fallback is exercised)
  - `moduleResolver.ts` (no test at all)
  - `breakfast-menu/strings.ts` (no test at all)
- Extinct tests (after migration):
  - `src/test/__mocks__/webpackGlob.ts` — will become dead code once `webpackGlob.ts` is deleted; should be removed
  - `jest.config.cjs` `moduleNameMapper` entries for `webpackGlob` (lines 29-31) — should be removed
  - `jest-import-meta-transform.cjs` — can be simplified or removed once `import.meta.webpackContext` is gone from source (the `import.meta.url` → `""` substitution may still be needed if other files use it)

#### Testability Assessment

- Easy to test:
  - `prefetchInteractive.ts` — already well-tested; removing `webpackPrefetch` comments doesn't change behavior
  - `drizzle-orm` alias fix — build-level change; verified by successful build
  - `NormalModuleReplacementPlugin` removal — build-level change; verified by `node:*` imports still resolving
- Hard to test:
  - Guides locale loading under Turbopack — requires running `next dev` with Turbopack enabled; not testable in Jest
  - Bundle size impact of `webpackInclude` removal — requires build analysis (`next build --analyze`)
- Test seams needed:
  - After replacing `webpackGlob.ts`, ensure the new implementation can be similarly mocked or stubbed in Jest (or that the test helpers in `loadGuidesForTest.ts` continue to work).

#### Recommended Test Approach

- Unit tests for: new replacement module (whatever replaces `webpackGlob.ts`), verifying it returns expected results in Node/test environment
- Integration tests for: locale loading smoke — ensure guide content is non-empty after migration (can add to `guide-diagnostics.test.ts`)
- Build analysis for: bundle size before/after `webpackInclude` removal

### Recent Git History (Targeted)

- `apps/brikette/src/utils/webpackGlob.ts` — 2 commits (`pullman work pt1`, `chore: track pending files`). Very old; no recent activity. Suggests it has been stable but untouched.
- `apps/brikette/src/locales/` — active area. Notable: `fix(turbopack): unblock brikette smoke compile path` (a9e97362de) — indicates Turbopack investigation is already in progress; `fix(brikette): isolate node-only guides loaders from client graph` (1bd4766700) — recent architectural work to isolate server/client boundary in guides loading.
- `apps/brikette/next.config.mjs` — `fix(brikette): alias design-system style for turbopack` (ae38cc4431) — most recent commit added the `@acme/design-system/utils/style` alias to `turbopack.resolveAlias`, confirming active Turbopack migration work.
- `packages/next-config/next.config.mjs` — `feat(nextjs-16-upgrade): migrate async request APIs (TASK-04)` (a4f14ba62b) — Next.js 16 upgrade tasks are actively touching this file. Coordination needed to avoid conflicts.
- `apps/brikette/src/utils/prefetchInteractive.ts` — `feat(ga4): TASK-37 source files missed` (7084d7352c) — GA4 work touched this file recently.

---

## Questions

### Resolved

- Q: Does a Turbopack-safe fallback for guides loading already exist?
  - A: Yes. `guides.imports.ts` uses explicit per-slug `import()` calls and is already the path taken in Jest and any non-webpack environment. `supportsWebpackGlob === false` silently triggers the empty-map path — but the architecture is already prepared for an explicit fallback.
  - Evidence: `apps/brikette/src/locales/guides.imports.ts:4` (comment: "when `import.meta.webpackContext` is unavailable (e.g. Turbopack)")
- Q: Does the Next.js 16 upgrade plan already cover webpack removal?
  - A: No. `docs/plans/nextjs-16-upgrade/` does not exist. PLAT-ENG-0012 is in fact-finding but no plan documents have been written. This is a distinct deliverable.
  - Evidence: directory listing confirmed absence
- Q: Is the `drizzle-orm: false` syntax a hard blocker for Turbopack?
  - A: Yes. Turbopack `resolveAlias` only accepts string paths. `false` is not a valid value. Needs a stub file or conditional.
  - Evidence: `packages/next-config/next.config.mjs:46`

### Open (User Input Needed)

- Q: Should `webpackGlob.ts` be replaced with `import.meta.glob` (Turbopack native) or with the explicit `guides.imports.ts` pattern promoted to primary?
  - Why it matters: determines whether the replacement API is async (glob) or sync (explicit imports), which affects all 4 consumer files.
  - Decision impacted: approach for locale-loader.ts, guides.state.ts, moduleResolver.ts, breakfast-menu/strings.ts
  - Decision owner: Pete
  - Default assumption + risk: Promote `guides.imports.ts` pattern as primary (extend it to cover locale-loader, moduleResolver, breakfast-menu). Risk: verbose, requires listing all modules explicitly; adding a new guide requires updating the list.

- Q: Should `/* webpackPrefetch: true */` comments be replaced with a Turbopack equivalent, or simply removed?
  - Why it matters: Turbopack does not have a `webpackPrefetch` equivalent today. Removing them causes a browser prefetch regression on the rooms/book routes.
  - Decision impacted: prefetchInteractive.ts migration approach
  - Decision owner: Pete
  - Default assumption + risk: Remove comments (accept prefetch regression). Risk: minor UX regression on slow connections when opening modal bundles.

- Q: Should `drizzle-orm: false` alias be handled with a real stub file or with a `conditional` guard?
  - Why it matters: determines whether a new package/file needs to be created.
  - Decision impacted: how to update `packages/next-config/next.config.mjs` and `turbopack.resolveAlias`
  - Decision owner: Pete
  - Default assumption + risk: Create a minimal stub file `packages/stubs/src/drizzle-orm.ts` that exports nothing. Risk: adds a file but is clean and explicit.

---

## Confidence Inputs

- Implementation: 88%
  - Evidence: All affected files identified with exact line numbers. The consumer/fallback pattern is fully understood. The `guides.imports.ts` fallback already implements the target pattern.
  - To reach 80%: already there.
  - To reach 90%: verify that `import.meta.glob` syntax is supported in the brikette app's current Next.js + Turbopack version combination.

- Approach: 72%
  - Evidence: The direction (replace webpackGlob, remove magic comments, fix config) is clear. The specific replacement API for `import.meta.webpackContext` is the open question.
  - To reach 80%: answer the `import.meta.glob` vs explicit-imports question (Open Q1). This gates all 4 consumer file tasks.
  - To reach 90%: prototype the replacement in one consumer (e.g. `locale-loader.ts`) and verify it builds + loads locales correctly under Turbopack.

- Impact: 82%
  - Evidence: Blast radius is well-mapped. The highest-impact risk is performance regression (guides load per-request instead of pre-cached); correctness is protected by the guides.backend.ts fallback chain. All other items are optimization or config-level.
  - To reach 80%: already there.
  - To reach 90%: run `next build --analyze` to quantify the bundle size impact of `webpackInclude` removal.

- Delivery-Readiness: 78%
  - Evidence: The repo is in active Turbopack migration mode (recent commits confirm). Some tasks in `packages/next-config` overlap with Next.js 16 upgrade work (PLAT-ENG-0012), so coordination is needed.
  - To reach 80%: confirm no in-flight branch modifies `packages/next-config/next.config.mjs` in conflicting ways.
  - To reach 90%: agree on task sequencing with Next.js 16 upgrade track.

- Testability: 82%
  - Evidence: `webpackGlob.ts` is already globally mocked in Jest. The replacement mock can be updated in place. `prefetchInteractive.ts` is well-covered. Coverage gaps (locale-loader, moduleResolver) are pre-existing, not introduced by this work.
  - To reach 80%: already there.
  - To reach 90%: add a smoke test asserting guides locale loading returns non-empty content.

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `guides.state.ts` returns empty locale maps silently if Turbopack enabled before replacement | Medium | Medium | Gate: do not enable `--turbopack` flag in `next dev` until webpackGlob replacement is complete and verified. Note: `guides.backend.ts` fallback keeps guide loading correct; impact is performance regression + silent dead-code execution, not content failure. |
| Removing `webpackInclude` without replacement causes bundle size regression | High (certain if removed) | Medium | Replace with `import.meta.glob` patterns; run `next build --analyze` before/after |
| `drizzle-orm: false` breaks Turbopack build if shared config is changed naively | High (certain if alias is ported as-is) | Medium | Create a stub file before changing the alias; test both webpack and Turbopack builds |
| `packages/next-config` changes conflict with in-flight Next.js 16 upgrade tasks | Medium | Medium | Coordinate with PLAT-ENG-0012; prefer touching `next-config` in a single PR |
| `jest-import-meta-transform.cjs` becomes stale after webpackGlob removal, masking future `import.meta` issues | Low | Low | Remove or simplify transformer as part of cleanup task |
| `moduleResolver.ts` and `breakfast-menu/strings.ts` have no tests; replacement may introduce silent regressions | Medium | Medium | Add smoke assertions or review manually after replacement |
| Turbopack already active via `turbopack:` config block — urgency narrative and gate constraint may be wrong | Medium | Medium | Verify: check CI/build logs for Turbopack output signatures before sequencing |
| Variable-path dynamic imports (`` import(`./${lang}/${ns}.json`) ``) may fail Turbopack static analysis entirely, not just lose pattern filtering | Medium | High | Spike (Task 3) must include a Turbopack build test; do not treat comment removal as the only migration step |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - The `supportsWebpackGlob` boolean gate pattern must be preserved or replaced with an equivalent feature-detection mechanism during the transition period (if migrating incrementally file-by-file).
  - `packages/next-config/next.config.mjs` changes must be backward-compatible: other apps (`cms`, `reception`, etc.) use `--webpack` and depend on the existing aliases.
  - Pre-commit hooks must pass on every commit; typecheck-staged.sh and lint-staged-packages.sh are active.
- Rollout/rollback expectations:
  - Incremental migration is preferred: replace one consumer at a time, verifying tests pass after each.
  - The `webpackGlob.ts` file should be the last thing removed (after all consumers are migrated).
  - Rollback: any individual task is reversible by reverting the consumer file; no database or deployment changes involved.
- Observability expectations:
  - Build size before/after `webpackInclude` removal (`next build --analyze`).
  - Smoke test: assert guides locale loading is non-empty after migration.

---

## Suggested Task Seeds (Non-binding)

1. **Drop `NormalModuleReplacementPlugin`** from `packages/next-config/next.config.mjs` (trivial, zero risk, do first).
2. **Create `drizzle-orm` stub file** and add entry to brikette's `turbopack.resolveAlias` (the `drizzle-orm: false` entry in the shared webpack callback in `packages/next-config` is left unchanged — it serves the 12 other `--webpack` apps).
3. **Decide and prototype** `import.meta.glob` vs explicit-imports replacement for `webpackGlob.ts` (spike task — answer Open Q1). **Tasks 4-8 are blocked on this task. Do not begin consumer file migrations until the spike produces a confirmed replacement API and a verified Turbopack build.**
4. **Migrate `locale-loader.ts`** *(blocked on Task 3)* — remove dead webpackGlob branches + remove `webpackInclude` comment. Dynamic import() fallback already works; this is dead-code removal.
5. **Migrate `locale-loader.guides.ts`** — remove `webpackInclude` comment only (does NOT import webpackGlob; no API replacement needed; not blocked on Task 3).
6. **Migrate `guides.state.ts`** *(blocked on Task 3)* — replace 3 `webpackContextToRecord` calls with chosen replacement API; wire guides.imports.ts as the startup-time state populator so state is pre-cached.
7. **Migrate `moduleResolver.ts`** *(blocked on Task 3)* — replace webpackGlob usage.
8. **Migrate `breakfast-menu/strings.ts`** *(blocked on Task 3)* — replace webpackGlob usage.
9. **Remove `how-to-get-here` `webpackInclude` comment** — replace with explicit glob.
10. **Remove `webpackPrefetch` comments** from `prefetchInteractive.ts`.
11. **Delete `webpackGlob.ts`** and its test mock/mapper entries.
12. **Simplify `jest-import-meta-transform.cjs`** — remove `webpackContext` handling once source is clean.
13. **Verify Turbopack build** with `--turbopack` flag end-to-end.

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `next build` passes with no webpack errors
  - `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs` passes
  - `webpackGlob.ts` deleted from source tree
  - No `import.meta.webpackContext` references remain in source
  - No `/* webpackInclude */` or `/* webpackPrefetch */` comments remain in source
  - `drizzle-orm` stub entry added to brikette's `turbopack.resolveAlias`; `drizzle-orm: false` in shared webpack callback left unchanged
- Post-delivery measurement plan:
  - Run `next build --analyze` and compare bundle size to baseline (especially locale JSON chunks)
  - Enable `--turbopack` in `next dev` and smoke-test guides pages load non-empty content

---

## Evidence Gap Review

### Gaps Addressed

- All 10 affected files are identified with exact paths and line numbers (repo-diff evidence).
- Consumer/dependency chain is fully traced: 4 webpack glob consumers + 3 magic-comment-only files.
- Turbopack fallback path (`guides.imports.ts`) was confirmed as existing and architecturally correct.
- Test landscape confirmed: `webpackGlob.ts` is globally mocked; replacement will inherit same mock slot.
- Git history reviewed: active Turbopack migration work confirmed in locale area; coordination needed with Next.js 16 upgrade.
- `drizzle-orm: false` confirmed non-portable to Turbopack via direct config file inspection.
- `NormalModuleReplacementPlugin` confirmed droppable (Turbopack handles `node:*` natively).

### Confidence Adjustments

- Approach confidence reduced to 72% (from initial ~80%) due to unresolved Open Q1 (`import.meta.glob` vs explicit imports). This is the single biggest unknown; all consumer migration tasks depend on its answer.
- Delivery-Readiness reduced to 78% due to overlap risk with PLAT-ENG-0012 (Next.js 16 upgrade) which touches the same `packages/next-config` file.

### Remaining Assumptions

- `import.meta.glob` is available and supports the required pattern shapes in the current Next.js + Turbopack version. *Not verified against current Next.js + Turbopack version — must be resolved in spike (Task 3).*
- `drizzle-orm` is never imported anywhere in `apps/brikette/src`. *Confirmed by grep.* Unverified for the other 12 shared-config apps — verify before changing the shared webpack callback alias.
- Other apps in the monorepo (using `--webpack`) are not affected by changes to `packages/next-config` webpack callback, provided the webpack behavior for their aliases is preserved unchanged. *Assumed; would need to verify builds for all 13 affected apps.*
- The `guides.state.ts` → `guides.backend.ts` → `guides.imports.ts` fallback chain is not bypassed by any direct consumer of `guides.state.ts` that skips `guides.backend.ts`. *Assumed from architecture review; verify by grepping for direct importers of `guides.state`.*

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - Open Q1 (replacement API choice) should be answered before building task TASK-03+. It can be resolved in a spike task at the start of the plan.
- Recommended next step:
  - `/lp-do-plan` — the brief is sufficient to produce a sequenced plan. Begin with the no-risk tasks (NormalModuleReplacementPlugin drop, drizzle-orm stub) while the spike resolves Open Q1.
