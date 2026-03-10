# xa-b Hermès Nav Taxonomy — Build Record

**Date:** 2026-03-08
**Plan slug:** xa-b-hermes-nav-taxonomy
**Dispatch:** IDEA-DISPATCH-20260308-XAB-NAV-001

## What was done

Replaced generic fashion-retail navigation labels in the xa-b storefront with Hermès bags-only taxonomy. The underlying route slugs (`women`, `men`, `kids`) are preserved as URL identifiers — only what the user sees in the UI changed.

**Files changed:**
- `apps/xa-b/src/lib/xaCatalog.ts` — added `XA_DEPARTMENT_LABELS` mapping `women→Iconic`, `men→Everyday`, `kids→Mini`; replaced `XA_SUBCATEGORIES.bags` with 12 Hermès bag family handles (birkin, kelly, constance, lindy, evelyne, picotin, garden-party, herbag, mini-kelly, roulis, verrou, egee)
- `apps/xa-b/src/components/XaShell.tsx` — primary nav now uses `XA_DEPARTMENT_LABELS` for display; removed "Brands" link from secondary nav
- `apps/xa-b/src/components/XaMegaMenu.tsx` — removed Brands column and related imports (`getTrendingDesigners`, `getDesignerHref`, `xaI18n`); updated grid from `md:grid-cols-5` to `md:grid-cols-4`

## Validation

`pnpm --filter xa-b typecheck` — passed, zero errors.

## Outcome Contract
- **Why:** xa-b is positioned as a Hermès bags-only boutique; generic multi-brand fashion taxonomy misrepresents the product world.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** xa-b header nav displays Hermès-specific tier labels (Iconic/Everyday/Mini) and bag family subcategories; Brands link/column removed throughout.
- **Source:** operator
