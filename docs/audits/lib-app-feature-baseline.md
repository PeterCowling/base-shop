Type: Audit
Status: Reference

# AUDIT-04: Application Feature Baseline Audit

**Audit ID:** AUDIT-04
**Date:** 2026-01-21
**Scope:** Phase 6 apps identified for lib-primitives-enhancement-plan
**Status:** Reference

---

## Executive Summary

This audit documents the current feature baseline for eight applications identified in the lib-primitives-enhancement-plan Phase 6. Each app has been examined for specific computational patterns, utility functions, and domain logic that may benefit from shared library extraction or enhancement.

---

## 1. Product Pipeline

**Location:** `apps/product-pipeline/`

### 1.1 lcg() and hashSeed() Usage

The Product Pipeline app implements its own Linear Congruential Generator (LCG) and hash seed functions for deterministic pseudo-random number generation in 3D visualizations.

**File:** `apps/product-pipeline/src/app/mission-control/panels/pipelineMapConfig.ts`

```typescript
export function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
```

**Algorithm Details:**
- `hashSeed()`: Implements FNV-1a hash algorithm (32-bit variant)
  - Initial hash: 2166136261 (FNV offset basis)
  - Multiplier: 16777619 (FNV prime)
  - Returns unsigned 32-bit integer via `>>> 0`

- `lcg()`: Classic Linear Congruential Generator
  - Multiplier: 1664525
  - Increment: 1013904223
  - These are the Numerical Recipes constants
  - Returns normalized float in [0, 1)

**Usage in PipelineMap3D.tsx:**
```typescript
// Line 99: 3D swarm token generation
const rand = lcg(hashSeed(`3d:${stage}:${count}`));
```

**Usage in PipelineMap2D.tsx:**
```typescript
// Line 101: 2D node positioning
const rand = lcg(hashSeed(`${node.stage}:${count}`));
```

**Dependencies:**
- Used by `PipelineMap3D.tsx` for deterministic 3D swarm particle positioning
- Used by `PipelineMap2D.tsx` for deterministic 2D node scatter
- Supporting function: `tokenCountForStage()` determines particle count based on count value

### 1.2 Enhancement Opportunities

| Function | Current State | Recommendation |
|----------|--------------|----------------|
| `hashSeed()` | App-local implementation | Extract to `@acme/lib-primitives/hash` |
| `lcg()` | App-local implementation | Extract to `@acme/lib-primitives/random` |
| `tokenCountForStage()` | Domain-specific | Keep in app |

---

## 2. Reception

**Location:** `apps/reception/`

### 2.1 roundDownTo50Cents() Implementation

**File:** `apps/reception/src/utils/moneyUtils.ts`

```typescript
export function roundDownTo50Cents(value: number): number {
  return Math.floor(value * 2) / 2;
}
```

**Algorithm:** Rounds down to nearest 0.50 increment
- Multiply by 2, floor, divide by 2
- Example: 10.99 -> 10.5, 10.25 -> 10.0

**Usage Locations:**
1. `apps/reception/src/components/man/modals/ExtensionPayModal.tsx`
   - Line 57: `const pricePerGuest = roundDownTo50Cents(nightlyRate * nights);`
   - Line 179: `roundDownTo50Cents(pricePerGuest * occupantCount)`

2. `apps/reception/src/components/man/Extension.tsx`
   - Line 376: Display formatting for nightly rates

### 2.2 Analytics State

**Current Implementation:** Menu performance analytics dashboard

**File:** `apps/reception/src/components/analytics/MenuPerformanceDashboard.tsx`

**Key Features:**
- Margin calculation by category using static `MARGIN_RATIOS` lookup
- Hourly profit contribution tracking
- Attach rate calculation (add-on items vs base items)
- Chart.js integration (Bar, Doughnut, Line charts)

**Margin Calculation Pattern:**
```typescript
const MARGIN_RATIOS: Partial<Record<string, number>> = {
  Coffee: 0.7,
  Tea: 0.7,
  Beer: 0.6,
  Wine: 0.5,
  // ... etc
};

const marginRatio = MARGIN_RATIOS[category] ?? 0.6;
const profit = revenue * marginRatio;
```

**Analytics Metrics Computed:**
1. Category margin percentages
2. Total margin percentage
3. Hourly profit contribution array (24 hours)
4. Base item count
5. Attach/add-on count
6. Attach rate percentage

### 2.3 Enhancement Opportunities

| Function | Current State | Recommendation |
|----------|--------------|----------------|
| `roundDownTo50Cents()` | App-local utility | Extract to `@acme/lib-primitives/financial` |
| Margin calculation | Inline in component | Consider extracting to shared analytics utilities |

---

## 3. Prime

**Location:** `apps/prime/`

### 3.1 Readiness Score Calculation

**File:** `apps/prime/src/lib/preArrival/readinessScore.ts`

```typescript
export function computeReadinessScore(checklist: ChecklistProgress): number {
  return Object.entries(checklist).reduce((score, [key, completed]) => {
    const weight = CHECKLIST_WEIGHTS[key as keyof ChecklistProgress] ?? 0;
    return score + (completed ? weight : 0);
  }, 0);
}
```

**Score Computation:**
- Weighted sum of completed checklist items
- Score range: 0-100
- Pure function (compute on read, never stored)
- Weights defined in `CHECKLIST_WEIGHTS` constant from types

**Checklist Items:**
1. `routePlanned` - Know how to get there
2. `etaConfirmed` - Tell hostel when arriving
3. `cashPrepared` - Have cash ready
4. `rulesReviewed` - Know the house rules
5. `locationSaved` - Have directions saved

**Readiness Levels:**
```typescript
export function getReadinessLevel(score: number): ReadinessLevel {
  if (score === 0) return 'not-started';
  if (score < 50) return 'in-progress';
  if (score < 100) return 'almost-ready';
  return 'ready';
}
```

### 3.2 Quest Tracking System

**File:** `apps/prime/src/lib/quests/computeQuestState.ts`

**Architecture:** Pure functional quest engine with no async operations

**Key Types:**
```typescript
interface QuestState {
  currentTier: string;
  activeTier: string | null;
  tierProgress: Record<string, TierProgress>;
  completedTiers: string[];
  availableTiers: string[];
  nextAction: NextAction;
  totalXp: number;
  badges: string[];
  hoursElapsed: number;
  allComplete: boolean;
}
```

**Tier Configuration:** `apps/prime/src/config/quests/questTiers.ts`

| Tier ID | Name | Required Tasks | XP | Badge |
|---------|------|---------------|-----|-------|
| `settle-in` | Basic orientation | welcome, featuresIntro, mainDoorAccess | 50 | early-bird |
| `social-night` | Evening social | complimentaryEveningDrink, activityJoined | 100 | social-butterfly |
| `positano-explorer` | Local exploration | guidebookVisited, localSpotVisited | 150 | explorer |

**Unlock Conditions:**
- `settle-in`: No prerequisites
- `social-night`: Requires `settle-in` completion
- `positano-explorer`: Requires `settle-in` + 24 hours after check-in

**Core Functions:**
1. `computeQuestState()` - Main state computation
2. `computeTierProgress()` - Per-tier progress calculation
3. `computeNextAction()` - Determines next user action
4. `isTierUnlocked()` - Checks unlock conditions
5. `getBadgesFromTiers()` - Derives badges from completed tiers
6. `getXpFromTiers()` - Calculates total XP

### 3.3 Enhancement Opportunities

| Function | Current State | Recommendation |
|----------|--------------|----------------|
| Weighted score calculation | Domain-specific | Could extract generic `computeWeightedScore()` |
| Tier unlock logic | Well-structured | Keep in app (domain-specific) |
| Hours elapsed calculation | Generic date math | Consider extraction |

---

## 4. Dashboard

**Location:** `apps/dashboard/`

### 4.1 Deployment Metrics Status

**Current State:** Placeholder implementation

**File:** `apps/dashboard/src/pages/shops/[id].tsx`

```typescript
{activeTab === "metrics" && (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-700">
    Metrics coming soon.
  </div>
)}
```

**Existing Features:**
1. Shop metadata display (name, region, status, last upgrade)
2. Diff tab - Uses existing Upgrade experience
3. History tab - Shows upgrade history with retry capability
4. Metrics tab - Placeholder only

**Shop Status Types:**
- `ready` - Needs review
- `failed` - Failed upgrade
- `up_to_date` - Current
- `unknown` - Status not determined

### 4.2 Enhancement Opportunities

| Feature | Current State | Recommendation |
|---------|--------------|----------------|
| Metrics tab | Placeholder | Implement with telemetry data |
| Status computation | Client-side | Consider server-side derivation |

---

## 5. Handbag Configurator

**Location:** `apps/handbag-configurator/`

### 5.1 Hotspot Visibility System

**File:** `apps/handbag-configurator/src/viewer/hotspots/useHotspotVisibility.ts`

**Algorithm:** 3D hotspot visibility and occlusion computation

**Key Constants:**
```typescript
const VIEW_CONE_DOT = 0.2;        // Minimum dot product for view cone
const OCCLUSION_EPSILON = 0.02;   // Tolerance for occlusion check
const SCREEN_MARGIN = 0.12;       // Screen edge margin
const MIN_HOTSPOT_DISTANCE_PX = 52; // Minimum pixel spacing
```

**Region Priority Order:**
1. body
2. hardware
3. handle
4. lining
5. personalization

**Visibility Algorithm (`computeVisibleHotspots`):**
1. Filter by configurable regions from schema
2. Check view cone (dot product > 0.2)
3. Project to screen space, check bounds
4. Raycast occlusion check against all meshes
5. Calculate screen position
6. Sort by priority, center bias, distance
7. Filter overlapping hotspots by minimum pixel distance
8. Limit to max visible (default: 8)

**Types:**
```typescript
type HotspotRegionId = "body" | "handle" | "hardware" | "lining" | "personalization";

type VisibleHotspot = {
  hotspotId: string;
  regionId: HotspotRegionId;
  label: string;
  screenX: number;
  screenY: number;
  focusPoint: THREE.Vector3;
  distanceToCamera: number;
};
```

### 5.2 Hotspot Utilities

**File:** `apps/handbag-configurator/src/app/api/products/[productId]/hotspots/hotspotUtils.ts`

**Sanitization Function:**
```typescript
export const sanitizeHotspots = (value: unknown): SanitizedHotspot[] | null => {
  // Validates and sanitizes hotspot data from API
  // Ensures safe segment pattern: /^[a-zA-Z0-9._-]+$/
}
```

### 5.3 Enhancement Opportunities

| Function | Current State | Recommendation |
|----------|--------------|----------------|
| View cone check | Inline calculation | Could extract to `@acme/lib-primitives/geometry` |
| Screen projection | Three.js standard | Keep as-is |
| Raycasting | Three.js standard | Keep as-is |

---

## 6. Brikette

**Location:** `apps/brikette/`

### 6.1 Booking Patterns

**File:** `apps/brikette/src/context/modal/global-modals/BookingModal.tsx`

**Booking Flow:**
1. Modal receives deal ID from context (optional)
2. Constructs booking URL with parameters:
   - `checkin` / `checkout` (formatted dates)
   - `codice` (booking code constant)
   - `pax` (guest count)
   - Optional: `deal`, UTM parameters for tracking

**URL Construction:**
```typescript
const buildBookingHref = useCallback(({ checkIn, checkOut, guests }: BookingModalBuildParams): string => {
  const params = new URLSearchParams({
    checkin: formatDate(checkIn),
    checkout: formatDate(checkOut),
    codice: BOOKING_CODE,
    pax: String(guests),
  });

  if (dealId) {
    params.set("deal", dealId);
    params.set("utm_source", "site");
    params.set("utm_medium", "deal");
    params.set("utm_campaign", dealId);
  }

  return `https://book.octorate.com/octobook/site/reservation/result.xhtml?${params}`;
}, [dealId]);
```

**Guest Options:** 1-8 guests with singular/plural localization

### 6.2 Guide System

**File:** `apps/brikette/src/routes/guides/guide-manifest.ts`

**Guide Manifest Structure:**
- 3245+ lines of manifest entries
- Status values: `draft`, `review`, `live`
- Areas: `howToGetHere`, `help`, `experience`
- Checklist items: translations, jsonLd, faqs, content, media

**Note:** No explicit "guide rotation" logic found. Guides are statically defined in the manifest with manual status management. Featured guides appear to be editorially selected rather than algorithmically rotated.

### 6.3 Enhancement Opportunities

| Feature | Current State | Recommendation |
|---------|--------------|----------------|
| Date formatting | App-local `formatDate` | Could use shared date utilities |
| URL building | Inline URLSearchParams | Keep as-is (simple enough) |
| Guide selection | Manual/editorial | Consider adding rotation logic if needed |

---

## 7. CochlearFit

**Location:** `apps/cochlearfit/`

### 7.1 Pricing Implementation

**File:** `apps/cochlearfit/src/lib/pricing.ts`

```typescript
export function formatPrice(
  amount: number,
  currency: CurrencyCode,
  locale: string
): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  });
  return formatter.format(amount / 100); // Cents to dollars
}
```

**Key Detail:** Prices stored in cents (minor units), divided by 100 for display

### 7.2 Product Pricing Structure

**File:** `apps/cochlearfit/src/data/products.ts`

**Variant Builder Pattern:**
```typescript
const buildVariants = (
  prefix: string,
  priceBySize: Record<ProductSize, number>
): ProductVariant[] => {
  return SIZES.flatMap((size) =>
    COLORS.map((color) => ({
      id: `${prefix}-${size.key}-${color.key}`,
      size: size.key,
      color: color.key,
      price: priceBySize[size.key],
      currency: "USD",
      stripePriceId: `price_${prefix}_${size.key}_${color.key}`,
      inStock: true,
    }))
  );
};
```

**Product Pricing (in cents):**

| Product | Kids | Adult |
|---------|------|-------|
| Classic | 3400 ($34) | 3800 ($38) |
| Sport | 3600 ($36) | 4000 ($40) |

**Colors:** sand, ocean, berry
**Sizes:** kids, adult

### 7.3 Discount Logic

**Current State:** No explicit discount logic implemented in the codebase.

Policy documentation mentions:
- Bundle pricing may be offered
- Refunds calculated based on discounted effective value

### 7.4 Enhancement Opportunities

| Function | Current State | Recommendation |
|----------|--------------|----------------|
| `formatPrice()` | App-local | Extract to `@acme/lib-primitives/financial` |
| Variant generation | Product-specific | Keep in app |

---

## 8. XA

**Location:** `apps/xa/`

### 8.1 Pricing Logic

**File:** `apps/xa/src/lib/catalog.ts`

```typescript
export function estimateCompareAt(price: number | undefined): number | null {
  if (typeof price !== "number" || !Number.isFinite(price)) return null;
  return Math.round(price * 1.3); // 30% markup estimate
}
```

### 8.2 Discount Calculation

**File:** `apps/xa/src/lib/xaListingUtils.ts`

```typescript
case "biggest-discount":
  return copy.sort((a, b) => {
    const discountA =
      typeof a.compareAtPrice === "number" && a.compareAtPrice > a.price
        ? (a.compareAtPrice - a.price) / a.compareAtPrice
        : 0;
    const discountB =
      typeof b.compareAtPrice === "number" && b.compareAtPrice > b.price
        ? (b.compareAtPrice - b.price) / b.compareAtPrice
        : 0;
    return discountB - discountA;
  });
```

**Discount Percentage Formula:**
```
discount = (compareAtPrice - price) / compareAtPrice
```

**Product Card Display:**
```typescript
// apps/xa/src/components/XaProductCard.tsx
const hasDiscount =
  typeof product.compareAtPrice === "number" &&
  product.compareAtPrice > product.price;
const discountPct = hasDiscount
  ? Math.round(100 - (product.price / product.compareAtPrice!) * 100)
  : 0;
const saving = hasDiscount ? product.compareAtPrice! - product.price : 0;
```

### 8.3 Sort Options

| Sort Key | Description |
|----------|-------------|
| `price-asc` | Price low to high |
| `price-desc` | Price high to low |
| `newest` | By creation date |
| `biggest-discount` | Highest discount percentage first |
| `best-sellers` | By popularity (default) |

### 8.4 Price Filtering

**File:** `apps/xa/src/lib/useXaListingFilters.ts`

Query parameters:
- `price[min]` - Minimum price filter
- `price[max]` - Maximum price filter

```typescript
if (typeof min === "number" && product.price < min) return false;
if (typeof max === "number" && product.price > max) return false;
```

### 8.5 Enhancement Opportunities

| Function | Current State | Recommendation |
|----------|--------------|----------------|
| Discount calculation | Multiple inline implementations | Extract to `@acme/lib-primitives/financial` |
| `estimateCompareAt()` | App-local | Consider shared utility |
| Price sorting | Generic pattern | Could be shared utility |

---

## Summary of Extraction Candidates

### High Priority (Multiple Apps)

| Function | Apps Using | Proposed Location |
|----------|-----------|------------------|
| `formatPrice()` | CochlearFit, XA | `@acme/lib-primitives/financial` |
| Discount percentage | XA | `@acme/lib-primitives/financial` |
| `roundDownTo50Cents()` | Reception | `@acme/lib-primitives/financial` |

### Medium Priority (Reusable Patterns)

| Function | App | Proposed Location |
|----------|-----|------------------|
| `hashSeed()` (FNV-1a) | Product Pipeline | `@acme/lib-primitives/hash` |
| `lcg()` (PRNG) | Product Pipeline | `@acme/lib-primitives/random` |
| View cone calculation | Handbag Configurator | `@acme/lib-primitives/geometry` |

### Keep App-Local (Domain-Specific)

| Function | App | Reason |
|----------|-----|--------|
| Quest tier logic | Prime | Domain-specific game mechanics |
| Hotspot regions | Handbag Configurator | Product-specific UI |
| Guide manifest | Brikette | Content management specific |
| Variant builder | CochlearFit | Product catalog specific |

---

## Recommendations

1. **Create `@acme/lib-primitives/financial`** module with:
   - `formatPrice(amount, currency, locale)` - Intl.NumberFormat wrapper
   - `calculateDiscount(price, compareAtPrice)` - Returns percentage
   - `roundToIncrement(value, increment)` - Generic rounding
   - `centsToMajor(cents)` - Convert minor to major currency units

2. **Create `@acme/lib-primitives/random`** module with:
   - `hashSeed(input)` - FNV-1a hash for seeding
   - `lcg(seed)` - Linear Congruential Generator
   - `mulberry32(seed)` - Alternative 32-bit PRNG

3. **Extend `@acme/lib-primitives/geometry`** with:
   - `isInViewCone(position, camera, threshold)` - View frustum check
   - `projectToScreen(position3D, camera, viewport)` - 3D to 2D projection

4. **Dashboard Metrics:** Implement actual telemetry integration when data source is available.

---

*Audit completed: 2026-01-21*
