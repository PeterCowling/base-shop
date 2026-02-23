# XA Storefronts — UI/UX Design Review
**Date:** 2026-02-22
**Scope:** `apps/xa`, `apps/xa-b`, `apps/xa-j` (all share the same component tree)
**Approach:** Design-system-first. All fixes use existing tokens from `xa-cyber-atelier.css` and `@acme/design-system` primitives. No new design tokens proposed — only correct use of existing ones.

---

## Summary

The XA storefronts have a coherent aesthetic direction — strictly achromatic, near-flat borders, tracked uppercase typography — that works for a luxury fashion positioning. The design foundation is sound. The issues fall into three tiers:

| Tier | Count | Nature |
|---|---|---|
| **Critical** | 5 | Functional bugs, broken dark mode, accessibility failures |
| **High** | 6 | UX friction that blocks or misleads users |
| **Polish** | 5 | Visual consistency and design system misuse |

---

## Tier 1 — Critical

### C-01: MegaMenu hardcoded `#ffffff` breaks dark mode

**File:** `apps/xa-b/src/components/XaMegaMenu.tsx`
**Problem:** `PopoverContent` has `style={{ backgroundColor: "#ffffff" }}` inline. This overrides the Tailwind `bg-surface` class and prevents dark mode from applying. The mega menu will always render white in dark mode — a jarring break.

**Fix:**
```tsx
// Remove the inline style entirely. bg-surface is sufficient.
// Before:
<PopoverContent style={{ backgroundColor: "#ffffff" }} className="bg-surface ...">

// After:
<PopoverContent className="bg-surface-1 border-border-1 ...">
```
`--surface-1` is `0 0% 100%` in light and `0 0% 10%` in dark — exactly the right token.

---

### C-02: Sort select announces raw key to screen readers

**File:** `apps/xa-b/src/components/XaProductListing.client.tsx`
**Problem:** `<SelectValue aria-label={sort}` passes the sort key (e.g. `"price-asc"`) as the label. Screen readers announce "price-asc" rather than "Price (low to high)".

**Fix:**
```tsx
const SORT_LABELS: Record<string, string> = {
  "newest":        "Newest",
  "price-asc":     "Price (low to high)",
  "price-desc":    "Price (high to low)",
  "best-sellers":  "Best sellers",
  "biggest-disc":  "Biggest discount",
};

// In the SelectTrigger:
<SelectValue aria-label={SORT_LABELS[sort] ?? sort} />
```

---

### C-03: Filter drawer locked open with no explanation

**File:** `apps/xa-b/src/components/XaFiltersDrawer.client.tsx`
**Problem:** When filters are applied, `filtersOpen` cannot be set to `false` — the drawer stays open but gives no visual feedback explaining why the close button doesn't work. Users are confused.

**Fix — add an explanatory badge and allow close:**
```tsx
// Replace the guard-close pattern with a close + persist model.
// The drawer closing should NOT clear filters — filters should persist regardless.
// Show a persistent chip strip OUTSIDE the drawer so applied filters are visible.

// In the trigger button, add a count badge when filters are applied:
<Button variant="ghost" onClick={() => setFiltersOpen(true)}>
  Filters
  {appliedCount > 0 && (
    <span className="ml-1.5 rounded-full bg-foreground px-1.5 py-0.5 text-[10px] text-primary-fg">
      {appliedCount}
    </span>
  )}
</Button>
```
The `XaFilterChip` strip (already implemented) is the right pattern — move it to always-visible above the product grid, not inside the drawer header.

---

### C-04: Image gallery lightbox is keyboard-inaccessible

**File:** `apps/xa-b/src/components/XaImageGallery.client.tsx`
**Problem:** Once the lightbox dialog opens, there are no prev/next controls inside it. Keyboard users are trapped — they can tab to close but can't navigate between images.

**Fix — add keyboard controls inside the dialog:**
```tsx
// Inside <DialogContent>, add prev/next IconButtons:
<DialogContent onKeyDown={(e) => {
  if (e.key === "ArrowLeft") prev();
  if (e.key === "ArrowRight") next();
}}>
  <IconButton
    aria-label="Previous image"
    onClick={prev}
    className="absolute start-3 top-1/2 -translate-y-1/2"
  />
  <XaFadeImage src={images[activeIndex].src} />
  <IconButton
    aria-label="Next image"
    onClick={next}
    className="absolute end-3 top-1/2 -translate-y-1/2"
  />
  <div className="mt-2 text-center text-xs text-muted-foreground">
    {activeIndex + 1} / {images.length}
  </div>
</DialogContent>
```

---

### C-05: Stale hardcoded delivery date

**File:** `apps/xa-b/src/components/XaBuyBox.client.tsx`
**Problem:** Delivery estimate reads `"Jan 5 - Jan 12"` — always stale. Even pre-launch this undermines trust.

**Fix — compute dynamically:**
```tsx
function getDeliveryWindow(daysMin = 5, daysMax = 12) {
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const now = new Date();
  const min = new Date(now); min.setDate(now.getDate() + daysMin);
  const max = new Date(now); max.setDate(now.getDate() + daysMax);
  return `${fmt(min)} – ${fmt(max)}`;
}

// In render:
<span className="xa-pdp-meta text-xs text-muted-foreground">
  Estimated delivery: {getDeliveryWindow()}
</span>
```

---

## Tier 2 — High Priority UX

### H-01: Product card `backdrop-blur` — remove it

**File:** `apps/xa-b/src/components/XaProductCard.tsx`
**Problem:** Every card has `backdrop-blur` + `bg-surface-2/60`. On a grid of 12 cards the GPU cost is significant. More importantly: the frosted glass texture fights the sharp, minimal aesthetic. The design intent is achromatic precision — blur introduces visual noise.

**Fix:**
```tsx
// Before:
<div className="xa-panel rounded-lg border border-border-1 bg-surface-2/60 p-4 shadow-elevation-1 backdrop-blur">

// After:
<div className="xa-panel rounded-sm border border-border-1 bg-surface-2 p-4 shadow-elevation-1">
```
Also change `rounded-lg` → `rounded-sm` (3px) for consistency with the near-flat design language. `rounded-lg` (8px) is too round for this aesthetic.

The `.xa-panel` CSS already sets `background-color: transparent` which creates a conflict with `bg-surface-2/60`. Removing the opacity modifier and the blur resolves both issues at once.

---

### H-02: No quantity selector in the buy box

**File:** `apps/xa-b/src/components/XaBuyBox.client.tsx`
**Problem:** Users can only add 1 unit at a time. For bags/jewelry — items someone might buy multiples of (gifts) — this is a friction point. The design system already includes `QuantityInput` from `@acme/design-system`.

**Fix — add QuantityInput above the CTA:**
```tsx
import { QuantityInput } from "@acme/design-system/molecules";

// In the buy panel, between size select and CTA:
<div className="flex items-center justify-between">
  <span className="xa-pdp-label">Quantity</span>
  <QuantityInput
    value={qty}
    min={1}
    max={product.stock ?? 99}
    onChange={setQty}
    className="rounded-none"  // match the sharp aesthetic
  />
</div>

// Update add-to-cart handler:
addToCart(product, size, qty);
```

---

### H-03: Mobile — hover image swap is inaccessible on touch

**File:** `apps/xa-b/src/components/XaProductCard.tsx`
**Problem:** The hover image swap (`group-hover:opacity-0` / `group-hover:opacity-100`) only works with pointer hover. On mobile, the secondary image is never visible. This is standard for luxury fashion (Net-a-Porter, Farfetch) but needs a touch fallback.

**Fix — show second image via touch with swipe detection:**
```tsx
"use client";

// Add touch state:
const [touched, setTouched] = useState(false);

<div
  className="relative aspect-square overflow-hidden rounded-sm bg-surface-3"
  onTouchStart={() => setTouched(true)}
  onTouchEnd={() => setTouched(false)}
>
  <XaFadeImage
    className={cn(
      "object-cover transition-opacity duration-300",
      touched ? "opacity-0" : "group-hover:opacity-0"
    )}
  />
  <XaFadeImage
    className={cn(
      "absolute inset-0 object-cover transition-opacity duration-300",
      touched ? "opacity-100" : "opacity-0 group-hover:opacity-100"
    )}
  />
</div>
```

---

### H-04: Empty state when filters return 0 products

**File:** `apps/xa-b/src/components/XaProductListing.client.tsx`
**Problem:** No empty state is defined. When `filteredProducts.length === 0`, the grid just renders nothing — no message, no affordance to clear filters.

**Fix — add a contextual empty state:**
```tsx
{filteredProducts.length === 0 ? (
  <div className="col-span-full flex flex-col items-center gap-4 py-16 text-center">
    <p className="text-sm text-muted-foreground">
      No items match your current filters.
    </p>
    <Button variant="outline" className="rounded-none text-xs uppercase tracking-widest" onClick={clearAllFilters}>
      Clear filters
    </Button>
  </div>
) : (
  <Grid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>
    {filteredProducts.map(p => <XaProductCard key={p.id} product={p} />)}
  </Grid>
)}
```

---

### H-05: Support dock — three exposed icons is cluttered

**File:** `apps/xa-b/src/components/XaSupportDock.client.tsx`
**Problem:** WhatsApp + Instagram + Email + FAQ = 4 icon buttons in the bottom-right corner. At small screen sizes they stack or crowd. The pattern of a single collapsed trigger that expands on click is cleaner and more intentional.

**Fix — wrap in a `<details>`-style toggle:**
```tsx
const [open, setOpen] = useState(false);

<div className="fixed bottom-6 end-6 z-50 flex flex-col items-end gap-2">
  {/* Expandable items — visible only when open */}
  <div className={cn(
    "flex flex-col items-end gap-2 transition-all duration-200",
    open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
  )}>
    <IconButton aria-label="WhatsApp" onClick={...} />
    <IconButton aria-label="Email" onClick={...} />
    <IconButton aria-label="FAQ" onClick={openFaq} />
  </div>
  {/* Primary trigger */}
  <IconButton
    aria-label={open ? "Close support" : "Get support"}
    aria-expanded={open}
    onClick={() => setOpen(!open)}
    className="h-12 w-12 rounded-full bg-foreground text-primary-fg shadow-elevation-3"
  >
    <MessageCircleIcon />
  </IconButton>
</div>
```

---

### H-06: Hero headline is generic

**File:** `apps/xa-b/src/app/page.tsx`
**Problem:** `"Member rewards for bags and carry goods"` is product-type copy, not brand copy. The hero headline is the highest-value real estate on the page and it currently describes the catalog category rather than positioning the brand.

**Fix — move catalog-generic copy to siteConfig and make the hero line a brand statement:**
```ts
// siteConfig.ts — add:
heroHeadline: "The finest carry goods. By invitation.",
heroSubheadline: "Exclusive access to curated bags and carry goods from established designers.",
```
```tsx
// page.tsx:
<h1 className="xa-hero-title">{siteConfig.heroHeadline}</h1>
<p className="xa-hero-copy text-muted-foreground">{siteConfig.heroSubheadline}</p>
```
Each variant (xa-c, xa-b, xa-j) should have its own headline configured via env var or siteConfig, not generated from the catalog label.

---

## Tier 3 — Polish

### P-01: Color swatch buttons missing `aria-pressed`

**File:** `apps/xa-b/src/components/XaFiltersDrawer.client.tsx`
**Problem:** Color filter buttons have no `aria-pressed` state, so screen readers cannot tell users which colors are currently selected.

**Fix:**
```tsx
<button
  type="button"
  aria-pressed={selectedColors.includes(color)}
  aria-label={`Filter by ${colorLabel}`}
  onClick={() => toggleColor(color)}
>
  <span className="h-4 w-4 rounded-full border border-border-2" style={{ background: colorHex }} aria-hidden />
  <span className="text-xs">{colorLabel}</span>
</button>
```

---

### P-02: `details/summary` filter sections — replace with Radix Accordion

**File:** `apps/xa-b/src/components/XaFiltersDrawer.client.tsx`
**Problem:** Native `<details>/<summary>` has inconsistent screen reader announcements and no animation. The design system likely includes an `Accordion` or the `Drawer` already uses Radix primitives.

**Fix — use a simple controlled disclosure:**
```tsx
// Each filter section:
<div>
  <button
    type="button"
    aria-expanded={expanded}
    aria-controls={`filter-section-${id}`}
    className="flex w-full items-center justify-between py-3 text-xs uppercase tracking-widest"
    onClick={() => setExpanded(!expanded)}
  >
    {label}
    <ChevronDownIcon className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
  </button>
  <div id={`filter-section-${id}`} hidden={!expanded} className="pb-4">
    {children}
  </div>
</div>
```

---

### P-03: Card `rounded-lg` vs site-wide near-flat aesthetic

Already covered in H-01. Calling it out separately as a standalone polish issue: `rounded-md` (4px) on the image div inside the card also conflicts — both image and card should use `rounded-sm` (2px) to match the 1-4px radius language of the design system tokens.

---

### P-04: Hardcoded returns/nav strings not in siteConfig

**Files:** `XaBuyBox.client.tsx`, `XaShell.tsx`
**Problem:** "Free returns for 30 days | We can collect from your home" and "New In", "Sale", "Brands" are hardcoded strings with no siteConfig backing and no `// i18n-exempt` annotation.

**Fix — add to siteConfig or extract to a constants module:**
```ts
// siteConfig.ts:
returnsPolicy: "Free returns for 30 days",
returnsMethod: "We can collect from your home",

// Secondary nav labels — already i18n-exempt via XA-0001, but at least use a constant:
export const NAV_LABELS = {
  newIn: "New In",
  sale: "Sale",
  brands: "Brands",
} as const;
```

---

### P-05: `XaFadeImage` in PDP gallery — missing `sizes` prop

**File:** `apps/xa-b/src/components/XaImageGallery.client.tsx`
**Problem:** `<Image>` in the gallery uses `fill` without a meaningful `sizes` attribute. Next.js will download a 100vw image even though the gallery occupies roughly 55% of viewport width on desktop.

**Fix:**
```tsx
<XaFadeImage
  src={image.src}
  alt={image.alt}
  fill
  sizes="(max-width: 768px) 100vw, 55vw"
  className="object-contain"
/>
```

---

## Appendix: Token Reference

All fixes above use only existing tokens. Quick reference:

| Token class | Value |
|---|---|
| `bg-surface-1` | `hsl(var(--surface-1))` — page background |
| `bg-surface-2` | `hsl(var(--surface-2))` — card background |
| `bg-surface-3` | `hsl(var(--surface-3))` — image placeholder |
| `bg-muted` | `hsl(var(--color-muted))` — hover/disabled bg |
| `text-muted-foreground` | `hsl(var(--color-fg-muted))` — secondary text |
| `bg-foreground` | `hsl(var(--color-fg))` — primary CTA background |
| `text-primary-fg` | `hsl(var(--color-primary-fg))` — white text on foreground |
| `border-border-1` | `hsl(var(--border-1))` — subtle border |
| `border-border-2` | `hsl(var(--border-2))` — medium border |
| `rounded-sm` | `2px` — correct card/image radius |
| `rounded-none` | `0px` — inputs, CTAs |
| `shadow-elevation-1` | very subtle lift |
| `shadow-elevation-3` | floating element (support dock trigger) |
