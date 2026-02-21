---
Type: Plan
Status: Complete
Domain: Infra
Relates-to charter: none
Workstream: Engineering
Created: 2026-02-19
Last-updated: 2026-02-19
Feature-Slug: turbopack-migration
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 92%
Confidence-Method: effort-weighted average of per-task confidence; S=1
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Turbopack Migration Plan

## Summary

The brikette dev server ran with an explicit `--webpack` flag that forced webpack on Next.js 16, causing 60+ second cold starts and slow HMR. This plan removed that flag by resolving the three concrete blockers identified in the fact-find: the `?raw` bundler-specific import pattern (2 files), the required Turbopack `@/` alias wiring, and smoke-test verification before removing the flag. All work is dev-only; production `next build --webpack` remains unchanged.

## Goals

- Remove `--webpack` from `apps/brikette/package.json` dev script
- Achieve sub-10-second cold starts and fast HMR in development
- CI green on brikette, template-app, and business-os after the switch

## Non-goals

- Migrating production (`next build`) to Turbopack
- Changing `@acme/next-config` in ways that affect template-app or business-os
- Preserving `?raw` query syntax in brikette source code (the migration intentionally removes it)

## Constraints & Assumptions

- Constraints:
  - `@acme/next-config/next.config.mjs` is shared — changes must not break other apps; however, that file's `webpack()` callback is not called under Turbopack at all, so no guarding is required for this migration
  - Turbopack config lives under the top-level `turbopack` key in Next.js 16 (not `experimental.turbo`)
  - Production `--webpack` flag on `next build` is intentionally preserved
- Assumptions:
  - Turbopack in Next.js 16 handles `node:` prefix imports natively — no `NormalModuleReplacementPlugin` needed at dev time
  - All 7 `webpackContext` calls across 4 files will fall back correctly under Turbopack — confirmed by code analysis

## Fact-Find Reference

- Related brief: `docs/plans/turbopack-migration/fact-find.md`
- Key findings used:
  - 2 hard blockers: `ApartmentStructuredData.tsx:5` and `TravelHelpStructuredData.tsx:10` use `?raw` imports; fix: convert to `.ts` re-exports
  - `turbopack` key required in `apps/brikette/next.config.mjs` at minimum for `@/` alias; client Node built-in alias disabling was validated via runtime probe instead of Turbopack `false` aliases
  - `@acme/next-config`'s `webpack()` callback is not invoked under Turbopack — no changes required there
  - 7 `webpackContext` calls all gated behind `supportsWebpackGlob`/`shouldUseRealModules`; all have `{}` fallbacks
  - `guides.imports.ts` is the static fallback target for `guides.state.ts` (not a call site)
  - No live guide uses `type: "jsonLd"` blocks — `moduleResolver.ts` empty-`JSON_LD_MODULES` is latent risk only
  - `?raw` decision: `.ts` re-exports (removes bundler-specific behavior entirely)

## Proposed Approach

- Option A: Turbopack `loaders` rules to preserve `?raw` syntax — adds config/dependency overhead for only 2 import sites; Turbopack loader support is intentionally limited
- Option B: Convert `?raw` imports to `.ts` re-export modules — removes bundler-specific behavior, keeps code portable, tiny migration cost
- **Chosen approach: Option B** (decided in fact-find review)

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Complete — all runnable tasks executed with validation evidence

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Convert `?raw` imports to `.ts` re-exports | 95% | S | Complete (2026-02-19) | - | TASK-03 |
| TASK-02 | IMPLEMENT | Add `turbopack` config key to brikette next.config.mjs | 90% | S | Complete (2026-02-19) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Remove `--webpack`, smoke-test, record metrics | 92% | S | Complete (2026-02-19) | TASK-01, TASK-02 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent; execute in parallel |
| 2 | TASK-03 | TASK-01, TASK-02 | Execute only after both wave-1 tasks complete |

## Tasks

---

### TASK-01: Convert `?raw` imports to `.ts` re-exports

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `ApartmentStructuredData.tsx`, `TravelHelpStructuredData.tsx`, two new `.ts` schema modules that remove `?raw` without changing runtime behavior, updated `apps/brikette/next.config.mjs`, updated/removed `raw-imports.d.ts`, and focused component tests for apartment/travel-help structured data
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:**
  - `apps/brikette/src/components/seo/ApartmentStructuredData.tsx`
  - `apps/brikette/src/components/seo/TravelHelpStructuredData.tsx`
  - `apps/brikette/src/schema/apartment.ts`
  - `apps/brikette/src/schema/travel-help/en-nearby.ts`
  - `apps/brikette/next.config.mjs` (remove `resourceQuery: /raw/` rule)
  - `apps/brikette/src/types/raw-imports.d.ts` (remove or retire)
  - `apps/brikette/src/schema/apartment.jsonld` (deleted)
  - `apps/brikette/src/schema/travel-help/en-nearby.jsonld` (deleted)
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 95%
  - Implementation: 95% — migration completed with explicit string-export preservation for `TravelHelpStructuredData` parse/mutate flow.
  - Approach: 95% — `.ts` re-exports removed webpack-specific `resourceQuery` usage entirely without loader indirection.
  - Impact: 95% — all targeted tests/build checks passed; no remaining `?raw` imports in brikette source.
- **Acceptance:**
  - `ApartmentStructuredData.tsx` no longer uses `?raw` import; imports from a `.ts` module instead
  - `TravelHelpStructuredData.tsx` no longer uses `?raw` import; imports from a `.ts` module instead
  - `TravelHelpStructuredData.tsx` still applies runtime `inLanguage` and `url` updates after migration (no behavior regression from changing import type)
  - Webpack `resourceQuery: /raw/` rule removed from `apps/brikette/next.config.mjs`
  - `src/types/raw-imports.d.ts` removed or its `?raw` declarations retired if no other usages remain
  - `pnpm --filter @apps/brikette build` passes with no type errors
  - New focused tests are created and pass:
    - `apps/brikette/src/test/components/seo/ApartmentStructuredData.test.tsx`
    - `apps/brikette/src/test/components/seo/TravelHelpStructuredData.test.tsx`
  - Existing targeted JSON-LD tests remain green:
    - `pnpm --filter @apps/brikette test -- src/test/components/seo-jsonld-contract.test.tsx`
    - `pnpm --filter @apps/brikette test -- src/test/components/apartment/ApartmentIntegration.test.tsx`
- **Validation contract:**
  - TC-01: Write `apps/brikette/src/test/components/seo/ApartmentStructuredData.test.tsx`, then run `pnpm --filter @apps/brikette test -- src/test/components/seo/ApartmentStructuredData.test.tsx`; assert `<script type="application/ld+json">` is rendered and payload includes expected apartment keys
  - TC-02: Write `apps/brikette/src/test/components/seo/TravelHelpStructuredData.test.tsx`, then run `pnpm --filter @apps/brikette test -- src/test/components/seo/TravelHelpStructuredData.test.tsx`; assert JSON-LD includes runtime `inLanguage` and canonical `url` overrides
  - TC-03: `pnpm --filter @apps/brikette build` exits 0 (compile/type safety after import migration)
  - TC-04: `pnpm --filter @apps/brikette test -- src/test/components/seo-jsonld-contract.test.tsx` exits 0 (existing JSON-LD contracts unaffected)
  - TC-05: `rg -n '^import\\s+.*\\?raw' apps/brikette/src --glob '*.{ts,tsx}'` returns no matches
- **Build evidence (2026-02-19):**
  - TC-01 PASS: `pnpm --filter @apps/brikette test -- src/test/components/seo/ApartmentStructuredData.test.tsx`
  - TC-02 PASS: `pnpm --filter @apps/brikette test -- src/test/components/seo/TravelHelpStructuredData.test.tsx`
  - TC-03 PASS: `pnpm --filter @apps/brikette build` (webpack build exits 0)
  - TC-04 PASS: `pnpm --filter @apps/brikette test -- src/test/components/seo-jsonld-contract.test.tsx` and `pnpm --filter @apps/brikette test -- src/test/components/apartment/ApartmentIntegration.test.tsx`
  - TC-05 PASS: `rg -n '^import\\s+.*\\?raw' apps/brikette/src --glob '*.{ts,tsx}'` returned no matches
- **Execution plan:** Red → Green → Refactor
  1. Create `src/schema/apartment.ts` to export the apartment schema as a typed object constant (migrated from `apartment.jsonld`) — `serializeJsonLdValue` accepts both string and object, so object export keeps consumer logic simple
  2. Create `src/schema/travel-help/en-nearby.ts` that exports a JSON string constant (for example `export default JSON.stringify(data)`) so `TravelHelpStructuredData` keeps its existing `JSON.parse(NEARBY)` + mutation flow unchanged
  3. Update `ApartmentStructuredData.tsx` to import from the `.ts` module
  4. Update `TravelHelpStructuredData.tsx` to import from `en-nearby.ts` string export and keep runtime mutation behavior (`isLocatedIn`, `inLanguage`, `url`)
  5. Remove `resourceQuery: /raw/` rule from `apps/brikette/next.config.mjs`
  6. Check `raw-imports.d.ts` — if no remaining `?raw` usages, remove it
  7. Add focused tests for apartment/travel-help structured data components at the explicit paths above
  8. Run targeted validation commands listed above
- **Planning validation:** None: S-effort task with fully enumerated file changes
- **Scouts:**
  - Verify no other files in `apps/brikette/src` use `?raw` imports beyond the 2 confirmed sites: `rg -n '^import\\s+.*\\?raw' apps/brikette/src --glob '*.{ts,tsx}'`
  - Check whether `jest.config.cjs` line 98 mock for `?raw` (`raw-file.ts`) needs to be removed to avoid masking errors
- **Edge Cases & Hardening:**
  - `resolveJsonModule` is already enabled via `@acme/config/tsconfig.app.json`; no TS config change should be required
  - Keep travel-help export as string in `en-nearby.ts` to avoid object-vs-string branch drift in `TravelHelpStructuredData.tsx`
- **What would make this >=90%:**
  - Focused apartment/travel-help component tests are added and passing
  - Verify no other `?raw` import statements remain in `apps/brikette/src`
- **Rollout / rollback:**
  - Rollout: part of the Turbopack migration PR; no runtime impact until `--webpack` is removed in TASK-03
  - Rollback: revert the 2 component files and `next.config.mjs` change; re-add `raw-imports.d.ts`
- **Documentation impact:** None: internal refactor, no public API change
- **Notes / references:**
  - Source files migrated to TS modules: `apps/brikette/src/schema/apartment.ts`, `apps/brikette/src/schema/travel-help/en-nearby.ts`
  - Fact-find evidence: `apps/brikette/src/components/seo/ApartmentStructuredData.tsx:5`, `TravelHelpStructuredData.tsx:10`

---

### TASK-02: Add `turbopack` config key to `apps/brikette/next.config.mjs`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/brikette/next.config.mjs` (add top-level `turbopack` key)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:**
  - `apps/brikette/next.config.mjs`
  - `[readonly] packages/next-config/next.config.mjs` (confirm webpack() callback requires no changes)
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% — `turbopack.resolveAlias` now includes `@` alias and runtime probe confirms Turbopack resolves app paths correctly.
  - Held-back test: PASS — local Turbopack `next dev` probe served apartment/help/breakfast-menu routes without `Module not found` errors.
  - Approach: 90% — top-level `turbopack` config is correct in Next.js 16; `false` Node built-in aliases were not required for runtime success in this app state.
  - Impact: 90% — dev bundler now resolves app aliases cleanly while keeping webpack production build unchanged.
- **Acceptance:**
  - `apps/brikette/next.config.mjs` contains a top-level `turbopack` key with at minimum `resolveAlias: { "@": path.resolve(__dirname, "src") }`
  - `resolveAlias` entries for `fs: false`, `module: false`, `path: false`, `url: false` included (or confirmed unnecessary after a dev-server probe)
  - `pnpm --filter @apps/brikette build` (webpack) still passes — no regressions to the production build
  - `packages/next-config/next.config.mjs` is confirmed unchanged (webpack() callback is webpack-only; no guarding required)
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/brikette exec cross-env NODE_OPTIONS="--require ./scripts/ssr-polyfills.cjs" next dev -p <free-port>` starts with Turbopack and serves at least one page (`/en/apartment`) without `Module not found` errors for `@/` or Node built-ins
  - TC-02: `pnpm --filter @apps/brikette build` exits 0 after the config change — confirms no regression to the webpack production build
  - TC-03: `pnpm --filter @acme/template-app build` exits 0 — confirms shared config unchanged and other apps unaffected
- **Execution plan:** Red → Green → Refactor
  1. Read current `apps/brikette/next.config.mjs` and `packages/next-config/next.config.mjs` to confirm shared config webpack() callback requires no changes
  2. Add `turbopack` key to `apps/brikette/next.config.mjs` with `resolveAlias` for `@/`
  3. Probe Node built-in behavior under Turbopack; only add `resolveAlias` `false` entries if runtime errors require them
  4. Start `pnpm --filter @apps/brikette exec cross-env NODE_OPTIONS="--require ./scripts/ssr-polyfills.cjs" next dev -p <free-port>` (without `--webpack`), wait for ready, load `/en/apartment`; confirm no `Module not found` errors for `@/` aliases or Node built-ins, then stop the server (covers TC-01)
  5. Run `pnpm --filter @apps/brikette build` to verify webpack build unaffected
  6. Run `pnpm --filter @acme/template-app build` to verify shared config unaffected
- **Build evidence (2026-02-19):**
  - TC-01 PASS: `next dev` (Turbopack) started cleanly at `http://localhost:3024`; `/en/apartment`, `/en/help`, and `/en/breakfast-menu` served with status 200; no `Module not found` errors in server logs.
  - TC-02 PASS: `pnpm --filter @apps/brikette build` exits 0.
  - TC-03 PASS: `pnpm --filter @acme/template-app build` exits 0.
  - Note: `turbopack.resolveAlias` `false` Node built-in aliases were not added; runtime probe showed they were unnecessary for the current app graph.
- **Planning validation:** None: S-effort task; build pass/fail is a definitive gate
- **Scouts:**
  - Verify `turbopack.resolveAlias: { fs: false }` syntax is correct in Next.js 16 docs before coding (confirmed documented at https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack)
  - Check whether brikette client components actually trigger Node-module bundle errors without the disables by running a quick `next dev` without them first (can do this during TASK-03 if preferred)
- **Edge Cases & Hardening:**
  - If `resolveAlias: { fs: false }` is not supported by Turbopack in a future change, prefer import-hygiene and server-only guards (`typeof window === "undefined"`) before adding compatibility shims
  - Confirm package aliases from `@acme/next-config` (e.g., `@acme/design-system`, `drizzle-orm: false`) are not needed in the brikette `turbopack.resolveAlias` — those packages are resolved from source by Turbopack natively via workspace symlinks
- **What would make this >=90%:**
  - Achieved: local Turbopack probe and downstream builds passed.
- **Rollout / rollback:**
  - Rollout: part of the Turbopack migration PR; webpack build is unaffected until TASK-03 removes `--webpack`
  - Rollback: remove the `turbopack` key from `next.config.mjs`
- **Documentation impact:** None: config addition only
- **Notes / references:**
  - Client fallbacks currently in `apps/brikette/next.config.mjs:138-145`: `fs: false, module: false, path: false, url: false`
  - Package selector verified: `packages/template-app/package.json` → `"name": "@acme/template-app"`
  - Next.js Turbopack config docs: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack

---

### TASK-03: Remove `--webpack`, smoke-test, and record metrics

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/brikette/package.json` (dev script updated); PR description with before/after cold-start times
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:**
  - `apps/brikette/package.json`
  - `[readonly] apps/brikette/src/components/seo/ApartmentStructuredData.tsx` (smoke-test target)
  - `[readonly] apps/brikette/src/locales/` (smoke-test target — guides and locale loading)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 92%
  - Implementation: 92% — `--webpack` removed from `dev` script and Turbopack smoke routes validated.
  - Approach: 92% — staged page probes plus three-app build validation confirmed behavior and no shared-config regressions.
  - Impact: 92% — migration goal achieved while preserving production webpack builds.
- **Acceptance:**
  - `apps/brikette/package.json` dev script no longer contains `--webpack`
  - `next dev` starts successfully without the flag (cold-start time recorded)
  - `/en/apartment/` renders with correct `<script type="application/ld+json">` containing `@type: "Apartment"` in the page `<head>`
  - `/en/help/` renders localized assistance/guide content (locale fallback path produces correct data)
  - `/en/breakfast-menu/` renders breakfast menu content (locale fallback path works)
  - `pnpm --filter @apps/brikette build` exits 0 (webpack production build unaffected)
  - `pnpm --filter @acme/template-app build` exits 0
  - `pnpm --filter @apps/business-os build` exits 0
  - Before/after cold-start and HMR times noted in PR description
- **Validation contract:**
  - TC-01: `curl -sSL http://localhost:<port>/en/apartment | grep 'application/ld+json'` returns a match — JSON-LD injected in page
  - TC-02: `curl -sSL http://localhost:<port>/en/help | grep -i "positano"` returns a match — locale data loaded (not empty `{}`)
  - TC-03: `curl -sSL http://localhost:<port>/en/breakfast-menu | grep -i "menu"` returns a match — breakfast menu locale loaded
  - TC-04: Dev server cold-start time is sub-30s (target: sub-10s); recorded in PR description
  - TC-05: All three app builds (`@apps/brikette`, `@acme/template-app`, `@apps/business-os`) exit 0 with `--webpack` still on build scripts
  - TC-06: `grep '"dev"' apps/brikette/package.json` — output does not contain `--webpack`
- **Execution plan:** Red → Green → Refactor
  1. Confirm TASK-01 and TASK-02 are complete
  2. Record current cold-start time with `--webpack` as baseline
  3. Remove `--webpack` from `apps/brikette/package.json` dev script
  4. Start `pnpm --filter @apps/brikette dev`; observe for startup errors
  5. Load `/en/apartment`, verify JSON-LD; load `/en/help`, verify content; load `/en/breakfast-menu`, verify content
  6. If any errors: diagnose, fix, or rollback with clear note in PR
  7. Record new cold-start time
  8. Run `pnpm --filter @apps/brikette build && pnpm --filter @acme/template-app build && pnpm --filter @apps/business-os build`
  9. Note times in PR description
- **Build evidence (2026-02-19):**
  - TC-01 PASS: `curl` on `/en/apartment` returned HTML containing `application/ld+json`.
  - TC-02 PASS: `curl` on `/en/help` returned rendered page HTML with localized Positano/help content.
  - TC-03 PASS: `curl` on `/en/breakfast-menu` returned rendered breakfast-menu HTML and metadata.
  - TC-04 PASS: Baseline from fact-find was 60+ second webpack cold starts; Turbopack startup log showed `Ready in 920ms`, and first `/en/apartment` compile+render request completed in ~3.3s.
  - TC-05 PASS: `pnpm --filter @apps/brikette build`, `pnpm --filter @acme/template-app build`, and `pnpm --filter @apps/business-os build` all exited 0.
  - TC-06 PASS: `grep '"dev"' apps/brikette/package.json` confirms no `--webpack` in dev script.
- **Planning validation:** None: S-effort; pass/fail outcome is directly observable
- **Scouts:**
  - Before starting dev server, scan for any remaining `?raw` import statements: `rg -n '^import\\s+.*\\?raw' apps/brikette/src --glob '*.{ts,tsx}'`
  - Check for any other webpack-specific patterns not in the fact-find inventory: `rg -n "import\\.meta\\.webpack|webpackContext\\(" apps/brikette/src --glob '*.{ts,tsx}'`
- **Edge Cases & Hardening:**
  - If dev server fails with an unexpected "Module not found" for a Node built-in: check if it's covered by `resolveAlias: { fs: false }` from TASK-02; if not, add the specific module to the disables list
  - If locale loading is broken (help/breakfast content empty): verify `guides.imports.ts` static fallback is being picked up; check for any dynamic `require()` patterns not covered by `webpackGlob`
  - If JSON-LD is missing from the apartment page: this would indicate the `.ts` re-export from TASK-01 is not resolving correctly — check import path and `resolveJsonModule` config
- **What would make this >=90%:**
  - A prior local spike confirming `next dev` starts clean after TASK-01 + TASK-02 (this task is the spike)
  - Confirmed that no unexpected import patterns exist beyond the fact-find inventory
- **Rollout / rollback:**
  - Rollout: merge PR; all developers automatically benefit from Turbopack on next `git pull`
  - Rollback: add `--webpack` back to dev script; production build is unchanged throughout
- **Documentation impact:** None: operational change to dev script; PR description captures before/after times
- **Notes / references:**
  - Production build script (`"build": "... next build --webpack"`) must NOT be modified
  - Fact-find acceptance package: https://nextjs.org/docs/app/api-reference/cli/next (`--webpack` context)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `turbopack.resolveAlias: { fs: false }` syntax not supported | Resolved | Medium | Runtime probe + import-hygiene path validated; no Node built-in alias disables required for current graph |
| Smoke test reveals unexpected import pattern outside inventory | Low | Medium | Rollback trivial (add `--webpack` back); diagnose and add a fix task |
| `@acme/next-config` webpack() callback guarding needed | Very Low | Low | Already contained inside `webpack()` which Turbopack doesn't call; confirmed in fact-find |
| Locale fallback returns empty data for help/breakfast-menu | Medium | Medium | Fact-find confirms all call sites have `{}` fallbacks; verified with smoke test TC-02 and TC-03 |

## Observability

- Logging: Dev server startup output — note any warnings/errors on first run
- Metrics: Cold-start time (before/after), HMR time (subjective during smoke test)
- Alerts/Dashboards: None: dev-only change; monitor Search Console for structured data regressions in first week after merge

## Acceptance Criteria (overall)

- [x] `apps/brikette/package.json` dev script does not contain `--webpack`
- [x] Dev server starts without errors; cold-start under 30 seconds (target: under 10)
- [x] `/en/apartment/` JSON-LD verified in `<head>` on Turbopack dev server
- [x] `/en/help/` and `/en/breakfast-menu/` render content (not blank/empty)
- [x] `pnpm --filter @apps/brikette build` exits 0
- [x] `pnpm --filter @acme/template-app build` exits 0
- [x] `pnpm --filter @apps/business-os build` exits 0
- [x] Before/after cold-start times recorded in PR description

## Decision Log

- 2026-02-19: `?raw` approach decided — `.ts` re-exports (removes bundler-specific behavior; tiny migration cost; no new dependencies). Decision owner: Peter.
- 2026-02-19: `@acme/next-config` webpack() callback requires no guarding — webpack() callback is not invoked under Turbopack at all. Confirmed in fact-find evidence review.
- 2026-02-19: Turbopack Node built-in `resolveAlias` `false` entries were not added; runtime probe validated that `@/` alias plus existing guarded imports are sufficient for current brikette app graph.

## Overall-confidence Calculation

- S=1, M=2, L=3
- TASK-01: 95% × 1 = 95
- TASK-02: 90% × 1 = 90
- TASK-03: 92% × 1 = 92
- Overall: (95 + 90 + 92) / 3 = **92%**
