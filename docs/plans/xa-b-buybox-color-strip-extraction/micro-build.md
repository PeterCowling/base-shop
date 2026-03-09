---
Type: Micro-Build
Status: Active
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: xa-b-buybox-color-strip-extraction
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260309090000-XAB-COLORSTRIP-001
Related-Plan: none
---

# XaBuyBox Color Strip Extraction Micro-Build

## Scope
- Change: Extract a shared `XaColorSwatchStrip` component (new file `apps/xa-b/src/components/XaColorSwatchStrip.tsx`) that renders a strip of swatch tiles — either `<Link>` (with href) or `<div>` (without). Replace the two near-identical inline blocks in XaBuyBox.client.tsx.
- Non-goals: No visual changes. No new props on XaBuyBox. No changes to xaCatalog.ts or xaRoutes.ts.

## Execution Contract
- Affects:
  - apps/xa-b/src/components/XaColorSwatchStrip.tsx [new]
  - apps/xa-b/src/components/XaBuyBox.client.tsx
- Acceptance checks:
  - Both variant strip and color strip in XaBuyBox use XaColorSwatchStrip
  - Each swatch tile renders identically to before (Link vs div, isCurrent border, image/swatch fallback)
  - No new imports in XaBuyBox except XaColorSwatchStrip
- Validation commands: pnpm --filter xa-b typecheck && pnpm --filter xa-b lint
- Rollback note: Delete XaColorSwatchStrip.tsx; restore XaBuyBox.client.tsx inline blocks.

## Outcome Contract
- **Why:** Duplicate inline blocks mean any visual change to the swatch strip must be made in two places.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** XaBuyBox uses a single XaColorSwatchStrip component for both variant and color displays; no behaviour changes; typecheck and lint pass.
- **Source:** operator
