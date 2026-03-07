---
Type: fact-find
Outcome: planning
Status: Ready-for-planning
Domain: PRODUCTS
Workstream: XA
Business: XA
Slug: xa-b-design-polish
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: frontend-ui-enhancement
Primary-Execution-Skill: lp-do-build
Supporting-Skills: frontend-design, tools-ui-contrast-sweep
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Effort: S
Last-updated: 2026-03-04
Dispatches: IDEA-DISPATCH-20260304120000-0001, 0002, 0003, 0004
---

# Fact Find: xa-b Design Polish

## Scope

### Summary

The xa-b luxury fashion storefront was audited for design gaps across the browse and conversion funnel. Investigation found that 2 of 4 originally reported gaps were already resolved or overstated, reducing scope to 2 actionable items: empty state unification and minor cart styling alignment.

### Goals

1. Unify empty state styling across cart, wishlist, product listing, and designers pages using consistent patterns and the design-system `EmptyState` component.
2. Align cart page meta text styling with the `xa-pdp-meta` class used elsewhere.

### Non-goals

- New In badge implementation (already complete — `isNewIn()` with 30-day window, `ProductBadge` rendering, test coverage).
- Department landing page redesign (already has image cards, hover effects, trending designers section).
- Category card curation or product count badges.
- Dark mode changes (existing tokens cover both modes).

### Constraints & Assumptions

1. **Cloudflare free tier ONLY** — static export, no server-side rendering.
2. All changes within `apps/xa-b/` scope.
3. Must use xa-b achromatic design language (monochrome palette, sharp corners, wide letter-spacing).
4. Static export to Cloudflare Pages — no route handlers.

## Outcome Contract

- **Why:** A design audit identified visual inconsistency in empty states (3 different styling patterns) and minor cart styling drift from the established `xa-pdp-*` class system. These weaken the cohesive brand experience.
- **Intended Outcome Type:** UI polish
- **Intended Outcome Statement:** Empty states use a unified pattern with consistent borders, spacing, typography, and CTAs. Cart meta text uses `xa-pdp-meta` class.
- **Source:** operator (from dispatch trigger)

## Evidence Audit

### Entry Points

| # | Path | Role |
|---|------|------|
| 1 | `apps/xa-b/src/components/XaProductListing.client.tsx:148-160` | Product listing empty state (filter no-match) |
| 2 | `apps/xa-b/src/app/cart/page.tsx:74-85` | Cart empty state |
| 3 | `apps/xa-b/src/app/wishlist/page.tsx:118-130` | Wishlist empty state |
| 4 | `apps/xa-b/src/app/designers/page.tsx:88-93` | Designers search empty state |
| 5 | `apps/xa-b/src/app/cart/page.tsx:126-136` | Cart meta text (styling drift) |

### Key Modules

| # | Path | Role |
|---|------|------|
| 1 | `packages/design-system/src/atoms/EmptyState.tsx` | Design-system empty state component (available but unused) |
| 2 | `packages/design-system/src/atoms/ProductBadge.tsx` | Badge component (already used correctly) |
| 3 | `apps/xa-b/src/app/xa-cyber-atelier.css` | XA achromatic theme tokens |
| 4 | `apps/xa-b/src/components/XaProductCard.tsx` | Product card with working New In badge |
| 5 | `apps/xa-b/src/lib/xaListingUtils.ts:45-58` | `isNewIn()` function (complete, tested) |
| 6 | `apps/xa-b/src/components/XaDepartmentLanding.tsx` | Department landing (functional with image cards) |

### Patterns

**Empty state styling inconsistencies (current):**

| Location | Container | Padding | Border | Radius | CTA |
|----------|-----------|---------|--------|--------|-----|
| Product listing | `col-span-full flex` | `py-16` | none | none | Button (`variant="outline"`, uppercase) |
| Cart | `flex flex-col border` | `px-6 py-12` | `border-border-1` | `rounded-sm` | Underlined link |
| Wishlist | `flex flex-col border` | `px-6 py-12` | `border-border-1` | `rounded-sm` | Underlined link |
| Designers | `border p-6` | `p-6` | default `border` | `rounded-lg` | None |

**Design-system EmptyState component (available):**
- Props: `icon`, `title` (required), `description`, `action`
- Layout: `flex flex-col items-center justify-center text-center py-12 px-4`
- Consistent structure: icon → title → description → action slot

**XA styling conventions for labels/meta:**
- Labels: `xa-pdp-label` = `text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.62rem; font-weight: 600`
- Meta text: `xa-pdp-meta` = `font-size: 0.82rem`
- Cart currently uses raw `text-xs text-muted-foreground` instead of `xa-pdp-meta` for size/price meta.

### Gap 3 Evidence (New In Badge — RESOLVED)

Investigation confirmed the New In badge is fully implemented:
- `isNewIn()` at `xaListingUtils.ts:45-58`: 30-day window from `createdAt`
- `ProductBadge` rendered at `XaProductCard.tsx:93-101`: `color="default"` `tone="soft"` `size="sm"`
- Test coverage at `xaListingUtils.test.ts:64-91`: 6 test cases covering edge conditions
- All catalog products have `createdAt` field populated

### Gap 2 Evidence (Department Landing — ALREADY FUNCTIONAL)

Department landing pages are NOT text-only. Current structure:
- **New In section**: Grid of 4 newest products with `XaProductCard` (lines 56-70)
- **Trending Designers**: Pill-shaped buttons linking to designer pages (lines 72-85)
- **Category Cards**: `xa-panel` cards with 4:3 aspect-ratio images, `XaFadeImage`, hover scale-105 animation, subcategory text (lines 87-125)
- Only limitation: single "bags" category enabled in `siteConfig.ts`

### Test Landscape

18 test files exist in xa-b:
- Unit tests: `xaFilters`, `xaCurrencyPricing`, `xaCatalog`, `demoData`, `inventoryStore`, `xaCart`, `storage`, `xaImages`, `xaListingUtils`, `useXaListingFilters`
- Search tests: `xaSearchService`, `xaSearchDb`, `xaSearchWorker`, `xaSearchWorkerClient`
- Context tests: `XaCartContext`, `XaWishlistContext`
- Page tests: `page.test.tsx`
- Config tests: `nextConfig.security.test.ts`

No existing tests for empty state rendering. The `XaProductListing` empty state is tested indirectly via `useXaListingFilters.test.tsx` but not visually.

### Dependencies

- `@acme/design-system/atoms` — EmptyState, Button, ProductBadge (all available)
- `@acme/design-system/primitives` — Grid, LayoutGrid (already imported)
- No new dependencies required.

## Access Declarations

None — all work is within the local codebase.

## Questions

### Resolved

1. **Does the cart page show product images?** — Yes. 64px thumbnails via `XaFadeImage` with letter fallback. (Evidence: `cart/page.tsx:101-119`)

2. **Are department landing pages text-only?** — No. They have image cards, product grids, and designer pills. (Evidence: `XaDepartmentLanding.tsx:48-125`)

3. **Do product cards display New In badges?** — Yes. Complete implementation with 30-day window logic and test coverage. (Evidence: `XaProductCard.tsx:93-101`, `xaListingUtils.ts:45-58`)

4. **Should we use the design-system EmptyState component?** — Yes. It provides the correct structure (icon/title/description/action) and xa-b can apply achromatic styling via className overrides. Using it unifies the pattern and reduces per-page boilerplate.

5. **What radius should empty states use?** — `rounded-sm` (2px), consistent with xa-b's sharp-edge aesthetic used on cards and containers throughout.

### Open

None — all questions resolved from codebase evidence.

## Confidence Inputs

| Dimension | Score | Evidence basis |
|-----------|-------|----------------|
| Implementation | 90% | All target files identified, patterns clear, design-system component available |
| Approach | 95% | Straightforward: adopt EmptyState component + apply xa-b classes |
| Impact | 70% | Visual consistency improvement; low user-facing impact since empty states are infrequent |
| Testability | 85% | Existing test infrastructure; visual changes verifiable via contrast sweep |

**Overall: 85%**

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | EmptyState component may not accept all needed className overrides | Low | Low | Component accepts `className` prop; fall back to wrapper div if needed |
| 2 | Cart meta text change could affect layout | Low | Low | `xa-pdp-meta` is `font-size: 0.82rem` vs current `text-xs` (0.75rem) — minimal size difference |

## Suggested Task Seeds

### TASK-01: Unify empty states across xa-b (IMPLEMENT)

Adopt the design-system `EmptyState` component (or a consistent inline pattern) across all 4 empty state locations. Apply xa-b achromatic styling: `rounded-sm`, `border-border-1`, uppercase heading with `xa-pdp-label` class, muted description, and consistent CTA (outline button or styled link).

**Affects:**
- `apps/xa-b/src/components/XaProductListing.client.tsx`
- `apps/xa-b/src/app/cart/page.tsx`
- `apps/xa-b/src/app/wishlist/page.tsx`
- `apps/xa-b/src/app/designers/page.tsx`

**Confidence:** 90%

### TASK-02: Align cart meta text with xa-pdp-meta class (IMPLEMENT)

Replace raw `text-xs text-muted-foreground` on cart item size/price meta text with `xa-pdp-meta text-muted-foreground` for consistency with XaBuyBox and PDP patterns.

**Affects:**
- `apps/xa-b/src/app/cart/page.tsx`

**Confidence:** 95%

## Execution Routing Packet

```yaml
Primary-Execution-Skill: lp-do-build
Supporting-Skills: frontend-design, tools-ui-contrast-sweep
Effort: S
Track: code
```

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Empty state locations (4 files) | Yes | None | No |
| Cart meta text drift | Yes | None | No |
| New In badge (Gap 3) | Yes | [Scope gap] Minor: Originally reported as missing but fully implemented — removed from scope | No |
| Department landing (Gap 2) | Yes | [Scope gap] Minor: Originally reported as text-only but has image cards — removed from scope | No |
| Design-system EmptyState component | Yes | None | No |
| Test landscape | Yes | None — no existing empty-state-specific tests; visual verification via contrast sweep sufficient | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** Scope reduced from 4 gaps to 2 after investigation revealed Gap 2 and Gap 3 were already resolved. Remaining work (empty state unification + cart meta alignment) is bounded to 4-5 files with clear patterns and available components. No architectural risk.

## Evidence Gap Review

### Gaps Addressed

- Verified all 4 originally reported gaps against actual codebase state
- Confirmed design-system `EmptyState` component exists and is suitable
- Mapped all empty state styling differences with specific class comparisons
- Confirmed `xa-pdp-meta` class exists and is appropriate for cart meta text

### Confidence Adjustments

- Overall confidence raised from initial estimate due to scope reduction (4 gaps → 2)
- Implementation confidence at 90% — straightforward component adoption

### Remaining Assumptions

- EmptyState component's default layout (`py-12 px-4`) is compatible with xa-b's spacing. Verified: matches cart/wishlist's existing `py-12` pattern.

## Planning Readiness

- **Status:** Ready-for-planning
- **Blocking items:** None
- **Next step:** `/lp-do-plan xa-b-design-polish --auto`
