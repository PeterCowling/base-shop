---
Type: Micro-Build
Status: Archived
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: caryina-stockbadge-centralise
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313163000-0003
Related-Plan: none
---

# Caryina StockBadge Centralise Micro-Build

## Scope
- Change: Move StockBadge from `apps/caryina/src/components/catalog/StockBadge.tsx` to `packages/ui/src/components/molecules/StockBadge.tsx`. Leave a re-export shim at the original location. Move test to packages/ui. Update all caryina imports to use the shared path.
- Non-goals: Changing the component's visual appearance or props API; updating any other app.

## Execution Contract
- Affects:
  - `packages/ui/src/components/molecules/StockBadge.tsx` (new)
  - `packages/ui/src/components/molecules/index.ts` (barrel export added)
  - `packages/ui/src/components/molecules/__tests__/StockBadge.test.tsx` (moved from caryina)
  - `apps/caryina/src/components/catalog/StockBadge.tsx` (now a re-export shim)
  - `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` (import updated)
  - `apps/caryina/src/components/catalog/ProductMediaCard.tsx` (import updated)
  - `apps/caryina/src/app/[lang]/product/[slug]/page.test.tsx` (mock path updated)
  - `apps/caryina/src/components/catalog/StockBadge.test.tsx` (deleted)
- Acceptance checks:
  1. StockBadge source lives in packages/ui/src/components/molecules/
  2. Caryina local copy is a shim re-export only
  3. Both `pnpm --filter @apps/caryina typecheck` and `pnpm --filter @acme/ui typecheck` pass clean
- Rollback note: Revert packages/ui changes and restore caryina original file.

## Outcome Contract
- **Why:** The in-stock/out-of-stock badge had no shop-specific dependencies and was rebuilt from scratch in every product-selling app. Moving it to the shared library means all apps benefit from improvements in one place.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** StockBadge moved to @acme/ui/molecules, re-exported from caryina, local copy removed, and existing behaviour confirmed with a component test.
- **Source:** operator
