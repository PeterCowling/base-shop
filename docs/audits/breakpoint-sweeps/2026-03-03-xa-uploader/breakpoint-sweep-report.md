# Breakpoint Sweep Report — XA Uploader

**Date**: 2026-03-03
**App**: `apps/xa-uploader` (`http://localhost:3020`)
**Breakpoints**: 320, 375, 390, 414, 480, 600, 768, 820, 1024, 1280, 1440
**Viewport height**: 900 (default)
**Routes tested**: Login, Add (new product), Edit (product list + form + submission)
**Method**: Live 1280px verification via headless browser + code-level responsive audit of all layout classes across all breakpoints

## Assumptions

- Theme: dark (default)
- Locale: EN (default)
- Auth: console token from `.env.local`
- Category: bags (default — Hermès collections visible)

## Issues

### Issue 1 — Identity bar text overflow (S2 Major)

| Field | Value |
|-------|-------|
| Breakpoints | 320, 375, 390, 414, 480 |
| Route | Add, Edit (all authenticated screens) |
| Component | `CatalogConsole.client.tsx:208` |
| Severity | S2 Major |

**Layout**: `flex items-center gap-3` (no `flex-wrap`)

**Content at 320px** (usable width ≈ 288px after `px-4`):
- "XA-B (Bags)" (~90px) + "—" (~15px) + "Bags" (~35px) + gaps (36px) + "Additional categories available on request" (~250px)
- **Total needed**: ~426px → exceeds 288px by ~138px

**Expected**: Content wraps or truncates gracefully.
**Actual**: Flex row overflows. `overflow-hidden` on `<main>` clips the excess — the expansion hint is partially or fully invisible.

**Fix hypothesis**: Add `flex-wrap` to the identity bar, or hide the expansion hint at narrow widths with `hidden sm:inline` on the hint span.

---

### Issue 2 — Step indicator row overflow (S2 Major)

| Field | Value |
|-------|-------|
| Breakpoints | 320, 375 |
| Route | Add, Edit (product form) |
| Component | `CatalogProductForm.client.tsx` step indicator `<div>` |
| Severity | S2 Major |

**Layout**: `flex items-center gap-6` (no `flex-wrap`)

**Content at 320px** (usable width ≈ 224px after section `p-6` + container `px-6`):
- Step "1 PRODUCT" button (~100px) + Step "2 IMAGES" button (~90px) + StatusDot "Incomplete" (~80px) + gaps (48px)
- Divider hidden at mobile (`hidden sm:block`) ✓
- **Total needed**: ~318px → exceeds 224px by ~94px

**Expected**: Step indicators and status remain visible and accessible.
**Actual**: Row overflows, clipped by ancestor `overflow-hidden`.

**Fix hypothesis**: Add `flex-wrap` to the step indicator row. Alternatively, move `StatusDot` to its own row below the step indicators at narrow widths.

---

### Issue 3 — Category fields width mismatch (S3 Minor)

| Field | Value |
|-------|-------|
| Breakpoints | 768, 820, 1024, 1280, 1440 |
| Route | Add (product form, bags category visible by default) |
| Components | `CatalogProductBagFields.client.tsx:21`, `CatalogProductClothingFields.client.tsx:165`, `CatalogProductJewelryFields.client.tsx:23`, `CatalogProductImagesFields.client.tsx:30` |
| Severity | S3 Minor |

**Expected**: All form fields share a consistent max width.
**Actual**: Base fields (`CatalogProductBaseFields`) use `mx-auto max-w-prose` (~650px centered). Category-specific fields (Bag, Clothing, Jewelry) and Images fields use `grid gap-4 md:grid-cols-2` at full parent width. At 1280px, base fields are ~650px centered while bag fields span ~1100px — a visible width jump.

**Fix hypothesis**: Wrap category-specific field sections in a matching `mx-auto max-w-prose` container, or apply the constraint in the parent `CatalogProductForm`.

---

### Issue 4 — Dead `md:col-span-2` classes (S3 Minor)

| Field | Value |
|-------|-------|
| Breakpoints | All |
| Route | Add (product form) |
| Component | `CatalogProductBaseFields.client.tsx:618,626,634` |
| Severity | S3 Minor |

**Context**: Section headers (`Identity`, `Description`, `Commercial`) have `md:col-span-2` but the parent grid is now a single-column `max-w-prose` grid. The class is a no-op.

**Fix hypothesis**: Remove `md:col-span-2` from section header divs.

## No Issues Found

| Breakpoint range | Component | Notes |
|-----------------|-----------|-------|
| All | Login form | `flex gap-2` for token input + show/hide button scales correctly |
| All | Screen tabs (Add/Edit) | Two small buttons, sufficient room at all widths |
| All | Product form action bar | `flex-wrap` handles wrapping correctly |
| All | Submission panel | `flex-wrap` on action rows handles all widths |
| All | Products list sidebar | Stacks below `lg` breakpoint correctly |
| All | RegistryCheckboxGrid | `grid-cols-2` base with `md:grid-cols-3 lg:grid-cols-4` scales well |
| All | Edit screen grid | `lg:grid-cols-[280px_1fr]` stacks below `lg` ✓ |

## Summary

| Severity | Count |
|----------|-------|
| S1 Blocker | 0 |
| S2 Major | 2 |
| S3 Minor | 2 |
| **Total** | **4** |

Issues #1 and #2 are the priority: both cause content clipping at mobile widths (320–480px). Issues #3 and #4 are cosmetic cleanup.
