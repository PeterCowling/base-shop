---
Type: Micro-Build
Status: Complete
Created: 2026-03-14
Last-updated: 2026-03-14
Build-Evidence: TypeScript typecheck passes cleanly (`pnpm --filter "@apps/caryina" run typecheck`). Spec section renders on all three charm family PDPs with clearly marked PLACEHOLDER values.
Feature-Slug: caryina-product-spec-content
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314180000-HBAG-001
Business: HBAG
Related-Plan: none
---

# Caryina Product Spec Section Micro-Build

## Scope
- Change: Add a "Details" spec section to all Caryina product detail pages showing physical dimensions (H×W×D), body material, hardware metal type, and attachment method per charm family (Top Handle, Shoulder, Mini). Values are PLACEHOLDER pending operator input.
- Non-goals: Populating actual physical values (operator must supply); per-SKU variation (spec is family-level); i18n translations (English only at this stage).

## Execution Contract
- Affects:
  - `apps/caryina/src/lib/launchMerchandising.ts` — add `FAMILY_SPEC` constant and `getFamilySpec()` export
  - `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — import `getFamilySpec` and `classifySkuFamily`, render spec section below proof bullets
- Acceptance checks:
  - PDP renders a "Details" section for all three charm families with four labelled rows: Dimensions, Material, Hardware, Attachment
  - PLACEHOLDER values are visible in the UI (operator knows what to fill)
  - TypeScript passes cleanly (`pnpm --filter caryina typecheck`)
  - No new components; spec section is inlined in the PDP
- Validation commands:
  - `pnpm --filter caryina typecheck`
- Rollback note: Revert edits to `launchMerchandising.ts` and `page.tsx`; no database or JSON changes needed

## Outcome Contract
- **Why:** A customer deciding whether to buy a bag charm needs to know how big it is, what it's made from, and how it clips onto their bag. None of this appears anywhere on product pages right now. A shopper who can't answer "will this look right on my bag?" will not buy.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Product pages for all three charm families show physical dimensions (H×W×D in cm), body material, hardware metal type, and attachment method in a clearly labelled spec section visible without scrolling.
- **Source:** auto
