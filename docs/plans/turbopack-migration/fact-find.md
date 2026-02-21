---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-02-19
Last-updated: 2026-02-19
Feature-Slug: turbopack-migration
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/turbopack-migration/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Turbopack Migration Fact-Find Brief

## Scope

### Summary

The brikette Next.js 16 dev server runs with an explicit `--webpack` flag, forcing the old webpack bundler for both `next dev` and `next build`. This causes 60+ second cold-start compilation and slow HMR. Next.js 16 ships Turbopack as the stable default dev bundler; switching would yield 10–100× faster cold starts and HMR.

Three blockers prevent a direct flag removal today. This brief documents each blocker, its fix path, and the sequencing needed to land the switch safely.

### Goals

- Remove `--webpack` from `apps/brikette/package.json` dev script
- Achieve sub-10-second cold starts and fast HMR in development
- Keep production build on webpack (stable, well-tested) — Turbopack for `next build` is out of scope

### Non-goals

- Migrating production (`next build`) to Turbopack
- Changing `@acme/next-config` in ways that affect other apps (template-app, business-os)
- Removing `?raw` support from production build — only the dev Turbopack path needs an alternative

### Constraints & Assumptions

- Constraints:
  - `@acme/next-config/next.config.mjs` is shared across multiple apps — changes must not break template-app or business-os
  - Turbopack config lives under the top-level `turbopack` key in Next.js 16 (not `experimental.turbo`)
  - Production build stays on webpack; only the `dev` script is changed
- Assumptions:
  - Turbopack handles `node:` prefix imports natively in Next.js 16 (no `NormalModuleReplacementPlugin` needed at dev time)
  - `webpackContext` fallback paths already present in the codebase are functionally correct for Turbopack (7 calls across 4 files, all gated; `moduleResolver.ts:19` produces empty `JSON_LD_MODULES` under Turbopack — silent no-op, no live guides affected today)

---

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/package.json` — `"dev": "... next dev --webpack -p 3012"` — the explicit opt-out flag; also `"build": "... next build --webpack"`
- `apps/brikette/next.config.mjs` — defines the `webpack()` callback; the only app-level webpack config

### Key Modules / Files

- `apps/brikette/next.config.mjs` (lines 124–158) — webpack callback: `@/` alias, client-side Node fallbacks, `?raw` `asset/source` rule
- `packages/next-config/next.config.mjs` (lines 18–94) — shared webpack callback: `extensionAlias`, Node built-in alias stripping, `NormalModuleReplacementPlugin` for `node:` prefix, package aliases (`@acme/design-system`, `drizzle-orm: false`, etc.)
- `apps/brikette/src/utils/webpackGlob.ts` — core abstraction over `import.meta.webpackContext`; exports `supportsWebpackGlob` boolean flag
- `apps/brikette/src/locales/locale-loader.ts` (line 53) — one `getWebpackContext()` call (via local wrapper `getWebpackContextFn:40`); falls back to dynamic `import()` — **Turbopack-safe by design**
- `apps/brikette/src/locales/guides.state.ts` (lines 40, 48, 56) — three `getWebpackContext()` calls behind `shouldUseRealModules` guard; fallback returns `{}`
- `apps/brikette/src/locales/guides.imports.ts` — **not a call site**; this is the static fallback module that guides.state.ts uses when `supportsWebpackGlob` is false (Turbopack path)
- `apps/brikette/src/routes/breakfast-menu/strings.ts` (lines 19, 25) — two `getWebpackContext()` calls behind `supportsWebpackGlob`; fallback returns `{}`
- `apps/brikette/src/components/seo/ApartmentStructuredData.tsx` (line 5) — `import graph from "@/schema/apartment.jsonld?raw"` — hard blocker
- `apps/brikette/src/components/seo/TravelHelpStructuredData.tsx` (line 10) — `import NEARBY from "@/schema/travel-help/en-nearby.jsonld?raw"` — hard blocker

### Patterns & Conventions Observed

- `supportsWebpackGlob` flag pattern — evidence: `apps/brikette/src/utils/webpackGlob.ts:16` — all 7 webpackContext call sites across 4 files are gated; Turbopack degrades gracefully to fallback paths. Full inventory: `locale-loader.ts:53`, `guides.state.ts:40,48,56`, `strings.ts:19,25`, `moduleResolver.ts:19`. (`guides.imports.ts` is the static fallback target used by guides.state.ts when webpack context is unavailable — it is not a call site.)
- **`moduleResolver.ts:19` webpackContext call** — builds `JSON_LD_CONTEXT` via `supportsWebpackGlob ? getWebpackContext(...) : undefined`; `JSON_LD_MODULES` at line 34 is built from `webpackContextToRecord(JSON_LD_CONTEXT)`. Under Turbopack, `supportsWebpackGlob` is false → `JSON_LD_CONTEXT` is `undefined` → `JSON_LD_MODULES` is `{}`. Any `jsonLd`-type guide block then calls `resolveHeadRenderer` which returns `null`, and `applyJsonLdBlock` (jsonLdBlock.tsx:20) emits a warning and adds nothing to the head slot — a silent no-op.
- `?raw` Vite-style query — evidence: `apps/brikette/next.config.mjs:148` + `src/types/raw-imports.d.ts` — custom webpack rule + TypeScript declarations + Jest mapper all in place
- Shared config inheritance — `apps/brikette/next.config.mjs` spreads `sharedConfig` and delegates to `sharedConfig.webpack()` first; brikette-specific overrides follow

### Data & Contracts

- Types/schemas/events:
  - `apps/brikette/src/types/raw-imports.d.ts` — declares `"*.jsonld?raw"` and `"*?raw"` as `string`; must be updated if approach changes
  - `apps/brikette/src/types/vite-env.d.ts` — comment noting `?raw&url` multi-query for future reference
- API/contracts:
  - Next.js 16 Turbopack config key: top-level `turbopack` in `next.config.mjs` — supports `resolveAlias`, `rules` (loader config)

### Dependency & Impact Map

- Upstream dependencies:
  - `packages/next-config/next.config.mjs` — shared config; must isolate webpack-only sections so they only run under webpack
  - Next.js 16.1.6 (`apps/brikette/package.json`) — Turbopack stable in this version
- Downstream dependents:
  - All brikette pages — dev compilation speed improvement affects every developer interaction
  - `ApartmentStructuredData.tsx`, `TravelHelpStructuredData.tsx` — SEO-critical JSON-LD structured data; must not silently break
  - Guides locale loading, breakfast-menu strings — must smoke-test with Turbopack to confirm fallback paths produce correct data
- Likely blast radius:
  - **Dev only** — production build unchanged
  - 2 files require code change (`?raw` imports)
  - 1 shared config file requires guarding webpack-only plugin block
  - Smoke testing required for 4 source files containing 7 webpackContext calls (`locale-loader.ts`, `guides.state.ts`, `strings.ts`, `moduleResolver.ts`); `moduleResolver.ts` is latent risk only

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit/component), Playwright (E2E), Cypress (integration)
- Commands: `pnpm --filter brikette test`, `pnpm -w run test:governed`
- CI integration: GitHub Actions via `reusable-app.yml`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `?raw` imports | Jest mock | `src/test/__mocks__/raw-file.ts` + `jest.config.cjs` line 98 | Mocked at test level; build-time behavior not tested |
| `webpackGlob` | Jest mock | `src/test/__mocks__/webpackGlob.ts` | Returns `{}` — matches Turbopack fallback behaviour |
| Guides bundle hydration | Unit | `loadI18nNs.client-and-preload.test.ts:59` | Covers client branch hydrating guides namespace from prebuilt bundle |
| Guides server fallback | Unit | `loadI18nNs.client-and-preload.test.ts:94` | Covers SSR fallback to filesystem loader when runtime bundle missing |
| JSON-LD contract | Unit | `seo-jsonld-contract.test.tsx:57` | Covers `HomeStructuredData`, `AssistanceFaqJsonLd`, `GuideFaqJsonLd`, `DealsStructuredData` rendering and URL correctness — **does NOT cover `ApartmentStructuredData`/`TravelHelpStructuredData` `?raw` import chain** |
| Apartment JSON-LD schema file | Unit | `ApartmentIntegration.test.tsx:39` | Reads `apartment.jsonld` directly via `fs.readFileSync` — asserts schema fields; does NOT test the webpack `?raw` import chain used by `ApartmentStructuredData.tsx` |

#### Coverage Gaps

- Untested paths:
  - Turbopack-path locale loading (guides, breakfast menu) — no tests verify fallback returns correct data
  - `?raw` alternative implementation (once converted) needs a test or build-time assertion
- Test seams needed:
  - A dev-build smoke test that confirms JSON-LD is injected in the `<head>` of the apartment page

### Recent Git History (Targeted)

- `apps/brikette/next.config.mjs` + `packages/next-config/` — recent commits dominated by Next.js 16 upgrade (TASK-04/05/18) and peerDep fix. No Turbopack-related changes. The `--webpack` flag predates the Next 16 upgrade and was not revisited during it.

---

## Questions

### Resolved

- Q: Does Next.js 16 support Turbopack for `next dev` as stable?
  - A: Yes — Turbopack is the stable default dev bundler in Next.js 16; `--webpack` is the explicit opt-out.
  - Evidence: Next.js 16 release notes; `--webpack` flag presence in dev script.

- Q: Is `ssr-polyfills.cjs` (loaded via `NODE_OPTIONS --require`) Turbopack-compatible?
  - A: Yes — it runs at the Node.js process level before the bundler starts; entirely bundler-agnostic.
  - Evidence: `apps/brikette/scripts/ssr-polyfills.cjs` — patches `globalThis.window` and `document.querySelector` only.

- Q: Do the `webpackContext` fallback paths already exist?
  - A: Yes — all 7 calls across 4 files are gated behind `supportsWebpackGlob` or `shouldUseRealModules` with `{}` or dynamic `import()` fallbacks. `guides.imports.ts` is the static fallback module that guides.state.ts imports when webpack context is unavailable (it is not itself a call site). `moduleResolver.ts:19` produces empty `JSON_LD_MODULES` under Turbopack — safe because no live guide uses `type: "jsonLd"` blocks today.
  - Evidence: `locale-loader.ts:53`, `guides.state.ts:40,48,56`, `strings.ts:19,25`, `moduleResolver.ts:19`; `webpackGlob.ts:16` (gate).

- Q: Does `extensionAlias` in `@acme/next-config` affect brikette?
  - A: No — the shared config's `extensionAlias` is set inside the `webpack()` callback which only runs under webpack. Brikette's own `next.config.mjs` does not override `extensionAlias`.
  - Evidence: `packages/next-config/next.config.mjs:40-42`; `apps/brikette/next.config.mjs` (no `extensionAlias` present).

- Q: Are any live guide entries using `jsonLd` block modules (vs only declarative `structuredData`)?
  - A: No — zero block declarations of type `jsonLd` exist. All `jsonLd` occurrences in the manifest are checklist status items (`{ id: "jsonLd", status: "..." }`), not block types. The `moduleResolver.ts` + `jsonLdBlock.tsx` execution path is present and would silently no-op under Turbopack, but is not exercised by any current guide page. This makes it a **latent regression risk** (future guides could use the block type) rather than an immediate migration blocker.
  - Evidence: `grep '"type": "jsonLd"' apps/brikette/src/routes/guides/guide-manifest.ts` — no output; same grep on `guide-manifest-snapshot.json` — no output.

- Q: Should the `?raw` imports be converted to `.ts` re-exports, or configured via Turbopack `loaders` rules?
  - A: **`.ts` re-exports** — removes bundler-specific behavior entirely, keeps code portable across webpack/Turbopack, and avoids Turbopack loader config overhead for only 2 import sites. Migration cost is tiny (2 files). Replace `*.jsonld?raw` imports in `ApartmentStructuredData.tsx` and `TravelHelpStructuredData.tsx` with TS-exported schema payloads; remove `*?raw` typing declarations once unused; drop the webpack `resourceQuery: /raw/` rule.
  - Evidence: Next.js Turbopack config docs (rules/conditions/loader limitations); 2 active `?raw` import sites confirmed.

---

## Confidence Inputs

- Implementation: 82%
  - Evidence: All 3 blockers fully identified with exact file/line references. Fix paths are concrete. Turbopack `resolveAlias` config syntax is documented in Next.js 16. `?raw` approach decided (`.ts` re-exports).
  - Raises to ≥90: Successfully run `next dev` without `--webpack` and confirm no regressions in a local spike branch; verify `node:` prefix handling works under Turbopack without the plugin.

- Approach: 72%
  - Evidence: Staged approach (blockers first, flag removal last) is sound. Shared config isolation approach (guard webpack-only blocks with `context.webpack` check) is a known Next.js pattern.
  - Raises to ≥80: Confirm shared config guard syntax won't break template-app or business-os builds.
  - Raises to ≥90: Spike confirms Turbopack dev server runs clean with correct locale and structured data output.

- Impact: 85%
  - Evidence: `--webpack` flag on Next.js 16 is a well-documented performance regression. Turbopack delivers 10–100× faster cold starts per Next.js benchmarks. Dev workflow is materially affected daily.
  - Raises to ≥90: Measure actual before/after cold-start and HMR times post-migration.

- Delivery-Readiness: 70%
  - Evidence: All blockers have identified fix paths. Scope is bounded (dev only, 2-3 files changed, 1 shared config guard).
  - Raises to ≥80: Confirm `?raw` decision and verify shared config guard approach.
  - Raises to ≥90: All tasks sequenced with no unresolved unknowns.

- Testability: 80%
  - Evidence: Build pass/fail is a hard gate. Dev server start is directly observable. Structured data can be verified with Playwright screenshot or `curl | grep json-ld`. webpackContext fallback behaviour is already covered by Jest mocks (returns `{}`).
  - Raises to ≥90: Add a smoke test asserting JSON-LD is present in apartment page `<head>`.

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `?raw` Turbopack loader not production-ready | Medium | High | Convert to `.ts` re-exports instead — no external dependency, simpler, permanent fix |
| `NormalModuleReplacementPlugin` removal breaks `node:` imports at dev time | Low | Medium | Turbopack handles `node:` natively in Next.js 16; verify with a quick dev-start smoke test |
| Shared `@acme/next-config` guard breaks template-app or business-os | Low | High | Scope guard to webpack-only block using `if (context.webpack)` (truthy check — `webpack` is the compiler object, not a boolean; `=== true` would always be false and skip the block entirely); test all three apps in CI |
| webpackContext fallback returns empty data for guides/breakfast menu | Medium | Medium | Smoke-test `/en/guides/` and `/en/breakfast/` pages after switching; existing Jest mocks already return `{}` confirming fallback path exists |
| Production build (`next build --webpack`) unaffected | N/A | None | Out of scope; production `--webpack` flag is **intentionally kept**; do not touch build script |
| Dev server reverts to `--webpack` after merge | Low | Low | Trivial rollback; document removal clearly in PR; confirm dev script in CI smoke test |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Shared config changes must be guarded to only apply under webpack using `if (context.webpack)` (truthy — `webpack` is the compiler module object, not a boolean; do NOT use `=== true`); do not break other apps
  - `?raw` fix approach must be confirmed before coding begins (re-export vs loader)
  - Production `next build --webpack` is unchanged — do not touch build script
- Rollout/rollback expectations:
  - Rollback is trivial: add `--webpack` flag back to dev script
  - No data migration, no schema change, no API change
- Observability expectations:
  - Before/after cold-start time should be noted in the PR description
  - CI green on all three apps (brikette, template-app, business-os) is the acceptance gate

---

## Suggested Task Seeds (Non-binding)

1. **Convert `?raw` imports to `.ts` re-exports** — `ApartmentStructuredData.tsx` and `TravelHelpStructuredData.tsx`; remove webpack `resourceQuery` rule and update `raw-imports.d.ts` accordingly
2. **Guard webpack-only block in `@acme/next-config`** — wrap `NormalModuleReplacementPlugin` and `extensionAlias` in `if (context.webpack)` check; verify template-app and business-os still build
3. **Add `turbopack.resolveAlias` config to `apps/brikette/next.config.mjs`** — port the `@/` alias, needed package aliases, and the client-side Node module disables (`fs: false`, `module: false`, `path: false`, `url: false` — currently in `apps/brikette/next.config.mjs:139-145`) to the top-level `turbopack` key; Turbopack uses `resolveAlias: { fs: false, ... }` for the same effect
4. **Remove `--webpack` from dev script and smoke-test** — start dev server, load `/en/apartment/`, `/en/guides/`, `/en/breakfast/`, verify locale content and JSON-LD structured data are present
5. **Measure and record cold-start + HMR times** — document before/after in PR description

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `next dev` starts without `--webpack`
  - `/en/apartment/` renders with correct JSON-LD in `<head>`
  - `/en/guides/` renders guide content (locale fallback works)
  - CI green on brikette, template-app, business-os
- Post-delivery measurement plan:
  - Note cold-start time before and after in PR description
  - Monitor for any structured data regressions in Search Console (apartment page)

---

## Evidence Gap Review

### Gaps Addressed

- All 3 hard blockers identified with exact file + line references and concrete fix paths
- All `?raw` import sites enumerated (2 active sites — complete list)
- All `webpackContext` call sites enumerated (7 calls across 4 source files — `locale-loader.ts:53`, `guides.state.ts:40,48,56`, `strings.ts:19,25`, `moduleResolver.ts:19`; `guides.imports.ts` is the fallback target, not a call site)
- Shared config inheritance chain traced (`brikette` → `@acme/next-config` → `baseConfig`)
- Fallback path existence confirmed for all webpackContext usage
- `ssr-polyfills.cjs` confirmed Turbopack-safe
- Next.js version confirmed (16.1.6) — Turbopack stable in this version

### Confidence Adjustments

- webpackContext demoted from "hard blocker" to "medium" after confirming all 7 calls across 4 files have working fallbacks; `guides.imports.ts` is the static fallback target (not a call site); `moduleResolver.ts:19` produces empty `JSON_LD_MODULES` — silent no-op, latent risk only since no live guide uses `jsonLd` block type today
- `extensionAlias` demoted from "hard blocker" to "low/non-issue" after confirming it lives inside the `webpack()` callback (webpack-only) and brikette does not use it directly
- Implementation confidence raised to 82% after resolving `?raw` approach (`.ts` re-exports); remaining cap to ≥90 pending a successful local Turbopack spike

### Remaining Assumptions

- Turbopack in Next.js 16 handles `node:` prefix imports natively (no `NormalModuleReplacementPlugin` needed) — not verified by local test, based on Next.js documentation
- `guides.imports.ts` (the static fallback target for `guides.state.ts` under Turbopack) produces functionally equivalent guide data to the webpackContext path — confirmed by code structure but not by a running Turbopack test
- Turbopack `resolveAlias` for `@/` works identically to webpack `resolve.alias["@"]` — documented in Next.js 16 but not verified locally
- Turbopack `resolveAlias: { fs: false, ... }` correctly disables client-side Node modules the same way webpack `resolve.fallback: { fs: false, ... }` does — documented pattern but not locally verified
- `moduleResolver.ts`'s `JSON_LD_MODULES` under Turbopack will be `{}` (no runtime error, only silent no-op for any `jsonLd`-type blocks) — confirmed by code path analysis; no live guides currently trigger this path

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none — all open questions resolved; `?raw` approach decided (`.ts` re-exports)
- Recommended next step: `/lp-do-plan turbopack-migration` — 4–5 sequenced tasks, dev-only scope, trivially rollback-able
