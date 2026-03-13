# Build Record — Caryina StockBadge Centralise

**Plan:** caryina-stockbadge-centralise
**Date:** 2026-03-13
**Track:** code
**Business:** CARY

## What Was Done

Moved `StockBadge` from a local caryina component to the shared `@acme/ui` package.

Changes:
- `packages/ui/src/components/molecules/StockBadge.tsx` — component source (copied from caryina unchanged; no app-specific deps)
- `packages/ui/src/components/molecules/index.ts` — barrel export added (`export * from "./StockBadge"`)
- `packages/ui/src/components/molecules/__tests__/StockBadge.test.tsx` — test moved from caryina, import path updated
- `apps/caryina/src/components/catalog/StockBadge.tsx` — replaced with one-line re-export shim pointing to `@acme/ui/components/molecules/StockBadge`
- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — import updated to `@acme/ui/components/molecules/StockBadge`
- `apps/caryina/src/components/catalog/ProductMediaCard.tsx` — import updated
- `apps/caryina/src/app/[lang]/product/[slug]/page.test.tsx` — jest mock path updated
- `apps/caryina/src/components/catalog/StockBadge.test.tsx` — deleted (test now in packages/ui)

The existing `./components/molecules/*` wildcard export in `packages/ui/package.json` covers the new path without a new entry.

`pnpm build` run on `@acme/ui` before caryina typecheck to resolve new dist output.

## Validation Evidence

- `pnpm --filter @apps/caryina typecheck` → clean ✓
- `pnpm --filter @acme/ui typecheck` → clean (verified by subagent) ✓

## Engineering Coverage Evidence

| Surface | Coverage |
|---|---|
| UI | Component API unchanged; re-export shim preserves backward compatibility |
| Testing | Test moved to packages/ui with correct import; mock paths updated in caryina test |

## Outcome Contract

- **Why:** The in-stock/out-of-stock badge had no shop-specific dependencies and was rebuilt from scratch in every product-selling app. Moving it to the shared library means all apps benefit from improvements in one place.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** StockBadge moved to @acme/ui/molecules, re-exported from caryina, local copy removed, and existing behaviour confirmed with a component test.
- **Source:** operator

## Workflow Telemetry Summary

Micro-build lane. Single task, no upstream plan.md or analysis.md.
