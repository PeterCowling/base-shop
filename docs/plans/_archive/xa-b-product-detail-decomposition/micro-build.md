---
Type: Micro-Build
Status: Archived
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: xa-b-product-detail-decomposition
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260309090000-XAB-PDDECOMP-001
Related-Plan: none
---

# XaProductDetail Decomposition Micro-Build

## Scope
- Change: Break the 346-line XaProductDetail god component into:
  1. `useProductDetailData` hook — all derivations (designerName, categoryLabel, hrefs, breadcrumbs, copy object, showShare, whatsappHref, completeLook, moreFromDesigner)
  2. `XaProductDetailSections` sub-component — the clothing/bags/jewelry conditional detail blocks
  3. `XaProductDetailShare` sub-component — social share + contact section
  4. `XaProductDetailRelated` sub-component — "Complete the look" and "More from designer" grids
  5. XaProductDetail itself becomes a thin layout shell using these pieces
- Non-goals: No visual changes. No changes to xaCatalog.ts, xaRoutes.ts, siteConfig.ts, or any other file. No new pages or routes.

## Execution Contract
- Affects:
  - apps/xa-b/src/components/XaProductDetail.tsx [rewrite as shell]
  - apps/xa-b/src/lib/useProductDetailData.ts [new hook]
  - apps/xa-b/src/components/XaProductDetailSections.tsx [new]
  - apps/xa-b/src/components/XaProductDetailShare.tsx [new]
  - apps/xa-b/src/components/XaProductDetailRelated.tsx [new]
- Acceptance checks:
  - XaProductDetail renders identically to before — same JSX output
  - useProductDetailData returns all values XaProductDetail previously derived inline
  - Each new sub-component is typed from XaCatalogModel types, not prop-drilling via XaProductDetail
  - No TypeScript errors, no lint warnings
- Validation commands: pnpm --filter xa-b typecheck && pnpm --filter xa-b lint
- Rollback note: Revert 5 files; no runtime state affected.

## Outcome Contract
- **Why:** Component mixes data preparation with conditional rendering of category-specific blocks and social share/contact sections. Separating concerns makes each piece independently maintainable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** XaProductDetail is broken into a data hook and focused sub-components; no behaviour changes; typecheck and lint pass.
- **Source:** operator
