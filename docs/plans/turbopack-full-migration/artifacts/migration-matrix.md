---
Type: Plan-Artifact
Status: Draft
Domain: Infra
Feature-Slug: turbopack-full-migration
Task-ID: TASK-02
Created: 2026-02-23
Last-updated: 2026-02-23
Relates-to: docs/plans/turbopack-full-migration/plan.md
---

# Turbopack Migration Matrix (TASK-02)

## Scope Snapshot
- Webpack-pinned package scripts: `28` command surfaces across `14` in-scope app/package units.
- App/package units in scope: `business-os`, `caryina`, `cms`, `cochlearfit`, `cover-me-pretty`, `handbag-configurator`, `prime`, `product-pipeline`, `skylar`, `xa`, `xa-b`, `xa-j`, `xa-uploader`, `template-app`.
- Explicit webpack callback files (for TASK-07): `9` total (`packages/next-config/next.config.mjs` + 8 app/package config files).
- Global guardrail coupling: `scripts/check-next-webpack-flag.mjs` enforced by pre-commit + merge-gate.

## Evidence Commands (2026-02-23)
- `rg --glob 'apps/*/package.json' --glob 'packages/template-app/package.json' '"(dev|build|preview|dev:debug)"\s*:\s*"[^"]*--webpack[^"]*"' apps packages`
- `rg 'webpack\s*\(' apps/*/next.config.mjs packages/next-config/next.config.mjs packages/template-app/next.config.mjs`
- `rg '@apps/...|@acme/template-app' .github/workflows/*.yml`
- `node scripts/check-next-webpack-flag.mjs --all` (policy baseline command)

## App Script Surface Matrix

| Unit | Package | Webpack-pinned scripts | Callback status | Direct workflow coupling | Planned script wave |
|---|---|---|---|---|---|
| business-os | `@apps/business-os` | `dev`, `build` | Shared + app callback (client fallback for `fs`, `child_process`, `path`) | `business-os-deploy.yml` | Wave S3 (high risk) |
| caryina | `@apps/caryina` | `dev`, `build` | Shared callback inherited (no app callback) | None | Wave S1 (low risk) |
| cms | `@apps/cms` | `dev`, `build`, `dev:debug` | High-complexity app callback (`~174` lines) + preset callback | `cms.yml`, `cypress.yml` | Wave S3 (high risk) |
| cochlearfit | `@apps/cochlearfit` | `dev`, `build`, `preview`, `preview:pages` | Shared + app callback (cache toggle, `@` alias) | None | Wave S2 (medium risk) |
| cover-me-pretty | `@apps/cover-me-pretty` | `dev`, `build` | Shared callback inherited (no app callback) | `ci-lighthouse.yml`, `ci.yml` | Wave S2 (medium risk) |
| handbag-configurator | `@apps/handbag-configurator` | `dev`, `build` | Shared + app callback (cache toggle) | None | Wave S2 (medium risk) |
| prime | `@apps/prime` | `dev`, `build` | No webpack callback (uses `baseConfig`) | `prime.yml` (+ `reusable-app.yml`) | Wave S1 (low risk) |
| product-pipeline | `@apps/product-pipeline` | `dev`, `build` | Shared + app callback (snapshot path clearing + alias) | `product-pipeline.yml` | Wave S2 (medium risk) |
| skylar | `@apps/skylar` | `dev`, `build` | Shared + app callback (`@` alias) | `skylar.yml`, `ci-lighthouse.yml` (+ `reusable-app.yml`) | Wave S2 (medium risk) |
| xa | `@apps/xa-c` | `dev` | Shared callback inherited (no app callback) | `xa.yml` | Wave S1 (low risk) |
| xa-b | `@apps/xa-b` | `dev` | Shared callback inherited (no app callback) | None | Wave S1 (low risk) |
| xa-j | `@apps/xa-j` | `dev` | Shared callback inherited (no app callback) | None | Wave S1 (low risk) |
| xa-uploader | `@apps/xa-uploader` | `dev`, `build` | Shared + app callback (cache toggle) | None | Wave S2 (medium risk) |
| template-app | `@acme/template-app` | `dev`, `build` | Shared + app callback (`@acme/i18n` alias, cache toggle) | `ci.yml` | Wave S2 (medium risk) |

Notes:
- All rows are additionally coupled to global policy checks via `scripts/check-next-webpack-flag.mjs` (merge-gate + local validation).
- S3 is intentionally delayed until callback-parity evidence from TASK-07 is complete.
- `ci.yml` is path-ignored for `apps/cms/**` and is not an active CMS build-status consumer in the current split-pipeline model.

## Callback Responsibility Map (TASK-07 Input)

| Callback file | Responsibilities observed | In-scope consumers | Risk tier | Planned callback wave |
|---|---|---|---|---|
| `packages/next-config/next.config.mjs` | Shared resolve extensions, `extensionAlias`, workspace aliases, node built-in alias mapping, `drizzle-orm` disable, Turbopack `resolveAlias` seed | `business-os`, `caryina`, `cochlearfit`, `cover-me-pretty`, `handbag-configurator`, `product-pipeline`, `skylar`, `xa`, `xa-b`, `xa-j`, `xa-uploader`, `template-app` | High (shared blast radius) | C0 (first in TASK-07) |
| `apps/business-os/next.config.mjs` | `@` alias + client `resolve.fallback` hard-disable (`fs`, `child_process`, `path`) | `business-os` | High | C2 |
| `apps/cms/next.config.mjs` | Safe hash guard, dev filesystem cache, extensive aliasing, optional dep aliases, Sentry exclusions, pino runtime dependency handling, warning suppression | `cms` | High | C2 |
| `apps/cochlearfit/next.config.mjs` | Shared callback wrapper, cache toggle, `@` alias | `cochlearfit` | Medium | C1 |
| `apps/handbag-configurator/next.config.mjs` | Shared callback wrapper, cache toggle | `handbag-configurator` | Low | C1 |
| `apps/product-pipeline/next.config.mjs` | Shared callback wrapper, snapshot path overrides, alias overrides | `product-pipeline` | Medium | C1 |
| `apps/skylar/next.config.mjs` | Shared callback wrapper, `@` alias | `skylar` | Low | C1 |
| `apps/xa-uploader/next.config.mjs` | Shared callback wrapper, cache toggle | `xa-uploader` | Low | C1 |
| `packages/template-app/next.config.mjs` | Shared callback wrapper, `@acme/i18n` alias, cache toggle | `template-app` | Medium | C1 |

Prime-specific note:
- `apps/prime/next.config.mjs` consumes `baseConfig` from `packages/next-config/index.mjs` and does not currently declare a webpack callback. Prime remains script-policy coupled but is not in the callback retirement map.

## TASK-07 Callback Parity Outcomes (2026-02-23)

| Callback file | Turbopack parity outcome | Webpack exception retained | Notes |
|---|---|---|---|
| `packages/next-config/next.config.mjs` | Shared `turbopack.resolveAlias` now includes `@`, `@themes-local`, and workspace package aliases used by app configs. | Yes | `webpack()` keeps extension aliasing and `node:*` alias mapping until webpack script surfaces are removed. |
| `apps/business-os/next.config.mjs` | Added `turbopack.resolveAlias` parity for `@` app-source alias. | Yes | Client `resolve.fallback` (`fs`, `child_process`, `path`) remains webpack-path behavior. |
| `apps/cms/next.config.mjs` | Added `turbopack.resolveAlias` parity for `@`, theme subpaths, `@acme/configurator`, and `entities/*` aliases. | Yes | Hash guard, dev filesystem cache, warning suppression, runtime dep aliasing, and node/react dedupe behavior remain webpack-path exceptions. |
| `apps/cochlearfit/next.config.mjs` | Added `turbopack.resolveAlias` parity for `@` app-source alias. | Yes | Cache toggle remains webpack-path behavior. |
| `apps/handbag-configurator/next.config.mjs` | Uses inherited shared Turbopack aliases (no app-local alias deltas needed). | Yes | Cache toggle remains webpack-path behavior. |
| `apps/product-pipeline/next.config.mjs` | Added `turbopack.resolveAlias` parity for `@` and `@acme/ui`. | Yes | Snapshot/cache overrides remain webpack-path behavior. |
| `apps/skylar/next.config.mjs` | Added `turbopack.resolveAlias` parity for `@` app-source alias. | Yes | Webpack callback retained only for migration-phase compatibility. |
| `apps/xa-uploader/next.config.mjs` | Uses inherited shared Turbopack aliases (no app-local alias deltas needed). | Yes | Cache toggle remains webpack-path behavior. |
| `packages/template-app/next.config.mjs` | Added `turbopack.resolveAlias` parity for `@acme/i18n`. | Yes | Webpack cache toggle and alias shim retained until script migration completes. |

## TASK-07 Validation Snapshot (2026-02-23)

- `pnpm --filter @apps/business-os build` -> pass (`next build --webpack`).
- `pnpm --filter @apps/skylar build` -> pass (`next build --webpack`).
- `pnpm --filter @apps/cms build` -> fail with Node heap OOM (`SIGABRT`) on three runs:
  - default command,
  - `NODE_OPTIONS=--max-old-space-size=8192`,
  - `NEXT_BUILD_CPUS=1 NODE_OPTIONS=--max-old-space-size=8192`.
- Result: TASK-07 callback parity work is implemented, but CMS representative-build validation remains blocked by pre-existing webpack memory pressure in current environment.

### Checkpoint Addendum (2026-02-23)

Dedicated mitigation lane evidence from `docs/plans/_archive/cms-webpack-build-oom/` confirms the blocker remains active after one bounded graph-reduction slice:
- Post-mitigation probe matrix (`docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-04-r1/`):
  - `pnpm --filter @apps/cms build` -> `exit 134` in `441s` (`SIGABRT` OOM)
  - `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @apps/cms build` -> `exit 134` in `558s` (`SIGABRT` OOM)
  - `NEXT_BUILD_CPUS=1 NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @apps/cms build` -> `exit 134` in `431s` (`SIGABRT` OOM)
- Contract implication:
  - Option A hard-blocker policy remains in force; TASK-08 script-surface migration remains blocked by TASK-07 until CMS representative build validation can pass under the agreed gate contract.

## Script Wave Validation Commands

### Wave S1 (low risk: `caryina`, `prime`, `xa`, `xa-b`, `xa-j`)
1. `pnpm exec jest --runInBand --config ./jest.config.cjs scripts/__tests__/next-webpack-flag-policy.test.ts`
2. `node scripts/check-next-webpack-flag.mjs --all`
3. `pnpm --filter @apps/caryina build`
4. `pnpm --filter @apps/prime build`
5. `pnpm --filter @apps/xa-c build`
6. `pnpm --filter @apps/xa-b build`
7. `pnpm --filter @apps/xa-j build`

### Wave S2 (medium risk: `cochlearfit`, `cover-me-pretty`, `handbag-configurator`, `product-pipeline`, `skylar`, `xa-uploader`, `template-app`)
1. `pnpm exec jest --runInBand --config ./jest.config.cjs scripts/__tests__/next-webpack-flag-policy.test.ts`
2. `node scripts/check-next-webpack-flag.mjs --all`
3. `pnpm --filter @apps/cochlearfit build`
4. `pnpm --filter @apps/cover-me-pretty build`
5. `pnpm --filter @apps/handbag-configurator build`
6. `pnpm --filter @apps/product-pipeline build`
7. `pnpm --filter @apps/skylar build`
8. `pnpm --filter @apps/xa-uploader build`
9. `pnpm --filter @acme/template-app build`

### Wave S3 (high risk: `business-os`, `cms`)
Precondition: callback parity outcomes for C0/C2 documented in TASK-07 logs.
1. `pnpm exec jest --runInBand --config ./jest.config.cjs scripts/__tests__/next-webpack-flag-policy.test.ts`
2. `node scripts/check-next-webpack-flag.mjs --all`
3. `pnpm --filter @apps/business-os build`
4. `pnpm --filter @apps/cms build`

## Task-03 Input (Policy Strategy)
- Matrix indicates broad mixed coupling (script policy + shared callback reuse) rather than isolated app-local usage.
- Recommended decision input remains Option A (controlled matrix expansion first), then default inversion in cleanup, to reduce simultaneous policy + callback + workflow churn.
